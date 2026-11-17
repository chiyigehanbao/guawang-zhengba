// js/gpexchange.js —— 成就点数(GP)兑换
// 用成就点数兑换金币。可用 GP = 已得 GP − 已花费 GP(持久化)。
var progMod = require('./progression');
var achMod = require('./achievements');

var KEY = 'merge_watermelon_gp_spent';

var ITEMS = [
  { id: 'gp_small', icon: '🪙', name: '500 金币', gp: 100, coins: 500 },
  { id: 'gp_mid', icon: '💰', name: '2000 金币', gp: 300, coins: 2000 },
  { id: 'gp_big', icon: '💎', name: '5000 金币', gp: 600, coins: 5000 },
  { id: 'gp_bigger', icon: '👑', name: '7500 金币', gp: 800, coins: 7500 }
];

function getById(id) {
  for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i];
  return null;
}

function getSpent() {
  var v;
  try { v = tt.getStorageSync(KEY); } catch (e) { v = null; }
  var n = parseInt(v, 10);
  return isFinite(n) && n > 0 ? n : 0;
}

function writeSpent(n) {
  try { tt.setStorageSync(KEY, Math.max(0, Math.floor(n) || 0)); } catch (e) {}
}

function earnedGp() { return achMod.getGp(); }

function availableGp() {
  return Math.max(0, earnedGp() - getSpent());
}

function list() {
  var avail = availableGp();
  var out = [];
  for (var i = 0; i < ITEMS.length; i++) {
    var it = ITEMS[i];
    out.push({ id: it.id, icon: it.icon, name: it.name, gp: it.gp, coins: it.coins, affordable: avail >= it.gp });
  }
  return out;
}

function exchange(id) {
  var it = getById(id);
  if (!it) return { ok: false, reason: 'unknown' };
  if (availableGp() < it.gp) return { ok: false, reason: 'gp' };
  writeSpent(getSpent() + it.gp);
  progMod.addCoins(it.coins);
  return { ok: true, coins: it.coins, gp: it.gp };
}

function reset() { writeSpent(0); }

module.exports = {
  KEY: KEY,
  ITEMS: ITEMS,
  getById: getById,
  earnedGp: earnedGp,
  availableGp: availableGp,
  getSpent: getSpent,
  list: list,
  exchange: exchange,
  reset: reset
};
