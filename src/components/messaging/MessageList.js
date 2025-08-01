import React, { useRef, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { format } from 'date-fns';
import { useUser } from '@/hooks/useUser';
import MessageReactions from './MessageReactions';

export default function MessageList({ messages, loading, participants, onReaction, shouldAutoScroll = true }) {
  const { user } = useUser();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const threshold = 100; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const isNear = isNearBottom();
      setShowScrollButton(!isNear);
    }
  };

  useEffect(() => {
    // Only auto-scroll if:
    // 1. User is near the bottom of the message list
    // 2. There are messages to scroll to
    // 3. Auto-scroll is enabled
    if (messages.length > 0 && isNearBottom() && shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return format(date, 'HH:mm');
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };

  const getParticipantName = (userId) => {
    const participant = participants?.find(p => p.user_id === userId);
    return participant ? 'Unknown User' : 'Unknown User';
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      cashier: 'bg-green-100 text-green-800',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${roleColors[role] || 'bg-gray-100 text-gray-800'}`}>
        {role}
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

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Icon icon="mdi:chat-outline" className="w-12 h-12 mb-4" />
        <p className="text-sm">No messages yet</p>
        <p className="text-xs text-gray-400 mt-1">Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <div 
        ref={messagesContainerRef} 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
      {messages.map((message, index) => {
        const isOwnMessage = message.sender_id === user?.id;
        const showSenderInfo = index === 0 || 
          messages[index - 1]?.sender_id !== message.sender_id ||
          new Date(message.created_at) - new Date(messages[index - 1]?.created_at) > 5 * 60 * 1000; // 5 minutes

                 return (
           <div key={message.id} id={`message-${message.id}`} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
              {/* Sender Info */}
              {!isOwnMessage && showSenderInfo && (
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <Icon icon="mdi:account" className="w-3 h-3 text-gray-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {message.sender?.full_name || getParticipantName(message.sender_id)}
                  </span>
                  {message.sender?.role && (
                    getRoleBadge(message.sender.role)
                  )}
                </div>
              )}

              {/* Message Bubble */}
              <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`px-4 py-2 rounded-lg max-w-full ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
              </div>

                             {/* Message Time */}
               <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mt-1`}>
                 <span className="text-xs text-gray-500">
                   {formatMessageTime(message.created_at)}
                 </span>
               </div>

               {/* Message Reactions */}
               <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mt-1`}>
                 <MessageReactions
                   message={message}
                   onReact={onReaction}
                   currentUserId={user?.id}
                 />
               </div>
            </div>
          </div>
        );
              })}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 z-10"
          title="Scroll to bottom"
        >
          <Icon icon="mdi:chevron-down" className="w-5 h-5" />
        </button>
      )}
    </div>
  );
} 