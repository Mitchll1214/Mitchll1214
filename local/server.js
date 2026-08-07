// 本地开发服务器（零依赖）：node local/server.js → http://localhost:8787
import http from 'node:http';
import { renderRealm } from '../api/realm.js';
import { renderPet } from '../api/pet.js';

const PORT = process.env.PORT || 8787;
const USER = process.argv[2] || 'Mitchll1214';

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const user = url.searchParams.get('user') || USER;
    let svg;
    if (url.pathname === '/api/realm') svg = await renderRealm(user);
    else if (url.pathname === '/api/pet') svg = await renderPet(user);
    else if (url.pathname === '/' || url.pathname === '/preview') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(`<!DOCTYPE html><html lang="zh"><meta charset="utf-8">
<title>修仙主页 · 本地预览</title>
<body style="background:#0d1117;color:#e6e1f5;font-family:'PingFang SC',sans-serif;display:flex;flex-direction:column;gap:24px;align-items:center;padding:40px">
  <img src="images/banner.svg" alt="道号"/>
  <img src="images/realm.svg" alt="修仙档案"/>
  <img src="images/pet.svg" alt="灵宠"/>
  <img src="images/graph.svg" alt="修行年鉴"/>
  <img src="images/stats.svg" alt="修行记录"/>
  <img src="images/langs.svg" alt="灵根"/>
  <img src="images/stars.svg" alt="星图推衍"/>
  <br><br>
  <img src="images/track.svg" alt="今日星轨"/>
  <img src="images/trophy.svg" alt="修行成就"/>
</body></html>`);
      return;
    } else {
      res.statusCode = 404;
      res.end('404 Not Found');
      return;
    }
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.end(svg);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(`server error: ${err.message}`);
  }
});

server.listen(PORT, () => {
  console.log(`修仙主页本地服务已启动 → http://localhost:${PORT}`);
  console.log(`  预览页面 → http://localhost:${PORT}/preview（读取 images/ 快照）`);
  console.log(`  实时渲染 → http://localhost:${PORT}/api/realm?user=${USER}`);
});
