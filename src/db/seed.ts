import { eq } from 'drizzle-orm';

import { db } from '@/infra/db';
import { getDefaultChecklist } from '@/logic/checklist-defaults';
import type { CreateClientInput } from '@/schemas/clients';
import { Regime, Status, MtdSubmissionStatus, SubmissionType } from '@/types/clients';

import { client, practice, taxReturn, checklistItem, mtdSubmission } from './schema';

const SEED_PRACTICE_NAME = 'Warwick & Co';
const SEED_PRACTICE_ID = 'd47cc867-7ce8-4c60-af87-e9cf3ea7487c';

const TAX_YEAR = 2025;

type SeedClient = Omit<CreateClientInput, 'regime'> & {
  taxReturns: SeedTaxReturn[];
  notes?: string;
};

type SeedTaxReturn = {
  regime: Regime;
  status: Status;
  checklistDoneCount: number;
  mtdSubmissions?: SeedMTDSubmission[];
};

type SeedMTDSubmission = {
  submissionType: SubmissionType;
  status: MtdSubmissionStatus;
};

const seeds: SeedClient[] = [
  {
    firstName: 'Alice',
    lastName: 'Thornton',
    niNumber: 'AB 12 34 56 C',
    email: 'alice.thornton@example.com',
    phoneNumber: '07700 900001',
    taxReturns: [{ regime: Regime.sa100, status: Status.filed, checklistDoneCount: 8 }],
  },
  {
    firstName: 'Ben',
    lastName: 'Fletcher',
    niNumber: 'AB 23 45 67 D',
    email: 'ben.fletcher@example.com',
    phoneNumber: '07700 900002',
    notes: 'Return reviewed and client has approved. Ready to submit.',
    taxReturns: [{ regime: Regime.sa100, status: Status.ready_to_file, checklistDoneCount: 8 }],
  },
  {
    firstName: 'Clara',
    lastName: 'Osei',
    niNumber: 'AB 34 56 78 A',
    email: 'clara.osei@example.com',
    phoneNumber: '07700 900003',
    notes: 'Waiting on rental income records and dividend certificates. Chased 2 May.',
    taxReturns: [{ regime: Regime.sa100, status: Status.awaiting_client, checklistDoneCount: 4 }],
  },
  {
    firstName: 'Emma',
    lastName: 'Sinclair',
    niNumber: 'AB 45 67 89 B',
    email: 'emma.sinclair@example.com',
    phoneNumber: '07700 900004',
    taxReturns: [{ regime: Regime.sa100, status: Status.not_started, checklistDoneCount: 0 }],
  },
  {
    firstName: 'James',
    lastName: 'Whitfield',
    niNumber: 'AB 56 78 90 C',
    email: 'james.whitfield@example.com',
    phoneNumber: '07700 900005',
    taxReturns: [{ regime: Regime.sa100, status: Status.in_progress, checklistDoneCount: 2 }],
  },
  {
    firstName: 'David',
    lastName: 'Marsh',
    niNumber: 'AB 67 89 01 D',
    email: 'david.marsh@example.com',
    phoneNumber: '07700 900006',
    taxReturns: [
      {
        regime: Regime.mtd,
        status: Status.in_progress,
        checklistDoneCount: 3,
        mtdSubmissions: [
          { submissionType: SubmissionType.q_1, status: MtdSubmissionStatus.submitted },
          { submissionType: SubmissionType.q_2, status: MtdSubmissionStatus.overdue },
          { submissionType: SubmissionType.q_3, status: MtdSubmissionStatus.pending },
          { submissionType: SubmissionType.q_4, status: MtdSubmissionStatus.pending },
        ],
      },
    ],
  },
  {
    firstName: 'Rachel',
    lastName: 'Webb',
    niNumber: 'AB 78 90 12 A',
    email: 'rachel.webb@example.com',
    phoneNumber: '07700 900007',
    notes: 'Waiting on Q2 expense receipts and bank statements. Called 8 May, no response.',
    taxReturns: [
      {
        regime: Regime.mtd,
        status: Status.awaiting_client,
        checklistDoneCount: 1,
        mtdSubmissions: [
          { submissionType: SubmissionType.q_1, status: MtdSubmissionStatus.submitted },
          { submissionType: SubmissionType.q_2, status: MtdSubmissionStatus.pending },
          { submissionType: SubmissionType.q_3, status: MtdSubmissionStatus.pending },
          { submissionType: SubmissionType.q_4, status: MtdSubmissionStatus.pending },
        ],
      },
    ],
  },
];

async function seedClients(practiceId: string): Promise<void> {
  for (const seed of seeds) {
    const [seedClient] = await db
      .insert(client)
      .values({
        practiceId,
        firstName: seed.firstName,
        lastName: seed.lastName,
        niNumber: seed.niNumber,
        email: seed.email,
        phoneNumber: seed.phoneNumber,
        notes: seed.notes,
      })
      .returning();

    for (const txR of seed.taxReturns) {
      const [seedReturn] = await db
        .insert(taxReturn)
        .values({
          practiceId,
          clientId: seedClient.id,
          taxYear: TAX_YEAR,
          regime: txR.regime,
          status: txR.status,
        })
        .returning();

      await db.insert(checklistItem).values(
        getDefaultChecklist(seedReturn.regime).map((item, idx) => ({
          practiceId,
          taxReturnId: seedReturn.id,
          documentType: item.documentType,
          label: item.label,
          done: idx < txR.checklistDoneCount,
        })),
      );

      if (txR.mtdSubmissions) {
        await db.insert(mtdSubmission).values(
          txR.mtdSubmissions.map((s) => ({
            practiceId,
            taxReturnId: seedReturn.id,
            submissionType: s.submissionType,
            status: s.status,
          })),
        );
      }
    }
  }
}

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
  await seedClients(practiceId);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
