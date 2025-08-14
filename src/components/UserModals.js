import { Icon } from "@iconify/react";
import SimpleModal from "./SimpleModal";
import { useEffect, useState } from "react";

export default function UserModals({
  // Modal states
  showCreateModal,
  setShowCreateModal,
  showEditModal,
  setShowEditModal,
  showDeleteModal,
  setShowDeleteModal,
  showResetPasswordModal,
  setShowResetPasswordModal,
  selectedUser,
  
  // Form states
  formData,
  setFormData,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  formErrors,
  isSubmitting,
  
  // Handlers
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser,
  handleResetPassword,
  
  // Data
  availableRoles,
  stores
}) {
  // Local state for custom relationship
  const [customRelationship, setCustomRelationship] = useState('');
  const predefinedRelationships = ['spouse', 'parent', 'child', 'sibling', 'friend'];
  
  // Initialize custom relationship when form data changes
  useEffect(() => {
    if (formData.emergency_contact_relationship &&
        formData.emergency_contact_relationship !== 'other' &&
        !predefinedRelationships.includes(formData.emergency_contact_relationship)) {
      setCustomRelationship(formData.emergency_contact_relationship);
    }
  }, [formData.emergency_contact_relationship]);

  return (
    <>
      {/* Create User Modal */}
      <SimpleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
        width="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  formErrors.full_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter full name"
              />
              {formErrors.full_name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.full_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  formErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
              />
              {formErrors.email && (
                <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone_number || ''}
                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  formErrors.phone_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter phone number"
              />
              {formErrors.phone_number && (
                <p className="text-red-500 text-sm mt-1">{formErrors.phone_number}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth || ''}
                onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  formErrors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.date_of_birth && (
                <p className="text-red-500 text-sm mt-1">{formErrors.date_of_birth}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                {availableRoles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Icon icon="solar:shop-bold" className="w-4 h-4" />
                Store {formData.role === 'cashier' ? '*' : '(optional)'}
              </label>
              <select
                value={formData.store_id || ''}
                onChange={e => setFormData({ ...formData, store_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">Select a store</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.role === 'cashier' 
                  ? 'Cashiers must be assigned to a specific store to process transactions.'
                  : 'Store assignment is optional for administrators and managers.'
                }
              </p>
              {formErrors.store_id && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <Icon icon="solar:info-circle-bold" className="w-4 h-4" />
                  {formErrors.store_id}
                </p>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              value={formData.address || ''}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              rows={3}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                formErrors.address ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter address"
            />
            {formErrors.address && (
              <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact Name
              </label>
              <input
                type="text"
                value={formData.emergency_contact_name || ''}
                onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  formErrors.emergency_contact_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter emergency contact name"
              />
              {formErrors.emergency_contact_name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.emergency_contact_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                value={formData.emergency_contact_phone || ''}
                onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  formErrors.emergency_contact_phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter emergency contact phone number"
              />
              {formErrors.emergency_contact_phone && (
                <p className="text-red-500 text-sm mt-1">{formErrors.emergency_contact_phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact Relationship
              </label>
              <div className="space-y-2">
                <select
                  value={
                    (formData.emergency_contact_relationship
                      ? (predefinedRelationships.includes(formData.emergency_contact_relationship) ? formData.emergency_contact_relationship : 'other')
                      : '')
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'other') {
                      setCustomRelationship('');
                      setFormData({
                        ...formData,
                        emergency_contact_relationship: 'other'
                      });
                    } else {
                      setFormData({
                        ...formData,
                        emergency_contact_relationship: value
                      });
                      setCustomRelationship('');
                    }
                  }}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    formErrors.emergency_contact_relationship ? 'border-red-500' : 'border-gray-300'
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
                
                {(formData.emergency_contact_relationship === 'other' || 
                  (formData.emergency_contact_relationship && 
                   !predefinedRelationships.includes(formData.emergency_contact_relationship))) && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={formData.emergency_contact_relationship === 'other' ? customRelationship : formData.emergency_contact_relationship}
                      onChange={(e) => {
                        setCustomRelationship(e.target.value);
                        setFormData({
                          ...formData,
                          emergency_contact_relationship: e.target.value
                        });
                      }}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                        formErrors.emergency_contact_relationship ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Please specify the relationship"
                    />
                  </div>
                )}
                
                {formErrors.emergency_contact_relationship && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.emergency_contact_relationship}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password (optional - user will receive reset email)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  formErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon 
                  icon={showPassword ? "mdi:eye-off" : "mdi:eye"} 
                  className="w-5 h-5" 
                />
              </button>
            </div>
            {formErrors.password && (
              <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password (optional)
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon 
                  icon={showConfirmPassword ? "mdi:eye-off" : "mdi:eye"} 
                  className="w-5 h-5" 
                />
              </button>
            </div>
            {formErrors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Active user
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateUser}
              className="flex-1 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Icon icon="mdi:check" className="w-4 h-4" />
                  Create User
                </>
              )}
            </button>
          </div>
        </div>
      </SimpleModal>

      {/* Edit User Modal */}
      <SimpleModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
        width="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  formErrors.full_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter full name"
              />
              {formErrors.full_name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.full_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  formErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
              />
              {formErrors.email && (
                <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone_number || ''}
                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  formErrors.phone_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter phone number"
              />
              {formErrors.phone_number && (
                <p className="text-red-500 text-sm mt-1">{formErrors.phone_number}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth || ''}
                onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  formErrors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.date_of_birth && (
                <p className="text-red-500 text-sm mt-1">{formErrors.date_of_birth}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                {availableRoles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Icon icon="solar:shop-bold" className="w-4 h-4" />
                Store {formData.role === 'cashier' ? '*' : '(optional)'}
              </label>
              <select
                value={formData.store_id || ''}
                onChange={e => setFormData({ ...formData, store_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="">Select a store</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.role === 'cashier' 
                  ? 'Cashiers must be assigned to a specific store to process transactions.'
                  : 'Store assignment is optional for administrators and managers.'
                }
              </p>
              {formErrors.store_id && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <Icon icon="solar:info-circle-bold" className="w-4 h-4" />
                  {formErrors.store_id}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.address || ''}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                rows={3}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  formErrors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter address"
              />
              {formErrors.address && (
                <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact_name || ''}
                  onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    formErrors.emergency_contact_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter emergency contact name"
                />
                {formErrors.emergency_contact_name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.emergency_contact_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.emergency_contact_phone || ''}
                  onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    formErrors.emergency_contact_phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter emergency contact phone number"
                />
                {formErrors.emergency_contact_phone && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.emergency_contact_phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact Relationship
                </label>
                <div className="space-y-2">
                  <select
                    value={
                      (formData.emergency_contact_relationship
                        ? (predefinedRelationships.includes(formData.emergency_contact_relationship) ? formData.emergency_contact_relationship : 'other')
                        : '')
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'other') {
                        setCustomRelationship('');
                        setFormData({
                          ...formData,
                          emergency_contact_relationship: 'other'
                        });
                      } else {
                        setFormData({
                          ...formData,
                          emergency_contact_relationship: value
                        });
                        setCustomRelationship('');
                      }
                    }}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      formErrors.emergency_contact_relationship ? 'border-red-500' : 'border-gray-300'
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

                  {(formData.emergency_contact_relationship === 'other' || 
                    (formData.emergency_contact_relationship && 
                      !predefinedRelationships.includes(formData.emergency_contact_relationship))) && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={formData.emergency_contact_relationship === 'other' ? customRelationship : formData.emergency_contact_relationship}
                        onChange={(e) => {
                          setCustomRelationship(e.target.value);
                          setFormData({
                            ...formData,
                            emergency_contact_relationship: e.target.value
                          });
                        }}
                        className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          formErrors.emergency_contact_relationship ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Please specify the relationship"
                      />
                    </div>
                  )}

                  {formErrors.emergency_contact_relationship && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.emergency_contact_relationship}</p>
                  )}
                </div>
              </div>
            </div>

          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password (leave blank to keep current)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  formErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon 
                  icon={showPassword ? "mdi:eye-off" : "mdi:eye"} 
                  className="w-5 h-5" 
                />
              </button>
            </div>
            {formErrors.password && (
              <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
            )}
          </div>

          {password && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Icon 
                    icon={showConfirmPassword ? "mdi:eye-off" : "mdi:eye"} 
                    className="w-5 h-5" 
                  />
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>
              )}
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="edit_is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="edit_is_active" className="ml-2 block text-sm text-gray-900">
              Active user
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowEditModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateUser}
              className="flex-1 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Icon icon="mdi:check" className="w-4 h-4" />
                  Update User
                </>
              )}
            </button>
          </div>
        </div>
      </SimpleModal>

      {/* Delete User Modal */}
      <SimpleModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
        width="max-w-md"
      >
        <div className="text-center">
          <Icon
            icon="mdi:alert-circle"
            className="w-12 h-12 text-red-500 mx-auto mb-4"
          />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Delete User
          </h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete <strong>{selectedUser?.full_name}</strong>? 
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteUser}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete User
            </button>
          </div>
        </div>
      </SimpleModal>

      {/* Reset Password Modal */}
      <SimpleModal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        title="Reset Password"
        width="max-w-md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="mdi:information" className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Reset Password</span>
            </div>
            <p className="text-sm text-blue-700">
              Set a new password for {selectedUser?.full_name}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password (optional - user will receive reset email)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  formErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon 
                  icon={showPassword ? "mdi:eye-off" : "mdi:eye"} 
                  className="w-5 h-5" 
                />
              </button>
            </div>
            {formErrors.password && (
              <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password (optional)
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon 
                  icon={showConfirmPassword ? "mdi:eye-off" : "mdi:eye"} 
                  className="w-5 h-5" 
                />
              </button>
            </div>
            {formErrors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowResetPasswordModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleResetPassword}
              className="flex-1 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Icon icon="mdi:key-reset" className="w-4 h-4" />
                  Reset Password
                </>
              )}
            </button>
          </div>
        </div>
      </SimpleModal>
    </>
  );
} 