import React, { useState, useEffect } from "react";
import SimpleModal from "../components/SimpleModal";
import toast from "react-hot-toast";
import { Icon } from "@iconify/react";
import { AddEditModal } from "../components/AddEditModal";
import { GenericTable } from "../components/GenericTable";
import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { useRouter } from "next/router";

export default function BusinessLocationsPage({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState("stores"); // 'stores' or 'warehouses'

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });

  // Data states
  const [stores, setStores] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [storesResponse, warehousesResponse, productsResponse, usersResponse] = await Promise.all([
        fetch('/api/stores'),
        fetch('/api/warehouses'),
        fetch('/api/products'),
        fetch('/api/users')
      ]);
      
      const storesData = await storesResponse.json();
      const warehousesData = await warehousesResponse.json();
      const productsData = await productsResponse.json();
      const usersData = await usersResponse.json();
      
      if (storesData.success && warehousesData.success && productsData.success && usersData.success) {
        // Count products per store and warehouse
        const productCounts = {};
        (productsData.data || []).forEach((row) => {
          if (row.store_id) {
            productCounts[`store_${row.store_id}`] = (productCounts[`store_${row.store_id}`] || 0) + 1;
          }
          if (row.warehouse_id) {
            productCounts[`warehouse_${row.warehouse_id}`] = (productCounts[`warehouse_${row.warehouse_id}`] || 0) + 1;
          }
        });

        // Add product_count to stores
        const storesWithCount = (storesData.data || []).map((store) => ({
          ...store,
          product_count: productCounts[`store_${store.id}`] || 0,
        }));

        // Add product_count to warehouses
        const warehousesWithCount = (warehousesData.data || []).map((warehouse) => ({
          ...warehouse,
          product_count: productCounts[`warehouse_${warehouse.id}`] || 0,
        }));

        setStores(storesWithCount);
        setWarehouses(warehousesWithCount);
        setUsers(usersData.data || []);
      } else {
        setError("Failed to load business locations");
      }
    } catch (err) {
      setError("Failed to load business locations");
    }
    setLoading(false);
  };

  // Initial fetch
  useEffect(() => {
    fetchAllData();
  }, []);

  // Check for add query parameter to open modal
  useEffect(() => {
    if (router.query.add === 'true') {
      openAddModal();
      // Remove the query parameter
      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router.query.add]);

  // Modal helpers
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

  // Store operations
  const handleAddStore = async (newStore) => {
    const response = await fetch('/api/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStore)
    });
    const result = await response.json();
    if (result.success) {
      setStores((prev) => [result.data, ...prev]);
    } else {
      throw new Error(result.error || "Failed to add store");
    }
  };

  const handleUpdateStore = async (id, updatedFields) => {
    const response = await fetch(`/api/stores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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

  const handleDeleteStore = async () => {
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

  // Warehouse operations
  const handleAddWarehouse = async (newWarehouse) => {
    const response = await fetch('/api/warehouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newWarehouse)
    });
    const result = await response.json();
    if (result.success) {
      setWarehouses((prev) => [result.data, ...prev]);
    } else {
      throw new Error(result.error || "Failed to add warehouse");
    }
  };

  const handleUpdateWarehouse = async (id, updatedFields) => {
    const response = await fetch(`/api/warehouses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields)
    });
    const result = await response.json();
    if (result.success) {
      setWarehouses((prev) =>
        prev.map((w) => (w.id === id ? { ...w, ...updatedFields } : w))
      );
    } else {
      throw new Error(result.error || "Failed to update warehouse");
    }
  };

  const handleDeleteWarehouse = async () => {
    try {
      const response = await fetch(`/api/warehouses/${deleteItem.id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        setWarehouses((prev) => prev.filter((w) => w.id !== deleteItem.id));
        closeConfirm();
        toast.success("Warehouse deleted!");
      } else {
        throw new Error(result.error || "Failed to delete warehouse");
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete warehouse");
    }
  };

  // Handle save based on active tab
  const handleSave = async (values) => {
    try {
      if (activeTab === "stores") {
        if (!editItem) {
          await handleAddStore(values);
          toast.success("Store added!");
        } else {
          await handleUpdateStore(editItem.id, values);
          toast.success("Store updated!");
        }
      } else {
        if (!editItem) {
          await handleAddWarehouse(values);
          toast.success("Warehouse added!");
        } else {
          await handleUpdateWarehouse(editItem.id, values);
          toast.success("Warehouse updated!");
        }
      }
      closeModal();
    } catch (err) {
      toast.error(err.message || `Failed to save ${activeTab.slice(0, -1)}`);
    }
  };

  // Handle delete based on active tab
  const handleDelete = async () => {
    if (activeTab === "stores") {
      await handleDeleteStore();
    } else {
      await handleDeleteWarehouse();
    }
  };

  if (userLoading && LoadingComponent) return LoadingComponent;
  if (!user) return null;

  return (
    <MainLayout
      mode={mode}
      user={user}
      toggleMode={toggleMode}
      onLogout={handleLogout}
      {...props}
    >
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                    <Icon
                      icon="mdi:map-marker-multiple"
                      className="w-4 h-4 sm:w-6 sm:h-6 text-white"
                    />
                  </div>
                  Business Locations
                </h1>
                <p className="text-gray-600">
                  Manage your stores and warehouses in one place.
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("stores")}
                  className={`${
                    activeTab === "stores"
                      ? "border-blue-800 text-blue-800"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <Icon icon="mdi:store" className="w-5 h-5" />
                  Stores
                </button>
                <button
                  onClick={() => setActiveTab("warehouses")}
                  className={`${
                    activeTab === "warehouses"
                      ? "border-blue-800 text-blue-800"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <Icon icon="mdi:warehouse" className="w-5 h-5" />
                  Warehouses
                </button>
              </nav>
            </div>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-blue-600 mb-4">
              <Icon icon="mdi:loading" className="animate-spin w-5 h-5" />
              Loading...
            </div>
          )}
          {error && <div className="text-red-600 mb-4">{error}</div>}

          {/* Stores Tab */}
          {activeTab === "stores" && (
            <div className="bg-white dark:bg-gray-900 rounded-xl">
              <GenericTable
                data={stores}
                columns={[
                  { Header: "Store Name", accessor: "name", sortable: true },
                  { Header: "Address", accessor: "address", sortable: true },
                  { Header: "Phone", accessor: "phone", sortable: true },
                  { Header: "Email", accessor: "email", sortable: true },
                  {
                    Header: "Total Products",
                    accessor: "product_count",
                    sortable: false,
                  },
                  {
                    Header: "Status",
                    accessor: "is_active",
                    sortable: true,
                    render: (row) => (
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          row.is_active
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {row.is_active ? "Active" : "Inactive"}
                      </span>
                    ),
                  },
                ]}
                onEdit={openEditModal}
                onDelete={openConfirm}
                onAddNew={openAddModal}
                addNewLabel="Add New Store"
              />
            </div>
          )}

          {/* Warehouses Tab */}
          {activeTab === "warehouses" && (
            <div className="bg-white dark:bg-gray-900 rounded-xl">
              <GenericTable
                data={warehouses}
                columns={[
                  { Header: "Warehouse", accessor: "name", sortable: true },
                  {
                    Header: "Contact Person",
                    accessor: "contact_person",
                    sortable: true,
                    render: (row) => {
                      const user = users.find(
                        (u) => u.id === row.contact_person
                      );
                      return user
                        ? user.full_name
                        : row.contact_person || "Not assigned";
                    },
                  },
                  { Header: "Address", accessor: "address", sortable: true },
                  { Header: "Phone", accessor: "phone", sortable: true },
                  {
                    Header: "Total Products",
                    accessor: "product_count",
                    sortable: false,
                  },
                  {
                    Header: "Status",
                    accessor: "is_active",
                    sortable: true,
                    render: (row) => (
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          row.is_active !== false
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {row.is_active !== false ? "Active" : "Inactive"}
                      </span>
                    ),
                  },
                ]}
                onEdit={openEditModal}
                onDelete={openConfirm}
                onAddNew={openAddModal}
                addNewLabel="Add New Warehouse"
              />
            </div>
          )}

          {/* Add/Edit Modal */}
          {showModal && (
            <AddEditModal
              type={activeTab}
              mode={mode}
              item={editItem}
              categories={[]}
              onClose={closeModal}
              onSave={handleSave}
            />
          )}

          {/* Error Modal */}
          {errorModal.open && (
            <SimpleModal
              isOpen={true}
              onClose={() => setErrorModal({ open: false, message: "" })}
              title={`Duplicate ${
                activeTab.slice(0, -1).charAt(0).toUpperCase() +
                activeTab.slice(0, -1).slice(1)
              }`}
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

          {/* Delete Confirmation Modal */}
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
                  Are you sure you want to delete{" "}
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
    </MainLayout>
  );
} 