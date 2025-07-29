import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import { GenericTable } from "../GenericTable";

function getYearMonths(year) {
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(year, i, 1);
    return {
      label: format(date, "MMM yyyy"),
      month: i,
      year: year,
      sales: 0,
      purchases: 0,
      expenses: 0,
      netProfit: 0,
    };
  });
}

export default function AnnualReport({ dateRange, selectedStore, stores, mode }) {
  const [loading, setLoading] = useState(true);
  const [yearlyData, setYearlyData] = useState([]);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const months = getYearMonths(selectedYear);
        // Fetch orders
        const ordersRes = await fetch("/api/orders");
        const ordersJson = await ordersRes.json();
        let orders = ordersJson.data || [];
        // Filter by store
        if (selectedStore && selectedStore !== "all") {
          orders = orders.filter(order => String(order.register_id) === String(selectedStore));
        }
        // Aggregate sales by month
        orders.forEach(order => {
          const d = new Date(order.timestamp);
          if (d.getFullYear() === selectedYear) {
            months[d.getMonth()].sales += parseFloat(order.total) || 0;
          }
        });

        // Fetch expenses
        const expensesRes = await fetch("/api/expenses");
        const expensesJson = await expensesRes.json();
        let expensesArr = expensesJson.data || [];
        if (selectedStore && selectedStore !== "all") {
          expensesArr = expensesArr.filter(exp => String(exp.register_id) === String(selectedStore));
        }
        expensesArr.forEach(exp => {
          const d = new Date(exp.expense_date);
          if (d.getFullYear() === selectedYear) {
            months[d.getMonth()].expenses += parseFloat(exp.amount) || 0;
          }
        });

        // Fetch purchases (direct purchases)
        const purchasesRes = await fetch("/api/purchases");
        const purchasesJson = await purchasesRes.json();
        let purchasesArr = purchasesJson.data || [];
        if (selectedStore && selectedStore !== "all") {
          purchasesArr = purchasesArr.filter(p => String(p.warehouse_id) === String(selectedStore));
        }
        purchasesArr.forEach(p => {
          const d = new Date(p.date);
          if (d.getFullYear() === selectedYear) {
            months[d.getMonth()].purchases += parseFloat(p.total) || 0;
          }
        });

        // Calculate net profit per month
        months.forEach(m => {
          m.netProfit = m.sales - m.purchases - m.expenses;
        });
        setYearlyData(months);
      } catch (err) {
        setError("Failed to load annual report data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedYear, selectedStore]);

  // KPI totals
  const totalSales = yearlyData.reduce((sum, m) => sum + m.sales, 0);
  const totalPurchases = yearlyData.reduce((sum, m) => sum + m.purchases, 0);
  const totalExpenses = yearlyData.reduce((sum, m) => sum + m.expenses, 0);
  const totalNetProfit = yearlyData.reduce((sum, m) => sum + m.netProfit, 0);

  // Year selector (last 5 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Table columns for annual data (moved inside component for Icon access)
  const columns = [
    { 
      Header: "Month", 
      accessor: "label",
      sortable: true
    },
    { 
      Header: "Sales", 
      accessor: "sales_formatted",
      sortable: true,
      Cell: ({ value }) => value
    },
    { 
      Header: "Purchases", 
      accessor: "purchases_formatted",
      sortable: true,
      Cell: ({ value }) => value
    },
    { 
      Header: "Expenses", 
      accessor: "expenses_formatted",
      sortable: true,
      Cell: ({ value }) => value
    },
    { 
      Header: "Net Profit", 
      accessor: "netProfit_formatted",
      sortable: true,
      Cell: ({ value, row }) => (
        <span className={`font-bold ${row.original.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {value}
        </span>
      )
    },
    {
      Header: "Status",
      accessor: "status",
      sortable: false,
      render: (row) => {
        const value = row.netProfit;
        if (value === 0) {
          return (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm border bg-gray-100 text-gray-700 border-gray-200">
              <Icon icon="mdi:minus" className="w-3 h-3 text-gray-500" />
              No Data
            </span>
          );
        }
        const isProfit = value > 0;
        return (
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm border ${
              isProfit
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-red-100 text-red-700 border-red-200'
            }`}
          >
            <Icon
              icon={isProfit ? 'mdi:trending-up' : 'mdi:trending-down'}
              className={`w-3 h-3 ${isProfit ? 'text-green-500' : 'text-red-500'}`}
            />
            {isProfit ? 'Profit' : 'Loss'}
          </span>
        );
      }
    }
  ];

  // Flatten data for export
  const flattenedData = yearlyData.map(month => ({
    month: month.label,
    sales: month.sales.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    purchases: month.purchases.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    expenses: month.expenses.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    net_profit: month.netProfit.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    status: month.netProfit >= 0 ? 'Profit' : 'Loss'
  }));

  // Add status property to each month for table display with formatted values
  const tableData = yearlyData.map(month => ({
    ...month,
    sales: month.sales,
    purchases: month.purchases,
    expenses: month.expenses,
    netProfit: month.netProfit,
    sales_formatted: `GHS ${month.sales.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    purchases_formatted: `GHS ${month.purchases.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    expenses_formatted: `GHS ${month.expenses.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    netProfit_formatted: `GHS ${month.netProfit.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    status: month.netProfit >= 0 ? 'Profit' : 'Loss'
  }));

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Annual Report</h2>
          <p className="text-gray-600">
            Annual reports and summaries for {selectedYear}
          </p>
        </div>
        <div>
          <label className="mr-2 font-medium">Year:</label>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm font-medium">Total Sales</p>
              <p className="text-3xl font-bold">{loading ? '...' : `GHS ${totalSales.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}</p>
            </div>
            <Icon icon="mdi:calendar-year" className="w-8 h-8 text-cyan-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Purchases</p>
              <p className="text-3xl font-bold">{loading ? '...' : `GHS ${totalPurchases.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}</p>
            </div>
            <Icon icon="mdi:cart-outline" className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Expenses</p>
              <p className="text-3xl font-bold">{loading ? '...' : `GHS ${totalExpenses.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}</p>
            </div>
            <Icon icon="mdi:file-document-outline" className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Net Profit</p>
              <p className="text-3xl font-bold">{loading ? '...' : `GHS ${totalNetProfit.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}</p>
            </div>
            <Icon icon="mdi:finance" className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Annual Data Table */}
      <GenericTable
        data={tableData}
        columns={columns}
        loading={loading}
        error={error}
        title="Monthly Breakdown"
        searchable={false}
        selectable={false}
        enableDateFilter={false}
        exportType="annual"
        exportTitle="Export Annual Report"
        getFieldsOrder={() => [
          { label: "Month", key: "month", icon: "mdi:calendar" },
          { label: "Sales", key: "sales", icon: "mdi:cash" },
          { label: "Purchases", key: "purchases", icon: "mdi:cart" },
          { label: "Expenses", key: "expenses", icon: "mdi:file-document" },
          { label: "Net Profit", key: "net_profit", icon: "mdi:finance" },
          { label: "Status", key: "status", icon: "mdi:check-circle" },
        ]}
        getDefaultFields={() => ({
          month: true,
          sales: true,
          purchases: true,
          expenses: true,
          net_profit: true,
          status: true,
        })}
        actions={[]}
        emptyMessage={
          <div className="text-center py-12">
            <Icon icon="mdi:chart-line" className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No annual data available for the selected year</p>
          </div>
        }
      />
    </div>
  );
} 