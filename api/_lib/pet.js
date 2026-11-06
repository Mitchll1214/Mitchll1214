// 灵宠系统：活跃度驱动的 Q 版仙狐「小九」。
// 成长阶段 ← 近一年贡献总数；心情/灵力 ← 今日与近 30 日活跃；亲密度 ← 最长连续贡献。
//
// 口径：
//   - 传入 preciseDays（按北京自然日精确统计的 commit 数）时，今日/连续/近30日/闲置天数
//     全部以它为准，避免 GitHub 贡献日历"按 UTC 分日"造成的凌晨错位；
//   - yearTotal 始终取贡献日历的整年求和（展示口径，跨年边界更稳）。
import { todayStr, dateStrOffset } from './tz.js';

/** 贡献数组 → 今日、近30日、连续天数、近一年总数、最近活跃距今天数 */
export function analyzeContributions(list, { now = new Date(), preciseDays = null } = {}) {
  if ((!list || !list.length) && !preciseDays) return null;

  const calendar = new Map((list || []).map((c) => [c.date, c.count]));
  // 精确数据优先：按北京自然日归组的 commit 数
  const get = preciseDays
    ? (offset) => preciseDays.get(dateStrOffset(offset, now)) || 0
    : (offset) => calendar.get(dateStrOffset(offset, now)) || 0;

  let last30 = 0;
  for (let i = 0; i < 30; i++) last30 += get(i);

  // 年度总数直接对日历求和：GitHub 返回的就是近一年，避免与北京日期错位
  let yearTotal = 0;
  for (const c of list || []) yearTotal += c.count || 0;

  const todayCount = get(0);

  // 连续贡献天数（从今天起；今天没贡献则从昨天起算）
  let streak = 0;
  const startOffset = todayCount > 0 ? 0 : 1;
  for (let i = startOffset; i < 366; i++) {
    if (get(i) > 0) streak++;
    else break;
  }

  // 最近一次贡献距今几天（找不到时给一个足够大的值，避免被误判为"今天活跃"）
  let daysIdle = 999;
  for (let i = 0; i < 366; i++) {
    if (get(i) > 0) { daysIdle = i; break; }
  }

  return {
    todayCount,
    last30,
    streak,
    yearTotal,
    daysIdle,
    todayKey: todayStr(now),
    precise: Boolean(preciseDays),
  };
}

/** 阶段（成长度） */
export function stageOf(yearTotal) {
  if (yearTotal >= 500) return { name: '九尾仙狐', min: 500, idx: 4 };
  if (yearTotal >= 200) return { name: '成狐', min: 200, idx: 3 };
  if (yearTotal >= 50) return { name: '青狐', min: 50, idx: 2 };
  if (yearTotal >= 1) return { name: '幼狐', min: 1, idx: 1 };
  return { name: '灵蛋', min: 0, idx: 0 };
}

/** 心情（近期活跃度） */
export function moodOf(a) {
  if (!a) return { key: 'sleep', label: '灵力枯竭 · 陷入沉眠', color: '#9AA3C0' };
  if (a.todayCount > 0) return { key: 'cultivate', label: '静坐吐纳 · 今日有灵气入体 ✨', color: '#8E8CD8' };
  if (a.daysIdle <= 2) return { key: 'hungry', label: '肚中空空 · 渴望灵力投喂', color: '#E0A526' };
  if (a.daysIdle <= 6) return { key: 'drowsy', label: '微微打盹 · 等你归来', color: '#7A9BB5' };
  return { key: 'sleep', label: '陷入沉眠 · 快回来投喂灵力', color: '#9AA3C0' };
}

export function computePet(list, opts = {}) {
  const a = analyzeContributions(list, opts);
  const stage = stageOf(a ? a.yearTotal : 0);
  const mood = moodOf(a);
  const spirit = a ? Math.min(100, Math.round((a.last30 / 15) * 100)) : 0;
  const bond = a ? Math.min(100, Math.round((a.streak / 10) * 100)) : 0;
  return { a, stage, mood, spirit, bond };
}
