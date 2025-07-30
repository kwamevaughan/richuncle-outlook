import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { GenericTable } from "../GenericTable";
import ExportModal from "../export/ExportModal";
import toast from "react-hot-toast";

export default function CustomersReport({ dateRange, selectedStore, stores, mode }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Stats state
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalSales: 0,
    averageOrderValue: 0,
    topCustomer: null,
    dueBalances: 0
  });

  // Fetch customers data
  const fetchCustomersData = async () => {
    setLoading(true);
    try {
      // Placeholder - would need customers API endpoint
      const response = await fetch('/api/customers');
      const { data, error } = await response.json();
      
      if (error) {
        // If no customers API exists, create placeholder data
        setCustomers([]);
        setStats({
          totalCustomers: 0,
          activeCustomers: 0,
          totalSales: 0,
          averageOrderValue: 0,
          topCustomer: null,
          dueBalances: 0
        });
      } else {
        setCustomers(data || []);
        calculateStats(data || []);
      }
    } catch (err) {
      // Handle case where customers API doesn't exist
      setCustomers([]);
      setStats({
        totalCustomers: 0,
        activeCustomers: 0,
        totalSales: 0,
        averageOrderValue: 0,
        topCustomer: null,
        dueBalances: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (customersData) => {
    const totalCustomers = customersData.length;
    const activeCustomers = customersData.filter(c => c.status === 'active').length;
    const totalSales = customersData.reduce((sum, c) => sum + (parseFloat(c.total_sales) || 0), 0);
    const averageOrderValue = totalCustomers > 0 ? totalSales / totalCustomers : 0;
    const dueBalances = customersData.reduce((sum, c) => sum + (parseFloat(c.due_balance) || 0), 0);
    
    setStats({
      totalCustomers,
      activeCustomers,
      totalSales,
      averageOrderValue,
      topCustomer: customersData.length > 0 ? customersData[0] : null,
      dueBalances
    });
  };

  useEffect(() => {
    fetchCustomersData();
  }, [dateRange, selectedStore]);

  // Table columns for customers
  const columns = [
    { Header: "Customer", accessor: "name" },
    { Header: "Email", accessor: "email" },
    { Header: "Phone", accessor: "phone" },
    { Header: "Total Orders", accessor: "total_orders", 
      Cell: ({ value }) => value || 0 },
    { Header: "Total Spent", accessor: "total_sales", 
      Cell: ({ value }) => `GHS ${parseFloat(value || 0).toFixed(2)}` },
    { Header: "Due Balance", accessor: "due_balance", 
      Cell: ({ value }) => (
        <span className={`font-medium ${
          parseFloat(value || 0) > 0 ? 'text-red-600' : 'text-green-600'
        }`}>
          GHS {parseFloat(value || 0).toFixed(2)}
        </span>
      )},
    { Header: "Status", accessor: "status", 
      Cell: ({ value }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'active' ? 'bg-green-100 text-green-800' :
          value === 'inactive' ? 'bg-gray-100 text-gray-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : "N/A"}
        </span>
      )}
  ];

  // Flatten customers data for export
  const flattenedCustomers = customers.map(customer => ({
    name: String(customer.name || ''),
    email: String(customer.email || ''),
    phone: String(customer.phone || ''),
    total_orders: String(customer.total_orders || '0'),
    total_sales: String(customer.total_sales || '0'),
    due_balance: String(customer.due_balance || '0'),
    status: String(customer.status || 'N/A')
  }));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Customers Report
        </h2>
        <p className="text-gray-600">
          Customer analytics and due balances for {dateRange.label}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">
                Total Customers
              </p>
              <p className="text-3xl font-bold">{stats.totalCustomers}</p>
            </div>
            <Icon
              icon="mdi:account-group"
              className="w-8 h-8 text-indigo-200"
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">
                Active Customers
              </p>
              <p className="text-3xl font-bold">{stats.activeCustomers}</p>
            </div>
            <Icon icon="mdi:account-check" className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Sales</p>
              <p className="text-3xl font-bold">
                GHS {stats.totalSales.toFixed(2)}
              </p>
            </div>
            <Icon
              icon="fa7-solid:cedi-sign"
              className="w-8 h-8 text-blue-200"
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Due Balances</p>
              <p className="text-3xl font-bold">
                GHS {stats.dueBalances.toFixed(2)}
              </p>
            </div>
            <Icon icon="mdi:alert-circle" className="w-8 h-8 text-red-200" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Average Order Value
            </h3>
            <Icon icon="mdi:chart-line" className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600">
            GHS {stats.averageOrderValue.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-2">Per customer average</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Top Customer
            </h3>
            <Icon icon="mdi:trophy" className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">
            {stats.topCustomer ? stats.topCustomer.name : "No data"}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {stats.topCustomer
              ? `GHS ${parseFloat(stats.topCustomer.total_sales || 0).toFixed(
                  2
                )}`
              : "No sales data"}
          </p>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Customer List
            </h3>
            {/* Removed custom Export Data button */}
          </div>
        </div>

        <GenericTable
          data={flattenedCustomers}
          columns={columns}
          loading={loading}
          error={error}
          onRefresh={fetchCustomersData}
          exportType="customers"
          exportTitle="Export Customer List"
          getFieldsOrder={() => [
            { label: "Customer Name", key: "name", icon: "mdi:account" },
            { label: "Email", key: "email", icon: "mdi:email" },
            { label: "Phone", key: "phone", icon: "mdi:phone" },
            {
              label: "Total Orders",
              key: "total_orders",
              icon: "mdi:shopping",
            },
            {
              label: "Total Spent",
              key: "total_sales",
              icon: "mdi:currency-usd",
            },
            { label: "Due Balance", key: "due_balance", icon: "mdi:alert" },
            { label: "Status", key: "status", icon: "mdi:check-circle" },
          ]}
          getDefaultFields={() => ({
            name: true,
            email: true,
            phone: true,
            total_orders: true,
            total_sales: true,
            due_balance: true,
            status: true,
          })}
          emptyMessage={
            <div className="text-center py-12">
              <Icon
                icon="mdi:account-group"
                className="w-12 h-12 mx-auto mb-4 text-gray-300"
              />
              <p className="text-gray-500">No customers found</p>
              <p className="text-sm text-gray-400 mt-2">
                Customer management feature may not be implemented yet
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
} 