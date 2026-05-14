'use client';

import { useState } from 'react';

import FieldError from '@/components/FieldError';
import FormActions from '@/components/FormActions';
import FormError from '@/components/FormError';
import { inputClass, labelClass } from '@/config/formStyles';
import { useActionForm } from '@/hooks/useActionForm';
import { currentTaxYear } from '@/logic/tax-year';
import { Regime } from '@/types/clients';
import type { TaxReturn } from '@/types/clients';

import { createTaxReturn } from './actions';

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
  const { formAction, isPending, fieldErrors, formError } = useActionForm(createTaxReturn, onClose);
  const [selectedRegime, setSelectedRegime] = useState<Regime>(Regime.sa100);
  const curTaxYear = currentTaxYear();
  const years = [curTaxYear - 3, curTaxYear - 2, curTaxYear - 1, curTaxYear, curTaxYear + 1];

  return (
    <>
      <FormError error={!fieldErrors ? formError : undefined} />
      <form action={formAction}>
        <fieldset disabled={isPending} className="space-y-4">
          <input type="hidden" name="clientId" value={clientId} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="taxYear">
                Year
              </label>
              <select className={inputClass} name="taxYear" id="taxYear">
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
                  onChange={(e) => {
                    const next = Object.values(Regime).find((r) => r === e.target.value);
                    if (next) setSelectedRegime(next);
                  }}
                />
                SA100
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="regime"
                  value={Regime.mtd}
                  onChange={(e) => {
                    const next = Object.values(Regime).find((r) => r === e.target.value);
                    if (next) setSelectedRegime(next);
                  }}
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
