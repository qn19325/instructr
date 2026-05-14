'use server';

import { ArkErrors } from 'arktype';
import { revalidatePath } from 'next/cache';

import { getCurrentPracticeId } from '@/infra/auth';
import { getCurrentDb } from '@/infra/db';
import { clientInputSchema } from '@/schemas/clients';
import * as clientService from '@/service/clients';
import type { ActionResult } from '@/types/actions';

export async function createClient(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
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

  const db = await getCurrentDb();
  const practiceId = await getCurrentPracticeId();
  try {
    await clientService.insertClient(db, practiceId, parsed);
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
