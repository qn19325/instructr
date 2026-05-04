'use server';

import { insertClient } from '@/db/clients';
import { revalidatePath } from 'next/cache';
import { clientInputSchema } from '@/schemas/clients';
import { ArkErrors } from 'arktype';

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
