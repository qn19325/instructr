import type { InferSelectModel } from 'drizzle-orm';
import type * as schema from './schema';
import {
  type Client,
  type ClientBase,
  type ChecklistItem,
  type MTDTaxReturn,
  type SA100TaxReturn,
  Regime,
  Status,
  MtdSubmissionStatus,
} from '@/types/clients';
import { db } from './index';
import { client, taxReturn, checklistItem, mtdSubmission } from './schema';
import { getCurrentPracticeId } from '@/lib/auth';
import { currentTaxYear, computeDeadline, mtdDeadlines } from '@/lib/deadlines';
import { getDefaultChecklist } from '@/lib/checklistDefaults';

type RawTaxReturn = InferSelectModel<typeof schema.taxReturn> & {
  mtdSubmissions: InferSelectModel<typeof schema.mtdSubmission>[];
  checklistItems: InferSelectModel<typeof schema.checklistItem>[];
};

type RawClient = InferSelectModel<typeof schema.client> & {
  taxReturns: RawTaxReturn[];
};

function mapChecklist(items: InferSelectModel<typeof schema.checklistItem>[]): ChecklistItem[] {
  return items.map((item) => ({
    id: item.id,
    text: item.label,
    done: item.done,
  }));
}

function mapTaxReturn(taxReturn: RawTaxReturn): MTDTaxReturn | SA100TaxReturn {
  if (taxReturn.regime === 'mtd') {
    return {
      type: 'mtd' as const,
      id: taxReturn.id,
      startTaxYear: taxReturn.taxYear,
      status: taxReturn.status,
      submissions: taxReturn.mtdSubmissions.map((submission) => ({
        id: submission.id,
        submissionType: submission.submissionType,
        deadline: new Date(submission.deadline),
        status: submission.status,
      })),
      checklist: mapChecklist(taxReturn.checklistItems),
    };
  } else {
    return {
      type: 'sa100' as const,
      id: taxReturn.id,
      startTaxYear: taxReturn.taxYear,
      status: taxReturn.status,
      deadline: computeDeadline(taxReturn.taxYear, Regime.sa100),
      checklist: mapChecklist(taxReturn.checklistItems),
    };
  }
}

function mapClient(cli: RawClient): Client {
  const base: ClientBase = {
    id: cli.id,
    niNumber: cli.niNumber,
    firstName: cli.firstName,
    lastName: cli.lastName,
    email: cli.email,
  };

  return {
    ...base,
    taxReturns: cli.taxReturns.map((taxReturn) => mapTaxReturn(taxReturn)),
  };
}

export function getClients(): Promise<Client[]> {
  return db.query.client
    .findMany({
      where: (table, { eq }) => eq(table.practiceId, getCurrentPracticeId()),
      with: {
        taxReturns: {
          with: {
            mtdSubmissions: true,
            checklistItems: true,
          },
        },
      },
    })
    .then((res) => res.map(mapClient));
}

export function getClientById(id: string): Promise<Client | null> {
  return db.query.client
    .findFirst({
      where: (table, { eq, and }) =>
        and(eq(table.id, id), eq(table.practiceId, getCurrentPracticeId())),
      with: {
        taxReturns: {
          with: {
            mtdSubmissions: true,
            checklistItems: true,
          },
        },
      },
    })
    .then((cli) => (cli ? mapClient(cli) : null));
}

export interface CreateClientInput {
  firstName: string;
  lastName: string;
  niNumber: string;
  email: string;
  phoneNumber?: string;
  regime: Regime;
}

export async function insertClient(input: CreateClientInput): Promise<void> {
  await db.transaction(async (tx) => {
    const [newClient] = await tx
      .insert(client)
      .values({
        practiceId: getCurrentPracticeId(),
        firstName: input.firstName,
        lastName: input.lastName,
        niNumber: input.niNumber,
        email: input.email,
        phoneNumber: input.phoneNumber,
      })
      .returning();

    const [newTaxReturn] = await tx
      .insert(taxReturn)
      .values({
        practiceId: getCurrentPracticeId(),
        clientId: newClient.id,
        taxYear: currentTaxYear(),
        regime: input.regime,
        status: Status.not_started,
      })
      .returning();

    if (input.regime === Regime.mtd) {
      await tx.insert(mtdSubmission).values(
        mtdDeadlines(currentTaxYear()).map((quarter) => ({
          practiceId: getCurrentPracticeId(),
          taxReturnId: newTaxReturn.id,
          submissionType: quarter.submissionType,
          deadline: quarter.deadline,
          status: MtdSubmissionStatus.pending,
        })),
      );
    }

    const checklist = getDefaultChecklist(input.regime);

    await tx.insert(checklistItem).values(
      checklist.map((item) => ({
        practiceId: getCurrentPracticeId(),
        taxReturnId: newTaxReturn.id,
        documentType: item.documentType,
        label: item.label,
        done: false,
      })),
    );
  });
}
