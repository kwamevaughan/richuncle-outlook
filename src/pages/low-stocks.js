import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import SimpleModal from "@/components/SimpleModal";
import { GenericTable } from "@/components/GenericTable";
import toast from "react-hot-toast";

export default function LowStocksPage({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockThreshold, setStockThreshold] = useState(10);
  const [categories, setCategories] = useState([]);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [bulkUpdateQuantity, setBulkUpdateQuantity] = useState("");
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addStockQuantity, setAddStockQuantity] = useState("");
  const [addStockReason, setAddStockReason] = useState("");
  const [viewMode, setViewMode] = useState("table"); // table or grid

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const response = await fetch('/api/categories');
      const { data, error } = await response.json();
      if (!error) setCategories(data || []);
    };
    fetchCategories();
  }, []);

  // Fetch low stock products
  const fetchLowStockProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all products and filter in JavaScript since quantity is stored as string
      let query = '/api/products';

      const response = await fetch(query);
      const { data, error } = await response.json();
      
      if (error) throw error;
      
      // Filter low stock products in JavaScript
      const lowStockProducts = (data || []).filter(product => {
        const quantity = parseInt(product.quantity) || 0;
        return quantity <= stockThreshold;
      }).sort((a, b) => (parseInt(a.quantity) || 0) - (parseInt(b.quantity) || 0));
      
      setProducts(lowStockProducts);
    } catch (err) {
      setError(err.message || "Failed to load low stock products");
      toast.error("Failed to load low stock products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStockProducts();
  }, [stockThreshold]);

  // Filter products
  const filteredProducts = products.filter(product => {
    const quantity = parseInt(product.quantity) || 0;
    const matchesStockThreshold = quantity <= stockThreshold;
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter;
    return matchesStockThreshold && matchesSearch && matchesCategory;
  });

  // Get stock status with enhanced styling
  const getStockStatus = (quantity) => {
    const qty = parseInt(quantity) || 0;
    if (qty <= 0) return { 
      status: 'Out of Stock', 
      color: 'text-red-700', 
      bg: 'bg-red-100 border-red-200', 
      icon: 'mdi:close-circle',
      priority: 'urgent'
    };
    if (qty <= 5) return { 
      status: 'Critical Low', 
      color: 'text-red-600', 
      bg: 'bg-red-50 border-red-200', 
      icon: 'mdi:alert-circle',
      priority: 'high'
    };
    if (qty <= 10) return { 
      status: 'Low Stock', 
      color: 'text-orange-600', 
      bg: 'bg-orange-50 border-orange-200', 
      icon: 'mdi:alert',
      priority: 'medium'
    };
    return { 
      status: 'Moderate', 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-50 border-yellow-200', 
      icon: 'mdi:information',
      priority: 'low'
    };
  };

  // Calculate statistics
  const stats = {
    total: filteredProducts.length,
    outOfStock: filteredProducts.filter(p => parseInt(p.quantity) <= 0).length,
    critical: filteredProducts.filter(p => parseInt(p.quantity) > 0 && parseInt(p.quantity) <= 5).length,
    low: filteredProducts.filter(p => parseInt(p.quantity) > 5 && parseInt(p.quantity) <= 10).length,
    totalValue: filteredProducts.reduce((sum, p) => sum + (parseFloat(p.price) * parseInt(p.quantity)), 0)
  };

  // Bulk update stock
  const handleBulkUpdate = async (selectedIds) => {
    if (!bulkUpdateQuantity || selectedIds.length === 0) {
      toast.error("Please select products and enter quantity");
      return;
    }

    const quantity = parseInt(bulkUpdateQuantity);
    if (isNaN(quantity) || quantity < 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    try {
      const updates = selectedIds.map(productId => ({
        id: productId,
        quantity: quantity
      }));

      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates })
      });

      const { error } = await response.json();

      if (error) throw error;

      toast.success(`Updated stock for ${selectedIds.length} products`);
      setBulkUpdateQuantity("");
      setShowBulkUpdateModal(false);
      fetchLowStockProducts();
    } catch (err) {
      toast.error("Failed to update products");
    }
  };

  // Add stock to individual product
  const handleAddStock = async () => {
    if (!addStockQuantity || !selectedProduct) {
      toast.error("Please enter quantity");
      return;
    }

    const quantity = parseInt(addStockQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    try {
      const newQuantity = parseInt(selectedProduct.quantity) + quantity;
      
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: selectedProduct.id, quantity: newQuantity })
      });

      const { error } = await response.json();

      if (error) throw error;

      toast.success(`Added ${quantity} units to ${selectedProduct.name}`);
      setAddStockQuantity("");
      setAddStockReason("");
      setShowAddStockModal(false);
      setSelectedProduct(null);
      fetchLowStockProducts();
    } catch (err) {
      toast.error("Failed to update stock");
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
                <Icon icon="mdi:package-variant" className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${stockStatus.bg} ${stockStatus.color}`}>
              <div className="flex items-center gap-1">
                <Icon icon={stockStatus.icon} className="w-3 h-3" />
                {stockStatus.status}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
            <p className="text-sm text-gray-500 mb-2">SKU: {product.sku}</p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Icon icon="mdi:tag-outline" className="w-4 h-4" />
              {product.category?.name || 'N/A'}
            </div>
          </div>

          {/* Stock Info */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Stock Level</span>
              <span className={`text-sm font-semibold ${stockStatus.color}`}>
                {quantity} units
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Unit Price</span>
              <span className="text-sm font-semibold text-gray-900">GHS {price.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Value</span>
              <span className="text-sm font-semibold text-gray-900">GHS {value.toLocaleString()}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Stock Level</span>
              <span>{quantity}/{stockThreshold}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  quantity === 0 ? 'bg-red-500' :
                  quantity <= 5 ? 'bg-red-400' :
                  quantity <= 10 ? 'bg-orange-400' :
                  'bg-yellow-400'
                }`}
                style={{ width: `${Math.min((quantity / stockThreshold) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              setSelectedProduct(product);
              setShowAddStockModal(true);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Icon icon="mdi:plus" className="w-4 h-4" />
            Add Stock
          </button>
        </div>
      </div>
    );
  };

  // GenericTable columns configuration
  const columns = [
    {
      accessor: 'name',
      header: 'Product',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
            <Icon icon="mdi:package-variant" className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500">SKU: {row.sku}</div>
          </div>
        </div>
      )
    },
    {
      accessor: 'category',
      header: 'Category',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Icon icon="mdi:tag-outline" className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-900">{row.category?.name || 'N/A'}</span>
        </div>
      )
    },
    {
      accessor: 'quantity',
      header: 'Stock Status',
      sortable: true,
      render: (row) => {
        const stockStatus = getStockStatus(row.quantity);
        const quantity = parseInt(row.quantity) || 0;
        return (
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${stockStatus.bg} ${stockStatus.color}`}>
            <Icon icon={stockStatus.icon} className="w-3 h-3" />
            {quantity} units
          </div>
        );
      }
    },
    {
      accessor: 'price',
      header: 'Price',
      sortable: true,
      render: (row) => (
        <div className="text-sm font-semibold text-gray-900">
          GHS {parseFloat(row.price).toLocaleString()}
        </div>
      )
    },
    {
      accessor: 'value',
      header: 'Value',
      sortable: true,
      render: (row) => {
        const quantity = parseInt(row.quantity) || 0;
        const price = parseFloat(row.price) || 0;
        const value = price * quantity;
        return (
          <div className="text-sm font-semibold text-gray-900">
            GHS {value.toLocaleString()}
          </div>
        );
      }
    }
  ];

  // Custom actions for the table
  const tableActions = [
    {
      label: 'Add Stock',
      icon: 'mdi:plus',
      onClick: (row) => {
        setSelectedProduct(row);
        setShowAddStockModal(true);
      }
    }
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
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:alert-outline"
                        className="w-6 h-6 text-white"
                      />
                    </div>
                    Low Stock Management
                  </h1>
                  <p className="text-gray-600">
                    Monitor and manage products with low inventory levels
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchLowStockProducts()}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Icon icon="mdi:refresh" className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Enhanced Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
                        Total Low Stock
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:close-circle-outline"
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
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:alert-circle-outline"
                        className="w-5 h-5 text-red-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.critical}
                      </div>
                      <div className="text-sm text-gray-500">Critical (≤5)</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:alert-outline"
                        className="w-5 h-5 text-orange-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.low}
                      </div>
                      <div className="text-sm text-gray-500">Low (6-10)</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="fa6-solid:cedi-sign"
                        className="w-5 h-5 text-green-600"
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
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="flex gap-2">
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
                    value={stockThreshold}
                    onChange={(e) =>
                      setStockThreshold(parseInt(e.target.value))
                    }
                    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value={5}>≤5 units</option>
                    <option value={10}>≤10 units</option>
                    <option value={15}>≤15 units</option>
                    <option value={20}>≤20 units</option>
                  </select>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("table")}
                      className={`px-3 py-2 rounded-md transition-colors ${
                        viewMode === "table"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Icon icon="mdi:table" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
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
            </div>

            {/* Content Area */}
            {loading ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading low stock products...</p>
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
                  icon="mdi:check-circle"
                  className="w-16 h-16 text-green-500 mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  All Good!
                </h3>
                <p className="text-gray-500">
                  No low stock products found with current filters.
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
                  <GenericTable
                    data={filteredProducts}
                    columns={columns}
                    actions={tableActions}
                    title="Low Stock Products"
                    emptyMessage="No low stock products found"
                    selectable={true}
                    searchable={true}
                    onDelete={(row) => {
                      // Handle individual delete if needed
                      console.log("Delete:", row);
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Bulk Update Modal */}
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
              Set stock quantity for selected products
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Stock Quantity
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
              onClick={() => handleBulkUpdate(selectedProducts)}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Icon icon="mdi:check" className="w-4 h-4" />
              Update Stock
            </button>
          </div>
        </div>
      </SimpleModal>

      {/* Enhanced Add Stock Modal */}
      <SimpleModal
        isOpen={showAddStockModal}
        onClose={() => setShowAddStockModal(false)}
        title="Add Stock"
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

          {/* Stock Calculation Display */}
          {selectedProduct && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Current Stock
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {parseInt(selectedProduct.quantity) || 0} units
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Adding
                  </span>
                  <span className="text-lg font-semibold text-blue-600">
                    {addStockQuantity ? parseInt(addStockQuantity) : 0} units
                  </span>
                </div>
                <div className="border-t border-blue-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      New Total
                    </span>
                    <span className="text-xl font-bold text-green-600">
                      {(parseInt(selectedProduct.quantity) || 0) +
                        (parseInt(addStockQuantity) || 0)}{" "}
                      units
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity to Add
            </label>
            <input
              type="number"
              value={addStockQuantity}
              onChange={(e) => setAddStockQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <input
              type="text"
              value={addStockReason}
              onChange={(e) => setAddStockReason(e.target.value)}
              placeholder="e.g., Restocked from supplier"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowAddStockModal(false)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddStock}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Icon icon="mdi:plus" className="w-4 h-4" />
              Add Stock
            </button>
          </div>
        </div>
      </SimpleModal>
    </MainLayout>
  );
}
