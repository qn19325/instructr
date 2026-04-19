import { date, integer, pgTable, text, uuid, pgEnum, boolean } from 'drizzle-orm/pg-core';

export const statusEnum = pgEnum('status', [
  'not_started',
  'in_progress',
  'awaiting_client',
  'ready_to_file',
  'filed',
]);

export const regimeEnum = pgEnum('regime', ['MTD', 'SA100']);

export const submissionTypeEnum = pgEnum('submission_type', [
  'q_1',
  'q_2',
  'q_3',
  'q_4',
  'eops',
  'final_declaration',
]);

export const practice = pgTable('practice', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
});

export const client = pgTable('client', {
  id: uuid().primaryKey().defaultRandom(),
  practiceId: uuid()
    .notNull()
    .references(() => practice.id),
  firstName: text().notNull(),
  lastName: text().notNull(),
  niNumber: text().notNull(),
  email: text().notNull(),
  phoneNumber: text(),
});

export const taxReturn = pgTable('tax_return', {
  id: uuid().primaryKey().defaultRandom(),
  practiceId: uuid()
    .notNull()
    .references(() => practice.id),
  clientId: uuid()
    .notNull()
    .references(() => client.id),
  taxYear: integer().notNull(),
  regime: regimeEnum().notNull(),
  status: statusEnum().notNull(),
  deadline: date().notNull(),
});

export const mtdSubmission = pgTable('mtd_submission', {
  id: uuid().primaryKey().defaultRandom(),
  practiceId: uuid()
    .notNull()
    .references(() => practice.id),
  taxReturnId: uuid()
    .notNull()
    .references(() => taxReturn.id),
  submissionType: submissionTypeEnum().notNull(),
  deadline: date().notNull(),
  status: statusEnum().notNull(),
});

export const checklistItem = pgTable('checklist_item', {
  id: uuid().primaryKey().defaultRandom(),
  practiceId: uuid()
    .notNull()
    .references(() => practice.id),
  taxReturnId: uuid()
    .notNull()
    .references(() => taxReturn.id),
  documentType: text().notNull(),
  label: text().notNull(),
  done: boolean().notNull(),
});
