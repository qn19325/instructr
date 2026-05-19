import { ArkErrors, type Type } from 'arktype';

import { getCurrentPracticeId } from '@/infra/auth';
import type { Db } from '@/infra/db';
import { getCurrentDb } from '@/infra/db';
import { ServiceError } from '@/service/errors';
import type { ActionResult } from '@/types/actions';

export async function runFormAction<S extends Type>(
  schema: S,
  rawInput: unknown,
  handler: (parsed: S['infer'], db: Db, practiceId: string) => Promise<void>,
  opts: { genericError: string; duplicateError?: string },
): Promise<ActionResult> {
  const parsed = schema(rawInput);
  if (parsed instanceof ArkErrors) {
    const fieldErrors = Object.fromEntries(parsed.map((err) => [err.path.join('.'), err.message]));
    return { success: false, error: 'Validation failed', fieldErrors };
  }

  const db = await getCurrentDb();
  const practiceId = await getCurrentPracticeId();

  try {
    await handler(parsed, db, practiceId);
    return { success: true };
  } catch (error) {
    if (error instanceof ServiceError) {
      return { success: false, error: error.message };
    }
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === '23505' &&
      opts.duplicateError
    ) {
      return { success: false, error: opts.duplicateError };
    }

    console.error('action failed', error);
    return { success: false, error: opts.genericError };
  }
}
