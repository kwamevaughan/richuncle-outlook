import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";

const ranges = ["Today", "Weekly", "Monthly"];

function getDateRange(label) {
  const now = new Date();
  let start, end;
  end = new Date(now);
  end.setHours(23, 59, 59, 999);
  if (label === "Today") {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
  } else if (label === "Weekly") {
    start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (label === "Monthly") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
  } else {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
  }
  return { start, end };
}

const statusColors = {
  Processing: "bg-purple-100 text-purple-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-500 text-white",
  Onhold: "bg-cyan-100 text-cyan-700",
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    return "Today";
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function RecentSalesCard({ selectedStore }) {
  const [range, setRange] = useState("Weekly");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sales, setSales] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    async function fetchSales() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/orders");
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to fetch sales");
        const { start, end } = getDateRange(range);
        const filtered = (json.data || []).filter((order) => {
          if (!order.timestamp) return false;
          if (selectedStore && String(order.store_id) !== String(selectedStore)) return false;
          const ts = new Date(order.timestamp);
          return ts >= start && ts <= end;
        });
        console.log('RecentSalesCard: selectedStore =', selectedStore, 'filtered sales count =', filtered.length);
        // Sort by date descending
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setSales(filtered.slice(0, 4));
      } catch (err) {
        setError(err.message || "Failed to load sales");
        setSales([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSales();
  }, [range, selectedStore]);

  const statusOptions = [
    "Processing",
    "Completed",
    "Cancelled",
    "Onhold",
  ];

  return (
    <div className="">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 ">
          <span className="bg-pink-50 p-2 rounded-full">
            <Icon icon="mdi:cube-outline" className="text-pink-500 text-lg" />
          </span>
          <span className="font-bold text-lg">Recent Sales</span>
        </div>
        <div className="relative">
          <button
            className="flex items-center gap-1 border border-gray-200 rounded-md px-3 py-1 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
            onClick={() => setOpen((v) => !v)}
          >
            <Icon icon="mdi:calendar" className="mr-1 text-xs" /> {range}
            <Icon icon="mdi:chevron-down" className="ml-1 text-base" />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              {ranges.map((r) => (
                <button
                  key={r}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    range === r ? "font-bold text-pink-600" : "text-gray-700"
                  }`}
                  onClick={() => {
                    setRange(r);
                    setOpen(false);
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <hr className="my-2 border-gray-100" />
      <div>
        {loading ? (
          <div className="py-8 text-center text-gray-400">Loading...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-500">{error}</div>
        ) : sales.length === 0 ? (
          <div className="py-8 text-center text-gray-400">No sales found.</div>
        ) : (
          sales.map((order) => {
            // Use first order item for product info (if available)
            const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
            const image = firstItem?.image_url || "/placeholder.png";
            const name = firstItem?.name || order.customer_name || "Product";
            const orderNumber = order.id ? `#${order.id}` : "";
            const price = order.total || firstItem?.price || 0;
            const status = order.status || "Processing";
            const date = formatDate(order.timestamp);
            return (
              <div
                key={order.id}
                className="flex items-center gap-4 px-2 py-3 border-b last:border-b-0 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-sm rounded-lg bg-white hover:bg-gray-50"
              >
                {image && image !== "/placeholder.png" ? (
                  <Image
                    src={image}
                    alt={name}
                    className="w-14 h-14 rounded-lg object-cover border"
                    width={56}
                    height={56}
                  />
                ) : (
                  <span className="w-12 h-12 flex items-center justify-center rounded-lg border bg-gray-50">
                    <Icon icon="iconoir:user-cart" className="text-2xl text-gray-400" />
                  </span>
                )}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="font-semibold text-md text-gray-900 truncate">{name}</div>
                  <div className="text-xs flex items-center gap-2 text-gray-700 mt-0.5">
                    <span>{orderNumber}</span>
                    <span className="text-orange-500 text-xs">•</span>
                    <span className="w-max">GHS {Number(price).toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-xs text-gray-500 font-medium mt-0.5">{date}</div>
                </div>
                <div className="flex flex-col items-end min-w-[90px] gap-1">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${statusColors[status] || statusColors["Processing"]}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 