// TODO: break apart into api models and internal models

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

export const SubmissionType = {
  q_1: 'q_1',
  q_2: 'q_2',
  q_3: 'q_3',
  q_4: 'q_4',
  eops: 'eops',
  final_declaration: 'final_declaration',
} as const;
export type SubmissionType = (typeof SubmissionType)[keyof typeof SubmissionType];

export interface ClientBase {
  id: string;
  niNumber: string; // e.g. AB 12 34 56 C
  firstName: string;
  lastName: string;
  email: string;
}

export interface Client extends ClientBase {
  taxReturns: (SA100TaxReturn | MTDTaxReturn)[];
}

interface TaxReturn {
  id: string;
  startTaxYear: number;
  checklist: ChecklistItem[];
  status: Status;
}

export interface MTDTaxReturn extends TaxReturn {
  type: 'mtd';
  submissions: MTDSubmission[];
}

export interface MTDSubmission {
  submissionType: SubmissionType;
  id: string;
  deadline: Date;
  status: Status;
}

export interface SA100TaxReturn extends TaxReturn {
  type: 'sa100';
  deadline: Date;
}

export interface ChecklistItem {
  text: string;
  done: boolean;
}
