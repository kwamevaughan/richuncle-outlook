import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOptimizedData } from './useOptimizedData';

export function useReportData(reportType, filters = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(Date.now());

  // Create cache key based on report type and filters
  const cacheKey = useMemo(() => {
    const filterString = JSON.stringify(filters);
    return `report-${reportType}-${btoa(filterString).slice(0, 10)}`;
  }, [reportType, filters]);

  // Build API endpoint with filters
  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    
    if (filters.dateRange) {
      params.append('start_date', filters.dateRange.startDate.toISOString());
      params.append('end_date', filters.dateRange.endDate.toISOString());
    }
    
    if (filters.selectedStore && filters.selectedStore !== 'all') {
      params.append('store_id', filters.selectedStore);
    }
    
    return `/api/reports/${reportType}?${params.toString()}`;
  }, [reportType, filters]);

  // Use optimized data fetching with caching
  const { 
    data, 
    loading: dataLoading, 
    error: dataError, 
    refresh 
  } = useOptimizedData(endpoint, {
    cacheKey,
    cacheDuration: 2 * 60 * 1000, // 2 minutes cache for reports
    dependencies: [filters],
    onSuccess: () => {
      setLastFetch(Date.now());
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  // Manual refresh function
  const refreshData = useCallback(() => {
    setLoading(true);
    refresh();
    setTimeout(() => setLoading(false), 500);
  }, [refresh]);

  // Auto-refresh every 5 minutes for real-time data
  useEffect(() => {
    const interval = setInterval(() => {
      if (!dataLoading && !loading) {
        refresh();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [dataLoading, loading, refresh]);

  return {
    data,
    loading: dataLoading || loading,
    error: dataError || error,
    refresh: refreshData,
    lastFetch,
    cacheKey
  };
}

// Specialized hooks for different report types
export function useSalesReportData(filters) {
  return useReportData('sales', filters);
}

export function useInventoryReportData(filters) {
  return useReportData('inventory', filters);
}

export function usePurchasesReportData(filters) {
  return useReportData('purchases', filters);
}

export function useCustomersReportData(filters) {
  return useReportData('customers', filters);
}

export function useSuppliersReportData(filters) {
  return useReportData('suppliers', filters);
}

export function useProductsReportData(filters) {
  return useReportData('products', filters);
}

export function useExpensesReportData(filters) {
  return useReportData('expenses', filters);
}

export function usePaymentReportData(filters) {
  return useReportData('payments', filters);
}

export function useProfitLossReportData(filters) {
  return useReportData('profit-loss', filters);
}

export function useTaxReportData(filters) {
  return useReportData('tax', filters);
}

export function useAnnualReportData(filters) {
  return useReportData('annual', filters);
}

export function useZReportData(filters) {
  return useReportData('z-report', filters);
}