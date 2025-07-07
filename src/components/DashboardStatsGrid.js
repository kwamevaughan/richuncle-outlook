import React from "react";
import { Icon } from "@iconify/react";

const cardStyles = {
  sales: "bg-orange-400 text-white",
  salesReturn: "bg-blue-900 text-white",
  purchase: "bg-teal-600 text-white",
  purchaseReturn: "bg-blue-600 text-white",
};

const iconBgStyles = {
  sales: "bg-white/80 text-orange-500",
  salesReturn: "bg-white/80 text-blue-900",
  purchase: "bg-white/80 text-teal-600",
  purchaseReturn: "bg-white/80 text-blue-600",
};

const DashboardStatsGrid = ({
  stats = [
    {
      label: "Total Sales",
      value: "$48,988,078",
      icon: "mdi:file-document-outline",
      color: "sales",
      change: "+22%",
      changeType: "up",
    },
    {
      label: "Total Sales Return",
      value: "$16,478,145",
      icon: "mdi:swap-horizontal",
      color: "salesReturn",
      change: "-22%",
      changeType: "down",
    },
    {
      label: "Total Purchase",
      value: "$24,145,789",
      icon: "mdi:gift-outline",
      color: "purchase",
      change: "+22%",
      changeType: "up",
    },
    {
      label: "Total Purchase Return",
      value: "$18,458,747",
      icon: "mdi:shield-check-outline",
      color: "purchaseReturn",
      change: "+22%",
      changeType: "up",
    },
  ],
}) => {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-6">
      {stats.map((stat, idx) => (
        <div
          key={stat.label}
          className={`flex items-center rounded-xl p-4 shadow-sm ${cardStyles[stat.color]}`}
        >
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg mr-6 ${iconBgStyles[stat.color]}`}>
            <Icon icon={stat.icon} className="text-2xl" />
          </div>
          <div className="flex-1">
            <div className="text-md font-medium mb-1">{stat.label}</div>
            <div className="flex items-center gap-3">
              <span className="text-md font-bold tracking-tight">{stat.value}</span>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
                  stat.changeType === "up"
                    ? "bg-white/80 text-green-700"
                    : "bg-white/80 text-red-600"
                }`}
              >
                {stat.changeType === "up" ? (
                  <Icon icon="mdi:arrow-up" className="w-4 h-4 mr-1" />
                ) : (
                  <Icon icon="mdi:arrow-down" className="w-4 h-4 mr-1" />
                )}
                {stat.change}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStatsGrid; 