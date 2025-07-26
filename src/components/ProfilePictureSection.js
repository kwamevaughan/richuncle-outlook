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
  onImageSelect
}) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Icon icon="solar:gallery-bold" className="w-5 h-5 text-blue-600" />
          Profile Picture
        </h3>
        {formData.avatar_url && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
              {cropTransform ? 'Repositioned' : 'Original'}
            </span>
          </div>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onFileUpload}
              disabled={uploadingImage}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <Icon icon="solar:upload-bold" className="w-4 h-4" />
              {uploadingImage ? 'Uploading...' : 'Upload Image'}
            </button>
            
            {formData.avatar_url && (
              <>
                <button
                  onClick={() => onReposition(formData.avatar_url)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
                >
                  <Icon icon="solar:crop-bold" className="w-4 h-4" />
                  Reposition
                </button>
                
                {cropTransform && (
                  <button
                    onClick={onResetCrop}
                    disabled={uploadingImage}
                    className="px-4 py-2 bg-white border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Icon icon="solar:refresh-bold" className="w-4 h-4" />
                    {uploadingImage ? 'Resetting...' : 'Reset'}
                  </button>
                )}
                
                <button
                  onClick={onRemoveImage}
                  className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200 flex items-center gap-2"
                >
                  <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4" />
                  Remove
                </button>
              </>
            )}
          </div>
          
          <p className="text-xs text-gray-500">
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
                      icon={isDragActive ? "solar:cloud-upload-bold" : "solar:gallery-add-bold"}
                      className={`w-8 h-8 ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`}
                    />
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    {uploading ? 'Uploading...' : isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
                  </p>
                </div>
              )}
            </DragDropUpload>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">Click "Edit Profile" to manage your profile picture</p>
        </div>
      )}
    </div>
  );
} 