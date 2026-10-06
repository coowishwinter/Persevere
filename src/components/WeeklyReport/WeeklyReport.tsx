import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  BookOpen,
  Calendar,
  Sparkles,
  Check,
  X,
  Coffee,
  Copy,
  BrainCircuit,
  MessageSquare,
} from 'lucide-react';
import { DailyRecord, HabitDefinition } from '../../types';
import {
  addDays,
  formatShortDate,
  getChineseDayOfWeek,
  getTodayString,
  getWeekRange,
  parseDateString,
} from '../../utils/dateUtils';
import { loadWeeklyReviews, saveWeeklyReview } from '../../utils/storage';

interface WeeklyReportProps {
  records: Record<string, DailyRecord>;
  habits: HabitDefinition[];
  currentDate: string;
  onSelectDate: (date: string) => void;
}

export const WeeklyReport: React.FC<WeeklyReportProps> = ({
  records,
  habits,
  currentDate,
  onSelectDate,
}) => {
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const weekInfo = getWeekRange(selectedDate);
  const todayStr = getTodayString();

  const exerciseHabit = habits.find((h) => h.category === 'exercise') || habits[0];
  const readingHabit = habits.find((h) => h.category === 'reading') || habits[1];

  // Weekly review storage
  const [reflection, setReflection] = useState('');
  const [aiReview, setAiReview] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const reviews = loadWeeklyReviews();
    const saved = reviews[weekInfo.start];
    if (saved) {
      setReflection(saved.reflection || '');
      setAiReview(saved.aiReview || '');
    } else {
      setReflection('');
      setAiReview('');
    }
  }, [weekInfo.start]);

  // Calculate clean weekly metrics
  let exerciseDays = 0;
  let readingDays = 0;
  let fullDoneDays = 0;

  const dayRows = weekInfo.days.map((dateStr) => {
    const dObj = parseDateString(dateStr);
    const isSun = dObj.getDay() === 0;
    const isFuture = dateStr > todayStr;
    const isCurrentToday = dateStr === todayStr;

    const rec = records[dateStr];
    const exDone = isSun ? true : !!rec?.habits?.[exerciseHabit?.id]?.completed;
    const rdDone = !!rec?.habits?.[readingHabit?.id]?.completed;

    if (!isFuture) {
      if (exDone && !isSun) exerciseDays++;
      if (rdDone) readingDays++;
      if (isSun ? rdDone : exDone && rdDone) fullDoneDays++;
    }

    const isAllDone = isSun ? rdDone : exDone && rdDone;

    return {
      date: dateStr,
      dayOfWeek: getChineseDayOfWeek(dateStr),
      isSunday: isSun,
      isFuture,
      isToday: isCurrentToday,
      exDone,
      rdDone,
      isAllDone,
    };
  });

  const completionRate = Math.round((fullDoneDays / 7) * 100);

  const handlePrevWeek = () => {
    setSelectedDate(addDays(selectedDate, -7));
  };

  const handleNextWeek = () => {
    setSelectedDate(addDays(selectedDate, 7));
  };

  const handleGenerateAiReview = async () => {
    setIsLoadingAi(true);
    try {
      const response = await fetch('/api/ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: 'weekly',
          periodTitle: `${weekInfo.start} 至 ${weekInfo.end} (第${weekInfo.weekNumber}周)`,
          stats: {
            completionRate,
            exerciseDays,
            readingDays,
            fullDoneDays,
          },
          habits: dayRows.map((d) => ({
            date: d.date,
            day: d.dayOfWeek,
            exercise: d.isSunday ? '周日休息日' : d.exDone ? '已完成' : '未打卡',
            reading: d.rdDone ? '已完成' : '未打卡',
          })),
          reflection: reflection.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setAiReview(data.text);
        saveWeeklyReview(weekInfo.start, { reflection, aiReview: data.text });
      } else {
        setAiReview(data.error || '本周锻炼与阅读节奏保持良好，周日适度休整，张弛有度！');
      }
    } catch {
      setAiReview('本周打卡记录扎实，运动与读书双轮驱动，继续保持自律节奏！');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleCopy = () => {
    const text = `📅 【日砺知行·周度打卡报告】
周期：${weekInfo.start} 至 ${weekInfo.end} (第${weekInfo.weekNumber}周)
综合达标率：${completionRate}%
- 🏃 每日锻炼：达标 ${exerciseDays}/6 天 (周日休息)
- 📖 每日读书：达标 ${readingDays}/7 天
- 🌟 全满天数：${fullDoneDays}/7 天`;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 select-none">
      {/* 1. Header Navigator */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 font-serif">
                第 {weekInfo.weekNumber} 周打卡周报
              </h2>
              <span className="text-[11px] font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                {formatShortDate(weekInfo.start)} - {formatShortDate(weekInfo.end)}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              一周执行节奏复盘 · 每日锻炼与读书
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            title="上一周"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="px-2.5 py-1 text-xs text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium transition-colors"
          >
            本周
          </button>
          <button
            onClick={handleNextWeek}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            title="下一周"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 shadow-xs">
          <div className="text-[11px] text-neutral-500">本周综合达标率</div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5">
            {completionRate}%
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 shadow-xs">
          <div className="text-[11px] text-neutral-500">锻炼达标 (周日休息)</div>
          <div className="text-xl font-bold font-mono text-neutral-900 mt-0.5">
            {exerciseDays} <span className="text-xs text-neutral-400 font-normal">/ 6 天</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 shadow-xs">
          <div className="text-[11px] text-neutral-500">读书达标</div>
          <div className="text-xl font-bold font-mono text-neutral-900 mt-0.5">
            {readingDays} <span className="text-xs text-neutral-400 font-normal">/ 7 天</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 shadow-xs">
          <div className="text-[11px] text-neutral-500">双项目全满天数</div>
          <div className="text-xl font-bold font-mono text-neutral-900 mt-0.5">
            {fullDoneDays} <span className="text-xs text-neutral-400 font-normal">/ 7 天</span>
          </div>
        </div>
      </div>

      {/* 3. Seven Day Clean Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-2.5">
        {dayRows.map((day) => (
          <div
            key={day.date}
            onClick={() => onSelectDate(day.date)}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[130px] ${
              day.isToday
                ? 'bg-emerald-50/40 border-emerald-400 shadow-xs ring-1 ring-emerald-400'
                : day.isAllDone
                ? 'bg-white border-emerald-200 hover:border-emerald-300'
                : 'bg-white border-neutral-200/80 hover:border-neutral-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-neutral-800 font-serif">
                  {day.dayOfWeek}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {formatShortDate(day.date)}
                </span>
              </div>

              {/* Habit Status Badges */}
              <div className="mt-2.5 space-y-1.5">
                {/* Exercise Item */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-neutral-600">
                    <Activity className="w-3 h-3 text-emerald-600 shrink-0" />
                    锻炼
                  </span>
                  {day.isSunday ? (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-xs">
                      休息
                    </span>
                  ) : day.exDone ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  ) : (
                    <span className="text-neutral-300 text-[11px]">—</span>
                  )}
                </div>

                {/* Reading Item */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-neutral-600">
                    <BookOpen className="w-3 h-3 text-blue-600 shrink-0" />
                    读书
                  </span>
                  {day.rdDone ? (
                    <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />
                  ) : (
                    <span className="text-neutral-300 text-[11px]">—</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Tag */}
            <div className="pt-2 border-t border-neutral-100 text-[10px] text-center font-medium">
              {day.isToday ? (
                <span className="text-emerald-700 font-semibold">今日</span>
              ) : day.isFuture ? (
                <span className="text-neutral-400">未开始</span>
              ) : day.isAllDone ? (
                <span className="text-emerald-600">已圆满</span>
              ) : (
                <span className="text-neutral-400">未完成</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 4. Concise AI / Smart Coach Summary */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-neutral-900 font-serif">
              智能教练每周简评
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="text-xs text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              {copySuccess ? '已复制' : '复制简报'}
            </button>
            <button
              onClick={handleGenerateAiReview}
              disabled={isLoadingAi}
              className="text-xs text-white bg-neutral-900 hover:bg-neutral-800 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 font-medium disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              {isLoadingAi ? '生成中...' : '生成智能简评'}
            </button>
          </div>
        </div>

        {aiReview ? (
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/60 text-xs text-neutral-700 leading-relaxed font-serif whitespace-pre-line">
            {aiReview}
          </div>
        ) : (
          <div className="text-xs text-neutral-500 font-serif">
            本周已完成 {fullDoneDays} 天全满贯打卡。点击上方按钮可一键生成专属周度复盘建议。
          </div>
        )}
      </div>
    </div>
  );
};
