// 极简 SVG 拼装工具（零依赖）。
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function svgWrap({ width, height, body, bg = 'rgba(13,17,23,0.96)', border = '#8E8CD8' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" font-family="'PingFang SC','Microsoft YaHei','Noto Sans SC',sans-serif">
<defs>
  <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${border}" stop-opacity="0.9"/>
    <stop offset="1" stop-color="#3A3560" stop-opacity="0.9"/>
  </linearGradient>
</defs>
<rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="18" fill="${bg}" stroke="url(#frame)" stroke-width="2"/>
${body}
</svg>`;
}

export function text({ x, y, s, size = 14, fill = '#E6E1F5', anchor = 'start', weight = 400, opacity = 1, spacing = 0 }) {
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}" opacity="${opacity}" letter-spacing="${spacing}">${esc(s)}</text>`;
}

export function roundRect(x, y, w, h, r) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}"/>`;
}

export function bar({ x, y, w, h = 8, r = 4, pct, from, to, track = 'rgba(255,255,255,0.10)' }) {
  const id = `bar${Math.round(x)}${Math.round(y)}`;
  const width = Math.max(0, Math.min(100, pct));
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${track}"/>
<rect x="${x}" y="${y}" width="${(w * width) / 100}" height="${h}" rx="${r}" fill="url(#${id})"/>
<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>`;
}

export function star(cx, cy, r, fill = '#FFD98A', opacity = 0.9) {
  // 四角星（✦）
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.38;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" opacity="${opacity}"/>`;
}

export function cloud(x, y, s = 1, fill = 'rgba(255,255,255,0.75)') {
  return `<g transform="translate(${x},${y}) scale(${s})" fill="${fill}">
  <ellipse cx="0" cy="0" rx="16" ry="10"/>
  <ellipse cx="-12" cy="3" rx="9" ry="7"/>
  <ellipse cx="12" cy="3" rx="9" ry="7"/>
  <ellipse cx="0" cy="-6" rx="11" ry="8"/>
</g>`;
}

export function badge(x, y, label, color, w = 'auto', fontSize = 11) {
  const width = w === 'auto' ? label.length * fontSize + 18 : w;
  return `<g><rect x="${x}" y="${y}" width="${width}" height="22" rx="11" fill="${color}" opacity="0.16" stroke="${color}" stroke-width="1.2"/>
<text x="${x + width / 2}" y="${y + 15.5}" font-size="${fontSize}" fill="${color}" text-anchor="middle" font-weight="600" letter-spacing="1">${esc(label)}</text></g>`;
}
