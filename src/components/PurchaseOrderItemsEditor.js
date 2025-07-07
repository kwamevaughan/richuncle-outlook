import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

export default function PurchaseOrderItemsEditor({ items = [], onChange, disabled = false }) {
  const [products, setProducts] = useState([]);
  const [localItems, setLocalItems] = useState(items);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(({ data }) => setProducts(data || []));
  }, []);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const handleItemChange = (idx, field, value) => {
    const updated = localItems.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setLocalItems(updated);
    if (onChange) onChange(updated);
  };

  const handleAddItem = () => {
    const newItem = { product_id: "", quantity: 1, unit_cost: 0, total: 0 };
    const updated = [...localItems, newItem];
    setLocalItems(updated);
    if (onChange) onChange(updated);
  };

  const handleRemoveItem = (idx) => {
    const updated = localItems.filter((_, i) => i !== idx);
    setLocalItems(updated);
    if (onChange) onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Line Items</span>
        <button
          type="button"
          className="px-2 py-1 bg-green-600 text-white rounded text-xs flex items-center gap-1"
          onClick={handleAddItem}
          disabled={disabled}
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
              <th className="px-2 py-1">Unit Cost</th>
              <th className="px-2 py-1">Total</th>
              <th className="px-2 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {localItems.map((item, idx) => {
              const product = products.find((p) => p.id === item.product_id);
              const total = (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0);
              return (
                <tr key={idx}>
                  <td className="px-2 py-1">
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(idx, "product_id", e.target.value)}
                      className="border rounded px-2 py-1"
                      disabled={disabled}
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
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
                      disabled={disabled}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_cost}
                      onChange={(e) => handleItemChange(idx, "unit_cost", e.target.value)}
                      className="border rounded px-2 py-1 w-20"
                      disabled={disabled}
                    />
                  </td>
                  <td className="px-2 py-1">GHS {total.toFixed(2)}</td>
                  <td className="px-2 py-1">
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={disabled}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
            {localItems.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-2">
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