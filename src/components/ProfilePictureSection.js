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
  return (
    <div
      className={`rounded-xl p-6 border mb-6 ${
        mode === "dark"
          ? "bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-800"
          : "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className={`text-lg font-semibold flex items-center gap-2 ${
            mode === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          <Icon icon="solar:gallery-bold" className="w-5 h-5 text-blue-600" />
          Profile Picture
        </h3>
        {formData.avatar_url && (
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-1 rounded-full border ${
                mode === "dark"
                  ? "text-gray-400 bg-gray-700 border-gray-600"
                  : "text-gray-500 bg-white border-gray-300"
              }`}
            >
              {cropTransform ? "Repositioned" : "Original"}
            </span>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onFileUpload}
              disabled={uploadingImage}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Icon icon="solar:upload-bold" className="w-4 h-4" />
              {uploadingImage ? "Uploading..." : "Upload Image"}
            </button>

            {formData.avatar_url && (
              <>
                <button
                  onClick={() => onReposition(formData.avatar_url)}
                  className={`px-4 py-2 border rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md ${
                    mode === "dark"
                      ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon icon="solar:crop-bold" className="w-4 h-4" />
                  Reposition
                </button>

                {cropTransform && (
                  <button
                    onClick={onResetCrop}
                    disabled={uploadingImage}
                    className={`px-4 py-2 border rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2 shadow-sm hover:shadow-md ${
                      mode === "dark"
                        ? "bg-gray-700 border-orange-600 text-orange-400 hover:bg-orange-900/20"
                        : "bg-white border-orange-200 text-orange-600 hover:bg-orange-50"
                    }`}
                  >
                    <Icon icon="solar:refresh-bold" className="w-4 h-4" />
                    {uploadingImage ? "Resetting..." : "Reset"}
                  </button>
                )}

                <button
                  onClick={onRemoveImage}
                  className={`px-4 py-2 border rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md ${
                    mode === "dark"
                      ? "bg-gray-700 border-red-600 text-red-400 hover:bg-red-900/20"
                      : "bg-white border-red-200 text-red-600 hover:bg-red-50"
                  }`}
                >
                  <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4" />
                  Remove
                </button>
              </>
            )}
          </div>

          <p
            className={`text-xs ${
              mode === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Supported: JPEG, PNG, GIF, WebP (max 5MB)
          </p>

          {/* Drag and Drop Upload Area */}
          <div className="mt-4">
            <DragDropUpload
              onFileSelect={onImageSelect}
              disabled={uploadingImage}
              className="max-w-md"
              showPreview={true}
              previewSize="w-16 h-16"
            >
              {({ isDragActive, isDragReject, uploading }) => (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <Icon
                      icon={
                        isDragActive
                          ? "solar:cloud-upload-bold"
                          : "solar:gallery-add-bold"
                      }
                      className={`w-8 h-8 ${
                        isDragActive ? "text-blue-600" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <p
                    className={`text-sm text-center ${
                      mode === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {uploading
                      ? "Uploading..."
                      : isDragActive
                      ? "Drop image here"
                      : "Drag & drop or click to upload"}
                  </p>
                </div>
              )}
            </DragDropUpload>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                mode === "dark"
                  ? "bg-gray-700/50 border-2 border-gray-600"
                  : "bg-gray-100 border-2 border-gray-200"
              }`}
            >
              <Icon
                icon="solar:gallery-bold"
                className={`w-8 h-8 ${
                  mode === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              />
            </div>
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
