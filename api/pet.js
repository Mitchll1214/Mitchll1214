// /api/pet?user=xxx — 活跃度驱动的虚拟灵宠卡（Vercel serverless 入口）
import { getContributions } from './_lib/github.js';
import { computePet } from './_lib/pet.js';
import { drawFox, moodDecor } from './_lib/fox.js';
import { svgWrap, text, badge, bar } from './_lib/svg.js';

const STAGE_COLORS = ['#C9B187', '#F2A65A', '#E0A526', '#D96C6C', '#A78BFA'];

export async function renderPet(username) {
  const list = await getContributions(username).catch(() => null);
  const p = computePet(list);

  const fx = 132;
  const fy = 140;
  const data = p.a
    ? `今日 ${p.a.todayCount} 次提交 · 连续 ${p.a.streak} 天 · 近一年 ${p.a.yearTotal} 次`
    : '贡献数据暂不可得 · 灵兽于雾中沉睡';

  const body = `
  ${drawFox({ stageIdx: p.stage.idx, mood: p.mood.key, cx: fx, cy: fy, dim: p.a === null })}
  ${moodDecor(p.mood.key, fx, fy)}
  ${text({ x: 272, y: 46, s: '🦊 灵宠 · 小九', size: 18, weight: 700 })}
  ${badge(272, 58, `成长 · ${p.stage.name}`, STAGE_COLORS[p.stage.idx])}
  ${text({ x: 272, y: 112, s: p.mood.label, size: 13.5, fill: p.mood.color })}
  ${text({ x: 272, y: 138, s: '灵力 · 近30日', size: 11.5, fill: '#9A93B8' })}
  ${text({ x: 468, y: 138, s: `${p.spirit}%`, size: 11.5, fill: '#C8A2F0', anchor: 'end', weight: 600 })}
  ${bar({ x: 272, y: 146, w: 196, h: 9, pct: p.spirit, from: '#8E8CD8', to: '#C8A2F0' })}
  ${text({ x: 272, y: 180, s: `亲密度 · 连续${p.a ? p.a.streak : 0}天`, size: 11.5, fill: '#9A93B8' })}
  ${text({ x: 468, y: 180, s: `${p.bond}%`, size: 11.5, fill: '#FFD98A', anchor: 'end', weight: 600 })}
  ${bar({ x: 272, y: 188, w: 196, h: 9, pct: p.bond, from: '#F0A75B', to: '#FFD98A' })}
  ${text({ x: 272, y: 238, s: data, size: 11.5, fill: '#7A7393' })}
  <g opacity="0.5">
    <circle cx="24" cy="278" r="6" fill="none" stroke="#8E8CD8" stroke-width="1.2"/>
    <circle cx="24" cy="278" r="2" fill="#8E8CD8"/>
    <path d="M456 274 l6 6 l-12 0 Z" fill="#8E8CD8"/>
  </g>`;

  return svgWrap({ width: 480, height: 300, body, border: '#8E8CD8' });
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const user = (url.searchParams.get('user') || 'Mitchll1214').trim();
    const svg = await renderPet(user);
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
    res.end(svg);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(`pet 渲染失败: ${err.message}`);
  }
}
