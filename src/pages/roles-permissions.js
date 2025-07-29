import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { GenericTable } from "@/components/GenericTable";
import SimpleModal from "@/components/SimpleModal";
import TooltipIconButton from "@/components/TooltipIconButton";

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
  // Search/filter
  const [roleSearch, setRoleSearch] = useState("");
  const [permSearch, setPermSearch] = useState("");
  // Tab state
  const [activeTab, setActiveTab] = useState("roles"); // 'roles' or 'permissions'

  // Fetch all data on mount or after changes
  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [rolesRes, permsRes, assignmentsRes, usersRes] = await Promise.all([
        fetch("/api/roles").then((r) => r.json()),
        fetch("/api/permissions").then((r) => r.json()),
        fetch("/api/role-permissions").then((r) => r.json()),
        fetch("/api/users").then((r) => r.json()),
      ]);
      if (!rolesRes.success)
        throw new Error(rolesRes.error || "Failed to fetch roles");
      if (!permsRes.success)
        throw new Error(permsRes.error || "Failed to fetch permissions");
      if (!assignmentsRes.success)
        throw new Error(assignmentsRes.error || "Failed to fetch assignments");
      if (!usersRes.success)
        throw new Error(usersRes.error || "Failed to fetch users");
      setRoles(rolesRes.data || []);
      setPermissions(permsRes.data || []);
      const rp = {};
      for (const role of rolesRes.data) rp[role.id] = [];
      for (const a of assignmentsRes.data) {
        if (rp[a.role_id]) rp[a.role_id].push(a.permission_id);
      }
      setRolePermissions(rp);
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
    if (!roleForm.name.trim()) return alert("Role name is required");
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
    } catch (err) {
      alert(err.message || "Failed to save role");
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
    } catch (err) {
      alert(err.message || "Failed to delete role");
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
      return alert("Key and label are required");
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
    } catch (err) {
      alert(err.message || "Failed to save permission");
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
    } catch (err) {
      alert(err.message || "Failed to delete permission");
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
      label: "Edit Permissions",
      icon: "mdi:shield-key-outline",
      onClick: openEditPermissions,
      render: (row) => (
        <TooltipIconButton
          icon="mdi:shield-key-outline"
          label="Edit Permissions"
          onClick={() => openEditPermissions(row)}
          mode={mode}
          className="bg-green-50 text-green-600 text-xs"
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
    } catch (err) {
      alert(err.message || "Failed to update permissions");
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
    </MainLayout>
  );
}
