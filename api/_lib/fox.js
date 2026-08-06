// 手绘 Q 版仙狐「小九」SVG。
// 以头部中心 (cx, cy) 为原点绘制坐姿狐狸，随阶段长出尾巴，随心情切换表情。

const FUR = '#F2A65A';        // 主毛色
const FUR_DARK = '#D98A4A';   // 深毛/描边
const BELLY = '#FFF3E0';      // 肚皮
const EAR_IN = '#F2A0B0';     // 内耳
const LINE = '#5A4326';       // 五官
const CHEEK = 'rgba(242,160,176,0.55)';

function ears(cx, cy) {
  return `
  <path d="M${cx - 50} ${cy - 14} L${cx - 68} ${cy - 68} L${cx - 20} ${cy - 36} Z" fill="${FUR}" stroke="${FUR_DARK}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M${cx - 44} ${cy - 22} L${cx - 56} ${cy - 58} L${cx - 26} ${cy - 36} Z" fill="${EAR_IN}"/>
  <path d="M${cx + 50} ${cy - 14} L${cx + 68} ${cy - 68} L${cx + 20} ${cy - 36} Z" fill="${FUR}" stroke="${FUR_DARK}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M${cx + 44} ${cy - 22} L${cx + 56} ${cy - 58} L${cx + 26} ${cy - 36} Z" fill="${EAR_IN}"/>`;
}

function tails(cx, cy, count) {
  // 主尾：从身体右侧 (cx+28, cy+92) 甩出一卷勾尾
  const main = `
  <path d="M${cx + 28} ${cy + 92} C${cx + 74} ${cy + 102}, ${cx + 106} ${cy + 78}, ${cx + 100} ${cy + 44}
    C${cx + 95} ${cy + 14}, ${cx + 66} ${cy + 6}, ${cx + 60} ${cy + 26}
    C${cx + 55} ${cy + 42}, ${cx + 74} ${cy + 48}, ${cx + 82} ${cy + 36} Z"
    fill="${FUR}" stroke="${FUR_DARK}" stroke-width="2" stroke-linejoin="round"/>`;
  const tip = `<ellipse cx="${cx + 86}" cy="${cy + 30}" rx="9" ry="6" fill="${BELLY}" opacity="0.95"/>`;
  let out = '';
  if (count >= 3) {
    out += `<path d="M${cx + 20} ${cy + 96} C${cx + 52} ${cy + 112}, ${cx + 88} ${cy + 96}, ${cx + 86} ${cy + 62} C${cx + 84} ${cy + 36}, ${cx + 58} ${cy + 30}, ${cx + 54} ${cy + 48} C${cx + 51} ${cy + 62}, ${cx + 70} ${cy + 66}, ${cx + 76} ${cy + 56} Z" fill="rgba(242,166,90,0.35)"/>`;
    out += `<path d="M${cx + 38} ${cy + 88} C${cx + 88} ${cy + 92}, ${cx + 118} ${cy + 66}, ${cx + 112} ${cy + 32} C${cx + 107} ${cy + 4}, ${cx + 78} ${cy + -2}, ${cx + 72} ${cy + 18} C${cx + 68} ${cy + 34}, ${cx + 86} ${cy + 40}, ${cx + 94} ${cy + 28} Z" fill="rgba(242,166,90,0.35)"/>`;
  }
  out += main + tip;
  if (count >= 5) {
    out += `<path d="M${cx + 10} ${cy + 98} C${cx + 40} ${cy + 118}, ${cx + 80} ${cy + 106}, ${cx + 80} ${cy + 72} C${cx + 80} ${cy + 48}, ${cx + 54} ${cy + 42}, ${cx + 50} ${cy + 58} C${cx + 47} ${cy + 72}, ${cx + 64} ${cy + 76}, ${cx + 70} ${cy + 66} Z" fill="rgba(242,166,90,0.22)"/>`;
    out += `<path d="M${cx + 46} ${cy + 80} C${cx + 96} ${cy + 82}, ${cx + 126} ${cy + 56}, ${cx + 120} ${cy + 22} C${cx + 115} ${cy + -6}, ${cx + 86} ${cy + -10}, ${cx + 80} ${cy + 10} C${cx + 76} ${cy + 26}, ${cx + 94} ${cy + 32}, ${cx + 102} ${cy + 20} Z" fill="rgba(242,166,90,0.22)"/>`;
  }
  return out;
}

function eyes(mood, cx, cy) {
  const y = cy + 6;
  const x1 = cx - 28;
  const x2 = cx + 28;
  if (mood === 'cultivate') {
    return `<path d="M${x1 - 6} ${y} Q${x1} ${y - 8} ${x1 + 6} ${y}" stroke="${LINE}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M${x2 - 6} ${y} Q${x2} ${y - 8} ${x2 + 6} ${y}" stroke="${LINE}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }
  if (mood === 'drowsy') {
    return `<path d="M${x1 - 6} ${y} Q${x1} ${y + 6} ${x1 + 6} ${y}" stroke="${LINE}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M${x2 - 6} ${y} Q${x2} ${y + 6} ${x2 + 6} ${y}" stroke="${LINE}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }
  if (mood === 'sleep') {
    return `<path d="M${x1 - 6} ${y} L${x1 + 6} ${y}" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>
  <path d="M${x2 - 6} ${y} L${x2 + 6} ${y}" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>`;
  }
  // hungry：圆眼
  return `<circle cx="${x1}" cy="${y}" r="4.5" fill="${LINE}"/>
  <circle cx="${x2}" cy="${y}" r="4.5" fill="${LINE}"/>
  <circle cx="${x1 - 1}" cy="${y - 1}" r="1.4" fill="#fff"/><circle cx="${x2 - 1}" cy="${y - 1}" r="1.4" fill="#fff"/>`;
}

function face(cx, cy, mood) {
  return `
  <ellipse cx="${cx - 42}" cy="${cy + 18}" rx="9" ry="5.5" fill="${CHEEK}"/>
  <ellipse cx="${cx + 42}" cy="${cy + 18}" rx="9" ry="5.5" fill="${CHEEK}"/>
  <ellipse cx="${cx}" cy="${cy + 14}" rx="3.2" ry="2.6" fill="${LINE}"/>
  ${eyes(mood, cx, cy)}
  ${mouth(mood, cx, cy)}`;
}

function mouth(mood, cx, cy) {
  const my = cy + 22;
  if (mood === 'cultivate') return `<path d="M${cx - 4} ${my - 2} Q${cx} ${my + 3} ${cx + 4} ${my - 2}" stroke="${LINE}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  if (mood === 'hungry') return `<ellipse cx="${cx}" cy="${my + 1}" rx="3.6" ry="4" fill="none" stroke="${LINE}" stroke-width="2"/>`;
  if (mood === 'drowsy') return `<circle cx="${cx}" cy="${my}" r="2" fill="${LINE}"/>`;
  return `<path d="M${cx - 4} ${my - 2} Q${cx} ${my + 2} ${cx + 4} ${my - 2}" stroke="${LINE}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
}

function body(cx, cy) {
  return `
  <ellipse cx="${cx}" cy="${cy + 82}" rx="50" ry="44" fill="${FUR}" stroke="${FUR_DARK}" stroke-width="2.5"/>
  <ellipse cx="${cx}" cy="${cy + 90}" rx="30" ry="27" fill="${BELLY}"/>
  <ellipse cx="${cx - 22}" cy="${cy + 120}" rx="12" ry="9" fill="${FUR}" stroke="${FUR_DARK}" stroke-width="2"/>
  <ellipse cx="${cx + 22}" cy="${cy + 120}" rx="12" ry="9" fill="${FUR}" stroke="${FUR_DARK}" stroke-width="2"/>`;
}

function head(cx, cy) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="54" ry="48" fill="${FUR}" stroke="${FUR_DARK}" stroke-width="2.5"/>
  <path d="M${cx - 4} ${cy - 46} Q${cx} ${cy - 62} ${cx - 8} ${cy - 68}" stroke="${FUR_DARK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
}

/**
 * 完整狐狸。cx/cy = 头部中心。
 * stageIdx：0=灵蛋（只画蛋）；1..4 = 尾巴 1/1/3/5 条。
 */
export function drawFox({ stageIdx, mood, cx = 140, cy = 148, dim = false }) {
  if (stageIdx === 0) {
    return `<g opacity="${dim ? 0.65 : 1}">
    <ellipse cx="${cx}" cy="${cy + 24}" rx="40" ry="6" fill="rgba(0,0,0,0.18)"/>
    <ellipse cx="${cx}" cy="${cy}" rx="46" ry="58" fill="#F6ECD8" stroke="#D9C49A" stroke-width="2.5"/>
    <ellipse cx="${cx - 16}" cy="${cy - 24}" rx="10" ry="6" fill="#fff" opacity="0.55"/>
    <path d="M${cx - 8} ${cy + 42} L${cx} ${cy + 32} L${cx - 4} ${cy + 24}" stroke="#C9B187" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M${cx + 12} ${cy + 36} L${cx + 18} ${cy + 28}" stroke="#C9B187" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  </g>`;
  }
  const tailsCount = stageIdx >= 4 ? 5 : stageIdx >= 3 ? 3 : 1;
  return `<g opacity="${dim ? 0.7 : 1}">
  ${tails(cx, cy, tailsCount)}
  ${body(cx, cy)}
  ${head(cx, cy)}
  ${ears(cx, cy)}
  ${face(cx, cy, mood)}
</g>`;
}

/** 心情装饰（云/星/zZ），出现在头顶上方，cy 为头部中心 */
export function moodDecor(mood, cx = 140, cy = 148) {
  const top = cy - 96;
  if (mood === 'cultivate') {
    return `<g>
      <ellipse cx="${cx - 40}" cy="${top + 8}" rx="17" ry="11" fill="rgba(255,255,255,0.7)"/>
      <ellipse cx="${cx - 53}" cy="${top + 12}" rx="10" ry="7" fill="rgba(255,255,255,0.55)"/>
      <ellipse cx="${cx - 28}" cy="${top + 13}" rx="10" ry="7" fill="rgba(255,255,255,0.55)"/>
      <polygon points="${cx + 42},${top - 2} ${cx + 45},${top + 5} ${cx + 52},${top + 8} ${cx + 45},${top + 11} ${cx + 42},${top + 18} ${cx + 39},${top + 11} ${cx + 32},${top + 8} ${cx + 39},${top + 5}" fill="#FFD98A"/>
      <polygon points="${cx - 8},${top - 10} ${cx - 6},${top - 6} ${cx - 2},${top - 4} ${cx - 6},${top - 2} ${cx - 8},${top + 2} ${cx - 10},${top - 2} ${cx - 14},${top - 4} ${cx - 10},${top - 6}" fill="#C8B8F0"/>
    </g>`;
  }
  if (mood === 'hungry') {
    return `<g><text x="${cx + 64}" y="${top + 12}" font-size="24" font-weight="800" fill="#E0A526" text-anchor="middle">!</text></g>`;
  }
  if (mood === 'drowsy') {
    return `<g><text x="${cx + 52}" y="${top + 8}" font-size="16" fill="#9AA3C0" font-style="italic">z</text></g>`;
  }
  return `<g fill="#9AA3C0" font-style="italic" font-weight="700">
    <text x="${cx + 46}" y="${top + 8}" font-size="18" opacity="0.85">z</text>
    <text x="${cx + 60}" y="${top - 6}" font-size="26" opacity="0.9">Z</text>
    <text x="${cx + 78}" y="${top - 22}" font-size="34">Z</text>
  </g>`;
}
