import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { playBellBeep } from "../utils/posSounds";
import PaymentSummary from "./payment/PaymentSummary";
import PaymentAmounts from "./payment/PaymentAmounts";
import PaymentNotes from "./payment/PaymentNotes";
import PaymentCustomerInfo from "./payment/PaymentCustomerInfo";
import MomoPayment from "./payment/types/MomoPayment";
import { getPaymentTypeLabel, getPaymentTypeIcon, validatePaymentData } from "./payment/utils/paymentHelpers";
import LayawaySummary from "./payment/LayawaySummary";
import OrderItems from "./OrderItems";
import TooltipIconButton from "./TooltipIconButton";

const PaymentForm = ({ 
  isOpen, 
  onClose, 
  paymentType, 
  total, 
  orderId, 
  onPaymentComplete,
  customer = null,
  customers = [],
  onCustomerChange = null,
  user = null,
  allUsers = [],
  isOnlinePurchase = false,
  processCompleteTransaction,
  paymentData: propPaymentData, // Added propPaymentData to the destructuring
  layawayTotal, // Added layawayTotal prop
  products = [], // Added products prop
  quantities = {} // Added quantities prop
}) => {
  const [paymentData, setPaymentData] = useState(() => {
    // If props.paymentData has payments, use it as base
    if (propPaymentData && (Array.isArray(propPaymentData.payments) && propPaymentData.payments.length > 0)) {
      return {
        ...propPaymentData,
        paymentType: paymentType,
        payingAmount: total.toFixed(2),
        receivedAmount: "",
        change: 0,
        remainingAmount: total
      };
    }
    // Otherwise, use default
    return {
      receivedAmount: "",
      payingAmount: total.toFixed(2),
      change: 0,
      paymentType: paymentType,
      paymentReceiver: "",
      saleNote: "",
      referenceNumber: "",
      cardType: "",
      momoProvider: "",
      customerPhone: "",
      transactionId: "",
      splitPayments: [],
      remainingAmount: total
    };
  });

  // Reset form when payment type changes, but preserve layaway payments
  useEffect(() => {
    setPaymentData(prev => {
      // If this is a layaway with payments, preserve them
      if (prev.payments && Array.isArray(prev.payments) && prev.payments.length > 0) {
        return {
          ...prev,
          paymentType: paymentType,
          payingAmount: total.toFixed(2),
          receivedAmount: "",
          change: 0
        };
      }
      // Otherwise, reset as normal
      return {
        ...prev,
        paymentType: paymentType,
        payingAmount: total.toFixed(2),
        receivedAmount: "",
        change: 0
      };
    });
  }, [paymentType, total]);

  // Add this useEffect to reset split payment state when modal opens or order/total changes
  useEffect(() => {
    if (isOpen && paymentType === "split") {
      setPaymentData(prev => ({
        ...prev,
        splitPayments: [],
        remainingAmount: total,
        newSplitMethod: "",
        newSplitAmount: "",
        newSplitRemaining: 0,
        editingPayment: null,
        momoProvider: "",
        customerPhone: "",
        referenceNumber: "",
        bankName: "",
        chequeDate: ""
      }));
    }
  }, [isOpen, total, paymentType]);

  // Determine if this is a layaway finalization (move above useEffect)
  const layawayPayments = Array.isArray(paymentData.payments)
    ? paymentData.payments.filter(p => p && typeof p.amount !== 'undefined')
    : paymentData.amount
      ? [{
          amount: paymentData.amount,
          method: paymentData.method,
          reference: paymentData.reference,
          date: paymentData.date || paymentData.timestamp || new Date().toISOString(),
          user: paymentData.user || null
        }]
      : [];
  const isLayaway = layawayPayments.length > 0;
  const layawayPaid = layawayPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const layawayTotalValue = typeof layawayTotal !== 'undefined' ? Number(layawayTotal) : (isLayaway ? layawayPaid + total : total);
  const layawayOutstanding = isLayaway ? layawayTotalValue - layawayPaid : 0;

  // Autofill receivedAmount for layaway (with outstanding balance) and for regular cash/momo
  useEffect(() => {
    if (isLayaway && paymentType !== 'split') {
      setPaymentData(prev => ({
        ...prev,
        receivedAmount: layawayOutstanding.toFixed(2)
      }));
    } else if (paymentType === 'momo' || paymentType === 'cash') {
      setPaymentData(prev => ({
        ...prev,
        receivedAmount: prev.payingAmount || total.toFixed(2)
      }));
    }
    // Do not disable the field, just auto-fill
  }, [isLayaway, layawayOutstanding, paymentType, total]);

  // Sync paymentData state with prop when modal is opened for a new layaway
  useEffect(() => {
    if (isOpen && propPaymentData && Array.isArray(propPaymentData.payments) && propPaymentData.payments.length > 0) {
      setPaymentData(prev => ({
        ...propPaymentData,
        paymentType: paymentType,
        payingAmount: total.toFixed(2),
        receivedAmount: "",
        change: 0,
        remainingAmount: total
      }));
    }
  }, [isOpen, propPaymentData, paymentType, total]);

  

  // Normalize paymentData: always ensure payments is an array
  useEffect(() => {
    setPaymentData(prev => {
      if (prev && !Array.isArray(prev.payments)) {
        if (prev.amount) {
          return {
            ...prev,
            payments: [
              {
                amount: prev.amount,
                method: prev.method,
                reference: prev.reference,
                date: prev.date || prev.timestamp || new Date().toISOString(),
                user: prev.user || null
              }
            ]
          };
        } else if (prev.payments && typeof prev.payments === 'object') {
          // If payments is a single object, wrap it in an array
          return {
            ...prev,
            payments: [prev.payments]
          };
        }
      }
      return prev;
    });
  }, [isOpen, propPaymentData, paymentData.amount]);

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
      paymentType,
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
    
    // Finalize order immediately with paymentInfo
    if (processCompleteTransaction) {
      processCompleteTransaction(paymentInfo);
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
            {/* Streamlined Split Payment Summary */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:call-split" className="w-6 h-6 text-purple-600" />
                  <span className="font-bold text-lg text-purple-800">Split Payment</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="text-xl font-bold text-purple-700">GHS {total.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-green-100 rounded-lg p-3">
                  <div className="text-sm text-green-600">Paid</div>
                  <div className="text-lg font-bold text-green-700">
                    GHS {paymentData.splitPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-orange-100 rounded-lg p-3">
                  <div className="text-sm text-orange-600">Remaining</div>
                  <div className="text-lg font-bold text-orange-700">
                    GHS {(total - paymentData.splitPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Split Payment Options */}
            {paymentData.remainingAmount > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-700">Quick Split Options:</div>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      const half = Math.ceil(paymentData.remainingAmount / 2);
                      const remaining = paymentData.remainingAmount - half;
                      if (half > 0) {
                        // Add half in cash
                        const cashPayment = {
                          id: Date.now(),
                          method: "cash",
                          amount: half,
                          status: 'pending',
                          timestamp: new Date().toISOString(),
                        };
                        
                        // Add remaining in momo
                        const momoPayment = {
                          id: Date.now() + 1,
                          method: "momo",
                          amount: remaining,
                          status: 'pending',
                          timestamp: new Date().toISOString(),
                        };
                        
                        const updatedPayments = [...paymentData.splitPayments, cashPayment, momoPayment];
                        const updatedPaid = updatedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                        setPaymentData(prev => ({
                          ...prev,
                          splitPayments: updatedPayments,
                          remainingAmount: total - updatedPaid,
                        }));
                        toast.success(`Split: Cash (GHS ${half.toLocaleString()}) + MoMo (GHS ${remaining.toLocaleString()})`);
                      }
                    }}
                    className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-green-100 to-blue-100 border border-green-300 rounded-xl hover:from-green-200 hover:to-blue-200 transition-all font-semibold text-gray-700 w-full max-w-md"
                  >
                    <Icon icon="mdi:cash" className="w-6 h-6 text-green-600" />
                    <span>Split 50/50</span>
                    <Icon icon="mdi:cellphone" className="w-6 h-6 text-blue-600" />
                  </button>
                </div>
              </div>
            )}

            {/* Custom Amount Input */}
            {paymentData.remainingAmount > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon="mdi:plus-circle" className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-800">Custom Amount</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-1">
                    <input
                      type="number"
                      step="0.01"
                      max={paymentData.remainingAmount}
                      value={paymentData.newSplitAmount || ""}
                      onChange={(e) => {
                        const amount = parseFloat(e.target.value) || 0;
                        setPaymentData(prev => ({
                          ...prev,
                          newSplitAmount: e.target.value
                        }));
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Max: GHS ${paymentData.remainingAmount.toLocaleString()}`}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <TooltipIconButton
                      label={`Enter amount in Cash, pay remaining (GHS ${(paymentData.remainingAmount - (parseFloat(paymentData.newSplitAmount) || 0)).toLocaleString()}) in Mobile Money`}
                      mode="light"
                      className="flex items-center justify-center gap-2 p-3 bg-green-100 border border-green-300 rounded-lg hover:bg-green-200 transition-colors font-medium text-green-700 w-full"
                      onClick={() => {
                        if (!paymentData.newSplitAmount) {
                          toast.error("Please enter an amount");
                          return;
                        }
                        const amount = parseFloat(paymentData.newSplitAmount) || 0;
                        if (amount <= 0) {
                          toast.error("Amount must be greater than zero");
                          return;
                        }
                        if (amount > paymentData.remainingAmount) {
                          toast.error("Amount cannot exceed remaining balance");
                          return;
                        }
                        
                        const remaining = paymentData.remainingAmount - amount;
                        
                        // Add the entered amount in cash
                        const cashPayment = {
                          id: Date.now(),
                          method: "cash",
                          amount: amount,
                          status: 'pending',
                          timestamp: new Date().toISOString(),
                        };
                        
                        // Add remaining balance in momo
                        const momoPayment = {
                          id: Date.now() + 1,
                          method: "momo",
                          amount: remaining,
                          status: 'pending',
                          timestamp: new Date().toISOString(),
                        };
                        
                        const updatedPayments = [...paymentData.splitPayments, cashPayment, momoPayment];
                        const updatedPaid = updatedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                        setPaymentData(prev => ({
                          ...prev,
                          splitPayments: updatedPayments,
                          remainingAmount: total - updatedPaid,
                          newSplitAmount: "",
                        }));
                        toast.success(`Cash: GHS ${amount.toLocaleString()} + MoMo: GHS ${remaining.toLocaleString()}`);
                      }}
                    >
                      <Icon icon="mdi:cash" className="w-5 h-5" />
                      <span>Cash + Balance MoMo</span>
                    </TooltipIconButton>
                    
                    <TooltipIconButton
                      label={`Enter amount in Mobile Money, pay remaining (GHS ${(paymentData.remainingAmount - (parseFloat(paymentData.newSplitAmount) || 0)).toLocaleString()}) in Cash`}
                      mode="light"
                      className="flex items-center justify-center gap-2 p-3 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 transition-colors font-medium text-blue-700 w-full"
                      onClick={() => {
                        if (!paymentData.newSplitAmount) {
                          toast.error("Please enter an amount");
                          return;
                        }
                        const amount = parseFloat(paymentData.newSplitAmount) || 0;
                        if (amount <= 0) {
                          toast.error("Amount must be greater than zero");
                          return;
                        }
                        if (amount > paymentData.remainingAmount) {
                          toast.error("Amount cannot exceed remaining balance");
                          return;
                        }
                        
                        const remaining = paymentData.remainingAmount - amount;
                        
                        // Add the entered amount in momo
                        const momoPayment = {
                          id: Date.now(),
                          method: "momo",
                          amount: amount,
                          status: 'pending',
                          timestamp: new Date().toISOString(),
                        };
                        
                        // Add remaining balance in cash
                        const cashPayment = {
                          id: Date.now() + 1,
                          method: "cash",
                          amount: remaining,
                          status: 'pending',
                          timestamp: new Date().toISOString(),
                        };
                        
                        const updatedPayments = [...paymentData.splitPayments, momoPayment, cashPayment];
                        const updatedPaid = updatedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                        setPaymentData(prev => ({
                          ...prev,
                          splitPayments: updatedPayments,
                          remainingAmount: total - updatedPaid,
                          newSplitAmount: "",
                        }));
                        toast.success(`MoMo: GHS ${amount.toLocaleString()} + Cash: GHS ${remaining.toLocaleString()}`);
                      }}
                    >
                      <Icon icon="mdi:cellphone" className="w-5 h-5" />
                      <span>MoMo + Balance Cash</span>
                    </TooltipIconButton>
                  </div>
                </div>
              </div>
            )}

            {/* Payment List - Simplified */}
            {paymentData.splitPayments.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon="mdi:format-list-bulleted" className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-800">Payment Summary</span>
                </div>
                
                <div className="space-y-2">
                  {paymentData.splitPayments.map((payment, index) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon 
                          icon={getPaymentTypeIcon(payment.method)} 
                          className="w-5 h-5 text-blue-600" 
                        />
                        <span className="font-medium">{getPaymentTypeLabel(payment.method)}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(payment.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-green-600">
                          GHS {payment.amount.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentData(prev => {
                              const updatedPayments = prev.splitPayments.filter(p => p.id !== payment.id);
                              const updatedPaid = updatedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                              return {
                                ...prev,
                                splitPayments: updatedPayments,
                                remainingAmount: total - updatedPaid
                              };
                            });
                            toast.success("Payment removed");
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Icon icon="mdi:delete" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Paid:</span>
                    <span className="font-semibold text-green-600">
                      GHS {paymentData.splitPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toLocaleString()}
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
        <div className="relative w-full max-w-5xl rounded-3xl transform transition-all duration-500 h-full overflow-hidden shadow-2xl shadow-black/20 bg-white/20 text-gray-900 border border-white/20 backdrop-blur-xl">
          {/* Header */}
          <div className="relative px-8 py-3 overflow-hidden bg-[#172840]">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-lg transform translate-x-12 translate-y-12"></div>
            </div>

            <div className="relative flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white tracking-tight">
                Finalize Sale - {getPaymentTypeLabel(paymentType)}
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

          {/* Product List (if provided and not layaway) */}
          {!isLayaway && <OrderItems products={products} quantities={quantities} />}

          {/* Content */}
          <div className="p-8 overflow-y-auto max-h-[calc(85vh-120px)] bg-white/60" style={{ minHeight: '200px' }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Layaway Summary or Payment Summary */}
              {isLayaway ? (
                <LayawaySummary 
                  isLayaway={isLayaway}
                  layawayTotalValue={layawayTotalValue}
                  layawayPaid={layawayPaid}
                  layawayOutstanding={layawayOutstanding}
                  layawayPayments={layawayPayments}
                  products={products}
                  quantities={quantities}
                  orderId={orderId}
                  customer={customer}
                  total={total}
                  paymentType={paymentType}
                  paymentData={paymentData}
                  users={allUsers}
                />
              ) : (
                <PaymentSummary orderId={orderId} customer={customer} total={total} paymentType={paymentType} paymentData={paymentData} users={allUsers} />
              )}

              {/* Payment Type Selection for Layaway Finalization */}
              {isLayaway && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentType}
                    onChange={e => {
                      // Allow split or other payment types
                      if (e.target.value === 'split') {
                        setPaymentData(prev => ({ ...prev, paymentType: 'split' }));
                      }
                      // You can add more logic for other types if needed
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="momo">Mobile Money</option>
                    <option value="card">Card</option>
                    <option value="split">Split Bill</option>
                  </select>
                </div>
              )}

              {/* Payment Amounts - Hidden for Split Payments */}
              {paymentType !== "split" && (
                <PaymentAmounts 
                  paymentData={paymentData} 
                  setPaymentData={setPaymentData} 
                  handleReceivedAmountChange={handleReceivedAmountChange} 
                />
              )}

              {/* Payment Type - Read Only (hide if layaway and type selector is shown) */}
              {!isLayaway && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Type
                  </label>
                  <div className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-700 font-medium flex items-center gap-2">
                    <Icon icon={getPaymentTypeIcon(paymentType)} className="w-5 h-5 text-green-600" />
                    {getPaymentTypeLabel(paymentType)}
                  </div>
                </div>
              )}

              {/* Payment Type Specific Fields */}
              {renderPaymentTypeFields()}

              {/* Customer Information */}
              <PaymentCustomerInfo 
                customer={customer}
                customers={customers}
                onCustomerChange={onCustomerChange}
                paymentData={paymentData}
                setPaymentData={setPaymentData}
                currentUser={user}
              />

              {/* Notes Section */}
              <PaymentNotes paymentData={paymentData} setPaymentData={setPaymentData} />


              {/* Action Buttons - sticky at bottom for better accessibility */}
              <div className="flex justify-end gap-4 pt-4 border-t  bottom-0 bg-white/80 z-10" style={{background: 'rgba(255,255,255,0.95)'}}>
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
                  {isLayaway ? 'Complete Layaway' : 'Finalize Payment'}
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