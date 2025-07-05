import React from 'react';

const PaymentSummary = ({ orderId, customer, total }) => {
  return (
    <div className="bg-blue-50 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div>
            <span className="text-gray-600">Order ID:</span>
            <span className="font-semibold ml-2">#{orderId}</span>
          </div>
          <div>
            <span className="text-gray-600">Customer:</span>
            <span className="font-semibold ml-2">
              {customer ? customer.name : "Walk In Customer"}
            </span>
          </div>
          {customer && (
            <div>
              <span className="text-gray-600">Phone:</span>
              <span className="font-semibold ml-2">{customer.phone}</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div>
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-semibold ml-2 text-lg text-blue-700">GHS {total.toLocaleString()}</span>
          </div>
          {customer && (
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="font-semibold ml-2">{customer.email}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSummary; 