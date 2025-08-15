import React from 'react';

const SkeletonBox = ({ width = 'w-full', height = 'h-4', className = '' }) => (
  <div className={`${width} ${height} bg-gray-200 rounded animate-pulse ${className}`} />
);

const ChartSkeleton = ({ height = 'h-64' }) => (
  <div className={`${height} bg-gray-100 rounded-lg p-4 animate-pulse`}>
    <div className="flex items-end justify-between h-full">
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className="bg-gray-300 rounded-t"
          style={{
            height: `${Math.random() * 60 + 20}%`,
            width: '12%'
          }}
        />
      ))}
    </div>
  </div>
);

const MetricCardSkeleton = () => (
  <div className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <SkeletonBox width="w-16" height="h-16" className="rounded-lg" />
      <SkeletonBox width="w-8" height="h-8" className="rounded" />
    </div>
    <SkeletonBox width="w-24" height="h-8" className="mb-2" />
    <SkeletonBox width="w-16" height="h-4" />
  </div>
);

const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    {/* Header */}
    <div className="bg-gray-50 p-4 border-b border-gray-200">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {[...Array(columns)].map((_, i) => (
          <SkeletonBox key={i} width="w-20" height="h-4" />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    {[...Array(rows)].map((_, rowIndex) => (
      <div key={rowIndex} className="p-4 border-b border-gray-100 last:border-b-0">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {[...Array(columns)].map((_, colIndex) => (
            <SkeletonBox 
              key={colIndex} 
              width={colIndex === 0 ? "w-32" : "w-16"} 
              height="h-4" 
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const SalesReportSkeleton = () => (
  <div className="p-6 space-y-6">
    {/* Metrics Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
    
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <SkeletonBox width="w-48" height="h-6" className="mb-4" />
        <ChartSkeleton height="h-64" />
      </div>
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <SkeletonBox width="w-40" height="h-6" className="mb-4" />
        <ChartSkeleton height="h-64" />
      </div>
    </div>
    
    {/* Table */}
    <div>
      <SkeletonBox width="w-32" height="h-6" className="mb-4" />
      <TableSkeleton rows={8} columns={5} />
    </div>
  </div>
);

export const InventoryReportSkeleton = () => (
  <div className="p-6 space-y-6">
    {/* Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
    
    {/* Chart and Stats */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
        <SkeletonBox width="w-40" height="h-6" className="mb-4" />
        <ChartSkeleton height="h-80" />
      </div>
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <SkeletonBox width="w-32" height="h-6" className="mb-4" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <SkeletonBox width="w-24" height="h-4" />
              <SkeletonBox width="w-12" height="h-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
    
    {/* Low Stock Table */}
    <div>
      <SkeletonBox width="w-40" height="h-6" className="mb-4" />
      <TableSkeleton rows={6} columns={4} />
    </div>
  </div>
);

export const GenericReportSkeleton = ({ 
  hasMetrics = true, 
  metricsCount = 4, 
  hasChart = true, 
  hasTable = true 
}) => (
  <div className="p-6 space-y-6">
    {hasMetrics && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(metricsCount)].map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    )}
    
    {hasChart && (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <SkeletonBox width="w-48" height="h-6" className="mb-4" />
        <ChartSkeleton height="h-64" />
      </div>
    )}
    
    {hasTable && (
      <div>
        <SkeletonBox width="w-32" height="h-6" className="mb-4" />
        <TableSkeleton />
      </div>
    )}
  </div>
);

export default {
  SalesReportSkeleton,
  InventoryReportSkeleton,
  GenericReportSkeleton,
  ChartSkeleton,
  MetricCardSkeleton,
  TableSkeleton
};