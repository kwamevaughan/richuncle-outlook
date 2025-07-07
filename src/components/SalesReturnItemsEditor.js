import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

const REASONS = [
  "Damaged",
  "Wrong Item",
  "Customer Changed Mind",
  "Expired",
  "Other"
];

export default function SalesReturnItemsEditor({
  lineItems,
  setLineItems,
  products,
  referenceOrderProducts,
  reference,
  ...props
}) {
  const [localItems, setLocalItems] = useState(lineItems);

  useEffect(() => {
    setLocalItems(lineItems);
  }, [lineItems]);

  // Only show products from referenced order if reference is set
  const availableProducts = reference && referenceOrderProducts && referenceOrderProducts.length > 0
    ? products.filter(p => referenceOrderProducts.some(rp => rp.product_id === p.id))
    : products;

  const handleItemChange = (idx, field, value) => {
    const updated = localItems.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setLocalItems(updated);
    if (setLineItems) setLineItems(updated);
  };

  const handleAddItem = () => {
    const newItem = { product_id: "", quantity: 1, unit_price: 0, total: 0, reason: "" };
    const updated = [...localItems, newItem];
    setLocalItems(updated);
    if (setLineItems) setLineItems(updated);
  };

  const handleRemoveItem = (idx) => {
    const updated = localItems.filter((_, i) => i !== idx);
    setLocalItems(updated);
    if (setLineItems) setLineItems(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Line Items</span>
        <button
          type="button"
          className="px-2 py-1 bg-green-600 text-white rounded text-xs flex items-center gap-1"
          onClick={handleAddItem}
          disabled={props.disabled || props.disableAdd}
        >
          <Icon icon="mdi:plus" className="w-4 h-4" /> Add Item
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1">Product</th>
              <th className="px-2 py-1">Qty</th>
              <th className="px-2 py-1">Unit Price</th>
              <th className="px-2 py-1">Total</th>
              <th className="px-2 py-1">Reason for Return</th>
              <th className="px-2 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {localItems.map((item, idx) => {
              const product = availableProducts.find((p) => p.id === item.product_id);
              const total = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
              return (
                <tr key={idx}>
                  <td className="px-2 py-1">
                    <select
                      value={item.product_id || ""}
                      onChange={(e) => handleItemChange(idx, "product_id", e.target.value)}
                      className="border rounded px-2 py-1"
                      required
                      disabled={!!reference}
                    >
                      <option value="">Select Product</option>
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                      className="border rounded px-2 py-1 w-16"
                      disabled={props.disabled}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(idx, "unit_price", e.target.value)}
                      className="border rounded px-2 py-1 w-20"
                      disabled={props.disabled}
                    />
                  </td>
                  <td className="px-2 py-1">GHS {total.toFixed(2)}</td>
                  <td className="px-2 py-1">
                    <select
                      value={item.reason || ""}
                      onChange={(e) => handleItemChange(idx, "reason", e.target.value)}
                      className="border rounded px-2 py-1"
                      disabled={props.disabled}
                    >
                      <option value="">Select reason</option>
                      {REASONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    {item.reason === "Other" && (
                      <input
                        type="text"
                        value={item.reason_text || ""}
                        onChange={(e) => handleItemChange(idx, "reason_text", e.target.value)}
                        className="border rounded px-2 py-1 mt-1 w-full"
                        placeholder="Enter reason"
                        disabled={props.disabled}
                      />
                    )}
                  </td>
                  <td className="px-2 py-1">
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={props.disabled}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
            {localItems.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-2">
                  No items added.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 