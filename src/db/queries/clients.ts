import type { InferSelectModel } from 'drizzle-orm';
import type * as schema from '../schema';
import { Client, ClientBase, MTDTaxReturn, SA100TaxReturn } from '@/types/clients';
import { db } from '../index';
import { getCurrentPracticeId } from '@/lib/auth';

type RawTaxReturn = InferSelectModel<typeof schema.taxReturn> & {
  mtdSubmissions: InferSelectModel<typeof schema.mtdSubmission>[];
  checklistItems: InferSelectModel<typeof schema.checklistItem>[];
};

type RawClient = InferSelectModel<typeof schema.client> & {
  taxReturns: RawTaxReturn[];
};

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
      checkList: taxReturn.checklistItems.map((item) => ({
        text: item.label,
        done: item.done,
      })),
    };
  } else {
    return {
      type: 'sa100' as const,
      id: taxReturn.id,
      startTaxYear: taxReturn.taxYear,
      status: taxReturn.status,
      deadline: new Date(taxReturn.deadline),
      checkList: taxReturn.checklistItems.map((item) => ({
        text: item.label,
        done: item.done,
      })),
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
