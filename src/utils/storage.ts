import { DailyRecord, HabitDefinition } from '../types';
import { addDays, formatDateString, getTodayString } from './dateUtils';

const STORAGE_KEYS = {
  HABITS: 'rili_habits_v2',
  RECORDS: 'rili_records_v2',
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
 * Generate rich, realistic seed records for the past 30 days
 */
export function generateSeedRecords(todayStr: string): Record<string, DailyRecord> {
  const records: Record<string, DailyRecord> = {};

  const exerciseSamples = [
    { type: '晨跑', mins: 35, note: '公园晨跑 5.2km，心率平稳，晨风清爽', intensity: 'moderate' as const },
    { type: '力量训练', mins: 50, note: '胸肌与三头训练：平板卧推 4组 + 双杠臂屈伸 3组', intensity: 'intense' as const },
    { type: '瑜伽拉伸', mins: 30, note: '全身深层筋膜放松，下背部酸痛明显改善', intensity: 'light' as const },
    { type: '户外骑行', mins: 60, note: '滨河绿道骑行 18km，中途冲刺2组', intensity: 'intense' as const },
    { type: '力量训练', mins: 45, note: '背部与二头训练：高位下拉 + 引体向上 + 杠铃划船', intensity: 'moderate' as const },
    { type: '夜跑', mins: 40, note: '晚间慢跑 6km，配速 5分45秒', intensity: 'moderate' as const },
    { type: 'HIIT有氧', mins: 25, note: '波比跳 + 开合跳高强度间歇，出汗极爽', intensity: 'intense' as const },
  ];

  const bookSamples = [
    { book: '《原子习惯》', pages: 28, mins: 40, note: '“造就成功的不是单次巨变，而是微小习惯的复利效应。”' },
    { book: '《纳瓦尔宝典》', pages: 35, mins: 45, note: '“用头脑赚钱，而不是用时间赚钱。培养不可替代的专长。”' },
    { book: '《被讨厌的勇气》', pages: 22, mins: 35, note: '阿德勒心理学：课题分离是人际关系的解药，活在当下。' },
    { book: '《原则》', pages: 30, mins: 50, note: '“痛苦 + 反思 = 进步”。极度求真，极度透明。' },
    { book: '《置身事内》', pages: 26, mins: 40, note: '中国地方政府与经济发展逻辑分析，视野非常开阔。' },
    { book: '《芯片简史》', pages: 20, mins: 30, note: '半导体集成电路的发展史，工程师的极致浪漫。' },
  ];

  // Populate records from 28 days ago to today
  for (let offset = -28; offset <= 0; offset++) {
    const curDate = addDays(todayStr, offset);
    // Pattern: 5-6 days completed per week, 1-2 rest days
    const dayOfWeek = (offset + 28) % 7;
    const isRestDay = dayOfWeek === 6 && offset < -2; // Rest on some Sundays

    const exSample = exerciseSamples[(offset + 50) % exerciseSamples.length];
    const bkSample = bookSamples[(offset + 50) % bookSamples.length];

    if (offset === 0) {
      // Today: exercise done, reading partially done or ready to check
      records[curDate] = {
        date: curDate,
        habits: {
          habit_exercise: {
            completed: true,
            value: 45,
            duration: 45,
            subType: '力量训练',
            notes: '肩部推举 + 侧平举，状态饱满',
            intensity: 'moderate',
          },
          habit_reading: {
            completed: true,
            value: 26,
            duration: 35,
            subType: '《纳瓦尔宝典》',
            notes: '读完关于判断力与杠杆的章节，醍醐灌顶',
          },
        },
        dailyNote: '新的一周状态绝佳，锻炼和阅读均已按时完成！',
        mood: 5,
        updatedAt: new Date().toISOString(),
      };
    } else if (isRestDay) {
      // Rest day: reading done, exercise skipped
      records[curDate] = {
        date: curDate,
        habits: {
          habit_exercise: {
            completed: false,
            value: 0,
            duration: 0,
            notes: '主动休息日，身体恢复放松',
          },
          habit_reading: {
            completed: true,
            value: bkSample.pages,
            duration: bkSample.mins,
            subType: bkSample.book,
            notes: bkSample.note,
          },
        },
        dailyNote: '周末主动充能，安心阅读与休整。',
        mood: 4,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Normal productive day: both completed
      records[curDate] = {
        date: curDate,
        habits: {
          habit_exercise: {
            completed: true,
            value: exSample.mins,
            duration: exSample.mins,
            subType: exSample.type,
            notes: exSample.note,
            intensity: exSample.intensity,
          },
          habit_reading: {
            completed: true,
            value: bkSample.pages,
            duration: bkSample.mins,
            subType: bkSample.book,
            notes: bkSample.note,
          },
        },
        dailyNote: '按部就班，专注当下。',
        mood: offset % 3 === 0 ? 5 : 4,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  return records;
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
  const todayStr = getTodayString();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!raw) {
      const seed = generateSeedRecords(todayStr);
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load records from localStorage', e);
  }
  const fallback = generateSeedRecords(todayStr);
  return fallback;
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

export function getDailyRecord(dateStr: string, records: Record<string, DailyRecord>): DailyRecord {
  if (records[dateStr]) {
    return records[dateStr];
  }
  return {
    date: dateStr,
    habits: {},
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

export function resetToDemoData(): void {
  const todayStr = getTodayString();
  const seed = generateSeedRecords(todayStr);
  localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(DEFAULT_HABITS));
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(seed));
  localStorage.removeItem(STORAGE_KEYS.WEEKLY_REVIEWS);
}
