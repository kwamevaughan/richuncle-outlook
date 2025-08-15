import { useState } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { useProfileData } from "../hooks/useProfileData";
import { useAvatarManagement } from "../hooks/useAvatarManagement";
import { useProfileForm } from "../hooks/useProfileForm";
import { usePasswordManagement } from "../hooks/usePasswordManagement";
import { Icon } from "@iconify/react";
import SimpleModal from "@/components/SimpleModal";
import ImageCropper from "@/components/ImageCropper";
import ProfileHeader from "@/components/ProfileHeader";
import ProfilePictureSection from "@/components/ProfilePictureSection";
import ProfileFormSection from "@/components/ProfileFormSection";
import StoreAssignmentSection from "@/components/StoreAssignmentSection";
import PasswordSection from "@/components/PasswordSection";
import ProfileSidebar from "@/components/ProfileSidebar";
import BiometricAuthSection from "@/components/BiometricAuthSection";
import Tabs from "@/components/Tabs";

export default function ProfilePage({ mode = "light", toggleMode, ...props }) {
  const { user: cachedUser, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  const router = useRouter();

  const { user, setUser, storeData, loading: loadingUserData } = useProfileData(cachedUser);
  const {
    formData,
    setFormData,
    isEditing,
    setIsEditing,
    isSubmitting: isFormSubmitting,
    errors: formErrors,
    handleUpdateProfile,
  } = useProfileForm(user, setUser);

  const {
    fileInputRef,
    uploading: uploadingImage,
    showCropper,
    selectedImage,
    setShowCropper,
    setSelectedImage,
    triggerFileUpload,
    handleImageSelect,
    handleReposition,
    handleCroppedImage,
    handleResetCrop,
    handleRemoveImage,
    cropTransform,
  } = useAvatarManagement(user, setUser, setFormData);

  const {
    passwordData,
    setPasswordData,
    isChangingPassword,
    setIsChangingPassword,
    isSubmitting: isPasswordSubmitting,
    errors: passwordErrors,
    showPassword,
    togglePasswordVisibility,
    handleChangePassword,
  } = usePasswordManagement(user?.id);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
      router.push("/");
    }
    return null;
  }

  if (loadingUserData) {
    return (
      <MainLayout mode={mode} user={cachedUser} toggleMode={toggleMode} onLogout={handleLogout} {...props}>
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
            <div className={`flex items-center gap-2 ${mode === "dark" ? "text-blue-400" : "text-blue-600"}`}>
              <Icon icon="solar:loading-bold" className="animate-spin w-5 h-5" />
              Loading profile data...
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const profileTabs = [
    {
      name: "Profile Information",
      icon: "solar:user-id-bold",
      content: (
        <div className={`rounded-2xl shadow-lg border overflow-hidden backdrop-blur-sm ${mode === "dark" ? "bg-gray-800/90 border-gray-700/50 shadow-gray-900/20" : "bg-white/90 border-gray-200/50 shadow-gray-900/10"}`}>
          <div className="relative p-6 sm:p-8 space-y-8">
            <ProfilePictureSection
              user={user}
              formData={formData}
              cropTransform={user?.crop_transform}
              uploadingImage={uploadingImage}
              onFileUpload={triggerFileUpload}
              onReposition={handleReposition}
              onResetCrop={handleResetCrop}
              onRemoveImage={handleRemoveImage}
              onImageSelect={handleImageSelect}
              isEditing={isEditing}
              mode={mode}
            />
            <ProfileFormSection
              user={user}
              formData={formData}
              formErrors={formErrors}
              isEditing={isEditing}
              isSubmitting={isFormSubmitting}
              onFormDataChange={setFormData}
              onSave={handleUpdateProfile}
              mode={mode}
            />
          </div>
          <StoreAssignmentSection user={user} storeData={storeData} mode={mode} />
        </div>
      ),
    },
    {
      name: "Security",
      icon: "solar:shield-keyhole-minimalistic-bold",
      content: <PasswordSection
        isChangingPassword={isChangingPassword}
        passwordData={passwordData}
        passwordErrors={passwordErrors}
        showPassword={showPassword}
        isSubmitting={isPasswordSubmitting}
        onTogglePassword={togglePasswordVisibility}
        onPasswordDataChange={setPasswordData}
        onToggleChangePassword={() => setIsChangingPassword(!isChangingPassword)}
        onSavePassword={handleChangePassword}
        mode={mode}
      />,
    },
    {
      name: "Biometric Authentication",
      icon: "solar:fingerprint-bold",
      content: <BiometricAuthSection user={user} mode={mode} />,
    },
  ];

  return (
    <MainLayout mode={mode} user={user} toggleMode={toggleMode} onLogout={handleLogout} {...props}>
      <div className={`flex-1 min-h-screen ${mode === "dark" ? "bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900/30" : "bg-gradient-to-br from-gray-50 via-white to-blue-50/30"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
            <div className="lg:col-span-2 xl:col-span-3">
              <Tabs tabs={profileTabs} mode={mode} />
            </div>

            <div className="lg:col-span-1 xl:col-span-1">
              <div className="sticky top-6">
                <ProfileSidebar user={user} formatDate={formatDate} onLogout={() => setShowLogoutModal(true)} mode={mode} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <SimpleModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Sign Out" size="sm" mode={mode}>
        <div className="p-6">
          <p className={`mb-4 ${mode === "dark" ? "text-gray-300" : "text-gray-600"}`}>
            Are you sure you want to sign out?
          </p>
          <div className="flex justify-end space-x-3">
            <button onClick={() => setShowLogoutModal(false)} className={`px-4 py-2 border rounded-lg transition-colors ${mode === "dark" ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
              Cancel
            </button>
            <button onClick={handleLogout} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </SimpleModal>

      {showCropper && selectedImage && (
        <ImageCropper
          imageSrc={selectedImage.previewUrl}
          onCrop={handleCroppedImage}
          onCancel={() => {
            setShowCropper(false);
            if (selectedImage?.previewUrl.startsWith("blob:")) {
              URL.revokeObjectURL(selectedImage.previewUrl);
            }
            setSelectedImage(null);
          }}
          cropSize={200}
          showZoom={true}
          showRotate={true}
        />
      )}

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
