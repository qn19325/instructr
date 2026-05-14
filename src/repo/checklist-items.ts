import { and, eq } from 'drizzle-orm';

import { checklistItem } from '@/db/schema';
import { db } from '@/infra/db';
import type { DocumentType } from '@/types/documents';

import type { DbOrTx } from './index';

export type ChecklistItemOwnership = { id: string; clientId: string };

export async function getChecklistItemOwnership(
  practiceId: string,
  id: string,
  conn: DbOrTx = db,
): Promise<ChecklistItemOwnership | undefined> {
  const item = await conn.query.checklistItem.findFirst({
    where: (table, { eq, and }) => and(eq(table.id, id), eq(table.practiceId, practiceId)),
    with: { taxReturn: { columns: { clientId: true } } },
  });
  if (!item) return undefined;
  return { id: item.id, clientId: item.taxReturn.clientId };
}

export async function insertChecklistItems(
  practiceId: string,
  taxReturnId: string,
  items: { documentType: DocumentType; label: string }[],
  conn: DbOrTx = db,
): Promise<void> {
  await conn.insert(checklistItem).values(
    items.map((item) => ({
      practiceId,
      taxReturnId,
      documentType: item.documentType,
      label: item.label,
      done: false,
    })),
  );
}

export async function updateChecklistItemDone(
  practiceId: string,
  id: string,
  done: boolean,
  conn: DbOrTx = db,
): Promise<void> {
  const res = await conn
    .update(checklistItem)
    .set({ done })
    .where(and(eq(checklistItem.practiceId, practiceId), eq(checklistItem.id, id)))
    .returning({ id: checklistItem.id });

  if (!res.length) {
    throw new Error('Could not update item');
  }
}
