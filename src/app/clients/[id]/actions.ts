'use server';

import { ArkErrors } from 'arktype';
import { revalidatePath } from 'next/cache';

import { getCurrentPracticeId } from '@/infra/auth';
import { updateChecklistItemSchema, updateInputSchema, updateNotesSchema } from '@/schemas/clients';
import { taxReturnInputSchema, updateTaxReturnStatusSchema } from '@/schemas/tax-return';
import * as clientService from '@/service/clients';
import * as documentService from '@/service/documents';
import { ServiceError } from '@/service/errors';
import type { ActionResult } from '@/types/actions';
import type { Status } from '@/types/clients';

export async function getUploadUrl(checklistItemId: string, mimeType: string, size: number) {
  const practiceId = await getCurrentPracticeId();
  return documentService.prepareUpload(practiceId, checklistItemId, { mimeType, size });
}

export async function recordUpload(
  checklistItemId: string,
  documentKey: string,
  originalFileName: string,
  mimeType: string,
  size: number,
): Promise<ActionResult> {
  const practiceId = await getCurrentPracticeId();
  try {
    await documentService.completeUpload(practiceId, checklistItemId, documentKey, {
      mimeType,
      size,
      originalFileName,
    });
    await clientService.markItemReceived(practiceId, checklistItemId);
    revalidatePath('/clients', 'layout');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to upload document' };
  }
}

export async function getDocumentDownloadUrl(documentId: string): Promise<string> {
  const practiceId = await getCurrentPracticeId();
  return documentService.getDocumentDownloadUrl(practiceId, documentId);
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

  const parsed = taxReturnInputSchema(input);
  if (parsed instanceof ArkErrors) {
    const fieldErrors = Object.fromEntries(parsed.map((err) => [err.path.join('.'), err.message]));
    return { success: false, error: 'Validation failed', fieldErrors };
  }

  const practiceId = await getCurrentPracticeId();
  try {
    await clientService.insertTaxReturn(practiceId, parsed);
    revalidatePath(`/clients/${parsed.clientId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof ServiceError) return { success: false, error: error.message };
    console.error('createTaxReturn failed:', error);
    return { success: false, error: 'Failed to create tax return' };
  }
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

  const parsed = updateInputSchema(input);
  if (parsed instanceof ArkErrors) {
    const fieldErrors = Object.fromEntries(parsed.map((err) => [err.path.join('.'), err.message]));
    return { success: false, error: 'Validation failed', fieldErrors };
  }

  const practiceId = await getCurrentPracticeId();
  try {
    await clientService.updateClient(practiceId, parsed);
    revalidatePath(`/clients/${parsed.clientId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof ServiceError) return { success: false, error: error.message };
    if (error instanceof Error && 'code' in error && error.code === '23505') {
      return { success: false, error: 'A client with this NI number already exists' };
    }
    console.error('editClient failed:', error);
    return { success: false, error: 'Failed to edit client' };
  }
}

export async function saveNotes(
  clientId: string,
  notes: string | undefined,
): Promise<ActionResult> {
  const input = { clientId, notes };

  const parsed = updateNotesSchema(input);
  if (parsed instanceof ArkErrors) {
    const fieldErrors = Object.fromEntries(parsed.map((err) => [err.path.join('.'), err.message]));
    return { success: false, error: 'Validation failed', fieldErrors };
  }

  const practiceId = await getCurrentPracticeId();
  try {
    await clientService.updateClientNotes(practiceId, parsed);
    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (error) {
    console.error('saveNotes failed:', error);

    return { success: false, error: 'Failed to save notes' };
  }
}

export async function toggleChecklistItem(
  checklistItemId: string,
  clientId: string,
  done: boolean,
): Promise<ActionResult> {
  const input = { clientId, checklistItemId };

  const parsed = updateChecklistItemSchema(input);
  if (parsed instanceof ArkErrors) {
    const fieldErrors = Object.fromEntries(parsed.map((err) => [err.path.join('.'), err.message]));
    return { success: false, error: 'Validation failed', fieldErrors };
  }

  const practiceId = await getCurrentPracticeId();
  try {
    if (done) {
      await clientService.markItemOutstanding(practiceId, parsed.checklistItemId, parsed.clientId);
    } else {
      await clientService.markItemReceived(practiceId, parsed.checklistItemId, parsed.clientId);
    }
    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (error) {
    console.error('toggleChecklistItem failed:', error);

    return { success: false, error: 'Failed to toggle checklist item status' };
  }
}

export async function changeTaxReturnStatus(
  taxReturnId: string,
  clientId: string,
  status: Status,
): Promise<ActionResult> {
  const input = { clientId, taxReturnId, status };

  const parsed = updateTaxReturnStatusSchema(input);
  if (parsed instanceof ArkErrors) {
    const fieldErrors = Object.fromEntries(parsed.map((err) => [err.path.join('.'), err.message]));
    return { success: false, error: 'Validation failed', fieldErrors };
  }

  const practiceId = await getCurrentPracticeId();
  try {
    await clientService.changeTaxReturnStatus(practiceId, parsed);
    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (error) {
    console.error('changeTaxReturnStatus failed:', error);

    return { success: false, error: 'Failed to update tax return status' };
  }
}
