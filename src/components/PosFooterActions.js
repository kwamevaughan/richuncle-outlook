import React from "react";
import { Icon } from "@iconify/react";

const PosFooterActions = () => (
  <div className="fixed bottom-0 left-0 w-full z-50 bg-white py-3 flex justify-center shadow-lg">
    <div className="relative flex justify-center items-center w-full max-w-5xl mx-auto px-4">
      <div className="flex gap-3">
        <button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition">
          <Icon icon="mdi:pause" className="w-5 h-5" />
          Hold
        </button>
        
        <button className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-5 py-2 rounded-lg shadow transition">
          <Icon icon="mdi:cash-multiple" className="w-5 h-5" />
          Pay Now
        </button>
        <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-5 py-2 rounded-lg shadow transition">
          <Icon icon="mdi:clipboard-list-outline" className="w-5 h-5" />
          View Orders
        </button>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition">
          <Icon icon="mdi:refresh" className="w-5 h-5" />
          Reset
        </button>
      </div>
      <div className="font-bold whitespace-nowrap absolute right-6 top-1/2 -translate-y-1/2">Total Payable: N/A</div>
    </div>
  </div>
);

export default PosFooterActions; 