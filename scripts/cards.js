// 自建卡片渲染：统计卡 / 语言卡 / 贡献热力图 / 成就奖杯 / 道号横幅(滚动字幕) / 天道灵脉游龙录(动画)。
// 全部为纯静态 SVG + SMIL/CSS 动画，可被 GitHub 直接渲染，零第三方服务。
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

/** 道号横幅（横向滚动字幕 · SMIL 动画） */
export function renderBanner(lines, { width = 480, height = 56 } = {}) {
  const content = (lines || []).join('\u3000\u3000') || '看破红尘善与恶\u3000\u3000只观因果静思安\u3000\u3000因果不虚，静观其变';
  // 无缝滚动：副本间距 = 文本宽 + 间隙，动画位移 = 间距，循环点两副本位置重合，视觉无跳变
  const textW = Math.round(content.length * 23); // 全角字符 ≈ font-size 20 + letter-spacing 3
  const gap = 100;
  const span = textW + gap;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
width="${width}"
height="${height}"
viewBox="0 0 480 56">

<defs>

<!-- 背景 -->
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#151822"/>
    <stop offset="100%" stop-color="#080A10"/>
</linearGradient>

<!-- 边框 -->
<linearGradient id="border">
    <stop offset="0%" stop-color="#B5B3FF"/>
    <stop offset="100%" stop-color="#403866"/>
</linearGradient>

<!-- 裁剪区域 -->
<clipPath id="clip">
    <rect x="12" y="5" width="456" height="46" rx="14"/>
</clipPath>

<!-- 发光 -->
<filter id="glow">
    <feGaussianBlur stdDeviation="2"/>
    <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
    </feMerge>
</filter>

</defs>

<!-- 外框 -->
<rect x="1" y="1" width="478" height="54" rx="18" fill="url(#bg)" stroke="url(#border)" stroke-width="2"/>

<!-- 滚动窗口 -->
<g clip-path="url(#clip)">
<g font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="20" font-weight="600" letter-spacing="3" fill="#A8A6FF" filter="url(#glow)">
<text x="480" y="28" dy=".35em">${esc(content)}</text>
<text x="${480 + span}" y="28" dy=".35em">${esc(content)}</text>
<animateTransform attributeName="transform" type="translate" from="0" to="${-span}" dur="21s" repeatCount="indefinite"/>
</g>
</g>

<!-- 装饰 -->
<circle cx="24" cy="28" r="2.5" fill="#B5B3FF"/>
<circle cx="456" cy="28" r="2.5" fill="#B5B3FF"/>

</svg>`;
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

/** 天道灵脉 · 游龙修炼录（灵脉流光 + 游龙珠 · SMIL 动画，纯装饰卡） */
export function renderSnake(days, yearTotal) {
  // days/yearTotal 参数保留以兼容调用方；本卡为纯动画装饰，不展示数据
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
 width="480"
 height="180"
 viewBox="0 0 480 180"
 role="img"
 font-family="'PingFang SC','Microsoft YaHei','Noto Sans SC',sans-serif">

<defs>

<!-- 外框 -->
<linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#D8B478"/>
<stop offset="0.5" stop-color="#8E8CD8"/>
<stop offset="1" stop-color="#D96C6C"/>
</linearGradient>

<!-- 灵脉 -->
<linearGradient id="spirit" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="#D8B478"/>
<stop offset="0.45" stop-color="#FFF1B8"/>
<stop offset="1" stop-color="#8E8CD8"/>
</linearGradient>

<!-- 光晕 -->
<filter id="glow"><feGaussianBlur stdDeviation="4"/></filter>

<!-- 游龙路径 -->
<path id="dragon" d="M42 105 C100 105 125 60 200 60 C280 60 310 125 380 125 C415 125 435 105 450 95"/>

</defs>

<!-- 背景 -->
<rect x="1" y="1" width="478" height="178" rx="22" fill="#0D1117" stroke="url(#frame)" stroke-width="2"/>

<!-- 星尘 -->
<g fill="#D8B478">
<circle cx="80" cy="55" r="1.5"><animate attributeName="opacity" values="0.2;1;0.2" dur="3s" repeatCount="indefinite"/></circle>
<circle cx="260" cy="35" r="1.2"><animate attributeName="opacity" values="1;0.2;1" dur="2.5s" repeatCount="indefinite"/></circle>
<circle cx="420" cy="55" r="1.5"><animate attributeName="opacity" values="0.2;1;0.2" dur="4s" repeatCount="indefinite"/></circle>
</g>

<!-- 标题 -->
<text x="24" y="32" font-size="14" font-weight="700" fill="#F4E9D8">☯ 天道灵脉 · 游龙修炼录</text>
<text x="456" y="32" text-anchor="end" font-size="10" fill="#8E8CD8">GITHUB CULTIVATION</text>
<line x1="24" y1="45" x2="456" y2="45" stroke="#8E8CD8" stroke-opacity="0.25"/>

<!-- 灵脉外层 -->
<use href="#dragon" xlink:href="#dragon" stroke="#D8B478" stroke-width="14" opacity="0.2" fill="none" filter="url(#glow)"/>

<!-- 灵脉主体 -->
<use href="#dragon" xlink:href="#dragon" stroke="url(#spirit)" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="22 18">
<animate attributeName="stroke-dashoffset" from="0" to="-200" dur="3s" repeatCount="indefinite"/>
</use>

<!-- 游动龙珠 -->
<circle r="6" fill="#FFF1B8"><animateMotion dur="5s" repeatCount="indefinite"><mpath href="#dragon" xlink:href="#dragon"/></animateMotion></circle>
<circle r="18" fill="#D8B478" opacity="0.18" filter="url(#glow)"><animateMotion dur="5s" repeatCount="indefinite"><mpath href="#dragon" xlink:href="#dragon"/></animateMotion></circle>

<!-- 灵脉节点 -->
<g fill="#FFE6A7">
<circle cx="42" cy="105" r="5"><animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite"/></circle>
<circle cx="200" cy="60" r="5"><animate attributeName="r" values="5;7;5" dur="2.5s" repeatCount="indefinite"/></circle>
<circle cx="380" cy="125" r="5"><animate attributeName="r" values="5;8;5" dur="3s" repeatCount="indefinite"/></circle>
</g>

<!-- 修炼等级 -->
<text x="24" y="155" font-size="11" fill="#9A93B8">提交 = 修炼经验 · Commit = 灵气积累</text>
<text x="456" y="155" text-anchor="end" font-size="11" fill="#D8B478">✦ 灵脉流转中</text>

</svg>`;
}
