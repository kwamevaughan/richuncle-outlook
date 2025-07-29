import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { GenericTable } from "../GenericTable";
import ExportModal from "../export/ExportModal";
import toast from "react-hot-toast";

export default function ProductsReport({ dateRange, selectedStore, stores, mode }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Stats state
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalValue: 0
  });

  // Fetch products data
  const fetchProductsData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      const { data, error } = await response.json();
      
      if (error) throw new Error(error);
      
      // Filter by store if needed
      let filteredProducts = data || [];
      if (selectedStore !== "all") {
        filteredProducts = filteredProducts.filter(product => 
          product.store_id === selectedStore || !product.store_id
        );
      }
      
      setProducts(filteredProducts);
      calculateStats(filteredProducts);
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load products data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (productsData) => {
    const totalProducts = productsData.length;
    const activeProducts = productsData.filter(p => p.status === 'active').length;
    const lowStockProducts = productsData.filter(p => parseInt(p.quantity) > 0 && parseInt(p.quantity) <= 10).length;
    const outOfStockProducts = productsData.filter(p => parseInt(p.quantity) <= 0).length;
    
    const totalValue = productsData.reduce((sum, p) => {
      const quantity = parseInt(p.quantity) || 0;
      const price = parseFloat(p.price) || 0;
      return sum + (quantity * price);
    }, 0);
    
    setStats({
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue
    });
  };

  useEffect(() => {
    fetchProductsData();
  }, [dateRange, selectedStore]);

  // Table columns for products
  const columns = [
    { Header: "Product", accessor: "name" },
    { Header: "SKU", accessor: "sku" },
    { Header: "Category", accessor: "category_name", 
      Cell: ({ value }) => value || "Uncategorized" },
    { Header: "Quantity", accessor: "quantity", 
      Cell: ({ value }) => (
        <span className={`font-medium ${
          parseInt(value) <= 0 ? 'text-red-600' :
          parseInt(value) <= 10 ? 'text-orange-600' :
          'text-green-600'
        }`}>
          {parseInt(value) || 0}
        </span>
      )},
    { Header: "Price", accessor: "price", 
      Cell: ({ value }) => `GHS ${parseFloat(value || 0).toFixed(2)}` },
    { Header: "Total Value", accessor: "total_value", 
      Cell: ({ row }) => {
        const quantity = parseInt(row.original.quantity) || 0;
        const price = parseFloat(row.original.price) || 0;
        const totalValue = quantity * price;
        return `GHS ${totalValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      }},
    { Header: "Status", accessor: "status", 
      Cell: ({ value, row }) => {
        const quantity = parseInt(row.original.quantity) || 0;
        if (quantity <= 0) {
          return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Out of Stock</span>;
        } else if (quantity <= 10) {
          return <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Low Stock</span>;
        } else {
          return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">In Stock</span>;
        }
      }}
  ];

  // Flatten products data for export
  const flattenedProducts = products.map(product => ({
    name: String(product.name || ''),
    sku: String(product.sku || ''),
    category_name: String(product.category_name || 'Uncategorized'),
    quantity: String(product.quantity || '0'),
    price: String(product.price || '0'),
    total_value: String((parseInt(product.quantity || 0) * parseFloat(product.price || 0)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })),
    status: parseInt(product.quantity || 0) <= 0 ? 'Out of Stock' :
            parseInt(product.quantity || 0) <= 10 ? 'Low Stock' : 'In Stock'
  }));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Products Report
        </h2>
        <p className="text-gray-600">
          Product performance and expiry alerts for {dateRange.label}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium">
                Total Products
              </p>
              <p className="text-3xl font-bold">{stats.totalProducts}</p>
            </div>
            <Icon icon="mdi:cube-outline" className="w-8 h-8 text-teal-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">
                Active Products
              </p>
              <p className="text-3xl font-bold">{stats.activeProducts}</p>
            </div>
            <Icon icon="mdi:check-circle" className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Low Stock</p>
              <p className="text-3xl font-bold">{stats.lowStockProducts}</p>
            </div>
            <Icon icon="mdi:alert" className="w-8 h-8 text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Out of Stock</p>
              <p className="text-3xl font-bold">{stats.outOfStockProducts}</p>
            </div>
            <Icon icon="mdi:close-circle" className="w-8 h-8 text-red-200" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Total Inventory Value
            </h3>
            <Icon
              icon="fa7-solid:cedi-sign"
              className="w-6 h-6 text-green-600"
            />
          </div>
                     <p className="text-3xl font-bold text-green-600">
             GHS {stats.totalValue.toLocaleString()}
           </p>
          <p className="text-sm text-gray-500 mt-2">
            Based on current stock levels
          </p>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Product List
            </h3>
            {/* Removed custom Export Data button */}
          </div>
        </div>

        <GenericTable
          data={flattenedProducts}
          columns={columns}
          loading={loading}
          error={error}
          onRefresh={fetchProductsData}
          exportType="products"
          exportTitle="Export Product List"
          getFieldsOrder={() => [
            { label: "Product Name", key: "name", icon: "mdi:package-variant" },
            { label: "SKU", key: "sku", icon: "mdi:barcode" },
            { label: "Category", key: "category_name", icon: "mdi:shape" },
            { label: "Quantity", key: "quantity", icon: "mdi:counter" },
            { label: "Price", key: "price", icon: "mdi:currency-usd" },
            { label: "Total Value", key: "total_value", icon: "mdi:cash" },
            { label: "Status", key: "status", icon: "mdi:check-circle" },
          ]}
          getDefaultFields={() => ({
            name: true,
            sku: true,
            category_name: true,
            quantity: true,
            price: true,
            total_value: true,
            status: true,
          })}
          emptyMessage={
            <div className="text-center py-12">
              <Icon
                icon="mdi:cube-outline"
                className="w-12 h-12 mx-auto mb-4 text-gray-300"
              />
              <p className="text-gray-500">No products found</p>
            </div>
          }
        />
      </div>
    </div>
  );
} 