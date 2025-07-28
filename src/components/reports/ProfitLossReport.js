import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import ReportSummary from "./ReportSummary";
import ReportSummaryItem from "./ReportSummaryItem";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ProfitLossReport({ dateRange, selectedStore, stores, mode }) {
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState(0);
  const [cogs, setCogs] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [grossProfit, setGrossProfit] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch orders
        const ordersRes = await fetch("/api/orders");
        const ordersJson = await ordersRes.json();
        let orders = ordersJson.data || [];
        // Filter by date and store
        if (dateRange.startDate && dateRange.endDate) {
          orders = orders.filter(order => {
            const orderDate = new Date(order.timestamp);
            return orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
          });
        }
        if (selectedStore && selectedStore !== "all") {
          orders = orders.filter(order => String(order.register_id) === String(selectedStore));
        }
        // Revenue is sum of order totals
        const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
        setRevenue(totalRevenue);

        // Fetch order items
        const orderItemsRes = await fetch("/api/order-items");
        const orderItemsJson = await orderItemsRes.json();
        let orderItems = orderItemsJson.data || [];
        // Filter by date and store
        if (dateRange.startDate && dateRange.endDate) {
          orderItems = orderItems.filter(item => {
            const orderDate = item.orders && item.orders.timestamp ? new Date(item.orders.timestamp) : null;
            return orderDate && orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
          });
        }
        if (selectedStore && selectedStore !== "all") {
          orderItems = orderItems.filter(item => item.orders && String(item.orders.store_id) === String(selectedStore));
        }
        // COGS is sum of cost_price * quantity
        const totalCogs = orderItems.reduce((sum, item) => sum + (Number(item.cost_price || 0) * Number(item.quantity)), 0);
        setCogs(totalCogs);

        // Gross profit
        const gross = totalRevenue - totalCogs;
        setGrossProfit(gross);

        // Fetch expenses
        const expensesRes = await fetch("/api/expenses");
        const expensesJson = await expensesRes.json();
        let expensesArr = expensesJson.data || [];
        // Filter by date and store
        if (dateRange.startDate && dateRange.endDate) {
          expensesArr = expensesArr.filter(exp => {
            const expDate = new Date(exp.expense_date);
            return expDate >= dateRange.startDate && expDate <= dateRange.endDate;
          });
        }
        if (selectedStore && selectedStore !== "all") {
          expensesArr = expensesArr.filter(exp => String(exp.register_id) === String(selectedStore));
        }
        const totalExpenses = expensesArr.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
        setExpenses(totalExpenses);

        // Net profit
        setNetProfit(gross - totalExpenses);
      } catch (err) {
        setError("Failed to load profit & loss data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange, selectedStore]);

  // Chart data processing functions
  const getProfitMarginData = () => {
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    
    return {
      labels: ['Gross Margin', 'Net Margin'],
      datasets: [{
        data: [grossMargin, netMargin],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)'
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(59, 130, 246)'
        ],
        borderWidth: 2,
      }]
    };
  };

  const getRevenueVsExpensesData = () => {
    return {
      labels: ['Revenue', 'COGS', 'Expenses'],
      datasets: [{
        label: 'Amount (GHS)',
        data: [revenue, cogs, expenses],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)'
        ],
        borderWidth: 1,
      }]
    };
  };

  const getMonthlyPerformanceData = () => {
    // This would need more detailed data to show actual monthly trends
    // For now, showing a simplified version
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const revenueData = months.map(() => revenue / 6); // Simplified distribution
    const expensesData = months.map(() => expenses / 6);
    
    return {
      labels: months,
      datasets: [
        {
          label: 'Revenue',
          data: revenueData,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Expenses',
          data: expensesData,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
        }
      ]
    };
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${
          mode === "dark" ? "text-white" : "text-gray-900"
        }`}>Profit & Loss Report</h2>
        <p className={`${
          mode === "dark" ? "text-gray-300" : "text-gray-600"
        }`}>
          Financial performance and profitability for {dateRange.label}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold">{loading ? '...' : `GHS ${revenue.toLocaleString()}`}</p>
            </div>
            <Icon icon="mdi:cash" className="w-8 h-8 text-emerald-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Expenses</p>
              <p className="text-3xl font-bold">{loading ? '...' : `GHS ${expenses.toLocaleString()}`}</p>
            </div>
            <Icon icon="mdi:file-document-outline" className="w-8 h-8 text-red-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Gross Profit</p>
              <p className="text-3xl font-bold">{loading ? '...' : `GHS ${grossProfit.toLocaleString()}`}</p>
            </div>
            <Icon icon="mdi:chart-line" className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm font-medium">Net Profit</p>
              <p className="text-3xl font-bold">{loading ? '...' : `GHS ${netProfit.toLocaleString()}`}</p>
            </div>
            <Icon icon="mdi:finance" className="w-8 h-8 text-gray-200" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Profit Margins */}
        <div className={`rounded-xl border p-6 ${
          mode === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${
              mode === "dark" ? "text-white" : "text-gray-900"
            }`}>Profit Margins</h3>
            <Icon icon="mdi:pie-chart" className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Doughnut
              data={getProfitMarginData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.label}: ${context.parsed.toFixed(1)}%`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Revenue vs Expenses */}
        <div className={`rounded-xl border p-6 ${
          mode === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${
              mode === "dark" ? "text-white" : "text-gray-900"
            }`}>Revenue vs Expenses</h3>
            <Icon icon="mdi:chart-bar" className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Bar
              data={getRevenueVsExpensesData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `GHS ${context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return `GHS ${value.toLocaleString()}`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Monthly Performance */}
        <div className={`rounded-xl border p-6 lg:col-span-2 ${
          mode === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${
              mode === "dark" ? "text-white" : "text-gray-900"
            }`}>Monthly Performance Trend</h3>
            <Icon icon="mdi:chart-line" className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Line
              data={getMonthlyPerformanceData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: GHS ${context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return `GHS ${value.toLocaleString()}`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      <ReportSummary
        title="Profit & Loss Summary"
        icon="mdi:finance"
        mode={mode}
        loading={loading}
        error={error}
        loadingText="Loading financial data..."
        errorText="Failed to load financial data"
      >
        <ReportSummaryItem
          icon="mdi:cash"
          title="Total Revenue"
          subtitle="Income from sales"
          value={`GHS ${revenue.toLocaleString()}`}
          color="green"
          mode={mode}
        />
        <ReportSummaryItem
          icon="mdi:package-variant"
          title="Cost of Goods Sold"
          subtitle="Direct costs"
          value={`GHS ${cogs.toLocaleString()}`}
          color="red"
          mode={mode}
        />
        <ReportSummaryItem
          icon="mdi:chart-line"
          title="Gross Profit"
          subtitle="Revenue - COGS"
          value={`GHS ${grossProfit.toLocaleString()}`}
          color="blue"
          mode={mode}
        />
        <ReportSummaryItem
          icon="mdi:file-document-outline"
          title="Operating Expenses"
          subtitle="Business costs"
          value={`GHS ${expenses.toLocaleString()}`}
          color="orange"
          mode={mode}
        />
        <ReportSummaryItem
          icon="mdi:finance"
          title="Net Profit"
          subtitle={netProfit >= 0 ? 'Profit after all expenses' : 'Loss after all expenses'}
          value={`GHS ${netProfit.toLocaleString()}`}
          color={netProfit >= 0 ? "green" : "red"}
          mode={mode}
          showAlert={netProfit < 0}
          alertText="Loss"
        />
      </ReportSummary>
    </div>
  );
} 