import { DeadlineEntry } from '@/types/calendarModels';
import { Client, MTDTaxReturn, SA100TaxReturn } from '@/types/clients';

export function getDeadlineEntries(clients: Client[]): DeadlineEntry[] {
  const deadlineEntries: DeadlineEntry[] = clients.flatMap((client) => {
    return (client.taxReturns as (SA100TaxReturn | MTDTaxReturn)[]).flatMap(
      (taxReturn): DeadlineEntry[] => {
        if (taxReturn.type === 'MTD') {
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
  if (today.getMonth() < 3 || (today.getMonth() === 3 && today.getDate() < 6)) {
    return today.getFullYear() - 1;
  }

  return today.getFullYear();
}
