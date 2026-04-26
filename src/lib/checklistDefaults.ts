import type { InferInsertModel } from 'drizzle-orm';
import type { checklistItem } from '@/db/schema';

export const DocumentType = {
  p60: 'p60',
  p11d: 'p11d',
  bank_statements: 'bank_statements',
  self_employment: 'self_employment',
  rental: 'rental',
  dividends: 'dividends',
  pension: 'pension',
  capital_gains: 'capital_gains',
  income: 'income',
  expenses: 'expenses',
  mileage_log: 'mileage_log',
} as const;

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

type ChecklistDefault = Pick<InferInsertModel<typeof checklistItem>, 'documentType' | 'label'>;

export const sa100Checklist: ChecklistDefault[] = [
  { documentType: DocumentType.p60, label: 'P60 (employment income)' },
  { documentType: DocumentType.p11d, label: 'P11D (benefits in kind, if applicable)' },
  { documentType: DocumentType.bank_statements, label: 'Bank statements' },
  { documentType: DocumentType.self_employment, label: 'Self-employment income and expenses' },
  { documentType: DocumentType.rental, label: 'Rental income and expenses' },
  { documentType: DocumentType.dividends, label: 'Dividend certificates' },
  { documentType: DocumentType.pension, label: 'Pension contribution statements' },
  { documentType: DocumentType.capital_gains, label: 'Capital gains records' },
];

export const mtdChecklist: ChecklistDefault[] = [
  { documentType: DocumentType.income, label: 'Sales/income records' },
  { documentType: DocumentType.expenses, label: 'Business expense receipts' },
  { documentType: DocumentType.bank_statements, label: 'Bank statements' },
  { documentType: DocumentType.mileage_log, label: 'Mileage log (if claiming vehicle expenses)' },
];
