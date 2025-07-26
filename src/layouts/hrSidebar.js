import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";
import { sidebarNav, getFilteredNav } from "@/data/nav";

const HrSidebar = ({
  mode,
  toggleMode,
  onLogout,
  user,
  isOpen,
  toggleSidebar,
  disableRouter = false,
}) => {
  const [windowWidth, setWindowWidth] = useState(null);
  const router = !disableRouter ? useRouter() : null;
  const sidebarRef = useRef(null);
  const [showLogout, setShowLogout] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedItems, setExpandedItems] = useState({});

  const filteredNav = getFilteredNav(user?.job_type);

  useEffect(() => {
    if (
      filteredNav &&
      filteredNav.length > 0 &&
      Object.keys(expandedCategories).length === 0
    ) {
      // Find the active category (the one containing the active route)
      let activeCategory = null;
      if (router) {
        for (const entry of filteredNav) {
          if (!entry.items) continue; // skip standalone items
          if (entry.items.some(({ href }) => href.split('?')[0] === router.pathname)) {
            activeCategory = entry.category;
            break;
          }
        }
      }
      const expanded = {};
      if (activeCategory) {
        expanded[activeCategory] = true;
      }
      setExpandedCategories(expanded);
    }
  }, [filteredNav]);

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => {
      const isExpanding = !prev[category];
      // Collapse all, then expand only the clicked one if expanding
      return isExpanding ? { [category]: true } : {};
    });
  };

  const toggleItem = (href) => {
    setExpandedItems((prev) => {
      const isExpanding = !prev[href];
      // Collapse all, then expand only the clicked one if expanding
      return isExpanding ? { [href]: true } : {};
    });
  };

  const setActiveItemRef = useCallback((element) => {
    if (element && router) {
      const href = element.getAttribute('data-href');
      if (href && href.split('?')[0] === router.pathname) {
        setTimeout(() => {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 200);
      }
    }
  }, [router && router.pathname]);

  const handleResize = useCallback(() => {
    setWindowWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  const isActive = (href) => {
    if (!router) return "";
    const pathname = href.split('?')[0];
    return router.pathname === pathname
      ? "bg-orange-100 text-blue-900 shadow-md"
      : "text-gray-700 hover:bg-gray-100";
  };

  const isSubItemActive = (href) => {
    if (!router) return "";
    const pathname = href.split('?')[0];
    return router.pathname === pathname
      ? "bg-orange-50 text-blue-800 shadow-sm ml-0"
      : "text-gray-600 hover:bg-gray-50 ml-0";
  };

  const handleNavigation = async (href, label) => {
    if (!router) return;
    try {
      console.log(
        "[HrSidebar] Navigating to:",
        href,
        "Label:",
        typeof label === "function" ? label(user?.job_type) : label
      );
      await router.push(href);
    } catch (error) {
      console.error("[HrSidebar] Navigation error:", error);
    }
  };

  // Add this handler to expand sidebar on hover/click of category
  const handleCategoryInteraction = (category) => {
    if (!isOpen && !isMobile) {
      toggleSidebar();
      // Optionally, you can also expand the clicked category after expanding
      setTimeout(() => toggleCategory(category), 200);
    } else {
      toggleCategory(category);
    }
  };

  if (windowWidth === null) return null;

  const isMobile = windowWidth < 640;

  return (
    <div className="relative z-[20]">
      <div
        ref={sidebarRef}
        className={`fixed left-0 top-0 z-50 rounded-xl m-0 md:m-3 transition-all duration-300
          ${isMobile ? "block" : "block"}
          ${mode === "dark" ? "" : "bg-white"}
          group shadow-lg shadow-black/20 custom-scrollbar
        `}
        style={{
          width: isMobile ? "100vw" : isOpen ? "240px" : "64px",
          height: isMobile ? "100vh" : "calc(100vh - 24px)",
        }}
      >
        <div className="flex flex-col h-full relative">
          <div
            className={`flex items-center justify-center ${
              !isOpen && !isMobile ? "justify-center" : "justify-center"
            } py-4 px-4 shadow-sm bg-blue-900 rounded-t-md`}
          >
            <div className="flex items-center gap-2 ">
              <p
                className={`text-xl font-bold transition-all duration-300 ${
                  mode === "dark" ? "text-white" : "text-white"
                }`}
              >
                {!isOpen && !isMobile ? "R" : "RichUncle Outlook"}
              </p>
            </div>
          </div>

          <div
            className={`flex-grow px-2 overflow-y-auto flex flex-col scrollbar-thin ${
              !isOpen && !isMobile ? "items-center" : ""
            }`}
          >
            {/* Render standalone nav items (e.g., Home) */}
            {filteredNav
              .filter(entry => !entry.items)
              .map((item) => (
                <div
                  key={item.href}
                  className={`flex items-center gap-2 px-2 mt-4 pt-4 pb-4 mb-2 rounded-lg font-bold text-gray-500 text-sm tracking-wide cursor-pointer transition-all duration-300 hover:bg-orange-50 ${
                    mode === "dark" ? "bg-white/10 text-gray-200 hover:bg-white/20" : "bg-white"
                  } ${!isOpen && !isMobile ? "justify-center" : ""}`}
                  onClick={() => handleNavigation(item.href, item.label)}
                >
                  {item.icon && (
                    <Icon
                      icon={item.icon}
                      className={`${item.href === '/dashboard' ? 'h-7 w-7' : 'h-5 w-5'} text-gray-500 transition-all duration-300 ${!isOpen && !isMobile ? "mx-auto" : "mr-2"}`}
                    />
                  )}
                  <span
                    className={`transition-all duration-300${!isOpen && !isMobile ? " hidden" : ""}`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            {/* Render categories */}
            {filteredNav
              .filter(entry => entry.items)
              .map(({ category, items, icon }, index) => (
                <div
                  key={category}
                  className={`w-full mb-1 relative ${
                    !isOpen && !isMobile ? "flex flex-col items-center" : ""
                  }`}
                >
                  {index !== 0 && <div className="my-2" />}
                  <div
                    className={`flex items-center justify-between text-sm tracking-wide font-medium text-gray-600 px-2 py-3 cursor-pointer transition-all duration-300 rounded-lg hover:bg-orange-50 hover:shadow-sm ${
                      !isOpen && !isMobile ? "justify-center" : ""
                    }`}
                    onClick={() => handleCategoryInteraction(category)}
                    onMouseEnter={() => { if (!isOpen && !isMobile) toggleSidebar(); }}
                  >
                    <span className={`flex items-center gap-2 transition-all duration-300 capitalize`}>
                      {icon && (
                        <Icon
                          icon={icon}
                          className={`h-5 w-5 text-gray-500 transition-all duration-300 ${
                            !isOpen && !isMobile ? "mx-auto" : "mr-2"
                          }`}
                        />
                      )}
                      <span
                        className={`transition-all duration-300${!isOpen && !isMobile ? " hidden" : ""}`}
                      >
                        {category}
                      </span>
                    </span>
                    <Icon
                      icon={
                        expandedCategories[category]
                          ? "mdi:chevron-down"
                          : "mdi:chevron-right"
                      }
                      className={`w-4 h-4 transition-transform duration-200 ${
                        mode === "dark" ? "text-white" : "text-gray-400"
                      }`}
                    />
                  </div>
                  {/* Vertical line for category items */}
                  {expandedCategories[category] && (
                    <div className="absolute left-4 top-12 h-[calc(100%-3.5rem)] w-px bg-gray-300 z-0 transition-all duration-500" />
                  )}
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      expandedCategories[category]
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                     style={{ transitionProperty: 'max-height, opacity', transitionDuration: '500ms' }}
                  >
                    <ul
                      className={`pl-8 pt-2 flex flex-col relative z-10`}
                    >
                      {Array.isArray(items) && items.length > 0 ? (
                        items.map(({ href, icon, label, subItems }) => {
                          const isActiveItem = isActive(href);
                          const hasSubItems = subItems && subItems.length > 0;
                          const isExpanded = expandedItems[href];

                          // Intercept Retrieve Layaways/Orders
                          const isRetrieveLayaways = !href && label === 'Retrieve Layaways';
                          const isRetrieveOrders = !href && label === 'Retrive Orders';

                          return (
                            <li key={href + label} className="px-2 pl-2">
                              <div
                                ref={setActiveItemRef}
                                data-href={href}
                                onClick={() => {
                                  if (isRetrieveLayaways) {
                                    window.dispatchEvent(new CustomEvent('open-retrieve-layaways-modal'));
                                    return;
                                  }
                                  if (isRetrieveOrders) {
                                    window.dispatchEvent(new CustomEvent('open-retrieve-orders-modal'));
                                    return;
                                  }
                                  if (hasSubItems) {
                                    toggleItem(href);
                                  } else {
                                    handleNavigation(href, label);
                                  }
                                }}
                                className={`relative py-2 px-2 flex items-center justify-between font-medium text-sm w-full text-gray-700 cursor-pointer rounded-lg hover:shadow-md transition-all duration-200 group mb-1 ${isActiveItem} ${
                                  !isOpen && !isMobile ? "justify-center" : ""
                                } ${
                                  mode === "dark"
                                    ? "bg-white/10 text-gray-200 hover:bg-white/20"
                                    : ""
                                }`}
                              >
                                <div
                                  className={`flex items-center ${
                                    !isOpen && !isMobile
                                      ? "justify-center w-full"
                                      : ""
                                  }`}
                                >
                                  <span
                                    className={`text-sm transition-all duration-300 ${
                                      !isOpen && !isMobile
                                        ? "opacity-0 w-0 overflow-hidden"
                                        : ""
                                    } ${mode === "dark" ? "text-gray-100" : ""}`}
                                  >
                                    {typeof label === "function"
                                      ? label(user?.job_type)
                                      : label}
                                  </span>
                                </div>
                                {hasSubItems && (
                                  <Icon
                                    icon={
                                      isExpanded
                                        ? "mdi:chevron-down"
                                        : "mdi:chevron-right"
                                    }
                                    className="w-4 h-4 transition-transform duration-200 text-gray-400"
                                  />
                                )}
                              </div>

                              {hasSubItems && (
                                <div
                                  className={`overflow-hidden transition-all duration-300 ${
                                    isExpanded
                                      ? "max-h-96 opacity-100"
                                      : "max-h-0 opacity-0"
                                  }`}
                                >
                                  <ul
                                    className={`ml-2 pl-4 border-l-2 border-gray-300 flex flex-col`}
                                  >
                                    {subItems.map(
                                      ({
                                        href: subHref,
                                        icon: subIcon,
                                        label: subLabel,
                                      }) => {
                                        const isSubActive =
                                          isSubItemActive(subHref);

                                        return (
                                          <li
                                            key={subHref}
                                            onClick={() =>
                                              handleNavigation(subHref, subLabel)
                                            }
                                            className={`relative py-2 px-2 pl-2 flex items-center font-normal text-sm w-full cursor-pointer rounded-lg hover:shadow-sm transition-all duration-200 group mb-1 ${isSubActive} ${
                                              !isOpen && !isMobile
                                                ? "justify-center"
                                                : ""
                                            } ${
                                              mode === "dark"
                                                ? "bg-white/10 text-gray-200 hover:bg-white/20"
                                                : ""
                                            }`}
                                          >
                                            <span
                                              className={`text-sm transition-all duration-300 ${
                                                !isOpen && !isMobile
                                                  ? "opacity-0 w-0 overflow-hidden"
                                                  : ""
                                              } ${
                                                mode === "dark"
                                                  ? "text-gray-100"
                                                  : ""
                                              }`}
                                            >
                                              {typeof subLabel === "function"
                                                ? subLabel(user?.job_type)
                                                : subLabel}
                                            </span>
                                          </li>
                                        );
                                      }
                                    )}
                                  </ul>
                                </div>
                              )}
                            </li>
                          );
                        })
                      ) : (
                        <li className="py-3 px-2 text-gray-500 text-sm">
                          No items available
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              ))}
          </div>

          <div
            className={`px-4 py-2 mt-auto ${
              mode === "dark"
                ? "bg-gradient-to-r from-gray-800 to-gray-700"
                : "bg-gray-100"
            } shadow-inner`}
          >
            <div
              className="flex items-center space-x-4 cursor-pointer rounded-lg p-2 hover:bg-gray-200"
              onClick={() => setShowLogout((prev) => !prev)}
            >
              <div className="overflow-hidden rounded-full">
                <Icon icon="hugeicons:ai-user" className="h-6 w-6" />
              </div>
              {isOpen || isMobile ? (
                <div className="flex items-center gap-2 transition-all duration-300">
                  <span className="text-sm font-medium text-black">
                    {user && user.name ? user.name : "Guest"}
                  </span>
                  <div className="w-3 h-3 bg-green-400 rounded-full border border-green-400 flex items-center justify-center aspect-square"></div>
                </div>
              ) : null}
            </div>
            <div
              className={`transition-all duration-200 overflow-hidden ${
                showLogout ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex flex-col gap-2 text-gray-700 text-sm pt-2">
                <div className="py-2 hover:bg-gray-200 rounded-2xl p-2">
                  <button
                    onClick={toggleMode}
                    className="flex items-center gap-2 hover:opacity-80 transition-colors duration-300"
                  >
                    <Icon
                      icon={
                        mode === "dark"
                          ? "line-md:sunny-filled-loop-to-moon-filled-alt-loop-transition"
                          : "line-md:moon-alt-to-sunny-outline-loop-transition"
                      }
                      className={`h-5 w-5 ${
                        mode === "dark" ? "text-blue-500" : "text-yellow-500"
                      }`}
                    />
                    <span>{mode === "dark" ? "Dark Mode" : "Light Mode"}</span>
                  </button>
                </div>
                <hr className="border-t border-gray-300" />
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors hover:bg-gray-200 rounded-2xl p-2"
                >
                  <Icon icon="mdi:logout" className="h-5 w-5" />
                  <span
                    className={`transition-all duration-300 ${
                      !isOpen && !isMobile
                        ? "opacity-0 w-0 overflow-hidden"
                        : ""
                    }`}
                  >
                    Sign Out
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HrSidebar;
