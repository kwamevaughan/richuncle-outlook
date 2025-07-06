import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import SimpleModal from "@/components/SimpleModal";
import { GenericTable } from "@/components/GenericTable";
import TransferDetailsModal from "@/components/TransferDetailsModal";
import toast from "react-hot-toast";

export default function StockTransferPage({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  
  // State for transfers
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  
  // Form states for creating transfer
  const [sourceType, setSourceType] = useState("warehouse");
  const [sourceId, setSourceId] = useState("");
  const [destinationType, setDestinationType] = useState("store");
  const [destinationId, setDestinationId] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [shippingMethod, setShippingMethod] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  
  // Form states for transfer items
  const [transferItems, setTransferItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState("");
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inTransit: 0,
    completed: 0,
    cancelled: 0,
    totalValue: 0
  });

  // Fetch warehouses and stores
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const [warehousesRes, storesRes] = await Promise.all([
          fetch('/api/warehouses'),
          fetch('/api/stores')
        ]);
        
        const warehousesData = await warehousesRes.json();
        const storesData = await storesRes.json();
        
        if (warehousesData.success && storesData.success) {
          setWarehouses(warehousesData.data || []);
          setStores(storesData.data || []);
        }
      } catch (err) {
        console.error("Error fetching locations:", err);
      }
    };
    
    fetchLocations();
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const result = await response.json();
      if (result.success) {
        setProducts(result.data || []);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  // Fetch transfers
  const fetchTransfers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/stock-transfers');
      const result = await response.json();
      
      if (result.success) {
        let transfers = result.data || [];
        
        // Apply filters
        if (statusFilter !== "all") {
          transfers = transfers.filter(transfer => transfer.status === statusFilter);
        }
        
        setTransfers(transfers);
        calculateStats(transfers);
      } else {
        throw new Error("Failed to load transfers");
      }
    } catch (err) {
      setError(err.message || "Failed to load transfers");
      toast.error("Failed to load transfers");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (transferData) => {
    const total = transferData.length;
    const pending = transferData.filter(t => t.status === 'pending').length;
    const inTransit = transferData.filter(t => t.status === 'in_transit').length;
    const completed = transferData.filter(t => t.status === 'completed').length;
    const cancelled = transferData.filter(t => t.status === 'cancelled').length;
    
    // Calculate total value (simplified - you might want to join with items)
    const totalValue = transferData.reduce((sum, transfer) => {
      // This is a placeholder - in a real implementation, you'd sum the items
      return sum + 0; // Placeholder value
    }, 0);

    setStats({ total, pending, inTransit, completed, cancelled, totalValue });
  };

  // Initial fetch
  useEffect(() => {
    fetchProducts();
    fetchTransfers();
  }, [statusFilter]);

  // Filter transfers
  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = 
      transfer.transfer_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Get location name
  const getLocationName = (transfer, type) => {
    if (type === 'source') {
      if (transfer.source_type === 'warehouse') {
        const warehouse = warehouses.find(w => w.id === transfer.source_id);
        return warehouse?.name || 'Unknown Warehouse';
      } else {
        const store = stores.find(s => s.id === transfer.source_id);
        return store?.name || 'Unknown Store';
      }
    } else {
      if (transfer.destination_type === 'warehouse') {
        const warehouse = warehouses.find(w => w.id === transfer.destination_id);
        return warehouse?.name || 'Unknown Warehouse';
      } else {
        const store = stores.find(s => s.id === transfer.destination_id);
        return store?.name || 'Unknown Store';
      }
    }
  };

  // Get status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return { bg: "bg-yellow-100", color: "text-yellow-800", icon: "mdi:clock-outline" };
      case "in_transit":
        return { bg: "bg-blue-100", color: "text-blue-800", icon: "mdi:truck-delivery" };
      case "completed":
        return { bg: "bg-green-100", color: "text-green-800", icon: "mdi:check-circle" };
      case "cancelled":
        return { bg: "bg-red-100", color: "text-red-800", icon: "mdi:close-circle" };
      default:
        return { bg: "bg-gray-100", color: "text-gray-800", icon: "mdi:help-circle" };
    }
  };

  // Add item to transfer
  const addTransferItem = () => {
    if (!selectedProductId || !selectedQuantity) {
      toast.error("Please select a product and quantity");
      return;
    }

    const quantity = parseInt(selectedQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
      toast.error("Product not found");
      return;
    }

    // Check if product already exists in transfer items
    const existingItem = transferItems.find(item => item.product_id === selectedProductId);
    if (existingItem) {
      toast.error("Product already added to transfer");
      return;
    }

    const newItem = {
      product_id: selectedProductId,
      product_name: product.name,
      product_sku: product.sku,
      unit_price: parseFloat(product.price) || 0,
      quantity_requested: quantity,
      quantity_transferred: 0,
      quantity_received: 0,
      status: 'pending',
      notes: ''
    };

    setTransferItems([...transferItems, newItem]);
    setSelectedProductId("");
    setSelectedQuantity("");
  };

  // Remove item from transfer
  const removeTransferItem = (productId) => {
    setTransferItems(transferItems.filter(item => item.product_id !== productId));
  };

  // Create transfer
  const handleCreateTransfer = async () => {
    if (!sourceId || !destinationId || transferItems.length === 0) {
      toast.error("Please fill in all required fields and add at least one item");
      return;
    }

    if (sourceType === destinationType && sourceId === destinationId) {
      toast.error("Source and destination cannot be the same");
      return;
    }

    try {
      // Create transfer record
      const transferData = {
        source_type: sourceType,
        source_id: sourceId,
        destination_type: destinationType,
        destination_id: destinationId,
        expected_delivery_date: expectedDeliveryDate || null,
        shipping_method: shippingMethod || null,
        tracking_number: trackingNumber || null,
        notes: transferNotes || null,
        created_by: user.id,
        status: 'pending'
      };

      const response = await fetch('/api/stock_transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transferData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Transfer ${result.data.transfer_number} created successfully`);
        
        // Reset form
        setSourceType("warehouse");
        setSourceId("");
        setDestinationType("store");
        setDestinationId("");
        setExpectedDeliveryDate("");
        setShippingMethod("");
        setTrackingNumber("");
        setTransferNotes("");
        setTransferItems([]);
        setShowCreateModal(false);
        
        // Refresh data
        fetchTransfers();
      }
    } catch (err) {
      toast.error(err.message || "Failed to create transfer");
    }
  };

  // Update transfer status
  const handleUpdateStatus = async (transferId, newStatus) => {
    try {
      const response = await fetch(`/api/stock_transfers/${transferId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      const { data, error } = await response.json();

      if (error) throw error;

      toast.success(`Transfer status updated to ${newStatus}`);
      fetchTransfers();
    } catch (err) {
      toast.error("Failed to update transfer status");
    }
  };

  // GenericTable columns configuration
  const columns = [
    {
      accessor: 'transfer_number',
      header: 'Transfer #',
      sortable: true,
      render: (row) => (
        <div className="text-sm font-semibold text-gray-900">
          {row.transfer_number}
        </div>
      )
    },
    {
      accessor: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => {
        const style = getStatusStyle(row.status);
        return (
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.color}`}>
            <Icon icon={style.icon} className="w-3 h-3" />
            {row.status.replace('_', ' ').charAt(0).toUpperCase() + row.status.slice(1).replace('_', ' ')}
          </div>
        );
      }
    },
    {
      accessor: 'source',
      header: 'From',
      sortable: true,
      render: (row) => (
        <div className="text-sm text-gray-900">
          {getLocationName(row, 'source')}
        </div>
      )
    },
    {
      accessor: 'destination',
      header: 'To',
      sortable: true,
      render: (row) => (
        <div className="text-sm text-gray-900">
          {getLocationName(row, 'destination')}
        </div>
      )
    },
    {
      accessor: 'transfer_date',
      header: 'Date',
      sortable: true,
      render: (row) => (
        <div className="text-sm text-gray-900">
          {new Date(row.transfer_date).toLocaleDateString()}
        </div>
      )
    },
    {
      accessor: 'expected_delivery_date',
      header: 'Expected Delivery',
      sortable: true,
      render: (row) => (
        <div className="text-sm text-gray-900">
          {row.expected_delivery_date ? new Date(row.expected_delivery_date).toLocaleDateString() : 'Not set'}
        </div>
      )
    },
    {
      accessor: 'shipping_method',
      header: 'Shipping',
      sortable: true,
      render: (row) => (
        <div className="text-sm text-gray-900">
          {row.shipping_method || 'Not specified'}
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
        setSelectedTransfer(row);
        setShowDetailsModal(true);
      }
    },
    {
      label: 'Update Status',
      icon: 'mdi:pencil',
      onClick: (row) => {
        setSelectedTransfer(row);
        setShowUpdateModal(true);
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
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:truck-delivery-outline"
                        className="w-6 h-6 text-white"
                      />
                    </div>
                    Stock Transfers
                  </h1>
                  <p className="text-gray-600">
                    Manage stock transfers between warehouses and stores
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchTransfers()}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Icon icon="mdi:refresh" className="w-4 h-4" />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <Icon icon="mdi:plus" className="w-4 h-4" />
                    New Transfer
                  </button>
                </div>
              </div>

              {/* Enhanced Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:truck-delivery"
                        className="w-5 h-5 text-indigo-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.total}
                      </div>
                      <div className="text-sm text-gray-500">
                        Total Transfers
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:clock-outline"
                        className="w-5 h-5 text-yellow-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.pending}
                      </div>
                      <div className="text-sm text-gray-500">Pending</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:truck-delivery"
                        className="w-5 h-5 text-blue-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.inTransit}
                      </div>
                      <div className="text-sm text-gray-500">In Transit</div>
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
                        {stats.completed}
                      </div>
                      <div className="text-sm text-gray-500">Completed</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:close-circle"
                        className="w-5 h-5 text-red-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.cancelled}
                      </div>
                      <div className="text-sm text-gray-500">Cancelled</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="fa6-solid:cedi-sign"
                        className="w-5 h-5 text-purple-600"
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
                  placeholder="Search transfers by number, notes, or tracking..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_transit">In Transit</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Content Area */}
            {loading ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading transfers...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                <Icon
                  icon="mdi:alert-circle"
                  className="w-12 h-12 text-red-500 mx-auto mb-4"
                />
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            ) : filteredTransfers.length === 0 ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                <Icon
                  icon="mdi:truck-delivery-off"
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Transfers Found
                </h3>
                <p className="text-gray-500">
                  No stock transfers match your current filters.
                </p>
              </div>
            ) : (
              <GenericTable
                data={filteredTransfers}
                columns={columns}
                actions={tableActions}
                title="Stock Transfers"
                emptyMessage="No transfers found"
                selectable={false}
                searchable={false}
              />
            )}
          </div>
        </div>
      </div>

      {/* Create Transfer Modal */}
      <SimpleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Stock Transfer"
        width="max-w-4xl"
      >
        <div className="space-y-6">
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="mdi:information" className="w-5 h-5 text-indigo-600" />
              <span className="font-medium text-indigo-900">New Transfer</span>
            </div>
            <p className="text-sm text-indigo-700">
              Create a new stock transfer between warehouses and stores.
            </p>
          </div>

          {/* Transfer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Type *
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="warehouse">Warehouse</option>
                <option value="store">Store</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Location *
              </label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">Select source location</option>
                {sourceType === "warehouse" 
                  ? warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))
                  : stores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))
                }
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination Type *
              </label>
              <select
                value={destinationType}
                onChange={(e) => setDestinationType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="warehouse">Warehouse</option>
                <option value="store">Store</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination Location *
              </label>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">Select destination location</option>
                {destinationType === "warehouse" 
                  ? warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))
                  : stores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))
                }
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Method
              </label>
              <select
                value={shippingMethod}
                onChange={(e) => setShippingMethod(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">Select shipping method</option>
                <option value="Internal Transfer">Internal Transfer</option>
                <option value="Courier">Courier</option>
                <option value="Hand Delivery">Hand Delivery</option>
                <option value="Truck">Truck</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tracking Number
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              placeholder="Additional notes about this transfer..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Transfer Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer Items</h3>
            
            {/* Add Item Form */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Select a product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} (SKU: {product.sku}) - Stock: {product.quantity}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={addTransferItem}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon icon="mdi:plus" className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
              </div>
            </div>

            {/* Items List */}
            {transferItems.length > 0 ? (
              <div className="space-y-2">
                {transferItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.product_name}</div>
                      <div className="text-sm text-gray-500">SKU: {item.product_sku}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-900">
                        Qty: {item.quantity_requested}
                      </div>
                      <div className="text-sm text-gray-900">
                        Price: GHS {item.unit_price.toLocaleString()}
                      </div>
                      <button
                        onClick={() => removeTransferItem(item.product_id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Icon icon="mdi:delete" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Icon icon="mdi:package-variant-off" className="w-12 h-12 mx-auto mb-2" />
                <p>No items added to transfer</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTransfer}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <Icon icon="mdi:check" className="w-4 h-4" />
              Create Transfer
            </button>
          </div>
        </div>
      </SimpleModal>

      {/* Transfer Details Modal */}
      <TransferDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        transfer={selectedTransfer}
        warehouses={warehouses}
        stores={stores}
        mode={mode}
      />

      {/* Update Status Modal */}
      <SimpleModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title="Update Transfer Status"
        width="max-w-md"
      >
        {selectedTransfer && (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="mdi:information" className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Update Status</span>
              </div>
              <p className="text-sm text-blue-700">
                Update the status of transfer {selectedTransfer.transfer_number}
              </p>
            </div>

            <div className="space-y-4">
              {['pending', 'in_transit', 'completed', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => {
                    handleUpdateStatus(selectedTransfer.id, status);
                    setShowUpdateModal(false);
                  }}
                  disabled={selectedTransfer.status === status}
                  className={`w-full p-3 rounded-lg border transition-colors ${
                    selectedTransfer.status === status
                      ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {(() => {
                      const style = getStatusStyle(status);
                      return (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${style.bg}`}>
                          <Icon icon={style.icon} className={`w-4 h-4 ${style.color}`} />
                        </div>
                      );
                    })()}
                    <div className="text-left">
                      <div className="font-medium">
                        {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                      </div>
                      {selectedTransfer.status === status && (
                        <div className="text-sm text-gray-500">Current status</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </SimpleModal>
    </MainLayout>
  );
} 