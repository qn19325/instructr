export const Regime = {
  SA100: 'SA100',
  MTD: 'MTD',
} as const;
export type Regime = (typeof Regime)[keyof typeof Regime];

export const Status = {
  not_started: 'not_started',
  in_progress: 'in_progress',
  awaiting_client: 'awaiting_client',
  ready_to_file: 'ready_to_file',
  filed: 'filed',
} as const;

type Status = (typeof Status)[keyof typeof Status];

export interface Client {
  id: string;
  nINumber: string; // e.g. AB 12 34 56 C
  name: string;
  email: string;
  taxReturns: TaxReturn[];
  regimeType: Regime;
}

export interface TaxReturn {
  deadline: Date;
  status: Status;
  startTaxYear: number;
}
