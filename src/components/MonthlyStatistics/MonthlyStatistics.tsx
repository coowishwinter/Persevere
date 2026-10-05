import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  BookOpen,
  Calendar,
  Flame,
  Award,
  TrendingUp,
  Target,
  Dumbbell,
  CheckCircle2,
  Circle,
  Clock,
  Layers,
} from 'lucide-react';
import { DailyRecord, HabitDefinition, MonthlyStats } from '../../types';
import {
  getMonthCalendarGrid,
  getTodayString,
  parseDateString,
} from '../../utils/dateUtils';
import { calculateMonthlyStats } from '../../utils/reportGenerator';

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
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const todayStr = getTodayString();
  const stats: MonthlyStats = calculateMonthlyStats(selectedYear, selectedMonth, records, habits);
  const calendarGrid = getMonthCalendarGrid(selectedYear, selectedMonth, todayStr);

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

  const handleResetToCurrentMonth = () => {
    const today = parseDateString(todayStr);
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth() + 1);
  };

  // Helper for color coding heat map
  const getCellColor = (dateStr: string, isCurrentMonth: boolean, isFuture: boolean) => {
    if (!isCurrentMonth) return 'bg-neutral-50/50 text-neutral-300 border-neutral-100';
    if (isFuture) return 'bg-neutral-50/70 text-neutral-400 border-neutral-100';

    const record = records[dateStr];
    if (!record?.habits) return 'bg-white text-neutral-700 border-neutral-200';

    const enabled = habits.filter((h) => h.enabled);
    let done = 0;
    for (const h of enabled) {
      if (record.habits[h.id]?.completed) done++;
    }

    if (done === 0) return 'bg-neutral-50 text-neutral-600 border-neutral-200';
    if (done >= enabled.length) return 'bg-emerald-500 text-white border-emerald-600 font-semibold shadow-xs';
    return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-medium';
  };

  const exerciseHours = (stats.totalExerciseMinutes / 60).toFixed(1);
  const readingHours = (stats.totalReadingMinutes / 60).toFixed(1);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Month Navigation Banner */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors"
                title="上个月"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors"
                title="下个月"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                  {selectedYear} 年 {selectedMonth} 月进度统计
                </h2>
                <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md font-mono">
                  共 {stats.totalDays} 天
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                月度全景热力图与习惯周期律深度分析
              </p>
            </div>
          </div>

          <button
            onClick={handleResetToCurrentMonth}
            className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors self-end sm:self-center"
          >
            返回当月
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Overall Completion */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">月度打卡达成率</span>
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 tabular-nums">
            {stats.overallCompletionRate}%
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            活跃天数 <strong className="font-mono text-neutral-700">{stats.activeDays}</strong> 天 · 满卡 <strong className="font-mono text-neutral-700">{stats.perfectDays}</strong> 天
          </div>
        </div>

        {/* Card 2: Exercise */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">累计锻炼投入</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 tabular-nums">
            {exerciseHours} <span className="text-sm font-normal text-neutral-500">小时</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            运动达标 <strong className="font-mono text-neutral-700">{stats.exerciseDays}</strong> 天 ({stats.totalExerciseMinutes} 分钟)
          </div>
        </div>

        {/* Card 3: Reading */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">累计深度阅读</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 tabular-nums">
            {stats.totalReadingPages} <span className="text-sm font-normal text-neutral-500">页</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            阅读达标 <strong className="font-mono text-neutral-700">{stats.readingDays}</strong> 天 ({readingHours} 小时)
          </div>
        </div>

        {/* Card 4: Best Streak */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">最长连续打卡</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 tabular-nums">
            {stats.bestStreak} <span className="text-sm font-normal text-neutral-500">天</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            自律复利正在显现
          </div>
        </div>
      </div>

      {/* Main Feature: Monthly Calendar Heatmap */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-neutral-900 text-sm sm:text-base flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              月度打卡日历热力图
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              点击任意日期卡片可直接查看或补卡打卡明细
            </p>
          </div>

          {/* Color legend */}
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-3.5 rounded bg-neutral-100 border border-neutral-200" />
              <span>未打卡</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-300" />
              <span>部分完成</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-600" />
              <span>全部完成</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid Container */}
        <div>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-xs font-semibold text-neutral-500 mb-2">
            <div>周一</div>
            <div>周二</div>
            <div>周三</div>
            <div>周四</div>
            <div>周五</div>
            <div className="text-neutral-400">周六</div>
            <div className="text-neutral-400">周日</div>
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarGrid.map((cell) => {
              const cellColor = getCellColor(cell.date, cell.isCurrentMonth, cell.isFuture);
              const rec = records[cell.date];
              const exDone = rec?.habits?.['habit_exercise']?.completed;
              const rdDone = rec?.habits?.['habit_reading']?.completed;
              const isHovered = hoveredCell === cell.date;

              return (
                <div
                  key={cell.date}
                  onClick={() => cell.isCurrentMonth && onSelectDate(cell.date)}
                  onMouseEnter={() => setHoveredCell(cell.date)}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`min-h-[72px] sm:min-h-[82px] p-1.5 sm:p-2 rounded-xl border transition-all flex flex-col justify-between ${cellColor} ${
                    cell.isCurrentMonth ? 'cursor-pointer hover:scale-[1.02] hover:z-10' : 'opacity-40'
                  } ${cell.isToday ? 'ring-2 ring-emerald-600 ring-offset-1' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-mono font-bold">
                      {cell.dayNumber}
                    </span>
                    {cell.isToday && (
                      <span className="text-[10px] px-1 bg-white/80 text-emerald-800 rounded font-medium">
                        今
                      </span>
                    )}
                  </div>

                  {/* Badges for exercise & reading */}
                  {cell.isCurrentMonth && !cell.isFuture && (
                    <div className="space-y-1 mt-1">
                      <div className="flex items-center gap-1 text-[10px] truncate">
                        <Activity className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {exDone ? `${rec?.habits?.['habit_exercise']?.duration || 0}m` : '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] truncate">
                        <BookOpen className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {rdDone ? `${rec?.habits?.['habit_reading']?.value || 0}p` : '-'}
                        </span>
                      </div>
                    </div>
                  )}

                  {cell.isFuture && (
                    <div className="text-[10px] text-neutral-400 mt-2 text-center">待开启</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Habit Rhythm & Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Chart 1: Day of Week Distribution */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              周内作息节奏与打卡率分析
            </h4>
            <span className="text-[11px] text-neutral-400">周一至周日分布</span>
          </div>

          <div className="space-y-2.5">
            {stats.dayOfWeekCounts.map((item) => (
              <div key={item.day} className="flex items-center gap-3 text-xs">
                <span className="w-8 font-medium text-neutral-700">{item.day}</span>
                <div className="flex-1 bg-neutral-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all"
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono tabular-nums font-semibold text-neutral-700">
                  {item.rate}%
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-neutral-500 mt-4 pt-3 border-t border-neutral-100">
            💡 洞察：通过对比工作日与周末达成率，可针对性为低谷日设置更低门槛的微运动或碎片阅读。
          </p>
        </div>

        {/* Chart 2: Weekly Progression & Workout Breakdown */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                各周达成率走势
              </h4>
              <span className="text-[11px] text-neutral-400">月内演进</span>
            </div>

            <div className="space-y-3">
              {stats.weeklyBreakdown.map((wb) => (
                <div key={wb.weekLabel} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-neutral-700">{wb.weekLabel}</span>
                    <span className="font-mono tabular-nums font-semibold text-neutral-900">
                      {wb.completionRate}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${wb.completionRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>运动 {wb.exerciseMins} min</span>
                    <span>阅读 {wb.readingMins} min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Books tracked */}
          <div className="pt-3 border-t border-neutral-100 mt-4">
            <div className="text-xs font-medium text-neutral-700 mb-1.5 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              本月在读书目与书单
            </div>
            {stats.booksRead.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {stats.booksRead.map((book) => (
                  <span
                    key={book}
                    className="text-xs bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-md border border-blue-200 font-medium"
                  >
                    {book}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-neutral-400">本月尚在积累更多书目记录</div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Achievements / Milestones */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
        <h4 className="font-bold text-neutral-900 text-xs mb-3 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-500" />
          月度习惯成就勋章
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            className={`p-3 rounded-lg border flex items-center gap-3 ${
              stats.activeDays >= 15
                ? 'bg-white border-neutral-200 text-neutral-900'
                : 'bg-neutral-100/50 border-dashed border-neutral-200 text-neutral-400'
            }`}
          >
            <div className={`p-2 rounded-lg ${stats.activeDays >= 15 ? 'bg-amber-100 text-amber-700' : 'bg-neutral-200 text-neutral-500'}`}>
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold">自律半程勋章</div>
              <div className="text-[11px] text-neutral-500">累计打卡满 15 天 ({stats.activeDays}/15)</div>
            </div>
          </div>

          <div
            className={`p-3 rounded-lg border flex items-center gap-3 ${
              stats.exerciseDays >= 12
                ? 'bg-white border-neutral-200 text-neutral-900'
                : 'bg-neutral-100/50 border-dashed border-neutral-200 text-neutral-400'
            }`}
          >
            <div className={`p-2 rounded-lg ${stats.exerciseDays >= 12 ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-500'}`}>
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold">运动达人勋章</div>
              <div className="text-[11px] text-neutral-500">完成运动达标 12 次 ({stats.exerciseDays}/12)</div>
            </div>
          </div>

          <div
            className={`p-3 rounded-lg border flex items-center gap-3 ${
              stats.totalReadingPages >= 100
                ? 'bg-white border-neutral-200 text-neutral-900'
                : 'bg-neutral-100/50 border-dashed border-neutral-200 text-neutral-400'
            }`}
          >
            <div className={`p-2 rounded-lg ${stats.totalReadingPages >= 100 ? 'bg-blue-100 text-blue-700' : 'bg-neutral-200 text-neutral-500'}`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold">百页书虫勋章</div>
              <div className="text-[11px] text-neutral-500">累计精读超过 100 页 ({stats.totalReadingPages}/100)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
