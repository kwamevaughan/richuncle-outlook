// components/modals/Modal.js
import React from "react";
import { Icon } from "@iconify/react";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-500">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-red-500"
          >
            <Icon icon="heroicons:x-mark" className="w-6 h-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
