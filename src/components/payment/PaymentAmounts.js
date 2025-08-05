import React from 'react';

const PaymentAmounts = ({ paymentData, setPaymentData, handleReceivedAmountChange, mode = "light" }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className={`block text-sm font-medium mb-2 ${
          mode === "dark" ? "text-gray-200" : "text-gray-700"
        }`}>
          Received Amount <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          required
          value={paymentData.receivedAmount}
          onChange={(e) => handleReceivedAmountChange(e.target.value)}
          className={`w-full border rounded-lg px-4 py-3 text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            mode === "dark" 
              ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400" 
              : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
          }`}
          placeholder="0.00"
          autoFocus
        />
      </div>
      
      <div>
        <label className={`block text-sm font-medium mb-2 ${
          mode === "dark" ? "text-gray-200" : "text-gray-700"
        }`}>
          Paying Amount
        </label>
        <div className={`w-full border rounded-lg px-4 py-3 text-lg font-semibold ${
          mode === "dark" 
            ? "border-gray-600 bg-gray-700 text-gray-100" 
            : "border-gray-300 bg-gray-50 text-gray-900"
        }`}>
          GHS {parseFloat(paymentData.payingAmount || 0).toFixed(2)}
        </div>
      </div>
      
      <div>
        <label className={`block text-sm font-medium mb-2 ${
          mode === "dark" ? "text-gray-200" : "text-gray-700"
        }`}>
          Change
        </label>
        <div className={`w-full border rounded-lg px-4 py-3 text-lg font-semibold ${
          mode === "dark" 
            ? "border-gray-600 bg-gray-700 text-green-400" 
            : "border-gray-300 bg-gray-50 text-green-600"
        }`}>
          GHS {paymentData.change.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default PaymentAmounts; 