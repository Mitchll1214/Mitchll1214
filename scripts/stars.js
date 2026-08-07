// 星图推衍 · 以行铸辰 / 今日星轨 · 勤修不辍 —— 两张星象数据卡（v2 自然星空渲染）。
// 数据来源（GitHub Actions 自动采集）：
//   - 历史累计提交数 totalCommits → 星图推衍等级 / 银河
//   - 今日提交数 todayCount → 今日星轨（北斗七星逐颗点亮）
// 全部为纯静态 SVG + SMIL 动画，零第三方依赖。

// ══ 数据计算区 ══

// 等级表：历史累计提交数 → 星图形态（星辰数随等级递增）
const STAGES = [
  { min: 1000, name: '万星朝宗', desc: '星河璀璨，有星辰汇聚成旋涡状', stars: 120 },
  { min: 500, name: '星域纵横', desc: '满天繁星，星河清晰', stars: 95 },
  { min: 200, name: '星河初成', desc: '密集星辰，隐约可见银河轮廓', stars: 70 },
  { min: 50, name: '星罗棋布', desc: '数十颗星，分布渐密', stars: 40 },
  { min: 10, name: '星火燎原', desc: '十余颗星，开始形成小簇', stars: 15 },
  { min: 1, name: '星尘初现', desc: '1-3 颗零散星辰，微弱光芒', stars: 3 },
  { min: 0, name: '星尘初现', desc: '星汉沉寂，待君点亮', stars: 0 },
];

/** 历史累计提交数 → 星图等级 */
export function starStageOf(total) {
  return STAGES.find((s) => total >= s.min) || STAGES[STAGES.length - 1];
}

// 确定性伪随机（固定种子，保证每次生成的星图位置稳定一致）
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 种子化高斯随机（Box-Muller），用于银河星点沿路径的垂直散布
function seededGauss(rnd) {
  let u = 0, v = 0;
  while (u === 0) u = rnd();
  while (v === 0) v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ══ 星空渲染工具 ══

/** 背景星尘：极小微光（纯氛围） */
function bgDust() {
  const rnd = mulberry32(777);
  let s = '';
  for (let i = 0; i < 30; i++) {
    const x = 16 + rnd() * 448;
    const y = 14 + rnd() * 188;
    const r = (0.4 + rnd() * 0.6).toFixed(1);
    const o = (0.06 + rnd() * 0.10).toFixed(2);
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#9fb0e8" opacity="${o}"/>`;
  }
  return s;
}

/** 数据星（等级星图）：大小/亮度分层 + 少量星芒点缀 */
function dataStars(n, seed = 1214) {
  const rnd = mulberry32(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const x = 30 + rnd() * 420;
    const y = 90 + rnd() * 94;
    const roll = rnd();
    let r, o, sparkle = false;
    if (roll < 0.72) { r = 0.6 + rnd() * 1.0; o = 0.30 + rnd() * 0.30; }        // 多数小星
    else if (roll < 0.94) { r = 1.5 + rnd() * 1.1; o = 0.7 + rnd() * 0.25; }    // 亮星
    else { r = 2.1 + rnd() * 0.7; o = 0.95; sparkle = true; }                    // 星芒星
    pts.push({ x, y, r, o, sparkle, twinkle: rnd() < 0.35, phase: rnd() });
  }
  return pts;
}

function dataStarSvg(p) {
  const tw = p.twinkle
    ? `<animate attributeName="opacity" values="${p.o};${Math.min(1, p.o + 0.3)};${p.o}" dur="${(2 + p.phase * 3).toFixed(1)}s" repeatCount="indefinite"/>`
    : '';
  const body = `<circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="#dfe8ff" opacity="${p.o}">${tw}</circle>`;
  if (!p.sparkle) return body;
  return `<g>${body}
  <path d="M${p.x} ${(p.y - p.r - 5).toFixed(1)} L${p.x} ${(p.y + p.r + 5).toFixed(1)} M${(p.x - p.r - 5).toFixed(1)} ${p.y} L${(p.x + p.r + 5).toFixed(1)} ${p.y}" stroke="#dfe8ff" stroke-opacity="0.8" stroke-width="0.8"/>
</g>`;
}

/**
 * 银河（星河初成 ≥200 时渲染）：
 * 真银河 = 无数细星聚成的雾状带，而非一条平滑粗线。
 * 实现：三层错位雾带（模糊）+ 沿路径高斯散布的星点带 + 淡虚线亮核。
 */
function renderGalaxy() {
  const rnd = mulberry32(24680);
  const P0 = [22, 188], P1 = [140, 112], P2 = [300, 152], P3 = [466, 86];
  const pt = (t) => {
    const a = 1 - t;
    return [
      a * a * a * P0[0] + 3 * a * a * t * P1[0] + 3 * a * t * t * P2[0] + t * t * t * P3[0],
      a * a * a * P0[1] + 3 * a * a * t * P1[1] + 3 * a * t * t * P2[1] + t * t * t * P3[1],
    ];
  };
  const norm = (t) => {
    const d = 0.02;
    const [x0, y0] = pt(Math.max(0, t - d));
    const [x1, y1] = pt(Math.min(1, t + d));
    const dx = x1 - x0, dy = y1 - y0;
    const L = Math.hypot(dx, dy) || 1;
    return [-dy / L, dx / L];
  };
  const d = `M ${P0[0]} ${P0[1]} C ${P1[0]} ${P1[1]}, ${P2[0]} ${P2[1]}, ${P3[0]} ${P3[1]}`;

  // 雾带：三条错位宽路径 + 强模糊（叠加成乳白雾状，而非单条带子）
  const fog = [-15, 0, 15].map((off, i) =>
    `<path d="${d}" fill="none" stroke="url(#galaxyGrad)" stroke-width="${20 - i * 5}" opacity="${0.30 - i * 0.09}" filter="url(#galaxyBlur)" transform="translate(0 ${off})"/>`,
  ).join('');

  // 星点带：沿路径 130 个高斯散布的细星，亮度随距中心距离衰减，两端渐隐
  let dots = '';
  for (let i = 0; i < 130; i++) {
    const t = 0.05 + rnd() * 0.9;
    const [px, py] = pt(t);
    const [nx, ny] = norm(t);
    const off = seededGauss(rnd) * 10;
    const f = Math.exp(-((off / 10) ** 2) / 2); // 距银河中心衰减
    if (f < 0.12) continue;
    const x = px + nx * off;
    const y = py + ny * off;
    const warm = rnd() > 0.8;
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.4 + f * 1.5).toFixed(1)}" fill="${warm ? '#ffe9b0' : '#e4ecff'}" opacity="${(0.22 + f * 0.6).toFixed(2)}"/>`;
  }

  return `<defs>
  <linearGradient id="galaxyGrad" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#e4ecff" stop-opacity="0"/>
    <stop offset="0.3" stop-color="#dbe4ff" stop-opacity="0.5"/>
    <stop offset="0.6" stop-color="#ffe9b0" stop-opacity="0.28"/>
    <stop offset="1" stop-color="#e4ecff" stop-opacity="0"/>
  </linearGradient>
  <filter id="galaxyBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
</defs>
${fog}
${dots}
<path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="0.14" stroke-width="1.2" stroke-dasharray="2 7"/>`;
}

/** 星体（亮 / 暗）：渐变核心 + 光晕 + 星芒，暗星保留微弱存在感 */
function starBody(x, y, r, lit) {
  if (lit) {
    return `<g>
  <circle cx="${x}" cy="${y}" r="${(r + 8).toFixed(1)}" fill="url(#haloGrad)"/>
  <circle cx="${x}" cy="${y}" r="${r}" fill="url(#coreGrad)">
    <animate attributeName="opacity" values="1;0.72;1" dur="2.2s" repeatCount="indefinite"/>
  </circle>
  <path d="M${x} ${(y - r - 4).toFixed(1)} L${x} ${(y + r + 4).toFixed(1)} M${(x - r - 4).toFixed(1)} ${y} L${(x + r + 4).toFixed(1)} ${y}" stroke="#fff7d6" stroke-opacity="0.85" stroke-width="0.9"/>
</g>`;
  }
  return `<g>
  <circle cx="${x}" cy="${y}" r="${(r * 0.62).toFixed(1)}" fill="#3d4d72" opacity="0.9"/>
  <circle cx="${x}" cy="${y}" r="${(r * 0.34).toFixed(1)}" fill="#8fa3d8" opacity="0.55"/>
</g>`;
}

// ══ SVG 模板区 ══

function svgShell(title, sub, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
 width="480"
 height="210"
 viewBox="0 0 480 210"
 role="img"
 font-family="system-ui, -apple-system, 'Noto Sans SC', sans-serif">

<defs>

<!-- 深空渐变（蓝紫深邃） -->
<radialGradient id="space" cx="50%" cy="36%" r="90%">
  <stop offset="0%" stop-color="#111635"/>
  <stop offset="55%" stop-color="#0b0f24"/>
  <stop offset="100%" stop-color="#05070f"/>
</radialGradient>

<!-- 星云光晕（靛蓝 / 紫） -->
<radialGradient id="nebA" cx="50%" cy="50%" r="50%">
  <stop offset="0%" stop-color="#5b6cff" stop-opacity="0.16"/>
  <stop offset="100%" stop-color="#5b6cff" stop-opacity="0"/>
</radialGradient>
<radialGradient id="nebB" cx="50%" cy="50%" r="50%">
  <stop offset="0%" stop-color="#c084fc" stop-opacity="0.10"/>
  <stop offset="100%" stop-color="#c084fc" stop-opacity="0"/>
</radialGradient>

<!-- 星体光芒 -->
<radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
  <stop offset="0%" stop-color="#ffd700" stop-opacity="0.42"/>
  <stop offset="100%" stop-color="#ffd700" stop-opacity="0"/>
</radialGradient>
<radialGradient id="coreGrad" cx="40%" cy="35%" r="75%">
  <stop offset="0%" stop-color="#ffffff"/>
  <stop offset="45%" stop-color="#ffe9a8"/>
  <stop offset="100%" stop-color="#e0a71e"/>
</radialGradient>

<filter id="nebBlur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="18"/></filter>

</defs>

<rect x="1" y="1" width="478" height="208" rx="16" fill="url(#space)" stroke="rgba(142,140,216,0.25)" stroke-width="1.5"/>

<!-- 星云光斑（不规则椭圆 + 模糊，柔和不生硬） -->
<g filter="url(#nebBlur)">
  <ellipse cx="368" cy="46" rx="150" ry="80" fill="url(#nebA)" transform="rotate(-18 368 46)"/>
  <ellipse cx="70" cy="178" rx="130" ry="85" fill="url(#nebB)" transform="rotate(22 70 178)"/>
  <ellipse cx="250" cy="128" rx="180" ry="58" fill="#3b82f6" opacity="0.05" transform="rotate(-6 250 128)"/>
</g>

<!-- 背景星尘 -->
${bgDust()}

<!-- 标题 -->
<text x="24" y="32" font-size="15" font-weight="700" fill="#E6E1F5" letter-spacing="1">${title}</text>
<text x="456" y="32" text-anchor="end" font-size="10" fill="#6F6888" letter-spacing="1">${sub}</text>

${body}

</svg>`;
}

/** 卡一：星图推衍 · 以行铸辰（历史累计提交数 → 星图等级与形态） */
export function renderStarMap(totalCommits) {
  const st = starStageOf(totalCommits);
  const stars = dataStars(st.stars).map(dataStarSvg).join('');
  const galaxy = totalCommits >= 200 ? renderGalaxy() : '';

  return svgShell('✨ 星图推衍 · 以行铸辰', 'HISTORY', `
<!-- 等级徽章 -->
<rect x="366" y="16" width="98" height="24" rx="12" fill="rgba(255,215,0,0.12)" stroke="rgba(255,215,0,0.45)" stroke-width="1"/>
<text x="415" y="32" text-anchor="middle" font-size="12" fill="#ffd700" letter-spacing="1">${st.name}</text>

<!-- 历史累计数值 -->
<text x="24" y="50" font-size="10" fill="#7A7393" letter-spacing="2">历 史 累 计</text>
<text x="24" y="86" font-size="36" font-weight="800" fill="#ffffff">${totalCommits}</text>
<text x="${24 + String(totalCommits).length * 22 + 10}" y="86" font-size="13" fill="#94a3b8">次行迹</text>

<!-- 银河（星河初成及以上） -->
${galaxy}

<!-- 星图 -->
${stars}

<!-- 形态描述 -->
<text x="24" y="196" font-size="11" fill="#7A7393">✦ ${st.desc}</text>
`);
}

/** 卡二：今日星轨 · 勤修不辍（今日提交数 → 北斗七星逐颗点亮） */
export function renderTrack(totalCommits, todayCount) {
  // 背景星尘：沿用累计星图（低透明度）
  const bg = dataStars(starStageOf(totalCommits).stars).map((p) => dataStarSvg({ ...p, o: p.o * 0.28, twinkle: false })).join('');

  // 北斗七星（天枢→天璇→天玑→天权→玉衡→开阳→摇光）：大小按真实亮度差异（天权最暗）
  const DIPPER = [
    { x: 148, y: 144, r: 6.8 }, // 天枢（亮）
    { x: 176, y: 119, r: 6.0 }, // 天璇
    { x: 208, y: 111, r: 5.4 }, // 天玑
    { x: 236, y: 121, r: 4.0 }, // 天权（最暗）
    { x: 253, y: 142, r: 6.4 }, // 玉衡（亮）
    { x: 274, y: 157, r: 5.0 }, // 开阳
    { x: 299, y: 173, r: 6.2 }, // 摇光
  ];
  // 每 1 次今日提交点亮 1 颗；未提交则 7 颗全暗
  const lit = Math.min(Math.max(todayCount, 0), 7);
  const hasToday = lit > 0;

  const line = `<polyline points="${DIPPER.map(({ x, y }) => `${x},${y}`).join(' ')}" fill="none" stroke="${hasToday ? 'rgba(255,215,0,0.22)' : 'rgba(190,200,230,0.14)'}" stroke-width="1" stroke-dasharray="1 4" stroke-linecap="round" stroke-linejoin="round"/>`;

  const stars = DIPPER
    .map(({ x, y, r }, i) => starBody(x, y, r, i < lit))
    .join('');

  return svgShell('🌠 今日星轨 · 勤修不辍', 'TODAY', `
<!-- 背景星尘 -->
${bg}

<!-- 北斗连线（极淡） -->
${line}

<!-- 北斗七星 -->
${stars}

<!-- 今日数值 -->
<text x="456" y="60" text-anchor="end" font-size="36" font-weight="800" fill="#ffffff">${todayCount}</text>
<text x="456" y="80" text-anchor="end" font-size="12" fill="#8fa3d8" letter-spacing="1">今日入道</text>

<!-- 底部状态 -->
<text x="24" y="196" font-size="11" fill="${hasToday ? '#ffd700' : '#7A7393'}">${hasToday ? `✦ 七星点亮 ${lit}/7` : '✦ 今日未入道 · 七星暗淡'}</text>
`);
}
