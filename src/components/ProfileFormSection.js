import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";

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
  // Local state for custom relationship
  const [customRelationship, setCustomRelationship] = useState('');
  const predefinedRelationships = ['spouse', 'parent', 'child', 'sibling', 'friend'];
  
  // Initialize custom relationship when form data changes
  useEffect(() => {
    if (formData && formData.emergency_contact_relationship &&
        formData.emergency_contact_relationship !== 'other' &&
        !predefinedRelationships.includes(formData.emergency_contact_relationship)) {
      setCustomRelationship(formData.emergency_contact_relationship);
    }
  }, [formData?.emergency_contact_relationship]);

  // Don't render if formData is not yet loaded
  if (!formData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-32">
          <div className={`flex items-center gap-2 ${
            mode === "dark" ? "text-blue-400" : "text-blue-600"
          }`}>
            <Icon icon="solar:loading-bold" className="animate-spin w-5 h-5" />
            Loading form data...
          </div>
        </div>
      </div>
    );
  }



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
              value={formData?.full_name || ''}
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

      {/* Additional Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phone Number */}
        <div className="space-y-2">
          <label
            className={`block text-sm font-semibold flex items-center gap-2 ${
              mode === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <Icon icon="solar:phone-bold" className="w-4 h-4" />
            Phone Number
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={formData?.phone_number || ''}
              onChange={(e) =>
                onFormDataChange({ ...formData, phone_number: e.target.value })
              }
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                mode === "dark"
                  ? "border-gray-600 bg-gray-700 text-gray-100 hover:border-gray-500"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              placeholder="Enter your phone number"
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
                {formData?.phone_number || '—'}
              </p>
            </div>
          )}
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <label
            className={`block text-sm font-semibold flex items-center gap-2 ${
              mode === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <Icon icon="mdi:calendar" className="w-4 h-4" />
            Date of Birth
          </label>
          {isEditing ? (
            <input
              type="date"
              value={formData?.date_of_birth || ''}
              onChange={(e) =>
                onFormDataChange({ ...formData, date_of_birth: e.target.value })
              }
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                mode === "dark"
                  ? "border-gray-600 bg-gray-700 text-gray-100 hover:border-gray-500"
                  : "border-gray-200 hover:border-gray-300"
              }`}
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
                {formData?.date_of_birth || '—'}
              </p>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="space-y-2 md:col-span-2">
          <label
            className={`block text-sm font-semibold flex items-center gap-2 ${
              mode === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <Icon icon="mdi:home-outline" className="w-4 h-4" />
            Address
          </label>
          {isEditing ? (
            <textarea
              rows={3}
              value={formData?.address || ''}
              onChange={(e) =>
                onFormDataChange({ ...formData, address: e.target.value })
              }
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                mode === "dark"
                  ? "border-gray-600 bg-gray-700 text-gray-100 hover:border-gray-500"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              placeholder="Enter your address"
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
                } whitespace-pre-line`}
              >
                {formData?.address || '—'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Emergency Contact Name */}
        <div className="space-y-2">
          <label
            className={`block text-sm font-semibold flex items-center gap-2 ${
              mode === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <Icon icon="mdi:account-outline" className="w-4 h-4" />
            Emergency Contact Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData?.emergency_contact_name || ''}
              onChange={(e) =>
                onFormDataChange({ ...formData, emergency_contact_name: e.target.value })
              }
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                mode === "dark"
                  ? "border-gray-600 bg-gray-700 text-gray-100 hover:border-gray-500"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              placeholder="Enter contact name"
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
                {formData?.emergency_contact_name || '—'}
              </p>
            </div>
          )}
        </div>

        {/* Emergency Contact Phone */}
        <div className="space-y-2">
          <label
            className={`block text-sm font-semibold flex items-center gap-2 ${
              mode === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <Icon icon="solar:phone-bold" className="w-4 h-4" />
            Emergency Contact Phone
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={formData?.emergency_contact_phone || ''}
              onChange={(e) =>
                onFormDataChange({ ...formData, emergency_contact_phone: e.target.value })
              }
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                mode === "dark"
                  ? "border-gray-600 bg-gray-700 text-gray-100 hover:border-gray-500"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              placeholder="Enter contact phone"
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
                {formData?.emergency_contact_phone || '—'}
              </p>
            </div>
          )}
        </div>

        {/* Emergency Contact Relationship */}
        <div className="space-y-2">
          <label
            className={`block text-sm font-semibold flex items-center gap-2 ${
              mode === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <Icon icon="mdi:account-heart" className="w-4 h-4" />
            Emergency Contact Relationship
          </label>
          {isEditing ? (
            <div className="space-y-2">
              <select
                value={
                  (formData && formData.emergency_contact_relationship
                    ? (predefinedRelationships.includes(formData.emergency_contact_relationship) ? formData.emergency_contact_relationship : 'other')
                    : '')
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'other') {
                    setCustomRelationship('');
                    onFormDataChange({
                      ...formData,
                      emergency_contact_relationship: 'other'
                    });
                  } else {
                    onFormDataChange({
                      ...formData,
                      emergency_contact_relationship: value
                    });
                    setCustomRelationship('');
                  }
                }}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  mode === "dark"
                    ? "border-gray-600 bg-gray-700 text-gray-100 hover:border-gray-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <option value="">Select relationship</option>
                <option value="spouse">Spouse</option>
                <option value="parent">Parent</option>
                <option value="child">Child</option>
                <option value="sibling">Sibling</option>
                <option value="friend">Friend</option>
                <option value="other">Other (please specify)</option>
              </select>
              
              {(formData && formData.emergency_contact_relationship === 'other' || 
                (formData && formData.emergency_contact_relationship && 
                 !predefinedRelationships.includes(formData.emergency_contact_relationship))) && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={formData && formData.emergency_contact_relationship === 'other' ? customRelationship : (formData && formData.emergency_contact_relationship) || ''}
                    onChange={(e) => {
                      setCustomRelationship(e.target.value);
                      onFormDataChange({
                        ...formData,
                        emergency_contact_relationship: e.target.value
                      });
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      mode === "dark"
                        ? "border-gray-600 bg-gray-700 text-gray-100 hover:border-gray-500"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    placeholder="Please specify the relationship"
                  />
                </div>
              )}
            </div>
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
                {formData?.emergency_contact_relationship || '—'}
              </p>
            </div>
          )}
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
