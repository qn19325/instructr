import { Document } from './documents';

export const Status = {
  not_started: 'not_started',
  in_progress: 'in_progress',
  awaiting_client: 'awaiting_client',
  ready_to_file: 'ready_to_file',
  filed: 'filed',
} as const;
export type Status = (typeof Status)[keyof typeof Status];

export const Regime = {
  mtd: 'mtd',
  sa100: 'sa100',
} as const;
export type Regime = (typeof Regime)[keyof typeof Regime];

export const MtdSubmissionStatus = {
  pending: 'pending',
  submitted: 'submitted',
  overdue: 'overdue',
} as const;
export type MtdSubmissionStatus = (typeof MtdSubmissionStatus)[keyof typeof MtdSubmissionStatus];

export const SubmissionType = {
  q_1: 'q_1',
  q_2: 'q_2',
  q_3: 'q_3',
  q_4: 'q_4',
  eops: 'eops',
  final_declaration: 'final_declaration',
} as const;
export type SubmissionType = (typeof SubmissionType)[keyof typeof SubmissionType];

export interface Client {
  id: string;
  niNumber: string; // e.g. AB 12 34 56 C
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  taxReturns: TaxReturn[];
  notes?: string;
}

export interface TaxReturnBase {
  id: string;
  taxYear: number;
  checklist: ChecklistItem[];
  status: Status;
}

export interface SA100TaxReturn extends TaxReturnBase {
  regime: typeof Regime.sa100;
}

export interface MTDTaxReturn extends TaxReturnBase {
  regime: typeof Regime.mtd;
  submissions: MTDSubmission[];
}

export type TaxReturn = SA100TaxReturn | MTDTaxReturn;

export interface MTDSubmission {
  submissionType: SubmissionType;
  id: string;
  status: MtdSubmissionStatus;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  document?: Document;
}
