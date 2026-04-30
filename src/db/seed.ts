import { db } from './index';
import { client, practice, taxReturn, checklistItem, mtdSubmission } from './schema';
import { eq } from 'drizzle-orm';

const SEED_PRACTICE_NAME = 'Warwick & Co';

async function main() {
  const existingPractice = await db.query.practice.findFirst({
    where: (table, { eq }) => eq(table.name, SEED_PRACTICE_NAME),
  });

  if (existingPractice) {
    await db.delete(taxReturn).where(eq(taxReturn.practiceId, existingPractice.id));
    await db.delete(client).where(eq(client.practiceId, existingPractice.id));
    await db.delete(practice).where(eq(practice.id, existingPractice.id));
  }

  const [insertedPractice] = await db
    .insert(practice)
    .values({ name: SEED_PRACTICE_NAME })
    .returning();

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
      taxYear: 2025,
      regime: 'mtd',
      status: 'filed',
    })
    .returning();

  await db.insert(checklistItem).values({
    practiceId: insertedPractice.id,
    taxReturnId: insertedTaxReturnMtd.id,
    documentType: 'income',
    label: 'Sales/income records for the quarter',
    done: true,
  });

  await db.insert(checklistItem).values({
    practiceId: insertedPractice.id,
    taxReturnId: insertedTaxReturnMtd.id,
    documentType: 'bank_statements',
    label: 'Bank statements for the quarter',
    done: true,
  });

  const [insertedTaxReturnSa100] = await db
    .insert(taxReturn)
    .values({
      practiceId: insertedPractice.id,
      clientId: insertedClientSa100.id,
      taxYear: 2025,
      regime: 'sa100',
      status: 'filed',
    })
    .returning();

  await db.insert(checklistItem).values({
    practiceId: insertedPractice.id,
    taxReturnId: insertedTaxReturnSa100.id,
    documentType: 'p60',
    label: 'P60 (employment income)',
    done: true,
  });

  await db.insert(checklistItem).values({
    practiceId: insertedPractice.id,
    taxReturnId: insertedTaxReturnSa100.id,
    documentType: 'bank_statements',
    label: 'Bank statements',
    done: true,
  });

  await db.insert(mtdSubmission).values({
    practiceId: insertedPractice.id,
    taxReturnId: insertedTaxReturnMtd.id,
    submissionType: 'q_1',
    deadline: '2025-08-07',
    status: 'submitted',
  });
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
