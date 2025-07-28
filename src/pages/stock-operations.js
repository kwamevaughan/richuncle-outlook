import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import SimpleModal from "@/components/SimpleModal";
import { GenericTable } from "@/components/GenericTable";
import toast from "react-hot-toast";
import Select from 'react-select';

export default function StockOperationsPage({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  
  // State
  const [activeTab, setActiveTab] = useState("adjustments");
  const [adjustments, setAdjustments] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [adjustmentToReverse, setAdjustmentToReverse] = useState(null);

  // Handle opening adjustment modal
  const handleOpenAdjustmentModal = () => {
    setAdjustmentData({
      product_id: "",
      adjustment_type: "increase",
      quantity_adjusted: "",
      reason: "",
      reference_number: generateReferenceNumber(),
      notes: "",
      adjustment_date: new Date().toISOString().split('T')[0],
      location_id: "",
      cost_price: "",
      unit_price: ""
    });
    setSelectedProduct(null);
    setShowAdjustmentModal(true);
  };
  
  // Form states
  const [adjustmentData, setAdjustmentData] = useState({
    product_id: "",
    adjustment_type: "increase",
    quantity_adjusted: "",
    reason: "",
    reference_number: "",
    notes: "",
    adjustment_date: new Date().toISOString().split('T')[0],
    location_id: "",
    cost_price: "",
    unit_price: ""
  });
  
  const [transferData, setTransferData] = useState({
    fromLocation: "",
    toLocation: "",
    fromLocationType: "",
    toLocationType: "",
    items: [],
    notes: "",
    transfer_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: "",
    priority: "normal",
    transfer_method: "internal"
  });

  // State for adding items to transfer
  const [newItem, setNewItem] = useState({
    product_id: "",
    quantity: "",
    notes: ""
  });

  // Generate reference number
  const generateReferenceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ADJ-${timestamp}-${random}`;
  };

  // State for selected product in adjustment modal
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Prepare product options for react-select
  const productOptions = products.map(product => ({
    value: product.id,
    label: `${product.name} (SKU: ${product.sku}) - GHS ${parseFloat(product.price || 0).toFixed(2)} - Stock: ${product.quantity || 0}`,
    product: product
  }));

  // Prepare location options for react-select
  const locationOptions = locations.map(location => ({
    value: location.id,
    label: `${location.name} (${location.type})`,
    location: location
  }));

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all required data
      const [productsRes, storesRes, warehousesRes, adjustmentsRes, transfersRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/stores'),
        fetch('/api/warehouses'),
        fetch('/api/stock-adjustments'),
        fetch('/api/stock-transfers')
      ]);

      const productsData = await productsRes.json();
      const storesData = await storesRes.json();
      const warehousesData = await warehousesRes.json();
      const adjustmentsData = await adjustmentsRes.json();
      const transfersData = await transfersRes.json();

      // Combine stores and warehouses into locations
      const allLocations = [
        ...(storesData.data || []).map(store => ({ ...store, type: 'store' })),
        ...(warehousesData.data || []).map(warehouse => ({ ...warehouse, type: 'warehouse' }))
      ];

      setProducts(productsData.data || []);
      setLocations(allLocations);
      setAdjustments(adjustmentsData.data || []);
      setTransfers(transfersData.data || []);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Handle adjustment submission
  const handleAdjustment = async () => {
    if (!adjustmentData.product_id || !adjustmentData.quantity_adjusted || !adjustmentData.reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Calculate quantity after adjustment
    const currentStock = selectedProduct ? parseInt(selectedProduct.quantity || 0) : 0;
    const adjustmentQuantity = parseInt(adjustmentData.quantity_adjusted);
    let quantityAfter = currentStock;

    switch (adjustmentData.adjustment_type) {
      case 'increase':
        quantityAfter = currentStock + adjustmentQuantity;
        break;
      case 'decrease':
        quantityAfter = Math.max(0, currentStock - adjustmentQuantity);
        break;
      case 'set':
        quantityAfter = adjustmentQuantity;
        break;
      default:
        quantityAfter = currentStock;
    }

    try {
      const adjustmentPayload = {
        ...adjustmentData,
        quantity_after: quantityAfter,
        quantity_before: currentStock
      };

      const response = await fetch('/api/stock-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustmentPayload)
      });

      if (response.ok) {
        toast.success("Stock adjustment created successfully");
        setShowAdjustmentModal(false);
        setAdjustmentData({ 
          product_id: "", 
          adjustment_type: "increase", 
          quantity_adjusted: "", 
          reason: "", 
          reference_number: "", 
          notes: "",
          adjustment_date: new Date().toISOString().split('T')[0],
          location_id: "",
          cost_price: "",
          unit_price: ""
        });
        setSelectedProduct(null);
        fetchData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create adjustment");
      }
    } catch (err) {
      toast.error(`Create stock adjustment error: ${err.message}`);
    }
  };

  // Handle transfer submission
  const handleTransfer = async () => {
    if (!transferData.fromLocation || !transferData.toLocation) {
      toast.error("Please select source and destination locations");
      return;
    }

    if (transferData.items.length === 0) {
      toast.error("Please add at least one item to transfer");
      return;
    }

    try {
      // Prepare transfer data for API
      const transferPayload = {
        source_type: transferData.fromLocationType,
        source_id: transferData.fromLocation,
        destination_type: transferData.toLocationType,
        destination_id: transferData.toLocation,
        transfer_date: transferData.transfer_date,
        expected_delivery_date: transferData.expected_delivery_date,
        priority: transferData.priority,
        transfer_method: transferData.transfer_method,
        notes: transferData.notes,
        items: transferData.items,
        status: 'pending'
      };

      const response = await fetch('/api/stock-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferPayload)
      });

      if (response.ok) {
        toast.success("Stock transfer created successfully");
        setShowTransferModal(false);
        setTransferData({ 
          fromLocation: "", 
          toLocation: "", 
          fromLocationType: "", 
          toLocationType: "", 
          items: [], 
          notes: "",
          transfer_date: new Date().toISOString().split('T')[0],
          expected_delivery_date: "",
          priority: "normal",
          transfer_method: "internal"
        });
        setNewItem({ product_id: "", quantity: "", notes: "" });
        fetchData();
      } else {
        throw new Error("Failed to create transfer");
      }
    } catch (err) {
      toast.error("Failed to create transfer");
    }
  };

  // Add item to transfer
  const addItemToTransfer = () => {
    if (!newItem.product_id || !newItem.quantity) {
      toast.error("Please select a product and enter quantity");
      return;
    }

    const product = products.find(p => p.id === newItem.product_id);
    if (!product) {
      toast.error("Product not found");
      return;
    }

    const quantity = parseInt(newItem.quantity);
    const availableStock = parseInt(product.quantity || 0);

    if (quantity > availableStock) {
      toast.error(`Cannot transfer ${quantity} units. Only ${availableStock} units available in stock.`);
      return;
    }

    const itemToAdd = {
      product_id: newItem.product_id,
      product_name: product.name,
      product_sku: product.sku,
      product_price: parseFloat(product.price || 0),
      product_stock: availableStock,
      quantity: quantity,
      notes: newItem.notes
    };

    setTransferData(prev => ({
      ...prev,
      items: [...prev.items, itemToAdd]
    }));

    setNewItem({ product_id: "", quantity: "", notes: "" });
    toast.success("Item added to transfer");
  };

  // Remove item from transfer
  const removeItemFromTransfer = (index) => {
    setTransferData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Handler to reverse a stock adjustment
  const handleReverseAdjustment = async (adjustment) => {
    if (!adjustment) return;
    const oppositeType =
      adjustment.adjustment_type === 'increase' ? 'decrease' :
      adjustment.adjustment_type === 'decrease' ? 'increase' : 'set';
    const reference_number = generateReferenceNumber();
    const notes = `Reverse of adjustment ${adjustment.reference_number}`;
    const adjustment_date = new Date().toISOString().split('T')[0];
    const quantity_adjusted = adjustment.quantity_adjusted;
    const product_id = adjustment.product_id || (adjustment.product && adjustment.product.id);
    const currentStock = adjustment.quantity_after;
    let quantityAfter = currentStock;
    switch (oppositeType) {
      case 'increase':
        quantityAfter = currentStock + parseInt(quantity_adjusted);
        break;
      case 'decrease':
        quantityAfter = Math.max(0, currentStock - parseInt(quantity_adjusted));
        break;
      case 'set':
        quantityAfter = parseInt(quantity_adjusted);
        break;
      default:
        quantityAfter = currentStock;
    }
    const reversePayload = {
      product_id,
      adjustment_type: oppositeType,
      quantity_adjusted,
      reason: 'Reverse',
      reference_number,
      notes,
      adjustment_date,
      location_id: adjustment.location_id || '',
      cost_price: adjustment.cost_price || '',
      unit_price: adjustment.unit_price || '',
      quantity_before: currentStock,
      quantity_after: quantityAfter,
      reversed_from: adjustment.id // for traceability
    };
    try {
      const response = await fetch('/api/stock-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reversePayload)
      });
      if (response.ok) {
        toast.success('Adjustment reversed successfully');
        fetchData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reverse adjustment');
      }
    } catch (err) {
      toast.error(`Reverse adjustment error: ${err.message}`);
    }
  };

  // Handler to void a stock transfer
  const handleVoidTransfer = async (transfer) => {
    if (!transfer || transfer.status === 'void' || transfer.status === 'cancelled') return;
    try {
      const response = await fetch(`/api/stock-transfers/${transfer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'void' })
      });
      if (response.ok) {
        toast.success('Transfer voided successfully');
        fetchData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to void transfer');
      }
    } catch (err) {
      toast.error(`Void transfer error: ${err.message}`);
    }
  };

  const confirmReverseAdjustment = (adjustment) => {
    setAdjustmentToReverse(adjustment);
    setShowReverseModal(true);
  };

  const handleConfirmReverse = async () => {
    if (adjustmentToReverse) {
      await handleReverseAdjustment(adjustmentToReverse);
      setShowReverseModal(false);
      setAdjustmentToReverse(null);
    }
  };

  const handleCancelReverse = () => {
    setShowReverseModal(false);
    setAdjustmentToReverse(null);
  };

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
      <div className={`flex flex-1 min-h-screen ${
        mode === "dark" ? "bg-gray-900" : "bg-gray-50"
      }`}>
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className={`text-3xl font-bold mb-2 flex items-center gap-3 ${
                    mode === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Icon icon="mdi:tools" className="w-6 h-6 text-white" />
                    </div>
                    Stock Operations
                  </h1>
                  <p className={`${
                    mode === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}>
                    Manage stock adjustments and transfers in one place
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchData()}
                    className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 shadow-sm ${
                      mode === "dark" 
                        ? "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700" 
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon icon="mdi:refresh" className="w-4 h-4" />
                    Refresh
                  </button>
                  <button
                    onClick={handleOpenAdjustmentModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Icon icon="mdi:adjust" className="w-4 h-4" />
                    New Adjustment
                  </button>
                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Icon icon="mdi:truck-delivery" className="w-4 h-4" />
                    New Transfer
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className={`rounded-lg shadow-sm border mb-6 ${
              mode === "dark" 
                ? "bg-gray-800 border-gray-700" 
                : "bg-white border-gray-200"
            }`}>
              <div className={`border-b ${
                mode === "dark" ? "border-gray-700" : "border-gray-200"
              }`}>
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab("adjustments")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "adjustments"
                        ? "border-blue-500 text-blue-600"
                        : `border-transparent ${
                            mode === "dark" 
                              ? "text-gray-400 hover:text-gray-200 hover:border-gray-600" 
                              : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:adjust" className="w-4 h-4" />
                      Stock Adjustments
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("transfers")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "transfers"
                        ? "border-blue-500 text-blue-600"
                        : `border-transparent ${
                            mode === "dark" 
                              ? "text-gray-400 hover:text-gray-200 hover:border-gray-600" 
                              : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:truck-delivery" className="w-4 h-4" />
                      Stock Transfers
                    </div>
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "adjustments" ? (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className={`text-lg font-semibold ${
                        mode === "dark" ? "text-white" : "text-gray-900"
                      }`}>Recent Adjustments</h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${
                          mode === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}>
                          {adjustments.length} total adjustments
                        </span>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    {loading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className={`font-medium ${
                          mode === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}>Loading adjustments...</p>
                      </div>
                    ) : adjustments.length === 0 ? (
                      <div className="text-center py-12">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                          mode === "dark" ? "bg-gray-700" : "bg-gray-100"
                        }`}>
                          <Icon icon="mdi:clipboard-text" className={`w-8 h-8 ${
                            mode === "dark" ? "text-gray-500" : "text-gray-400"
                          }`} />
                        </div>
                        <h4 className={`text-lg font-medium mb-2 ${
                          mode === "dark" ? "text-white" : "text-gray-900"
                        }`}>No adjustments yet</h4>
                        <p className={`mb-4 ${
                          mode === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}>Create your first stock adjustment to get started</p>
                        <button
                          onClick={handleOpenAdjustmentModal}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Icon icon="mdi:plus" className="w-4 h-4" />
                          Create Adjustment
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {adjustments.slice(0, 10).map((adjustment) => (
                          <div key={adjustment.id} className={`border rounded-xl p-5 hover:shadow-md transition-all duration-200 ${
                            mode === "dark" 
                              ? "bg-gray-800 border-gray-700 hover:border-gray-600" 
                              : "bg-white border-gray-200 hover:border-gray-300"
                          }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    adjustment.adjustment_type === 'increase' 
                                      ? 'bg-gradient-to-br from-green-500 to-green-600' 
                                      : adjustment.adjustment_type === 'decrease'
                                      ? 'bg-gradient-to-br from-red-500 to-red-600'
                                      : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                  }`}>
                                    <Icon 
                                      icon={
                                        adjustment.adjustment_type === 'increase' ? 'mdi:trending-up' :
                                        adjustment.adjustment_type === 'decrease' ? 'mdi:trending-down' :
                                        'mdi:target'
                                      } 
                                      className="w-5 h-5 text-white" 
                                    />
                                  </div>
                                  <div>
                                    <div className={`font-semibold text-lg ${
                                      mode === "dark" ? "text-white" : "text-gray-900"
                                    }`}>
                                      {adjustment.product?.name || 'Unknown Product'}
                                    </div>
                                    <div className={`text-sm flex items-center gap-2 ${
                                      mode === "dark" ? "text-gray-400" : "text-gray-500"
                                    }`}>
                                      <Icon icon="mdi:identifier" className="w-4 h-4" />
                                      {adjustment.reference_number}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className={`flex items-center gap-4 text-sm mt-3 ${
                                  mode === "dark" ? "text-gray-300" : "text-gray-600"
                                }`}>
                                  <div className="flex items-center gap-1">
                                    <Icon icon="mdi:calendar" className="w-4 h-4" />
                                    {new Date(adjustment.adjustment_date).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Icon icon="mdi:package-variant" className="w-4 h-4" />
                                    {adjustment.quantity_before || 0} → {adjustment.quantity_after || 0} units
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-2">
                                {/* Adjustment Type Badge */}
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                                  adjustment.adjustment_type === 'increase' 
                                    ? 'bg-green-100 text-green-700 border border-green-200' 
                                    : adjustment.adjustment_type === 'decrease'
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                                }`}>
                                  <div className={`w-2 h-2 rounded-full ${
                                    adjustment.adjustment_type === 'increase' 
                                      ? 'bg-green-500' 
                                      : adjustment.adjustment_type === 'decrease'
                                      ? 'bg-red-500'
                                      : 'bg-blue-500'
                                  }`}></div>
                                  {adjustment.adjustment_type}
                                </div>
                                
                                {/* Quantity Badge */}
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  adjustment.adjustment_type === 'increase'
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : adjustment.adjustment_type === 'decrease'
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                  <Icon 
                                    icon={
                                      adjustment.adjustment_type === 'increase' ? 'mdi:plus' :
                                      adjustment.adjustment_type === 'decrease' ? 'mdi:minus' :
                                      'mdi:equal'
                                    } 
                                    className="w-3 h-3" 
                                  />
                                  {adjustment.quantity_adjusted > 0 ? '+' : ''}{adjustment.quantity_adjusted} units
                                </div>
                                {/* Reverse Button */}
                                <button
                                  onClick={() => confirmReverseAdjustment(adjustment)}
                                  className="mt-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold hover:bg-yellow-200 border border-yellow-200 transition-colors"
                                  title="Reverse this adjustment"
                                >
                                  <Icon icon="mdi:undo-variant" className="w-4 h-4 inline mr-1" /> Reverse
                                </button>
                              </div>
                            </div>
                            
                            {/* Adjustment Details */}
                            <div className={`mt-3 pt-3 border-t ${
                              mode === "dark" ? "border-gray-700" : "border-gray-100"
                            }`}>
                              <div className="flex items-center justify-between text-sm">
                                <div className={`${
                                  mode === "dark" ? "text-gray-300" : "text-gray-600"
                                }`}>
                                  <span className="font-medium">Reason:</span> {adjustment.reason}
                                </div>
                                {adjustment.notes && (
                                  <div className={`max-w-xs truncate ${
                                    mode === "dark" ? "text-gray-400" : "text-gray-500"
                                  }`}>
                                    "{adjustment.notes}"
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {adjustments.length > 10 && (
                          <div className="text-center pt-4">
                            <button className={`font-medium text-sm ${
                              mode === "dark" 
                                ? "text-blue-400 hover:text-blue-300" 
                                : "text-blue-600 hover:text-blue-700"
                            }`}>
                              View all {adjustments.length} adjustments →
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className={`text-lg font-semibold ${
                        mode === "dark" ? "text-white" : "text-gray-900"
                      }`}>Recent Transfers</h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${
                          mode === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}>
                          {transfers.length} total transfers
                        </span>
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    {loading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className={`font-medium ${
                          mode === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}>Loading transfers...</p>
                      </div>
                    ) : transfers.length === 0 ? (
                      <div className="text-center py-12">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                          mode === "dark" ? "bg-gray-700" : "bg-gray-100"
                        }`}>
                          <Icon icon="mdi:truck-delivery-outline" className={`w-8 h-8 ${
                            mode === "dark" ? "text-gray-500" : "text-gray-400"
                          }`} />
                        </div>
                        <h4 className={`text-lg font-medium mb-2 ${
                          mode === "dark" ? "text-white" : "text-gray-900"
                        }`}>No transfers yet</h4>
                        <p className={`mb-4 ${
                          mode === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}>Create your first stock transfer to get started</p>
                        <button
                          onClick={() => setShowTransferModal(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Icon icon="mdi:plus" className="w-4 h-4" />
                          Create Transfer
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {transfers.slice(0, 10).map((transfer) => (
                          <div key={transfer.id} className={`border rounded-xl p-5 hover:shadow-md transition-all duration-200 ${
                            mode === "dark" 
                              ? "bg-gray-800 border-gray-700 hover:border-gray-600" 
                              : "bg-white border-gray-200 hover:border-gray-300"
                          }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                    <Icon icon="mdi:truck-delivery" className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <div className={`font-semibold text-lg ${
                                      mode === "dark" ? "text-white" : "text-gray-900"
                                    }`}>
                                      {transfer.source_name} → {transfer.destination_name}
                                    </div>
                                    <div className={`text-sm flex items-center gap-2 ${
                                      mode === "dark" ? "text-gray-400" : "text-gray-500"
                                    }`}>
                                      <Icon icon="mdi:identifier" className="w-4 h-4" />
                                      {transfer.transfer_number}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className={`flex items-center gap-4 text-sm mt-3 ${
                                  mode === "dark" ? "text-gray-300" : "text-gray-600"
                                }`}>
                                  <div className="flex items-center gap-1">
                                    <Icon icon="mdi:calendar" className="w-4 h-4" />
                                    {new Date(transfer.transfer_date).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                  {transfer.expected_delivery_date && (
                                    <div className="flex items-center gap-1">
                                      <Icon icon="mdi:calendar-clock" className="w-4 h-4" />
                                      Expected: {new Date(transfer.expected_delivery_date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-2">
                                {/* Status Badge */}
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                                  transfer.status === 'completed' 
                                    ? 'bg-green-100 text-green-700 border border-green-200' 
                                    : transfer.status === 'in-transit'
                                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                    : transfer.status === 'pending'
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : transfer.status === 'cancelled' || transfer.status === 'void'
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                                }`}>
                                  <div className={`w-2 h-2 rounded-full ${
                                    transfer.status === 'completed' 
                                      ? 'bg-green-500' 
                                      : transfer.status === 'in-transit'
                                      ? 'bg-yellow-500'
                                      : transfer.status === 'pending'
                                      ? 'bg-blue-500'
                                      : transfer.status === 'cancelled' || transfer.status === 'void'
                                      ? 'bg-red-500'
                                      : 'bg-gray-500'
                                  }`}></div>
                                  {transfer.status}
                                </div>
                                
                                {/* Priority Badge */}
                                {transfer.priority && transfer.priority !== 'normal' && (
                                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                    transfer.priority === 'urgent'
                                      ? 'bg-red-100 text-red-700'
                                      : transfer.priority === 'high'
                                      ? 'bg-orange-100 text-orange-700'
                                      : transfer.priority === 'low'
                                      ? 'bg-gray-100 text-gray-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    <Icon icon={
                                      transfer.priority === 'urgent' ? 'mdi:alert-circle' :
                                      transfer.priority === 'high' ? 'mdi:arrow-up' :
                                      transfer.priority === 'low' ? 'mdi:arrow-down' : 'mdi:minus'
                                    } className="w-3 h-3" />
                                    {transfer.priority}
                                  </div>
                                )}
                                {/* Void Button */}
                                {transfer.status !== 'void' && transfer.status !== 'cancelled' && (
                                  <button
                                    onClick={() => handleVoidTransfer(transfer)}
                                    className="mt-2 px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-xs font-semibold hover:bg-red-200 border border-red-200 transition-colors"
                                    title="Void this transfer"
                                  >
                                    <Icon icon="mdi:close-octagon" className="w-4 h-4 inline mr-1" /> Void
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Transfer Details */}
                            {transfer.notes && (
                              <div className={`mt-3 pt-3 border-t ${
                                mode === "dark" ? "border-gray-700" : "border-gray-100"
                              }`}>
                                <div className={`text-sm ${
                                  mode === "dark" ? "text-gray-300" : "text-gray-600"
                                }`}>
                                  <span className="font-medium">Notes:</span> {transfer.notes}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {transfers.length > 10 && (
                          <div className="text-center pt-4">
                            <button className={`font-medium text-sm ${
                              mode === "dark" 
                                ? "text-blue-400 hover:text-blue-300" 
                                : "text-blue-600 hover:text-blue-700"
                            }`}>
                              View all {transfers.length} transfers →
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Adjustment Modal */}
      <SimpleModal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        title="New Stock Adjustment"
        width="max-w-4xl"
      >
        <div className="space-y-6">
          {/* Header with Reference Number */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">Adjustment Reference</h3>
                <p className="text-sm text-blue-700">This reference will be used to track the adjustment</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-bold text-blue-900">
                  {adjustmentData.reference_number}
                </div>
                <button
                  onClick={() => setAdjustmentData(prev => ({ ...prev, reference_number: generateReferenceNumber() }))}
                  className={`text-xs underline ${
                    mode === "dark" 
                      ? "text-blue-400 hover:text-blue-300" 
                      : "text-blue-600 hover:text-blue-800"
                  }`}
                >
                  Generate New
                </button>
              </div>
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product *</label>
            <Select
              value={productOptions.find(option => option.value === adjustmentData.product_id)}
              onChange={(selectedOption) => {
                const product = selectedOption ? selectedOption.product : null;
                setAdjustmentData(prev => ({ 
                  ...prev, 
                  product_id: selectedOption ? selectedOption.value : "",
                  unit_price: product ? parseFloat(product.price || 0) : "",
                  cost_price: product ? parseFloat(product.cost_price || 0) : ""
                }));
                setSelectedProduct(product);
              }}
              options={productOptions}
              placeholder="Search and select product..."
              isClearable
              isSearchable
              className="react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (provided) => ({
                  ...provided,
                  borderColor: '#d1d5db',
                  borderRadius: '0.5rem',
                  minHeight: '48px',
                  '&:hover': {
                    borderColor: '#3b82f6'
                  }
                }),
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : 'white',
                  color: state.isSelected ? 'white' : '#374151',
                  '&:hover': {
                    backgroundColor: state.isSelected ? '#3b82f6' : '#f3f4f6'
                  }
                })
              }}
            />
          </div>

          {/* Product Information Card */}
          {selectedProduct && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Stock</div>
                  <div className="text-lg font-semibold text-gray-900">{selectedProduct.quantity || 0} units</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unit Price</div>
                  <div className="text-lg font-semibold text-gray-900">GHS {parseFloat(selectedProduct.price || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cost Price</div>
                  <div className="text-lg font-semibold text-gray-900">GHS {parseFloat(selectedProduct.cost_price || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Value</div>
                  <div className="text-lg font-semibold text-gray-900">
                    GHS {((selectedProduct.quantity || 0) * parseFloat(selectedProduct.price || 0)).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Adjustment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Type *</label>
              <select
                value={adjustmentData.adjustment_type}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, adjustment_type: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="increase">Increase Stock</option>
                <option value="decrease">Decrease Stock</option>
                <option value="set">Set Stock Level</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Date *</label>
              <input
                type="date"
                value={adjustmentData.adjustment_date}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, adjustment_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
              <input
                type="number"
                value={adjustmentData.quantity_adjusted}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, quantity_adjusted: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quantity"
                min="0"
                step="1"
              />
              {selectedProduct && adjustmentData.quantity_adjusted && (
                <div className="mt-2 text-sm">
                  {adjustmentData.adjustment_type === 'increase' && (
                    <span className="text-green-600">
                      New stock will be: {parseInt(selectedProduct.quantity || 0) + parseInt(adjustmentData.quantity_adjusted)} units
                    </span>
                  )}
                  {adjustmentData.adjustment_type === 'decrease' && (
                    <span className="text-red-600">
                      New stock will be: {Math.max(0, parseInt(selectedProduct.quantity || 0) - parseInt(adjustmentData.quantity_adjusted))} units
                    </span>
                  )}
                  {adjustmentData.adjustment_type === 'set' && (
                    <span className="text-blue-600">
                      Stock will be set to: {adjustmentData.quantity_adjusted} units
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <Select
                value={locationOptions.find(option => option.value === adjustmentData.location_id)}
                onChange={(selectedOption) => setAdjustmentData(prev => ({ 
                  ...prev, 
                  location_id: selectedOption ? selectedOption.value : ""
                }))}
                options={locationOptions}
                placeholder="Select location (optional)"
                isClearable
                isSearchable
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (provided) => ({
                    ...provided,
                    borderColor: '#d1d5db',
                    borderRadius: '0.5rem',
                    minHeight: '48px',
                    '&:hover': {
                      borderColor: '#3b82f6'
                    }
                  }),
                  option: (provided, state) => ({
                    ...provided,
                    backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : 'white',
                    color: state.isSelected ? 'white' : '#374151',
                    '&:hover': {
                      backgroundColor: state.isSelected ? '#3b82f6' : '#f3f4f6'
                    }
                  })
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                          <select
                value={adjustmentData.reason}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a reason</option>
                <option value="Inventory count correction">Inventory count correction</option>
                <option value="Damaged goods">Damaged goods</option>
                <option value="Expired products">Expired products</option>
                <option value="Theft/Loss">Theft/Loss</option>
                <option value="Quality control">Quality control</option>
                <option value="Restocking">Restocking</option>
                <option value="Returns">Returns</option>
                <option value="Production">Production</option>
                <option value="Other">Other</option>
              </select>
          </div>

          {/* Financial Impact */}
          {selectedProduct && adjustmentData.quantity_adjusted && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-3">Financial Impact</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs font-medium text-yellow-700 uppercase tracking-wide">Adjustment Value</div>
                  <div className="text-lg font-semibold text-yellow-900">
                    GHS {(parseFloat(adjustmentData.quantity_adjusted) * parseFloat(selectedProduct.price || 0)).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-yellow-700 uppercase tracking-wide">Cost Impact</div>
                  <div className="text-lg font-semibold text-yellow-900">
                    GHS {(parseFloat(adjustmentData.quantity_adjusted) * parseFloat(selectedProduct.cost_price || 0)).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-yellow-700 uppercase tracking-wide">Profit Impact</div>
                  <div className="text-lg font-semibold text-yellow-900">
                    GHS {(parseFloat(adjustmentData.quantity_adjusted) * (parseFloat(selectedProduct.price || 0) - parseFloat(selectedProduct.cost_price || 0))).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={adjustmentData.notes}
              onChange={(e) => setAdjustmentData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Additional notes about this adjustment..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => setShowAdjustmentModal(false)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdjustment}
              disabled={!adjustmentData.product_id || !adjustmentData.quantity_adjusted || !adjustmentData.reason}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Adjustment
            </button>
          </div>
        </div>
      </SimpleModal>

      {/* Transfer Modal */}
      <SimpleModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="New Stock Transfer"
        width="max-w-4xl"
      >
        <div className="space-y-6">
          {/* Basic Transfer Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Location *</label>
              <Select
                value={locationOptions.find(option => option.value === transferData.fromLocation)}
                onChange={(selectedOption) => {
                  const selectedLocation = selectedOption ? selectedOption.location : null;
                  setTransferData(prev => ({ 
                    ...prev, 
                    fromLocation: selectedOption ? selectedOption.value : "",
                    fromLocationType: selectedLocation?.type || ""
                  }));
                }}
                options={locationOptions}
                placeholder="Search and select source location..."
                isClearable
                isSearchable
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (provided) => ({
                    ...provided,
                    borderColor: '#d1d5db',
                    borderRadius: '0.5rem',
                    minHeight: '48px',
                    '&:hover': {
                      borderColor: '#3b82f6'
                    }
                  }),
                  option: (provided, state) => ({
                    ...provided,
                    backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : 'white',
                    color: state.isSelected ? 'white' : '#374151',
                    '&:hover': {
                      backgroundColor: state.isSelected ? '#3b82f6' : '#f3f4f6'
                    }
                  })
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Location *</label>
              <Select
                value={locationOptions.find(option => option.value === transferData.toLocation)}
                onChange={(selectedOption) => {
                  const selectedLocation = selectedOption ? selectedOption.location : null;
                  setTransferData(prev => ({ 
                    ...prev, 
                    toLocation: selectedOption ? selectedOption.value : "",
                    toLocationType: selectedLocation?.type || ""
                  }));
                }}
                options={locationOptions}
                placeholder="Search and select destination location..."
                isClearable
                isSearchable
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (provided) => ({
                    ...provided,
                    borderColor: '#d1d5db',
                    borderRadius: '0.5rem',
                    minHeight: '48px',
                    '&:hover': {
                      borderColor: '#3b82f6'
                    }
                  }),
                  option: (provided, state) => ({
                    ...provided,
                    backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : 'white',
                    color: state.isSelected ? 'white' : '#374151',
                    '&:hover': {
                      backgroundColor: state.isSelected ? '#3b82f6' : '#f3f4f6'
                    }
                  })
                }}
              />
            </div>
          </div>

          {/* Transfer Details */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Date *</label>
              <input
                type="date"
                value={transferData.transfer_date}
                onChange={(e) => setTransferData(prev => ({ ...prev, transfer_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery Date</label>
              <input
                type="date"
                value={transferData.expected_delivery_date}
                onChange={(e) => setTransferData(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={transferData.priority}
                onChange={(e) => setTransferData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Method</label>
            <select
              value={transferData.transfer_method}
              onChange={(e) => setTransferData(prev => ({ ...prev, transfer_method: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="internal">Internal Transfer</option>
              <option value="external">External Transfer</option>
              <option value="courier">Courier</option>
              <option value="pickup">Pickup</option>
            </select>
          </div>

          {/* Items Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Transfer Items</h3>
              <span className="text-sm text-gray-500">
                {transferData.items.length} item{transferData.items.length !== 1 ? 's' : ''} added
              </span>
            </div>

            {/* Add New Item Form */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product *</label>
                  <Select
                    value={productOptions.find(option => option.value === newItem.product_id)}
                    onChange={(selectedOption) => setNewItem(prev => ({ 
                      ...prev, 
                      product_id: selectedOption ? selectedOption.value : "" 
                    }))}
                    options={productOptions}
                    placeholder="Search and select product..."
                    isClearable
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        borderColor: '#d1d5db',
                        borderRadius: '0.5rem',
                        minHeight: '40px',
                        '&:hover': {
                          borderColor: '#3b82f6'
                        }
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : 'white',
                        color: state.isSelected ? 'white' : '#374151',
                        '&:hover': {
                          backgroundColor: state.isSelected ? '#3b82f6' : '#f3f4f6'
                        }
                      })
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Qty"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <input
                    type="text"
                    value={newItem.notes}
                    onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Item notes"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={addItemToTransfer}
                    className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon icon="mdi:plus" className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
              </div>
            </div>

            {/* Items List */}
            {transferData.items.length > 0 ? (
              <div className="space-y-2">
                {transferData.items.map((item, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.product_name}</div>
                      <div className="text-sm text-gray-500">SKU: {item.product_sku}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Price: GHS {item.product_price.toFixed(2)} × {item.quantity} = GHS {(item.product_price * item.quantity).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Available Stock: {item.product_stock} units
                        {item.quantity > item.product_stock && (
                          <span className="text-red-600 ml-2">⚠️ Insufficient stock!</span>
                        )}
                      </div>
                      {item.notes && <div className="text-sm text-gray-500 mt-1">Notes: {item.notes}</div>}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{item.quantity} units</div>
                        <div className="text-sm text-gray-600">GHS {item.product_price.toFixed(2)} each</div>
                        <div className={`text-xs ${item.quantity > item.product_stock ? 'text-red-600' : 'text-green-600'}`}>
                          {item.quantity > item.product_stock ? 'Exceeds stock' : 'Stock available'}
                        </div>
                      </div>
                      <button
                        onClick={() => removeItemFromTransfer(index)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Remove item"
                      >
                        <Icon icon="mdi:delete" className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Icon icon="mdi:package-variant" className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No items added to transfer yet</p>
                <p className="text-sm">Add items using the form above</p>
              </div>
            )}

            {/* Transfer Summary */}
            {transferData.items.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-blue-900">
                      Transfer Summary
                    </div>
                    <div className="text-sm text-blue-700">
                      {transferData.items.length} item{transferData.items.length !== 1 ? 's' : ''} • {' '}
                      {transferData.items.reduce((total, item) => total + item.quantity, 0)} total units
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-900 text-lg">
                      GHS {transferData.items.reduce((total, item) => total + (item.product_price * item.quantity), 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-700">Total Value</div>
                    {transferData.items.some(item => item.quantity > item.product_stock) && (
                      <div className="text-xs text-red-600 mt-1">⚠️ Some items exceed available stock</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Notes</label>
            <textarea
              value={transferData.notes}
              onChange={(e) => setTransferData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Additional notes about this transfer..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => setShowTransferModal(false)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleTransfer}
              disabled={transferData.items.length === 0}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Transfer ({transferData.items.length} items)
            </button>
          </div>
        </div>
      </SimpleModal>

      {/* Confirmation Modal for Reverse Adjustment */}
      <SimpleModal
        isOpen={showReverseModal}
        onClose={handleCancelReverse}
        title="Confirm Reverse Adjustment"
        width="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Icon icon="mdi:undo-variant" className="w-8 h-8 text-yellow-600" />
            <div>
              <div className="font-semibold text-lg text-gray-900">Reverse this adjustment?</div>
              <div className="text-gray-600 text-sm">This will create a new adjustment that negates the original. This action cannot be undone.</div>
            </div>
          </div>
          {adjustmentToReverse && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
              <div><span className="font-medium">Product:</span> {adjustmentToReverse.product?.name || 'Unknown Product'}</div>
              <div><span className="font-medium">Type:</span> {adjustmentToReverse.adjustment_type}</div>
              <div><span className="font-medium">Quantity:</span> {adjustmentToReverse.quantity_adjusted} units</div>
              <div><span className="font-medium">Reference:</span> {adjustmentToReverse.reference_number}</div>
            </div>
          )}
          <div className="flex gap-3 pt-2 justify-end">
            <button
              onClick={handleCancelReverse}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReverse}
              className="px-4 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 transition-colors font-semibold"
            >
              Confirm Reverse
            </button>
          </div>
        </div>
      </SimpleModal>
    </MainLayout>
  );
} 