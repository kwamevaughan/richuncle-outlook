import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

const DebugSalesReport = ({ 
  dateRange, 
  selectedStore, 
  stores, 
  mode,
  loading: parentLoading,
  onLoadingChange,
  lastUpdateTime
}) => {
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    onLoadingChange?.(true);
    
    try {
      console.log('Fetching orders data...');
      const response = await fetch("/api/orders");
      const result = await response.json();
      
      console.log('Raw API Response:', result);
      setRawData(result);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon icon="mdi:loading" className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading debug data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4">Sales Report Debug</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Date Range:</h3>
            <p>Start: {dateRange?.startDate?.toISOString()}</p>
            <p>End: {dateRange?.endDate?.toISOString()}</p>
          </div>
          
          <div>
            <h3 className="font-semibold">Selected Store:</h3>
            <p>{selectedStore}</p>
          </div>
          
          <div>
            <h3 className="font-semibold">Available Stores:</h3>
            <p>{stores?.length || 0} stores</p>
            <pre className="text-xs bg-gray-100 p-2 rounded">
              {JSON.stringify(stores, null, 2)}
            </pre>
          </div>
          
          {error && (
            <div>
              <h3 className="font-semibold text-red-600">Error:</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          <div>
            <h3 className="font-semibold">Raw API Data:</h3>
            <div className="bg-gray-100 p-4 rounded max-h-96 overflow-auto">
              <pre className="text-xs">
                {JSON.stringify(rawData, null, 2)}
              </pre>
            </div>
          </div>
          
          {rawData?.data && (
            <div>
              <h3 className="font-semibold">Data Summary:</h3>
              <p>Total orders: {rawData.data.length}</p>
              <p>Sample order fields: {rawData.data[0] ? Object.keys(rawData.data[0]).join(', ') : 'No orders'}</p>
              
              {rawData.data[0] && (
                <div className="mt-2">
                  <h4 className="font-medium">First Order Sample:</h4>
                  <pre className="text-xs bg-gray-50 p-2 rounded">
                    {JSON.stringify(rawData.data[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
        
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default DebugSalesReport;