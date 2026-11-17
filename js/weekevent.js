// js/weekevent.js —— 周赛活动(每周刷新)
// 每周一个带修正与目标的活动(如「双倍积分周」),达成可得金币奖励,每周一次领取。
// 复用 seasonboard.weekKey 作为周期。纯本地、可测试。
var progMod = require('./progression');
var seasonboardMod = require('./seasonboard');

var KEY = 'merge_watermelon_weekevent';

// 活动池:mod 为 runMod 风格修正;目标按模式(targetLevel 或 targetScore)
var POOL = [
  { id: 'ev_score', icon: '💯', name: '积分周', desc: '经典模式到达第 6 关(得分×1.2)', mode: 'classic', targetLevel: 6, mod: { scoreMult: 1.2 }, reward: 500 },
  { id: 'ev_special', icon: '💥', name: '特殊球狂欢周', desc: '经典模式到达第 5 关(特殊球概率×1.5)', mode: 'classic', targetLevel: 5, mod: { specialChanceAdd: 0.15 }, reward: 500 },
  { id: 'ev_frenzy', icon: '🔥', name: '狂热竞速周', desc: '限时狂热单局 5000 分', mode: 'frenzy', targetScore: 5000, mod: {}, reward: 600 },
  { id: 'ev_combo', icon: '⚡', name: '连击周', desc: '经典模式到达第 7 关(连击加成 +5%)', mode: 'classic', targetLevel: 7, mod: { comboBonusAdd: 0.05 }, reward: 650 },
  { id: 'ev_shield', icon: '🛡️', name: '稳健周', desc: '经典模式到达第 6 关(危险线容错 +0.4s)', mode: 'classic', targetLevel: 6, mod: { dangerThresholdAdd: 0.4 }, reward: 500 }
];

function weekKey(key) {
  // 幂等:若已是周键(YYYY-Www)则原样返回,避免重复换算
  if (typeof key === 'string' && /^\d{4}-W\d{2}$/.test(key)) return key;
  return seasonboardMod.weekKey(key);
}

function hashKey(k) {
  var h = 0;
  for (var i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
  return h;
}

function readRec() {
  var o;
  try { o = tt.getStorageSync(KEY); } catch (e) { o = null; }
  if (typeof o !== 'object' || o === null || o instanceof Array) o = {};
  if (typeof o.key !== 'string') o = {};
  return o;
}

function writeRec(o) { try { tt.setStorageSync(KEY, o); } catch (e) {} }

function getEvent(key) {
  var wk = weekKey(key);
  var idx = hashKey(wk) % POOL.length;
  var e = POOL[idx];
  return {
    key: wk, index: idx, id: e.id, icon: e.icon, name: e.name, desc: e.desc,
    mode: e.mode, targetLevel: e.targetLevel || 0, targetScore: e.targetScore || 0,
    mod: e.mod || {}, reward: e.reward
  };
}

function getRecord(key) {
  var wk = weekKey(key);
  var o = readRec();
  if (o.key !== wk) o = { key: wk, done: false, claimed: false };
  return o;
}

function markSuccess(key) {
  var wk = weekKey(key);
  var o = getRecord(wk);
  o.done = true;
  writeRec(o);
  return o;
}

function isDone(key) { return !!getRecord(key).done; }
function isClaimed(key) { return !!getRecord(key).claimed; }
function isClaimable(key) { var o = getRecord(key); return o.done && !o.claimed; }

function claim(key) {
  var o = getRecord(key);
  if (!o.done) return { ok: false, reason: 'todo' };
  if (o.claimed) return { ok: false, reason: 'claimed' };
  o.claimed = true;
  writeRec(o);
  var reward = getEvent(weekKey(key)).reward;
  progMod.addCoins(reward);
  return { ok: true, reward: reward };
}

function reset() { writeRec({}); }

module.exports = {
  KEY: KEY,
  POOL: POOL,
  getEvent: getEvent,
  getRecord: getRecord,
  isDone: isDone,
  isClaimed: isClaimed,
  isClaimable: isClaimable,
  markSuccess: markSuccess,
  claim: claim,
  reset: reset
};
