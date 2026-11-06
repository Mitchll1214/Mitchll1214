// GitHub 数据层：全部走 GitHub 官方 API（REST + GraphQL），无任何第三方数据源。
//
// 数据源与权限：
//   1) PROFILE_TOKEN（PAT，recommended）→ 可见私有仓库的 commit / 语言 / Star / PR / Issue
//   2) GITHUB_TOKEN/GH_TOKEN（Actions 内置）→ 只能看到当前仓库 + 公开数据
//   3) 无 token → 匿名 REST + github.com 贡献页（仅本地预览兜底，数据不完整）
//
// 口径说明（重要）：
//   - contributionCalendar 的 date 按 **UTC** 分日，且 contributionCount = commit + issue + PR + review；
//   - "今日提交数""连续天数"必须用 getRecentCommitDays() 按 **北京自然日** 精确统计；
//   - 热力图/年度趋势继续使用 contributionCalendar（展示用，粒度足够）。
import { cachedFetch } from './cache.js';
import { fmtDate, dayStartBJ } from './tz.js';

const GH_API = 'https://api.github.com';
const UA = { 'User-Agent': 'xianxia-profile/1.0' };
const JSON_HEADERS = { Accept: 'application/vnd.github+json', 'User-Agent': 'xianxia-profile/1.0' };

// 仓库归属：自有 + 协作 + 组织成员（包含私有库，需 PAT 权限）
const AFFILIATIONS = 'OWNER, COLLABORATOR, ORGANIZATION_MEMBER';

export const getToken = () => process.env.PROFILE_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

/** 是否使用了具备私有库权限的 PAT（用于在卡片上标注数据范围） */
export const hasProfileToken = () => Boolean(process.env.PROFILE_TOKEN);

/** 用户信息（created_at 驱动境界） */
export async function getUser(username) {
  const text = await cachedFetch(`user:${username}`, `${GH_API}/users/${username}`, 12 * 3600e3, UA);
  return JSON.parse(text);
}

/** 仓库统计（无 token 时的兜底；分页到 300 个仓库） */
export async function getRepos(username) {
  const repos = [];
  for (let page = 1; page <= 3; page++) {
    const text = await cachedFetch(
      `repos:${username}:${page}`,
      `${GH_API}/users/${username}/repos?per_page=100&page=${page}&sort=updated`,
      60 * 60e3,
      UA,
    );
    const batch = JSON.parse(text);
    if (!Array.isArray(batch) || !batch.length) break;
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  if (!repos.length) return null;
  const langs = new Map();
  let stars = 0;
  for (const r of repos) {
    stars += r.stargazers_count || 0;
    if (r.language) langs.set(r.language, (langs.get(r.language) || 0) + 1);
  }
  const topLangs = [...langs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  return { stars, repos: repos.length, topLangs };
}

/** 带超时与一次重试的 GraphQL 请求 */
async function gql(query, variables, token, { timeoutMs = 20000, retries = 1 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${GH_API}/graphql`, {
        method: 'POST',
        headers: { ...JSON_HEADERS, 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
      const json = await res.json();
      if (json.errors?.length) throw new Error(`GraphQL: ${json.errors[0]?.message}`);
      return json.data;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw lastErr;
}

const BASE_USER_QUERY = `query($login: String!) {
  user(login: $login) {
    id
    login
    name
    avatarUrl
    createdAt
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
      restrictedContributionsCount
    }
    repositories(first: 1, ownerAffiliations: [${AFFILIATIONS}]) { totalCount }
    followers { totalCount }
    pullRequests { totalCount }
    issues { totalCount }
    starredRepositories { totalCount }
  }
}`;

const REPO_PAGE_QUERY = `query($login: String!, $after: String) {
  user(login: $login) {
    repositories(first: 100, after: $after, ownerAffiliations: [${AFFILIATIONS}], orderBy: {field: UPDATED_AT, direction: DESC}) {
      pageInfo { hasNextPage endCursor }
      nodes {
        nameWithOwner
        isFork
        isPrivate
        stargazerCount
        primaryLanguage { name }
        defaultBranchRef { target { ... on Commit { history { totalCount } } } }
      }
    }
  }
}`;

const AUTHOR_TOTAL_QUERY = `query($login: String!, $uid: ID!, $after: String) {
  user(login: $login) {
    repositories(first: 50, after: $after, ownerAffiliations: [${AFFILIATIONS}], orderBy: {field: PUSHED_AT, direction: DESC}) {
      pageInfo { hasNextPage endCursor }
      nodes {
        defaultBranchRef { target { ... on Commit { history(author: { id: $uid }) { totalCount } } } }
      }
    }
  }
}`;

/**
 * GraphQL 取全量数据：基础统计 + 贡献日历 + 分页仓库。
 * 返回 object 中 days 为 UTC 日粒度的日历；提交精确统计见 getRecentCommitDays()。
 */
export async function getGraphQLData(username, token) {
  const base = await gql(BASE_USER_QUERY, { login: username }, token);
  const u = base?.user;
  if (!u) throw new Error('GraphQL: user not found');

  const days = [];
  for (const w of u.contributionsCollection.contributionCalendar.weeks) {
    for (const d of w.contributionDays) days.push({ date: d.date, count: d.contributionCount });
  }

  // ── 分页拉取全部仓库（含私有库，取决于 token 权限）──
  const repos = [];
  let after = null;
  for (let page = 0; page < 10; page++) {
    const data = await gql(REPO_PAGE_QUERY, { login: username, after }, token);
    const conn = data?.user?.repositories;
    if (!conn) break;
    repos.push(...(conn.nodes || []));
    if (!conn.pageInfo?.hasNextPage) break;
    after = conn.pageInfo.endCursor;
  }

  const langs = new Map();
  let stars = 0;
  let privateRepos = 0;
  for (const r of repos) {
    if (r.isPrivate) privateRepos++;
    // stars/语言只统计非 fork 仓库（避免 fork 继承上游的 star/语言污染灵根）
    if (r.isFork) continue;
    stars += r.stargazerCount || 0;
    if (r.primaryLanguage?.name) langs.set(r.primaryLanguage.name, (langs.get(r.primaryLanguage.name) || 0) + 1);
  }
  const topLangs = [...langs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  // ── 历史累计提交：仅本人提交（author 过滤，排除 bot），分页累加 ──
  let totalCommits = 0;
  let pagesOk = 0;
  try {
    let cursor = null;
    for (let page = 0; page < 20; page++) {
      const data = await gql(AUTHOR_TOTAL_QUERY, { login: username, uid: u.id, after: cursor }, token);
      const conn = data?.user?.repositories;
      if (!conn) break;
      pagesOk++;
      for (const r of conn.nodes || []) {
        totalCommits += r.defaultBranchRef?.target?.history?.totalCount || 0;
      }
      if (!conn.pageInfo?.hasNextPage) break;
      cursor = conn.pageInfo.endCursor;
    }
  } catch { /* 走降级 */ }

  // 一页都没取到才降级（部分成功仍用作者过滤结果，避免误覆盖为含 bot 的总数）
  if (pagesOk === 0) {
    totalCommits = 0;
    for (const r of repos) totalCommits += r.defaultBranchRef?.target?.history?.totalCount || 0;
  }

  return {
    login: u.login,
    name: u.name,
    avatarUrl: u.avatarUrl,
    days,
    // UTC 日历口径：含 commit/issue/PR/review，仅用于趋势与年度展示
    yearTotal: u.contributionsCollection.contributionCalendar.totalContributions,
    restrictedContributions: u.contributionsCollection.restrictedContributionsCount || 0,
    totalCommits, // 历史累计（本人提交，默认分支，含 fork 仓库）
    createdAt: u.createdAt,
    repos: repos.length || u.repositories.totalCount,
    repoTotal: u.repositories.totalCount,
    privateRepos,
    stars,
    topLangs,
    followers: u.followers.totalCount,
    prs: u.pullRequests.totalCount,
    issues: u.issues.totalCount,
    starred: u.starredRepositories.totalCount,
  };
}

/**
 * 按 **北京自然日** 精确统计最近的提交数（纯 commit，不含 issue/PR/review）。
 * 使用 REST Search Commits（committer-date 窗口），可覆盖 token 有权访问的私有库。
 *
 * @returns Map<'YYYY-MM-DD'(北京), number> | null
 */
export async function getRecentCommitDays(username, token, { daysBack = 90, now = new Date() } = {}) {
  if (!token) return null;
  // 从 daysBack-1 天前的北京 00:00 开始（保证近 90 个自然日完整）
  const since = dayStartBJ(daysBack - 1, now).toISOString();
  const q = `author:${username} committer-date:>=${since}`;
  const byDay = new Map();
  let seen = 0;

  for (let page = 1; page <= 10; page++) {
    const url = `${GH_API}/search/commits?q=${encodeURIComponent(q)}&per_page=100&page=${page}&sort=committer-date&order=desc`;
    const res = await fetch(url, { headers: { ...JSON_HEADERS, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`Search commits HTTP ${res.status}`);
    const json = await res.json();
    const items = json.items || [];
    for (const it of items) {
      const iso = it.commit?.committer?.date || it.commit?.author?.date;
      if (!iso) continue;
      const key = fmtDate(new Date(iso)); // 转北京自然日
      byDay.set(key, (byDay.get(key) || 0) + 1);
    }
    seen += items.length;
    if (items.length < 100 || seen >= (json.total_count || 0)) break;
  }
  return byDay;
}

/**
 * 贡献日历 → [{ date, count }]（近一年，UTC 日粒度）。
 * 有 token 走 GraphQL；无 token 抓 github.com 官方贡献页；失败返回 null。
 * 注意：HTML 兜底拿不到真实 count，只能按 level>0 估计为 1，仅供本地预览。
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
    // 新版页面用 <td data-date data-level>，旧版/部分视图用 <rect>
    const tagRe = /<(?:td|rect)\b[^>]*>/g;
    for (const m of html.matchAll(tagRe)) {
      const tag = m[0];
      const date = tag.match(/data-date="([^"]+)"/)?.[1];
      const level = tag.match(/data-level="(\d)"/)?.[1];
      if (!date || level == null) continue;
      const rawCount = tag.match(/data-count="(\d+)"/)?.[1];
      out.push({
        date,
        count: rawCount != null ? Number(rawCount) : (Number(level) > 0 ? 1 : 0),
        level: Number(level),
        estimated: rawCount == null,
      });
    }
    if (out.length) return out;
  } catch { /* 返回 null，由调用方降级 */ }
  return null;
}
