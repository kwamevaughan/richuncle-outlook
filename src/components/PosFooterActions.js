import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { paymentMethods } from "@/constants/paymentMethods";
import toast from "react-hot-toast";

const PosFooterActions = ({
  totalPayable = 0,
  hasProducts = false,
  onSelectPayment,
  onPrintOrder,
  onResetOrder,
  onHoldSale,
  onLayaway,
  onRetrieveSales,
  onRetrieveLayaways,
  onRecentTransactions,
  hasOpenSession = true,
  sessionCheckLoading = false,
  user,
  mode = "light",
  hideFooter = false,
}) => {
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
  const isCashier = user?.role === "cashier";
  const isBlocked = isCashier && !hasOpenSession;
  const isLoading = sessionCheckLoading;
  const blockAction = () => {
    if (isLoading) return;
    toast.error("You must open a cash register before making sales.");
  };

  const footerContent = (
    <div
      className={`pos-footer-sticky py-2 sm:py-3 md:py-4 flex flex-col justify-center shadow-xl border-t-2 backdrop-blur-sm ${
        mode === "dark"
          ? "bg-gray-900/95 border-gray-600"
          : "bg-white/95 border-gray-200"
      }`}
    >
      <div className="w-full px-2 sm:px-3 md:px-4 space-y-2">
        {/* Total Display - Now at top for better visibility */}

        {/* Button Row */}
        <div className="flex flex-row gap-2 sm:gap-3 md:gap-4 justify-center">
          <div className="relative flex-1 sm:flex-none">
            <button
              className={`select-none flex items-center justify-center gap-1.5 sm:gap-2 bg-yellow-600 hover:bg-yellow-700 active:scale-95 text-white font-semibold px-2 sm:px-3 md:px-4 py-2 sm:py-2 rounded-lg shadow transition min-h-[44px] w-full sm:w-auto ${
                isBlocked || isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => {
                if (isBlocked || isLoading) {
                  blockAction();
                  return;
                }
                setShowRetrieveOptions(true);
              }}
              title={
                isBlocked ? "Open a register to retrieve sales/layaways" : ""
              }
            >
              <Icon icon="mdi:archive-arrow-down" className="w-5 h-5" />
              <span className="hidden sm:inline">Retrieve</span>
            </button>
            {showRetrieveOptions && (
              <div
                ref={retrieveRef}
                className={`absolute bottom-full mb-2 left-0 sm:left-auto sm:right-0 border rounded-lg shadow-xl p-2 sm:p-3 md:p-4 flex flex-col gap-1.5 sm:gap-2 z-[100] w-[calc(100vw-2rem)] sm:w-auto min-w-[160px] max-w-[280px] backdrop-blur-sm ${
                  mode === "dark"
                    ? "bg-gray-800/95 border-gray-600"
                    : "bg-white/95 border-gray-300"
                }`}
                style={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)" }}
              >
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded transition font-semibold text-sm ${
                    mode === "dark"
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-700 hover:bg-blue-50"
                  }`}
                  onClick={() => {
                    setShowRetrieveOptions(false);
                    onRetrieveSales && onRetrieveSales();
                  }}
                >
                  <Icon
                    icon="mdi:cart-arrow-up"
                    className="w-5 h-5 text-blue-600"
                  />
                  <div className="flex items-center gap-2 text-base sm:text-lg font-bold whitespace-nowrap">
                    Sales
                  </div>
                </button>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded transition font-semibold text-sm ${
                    mode === "dark"
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-700 hover:bg-green-50"
                  }`}
                  onClick={() => {
                    setShowRetrieveOptions(false);
                    onRetrieveLayaways && onRetrieveLayaways();
                  }}
                >
                  <Icon
                    icon="mdi:cart-arrow-down"
                    className="w-5 h-5 text-green-600"
                  />
                  <div className="flex items-center gap-2 text-base sm:text-lg font-bold whitespace-nowrap">
                    Layaways
                  </div>
                </button>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded transition text-xs ${
                    mode === "dark"
                      ? "text-gray-400 hover:bg-gray-700"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                  onClick={() => setShowRetrieveOptions(false)}
                >
                  <Icon icon="mdi:close" className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="relative flex-1 sm:flex-none">
            <button
              className={`select-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold px-2 sm:px-4 md:px-5 py-2 rounded-lg shadow transition min-h-[44px] w-full sm:w-auto ${
                isBlocked || isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => {
                if (isBlocked || isLoading) {
                  blockAction();
                  return;
                }
                setShowHoldOptions(true);
              }}
              title={isBlocked ? "Open a register to hold sales/layaways" : ""}
            >
              <Icon icon="mdi:pause" className="w-5 h-5" />
              <span className="hidden sm:inline">Hold</span>
            </button>
            {showHoldOptions && (
              <div
                ref={holdRef}
                className={`absolute bottom-full mb-2 left-0 sm:left-auto sm:right-0 border rounded-lg shadow-xl p-2 sm:p-3 md:p-4 flex flex-col gap-1.5 sm:gap-2 z-[100] w-[calc(100vw-2rem)] sm:w-auto min-w-[160px] max-w-[280px] backdrop-blur-sm ${
                  mode === "dark"
                    ? "bg-gray-800/95 border-gray-600"
                    : "bg-white/95 border-gray-300"
                }`}
                style={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)" }}
              >
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded transition font-semibold text-sm ${
                    mode === "dark"
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-700 hover:bg-blue-50"
                  }`}
                  onClick={() => {
                    setShowHoldOptions(false);
                    onHoldSale && onHoldSale();
                  }}
                >
                  <Icon
                    icon="mdi:pause-circle-outline"
                    className="w-5 h-5 text-blue-600"
                  />
                  <div className="flex items-center gap-2 text-base sm:text-lg font-bold whitespace-nowrap">
                    Hold Sale
                  </div>
                </button>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded transition font-semibold text-sm ${
                    mode === "dark"
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-700 hover:bg-green-50"
                  }`}
                  onClick={() => {
                    setShowHoldOptions(false);
                    onLayaway && onLayaway();
                  }}
                >
                  <Icon
                    icon="mdi:cart-arrow-down"
                    className="w-5 h-5 text-green-600"
                  />
                  <div className="flex items-center gap-2 text-base sm:text-lg font-bold whitespace-nowrap">
                    Layaway
                  </div>
                </button>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded transition text-xs ${
                    mode === "dark"
                      ? "text-gray-400 hover:bg-gray-700"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                  onClick={() => setShowHoldOptions(false)}
                >
                  <Icon icon="mdi:close" className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 sm:flex-none">
            <button
              className={`select-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold px-2 sm:px-4 md:px-5 py-2 rounded-lg shadow transition min-h-[44px] w-full sm:w-auto ${
                isBlocked || isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => {
                if (isBlocked || isLoading) {
                  blockAction();
                  return;
                }
                onResetOrder();
              }}
              title={isBlocked ? "Open a register to clear order" : ""}
            >
              <Icon icon="mdi:refresh" className="w-5 h-5" />
              <span className="hidden sm:inline">Clear Order</span>
            </button>
          </div>

          <div className="flex-1 sm:flex-none">
            <button
              className="flex-1 sm:flex-none bg-blue-500 text-white px-2 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors min-h-[44px] w-full sm:w-auto"
              onClick={() => onRecentTransactions && onRecentTransactions()}
            >
              <Icon icon="mdi:history" className="w-5 h-5" />
              <span className="hidden sm:inline">Recent Transactions</span>
            </button>
          </div>
          {hasProducts && (
            <div
              className={`font-extrabold text-center text-lg sm:text-xl md:text-2xl lg:text-3xl ${
                mode === "dark" ? "text-white" : "text-black"
              }`}
            >
              Total Payable: GHS {totalPayable.toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Inject CSS to ensure footer sticks properly
  useEffect(() => {
    const existingStyle = document.getElementById("pos-footer-styles");
    
    if (!hideFooter) {
      // Only add styles when footer is visible
      if (!existingStyle) {
        const style = document.createElement("style");
        style.id = "pos-footer-styles";
        style.textContent = `
          .pos-footer-sticky {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100vw;
            z-index: 9999;
            margin: 0;
          }
          .pos-content-wrapper {
            padding-bottom: 120px;
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      // Immediately remove styles when footer should be hidden
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    }

    return () => {
      // Cleanup on unmount
      const styleToRemove = document.getElementById("pos-footer-styles");
      if (styleToRemove) {
        document.head.removeChild(styleToRemove);
      }
    };
  }, [hideFooter]);

  // Don't render footer if hideFooter is true
  if (hideFooter) {
    return null;
  }

  // Use portal to render footer outside the main layout tree
  return typeof window !== "undefined"
    ? createPortal(footerContent, document.body)
    : footerContent;
};

export default PosFooterActions;
