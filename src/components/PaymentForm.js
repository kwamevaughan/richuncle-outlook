import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { playBellBeep } from "../utils/posSounds";
import PaymentSummary from "./payment/PaymentSummary";
import PaymentAmounts from "./payment/PaymentAmounts";
import PaymentNotes from "./payment/PaymentNotes";
import PaymentCustomerInfo from "./payment/PaymentCustomerInfo";
import MomoPayment from "./payment/types/MomoPayment";
import ChequePayment from "./payment/types/ChequePayment";
import { getPaymentTypeLabel, getPaymentTypeIcon, validatePaymentData } from "./payment/utils/paymentHelpers";

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
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    chequeDate: "",
    chequeAmount: "",
    chequeStatus: "pending",
    expectedClearanceDate: "",
    // Split payment fields
    splitPayments: [],
    remainingAmount: total
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
    
    // Validate payment data
    if (!validatePaymentData(paymentData, paymentType, total, toast)) {
      return;
    }
    
    // Calculate change (only for non-split payments)
    let change = 0;
    if (paymentType !== "split") {
      const received = parseFloat(paymentData.receivedAmount);
      const paying = parseFloat(paymentData.payingAmount);
      change = received - paying;
    }
    
    // Prepare payment data for parent component
    const paymentInfo = {
      ...paymentData,
      change,
      total,
      orderId,
      paymentType
    };
    
    if (paymentType === "split") {
      paymentInfo.splitPayments = paymentData.splitPayments;
      paymentInfo.totalPaid = total - paymentData.remainingAmount;
      paymentInfo.remainingAmount = paymentData.remainingAmount;
    }
    
    // Call parent callback with payment data
    if (onPaymentComplete) {
      onPaymentComplete(paymentInfo);
    }
    
    // Close modal
    onClose();
  };



  const renderPaymentTypeFields = () => {
    switch (paymentType) {
      case "momo":
        return <MomoPayment paymentData={paymentData} setPaymentData={setPaymentData} total={total} />;

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
        return <ChequePayment paymentData={paymentData} setPaymentData={setPaymentData} total={total} />;

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

      case "split":
        return (
          <div className="space-y-4">
            {/* Split Payment Summary */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="mdi:call-split" className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-800">Split Payment Summary</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold ml-2 text-lg text-purple-700">GHS {total.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Paid Amount:</span>
                  <span className="font-semibold ml-2 text-lg text-green-600">
                    GHS {(total - paymentData.remainingAmount).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Remaining:</span>
                  <span className="font-semibold ml-2 text-lg text-orange-600">
                    GHS {paymentData.remainingAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Add Payment Method */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="mdi:plus-circle" className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-800">Add Payment Method</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentData.newSplitMethod || ""}
                    onChange={(e) => setPaymentData(prev => ({
                      ...prev,
                      newSplitMethod: e.target.value
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Method</option>
                    <option value="cash">Cash</option>
                    <option value="momo">Mobile Money</option>
                    <option value="card">Card</option>
                    <option value="cheque">Cheque</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    max={paymentData.remainingAmount}
                    value={paymentData.newSplitAmount || ""}
                    onChange={(e) => {
                      const amount = parseFloat(e.target.value) || 0;
                      const remaining = paymentData.remainingAmount - amount;
                      setPaymentData(prev => ({
                        ...prev,
                        newSplitAmount: e.target.value,
                        newSplitRemaining: Math.max(0, remaining)
                      }));
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Max: GHS ${paymentData.remainingAmount.toLocaleString()}`}
                  />
                </div>
                
                                 <div className="flex items-end gap-2">
                   {paymentData.editingPayment && (
                     <button
                       type="button"
                       onClick={() => {
                         setPaymentData(prev => ({
                           ...prev,
                           editingPayment: null,
                           newSplitMethod: "",
                           newSplitAmount: "",
                           newSplitRemaining: 0,
                           momoProvider: "",
                           customerPhone: "",
                           referenceNumber: "",
                           chequeNumber: "",
                           bankName: "",
                           chequeDate: ""
                         }));
                       }}
                       className="w-full bg-gray-500 text-white rounded-lg px-4 py-3 font-medium hover:bg-gray-600 transition-colors"
                     >
                       Cancel Edit
                     </button>
                   )}
                   <button
                    type="button"
                                         onClick={() => {
                       if (!paymentData.newSplitMethod || !paymentData.newSplitAmount) {
                         toast.error("Please select payment method and enter amount");
                         return;
                       }
                       
                       const amount = parseFloat(paymentData.newSplitAmount);
                       
                       if (paymentData.editingPayment) {
                         // Update existing payment
                         const existingPayment = paymentData.splitPayments.find(p => p.id === paymentData.editingPayment);
                         if (!existingPayment) {
                           toast.error("Payment not found for editing");
                           return;
                         }
                         
                         const amountDifference = amount - existingPayment.amount;
                         if (amountDifference > paymentData.remainingAmount) {
                           toast.error("Amount increase cannot exceed remaining balance");
                           return;
                         }
                         
                         const updatedPayment = {
                           ...existingPayment,
                           method: paymentData.newSplitMethod,
                           amount: amount,
                           momoProvider: paymentData.momoProvider,
                           customerPhone: paymentData.customerPhone,
                           referenceNumber: paymentData.referenceNumber,
                           chequeNumber: paymentData.chequeNumber,
                           bankName: paymentData.bankName,
                           chequeDate: paymentData.chequeDate
                         };
                         
                         setPaymentData(prev => ({
                           ...prev,
                           splitPayments: prev.splitPayments.map(p => 
                             p.id === paymentData.editingPayment ? updatedPayment : p
                           ),
                           remainingAmount: prev.remainingAmount - amountDifference,
                           editingPayment: null,
                           newSplitMethod: "",
                           newSplitAmount: "",
                           newSplitRemaining: 0,
                           momoProvider: "",
                           customerPhone: "",
                           referenceNumber: "",
                           chequeNumber: "",
                           bankName: "",
                           chequeDate: ""
                         }));
                         
                         toast.success(`Payment updated to ${getPaymentTypeLabel(paymentData.newSplitMethod)} - GHS ${amount.toLocaleString()}`);
                       } else {
                         // Add new payment
                         if (amount > paymentData.remainingAmount) {
                           toast.error("Amount cannot exceed remaining balance");
                           return;
                         }
                         
                         const newPayment = {
                           id: Date.now(),
                           method: paymentData.newSplitMethod,
                           amount: amount,
                           status: 'pending',
                           timestamp: new Date().toISOString(),
                           momoProvider: paymentData.momoProvider,
                           customerPhone: paymentData.customerPhone,
                           referenceNumber: paymentData.referenceNumber,
                           chequeNumber: paymentData.chequeNumber,
                           bankName: paymentData.bankName,
                           chequeDate: paymentData.chequeDate
                         };
                         
                         setPaymentData(prev => ({
                           ...prev,
                           splitPayments: [...prev.splitPayments, newPayment],
                           remainingAmount: prev.remainingAmount - amount,
                           newSplitMethod: "",
                           newSplitAmount: "",
                           newSplitRemaining: 0,
                           momoProvider: "",
                           customerPhone: "",
                           referenceNumber: "",
                           chequeNumber: "",
                           bankName: "",
                           chequeDate: ""
                         }));
                         
                         toast.success(`${getPaymentTypeLabel(paymentData.newSplitMethod)} payment of GHS ${amount.toLocaleString()} added`);
                       }
                     }}
                    className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-blue-700 transition-colors"
                  >
                                         {paymentData.editingPayment ? "Update Payment" : "Add Payment"}
                  </button>
                </div>
              </div>
              
              {/* Dynamic Fields for Selected Payment Method */}
              {paymentData.newSplitMethod && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon icon={getPaymentTypeIcon(paymentData.newSplitMethod)} className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">
                      {getPaymentTypeLabel(paymentData.newSplitMethod)} Details
                    </span>
                  </div>
                  
                  {paymentData.newSplitMethod === "momo" && (
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
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Provider</option>
                          <option value="mtn">MTN Mobile Money</option>
                          <option value="vodafone">Vodafone Cash</option>
                          <option value="airtel">Airtel Money</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Customer Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={paymentData.customerPhone}
                          onChange={(e) => setPaymentData(prev => ({
                            ...prev,
                            customerPhone: e.target.value
                          }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 0241234567"
                        />
                      </div>
                      <div className="md:col-span-2">
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
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter transaction reference"
                        />
                      </div>
                    </div>
                  )}
                  
                  {paymentData.newSplitMethod === "cheque" && (
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
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter cheque number"
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
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Bank</option>
                          <option value="gcb">GCB Bank</option>
                          <option value="ecobank">Ecobank Ghana</option>
                          <option value="zenith">Zenith Bank Ghana</option>
                          <option value="access">Access Bank Ghana</option>
                          <option value="cal">CAL Bank</option>
                          <option value="fidelity">Fidelity Bank Ghana</option>
                          <option value="stanbic">Stanbic Bank Ghana</option>
                          <option value="barclays">Barclays Bank Ghana</option>
                          <option value="sgssb">SG-SSB</option>
                          <option value="republic">Republic Bank Ghana</option>
                          <option value="prudential">Prudential Bank</option>
                          <option value="uniBank">UniBank Ghana</option>
                          <option value="agric">Agricultural Development Bank</option>
                          <option value="national">National Investment Bank</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cheque Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={paymentData.chequeDate}
                          onChange={(e) => setPaymentData(prev => ({
                            ...prev,
                            chequeDate: e.target.value
                          }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          value={paymentData.accountHolderName}
                          onChange={(e) => setPaymentData(prev => ({
                            ...prev,
                            accountHolderName: e.target.value
                          }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter account holder name"
                        />
                      </div>
                    </div>
                  )}
                  
                  {paymentData.newSplitMethod === "card" && (
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
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter transaction reference"
                        />
                      </div>
                    </div>
                  )}
                  
                  {paymentData.newSplitMethod === "bank_transfer" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bank Name
                        </label>
                        <select
                          value={paymentData.bankName}
                          onChange={(e) => setPaymentData(prev => ({
                            ...prev,
                            bankName: e.target.value
                          }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Bank</option>
                          <option value="gcb">GCB Bank</option>
                          <option value="ecobank">Ecobank Ghana</option>
                          <option value="zenith">Zenith Bank Ghana</option>
                          <option value="access">Access Bank Ghana</option>
                          <option value="cal">CAL Bank</option>
                          <option value="fidelity">Fidelity Bank Ghana</option>
                          <option value="stanbic">Stanbic Bank Ghana</option>
                          <option value="barclays">Barclays Bank Ghana</option>
                          <option value="sgssb">SG-SSB</option>
                          <option value="republic">Republic Bank Ghana</option>
                          <option value="prudential">Prudential Bank</option>
                          <option value="uniBank">UniBank Ghana</option>
                          <option value="agric">Agricultural Development Bank</option>
                          <option value="national">National Investment Bank</option>
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
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter transfer reference"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Split Payments List */}
            {paymentData.splitPayments.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon="mdi:format-list-bulleted" className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-800">Payment Breakdown</span>
                </div>
                
                <div className="space-y-2">
                  {paymentData.splitPayments.map((payment, index) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Icon 
                            icon={getPaymentTypeIcon(payment.method)} 
                            className="w-5 h-5 text-blue-600" 
                          />
                          <span className="font-medium">{getPaymentTypeLabel(payment.method)}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(payment.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-green-600">
                          GHS {payment.amount.toLocaleString()}
                        </span>
                                               <div className="flex items-center gap-2">
                         <button
                           type="button"
                           onClick={() => {
                             // Edit payment details
                             setPaymentData(prev => ({
                               ...prev,
                               editingPayment: payment.id,
                               newSplitMethod: payment.method,
                               newSplitAmount: payment.amount.toString(),
                               // Copy payment-specific fields
                               momoProvider: payment.momoProvider || "",
                               customerPhone: payment.customerPhone || "",
                               referenceNumber: payment.referenceNumber || "",
                               chequeNumber: payment.chequeNumber || "",
                               bankName: payment.bankName || "",
                               chequeDate: payment.chequeDate || ""
                             }));
                           }}
                           className="text-blue-500 hover:text-blue-700"
                         >
                           <Icon icon="mdi:pencil" className="w-4 h-4" />
                         </button>
                         <button
                           type="button"
                           onClick={() => {
                             setPaymentData(prev => ({
                               ...prev,
                               splitPayments: prev.splitPayments.filter(p => p.id !== payment.id),
                               remainingAmount: prev.remainingAmount + payment.amount
                             }));
                             toast.success("Payment removed from split");
                           }}
                           className="text-red-500 hover:text-red-700"
                         >
                           <Icon icon="mdi:delete" className="w-4 h-4" />
                         </button>
                       </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Paid:</span>
                    <span className="font-semibold text-green-600">
                      GHS {(total - paymentData.remainingAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-semibold">Remaining:</span>
                    <span className={`font-semibold ${paymentData.remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      GHS {paymentData.remainingAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Payment Options */}
            {paymentData.remainingAmount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon="mdi:lightning-bolt" className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">Quick Payment Options</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentData(prev => ({
                        ...prev,
                        newSplitMethod: "cash",
                        newSplitAmount: prev.remainingAmount.toString()
                      }));
                    }}
                    className="p-2 text-sm bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Pay Remaining in Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentData(prev => ({
                        ...prev,
                        newSplitMethod: "momo",
                        newSplitAmount: prev.remainingAmount.toString()
                      }));
                    }}
                    className="p-2 text-sm bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Pay Remaining in MoMo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const half = Math.ceil(paymentData.remainingAmount / 2);
                      setPaymentData(prev => ({
                        ...prev,
                        newSplitMethod: "cash",
                        newSplitAmount: half.toString()
                      }));
                    }}
                    className="p-2 text-sm bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Half in Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const half = Math.ceil(paymentData.remainingAmount / 2);
                      setPaymentData(prev => ({
                        ...prev,
                        newSplitMethod: "momo",
                        newSplitAmount: half.toString()
                      }));
                    }}
                    className="p-2 text-sm bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Half in MoMo
                  </button>
                </div>
              </div>
            )}
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
              <PaymentSummary orderId={orderId} customer={customer} total={total} />

              {/* Payment Amounts - Hidden for Split Payments */}
              {paymentType !== "split" && (
                <PaymentAmounts 
                  paymentData={paymentData} 
                  setPaymentData={setPaymentData} 
                  handleReceivedAmountChange={handleReceivedAmountChange} 
                />
              )}

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
              <PaymentCustomerInfo 
                customer={customer}
                customers={customers}
                onCustomerChange={onCustomerChange}
                paymentData={paymentData}
                setPaymentData={setPaymentData}
              />

              {/* Notes Section */}
              <PaymentNotes paymentData={paymentData} setPaymentData={setPaymentData} />

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
                  <Icon icon="mdi:check-circle" className="w-5 h-5" />
                  Confirm Payment Details
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