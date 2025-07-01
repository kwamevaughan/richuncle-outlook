import Link from "next/link";
import { Icon } from "@iconify/react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
      <div className="flex flex-col items-center max-w-lg w-full bg-white/80 rounded-3xl shadow-2xl p-8 md:p-12 border border-white/40 backdrop-blur-lg">
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
      <div className="mt-10 text-gray-400 text-sm">
        Copyright © {new Date().getFullYear()}, Rich Uncle Outlook
      </div>
    </div>
  );
} 