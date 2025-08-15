import { Icon } from "@iconify/react";
import DragDropUpload from "./DragDropUpload";

export default function ProfilePictureSection({
  user,
  formData,
  cropTransform,
  isEditing,
  uploadingImage,
  onFileUpload,
  onReposition,
  onResetCrop,
  onRemoveImage,
  onImageSelect,
  mode = "light",
}) {
  // Get the avatar URL from formData or fall back to user.avatar_url
  const avatarUrl = formData?.avatar_url || user?.avatar_url;
  
  
  // Show simplified view when not in edit mode
  if (!isEditing) {
    if (!avatarUrl) return null; // Don't show anything if no avatar exists and not in edit mode
    
    return (
      <div className="rounded-xl p-6 mb-6 bg-white/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 dark:text-white text-gray-900">
            <Icon icon="solar:gallery-bold" className="w-5 h-5 text-blue-500" />
            Profile Picture
          </h3>
        </div>
        <div className="flex justify-center">
          <img
            src={avatarUrl}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/default-avatar.png';
            }}
          />
        </div>
      </div>
    );
  }

  // Full edit mode
  return (
    <div
      className={`rounded-xl p-6 mb-6 ${
        mode === "dark"
          ? "bg-gray-800/50 border border-gray-700"
          : "bg-white border border-gray-200/80 shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className={`text-lg font-semibold flex items-center gap-2 ${
            mode === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          <Icon icon="solar:gallery-bold" className="w-5 h-5 text-blue-500" />
          Profile Picture
        </h3>
        {formData.avatar_url && (
          <span
            className={`text-xs px-2.5 py-1 rounded-md font-medium ${
              mode === "dark"
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {cropTransform ? "Repositioned" : "Original"}
          </span>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {/* Profile Image Preview */}
          {formData.avatar_url && (
            <div className="flex justify-center mb-4">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    // Fallback to a default avatar if image loading fails
                    e.target.onerror = null;
                    e.target.src = '/images/default-avatar.png';
                  }}
                />
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={(e) => {
                  console.log('Upload button clicked');
                  onFileUpload?.(e);
                }}
                disabled={uploadingImage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                <Icon icon="solar:upload-bold" className="w-4 h-4" />
                {uploadingImage ? "Uploading..." : "Upload Image"}
              </button>

              {/* Action buttons - always show in edit mode */}
              <button
                onClick={() => {
                  console.log('Reposition button clicked, URL:', avatarUrl);
                  onReposition?.(avatarUrl);
                }}
                disabled={!avatarUrl || uploadingImage}
                className={`px-4 py-2 border rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-sm ${
                  !avatarUrl || uploadingImage
                    ? 'opacity-50 cursor-not-allowed'
                    : mode === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon icon="solar:crop-bold" className="w-4 h-4" />
                Reposition
              </button>

              <button
                onClick={() => {
                  console.log('Reset crop button clicked');
                  onResetCrop?.();
                }}
                disabled={!cropTransform || uploadingImage || !avatarUrl}
                className={`px-4 py-2 border rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-sm ${
                  !cropTransform || !avatarUrl || uploadingImage
                    ? 'opacity-50 cursor-not-allowed'
                    : mode === "dark"
                    ? "bg-transparent border-orange-500 text-orange-400 hover:bg-orange-500/10"
                    : "bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100"
                }`}
              >
                <Icon icon="solar:refresh-bold" className="w-4 h-4" />
                {uploadingImage ? "Resetting..." : "Reset"}
              </button>

              <button
                onClick={() => {
                  console.log('Remove button clicked');
                  onRemoveImage?.();
                }}
                disabled={!avatarUrl || uploadingImage}
                className={`px-4 py-2 border rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-sm ${
                  !avatarUrl || uploadingImage
                    ? 'opacity-50 cursor-not-allowed'
                    : mode === "dark"
                    ? "bg-transparent border-red-500 text-red-400 hover:bg-red-500/10"
                    : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                }`}
              >
                <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4" />
                Remove
              </button>
            </div>
          </div>

          <p
            className={`text-xs ${
              mode === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Supported: JPEG, PNG, GIF, WebP (max 5MB)
          </p>

          <div className="mt-4">
            <DragDropUpload
              onFileSelect={onImageSelect}
              disabled={uploadingImage}
              className="w-full"
              showPreview={false}
            >
              {({ isDragActive }) => (
                <div
                  className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors duration-200 ${
                    mode === "dark"
                      ? isDragActive
                        ? "border-blue-500 bg-gray-700/50"
                        : "border-gray-600 hover:border-gray-500"
                      : isDragActive
                      ? "border-blue-500 bg-blue-50/50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <Icon
                    icon="solar:gallery-add-bold-duotone"
                    className={`w-8 h-8 mb-2 ${
                      mode === "dark" ? "text-gray-500" : "text-gray-400"
                    }`}
                  />
                  <p
                    className={`text-sm font-medium ${
                      mode === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Drag & drop or click to upload
                  </p>
                </div>
              )}
            </DragDropUpload>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="flex flex-col items-center gap-4">
            {formData.avatar_url ? (
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/default-avatar.png';
                  }}
                />
              </div>
            ) : (
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center ${
                  mode === "dark"
                    ? "bg-gray-700/50 border-2 border-gray-600"
                    : "bg-gray-100 border-2 border-gray-200"
                }`}
              >
                <Icon
                  icon="solar:gallery-bold"
                  className={`w-10 h-10 ${
                    mode === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                />
              </div>
            )}
            <div className="text-center">
              <p
                className={`text-sm font-medium ${
                  mode === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Profile Picture Management
              </p>
              <p
                className={`text-xs mt-1 ${
                  mode === "dark" ? "text-gray-500" : "text-gray-500"
                }`}
              >
                Click "Edit Profile" to manage your profile picture
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
