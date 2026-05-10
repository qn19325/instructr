'use server';

import { revalidatePath } from 'next/cache';
import { getDocument } from '@/db/documents';
import { completeUpload, prepareUpload } from '@/lib/document-lifecycle';
import { getDownloadUrl } from '@/lib/r2';
import { taxReturnInputSchema } from '@/schemas/taxReturn';
import { insertTaxReturn, getClientById, taxReturnExists } from '@/db/clients';
import { ArkErrors } from 'arktype';

export async function getUploadUrl(checklistItemId: string, mimeType: string, size: number) {
  return await prepareUpload(checklistItemId, { mimeType, size });
}

export async function recordUpload(
  checklistItemId: string,
  documentKey: string,
  originalFileName: string,
  mimeType: string,
  size: number,
) {
  await completeUpload(checklistItemId, documentKey, {
    mimeType,
    size,
    originalFileName,
  });

  revalidatePath('/clients', 'layout');
}

export async function getDocumentDownloadUrl(documentId: string): Promise<string> {
  const document = await getDocument(documentId);

  if (!document) {
    throw new Error('Document not found');
  }

  return getDownloadUrl(document.r2Key);
}

export type CreateTaxReturnResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

export async function createTaxReturn(
  _prevState: CreateTaxReturnResult | null,
  formData: FormData,
): Promise<CreateTaxReturnResult> {
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

  const client = await getClientById(parsed.clientId);
  if (!client) {
    return { success: false, error: 'Client not found' };
  }

  const duplicate = await taxReturnExists(parsed.clientId, parsed.taxYear, parsed.regime);
  if (duplicate) {
    return { success: false, error: 'A tax return for this year and regime already exists' };
  }

  try {
    await insertTaxReturn(parsed);
    revalidatePath(`/clients/${parsed.clientId}`);
    return { success: true };
  } catch (error) {
    console.error('createTaxReturn failed:', error);

    return { success: false, error: 'Failed to create tax return' };
  }
}
