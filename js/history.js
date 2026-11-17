// js/history.js —— 本地历史最高分榜(Top N)
// 记录历史最高的 N 个成绩(含模式与时间),纯本地,可 Node 测试。
var KEY = 'merge_watermelon_history';
var MAX = 5;

function readList() {
  var a;
  try { a = tt.getStorageSync(KEY); } catch (e) { a = null; }
  if (!(a instanceof Array)) a = [];
  return a.filter(function (x) { return x && typeof x.score === 'number'; });
}

function writeList(a) {
  try { tt.setStorageSync(KEY, a); } catch (e) {}
}

function record(mode, score, ts) {
  score = Math.max(0, Math.floor(score) || 0);
  var list = readList();
  list.push({ mode: mode === 'frenzy' ? 'frenzy' : 'classic', score: score, at: ts || Date.now() });
  list.sort(function (a, b) { return b.score - a.score; });
  list = list.slice(0, MAX);
  writeList(list);
  return list;
}

function getTop() {
  return readList();
}

function reset() {
  writeList([]);
}

module.exports = {
  KEY: KEY,
  MAX: MAX,
  record: record,
  getTop: getTop,
  reset: reset
};
