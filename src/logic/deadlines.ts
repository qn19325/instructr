import type { DeadlineEntry } from '@/types/calendar';
import type { Client, MTDSubmission, TaxReturn } from '@/types/clients';
import { MtdSubmissionStatus, Regime, Status, SubmissionType } from '@/types/clients';

export const mtdSubmissionTypes: SubmissionType[] = [
  SubmissionType.q_1,
  SubmissionType.q_2,
  SubmissionType.q_3,
  SubmissionType.q_4,
];

export function sa100Deadline(taxYear: number): Date {
  return new Date(Date.UTC(taxYear + 1, 0, 31));
}

export function mtdSubmissionDeadlines(
  taxYear: number,
): { submissionType: SubmissionType; deadline: Date }[] {
  return [
    { submissionType: SubmissionType.q_1, deadline: new Date(Date.UTC(taxYear, 7, 7)) },
    { submissionType: SubmissionType.q_2, deadline: new Date(Date.UTC(taxYear, 10, 7)) },
    { submissionType: SubmissionType.q_3, deadline: new Date(Date.UTC(taxYear + 1, 1, 7)) },
    { submissionType: SubmissionType.q_4, deadline: new Date(Date.UTC(taxYear + 1, 4, 7)) },
  ];
}

export function nextDeadline(taxReturn: TaxReturn): Date | null {
  if (taxReturn.regime === Regime.sa100) {
    return taxReturn.status !== Status.filed ? sa100Deadline(taxReturn.taxYear) : null;
  }
  const unfiledSubmission = firstUnfiledSubmission(taxReturn.submissions);
  if (!unfiledSubmission) return null;
  const deadlines = mtdSubmissionDeadlines(taxReturn.taxYear);
  const match = deadlines.find((d) => d.submissionType === unfiledSubmission.submissionType);
  if (!match) throw new Error(`No deadline for submissionType ${unfiledSubmission.submissionType}`);
  return match.deadline;
}

export function getDeadlineEntries(clients: Client[]): DeadlineEntry[] {
  const deadlineEntries: DeadlineEntry[] = clients.flatMap((client) => {
    return client.taxReturns.flatMap((taxReturn): DeadlineEntry[] => {
      if (taxReturn.regime === Regime.mtd) {
        const submissionDeadlines = mtdSubmissionDeadlines(taxReturn.taxYear);
        return taxReturn.submissions
          .filter((s) => mtdSubmissionTypes.includes(s.submissionType))
          .map((submission) => {
            const submissionDeadline = submissionDeadlines.find(
              (deadline) => deadline.submissionType === submission.submissionType,
            );
            if (!submissionDeadline) {
              throw new Error(`No deadline for submissionType ${submission.submissionType}`);
            }

            return {
              name: `${client.firstName} ${client.lastName}`,
              id: submission.id,
              clientId: client.id,
              status: submission.status,
              deadline: submissionDeadline.deadline,
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

export const mtdPeriod: Record<SubmissionType, (y: number) => string> = {
  q_1: (y) => `6 Apr - 5 Jul ${y}`,
  q_2: (y) => `6 Jul - 5 Oct ${y}`,
  q_3: (y) => `6 Oct ${y} - 5 Jan ${y + 1}`,
  q_4: (y) => `6 Jan - 5 Apr ${y + 1}`,
  eops: (y) => `${y}-${y + 1}`,
  final_declaration: (y) => `${y}-${y + 1}`,
};

export const mtdLabel: Record<SubmissionType, string> = {
  q_1: 'Q1',
  q_2: 'Q2',
  q_3: 'Q3',
  q_4: 'Q4',
  eops: 'EOPS',
  final_declaration: 'Final Declaration',
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

function firstUnfiledSubmission(submissions: MTDSubmission[]): MTDSubmission | undefined {
  return submissions
    .filter((s) => mtdSubmissionTypes.includes(s.submissionType))
    .find((s) => s.status !== MtdSubmissionStatus.submitted);
}
