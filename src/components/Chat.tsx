import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, ChevronUp, Loader2 } from 'lucide-react';
import { ChatMessage, TIERS } from '../types/game';
import { useTheme } from './ThemeProvider';
import { audioManager } from '../utils/audioManager';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onLoadMoreMessages?: (beforeDate: string) => Promise<ChatMessage[]>;
  disabled?: boolean;
  isOffline: boolean;
}

interface MessageGroup {
  date: string;
  messages: ChatMessage[];
}

export const Chat: React.FC<ChatProps> = ({ 
  messages, 
  onSendMessage, 
  onLoadMoreMessages,
  disabled, 
  isOffline 
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
      audioManager.playGuiSound();
      onSendMessage(inputMessage);
      setInputMessage('');
      inputRef.current?.focus();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTierInfo = (tierLevel: number) => {
    return TIERS.find(t => t.level === tierLevel) || TIERS[0];
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    
    // Show full date for older messages
    return date.toLocaleDateString([], { 
      weekday: 'long',
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const groupMessagesByDay = (messages: ChatMessage[]): MessageGroup[] => {
    const groups: { [key: string]: ChatMessage[] } = {};
    
    // Sort messages by date (oldest first for grouping)
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    sortedMessages.forEach(message => {
      const date = new Date(message.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    // Convert to array and sort by date (newest first for display)
    return Object.entries(groups)
      .map(([date, messages]) => ({ date, messages }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleLoadMore = async () => {
    if (!onLoadMoreMessages || isLoadingMore || !hasMoreMessages) return;
    
    setIsLoadingMore(true);
    audioManager.playGuiSound();
    
    try {
      // Get the oldest message date
      const oldestMessage = messages[messages.length - 1];
      if (!oldestMessage) return;
      
      const olderMessages = await onLoadMoreMessages(oldestMessage.created_at);
      
      if (olderMessages.length === 0) {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    
    // Load more when scrolled near the top
    if (scrollTop < 100 && !isLoadingMore && hasMoreMessages && onLoadMoreMessages) {
      handleLoadMore();
    }
  };

  // Group messages by day
  const messageGroups = groupMessagesByDay(messages);

  // Limit to recent days (show last 7 days by default)
  const visibleGroups = messageGroups.slice(0, 7);
  const hasOlderMessages = messageGroups.length > 7 || hasMoreMessages;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 h-96 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageCircle style={{ color: currentTheme.colors.primary }} />
          Global Chat
        </h3>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col"
        onScroll={handleScroll}
      >
        {/* Load more button */}
        {hasOlderMessages && onLoadMoreMessages && (
          <div className="flex justify-center mb-4">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Load older messages
                </>
              )}
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No messages yet. Be the first to say something!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {visibleGroups.map((group) => (
              <div key={group.date} className="space-y-3">
                {/* Date header */}
                <div className="flex items-center justify-center">
                  <div className="bg-gray-700/50 px-3 py-1 rounded-full">
                    <span className="text-xs text-gray-400 font-medium">
                      {formatDateHeader(group.date)}
                    </span>
                  </div>
                </div>
                
                {/* Messages for this day */}
                <div className="space-y-3">
                  {group.messages
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .map((message) => {
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
                    })}
                </div>
              </div>
            ))}
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
    </div>
  );
};