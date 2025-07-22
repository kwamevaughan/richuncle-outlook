import { Icon } from "@iconify/react";

const CashInForm = ({ cashInAmount, setCashInAmount, cashInReason, setCashInReason, handleCashIn, actionLoading }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h4 className="font-semibold mb-4 flex items-center gap-2">
        <Icon icon="material-symbols:add-circle-outline" className="w-5 h-5 text-green-600" />
        Cash In
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="number"
          value={cashInAmount || ""}
          onChange={(e) => setCashInAmount(Number(e.target.value))}
          placeholder="Amount"
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          value={cashInReason}
          onChange={(e) => setCashInReason(e.target.value)}
          placeholder="Reason"
          className="border rounded px-3 py-2"
        />
        <button
          onClick={handleCashIn}
          disabled={actionLoading || !cashInAmount || !cashInReason}
          className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 font-semibold disabled:opacity-50"
        >
          {actionLoading ? "Adding..." : "Add Cash In"}
        </button>
      </div>
    </div>
  );
};

export default CashInForm; 