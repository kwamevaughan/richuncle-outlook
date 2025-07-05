import React from 'react';
import { Icon } from "@iconify/react";

const ChequePayment = ({ paymentData, setPaymentData, total }) => {
  return (
    <div className="space-y-4">
      {/* Cheque Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cheque Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={paymentData.chequeNumber}
            onChange={(e) => setPaymentData(prev => ({
              ...prev,
              chequeNumber: e.target.value
            }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter cheque number"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bank Name <span className="text-red-500">*</span>
          </label>
          <select
            value={paymentData.bankName}
            onChange={(e) => setPaymentData(prev => ({
              ...prev,
              bankName: e.target.value
            }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Bank</option>
            <option value="ghana_commercial_bank">Ghana Commercial Bank (GCB)</option>
            <option value="ecobank">Ecobank Ghana</option>
            <option value="barclays">Barclays Bank Ghana</option>
            <option value="standard_chartered">Standard Chartered Bank Ghana</option>
            <option value="cal_bank">CAL Bank</option>
            <option value="fidelity_bank">Fidelity Bank Ghana</option>
            <option value="zenith_bank">Zenith Bank Ghana</option>
            <option value="access_bank">Access Bank Ghana</option>
            <option value="gt_bank">GT Bank Ghana</option>
            <option value="uni_bank">UniBank Ghana</option>
            <option value="other">Other Bank</option>
          </select>
        </div>
      </div>

      {/* Account Holder Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Holder Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={paymentData.accountHolderName || ""}
            onChange={(e) => setPaymentData(prev => ({
              ...prev,
              accountHolderName: e.target.value
            }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Name on cheque"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Number
          </label>
          <input
            type="text"
            value={paymentData.accountNumber || ""}
            onChange={(e) => setPaymentData(prev => ({
              ...prev,
              accountNumber: e.target.value
            }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Account number (optional)"
          />
        </div>
      </div>

      {/* Cheque Date and Amount */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cheque Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={paymentData.chequeDate || ""}
            onChange={(e) => setPaymentData(prev => ({
              ...prev,
              chequeDate: e.target.value
            }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cheque Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={paymentData.chequeAmount || ""}
            onChange={(e) => setPaymentData(prev => ({
              ...prev,
              chequeAmount: e.target.value
            }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Amount on cheque"
            required
          />
        </div>
      </div>

      {/* Cheque Status and Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cheque Status
          </label>
          <select
            value={paymentData.chequeStatus || "pending"}
            onChange={(e) => setPaymentData(prev => ({
              ...prev,
              chequeStatus: e.target.value
            }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="pending">Pending Clearance</option>
            <option value="cleared">Cleared</option>
            <option value="bounced">Bounced</option>
            <option value="post_dated">Post Dated</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Clearance Date
          </label>
          <input
            type="date"
            value={paymentData.expectedClearanceDate || ""}
            onChange={(e) => setPaymentData(prev => ({
              ...prev,
              expectedClearanceDate: e.target.value
            }))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Expected clearance date"
          />
        </div>
      </div>

      {/* Cheque Verification */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon icon="mdi:alert-circle-outline" className="w-5 h-5 text-orange-600" />
          <span className="font-semibold text-orange-800">Cheque Verification Checklist</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cheque_date_valid"
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="cheque_date_valid" className="text-orange-700">Cheque date is valid (not post-dated)</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cheque_amount_correct"
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="cheque_amount_correct" className="text-orange-700">Amount matches order total</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cheque_signed"
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="cheque_signed" className="text-orange-700">Cheque is properly signed</label>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cheque_not_altered"
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="cheque_not_altered" className="text-orange-700">No alterations on cheque</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="bank_details_correct"
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="bank_details_correct" className="text-orange-700">Bank details are correct</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="customer_id_verified"
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="customer_id_verified" className="text-orange-700">Customer ID verified</label>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon icon="mdi:information-outline" className="w-5 h-5 text-red-600" />
          <span className="font-semibold text-red-800">Important Notice</span>
        </div>
        <div className="text-sm text-red-700">
          <div>• Cheque payments are subject to clearance (typically 3-5 business days)</div>
          <div>• Goods will be released only after cheque clearance confirmation</div>
          <div>• Post-dated cheques are not accepted unless pre-approved</div>
          <div>• Customer must provide valid ID for cheque payments</div>
        </div>
      </div>
    </div>
  );
};

export default ChequePayment; 