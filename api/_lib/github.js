// GitHub 数据层：全部走 GitHub 官方 API（REST + GraphQL），无任何第三方数据源。
// 数据源优先级：
//   1) GITHUB_TOKEN/GH_TOKEN 环境变量 → GraphQL 贡献日历 + 用户全量统计（GitHub Actions 内）
//   2) 无 token → 匿名 REST（用户/仓库）+ github.com 官方贡献页（本地开发兜底）
import { cachedFetch } from './cache.js';

const GH_API = 'https://api.github.com';
const UA = { 'User-Agent': 'xianxia-profile/1.0' };

export const getToken = () => process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

/** 用户信息（created_at 驱动境界） */
export async function getUser(username) {
  const text = await cachedFetch(`user:${username}`, `${GH_API}/users/${username}`, 12 * 3600e3, UA);
  return JSON.parse(text);
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
  const topLangs = [...langs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  return { stars, repos: repos.length, topLangs };
}

/**
 * GraphQL 一次取全：贡献日历（近一年逐日）+ 用户统计。
 * 返回：{ days:[{date,count}], yearTotal, createdAt, repos, stars, followers, prs, issues, starred }
 */
export async function getGraphQLData(username, token) {
  const query = `query($login: String!) {
    user(login: $login) {
      login
      name
      avatarUrl
      createdAt
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount } }
        }
      }
      repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: {field: UPDATED_AT, direction: DESC}) {
        totalCount
        nodes { stargazerCount primaryLanguage { name } defaultBranchRef { target { ... on Commit { history { totalCount } } } } }
      }
      followers { totalCount }
      pullRequests { totalCount }
      issues { totalCount }
      starredRepositories { totalCount }
    }
  }`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'xianxia-profile/1.0',
    },
    body: JSON.stringify({ query, variables: { login: username } }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL: ${json.errors[0]?.message}`);
  const u = json.data?.user;
  if (!u) throw new Error('GraphQL: user not found');

  const days = [];
  for (const w of u.contributionsCollection.contributionCalendar.weeks) {
    for (const d of w.contributionDays) days.push({ date: d.date, count: d.contributionCount });
  }
  const langs = new Map();
  let stars = 0;
  let totalCommits = 0;
  for (const r of u.repositories.nodes || []) {
    stars += r.stargazerCount || 0;
    if (r.primaryLanguage?.name) langs.set(r.primaryLanguage.name, (langs.get(r.primaryLanguage.name) || 0) + 1);
    totalCommits += r.defaultBranchRef?.target?.history?.totalCount || 0;
  }
  const topLangs = [...langs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  return {
    login: u.login,
    name: u.name,
    avatarUrl: u.avatarUrl,
    days,
    yearTotal: u.contributionsCollection.contributionCalendar.totalContributions,
    totalCommits, // 历史累计提交数（自有仓库 default 分支提交数之和，不含 fork）
    createdAt: u.createdAt,
    repos: u.repositories.totalCount,
    stars,
    topLangs,
    followers: u.followers.totalCount,
    prs: u.pullRequests.totalCount,
    issues: u.issues.totalCount,
    starred: u.starredRepositories.totalCount,
  };
}

/**
 * 贡献日历 → [{ date, count }]（近一年，日期正序）。
 * 有 token 走 GraphQL；无 token 抓 github.com 官方贡献页；失败返回 null。
 */
export async function getContributions(username, token = '') {
  if (token) {
    const data = await getGraphQLData(username, token);
    return data.days;
  }
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
