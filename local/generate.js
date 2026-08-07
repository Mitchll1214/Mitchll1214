// 主页生成器：拉取 GitHub 官方数据 → 渲染全部 SVG 卡片 → 写入 images/。
// 用法：
//   node local/generate.js [username]          # 真实数据（GitHub Actions / 有 token 或可访问 github.com）
//   node local/generate.js [username] --mock   # 合成演示数据（本地预览渲染效果）
// 在 GitHub Actions 中运行时自动使用 GITHUB_TOKEN（GraphQL 数据源，GitHub 官方）；
// 本地无 token 时降级为匿名 REST + github.com 贡献页（均属 GitHub 官方）。
import { writeFileSync, mkdirSync } from 'node:fs';
import { getToken, getGraphQLData, getUser, getRepos, getContributions } from '../api/_lib/github.js';
import { renderRealm } from '../api/realm.js';
import { renderPet } from '../api/pet.js';
import { analyzeContributions } from '../api/_lib/pet.js';
import { computeRealm } from '../api/_lib/realm.js';
import { renderBanner, renderStats, renderLangs, renderGraph, renderTrophy, renderSnake } from '../scripts/cards.js';
import { renderStarMap, renderTrack } from '../scripts/stars.js';

const username = (process.argv[2] || 'Mitchll1214').replace(/^--mock$/, 'Mitchll1214');
const mock = process.argv.includes('--mock');
const token = getToken();

// ── 1. 数据 ─────────────────────────────────────────────
let gql = null;
if (token) {
  try {
    gql = await getGraphQLData(username, token);
    console.log('✓ GraphQL 数据源（token 模式）');
  } catch (e) {
    console.warn(`⚠ GraphQL 失败，降级 REST：${e.message}`);
  }
}

let days = gql?.days;
let user, repoStats;

if (mock) {
  // ── 合成演示数据（仅本地预览）──
  const now = new Date();
  days = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400e3);
    const dow = d.getUTCDay();
    const count = dow === 0 || dow === 6 ? (i % 3 === 0 ? 2 : 0) : 1 + ((i * 7) % 5);
    days.push({ date: d.toISOString().slice(0, 10), count: i < 3 ? 1 : count });
  }
  user = {
    name: 'Mitchll', login: username,
    avatar_url: 'https://avatars.githubusercontent.com/u/61879892?v=4',
    created_at: '2020-03-06T15:32:57Z', followers: 0, public_repos: 71,
  };
  repoStats = {
    stars: 11, repos: 71,
    topLangs: [['JavaScript', 22], ['Python', 14], ['TypeScript', 9], ['Vue', 5], ['HTML', 4], ['CSS', 3]],
  };
  gql = { yearTotal: 132, prs: 5, issues: 12, starred: 8 };
  console.log('⚠ 演示模式（--mock）：使用合成数据，仅供本地预览');
} else {
  if (!days) days = await getContributions(username, '').catch(() => null);
  if (!days) {
    console.error('✗ 贡献日历获取失败（本机无法访问 github.com 时请用 --mock 预览，Actions 内走 GraphQL 不受影响）');
    process.exit(1);
  }
  if (gql) {
    user = { name: gql.name, login: gql.login, avatar_url: gql.avatarUrl, created_at: gql.createdAt, followers: gql.followers, public_repos: gql.repos };
    repoStats = { stars: gql.stars, repos: gql.repos, topLangs: gql.topLangs };
  } else {
    [user, repoStats] = await Promise.all([
      getUser(username).catch(() => null),
      getRepos(username).catch(() => null),
    ]);
  }
  if (!user) {
    console.error('✗ 用户信息获取失败');
    process.exit(1);
  }
}

// ── 2. 渲染（每张卡独立 try-catch：单卡失败不阻塞整体，且输出明确错误便于 Actions 诊断）──
const active = analyzeContributions(days);
const realmInfo = computeRealm(new Date(user.created_at).getTime());
const yearTotal = active?.yearTotal ?? gql?.yearTotal ?? 0; // 统一口径：365 天求和，与灵宠/热力图一致
const streak = active?.streak ?? 0;

const out = {};
const jobs = [
  ['realm', () => renderRealm(username, { data: { user, repoStats } })],
  ['pet', () => renderPet(username, { days })],
  ['banner', () => renderBanner(['看破红尘善与恶', '只观因果静思安', '因果不虚，静观其变'])],
  ['stats', () => renderStats({
    yearTotal,
    repos: repoStats?.repos ?? user.public_repos,
    stars: repoStats?.stars ?? 0,
    followers: user.followers ?? 0,
    prs: gql?.prs,
    issues: gql?.issues,
  })],
  ['langs', () => renderLangs(repoStats?.topLangs)],
  ['graph', () => renderGraph(days, yearTotal)],
  ['trophy', () => renderTrophy({
    streak,
    stars: repoStats?.stars ?? 0,
    repos: repoStats?.repos ?? user.public_repos,
    followers: user.followers ?? 0,
    starred: gql?.starred,
    prs: gql?.prs,
    issues: gql?.issues,
    years: Math.max(1, Math.floor(realmInfo.years)),
  })],
  ['stars', () => renderStarMap(gql?.totalCommits ?? active?.yearTotal ?? 0)],
  ['track', () => renderTrack(gql?.totalCommits ?? active?.yearTotal ?? 0, active?.todayCount ?? 0)],
];
for (const [name, fn] of jobs) {
  try {
    out[name] = await fn();
    console.log(`✓ 渲染 ${name}`);
  } catch (err) {
    console.error(`✗ 渲染 ${name} 失败: ${err.message}`);
    out[name] = null;
  }
}
const failed = Object.entries(out).filter(([, v]) => v === null);
if (failed.length) {
  console.error(`\n⚠ ${failed.length} 张卡渲染失败: ${failed.map(([n]) => n).join(', ')}`);
  process.exit(1);
}

// ── 3. 写文件 ───────────────────────────────────────────
const files = {
  'images/banner.svg': out.banner,
  'images/realm.svg': out.realm,
  'images/pet.svg': out.pet,
  'images/stats.svg': out.stats,
  'images/langs.svg': out.langs,
  'images/graph.svg': out.graph,
  'images/trophy.svg': out.trophy,
  'images/stars.svg': out.stars,
  'images/track.svg': out.track,
};
mkdirSync('images', { recursive: true });
for (const [f, svg] of Object.entries(files)) {
  writeFileSync(f, svg);
  console.log(`✓ ${f}（${svg.length} 字节）`);
}
console.log(`\n完成：${username} · 境界 ${realmInfo.fullTitle} · 今年 ${yearTotal} 次提交 · 连续 ${streak} 天`);
