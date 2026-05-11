import { relations } from 'drizzle-orm';
import {
  integer,
  pgTable,
  text,
  uuid,
  pgEnum,
  boolean,
  timestamp,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { Status, Regime, SubmissionType, MtdSubmissionStatus } from '@/types/clients';
import { DocumentType } from '@/types/documents';

export const statusEnum = pgEnum('status', Object.values(Status) as [Status, ...Status[]]);

export const regimeEnum = pgEnum('regime', Object.values(Regime) as [Regime, ...Regime[]]);

export const submissionTypeEnum = pgEnum(
  'submission_type',
  Object.values(SubmissionType) as [SubmissionType, ...SubmissionType[]],
);

export const mtdSubmissionStatusEnum = pgEnum(
  'mtd_submission_status',
  Object.values(MtdSubmissionStatus) as [MtdSubmissionStatus, ...MtdSubmissionStatus[]],
);

export const documentTypeEnum = pgEnum(
  'document_type',
  Object.values(DocumentType) as [DocumentType, ...DocumentType[]],
);

export const practice = pgTable('practice', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  clerkUserId: text().unique(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const client = pgTable(
  'client',
  {
    id: uuid().primaryKey().defaultRandom(),
    practiceId: uuid()
      .notNull()
      .references(() => practice.id, { onDelete: 'restrict' }),
    firstName: text().notNull(),
    lastName: text().notNull(),
    niNumber: text().notNull(),
    email: text(),
    phoneNumber: text(),
    notes: text(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('client_practice_id_idx').on(table.practiceId),
    unique().on(table.practiceId, table.niNumber),
  ],
);

export const taxReturn = pgTable(
  'tax_return',
  {
    id: uuid().primaryKey().defaultRandom(),
    practiceId: uuid()
      .notNull()
      .references(() => practice.id, { onDelete: 'restrict' }),
    clientId: uuid()
      .notNull()
      .references(() => client.id, { onDelete: 'restrict' }),
    taxYear: integer().notNull(),
    regime: regimeEnum().notNull(),
    status: statusEnum().notNull(),
    approvedAt: timestamp(),
    approvedBy: text(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('tax_return_practice_id_idx').on(table.practiceId),
    unique().on(table.clientId, table.taxYear, table.regime),
  ],
);

export const mtdSubmission = pgTable(
  'mtd_submission',
  {
    id: uuid().primaryKey().defaultRandom(),
    practiceId: uuid()
      .notNull()
      .references(() => practice.id, { onDelete: 'restrict' }),
    taxReturnId: uuid()
      .notNull()
      .references(() => taxReturn.id, { onDelete: 'cascade' }),
    submissionType: submissionTypeEnum().notNull(),
    status: mtdSubmissionStatusEnum().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('mtd_submission_practice_id_idx').on(table.practiceId),
    unique().on(table.taxReturnId, table.submissionType),
  ],
);

export const checklistItem = pgTable(
  'checklist_item',
  {
    id: uuid().primaryKey().defaultRandom(),
    practiceId: uuid()
      .notNull()
      .references(() => practice.id, { onDelete: 'restrict' }),
    taxReturnId: uuid()
      .notNull()
      .references(() => taxReturn.id, { onDelete: 'cascade' }),
    documentType: documentTypeEnum().notNull(),
    label: text().notNull(),
    done: boolean().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('checklist_item_practice_id_idx').on(table.practiceId)],
);

export const document = pgTable(
  'document',
  {
    id: uuid().primaryKey().defaultRandom(),
    practiceId: uuid()
      .notNull()
      .references(() => practice.id, { onDelete: 'restrict' }),
    checklistItemId: uuid()
      .notNull()
      .references(() => checklistItem.id, { onDelete: 'cascade' }),
    r2Key: text().notNull(),
    originalFileName: text().notNull(),
    mimeType: text().notNull(),
    size: integer().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('document_practice_id_idx').on(table.practiceId),
    unique().on(table.checklistItemId),
  ],
);

export const practiceRelations = relations(practice, ({ many }) => ({
  clients: many(client),
}));

export const clientRelations = relations(client, ({ many }) => ({
  taxReturns: many(taxReturn),
}));

export const taxReturnRelations = relations(taxReturn, ({ one, many }) => ({
  client: one(client, {
    fields: [taxReturn.clientId],
    references: [client.id],
  }),
  mtdSubmissions: many(mtdSubmission),
  checklistItems: many(checklistItem),
}));

export const mtdSubmissionRelations = relations(mtdSubmission, ({ one }) => ({
  taxReturn: one(taxReturn, {
    fields: [mtdSubmission.taxReturnId],
    references: [taxReturn.id],
  }),
}));

export const checklistItemRelations = relations(checklistItem, ({ one }) => ({
  taxReturn: one(taxReturn, {
    fields: [checklistItem.taxReturnId],
    references: [taxReturn.id],
  }),
  document: one(document, {
    fields: [checklistItem.id],
    references: [document.checklistItemId],
  }),
}));

export const documentRelations = relations(document, ({ one }) => ({
  checklistItem: one(checklistItem, {
    fields: [document.checklistItemId],
    references: [checklistItem.id],
  }),
}));

export const r2PendingDelete = pgTable(
  'r2_pending_delete',
  {
    id: uuid().primaryKey().defaultRandom(),
    practiceId: uuid()
      .notNull()
      .references(() => practice.id, { onDelete: 'restrict' }),
    r2Key: text().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [unique().on(table.r2Key)],
);
