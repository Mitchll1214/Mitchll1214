// 统一时区工具：所有日期计算基于北京时间（Asia/Shanghai, UTC+8）。
// 解决 GitHub Actions（UTC 环境）与用户实际时区不一致导致的数据偏差。
//
// 核心问题：
//   - GitHub Actions 运行在 UTC 环境，`new Date().toISOString()` 返回 UTC 时间
//   - 北京时间 00:00~07:59 期间，UTC 的"今天"实际是北京的"昨天"
//   - 所有涉及"今日""昨日""近30日""近一年"的计算必须统一时区

const TZ = 'Asia/Shanghai';

/** 获取北京时间当前时间（Date 对象，内部仍是 UTC 时间戳，但日期/小时按北京时区解读） */
export function nowBJ() {
  return new Date();
}

/**
 * 将 Date 格式化为 YYYY-MM-DD 日期字符串（北京时间）。
 * 替代 `d.toISOString().slice(0,10)`（UTC 日期）。
 */
export function fmtDate(d = new Date()) {
  // 使用 Intl.DateTimeFormat 精确获取北京时间的日期
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  // en-CA locale 输出格式为 "YYYY-MM-DD"
  return parts;
}

/**
 * 获取北京时间"今天"的日期字符串（YYYY-MM-DD）。
 * 替代 `new Date().toISOString().slice(0,10)`。
 */
export function todayStr() {
  return fmtDate(new Date());
}

/**
 * 获取北京时间"今天"往前偏移 offset 天的日期字符串。
 * offset=0 → 今天，offset=1 → 昨天，offset=29 → 29 天前。
 */
export function dateStrOffset(offset) {
  const now = new Date();
  // 获取北京时间的年月日
  const bjParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const [y, m, d] = bjParts.split('-').map(Number);
  // 用 UTC 构造日期再偏移，避免本地时区干扰
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() - offset);
  return base.toISOString().slice(0, 10);
}

/**
 * 获取北京时间的当前小时（0-23）。
 * 用于判断是否在特定时间段执行逻辑。
 */
export function hourBJ() {
  return Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    hour12: false,
  }).format(new Date()));
}

/**
 * 获取北京时间的当前时间字符串（HH:MM，24 小时制）。
 * 用于卡片"更新于"标签。
 */
export function timeStrBJ() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

/**
 * 获取北京时间的完整日期时间字符串（MM-DD HH:MM）。
 * 用于卡片"更新于"标签。
 */
export function dateTimeStrBJ() {
  const now = new Date();
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    month: '2-digit',
    day: '2-digit',
  }).format(now).replace('-', '-');
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);
  return `${date} ${time}`;
}
