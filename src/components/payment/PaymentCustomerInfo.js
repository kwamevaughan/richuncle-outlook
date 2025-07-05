import React from 'react';

const PaymentCustomerInfo = ({ customer, customers, onCustomerChange, paymentData, setPaymentData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Customer
        </label>
        <select
          value={customer?.id || ""}
          onChange={(e) => {
            const selectedCustomer = customers.find(c => c.id === e.target.value);
            if (onCustomerChange) {
              onCustomerChange(selectedCustomer);
            }
          }}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Walk In Customer</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} - {c.phone}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Receiver
        </label>
        <input
          type="text"
          value={paymentData.paymentReceiver}
          onChange={(e) => setPaymentData(prev => ({
            ...prev,
            paymentReceiver: e.target.value
          }))}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter receiver name"
        />
      </div>
    </div>
  );
};

export default PaymentCustomerInfo; 