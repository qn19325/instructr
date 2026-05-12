import * as taxReturnRepo from '@/repo/tax-returns';
import * as checklistRepo from '@/repo/checklist-items';
import * as mtdRepo from '@/repo/mtd-submissions';
import { getDefaultChecklist } from '@/logic/checklist-defaults';
import { Regime } from '@/types/clients';
import type { CreateTaxReturnInput, UpdateTaxReturnStatusInput } from '@/schemas/tax-return';
import { Tx, withTransaction } from '@/repo';
import { mtdSubmissionTypes } from '@/logic/deadlines';

export async function insertTaxReturnWithDeps(
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

export async function insertTaxReturn(
  practiceId: string,
  input: CreateTaxReturnInput,
): Promise<void> {
  await withTransaction((tx) => insertTaxReturnWithDeps(tx, practiceId, input));
}

export async function taxReturnExists(
  practiceId: string,
  clientId: string,
  taxYear: number,
  regime: Regime,
): Promise<boolean> {
  return taxReturnRepo.taxReturnExists(practiceId, clientId, taxYear, regime);
}

export async function changeTaxReturnStatus(
  practiceId: string,
  input: UpdateTaxReturnStatusInput,
): Promise<void> {
  await taxReturnRepo.updateTaxReturnStatus(practiceId, input);
}
