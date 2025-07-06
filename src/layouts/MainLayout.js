import SimpleFooter from "@/layouts/simpleFooter";
import HrSidebar from "@/layouts/hrSidebar";
import HrHeader from "@/layouts/hrHeader";
import useSidebar from "@/hooks/useSidebar";

export default function MainLayout({ children, mode, HeaderComponent = HrHeader, showSidebar = true, user, onLogout, ...props }) {
  const { isSidebarOpen, toggleSidebar, isMobile } = useSidebar();

  // Determine margin-left based on sidebar state
  const contentMargin = !showSidebar ? "ml-0" : isMobile ? "ml-0" : isSidebarOpen ? "ml-60" : "ml-16";

  return (
    <div className={`min-h-screen flex flex-col ${mode === "dark" ? "bg-gray-900 text-white" : "text-gray-900"}`}>
      <HeaderComponent {...props} isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} mode={mode} user={user} onLogout={onLogout} />
      <div className="flex flex-1">
        {showSidebar && (
          <HrSidebar isOpen={isSidebarOpen} mode={mode} toggleSidebar={toggleSidebar} user={user} onLogout={onLogout} />
        )}
        <div className={`flex-1 flex flex-col transition-all ${contentMargin}`}>
          <div className="flex flex-col flex-1">
            <div className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col">
              {children}
            </div>
            <div className="p-4 md:p-6 lg:p-8">
              <SimpleFooter mode={mode} isSidebarOpen={isSidebarOpen} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 