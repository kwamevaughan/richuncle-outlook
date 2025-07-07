import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Icon } from "@iconify/react";

const dummyData = [
  { time: "2 am", purchase: 40000, sales: 15000 },
  { time: "4 am", purchase: 35000, sales: 18000 },
  { time: "6 am", purchase: 30000, sales: 10000 },
  { time: "8 am", purchase: 45000, sales: 20000 },
  { time: "10 am", purchase: 42000, sales: 21000 },
  { time: "12 am", purchase: 43000, sales: 19000 },
  { time: "14 pm", purchase: 28000, sales: 9000 },
  { time: "16 pm", purchase: 32000, sales: 17000 },
  { time: "18 pm", purchase: 60000, sales: 30000 },
  { time: "20 pm", purchase: 20000, sales: 5000 },
  { time: "22 pm", purchase: 37000, sales: 21000 },
  { time: "24 pm", purchase: 25000, sales: 12000 },
];

const timeRanges = [
  { label: "1D", value: "1D" },
  { label: "1W", value: "1W" },
  { label: "1M", value: "1M" },
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "1Y", value: "1Y" },
];

export default function SalesPurchaseChart({ data = dummyData, totalPurchase = 3000, totalSales = 1000, onRangeChange }) {
  const [selectedRange, setSelectedRange] = useState("1Y");

  // Optionally, filter data based on selectedRange here

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="bg-orange-100 p-2 rounded-full">
            <Icon icon="mdi:cart-outline" className="text-orange-400 text-2xl" />
          </span>
          <span className="font-bold text-lg">Sales & Purchase</span>
        </div>
        <div className="flex gap-1">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              className={`px-3 py-1 rounded-md text-sm font-semibold border transition-colors duration-150 ${
                selectedRange === range.value
                  ? "bg-orange-400 text-white border-orange-400"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-orange-50"
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
        <div className="flex-1 bg-gray-50 rounded-lg p-3 flex flex-col items-start justify-center">
          <span className="flex items-center gap-1 text-xs text-orange-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-orange-200 inline-block"></span>
            Total Purchase
          </span>
          <span className="text-2xl font-bold text-gray-800">{totalPurchase.toLocaleString()}K</span>
        </div>
        <div className="flex-1 bg-gray-50 rounded-lg p-3 flex flex-col items-start justify-center">
          <span className="flex items-center gap-1 text-xs text-orange-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-orange-400 inline-block"></span>
            Total Sales
          </span>
          <span className="text-2xl font-bold text-gray-800">{totalSales.toLocaleString()}K</span>
        </div>
      </div>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={0}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 13 }} />
            <YAxis tickFormatter={(v) => `${v / 1000}K`} tick={{ fontSize: 13 }} />
            <Tooltip formatter={(value) => value.toLocaleString()} />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Bar dataKey="purchase" stackId="a" fill="#FFE0B2" name="Total Purchase" radius={[6, 6, 0, 0]} />
            <Bar dataKey="sales" stackId="a" fill="#FFA726" name="Total Sales" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 