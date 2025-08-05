import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { playBellBeep } from "../utils/posSounds";
import PaymentSummary from "./payment/PaymentSummary";
import PaymentNotes from "./payment/PaymentNotes";
import PaymentCustomerInfo from "./payment/PaymentCustomerInfo";
import MomoPayment from "./payment/types/MomoPayment";
import {
  getPaymentTypeLabel,
  getPaymentTypeIcon,
  validatePaymentData,
} from "./payment/utils/paymentHelpers";
import LayawaySummary from "./payment/LayawaySummary";
import OrderItems from "./OrderItems";
import TooltipIconButton from "./TooltipIconButton";

// Modern Input Component with Floating Labels
const ModernInput = ({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  mode = "light",
  icon,
  step,
  max,
  min,
  disabled = false,
}) => {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);

  useEffect(() => {
    setHasValue(!!value);
  }, [value]);

  const isFloating = focused || hasValue;

  return (
    <div className="relative group">
      <div
        className={`relative transition-all duration-300 ${
          focused ? "transform scale-[1.02]" : ""
        }`}
      >
        {icon && (
          <div
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 z-10 ${
              focused
                ? "text-blue-500"
                : mode === "dark"
                ? "text-gray-400"
                : "text-gray-500"
            }`}
          >
            <Icon icon={icon} className="w-5 h-5" />
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          step={step}
          max={max}
          min={min}
          disabled={disabled}
          className={`
            w-full h-16 px-4 pt-6 pb-2 border-2 rounded-2xl transition-all duration-300
            ${icon ? "pl-12" : "pl-4"}
            ${
              focused
                ? "border-blue-500 shadow-lg shadow-blue-500/20"
                : mode === "dark"
                ? "border-gray-600 hover:border-gray-500"
                : "border-gray-200 hover:border-gray-300"
            }
            ${
              mode === "dark"
                ? "bg-gray-800/50 text-gray-100 backdrop-blur-sm"
                : "bg-white/80 text-gray-900 backdrop-blur-sm"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            focus:outline-none focus:ring-0
          `}
          placeholder=""
        />

        <label
          className={`
          absolute left-4 transition-all duration-300 pointer-events-none
          ${icon ? "left-12" : "left-4"}
          ${
            isFloating
              ? "top-2 text-xs font-medium"
              : "top-1/2 transform -translate-y-1/2 text-base"
          }
          ${
            focused
              ? "text-blue-500"
              : mode === "dark"
              ? "text-gray-400"
              : "text-gray-600"
          }
        `}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {/* Focus ring effect */}
        <div
          className={`
          absolute inset-0 rounded-2xl transition-all duration-300 pointer-events-none
          ${
            focused
              ? "ring-2 ring-blue-500/20 ring-offset-2 ring-offset-transparent"
              : ""
          }
        `}
        />
      </div>
    </div>
  );
};

// Modern Select Component
const ModernSelect = ({
  label,
  value,
  onChange,
  options,
  required = false,
  mode = "light",
  icon,
}) => {
  const [focused, setFocused] = useState(false);
  const hasValue = !!value;
  const isFloating = focused || hasValue;

  return (
    <div className="relative group">
      <div
        className={`relative transition-all duration-300 ${
          focused ? "transform scale-[1.02]" : ""
        }`}
      >
        {icon && (
          <div
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 z-10 ${
              focused
                ? "text-blue-500"
                : mode === "dark"
                ? "text-gray-400"
                : "text-gray-500"
            }`}
          >
            <Icon icon={icon} className="w-5 h-5" />
          </div>
        )}

        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full h-16 px-4 pt-6 pb-2 border-2 rounded-2xl transition-all duration-300 appearance-none
            ${icon ? "pl-12" : "pl-4"}
            ${
              focused
                ? "border-blue-500 shadow-lg shadow-blue-500/20"
                : mode === "dark"
                ? "border-gray-600 hover:border-gray-500"
                : "border-gray-200 hover:border-gray-300"
            }
            ${
              mode === "dark"
                ? "bg-gray-800/50 text-gray-100 backdrop-blur-sm"
                : "bg-white/80 text-gray-900 backdrop-blur-sm"
            }
            focus:outline-none focus:ring-0 cursor-pointer
          `}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label
          className={`
          absolute left-4 transition-all duration-300 pointer-events-none
          ${icon ? "left-12" : "left-4"}
          ${
            isFloating
              ? "top-2 text-xs font-medium"
              : "top-1/2 transform -translate-y-1/2 text-base"
          }
          ${
            focused
              ? "text-blue-500"
              : mode === "dark"
              ? "text-gray-400"
              : "text-gray-600"
          }
        `}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {/* Dropdown arrow */}
        <div
          className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 pointer-events-none ${
            focused
              ? "text-blue-500"
              : mode === "dark"
              ? "text-gray-400"
              : "text-gray-500"
          }`}
        >
          <Icon icon="mdi:chevron-down" className="w-5 h-5" />
        </div>

        {/* Focus ring effect */}
        <div
          className={`
          absolute inset-0 rounded-2xl transition-all duration-300 pointer-events-none
          ${
            focused
              ? "ring-2 ring-blue-500/20 ring-offset-2 ring-offset-transparent"
              : ""
          }
        `}
        />
      </div>
    </div>
  );
};

// Modern Button Component
const ModernButton = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  mode = "light",
  className = "",
}) => {
  const baseClasses = `
    relative inline-flex items-center justify-center gap-3 font-semibold rounded-2xl
    transition-all duration-300 transform active:scale-95 disabled:opacity-50 
    disabled:cursor-not-allowed disabled:transform-none overflow-hidden
    focus:outline-none focus:ring-2 focus:ring-offset-2
  `;

  const sizeClasses = {
    sm: "px-4 py-2 text-sm h-10",
    md: "px-6 py-3 text-base h-12",
    lg: "px-8 py-4 text-lg h-16",
  };

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800
      text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30
      focus:ring-blue-500 hover:scale-105
    `,
    success: `
      bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700
      text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30
      focus:ring-green-500 hover:scale-105
    `,
    secondary:
      mode === "dark"
        ? `
        bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600
        shadow-lg shadow-gray-900/25 hover:shadow-xl hover:shadow-gray-900/30
        focus:ring-gray-500 hover:scale-105
      `
        : `
        bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300
        shadow-lg shadow-gray-500/10 hover:shadow-xl hover:shadow-gray-500/15
        focus:ring-gray-500 hover:scale-105
      `,
    danger: `
      bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800
      text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30
      focus:ring-red-500 hover:scale-105
    `,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {/* Shimmer effect for primary buttons */}
      {variant === "primary" && (
        <div className="absolute inset-0 -top-px bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
      )}

      {loading ? (
        <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
      ) : icon ? (
        <Icon icon={icon} className="w-5 h-5" />
      ) : null}

      {children}
    </button>
  );
};

// Modern Card Component
const ModernCard = ({
  children,
  title,
  icon,
  mode = "light",
  className = "",
}) => {
  return (
    <div
      className={`
      rounded-3xl border backdrop-blur-xl transition-all duration-300 hover:shadow-xl
      ${
        mode === "dark"
          ? "bg-gray-800/60 border-gray-700/50 shadow-2xl shadow-gray-900/20"
          : "bg-white/80 border-gray-200/50 shadow-xl shadow-gray-900/5"
      }
      ${className}
    `}
    >
      {title && (
        <div
          className={`px-8 py-6 border-b ${
            mode === "dark" ? "border-gray-700/50" : "border-gray-200/50"
          }`}
        >
          <div className="flex items-center gap-4">
            {icon && (
              <div
                className={`p-3 rounded-2xl ${
                  mode === "dark"
                    ? "bg-blue-500/10 text-blue-400"
                    : "bg-blue-500/10 text-blue-600"
                }`}
              >
                <Icon icon={icon} className="w-6 h-6" />
              </div>
            )}
            <h3
              className={`text-xl font-bold ${
                mode === "dark" ? "text-gray-100" : "text-gray-900"
              }`}
            >
              {title}
            </h3>
          </div>
        </div>
      )}
      <div className="p-8">{children}</div>
    </div>
  );
};

// Collapsible Section Component for Streamlined UI
const CollapsibleSection = ({
  children,
  title,
  icon,
  mode = "light",
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={`px-6 py-4 border-b ${
        mode === "dark" ? "border-gray-700/30" : "border-gray-200/30"
      }`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:shadow-md ${
          mode === "dark"
            ? "bg-gray-800/30 hover:bg-gray-800/50 text-gray-200"
            : "bg-gray-200/50 hover:bg-gray-100/50 text-gray-700"
        }`}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <Icon
              icon={icon}
              className={`w-5 h-5 ${
                mode === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            />
          )}
          <span className="font-medium">{title}</span>
        </div>
        <Icon
          icon={isOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
          className={`w-5 h-5 transition-transform duration-300 ${
            mode === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        />
      </button>

      {isOpen && (
        <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
};

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
  paymentData: propPaymentData,
  layawayTotal,
  products = [],
  quantities = {},
  mode = "light",
}) => {
  const modalRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [animationState, setAnimationState] = useState("closed");

  // Initialize payment data
  const [paymentData, setPaymentData] = useState(() => {
    if (
      propPaymentData &&
      Array.isArray(propPaymentData.payments) &&
      propPaymentData.payments.length > 0
    ) {
      return {
        ...propPaymentData,
        paymentType: paymentType,
        payingAmount: total.toFixed(2),
        receivedAmount: "",
        change: 0,
        remainingAmount: total,
      };
    }
    return {
      receivedAmount: "",
      payingAmount: total.toFixed(2),
      change: 0,
      paymentType: paymentType,
      paymentReceiver: user?.id || "",
      saleNote: "",
      referenceNumber: "",
      cardType: "",
      momoProvider: "",
      customerPhone: "",
      transactionId: "",
      splitPayments: [],
      remainingAmount: total,
      bankName: "",
      chequeDate: "",
    };
  });

  // Animation effects
  useEffect(() => {
    if (isOpen) {
      setAnimationState("opening");
      setTimeout(() => setAnimationState("open"), 50);
    } else {
      setAnimationState("closing");
      setTimeout(() => setAnimationState("closed"), 300);
    }
  }, [isOpen]);

  // Reset form when payment type changes
  useEffect(() => {
    setPaymentData((prev) => {
      if (
        prev.payments &&
        Array.isArray(prev.payments) &&
        prev.payments.length > 0
      ) {
        return {
          ...prev,
          paymentType: paymentType,
          payingAmount: total.toFixed(2),
          receivedAmount: "",
          change: 0,
        };
      }
      return {
        ...prev,
        paymentType: paymentType,
        payingAmount: total.toFixed(2),
        receivedAmount: "",
        change: 0,
      };
    });
  }, [paymentType, total]);

  // Split payment reset
  useEffect(() => {
    if (isOpen && paymentType === "split") {
      setPaymentData((prev) => ({
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
        chequeDate: "",
      }));
    }
  }, [isOpen, total, paymentType]);

  // Layaway calculations
  const layawayPayments = Array.isArray(paymentData.payments)
    ? paymentData.payments.filter((p) => p && typeof p.amount !== "undefined")
    : paymentData.amount
    ? [
        {
          amount: paymentData.amount,
          method: paymentData.method,
          reference: paymentData.reference,
          date:
            paymentData.date ||
            paymentData.timestamp ||
            new Date().toISOString(),
          user: paymentData.user || null,
        },
      ]
    : [];
  const isLayaway = layawayPayments.length > 0;
  const layawayPaid = layawayPayments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );
  const layawayTotalValue =
    typeof layawayTotal !== "undefined"
      ? Number(layawayTotal)
      : isLayaway
      ? layawayPaid + total
      : total;
  const layawayOutstanding = isLayaway ? layawayTotalValue - layawayPaid : 0;

  // Auto-fill received amount
  useEffect(() => {
    if (isLayaway && paymentType !== "split") {
      setPaymentData((prev) => ({
        ...prev,
        receivedAmount: layawayOutstanding.toFixed(2),
      }));
    } else if (paymentType === "momo" || paymentType === "cash") {
      setPaymentData((prev) => ({
        ...prev,
        receivedAmount: prev.payingAmount || total.toFixed(2),
      }));
    }
  }, [isLayaway, layawayOutstanding, paymentType, total]);

  const handleReceivedAmountChange = (value) => {
    const received = parseFloat(value) || 0;
    const paying = parseFloat(paymentData.payingAmount) || 0;
    const change = Math.max(0, received - paying);

    setPaymentData((prev) => ({
      ...prev,
      receivedAmount: value,
      change: change,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
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
        await processCompleteTransaction(paymentInfo);
      }

      // Success feedback
      playBellBeep();
      toast.success("Payment processed successfully!");

      // Close modal
      onClose();
    } catch (error) {
      toast.error("Payment processing failed. Please try again.");
      console.error("Payment error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Modern Split Payment Component
  const ModernSplitPayment = () => {
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

    return (
      <ModernCard
        title="Split Payment"
        icon="mdi:call-split"
        mode={mode}
        className="space-y-8"
      >
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

            <ModernButton
              onClick={quickSplit5050}
              variant="primary"
              size="lg"
              icon="mdi:call-split"
              className="w-full"
            >
              Split 50/50 (Cash + MoMo)
            </ModernButton>
          </div>
        )}

        {/* Custom Amount Input */}
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

            <ModernInput
              label="Enter Amount"
              value={paymentData.newSplitAmount || ""}
              onChange={(value) =>
                setPaymentData((prev) => ({ ...prev, newSplitAmount: value }))
              }
              type="number"
              step="0.01"
              max={paymentData.remainingAmount}
              min="0.01"
              icon="mdi:currency-usd"
              mode={mode}
            />

            <div className="grid grid-cols-2 gap-4">
              <ModernButton
                onClick={() => {
                  const amount = parseFloat(paymentData.newSplitAmount) || 0;
                  if (amount > 0 && amount <= paymentData.remainingAmount) {
                    addSplitPayment("cash", amount);
                    const remaining = paymentData.remainingAmount - amount;
                    if (remaining > 0) {
                      addSplitPayment("momo", remaining);
                    }
                  } else {
                    toast.error("Please enter a valid amount");
                  }
                }}
                variant="success"
                icon="mdi:cash"
                disabled={
                  !paymentData.newSplitAmount ||
                  parseFloat(paymentData.newSplitAmount) <= 0
                }
              >
                Cash + MoMo Balance
              </ModernButton>

              <ModernButton
                onClick={() => {
                  const amount = parseFloat(paymentData.newSplitAmount) || 0;
                  if (amount > 0 && amount <= paymentData.remainingAmount) {
                    addSplitPayment("momo", amount);
                    const remaining = paymentData.remainingAmount - amount;
                    if (remaining > 0) {
                      addSplitPayment("cash", remaining);
                    }
                  } else {
                    toast.error("Please enter a valid amount");
                  }
                }}
                variant="primary"
                icon="mdi:cellphone"
                disabled={
                  !paymentData.newSplitAmount ||
                  parseFloat(paymentData.newSplitAmount) <= 0
                }
              >
                MoMo + Cash Balance
              </ModernButton>
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
                    <ModernButton
                      onClick={() => removeSplitPayment(payment.id)}
                      variant="danger"
                      size="sm"
                      icon="mdi:delete"
                    />
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
      </ModernCard>
    );
  };

  const renderPaymentTypeFields = () => {
    switch (paymentType) {
      case "momo":
        return (
          <ModernCard
            title="Mobile Money Details"
            icon="mdi:cellphone"
            mode={mode}
          >
            <MomoPayment
              paymentData={paymentData}
              setPaymentData={setPaymentData}
              total={total}
            />
          </ModernCard>
        );

      case "card":
        return (
          <ModernCard
            title="Card Payment Details"
            icon="mdi:credit-card"
            mode={mode}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ModernSelect
                label="Card Type"
                value={paymentData.cardType}
                onChange={(value) =>
                  setPaymentData((prev) => ({ ...prev, cardType: value }))
                }
                options={[
                  { value: "visa", label: "Visa" },
                  { value: "mastercard", label: "Mastercard" },
                  { value: "amex", label: "American Express" },
                  { value: "local", label: "Local Card" },
                ]}
                icon="mdi:credit-card"
                mode={mode}
                required
              />
              <ModernInput
                label="Reference Number"
                value={paymentData.referenceNumber}
                onChange={(value) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    referenceNumber: value,
                  }))
                }
                icon="mdi:receipt"
                mode={mode}
                required
              />
            </div>
          </ModernCard>
        );

      case "bank_transfer":
        return (
          <ModernCard title="Bank Transfer Details" icon="mdi:bank" mode={mode}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ModernInput
                label="Bank Name"
                value={paymentData.bankName}
                onChange={(value) =>
                  setPaymentData((prev) => ({ ...prev, bankName: value }))
                }
                icon="mdi:bank"
                mode={mode}
                required
              />
              <ModernInput
                label="Reference Number"
                value={paymentData.referenceNumber}
                onChange={(value) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    referenceNumber: value,
                  }))
                }
                icon="mdi:receipt"
                mode={mode}
                required
              />
            </div>
          </ModernCard>
        );

      case "split":
        return <ModernSplitPayment />;

      default:
        return null;
    }
  };

  if (animationState === "closed") return null;

  return (
    <div
      className={`fixed inset-0 z-[60] overflow-y-auto transition-all duration-300 ${
        animationState === "open" ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Enhanced Backdrop */}
      <div
        className="fixed inset-0 transition-all duration-500"
        style={{
          background:
            mode === "dark"
              ? `
              radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.02) 0%, rgba(15, 23, 42, 0.05) 100%)
            `
              : `
              radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(248, 250, 252, 0.01) 0%, rgba(248, 250, 252, 0.03) 100%)
            `,
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-6">
        <div
          ref={modalRef}
          className={`
            relative w-full max-w-5xl transform transition-all duration-500
            ${
              animationState === "open"
                ? "scale-100 translate-y-0"
                : "scale-95 translate-y-8"
            }
          `}
          style={{
            borderRadius: "32px",
            background:
              mode === "dark"
                ? "linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)"
                : "linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)",
            backdropFilter: "blur(40px)",
            border:
              mode === "dark"
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : "1px solid rgba(255, 255, 255, 0.8)",
            boxShadow:
              mode === "dark"
                ? "0 32px 64px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)"
                : "0 32px 64px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.8)",
          }}
        >
          {/* Enhanced Header */}
          <div
            className="relative overflow-hidden"
            style={{ borderRadius: "32px 32px 0 0" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent" />

            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
              <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative px-10 py-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-white/15 rounded-3xl backdrop-blur-sm border border-white/20">
                    <Icon
                      icon={getPaymentTypeIcon(paymentType)}
                      className="w-10 h-10 text-white"
                    />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight mb-1">
                      Finalize Sale
                    </h2>
                    <p className="text-blue-100 text-lg font-medium">
                      {getPaymentTypeLabel(paymentType)} Payment • Order #
                      {orderId}
                    </p>
                  </div>
                </div>

                <ModernButton
                  onClick={onClose}
                  variant="secondary"
                  size="md"
                  icon="heroicons:x-mark"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30"
                />
              </div>
            </div>
          </div>

          {/* Collapsible Product List */}
          {!isLayaway && (
            <CollapsibleSection
              title={`View Items (${(() => {
                if (!Array.isArray(products)) return 0;

                // If quantities is empty but we have products, assume each product has quantity 1
                if (!quantities || Object.keys(quantities).length === 0) {
                  return products.length;
                }

                // Try multiple common patterns for matching products with quantities
                const count = products.filter((p) => {
                  // Try different possible keys that might be used
                  const possibleKeys = [
                    p.id, // Most common: product.id
                    p.product_id, // Alternative: product.product_id
                    p.name, // By name: product.name
                    String(p.id), // String version of ID
                    String(p.product_id), // String version of product_id
                  ].filter((key) => key != null); // Remove null/undefined keys

                  // Check if any of these keys have a quantity > 0
                  return possibleKeys.some((key) => (quantities[key] || 0) > 0);
                }).length;

                return count;
              })()})`}
              icon="mdi:package-variant"
              mode={mode}
              defaultOpen={true}
            >
              <OrderItems products={products} quantities={quantities} />
            </CollapsibleSection>
          )}

          {/* Content Area - Streamlined */}
          <div className="px-6 py-6 max-h-[calc(85vh-200px)] overflow-y-auto space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Streamlined Payment Header - Essential Info Only */}

              {/* Streamlined Payment Input - Essential Fields Only */}
              {paymentType !== "split" && (
                <div className="space-y-4">
                  {/* Payment Amount Input - Simplified */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-2xl border ${
                        mode === "dark"
                          ? "bg-gray-800/40 border-gray-700/50"
                          : "bg-white/60 border-gray-200/50"
                      }`}
                    >
                      <div className="text-center flex items-center gap-4">
                        <div
                          className={`text-sm font-medium ${
                            mode === "dark" ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Total Amount to Pay
                        </div>
                        <div className="text-3xl font-bold text-blue-600 mt-1">
                          GHS{" "}
                          {parseFloat(
                            paymentData.payingAmount || 0
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <ModernInput
                      label="Amount Received"
                      value={paymentData.receivedAmount}
                      onChange={handleReceivedAmountChange}
                      type="number"
                      step="0.01"
                      icon="mdi:cash"
                      mode={mode}
                      required
                    />
                  </div>

                  {/* Change Display - Compact */}
                  {paymentData.change > 0 && (
                    <div
                      className={`p-4 rounded-2xl border-2 border-dashed ${
                        mode === "dark"
                          ? "border-green-500/30 bg-green-900/10"
                          : "border-green-300/50 bg-green-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon
                            icon="mdi:cash-refund"
                            className="w-5 h-5 text-green-600"
                          />
                          <span
                            className={`font-semibold ${
                              mode === "dark"
                                ? "text-green-300"
                                : "text-green-700"
                            }`}
                          >
                            Change to Give:
                          </span>
                        </div>
                        <div className="text-xl font-bold text-green-600">
                          GHS {paymentData.change.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Type Specific Fields */}
              {renderPaymentTypeFields()}

              {/* Collapsible Additional Options */}
              <CollapsibleSection
                title="Additional Options"
                icon="mdi:cog"
                mode={mode}
                defaultOpen={false}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-2xl border ${
                        mode === "dark"
                          ? "bg-gray-800/40 border-gray-700/50"
                          : "bg-white/60 border-gray-200/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          icon="mdi:account"
                          className={`w-5 h-5 ${
                            mode === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        />
                        <div>
                          <div
                            className={`text-xs font-medium ${
                              mode === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            Payment Receiver
                          </div>
                          <div
                            className={`font-semibold ${
                              mode === "dark"
                                ? "text-gray-200"
                                : "text-gray-800"
                            }`}
                          >
                            {user?.name || user?.email || "Not specified"}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div></div> {/* Empty div for grid spacing */}
                  </div>

                  <div className="relative">
                    <textarea
                      value={paymentData.saleNote}
                      onChange={(e) =>
                        setPaymentData((prev) => ({
                          ...prev,
                          saleNote: e.target.value,
                        }))
                      }
                      rows={3}
                      className={`
                        w-full p-4 pt-6 border-2 rounded-2xl transition-all duration-300 resize-none
                        focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/20
                        ${
                          mode === "dark"
                            ? "border-gray-600 bg-gray-800/50 text-gray-100 placeholder-gray-400 backdrop-blur-sm"
                            : "border-gray-200 bg-white/80 text-gray-900 placeholder-gray-500 backdrop-blur-sm"
                        }
                        focus:outline-none focus:ring-0
                      `}
                      placeholder="Add any additional notes about this sale..."
                    />
                    <label
                      className={`
                      absolute top-2 left-4 text-xs font-medium transition-colors duration-300
                      ${mode === "dark" ? "text-gray-400" : "text-gray-600"}
                    `}
                    >
                      Sale Notes
                    </label>
                  </div>
                </div>
              </CollapsibleSection>
            </form>
          </div>

          {/* Enhanced Action Buttons */}
          <div
            className={`
            sticky bottom-0 px-10 py-6 border-t backdrop-blur-xl
            ${
              mode === "dark"
                ? "bg-gray-900/95 border-gray-700/50"
                : "bg-white/95 border-gray-200/50"
            }
          `}
            style={{ borderRadius: "0 0 32px 32px" }}
          >
            <div className="flex justify-end gap-6">
              <ModernButton
                onClick={onClose}
                variant="secondary"
                size="lg"
                icon="mdi:close"
                disabled={isLoading}
                mode={mode}
              >
                Cancel
              </ModernButton>
              <ModernButton
                onClick={handleSubmit}
                variant="success"
                size="lg"
                icon={isLoading ? "mdi:loading" : "mdi:check-circle"}
                loading={isLoading}
                disabled={
                  isLoading ||
                  (paymentType === "split" && paymentData.remainingAmount > 0)
                }
                mode={mode}
              >
                {isLoading
                  ? "Processing..."
                  : isLayaway
                  ? "Complete Layaway"
                  : "Finalize Payment"}
              </ModernButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;
