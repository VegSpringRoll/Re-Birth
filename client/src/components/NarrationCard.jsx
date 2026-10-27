import React from 'react';
import { Sparkles } from 'lucide-react';
import { renderMarkdownSpans } from './StagePanel.jsx';

export default function NarrationCard({ content, isPartial }) {
  const sanitized = (content || '')
    .replace(/<\/?p\s*>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&lt;\/?p\s*&gt;/gi, '\n\n')
    .replace(/\\u003c\/?p\s*\\u003e/gi, '\n\n');

  const paragraphs = sanitized
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="relative my-3.5 w-full animate-fade-in group">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/95 via-[#0e122b]/85 to-purple-950/40 border border-purple-500/20 px-4 sm:px-6 py-3.5 sm:py-4 shadow-xl backdrop-blur-xl group-hover:border-purple-500/35 transition-all">
        {/* Subtle Gothic Silhouette Watermark on the right edge */}
        <div
          className="absolute right-0 top-0 bottom-0 w-48 opacity-[0.07] pointer-events-none bg-contain bg-right bg-no-repeat"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100'><path fill='%23ffffff' d='M10,100 L10,60 L20,40 L30,60 L30,100 L50,100 L50,30 L60,10 L70,30 L70,100 L100,100 L100,45 L110,20 L120,45 L120,100 L150,100 L150,55 L160,35 L170,55 L170,100 Z'/></svg>")`
          }}
        />

        {/* Atmosphere Label */}
        <div className="flex items-center gap-2 mb-2 text-purple-300/80 text-[10px] font-mono tracking-[0.2em] uppercase relative z-10">
          <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
          <span>ATMOSPHERE & CHOREOGRAPHY</span>
          {isPartial && (
            <span className="inline-flex items-center gap-1 text-[9px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40 animate-pulse font-mono">
              streaming...
            </span>
          )}
        </div>

        {/* Prose text */}
        <div className="space-y-2.5 text-slate-200 font-serif italic text-[15px] sm:text-[15.5px] leading-relaxed tracking-wide relative z-10">
          {paragraphs.length > 0 ? (
            paragraphs.map((para, i) => (
              <p key={i} className="first-letter:text-lg first-letter:font-semibold first-letter:text-purple-200">
                {renderMarkdownSpans(para, `narr-${i}`)}
              </p>
            ))
          ) : (
            <p>{renderMarkdownSpans(content, 'narr-single')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
