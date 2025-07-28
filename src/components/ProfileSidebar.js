import { Icon } from "@iconify/react";

export default function ProfileSidebar({
  user,
  formatDate,
  onLogout,
  onDeleteAccount,
  mode = "light"
}) {
  return (
    <div className="space-y-6">
      {/* Account Information */}
      <div className={`rounded-2xl shadow-sm border overflow-hidden ${
        mode === "dark" 
          ? "bg-gray-800 border-gray-700" 
          : "bg-white border-gray-100"
      }`}>
        <div className={`px-6 py-4 border-b ${
          mode === "dark" 
            ? "bg-gradient-to-r from-gray-700 to-blue-900/50 border-gray-700" 
            : "bg-gradient-to-r from-gray-50 to-blue-50/50 border-gray-100"
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
                  icon="mdi:calendar-outline"
                  className="w-4 h-4 text-blue-600"
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
                mode === "dark" ? "bg-blue-900/50" : "bg-blue-100"
              }`}>
                <Icon
                  icon="mdi:login-variant"
                  className="w-4 h-4 text-blue-600"
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
      <div className={`rounded-2xl shadow-sm border overflow-hidden ${
        mode === "dark" 
          ? "bg-gray-800 border-gray-700" 
          : "bg-white border-gray-100"
      }`}>
        <div className={`px-6 py-4 border-b ${
          mode === "dark" 
            ? "bg-gradient-to-r from-gray-700 to-orange-900/50 border-gray-700" 
            : "bg-gradient-to-r from-gray-50 to-orange-50/50 border-gray-100"
        }`}>
          <h3 className={`text-lg font-bold flex items-center gap-2 ${
            mode === "dark" ? "text-white" : "text-gray-900"
          }`}>
            <Icon icon="solar:flash-bold" className="w-5 h-5 text-orange-600" />
            Quick Actions
          </h3>
        </div>
        <div className="p-6 space-y-3">
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
          <button
            onClick={onDeleteAccount}
            className={`w-full flex items-center justify-center px-4 py-3 border rounded-xl transition-all duration-200 group ${
              mode === "dark" 
                ? "border-red-600 text-red-400 hover:bg-red-900/20 hover:border-red-500" 
                : "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            }`}
          >
            <Icon
              icon="solar:trash-bin-trash-bold"
              className="w-4 h-4 mr-3 text-red-500 group-hover:text-red-600"
            />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
} 