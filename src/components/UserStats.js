import { Icon } from "@iconify/react";

export default function UserStats({ stats }) {
  const statCards = [
    {
      title: "Total Users",
      value: stats.total,
      icon: "mdi:account-multiple",
      bgColor: "bg-gradient-to-br from-indigo-50 to-indigo-100",
      iconColor: "text-indigo-600",
      borderColor: "border-indigo-200",
      hoverBg:
        "hover:bg-gradient-to-br hover:from-indigo-100 hover:to-indigo-200",
    },
    {
      title: "Active",
      value: stats.active,
      icon: "mdi:account-check",
      bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200",
      hoverBg:
        "hover:bg-gradient-to-br hover:from-emerald-100 hover:to-emerald-200",
    },
    {
      title: "Inactive",
      value: stats.inactive,
      icon: "mdi:account-off",
      bgColor: "bg-gradient-to-br from-red-50 to-red-100",
      iconColor: "text-red-600",
      borderColor: "border-red-200",
      hoverBg: "hover:bg-gradient-to-br hover:from-red-100 hover:to-red-200",
    },
    {
      title: "Admins",
      value: stats.admin,
      icon: "mdi:shield-crown",
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
      iconColor: "text-purple-600",
      borderColor: "border-purple-200",
      hoverBg:
        "hover:bg-gradient-to-br hover:from-purple-100 hover:to-purple-200",
    },
    {
      title: "Managers",
      value: stats.manager,
      icon: "mdi:account-tie",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
      hoverBg: "hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-200",
    },
    {
      title: "Cashiers",
      value: stats.cashier,
      icon: "mdi:cash-register",
      bgColor: "bg-gradient-to-br from-teal-50 to-teal-100",
      iconColor: "text-teal-600",
      borderColor: "border-teal-200",
      hoverBg: "hover:bg-gradient-to-br hover:from-teal-100 hover:to-teal-200",
    },

  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {statCards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} ${card.hoverBg} ${card.borderColor} rounded-xl p-5 border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer group`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-300 flex-shrink-0`}
            >
              <Icon
                icon={card.icon}
                className={`w-6 h-6 ${card.iconColor} group-hover:scale-110 transition-transform duration-300`}
              />
            </div>
            <div className="space-y-1 flex-1">
              <div className="text-2xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors duration-300">
                {card.value?.toLocaleString() || "0"}
              </div>
              <div className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                {card.title}
              </div>
            </div>
          </div>

          {/* Subtle animation indicator */}
          <div className="mt-3 h-1 bg-white/50 rounded-full overflow-hidden">
            <div
              className={`h-full ${card.iconColor.replace(
                "text-",
                "bg-"
              )} rounded-full transform translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out`}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}
