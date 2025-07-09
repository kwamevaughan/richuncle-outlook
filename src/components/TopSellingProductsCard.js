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

function getPrevDateRange(label) {
  const now = new Date();
  let start, end;
  if (label === "Today") {
    end = new Date(now);
    end.setDate(now.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    start = new Date(end);
    start.setHours(0, 0, 0, 0);
  } else if (label === "Weekly") {
    end = new Date(now);
    end.setDate(now.getDate() - 7);
    end.setHours(23, 59, 59, 999);
    start = new Date(end);
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (label === "Monthly") {
    end = new Date(now.getFullYear(), now.getMonth(), 0);
    end.setHours(23, 59, 59, 999);
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    start.setHours(0, 0, 0, 0);
  } else {
    end = new Date(now);
    end.setDate(now.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    start = new Date(end);
    start.setHours(0, 0, 0, 0);
  }
  return { start, end };
}

export default function TopSellingProductsCard() {
  const [range, setRange] = useState("Today");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [orderItemsRes, productsRes] = await Promise.all([
          fetch("/api/order-items"),
          fetch("/api/products"),
        ]);
        const [orderItemsJson, productsJson] = await Promise.all([
          orderItemsRes.json(),
          productsRes.json(),
        ]);
        if (!orderItemsJson.success || !productsJson.success) {
          throw new Error("Failed to fetch data");
        }
        const orderItems = orderItemsJson.data || [];
        const products = productsJson.data || [];
        
        // Get current and previous date ranges
        const { start, end } = getDateRange(range);
        const { start: prevStart, end: prevEnd } = getPrevDateRange(range);
        
        // Filter order items by current range
        const filteredItems = orderItems.filter(
          (item) => {
            const ts = item.orders?.timestamp ? new Date(item.orders.timestamp) : null;
            return ts && ts >= start && ts <= end && item.product_id;
          }
        );
        
        // Filter order items by previous range
        const prevFilteredItems = orderItems.filter(
          (item) => {
            const ts = item.orders?.timestamp ? new Date(item.orders.timestamp) : null;
            return ts && ts >= prevStart && ts <= prevEnd && item.product_id;
          }
        );
        
        // Aggregate sales by product_id for current period
        const salesMap = {};
        filteredItems.forEach((item) => {
          if (!salesMap[item.product_id]) {
            salesMap[item.product_id] = { quantity: 0, revenue: 0 };
          }
          salesMap[item.product_id].quantity += Number(item.quantity) || 0;
          salesMap[item.product_id].revenue += (Number(item.price) || 0) * (Number(item.quantity) || 0);
        });
        
        // Aggregate sales by product_id for previous period
        const prevSalesMap = {};
        prevFilteredItems.forEach((item) => {
          if (!prevSalesMap[item.product_id]) {
            prevSalesMap[item.product_id] = { quantity: 0, revenue: 0 };
          }
          prevSalesMap[item.product_id].quantity += Number(item.quantity) || 0;
          prevSalesMap[item.product_id].revenue += (Number(item.price) || 0) * (Number(item.quantity) || 0);
        });
        
        // Join with product info and calculate percentage change
        const productList = Object.entries(salesMap)
          .map(([productId, stats]) => {
            const product = products.find((p) => p.id === productId);
            const prevStats = prevSalesMap[productId] || { quantity: 0, revenue: 0 };
            
            // Calculate percentage change
            let change = 0;
            let up = true;
            if (prevStats.quantity > 0) {
              change = ((stats.quantity - prevStats.quantity) / prevStats.quantity) * 100;
              up = change >= 0;
            } else if (stats.quantity > 0) {
              change = 100; // New product with sales
              up = true;
            }
            
            return product
              ? {
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image_url,
                  sales: stats.quantity,
                  revenue: stats.revenue,
                  change: Math.round(change),
                  up: up,
                }
              : null;
          })
          .filter(Boolean)
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5); // Top 5
        setTopProducts(productList);
      } catch (err) {
        setError(err.message || "Failed to load data");
        setTopProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [range]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-gray-100">
        <div className="flex items-center gap-2 ">
          <span className="bg-blue-50 p-2 rounded-full">
            <Icon
              icon="hugeicons:chart-increase"
              className="text-blue-500 text-lg"
            />
          </span>
          <span className="font-bold text-lg">Top Selling Products</span>
        </div>
        <div className="relative">
          <button
            className="flex items-center gap-1 border border-gray-200 rounded-md px-3 py-1 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
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
                    range === r ? "font-bold text-blue-600" : "text-gray-700"
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
      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="py-8 text-center text-gray-400">Loading...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-500">{error}</div>
        ) : topProducts.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            No sales found for this period.
          </div>
        ) : (
          topProducts.map((product, idx) => (
            <div
              key={product.id}
              className={`flex items-center gap-4 py-4 ${
                idx === 0 ? "pt-0" : ""
              }`}
            >
              <Image
                src={product.image || "/placeholder.png"}
                alt={product.name}
                className="w-14 h-14 rounded-lg object-cover border"
                width={56}
                height={56}
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-md text-gray-900 truncate">
                  {product.name}
                </div>
                <div className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                  <span>
                    GHS{" "}
                    {product.price.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-orange-500 text-xs">•</span>
                  <span>{product.sales}+ Sales</span>
                </div>
              </div>
              <div className="flex flex-col items-end min-w-[60px]">
                <span
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold
                    ${
                      product.up
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600 border border-red-200"
                    }
                  `}
                >
                  <Icon
                    icon={
                      product.up ? "mdi:arrow-up-bold" : "mdi:arrow-down-bold"
                    }
                    className={
                      product.up
                        ? "text-green-500 text-sm"
                        : "text-red-500 text-sm"
                    }
                  />
                  {product.change}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}