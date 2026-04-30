import { Client, Status, MtdSubmissionStatus, SA100TaxReturn, MTDTaxReturn } from '@/types/clients';
import { formatDeadline } from './deadlines';

export function nextUnfiledReturn(client: Client): SA100TaxReturn | MTDTaxReturn | null {
  const unfiledReturn = client.taxReturns.find((taxReturn) => taxReturn.status !== Status.filed);

  return unfiledReturn || null;
}

export function nextDeadline(taxReturn: SA100TaxReturn | MTDTaxReturn): string {
  if (taxReturn.type === 'sa100') {
    return formatDeadline(taxReturn.deadline);
  } else {
    const unfiledSubmission = taxReturn.submissions.find(
      (submission) => submission.status !== MtdSubmissionStatus.submitted,
    );
    return unfiledSubmission ? formatDeadline(unfiledSubmission.deadline) : '';
  }
}
