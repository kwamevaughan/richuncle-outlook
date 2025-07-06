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

export default function PurchasesPage({ mode = "light", toggleMode, ...props }) {
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

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

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
    } catch (err) {
      setModalError(err.message || "Failed to delete purchase");
    } finally {
      setModalLoading(false);
    }
  };

  const handleSave = async (values) => {
    setModalLoading(true);
    setModalError(null);
    try {
      // Save purchase and line items
      let purchase;
      if (editItem) {
        purchase = await updatePurchase(editItem.id, values);
      } else {
        purchase = await addPurchase(values);
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
    } catch (err) {
      setModalError(err.message || "Failed to save purchase");
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
              <Icon icon="mdi:cart-outline" className="w-7 h-7 text-blue-900" />
              Purchases
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Manage your purchases here.
            </p>
            {loading && (
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <Icon icon="mdi:loading" className="animate-spin w-5 h-5" /> Loading...
              </div>
            )}
            {error && <div className="text-red-600 mb-4">{error}</div>}
            <div className="bg-white dark:bg-gray-900 rounded-xl">
              <GenericTable
                data={purchases}
                columns={[
                  { header: "Purchase Number", accessor: "purchase_number", sortable: true },
                  { header: "Supplier", accessor: "supplier_name", sortable: true },
                  { header: "Warehouse", accessor: "warehouse_name", sortable: true },
                  { header: "Date", accessor: "date", sortable: true },
                  { header: "Status", accessor: "status", sortable: true },
                  { header: "Total", accessor: "total", sortable: true, render: (row) => `GHS ${row.total}` },
                ]}
                onEdit={openEditModal}
                onDelete={openConfirm}
                onAddNew={openAddModal}
                addNewLabel="Add Purchase"
                title="Purchases"
                emptyMessage="No purchases found"
                onImport={handleImportPurchases}
                mode={mode}
              />
            </div>
            <PurchaseModals
              show={showModal}
              onClose={closeModal}
              onSave={handleSave}
              purchase={editItem}
              mode={mode}
              loading={modalLoading}
              error={modalError}
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
                    Are you sure you want to delete purchase {deleteItem?.purchase_number}?
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
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 