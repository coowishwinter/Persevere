import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Activity,
  BookOpen,
  Calendar,
  Sparkles,
  Coffee,
  Check,
} from 'lucide-react';
import { DailyRecord, HabitDefinition } from '../types';
import {
  formatShortDate,
  getChineseDayOfWeek,
  getTodayString,
  getYearPanoramicHeatmap,
  parseDateString,
  HeatmapDayCell,
} from '../utils/dateUtils';

interface PanoramicHeatmapProps {
  records: Record<string, DailyRecord>;
  habits: HabitDefinition[];
  currentDate: string;
  onSelectDate: (date: string) => void;
}

export const PanoramicHeatmap: React.FC<PanoramicHeatmapProps> = ({
  records,
  habits,
  currentDate,
  onSelectDate,
}) => {
  const todayStr = getTodayString();
  const initialYear = parseDateString(currentDate).getFullYear();
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [hoveredCell, setHoveredCell] = useState<{
    day: HeatmapDayCell;
    exDone: boolean;
    rdDone: boolean;
    isAllDone: boolean;
  } | null>(null);

  const { weeks, monthLabels } = getYearPanoramicHeatmap(selectedYear, todayStr);

  const exerciseHabit = habits.find((h) => h.category === 'exercise') || habits[0];
  const readingHabit = habits.find((h) => h.category === 'reading') || habits[1];

  // Calculate annual aggregate stats
  let totalDaysInYear = 0;
  let passedDaysInYear = 0;
  let fullDoneDays = 0;
  let exerciseDays = 0;
  let readingDays = 0;

  for (const week of weeks) {
    for (const day of week.days) {
      if (day.isInYear) {
        totalDaysInYear++;
        if (!day.isFuture) {
          passedDaysInYear++;
          const rec = records[day.date];
          const exDone = day.isSunday ? true : !!rec?.habits?.[exerciseHabit?.id]?.completed;
          const rdDone = !!rec?.habits?.[readingHabit?.id]?.completed;

          if (exDone && !day.isSunday) exerciseDays++;
          if (rdDone) readingDays++;

          const isDayAllDone = day.isSunday ? rdDone : exDone && rdDone;
          if (isDayAllDone) fullDoneDays++;
        }
      }
    }
  }

  const annualCompletionRate = passedDaysInYear > 0 ? Math.round((fullDoneDays / passedDaysInYear) * 100) : 0;

  // Helper to determine day status
  const getDayStatus = (day: HeatmapDayCell) => {
    if (!day.isInYear) {
      return { level: -1, exDone: false, rdDone: false, isAllDone: false };
    }
    if (day.isFuture) {
      return { level: 0, exDone: false, rdDone: false, isAllDone: false };
    }
    const rec = records[day.date];
    const exDone = day.isSunday ? true : !!rec?.habits?.[exerciseHabit?.id]?.completed;
    const rdDone = !!rec?.habits?.[readingHabit?.id]?.completed;

    if (day.isSunday) {
      if (rdDone) return { level: 2, exDone: true, rdDone: true, isAllDone: true };
      return { level: 0, exDone: true, rdDone: false, isAllDone: false };
    }

    if (exDone && rdDone) return { level: 2, exDone: true, rdDone: true, isAllDone: true };
    if (exDone || rdDone) return { level: 1, exDone, rdDone, isAllDone: false };
    return { level: 0, exDone: false, rdDone: false, isAllDone: false };
  };

  const dayLabels = ['一', '', '三', '', '五', '', '日'];

  return (
    <div className="space-y-5 select-none">
      {/* 1. Header Navigation & Quick Year Switcher */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 font-serif">
                {selectedYear} 年度全景热力图
              </h2>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 font-medium">
                365天全景
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              鸟瞰整年打卡律动 · 每日锻炼（周日休息）与每日读书
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setSelectedYear((prev) => prev - 1)}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            title="前一年"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono font-semibold text-neutral-800 text-sm px-2">
            {selectedYear} 年
          </span>
          <button
            onClick={() => setSelectedYear((prev) => prev + 1)}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            title="后一年"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Key Annual Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-neutral-500">年度全满贯天数</div>
            <div className="text-base sm:text-lg font-bold font-mono text-neutral-900 truncate">
              {fullDoneDays} <span className="text-xs font-normal text-neutral-400">天</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-neutral-500">年度综合完成率</div>
            <div className="text-base sm:text-lg font-bold font-mono text-neutral-900 truncate">
              {annualCompletionRate}%
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-neutral-500">锻炼达标 (非周日)</div>
            <div className="text-base sm:text-lg font-bold font-mono text-emerald-600 truncate">
              {exerciseDays} <span className="text-xs font-normal text-neutral-400">天</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-neutral-500">读书达标</div>
            <div className="text-base sm:text-lg font-bold font-mono text-blue-600 truncate">
              {readingDays} <span className="text-xs font-normal text-neutral-400">天</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. The Panoramic 52-Week Heatmap Matrix */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-6 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 text-xs text-neutral-500">
          <span className="font-medium font-serif">52 周全景打卡流光矩阵</span>
          <div className="flex items-center gap-2 text-[11px]">
            <span>少</span>
            <div className="w-3 h-3 rounded-xs bg-neutral-100 border border-neutral-200" title="未打卡" />
            <div className="w-3 h-3 rounded-xs bg-emerald-300 border border-emerald-400" title="完成单项" />
            <div className="w-3 h-3 rounded-xs bg-emerald-500 border border-emerald-600" title="圆满完成" />
            <span>多</span>
          </div>
        </div>

        {/* Scrollable Heatmap Canvas */}
        <div className="overflow-x-auto pb-2 pt-4">
          <div className="min-w-[780px]">
            {/* Month Labels Header */}
            <div className="flex text-[11px] font-mono text-neutral-400 mb-1 pl-6">
              {weeks.map((week, idx) => (
                <div key={idx} className="w-3.5 mr-1 text-center shrink-0">
                  {week.monthLabel ? (
                    <span className="font-semibold text-neutral-700">{week.monthLabel}</span>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Matrix Grid: 7 Rows (Mon - Sun) */}
            <div className="flex items-start">
              {/* Day of Week Labels */}
              <div className="flex flex-col justify-between h-[116px] text-[10px] font-mono text-neutral-400 pr-2 select-none shrink-0">
                {dayLabels.map((lbl, idx) => (
                  <span key={idx} className="h-3.5 leading-3.5">
                    {lbl}
                  </span>
                ))}
              </div>

              {/* 52-Week Columns */}
              <div className="flex gap-1">
                {weeks.map((week) => (
                  <div key={week.weekIndex} className="flex flex-col gap-1">
                    {week.days.map((day) => {
                      const { level, exDone, rdDone, isAllDone } = getDayStatus(day);
                      const isTargetToday = day.isToday;

                      if (!day.isInYear) {
                        return <div key={day.date} className="w-3.5 h-3.5 opacity-0" />;
                      }

                      let bgClass = 'bg-neutral-100 border-neutral-200 hover:border-neutral-400';
                      if (day.isFuture) {
                        bgClass = 'bg-neutral-50/60 border-neutral-100 border-dashed opacity-40';
                      } else if (level === 2) {
                        bgClass = 'bg-emerald-500 border-emerald-600 hover:bg-emerald-600 shadow-2xs';
                      } else if (level === 1) {
                        bgClass = 'bg-emerald-300 border-emerald-400 hover:bg-emerald-400';
                      }

                      return (
                        <button
                          key={day.date}
                          type="button"
                          onClick={() => onSelectDate(day.date)}
                          onMouseEnter={() =>
                            setHoveredCell({
                              day,
                              exDone,
                              rdDone,
                              isAllDone,
                            })
                          }
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`w-3.5 h-3.5 rounded-xs border transition-all cursor-pointer relative ${bgClass} ${
                            isTargetToday ? 'ring-2 ring-emerald-600 ring-offset-1 z-10' : ''
                          }`}
                          title={`${day.date} (${getChineseDayOfWeek(day.date)})`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hover Inspector Tooltip Strip */}
        <div className="mt-3 pt-3 border-t border-neutral-100 min-h-[32px] flex items-center justify-between text-xs text-neutral-600">
          {hoveredCell ? (
            <div className="flex items-center gap-3 animate-fade-in">
              <span className="font-semibold text-neutral-900 font-mono">
                {hoveredCell.day.date} ({getChineseDayOfWeek(hoveredCell.day.date)})
              </span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-600" />
                  {hoveredCell.day.isSunday ? (
                    <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-xs text-[10px]">
                      周日休息
                    </span>
                  ) : hoveredCell.exDone ? (
                    <span className="text-emerald-700 font-medium">已完成</span>
                  ) : (
                    <span className="text-neutral-400">未打卡</span>
                  )}
                </span>

                <span className="text-neutral-300">|</span>

                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-blue-600" />
                  {hoveredCell.rdDone ? (
                    <span className="text-blue-700 font-medium">已完成</span>
                  ) : (
                    <span className="text-neutral-400">未打卡</span>
                  )}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-neutral-400 text-[11px]">
              鼠标悬停热力方块查看打卡细节，点击任意方格可快速跳转对应日期
            </span>
          )}

          <div className="text-[11px] text-neutral-400 font-mono">
            {selectedYear} 年累计已走过 {passedDaysInYear} / {totalDaysInYear} 天
          </div>
        </div>
      </div>
    </div>
  );
};
