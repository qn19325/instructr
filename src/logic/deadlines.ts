import type { DeadlineEntry } from '@/types/calendar';
import type {
  Client,
  MTDSubmission,
  MTDSubmissionQuarters,
  SubmissionTypeQuarters,
  TaxReturn,
} from '@/types/clients';
import { MtdSubmissionStatus, Regime, Status, SubmissionType } from '@/types/clients';

export const mtdSubmissionTypesQuarters: SubmissionTypeQuarters[] = [
  SubmissionType.q_1,
  SubmissionType.q_2,
  SubmissionType.q_3,
  SubmissionType.q_4,
];

export function sa100Deadline(taxYear: number): Date {
  return new Date(Date.UTC(taxYear + 2, 0, 31));
}

const mtdSubmissionDeadlineValues: Record<
  SubmissionTypeQuarters,
  { monthIdx: number; day: number; nextYear: boolean }
> = {
  q_1: { monthIdx: 7, day: 7, nextYear: false },
  q_2: { monthIdx: 10, day: 7, nextYear: false },
  q_3: { monthIdx: 1, day: 7, nextYear: true },
  q_4: { monthIdx: 4, day: 7, nextYear: true },
};

function isQuarterlyType(s: SubmissionType): s is SubmissionTypeQuarters {
  return s !== SubmissionType.eops && s !== SubmissionType.final_declaration;
}

function mtdDeadlineDate(submissionType: SubmissionTypeQuarters, taxYear: number): Date {
  const { monthIdx, day, nextYear } = mtdSubmissionDeadlineValues[submissionType];
  return new Date(Date.UTC(taxYear + (nextYear ? 1 : 0), monthIdx, day));
}

export function mtdSubmissionDeadlines(taxYear: number): {
  submissionType: SubmissionTypeQuarters;
  deadline: Date;
}[] {
  return mtdSubmissionTypesQuarters.map((submissionType) => ({
    submissionType,
    deadline: mtdDeadlineDate(submissionType, taxYear),
  }));
}

export function nextDeadline(taxReturn: TaxReturn): Date | null {
  if (taxReturn.regime === Regime.sa100) {
    return taxReturn.status !== Status.filed ? sa100Deadline(taxReturn.taxYear) : null;
  }
  const unfiledSubmission = firstUnfiledSubmission(taxReturn.submissions);
  if (!unfiledSubmission) return null;
  return mtdDeadlineDate(unfiledSubmission.submissionType, taxReturn.taxYear);
}

export function getDeadlineEntries(clients: Client[]): DeadlineEntry[] {
  const deadlineEntries: DeadlineEntry[] = clients.flatMap((client) => {
    return client.taxReturns.flatMap((taxReturn): DeadlineEntry[] => {
      if (taxReturn.regime === Regime.mtd) {
        return taxReturn.submissions
          .filter((s): s is MTDSubmissionQuarters => isQuarterlyType(s.submissionType))
          .map((submission) => {
            return {
              name: `${client.firstName} ${client.lastName}`,
              id: submission.id,
              clientId: client.id,
              status: submission.status,
              deadline: mtdDeadlineDate(submission.submissionType, taxReturn.taxYear),
              taxYear: taxReturn.taxYear,
              regime: taxReturn.regime,
              submissionType: submission.submissionType,
            };
          });
      }

      return [
        {
          name: `${client.firstName} ${client.lastName}`,
          id: taxReturn.id,
          clientId: client.id,
          deadline: sa100Deadline(taxReturn.taxYear),
          status: taxReturn.status,
          taxYear: taxReturn.taxYear,
          regime: taxReturn.regime,
        },
      ];
    });
  });
  return deadlineEntries.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
}

export const mtdPeriod: Record<SubmissionTypeQuarters, (y: number) => string> = {
  q_1: (y) => `6 Apr - 5 Jul ${y}`,
  q_2: (y) => `6 Jul - 5 Oct ${y}`,
  q_3: (y) => `6 Oct ${y} - 5 Jan ${y + 1}`,
  q_4: (y) => `6 Jan - 5 Apr ${y + 1}`,
};

export const mtdLabel: Record<SubmissionTypeQuarters, string> = {
  q_1: 'Q1',
  q_2: 'Q2',
  q_3: 'Q3',
  q_4: 'Q4',
};

export function taxYearShort(taxYear: number): string {
  return `${taxYear}-${String(taxYear + 1).slice(-2)}`;
}

export function deadlineSubLine(entry: DeadlineEntry): string {
  const yr = taxYearShort(entry.taxYear);
  if (entry.regime === Regime.mtd) {
    return `${mtdLabel[entry.submissionType]} ${yr} · ${mtdPeriod[entry.submissionType](entry.taxYear)}`;
  }
  return `SA100 ${yr} · 6 Apr ${entry.taxYear} - 5 Apr ${entry.taxYear + 1}`;
}

export function groupDeadlinesByMonth(entries: DeadlineEntry[]): Record<string, DeadlineEntry[]> {
  return entries.reduce<Record<string, DeadlineEntry[]>>((acc, entry) => {
    const month = entry.deadline.toLocaleString('en-GB', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    (acc[month] ??= []).push(entry);
    return acc;
  }, {});
}

function firstUnfiledSubmission(submissions: MTDSubmission[]): MTDSubmissionQuarters | undefined {
  return submissions.find(
    (s): s is MTDSubmissionQuarters =>
      isQuarterlyType(s.submissionType) && s.status !== MtdSubmissionStatus.submitted,
  );
}
