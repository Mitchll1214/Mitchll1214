// 轻量内存缓存 + 带超时/重试的 fetch。零依赖。
const store = new Map();
const MAX_ENTRIES = 64;

function evictIfNeeded() {
  if (store.size <= MAX_ENTRIES) return;
  // 简单 FIFO 清理：删最早写入的一半
  const keys = [...store.keys()];
  const drop = Math.ceil(keys.length / 2);
  for (let i = 0; i < drop; i++) store.delete(keys[i]);
}

export function cachedFetch(key, url, ttlMs, headers = {}, { retries = 1, timeoutMs = 6000 } = {}) {
  const hit = store.get(key);
  if (hit && Date.now() - hit.t < ttlMs) return Promise.resolve(hit.value);
  if (hit && hit.inflight) return hit.inflight;

  const run = async (attempt = 0) => {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; xianxia-profile/1.0; +https://github.com/Mitchll1214)', ...headers },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const text = await res.text();
      store.set(key, { t: Date.now(), value: text });
      evictIfNeeded();
      return text;
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
        return run(attempt + 1);
      }
      throw err;
    }
  };

  const p = run();
  const existing = store.get(key);
  if (existing) existing.inflight = p;
  else {
    store.set(key, { t: 0, inflight: p });
    evictIfNeeded();
  }
  p.finally(() => {
    const cur = store.get(key);
    if (cur && cur.inflight === p) delete cur.inflight;
  });
  return p;
}

export function clearCache() {
  store.clear();
}
