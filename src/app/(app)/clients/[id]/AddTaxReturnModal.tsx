'use client';

import Modal from '@/components/Modal';
import type { TaxReturn } from '@/types/clients';

import AddTaxReturnForm from './AddTaxReturnForm';

interface AddTaxReturnModalProps {
  clientId: string;
  existingTaxReturns: TaxReturn[];
}

export default function AddTaxReturnModal({
  clientId,
  existingTaxReturns,
}: AddTaxReturnModalProps) {
  return (
    <Modal
      title="Add Tax Return"
      trigger={(open) => (
        <button
          onClick={open}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-extrabold text-white hover:bg-indigo-700"
        >
          Add Tax Return
        </button>
      )}
    >
      {(close) => (
        <AddTaxReturnForm
          clientId={clientId}
          existingTaxReturns={existingTaxReturns}
          onClose={close}
        />
      )}
    </Modal>
  );
}
