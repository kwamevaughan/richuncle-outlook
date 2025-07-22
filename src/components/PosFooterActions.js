import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { paymentMethods } from "@/constants/paymentMethods";

const PosFooterActions = ({ totalPayable = 0, hasProducts = false, onSelectPayment, onPrintOrder, onResetOrder, onHoldSale, onLayaway, onRetrieveSales, onRetrieveLayaways }) => {
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showHoldOptions, setShowHoldOptions] = useState(false);
  const [showRetrieveOptions, setShowRetrieveOptions] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 bg-white/80 py-3 flex justify-center shadow-xl border border-gray-200 border-t-2 border-white/20 backdrop-blur-sm">
      <div className="relative flex justify-center items-center w-full px-4 gap-10">
        <div className="flex gap-3">
          <div className="relative">
            <button
              className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition"
              onClick={() => setShowRetrieveOptions(true)}
            >
              <Icon icon="mdi:archive-arrow-down" className="w-5 h-5" />
              Retrieve
            </button>
            {showRetrieveOptions && (
              <div className="absolute bottom-14 left-0 bg-white border rounded-lg shadow-lg p-4 flex flex-col gap-2 z-50 min-w-[160px]">
                <button
                  className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 rounded transition font-semibold text-sm text-gray-700"
                  onClick={() => {
                    setShowRetrieveOptions(false);
                    onRetrieveSales && onRetrieveSales();
                  }}
                >
                  <Icon icon="mdi:cart-arrow-up" className="w-5 h-5 text-blue-600" />
                  Sales
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 hover:bg-green-50 rounded transition font-semibold text-sm text-gray-700"
                  onClick={() => {
                    setShowRetrieveOptions(false);
                    onRetrieveLayaways && onRetrieveLayaways();
                  }}
                >
                  <Icon icon="mdi:cart-arrow-down" className="w-5 h-5 text-green-600" />
                  Layaways
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded transition text-xs text-gray-500"
                  onClick={() => setShowRetrieveOptions(false)}
                >
                  <Icon icon="mdi:close" className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition"
              onClick={() => setShowHoldOptions(true)}
            >
              <Icon icon="mdi:pause" className="w-5 h-5" />
              Hold
            </button>
            {showHoldOptions && (
              <div className="absolute bottom-14 left-0 bg-white border rounded-lg shadow-lg p-4 flex flex-col gap-2 z-50 min-w-[160px]">
                <button
                  className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 rounded transition font-semibold text-sm text-gray-700"
                  onClick={() => {
                    setShowHoldOptions(false);
                    onHoldSale && onHoldSale();
                  }}
                >
                  <Icon icon="mdi:pause-circle-outline" className="w-5 h-5 text-blue-600" />
                  Hold Sale
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 hover:bg-green-50 rounded transition font-semibold text-sm text-gray-700"
                  onClick={() => {
                    setShowHoldOptions(false);
                    onLayaway && onLayaway();
                  }}
                >
                  <Icon icon="mdi:cart-arrow-down" className="w-5 h-5 text-green-600" />
                  Layaway
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded transition text-xs text-gray-500"
                  onClick={() => setShowHoldOptions(false)}
                >
                  <Icon icon="mdi:close" className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            )}
          </div>

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
              Select Payment Method
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

          <button
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition"
            onClick={onResetOrder}
          >
            <Icon icon="mdi:refresh" className="w-5 h-5" />
            Clear Order
          </button>
        </div>
        {hasProducts && (
          <div className="font-bold text-lg whitespace-nowrap  ">
            Total Payable: GHS {totalPayable.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default PosFooterActions; 