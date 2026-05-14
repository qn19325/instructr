'use client';

import Modal from '@/components/Modal';

import AddClientForm from './AddClientForm';

export default function AddClientModal() {
  return (
    <Modal
      title="Add Client"
      trigger={(open) => (
        <button
          onClick={open}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-extrabold text-white hover:bg-indigo-700"
        >
          + New Client
        </button>
      )}
    >
      {(close) => <AddClientForm onClose={close} />}
    </Modal>
  );
}
