import * as clientRepo from '@/repo/clients';
import * as taxReturnService from '@/service/tax-returns';
import { mapClient } from '@/logic/clients';
import { currentTaxYear } from '@/logic/tax-year';
import type { Client } from '@/types/clients';
import type { CreateClientInput, UpdateClientInput, UpdateNotesInput } from '@/schemas/clients';
import { withTransaction } from '@/repo';

export async function getClients(practiceId: string): Promise<Client[]> {
  const rows = await clientRepo.getClients(practiceId);
  return rows.map(mapClient);
}

export async function getClientById(practiceId: string, id: string): Promise<Client | null> {
  const row = await clientRepo.getClientById(practiceId, id);
  return row ? mapClient(row) : null;
}

export async function insertClient(practiceId: string, input: CreateClientInput): Promise<void> {
  await withTransaction(async (tx) => {
    const newClient = await clientRepo.insertClient(practiceId, input, tx);
    await taxReturnService.insertTaxReturnWithDeps(tx, practiceId, {
      clientId: newClient.id,
      taxYear: currentTaxYear(),
      regime: input.regime,
    });
  });
}

export async function updateClient(practiceId: string, input: UpdateClientInput): Promise<void> {
  await clientRepo.updateClient(practiceId, input);
}

export async function updateClientNotes(
  practiceId: string,
  input: UpdateNotesInput,
): Promise<void> {
  await clientRepo.updateClientNotes(practiceId, input);
}
