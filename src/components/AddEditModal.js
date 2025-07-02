import { useState, useEffect, useRef } from "react";
import CategoryImageUpload from "./CategoryImageUpload";
import SimpleModal from "./SimpleModal";
import { Icon } from "@iconify/react";
import { supabaseClient } from "../lib/supabase";
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { format } from 'date-fns';

export function AddEditModal({ type, mode = "light", item, categories, onClose, onSave }) {
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [code, setCode] = useState(type === "categories" ? (item?.code || "") : "");
  const [symbol, setSymbol] = useState(type === "units" ? (item?.symbol || "") : "");
  const [address, setAddress] = useState((type === "stores" || type === "customers") ? (item?.address || "") : "");
  const [phone, setPhone] = useState((type === "stores" || type === "customers") ? (item?.phone || "") : "");
  const [email, setEmail] = useState((type === "stores" || type === "customers") ? (item?.email || "") : "");
  const [values, setValues] = useState(item?.values ? (Array.isArray(item.values) ? item.values : item.values.split(',').map(v => v.trim()).filter(Boolean)) : []);
  const [valueInput, setValueInput] = useState("");
  const [imageUrl, setImageUrl] = useState(item?.image_url || "");
  const [isActive, setIsActive] = useState(item?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  // Track selected category for subcategories
  const [categoryId, setCategoryId] = useState(item?.category_id || (categories[0]?.id ?? ""));
  const [contactPerson, setContactPerson] = useState(type === "warehouses" ? (item?.contact_person || "") : "");
  const [warehouseEmail, setWarehouseEmail] = useState(type === "warehouses" ? (item?.email || "") : "");
  const [warehouseAddress, setWarehouseAddress] = useState(type === "warehouses" ? (item?.address || "") : "");
  const [usersList, setUsersList] = useState([]);
  const [value, setValue] = useState(item?.value || "");
  const [planId, setPlanId] = useState(item?.plan_id || (categories[0]?.id ?? ""));
  const [dateRange, setDateRange] = useState(() => {
    if (type === 'discounts' && item?.validity && item.validity.includes('to')) {
      const [start, end] = item.validity.split('to').map(s => s.trim());
      return [{ startDate: new Date(start), endDate: new Date(end), key: 'selection' }];
    }
    return [{ startDate: new Date(), endDate: new Date(), key: 'selection' }];
  });
  const [validity, setValidity] = useState(item?.validity || "");

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

  useEffect(() => {
    if (type === "warehouses") {
      supabaseClient
        .from("users")
        .select("id, full_name")
        .then(({ data, error }) => {
          if (!error && data) setUsersList(data);
        });
    }
  }, [type]);

  // Update fields when editing a customer or store and item changes
  useEffect(() => {
    if ((type === "stores" || type === "customers") && item) {
      setAddress(item.address || "");
      setPhone(item.phone || "");
      setEmail(item.email || "");
    }
  }, [item, type]);

  useEffect(() => {
    if (type === 'discounts') {
      setValidity(
        `${format(dateRange[0].startDate, 'yyyy-MM-dd')} to ${format(dateRange[0].endDate, 'yyyy-MM-dd')}`
      );
    }
    // eslint-disable-next-line
  }, [dateRange, type]);

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
    if (type === "discounts") {
      if (!name.trim()) {
        setError("Name is required");
        return;
      }
      if (!value) {
        setError("Value is required");
        return;
      }
      if (!planId) {
        setError("Discount Plan is required");
        return;
      }
      if (!validity) {
        setError("Validity is required");
        return;
      }
    } else if (type === "plans") {
      if (!name.trim()) {
        setError("Plan Name is required");
        return;
      }
    } else if (type === "variant_attributes") {
      if (!name.trim()) {
        setError("Variant is required");
        return;
      }
      if (!values.length) {
        setError("At least one value is required");
        return;
      }
    } else if (type === "units") {
      if (!name.trim()) {
        setError("Unit is required");
        return;
      }
      if (!symbol.trim()) {
        setError("Symbol is required");
        return;
      }
    } else if (type === "stores") {
      if (!name.trim()) {
        setError("Store Name is required");
        return;
      }
      if (!address.trim()) {
        setError("Address is required");
        return;
      }
      if (!phone.trim()) {
        setError("Phone is required");
        return;
      }
      if (!email.trim()) {
        setError("Email is required");
        return;
      }
    } else if (type === "warehouses") {
      if (!name.trim()) {
        setError("Warehouse is required");
        return;
      }
      if (!contactPerson.trim()) {
        setError("Contact Person is required");
        return;
      }
      if (!phone.trim()) {
        setError("Phone is required");
        return;
      }
      if (!warehouseEmail.trim()) {
        setError("Email is required");
        return;
      }
      if (!warehouseAddress.trim()) {
        setError("Address is required");
        return;
      }
    } else if (type === "customers") {
      if (!name.trim()) {
        setError("Name is required");
        return;
      }
      if (!email.trim()) {
        setError("Email is required");
        return;
      }
      if (!phone.trim()) {
        setError("Phone is required");
        return;
      }
      if (!address.trim()) {
        setError("Address is required");
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
      if (type === "discounts") {
        await onSave({
          name: name.trim(),
          value: value,
          plan_id: planId,
          validity: validity,
          is_active: isActive,
        });
      } else if (type === "plans") {
        await onSave({
          name: name.trim(),
          is_active: isActive,
        });
      } else {
        await onSave({
          name: name.trim(),
          ...(type === "variant_attributes" ? { values: values.join(",") } : {}),
          ...(type === "units" ? { symbol: symbol.trim() } : {}),
          ...(type === "stores" ? { 
            address: address.trim(),
            phone: phone.trim(),
            email: email.trim()
          } : {}),
          ...(type === "warehouses" ? {
            contact_person: contactPerson.trim(),
            phone: phone.trim(),
            email: warehouseEmail.trim(),
            address: warehouseAddress.trim(),
          } : {}),
          ...(type === "customers" ? {
            email: email.trim(),
            phone: phone.trim(),
            address: address.trim(),
          } : {}),
          ...(type !== "units" && type !== "stores" && type !== "warehouses" && type !== "customers" ? { description: description.trim() } : {}),
          ...(type === "categories" ? { code: code.trim() } : {}),
          image_url: imageUrl,
          is_active: isActive,
          ...(type === "subcategories" ? { category_id: categoryId } : {}),
        });
      }
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
    units: "Unit",
    stores: "Store",
    warehouses: "Warehouse",
    customers: "Customer",
    discounts: "Discount",
    plans: "Discount Plan",
  }[type] || "Item";

  // Custom modal title for discounts
  const modalTitle = type === "discounts"
    ? `${item ? "Edit" : "Add"} Discount`
    : `${item ? "Edit" : "Add New"} ${typeLabel}`;

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
          {type === "discounts" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Name<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  placeholder="Discount name"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Value<span className="text-red-500">*</span></label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  disabled={loading}
                  placeholder="Discount value (e.g. 10, 20)"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Discount Plan<span className="text-red-500">*</span></label>
                <select
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={planId}
                  onChange={e => setPlanId(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select a plan</option>
                  {categories.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Validity<span className="text-red-500">*</span></label>
                <DateRange
                  editableDateInputs={true}
                  onChange={item => setDateRange([item.selection])}
                  moveRangeOnFirstSelection={false}
                  ranges={dateRange}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                  rangeColors={["#2563eb"]}
                  disabled={loading}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {`Selected: ${format(dateRange[0].startDate, 'yyyy-MM-dd')} to ${format(dateRange[0].endDate, 'yyyy-MM-dd')}`}
                </div>
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
            </>
          ) : type === "plans" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Plan Name<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  placeholder="Plan name"
                />
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
            </>
          ) : type === "variant_attributes" ? (
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
          ) : type === "units" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Unit<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  placeholder="e.g. Kilogram, Meter, Liter"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Symbol<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. kg, m, L"
                />
              </div>
            </>
          ) : type === "stores" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Store Name<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  placeholder="e.g. Main Store, Downtown Branch"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Address<span className="text-red-500">*</span></label>
                <textarea
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  disabled={loading}
                  placeholder="Enter store address"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Phone<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. +1-555-123-4567"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Email<span className="text-red-500">*</span></label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. store@example.com"
                />
              </div>
            </>
          ) : type === "customers" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Name<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Email<span className="text-red-500">*</span></label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. john@example.com"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Phone<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. +1-555-123-4567"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Address<span className="text-red-500">*</span></label>
                <textarea
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  disabled={loading}
                  placeholder="Enter address"
                  rows={2}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Profile Picture</label>
                <CategoryImageUpload value={imageUrl} onChange={setImageUrl} folder="ProfilePictures" userName={name} referralCode={email} />
              </div>
            </>
          ) : type === "warehouses" ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Warehouse<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  placeholder="e.g. Main Warehouse, Central Depot"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Contact Person<span className="text-red-500">*</span></label>
                <select
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select a user</option>
                  {usersList.map((user) => (
                    <option key={user.id} value={user.id}>{user.full_name || user.id}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Phone<span className="text-red-500">*</span></label>
                <input
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. +1-555-123-4567"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Email<span className="text-red-500">*</span></label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={warehouseEmail}
                  onChange={e => setWarehouseEmail(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. warehouse@example.com"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Address<span className="text-red-500">*</span></label>
                <textarea
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  value={warehouseAddress}
                  onChange={e => setWarehouseAddress(e.target.value)}
                  disabled={loading}
                  placeholder="Enter warehouse address"
                  rows={3}
                />
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
          {/* Only show the generic Active checkbox if not discounts or plans, since those already render it in their custom block */}
          {(type !== "discounts" && type !== "plans") && (
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
          )}
          {/* Only show the image field for types that are not discounts or plans */}
          {type !== "variant_attributes" && type !== "units" && type !== "stores" && type !== "warehouses" && type !== "customers" && type !== "discounts" && type !== "plans" && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">Image</label>
              <CategoryImageUpload value={imageUrl} onChange={setImageUrl} />
            </div>
          )}
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