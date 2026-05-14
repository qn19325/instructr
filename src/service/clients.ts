import type { Db } from '@/infra/db';
import { getDefaultChecklist } from '@/logic/checklist-defaults';
import { mapClient } from '@/logic/clients';
import { mtdSubmissionTypes } from '@/logic/deadlines';
import { currentTaxYear } from '@/logic/tax-year';
import { type Tx, withTransaction } from '@/repo';
import * as checklistRepo from '@/repo/checklist-items';
import * as clientRepo from '@/repo/clients';
import * as mtdRepo from '@/repo/mtd-submissions';
import * as taxReturnRepo from '@/repo/tax-returns';
import type { CreateClientInput, UpdateClientInput, UpdateNotesInput } from '@/schemas/clients';
import type { CreateTaxReturnInput, UpdateTaxReturnStatusInput } from '@/schemas/tax-return';
import { ServiceError } from '@/service/errors';
import { Regime, type Client } from '@/types/clients';

export async function getClients(db: Db, practiceId: string): Promise<Client[]> {
  const rows = await clientRepo.getClients(practiceId, db);
  return rows.map(mapClient);
}

export async function getClientById(
  db: Db,
  practiceId: string,
  id: string,
): Promise<Client | null> {
  const row = await clientRepo.getClientById(practiceId, id, db);
  return row ? mapClient(row) : null;
}

export async function insertClient(
  db: Db,
  practiceId: string,
  input: CreateClientInput,
): Promise<void> {
  await withTransaction(db, async (tx) => {
    const newClient = await clientRepo.insertClient(practiceId, input, tx);
    await createTaxReturnTree(tx, practiceId, {
      clientId: newClient.id,
      taxYear: currentTaxYear(),
      regime: input.regime,
    });
  });
}

export async function updateClient(
  db: Db,
  practiceId: string,
  input: UpdateClientInput,
): Promise<void> {
  const client = await clientRepo.getClientById(practiceId, input.clientId, db);
  if (!client) throw new ServiceError('Client not found');
  await clientRepo.updateClient(practiceId, input, db);
}

export async function updateClientNotes(
  db: Db,
  practiceId: string,
  input: UpdateNotesInput,
): Promise<void> {
  await clientRepo.updateClientNotes(practiceId, input, db);
}

export async function insertTaxReturn(
  db: Db,
  practiceId: string,
  input: CreateTaxReturnInput,
): Promise<void> {
  const client = await clientRepo.getClientById(practiceId, input.clientId, db);
  if (!client) throw new ServiceError('Client not found');
  const duplicate = await taxReturnRepo.taxReturnExists(
    practiceId,
    input.clientId,
    input.taxYear,
    input.regime,
    db,
  );
  if (duplicate) throw new ServiceError('A tax return for this year and regime already exists');
  await withTransaction(db, (tx) => createTaxReturnTree(tx, practiceId, input));
}

export async function taxReturnExists(
  db: Db,
  practiceId: string,
  clientId: string,
  taxYear: number,
  regime: Regime,
): Promise<boolean> {
  return taxReturnRepo.taxReturnExists(practiceId, clientId, taxYear, regime, db);
}

export async function changeTaxReturnStatus(
  db: Db,
  practiceId: string,
  input: UpdateTaxReturnStatusInput,
): Promise<void> {
  await taxReturnRepo.updateTaxReturnStatus(practiceId, input, db);
}

export async function assertChecklistItemOwned(
  db: Db,
  practiceId: string,
  itemId: string,
  clientId?: string,
): Promise<{ id: string; clientId: string }> {
  const item = await checklistRepo.getChecklistItemOwnership(practiceId, itemId, db);
  if (!item) throw new ServiceError('Unauthorised');
  if (clientId && item.clientId !== clientId) throw new ServiceError('Unauthorised');
  return item;
}

export async function markItemReceived(
  db: Db,
  practiceId: string,
  itemId: string,
  clientId?: string,
): Promise<void> {
  const item = await assertChecklistItemOwned(db, practiceId, itemId, clientId);
  await checklistRepo.updateChecklistItemDone(practiceId, item.id, true, db);
}

export async function markItemOutstanding(
  db: Db,
  practiceId: string,
  itemId: string,
  clientId?: string,
): Promise<void> {
  const item = await assertChecklistItemOwned(db, practiceId, itemId, clientId);
  await checklistRepo.updateChecklistItemDone(practiceId, item.id, false, db);
}

async function createTaxReturnTree(
  tx: Tx,
  practiceId: string,
  input: { clientId: string; taxYear: number; regime: Regime },
): Promise<void> {
  const newTaxReturn = await taxReturnRepo.insertTaxReturn(practiceId, input, tx);

  if (input.regime === Regime.mtd) {
    await mtdRepo.insertMtdSubmissions(practiceId, newTaxReturn.id, mtdSubmissionTypes, tx);
  }
  await checklistRepo.insertChecklistItems(
    practiceId,
    newTaxReturn.id,
    getDefaultChecklist(input.regime),
    tx,
  );
}
