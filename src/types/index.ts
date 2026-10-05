export type HabitCategory = 'exercise' | 'reading' | 'custom';

export interface HabitDefinition {
  id: string;
  name: string;
  category: HabitCategory;
  unit: string;
  defaultTarget: number;
  iconName: string;
  description: string;
  enabled: boolean;
  color: string;
}

export interface HabitEntry {
  completed: boolean;
  value: number; // e.g. minutes for exercise, pages for reading
  duration?: number; // minutes spent
  subType?: string; // e.g. "力量训练", "5km 晨跑", "《原子习惯》"
  notes?: string; // reading quotes, workout details
  intensity?: 'light' | 'moderate' | 'intense';
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  habits: Record<string, HabitEntry>;
  dailyNote?: string;
  mood?: number; // 1-5 rating
  updatedAt?: string;
}

export interface DayBreakdown {
  date: string;
  dayOfWeek: string;
  dayName: string;
  isToday: boolean;
  isFuture: boolean;
  exerciseCompleted: boolean;
  exerciseMinutes: number;
  exerciseType?: string;
  exerciseNotes?: string;
  readingCompleted: boolean;
  readingMinutes: number;
  readingPages: number;
  readingBook?: string;
  readingNotes?: string;
  customCompletedCount: number;
  totalEnabledHabits: number;
  completedHabitsCount: number;
  completionRate: number; // 0 - 100
}

export interface WeeklyStats {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  weekNumber: number;
  year: number;
  totalPossibleChecks: number;
  totalCompletedChecks: number;
  completionRate: number;
  exerciseDays: number;
  totalExerciseMinutes: number;
  readingDays: number;
  totalReadingMinutes: number;
  totalReadingPages: number;
  longestStreakInWeek: number;
  days: DayBreakdown[];
}

export interface MonthlyStats {
  year: number;
  month: number; // 1-12
  monthTitle: string;
  totalDays: number;
  activeDays: number; // at least 1 habit completed
  perfectDays: number; // all enabled habits completed
  overallCompletionRate: number;
  exerciseDays: number;
  totalExerciseMinutes: number;
  exerciseCompletionRate: number;
  readingDays: number;
  totalReadingMinutes: number;
  totalReadingPages: number;
  readingCompletionRate: number;
  bestStreak: number;
  currentStreak: number;
  dayOfWeekCounts: {
    day: string;
    total: number;
    completed: number;
    rate: number;
  }[];
  weeklyBreakdown: {
    weekLabel: string;
    completionRate: number;
    exerciseMins: number;
    readingMins: number;
  }[];
  exerciseTypeStats: Record<string, number>;
  booksRead: string[];
}
