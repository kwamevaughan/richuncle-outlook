import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";

const SplitPaymentStable = ({ 
  paymentData, 
  setPaymentData, 
  total, 
  mode,
  getPaymentTypeIcon,
  getPaymentTypeLabel,
  toast
}) => {
  const inputRef = useRef(null);
  const [localAmount, setLocalAmount] = useState("");

  // Sync local amount with payment data only when needed
  useEffect(() => {
    if (paymentData.newSplitAmount !== localAmount) {
      setLocalAmount(paymentData.newSplitAmount || "");
    }
  }, [paymentData.newSplitAmount]);

  const addSplitPayment = (method, amount) => {
    if (amount <= 0 || amount > paymentData.remainingAmount) {
      toast.error("Invalid amount");
      return;
    }

    const newPayment = {
      id: Date.now(),
      method,
      amount,
      status: "pending",
      timestamp: new Date().toISOString(),
    };

    const updatedPayments = [...paymentData.splitPayments, newPayment];
    const updatedPaid = updatedPayments.reduce(
      (sum, p) => sum + (parseFloat(p.amount) || 0),
      0
    );

    setPaymentData((prev) => ({
      ...prev,
      splitPayments: updatedPayments,
      remainingAmount: total - updatedPaid,
      newSplitAmount: "",
    }));
    
    // Clear local amount
    setLocalAmount("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const addCashMomoBalance = (cashAmount) => {
    if (cashAmount <= 0 || cashAmount > paymentData.remainingAmount) {
      toast.error("Invalid amount");
      return;
    }

    const momoAmount = paymentData.remainingAmount - cashAmount;
    
    const cashPayment = {
      id: Date.now(),
      method: "cash",
      amount: cashAmount,
      status: "pending",
      timestamp: new Date().toISOString(),
    };

    const momoPayment = {
      id: Date.now() + 1,
      method: "momo",
      amount: momoAmount,
      status: "pending",
      timestamp: new Date().toISOString(),
    };

    const updatedPayments = [...paymentData.splitPayments, cashPayment, momoPayment];
    const updatedPaid = updatedPayments.reduce(
      (sum, p) => sum + (parseFloat(p.amount) || 0),
      0
    );

    setPaymentData((prev) => ({
      ...prev,
      splitPayments: updatedPayments,
      remainingAmount: total - updatedPaid,
      newSplitAmount: "",
    }));
    
    // Clear local amount
    setLocalAmount("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    
    toast.success(
      `Split: Cash (GHS ${cashAmount.toLocaleString()}) + MoMo (GHS ${momoAmount.toLocaleString()})`
    );
  };

  const addMomoCashBalance = (momoAmount) => {
    if (momoAmount <= 0 || momoAmount > paymentData.remainingAmount) {
      toast.error("Invalid amount");
      return;
    }

    const cashAmount = paymentData.remainingAmount - momoAmount;
    
    const momoPayment = {
      id: Date.now(),
      method: "momo",
      amount: momoAmount,
      status: "pending",
      timestamp: new Date().toISOString(),
    };

    const cashPayment = {
      id: Date.now() + 1,
      method: "cash",
      amount: cashAmount,
      status: "pending",
      timestamp: new Date().toISOString(),
    };

    const updatedPayments = [...paymentData.splitPayments, momoPayment, cashPayment];
    const updatedPaid = updatedPayments.reduce(
      (sum, p) => sum + (parseFloat(p.amount) || 0),
      0
    );

    setPaymentData((prev) => ({
      ...prev,
      splitPayments: updatedPayments,
      remainingAmount: total - updatedPaid,
      newSplitAmount: "",
    }));
    
    // Clear local amount
    setLocalAmount("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    
    toast.success(
      `Split: MoMo (GHS ${momoAmount.toLocaleString()}) + Cash (GHS ${cashAmount.toLocaleString()})`
    );
  };

  const removeSplitPayment = (paymentId) => {
    setPaymentData((prev) => {
      const updatedPayments = prev.splitPayments.filter(
        (p) => p.id !== paymentId
      );
      const updatedPaid = updatedPayments.reduce(
        (sum, p) => sum + (parseFloat(p.amount) || 0),
        0
      );
      return {
        ...prev,
        splitPayments: updatedPayments,
        remainingAmount: total - updatedPaid,
      };
    });
    toast.success("Payment removed");
  };

  const quickSplit5050 = () => {
    const half = Math.ceil(paymentData.remainingAmount / 2);
    const remaining = paymentData.remainingAmount - half;

    if (half > 0) {
      const cashPayment = {
        id: Date.now(),
        method: "cash",
        amount: half,
        status: "pending",
        timestamp: new Date().toISOString(),
      };

      const momoPayment = {
        id: Date.now() + 1,
        method: "momo",
        amount: remaining,
        status: "pending",
        timestamp: new Date().toISOString(),
      };

      const updatedPayments = [
        ...paymentData.splitPayments,
        cashPayment,
        momoPayment,
      ];
      const updatedPaid = updatedPayments.reduce(
        (sum, p) => sum + (parseFloat(p.amount) || 0),
        0
      );

      setPaymentData((prev) => ({
        ...prev,
        splitPayments: updatedPayments,
        remainingAmount: total - updatedPaid,
      }));

      toast.success(
        `Split: Cash (GHS ${half.toLocaleString()}) + MoMo (GHS ${remaining.toLocaleString()})`
      );
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    console.log("Split amount input (stable component):", value);
    
    // Update local state immediately (no re-render of parent)
    setLocalAmount(value);
    
    // Debounce the parent state update
    clearTimeout(window.splitAmountDebounce);
    window.splitAmountDebounce = setTimeout(() => {
      setPaymentData((prev) => ({
        ...prev,
        newSplitAmount: value,
      }));
    }, 100);
  };

  return (
    <div
      className={`
        rounded-3xl border backdrop-blur-xl transition-all duration-300 hover:shadow-xl
        ${
          mode === "dark"
            ? "bg-gray-800/60 border-gray-700/50 shadow-2xl shadow-gray-900/20"
            : "bg-white/80 border-gray-200/50 shadow-xl shadow-gray-900/5"
        }
        space-y-8
      `}
    >
      {/* Header */}
      <div
        className={`px-8 py-6 border-b ${
          mode === "dark" ? "border-gray-700/50" : "border-gray-200/50"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-2xl ${
              mode === "dark"
                ? "bg-blue-500/10 text-blue-400"
                : "bg-blue-500/10 text-blue-600"
            }`}
          >
            <Icon icon="mdi:call-split" className="w-6 h-6" />
          </div>
          <h3
            className={`text-xl font-bold ${
              mode === "dark" ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Split Payment
          </h3>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Payment Progress */}
        <div
          className={`p-6 rounded-2xl border-2 border-dashed ${
            mode === "dark"
              ? "border-purple-500/30 bg-purple-900/10"
              : "border-purple-300/50 bg-purple-50/50"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  mode === "dark" ? "bg-purple-500/20" : "bg-purple-100"
                }`}
              >
                <Icon
                  icon="mdi:progress-check"
                  className="w-6 h-6 text-purple-600"
                />
              </div>
              <div>
                <h4
                  className={`font-bold text-lg ${
                    mode === "dark" ? "text-purple-300" : "text-purple-800"
                  }`}
                >
                  Payment Progress
                </h4>
                <p
                  className={`text-sm ${
                    mode === "dark" ? "text-purple-400" : "text-purple-600"
                  }`}
                >
                  Total: GHS {total.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div
            className={`w-full h-3 rounded-full overflow-hidden ${
              mode === "dark" ? "bg-gray-700" : "bg-gray-200"
            }`}
          >
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(
                  100,
                  ((total - paymentData.remainingAmount) / total) * 100
                )}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div
              className={`text-center p-4 rounded-xl ${
                mode === "dark" ? "bg-green-900/20" : "bg-green-50"
              }`}
            >
              <div
                className={`text-sm font-medium ${
                  mode === "dark" ? "text-green-300" : "text-green-600"
                }`}
              >
                Paid
              </div>
              <div
                className={`text-xl font-bold ${
                  mode === "dark" ? "text-green-400" : "text-green-700"
                }`}
              >
                GHS {(total - paymentData.remainingAmount).toLocaleString()}
              </div>
            </div>
            <div
              className={`text-center p-4 rounded-xl ${
                mode === "dark" ? "bg-orange-900/20" : "bg-orange-50"
              }`}
            >
              <div
                className={`text-sm font-medium ${
                  mode === "dark" ? "text-orange-300" : "text-orange-600"
                }`}
              >
                Remaining
              </div>
              <div
                className={`text-xl font-bold ${
                  mode === "dark" ? "text-orange-400" : "text-orange-700"
                }`}
              >
                GHS {paymentData.remainingAmount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {paymentData.remainingAmount > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Icon
                icon="mdi:lightning-bolt"
                className="w-5 h-5 text-yellow-500"
              />
              <h4
                className={`font-semibold ${
                  mode === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Quick Split
              </h4>
            </div>

            <button
              onClick={quickSplit5050}
              className={`
                w-full px-8 py-4 text-lg h-16 relative inline-flex items-center justify-center gap-3 font-semibold rounded-2xl
                transition-all duration-300 transform active:scale-95 overflow-hidden
                focus:outline-none focus:ring-2 focus:ring-offset-2
                bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800
                text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30
                focus:ring-blue-500 hover:scale-105
              `}
            >
              <Icon icon="mdi:call-split" className="w-5 h-5" />
              Split 50/50 (Cash + MoMo)
            </button>
          </div>
        )}

        {/* Custom Amount Input - STABLE */}
        {paymentData.remainingAmount > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Icon icon="mdi:calculator" className="w-5 h-5 text-blue-500" />
              <h4
                className={`font-semibold ${
                  mode === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Custom Amount
              </h4>
            </div>

            <div className="relative">
              <input
                ref={inputRef}
                type="number"
                step="0.01"
                max={paymentData.remainingAmount}
                min="0.01"
                value={localAmount}
                onChange={handleAmountChange}
                className={`
                  w-full h-16 px-4 pt-6 pb-2 pl-12 border-2 rounded-2xl transition-all duration-300
                  focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/20
                  ${
                    mode === "dark"
                      ? "border-gray-600 bg-gray-800/50 text-gray-100 placeholder-gray-400 backdrop-blur-sm hover:border-gray-500"
                      : "border-gray-200 bg-white/80 text-gray-900 placeholder-gray-500 backdrop-blur-sm hover:border-gray-300"
                  }
                  focus:outline-none focus:ring-0
                `}
                placeholder={`Max: GHS ${paymentData.remainingAmount.toLocaleString()}`}
              />
              <div
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
                  mode === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <Icon icon="fa6-solid:cedi-sign" className="w-5 h-5" />
              </div>
              <label
                className={`
                  absolute left-12 top-2 text-xs font-medium transition-colors duration-300
                  ${mode === "dark" ? "text-gray-400" : "text-gray-600"}
                `}
              >
                Enter Amount
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  const amount = parseFloat(localAmount) || 0;
                  if (amount > 0 && amount <= paymentData.remainingAmount) {
                    addCashMomoBalance(amount);
                  } else {
                    toast.error("Please enter a valid amount");
                  }
                }}
                disabled={!localAmount || parseFloat(localAmount) <= 0}
                className={`
                  px-6 py-3 text-base h-12 relative inline-flex items-center justify-center gap-3 font-semibold rounded-2xl
                  transition-all duration-300 transform active:scale-95 disabled:opacity-50 
                  disabled:cursor-not-allowed disabled:transform-none overflow-hidden
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700
                  text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30
                  focus:ring-green-500 hover:scale-105
                `}
              >
                <Icon icon="mdi:cash" className="w-5 h-5" />
                Cash + MoMo Balance
              </button>

              <button
                onClick={() => {
                  const amount = parseFloat(localAmount) || 0;
                  if (amount > 0 && amount <= paymentData.remainingAmount) {
                    addMomoCashBalance(amount);
                  } else {
                    toast.error("Please enter a valid amount");
                  }
                }}
                disabled={!localAmount || parseFloat(localAmount) <= 0}
                className={`
                  px-6 py-3 text-base h-12 relative inline-flex items-center justify-center gap-3 font-semibold rounded-2xl
                  transition-all duration-300 transform active:scale-95 disabled:opacity-50 
                  disabled:cursor-not-allowed disabled:transform-none overflow-hidden
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800
                  text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30
                  focus:ring-blue-500 hover:scale-105
                `}
              >
                <Icon icon="mdi:cellphone" className="w-5 h-5" />
                MoMo + Cash Balance
              </button>
            </div>
          </div>
        )}

        {/* Payment List */}
        {paymentData.splitPayments.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Icon
                icon="mdi:format-list-bulleted"
                className="w-5 h-5 text-gray-500"
              />
              <h4
                className={`font-semibold ${
                  mode === "dark" ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Payment Summary
              </h4>
            </div>

            <div className="space-y-3">
              {paymentData.splitPayments.map((payment, index) => (
                <div
                  key={payment.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 hover:shadow-md ${
                    mode === "dark"
                      ? "bg-gray-700/50 border-gray-600/50"
                      : "bg-gray-50/80 border-gray-200/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-xl ${
                        payment.method === "cash"
                          ? mode === "dark"
                            ? "bg-green-900/30"
                            : "bg-green-100"
                          : mode === "dark"
                          ? "bg-blue-900/30"
                          : "bg-blue-100"
                      }`}
                    >
                      <Icon
                        icon={getPaymentTypeIcon(payment.method)}
                        className={`w-5 h-5 ${
                          payment.method === "cash"
                            ? "text-green-600"
                            : "text-blue-600"
                        }`}
                      />
                    </div>
                    <div>
                      <div
                        className={`font-semibold ${
                          mode === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {getPaymentTypeLabel(payment.method)}
                      </div>
                      <div
                        className={`text-sm ${
                          mode === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {new Date(payment.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-green-600 text-lg">
                        GHS {payment.amount.toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => removeSplitPayment(payment.id)}
                      className={`
                        px-4 py-2 text-sm h-10 relative inline-flex items-center justify-center gap-3 font-semibold rounded-2xl
                        transition-all duration-200  
                         hover:bg-red-50
                        text-white shadow-xs shadow-red-500/25 hover:shadow-xl hover:shadow-red-200/30
                         
                      `}
                    >
                      <Icon icon="mynaui:trash" className="text-red-600 w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div
              className={`p-4 rounded-2xl border-2 border-dashed ${
                paymentData.remainingAmount === 0
                  ? mode === "dark"
                    ? "border-green-500/50 bg-green-900/10"
                    : "border-green-300/50 bg-green-50/50"
                  : mode === "dark"
                  ? "border-orange-500/50 bg-orange-900/10"
                  : "border-orange-300/50 bg-orange-50/50"
              }`}
            >
              <div className="flex justify-between items-center">
                <span
                  className={`font-bold text-lg ${
                    mode === "dark" ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  Status:
                </span>
                <span
                  className={`font-bold text-lg ${
                    paymentData.remainingAmount === 0
                      ? "text-green-600"
                      : "text-orange-600"
                  }`}
                >
                  {paymentData.remainingAmount === 0
                    ? "Complete"
                    : `GHS ${paymentData.remainingAmount.toLocaleString()} Remaining`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplitPaymentStable;