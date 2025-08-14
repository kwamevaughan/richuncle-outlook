import { Icon } from "@iconify/react";

export default function ProfileFormSection({
  user,
  formData,
  formErrors,
  isEditing,
  isSubmitting,
  onFormDataChange,
  onSave,
  mode = "light",
}) {
  return (
    <div className="space-y-6">
      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="space-y-2">
          <label
            className={`block text-sm font-semibold flex items-center gap-2 ${
              mode === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <Icon icon="solar:user-bold" className="w-4 h-4" />
            Full Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) =>
                onFormDataChange({ ...formData, full_name: e.target.value })
              }
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                formErrors.full_name
                  ? "border-red-300 bg-red-50"
                  : mode === "dark"
                  ? "border-gray-600 bg-gray-700 text-gray-100 hover:border-gray-500"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              placeholder="Enter your full name"
            />
          ) : (
            <div
              className={`px-4 py-3 rounded-xl border ${
                mode === "dark"
                  ? "bg-gray-700 border-gray-600"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              <p
                className={`font-medium ${
                  mode === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {user.name}
              </p>
            </div>
          )}
          {formErrors.full_name && (
            <p className="text-red-500 text-sm flex items-center gap-1">
              <Icon icon="solar:info-circle-bold" className="w-4 h-4" />
              {formErrors.full_name}
            </p>
          )}
        </div>

        {/* Email - Read Only */}
        <div className="space-y-2">
          <label
            className={`text-sm font-semibold flex items-center gap-2 ${
              mode === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <Icon icon="solar:letter-bold" className="w-4 h-4" />
            Email Address
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                mode === "dark"
                  ? "bg-gray-700 text-gray-400 border border-gray-600"
                  : "bg-gray-100 text-gray-500 border border-gray-200"
              }`}
            >
              Read Only
            </span>
          </label>
          <div
            className={`px-4 py-3 rounded-xl border ${
              mode === "dark"
                ? "bg-gray-700/50 border-gray-600"
                : "bg-gray-50 border-gray-100"
            }`}
          >
            <p
              className={`font-medium flex items-center gap-2 ${
                mode === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {user.email}
              <Icon
                icon="solar:lock-keyhole-bold"
                className={`w-4 h-4 ${
                  mode === "dark" ? "text-gray-500" : "text-gray-400"
                }`}
              />
            </p>
          </div>
          <p
            className={`text-xs ${
              mode === "dark" ? "text-gray-500" : "text-gray-500"
            }`}
          >
            Email address cannot be changed for security reasons
          </p>
        </div>
      </div>

      {/* Save Button */}
      {isEditing && (
        <div
          className={`pt-6 border-t ${
            mode === "dark" ? "border-gray-700" : "border-gray-100"
          }`}
        >
          <button
            onClick={onSave}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Icon
                  icon="solar:loading-bold"
                  className="w-5 h-5 animate-spin"
                />
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
  );
}
