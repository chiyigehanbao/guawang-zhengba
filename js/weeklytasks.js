// js/weeklytasks.js —— 每周任务(刷新制)
// 与每日任务同构,但按自然周重置、目标更高、奖励更丰。基于 missions 累计统计与当周基线。
var progMod = require('./progression');
var missionsMod = require('./missions');
var seasonboardMod = require('./seasonboard');

var KEY = 'merge_watermelon_weeklytasks';
var TASK_COUNT = 3;

var POOL = [
  { id: 'w_merge', icon: '🔗', name: '本周合成', stat: 'merges', target: 200, reward: 300 },
  { id: 'w_level', icon: '🛤️', name: '本周通关', stat: 'levels', target: 15, reward: 400 },
  { id: 'w_special', icon: '✨', name: '本周技能', stat: 'specials', target: 30, reward: 320 },
  { id: 'w_score', icon: '💯', name: '本周得分', stat: 'score', target: 20000, reward: 360 },
  { id: 'w_play', icon: '🎮', name: '本周游玩', stat: 'plays', target: 15, reward: 260 },
  { id: 'w_king', icon: '👑', name: '本周称王', stat: 'kings', target: 5, reward: 450 }
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

function pickForWeek(key) {
  var out = [];
  var pool = POOL.slice();
  var h = hashKey(key);
  while (out.length < TASK_COUNT && pool.length) {
    h = (h * 1103515245 + 12345) >>> 0;
    out.push(pool.splice(h % pool.length, 1)[0]);
  }
  return out;
}

function ensureRecord(key) {
  var k = seasonboardMod.weekKey(key);
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
  var picked = pickForWeek(rec.key);
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
      weekly: true
    });
  }
  return out;
}

function claimableCount(key) {
  var list = getList(key);
  var c = 0;
  for (var i = 0; i < list.length; i++) if (list[i].done && !list[i].claimed) c += 1;
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
