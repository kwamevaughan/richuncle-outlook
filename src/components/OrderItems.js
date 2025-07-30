import React from "react";

const OrderItems = ({ products, quantities }) => {
  return (
    <div>

      <div className="bg-blue-50 dark:bg-slate-800/50 gap-4 text-sm mb-4 p-4 rounded-lg border border-blue-200 dark:border-slate-600">
        {Array.isArray(products) && products.length > 0 && quantities ? (
          (() => {
            const items = products
              .filter((p) => (quantities[p.id] || 1) > 0)
              .map((p) => ({
                ...p,
                quantity: quantities[p.id] || 1,
                lineTotal: (Number(p.price) || 0) * (quantities[p.id] || 1),
              }));
            if (items.length === 0)
              return <div className="text-gray-400 italic">No products.</div>;
            return (
              <table className="w-full mb-4 text-sm border">
                <thead>
                  <tr>
                    <th className="text-left p-2 border-b">Product</th>
                    <th className="text-right p-2 border-b">Qty</th>
                    <th className="text-right p-2 border-b">Unit Price</th>
                    <th className="text-right p-2 border-b">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2">{item.name}</td>
                      <td className="p-2 text-right">{item.quantity}</td>
                      <td className="p-2 text-right">
                        GHS {Number(item.price).toLocaleString()}
                      </td>
                      <td className="p-2 text-right">
                        GHS {item.lineTotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()
        ) : (
          <div className="text-gray-400 italic">No products.</div>
        )}
      </div>
    </div>
  );
};

export default OrderItems;