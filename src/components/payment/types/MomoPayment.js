import React from 'react';
import { Icon } from "@iconify/react";

const MomoPayment = ({ paymentData, setPaymentData, total, mode = "light" }) => {
  return (
    <div className="space-y-4">
      {/* Mobile Money Provider Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            mode === "dark" ? "text-gray-200" : "text-gray-700"
          }`}>
            Mobile Money Provider
          </label>
          <select
            value={paymentData.momoProvider}
            onChange={(e) =>
              setPaymentData((prev) => ({
                ...prev,
                momoProvider: e.target.value,
              }))
            }
            className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              mode === "dark" 
                ? "border-gray-600 bg-gray-700 text-gray-100" 
                : "border-gray-300 bg-white text-gray-900"
            }`}
          >
            <option value="">Select Provider</option>
            <option value="mtn">MTN Mobile Money</option>
            <option value="vodafone">Vodafone Cash</option>
            <option value="airtel">Airtel Money</option>
          </select>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            mode === "dark" ? "text-gray-200" : "text-gray-700"
          }`}>
            Customer Phone Number
          </label>
          <input
            type="tel"
            value={paymentData.customerPhone || ""}
            onChange={(e) =>
              setPaymentData((prev) => ({
                ...prev,
                customerPhone: e.target.value,
              }))
            }
            className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              mode === "dark" 
                ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400" 
                : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
            }`}
            placeholder="e.g., 0241234567"
          />
        </div>
      </div>

      {/* Store Account Information */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-600 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon
            icon="mdi:information-outline"
            className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
          />
          <span className="font-semibold text-yellow-800 dark:text-yellow-300">
            Store Mobile Money Account
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-300">Account Name:</span>
            <span className="font-semibold ml-2 text-yellow-800 dark:text-yellow-300">
              RICHUNCLE OUTLOOK
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-300">Account Number:</span>
            <span className="font-semibold ml-2 text-yellow-800 dark:text-yellow-300">
              0598612130
            </span>
          </div>
        </div>
        <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-400">
          Customer should send payment to this account and provide the reference
          number below.
        </div>
      </div>

      {/* Transaction Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            mode === "dark" ? "text-gray-200" : "text-gray-700"
          }`}>
            Transaction Reference
          </label>
          <input
            type="text"
            value={paymentData.referenceNumber}
            onChange={(e) =>
              setPaymentData((prev) => ({
                ...prev,
                referenceNumber: e.target.value,
              }))
            }
            className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              mode === "dark" 
                ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400" 
                : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
            }`}
            placeholder="Enter transaction reference"
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            mode === "dark" ? "text-gray-200" : "text-gray-700"
          }`}>
            Transaction ID
          </label>
          <input
            type="text"
            value={paymentData.transactionId || ""}
            onChange={(e) =>
              setPaymentData((prev) => ({
                ...prev,
                transactionId: e.target.value,
              }))
            }
            className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              mode === "dark" 
                ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400" 
                : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
            }`}
            placeholder="Optional transaction ID"
          />
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="bg-blue-50 dark:bg-slate-800/50 border border-blue-200 dark:border-slate-600 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon
            icon="mdi:cellphone-message"
            className="w-5 h-5 text-blue-600 dark:text-blue-400"
          />
          <span className="font-semibold text-blue-800 dark:text-blue-300">
            Payment Instructions
          </span>
        </div>
        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <div>
            1. Customer dials the USSD code for{" "}
            {paymentData.momoProvider || "selected provider"}
          </div>
          <div>2. Select "Send Money" or "Transfer"</div>
          <div>
            3. Enter store account number:{" "}
            <span className="font-semibold">0598612130</span>
          </div>
          <div>
            4. Enter amount:{" "}
            <span className="font-semibold">GHS {total.toLocaleString()}</span>
          </div>
          <div>
            5. Enter reference:{" "}
            <span className="font-semibold">
              {paymentData.referenceNumber || "CUSTOMER_REFERENCE"}
            </span>
          </div>
          <div>6. Confirm transaction and provide reference number</div>
        </div>
      </div>
    </div>
  );
};

export default MomoPayment; 