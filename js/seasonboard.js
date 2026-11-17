// js/seasonboard.js —— 本地周榜(每周重置)
// 记录本周经典/狂热最高分,自然周切换时自动重置。纯本地,可 Node 测试。
var liveopsMod = require('./liveops');

var KEY = 'merge_watermelon_weekly';

function weekKey(key) {
  var p = liveopsMod.dayKey(key).split('-');
  var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  var start = new Date(d.getFullYear(), 0, 1);
  var days = Math.floor((d.getTime() - start.getTime()) / 86400000);
  var wk = Math.floor(days / 7) + 1;
  return d.getFullYear() + '-W' + (wk < 10 ? '0' : '') + wk;
}

function readState() {
  var o;
  try { o = tt.getStorageSync(KEY); } catch (e) { o = null; }
  if (typeof o !== 'object' || o === null || o instanceof Array) o = {};
  if (typeof o.key !== 'string') o = {};
  return o;
}

function writeState(o) {
  try { tt.setStorageSync(KEY, o); } catch (e) {}
}

function getWeek(key) {
  var wk = weekKey(key);
  var o = readState();
  if (o.key !== wk) {
    o = { key: wk, classic: 0, frenzy: 0 };
    writeState(o);
  }
  return { key: o.key, classic: o.classic || 0, frenzy: o.frenzy || 0 };
}

// 记录成绩,返回是否刷新本周纪录
function record(mode, score, key) {
  score = Math.max(0, Math.floor(score) || 0);
  var wk = weekKey(key);
  var o = readState();
  if (o.key !== wk) o = { key: wk, classic: 0, frenzy: 0 };
  var field = mode === 'frenzy' ? 'frenzy' : 'classic';
  var isNew = score > (o[field] || 0);
  if (isNew) { o[field] = score; writeState(o); }
  return isNew;
}

function reset() {
  writeState({});
}

module.exports = {
  KEY: KEY,
  weekKey: weekKey,
  getWeek: getWeek,
  record: record,
  reset: reset
};
