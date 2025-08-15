import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import OptimizedChart from '../OptimizedChart';
import { SalesReportSkeleton } from '../ReportSkeleton';

const MetricCard = ({ title, value, icon, color, change, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
        </div>
        <div className="w-24 h-8 bg-gray-200 rounded mb-2"></div>
        <div className="w-16 h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-16 h-16 rounded-lg flex items-center justify-center bg-${color}-100`}>
          <Icon icon={icon} className={`w-8 h-8 text-${color}-600`} />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm ${
            change > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            <Icon 
              icon={change > 0 ? 'mdi:trending-up' : 'mdi:trending-down'} 
              className="w-4 h-4" 
            />
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  );
};

const HybridSalesReport = ({ 
  dateRange, 
  selectedStore, 
  stores, 
  mode,
  loading: parentLoading,
  onLoadingChange,
  lastUpdateTime
}) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    paymentMethods: {}
  });

  // Fetch sales data using existing API
  const fetchSalesData = async () => {
    if (!stores || stores.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    onLoadingChange?.(true);
    
    try {
      const response = await fetch("/api/orders");
      const { data, error } = await response.json();

      if (error) throw new Error(error);

      // Filter by date range and store
      let filteredData = data || [];

      if (dateRange.startDate && dateRange.endDate) {
        filteredData = filteredData.filter((sale) => {
          // Try multiple date fields that might exist
          const dateField = sale.timestamp || sale.created_at || sale.date;
          if (!dateField) return false;
          
          const saleDate = new Date(dateField);
          return (
            saleDate >= dateRange.startDate && saleDate <= dateRange.endDate
          );
        });
      }

      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('Sales Report Debug:', {
          totalOrders: data?.length || 0,
          filteredOrders: filteredData.length,
          dateRange: {
            start: dateRange.startDate,
            end: dateRange.endDate
          },
          selectedStore,
          sampleOrder: filteredData[0] || data?.[0],
          stores: stores.length
        });
      }

      if (selectedStore !== "all") {
        filteredData = filteredData.filter(
          (sale) => sale.store_id === selectedStore || sale.register_id === selectedStore
        );
      }

      // Only include completed orders
      filteredData = filteredData.filter(sale => sale.status === 'Completed');

      setSales(filteredData);
      calculateStats(filteredData);
    } catch (err) {
      setError(err.message);
      console.error('Sales data fetch error:', err);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  // Calculate statistics
  const calculateStats = (salesData) => {
    const totalSales = salesData.reduce(
      (sum, sale) => sum + (parseFloat(sale.total) || 0),
      0,
    );
    const totalOrders = salesData.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Payment methods breakdown
    const paymentMethods = {};
    salesData.forEach((sale) => {
      const method = sale.payment_method || "cash";
      paymentMethods[method] =
        (paymentMethods[method] || 0) + (parseFloat(sale.total) || 0);
    });

    setStats({
      totalSales,
      totalOrders,
      averageOrderValue,
      paymentMethods,
    });
  };

  // Chart data processing
  const getSalesTrendData = () => {
    if (!sales.length) return { labels: [], datasets: [] };

    // Group sales by date
    const salesByDate = {};
    sales.forEach((sale) => {
      const dateField = sale.timestamp || sale.created_at || sale.date;
      if (!dateField) return;
      
      const date = new Date(dateField).toLocaleDateString();
      salesByDate[date] = (salesByDate[date] || 0) + (parseFloat(sale.total) || 0);
    });

    const labels = Object.keys(salesByDate).sort();
    const data = labels.map((date) => salesByDate[date]);

    return {
      labels,
      datasets: [
        {
          label: "Daily Sales (GHS)",
          data,
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const getPaymentMethodsChartData = () => {
    const methods = Object.keys(stats.paymentMethods);
    const amounts = Object.values(stats.paymentMethods);

    if (methods.length === 0) {
      return { labels: [], datasets: [] };
    }

    const colors = [
      "#10B981", // Green for cash
      "#3B82F6", // Blue for card
      "#F59E0B", // Amber for mobile money
      "#EF4444", // Red for others
      "#8B5CF6", // Purple for split
    ];

    return {
      labels: methods.map(
        (method) => method.charAt(0).toUpperCase() + method.slice(1),
      ),
      datasets: [
        {
          data: amounts,
          backgroundColor: colors.slice(0, methods.length),
          borderWidth: 2,
        },
      ],
    };
  };

  useEffect(() => {
    if (stores && stores.length > 0) {
      fetchSalesData();
    }
  }, [dateRange, selectedStore, stores]);

  if (loading && !sales.length) {
    return <SalesReportSkeleton />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <Icon icon="mdi:alert-circle" className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Report</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchSalesData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Report</h2>
          <p className="text-gray-600">
            {dateRange?.startDate?.toLocaleDateString()} - {dateRange?.endDate?.toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={fetchSalesData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Icon 
            icon="mdi:refresh" 
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
          />
          Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Sales"
          value={`GHS ${stats.totalSales?.toLocaleString() || '0'}`}
          icon="mdi:currency-usd"
          color="green"
          loading={loading}
        />
        <MetricCard
          title="Total Orders"
          value={stats.totalOrders || 0}
          icon="mdi:receipt"
          color="blue"
          loading={loading}
        />
        <MetricCard
          title="Average Order Value"
          value={`GHS ${stats.averageOrderValue?.toLocaleString() || '0'}`}
          icon="mdi:chart-line"
          color="purple"
          loading={loading}
        />
        <MetricCard
          title="Payment Methods"
          value={Object.keys(stats.paymentMethods || {}).length}
          icon="mdi:credit-card"
          color="orange"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OptimizedChart
          data={getSalesTrendData()}
          type="line"
          title="Daily Sales Trend"
          loading={loading}
          height={300}
          animate={true}
        />
        <OptimizedChart
          data={getPaymentMethodsChartData()}
          type="doughnut"
          title="Payment Methods Breakdown"
          loading={loading}
          height={300}
          animate={true}
        />
      </div>

      {/* Sales Summary Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                  <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.slice(0, 10).map((sale, index) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(sale.timestamp || sale.created_at || sale.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.customer_name || 'Walk-in Customer'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      GHS {parseFloat(sale.total || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(sale.payment_method || 'cash').charAt(0).toUpperCase() + (sale.payment_method || 'cash').slice(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-xs text-gray-400">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
};

export default React.memo(HybridSalesReport);