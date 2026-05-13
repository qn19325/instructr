'use client';

import Modal from '@/components/Modal';
import EditClientForm from './EditClientForm';

interface EditClientModalProps {
  id: string;
  niNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string | null;
}

export default function EditClientModal(props: EditClientModalProps) {
  return (
    <Modal
      title="Edit Client"
      trigger={(open) => (
        <button
          onClick={open}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-extrabold text-white hover:bg-indigo-700"
        >
          Edit Client
        </button>
      )}
    >
      {(close) => (
        <EditClientForm
          clientId={props.id}
          firstName={props.firstName}
          lastName={props.lastName}
          niNumber={props.niNumber}
          email={props.email}
          phoneNumber={props.phoneNumber}
          onClose={close}
        />
      )}
    </Modal>
  );
}
