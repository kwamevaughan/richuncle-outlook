import Footer from "@/layouts/footer";
import Sidebar from "@/layouts/sidebar";
import Header from "@/layouts/header";
import useSidebar from "@/hooks/useSidebar";
import { useState } from "react";

export default function MainLayout({ children, mode, HeaderComponent = Header, showSidebar = true, user, onLogout, ...props }) {
  const { isSidebarOpen, toggleSidebar, isMobile, isTablet } = useSidebar();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const toggleHeader = () => {
    setIsHeaderVisible(!isHeaderVisible);
  };

  // Determine margin-left based on sidebar state and device type
  const contentMargin = !showSidebar 
    ? "ml-0" 
    : (isMobile || isTablet) 
      ? "ml-0" 
      : isSidebarOpen 
        ? "ml-60" 
        : "ml-16";

  return (
    <div className={`min-h-screen flex flex-col ${mode === "dark" ? "bg-gray-900 text-white" : "text-gray-900"}`}>
      <HeaderComponent {...props} isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} mode={mode} user={user} onLogout={onLogout} isHeaderVisible={isHeaderVisible} toggleHeader={toggleHeader} />
      <div className="flex flex-1">
        {showSidebar && (
          <Sidebar isOpen={isSidebarOpen} mode={mode} toggleSidebar={toggleSidebar} user={user} onLogout={onLogout} isHeaderVisible={isHeaderVisible} toggleHeader={toggleHeader} isMobile={isMobile} isTablet={isTablet} />
        )}
        <div className={`flex-1 flex flex-col transition-all ${contentMargin}`}>
          <div className="flex flex-col flex-1">
            <div className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col">
              {children}
            </div>
            <div className="p-4 md:p-6 lg:p-8">
              <Footer mode={mode} isSidebarOpen={isSidebarOpen} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 