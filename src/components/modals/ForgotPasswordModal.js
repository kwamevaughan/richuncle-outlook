import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Modal from "@/components/modals/Modal"; 

const ForgotPasswordModal = ({ isOpen, onClose, onSubmit }) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(email);
      setEmail("");
      onClose();
    } catch (error) {
      console.error("ForgotPasswordModal: Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-gray-600">
          Enter your email address to receive a password reset link.
        </p>
        <div className="relative">
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full bg-transparent text-blue-700 font-light border-b-2 border-gray-700 rounded-none py-2.5 px-2 focus:outline-none focus:border-blue-500"
            required
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-700">
            <Icon icon="heroicons:envelope" className="w-5 h-5" />
          </span>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-red-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-red-500 text-white font-bold rounded-full transform transition-transform duration-300 ease-in-out hover:scale-105 ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ForgotPasswordModal;
