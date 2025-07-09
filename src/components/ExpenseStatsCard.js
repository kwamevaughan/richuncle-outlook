import { Icon } from "@iconify/react";

export default function ExpenseStatsCard({ title, value, icon, color = "blue", subtitle }) {
  const colorClasses = {
    blue: "text-blue-500",
    green: "text-green-500",
    purple: "text-purple-500",
    orange: "text-orange-500",
    red: "text-red-500",
    yellow: "text-yellow-500",
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <Icon icon={icon} className={`w-8 h-8 ${colorClasses[color]}`} />
      </div>
    </div>
  );
} 