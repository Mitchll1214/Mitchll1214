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

/** 天道灵脉 · 游龙录 —— 数据计算（近30日/昨日/连续/上月/品质/进度/状态/涨幅） */
export function computeSpiritStats(days) {
  const DAY = 86400e3;
  const fmt = (d) => d.toISOString().slice(0, 10);
  const map = new Map((days || []).map((d) => [d.date, d.count]));
  const today = new Date();
  const get = (offset) => map.get(fmt(new Date(today.getTime() - offset * DAY))) || 0;

  // 近 30 天逐日提交（索引 0 = 29 天前 … 索引 28 = 昨日，索引 29 = 今日）
  const daily_commits = [];
  for (let i = 29; i >= 0; i--) daily_commits.push(get(i));
  const yesterday_commits = get(1);
  const total_30_days = daily_commits.reduce((s, n) => s + n, 0);

  // 上个月（前 30 天）总提交，用于涨幅
  let last_month_total = 0;
  for (let i = 30; i < 60; i++) last_month_total += get(i);

  // 当前连续提交天数（今日无提交则从昨日起算）
  let streak_days = 0;
  for (let off = get(0) > 0 ? 0 : 1; off < 366; off++) {
    if (get(off) > 0) streak_days++;
    else break;
  }

  // 涨幅百分比：正数 +XX% / 负数 -XX%
  const growth = last_month_total > 0
    ? ((total_30_days - last_month_total) / last_month_total) * 100
    : total_30_days > 0 ? 100 : 0;
  const growthPct = `${growth >= 0 ? '+' : ''}${growth.toFixed(0)}%`;

  // 进度条（基准目标 400 修为）
  const progress = Math.min(Math.round((total_30_days / 400) * 100), 100);

  // 品质等级（按日均提交）
  const avg = total_30_days / 30;
  const quality = avg >= 5 ? '极品' : avg >= 3 ? '上品' : avg >= 1 ? '中品' : '凡品';

  // 状态文案（按进度切换，含高亮关键词）
  const status =
    progress >= 90 ? { kw: '圆满', suffix: '，可凝金丹！' }
    : progress >= 60 ? { kw: '充盈', suffix: '，龙吟隐隐...' }
    : progress >= 30 ? { kw: '奔涌', suffix: '，汇入丹田...' }
    : { kw: '初醒', suffix: '，涓涓细流...' };

  return {
    daily_commits, yesterday_commits, total_30_days, last_month_total,
    streak_days, growthPct, progress, quality, status, hasYesterday: yesterday_commits > 0,
  };
}

/** 天道灵脉 · 游龙录（800×250 数据卡：龙珠昨日修为 + 三十日道行玉简 + 30 日晴雨表） */
export function renderSnake(days, yearTotal) {
  // yearTotal 参数保留以兼容调用方；本卡数据由 computeSpiritStats(days) 实时计算
  const s = computeSpiritStats(days);
  const fillW = Math.round((s.progress / 100) * 470);

  // 主数值区（大数字 + 单位 + 涨幅标签）
  const numX = 280;
  const numW = String(s.total_30_days).length * 30;
  const unitX = numX + numW + 8;
  const growthColor = s.growthPct.startsWith('-') ? '#f87171' : '#34d399';
  const growthBg = s.growthPct.startsWith('-') ? 'rgba(239,68,68,0.14)' : 'rgba(16,185,129,0.14)';
  const growthX = unitX + 60;

  // 30 日晴雨表圆点（索引 28 = 昨日，加白描边并略大）
  const dotStep = 24;
  const dotX0 = 40;
  const dots = s.daily_commits
    .map((c, i) => {
      const cx = dotX0 + i * dotStep;
      return i === 28
        ? `<circle cx="${cx}" cy="222" r="5.5" fill="${c > 0 ? '#ffd700' : '#2a3650'}" stroke="#ffffff" stroke-width="1.5"/>`
        : `<circle cx="${cx}" cy="222" r="4" fill="${c > 0 ? '#ffd700' : '#2a3650'}"/>`;
    })
    .join('');

  console.log(`✅ 卡片已生成，进度：${s.progress}%，品质：${s.quality}`);

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
 width="800"
 height="250"
 viewBox="0 0 800 250"
 role="img"
 font-family="system-ui, -apple-system, 'Noto Sans SC', sans-serif">

<defs>

<!-- 背景径向渐变 -->
<radialGradient id="bgGrad" cx="50%" cy="40%" r="80%">
  <stop offset="0%" stop-color="#0A0E17"/>
  <stop offset="100%" stop-color="#111827"/>
</radialGradient>

<!-- 龙珠渐变 -->
<radialGradient id="ballGrad" cx="40%" cy="35%" r="75%">
  <stop offset="0%" stop-color="#fff7b0"/>
  <stop offset="55%" stop-color="#f5b81b"/>
  <stop offset="100%" stop-color="#b37b0e"/>
</radialGradient>

<!-- 进度条三色渐变 -->
<linearGradient id="pbarGrad" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0%" stop-color="#00f0ff"/>
  <stop offset="55%" stop-color="#3a86ff"/>
  <stop offset="100%" stop-color="#ffd700"/>
</linearGradient>

<!-- 流光斜条纹 -->
<linearGradient id="flowGrad" x1="0" y1="0" x2="0.22" y2="1">
  <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
  <stop offset="50%" stop-color="#ffffff" stop-opacity="0.5"/>
  <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
</linearGradient>

<!-- 龙珠金黄色外发光 -->
<filter id="ballGlow" x="-60%" y="-60%" width="220%" height="220%">
  <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#ffd700" flood-opacity="0.85"/>
</filter>

<!-- 流光裁剪（限制在进度条填充范围内） -->
<clipPath id="barClip"><rect x="280" y="136" width="${fillW}" height="12"/></clipPath>

</defs>

<!-- 背景 -->
<rect x="1" y="1" width="798" height="248" rx="16" fill="url(#bgGrad)" stroke="rgba(255,215,0,0.16)" stroke-width="1.5"/>

<!-- 四角古风直角边框（左上 / 右下） -->
<path d="M 18 46 L 18 18 L 46 18" fill="none" stroke="rgba(255,215,0,0.3)" stroke-width="2"/>
<path d="M 754 204 L 782 204 L 782 232" fill="none" stroke="rgba(255,215,0,0.3)" stroke-width="2"/>

<!-- ══ 左侧：龙珠 · 昨日修为 ══ -->

<!-- 旋转虚线外圈（正转） -->
<circle cx="120" cy="115" r="58" fill="none" stroke="rgba(255,215,0,0.28)" stroke-width="1.5" stroke-dasharray="4 9">
  <animateTransform attributeName="transform" type="rotate" from="0 120 115" to="360 120 115" dur="18s" repeatCount="indefinite"/>
</circle>
<!-- 反转虚线外圈 -->
<circle cx="120" cy="115" r="66" fill="none" stroke="rgba(255,215,0,0.15)" stroke-width="1.2" stroke-dasharray="28 16">
  <animateTransform attributeName="transform" type="rotate" from="360 120 115" to="0 120 115" dur="26s" repeatCount="indefinite"/>
</circle>

<!-- 龙珠主体（有提交：金色 + 外发光；无提交：灰白 + 静修） -->
${s.hasYesterday
  ? `<circle cx="120" cy="115" r="50" fill="url(#ballGrad)" filter="url(#ballGlow)"/>`
  : `<circle cx="120" cy="115" r="50" fill="#4a5568"/>`}

<!-- 昨日修为数值 -->
${s.hasYesterday
  ? `<text x="120" y="127" text-anchor="middle" font-size="32" font-weight="700" fill="#1a1a1a">${s.yesterday_commits}</text>
     <text x="120" y="146" text-anchor="middle" font-size="10" fill="#5b4308">昨日修为</text>`
  : `<text x="120" y="128" text-anchor="middle" font-size="30" font-weight="600" fill="#cbd5e1">静</text>
     <text x="120" y="146" text-anchor="middle" font-size="10" fill="#94a3b8">静修中</text>`}

<!-- 连续道行徽章（streak_days > 0 才显示） -->
${s.streak_days > 0
  ? `<rect x="68" y="186" width="104" height="22" rx="11" fill="rgba(255,215,0,0.12)" stroke="rgba(255,215,0,0.4)" stroke-width="1"/>
     <text x="120" y="200" text-anchor="middle" font-size="11" fill="#ffd700">✦ 连续道行 ${s.streak_days} 日</text>`
  : ''}

<!-- ══ 右侧：灵脉玉简 · 三十日修为 ══ -->

<!-- 顶部标题 + 状态标签 -->
<text x="280" y="48" font-size="16" font-weight="600" fill="#e2e8f0">近三十日道行 · 丙午年 柒月</text>
<rect x="694" y="32" width="82" height="22" rx="11" fill="rgba(0,240,255,0.12)" stroke="rgba(0,240,255,0.4)" stroke-width="1"/>
<text x="735" y="47" text-anchor="middle" font-size="11" fill="#67e8f9">⚡ 灵脉活跃</text>

<!-- 主数值 + 单位 + 涨幅标签 -->
<text x="${numX}" y="112" font-size="48" font-weight="700" fill="#ffffff">${s.total_30_days}</text>
<text x="${unitX}" y="112" font-size="16" fill="#94a3b8">修为</text>
<rect x="${growthX}" y="84" width="64" height="26" rx="13" fill="${growthBg}" stroke="${growthColor}" stroke-opacity="0.5" stroke-width="1"/>
<text x="${growthX + 32}" y="101" text-anchor="middle" font-size="13" font-weight="700" fill="${growthColor}">${s.growthPct}</text>

<!-- 灵脉进度条 -->
<rect x="280" y="136" width="470" height="12" rx="6" fill="#1f2a3f"/>
<rect x="280" y="136" width="${fillW}" height="12" rx="6" fill="url(#pbarGrad)"/>

<!-- 动态流光（translateX 驱动，clip 限制在填充条内） -->
<g clip-path="url(#barClip)">
  <rect x="280" y="136" width="46" height="12" fill="url(#flowGrad)" opacity="0.6">
    <animateTransform attributeName="transform" type="translate" from="0" to="${fillW}" dur="3s" repeatCount="indefinite"/>
  </rect>
</g>

<!-- 终点龙珠（脉动发光） -->
<circle cx="${280 + fillW}" cy="142" r="15" fill="rgba(255,215,0,0.2)">
  <animate attributeName="r" values="10;16;10" dur="2.4s" repeatCount="indefinite"/>
</circle>
<circle cx="${280 + fillW}" cy="142" r="9" fill="#ffd700">
  <animate attributeName="opacity" values="1;0.7;1" dur="2.4s" repeatCount="indefinite"/>
</circle>

<!-- 底部状态栏：状态文案（关键词高亮）+ 品质标签 -->
<text x="280" y="180" font-size="13" fill="#94a3b8">灵脉<tspan fill="#ffd700" font-weight="700">${s.status.kw}</tspan>${s.status.suffix}</text>
<rect x="696" y="164" width="82" height="24" rx="12" fill="rgba(255,215,0,0.12)" stroke="rgba(255,215,0,0.4)" stroke-width="1"/>
<text x="737" y="180" text-anchor="middle" font-size="12" fill="#ffd700">品质 · ${s.quality}</text>

<!-- ══ 底部：30 日晴雨表 ══ -->
${dots}
<text x="752" y="226" font-size="10" fill="#94a3b8">昨日</text>

</svg>`;
}
