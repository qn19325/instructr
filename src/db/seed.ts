import { eq } from 'drizzle-orm';

import { db } from '@/infra/db';
import { getDefaultChecklist } from '@/logic/checklist-defaults';
import { Regime, Status, MtdSubmissionStatus, SubmissionType } from '@/types/clients';

import { client, practice, taxReturn, checklistItem, mtdSubmission } from './schema';

const SEED_PRACTICE_NAME = 'Warwick & Co';
const SEED_PRACTICE_ID = 'd47cc867-7ce8-4c60-af87-e9cf3ea7487c';

const TAX_YEAR = 2025;

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

  await db.insert(practice).values({ id: SEED_PRACTICE_ID, name: SEED_PRACTICE_NAME });

  const practiceId = SEED_PRACTICE_ID;

  // 1. Alice Thornton — SA100 — filed — all checklist done
  const [alice] = await db
    .insert(client)
    .values({
      practiceId,
      firstName: 'Alice',
      lastName: 'Thornton',
      niNumber: 'AB 12 34 56 C',
      email: 'alice.thornton@example.com',
      phoneNumber: '07700 900001',
    })
    .returning();

  const [aliceReturn] = await db
    .insert(taxReturn)
    .values({
      practiceId,
      clientId: alice.id,
      taxYear: TAX_YEAR,
      regime: Regime.sa100,
      status: Status.filed,
    })
    .returning();

  await db.insert(checklistItem).values(
    getDefaultChecklist(Regime.sa100).map((item) => ({
      practiceId,
      taxReturnId: aliceReturn.id,
      documentType: item.documentType,
      label: item.label,
      done: true,
    })),
  );

  // 2. Ben Fletcher — SA100 — ready_to_file — all checklist done, note
  const [ben] = await db
    .insert(client)
    .values({
      practiceId,
      firstName: 'Ben',
      lastName: 'Fletcher',
      niNumber: 'AB 23 45 67 D',
      email: 'ben.fletcher@example.com',
      phoneNumber: '07700 900002',
      notes: 'Return reviewed and client has approved. Ready to submit.',
    })
    .returning();

  const [benReturn] = await db
    .insert(taxReturn)
    .values({
      practiceId,
      clientId: ben.id,
      taxYear: TAX_YEAR,
      regime: Regime.sa100,
      status: Status.ready_to_file,
    })
    .returning();

  await db.insert(checklistItem).values(
    getDefaultChecklist(Regime.sa100).map((item) => ({
      practiceId,
      taxReturnId: benReturn.id,
      documentType: item.documentType,
      label: item.label,
      done: true,
    })),
  );

  // 3. Clara Osei — SA100 — awaiting_client — first 4 of 8 checklist done
  const [clara] = await db
    .insert(client)
    .values({
      practiceId,
      firstName: 'Clara',
      lastName: 'Osei',
      niNumber: 'AB 34 56 78 A',
      email: 'clara.osei@example.com',
      phoneNumber: '07700 900003',
      notes: 'Waiting on rental income records and dividend certificates. Chased 2 May.',
    })
    .returning();

  const [claraReturn] = await db
    .insert(taxReturn)
    .values({
      practiceId,
      clientId: clara.id,
      taxYear: TAX_YEAR,
      regime: Regime.sa100,
      status: Status.awaiting_client,
    })
    .returning();

  const sa100Checklist = getDefaultChecklist(Regime.sa100);
  await db.insert(checklistItem).values(
    sa100Checklist.map((item, i) => ({
      practiceId,
      taxReturnId: claraReturn.id,
      documentType: item.documentType,
      label: item.label,
      done: i < 4,
    })),
  );

  // 4. Emma Sinclair — SA100 — not_started — nothing done
  const [emma] = await db
    .insert(client)
    .values({
      practiceId,
      firstName: 'Emma',
      lastName: 'Sinclair',
      niNumber: 'AB 45 67 89 B',
      email: 'emma.sinclair@example.com',
      phoneNumber: '07700 900004',
    })
    .returning();

  const [emmaReturn] = await db
    .insert(taxReturn)
    .values({
      practiceId,
      clientId: emma.id,
      taxYear: TAX_YEAR,
      regime: Regime.sa100,
      status: Status.not_started,
    })
    .returning();

  await db.insert(checklistItem).values(
    getDefaultChecklist(Regime.sa100).map((item) => ({
      practiceId,
      taxReturnId: emmaReturn.id,
      documentType: item.documentType,
      label: item.label,
      done: false,
    })),
  );

  // 5. James Whitfield — SA100 — in_progress — first 2 of 8 done
  const [james] = await db
    .insert(client)
    .values({
      practiceId,
      firstName: 'James',
      lastName: 'Whitfield',
      niNumber: 'AB 56 78 90 C',
      email: 'james.whitfield@example.com',
      phoneNumber: '07700 900005',
    })
    .returning();

  const [jamesReturn] = await db
    .insert(taxReturn)
    .values({
      practiceId,
      clientId: james.id,
      taxYear: TAX_YEAR,
      regime: Regime.sa100,
      status: Status.in_progress,
    })
    .returning();

  await db.insert(checklistItem).values(
    sa100Checklist.map((item, i) => ({
      practiceId,
      taxReturnId: jamesReturn.id,
      documentType: item.documentType,
      label: item.label,
      done: i < 2,
    })),
  );

  // 6. David Marsh — MTD — in_progress — Q1 submitted, Q2 overdue, Q3/Q4 pending; checklist mostly done
  const [david] = await db
    .insert(client)
    .values({
      practiceId,
      firstName: 'David',
      lastName: 'Marsh',
      niNumber: 'AB 67 89 01 D',
      email: 'david.marsh@example.com',
      phoneNumber: '07700 900006',
    })
    .returning();

  const [davidReturn] = await db
    .insert(taxReturn)
    .values({
      practiceId,
      clientId: david.id,
      taxYear: TAX_YEAR,
      regime: Regime.mtd,
      status: Status.in_progress,
    })
    .returning();

  const mtdChecklist = getDefaultChecklist(Regime.mtd);
  await db.insert(checklistItem).values(
    mtdChecklist.map((item, i) => ({
      practiceId,
      taxReturnId: davidReturn.id,
      documentType: item.documentType,
      label: item.label,
      done: i < 3,
    })),
  );

  await db.insert(mtdSubmission).values([
    {
      practiceId,
      taxReturnId: davidReturn.id,
      submissionType: SubmissionType.q_1,
      status: MtdSubmissionStatus.submitted,
    },
    {
      practiceId,
      taxReturnId: davidReturn.id,
      submissionType: SubmissionType.q_2,
      status: MtdSubmissionStatus.overdue,
    },
    {
      practiceId,
      taxReturnId: davidReturn.id,
      submissionType: SubmissionType.q_3,
      status: MtdSubmissionStatus.pending,
    },
    {
      practiceId,
      taxReturnId: davidReturn.id,
      submissionType: SubmissionType.q_4,
      status: MtdSubmissionStatus.pending,
    },
  ]);

  // 7. Rachel Webb — MTD — awaiting_client — Q1 submitted, Q2/Q3/Q4 pending; checklist partial, note
  const [rachel] = await db
    .insert(client)
    .values({
      practiceId,
      firstName: 'Rachel',
      lastName: 'Webb',
      niNumber: 'AB 78 90 12 A',
      email: 'rachel.webb@example.com',
      phoneNumber: '07700 900007',
      notes: 'Waiting on Q2 expense receipts and bank statements. Called 8 May, no response.',
    })
    .returning();

  const [rachelReturn] = await db
    .insert(taxReturn)
    .values({
      practiceId,
      clientId: rachel.id,
      taxYear: TAX_YEAR,
      regime: Regime.mtd,
      status: Status.awaiting_client,
    })
    .returning();

  await db.insert(checklistItem).values(
    mtdChecklist.map((item, i) => ({
      practiceId,
      taxReturnId: rachelReturn.id,
      documentType: item.documentType,
      label: item.label,
      done: i < 1,
    })),
  );

  await db.insert(mtdSubmission).values([
    {
      practiceId,
      taxReturnId: rachelReturn.id,
      submissionType: SubmissionType.q_1,
      status: MtdSubmissionStatus.submitted,
    },
    {
      practiceId,
      taxReturnId: rachelReturn.id,
      submissionType: SubmissionType.q_2,
      status: MtdSubmissionStatus.pending,
    },
    {
      practiceId,
      taxReturnId: rachelReturn.id,
      submissionType: SubmissionType.q_3,
      status: MtdSubmissionStatus.pending,
    },
    {
      practiceId,
      taxReturnId: rachelReturn.id,
      submissionType: SubmissionType.q_4,
      status: MtdSubmissionStatus.pending,
    },
  ]);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
