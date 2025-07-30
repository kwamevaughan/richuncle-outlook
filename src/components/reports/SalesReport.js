import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { GenericTable } from "../GenericTable";
import toast from "react-hot-toast";
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
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

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

export default function SalesReport({ dateRange, selectedStore, stores, mode }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Stats state
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topProduct: null,
    topCustomer: null,
    paymentMethods: {},
    dailyTrends: []
  });

  const [orderItems, setOrderItems] = useState([]);
  const [products, setProducts] = useState([]);

  // Fetch sales data
  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders');
      const { data, error } = await response.json();
      
      if (error) throw new Error(error);
      
      // Filter by date range and store
      let filteredData = data || [];
      
      if (dateRange.startDate && dateRange.endDate) {
        filteredData = filteredData.filter(sale => {
          const saleDate = new Date(sale.timestamp);
          return saleDate >= dateRange.startDate && saleDate <= dateRange.endDate;
        });
      }
      
      if (selectedStore !== "all") {
        filteredData = filteredData.filter(sale => sale.register_id === selectedStore);
      }
      
      // Fetch order items to get accurate item counts
      const orderItemsResponse = await fetch('/api/order-items');
      const { data: orderItemsData } = await orderItemsResponse.json();
      setOrderItems(orderItemsData || []);
      
      // Fetch all products for mapping
      const productsResponse = await fetch('/api/products');
      const { data: productsData } = await productsResponse.json();
      setProducts(productsData || []);
      
      // Fetch registers to get store mapping
      const registersResponse = await fetch('/api/registers');
      const { data: registers } = await registersResponse.json();
      
      // Create register to store mapping
      const registerToStoreMap = {};
      registers.forEach(register => {
        const store = stores.find(s => s.id === register.store_id);
        registerToStoreMap[register.id] = store ? store.name : 'Unknown Store';
      });
      
      // Add store name and item count to each sale record
      const salesWithStoreNames = filteredData.map(sale => {
        // Calculate item count from order items
        const saleItems = orderItemsData.filter(item => item.order_id === sale.id);
        const itemCount = saleItems.reduce((total, item) => total + (parseInt(item.quantity) || 0), 0);
        
        // Find store name through register mapping
        const storeName = registerToStoreMap[sale.register_id] || 'Unknown Store';
        
        return {
          ...sale,
          store_name: storeName,
          item_count: itemCount
        };
      });
      
      setSales(salesWithStoreNames);
      calculateStats(filteredData);
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (salesData) => {
    const totalSales = salesData.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);
    const totalOrders = salesData.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    // Payment methods breakdown
    const paymentMethods = {};
    salesData.forEach(sale => {
      const method = sale.payment_method || 'unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + (parseFloat(sale.total) || 0);
    });
    
    // Top product (simplified - would need order_items data for full analysis)
    const topProduct = salesData.length > 0 ? "Product Analysis" : null;
    
    // Top customer (simplified - would need customer data for full analysis)
    const topCustomer = salesData.length > 0 ? "Customer Analysis" : null;
    
    // Daily trends (simplified)
    const dailyTrends = [];
    if (salesData.length > 0) {
      const dateMap = {};
      salesData.forEach(sale => {
        const date = new Date(sale.timestamp).toDateString();
        dateMap[date] = (dateMap[date] || 0) + (parseFloat(sale.total) || 0);
      });
      dailyTrends.push(...Object.entries(dateMap).map(([date, amount]) => ({ date, amount })));
    }
    
    setStats({
      totalSales,
      totalOrders,
      averageOrderValue,
      topProduct,
      topCustomer,
      paymentMethods,
      dailyTrends
    });
  };

  // Chart data processing functions
  const getSalesTrendData = () => {
    if (!sales.length) return { labels: [], datasets: [] };

    // Group sales by date
    const salesByDate = {};
    sales.forEach(sale => {
      const date = new Date(sale.timestamp).toLocaleDateString();
      salesByDate[date] = (salesByDate[date] || 0) + (parseFloat(sale.total) || 0);
    });

    const labels = Object.keys(salesByDate).sort();
    const data = labels.map(date => salesByDate[date]);

    return {
      labels,
      datasets: [
        {
          label: 'Daily Sales (GHS)',
          data,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
        },
      ],
    };
  };

  const getPaymentMethodsChartData = () => {
    const methods = Object.keys(stats.paymentMethods);
    const amounts = Object.values(stats.paymentMethods);
    
    const colors = [
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(16, 185, 129, 0.8)',   // Green
      'rgba(245, 158, 11, 0.8)',   // Yellow
      'rgba(239, 68, 68, 0.8)',    // Red
      'rgba(139, 92, 246, 0.8)',   // Purple
      'rgba(236, 72, 153, 0.8)',   // Pink
    ];

    return {
      labels: methods.map(method => method.charAt(0).toUpperCase() + method.slice(1)),
      datasets: [
        {
          data: amounts,
          backgroundColor: colors.slice(0, methods.length),
          borderColor: colors.slice(0, methods.length).map(color => color.replace('0.8', '1')),
          borderWidth: 2,
        },
      ],
    };
  };

  const getDailySalesBarData = () => {
    if (!sales.length) return { labels: [], datasets: [] };

    // Group sales by date
    const salesByDate = {};
    const ordersByDate = {};
    
    sales.forEach(sale => {
      const date = new Date(sale.timestamp).toLocaleDateString();
      salesByDate[date] = (salesByDate[date] || 0) + (parseFloat(sale.total) || 0);
      ordersByDate[date] = (ordersByDate[date] || 0) + 1;
    });

    const labels = Object.keys(salesByDate).sort();
    
    return {
      labels,
      datasets: [
        {
          label: 'Sales Amount (GHS)',
          data: labels.map(date => salesByDate[date]),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
        {
          label: 'Number of Orders',
          data: labels.map(date => ordersByDate[date]),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
          yAxisID: 'y1',
        },
      ],
    };
  };

  const getTopProductsData = () => {
    if (!orderItems.length) return { labels: [], datasets: [] };
    // Build productId -> name map
    const productIdToName = {};
    products.forEach(p => {
      productIdToName[p.id] = p.name;
    });
    // Aggregate quantities by product
    const productMap = {};
    orderItems.forEach(item => {
      // Filter by date range and store
      const orderDate = item.orders && item.orders.timestamp ? new Date(item.orders.timestamp) : null;
      if (orderDate && dateRange.startDate && dateRange.endDate) {
        if (orderDate < dateRange.startDate || orderDate > dateRange.endDate) return;
      }
      if (selectedStore && selectedStore !== 'all') {
        if (item.orders && String(item.orders.register_id) !== String(selectedStore)) return;
      }
      // Try to get product name from mapping
      let productName = item.product_name || item.product?.name;
      if (!productName && item.product_id) {
        productName = productIdToName[item.product_id] || 'Unknown Product';
      }
      if (!productName) productName = 'Unknown Product';
      productMap[productName] = (productMap[productName] || 0) + (parseInt(item.quantity) || 0);
    });
    // Sort products by quantity sold
    const sorted = Object.entries(productMap).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 5);
    return {
      labels: top.map(([name]) => name),
      datasets: [
        {
          label: 'Sales Volume',
          data: top.map(([, qty]) => qty),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  useEffect(() => {
    fetchSalesData();
  }, [dateRange, selectedStore]);

  // Table columns for sales data
  const columns = [
    { Header: "Order ID", accessor: "id" },
    { 
      Header: "Date", 
      accessor: "timestamp", 
      render: (row, value) => {
        if (!value) return "No Date";
        try {
          const date = new Date(value);
          if (isNaN(date.getTime())) return "Invalid Date";
          return date.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (e) {
          return "Invalid Date";
        }
      }
    },
    { 
      Header: "Customer", 
      accessor: "customer_name", 
      render: (row, value) => value || "Walk-in Customer"
    },
    { 
      Header: "Items", 
      accessor: "item_count", 
      render: (row, value) => value || "0"
    },
    { 
      Header: "Total", 
      accessor: "total", 
      render: (row, value) => `GHS ${parseFloat(value || 0).toFixed(2)}`
    },
    { 
      Header: "Payment", 
      accessor: "payment_method", 
      render: (row, value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : "Cash"
    },
    { 
      Header: "Status", 
      accessor: "status", 
      render: (row, value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'completed' ? 'bg-green-100 text-green-800' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          value === 'cancelled' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : "Completed"}
        </span>
      )
    },
    { 
      Header: "Cashier", 
      accessor: "cashier_name", 
      render: (row, value) => value || "Staff"
    }
  ];

  // Flatten sales data for export
  const flattenedSales = sales.map(sale => ({
    id: String(sale.id || ''),
    timestamp: String(sale.timestamp || ''),
    customer_name: String(sale.customer_name || 'Walk-in Customer'),
    item_count: String(sale.item_count || 0),
    total: String(sale.total || '0'),
    payment_method: String(sale.payment_method || 'Cash'),
    status: String(sale.status || 'Completed'),
    cashier_name: String(sale.payment_receiver_name || sale.cashier_name || 'Staff'),
    store_name: String(sale.store_name || 'Main Store')
  }));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sales Report</h2>
        <p className="text-gray-600">
          Sales performance and analytics for {dateRange.label}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Sales</p>
              <p className="text-3xl font-bold">
                GHS{" "}
                {stats.totalSales.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <Icon
              icon="fa7-solid:cedi-sign"
              className="w-8 h-8 text-blue-200"
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-bold">
                {stats.totalOrders.toLocaleString()}
              </p>
            </div>
            <Icon icon="mdi:shopping" className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">
                Average Order
              </p>
              <p className="text-3xl font-bold">
                GHS{" "}
                {stats.averageOrderValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <Icon icon="mdi:chart-line" className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">
                Payment Methods
              </p>
              <p className="text-3xl font-bold">
                {Object.keys(stats.paymentMethods).length.toLocaleString()}
              </p>
            </div>
            <Icon icon="mdi:credit-card" className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Payment Methods Breakdown */}
      {Object.keys(stats.paymentMethods).length > 0 && (
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Methods Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.paymentMethods).map(([method, amount]) => (
              <div
                key={method}
                className="bg-white rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 capitalize">
                      {method}
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      GHS{" "}
                      {amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {((amount / stats.totalSales) * 100).toLocaleString(
                        undefined,
                        { maximumFractionDigits: 1 }
                      )}
                      %
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Trend Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
            <Icon icon="mdi:chart-line" className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Line
              data={getSalesTrendData()}
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

        {/* Payment Methods Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Methods Distribution</h3>
            <Icon icon="mdi:pie-chart" className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Doughnut
              data={getPaymentMethodsChartData()}
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
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((context.parsed / total) * 100).toFixed(1);
                        return `${context.label}: GHS ${context.parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percentage}%)`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Daily Sales Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Daily Sales & Orders</h3>
            <Icon icon="mdi:chart-bar" className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Bar
              data={getDailySalesBarData()}
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
                        if (context.datasetIndex === 0) {
                          return `Sales: GHS ${context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        } else {
                          return `Orders: ${context.parsed.y}`;
                        }
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return `GHS ${value.toLocaleString()}`;
                      }
                    }
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                      drawOnChartArea: false,
                    },
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Top Products Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
            <Icon icon="mdi:package-variant" className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Bar
              data={getTopProductsData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `Sales: ${context.parsed.x}`;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Sales Transactions
            </h3>
          </div>
        </div>

        <GenericTable
          data={flattenedSales}
          columns={columns}
          loading={loading}
          error={error}
          onRefresh={fetchSalesData}
          exportType="sales"
          exportTitle="Export Sales Report"
          hideEmptyColumns={false}
          getFieldsOrder={() => [
            { label: "Order ID", key: "id", icon: "mdi:identifier" },
            { label: "Date", key: "timestamp", icon: "mdi:calendar" },
            { label: "Customer", key: "customer_name", icon: "mdi:account" },
            { label: "Items", key: "item_count", icon: "mdi:package-variant" },
            { label: "Total", key: "total", icon: "mdi:currency-usd" },
            {
              label: "Payment Method",
              key: "payment_method",
              icon: "mdi:credit-card",
            },
            { label: "Status", key: "status", icon: "mdi:check-circle" },
            { label: "Cashier", key: "cashier_name", icon: "mdi:account-tie" },
            { label: "Store", key: "store_name", icon: "mdi:store" },
          ]}
          getDefaultFields={() => ({
            id: true,
            timestamp: true,
            customer_name: true,
            total: true,
            payment_method: true,
            status: true,
            cashier_name: true,
            store_name: true,
            item_count: false,
          })}
          emptyMessage={
            <div className="text-center py-12">
              <Icon
                icon="mdi:chart-line"
                className="w-12 h-12 mx-auto mb-4 text-gray-300"
              />
              <p className="text-gray-500">
                No sales data found for the selected period
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
} 