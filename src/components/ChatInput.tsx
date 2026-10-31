import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Square, 
  Mic, 
  MicOff, 
  Paperclip, 
  Sparkles, 
  Code, 
  Database,
  RefreshCw
} from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onStopStreaming?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopStreaming,
  isStreaming,
  disabled,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  // Web Speech API Voice Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (disabled || isStreaming) return;
    const text = inputText.trim();
    if (!text) return;

    onSendMessage(text);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText((prev) =>
          prev
            ? `${prev}\n\n[Attached File: ${file.name}]\n\`\`\`\n${content.slice(0, 4000)}\n\`\`\``
            : `[Attached File: ${file.name}]\n\`\`\`\n${content.slice(0, 4000)}\n\`\`\`\n`
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const quickPrompts = [
    { label: 'Explain MERN architecture', icon: Database },
    { label: 'MongoDB Schema design', icon: Sparkles },
    { label: 'Express SSE streaming', icon: Code },
  ];

  return (
    <div className="p-3 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Quick prompt chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] text-slate-500 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Quick:
          </span>
          {quickPrompts.map((chip, idx) => {
            const Icon = chip.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setInputText(chip.label)}
                disabled={isStreaming}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-850 hover:border-emerald-500/40 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-[11px] active:scale-95 disabled:opacity-50"
              >
                <Icon className="w-3 h-3 text-emerald-400" />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input box */}
        <div className="relative flex items-end gap-2 bg-slate-950 border border-slate-700/80 rounded-xl p-2 focus-within:border-emerald-500/80 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all shadow-lg shadow-black/20">
          {/* File attach input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.js,.ts,.tsx,.json,.md,.html,.css,.sql"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
            title="Attach file or code snippet"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Voice to text */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={isStreaming}
            className={`p-2 rounded-lg transition-colors shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={isListening ? 'Stop recording voice' : 'Voice input (speech-to-text)'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={
              isListening
                ? 'Listening to speech...'
                : 'Message your MERN AI assistant... (Shift+Enter for new line)'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none resize-none py-1.5 px-1 max-h-44 leading-relaxed"
          />

          {/* Submit / Stop button */}
          {isStreaming ? (
            <button
              type="button"
              onClick={onStopStreaming}
              className="p-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow-md active:scale-95 transition-all shrink-0 flex items-center justify-center"
              title="Stop generating"
            >
              <Square className="w-4 h-4 fill-white" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!inputText.trim() || disabled}
              className={`p-2.5 rounded-lg text-white shadow-md active:scale-95 transition-all shrink-0 flex items-center justify-center ${
                inputText.trim() && !disabled
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-950/40 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-1 text-[10px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>Powered by Express SSE & MongoDB Document Store</span>
          </div>
          <div>
            {inputText.length > 0 && (
              <span>~{Math.ceil(inputText.length / 4)} tokens</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
