import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter } from "next/router";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import HrHeader from "../layouts/hrHeader";
import HrSidebar from "../layouts/hrSidebar";
import SimpleFooter from "../layouts/simpleFooter";
import useSidebar from "../hooks/useSidebar";
import toast from "react-hot-toast";
import ErrorBoundary from "../components/ErrorBoundary";
import { Icon } from "@iconify/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";

export default function Dashboard({ mode = "light", toggleMode }) {
  const { isSidebarOpen, toggleSidebar, isMobile, windowWidth } = useSidebar();
  const router = useRouter();
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  

  if (userLoading && LoadingComponent) return LoadingComponent;
  if (!user || windowWidth === null) {
    router.push("/");
    return null;
  }

  return (
    <div
      key={`dashboard-${user?.id}-${mode}`}
      className={`min-h-screen flex flex-col ${
        mode === "dark" ? "bg-gray-900 text-white" : " text-gray-900"
      }`}
    >
      <HrHeader
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
        user={user}
        mode={mode}
        toggleMode={toggleMode}
        onLogout={handleLogout}
      />
      <div className="flex flex-1">
        <HrSidebar
          isOpen={isSidebarOpen}
          user={user}
          mode={mode}
          toggleSidebar={toggleSidebar}
          onLogout={handleLogout}
          toggleMode={toggleMode}
        />
        <div
          className={`flex-1 p-4 md:p-6 lg:p-8 transition-all ${
            isSidebarOpen && !isMobile ? "ml-60" : "ml-24"
          }`}
        >
          <div className="pt-40 ">
            <p>Testing page</p>

                
          </div>
          <ErrorBoundary>{}</ErrorBoundary>
          <SimpleFooter mode={mode} isSidebarOpen={isSidebarOpen} />
        </div>
      </div>
    </div>
  );
}
