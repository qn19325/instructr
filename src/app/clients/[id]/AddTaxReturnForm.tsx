'use client';

import { useActionState, useEffect, useState } from 'react';
import { Regime, TaxReturn } from '@/types/clients';
import { createTaxReturn } from './actions';
import { currentTaxYear } from '@/lib/tax-return';
import { labelClass } from '@/lib/form-styles';
import FormError from '@/components/FormError';
import FieldError from '@/components/FieldError';
import FormActions from '@/components/FormActions';

interface AddTaxReturnFormProps {
  clientId: string;
  existingTaxReturns: TaxReturn[];
  onClose: () => void;
}

export default function AddTaxReturnForm({
  clientId,
  existingTaxReturns,
  onClose,
}: AddTaxReturnFormProps) {
  const [state, formAction, isPending] = useActionState(createTaxReturn, null);
  const [selectedRegime, setSelectedRegime] = useState<Regime>(Regime.sa100);
  const curTaxYear = currentTaxYear();
  const years = [curTaxYear - 3, curTaxYear - 2, curTaxYear - 1, curTaxYear, curTaxYear + 1];
  const fieldErrors = state?.success === false ? state.fieldErrors : undefined;
  const formError = state?.success === false ? state.error : undefined;

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <>
      <FormError error={formError} />
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
              <FieldError fieldErrors={fieldErrors} name="taxYear" />
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
            <FieldError fieldErrors={fieldErrors} name="regime" />
          </fieldset>
        </fieldset>

        <FormActions onClose={onClose} isPending={isPending} submitLabel="Add Tax Return" />
      </form>
    </>
  );
}
