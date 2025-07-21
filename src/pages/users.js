import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import useUsers from "../hooks/useUsers";
import { Icon } from "@iconify/react";
import { GenericTable } from "@/components/GenericTable";
import UserStats from "@/components/UserStats";
import UserFilters from "@/components/UserFilters";
import UserModals from "@/components/UserModals";
import Image from "next/image";
import { useEffect, useState } from "react";
import ExportModal from "@/components/export/ExportModal";

export default function UsersPage({ mode = "light", toggleMode, ...props }) {
  const { user: currentUser, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  const usersHook = useUsers();
  const [stores, setStores] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    async function fetchStores() {
      const res = await fetch("/api/stores");
      const data = await res.json();
      if (data.success) setStores(data.data);
    }
    fetchStores();
  }, []);
  
  const {
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
    fetchUsers,
    getRoleInfo,
    openCreateModal,
    openEditModal,
    openDeleteModal,
    openResetPasswordModal,
    handleCreateUser,
    handleUpdateUser,
    handleDeleteUser,
    handleResetPassword,
    toggleUserStatus
  } = usersHook;

  // GenericTable columns configuration
  const columns = [
    {
      accessor: 'avatar_url',
      header: 'Avatar',
      sortable: false,
      render: (row) => {
        if (!row) return <div className="flex items-center">-</div>;
        
        return (
          <div className="flex items-center">
            {row.avatar_url ? (
              <Image 
                src={row.avatar_url} 
                alt={row.full_name || "User"} 
                width={40} 
                height={40} 
                className="w-10 h-10 rounded-full object-cover border"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center text-white font-semibold">
                {row.full_name ? row.full_name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
          </div>
        );
      }
    },
    {
      accessor: 'full_name',
      header: 'Name',
      sortable: true,
      render: (row) => {
        if (!row) return <div>-</div>;
        
        return (
          <div>
            <div className="font-medium text-gray-900">{row.full_name || "No name"}</div>
            <div className="text-sm text-gray-500">{row.email}</div>
          </div>
        );
      }
    },
    {
      accessor: 'role',
      header: 'Role',
      sortable: true,
      render: (row) => {
        if (!row) return <span>-</span>;
        
        const roleInfo = getRoleInfo(row.role);
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
            {roleInfo.label}
          </span>
        );
      }
    },
    {
      accessor: 'store_id',
      header: 'Store',
      sortable: false,
      render: (row) => {
        if (!row || !row.store_id) return <span>-</span>;
        const store = stores.find(s => s.id === row.store_id);
        return <span>{store ? store.name : 'Unknown'}</span>;
      }
    },
    {
      accessor: 'is_active',
      header: 'Status',
      sortable: true,
      render: (row) => {
        if (!row) return <span>-</span>;
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.is_active 
              ? "bg-green-100 text-green-800" 
              : "bg-red-100 text-red-800"
          }`}>
            {row.is_active ? "Active" : "Inactive"}
          </span>
        );
      }
    },
    {
      accessor: 'created_at',
      header: 'Created',
      sortable: true,
      render: (row) => {
        if (!row || !row.created_at) return <div className="text-sm text-gray-900">-</div>;
        
        return (
          <div className="text-sm text-gray-900">
            {new Date(row.created_at).toLocaleDateString()}
          </div>
        );
      }
    },
    {
      accessor: 'last_login',
      header: 'Last Login',
      sortable: true,
      render: (row) => {
        if (!row) return <div className="text-sm text-gray-900">-</div>;
        
        return (
          <div className="text-sm text-gray-900">
            {row.last_login ? new Date(row.last_login).toLocaleDateString() : "Never"}
          </div>
        );
      }
    }
  ];

  // Custom actions for the table
  const tableActions = [
    {
      label: "Edit",
      icon: "mdi:pencil",
      onClick: (row) => openEditModal(row),
    },
    {
      label: "Reset Password",
      icon: "teenyicons:password-outline",
      onClick: (row) => openResetPasswordModal(row),
    },
    {
      label: (row) => (row && row.is_active ? "Deactivate" : "Activate"),
      icon: (row) =>
        row && row.is_active ? "mdi:account-off" : "mdi:account-check",
      onClick: (row) => toggleUserStatus(row),
    },
    {
      label: "Delete",
      icon: "mdi:delete",
      onClick: (row) => openDeleteModal(row),
      className: "text-red-600 hover:text-red-800",
    },
  ];

  if (userLoading && LoadingComponent) return LoadingComponent;
  if (!currentUser) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  // Check if current user has admin permissions
  const isAdmin = currentUser.role === 'admin';

  return (
    <MainLayout
      mode={mode}
      user={currentUser}
      toggleMode={toggleMode}
      onLogout={handleLogout}
      {...props}
    >
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-800 rounded-lg flex items-center justify-center">
                    <Icon
                      icon="mdi:account-multiple"
                      className="w-6 h-6 text-white"
                    />
                  </div>
                  User Management
                </h1>
                <p className="text-gray-600">
                  Manage users, assign roles, and control access permissions
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchUsers()}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Icon icon="mdi:refresh" className="w-4 h-4" />
                  Refresh
                </button>
                {isAdmin && (
                  <>
                    <button
                      onClick={openCreateModal}
                      className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Icon icon="mdi:plus" className="w-4 h-4" />
                      Add User
                    </button>
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Icon icon="mdi:export" className="w-4 h-4" />
                      Export Data
                    </button>
                  </>
                )}
              </div>
            </div>

            
          </div>

          {/* Filters */}
          <UserFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            availableRoles={availableRoles}
          />

          {/* Content Area */}
          {loading ? (
            <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading users...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
              <Icon
                icon="mdi:alert-circle"
                className="w-12 h-12 text-red-500 mx-auto mb-4"
              />
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
              <Icon
                icon="mdi:account-multiple-off"
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
              />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Users Found
              </h3>
              <p className="text-gray-500">
                No users match your current filters.
              </p>
            </div>
          ) : (
            <GenericTable
              data={filteredUsers}
              columns={columns}
              actions={isAdmin ? tableActions : []}
              title="Users"
              emptyMessage="No users found"
              selectable={false}
              searchable={false}
              onExport={isAdmin ? () => setShowExportModal(true) : undefined}
            />
          )}
        </div>
      </div>

      {/* User Modals */}
      <UserModals
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        showResetPasswordModal={showResetPasswordModal}
        setShowResetPasswordModal={setShowResetPasswordModal}
        selectedUser={selectedUser}
        formData={formData}
        setFormData={setFormData}
        password={password}
        setPassword={setPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        formErrors={formErrors}
        isSubmitting={isSubmitting}
        handleCreateUser={handleCreateUser}
        handleUpdateUser={handleUpdateUser}
        handleDeleteUser={handleDeleteUser}
        handleResetPassword={handleResetPassword}
        availableRoles={availableRoles}
        stores={stores}
      />
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        users={filteredUsers}
        mode={mode}
        type="users"
        stores={stores}
      />
    </MainLayout>
  );
} 