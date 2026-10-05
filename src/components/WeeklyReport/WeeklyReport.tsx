import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  BookOpen,
  Calendar,
  Sparkles,
  Copy,
  Printer,
  CheckCircle2,
  XCircle,
  FileCheck,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  Award,
} from 'lucide-react';
import { DailyRecord, HabitDefinition, WeeklyStats } from '../../types';
import {
  addDays,
  formatShortDate,
  getChineseDayOfWeek,
  getTodayString,
  getWeekRange,
} from '../../utils/dateUtils';
import {
  calculateWeeklyStats,
  generateLocalSmartSummary,
} from '../../utils/reportGenerator';
import {
  loadWeeklyReviews,
  saveWeeklyReview,
} from '../../utils/storage';

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
  const stats: WeeklyStats = calculateWeeklyStats(weekInfo.start, records, habits);

  // Storage for weekly reflection and AI reviews
  const [reflection, setReflection] = useState('');
  const [aiReview, setAiReview] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveStatus, setSaveStatus] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Load saved reflection for this week
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
    setAiError(null);
  }, [weekInfo.start]);

  const localSummary = generateLocalSmartSummary(stats);

  const handleSaveReflection = () => {
    saveWeeklyReview(weekInfo.start, { reflection, aiReview });
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const handleGenerateAiReview = async () => {
    setIsLoadingAi(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: 'weekly',
          periodTitle: `${weekInfo.start} 至 ${weekInfo.end} (第${weekInfo.weekNumber}周)`,
          stats: {
            completionRate: stats.completionRate,
            streak: stats.longestStreakInWeek,
            totalExerciseMinutes: stats.totalExerciseMinutes,
            exerciseDays: stats.exerciseDays,
            totalReadingMinutes: stats.totalReadingMinutes,
            totalReadingPages: stats.totalReadingPages,
            readingDays: stats.readingDays,
          },
          habits: stats.days.map((d) => ({
            date: d.date,
            day: d.dayOfWeek,
            exercise: d.exerciseCompleted ? `${d.exerciseType || '锻炼'} ${d.exerciseMinutes}min` : '未完成',
            exerciseNotes: d.exerciseNotes,
            reading: d.readingCompleted ? `${d.readingBook || '读书'} ${d.readingPages}页` : '未完成',
            readingNotes: d.readingNotes,
          })),
          reflection: reflection.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setAiReview(data.text);
        saveWeeklyReview(weekInfo.start, { reflection, aiReview: data.text });
      } else {
        setAiError(data.error || '生成失败，请确认网络连接或配置。已呈现本地分析。');
      }
    } catch (err: any) {
      setAiError(err.message || '网络连接异常，未能完成云端生成。');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleCopyMarkdown = () => {
    const md = `# 📅 每周习惯打卡与成长周报
**周期**：${weekInfo.start} 至 ${weekInfo.end}
**综合完成率**：${stats.completionRate}%
- 🏃 **锻炼统计**：达标 ${stats.exerciseDays}/7 天 | 累计 ${(stats.totalExerciseMinutes / 60).toFixed(1)} 小时 (${stats.totalExerciseMinutes} 分钟)
- 📖 **阅读统计**：达标 ${stats.readingDays}/7 天 | 累计 ${stats.totalReadingPages} 页 (${stats.totalReadingMinutes} 分钟)
- 🔥 **本周最长连击**：${stats.longestStreakInWeek} 天

---
## 每日执行清单
${stats.days
  .map(
    (d) =>
      `### ${d.dayName}
- 锻炼：${d.exerciseCompleted ? `✅ [${d.exerciseType || '运动'}] ${d.exerciseMinutes}min ${d.exerciseNotes ? `(${d.exerciseNotes})` : ''}` : '❌ 未完成'}
- 读书：${d.readingCompleted ? `✅ [${d.readingBook || '书籍'}] ${d.readingPages}页 ${d.readingNotes ? `(${d.readingNotes})` : ''}` : '❌ 未完成'}`
  )
  .join('\n\n')}

---
## 智能复盘与习惯洞察
${aiReview || localSummary}

---
## 个人反思与随笔
${reflection || '（暂无个人复盘）'}
`;

    navigator.clipboard.writeText(md).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const todayStr = getTodayString();
  const isThisWeek = weekInfo.days.includes(todayStr);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Week Selector Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-xs no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors"
                title="上一周"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors"
                title="下一周"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                  {formatShortDate(weekInfo.start)} — {formatShortDate(weekInfo.end)}
                </h2>
                <span className="text-xs font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                  第 {weekInfo.weekNumber} 周
                </span>
                {isThisWeek && (
                  <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    本周
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                记录每一次蜕变 · 周度打卡与多维复盘
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-2.5 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              跳转本周
            </button>
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg shadow-xs transition-colors"
              title="复制 Markdown 纯文本周报"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copySuccess ? '已复制！' : '复制周报文本'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors"
              title="打印或保存为 PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>打印/导出</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Report Container */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-7 shadow-xs space-y-6">
        {/* Printable Header */}
        <div className="border-b border-neutral-200 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-emerald-600 font-semibold tracking-wider uppercase">
                WEEKLY HABIT REVIEW
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-0.5">
                每周锻炼与读书打卡周报
              </h1>
              <p className="text-xs text-neutral-500 mt-1">
                统计区间：{weekInfo.start} 至 {weekInfo.end} (第{weekInfo.weekNumber}周)
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600">
                {stats.completionRate}%
              </div>
              <div className="text-xs text-neutral-500">本周总达成率</div>
            </div>
          </div>
        </div>

        {/* 4 Key Stat Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Completion */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/70">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-xs font-medium">总完成率</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-neutral-900 tabular-nums">
              {stats.completionRate}%
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              已完成 {stats.totalCompletedChecks} / {stats.totalPossibleChecks} 次打卡
            </div>
          </div>

          {/* Card 2: Exercise */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/70">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-xs font-medium">锻炼计划</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-neutral-900 tabular-nums">
              {stats.exerciseDays}<span className="text-sm font-normal text-neutral-500">/7 天</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              累计 {(stats.totalExerciseMinutes / 60).toFixed(1)} 小时 ({stats.totalExerciseMinutes} 分钟)
            </div>
          </div>

          {/* Card 3: Reading */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/70">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-xs font-medium">读书计划</span>
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-neutral-900 tabular-nums">
              {stats.readingDays}<span className="text-sm font-normal text-neutral-500">/7 天</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              精读 {stats.totalReadingPages} 页 ({stats.totalReadingMinutes} 分钟)
            </div>
          </div>

          {/* Card 4: Streak */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/70">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-xs font-medium">本周最高连击</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-neutral-900 tabular-nums">
              {stats.longestStreakInWeek}<span className="text-sm font-normal text-neutral-500"> 天</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              连续保持自律节奏
            </div>
          </div>
        </div>

        {/* 7-Day Matrix Table / Cards */}
        <div>
          <h3 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-neutral-600" />
            每日执行清单明细 (周一至周日)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5">
            {stats.days.map((day) => (
              <div
                key={day.date}
                onClick={() => onSelectDate(day.date)}
                className={`p-3 rounded-xl border transition-all cursor-pointer hover:shadow-xs flex flex-col justify-between ${
                  day.isToday
                    ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-400'
                    : day.completedHabitsCount > 0
                    ? 'bg-white border-neutral-200 hover:border-neutral-300'
                    : 'bg-neutral-50/50 border-neutral-200 text-neutral-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-neutral-800">
                      {day.dayOfWeek}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-500">
                      {day.date.slice(5)}
                    </span>
                  </div>

                  {/* Exercise Item */}
                  <div className="text-xs py-1 border-b border-neutral-100 flex items-start gap-1">
                    {day.exerciseCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-neutral-300 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-neutral-800 text-[11px]">
                        {day.exerciseCompleted ? day.exerciseType || '锻炼' : '未锻炼'}
                      </div>
                      {day.exerciseCompleted && day.exerciseMinutes > 0 && (
                        <div className="text-[10px] text-neutral-500 font-mono">
                          {day.exerciseMinutes} min
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reading Item */}
                  <div className="text-xs py-1 flex items-start gap-1">
                    {day.readingCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-neutral-300 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-neutral-800 text-[11px]">
                        {day.readingCompleted ? day.readingBook || '读书' : '未读书'}
                      </div>
                      {day.readingCompleted && day.readingPages > 0 && (
                        <div className="text-[10px] text-neutral-500 font-mono">
                          {day.readingPages} 页
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px]">
                  <span className="text-neutral-400">达成率</span>
                  <span className="font-mono font-bold text-neutral-700">
                    {day.completionRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI & Smart Summary Review Section */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-neutral-900 text-sm">
                智能习惯复盘与深度建议
              </h3>
            </div>

            <div className="flex items-center gap-2 no-print">
              <button
                onClick={handleGenerateAiReview}
                disabled={isLoadingAi}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isLoadingAi ? 'AI 正在深度思考...' : '✨ 生成 AI 教练深度点评'}</span>
              </button>
            </div>
          </div>

          {aiError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              {aiError}
            </div>
          )}

          {/* Report Content */}
          <div className="prose prose-sm max-w-none text-neutral-700 text-xs sm:text-sm leading-relaxed space-y-3 bg-white p-4 rounded-lg border border-neutral-200">
            {aiReview ? (
              <div className="whitespace-pre-line font-normal">{aiReview}</div>
            ) : (
              <div className="whitespace-pre-line font-normal">{localSummary}</div>
            )}
          </div>
        </div>

        {/* User Weekly Reflection Note */}
        <div className="border border-neutral-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-neutral-600" />
              个人每周心得与深度反思 (周总结)
            </h4>
            <div className="flex items-center gap-2 no-print">
              {saveStatus && (
                <span className="text-xs text-emerald-600 font-medium">已保存</span>
              )}
              <button
                onClick={handleSaveReflection}
                className="px-3 py-1 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                保存随笔
              </button>
            </div>
          </div>

          <textarea
            rows={4}
            placeholder="写下本周你最满意的一个瞬间、心态变化、读到的触动句子，或下周想要调整的生活节奏..."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>
    </div>
  );
};
