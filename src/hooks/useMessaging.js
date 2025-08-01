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
      setMessages(data.messages);
      setParticipants(data.participants);
      
      // Track last message for real-time updates
      if (data.messages && data.messages.length > 0) {
        setLastMessageId(data.messages[data.messages.length - 1].id);
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

    console.log('Checking for new messages in conversation:', currentConversation.id, 'lastMessageId:', lastMessageId);

    try {
      // If we have a lastMessageId, use it to get only new messages
      // Otherwise, fetch all messages to ensure we have the latest
      const requestBody = { user };
      if (lastMessageId) {
        requestBody.after = lastMessageId;
      }

      const response = await fetch(`/api/messages/${currentConversation.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Received messages:', data.messages?.length || 0, 'messages');
        
        if (data.messages && data.messages.length > 0) {
          if (lastMessageId) {
            // Only add new messages if we're checking for updates
            const newMessages = data.messages.filter(msg => msg.id !== lastMessageId);
            console.log('New messages found:', newMessages.length);
            
            if (newMessages.length > 0) {
              setMessages(prev => [...prev, ...newMessages]);
              setLastMessageId(newMessages[newMessages.length - 1].id);
              
              // Show notification for new messages from others
              const ownMessages = newMessages.filter(msg => msg.sender_id === user?.id);
              if (ownMessages.length < newMessages.length) {
                toast.success(`${newMessages.length - ownMessages.length} new message(s)`);
                
                // Play notification sound for new messages from others
                if (soundEnabled) {
                  try {
                    const { playMessageNotification } = await import('../utils/messageSounds');
                    playMessageNotification();
                  } catch (error) {
                    console.log('Could not play message notification sound:', error);
                  }
                }
                
                // Refresh conversation list to update sidebar
                fetchConversations();
              }
            }
          } else {
            // If no lastMessageId, update the entire message list and set lastMessageId
            console.log('No lastMessageId, updating entire message list');
            setMessages(data.messages);
            setLastMessageId(data.messages[data.messages.length - 1].id);
          }
        }
      }
    } catch (error) {
      console.error('Error checking for new messages:', error);
    }
  }, [currentConversation, lastMessageId, user, soundEnabled, fetchConversations]);

  // Send message
  const sendMessage = useCallback(async (content, conversationId = null) => {
    if (!user) return;

    const targetConversationId = conversationId || currentConversation?.id;
    if (!targetConversationId) {
      toast.error('No conversation selected');
      return;
    }

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
      
      // Add new message to state
      setMessages(prev => [...prev, data.message]);
      setLastMessageId(data.message.id);
      
      // Update conversation in list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === targetConversationId 
            ? { ...conv, updated_at: new Date().toISOString() }
            : conv
        )
      );

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
  }, [user, currentConversation]);

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

    console.log('Starting polling for conversation:', currentConversation.id, 'lastMessageId:', lastMessageId);

    const interval = setInterval(() => {
      console.log('Polling for new messages...');
      checkForNewMessages();
      checkTypingStatus(currentConversation.id);
    }, 3000); // Check every 3 seconds

    return () => {
      console.log('Stopping polling for conversation:', currentConversation.id);
      clearInterval(interval);
    };
  }, [currentConversation, checkForNewMessages, checkTypingStatus, lastMessageId]);

  // Initialize
  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchUsers();
    }
  }, [user, fetchConversations, fetchUsers]);

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
    typingUsers,
    sendTypingStatus,
    checkTypingStatus,
  };
} 