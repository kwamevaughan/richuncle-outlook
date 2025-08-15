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
} from "chart.js";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";

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
  Filler,
);

export default function SalesReport({
  dateRange,
  selectedStore,
  stores,
  mode,
  loading: parentLoading,
}) {
  console.log('SalesReport: Component rendered with props:', {
    dateRange,
    selectedStore,
    stores,
    storesLength: stores?.length,
    storesType: typeof stores,
    storesIsArray: Array.isArray(stores),
    parentLoading,
    mode
  });

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
    dailyTrends: [],
  });

  const [orderItems, setOrderItems] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Debug effect to log when fetchSalesData is called
  useEffect(() => {
    console.log('=== SalesReport mounted or dependencies changed ===');
    console.log('Current stores:', stores);
    console.log('Current dateRange:', dateRange);
    console.log('Current selectedStore:', selectedStore);
    console.log('Parent loading:', parentLoading);
    
    // Don't proceed if stores are still loading or if stores data isn't loaded yet
    if (parentLoading || !stores || stores.length === 0) {
      console.log("SalesReport: Stores still loading or not available, skipping data fetch");
      setLoading(false);
      return;
    }

    // This will help us see if the effect is being triggered
    const fetchData = async () => {
      console.log('Fetching sales data...');
      await fetchSalesData();
    };
    
    fetchData().catch(error => {
      console.error('Error in fetchData:', error);
    });
    
    // Cleanup function
    return () => {
      console.log('=== Cleaning up SalesReport ===');
    };
  }, [dateRange, selectedStore, stores, parentLoading]);

  // Show loading state while stores are loading
  if (parentLoading || !stores || stores.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <Icon
              icon="mdi:store"
              className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            />
          </div>
          <p className="text-sm font-medium text-gray-700">
            Loading stores...
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Please wait while we load your store information
          </p>
        </div>
      </div>
    );
  }

  // Debug function to log sales data in a readable format
  const debugLogSalesData = (data, title = 'Sales Data') => {
    if (!Array.isArray(data) || data.length === 0) {
      console.log(`${title}: No data available`);
      return;
    }
    
    console.group(`${title} (${data.length} records)`);
    
    // Log summary of the data
    const summary = {
      dateRange: {
        min: new Date(Math.min(...data.map(s => new Date(s.timestamp || s.created_at).getTime()))).toISOString(),
        max: new Date(Math.max(...data.map(s => new Date(s.timestamp || s.created_at).getTime()))).toISOString()
      },
      totalAmount: data.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0).toFixed(2),
      paymentMethods: {},
      stores: {}
    };
    
    data.forEach(sale => {
      const method = sale.payment_method || 'unknown';
      const store = sale.store_id || 'unknown';
      
      summary.paymentMethods[method] = (summary.paymentMethods[method] || 0) + 1;
      summary.stores[store] = (summary.stores[store] || 0) + 1;
    });
    
    console.log('Summary:', summary);
    
    // Log first few records in detail
    const sampleSize = Math.min(5, data.length);
    console.log(`Sample records (${sampleSize} of ${data.length}):`, 
      data.slice(0, sampleSize).map(s => ({
        id: s.id,
        date: s.timestamp || s.created_at,
        total: s.total,
        items: s.items?.length || 0,
        payment_method: s.payment_method,
        store_id: s.store_id
      }))
    );
    
    console.groupEnd();
  };

  // Fetch sales data
  const fetchSalesData = async () => {
    console.log('=== Starting fetchSalesData ===');
    
    console.log('Stores available:', stores.length);
    console.log('Current date range:', dateRange);
    console.log('Selected store:', selectedStore);
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("SalesReport: Fetching orders data...");
      
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add date range to query
      if (dateRange?.startDate && dateRange?.endDate) {
        const startDate = dateRange.startDate.toISOString().split('T')[0];
        const endDate = new Date(dateRange.endDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        params.append('date_from', startDate);
        params.append('date_to', endDate);
        
        console.log('Date range filter:', { 
          startDate, 
          endDate,
          originalStartDate: dateRange.startDate.toISOString(),
          originalEndDate: dateRange.endDate.toISOString(),
          startDateObj: dateRange.startDate,
          endDateObj: dateRange.endDate
        });
      } else {
        console.log('No date range filter applied');
      }
      
      // Add store filter if not 'all'
      if (selectedStore && selectedStore !== 'all') {
        params.append('register_id', selectedStore);
        console.log('Store filter:', selectedStore);
      } else {
        console.log('No store filter applied (using all stores)');
      }
      
      // Make the API call
      const apiUrl = `/api/orders?${params.toString()}`;
      console.log('Making API request to:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
      
      let result;
      try {
        result = await response.json();
        console.log('API Response Status:', response.status, response.statusText);
        console.log('API Response Data:', result);
        
        if (!result) {
          console.error('API returned empty result');
          throw new Error('API returned empty result');
        }
        
        if (!result.success) {
          console.error('API Error:', result.error);
          throw new Error(result.error || 'Failed to fetch orders');
        }
        
        if (!result.data) {
          console.warn('API returned success but no data field');
          result.data = []; // Ensure data is always an array
        }
      } catch (parseError) {
        console.error('Error parsing API response:', parseError);
        console.log('Raw response text:', await response.text());
        throw new Error('Failed to parse API response');
      }
      
      const ordersData = Array.isArray(result.data) ? result.data : [];
      
      console.log("SalesReport: Orders data received:", ordersData.length, "orders");
      
      // Debug log the received data
      debugLogSalesData(ordersData, 'Raw API Response Data');
      
      if (ordersData.length === 0) {
        console.log("No orders found for the selected filters");
        setSales([]);
        setStats({
          totalSales: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          topProduct: null,
          topCustomer: null,
          paymentMethods: {},
          dailyTrends: []
        });
        setLoading(false);
        return;
      }
      
      // Process the orders data
      const processedData = ordersData.map(order => ({
        ...order,
        // Ensure we have a valid date
        date: order.timestamp ? new Date(order.timestamp) : new Date(),
        // Ensure we have a valid total
        total: parseFloat(order.total || 0),
        // Add store name
        store_name: stores.find(s => s.id === order.store_id)?.name || 'Unknown Store'
      }));
      
      console.log("SalesReport: Processed data:", processedData);
      
      // Update state with the processed data
      setSales(processedData);
      
      // Calculate and update stats
      calculateStats(processedData);
      
      // Fetch order items for additional data
      try {
        const orderItemsRes = await fetch('/api/order-items');
        if (orderItemsRes.ok) {
          const { data: orderItemsData } = await orderItemsRes.json();
          setOrderItems(Array.isArray(orderItemsData) ? orderItemsData : []);
        }
      } catch (itemsError) {
        console.error("Error fetching order items:", itemsError);
      }
      
      // Fetch products for additional data
      try {
        const productsRes = await fetch('/api/products');
        if (productsRes.ok) {
          const { data: productsData } = await productsRes.json();
          setProducts(Array.isArray(productsData) ? productsData : []);
        }
      } catch (productsError) {
        console.error("Error fetching products:", productsError);
      }
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics for the sales data
  const calculateStats = (salesData) => {
    console.log("SalesReport: Calculating stats for", salesData.length, "orders");
    
    if (!salesData || salesData.length === 0) {
      setStats({
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        topProduct: null,
        topCustomer: null,
        paymentMethods: {},
        dailyTrends: [],
      });
      return;
    }

    // Calculate basic stats
    const totalSales = salesData.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);
    const totalOrders = salesData.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    console.log('SalesReport: Processing orders:', {
      totalOrders,
      totalSales: totalSales.toFixed(2),
      averageOrderValue: averageOrderValue.toFixed(2),
      sampleOrders: salesData.slice(0, 3).map(s => ({
        id: s.id,
        payment_method: s.payment_method,
        total: s.total,
        timestamp: s.timestamp
      }))
    });

    // Initialize data structures for analysis
    const paymentMethods = {};
    const dailySales = {};
    const customerTotals = {};
    const productTotals = {};

    // Process each sale
    salesData.forEach((sale) => {
      // Process payment methods
      const paymentMethod = sale.payment_method || 'Unknown';
      const saleTotal = parseFloat(sale.total) || 0;
      paymentMethods[paymentMethod] = (paymentMethods[paymentMethod] || 0) + saleTotal;
      
      console.log(`Processing payment method: ${paymentMethod}, sale total: ${saleTotal}, running total: ${paymentMethods[paymentMethod]}`);

      // Process daily sales
      const saleDate = sale.timestamp 
        ? new Date(sale.timestamp).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];
      dailySales[saleDate] = (dailySales[saleDate] || 0) + saleTotal;

      // Process customer totals
      if (sale.customer_id) {
        if (!customerTotals[sale.customer_id]) {
          customerTotals[sale.customer_id] = {
            id: sale.customer_id,
            name: sale.customer_name || `Customer ${sale.customer_id}`,
            total: 0,
            orders: 0
          };
        }
        customerTotals[sale.customer_id].total += parseFloat(sale.total) || 0;
        customerTotals[sale.customer_id].orders += 1;
      }
    });

    // Process order items to get product sales
    const orderIds = salesData.map(sale => sale.id);
    const relevantOrderItems = orderItems.filter(item => 
      orderIds.includes(item.order_id)
    );

    relevantOrderItems.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        if (!productTotals[product.id]) {
          productTotals[product.id] = {
            id: product.id,
            name: product.name,
            sku: product.sku,
            quantity: 0,
            total: 0
          };
        }
        const quantity = parseInt(item.quantity) || 0;
        const price = parseFloat(item.price) || 0;
        productTotals[product.id].quantity += quantity;
        productTotals[product.id].total += quantity * price;
      }
    });

    // Find top customer
    const topCustomer = Object.values(customerTotals)
      .sort((a, b) => b.total - a.total)[0] || null;

    // Find top product
    const topProduct = Object.values(productTotals)
      .sort((a, b) => b.total - a.total)[0] || null;

    // Debug: Log payment methods calculation
    console.log('Final payment methods object:', paymentMethods);
    console.log('Payment methods totals:', Object.entries(paymentMethods).map(([method, total]) => `${method}: GHS ${total.toFixed(2)}`));

    // Format daily trends for chart
    const dailyTrends = Object.entries(dailySales)
      .map(([date, total]) => ({
        date,
        total: parseFloat(total.toFixed(2))
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Prepare the stats object
    const newStats = {
      totalSales: parseFloat(totalSales.toFixed(2)),
      totalOrders,
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      topProduct,
      topCustomer,
      paymentMethods,
      dailyTrends,
    };

    console.log("SalesReport: Calculated stats:", newStats);
    setStats(newStats);
  };

  // Chart data processing functions
  const getSalesTrendData = () => {
    console.log(
      "SalesReport: Getting sales trend data for",
      sales.length,
      "sales",
    );
    if (!sales || !Array.isArray(sales) || sales.length === 0) {
      console.log("SalesReport: No sales data available for trend chart");
      return { labels: [], datasets: [] };
    }

    // Group sales by date
    const salesByDate = {};
    sales.forEach((sale) => {
      const date = new Date(sale.timestamp).toLocaleDateString();
      salesByDate[date] =
        (salesByDate[date] || 0) + (parseFloat(sale.total) || 0);
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
          pointBackgroundColor: "rgb(59, 130, 246)",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 4,
        },
      ],
    };
  };

  const getPaymentMethodsChartData = () => {
    console.log(
      "SalesReport: Getting payment methods data:",
      stats.paymentMethods,
    );
    
    if (!stats.paymentMethods || Object.keys(stats.paymentMethods).length === 0) {
      return { labels: [], datasets: [] };
    }
    
    const methods = Object.keys(stats.paymentMethods);
    const amounts = Object.values(stats.paymentMethods);

    const colors = [
      "rgba(59, 130, 246, 0.8)", // Blue
      "rgba(16, 185, 129, 0.8)", // Green
      "rgba(245, 158, 11, 0.8)", // Yellow
      "rgba(239, 68, 68, 0.8)", // Red
      "rgba(139, 92, 246, 0.8)", // Purple
      "rgba(236, 72, 153, 0.8)", // Pink
    ];

    return {
      labels: methods.map(
        (method) => method.charAt(0).toUpperCase() + method.slice(1),
      ),
      datasets: [
        {
          data: amounts,
          backgroundColor: colors.slice(0, methods.length),
          borderColor: colors
            .slice(0, methods.length)
            .map((color) => color.replace("0.8", "1")),
          borderWidth: 2,
        },
      ],
    };
  };

  const getDailySalesBarData = () => {
    if (!sales || !Array.isArray(sales) || sales.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Group sales by date
    const salesByDate = {};
    const ordersByDate = {};

    sales.forEach((sale) => {
      const date = new Date(sale.timestamp).toLocaleDateString();
      salesByDate[date] =
        (salesByDate[date] || 0) + (parseFloat(sale.total) || 0);
      ordersByDate[date] = (ordersByDate[date] || 0) + 1;
    });

    const labels = Object.keys(salesByDate).sort();

    return {
      labels,
      datasets: [
        {
          label: "Sales Amount (GHS)",
          data: labels.map((date) => salesByDate[date]),
          backgroundColor: "rgba(59, 130, 246, 0.8)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
        },
        {
          label: "Number of Orders",
          data: labels.map((date) => ordersByDate[date]),
          backgroundColor: "rgba(16, 185, 129, 0.8)",
          borderColor: "rgb(16, 185, 129)",
          borderWidth: 1,
        },
      ],
    };
  };

  const getTopProductsData = () => {
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    // Build productId -> name map
    const productIdToName = {};
    products.forEach((p) => {
      productIdToName[p.id] = p.name;
    });
    // Aggregate quantities by product
    const productMap = {};
    orderItems.forEach((item) => {
      // Filter by date range and store
      const orderDate =
        item.orders && item.orders.timestamp
          ? new Date(item.orders.timestamp)
          : null;
      if (orderDate && dateRange.startDate && dateRange.endDate) {
        if (orderDate < dateRange.startDate || orderDate > dateRange.endDate)
          return;
      }
      if (selectedStore && selectedStore !== "all") {
        if (
          item.orders &&
          String(item.orders.register_id) !== String(selectedStore)
        )
          return;
      }
      // Try to get product name from mapping
      let productName = item.product_name || item.product?.name;
      if (!productName && item.product_id) {
        productName = productIdToName[item.product_id] || "Unknown Product";
      }
      if (!productName) productName = "Unknown Product";
      productMap[productName] =
        (productMap[productName] || 0) + (parseInt(item.quantity) || 0);
    });
    // Sort products by quantity sold
    const sorted = Object.entries(productMap).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 5);
    return {
      labels: top.map(([name]) => name),
      datasets: [
        {
          label: "Sales Volume",
          data: top.map(([, qty]) => qty),
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)",
            "rgba(16, 185, 129, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(139, 92, 246, 0.8)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  useEffect(() => {
    // Only fetch sales data if stores array is available
    if (stores && stores.length > 0) {
      fetchSalesData();
    }
  }, [dateRange, selectedStore, stores]);

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
          return date.toLocaleDateString("en-GB", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        } catch (e) {
          return "Invalid Date";
        }
      },
    },
    {
      Header: "Customer",
      accessor: "customer_name",
      render: (row, value) => value || "Walk-in Customer",
    },
    {
      Header: "Items",
      accessor: "item_count",
      render: (row, value) => value || "0",
    },
    {
      Header: "Total",
      accessor: "total",
      render: (row, value) => `GHS ${parseFloat(value || 0).toFixed(2)}`,
    },
    {
      Header: "Payment",
      accessor: "payment_method",
      render: (row, value) =>
        value ? value.charAt(0).toUpperCase() + value.slice(1) : "Cash",
    },
    {
      Header: "Status",
      accessor: "status",
    },
    {
      Header: "Cashier",
      accessor: "cashier_name",
      render: (row, value) => value || "Staff",
    },
    {
      Header: "Store",
      accessor: "store_name",
      render: (row, value) => value || "Main Store",
    },
  ];

  // Flatten sales data for export
  const flattenedSales = sales.map((sale) => ({
    id: String(sale.id || ""),
    timestamp: String(sale.timestamp || ""),
    customer_name: String(sale.customer_name || "Walk-in Customer"),
    item_count: String(sale.item_count || 0),
    total: String(sale.total || "0"),
    payment_method: String(sale.payment_method || "Cash"),
    status: String(sale.status || "Completed"),
    cashier_name: String(
      sale.payment_receiver_name || sale.cashier_name || "Staff",
    ),
    store_name: String(sale.store_name || "Main Store"),
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

      {/* No Data State */}
      {!loading && sales.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 mb-8 text-center">
          <Icon
            icon="mdi:chart-line"
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
          />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Sales Data Available
          </h3>
          <p className="text-gray-500 mb-4">
            No sales were found for the selected date range and store filters.
          </p>
          <div className="text-sm text-gray-400">
            <p>
              Date Range: {dateRange?.startDate?.toLocaleDateString()} -{" "}
              {dateRange?.endDate?.toLocaleDateString()}
            </p>
            <p>
              Store:{" "}
              {selectedStore === "all"
                ? "All Stores"
                : stores.find((s) => s.id === selectedStore)?.name ||
                  selectedStore}
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-gray-50 rounded-xl p-8 mb-8 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <Icon
              icon="mdi:chart-line"
              className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Loading Sales Data...
          </h3>
          <p className="text-gray-500">
            Please wait while we fetch your sales information
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 rounded-xl p-8 mb-8 text-center">
          <Icon
            icon="mdi:alert-circle"
            className="w-16 h-16 text-red-300 mx-auto mb-4"
          />
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            Error Loading Sales Data
          </h3>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => fetchSalesData()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

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
                  <Icon
                    icon={
                      method === "cash"
                        ? "mdi:cash"
                        : method === "momo"
                        ? "mdi:cellphone"
                        : "mdi:call-split"
                    }
                    className="w-8 h-8 text-gray-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section - Only show when there's data */}
      {!loading && !error && sales.length > 0 && (
        <>
          {/* First Row: Sales Trend and Payment Methods Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Sales Trend Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Sales Trend
                </h3>
                <Icon icon="mdi:chart-line" className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-64">
                {(() => {
                  const chartData = getSalesTrendData();
                  if (
                    !chartData ||
                    !chartData.labels ||
                    chartData.labels.length === 0
                  ) {
                    return (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <Icon icon="mdi:chart-line" className="w-8 h-8 mr-2" />
                        No trend data available
                      </div>
                    );
                  }
                  return (
                    <Line
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            callbacks: {
                              label: function (context) {
                                return `GHS ${context.parsed.y.toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}`;
                              },
                            },
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: function (value) {
                                return `GHS ${value.toLocaleString()}`;
                              },
                            },
                          },
                        },
                      }}
                    />
                  );
                })()}
              </div>
            </div>

            {/* Payment Methods Pie Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Payment Methods Distribution
                </h3>
                <Icon icon="mdi:pie-chart" className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-64">
                {(() => {
                  const chartData = getPaymentMethodsChartData();
                  if (
                    !chartData ||
                    !chartData.labels ||
                    chartData.labels.length === 0
                  ) {
                    return (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <Icon icon="mdi:pie-chart" className="w-8 h-8 mr-2" />
                        No payment methods data available
                      </div>
                    );
                  }
                  return (
                    <Doughnut
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "bottom",
                          },
                          tooltip: {
                            callbacks: {
                              label: function (context) {
                                const total = context.dataset.data.reduce(
                                  (a, b) => a + b,
                                  0
                                );
                                const percentage = (
                                  (context.parsed / total) *
                                  100
                                ).toFixed(1);
                                return `${
                                  context.label
                                }: GHS ${context.parsed.toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )} (${percentage}%)`;
                              },
                            },
                          },
                        },
                      }}
                    />
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Second Row: Daily Sales & Orders and Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Daily Sales Bar Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Daily Sales & Orders
                </h3>
                <Icon icon="mdi:chart-bar" className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-64">
                {(() => {
                  const chartData = getDailySalesBarData();
                  if (
                    !chartData ||
                    !chartData.labels ||
                    chartData.labels.length === 0
                  ) {
                    return (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <Icon icon="mdi:chart-bar" className="w-8 h-8 mr-2" />
                        No daily sales data available
                      </div>
                    );
                  }
                  return (
                    <Bar
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "top",
                          },
                          tooltip: {
                            callbacks: {
                              label: function (context) {
                                if (context.datasetIndex === 0) {
                                  return `Sales: GHS ${context.parsed.y.toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}`;
                                } else {
                                  return `Orders: ${context.parsed.y}`;
                                }
                              },
                            },
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: function (value) {
                                return value.toLocaleString();
                              },
                            },
                          },
                        },
                      }}
                    />
                  );
                })()}
              </div>
            </div>

            {/* Top Products Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Top Products
                </h3>
                <Icon
                  icon="mdi:package-variant"
                  className="w-5 h-5 text-gray-400"
                />
              </div>
              <div className="h-64">
                {(() => {
                  const chartData = getTopProductsData();
                  if (
                    !chartData ||
                    !chartData.labels ||
                    chartData.labels.length === 0
                  ) {
                    return (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <Icon
                          icon="mdi:package-variant"
                          className="w-8 h-8 mr-2"
                        />
                        No product data available
                      </div>
                    );
                  }
                  return (
                    <Bar
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: "y",
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            callbacks: {
                              label: function (context) {
                                return `Sales: ${context.parsed.x}`;
                              },
                            },
                          },
                        },
                        scales: {
                          x: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  );
                })()}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sales Table */}
      {!loading && !error && sales.length > 0 && (
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
            statusContext="sales"
            enableStatusPills={true}
            getFieldsOrder={() => [
              { label: "Order ID", key: "id", icon: "mdi:identifier" },
              { label: "Date", key: "timestamp", icon: "mdi:calendar" },
              { label: "Customer", key: "customer_name", icon: "mdi:account" },
              {
                label: "Items",
                key: "item_count",
                icon: "mdi:package-variant",
              },
              { label: "Total", key: "total", icon: "mdi:currency-usd" },
              {
                label: "Payment",
                key: "payment_method",
                icon: "mdi:credit-card",
              },
              { label: "Status", key: "status", icon: "mdi:check-circle" },
              {
                label: "Cashier",
                key: "cashier_name",
                icon: "mdi:account-tie",
              },
              { label: "Store", key: "store_name", icon: "mdi:store" },
            ]}
            getDefaultFields={() => ({
              id: true,
              timestamp: true,
              customer_name: true,
              item_count: true,
              total: true,
              payment_method: true,
              status: true,
              cashier_name: true,
              store_name: true,
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
      )}
    </div>
  );
}
