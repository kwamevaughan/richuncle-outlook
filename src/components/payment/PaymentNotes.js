import React from 'react';

const PaymentNotes = ({ paymentData, setPaymentData }) => {
  return (
    <>
      {/* Notes Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Note
          </label>
          <textarea
            value={paymentData.paymentNote}
            onChange={(e) => setPaymentData(prev => ({
              ...prev,
              paymentNote: e.target.value
            }))}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Type your message"
          />
        </div>
        
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
      </div>

      {/* Staff Note */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Staff Note
        </label>
        <textarea
          value={paymentData.staffNote}
          onChange={(e) => setPaymentData(prev => ({
            ...prev,
            staffNote: e.target.value
          }))}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Internal staff notes"
        />
      </div>
    </>
  );
};

export default PaymentNotes; 