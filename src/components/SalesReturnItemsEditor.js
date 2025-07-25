import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Select from 'react-select';
import toast from 'react-hot-toast';

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

  // Remove debug logs for localItems and referenceOrderProducts

  // Auto-populate line items when reference changes and there are no line items
  useEffect(() => {
    if (reference && referenceOrderProducts && referenceOrderProducts.length > 0 && localItems.length === 0) {
      const unmatchedProductIds = [];
      const autoItems = referenceOrderProducts.map(rp => {
        let product = null;
        if (products && products.length > 0) {
          product = products.find(p => String(p.id) === String(rp.product_id) || String(p.old_id) === String(rp.product_id));
        }
        if (!product) {
          unmatchedProductIds.push(rp.product_id);
          return null;
        }
        return {
          product_id: product.id, // Always UUID
          quantity: 1,
          unit_price: rp.unit_price ?? rp.price ?? 0,
          total: rp.unit_price ?? rp.price ?? 0,
          reason: ""
        };
      }).filter(item => !!item);
      setLocalItems(autoItems);
      if (setLineItems) setLineItems(autoItems);
      // Optionally, show a warning in the UI if unmatchedProductIds.length > 0
      // Example: setUnmatchedWarning(unmatchedProductIds)
    }
  }, [reference, referenceOrderProducts, products]);

  // Only show products from referenced order if reference is set
  const availableProducts = reference && referenceOrderProducts && referenceOrderProducts.length > 0
    ? referenceOrderProducts
        .filter(rp => typeof rp.product_id === 'string' && rp.product_id.length === 36)
        .map(rp => ({
          id: rp.product_id, // Only use UUID
          name: rp.name || `Product ${rp.product_id}`,
          ...rp
        }))
    : products;

  // Compute which products are already in the editor
  const addedProductIds = new Set(localItems.map(item => item.product_id));
  // Only show products not already added
  const selectableProducts = availableProducts.filter(p => !addedProductIds.has(p.product_id));

  const handleItemChange = (idx, field, value) => {
    let updated = localItems.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    // If product_id is changed and reference is set, auto-fill unit_price
    if (field === "product_id" && reference && value) {
      const refProd = referenceOrderProducts.find(rp => String(rp.product_id) === String(value));
      if (refProd) {
        updated[idx].unit_price = refProd.unit_price ?? refProd.price ?? 0;
      }
    }
    setLocalItems(updated);
    if (setLineItems) setLineItems(updated);
  };

  const handleAddItem = () => {
    if (selectableProducts.length === 0) {
      toast.error('All products in this order have already been added.');
      return;
    }
    // Default to the first available product's UUID not already added
    const defaultProductId = selectableProducts[0].product_id;
    let defaultUnitPrice = 0;
    if (defaultProductId) {
      const prod = selectableProducts.find(p => p.product_id === defaultProductId);
      defaultUnitPrice = prod && prod.unit_price !== undefined ? prod.unit_price : (prod && prod.price !== undefined ? prod.price : 0);
    }
    const newItem = { product_id: defaultProductId, quantity: 1, unit_price: defaultUnitPrice, total: defaultUnitPrice, reason: "" };
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
        {reference && (
          <button
            type="button"
            className="px-2 py-1 bg-green-600 text-white rounded text-xs flex items-center gap-1"
            onClick={handleAddItem}
            disabled={props.disabled || props.disableAdd || selectableProducts.length === 0}
          >
            <Icon icon="mdi:plus" className="w-4 h-4" /> Add Item
          </button>
        )}
      </div>
      {selectableProducts.length === 0 && (
        <div className="text-xs text-red-500 mt-1">
          All products in this order have already been added.
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1">Product</th>
              <th className="px-2 py-1">Qty</th>
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
                    <Select
                      value={availableProducts.find(p => p.product_id === item.product_id)}
                      onChange={option => handleItemChange(idx, 'product_id', option ? option.product_id : "")}
                      options={selectableProducts}
                      getOptionLabel={p => p.name}
                      getOptionValue={p => p.product_id}
                      isSearchable
                      placeholder="Select product..."
                      classNamePrefix="react-select"
                      menuPortalTarget={document.body}
                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                    />
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