import React from 'react';

const PaymentAmounts = ({ paymentData, setPaymentData, handleReceivedAmountChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Received Amount <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          required
          value={paymentData.receivedAmount}
          onChange={(e) => handleReceivedAmountChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="0.00"
          autoFocus
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paying Amount <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          required
          value={paymentData.payingAmount}
          onChange={(e) => setPaymentData(prev => ({
            ...prev,
            payingAmount: e.target.value
          }))}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="0.00"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Change
        </label>
        <div className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg font-semibold bg-gray-50 text-green-600">
          GHS {paymentData.change.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default PaymentAmounts; 