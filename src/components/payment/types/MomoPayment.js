import React from 'react';
import { Icon } from "@iconify/react";

const MomoPayment = ({ paymentData, setPaymentData, total }) => {
  return (
    <div className="space-y-4">
      {/* Mobile Money Provider Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Money Provider <span className="text-red-500">*</span>
          </label>
          <select
            value={paymentData.momoProvider}
            onChange={(e) => setPaymentData(prev => ({
              ...prev,
              momoProvider: e.target.value
            }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Provider</option>
            <option value="mtn">MTN Mobile Money</option>
            <option value="vodafone">Vodafone Cash</option>
            <option value="airtel">Airtel Money</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={paymentData.customerPhone || ""}
            onChange={(e) => setPaymentData(prev => ({
              ...prev,
              customerPhone: e.target.value
            }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 0241234567"
            required
          />
        </div>
      </div>

      {/* Store Account Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon icon="mdi:information-outline" className="w-5 h-5 text-yellow-600" />
          <span className="font-semibold text-yellow-800">Store Mobile Money Account</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Account Name:</span>
            <span className="font-semibold ml-2 text-yellow-800">STORE NAME</span>
          </div>
          <div>
            <span className="text-gray-600">Account Number:</span>
            <span className="font-semibold ml-2 text-yellow-800">0241234567</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-yellow-700">
          Customer should send payment to this account and provide the reference number below.
        </div>
      </div>

      {/* Transaction Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Reference <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={paymentData.referenceNumber}
            onChange={(e) => setPaymentData(prev => ({
              ...prev,
              referenceNumber: e.target.value
            }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter transaction reference"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction ID
          </label>
          <input
            type="text"
            value={paymentData.transactionId || ""}
            onChange={(e) => setPaymentData(prev => ({
              ...prev,
              transactionId: e.target.value
            }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Optional transaction ID"
          />
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon icon="mdi:cellphone-message" className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-800">Payment Instructions</span>
        </div>
        <div className="text-sm text-blue-700 space-y-1">
          <div>1. Customer dials the USSD code for {paymentData.momoProvider || "selected provider"}</div>
          <div>2. Select "Send Money" or "Transfer"</div>
          <div>3. Enter store account number: <span className="font-semibold">0241234567</span></div>
          <div>4. Enter amount: <span className="font-semibold">GHS {total.toLocaleString()}</span></div>
          <div>5. Enter reference: <span className="font-semibold">{paymentData.referenceNumber || "CUSTOMER_REFERENCE"}</span></div>
          <div>6. Confirm transaction and provide reference number</div>
        </div>
      </div>
    </div>
  );
};

export default MomoPayment; 