import { useState } from "react";
import { Icon } from "@iconify/react";
import Search from "./Search";

const SearchTrigger = ({ mode, onSearchModalToggle, user, isMobile, isTablet }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const handleSearchModalToggle = (isOpen) => {
    setIsSearchOpen(isOpen);
    onSearchModalToggle?.(isOpen);
  };

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={handleSearchToggle}
        className={`flex items-center justify-center ${
          isMobile ? "p-1.5" : isTablet ? "p-2" : "p-2"
        } rounded-md hover:shadow-md transition-all duration-300 flex-shrink-0 ${
          mode === "dark"
            ? "bg-gray-800 text-gray-100 hover:bg-gray-700"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        title="Search"
      >
        <Icon
          icon="material-symbols:search-rounded"
          className={`${
            isMobile ? "h-4 w-4" : isTablet ? "h-5 w-5" : "h-6 w-6"
          } ${mode === "dark" ? "text-gray-300" : "text-blue-900"}`}
        />
      </button>

      {/* Search component with controlled visibility */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[9999]">
          <Search
            mode={mode}
            onSearchModalToggle={handleSearchModalToggle}
            user={user}
            isOpen={isSearchOpen}
          />
        </div>
      )}
    </>
  );
};

export default SearchTrigger;