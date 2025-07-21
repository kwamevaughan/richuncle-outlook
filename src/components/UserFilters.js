export default function UserFilters({ 
  searchTerm, 
  setSearchTerm, 
  roleFilter, 
  setRoleFilter, 
  statusFilter, 
  setStatusFilter, 
  availableRoles,
  onAddUser
}) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="all">All Roles</option>
          {availableRoles.map(role => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {onAddUser && (
          <button
            onClick={onAddUser}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add User
          </button>
        )}
      </div>
    </div>
  );
} 