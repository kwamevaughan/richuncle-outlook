import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";

function formatCurrency(amount) {
  return `GHS ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const WALKIN_ID = "__walkin__";
const ONLINE_ID = "__online__";

export default function TopCustomersCard() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [customersRes, ordersRes] = await Promise.all([
          fetch("/api/customers").then((res) => res.json()),
          fetch("/api/orders").then((res) => res.json()),
        ]);
        if (!customersRes.success || !ordersRes.success) throw new Error("Failed to fetch data");
        setCustomers(customersRes.data || []);
        setOrders(ordersRes.data || []);
      } catch {
        setCustomers([]);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Aggregate order count and total spent per customer
  const customerMap = {};
  // Add registered customers
  customers.forEach((customer) => {
    customerMap[customer.id] = {
      ...customer,
      orderCount: 0,
      totalSpent: 0,
      isSpecial: false,
    };
  });
  // Add special customers
  customerMap[WALKIN_ID] = {
    id: WALKIN_ID,
    name: "Walk In Customers",
    image_url: null,
    orderCount: 0,
    totalSpent: 0,
    isSpecial: true,
    specialType: "walkin",
  };
  customerMap[ONLINE_ID] = {
    id: ONLINE_ID,
    name: "Online Customers",
    image_url: null,
    orderCount: 0,
    totalSpent: 0,
    isSpecial: true,
    specialType: "online",
  };

  // Aggregate orders
  orders.forEach((o) => {
    let key = o.customer_id;
    if (!key || key === "" || key === null) {
      key = WALKIN_ID;
    } else if (o.order_type === "online" || key === ONLINE_ID) {
      key = ONLINE_ID;
    }
    if (!customerMap[key]) {
      // Defensive: create a fallback for unknown customer ids
      customerMap[key] = {
        id: key,
        name: o.customer_name || "Unknown Customer",
        country: "-",
        image_url: null,
        orderCount: 0,
        totalSpent: 0,
        isSpecial: true,
        specialType: "unknown",
      };
    }
    customerMap[key].orderCount += 1;
    customerMap[key].totalSpent += Number(o.total || 0);
  });

  // Prepare list
  const customerStats = Object.values(customerMap);
  // Only show those with at least 1 order
  const topCustomers = customerStats
    .filter((c) => c.orderCount > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  function orderLabel(count) {
    return `${count} ${count === 1 ? "Order" : "Orders"}`;
  }

  return (
    <div className="">
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <span className="bg-blue-50 p-2 rounded-full">
            <Icon
              icon="mynaui:users"
              className="text-blue-500 text-lg"
            />
          </span>
          <span className="font-bold text-lg">Top Customers</span>
        </div>
        <a
          href="/customers"
          className="text-sm font-medium text-blue-900 hover:underline"
        >
          View All
        </a>
      </div>
      <div className="divide-y ">
        {loading ? (
          <div className="py-8 text-center text-gray-400">Loading...</div>
        ) : topCustomers.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            No customers found
          </div>
        ) : (
          topCustomers.map((c, idx) => (
            <div key={c.id} className="flex items-center gap-4 py-4">
              {c.image_url && !c.isSpecial ? (
                <Image
                  src={c.image_url}
                  alt={c.name}
                  width={48}
                  height={48}
                  className="w-10 h-10 rounded-lg object-cover border"
                />
              ) : (
                <span
                  className={`inline-block w-10 h-10 rounded-lg flex items-center justify-center ${
                    c.specialType === "online"
                      ? "bg-blue-100 text-blue-500"
                      : c.specialType === "walkin"
                      ? "bg-gray-200 text-gray-400"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  <Icon
                    icon={
                      c.specialType === "online"
                        ? "mdi:cart-arrow-down"
                        : "mynaui:users"
                    }
                    className="w-6 h-6 text-blue-500"
                  />
                </span>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-md text-gray-900 leading-tight">
                  {c.name}
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-sm mt-0.5">
                  <span className="mx-1 text-blue-500">•</span>
                  <span className="text-xs">{orderLabel(c.orderCount)}</span>
                </div>
              </div>
              <div className="font-bold text-md text-gray-900 whitespace-nowrap">
                {formatCurrency(c.totalSpent)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 