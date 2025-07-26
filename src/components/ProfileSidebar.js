import { Icon } from "@iconify/react";

export default function ProfileSidebar({
  user,
  formatDate,
  onLogout,
  onDeleteAccount
}) {
  return (
    <div className="space-y-6">
      {/* Account Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Icon
              icon="solar:info-circle-bold"
              className="w-5 h-5 text-blue-600"
            />
            Account Details
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon
                  icon="mdi:calendar-outline"
                  className="w-4 h-4 text-blue-600"
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(user.created_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon
                  icon="mdi:calendar-outline"
                  className="w-4 h-4 text-blue-600"
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(user.updated_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon
                  icon="mdi:login-variant"
                  className="w-4 h-4 text-blue-600"
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(user.last_login)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-orange-50/50 px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Icon icon="solar:flash-bold" className="w-5 h-5 text-orange-600" />
            Quick Actions
          </h3>
        </div>
        <div className="p-6 space-y-3">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 hover:border-gray-300 group"
          >
            <Icon
              icon="solar:logout-3-bold"
              className="w-4 h-4 mr-3 text-gray-500 group-hover:text-gray-700"
            />
            Sign Out
          </button>
          <button
            onClick={onDeleteAccount}
            className="w-full flex items-center justify-center px-4 py-3 border border-red-200 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 hover:border-red-300 group"
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