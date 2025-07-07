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
          className={`rounded-lg p-4 flex flex-col gap-2 shadow-md ${cardStyles[stat.color]} transition-transform duration-500 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer`}
        >
          <div className="flex items-center justify-between">
            <div className={`rounded-full p-2 text-xl ${iconBgStyles[stat.color]}`}> 
              <Icon icon={stat.icon} className="text-2xl" />
            </div>
            <span className="text-lg font-bold">{stat.value}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-semibold uppercase tracking-wide">
              {stat.label}
            </span>
            <span className={`flex items-center text-xs font-bold ${stat.changeType === "up" ? "text-green-200" : "text-red-200"}`}>
              <Icon icon={stat.changeType === "up" ? "mdi:arrow-up-bold" : "mdi:arrow-down-bold"} className="mr-1" />
              {stat.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStatsGrid; 