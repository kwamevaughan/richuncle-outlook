import React from 'react';
import SimpleModal from './SimpleModal';
import { Icon } from '@iconify/react';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, itemName, mode }) => {

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Delete"
      mode={mode}
      width="max-w-md"
    >
      <div className="py-6 text-center">
        <Icon
          icon="mdi:alert"
          className="w-12 h-12 text-red-500 mx-auto mb-4"
        />
        <div className="text-lg font-semibold mb-2">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{itemName}</span>?
        </div>
        <div className="flex justify-center gap-4 mt-6">
          <button
            className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </SimpleModal>
  );
};

export default ConfirmDeleteModal;
