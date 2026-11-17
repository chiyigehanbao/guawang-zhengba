// js/dda.js —— 动态难度调整(DDA)
// 记录最近若干局的成绩(关卡/得分),据此微调难度:玩家偏弱→略降难度(更多特殊球/更低目标),
// 玩家偏强→略升难度。纯本地、纯函数,默认中性不改变原数值。可 Node 测试。
var KEY = 'merge_watermelon_dda';
var STREAK_KEY = 'merge_watermelon_dda_streak';
var MAX = 10;

function readList() {
  var a;
  try { a = tt.getStorageSync(KEY); } catch (e) { a = null; }
  if (!(a instanceof Array)) a = [];
  return a.filter(function (x) { return x && typeof x.level === 'number'; });
}

function writeList(a) {
  try { tt.setStorageSync(KEY, a); } catch (e) {}
}

function record(score, level) {
  var list = readList();
  list.push({ score: Math.max(0, Math.floor(score) || 0), level: Math.max(1, Math.floor(level) || 1) });
  if (list.length > MAX) list = list.slice(list.length - MAX);
  writeList(list);
  // 连败计数:过关太浅且得分过低 → 记一次连败
  var cur = readStreak();
  var isLoss = (level || 1) <= 2 && (score || 0) < 150;
  writeStreak(isLoss ? cur + 1 : 0);
  return list.length;
}

function readStreak() {
  var v;
  try { v = tt.getStorageSync(STREAK_KEY); } catch (e) { v = null; }
  var n = parseInt(v, 10);
  return isFinite(n) && n > 0 ? n : 0;
}

function writeStreak(n) {
  try { tt.setStorageSync(STREAK_KEY, Math.max(0, Math.floor(n) || 0)); } catch (e) {}
}

function loseStreak() { return readStreak(); }

function getRecent() { return readList(); }

// 返回难度修正:specialAdd(加在特殊球概率)、targetMult(乘在关卡目标)、sample(样本数)
function factor() {
  var list = readList();
  if (list.length < 3) return { specialAdd: 0, targetMult: 1, sample: list.length };
  var sumL = 0, i;
  for (i = 0; i < list.length; i++) sumL += list[i].level;
  var avgL = sumL / list.length;
  var specialAdd = 0;
  var targetMult = 1;
  if (avgL < 3) { specialAdd = 0.05; targetMult = 0.9; }
  else if (avgL > 8) { specialAdd = -0.03; targetMult = 1.1; }
  return { specialAdd: specialAdd, targetMult: targetMult, sample: list.length, avgLevel: avgL };
}

function reset() { writeList([]); writeStreak(0); }

module.exports = {
  KEY: KEY,
  STREAK_KEY: STREAK_KEY,
  MAX: MAX,
  record: record,
  getRecent: getRecent,
  factor: factor,
  loseStreak: loseStreak,
  reset: reset
};
