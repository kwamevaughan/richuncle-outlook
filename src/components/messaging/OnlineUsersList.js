import React from 'react';
import { Icon } from '@iconify/react';
import UserStatus from './UserStatus';

export default function OnlineUsersList({ 
  users, 
  onlineUsers, 
  isUserOnline, 
  formatLastSeen, 
  getUserLastSeen,
  onStartConversation 
}) {
  const onlineUsersList = users.filter(user => isUserOnline(user.id));
  const offlineUsersList = users.filter(user => !isUserOnline(user.id));

  const handleUserClick = (user) => {
    if (onStartConversation) {
      onStartConversation([user.id], user.full_name, 'direct');
    }
  };

  return (
    <div className="bg-white border-l border-gray-200 w-64 flex-shrink-0">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Team</h3>
        <p className="text-sm text-gray-500">
          {onlineUsersList.length} online, {offlineUsersList.length} offline
        </p>
      </div>
      
      <div className="overflow-y-auto h-full">
        {/* Online Users */}
        {onlineUsersList.length > 0 && (
          <div className="p-4">
            <h4 className="text-sm font-medium text-green-600 mb-3 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Online ({onlineUsersList.length})
            </h4>
            <div className="space-y-2">
              {onlineUsersList.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="relative">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Icon icon="mdi:account" className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <UserStatus
                        userId={user.id}
                        isOnline={true}
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offline Users */}
        {offlineUsersList.length > 0 && (
          <div className="p-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
              Offline ({offlineUsersList.length})
            </h4>
            <div className="space-y-2">
              {offlineUsersList.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors opacity-75"
                >
                  <div className="relative">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Icon icon="mdi:account" className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <UserStatus
                        userId={user.id}
                        isOnline={false}
                        lastSeen={getUserLastSeen(user.id)}
                        formatLastSeen={formatLastSeen}
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {formatLastSeen(getUserLastSeen(user.id))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {users.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Icon icon="mdi:account-group-outline" className="w-8 h-8 mb-2" />
            <p className="text-sm">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}