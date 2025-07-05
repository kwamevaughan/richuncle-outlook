import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { supabaseClient } from "../lib/supabase";
import SimpleModal from "@/components/SimpleModal";
import { GenericTable } from "@/components/GenericTable";
import toast from "react-hot-toast";

export default function StockAdjustmentPage({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  
  // State for adjustments
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [adjustmentTypeFilter, setAdjustmentTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  
  // Modal states
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  
  // Form states
  const [adjustmentType, setAdjustmentType] = useState("increase");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [adjustmentNotes, setAdjustmentNotes] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    increases: 0,
    decreases: 0,
    sets: 0,
    totalValue: 0
  });

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

  // Fetch products
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabaseClient
        .from("products")
        .select(`
          *,
          category:categories!products_category_id_fkey(name)
        `)
        .order("name");
      
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  // Fetch adjustments
  const fetchAdjustments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabaseClient
        .from("stock_adjustments")
        .select(`
          *,
          product:products(
            id,
            name,
            sku,
            price,
            category:categories(name)
          )
        `)
        .order("adjustment_date", { ascending: false });

      // Apply filters
      if (categoryFilter !== "all") {
        query = query.eq("product.category_id", categoryFilter);
      }
      
      if (adjustmentTypeFilter !== "all") {
        query = query.eq("adjustment_type", adjustmentTypeFilter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setAdjustments(data || []);
      calculateStats(data || []);
    } catch (err) {
      setError(err.message || "Failed to load adjustments");
      toast.error("Failed to load adjustments");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (adjustmentData) => {
    const total = adjustmentData.length;
    const increases = adjustmentData.filter(a => a.adjustment_type === 'increase').length;
    const decreases = adjustmentData.filter(a => a.adjustment_type === 'decrease').length;
    const sets = adjustmentData.filter(a => a.adjustment_type === 'set').length;
    
    // Calculate total value impact (simplified - you might want to use cost_price instead)
    const totalValue = adjustmentData.reduce((sum, adj) => {
      const product = adj.product;
      if (product && product.price) {
        const valueImpact = Math.abs(adj.quantity_adjusted) * parseFloat(product.price);
        return sum + valueImpact;
      }
      return sum;
    }, 0);

    setStats({ total, increases, decreases, sets, totalValue });
  };

  // Initial fetch
  useEffect(() => {
    fetchProducts();
    fetchAdjustments();
  }, [categoryFilter, adjustmentTypeFilter]);

  // Filter adjustments
  const filteredAdjustments = adjustments.filter(adjustment => {
    const matchesSearch = 
      adjustment.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adjustment.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adjustment.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adjustment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Handle adjustment submission
  const handleAdjustment = async () => {
    if (!selectedProductId || !adjustmentQuantity || !adjustmentReason) {
      toast.error("Please fill in all required fields");
      return;
    }

    const quantity = parseInt(adjustmentQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    try {
      // Get current product stock
      const product = products.find(p => p.id === selectedProductId);
      if (!product) {
        toast.error("Product not found");
        return;
      }

      const currentStock = parseInt(product.quantity) || 0;
      let newStock, adjustedQuantity;

      // Calculate new stock based on adjustment type
      switch (adjustmentType) {
        case "increase":
          newStock = currentStock + quantity;
          adjustedQuantity = quantity;
          break;
        case "decrease":
          if (currentStock < quantity) {
            toast.error("Cannot decrease stock below zero");
            return;
          }
          newStock = currentStock - quantity;
          adjustedQuantity = -quantity;
          break;
        case "set":
          newStock = quantity;
          adjustedQuantity = quantity - currentStock;
          break;
        default:
          toast.error("Invalid adjustment type");
          return;
      }

      // Create adjustment record
      const adjustmentData = {
        product_id: selectedProductId,
        adjustment_type: adjustmentType,
        quantity_before: currentStock,
        quantity_adjusted: adjustedQuantity,
        quantity_after: newStock,
        reason: adjustmentReason,
        reference_number: referenceNumber || null,
        adjusted_by: user.id,
        notes: adjustmentNotes || null
      };

      // Insert adjustment record
      const { error: adjustmentError } = await supabaseClient
        .from("stock_adjustments")
        .insert([adjustmentData]);

      if (adjustmentError) throw adjustmentError;

      // Update product stock
      const { error: productError } = await supabaseClient
        .from("products")
        .update({ quantity: newStock })
        .eq("id", selectedProductId);

      if (productError) throw productError;

      toast.success(`Stock adjusted successfully for ${product.name}`);
      
      // Reset form
      setSelectedProductId("");
      setAdjustmentType("increase");
      setAdjustmentQuantity("");
      setAdjustmentReason("");
      setReferenceNumber("");
      setAdjustmentNotes("");
      setShowAdjustmentModal(false);
      
      // Refresh data
      fetchProducts();
      fetchAdjustments();
    } catch (err) {
      toast.error(err.message || "Failed to adjust stock");
    }
  };

  // Get adjustment type styling
  const getAdjustmentTypeStyle = (type) => {
    switch (type) {
      case "increase":
        return { bg: "bg-green-100", color: "text-green-800", icon: "mdi:plus-circle" };
      case "decrease":
        return { bg: "bg-red-100", color: "text-red-800", icon: "mdi:minus-circle" };
      case "set":
        return { bg: "bg-blue-100", color: "text-blue-800", icon: "mdi:equal-circle" };
      default:
        return { bg: "bg-gray-100", color: "text-gray-800", icon: "mdi:help-circle" };
    }
  };

  // GenericTable columns configuration
  const columns = [
    {
      accessor: 'product',
      header: 'Product',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
            <Icon icon="mdi:package-variant" className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{row.product?.name || 'N/A'}</div>
            <div className="text-sm text-gray-500">SKU: {row.product?.sku || 'N/A'}</div>
          </div>
        </div>
      )
    },
    {
      accessor: 'adjustment_type',
      header: 'Type',
      sortable: true,
      render: (row) => {
        const style = getAdjustmentTypeStyle(row.adjustment_type);
        return (
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.color}`}>
            <Icon icon={style.icon} className="w-3 h-3" />
            {row.adjustment_type.charAt(0).toUpperCase() + row.adjustment_type.slice(1)}
          </div>
        );
      }
    },
    {
      accessor: 'quantity_adjusted',
      header: 'Quantity',
      sortable: true,
      render: (row) => (
        <div className="text-sm font-semibold text-gray-900">
          {row.quantity_adjusted > 0 ? '+' : ''}{row.quantity_adjusted} units
        </div>
      )
    },
    {
      accessor: 'quantity_after',
      header: 'New Stock',
      sortable: true,
      render: (row) => (
        <div className="text-sm font-semibold text-gray-900">
          {row.quantity_after} units
        </div>
      )
    },
    {
      accessor: 'reason',
      header: 'Reason',
      sortable: true,
      render: (row) => (
        <div className="text-sm text-gray-900 max-w-xs truncate" title={row.reason}>
          {row.reason}
        </div>
      )
    },

    {
      accessor: 'adjustment_date',
      header: 'Date',
      sortable: true,
      render: (row) => (
        <div className="text-sm text-gray-900">
          {new Date(row.adjustment_date).toLocaleDateString()}
        </div>
      )
    }
  ];

  // Custom actions for the table
  const tableActions = [
    {
      label: 'View Details',
      icon: 'mdi:eye',
      onClick: (row) => {
        setSelectedAdjustment(row);
        setShowHistoryModal(true);
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
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:adjust"
                        className="w-6 h-6 text-white"
                      />
                    </div>
                    Stock Adjustments
                  </h1>
                  <p className="text-gray-600">
                    Manage and track manual stock adjustments with full audit trail
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchAdjustments()}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Icon icon="mdi:refresh" className="w-4 h-4" />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowAdjustmentModal(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Icon icon="mdi:plus" className="w-4 h-4" />
                    New Adjustment
                  </button>
                </div>
              </div>

              {/* Enhanced Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:adjust"
                        className="w-5 h-5 text-purple-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.total}
                      </div>
                      <div className="text-sm text-gray-500">
                        Total Adjustments
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:plus-circle"
                        className="w-5 h-5 text-green-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.increases}
                      </div>
                      <div className="text-sm text-gray-500">Increases</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:minus-circle"
                        className="w-5 h-5 text-red-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.decreases}
                      </div>
                      <div className="text-sm text-gray-500">Decreases</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:equal-circle"
                        className="w-5 h-5 text-blue-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.sets}
                      </div>
                      <div className="text-sm text-gray-500">Set Values</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="fa6-solid:cedi-sign"
                        className="w-5 h-5 text-indigo-600"
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
                  placeholder="Search products, reasons, or reference numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <select
                  value={adjustmentTypeFilter}
                  onChange={(e) => setAdjustmentTypeFilter(e.target.value)}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="all">All Types</option>
                  <option value="increase">Increases</option>
                  <option value="decrease">Decreases</option>
                  <option value="set">Set Values</option>
                </select>
              </div>
            </div>

            {/* Content Area */}
            {loading ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading adjustments...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                <Icon
                  icon="mdi:alert-circle"
                  className="w-12 h-12 text-red-500 mx-auto mb-4"
                />
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            ) : filteredAdjustments.length === 0 ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                <Icon
                  icon="mdi:clipboard-text"
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Adjustments Found
                </h3>
                <p className="text-gray-500">
                  No stock adjustments match your current filters.
                </p>
              </div>
            ) : (
              <GenericTable
                data={filteredAdjustments}
                columns={columns}
                actions={tableActions}
                title="Stock Adjustments"
                emptyMessage="No adjustments found"
                selectable={false}
                searchable={false}
              />
            )}
          </div>
        </div>
      </div>

      {/* New Adjustment Modal */}
      <SimpleModal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        title="New Stock Adjustment"
        width="max-w-lg"
      >
        <div className="space-y-6">
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="mdi:information" className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">Stock Adjustment</span>
            </div>
            <p className="text-sm text-purple-700">
              Make manual adjustments to product stock levels. All changes are logged for audit purposes.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (SKU: {product.sku}) - Current: {product.quantity} units
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjustment Type *
            </label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            >
              <option value="increase">Increase Stock</option>
              <option value="decrease">Decrease Stock</option>
              <option value="set">Set Stock Level</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <input
              type="number"
              value={adjustmentQuantity}
              onChange={(e) => setAdjustmentQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason *
            </label>
            <select
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            >
              <option value="">Select a reason</option>
              <option value="Inventory count correction">Inventory count correction</option>
              <option value="Damaged goods">Damaged goods</option>
              <option value="Expired products">Expired products</option>
              <option value="Theft/Loss">Theft/Loss</option>
              <option value="Quality control">Quality control</option>
              <option value="Restocking">Restocking</option>
              <option value="Transfer between locations">Transfer between locations</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Number (Optional)
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g., PO-12345, Invoice-67890"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={adjustmentNotes}
              onChange={(e) => setAdjustmentNotes(e.target.value)}
              placeholder="Any additional details about this adjustment..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowAdjustmentModal(false)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdjustment}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <Icon icon="mdi:check" className="w-4 h-4" />
              Make Adjustment
            </button>
          </div>
        </div>
      </SimpleModal>

      {/* Adjustment History Modal */}
      <SimpleModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Adjustment Details"
        width="max-w-2xl"
      >
        {selectedAdjustment && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <Icon
                    icon="mdi:package-variant"
                    className="w-5 h-5 text-blue-600"
                  />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {selectedAdjustment.product?.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    SKU: {selectedAdjustment.product?.sku}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adjustment Type
                  </label>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const style = getAdjustmentTypeStyle(selectedAdjustment.adjustment_type);
                      return (
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.color}`}>
                          <Icon icon={style.icon} className="w-3 h-3" />
                          {selectedAdjustment.adjustment_type.charAt(0).toUpperCase() + selectedAdjustment.adjustment_type.slice(1)}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity Adjusted
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {selectedAdjustment.quantity_adjusted > 0 ? '+' : ''}{selectedAdjustment.quantity_adjusted} units
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Before
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {selectedAdjustment.quantity_before} units
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock After
                  </label>
                  <div className="text-lg font-semibold text-green-600">
                    {selectedAdjustment.quantity_after} units
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedAdjustment.reason}
                  </div>
                </div>

                {selectedAdjustment.reference_number && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reference Number
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedAdjustment.reference_number}
                    </div>
                  </div>
                )}



                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date & Time
                  </label>
                  <div className="text-sm text-gray-900">
                    {new Date(selectedAdjustment.adjustment_date).toLocaleString()}
                  </div>
                </div>

                {selectedAdjustment.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {selectedAdjustment.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </SimpleModal>
    </MainLayout>
  );
} 