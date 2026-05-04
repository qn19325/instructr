'use server';

import { insertClient, markChecklistItemDone } from '@/db/clients';
import { revalidatePath } from 'next/cache';
import { clientInputSchema } from '@/schemas/clients';
import { ArkErrors } from 'arktype';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { r2 } from '@/lib/r2';
import { randomUUID } from 'crypto';
import { getCurrentPracticeId } from '@/lib/auth';
import {
  deleteDocument,
  getDocument,
  getDocumentByChecklistItemId,
  insertDocument,
  InsertDocumentInput,
} from '@/db/documents';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;

export type CreateClientResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

export async function createClient(
  _prevState: CreateClientResult | null,
  formData: FormData,
): Promise<CreateClientResult> {
  const input = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    niNumber: formData.get('niNumber'),
    email: formData.get('email'),
    phoneNumber: formData.get('phoneNumber'),
    regime: formData.get('regime'),
  };

  const parsed = clientInputSchema(input);
  if (parsed instanceof ArkErrors) {
    const fieldErrors = Object.fromEntries(parsed.map((err) => [err.path.join('.'), err.message]));
    return { success: false, error: 'Validation failed', fieldErrors };
  }

  try {
    await insertClient(parsed);
    revalidatePath('/clients');
    return { success: true };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === '23505') {
      return { success: false, error: 'A client with this NI number already exists' };
    }
    console.error('createClient failed:', error);

    return { success: false, error: 'Failed to create client' };
  }
}

export async function getUploadUrl(checklistItemId: string, mimeType: string, size: number) {
  if (ALLOWED_TYPES.findIndex((type) => type === mimeType) === -1) {
    throw new Error('The file type is not allowed');
  }

  if (size > 10485760) {
    throw new Error('The file size is too large');
  }

  const r2Key = randomUUID();
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: r2Key,
    ContentType: mimeType,
  });
  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 900 });
  return { uploadUrl, r2Key };
}

export async function recordUpload(
  checklistItemId: string,
  r2Key: string,
  originalFileName: string,
  mimeType: string,
  size: number,
) {
  const practiceId = await getCurrentPracticeId();
  const oldDocument = await getDocumentByChecklistItemId(checklistItemId);
  const newDocument: InsertDocumentInput = {
    practiceId,
    checklistItemId,
    r2Key,
    originalFileName,
    mimeType,
    size,
  };
  await insertDocument(newDocument);

  if (oldDocument) {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: oldDocument.r2Key,
    });
    await r2.send(deleteCommand);
    await deleteDocument(oldDocument.id);
  }

  await markChecklistItemDone(checklistItemId);
  revalidatePath('/clients', 'layout');
}

export async function getDownloadUrl(documentId: string) {
  const document = await getDocument(documentId);
  const practiceId = await getCurrentPracticeId();

  if (!document) {
    throw new Error('Document not found');
  }

  if (document.practiceId !== practiceId) {
    throw new Error('Unauthorised');
  }

  const getCommand = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: document.r2Key,
  });

  const url = await getSignedUrl(r2, getCommand, { expiresIn: 3600 });
  return url;
}
