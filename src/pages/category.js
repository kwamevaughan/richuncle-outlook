import { useState } from "react";
import CategoryCSVExport from "../components/CategoryCSVExport";
import SimpleModal from "../components/SimpleModal";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { Icon } from "@iconify/react";
import { useCategories } from "../hooks/useCategories";
import { AddEditModal } from "../components/AddEditModal";
import { reorderFullList } from "../utils/categoryUtils";
import { GenericTable } from "../components/GenericTable";
import MainLayout from "@/layouts/MainLayout";

export default function CategoryPage({ mode = "light", toggleMode, ...props }) {
  const [tab, setTab] = useState("categories");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [editItem, setEditItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });
  const router = useRouter();
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();

  // Use the custom hook for categories and subcategories
  const {
    categories,
    setCategories,
    subCategories,
    setSubCategories,
    loading,
    error,
  } = useCategories();

  // Filtered data
  const filteredCategories = categories.filter((cat) =>
    cat.name?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredSubCategories = subCategories.filter((sub) =>
    sub.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Modal open/close helpers
  const openAddModal = (type) => {
    setModalType("add");
    setEditItem(null);
    setShowModal(true);
  };
  const openEditModal = (type, item) => {
    setModalType("edit");
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
      if (tab === "categories") {
        const response = await fetch('/api/categories');
        const { data, error } = await response.json();
        if (error) throw error;
        setCategories(data || []);
      } else {
        const response = await fetch('/api/subcategories');
        const { data, error } = await response.json();
        if (error) throw error;
        setSubCategories(data || []);
      }
      closeConfirm();
      toast.success("Category deleted!");
    } catch (err) {
      toast.error(err.message || "Failed to delete category");
    }
  };
  // Drag-and-drop reorder
  const handleReorderCategories = async (
    paged,
    fromIdx,
    toIdx,
    page,
    pageSize
  ) => {
    console.log("handleReorderCategories:", {
      paged,
      fromIdx,
      toIdx,
      page,
      pageSize,
      categories,
    });
    // Compute the new order
    const newList = reorderFullList(
      categories,
      paged,
      fromIdx,
      toIdx,
      page,
      pageSize
    );
    // Update sort_order for all
    const updated = newList.map((cat, idx) => ({ ...cat, sort_order: idx }));
    console.log(
      "New drag order:",
      updated.map((c) => ({ id: c.id, name: c.name, sort_order: c.sort_order }))
    );
    // Persist to DB and then re-fetch
    await persistCategoryOrder(updated);
    await fetchCategories();
  };

  // Fetch categories helper
  const fetchCategories = async () => {
    const response = await fetch('/api/categories');
    const { data, error } = await response.json();
    console.log("fetchCategories - response:", { data, error });
    if (!error) {
      setCategories(data || []);
      console.log(
        "Fetched categories:",
        (data || []).map((c) => ({
          id: c.id,
          name: c.name,
          sort_order: c.sort_order,
        }))
      );
    } else {
      console.error("fetchCategories - error:", error);
    }
  };

  const persistCategoryOrder = async (categories) => {
    try {
      // Log what will be updated
      console.log("persistCategoryOrder - sending categories:", categories);
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categories),
      });
      const { data, error } = await response.json();
      console.log("persistCategoryOrder - response:", { data, error });
      if (error) {
        console.error("Batch update error:", error);
        toast.error("Failed to update order");
      } else {
        toast.success("Order updated!");
      }
    } catch (err) {
      console.error("Failed to update order", err);
      toast.error("Failed to update order");
    }
  };

  // Add a helper to add a new category
  const handleAddCategory = async (newCategory) => {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([newCategory]),
    });
    const { data, error } = await response.json();
    if (error) throw error;
    // Prepend or append the new category to the list
    setCategories((prev) => [data[0], ...prev]);
  };

  // Add a helper to update a category
  const handleUpdateCategory = async (id, updatedFields) => {
    const response = await fetch('/api/categories', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ id, ...updatedFields }]),
    });
    const { data, error } = await response.json();
    if (error) throw error;
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...updatedFields } : cat))
    );
  };

  // Add a helper to add a new subcategory
  const handleAddSubCategory = async (newSubCategory) => {
    const response = await fetch('/api/subcategories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([newSubCategory]),
    });
    const { data, error } = await response.json();
    if (error) throw error;
    setSubCategories((prev) => [data[0], ...prev]);
  };

  // Add a helper to update a subcategory
  const handleUpdateSubCategory = async (id, updatedFields) => {
    const response = await fetch('/api/subcategories', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ id, ...updatedFields }]),
    });
    const { data, error } = await response.json();
    if (error) throw error;
    setSubCategories((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, ...updatedFields } : sub))
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
                  icon="mdi:folder-outline"
                  className="w-4 h-4 sm:w-6 sm:h-6 text-white"
                />
              </div>
              Categories
            </h1>

            <p className="text-sm text-gray-500 mb-6">
              Manage your shop categories and subcategories here.
            </p>

            {loading && (
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <Icon icon="mdi:loading" className="animate-spin w-5 h-5" />{" "}
                Loading...
              </div>
            )}
            {error && <div className="text-red-600 mb-4">{error}</div>}
            <div className="flex gap-2 mb-4">
              <button
                className={`px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 border-b-2 focus:outline-none ${
                  tab === "categories"
                    ? "border-blue-500 text-blue-600 bg-white dark:bg-gray-900"
                    : "border-transparent text-gray-500 bg-gray-50 dark:bg-gray-800"
                }`}
                onClick={() => setTab("categories")}
              >
                Categories
              </button>
              <button
                className={`px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 border-b-2 focus:outline-none ${
                  tab === "subcategories"
                    ? "border-blue-500 text-blue-600 bg-white dark:bg-gray-900"
                    : "border-transparent text-gray-500 bg-gray-50 dark:bg-gray-800"
                }`}
                onClick={() => setTab("subcategories")}
              >
                Sub Categories
              </button>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl">
              {tab === "categories" ? (
                <GenericTable
                  data={filteredCategories}
                  columns={[
                    {
                      Header: "Name",
                      accessor: "name",
                      sortable: true,
                      render: (row) => (
                        <span className="flex items-center gap-2">
                          {row.image_url && (
                            <img
                              src={row.image_url}
                              alt={row.name}
                              width={32}
                              height={32}
                              className="rounded object-cover border w-8 h-8"
                            />
                          )}
                          <span>{row.name}</span>
                        </span>
                      ),
                    },
                    {
                      Header: "Category Code",
                      accessor: "code",
                      sortable: true,
                    },
                    {
                      Header: "Description",
                      accessor: "description",
                      sortable: true,
                    },
                    {
                      Header: "No Of Products",
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
                  onEdit={(item) => openEditModal("categories", item)}
                  onDelete={openConfirm}
                  onReorder={handleReorderCategories}
                  enableDragDrop={true}
                  onAddNew={() => openAddModal("categories")}
                  addNewLabel="Add New Category"
                />
              ) : (
                <GenericTable
                  data={filteredSubCategories}
                  columns={[
                    { Header: "Name", accessor: "name", sortable: true },
                    {
                      Header: "Category",
                      accessor: "category_id",
                      sortable: false,
                      render: (row) =>
                        categories.find((c) => c.id === row.category_id)
                          ?.name || "-",
                    },
                    {
                      Header: "Description",
                      accessor: "description",
                      sortable: true,
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
                    { Header: "Image", accessor: "image_url", type: "image" },
                  ]}
                  onEdit={(item) => openEditModal("subcategories", item)}
                  onDelete={openConfirm}
                  onReorder={handleReorderCategories}
                  enableDragDrop={true}
                  onAddNew={() => openAddModal("subcategories")}
                  addNewLabel="Add New Sub Category"
                />
              )}
            </div>
            {showModal && (
              <AddEditModal
                type={tab}
                mode={mode}
                item={editItem}
                categories={categories}
                onClose={closeModal}
                onSave={async (values) => {
                  if (tab === "categories" && !editItem) {
                    try {
                      await handleAddCategory(values);
                      toast.success("Category added!");
                      closeModal();
                    } catch (err) {
                      if (
                        err.code === "23505" ||
                        (err.message &&
                          err.message.toLowerCase().includes("duplicate"))
                      ) {
                        setErrorModal({
                          open: true,
                          message: "A category with this name already exists.",
                        });
                      } else {
                        alert(err.message || "Failed to add category");
                      }
                    }
                  } else if (tab === "categories" && editItem) {
                    try {
                      await handleUpdateCategory(editItem.id, values);
                      toast.success("Category updated!");
                      closeModal();
                    } catch (err) {
                      if (
                        err.code === "23505" ||
                        (err.message &&
                          err.message.toLowerCase().includes("duplicate"))
                      ) {
                        setErrorModal({
                          open: true,
                          message: "A category with this name already exists.",
                        });
                      } else {
                        alert(err.message || "Failed to update category");
                      }
                    }
                  } else if (tab === "subcategories" && !editItem) {
                    try {
                      await handleAddSubCategory(values);
                      toast.success("Subcategory added!");
                      closeModal();
                    } catch (err) {
                      alert(err.message || "Failed to add subcategory");
                    }
                  } else if (tab === "subcategories" && editItem) {
                    try {
                      await handleUpdateSubCategory(editItem.id, values);
                      toast.success("Subcategory updated!");
                      closeModal();
                    } catch (err) {
                      alert(err.message || "Failed to update subcategory");
                    }
                  } else {
                    closeModal();
                  }
                }}
              />
            )}
            {errorModal.open && (
              <SimpleModal
                isOpen={true}
                onClose={() => setErrorModal({ open: false, message: "" })}
                title="Duplicate Category"
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
                    className="mt-4 px-6 py-2 rounded bg-blue-600 text-white bg-blue-700"
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

