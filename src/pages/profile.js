import { useState, useEffect, useRef } from "react";
import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import SimpleModal from "@/components/SimpleModal";
import { useRouter } from "next/router";
import { uploadImage, deleteImage } from "@/utils/imageKitService";
import ImageCropper from "@/components/ImageCropper";

// Import new components
import ProfileHeader from "@/components/ProfileHeader";
import ProfilePictureSection from "@/components/ProfilePictureSection";
import ProfileFormSection from "@/components/ProfileFormSection";
import StoreAssignmentSection from "@/components/StoreAssignmentSection";
import PasswordSection from "@/components/PasswordSection";
import ProfileSidebar from "@/components/ProfileSidebar";
import BiometricAuthSection from "@/components/BiometricAuthSection";

export default function ProfilePage({ mode = "light", toggleMode, ...props }) {
  const {
    user: cachedUser,
    loading: userLoading,
    LoadingComponent,
  } = useUser();
  const { handleLogout } = useLogout();
  const router = useRouter();

  // State for fresh user data
  const [user, setUser] = useState(null);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [storeData, setStoreData] = useState(null);

  // File upload states
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentAvatarFileId, setCurrentAvatarFileId] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  // Crop transformation states
  const [cropTransform, setCropTransform] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState(null);

  // Form states
  const [formData, setFormData] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // UI states
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  // Modal states
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Fetch fresh user data and store information
  useEffect(() => {
    const fetchUserData = async () => {
      if (!cachedUser) return;

      try {
        setLoadingUserData(true);
        const response = await fetch(`/api/users/${cachedUser.id}`);
        const result = await response.json();

        if (result.success) {
          console.log("Profile API Response:", {
            last_login: result.data.last_login,
            updated_at: result.data.updated_at,
            created_at: result.data.created_at,
          });

          const freshUserData = {
            ...cachedUser,
            last_login: result.data.last_login,
            updated_at: result.data.updated_at,
            avatar_file_id: result.data.avatar_file_id,
            crop_transform: result.data.crop_transform,
            store_id: result.data.store_id,
            phone_number: result.data.phone_number,
            date_of_birth: result.data.date_of_birth,
            address: result.data.address,
            emergency_contact_name: result.data.emergency_contact_name,
            emergency_contact_phone: result.data.emergency_contact_phone,
            emergency_contact_relationship:
              result.data.emergency_contact_relationship,
          };
          setUser(freshUserData);
          setCurrentAvatarFileId(result.data.avatar_file_id);

          // Set crop transformation data if it exists
          if (result.data.crop_transform) {
            setCropTransform(result.data.crop_transform);
          }

          // Set original image URL (this will be the base URL without transformations)
          setOriginalImageUrl(result.data.avatar_url);

          // Fetch store data if user has a store_id
          if (result.data.store_id) {
            try {
              const storesResponse = await fetch("/api/stores");
              const storesResult = await storesResponse.json();
              if (storesResult.success) {
                const userStore = storesResult.data.find(
                  (store) => store.id === result.data.store_id,
                );
                setStoreData(userStore);
              }
            } catch (storeError) {
              console.error("Error fetching store data:", storeError);
            }
          }

          // Update form data
          setFormData({
            full_name: freshUserData.name || "",
            email: freshUserData.email || "",
            avatar_url: freshUserData.avatar_url || "",
            phone_number: freshUserData.phone_number || "",
            date_of_birth: freshUserData.date_of_birth || "",
            address: freshUserData.address || "",
            emergency_contact_name: freshUserData.emergency_contact_name || "",
            emergency_contact_phone:
              freshUserData.emergency_contact_phone || "",
            emergency_contact_relationship:
              freshUserData.emergency_contact_relationship || "",
          });
        } else {
          setUser(cachedUser);
          setCurrentAvatarFileId(cachedUser.avatar_file_id);
          setFormData({
            full_name: cachedUser.name || "",
            email: cachedUser.email || "",
            avatar_url: cachedUser.avatar_url || "",
            phone_number: cachedUser.phone_number || "",
            date_of_birth: cachedUser.date_of_birth || "",
            address: cachedUser.address || "",
            emergency_contact_name: cachedUser.emergency_contact_name || "",
            emergency_contact_phone: cachedUser.emergency_contact_phone || "",
            emergency_contact_relationship:
              cachedUser.emergency_contact_relationship || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser(cachedUser);
        setCurrentAvatarFileId(cachedUser.avatar_file_id);
        setFormData({
          full_name: cachedUser.name || "",
          email: cachedUser.email || "",
          avatar_url: cachedUser.avatar_url || "",
          phone_number: cachedUser.phone_number || "",
          date_of_birth: cachedUser.date_of_birth || "",
          address: cachedUser.address || "",
          emergency_contact_name: cachedUser.emergency_contact_name || "",
          emergency_contact_phone: cachedUser.emergency_contact_phone || "",
          emergency_contact_relationship:
            cachedUser.emergency_contact_relationship || "",
        });
      } finally {
        setLoadingUserData(false);
      }
    };

    fetchUserData();
  }, [cachedUser]);

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.full_name.trim()) {
      errors.full_name = "Full name is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      console.log("Updating profile with avatar_file_id:", currentAvatarFileId);

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          avatar_url: formData.avatar_url,
          avatar_file_id: currentAvatarFileId,
          phone_number: formData.phone_number,
          date_of_birth: formData.date_of_birth,
          address: formData.address,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          emergency_contact_relationship:
            formData.emergency_contact_relationship,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Profile updated successfully");
        setIsEditing(false);
        // Update local user data and state
        const updatedUser = {
          ...user,
          name: formData.full_name,
          avatar_url: formData.avatar_url,
          avatar_file_id: currentAvatarFileId,
          phone_number: formData.phone_number,
          date_of_birth: formData.date_of_birth,
          address: formData.address,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          emergency_contact_relationship:
            formData.emergency_contact_relationship,
        };

        // Update localStorage
        localStorage.setItem("ruo_user_data", JSON.stringify(updatedUser));

        // Update local state to reflect changes immediately
        setUser(updatedUser);

        // Update form data to reflect the saved values
        setFormData({
          ...formData,
          full_name: formData.full_name,
          avatar_url: formData.avatar_url,
          phone_number: formData.phone_number,
          date_of_birth: formData.date_of_birth,
          address: formData.address,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          emergency_contact_relationship:
            formData.emergency_contact_relationship,
        });
      } else {
        throw new Error(result.error || "Failed to update profile");
      }
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/users/${user.id}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Password changed successfully");
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        throw new Error(result.error || "Failed to change password");
      }
    } catch (err) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image selection (before cropping)
  const handleImageSelect = async (file) => {
    if (!file) return;

    setUploadingImage(true);

    try {
      // First, upload the original image to ImageKit
      console.log("Uploading original image to ProfilePictures folder");
      const { fileUrl, fileId } = await uploadImage(
        file,
        user.name || "user",
        user.id || "profile",
        "ProfilePictures",
      );

      console.log("Original image uploaded successfully:", { fileUrl, fileId });

      // Delete previous avatar if exists
      if (currentAvatarFileId) {
        console.log(
          "Deleting previous avatar with fileId:",
          currentAvatarFileId,
        );
        try {
          await deleteImage(currentAvatarFileId);
          console.log("Previous avatar deleted successfully");
        } catch (error) {
          console.warn("Failed to delete previous avatar:", error);
          // Continue even if deletion fails
        }
      }

      // Update the original image URL and file ID
      setOriginalImageUrl(fileUrl);
      setCurrentAvatarFileId(fileId);

      // Create a preview URL for the cropper
      const previewUrl = URL.createObjectURL(file);
      setSelectedImageFile({ file, previewUrl, uploadedUrl: fileUrl });
      setShowCropper(true);
    } catch (error) {
      console.error("Failed to upload original image:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Generate transformed image URL using ImageKit transformations
  const generateTransformedImageUrl = (originalUrl, transformData) => {
    if (!originalUrl || !transformData) return originalUrl;

    // Create ImageKit transformation parameters
    const transformations = [];

    // Add crop transformation
    if (transformData.width && transformData.height) {
      transformations.push({
        width: Math.round(transformData.width),
        height: Math.round(transformData.height),
        x: Math.round(transformData.x),
        y: Math.round(transformData.y),
        crop: "crop",
      });
    }

    // Add rotation if needed
    if (transformData.rotation && transformData.rotation !== 0) {
      transformations.push({
        rotation: transformData.rotation,
      });
    }

    // Add resize to final size
    transformations.push({
      width: 200,
      height: 200,
      crop: "crop",
    });

    // Convert transformations to ImageKit URL format
    const transformString = transformations
      .map((t) => {
        const params = Object.entries(t)
          .map(([key, value]) => `${key}-${value}`)
          .join(",");
        return `tr:${params}`;
      })
      .join("/");

    // Add transformations to URL
    const separator = originalUrl.includes("?") ? "&" : "?";
    return `${originalUrl}${separator}${transformString}`;
  };

  // Handle repositioning existing image
  const handleRepositionImage = (imageUrl) => {
    if (!imageUrl) return;

    // Use the original image URL (without transformations) for repositioning
    const baseImageUrl = originalImageUrl || imageUrl;

    // For existing images, we'll use the URL directly
    setSelectedImageFile({
      file: null,
      previewUrl: baseImageUrl,
      isExistingImage: true,
    });
    setShowCropper(true);
  };

  // Handle cropped image - now stores transformation parameters instead of uploading new image
  const handleCroppedImage = async (cropData) => {
    setShowCropper(false);

    // If no crop data is returned, cropping was not applied (CORS issue)
    if (!cropData) {
      toast(
        "Image repositioning was not applied due to browser security restrictions. You can still upload a new image.",
      );
      // Clean up preview URL only if it's a blob URL (not an existing image URL)
      if (
        selectedImageFile?.previewUrl &&
        selectedImageFile?.previewUrl.startsWith("blob:")
      ) {
        URL.revokeObjectURL(selectedImageFile.previewUrl);
      }
      setSelectedImageFile(null);
      return;
    }

    setUploadingImage(true);

    try {
      // Store the crop transformation parameters
      const transformData = {
        x: cropData.x,
        y: cropData.y,
        width: cropData.width,
        height: cropData.height,
        scale: cropData.scale,
        rotation: cropData.rotation,
        originalWidth: cropData.originalWidth,
        originalHeight: cropData.originalHeight,
      };

      console.log("Storing crop transformation data:", transformData);

      // Prepare update data
      const updateData = {
        crop_transform: transformData,
      };

      // If this is a new image upload, also update the avatar_file_id
      if (selectedImageFile?.uploadedUrl) {
        updateData.avatar_file_id = currentAvatarFileId;
      }

      // Update the user's crop transformation in the database
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to save crop transformation");
      }

      const result = await response.json();

      if (result.success) {
        // Update local state
        setCropTransform(transformData);

        // Generate the transformed image URL using ImageKit transformations
        // Use the uploaded URL if this is a new image, otherwise use the original URL
        const baseUrl = selectedImageFile?.uploadedUrl || originalImageUrl;
        const transformedUrl = generateTransformedImageUrl(
          baseUrl,
          transformData,
        );

        // Update form data and user state immediately
        setFormData((prev) => ({
          ...prev,
          avatar_url: transformedUrl,
        }));

        // Update user state to show the transformed image immediately
        setUser((prev) => ({
          ...prev,
          avatar_url: transformedUrl,
          avatar_file_id: selectedImageFile?.uploadedUrl
            ? currentAvatarFileId
            : prev.avatar_file_id,
          crop_transform: transformData,
        }));

        toast.success("Profile picture repositioned successfully");
      } else {
        throw new Error(result.error || "Failed to save transformation");
      }
    } catch (error) {
      console.error("Failed to save crop transformation:", error);
      toast.error("Failed to save image positioning. Please try again.");
    } finally {
      setUploadingImage(false);
      // Clean up preview URL only if it's a blob URL (not an existing image URL)
      if (
        selectedImageFile?.previewUrl &&
        selectedImageFile?.previewUrl.startsWith("blob:")
      ) {
        URL.revokeObjectURL(selectedImageFile.previewUrl);
      }
      setSelectedImageFile(null);
    }
  };

  // Reset crop transformation (return to original image)
  const handleResetCrop = async () => {
    if (!cropTransform) return;

    setUploadingImage(true);

    try {
      // Remove crop transformation from database
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          crop_transform: null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reset crop transformation");
      }

      const result = await response.json();

      if (result.success) {
        // Update local state
        setCropTransform(null);

        // Use the original image URL (without transformations)
        const originalUrl = originalImageUrl || user.avatar_url;

        // Update form data and user state
        setFormData((prev) => ({
          ...prev,
          avatar_url: originalUrl,
        }));

        setUser((prev) => ({
          ...prev,
          avatar_url: originalUrl,
          crop_transform: null,
        }));

        toast.success("Profile picture reset to original");
      } else {
        throw new Error(result.error || "Failed to reset transformation");
      }
    } catch (error) {
      console.error("Failed to reset crop transformation:", error);
      toast.error("Failed to reset image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle remove image
  const handleRemoveImage = async () => {
    if (currentAvatarFileId) {
      try {
        await deleteImage(currentAvatarFileId);
      } catch (error) {
        console.warn("Failed to delete avatar from ImageKit:", error);
      }
    }

    setFormData((prev) => ({ ...prev, avatar_url: "" }));
    setCurrentAvatarFileId(null);
    setUser((prev) => ({ ...prev, avatar_url: "", avatar_file_id: null }));
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (userLoading && LoadingComponent) return LoadingComponent;
  if (!cachedUser) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  if (loadingUserData) {
    return (
      <MainLayout
        mode={mode}
        user={cachedUser}
        toggleMode={toggleMode}
        onLogout={handleLogout}
        {...props}
      >
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div
                className={`flex items-center gap-2 ${
                  mode === "dark" ? "text-blue-400" : "text-blue-600"
                }`}
              >
                <Icon
                  icon="solar:loading-bold"
                  className="animate-spin w-5 h-5"
                />
                Loading profile data...
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      mode={mode}
      user={user}
      toggleMode={toggleMode}
      onLogout={handleLogout}
      {...props}
    >
      <div
        className={`flex-1 min-h-screen ${
          mode === "dark"
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900/30"
            : "bg-gradient-to-br from-gray-50 via-white to-blue-50/30"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Profile Header */}
          <ProfileHeader
            user={user}
            isEditing={isEditing}
            uploadingImage={uploadingImage}
            onEditToggle={() => setIsEditing(!isEditing)}
            onFileUpload={triggerFileUpload}
            onManageUsers={() => router.push("/users")}
            mode={mode}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 xl:col-span-3 space-y-6">
              {/* Profile Information Card */}
              <div
                className={`rounded-2xl shadow-lg border overflow-hidden backdrop-blur-sm ${
                  mode === "dark"
                    ? "bg-gray-800/90 border-gray-700/50 shadow-gray-900/20"
                    : "bg-white/90 border-gray-200/50 shadow-gray-900/10"
                }`}
              >
                <div
                  className={`px-6 sm:px-8 py-6 border-b ${
                    mode === "dark"
                      ? "bg-gradient-to-r from-gray-700/80 to-blue-900/40 border-gray-700/50"
                      : "bg-gradient-to-r from-gray-50/80 to-blue-50/40 border-gray-200/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Icon
                        icon="solar:user-id-bold"
                        className="w-5 h-5 text-white"
                      />
                    </div>
                    <div>
                      <h2
                        className={`text-xl font-bold ${
                          mode === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Profile Information
                      </h2>
                      <p
                        className={`text-sm ${
                          mode === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Manage your personal details and store assignment
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative p-6 sm:p-8 space-y-8">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-4 right-4">
                      <Icon
                        icon="solar:user-id-bold"
                        className="w-24 h-24 text-blue-500"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    {/* Profile Picture Section - Only show when editing */}
                    {isEditing && (
                      <ProfilePictureSection
                        user={user}
                        formData={formData}
                        cropTransform={cropTransform}
                        isEditing={isEditing}
                        uploadingImage={uploadingImage}
                        onFileUpload={triggerFileUpload}
                        onReposition={handleRepositionImage}
                        onResetCrop={handleResetCrop}
                        onRemoveImage={handleRemoveImage}
                        onImageSelect={handleImageSelect}
                        mode={mode}
                      />
                    )}

                    {/* Profile Form Section */}
                    <ProfileFormSection
                      user={user}
                      formData={formData}
                      formErrors={formErrors}
                      isEditing={isEditing}
                      isSubmitting={isSubmitting}
                      onFormDataChange={setFormData}
                      onSave={handleUpdateProfile}
                      mode={mode}
                    />
                  </div>
                </div>
              </div>

              {/* Store Assignment Section */}
              <StoreAssignmentSection
                user={user}
                storeData={storeData}
                mode={mode}
              />

              {/* Password Section */}
              <PasswordSection
                isChangingPassword={isChangingPassword}
                passwordData={passwordData}
                passwordErrors={passwordErrors}
                showPassword={showPassword}
                isSubmitting={isSubmitting}
                onTogglePassword={togglePasswordVisibility}
                onPasswordDataChange={setPasswordData}
                onToggleChangePassword={() =>
                  setIsChangingPassword(!isChangingPassword)
                }
                onSavePassword={handleChangePassword}
                mode={mode}
              />

              {/* Biometric Authentication Section */}
              <BiometricAuthSection user={user} mode={mode} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 xl:col-span-1">
              <div className="sticky top-6">
                <ProfileSidebar
                  user={user}
                  formatDate={formatDate}
                  onLogout={() => setShowLogoutModal(true)}
                  mode={mode}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <SimpleModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Sign Out"
        size="sm"
        mode={mode}
      >
        <div className="p-6">
          <div className="mb-4">
            <p
              className={`${
                mode === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Are you sure you want to sign out?
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowLogoutModal(false)}
              className={`px-4 py-2 border rounded-lg transition-colors ${
                mode === "dark"
                  ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </SimpleModal>

      {/* Image Cropper Modal */}
      {showCropper && selectedImageFile && (
        <ImageCropper
          imageSrc={selectedImageFile.previewUrl}
          onCrop={handleCroppedImage}
          onCancel={() => {
            setShowCropper(false);
            // Clean up preview URL only if it's a blob URL (not an existing image URL)
            if (
              selectedImageFile?.previewUrl &&
              selectedImageFile?.previewUrl.startsWith("blob:")
            ) {
              URL.revokeObjectURL(selectedImageFile.previewUrl);
            }
            setSelectedImageFile(null);
          }}
          cropSize={200}
          showZoom={true}
          showRotate={true}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleImageSelect(e.target.files[0])}
        className="hidden"
      />
    </MainLayout>
  );
}
