import React, { useState } from 'react';
import { 
  Search, 
  Pin, 
  Trash2, 
  Edit3, 
  MessageSquare, 
  PinOff, 
  Database, 
  ChevronRight,
  Sparkles,
  Bot
} from 'lucide-react';
import { Conversation, Persona } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onTogglePin: (id: string, currentPinned: boolean) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  personas: Persona[];
  isStreaming: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenPersonaModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onTogglePin,
  onRenameConversation,
  personas,
  isStreaming,
  isOpenMobile,
  onCloseMobile,
  onOpenPersonaModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Filter conversations
  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pinnedList = filteredConversations.filter((c) => c.pinned);
  const unpinnedList = filteredConversations.filter((c) => !c.pinned);

  // Group unpinned conversations by date
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOfWeek = startOfToday - 7 * 86400000;

  const todayList: Conversation[] = [];
  const yesterdayList: Conversation[] = [];
  const weekList: Conversation[] = [];
  const olderList: Conversation[] = [];

  unpinnedList.forEach((conv) => {
    const time = new Date(conv.updatedAt).getTime();
    if (time >= startOfToday) {
      todayList.push(conv);
    } else if (time >= startOfYesterday) {
      yesterdayList.push(conv);
    } else if (time >= startOfWeek) {
      weekList.push(conv);
    } else {
      olderList.push(conv);
    }
  });

  const getPersonaAvatar = (personaId: string) => {
    const p = personas.find((item) => item._id === personaId);
    return p?.avatar || '💬';
  };

  const handleStartRename = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setEditingId(conv._id);
    setEditingTitle(conv.title);
  };

  const handleSaveRename = (id: string) => {
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const renderConversationItem = (conv: Conversation) => {
    const isActive = conv._id === activeConversationId;
    const isEditing = conv._id === editingId;

    return (
      <div
        key={conv._id}
        onClick={() => {
          if (!isStreaming) {
            onSelectConversation(conv._id);
            onCloseMobile();
          }
        }}
        className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-all ${
          isActive
            ? 'bg-emerald-500/15 text-emerald-300 font-medium border border-emerald-500/30'
            : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
        } ${isStreaming && isActive ? 'animate-pulse' : ''}`}
      >
        <span className="text-sm shrink-0">{getPersonaAvatar(conv.personaId)}</span>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editingTitle}
              autoFocus
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={() => handleSaveRename(conv._id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename(conv._id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              className="w-full bg-slate-900 border border-emerald-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex items-center justify-between">
              <span className="truncate">{conv.title}</span>
              {conv.pinned && (
                <Pin className="w-3 h-3 text-emerald-400 shrink-0 ml-1 fill-emerald-400/20" />
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
            <span>{conv.messageCount || 0} msgs</span>
            <span>•</span>
            <span>{new Date(conv.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Action icons on hover */}
        {!isEditing && (
          <div className="hidden group-hover:flex items-center gap-1 shrink-0 bg-slate-800/90 rounded px-1 py-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(conv._id, conv.pinned);
              }}
              className="p-1 hover:text-emerald-400 text-slate-400"
              title={conv.pinned ? 'Unpin' : 'Pin to top'}
            >
              {conv.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
            </button>
            <button
              onClick={(e) => handleStartRename(e, conv)}
              className="p-1 hover:text-cyan-400 text-slate-400"
              title="Rename conversation"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete conversation "${conv.title}"?`)) {
                  onDeleteConversation(conv._id);
                }
              }}
              className="p-1 hover:text-rose-400 text-slate-400"
              title="Delete conversation"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header: Search */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 px-4">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
              No conversations found. Click "New Chat" to begin!
            </div>
          ) : null}

          {/* Pinned section */}
          {pinnedList.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-emerald-400 uppercase flex items-center gap-1">
                <Pin className="w-3 h-3" />
                Pinned
              </div>
              <div className="space-y-1">{pinnedList.map(renderConversationItem)}</div>
            </div>
          )}

          {/* Today section */}
          {todayList.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Today
              </div>
              <div className="space-y-1">{todayList.map(renderConversationItem)}</div>
            </div>
          )}

          {/* Yesterday section */}
          {yesterdayList.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Yesterday
              </div>
              <div className="space-y-1">{yesterdayList.map(renderConversationItem)}</div>
            </div>
          )}

          {/* Previous 7 Days */}
          {weekList.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Previous 7 Days
              </div>
              <div className="space-y-1">{weekList.map(renderConversationItem)}</div>
            </div>
          )}

          {/* Older */}
          {olderList.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Older
              </div>
              <div className="space-y-1">{olderList.map(renderConversationItem)}</div>
            </div>
          )}
        </div>

        {/* Footer: Persona Card & MongoDB Status */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
          <button
            onClick={onOpenPersonaModal}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all text-left group"
          >
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-400" />
              <div className="leading-tight">
                <div className="font-semibold text-slate-200 group-hover:text-emerald-400">
                  AI Personas
                </div>
                <div className="text-[10px] text-slate-500">{personas.length} models & presets</div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <div className="flex items-center justify-between px-2 py-1 text-[10px] text-slate-500 bg-slate-900/40 rounded border border-slate-800/40">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              MongoDB Engine
            </span>
            <span className="font-mono text-emerald-400">Online</span>
          </div>
        </div>
      </aside>
    </>
  );
};
