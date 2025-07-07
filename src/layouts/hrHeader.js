import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import Search from "@/components/Search";
import FullscreenToggle from "@/components/FullscreenToggle";
import TooltipIconButton from "@/components/TooltipIconButton";
import LanguageSwitch from "@/components/LanguageSwitch";
import NotificationButton from "@/components/NotificationButton";
import Link from "next/link";

const HrHeader = ({
  mode,
  toggleMode,
  isSidebarOpen,
  toggleSidebar,
  onLogout,
  user,
  onSearchModalToggle,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(null);
  const dropdownRef = useRef(null);
  const headerRef = useRef(null);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const storeDropdownRef = useRef(null);
  const [addNewDropdownOpen, setAddNewDropdownOpen] = useState(false);
  const addNewDropdownRef = useRef(null);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);

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
          const found = data.data.find(s => s.id === last);
          setSelectedStore(found ? found.id : data.data[0].id);
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
                className="text-gray-500 hover:scale-110 transition-transform md:inline-flex mr-2"
                title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                aria-label={
                  isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"
                }
              >
                <Icon
                  icon={
                    isSidebarOpen ? "dashicons:arrow-left-alt" : "ri:menu-line"
                  }
                  className="w-6 h-6"
                />
              </button>
              {/* End sidebar toggle button */}
              <div className="flex-grow">
                <Search
                  mode={mode}
                  onSearchModalToggle={onSearchModalToggle}
                  user={user}
                />
              </div>
            </div>

            <div className="flex justify-center items-center w-full gap-2">
              <div className="relative" ref={storeDropdownRef}>
                <button
                  className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md hover:shadow-md transition-all duration-300
                    ${
                      mode === "dark"
                        ? "bg-gray-800 text-gray-100 hover:bg-gray-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  onClick={() => setStoreDropdownOpen((prev) => !prev)}
                >
                  <Icon
                    icon="mdi:store-outline"
                    className={`h-4 w-4 ${
                      mode === "dark" ? "text-gray-200" : ""
                    }`}
                  />
                  {stores.length > 0 && selectedStore
                    ? stores.find(s => s.id === selectedStore)?.name || "Select Store"
                    : "Select Store"}
                  <Icon
                    icon={
                      storeDropdownOpen ? "mdi:chevron-up" : "mdi:chevron-down"
                    }
                    className={`h-4 w-4 ${
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
              <div className="relative" ref={addNewDropdownRef}>
                <button
                  className="flex items-center justify-center gap-2 bg-orange-400 font-semibold text-white text-sm px-3 py-1.5 rounded-md hover:shadow-xl hover:-mt-1 transition-all duration-500"
                  onClick={() => setAddNewDropdownOpen((prev) => !prev)}
                >
                  <Icon icon="icons8:plus" className={`h-3 w-3 text-white`} />
                  Add New
                </button>
                <div
                  className={`absolute right-0 mt-2 w-[620px] rounded-xl shadow-lg overflow-hidden transition-all duration-300 z-30
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
                  <div className="grid grid-cols-6 gap-3 p-4">
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
                      { label: "Transfer", icon: "mdi:bank-transfer", href: "/stock-transfer" },
                      { label: "Store", icon: "mdi:store-outline", href: "/stores" },
                    ].map((item) => (
                      <Link key={item.label} href={item.href} legacyBehavior passHref>
                        <a className="flex flex-col items-center justify-center rounded-lg p-2 text-xs font-medium shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
                          tabIndex={0}
                          onClick={() => setAddNewDropdownOpen(false)}
                        >
                          <span
                            className={`flex items-center justify-center h-8 w-8 rounded-full mb-1
                              ${
                                mode === "dark"
                                  ? "bg-gray-900 hover:bg-gray-700"
                                  : "bg-gray-100 hover:bg-orange-50"
                              } transition-all duration-200`}
                          >
                            <Icon
                              icon={item.icon}
                              className={`h-5 w-5 ${
                                mode === "dark"
                                  ? "text-orange-300"
                                  : "text-blue-950"
                              }`}
                            />
                          </span>
                          <span className={mode === "dark" ? "text-gray-100" : ""}>
                            {item.label}
                          </span>
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              
              <Link href="/pos/">
                <button className="flex items-center justify-center gap-2 bg-blue-950 font-semibold text-white text-sm px-3 py-1.5 rounded-md hover:shadow-xl hover:-mt-1 transition-all duration-500">
                  <Icon
                    icon="akar-icons:laptop-device"
                    className={`h-3 w-3 text-white`}
                  />
                  POS
                </button>
              </Link>

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
                className="bg-white/50"
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
                className="bg-white/50"
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
    </>
  );
};

export default HrHeader;
