import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import FullscreenToggle from "@/components/FullscreenToggle";
import TooltipIconButton from "@/components/TooltipIconButton";
import LanguageSwitch from "@/components/LanguageSwitch";

const PosHeader = ({
  mode,
  toggleMode,
  onLogout,
  user,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(null);
  const dropdownRef = useRef(null);
  const headerRef = useRef(null);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const storeDropdownRef = useRef(null);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifDropdownRef = useRef(null);
  const [addNewDropdownOpen, setAddNewDropdownOpen] = useState(false);
  const addNewDropdownRef = useRef(null);

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
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(e.target)) {
        setStoreDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
      if (addNewDropdownRef.current && !addNewDropdownRef.current.contains(e.target)) {
        setAddNewDropdownOpen(false);
      }
    };
    if (storeDropdownOpen || notifDropdownOpen || addNewDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [storeDropdownOpen, notifDropdownOpen, addNewDropdownOpen]);


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
            <div className="flex items-center w-full gap-2">
              <button className="flex items-center justify-center gap-2 bg-blue-950 font-semibold text-white text-sm px-3 py-1.5 rounded-md hover:shadow-xl hover:-mt-1 transition-all duration-500">
                <Icon
                  icon="akar-icons:laptop-device"
                  className={`h-3 w-3 text-white`}
                />
                Back to Dashboard
              </button>
            </div>

            <div className="flex justify-center items-center w-full gap-4">
              <TooltipIconButton
                label="Calculator"
                mode={mode}
                className="px-1 py-1 rounded-md hover:shadow-xl hover:-mt-1 transition-all duration-500"
              >
                <Icon
                  icon="solar:calculator-broken"
                  className="h-7 w-7 text-gray-500"
                />
              </TooltipIconButton>

              <TooltipIconButton
                label="Cash Register"
                mode={mode}
                className="px-1 py-1 rounded-md hover:shadow-xl hover:-mt-1 transition-all duration-500"
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
              >
                <Icon
                  icon="lets-icons:print-light"
                  className="h-7 w-7 text-gray-500"
                />
              </TooltipIconButton>

              <TooltipIconButton
                label="Today's Sales"
                mode={mode}
                className="px-1 py-1 rounded-md hover:shadow-xl hover:-mt-1 transition-all duration-500"
              >
                <Icon icon="mdi:cart-sale" className="h-7 w-7 text-gray-500" />
              </TooltipIconButton>

              <TooltipIconButton
                label="Today's Profit"
                mode={mode}
                className="px-1 py-1 rounded-md hover:shadow-xl hover:-mt-1 transition-all duration-500"
              >
                <Icon
                  icon="hugeicons:chart-increase"
                  className="h-7 w-7 text-gray-500"
                />
              </TooltipIconButton>

              <LanguageSwitch mode={mode} />

              <div className="relative" ref={notifDropdownRef}>
                <button
                  className="flex items-center justify-center p-2 rounded-full bg-white/50 hover:-mt-1 transition-all duration-500 relative"
                  onClick={() => setNotifDropdownOpen((prev) => !prev)}
                  aria-label="Notifications"
                >
                  <Icon
                    icon="mdi:bell-outline"
                    className="h-5 w-5 text-gray-600"
                  />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    3
                  </span>
                </button>
                <div
                  className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg overflow-hidden transition-all duration-300 z-20
                    ${
                      mode === "dark"
                        ? "bg-gray-900 text-gray-100"
                        : "bg-white text-black"
                    }
                    ${
                      notifDropdownOpen
                        ? "max-h-60 opacity-100 scale-100"
                        : "max-h-0 opacity-0 scale-95"
                    }`}
                >
                  <ul className="divide-y divide-gray-100">
                    <li
                      className={`px-4 py-3 cursor-pointer flex items-center gap-2 ${
                        mode === "dark"
                          ? "hover:bg-gray-800 text-gray-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <Icon
                        icon="mdi:cart-arrow-down"
                        className="h-4 w-4 text-blue-500"
                      />
                      <span>New order received</span>
                    </li>
                    <li
                      className={`px-4 py-3 cursor-pointer flex items-center gap-2 ${
                        mode === "dark"
                          ? "hover:bg-gray-800 text-gray-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <Icon
                        icon="mdi:alert-outline"
                        className="h-4 w-4 text-orange-500"
                      />
                      <span>Stock running low</span>
                    </li>
                    <li
                      className={`px-4 py-3 cursor-pointer flex items-center gap-2 ${
                        mode === "dark"
                          ? "hover:bg-gray-800 text-gray-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <Icon
                        icon="mdi:email-outline"
                        className="h-4 w-4 text-green-500"
                      />
                      <span>New message from admin</span>
                    </li>
                  </ul>
                </div>
              </div>

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
    </>
  );
};

export default PosHeader;
