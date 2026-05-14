'use client';

import ClientFields from '@/components/ClientFields';
import FormActions from '@/components/FormActions';
import FormError from '@/components/FormError';
import { useActionForm } from '@/hooks/useActionForm';

import { editClient } from './actions';

interface EditClientFormProps {
  clientId: string;
  firstName: string;
  lastName: string;
  niNumber: string;
  email: string | null;
  phoneNumber: string | null;
  onClose: () => void;
}

export default function EditClientForm({
  clientId,
  firstName,
  lastName,
  niNumber,
  email,
  phoneNumber,
  onClose,
}: EditClientFormProps) {
  const { formAction, isPending, fieldErrors, formError } = useActionForm(editClient, onClose);

  return (
    <>
      <FormError error={!fieldErrors ? formError : undefined} />
      <form action={formAction}>
        <fieldset disabled={isPending} className="space-y-4">
          <input type="hidden" name="clientId" value={clientId} />
          <ClientFields
            fieldErrors={fieldErrors}
            defaultValues={{ firstName, lastName, niNumber, email, phoneNumber }}
          />
        </fieldset>

        <FormActions onClose={onClose} isPending={isPending} submitLabel="Save Changes" />
      </form>
    </>
  );
}
