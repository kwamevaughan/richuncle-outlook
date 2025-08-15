import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import SimpleModal from "@/components/SimpleModal";
import { GenericTable } from "@/components/GenericTable";
import toast from "react-hot-toast";

export default function StockHistoryPage({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  
  // State
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Fetch history data
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Fetch all types of stock changes
      const [adjustmentsRes, transfersRes, salesRes, saleItemsRes] = await Promise.all([
        fetch('/api/stock-adjustments'),
        fetch('/api/stock-transfers'),
        fetch('/api/orders'), // For sales data
        fetch('/api/order-items').catch(() => ({ json: () => ({ data: [] }) })) // Try to get individual sale items
      ]);

      const adjustmentsData = await adjustmentsRes.json();
      const transfersData = await transfersRes.json();
      const salesData = await salesRes.json();
      const saleItemsData = await saleItemsRes.json();

      // Debug: Log the structure of sales data
      console.log('Sales data structure:', salesData.data?.[0]);
      console.log('Sale items data structure:', saleItemsData.data?.[0]);

      // Combine and format all history data
      const allHistory = [
        ...(adjustmentsData.data || []).map(item => ({
          // Only include primitive fields, no nested objects
          id: String(item.id || ''),
          type: 'adjustment',
          date: String(item.adjustment_date || ''),
          description: `${item.adjustment_type || ''} stock for ${item.product?.name || ''}`,
          quantity: String(item.quantity_adjusted || ''),
          user: String(item.adjusted_by || ''),
          // Fix reversed_from to show human-friendly reference
          reversed_from: item.reversed_from ? 
            (item.reversed_from.includes('-') && item.reversed_from.length > 20 ? 
              `ADJ-${item.reversed_from.slice(-6)}` : 
              item.reversed_from) : 
            '',
          // Flatten product object for export
          product_name: String(item.product?.name || ''),
          product_sku: String(item.product?.sku || ''),
          product_price: String(item.product?.price || ''),
          // Ensure all values are strings for export
          quantity_adjusted: String(item.quantity_adjusted || ''),
          quantity_before: String(item.quantity_before || ''),
          quantity_after: String(item.quantity_after || ''),
          unit_price: String(item.unit_price || ''),
          cost_price: String(item.cost_price || ''),
          reference_number: String(item.reference_number || ''),
          reason: String(item.reason || ''),
          notes: String(item.notes || ''),
          adjustment_type: String(item.adjustment_type || ''),
          status: String(item.status || ''),
          created_at: String(item.created_at || ''),
          updated_at: String(item.updated_at || '')
        })),
        ...(transfersData.data || []).map(item => ({
          // Only include primitive fields, no nested objects
          id: String(item.id || ''),
          type: 'transfer',
          date: String(item.transfer_date || ''),
          description: `Transfer from ${item.source_name || ''} to ${item.destination_name || ''}`,
          quantity: '1', // Single transfer record
          user: String(item.created_by || ''),
          // Flatten nested data for export
          source_name: String(item.source_name || ''),
          destination_name: String(item.destination_name || ''),
          transfer_date: String(item.transfer_date || ''),
          expected_delivery_date: String(item.expected_delivery_date || ''),
          priority: String(item.priority || ''),
          transfer_method: String(item.transfer_method || ''),
          status: String(item.status || ''),
          notes: String(item.notes || ''),
          reference: String(item.reference || ''),
          created_at: String(item.created_at || ''),
          updated_at: String(item.updated_at || '')
        })),
        // Process sale items if available, otherwise use sale transactions
        ...(saleItemsData.data && saleItemsData.data.length > 0 
          ? saleItemsData.data.map(saleItem => {
              // Find the corresponding sale transaction
              const saleTransaction = salesData.data?.find(sale => sale.id === saleItem.order_id);
              return {
                id: String(`${saleItem.order_id}-${saleItem.id}` || saleItem.id || ''),
                type: 'sale',
                date: String(saleTransaction?.timestamp || saleItem.created_at || ''),
                description: `Sale #${saleItem.order_id} - ${saleItem.name || saleItem.product_name || 'Product'}`,
                quantity: String(saleItem.quantity || '1'),
                user: String(saleTransaction?.payment_receiver_name || saleItem.created_by || ''),
                // Flatten nested data for export
                reference: String(saleItem.order_id || ''),
                timestamp: String(saleTransaction?.timestamp || saleItem.created_at || ''),
                total_amount: String(saleTransaction?.total || ''),
                subtotal: String(saleTransaction?.subtotal || ''),
                tax: String(saleTransaction?.tax || ''),
                discount: String(saleTransaction?.discount || ''),
                payment_method: String(saleTransaction?.payment_method || ''),
                status: String(saleTransaction?.status || saleItem.status || ''),
                customer_name: String(saleTransaction?.customer_name || ''),
                customer_id: String(saleTransaction?.customer_id || ''),
                product_name: String(saleItem.name || saleItem.product_name || ''),
                product_sku: String(saleItem.sku || saleItem.product_sku || ''),
                unit_price: String(saleItem.price || saleItem.unit_price || ''),
                cost_price: String(saleItem.cost_price || ''),
                item_tax: String(saleItem.item_tax || ''),
                tax_percentage: String(saleItem.tax_percentage || ''),
                product_id: String(saleItem.product_id || ''),
                order_type: String(saleTransaction?.order_type || ''),
                register_id: String(saleTransaction?.register_id || ''),
                store_id: String(saleTransaction?.store_id || saleItem.store_id || ''),
                payment_receiver_name: String(saleTransaction?.payment_receiver_name || ''),
                sale_note: String(saleTransaction?.sale_note || ''),
                staff_note: String(saleTransaction?.staff_note || ''),
                created_at: String(saleItem.created_at || saleTransaction?.timestamp || ''),
                updated_at: String(saleItem.updated_at || '')
              };
            })
          : (salesData.data || []).map(item => ({
              // Fallback to sale transactions if no individual items
              id: String(item.id || ''),
              type: 'sale',
              date: String(item.timestamp || item.created_at || ''),
              description: `Sale Transaction #${item.id}`,
              quantity: '1', // Sale transaction count
              user: String(item.payment_receiver_name || item.created_by || ''),
              reference: String(item.id || ''),
              timestamp: String(item.timestamp || item.created_at || ''),
              total_amount: String(item.total || item.total_amount || ''),
              subtotal: String(item.subtotal || ''),
              tax: String(item.tax || ''),
              discount: String(item.discount || ''),
              payment_method: String(item.payment_method || ''),
              status: String(item.status || ''),
              customer_name: String(item.customer_name || ''),
              customer_id: String(item.customer_id || ''),
              product_name: `Sale (GHS ${item.total || '0'})`,
              unit_price: String(item.total || item.total_amount || ''),
              order_type: String(item.order_type || ''),
              register_id: String(item.register_id || ''),
              store_id: String(item.store_id || ''),
              payment_receiver_name: String(item.payment_receiver_name || ''),
              sale_note: String(item.sale_note || ''),
              staff_note: String(item.staff_note || ''),
              created_at: String(item.created_at || item.timestamp || ''),
              updated_at: String(item.updated_at || '')
            }))
        )
      ];

      // Sort by date (newest first)
      allHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setHistory(allHistory);
    } catch (err) {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  // Filter history
  const filteredHistory = history.filter(record => {
    const matchesSearch = 
      record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || record.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Get type styling
  const getTypeStyle = (type) => {
    switch (type) {
      case "adjustment":
        return { bg: "bg-purple-100", color: "text-purple-800", icon: "mdi:adjust" };
      case "transfer":
        return { bg: "bg-blue-100", color: "text-blue-800", icon: "mdi:truck-delivery" };
      case "sale":
        return { bg: "bg-green-100", color: "text-green-800", icon: "mdi:cart" };
      default:
        return { bg: "bg-gray-100", color: "text-gray-800", icon: "mdi:help" };
    }
  };

  // GenericTable columns configuration
  const columns = [
    {
      accessor: 'date',
      Header: 'Date & Time',
      sortable: true,
      render: (row) => (
        <div className="text-sm text-gray-900">
          {new Date(row.date).toLocaleString()}
        </div>
      )
    },
    {
      accessor: 'type',
      Header: 'Type',
      sortable: true,
      render: (row) => {
        const style = getTypeStyle(row.type);
        return (
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.color}`}>
            <Icon icon={style.icon} className="w-3 h-3" />
            {row.type.charAt(0).toUpperCase() + row.type.slice(1)}
          </div>
        );
      }
    },
    {
      accessor: 'description',
      Header: 'Description',
      sortable: true,
      render: (row) => (
        <div className="text-sm text-gray-900 max-w-xs truncate" title={row.description}>
          {row.description}
        </div>
      )
    },
    {
      accessor: 'product_name',
      Header: 'Product',
      sortable: true,
      render: (row) => (
        <div className="text-sm text-gray-900">
          {row.product_name || 'N/A'}
        </div>
      )
    },
    {
      accessor: 'quantity',
      Header: 'Quantity',
      sortable: true,
      render: (row) => (
        <div className="text-sm font-semibold text-gray-900">
          {row.quantity || '0'} {row.type === 'adjustment' ? 'units' : row.type === 'sale' ? 'sold' : 'items'}
        </div>
      )
    },
    {
      accessor: 'reference',
      Header: 'Reference',
      sortable: true,
      render: (row) => (
        <div className="text-sm text-gray-500">
          {row.reference || row.reference_number || 'N/A'}
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
        setSelectedRecord(row);
        setShowDetailModal(true);
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
      <div className="flex flex-1 bg-gray-50 min-h-screen pt-0 md:pt-14">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:history"
                        className="w-4 h-4 sm:w-6 sm:h-6 text-white"
                      />
                    </div>
                    Stock History
                  </h1>
                  <p className="text-gray-600">
                    Complete audit trail of all stock changes and movements
                  </p>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                        {history.filter((h) => h.type === "adjustment").length}
                      </div>
                      <div className="text-sm text-gray-500">Adjustments</div>
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
                        {history.filter((h) => h.type === "transfer").length}
                      </div>
                      <div className="text-sm text-gray-500">Transfers</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:cart"
                        className="w-5 h-5 text-green-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {history.filter((h) => h.type === "sale").length}
                      </div>
                      <div className="text-sm text-gray-500">Sales</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:calendar"
                        className="w-5 h-5 text-indigo-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {history.length}
                      </div>
                      <div className="text-sm text-gray-500">Total Records</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg p-4 shadow-sm border mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search by description, product, or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="all">All Types</option>
                  <option value="adjustment">Adjustments</option>
                  <option value="transfer">Transfers</option>
                  <option value="sale">Sales</option>
                </select>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading history...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                <Icon
                  icon="mdi:history"
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No History Found
                </h3>
                <p className="text-gray-500">
                  No stock history matches your current filters.
                </p>
              </div>
            ) : (
              <GenericTable
                data={filteredHistory}
                columns={columns}
                actions={tableActions}
                title="Stock History"
                emptyMessage="No history found"
                selectable={false}
                searchable={false}
              />
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <SimpleModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={
          selectedRecord
            ? `${
                selectedRecord.type.charAt(0).toUpperCase() +
                selectedRecord.type.slice(1)
              } Details`
            : "History Details"
        }
        width="max-w-4xl"
      >
        {selectedRecord && (
          <div className="space-y-8">
            {/* Header Section */}
            <div
              className={`rounded-xl p-6 flex flex-col md:flex-row md:items-center gap-6 shadow-sm border ${
                getTypeStyle(selectedRecord.type).bg
              }`}
            >
              <div className="flex flex-col items-center md:items-start gap-3 min-w-[100px]">
                <div
                  className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-lg ${
                    getTypeStyle(selectedRecord.type).bg
                  }`}
                >
                  <Icon
                    icon={getTypeStyle(selectedRecord.type).icon}
                    className={`w-8 h-8 ${
                      getTypeStyle(selectedRecord.type).color
                    }`}
                  />
                </div>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                    getTypeStyle(selectedRecord.type).bg
                  } ${getTypeStyle(selectedRecord.type).color}`}
                >
                  {selectedRecord.type.charAt(0).toUpperCase() +
                    selectedRecord.type.slice(1)}
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-sm">
                    <Icon icon="mdi:calendar" className="w-4 h-4" />
                    {new Date(selectedRecord.date).toLocaleString()}
                  </div>
                  {selectedRecord.reference && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-sm font-mono">
                      <Icon icon="mdi:identifier" className="w-4 h-4" />
                      {selectedRecord.reference}
                    </div>
                  )}
                  {selectedRecord.status &&
                    selectedRecord.status.toLowerCase() !== "completed" && (
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold ${
                          selectedRecord.status === "void" ||
                          selectedRecord.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        <Icon icon="mdi:information" className="w-4 h-4" />
                        {selectedRecord.status.charAt(0).toUpperCase() +
                          selectedRecord.status.slice(1)}
                      </div>
                    )}
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {selectedRecord.description}
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product & Basic Info */}
              <div className="space-y-6">
                {/* Product Card */}
                {selectedRecord.product_name && (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Icon
                        icon="mdi:package-variant"
                        className="w-5 h-5 text-blue-600"
                      />
                      Product Information
                    </h3>
                    <div className="flex items-center gap-4">
                      {/* Assuming product_image is not directly available in the row data,
                          but if it were, you would use selectedRecord.product_image */}
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-lg">
                          {selectedRecord.product_name}
                        </div>
                        {selectedRecord.product_sku && (
                          <div className="text-sm text-gray-500 mt-1">
                            SKU: {selectedRecord.product_sku}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quantity/Stock Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Icon
                      icon="mdi:counter"
                      className="w-5 h-5 text-green-600"
                    />
                    Stock Information
                  </h3>
                  {selectedRecord.type === "adjustment" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Icon
                          icon={
                            selectedRecord.quantity > 0
                              ? "mdi:plus-circle"
                              : "mdi:minus-circle"
                          }
                          className={
                            selectedRecord.quantity > 0
                              ? "text-green-600 w-6 h-6"
                              : "text-red-600 w-6 h-6"
                          }
                        />
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {selectedRecord.quantity > 0 ? "+" : ""}
                            {selectedRecord.quantity} units
                          </div>
                          <div className="text-sm text-gray-500">
                            Stock Change
                          </div>
                        </div>
                      </div>
                      {selectedRecord.quantity_before !== undefined &&
                        selectedRecord.quantity_after !== undefined && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-sm text-gray-600 mb-1">
                              Stock Levels
                            </div>
                            <div className="flex items-center gap-2 text-lg font-semibold">
                              <span className="text-gray-900">
                                {selectedRecord.quantity_before}
                              </span>
                              <Icon
                                icon="mdi:arrow-right"
                                className="text-gray-400 w-5 h-5"
                              />
                              <span className="text-gray-900">
                                {selectedRecord.quantity_after}
                              </span>
                              <span className="text-gray-500 text-sm">
                                units
                              </span>
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                  {selectedRecord.type === "transfer" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Icon
                          icon="mdi:truck-delivery"
                          className="text-blue-600 w-6 h-6"
                        />
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {selectedRecord.quantity} items
                          </div>
                          <div className="text-sm text-gray-500">
                            Transferred
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-gray-600 mb-2">
                          Transfer Route
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {selectedRecord.source_name}
                          </span>
                          <Icon
                            icon="mdi:arrow-right"
                            className="text-gray-400 w-4 h-4"
                          />
                          <span className="font-semibold text-gray-900">
                            {selectedRecord.destination_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedRecord.type === "sale" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Icon
                          icon="mdi:cart"
                          className="text-green-600 w-6 h-6"
                        />
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {selectedRecord.quantity}{" "}
                            {selectedRecord.product_name?.includes("Sale (")
                              ? "transaction"
                              : "items"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {selectedRecord.product_name?.includes("Sale (")
                              ? "Sale Transaction"
                              : "Sold"}
                          </div>
                        </div>
                      </div>
                      {selectedRecord.total_amount &&
                        parseFloat(selectedRecord.total_amount) > 0 && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-sm text-gray-600 mb-1">
                              Sale Total
                            </div>
                            <div className="text-lg font-semibold text-gray-900">
                              GHS{" "}
                              {parseFloat(selectedRecord.total_amount).toFixed(
                                2
                              )}
                            </div>
                            {selectedRecord.payment_method && (
                              <div className="text-sm text-gray-500 mt-1">
                                via{" "}
                                {selectedRecord.payment_method.toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Customer Info for Sales */}
                {selectedRecord.type === "sale" &&
                  selectedRecord.customer_name &&
                  selectedRecord.customer_name !== "Walk In Customer" && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Icon
                          icon="mdi:account-group"
                          className="w-5 h-5 text-green-600"
                        />
                        Customer Information
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Icon
                            icon="mdi:account-group"
                            className="w-5 h-5 text-green-600"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {selectedRecord.customer_name}
                          </div>
                          <div className="text-sm text-gray-500">Customer</div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              {/* Financial Information */}
              {(selectedRecord.unit_price || selectedRecord.cost_price) && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Icon
                        icon="mdi:currency-ghs"
                        className="w-5 h-5 text-green-600"
                      />
                      Financial Details
                    </h3>
                    <div className="space-y-4">
                      {selectedRecord.unit_price && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">Unit Price</span>
                          <span className="font-semibold text-gray-900">
                            GHS{" "}
                            {parseFloat(selectedRecord.unit_price).toFixed(2)}
                          </span>
                        </div>
                      )}
                      {selectedRecord.cost_price && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">Cost Price</span>
                          <span className="font-semibold text-gray-900">
                            GHS{" "}
                            {parseFloat(selectedRecord.cost_price).toFixed(2)}
                          </span>
                        </div>
                      )}
                      {selectedRecord.unit_price &&
                        selectedRecord.quantity &&
                        parseFloat(selectedRecord.quantity) > 1 && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">
                              Total Value ({selectedRecord.quantity} ×{" "}
                              {parseFloat(selectedRecord.unit_price).toFixed(2)}
                              )
                            </span>
                            <span className="font-semibold text-gray-900">
                              GHS{" "}
                              {(
                                parseFloat(selectedRecord.unit_price) *
                                parseFloat(selectedRecord.quantity)
                              ).toFixed(2)}
                            </span>
                          </div>
                        )}
                      {selectedRecord.unit_price &&
                        selectedRecord.cost_price &&
                        selectedRecord.quantity && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600">Profit Impact</span>
                            <span
                              className={`font-semibold ${
                                (parseFloat(selectedRecord.unit_price) -
                                  parseFloat(selectedRecord.cost_price)) *
                                  parseFloat(selectedRecord.quantity) >=
                                0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              GHS{" "}
                              {(
                                (parseFloat(selectedRecord.unit_price) -
                                  parseFloat(selectedRecord.cost_price)) *
                                parseFloat(selectedRecord.quantity)
                              ).toFixed(2)}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* User/Staff Info */}
                  {selectedRecord.user && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Icon
                          icon="mdi:account"
                          className="w-5 h-5 text-indigo-600"
                        />
                        {selectedRecord.type === "sale"
                          ? "Staff Information"
                          : "User Information"}
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Icon
                            icon="mdi:account"
                            className="w-5 h-5 text-indigo-600"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {selectedRecord.user}
                          </div>
                          <div className="text-sm text-gray-500">
                            {selectedRecord.type === "sale"
                              ? "Payment Receiver"
                              : "Performed this action"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes & Audit Trail */}
              <div className="space-y-6">
                {/* Reason & Notes */}
                {(selectedRecord.reason ||
                  selectedRecord.notes ||
                  selectedRecord.sale_note ||
                  selectedRecord.staff_note) && (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Icon
                        icon="mdi:note-text"
                        className="w-5 h-5 text-purple-600"
                      />
                      Additional Information
                    </h3>
                    <div className="space-y-4">
                      {selectedRecord.reason && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Icon
                              icon="mdi:information"
                              className="w-4 h-4 text-blue-500"
                            />
                            Reason
                          </div>
                          <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                            {selectedRecord.reason}
                          </div>
                        </div>
                      )}
                      {selectedRecord.notes && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Icon
                              icon="mdi:note-text"
                              className="w-4 h-4 text-indigo-500"
                            />
                            Notes
                          </div>
                          <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                            {selectedRecord.notes}
                          </div>
                        </div>
                      )}
                      {selectedRecord.sale_note &&
                        selectedRecord.sale_note.trim() && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <Icon
                                icon="mdi:note-outline"
                                className="w-4 h-4 text-blue-500"
                              />
                              Sale Note
                            </div>
                            <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                              {selectedRecord.sale_note}
                            </div>
                          </div>
                        )}
                      {selectedRecord.staff_note &&
                        selectedRecord.staff_note.trim() && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <Icon
                                icon="mdi:account-edit"
                                className="w-4 h-4 text-purple-500"
                              />
                              Staff Note
                            </div>
                            <div className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                              {selectedRecord.staff_note}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Audit Trail */}
                {(selectedRecord.reversed_from ||
                  selectedRecord.status === "void") && (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Icon
                        icon="mdi:history"
                        className="w-5 h-5 text-orange-600"
                      />
                      Audit Trail
                    </h3>
                    <div className="space-y-3">
                      {selectedRecord.reversed_from && (
                        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon
                              icon="mdi:undo-variant"
                              className="w-4 h-4 text-yellow-600"
                            />
                            <span className="text-sm font-medium text-yellow-800">
                              Reversed From
                            </span>
                          </div>
                          <div className="text-sm text-yellow-700 font-mono">
                            {selectedRecord.reversed_from}
                          </div>
                        </div>
                      )}
                      {selectedRecord.status === "void" && (
                        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon
                              icon="mdi:close-octagon"
                              className="w-4 h-4 text-red-600"
                            />
                            <span className="text-sm font-medium text-red-800">
                              Voided
                            </span>
                          </div>
                          <div className="text-sm text-red-700">
                            This transfer was voided.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                {(selectedRecord.created_at || selectedRecord.updated_at) && (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Icon
                        icon="mdi:clock-outline"
                        className="w-5 h-5 text-gray-600"
                      />
                      Timestamps
                    </h3>
                    <div className="space-y-3">
                      {selectedRecord.created_at && (
                        <div className="flex items-center gap-3">
                          <Icon
                            icon="mdi:clock-outline"
                            className="w-4 h-4 text-gray-400"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-700">
                              Created
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(
                                selectedRecord.created_at
                              ).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedRecord.updated_at && (
                        <div className="flex items-center gap-3">
                          <Icon
                            icon="mdi:clock-edit-outline"
                            className="w-4 h-4 text-gray-400"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-700">
                              Updated
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(
                                selectedRecord.updated_at
                              ).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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