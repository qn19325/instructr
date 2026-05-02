'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import AddClientForm from './AddClientForm';

export default function AddClientModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Add Client
      </button>
      <Modal title="Add Client" isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {/* Conditional render remounts AddClientForm on open, resetting useActionState */}
        {isOpen && <AddClientForm onSuccess={() => setIsOpen(false)} />}
      </Modal>
    </div>
  );
}
