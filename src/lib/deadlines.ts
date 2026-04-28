import { DeadlineEntry } from '@/types/calendarModels';
import { Client, MTDTaxReturn, SA100TaxReturn, SubmissionType } from '@/types/clients';

const SA100_MMDD = '01-31';
const MTD_Q1_MMDD = '08-07';
const MTD_Q2_MMDD = '11-07';
const MTD_Q3_MMDD = '02-07';
const MTD_Q4_MMDD = '05-07';
const TAX_YEAR_DEADLINE_MONTH_NUM = 3;
const TAX_YEAR_DEADLINE_DAY_NUM = 5;

export function sa100Deadline(taxYear: number): string {
  return `${taxYear + 1}-${SA100_MMDD}`;
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
    return (client.taxReturns as (SA100TaxReturn | MTDTaxReturn)[]).flatMap(
      (taxReturn): DeadlineEntry[] => {
        if (taxReturn.type === 'mtd') {
          return taxReturn.submissions.map((submission) => ({
            name: `${client.firstName} ${client.lastName}`,
            id: submission.id,
            deadline: submission.deadline,
            status: submission.status,
            startTaxYear: taxReturn.startTaxYear,
            type: taxReturn.type,
            submissionType: submission.submissionType,
            taxYearLabel: `${taxReturn.startTaxYear}/${taxReturn.startTaxYear + 1}`,
          }));
        }

        return [
          {
            name: `${client.firstName} ${client.lastName}`,
            id: taxReturn.id,
            deadline: taxReturn.deadline,
            status: taxReturn.status,
            startTaxYear: taxReturn.startTaxYear,
            type: taxReturn.type,
            taxYearLabel: `${taxReturn.startTaxYear}/${taxReturn.startTaxYear + 1}`,
          },
        ];
      },
    );
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
