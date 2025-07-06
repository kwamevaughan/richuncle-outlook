import React, { useState, useEffect } from "react";
import SimpleModal from "./SimpleModal";
import { Icon } from "@iconify/react";

export default function SupplierModals({
  show,
  onClose,
  onSave,
  onDelete,
  supplier,
  mode = "light",
  loading = false,
  error = null,
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    company: "",
    is_active: true,
  });

  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        company: supplier.company || "",
        is_active: supplier.is_active ?? true,
      });
    } else {
      setForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        company: "",
        is_active: true,
      });
    }
  }, [supplier, show]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) onSave(form);
  };

  return (
    <SimpleModal
      isOpen={show}
      onClose={onClose}
      title={supplier ? "Edit Supplier" : "Add Supplier"}
      mode={mode}
      width="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
            disabled={loading}
            placeholder="Supplier Name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            disabled={loading}
            placeholder="Email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            disabled={loading}
            placeholder="Phone"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            disabled={loading}
            placeholder="Address"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Company</label>
          <input
            name="company"
            value={form.company}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            disabled={loading}
            placeholder="Company"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
            disabled={loading}
          />
          <label className="ml-2 block text-sm">Active</label>
        </div>
        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          {onDelete && supplier && (
            <button
              type="button"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={() => onDelete(supplier.id)}
              disabled={loading}
            >
              Delete
            </button>
          )}
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Saving..." : supplier ? "Update" : "Add"}
          </button>
        </div>
      </form>
    </SimpleModal>
  );
} 