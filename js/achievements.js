// js/achievements.js —— 成长收集:水果图鉴 + 成就 + 称号
// 纯本地持久化(tt.setStorageSync),不依赖网络/平台特殊权限。
var COLLECTION_KEY = 'merge_watermelon_collection';
var ACH_KEY = 'merge_watermelon_achievements';
var MAX_COMBO_KEY = 'merge_watermelon_max_combo';
var MAX_LEVEL_KEY = 'merge_watermelon_max_level';
var USED_SPECIALS_KEY = 'merge_watermelon_used_specials';
var FRUIT_COUNTS_KEY = 'merge_watermelon_fruit_counts';

var mem = {};
var hit = {};

function cloneFallback(fallback) {
  if (fallback instanceof Array) return [];
  if (fallback && typeof fallback === 'object') return {};
  return fallback;
}

function readJSON(key, fallback) {
  if (hit[key]) return mem[key];
  var v;
  try {
    v = tt.getStorageSync(key);
  } catch (e) {
    v = undefined;
  }
  if (v === '' || v === undefined || v === null) v = cloneFallback(fallback);
  mem[key] = v;
  hit[key] = 1;
  return v;
}

function writeJSON(key, val) {
  mem[key] = val;
  hit[key] = 1;
  try {
    tt.setStorageSync(key, val);
  } catch (e) {}
}

function reload() {
  mem = {};
  hit = {};
}

function getCollection() {
  var a = readJSON(COLLECTION_KEY, []);
  if (!(a instanceof Array)) a = [];
  return a;
}

function markCollected(type) {
  var a = getCollection();
  if (a[type]) return false;
  a[type] = Date.now();
  writeJSON(COLLECTION_KEY, a);
  return true;
}

function collectedCount() {
  var a = getCollection();
  var c = 0;
  for (var i = 0; i < 11; i++) {
    if (a[i]) c++;
  }
  return c;
}

// 图鉴精通:各水果累计合成次数
function getFruitCounts() {
  var a = readJSON(FRUIT_COUNTS_KEY, []);
  if (!(a instanceof Array)) a = [];
  return a;
}

function addFruitCount(type) {
  if (typeof type !== 'number' || type < 0 || type > 10) return 0;
  var a = getFruitCounts();
  a[type] = (a[type] || 0) + 1;
  writeJSON(FRUIT_COUNTS_KEY, a);
  return a[type];
}

function getFruitCount(type) {
  var a = getFruitCounts();
  var v = parseInt(a[type], 10);
  return isFinite(v) && v > 0 ? v : 0;
}

function totalFruitMade() {
  var a = getFruitCounts();
  var s = 0;
  for (var i = 0; i < 11; i++) {
    var v = parseInt(a[i], 10);
    if (isFinite(v) && v > 0) s += v;
  }
  return s;
}

function getAch() {
  var o = readJSON(ACH_KEY, {});
  if (typeof o !== 'object' || o === null || o instanceof Array) o = {};
  return o;
}

function setAch(o) {
  writeJSON(ACH_KEY, o);
}

function getMaxCombo() {
  return readJSON(MAX_COMBO_KEY, 0) || 0;
}

function setMaxCombo(v) {
  writeJSON(MAX_COMBO_KEY, v);
}

function getMaxLevel() {
  return readJSON(MAX_LEVEL_KEY, 0) || 0;
}

function setMaxLevel(v) {
  writeJSON(MAX_LEVEL_KEY, v);
}

function getUsedSpecials() {
  var a = readJSON(USED_SPECIALS_KEY, []);
  if (!(a instanceof Array)) a = [];
  return a;
}

function markSpecialUsed(kind) {
  var a = getUsedSpecials();
  if (a.indexOf(kind) >= 0) return;
  a.push(kind);
  writeJSON(USED_SPECIALS_KEY, a);
}

var DEFS = [
  { id: 'first_clear', icon: '🏆', name: '小试牛刀', desc: '首次通过第 1 关', test: function (ctx) { return ctx.runLevel >= 2; } },
  { id: 'first_king', icon: '👑', name: '水果之王', desc: '首次合成西瓜', test: function (ctx) { return ctx.runMadeKing; } },
  { id: 'combo10', icon: '⚡', name: '连击达人', desc: '单次连击达到 10', test: function (ctx) { return ctx.runMaxCombo >= 10; } },
  { id: 'level5', icon: '🎯', name: '闯关高手', desc: '经典模式通关 5 关', test: function (ctx) { return ctx.maxLevel >= 6; } },
  { id: 'level20', icon: '🛤️', name: '远征者', desc: '经典模式通关 20 关', test: function (ctx) { return ctx.maxLevel >= 21; } },
  { id: 'level50', icon: '🏯', name: '传奇征程', desc: '经典模式通关 50 关', test: function (ctx) { return ctx.maxLevel >= 51; } },
  { id: 'level100', icon: '💎', name: '果界传说', desc: '经典模式通关 100 关', test: function (ctx) { return ctx.maxLevel >= 101; } },
  { id: 'frenzy5000', icon: '🔥', name: '狂热先锋', desc: '限时狂热单局 5000 分', test: function (ctx) { return ctx.mode === 'frenzy' && ctx.runScore >= 5000; } },
  { id: 'first_bomb', icon: '💣', name: '爆破专家', desc: '引爆 1 次炸弹', test: function (ctx) { return !!(ctx.runSpecials && ctx.runSpecials.bomb); } },
  { id: 'all_specials', icon: '✨', name: '技能全开', desc: '使用过全部 4 种特殊球', test: function (ctx) { return ctx.usedSpecialCount >= 4; } },
  { id: 'collect_all', icon: '📖', name: '图鉴全齐', desc: '集齐全部 11 种水果', test: function (ctx) { return ctx.collectedCount >= 11; } },
  { id: 'perk_first', icon: '🎴', name: '天赋初现', desc: '单局选择过 1 次天赋', test: function (ctx) { return ctx.runPerks >= 1; } },
  { id: 'daily_done', icon: '📅', name: '每日达人', desc: '完成一次每日挑战', test: function (ctx) { return !!ctx.dailyDone; } },
  { id: 'mission_first', icon: '📜', name: '崭露头角', desc: '领取首个任务奖励', test: function (ctx) { return ctx.missionsClaimed >= 1; } },
  { id: 'revive_use', icon: '💗', name: '起死回生', desc: '使用过一次复活', test: function (ctx) { return !!ctx.revived; } },
  { id: 'upgrade_first', icon: '⚙️', name: '初尝养成', desc: '购买首个永久升级', test: function (ctx) { return ctx.upgradesTotal >= 1; } },
  { id: 'score100k', icon: '🧮', name: '积分巨匠', desc: '累计得分达到 100,000', test: function (ctx) { return ctx.totalScore >= 100000; } },
  { id: 'master50', icon: '🏅', name: '精通大师', desc: '某种水果累计合成 50 次', test: function (ctx) { return (ctx.maxFruitCount || 0) >= 50; } },
  { id: 'boss_first', icon: '⚔️', name: '斩将', desc: '通关首个 Boss 关(第 10 关)', test: function (ctx) { return ctx.maxLevel >= 11; } },
  { id: 'perk_master', icon: '🎴', name: '博采众长', desc: '单局选择 10 次天赋', test: function (ctx) { return ctx.runPerks >= 10; } }
];

var TITLES = ['水果萌新', '合成学徒', '合成大师', '合成宗师', '合成果神', '果界传说', '果界至尊', '瓜王之王'];

// 成就点数(GP):各成就的稀缺度权重
var GP = {
  first_clear: 5, first_king: 15, combo10: 10, level5: 10, level20: 20, level50: 30, level100: 50,
  frenzy5000: 20, first_bomb: 10, all_specials: 20, collect_all: 40, perk_first: 10, daily_done: 10,
  mission_first: 10, revive_use: 15, upgrade_first: 10, score100k: 30, master50: 25,
  boss_first: 15, perk_master: 25
};

function getGp() {
  var o = getAch();
  var sum = 0;
  for (var i = 0; i < DEFS.length; i++) {
    if (o[DEFS[i].id]) sum += (GP[DEFS[i].id] || 5);
  }
  return sum;
}

function totalGp() {
  var sum = 0;
  for (var i = 0; i < DEFS.length; i++) sum += (GP[DEFS[i].id] || 5);
  return sum;
}
var CATS = {
  first_clear: 'progress', level5: 'progress', level20: 'progress', level50: 'progress', level100: 'progress', boss_first: 'progress',
  combo10: 'skill', first_king: 'skill', first_bomb: 'skill', all_specials: 'skill', perk_first: 'skill',
  collect_all: 'collect', master50: 'collect',
  frenzy5000: 'meta', daily_done: 'meta', mission_first: 'meta', revive_use: 'meta', upgrade_first: 'meta', score100k: 'meta', perk_master: 'meta'
};

function check(ctx) {
  var o = getAch();
  var newly = [];
  for (var i = 0; i < DEFS.length; i++) {
    var d = DEFS[i];
    if (o[d.id]) continue;
    if (d.test(ctx)) {
      o[d.id] = Date.now();
      newly.push(d);
    }
  }
  if (newly.length) setAch(o);
  return newly;
}

function getList() {
  var o = getAch();
  var out = [];
  for (var i = 0; i < DEFS.length; i++) {
    var d = DEFS[i];
    out.push({ id: d.id, icon: d.icon, name: d.name, desc: d.desc, cat: CATS[d.id] || 'meta', gp: GP[d.id] || 5, unlockedAt: o[d.id] || 0 });
  }
  return out;
}

function getUnlockedCount() {
  var o = getAch();
  var c = 0;
  for (var i = 0; i < DEFS.length; i++) {
    if (o[DEFS[i].id]) c++;
  }
  return c;
}

function getTitle(n) {
  if (n >= 16) return TITLES[7];
  if (n >= 13) return TITLES[6];
  if (n >= 10) return TITLES[5];
  if (n >= 8) return TITLES[4];
  if (n >= 6) return TITLES[3];
  if (n >= 4) return TITLES[2];
  if (n >= 2) return TITLES[1];
  return TITLES[0];
}

module.exports = {
  CATS: CATS,
  GP: GP,
  getGp: getGp,
  totalGp: totalGp,
  getCollection: getCollection,
  markCollected: markCollected,
  collectedCount: collectedCount,
  getFruitCounts: getFruitCounts,
  addFruitCount: addFruitCount,
  getFruitCount: getFruitCount,
  totalFruitMade: totalFruitMade,
  markSpecialUsed: markSpecialUsed,
  getUsedSpecials: getUsedSpecials,
  getMaxCombo: getMaxCombo,
  setMaxCombo: setMaxCombo,
  getMaxLevel: getMaxLevel,
  setMaxLevel: setMaxLevel,
  check: check,
  getList: getList,
  getUnlockedCount: getUnlockedCount,
  getTitle: getTitle,
  reload: reload
};
