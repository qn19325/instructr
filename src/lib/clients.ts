import {
  Client,
  Status,
  MtdSubmissionStatus,
  SA100TaxReturn,
  MTDTaxReturn,
  Regime,
} from '@/types/clients';

export function nextUnfiledReturn(client: Client): SA100TaxReturn | MTDTaxReturn | null {
  const unfiledReturn = client.taxReturns.find((taxReturn) => taxReturn.status !== Status.filed);

  return unfiledReturn || null;
}

export function nextDeadline(taxReturn: SA100TaxReturn | MTDTaxReturn): Date | null {
  if (taxReturn.type === Regime.sa100) {
    return taxReturn.status !== Status.filed ? taxReturn.deadline : null;
  } else {
    const unfiledSubmission = taxReturn.submissions.find(
      (submission) => submission.status !== MtdSubmissionStatus.submitted,
    );
    return unfiledSubmission?.deadline ?? null;
  }
}
