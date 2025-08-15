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
      // Create a preview URL for the cropper
      const previewUrl = URL.createObjectURL(file);
      
      // Upload the new image
      const { fileUrl, fileId } = await uploadImage(
        file,
        user.name || 'user',
        user.id || 'profile',
        'ProfilePictures'
      );

      // Delete the old avatar if it exists
      if (user.avatar_file_id) {
        try {
          await deleteImage(user.avatar_file_id);
        } catch (error) {
          console.warn('Failed to delete previous avatar:', error);
        }
      }

      // Update user state with the new file ID and clear any existing crop data
      setUser(prev => ({
        ...prev,
        avatar_url: fileUrl, // Set the new URL immediately
        avatar_file_id: fileId,
        crop_transform: null
      }));
      
      // Set the selected image for the cropper
      setSelectedImage({
        previewUrl: previewUrl,
        uploadedUrl: fileUrl,
        fileId: fileId
      });
      
      setShowCropper(true);
    } catch (error) {
      toast.error('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleReposition = (imageUrl) => {
    console.log('Repositioning image:', imageUrl);
    if (!imageUrl) {
      console.error('No image URL provided for repositioning');
      return;
    }
    // Use the clean URL without any transformations for repositioning
    const baseUrl = imageUrl.split('?')[0];
    console.log('Using base URL for repositioning:', baseUrl);
    
    setSelectedImage({ 
      previewUrl: baseUrl, 
      uploadedUrl: baseUrl,
      isExisting: true 
    });
    setShowCropper(true);
  };

  const handleResetCrop = async () => {
    if (!user.avatar_file_id) return;
    
    setUploading(true);
    try {
      // Clear the crop transform data
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          crop_transform: null,
          avatar_file_id: user.avatar_file_id
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      // Get the clean image URL without any transformations
      const cleanUrl = user.avatar_url.split('?')[0];
      
      // Update the user state with the clean URL and no crop transform
      setUser(prev => ({
        ...prev,
        avatar_url: cleanUrl,
        crop_transform: null
      }));
      
      // Also update form data
      setFormData(prev => ({
        ...prev,
        avatar_url: cleanUrl
      }));
      
      toast.success('Image crop reset successfully');
    } catch (error) {
      console.error('Error resetting crop:', error);
      toast.error('Failed to reset image crop');
    } finally {
      setUploading(false);
    }
  };

  const handleCroppedImage = async (cropData) => {
    setShowCropper(false);
    if (!cropData) return;

    setUploading(true);
    try {
      // Get the base URL of the newly uploaded image
      const baseUrl = selectedImage?.uploadedUrl || user.avatar_url.split('?')[0];
      
      // Create a clean base URL without any existing transformations
      const cleanBaseUrl = baseUrl.split('?')[0];
      
      // Create transformation parameters
      const transformations = [
        'w-200',
        'h-200',
        'c-at_max',
        'fo-auto',
        `x-${Math.round(cropData.x)}`,
        `y-${Math.round(cropData.y)}`,
        `w-${Math.round(cropData.width)}`,
        `h-${Math.round(cropData.height)}`,
        `t-${Date.now()}`  // Cache buster
      ].join(',');
      
      // Create the transformed URL with cache buster
      const transformedUrl = `${cleanBaseUrl}?tr=${transformations}&v=${Date.now()}`;
      
      // Save the crop data and update the avatar URL
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          avatar_url: cleanBaseUrl, // Store the clean URL in the database
          crop_transform: cropData, 
          avatar_file_id: user.avatar_file_id 
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      // Create a new user object with updated data
      const updatedUser = {
        ...user,
        avatar_url: transformedUrl, // Use the transformed URL for display
        crop_transform: cropData
      };
      
      // Update both user and form data
      setUser(updatedUser);
      setFormData(prev => ({
        ...prev,
        avatar_url: transformedUrl
      }));
      
      // Force a re-render with a new URL to prevent caching
      setTimeout(() => {
        const finalUrl = `${cleanBaseUrl}?tr=${transformations}&v=${Date.now()}`;
        setUser(prev => ({
          ...prev,
          avatar_url: finalUrl
        }));
      }, 100);
      
      toast.success('Profile picture updated successfully');
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
    handleResetCrop,
    handleCroppedImage,
    handleRemoveImage,
  };
}
