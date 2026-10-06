import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  BookOpen,
  Calendar,
  Flame,
  Sparkles,
  LayoutGrid,
  CalendarDays,
  Coffee,
  Check,
} from 'lucide-react';
import { DailyRecord, HabitDefinition } from '../../types';
import {
  getMonthCalendarGrid,
  getTodayString,
  parseDateString,
} from '../../utils/dateUtils';
import { PanoramicHeatmap } from '../PanoramicHeatmap';

interface MonthlyStatisticsProps {
  records: Record<string, DailyRecord>;
  habits: HabitDefinition[];
  currentDate: string;
  onSelectDate: (date: string) => void;
}

export const MonthlyStatistics: React.FC<MonthlyStatisticsProps> = ({
  records,
  habits,
  currentDate,
  onSelectDate,
}) => {
  const initialDate = parseDateString(currentDate);
  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth() + 1); // 1-12
  const [viewMode, setViewMode] = useState<'panoramic' | 'monthly'>('panoramic');

  const todayStr = getTodayString();
  const calendarGrid = getMonthCalendarGrid(selectedYear, selectedMonth, todayStr);

  const exerciseHabit = habits.find((h) => h.category === 'exercise') || habits[0];
  const readingHabit = habits.find((h) => h.category === 'reading') || habits[1];

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Monthly stats calculation
  let currentMonthTotalDays = 0;
  let currentMonthPassedDays = 0;
  let exerciseDays = 0;
  let readingDays = 0;
  let fullDoneDays = 0;

  for (const cell of calendarGrid) {
    if (cell.isCurrentMonth) {
      currentMonthTotalDays++;
      if (!cell.isFuture) {
        currentMonthPassedDays++;
        const rec = records[cell.date];
        const cellDate = parseDateString(cell.date);
        const isSun = cellDate.getDay() === 0;

        const exDone = isSun ? true : !!rec?.habits?.[exerciseHabit?.id]?.completed;
        const rdDone = !!rec?.habits?.[readingHabit?.id]?.completed;

        if (exDone && !isSun) exerciseDays++;
        if (rdDone) readingDays++;
        if (isSun ? rdDone : exDone && rdDone) fullDoneDays++;
      }
    }
  }

  const monthlyCompletionRate =
    currentMonthPassedDays > 0 ? Math.round((fullDoneDays / currentMonthPassedDays) * 100) : 0;

  const weekdays = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="max-w-4xl mx-auto space-y-5 select-none">
      {/* View Switcher: Panoramic Heatmap vs Monthly Calendar */}
      <div className="flex items-center justify-center">
        <div className="bg-neutral-200/70 p-1 rounded-xl flex items-center gap-1 shadow-2xs">
          <button
            onClick={() => setViewMode('panoramic')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'panoramic'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
            365天全景热力图
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'monthly'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
            单月热力日历
          </button>
        </div>
      </div>

      {/* Render Panoramic Heatmap View */}
      {viewMode === 'panoramic' && (
        <PanoramicHeatmap
          records={records}
          habits={habits}
          currentDate={currentDate}
          onSelectDate={onSelectDate}
        />
      )}

      {/* Render Monthly Clean Heatmap View */}
      {viewMode === 'monthly' && (
        <div className="space-y-5">
          {/* Month Header & Navigator */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900 font-serif">
                    {selectedYear} 年 {selectedMonth} 月热力总览
                  </h2>
                  <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60 font-medium">
                    月度图
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  每日锻炼与读书打卡月历 · 周日自动休整
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                title="上个月"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const today = parseDateString(todayStr);
                  setSelectedYear(today.getFullYear());
                  setSelectedMonth(today.getMonth() + 1);
                }}
                className="px-2.5 py-1 text-xs text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium transition-colors"
              >
                当月
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                title="下个月"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 shadow-xs">
              <div className="text-[11px] text-neutral-500">本月综合达标率</div>
              <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5">
                {monthlyCompletionRate}%
              </div>
            </div>

            <div className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 shadow-xs">
              <div className="text-[11px] text-neutral-500">全满贯打卡天数</div>
              <div className="text-xl font-bold font-mono text-neutral-900 mt-0.5">
                {fullDoneDays} <span className="text-xs text-neutral-400 font-normal">/ {currentMonthPassedDays} 天</span>
              </div>
            </div>

            <div className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 shadow-xs">
              <div className="text-[11px] text-neutral-500">锻炼达标天数</div>
              <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5">
                {exerciseDays} <span className="text-xs text-neutral-400 font-normal">天</span>
              </div>
            </div>

            <div className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 shadow-xs">
              <div className="text-[11px] text-neutral-500">读书达标天数</div>
              <div className="text-xl font-bold font-mono text-blue-600 mt-0.5">
                {readingDays} <span className="text-xs text-neutral-400 font-normal">天</span>
              </div>
            </div>
          </div>

          {/* Monthly Heatmap Calendar Grid */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-3">
            {/* Weekday Header */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-serif font-bold text-neutral-600 pb-2 border-b border-neutral-100">
              {weekdays.map((w, idx) => (
                <div key={idx} className={idx === 6 ? 'text-amber-700' : ''}>
                  周{w}
                </div>
              ))}
            </div>

            {/* Calendar Cells Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarGrid.map((cell) => {
                const rec = records[cell.date];
                const cellDate = parseDateString(cell.date);
                const isSun = cellDate.getDay() === 0;

                const exDone = isSun ? true : !!rec?.habits?.[exerciseHabit?.id]?.completed;
                const rdDone = !!rec?.habits?.[readingHabit?.id]?.completed;
                const isAllDone = isSun ? rdDone : exDone && rdDone;
                const isPartial = !isAllDone && (exDone || rdDone);

                let cellStyle = 'bg-white border-neutral-200/80 text-neutral-700 hover:border-neutral-400';
                if (!cell.isCurrentMonth) {
                  cellStyle = 'bg-neutral-50/50 border-transparent text-neutral-300 opacity-40';
                } else if (cell.isFuture) {
                  cellStyle = 'bg-neutral-50/70 border-dashed border-neutral-200 text-neutral-400 opacity-60';
                } else if (isAllDone) {
                  cellStyle = 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold shadow-xs';
                } else if (isPartial) {
                  cellStyle = 'bg-emerald-50/40 border-emerald-200 text-emerald-900';
                }

                return (
                  <div
                    key={cell.date}
                    onClick={() => onSelectDate(cell.date)}
                    className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-h-[64px] sm:min-h-[72px] ${cellStyle} ${
                      cell.isToday ? 'ring-2 ring-emerald-600 ring-offset-1' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold">
                        {cell.dayNumber}
                      </span>
                      {cell.isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </div>

                    {/* Status Icons */}
                    {cell.isCurrentMonth && !cell.isFuture && (
                      <div className="flex items-center gap-1 mt-1">
                        {isSun ? (
                          <span className="text-[9px] text-amber-700 bg-amber-100/70 px-1 rounded-xs">
                            休
                          </span>
                        ) : exDone ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="锻炼已完成" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-neutral-200" title="锻炼未完成" />
                        )}

                        {rdDone ? (
                          <span className="w-2 h-2 rounded-full bg-blue-500" title="读书已完成" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-neutral-200" title="读书未完成" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
