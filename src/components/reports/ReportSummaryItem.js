import React from "react";
import { Icon } from "@iconify/react";

export default function ReportSummaryItem({ 
  icon, 
  title, 
  subtitle, 
  value, 
  color = "blue",
  mode = "light",
  showAlert = false,
  alertText = ""
}) {
  const colorClasses = {
    blue: {
      bg: "bg-blue-500",
      bgLight: "bg-blue-50",
      bgGradient: "bg-gradient-to-r from-blue-50 to-blue-100",
      border: "border-blue-200",
      text: "text-blue-700",
      textLight: "text-blue-600",
      textDark: "text-blue-800"
    },
    green: {
      bg: "bg-green-500",
      bgLight: "bg-green-50",
      bgGradient: "bg-gradient-to-r from-green-50 to-green-100",
      border: "border-green-200",
      text: "text-green-700",
      textLight: "text-green-600",
      textDark: "text-green-800"
    },
    red: {
      bg: "bg-red-500",
      bgLight: "bg-red-50",
      bgGradient: "bg-gradient-to-r from-red-50 to-red-100",
      border: "border-red-200",
      text: "text-red-700",
      textLight: "text-red-600",
      textDark: "text-red-800"
    },
    amber: {
      bg: "bg-amber-500",
      bgLight: "bg-amber-50",
      bgGradient: "bg-gradient-to-r from-amber-50 to-amber-100",
      border: "border-amber-200",
      text: "text-amber-700",
      textLight: "text-amber-600",
      textDark: "text-amber-800"
    },
    orange: {
      bg: "bg-orange-500",
      bgLight: "bg-orange-50",
      bgGradient: "bg-gradient-to-r from-orange-50 to-orange-100",
      border: "border-orange-200",
      text: "text-orange-700",
      textLight: "text-orange-600",
      textDark: "text-orange-800"
    },
    gray: {
      bg: "bg-gray-500",
      bgLight: "bg-gray-50",
      bgGradient: "bg-gradient-to-r from-gray-50 to-gray-100",
      border: "border-gray-200",
      text: "text-gray-700",
      textLight: "text-gray-600",
      textDark: "text-gray-800"
    }
  };

  const classes = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${
      mode === "dark" 
        ? "bg-gray-700 border-gray-600" 
        : `${classes.bgGradient} ${classes.border}`
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${classes.bg}`}>
          <Icon icon={icon} className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className={`text-sm font-medium ${
            mode === "dark" ? "text-gray-200" : classes.text
          }`}>{title}</p>
          <p className={`text-xs ${
            mode === "dark" ? "text-gray-400" : classes.textLight
          }`}>{subtitle}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-lg font-bold ${
          mode === "dark" ? "text-white" : classes.textDark
        }`}>{value}</p>
        {showAlert && (
          <div className="flex items-center justify-end mt-1">
            <Icon icon="mdi:alert-circle" className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-xs text-red-600 font-medium">{alertText}</span>
          </div>
        )}
      </div>
    </div>
  );
} 