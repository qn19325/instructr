import {
  type Client,
  type ChecklistItem,
  type MtdSubmissionStatus,
  Regime,
  type Status,
  type SubmissionType,
  type TaxReturn,
} from '@/types/clients';

export type ChecklistItemRow = {
  id: string;
  label: string;
  done: boolean;
  document: {
    id: string;
    originalFileName: string;
    mimeType: string;
    size: number;
  } | null;
};

export type TaxReturnRow = {
  id: string;
  taxYear: number;
  regime: Regime;
  status: Status;
  mtdSubmissions: { id: string; submissionType: SubmissionType; status: MtdSubmissionStatus }[];
  checklistItems: ChecklistItemRow[];
};

export type ClientRow = {
  id: string;
  niNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string | null;
  notes: string | null;
  taxReturns: TaxReturnRow[];
};

export function mapChecklist(items: ChecklistItemRow[]): ChecklistItem[] {
  return items.map((item) => ({
    id: item.id,
    text: item.label,
    done: item.done,
    document: item.document
      ? {
          id: item.document.id,
          originalFileName: item.document.originalFileName,
          mimeType: item.document.mimeType,
          size: item.document.size,
        }
      : undefined,
  }));
}

export function mapTaxReturn(row: TaxReturnRow): TaxReturn {
  if (row.regime === Regime.mtd) {
    return {
      regime: Regime.mtd,
      id: row.id,
      taxYear: row.taxYear,
      status: row.status,
      submissions: row.mtdSubmissions.map((submission) => ({
        id: submission.id,
        submissionType: submission.submissionType,
        status: submission.status,
      })),
      checklist: mapChecklist(row.checklistItems),
    };
  }
  return {
    regime: Regime.sa100,
    id: row.id,
    taxYear: row.taxYear,
    status: row.status,
    checklist: mapChecklist(row.checklistItems),
  };
}

export function mapClient(row: ClientRow): Client {
  return {
    id: row.id,
    niNumber: row.niNumber,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phoneNumber: row.phoneNumber,
    taxReturns: row.taxReturns.map(mapTaxReturn),
    notes: row.notes,
  };
}
