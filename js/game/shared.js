// js/game/shared.js —— Game 各分块共用的常量与小工具

function hitRect(r, x, y) {
  return !!r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

var COLORS = [
  '#9c27b0', '#e53935', '#fb8c00', '#fdd835', '#7cb342',
  '#ef5350', '#f06292', '#e53935', '#66bb6a', '#43a047', '#ffca28'
];

var RIM_COLORS = [
  '#7b1fa2', '#b71c1c', '#ef6c00', '#f9a825', '#558b2f',
  '#c62828', '#c2185b', '#c62828', '#388e3c', '#2e7d32', '#f9a825'
];

var SPECIAL_STYLE = {
  bomb: { color: '#3e3e3e', rim: '#212121', emoji: '💣' },
  ice: { color: '#81d4fa', rim: '#0288d1', emoji: '🧊' },
  star: { color: '#ffd54f', rim: '#f9a825', emoji: '⭐' },
  magnet: { color: '#ba68c8', rim: '#7b1fa2', emoji: '🧲' }
};

var FRENZY_TOTAL = 60;
var DROP_COOLDOWN = 0.4;
var LOSE_DELAY = 1.8;
var AGE_RATING = '8+';
var HEALTH_NOTICE = [
  '抵制不良游戏,拒绝盗版游戏。注意自我保护,谨防受骗上当。',
  '适度游戏益脑,沉迷游戏伤身。合理安排时间,享受健康生活。'
];

var TIPS = [
  '💡 优先合成小果,腾出空间',
  '💡 危险时用重锤敲掉最高的果子',
  '💡 冰封期间新水果仍可堆叠',
  '💡 连击窗口内连续合成得分更高',
  '💡 集齐图鉴有额外奖励',
  '💡 天赋每局三选一,搭配出流派',
  '💡 弹床可把水果弹起制造连锁'
];

function fmt(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function shade(hex, f) {
  var n = parseInt(hex.slice(1), 16);
  var r = Math.min(255, Math.round(((n >> 16) & 255) * f));
  var g = Math.min(255, Math.round(((n >> 8) & 255) * f));
  var b = Math.min(255, Math.round((n & 255) * f));
  return '#' + ('00000' + (((r << 16) | (g << 8) | b).toString(16))).slice(-6);
}

function raf(cb) {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(cb);
  } else {
    setTimeout(cb, 16);
  }
}

function mixin(target, src) {
  for (var k in src) {
    if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
  }
  return target;
}

module.exports = {
  hitRect: hitRect,
  COLORS: COLORS,
  RIM_COLORS: RIM_COLORS,
  SPECIAL_STYLE: SPECIAL_STYLE,
  FRENZY_TOTAL: FRENZY_TOTAL,
  DROP_COOLDOWN: DROP_COOLDOWN,
  LOSE_DELAY: LOSE_DELAY,
  AGE_RATING: AGE_RATING,
  HEALTH_NOTICE: HEALTH_NOTICE,
  TIPS: TIPS,
  fmt: fmt,
  shade: shade,
  raf: raf,
  mixin: mixin
};
