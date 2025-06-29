import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Configuration constants
const SECTION_CONFIG = {
  "business opportunities": { href: "/business-opportunities", icon: "lucide:briefcase" },
  events: { href: "/events", icon: "lucide:calendar" },
  resources: { href: "/resources", icon: "lucide:book-open" },
  "market intel": { href: "/market-intel", icon: "lucide:trending-up" },
  offers: { href: "/offers", icon: "lucide:tag" },
  updates: { href: "/updates", icon: "lucide:bell" },
};

const Search = ({ mode = "light", onSearchModalToggle, user }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [animationState, setAnimationState] = useState("closed");
  const [searchResults, setSearchResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const animationTimeoutRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const DEBOUNCE_DELAY = 300;

  // Memoized values
  const totalResults = useMemo(
    () => Object.values(searchResults).reduce((sum, items) => sum + (items?.length || 0), 0),
    [searchResults]
  );

  // Memoized functions
  const handleSearch = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (query.length > 0) {
      debounceTimeoutRef.current = setTimeout(() => {
        if (!isPopupOpen) {
          setAnimationState("entering");
          setIsPopupOpen(true);
        }
      }, DEBOUNCE_DELAY);
    } else if (isPopupOpen) {
      closePopup();
    }
  }, [isPopupOpen]);

  const closePopup = useCallback(() => {
    if (!isPopupOpen) return;
    setAnimationState("exiting");
    animationTimeoutRef.current = setTimeout(() => {
      setIsPopupOpen(false);
      setAnimationState("closed");
      setSearchQuery("");
      setSearchResults({});
      setError(null);
    }, 300);
  }, [isPopupOpen]);

  // Fetch search results
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setSearchResults({});
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const tables = Object.entries(SECTION_CONFIG).map(([name, { section }]) => ({
          name: name.replace(" ", "_"),
          section: section || name.charAt(0).toUpperCase() + name.slice(1),
        }));

        const results = await Promise.all(
          tables.map(async ({ name, section }) => {
            const { data, error } = await supabase
              .from(name)
              .select("id, title, tier_restriction, created_at, updated_at")
              .ilike("title", `%${searchQuery}%`)
              .order("updated_at", { ascending: false })
              .order("created_at", { ascending: false })
              .limit(5);

            if (error) {
              console.error(`[Search] Error fetching from ${name}:`, error);
              return { section, items: [] };
            }

            const filteredItems = data
              .map((item) => ({
                id: item.id,
                title: item.title,
                timestamp: item.updated_at || item.created_at,
              }));

            return { section, items: filteredItems };
          })
        );

        setSearchResults(
          results
            .filter(({ items }) => items.length > 0)
            .reduce((acc, { section, items }) => ({ ...acc, [section]: items }), {})
        );
      } catch (err) {
        console.error("[Search] Unexpected error:", err);
        setError("Failed to fetch search results.");
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchQuery]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isPopupOpen && animationState !== "exiting") {
        closePopup();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPopupOpen, animationState, closePopup]);

  // Focus input when popup opens
  useEffect(() => {
    if (isPopupOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPopupOpen]);

  // Manage modal state and body overflow
  useEffect(() => {
    onSearchModalToggle?.(isPopupOpen);
    document.body.style.overflow = isPopupOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, [isPopupOpen, onSearchModalToggle]);

  // Memoized styles
  const styles = useMemo(() => ({
    input: `pl-14 pr-4 py-2 text-sm w-full focus:outline-none rounded-lg bg-transparent transition-colors duration-200 ${
      mode === "dark" ? "text-white placeholder-white" : ""
    } placeholder:font-bold`,
    searchIcon: `absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 ${
      mode === "dark" ? "text-gray-400" : "text-blue-900"
    }`,
    overlay: `fixed inset-0 z-[9998] h-screen ${
      mode === "dark" ? "bg-gray-900/70" : "bg-gray-900/50"
    } ${animationState === "exiting" ? "animate-fadeOut" : "animate-fadeIn"}`,
    modal: `rounded-3xl shadow-2xl border backdrop-blur-md pointer-events-auto max-w-xl w-full mx-4 max-h-[80vh] overflow-hidden ${
      mode === "dark"
        ? "bg-gray-800/90 text-white border-gray-600/30 shadow-black/50"
        : "bg-white/95 text-gray-900 border-gray-200/50 shadow-gray-500/20"
    } ${animationState === "exiting" ? "animate-slideUp" : "animate-slideDown"}`,
    header: `p-6 pb-4 border-b border-opacity-20 border-gray-300`,
    iconContainer: `p-2 rounded-xl ${mode === "dark" ? "bg-gray-700/50" : "bg-gray-100"}`,
    closeButton: `p-2 rounded-xl transition-all duration-200 ${
      mode === "dark"
        ? "hover:bg-gray-700/50 text-gray-400 hover:text-white"
        : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
    }`,
    resultsCounter: `mt-3 text-sm ${mode === "dark" ? "text-gray-400" : "text-gray-600"}`,
    errorContainer: `flex items-center gap-3 p-4 rounded-2xl ${
      mode === "dark" ? "bg-red-900/20 border border-red-800/30" : "bg-red-50 border border-red-200"
    }`,
    errorIcon: `h-5 w-5 ${mode === "dark" ? "text-red-400" : "text-red-600"}`,
    errorText: `text-sm font-medium ${mode === "dark" ? "text-red-400" : "text-red-700"}`,
    resultsContainer: `p-6 pt-4 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent hover:scrollbar-thumb-gray-500`,
    sectionHeader: `flex items-center gap-3 mb-4`,
    sectionIconContainer: `p-2 rounded-xl ${
      mode === "dark" ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600"
    }`,
    sectionTitle: `font-semibold text-lg ${mode === "dark" ? "text-white" : "text-gray-900"}`,
    sectionCount: `text-xs px-2 py-1 rounded-full font-medium ${
      mode === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
    }`,
    resultItem: `group p-4 rounded-2xl transition-all duration-200 cursor-pointer transform hover:scale-[1.02] ${
      mode === "dark"
        ? "hover:bg-gray-700/40 border border-transparent hover:border-gray-600/50"
        : "hover:bg-gray-50 border border-transparent hover:border-gray-200 hover:shadow-sm"
    }`,
    resultTitle: `font-medium text-base leading-snug group-hover:text-blue-500 transition-colors duration-200 ${
      mode === "dark" ? "text-white" : "text-gray-900"
    }`,
    resultTimestamp: `text-sm mt-1 ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`,
    resultArrow: `h-4 w-4 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
      mode === "dark" ? "text-gray-400" : "text-gray-500"
    }`,
    emptyContainer: `text-center py-12`,
    emptyIconContainer: `mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
      mode === "dark" ? "bg-gray-700/30" : "bg-gray-100"
    }`,
  }), [mode, animationState]);

  return (
    <div className="relative z-10">
      <input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={handleSearch}
        className={styles.input}
      />
      <Icon icon="material-symbols:search-rounded" className={styles.searchIcon} />

      {isPopupOpen && typeof window !== "undefined" && createPortal(
        <>
          <div
            className={styles.overlay}
            style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            onClick={closePopup}
          />
          <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-16 pointer-events-none">
            <div className={styles.modal}>
              <div className={styles.header}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={styles.iconContainer}>
                      <Icon icon="material-symbols:search-rounded" className={`h-5 w-5 ${mode === "dark" ? "text-gray-300" : "text-gray-600"}`} />
                    </div>
                    <input
                      type="text"
                      placeholder="Search across all sections..."
                      value={searchQuery}
                      onChange={handleSearch}
                      ref={inputRef}
                      className={`flex-grow text-lg font-medium focus:outline-none bg-transparent ${
                        mode === "dark" ? "text-white placeholder-gray-400" : "text-gray-900 placeholder-gray-500"
                      } transition-colors duration-200`}
                    />
                  </div>
                  <button onClick={closePopup} className={styles.closeButton}>
                    <Icon icon="material-symbols:close" className="h-5 w-5" />
                  </button>
                </div>
                {!loading && !error && (
                  <div className={styles.resultsCounter}>
                    {totalResults > 0 ? (
                      <span className="font-medium">{totalResults} result{totalResults !== 1 ? "s" : ""} found</span>
                    ) : searchQuery.length >= 2 ? (
                      <span>No results found</span>
                    ) : null}
                  </div>
                )}
              </div>
              <div className={styles.resultsContainer}>
                {error && (
                  <div className={styles.errorContainer}>
                    <Icon icon="lucide:alert-circle" className={styles.errorIcon} />
                    <p className={styles.errorText}>{error}</p>
                  </div>
                )}
                {loading && (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`animate-pulse p-4 rounded-2xl ${mode === "dark" ? "bg-gray-700/30" : "bg-gray-100"}`}
                      >
                        <div
                          className={`h-4 rounded-lg mb-2 ${mode === "dark" ? "bg-gray-600" : "bg-gray-300"}`}
                          style={{ width: `${60 + Math.random() * 30}%` }}
                        />
                        <div
                          className={`h-3 rounded-lg ${mode === "dark" ? "bg-gray-700" : "bg-gray-200"}`}
                          style={{ width: `${40 + Math.random() * 20}%` }}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {!loading && !error && totalResults > 0 && (
                  <div className="space-y-6">
                    {Object.entries(searchResults).map(([section, items]) => (
                      <div key={section} className="space-y-3">
                        <div className={styles.sectionHeader}>
                          <div className={styles.sectionIconContainer}>
                            <Icon icon={SECTION_CONFIG[section.toLowerCase()]?.icon || "lucide:folder"} className="h-4 w-4" />
                          </div>
                          <h3 className={styles.sectionTitle}>{section}</h3>
                          <span className={styles.sectionCount}>{items.length}</span>
                        </div>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <Link
                              key={item.id}
                              href={`${SECTION_CONFIG[section.toLowerCase()]?.href}/${item.id}`}
                              onClick={closePopup}
                            >
                              <div className={styles.resultItem}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <h4 className={styles.resultTitle}>{item.title}</h4>
                                    <p className={styles.resultTimestamp}>
                                      Updated {new Date(item.timestamp).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </p>
                                  </div>
                                  <Icon icon="lucide:arrow-up-right" className={styles.resultArrow} />
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!loading && !error && totalResults === 0 && searchQuery.length >= 2 && (
                  <div className={styles.emptyContainer}>
                    <div className={styles.emptyIconContainer}>
                      <Icon icon="lucide:search-x" className={`h-8 w-8 ${mode === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                    </div>
                    <h3 className={`font-semibold text-lg mb-2 ${mode === "dark" ? "text-white" : "text-gray-900"}`}>
                      No results found
                    </h3>
                    <p className={`text-sm ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                      Try adjusting your search terms or check spelling
                    </p>
                  </div>
                )}
                {!loading && !error && searchQuery.length < 2 && (
                  <div className={styles.emptyContainer}>
                    <div className={styles.emptyIconContainer}>
                      <Icon icon="lucide:search" className={`h-8 w-8 ${mode === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                    </div>
                    <h3 className={`font-semibold text-lg mb-2 ${mode === "dark" ? "text-white" : "text-gray-900"}`}>
                      Start typing to search
                    </h3>
                    <p className={`text-sm ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                      Search across business opportunities, events, resources, and more
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default Search;
