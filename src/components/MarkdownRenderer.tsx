import React, { useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Configure marked options
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  // Custom regex to detect and render customized code blocks with copy button
  const renderFormattedContent = () => {
    // Split markdown by code fences
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let codeIndex = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const matchIndex = match.index;
      const textBefore = content.substring(lastIndex, matchIndex);

      if (textBefore.trim()) {
        const rawHtml = marked.parse(textBefore) as string;
        const cleanHtml = DOMPurify.sanitize(rawHtml);
        parts.push(
          <div
            key={`md-${lastIndex}`}
            className="markdown-body"
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
          />
        );
      }

      const language = match[1] || 'code';
      const codeString = match[2];
      const blockId = `code-block-${codeIndex++}`;

      parts.push(
        <div key={blockId} className="my-3 rounded-lg overflow-hidden border border-slate-700/60 bg-slate-950/90 shadow-md">
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
            <span className="font-mono uppercase font-semibold tracking-wider text-emerald-400/90 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500/80 inline-block"></span>
              {language}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(codeString);
                setCopiedCodeId(blockId);
                setTimeout(() => setCopiedCodeId(null), 2000);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Copy code"
            >
              {copiedCodeId === blockId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3.5 overflow-x-auto text-xs font-mono leading-relaxed text-slate-200">
            <code>{codeString}</code>
          </pre>
        </div>
      );

      lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      if (remainingText.trim()) {
        const rawHtml = marked.parse(remainingText) as string;
        const cleanHtml = DOMPurify.sanitize(rawHtml);
        parts.push(
          <div
            key={`md-end-${lastIndex}`}
            className="markdown-body"
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
          />
        );
      }
    }

    return parts.length > 0 ? parts : (
      <div
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(content) as string) }}
      />
    );
  };

  return <div className="space-y-1">{renderFormattedContent()}</div>;
};
