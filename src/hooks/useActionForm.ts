'use client';

import { useActionState, useEffect, useRef } from 'react';

import type { ActionResult } from '@/types/actions';

type ActionFn = (prevState: ActionResult | null, formData: FormData) => Promise<ActionResult>;

export function useActionForm(action: ActionFn, onClose: () => void) {
  const [state, formAction, isPending] = useActionState(action, null);
  const fieldErrors = state?.success === false ? state.fieldErrors : undefined;
  const formError = state?.success === false ? state.error : undefined;
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    if (state?.success) onCloseRef.current();
  }, [state]);

  return { formAction, isPending, fieldErrors, formError };
}
