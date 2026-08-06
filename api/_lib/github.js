// GitHub 数据层：用户信息 / 贡献日历 / 仓库统计。
// 数据源优先级：api.github.com（必达）→ jogruber 贡献 API（主）→ github.com 贡献页（备选）
import { cachedFetch } from './cache.js';

const GH_API = 'https://api.github.com';
const UA = { 'User-Agent': 'xianxia-profile/1.0' };

/** 用户信息（created_at 驱动境界） */
export async function getUser(username) {
  const text = await cachedFetch(`user:${username}`, `${GH_API}/users/${username}`, 12 * 3600e3, UA);
  return JSON.parse(text);
}

/**
 * 贡献日历 → [{ date: 'YYYY-MM-DD', count, level }]，按日期正序。
 * 主源：github-contributions-api.jogruber.de；备选：github.com 贡献页；失败返回 null。
 */
export async function getContributions(username) {
  try {
    const text = await cachedFetch(
      `contrib:${username}`,
      `https://github-contributions-api.jogruber.de/v4/${username}`,
      30 * 60e3,
      UA,
    );
    const json = JSON.parse(text);
    if (Array.isArray(json.contributions) && json.contributions.length) {
      return json.contributions.map((c) => ({
        date: c.date,
        count: Number(c.count) || 0,
        level: Number(c.level) || 0,
      }));
    }
  } catch { /* 落到备选源 */ }

  try {
    const html = await cachedFetch(
      `contrib-html:${username}`,
      `https://github.com/users/${username}/contributions`,
      30 * 60e3,
      { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36', Accept: 'text/html' },
    );
    const out = [];
    const rectRe = /<rect[^>]*>/g;
    for (const m of html.matchAll(rectRe)) {
      const tag = m[0];
      const date = tag.match(/data-date="([^"]+)"/)?.[1];
      const level = tag.match(/data-level="(\d)"/)?.[1];
      if (!date || level == null) continue;
      const count = tag.match(/data-count="(\d+)"/)?.[1];
      out.push({ date, count: Number(count) || (Number(level) > 0 ? 1 : 0), level: Number(level) });
    }
    if (out.length) return out;
  } catch { /* 返回 null，由调用方降级 */ }
  return null;
}

/** 仓库统计（前 100）：语言分布 + Star 总数 + 洞府数量 */
export async function getRepos(username) {
  const text = await cachedFetch(
    `repos:${username}`,
    `${GH_API}/users/${username}/repos?per_page=100&sort=updated`,
    60 * 60e3,
    UA,
  );
  const repos = JSON.parse(text);
  if (!Array.isArray(repos)) return null;
  const langs = new Map();
  let stars = 0;
  for (const r of repos) {
    stars += r.stargazers_count || 0;
    if (r.language) langs.set(r.language, (langs.get(r.language) || 0) + 1);
  }
  const topLangs = [...langs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  return { stars, repos: repos.length, topLangs };
}
