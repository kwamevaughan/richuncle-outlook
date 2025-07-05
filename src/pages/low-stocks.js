import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { supabaseClient } from "../lib/supabase";
import SimpleModal from "@/components/SimpleModal";
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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabaseClient
        .from("categories")
        .select("*")
        .order("name");
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
      let query = supabaseClient
        .from("products")
        .select(`
          *,
          category:categories!products_category_id_fkey(name)
        `);

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filter low stock products in JavaScript
      const lowStockProducts = (data || []).filter(product => {
        const quantity = parseInt(product.quantity) || 0;
        return quantity <= stockThreshold;
      }).sort((a, b) => (parseInt(a.quantity) || 0) - (parseInt(b.quantity) || 0));
      
      setProducts(lowStockProducts);
      
      if (error) throw error;
      
      setProducts(data || []);
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

  // Handle bulk selection
  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  // Handle individual selection
  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Bulk update stock
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
      const updates = selectedProducts.map(productId => ({
        id: productId,
        quantity: quantity
      }));

      const { error } = await supabaseClient
        .from("products")
        .upsert(updates);

      if (error) throw error;

      toast.success(`Updated stock for ${selectedProducts.length} products`);
      setSelectedProducts([]);
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
      const newQuantity = selectedProduct.quantity + quantity;
      
      const { error } = await supabaseClient
        .from("products")
        .update({ quantity: newQuantity })
        .eq("id", selectedProduct.id);

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

  // Get stock status
  const getStockStatus = (quantity) => {
    if (quantity <= 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-100', icon: 'mdi:close-circle-outline' };
    if (quantity <= 5) return { status: 'critical', color: 'text-red-600', bg: 'bg-red-50', icon: 'mdi:alert-circle-outline' };
    if (quantity <= 10) return { status: 'low', color: 'text-orange-600', bg: 'bg-orange-50', icon: 'mdi:alert-outline' };
    return { status: 'moderate', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: 'mdi:information-outline' };
  };

  // Calculate statistics
  const stats = {
    total: filteredProducts.length,
    outOfStock: filteredProducts.filter(p => parseInt(p.quantity) <= 0).length,
    critical: filteredProducts.filter(p => parseInt(p.quantity) > 0 && parseInt(p.quantity) <= 5).length,
    low: filteredProducts.filter(p => parseInt(p.quantity) > 5 && parseInt(p.quantity) <= 10).length,
    totalValue: filteredProducts.reduce((sum, p) => sum + (parseFloat(p.price) * parseInt(p.quantity)), 0)
  };

  if (userLoading && LoadingComponent) return LoadingComponent;
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  return (
    <MainLayout mode={mode} user={user} toggleMode={toggleMode} onLogout={handleLogout} {...props}>
      <div className="flex flex-1">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Icon icon="mdi:alert-outline" className="w-7 h-7 text-orange-600" />
                  Low Stock Management
                </h1>
                <p className="text-sm text-gray-500">
                  Monitor and manage products with low inventory levels
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchLowStockProducts()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Icon icon="mdi:refresh" className="w-4 h-4" />
                  Refresh
                </button>
                {selectedProducts.length > 0 && (
                  <button
                    onClick={() => setShowBulkUpdateModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Icon icon="mdi:plus-box" className="w-4 h-4" />
                    Bulk Update ({selectedProducts.length})
                  </button>
                )}
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon icon="mdi:package-variant" className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-sm text-gray-500">Total Low Stock</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Icon icon="mdi:close-circle-outline" className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats.outOfStock}</div>
                    <div className="text-sm text-gray-500">Out of Stock</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <Icon icon="mdi:alert-circle-outline" className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats.critical}</div>
                    <div className="text-sm text-gray-500">Critical (≤5)</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Icon icon="mdi:alert-outline" className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats.low}</div>
                    <div className="text-sm text-gray-500">Low (6-10)</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Icon icon="mdi:currency-usd" className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">GHS {stats.totalValue.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Total Value</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
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
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
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
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading low stock products...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-600">{error}</div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-8 text-center">
                  <Icon icon="mdi:check-circle-outline" className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-500">No low stock products found!</p>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedProducts.length === filteredProducts.length}
                            onChange={handleSelectAll}
                            className="rounded"
                          />
                          <span className="text-sm font-medium">Select All</span>
                        </label>
                        <span className="text-sm text-gray-500">
                          {selectedProducts.length} of {filteredProducts.length} selected
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock Level
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Value
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredProducts.map((product) => {
                          const stockStatus = getStockStatus(product.quantity);
                          return (
                            <tr key={product.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedProducts.includes(product.id)}
                                    onChange={() => handleSelectProduct(product.id)}
                                    className="rounded mr-3"
                                  />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                    <div className="text-sm text-gray-500">{product.sku}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{product.category?.name || 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <Icon icon={stockStatus.icon} className={`w-4 h-4 ${stockStatus.color}`} />
                                  <span className={`text-sm font-medium ${stockStatus.color}`}>
                                    {product.quantity} units
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">GHS {product.price}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">GHS {(product.price * product.quantity).toLocaleString()}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setShowAddStockModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                >
                                  Add Stock
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Update Modal */}
      <SimpleModal
        isOpen={showBulkUpdateModal}
        onClose={() => setShowBulkUpdateModal(false)}
        title="Bulk Update Stock"
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Set stock quantity for {selectedProducts.length} selected products:
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Stock Quantity
            </label>
            <input
              type="number"
              value={bulkUpdateQuantity}
              onChange={(e) => setBulkUpdateQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowBulkUpdateModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkUpdate}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Update Stock
            </button>
          </div>
        </div>
      </SimpleModal>

      {/* Add Stock Modal */}
      <SimpleModal
        isOpen={showAddStockModal}
        onClose={() => setShowAddStockModal(false)}
        title="Add Stock"
        width="max-w-md"
      >
        <div className="space-y-4">
          {selectedProduct && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-900">{selectedProduct.name}</div>
              <div className="text-sm text-gray-500">Current stock: {selectedProduct.quantity} units</div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity to Add
            </label>
            <input
              type="number"
              value={addStockQuantity}
              onChange={(e) => setAddStockQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (Optional)
            </label>
            <input
              type="text"
              value={addStockReason}
              onChange={(e) => setAddStockReason(e.target.value)}
              placeholder="e.g., Restocked from supplier"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowAddStockModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddStock}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Stock
            </button>
          </div>
        </div>
      </SimpleModal>
    </MainLayout>
  );
}
