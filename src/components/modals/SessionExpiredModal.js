// components/modals/SessionExpiredModal.js
import React from "react";
import { Icon } from "@iconify/react";

const SessionExpiredModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        <div className="flex items-center gap-3 text-[#f05d23]">
          <Icon icon="mdi:alert-circle-outline" className="text-3xl" />
          <h2 className="text-xl font-semibold">Session Expired</h2>
        </div>

        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          Your session has expired. Please log in again to continue.
        </p>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-[#f05d23] hover:bg-[#e0501f] rounded-xl transition-shadow shadow-md hover:shadow-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
