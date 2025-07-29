import React, { useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Icon } from "@iconify/react";
import useSuppliers from "../hooks/useSuppliers";
import SupplierModals from "../components/SupplierModals";
import { GenericTable } from "../components/GenericTable";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";

export default function SuppliersPage({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  const {
    suppliers,
    loading,
    error,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    fetchSuppliers,
  } = useSuppliers();

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  const openAddModal = () => {
    setEditItem(null);
    setShowModal(true);
    setModalError(null);
  };
  const openEditModal = (item) => {
    setEditItem(item);
    setShowModal(true);
    setModalError(null);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    setModalError(null);
  };

  const handleSave = async (values) => {
    setModalLoading(true);
    setModalError(null);
    try {
      if (editItem) {
        await updateSupplier(editItem.id, values);
      } else {
        await addSupplier(values);
      }
      closeModal();
    } catch (err) {
      setModalError(err.message || "Failed to save supplier");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setModalLoading(true);
    setModalError(null);
    try {
      await deleteSupplier(id);
      closeModal();
    } catch (err) {
      setModalError(err.message || "Failed to delete supplier");
    } finally {
      setModalLoading(false);
    }
  };

  const handleImportSuppliers = async (rows) => {
    let errorCount = 0;
    for (const row of rows) {
      try {
        await addSupplier(row);
      } catch (err) {
        errorCount++;
      }
    }
    await fetchSuppliers();
    if (errorCount > 0) {
      alert(`${errorCount} supplier(s) failed to import.`);
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
      <div className="flex flex-1">
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <Icon
                  icon="mdi:account-group"
                  className="w-4 h-4 sm:w-6 sm:h-6 text-white"
                />
              </div>
              Suppliers
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Manage your suppliers here.
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
                data={suppliers}
                columns={[
                  { Header: "Name", accessor: "name", sortable: true },
                  { Header: "Email", accessor: "email", sortable: true },
                  { Header: "Phone", accessor: "phone", sortable: true },
                  { Header: "Company", accessor: "company", sortable: true },
                  {
                    Header: "Status",
                    accessor: "is_active",
                    sortable: true,
                    render: (row) => (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {row.is_active ? "Active" : "Inactive"}
                      </span>
                    ),
                  },
                  {
                    Header: "Created",
                    accessor: "created_at",
                    sortable: true,
                    render: (row) => (
                      <span>
                        {row.created_at
                          ? new Date(row.created_at).toLocaleDateString()
                          : "-"}
                      </span>
                    ),
                  },
                ]}
                onEdit={openEditModal}
                onAddNew={openAddModal}
                addNewLabel="Add Supplier"
                title="Suppliers"
                emptyMessage="No suppliers found"
                onImport={handleImportSuppliers}
                importType="suppliers"
              />
            </div>
            <SupplierModals
              show={showModal}
              onClose={closeModal}
              onSave={handleSave}
              onDelete={editItem ? handleDelete : undefined}
              supplier={editItem}
              mode={mode}
              loading={modalLoading}
              error={modalError}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 