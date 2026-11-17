// js/skillup.js —— 技能升级树(永久强化主动技能)
// 用金币永久强化三类技能参数:能量效率 / 重锤威力 / 陨石范围 / 洗牌强度。
// 与 progression.upgrades 同构(等级+花费曲线),结果由 game.js 在释放时读取。纯本地、可测试。
var progMod = require('./progression');

var KEY = 'merge_watermelon_skillup';

var UPGRADES = [
  { id: 'energy_rate', icon: '🔋', name: '能量效率', max: 5, baseCost: 150, costMult: 1.8, desc: '每次合成能量 +1', per: 1 },
  { id: 'hammer_power', icon: '🔨', name: '重锤威力', max: 5, baseCost: 150, costMult: 1.8, desc: '重锤释放得分 +5', per: 5 },
  { id: 'meteor_size', icon: '☄️', name: '陨石范围', max: 5, baseCost: 180, costMult: 1.9, desc: '陨石半径 +8', per: 8 },
  { id: 'shuffle_power', icon: '🪄', name: '洗牌强度', max: 5, baseCost: 120, costMult: 1.8, desc: '洗牌力度 +40', per: 40 }
];

var BY_ID = {};
for (var i = 0; i < UPGRADES.length; i++) BY_ID[UPGRADES[i].id] = UPGRADES[i];

function getById(id) { return BY_ID[id] || null; }

function readLevels() {
  var o;
  try { o = tt.getStorageSync(KEY); } catch (e) { o = null; }
  if (typeof o !== 'object' || o === null || o instanceof Array) o = {};
  return o;
}

function writeLevels(o) {
  try { tt.setStorageSync(KEY, o); } catch (e) {}
}

function getLevel(id) {
  var o = readLevels();
  var v = parseInt(o[id], 10);
  return isFinite(v) && v > 0 ? v : 0;
}

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
  if (progMod.getCoins() < cost) return { ok: false, reason: 'coins' };
  return { ok: true, cost: cost };
}

function buy(id) {
  var chk = canBuy(id);
  if (!chk.ok) return { ok: false, reason: chk.reason };
  if (!progMod.spend(chk.cost)) return { ok: false, reason: 'coins' };
  var lvl = getLevel(id);
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

function energyBonus() { return getLevel('energy_rate'); }
function hammerBonus() { return getLevel('hammer_power') * 5; }
function meteorRadiusBonus() { return getLevel('meteor_size') * 8; }
function shuffleBonus() { return getLevel('shuffle_power') * 40; }

function reset() { writeLevels({}); }

module.exports = {
  KEY: KEY,
  UPGRADES: UPGRADES,
  getById: getById,
  getLevel: getLevel,
  costOf: costOf,
  canBuy: canBuy,
  buy: buy,
  totalLevels: totalLevels,
  energyBonus: energyBonus,
  hammerBonus: hammerBonus,
  meteorRadiusBonus: meteorRadiusBonus,
  shuffleBonus: shuffleBonus,
  reset: reset
};
