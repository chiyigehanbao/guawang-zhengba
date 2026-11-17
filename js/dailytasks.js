// js/dailytasks.js —— 每日任务(刷新制)
// 每天从任务池确定性抽取 3 项;进度按「当日累计统计增量」计算(基于 missions 的累计统计快照)。
// 完成可领金币,每日重置。纯本地、可 Node 测试。
var progMod = require('./progression');
var missionsMod = require('./missions');
var liveopsMod = require('./liveops');

var KEY = 'merge_watermelon_dailytasks';
var TASK_COUNT = 3;

var POOL = [
  { id: 'd_merge', icon: '🔗', name: '今日合成', stat: 'merges', target: 30, reward: 80 },
  { id: 'd_level', icon: '🛤️', name: '今日通关', stat: 'levels', target: 3, reward: 120 },
  { id: 'd_special', icon: '✨', name: '今日技能', stat: 'specials', target: 5, reward: 100 },
  { id: 'd_score', icon: '💯', name: '今日得分', stat: 'score', target: 3000, reward: 100 },
  { id: 'd_play', icon: '🎮', name: '今日游玩', stat: 'plays', target: 3, reward: 60 },
  { id: 'd_king', icon: '👑', name: '今日称王', stat: 'kings', target: 1, reward: 150 }
];

var BY_ID = {};
for (var i = 0; i < POOL.length; i++) BY_ID[POOL[i].id] = POOL[i];

function getById(id) { return BY_ID[id] || null; }

function hashKey(key) {
  var h = 0;
  for (var i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}

function readRec() {
  var o;
  try { o = tt.getStorageSync(KEY); } catch (e) { o = null; }
  if (typeof o !== 'object' || o === null || o instanceof Array) o = {};
  if (typeof o.key !== 'string') o = {};
  return o;
}

function writeRec(o) {
  try { tt.setStorageSync(KEY, o); } catch (e) {}
}

// 抽取当天任务(确定性)
function pickForDay(key) {
  var out = [];
  var pool = POOL.slice();
  var h = hashKey(key);
  while (out.length < TASK_COUNT && pool.length) {
    h = (h * 1103515245 + 12345) >>> 0;
    out.push(pool.splice(h % pool.length, 1)[0]);
  }
  return out;
}

// 读取当天记录;跨日则以当前统计为基线重置
function ensureRecord(key) {
  var k = liveopsMod.dayKey(key);
  var rec = readRec();
  if (rec.key !== k) {
    var stats = missionsMod.getStats();
    rec = { key: k, base: {}, claimed: [] };
    for (var s in stats) {
      if (Object.prototype.hasOwnProperty.call(stats, s)) rec.base[s] = stats[s];
    }
    writeRec(rec);
  }
  if (!(rec.claimed instanceof Array)) rec.claimed = [];
  return rec;
}

function progressOf(id) {
  var t = getById(id);
  if (!t) return 0;
  var rec = ensureRecord();
  var cur = missionsMod.getStat(t.stat);
  var base = rec.base[t.stat] || 0;
  return Math.max(0, Math.min(t.target, cur - base));
}

function isDone(id) {
  var t = getById(id);
  return !!t && progressOf(id) >= t.target;
}

function isClaimed(id) {
  return ensureRecord().claimed.indexOf(id) >= 0;
}

function isClaimable(id) {
  return isDone(id) && !isClaimed(id);
}

function claim(id) {
  var t = getById(id);
  if (!t) return { ok: false, reason: 'unknown' };
  if (!isDone(id)) return { ok: false, reason: 'todo' };
  if (isClaimed(id)) return { ok: false, reason: 'claimed' };
  var rec = ensureRecord();
  rec.claimed.push(id);
  writeRec(rec);
  progMod.addCoins(t.reward);
  return { ok: true, reward: t.reward };
}

function getList(key) {
  var rec = ensureRecord(key);
  var picked = pickForDay(rec.key);
  var out = [];
  for (var i = 0; i < picked.length; i++) {
    var t = picked[i];
    var cur = missionsMod.getStat(t.stat);
    var base = rec.base[t.stat] || 0;
    out.push({
      id: t.id, icon: t.icon, name: t.name, reward: t.reward,
      progress: Math.max(0, Math.min(t.target, cur - base)),
      target: t.target,
      done: (cur - base) >= t.target,
      claimed: rec.claimed.indexOf(t.id) >= 0,
      daily: true
    });
  }
  return out;
}

function claimableCount(key) {
  var list = getList(key);
  var c = 0;
  for (var i = 0; i < list.length; i++) {
    if (list[i].done && !list[i].claimed) c += 1;
  }
  return c;
}

function reset() {
  writeRec({});
}

module.exports = {
  KEY: KEY,
  TASK_COUNT: TASK_COUNT,
  POOL: POOL,
  getById: getById,
  getList: getList,
  progressOf: progressOf,
  isDone: isDone,
  isClaimed: isClaimed,
  isClaimable: isClaimable,
  claim: claim,
  claimableCount: claimableCount,
  reset: reset
};
