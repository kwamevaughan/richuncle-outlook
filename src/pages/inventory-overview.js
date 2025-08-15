import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import useResponsive from "../hooks/useResponsive";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import SimpleModal from "@/components/SimpleModal";
import { GenericTable } from "@/components/GenericTable";
import toast from "react-hot-toast";
import { useRouter } from "next/router";

export default function InventoryOverviewPage({
  mode = "light",
  toggleMode,
  ...props
}) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  const { isMobile, isTablet, getTableContainerClass } = useResponsive();
  const router = useRouter();

  // State for products
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // table or grid
  const [stockThreshold, setStockThreshold] = useState(10);

  // Modal states
  const [showQuickUpdateModal, setShowQuickUpdateModal] = useState(false);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Form states
  const [quickUpdateQuantity, setQuickUpdateQuantity] = useState("");
  const [quickUpdateType, setQuickUpdateType] = useState("add");
  const [bulkUpdateQuantity, setBulkUpdateQuantity] = useState("");
  const [bulkUpdateType, setBulkUpdateType] = useState("set");
  const [importData, setImportData] = useState("");

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    critical: 0,
    totalValue: 0,
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const response = await fetch("/api/categories");
      const { data, error } = await response.json();
      if (!error) setCategories(data || []);
    };
    fetchCategories();
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/products");
      const { data, error } = await response.json();

      if (error) throw error;

      setProducts(data || []);
      calculateStats(data || []);
    } catch (err) {
      setError(err.message || "Failed to load products");
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (productData) => {
    const total = productData.length;
    const inStock = productData.filter(
      (p) => parseInt(p.quantity) > stockThreshold,
    ).length;
    const lowStock = productData.filter(
      (p) => parseInt(p.quantity) > 0 && parseInt(p.quantity) <= stockThreshold,
    ).length;
    const outOfStock = productData.filter(
      (p) => parseInt(p.quantity) <= 0,
    ).length;
    const critical = productData.filter(
      (p) => parseInt(p.quantity) > 0 && parseInt(p.quantity) <= 5,
    ).length;
    const totalValue = productData.reduce((sum, p) => {
      const quantity = parseInt(p.quantity) || 0;
      const price = parseFloat(p.price) || 0;
      return sum + quantity * price;
    }, 0);

    setStats({ total, inStock, lowStock, outOfStock, critical, totalValue });
  };

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [stockThreshold]);

  // Open Quick Update modal if quickUpdateId is present in query
  useEffect(() => {
    if (!loading && products.length > 0 && router.query.quickUpdateId) {
      const product = products.find((p) => p.id === router.query.quickUpdateId);
      if (product) {
        setSelectedProduct(product);
        setQuickUpdateType("add");
        setQuickUpdateQuantity("");
        setShowQuickUpdateModal(true);
      }
    }
  }, [loading, products, router.query.quickUpdateId]);

  // Filter products
  const filteredProducts = products.filter((product) => {
    const quantity = parseInt(product.quantity) || 0;
    const matchesSearch =
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category_id === categoryFilter;

    let matchesStockStatus = true;
    switch (stockStatusFilter) {
      case "in-stock":
        matchesStockStatus = quantity > stockThreshold;
        break;
      case "low-stock":
        matchesStockStatus = quantity > 0 && quantity <= stockThreshold;
        break;
      case "critical":
        matchesStockStatus = quantity > 0 && quantity <= 5;
        break;
      case "out-of-stock":
        matchesStockStatus = quantity <= 0;
        break;
      default:
        matchesStockStatus = true;
    }

    return matchesSearch && matchesCategory && matchesStockStatus;
  });

  // Get stock status styling
  const getStockStatus = (quantity) => {
    const qty = parseInt(quantity) || 0;
    if (qty <= 0)
      return {
        status: "Out of Stock",
        color: "text-red-700",
        bg: "bg-red-100 border-red-200",
        icon: "mdi:close-circle",
        priority: "urgent",
      };
    if (qty <= 5)
      return {
        status: "Critical Low",
        color: "text-red-600",
        bg: "bg-red-50 border-red-200",
        icon: "mdi:alert-circle",
        priority: "high",
      };
    if (qty <= stockThreshold)
      return {
        status: "Low Stock",
        color: "text-orange-600",
        bg: "bg-orange-50 border-orange-200",
        icon: "mdi:alert",
        priority: "medium",
      };
    return {
      status: "In Stock",
      color: "text-green-600",
      bg: "bg-green-50 border-green-200",
      icon: "mdi:check-circle",
      priority: "low",
    };
  };

  // Handle quick update
  const handleQuickUpdate = async () => {
    if (!quickUpdateQuantity || !selectedProduct) {
      toast.error("Please enter quantity");
      return;
    }

    const quantity = parseInt(quickUpdateQuantity);
    if (isNaN(quantity) || quantity < 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    try {
      const currentStock = parseInt(selectedProduct.quantity) || 0;
      let newStock;

      switch (quickUpdateType) {
        case "add":
          newStock = currentStock + quantity;
          break;
        case "subtract":
          newStock = Math.max(0, currentStock - quantity);
          break;
        case "set":
          newStock = quantity;
          break;
        default:
          newStock = currentStock;
      }

      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: newStock }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Updated ${selectedProduct.name}`);
        setQuickUpdateQuantity("");
        setShowQuickUpdateModal(false);
        setSelectedProduct(null);
        fetchProducts();
      } else {
        throw new Error(result.error || "Failed to update product");
      }
    } catch (err) {
      toast.error("Failed to update product");
    }
  };

  // Handle bulk update
  const handleBulkUpdate = async () => {
    if (!bulkUpdateQuantity || selectedProducts.length === 0) {
      toast.error("Please select products and enter quantity");
      return;
    }

    const quantity = parseInt(bulkUpdateQuantity);
    if (isNaN(quantity) || quantity < 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    try {
      const updates = selectedProducts.map((productId) => {
        const product = products.find((p) => p.id === productId);
        const currentStock = parseInt(product.quantity) || 0;
        let newStock;

        switch (bulkUpdateType) {
          case "add":
            newStock = currentStock + quantity;
            break;
          case "subtract":
            newStock = Math.max(0, currentStock - quantity);
            break;
          case "set":
            newStock = quantity;
            break;
          default:
            newStock = currentStock;
        }

        return {
          id: productId,
          quantity: newStock,
        };
      });

      const response = await fetch("/api/products/bulk-update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Updated ${selectedProducts.length} products`);
        setBulkUpdateQuantity("");
        setShowBulkUpdateModal(false);
        setSelectedProducts([]);
        fetchProducts();
      } else {
        throw new Error(result.error || "Failed to update products");
      }
    } catch (err) {
      toast.error("Failed to update products");
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!importData.trim()) {
      toast.error("Please enter import data");
      return;
    }

    try {
      const lines = importData.trim().split("\n");
      const updates = [];

      for (let i = 1; i < lines.length; i++) {
        const [sku, quantity] = lines[i].split(",").map((s) => s.trim());
        if (sku && quantity) {
          const product = products.find((p) => p.sku === sku);
          if (product) {
            updates.push({
              id: product.id,
              quantity: parseInt(quantity) || 0,
            });
          }
        }
      }

      if (updates.length === 0) {
        toast.error("No valid products found in import data");
        return;
      }

      const response = await fetch("/api/products/bulk-update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Imported ${updates.length} products`);
        setImportData("");
        setShowImportModal(false);
        fetchProducts();
      } else {
        throw new Error(result.error || "Failed to import products");
      }
    } catch (err) {
      toast.error("Failed to import products");
    }
  };

  // Product Card Component for Grid View
  const ProductCard = ({ product }) => {
    const stockStatus = getStockStatus(product.quantity);
    const quantity = parseInt(product.quantity) || 0;
    const price = parseFloat(product.price) || 0;
    const value = price * quantity;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                <Icon
                  icon="mdi:package-variant"
                  className="w-6 h-6 text-blue-600"
                />
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium border ${stockStatus.bg} ${stockStatus.color}`}
            >
              <div className="flex items-center gap-1">
                <Icon icon={stockStatus.icon} className="w-3 h-3" />
                {stockStatus.status}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
              {product.name}
            </h3>
            <p className="text-sm text-gray-500 mb-2">SKU: {product.sku}</p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Icon icon="mdi:tag-outline" className="w-4 h-4" />
              {product.categories?.name || "N/A"}
            </div>
          </div>

          {/* Stock Info */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Stock Level
              </span>
              <span className={`text-sm font-semibold ${stockStatus.color}`}>
                {quantity} units
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Unit Price
              </span>
              <span className="text-sm font-semibold text-gray-900">
                GHS {price.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Total Value
              </span>
              <span className="text-sm font-semibold text-gray-900">
                GHS {value.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Stock Level</span>
              <span>
                {quantity}/{stockThreshold}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  quantity === 0
                    ? "bg-red-500"
                    : quantity <= 5
                      ? "bg-red-400"
                      : quantity <= stockThreshold
                        ? "bg-orange-400"
                        : "bg-green-400"
                }`}
                style={{
                  width: `${Math.min((quantity / stockThreshold) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedProduct(product);
                setQuickUpdateType("add");
                setQuickUpdateQuantity("");
                setShowQuickUpdateModal(true);
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Icon icon="mdi:plus" className="w-4 h-4" />
              Add Stock
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedProduct(product);
                setQuickUpdateType("set");
                setQuickUpdateQuantity(quantity.toString());
                setShowQuickUpdateModal(true);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Icon icon="mdi:pencil" className="w-4 h-4" />
              Edit Stock
            </button>
          </div>
        </div>
      </div>
    );
  };

  // GenericTable columns configuration
  const columns = [
    {
      accessor: "stock_status",
      Header: "Status",
      sortable: true,
      className: isMobile ? "max-w-20" : isTablet ? "max-w-28" : "",
      render: (row) => {
        const stockStatus = getStockStatus(row.quantity);
        return (
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm border ${stockStatus.bg} ${stockStatus.color}`}
          >
            <Icon icon={stockStatus.icon} className="w-3 h-3" />
            {stockStatus.status}
          </span>
        );
      },
    },
    {
      accessor: "name",
      Header: "Product",
      sortable: true,
      className: isMobile ? "max-w-20" : isTablet ? "max-w-28" : "",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
            <Icon
              icon="mdi:package-variant"
              className="w-5 h-5 text-blue-600"
            />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {row.name}
            </div>
            <div className="text-sm text-gray-500">SKU: {row.sku}</div>
          </div>
        </div>
      ),
    },
    {
      accessor: "category",
      Header: "Category",
      sortable: true,
      className: isMobile ? "max-w-20" : isTablet ? "max-w-28" : "",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Icon icon="mdi:tag-outline" className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-900">
            {row.categories?.name || "N/A"}
          </span>
        </div>
      ),
    },
    {
      accessor: "quantity",
      Header: "Stock Status",
      sortable: true,
      className: isMobile ? "max-w-20" : isTablet ? "max-w-28" : "",
      render: (row) => {
        const stockStatus = getStockStatus(row.quantity);
        const quantity = parseInt(row.quantity) || 0;
        return (
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${stockStatus.bg} ${stockStatus.color}`}
          >
            <Icon icon={stockStatus.icon} className="w-3 h-3" />
            {quantity} units
          </div>
        );
      },
    },
    {
      accessor: "price",
      Header: "Price",
      sortable: true,
      className: isMobile ? "max-w-20" : isTablet ? "max-w-28" : "",
      render: (row) => (
        <div className="text-sm font-semibold text-gray-900">
          GHS {parseFloat(row.price).toLocaleString()}
        </div>
      ),
    },
    {
      accessor: "value",
      Header: "Value",
      sortable: true,
      className: isMobile ? "max-w-20" : isTablet ? "max-w-28" : "",
      render: (row) => {
        const quantity = parseInt(row.quantity) || 0;
        const price = parseFloat(row.price) || 0;
        const value = price * quantity;
        return (
          <div className="text-sm font-semibold text-gray-900">
            GHS {value.toLocaleString()}
          </div>
        );
      },
    },
  ];

  // Custom actions for the table
  const tableActions = [
    {
      label: "Add Stock",
      icon: "mdi:plus-circle-outline",
      className: "bg-blue-500/10 text-blue-600",
      onClick: (row, e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        setSelectedProduct(row);
        setQuickUpdateType("add");
        setQuickUpdateQuantity("");
        setShowQuickUpdateModal(true);
      },
    },
    {
      label: "Edit Stock",
      icon: "cuida:edit-outline",
      className: "bg-blue-500/10 text-blue-600",
      onClick: (row, e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        setSelectedProduct(row);
        setQuickUpdateType("set");
        setQuickUpdateQuantity(row.quantity.toString());
        setShowQuickUpdateModal(true);
      },
    },
  ];

  if (userLoading && LoadingComponent) return LoadingComponent;
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  return (
    <MainLayout
      mode={mode}
      user={user}
      toggleMode={toggleMode}
      onLogout={handleLogout}
      {...props}
    >
      <div className="flex flex-1 bg-gray-50 min-h-screen">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Header */}
            <div className="mb-4 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:view-dashboard"
                        className="w-4 h-4 sm:w-6 sm:h-6 text-white"
                      />
                    </div>
                    Inventory Overview
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Monitor and manage your complete inventory with real-time
                    stock levels
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowImportModal(true);
                    }}
                    className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
                  >
                    <Icon
                      icon="mdi:file-import"
                      className="w-3 h-3 sm:w-4 sm:h-4"
                    />
                    <span className="hidden sm:inline">Import CSV</span>
                  </button>
                  {selectedProducts.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowBulkUpdateModal(true);
                      }}
                      className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
                    >
                      <Icon
                        icon="mdi:plus-box"
                        className="w-3 h-3 sm:w-4 sm:h-4"
                      />
                      <span className="hidden sm:inline">
                        Bulk Update ({selectedProducts.length})
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Enhanced Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:package-variant"
                        className="w-5 h-5 text-blue-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.total}
                      </div>
                      <div className="text-sm text-gray-500">
                        Total Products
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:check-circle"
                        className="w-5 h-5 text-green-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.inStock}
                      </div>
                      <div className="text-sm text-gray-500">In Stock</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:alert"
                        className="w-5 h-5 text-blue-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.lowStock}
                      </div>
                      <div className="text-sm text-gray-500">Low Stock</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:alert-circle"
                        className="w-5 h-5 text-red-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.critical}
                      </div>
                      <div className="text-sm text-gray-500">Critical</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:close-circle"
                        className="w-5 h-5 text-red-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.outOfStock}
                      </div>
                      <div className="text-sm text-gray-500">Out of Stock</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="fa7-solid:cedi-sign"
                        className="w-5 h-5 text-emerald-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        GHS {stats.totalValue.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">Total Value</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Filters */}
            <div className="bg-white rounded-lg p-4 shadow-sm border mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search products by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value)}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="all">All Stock Levels</option>
                  <option value="in-stock">In Stock</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="critical">Critical (≤5)</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
                <select
                  value={stockThreshold}
                  onChange={(e) => setStockThreshold(parseInt(e.target.value))}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value={5}>≤5 units</option>
                  <option value={10}>≤10 units</option>
                  <option value={15}>≤15 units</option>
                  <option value={20}>≤20 units</option>
                </select>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setViewMode("table");
                    }}
                    className={`px-3 py-2 rounded-md transition-colors ${
                      viewMode === "table"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Icon icon="mdi:table" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setViewMode("grid");
                    }}
                    className={`px-3 py-2 rounded-md transition-colors ${
                      viewMode === "grid"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Icon icon="mdi:grid" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            {loading ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading inventory...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                <Icon
                  icon="mdi:alert-circle"
                  className="w-12 h-12 text-red-500 mx-auto mb-4"
                />
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                <Icon
                  icon="mdi:package-variant-off"
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Products Found
                </h3>
                <p className="text-gray-500">
                  No products match your current filters.
                </p>
              </div>
            ) : (
              <>
                {/* Grid View */}
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  /* GenericTable View */
                  <div
                    className={`${isMobile ? "rounded-lg" : "rounded-xl"} ${
                      mode === "dark" ? "bg-gray-900" : "bg-white"
                    } overflow-hidden`}
                  >
                      <div className={`w-full ${getTableContainerClass()}`}>

                        <GenericTable
                          data={filteredProducts}
                          columns={columns}
                          actions={tableActions}
                          title="Inventory Overview"
                          emptyMessage="No products found"
                          selectable={true}
                          searchable={false}
                          onSelectionChange={setSelectedProducts}
                        />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Update Modal */}
      <SimpleModal
        isOpen={showQuickUpdateModal}
        onClose={() => setShowQuickUpdateModal(false)}
        title="Quick Stock Update"
        width="max-w-md"
      >
        <div className="space-y-6">
          {selectedProduct && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <Icon
                    icon="mdi:package-variant"
                    className="w-4 h-4 text-blue-600"
                  />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedProduct.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    SKU: {selectedProduct.sku}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Type
            </label>
            <select
              value={quickUpdateType}
              onChange={(e) => setQuickUpdateType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="add">Add to Current Stock</option>
              <option value="subtract">Subtract from Current Stock</option>
              <option value="set">Set to Specific Amount</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              value={quickUpdateQuantity}
              onChange={(e) => setQuickUpdateQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowQuickUpdateModal(false)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleQuickUpdate}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Icon icon="mdi:check" className="w-4 h-4" />
              Update Stock
            </button>
          </div>
        </div>
      </SimpleModal>

      {/* Bulk Update Modal */}
      <SimpleModal
        isOpen={showBulkUpdateModal}
        onClose={() => setShowBulkUpdateModal(false)}
        title="Bulk Update Stock"
        width="max-w-md"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="mdi:information" className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Bulk Update</span>
            </div>
            <p className="text-sm text-blue-700">
              Update stock for {selectedProducts.length} selected products
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Type
            </label>
            <select
              value={bulkUpdateType}
              onChange={(e) => setBulkUpdateType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="add">Add to Current Stock</option>
              <option value="subtract">Subtract from Current Stock</option>
              <option value="set">Set to Specific Amount</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              value={bulkUpdateQuantity}
              onChange={(e) => setBulkUpdateQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowBulkUpdateModal(false)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkUpdate}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Icon icon="mdi:check" className="w-4 h-4" />
              Update Stock
            </button>
          </div>
        </div>
      </SimpleModal>

      {/* Import CSV Modal */}
      <SimpleModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Stock Data"
        width="max-w-2xl"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="mdi:information" className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">CSV Import</span>
            </div>
            <p className="text-sm text-blue-700">
              Paste CSV data with SKU and quantity columns. Format: SKU,Quantity
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV Data
            </label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="SKU,Quantity&#10;ABC123,50&#10;DEF456,25"
              rows={10}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowImportModal(false)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Icon icon="mdi:file-import" className="w-4 h-4" />
              Import Data
            </button>
          </div>
        </div>
      </SimpleModal>
    </MainLayout>
  );
}
