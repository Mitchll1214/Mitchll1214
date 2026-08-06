// 自建卡片渲染：统计卡 / 语言卡 / 贡献热力图 / 成就奖杯 / 打字横幅(SMIL) / 贪吃蛇(SMIL)。
// 全部为纯静态 SVG + SMIL 动画，可被 GitHub 直接渲染，零第三方服务。
import { svgWrap, text, esc, star } from '../api/_lib/svg.js';

export const LANG_COLORS = {
  Python: '#3572A5', JavaScript: '#F1E05A', TypeScript: '#3178C6', Vue: '#41B883',
  HTML: '#E34C26', CSS: '#563D7C', Go: '#00ADD8', Java: '#B07219', 'C#': '#178600',
  'C++': '#F34B7D', Rust: '#DEA584', Shell: '#89E051', Jupyter: '#DA5B0B',
  Dart: '#00B4AB', PHP: '#4F5D95', Kotlin: '#A97BFF', Swift: '#F05138',
  'Jupyter Notebook': '#DA5B0B', C: '#555555', Ruby: '#701516',
};

export const langColor = (l) => LANG_COLORS[l] || '#8B949E';

/** 贡献热力分级（接近 GitHub 视觉） */
export function levelOf(count, max) {
  if (count <= 0) return 0;
  if (max <= 0) return 1;
  const t = count / max;
  if (t > 0.7) return 4;
  if (t > 0.4) return 3;
  if (t > 0.15) return 2;
  return 1;
}
const HEAT = ['rgba(142,140,216,0.10)', 'rgba(142,140,216,0.32)', 'rgba(142,140,216,0.55)', 'rgba(142,140,216,0.80)', '#C8A2F0'];

/** 道号横幅（静态排版 + 星光微动画，兼容性最稳） */
export function renderBanner(lines, { width = 480, height = 64 } = {}) {
  const main = lines[0] || '因果不虚 · 静观其变';
  const sub = lines.slice(1).join(' · ') || '看破红尘善与恶 · 只观因果静思安';
  const twinkle = (x, y, r, delay) => `<polygon points="${starPts(x, y, r)}" fill="#C8A2F0"><animate attributeName="opacity" values="0.3;1;0.3" dur="3s" begin="${delay}s" repeatCount="indefinite"/></polygon>`;
  const body = `
  <line x1="30" y1="32" x2="66" y2="32" stroke="#8E8CD8" stroke-opacity="0.35" stroke-width="1.5"/>
  <line x1="414" y1="32" x2="450" y2="32" stroke="#8E8CD8" stroke-opacity="0.35" stroke-width="1.5"/>
  ${text({ x: 240, y: 36, s: main, size: 21, weight: 700, fill: '#8E8CD8', anchor: 'middle', spacing: 2 })}
  ${text({ x: 240, y: 56, s: sub, size: 12, fill: '#9A93B8', anchor: 'middle' })}
  ${twinkle(20, 22, 5, 0)}${twinkle(460, 22, 5, 1.5)}${twinkle(24, 48, 3.5, 0.8)}${twinkle(456, 48, 3.5, 2.2)}
  `;
  return svgWrap({ width, height, body, border: '#8E8CD8' });
}

/** 四角星顶点串（供内联使用） */
function starPts(cx, cy, r) {
  const pts = [];
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 - Math.PI / 2;
    const rad = k % 2 === 0 ? r : r * 0.38;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

/** 修行记录统计卡：6 项指标 2 行 */
export function renderStats(stats) {
  const items = [
    { v: stats.yearTotal ?? '-', k: '今年提交' },
    { v: stats.repos ?? '-', k: '洞府（仓库）' },
    { v: stats.stars ?? '-', k: '法宝（Star）' },
    { v: stats.followers ?? '-', k: '道众（粉丝）' },
    { v: stats.prs ?? '-', k: '论道（PR）' },
    { v: stats.issues ?? '-', k: '解惑（Issue）' },
  ];
  const cw = 141;
  const gap = 10;
  const cx = [24, 24 + cw + gap, 24 + (cw + gap) * 2];
  const rows = [
    [0, 1, 2].map((i) => items[i]),
    [3, 4, 5].map((i) => items[i]),
  ];
  const cells = rows
    .map((row, r) =>
      row
        .map(
          (it, i) => `<g>
        <rect x="${cx[i]}" y="${54 + r * 72}" width="${cw}" height="60" rx="12" fill="rgba(255,255,255,0.045)" stroke="rgba(142,140,216,0.28)" stroke-width="1"/>
        ${text({ x: cx[i] + cw / 2, y: 84 + r * 72, s: String(it.v), size: 21, weight: 800, anchor: 'middle', fill: '#E6E1F5' })}
        ${text({ x: cx[i] + cw / 2, y: 103 + r * 72, s: it.k, size: 10.5, fill: '#7A7393', anchor: 'middle' })}
      </g>`,
        )
        .join(''),
    )
    .join('');
  const body = text({ x: 24, y: 38, s: '📜 修行记录', size: 15, weight: 700, spacing: 1 }) + cells;
  return svgWrap({ width: 480, height: 196, body, border: '#8E8CD8' });
}

/** 语言分布卡 */
export function renderLangs(topLangs) {
  if (!topLangs || !topLangs.length) {
    return svgWrap({ width: 480, height: 150, body: text({ x: 24, y: 80, s: '灵根未显 · 暂无仓库语言数据', size: 14, fill: '#9A93B8' }), border: '#8E8CD8' });
  }
  const total = topLangs.reduce((s, [, n]) => s + n, 0);
  const rows = topLangs
    .map(([l, n], i) => {
      const y = 66 + i * 34;
      const pct = Math.round((n / total) * 100);
      const w = Math.max(8, Math.round((n / total) * 300));
      const c = langColor(l);
      return `<g>
      <circle cx="32" cy="${y - 5}" r="4" fill="${c}"/>
      ${text({ x: 46, y: y, s: l, size: 12.5, fill: '#C9C3E0' })}
      ${text({ x: 456, y: y, s: `${pct}% · ${n} 洞`, size: 11, fill: '#7A7393', anchor: 'end' })}
      <rect x="46" y="${y + 6}" width="300" height="6" rx="3" fill="rgba(255,255,255,0.08)"/>
      <rect x="46" y="${y + 6}" width="${w}" height="6" rx="3" fill="${c}" opacity="0.85"/>
    </g>`;
    })
    .join('');
  const body = text({ x: 24, y: 38, s: '🧬 灵根 · 语言分布', size: 15, weight: 700, spacing: 1 }) + rows;
  return svgWrap({ width: 480, height: 66 + topLangs.length * 34 - 6, body, border: '#8E8CD8' });
}

/** 贡献热力图卡（近一年，按周排布） */
export function renderGraph(days, yearTotal) {
  const cell = 6;
  const gap = 2;
  const step = cell + gap;
  const X0 = 28;
  const Y0 = 52;
  const maxCount = Math.max(1, ...days.map((d) => d.count));
  const map = new Map(days.map((d) => [d.date, d.count]));
  // 从今天往前推一年，按周日开始排周
  const today = new Date();
  const end = new Date(today.getTime() + (6 - today.getUTCDay()) * 86400e3); // 本周日
  const start = new Date(end.getTime() - 363 * 86400e3); // 约 52 周
  const weeks = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    weeks.push({ date: key, count: map.get(key) || 0 });
  }
  const cols = [];
  for (let i = 0; i < weeks.length; i += 7) cols.push(weeks.slice(i, i + 7));
  const cellsSvg = cols
    .map((col, cx) =>
      col
        .map((c, cy) => {
          if (!c) return '';
          const lv = levelOf(c.count, maxCount);
          return `<rect x="${X0 + cx * step}" y="${Y0 + cy * step}" width="${cell}" height="${cell}" rx="1.5" fill="${HEAT[lv]}" ${c.count ? '' : 'opacity="0.7"'}/>`;
        })
        .join(''),
    )
    .join('');
  const legend = [0, 1, 2, 3, 4]
    .map((lv, i) => `<rect x="${340 + i * 11}" y="118" width="8" height="8" rx="2" fill="${HEAT[lv]}"/>`)
    .join('');
  const body = `
    ${text({ x: 24, y: 36, s: '📅 修行年鉴 · 近一年', size: 15, weight: 700, spacing: 1 })}
    ${text({ x: 456, y: 36, s: `共 ${yearTotal} 次`, size: 12, fill: '#C8A2F0', anchor: 'end', weight: 600 })}
    ${text({ x: 8, y: Y0 + 6 + step * 1, s: '一', size: 8, fill: '#7A7393' })}
    ${text({ x: 8, y: Y0 + 6 + step * 3, s: '三', size: 8, fill: '#7A7393' })}
    ${text({ x: 8, y: Y0 + 6 + step * 5, s: '五', size: 8, fill: '#7A7393' })}
    ${cellsSvg}
    ${text({ x: 280, y: 126, s: '少', size: 9, fill: '#7A7393' })}${legend}${text({ x: 400, y: 126, s: '多', size: 9, fill: '#7A7393' })}
  `;
  return svgWrap({ width: 480, height: 144, body, border: '#8E8CD8' });
}

/** 成就奖杯卡 */
export function renderTrophy(data) {
  const items = [
    { e: '🔗', t: '连修', v: `${data.streak} 日` },
    { e: '⚔️', t: '法宝', v: `${data.stars} 件` },
    { e: '🏯', t: '洞府', v: `${data.repos} 座` },
    { e: '👥', t: '道众', v: `${data.followers} 人` },
    { e: '📚', t: '藏书', v: `${data.starred ?? '-'} 卷` },
    { e: '🗣️', t: '论道', v: `${data.prs ?? '-'} 回` },
    { e: '🧩', t: '解惑', v: `${data.issues ?? '-'} 次` },
    { e: '☯️', t: '道龄', v: `${data.years} 年` },
  ];
  const cw = 105;
  const ch = 54;
  const gapX = 4;
  const gapY = 8;
  const cells = items
    .map((it, i) => {
      const r = Math.floor(i / 4);
      const c = i % 4;
      const x = 24 + c * (cw + gapX);
      const y = 50 + r * (ch + gapY);
      return `<g>
        <rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="11" fill="rgba(255,255,255,0.045)" stroke="rgba(142,140,216,0.25)" stroke-width="1"/>
        <text x="${x + 12}" y="${y + 22}" font-size="13">${it.e}</text>
        ${text({ x: x + cw / 2, y: y + 24, s: it.v, size: 15.5, weight: 700, anchor: 'middle' })}
        ${text({ x: x + cw / 2, y: y + 43, s: it.t, size: 10, fill: '#7A7393', anchor: 'middle' })}
      </g>`;
    })
    .join('');
  const body = text({ x: 24, y: 36, s: '🏆 修行成就', size: 15, weight: 700, spacing: 1 }) + cells;
  return svgWrap({ width: 480, height: 50 + 2 * ch + gapY + 14, body, border: '#8E8CD8' });
}

/** 贪吃蛇（SMIL：蛇身 stroke-dashoffset 蠕动 + 蛇头 animateMotion 跟随） */
export function renderSnake(days, yearTotal) {
  const cell = 4;
  const gap = 2;
  const step = cell + gap;
  const X0 = 40;
  const Y0 = 44;
  const maxCount = Math.max(1, ...days.map((d) => d.count));
  const map = new Map(days.map((d) => [d.date, d.count]));
  const today = new Date();
  const end = new Date(today.getTime() + (6 - today.getUTCDay()) * 86400e3);
  const start = new Date(end.getTime() - 363 * 86400e3);
  // 生成 53 周 × 7 天的格子
  const cols = [];
  let col = -1;
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() === 0) { col++; cols[col] = []; }
    const key = d.toISOString().slice(0, 10);
    cols[col].push({ date: key, count: map.get(key) || 0 });
  }
  const cellsSvg = cols
    .map((colArr, cx) =>
      colArr
        .map((c, cy) => {
          const lv = levelOf(c.count, maxCount);
          return `<rect x="${X0 + cx * step}" y="${Y0 + cy * step}" width="${cell}" height="${cell}" rx="1.2" fill="${HEAT[Math.min(lv, 3)]}" opacity="0.55"/>`;
        })
        .join(''),
    )
    .join('');
  // 环形巡山跑道（闭环路径，蛇循环巡游不跳变）。上弧 + 下弧组成跑道。
  const snakePath = 'M60 112 A 195 24 0 0 1 450 112 A 195 24 0 0 1 60 112 Z';
  // 淡色轨迹线，暗示跑道
  const track = `<path d="${snakePath}" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="2" stroke-dasharray="3 7"/>`;
  // 整条蛇（头+身+尾一体）沿跑道巡游，rotate=auto 自动转向，头部始终朝行进方向
  const snakeGroup = `<g>
    <animateMotion dur="9s" repeatCount="indefinite" rotate="auto"><mpath href="#snakeRoute"/></animateMotion>
    <circle cx="0" cy="0" r="8.5" fill="#34D399" stroke="#0D1117" stroke-width="1.5"/>
    <circle cx="-15" cy="0" r="7.5" fill="#4ade80"/>
    <circle cx="-28" cy="0" r="6" fill="#6ee7b7"/>
    <circle cx="-39" cy="0" r="4" fill="#a7f3d0"/>
    <circle cx="4" cy="-4" r="2" fill="#0D1117"/>
  </g>`;
  const foods = ['80,66', '300,30', '430,96', '170,140']
    .map((p, i) => {
      const [fx, fy] = p.split(',').map(Number);
      const pts = [];
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4 - Math.PI / 2;
        const rad = k % 2 === 0 ? 5 : 1.9;
        pts.push(`${(fx + rad * Math.cos(a)).toFixed(1)},${(fy + rad * Math.sin(a)).toFixed(1)}`);
      }
      return `<polygon points="${pts.join(' ')}" fill="#FFD98A"><animate attributeName="opacity" values="1;0.3;1" dur="${2 + i}s" begin="${i * 0.7}s" repeatCount="indefinite"/></polygon>`;
    })
    .join('');
  const body = `
    <defs>
      <path id="snakeRoute" d="${snakePath}"/>
    </defs>
    ${text({ x: 24, y: 30, s: '🐍 灵蛇巡山 · 吃掉你的提交', size: 14, weight: 700, spacing: 1 })}
    ${text({ x: 456, y: 30, s: `${yearTotal} 颗灵气`, size: 11, fill: '#7A7393', anchor: 'end' })}
    ${cellsSvg}
    ${track}
    ${snakeGroup}
    ${foods}
  `;
  return svgWrap({ width: 480, height: 160, body, border: '#34D399' });
}
