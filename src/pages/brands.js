import React, { useState, useEffect } from "react";
import CategoryCSVExport from "../components/CategoryCSVExport";
import SimpleModal from "../components/SimpleModal";
import { supabaseClient } from "../lib/supabase";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { Icon } from "@iconify/react";
import { AddEditModal } from "../components/AddEditModal";
import { GenericTable } from "../components/GenericTable";
import MainLayout from "@/layouts/MainLayout";
import ErrorBoundary from "../components/ErrorBoundary";

export default function BrandsPage({ mode = "light", toggleMode, ...props }) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });
  const router = useRouter();
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();

  // Brands state
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch brands
  const fetchBrands = async () => {
    setLoading(true);
    const { data: brandsData, error: brandsError } = await supabaseClient
      .from("brands")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: productsData, error: productsError } = await supabaseClient
      .from("products")
      .select("brand_id");
    if (!brandsError && !productsError) {
      // Count products per brand in JS
      const productCounts = {};
      (productsData || []).forEach((row) => {
        if (row.brand_id) {
          productCounts[row.brand_id] = (productCounts[row.brand_id] || 0) + 1;
        }
      });
      // Add product_count to each brand
      const brandsWithCount = (brandsData || []).map((brand) => ({
        ...brand,
        product_count: productCounts[brand.id] || 0,
      }));
      setBrands(brandsWithCount);
    } else {
      setError((brandsError || productsError).message || "Failed to load brands");
    }
    setLoading(false);
  };

  // Initial fetch
  useEffect(() => {
    fetchBrands();
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
      const { error } = await supabaseClient
        .from("brands")
        .delete()
        .eq("id", deleteItem.id);
      if (error) throw error;
      setBrands((prev) => prev.filter((b) => b.id !== deleteItem.id));
      closeConfirm();
      toast.success("Brand deleted!");
    } catch (err) {
      toast.error(err.message || "Failed to delete brand");
    }
  };

  // Add a helper to add a new brand
  const handleAddBrand = async (newBrand) => {
    const { data, error } = await supabaseClient
      .from("brands")
      .insert([newBrand])
      .select();
    if (error) throw error;
    setBrands((prev) => [data[0], ...prev]);
  };

  // Add a helper to update a brand
  const handleUpdateBrand = async (id, updatedFields) => {
    const { data, error } = await supabaseClient
      .from("brands")
      .update(updatedFields)
      .eq("id", id)
      .select();
    if (error) throw error;
    setBrands((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updatedFields } : b))
    );
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
              <Icon icon="mdi:tag" className="w-7 h-7 text-blue-900" />
              Brand Management
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Manage your shop brands here.
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
                data={brands}
                columns={[
                  { header: "Name", accessor: "name", sortable: true },
                  { header: "No Of Products", accessor: "product_count", sortable: false },
                  { header: "Status", accessor: "is_active", sortable: true, render: (row) => (
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${row.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300"}`}>
                      {row.is_active ? "Active" : "Inactive"}
                    </span>
                  ) },
                ]}
                onEdit={openEditModal}
                onDelete={openConfirm}
                onAddNew={openAddModal}
                addNewLabel="Add New Brand"
              />
            </div>

            {showModal && (
              <AddEditModal
                type="brands"
                mode={mode}
                item={editItem}
                categories={[]}
                onClose={closeModal}
                onSave={async (values) => {
                  try {
                    if (!editItem) {
                      await handleAddBrand(values);
                      toast.success("Brand added!");
                      closeModal();
                    } else {
                      await handleUpdateBrand(editItem.id, values);
                      toast.success("Brand updated!");
                      closeModal();
                    }
                  } catch (err) {
                    toast.error(err.message || "Failed to save brand");
                  }
                }}
              />
            )}
            {errorModal.open && (
              <SimpleModal
                isOpen={true}
                onClose={() => setErrorModal({ open: false, message: "" })}
                title="Duplicate Brand"
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