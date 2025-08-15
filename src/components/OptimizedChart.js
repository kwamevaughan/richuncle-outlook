import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icon } from '@iconify/react';

const OptimizedChart = ({ 
  data, 
  loading = false, 
  type = 'line', 
  title, 
  height = 400,
  showLegend = true,
  showGrid = true,
  animate = true,
  onDataUpdate,
  className = ''
}) => {
  const [chartLoading, setChartLoading] = useState(loading);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
  const [Chart, setChart] = useState(null);

  // Lazy load Chart.js only when needed
  useEffect(() => {
    const loadChart = async () => {
      try {
        const { Chart: ChartJS, registerables } = await import('chart.js');
        ChartJS.register(...registerables);
        setChart(ChartJS);
      } catch (err) {
        setError('Failed to load chart library');
        console.error('Chart loading error:', err);
      }
    };

    if (!Chart && data && data.length > 0) {
      loadChart();
    }
  }, [Chart, data]);

  // Memoized chart configuration
  const chartConfig = useMemo(() => {
    if (!data || !Chart) return null;

    return {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: animate ? {
          duration: 750,
          easing: 'easeInOutQuart'
        } : false,
        plugins: {
          legend: {
            display: showLegend,
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
          }
        },
        scales: showGrid ? {
          x: {
            display: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            }
          },
          y: {
            display: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            }
          }
        } : {},
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    };
  }, [data, Chart, type, showLegend, showGrid, animate]);

  // Initialize and update chart
  useEffect(() => {
    if (!Chart || !chartConfig || !chartRef.current) return;

    setChartLoading(true);
    
    // Destroy existing chart
    if (chartRef.current.chart) {
      chartRef.current.chart.destroy();
    }

    // Create new chart with loading simulation
    const timer = setTimeout(() => {
      try {
        chartRef.current.chart = new Chart(chartRef.current, chartConfig);
        setChartLoading(false);
        onDataUpdate?.();
      } catch (err) {
        setError('Failed to render chart');
        setChartLoading(false);
        console.error('Chart render error:', err);
      }
    }, 200); // Small delay for smooth loading transition

    return () => {
      clearTimeout(timer);
      if (chartRef.current?.chart) {
        chartRef.current.chart.destroy();
      }
    };
  }, [Chart, chartConfig, onDataUpdate]);

  // Update loading state when prop changes
  useEffect(() => {
    setChartLoading(loading);
  }, [loading]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ height }}>
        <div className="text-center text-gray-500">
          <Icon icon="mdi:chart-line-variant" className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setChartLoading(true);
            }}
            className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-white rounded-lg ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      
      <div className="relative p-4" style={{ height }}>
        {/* Loading Overlay */}
        {chartLoading && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <Icon 
                  icon="mdi:chart-line" 
                  className="w-4 h-4 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" 
                />
              </div>
              <p className="text-sm text-gray-600">Loading chart...</p>
            </div>
          </div>
        )}

        {/* Chart Canvas */}
        <div className={`transition-opacity duration-300 ${chartLoading ? 'opacity-30' : 'opacity-100'}`}>
          <canvas ref={chartRef} />
        </div>

        {/* No Data State */}
        {!chartLoading && (!data || !data.datasets || data.datasets.length === 0 || data.datasets.every(d => !d.data || d.data.length === 0)) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Icon icon="mdi:chart-line-variant" className="w-16 h-16 mx-auto mb-3" />
              <p className="text-sm">No data available</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs mt-2 text-red-500">
                  Debug: {JSON.stringify(data, null, 2)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(OptimizedChart);