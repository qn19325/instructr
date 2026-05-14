import { NI_NUMBER_PATTERN } from '@/schemas/clients';

import FieldError from './FieldError';
import { inputClass, labelClass } from './formStyles';

interface ClientFieldsProps {
  fieldErrors: Record<string, string> | undefined;
  defaultValues?: {
    firstName: string;
    lastName: string;
    niNumber: string;
    email: string | null;
    phoneNumber: string | null;
  };
}

export default function ClientFields({ defaultValues, fieldErrors }: ClientFieldsProps) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="firstName">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            name="firstName"
            required
            className={inputClass}
            defaultValue={defaultValues?.firstName}
          />
          <FieldError fieldErrors={fieldErrors} name="firstName" />
        </div>
        <div>
          <label className={labelClass} htmlFor="lastName">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            name="lastName"
            required
            className={inputClass}
            defaultValue={defaultValues?.lastName}
          />
          <FieldError fieldErrors={fieldErrors} name="lastName" />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="niNumber">
          NI Number
        </label>
        <input
          id="niNumber"
          type="text"
          name="niNumber"
          required
          placeholder="AB 12 34 56 C"
          pattern={NI_NUMBER_PATTERN}
          title="National Insurance number, e.g. AB 12 34 56 C"
          className={`${inputClass} font-mono`}
          defaultValue={defaultValues?.niNumber}
        />
        <FieldError fieldErrors={fieldErrors} name="niNumber" />
      </div>
      <div>
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          className={inputClass}
          defaultValue={defaultValues?.email ?? ''}
        />
        <FieldError fieldErrors={fieldErrors} name="email" />
      </div>
      <div>
        <label className={labelClass} htmlFor="phoneNumber">
          Phone
        </label>
        <input
          id="phoneNumber"
          type="tel"
          name="phoneNumber"
          className={inputClass}
          defaultValue={defaultValues?.phoneNumber ?? ''}
        />
        <FieldError fieldErrors={fieldErrors} name="phoneNumber" />
      </div>
    </div>
  );
}
