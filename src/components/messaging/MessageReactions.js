import React, { useState } from 'react';
import { Icon } from '@iconify/react';

const REACTIONS = [
  { emoji: '👍', name: 'thumbs_up' },
  { emoji: '❤️', name: 'heart' },
  { emoji: '😂', name: 'joy' },
  { emoji: '😮', name: 'astonished' },
  { emoji: '😢', name: 'cry' },
  { emoji: '😡', name: 'angry' },
];

export default function MessageReactions({ message, onReact, userReactions = [] }) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const handleReaction = (reactionName) => {
    onReact(message.id, reactionName);
    setShowReactionPicker(false);
  };

  const hasUserReacted = (reactionName) => {
    return userReactions.some(reaction => 
      reaction.message_id === message.id && reaction.reaction_name === reactionName
    );
  };

  const getReactionCount = (reactionName) => {
    return userReactions.filter(reaction => 
      reaction.message_id === message.id && reaction.reaction_name === reactionName
    ).length;
  };

  const getUniqueReactions = () => {
    const reactions = userReactions.filter(reaction => reaction.message_id === message.id);
    const unique = {};
    
    reactions.forEach(reaction => {
      if (!unique[reaction.reaction_name]) {
        unique[reaction.reaction_name] = {
          name: reaction.reaction_name,
          count: 0,
          users: []
        };
      }
      unique[reaction.reaction_name].count++;
      unique[reaction.reaction_name].users.push(reaction.user_name);
    });

    return Object.values(unique);
  };

  return (
    <div className="relative">
      {/* Reaction Picker */}
      {showReactionPicker && (
        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
          <div className="flex space-x-1">
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.name}
                onClick={() => handleReaction(reaction.name)}
                className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                  hasUserReacted(reaction.name) ? 'bg-blue-100' : ''
                }`}
                title={reaction.name}
              >
                <span className="text-lg">{reaction.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reaction Button */}
      <button
        onClick={() => setShowReactionPicker(!showReactionPicker)}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="Add reaction"
      >
        <Icon icon="mdi:emoticon-outline" className="w-4 h-4" />
      </button>

      {/* Display Reactions */}
      {getUniqueReactions().length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {getUniqueReactions().map((reaction) => {
            const reactionData = REACTIONS.find(r => r.name === reaction.name);
            return (
              <button
                key={reaction.name}
                onClick={() => handleReaction(reaction.name)}
                className={`inline-flex items-center px-2 py-1 text-xs rounded-full border transition-colors ${
                  hasUserReacted(reaction.name)
                    ? 'bg-blue-100 border-blue-200 text-blue-800'
                    : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                }`}
                title={`${reaction.users.join(', ')} reacted with ${reaction.name}`}
              >
                <span className="mr-1">{reactionData?.emoji}</span>
                <span>{reaction.count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
} 