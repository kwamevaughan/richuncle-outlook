import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { formatDistanceToNow } from 'date-fns';

export default function ConversationList({ 
  conversations, 
  currentConversation, 
  onSelectConversation, 
  onCreateNew,
  loading 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const matchesSearch = conv.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           conv.last_message?.content?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || conv.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [conversations, searchTerm, filterType]);

  const getConversationIcon = (type) => {
    switch (type) {
      case 'group':
        return 'mdi:account-group';
      case 'broadcast':
        return 'mdi:broadcast';
      default:
        return 'mdi:account';
    }
  };

  const getUnreadBadge = (unreadCount) => {
    if (!unreadCount || unreadCount === 0) return null;
    
    return (
      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Icon icon="mdi:plus" className="w-4 h-4 mr-2" />
            New
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon icon="mdi:magnify" className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1">
          {['all', 'direct', 'group', 'broadcast'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                filterType === type
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Icon icon="mdi:chat-outline" className="w-12 h-12 mb-4" />
            <p className="text-sm">
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={onCreateNew}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Start a conversation
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  currentConversation?.id === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Icon 
                        icon={getConversationIcon(conversation.type)} 
                        className="w-5 h-5 text-blue-600" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conversation.title}
                      </p>
                      <div className="flex items-center space-x-2">
                        {getUnreadBadge(conversation.unread_count)}
                        {conversation.last_message && (
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {conversation.last_message && (
                      <p className="text-sm text-gray-500 truncate mt-1">
                        <span className="font-medium">
                          {conversation.last_message.sender?.full_name}:
                        </span>{' '}
                        {conversation.last_message.content}
                      </p>
                    )}
                    
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-400">
                        {conversation.participants} participant{conversation.participants !== 1 ? 's' : ''}
                      </span>
                      {conversation.type !== 'direct' && (
                        <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {conversation.type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 