import React, { useState } from "react";
import { Icon } from "@iconify/react";

const paymentMethods = [
  { key: "cash", label: "Cash", icon: "mdi:cash" },
  { key: "momo", label: "Momo", icon: "mdi:wallet-outline" },
  { key: "split", label: "Split Bill", icon: "mdi:call-split" },
];

const PosFooterActions = ({ totalPayable = 0, hasProducts = false, onSelectPayment, onPrintOrder }) => {
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 bg-white py-3 flex justify-center shadow-lg">
      <div className="relative flex justify-center items-center w-full max-w-5xl mx-auto px-4">
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition">
            <Icon icon="mdi:pause" className="w-5 h-5" />
            Hold
          </button>

          <button
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition"
            onClick={onPrintOrder}
            disabled={!hasProducts}
          >
            <Icon
              icon="material-symbols-light:print-outline-rounded"
              className="w-5 h-5"
            />
            Print Order
          </button>

          <div className="relative">
            <button
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-5 py-2 rounded-lg shadow transition"
              onClick={() => hasProducts && setShowPaymentOptions(true)}
              disabled={!hasProducts}
            >
              <Icon icon="mdi:cash-multiple" className="w-5 h-5" />
              Select Payment
            </button>
            {showPaymentOptions && (
              <div className="absolute bottom-14 left-0 bg-white border rounded-lg shadow-lg p-4 flex gap-4 z-50">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.key}
                    className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-blue-50 rounded transition"
                    onClick={() => {
                      setShowPaymentOptions(false);
                      onSelectPayment && onSelectPayment(pm.key);
                    }}
                  >
                    <Icon icon={pm.icon} className="w-7 h-7 mb-1" />
                    <span className="font-semibold text-sm">{pm.label}</span>
                  </button>
                ))}
                <button
                  className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-gray-100 rounded transition"
                  onClick={() => setShowPaymentOptions(false)}
                >
                  <Icon
                    icon="mdi:close"
                    className="w-6 h-6 mb-1 text-gray-500"
                  />
                  <span className="text-xs text-gray-500">Cancel</span>
                </button>
              </div>
            )}
          </div>

          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition">
            <Icon icon="mdi:refresh" className="w-5 h-5" />
            Reset
          </button>
        </div>
        {hasProducts && (
          <div className="font-bold text-lg whitespace-nowrap absolute right-6 top-1/2 -translate-y-1/2">
            Total Payable: GHS {totalPayable.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default PosFooterActions; 