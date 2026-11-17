// tests/diag-level.js —— 诊断:为什么第 2 关就强制结束
// 复用 bot-test 的 mock,机器人反复点屏,观察每关危险线/堆高/判负时机。
'use strict';
var _store = { merge_watermelon_privacy: 'agreed', merge_watermelon_notice_seen: 'n1' };
var W = parseInt(process.argv[3], 10) || 375;
var H = parseInt(process.argv[4], 10) || 812;
global.tt = {
  getSystemInfoSync: function () {
    return { windowWidth: W, windowHeight: H, pixelRatio: 3, safeArea: { left: 0, right: W, top: 0, bottom: H - 10 } };
  },
  createCanvas: function () {
    var canvas = { width: 400, height: 800 };
    canvas.getContext = function () { return makeCtx(); };
    return canvas;
  },
  getStorageSync: function (k) { return _store[k] === undefined ? '' : _store[k]; },
  setStorageSync: function (k, v) { _store[k] = v; },
  onTouchStart: function () {},
  vibrateShort: function () {},
  setInnerAudioOption: function () {},
  createInnerAudioContext: function () { return { obeyMuteSwitch: true, volume: 1, src: '', stop: function () {}, play: function () {}, destroy: function () {} }; },
  exitMiniProgram: function () {},
  setUserCloudStorage: function () {},
  canvasToTempFilePath: function (o) { if (o && o.success) o.success({ tempFilePath: 'x.png' }); },
  shareAppMessage: function () {},
  getOpenDataContext: function () { return { canvas: { width: 0, height: 0, style: {} }, postMessage: function () {} }; }
};
function makeCtx() {
  function grad() { return { addColorStop: function () {} }; }
  return new Proxy({}, {
    get: function (t, k) {
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return grad;
      if (k === 'measureText') return function (s) { return { width: (s ? String(s).length : 0) * 8 }; };
      if (k === 'roundRect') return function () {};
      if (k in t) return t[k];
      return function () {};
    },
    set: function (t, k, v) { t[k] = v; return true; }
  });
}
global.requestAnimationFrame = function () {};

var Game = require('../js/game');
var ach = require('../js/achievements');

var g = new Game();
g.pickType = function () { return 0; };
g.specialChance = function () { return 0; };

function tap(x, y) { g.onTap(x, y); g.render(); }
function frame() { g.update(1 / 60); g.render(); }
function settle(n) { for (var i = 0; i < n; i++) frame(); }
function pileTop() {
  var min = Infinity;
  for (var i = 0; i < g.world.fruits.length; i++) {
    var f = g.world.fruits[i];
    if (f.dead) continue;
    var top = f.y - f.r;
    if (top < min) min = top;
  }
  return min === Infinity ? -1 : Math.round(min);
}

console.log('窗口 ' + g.W + 'x' + g.H + ' scale=' + g.scale.toFixed(3));
if (process.argv[2] === 'frenzy') {
  tap(g.W / 2, 380); // 右半 = 狂热
} else {
  tap(g.W / 2 - 30, 380); // 经典按钮在左侧 (x < W/2), 点 W/2 会误触狂热
}
console.log('started=' + g.started + ' mode=' + g.mode + ' 第 1 关 dangerLine=' + g.dangerLine.toFixed(1) + ' target=' + g.levelTarget);

var drops = 0, level = g.level;
while (!g.over && drops < 500) {
  if (g.clearPause > 0) { settle(2); continue; }
  if (g.level !== level) {
    console.log('→ 通关到第 ' + g.level + ' 关: dangerLine=' + g.dangerLine.toFixed(1) + ' target=' + g.levelTarget + ' (scale=' + g.scale.toFixed(3) + ')');
    level = g.level;
  }
  tap(g.W / 2, 300);
  settle(75);
  drops++;
  if (drops % 25 === 0) {
    console.log('  掉落 ' + drops + ' 颗, level=' + g.level + ' pileTop=' + pileTop() + ' dangerLine=' + g.dangerLine.toFixed(1) + ' 水果数=' + g.world.fruits.length);
  }
}
console.log('\n=== 结果 ===');
console.log('over=' + g.over + ' 在第 ' + g.level + ' 关, 掉落 ' + drops + ' 颗, score=' + g.score);
if (g.over) console.log('结束时刻 pileTop=' + pileTop() + ' dangerLine=' + g.dangerLine.toFixed(1) + ' aboveTimer触发前水果数=' + g.world.fruits.length);
