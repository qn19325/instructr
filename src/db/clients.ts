import { and, eq, type InferSelectModel } from 'drizzle-orm';
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
import { client, taxReturn, checklistItem, mtdSubmission, document, r2PendingDelete } from './schema';
import type { InsertDocumentInput } from './documents';
import { getCurrentPracticeId } from '@/lib/auth';
import { currentTaxYear, sa100Deadline, mtdDeadlines } from '@/lib/deadlines';
import { getDefaultChecklist } from '@/lib/checklistDefaults';
import { CreateClientInput } from '@/schemas/clients';

type RawChecklistItem = InferSelectModel<typeof schema.checklistItem> & {
  document: InferSelectModel<typeof schema.document> | null;
};

type RawTaxReturn = InferSelectModel<typeof schema.taxReturn> & {
  mtdSubmissions: InferSelectModel<typeof schema.mtdSubmission>[];
  checklistItems: RawChecklistItem[];
};

type RawClient = InferSelectModel<typeof schema.client> & {
  taxReturns: RawTaxReturn[];
};

function mapChecklist(items: RawChecklistItem[]): ChecklistItem[] {
  return items.map((item) => ({
    id: item.id,
    text: item.label,
    done: item.done,
    document: item.document
      ? {
          id: item.document.id,
          originalFileName: item.document.originalFileName,
          mimeType: item.document.mimeType,
          size: item.document.size,
        }
      : undefined,
  }));
}

function mapTaxReturn(taxReturn: RawTaxReturn): MTDTaxReturn | SA100TaxReturn {
  if (taxReturn.regime === Regime.mtd) {
    const deadlinesByType = Object.fromEntries(
      mtdDeadlines(taxReturn.taxYear).map((d) => [d.submissionType, d.deadline]),
    );
    return {
      type: 'mtd' as const,
      id: taxReturn.id,
      taxYear: taxReturn.taxYear,
      status: taxReturn.status,
      submissions: taxReturn.mtdSubmissions.map((submission) => {
        const deadlineStr = deadlinesByType[submission.submissionType];
        if (!deadlineStr)
          throw new Error(`No deadline for submission type: ${submission.submissionType}`);
        return {
          id: submission.id,
          submissionType: submission.submissionType,
          deadline: new Date(deadlineStr),
          status: submission.status,
        };
      }),
      checklist: mapChecklist(taxReturn.checklistItems),
    };
  } else {
    return {
      type: 'sa100' as const,
      id: taxReturn.id,
      taxYear: taxReturn.taxYear,
      status: taxReturn.status,
      deadline: sa100Deadline(taxReturn.taxYear),
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
    email: cli.email ?? undefined,
    phoneNumber: cli.phoneNumber ?? undefined,
  };

  return {
    ...base,
    taxReturns: cli.taxReturns.map((taxReturn) => mapTaxReturn(taxReturn)),
  };
}

export async function getClients(): Promise<Client[]> {
  const practiceId = await getCurrentPracticeId();
  return db.query.client
    .findMany({
      where: (table, { eq }) => eq(table.practiceId, practiceId),
      with: {
        taxReturns: {
          with: {
            mtdSubmissions: true,
            checklistItems: {
              with: {
                document: true,
              },
            },
          },
        },
      },
    })
    .then((res) => res.map(mapClient));
}

export async function getClientById(id: string): Promise<Client | null> {
  const practiceId = await getCurrentPracticeId();
  return db.query.client
    .findFirst({
      where: (table, { eq, and }) => and(eq(table.id, id), eq(table.practiceId, practiceId)),
      with: {
        taxReturns: {
          with: {
            mtdSubmissions: true,
            checklistItems: {
              with: {
                document: true,
              },
            },
          },
        },
      },
    })
    .then((cli) => (cli ? mapClient(cli) : null));
}

export async function insertClient(input: CreateClientInput): Promise<void> {
  const practiceId = await getCurrentPracticeId();
  await db.transaction(async (tx) => {
    const [newClient] = await tx
      .insert(client)
      .values({
        practiceId,
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
        practiceId,
        clientId: newClient.id,
        taxYear: currentTaxYear(),
        regime: input.regime,
        status: Status.not_started,
      })
      .returning();

    if (input.regime === Regime.mtd) {
      await tx.insert(mtdSubmission).values(
        mtdDeadlines(currentTaxYear()).map((quarter) => ({
          practiceId,
          taxReturnId: newTaxReturn.id,
          submissionType: quarter.submissionType,
          status: MtdSubmissionStatus.pending,
        })),
      );
    }

    const checklist = getDefaultChecklist(input.regime);

    await tx.insert(checklistItem).values(
      checklist.map((item) => ({
        practiceId,
        taxReturnId: newTaxReturn.id,
        documentType: item.documentType,
        label: item.label,
        done: false,
      })),
    );
  });
}

export async function markChecklistItemDone(id: string, practiceId: string): Promise<void> {
  await db
    .update(checklistItem)
    .set({ done: true })
    .where(and(eq(checklistItem.id, id), eq(checklistItem.practiceId, practiceId)));
}

export async function getChecklistItem(
  id: string,
  practiceId: string,
): Promise<InferSelectModel<typeof schema.checklistItem> | undefined> {
  return await db.query.checklistItem.findFirst({
    where: (table, { eq, and }) => and(eq(table.id, id), eq(table.practiceId, practiceId)),
  });
}

export async function recordDocumentUpload(
  input: InsertDocumentInput,
): Promise<{ oldR2Key: string | null }> {
  return await db.transaction(async (tx) => {
    const existing = await tx.query.document.findFirst({
      where: (table, { eq }) => eq(table.checklistItemId, input.checklistItemId),
    });

    if (existing) {
      await tx.delete(document).where(eq(document.id, existing.id));
      await tx.insert(r2PendingDelete).values({ practiceId: input.practiceId, r2Key: existing.r2Key });
    }

    await tx.insert(document).values({ ...input });

    await tx
      .update(checklistItem)
      .set({ done: true })
      .where(and(eq(checklistItem.id, input.checklistItemId), eq(checklistItem.practiceId, input.practiceId)));

    return { oldR2Key: existing?.r2Key ?? null };
  });
}
