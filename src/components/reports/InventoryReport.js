import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { GenericTable } from "../GenericTable";
import ExportModal from "../export/ExportModal";
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

export default function InventoryReport({
  dateRange,
  selectedStore,
  stores,
  mode,
}) {
  const [products, setProducts] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    totalProducts: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
    lowStockValue: 0,
    stockThreshold: 10,
  });

  // Fetch inventory data
  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const [productsRes, adjustmentsRes, transfersRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/stock-adjustments"),
        fetch("/api/stock-transfers"),
      ]);

      const productsData = await productsRes.json();
      const adjustmentsData = await adjustmentsRes.json();
      const transfersData = await transfersRes.json();

      if (productsData.error) throw new Error(productsData.error);

      // Filter products by store if needed
      let filteredProducts = productsData.data || [];
      if (selectedStore !== "all") {
        filteredProducts = filteredProducts.filter(
          (product) => product.store_id === selectedStore || !product.store_id,
        );
      }

      setProducts(filteredProducts);

      // Combine stock movements
      const movements = [
        ...(adjustmentsData.data || []).map((adj) => ({
          ...adj,
          type: "adjustment",
          date: adj.adjustment_date,
          description: `${adj.adjustment_type} stock adjustment`,
        })),
        ...(transfersData.data || []).map((trans) => ({
          ...trans,
          type: "transfer",
          date: trans.transfer_date,
          description: `Stock transfer ${trans.status}`,
        })),
      ];

      // Filter movements by date range
      if (dateRange.startDate && dateRange.endDate) {
        const filteredMovements = movements.filter((movement) => {
          const movementDate = new Date(movement.date);
          return (
            movementDate >= dateRange.startDate &&
            movementDate <= dateRange.endDate
          );
        });
        setStockMovements(filteredMovements);
      } else {
        setStockMovements(movements);
      }

      calculateStats(filteredProducts);
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (productsData) => {
    const totalProducts = productsData.length;
    const inStock = productsData.filter(
      (p) => parseInt(p.quantity) > stats.stockThreshold,
    ).length;
    const lowStock = productsData.filter(
      (p) =>
        parseInt(p.quantity) > 0 &&
        parseInt(p.quantity) <= stats.stockThreshold,
    ).length;
    const outOfStock = productsData.filter(
      (p) => parseInt(p.quantity) <= 0,
    ).length;

    const totalValue = productsData.reduce((sum, p) => {
      const quantity = parseInt(p.quantity) || 0;
      const price = parseFloat(p.price) || 0;
      return sum + quantity * price;
    }, 0);

    const lowStockValue = productsData
      .filter(
        (p) =>
          parseInt(p.quantity) > 0 &&
          parseInt(p.quantity) <= stats.stockThreshold,
      )
      .reduce((sum, p) => {
        const quantity = parseInt(p.quantity) || 0;
        const price = parseFloat(p.price) || 0;
        return sum + quantity * price;
      }, 0);

    setStats({
      totalProducts,
      inStock,
      lowStock,
      outOfStock,
      totalValue,
      lowStockValue,
      stockThreshold: stats.stockThreshold,
    });
  };

  useEffect(() => {
    fetchInventoryData();
  }, [dateRange, selectedStore]);

  // Chart data processing functions
  const getStockStatusData = () => {
    const data = [
      {
        label: "In Stock",
        value: stats.inStock,
        color: "rgba(16, 185, 129, 0.8)",
      },
      {
        label: "Low Stock",
        value: stats.lowStock,
        color: "rgba(245, 158, 11, 0.8)",
      },
      {
        label: "Out of Stock",
        value: stats.outOfStock,
        color: "rgba(239, 68, 68, 0.8)",
      },
    ];

    return {
      labels: data.map((item) => item.label),
      datasets: [
        {
          data: data.map((item) => item.value),
          backgroundColor: data.map((item) => item.color),
          borderColor: data.map((item) => item.color.replace("0.8", "1")),
          borderWidth: 2,
        },
      ],
    };
  };

  const getInventoryValueByCategory = () => {
    // Group products by category and calculate total value
    const categoryValues = {};
    products.forEach((product) => {
      const category = product.category_name || "Uncategorized";
      const value =
        (parseInt(product.quantity) || 0) * (parseFloat(product.price) || 0);
      categoryValues[category] = (categoryValues[category] || 0) + value;
    });

    const labels = Object.keys(categoryValues);
    const data = Object.values(categoryValues);

    return {
      labels,
      datasets: [
        {
          label: "Inventory Value (GHS)",
          data,
          backgroundColor: "rgba(59, 130, 246, 0.8)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
        },
      ],
    };
  };

  const getStockMovementsData = () => {
    if (!stockMovements.length) return { labels: [], datasets: [] };

    // Group movements by date
    const movementsByDate = {};
    stockMovements.forEach((movement) => {
      const date = new Date(movement.date).toLocaleDateString();
      if (!movementsByDate[date]) {
        movementsByDate[date] = { adjustments: 0, transfers: 0 };
      }

      if (movement.type === "adjustment") {
        movementsByDate[date].adjustments += Math.abs(
          parseInt(movement.quantity_adjusted) || 0,
        );
      } else if (movement.type === "transfer") {
        movementsByDate[date].transfers += Math.abs(
          parseInt(movement.quantity_transferred) || 0,
        );
      }
    });

    const labels = Object.keys(movementsByDate).sort();

    return {
      labels,
      datasets: [
        {
          label: "Stock Adjustments",
          data: labels.map((date) => movementsByDate[date].adjustments),
          borderColor: "rgb(239, 68, 68)",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          fill: false,
          tension: 0.4,
        },
        {
          label: "Stock Transfers",
          data: labels.map((date) => movementsByDate[date].transfers),
          borderColor: "rgb(16, 185, 129)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: false,
          tension: 0.4,
        },
      ],
    };
  };

  const getLowStockAlertsData = () => {
    const lowStockProducts = products.filter(
      (p) =>
        parseInt(p.quantity) > 0 &&
        parseInt(p.quantity) <= stats.stockThreshold,
    );

    // Get top 10 low stock products
    const topLowStock = lowStockProducts
      .sort((a, b) => parseInt(a.quantity) - parseInt(b.quantity))
      .slice(0, 10);

    return {
      labels: topLowStock.map((p) => p.name),
      datasets: [
        {
          label: "Current Stock",
          data: topLowStock.map((p) => parseInt(p.quantity)),
          backgroundColor: "rgba(245, 158, 11, 0.8)",
          borderColor: "rgb(245, 158, 11)",
          borderWidth: 1,
        },
      ],
    };
  };

  // Table columns for products
  const productColumns = [
    { Header: "Product", accessor: "name" },
    { Header: "SKU", accessor: "sku" },
    {
      Header: "Category",
      accessor: "category_name",
      Cell: ({ value }) => value || "Uncategorized",
    },
    {
      Header: "Quantity",
      accessor: "quantity",
      Cell: ({ value }) => (
        <span
          className={`font-medium ${
            parseInt(value) <= 0
              ? "text-red-600"
              : parseInt(value) <= stats.stockThreshold
                ? "text-orange-600"
                : "text-green-600"
          }`}
        >
          {parseInt(value) || 0}
        </span>
      ),
    },
    {
      Header: "Unit Price",
      accessor: "price",
      Cell: ({ value }) => `GHS ${parseFloat(value || 0).toFixed(2)}`,
    },
    {
      Header: "Total Value",
      accessor: "total_value",
      Cell: ({ row }) => {
        const quantity = parseInt(row.original.quantity) || 0;
        const price = parseFloat(row.original.price) || 0;
        const totalValue = quantity * price;
        return `GHS ${totalValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      },
    },
    {
      Header: "Status",
      accessor: "stock_status",
      Cell: ({ row }) => {
        const quantity = parseInt(row.original.quantity) || 0;
        let status, color;
        if (quantity <= 0) {
          status = "Out of Stock";
          color = "bg-red-100 text-red-800";
        } else if (quantity <= stats.stockThreshold) {
          status = "Low Stock";
          color = "bg-orange-100 text-orange-800";
        } else {
          status = "In Stock";
          color = "bg-green-100 text-green-800";
        }
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}
          >
            {status}
          </span>
        );
      },
    },
  ];

  // Table columns for stock movements
  const movementColumns = [
    {
      Header: "Date",
      accessor: "date",
      Cell: ({ value }) => new Date(value).toLocaleDateString(),
    },
    {
      Header: "Type",
      accessor: "type",
      Cell: ({ value }) =>
        value ? value.charAt(0).toUpperCase() + value.slice(1) : "N/A",
    },
    {
      Header: "Product",
      accessor: "product_name",
      Cell: ({ value, row }) => value || row.original.product?.name || "N/A",
    },
    { Header: "Description", accessor: "description" },
    {
      Header: "Quantity",
      accessor: "quantity",
      Cell: ({ value, row }) => {
        const qty =
          row.original.type === "adjustment"
            ? row.original.quantity_adjusted
            : row.original.quantity_transferred;
        return qty || value || "N/A";
      },
    },
    {
      Header: "Reference",
      accessor: "reference",
      Cell: ({ value, row }) => {
        if (row.original.type === "adjustment") {
          return row.original.reference_number || "N/A";
        } else {
          return row.original.transfer_number || "N/A";
        }
      },
    },
    {
      Header: "Status",
      accessor: "status",
      Cell: ({ value, row }) => {
        if (row.original.type === "transfer") {
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                value === "completed"
                  ? "bg-green-100 text-green-800"
                  : value === "in_transit"
                    ? "bg-blue-100 text-blue-800"
                    : value === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
              }`}
            >
              {value ? value.charAt(0).toUpperCase() + value.slice(1) : "N/A"}
            </span>
          );
        }
        return "N/A";
      },
    },
  ];

  // Flatten products data for export
  const flattenedProducts = products.map((product) => ({
    name: String(product.name || ""),
    sku: String(product.sku || ""),
    category_name: String(product.category_name || "Uncategorized"),
    quantity: String(product.quantity || "0"),
    price: String(product.price || "0"),
    total_value: String(
      (
        parseInt(product.quantity || 0) * parseFloat(product.price || 0)
      ).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    ),
    stock_status:
      parseInt(product.quantity || 0) <= 0
        ? "Out of Stock"
        : parseInt(product.quantity || 0) <= stats.stockThreshold
          ? "Low Stock"
          : "In Stock",
    store_name: stores.find((s) => s.id === product.store_id)?.name || "N/A",
  }));

  // Flatten stock movements data for export
  const flattenedMovements = stockMovements.map((movement) => ({
    date: String(new Date(movement.date).toLocaleDateString()),
    type: String(
      movement.type
        ? movement.type.charAt(0).toUpperCase() + movement.type.slice(1)
        : "N/A",
    ),
    product_name: String(
      movement.product_name || movement.product?.name || "N/A",
    ),
    description: String(movement.description || ""),
    quantity: String(
      movement.type === "adjustment"
        ? movement.quantity_adjusted
        : movement.quantity_transferred || "N/A",
    ),
    reference: String(
      movement.type === "adjustment"
        ? movement.reference_number
        : movement.transfer_number || "N/A",
    ),
    status: String(
      movement.type === "transfer"
        ? movement.status
          ? movement.status.charAt(0).toUpperCase() + movement.status.slice(1)
          : "N/A"
        : "N/A",
    ),
  }));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Inventory Report
        </h2>
        <p className="text-gray-600">
          Stock levels, movements, and inventory analytics for {dateRange.label}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">
                Total Products
              </p>
              <p className="text-3xl font-bold">{stats.totalProducts}</p>
            </div>
            <Icon
              icon="mdi:package-variant"
              className="w-8 h-8 text-green-200"
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">In Stock</p>
              <p className="text-3xl font-bold">{stats.inStock}</p>
            </div>
            <Icon icon="mdi:check-circle" className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Low Stock</p>
              <p className="text-3xl font-bold">{stats.lowStock}</p>
            </div>
            <Icon icon="mdi:alert" className="w-8 h-8 text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Out of Stock</p>
              <p className="text-3xl font-bold">{stats.outOfStock}</p>
            </div>
            <Icon icon="mdi:close-circle" className="w-8 h-8 text-red-200" />
          </div>
        </div>
      </div>

      {/* Value Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
            GHS{" "}
            {stats.totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Based on current stock levels
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Low Stock Value
            </h3>
            <Icon icon="mdi:alert-circle" className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-600">
            GHS{" "}
            {stats.lowStockValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Products below threshold ({stats.stockThreshold})
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Stock Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Stock Status Distribution
            </h3>
            <Icon icon="mdi:pie-chart" className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Doughnut
              data={getStockStatusData()}
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
                          0,
                        );
                        const percentage = (
                          (context.parsed / total) *
                          100
                        ).toFixed(1);
                        return `${context.label}: ${context.parsed} products (${percentage}%)`;
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Inventory Value by Category */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Inventory Value by Category
            </h3>
            <Icon icon="mdi:chart-bar" className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Bar
              data={getInventoryValueByCategory()}
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
                        return `GHS ${context.parsed.x.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}`;
                      },
                    },
                  },
                },
                scales: {
                  x: {
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
          </div>
        </div>

        {/* Stock Movements Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Stock Movements Timeline
            </h3>
            <Icon icon="mdi:chart-line" className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Line
              data={getStockMovementsData()}
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
                        return `${context.dataset.label}: ${context.parsed.y} items`;
                      },
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Low Stock Alerts
            </h3>
            <Icon icon="mdi:alert" className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Bar
              data={getLowStockAlertsData()}
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
                        return `Current Stock: ${context.parsed.x}`;
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
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Current Stock Levels
            </h3>
            {/* Removed custom Export Data button */}
          </div>
        </div>
        <GenericTable
          data={flattenedProducts}
          columns={productColumns}
          loading={loading}
          error={error}
          onRefresh={fetchInventoryData}
          exportType="inventory"
          exportTitle="Export Inventory Data"
          statusContext="inventory"
          enableStatusPills={true}
          getFieldsOrder={() => [
            { label: "Product Name", key: "name", icon: "mdi:package-variant" },
            { label: "SKU", key: "sku", icon: "mdi:barcode" },
            { label: "Category", key: "category_name", icon: "mdi:shape" },
            { label: "Quantity", key: "quantity", icon: "mdi:counter" },
            { label: "Unit Price", key: "price", icon: "mdi:currency-usd" },
            { label: "Total Value", key: "total_value", icon: "mdi:cash" },
            { label: "Status", key: "stock_status", icon: "mdi:alert" },
            { label: "Store", key: "store_name", icon: "mdi:store" },
          ]}
          getDefaultFields={() => ({
            name: true,
            sku: true,
            category_name: true,
            quantity: true,
            price: true,
            total_value: true,
            stock_status: true,
            store_name: true,
          })}
          emptyMessage={
            <div className="text-center py-12">
              <Icon
                icon="mdi:package-variant"
                className="w-12 h-12 mx-auto mb-4 text-gray-300"
              />
              <p className="text-gray-500">No products found</p>
            </div>
          }
        />
      </div>

      {/* Stock Movements Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Stock Movements
          </h3>
        </div>

        <GenericTable
          data={flattenedMovements}
          columns={movementColumns}
          loading={loading}
          error={error}
          onRefresh={fetchInventoryData}
          exportType="stock-movements"
          exportTitle="Export Stock Movements"
          statusContext="inventory"
          enableStatusPills={true}
          getFieldsOrder={() => [
            { label: "Date", key: "date", icon: "mdi:calendar" },
            { label: "Type", key: "type", icon: "mdi:swap-horizontal" },
            {
              label: "Product",
              key: "product_name",
              icon: "mdi:package-variant",
            },
            { label: "Description", key: "description", icon: "mdi:text" },
            { label: "Quantity", key: "quantity", icon: "mdi:counter" },
            { label: "Reference", key: "reference", icon: "mdi:identifier" },
            { label: "Status", key: "status", icon: "mdi:check-circle" },
          ]}
          getDefaultFields={() => ({
            date: true,
            type: true,
            product_name: true,
            description: true,
            quantity: true,
            reference: true,
            status: true,
          })}
          emptyMessage={
            <div className="text-center py-12">
              <Icon
                icon="mdi:swap-horizontal"
                className="w-12 h-12 mx-auto mb-4 text-gray-300"
              />
              <p className="text-gray-500">
                No stock movements found for the selected period
              </p>
            </div>
          }
        />
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        users={flattenedProducts}
        mode={mode}
        type="inventory"
        title="Export Inventory Data"
      />
    </div>
  );
}
