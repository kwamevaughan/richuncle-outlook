import React, { useState, useEffect } from "react";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Icon } from "@iconify/react";
import TooltipIconButton from "./TooltipIconButton";

const COLORS = ["#34d399", "#f59e42"];

export default function CustomersOverviewCard({ selectedStore }) {
  const [range, setRange] = useState("Today");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [firstTimeCount, setFirstTimeCount] = useState(0);
  const [returnCount, setReturnCount] = useState(0);
  const [prevFirstTimeCount, setPrevFirstTimeCount] = useState(0);
  const [prevReturnCount, setPrevReturnCount] = useState(0);
  const ranges = ["Today", "Weekly", "Monthly"];

  // Helper to get date range
  function getDateRange(label) {
    const now = new Date();
    let start, end;
    if (label === "Today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (label === "Weekly") {
      const day = now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (label === "Monthly") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    return { start, end };
  }

  // Helper to get previous range
  function getPrevDateRange(label) {
    const now = new Date();
    let start, end;
    if (label === "Today") {
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
    } else if (label === "Weekly") {
      const day = now.getDay();
      const lastWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day - 7);
      const lastWeekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day - 1, 23, 59, 59, 999);
      start = lastWeekStart;
      end = lastWeekEnd;
    } else if (label === "Monthly") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      start = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      end = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    return { start, end };
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [ordersRes, customersRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/customers"),
        ]);
        const [ordersJson, customersJson] = await Promise.all([
          ordersRes.json(),
          customersRes.json(),
        ]);
        const orders = ordersJson.data || [];
        const customers = customersJson.data || [];
        // Get current and previous date ranges
        const { start, end } = getDateRange(range);
        const { start: prevStart, end: prevEnd } = getPrevDateRange(range);
        // Filter orders by range and store
        const ordersInRange = orders.filter(o => o.timestamp && new Date(o.timestamp) >= start && new Date(o.timestamp) <= end && o.customer_id && (!selectedStore || String(o.store_id) === String(selectedStore)));
        const prevOrdersInRange = orders.filter(o => o.timestamp && new Date(o.timestamp) >= prevStart && new Date(o.timestamp) <= prevEnd && o.customer_id && (!selectedStore || String(o.store_id) === String(selectedStore)));
        // Group orders by customer
        const ordersByCustomer = {};
        orders.forEach(o => {
          if (!o.customer_id || !o.timestamp) return;
          if (!ordersByCustomer[o.customer_id]) ordersByCustomer[o.customer_id] = [];
          ordersByCustomer[o.customer_id].push(new Date(o.timestamp));
        });
        // For current range
        let firstTime = 0, returning = 0;
        const seen = new Set();
        ordersInRange.forEach(o => {
          if (seen.has(o.customer_id)) return;
          seen.add(o.customer_id);
          const allDates = ordersByCustomer[o.customer_id].sort((a, b) => a - b);
          if (allDates[0] >= start && allDates[0] <= end) {
            firstTime++;
          } else {
            returning++;
          }
        });
        // For previous range
        let prevFirstTime = 0, prevReturning = 0;
        const prevSeen = new Set();
        prevOrdersInRange.forEach(o => {
          if (prevSeen.has(o.customer_id)) return;
          prevSeen.add(o.customer_id);
          const allDates = ordersByCustomer[o.customer_id].sort((a, b) => a - b);
          if (allDates[0] >= prevStart && allDates[0] <= prevEnd) {
            prevFirstTime++;
          } else {
            prevReturning++;
          }
        });
        setFirstTimeCount(firstTime);
        setReturnCount(returning);
        setPrevFirstTimeCount(prevFirstTime);
        setPrevReturnCount(prevReturning);
      } catch (err) {
        setFirstTimeCount(0);
        setReturnCount(0);
        setPrevFirstTimeCount(0);
        setPrevReturnCount(0);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [range, selectedStore]);

  // Calculate percentage change
  function getChange(current, prev) {
    if (prev === 0) return current === 0 ? 0 : 100;
    return ((current - prev) / prev) * 100;
  }

  const data = [
    {
      name: "First Time",
      value: firstTimeCount,
      fill: "#f59e42",
      percent: getChange(firstTimeCount, prevFirstTimeCount),
    },
    {
      name: "Return",
      value: returnCount,
      fill: "#34d399",
      percent: getChange(returnCount, prevReturnCount),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 ">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-md">Customers Overview</span>
        <div className="relative">
          <button
            className="flex items-center gap-1 border border-gray-200 rounded-md px-3 py-1 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            onClick={() => setOpen((v) => !v)}
          >
            <Icon icon="mdi:calendar" className="mr-1 text-lg" /> {range}
            <Icon icon="mdi:chevron-down" className="ml-1 text-base" />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              {ranges.map((r) => (
                <button
                  key={r}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${range === r ? "font-bold text-blue-600" : "text-gray-700"}`}
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
      <div className="flex items-center gap-6">
        <div className="w-28 h-28 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              width={112}
              height={112}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="100%"
              barSize={28}
              data={data}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, Math.max(firstTimeCount, returnCount, 10)]}
                angleAxisId={0}
                tick={false}
              />
              {data.map((entry, idx) => (
                <RadialBar
                  key={entry.name}
                  minAngle={15}
                  background
                  clockWise
                  dataKey="value"
                  cornerRadius={14}
                  data={[entry]}
                  fill={entry.fill}
                  barSize={28}
                  isAnimationActive={false}
                />
              ))}
              <RechartsTooltip
                formatter={(value, name, props) => [`${value.toLocaleString()}`, props.payload.name]}
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 flex gap-6 items-center">
          <div className="flex flex-col items-center flex-1">
            <span className="text-2xl font-bold text-gray-900">{loading ? '...' : firstTimeCount.toLocaleString()}</span>
            <span className="text-orange-500 font-medium text-sm mt-1">First Time</span>
            <span className="mt-2">
              <span className="bg-green-100 text-green-700 rounded-md px-2 py-0.5 text-xs font-semibold flex items-center gap-1">
                <Icon icon="mdi:arrow-up-bold" className="text-sm" />
                {loading ? '...' : `${getChange(firstTimeCount, prevFirstTimeCount).toFixed(0)}%`}
              </span>
            </span>
          </div>
          <div className="border-l h-12 border-gray-200"></div>
          <div className="flex flex-col items-center flex-1">
            <span className="text-2xl font-bold text-gray-900">{loading ? '...' : returnCount.toLocaleString()}</span>
            <span className="text-emerald-600 font-medium text-sm mt-1">Return</span>
            <span className="mt-2">
              <span className="bg-green-100 text-green-700 rounded-md px-2 py-0.5 text-xs font-semibold flex items-center gap-1">
                <Icon icon="mdi:arrow-up-bold" className="text-sm" />
                {loading ? '...' : `${getChange(returnCount, prevReturnCount).toFixed(0)}%`}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 