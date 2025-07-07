import React, { useEffect, useState } from "react";
import SimpleModal from "./SimpleModal";
import { Icon } from "@iconify/react";
import StatusPill from "./StatusPill";

export default function SaleDetailsModal({ sale, isOpen, onClose, mode }) {
  const [items, setItems] = useState(sale?.items || []);

  useEffect(() => {
    let ignore = false;
    async function fetchItems() {
      if (sale && (!sale.items || sale.items.length === 0)) {
        const res = await fetch(`/api/order-items?order_id=${sale.id}`);
        const result = await res.json();
        if (!ignore && result.success) {
          setItems(result.data || []);
        }
      } else if (sale && sale.items) {
        setItems(sale.items);
      }
    }
    if (isOpen && sale) fetchItems();
    return () => { ignore = true; };
  }, [isOpen, sale]);

  if (!isOpen || !sale) return null;
  return (
    <SimpleModal isOpen={isOpen} onClose={onClose} title={`Sale #${sale.sale_number || sale.id}`} mode={mode} width="max-w-2xl">
      <div className="space-y-2">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="text-sm text-gray-500">Date</div>
            <div className="font-semibold">{sale.timestamp ? sale.timestamp.split("T")[0] : "-"}</div>
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-500">Customer</div>
            <div className="font-semibold">{sale.customer_name || "Walk In Customer"}</div>
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-500">Staff</div>
            <div className="font-semibold">{sale.payment_receiver_name || "-"}</div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="text-sm text-gray-500">Status</div>
            <StatusPill status={sale.status} />
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-500">Payment</div>
            <div className="font-semibold">{sale.payment_method || "-"}</div>
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-500">Total</div>
            <div className="font-semibold">GHS {Number(sale.total).toFixed(2)}</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="font-semibold mb-2">Line Items</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-2 py-1">Product</th>
                  <th className="px-2 py-1">Qty</th>
                  <th className="px-2 py-1">Unit Price</th>
                  <th className="px-2 py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-2">
                      No items
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-1">{item.name || item.product_name || item.product_id}</td>
                      <td className="px-2 py-1">{item.quantity}</td>
                      <td className="px-2 py-1">GHS {Number(item.price || item.unit_price).toFixed(2)}</td>
                      <td className="px-2 py-1">GHS {Number(item.total || ((Number(item.quantity) || 0) * (Number(item.price || item.unit_price) || 0))).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex gap-2 pt-4 justify-end">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center gap-1"
            onClick={() => window.print()}
          >
            <Icon icon="mdi:printer" className="w-4 h-4" /> Print
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </SimpleModal>
  );
} 