import { useState } from "react";
import CategoryImageUpload from "./CategoryImageUpload";
import SimpleModal from "./SimpleModal";
import { Icon } from "@iconify/react";

export function AddEditModal({ type, mode = "light", item, categories, onClose, onSave }) {
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [selectedColor, setSelectedColor] = useState(item?.color || "#3b82f6");
  const [imageUrl, setImageUrl] = useState(item?.image_url || "");
  const [isActive, setIsActive] = useState(item?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Track selected category for subcategories
  const [categoryId, setCategoryId] = useState(item?.category_id || (categories[0]?.id ?? ""));

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
        ...(type === "subcategories" ? { category_id: categoryId } : {}),
      });
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
              <select
                className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                disabled={loading}
              >
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
    </>
  );
} 