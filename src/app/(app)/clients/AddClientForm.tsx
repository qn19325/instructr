'use client';

import ClientFields from '@/components/ClientFields';
import FieldError from '@/components/FieldError';
import FormActions from '@/components/FormActions';
import FormError from '@/components/FormError';
import { labelClass } from '@/config/formStyles';
import { useActionForm } from '@/hooks/useActionForm';
import { Regime } from '@/types/clients';

import { createClient } from './actions';

export default function AddClientForm({ onClose }: { onClose: () => void }) {
  const { formAction, isPending, fieldErrors, formError } = useActionForm(createClient, onClose);

  return (
    <>
      <FormError error={!fieldErrors ? formError : undefined} />
      <form action={formAction}>
        <fieldset disabled={isPending} className="space-y-4">
          <ClientFields fieldErrors={fieldErrors} />
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

        <FormActions onClose={onClose} isPending={isPending} submitLabel="Add Client" />
      </form>
    </>
  );
}
