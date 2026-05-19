'use server';

import { revalidatePath } from 'next/cache';

import { runFormAction } from '@/app/_lib/runFormAction';
import { getCurrentPracticeId } from '@/infra/auth';
import { getCurrentDb } from '@/infra/db';
import { updateChecklistItemSchema, updateInputSchema, updateNotesSchema } from '@/schemas/clients';
import { taxReturnInputSchema, updateTaxReturnStatusSchema } from '@/schemas/tax-return';
import * as clientService from '@/service/clients';
import * as documentService from '@/service/documents';
import type { ActionResult } from '@/types/actions';
import type { Status } from '@/types/clients';

export async function getUploadUrl(checklistItemId: string, mimeType: string, size: number) {
  const db = await getCurrentDb();
  const practiceId = await getCurrentPracticeId();
  return documentService.prepareUpload(db, practiceId, checklistItemId, { mimeType, size });
}

export async function recordUpload(
  checklistItemId: string,
  documentKey: string,
  originalFileName: string,
  mimeType: string,
  size: number,
): Promise<ActionResult> {
  const db = await getCurrentDb();
  const practiceId = await getCurrentPracticeId();
  try {
    await documentService.completeUpload(db, practiceId, checklistItemId, documentKey, {
      mimeType,
      size,
      originalFileName,
    });
    await clientService.setItemDone(db, practiceId, checklistItemId, true);
    revalidatePath('/clients', 'layout');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to upload document' };
  }
}

export async function getDocumentDownloadUrl(documentId: string): Promise<string> {
  const db = await getCurrentDb();
  const practiceId = await getCurrentPracticeId();
  return documentService.getDocumentDownloadUrl(db, practiceId, documentId);
}

export async function createTaxReturn(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const input = {
    clientId: formData.get('clientId'),
    taxYear: formData.get('taxYear'),
    regime: formData.get('regime'),
  };

  return runFormAction(
    taxReturnInputSchema,
    input,
    async (parsed, db, practiceId) => {
      await clientService.insertTaxReturn(db, practiceId, parsed);
      revalidatePath(`/clients/${parsed.clientId}`);
    },
    { genericError: 'Failed to create tax return' },
  );
}

export async function editClient(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const input = {
    clientId: formData.get('clientId'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    niNumber: formData.get('niNumber'),
    email: formData.get('email'),
    phoneNumber: formData.get('phoneNumber'),
  };

  return runFormAction(
    updateInputSchema,
    input,
    async (parsed, db, practiceId) => {
      await clientService.updateClient(db, practiceId, parsed);
      revalidatePath(`/clients/${parsed.clientId}`);
    },
    {
      genericError: 'Failed to edit client',
      duplicateError: 'A client with this NI number already exists',
    },
  );
}

export async function saveNotes(
  clientId: string,
  notes: string | undefined,
): Promise<ActionResult> {
  const input = { clientId, notes };

  return runFormAction(
    updateNotesSchema,
    input,
    async (parsed, db, practiceId) => {
      await clientService.updateClientNotes(db, practiceId, parsed);
      revalidatePath(`/clients/${clientId}`);
    },
    {
      genericError: 'Failed to save notes',
    },
  );
}

export async function toggleChecklistItem(
  checklistItemId: string,
  clientId: string,
  done: boolean,
): Promise<ActionResult> {
  const input = { clientId, checklistItemId };

  return runFormAction(
    updateChecklistItemSchema,
    input,
    async (parsed, db, practiceId) => {
      await clientService.setItemDone(
        db,
        practiceId,
        parsed.checklistItemId,
        done,
        parsed.clientId,
      );
      revalidatePath(`/clients/${clientId}`);
    },
    { genericError: 'Failed to toggle checklist item status' },
  );
}

export async function changeTaxReturnStatus(
  taxReturnId: string,
  clientId: string,
  status: Status,
): Promise<ActionResult> {
  const input = { clientId, taxReturnId, status };

  return runFormAction(
    updateTaxReturnStatusSchema,
    input,
    async (parsed, db, practiceId) => {
      await clientService.changeTaxReturnStatus(db, practiceId, parsed);
      revalidatePath(`/clients/${clientId}`);
    },
    { genericError: 'Failed to update tax return status' },
  );
}
