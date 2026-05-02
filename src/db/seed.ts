import { db } from './index';
import { client, practice, taxReturn, checklistItem, mtdSubmission } from './schema';
import { eq } from 'drizzle-orm';
import { Regime, Status, MtdSubmissionStatus } from '@/types/clients';
import { currentTaxYear, mtdDeadlines } from '@/lib/deadlines';
import { getDefaultChecklist } from '@/lib/checklistDefaults';

const SEED_PRACTICE_NAME = 'Warwick & Co';

async function main() {
  const existingPractice = await db.query.practice.findFirst({
    where: (table, { eq }) => eq(table.name, SEED_PRACTICE_NAME),
  });

  if (existingPractice) {
    await db.delete(checklistItem).where(eq(checklistItem.practiceId, existingPractice.id));
    await db.delete(mtdSubmission).where(eq(mtdSubmission.practiceId, existingPractice.id));
    await db.delete(taxReturn).where(eq(taxReturn.practiceId, existingPractice.id));
    await db.delete(client).where(eq(client.practiceId, existingPractice.id));
    await db.delete(practice).where(eq(practice.id, existingPractice.id));
  }

  const [insertedPractice] = await db
    .insert(practice)
    .values({ name: SEED_PRACTICE_NAME })
    .returning();

  const taxYear = currentTaxYear();

  const [insertedClientMtd] = await db
    .insert(client)
    .values({
      practiceId: insertedPractice.id,
      niNumber: 'AB 00 00 00 C',
      firstName: 'Client mtd 0 FIRST',
      lastName: 'Client mtd 0 LAST',
      email: 'clientmtd_0@mail.com',
      phoneNumber: '00000000000',
    })
    .returning();

  const [insertedClientSa100] = await db
    .insert(client)
    .values({
      practiceId: insertedPractice.id,
      niNumber: 'AB 00 00 01 C',
      firstName: 'Client sa100 0 FIRST',
      lastName: 'Client sa100 0 LAST',
      email: 'clientsa100_0@mail.com',
      phoneNumber: '00000000001',
    })
    .returning();

  const [insertedTaxReturnMtd] = await db
    .insert(taxReturn)
    .values({
      practiceId: insertedPractice.id,
      clientId: insertedClientMtd.id,
      taxYear,
      regime: Regime.mtd,
      status: Status.filed,
    })
    .returning();

  await db.insert(checklistItem).values(
    getDefaultChecklist(Regime.mtd).map((item) => ({
      practiceId: insertedPractice.id,
      taxReturnId: insertedTaxReturnMtd.id,
      documentType: item.documentType,
      label: item.label,
      done: true,
    })),
  );

  const [insertedTaxReturnSa100] = await db
    .insert(taxReturn)
    .values({
      practiceId: insertedPractice.id,
      clientId: insertedClientSa100.id,
      taxYear,
      regime: Regime.sa100,
      status: Status.filed,
    })
    .returning();

  await db.insert(checklistItem).values(
    getDefaultChecklist(Regime.sa100).map((item) => ({
      practiceId: insertedPractice.id,
      taxReturnId: insertedTaxReturnSa100.id,
      documentType: item.documentType,
      label: item.label,
      done: true,
    })),
  );

  await db.insert(mtdSubmission).values(
    mtdDeadlines(taxYear).map((quarter) => ({
      practiceId: insertedPractice.id,
      taxReturnId: insertedTaxReturnMtd.id,
      submissionType: quarter.submissionType,
      status: MtdSubmissionStatus.submitted,
    })),
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
