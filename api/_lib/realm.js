// 修仙境界系统：按注册 GitHub 的时长自动定境。
// 从"练气"到"飞升"，境界内再分 初期/中期/后期。

const YEAR = 365.25 * 86400e3;

export const REALMS = [
  { name: '练气', minYears: 0,  maxYears: 1,  color: '#9FB4C7',  glow: 'rgba(159,180,199,.35)' },
  { name: '筑基', minYears: 1,  maxYears: 2,  color: '#4FA3A3',  glow: 'rgba(79,163,163,.35)' },
  { name: '金丹', minYears: 2,  maxYears: 3,  color: '#E0A526',  glow: 'rgba(224,165,38,.35)' },
  { name: '元婴', minYears: 3,  maxYears: 5,  color: '#8E8CD8',  glow: 'rgba(142,140,216,.35)' },
  { name: '化神', minYears: 5,  maxYears: 8,  color: '#D96C6C',  glow: 'rgba(217,108,108,.35)' },
  { name: '炼虚', minYears: 8,  maxYears: 12, color: '#5B7BB4',  glow: 'rgba(91,123,180,.35)' },
  { name: '合体', minYears: 12, maxYears: 16, color: '#7A5C9E',  glow: 'rgba(122,92,158,.35)' },
  { name: '大乘', minYears: 16, maxYears: 20, color: '#C9B458',  glow: 'rgba(201,180,88,.35)' },
  { name: '渡劫', minYears: 20, maxYears: 25, color: '#B0457E',  glow: 'rgba(176,69,126,.35)' },
  { name: '飞升', minYears: 25, maxYears: Infinity, color: '#A78BFA', glow: 'rgba(167,139,250,.4)' },
];

export function computeRealm(registeredAt, now = Date.now()) {
  const years = Math.max(0, (now - registeredAt) / YEAR);
  const idx = REALMS.findIndex((r) => years < r.maxYears);
  const realm = REALMS[idx >= 0 ? idx : REALMS.length - 1];

  const span = Math.min(realm.maxYears, years) - realm.minYears;
  const total = realm.maxYears - realm.minYears;
  const progress = realm.maxYears === Infinity ? 100 : Math.min(100, Math.max(0, (span / total) * 100));

  const sub = progress < 35 ? '初期' : progress < 75 ? '中期' : '后期';
  const fullTitle = realm.name === '飞升' ? '飞升·仙' : `${realm.name}·${sub}`;

  const days = Math.floor((now - registeredAt) / 86400e3);
  const next = REALMS[idx + 1] || null;
  const monthsToNext = next
    ? Math.max(0, Math.ceil((next.maxYears - years) * 12))
    : 0;

  return { years, days, realm, sub, progress: Math.round(progress), fullTitle, next, monthsToNext };
}
