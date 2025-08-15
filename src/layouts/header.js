import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import Search from "@/components/Search";
import FullscreenToggle from "@/components/FullscreenToggle";
import TooltipIconButton from "@/components/TooltipIconButton";
import LanguageSwitch from "@/components/LanguageSwitch";
import NotificationButton from "@/components/NotificationButton";
import Link from "next/link";
import { useRouter } from "next/router";

const Header = ({
  mode,
  toggleMode,
  isSidebarOpen,
  toggleSidebar,
  onLogout,
  user,
  onSearchModalToggle,
  isHeaderVisible = true,
  toggleHeader = null,
}) => {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(null);
  const dropdownRef = useRef(null);
  const headerRef = useRef(null);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const storeDropdownRef = useRef(null);
  const [addNewDropdownOpen, setAddNewDropdownOpen] = useState(false);
  const [moreActionsDropdownOpen, setMoreActionsDropdownOpen] = useState(false);
  const addNewDropdownRef = useRef(null);
  const moreActionsDropdownRef = useRef(null);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showAllAddOptions, setShowAllAddOptions] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

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
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
      if (
        moreActionsDropdownRef.current &&
        !moreActionsDropdownRef.current.contains(e.target)
      ) {
        setMoreActionsDropdownOpen(false);
      }
    };
    if (storeDropdownOpen || addNewDropdownOpen || moreActionsDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [storeDropdownOpen, addNewDropdownOpen, moreActionsDropdownOpen]);

  useEffect(() => {
    // Fetch stores on mount
    const fetchStores = async () => {
      try {
        const res = await fetch("/api/stores");
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          setStores(data.data);
          // Try to load last used store from localStorage
          const last = localStorage.getItem("selected_store_id");
          if (last && data.data.find((s) => s.id === last)) {
            setSelectedStore(last);
          } else {
            setSelectedStore(""); // Default to All Stores
          }
        }
      } catch (err) {
        setStores([]);
      }
    };
    fetchStores();
  }, []);

  // Messages: fetch unread count
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
    const interval = setInterval(fetchUnreadMessageCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Persist selected store
  useEffect(() => {
    if (selectedStore) {
      localStorage.setItem("selected_store_id", selectedStore);
    }
  }, [selectedStore]);

  const isMobile = windowWidth !== null && windowWidth < 640;
  const isTablet =
    windowWidth !== null && windowWidth >= 640 && windowWidth < 1024;

  return (
    <>
      {/* Floating toggle button for mobile/tablet when header is hidden */}
      {(isMobile || isTablet) && !isHeaderVisible && (
        <button
          onClick={toggleHeader}
          className={`fixed top-2 right-2 z-50 p-2 rounded-full shadow-lg transition-all duration-300 ${
            mode === "dark"
              ? "bg-gray-800 text-white hover:bg-gray-700"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
          title="Show Header"
        >
          <Icon
            icon="mdi:menu"
            className={`${isTablet ? "w-6 h-6" : "w-5 h-5"}`}
          />
        </button>
      )}

      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-10 transition-all duration-300 ${
          mode === "dark" ? "bg-[#101827]" : "bg-transparent"
        } ${
          (isMobile || isTablet) && !isHeaderVisible ? "-translate-y-full" : ""
        }`}
      >
        <div
          className={`
            ${
              isMobile ? "p-1 m-1" : isTablet ? "p-2 m-2" : "p-2 m-4"
            } transition-transform duration-300
            ${
              isMobile || isTablet
                ? "ml-0"
                : isSidebarOpen
                  ? "md:ml-[272px]"
                  : "md:ml-[80px]"
            }
            ${
              mode === "dark"
                ? "bg-[#101827]/50 text-white"
                : "bg-white/20 text-black"
            }
            backdrop-blur-sm shadow-lg rounded-2xl
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Sidebar toggle button: always visible */}
              <button
                onClick={toggleSidebar}
                className={`text-gray-500 hover:scale-110 transition-transform flex-shrink-0 ${
                  isTablet ? "p-2 rounded-md" : ""
                }`}
                title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                aria-label={
                  isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"
                }
              >
                <Icon
                  icon={
                    isSidebarOpen ? "dashicons:arrow-left-alt" : "ri:menu-line"
                  }
                  className={`${
                    isMobile ? "w-5 h-5" : isTablet ? "w-8 h-8" : "w-6 h-6"
                  }`}
                />
              </button>
            </div>

            <div
              className={`flex justify-end items-center w-full ${
                isMobile ? "gap-2" : isTablet ? "gap-5" : "gap-2"
              }`}
            >
              {/* Search icon - opens modal when clicked */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className={`flex items-center justify-center ${
                  isMobile ? "p-2.5" : isTablet ? "p-3.5" : "p-2"
                } rounded-md hover:shadow-md transition-all duration-300 flex-shrink-0 ${
                  mode === "dark"
                    ? "bg-gray-800 text-gray-100 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } ${
                  isMobile
                    ? "min-h-[44px] min-w-[44px]"
                    : isTablet
                      ? "min-h-[48px] min-w-[48px]"
                      : ""
                }`}
                title="Search"
              >
                <Icon
                  icon="material-symbols:search-rounded"
                  className={`${
                    isMobile ? "h-5 w-5" : isTablet ? "h-7 w-7" : "h-6 w-6"
                  } ${mode === "dark" ? "text-gray-300" : "text-blue-900"}`}
                />
              </button>

              {/* Theme toggle - visible on mobile/tablet */}
              {(isMobile || isTablet) && (
                <button
                  onClick={toggleMode}
                  className={`flex items-center justify-center ${
                    isMobile ? "p-2.5" : "p-3.5"
                  } rounded-md hover:shadow-md transition-all duration-300 flex-shrink-0 ${
                    mode === "dark"
                      ? "bg-gray-800 text-gray-100 hover:bg-gray-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  } ${
                    isMobile
                      ? "min-h-[44px] min-w-[44px]"
                      : isTablet
                        ? "min-h-[48px] min-w-[48px]"
                        : ""
                  }`}
                  title={
                    mode === "dark"
                      ? "Switch to Light Mode"
                      : "Switch to Dark Mode"
                  }
                >
                  <Icon
                    icon={
                      mode === "dark"
                        ? "line-md:sunny-filled-loop-to-moon-filled-alt-loop-transition"
                        : "line-md:moon-alt-to-sunny-outline-loop-transition"
                    }
                    className={`${isMobile ? "h-5 w-5" : "h-7 w-7"} ${
                      mode === "dark" ? "text-blue-400" : "text-yellow-500"
                    }`}
                  />
                </button>
              )}

              {/* Language Switch - visible on tablet only */}
              {isTablet && (
                <div className="flex-shrink-0 scale-140">
                  <LanguageSwitch mode={mode} />
                </div>
              )}

              {/* Notifications - visible on mobile/tablet for non-cashiers */}
              {(isMobile || isTablet) && user?.role !== "cashier" && (
                <div
                  className={`flex-shrink-0 ${
                    isMobile ? "scale-125" : isTablet ? "scale-150" : ""
                  }`}
                >
                  <NotificationButton mode={mode} user={user} />
                </div>
              )}

              {/* Messages - visible on tablet only */}
              {isTablet && (
                <TooltipIconButton
                  label="Messages"
                  mode={mode}
                  className="select-none px-3.5 py-3.5 min-h-[48px] min-w-[48px] rounded-md hover:shadow-xl hover:-mt-1 active:scale-95 transition-all duration-500 relative"
                  onClick={() => router.push("/messages")}
                >
                  <Icon
                    icon="mdi:message-text"
                    className="h-7 w-7 text-gray-500"
                  />
                  {unreadMessageCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center font-bold">
                      {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                    </div>
                  )}
                </TooltipIconButton>
              )}

              {/* Add New - visible on tablet for non-cashiers */}
              {isTablet && user?.role !== "cashier" && (
                <div className="relative flex-shrink-0" ref={addNewDropdownRef}>
                  <button
                    onClick={() => setAddNewDropdownOpen((prev) => !prev)}
                    className={`flex items-center justify-center bg-blue-900 font-semibold text-white px-3.5 py-3.5 rounded-md hover:shadow-xl hover:-mt-0.5 transition-all duration-300 flex-shrink-0 min-h-[48px] min-w-[48px]`}
                    title="Add New"
                  >
                    <Icon icon="icons8:plus" className="h-6 w-6 text-white" />
                  </button>

                  {/* Add New dropdown for tablet */}
                  {addNewDropdownOpen && (
                    <div
                      className={`absolute left-0 mt-2 w-screen max-w-full rounded-xl shadow-lg overflow-hidden transition-all duration-300 z-30 ${
                        mode === "dark"
                          ? "bg-gray-900 text-gray-100"
                          : "bg-white text-black"
                      } max-h-96 opacity-100 scale-100 mx-4`}
                      style={{
                        left: "-50vw",
                        width: "100vw",
                        maxWidth: "100vw",
                      }}
                    >
                      <div className="grid grid-cols-6 gap-3 p-4">
                        {[
                          // Setup & Configuration (Most used for initial setup)
                          {
                            label: "Store",
                            icon: "mdi:store-outline",
                            href: "/business-locations?add=true",
                          },
                          {
                            label: "Category",
                            icon: "mdi:folder-outline",
                            href: "/category?add=true",
                          },
                          {
                            label: "Product",
                            icon: "mdi:package-variant",
                            href: "/products?add=true",
                          },

                          // People & Relationships
                          {
                            label: "User",
                            icon: "mdi:account-outline",
                            href: "/users?add=true",
                          },
                          {
                            label: "Customer",
                            icon: "mdi:account-group-outline",
                            href: "/customers?add=true",
                          },
                          {
                            label: "Supplier",
                            icon: "mdi:truck-outline",
                            href: "/suppliers?add=true",
                          },

                          // Core Business Operations (Most frequently used)
                          {
                            label: "Sale",
                            icon: "mdi:cart-arrow-up",
                            href: "/sales?add=true",
                          },
                          {
                            label: "Purchase",
                            icon: "mdi:cart-arrow-down",
                            href: "/purchases?add=true",
                          },
                          {
                            label: "Expense",
                            icon: "mdi:cash-minus",
                            href: "/expenses?add=true",
                          },

                          // Inventory Management
                          {
                            label: "Transfer",
                            icon: "mdi:bank-transfer",
                            href: "/stock-operations?add=true",
                          },
                          {
                            label: "Return",
                            icon: "mdi:undo-variant",
                            href: "/sales-return?add=true",
                          },
                        ].map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className={`flex flex-col items-center justify-center rounded-lg p-2 text-xs font-medium shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 border ${
                              mode === "dark"
                                ? "bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700"
                                : "bg-white border-gray-200 hover:bg-orange-50"
                            } hover:border-orange-400`}
                            tabIndex={0}
                            onClick={() => setAddNewDropdownOpen(false)}
                          >
                            <span
                              className={`flex items-center justify-center h-8 w-8 rounded-full mb-1 ${
                                mode === "dark"
                                  ? "bg-gray-900 hover:bg-gray-700"
                                  : "bg-gray-100 hover:bg-orange-50"
                              } transition-all duration-200`}
                            >
                              <Icon
                                icon={item.icon}
                                className="h-5 w-5 text-blue-950"
                              />
                            </span>
                            <span className="text-xs">{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Fullscreen Toggle - visible on tablet only */}
              {isTablet && (
                <div className="flex-shrink-0 scale-140">
                  <FullscreenToggle mode={mode} />
                </div>
              )}

              {/* POS button - always visible on mobile/tablet for quick access */}
              {(isMobile || isTablet) && (
                <Link
                  href="/pos/"
                  className={`flex items-center justify-center bg-blue-900 font-semibold text-white rounded-md hover:shadow-xl hover:-mt-0.5 transition-all duration-300 flex-shrink-0 ${
                    isMobile
                      ? "px-2.5 py-2.5 min-h-[44px] min-w-[44px]"
                      : "px-3.5 py-3.5 min-h-[48px] min-w-[48px]"
                  }`}
                  title="Point of Sale"
                >
                  <Icon
                    icon="akar-icons:laptop-device"
                    className={`${isMobile ? "h-5 w-5" : "h-6 w-6"} text-white`}
                  />
                </Link>
              )}

              {/* Store dropdown - hidden for cashiers */}
              {user?.role !== "cashier" && (
                <div className="relative flex-shrink-0" ref={storeDropdownRef}>
                  <button
                    className={`flex items-center ${
                      isMobile
                        ? "gap-1 px-2.5 py-2"
                        : isTablet
                          ? "gap-1 px-3.5 py-3.5"
                          : "gap-1 text-sm px-3 py-1.5"
                    } rounded-md hover:shadow-md transition-all duration-300 ${
                      isMobile
                        ? "min-h-[44px] min-w-[44px]"
                        : isTablet
                          ? "min-h-[48px] min-w-[48px]"
                          : ""
                    }
                    ${
                      mode === "dark"
                        ? "bg-gray-800 text-gray-100 hover:bg-gray-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => setStoreDropdownOpen((prev) => !prev)}
                    title={
                      isMobile || isTablet
                        ? stores.length > 0
                          ? selectedStore
                            ? stores.find((s) => s.id === selectedStore)
                                ?.name || "Store"
                            : "All Stores"
                          : "Store"
                        : undefined
                    }
                  >
                    <Icon
                      icon="mdi:store-outline"
                      className={`${
                        isMobile ? "h-5 w-5" : isTablet ? "h-7 w-7" : "h-4 w-4"
                      } ${mode === "dark" ? "text-gray-200" : "text-blue-900"}`}
                    />
                    {/* Show text only on desktop */}
                    {!isMobile && !isTablet && (
                      <span className="text-sm truncate max-w-[120px]">
                        {stores.length > 0
                          ? selectedStore
                            ? stores.find((s) => s.id === selectedStore)
                                ?.name || "Store"
                            : "All Stores"
                          : "Store"}
                      </span>
                    )}
                    <Icon
                      icon={
                        storeDropdownOpen
                          ? "mdi:chevron-up"
                          : "mdi:chevron-down"
                      }
                      className={`${
                        isMobile ? "h-5 w-5" : isTablet ? "h-6 w-6" : "h-4 w-4"
                      } ${mode === "dark" ? "text-gray-200" : "text-gray-600"}`}
                    />
                  </button>
                  <div
                    className={`absolute left-0 mt-2 ${
                      isMobile ? "w-44" : isTablet ? "w-56" : "w-40"
                    } rounded-lg shadow-lg overflow-hidden transition-all duration-300 z-20
                    ${
                      mode === "dark"
                        ? "bg-gray-900 text-gray-100"
                        : "bg-white text-black"
                    }
                    ${
                      storeDropdownOpen
                        ? "max-h-60 opacity-100 scale-100"
                        : "max-h-0 opacity-0 scale-95"
                    }`}
                  >
                    <ul className="divide-y divide-gray-100">
                      {/* All Stores option */}
                      <li
                        key="all"
                        className={`${
                          isMobile
                            ? "px-3 py-2.5"
                            : isTablet
                              ? "px-4 py-3.5"
                              : "px-4 py-2"
                        } cursor-pointer transition-colors duration-200 ${
                          !selectedStore
                            ? "font-bold bg-gray-200 dark:bg-gray-800"
                            : ""
                        } ${
                          mode === "dark"
                            ? "hover:bg-gray-800 text-gray-100"
                            : "hover:bg-gray-50"
                        } ${isTablet ? "text-base" : "text-sm"}`}
                        onClick={() => {
                          setSelectedStore("");
                          localStorage.setItem("selected_store_id", "");
                          setStoreDropdownOpen(false);
                          console.log("Header: All Stores selected");
                        }}
                      >
                        All Stores
                      </li>
                      {/* Actual stores */}
                      {stores.length > 0 ? (
                        stores.map((store) => (
                          <li
                            key={store.id}
                            className={`${
                              isMobile
                                ? "px-3 py-2.5"
                                : isTablet
                                  ? "px-4 py-3.5"
                                  : "px-4 py-2"
                            } cursor-pointer transition-colors duration-200 ${
                              mode === "dark"
                                ? "hover:bg-gray-800 text-gray-100"
                                : "hover:bg-gray-50"
                            } ${
                              selectedStore === store.id
                                ? "font-bold bg-gray-200 dark:bg-gray-800"
                                : ""
                            } ${isTablet ? "text-base" : "text-sm"}`}
                            onClick={() => {
                              setSelectedStore(store.id);
                              setStoreDropdownOpen(false);
                              console.log(
                                "Header: Store selected:",
                                store.name,
                                store.id,
                              );
                            }}
                          >
                            {store.name}
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-2 text-gray-400">
                          No stores found
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Mobile: More Actions Dropdown (tablet doesn't need it anymore) */}
              {isMobile ? (
                <div className="relative" ref={moreActionsDropdownRef}>
                  <TooltipIconButton
                    label="More Actions"
                    mode={mode}
                    className={`select-none ${
                      isMobile
                        ? "px-2.5 py-2 min-h-[44px] min-w-[44px]"
                        : "px-3.5 py-3.5 min-h-[48px] min-w-[48px]"
                    } rounded-md hover:shadow-xl hover:-mt-1 active:scale-95 transition-all duration-500`}
                    onClick={() =>
                      setMoreActionsDropdownOpen(!moreActionsDropdownOpen)
                    }
                  >
                    <Icon
                      icon="mdi:dots-horizontal"
                      className={`${
                        isMobile ? "h-5 w-5" : "h-7 w-7"
                      } text-gray-500`}
                    />
                  </TooltipIconButton>

                  {moreActionsDropdownOpen && (
                    <div
                      className={`absolute top-full mt-2 right-0 ${
                        isTablet ? "w-64" : "w-56"
                      } rounded-xl shadow-lg z-20 ${
                        mode === "dark"
                          ? "bg-gray-900 text-gray-100"
                          : "bg-white/95 text-black"
                      } ${
                        isMobile ? "max-h-[70vh]" : "max-h-[80vh]"
                      } overflow-hidden`}
                    >
                      <div
                        className={`p-2 space-y-1 ${
                          isMobile
                            ? "max-h-[68vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent"
                            : ""
                        }`}
                      >
                        {/* Add New - Only for non-cashiers and only on mobile (tablet has it directly) */}
                        {isMobile && user?.role !== "cashier" && (
                          <>
                            {/* Most common Add New options for mobile */}
                            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                            <div className="px-2">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 uppercase tracking-wide">
                                Quick Add
                              </p>
                            </div>

                            {/* Product - Most common */}
                            <Link
                              href="/products?add=true"
                              onClick={() => setMoreActionsDropdownOpen(false)}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer min-h-[44px] ${
                                mode === "dark"
                                  ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                  : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                              }`}
                            >
                              <Icon
                                icon="mdi:package-variant"
                                className="h-5 w-5"
                              />
                              <span>Product</span>
                            </Link>

                            {/* Customer - Very common */}
                            <Link
                              href="/customers?add=true"
                              onClick={() => setMoreActionsDropdownOpen(false)}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer min-h-[44px] ${
                                mode === "dark"
                                  ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                  : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                              }`}
                            >
                              <Icon
                                icon="mdi:account-group-outline"
                                className="h-5 w-5"
                              />
                              <span>Customer</span>
                            </Link>

                            {/* Sale - Very common */}
                            <Link
                              href="/sales?add=true"
                              onClick={() => setMoreActionsDropdownOpen(false)}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer min-h-[44px] ${
                                mode === "dark"
                                  ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                  : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                              }`}
                            >
                              <Icon
                                icon="mdi:cart-arrow-up"
                                className="h-5 w-5"
                              />
                              <span>Sale</span>
                            </Link>

                            {/* Show more/less options toggle */}
                            <button
                              onClick={() =>
                                setShowAllAddOptions(!showAllAddOptions)
                              }
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer min-h-[44px] border-t border-gray-200 dark:border-gray-700 mt-2 pt-3 ${
                                mode === "dark"
                                  ? "text-blue-400 hover:text-blue-300 hover:bg-gray-800"
                                  : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              }`}
                            >
                              <Icon
                                icon={
                                  showAllAddOptions
                                    ? "mdi:chevron-up"
                                    : "mdi:chevron-down"
                                }
                                className="h-5 w-5"
                              />
                              <span>
                                {showAllAddOptions
                                  ? "Show Less"
                                  : "More Options..."}
                              </span>
                            </button>

                            {/* Additional Add New options - shown when expanded */}
                            {showAllAddOptions && (
                              <>
                                <Link
                                  href="/business-locations?add=true"
                                  onClick={() =>
                                    setMoreActionsDropdownOpen(false)
                                  }
                                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer min-h-[44px] ${
                                    mode === "dark"
                                      ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                      : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                                  }`}
                                >
                                  <Icon
                                    icon="mdi:store-outline"
                                    className="h-5 w-5"
                                  />
                                  <span>Store</span>
                                </Link>

                                <Link
                                  href="/category?add=true"
                                  onClick={() =>
                                    setMoreActionsDropdownOpen(false)
                                  }
                                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer min-h-[44px] ${
                                    mode === "dark"
                                      ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                      : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                                  }`}
                                >
                                  <Icon
                                    icon="mdi:folder-outline"
                                    className="h-5 w-5"
                                  />
                                  <span>Category</span>
                                </Link>

                                <Link
                                  href="/users?add=true"
                                  onClick={() =>
                                    setMoreActionsDropdownOpen(false)
                                  }
                                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer min-h-[44px] ${
                                    mode === "dark"
                                      ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                      : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                                  }`}
                                >
                                  <Icon
                                    icon="mdi:account-outline"
                                    className="h-5 w-5"
                                  />
                                  <span>User</span>
                                </Link>

                                <Link
                                  href="/suppliers?add=true"
                                  onClick={() =>
                                    setMoreActionsDropdownOpen(false)
                                  }
                                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer min-h-[44px] ${
                                    mode === "dark"
                                      ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                      : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                                  }`}
                                >
                                  <Icon
                                    icon="mdi:truck-outline"
                                    className="h-5 w-5"
                                  />
                                  <span>Supplier</span>
                                </Link>

                                <Link
                                  href="/purchases?add=true"
                                  onClick={() =>
                                    setMoreActionsDropdownOpen(false)
                                  }
                                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer min-h-[44px] ${
                                    mode === "dark"
                                      ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                      : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                                  }`}
                                >
                                  <Icon
                                    icon="mdi:cart-arrow-down"
                                    className="h-5 w-5"
                                  />
                                  <span>Purchase</span>
                                </Link>

                                <Link
                                  href="/expenses?add=true"
                                  onClick={() =>
                                    setMoreActionsDropdownOpen(false)
                                  }
                                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer min-h-[44px] ${
                                    mode === "dark"
                                      ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                      : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                                  }`}
                                >
                                  <Icon
                                    icon="mdi:cash-minus"
                                    className="h-5 w-5"
                                  />
                                  <span>Expense</span>
                                </Link>

                                <Link
                                  href="/stock-operations?add=true"
                                  onClick={() =>
                                    setMoreActionsDropdownOpen(false)
                                  }
                                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer min-h-[44px] ${
                                    mode === "dark"
                                      ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                      : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                                  }`}
                                >
                                  <Icon
                                    icon="mdi:bank-transfer"
                                    className="h-5 w-5"
                                  />
                                  <span>Transfer</span>
                                </Link>

                                <Link
                                  href="/sales-return?add=true"
                                  onClick={() =>
                                    setMoreActionsDropdownOpen(false)
                                  }
                                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer min-h-[44px] ${
                                    mode === "dark"
                                      ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                      : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                                  }`}
                                >
                                  <Icon
                                    icon="mdi:undo-variant"
                                    className="h-5 w-5"
                                  />
                                  <span>Return</span>
                                </Link>
                              </>
                            )}
                          </>
                        )}

                        {/* Divider */}
                        {isMobile && (
                          <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                        )}

                        {/* Messages - Mobile only (tablet has it in header) */}
                        {isMobile && (
                          <button
                            onClick={() => {
                              setMoreActionsDropdownOpen(false);
                              router.push("/messages");
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer min-h-[44px] relative ${
                              mode === "dark"
                                ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
                            }`}
                          >
                            <Icon icon="mdi:message-text" className="h-5 w-5" />
                            <span>Messages</span>
                            {unreadMessageCount > 0 && (
                              <div className="ml-auto bg-red-500 text-white text-xs h-4 w-4 rounded-full flex items-center justify-center font-bold">
                                {unreadMessageCount > 99
                                  ? "99+"
                                  : unreadMessageCount}
                              </div>
                            )}
                          </button>
                        )}

                        {/* Language Switch - Mobile only (tablet has it in header) */}
                        {isMobile && (
                          <div className="px-3 py-1">
                            <LanguageSwitch mode={mode} showLabel={true} />
                          </div>
                        )}

                        {/* Fullscreen Toggle - Only on mobile */}
                        {isMobile && (
                          <div className="px-3">
                            <FullscreenToggle mode={mode} showLabel={true} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : !isTablet ? (
                /* Desktop: All buttons visible */
                <>
                  {/* Add New dropdown - desktop - Only for non-cashiers */}
                  {user?.role !== "cashier" && (
                    <div
                      className="relative flex-shrink-0"
                      ref={addNewDropdownRef}
                    >
                      <button
                        className={`flex items-center justify-center gap-1 bg-blue-900 font-semibold text-white text-sm px-3 py-1.5 rounded-md hover:shadow-xl hover:-mt-1 transition-all duration-500`}
                        onClick={() => setAddNewDropdownOpen((prev) => !prev)}
                      >
                        <Icon
                          icon="icons8:plus"
                          className="h-3 w-3 text-white"
                        />
                        <span>Add New</span>
                      </button>
                      <div
                        className={`absolute right-0 mt-2 ${
                          isTablet ? "w-[500px]" : "w-[620px]"
                        } rounded-xl shadow-lg overflow-hidden transition-all duration-300 z-30
                          ${
                            mode === "dark"
                              ? "bg-gray-900 text-gray-100"
                              : "bg-white text-black"
                          }
                          ${
                            addNewDropdownOpen
                              ? "max-h-96 opacity-100 scale-100"
                              : "max-h-0 opacity-0 scale-95"
                          }`}
                      >
                        <div
                          className={`grid ${
                            isTablet ? "grid-cols-5" : "grid-cols-6"
                          } gap-2 p-3`}
                        >
                          {[
                            // Setup & Configuration (Most used for initial setup)
                            {
                              label: "Store",
                              icon: "mdi:store-outline",
                              href: "/business-locations?add=true",
                            },
                            {
                              label: "Category",
                              icon: "mdi:folder-outline",
                              href: "/category?add=true",
                            },
                            {
                              label: "Product",
                              icon: "mdi:package-variant",
                              href: "/products?add=true",
                            },

                            // People & Relationships
                            {
                              label: "User",
                              icon: "mdi:account-outline",
                              href: "/users?add=true",
                            },
                            {
                              label: "Customer",
                              icon: "mdi:account-group-outline",
                              href: "/customers?add=true",
                            },
                            {
                              label: "Supplier",
                              icon: "mdi:truck-outline",
                              href: "/suppliers?add=true",
                            },

                            // Core Business Operations (Most frequently used)
                            {
                              label: "Sale",
                              icon: "mdi:cart-arrow-up",
                              href: "/sales?add=true",
                            },
                            {
                              label: "Purchase",
                              icon: "mdi:cart-arrow-down",
                              href: "/purchases?add=true",
                            },
                            {
                              label: "Expense",
                              icon: "mdi:cash-minus",
                              href: "/expenses?add=true",
                            },

                            // Inventory Management
                            {
                              label: "Transfer",
                              icon: "mdi:bank-transfer",
                              href: "/stock-operations?add=true",
                            },
                            {
                              label: "Return",
                              icon: "mdi:undo-variant",
                              href: "/sales-return?add=true",
                            },
                          ].map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              className={`flex flex-col items-center justify-center rounded-lg p-2 text-xs font-medium shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 border ${
                                mode === "dark"
                                  ? "bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700"
                                  : "bg-white border-gray-200 hover:bg-orange-50"
                              } hover:border-orange-400`}
                              tabIndex={0}
                              onClick={() => setAddNewDropdownOpen(false)}
                            >
                              <span
                                className={`flex items-center justify-center h-8 w-8 rounded-full mb-1 ${
                                  mode === "dark"
                                    ? "bg-gray-900 hover:bg-gray-700"
                                    : "bg-gray-100 hover:bg-orange-50"
                                } transition-all duration-200`}
                              >
                                <Icon
                                  icon={item.icon}
                                  className="h-5 w-5 text-blue-950"
                                />
                              </span>
                              <span className="text-xs">{item.label}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* POS button - desktop */}
                  <Link
                    href="/pos/"
                    className="flex items-center justify-center gap-1 bg-blue-900 font-semibold text-white text-sm px-3 py-1.5 rounded-md hover:shadow-xl hover:-mt-1 transition-all duration-500 flex-shrink-0"
                  >
                    <Icon
                      icon="akar-icons:laptop-device"
                      className="h-3 w-3 text-white"
                    />
                    <span>POS</span>
                  </Link>

                  {/* Language and notification buttons - desktop */}
                  <div className="flex items-center gap-2">
                    <LanguageSwitch mode={mode} />
                    {/* Notification Button - Only for non-cashiers */}
                    {user?.role !== "cashier" && (
                      <NotificationButton mode={mode} user={user} />
                    )}
                    {/* Messages - desktop */}
                    <TooltipIconButton
                      label="Messages"
                      mode={mode}
                      className="bg-white/50 relative"
                      onClick={() => router.push("/messages")}
                    >
                      <Icon
                        icon="mdi:message-text"
                        className="h-6 w-6 text-gray-500"
                      />
                      {unreadMessageCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center font-bold">
                          {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                        </div>
                      )}
                    </TooltipIconButton>
                  </div>

                  {/* Theme toggle - desktop */}
                  <TooltipIconButton
                    label={
                      <span
                        className={
                          mode === "dark" ? "text-white" : "text-black"
                        }
                      >
                        {mode === "dark"
                          ? "Switch to Light Mode"
                          : "Switch to Dark Mode"}
                      </span>
                    }
                    onClick={toggleMode}
                    mode={mode}
                    className="bg-white/50"
                  >
                    <Icon
                      icon={
                        mode === "dark"
                          ? "line-md:sunny-filled-loop-to-moon-filled-alt-loop-transition"
                          : "line-md:moon-alt-to-sunny-outline-loop-transition"
                      }
                      className="h-6 w-6 text-yellow-500"
                    />
                  </TooltipIconButton>

                  {/* Fullscreen toggle - desktop */}
                  <FullscreenToggle mode={mode} />
                </>
              ) : null}

              {/* Search component with controlled visibility */}
              <Search
                mode={mode}
                onSearchModalToggle={onSearchModalToggle}
                user={user}
                isOpen={isSearchOpen}
                onToggle={setIsSearchOpen}
              />

              {/* Profile dropdown - always visible */}
              <TooltipIconButton
                label={
                  <span
                    className={mode === "dark" ? "text-white" : "text-black"}
                  >
                    {dropdownOpen ? "Close Profile" : "Open Profile"}
                  </span>
                }
                mode={mode}
                className="bg-white/50"
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
                        isMobile ? "w-64" : isTablet ? "w-72" : "w-80"
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
                                      : "text-md"
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
                            className={`flex items-center w-full gap-2 ${
                              isTablet ? "text-base" : "text-sm"
                            } transition-all cursor-pointer ${
                              mode === "dark"
                                ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                                : "text-gray-500 hover:text-blue-800"
                            }`}
                          >
                            <Icon
                              icon="solar:user-linear"
                              className={`${isTablet ? "h-6 w-6" : "h-5 w-5"}`}
                            />
                            <span className="">Profile</span>
                          </li>
                        </ul>

                        <button
                          onClick={onLogout}
                          className={`flex items-center w-full gap-2 border-t ${
                            isTablet ? "h-12" : "h-10"
                          } font-thin ${
                            isTablet ? "text-base" : "text-sm"
                          } transition-colors rounded-lg p-2
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
      <div
        className={`${
          (isMobile || isTablet) && !isHeaderVisible
            ? "h-0"
            : isMobile
              ? "h-[60px]"
              : isTablet
                ? "h-[68px]"
                : "h-[72px]"
        }`}
        aria-hidden="true"
      ></div>
    </>
  );
};

export default Header;
