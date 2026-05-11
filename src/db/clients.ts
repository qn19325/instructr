import { and, eq, type InferSelectModel } from 'drizzle-orm';
import type * as schema from './schema';
import {
  type Client,
  type ChecklistItem,
  Regime,
  Status,
  MtdSubmissionStatus,
  TaxReturn,
} from '@/types/clients';
import { db } from './index';
import { client, taxReturn, checklistItem, mtdSubmission } from './schema';
import { getCurrentPracticeId } from '@/lib/auth';
import { currentTaxYear, mtdSubmissionTypes } from '@/lib/tax-return';
import { getDefaultChecklist } from '@/lib/checklistDefaults';
import { CreateClientInput, UpdateClientInput } from '@/schemas/clients';
import { CreateTaxReturnInput } from '@/schemas/taxReturn';

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

function mapTaxReturn(rawReturn: RawTaxReturn): TaxReturn {
  if (rawReturn.regime === Regime.mtd) {
    return {
      regime: Regime.mtd,
      id: rawReturn.id,
      taxYear: rawReturn.taxYear,
      status: rawReturn.status,
      submissions: rawReturn.mtdSubmissions.map((submission) => {
        return {
          id: submission.id,
          submissionType: submission.submissionType,
          status: submission.status,
        };
      }),
      checklist: mapChecklist(rawReturn.checklistItems),
    };
  } else {
    return {
      regime: Regime.sa100,
      id: rawReturn.id,
      taxYear: rawReturn.taxYear,
      status: rawReturn.status,
      checklist: mapChecklist(rawReturn.checklistItems),
    };
  }
}

function mapClient(cli: RawClient): Client {
  return {
    id: cli.id,
    niNumber: cli.niNumber,
    firstName: cli.firstName,
    lastName: cli.lastName,
    email: cli.email ?? undefined,
    phoneNumber: cli.phoneNumber ?? undefined,
    taxReturns: cli.taxReturns.map((taxReturn) => mapTaxReturn(taxReturn)),
    notes: cli.notes ?? undefined,
  };
}

export async function getClients(): Promise<Client[]> {
  const practiceId = await getCurrentPracticeId();
  return db.query.client
    .findMany({
      where: (table, { eq }) => eq(table.practiceId, practiceId),
      with: {
        taxReturns: {
          orderBy: (table, { desc }) => desc(table.taxYear),
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
          orderBy: (table, { desc }) => desc(table.taxYear),
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

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function seedTaxReturnRows(
  tx: Tx,
  { practiceId, taxReturnId, regime }: { practiceId: string; taxReturnId: string; regime: Regime },
): Promise<void> {
  if (regime === Regime.mtd) {
    await tx.insert(mtdSubmission).values(
      mtdSubmissionTypes().map((submissionType) => ({
        practiceId,
        taxReturnId,
        submissionType,
        status: MtdSubmissionStatus.pending,
      })),
    );
  }

  const checklist = getDefaultChecklist(regime);

  await tx.insert(checklistItem).values(
    checklist.map((item) => ({
      practiceId,
      taxReturnId,
      documentType: item.documentType,
      label: item.label,
      done: false,
    })),
  );
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

    await seedTaxReturnRows(tx, { practiceId, taxReturnId: newTaxReturn.id, regime: input.regime });
  });
}

export async function updateClient(clientId: string, input: UpdateClientInput): Promise<void> {
  const practiceId = await getCurrentPracticeId();
  const result = await db
    .update(client)
    .set({
      firstName: input.firstName,
      lastName: input.lastName,
      niNumber: input.niNumber,
      email: input.email,
      phoneNumber: input.phoneNumber,
    })
    .where(and(eq(client.id, clientId), eq(client.practiceId, practiceId)))
    .returning({ id: client.id });

  if (result.length === 0) {
    throw new Error(`Client ${clientId} not found`);
  }
}

export async function insertTaxReturn(input: CreateTaxReturnInput): Promise<void> {
  const practiceId = await getCurrentPracticeId();
  await db.transaction(async (tx) => {
    const [newTaxReturn] = await tx
      .insert(taxReturn)
      .values({
        practiceId,
        clientId: input.clientId,
        taxYear: input.taxYear,
        regime: input.regime,
        status: Status.not_started,
      })
      .returning();

    await seedTaxReturnRows(tx, { practiceId, taxReturnId: newTaxReturn.id, regime: input.regime });
  });
}

export async function taxReturnExists(
  clientId: string,
  taxYear: number,
  regime: Regime,
): Promise<boolean> {
  const practiceId = await getCurrentPracticeId();
  const result = await db.query.taxReturn.findFirst({
    where: (table, { eq, and }) =>
      and(
        eq(table.practiceId, practiceId),
        eq(table.clientId, clientId),
        eq(table.taxYear, taxYear),
        eq(table.regime, regime),
      ),
    columns: { id: true },
  });
  return !!result;
}

export async function getChecklistItem(
  id: string,
): Promise<{ id: string; practiceId: string } | undefined> {
  const practiceId = await getCurrentPracticeId();
  const item = await db.query.checklistItem.findFirst({
    where: (table, { eq, and }) => and(eq(table.id, id), eq(table.practiceId, practiceId)),
  });
  return item ? { id: item.id, practiceId } : undefined;
}

export async function updateClientNotes(clientId: string, notes: string): Promise<void> {
  const practiceId = await getCurrentPracticeId();
  const result = await db
    .update(client)
    .set({
      notes: notes.trim() || null,
    })
    .where(and(eq(client.id, clientId), eq(client.practiceId, practiceId)))
    .returning({ id: client.id });

  if (result.length === 0) {
    throw new Error(`Client ${clientId} not found`);
  }
}
