import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { playBellBeep } from "../utils/posSounds";

const PaymentForm = ({ 
  isOpen, 
  onClose, 
  paymentType, 
  total, 
  orderId, 
  onPaymentComplete,
  customer = null,
  customers = [],
  onCustomerChange = null
}) => {
  const [paymentData, setPaymentData] = useState({
    receivedAmount: "",
    payingAmount: "",
    change: 0,
    paymentType: paymentType,
    paymentReceiver: "",
    paymentNote: "",
    saleNote: "",
    staffNote: "",
    // Additional fields for different payment types
    referenceNumber: "",
    cardType: "",
    momoProvider: "",
    customerPhone: "",
    transactionId: "",
    chequeNumber: "",
    bankName: ""
  });

  // Reset form when payment type changes
  useEffect(() => {
    setPaymentData(prev => ({
      ...prev,
      paymentType: paymentType,
      payingAmount: total.toFixed(2),
      receivedAmount: "",
      change: 0
    }));
  }, [paymentType, total]);

  const handleReceivedAmountChange = (value) => {
    const received = parseFloat(value) || 0;
    const paying = parseFloat(paymentData.payingAmount) || 0;
    const change = Math.max(0, received - paying);
    
    setPaymentData(prev => ({
      ...prev,
      receivedAmount: value,
      change: change
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const received = parseFloat(paymentData.receivedAmount);
    const paying = parseFloat(paymentData.payingAmount);
    
    if (received < paying) {
      toast.error("Received amount must be greater than or equal to paying amount");
      return;
    }
    
    // Validate MoMo-specific fields
    if (paymentType === "momo") {
      if (!paymentData.momoProvider) {
        toast.error("Please select a mobile money provider");
        return;
      }
      if (!paymentData.customerPhone) {
        toast.error("Please enter customer phone number");
        return;
      }
      if (!paymentData.referenceNumber) {
        toast.error("Please enter transaction reference number");
        return;
      }
    }
    
    // Calculate change
    const change = received - paying;
    
    // Here you would typically process the payment
    console.log("Processing payment:", {
      ...paymentData,
      change,
      total,
      orderId
    });
    
    // Play success sound
    playBellBeep();
    
    // Show success message
    toast.success(`${getPaymentTypeLabel(paymentType)} payment processed! Change: GHS ${change.toFixed(2)}`);
    
    // Call parent callback
    if (onPaymentComplete) {
      onPaymentComplete({
        ...paymentData,
        change,
        total,
        orderId
      });
    }
    
    // Close modal
    onClose();
  };

  const getPaymentTypeLabel = (type) => {
    const labels = {
      cash: "Cash",
      momo: "Mobile Money",
      card: "Card",
      cheque: "Cheque",
      bank_transfer: "Bank Transfer"
    };
    return labels[type] || type;
  };

  const getPaymentTypeIcon = (type) => {
    const icons = {
      cash: "mdi:cash",
      momo: "mdi:wallet-outline",
      card: "mdi:credit-card-outline",
      cheque: "mdi:checkbook",
      bank_transfer: "mdi:bank"
    };
    return icons[type] || "mdi:cash";
  };

  const renderPaymentTypeFields = () => {
    switch (paymentType) {
      case "momo":
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

      case "card":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Type
              </label>
              <select
                value={paymentData.cardType}
                onChange={(e) => setPaymentData(prev => ({
                  ...prev,
                  cardType: e.target.value
                }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Card Type</option>
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="amex">American Express</option>
                <option value="local">Local Card</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number
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
              />
            </div>
          </div>
        );

      case "cheque":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cheque Number
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                value={paymentData.bankName}
                onChange={(e) => setPaymentData(prev => ({
                  ...prev,
                  bankName: e.target.value
                }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter bank name"
              />
            </div>
          </div>
        );

      case "bank_transfer":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                value={paymentData.bankName}
                onChange={(e) => setPaymentData(prev => ({
                  ...prev,
                  bankName: e.target.value
                }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter bank name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                value={paymentData.referenceNumber}
                onChange={(e) => setPaymentData(prev => ({
                  ...prev,
                  referenceNumber: e.target.value
                }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter transfer reference"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-all duration-500 backdrop-blur-sm bg-gradient-to-br from-white/20 via-blue-50/30 to-blue-50/20"
        onClick={onClose}
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(0, 123, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(100, 149, 237, 0.1) 0%, transparent 50%)
          `,
        }}
      />

      {/* Modal Content */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-3xl transform transition-all duration-500 max-h-[85vh] overflow-hidden shadow-2xl shadow-black/20 bg-white/20 text-gray-900 border border-white/20 backdrop-blur-xl">
          {/* Header */}
          <div className="relative px-8 py-3 overflow-hidden bg-[#172840]">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-lg transform translate-x-12 translate-y-12"></div>
            </div>

            <div className="relative flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white tracking-tight">
                Finalize Sale - {getPaymentTypeLabel(paymentType)} Payment
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="group p-3 rounded-2xl transition-all duration-300 hover:bg-white/20 hover:scale-110 active:scale-95"
                style={{
                  backdropFilter: "blur(4px)",
                  background: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <Icon
                  icon="heroicons:x-mark"
                  className="h-6 w-6 text-white transition-transform duration-300 group-hover:rotate-90"
                />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto max-h-[calc(85vh-120px)] bg-white/60">
            <form onSubmit={handleSubmit} className="space-y-6">
                          {/* Payment Summary */}
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

              {/* Payment Amounts */}
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

              {/* Payment Type - Read Only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Type
                </label>
                <div className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-700 font-medium flex items-center gap-2">
                  <Icon icon={getPaymentTypeIcon(paymentType)} className="w-5 h-5 text-green-600" />
                  {getPaymentTypeLabel(paymentType)} Payment
                </div>
              </div>

              {/* Payment Type Specific Fields */}
              {renderPaymentTypeFields()}

              {/* Customer Information */}
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

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Icon icon="mdi:cash-register" className="w-5 h-5" />
                  Process Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm; 