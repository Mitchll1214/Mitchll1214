// 冒烟测试：node local/test.js
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { computeRealm } from '../api/_lib/realm.js';
import { analyzeContributions, computePet } from '../api/_lib/pet.js';
import { renderRealm } from '../api/realm.js';
import { renderPet } from '../api/pet.js';

// 1) 境界计算（固定时间点 2020-03-06 注册）
const r = computeRealm(new Date('2020-03-06T15:32:57Z').getTime(), new Date('2026-08-06T00:00:00Z').getTime());
console.log(`境界: ${r.fullTitle} · 进度 ${r.progress}% · 寿元 ${r.days} 天 · 下一境 ${r.next?.name} 还需 ${r.monthsToNext} 月`);
assert.equal(r.realm.name, '化神');
assert.ok(['初期', '中期', '后期'].includes(r.sub));

// 2) 宠物状态计算
const fake = [];
const today = new Date();
for (let i = 0; i < 40; i++) {
  const d = new Date(today.getTime() - i * 86400e3);
  fake.push({ date: d.toISOString().slice(0, 10), count: i < 5 ? 1 : 0 });
}
const a = analyzeContributions(fake);
console.log(`活跃分析: 今日 ${a.todayCount} · 近30日 ${a.last30} · 连续 ${a.streak} 天 · 近一年 ${a.yearTotal}`);
assert.equal(a.streak, 5);
const p = computePet(fake);
assert.equal(p.stage.name, '幼狐'); // 近一年 5 次贡献 → 幼狐
assert.equal(p.mood.key, 'cultivate'); // 今日有贡献 → 修炼中

// 3) 真实渲染（联网）
const realmSvg = await renderRealm('Mitchll1214');
assert.ok(realmSvg.startsWith('<svg'));
assert.ok(realmSvg.includes('修仙档案'));
console.log('realm.svg 渲染 OK，长度', realmSvg.length);

const petSvg = await renderPet('Mitchll1214');
assert.ok(petSvg.startsWith('<svg'));
assert.ok(petSvg.includes('小九'));
assert.ok(petSvg.includes('灵力'));
console.log('pet.svg 渲染 OK，长度', petSvg.length);

// 4) 快照存仓库（部署前 README 直接引用）
mkdirSync('images', { recursive: true });
writeFileSync('images/realm.svg', realmSvg);
writeFileSync('images/pet.svg', petSvg);
console.log('快照已写入 images/realm.svg、images/pet.svg');

console.log('✅ 全部通过');
