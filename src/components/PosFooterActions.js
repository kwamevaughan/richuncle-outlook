import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { paymentMethods } from "@/constants/paymentMethods";
import toast from "react-hot-toast";

const PosFooterActions = ({ totalPayable = 0, hasProducts = false, onSelectPayment, onPrintOrder, onResetOrder, onHoldSale, onLayaway, onRetrieveSales, onRetrieveLayaways, hasOpenSession = true, sessionCheckLoading = false, user, mode = "light" }) => {
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showHoldOptions, setShowHoldOptions] = useState(false);
  const [showRetrieveOptions, setShowRetrieveOptions] = useState(false);

  // Refs for popovers
  const retrieveRef = useRef(null);
  const holdRef = useRef(null);

  // Click outside for Retrieve
  useEffect(() => {
    if (!showRetrieveOptions) return;
    function handleClick(e) {
      if (retrieveRef.current && !retrieveRef.current.contains(e.target)) {
        setShowRetrieveOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showRetrieveOptions]);

  // Click outside for Hold
  useEffect(() => {
    if (!showHoldOptions) return;
    function handleClick(e) {
      if (holdRef.current && !holdRef.current.contains(e.target)) {
        setShowHoldOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showHoldOptions]);

  // Restriction: Cashier must have open session
  const isCashier = user?.role === 'cashier';
  const isBlocked = isCashier && !hasOpenSession;
  const isLoading = sessionCheckLoading;
  const blockAction = () => {
    if (isLoading) return;
    toast.error('You must open a cash register before making sales.');
  };

  return (
    <div className={`fixed bottom-0 left-0 w-full z-50 py-4 sm:py-6 flex justify-center shadow-xl border-t-2 backdrop-blur-sm ${mode === "dark" ? "bg-gray-900/80 border-gray-600 border-gray-700/20" : "bg-white/80 border-gray-200 border-white/20"}`}>
      <div className="relative flex flex-wrap justify-center items-center w-full px-2 sm:px-4 gap-2 sm:gap-4 md:gap-8 lg:gap-10">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <div className="relative">
            <button
              className={`select-none flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 active:scale-95 text-white font-semibold px-3 sm:px-4 md:px-5 py-2 rounded-lg shadow transition min-h-[44px] min-w-[44px] ${isBlocked || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (isBlocked || isLoading) { blockAction(); return; }
                setShowRetrieveOptions(true);
              }}
              title={isBlocked ? 'Open a register to retrieve sales/layaways' : ''}
            >
              <Icon icon="mdi:archive-arrow-down" className="w-5 h-5" />
              Retrieve
            </button>
            {showRetrieveOptions && (
              <div ref={retrieveRef} className={`absolute bottom-14 left-0 border rounded-lg shadow-lg p-4 flex flex-col gap-2 z-50 min-w-[120px] sm:min-w-[160px] ${mode === "dark" ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"}`}>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded transition font-semibold text-sm ${mode === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-blue-50"}`}
                  onClick={() => {
                    setShowRetrieveOptions(false);
                    onRetrieveSales && onRetrieveSales();
                  }}
                >
                  <Icon icon="mdi:cart-arrow-up" className="w-5 h-5 text-blue-600" />
                  Sales
                </button>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded transition font-semibold text-sm ${mode === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-green-50"}`}
                  onClick={() => {
                    setShowRetrieveOptions(false);
                    onRetrieveLayaways && onRetrieveLayaways();
                  }}
                >
                  <Icon icon="mdi:cart-arrow-down" className="w-5 h-5 text-green-600" />
                  Layaways
                </button>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded transition text-xs ${mode === "dark" ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"}`}
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
              className={`select-none flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold px-3 sm:px-4 md:px-5 py-2 rounded-lg shadow transition min-h-[44px] min-w-[44px] ${isBlocked || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (isBlocked || isLoading) { blockAction(); return; }
                setShowHoldOptions(true);
              }}
              title={isBlocked ? 'Open a register to hold sales/layaways' : ''}
            >
              <Icon icon="mdi:pause" className="w-5 h-5" />
              Hold
            </button>
            {showHoldOptions && (
              <div ref={holdRef} className={`absolute bottom-14 left-0 border rounded-lg shadow-lg p-4 flex flex-col gap-2 z-50 min-w-[120px] sm:min-w-[160px] ${mode === "dark" ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"}`}>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded transition font-semibold text-sm ${mode === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-blue-50"}`}
                  onClick={() => {
                    setShowHoldOptions(false);
                    onHoldSale && onHoldSale();
                  }}
                >
                  <Icon icon="mdi:pause-circle-outline" className="w-5 h-5 text-blue-600" />
                  Hold Sale
                </button>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded transition font-semibold text-sm ${mode === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-green-50"}`}
                  onClick={() => {
                    setShowHoldOptions(false);
                    onLayaway && onLayaway();
                  }}
                >
                  <Icon icon="mdi:cart-arrow-down" className="w-5 h-5 text-green-600" />
                  Layaway
                </button>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded transition text-xs ${mode === "dark" ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"}`}
                  onClick={() => setShowHoldOptions(false)}
                >
                  <Icon icon="mdi:close" className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <button
            className={`select-none flex items-center gap-2 bg-gray-600 hover:bg-gray-700 active:scale-95 text-white font-semibold px-3 sm:px-4 md:px-5 py-2 rounded-lg shadow transition min-h-[44px] min-w-[44px] ${isBlocked || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => {
              if (isBlocked || isLoading) { blockAction(); return; }
              onPrintOrder();
            }}
            title={isBlocked ? 'Open a register to print order' : ''}
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
              className={`select-none flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-white font-semibold px-3 sm:px-4 md:px-5 py-2 rounded-lg shadow transition min-h-[44px] min-w-[44px] ${isBlocked || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (isBlocked || isLoading) { blockAction(); return; }
                if (hasProducts) setShowPaymentOptions(true);
              }}
              title={isBlocked ? 'Open a register to select payment method' : ''}
              disabled={!hasProducts}
            >
              <Icon icon="mdi:cash-multiple" className="w-5 h-5" />
              Select Payment Method
            </button>
            {showPaymentOptions && (
              <div className={`absolute bottom-14 left-0 border rounded-lg shadow-lg p-4 flex gap-2 sm:gap-4 z-50 ${mode === "dark" ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"}`}>
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.key}
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded transition ${mode === "dark" ? "hover:bg-gray-700" : "hover:bg-blue-50"}`}
                    onClick={() => {
                      setShowPaymentOptions(false);
                      onSelectPayment && onSelectPayment(pm.key);
                    }}
                  >
                    <Icon icon={pm.icon} className="w-7 h-7 mb-1" />
                    <span className={`font-semibold text-sm ${mode === "dark" ? "text-white" : "text-black"}`}>{pm.label}</span>
                  </button>
                ))}
                <button
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded transition ${mode === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                  onClick={() => setShowPaymentOptions(false)}
                >
                  <Icon
                    icon="mdi:close"
                    className={`w-6 h-6 mb-1 ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}
                  />
                  <span className={`text-xs ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}>Cancel</span>
                </button>
              </div>
            )}
          </div>

          <button
            className={`select-none flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold px-3 sm:px-4 md:px-5 py-2 rounded-lg shadow transition min-h-[44px] min-w-[44px] ${isBlocked || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => {
              if (isBlocked || isLoading) { blockAction(); return; }
              onResetOrder();
            }}
            title={isBlocked ? 'Open a register to clear order' : ''}
          >
            <Icon icon="mdi:refresh" className="w-5 h-5" />
            Clear Order
          </button>
        </div>
        {hasProducts && (
          <div className={`font-bold text-lg whitespace-nowrap mt-2 sm:mt-0 ${mode === "dark" ? "text-white" : "text-black"}`}>
            Total Payable: GHS {totalPayable.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default PosFooterActions; 