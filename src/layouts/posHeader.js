import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import FullscreenToggle from "@/components/FullscreenToggle";
import TooltipIconButton from "@/components/TooltipIconButton";
import LanguageSwitch from "@/components/LanguageSwitch";
import Link from "next/link";
import CashRegisterModal from "@/components/CashRegisterModal";
import SalesProfitModal from "@/components/SalesProfitModal";
import NotificationButton from "@/components/NotificationButton";
// import { useModal } from "@/components/ModalContext";
import SessionDuration from "@/components/SessionDuration";
import SimpleModal from "@/components/SimpleModal";
import SalesReturnModals from "@/components/SalesReturnModals";
import { useRouter } from "next/router";

const PosHeader = ({ mode, toggleMode, onLogout, user, printLastReceipt, lastOrderData, onOpenOrderHistory, showCashRegister, setShowCashRegister, showSalesReturnModal, setShowSalesReturnModal }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const headerRef = useRef(null);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const storeDropdownRef = useRef(null);
  const [addNewDropdownOpen, setAddNewDropdownOpen] = useState(false);
  const addNewDropdownRef = useRef(null);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showProfitModal, setShowProfitModal] = useState(false);
  const [sessionRefreshKey, setSessionRefreshKey] = useState(0);
  const handleSessionChanged = () => setSessionRefreshKey((k) => k + 1);
  const [userStoreName, setUserStoreName] = useState("");
  const [stores, setStores] = useState([]);
  // Demo state for SalesReturnModals
  const [salesReturnModalData, setSalesReturnModalData] = useState({});
  const [salesReturnReference, setSalesReturnReference] = useState("");
  const router = useRouter();
  // Debug logging
  useEffect(() => {
    console.log("PosHeader mounted");
    return () => console.log("PosHeader unmounted");
  }, []);

  useEffect(() => {
    console.log("showCashRegister changed:", showCashRegister);
  }, [showCashRegister]);

  useEffect(() => {
    if (user && user.store_id && stores.length > 0) {
      const store = stores.find((s) => String(s.id) === String(user.store_id));
      setUserStoreName(store ? store.name : "");
    }
  }, [user, stores]);

  useEffect(() => {
    // Fetch all stores
    (async () => {
      try {
        const res = await fetch("/api/stores");
        const data = await res.json();
        if (data.success && data.data) {
          setStores(data.data);
        }
      } catch (err) {
        setStores([]);
      }
    })();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        storeDropdownRef.current &&
        !storeDropdownRef.current.contains(e.target)
      ) {
        setStoreDropdownOpen(false);
      }
      if (
        addNewDropdownRef.current &&
        !addNewDropdownRef.current.contains(e.target)
      ) {
        setAddNewDropdownOpen(false);
      }
    };
    if (storeDropdownOpen || addNewDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [storeDropdownOpen, addNewDropdownOpen]);

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-10 transition-transform duration-300 ${
          mode === "dark" ? "bg-[#101827]" : "bg-transparent"
        }`}
      >
        <div
          className={`
            p-2 sm:p-3 m-2 sm:m-4 transition-transform duration-300
            ${
              mode === "dark"
                ? "bg-[#101827]/50 text-white"
                : "bg-white/20 text-black"
            }
            backdrop-blur-sm shadow-lg rounded-2xl
          `}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2 sm:gap-4">
            <div className="flex items-center w-full">
              {user?.role !== "cashier" && (
                <TooltipIconButton
                  label="Back to Dashboard"
                  mode={mode}
                  className="select-none px-2 py-2 sm:px-1 sm:py-1 mr-2 rounded-md hover:shadow-xl hover:-mt-1 active:scale-95 transition-all duration-500 min-h-[44px] min-w-[44px]"
                  onClick={() => {
                    router.push("/dashboard");
                  }}
                >
                  <Icon
                    icon="mdi:home-outline"
                    className="h-6 w-6 sm:h-7 sm:w-7 text-gray-500"
                  />
                </TooltipIconButton>
              )}

              <SessionDuration
                mode={mode}
                user={user}
                sessionRefreshKey={sessionRefreshKey}
              />
            </div>

            <div className="flex items-center w-full gap-2 sm:gap-4">
              <div
                className={
                  `flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 ` +
                  (mode === "dark"
                    ? "bg-gray-800/80 text-white hover:bg-gray-700/80"
                    : "bg-white/80 text-gray-700 hover:bg-white/95") +
                  " backdrop-blur-sm border border-white/20"
                }
                disabled
              >
                <span className="flex gap-1 font-semibold text-sm sm:text-base">
                  Store :<span className="text-gray-500">{userStoreName}</span>
                </span>
              </div>

              <div
                className={
                  `flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 ` +
                  (mode === "dark"
                    ? "bg-gray-800/80 text-white hover:bg-gray-700/80"
                    : "bg-white/80 text-gray-700 hover:bg-white/95") +
                  " backdrop-blur-sm border border-white/20"
                }
                disabled
              >
                <div className="flex gap-1 font-semibold text-sm sm:text-base">
                  <span className="text-gray-500">Cashier :</span>{" "}
                  <span className="text-gray-500">{user.name}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center items-center w-full gap-2 sm:gap-4 flex-wrap">
              {/* Core POS Actions - Always Visible */}
              <TooltipIconButton
                label="Cash Register"
                mode={mode}
                className="select-none px-2 py-2 sm:px-1 sm:py-1 rounded-md hover:shadow-xl hover:-mt-1 active:scale-95 transition-all duration-500 min-h-[44px] min-w-[44px]"
                onClick={() => {
                  console.log("Cash Register button clicked");
                  if (setShowCashRegister) setShowCashRegister(true);
                }}
              >
                <Icon
                  icon="iconoir:lot-of-cash"
                  className="h-6 w-6 sm:h-7 sm:w-7 text-gray-500"
                />
              </TooltipIconButton>

              <TooltipIconButton
                label="Print Last Receipt"
                mode={mode}
                className="select-none px-2 py-2 sm:px-1 sm:py-1 rounded-md hover:shadow-xl hover:-mt-1 active:scale-95 transition-all duration-500 min-h-[44px] min-w-[44px]"
                onClick={printLastReceipt}
                disabled={!lastOrderData}
              >
                <Icon
                  icon="lets-icons:print-light"
                  className={`h-6 w-6 sm:h-7 sm:w-7 ${
                    lastOrderData ? "text-gray-500" : "text-gray-300"
                  }`}
                />
              </TooltipIconButton>

              {/* All Other Actions - Consolidated Dropdown */}
              <div className="relative" ref={addNewDropdownRef}>
                <TooltipIconButton
                  label="More Actions"
                  mode={mode}
                  className="select-none px-2 py-2 sm:px-1 sm:py-1 rounded-md hover:shadow-xl hover:-mt-1 active:scale-95 transition-all duration-500 min-h-[44px] min-w-[44px]"
                  onClick={() => setAddNewDropdownOpen(!addNewDropdownOpen)}
                >
                  <Icon
                    icon="mdi:dots-horizontal"
                    className="h-6 w-6 sm:h-7 sm:w-7 text-gray-500"
                  />
                </TooltipIconButton>

                {addNewDropdownOpen && (
                  <div
                    className={`absolute top-full mt-2 right-0 w-56 rounded-xl shadow-lg z-20 ${
                      mode === "dark"
                        ? "bg-gray-900 text-gray-100"
                        : "bg-white/95 text-black"
                    }`}
                  >
                    <div className="p-2 space-y-1">
                      {/* POS Actions */}
                      <button
                        onClick={() => {
                          setAddNewDropdownOpen(false);
                          setShowSalesReturnModal(true);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer min-h-[44px] ${
                          mode === "dark"
                            ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                            : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                        }`}
                      >
                        <Icon icon="prime:undo" className="h-5 w-5" />
                        <span>Sales Return</span>
                      </button>

                      {/* Admin/Manager Actions */}
                      {user?.role !== "cashier" && (
                        <>
                          <button
                            onClick={() => {
                              setAddNewDropdownOpen(false);
                              onOpenOrderHistory();
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer min-h-[44px] ${
                              mode === "dark"
                                ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                            }`}
                          >
                            <Icon icon="material-symbols-light:order-approve-outline" className="h-5 w-5" />
                            <span>View Orders</span>
                          </button>

                          <button
                            onClick={() => {
                              setAddNewDropdownOpen(false);
                              setShowSalesModal(true);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer min-h-[44px] ${
                              mode === "dark"
                                ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                            }`}
                          >
                            <Icon icon="mdi:cart-sale" className="h-5 w-5" />
                            <span>Today's Sales</span>
                          </button>

                          <button
                            onClick={() => {
                              setAddNewDropdownOpen(false);
                              setShowProfitModal(true);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer min-h-[44px] ${
                              mode === "dark"
                                ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                            }`}
                          >
                            <Icon icon="hugeicons:chart-increase" className="h-5 w-5" />
                            <span>Today's Profit</span>
                          </button>
                        </>
                      )}

                      {/* System Actions */}
                      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                      
                      <div className="px-3">
                        <LanguageSwitch mode={mode} showLabel={true} />
                      </div>

                      {user?.role !== "cashier" && (
                        <div className="px-3">
                          <NotificationButton mode={mode} user={user} showLabel={true} />
                        </div>
                      )}

                                                <button
                            onClick={() => {
                              setAddNewDropdownOpen(false);
                              toggleMode();
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer min-h-[44px] ${
                              mode === "dark"
                                ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                            }`}
                          >
                            <Icon icon={mode === "dark" ? "line-md:sunny-filled-loop-to-moon-filled-alt-loop-transition" : "line-md:moon-alt-to-sunny-outline-loop-transition"} className="h-5 w-5" />
                            <span>{mode === "dark" ? "Light Mode" : "Dark Mode"}</span>
                          </button>

                      <div className="px-3">
                        <FullscreenToggle mode={mode} showLabel={true} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <TooltipIconButton
                label={
                  <span
                    className={mode === "dark" ? "text-white" : "text-black"}
                  >
                    {dropdownOpen ? "Close Profile" : "Open Profile"}
                  </span>
                }
                mode={mode}
                className="select-none bg-white/50 hover:-mt-1 active:scale-95 transition-all duration-500 min-h-[44px] min-w-[44px] px-2 py-2 sm:px-1 sm:py-1"
              >
                <div
                  className="flex items-center gap-2 relative"
                  ref={dropdownRef}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <div className="flex items-center">
                    <div className="overflow-hidden rounded-full w-6 h-6 sm:w-6 sm:h-6">
                      {user && user.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.name || "User"} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon icon="hugeicons:ai-user" className="h-6 w-6" />
                      )}
                    </div>
                  </div>

                  {dropdownOpen && (
                    <div
                      className={`absolute top-full mt-2 right-0 w-72 sm:w-80 rounded-2xl shadow-lg z-10 ${
                        mode === "dark"
                          ? "bg-gray-900 text-gray-100"
                          : "bg-white/95 text-black"
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-2 w-full">
                          <div className="overflow-hidden flex-shrink-0 rounded-full w-6 h-6">
                            {user && user.avatar_url ? (
                              <img 
                                src={user.avatar_url} 
                                alt={user.name || "User"} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Icon
                                icon="hugeicons:ai-user"
                                className="h-6 w-6"
                              />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex gap-2">
                              <span className="text-sm sm:text-md font-semibold">
                                {user.name}
                              </span>
                              <span className="rounded-md capitalize bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
                                {user.role}
                              </span>
                            </div>
                            <span className="text-xs">{user.agencyName}</span>
                          </div>
                        </div>
                        <ul className="py-4 space-y-2">
                          <li
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/profile');
                            }}
                            className={`select-none flex items-center w-full gap-2 text-sm transition-all cursor-pointer p-2 rounded-lg min-h-[44px] ${
                              mode === "dark"
                                ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                            }`}
                          >
                            <Icon
                              icon="fluent-mdl2:radio-bullet"
                              className="h-5 w-5"
                            />
                            <span className="">Profile</span>
                          </li>

                        </ul>
                        <button
                          onClick={onLogout}
                          className={`select-none flex items-center w-full gap-2 border-t h-12 font-thin text-sm text-red-500 hover:text-red-600 transition-colors rounded-lg p-2 min-h-[44px]
                            ${
                              mode === "dark"
                                ? "hover:bg-gray-800 border-gray-700"
                                : "hover:bg-gray-100 border-gray-200"
                            }`}
                        >
                          <Icon icon="mdi:logout" className="h-5 w-5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </TooltipIconButton>
            </div>
          </div>
        </div>
      </header>
      <SalesProfitModal
        isOpen={showSalesModal}
        onClose={() => setShowSalesModal(false)}
        mode={mode}
        type="sales"
      />
      <SalesProfitModal
        isOpen={showProfitModal}
        onClose={() => setShowProfitModal(false)}
        mode={mode}
        type="profit"
      />

      {/* SalesReturnModals is now rendered in the main POS page, not here. */}
    </>
  );
};

export default PosHeader;