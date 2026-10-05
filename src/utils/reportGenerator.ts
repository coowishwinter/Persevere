import { DailyRecord, DayBreakdown, HabitDefinition, MonthlyStats, WeeklyStats } from '../types';
import { addDays, getChineseDayOfWeek, getMonthCalendarGrid, getTodayString, parseDateString } from './dateUtils';

export function calculateWeeklyStats(
  weekStart: string,
  records: Record<string, DailyRecord>,
  habits: HabitDefinition[]
): WeeklyStats {
  const enabledHabits = habits.filter((h) => h.enabled);
  const days: DayBreakdown[] = [];
  const todayStr = getTodayString();

  let totalPossibleChecks = 0;
  let totalCompletedChecks = 0;
  let exerciseDays = 0;
  let totalExerciseMinutes = 0;
  let readingDays = 0;
  let totalReadingMinutes = 0;
  let totalReadingPages = 0;

  let currentStreak = 0;
  let longestStreakInWeek = 0;

  for (let i = 0; i < 7; i++) {
    const curDate = addDays(weekStart, i);
    const dayOfWeek = getChineseDayOfWeek(curDate);
    const isToday = curDate === todayStr;
    const isFuture = curDate > todayStr;

    const record = records[curDate];
    const exerciseHabit = record?.habits?.['habit_exercise'];
    const readingHabit = record?.habits?.['habit_reading'];

    const exerciseCompleted = !!exerciseHabit?.completed;
    const exerciseMinutes = exerciseHabit?.duration || exerciseHabit?.value || 0;
    const exerciseType = exerciseHabit?.subType;
    const exerciseNotes = exerciseHabit?.notes;

    const readingCompleted = !!readingHabit?.completed;
    const readingMinutes = readingHabit?.duration || 0;
    const readingPages = readingHabit?.value || 0;
    const readingBook = readingHabit?.subType;
    const readingNotes = readingHabit?.notes;

    let completedHabitsCount = 0;
    let customCompletedCount = 0;

    if (record?.habits) {
      for (const habit of enabledHabits) {
        if (record.habits[habit.id]?.completed) {
          completedHabitsCount++;
          if (habit.category === 'custom') {
            customCompletedCount++;
          }
        }
      }
    }

    if (!isFuture) {
      totalPossibleChecks += enabledHabits.length;
      totalCompletedChecks += completedHabitsCount;

      if (exerciseCompleted) {
        exerciseDays++;
        totalExerciseMinutes += exerciseMinutes;
      }

      if (readingCompleted) {
        readingDays++;
        totalReadingMinutes += readingMinutes;
        totalReadingPages += readingPages;
      }

      if (completedHabitsCount > 0) {
        currentStreak++;
        if (currentStreak > longestStreakInWeek) {
          longestStreakInWeek = currentStreak;
        }
      } else {
        currentStreak = 0;
      }
    }

    const dayRate = enabledHabits.length > 0 ? Math.round((completedHabitsCount / enabledHabits.length) * 100) : 0;

    days.push({
      date: curDate,
      dayOfWeek,
      dayName: `${curDate.slice(5)} ${dayOfWeek}`,
      isToday,
      isFuture,
      exerciseCompleted,
      exerciseMinutes,
      exerciseType,
      exerciseNotes,
      readingCompleted,
      readingMinutes,
      readingPages,
      readingBook,
      readingNotes,
      customCompletedCount,
      totalEnabledHabits: enabledHabits.length,
      completedHabitsCount,
      completionRate: dayRate,
    });
  }

  const completionRate = totalPossibleChecks > 0 ? Math.round((totalCompletedChecks / totalPossibleChecks) * 100) : 0;

  const d = parseDateString(weekStart);
  return {
    weekStart,
    weekEnd: addDays(weekStart, 6),
    weekNumber: 1, // Will be overridden or displayed via context
    year: d.getFullYear(),
    totalPossibleChecks,
    totalCompletedChecks,
    completionRate,
    exerciseDays,
    totalExerciseMinutes,
    readingDays,
    totalReadingMinutes,
    totalReadingPages,
    longestStreakInWeek,
    days,
  };
}

export function generateLocalSmartSummary(stats: WeeklyStats): string {
  const { completionRate, exerciseDays, readingDays, totalExerciseMinutes, totalReadingPages, totalReadingMinutes } = stats;

  let assessment = '';
  if (completionRate >= 85) {
    assessment = '🌟 **卓越执行力**：本周计划完成度极高，自律节奏非常稳健，身心状态处于高能循环。';
  } else if (completionRate >= 65) {
    assessment = '💪 **稳步向前**：保持了良好的基本盘，核心习惯基本落实，有微小波动属正常身体周期。';
  } else if (completionRate >= 40) {
    assessment = '🌱 **蓄力调整期**：部分打卡受琐事或精力影响有所间断，建议通过降低启动阻力重新找回节奏。';
  } else {
    assessment = '⚡ **亟待破局**：本周习惯执行遇到挑战，建议从每天5分钟微习惯重启，勿求完美先求开始。';
  }

  const exerciseHours = (totalExerciseMinutes / 60).toFixed(1);
  const exerciseInsight = exerciseDays >= 4
    ? `累计锻炼 **${exerciseDays} 天** / **${exerciseHours} 小时**。运动频率达到世卫组织推荐的高效健康基准，力量与心肺机能得到稳固提升。`
    : `累计锻炼 **${exerciseDays} 天** / **${exerciseHours} 小时**。建议安排固定运动时刻（如晨起或下班后即刻换鞋），减少意志力消耗。`;

  const readingInsight = readingDays >= 4
    ? `累计阅读 **${readingDays} 天**，共吸收 **${totalReadingPages} 页**（约 ${totalReadingMinutes} 分钟）。知识输入连续性极佳，阅读专注力已形成心流惯性。`
    : `本周阅读 **${readingDays} 天**，完成 **${totalReadingPages} 页**。建议采用“随身书本+睡前15分钟断网阅读”法，轻松拾起碎片知识。`;

  return `### 📊 本周执行复盘
${assessment}

- **锻炼表现**：${exerciseInsight}
- **阅读表现**：${readingInsight}

### 💡 下周精进建议
1. **锚定效应**：将运动或阅读绑定在日常必然发生的事件之后（例如“吃完晚饭后即刻阅读20分钟”）。
2. **两分钟法则**：不想动时告诉自己“只做2分钟俯卧撑或只读2页”，消除心理阻抗。
3. **周末防滑坡**：周末提前规划充能与恢复时段，避免生活节律产生巨大落差。`;
}

export function calculateMonthlyStats(
  year: number,
  month: number,
  records: Record<string, DailyRecord>,
  habits: HabitDefinition[]
): MonthlyStats {
  const enabledHabits = habits.filter((h) => h.enabled);
  const totalDays = new Date(year, month, 0).getDate();
  const todayStr = getTodayString();

  let activeDays = 0;
  let perfectDays = 0;
  let totalPossible = 0;
  let totalCompleted = 0;

  let exerciseDays = 0;
  let totalExerciseMinutes = 0;
  let readingDays = 0;
  let totalReadingMinutes = 0;
  let totalReadingPages = 0;

  const exerciseTypeStats: Record<string, number> = {};
  const booksSet = new Set<string>();

  // Day of week trackers (0: Sun, 1: Mon, ... 6: Sat)
  const dayOfWeekTracker = [
    { day: '周一', total: 0, completed: 0, rate: 0 },
    { day: '周二', total: 0, completed: 0, rate: 0 },
    { day: '周三', total: 0, completed: 0, rate: 0 },
    { day: '周四', total: 0, completed: 0, rate: 0 },
    { day: '周五', total: 0, completed: 0, rate: 0 },
    { day: '周六', total: 0, completed: 0, rate: 0 },
    { day: '周日', total: 0, completed: 0, rate: 0 },
  ];

  // Week buckets
  const weeklyBuckets: { [key: number]: { total: number; completed: number; exMins: number; rdMins: number } } = {
    1: { total: 0, completed: 0, exMins: 0, rdMins: 0 },
    2: { total: 0, completed: 0, exMins: 0, rdMins: 0 },
    3: { total: 0, completed: 0, exMins: 0, rdMins: 0 },
    4: { total: 0, completed: 0, exMins: 0, rdMins: 0 },
    5: { total: 0, completed: 0, exMins: 0, rdMins: 0 },
  };

  let maxStreak = 0;
  let currentStreakCounter = 0;

  for (let d = 1; d <= totalDays; d++) {
    const curDate = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isFuture = curDate > todayStr;
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeekIdx = (dateObj.getDay() + 6) % 7; // 0=Mon, 6=Sun
    const weekBucketIdx = Math.min(Math.ceil(d / 7), 5);

    const record = records[curDate];
    let dayCompletedCount = 0;

    if (!isFuture) {
      totalPossible += enabledHabits.length;
      dayOfWeekTracker[dayOfWeekIdx].total += enabledHabits.length;
      weeklyBuckets[weekBucketIdx].total += enabledHabits.length;
    }

    if (record?.habits) {
      for (const h of enabledHabits) {
        if (record.habits[h.id]?.completed) {
          dayCompletedCount++;
        }
      }

      const ex = record.habits['habit_exercise'];
      if (ex?.completed) {
        exerciseDays++;
        const mins = ex.duration || ex.value || 0;
        totalExerciseMinutes += mins;
        weeklyBuckets[weekBucketIdx].exMins += mins;
        const type = ex.subType || '日常锻炼';
        exerciseTypeStats[type] = (exerciseTypeStats[type] || 0) + 1;
      }

      const rd = record.habits['habit_reading'];
      if (rd?.completed) {
        readingDays++;
        const mins = rd.duration || 0;
        const pages = rd.value || 0;
        totalReadingMinutes += mins;
        totalReadingPages += pages;
        weeklyBuckets[weekBucketIdx].rdMins += mins;
        if (rd.subType) {
          booksSet.add(rd.subType);
        }
      }
    }

    if (!isFuture) {
      totalCompleted += dayCompletedCount;
      dayOfWeekTracker[dayOfWeekIdx].completed += dayCompletedCount;
      weeklyBuckets[weekBucketIdx].completed += dayCompletedCount;

      if (dayCompletedCount > 0) {
        activeDays++;
        currentStreakCounter++;
        if (currentStreakCounter > maxStreak) {
          maxStreak = currentStreakCounter;
        }
      } else {
        currentStreakCounter = 0;
      }

      if (enabledHabits.length > 0 && dayCompletedCount >= enabledHabits.length) {
        perfectDays++;
      }
    }
  }

  // Calculate day of week rates
  for (const item of dayOfWeekTracker) {
    item.rate = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
  }

  // Weekly breakdown
  const weeklyBreakdown = Object.entries(weeklyBuckets)
    .filter(([, val]) => val.total > 0)
    .map(([weekNum, val]) => ({
      weekLabel: `第 ${weekNum} 周`,
      completionRate: Math.round((val.completed / val.total) * 100),
      exerciseMins: val.exMins,
      readingMins: val.rdMins,
    }));

  const pastDaysCount = Math.min(
    totalDays,
    todayStr.startsWith(`${year}-${String(month).padStart(2, '0')}`)
      ? Number(todayStr.split('-')[2])
      : totalDays
  );

  const overallCompletionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  const exerciseCompletionRate = pastDaysCount > 0 ? Math.round((exerciseDays / pastDaysCount) * 100) : 0;
  const readingCompletionRate = pastDaysCount > 0 ? Math.round((readingDays / pastDaysCount) * 100) : 0;

  return {
    year,
    month,
    monthTitle: `${year}年${month}月`,
    totalDays,
    activeDays,
    perfectDays,
    overallCompletionRate,
    exerciseDays,
    totalExerciseMinutes,
    exerciseCompletionRate,
    readingDays,
    totalReadingMinutes,
    totalReadingPages,
    readingCompletionRate,
    bestStreak: maxStreak,
    currentStreak: currentStreakCounter,
    dayOfWeekCounts: dayOfWeekTracker,
    weeklyBreakdown,
    exerciseTypeStats,
    booksRead: Array.from(booksSet),
  };
}
