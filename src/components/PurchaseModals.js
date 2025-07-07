import React, { useState, useEffect } from "react";
import SimpleModal from "./SimpleModal";
import { Icon } from "@iconify/react";

export default function PurchaseModals({
  show,
  onClose,
  onSave,
  purchase,
  mode = "light",
  loading = false,
  error = null,
  calculatedTotal = 0,
  children,
}) {
  const [form, setForm] = useState({
    supplier_id: "",
    warehouse_id: "",
    date: "",
    status: "Pending",
    total: "",
    notes: "",
  });
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);

  useEffect(() => {
    setSuppliersLoading(true);
    fetch("/api/suppliers")
      .then((res) => res.json())
      .then(({ data }) => setSuppliers(data || []))
      .catch(() => setSuppliers([]))
      .finally(() => setSuppliersLoading(false));
    setWarehousesLoading(true);
    fetch("/api/warehouses")
      .then((res) => res.json())
      .then(({ data }) => setWarehouses(data || []))
      .catch(() => setWarehouses([]))
      .finally(() => setWarehousesLoading(false));
  }, []);

  useEffect(() => {
    if (purchase) {
      setForm({
        supplier_id: purchase.supplier_id || "",
        warehouse_id: purchase.warehouse_id || "",
        date: purchase.date || "",
        status: purchase.status || "Pending",
        total: purchase.total || "",
        notes: purchase.notes || "",
      });
    } else {
      setForm({
        supplier_id: "",
        warehouse_id: "",
        date: "",
        status: "Pending",
        total: "",
        notes: "",
      });
    }
  }, [purchase, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) onSave(form);
  };

  return (
    <SimpleModal
      isOpen={show}
      onClose={onClose}
      title={purchase ? "Edit Purchase" : "Add Purchase"}
      mode={mode}
      width="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Supplier *</label>
            <select
              name="supplier_id"
              value={form.supplier_id}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={loading || suppliersLoading}
            >
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Warehouse *</label>
            <select
              name="warehouse_id"
              value={form.warehouse_id}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={loading || warehousesLoading}
            >
              <option value="">Select warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Date *</label>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={loading}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Status *</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
              disabled={loading}
            >
              <option value="Pending">Pending</option>
              <option value="Received">Received</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Total *</label>
          <input
            name="total"
            type="number"
            min="0"
            step="0.01"
            value={calculatedTotal}
            readOnly
            className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
            required
            disabled={true}
            placeholder="Total Amount"
          />
          <div className="text-xs text-gray-500 mt-1">Total is auto-calculated from line items.</div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            rows={2}
            disabled={loading}
            placeholder="Notes (optional)"
          />
        </div>
        {children}
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
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Saving..." : purchase ? "Update" : "Add"}
          </button>
        </div>
      </form>
    </SimpleModal>
  );
} 