import { Icon } from "@iconify/react";

const CashOutForm = ({ cashOutAmount, setCashOutAmount, cashOutReason, setCashOutReason, handleCashOut, actionLoading }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h4 className="font-semibold mb-4 flex items-center gap-2">
        <Icon icon="material-symbols:remove-circle-outline" className="w-5 h-5 text-red-600" />
        Cash Out
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="number"
          value={cashOutAmount || ""}
          onChange={(e) => setCashOutAmount(Number(e.target.value))}
          placeholder="Amount"
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          value={cashOutReason}
          onChange={(e) => setCashOutReason(e.target.value)}
          placeholder="Reason"
          className="border rounded px-3 py-2"
        />
        <button
          onClick={handleCashOut}
          disabled={actionLoading || !cashOutAmount || !cashOutReason}
          className="bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 font-semibold disabled:opacity-50"
        >
          {actionLoading ? "Adding..." : "Add Cash Out"}
        </button>
      </div>
    </div>
  );
};

export default CashOutForm; 