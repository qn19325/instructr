import { db } from './index';
import { document, r2PendingDelete } from './schema';
import { eq } from 'drizzle-orm';

export interface InsertDocumentInput {
  practiceId: string;
  checklistItemId: string;
  r2Key: string;
  originalFileName: string;
  mimeType: string;
  size: number;
}

export async function insertDocument(input: InsertDocumentInput): Promise<void> {
  await db.insert(document).values({
    practiceId: input.practiceId,
    checklistItemId: input.checklistItemId,
    r2Key: input.r2Key,
    originalFileName: input.originalFileName,
    mimeType: input.mimeType,
    size: input.size,
  });
}

export async function getDocument(
  documentId: string,
): Promise<typeof document.$inferSelect | undefined> {
  return await db.query.document.findFirst({
    where: (table, { eq }) => eq(table.id, documentId),
  });
}

// No practiceId filter — this is a global cron operation that processes all practices.
export async function getPendingDeletes(): Promise<(typeof r2PendingDelete.$inferSelect)[]> {
  return await db.select().from(r2PendingDelete);
}

export async function deletePendingDelete(r2Key: string): Promise<void> {
  await db.delete(r2PendingDelete).where(eq(r2PendingDelete.r2Key, r2Key));
}
