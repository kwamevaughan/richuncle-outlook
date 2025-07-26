import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';

export default function DragDropUpload({
  onFileSelect,
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
  },
  maxSize = 5 * 1024 * 1024, // 5MB default
  maxFiles = 1,
  disabled = false,
  className = '',
  children,
  showPreview = true,
  previewSize = 'w-16 h-16',
  folder = 'uploads',
  userName = 'user',
  referralCode = 'default'
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => {
        const errorMessages = errors.map(error => {
          switch (error.code) {
            case 'file-too-large':
              return `File ${file.name} is too large. Max size is ${Math.round(maxSize / 1024 / 1024)}MB`;
            case 'file-invalid-type':
              return `File ${file.name} has an invalid type`;
            case 'too-many-files':
              return `Too many files. Max is ${maxFiles}`;
            default:
              return `Error with file ${file.name}`;
          }
        });
        return errorMessages.join(', ');
      });
      
      errors.forEach(error => toast.error(error));
      return;
    }

    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Create preview if enabled
    if (showPreview) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }

    // Call the onFileSelect callback
    if (onFileSelect) {
      onFileSelect(file);
    }
  }, [onFileSelect, maxSize, maxFiles, showPreview]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    disabled: disabled || uploading
  });

  const getBorderColor = () => {
    if (isDragReject) return 'border-red-400 bg-red-50';
    if (isDragActive) return 'border-blue-400 bg-blue-50';
    return 'border-gray-300 bg-gray-50 hover:bg-gray-100';
  };

  const getTextColor = () => {
    if (isDragReject) return 'text-red-600';
    if (isDragActive) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${getBorderColor()}
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {children ? (
          children({ isDragActive, isDragReject, uploading })
        ) : (
          <div className="space-y-3">
            {showPreview && preview ? (
              <div className="flex justify-center">
                <div className={`${previewSize} rounded-lg overflow-hidden border border-gray-200`}>
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <Icon
                  icon={isDragActive ? "mdi:cloud-upload" : "mdi:cloud-upload-outline"}
                  className={`w-12 h-12 ${getTextColor()}`}
                />
              </div>
            )}
            
            <div className={`text-sm font-medium ${getTextColor()}`}>
              {uploading ? (
                <div className="flex items-center justify-center gap-2">
                  <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                  Uploading...
                </div>
              ) : isDragActive ? (
                isDragReject ? (
                  'File type not supported'
                ) : (
                  'Drop the file here'
                )
              ) : (
                <div>
                  <p>Drag & drop a file here, or click to select</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supported: JPEG, PNG, GIF, WebP (max {Math.round(maxSize / 1024 / 1024)}MB)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 