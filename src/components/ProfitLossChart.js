import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Icon } from "@iconify/react";
import { format, subDays, subWeeks, startOfWeek, addDays } from "date-fns";
import TooltipIconButton from "@/components/TooltipIconButton";

const timeRanges = [
  { label: "1D", value: "1D" },
  { label: "1W", value: "1W" },
  { label: "1M", value: "1M" },
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "1Y", value: "1Y" },
];

function getHourLabel(hour) {
  if (hour === 0) return "12 am";
  if (hour < 12) return `${hour} am`;
  if (hour === 12) return "12 pm";
  return `${hour - 12} pm`;
}

function groupByHour(items) {
  const hours = Array.from({ length: 24 }, (_, i) => ({
    time: getHourLabel(i),
    profit: 0,
    loss: 0,
  }));
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  items.forEach(item => {
    if (!item.orders || !item.orders.timestamp) return;
    const date = new Date(item.orders.timestamp);
    if (date.toISOString().slice(0, 10) === todayStr) {
      const hour = date.getHours();
      const revenue = Number(item.price) * Number(item.quantity);
      const cost = Number(item.cost_price || 0) * Number(item.quantity);
      const profit = revenue - cost;
      if (profit >= 0) {
        hours[hour].profit += profit;
      } else {
        hours[hour].loss += Math.abs(profit);
      }
    }
  });
  return hours;
}

function groupByDay(items, days) {
  // days: how many days back from today
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const label = format(d, "MMM d");
    result.push({ time: label, profit: 0, loss: 0, date: format(d, "yyyy-MM-dd") });
  }
  items.forEach(item => {
    if (!item.orders || !item.orders.timestamp) return;
    const date = new Date(item.orders.timestamp);
    const dateStr = format(date, "yyyy-MM-dd");
    const found = result.find(r => r.date === dateStr);
    if (found) {
      const revenue = Number(item.price) * Number(item.quantity);
      const cost = Number(item.cost_price || 0) * Number(item.quantity);
      const profit = revenue - cost;
      if (profit >= 0) {
        found.profit += profit;
      } else {
        found.loss += Math.abs(profit);
      }
    }
  });
  return result.map(({ date, ...rest }) => rest);
}

function groupByWeek(items, weeks) {
  // weeks: how many weeks back from today
  const result = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 }); // Monday
    const end = addDays(start, 6);
    const label = `${format(start, "MMM d")}-${format(end, "MMM d")}`;
    result.push({ time: label, profit: 0, loss: 0, start, end });
  }
  items.forEach(item => {
    if (!item.orders || !item.orders.timestamp) return;
    const date = new Date(item.orders.timestamp);
    for (const r of result) {
      if (date >= r.start && date <= r.end) {
        const revenue = Number(item.price) * Number(item.quantity);
        const cost = Number(item.cost_price || 0) * Number(item.quantity);
        const profit = revenue - cost;
        if (profit >= 0) {
          r.profit += profit;
        } else {
          r.loss += Math.abs(profit);
        }
        break;
      }
    }
  });
  return result.map(({ start, end, ...rest }) => rest);
}

export default function ProfitLossChart({ onRangeChange }) {
  const [selectedRange, setSelectedRange] = useState("1D");
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalLoss, setTotalLoss] = useState(0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch("/api/order-items");
        const json = await res.json();
        const items = json.data || [];
        let grouped = [];
        if (selectedRange === "1D") {
          grouped = groupByHour(items);
        } else if (selectedRange === "1W") {
          grouped = groupByDay(items, 7);
        } else if (selectedRange === "1M") {
          grouped = groupByDay(items, 30);
        } else if (selectedRange === "3M") {
          grouped = groupByWeek(items, 13); // 13 weeks ≈ 3 months
        } else if (selectedRange === "6M") {
          grouped = groupByWeek(items, 26); // 26 weeks ≈ 6 months
        } else if (selectedRange === "1Y") {
          grouped = groupByWeek(items, 52); // 52 weeks = 1 year
        }
        setChartData(grouped);
        setTotalProfit(grouped.reduce((sum, h) => sum + h.profit, 0));
        setTotalLoss(grouped.reduce((sum, h) => sum + h.loss, 0));
      } catch (err) {
        setChartData([]);
        setTotalProfit(0);
        setTotalLoss(0);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedRange]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="bg-green-50 p-2 rounded-full">
            <Icon
              icon="hugeicons:chart-increase"
              className="text-green-500 text-lg"
            />
          </span>
          <span className="font-bold text-lg">Profit vs Loss</span>
        </div>
        <div className="flex gap-1">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              className={`px-3 py-1 rounded-md text-sm font-semibold border transition-colors duration-150 ${
                selectedRange === range.value
                  ? "bg-green-500 text-white border-green-500"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-green-50"
              }`}
              onClick={() => {
                setSelectedRange(range.value);
                if (onRangeChange) onRangeChange(range.value);
              }}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-4 mb-4">
        <div className="border border-gray-200 rounded-lg p-3 flex flex-col items-start justify-center">
          <span className="flex items-center gap-1 text-xs text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
            Total Profit
            <TooltipIconButton
              icon="mdi:information-outline"
              label="Sum of all positive profits in the selected range"
              className="ml-1"
            />
          </span>
          <span className="text-2xl font-bold text-gray-800">
            {loading ? "..." : `GHS ${totalProfit.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          </span>
        </div>
        <div className="border border-gray-200 rounded-lg p-3 flex flex-col items-start justify-center">
          <span className="flex items-center gap-1 text-xs text-red-600">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
            Total Loss
            <TooltipIconButton
              icon="mdi:information-outline"
              label="Sum of all negative profits (as positive values) in the selected range"
              className="ml-1"
            />
          </span>
          <span className="text-2xl font-bold text-gray-800">
            {loading ? "..." : `GHS ${totalLoss.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          </span>
        </div>
      </div>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={0}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 13 }} />
            <YAxis
              tickFormatter={(v) => `${v / 1000}K`}
              tick={{ fontSize: 13 }}
            />
            <Tooltip formatter={(value) => `GHS ${value.toLocaleString()}`} />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ display: 'none' }} />
            <Bar
              dataKey="profit"
              stackId="a"
              fill="#4ade80"
              name="Profit"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="loss"
              stackId="a"
              fill="#f87171"
              name="Loss"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 