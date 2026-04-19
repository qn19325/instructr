import { DeadlineEntry } from '@/types/calendarModels';
import { Client } from '@/types/clients';

export function getDeadlineEntries(clients: Client[]): DeadlineEntry[] {
  const deadlineEntries: DeadlineEntry[] = clients.flatMap((client) => {
    return client.taxReturns.map((taxReturn) => {
      if (taxReturn.type === 'MTD') {
        return {
          name: `${client.firstName} ${client.lastName}`,
          id: taxReturn.id,
          deadline: taxReturn.deadline,
          status: taxReturn.status,
          startTaxYear: taxReturn.startTaxYear,
          type: taxReturn.type,
          submissionType: taxReturn.submissionType,
          taxYearLabel: `${taxReturn.startTaxYear}/${taxReturn.startTaxYear + 1}`,
        };
      }

      return {
        name: `${client.firstName} ${client.lastName}`,
        id: taxReturn.id,
        deadline: taxReturn.deadline,
        status: taxReturn.status,
        startTaxYear: taxReturn.startTaxYear,
        type: taxReturn.type,
        taxYearLabel: `${taxReturn.startTaxYear}/${taxReturn.startTaxYear + 1}`,
      };
    });
  });
  return deadlineEntries.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
}
