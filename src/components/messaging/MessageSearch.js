import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { format } from 'date-fns';

export default function MessageSearch({ messages, onSelectMessage, isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSelectedIndex(0);
      return;
    }

    const results = messages
      .filter(message => 
        message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.sender?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(message => ({
        ...message,
        preview: message.content.length > 100 
          ? message.content.substring(0, 100) + '...' 
          : message.content
      }));

    setSearchResults(results);
    setSelectedIndex(0);
  }, [searchTerm, messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        onSelectMessage(searchResults[selectedIndex]);
        onClose();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleResultClick = (result) => {
    onSelectMessage(result);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Search Messages</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon icon="mdi:magnify" className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {searchTerm && (
            <div className="px-4 pb-4">
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Icon icon="mdi:magnify" className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No messages found</p>
                  <p className="text-sm">Try different keywords</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 mb-2">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </div>
                  {searchResults.map((result, index) => (
                    <div
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        index === selectedIndex
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <Icon icon="mdi:account" className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {result.sender?.full_name || 'Unknown User'}
                            </p>
                            <span className="text-xs text-gray-500">
                              {format(new Date(result.created_at), 'MMM dd, HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {result.preview}
                          </p>
                          {result.content !== result.preview && (
                            <p className="text-xs text-gray-400 mt-1">
                              Click to view full message
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>↑↓ Navigate</span>
              <span>Enter Select</span>
              <span>Esc Close</span>
            </div>
            {searchResults.length > 0 && (
              <span>
                {selectedIndex + 1} of {searchResults.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 