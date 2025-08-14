import { Icon } from "@iconify/react";

export default function ProfileSidebar({
  user,
  formatDate,
  onLogout,
  mode = "light"
}) {
  return (
    <div className="space-y-6">
      {/* Account Information */}
      <div className={`rounded-2xl shadow-lg border overflow-hidden backdrop-blur-sm ${
        mode === "dark" 
          ? "bg-gray-800/90 border-gray-700/50 shadow-gray-900/20" 
          : "bg-white/90 border-gray-200/50 shadow-gray-900/10"
      }`}>
        <div className={`px-6 py-4 border-b ${
          mode === "dark" 
            ? "bg-gradient-to-r from-gray-700/80 to-blue-900/40 border-gray-700/50" 
            : "bg-gradient-to-r from-gray-50/80 to-blue-50/40 border-gray-200/50"
        }`}>
          <h3 className={`text-lg font-bold flex items-center gap-2 ${
            mode === "dark" ? "text-white" : "text-gray-900"
          }`}>
            <Icon
              icon="solar:info-circle-bold"
              className="w-5 h-5 text-blue-600"
            />
            Account Details
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className={`flex items-center justify-between py-3 border-b last:border-b-0 ${
            mode === "dark" ? "border-gray-700" : "border-gray-50"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                mode === "dark" ? "bg-blue-900/50" : "bg-blue-100"
              }`}>
                <Icon
                  icon="mdi:calendar-outline"
                  className="w-4 h-4 text-blue-600"
                />
              </div>
              <div>
                <p className={`text-sm ${
                  mode === "dark" ? "text-gray-400" : "text-gray-500"
                }`}>Created</p>
                <p className={`text-sm font-medium ${
                  mode === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  {formatDate(user.created_at)}
                </p>
              </div>
            </div>
          </div>

          <div className={`flex items-center justify-between py-3 border-b last:border-b-0 ${
            mode === "dark" ? "border-gray-700" : "border-gray-50"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                mode === "dark" ? "bg-green-900/50" : "bg-green-100"
              }`}>
                <Icon
                  icon="solar:pen-new-square-bold"
                  className="w-4 h-4 text-green-600"
                />
              </div>
              <div>
                <p className={`text-sm ${
                  mode === "dark" ? "text-gray-400" : "text-gray-500"
                }`}>Last Updated</p>
                <p className={`text-sm font-medium ${
                  mode === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  {formatDate(user.updated_at)}
                </p>
              </div>
            </div>
          </div>

          <div className={`flex items-center justify-between py-3 border-b last:border-b-0 ${
            mode === "dark" ? "border-gray-700" : "border-gray-50"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                mode === "dark" ? "bg-purple-900/50" : "bg-purple-100"
              }`}>
                <Icon
                  icon="solar:login-3-bold"
                  className="w-4 h-4 text-purple-600"
                />
              </div>
              <div>
                <p className={`text-sm ${
                  mode === "dark" ? "text-gray-400" : "text-gray-500"
                }`}>Last Login</p>
                <p className={`text-sm font-medium ${
                  mode === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  {formatDate(user.last_login)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`rounded-2xl shadow-lg border overflow-hidden backdrop-blur-sm ${
        mode === "dark" 
          ? "bg-gray-800/90 border-gray-700/50 shadow-gray-900/20" 
          : "bg-white/90 border-gray-200/50 shadow-gray-900/10"
      }`}>
        <div className={`px-6 py-4 border-b ${
          mode === "dark" 
            ? "bg-gradient-to-r from-gray-700/80 to-orange-900/40 border-gray-700/50" 
            : "bg-gradient-to-r from-gray-50/80 to-orange-50/40 border-gray-200/50"
        }`}>
          <h3 className={`text-lg font-bold flex items-center gap-2 ${
            mode === "dark" ? "text-white" : "text-gray-900"
          }`}>
            <Icon icon="solar:flash-bold" className="w-5 h-5 text-orange-600" />
            Quick Actions
          </h3>
        </div>
        <div className="p-6">
          <button
            onClick={onLogout}
            className={`w-full flex items-center justify-center px-4 py-3 border rounded-xl transition-all duration-200 group ${
              mode === "dark" 
                ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500" 
                : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
            }`}
          >
            <Icon
              icon="solar:logout-3-bold"
              className={`w-4 h-4 mr-3 ${
                mode === "dark" 
                  ? "text-gray-400 group-hover:text-gray-200" 
                  : "text-gray-500 group-hover:text-gray-700"
              }`}
            />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
} 