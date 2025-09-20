import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ChatMessage, TIERS } from '../types/game';
import { useTheme } from './ThemeProvider';
import { audioManager } from '../utils/audioManager';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isOffline: boolean;
}

export const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, disabled, isOffline }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('chatExpanded');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const { currentTheme } = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !disabled) {
      onSendMessage(inputMessage);
      setInputMessage('');
      inputRef.current?.focus();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTierInfo = (tierLevel: number) => {
    return TIERS.find(t => t.level === tierLevel) || TIERS[0];
  };

  const toggleExpanded = () => {
    audioManager.playGuiSound();
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('chatExpanded', JSON.stringify(newState));
  };

  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 ${isExpanded ? 'h-96' : 'h-auto'} flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageCircle style={{ color: currentTheme.colors.primary }} />
            Global Chat
          </h3>
          <button
            onClick={toggleExpanded}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      {isExpanded && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Be the first to say something!</p>
              </div>
            ) : (
              [...messages].reverse().map((message) => {
                const tierInfo = getTierInfo(message.tier);
                return (
                  <div key={message.id} className="group">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                        <span className="text-sm">{tierInfo.icon}</span>
                        <span 
                          className={`font-semibold text-sm truncate max-w-[120px] ${
                            tierInfo.color === 'rainbow'
                              ? 'bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent'
                              : ''
                          }`}
                          style={{ 
                            color: tierInfo.color === 'rainbow' ? undefined : tierInfo.color
                          }}
                          title={message.nickname}
                        >
                          {message.nickname}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-sm break-words">{message.message}</p>
                        <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {isOffline && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Chat is not available in offline mode
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700/50" style={{ opacity: isOffline ? 0.5 : 1 }}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={disabled ? "Loading..." : "Type a message..."}
                disabled={disabled || isOffline}
                maxLength={200}
                className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={disabled || !inputMessage.trim() || isOffline}
                className="disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                style={{
                  backgroundColor: currentTheme.colors.primary,
                  ':hover': { backgroundColor: currentTheme.colors.secondary }
                }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {inputMessage.length}/200 characters
            </p>
          </form>
        </>
      )}
    </div>
  );
};
