import React from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";

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
      link: undefined,
    },
    {
      label: "Total Sales Return",
      value: "$16,478,145",
      icon: "mdi:swap-horizontal",
      color: "salesReturn",
      change: "-22%",
      changeType: "down",
      link: undefined,
    },
    {
      label: "Total Purchase",
      value: "$24,145,789",
      icon: "mdi:gift-outline",
      color: "purchase",
      change: "+22%",
      changeType: "up",
      link: undefined,
    },
    {
      label: "Total Purchase Return",
      value: "$18,458,747",
      icon: "mdi:shield-check-outline",
      color: "purchaseReturn",
      change: "+22%",
      changeType: "up",
      link: undefined,
    },
  ],
}) => {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-6 items-stretch">
      {stats.map((stat, idx) => {
        const card = (
          <div
            key={stat.label}
            className={`h-full flex flex-col rounded-lg p-4 gap-2 shadow-md ${
              cardStyles[stat.color]
            } transition-transform duration-500 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer`}
          >
            <div className="flex items-center justify-start gap-4">
              <div
                className={`rounded-lg p-2 text-xl ${iconBgStyles[stat.color]}`}
              >
                <Icon icon={stat.icon} className="text-2xl" />
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-wide">
                  {stat.label}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold">{stat.value}</span>
                  <span
                    className={`flex items-center text-xs font-normal rounded-md px-2 py-1
                      ${
                        stat.changeType === "up"
                          ? "text-green-700 bg-green-100"
                          : "text-red-700 bg-red-100"
                      }`}
                  >
                    <Icon
                      icon={
                        stat.changeType === "up"
                          ? "mdi:arrow-up-bold"
                          : "mdi:arrow-down-bold"
                      }
                      className="mr-0.5"
                    />
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
        return stat.link ? (
          <Link
            href={stat.link}
            key={stat.label}
            style={{ textDecoration: "none" }}
          >
            {card}
          </Link>
        ) : (
          card
        );
      })}
    </div>
  );
};

export default DashboardStatsGrid;
