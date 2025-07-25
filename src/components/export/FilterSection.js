import { Icon } from "@iconify/react";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

export default function FilterSection({
                                          filterStatus,
                                          setFilterStatus,
                                          dateRange,
                                          setDateRange,
                                          showDatePicker,
                                          setShowDatePicker,
                                          mode,
                                          statuses,
                                          fallbackStaticRanges,
                                      }) {
    return (
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
                <label
                    className={`block text-sm font-medium mb-2 ${
                        mode === "dark"
                            ? "text-gray-200 bg-gray-800"
                            : "text-[#231812] bg-white"
                    }`}
                >
                    Filter by Status
                </label>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f05d23] text-sm ${
                        mode === "dark"
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-gray-50 border-gray-300 text-[#231812]"
                    }`}
                >
                    {statuses.map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex-1 relative">
                <label
                    className={`block text-sm font-medium mb-2 ${
                        mode === "dark"
                            ? "text-gray-200 bg-gray-800"
                            : "text-[#231812] bg-white"
                    }`}
                >
                    Filter by Date Range
                </label>
                <button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className={`w-full p-2 rounded-lg flex items-center justify-between transition duration-200 shadow-md ${
                        mode === "dark"
                            ? "bg-gray-700 text-white hover:bg-gray-600"
                            : "bg-gray-200 text-[#231812] hover:bg-gray-300"
                    }`}
                >
                    <span>
                        {dateRange[0].startDate && dateRange[0].endDate
                            ? `${dateRange[0].startDate.toLocaleDateString()} - ${dateRange[0].endDate.toLocaleDateString()}`
                            : "Select Date Range"}
                    </span>
                    <Icon
                        icon={showDatePicker ? "mdi:chevron-up" : "mdi:chevron-down"}
                        className="w-5 h-5 text-[#f05d23]"
                    />
                </button>
                {showDatePicker && (
                    <div
                        className={`absolute left-0 top-[100%] mt-2 w-[calc(100%+2rem)] -ml-40 rounded-lg shadow-lg border z-50 ${
                            mode === "dark"
                                ? "bg-gray-800 border-gray-700 text-white dark-mode-datepicker"
                                : "bg-white border-gray-200 text-[#231812]"
                        }`}
                    >
                        <DateRangePicker
                            ranges={dateRange}
                            onChange={(item) => setDateRange([item.selection])}
                            className="w-full"
                            inputRanges={[]}
                            staticRanges={fallbackStaticRanges}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}