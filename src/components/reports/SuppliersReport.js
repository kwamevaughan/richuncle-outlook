import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { GenericTable } from "../GenericTable";
import ExportModal from "../export/ExportModal";
import toast from "react-hot-toast";

export default function SuppliersReport({ dateRange, selectedStore, stores, mode }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Stats state
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    totalPurchases: 0,
    totalDue: 0,
    topSupplier: null
  });

  // Fetch suppliers data
  const fetchSuppliersData = async () => {
    setLoading(true);
    try {
      // Placeholder - would need suppliers API endpoint
      const response = await fetch('/api/suppliers');
      const { data, error } = await response.json();
      
      if (error) {
        setSuppliers([]);
        setStats({
          totalSuppliers: 0,
          activeSuppliers: 0,
          totalPurchases: 0,
          totalDue: 0,
          topSupplier: null
        });
      } else {
        setSuppliers(data || []);
        calculateStats(data || []);
      }
    } catch (err) {
      setSuppliers([]);
      setStats({
        totalSuppliers: 0,
        activeSuppliers: 0,
        totalPurchases: 0,
        totalDue: 0,
        topSupplier: null
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (suppliersData) => {
    const totalSuppliers = suppliersData.length;
    const activeSuppliers = suppliersData.filter(s => s.status === 'active').length;
    const totalPurchases = suppliersData.reduce((sum, s) => sum + (parseFloat(s.total_purchases) || 0), 0);
    const totalDue = suppliersData.reduce((sum, s) => sum + (parseFloat(s.due_balance) || 0), 0);
    
    setStats({
      totalSuppliers,
      activeSuppliers,
      totalPurchases,
      totalDue,
      topSupplier: suppliersData.length > 0 ? suppliersData[0] : null
    });
  };

  useEffect(() => {
    fetchSuppliersData();
  }, [dateRange, selectedStore]);

  // Table columns for suppliers
  const columns = [
    { Header: "Supplier", accessor: "name" },
    { Header: "Contact", accessor: "contact_person" },
    { Header: "Phone", accessor: "phone" },
    { Header: "Email", accessor: "email" },
    { Header: "Total Purchases", accessor: "total_purchases", 
      Cell: ({ value }) => `GHS ${parseFloat(value || 0).toFixed(2)}` },
    { Header: "Due Balance", accessor: "due_balance", 
      Cell: ({ value }) => (
        <span className={`font-medium ${
          parseFloat(value || 0) > 0 ? 'text-red-600' : 'text-green-600'
        }`}>
          GHS {parseFloat(value || 0).toFixed(2)}
        </span>
      )},
    { Header: "Status", accessor: "status" },
  ];

  // Flatten suppliers data for export
  const flattenedSuppliers = suppliers.map(supplier => ({
    name: String(supplier.name || ''),
    contact_person: String(supplier.contact_person || ''),
    phone: String(supplier.phone || ''),
    email: String(supplier.email || ''),
    total_purchases: String(supplier.total_purchases || '0'),
    due_balance: String(supplier.due_balance || '0'),
    status: String(supplier.status || 'N/A')
  }));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Suppliers Report
        </h2>
        <p className="text-gray-600">
          Supplier performance and due balances for {dateRange.label}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">
                Total Suppliers
              </p>
              <p className="text-3xl font-bold">{stats.totalSuppliers}</p>
            </div>
            <Icon
              icon="mdi:truck-delivery"
              className="w-8 h-8 text-orange-200"
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">
                Active Suppliers
              </p>
              <p className="text-3xl font-bold">{stats.activeSuppliers}</p>
            </div>
            <Icon icon="mdi:check-circle" className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">
                Total Purchases
              </p>
              <p className="text-3xl font-bold">
                GHS {stats.totalPurchases.toFixed(2)}
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
              <p className="text-red-100 text-sm font-medium">Total Due</p>
              <p className="text-3xl font-bold">
                GHS {stats.totalDue.toFixed(2)}
              </p>
            </div>
            <Icon icon="mdi:alert-circle" className="w-8 h-8 text-red-200" />
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Supplier List
            </h3>
            {/* Removed custom Export Data button */}
          </div>
        </div>

        <GenericTable
          data={flattenedSuppliers}
          columns={columns}
          loading={loading}
          error={error}
          onRefresh={fetchSuppliersData}
          enableStatusPills={true}
          statusContext="user"
          statusPillSize="sm"
          exportType="suppliers"
          exportTitle="Export Supplier List"
          getFieldsOrder={() => [
            { label: "Supplier Name", key: "name", icon: "mdi:account" },
            {
              label: "Contact Person",
              key: "contact_person",
              icon: "mdi:account-tie",
            },
            { label: "Phone", key: "phone", icon: "mdi:phone" },
            { label: "Email", key: "email", icon: "mdi:email" },
            {
              label: "Total Purchases",
              key: "total_purchases",
              icon: "mdi:currency-usd",
            },
            { label: "Due Balance", key: "due_balance", icon: "mdi:alert" },
            { label: "Status", key: "status", icon: "mdi:check-circle" },
          ]}
          getDefaultFields={() => ({
            name: true,
            contact_person: true,
            phone: true,
            email: true,
            total_purchases: true,
            due_balance: true,
            status: true,
          })}
          emptyMessage={
            <div className="text-center py-12">
              <Icon
                icon="mdi:truck-delivery"
                className="w-12 h-12 mx-auto mb-4 text-gray-300"
              />
              <p className="text-gray-500">No suppliers found</p>
              <p className="text-sm text-gray-400 mt-2">
                Supplier management feature may not be implemented yet
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
} 