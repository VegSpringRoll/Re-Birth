import React, { useState } from 'react';
import AvatarImage from './AvatarImage.jsx';
import { MoreHorizontal, Copy, Edit3, Trash2, Check } from 'lucide-react';
import { renderMarkdownSpans } from './StagePanel.jsx';

export default function DialogueBubble({
  speaker,
  content,
  universe,
  isPartial,
  onEdit,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const getSpeakerStyle = (name) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('frieren') || lower.includes('fern') || lower.includes('gojo') || lower.includes('rimuru')) {
      return {
        dot: 'bg-cyan-400 shadow-cyan-400',
        nameColor: 'text-slate-100',
        bubbleBorder: 'border-cyan-500/25',
        glow: 'shadow-cyan-950/20',
        quote: 'text-cyan-400',
      };
    }
    if (lower.includes('sukuna') || lower.includes('guy') || lower.includes('stark') || lower.includes('rebecca')) {
      return {
        dot: 'bg-rose-400 shadow-rose-400',
        nameColor: 'text-slate-100',
        bubbleBorder: 'border-rose-500/25',
        glow: 'shadow-rose-950/20',
        quote: 'text-rose-400',
      };
    }
    if (lower.includes('jinwoo') || lower.includes('shadow') || lower.includes('lucy') || lower.includes('klein')) {
      return {
        dot: 'bg-indigo-400 shadow-indigo-400',
        nameColor: 'text-slate-100',
        bubbleBorder: 'border-indigo-500/25',
        glow: 'shadow-indigo-950/20',
        quote: 'text-indigo-400',
      };
    }
    return {
      dot: 'bg-purple-400 shadow-purple-400',
      nameColor: 'text-slate-100',
      bubbleBorder: 'border-purple-500/25',
      glow: 'shadow-purple-950/20',
      quote: 'text-purple-400',
    };
  };

  const style = getSpeakerStyle(speaker);

  const handleCopy = () => {
    navigator.clipboard.writeText(`"${content}"`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setMenuOpen(false);
  };

  return (
    <div className="my-4 flex items-start gap-3.5 sm:gap-4 animate-fade-in group max-w-4xl">
      {/* Portrait Avatar (Square with rounded corners) */}
      <AvatarImage
        speaker={speaker}
        universe={universe}
        size="md"
        className="mt-1 rounded-2xl border border-purple-400/30 shadow-lg shadow-purple-950/40"
      />

      {/* Speech Content Container */}
      <div className="flex-1 min-w-0">
        {/* Speaker Name Tag & Action Menu */}
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${style.dot} shadow-sm shrink-0`} />
            <span className={`text-xs font-bold tracking-wide font-sans ${style.nameColor}`}>
              {speaker || 'Unknown'}
            </span>
            {isPartial && (
              <span className="text-[9px] text-cyan-400/90 font-mono animate-pulse">
                speaking...
              </span>
            )}
          </div>

          {/* Ellipsis Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors"
              title="Turn actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 rounded-xl bg-slate-950 border border-purple-500/30 shadow-2xl p-1 z-30 animate-fade-in backdrop-blur-xl">
                <button
                  onClick={handleCopy}
                  className="w-full px-2.5 py-1.5 text-left text-xs text-slate-300 hover:text-white hover:bg-purple-950/60 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit();
                      setMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-1.5 text-left text-xs text-slate-300 hover:text-white hover:bg-purple-950/60 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      onDelete();
                      setMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-1.5 text-left text-xs text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Speech Bubble Card with Subtle Watermark Silhouette */}
        <div
          className={`relative overflow-hidden rounded-2xl rounded-tl-sm px-5 py-3.5 bg-gradient-to-r from-slate-900/95 via-[#0c1028]/90 to-purple-950/40 border ${style.bubbleBorder} shadow-xl backdrop-blur-xl group-hover:border-purple-400/40 transition-all`}
        >
          {/* Subtle Silhouette Background Glow */}
          <div
            className="absolute right-0 top-0 bottom-0 w-44 opacity-[0.06] pointer-events-none bg-contain bg-right bg-no-repeat"
            style={{
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='35' r='20' fill='%23ffffff'/><path fill='%23ffffff' d='M20,90 Q50,60 80,90 Z'/></svg>")`
            }}
          />

          <div className="relative text-slate-100 text-[15px] sm:text-[15.5px] leading-relaxed font-sans z-10">
            <span className={`text-lg font-serif select-none mr-1.5 ${style.quote}`}>“</span>
            <span>{renderMarkdownSpans(content, 'bubble')}</span>
            <span className={`text-lg font-serif select-none ml-1.5 ${style.quote}`}>”</span>
          </div>
        </div>
      </div>
    </div>
  );
}
