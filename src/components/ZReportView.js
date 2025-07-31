import { Icon } from "@iconify/react";
import printZReport from "./printZReport";

export default function ZReportView({ zReport, onPrint, showPrintButton = true, onClose }) {
  if (!zReport) return <div className="text-center py-8 text-gray-400">No Z-Report data.</div>;
  const session = zReport.session || {};
  const paymentBreakdown = zReport.paymentBreakdown || {};
  const productsSold = zReport.productsSold || [];
  return (
    <div className="space-y-6">
      <div className="rounded-xl p-6 border bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:bg-gray-800 dark:border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Icon icon="material-symbols:receipt-long" className="w-8 h-8 text-green-600" />
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Z-Report</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Close Z-Report"
            >
              <Icon icon="mdi:close" className="w-6 h-6" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm dark:bg-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-300">Session Period</div>
            <div className="font-semibold dark:text-white">
              {session.opened_at ? new Date(session.opened_at).toLocaleString() : "N/A"}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">to</div>
            <div className="font-semibold dark:text-white">
              {session.closed_at ? new Date(session.closed_at).toLocaleString() : "N/A"}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm dark:bg-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-300">Cashier</div>
            <div className="font-semibold text-lg dark:text-white">{session.user || session.user_id}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm dark:bg-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-300">Over/Short</div>
            <div className={`font-bold text-lg ${
              (session.over_short || 0) >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              {session.over_short !== null && session.over_short !== undefined
                ? `GHS ${Number(session.over_short).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "N/A"}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm dark:bg-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-300">Opening Cash</div>
            <div className="font-bold text-lg text-blue-600">
              {session.opening_cash !== null && session.opening_cash !== undefined
                ? `GHS ${Number(session.opening_cash).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "N/A"}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm dark:bg-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-300">Closing Cash</div>
            <div className="font-bold text-lg text-indigo-600">
              {session.closing_cash !== null && session.closing_cash !== undefined
                ? `GHS ${Number(session.closing_cash).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "N/A"}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm dark:bg-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Sales</div>
            <div className="font-bold text-lg text-green-600">
              {zReport.totalSales !== null && zReport.totalSales !== undefined
                ? `GHS ${Number(zReport.totalSales).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "N/A"}
            </div>
          </div>
        </div>
        {/* Payment Breakdown */}
        <div className="mb-6">
          <h4 className="font-semibold mb-2 dark:text-white">Payment Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-2">
            {paymentBreakdown && Object.keys(paymentBreakdown).length > 0 ? (
              Object.entries(paymentBreakdown).map(([type, amount]) => (
                <div key={type} className="bg-gray-50 rounded p-2 text-center dark:bg-gray-700">
                  <div className="text-xs text-gray-500 capitalize dark:text-gray-400">
                    {type.replace("_", " ")} Payment
                  </div>
                  <div className="font-bold text-gray-800 dark:text-white">
                    GHS {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-gray-400 text-center">No payment breakdown</div>
            )}
          </div>
        </div>
        {/* Products Sold Table */}
        <div className="mb-6">
          <h4 className="font-semibold mb-2 dark:text-white">Products Sold</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-300 dark:border-gray-600">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200">Product</th>
                  <th className="px-4 py-2 border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200">Quantity</th>
                  <th className="px-4 py-2 border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200">Total</th>
                </tr>
              </thead>
              <tbody>
                {productsSold && productsSold.length > 0 ? (
                  productsSold.map((product, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 border border-gray-300 text-gray-900 dark:border-gray-600 dark:text-gray-200">{product.name}</td>
                      <td className="px-4 py-2 border text-center border-gray-300 text-gray-900 dark:border-gray-600 dark:text-gray-200">{product.quantity}</td>
                      <td className="px-4 py-2 border text-right border-gray-300 text-gray-900 dark:border-gray-600 dark:text-gray-200">GHS {Number(product.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-2 border text-center border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400" colSpan="3">No products sold</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {showPrintButton && (
          <div className="flex justify-end gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Icon icon="mdi:close" className="w-5 h-5" />
                Close
              </button>
            )}
            <button
              onClick={onPrint}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Icon icon="mdi:printer" className="w-5 h-5" />
              Print Z-Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 