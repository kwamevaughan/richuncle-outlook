import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { GenericTable } from "../GenericTable";
import toast from "react-hot-toast";

export default function ExpensesReport({ dateRange, selectedStore, stores, mode }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Stats state
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalAmount: 0,
    averageAmount: 0,
    thisMonth: 0,
    topCategory: null
  });

  // Fetch expenses data
  const fetchExpensesData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/expenses');
      const { data, error } = await response.json();
      
      if (error) throw new Error(error);
      
      // Filter by date range
      let filteredExpenses = data || [];
      if (dateRange.startDate && dateRange.endDate) {
        filteredExpenses = filteredExpenses.filter(expense => {
          const expenseDate = new Date(expense.expense_date);
          return expenseDate >= dateRange.startDate && expenseDate <= dateRange.endDate;
        });
      }
      
      // Filter by store if needed
      if (selectedStore !== "all") {
        filteredExpenses = filteredExpenses.filter(expense => 
          expense.register_id === selectedStore || !expense.register_id
        );
      }
      
      setExpenses(filteredExpenses);
      calculateStats(filteredExpenses);
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load expenses data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (expensesData) => {
    const totalExpenses = expensesData.length;
    const totalAmount = expensesData.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    const averageAmount = totalExpenses > 0 ? totalAmount / totalExpenses : 0;
    
    // Calculate this month's expenses
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = expensesData
      .filter(expense => new Date(expense.expense_date) >= startOfMonth)
      .reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    
    // Find top category
    const categoryMap = {};
    expensesData.forEach(expense => {
      const category = expense.category || 'Other';
      categoryMap[category] = (categoryMap[category] || 0) + (parseFloat(expense.amount) || 0);
    });
    
    const topCategory = Object.entries(categoryMap)
      .sort(([,a], [,b]) => b - a)[0] || null;
    
    setStats({
      totalExpenses,
      totalAmount,
      averageAmount,
      thisMonth,
      topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null
    });
  };

  useEffect(() => {
    fetchExpensesData();
  }, [dateRange, selectedStore]);

  // Table columns for expenses
  const columns = [
    { Header: "Date", accessor: "expense_date", 
      Cell: ({ value }) => new Date(value).toLocaleDateString() },
    { Header: "Description", accessor: "description" },
    { Header: "Category", accessor: "category", 
      Cell: ({ value }) => value || "Other" },
    { Header: "Amount", accessor: "amount", 
      Cell: ({ value }) => `GHS ${parseFloat(value || 0).toFixed(2)}` },
    { Header: "Payment Method", accessor: "payment_method", 
      Cell: ({ value }) => value ? value.charAt(0).toUpperCase() + value.slice(1) : "N/A" },
    { Header: "Store", accessor: "store_name", 
      Cell: ({ value, row }) => {
        const store = stores.find(s => s.id === row.original.register_id);
        return store ? store.name : "N/A";
      }},
    { Header: "Status", accessor: "status", 
      Cell: ({ value }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'approved' ? 'bg-green-100 text-green-800' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : "N/A"}
        </span>
      )}
  ];

  // Flatten expenses data for export
  const flattenedExpenses = expenses.map(expense => ({
    expense_date: String(expense.expense_date || ''),
    description: String(expense.description || ''),
    category: String(expense.category || 'Other'),
    amount: String(expense.amount || '0'),
    payment_method: String(expense.payment_method || 'N/A'),
    store_name: stores.find(s => s.id === expense.register_id)?.name || 'N/A',
    status: String(expense.status || 'N/A')
  }));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Expenses Report</h2>
        <p className="text-gray-600">
          Expense tracking and analysis for {dateRange.label}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Expenses</p>
              <p className="text-3xl font-bold">{stats.totalExpenses}</p>
            </div>
            <Icon icon="mdi:file-document-outline" className="w-8 h-8 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total Amount</p>
              <p className="text-3xl font-bold">GHS {stats.totalAmount.toLocaleString()}</p>
            </div>
            <Icon icon="fa7-solid:cedi-sign" className="w-8 h-8 text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Average Amount</p>
              <p className="text-3xl font-bold">GHS {stats.averageAmount.toLocaleString()}</p>
            </div>
            <Icon icon="mdi:chart-line" className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">This Month</p>
              <p className="text-3xl font-bold">GHS {stats.thisMonth.toLocaleString()}</p>
            </div>
            <Icon icon="mdi:calendar-month" className="w-8 h-8 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Category</h3>
            <Icon icon="mdi:tag" className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">
            {stats.topCategory ? stats.topCategory.name : "No data"}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {stats.topCategory ? `GHS ${stats.topCategory.amount.toLocaleString()}` : "No expenses recorded"}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Expense Trends</h3>
            <Icon icon="mdi:trending-up" className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {stats.totalExpenses > 0 ? (stats.thisMonth / stats.totalAmount * 100).toFixed(1) : 0}%
          </p>
          <p className="text-sm text-gray-500 mt-2">This month's share of total expenses</p>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Expenses List</h3>
          </div>
        </div>
        
        <GenericTable
          data={flattenedExpenses}
          columns={columns}
          loading={loading}
          error={error}
          onRefresh={fetchExpensesData}
          exportType="expenses"
          exportTitle="Export Expenses Data"
          getFieldsOrder={() => [
            { label: "Date", key: "expense_date", icon: "mdi:calendar" },
            { label: "Description", key: "description", icon: "mdi:file-document" },
            { label: "Category", key: "category", icon: "mdi:tag" },
            { label: "Amount", key: "amount", icon: "mdi:currency-usd" },
            { label: "Payment Method", key: "payment_method", icon: "mdi:credit-card" },
            { label: "Store", key: "store_name", icon: "mdi:store" },
            { label: "Status", key: "status", icon: "mdi:check-circle" },
          ]}
          getDefaultFields={() => ({
            expense_date: true,
            description: true,
            category: true,
            amount: true,
            payment_method: true,
            store_name: true,
            status: true,
          })}
          emptyMessage={
            <div className="text-center py-12">
              <Icon icon="mdi:file-document-outline" className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No expenses found for the selected period</p>
            </div>
          }
        />
      </div>
    </div>
  );
} 