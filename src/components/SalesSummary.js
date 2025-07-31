import { Icon } from "@iconify/react";
import TooltipIconButton from "./TooltipIconButton";

const paymentIcons = {
  cash: 'mdi:cash',
  momo: 'mdi:cellphone',
  card: 'mdi:credit-card-outline',
  other: 'mdi:help-circle-outline',
};

const SalesSummary = ({ session, salesSummary, movements, mode = "light" }) => {
  return (
    <div className={`rounded-xl p-6 border mb-4 ${
      mode === "dark" 
        ? "bg-gray-800 border-gray-600" 
        : "bg-blue-50 border-blue-200"
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon icon="mdi:cash-register" className="w-6 h-6 text-blue-600" />
          <h3 className={`text-xl font-bold ${
            mode === "dark" ? "text-white" : "text-gray-800"
          }`}>Sales Summary</h3>
        </div>
        <div className={`text-sm ${
          mode === "dark" ? "text-gray-300" : "text-gray-600"
        }`}>
          Session Period: {session?.opened_at ? new Date(session.opened_at).toLocaleString() : "N/A"} - Now
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className={`rounded-lg p-4 shadow-sm ${
          mode === "dark" ? "bg-gray-700" : "bg-white"
        }`}>
          <div className={`text-sm ${
            mode === "dark" ? "text-gray-300" : "text-gray-600"
          }`}>Opening Cash</div>
          <div className="font-bold text-lg text-blue-600">
            GHS {Math.round(Number(session?.opening_cash || 0)).toLocaleString()}
          </div>
        </div>
        <div className={`rounded-lg p-4 shadow-sm ${
          mode === "dark" ? "bg-gray-700" : "bg-white"
        }`}>
          <div className={`text-sm ${
            mode === "dark" ? "text-gray-300" : "text-gray-600"
          }`}>Current Cash</div>
          <div className="font-bold text-lg text-green-600">
            GHS {Math.round((session?.opening_cash || 0) + (movements || []).reduce((sum, m) => sum + (m.type === "cash_in" ? m.amount : -m.amount), 0)).toLocaleString()}
          </div>
        </div>
        <div className={`rounded-lg p-4 shadow-sm ${
          mode === "dark" ? "bg-gray-700" : "bg-white"
        }`}>
          <div className={`text-sm ${
            mode === "dark" ? "text-gray-300" : "text-gray-600"
          }`}>Total Sales</div>
          <div className="font-bold text-lg text-green-600">
            GHS {salesSummary ? Math.round(Number(salesSummary.totalSales)).toLocaleString() : "0"}
          </div>
        </div>
      </div>
      {/* Payment Breakdown */}
      <div className="mb-6">
        <h4 className={`font-semibold mb-2 ${
          mode === "dark" ? "text-white" : "text-gray-900"
        }`}>Payment Breakdown</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2">
          {salesSummary && salesSummary.paymentBreakdown && Object.keys(salesSummary.paymentBreakdown).length > 0 ? (
            (() => {
              const pb = salesSummary.paymentBreakdown;
              const rows = [];
              if (pb.cash) rows.push({ label: 'Cash', key: 'cash', amount: pb.cash });
              if (pb.momo) rows.push({ label: 'Momo', key: 'momo', amount: pb.momo });
              if (pb.card) rows.push({ label: 'Card', key: 'card', amount: pb.card });
              // Show any other types (not cash/momo/card) as 'Other'
              const otherTotal = Object.entries(pb)
                .filter(([k]) => !['cash', 'momo', 'card'].includes(k))
                .reduce((sum, [, v]) => sum + Number(v), 0);
              if (otherTotal > 0) rows.push({ label: 'Other', key: 'other', amount: otherTotal });
              if (rows.length === 0) return <div className={`col-span-full text-center ${
                mode === "dark" ? "text-gray-400" : "text-gray-400"
              }`}>No payment breakdown</div>;
              return rows.map(row => (
                <div key={row.key} className={`rounded p-2 text-center flex flex-col items-center ${
                  mode === "dark" ? "bg-gray-700" : "bg-gray-50"
                }`}>
                  <TooltipIconButton
                    icon={paymentIcons[row.key] || paymentIcons.other}
                    label={(() => {
                      if (row.key === 'cash') return 'Cash: Physical cash received, including split payments.';
                      if (row.key === 'momo') return 'Momo: Mobile money received, including split payments.';
                      if (row.key === 'card') return 'Card: Card payments received, including split payments.';
                      return 'Other: Any other or unknown payment method.';
                    })()}
                    mode={mode}
                    className="w-6 h-6 mb-1 text-blue-600"
                  />
                  <div className={`text-xs capitalize ${
                    mode === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}>{row.label} Payment</div>
                  <div className={`font-bold ${
                    mode === "dark" ? "text-white" : "text-gray-800"
                  }`}>GHS {Math.round(Number(row.amount)).toLocaleString()}</div>
                </div>
              ));
            })()
          ) : (
            <div className={`col-span-full text-center ${
              mode === "dark" ? "text-gray-400" : "text-gray-400"
            }`}>No payment breakdown</div>
          )}
        </div>
      </div>
      {/* Products Sold Table */}
      <div className="mb-6">
        <h4 className={`font-semibold mb-2 ${
          mode === "dark" ? "text-white" : "text-gray-900"
        }`}>Products Sold</h4>
        <div className="overflow-x-auto">
          <table className={`min-w-full text-sm border ${
            mode === "dark" ? "border-gray-600" : "border-gray-300"
          }`}>
            <thead className={mode === "dark" ? "bg-gray-700" : "bg-gray-100"}>
              <tr>
                <th className={`px-4 py-2 border ${
                  mode === "dark" ? "border-gray-600 text-white" : "border-gray-300 text-gray-900"
                }`}>Product</th>
                <th className={`px-4 py-2 border ${
                  mode === "dark" ? "border-gray-600 text-white" : "border-gray-300 text-gray-900"
                }`}>Quantity</th>
                <th className={`px-4 py-2 border ${
                  mode === "dark" ? "border-gray-600 text-white" : "border-gray-300 text-gray-900"
                }`}>Total</th>
              </tr>
            </thead>
            <tbody>
              {salesSummary && salesSummary.productsSold && salesSummary.productsSold.length > 0 ? (
                salesSummary.productsSold.map((prod, idx) => (
                  <tr key={idx}>
                    <td className={`px-4 py-2 border ${
                      mode === "dark" ? "border-gray-600 text-white" : "border-gray-300 text-gray-900"
                    }`}>{prod.name}</td>
                    <td className={`px-4 py-2 border text-center ${
                      mode === "dark" ? "border-gray-600 text-white" : "border-gray-300 text-gray-900"
                    }`}>{prod.quantity}</td>
                    <td className={`px-4 py-2 border text-right ${
                      mode === "dark" ? "border-gray-600 text-white" : "border-gray-300 text-gray-900"
                    }`}>GHS {Math.round(Number(prod.total)).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className={`text-center py-4 ${
                    mode === "dark" ? "text-gray-400" : "text-gray-400"
                  }`}>No products sold</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesSummary; 