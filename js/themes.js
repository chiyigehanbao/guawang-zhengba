// js/themes.js —— 主题化皮肤定义与解锁
// 每个主题覆盖:背景渐变 / 容器 / 危险线 / HUD 文字 / 装饰 emoji / 水果 emoji 与配色。
// 解锁门槛按「已达成成就数」计(见 P3 achievements.js)。当前主题持久化于 merge_watermelon_theme。
var achMod = require('./achievements');
var progMod = require('./progression');

var THEME_KEY = 'merge_watermelon_theme';
var PURCHASED_KEY = 'merge_watermelon_theme_bought';

var THEMES = {
  classic: {
    id: 'classic',
    name: '夏日水果',
    ach: 0,
    bg: ['#ffe3c2', '#ffcf9f'],
    container: 'rgba(255, 249, 235, 0.6)',
    containerStroke: 'rgba(141, 110, 99, 0.35)',
    dangerFill: 'rgba(255, 82, 82, 0.06)',
    dangerLine: 'rgba(255, 82, 82, 0.55)',
    hudCard: 'rgba(255, 249, 235, 0.62)',
    hudCardStroke: 'rgba(141, 110, 99, 0.35)',
    hudText: '#5d4037',
    hudSub: '#8d6e63',
    deco: [['🍇', 0.1, 0.16], ['🍒', 0.88, 0.1], ['🍊', 0.12, 0.7], ['🥝', 0.9, 0.68], ['🍉', 0.5, 0.58]],
    fruits: null,
    colors: null,
    rims: null,
    accent: '#e53935',
    bgGlow: 'rgba(255, 255, 255, 0.12)',
    ambient: [{ e: '🍃', n: 5, r: 13, rv: 5, spd: 14, sway: 8 }, { e: '✨', n: 3, r: 10, rv: 4, spd: 20, sway: 10 }]
  },
  space: {
    id: 'space',
    name: '星际太空',
    ach: 2,
    cost: 2000,
    bg: ['#141a3a', '#332a52'],
    container: 'rgba(26, 30, 70, 0.45)',
    containerStroke: 'rgba(150, 160, 255, 0.4)',
    dangerFill: 'rgba(255, 82, 82, 0.08)',
    dangerLine: 'rgba(255, 120, 120, 0.65)',
    hudCard: 'rgba(20, 26, 58, 0.5)',
    hudCardStroke: 'rgba(150, 160, 255, 0.35)',
    hudText: '#cfd4ff',
    hudSub: '#8b93c9',
    deco: [['🪐', 0.1, 0.16], ['🌙', 0.88, 0.1], ['☄️', 0.12, 0.7], ['🌌', 0.9, 0.68], ['⭐', 0.5, 0.58]],
    fruits: ['🪐', '🌙', '🌍', '☄️', '⭐', '🌕', '🛰️', '☀️', '🌌', '🌟', '👾'],
    colors: ['#7e57c2', '#42a5f5', '#26c6da', '#ab47bc', '#ffca28', '#5c6bc0', '#78909c', '#ff7043', '#8e24aa', '#fdd835', '#e53935'],
    rims: ['#4527a0', '#1565c0', '#00838f', '#6a1b9a', '#f9a825', '#283593', '#455a64', '#e64a19', '#4a148c', '#f9a825', '#b71c1c'],
    accent: '#7e57c2',
    bgGlow: 'rgba(130, 170, 255, 0.16)',
    ambient: [{ e: '⭐', n: 7, r: 12, rv: 6, spd: 16, sway: 12 }, { e: '✨', n: 5, r: 9, rv: 4, spd: 26, sway: 16 }]
  },
  hotpot: {
    id: 'hotpot',
    name: '火锅集市',
    ach: 4,
    cost: 4000,
    bg: ['#ff7043', '#a13d16'],
    container: 'rgba(120, 40, 20, 0.35)',
    containerStroke: 'rgba(255, 180, 120, 0.45)',
    dangerFill: 'rgba(0, 0, 0, 0.06)',
    dangerLine: 'rgba(255, 235, 200, 0.6)',
    hudCard: 'rgba(120, 40, 20, 0.45)',
    hudCardStroke: 'rgba(255, 180, 120, 0.35)',
    hudText: '#4a1f08',
    hudSub: '#7a4526',
    deco: [['🥘', 0.1, 0.16], ['🥬', 0.88, 0.1], ['🌶️', 0.12, 0.7], ['🍄', 0.9, 0.68], ['🍢', 0.5, 0.58]],
    fruits: ['🥬', '🍄', '🌶️', '🥔', '🥕', '🍖', '🥩', '🍤', '🥚', '🍢', '🫕'],
    colors: ['#9ccc65', '#8d6e63', '#e53935', '#c8a06a', '#ff8a65', '#a1887f', '#ef5350', '#ff7043', '#ffe082', '#e57373', '#d84315'],
    rims: ['#558b2f', '#5d4037', '#b71c1c', '#8d6e63', '#e64a19', '#6d4c41', '#c62828', '#e64a19', '#f9a825', '#c62828', '#8e2c0e'],
    accent: '#ff7043',
    bgGlow: 'rgba(255, 140, 80, 0.14)',
    ambient: [{ e: '💨', n: 6, r: 16, rv: 6, spd: 26, sway: 16 }, { e: '🌶️', n: 3, r: 12, rv: 4, spd: 10, sway: 8 }]
  },
  newyear: {
    id: 'newyear',
    name: '新春年货',
    ach: 6,
    cost: 6000,
    bg: ['#b71c1c', '#6d0f0f'],
    container: 'rgba(60, 8, 8, 0.4)',
    containerStroke: 'rgba(255, 200, 120, 0.45)',
    dangerFill: 'rgba(0, 0, 0, 0.12)',
    dangerLine: 'rgba(255, 230, 150, 0.65)',
    hudCard: 'rgba(60, 8, 8, 0.45)',
    hudCardStroke: 'rgba(255, 200, 120, 0.35)',
    hudText: '#ffe0b2',
    hudSub: '#ffab91',
    deco: [['🧧', 0.1, 0.16], ['🏮', 0.88, 0.1], ['🍊', 0.12, 0.7], ['🥟', 0.9, 0.68], ['🎊', 0.5, 0.58]],
    fruits: ['🧧', '🏮', '🍊', '🥟', '🍬', '🧨', '🐉', '🥁', '🌸', '🎆', '🎊'],
    colors: ['#ef5350', '#ff7043', '#ffca28', '#ffd54f', '#e91e63', '#d32f2f', '#f9a825', '#c62828', '#f8bbd0', '#ffb300', '#e53935'],
    rims: ['#c62828', '#e64a19', '#f9a825', '#f9a825', '#c2185b', '#8e1d1d', '#f57f17', '#8e1d1d', '#ec407a', '#f57f17', '#b71c1c'],
    accent: '#ffd54f',
    bgGlow: 'rgba(255, 90, 90, 0.12)',
    ambient: [{ e: '🎆', n: 4, r: 14, rv: 5, spd: 12, sway: 10 }, { e: '✨', n: 6, r: 10, rv: 4, spd: 30, sway: 18 }]
  },
  legend: {
    id: 'legend',
    name: '传说之金',
    ach: 9,
    cost: 10000,
    bg: ['#4a2c0a', '#1c1206'],
    container: 'rgba(70, 45, 12, 0.4)',
    containerStroke: 'rgba(255, 215, 0, 0.4)',
    dangerFill: 'rgba(0, 0, 0, 0.15)',
    dangerLine: 'rgba(255, 215, 0, 0.6)',
    hudCard: 'rgba(60, 38, 8, 0.45)',
    hudCardStroke: 'rgba(255, 215, 0, 0.35)',
    hudText: '#ffecb3',
    hudSub: '#c8a23c',
    deco: [['👑', 0.1, 0.16], ['🏆', 0.88, 0.1], ['⭐', 0.12, 0.7], ['💎', 0.9, 0.68], ['🎖️', 0.5, 0.58]],
    fruits: ['👑', '⭐', '🌟', '🎖️', '🏆', '🥇', '🥈', '🥉', '🎯', '🔥', '💎'],
    colors: ['#ffd54f', '#ffca28', '#ffecb3', '#ffb300', '#ffe082', '#ffd54f', '#cfd8dc', '#a1887f', '#ff7043', '#ff7043', '#26c6da'],
    rims: ['#b8860b', '#f9a825', '#c8a23c', '#f57f17', '#b8860b', '#b8860b', '#90a4ae', '#6d4c41', '#e64a19', '#e64a19', '#00838f'],
    accent: '#ffd700',
    bgGlow: 'rgba(255, 215, 0, 0.12)',
    ambient: [{ e: '✨', n: 7, r: 11, rv: 5, spd: 20, sway: 12 }, { e: '💫', n: 4, r: 14, rv: 5, spd: 14, sway: 8 }]
  },
  neon: {
    id: 'neon',
    name: '赛博霓虹',
    ach: 12,
    cost: 15000,
    bg: ['#0b0f2a', '#1b0b2e'],
    container: 'rgba(20, 10, 40, 0.5)',
    containerStroke: 'rgba(0, 255, 240, 0.5)',
    dangerFill: 'rgba(255, 0, 128, 0.08)',
    dangerLine: 'rgba(255, 0, 128, 0.7)',
    hudCard: 'rgba(20, 10, 40, 0.55)',
    hudCardStroke: 'rgba(0, 255, 240, 0.35)',
    hudText: '#e0ffff',
    hudSub: '#67e8f9',
    deco: [['🛸', 0.1, 0.16], ['🌐', 0.88, 0.1], ['💠', 0.12, 0.7], ['🔷', 0.9, 0.68], ['⚡', 0.5, 0.58]],
    fruits: ['💠', '🔷', '🌀', '🔶', '🔺', '🟣', '🟦', '🟩', '🟡', '🔴', '🌈'],
    colors: ['#00e5ff', '#18ffff', '#00bcd4', '#7c4dff', '#e040fb', '#3d5afe', '#00b0ff', '#00e676', '#ffea00', '#ff1744', '#b388ff'],
    rims: ['#00838f', '#00acc1', '#006064', '#4527a0', '#aa00ff', '#1a237e', '#0091ea', '#00c853', '#ffd600', '#d50000', '#7c4dff'],
    accent: '#00e5ff',
    bgGlow: 'rgba(0, 229, 255, 0.16)',
    ambient: [{ e: '💠', n: 6, r: 12, rv: 5, spd: 18, sway: 12 }, { e: '⚡', n: 4, r: 11, rv: 5, spd: 26, sway: 14 }]
  },
  festival: {
    id: 'festival',
    name: '焕新派对',
    ach: 16,
    cost: 20000,
    bg: ['#ff9a9e', '#a18cd1'],
    container: 'rgba(255, 255, 255, 0.28)',
    containerStroke: 'rgba(255, 255, 255, 0.5)',
    dangerFill: 'rgba(255, 82, 82, 0.08)',
    dangerLine: 'rgba(255, 82, 82, 0.6)',
    hudCard: 'rgba(255, 255, 255, 0.3)',
    hudCardStroke: 'rgba(255, 255, 255, 0.5)',
    hudText: '#4a2c6d',
    hudSub: '#7e57c2',
    deco: [['🎉', 0.1, 0.16], ['🎈', 0.88, 0.1], ['🎊', 0.12, 0.7], ['🍭', 0.9, 0.68], ['🎂', 0.5, 0.58]],
    fruits: ['🍬', '🍭', '🎈', '🧁', '🍩', '🎂', '🍰', '🍫', '🍦', '🎁', '🎊'],
    colors: ['#ff8a80', '#ff80ab', '#ea80fc', '#b388ff', '#8c9eff', '#82b1ff', '#80d8ff', '#84ffff', '#a7ffeb', '#b9f6ca', '#ffd180'],
    rims: ['#d50000', '#c51162', '#aa00ff', '#6200ea', '#304ffe', '#2962ff', '#0091ea', '#00b8d4', '#00bfa5', '#00c853', '#ff6d00'],
    accent: '#ea80fc',
    bgGlow: 'rgba(255, 255, 255, 0.18)',
    ambient: [{ e: '🎉', n: 5, r: 13, rv: 5, spd: 16, sway: 12 }, { e: '✨', n: 5, r: 10, rv: 4, spd: 24, sway: 14 }]
  }
};

function getThemeId() {
  try {
    var v = tt.getStorageSync(THEME_KEY);
    return THEMES[v] ? v : 'classic';
  } catch (e) {
    return 'classic';
  }
}

function setThemeId(id) {
  try {
    tt.setStorageSync(THEME_KEY, id);
  } catch (e) {}
}

function getTheme(id) {
  return THEMES[id] || THEMES.classic;
}

function getPurchased() {
  try {
    var a = tt.getStorageSync(PURCHASED_KEY);
    return (a instanceof Array) ? a : [];
  } catch (e) { return []; }
}

function isPurchased(id) {
  return getPurchased().indexOf(id) >= 0;
}

function isUnlocked(id) {
  var t = THEMES[id];
  if (!t) return false;
  if (isPurchased(id)) return true;
  return achMod.getUnlockedCount() >= (t.ach || 0);
}

// 金币解锁(仅限带 cost 的未解锁主题)
function buyTheme(id) {
  var t = THEMES[id];
  if (!t || !t.cost) return { ok: false, reason: 'nocost' };
  if (isUnlocked(id)) return { ok: false, reason: 'unlocked' };
  if (!progMod.spend(t.cost)) return { ok: false, reason: 'coins' };
  var arr = getPurchased().slice();
  arr.push(id);
  try { tt.setStorageSync(PURCHASED_KEY, arr); } catch (e) {}
  return { ok: true, cost: t.cost };
}

function getList() {
  return [THEMES.classic, THEMES.space, THEMES.hotpot, THEMES.newyear, THEMES.legend, THEMES.neon, THEMES.festival];
}

module.exports = {
  THEMES: THEMES,
  getThemeId: getThemeId,
  setThemeId: setThemeId,
  getTheme: getTheme,
  isUnlocked: isUnlocked,
  isPurchased: isPurchased,
  buyTheme: buyTheme,
  getList: getList
};
