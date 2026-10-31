import React from 'react';
import { 
  Sparkles, 
  Database, 
  MessageSquare, 
  Plus, 
  Sliders, 
  Cpu,
  Layers,
  Bot
} from 'lucide-react';
import { Persona, Conversation } from '../types';

interface HeaderProps {
  currentTab: 'chat' | 'inspector';
  setCurrentTab: (tab: 'chat' | 'inspector') => void;
  activePersona?: Persona;
  activeConversation?: Conversation | null;
  onOpenPersonaModal: () => void;
  onNewChat: () => void;
  isStreaming: boolean;
  mongoDocsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  activePersona,
  activeConversation,
  onOpenPersonaModal,
  onNewChat,
  isStreaming,
  mongoDocsCount,
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
      {/* Brand & MERN identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 flex items-center justify-center shadow-lg shadow-emerald-950/40 text-white font-bold text-sm tracking-wider">
            M
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5 font-bold text-slate-100 text-sm tracking-tight">
              <span>MERN</span>
              <span className="text-emerald-400">ChatBot</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="text-emerald-400">🍃 Mongo</span>
              <span>•</span>
              <span className="text-amber-400">⚡ Express</span>
              <span>•</span>
              <span className="text-cyan-400">⚛️ React 19</span>
              <span>•</span>
              <span className="text-green-400">🟩 Node</span>
            </div>
          </div>
        </div>

        {/* MERN Stack Pills */}
        <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-slate-800 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            MongoDB Live: <strong className="text-white font-mono">{mongoDocsCount} docs</strong>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
            <Cpu className="w-3 h-3 text-cyan-400" />
            Gemini 3.8 Flash
          </span>
        </div>
      </div>

      {/* Middle View Switcher (Chat vs MERN Inspector) */}
      <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800/80 shadow-inner">
        <button
          onClick={() => setCurrentTab('chat')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            currentTab === 'chat'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat View</span>
        </button>

        <button
          onClick={() => setCurrentTab('inspector')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            currentTab === 'inspector'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>MERN Inspector</span>
          <span className="ml-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Persona Switcher Trigger */}
        <button
          onClick={onOpenPersonaModal}
          disabled={isStreaming}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition-colors"
          title="Change Persona / AI Mode"
        >
          <span className="text-sm">{activePersona?.avatar || '🤖'}</span>
          <span className="hidden md:inline font-medium max-w-[110px] truncate">
            {activePersona?.name || 'Persona'}
          </span>
          <Sliders className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </button>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          disabled={isStreaming}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 active:scale-95 transition-all disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>
    </header>
  );
};
