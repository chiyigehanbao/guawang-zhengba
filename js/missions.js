// js/missions.js —— 任务线(长期目标)
// 累计统计 + 里程碑任务:合成/通关/特殊球/合成皇冠/游玩局数/累计得分,达成领取金币。
// 纯本地持久化、纯函数,可零依赖测试。
var progMod = require('./progression');

var STATS_KEY = 'merge_watermelon_stats';
var MISS_KEY = 'merge_watermelon_missions';

var STAT_NAMES = ['merges', 'levels', 'specials', 'kings', 'plays', 'score'];

// 任务定义:stat 取自累计统计,达到 target 可领取 reward 金币。
var MISSIONS = [
  { id: 'merge100', icon: '🔗', name: '合成工匠', desc: '累计合成 100 次', stat: 'merges', target: 100, reward: 100 },
  { id: 'level10', icon: '🛤️', name: '稳步前进', desc: '累计通关 10 关', stat: 'levels', target: 10, reward: 200 },
  { id: 'special20', icon: '✨', name: '技能达人', desc: '累计使用特殊球 20 次', stat: 'specials', target: 20, reward: 150 },
  { id: 'king5', icon: '👑', name: '称王之路', desc: '累计合成皇冠 5 次', stat: 'kings', target: 5, reward: 300 },
  { id: 'play30', icon: '🎮', name: '常客', desc: '累计游玩 30 局', stat: 'plays', target: 30, reward: 200 },
  { id: 'score20000', icon: '💯', name: '积分猎人', desc: '累计得分 20,000', stat: 'score', target: 20000, reward: 250 }
];

var BY_ID = {};
for (var i = 0; i < MISSIONS.length; i++) BY_ID[MISSIONS[i].id] = MISSIONS[i];

function getById(id) { return BY_ID[id] || null; }

var mem = {};
var hit = {};

function readObj(key) {
  if (hit[key]) return mem[key];
  var v;
  try { v = tt.getStorageSync(key); } catch (e) { v = null; }
  if (typeof v !== 'object' || v === null || v instanceof Array) v = {};
  mem[key] = v;
  hit[key] = 1;
  return v;
}

function writeObj(key, o) {
  mem[key] = o;
  hit[key] = 1;
  try { tt.setStorageSync(key, o); } catch (e) {}
}

function reload() {
  mem = {};
  hit = {};
}

function getStats() {
  var o = readObj(STATS_KEY);
  var out = {};
  for (var i = 0; i < STAT_NAMES.length; i++) {
    var n = parseInt(o[STAT_NAMES[i]], 10);
    out[STAT_NAMES[i]] = isFinite(n) && n > 0 ? n : 0;
  }
  return out;
}

function getStat(name) {
  if (STAT_NAMES.indexOf(name) < 0) return 0;
  return getStats()[name];
}

function addStat(name, n) {
  if (STAT_NAMES.indexOf(name) < 0) return 0;
  n = Math.max(0, Math.floor(n) || 0);
  var o = readObj(STATS_KEY);
  var cur = parseInt(o[name], 10);
  cur = isFinite(cur) && cur > 0 ? cur : 0;
  o[name] = cur + n;
  writeObj(STATS_KEY, o);
  return o[name];
}

function getClaimed() {
  var o = readObj(MISS_KEY);
  var arr = o.claimed;
  return arr instanceof Array ? arr : [];
}

function isClaimed(id) {
  return getClaimed().indexOf(id) >= 0;
}

function progressOf(id) {
  var m = getById(id);
  if (!m) return 0;
  var s = getStat(m.stat);
  return Math.min(s, m.target);
}

function isDone(id) {
  var m = getById(id);
  if (!m) return false;
  return getStat(m.stat) >= m.target;
}

function isClaimable(id) {
  return isDone(id) && !isClaimed(id);
}

function claim(id) {
  var m = getById(id);
  if (!m) return { ok: false, reason: 'unknown' };
  if (!isDone(id)) return { ok: false, reason: 'todo' };
  if (isClaimed(id)) return { ok: false, reason: 'claimed' };
  var arr = getClaimed().slice();
  arr.push(id);
  writeObj(MISS_KEY, { claimed: arr });
  progMod.addCoins(m.reward);
  return { ok: true, reward: m.reward };
}

function getList() {
  var out = [];
  for (var i = 0; i < MISSIONS.length; i++) {
    var m = MISSIONS[i];
    out.push({
      id: m.id,
      icon: m.icon,
      name: m.name,
      desc: m.desc,
      reward: m.reward,
      progress: progressOf(m.id),
      target: m.target,
      done: isDone(m.id),
      claimed: isClaimed(m.id)
    });
  }
  return out;
}

function claimableCount() {
  var c = 0;
  for (var i = 0; i < MISSIONS.length; i++) {
    if (isClaimable(MISSIONS[i].id)) c += 1;
  }
  return c;
}

function reset() {
  reload();
  writeObj(STATS_KEY, {});
  writeObj(MISS_KEY, { claimed: [] });
}

module.exports = {
  STATS_KEY: STATS_KEY,
  MISS_KEY: MISS_KEY,
  MISSIONS: MISSIONS,
  getById: getById,
  getStats: getStats,
  getStat: getStat,
  addStat: addStat,
  isDone: isDone,
  isClaimed: isClaimed,
  isClaimable: isClaimable,
  progressOf: progressOf,
  claim: claim,
  getList: getList,
  claimableCount: claimableCount,
  reset: reset,
  reload: reload
};
