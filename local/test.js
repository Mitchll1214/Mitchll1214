// 冒烟测试：node local/test.js（不依赖真实网络，使用合成数据验证渲染逻辑）
import assert from 'node:assert/strict';
import { computeRealm } from '../api/_lib/realm.js';
import { analyzeContributions, computePet } from '../api/_lib/pet.js';
import { dateStrOffset } from '../api/_lib/tz.js';
import { renderRealm } from '../api/realm.js';
import { renderPet } from '../api/pet.js';
import { renderBanner, renderStats, renderLangs, renderGraph, renderTrophy, renderSnake, levelOf } from '../scripts/cards.js';

// ── 1. 境界计算（固定时间点）──
const r = computeRealm(new Date('2020-03-06T15:32:57Z').getTime(), new Date('2026-08-06T00:00:00Z').getTime());
console.log(`境界: ${r.fullTitle} · 进度 ${r.progress}% · 寿元 ${r.days} 天 · 下一境 ${r.next?.name} 还需 ${r.monthsToNext} 月`);
assert.equal(r.realm.name, '化神');
assert.ok(['初期', '中期', '后期'].includes(r.sub));

// ── 2. 宠物状态计算（按北京自然日造数据，避免凌晨时段测试不稳定）──
const fake = [];
for (let i = 0; i < 400; i++) {
  fake.push({ date: dateStrOffset(i), count: i < 5 ? 1 : 0 });
}
const a = analyzeContributions(fake);
assert.equal(a.streak, 5);
assert.equal(a.yearTotal, 5);
const p = computePet(fake);
assert.equal(p.stage.name, '幼狐');
assert.equal(p.mood.key, 'cultivate');
console.log(`活跃分析: 今日 ${a.todayCount} · 连续 ${a.streak} 天 · 近一年 ${a.yearTotal} → ${p.stage.name}/${p.mood.key}`);

// ── 2.1 回归：北京凌晨（UTC 仍是前一天）时，精确数据必须优先于 UTC 日历 ──
const bjNow = new Date('2026-11-05T21:00:00Z'); // 北京 2026-11-06 05:00
const precise = new Map([['2026-11-06', 3], ['2026-11-05', 2]]);
const early = analyzeContributions([], { now: bjNow, preciseDays: precise });
assert.equal(early.todayKey, '2026-11-06');
assert.equal(early.todayCount, 3);
assert.equal(early.streak, 2);
assert.equal(early.precise, true);
console.log(`凌晨回归: 北京 ${early.todayKey} 今日 ${early.todayCount} · 连续 ${early.streak}（精确数据穿透 UTC 日历）`);

// ── 2.2 热力图分级：高活跃时用固定阈值，色阶稳定 ──
assert.equal(levelOf(0, 20), 0);
assert.equal(levelOf(1, 20), 1);
assert.equal(levelOf(2, 20), 2);
assert.equal(levelOf(5, 20), 3);
assert.equal(levelOf(10, 20), 4);
assert.equal(levelOf(2, 2), 4); // 低活跃退化为相对分级
console.log('✓ 热力图色阶分级正确');

// ── 3. 全卡渲染（合成数据，验证 SVG 结构）──
const user = { name: 'Mitchll', login: 'Mitchll1214', avatar_url: 'https://avatars.githubusercontent.com/u/0?v=4', created_at: '2020-03-06T15:32:57Z', followers: 0, public_repos: 71 };
const repoStats = { stars: 11, repos: 71, topLangs: [['JavaScript', 22], ['Python', 14], ['TypeScript', 9], ['Vue', 5]] };
const svgs = {
  realm: await renderRealm('Mitchll1214', { data: { user, repoStats } }),
  pet: await renderPet('Mitchll1214', { days: fake }),
  banner: renderBanner(['一行诗', '二行诗', '三行诗']),
  stats: renderStats({ yearTotal: 132, repos: 71, stars: 11, followers: 0, prs: 5, issues: 12 }),
  langs: renderLangs(repoStats.topLangs),
  graph: renderGraph(fake, 132),
  trophy: renderTrophy({ streak: 5, stars: 11, repos: 71, followers: 0, starred: 8, prs: 5, issues: 12, years: 6 }),
  snake: renderSnake(fake, 132),
};
for (const [name, svg] of Object.entries(svgs)) {
  assert.ok(svg.startsWith('<svg'), `${name} 应以 <svg 开头`);
  assert.ok(!svg.includes('\uFFFD'), `${name} 不得包含乱码替换符 U+FFFD`);
  console.log(`✓ ${name}.svg（${svg.length} 字节）`);
}

// ── 4. XML 标签配对校验（防止手写 SVG 漏闭合标签）──
function checkXml(svg, label) {
  const cleaned = svg.replace(/<!--[\s\S]*?-->/g, ''); // 剥离注释，注释内的 <img> 等字样不参与校验
  const stack = [];
  const re = /<\/?([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^"'>])*?)(\/?)>/g;
  let m;
  while ((m = re.exec(cleaned))) {
    const [, tag, , selfClose] = m;
    if (selfClose) continue;
    if (tag === '!--') continue;
    if (m[0].startsWith('</')) {
      const open = stack.pop();
      assert.equal(open, tag, `${label}: </${tag}> 与 <${open}> 不配对`);
    } else {
      stack.push(tag);
    }
  }
  assert.equal(stack.length, 0, `${label}: 存在未闭合标签 ${stack.join(',')}`);
}
for (const [name, svg] of Object.entries(svgs)) checkXml(svg, name);
console.log('✓ 全部 SVG XML 标签配对正确');

console.log('✅ 全部通过');
