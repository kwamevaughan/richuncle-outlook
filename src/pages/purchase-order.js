import React, { useState, useEffect } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Icon } from "@iconify/react";
import usePurchaseOrders from "../hooks/usePurchaseOrders";
import PurchaseOrderModals from "../components/PurchaseOrderModals";
import { GenericTable } from "../components/GenericTable";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import PurchaseOrderItemsEditor from "../components/PurchaseOrderItemsEditor";

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
    } catch (err) {
      setModalError(err.message || "Failed to save purchase order");
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
    } catch (err) {
      setModalError(err.message || "Failed to delete purchase order");
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
      <div className="flex flex-1">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Icon icon="solar:copy-broken" className="w-7 h-7 text-blue-900" />
              Purchase Orders
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Manage your purchase orders here.
            </p>
            {loading && (
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <Icon icon="mdi:loading" className="animate-spin w-5 h-5" /> Loading...
              </div>
            )}
            {error && <div className="text-red-600 mb-4">{error}</div>}
            <div className="bg-white dark:bg-gray-900 rounded-xl">
              <GenericTable
                data={purchaseOrders}
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
                  { header: "Date", accessor: "date", sortable: true },
                  { header: "Status", accessor: "status", sortable: true },
                  { header: "Total", accessor: "total", sortable: true, render: (row) => `GHS ${row.total}` },
                ]}
                onEdit={openEditModal}
                onAddNew={openAddModal}
                addNewLabel="Add Purchase Order"
                title="Purchase Orders"
                emptyMessage="No purchase orders found"
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