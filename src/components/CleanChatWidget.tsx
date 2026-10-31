import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Send, 
  Smile, 
  Paperclip, 
  RotateCcw, 
  Trash2,
  Minimize2,
  Maximize2,
  Check,
  Database,
  Download,
  Plus,
  MessageSquare,
  Clock
} from 'lucide-react';
import { Message, Conversation } from '../types';

interface CleanChatWidgetProps {
  conversation: Conversation | null;
  conversations: Conversation[];
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  isMongoLive: boolean;
}

// Cute robot avatar matching the uploaded reference image
export const CuteRobotAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; isWhiteBg?: boolean }> = ({ 
  size = 'md',
  isWhiteBg = false 
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  }[size];

  return (
    <div
      className={`${sizeClasses} rounded-full flex items-center justify-center shrink-0 shadow-xs transition-transform ${
        isWhiteBg ? 'bg-white text-[#5e4ee6]' : 'bg-[#5e4ee6] text-white'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}
      >
        {/* Antenna */}
        <circle cx="12" cy="3.5" r="1.5" />
        <rect x="11.2" y="4.5" width="1.6" height="2.2" rx="0.5" />
        {/* Head */}
        <rect x="4.5" y="6.8" width="15" height="11.5" rx="3.5" />
        {/* Eyes (inverted background) */}
        <circle cx="9" cy="11.5" r="1.4" fill={isWhiteBg ? '#5e4ee6' : '#ffffff'} />
        <circle cx="15" cy="11.5" r="1.4" fill={isWhiteBg ? '#5e4ee6' : '#ffffff'} />
        {/* Friendly smile */}
        <path
          d="M9.5 14.5c.7.9 1.6 1.3 2.5 1.3s1.8-.4 2.5-1.3"
          stroke={isWhiteBg ? '#5e4ee6' : '#ffffff'}
          strokeWidth="1.3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
};

export const CleanChatWidget: React.FC<CleanChatWidgetProps> = ({
  conversation,
  conversations,
  messages,
  isStreaming,
  streamingContent,
  onSendMessage,
  onClearChat,
  onNewChat,
  onSelectConversation,
  isMongoLive,
}) => {
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, isStreaming]);

  const handleSend = () => {
    if (isStreaming || !inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onSendMessage(`[Attached File: ${file.name}]\n${content.slice(0, 1500)}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const commonEmojis = ['👋', '😊', '🚀', '💡', '🔥', '✨', '👍', '❤️', '🤔', '🎉'];

  // Minimized floating bubble
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in fade-in zoom-in duration-200">
        <button
          onClick={() => setIsMinimized(false)}
          className="w-16 h-16 rounded-full bg-[#5e4ee6] text-white shadow-2xl hover:bg-[#4d3dd4] hover:scale-105 active:scale-95 transition-all flex items-center justify-center relative group"
        >
          <CuteRobotAvatar size="md" isWhiteBg={true} />
          {/* Active pulse */}
          <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
          <span className="absolute -top-10 right-0 bg-slate-900 text-white text-xs px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
            Open Chatbot
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[390px] sm:max-w-[420px] h-[610px] bg-white rounded-3xl shadow-2xl shadow-indigo-950/15 flex flex-col overflow-hidden border border-slate-100 transition-all">
      {/* Header matching screenshot */}
      <div className="bg-[#5e4ee6] px-5 py-4 flex items-center justify-between text-white select-none relative shrink-0">
        <div className="flex items-center gap-3">
          {/* Robot white circle avatar */}
          <CuteRobotAvatar size="md" isWhiteBg={true} />
          <div>
            <h2 className="font-semibold text-lg tracking-tight leading-tight">Chatbot</h2>
            <div className="flex items-center gap-1.5 text-[11px] text-purple-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Online</span>
              {isMongoLive && (
                <>
                  <span>•</span>
                  <span className="text-emerald-300 font-mono text-[10px]">Atlas Connected</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              onNewChat();
              setShowHistory(false);
            }}
            className="p-1.5 rounded-full hover:bg-white/15 transition-colors text-white/90"
            title="New Chat"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-1.5 rounded-full hover:bg-white/15 transition-colors text-white/90"
            title="Chat History"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-full hover:bg-white/15 transition-colors text-white/90"
            title="Options"
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Chat History Panel */}
        {showHistory && (
          <div className="absolute right-4 top-14 bg-white text-slate-700 rounded-xl shadow-xl border border-slate-100 py-1.5 w-56 z-30 text-xs animate-in fade-in slide-in-from-top-1 max-h-80 overflow-y-auto">
            <div className="px-3 py-2 font-semibold text-slate-900 border-b border-slate-100 sticky top-0 bg-white">
              Chat History
            </div>
            {conversations.length === 0 ? (
              <div className="px-3 py-4 text-center text-slate-400">No conversations yet</div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => {
                    onSelectConversation(conv._id);
                    setShowHistory(false);
                  }}
                  className={`w-full px-3 py-2 flex items-center gap-2 text-left transition-colors ${
                    conversation?._id === conv._id
                      ? 'bg-purple-50 text-[#5e4ee6] font-medium'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{conv.title}</div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      {new Date(conv.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Dropdown Options Menu */}
        {showMenu && (
          <div className="absolute right-4 top-14 bg-white text-slate-700 rounded-xl shadow-xl border border-slate-100 py-1.5 w-44 z-30 text-xs animate-in fade-in slide-in-from-top-1">
            <a
              href="/api/download-zip"
              download="mern-chatbot-project.zip"
              onClick={() => setShowMenu(false)}
              className="w-full px-3 py-2 flex items-center gap-2 hover:bg-purple-50 text-[#5e4ee6] font-medium text-left transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download ZIP Code</span>
            </a>
            <button
              onClick={() => {
                onClearChat();
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50 text-slate-600 hover:text-rose-600 text-left transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Conversation</span>
            </button>
            <button
              onClick={() => {
                setIsMinimized(true);
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50 text-slate-600 text-left transition-colors"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Minimize Widget</span>
            </button>
            <div className="border-t border-slate-100 my-1"></div>
            <div className="px-3 py-1.5 text-[10px] text-slate-400 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-emerald-500" />
              <span>MongoDB Atlas Active</span>
            </div>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white">
        {/* Initial welcome message if thread is empty */}
        {messages.length === 0 && (
          <div className="flex gap-2.5 items-end justify-start animate-in fade-in duration-200">
            <CuteRobotAvatar size="sm" />
            <div className="bg-[#f4f1fd] text-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 text-sm leading-relaxed max-w-[82%] shadow-xs">
              Hey there 👋<br />
              How can I help you today?
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg._id}
              className={`flex gap-2.5 items-end ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150`}
            >
              {/* Bot icon avatar */}
              {!isUser && <CuteRobotAvatar size="sm" />}

              {/* Message Bubble */}
              <div
                className={`text-sm leading-relaxed max-w-[82%] shadow-xs transition-all ${
                  isUser
                    ? 'bg-[#5e4ee6] text-white rounded-2xl rounded-tr-xs px-4 py-3 select-text'
                    : 'bg-[#f4f1fd] text-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 select-text'
                }`}
              >
                {isUser ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <div className="markdown-light whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live typing / streaming bubble */}
        {isStreaming && (
          <div className="flex gap-2.5 items-end justify-start animate-in fade-in duration-150">
            <CuteRobotAvatar size="sm" />

            {streamingContent ? (
              <div className="bg-[#f4f1fd] text-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 text-sm leading-relaxed max-w-[82%] shadow-xs">
                <div className="markdown-light whitespace-pre-wrap">{streamingContent}</div>
              </div>
            ) : (
              /* Three animated bouncing purple dots exactly as shown in reference image */
              <div className="bg-[#f4f1fd] rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5e4ee6] animate-bounce [animation-delay:0s]"></span>
                <span className="w-2 h-2 rounded-full bg-[#5e4ee6] animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-[#5e4ee6] animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar section matching screenshot */}
      <div className="p-3 bg-white border-t border-slate-100 relative">
        {/* Emoji picker popover */}
        {showEmojiPicker && (
          <div className="absolute bottom-16 right-6 bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xl flex items-center gap-1.5 z-20 animate-in fade-in slide-in-from-bottom-2">
            {commonEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiSelect(emoji)}
                className="w-7 h-7 flex items-center justify-center hover:bg-purple-50 rounded-lg text-base transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.js,.ts,.json,.md,.html,.css"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Rounded input pill container */}
        <div className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-white pl-4 pr-1.5 py-1.5 shadow-xs focus-within:border-[#5e4ee6] focus-within:ring-2 focus-within:ring-[#5e4ee6]/10 transition-all">
          <input
            type="text"
            placeholder="Message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />

          {/* Emoji button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={isStreaming}
            className="p-1.5 text-slate-400 hover:text-[#5e4ee6] transition-colors"
            title="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* File attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
            className="p-1.5 text-slate-400 hover:text-[#5e4ee6] transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Purple circle Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={isStreaming || !inputText.trim()}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-xs shrink-0 ${
              inputText.trim() && !isStreaming
                ? 'bg-[#5e4ee6] text-white hover:bg-[#4d3dd4] active:scale-95 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title="Send message"
          >
            <Send className="w-3.5 h-3.5 -rotate-12 translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
