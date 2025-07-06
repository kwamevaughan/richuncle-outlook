import React, { useState, useEffect } from "react";
import CategoryCSVExport from "../components/CategoryCSVExport";
import SimpleModal from "../components/SimpleModal";
import toast from "react-hot-toast";
import HrHeader from "../layouts/hrHeader";
import HrSidebar from "../layouts/hrSidebar";
import useSidebar from "../hooks/useSidebar";
import { useRouter } from "next/router";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import SimpleFooter from "../layouts/simpleFooter";
import { Icon } from "@iconify/react";
import { AddEditModal } from "../components/AddEditModal";
import { GenericTable } from "../components/GenericTable";
import MainLayout from "@/layouts/MainLayout";
import ErrorBoundary from "../components/ErrorBoundary";

export default function StoresPage({ mode = "light", toggleMode, ...props }) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });
  const { isSidebarOpen, toggleSidebar, isMobile, windowWidth } = useSidebar();
  const router = useRouter();
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();

  // Stores state
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stores
  const fetchStores = async () => {
    setLoading(true);
    try {
      const [storesResponse, productsResponse] = await Promise.all([
        fetch('/api/stores'),
        fetch('/api/products')
      ]);
      
      const storesData = await storesResponse.json();
      const productsData = await productsResponse.json();
      
      if (storesData.success && productsData.success) {
        // Count products per store in JS
        const productCounts = {};
        (productsData.data || []).forEach((row) => {
          if (row.store_id) {
            productCounts[row.store_id] = (productCounts[row.store_id] || 0) + 1;
          }
        });
        // Add product_count to each store
        const storesWithCount = (storesData.data || []).map((store) => ({
          ...store,
          product_count: productCounts[store.id] || 0,
        }));
        setStores(storesWithCount);
      } else {
        setError("Failed to load stores");
      }
    } catch (err) {
      setError("Failed to load stores");
    }
    setLoading(false);
  };

  // Initial fetch
  useEffect(() => {
    fetchStores();
  }, []);

  // Modal open/close helpers
  const openAddModal = () => {
    setEditItem(null);
    setShowModal(true);
  };
  const openEditModal = (item) => {
    setEditItem(item);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
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
    try {
      const response = await fetch(`/api/stores/${deleteItem.id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        setStores((prev) => prev.filter((s) => s.id !== deleteItem.id));
        closeConfirm();
        toast.success("Store deleted!");
      } else {
        throw new Error(result.error || "Failed to delete store");
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete store");
    }
  };

  // Add a helper to add a new store
  const handleAddStore = async (newStore) => {
    const response = await fetch('/api/stores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newStore)
    });
    const result = await response.json();
    if (result.success) {
      setStores((prev) => [result.data, ...prev]);
    } else {
      throw new Error(result.error || "Failed to add store");
    }
  };

  // Add a helper to update a store
  const handleUpdateStore = async (id, updatedFields) => {
    const response = await fetch(`/api/stores/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedFields)
    });
    const result = await response.json();
    if (result.success) {
      setStores((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updatedFields } : s))
      );
    } else {
      throw new Error(result.error || "Failed to update store");
    }
  };

  if (userLoading && LoadingComponent) return LoadingComponent;
  if (!user || windowWidth === null) {
    router.push("/");
    return null;
  }

  return (
    <MainLayout mode={mode} user={user} toggleMode={toggleMode} onLogout={handleLogout} {...props}>
      <div className="flex flex-1">
        <div
          className={`flex-1 p-4 md:p-6 lg:p-8 transition-all`}
        >
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Icon icon="mdi:store" className="w-7 h-7 text-blue-900" />
              Store Management
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Manage your stores here.
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
                data={stores}
                columns={[
                  { header: "Store Name", accessor: "name", sortable: true },
                  { header: "Address", accessor: "address", sortable: true },
                  { header: "Phone", accessor: "phone", sortable: true },
                  { header: "Email", accessor: "email", sortable: true },
                  { header: "Total Products", accessor: "product_count", sortable: false },
                  { header: "Status", accessor: "is_active", sortable: true, render: (row) => (
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${row.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300"}`}>
                      {row.is_active ? "Active" : "Inactive"}
                    </span>
                  ) },
                ]}
                onEdit={openEditModal}
                onDelete={openConfirm}
                onAddNew={openAddModal}
                addNewLabel="Add New Store"
              />
            </div>

            {showModal && (
              <AddEditModal
                type="stores"
                mode={mode}
                item={editItem}
                categories={[]}
                onClose={closeModal}
                onSave={async (values) => {
                  try {
                    if (!editItem) {
                      await handleAddStore(values);
                      toast.success("Store added!");
                      closeModal();
                    } else {
                      await handleUpdateStore(editItem.id, values);
                      toast.success("Store updated!");
                      closeModal();
                    }
                  } catch (err) {
                    toast.error(err.message || "Failed to save store");
                  }
                }}
              />
            )}
            {errorModal.open && (
              <SimpleModal
                isOpen={true}
                onClose={() => setErrorModal({ open: false, message: "" })}
                title="Duplicate Store"
                mode={mode}
                width="max-w-md"
              >
                <div className="py-6 text-center">
                  <Icon
                    icon="mdi:alert-circle"
                    className="w-12 h-12 text-red-500 mx-auto mb-4"
                  />
                  <div className="text-lg font-semibold mb-2">
                    {errorModal.message}
                  </div>
                  <button
                    className="mt-4 px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => setErrorModal({ open: false, message: "" })}
                  >
                    Close
                  </button>
                </div>
              </SimpleModal>
            )}
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
                    Are you sure you want to delete {" "}
                    <span className="font-semibold">{deleteItem?.name}</span>?
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