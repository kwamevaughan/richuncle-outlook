import { Icon } from "@iconify/react";

export default function ProfileHeader({ 
  user, 
  isEditing, 
  uploadingImage, 
  onEditToggle, 
  onFileUpload, 
  onManageUsers,
  mode = "light"
}) {
  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-6">
          {/* Large Profile Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg ring-4 ring-white">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-24 h-24 rounded-2xl object-cover"
                />
              ) : (
                <Icon icon="carbon:no-image" className="w-12 h-12 text-white" />
              )}
            </div>
            {isEditing && (
              <button
                onClick={onFileUpload}
                disabled={uploadingImage}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 group-hover:scale-105"
                title="Upload new profile picture"
              >
                {uploadingImage ? (
                  <Icon
                    icon="solar:loading-bold"
                    className="w-4 h-4 animate-spin"
                  />
                ) : (
                  <Icon icon="solar:camera-bold" className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* User Info */}
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${
              mode === "dark" 
                ? "bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent" 
                : "bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
            }`}>
              {user.name}
            </h1>
            <p className={`text-lg mb-3 flex items-center gap-2 ${
              mode === "dark" ? "text-gray-300" : "text-gray-600"
            }`}>
              <Icon icon="solar:letter-bold" className="w-4 h-4" />
              {user.email}
            </p>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  user.role === "admin"
                    ? "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-200"
                    : user.role === "manager"
                    ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-200"
                    : "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-200"
                }`}
              >
                <Icon
                  icon={
                    user.role === "admin"
                      ? "solar:crown-bold"
                      : user.role === "manager"
                      ? "solar:user-id-bold"
                      : "solar:user-bold"
                  }
                  className="w-4 h-4 mr-1"
                />
                {user.role}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  user.is_active
                    ? "bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border border-green-200"
                    : "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-200"
                }`}
              >
                <Icon
                  icon={
                    user.is_active
                      ? "solar:check-circle-bold"
                      : "solar:close-circle-bold"
                  }
                  className="w-4 h-4 mr-1"
                />
                {user.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onEditToggle}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              isEditing
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            }`}
          >
            <Icon
              icon={isEditing ? "solar:close-circle-bold" : "solar:pen-bold"}
              className="w-4 h-4 mr-2"
            />
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>

          <button
            className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
            onClick={onManageUsers}
          >
            <Icon icon="solar:users-group-rounded-bold" className="w-4 h-4" />
            Manage Users
          </button>
        </div>
      </div>
    </div>
  );
} 