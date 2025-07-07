import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Icon } from "@iconify/react";

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

function groupProfitLossByHourToday(items) {
  // Returns array of 24 hours with profit and loss for each hour
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
        console.log('Fetched order-items:', items);
        console.log('Selected Range:', selectedRange);
        const grouped = groupProfitLossByHourToday(items);
        console.log('Grouped by hour result:', grouped);
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
          </span>
          <span className="text-2xl font-bold text-gray-800">
            {loading ? "..." : totalProfit.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="border border-gray-200 rounded-lg p-3 flex flex-col items-start justify-center">
          <span className="flex items-center gap-1 text-xs text-red-600">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
            Total Loss
          </span>
          <span className="text-2xl font-bold text-gray-800">
            {loading ? "..." : totalLoss.toLocaleString("en-US", { maximumFractionDigits: 0 })}
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
            <Tooltip formatter={(value) => value.toLocaleString()} />
            <Legend verticalAlign="top" height={36} iconType="circle" />
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