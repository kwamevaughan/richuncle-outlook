import React, { useState, useEffect } from "react";
import SimpleModal from "./SimpleModal";
import { Icon } from "@iconify/react";
import PurchaseOrderItemsEditor from "./PurchaseOrderItemsEditor";

export default function PurchaseOrderModals({
  show,
  onClose,
  onSave,
  onDelete,
  purchaseOrder,
  mode = "light",
  loading = false,
  error = null,
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
  const [warehouses, setWarehouses] = useState([]);
  const [lineItems, setLineItems] = useState([]);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    fetch("/api/suppliers")
      .then((res) => res.json())
      .then(({ data }) => setSuppliers(data || []));
    fetch("/api/warehouses")
      .then((res) => res.json())
      .then(({ data }) => setWarehouses(data || []));
  }, []);

  useEffect(() => {
    if (purchaseOrder) {
      setForm({
        supplier_id: purchaseOrder.supplier_id || "",
        warehouse_id: purchaseOrder.warehouse_id || "",
        date: purchaseOrder.date || "",
        status: purchaseOrder.status || "Pending",
        total: purchaseOrder.total || "",
        notes: purchaseOrder.notes || "",
      });
      // TODO: fetch line items for this order if needed
    } else {
      setForm({
        supplier_id: "",
        warehouse_id: "",
        date: "",
        status: "Pending",
        total: "",
        notes: "",
      });
      setLineItems([]);
    }
    setModalError(null);
  }, [purchaseOrder, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validation
    const requiredFields = ["supplier_id", "warehouse_id", "date", "status"];
    for (const field of requiredFields) {
      if (!form[field]) {
        setModalError(`Missing required field: ${field.replace(/_/g, ' ')}`);
        return;
      }
    }
    if (!lineItems || lineItems.length === 0) {
      setModalError("At least one line item is required.");
      return;
    }
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (!item.product_id) {
        setModalError(`Line item ${i + 1}: Product is required.`);
        return;
      }
      if (!item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
        setModalError(`Line item ${i + 1}: Quantity must be greater than 0.`);
        return;
      }
      if (item.unit_cost === undefined || isNaN(Number(item.unit_cost)) || Number(item.unit_cost) < 0) {
        setModalError(`Line item ${i + 1}: Unit cost must be 0 or greater.`);
        return;
      }
    }
    // Auto-calculate total
    const total = lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0), 0);
    const orderData = { ...form, total };
    if (onSave) onSave(orderData, lineItems);
  };

  return (
    <SimpleModal
      isOpen={show}
      onClose={onClose}
      title={purchaseOrder ? "Edit Purchase Order" : "Add Purchase Order"}
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
              disabled={loading}
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
              disabled={loading}
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
              <option value="Approved">Approved</option>
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
            value={lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0), 0)}
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
        <PurchaseOrderItemsEditor
          items={lineItems}
          onChange={setLineItems}
          disabled={loading}
        />
        {(modalError || error) && (
          <div className="text-red-600 text-sm">{modalError || error}</div>
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
            {loading ? "Saving..." : purchaseOrder ? "Update" : "Add"}
          </button>
        </div>
      </form>
    </SimpleModal>
  );
} 