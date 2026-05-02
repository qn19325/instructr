'use client';

import { useActionState, useEffect } from 'react';
import createClient from './actions';
import { Regime } from '@/types/clients';

const inputClass =
  'w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500';

const labelClass = 'block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1';

export default function AddClientForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(createClient, null);

  useEffect(() => {
    if (state?.success) onSuccess();
  }, [state, onSuccess]);

  return (
    <>
      {state && !state.success && !state.fieldErrors && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <form action={formAction}>
        <fieldset disabled={isPending} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name</label>
              <input type="text" name="firstName" required className={inputClass} />
              {state && !state.success && state.fieldErrors?.['firstName'] && (
                <p className="mt-1 text-xs text-red-600">{state.fieldErrors['firstName']}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input type="text" name="lastName" required className={inputClass} />
              {state && !state.success && state.fieldErrors?.['lastName'] && (
                <p className="mt-1 text-xs text-red-600">{state.fieldErrors['lastName']}</p>
              )}
            </div>
          </div>
          <div>
            <label className={labelClass}>NI Number</label>
            <input
              type="text"
              name="niNumber"
              required
              placeholder="AB 12 34 56 C"
              pattern="[A-Za-z]{2}[\s]?[0-9]{2}[\s]?[0-9]{2}[\s]?[0-9]{2}[\s]?[A-Da-d]"
              title="National Insurance number, e.g. AB 12 34 56 C"
              className={`${inputClass} font-mono`}
            />
            {state && !state.success && state.fieldErrors?.['niNumber'] && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors['niNumber']}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" name="email" className={inputClass} />
            {state && !state.success && state.fieldErrors?.['email'] && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors['email']}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input type="tel" name="phoneNumber" className={inputClass} />
            {state && !state.success && state.fieldErrors?.['phoneNumber'] && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors['phoneNumber']}</p>
            )}
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
            {state && !state.success && state.fieldErrors?.['regime'] && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors['regime']}</p>
            )}
          </div>
        </fieldset>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onSuccess}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Add Client'}
          </button>
        </div>
      </form>
    </>
  );
}
