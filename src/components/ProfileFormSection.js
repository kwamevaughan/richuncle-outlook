import { Icon } from "@iconify/react";

export default function ProfileFormSection({
  user,
  formData,
  formErrors,
  isEditing,
  isSubmitting,
  onFormDataChange,
  onSave
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 px-8 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Icon icon="solar:user-id-bold" className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
            <p className="text-gray-600 text-sm">Manage your personal details</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Icon icon="solar:user-bold" className="w-4 h-4" />
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => onFormDataChange({ ...formData, full_name: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  formErrors.full_name ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"
                }`}
                placeholder="Enter your full name"
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-900 font-medium">{user.name}</p>
              </div>
            )}
            {formErrors.full_name && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <Icon icon="solar:info-circle-bold" className="w-4 h-4" />
                {formErrors.full_name}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Icon icon="solar:letter-bold" className="w-4 h-4" />
              Email Address
            </label>
            {isEditing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  formErrors.email ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"
                }`}
                placeholder="Enter your email"
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-900 font-medium">{user.email}</p>
              </div>
            )}
            {formErrors.email && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <Icon icon="solar:info-circle-bold" className="w-4 h-4" />
                {formErrors.email}
              </p>
            )}
          </div>
        </div>

        {/* Store Assignment */}
        {user.store_id && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Icon icon="solar:shop-bold" className="w-4 h-4" />
              Assigned Store
            </label>
            <div className="px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-blue-900 font-medium flex items-center gap-2">
                <Icon icon="solar:shop-bold" className="w-4 h-4" />
                Store ID: {user.store_id}
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        {isEditing && (
          <div className="pt-6 border-t border-gray-100">
            <button
              onClick={onSave}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Icon icon="solar:loading-bold" className="w-5 h-5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Icon icon="solar:check-circle-bold" className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 