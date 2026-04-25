import { db } from './index';
import { client, practice, taxReturn, checklistItem, mtdSubmission } from './schema';

async function main() {
  const [insertedPractice] = await db.insert(practice).values({ name: 'Warwick & Co' }).returning();

  const [insertedClientMtd] = await db
    .insert(client)
    .values({
      practiceId: insertedPractice.id,
      niNumber: 'AB 00 00 00 C',
      firstName: 'Client MTD 0 FIRST',
      lastName: 'Client MTD 0 LAST',
      email: 'clientMTD_0@mail.com',
      phoneNumber: '00000000000',
    })
    .returning();

  const [insertedClientSa100] = await db
    .insert(client)
    .values({
      practiceId: insertedPractice.id,
      niNumber: 'AB 00 00 01 C',
      firstName: 'Client SA100 0 FIRST',
      lastName: 'Client SA100 0 LAST',
      email: 'clientSA100_0@mail.com',
      phoneNumber: '00000000001',
    })
    .returning();

  const [insertedTaxReturnMtd] = await db
    .insert(taxReturn)
    .values({
      practiceId: insertedPractice.id,
      clientId: insertedClientMtd.id,
      taxYear: 2025,
      regime: 'MTD',
      status: 'filed',
      deadline: '2025-08-07',
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
    done: false,
  });

  const [insertedTaxReturnSa100] = await db
    .insert(taxReturn)
    .values({
      practiceId: insertedPractice.id,
      clientId: insertedClientSa100.id,
      taxYear: 2025,
      regime: 'SA100',
      status: 'filed',
      deadline: '2026-01-31',
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
    done: false,
  });

  await db.insert(mtdSubmission).values({
    practiceId: insertedPractice.id,
    taxReturnId: insertedTaxReturnMtd.id,
    submissionType: 'q_1',
    deadline: '2025-08-07',
    status: 'filed',
  });
}

main();
