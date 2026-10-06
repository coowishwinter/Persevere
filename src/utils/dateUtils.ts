export function formatDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function getTodayString(): string {
  // Use user's current environment date if available, fallback to now
  const now = new Date();
  return formatDateString(now);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDateString(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateString(d);
}

export function getChineseDayOfWeek(dateStr: string, prefix = '周'): string {
  const d = parseDateString(dateStr);
  const dayIndex = d.getDay(); // 0 is Sunday, 1 is Monday
  const names = ['日', '一', '二', '三', '四', '五', '六'];
  return `${prefix}${names[dayIndex]}`;
}

export function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  const weekday = getChineseDayOfWeek(dateStr, '星期');
  return `${year}年${Number(month)}月${Number(day)}日 ${weekday}`;
}

export function formatShortDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  return `${Number(month)}月${Number(day)}日`;
}

/**
 * Returns Monday to Sunday for the week containing `dateStr`.
 */
export function getWeekRange(dateStr: string): {
  start: string;
  end: string;
  days: string[];
  weekNumber: number;
} {
  const current = parseDateString(dateStr);
  const day = current.getDay(); // 0 is Sunday, 1 is Monday...
  // Diff to Monday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(current);
  monday.setDate(current.getDate() + diffToMonday);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(formatDateString(d));
  }

  // Calculate ISO week number
  const target = new Date(monday);
  const dayNr = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);

  return {
    start: days[0],
    end: days[6],
    days,
    weekNumber,
  };
}

export interface HeatmapDayCell {
  date: string;
  dayOfMonth: number;
  month: number;
  year: number;
  dayOfWeek: number; // 0 Sun, 1 Mon...
  isSunday: boolean;
  isInYear: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export interface HeatmapWeekCol {
  weekIndex: number;
  days: HeatmapDayCell[];
  monthLabel?: string; // e.g. "1月", "2月" when a month starts in this week
}

/**
 * Generate 52-53 weeks of Monday-to-Sunday columns for the whole year
 */
export function getYearPanoramicHeatmap(year: number, todayStr: string): {
  weeks: HeatmapWeekCol[];
  monthLabels: { month: number; label: string; weekIndex: number }[];
} {
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);

  // Start from Monday on or before Jan 1
  const startDayOfWeek = jan1.getDay(); // 0 is Sun
  const padStartDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  const startDate = new Date(year, 0, 1 - padStartDays);

  const weeks: HeatmapWeekCol[] = [];
  const monthLabels: { month: number; label: string; weekIndex: number }[] = [];
  const seenMonths = new Set<number>();

  let curr = new Date(startDate);
  let weekIdx = 0;

  while (curr <= dec31 || curr.getDay() !== 1) {
    const weekDays: HeatmapDayCell[] = [];
    let weekMonthLabel: string | undefined;

    for (let d = 0; d < 7; d++) {
      const dateStr = formatDateString(curr);
      const isSun = curr.getDay() === 0;
      const curMonth = curr.getMonth() + 1;
      const inYear = curr.getFullYear() === year;

      if (inYear && !seenMonths.has(curMonth) && curr.getDate() <= 7) {
        seenMonths.add(curMonth);
        weekMonthLabel = `${curMonth}月`;
        monthLabels.push({ month: curMonth, label: `${curMonth}月`, weekIndex: weekIdx });
      }

      weekDays.push({
        date: dateStr,
        dayOfMonth: curr.getDate(),
        month: curMonth,
        year: curr.getFullYear(),
        dayOfWeek: curr.getDay(),
        isSunday: isSun,
        isInYear: inYear,
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
      });

      curr.setDate(curr.getDate() + 1);
    }

    weeks.push({
      weekIndex: weekIdx,
      days: weekDays,
      monthLabel: weekMonthLabel,
    });
    weekIdx++;

    // Safety brake
    if (weekIdx > 54) break;
  }

  return { weeks, monthLabels };
}

export interface MonthCalendarCell {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
}

/**
 * Get grid cells for month view (Monday start)
 */
export function getMonthCalendarGrid(year: number, month: number, todayStr: string): MonthCalendarCell[] {
  // First day of target month
  const firstDay = new Date(year, month - 1, 1);
  const totalDays = new Date(year, month, 0).getDate();

  // Find Monday before or on firstDay
  const dayOfWeek = firstDay.getDay(); // 0 is Sun
  const padLeft = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // days to pad from prev month

  const cells: MonthCalendarCell[] = [];

  // Previous month days
  for (let i = padLeft; i > 0; i--) {
    const prevDate = new Date(year, month - 1, 1 - i);
    const dateStr = formatDateString(prevDate);
    cells.push({
      date: dateStr,
      dayNumber: prevDate.getDate(),
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    const curDate = new Date(year, month - 1, i);
    const dateStr = formatDateString(curDate);
    cells.push({
      date: dateStr,
      dayNumber: i,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
    });
  }

  // Pad right to fill full 7-day rows (up to 35 or 42 cells)
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const nextDate = new Date(year, month, i);
    const dateStr = formatDateString(nextDate);
    cells.push({
      date: dateStr,
      dayNumber: nextDate.getDate(),
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
    });
  }

  return cells;
}

/**
 * Calculate current consecutive streak up to given date (or yesterday if today not checked)
 */
export function calculateStreaks(
  records: Record<string, { completedHabitsCount: number; totalEnabledHabits: number }>,
  todayStr: string
): { currentStreak: number; maxStreak: number } {
  // Sorted dates
  const dates = Object.keys(records).sort();
  if (dates.length === 0) return { currentStreak: 0, maxStreak: 0 };

  let maxStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of dates) {
    const rec = records[dateStr];
    // Check if at least 1 habit completed or all
    const isCompleted = rec && rec.completedHabitsCount > 0;
    const curD = parseDateString(dateStr);

    if (isCompleted) {
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((curD.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          tempStreak += 1;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      prevDate = curD;
      if (tempStreak > maxStreak) {
        maxStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
      prevDate = null;
    }
  }

  // Calculate current streak counting backwards from today
  let currentStreak = 0;
  let checkDateStr = todayStr;
  const todayRec = records[todayStr];

  // If today is completed, count starting from today
  if (todayRec && todayRec.completedHabitsCount > 0) {
    currentStreak = 1;
    checkDateStr = addDays(todayStr, -1);
  } else {
    // If today is not completed yet, check if yesterday was completed
    checkDateStr = addDays(todayStr, -1);
  }

  while (true) {
    const rec = records[checkDateStr];
    if (rec && rec.completedHabitsCount > 0) {
      currentStreak += 1;
      checkDateStr = addDays(checkDateStr, -1);
    } else {
      break;
    }
  }

  return {
    currentStreak,
    maxStreak: Math.max(maxStreak, currentStreak),
  };
}
