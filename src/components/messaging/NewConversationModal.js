import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import SimpleModal from '@/components/SimpleModal';
import { useUser } from '@/hooks/useUser';
import UserStatus from '@/components/messaging/UserStatus';
import useUserPresence from '@/hooks/useUserPresence';

export default function NewConversationModal({ 
  isOpen, 
  onClose, 
  onCreateConversation, 
  users, 
  groupedUsers, 
  loading,
  permissions 
}) {
  const { user } = useUser();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [conversationTitle, setConversationTitle] = useState('');
  const [conversationType, setConversationType] = useState('direct');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Get user presence data
  const {
    isUserOnline,
    getUserLastSeen,
    formatLastSeen,
  } = useUserPresence();

  useEffect(() => {
    if (!isOpen) {
      setSelectedUsers([]);
      setConversationTitle('');
      setConversationType('direct');
      setSearchTerm('');
      setRoleFilter('all');
    }
  }, [isOpen]);

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateConversation = () => {
    if (selectedUsers.length === 0) {
      return;
    }

    const title = conversationTitle.trim() || 
      (conversationType === 'direct' && selectedUsers.length === 1 
        ? users.find(u => u.id === selectedUsers[0])?.full_name 
        : `Group with ${selectedUsers.length} participants`);

    onCreateConversation(selectedUsers, title, conversationType);
    onClose();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      cashier: 'bg-green-100 text-green-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Conversation"
      size="lg"
    >
      <div className="space-y-6">
        {/* Conversation Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Conversation Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="direct"
                checked={conversationType === 'direct'}
                onChange={(e) => setConversationType(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">Direct Message</span>
            </label>
            {permissions?.canCreateGroups && (
              <label className="flex items-center">
                <input
                  type="radio"
                  value="group"
                  checked={conversationType === 'group'}
                  onChange={(e) => setConversationType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Group Chat</span>
              </label>
            )}
            {permissions?.canBroadcast && (
              <label className="flex items-center">
                <input
                  type="radio"
                  value="broadcast"
                  checked={conversationType === 'broadcast'}
                  onChange={(e) => setConversationType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Broadcast</span>
              </label>
            )}
          </div>
        </div>

        {/* Conversation Title (for groups/broadcasts) */}
        {(conversationType === 'group' || conversationType === 'broadcast') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conversation Title
            </label>
            <input
              type="text"
              value={conversationTitle}
              onChange={(e) => setConversationTitle(e.target.value)}
              placeholder="Enter conversation title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon icon="mdi:magnify" className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex space-x-2">
            {['all', 'admin', 'manager', 'cashier'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1 text-xs font-medium rounded-md ${
                  roleFilter === role
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* User List */}
        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No users found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserToggle(user.id)}
                  className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedUsers.includes(user.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="relative">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Icon icon="mdi:account" className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="absolute -bottom-1 -right-1">
                        <UserStatus
                          userId={user.id}
                          isOnline={isUserOnline && isUserOnline(user.id)}
                          lastSeen={getUserLastSeen && getUserLastSeen(user.id)}
                          formatLastSeen={formatLastSeen}
                          size="xs"
                          className="border border-white rounded-full shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.full_name}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                          <span className="text-xs text-gray-500">
                            {isUserOnline && isUserOnline(user.id) 
                              ? 'Online' 
                              : formatLastSeen && getUserLastSeen && formatLastSeen(getUserLastSeen(user.id))
                            }
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Users Summary */}
        {selectedUsers.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Selected Users ({selectedUsers.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((userId) => {
                const user = users.find(u => u.id === userId);
                return user ? (
                  <span
                    key={userId}
                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    <div className="relative mr-1">
                      <div className="w-3 h-3 bg-blue-200 rounded-full flex items-center justify-center">
                        <Icon icon="mdi:account" className="w-1.5 h-1.5 text-blue-600" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <UserStatus
                          userId={user.id}
                          isOnline={isUserOnline && isUserOnline(user.id)}
                          lastSeen={getUserLastSeen && getUserLastSeen(user.id)}
                          formatLastSeen={formatLastSeen}
                          size="xs"
                          className="border border-white rounded-full shadow-sm"
                        />
                      </div>
                    </div>
                    {user.full_name}
                    <button
                      onClick={() => handleUserToggle(userId)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <Icon icon="mdi:close" className="w-3 h-3" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateConversation}
            disabled={selectedUsers.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Create Conversation
          </button>
        </div>
      </div>
    </SimpleModal>
  );
} 