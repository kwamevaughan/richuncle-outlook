import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { uploadImage, deleteImage } from '@/utils/imageKitService';

export function useAvatarManagement(user, setUser, setFormData) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const triggerFileUpload = () => fileInputRef.current?.click();

  const handleImageSelect = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { fileUrl, fileId } = await uploadImage(
        file,
        user.name || 'user',
        user.id || 'profile',
        'ProfilePictures'
      );

      if (user.avatar_file_id) {
        try {
          await deleteImage(user.avatar_file_id);
        } catch (error) {
          console.warn('Failed to delete previous avatar:', error);
        }
      }

      setUser((prev) => ({ ...prev, avatar_file_id: fileId, crop_transform: null }));
      setSelectedImage({ previewUrl: URL.createObjectURL(file), uploadedUrl: fileUrl });
      setShowCropper(true);
    } catch (error) {
      toast.error('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleReposition = () => {
    if (!user.avatar_url) return;
    const baseUrl = user.avatar_url.split('?')[0];
    setSelectedImage({ previewUrl: baseUrl, isExisting: true });
    setShowCropper(true);
  };

  const handleCroppedImage = async (cropData) => {
    setShowCropper(false);
    if (!cropData) return;

    setUploading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crop_transform: cropData, avatar_file_id: user.avatar_file_id }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      const transformedUrl = `${user.avatar_url.split('?')[0]}?tr=w-200,h-200,c-crop,x-${Math.round(cropData.x)},y-${Math.round(cropData.y)},w-${Math.round(cropData.width)},h-${Math.round(cropData.height)}`;

      setUser((prev) => ({ ...prev, avatar_url: transformedUrl, crop_transform: cropData }));
      setFormData((prev) => ({ ...prev, avatar_url: transformedUrl }));
      toast.success('Profile picture updated.');
    } catch (error) {
      toast.error('Failed to save image positioning.');
    } finally {
      setUploading(false);
      if (selectedImage?.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(selectedImage.previewUrl);
      }
      setSelectedImage(null);
    }
  };

  const handleRemoveImage = async () => {
    setUploading(true);
    try {
      if (user.avatar_file_id) {
        await deleteImage(user.avatar_file_id);
      }
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: '', avatar_file_id: null, crop_transform: null }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      setUser((prev) => ({ ...prev, avatar_url: '', avatar_file_id: null, crop_transform: null }));
      setFormData((prev) => ({ ...prev, avatar_url: '' }));
      toast.success('Profile picture removed.');
    } catch (error) {
      toast.error('Failed to remove image.');
    } finally {
      setUploading(false);
    }
  };

  return {
    fileInputRef,
    uploading,
    showCropper,
    selectedImage,
    setShowCropper,
    setSelectedImage,
    triggerFileUpload,
    handleImageSelect,
    handleReposition,
    handleCroppedImage,
    handleRemoveImage,
  };
}
