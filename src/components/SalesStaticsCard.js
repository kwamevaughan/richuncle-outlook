import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import TooltipIconButton from "./TooltipIconButton";

const years = [2025, 2024, 2023];
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getMonthIndex(date) {
  return new Date(date).getMonth();
}

function getYear(date) {
  return new Date(date).getFullYear();
}

export default function SalesStaticsCard({ selectedStore }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState(0);
  const [expense, setExpense] = useState(0);
  const [revenueChange, setRevenueChange] = useState(0);
  const [expenseChange, setExpenseChange] = useState(0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch order items and purchases
        const [orderItemsRes, purchasesRes] = await Promise.all([
          fetch("/api/order-items"),
          fetch("/api/purchases"),
        ]);
        const [orderItemsJson, purchasesJson] = await Promise.all([
          orderItemsRes.json(),
          purchasesRes.json(),
        ]);
        const orderItems = orderItemsJson.data || [];
        const purchases = purchasesJson.data || [];
        // Aggregate revenue by month for selected year
        const monthlyRevenue = Array(12).fill(0);
        let orderItemCount = 0;
        orderItems.forEach(item => {
          const ts = item.orders?.timestamp;
          if (!ts) return;
          if (selectedStore && String(item.orders?.store_id) !== String(selectedStore)) return;
          orderItemCount++;
          const d = new Date(ts);
          if (d.getFullYear() === year) {
            const idx = d.getMonth();
            monthlyRevenue[idx] += (Number(item.price) || 0) * (Number(item.quantity) || 0);
          }
        });
        // Aggregate expense by month for selected year
        const monthlyExpense = Array(12).fill(0);
        let purchaseCount = 0;
        purchases.forEach(p => {
          if (!p.date) return;
          if (selectedStore && String(p.store_id) !== String(selectedStore)) return;
          purchaseCount++;
          const d = new Date(p.date);
          if (d.getFullYear() === year) {
            const idx = d.getMonth();
            monthlyExpense[idx] += Number(p.total) || 0;
          }
        });
        console.log('SalesStaticsCard: selectedStore =', selectedStore, 'order items count =', orderItemCount, 'purchases count =', purchaseCount);
        // Prepare chart data
        const chartData = monthLabels.map((month, i) => ({
          month,
          revenue: monthlyRevenue[i],
          expense: -monthlyExpense[i],
        }));
        setData(chartData);
        // Calculate total revenue/expense for this year
        const totalRevenue = monthlyRevenue.reduce((a, b) => a + b, 0);
        const totalExpense = monthlyExpense.reduce((a, b) => a + b, 0);
        setRevenue(totalRevenue);
        setExpense(totalExpense);
        // Calculate previous year for change
        const prevYear = year - 1;
        // Revenue prev year
        const prevRevenue = orderItems.reduce((sum, item) => {
          const ts = item.orders?.timestamp;
          if (!ts) return sum;
          const d = new Date(ts);
          if (d.getFullYear() === prevYear) {
            return sum + (Number(item.price) || 0) * (Number(item.quantity) || 0);
          }
          return sum;
        }, 0);
        // Expense prev year
        const prevExpense = purchases.reduce((sum, p) => {
          if (!p.date) return sum;
          const d = new Date(p.date);
          if (d.getFullYear() === prevYear) {
            return sum + (Number(p.total) || 0);
          }
          return sum;
        }, 0);
        setRevenueChange(prevRevenue === 0 ? 100 : ((totalRevenue - prevRevenue) / prevRevenue) * 100);
        setExpenseChange(prevExpense === 0 ? 100 : ((totalExpense - prevExpense) / prevExpense) * 100);
      } catch (err) {
        setData([]);
        setRevenue(0);
        setExpense(0);
        setRevenueChange(0);
        setExpenseChange(0);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [year, selectedStore]);

  return (
    <div className="">
      <div className="flex items-center justify-between mb-4 border-b-2 border-gray-100 pb-2">
        <div className="flex items-center gap-2 ">
          <span className="bg-red-50 p-2 rounded-full">
            <Icon
              icon="mdi:alert-circle-outline"
              className="text-red-500 text-lg"
            />
          </span>
          <span className="font-bold text-xl">Sales Statistics</span>
        </div>
        <div className="relative">
          <button
            className="flex items-center gap-1 border border-gray-200 rounded-md px-3 py-1 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
          >
            <Icon icon="mdi:calendar" className="mr-1 text-base" /> {year}
            <Icon icon="mdi:chevron-down" className="ml-1 text-base" />
          </button>
          {yearDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
              {years.map((y) => (
                <button
                  key={y}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-md last:rounded-b-md ${
                    y === year
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-700"
                  }`}
                  onClick={() => {
                    setYear(y);
                    setYearDropdownOpen(false);
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-4 mb-4 p-4">
        <div className="border border-gray-200 rounded-lg p-3 flex flex-col items-start justify-center">
          <span className="flex items-center gap-1 text-xs text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
            Total Revenue
            <TooltipIconButton
              icon="mdi:information-outline"
              label="Sum of all revenue in the selected range"
              className="ml-1"
            />
          </span>
          <span className="text-2xl font-bold text-gray-800">
            {loading
              ? "..."
              : `GHS ${revenue.toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}`}
          </span>
        </div>
        <div className="border border-gray-200 rounded-lg p-3 flex flex-col items-start justify-center">
          <span className="flex items-center gap-1 text-xs text-red-600">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
            Total Expense
            <TooltipIconButton
              icon="mdi:information-outline"
              label="Sum of all expenses in the selected range"
              className="ml-1"
            />
          </span>
          <span className="text-2xl font-bold text-gray-800">
            {loading
              ? "..."
              : `GHS ${expense.toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}`}
          </span>
        </div>
      </div>
      <div className="w-full h-72">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Loading...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={0}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 13 }} />
              <YAxis
                tickFormatter={(v) => `${v / 1000}K`}
                tick={{ fontSize: 13 }}
              />
              <Tooltip formatter={(value) => `GHS ${value.toLocaleString()}`} />
              <Bar
                dataKey="revenue"
                stackId="a"
                fill="#16a34a"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="expense"
                stackId="a"
                fill="#ef4444"
                radius={[0, 0, 6, 6]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
} 