import { randomUUID } from 'crypto';

import type { Db } from '@/infra/db';
import { deleteObject, getDownloadUrl, getUploadUrl } from '@/infra/r2';
import { validateDocument } from '@/logic/document-validation';
import { withTransaction } from '@/repo';
import * as docRepo from '@/repo/documents';
import * as clientService from '@/service/clients';
import type { DocumentMetaData, FileMetaData } from '@/types/documents';

// Abandoned presigned URLs (browser crash after prepareUpload, before completeUpload)
// leave orphaned R2 objects. Accepted for Phase 1 — single user, cosmetic cost.
export async function prepareUpload(
  db: Db,
  practiceId: string,
  checklistItemId: string,
  fileMetaData: FileMetaData,
): Promise<{ uploadUrl: string; documentKey: string }> {
  await clientService.assertChecklistItemOwned(db, practiceId, checklistItemId);

  const isDocumentValid = validateDocument(fileMetaData);
  if (!isDocumentValid.valid) {
    throw new Error(isDocumentValid.error);
  }

  const documentKey = randomUUID();
  const uploadUrl = await getUploadUrl(documentKey, fileMetaData.mimeType, fileMetaData.size);
  return { uploadUrl, documentKey };
}

export async function completeUpload(
  db: Db,
  practiceId: string,
  checklistItemId: string,
  documentKey: string,
  fileMetaData: DocumentMetaData,
): Promise<void> {
  await clientService.assertChecklistItemOwned(db, practiceId, checklistItemId);

  const { oldR2Key } = await withTransaction(db, async (tx) => {
    const existing = await docRepo.getDocumentByChecklistItem(practiceId, checklistItemId, tx);
    if (existing) {
      await docRepo.deleteDocument(practiceId, existing.id, tx);
      await docRepo.enqueuePendingDelete(practiceId, existing.r2Key, tx);
    }
    await docRepo.insertDocument(
      practiceId,
      { checklistItemId, r2Key: documentKey, meta: fileMetaData },
      tx,
    );
    return { oldR2Key: existing?.r2Key ?? null };
  });

  if (oldR2Key) {
    try {
      await deleteObject(oldR2Key);
      await docRepo.deletePendingDelete(oldR2Key, db);
    } catch (e) {
      console.error('Immediate R2 delete failed — will be retried by cleanup job:', e);
    }
  }
}

export async function removeDocument(
  db: Db,
  practiceId: string,
  checklistItemId: string,
): Promise<void> {
  await clientService.assertChecklistItemOwned(db, practiceId, checklistItemId);

  const existing = await docRepo.getDocumentByChecklistItem(practiceId, checklistItemId, db);
  if (!existing) throw new Error('No document found');

  await withTransaction(db, async (tx) => {
    await docRepo.deleteDocument(practiceId, existing.id, tx);
    await docRepo.enqueuePendingDelete(practiceId, existing.r2Key, tx);
  });

  try {
    await deleteObject(existing.r2Key);
    await docRepo.deletePendingDelete(existing.r2Key, db);
  } catch (e) {
    console.error('Immediate R2 delete failed — will be retried by cleanup job:', e);
  }
}

export async function getDocumentDownloadUrl(
  db: Db,
  practiceId: string,
  documentId: string,
): Promise<string> {
  const doc = await docRepo.getDocumentById(practiceId, documentId, db);
  if (!doc) throw new Error('Document not found');
  return getDownloadUrl(doc.r2Key);
}

export async function drainPendingDeletes(db: Db): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const pending = await docRepo.getPendingDeletes(db);
  const results = await Promise.allSettled(
    pending.map(async (entry) => {
      await deleteObject(entry.r2Key);
      await docRepo.deletePendingDelete(entry.r2Key, db);
      return entry.r2Key;
    }),
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  if (failed > 0) {
    results.forEach((r) => {
      if (r.status === 'rejected') console.error('R2 cleanup failed:', r.reason);
    });
  }

  return { processed: results.length, succeeded, failed };
}
