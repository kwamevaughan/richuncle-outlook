import React, { useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useSalesReportData } from '../../hooks/useReportData';
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

const OptimizedSalesReport = ({ 
  dateRange, 
  selectedStore, 
  stores, 
  mode,
  loading: parentLoading,
  onLoadingChange,
  lastUpdateTime
}) => {
  const filters = { dateRange, selectedStore };
  const { data, loading, error, refresh, lastFetch } = useSalesReportData(filters);

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  if (loading && !data) {
    return <SalesReportSkeleton />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <Icon icon="mdi:alert-circle" className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Report</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};
  const topProducts = data?.topProducts || [];

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Sales Report Data:', { data, metrics, charts, topProducts });
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
          onClick={refresh}
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
          value={`GHS ${metrics.totalSales?.toLocaleString() || '0'}`}
          icon="mdi:currency-usd"
          color="green"
          loading={loading}
        />
        <MetricCard
          title="Total Orders"
          value={metrics.totalOrders || 0}
          icon="mdi:receipt"
          color="blue"
          loading={loading}
        />
        <MetricCard
          title="Average Order Value"
          value={`GHS ${metrics.averageOrderValue?.toLocaleString() || '0'}`}
          icon="mdi:chart-line"
          color="purple"
          loading={loading}
        />
        <MetricCard
          title="Payment Methods"
          value={Object.keys(metrics.paymentMethods || {}).length}
          icon="mdi:credit-card"
          color="orange"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OptimizedChart
          data={charts.daily}
          type="line"
          title="Daily Sales Trend"
          loading={loading}
          height={300}
          animate={true}
        />
        <OptimizedChart
          data={charts.paymentMethods}
          type="doughnut"
          title="Payment Methods Breakdown"
          loading={loading}
          height={300}
          animate={true}
        />
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
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
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topProducts.map((product, index) => (
                  <tr key={product.product_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      GHS {product.revenue.toLocaleString()}
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
        Last updated: {new Date(lastFetch).toLocaleString()}
      </div>
    </div>
  );
};

export default React.memo(OptimizedSalesReport);