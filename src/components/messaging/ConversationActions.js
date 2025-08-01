import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import SimpleModal from '@/components/SimpleModal';

export default function ConversationActions({ 
  conversation, 
  onArchive, 
  onUnarchive, 
  onDelete, 
  onMute,
  onUnmute,
  isArchived = false,
  isMuted = false
}) {
  const [showActions, setShowActions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleArchive = () => {
    onArchive(conversation.id);
    setShowActions(false);
  };

  const handleUnarchive = () => {
    onUnarchive(conversation.id);
    setShowActions(false);
  };

  const handleDelete = () => {
    onDelete(conversation.id);
    setShowDeleteModal(false);
    setShowActions(false);
  };

  const handleMute = () => {
    onMute(conversation.id);
    setShowActions(false);
  };

  const handleUnmute = () => {
    onUnmute(conversation.id);
    setShowActions(false);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowActions(!showActions)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="More actions"
        >
          <Icon icon="mdi:dots-vertical" className="w-5 h-5" />
        </button>

        {showActions && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
            <div className="py-1">
              {isArchived ? (
                <button
                  onClick={handleUnarchive}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Icon icon="mdi:archive-arrow-up" className="w-4 h-4 mr-2" />
                  Unarchive
                </button>
              ) : (
                <button
                  onClick={handleArchive}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Icon icon="mdi:archive-arrow-down" className="w-4 h-4 mr-2" />
                  Archive
                </button>
              )}

              {isMuted ? (
                <button
                  onClick={handleUnmute}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Icon icon="mdi:volume-high" className="w-4 h-4 mr-2" />
                  Unmute
                </button>
              ) : (
                <button
                  onClick={handleMute}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Icon icon="mdi:volume-off" className="w-4 h-4 mr-2" />
                  Mute
                </button>
              )}

              <hr className="my-1" />

              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
              >
                <Icon icon="mdi:delete" className="w-4 h-4 mr-2" />
                Delete Conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <SimpleModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Conversation"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this conversation? This action cannot be undone.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </SimpleModal>
    </>
  );
} 