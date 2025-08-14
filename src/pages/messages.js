import MainLayout from "@/layouts/MainLayout";
import { useUser } from "../hooks/useUser";
import useLogout from "../hooks/useLogout";
import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import useMessaging from "@/hooks/useMessaging";
import useUserPresence from "@/hooks/useUserPresence";
import ConversationList from "@/components/messaging/ConversationList";
import MessageList from "@/components/messaging/MessageList";
import MessageInput from "@/components/messaging/MessageInput";
import NewConversationModal from "@/components/messaging/NewConversationModal";
import MessageSearch from "@/components/messaging/MessageSearch";
import ConversationActions from "@/components/messaging/ConversationActions";
import PushNotificationService from "@/components/messaging/PushNotificationService";
import TypingIndicator from "@/components/messaging/TypingIndicator";
import UserStatus from "@/components/messaging/UserStatus";


export default function MessagesPage({ mode = "light", toggleMode, ...props }) {
  const { user, loading: userLoading, LoadingComponent } = useUser();
  const { handleLogout } = useLogout();
  const router = useRouter();
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [mutedConversations, setMutedConversations] = useState([]);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const scrollContainerRef = useRef(null);

  const {
    conversations,
    currentConversation,
    messages,
    participants,
    users,
    groupedUsers,
    loading,
    fetchConversations,
    fetchConversation,
    sendMessage,
    createConversation,
    fetchUsers,
    getRolePermissions,
    setCurrentConversation,
    setConversations,
    setMessages,
    setParticipants,
    typingUsers,
    sendTypingStatus,
    checkTypingStatus,
    refreshCurrentConversation,
  } = useMessaging(soundEnabled);

  const {
    onlineUsers,
    lastSeen,
    isUserOnline,
    getUserLastSeen,
    formatLastSeen,
    updatePresence,
    fetchOnlineUsers,
  } = useUserPresence();

  const permissions = getRolePermissions();

  const handleSelectConversation = async (conversation) => {
    // Clear current messages before switching to prevent mixing
    setMessages([]);
    setCurrentConversation(conversation);
    
    // Fetch conversation (will use cache if available for instant switching)
    fetchConversation(conversation.id);
    
    // Force scroll to bottom after conversation is loaded
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }, 200);
  };

  const handleSendMessage = async (content) => {
    try {
      setIsSendingMessage(true);
      await sendMessage(content);
      
      // Force auto-scroll to bottom after sending message
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      // Small delay to ensure the refresh prevention works
      setTimeout(() => {
        setIsSendingMessage(false);
      }, 500);
    }
  };

  const handleTypingChange = (isTyping) => {
    setIsUserTyping(isTyping);
  };

  const handleCreateConversation = async (participantIds, title, type) => {
    try {
      const conversation = await createConversation(participantIds, title, type);
      if (conversation) {
        await handleSelectConversation(conversation);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // Handle message reactions
  const handleMessageReaction = async (messageId, reactionName) => {
    try {
      const response = await fetch(`/api/messages/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message_id: messageId, 
          reaction_name: reactionName,
          user 
        }),
      });

      if (response.ok) {
        // Refresh messages to show updated reactions
        if (currentConversation) {
          await fetchConversation(currentConversation.id);
        }
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  // Handle conversation archiving
  const handleArchiveConversation = async (conversationId) => {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user }),
      });

      if (response.ok) {
        setArchivedConversations(prev => [...prev, conversationId]);
        toast.success('Conversation archived');
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
      toast.error('Failed to archive conversation');
    }
  };

  const handleUnarchiveConversation = async (conversationId) => {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}/unarchive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user }),
      });

      if (response.ok) {
        setArchivedConversations(prev => prev.filter(id => id !== conversationId));
        toast.success('Conversation unarchived');
      }
    } catch (error) {
      console.error('Error unarchiving conversation:', error);
      toast.error('Failed to unarchive conversation');
    }
  };

  // Handle conversation muting
  const handleMuteConversation = async (conversationId) => {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}/mute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user }),
      });

      if (response.ok) {
        setMutedConversations(prev => [...prev, conversationId]);
        toast.success('Conversation muted');
      }
    } catch (error) {
      console.error('Error muting conversation:', error);
      toast.error('Failed to mute conversation');
    }
  };

  const handleUnmuteConversation = async (conversationId) => {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}/unmute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user }),
      });

      if (response.ok) {
        setMutedConversations(prev => prev.filter(id => id !== conversationId));
        toast.success('Conversation unmuted');
      }
    } catch (error) {
      console.error('Error unmuting conversation:', error);
      toast.error('Failed to unmute conversation');
    }
  };

  // Handle conversation deletion
  const handleDeleteConversation = async (conversationId) => {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user }),
      });

      if (response.ok) {
        // Remove conversation from list
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        
        // If this was the current conversation, clear it
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(null);
          setMessages([]);
          setParticipants([]);
        }
        
        toast.success('Conversation deleted successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  // Handle message search
  const handleMessageSearch = (selectedMessage) => {
    // Scroll to the selected message
    const messageElement = document.getElementById(`message-${selectedMessage.id}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('bg-yellow-100');
      setTimeout(() => {
        messageElement.classList.remove('bg-yellow-100');
      }, 3000);
    }
  };

  // Initialize push notifications
  useEffect(() => {
    if (user && PushNotificationService) {
      PushNotificationService.initialize();
    }
  }, [user]);

  // Auto-refresh conversations every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        fetchConversations();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, fetchConversations]);

  // Refresh current conversation when conversation list updates
  useEffect(() => {
    // Don't refresh if we're currently sending a message (to prevent auto-refresh on send)
    if (isSendingMessage) {
      return;
    }
    
    if (currentConversation?.id && conversations.length > 0) {
      // Check if the current conversation has been updated in the list
      const updatedConversation = conversations.find(conv => conv.id === currentConversation.id);
      if (updatedConversation && updatedConversation.updated_at !== currentConversation.updated_at) {
        // Only refresh if the conversation was updated more recently than our current state
        const currentUpdatedAt = new Date(currentConversation.updated_at || 0);
        const newUpdatedAt = new Date(updatedConversation.updated_at);
        
        if (newUpdatedAt > currentUpdatedAt) {
          // Small delay to prevent rapid refreshes
          const timeoutId = setTimeout(() => {
            refreshCurrentConversation();
          }, 1000);
          
          return () => clearTimeout(timeoutId);
        }
      }
    }
  }, [conversations, currentConversation, refreshCurrentConversation, isSendingMessage]);

  // Force auto-scroll when messages change (for sender)
  useEffect(() => {
    if (messages.length > 0 && isSendingMessage) {
      // Force scroll to bottom when we're sending a message
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [messages, isSendingMessage]);

  // Auto-scroll to bottom when conversation is loaded (for initial load)
  useEffect(() => {
    if (messages.length > 0 && currentConversation && !loading) {
      // Scroll to bottom when conversation is initially loaded
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages, currentConversation, loading]);

  // Force scroll to bottom on page reload when conversation exists
  useEffect(() => {
    if (messages.length > 0 && currentConversation && !loading && !isUserTyping) {
      // Force scroll to bottom on page reload
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 500);
    }
  }, [messages.length, currentConversation, loading, isUserTyping]);



  if (userLoading && LoadingComponent) return LoadingComponent;
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  return (
    <MainLayout
      mode={mode}
      user={user}
      toggleMode={toggleMode}
      onLogout={handleLogout}
      {...props}
    >
      <div className="flex flex-1 bg-gray-50">
        <div className="flex flex-1">
          {/* Sidebar */}
          <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 flex-shrink-0 border-r border-gray-200 bg-white`}>
            <div className="h-full">
              <ConversationList
                conversations={conversations}
                currentConversation={currentConversation}
                onSelectConversation={handleSelectConversation}
                onCreateNew={() => setShowNewConversationModal(true)}
                loading={loading}
                isUserOnline={isUserOnline}
                formatLastSeen={formatLastSeen}
                getUserLastSeen={getUserLastSeen}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Mobile menu button */}
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                  >
                    <Icon icon="mdi:menu" className="w-6 h-6" />
                  </button>

                  {/* Conversation Info */}
                  {currentConversation ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Icon 
                          icon={currentConversation.type === 'group' ? 'mdi:account-group' : 'mdi:account'} 
                          className="w-5 h-5 text-blue-600" 
                        />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                          {currentConversation.title}
                          {/* Show online status for direct conversations */}
                          {currentConversation.type === 'direct' && currentConversation.other_participant_id && (
                            <div className="ml-2 relative">
                              <UserStatus
                                userId={currentConversation.other_participant_id}
                                isOnline={isUserOnline && isUserOnline(currentConversation.other_participant_id)}
                                lastSeen={getUserLastSeen && getUserLastSeen(currentConversation.other_participant_id)}
                                formatLastSeen={formatLastSeen}
                                size="sm"
                                className="border border-white rounded-full shadow-sm"
                              />
                            </div>
                          )}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {participants?.length || 0} participants
                          {currentConversation.type === 'direct' && currentConversation.other_participant_id && (
                            <span className="ml-2">
                              • {isUserOnline(currentConversation.other_participant_id) 
                                ? 'Online' 
                                : formatLastSeen(getUserLastSeen(currentConversation.other_participant_id))
                              }
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                      <p className="text-sm text-gray-500">Select a conversation to start messaging</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {currentConversation && (
                    <>
                      <button
                        onClick={refreshCurrentConversation}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title="Refresh messages"
                      >
                        <Icon icon="mdi:refresh" className="w-4 h-4 mr-2" />
                        Refresh
                      </button>
                      <button
                        onClick={() => setShowMessageSearch(true)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title="Search messages"
                      >
                        <Icon icon="mdi:magnify" className="w-4 h-4 mr-2" />
                        Search
                      </button>
                      <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`inline-flex items-center px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          soundEnabled 
                            ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-50' 
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                        title={soundEnabled ? "Disable sound notifications" : "Enable sound notifications"}
                      >
                        <Icon icon={soundEnabled ? "mdi:volume-high" : "mdi:volume-off"} className="w-4 h-4 mr-2" />
                        {soundEnabled ? "Sound On" : "Sound Off"}
                      </button>
                      <ConversationActions
                        conversation={currentConversation}
                        onArchive={handleArchiveConversation}
                        onUnarchive={handleUnarchiveConversation}
                        onDelete={handleDeleteConversation}
                        onMute={handleMuteConversation}
                        onUnmute={handleUnmuteConversation}
                        isArchived={archivedConversations.includes(currentConversation.id)}
                        isMuted={mutedConversations.includes(currentConversation.id)}
                      />
                      <button
                        onClick={() => setShowNewConversationModal(true)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <Icon icon="mdi:plus" className="w-4 h-4 mr-2" />
                        New
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              {currentConversation ? (
                <>
                  <div ref={scrollContainerRef} className="h-96 overflow-y-auto">
                    <MessageList
                      messages={messages}
                      loading={loading}
                      participants={participants}
                      onReaction={handleMessageReaction}
                      shouldAutoScroll={!isUserTyping}
                      scrollContainerRef={scrollContainerRef}
                      isUserOnline={isUserOnline}
                      formatLastSeen={formatLastSeen}
                      getUserLastSeen={getUserLastSeen}
                    />
                  </div>
                  <TypingIndicator typingUsers={typingUsers} />
                  <MessageInput
                    onSendMessage={handleSendMessage}
                    disabled={loading}
                    onTypingChange={handleTypingChange}
                    onTypingStatus={sendTypingStatus}
                    conversationId={currentConversation?.id}
                  />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon icon="mdi:chat-outline" className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Welcome to Messages
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md">
                      Start a conversation with your team members. You can send direct messages, create group chats, and stay connected with everyone.
                    </p>
                    <button
                      onClick={() => setShowNewConversationModal(true)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Icon icon="mdi:plus" className="w-4 h-4 mr-2" />
                      Start a Conversation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onCreateConversation={handleCreateConversation}
        users={users}
        groupedUsers={groupedUsers}
        loading={loading}
        permissions={permissions}
      />

      {/* Message Search Modal */}
      <MessageSearch
        isOpen={showMessageSearch}
        onClose={() => setShowMessageSearch(false)}
        messages={messages}
        onSelectMessage={handleMessageSearch}
      />

    </MainLayout>
  );
} 