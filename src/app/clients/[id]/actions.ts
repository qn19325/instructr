'use server';

import { getChecklistItem } from '@/db/clients';
import { revalidatePath } from 'next/cache';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { r2 } from '@/lib/r2';
import { randomUUID } from 'crypto';
import { getCurrentPracticeId } from '@/lib/auth';
import { deletePendingDelete, getDocument } from '@/db/documents';
import { recordDocumentUpload } from '@/db/clients';
import { ALLOWED_TYPES, MAX_FILE_SIZE } from '@/lib/documents';

export async function getUploadUrl(checklistItemId: string, mimeType: string, size: number) {
  const practiceId = await getCurrentPracticeId();
  const item = await getChecklistItem(checklistItemId, practiceId);
  if (!item) throw new Error('Unauthorised');

  if (!ALLOWED_TYPES.includes(mimeType as (typeof ALLOWED_TYPES)[number])) {
    throw new Error('The file type is not allowed');
  }

  if (size > MAX_FILE_SIZE) {
    throw new Error('The file size is too large');
  }

  const r2Key = randomUUID();
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: r2Key,
    ContentType: mimeType,
    ContentLength: size,
  });
  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 900 });
  return { uploadUrl, r2Key };
}

export async function recordUpload(
  checklistItemId: string,
  r2Key: string,
  originalFileName: string,
  mimeType: string,
  size: number,
) {
  const practiceId = await getCurrentPracticeId();
  const item = await getChecklistItem(checklistItemId, practiceId);
  if (!item) throw new Error('Unauthorised');

  const { oldR2Key } = await recordDocumentUpload({
    practiceId,
    checklistItemId,
    r2Key,
    originalFileName,
    mimeType,
    size,
  });

  if (oldR2Key) {
    try {
      await r2.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: oldR2Key }));
      await deletePendingDelete(oldR2Key);
    } catch (e) {
      console.error('Immediate R2 delete failed — will be retried by cleanup job:', e);
    }
  }

  revalidatePath('/clients', 'layout');
}

export async function getDownloadUrl(documentId: string) {
  const document = await getDocument(documentId);
  const practiceId = await getCurrentPracticeId();

  if (!document) {
    throw new Error('Document not found');
  }

  if (document.practiceId !== practiceId) {
    throw new Error('Unauthorised');
  }

  const getCommand = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: document.r2Key,
  });

  const url = await getSignedUrl(r2, getCommand, { expiresIn: 3600 });
  return url;
}
