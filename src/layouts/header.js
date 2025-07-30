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
  const addNewDropdownRef = useRef(null);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");

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
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(e.target)) {
        setStoreDropdownOpen(false);
      }
      if (addNewDropdownRef.current && !addNewDropdownRef.current.contains(e.target)) {
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

  useEffect(() => {
    // Fetch stores on mount
    const fetchStores = async () => {
      try {
        const res = await fetch('/api/stores');
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          setStores(data.data);
          // Try to load last used store from localStorage
          const last = localStorage.getItem('selected_store_id');
          if (last && data.data.find(s => s.id === last)) {
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

  // Persist selected store
  useEffect(() => {
    if (selectedStore) {
      localStorage.setItem('selected_store_id', selectedStore);
    }
  }, [selectedStore]);

    const isMobile = windowWidth !== null && windowWidth < 640;

  return (
    <>
      {/* Floating toggle button for mobile when header is hidden */}
      {isMobile && !isHeaderVisible && (
        <button
          onClick={toggleHeader}
          className={`fixed top-2 right-2 z-50 p-2 rounded-full shadow-lg transition-all duration-300 ${
            mode === "dark" 
              ? "bg-gray-800 text-white hover:bg-gray-700" 
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
          title="Show Header"
        >
          <Icon icon="mdi:menu" className="w-5 h-5" />
        </button>
      )}

      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-10 transition-all duration-300 ${
          mode === "dark" ? "bg-[#101827]" : "bg-transparent"
        } ${
          isMobile && !isHeaderVisible ? "-translate-y-full" : ""
        }`}
      >
        <div
          className={`
            ${isMobile ? "p-1 m-1" : "p-2 m-4"} transition-transform duration-300
            ${
              isMobile
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
            <div className="flex items-center w-full gap-2">
              {/* Sidebar toggle button: always visible */}
              <button
                onClick={toggleSidebar}
                className="text-gray-500 hover:scale-110 transition-transform md:inline-flex mr-2 flex-shrink-0"
                title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                aria-label={
                  isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"
                }
              >
                <Icon
                  icon={
                    isSidebarOpen ? "dashicons:arrow-left-alt" : "ri:menu-line"
                  }
                  className={`${isMobile ? "w-5 h-5" : "w-6 h-6"}`}
                />
              </button>
              
              {/* Search component - responsive */}
              <div className="flex-grow min-w-0">
                <Search
                  mode={mode}
                  onSearchModalToggle={onSearchModalToggle}
                  user={user}
                />
              </div>
            </div>

            <div className={`flex justify-center items-center w-full ${isMobile ? "gap-1" : "gap-2"}`}>
              {/* Store dropdown - responsive */}
              <div className="relative flex-shrink-0" ref={storeDropdownRef}>
                <button
                  className={`flex items-center gap-1 ${isMobile ? "text-xs px-1.5 py-1" : "text-sm px-3 py-1.5"} rounded-md hover:shadow-md transition-all duration-300
                    ${
                      mode === "dark"
                        ? "bg-gray-800 text-gray-100 hover:bg-gray-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  onClick={() => setStoreDropdownOpen((prev) => !prev)}
                >
                  <Icon
                    icon="mdi:store-outline"
                    className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} ${
                      mode === "dark" ? "text-gray-200" : ""
                    }`}
                  />
                  <span className={`${isMobile ? "hidden sm:inline" : ""}`}>
                    {stores.length > 0
                      ? selectedStore
                        ? stores.find(s => s.id === selectedStore)?.name || "Select Store"
                        : "All Stores"
                      : "Select Store"}
                  </span>
                  <Icon
                    icon={
                      storeDropdownOpen ? "mdi:chevron-up" : "mdi:chevron-down"
                    }
                    className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} ${
                      mode === "dark" ? "text-gray-200" : ""
                    }`}
                  />
                </button>
                <div
                  className={`absolute left-0 mt-2 w-40 rounded-lg shadow-lg overflow-hidden transition-all duration-300 z-20
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
                      className={`px-4 py-2 cursor-pointer ${!selectedStore ? 'font-bold bg-gray-200 dark:bg-gray-800' : ''}`}
                      onClick={() => {
                        setSelectedStore("");
                        localStorage.setItem('selected_store_id', "");
                        setStoreDropdownOpen(false);
                        console.log('Header: All Stores selected');
                      }}
                    >
                      All Stores
                    </li>
                    {/* Actual stores */}
                    {stores.length > 0 ? (
                      stores.map(store => (
                        <li
                          key={store.id}
                          className={`px-4 py-2 cursor-pointer ${
                            mode === "dark"
                              ? "hover:bg-gray-800 text-gray-100"
                              : "hover:bg-gray-50"
                          } ${selectedStore === store.id ? 'font-bold bg-gray-200 dark:bg-gray-800' : ''}`}
                          onClick={() => {
                            setSelectedStore(store.id);
                            setStoreDropdownOpen(false);
                            console.log('Header: Store selected:', store.name, store.id);
                          }}
                        >
                          {store.name}
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-2 text-gray-400">No stores found</li>
                    )}
                  </ul>
                </div>
              </div>
              {/* Add New dropdown - responsive */}
              <div className="relative flex-shrink-0" ref={addNewDropdownRef}>
                <button
                  className={`flex items-center justify-center gap-1 bg-blue-900 font-semibold text-white ${isMobile ? "text-xs px-1.5 py-1" : "text-sm px-3 py-1.5"} rounded-md hover:shadow-xl hover:-mt-1 transition-all duration-500`}
                  onClick={() => setAddNewDropdownOpen((prev) => !prev)}
                >
                  <Icon icon="icons8:plus" className={`${isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} text-white`} />
                  <span className={`${isMobile ? "hidden sm:inline" : ""}`}>Add New</span>
                </button>
                <div
                  className={`absolute right-0 mt-2 ${isMobile ? "w-[280px]" : "w-[620px]"} rounded-xl shadow-lg overflow-hidden transition-all duration-300 z-30
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
                  <div className={`grid ${isMobile ? "grid-cols-3" : "grid-cols-6"} gap-2 p-3`}>
                    {[
                      { label: "Category", icon: "mdi:folder-outline", href: "/category" },
                      { label: "Product", icon: "mdi:package-variant", href: "/products" },
                      { label: "Purchase", icon: "mdi:cart-arrow-down", href: "/purchases" },
                      { label: "Sale", icon: "mdi:cart-arrow-up", href: "/sales" },
                      { label: "Expense", icon: "mdi:cash-minus", href: "/expenses" },
                      { label: "Return", icon: "mdi:undo-variant", href: "/sales-return" },
                      { label: "User", icon: "mdi:account-outline", href: "/users" },
                      { label: "Customer", icon: "mdi:account-group-outline", href: "/customers" },
                      { label: "Supplier", icon: "mdi:truck-outline", href: "/suppliers" },
                      { label: "Transfer", icon: "mdi:bank-transfer", href: "/stock-operations" },
                      { label: "Store", icon: "mdi:store-outline", href: "/business-locations" },
                    ].map((item) => (
                      <Link key={item.label} href={item.href} legacyBehavior passHref>
                        <a
                          className={`flex flex-col items-center justify-center rounded-lg ${isMobile ? "p-1" : "p-2"} text-xs font-medium shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 border ${
                            mode === "dark"
                              ? "bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700"
                              : "bg-white border-gray-200 hover:bg-orange-50"
                          } hover:border-orange-400`}
                          tabIndex={0}
                          onClick={() => setAddNewDropdownOpen(false)}
                        >
                          <span
                            className={`flex items-center justify-center ${isMobile ? "h-6 w-6" : "h-8 w-8"} rounded-full ${isMobile ? "mb-0.5" : "mb-1"} ${
                              mode === "dark"
                                ? "bg-gray-900 hover:bg-gray-700"
                                : "bg-gray-100 hover:bg-orange-50"
                            } transition-all duration-200`}
                          >
                            <Icon
                              icon={item.icon}
                              className={`${isMobile ? "h-3 w-3" : "h-5 w-5"} ${mode === "dark" ? "text-orange-300" : "text-blue-950"}`}
                            />
                          </span>
                          <span className={`${isMobile ? "text-[10px]" : "text-xs"} ${mode === "dark" ? "text-gray-100" : ""}`}>{item.label}</span>
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* POS button - responsive */}
              <Link href="/pos/" className="flex-shrink-0">
                <button className={`flex items-center justify-center gap-1 bg-blue-900 font-semibold text-white ${isMobile ? "text-xs px-1.5 py-1" : "text-sm px-3 py-1.5"} rounded-md hover:shadow-xl hover:-mt-1 transition-all duration-500`}>
                  <Icon
                    icon="akar-icons:laptop-device"
                    className={`${isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} text-white`}
                  />
                  <span className={`${isMobile ? "hidden sm:inline" : ""}`}>POS</span>
                </button>
              </Link>

              {/* Language and notification buttons - responsive */}
              <div className={`flex items-center ${isMobile ? "gap-1" : "gap-2"}`}>
                <LanguageSwitch mode={mode} />

                <NotificationButton mode={mode} user={user} />
              </div>

              {/* Theme toggle - responsive */}
              <TooltipIconButton
                label={
                  <span
                    className={mode === "dark" ? "text-white" : "text-black"}
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
                  className={`${isMobile ? "h-5 w-5" : "h-6 w-6"} ${
                    mode === "dark" ? "text-blue-900" : "text-yellow-500"
                  }`}
                />
              </TooltipIconButton>

              {/* Fullscreen toggle - responsive */}
              <FullscreenToggle mode={mode} />

              {/* Profile dropdown - responsive */}
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
                    <div className={`overflow-hidden rounded-full ${isMobile ? "w-5 h-5" : "w-6 h-6"}`}>
                      {user && user.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.name || "User"} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon icon="hugeicons:ai-user" className={`${isMobile ? "h-5 w-5" : "h-6 w-6"}`} />
                      )}
                    </div>
                  </div>

                  {dropdownOpen && (
                    <div
                      className={`absolute top-full mt-2 right-0 ${isMobile ? "w-64" : "w-80"} rounded-2xl shadow-lg z-10 ${
                        mode === "dark"
                          ? "bg-gray-900 text-gray-100"
                          : "bg-white/95 text-black"
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-2 w-full">
                          <div className={`overflow-hidden flex-shrink-0 rounded-full ${isMobile ? "w-5 h-5" : "w-6 h-6"}`}>
                            {user && user.avatar_url ? (
                              <img 
                                src={user.avatar_url} 
                                alt={user.name || "User"} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Icon
                                icon="hugeicons:ai-user"
                                className={`${isMobile ? "h-5 w-5" : "h-6 w-6"}`}
                              />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className={`flex ${isMobile ? "flex-col gap-1" : "gap-2"}`}>
                              <span className={`${isMobile ? "text-sm" : "text-md"} font-semibold truncate ${
                                mode === "dark" ? "text-white" : "text-black"
                              }`}>
                                {user.name}
                              </span>
                              <span className={`rounded-md capitalize px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                mode === "dark" 
                                  ? "bg-green-900/30 text-green-300 ring-green-600/30" 
                                  : "bg-green-50 text-green-700 ring-green-600/20"
                              }`}>
                                {user.role}
                              </span>
                            </div>
                            <span className={`text-xs truncate ${
                              mode === "dark" ? "text-gray-300" : "text-gray-600"
                            }`}>{user.agencyName}</span>
                          </div>
                        </div>
                        <ul className="py-4 space-y-2">
                          <li
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/profile');
                            }}
                            className={`flex items-center w-full gap-2 text-sm transition-all cursor-pointer ${
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

                        </ul>

                        <button
                          onClick={onLogout}
                          className={`flex items-center w-full gap-2 border-t h-10 font-thin text-sm transition-colors rounded-lg p-2
                            ${
                              mode === "dark"
                                ? "text-red-400 hover:text-red-300 hover:bg-gray-800 border-gray-700"
                                : "text-red-500 hover:text-red-600 hover:bg-gray-100 border-gray-200"
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
      <div className={`${isMobile && !isHeaderVisible ? "h-0" : isMobile ? "h-[60px]" : "h-[72px]"}`} aria-hidden="true"></div>
    </>
  );
};

export default Header;
