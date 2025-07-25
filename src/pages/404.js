import Link from "next/link";
import { Icon } from "@iconify/react";
import HrHeader from "../layouts/hrHeader";
import HrSidebar from "../layouts/hrSidebar";
import SimpleFooter from "../layouts/simpleFooter";

export default function Custom404() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Sidebar Container */}
      <div className="relative">
        <div className="pointer-events-none opacity-60 blur-[1px]">
          <HrSidebar
            mode="light"
            toggleMode={() => {}}
            onLogout={() => {}}
            user={{ name: "Guest", role: "guest" }}
            isOpen={true}
            toggleSidebar={() => {}}
            disableRouter
          />
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <HrHeader mode="light" isSidebarOpen={true} toggleSidebar={() => {}} user={{ name: "Guest", role: "guest" }} onSearchModalToggle={() => {}} />
        <main className="flex flex-1 flex-col items-center justify-center p-6 relative overflow-hidden">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-orange-200 rounded-full blur-xl opacity-50 scale-110 animate-pulse" />
            <div className="relative bg-white dark:bg-slate-800 p-6 rounded-full shadow-lg border border-orange-100 dark:border-orange-900">
              <Icon icon="lucide:search-x" className="text-orange-500 text-4xl" />
            </div>
          </div>
          <h1 className="text-7xl font-black text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
            404
          </h1>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            Page Not Found
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
            The page you're looking for has wandered off into the digital void. Let's navigate you back to safety.
          </p>
          <div className="flex gap-4">
            <Link href="/dashboard">
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg flex items-center gap-2">
                <Icon icon="lucide:home" className="text-lg" />
                Go Home
              </button>
            </Link>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl shadow-lg border border-slate-200 dark:border-slate-600 flex items-center gap-2"
            >
              <Icon icon="lucide:arrow-left" className="text-lg" />
              Go Back
            </button>
          </div>
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
        </main>
        <SimpleFooter mode="light" isSidebarOpen={true} />
      </div>
    </div>
  );
} 