import { and, eq } from 'drizzle-orm';

import { document, r2PendingDelete } from '@/db/schema';
import { db } from '@/infra/db';
import type { DocumentMetaData } from '@/types/documents';

import type { DbOrTx } from './index';

export type DocumentRow = { id: string; r2Key: string };
export type PendingDelete = { r2Key: string };

export async function getDocumentById(
  practiceId: string,
  documentId: string,
  conn: DbOrTx = db,
): Promise<DocumentRow | undefined> {
  const row = await conn.query.document.findFirst({
    where: (table, { eq, and }) => and(eq(table.practiceId, practiceId), eq(table.id, documentId)),
  });
  return row ? { id: row.id, r2Key: row.r2Key } : undefined;
}

export async function getDocumentByChecklistItem(
  practiceId: string,
  checklistItemId: string,
  conn: DbOrTx = db,
): Promise<DocumentRow | undefined> {
  const row = await conn.query.document.findFirst({
    where: (table, { eq, and }) =>
      and(eq(table.practiceId, practiceId), eq(table.checklistItemId, checklistItemId)),
  });
  return row ? { id: row.id, r2Key: row.r2Key } : undefined;
}

export async function insertDocument(
  practiceId: string,
  input: { checklistItemId: string; r2Key: string; meta: DocumentMetaData },
  conn: DbOrTx = db,
): Promise<void> {
  await conn.insert(document).values({
    practiceId,
    checklistItemId: input.checklistItemId,
    r2Key: input.r2Key,
    originalFileName: input.meta.originalFileName,
    mimeType: input.meta.mimeType,
    size: input.meta.size,
  });
}

export async function deleteDocument(
  practiceId: string,
  documentId: string,
  conn: DbOrTx = db,
): Promise<void> {
  await conn
    .delete(document)
    .where(and(eq(document.practiceId, practiceId), eq(document.id, documentId)));
}

export async function enqueuePendingDelete(
  practiceId: string,
  r2Key: string,
  conn: DbOrTx = db,
): Promise<void> {
  await conn.insert(r2PendingDelete).values({ practiceId, r2Key });
}

// No practiceId filter — this is a global cron operation that processes all practices.
export async function getPendingDeletes(conn: DbOrTx = db): Promise<PendingDelete[]> {
  const rows = await conn.select({ r2Key: r2PendingDelete.r2Key }).from(r2PendingDelete);
  return rows;
}

export async function deletePendingDelete(r2Key: string, conn: DbOrTx = db): Promise<void> {
  await conn.delete(r2PendingDelete).where(eq(r2PendingDelete.r2Key, r2Key));
}
