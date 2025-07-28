import React from "react";
import { Icon } from "@iconify/react";

export default function ReportSummary({ 
  title, 
  icon, 
  children, 
  mode = "light",
  loading = false,
  error = null,
  loadingText = "Loading data...",
  errorText = "Failed to load data"
}) {
  return (
    <div className={`rounded-xl border ${
      mode === "dark" 
        ? "bg-gray-800 border-gray-700" 
        : "bg-white border-gray-200"
    }`}>
      <div className={`p-6 border-b ${
        mode === "dark" ? "border-gray-700" : "border-gray-200"
      }`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${
            mode === "dark" ? "text-white" : "text-gray-900"
          }`}>{title}</h3>
          <Icon icon={icon} className="w-6 h-6 text-gray-400" />
        </div>
      </div>
      <div className="p-6">
        {error ? (
          <div className="text-center text-red-500 py-8">{errorText}</div>
        ) : loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className={`mt-2 ${
              mode === "dark" ? "text-gray-400" : "text-gray-500"
            }`}>{loadingText}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
} 