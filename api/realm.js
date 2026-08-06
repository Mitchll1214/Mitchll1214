// 修仙档案渲染库（境界由注册时长自动定境）
// 供 local/generate.js（GitHub Actions）与 local/server.js（本地预览）调用。
import { getUser, getRepos } from './_lib/github.js';
import { computeRealm } from './_lib/realm.js';
import { svgWrap, text, bar, esc } from './_lib/svg.js';

const LANG_COLORS = {
  Python: '#3572A5', JavaScript: '#F1E05A', TypeScript: '#3178C6', Vue: '#41B883',
  HTML: '#E34C26', CSS: '#563D7C', Go: '#00ADD8', Java: '#B07219', 'C#': '#178600',
  'C++': '#F34B7D', Rust: '#DEA584', Shell: '#89E051', Jupyter: '#DA5B0B',
  Dart: '#00B4AB', PHP: '#4F5D95', Kotlin: '#A97BFF', Swift: '#F05138',
};

const lighten = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) + 55);
  const g = Math.min(255, ((n >> 8) & 255) + 55);
  const b = Math.min(255, (n & 255) + 55);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

export async function renderRealm(username, { data } = {}) {
  const [user, repos] = data
    ? [data.user, data.repoStats]
    : await Promise.all([
        getUser(username).catch(() => null),
        getRepos(username).catch(() => null),
      ]);
  if (!user) throw new Error(`无法获取用户 ${username} 的信息`);

  const created = new Date(user.created_at);
  const realmInfo = computeRealm(created.getTime());
  const color = realmInfo.realm.color;
  const updated = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).replace(/\//g, '-');

  const avatar = user.avatar_url || 'https://avatars.githubusercontent.com/Mitchll1214';
  const nextText = realmInfo.next
    ? `下一境：${realmInfo.next.name} · 还需约 ${realmInfo.monthsToNext} 个月`
    : '已臻飞升 · 跳出三界外，不在五行中';

  // ── 灵根 chips（横排，随字符数自适应）──
  let linggen = '';
  if (repos && repos.topLangs.length) {
    let x = 64;
    const chips = repos.topLangs.slice(0, 3).map(([l]) => {
      const c = LANG_COLORS[l] || '#8B949E';
      const w = l.length * 11 + 26;
      const chip = `<g>
        <rect x="${x}" y="108" width="${w}" height="20" rx="10" fill="rgba(255,255,255,0.05)" stroke="${c}" stroke-opacity="0.5" stroke-width="1"/>
        <circle cx="${x + 12}" cy="118" r="3.6" fill="${c}"/>
        <text x="${x + 21}" y="122" font-size="11" fill="#C9C3E0">${esc(l)}</text>
      </g>`;
      x += w + 6;
      return chip;
    });
    linggen = text({ x: 24, y: 122, s: '灵根', size: 11, fill: '#7A7393' }) + chips.join('');
  } else {
    linggen = text({ x: 24, y: 122, s: '灵根 · 未显', size: 11, fill: '#7A7393' });
  }

  // ── 属性四格（图标 + 数值 + 标签）──
  const cells = [
    { e: '☀️', v: `${realmInfo.days}`, k: '寿元（天）' },
    { e: '🏯', v: `${repos?.repos ?? user.public_repos ?? '-'}`, k: '洞府（仓库）' },
    { e: '⚔️', v: `${repos?.stars ?? '-'}`, k: '法宝（Star）' },
    { e: '👥', v: `${user.followers ?? 0}`, k: '道众（粉丝）' },
  ];
  const cw = 105;
  const gap = 4;
  const cy = 222;
  const ch = 58;
  const cellsSvg = cells
    .map((c, i) => {
      const x = 24 + i * (cw + gap);
      return `<g>
        <rect x="${x}" y="${cy}" width="${cw}" height="${ch}" rx="12" fill="rgba(255,255,255,0.05)" stroke="${color}" stroke-opacity="0.22" stroke-width="1"/>
        <text x="${x + 11}" y="${cy + 21}" font-size="12">${c.e}</text>
        ${text({ x: x + cw / 2, y: cy + 38, s: c.v, size: 17, weight: 700, anchor: 'middle', fill: '#F2EFFA' })}
        ${text({ x: x + cw / 2, y: cy + 53, s: c.k, size: 9.5, fill: '#8B84A8', anchor: 'middle' })}
      </g>`;
    })
    .join('');

  // ── 头像（圆角 16，境界色描边）──
  const avatarSvg = `
  <clipPath id="avclip"><rect x="24" y="42" width="56" height="56" rx="16"/></clipPath>
  <image href="${esc(avatar)}" x="24" y="42" width="56" height="56" clip-path="url(#avclip)"/>
  <rect x="24" y="42" width="56" height="56" rx="16" fill="none" stroke="${color}" stroke-width="2"/>
  <circle cx="30" cy="48" r="5" fill="${color}" opacity="0.35"/>`;

  const body = `
  ${text({ x: 24, y: 22, s: '☯ 修仙档案 · 自动定境', size: 14, weight: 700, fill: '#8E8CD8', spacing: 1 })}
  ${text({ x: 456, y: 22, s: `更新于 ${updated}`, size: 10, fill: '#6F6888', anchor: 'end' })}
  ${avatarSvg}
  ${text({ x: 96, y: 66, s: user.name || username, size: 21, weight: 700 })}
  ${text({ x: 96, y: 88, s: `@${esc(username)} · 注册于 ${created.toISOString().slice(0, 10)}`, size: 11, fill: '#7A7393' })}
  ${linggen}
  ${text({ x: 24, y: 162, s: realmInfo.fullTitle, size: 42, weight: 800, fill: color })}
  ${text({ x: 456, y: 162, s: `${realmInfo.progress}%`, size: 17, weight: 700, fill: lighten(color), anchor: 'end' })}
  ${text({ x: 24, y: 184, s: nextText, size: 11.5, fill: '#9A93B8' })}
  ${bar({ x: 24, y: 196, w: 432, h: 10, pct: realmInfo.progress, from: color, to: lighten(color) })}
  ${cellsSvg}
  <g opacity="0.5">
    <path d="M230 292 l10 0 M235 287 l0 10" stroke="#8E8CD8" stroke-width="1.2" fill="none"/>
  </g>`;

  return svgWrap({ width: 480, height: 300, body, border: color });
}
