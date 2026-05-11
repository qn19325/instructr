'use client';

import { useActionState, useEffect } from 'react';
import { createClient } from './actions';
import { Regime } from '@/types/clients';
import { NI_NUMBER_PATTERN } from '@/schemas/clients';
import { inputClass, labelClass } from '@/lib/form-styles';
import FormError from '@/components/FormError';
import FieldError from '@/components/FieldError';
import FormActions from '@/components/FormActions';

export default function AddClientForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(createClient, null);
  const fieldErrors = state?.success === false ? state.fieldErrors : undefined;
  const formError = state?.success === false ? state.error : undefined;

  useEffect(() => {
    if (state?.success) onSuccess();
  }, [state, onSuccess]);

  return (
    <>
      <FormError error={!fieldErrors ? formError : undefined} />
      <form action={formAction}>
        <fieldset disabled={isPending} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name</label>
              <input type="text" name="firstName" required className={inputClass} />
              <FieldError fieldErrors={fieldErrors} name="firstName" />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input type="text" name="lastName" required className={inputClass} />
              <FieldError fieldErrors={fieldErrors} name="lastName" />
            </div>
          </div>
          <div>
            <label className={labelClass}>NI Number</label>
            <input
              type="text"
              name="niNumber"
              required
              placeholder="AB 12 34 56 C"
              pattern={NI_NUMBER_PATTERN}
              title="National Insurance number, e.g. AB 12 34 56 C"
              className={`${inputClass} font-mono`}
            />
            <FieldError fieldErrors={fieldErrors} name="niNumber" />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" name="email" className={inputClass} />
            <FieldError fieldErrors={fieldErrors} name="email" />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input type="tel" name="phoneNumber" className={inputClass} />
            <FieldError fieldErrors={fieldErrors} name="phoneNumber" />
          </div>
          <div>
            <label className={labelClass}>Regime</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" name="regime" value={Regime.sa100} defaultChecked />
                SA100
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" name="regime" value={Regime.mtd} />
                MTD
              </label>
            </div>
            <FieldError fieldErrors={fieldErrors} name="regime" />
          </div>
        </fieldset>

        <FormActions onClose={onSuccess} isPending={isPending} submitLabel="Add Client" />
      </form>
    </>
  );
}
