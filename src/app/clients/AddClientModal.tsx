'use client';

import { SubmitEventHandler, useState, useTransition } from 'react';
import { Regime } from '@/types/clients';
import createClient from './actions';

const inputClass =
  'w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500';

const labelClass = 'block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1';

export default function AddClientModal() {
  const [isOpen, setIsOpen] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [niNumber, setNiNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [regime, setRegime] = useState<Regime>('sa100');

  const [isPending, startTransition] = useTransition();

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    startTransition(async () => {
      const res = await createClient({
        firstName,
        lastName,
        niNumber,
        email,
        phoneNumber: phoneNumber,
        regime,
      });

      if (res.success) {
        handleClose();
      } else {
        console.error('Failed to submit', res.error);
      }
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setFirstName('');
    setLastName('');
    setNiNumber('');
    setEmail('');
    setPhoneNumber('');
    setRegime('sa100');
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Add Client
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-5 text-base font-semibold text-slate-900">Add Client</div>
            <form onSubmit={handleSubmit}>
              <fieldset className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>NI Number</label>
                  <input
                    type="text"
                    value={niNumber}
                    onChange={(e) => setNiNumber(e.target.value)}
                    placeholder="AB 12 34 56 C"
                    className={`${inputClass} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Regime</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        value="sa100"
                        checked={regime === 'sa100'}
                        onChange={() => setRegime('sa100')}
                      />
                      SA100
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        value="mtd"
                        checked={regime === 'mtd'}
                        onChange={() => setRegime('mtd')}
                      />
                      MTD
                    </label>
                  </div>
                </div>
              </fieldset>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
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
          </div>
        </div>
      )}
    </div>
  );
}
