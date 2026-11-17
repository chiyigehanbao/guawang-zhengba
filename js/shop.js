// js/shop.js —— 金币商店(只用游戏内金币,不接任何真实支付)
// 道具用金币购买后进入背包,开局/结算时消耗;另提供每日限次「看广告领金币」。
// 纯本地持久化,可 Node 测试。
var progMod = require('./progression');
var liveopsMod = require('./liveops');

var INV_KEY = 'merge_watermelon_items';
var AD_KEY = 'merge_watermelon_ad_coins';

var ITEMS = [
  { id: 'energy', icon: '⚡', name: '开局满能量', desc: '下一局开局能量直接充满', cost: 150 },
  { id: 'shield', icon: '🛡️', name: '护盾卡', desc: '下一局危险线判负时间 +1 秒', cost: 200 },
  { id: 'revive', icon: '💗', name: '复活卡', desc: '结算时免广告复活一次', cost: 300 }
];

var SHIELD_SECONDS = 1;
var AD_COINS = 60;
var AD_DAILY_LIMIT = 3;

function getById(id) {
  for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i];
  return null;
}

function list() { return ITEMS.slice(); }

function readInv() {
  var o;
  try { o = tt.getStorageSync(INV_KEY); } catch (e) { o = null; }
  if (typeof o !== 'object' || o === null || o instanceof Array) o = {};
  return o;
}

function writeInv(o) {
  try { tt.setStorageSync(INV_KEY, o); } catch (e) {}
}

function count(id) {
  var v = parseInt(readInv()[id], 10);
  return isFinite(v) && v > 0 ? v : 0;
}

function buy(id) {
  var it = getById(id);
  if (!it) return { ok: false, reason: 'unknown' };
  if (!progMod.spend(it.cost)) return { ok: false, reason: 'coins' };
  var o = readInv();
  o[id] = count(id) + 1;
  writeInv(o);
  return { ok: true, cost: it.cost, count: o[id] };
}

// 消耗一个道具;没有则返回 false
function consume(id) {
  var n = count(id);
  if (n <= 0) return false;
  var o = readInv();
  o[id] = n - 1;
  writeInv(o);
  return true;
}

// ── 每日看广告领金币 ─────────────────────────────────────────────
function adUsedToday(key) {
  var k = liveopsMod.dayKey(key);
  var o;
  try { o = tt.getStorageSync(AD_KEY); } catch (e) { o = null; }
  if (typeof o !== 'object' || o === null || o.key !== k) return 0;
  var v = parseInt(o.used, 10);
  return isFinite(v) && v > 0 ? v : 0;
}

function adLeftToday(key) {
  return Math.max(0, AD_DAILY_LIMIT - adUsedToday(key));
}

// 广告看完后调用:发放金币并计次
function grantAdCoins(key) {
  var k = liveopsMod.dayKey(key);
  if (adLeftToday(k) <= 0) return { ok: false, reason: 'limit' };
  var used = adUsedToday(k) + 1;
  try { tt.setStorageSync(AD_KEY, { key: k, used: used }); } catch (e) {}
  progMod.addCoins(AD_COINS);
  return { ok: true, coins: AD_COINS, left: AD_DAILY_LIMIT - used };
}

function reset() {
  writeInv({});
  try { tt.setStorageSync(AD_KEY, {}); } catch (e) {}
}

module.exports = {
  INV_KEY: INV_KEY,
  AD_KEY: AD_KEY,
  ITEMS: ITEMS,
  SHIELD_SECONDS: SHIELD_SECONDS,
  AD_COINS: AD_COINS,
  AD_DAILY_LIMIT: AD_DAILY_LIMIT,
  getById: getById,
  list: list,
  count: count,
  buy: buy,
  consume: consume,
  adLeftToday: adLeftToday,
  grantAdCoins: grantAdCoins,
  reset: reset
};
