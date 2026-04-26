import { Status, SubmissionType } from './clients';

interface DeadlineEntryBase {
  name: string;
  id: string;
  deadline: Date;
  status: Status;
  startTaxYear: number;
  taxYearLabel: string;
}

export interface MTDDeadlineEntry extends DeadlineEntryBase {
  type: 'mtd';
  submissionType: SubmissionType;
}

export interface SA100DeadlineEntry extends DeadlineEntryBase {
  type: 'sa100';
}

export type DeadlineEntry = MTDDeadlineEntry | SA100DeadlineEntry;
