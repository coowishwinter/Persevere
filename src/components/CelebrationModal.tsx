import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, Share2 } from 'lucide-react';
import { DailyQuote } from '../data/dailyQuotes';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: DailyQuote;
  dateStr: string;
  completedHabitsCount: number;
  totalHabitsCount: number;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  quote,
  dateStr,
  completedHabitsCount,
  totalHabitsCount,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    const text = `「${quote.text}」\n—— ${quote.author} ${quote.source || ''}\n\n${quote.blessing}\n（日砺知行 · ${dateStr} 打卡纪念）`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative bg-white border border-neutral-200/80 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 overflow-hidden transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative background glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Pill */}
        <div className="flex items-center justify-between mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>今日勉励 · {quote.tag}</span>
          </span>
          <span className="text-xs font-mono text-neutral-400 pr-8">
            {completedHabitsCount}/{totalHabitsCount} 达成
          </span>
        </div>

        {/* Quote Content */}
        <div className="space-y-4 my-2">
          {/* Main Verse */}
          <div className="relative pl-4 sm:pl-6 border-l-2 border-emerald-500/70">
            <blockquote className="text-lg sm:text-xl font-medium text-neutral-900 leading-relaxed font-serif tracking-wide">
              “{quote.text}”
            </blockquote>
            <div className="text-xs sm:text-sm text-neutral-500 mt-2 font-serif text-right">
              —— {quote.author} {quote.source && <span className="text-neutral-400">{quote.source}</span>}
            </div>
          </div>

          {/* Blessing Annotation */}
          <div className="p-3.5 bg-neutral-50/80 rounded-2xl border border-neutral-100 text-xs sm:text-sm text-neutral-600 leading-relaxed">
            <span className="font-semibold text-neutral-800 mr-1.5">寄语：</span>
            {quote.blessing}
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-8 pt-4 border-t border-neutral-100 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">已复制到剪贴板</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-500" />
                <span>复制金句</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-xs transition-colors"
          >
            收下勉励，继续前行
          </button>
        </div>
      </div>
    </div>
  );
};
