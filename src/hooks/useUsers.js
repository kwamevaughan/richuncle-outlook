import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function useUsers() {
  // State for users
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "user",
    is_active: true,
    avatar_url: "",
    store_id: "",
    phone_number: "",
    date_of_birth: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: ""
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available roles
  const availableRoles = [
    { value: "admin", label: "Administrator", color: "bg-red-100 text-red-800" },
    { value: "manager", label: "Manager", color: "bg-blue-100 text-blue-800" },
    { value: "cashier", label: "Cashier", color: "bg-green-100 text-green-800" }
  ];

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admin: 0,
    manager: 0,
    cashier: 0
  });

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/users');
      const result = await response.json();
      
      if (result.success) {
        setUsers(result.data || []);
        calculateStats(result.data || []);
      } else {
        throw new Error("Failed to load users");
      }
    } catch (err) {
      setError(err.message || "Failed to load users");
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (userData) => {
    if (!userData || !Array.isArray(userData)) {
      setStats({ total: 0, active: 0, inactive: 0, admin: 0, manager: 0, cashier: 0 });
      return;
    }
    
    const total = userData.length;
    const active = userData.filter(u => u && u.is_active).length;
    const inactive = userData.filter(u => u && !u.is_active).length;
    const admin = userData.filter(u => u && u.role === 'admin').length;
    const manager = userData.filter(u => u && u.role === 'manager').length;
    const cashier = userData.filter(u => u && u.role === 'cashier').length;

    setStats({ total, active, inactive, admin, manager, cashier });
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    if (!user) return false;
    
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Get role info
  const getRoleInfo = (role) => {
    if (!role) return availableRoles[2]; // Default to "cashier"
    return availableRoles.find(r => r.value === role) || availableRoles[2]; // Default to "cashier"
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      role: "cashier",
      is_active: true,
      avatar_url: "",
      store_id: "",
      phone_number: "",
      date_of_birth: "",
      address: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relationship: ""
    });
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormErrors({});
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  // Open edit modal
  const openEditModal = (user) => {
    // Check if the relationship is one of the predefined values
    const predefinedRelationships = ['spouse', 'parent', 'child', 'sibling', 'friend'];
    const relationship = user.emergency_contact_relationship || '';
    const isCustomRelationship = relationship && !predefinedRelationships.includes(relationship);
    
    setFormData({
      full_name: user.full_name || "",
      email: user.email || "",
      role: user.role || "cashier",
      is_active: user.is_active ?? true,
      avatar_url: user.avatar_url || "",
      store_id: user.store_id || "",
      phone_number: user.phone_number || "",
      date_of_birth: user.date_of_birth || "",
      address: user.address || "",
      emergency_contact_name: user.emergency_contact_name || "",
      emergency_contact_phone: user.emergency_contact_phone || "",
      emergency_contact_relationship: isCustomRelationship ? 'other' : relationship,
      emergency_contact_relationship_custom: isCustomRelationship ? relationship : ''
    });
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormErrors({});
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Open reset password modal
  const openResetPasswordModal = (user) => {
    setSelectedUser(user);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormErrors({});
    setShowResetPasswordModal(true);
  };

  // Validate form
  const validateForm = (isEditMode = false) => {
    const errors = {};
    
    if (!formData.full_name.trim()) {
      errors.full_name = "Full name is required";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }
    
    // Only validate password if it's provided (for edit mode or reset password)
    if (password && password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    if (password && password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (formData.role === 'cashier' && (!formData.store_id || formData.store_id === "")) {
      errors.store_id = "Store is required for cashiers";
    }
    
    // Validate emergency contact relationship
    if (!formData.emergency_contact_relationship) {
      errors.emergency_contact_relationship = "Emergency contact relationship is required";
    } else if (formData.emergency_contact_relationship === 'other' && 
              (!formData.emergency_contact_relationship_custom || 
               formData.emergency_contact_relationship_custom.trim() === '')) {
      errors.emergency_contact_relationship = "Please specify the relationship";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Clean form data by converting empty strings to null for UUID fields
  const cleanFormData = (data) => {
    const cleaned = { ...data };
    const uuidFields = ['store_id', 'avatar_file_id'];
    uuidFields.forEach(field => {
      if (cleaned[field] === "") {
        cleaned[field] = null;
      }
    });
    return cleaned;
  };

  // Create user
  const handleCreateUser = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // If 'other' is selected, ensure we're using the custom value
      const formDataToSubmit = { ...formData };
      if (formData.emergency_contact_relationship === 'other' && formData.emergency_contact_relationship_custom) {
        formDataToSubmit.emergency_contact_relationship = formData.emergency_contact_relationship_custom;
      }
      
      const cleanData = cleanFormData(formDataToSubmit);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...cleanData,
          password: password
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("User created successfully");
        setShowCreateModal(false);
        resetForm();
        fetchUsers();
      } else {
        throw new Error(result.error || "Failed to create user");
      }
    } catch (err) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update user
  const handleUpdateUser = async () => {
    if (!validateForm(true)) return;
    
    setIsSubmitting(true);
    try {
      // If 'other' is selected, ensure we're using the custom value
      const formDataToUpdate = { ...formData };
      if (formData.emergency_contact_relationship === 'other' && formData.emergency_contact_relationship_custom) {
        formDataToUpdate.emergency_contact_relationship = formData.emergency_contact_relationship_custom;
      }
      
      const cleanData = cleanFormData(formDataToUpdate);
      const updateData = { ...cleanData };
      if (password) {
        updateData.password = password;
      }
      
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("User updated successfully");
        setShowEditModal(false);
        resetForm();
        fetchUsers();
      } else {
        throw new Error(result.error || "Failed to update user");
      }
    } catch (err) {
      toast.error(err.message || "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("User deleted successfully");
        setShowDeleteModal(false);
        fetchUsers();
      } else {
        throw new Error(result.error || "Failed to delete user");
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!validateForm(true)) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Password reset successfully");
        setShowResetPasswordModal(false);
        resetForm();
      } else {
        throw new Error(result.error || "Failed to reset password");
      }
    } catch (err) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle user status
  const toggleUserStatus = async (user) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !user.is_active })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
        fetchUsers();
      } else {
        throw new Error(result.error || "Failed to update user status");
      }
    } catch (err) {
      toast.error(err.message || "Failed to update user status");
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    // State
    users,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    showDeleteModal,
    setShowDeleteModal,
    showResetPasswordModal,
    setShowResetPasswordModal,
    selectedUser,
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
    availableRoles,
    stats,
    filteredUsers,
    
    // Functions
    fetchUsers,
    getRoleInfo,
    resetForm,
    openCreateModal,
    openEditModal,
    openDeleteModal,
    openResetPasswordModal,
    validateForm,
    handleCreateUser,
    handleUpdateUser,
    handleDeleteUser,
    handleResetPassword,
    toggleUserStatus
  };
} 