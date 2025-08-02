import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { GenericTable } from "@/components/GenericTable";
import SimpleModal from "@/components/SimpleModal";
import TooltipIconButton from "@/components/TooltipIconButton";
import { sidebarNav } from "@/data/nav";
import toast from "react-hot-toast";

export default function RolesPermissionsPage({
  mode = "light",
  toggleMode,
  ...props
}) {
  const {
    user: currentUser,
    loading: userLoading,
    LoadingComponent,
  } = useUser();
  const { handleLogout } = useLogout();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({}); // { role_id: [permission_id, ...] }
  const [rolePagePermissions, setRolePagePermissions] = useState({}); // { role_id: [page_path, ...] }
  const [userCounts, setUserCounts] = useState({}); // { role_id: count }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingPerms, setEditingPerms] = useState([]);
  const [saving, setSaving] = useState(false);
  // Role/Permission modals
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleModalMode, setRoleModalMode] = useState("create"); // 'create' or 'edit'
  const [roleForm, setRoleForm] = useState({ name: "", description: "" });
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [showDeleteRoleModal, setShowDeleteRoleModal] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);
  const [permModalMode, setPermModalMode] = useState("create"); // 'create' or 'edit'
  const [permForm, setPermForm] = useState({ key: "", label: "" });
  const [permToDelete, setPermToDelete] = useState(null);
  const [showDeletePermModal, setShowDeletePermModal] = useState(false);
  // Unified access modal
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [editingPagePerms, setEditingPagePerms] = useState([]);
  // Search/filter
  const [roleSearch, setRoleSearch] = useState("");
  const [permSearch, setPermSearch] = useState("");
  // Tab state
  const [activeTab, setActiveTab] = useState("roles"); // 'roles', 'permissions', or 'page-access'

  // Fetch all data on mount or after changes
  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [rolesRes, permsRes, assignmentsRes, pagePermsRes, usersRes] = await Promise.all([
        fetch("/api/roles").then((r) => r.json()),
        fetch("/api/permissions").then((r) => r.json()),
        fetch("/api/role-permissions").then((r) => r.json()),
        fetch("/api/role-page-permissions").then((r) => r.json()),
        fetch("/api/users").then((r) => r.json()),
      ]);
      if (!rolesRes.success)
        throw new Error(rolesRes.error || "Failed to fetch roles");
      if (!permsRes.success)
        throw new Error(permsRes.error || "Failed to fetch permissions");
      if (!assignmentsRes.success)
        throw new Error(assignmentsRes.error || "Failed to fetch assignments");
      if (!pagePermsRes.success)
        throw new Error(pagePermsRes.error || "Failed to fetch page permissions");
      if (!usersRes.success)
        throw new Error(usersRes.error || "Failed to fetch users");
      setRoles(rolesRes.data || []);
      setPermissions(permsRes.data || []);
      
      // Process role permissions
      const rp = {};
      for (const role of rolesRes.data) rp[role.id] = [];
      for (const a of assignmentsRes.data) {
        if (rp[a.role_id]) rp[a.role_id].push(a.permission_id);
      }
      setRolePermissions(rp);
      
      // Process role page permissions
      const rpp = {};
      for (const role of rolesRes.data) rpp[role.id] = [];
      
      // Handle the grouped format from API
      for (const roleGroup of pagePermsRes.data || []) {
        if (roleGroup.role_id && roleGroup.page_paths) {
          rpp[roleGroup.role_id] = roleGroup.page_paths;
        }
      }
      
      setRolePagePermissions(rpp);
      
      const uc = {};
      for (const role of rolesRes.data) uc[role.id] = 0;
      for (const user of usersRes.data || []) {
        if (user.role) {
          const roleKey = Object.keys(uc).find(
            (roleId) =>
              rolesRes.data.find((r) => r.id === roleId)?.name === user.role
          );
          if (roleKey) uc[roleKey]++;
        }
      }
      setUserCounts(uc);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAll();
  }, []);

  if (userLoading && LoadingComponent) return LoadingComponent;
  if (!currentUser) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  // --- Role CRUD ---
  const openCreateRole = () => {
    setRoleModalMode("create");
    setRoleForm({ name: "", description: "" });
    setShowRoleModal(true);
  };
  const openEditRole = (role) => {
    setRoleModalMode("edit");
    setRoleForm({
      id: role.id,
      name: role.name,
      description: role.description,
    });
    setShowRoleModal(true);
  };
  const saveRole = async () => {
    if (!roleForm.name.trim()) return toast.error("Role name is required");
    setSaving(true);
    try {
      const method = roleModalMode === "edit" ? "PUT" : "POST";
      const res = await fetch("/api/roles", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roleForm),
      });
      const result = await res.json();
      if (!result.success)
        throw new Error(result.error || "Failed to save role");
      setShowRoleModal(false);
      fetchAll();
      toast.success(roleModalMode === "edit" ? "Role updated successfully!" : "Role created successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to save role");
    } finally {
      setSaving(false);
    }
  };
  const confirmDeleteRole = (role) => {
    setRoleToDelete(role);
    setShowDeleteRoleModal(true);
  };
  const deleteRole = async () => {
    if (!roleToDelete) return;
    setSaving(true);
    try {
      const res = await fetch("/api/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: roleToDelete.id }),
      });
      const result = await res.json();
      if (!result.success)
        throw new Error(result.error || "Failed to delete role");
      setShowDeleteRoleModal(false);
      setRoleToDelete(null);
      fetchAll();
      toast.success("Role deleted successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to delete role");
    } finally {
      setSaving(false);
    }
  };

  // --- Permission CRUD ---
  const openCreatePerm = () => {
    setPermModalMode("create");
    setPermForm({ key: "", label: "" });
    setShowPermModal(true);
  };
  const openEditPerm = (perm) => {
    setPermModalMode("edit");
    setPermForm({ id: perm.id, key: perm.key, label: perm.label });
    setShowPermModal(true);
  };
  const savePerm = async () => {
    if (!permForm.key.trim() || !permForm.label.trim())
      return toast.error("Key and label are required");
    setSaving(true);
    try {
      const method = permModalMode === "edit" ? "PUT" : "POST";
      const res = await fetch("/api/permissions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(permForm),
      });
      const result = await res.json();
      if (!result.success)
        throw new Error(result.error || "Failed to save permission");
      setShowPermModal(false);
      fetchAll();
      toast.success(permModalMode === "edit" ? "Permission updated successfully!" : "Permission created successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to save permission");
    } finally {
      setSaving(false);
    }
  };
  const confirmDeletePerm = (perm) => {
    setPermToDelete(perm);
    setShowDeletePermModal(true);
  };
  const deletePerm = async () => {
    if (!permToDelete) return;
    setSaving(true);
    try {
      const res = await fetch("/api/permissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: permToDelete.id }),
      });
      const result = await res.json();
      if (!result.success)
        throw new Error(result.error || "Failed to delete permission");
      setShowDeletePermModal(false);
      setPermToDelete(null);
      fetchAll();
      toast.success("Permission deleted successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to delete permission");
    } finally {
      setSaving(false);
    }
  };

  // --- Permissions Table ---
  const permColumns = [
    {
      Header: "Permission",
      accessor: "key",
      render: (row) => (
        <span className="font-semibold text-gray-900">{row.key}</span>
      ),
    },
    { Header: "Label", accessor: "label" },
  ];
  const permActions = [
    {
      label: "Edit Permission",
      icon: "cuida:edit-outline",
      onClick: openEditPerm,
      render: (row) => (
        <TooltipIconButton
          icon="cuida:edit-outline"
          label="Edit Permission"
          onClick={() => openEditPerm(row)}
          mode={mode}
          className="bg-blue-50 text-blue-600 text-xs"
        />
      ),
    },
    {
      label: "Delete Permission",
      icon: "mynaui:trash",
      onClick: confirmDeletePerm,
      render: (row) => (
        <TooltipIconButton
          icon="mynaui:trash"
          label="Delete Permission"
          onClick={() => confirmDeletePerm(row)}
          mode={mode}
          className="bg-red-50 text-red-600 text-xs"
        />
      ),
    },
  ];

  // --- Roles Table ---
  const columns = [
    {
      Header: "Role",
      accessor: "name",
      render: (row) => (
        <span className="font-semibold text-gray-900">{row.name}</span>
      ),
    },
    { Header: "Description", accessor: "description" },
    {
      Header: "# Users",
      accessor: "users",
      render: (row) => <span>{userCounts[row.id] || 0}</span>,
    },
  ];
  const actions = [
    {
      label: "Edit Role",
      icon: "cuida:edit-outline",
      onClick: openEditRole,
      render: (row) => (
        <TooltipIconButton
          icon="cuida:edit-outline"
          label="Edit Role"
          onClick={() => openEditRole(row)}
          mode={mode}
          className="bg-blue-50 text-blue-600 text-xs"
        />
      ),
    },
    {
      label: "Edit Access",
      icon: "mdi:shield-account",
      onClick: openEditAccess,
      render: (row) => (
        <TooltipIconButton
          icon="mdi:shield-account"
          label="Edit Access"
          onClick={() => openEditAccess(row)}
          mode={mode}
          className="bg-blue-50 text-blue-600 text-xs"
        />
      ),
    },
    {
      label: "Delete Role",
      icon: "mynaui:trash",
      onClick: confirmDeleteRole,
      show: (row) => userCounts[row.id] === 0,
      render: (row) => (
        <TooltipIconButton
          icon="mynaui:trash"
          label="Delete Role"
          onClick={() => confirmDeleteRole(row)}
          mode={mode}
          className="bg-red-50 text-red-600 text-xs"
        />
      ),
    },
  ];

  // Filtered data
  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(roleSearch.toLowerCase())
  );
  const filteredPerms = permissions.filter(
    (p) =>
      p.key.toLowerCase().includes(permSearch.toLowerCase()) ||
      p.label.toLowerCase().includes(permSearch.toLowerCase())
  );

  // --- Edit Permissions Modal ---
  function openEditPermissions(role) {
    setEditingRole(role);
    setEditingPerms(rolePermissions[role.id] || []);
    setShowModal(true);
  }
  const handlePermChange = (permId) => {
    setEditingPerms((prev) =>
      prev.includes(permId)
        ? prev.filter((k) => k !== permId)
        : [...prev, permId]
    );
  };
  const savePermissions = async () => {
    if (!editingRole) return;
    setSaving(true);
    try {
      const res = await fetch("/api/role-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_id: editingRole.id,
          permission_ids: editingPerms,
        }),
      });
      const result = await res.json();
      if (!result.success)
        throw new Error(result.error || "Failed to update permissions");
      setRolePermissions((prev) => ({
        ...prev,
        [editingRole.id]: editingPerms,
      }));
      setShowModal(false);
      toast.success(`Permissions updated successfully for ${editingRole.name}!`);
    } catch (err) {
      toast.error(err.message || "Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  // --- Unified Access Management ---
  function openEditAccess(role) {
    setEditingRole(role);
    const currentPermissions = rolePagePermissions[role.id] || [];
    const currentPerms = rolePermissions[role.id] || [];
    setEditingPagePerms(currentPermissions);
    setEditingPerms(currentPerms);
    setShowAccessModal(true);
  }
  const handlePagePermChange = (pagePath) => {
    if (!pagePath || typeof pagePath !== 'string' || pagePath.trim() === '') {
      console.warn('Invalid page path:', pagePath);
      return;
    }
    
    setEditingPagePerms((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      return current.includes(pagePath)
        ? current.filter((p) => p !== pagePath)
        : [...current, pagePath];
    });
  };
  const saveAccess = async () => {
    if (!editingRole) return;
    setSaving(true);
    try {
      // Save page permissions
      const validPagePaths = Array.isArray(editingPagePerms) 
        ? editingPagePerms.filter(path => 
            path && 
            typeof path === 'string' && 
            path.trim() !== '' && 
            path !== null && 
            path !== undefined
          )
        : [];

      const pagePermsRes = await fetch("/api/role-page-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_id: editingRole.id,
          page_paths: validPagePaths,
        }),
      });
      const pagePermsResult = await pagePermsRes.json();
      if (!pagePermsResult.success)
        throw new Error(pagePermsResult.error || "Failed to update page permissions");

      // Save feature permissions
      const permsRes = await fetch("/api/role-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_id: editingRole.id,
          permission_ids: editingPerms,
        }),
      });
      const permsResult = await permsRes.json();
      if (!permsResult.success)
        throw new Error(permsResult.error || "Failed to update permissions");

      // Update local state
      setRolePagePermissions((prev) => ({
        ...prev,
        [editingRole.id]: validPagePaths,
      }));
      setRolePermissions((prev) => ({
        ...prev,
        [editingRole.id]: editingPerms,
      }));
      setShowAccessModal(false);
      
      // Refresh the data to ensure consistency
      setTimeout(() => {
        fetchAll();
      }, 100);
      toast.success(`Access settings updated successfully for ${editingRole.name}!`);
    } catch (err) {
      toast.error(err.message || "Failed to update access settings");
    } finally {
      setSaving(false);
    }
  };

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
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                    <Icon
                      icon="mdi:shield-account-outline"
                      className="w-4 h-4 sm:w-6 sm:h-6 text-white"
                    />
                  </div>
                  Roles & Permissions
                </h1>
                <p className="text-gray-600">
                  Manage roles and control access permissions for your team
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  onClick={openCreateRole}
                >
                  <Icon icon="mdi:plus" className="w-4 h-4" /> Add Role
                </button>
                <button
                  className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  onClick={openCreatePerm}
                >
                  <Icon icon="mdi:plus" className="w-4 h-4" /> Add Permission
                </button>
              </div>
            </div>
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("roles")}
                  className={`${
                    activeTab === "roles"
                      ? "border-blue-800 text-blue-800"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <Icon icon="mdi:shield-account-outline" className="w-5 h-5" />
                  Roles
                </button>
                <button
                  onClick={() => setActiveTab("permissions")}
                  className={`${
                    activeTab === "permissions"
                      ? "border-blue-800 text-blue-800"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <Icon icon="mdi:key-outline" className="w-5 h-5" />
                  Permissions
                </button>
                <button
                  onClick={() => setActiveTab("page-access")}
                  className={`${
                    activeTab === "page-access"
                      ? "border-blue-800 text-blue-800"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <Icon icon="mdi:page-layout-body" className="w-5 h-5" />
                  Page Access
                </button>
              </nav>
            </div>
          </div>
          {loading ? (
            <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading roles & permissions...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
              <Icon
                icon="mdi:alert-circle"
                className="w-12 h-12 text-red-500 mx-auto mb-4"
              />
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : (
            <div>
              {activeTab === "roles" && (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <input
                      value={roleSearch}
                      onChange={(e) => setRoleSearch(e.target.value)}
                      placeholder="Search roles..."
                      className="px-3 py-2 border rounded w-full max-w-xs"
                    />
                  </div>
                  <GenericTable
                    data={filteredRoles}
                    columns={columns}
                    actions={actions}
                    title="Roles"
                    emptyMessage="No roles found"
                    selectable={false}
                    searchable={false}
                  />
                </div>
              )}
              {activeTab === "permissions" && (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <input
                      value={permSearch}
                      onChange={(e) => setPermSearch(e.target.value)}
                      placeholder="Search permissions..."
                      className="px-3 py-2 border rounded w-full max-w-xs"
                    />
                  </div>
                  <GenericTable
                    data={filteredPerms}
                    columns={permColumns}
                    actions={permActions}
                    title="Permissions"
                    emptyMessage="No permissions found"
                    selectable={false}
                    searchable={false}
                  />
                </div>
              )}
              {activeTab === "page-access" && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Access Management</h3>
                    <p className="text-gray-600 mb-4">
                      Configure page access and feature permissions for each role. This controls what users can see and do in the application.
                    </p>
                  </div>
                  <div className="grid gap-6">
                    {roles.map((role) => (
                      <div key={role.id} className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{role.name}</h4>
                            <p className="text-sm text-gray-500">{role.description}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {userCounts[role.id] || 0} users with this role
                            </p>
                          </div>
                          <button
                            onClick={() => openEditAccess(role)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <Icon icon="mdi:shield-account" className="w-4 h-4" />
                            Configure Access
                          </button>
                        </div>
                        
                        {/* Page Access Summary */}
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Page Access ({rolePagePermissions[role.id]?.length || 0} pages)</h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {rolePagePermissions[role.id]?.slice(0, 8).map((pagePath) => (
                              <span
                                key={pagePath}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {pagePath === '/' ? 'Home' : pagePath}
                              </span>
                            ))}
                            {rolePagePermissions[role.id]?.length > 8 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                +{rolePagePermissions[role.id].length - 8} more
                              </span>
                            )}
                            {(!rolePagePermissions[role.id] || rolePagePermissions[role.id].length === 0) && (
                              <span className="text-gray-500 text-sm">No pages configured</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Feature Permissions Summary */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Feature Permissions ({rolePermissions[role.id]?.length || 0} permissions)</h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {rolePermissions[role.id]?.slice(0, 6).map((permId) => {
                              const perm = permissions.find(p => p.id === permId);
                              return perm ? (
                                <span
                                  key={permId}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                >
                                  {perm.label}
                                </span>
                              ) : null;
                            })}
                            {rolePermissions[role.id]?.length > 6 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                +{rolePermissions[role.id].length - 6} more
                              </span>
                            )}
                            {(!rolePermissions[role.id] || rolePermissions[role.id].length === 0) && (
                              <span className="text-gray-500 text-sm">No permissions configured</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Role Modal */}
      <SimpleModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title={roleModalMode === "edit" ? "Edit Role" : "Add Role"}
        width="max-w-md"
      >
        <div className="space-y-6">
          <div>
            <label className="block font-semibold mb-1">Role Name *</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={roleForm.name}
              onChange={(e) =>
                setRoleForm({ ...roleForm, name: e.target.value })
              }
              placeholder="Enter role name"
              autoFocus
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Description</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              value={roleForm.description || ""}
              onChange={(e) =>
                setRoleForm({ ...roleForm, description: e.target.value })
              }
              placeholder="Enter description"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
              onClick={() => setShowRoleModal(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 rounded bg-blue-700 text-white font-semibold"
              onClick={saveRole}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : roleModalMode === "edit"
                ? "Save Changes"
                : "Add Role"}
            </button>
          </div>
        </div>
      </SimpleModal>
      {/* Delete Role Modal */}
      <SimpleModal
        isOpen={showDeleteRoleModal}
        onClose={() => setShowDeleteRoleModal(false)}
        title="Delete Role"
        width="max-w-md"
      >
        <div className="space-y-6">
          <p>
            Are you sure you want to delete the role{" "}
            <span className="font-bold">{roleToDelete?.name}</span>? This cannot
            be undone.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
              onClick={() => setShowDeleteRoleModal(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 rounded bg-red-700 text-white font-semibold"
              onClick={deleteRole}
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </SimpleModal>
      {/* Permission Modal */}
      <SimpleModal
        isOpen={showPermModal}
        onClose={() => setShowPermModal(false)}
        title={permModalMode === "edit" ? "Edit Permission" : "Add Permission"}
        width="max-w-md"
      >
        <div className="space-y-6">
          <div>
            <label className="block font-semibold mb-1">Permission Key *</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={permForm.key}
              onChange={(e) =>
                setPermForm({ ...permForm, key: e.target.value })
              }
              placeholder="e.g. manage_users"
              autoFocus
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Label *</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={permForm.label}
              onChange={(e) =>
                setPermForm({ ...permForm, label: e.target.value })
              }
              placeholder="e.g. Manage Users"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
              onClick={() => setShowPermModal(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 rounded bg-blue-700 text-white font-semibold"
              onClick={savePerm}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : permModalMode === "edit"
                ? "Save Changes"
                : "Add Permission"}
            </button>
          </div>
        </div>
      </SimpleModal>
      {/* Delete Permission Modal */}
      <SimpleModal
        isOpen={showDeletePermModal}
        onClose={() => setShowDeletePermModal(false)}
        title="Delete Permission"
        width="max-w-md"
      >
        <div className="space-y-6">
          <p>
            Are you sure you want to delete the permission{" "}
            <span className="font-bold">{permToDelete?.label}</span>? This
            cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
              onClick={() => setShowDeletePermModal(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 rounded bg-red-700 text-white font-semibold"
              onClick={deletePerm}
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </SimpleModal>
      {/* Edit Permissions Modal */}
      <SimpleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Edit Permissions: ${editingRole?.name || ""}`}
        width="max-w-lg"
      >
        <div className="space-y-6">
          <div>
            <div className="mb-2 font-semibold text-gray-700">Permissions</div>
            <div className="grid grid-cols-2 gap-3">
              {permissions.map((perm) => (
                <label
                  key={perm.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={editingPerms.includes(perm.id)}
                    onChange={() => handlePermChange(perm.id)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span>{perm.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
              onClick={() => setShowModal(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 rounded bg-blue-700 text-white font-semibold"
              onClick={savePermissions}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </SimpleModal>
      {/* Unified Access Management Modal */}
      <SimpleModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        title={`Edit Access: ${editingRole?.name || ""}`}
        width="max-w-6xl"
      >
        <div className="space-y-8">
          {/* Page Access Section */}
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Page Access</h3>
              <p className="text-sm text-gray-600">Select which pages this role can access and see in navigation</p>
            </div>
            
            {/* Select All Pages Checkbox */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(() => {
                    const allPages = [];
                    sidebarNav.forEach(item => {
                      if (item.href) {
                        allPages.push(item.href);
                      }
                      if (item.items) {
                        item.items.forEach(subItem => {
                          if (subItem.href) {
                            allPages.push(subItem.href);
                          }
                        });
                      }
                    });
                    return allPages.every(pagePath => editingPagePerms.includes(pagePath));
                  })()}
                  onChange={() => {
                    const allPages = [];
                    sidebarNav.forEach(item => {
                      if (item.href) {
                        allPages.push(item.href);
                      }
                      if (item.items) {
                        item.items.forEach(subItem => {
                          if (subItem.href) {
                            allPages.push(subItem.href);
                          }
                        });
                      }
                    });
                    
                    const allSelected = allPages.every(pagePath => editingPagePerms.includes(pagePath));
                    if (allSelected) {
                      setEditingPagePerms([]);
                    } else {
                      setEditingPagePerms(allPages);
                    }
                  }}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Select All Pages</div>
                  <div className="text-sm text-gray-500">Grant access to all available pages</div>
                </div>
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
              {(() => {
                const allPages = [];
                sidebarNav.forEach(item => {
                  if (item.href) {
                    allPages.push({
                      path: item.href,
                      label: item.label,
                      category: 'Standalone'
                    });
                  }
                  if (item.items) {
                    item.items.forEach(subItem => {
                      if (subItem.href) {
                        allPages.push({
                          path: subItem.href,
                          label: subItem.label,
                          category: item.category
                        });
                      }
                    });
                  }
                });
                return allPages.sort((a, b) => a.label.localeCompare(b.label));
              })().map((page) => (
                <label
                  key={page.path}
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={editingPagePerms.includes(page.path)}
                    onChange={() => handlePagePermChange(page.path)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{page.label}</div>
                    <div className="text-sm text-gray-500">{page.path}</div>
                    <div className="text-xs text-gray-400">{page.category}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Feature Permissions Section */}
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Feature Permissions</h3>
              <p className="text-sm text-gray-600">
                {editingPagePerms.length > 0 
                  ? `Select permissions for the ${editingPagePerms.length} page(s) this role can access`
                  : "Select permissions after choosing page access above"
                }
              </p>
            </div>
            
            {editingPagePerms.length === 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:information" className="w-5 h-5 text-yellow-600" />
                  <div>
                    <div className="font-medium text-yellow-800">No pages selected</div>
                    <div className="text-sm text-yellow-700">
                      Select pages above first, then choose relevant permissions for those pages.
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {editingPagePerms.length > 0 && (
              <>
                {/* Page-Aware Permission Mapping */}
                {(() => {
                  // Define which permissions are relevant to which pages
                  // Based on actual permissions in the database
                  const pagePermissionMap = {
                    '/dashboard': ['view_dashboard'],
                    '/pos': ['manage_sales', 'manage_returns'],
                    '/sales': ['manage_sales'],
                    '/sales-return': ['manage_returns'],
                    '/products': ['manage_products'],
                    '/brands': ['manage_products'], // Brands are part of products
                    '/category': ['manage_products'], // Categories are part of products
                    '/units': ['manage_products'], // Units are part of products
                    '/variant-attributes': ['manage_products'], // Attributes are part of products
                    '/inventory-overview': ['manage_products'], // Inventory is related to products
                    '/stock-operations': ['manage_products'],
                    '/stock-history': ['manage_products'],
                    '/purchases': ['manage_purchases'], // Purchases have their own permission
                    '/purchase-order': ['manage_purchases'],
                    '/purchase-return': ['manage_returns'],
                    '/suppliers': ['manage_suppliers'], // Suppliers have their own permission
                    '/customers': ['manage_sales'], // Customers are related to sales
                    '/reports': ['view_reports'],
                    '/users': ['manage_users'],
                    '/roles-permissions': ['manage_users'],
                    '/messages': ['manage_messages'], // Messages have their own permission
                    '/expenses': ['manage_expenses'], // Expenses have their own permission
                    '/expense-category': ['manage_expenses'],
                    '/discount': ['manage_sales'], // Discounts are related to sales
                    '/registers': ['manage_sales'], // Registers are related to sales
                    '/business-locations': ['manage_settings'], // Locations are settings
                    '/profile': ['manage_settings'], // Profile is settings
                  };

                  // Get relevant permissions for selected pages
                  const relevantPermissions = [];
                  editingPagePerms.forEach(pagePath => {
                    const pagePerms = pagePermissionMap[pagePath] || [];
                    pagePerms.forEach(permKey => {
                      const perm = permissions.find(p => p.key === permKey);
                      if (perm && !relevantPermissions.find(rp => rp.id === perm.id)) {
                        relevantPermissions.push(perm);
                      }
                    });
                  });

                  // No general permissions - only show page-specific permissions
                  const uniquePermissions = relevantPermissions;

                  return (
                    <>
                      {/* Quick Permission Presets */}
                      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">Quick Presets:</div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              // Select only view permissions
                              const viewPerms = uniquePermissions
                                .filter(p => p.key.includes('view_') || p.key.includes('read_'))
                                .map(p => p.id);
                              setEditingPerms(viewPerms);
                            }}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                          >
                            View Only
                          </button>
                          <button
                            onClick={() => {
                              // Select permissions for cashier-like role (sales focused)
                              const cashierPerms = uniquePermissions
                                .filter(p => p.key.includes('manage_sales') || p.key.includes('view_') || p.key.includes('create_sales'))
                                .map(p => p.id);
                              setEditingPerms(cashierPerms);
                            }}
                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200"
                          >
                            Cashier Access
                          </button>
                          <button
                            onClick={() => {
                              // Select permissions for manager-like role (broader access)
                              const managerPerms = uniquePermissions
                                .filter(p => p.key.includes('manage_') || p.key.includes('view_') || p.key.includes('create_'))
                                .map(p => p.id);
                              setEditingPerms(managerPerms);
                            }}
                            className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200"
                          >
                            Manager Access
                          </button>
                          <button
                            onClick={() => {
                              // Select all relevant permissions
                              setEditingPerms(uniquePermissions.map(p => p.id));
                            }}
                            className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200"
                          >
                            Full Access
                          </button>
                          <button
                            onClick={() => setEditingPerms([])}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>
                      
                      {/* Relevant Permissions */}
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Relevant Permissions ({uniquePermissions.length} available)
                        </div>
                        
                        {uniquePermissions.length === 0 ? (
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Icon icon="mdi:information" className="w-5 h-5 text-blue-600" />
                              <div>
                                <div className="font-medium text-blue-800">No specific permissions found</div>
                                <div className="text-sm text-blue-700">
                                  The selected pages don't have specific permissions defined. You can still assign general permissions below.
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                            {uniquePermissions.map((perm) => (
                              <label
                                key={perm.id}
                                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={editingPerms.includes(perm.id)}
                                  onChange={() => handlePermChange(perm.id)}
                                  className="form-checkbox h-4 w-4 text-green-600"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{perm.label}</div>
                                  <div className="text-sm text-gray-500">{perm.key}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* All Permissions (Collapsible) */}
                      <details className="border border-gray-200 rounded-lg">
                        <summary className="px-4 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100 font-medium text-gray-700">
                          Show All Permissions ({permissions.length} total)
                        </summary>
                        <div className="p-4">
                          <div className="text-sm text-gray-600 mb-3">
                            These are all available permissions. Only relevant ones are shown above.
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-48 overflow-y-auto">
                            {permissions.map((perm) => (
                              <label
                                key={perm.id}
                                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                                  uniquePermissions.find(p => p.id === perm.id) ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={editingPerms.includes(perm.id)}
                                  onChange={() => handlePermChange(perm.id)}
                                  className="form-checkbox h-4 w-4 text-green-600"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{perm.label}</div>
                                  <div className="text-sm text-gray-500">{perm.key}</div>
                                  {uniquePermissions.find(p => p.id === perm.id) && (
                                    <div className="text-xs text-green-600">✓ Relevant</div>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </details>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
            onClick={() => setShowAccessModal(false)}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="px-6 py-2 rounded bg-blue-700 text-white font-semibold"
            onClick={saveAccess}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Access Settings"}
          </button>
        </div>
      </SimpleModal>
    </MainLayout>
  );
}
