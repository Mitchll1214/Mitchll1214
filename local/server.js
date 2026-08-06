// 本地开发服务器（零依赖）：node local/server.js → http://localhost:8787
import http from 'node:http';
import realmHandler from '../api/realm.js';
import petHandler from '../api/pet.js';

const PORT = process.env.PORT || 8787;

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/realm') return await realmHandler(req, res);
    if (url.pathname === '/api/pet') return await petHandler(req, res);
    if (url.pathname === '/' || url.pathname === '/preview') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(`<!DOCTYPE html><html lang="zh"><meta charset="utf-8">
<title>修仙主页 · 本地预览</title>
<body style="background:#0d1117;color:#e6e1f5;font-family:'PingFang SC',sans-serif;display:flex;flex-direction:column;gap:24px;align-items:center;padding:40px">
  <img src="/api/realm?user=Mitchll1214" alt="修仙档案"/>
  <img src="/api/pet?user=Mitchll1214" alt="灵宠"/>
</body></html>`);
      return;
    }
    res.statusCode = 404;
    res.end('404 Not Found');
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(`server error: ${err.message}`);
  }
});

server.listen(PORT, () => {
  console.log(`修仙主页本地服务已启动 → http://localhost:${PORT}`);
  console.log(`  预览页面  → http://localhost:${PORT}/preview`);
  console.log(`  境界卡    → http://localhost:${PORT}/api/realm?user=Mitchll1214`);
  console.log(`  灵宠卡    → http://localhost:${PORT}/api/pet?user=Mitchll1214`);
});
