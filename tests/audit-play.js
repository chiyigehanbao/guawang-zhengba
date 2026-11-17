// tests/audit-play.js —— 自玩+自查:开门体验 / 智能游玩 / 面板布局越界审计
// 目标:尽量站在"真人第一次打开"的视角找问题并量化可玩性。退出码 0 = 无问题。
'use strict';

var _store = {};
var rafQueue = [];
function makeCtx() {
  var t = {};
  return new Proxy(t, {
    get: function (o, k) {
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return function () { return { addColorStop: function () {} }; };
      if (k === 'measureText') return function (s) { return { width: (s ? String(s).length : 0) * 8 }; };
      if (k === 'roundRect') return function () {};
      if (k in o) return o[k];
      return function () {};
    },
    set: function (o, k, v) { o[k] = v; return true; }
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
  exitMiniProgram: function (o) { if (o && o.success) o.success({}); },
  setUserCloudStorage: function (o) { if (o && o.success) o.success({}); },
  canvasToTempFilePath: function (o) { if (o && o.success) o.success({ tempFilePath: 'a.png' }); },
  shareAppMessage: function () {},
  getOpenDataContext: function () { return { canvas: sharedCanvas, postMessage: function () {} }; }
};

var Game = require('../js/game');

var fail = 0;
function ok(c, m, extra) { if (!c) { fail += 1; console.log('  ✗ ' + m + (extra ? '(' + extra + ')' : '')); } }

// ---------- A. 开门体验(真人第一视角) ----------
console.log('== A. 开门体验 ==');
_store = {}; // 全新玩家
var g0 = new Game();
ok(g0.privacyOpen, '首次打开先弹隐私提示');
g0.render();
var agreeBtn = (g0.privacyBtns || []).filter(function (b) { return b.act === 'agree'; })[0];
ok(!!agreeBtn, '隐私弹窗有同意按钮');
if (agreeBtn) g0.onTap(agreeBtn.x + 5, agreeBtn.y + 5);
ok(!g0.privacyOpen, '同意后隐私弹窗关闭');
ok(g0.noticeOpen, '首次打开弹公告');
g0.onTap(200, 400); // 关闭公告
g0.render();
ok(g0.panel === null && !g0.started, '公告关闭后回到主菜单');
ok(g0.menuIcons && g0.menuIcons.profile && g0.menuIcons.settings, '主菜单有存档/设置入口');
var mL0 = g0.menuLayout();
ok(mL0.by > 100 && mL0.gy4 + 30 <= g0.floorY, '主菜单层级在屏幕内');
// 主菜单各入口渲染不炸
['themes', 'growth', 'daily', 'missions', 'profile', 'settings', 'help', 'records', 'shop', 'welfare'].forEach(function (p) {
  g0.openPanel(p); g0.render();
  ok(g0.lastRenderErr === undefined, '面板 ' + p + ' 渲染无异常');
});
g0.openPanel('collection'); g0.render();
ok(g0.lastRenderErr === undefined, '图鉴面板渲染无异常');
g0.toMenu();

// ---------- B. 确定性验收:会玩的玩家能否通关第 1 关 ----------
console.log('== B. 第 1 关可通关(确定性) ==');
function tryClearL1() {
  _store = { merge_watermelon_privacy: 'agreed' };
  var g = new Game();
  g.specialChance = function () { return 0; };
  g.startClassic();
  var i, x = 200;
  for (i = 0; i < 60 && !g.over && g.level < 2; i++) {
    if (g.perkChoices) { g.applyPerk(g.perkLayout()[0].perk); }
    if (g.clearPause > 0) { g.clearPause = 0; g.clearInfo = null; }
    if (g.level >= 2) break;
    x = ((i % 2) ? 160 : 240) + (Math.random() - 0.5) * 20; // 两列交替 + 手指抖动
    g.onTap(x, 240);
    for (var f = 0; f < 60 && !g.over; f++) { g.update(1 / 60); if (g.level >= 2) break; }
  }
  var alive = g.world.fruits.filter(function (fr) { return !fr.dead; }).length;
  return { level: g.level, score: g.score, alive: alive, over: g.over, drops: i };
}
var CL = 8;
var clears = 0, minLv = 99, totalSc = 0;
for (var ct = 0; ct < CL; ct++) {
  var rr = tryClearL1();
  totalSc += rr.score;
  if (rr.level >= 2) clears += 1;
  if (rr.level < minLv) minLv = rr.level;
  if (rr.alive > 40) ok(false, 'clear run ' + ct + ' 实体过多');
}
console.log('  通关 ' + clears + '/' + CL + ' · 最差到达关卡 ' + minLv + ' · 平均分 ' + Math.round(totalSc / CL));
ok(clears === CL, '第 1 关能稳定通关(新手大门不卡人)', clears + '/' + CL);

// ---------- C. 面板布局越界审计 ----------
console.log('== C. 布局越界 ==');
function RECT(panel, name, list) {
  var bad = [];
  for (var i = 0; i < list.length; i++) {
    var r = list[i];
    if (!r) continue;
    if (r.x < 0 || r.y < 0 || r.x + (r.w || 0) > g0.W + 1 || r.y + (r.h || 0) > g0.H + 1) bad.push(i + ':' + JSON.stringify(r));
  }
  ok(bad.length === 0, panel + ' ' + name + ' 均在屏幕内' + (bad.length ? '' : ''), bad.join(' | '));
}
var PANELS = {
  themes: ['themeCards'],
  growth: ['growthCards'],
  daily: [],
  missions: ['missionCards'],
  settings: [],
  shop: ['shopCards', 'gpCards'],
  achievements: ['achFilterBtns', 'achCatBtns'],
  collection: ['collectionRects']
};
for (var pg in PANELS) {
  g0.openPanel(pg); g0.render();
  for (var ri = 0; ri < PANELS[pg].length; ri++) {
    var key = PANELS[pg][ri];
    if (g0[key]) RECT(pg, key, g0[key]);
    else ok(false, pg + ' 应有 ' + key + ' 矩形记录');
  }
}
g0.openPanel('daily'); g0.render();
ok(!!g0.dailyBtns.weekStart, '每日面板含周赛卡片');
RECT('daily', 'dailyBtns', Object.keys(g0.dailyBtns).map(function (k) { return g0.dailyBtns[k]; }));
g0.openPanel('shop'); g0.render();
RECT('shop', 'shopAdBtn', [g0.shopAdBtn]);
// 结算面板按钮位置
_store = {}; var gE = new Game(); gE.startClassic(); gE.score = 300; gE.endGame();
ok(gE.over, '可结算');
console.log('\n== 汇总 ==');
console.log(fail === 0 ? 'AUDIT PASS' : 'AUDIT FAIL ' + fail);
if (typeof process !== 'undefined') process.exit(fail === 0 ? 0 : 1);