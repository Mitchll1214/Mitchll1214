// 灵宠系统：活跃度驱动的 Q 版仙狐「小九」。
// 成长阶段 ← 近一年贡献总数；心情/灵力 ← 今日与近 30 日活跃；亲密度 ← 最长连续贡献。

const DAY = 86400e3;
const fmt = (d) => d.toISOString().slice(0, 10);

/** 贡献数组 → 今日、近30日、连续天数、近一年总数、最近活跃距今天数 */
export function analyzeContributions(list) {
  if (!list || !list.length) return null;
  const map = new Map(list.map((c) => [c.date, c.count]));
  const today = new Date();
  const todayKey = fmt(today);

  let last30 = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(today.getTime() - i * DAY);
    last30 += map.get(fmt(d)) || 0;
  }

  let yearTotal = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getTime() - i * DAY);
    yearTotal += map.get(fmt(d)) || 0;
  }

  const todayCount = map.get(todayKey) || 0;

  // 连续贡献天数（从今天起；今天没贡献则从昨天起算）
  let streak = 0;
  let cursor = new Date(today);
  if (!todayCount) cursor.setDate(cursor.getDate() - 1);
  while ((map.get(fmt(cursor)) || 0) > 0) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
    if (streak > 3650) break;
  }

  // 最近一次贡献距今几天
  let daysIdle = 0;
  for (let i = 0; i < 366; i++) {
    if (map.get(fmt(new Date(today.getTime() - i * DAY)))) { daysIdle = i; break; }
  }

  return { todayCount, last30, streak, yearTotal, daysIdle };
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

export function computePet(list) {
  const a = analyzeContributions(list);
  const stage = stageOf(a ? a.yearTotal : 0);
  const mood = moodOf(a);
  const spirit = a ? Math.min(100, Math.round((a.last30 / 15) * 100)) : 0;
  const bond = a ? Math.min(100, Math.round((a.streak / 10) * 100)) : 0;
  return { a, stage, mood, spirit, bond };
}
