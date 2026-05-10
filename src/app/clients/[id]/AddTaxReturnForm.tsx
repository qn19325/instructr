'use client';

import { useActionState, useEffect, useState } from 'react';
import { Regime, TaxReturn } from '@/types/clients';
import { createTaxReturn } from './actions';
import { currentTaxYear } from '@/lib/tax-return';

const labelClass = 'block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1';

interface AddTaxReturnFormProps {
  clientId: string;
  existingTaxReturns: TaxReturn[];
  onSuccess: () => void;
}

export default function AddTaxReturnForm({
  clientId,
  existingTaxReturns,
  onSuccess: onClose,
}: AddTaxReturnFormProps) {
  const [state, formAction, isPending] = useActionState(createTaxReturn, null);
  const [selectedRegime, setSelectedRegime] = useState<Regime>(Regime.sa100);
  const curTaxYear = currentTaxYear();
  const years = [curTaxYear - 3, curTaxYear - 2, curTaxYear - 1, curTaxYear, curTaxYear + 1];

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <>
      {state && !state.success && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <form action={formAction}>
        <fieldset disabled={isPending} className="space-y-4">
          <input type="hidden" name="clientId" value={clientId} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="taxYear">
                Year
              </label>
              <select name="taxYear" id="taxYear">
                {years.map((year) => (
                  <option
                    key={year}
                    value={year}
                    disabled={existingTaxReturns.some(
                      (r) => r.taxYear === year && r.regime === selectedRegime,
                    )}
                  >
                    {year}/{String(year + 1).slice(2)}
                  </option>
                ))}
              </select>
              {state && !state.success && state.fieldErrors?.['taxYear'] && (
                <p className="mt-1 text-xs text-red-600">{state.fieldErrors['taxYear']}</p>
              )}
            </div>
          </div>
          <fieldset>
            <legend className={labelClass}>Regime</legend>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="regime"
                  value={Regime.sa100}
                  defaultChecked
                  onChange={(e) => setSelectedRegime(e.target.value as Regime)}
                />
                SA100
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="regime"
                  value={Regime.mtd}
                  onChange={(e) => setSelectedRegime(e.target.value as Regime)}
                />
                MTD
              </label>
            </div>
            {state && !state.success && state.fieldErrors?.['regime'] && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors['regime']}</p>
            )}
          </fieldset>
        </fieldset>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Add Tax Return'}
          </button>
        </div>
      </form>
    </>
  );
}
