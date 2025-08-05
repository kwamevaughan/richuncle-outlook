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
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700 z-10">
                    <tr>
                      <th className="text-left p-3 border-b font-semibold">
                        Product
                      </th>
                      <th className="text-right p-3 border-b font-semibold">
                        Qty
                      </th>
                      <th className="text-right p-3 border-b font-semibold">
                        Unit Price
                      </th>
                      <th className="text-right p-3 border-b font-semibold">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`${
                          index % 2 === 0
                            ? "bg-white dark:bg-gray-800"
                            : "bg-gray-50 dark:bg-gray-750"
                        } hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors`}
                      >
                        <td className="p-3 border-b border-gray-200 dark:border-gray-600">
                          <div className="uppercase font-medium text-gray-900 dark:text-gray-100">
                            {item.name}
                          </div>
                        </td>
                        <td className="p-3 text-right border-b border-gray-200 dark:border-gray-600">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="p-3 text-right border-b border-gray-200 dark:border-gray-600 font-medium">
                          GHS {Number(item.price).toLocaleString()}
                        </td>
                        <td className="p-3 text-right border-b border-gray-200 dark:border-gray-600 font-semibold text-green-600 dark:text-green-400">
                          GHS {item.lineTotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
