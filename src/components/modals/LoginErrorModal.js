// components/modals/LoginErrorModal.js
import { Icon } from "@iconify/react";

const LoginErrorModal = ({ isOpen, onClose, errorMessage }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative">
        <div className="flex items-center gap-3">
          <Icon icon="mdi:alert-circle" className="text-red-500 text-3xl" />
          <h2 className="text-xl font-semibold text-red-600">Login Failed</h2>
        </div>
        <p className="text-gray-600 mt-3 text-sm leading-relaxed">
          {errorMessage ||
            "An error occurred during login. Please try again or contact support at kwamevaughan@gmail.com."}
        </p>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-xl text-white bg-[#f05d23] hover:bg-[#e0501f] transition-shadow shadow-md hover:shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginErrorModal;
