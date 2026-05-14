import { and, eq } from 'drizzle-orm';

import { client } from '@/db/schema';
import type { CreateClientInput, UpdateClientInput, UpdateNotesInput } from '@/schemas/clients';

import type { DbOrTx } from './index';

const clientWith = {
  taxReturns: {
    with: {
      mtdSubmissions: true,
      checklistItems: { with: { document: true } },
    },
  },
} as const;

export async function getClients(practiceId: string, conn: DbOrTx) {
  return conn.query.client.findMany({
    where: (table, { eq }) => eq(table.practiceId, practiceId),
    with: clientWith,
  });
}

export async function getClientById(practiceId: string, id: string, conn: DbOrTx) {
  const row = await conn.query.client.findFirst({
    where: (table, { eq, and }) => and(eq(table.id, id), eq(table.practiceId, practiceId)),
    with: clientWith,
  });
  return row ?? null;
}

export async function insertClient(
  practiceId: string,
  input: CreateClientInput,
  conn: DbOrTx,
): Promise<{ id: string }> {
  const [row] = await conn
    .insert(client)
    .values({
      practiceId,
      firstName: input.firstName,
      lastName: input.lastName,
      niNumber: input.niNumber,
      email: input.email,
      phoneNumber: input.phoneNumber,
    })
    .returning({ id: client.id });
  return row;
}

export async function updateClient(
  practiceId: string,
  input: UpdateClientInput,
  conn: DbOrTx,
): Promise<void> {
  const result = await conn
    .update(client)
    .set({
      firstName: input.firstName,
      lastName: input.lastName,
      niNumber: input.niNumber,
      email: input.email,
      phoneNumber: input.phoneNumber,
    })
    .where(and(eq(client.id, input.clientId), eq(client.practiceId, practiceId)))
    .returning({ id: client.id });

  if (result.length === 0) {
    throw new Error(`Client ${input.clientId} not found`);
  }
}

export async function updateClientNotes(
  practiceId: string,
  input: UpdateNotesInput,
  conn: DbOrTx,
): Promise<void> {
  const result = await conn
    .update(client)
    .set({ notes: input.notes ?? null })
    .where(and(eq(client.id, input.clientId), eq(client.practiceId, practiceId)))
    .returning({ id: client.id });

  if (result.length === 0) {
    throw new Error(`Client ${input.clientId} not found`);
  }
}
