import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Plus, 
  Bot, 
  Sparkles, 
  Trash2, 
  SlidersHorizontal 
} from 'lucide-react';
import { Persona } from '../types';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  personas: Persona[];
  activePersonaId: string;
  onSelectPersona: (personaId: string) => void;
  onCreatePersona: (personaData: Partial<Persona>) => Promise<void>;
  onDeletePersona: (personaId: string) => Promise<void>;
}

export const PersonaModal: React.FC<PersonaModalProps> = ({
  isOpen,
  onClose,
  personas,
  activePersonaId,
  onSelectPersona,
  onCreatePersona,
  onDeletePersona,
}) => {
  const [tab, setTab] = useState<'select' | 'create'>('select');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🤖');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [starter1, setStarter1] = useState('');
  const [starter2, setStarter2] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) return;

    setIsSubmitting(true);
    try {
      const starters = [starter1, starter2].filter((s) => s.trim().length > 0);
      await onCreatePersona({
        name: name.trim(),
        avatar: avatar || '🤖',
        title: title.trim() || 'Custom AI',
        description: description.trim() || 'Custom created persona',
        systemPrompt: systemPrompt.trim(),
        temperature,
        starterPrompts: starters.length > 0 ? starters : ['Hello, how can you help me today?'],
      });
      setTab('select');
      // Reset form
      setName('');
      setTitle('');
      setDescription('');
      setSystemPrompt('');
      setStarter1('');
      setStarter2('');
    } catch (err) {
      console.error('Failed to create persona:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const emojiOptions = ['🍃', '⚡', '⚛️', '🟩', '🤖', '✨', '🧠', '💻', '🚀', '🎯', '🧪', '🛡️'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Chatbot Personas</h3>
              <p className="text-xs text-slate-400">
                Choose a specialized AI assistant persona or craft your own custom instructions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2">
          <button
            onClick={() => setTab('select')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              tab === 'select'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Available Personas ({personas.length})
          </button>
          <button
            onClick={() => setTab('create')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'create'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom Persona</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === 'select' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {personas.map((p) => {
                const isActive = p._id === activePersonaId;
                return (
                  <div
                    key={p._id}
                    onClick={() => {
                      onSelectPersona(p._id);
                      onClose();
                    }}
                    className={`relative p-4 rounded-xl border text-left cursor-pointer transition-all space-y-2 flex flex-col justify-between ${
                      isActive
                        ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/40'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{p.avatar}</span>
                          <div>
                            <div className="font-bold text-sm text-white flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {isActive && (
                                <Check className="w-4 h-4 text-emerald-400 inline" />
                              )}
                            </div>
                            <div className="text-[10px] text-emerald-400 font-mono">
                              {p.badge}
                            </div>
                          </div>
                        </div>

                        {p.isCustom && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete custom persona "${p.name}"?`)) {
                                onDeletePersona(p._id);
                              }
                            }}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete custom persona"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed mt-2">
                        {p.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Model: {p.defaultModel}</span>
                      <span>Temp: {p.temperature}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Persona Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Next.js & GraphQL Guru"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Avatar Emoji
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {emojiOptions.map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => setAvatar(emoji)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all ${
                          avatar === emoji
                            ? 'bg-emerald-500/30 border border-emerald-400'
                            : 'bg-slate-950 border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full-Stack GraphQL Architecture & Apollo Client"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  placeholder="Brief summary of what this bot excels at..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  System Instruction Prompt *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe how the AI should behave, respond, format code, and what domain knowledge to focus on..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Starter Prompt 1
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. How do I build a query with GraphQL?"
                    value={starter1}
                    onChange={(e) => setStarter1(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Starter Prompt 2
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Show best practices for caching"
                    value={starter2}
                    onChange={(e) => setStarter2(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || !systemPrompt.trim()}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md active:scale-98 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving to MongoDB...' : 'Save & Deploy Persona'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
