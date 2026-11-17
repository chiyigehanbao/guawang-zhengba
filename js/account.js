// js/account.js —— 账号经验与等级
// 每局结算获得经验(XP),累计升级,升级发放金币奖励。纯本地持久化,可 Node 测试。
var progMod = require('./progression');

var KEY = 'merge_watermelon_account';

// 局内经验:与得分/关卡/天赋相关
function xpForRun(score, level, perksTaken) {
  return Math.floor((score || 0) / 50) + (level || 1) * 3 + (perksTaken || 0) * 5;
}

// 从 level 升到 level+1 所需经验
function xpToNext(level) {
  return 100 + level * 80;
}

function readXp() {
  var v;
  try { v = tt.getStorageSync(KEY); } catch (e) { v = null; }
  if (typeof v === 'object' && v) v = v.xp;
  var n = parseInt(v, 10);
  return isFinite(n) && n > 0 ? n : 0;
}

function writeXp(xp) {
  try { tt.setStorageSync(KEY, { xp: Math.max(0, Math.floor(xp) || 0) }); } catch (e) {}
}

function getXp() { return readXp(); }

function levelFromXp(xp) {
  var lvl = 1;
  var rem = Math.max(0, xp);
  while (rem >= xpToNext(lvl) && lvl < 999) {
    rem -= xpToNext(lvl);
    lvl += 1;
  }
  return lvl;
}

function progress(xp) {
  var lvl = 1;
  var rem = Math.max(0, xp);
  while (rem >= xpToNext(lvl) && lvl < 999) {
    rem -= xpToNext(lvl);
    lvl += 1;
  }
  return { level: lvl, cur: rem, need: xpToNext(lvl) };
}

function getState() {
  var xp = getXp();
  var p = progress(xp);
  return { xp: xp, level: p.level, cur: p.cur, need: p.need };
}

// 增加经验;跨级时发放金币奖励(每级 level*20)
function addXp(n) {
  n = Math.max(0, Math.floor(n) || 0);
  var before = readXp();
  var after = before + n;
  writeXp(after);
  var l0 = levelFromXp(before);
  var l1 = levelFromXp(after);
  var reward = 0;
  if (l1 > l0) {
    for (var L = l0 + 1; L <= l1; L++) reward += L * 20;
    progMod.addCoins(reward);
  }
  return { leveled: l1 > l0, from: l0, level: l1, reward: reward, xp: after };
}

function reset() {
  writeXp(0);
}

module.exports = {
  KEY: KEY,
  xpForRun: xpForRun,
  xpToNext: xpToNext,
  getXp: getXp,
  levelFromXp: levelFromXp,
  progress: progress,
  getState: getState,
  addXp: addXp,
  reset: reset
};
