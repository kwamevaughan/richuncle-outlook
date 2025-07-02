"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import HrHeader from "../layouts/hrHeader";
import HrSidebar from "../layouts/hrSidebar";

export default function NotFound(props = {}) {
  const {
    mode = "light",
    user = { name: "Guest", role: "guest" },
    toggleMode = () => {},
    handleLogout = () => {},
  } = props;
  const isSidebarOpen = true;
  const toggleSidebar = () => {};

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Sidebar Container */}
      <div className="relative">
        <div className="pointer-events-none opacity-60 blur-[1px]">
          <HrSidebar
            mode={mode}
            toggleMode={toggleMode}
            onLogout={handleLogout}
            user={user}
            isOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
            disableRouter
          />
        </div>
      </div>

      {/* Main Content */}
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

        <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-200/30 to-cyan-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          {/* Error Card */}
          <div className="relative z-10 flex flex-col items-center max-w-md w-full">
            {/* Icon Container */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-orange-200 rounded-full blur-xl opacity-50 scale-110 animate-pulse" />
              <div className="relative bg-white dark:bg-slate-800 p-6 rounded-full shadow-lg border border-orange-100 dark:border-orange-900">
                <Icon
                  icon="lucide:search-x"
                  className="text-orange-500 text-4xl"
                />
              </div>
            </div>

            {/* Error Content */}
            <div className="text-center space-y-4 mb-8">
              <div className="space-y-2">
                <h1 className="text-7xl font-black text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                  404
                </h1>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  Page Not Found
                </h2>
              </div>

              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                The page you're looking for has wandered off into the digital
                void. Let's navigate you back to safety.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Link href="/dashboard" className="flex-1 group">
                <button className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2">
                  <Icon icon="lucide:home" className="text-lg" />
                  Go Home
                </button>
              </Link>

              <button
                onClick={() => window.history.back()}
                className="flex-1 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl shadow-lg hover:shadow-xl border border-slate-200 dark:border-slate-600 transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Icon icon="lucide:arrow-left" className="text-lg" />
                Go Back
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Still lost?
                <Link
                  href="/support"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium ml-1 hover:underline transition-colors"
                >
                  Contact Support
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <footer className="absolute bottom-6 left-0 right-0 text-center z-10">
            <p className="text-xs text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-full inline-block border border-slate-200/50 dark:border-slate-700/50">
              © {new Date().getFullYear()} Rich Uncle Outlook. All rights
              reserved.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
