// js/progression.js —— 局外成长(金币 + 永久升级)
// 长期目标系统:每局结束按表现结算金币,金币用于购买永久升级(跨局生效)。
// 永久升级以 runMod 增量/倍率表达,由 game.js 在每局开局 applyTo 到 runMod 基底,
// 局内天赋再叠加其上。纯本地持久化,零依赖,可 Node 测试。
var COINS_KEY = 'merge_watermelon_coins';
var UPG_KEY = 'merge_watermelon_upgrades';

// 永久升级树。per 为「每级」增量/倍率;coinBonus 仅影响金币结算、不进入 runMod。
var UPGRADES = [
  {
    id: 'lucky_wind', icon: '🍀', name: '幸运之风', max: 5, baseCost: 120, costMult: 1.8,
    desc: '特殊球出现概率每级 +1%',
    per: { specialChanceAdd: 0.01 }
  },
  {
    id: 'rhythm', icon: '⚡', name: '节奏大师', max: 5, baseCost: 150, costMult: 1.8,
    desc: '连击窗口每级 +0.1s',
    per: { comboWindowAdd: 0.1 }
  },
  {
    id: 'power', icon: '💪', name: '力量强化', max: 5, baseCost: 180, costMult: 1.9,
    desc: '全部得分每级 ×1.05',
    per: { scoreMult: 0.05 }
  },
  {
    id: 'guard', icon: '🛡️', name: '安全护盾', max: 3, baseCost: 220, costMult: 2.0,
    desc: '危险线容错每级 +0.1s',
    per: { dangerThresholdAdd: 0.1 }
  },
  {
    id: 'fortune', icon: '💰', name: '财源广进', max: 5, baseCost: 100, costMult: 1.7,
    desc: '金币收益每级 +10%',
    per: { coinBonus: 0.1 }
  }
];

var BY_ID = {};
for (var i = 0; i < UPGRADES.length; i++) BY_ID[UPGRADES[i].id] = UPGRADES[i];

function getById(id) { return BY_ID[id] || null; }

function readCoins() {
  try {
    var v = tt.getStorageSync(COINS_KEY);
    var n = parseInt(v, 10);
    return isFinite(n) && n > 0 ? n : 0;
  } catch (e) { return 0; }
}

function writeCoins(n) {
  try { tt.setStorageSync(COINS_KEY, Math.max(0, Math.floor(n) || 0)); } catch (e) {}
}

function getCoins() { return readCoins(); }

function addCoins(n) {
  var v = readCoins() + Math.max(0, Math.floor(n) || 0);
  writeCoins(v);
  return v;
}

// 花费金币;不足返回 false 且不扣减
function spend(n) {
  n = Math.max(0, Math.floor(n) || 0);
  var cur = readCoins();
  if (cur < n) return false;
  writeCoins(cur - n);
  return true;
}

function readLevels() {
  var o;
  try {
    o = tt.getStorageSync(UPG_KEY);
  } catch (e) { o = null; }
  if (typeof o !== 'object' || o === null || o instanceof Array) o = {};
  return o;
}

function writeLevels(o) {
  try { tt.setStorageSync(UPG_KEY, o); } catch (e) {}
}

function getLevel(id) {
  var o = readLevels();
  var v = parseInt(o[id], 10);
  return isFinite(v) && v > 0 ? v : 0;
}

// 从当前等级升到下一级的花费
function costOf(id, level) {
  var u = getById(id);
  if (!u) return Infinity;
  if (level >= u.max) return Infinity;
  return Math.round(u.baseCost * Math.pow(u.costMult, level));
}

function canBuy(id) {
  var u = getById(id);
  if (!u) return { ok: false, reason: 'unknown' };
  var lvl = getLevel(id);
  if (lvl >= u.max) return { ok: false, reason: 'max' };
  var cost = costOf(id, lvl);
  if (readCoins() < cost) return { ok: false, reason: 'coins' };
  return { ok: true, cost: cost };
}

function buy(id) {
  var chk = canBuy(id);
  if (!chk.ok) return { ok: false, reason: chk.reason };
  var lvl = getLevel(id);
  writeCoins(readCoins() - chk.cost);
  var o = readLevels();
  o[id] = lvl + 1;
  writeLevels(o);
  return { ok: true, cost: chk.cost, level: lvl + 1 };
}

function totalLevels() {
  var s = 0;
  for (var i = 0; i < UPGRADES.length; i++) s += getLevel(UPGRADES[i].id);
  return s;
}

function coinBonus() {
  return 1 + getLevel('fortune') * 0.1;
}

// 把永久升级效果合并进 runMod(mod).scoreMult 为乘法,其余为加法;coinBonus 不入 mod。
function applyTo(mod) {
  for (var i = 0; i < UPGRADES.length; i++) {
    var u = UPGRADES[i];
    var lvl = getLevel(u.id);
    if (lvl <= 0) continue;
    for (var k in u.per) {
      if (!Object.prototype.hasOwnProperty.call(u.per, k)) continue;
      if (k === 'coinBonus') continue;
      if (k === 'scoreMult') {
        mod.scoreMult *= (1 + u.per.scoreMult * lvl);
      } else if (typeof mod[k] === 'number') {
        mod[k] += u.per[k] * lvl;
      }
    }
  }
  return mod;
}

// 每局结算应发金币
function coinsForRun(score, level, perksTaken) {
  var base = Math.floor((score || 0) / 100) + (level || 1) * 2 + (perksTaken || 0) * 5;
  return Math.max(1, Math.round(base * coinBonus()));
}

// 清空(测试/重置用)
function reset() {
  writeCoins(0);
  writeLevels({});
}

module.exports = {
  COINS_KEY: COINS_KEY,
  UPG_KEY: UPG_KEY,
  UPGRADES: UPGRADES,
  getById: getById,
  getCoins: getCoins,
  addCoins: addCoins,
  spend: spend,
  getLevel: getLevel,
  costOf: costOf,
  canBuy: canBuy,
  buy: buy,
  totalLevels: totalLevels,
  coinBonus: coinBonus,
  applyTo: applyTo,
  coinsForRun: coinsForRun,
  reset: reset
};
