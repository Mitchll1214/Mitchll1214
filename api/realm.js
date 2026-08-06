// 修仙档案渲染库（境界由注册时长自动定境）
// 供 local/generate.js（GitHub Actions）与 local/server.js（本地预览）调用。
// 样式为「天道记录」金色手绘版，数据全部动态注入，保持每日自动更新。
import { getUser, getRepos } from './_lib/github.js';
import { computeRealm } from './_lib/realm.js';
import { esc } from './_lib/svg.js';

const LANG_COLORS = {
  Python: '#3572A5', JavaScript: '#F1E05A', TypeScript: '#3178C6', Vue: '#41B883',
  HTML: '#E34C26', CSS: '#563D7C', Go: '#00ADD8', Java: '#B07219', 'C#': '#178600',
  'C++': '#F34B7D', Rust: '#DEA584', Shell: '#89E051', Jupyter: '#DA5B0B',
  Dart: '#00B4AB', PHP: '#4F5D95', Kotlin: '#A97BFF', Swift: '#F05138',
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
  const updated = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).replace(/\//g, '-');

  const avatar = user.avatar_url || `https://avatars.githubusercontent.com/${username}`;
  const nextText = realmInfo.next
    ? `下一境：${realmInfo.next.name} · 预计 ${realmInfo.monthsToNext} 个月`
    : '已臻飞升 · 跳出三界外，不在五行中';

  // ── 灵根 chips（金色主题，随字符数自适应）──
  let linggen = '';
  if (repos && repos.topLangs.length) {
    let x = 72;
    const chips = repos.topLangs.slice(0, 3).map(([l]) => {
      const c = LANG_COLORS[l] || '#D8B478';
      const w = Math.max(56, l.length * 11 + 14);
      const chip = `<g>
        <rect x="${x}" y="116" width="${w}" height="22" rx="11" fill="#D8B478" fill-opacity="0.12" stroke="#D8B478" stroke-opacity="0.5" stroke-width="1"/>
        <circle cx="${x + 12}" cy="127" r="3" fill="#D8B478"/>
        <text x="${x + 22}" y="131" font-size="11" fill="#E8D7B5">${esc(l)}</text>
      </g>`;
      x += w + 8;
      return chip;
    });
    linggen = `<text x="24" y="132" font-size="11" fill="#8E8CD8">灵根</text>` + chips.join('');
  } else {
    linggen = `<text x="24" y="132" font-size="11" fill="#8E8CD8">灵根 · 未显</text>`;
  }

  // ── 属性四格（图标 + 数值 + 标签，数据动态）──
  const cells = [
    { v: `${realmInfo.days}`, k: '寿元' },
    { v: `${repos?.repos ?? user.public_repos ?? '-'}`, k: '洞府' },
    { v: `${repos?.stars ?? '-'}`, k: '法宝' },
    { v: `${user.followers ?? 0}`, k: '道众' },
  ];
  const cellX = [24, 134, 244, 354];
  const cellsSvg = cells
    .map((c, i) => `<g>
      <rect x="${cellX[i]}" y="238" width="102" height="42" rx="12" fill="#FFFFFF" fill-opacity="0.04" stroke="#8E8CD8" stroke-opacity="0.3" stroke-width="1"/>
      <text x="${cellX[i] + 51}" y="257" text-anchor="middle" font-size="16" fill="#F4E9D8" font-weight="700">${esc(c.v)}</text>
      <text x="${cellX[i] + 51}" y="272" text-anchor="middle" font-size="9" fill="#8E8CD8">${esc(c.k)}</text>
    </g>`)
    .join('');

  const progressW = Math.round((realmInfo.progress / 100) * 432);

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="480"
     height="300"
     viewBox="0 0 480 300"
     role="img"
     font-family="'PingFang SC','Microsoft YaHei','Noto Sans SC',sans-serif">

<defs>

<!-- 外框渐变 -->
<linearGradient id="frame"
                x1="0"
                y1="0"
                x2="1"
                y2="1">
    <stop offset="0" stop-color="#D8B478"/>
    <stop offset="0.5" stop-color="#8E8CD8"/>
    <stop offset="1" stop-color="#D96C6C"/>
</linearGradient>


<!-- 灵力进度 -->
<linearGradient id="energy"
                x1="0"
                y1="0"
                x2="1"
                y2="0">
    <stop offset="0"
          stop-color="#D8B478"/>
    <stop offset="1"
          stop-color="#FFE6A7"/>
</linearGradient>


<!-- 头像裁剪 -->
<clipPath id="avatar"
          clipPathUnits="userSpaceOnUse">
    <circle cx="50"
            cy="86"
            r="24"/>
</clipPath>


</defs>


<!-- 主卡片 -->

<rect x="1"
      y="1"
      width="478"
      height="298"
      rx="20"
      fill="#0D1117"
      fill-opacity="0.97"
      stroke="url(#frame)"
      stroke-width="2"/>



<!-- 标题 -->

<text x="24"
      y="34"
      font-size="14"
      fill="#F4E9D8"
      font-weight="700"
      letter-spacing="1">
☯ 修仙档案 · 天道记录
</text>


<text x="456"
      y="34"
      text-anchor="end"
      font-size="10"
      fill="#8E8CD8">
更新于 ${updated}
</text>



<!-- 分割线 -->

<line x1="24"
      y1="48"
      x2="456"
      y2="48"
      stroke="#8E8CD8"
      stroke-opacity="0.25"/>



<!-- 头像（href + xlink:href 双写，兼容旧渲染器） -->

<image
 href="${esc(avatar)}"
 xlink:href="${esc(avatar)}"
 x="26"
 y="62"
 width="48"
 height="48"
 clip-path="url(#avatar)"
 preserveAspectRatio="xMidYMid slice"/>


<circle cx="50"
        cy="86"
        r="25"
        fill="none"
        stroke="#D8B478"
        stroke-width="2"/>



<!-- 用户信息 -->

<text x="86"
      y="82"
      font-size="20"
      fill="#F4E9D8"
      font-weight="700">
${esc(user.name || username)}
</text>


<text x="86"
      y="101"
      font-size="11"
      fill="#8E8CD8">
@${esc(username)} · 入道 ${created.toISOString().slice(0, 10)}
</text>




<!-- 灵根 -->

${linggen}




<!-- 境界 -->

<text x="24"
      y="176"
      font-size="36"
      fill="#E8B86D"
      font-weight="800">
${esc(realmInfo.fullTitle)}
</text>



<text x="26"
      y="198"
      font-size="11"
      fill="#9A93B8">
${esc(nextText)}
</text>




<!-- 灵力条 -->

<rect x="24"
      y="212"
      width="432"
      height="10"
      rx="5"
      fill="#241F35"/>


<rect x="24"
      y="212"
      width="${progressW}"
      height="10"
      rx="5"
      fill="url(#energy)"/>


<text x="456"
      y="221"
      text-anchor="end"
      font-size="11"
      fill="#E8B86D">
${realmInfo.progress}%
</text>




<!-- 属性卡 -->

${cellsSvg}




<!-- 底部铭文 -->

<text x="456"
      y="294"
      text-anchor="end"
      font-size="9"
      fill="#8E8CD8"
      fill-opacity="0.35">
大道五十 · 天衍四九
</text>


</svg>`;
}
