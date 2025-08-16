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
import RegisterSelector from "@/components/RegisterSelector";
import SimpleModal from "@/components/SimpleModal";
import SalesReturnModals from "@/components/SalesReturnModals";
import { useRouter } from "next/router";

const PosHeader = ({
  mode,
  toggleMode,
  onLogout,
  user,
  printLastReceipt,
  lastOrderData,
  onOpenOrderHistory,
  showCashRegister,
  setShowCashRegister,
  showSalesReturnModal,
  setShowSalesReturnModal,
  selectedStoreId,
  setSelectedStoreId,
  stores: allStores,
}) => {
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
  const [selectedRegister, setSelectedRegister] = useState(null);
  const [windowWidth, setWindowWidth] = useState(null);

  // Persist selected register
  useEffect(() => {
    if (selectedRegister) {
      localStorage.setItem("pos_selected_register", selectedRegister);
    }
  }, [selectedRegister]);

  // Load persisted register on mount
  useEffect(() => {
    const savedRegister = localStorage.getItem("pos_selected_register");
    if (savedRegister) {
      setSelectedRegister(savedRegister);
    }
  }, []);
  const [userStoreName, setUserStoreName] = useState("");
  const [stores, setStores] = useState([]);
  // Demo state for SalesReturnModals
  const [salesReturnModalData, setSalesReturnModalData] = useState({});
  const [salesReturnReference, setSalesReturnReference] = useState("");
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const router = useRouter();
  // Window width tracking for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log("PosHeader mounted");
    return () => console.log("PosHeader unmounted");
  }, []);

  useEffect(() => {
    console.log("showCashRegister changed:", showCashRegister);
  }, [showCashRegister]);

  useEffect(() => {
    // For cashiers, use their assigned store
    if (user && user.role === "cashier" && user.store_id && stores.length > 0) {
      const store = stores.find((s) => String(s.id) === String(user.store_id));
      setUserStoreName(store ? store.name : "");
    }
    // For admin/manager, use selected store
    else if (
      user &&
      (user.role === "admin" || user.role === "manager") &&
      selectedStoreId &&
      allStores &&
      allStores.length > 0
    ) {
      const store = allStores.find(
        (s) => String(s.id) === String(selectedStoreId)
      );
      setUserStoreName(store ? store.name : "");
    }
  }, [user, stores, selectedStoreId, allStores]);

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

  // Fetch unread message count
  const fetchUnreadMessageCount = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user }),
      });
      const data = await res.json();
      if (data.conversations) {
        // Calculate total unread count from all conversations
        const totalUnread = data.conversations.reduce((total, conv) => {
          return total + (conv.unread_count || 0);
        }, 0);
        setUnreadMessageCount(totalUnread);
      }
    } catch (err) {
      console.error("Failed to fetch unread message count:", err);
    }
  };

  useEffect(() => {
    fetchUnreadMessageCount();
    // Refresh unread count every 30 seconds
    const interval = setInterval(fetchUnreadMessageCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

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

  const isMobile = windowWidth !== null && windowWidth < 640;
  const isTablet =
    windowWidth !== null && windowWidth >= 640 && windowWidth < 1024;

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
            ${
              isMobile
                ? "p-1 m-1"
                : isTablet
                ? "p-2 m-2"
                : "p-2 sm:p-3 m-2 sm:m-4"
            } transition-transform duration-300
            ${
              mode === "dark"
                ? "bg-[#101827]/50 text-white"
                : "bg-white/20 text-black"
            }
            backdrop-blur-sm shadow-lg rounded-2xl
          `}
        >
          <div
            className={`flex ${
              isMobile || isTablet ? "flex-col gap-2" : "flex-col sm:flex-row"
            } items-center justify-between w-full gap-0`}
          >
            <div
              className={`flex items-center w-full ${
                isMobile ? "justify-between" : ""
              }`}
            >
              <div className="flex-1 min-w-0 overflow-visible">
                {isMobile ? (
                  <div className="relative flex flex-col items-center justify-center gap-1 w-full">
                    {/* Mobile: Home and Register on same row */}
                    <div className="flex items-center gap-2 w-full justify-center">
                      {user?.role !== "cashier" && (
                        <TooltipIconButton
                          label="Back to Dashboard"
                          mode={mode}
                          className="select-none px-2.5 py-2 min-h-[44px] min-w-[44px] rounded-md hover:shadow-xl hover:-mt-1 active:scale-95 transition-all duration-500 flex-shrink-0"
                          onClick={() => {
                            router.push("/dashboard");
                          }}
                        >
                          <Icon
                            icon="mdi:home-outline"
                            className="h-5 w-5 text-gray-500"
                          />
                        </TooltipIconButton>
                      )}
                      <RegisterSelector
                        mode={mode}
                        user={user}
                        selectedRegister={selectedRegister}
                        onRegisterChange={setSelectedRegister}
                      />
                    </div>
                    {/* Mobile: Session duration below */}
                    <SessionDuration
                      mode={mode}
                      selectedRegister={selectedRegister}
                      sessionRefreshKey={sessionRefreshKey}
                    />
                  </div>
                ) : (
                  <div className="relative flex flex-row items-center justify-center gap-2 w-full">
                    {/* Tablet/Desktop: All on same row */}
                    {user?.role !== "cashier" && (
                      <TooltipIconButton
                        label="Back to Dashboard"
                        mode={mode}
                        className={`select-none ${
                          isTablet
                            ? "px-3 py-3 min-h-[48px] min-w-[48px]"
                            : "px-2 py-2 sm:px-1 sm:py-1"
                        } rounded-md hover:shadow-xl hover:-mt-1 active:scale-95 transition-all duration-500 flex-shrink-0`}
                        onClick={() => {
                          router.push("/dashboard");
                        }}
                      >
                        <Icon
                          icon="mdi:home-outline"
                          className={`${
                            isTablet ? "h-7 w-7" : "h-6 w-6 sm:h-7 sm:w-7"
                          } text-gray-500`}
                        />
                      </TooltipIconButton>
                    )}
                    <RegisterSelector
                      mode={mode}
                      user={user}
                      selectedRegister={selectedRegister}
                      onRegisterChange={setSelectedRegister}
                    />
                    <SessionDuration
                      mode={mode}
                      selectedRegister={selectedRegister}
                      sessionRefreshKey={sessionRefreshKey}
                    />
                  </div>
                )}
              </div>
            </div>

            <div
              className={`flex items-center w-full ${
                isMobile || isTablet
                  ? "justify-center flex-wrap gap-2"
                  : "gap-0"
              }`}
            >
              {/* Store Display/Selector */}
              {user?.role === "cashier" ? (
                // Cashier: Show assigned store (read-only)
                <div
                  className={
                    `flex items-center gap-1 sm:gap-2 ${
                      isMobile || isTablet
                        ? "px-2 py-1.5 text-xs"
                        : "px-2 py-2 text-sm sm:text-base"
                    } rounded-xl transition-all duration-300 ` +
                    (mode === "dark"
                      ? "bg-gray-800/80 text-white"
                      : "bg-white/80 text-gray-700") +
                    " backdrop-blur-sm border border-white/20"
                  }
                >
                  <span
                    className={`flex gap-1 font-semibold ${
                      isMobile
                        ? "text-xs"
                        : isTablet
                        ? "text-sm"
                        : "text-sm sm:text-base"
                    }`}
                  >
                    {isMobile ? "" : "Store:"}
                    <span className="text-gray-500">
                      {isMobile ? userStoreName : userStoreName}
                    </span>
                  </span>
                </div>
              ) : (
                // Admin/Manager: Show store selector
                <div className="relative" ref={storeDropdownRef}>
                  <div
                    className={
                      `flex items-center gap-1 sm:gap-2 ${
                        isMobile || isTablet
                          ? "px-2 py-1.5 text-xs min-h-[36px]"
                          : "px-2 py-2 text-sm"
                      } rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer ` +
                      (mode === "dark"
                        ? "bg-gray-800/80 text-white hover:bg-gray-700/80"
                        : "bg-white/80 text-gray-700 hover:bg-white/95") +
                      " backdrop-blur-sm border border-white/20"
                    }
                    onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
                  >
                    <span
                      className={`flex gap-1 font-semibold ${
                        isMobile ? "text-xs" : isTablet ? "text-sm" : "text-sm"
                      }`}
                    >
                      {isMobile ? "" : "Store:"}
                      <span className="text-gray-500">{userStoreName}</span>
                    </span>
                    <Icon
                      icon="mdi:chevron-down"
                      className={`${
                        isMobile ? "h-3 w-3" : isTablet ? "h-4 w-4" : "h-4 w-4"
                      } transition-transform flex-shrink-0 ${
                        storeDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {storeDropdownOpen && (
                    <div
                      className={`absolute top-full mt-2 ${
                        isMobile
                          ? "left-0 right-0 w-full"
                          : isTablet
                          ? "right-0 w-64"
                          : "right-0 w-64"
                      } rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto ${
                        mode === "dark"
                          ? "bg-gray-900 text-gray-100"
                          : "bg-white/95 text-black"
                      }`}
                    >
                      <div className="p-2">
                        <div
                          className={`${
                            isMobile
                              ? "text-xs"
                              : isTablet
                              ? "text-sm"
                              : "text-sm"
                          } font-semibold text-gray-500 px-3 py-2`}
                        >
                          Select Store for Sales
                        </div>
                        {allStores && allStores.length > 0 ? (
                          allStores.map((store) => (
                            <button
                              key={store.id}
                              onClick={async () => {
                                setSelectedStoreId(store.id);
                                setStoreDropdownOpen(false);
                                const { toast } = await import(
                                  "react-hot-toast"
                                );
                                toast.success(
                                  `Store switched to: ${store.name}`
                                );
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${
                                isMobile
                                  ? "text-xs min-h-[40px]"
                                  : isTablet
                                  ? "text-sm min-h-[44px]"
                                  : "text-sm min-h-[44px]"
                              } transition-all cursor-pointer ${
                                selectedStoreId === store.id
                                  ? mode === "dark"
                                    ? "bg-blue-900 text-blue-300"
                                    : "bg-blue-50 text-blue-800"
                                  : mode === "dark"
                                  ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                  : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                              }`}
                            >
                              <Icon
                                icon="mdi:store"
                                className={`${
                                  isMobile ? "h-4 w-4" : "h-5 w-5"
                                } flex-shrink-0`}
                              />
                              <div className="flex flex-col items-start">
                                <span className="font-medium">
                                  {store.name}
                                </span>
                                {store.address && (
                                  <span
                                    className={`${
                                      isMobile ? "text-xs" : "text-xs"
                                    } opacity-75`}
                                  >
                                    {isMobile
                                      ? store.address.substring(0, 20) + "..."
                                      : store.address}
                                  </span>
                                )}
                              </div>
                              {selectedStoreId === store.id && (
                                <Icon
                                  icon="mdi:check"
                                  className={`${
                                    isMobile ? "h-3 w-3" : "h-4 w-4"
                                  } ml-auto text-green-500`}
                                />
                              )}
                            </button>
                          ))
                        ) : (
                          <div
                            className={`px-3 py-2 ${
                              isMobile ? "text-xs" : "text-sm"
                            } text-gray-500`}
                          >
                            No stores available
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div
                className={
                  `flex items-center gap-1 sm:gap-2 ${
                    isMobile || isTablet
                      ? "px-2 py-1.5 text-xs"
                      : "px-2 py-2 text-sm"
                  } rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 ` +
                  (mode === "dark"
                    ? "bg-gray-800/80 text-white hover:bg-gray-700/80"
                    : "bg-white/80 text-gray-700 hover:bg-white/95") +
                  " backdrop-blur-sm border border-white/20"
                }
                disabled
              >
                <div
                  className={`flex gap-1 font-semibold ${
                    isMobile || isTablet ? "text-xs" : "text-sm"
                  }`}
                >
                  <span className="text-gray-500">Cashier:</span>
                  <span className="text-gray-500">{user.name}</span>
                </div>
              </div>
            </div>

            <div
              className={`flex ${
                isMobile || isTablet ? "justify-between" : "justify-center"
              } items-center w-full ${
                isMobile ? "gap-1" : isTablet ? "gap-2" : "gap-2 sm:gap-4"
              } flex-wrap`}
            >
              {/* Core POS Actions - Always Visible */}
              <TooltipIconButton
                label="Cash Register"
                mode={mode}
                className={`select-none ${
                  isMobile
                    ? "px-2.5 py-2 min-h-[44px] min-w-[44px]"
                    : isTablet
                    ? "px-3 py-3 min-h-[48px] min-w-[48px]"
                    : "px-2 py-2 sm:px-1 sm:py-1"
                } rounded-md hover:shadow-xl hover:-mt-1 active:scale-95 transition-all duration-500`}
                onClick={() => {
                  console.log("Cash Register button clicked");
                  if (setShowCashRegister) setShowCashRegister(true);
                }}
              >
                <Icon
                  icon="iconoir:lot-of-cash"
                  className={`${
                    isMobile
                      ? "h-5 w-5"
                      : isTablet
                      ? "h-7 w-7"
                      : "h-6 w-6 sm:h-7 sm:w-7"
                  } text-gray-500`}
                />
              </TooltipIconButton>

              {/* Print Last Receipt - Visible on mobile/tablet for all users, or always visible for cashiers */}
              {(isMobile || isTablet || user?.role === "cashier") && (
                <TooltipIconButton
                  label="Print Last Receipt"
                  mode={mode}
                  className={`select-none ${
                    isMobile
                      ? "px-2.5 py-2 min-h-[44px] min-w-[44px]"
                      : isTablet
                      ? "px-3 py-3 min-h-[48px] min-w-[48px]"
                      : "px-2 py-2 sm:px-1 sm:py-1"
                  } rounded-md hover:shadow-xl hover:-mt-1 active:scale-95 transition-all duration-500`}
                  onClick={printLastReceipt}
                  disabled={!lastOrderData}
                >
                  <Icon
                    icon="lets-icons:print-light"
                    className={`${
                      isMobile
                        ? "h-5 w-5"
                        : isTablet
                        ? "h-7 w-7"
                        : "h-6 w-6 sm:h-7 sm:w-7"
                    } ${lastOrderData ? "text-gray-500" : "text-gray-300"}`}
                  />
                </TooltipIconButton>
              )}

              {/* Messages - Visible on mobile/tablet for all users, or always visible for cashiers */}
              {(isMobile || isTablet || user?.role === "cashier") && (
                <TooltipIconButton
                  label="Messages"
                  mode={mode}
                  className={`select-none ${
                    isMobile
                      ? "px-2.5 py-2 min-h-[44px] min-w-[44px]"
                      : isTablet
                      ? "px-3 py-3 min-h-[48px] min-w-[48px]"
                      : "px-2 py-2 sm:px-1 sm:py-1"
                  } rounded-md hover:shadow-xl hover:-mt-1 active:scale-95 transition-all duration-500 relative`}
                  onClick={() => router.push("/messages")}
                >
                  <Icon
                    icon="mdi:message-text"
                    className={`${
                      isMobile
                        ? "h-5 w-5"
                        : isTablet
                        ? "h-7 w-7"
                        : "h-6 w-6 sm:h-7 sm:w-7"
                    } text-gray-500`}
                  />
                  {unreadMessageCount > 0 && (
                    <div
                      className={`absolute -top-1 -right-1 bg-red-500 text-white ${
                        isMobile ? "text-xs h-4 w-4" : "text-xs h-5 w-5"
                      } rounded-full flex items-center justify-center font-bold`}
                    >
                      {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                    </div>
                  )}
                </TooltipIconButton>
              )}

              {/* View Orders - Only for non-cashiers and only on tablet */}
              {user?.role !== "cashier" && isTablet && (
                <TooltipIconButton
                  label="View Orders"
                  mode={mode}
                  className={`select-none px-3 py-3 min-h-[48px] min-w-[48px] rounded-md hover:shadow-xl hover:-mt-1 active:scale-95 transition-all duration-500`}
                  onClick={() => onOpenOrderHistory()}
                >
                  <Icon
                    icon="material-symbols-light:order-approve-outline"
                    className="h-7 w-7 text-gray-500"
                  />
                </TooltipIconButton>
              )}

              {/* Today's Sales - Only for non-cashiers and not on mobile */}
              {user?.role !== "cashier" && !isMobile && (
                <TooltipIconButton
                  label="Today's Sales"
                  mode={mode}
                  className={`select-none ${
                    isTablet
                      ? "px-3 py-3 min-h-[48px] min-w-[48px]"
                      : "px-2 py-2 sm:px-1 sm:py-1"
                  } rounded-md hover:shadow-xl hover:-mt-1 active:scale-95 transition-all duration-500`}
                  onClick={() => setShowSalesModal(true)}
                >
                  <Icon
                    icon="mdi:cart-sale"
                    className={`${
                      isTablet ? "h-7 w-7" : "h-6 w-6 sm:h-7 sm:w-7"
                    } text-gray-500`}
                  />
                </TooltipIconButton>
              )}

              {/* Sales Return - Available for all users and not on mobile */}
              {!isMobile && (
                <TooltipIconButton
                  label="Sales Return"
                  mode={mode}
                  className={`select-none ${
                    isTablet
                      ? "px-3 py-3 min-h-[48px] min-w-[48px]"
                      : "px-2 py-2 sm:px-1 sm:py-1"
                  } rounded-md hover:shadow-xl hover:-mt-1 active:scale-95 transition-all duration-500`}
                  onClick={() => setShowSalesReturnModal(true)}
                >
                  <Icon
                    icon="prime:undo"
                    className={`${
                      isTablet ? "h-7 w-7" : "h-6 w-6 sm:h-7 sm:w-7"
                    } text-gray-500`}
                  />
                </TooltipIconButton>
              )}

              {/* Today's Profit - Only for non-cashiers and not on mobile */}
              {user?.role !== "cashier" && !isMobile && (
                <TooltipIconButton
                  label="Today's Profit"
                  mode={mode}
                  className={`select-none ${
                    isTablet
                      ? "px-3 py-3 min-h-[48px] min-w-[48px]"
                      : "px-2 py-2 sm:px-1 sm:py-1"
                  } rounded-md hover:shadow-xl hover:-mt-1 active:scale-95 transition-all duration-500`}
                  onClick={() => setShowProfitModal(true)}
                >
                  <Icon
                    icon="hugeicons:chart-increase"
                    className={`${
                      isTablet ? "h-7 w-7" : "h-6 w-6 sm:h-7 sm:w-7"
                    } text-gray-500`}
                  />
                </TooltipIconButton>
              )}

              {/* All Other Actions - Consolidated Dropdown */}
              <div className="relative" ref={addNewDropdownRef}>
                <TooltipIconButton
                  label="More Actions"
                  mode={mode}
                  className={`select-none ${
                    isMobile
                      ? "px-2.5 py-2 min-h-[44px] min-w-[44px]"
                      : isTablet
                      ? "px-3 py-3 min-h-[48px] min-w-[48px]"
                      : "px-2 py-2 sm:px-1 sm:py-1"
                  } rounded-md hover:shadow-xl hover:-mt-1 active:scale-95 transition-all duration-500 relative`}
                  onClick={() => setAddNewDropdownOpen(!addNewDropdownOpen)}
                >
                  <Icon
                    icon="mdi:dots-horizontal"
                    className={`${
                      isMobile
                        ? "h-5 w-5"
                        : isTablet
                        ? "h-7 w-7"
                        : "h-6 w-6 sm:h-7 sm:w-7"
                    } text-gray-500`}
                  />
                  {/* Show unread message count on desktop when Messages is in dropdown (only for non-cashiers) */}
                  {!isMobile &&
                    !isTablet &&
                    user?.role !== "cashier" &&
                    unreadMessageCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center font-bold">
                        {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                      </div>
                    )}
                </TooltipIconButton>

                {addNewDropdownOpen && (
                  <div
                    className={`absolute top-full mt-2 right-0 ${
                      isMobile ? "w-52" : isTablet ? "w-60" : "w-56"
                    } rounded-xl shadow-lg z-20 ${
                      mode === "dark"
                        ? "bg-gray-900 text-gray-100"
                        : "bg-white/95 text-black"
                    } ${isMobile ? "max-h-[70vh] overflow-y-auto" : ""}`}
                  >
                    <div className="p-2 space-y-1">
                      {/* POS Actions */}
                      {/* Sales Return - Only show in dropdown on mobile */}
                      {isMobile && (
                        <button
                          onClick={() => {
                            setAddNewDropdownOpen(false);
                            setShowSalesReturnModal(true);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${
                            isMobile
                              ? "text-xs min-h-[40px]"
                              : isTablet
                              ? "text-sm min-h-[44px]"
                              : "text-sm min-h-[44px]"
                          } transition-all cursor-pointer ${
                            mode === "dark"
                              ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                              : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                          }`}
                        >
                          <Icon
                            icon="prime:undo"
                            className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`}
                          />
                          <span>Sales Return</span>
                        </button>
                      )}

                      {/* Admin/Manager Actions */}
                      {user?.role !== "cashier" && (
                        <>
                          {/* View Orders - Show in dropdown on mobile and desktop */}
                          {(isMobile || (!isMobile && !isTablet)) && (
                            <button
                              onClick={() => {
                                setAddNewDropdownOpen(false);
                                onOpenOrderHistory();
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${
                                isMobile
                                  ? "text-xs min-h-[40px]"
                                  : isTablet
                                  ? "text-sm min-h-[44px]"
                                  : "text-sm min-h-[44px]"
                              } transition-all cursor-pointer ${
                                mode === "dark"
                                  ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                  : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                              }`}
                            >
                              <Icon
                                icon="material-symbols-light:order-approve-outline"
                                className={`${
                                  isMobile ? "h-4 w-4" : "h-5 w-5"
                                }`}
                              />
                              <span>View Orders</span>
                            </button>
                          )}

                          {/* Today's Sales - Only show in dropdown on mobile */}
                          {isMobile && (
                            <button
                              onClick={() => {
                                setAddNewDropdownOpen(false);
                                setShowSalesModal(true);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${
                                isMobile
                                  ? "text-xs min-h-[40px]"
                                  : isTablet
                                  ? "text-sm min-h-[44px]"
                                  : "text-sm min-h-[44px]"
                              } transition-all cursor-pointer ${
                                mode === "dark"
                                  ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                  : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                              }`}
                            >
                              <Icon
                                icon="mdi:cart-sale"
                                className={`${
                                  isMobile ? "h-4 w-4" : "h-5 w-5"
                                }`}
                              />
                              <span>Today's Sales</span>
                            </button>
                          )}

                          {/* Today's Profit - Only show in dropdown on mobile */}
                          {isMobile && (
                            <button
                              onClick={() => {
                                setAddNewDropdownOpen(false);
                                setShowProfitModal(true);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${
                                isMobile
                                  ? "text-xs min-h-[40px]"
                                  : isTablet
                                  ? "text-sm min-h-[44px]"
                                  : "text-sm min-h-[44px]"
                              } transition-all cursor-pointer ${
                                mode === "dark"
                                  ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                  : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                              }`}
                            >
                              <Icon
                                icon="hugeicons:chart-increase"
                                className={`${
                                  isMobile ? "h-4 w-4" : "h-5 w-5"
                                }`}
                              />
                              <span>Today's Profit</span>
                            </button>
                          )}
                        </>
                      )}

                      {/* System Actions */}
                      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                      {/* Print Last Receipt - Only show in dropdown on desktop for non-cashiers */}
                      {!isMobile && !isTablet && user?.role !== "cashier" && (
                        <button
                          onClick={() => {
                            setAddNewDropdownOpen(false);
                            printLastReceipt();
                          }}
                          disabled={!lastOrderData}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${
                            isMobile
                              ? "text-xs min-h-[40px]"
                              : isTablet
                              ? "text-sm min-h-[44px]"
                              : "text-sm min-h-[44px]"
                          } transition-all cursor-pointer ${
                            !lastOrderData
                              ? "opacity-50 cursor-not-allowed"
                              : mode === "dark"
                              ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                              : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                          }`}
                        >
                          <Icon
                            icon="lets-icons:print-light"
                            className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`}
                          />
                          <span>Print Last Receipt</span>
                        </button>
                      )}

                      {/* Messages - Only show in dropdown on desktop for non-cashiers */}
                      {!isMobile && !isTablet && user?.role !== "cashier" && (
                        <button
                          onClick={() => {
                            setAddNewDropdownOpen(false);
                            router.push("/messages");
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${
                            isMobile
                              ? "text-xs min-h-[40px]"
                              : isTablet
                              ? "text-sm min-h-[44px]"
                              : "text-sm min-h-[44px]"
                          } transition-all cursor-pointer ${
                            mode === "dark"
                              ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                              : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                          } relative`}
                        >
                          <Icon
                            icon="mdi:message-text"
                            className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`}
                          />
                          <span>Messages</span>
                          {unreadMessageCount > 0 && (
                            <div className="ml-auto bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center font-bold">
                              {unreadMessageCount > 99
                                ? "99+"
                                : unreadMessageCount}
                            </div>
                          )}
                        </button>
                      )}

                      <div className="px-3">
                        <LanguageSwitch mode={mode} showLabel={true} />
                      </div>

                      {user?.role !== "cashier" && (
                        <div className="px-3">
                          <NotificationButton
                            mode={mode}
                            user={user}
                            showLabel={true}
                          />
                        </div>
                      )}

                      {/* Theme Toggle - Available in dropdown for all screen sizes */}
                      <button
                        onClick={() => {
                          setAddNewDropdownOpen(false);
                          toggleMode();
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${
                          isMobile
                            ? "text-xs min-h-[40px]"
                            : isTablet
                            ? "text-sm min-h-[44px]"
                            : "text-sm min-h-[44px]"
                        } transition-all cursor-pointer ${
                          mode === "dark"
                            ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                            : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                        }`}
                      >
                        <Icon
                          icon={
                            mode === "dark"
                              ? "line-md:sunny-filled-loop-to-moon-filled-alt-loop-transition"
                              : "line-md:moon-alt-to-sunny-outline-loop-transition"
                          }
                          className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`}
                        />
                        <span>
                          {mode === "dark" ? "Light Mode" : "Dark Mode"}
                        </span>
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
                className={`select-none bg-white/50 hover:-mt-1 active:scale-95 transition-all duration-500 ${
                  isMobile
                    ? "px-2.5 py-2 min-h-[44px] min-w-[44px]"
                    : isTablet
                    ? "px-3 py-3 min-h-[48px] min-w-[48px]"
                    : "px-2 py-2 sm:px-1 sm:py-1"
                }`}
              >
                <div
                  className="flex items-center gap-2 relative"
                  ref={dropdownRef}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <div className="flex items-center">
                    <div
                      className={`overflow-hidden rounded-full ${
                        isMobile
                          ? "w-8 h-8"
                          : isTablet
                          ? "w-10 h-10"
                          : "w-6 h-6 sm:w-6 sm:h-6"
                      }`}
                    >
                      {user && user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name || "User"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon
                          icon="hugeicons:ai-user"
                          className={`${
                            isMobile
                              ? "h-8 w-8"
                              : isTablet
                              ? "h-10 w-10"
                              : "h-6 w-6"
                          }`}
                        />
                      )}
                    </div>
                  </div>

                  {dropdownOpen && (
                    <div
                      className={`absolute top-full mt-2 right-0 ${
                        isMobile ? "w-64" : isTablet ? "w-72" : "w-72 sm:w-80"
                      } rounded-2xl shadow-lg z-10 ${
                        mode === "dark"
                          ? "bg-gray-900 text-gray-100"
                          : "bg-white/95 text-black"
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-2 w-full">
                          <div
                            className={`overflow-hidden flex-shrink-0 rounded-full ${
                              isMobile
                                ? "w-10 h-10"
                                : isTablet
                                ? "w-12 h-12"
                                : "w-6 h-6"
                            }`}
                          >
                            {user && user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.name || "User"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Icon
                                icon="hugeicons:ai-user"
                                className={`${
                                  isMobile
                                    ? "h-10 w-10"
                                    : isTablet
                                    ? "h-12 w-12"
                                    : "h-6 w-6"
                                }`}
                              />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <div
                              className={`flex ${
                                isMobile
                                  ? "flex-col gap-1"
                                  : isTablet
                                  ? "flex-col gap-1"
                                  : "gap-2"
                              }`}
                            >
                              <span
                                className={`${
                                  isMobile
                                    ? "text-sm"
                                    : isTablet
                                    ? "text-base"
                                    : "text-sm sm:text-md"
                                } font-semibold truncate ${
                                  mode === "dark" ? "text-white" : "text-black"
                                }`}
                              >
                                {user.name}
                              </span>
                              <span
                                className={`rounded-md capitalize px-2 py-1 ${
                                  isTablet ? "text-sm" : "text-xs"
                                } font-medium ring-1 ring-inset ${
                                  mode === "dark"
                                    ? "bg-green-900/30 text-green-300 ring-green-600/30"
                                    : "bg-green-50 text-green-700 ring-green-600/20"
                                }`}
                              >
                                {user.role}
                              </span>
                            </div>
                            <span
                              className={`${
                                isTablet ? "text-sm" : "text-xs"
                              } truncate ${
                                mode === "dark"
                                  ? "text-gray-300"
                                  : "text-gray-600"
                              }`}
                            >
                              {user.agencyName}
                            </span>
                          </div>
                        </div>
                        <ul className="py-4 space-y-2">
                          <li
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push("/profile");
                            }}
                            className={`select-none flex items-center w-full gap-2 ${
                              isTablet ? "text-base" : "text-sm"
                            } transition-all cursor-pointer p-2 rounded-lg ${
                              isMobile
                                ? "min-h-[40px]"
                                : isTablet
                                ? "min-h-[44px]"
                                : "min-h-[44px]"
                            } ${
                              mode === "dark"
                                ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                            }`}
                          >
                            <Icon
                              icon="fluent-mdl2:radio-bullet"
                              className={`${isTablet ? "h-6 w-6" : "h-5 w-5"}`}
                            />
                            <span className="">Profile</span>
                          </li>
                        </ul>
                        <button
                          onClick={onLogout}
                          className={`select-none flex items-center w-full gap-2 border-t ${
                            isTablet ? "h-12" : "h-10"
                          } font-thin ${
                            isTablet ? "text-base" : "text-sm"
                          } transition-colors rounded-lg p-2 ${
                            isMobile
                              ? "min-h-[40px]"
                              : isTablet
                              ? "min-h-[44px]"
                              : "min-h-[44px]"
                          }
                            ${
                              mode === "dark"
                                ? "text-red-400 hover:text-red-300 hover:bg-gray-800 border-gray-700"
                                : "text-red-500 hover:text-red-600 hover:bg-gray-100 border-gray-200"
                            }`}
                        >
                          <Icon
                            icon="mdi:logout"
                            className={`${isTablet ? "h-6 w-6" : "h-5 w-5"}`}
                          />
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

      {/* Spacer div to account for fixed header height */}
      <div
        className={`${
          isMobile ? "h-[120px]" : isTablet ? "h-[140px]" : "h-[100px]"
        }`}
        aria-hidden="true"
      ></div>
    </>
  );
};

export default PosHeader;
