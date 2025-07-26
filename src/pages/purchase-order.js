import React, { useState, useEffect } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Icon } from "@iconify/react";
import usePurchaseOrders from "../hooks/usePurchaseOrders";
import PurchaseOrderModals from "../components/PurchaseOrderModals";
import { GenericTable } from "../components/GenericTable";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import PurchaseOrderItemsEditor from "../components/PurchaseOrderItemsEditor";
import SimpleModal from "../components/SimpleModal";
import toast from "react-hot-toast";

export default function PurchaseOrderPage({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  const {
    purchaseOrders,
    loading,
    error,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    fetchPurchaseOrders,
  } = usePurchaseOrders();

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [rowLineItems, setRowLineItems] = useState({});
  
  // Enhanced state for modern features
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    inTransit: 0,
    completed: 0,
    cancelled: 0,
    totalValue: 0,
    monthlyValue: 0
  });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [supplierFilter, setSupplierFilter] = useState("all");

  const openAddModal = () => {
    setEditItem(null);
    setLineItems([]);
    setShowModal(true);
    setModalError(null);
  };
  const openEditModal = (item) => {
    setEditItem(item);
    fetch(`/api/purchase-order-items?purchase_order_id=${item.id}`)
      .then((res) => res.json())
      .then(({ data }) => setLineItems(data || []));
    setShowModal(true);
    setModalError(null);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    setModalError(null);
    setLineItems([]);
  };

  const handleSave = async (values, items) => {
    setModalLoading(true);
    setModalError(null);
    try {
      let order;
      if (editItem) {
        order = await updatePurchaseOrder(editItem.id, values);
      } else {
        order = await addPurchaseOrder(values);
      }
      // Save line items
      await fetch("/api/purchase-order-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          (items || lineItems).map((item) => ({
            ...item,
            purchase_order_id: order.id || order.data?.id,
            total: (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0),
          }))
        ),
      });
      closeModal();
      toast.success(editItem ? "Purchase order updated successfully!" : "Purchase order created successfully!");
    } catch (err) {
      setModalError(err.message || "Failed to save purchase order");
      toast.error("Failed to save purchase order");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setModalLoading(true);
    setModalError(null);
    try {
      await fetch("/api/purchase-order-items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchase_order_id: id }),
      });
      await deletePurchaseOrder(id);
      closeModal();
      toast.success("Purchase order deleted successfully!");
    } catch (err) {
      setModalError(err.message || "Failed to delete purchase order");
      toast.error("Failed to delete purchase order");
    } finally {
      setModalLoading(false);
    }
  };

  // Expand/collapse handler
  const handleExpandRow = async (orderId) => {
    setExpandedRows((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
    if (!rowLineItems[orderId]) {
      const res = await fetch(`/api/purchase-order-items?purchase_order_id=${orderId}`);
      const { data } = await res.json();
      setRowLineItems((prev) => ({ ...prev, [orderId]: data || [] }));
    }
  };

  // Calculate statistics
  useEffect(() => {
    if (purchaseOrders.length > 0) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      const total = purchaseOrders.length;
      const pending = purchaseOrders.filter(order => order.status === 'pending').length;
      const approved = purchaseOrders.filter(order => order.status === 'approved').length;
      const inTransit = purchaseOrders.filter(order => order.status === 'in_transit').length;
      const completed = purchaseOrders.filter(order => order.status === 'completed').length;
      const cancelled = purchaseOrders.filter(order => order.status === 'cancelled').length;
      
      const totalValue = purchaseOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const monthlyValue = purchaseOrders
        .filter(order => new Date(order.date) >= thirtyDaysAgo)
        .reduce((sum, order) => sum + (order.total || 0), 0);
      
      setStats({
        total,
        pending,
        approved,
        inTransit,
        completed,
        cancelled,
        totalValue,
        monthlyValue
      });
    }
  }, [purchaseOrders]);

  // Filter data
  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return { bg: "bg-yellow-100", color: "text-yellow-800", icon: "mdi:clock-outline" };
      case "approved":
        return { bg: "bg-blue-100", color: "text-blue-800", icon: "mdi:check-circle" };
      case "in_transit":
        return { bg: "bg-purple-100", color: "text-purple-800", icon: "mdi:truck-delivery" };
      case "completed":
        return { bg: "bg-green-100", color: "text-green-800", icon: "mdi:check-circle" };
      case "cancelled":
        return { bg: "bg-red-100", color: "text-red-800", icon: "mdi:close-circle" };
      default:
        return { bg: "bg-gray-100", color: "text-gray-800", icon: "mdi:help-circle" };
    }
  };

  // Add useEffect to fetch purchase orders on mount
  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  if (userLoading && LoadingComponent) return LoadingComponent;
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  return (
    <MainLayout mode={mode} user={user} toggleMode={toggleMode} onLogout={handleLogout} {...props}>
      <div className="flex flex-1 bg-gray-50 min-h-screen">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:clipboard-text"
                        className="w-6 h-6 text-white"
                      />
                    </div>
                    Purchase Orders
                  </h1>
                  <p className="text-gray-600">
                    Manage formal purchase orders with approval workflows
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchPurchaseOrders()}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Icon icon="mdi:refresh" className="w-4 h-4" />
                    Refresh
                  </button>
                  <button
                    onClick={openAddModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Icon icon="mdi:plus" className="w-4 h-4" />
                    New Order
                  </button>
                </div>
              </div>

              {/* Enhanced Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:clipboard-text"
                        className="w-5 h-5 text-blue-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.total}
                      </div>
                      <div className="text-sm text-gray-500">
                        Total Orders
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
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:truck-delivery"
                        className="w-5 h-5 text-purple-600"
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
              </div>

              {/* Value Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Total Value</div>
                      <div className="text-2xl font-bold text-gray-900">
                        GHS {stats.totalValue.toLocaleString()}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:currency-usd"
                        className="w-6 h-6 text-blue-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">This Month</div>
                      <div className="text-2xl font-bold text-gray-900">
                        GHS {stats.monthlyValue.toLocaleString()}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:trending-up"
                        className="w-6 h-6 text-green-600"
                      />
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
                  placeholder="Search orders by number, supplier, or warehouse..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="in_transit">In Transit</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>

            {/* Content Area */}
            {loading ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading purchase orders...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                <Icon
                  icon="mdi:alert-circle"
                  className="w-12 h-12 text-red-500 mx-auto mb-4"
                />
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                <Icon
                  icon="mdi:clipboard-text-off"
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Purchase Orders Found
                </h3>
                <p className="text-gray-500">
                  No purchase orders match your current filters.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl">
                <GenericTable
                  data={filteredOrders}
                  columns={[
                    {
                      header: "",
                      accessor: "expand",
                      render: (row) => (
                        <button
                          onClick={() => handleExpandRow(row.id)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title={expandedRows.includes(row.id) ? "Collapse" : "Expand"}
                        >
                          <Icon icon={expandedRows.includes(row.id) ? "mdi:chevron-up" : "mdi:chevron-down"} className="w-5 h-5" />
                        </button>
                      ),
                    },
                    { header: "Order Number", accessor: "order_number", sortable: true },
                    { header: "Supplier", accessor: "supplier_name", sortable: true },
                    { header: "Warehouse", accessor: "warehouse_name", sortable: true },
                    { header: "Date", accessor: "date", sortable: true, render: (row) => 
                      new Date(row.date).toLocaleDateString() 
                    },
                    { 
                      header: "Status", 
                      accessor: "status", 
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
                    { header: "Total", accessor: "total", sortable: true, render: (row) => 
                      `GHS ${(row.total || 0).toLocaleString()}` 
                    },
                  ]}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  onAddNew={openAddModal}
                  addNewLabel="Add Purchase Order"
                  title=""
                  emptyMessage="No purchase orders found"
                  statusOptions={[
                    { value: "pending", label: "Pending" },
                    { value: "approved", label: "Approved" },
                    { value: "in_transit", label: "In Transit" },
                    { value: "completed", label: "Completed" },
                    { value: "cancelled", label: "Cancelled" }
                  ]}
                  onImport={null}
                  importType="purchase-orders"
                  customRowRender={(row, index, defaultRow) => (
                    <>
                      {defaultRow}
                      {expandedRows.includes(row.id) && (
                        <tr className="bg-gray-50 dark:bg-gray-800">
                          <td colSpan={8} className="p-4">
                            <div className="font-semibold mb-2">Line Items</div>
                            <PurchaseOrderItemsEditor items={rowLineItems[row.id] || []} disabled={true} />
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                />
              </div>
            )}
            
            <PurchaseOrderModals
              show={showModal}
              onClose={closeModal}
              onSave={handleSave}
              onDelete={editItem ? handleDelete : undefined}
              purchaseOrder={editItem}
              mode={mode}
              loading={modalLoading}
              error={modalError}
            >
              <PurchaseOrderItemsEditor
                items={lineItems}
                onChange={setLineItems}
                disabled={modalLoading}
              />
            </PurchaseOrderModals>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 