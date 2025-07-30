import React, { useState, useEffect } from "react";
import CategoryCSVExport from "../components/CategoryCSVExport";
import SimpleModal from "../components/SimpleModal";
import toast from "react-hot-toast";
import Header from "../layouts/header";
import Sidebar from "../layouts/sidebar";
import useSidebar from "../hooks/useSidebar";
import { useRouter } from "next/router";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import Footer from "../layouts/footer";
import { Icon } from "@iconify/react";
import { AddEditModal } from "../components/AddEditModal";
import { GenericTable } from "../components/GenericTable";
import MainLayout from "@/layouts/MainLayout";

export default function UnitsPage({ mode = "light", toggleMode, ...props }) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });
  const { isSidebarOpen, toggleSidebar, isMobile, windowWidth } = useSidebar();
  const router = useRouter();
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();

  // Units state
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch units
  const fetchUnits = async () => {
    setLoading(true);
    try {
      const [unitsResponse, productsResponse] = await Promise.all([
        fetch('/api/units'),
        fetch('/api/products')
      ]);
      
      const unitsData = await unitsResponse.json();
      const productsData = await productsResponse.json();
      
      if (unitsData.success && productsData.success) {
        // Count products per unit in JS
        const productCounts = {};
        (productsData.data || []).forEach((row) => {
          if (row.unit_id) {
            productCounts[row.unit_id] = (productCounts[row.unit_id] || 0) + 1;
          }
        });
        // Add product_count to each unit
        const unitsWithCount = (unitsData.data || []).map((unit) => ({
          ...unit,
          product_count: productCounts[unit.id] || 0,
        }));
        setUnits(unitsWithCount);
      } else {
        setError("Failed to load units");
      }
    } catch (err) {
      setError("Failed to load units");
    }
    setLoading(false);
  };

  // Initial fetch
  useEffect(() => {
    fetchUnits();
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
      const response = await fetch(`/api/units/${deleteItem.id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        setUnits((prev) => prev.filter((u) => u.id !== deleteItem.id));
        closeConfirm();
        toast.success("Unit deleted!");
      } else {
        throw new Error(result.error || "Failed to delete unit");
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete unit");
    }
  };

  // Add a helper to add a new unit
  const handleAddUnit = async (newUnit) => {
    const response = await fetch('/api/units', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newUnit)
    });
    const result = await response.json();
    if (result.success) {
      setUnits((prev) => [result.data, ...prev]);
    } else {
      throw new Error(result.error || "Failed to add unit");
    }
  };

  // Add a helper to update a unit
  const handleUpdateUnit = async (id, updatedFields) => {
    const response = await fetch(`/api/units/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedFields)
    });
    const result = await response.json();
    if (result.success) {
      setUnits((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...updatedFields } : u))
      );
    } else {
      throw new Error(result.error || "Failed to update unit");
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
        <div
          className={`flex-1 p-4 md:p-6 lg:p-8 transition-all ${
            isSidebarOpen && !isMobile ? "ml-0" : "ml-0"
          }`}
        >
          <div className="max-w-7xl mx-auto">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <Icon
                  icon="mdi:ruler"
                  className="w-4 h-4 sm:w-6 sm:h-6 text-white"
                />
              </div>
              Units Management
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Manage your product units here.
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
                data={units}
                columns={[
                  { Header: "Unit Name", accessor: "name", sortable: true },
                  { Header: "Symbol", accessor: "symbol", sortable: true },
                  {
                    Header: "No of Products",
                    accessor: "product_count",
                    sortable: false,
                    render: (row) => row.product_count || "0",
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
                addNewLabel="Add New Unit"
              />
            </div>

            {showModal && (
              <AddEditModal
                type="units"
                mode={mode}
                item={editItem}
                categories={[]}
                onClose={closeModal}
                onSave={async (values) => {
                  try {
                    if (!editItem) {
                      await handleAddUnit(values);
                      toast.success("Unit added!");
                      closeModal();
                    } else {
                      await handleUpdateUnit(editItem.id, values);
                      toast.success("Unit updated!");
                      closeModal();
                    }
                  } catch (err) {
                    toast.error(err.message || "Failed to save unit");
                  }
                }}
              />
            )}
            {errorModal.open && (
              <SimpleModal
                isOpen={true}
                onClose={() => setErrorModal({ open: false, message: "" })}
                title="Duplicate Unit"
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
      </div>
    </MainLayout>
  );
} 