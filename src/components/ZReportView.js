import { Icon } from "@iconify/react";
import printZReport from "./printZReport";

export default function ZReportView({ zReport, onPrint, showPrintButton = true, onClose }) {
  if (!zReport) return <div className="text-center py-8 text-gray-400">No Z-Report data.</div>;
  const session = zReport.session || {};
  const paymentBreakdown = zReport.paymentBreakdown || {};
  const productsSold = zReport.productsSold || [];
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center gap-3 mb-4">
          <Icon icon="material-symbols:receipt-long" className="w-8 h-8 text-green-600" />
          <h3 className="text-2xl font-bold text-gray-800">Z-Report</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Session Period</div>
            <div className="font-semibold">
              {session.opened_at ? new Date(session.opened_at).toLocaleString() : "N/A"}
            </div>
            <div className="text-sm text-gray-600">to</div>
            <div className="font-semibold">
              {session.closed_at ? new Date(session.closed_at).toLocaleString() : "N/A"}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Cashier</div>
            <div className="font-semibold text-lg">{session.user || session.user_id}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Over/Short</div>
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
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Opening Cash</div>
            <div className="font-bold text-lg text-blue-600">
              {session.opening_cash !== null && session.opening_cash !== undefined
                ? `GHS ${Number(session.opening_cash).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "N/A"}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Closing Cash</div>
            <div className="font-bold text-lg text-indigo-600">
              {session.closing_cash !== null && session.closing_cash !== undefined
                ? `GHS ${Number(session.closing_cash).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "N/A"}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Total Sales</div>
            <div className="font-bold text-lg text-green-600">
              {zReport.totalSales !== null && zReport.totalSales !== undefined
                ? `GHS ${Number(zReport.totalSales).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "N/A"}
            </div>
          </div>
        </div>
        {/* Payment Breakdown */}
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Payment Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-2">
            {paymentBreakdown && Object.keys(paymentBreakdown).length > 0 ? (
              Object.entries(paymentBreakdown).map(([type, amount]) => (
                <div key={type} className="bg-gray-50 rounded p-2 text-center">
                  <div className="text-xs text-gray-500 capitalize">
                    {type.replace("_", " ")} Payment
                  </div>
                  <div className="font-bold text-gray-800">
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
          <h4 className="font-semibold mb-2">Products Sold</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Product</th>
                  <th className="px-4 py-2 border">Quantity</th>
                  <th className="px-4 py-2 border">Total</th>
                </tr>
              </thead>
              <tbody>
                {productsSold && productsSold.length > 0 ? (
                  productsSold.map((prod, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 border">{prod.name}</td>
                      <td className="px-4 py-2 border text-center">{prod.quantity}</td>
                      <td className="px-4 py-2 border text-right">GHS {Number(prod.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-gray-400">No products sold</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {showPrintButton && (
          <div className="flex gap-4 mt-4">
            <button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-semibold transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
              onClick={() => printZReport(zReport)}
            >
              <Icon icon="material-symbols:print" className="w-5 h-5" /> Print Z-Report
            </button>

            <button className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg px-6 py-3 font-semibold transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2" onClick={() => onClose && onClose()}>
              <Icon icon="mdi:close" className="w-5 h-5" /> Close Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 