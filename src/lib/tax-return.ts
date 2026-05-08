import { DeadlineEntry } from '@/types/calendarModels';
import {
  Client,
  Status,
  Regime,
  SubmissionType,
  TaxReturn,
  MTDSubmission,
  MtdSubmissionStatus,
} from '@/types/clients';

const MTD_Q1_MMDD = '08-07';
const MTD_Q2_MMDD = '11-07';
const MTD_Q3_MMDD = '02-07';
const MTD_Q4_MMDD = '05-07';
const TAX_YEAR_DEADLINE_MONTH_NUM = 4;
const TAX_YEAR_DEADLINE_DAY_NUM = 5;

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

export function isFiled(taxReturn: TaxReturn): boolean {
  return taxReturn.status === Status.filed;
}

export function regimeLabel(taxReturn: TaxReturn): string {
  return taxReturn.regime === Regime.mtd ? 'MTD' : 'SA100';
}

export function getDeadlineEntries(clients: Client[]): DeadlineEntry[] {
  const deadlineEntries: DeadlineEntry[] = clients.flatMap((client) => {
    return client.taxReturns.flatMap((taxReturn): DeadlineEntry[] => {
      if (taxReturn.regime === Regime.mtd) {
        const submissionDeadlines = mtdSubmissionDeadlines(taxReturn.taxYear);
        return taxReturn.submissions.map((submission) => {
          const submissionDeadline = submissionDeadlines.find(
            (deadline) => deadline.submissionType === submission.submissionType,
          );
          if (!submissionDeadline) {
            throw new Error(`No deadline for submissionType ${submission.submissionType}`);
          }

          return {
            name: `${client.firstName} ${client.lastName}`,
            id: submission.id,
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

export function firstUnfiledReturn(taxReturns: TaxReturn[]): TaxReturn | undefined {
  return taxReturns.find((taxReturn) => taxReturn.status !== Status.filed);
}

export function formatDeadline(d: Date): string {
  return d.toLocaleDateString('en-GB', { timeZone: 'UTC' });
}

export function currentTaxYear(today: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(today);

  const year = Number(parts.find((p) => p.type === 'year')!.value);
  const month = Number(parts.find((p) => p.type === 'month')!.value);
  const day = Number(parts.find((p) => p.type === 'day')!.value);

  if (
    month < TAX_YEAR_DEADLINE_MONTH_NUM ||
    (month === TAX_YEAR_DEADLINE_MONTH_NUM && day <= TAX_YEAR_DEADLINE_DAY_NUM)
  ) {
    return year - 1;
  }
  return year;
}

export function mtdSubmissionTypes(): SubmissionType[] {
  return [SubmissionType.q_1, SubmissionType.q_2, SubmissionType.q_3, SubmissionType.q_4];
}

export function mtdSubmissionDeadlines(
  taxYear: number,
): { submissionType: SubmissionType; deadline: Date }[] {
  return [
    { submissionType: SubmissionType.q_1, deadline: new Date(`${taxYear}-${MTD_Q1_MMDD}`) },
    { submissionType: SubmissionType.q_2, deadline: new Date(`${taxYear}-${MTD_Q2_MMDD}`) },
    { submissionType: SubmissionType.q_3, deadline: new Date(`${taxYear + 1}-${MTD_Q3_MMDD}`) },
    { submissionType: SubmissionType.q_4, deadline: new Date(`${taxYear + 1}-${MTD_Q4_MMDD}`) },
  ];
}

function firstUnfiledSubmission(submissions: MTDSubmission[]): MTDSubmission | undefined {
  return submissions.find((submission) => submission.status !== MtdSubmissionStatus.submitted);
}

function sa100Deadline(taxYear: number): Date {
  return new Date(Date.UTC(taxYear + 1, 0, 31));
}
