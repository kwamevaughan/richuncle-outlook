import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import useSuppliers from "../hooks/useSuppliers";
import useUsers from "../hooks/useUsers";
import Link from "next/link";

const statsConfig = [
  {
    label: "Suppliers",
    icon: "mdi:truck-outline",
    color: "bg-gray-50 text-blue-800",
    tooltip: "Total number of suppliers in the system.",
  },
  {
    label: "Customers",
    icon: "mynaui:users",
    color: "bg-gray-50 text-blue-800",
    tooltip: "Total number of customers in the system.",
  },
  {
    label: "Orders",
    icon: "solar:cart-plus-broken",
    color: "bg-gray-50 text-blue-800",
    tooltip: "Total number of orders placed.",
  },
];

export default function OverallInfoCard() {
  const [customerCount, setCustomerCount] = useState(null);
  const [orderCount, setOrderCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {
    suppliers,
    loading: suppliersLoading,
    error: suppliersError,
  } = useSuppliers();
  const {
    stats: userStats,
    loading: usersLoading,
    error: usersError,
  } = useUsers();

  useEffect(() => {
    async function fetchCounts() {
      setLoading(true);
      setError(null);
      try {
        const [customersRes, ordersRes] = await Promise.all([
          fetch("/api/customers").then((res) => res.json()),
          fetch("/api/orders").then((res) => res.json()),
        ]);
        if (!customersRes.success)
          throw new Error(customersRes.error || "Failed to fetch customers");
        if (!ordersRes.success)
          throw new Error(ordersRes.error || "Failed to fetch orders");
        setCustomerCount(customersRes.data?.length || 0);
        setOrderCount(ordersRes.data?.length || 0);
      } catch (err) {
        setError(err.message || "Failed to fetch overall info");
      } finally {
        setLoading(false);
      }
    }
    fetchCounts();
  }, []);

  const statValues = [
    customerCount,
    suppliers?.length,
    orderCount,
    userStats?.total,
  ];
  const isAnyLoading = loading || suppliersLoading || usersLoading;
  const isAnyError = error || suppliersError || usersError;

  return (
    <div className="bg-white rounded-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2 border-b-2 border-gray-100 p-4">
        <span className="bg-blue-50 p-2 rounded-full">
          <Icon
            icon="mdi:information-outline"
            className="text-blue-500 text-lg"
          />
        </span>
        <span className="font-bold text-lg">Overall Information</span>
      </div>
      {isAnyLoading ? (
        <div className="flex-1 flex items-center justify-center text-blue-600">
          Loading...
        </div>
      ) : isAnyError ? (
        <div className="flex-1 flex items-center justify-center text-red-600">
          {isAnyError}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 flex-1 p-4">
          {statsConfig.map((stat, idx) => {
            let href = "#";
            if (stat.label === "Customers") href = "/customers";
            else if (stat.label === "Suppliers") href = "/suppliers";
            else if (stat.label === "Orders") href = "/sales";
            return (
              <Link 
                key={stat.label} 
                href={href} 
                className={`flex flex-col items-center gap-2 p-3 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl rounded-lg border ${stat.color} shadow-sm cursor-pointer focus:outline-none`}
                tabIndex={0}
                title={stat.tooltip}
              >
                <div className="relative">
                  <Icon icon={stat.icon} className="text-2xl" />
                  <span className="absolute -top-2 -right-2"></span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </span>
                  <span className="text-xl font-bold">
                    {statValues[idx] ?? "-"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
