'use server';

import { revalidatePath } from 'next/cache';

import { runFormAction } from '@/app/_lib/runFormAction';
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

  return runFormAction(
    clientInputSchema,
    input,
    async (parsed, db, practiceId) => {
      await clientService.insertClient(db, practiceId, parsed);
      revalidatePath('/clients');
    },
    {
      genericError: 'Failed to create client',
      duplicateError: 'A client with this NI number already exists',
    },
  );
}
