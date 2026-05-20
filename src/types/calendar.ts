import type { Regime, Status, MtdSubmissionStatus, SubmissionTypeQuarters } from './clients';

interface DeadlineEntryBase {
  name: string;
  id: string;
  clientId: string;
  deadline: Date;
  taxYear: number;
}

export interface MTDDeadlineEntry extends DeadlineEntryBase {
  regime: typeof Regime.mtd;
  status: MtdSubmissionStatus;
  submissionType: SubmissionTypeQuarters;
}

export interface SA100DeadlineEntry extends DeadlineEntryBase {
  regime: typeof Regime.sa100;
  status: Status;
}

export type DeadlineEntry = MTDDeadlineEntry | SA100DeadlineEntry;
