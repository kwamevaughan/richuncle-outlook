import React, { useState, useEffect } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Icon } from "@iconify/react";
import { GenericTable } from "../components/GenericTable";
import CategoryCSVImport from "../components/CategoryCSVImport";
import PurchaseModals from "../components/PurchaseModals";
import usePurchases from "../hooks/usePurchases";
import SimpleModal from "../components/SimpleModal";
import PurchaseItemsEditor from "../components/PurchaseItemsEditor";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import toast from "react-hot-toast";
import { useRouter } from "next/router";

export default function PurchasesPage({ mode = "light", toggleMode, ...props }) {
  const router = useRouter();
  const {
    purchases,
    loading,
    error,
    addPurchase,
    updatePurchase,
    deletePurchase,
    fetchPurchases,
  } = usePurchases();

  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [rowLineItems, setRowLineItems] = useState({});
  const [viewItemsModal, setViewItemsModal] = useState({ open: false, items: [] });

  // Enhanced state for modern features
  const [stats, setStats] = useState({
    total: 0,
    totalValue: 0,
    monthlyValue: 0,
    averageValue: 0,
    supplierCount: 0
  });
  
  // Add products state for line items modal
  const [products, setProducts] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [supplierFilter, setSupplierFilter] = useState("all");

  useEffect(() => {
    fetchPurchases();
    // Fetch products for line items modal
    fetch("/api/products")
      .then((res) => res.json())
      .then(({ data }) => setProducts(data || []));
  }, [fetchPurchases]);

  // Calculate statistics
  useEffect(() => {
    if (purchases.length > 0) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      const total = purchases.length;
      const totalValue = purchases.reduce((sum, purchase) => sum + (purchase.total || 0), 0);
      const monthlyValue = purchases
        .filter(purchase => new Date(purchase.date) >= thirtyDaysAgo)
        .reduce((sum, purchase) => sum + (purchase.total || 0), 0);
      const averageValue = total > 0 ? totalValue / total : 0;
      
      // Get unique suppliers
      const uniqueSuppliers = new Set(purchases.map(p => p.supplier_id));
      
      setStats({
        total,
        totalValue,
        monthlyValue,
        averageValue,
        supplierCount: uniqueSuppliers.size
      });
    }
  }, [purchases]);

  // Filter data
  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = 
      purchase.purchase_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || purchase.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Check for add query parameter to open modal
  useEffect(() => {
    if (router.query.add === 'true') {
      openAddModal();
      // Remove the query parameter
      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router.query.add]);

  const openAddModal = () => {
    setEditItem(null);
    setLineItems([]);
    setShowModal(true);
    setModalError(null);
  };
  const openEditModal = (item) => {
    setEditItem(item);
    // TODO: Fetch line items for this purchase from API
    fetch(`/api/purchase-items?purchase_id=${item.id}`)
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
  const openConfirm = (item) => {
    setDeleteItem(item);
    setShowConfirm(true);
  };
  const closeConfirm = () => {
    setDeleteItem(null);
    setShowConfirm(false);
  };
  const handleDelete = async () => {
    if (!deleteItem) return;
    setModalLoading(true);
    try {
      await deletePurchase(deleteItem.id);
      closeConfirm();
      toast.success("Purchase deleted successfully!");
    } catch (err) {
      setModalError(err.message || "Failed to delete purchase");
      toast.error("Failed to delete purchase");
    } finally {
      setModalLoading(false);
    }
  };

  // Add a helper to add a new product
  const handleAddProduct = async (newProduct) => {
    // Insert the product
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newProduct),
    });
    const { data, error } = await response.json();
    if (error) throw error;
    // Fetch the full product row with joins
    const selectString = "*, category:categories!products_category_id_fkey(name), brand:brands!brand_id(name), unit:units!unit_id(name)";
    const selectResponse = await fetch(`/api/products/${data.id}?select=${selectString}`);
    const { data: fullData, error: fetchError } = await selectResponse.json();
    if (fetchError) throw fetchError;
    // Add the new product with joined fields to the state
    setProducts((prev) => [
      {
        ...fullData,
        category_name: fullData.category?.name || "",
        brand_name: fullData.brand?.name || "",
        unit_name: fullData.unit?.name || "",
      },
      ...prev,
    ]);
  };

  // Add a helper to update a product
  const handleUpdateProduct = async (id, updatedFields) => {
    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedFields),
    });
    const { data, error } = await response.json();
    if (error) throw error;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p))
    );
  };

  const handleSave = async (values) => {
    setModalLoading(true);
    setModalError(null);
    // Validation
    const requiredFields = ["supplier_id", "warehouse_id", "date", "status"];
    for (const field of requiredFields) {
      if (!values[field]) {
        setModalError(`Missing required field: ${field.replace(/_/g, ' ')}`);
        setModalLoading(false);
        return;
      }
    }
    if (!lineItems || lineItems.length === 0) {
      setModalError("At least one line item is required.");
      setModalLoading(false);
      return;
    }
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (!item.product_id) {
        setModalError(`Line item ${i + 1}: Product is required.`);
        setModalLoading(false);
        return;
      }
      if (!item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
        setModalError(`Line item ${i + 1}: Quantity must be greater than 0.`);
        setModalLoading(false);
        return;
      }
      if (item.unit_cost === undefined || isNaN(Number(item.unit_cost)) || Number(item.unit_cost) < 0) {
        setModalError(`Line item ${i + 1}: Unit cost must be 0 or greater.`);
        setModalLoading(false);
        return;
      }
    }
    // Auto-calculate total
    const total = lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0), 0);
    const purchaseData = { ...values, total };
    try {
      // Save purchase and line items
      let purchase;
      if (editItem) {
        purchase = await updatePurchase(editItem.id, purchaseData);
      } else {
        purchase = await addPurchase(purchaseData);
      }
      // Save line items
      await fetch("/api/purchase-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          lineItems.map((item) => ({
            ...item,
            purchase_id: purchase.id || purchase.data?.id,
            total: (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0),
          }))
        ),
      });
      closeModal();
      toast.success(editItem ? "Purchase updated successfully!" : "Purchase created successfully!");
    } catch (err) {
      setModalError(err.message || "Failed to save purchase");
      toast.error("Failed to save purchase");
    } finally {
      setModalLoading(false);
    }
  };

  // CSV import handler for purchases with line items
  const handleImportPurchases = async (rows) => {
    // Group by purchase_number
    const purchasesMap = {};
    for (const row of rows) {
      const key = row.purchase_number;
      if (!purchasesMap[key]) {
        purchasesMap[key] = {
          purchase: {
            purchase_number: row.purchase_number,
            supplier_id: row.supplier_id,
            warehouse_id: row.warehouse_id,
            date: row.date,
            status: row.status,
            total: row.total,
            notes: row.notes,
          },
          items: [],
        };
      }
      purchasesMap[key].items.push({
        product_id: row.product_id,
        quantity: row.quantity,
        unit_cost: row.unit_cost,
        total: (Number(row.quantity) || 0) * (Number(row.unit_cost) || 0),
      });
    }
    // Save each purchase and its items
    for (const key in purchasesMap) {
      const { purchase, items } = purchasesMap[key];
      let created;
      try {
        created = await addPurchase(purchase);
        await fetch("/api/purchase-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            items.map((item) => ({
              ...item,
              purchase_id: created.id || created.data?.id,
            }))
          ),
        });
      } catch (err) {
        // Continue on error
      }
    }
    fetchPurchases();
  };

  // Expand/collapse handler
  const handleExpandRow = async (purchaseId) => {
    setExpandedRows((prev) =>
      prev.includes(purchaseId)
        ? prev.filter((id) => id !== purchaseId)
        : [...prev, purchaseId]
    );
    // Fetch line items if not already loaded
    if (!rowLineItems[purchaseId]) {
      const res = await fetch(`/api/purchase-items?purchase_id=${purchaseId}`);
      const { data } = await res.json();
      setRowLineItems((prev) => ({ ...prev, [purchaseId]: data || [] }));
    }
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
      <div className="flex flex-1 bg-gray-50 min-h-screen pt-0 md:pt-14">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:cart-outline"
                        className="w-4 h-4 sm:w-6 sm:h-6 text-white"
                      />
                    </div>
                    Purchases
                  </h1>
                  <p className="text-gray-600">
                    Quick purchases for immediate inventory needs
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchPurchases()}
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
                    New Purchase
                  </button>
                </div>
              </div>

              {/* Enhanced Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:cart-check"
                        className="w-5 h-5 text-green-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.total}
                      </div>
                      <div className="text-sm text-gray-500">
                        Total Purchases
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:currency-usd"
                        className="w-5 h-5 text-blue-600"
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

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:trending-up"
                        className="w-5 h-5 text-purple-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        GHS {stats.monthlyValue.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">This Month</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:account-group"
                        className="w-5 h-5 text-orange-600"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.supplierCount}
                      </div>
                      <div className="text-sm text-gray-500">Suppliers</div>
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
                  placeholder="Search purchases by number, supplier, or warehouse..."
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
            {loading && (
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <Icon icon="mdi:loading" className="animate-spin w-5 h-5" />{" "}
                Loading...
              </div>
            )}
            {error && <div className="text-red-600 mb-4">{error}</div>}

            {!loading && !error && filteredPurchases.length === 0 ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                <Icon
                  icon="mdi:cart-off"
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Purchases Found
                </h3>
                <p className="text-gray-500">
                  No purchases match your current filters.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl">
                <GenericTable
                  data={filteredPurchases}
                  columns={[
                    {
                      Header: "",
                      accessor: "expand",
                      render: (row) => (
                        <button
                          onClick={() => handleExpandRow(row.id)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title={
                            expandedRows.includes(row.id)
                              ? "Collapse"
                              : "Expand"
                          }
                        >
                          <Icon
                            icon={
                              expandedRows.includes(row.id)
                                ? "mdi:chevron-up"
                                : "mdi:chevron-down"
                            }
                            className="w-5 h-5"
                          />
                        </button>
                      ),
                    },
                    {
                      Header: "Purchase Number",
                      accessor: "purchase_number",
                      sortable: true,
                    },
                    {
                      Header: "Supplier",
                      accessor: "supplier_name",
                      sortable: true,
                    },
                    {
                      Header: "Warehouse",
                      accessor: "warehouse_name",
                      sortable: true,
                    },
                    {
                      Header: "Date",
                      accessor: "date",
                      sortable: true,
                      render: (row) => new Date(row.date).toLocaleDateString(),
                    },
                    {
                      Header: "Status",
                      accessor: "status",
                      sortable: true,
                      render: (row) => {
                        const statusColors = {
                          pending: "bg-yellow-100 text-yellow-800",
                          completed: "bg-green-100 text-green-800",
                          cancelled: "bg-red-100 text-red-800",
                        };
                        return (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              statusColors[row.status] ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {row.status?.charAt(0).toUpperCase() +
                              row.status?.slice(1)}
                          </span>
                        );
                      },
                    },
                    {
                      Header: "Total",
                      accessor: "total",
                      sortable: true,
                      render: (row) =>
                        `GHS ${(row.total || 0).toLocaleString()}`,
                    },
                    {
                      Header: "Line Items",
                      accessor: "view_items",
                      render: (row) => (
                        <button
                          onClick={async () => {
                            if (!rowLineItems[row.id]) {
                              const res = await fetch(
                                `/api/purchase-items?purchase_id=${row.id}`
                              );
                              const { data } = await res.json();
                              setRowLineItems((prev) => ({
                                ...prev,
                                [row.id]: data || [],
                              }));
                              setViewItemsModal({
                                open: true,
                                items: data || [],
                              });
                            } else {
                              setViewItemsModal({
                                open: true,
                                items: rowLineItems[row.id],
                              });
                            }
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Items"
                        >
                          <Icon icon="mdi:eye-outline" className="w-5 h-5" />
                        </button>
                      ),
                    },
                  ]}
                  onEdit={openEditModal}
                  onDelete={openConfirm}
                  onAddNew={openAddModal}
                  addNewLabel="Add Purchase"
                  title=""
                  emptyMessage="No purchases found"
                  statusOptions={[
                    { value: "pending", label: "Pending" },
                    { value: "completed", label: "Completed" },
                    { value: "cancelled", label: "Cancelled" },
                  ]}
                  onImport={handleImportPurchases}
                  mode={mode}
                  // Custom row rendering for expand/collapse
                  customRowRender={(row, index, defaultRow) => (
                    <>
                      {defaultRow}
                      {expandedRows.includes(row.id) && (
                        <tr className="bg-gray-50 dark:bg-gray-800">
                          <td colSpan={9} className="p-4">
                            <div className="font-semibold mb-2">Line Items</div>
                            <PurchaseItemsEditor
                              items={rowLineItems[row.id] || []}
                              disabled={true}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                />
              </div>
            )}

            <PurchaseModals
              show={showModal}
              onClose={closeModal}
              onSave={handleSave}
              purchase={editItem}
              mode={mode}
              loading={modalLoading}
              error={modalError}
              calculatedTotal={lineItems.reduce(
                (sum, item) =>
                  sum +
                  (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0),
                0
              )}
            >
              <PurchaseItemsEditor
                items={lineItems}
                onChange={setLineItems}
                disabled={modalLoading}
              />
            </PurchaseModals>
            {showConfirm && (
              <SimpleModal
                isOpen={true}
                onClose={closeConfirm}
                title="Confirm Delete"
                mode={mode}
                width="max-w-md"
              >
                <div className="py-6 text-center">
                  <Icon
                    icon="mdi:alert"
                    className="w-12 h-12 text-red-500 mx-auto mb-4"
                  />
                  <div className="text-lg font-semibold mb-2">
                    Are you sure you want to delete purchase{" "}
                    {deleteItem?.purchase_number}?
                  </div>
                  <div className="flex justify-center gap-4 mt-6">
                    <button
                      className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100"
                      onClick={closeConfirm}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                      onClick={handleDelete}
                      disabled={modalLoading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </SimpleModal>
            )}
            {/* View Items Modal */}
            {viewItemsModal.open && (
              <SimpleModal
                isOpen={true}
                onClose={() => setViewItemsModal({ open: false, items: [] })}
                title="Line Items"
                mode={mode}
                width="max-w-2xl"
              >
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon
                        icon="mdi:format-list-bulleted"
                        className="w-6 h-6 text-blue-600"
                      />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">
                        Line Items
                      </div>
                      <div className="text-sm text-gray-500">
                        Details of all products in this purchase
                      </div>
                    </div>
                  </div>
                  {/* Items Table/Card */}
                  {!viewItemsModal.items ||
                  viewItemsModal.items.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-gray-400">
                      <Icon
                        icon="mdi:package-variant"
                        className="w-12 h-12 mb-2"
                      />
                      <div>No line items found</div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm rounded-xl overflow-hidden">
                        <thead>
                          <tr className="bg-blue-50 text-blue-900">
                            <th className="px-4 py-3 text-left font-semibold">
                              Product
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">
                              Quantity
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">
                              Unit Cost
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {viewItemsModal.items.map((item, idx) => {
                            const product = products.find(
                              (p) => p.id === item.product_id
                            );
                            return (
                              <tr
                                key={idx}
                                className="hover:bg-green-50 transition-all"
                              >
                                <td className="px-4 py-3">
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {product?.name ||
                                        item.product_name ||
                                        item.name ||
                                        "Unknown Product"}
                                    </div>
                                    {(product?.sku || item.product_sku) && (
                                      <div className="text-xs text-gray-500">
                                        SKU: {product?.sku || item.product_sku}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  GHS{" "}
                                  {Number(item.unit_cost).toLocaleString(
                                    undefined,
                                    { minimumFractionDigits: 2 }
                                  )}
                                </td>
                                <td className="px-4 py-3 font-semibold text-green-700">
                                  GHS{" "}
                                  {(
                                    (Number(item.quantity) || 0) *
                                    (Number(item.unit_cost) || 0)
                                  ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                  })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </SimpleModal>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 