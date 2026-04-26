import { relations } from 'drizzle-orm';
import {
  date,
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

export const statusEnum = pgEnum('status', [
  'not_started',
  'in_progress',
  'awaiting_client',
  'ready_to_file',
  'filed',
]);

export const regimeEnum = pgEnum('regime', ['mtd', 'sa100']);

export const submissionTypeEnum = pgEnum('submission_type', [
  'q_1',
  'q_2',
  'q_3',
  'q_4',
  'eops',
  'final_declaration',
]);

export const documentTypeEnum = pgEnum('document_type', [
  'p60',
  'p11d',
  'bank_statements',
  'self_employment',
  'rental',
  'dividends',
  'pension',
  'capital_gains',
  'income',
  'expenses',
  'mileage_log',
]);

export const practice = pgTable('practice', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
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
    email: text().notNull(),
    phoneNumber: text(),
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
    deadline: date().notNull(),
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
    deadline: date().notNull(),
    status: statusEnum().notNull(),
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
}));
