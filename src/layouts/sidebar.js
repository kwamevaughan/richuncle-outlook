import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";
import { sidebarNav } from "@/data/nav";
import { filterNavigationByRole } from "@/utils/navigationFilter";
import UserStatus from "@/components/messaging/UserStatus";
import useUserPresence from "@/hooks/useUserPresence";

const Sidebar = ({
  mode,
  toggleMode,
  onLogout,
  user,
  isOpen,
  toggleSidebar,
  disableRouter = false,
  isHeaderVisible = true,
  toggleHeader = null,
  isMobile = false,
  isTablet = false,
}) => {
  const [windowWidth, setWindowWidth] = useState(null);
  const router = !disableRouter ? useRouter() : null;
  const sidebarRef = useRef(null);
  const [showLogout, setShowLogout] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [filteredNav, setFilteredNav] = useState([]);

  // Get user presence data
  const {
    isUserOnline,
  } = useUserPresence();

  // Fetch filtered navigation
  useEffect(() => {
    const fetchFilteredNav = async () => {
      try {
        const filtered = await filterNavigationByRole(sidebarNav, user?.role);
        setFilteredNav(filtered);
      } catch (error) {
        console.error("Error filtering navigation:", error);
        setFilteredNav(sidebarNav); // Fallback to full navigation
      }
    };

    if (user?.role) {
      fetchFilteredNav();
    }
  }, [user?.role]);

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
          if (
            entry.items.some(
              ({ href }) => href.split("?")[0] === router.pathname
            )
          ) {
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

  // Close sidebar on route change for better UX
  useEffect(() => {
    if (!router) return;

    const handleRouteChangeStart = (url) => {
      // Close sidebar when navigation starts, especially useful for mobile/tablet
      if (isOpen && (isMobile || isTablet)) {
        console.log("[Sidebar] Route change detected, closing sidebar:", url);
        toggleSidebar();
      }
    };

    const handleRouteChangeComplete = (url) => {
      // Ensure sidebar is closed after navigation completes on mobile/tablet
      if (isOpen && (isMobile || isTablet)) {
        console.log(
          "[Sidebar] Route change completed, ensuring sidebar is closed:",
          url
        );
        toggleSidebar();
      }
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
    };
  }, [router, isOpen, isMobile, isTablet, toggleSidebar]);

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

  const setActiveItemRef = useCallback(
    (element) => {
      if (element && router) {
        const href = element.getAttribute("data-href");
        if (href && href.split("?")[0] === router.pathname) {
          setTimeout(() => {
            element.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "nearest",
            });
          }, 200);
        }
      }
    },
    [router && router.pathname]
  );

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
    const [pathname, queryString] = href.split("?");

    // If pathnames don't match, not active
    if (router.pathname !== pathname) {
      return "text-gray-700 hover:bg-gray-100";
    }

    // If href has no query parameters, only active if current router also has no query params
    if (!queryString) {
      const isActive = Object.keys(router.query).length === 0;
      return isActive
        ? "bg-orange-100 text-blue-900 shadow-md"
        : "text-gray-700 hover:bg-gray-100";
    }

    // If href has query parameters, check if they match
    const hrefParams = new URLSearchParams(queryString);
    const hrefTab = hrefParams.get("tab");
    const currentTab = router.query.tab;

    // If href has a tab parameter, only active if it matches current tab exactly
    if (hrefTab !== null) {
      const isActive = hrefTab === currentTab;
      return isActive
        ? "bg-orange-100 text-blue-900 shadow-md"
        : "text-gray-700 hover:bg-gray-100";
    }

    // For other query parameters, check if they match
    const isActive = Object.keys(hrefParams).every(
      (key) => router.query[key] === hrefParams.get(key)
    );
    return isActive
      ? "bg-orange-100 text-blue-900 shadow-md"
      : "text-gray-700 hover:bg-gray-100";
  };

  const isSubItemActive = (href) => {
    if (!router) return "";
    const [pathname, queryString] = href.split("?");
    if (router.pathname !== pathname)
      return "text-gray-600 hover:bg-gray-50 ml-0";

    // Parse tab from href query string
    const hrefParams = new URLSearchParams(queryString || "");
    const hrefTab = hrefParams.get("tab");

    // Get current tab from router
    const currentTab = router.query.tab;

    // If href has no tab parameter, only active if current router also has no tab
    if (!hrefTab) {
      const isActive = !currentTab;

      return isActive
        ? "bg-orange-50 text-blue-800 shadow-sm ml-0"
        : "text-gray-600 hover:bg-gray-50 ml-0";
    }

    // If href has a tab parameter, only active if it matches current tab exactly
    const isActive = hrefTab === currentTab;
    console.log(
      `[isSubItemActive] hrefTab: ${hrefTab}, currentTab: ${currentTab}, isActive: ${isActive}`
    );
    return isActive
      ? "bg-orange-50 text-blue-800 shadow-sm ml-0"
      : "text-gray-600 hover:bg-gray-50 ml-0";
  };

  const handleNavigation = async (href, label) => {
    if (!router) return;
    try {
      console.log("[Sidebar] Navigation started:", {
        href,
        label,
        isMobile,
        isOpen,
      });

      // Check if we're navigating to the same pathname but different query params
      const [pathname, queryString] = href.split("?");
      const isSamePath = router.pathname === pathname;

      if (isSamePath && queryString) {
        // Use replace to update query params without adding to history
        const params = new URLSearchParams(queryString);
        const queryObj = {};
        for (const [key, value] of params.entries()) {
          queryObj[key] = value;
        }
        await router.replace(
          {
            pathname: router.pathname,
            query: queryObj,
          },
          undefined,
          { shallow: true }
        );
      } else if (isSamePath && !queryString) {
        // If navigating to same path but no query string, clear all query params
        await router.replace(
          {
            pathname: router.pathname,
            query: {},
          },
          undefined,
          { shallow: true }
        );
      } else {
        // Use push for different pathnames
        await router.push(href);
      }

      // Close sidebar after navigation for better UX
      if (isOpen) {
        // Always close on mobile/tablet, and close on desktop if navigating to different page
        if (isMobile || isTablet || !isSamePath) {
          console.log("[Sidebar] Closing sidebar after navigation:", {
            isMobile,
            isTablet,
            isSamePath,
            href,
          });
          // Small delay to ensure navigation completes
          setTimeout(() => {
            toggleSidebar();
          }, 100);
        }
      }
    } catch (error) {
      console.error("[Sidebar] Navigation error:", error);
    }
  };

  // Add this handler to expand sidebar on hover/click of category
  const handleCategoryInteraction = (category) => {
    if (!isOpen && !isMobile && !isTablet) {
      toggleSidebar();
      // Optionally, you can also expand the clicked category after expanding
      setTimeout(() => toggleCategory(category), 200);
    } else {
      toggleCategory(category);
    }
  };

  if (windowWidth === null) return null;

  return (
    <div className="relative z-[20]">
      {/* Mobile/Tablet backdrop/overlay */}
      {(isMobile || isTablet) && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}
      <div
        ref={sidebarRef}
        className={`fixed left-0 top-0 z-50 rounded-xl transition-all duration-300
          ${isMobile ? "m-0" : "m-0 md:m-3"}
          ${isMobile || isTablet ? (isOpen ? "block" : "hidden") : "block"}
          ${mode === "dark" ? "" : "bg-white"}
          group shadow-lg shadow-black/20 custom-scrollbar
        `}
        style={{
          width: isMobile
            ? "100vw"
            : isTablet
            ? isOpen
              ? "280px"
              : "64px"
            : isOpen
            ? "240px"
            : "64px",
          height: isMobile ? "100vh" : "calc(100vh - 48px)",
          maxHeight: isMobile ? "100vh" : "calc(100vh - 48px)",
        }}
      >
        <div className="flex flex-col h-full relative">
          <div
            className={`flex items-center justify-between ${
              !isOpen && !isMobile && !isTablet
                ? "justify-center"
                : "justify-between"
            } py-4 px-4 shadow-sm bg-blue-900 rounded-t-md`}
          >
            <div className="flex items-center gap-2 ">
              <p
                className={`${
                  isTablet ? "text-lg" : "text-xl"
                } font-bold transition-all duration-300 ${
                  mode === "dark" ? "text-white" : "text-white"
                }`}
              >
                {!isOpen && !isMobile && !isTablet ? "R" : "RichUncle Outlook"}
              </p>
            </div>

            {/* Mobile/Tablet close button */}
            {(isMobile || isTablet) && (
              <button
                onClick={toggleSidebar}
                className="text-white hover:scale-110 transition-transform p-1 rounded"
                title="Close Sidebar"
                aria-label="Close Sidebar"
              >
                <Icon icon="mdi:close" className="w-6 h-6" />
              </button>
            )}
          </div>

          <div
            className={`flex-grow px-2 overflow-y-auto flex flex-col scrollbar-thin pb-4 ${
              !isOpen && !isMobile && !isTablet ? "items-center" : ""
            }`}
          >
            {/* Render standalone nav items (e.g., Home) */}
            {filteredNav
              .filter((entry) => !entry.items)
              .map((item) => (
                <div
                  key={item.href}
                  className={`flex items-center gap-2 px-2 mt-4 pt-4 pb-4 mb-2 rounded-lg font-bold text-sm tracking-wide cursor-pointer transition-all duration-300 ${
                    mode === "dark"
                      ? "bg-gray-800/20 text-gray-200 hover:bg-gray-700 hover:text-white"
                      : "bg-white text-gray-500 hover:bg-orange-50 hover:text-gray-700"
                  } ${
                    !isOpen && !isMobile && !isTablet ? "justify-center" : ""
                  }`}
                  onClick={() => handleNavigation(item.href, item.label)}
                >
                  {item.icon && (
                    <Icon
                      icon={item.icon}
                      className={`${
                        item.href === "/dashboard" ? "h-7 w-7" : "h-5 w-5"
                      } text-gray-500 transition-all duration-300 ${
                        !isOpen && !isMobile && !isTablet ? "mx-auto" : "mr-2"
                      }`}
                    />
                  )}
                  <span
                    className={`transition-all duration-300${
                      !isOpen && !isMobile && !isTablet ? " hidden" : ""
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            {/* Render categories */}
            {filteredNav
              .filter((entry) => entry.items)
              .map(({ category, items, icon }, index) => (
                <div
                  key={category}
                  className={`w-full mb-1 relative ${
                    !isOpen && !isMobile && !isTablet
                      ? "flex flex-col items-center"
                      : ""
                  }`}
                >
                  {index !== 0 && <div className="my-2" />}
                  <div
                    className={`flex items-center justify-between text-md tracking-wide font-medium px-2 py-3 cursor-pointer transition-all duration-300 rounded-lg hover:shadow-sm ${
                      mode === "dark"
                        ? "text-gray-200 hover:bg-gray-700 hover:text-white"
                        : "text-gray-600 hover:bg-orange-50 hover:text-gray-700"
                    } ${
                      !isOpen && !isMobile && !isTablet ? "justify-center" : ""
                    }`}
                    onClick={() => handleCategoryInteraction(category)}
                    onMouseEnter={() => {
                      if (!isOpen && !isMobile && !isTablet) toggleSidebar();
                    }}
                  >
                    <span
                      className={`flex items-center gap-2 transition-all duration-300 capitalize`}
                    >
                      {icon && (
                        <Icon
                          icon={icon}
                          className={`h-5 w-5 text-gray-500 transition-all duration-300 ${
                            !isOpen && !isMobile && !isTablet
                              ? "mx-auto"
                              : "mr-2"
                          }`}
                        />
                      )}
                      <span
                        className={`transition-all duration-300${
                          !isOpen && !isMobile && !isTablet ? " hidden" : ""
                        }`}
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
                        ? "max-h-[800px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                    style={{
                      transitionProperty: "max-height, opacity",
                      transitionDuration: "500ms",
                    }}
                  >
                    <ul className={`pl-8 pt-2 flex flex-col relative z-10`}>
                      {Array.isArray(items) && items.length > 0 ? (
                        items.map(({ href, icon, label, subItems }) => {
                          const isActiveItem = isActive(href);
                          const hasSubItems = subItems && subItems.length > 0;
                          const isExpanded = expandedItems[href];

                          // Intercept Retrieve Layaways/Orders
                          const isRetrieveLayaways =
                            !href && label === "Retrieve Layaways";
                          const isRetrieveOrders =
                            !href && label === "Retrive Orders";

                          return (
                            <li key={href + label} className="px-2 pl-2">
                              <div
                                ref={setActiveItemRef}
                                data-href={href}
                                onClick={() => {
                                  if (isRetrieveLayaways) {
                                    window.dispatchEvent(
                                      new CustomEvent(
                                        "open-retrieve-layaways-modal"
                                      )
                                    );
                                    // Close sidebar on mobile/tablet for special events
                                    if ((isMobile || isTablet) && isOpen) {
                                      console.log(
                                        "[Sidebar] Closing sidebar on mobile/tablet for layaways event"
                                      );
                                      // Close immediately for better UX
                                      toggleSidebar();
                                    }
                                    return;
                                  }
                                  if (isRetrieveOrders) {
                                    window.dispatchEvent(
                                      new CustomEvent(
                                        "open-retrieve-orders-modal"
                                      )
                                    );
                                    // Close sidebar on mobile/tablet for special events
                                    if ((isMobile || isTablet) && isOpen) {
                                      console.log(
                                        "[Sidebar] Closing sidebar on mobile/tablet for orders event"
                                      );
                                      // Close immediately for better UX
                                      toggleSidebar();
                                    }
                                    return;
                                  }
                                  if (hasSubItems) {
                                    toggleItem(href);
                                  } else {
                                    handleNavigation(href, label);
                                  }
                                }}
                                className={`relative py-2 px-2 flex items-center justify-between font-medium text-sm w-full cursor-pointer rounded-lg hover:shadow-md transition-all duration-200 group mb-1 ${isActiveItem} ${
                                  !isOpen && !isMobile && !isTablet
                                    ? "justify-center"
                                    : ""
                                } ${
                                  mode === "dark"
                                    ? "bg-gray-800/20 text-gray-200 hover:bg-gray-700 hover:text-white"
                                    : "text-gray-700 hover:text-gray-800"
                                }`}
                              >
                                <div
                                  className={`flex items-center ${
                                    !isOpen && !isMobile && !isTablet
                                      ? "justify-center w-full"
                                      : ""
                                  }`}
                                >
                                  <span
                                    className={`text-sm transition-all duration-300 ${
                                      !isOpen && !isMobile && !isTablet
                                        ? "opacity-0 w-0 overflow-hidden"
                                        : ""
                                    } ${
                                      mode === "dark" ? "text-gray-100" : ""
                                    }`}
                                  >
                                    {label}
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
                                    className={`ml-2 pl-4 border-l-2 flex flex-col ${
                                      mode === "dark"
                                        ? "border-gray-600"
                                        : "border-gray-300"
                                    }`}
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
                                              handleNavigation(
                                                subHref,
                                                subLabel
                                              )
                                            }
                                            className={`relative py-2 px-2 pl-2 flex items-center font-normal text-sm w-full cursor-pointer rounded-lg hover:shadow-sm transition-all duration-200 group mb-1
  ${
    isSubActive
      ? mode === "dark"
        ? "bg-gray-800 text-white"
        : "bg-orange-50 text-blue-800 shadow-sm ml-0"
      : mode === "dark"
      ? "bg-gray-800/20 text-gray-200 hover:bg-blue-900/60 hover:text-white"
      : "text-gray-600 hover:bg-orange-100 hover:text-blue-900"
  }
  ${!isOpen && !isMobile && !isTablet ? "justify-center" : ""}
`}
                                          >
                                            <span
                                              className={`text-sm transition-all duration-300 ${
                                                !isOpen &&
                                                !isMobile &&
                                                !isTablet
                                                  ? "opacity-0 w-0 overflow-hidden"
                                                  : ""
                                              } ${
                                                mode === "dark"
                                                  ? "text-gray-100"
                                                  : ""
                                              }`}
                                            >
                                              {subLabel}
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
                        <li
                          className={`py-3 px-2 text-sm ${
                            mode === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
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
              className={`flex items-center space-x-4 cursor-pointer rounded-lg p-2 transition-colors ${
                mode === "dark"
                  ? "hover:bg-gray-700 hover:text-white"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => setShowLogout((prev) => !prev)}
            >
              <div className="overflow-hidden rounded-full w-6 h-6">
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
              {isOpen || isMobile || isTablet ? (
                <div className="flex items-center gap-2 transition-all duration-300">
                  <span
                    className={`text-sm font-medium ${
                      mode === "dark" ? "text-white" : "text-black"
                    }`}
                  >
                    {user && user.name ? user.name : "Guest"}
                  </span>
                  <UserStatus
                    userId={user?.id}
                    isOnline={isUserOnline && isUserOnline(user?.id)}
                    size="sm"
                    className="border border-white rounded-full shadow-sm"
                  />
                </div>
              ) : null}
            </div>
            <div
              className={`transition-all duration-200 overflow-hidden ${
                showLogout ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div
                className={`flex flex-col gap-2 text-sm pt-2 ${
                  mode === "dark" ? "text-gray-200" : "text-gray-700"
                }`}
              >
                <div
                  className={`flex items-center space-x-4 cursor-pointer rounded-lg p-2 transition-colors ${
                    mode === "dark"
                      ? "hover:bg-gray-700 hover:text-white"
                      : "hover:bg-gray-200"
                  }`}
                  onClick={() => router.push("/profile")}
                >
                  <div className="overflow-hidden rounded-full w-6 h-6">
                    {user && user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name || "User"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon icon="mdi:account-outline" className="h-6 w-6" />
                    )}
                  </div>
                  {isOpen || isMobile || isTablet ? (
                    <div className="flex items-center gap-2 transition-all duration-300">
                      <span
                        className={`text-sm font-medium ${
                          mode === "dark" ? "text-white" : "text-black"
                        }`}
                      >
                        View Profile
                      </span>
                    </div>
                  ) : null}
                </div>

                <div
                  className={`py-2 rounded-2xl p-2 transition-colors ${
                    mode === "dark"
                      ? "hover:bg-gray-700 hover:text-white"
                      : "hover:bg-gray-200"
                  }`}
                >
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
                    <span
                      className={
                        mode === "dark" ? "text-white" : "text-gray-700"
                      }
                    >
                      {mode === "dark" ? "Dark Mode" : "Light Mode"}
                    </span>
                  </button>
                </div>
                <hr className="border-t border-gray-300" />
                <button
                  onClick={onLogout}
                  className={`flex items-center gap-2 transition-colors rounded-2xl p-2 ${
                    mode === "dark"
                      ? "text-red-400 hover:text-red-300 hover:bg-gray-700"
                      : "text-red-600 hover:text-red-700 hover:bg-gray-200"
                  }`}
                >
                  <Icon icon="mdi:logout" className="h-5 w-5" />
                  <span
                    className={`transition-all duration-300 ${
                      !isOpen && !isMobile && !isTablet
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

export default Sidebar;
