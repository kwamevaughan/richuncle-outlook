import { Icon } from "@iconify/react";

const CashCountSection = ({
  session,
  salesSummary,
  movements,
  closeAmount,
  setCloseAmount,
  closeNote,
  setCloseNote,
  handleCloseRegister,
  actionLoading,
  mode = "light",
}) => {
  // Calculate expected amount and difference
  const opening = Number(session?.opening_cash) || 0;
  const sales = salesSummary ? Number(salesSummary.totalSales) : 0;
  const refund = salesSummary ? Number(salesSummary.totalRefund) : 0;
  const expense = salesSummary ? Number(salesSummary.totalExpense) : 0;
  const credit = 0; // Removed totalCredit
  const cashIn = (movements || []).filter(m => m.type === 'cash_in').reduce((sum, m) => sum + Number(m.amount || 0), 0);
  const cashOut = (movements || []).filter(m => m.type === 'cash_out').reduce((sum, m) => sum + Number(m.amount || 0), 0);
  const expected = opening + sales + cashIn - cashOut - refund - expense - credit;
  const diff = (closeAmount === undefined || closeAmount === null) ? 0 : Number(closeAmount) - expected;

  return (
    <div className={`rounded-xl p-6 border mb-4 ${
      mode === "dark" 
        ? "bg-gray-800 border-gray-600" 
        : "bg-gray-50 border-gray-200"
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <Icon icon={`mdi:cash ${mode === "dark" ? "text-gray-400" : "text-gray-600"}`} className="w-6 h-6" />
        <h3 className={`text-lg font-bold ${
          mode === "dark" ? "text-white" : "text-gray-800"
        }`}>Cash Count</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col">
          <label className={`text-sm mb-1 ${
            mode === "dark" ? "text-gray-300" : "text-gray-600"
          }`}>Total Expected Amount</label>
          <div className="font-bold text-xl text-green-700">
            GHS {Math.round(expected).toLocaleString()}
          </div>
        </div>
        <div className="flex flex-col">
          <label className={`text-sm mb-1 ${
            mode === "dark" ? "text-gray-300" : "text-gray-600"
          }`}>Cash in Hand (Counted)</label>
          <input
            type="number"
            value={closeAmount === undefined || closeAmount === null ? '' : closeAmount}
            onChange={e => setCloseAmount(Number(e.target.value))}
            placeholder="Enter counted cash amount"
            className={`border rounded px-3 py-2 text-lg font-semibold ${
              mode === "dark" 
                ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400" 
                : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
            }`}
          />
        </div>
      </div>
      <div className="flex items-center gap-4 mb-2">
        <div className={`text-sm ${
          mode === "dark" ? "text-gray-300" : "text-gray-600"
        }`}>Difference (Over/Short):</div>
        <div className={`font-bold text-lg ${diff === 0 ? 'text-green-700' : diff > 0 ? 'text-blue-700' : 'text-red-700'}`}>GHS {Math.round(diff).toLocaleString()}</div>
      </div>
      {/* Show warning if difference is large */}
      {Math.abs(diff) >= 50 && (
        <div className={`mb-2 p-3 rounded border flex items-center gap-2 ${
          mode === "dark" 
            ? "bg-yellow-900/30 border-yellow-600 text-yellow-200" 
            : "bg-yellow-100 border-yellow-300 text-yellow-900"
        }`}>
          <Icon icon={`mdi:alert ${mode === "dark" ? "text-yellow-400" : "text-yellow-700"}`} className="w-5 h-5" />
          <span>Warning: The difference (over/short) is large (GHS {Math.round(diff).toLocaleString()}). Please double-check your cash count and add a note.</span>
        </div>
      )}
      <div className="mb-4">
        <label className={`block text-sm font-semibold mb-1 ${
          mode === "dark" ? "text-white" : "text-gray-900"
        }`}>
          Closing Note{' '}
          {Math.round(diff) !== 0 ? <span className="text-red-600">(required for over/short)</span> : null}
        </label>
        <textarea
          className={`w-full border rounded px-3 py-2 ${
            mode === "dark" 
              ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400" 
              : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
          }`}
          rows={2}
          value={closeNote}
          onChange={e => setCloseNote(e.target.value)}
          placeholder="Add a note for closing (required if over/short)"
        />
      </div>
      <button
        onClick={handleCloseRegister}
        disabled={actionLoading || closeAmount === undefined || closeAmount === null || (Math.round(diff) !== 0 && closeNote.trim() === '')}
        className="bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 font-semibold disabled:opacity-50 w-full"
      >
        {actionLoading ? 'Closing...' : 'Close Register'}
      </button>
    </div>
  );
};

export default CashCountSection; 