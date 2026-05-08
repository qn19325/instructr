import { Regime, Status, MtdSubmissionStatus, SubmissionType } from './clients';

interface DeadlineEntryBase {
  name: string;
  id: string;
  deadline: Date;
  taxYear: number;
}

export interface MTDDeadlineEntry extends DeadlineEntryBase {
  regime: typeof Regime.mtd;
  status: MtdSubmissionStatus;
  submissionType: SubmissionType;
}

export interface SA100DeadlineEntry extends DeadlineEntryBase {
  regime: typeof Regime.sa100;
  status: Status;
}

export type DeadlineEntry = MTDDeadlineEntry | SA100DeadlineEntry;
