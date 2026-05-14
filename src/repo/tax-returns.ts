import { and, eq } from 'drizzle-orm';

import { taxReturn } from '@/db/schema';
import type { UpdateTaxReturnStatusInput } from '@/schemas/tax-return';
import type { Regime } from '@/types/clients';
import { Status } from '@/types/clients';

import type { DbOrTx } from './index';

export async function insertTaxReturn(
  practiceId: string,
  input: { clientId: string; taxYear: number; regime: Regime },
  conn: DbOrTx,
): Promise<{ id: string }> {
  const [row] = await conn
    .insert(taxReturn)
    .values({
      practiceId,
      clientId: input.clientId,
      taxYear: input.taxYear,
      regime: input.regime,
      status: Status.not_started,
    })
    .returning({ id: taxReturn.id });
  return row;
}

export async function taxReturnExists(
  practiceId: string,
  clientId: string,
  taxYear: number,
  regime: Regime,
  conn: DbOrTx,
): Promise<boolean> {
  const result = await conn.query.taxReturn.findFirst({
    where: (table, { eq, and }) =>
      and(
        eq(table.practiceId, practiceId),
        eq(table.clientId, clientId),
        eq(table.taxYear, taxYear),
        eq(table.regime, regime),
      ),
    columns: { id: true },
  });
  return !!result;
}

export async function updateTaxReturnStatus(
  practiceId: string,
  input: UpdateTaxReturnStatusInput,
  conn: DbOrTx,
): Promise<void> {
  const result = await conn
    .update(taxReturn)
    .set({ status: input.status })
    .where(
      and(
        eq(taxReturn.practiceId, practiceId),
        eq(taxReturn.clientId, input.clientId),
        eq(taxReturn.id, input.taxReturnId),
      ),
    )
    .returning({ id: taxReturn.id });

  if (result.length === 0) {
    throw new Error(`Tax Return ${input.taxReturnId} not found`);
  }
}
