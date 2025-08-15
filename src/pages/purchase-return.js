import React, { useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Icon } from "@iconify/react";
import usePurchaseReturns from "../hooks/usePurchaseReturns";
import PurchaseReturnModals from "../components/PurchaseReturnModals";
import { GenericTable } from "../components/GenericTable";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import PurchaseReturnItemsEditor from "../components/PurchaseReturnItemsEditor";

export default function PurchaseReturnPage({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  const {
    purchaseReturns,
    loading,
    error,
    addPurchaseReturn,
    updatePurchaseReturn,
    deletePurchaseReturn,
    fetchPurchaseReturns,
  } = usePurchaseReturns();

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
    fetch(`/api/purchase-return-items?purchase_return_id=${item.id}`)
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
      let ret;
      if (editItem) {
        ret = await updatePurchaseReturn(editItem.id, values);
      } else {
        ret = await addPurchaseReturn(values);
      }
      // Save line items
      await fetch("/api/purchase-return-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          (items || lineItems).map((item) => ({
            ...item,
            purchase_return_id: ret.id || ret.data?.id,
            total: (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0),
          }))
        ),
      });
      closeModal();
    } catch (err) {
      setModalError(err.message || "Failed to save purchase return");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setModalLoading(true);
    setModalError(null);
    try {
      await fetch("/api/purchase-return-items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchase_return_id: id }),
      });
      await deletePurchaseReturn(id);
      closeModal();
    } catch (err) {
      setModalError(err.message || "Failed to delete purchase return");
    } finally {
      setModalLoading(false);
    }
  };

  // Expand/collapse handler
  const handleExpandRow = async (returnId) => {
    setExpandedRows((prev) =>
      prev.includes(returnId)
        ? prev.filter((id) => id !== returnId)
        : [...prev, returnId]
    );
    if (!rowLineItems[returnId]) {
      const res = await fetch(`/api/purchase-return-items?purchase_return_id=${returnId}`);
      const { data } = await res.json();
      setRowLineItems((prev) => ({ ...prev, [returnId]: data || [] }));
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
      <div className="flex flex-1 pt-0 md:pt-14">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <Icon
                  icon="mdi:undo-variant"
                  className="w-4 h-4 sm:w-6 sm:h-6 text-white"
                />
              </div>
              Purchase Returns
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Manage your purchase returns here.
            </p>
            {loading && (
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <Icon icon="mdi:loading" className="animate-spin w-5 h-5" />{" "}
                Loading...
              </div>
            )}
            {error && <div className="text-red-600 mb-4">{error}</div>}
            <div className="bg-white dark:bg-gray-900 rounded-xl">
              <GenericTable
                data={purchaseReturns}
                columns={[
                  {
                    Header: "",
                    accessor: "expand",
                    render: (row) => (
                      <button
                        onClick={() => handleExpandRow(row.id)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title={
                          expandedRows.includes(row.id) ? "Collapse" : "Expand"
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
                    Header: "Return Number",
                    accessor: "return_number",
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
                  { Header: "Date", accessor: "date", sortable: true },
                  { Header: "Status", accessor: "status", sortable: true },
                  {
                    Header: "Total",
                    accessor: "total",
                    sortable: true,
                    render: (row) => `GHS ${row.total}`,
                  },
                ]}
                onEdit={openEditModal}
                onAddNew={openAddModal}
                addNewLabel="Add Purchase Return"
                emptyMessage="No purchase returns found"
                statusOptions={[
                  { value: "Pending", label: "Pending" },
                  { value: "Approved", label: "Approved" },
                  { value: "Returned", label: "Returned" },
                  { value: "Cancelled", label: "Cancelled" },
                ]}
                customRowRender={(row, index, defaultRow) => (
                  <>
                    {defaultRow}
                    {expandedRows.includes(row.id) && (
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <td colSpan={8} className="p-4">
                          <div className="font-semibold mb-2">Line Items</div>
                          <PurchaseReturnItemsEditor
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
            <PurchaseReturnModals
              show={showModal}
              onClose={closeModal}
              onSave={handleSave}
              onDelete={editItem ? handleDelete : undefined}
              purchaseReturn={editItem}
              mode={mode}
              loading={modalLoading}
              error={modalError}
            >
              <PurchaseReturnItemsEditor
                items={lineItems}
                onChange={setLineItems}
                disabled={modalLoading}
              />
            </PurchaseReturnModals>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 