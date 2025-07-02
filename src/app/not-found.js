"use client";
import Link from "next/link";
import { Icon } from "@iconify/react";
import HrHeader from "../layouts/hrHeader";
import HrSidebar from "../layouts/hrSidebar";

export default function NotFound(props) {
  // Provide minimal mock props for header/sidebar if needed
  const mode = props.mode || "light";
  const user = props.user || { name: "Guest", role: "guest" };
  const toggleMode = props.toggleMode || (() => {});
  const handleLogout = props.handleLogout || (() => {});
  const isSidebarOpen = true;
  const toggleSidebar = () => {};

  return (
    <div className="flex min-h-screen">
      <div className="relative">
        {/* Sidebar rendered but non-interactive */}
        <div className="pointer-events-none opacity-80">
          <HrSidebar
            mode={mode}
            toggleMode={toggleMode}
            onLogout={handleLogout}
            user={user}
            isOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
            disableRouter={true}
          />
        </div>
        {/* Overlay message */}
        <div className="hidden bottom-0 left-0 w-full text-center text-xs text-gray-500 bg-white/80 py-2 z-20">
          Sidebar navigation is disabled on this page.
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <HrHeader
          mode={mode}
          toggleMode={toggleMode}
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          onLogout={handleLogout}
          user={user}
          onSearchModalToggle={() => {}}
        />
        <main className="flex flex-1 flex-col items-center justify-center bg-white bg-login p-6 relative">
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-white/30 z-0 pointer-events-none" />
          <div className="flex flex-col items-center max-w-lg w-full bg-white/60 rounded-3xl shadow-2xl p-8 md:p-12 border border-white/40 backdrop-blur-lg relative z-10">
            <Icon
              icon="lucide:alert-triangle"
              className="text-orange-500 text-6xl mb-4 animate-bounce"
            />
            <h1 className="text-5xl font-extrabold text-blue-900 mb-2">404</h1>
            <h2 className="text-2xl font-semibold text-blue-800 mb-4">
              Page Not Found
            </h2>
            <p className="text-gray-600 mb-8 text-center">
              Oops! The page you are looking for doesn't exist or has been moved.
              <br />
              Let's get you back on track.
            </p>
            <Link href="/dashboard">
              <span className="inline-block px-6 py-3 bg-blue-900 text-white font-bold rounded-full shadow-lg hover:bg-blue-800 transition-all duration-200">
                Go to Dashboard
              </span>
            </Link>
          </div>
          <div className="mt-10 bg-white text-gray-900 px-4 py-2 rounded-lg text-sm relative z-10">
            Copyright © {new Date().getFullYear()}, Rich Uncle Outlook
          </div>
        </main>
      </div>
    </div>
  );
} 