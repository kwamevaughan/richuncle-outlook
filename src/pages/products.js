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
import Image from "next/image";
import ViewProductModal from "../components/ViewProductModal";

export default function ProductsPage({ mode = "light", toggleMode, ...props }) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });
  const router = useRouter();
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();

  // Products state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View modal state
  const [viewItem, setViewItem] = useState(null);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    const selectString = "*, category:categories!products_category_id_fkey(name), brand:brands!brand_id(name), unit:units!unit_id(name)";
    console.log("[fetchProducts] select:", selectString);
    const { data, error } = await supabaseClient
      .from("products")
      .select(selectString)
      .order("created_at", { ascending: false });
    console.log("[fetchProducts] data:", data);
    console.log("[fetchProducts] error:", error);
    if (!error) {
      setProducts((data || []).map(p => ({
        ...p,
        category_name: p.category?.name || "",
        brand_name: p.brand?.name || "",
        unit_name: p.unit?.name || "",
      })));
    } else {
      setError(error.message || "Failed to load products");
    }
    setLoading(false);
  };

  // Initial fetch
  useEffect(() => {
    fetchProducts();
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
        .from("products")
        .delete()
        .eq("id", deleteItem.id);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== deleteItem.id));
      closeConfirm();
      toast.success("Product deleted!");
    } catch (err) {
      toast.error(err.message || "Failed to delete product");
    }
  };

  // Add a helper to add a new product
  const handleAddProduct = async (newProduct) => {
    // Insert the product
    const { data, error } = await supabaseClient
      .from("products")
      .insert([newProduct])
      .select();
    if (error) throw error;
    const inserted = data[0];
    // Fetch the full product row with joins
    const selectString = "*, category:categories!products_category_id_fkey(name), brand:brands!brand_id(name), unit:units!unit_id(name)";
    const { data: fullData, error: fetchError } = await supabaseClient
      .from("products")
      .select(selectString)
      .eq("id", inserted.id)
      .single();
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
    const { data, error } = await supabaseClient
      .from("products")
      .update(updatedFields)
      .eq("id", id)
      .select();
    if (error) throw error;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p))
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
              <Icon icon="mdi:package-variant" className="w-7 h-7 text-blue-900" />
              Product Management
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Manage your shop products here.
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
                data={products}
                columns={[
                  { header: "SKU", accessor: "sku", sortable: true },
                  { header: "Product Name", accessor: "name", sortable: true, render: (row) => (
                    <span className="flex items-center gap-2">
                      {row.image_url && (
                        <Image src={row.image_url} alt={row.name} width={32} height={32} className="rounded object-cover border w-8 h-8" />
                      )}
                      <span>{row.name}</span>
                    </span>
                  )},
                  { header: "Category", accessor: "category_id", sortable: false, render: (row) => row.category_name || "-" },
                  { header: "Brand", accessor: "brand_id", sortable: false, render: (row) => row.brand_name || "-" },
                  { header: "Selling Price", accessor: "price", sortable: true, render: (row) => `GHS ${row.price}` },
                  { header: "Cost Price", accessor: "cost_price", sortable: true, render: (row) => `GHS ${row.cost_price || 0}` },
                  { header: "Tax Type", accessor: "tax_type", sortable: true, render: (row) => (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      row.tax_type === 'inclusive' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {row.tax_type === 'inclusive' ? 'Inclusive' : 'Exclusive'}
                    </span>
                  )},
                  { header: "Tax %", accessor: "tax_percentage", sortable: true, render: (row) => `${row.tax_percentage || 0}%` },
                  { header: "Unit", accessor: "unit_id", sortable: false, render: (row) => row.unit_name || "-" },
                  { header: "Qty", accessor: "quantity", sortable: true },
                ]}
                onEdit={openEditModal}
                onDelete={openConfirm}
                onAddNew={openAddModal}
                addNewLabel="Add New Product"
                actions={[
                  {
                    label: 'View',
                    icon: 'mdi:eye-outline',
                    onClick: (item) => setViewItem(item)
                  }
                ]}
              />
            </div>

            {showModal && (
              <AddEditModal
                type="products"
                mode={mode}
                item={editItem}
                categories={[]}
                onClose={closeModal}
                onSave={async (values) => {
                  try {
                    if (!editItem) {
                      await handleAddProduct(values);
                      toast.success("Product added!");
                      closeModal();
                    } else {
                      await handleUpdateProduct(editItem.id, values);
                      toast.success("Product updated!");
                      closeModal();
                    }
                  } catch (err) {
                    toast.error(err.message || "Failed to save product");
                  }
                }}
              />
            )}
            {errorModal.open && (
              <SimpleModal
                isOpen={true}
                onClose={() => setErrorModal({ open: false, message: "" })}
                title="Duplicate Product"
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
            {viewItem && (
              <ViewProductModal
                product={viewItem}
                isOpen={!!viewItem}
                onClose={() => setViewItem(null)}
                mode={mode}
              />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 