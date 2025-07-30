import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { GenericTable } from "../GenericTable";
import ExportModal from "../export/ExportModal";
import toast from "react-hot-toast";

export default function PurchasesReport({ dateRange, selectedStore, stores, mode }) {
  const [purchases, setPurchases] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Stats state
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalOrders: 0,
    totalReturns: 0,
    totalSpent: 0,
    totalOrderValue: 0,
    totalReturnValue: 0,
    pendingOrders: 0,
    completedOrders: 0
  });

  // Fetch purchases data
  const fetchPurchasesData = async () => {
    setLoading(true);
    try {
      const [purchasesRes, ordersRes, returnsRes] = await Promise.all([
        fetch('/api/purchases'),
        fetch('/api/purchase-orders'),
        fetch('/api/purchase-returns')
      ]);

      const purchasesData = await purchasesRes.json();
      const ordersData = await ordersRes.json();
      const returnsData = await returnsRes.json();

      if (purchasesData.error) throw new Error(purchasesData.error);
      
      // Filter by date range
      let filteredPurchases = purchasesData.data || [];
      let filteredOrders = ordersData.data || [];
      let filteredReturns = returnsData.data || [];
      
      if (dateRange.startDate && dateRange.endDate) {
        filteredPurchases = filteredPurchases.filter(purchase => {
          const purchaseDate = new Date(purchase.date);
          return purchaseDate >= dateRange.startDate && purchaseDate <= dateRange.endDate;
        });
        
        filteredOrders = filteredOrders.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
        });
        
        filteredReturns = filteredReturns.filter(ret => {
          const returnDate = new Date(ret.return_date);
          return returnDate >= dateRange.startDate && returnDate <= dateRange.endDate;
        });
      }
      
      // Filter by store if needed
      if (selectedStore !== "all") {
        filteredPurchases = filteredPurchases.filter(purchase => 
          purchase.warehouse_id === selectedStore || !purchase.warehouse_id
        );
        filteredOrders = filteredOrders.filter(order => 
          order.warehouse_id === selectedStore || !order.warehouse_id
        );
        filteredReturns = filteredReturns.filter(ret => 
          ret.warehouse_id === selectedStore || !ret.warehouse_id
        );
      }
      
      setPurchases(filteredPurchases);
      setPurchaseOrders(filteredOrders);
      setPurchaseReturns(filteredReturns);
      
      calculateStats(filteredPurchases, filteredOrders, filteredReturns);
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load purchases data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (purchasesData, ordersData, returnsData) => {
    const totalPurchases = purchasesData.length;
    const totalOrders = ordersData.length;
    const totalReturns = returnsData.length;
    
    const totalSpent = purchasesData.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
    const totalOrderValue = ordersData.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    const totalReturnValue = returnsData.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0);
    
    const pendingOrders = ordersData.filter(o => ['pending', 'approved', 'in_transit'].includes(o.status)).length;
    const completedOrders = ordersData.filter(o => o.status === 'completed').length;
    
    setStats({
      totalPurchases,
      totalOrders,
      totalReturns,
      totalSpent,
      totalOrderValue,
      totalReturnValue,
      pendingOrders,
      completedOrders
    });
  };

  useEffect(() => {
    fetchPurchasesData();
  }, [dateRange, selectedStore]);

  // Table columns for direct purchases
  const purchaseColumns = [
    { Header: "Purchase #", accessor: "purchase_number" },
    { Header: "Date", accessor: "date", 
      Cell: ({ value }) => new Date(value).toLocaleDateString() },
    { Header: "Supplier", accessor: "supplier_name" },
    { Header: "Warehouse", accessor: "warehouse_name" },
    { Header: "Total", accessor: "total", 
      Cell: ({ value }) => `GHS ${parseFloat(value || 0).toFixed(2)}` },
    { Header: "Status", accessor: "status", 
      Cell: ({ value }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'completed' ? 'bg-green-100 text-green-800' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : "N/A"}
        </span>
      )}
  ];

  // Table columns for purchase orders
  const orderColumns = [
    { Header: "Order #", accessor: "order_number" },
    { Header: "Date", accessor: "date", 
      Cell: ({ value }) => new Date(value).toLocaleDateString() },
    { Header: "Supplier", accessor: "supplier_name" },
    { Header: "Warehouse", accessor: "warehouse_name" },
    { Header: "Total", accessor: "total", 
      Cell: ({ value }) => `GHS ${parseFloat(value || 0).toFixed(2)}` },
    { Header: "Status", accessor: "status", 
      Cell: ({ value }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'completed' ? 'bg-green-100 text-green-800' :
          value === 'in_transit' ? 'bg-blue-100 text-blue-800' :
          value === 'approved' ? 'bg-purple-100 text-purple-800' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          value === 'cancelled' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : "N/A"}
        </span>
      )}
  ];

  // Table columns for purchase returns
  const returnColumns = [
    { Header: "Return #", accessor: "return_number" },
    { Header: "Date", accessor: "return_date", 
      Cell: ({ value }) => new Date(value).toLocaleDateString() },
    { Header: "Supplier", accessor: "supplier_name" },
    { Header: "Warehouse", accessor: "warehouse_name" },
    { Header: "Total", accessor: "total", 
      Cell: ({ value }) => `GHS ${parseFloat(value || 0).toFixed(2)}` },
    { Header: "Status", accessor: "status", 
      Cell: ({ value }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'completed' ? 'bg-green-100 text-green-800' :
          value === 'approved' ? 'bg-purple-100 text-purple-800' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : "N/A"}
        </span>
      )}
  ];

  // Flatten data for export
  const flattenedPurchases = purchases.map(purchase => ({
    purchase_number: String(purchase.purchase_number || ''),
    date: String(purchase.date || ''),
    supplier_name: String(purchase.supplier_name || ''),
    warehouse_name: String(purchase.warehouse_name || ''),
    total: String(purchase.total || '0'),
    status: String(purchase.status || 'N/A')
  }));

  const flattenedOrders = purchaseOrders.map(order => ({
    order_number: String(order.order_number || ''),
    date: String(order.date || ''),
    supplier_name: String(order.supplier_name || ''),
    warehouse_name: String(order.warehouse_name || ''),
    total: String(order.total || '0'),
    status: String(order.status || 'N/A')
  }));

  const flattenedReturns = purchaseReturns.map(ret => ({
    return_number: String(ret.return_number || ''),
    return_date: String(ret.return_date || ''),
    supplier_name: String(ret.supplier_name || ''),
    warehouse_name: String(ret.warehouse_name || ''),
    total: String(ret.total || '0'),
    status: String(ret.status || 'N/A')
  }));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Purchases Report
        </h2>
        <p className="text-gray-600">
          Purchase orders, direct purchases, and returns for {dateRange.label}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">
                Direct Purchases
              </p>
              <p className="text-3xl font-bold">{stats.totalPurchases}</p>
            </div>
            <Icon icon="mdi:cart-outline" className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">
                Purchase Orders
              </p>
              <p className="text-3xl font-bold">{stats.totalOrders}</p>
            </div>
            <Icon
              icon="mdi:file-document-outline"
              className="w-8 h-8 text-blue-200"
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Returns</p>
              <p className="text-3xl font-bold">{stats.totalReturns}</p>
            </div>
            <Icon icon="mdi:undo" className="w-8 h-8 text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Spent</p>
              <p className="text-3xl font-bold">
                GHS {stats.totalSpent.toFixed(2)}
              </p>
            </div>
            <Icon
              icon="fa7-solid:cedi-sign"
              className="w-8 h-8 text-green-200"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Order Value</h3>
            <Icon icon="mdi:file-document" className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600">
            GHS {stats.totalOrderValue.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Total value of purchase orders
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Return Value
            </h3>
            <Icon icon="mdi:undo" className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-600">
            GHS {stats.totalReturnValue.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-2">Total value of returns</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Pending Orders
            </h3>
            <Icon icon="mdi:clock" className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            {stats.pendingOrders}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Orders awaiting completion
          </p>
        </div>
      </div>

      {/* Direct Purchases Table */}
      <div className="bg-white rounded-xl border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Direct Purchases
            </h3>
            {/* Removed custom Export Data button */}
          </div>
        </div>

        <GenericTable
          data={flattenedPurchases}
          columns={purchaseColumns}
          loading={loading}
          error={error}
          onRefresh={fetchPurchasesData}
          exportType="purchases"
          exportTitle="Export Direct Purchases"
          getFieldsOrder={() => [
            {
              label: "Purchase #",
              key: "purchase_number",
              icon: "mdi:identifier",
            },
            { label: "Date", key: "date", icon: "mdi:calendar" },
            { label: "Supplier", key: "supplier_name", icon: "mdi:truck" },
            {
              label: "Warehouse",
              key: "warehouse_name",
              icon: "mdi:warehouse",
            },
            { label: "Total", key: "total", icon: "mdi:currency-usd" },
            { label: "Status", key: "status", icon: "mdi:check-circle" },
          ]}
          getDefaultFields={() => ({
            purchase_number: true,
            date: true,
            supplier_name: true,
            warehouse_name: true,
            total: true,
            status: true,
          })}
          emptyMessage={
            <div className="text-center py-12">
              <Icon
                icon="mdi:cart-outline"
                className="w-12 h-12 mx-auto mb-4 text-gray-300"
              />
              <p className="text-gray-500">
                No direct purchases found for the selected period
              </p>
            </div>
          }
        />
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Purchase Orders
          </h3>
        </div>

        <GenericTable
          data={flattenedOrders}
          columns={orderColumns}
          loading={loading}
          error={error}
          onRefresh={fetchPurchasesData}
          exportType="purchase-orders"
          exportTitle="Export Purchase Orders"
          getFieldsOrder={() => [
            { label: "Order #", key: "order_number", icon: "mdi:identifier" },
            { label: "Date", key: "date", icon: "mdi:calendar" },
            { label: "Supplier", key: "supplier_name", icon: "mdi:truck" },
            {
              label: "Warehouse",
              key: "warehouse_name",
              icon: "mdi:warehouse",
            },
            { label: "Total", key: "total", icon: "mdi:currency-usd" },
            { label: "Status", key: "status", icon: "mdi:check-circle" },
          ]}
          getDefaultFields={() => ({
            order_number: true,
            date: true,
            supplier_name: true,
            warehouse_name: true,
            total: true,
            status: true,
          })}
          emptyMessage={
            <div className="text-center py-12">
              <Icon
                icon="mdi:file-document-outline"
                className="w-12 h-12 mx-auto mb-4 text-gray-300"
              />
              <p className="text-gray-500">
                No purchase orders found for the selected period
              </p>
            </div>
          }
        />
      </div>

      {/* Purchase Returns Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Purchase Returns
          </h3>
        </div>

        <GenericTable
          data={flattenedReturns}
          columns={returnColumns}
          loading={loading}
          error={error}
          onRefresh={fetchPurchasesData}
          exportType="purchase-returns"
          exportTitle="Export Purchase Returns"
          getFieldsOrder={() => [
            { label: "Return #", key: "return_number", icon: "mdi:identifier" },
            { label: "Date", key: "return_date", icon: "mdi:calendar" },
            { label: "Supplier", key: "supplier_name", icon: "mdi:truck" },
            {
              label: "Warehouse",
              key: "warehouse_name",
              icon: "mdi:warehouse",
            },
            { label: "Total", key: "total", icon: "mdi:currency-usd" },
            { label: "Status", key: "status", icon: "mdi:check-circle" },
          ]}
          getDefaultFields={() => ({
            return_number: true,
            return_date: true,
            supplier_name: true,
            warehouse_name: true,
            total: true,
            status: true,
          })}
          emptyMessage={
            <div className="text-center py-12">
              <Icon
                icon="mdi:undo"
                className="w-12 h-12 mx-auto mb-4 text-gray-300"
              />
              <p className="text-gray-500">
                No purchase returns found for the selected period
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
} 