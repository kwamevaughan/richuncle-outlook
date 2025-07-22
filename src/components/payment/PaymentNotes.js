import React from 'react';

const PaymentNotes = ({ paymentData, setPaymentData }) => {
  return (
    <>
      {/* Notes Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sale Note
        </label>
        <textarea
          value={paymentData.saleNote}
          onChange={(e) => setPaymentData(prev => ({
            ...prev,
            saleNote: e.target.value
          }))}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Type your message"
        />
      </div>
    </>
  );
};

export default PaymentNotes; 