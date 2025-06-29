import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import CategoryDragDrop from "../components/CategoryDragDrop";
import CategoryInlineEdit from "../components/CategoryInlineEdit";
import CategoryCSVExport from "../components/CategoryCSVExport";
import CategoryImageUpload from "../components/CategoryImageUpload";
import SimpleModal from "../components/SimpleModal";
import { supabaseClient } from "../lib/supabase";
import toast from "react-hot-toast";

function useTable(data, defaultSort = "sort_order") {
  const [sortKey, setSortKey] = useState(defaultSort);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selected, setSelected] = useState([]);

  // Sorting
  const sorted = [...data].sort((a, b) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];
    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const total = sorted.length;
  const totalPages = Math.ceil(total / pageSize);
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  // Selection
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const selectAll = () => {
    if (paged.every((row) => selected.includes(row.id))) {
      setSelected((prev) => prev.filter((id) => !paged.some((row) => row.id === id)));
    } else {
      setSelected((prev) => [
        ...prev,
        ...paged.filter((row) => !prev.includes(row.id)).map((row) => row.id),
      ]);
    }
  };

  // Sorting handler
  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Pagination handler
  const handlePage = (newPage) => {
    setPage(newPage);
  };

  return {
    paged,
    total,
    totalPages,
    page,
    pageSize,
    setPageSize,
    handlePage,
    sortKey,
    sortDir,
    handleSort,
    selected,
    toggleSelect,
    selectAll,
    setSelected,
    sorted,
    setSorted: () => {},
  };
}

function CategoryPage({ mode = "light" }) {
  const [tab, setTab] = useState("categories");
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [editItem, setEditItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });

  // Fetch categories and subcategories from Supabase
  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      supabaseClient.from("categories").select("*").order("sort_order", { ascending: true }),
      supabaseClient.from("subcategories").select("*"),
    ])
      .then(([catRes, subRes]) => {
        if (catRes.error) throw catRes.error;
        if (subRes.error) throw subRes.error;
        setCategories(catRes.data || []);
        setSubCategories(subRes.data || []);
      })
      .catch((err) => {
        setError(err.message || "Failed to load data");
      })
      .finally(() => setLoading(false));
  }, []);

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
        const { error } = await supabaseClient.from("categories").delete().eq("id", deleteItem.id);
        if (error) throw error;
        setCategories((prev) => prev.filter((c) => c.id !== deleteItem.id));
      } else {
        const { error } = await supabaseClient.from("subcategories").delete().eq("id", deleteItem.id);
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
  const handleReorderCategories = async (paged, fromIdx, toIdx, page, pageSize) => {
    // Compute the new order
    const newList = reorderFullList(categories, paged, fromIdx, toIdx, page, pageSize);
    // Update sort_order for all
    const updated = newList.map((cat, idx) => ({ ...cat, sort_order: idx }));
    console.log('New drag order:', updated.map(c => ({ id: c.id, name: c.name, sort_order: c.sort_order })));
    // Persist to DB and then re-fetch
    await persistCategoryOrder(updated);
    await fetchCategories();
  };

  // Fetch categories helper
  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabaseClient.from("categories").select("*").order("sort_order", { ascending: true });
    if (!error) {
      setCategories(data || []);
      console.log('Fetched categories:', (data || []).map(c => ({ id: c.id, name: c.name, sort_order: c.sort_order })));
    }
    setLoading(false);
  };

  const persistCategoryOrder = async (categories) => {
    try {
      // Batch update all categories' sort_order in Supabase
      for (const cat of categories) {
        console.log('Updating category:', cat.id, 'sort_order:', cat.sort_order);
        const { error } = await supabaseClient.from('categories').update({ sort_order: cat.sort_order }).eq('id', cat.id);
        if (error) console.error('Update error for', cat.id, error);
      }
      toast.success('Order updated!');
      // Refetch from DB to ensure UI matches DB
      console.log('Order update complete, refetching categories...');
    } catch (err) {
      console.error('Failed to update order', err);
      toast.error('Failed to update order');
    }
  };

  // Inline edit handlers
  const handleInlineEditCategory = (id, key, value) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, [key]: value } : cat))
    );
  };
  const handleInlineEditSubCategory = (id, key, value) => {
    setSubCategories((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, [key]: value } : sub))
    );
  };

  // Add a helper to add a new category
  const handleAddCategory = async (newCategory) => {
    const { data, error } = await supabaseClient.from("categories").insert([newCategory]).select();
    if (error) throw error;
    // Prepend or append the new category to the list
    setCategories((prev) => [data[0], ...prev]);
  };

  // Add a helper to update a category
  const handleUpdateCategory = async (id, updatedFields) => {
    const { data, error } = await supabaseClient.from("categories").update(updatedFields).eq("id", id).select();
    if (error) throw error;
    setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, ...updatedFields } : cat)));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Icon icon="mdi:folder-outline" className="w-7 h-7 text-blue-600" />
        Category Management
      </h1>
      {loading && (
        <div className="flex items-center gap-2 text-blue-600 mb-4">
          <Icon icon="mdi:loading" className="animate-spin w-5 h-5" /> Loading...
        </div>
      )}
      {error && (
        <div className="text-red-600 mb-4">{error}</div>
      )}
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
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          placeholder={`Search ${tab === "categories" ? "categories" : "sub categories"}...`}
          className="border rounded-lg px-3 py-2 w-64 focus:ring-2 focus:ring-blue-400 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2">
          <CategoryCSVExport
            data={tab === "categories" ? categories : subCategories}
            filename={tab === "categories" ? "categories.csv" : "subcategories.csv"}
          />
          <button
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-all"
            onClick={() => openAddModal(tab)}
          >
            <Icon icon="mdi:plus" className="w-5 h-5" />
            Add New {tab === "categories" ? "Category" : "Sub Category"}
          </button>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4">
        {tab === "categories" ? (
          <CategoryTable
            data={filteredCategories}
            onEdit={(item) => openEditModal("categories", item)}
            onDelete={openConfirm}
            onReorder={(paged, fromIdx, toIdx) => handleReorderCategories(paged, fromIdx, toIdx, tab.page, tab.pageSize)}
            onInlineEdit={handleInlineEditCategory}
          />
        ) : (
          <SubCategoryTable
            data={filteredSubCategories}
            categories={categories}
            onEdit={(item) => openEditModal("subcategories", item)}
            onDelete={openConfirm}
            onReorder={(paged, fromIdx, toIdx) => handleReorderCategories(paged, fromIdx, toIdx, tab.page, tab.pageSize)}
            onInlineEdit={handleInlineEditSubCategory}
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
                if (err.code === "23505" || (err.message && err.message.toLowerCase().includes("duplicate"))) {
                  setErrorModal({ open: true, message: "A category with this name already exists." });
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
                if (err.code === "23505" || (err.message && err.message.toLowerCase().includes("duplicate"))) {
                  setErrorModal({ open: true, message: "A category with this name already exists." });
                } else {
                  alert(err.message || "Failed to update category");
                }
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
            <Icon icon="mdi:alert-circle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <div className="text-lg font-semibold mb-2">{errorModal.message}</div>
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
            <Icon icon="mdi:alert" className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <div className="text-lg font-semibold mb-2">
              Are you sure you want to delete <span className="font-semibold">{deleteItem?.name}</span>?
            </div>
            <div className="flex justify-center gap-4 mt-6">
              <button
                className="px-6 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100"
                onClick={closeConfirm}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </SimpleModal>
      )}
    </div>
  );
}

function CategoryTable({ data, onEdit, onDelete, onReorder, onInlineEdit }) {
  const table = useTable(data);
  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          checked={table.paged.length > 0 && table.paged.every((row) => table.selected.includes(row.id))}
          onChange={table.selectAll}
        />
        <span className="text-xs">Select All</span>
        {table.selected.length > 0 && (
          <span className="ml-2 text-xs text-blue-600">{table.selected.length} selected</span>
        )}
        {table.selected.length > 0 && (
          <button className="ml-4 px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 text-xs">
            <Icon icon="mdi:delete" className="inline w-4 h-4 mr-1" /> Delete Selected
          </button>
        )}
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            <th className="px-2 py-2"></th>
            <th className="px-4 py-2">
              <input
                type="checkbox"
                checked={table.paged.length > 0 && table.paged.every((row) => table.selected.includes(row.id))}
                onChange={table.selectAll}
              />
            </th>
            <th className="px-4 py-2 text-left cursor-pointer" onClick={() => table.handleSort("name")}>Name {table.sortKey === "name" && (table.sortDir === "asc" ? "▲" : "▼")}</th>
            <th className="px-4 py-2 text-left">Color</th>
            <th className="px-4 py-2 text-left cursor-pointer" onClick={() => table.handleSort("description")}>Description</th>
            <th className="px-4 py-2 text-left cursor-pointer" onClick={() => table.handleSort("is_active")}>Status</th>
            <th className="px-4 py-2 text-left">Image</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <CategoryDragDrop
          items={table.paged}
          onReorder={(paged, fromIdx, toIdx) => onReorder(paged, fromIdx, toIdx, table.page, table.pageSize)}
        >
          {(cat) => [
            <td key="select" className="px-4 py-2">
              <input
                type="checkbox"
                checked={table.selected.includes(cat.id)}
                onChange={() => table.toggleSelect(cat.id)}
              />
            </td>,
            <td key="name" className="px-4 py-2 font-semibold">
              <CategoryInlineEdit value={cat.name} onSave={(val) => onInlineEdit(cat.id, "name", val)} />
            </td>,
            <td key="color" className="px-4 py-2">
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block w-4 h-4 rounded-full border border-gray-300 align-middle"
                  style={{ backgroundColor: cat.color || "#e5e7eb" }}
                  title={cat.color}
                ></span>
                <span className="text-xs text-gray-500">{cat.color}</span>
              </span>
            </td>,
            <td key="desc" className="px-4 py-2">
              <CategoryInlineEdit value={cat.description} onSave={(val) => onInlineEdit(cat.id, "description", val)} type="textarea" />
            </td>,
            <td key="status" className="px-4 py-2">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${cat.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300"}`}>{cat.is_active ? "Active" : "Inactive"}</span>
            </td>,
            <td key="img" className="px-4 py-2">
              <img src={cat.image_url} alt={cat.name} className="w-10 h-10 rounded object-cover border dark:border-gray-700" />
            </td>,
            <td key="actions" className="px-4 py-2 flex gap-2">
              <button className="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900" onClick={() => onEdit(cat)}>
                <Icon icon="mdi:pencil" className="w-5 h-5 text-blue-600" />
              </button>
              <button className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900" onClick={() => onDelete(cat)}>
                <Icon icon="mdi:delete" className="w-5 h-5 text-red-500" />
              </button>
            </td>
          ]}
        </CategoryDragDrop>
      </table>
      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <span className="text-xs">Rows per page:</span>
          <select
            className="border rounded px-2 py-1 text-xs dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
            value={table.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 rounded disabled:opacity-50"
            onClick={() => table.handlePage(Math.max(1, table.page - 1))}
            disabled={table.page === 1}
          >
            <Icon icon="mdi:chevron-left" className="w-4 h-4" />
          </button>
          <span className="text-xs">
            Page {table.page} of {table.totalPages}
          </span>
          <button
            className="px-2 py-1 rounded disabled:opacity-50"
            onClick={() => table.handlePage(Math.min(table.totalPages, table.page + 1))}
            disabled={table.page === table.totalPages}
          >
            <Icon icon="mdi:chevron-right" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SubCategoryTable({ data, categories, onEdit, onDelete, onReorder, onInlineEdit }) {
  const table = useTable(data);
  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          checked={table.paged.length > 0 && table.paged.every((row) => table.selected.includes(row.id))}
          onChange={table.selectAll}
        />
        <span className="text-xs">Select All</span>
        {table.selected.length > 0 && (
          <span className="ml-2 text-xs text-blue-600">{table.selected.length} selected</span>
        )}
        {table.selected.length > 0 && (
          <button className="ml-4 px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 text-xs">
            <Icon icon="mdi:delete" className="inline w-4 h-4 mr-1" /> Delete Selected
          </button>
        )}
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            <th className="px-2 py-2"></th>
            <th className="px-4 py-2">
              <input
                type="checkbox"
                checked={table.paged.length > 0 && table.paged.every((row) => table.selected.includes(row.id))}
                onChange={table.selectAll}
              />
            </th>
            <th className="px-4 py-2 text-left cursor-pointer" onClick={() => table.handleSort("name")}>Name {table.sortKey === "name" && (table.sortDir === "asc" ? "▲" : "▼")}</th>
            <th className="px-4 py-2 text-left cursor-pointer" onClick={() => table.handleSort("category_name")}>Category</th>
            <th className="px-4 py-2 text-left cursor-pointer" onClick={() => table.handleSort("description")}>Description</th>
            <th className="px-4 py-2 text-left cursor-pointer" onClick={() => table.handleSort("is_active")}>Status</th>
            <th className="px-4 py-2 text-left">Image</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <CategoryDragDrop
          items={table.paged}
          onReorder={(paged, fromIdx, toIdx) => onReorder(paged, fromIdx, toIdx, table.page, table.pageSize)}
        >
          {(sub) => [
            <td key="select" className="px-4 py-2">
              <input
                type="checkbox"
                checked={table.selected.includes(sub.id)}
                onChange={() => table.toggleSelect(sub.id)}
              />
            </td>,
            <td key="name" className="px-4 py-2 font-semibold">
              <CategoryInlineEdit value={sub.name} onSave={(val) => onInlineEdit(sub.id, "name", val)} />
            </td>,
            <td key="cat" className="px-4 py-2">
              {categories.find((c) => c.id === sub.category_id)?.name || "-"}
            </td>,
            <td key="desc" className="px-4 py-2">
              <CategoryInlineEdit value={sub.description} onSave={(val) => onInlineEdit(sub.id, "description", val)} type="textarea" />
            </td>,
            <td key="status" className="px-4 py-2">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${sub.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300"}`}>{sub.is_active ? "Active" : "Inactive"}</span>
            </td>,
            <td key="img" className="px-4 py-2">
              <img src={sub.image_url} alt={sub.name} className="w-10 h-10 rounded object-cover border dark:border-gray-700" />
            </td>,
            <td key="actions" className="px-4 py-2 flex gap-2">
              <button className="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900" onClick={() => onEdit(sub)}>
                <Icon icon="mdi:pencil" className="w-5 h-5 text-blue-600" />
              </button>
              <button className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900" onClick={() => onDelete(sub)}>
                <Icon icon="mdi:delete" className="w-5 h-5 text-red-500" />
              </button>
            </td>
          ]}
        </CategoryDragDrop>
      </table>
      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <span className="text-xs">Rows per page:</span>
          <select
            className="border rounded px-2 py-1 text-xs dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
            value={table.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 rounded disabled:opacity-50"
            onClick={() => table.handlePage(Math.max(1, table.page - 1))}
            disabled={table.page === 1}
          >
            <Icon icon="mdi:chevron-left" className="w-4 h-4" />
          </button>
          <span className="text-xs">
            Page {table.page} of {table.totalPages}
          </span>
          <button
            className="px-2 py-1 rounded disabled:opacity-50"
            onClick={() => table.handlePage(Math.min(table.totalPages, table.page + 1))}
            disabled={table.page === table.totalPages}
          >
            <Icon icon="mdi:chevron-right" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddEditModal({ type, mode = "light", item, categories, onClose, onSave }) {
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [selectedColor, setSelectedColor] = useState(item?.color || "#3b82f6");
  const [imageUrl, setImageUrl] = useState(item?.image_url || "");
  const [isActive, setIsActive] = useState(item?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        color: selectedColor,
        image_url: imageUrl,
        is_active: isActive,
      });
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SimpleModal
      isOpen={true}
      onClose={onClose}
      title={`${type === "categories" ? (item ? "Edit" : "Add New") : (item ? "Edit" : "Add New")}
        ${type === "categories" ? "Category" : "Sub Category"}`}
      mode={mode}
      width="max-w-md"
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Name</label>
          <input
            className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>
        {type === "categories" && (
          <div className="mb-4">
            <label className="block mb-1 font-medium">Color</label>
            <input
              type="color"
              value={selectedColor}
              onChange={e => setSelectedColor(e.target.value)}
              className="w-12 h-12 p-0 border-0 bg-transparent cursor-pointer"
              disabled={loading}
              aria-label="Pick a color"
            />
          </div>
        )}
        {type === "subcategories" && (
          <div className="mb-4">
            <label className="block mb-1 font-medium">Category</label>
            <select className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700" disabled={loading}>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Image</label>
          <CategoryImageUpload value={imageUrl} onChange={setImageUrl} />
        </div>
        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            className="form-checkbox"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
            disabled={loading}
          />
          <span className="text-sm">Active</span>
        </div>
        {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2" disabled={loading}>
            {loading && <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />} Save
          </button>
        </div>
      </form>
    </SimpleModal>
  );
}

function reorderFullList(fullList, pagedList, fromIdx, toIdx, page, pageSize) {
  // Find the global indices
  const globalFrom = (page - 1) * pageSize + fromIdx;
  const globalTo = (page - 1) * pageSize + toIdx;
  const newList = [...fullList];
  const [moved] = newList.splice(globalFrom, 1);
  newList.splice(globalTo, 0, moved);
  return newList;
}

export default CategoryPage; 