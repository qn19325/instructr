import { DeadlineEntry } from '@/types/calendarModels';
import { Client, Regime, SubmissionType } from '@/types/clients';

const MTD_Q1_MMDD = '08-07';
const MTD_Q2_MMDD = '11-07';
const MTD_Q3_MMDD = '02-07';
const MTD_Q4_MMDD = '05-07';
const TAX_YEAR_DEADLINE_MONTH_NUM = 3;
const TAX_YEAR_DEADLINE_DAY_NUM = 5;

export function sa100Deadline(taxYear: number): Date {
  return new Date(Date.UTC(taxYear + 1, 0, 31));
}

export function formatDeadline(d: Date): string {
  return d.toLocaleDateString('en-GB', { timeZone: 'UTC' });
}

export function mtdDeadlines(
  taxYear: number,
): { submissionType: SubmissionType; deadline: string }[] {
  return [
    { submissionType: SubmissionType.q_1, deadline: `${taxYear}-${MTD_Q1_MMDD}` },
    { submissionType: SubmissionType.q_2, deadline: `${taxYear}-${MTD_Q2_MMDD}` },
    { submissionType: SubmissionType.q_3, deadline: `${taxYear + 1}-${MTD_Q3_MMDD}` },
    { submissionType: SubmissionType.q_4, deadline: `${taxYear + 1}-${MTD_Q4_MMDD}` },
  ];
}

export function getDeadlineEntries(clients: Client[]): DeadlineEntry[] {
  const deadlineEntries: DeadlineEntry[] = clients.flatMap((client) => {
    return client.taxReturns.flatMap((taxReturn): DeadlineEntry[] => {
      if (taxReturn.type === Regime.mtd) {
        return taxReturn.submissions.map((submission) => ({
          name: `${client.firstName} ${client.lastName}`,
          id: submission.id,
          deadline: submission.deadline,
          status: submission.status,
          taxYear: taxReturn.taxYear,
          type: taxReturn.type,
          submissionType: submission.submissionType,
        }));
      }

      return [
        {
          name: `${client.firstName} ${client.lastName}`,
          id: taxReturn.id,
          deadline: taxReturn.deadline,
          status: taxReturn.status,
          taxYear: taxReturn.taxYear,
          type: taxReturn.type,
        },
      ];
    });
  });
  return deadlineEntries.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
}

export function currentTaxYear(today: Date = new Date()): number {
  if (
    today.getMonth() < TAX_YEAR_DEADLINE_MONTH_NUM ||
    (today.getMonth() === TAX_YEAR_DEADLINE_MONTH_NUM &&
      today.getDate() <= TAX_YEAR_DEADLINE_DAY_NUM)
  ) {
    return today.getFullYear() - 1;
  }

  return today.getFullYear();
}
