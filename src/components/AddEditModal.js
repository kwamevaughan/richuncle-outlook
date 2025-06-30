import { useState, useEffect, useRef } from "react";
import CategoryImageUpload from "./CategoryImageUpload";
import SimpleModal from "./SimpleModal";
import { Icon } from "@iconify/react";

export function AddEditModal({ type, mode = "light", item, categories, onClose, onSave }) {
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [code, setCode] = useState(type === "categories" ? (item?.code || "") : "");
  const [values, setValues] = useState(item?.values ? (Array.isArray(item.values) ? item.values : item.values.split(',').map(v => v.trim()).filter(Boolean)) : []);
  const [valueInput, setValueInput] = useState("");
  const [imageUrl, setImageUrl] = useState(item?.image_url || "");
  const [isActive, setIsActive] = useState(item?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  // Track selected category for subcategories
  const [categoryId, setCategoryId] = useState(item?.category_id || (categories[0]?.id ?? ""));

  // Helper to generate a code suggestion
  function suggestCategoryCode(name, existingCodes) {
    if (!name) return "";
    const words = name.trim().split(/\s+/);
    let base = "";
    if (words.length === 1) {
      base = words[0].substring(0, 5).toUpperCase();
    } else {
      base = words.map(w => w[0].toUpperCase()).join("").substring(0, 5);
    }
    let suggestion = base;
    let suffix = 1;
    const codesSet = new Set(existingCodes.map(c => c.toUpperCase()));
    while (codesSet.has(suggestion)) {
      suggestion = base + suffix;
      suffix++;
    }
    return suggestion;
  }

  // Suggest a code from name if user hasn't manually edited code and type is categories
  useEffect(() => {
    if (type === "categories" && !item && !codeManuallyEdited) {
      const existingCodes = categories.map(cat => cat.code || "");
      const suggested = suggestCategoryCode(name, existingCodes);
      setCode(suggested);
    }
    // eslint-disable-next-line
  }, [name, type, item, categories, codeManuallyEdited]);

  const handleCodeChange = (e) => {
    setCode(e.target.value.toUpperCase());
    setCodeManuallyEdited(true);
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (codeManuallyEdited && e.target.value === "") {
      setCodeManuallyEdited(false);
    }
  };

  const handleValueInputKeyDown = (e) => {
    if ((e.key === "," || e.key === "Enter") && valueInput.trim()) {
      e.preventDefault();
      if (!values.includes(valueInput.trim())) {
        setValues([...values, valueInput.trim()]);
      }
      setValueInput("");
    }
  };

  const handleRemoveValue = (val) => {
    setValues(values.filter((v) => v !== val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (type === "variant_attributes") {
      if (!name.trim()) {
        setError("Variant is required");
        return;
      }
      if (!values.length) {
        setError("At least one value is required");
        return;
      }
    } else {
      if (!name.trim()) {
        setError("Name is required");
        return;
      }
    }
    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        ...(type === "variant_attributes" ? { values: values.join(",") } : {}),
        description: description.trim(),
        ...(type === "categories" ? { code: code.trim() } : {}),
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

  // Helper to get entity label for modal title
  const typeLabel = {
    categories: "Category",
    subcategories: "Sub Category",
    brands: "Brand",
  }[type] || "Item";

  const modalTitle = `${item ? "Edit" : "Add New"} ${typeLabel}`;

  return (
    <>
      <SimpleModal
        isOpen={true}
        onClose={onClose}
        title={modalTitle}
        mode={mode}
        width="max-w-md"
      >
        <form onSubmit={handleSubmit}>
          {type === "variant_attributes" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Variant<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  placeholder="e.g. Color, Size, Material"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Values<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={valueInput}
                  onChange={e => setValueInput(e.target.value)}
                  onKeyDown={handleValueInputKeyDown}
                  disabled={loading}
                  placeholder="Type a value and press comma or Enter"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {values.map((val, idx) => (
                    <span key={val + idx} className="inline-flex items-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                      {val}
                      <button
                        type="button"
                        className="ml-1 text-blue-500 hover:text-red-500 focus:outline-none"
                        onClick={() => handleRemoveValue(val)}
                        tabIndex={-1}
                        aria-label={`Remove ${val}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-400 mt-1">Enter value separated by comma</div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Name</label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
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
            </>
          )}
          {type === "categories" && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">Category Code</label>
              <input
                className="w-full border rounded px-3 py-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                value={code}
                onChange={handleCodeChange}
                disabled={loading}
                maxLength={10}
                placeholder="e.g. TSHIR, FS, DJ, ACC"
              />
              <div className="text-xs text-gray-400 mt-1">Short, unique code for this category (e.g. TSHIR, FS, DJ, ACC)</div>
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
          {type !== "variant_attributes" && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">Image</label>
              <CategoryImageUpload value={imageUrl} onChange={setImageUrl} />
            </div>
          )}
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