import { DailyRecord, HabitDefinition } from '../types';
import { addDays, formatDateString, getTodayString } from './dateUtils';

const STORAGE_KEYS = {
  HABITS: 'rili_habits_v2',
  RECORDS: 'rili_records_v4',
  WEEKLY_REVIEWS: 'rili_weekly_reviews_v1',
  PROFILE: 'rili_profile_v1',
};

export interface UserProfile {
  userName: string;
  avatarUrl: string;
  motto: string;
}

export const DEFAULT_PROFILE: UserProfile = {
  userName: '日砺者',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  motto: '日砺一寸，终成千里',
};

export const DEFAULT_HABITS: HabitDefinition[] = [
  {
    id: 'habit_exercise',
    name: '每日锻炼',
    category: 'exercise',
    unit: '次',
    defaultTarget: 1,
    iconName: 'Activity',
    description: '每日坚持身体锻炼 (周日固定为休息日)',
    enabled: true,
    color: '#10B981', // Emerald
  },
  {
    id: 'habit_reading',
    name: '每日读书',
    category: 'reading',
    unit: '次',
    defaultTarget: 1,
    iconName: 'BookOpen',
    description: '每日沉浸读书打卡',
    enabled: true,
    color: '#3B82F6', // Blue
  },
];

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}

/**
 * Return clean empty records by default (no pre-filled fake data)
 */
export function generateSeedRecords(_todayStr?: string): Record<string, DailyRecord> {
  return {};
}

export function loadHabits(): HabitDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(DEFAULT_HABITS));
      return DEFAULT_HABITS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load habits from localStorage', e);
  }
  return DEFAULT_HABITS;
}

export function saveHabits(habits: HabitDefinition[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  } catch (e) {
    console.error('Failed to save habits', e);
  }
}

export function loadDailyRecords(): Record<string, DailyRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load records from localStorage', e);
  }
  return {};
}

export function saveDailyRecords(records: Record<string, DailyRecord>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    // Asynchronously sync to backend database
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    }).catch(() => {
      // Offline or server down: localStorage remains safe
    });
  } catch (e) {
    console.error('Failed to save records', e);
  }
}

export async function syncFromServer(): Promise<{
  records?: Record<string, DailyRecord>;
  habits?: HabitDefinition[];
} | null> {
  try {
    const res = await fetch('/api/db');
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch {
    // Ignore network failure
  }
  return null;
}

export function resetToDemoData(): void {
  localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(DEFAULT_HABITS));
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify({}));
  localStorage.removeItem(STORAGE_KEYS.WEEKLY_REVIEWS);
  fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ habits: DEFAULT_HABITS, records: {}, weeklyReviews: {} }),
  }).catch(() => {});
}

export function getDailyRecord(dateStr: string, records: Record<string, DailyRecord>): DailyRecord {
  if (records[dateStr]) {
    return records[dateStr];
  }
  return {
    date: dateStr,
    habits: {
      habit_exercise: {
        completed: false,
        value: 0,
      },
      habit_reading: {
        completed: false,
        value: 0,
      },
    },
    dailyNote: '',
    mood: undefined,
  };
}

export interface WeeklyReviewStorage {
  reflection?: string;
  aiReview?: string;
  savedAt?: string;
}

export function loadWeeklyReviews(): Record<string, WeeklyReviewStorage> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WEEKLY_REVIEWS);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load weekly reviews', e);
    return {};
  }
}

export function saveWeeklyReview(
  weekStart: string,
  review: { reflection?: string; aiReview?: string }
): void {
  try {
    const all = loadWeeklyReviews();
    all[weekStart] = {
      ...all[weekStart],
      ...review,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.WEEKLY_REVIEWS, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to save weekly review', e);
  }
}

export function exportDataAsJSON(): string {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    habits: loadHabits(),
    records: loadDailyRecords(),
    weeklyReviews: loadWeeklyReviews(),
  };
  return JSON.stringify(data, null, 2);
}

export function importDataFromJSON(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.records && parsed.habits) {
      saveHabits(parsed.habits);
      saveDailyRecords(parsed.records);
      if (parsed.weeklyReviews) {
        localStorage.setItem(STORAGE_KEYS.WEEKLY_REVIEWS, JSON.stringify(parsed.weeklyReviews));
      }
      return true;
    }
  } catch (e) {
    console.error('Failed to import JSON data', e);
  }
  return false;
}
