// js/rewards.js —— 游玩产出的额外金币来源
// 关卡首通 / 新水果发现 / 连击里程碑 / 每日首局双倍。纯本地持久化,可 Node 测试。
var liveopsMod = require('./liveops');

var BEST_CLEAR_KEY = 'merge_watermelon_best_cleared';
var FIRST_RUN_KEY = 'merge_watermelon_first_run_day';

var FIRST_CLEAR_PER_LEVEL = 5;
var DISCOVER_PER_TIER = 20;
var COMBO_COINS = { 5: 5, 10: 10, 15: 15, 20: 20 };

function bestCleared() {
  var v;
  try { v = parseInt(tt.getStorageSync(BEST_CLEAR_KEY), 10); } catch (e) { v = 0; }
  return isFinite(v) && v > 0 ? v : 0;
}

// 首次通过第 level 关时返回奖励金币(Boss 关翻倍),否则 0
function firstClear(level) {
  if (level <= bestCleared()) return 0;
  try { tt.setStorageSync(BEST_CLEAR_KEY, level); } catch (e) {}
  var coins = level * FIRST_CLEAR_PER_LEVEL;
  return level % 10 === 0 ? coins * 2 : coins;
}

// 首次收集到某等级水果的奖励(type 从 0 开始)
function discoverCoins(type) {
  return (type + 1) * DISCOVER_PER_TIER;
}

function comboCoins(combo) {
  return COMBO_COINS[combo] || 0;
}

// 今天是否还没结算过对局;调用即消耗当日首局资格
function takeFirstRunOfDay(key) {
  var k = liveopsMod.dayKey(key);
  var last;
  try { last = tt.getStorageSync(FIRST_RUN_KEY); } catch (e) { last = ''; }
  if (last === k) return false;
  try { tt.setStorageSync(FIRST_RUN_KEY, k); } catch (e) {}
  return true;
}

function reset() {
  try {
    tt.setStorageSync(BEST_CLEAR_KEY, 0);
    tt.setStorageSync(FIRST_RUN_KEY, '');
  } catch (e) {}
}

module.exports = {
  BEST_CLEAR_KEY: BEST_CLEAR_KEY,
  FIRST_RUN_KEY: FIRST_RUN_KEY,
  FIRST_CLEAR_PER_LEVEL: FIRST_CLEAR_PER_LEVEL,
  DISCOVER_PER_TIER: DISCOVER_PER_TIER,
  COMBO_COINS: COMBO_COINS,
  bestCleared: bestCleared,
  firstClear: firstClear,
  discoverCoins: discoverCoins,
  comboCoins: comboCoins,
  takeFirstRunOfDay: takeFirstRunOfDay,
  reset: reset
};
