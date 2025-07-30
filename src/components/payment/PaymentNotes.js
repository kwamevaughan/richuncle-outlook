import React from 'react';

const PaymentNotes = ({ paymentData, setPaymentData, mode = "light" }) => {
  return (
    <>
      {/* Notes Section */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            mode === "dark" ? "text-gray-200" : "text-gray-700"
          }`}>
            Sale Note
          </label>
          <textarea
            value={paymentData.saleNote}
            onChange={(e) => setPaymentData(prev => ({
              ...prev,
              saleNote: e.target.value
            }))}
            rows={3}
            className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              mode === "dark" 
                ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400" 
                : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
            }`}
            placeholder="Type your message"
        />
      </div>
    </>
  );
};

export default PaymentNotes; 