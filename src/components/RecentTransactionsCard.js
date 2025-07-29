import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import TooltipIconButton from "./TooltipIconButton";

const statusColors = {
  Completed: "bg-green-100 text-green-700 border-green-400",
  Pending: "bg-blue-100 text-blue-700 border-blue-400",
  Cancelled: "bg-red-100 text-red-700 border-red-400",
  paid: "bg-green-100 text-green-700 border-green-400",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-400",
  overdue: "bg-red-100 text-red-700 border-red-400",
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function RecentTransactionsCard({ selectedStore }) {
  const [tab, setTab] = useState("Purchase");
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    if (tab === "Purchase") {
      fetch("/api/purchases")
        .then((res) => res.json())
        .then((json) => {
          if (!json.success) throw new Error(json.error || "Failed to fetch");
          setPurchases((json.data || []).filter(p => !selectedStore || String(p.store_id) === String(selectedStore)));
        })
        .catch((err) => setError(err.message || "Failed to load"))
        .finally(() => setLoading(false));
    } else if (tab === "Expenses") {
      fetch("/api/expenses")
        .then((res) => res.json())
        .then((json) => {
          if (!json.success) throw new Error(json.error || "Failed to fetch");
          setExpenses(json.data || []);
        })
        .catch((err) => setError(err.message || "Failed to load"))
        .finally(() => setLoading(false));
    }
  }, [tab]);

  return (
    <div className="bg-white rounded-xl shadow p-0 w-full">
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <span className="bg-blue-50 p-2 rounded-full">
            <Icon icon="ph:flag-duotone" className="text-blue-500 text-lg" />
          </span>
          <span className="font-bold text-lg">Recent Transactions</span>
        </div>
        <a href={tab === "Purchase" ? "/purchases" : "/expenses"} className="text-sm font-medium text-blue-900 hover:underline">View All</a>
      </div>
      <div className="flex border-b">
        <button
          className={`flex-1 py-2 text-center font-semibold text-md border-b-2 transition-colors duration-150 ${
            tab === "Purchase"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-blue-500"
          }`}
          onClick={() => setTab("Purchase")}
        >
          Purchase
        </button>
        <button
          className={`flex-1 py-2 text-center font-semibold text-md border-b-2 transition-colors duration-150 ${
            tab === "Expenses"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-blue-500"
          }`}
          onClick={() => setTab("Expenses")}
        >
          Expenses
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="text-xs text-gray-700 border-b">
              <th className="px-6 py-3 font-semibold">Date</th>
              <th className="px-6 py-3 font-semibold">{tab === "Purchase" ? "Supplier" : "Title"}</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-400">Loading...</td>
              </tr>
            ) : tab === "Purchase" ? (
              purchases.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">No purchases found</td>
                </tr>
              ) : (
                purchases.slice(0, 7).map((p) => (
                  <tr key={p.id} className="border-b last:border-b-0 text-[15px]">
                    <td className="px-6 py-3 whitespace-nowrap text-gray-700">{formatDate(p.date)}</td>
                    <td className="px-6 py-3 whitespace-nowrap font-semibold text-gray-900">{p.supplier_name || p.supplier || "-"}</td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${statusColors[p.status] || statusColors.Completed}`}>
                        <span className={`w-2 h-2 rounded-full ${p.status === "Pending" ? "bg-blue-400" : p.status === "Cancelled" ? "bg-red-400" : "bg-green-400"}`}></span>
                        {p.status || "Completed"}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap font-semibold text-gray-900">GHS {Number(p.total).toLocaleString()}</td>
                  </tr>
                ))
              )
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-400">No expenses found</td>
              </tr>
            ) : (
              expenses.slice(0, 7).map((expense) => (
                <tr key={expense.id} className="border-b last:border-b-0 text-[15px]">
                  <td className="px-6 py-3 whitespace-nowrap text-gray-700">{formatDate(expense.expense_date)}</td>
                  <td className="px-6 py-3 whitespace-nowrap font-semibold text-gray-900">
                    <div>
                      <div>{expense.title}</div>
                      {expense.category_name && (
                        <div className="text-xs text-gray-500">{expense.category_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${statusColors[expense.status] || statusColors.paid}`}>
                      <span className={`w-2 h-2 rounded-full ${expense.status === "pending" ? "bg-yellow-400" : expense.status === "overdue" ? "bg-red-400" : "bg-green-400"}`}></span>
                      {expense.status?.toUpperCase() || "PAID"}
                    </span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap font-semibold text-gray-900">GHS {Number(expense.amount).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 