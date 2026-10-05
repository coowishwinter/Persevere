import React from 'react';
import { Calendar, CheckSquare, BarChart3, FileText, Database, Flame } from 'lucide-react';

interface HeaderProps {
  activeTab: 'daily' | 'weekly' | 'monthly';
  setActiveTab: (tab: 'daily' | 'weekly' | 'monthly') => void;
  onGoToToday: () => void;
  onOpenDataModal: () => void;
  currentStreak: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onGoToToday,
  onOpenDataModal,
  currentStreak,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-neutral-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-neutral-900">
              日砺
            </span>
            {currentStreak > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-amber-600 font-medium ml-1">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span className="font-mono tabular-nums">{currentStreak}天</span>
              </span>
            )}
          </div>

          {/* Segmented Tab Controls */}
          <nav className="flex items-center p-1 bg-neutral-100/80 rounded-xl">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'daily'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              打卡
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'weekly'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              周报
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'monthly'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              月度统计
            </button>
          </nav>

          {/* Minimal Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onGoToToday}
              className="px-2.5 py-1 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors font-medium"
            >
              今日
            </button>
            <button
              onClick={onOpenDataModal}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              title="备份与设置"
            >
              <Database className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
