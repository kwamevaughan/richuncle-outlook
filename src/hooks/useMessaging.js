import { useState, useEffect, useCallback } from 'react';
import { useUser } from './useUser';
import toast from 'react-hot-toast';

export default function useMessaging(soundEnabled = true) {
  const { user } = useUser();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [groupedUsers, setGroupedUsers] = useState({});
  const [lastMessageId, setLastMessageId] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch conversation details and messages
  const fetchConversation = useCallback(async (conversationId) => {
    if (!user || !conversationId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }

      const data = await response.json();
      setCurrentConversation(data.conversation);
      
      // Sort messages by created_at to ensure proper order
      const sortedMessages = (data.messages || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setMessages(sortedMessages);
      setParticipants(data.participants || []);
      
      // Track last message for real-time updates
      if (data.messages && data.messages.length > 0) {
        setLastMessageId(data.messages[data.messages.length - 1].id);
      } else {
        setLastMessageId(null);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast.error('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [user]);

      // Check for new messages in current conversation
  const checkForNewMessages = useCallback(async () => {
    if (!currentConversation?.id) return;

    try {
      // Always fetch all messages to ensure we have the latest
      const response = await fetch(`/api/messages/${currentConversation.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.messages && data.messages.length > 0) {
          // Compare with current messages to find new ones
          setMessages(prev => {
            const currentIds = new Set(prev.map(msg => msg.id));
            const newMessages = data.messages.filter(msg => !currentIds.has(msg.id));
            
            if (newMessages.length > 0) {
              // Show notification for new messages from others
              const ownMessages = newMessages.filter(msg => msg.sender_id === user?.id);
              if (ownMessages.length < newMessages.length) {
                toast.success(`${newMessages.length - ownMessages.length} new message(s)`);
                
                // Play notification sound for new messages from others
                if (soundEnabled) {
                  // Use setTimeout to avoid async issues in setState callback
                  setTimeout(async () => {
                    try {
                      const { playMessageNotification } = await import('../utils/messageSounds');
                      playMessageNotification();
                    } catch (error) {
                      console.log('Could not play message notification sound:', error);
                    }
                  }, 0);
                }
              }
            }
            
            // Always update to the latest messages and sort them
            return data.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          });
          
          // Update lastMessageId to the latest message
          setLastMessageId(data.messages[data.messages.length - 1].id);
        } else {
          // No messages in conversation
          setMessages([]);
          setLastMessageId(null);
        }
      }
    } catch (error) {
      console.error('Error checking for new messages:', error);
    }
  }, [currentConversation, user, soundEnabled]);

  // Send message
  const sendMessage = useCallback(async (content, conversationId = null) => {
    if (!user) return;

    const targetConversationId = conversationId || currentConversation?.id;
    if (!targetConversationId) {
      toast.error('No conversation selected');
      return;
    }

    // Create optimistic message (appears immediately)
    const optimisticMessage = {
      id: `temp-${Date.now()}-${Math.random()}`,
      conversation_id: targetConversationId,
      sender_id: user.id,
      content: content,
      message_type: 'text',
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role
      }
    };

    // Add optimistic message immediately to UI
    setMessages(prev => {
      const allMessages = [...prev, optimisticMessage];
      return allMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    });

    // Don't update conversation list immediately to prevent auto-refresh
    // The conversation will be updated when the server responds

    try {
      const response = await fetch(`/api/messages/${targetConversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content,
          user 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Replace optimistic message with real message
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => msg.id !== optimisticMessage.id);
        const allMessages = [...filteredMessages, data.message];
        return allMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      });
      setLastMessageId(data.message.id);

      // Play success sound for sent message
      if (soundEnabled) {
        try {
          const { playMessageSent } = await import('../utils/messageSounds');
          playMessageSent();
        } catch (error) {
          console.log('Could not play message sent sound:', error);
        }
      }

      return data.message;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      toast.error('Failed to send message');
      
      // Play error sound for failed message
      if (soundEnabled) {
        try {
          const { playMessageError } = await import('../utils/messageSounds');
          playMessageError();
        } catch (error) {
          console.log('Could not play message error sound:', error);
        }
      }
      
      throw error;
    }
  }, [user, currentConversation, soundEnabled]);

  // Create new conversation
  const createConversation = useCallback(async (participantIds, title = null) => {
    if (!user) return;

    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant_ids: participantIds,
          title,
          user,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const data = await response.json();
      
      // Add new conversation to list
      setConversations(prev => [data.conversation, ...prev]);
      
      toast.success('Conversation created successfully');
      return data.conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation');
      throw error;
    }
  }, [user]);

  // Fetch available users
  const fetchUsers = useCallback(async (role = 'all', search = '') => {
    if (!user) return;

    try {
      const params = new URLSearchParams();
      if (role !== 'all') params.append('role', role);
      if (search) params.append('search', search);

      const response = await fetch(`/api/messages/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user,
          role,
          search 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setGroupedUsers(data.groupedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  }, [user]);

  // Get role-based permissions
  const getRolePermissions = useCallback(() => {
    if (!user) return {};

    const permissions = {
      admin: {
        canMessageAll: true,
        canCreateGroups: true,
        canBroadcast: true,
        canMessageRoles: ['admin', 'manager', 'cashier'],
      },
      manager: {
        canMessageAll: true,
        canCreateGroups: true,
        canBroadcast: false,
        canMessageRoles: ['admin', 'manager', 'cashier'],
      },
      cashier: {
        canMessageAll: false,
        canCreateGroups: false,
        canBroadcast: false,
        canMessageRoles: ['cashier', 'manager', 'admin'],
      },
    };

    return permissions[user.role] || permissions.cashier;
  }, [user]);

  // Send typing status
  const sendTypingStatus = useCallback(async (conversationId, isTyping) => {
    if (!user || !conversationId) return;

    try {
      await fetch(`/api/messages/conversations/${conversationId}/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user,
          isTyping 
        }),
      });
    } catch (error) {
      console.error('Error sending typing status:', error);
    }
  }, [user]);

  // Check for typing status updates
  const checkTypingStatus = useCallback(async (conversationId) => {
    if (!user || !conversationId) return;

    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user,
          check: true 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTypingUsers(data.typingUsers || []);
      }
    } catch (error) {
      console.error('Error checking typing status:', error);
    }
  }, [user]);

  // Real-time polling for new messages and typing status
  useEffect(() => {
    if (!currentConversation?.id) return;

    const interval = setInterval(() => {
      checkForNewMessages();
      checkTypingStatus(currentConversation.id);
    }, 5000); // Check every 5 seconds

    return () => {
      clearInterval(interval);
    };
  }, [currentConversation?.id, checkForNewMessages, checkTypingStatus]);

  // Initialize
  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchUsers();
    }
  }, [user, fetchConversations, fetchUsers]);

  // Manual refresh function for current conversation
  const refreshCurrentConversation = useCallback(async () => {
    if (currentConversation?.id) {
      await fetchConversation(currentConversation.id);
    }
  }, [currentConversation?.id, fetchConversation]);

  return {
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
    typingUsers,
    sendTypingStatus,
    checkTypingStatus,
    refreshCurrentConversation,
  };
} 