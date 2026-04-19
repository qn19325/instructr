// TODO: break apart into api models and internal models

export const Status = {
  not_started: 'not_started',
  in_progress: 'in_progress',
  awaiting_client: 'awaiting_client',
  ready_to_file: 'ready_to_file',
  filed: 'filed',
} as const;

export type Status = (typeof Status)[keyof typeof Status];
export type Client = SA100Client | MTDClient;
export type Regime = 'SA100' | 'MTD';

interface ClientBase {
  id: string;
  niNumber: string; // e.g. AB 12 34 56 C
  firstName: string;
  lastName: string;
  email: string;
}

interface SA100Client extends ClientBase {
  regime: 'SA100';
  taxReturns: SA100TaxReturn[];
}

interface MTDClient extends ClientBase {
  regime: 'MTD';
  taxReturns: MTDTaxReturn[];
}

export const SubmissionType = {
  q_1: 'q_1',
  q_2: 'q_2',
  q_3: 'q_3',
  q_4: 'q_4',
  eops: 'eops',
  final_declaration: 'final_declaration',
} as const;
export type SubmissionType = (typeof SubmissionType)[keyof typeof SubmissionType];

interface TaxReturn {
  id: string;
  deadline: Date;
  status: Status;
  startTaxYear: number;
  checkList: CheckListItem[];
}

export interface MTDTaxReturn extends TaxReturn {
  type: 'MTD';
  submissionType: SubmissionType;
}

export interface SA100TaxReturn extends TaxReturn {
  type: 'SA100';
}

export interface CheckListItem {
  text: string;
  done: boolean;
}
