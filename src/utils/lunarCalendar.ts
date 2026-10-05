/**
 * Lunar Calendar, 24 Solar Terms & Holidays Utility
 */

// 24 Solar terms approximate dates (month 1-12, day)
const SOLAR_TERMS: { name: string; month: number; day: number }[] = [
  { name: '小寒', month: 1, day: 5 },
  { name: '大寒', month: 1, day: 20 },
  { name: '立春', month: 2, day: 4 },
  { name: '雨水', month: 2, day: 19 },
  { name: '惊蛰', month: 3, day: 5 },
  { name: '春分', month: 3, day: 20 },
  { name: '清明', month: 4, day: 4 },
  { name: '谷雨', month: 4, day: 20 },
  { name: '立夏', month: 5, day: 5 },
  { name: '小满', month: 5, day: 21 },
  { name: '芒种', month: 6, day: 5 },
  { name: '夏至', month: 6, day: 21 },
  { name: '小暑', month: 7, day: 7 },
  { name: '大暑', month: 7, day: 22 },
  { name: '立秋', month: 8, day: 7 },
  { name: '处暑', month: 8, day: 23 },
  { name: '白露', month: 9, day: 7 },
  { name: '秋分', month: 9, day: 23 },
  { name: '寒露', month: 10, day: 8 },
  { name: '霜降', month: 10, day: 23 },
  { name: '立冬', month: 11, day: 7 },
  { name: '小雪', month: 11, day: 22 },
  { name: '大雪', month: 12, day: 7 },
  { name: '冬至', month: 12, day: 21 },
];

const LUNAR_MONTH_NAMES = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月',
];

const LUNAR_DAY_NAMES = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
];

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const SHENGXIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

// Public holidays (Gregorian MM-DD)
const GREGORIAN_HOLIDAYS: Record<string, string> = {
  '01-01': '元旦',
  '03-08': '妇女节',
  '05-01': '劳动节',
  '05-04': '青年节',
  '06-01': '儿童节',
  '09-10': '教师节',
  '10-01': '国庆节',
  '10-02': '国庆假期',
  '10-03': '国庆假期',
  '10-04': '国庆假期',
  '10-05': '国庆假期',
  '10-06': '国庆假期',
  '10-07': '国庆假期',
};

// Year 2026 Lunar Calendar lookup Anchor:
// 2026-02-17 is Lunar 2026-01-01 (丙午马年 正月初一)
const ANCHOR_2026 = {
  date: new Date(2026, 1, 17), // Feb 17, 2026
  lunarYear: 2026,
};

// 2026 Lunar Month lengths (approx standard)
const LUNAR_MONTH_DAYS_2026 = [30, 29, 30, 29, 29, 30, 29, 30, 29, 30, 30, 29];

export interface LunarDateInfo {
  lunarYearName: string; // e.g. 丙午马年
  lunarMonthName: string; // e.g. 八月
  lunarDayName: string; // e.g. 廿五
  lunarFullString: string; // e.g. 农历八月廿五
  solarTerm?: string; // e.g. 寒露
  holiday?: string; // e.g. 国庆假期
}

export function getLunarInfo(dateStr: string): LunarDateInfo {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const targetDate = new Date(year, month - 1, day);

  // 1. Holiday lookup
  const mmdd = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const holiday = GREGORIAN_HOLIDAYS[mmdd];

  // 2. Solar Term lookup (checks within +/- 1 day)
  let solarTerm: string | undefined;
  for (const term of SOLAR_TERMS) {
    if (term.month === month && Math.abs(term.day - day) <= 1) {
      solarTerm = term.day === day ? term.name : `${term.name}${day < term.day ? '前夕' : ''}`;
      break;
    }
  }

  // 3. Approximate Lunar calculation
  // Base anchor 2026-02-17 = 正月初一
  const diffDays = Math.round(
    (targetDate.getTime() - ANCHOR_2026.date.getTime()) / (1000 * 3600 * 24)
  );

  let lMonth = 0;
  let lDay = 1;
  let lYear = 2026;

  if (diffDays >= 0) {
    let remaining = diffDays;
    for (let m = 0; m < LUNAR_MONTH_DAYS_2026.length; m++) {
      const daysInMonth = LUNAR_MONTH_DAYS_2026[m];
      if (remaining < daysInMonth) {
        lMonth = m;
        lDay = remaining + 1;
        break;
      }
      remaining -= daysInMonth;
    }
  } else {
    // Before Spring Festival 2026 (Year 2025 Lunar 腊月)
    lYear = 2025;
    lMonth = 11;
    lDay = Math.max(1, 30 + diffDays);
  }

  const ganIdx = (lYear - 4) % 10;
  const zhiIdx = (lYear - 4) % 12;
  const shengxiao = SHENGXIAO[zhiIdx];
  const lunarYearName = `${GAN[ganIdx]}${ZHI[zhiIdx]}${shengxiao}年`;
  const lunarMonthName = LUNAR_MONTH_NAMES[lMonth] || '八月';
  const lunarDayName = LUNAR_DAY_NAMES[lDay - 1] || '廿五';

  return {
    lunarYearName,
    lunarMonthName,
    lunarDayName,
    lunarFullString: `农历${lunarMonthName}${lunarDayName}`,
    solarTerm,
    holiday,
  };
}
