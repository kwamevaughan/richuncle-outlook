import { useState } from "react";
import CategoryCSVExport from "../components/CategoryCSVExport";
import SimpleModal from "../components/SimpleModal";
import { supabaseClient } from "../lib/supabase";
import toast from "react-hot-toast";
import HrHeader from "../layouts/hrHeader";
import HrSidebar from "../layouts/hrSidebar";
import useSidebar from "../hooks/useSidebar";
import { useRouter } from "next/router";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import SimpleFooter from "../layouts/simpleFooter";
import { Icon } from "@iconify/react";
import { useCategories } from "../hooks/useCategories";
import { AddEditModal } from "../components/AddEditModal";
import { reorderFullList } from "../utils/categoryUtils";
import { GenericTable } from "../components/GenericTable";

export default function CategoryPage({ mode = "light", toggleMode }) {
  const [tab, setTab] = useState("categories");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [editItem, setEditItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });
  const { isSidebarOpen, toggleSidebar, isMobile, windowWidth } = useSidebar();
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
        const { error } = await supabaseClient
          .from("categories")
          .delete()
          .eq("id", deleteItem.id);
        if (error) throw error;
        setCategories((prev) => prev.filter((c) => c.id !== deleteItem.id));
      } else {
        const { error } = await supabaseClient
          .from("subcategories")
          .delete()
          .eq("id", deleteItem.id);
        if (error) throw error;
        setSubCategories((prev) => prev.filter((s) => s.id !== deleteItem.id));
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
    const { data, error } = await supabaseClient
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
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
      const { data, error } = await supabaseClient
        .from("categories")
        .upsert(categories, { onConflict: "id" });
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
    const { data, error } = await supabaseClient
      .from("categories")
      .insert([newCategory])
      .select();
    if (error) throw error;
    // Prepend or append the new category to the list
    setCategories((prev) => [data[0], ...prev]);
  };

  // Add a helper to update a category
  const handleUpdateCategory = async (id, updatedFields) => {
    const { data, error } = await supabaseClient
      .from("categories")
      .update(updatedFields)
      .eq("id", id)
      .select();
    if (error) throw error;
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...updatedFields } : cat))
    );
  };

  // Add a helper to add a new subcategory
  const handleAddSubCategory = async (newSubCategory) => {
    const { data, error } = await supabaseClient
      .from("subcategories")
      .insert([newSubCategory])
      .select();
    if (error) throw error;
    setSubCategories((prev) => [data[0], ...prev]);
  };

  // Add a helper to update a subcategory
  const handleUpdateSubCategory = async (id, updatedFields) => {
    const { data, error } = await supabaseClient
      .from("subcategories")
      .update(updatedFields)
      .eq("id", id)
      .select();
    if (error) throw error;
    setSubCategories((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, ...updatedFields } : sub))
    );
  };
    
      if (userLoading && LoadingComponent) return LoadingComponent;
      if (!user || windowWidth === null) {
        router.push("/");
        return null;
      }

    return (
      <div
        key={`dashboard-${user?.id}-${mode}`}
        className={`min-h-screen flex flex-col ${
          mode === "dark" ? "bg-gray-900 text-white" : " text-gray-900"
        }`}
      >
        <HrHeader
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          user={user}
          mode={mode}
          toggleMode={toggleMode}
          onLogout={handleLogout}
        />
        <div className="flex flex-1">
          <HrSidebar
            isOpen={isSidebarOpen}
            user={user}
            mode={mode}
            toggleSidebar={toggleSidebar}
            onLogout={handleLogout}
            toggleMode={toggleMode}
          />
          <div
            className={`flex-1 p-4 md:p-6 lg:p-8 transition-all ${
              isSidebarOpen && !isMobile ? "ml-60" : "ml-0"
            }`}
          >
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Icon icon="mdi:format-list-bulleted" className="w-7 h-7 text-blue-900" />
                Category Management
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
                      { header: "Name", accessor: "name", sortable: true },
                      { header: "Category Code", accessor: "code", sortable: true },
                      { header: "Description", accessor: "description", sortable: true },
                      {
                        header: "Status",
                        accessor: "is_active",
                        sortable: true,
                        render: (row) => (
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${row.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300"}`}>
                            {row.is_active ? "Active" : "Inactive"}
                          </span>
                        ),
                      },
                      { header: "Image", accessor: "image_url", type: "image" },
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
                      { header: "Name", accessor: "name", sortable: true },
                      {
                        header: "Category",
                        accessor: "category_id",
                        sortable: false,
                        render: (row) => categories.find((c) => c.id === row.category_id)?.name || "-",
                      },
                      { header: "Description", accessor: "description", sortable: true },
                      {
                        header: "Status",
                        accessor: "is_active",
                        sortable: true,
                        render: (row) => (
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${row.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300"}`}>
                            {row.is_active ? "Active" : "Inactive"}
                          </span>
                        ),
                      },
                      { header: "Image", accessor: "image_url", type: "image" },
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
                            message:
                              "A category with this name already exists.",
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
                            message:
                              "A category with this name already exists.",
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
                      className="mt-4 px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                      onClick={() =>
                        setErrorModal({ open: false, message: "" })
                      }
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
            <SimpleFooter mode={mode} isSidebarOpen={isSidebarOpen} />
          </div>
        </div>
      </div>
    );
}

