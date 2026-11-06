// 统一时区工具：所有"自然日"计算基于北京时间（Asia/Shanghai, UTC+8）。
//
// 为什么需要它：
//   - GitHub Actions 运行在 UTC 环境，`toISOString().slice(0,10)` 得到的是 UTC 日期；
//   - GitHub 的贡献日历（contributionCalendar）本身按 UTC 分日；
//   - 二者与用户心中的"今天"（北京自然日）都不一致，导致今日提交数在凌晨时段错位。
//
// 约定：
//   - `dateStr*` / `dayStartBJ` 表达的是**北京自然日**；
//   - 需要与 GitHub 日历格子对齐时，显式使用 `utcDayStr()`，不要混用。

const TZ = 'Asia/Shanghai';
const DAY = 86400e3;

/** 拆出北京时间下的年月日 */
function bjParts(date = new Date()) {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
}

/** 把任意时刻格式化为北京自然日 YYYY-MM-DD */
export function fmtDate(date = new Date()) {
  const { y, m, d } = bjParts(date);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** 北京时间"今天"的日期字符串 */
export function todayStr(now = new Date()) {
  return fmtDate(now);
}

/** 北京时间今天往前偏移 offset 天的日期字符串（offset=1 → 昨天） */
export function dateStrOffset(offset, now = new Date()) {
  const { y, m, d } = bjParts(now);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() - offset);
  return base.toISOString().slice(0, 10);
}

/**
 * 北京自然日某天的起点（Date）。
 * 北京 00:00 = 前一天 UTC 16:00。
 */
export function dayStartBJ(offset = 0, now = new Date()) {
  const key = dateStrOffset(offset, now); // 北京目标日
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, -8));
}

/**
 * 北京自然日的查询窗口（左闭右开）。
 * 用于按时间戳精确统计"北京今天/昨天"的提交。
 */
export function dayRangeBJ(offset = 0, now = new Date()) {
  const from = dayStartBJ(offset, now);
  const to = dayStartBJ(offset - 1, now); // 更早一天 = 窗口右端
  return { dayKey: dateStrOffset(offset, now), from, to };
}

/** UTC 自然日字符串（仅用于对齐 GitHub 贡献日历格子，不要用于"今天"语义） */
export function utcDayStr(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/** 当前北京小时（0-23） */
export function hourBJ(now = new Date()) {
  return Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    hour12: false,
  }).format(now));
}

/** 当前北京时间 HH:MM */
export function timeStrBJ(now = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);
}

/** 当前北京时间 MM-DD HH:MM */
export function dateTimeStrBJ(now = new Date()) {
  const { m, d } = bjParts(now);
  return `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ${timeStrBJ(now)}`;
}

/** 天数常量（毫秒） */
export const MS_PER_DAY = DAY;
