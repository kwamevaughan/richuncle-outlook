import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

export default function MessageInput({ onSendMessage, disabled = false, placeholder = "Type a message...", onTypingChange }) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    const typing = e.target.value.length > 0;
    setIsTyping(typing);
    if (onTypingChange) {
      onTypingChange(typing);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          
          {/* Character count */}
          {isTyping && (
            <div className="absolute bottom-1 right-2 text-xs text-gray-400">
              {message.length}/1000
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="inline-flex items-center justify-center w-10 h-10 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Icon icon="mdi:send" className="w-5 h-5" />
        </button>
      </form>

      {/* Typing indicator */}
      {isTyping && (
        <div className="mt-2 text-xs text-gray-500">
          <span className="inline-flex items-center">
            <span className="animate-pulse">Typing</span>
            <span className="ml-1">
              <span className="inline-block w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="inline-block w-1 h-1 bg-gray-400 rounded-full animate-bounce ml-1" style={{ animationDelay: '150ms' }}></span>
              <span className="inline-block w-1 h-1 bg-gray-400 rounded-full animate-bounce ml-1" style={{ animationDelay: '300ms' }}></span>
            </span>
          </span>
        </div>
      )}
    </div>
  );
} 