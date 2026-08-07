// 星图推衍 · 以行铸辰 / 今日星轨 · 勤修不辍 —— 两张星象数据卡。
// 数据来源（GitHub Actions 自动采集）：
//   - 历史累计提交数 totalCommits（自有仓库 default 分支提交数之和）→ 星图推衍等级
//   - 今日提交数 todayCount → 今日星轨
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

// 确定性伪随机（固定种子，保证两张卡每次生成的星图位置稳定一致）
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

/** 生成 n 颗星辰坐标（固定种子 → 星图推衍与今日星轨共用同一片基础星图） */
export function starPoints(n, seed = 1214, yMin = 92, yMax = 186) {
  const rnd = mulberry32(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    pts.push({
      x: Math.round(36 + rnd() * 408),
      y: Math.round(yMin + rnd() * (yMax - yMin)),
      r: +(1.2 + rnd() * 1.6).toFixed(1),
      o: +(0.45 + rnd() * 0.55).toFixed(2),
      t: rnd(), // 微光动画时长因子
    });
  }
  return pts;
}

/** 单颗星辰 SVG（dim=true 为低透明度"已有"星辰，twinkle=true 附加微光动画） */
function starSvg(p, { dim = false, twinkle = false } = {}) {
  const fill = dim ? '#5b6b8c' : '#dfe8ff';
  const op = dim ? 0.22 : p.o;
  const tw = twinkle
    ? `<animate attributeName="opacity" values="${op};${Math.min(1, op + 0.3)};${op}" dur="${(2 + p.t * 3).toFixed(1)}s" repeatCount="indefinite"/>`
    : '';
  return `<circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="${fill}" opacity="${op}">${tw}</circle>`;
}

// 贝塞尔弧线上的第 i/n 个点（今日星轨）
function arcPoint(i, n) {
  const t = n === 1 ? 0.5 : i / (n - 1);
  const x = (1 - t) ** 2 * 50 + 2 * (1 - t) * t * 240 + t ** 2 * 440;
  const y = (1 - t) ** 2 * 176 + 2 * (1 - t) * t * 44 + t ** 2 * 132;
  return [Math.round(x), Math.round(y)];
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

<!-- 深空背景 -->
<radialGradient id="space" cx="50%" cy="38%" r="85%">
  <stop offset="0%" stop-color="#0B1020"/>
  <stop offset="100%" stop-color="#05070D"/>
</radialGradient>

</defs>

<rect x="1" y="1" width="478" height="208" rx="16" fill="url(#space)" stroke="rgba(142,140,216,0.25)" stroke-width="1.5"/>

<!-- 标题 -->
<text x="24" y="32" font-size="15" font-weight="700" fill="#E6E1F5" letter-spacing="1">${title}</text>
<text x="456" y="32" text-anchor="end" font-size="10" fill="#6F6888">${sub}</text>

${body}

</svg>`;
}

/** 卡一：星图推衍 · 以行铸辰（历史累计提交数 → 星图等级与形态） */
export function renderStarMap(totalCommits) {
  const st = starStageOf(totalCommits);
  const pts = starPoints(st.stars);
  const stars = pts.map((p) => starSvg(p, { twinkle: true })).join('');

  return svgShell('✨ 星图推衍 · 以行铸辰', 'HISTORY', `
<!-- 等级徽章 -->
<rect x="382" y="18" width="76" height="22" rx="11" fill="rgba(255,215,0,0.14)" stroke="rgba(255,215,0,0.45)" stroke-width="1"/>
<text x="420" y="33" text-anchor="middle" font-size="11" fill="#ffd700">${st.name}</text>

<!-- 历史累计数值 -->
<text x="24" y="76" font-size="34" font-weight="800" fill="#ffffff">${totalCommits}</text>
<text x="${24 + String(totalCommits).length * 21 + 10}" y="76" font-size="14" fill="#94a3b8">次行迹 · 以行铸辰</text>

<!-- 星图 -->
${stars}

<!-- 形态描述 -->
<text x="24" y="196" font-size="11" fill="#7A7393">✦ ${st.desc}</text>
`);
}

/** 卡二：今日星轨 · 勤修不辍（今日提交数 → 今日星辰沿弧线缀入星图） */
export function renderTrack(totalCommits, todayCount) {
  // 基础星图：沿用累计星图的同一片星辰（低透明度表示"已有"）
  const base = starPoints(starStageOf(totalCommits).stars);
  const baseSvg = base.map((p) => starSvg(p, { dim: true })).join('');

  const n = Math.min(Math.max(todayCount, 0), 14);
  const hasToday = todayCount > 0;

  // 今日星轨弧线（象征"轨迹"）
  const arcPath = 'M50 176 C 240 44, 240 44, 440 132';
  const trackLine = `<path d="${arcPath}" fill="none" stroke="rgba(255,215,0,0.35)" stroke-width="1.2" stroke-dasharray="3 6"/>`;

  // 今日新增：高亮金色大星（6px 发光），沿弧线排布
  const todayStars = hasToday
    ? Array.from({ length: n }, (_, i) => {
        const [x, y] = arcPoint(i, n);
        return `<g>
  <circle cx="${x}" cy="${y}" r="11" fill="rgba(255,215,0,0.20)"/>
  <circle cx="${x}" cy="${y}" r="6" fill="#ffd700">
    <animate attributeName="opacity" values="1;0.55;1" dur="1.8s" repeatCount="indefinite"/>
  </circle>
</g>`;
      }).join('')
    : `<circle cx="240" cy="128" r="5" fill="#4a5568" opacity="0.55"/>`;

  return svgShell('🌠 今日星轨 · 勤修不辍', 'TODAY', `
<!-- 基础星图（已有星辰，低透明度） -->
${baseSvg}

<!-- 今日轨迹弧线 -->
${trackLine}

<!-- 今日星辰 -->
${todayStars}

<!-- 今日数值 -->
<text x="24" y="76" font-size="34" font-weight="800" fill="#ffffff">${hasToday ? todayCount : 0}</text>
<text x="${24 + String(hasToday ? todayCount : 0).length * 21 + 10}" y="76" font-size="14" fill="#94a3b8">${hasToday ? '次入道 · 勤修不辍' : '今日未入道'}</text>

<!-- 底部状态 -->
<text x="24" y="196" font-size="11" fill="${hasToday ? '#ffd700' : '#7A7393'}">${hasToday ? '✦ 今日星辰已缀入星轨' : '✦ 星轨沉寂，明日再续'}</text>
`);
}
