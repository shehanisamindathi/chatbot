import React, { useEffect, useRef, useState } from 'react';
import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Clock, 
  Sparkles,
  Zap,
  Terminal,
  FileCode,
  Layers
} from 'lucide-react';
import { Message, Conversation, Persona } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  persona?: Persona;
  isStreaming: boolean;
  streamingContent: string;
  onSendMessage: (text: string) => void;
  onRegenerate: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  persona,
  isStreaming,
  streamingContent,
  onSendMessage,
  onRegenerate,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, isStreaming]);

  // Copy message text
  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Text to speech
  const handleToggleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (speakingMsgId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    } else {
      window.speechSynthesis.cancel();
      // Strip markdown syntax for clean audio speech
      const plainText = text.replace(/```[\s\S]*?```/g, 'Code block omitted.').replace(/[#*_`]/g, '');
      const utterance = new SpeechSynthesisUtterance(plainText.slice(0, 1000));
      utterance.onend = () => setSpeakingMsgId(null);
      utterance.onerror = () => setSpeakingMsgId(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingMsgId(id);
    }
  };

  // Empty state if no conversation or no messages
  if (!conversation || (messages.length === 0 && !isStreaming)) {
    return (
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center min-h-0 bg-slate-950/40">
        <div className="max-w-xl w-full text-center space-y-6">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-transparent border border-emerald-500/30 text-4xl shadow-xl shadow-emerald-950/20">
            {persona?.avatar || '🍃'}
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-100 flex items-center justify-center gap-2">
              <span>{persona?.name || 'MERN Assistant'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {persona?.badge || 'AI Pro'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {persona?.description ||
                'Full-stack MERN conversational AI powered by Gemini 3.8 Flash, Express REST/SSE streaming, and MongoDB document persistence.'}
            </p>
          </div>

          {/* Starter prompts */}
          <div className="text-left space-y-2 pt-2">
            <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase flex items-center gap-1.5 px-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Suggested Starters:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(persona?.starterPrompts || [
                'Explain how MongoDB document indexes improve query latency',
                'Write an Express middleware to handle SSE with heartbeat',
                'How to manage global state in React 19 without third-party libraries',
                'What are best practices for securing Node.js APIs in production?',
              ]).map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(prompt)}
                  className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-white transition-all text-left shadow-sm group flex flex-col justify-between space-y-2"
                >
                  <span className="leading-snug">{prompt}</span>
                  <span className="text-[10px] text-emerald-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1 self-end">
                    Ask now &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0 bg-slate-950/20">
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const isLastAssistant = !isUser && index === messages.length - 1;

          return (
            <div
              key={msg._id}
              className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar for assistant */}
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-sm shrink-0 shadow-sm mt-1">
                  {persona?.avatar || '🤖'}
                </div>
              )}

              {/* Message Body */}
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 shadow-md transition-all ${
                  isUser
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-tr-xs'
                    : 'bg-slate-900/90 border border-slate-800/90 text-slate-100 rounded-tl-xs'
                }`}
              >
                {/* Assistant header banner */}
                {!isUser && (
                  <div className="flex items-center justify-between gap-4 pb-2 mb-2 border-b border-slate-800/80 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">
                        {persona?.name || 'MERN Assistant'}
                      </span>
                      {msg.model && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {msg.model}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                      {msg.thinkingTimeMs && (
                        <span className="flex items-center gap-0.5 text-cyan-400">
                          <Zap className="w-2.5 h-2.5" />
                          {msg.thinkingTimeMs}ms
                        </span>
                      )}
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Content */}
                {isUser ? (
                  <div className="text-sm whitespace-pre-wrap leading-relaxed select-text">
                    {msg.content}
                  </div>
                ) : (
                  <div className="text-sm">
                    <MarkdownRenderer content={msg.content} />
                  </div>
                )}

                {/* Assistant footer actions */}
                {!isUser && (
                  <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-800/60 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyMessage(msg._id, msg.content)}
                        className="flex items-center gap-1 p-1 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors"
                        title="Copy message"
                      >
                        {copiedMsgId === msg._id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[10px]">
                          {copiedMsgId === msg._id ? 'Copied' : 'Copy'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleToggleSpeak(msg._id, msg.content)}
                        className={`flex items-center gap-1 p-1 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors ${
                          speakingMsgId === msg._id ? 'text-emerald-400 font-semibold' : ''
                        }`}
                        title={speakingMsgId === msg._id ? 'Stop audio' : 'Read aloud'}
                      >
                        {speakingMsgId === msg._id ? (
                          <VolumeX className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[10px]">
                          {speakingMsgId === msg._id ? 'Speaking...' : 'Listen'}
                        </span>
                      </button>

                      {isLastAssistant && (
                        <button
                          onClick={onRegenerate}
                          disabled={isStreaming}
                          className="flex items-center gap-1 p-1 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-50"
                          title="Regenerate this response"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-[10px]">Regenerate</span>
                        </button>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono">
                      ~{msg.tokenEstimate || Math.ceil(msg.content.length / 4)} tokens
                    </div>
                  </div>
                )}

                {/* User message timestamp */}
                {isUser && (
                  <div className="text-right text-[10px] text-emerald-200/70 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
              </div>

              {/* Avatar for user */}
              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-sm shrink-0 shadow-sm mt-1 text-teal-200">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Live streaming message container */}
        {isStreaming && (
          <div className="flex gap-3.5 justify-start">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-sm shrink-0 shadow-sm mt-1 animate-pulse">
              {persona?.avatar || '🤖'}
            </div>

            <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl rounded-tl-xs p-4 bg-slate-900 border border-emerald-500/30 text-slate-100 shadow-lg shadow-emerald-950/20 space-y-2">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Generating response via Gemini 3.8 Flash...</span>
              </div>

              <div className="text-sm">
                {streamingContent ? (
                  <MarkdownRenderer content={streamingContent} />
                ) : (
                  <div className="flex items-center gap-1.5 py-2 text-slate-400">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
