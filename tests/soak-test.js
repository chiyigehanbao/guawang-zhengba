// tests/soak-test.js —— 无头长程稳定性测试(soak)
// 模拟一连串对局:每局随机点屏+物理推进+结算,检查无 NaN、无渲染异常、
// 数组/实体规模有界(内存泄漏信号)、循环收敛。退出码 0 = 通过。
'use strict';

var _store = {};
var rafQueue = [];
var _calls = { setUserCloudStorage: [], shareAppMessage: [], exitMiniProgram: 0 };

function makeCtx() {
  var target = {};
  return new Proxy(target, {
    get: function (t, k) {
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return function () { return { addColorStop: function () {} }; };
      if (k === 'measureText') return function (s) { return { width: (s ? String(s).length : 0) * 8 }; };
      if (k === 'roundRect') return function (x, y, w, h, r) { target._rect = [x, y, w, h]; };
      if (k in t) return t[k];
      return function () {};
    },
    set: function (t, k, v) { t[k] = v; return true; }
  });
}
var sharedCanvas = { width: 0, height: 0, style: {} };
global.requestAnimationFrame = function (cb) { rafQueue.push(cb); };
global.tt = {
  getSystemInfoSync: function () { return { windowWidth: 400, windowHeight: 800, pixelRatio: 2, safeArea: { left: 0, right: 400, top: 0, bottom: 790 } }; },
  createCanvas: function () { return { width: 400, height: 800, getContext: function () { return makeCtx(); } }; },
  getStorageSync: function (k) { return _store[k] === undefined ? '' : _store[k]; },
  setStorageSync: function (k, v) { _store[k] = v; },
  onTouchStart: function () {},
  vibrateShort: function () {},
  setInnerAudioOption: function () {},
  createInnerAudioContext: function () { return { obeyMuteSwitch: true, volume: 1, src: '', stop: function () {}, play: function () {}, destroy: function () {} }; },
  exitMiniProgram: function (o) { _calls.exitMiniProgram += 1; if (o && o.success) o.success({}); },
  setUserCloudStorage: function (o) { _calls.setUserCloudStorage.push(o && o.KVDataList); },
  canvasToTempFilePath: function (o) { if (o && o.success) o.success({ tempFilePath: 's.png' }); },
  shareAppMessage: function (o) { _calls.shareAppMessage.push(o); },
  getOpenDataContext: function () { return { canvas: sharedCanvas, postMessage: function () {} }; }
};

var Game = require('../js/game');

var fail = 0;
function ok(c, m) { if (!c) { fail += 1; console.log('  ✗ ' + m); } }

function rand(n) { return Math.floor(Math.random() * n); }

function runOne(seed) {
  _store = { merge_watermelon_privacy: 'agreed' };
  var g = new Game();
  g.pickType = function () { return rand(4); };
  g.specialChance = function () { return Math.random() < 0.2; };
  // 随机选模式
  g.onTap(100 + (seed % 200), 380);
  if (!g.started) {
    if (seed % 3 === 0) g.startFrenzy(); else g.startClassic();
  }
  var renderErr = null;
  var updateErr = null;
  var warns = 0;
  var steps = 18 + (seed % 26);
  for (var i = 0; i < steps; i++) {
    var act = rand(100);
    if (act < 6) {
      // 随机打开面板
      var panels = ['themes', 'growth', 'daily', 'missions', 'profile', 'settings', 'help', 'shop', 'welfare', 'achievements', 'collection'];
      g.openPanel(panels[rand(panels.length)]);
    } else if (act < 9) {
      g.openLeaderboard(rand(5000));
    } else if (act < 12) {
      g.paused = true;
      g.onPauseTap(g.W / 2, 336 - 46);
      g.paused = false;
    } else if (act < 15) {
      if (g.energy >= skills.ENERGY_MAX) g.useSkill('hammer', 200, 400);
      if (g.energy >= skills.ENERGY_MAX) g.useShuffle();
    } else if (act < 18) {
      // 强制通关一次(经典)以触发机关/Boss/天赋
      if (g.mode === 'classic') { g.levelProgress = g.levelTarget; try { g.levelClearCheck(); } catch (e) { updateErr = e; } if (g.pendingPerk) { g.pendingPerk = false; g.openPerkDraft(); } if (g.perkChoices && g.perkLayout()[0]) { g.applyPerk(g.perkLayout()[0].perk); } }
      if (g.clearPause > 0) { g.clearPause = 0; g.clearInfo = null; }
    } else {
      var x = 40 + rand(320);
      var y = 80 + rand(560);
      g.onTap(x, y);
    }
    for (var f = 0; f < 46; f++) {
      try { g.update(1 / 60); } catch (e) { updateErr = updateErr || e; }
      if (g.perkChoices && g.perkLayout()[0]) { g.applyPerk(g.perkLayout()[0].perk); }
      if (g.clearPause > 0) { g.clearPause = 0; g.clearInfo = null; }
      if (g.over) break;
    }
    if (g.over) break;
    if (g.particles.length > 300) warns += 1;
    if (g.world.fruits.length > 80) warns += 1;
  }
  if (!g.over) { g.score += rand(600); try { g.endGame(); } catch (e) { updateErr = updateErr || e; } }
  ok(renderErr === null && g.lastRenderErr === undefined, 'run ' + seed + ' 无渲染异常');
  ok(updateErr === null, 'run ' + seed + ' 无 update/关卡异常');
  ok(isFinite(g.score), 'run ' + seed + ' 分数有限');
  ok(g.world.fruits.every(function (fr) { return isFinite(fr.x) && isFinite(fr.y) && isFinite(fr.r) && isFinite(fr.vx) && isFinite(fr.vy); }), 'run ' + seed + ' 实体无 NaN');
  ok(warns === 0, 'run ' + seed + ' 粒子/实体规模有界');
  var maxFruits = 0;
  for (var k = 0; k < g.world.fruits.length; k++) if (g.world.fruits[k].x > maxFruits) maxFruits = g.world.fruits[k].x;
  return { over: g.over, score: g.score };
}

var skills = require('../js/skills');

var TOTAL = 300;
var stats = { over: 0, scoreTotal: 0 };
for (var s = 0; s < TOTAL; s++) {
  var r = runOne(s);
  if (r.over) stats.over += 1;
  stats.scoreTotal += r.score;
}
var fx = require('../js/fruits');
console.log('== soak(fuzz) ==');
console.log('局数 ' + TOTAL + ' · 结束局 ' + stats.over + ' · 平均分 ' + Math.round(stats.scoreTotal / TOTAL) + ' · 水果等级 ' + fx.TYPES.length);
console.log(fail === 0 ? 'SOAK PASS' : 'SOAK FAIL ' + fail);
if (typeof process !== 'undefined') process.exit(fail === 0 ? 0 : 1);