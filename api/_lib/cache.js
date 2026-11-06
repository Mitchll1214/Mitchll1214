// 轻量内存缓存 + 带超时/重试的 fetch。零依赖。
// 注意：缓存是进程级的；GitHub Actions 每次运行都是新进程，因此不会跨运行复用过期数据。
const store = new Map(); // key -> { t, value, inflight }
const MAX_ENTRIES = 64;

function evictIfNeeded() {
  if (store.size <= MAX_ENTRIES) return;
  // 先删"已完成且最旧"的条目（Map 迭代顺序 = 插入顺序）
  for (const [k, v] of store) {
    if (store.size <= MAX_ENTRIES) return;
    if (!v.inflight) store.delete(k);
  }
  // 仍然超限（极端并发）：只能跳过 inflight，允许暂时超限
}

async function fetchWithRetry(url, headers, retries, timeoutMs) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; xianxia-profile/1.0; +https://github.com/Mitchll1214)', ...headers },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.text();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
    }
  }
  throw lastErr;
}

export function cachedFetch(key, url, ttlMs, headers = {}, { retries = 1, timeoutMs = 6000 } = {}) {
  const hit = store.get(key);
  // 命中未完成请求：直接复用，避免并发重复请求
  if (hit?.inflight) return hit.inflight;
  // 命中未过期结果
  if (hit && hit.value !== undefined && Date.now() - hit.t < ttlMs) return Promise.resolve(hit.value);

  const p = fetchWithRetry(url, headers, retries, timeoutMs).then((text) => {
    store.set(key, { t: Date.now(), value: text });
    evictIfNeeded();
    return text;
  });

  // 占位条目：让并发的同 key 请求复用同一个 promise
  store.set(key, { t: 0, value: undefined, inflight: p });
  evictIfNeeded();

  // 失败时清理占位，避免把 rejected promise 一直留在缓存里；
  // 用 then(ok, err) 而非 finally，避免产生未处理的 rejection
  const cleanup = () => {
    const cur = store.get(key);
    if (cur && cur.inflight === p) {
      if (cur.value === undefined) store.delete(key);
      else delete cur.inflight;
    }
  };
  p.then(cleanup, cleanup);
  return p;
}

export function clearCache() {
  store.clear();
}
