// js/liveops.js —— 留存与 Live-Ops:每日挑战 + 每日签到
// 每日挑战:按本地日期确定性抽取一个挑战(模式/目标/修正),完成可领金币奖励(每日一次)。
// 每日签到:7 天循环连续签到奖励,断签重置。
// 纯本地持久化 + 纯函数,支持传入日期字符串以便零依赖测试。
var progMod = require('./progression');

var DAILY_KEY = 'merge_watermelon_daily';
var CHECKIN_KEY = 'merge_watermelon_checkin';
var OFF_KEY = 'merge_watermelon_daily_off';
var STREAK_KEY = 'merge_watermelon_daily_streak';

var DAILY_REWARD = 120;
var STREAK_BONUS_PER_DAY = 15;
var CHECKIN_REWARDS = [40, 60, 80, 100, 130, 160, 250];

// 每日挑战池。mod 为 runMod 风格增量/倍率(scoreMult 乘法,其余加法)。
var DAILY_POOL = [
  { id: 'level5', icon: '🎯', name: '闯关达人', desc: '经典模式到达第 5 关', mode: 'classic', targetLevel: 5, mod: {} },
  { id: 'frenzy3000', icon: '🔥', name: '狂热竞速', desc: '限时狂热单局 3000 分', mode: 'frenzy', targetScore: 3000, mod: {} },
  { id: 'noluck', icon: '🚫', name: '无特殊球', desc: '经典模式到达第 3 关(禁用特殊球)', mode: 'classic', targetLevel: 3, mod: { specialChanceAdd: -0.5 } },
  { id: 'rich', icon: '🎁', name: '特殊球狂欢', desc: '经典模式到达第 4 关(特殊球概率提升)', mode: 'classic', targetLevel: 4, mod: { specialChanceAdd: 0.12 } },
  { id: 'power', icon: '💪', name: '得分狂欢', desc: '经典模式到达第 4 关(全部得分 ×1.3)', mode: 'classic', targetLevel: 4, mod: { scoreMult: 1.3 } }
];

function pad2(n) { return (n < 10 ? '0' : '') + n; }

// 本地日期键 YYYY-MM-DD;可传入 Date 或日期字符串(直接返回)。
function dayKey(d) {
  if (typeof d === 'string') return d;
  var dt = d instanceof Date ? d : new Date();
  return dt.getFullYear() + '-' + pad2(dt.getMonth() + 1) + '-' + pad2(dt.getDate());
}

// 前一天的日期键
function prevDayKey(key) {
  var p = String(key).split('-');
  var dt = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  dt.setDate(dt.getDate() - 1);
  return dayKey(dt);
}

function hashKey(key) {
  var h = 0;
  for (var i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h;
}

// 确定性:同一天返回同一挑战(受当日「换一个」偏移影响)
function getDaily(key) {
  var k = dayKey(key);
  var off = 0;
  var o = readJSON(OFF_KEY, {});
  if (o.key === k) off = parseInt(o.off, 10) > 0 ? parseInt(o.off, 10) : 0;
  var idx = (hashKey(k) + off) % DAILY_POOL.length;
  var base = DAILY_POOL[idx];
  return {
    key: k,
    index: idx,
    id: base.id,
    icon: base.icon,
    name: base.name,
    desc: base.desc,
    mode: base.mode,
    targetLevel: base.targetLevel || 0,
    targetScore: base.targetScore || 0,
    mod: base.mod || {}
  };
}

function currentOffset(key) {
  var k = dayKey(key);
  var o = readJSON(OFF_KEY, {});
  return o.key === k && parseInt(o.off, 10) > 0 ? parseInt(o.off, 10) : 0;
}

function hasRerolled(key) {
  return currentOffset(key) > 0;
}

// 每日「换一个」:仅当当日未完成、未换过时生效
function reroll(key) {
  var k = dayKey(key);
  if (isDailyDone(k)) return { ok: false, reason: 'done' };
  if (hasRerolled(k)) return { ok: false, reason: 'used' };
  writeJSON(OFF_KEY, { key: k, off: 1 });
  return { ok: true, daily: getDaily(k) };
}

function readJSON(key, fallback) {
  var v;
  try { v = tt.getStorageSync(key); } catch (e) { v = null; }
  if (typeof v !== 'object' || v === null || v instanceof Array) return fallback;
  return v;
}

function writeJSON(key, val) {
  try { tt.setStorageSync(key, val); } catch (e) {}
}

// ── 每日挑战记录 ────────────────────────────────────────────────
function getDailyRecord() {
  var o = readJSON(DAILY_KEY, {});
  if (typeof o.key !== 'string') o = {};
  return o;
}

function isDailyDone(key) {
  var o = getDailyRecord();
  return o.key === dayKey(key) && !!o.done;
}

function markDailySuccess(key) {
  var k = dayKey(key);
  var o = getDailyRecord();
  if (o.key !== k) o = { key: k, done: false, claimed: false };
  var firstTime = !o.done;
  o.done = true;
  writeJSON(DAILY_KEY, o);
  if (firstTime) updateStreak(k);
  return o;
}

// 每日挑战连续完成天数
function getStreak() {
  var s = readJSON(STREAK_KEY, {});
  var v = parseInt(s.streak, 10);
  return isFinite(v) && v > 0 ? v : 0;
}

function updateStreak(k) {
  var s = readJSON(STREAK_KEY, {});
  var streak;
  if (s.lastKey && s.lastKey === prevDayKey(k)) streak = (parseInt(s.streak, 10) || 0) + 1;
  else streak = 1;
  writeJSON(STREAK_KEY, { lastKey: k, streak: streak });
  return streak;
}

function streakBonus() {
  return Math.min(7, getStreak()) * STREAK_BONUS_PER_DAY;
}

function claimDaily(key) {
  var k = dayKey(key);
  var o = getDailyRecord();
  if (o.key !== k) o = { key: k, done: false, claimed: false };
  if (!o.done) return { ok: false, reason: 'todo' };
  if (o.claimed) return { ok: false, reason: 'claimed' };
  o.claimed = true;
  writeJSON(DAILY_KEY, o);
  var bonus = streakBonus();
  progMod.addCoins(DAILY_REWARD + bonus);
  return { ok: true, reward: DAILY_REWARD + bonus, bonus: bonus };
}

// ── 每日签到 ────────────────────────────────────────────────────
function getCheckin() {
  var o = readJSON(CHECKIN_KEY, {});
  return {
    lastKey: typeof o.lastKey === 'string' ? o.lastKey : '',
    streak: parseInt(o.streak, 10) > 0 ? parseInt(o.streak, 10) : 0
  };
}

function isCheckedToday(key) {
  return getCheckin().lastKey === dayKey(key);
}

// 领取今日签到。连续签到递增(满 7 循环),断签重置为 1。
function claimCheckin(key) {
  var k = dayKey(key);
  var o = getCheckin();
  if (o.lastKey === k) return { ok: false, reason: 'claimed', streak: o.streak };
  var streak;
  if (o.lastKey && o.lastKey === prevDayKey(k)) {
    streak = o.streak + 1;
  } else {
    streak = 1;
  }
  var idx = (streak - 1) % CHECKIN_REWARDS.length;
  var reward = CHECKIN_REWARDS[idx];
  writeJSON(CHECKIN_KEY, { lastKey: k, streak: streak });
  progMod.addCoins(reward);
  return { ok: true, reward: reward, streak: streak, day: idx + 1 };
}

function reset() {
  writeJSON(DAILY_KEY, {});
  writeJSON(CHECKIN_KEY, {});
  writeJSON(OFF_KEY, {});
  writeJSON(STREAK_KEY, {});
}

module.exports = {
  DAILY_KEY: DAILY_KEY,
  CHECKIN_KEY: CHECKIN_KEY,
  OFF_KEY: OFF_KEY,
  STREAK_KEY: STREAK_KEY,
  DAILY_POOL: DAILY_POOL,
  DAILY_REWARD: DAILY_REWARD,
  STREAK_BONUS_PER_DAY: STREAK_BONUS_PER_DAY,
  CHECKIN_REWARDS: CHECKIN_REWARDS,
  dayKey: dayKey,
  prevDayKey: prevDayKey,
  getDaily: getDaily,
  currentOffset: currentOffset,
  hasRerolled: hasRerolled,
  reroll: reroll,
  getDailyRecord: getDailyRecord,
  isDailyDone: isDailyDone,
  markDailySuccess: markDailySuccess,
  getStreak: getStreak,
  streakBonus: streakBonus,
  claimDaily: claimDaily,
  getCheckin: getCheckin,
  isCheckedToday: isCheckedToday,
  claimCheckin: claimCheckin,
  reset: reset
};
