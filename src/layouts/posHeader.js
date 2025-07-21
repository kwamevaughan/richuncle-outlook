import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import FullscreenToggle from "@/components/FullscreenToggle";
import TooltipIconButton from "@/components/TooltipIconButton";
import LanguageSwitch from "@/components/LanguageSwitch";
import Link from "next/link";
import CashRegisterModal from "@/components/CashRegisterModal";
import SalesProfitModal from "@/components/SalesProfitModal";
import NotificationButton from "@/components/NotificationButton";
import { useModal } from "@/components/ModalContext";
import SessionDuration from "@/components/SessionDuration";

const PosHeader = ({ mode, toggleMode, onLogout, user, printLastReceipt, lastOrderData, onOpenOrderHistory }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const headerRef = useRef(null);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const storeDropdownRef = useRef(null);
  const [addNewDropdownOpen, setAddNewDropdownOpen] = useState(false);
  const addNewDropdownRef = useRef(null);
  const { showCashRegister, setShowCashRegister } = useModal();
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showProfitModal, setShowProfitModal] = useState(false);
  const [sessionRefreshKey, setSessionRefreshKey] = useState(0);
  const handleSessionChanged = () => setSessionRefreshKey((k) => k + 1);
  const [userStoreName, setUserStoreName] = useState("");
  const [stores, setStores] = useState([]);

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
            p-2 m-4 transition-transform duration-300
            ${
              mode === "dark"
                ? "bg-[#101827]/50 text-white"
                : "bg-white/20 text-black"
            }
            backdrop-blur-sm shadow-lg rounded-2xl
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center w-full ">
              {user?.role !== "cashier" && (
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 bg-blue-950 font-semibold text-white text-sm px-3 py-1.5 rounded-md hover:shadow-xl hover:-mt-1 transition-all duration-500"
                >
                  <Icon
                    icon="mage:dashboard-3"
                    className={`h-4 w-4 text-white`}
                  />
                  Back to Dashboard
                </Link>
              )}

              <SessionDuration
                mode={mode}
                user={user}
                sessionRefreshKey={sessionRefreshKey}
              />
            </div>

            <div className="flex items-center w-full gap-4">
              <div
                className={
                  `flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg ` +
                  (mode === "dark"
                    ? "bg-gray-800/80 text-white hover:bg-gray-700/80"
                    : "bg-white/80 text-gray-700 hover:bg-white/95") +
                  " backdrop-blur-sm border border-white/20"
                }
                disabled
              >
                <span className="flex gap-1 font-semibold">
                  Store :<span className="text-gray-500">{userStoreName}</span>
                </span>
              </div>

              <div
                className={
                  `flex items-center  gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg ` +
                  (mode === "dark"
                    ? "bg-gray-800/80 text-white hover:bg-gray-700/80"
                    : "bg-white/80 text-gray-700 hover:bg-white/95") +
                  " backdrop-blur-sm border border-white/20"
                }
                disabled
              >
                <div className="flex gap-1 font-semibold">
                  <span className="text-gray-500">Cashier :</span>{" "}
                  <span className="text-gray-500">{user.name}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center items-center w-full gap-4">
              <TooltipIconButton
                label="Cash Register"
                mode={mode}
                className="px-1 py-1 rounded-md hover:shadow-xl hover:-mt-1 transition-all duration-500"
                onClick={() => {
                  console.log("Cash Register button clicked");
                  setShowCashRegister(true);
                }}
              >
                <Icon
                  icon="iconoir:lot-of-cash"
                  className="h-7 w-7 text-gray-500"
                />
              </TooltipIconButton>

              <TooltipIconButton
                label="Print Last Receipt"
                mode={mode}
                className="px-1 py-1 rounded-md hover:shadow-xl hover:-mt-1 transition-all duration-500"
                onClick={printLastReceipt}
                disabled={!lastOrderData}
              >
                <Icon
                  icon="lets-icons:print-light"
                  className={`h-7 w-7 ${
                    lastOrderData ? "text-gray-500" : "text-gray-300"
                  }`}
                />
              </TooltipIconButton>

              <TooltipIconButton
                label="View Orders"
                mode={mode}
                className="px-1 py-1 rounded-md hover:shadow-xl hover:-mt-1 transition-all duration-500"
                onClick={onOpenOrderHistory}
              >
                <Icon
                  icon="material-symbols-light:order-approve-outline"
                  className="h-7 w-7 text-gray-500"
                />
              </TooltipIconButton>

              <TooltipIconButton
                label="Today's Sales"
                mode={mode}
                className="px-1 py-1 rounded-md hover:shadow-xl hover:-mt-1 transition-all duration-500"
                onClick={() => setShowSalesModal(true)}
              >
                <Icon icon="mdi:cart-sale" className="h-7 w-7 text-gray-500" />
              </TooltipIconButton>

              {user?.role !== "cashier" && (
                <TooltipIconButton
                  label="Today's Profit"
                  mode={mode}
                  className="px-1 py-1 rounded-md hover:shadow-xl hover:-mt-1 transition-all duration-500"
                  onClick={() => setShowProfitModal(true)}
                >
                  <Icon
                    icon="hugeicons:chart-increase"
                    className="h-7 w-7 text-gray-500"
                  />
                </TooltipIconButton>
              )}

              <LanguageSwitch mode={mode} />

              <NotificationButton mode={mode} user={user} />

              <TooltipIconButton
                label={
                  <span
                    className={mode === "dark" ? "text-black" : "text-black"}
                  >
                    {mode === "dark"
                      ? "Switch to Light Mode"
                      : "Switch to Dark Mode"}
                  </span>
                }
                onClick={toggleMode}
                mode={mode}
                className="bg-white/50 hover:-mt-1 transition-all duration-500"
              >
                <Icon
                  icon={
                    mode === "dark"
                      ? "line-md:sunny-filled-loop-to-moon-filled-alt-loop-transition"
                      : "line-md:moon-alt-to-sunny-outline-loop-transition"
                  }
                  className={`h-6 w-6 ${
                    mode === "dark" ? "text-blue-900" : "text-yellow-500"
                  }`}
                />
              </TooltipIconButton>

              <FullscreenToggle mode={mode} />

              <TooltipIconButton
                label={
                  <span
                    className={mode === "dark" ? "text-black" : "text-black"}
                  >
                    {dropdownOpen ? "Close Profile" : "Open Profile"}
                  </span>
                }
                mode={mode}
                className="bg-white/50 hover:-mt-1 transition-all duration-500"
              >
                <div
                  className="flex items-center gap-2 relative"
                  ref={dropdownRef}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <div className="flex items-center">
                    <div className="overflow-hidden">
                      <Icon icon="hugeicons:ai-user" className="h-6 w-6" />
                    </div>
                  </div>

                  {dropdownOpen && (
                    <div
                      className={`absolute top-full mt-2 right-0 w-80 rounded-2xl shadow-lg z-10 ${
                        mode === "dark"
                          ? "bg-gray-900 text-gray-100"
                          : "bg-white/95 text-black"
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-2 w-full">
                          <div className="overflow-hidden flex-shrink-0">
                            <Icon
                              icon="hugeicons:ai-user"
                              className="h-6 w-6"
                            />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex gap-2">
                              <span className="text-md font-semibold">
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
                            className={`flex items-center w-full gap-2 text-sm transition-all ${
                              mode === "dark"
                                ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                : "text-gray-500 hover:text-blue-800"
                            }`}
                          >
                            <Icon
                              icon="fluent-mdl2:radio-bullet"
                              className="h-5 w-5 "
                            />
                            <span className="">Profile</span>
                          </li>
                          <li
                            className={`flex items-center w-full gap-2 text-sm transition-all ${
                              mode === "dark"
                                ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                : "text-gray-500 hover:text-blue-800"
                            }`}
                          >
                            <Icon
                              icon="fluent-mdl2:radio-bullet"
                              className="h-5 w-5 "
                            />
                            <span className="">Settings</span>
                          </li>
                        </ul>

                        <button
                          onClick={onLogout}
                          className={`flex items-center w-full gap-2 border-t h-10 font-thin text-sm text-red-500 hover:text-red-600 transition-colors rounded-lg p-2
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
      <div className="h-[72px]" aria-hidden="true"></div>
      <CashRegisterModal
        isOpen={showCashRegister}
        onClose={() => {
          console.log("Cash Register modal closing");
          setShowCashRegister(false);
        }}
        user={user}
        onSessionChanged={handleSessionChanged}
      />
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
    </>
  );
};

export default PosHeader;
