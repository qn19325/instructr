'use client';

import Modal from '@/components/Modal';
import { TaxReturn } from '@/types/clients';
import { useState } from 'react';
import AddTaxReturnForm from './AddTaxReturnForm';

interface AddTaxReturnModalProps {
  clientId: string;
  existingTaxReturns: TaxReturn[];
}

export default function AddTaxReturnModal({
  clientId,
  existingTaxReturns,
}: AddTaxReturnModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Add Tax Return
      </button>
      <Modal title="Add Tax Return" isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {/* Conditional render remounts AddTaxReturnForm on open, resetting useActionState */}
        {isOpen && (
          <AddTaxReturnForm
            clientId={clientId}
            existingTaxReturns={existingTaxReturns}
            onSuccess={() => setIsOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}
