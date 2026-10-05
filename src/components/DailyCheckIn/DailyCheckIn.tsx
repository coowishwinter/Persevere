import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Activity,
  BookOpen,
  Flame,
  Sparkles,
  Quote,
  Coffee,
  Lock,
  Settings,
} from 'lucide-react';
import { DailyRecord, HabitDefinition } from '../../types';
import {
  addDays,
  formatDisplayDate,
  getTodayString,
  parseDateString,
} from '../../utils/dateUtils';
import { getLunarInfo } from '../../utils/lunarCalendar';
import { getDailyQuote } from '../../data/dailyQuotes';
import { CelebrationModal } from '../CelebrationModal';
import { UserProfile } from '../../utils/storage';

interface DailyCheckInProps {
  currentDate: string;
  setCurrentDate: (date: string) => void;
  record: DailyRecord;
  onUpdateRecord: (updated: DailyRecord) => void;
  habits: HabitDefinition[];
  currentStreak: number;
  profile: UserProfile;
  onOpenSettings: () => void;
}

export const DailyCheckIn: React.FC<DailyCheckInProps> = ({
  currentDate,
  setCurrentDate,
  record,
  onUpdateRecord,
  habits,
  currentStreak,
  profile,
  onOpenSettings,
}) => {
  const todayStr = getTodayString();
  const isToday = currentDate === todayStr;
  const isPast = currentDate < todayStr;
  const isFuture = currentDate > todayStr;

  // Real-time Clock (HH:mm:ss)
  const [currentTime, setCurrentTime] = useState(() => {
    const d = new Date();
    return d.toTimeString().slice(0, 8);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(d.toTimeString().slice(0, 8));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sunday Rest Check (0 = Sunday)
  const currentDateObj = parseDateString(currentDate);
  const isSunday = currentDateObj.getDay() === 0;

  // Lunar calendar, Solar term, Holiday info
  const lunarInfo = getLunarInfo(currentDate);

  // Daily Quote (365 days unique)
  const dailyQuote = getDailyQuote(currentDate);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);

  // Toast for restricted check-in (past or future)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Rippling effect for button click
  const [isRippling, setIsRippling] = useState(false);

  const exerciseHabit = habits.find((h) => h.category === 'exercise') || habits[0];
  const readingHabit = habits.find((h) => h.category === 'reading') || habits[1];

  const exEntry = record.habits[exerciseHabit?.id];
  const rdEntry = record.habits[readingHabit?.id];

  const isExDone = isSunday ? true : !!exEntry?.completed; // Sunday is auto rest
  const isRdDone = !!rdEntry?.completed;

  // Total required habits today: Sunday requires 1 (Reading), other days require 2 (Exercise + Reading)
  const requiredCount = isSunday ? 1 : 2;
  const currentCompletedCount = (isSunday ? 0 : isExDone ? 1 : 0) + (isRdDone ? 1 : 0);
  const isAllDone = isSunday ? isRdDone : isExDone && isRdDone;

  // Progress ring percentage (0 to 100)
  const progressPercent = (currentCompletedCount / requiredCount) * 100;
  const strokeDashoffset = 283 - (283 * progressPercent) / 100;

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'],
      });
    } catch {
      // ignore
    }
    setIsCelebrationOpen(true);
  };

  // Toggle single habit (STRICT DATE GUARD: only today)
  const handleToggleHabit = (habitId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Guard 1: Expired or Future dates cannot check in
    if (!isToday) {
      if (isPast) {
        showToast('已截止：过去日期无法补打卡');
      } else {
        showToast('未开始：未来日期无法提前打卡');
      }
      return;
    }

    // Guard 2: Sunday Exercise is Rest Day
    if (isSunday && habitId === exerciseHabit?.id) {
      showToast('周日为健身休息日，无需打卡');
      return;
    }

    const existing = record.habits[habitId] || { completed: false, value: 1 };
    const nextCompleted = !existing.completed;
    const newHabits = {
      ...record.habits,
      [habitId]: {
        ...existing,
        completed: nextCompleted,
      },
    };

    onUpdateRecord({
      ...record,
      habits: newHabits,
      updatedAt: new Date().toISOString(),
    });

    if (nextCompleted) {
      const nowExDone = isSunday ? true : !!newHabits[exerciseHabit?.id]?.completed;
      const nowRdDone = !!newHabits[readingHabit?.id]?.completed;
      if (nowExDone && nowRdDone) {
        triggerCelebration();
      }
    }
  };

  // Main Central Circular Button Handler
  const handleCenterButtonClick = () => {
    setIsRippling(true);
    setTimeout(() => setIsRippling(false), 800);

    // Guard 1: Expired or Future dates
    if (!isToday) {
      if (isPast) {
        showToast('已截止：过去日期无法补打卡');
      } else {
        showToast('未开始：未来日期无法提前打卡');
      }
      return;
    }

    if (isAllDone) {
      triggerCelebration();
      return;
    }

    // One-tap complete today's required habits
    const newHabits = { ...record.habits };
    if (!isSunday) {
      newHabits[exerciseHabit.id] = { completed: true, value: 1 };
    }
    newHabits[readingHabit.id] = { completed: true, value: 1 };

    onUpdateRecord({
      ...record,
      habits: newHabits,
      updatedAt: new Date().toISOString(),
    });

    triggerCelebration();
  };

  return (
    <div className="max-w-xl mx-auto py-3 sm:py-6 flex flex-col items-center select-none relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 z-50 px-4 py-2 bg-neutral-900 text-white text-xs font-medium rounded-full shadow-lg border border-neutral-700 animate-fade-in flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header: Live Clock, Solar Terms, Lunar & Holidays */}
      <div className="w-full text-center space-y-2 mb-4 sm:mb-6">
        {/* Real-time Clock */}
        <div className="font-mono tabular-nums text-3xl sm:text-4xl font-extralight tracking-widest text-neutral-800">
          {currentTime}
        </div>

        {/* Date Navigator */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setCurrentDate(addDays(currentDate, -1))}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
            title="前一天"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm sm:text-base font-medium text-neutral-800 font-serif tracking-wide">
            {formatDisplayDate(currentDate)}
          </span>

          <button
            onClick={() => setCurrentDate(addDays(currentDate, 1))}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
            title="后一天"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Lunar, Solar Term & Holiday Pill Row */}
        <div className="flex items-center justify-center flex-wrap gap-2 text-xs text-neutral-500 font-serif">
          <span>{lunarInfo.lunarYearName}</span>
          <span className="text-neutral-300">·</span>
          <span>{lunarInfo.lunarFullString}</span>

          {lunarInfo.solarTerm && (
            <>
              <span className="text-neutral-300">·</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                {lunarInfo.solarTerm}
              </span>
            </>
          )}

          {lunarInfo.holiday && (
            <>
              <span className="text-neutral-300">·</span>
              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/50">
                {lunarInfo.holiday}
              </span>
            </>
          )}

          {isToday ? (
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-sans font-medium text-[11px] border border-emerald-200/60">
              今日 (开放打卡)
            </span>
          ) : isPast ? (
            <span className="text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full font-sans text-[11px]">
              历史记录 (不可打卡)
            </span>
          ) : (
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-sans text-[11px] border border-amber-200/60">
              未到日期 (不可打卡)
            </span>
          )}
        </div>
      </div>

      {/* 2. Center Stage: Beautiful Dynamic Breathing Circle */}
      <div className="relative my-4 sm:my-6 flex items-center justify-center">
        {/* Pulsing Outer Ambient Aura */}
        <div
          className={`absolute rounded-full transition-all duration-700 pointer-events-none ${
            isAllDone
              ? 'w-64 h-64 sm:w-72 sm:h-72 bg-gradient-to-tr from-emerald-400/30 to-teal-400/20 blur-2xl animate-pulse'
              : 'w-56 h-56 sm:w-64 sm:h-64 bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-blue-500/15 blur-xl animate-pulse'
          }`}
        />

        {/* Ripple Wave on Click */}
        {isRippling && (
          <div className="absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full border-2 border-emerald-400 animate-ping pointer-events-none opacity-70" />
        )}

        {/* Settings Gear Button (Top Right of Circle) */}
        <button
          onClick={onOpenSettings}
          className="absolute -top-1 -right-1 z-20 p-2 bg-white/90 hover:bg-white text-neutral-600 hover:text-neutral-900 rounded-full shadow-md border border-neutral-200 transition-all hover:scale-110"
          title="更换设置与头像"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Circular Button Container with Breathing Animation */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 animate-breathe">
          {/* Circular SVG Progress Ring */}
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="45"
              className="text-neutral-100"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Active Progress Ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              className={`transition-all duration-700 ease-out ${
                isAllDone ? 'text-emerald-500' : 'text-emerald-400'
              }`}
              strokeWidth="4.5"
              strokeDasharray={283}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Core Dynamic Disc Button with Avatar */}
          <button
            onClick={handleCenterButtonClick}
            className={`absolute inset-3 sm:inset-3.5 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 shadow-xl group cursor-pointer overflow-hidden ${
              isAllDone
                ? 'ring-4 ring-emerald-400/80 shadow-emerald-500/40'
                : 'ring-4 ring-white shadow-neutral-900/20 hover:scale-102'
            }`}
          >
            {/* Background Avatar Image */}
            <div className="absolute inset-0 w-full h-full">
              <img
                src={profile.avatarUrl}
                alt={profile.userName}
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                  isAllDone ? 'brightness-75' : 'brightness-65'
                }`}
              />
              {/* Dark gradient overlay for typography readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/45 to-black/70" />
            </div>

            {/* Foreground Text Content inside Circle (Small inner circle removed) */}
            <div className="relative z-10 flex flex-col items-center text-white px-2">
              {/* Main Label */}
              <div className="text-base sm:text-lg font-bold tracking-wider font-serif drop-shadow-md">
                {!isToday
                  ? isPast
                    ? '已截止'
                    : '未开始'
                  : isAllDone
                  ? '今日圆满'
                  : '点击打卡'}
              </div>

              {/* User Name & Status */}
              <div className="text-xs font-mono text-white/90 mt-1 truncate max-w-[130px] drop-shadow-sm font-medium">
                {isAllDone ? `连续 ${currentStreak} 天` : profile.userName}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Strictly 2 Checkpoint Nodes: 每日锻炼 & 每日读书 */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2 px-1">
        {/* Node 1: 每日锻炼 */}
        <div
          onClick={(e) => handleToggleHabit(exerciseHabit?.id, e)}
          className={`p-4 rounded-2xl border transition-all duration-200 shadow-xs flex items-center justify-between group ${
            !isToday
              ? 'bg-neutral-50 border-neutral-200 opacity-75 cursor-not-allowed'
              : isSunday
              ? 'bg-amber-50/50 border-amber-200 text-amber-900 cursor-default'
              : isExDone
              ? 'bg-emerald-50/50 border-emerald-300 text-neutral-900 cursor-pointer'
              : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-700 cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Round Checkbox */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                isSunday
                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                  : isExDone
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'border-2 border-neutral-300 group-hover:border-neutral-400 bg-white'
              }`}
            >
              {isSunday ? (
                <Coffee className="w-4 h-4 text-amber-700" />
              ) : (
                isExDone && <Check className="w-4 h-4 stroke-[3]" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
                <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className={isExDone && !isSunday ? 'line-through decoration-neutral-300' : ''}>
                  每日锻炼
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] font-medium shrink-0 pl-2">
            {isSunday ? (
              <span className="text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                周日休息日
              </span>
            ) : isExDone ? (
              <span className="text-emerald-700">已打卡</span>
            ) : !isToday ? (
              <span className="text-neutral-400">{isPast ? '已截止' : '未开始'}</span>
            ) : (
              <span className="text-neutral-400 group-hover:text-neutral-700">未打卡</span>
            )}
          </div>
        </div>

        {/* Node 2: 每日读书 */}
        <div
          onClick={(e) => handleToggleHabit(readingHabit?.id, e)}
          className={`p-4 rounded-2xl border transition-all duration-200 shadow-xs flex items-center justify-between group ${
            !isToday
              ? 'bg-neutral-50 border-neutral-200 opacity-75 cursor-not-allowed'
              : isRdDone
              ? 'bg-blue-50/40 border-blue-300 text-neutral-900 cursor-pointer'
              : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-700 cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Round Checkbox */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                isRdDone
                  ? 'bg-blue-500 text-white shadow-xs'
                  : 'border-2 border-neutral-300 group-hover:border-neutral-400 bg-white'
              }`}
            >
              {isRdDone && <Check className="w-4 h-4 stroke-[3]" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm">
                <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className={isRdDone ? 'line-through decoration-neutral-300' : ''}>
                  每日读书
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] font-medium shrink-0 pl-2">
            {isRdDone ? (
              <span className="text-blue-700">已打卡</span>
            ) : !isToday ? (
              <span className="text-neutral-400">{isPast ? '已截止' : '未开始'}</span>
            ) : (
              <span className="text-neutral-400 group-hover:text-neutral-700">未打卡</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Poetic Quote Snippet Pill */}
      <div className="w-full mt-4">
        <div
          onClick={() => setIsCelebrationOpen(true)}
          className="w-full p-3.5 bg-neutral-50/90 hover:bg-neutral-100/80 border border-neutral-200/80 rounded-2xl cursor-pointer transition-colors flex items-center justify-between text-xs text-neutral-600 font-serif"
        >
          <div className="flex items-center gap-2 truncate pr-2">
            <Quote className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">“{dailyQuote.text}”</span>
          </div>
          <span className="text-[11px] text-neutral-400 shrink-0 font-sans hover:text-neutral-700">
            展开诗签 →
          </span>
        </div>
      </div>

      {/* 365-Day Daily Quote Celebration Modal */}
      <CelebrationModal
        isOpen={isCelebrationOpen}
        onClose={() => setIsCelebrationOpen(false)}
        quote={dailyQuote}
        dateStr={currentDate}
        completedHabitsCount={currentCompletedCount}
        totalHabitsCount={requiredCount}
      />
    </div>
  );
};
