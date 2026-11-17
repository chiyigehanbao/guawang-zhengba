// tests/bot-test.js —— 「瓜王争霸」上线前机器人冒烟测试
// 纯 Node、零依赖:mock 掉 tt 与 canvas,直接驱动 fruits / levels / themes /
// achievements / physics,并实例化完整 Game 模拟「机器人点屏 + 物理推进」。
//
// 运行方式:
//   A. 本机有 Node:  node tests/bot-test.js   (退出码 0 = 全部通过)
//   B. 抖音开发者工具「命令行」或用 IDE 打开直接跑,结果同 A
//   C. 无 Node:把本文件放进工具的 JS 面板执行,看打印的 PASS/FAIL 汇总
//
// 覆盖:水果表 / 100 关曲线 / 主题解锁 / 11 项成就判定 / 物理合成链 /
//       关卡通关·插页·暂停·退出·排行·面板·主题切换·渲染无异常。

'use strict';

// ---------------------------------------------------------------- tt mock
// 默认视为今日已玩过首局,避免「每日首局双倍」干扰既有结算断言(AL 段单独覆盖)
function _todayKey() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
var _store = { merge_watermelon_privacy: 'agreed', merge_watermelon_first_run_day: _todayKey() };
var _calls = {
  exitMiniProgram: 0,
  setUserCloudStorage: [],
  shareAppMessage: [],
  canvasToTempFilePath: 0,
  postMessage: []
};
var _touchStart = null;

function makeCtx() {
  var target = {};
  function gradStub() { return { addColorStop: function () {} }; }
  return new Proxy(target, {
    get: function (t, k) {
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return gradStub;
      if (k === 'measureText') return function (s) { return { width: (s ? String(s).length : 0) * 8 }; };
      if (k === 'roundRect') return function (x, y, w, h, r) { target._rect = [x, y, w, h]; };
      if (k in t) return t[k];
      return function () {};
    },
    set: function (t, k, v) { t[k] = v; return true; }
  });
}

function makeCanvas() {
  var canvas = { width: 400, height: 800 };
  canvas.getContext = function () { return makeCtx(); };
  return canvas;
}

var sharedCanvas = { width: 0, height: 0, style: {} };
var rafQueue = [];

global.requestAnimationFrame = function (cb) { rafQueue.push(cb); };

global.tt = {
  getSystemInfoSync: function () {
    return {
      windowWidth: 400, windowHeight: 800, pixelRatio: 2,
      safeArea: { left: 0, right: 400, top: 0, bottom: 790 }
    };
  },
  createCanvas: makeCanvas,
  getStorageSync: function (k) { return _store[k] === undefined ? '' : _store[k]; },
  setStorageSync: function (k, v) { _store[k] = v; },
  onTouchStart: function (cb) { _touchStart = cb; },
  vibrateShort: function () {},
  setInnerAudioOption: function () {},
  createInnerAudioContext: function () {
    return { obeyMuteSwitch: true, volume: 1, src: '', stop: function () {}, play: function () {}, destroy: function () {} };
  },
  exitMiniProgram: function (opts) {
    _calls.exitMiniProgram += 1;
    if (opts && opts.success) opts.success({});
  },
  setUserCloudStorage: function (opts) {
    _calls.setUserCloudStorage.push(opts && opts.KVDataList);
  },
  canvasToTempFilePath: function (opts) {
    _calls.canvasToTempFilePath += 1;
    if (opts && opts.success) opts.success({ tempFilePath: 'mock_share.png' });
  },
  shareAppMessage: function (opts) { _calls.shareAppMessage.push(opts); },
  getOpenDataContext: function () {
    return {
      canvas: sharedCanvas,
      postMessage: function (m) { _calls.postMessage.push(m); }
    };
  }
};

function clearStorage() { _store = {}; _store['merge_watermelon_notice_seen'] = 'n1'; _store['merge_watermelon_privacy'] = 'agreed'; _store['merge_watermelon_first_run_day'] = _todayKey(); if (typeof achMod !== 'undefined' && achMod.reload) achMod.reload(); if (typeof missions !== 'undefined' && missions.reload) missions.reload(); }
function resetCalls() {
  _calls.exitMiniProgram = 0;
  _calls.setUserCloudStorage = [];
  _calls.shareAppMessage = [];
  _calls.canvasToTempFilePath = 0;
  _calls.postMessage = [];
}

// ------------------------------------------------------------ test runner
var passCount = 0, failCount = 0, renderErr = null;
function ok(cond, msg) {
  if (cond) { passCount += 1; }
  else { failCount += 1; console.log('  ✗ ' + msg); }
}
function eq(a, b, msg) { ok(a === b, msg + ' (期望 ' + JSON.stringify(b) + ' 实际 ' + JSON.stringify(a) + ')'); }
function near(a, b, tol, msg) { ok(Math.abs(a - b) <= tol, msg + ' (期望~' + b + ' 实际 ' + a + ')'); }
function section(name) { console.log('\n== ' + name + ' =='); }

function renderChecked(g) {
  try { g.render(); }
  catch (e) { renderErr = renderErr || e; }
}

function frame(g, dt) {
  dt = dt === undefined ? 1 / 60 : dt;
  g.update(dt);
  renderChecked(g);
}

function settle(g, frames) {
  for (var i = 0; i < frames; i++) frame(g);
}

function tap(g, x, y) {
  if (_touchStart) {
    _touchStart({ touches: [{ clientX: x, clientY: y }] });
  } else {
    g.onTap(x, y);
  }
  renderChecked(g);
}

// ------------------------------------------------------------- load modules
var fruits = require('../js/fruits');
var levels = require('../js/levels');
var themes = require('../js/themes');
var achMod = require('../js/achievements');
var physics = require('../js/physics');
var shareMod = require('../js/share');
var Game = require('../js/game');
var perks = require('../js/perks');
var progression = require('../js/progression');
var liveops = require('../js/liveops');
var monetize = require('../js/monetize');
var missions = require('../js/missions');
var save = require('../js/save');
var settings = require('../js/settings');
var skills = require('../js/skills');
var dailytasks = require('../js/dailytasks');
var seasonboard = require('../js/seasonboard');
var account = require('../js/account');
var history = require('../js/history');
var weeklytasks = require('../js/weeklytasks');
var leaderboard = require('../js/leaderboard');
var i18n = require('../js/i18n');
var cloud = require('../js/cloud');
var skillup = require('../js/skillup');
var shop = require('../js/shop');
var dda = require('../js/dda');
var weekevent = require('../js/weekevent');
var rewards = require('../js/rewards');
var notice = require('../js/notice');
var gpexchange = require('../js/gpexchange');

// ---------------------------------------------------------- A. 水果数据
section('A. fruits.js 水果表');
eq(fruits.TYPES.length, 11, '水果共 11 种');
var prevR = 0, prevS = 0, radiiOk = true, scoresOk = true, radiusInc = [], scoreInc = [];
for (var ti = 0; ti < fruits.TYPES.length; ti++) {
  var T = fruits.TYPES[ti];
  if (!(T.radius > prevR)) { radiiOk = false; radiusInc.push(ti); }
  if (!(T.score > prevS)) { scoresOk = false; scoreInc.push(ti); }
  prevR = T.radius; prevS = T.score;
}
ok(radiiOk, '半径严格递增' + (radiiOk ? '' : ' 异常下标:' + radiusInc.join(',')));
ok(scoresOk, '分值严格递增' + (scoresOk ? '' : ' 异常下标:' + scoreInc.join(',')));
var poolOk = fruits.DROP_POOL.every(function (v) { return v >= 0 && v < fruits.TYPES.length; });
ok(poolOk, 'DROP_POOL 下标合法');
ok(fruits.DROP_POOL.indexOf(10) === -1, '王(10)不进掉落池');

// ---------------------------------------------------------- B. 关卡曲线
section('B. levels.js 100 关曲线');
eq(levels.MAX_LEVEL, 100, 'MAX_LEVEL');
var d1 = levels.getLevelDef(1);
eq(d1.dangerLine, 190, '第 1 关危险线 190(新手宽松)');
ok(levels.getLevelDef(100).dangerLine >= 80, '第 100 关危险线 >= 80 保底');
var dangerMono = true, targetMonoInStage = true, chk, prevD = Infinity;
var stageMaxType = [3, 4, 5, 6, 7, 7, 8, 8, 8, 8];
var maxTypeOk = true, targetPos = true, bonusInc = true, specialMono = true, prevSp = -1, prevBonus = -1;
var prevInStageTarget = Infinity;
for (var lv = 1; lv <= 100; lv++) {
  chk = levels.getLevelDef(lv);
  if (!(chk.dangerLine <= prevD + 0.001)) { dangerMono = false; }
  prevD = chk.dangerLine;
  if (chk.dangerLine < 80) dangerMono = false;
  if (!(chk.target > 0)) targetPos = false;
  if (!(chk.bonus > prevBonus)) { bonusInc = false; }
  prevBonus = chk.bonus;
  if (!(chk.specialChance >= prevSp - 0.00001)) { specialMono = false; }
  prevSp = chk.specialChance;
  if (!(chk.specialChance <= 0.25)) specialMono = false;
  if (chk.inStage === 1) {
    prevInStageTarget = chk.target;
  } else if (chk.target < prevInStageTarget - 0.001) {
    targetMonoInStage = false;
  } else {
    prevInStageTarget = chk.target;
  }
  var wantMT = stageMaxType[Math.floor((lv - 1) / 10)];
  if (chk.maxType !== wantMT) { maxTypeOk = false; }
  if (chk.stage.idx !== Math.min(9, Math.floor((lv - 1) / 10))) maxTypeOk = false;
}
ok(dangerMono, '危险线全程单调不升且保底 80');
ok(targetPos, '各关目标分为正');
ok(bonusInc, '通关奖励随等级递增');
ok(specialMono, '特殊球概率 0.08~0.25 单调非降封顶');
ok(targetMonoInStage, '章节内目标分单调不降(每章重开新曲线)');
ok(maxTypeOk, '各章 maxType 符合预期表');
var w1 = levels.getDropWeights(1, 3);
eq(w1.join(','), '4,3,2,1', '第 1 关掉落权重');
var w40 = levels.getDropWeights(40, 6);
eq(w40.join(','), '7,6,5,4,3,3,2', '第 40 关掉落权重(末两档 +1)');
var w75 = levels.getDropWeights(75, 8);
eq(w75.join(','), '9,8,7,6,5,4,3,4,3', '第 75 关掉落权重(末两档 +2)');
var w65 = levels.getDropWeights(65, 8);
eq(w65.join(','), '9,8,7,6,5,4,4,4,3', '第 65 关大果三档再 +1');
eq(levels.getStage(61).rule, 'bigbomb', '第 7 章规则 大果炸弹潮');
eq(levels.getStage(61).sub, '大果炸弹潮', '第 7 章说明');
eq(levels.getStage(71).rule, 'dense', '第 8 章规则 障碍加倍');
eq(levels.getStage(81).rule, 'magnet', '第 9 章规则 磁吸乱流');
eq(levels.getStage(91).rule, 'spike', '第 10 章规则 毒刺夹道');
eq(levels.getStage(51).rule, undefined, '第 6 章无后期规则');
var beyond = levels.getLevelDef(101);
eq(beyond.stage.idx, 9, '超 100 关 clamp 到最后章节');
eq(beyond.target, 3600, '第 101 关目标分(300*12.0)');
var bonusCheck = levels.getLevelDef(7).bonus;
eq(bonusCheck, 150 + 7 * 55, 'bonus 公式 150+level*55');

// ---------------------------------------------------------- C. 主题
section('C. themes.js 主题与解锁');
eq(themes.getList().length, 7, '共 7 个主题');
eq(themes.getTheme('space').ach, 2, '星际门槛成就 2');
eq(themes.getTheme('neon').ach, 12, '霓虹门槛成就 12');
eq(themes.getTheme('festival').ach, 16, '派对主题成就门槛 16');
eq(themes.getTheme('festival').season, undefined, '派对主题不再依赖赛季');
ok(!themes.isUnlocked('space'), '0 成就不可解锁星际');
clearStorage();
_store['merge_watermelon_achievements'] = { first_clear: 1, first_king: 1 };
achMod.reload();
ok(themes.isUnlocked('space'), '2 成就解锁星际');
ok(!themes.isUnlocked('hotpot'), '2 成就仍不可解锁火锅');
var tBad = themes.getTheme('nope');
eq(tBad.id, 'classic', '未知主题回退 classic');
var themeShapeOk = themes.getList().every(function (t) {
  return Array.isArray(t.bg) && t.bg.length === 2 &&
    typeof t.container === 'string' &&
    Array.isArray(t.deco) && t.deco.length === 5 &&
    Array.isArray(t.ambient) && t.ambient.length >= 2;
});
ok(themeShapeOk, '每个主题结构完整(bg/container/deco/ambient)');
clearStorage();

// ---------------------------------------------------------- D. 成就逻辑
section('D. achievements.js 判定与持久化');
ok(typeof achMod.getCollection === 'function', '回归:getCollection 已导出');
eq(achMod.getList().length, 20, '成就共 20 项');
var ids = achMod.getList().map(function (d) { return d.id; });
eq(ids.filter(function (v, i) { return ids.indexOf(v) === i; }).length, ids.length, '成就 id 无重复');

function fresh() { clearStorage(); }
function unlockAllAch() {
  var o = {};
  achMod.getList().forEach(function (d) { o[d.id] = 1; });
  _store['merge_watermelon_achievements'] = o;
  _store['merge_watermelon_allach_bounty'] = 1;
  achMod.reload();
}
function checkCtx(o) {
  return { runLevel: o.runLevel || 1, runMadeKing: !!o.runMadeKing, runMaxCombo: o.runMaxCombo || 0,
    runSpecials: o.runSpecials || {}, usedSpecialCount: o.usedSpecialCount || 0,
    maxLevel: o.maxLevel || 0, collectedCount: o.collectedCount || 0, mode: o.mode || 'classic',
    runScore: o.runScore || 0 };
}

fresh();
eq(achMod.check(checkCtx({})).length, 0, '空局不误解锁');
var fruitReads = 0;
var origGet = tt.getStorageSync;
tt.getStorageSync = function (k) { if (String(k).indexOf('fruit_counts') >= 0) fruitReads += 1; return origGet(k); };
achMod.reload();
achMod.addFruitCount(1);
var readsAfterFirst = fruitReads;
achMod.addFruitCount(1);
eq(fruitReads, readsAfterFirst, '再次计入合成不再读图鉴存档');
eq(achMod.getFruitCount(1), 2, '合成次数累加仍写入');
tt.getStorageSync = origGet;
achMod.reload();
ok(achMod.check(checkCtx({ runLevel: 2 })).some(function (d) { return d.id === 'first_clear'; }), 'first_clear:runLevel>=2 解锁');
fresh();
eq(achMod.check(checkCtx({ runLevel: 1 })).length, 0, 'first_clear:runLevel=1 不解锁');
fresh();
ok(achMod.check(checkCtx({ runMadeKing: true })).some(function (d) { return d.id === 'first_king'; }), 'first_king:合成西瓜解锁');
fresh();
eq(achMod.check(checkCtx({ runMadeKing: false })).length, 0, 'first_king:未合成不解锁');
fresh();
ok(achMod.check(checkCtx({ runMaxCombo: 10 })).some(function (d) { return d.id === 'combo10'; }), 'combo10:连击 10 解锁');
fresh();
eq(achMod.check(checkCtx({ runMaxCombo: 9 })).length, 0, 'combo10:连击 9 不解锁');
fresh();
ok(achMod.check(checkCtx({ maxLevel: 6 })).some(function (d) { return d.id === 'level5'; }), 'level5:maxLevel>=6 解锁');
fresh();
ok(achMod.check(checkCtx({ maxLevel: 21 })).some(function (d) { return d.id === 'level20'; }), 'level20:maxLevel>=21 解锁');
fresh();
ok(achMod.check(checkCtx({ maxLevel: 51 })).some(function (d) { return d.id === 'level50'; }), 'level50:maxLevel>=51 解锁');
fresh();
ok(achMod.check(checkCtx({ maxLevel: 101 })).some(function (d) { return d.id === 'level100'; }), 'level100:maxLevel>=101 解锁');
fresh();
ok(!achMod.check(checkCtx({ maxLevel: 100 })).some(function (d) { return d.id === 'level100'; }), 'level100:maxLevel=100 不解锁');
fresh();
ok(achMod.check(checkCtx({ mode: 'frenzy', runScore: 5000 })).some(function (d) { return d.id === 'frenzy5000'; }), 'frenzy5000:狂热 5000 分解锁');
fresh();
eq(achMod.check(checkCtx({ mode: 'classic', runScore: 5000 })).length, 0, 'frenzy5000:经典模式不解锁');
fresh();
ok(achMod.check(checkCtx({ runSpecials: { bomb: true } })).some(function (d) { return d.id === 'first_bomb'; }), 'first_bomb:用过炸弹解锁');
fresh();
achMod.markSpecialUsed('bomb'); achMod.markSpecialUsed('ice'); achMod.markSpecialUsed('star'); achMod.markSpecialUsed('magnet');
eq(achMod.getUsedSpecials().length, 4, '4 种特殊球已记录');
ok(achMod.check(checkCtx({ usedSpecialCount: 4 })).some(function (d) { return d.id === 'all_specials'; }), 'all_specials:4 种特殊球解锁');
achMod.markSpecialUsed('bomb');
eq(achMod.getUsedSpecials().length, 4, 'markSpecialUsed 幂等');
fresh();
achMod.markCollected(0); achMod.markCollected(1); achMod.markCollected(2); achMod.markCollected(3);
achMod.markCollected(4); achMod.markCollected(5); achMod.markCollected(6); achMod.markCollected(7);
achMod.markCollected(8); achMod.markCollected(9); achMod.markCollected(10);
eq(achMod.collectedCount(), 11, '图鉴集齐 11 种');
ok(achMod.check(checkCtx({ collectedCount: 11 })).some(function (d) { return d.id === 'collect_all'; }), 'collect_all:图鉴全齐解锁');
fresh();
achMod.markCollected(0);
eq(achMod.markCollected(0), false, 'markCollected 二次标记返回 false');
eq(achMod.collectedCount(), 1, 'collectedCount 正确');

// 重复解锁不重发
fresh();
var once = achMod.check(checkCtx({ runLevel: 2, runMadeKing: true }));
ok(once.length >= 2, '首轮同时解锁多个');
eq(achMod.check(checkCtx({ runLevel: 2, runMadeKing: true })).length, 0, '已解锁成就不再重复返回');

var titleMap = [[0, '水果萌新'], [1, '水果萌新'], [2, '合成学徒'], [4, '合成大师'], [6, '合成宗师'], [8, '合成果神'], [10, '果界传说'], [11, '果界传说'], [13, '果界至尊'], [16, '瓜王之王'], [21, '瓜王之王']];
titleMap.forEach(function (p) { eq(achMod.getTitle(p[0]), p[1], '称号:' + p[0] + ' 成就 → ' + p[1]); });

achMod.setMaxCombo(7); eq(achMod.getMaxCombo(), 7, 'maxCombo 持久化');
achMod.setMaxLevel(23); eq(achMod.getMaxLevel(), 23, 'maxLevel 持久化');
clearStorage();

// ---------------------------------------------------------- E. 物理引擎
section('E. physics.js 物理与合成');
var W800 = new physics.World(400, 740, 1);
var grape = W800.spawn(0, 200, 100);
for (var s1 = 0; s1 < 90; s1++) W800.step(1 / 60);
near(grape.y, 740 - 16, 1.5, '葡萄下落并停在地板(y-r=floorY)');
eq(grape.squash, 1, '高速落地触发挥压扁');
ok(grape.x >= 16 - 0.5, '葡萄未穿墙');
var wb = new physics.World(400, 740, 1);
var ball = wb.spawn(1, 5, 200); ball.vx = -300;
for (var s2 = 0; s2 < 30; s2++) wb.step(1 / 60);
ok(ball.x >= ball.r - 0.5, '左墙反弹不出界');

// 合成:两葡萄重叠 → 变樱桃
var mw = new physics.World(400, 740, 1);
var g1 = mw.spawn(0, 150, 740 - 16);
var g2 = mw.spawn(0, 160, 740 - 16);
var merged = false, mergeType = -1;
for (var s3 = 0; s3 < 20; s3++) {
  mw.step(1 / 60);
  var evs = mw.consumeEvents();
  for (var ei = 0; ei < evs.length; ei++) {
    if (evs[ei].type === 'merge') { merged = true; mergeType = evs[ei].newType; }
  }
  if (merged) break;
}
ok(merged, '同型水果接触触发 merge 事件');
eq(mergeType, 1, '葡萄+葡萄 → 樱桃(type1)');
var remaining = mw.fruits.filter(function (f) { return !f.dead; });
ok(remaining.length === 1 && remaining[0].type === 1, '合成后场上仅存 1 颗樱桃');
var crowd = new physics.World(800, 740, 1);
for (var ci = 0; ci < 20; ci++) crowd.spawn(2, 40 + (ci % 10) * 36, 140 + Math.floor(ci / 10) * 50);
crowd.spawn(0, 700, 740 - 16);
crowd.spawn(0, 710, 740 - 16);
var crowdMerged = false;
for (var cs = 0; cs < 30; cs++) {
  crowd.step(1 / 60);
  var ce = crowd.consumeEvents();
  for (var ck = 0; ck < ce.length; ck++) {
    if (ce[ck].type === 'merge' && ce[ck].oldType === 0) crowdMerged = true;
  }
  if (crowdMerged) break;
}
ok(crowdMerged, '格子宽相下,远处堆叠不漏检贴在一起的葡萄');
eq(remaining[0].pop, 1, '合成果带弹出缩放');
var gPop = new Game();
var pf = gPop.world.spawn(1, gPop.W / 2, gPop.floorY - 40);
pf.pop = 1;
renderChecked(gPop);
eq(gPop.lastRenderErr, undefined, '合成弹出渲染无异常');
gPop.decayPops(physics.POP_TIME / 2);
near(pf.pop, 0.5, 0.001, '弹出进度 0.16 秒线性回落到 0');
gPop.reducedMotion = true;
pf.pop = 1;
pf.squash = 1;
renderChecked(gPop);
eq(gPop.lastRenderErr, undefined, '减少动效时不放大不压扁,渲染无异常');
gPop.reducedMotion = false;
pf.squash = 1;
renderChecked(gPop);
eq(gPop.lastRenderErr, undefined, '落地压扁渲染无异常');
gPop.decayPops(physics.POP_TIME / 2);
near(pf.squash, 0.5, 0.001, '压扁进度与弹出同一段时间回落');
var gPu = new Game();
gPu.pushPopup(10, 20, '+8', 0.01);
eq(gPu.popups[0].text, '+8', '飘字文案');
eq(gPu.popups[0].big, false, '普通飘字不是大号');
gPu.updateFx(0.02);
eq(gPu.popups.length, 0, '飘字结束离队');
eq(gPu._popupPool.length, 1, '飘字回到对象池');
gPu.pushPopup(10, 20, '+9', 0.5, '#ffd54f', true);
eq(gPu._popupPool.length, 0, '再次飘字复用池内对象');
eq(gPu.popups[0].text, '+9', '复用后文案被覆盖');
eq(gPu.popups[0].big, true, '复用后大号标记被覆盖');
eq(gPu.popups[0].life, 0, '复用后生命从 0 开始');

// 西瓜(9)合成王(10);王不可再合成
var kw = new physics.World(400, 740, 1);
var k1 = kw.spawn(9, 150, 740 - 76);
var k2 = kw.spawn(9, 160, 740 - 76);
var kingType = -1;
for (var s4 = 0; s4 < 30; s4++) {
  kw.step(1 / 60);
  var kevs = kw.consumeEvents();
  for (var kj = 0; kj < kevs.length; kj++) if (kevs[kj].type === 'merge') kingType = kevs[kj].newType;
  if (kingType >= 0) break;
}
eq(kingType, 10, '两颗西瓜(9)合成王(10)');
var kw2 = new physics.World(400, 740, 1);
kw2.spawn(10, 150, 740 - 88);
kw2.spawn(10, 160, 740 - 88);
var kingMerged = false;
for (var s4b = 0; s4b < 30; s4b++) {
  kw2.step(1 / 60);
  var kevs2 = kw2.consumeEvents();
  for (var kj2 = 0; kj2 < kevs2.length; kj2++) if (kevs2[kj2].type === 'merge') kingMerged = true;
}
ok(!kingMerged, '两颗王(10)不再合成');

// 冻结/解冻
var fw = new physics.World(400, 740, 1);
var fr = fw.spawn(0, 200, 500); fr.vy = 300;
fw.freezeAll();
var fy0 = fr.y;
for (var s5 = 0; s5 < 60; s5++) fw.step(1 / 60);
ok(fr.iced, 'freezeAll 置 iced');
near(fr.y, fy0, 0.001, '冻结期间水果静止');
fw.thawAll();
ok(!fr.iced, 'thawAll 解除');
for (var s6 = 0; s6 < 60; s6++) fw.step(1 / 60);
ok(fr.y > fy0 + 10, '解冻后继续下落');

// 特殊球参数
var sp1 = new physics.World(400, 740, 1);
var bomb = sp1.spawnSpecial('bomb', 200, 100);
eq(bomb.kind, 'bomb', 'spawnSpecial 种类');
eq(bomb.r, 26, '炸弹半径 26');
eq(bomb.fuse, 1.4, '炸弹引信 1.4');
var sp2 = new physics.World(400, 740, 1);
eq(sp2.spawnSpecial('ice', 200, 100).r, 28, '冰球半径 28');
eq(sp2.spawnSpecial('star', 200, 100).r, 30, '星星半径 30');
eq(sp2.spawnSpecial('magnet', 200, 100).r, 32, '磁吸半径 32');
var sp3 = new physics.World(400, 740, 1);
var bo2 = sp3.spawnSpecial('bomb', 200, 100);
for (var s7 = 0; s7 < 90; s7++) sp3.step(1 / 60);
ok(bo2.armed, '炸弹落地后 armed');

// anyAbove 判定
var aw = new physics.World(400, 740, 1);
var top = aw.spawn(0, 200, 100);
ok(aw.anyAbove(150), '顶部水果在危险线之上');
for (var s8 = 0; s8 < 90; s8++) aw.step(1 / 60);
ok(!aw.anyAbove(150), '落地后脱离危险区');

// 压力:60 颗乱叠 3 秒不崩、坐标有限
var sw = new physics.World(400, 740, 1);
for (var st = 0; st < 60; st++) sw.spawn(st % 4, 40 + (st % 5) * 70, 100 + Math.floor(st / 5) * 30);
var nanFound = false;
for (var s9 = 0; s9 < 180; s9++) {
  sw.step(1 / 60);
  for (var sfi = 0; sfi < sw.fruits.length; sfi++) {
    var ff = sw.fruits[sfi];
    if (!isFinite(ff.x) || !isFinite(ff.y) || !isFinite(ff.r)) nanFound = true;
  }
}
ok(!nanFound, '压力测试无 NaN 坐标');
ok(sw.fruits.length >= 1, '压力测试后仍有存活水果');

// ---------------------------------------------------------- F. 完整 Game 集成(机器人点屏)
section('F. Game 集成:启动/掉落/合成/计分');
resetCalls();
clearStorage();
rafQueue = [];
var g = new Game();
eq(g.lastRenderErr, undefined, '构造+首帧渲染无异常');
eq(g.started, false, '初始在主菜单');
eq(g.mode, null, '初始无模式');
eq(g.level, 1, '初始第 1 关');
ok(g.pool.length === 10, '第 1 关掉落池 10 颗(权重 4+3+2+1)');
eq(g.theme.id, 'classic', '初始主题 classic');
var mLg = g.menuLayout();
ok(mLg.gy4 + 30 <= g.floorY, '菜单自适应:第 4 行按钮不越过地板');

// 通过真实输入通道点击「经典闯关」(16..192, 354..424)
g.pickType = function () { return 0; };
g.specialChance = function () { return 0; };
tap(g, 100, 380);
eq(g.started, true, '点击经典闯关进入游戏');
eq(g.mode, 'classic', '模式 classic');
eq(g.levelTarget, 100, '第 1 关目标 100(新手缓启动)');

// 连点同列,物理推进
var dropX = 200;
for (var dd = 0; dd < 12; dd++) {
  tap(g, dropX, 300);
  settle(g, 80);
}
ok(g.score > 0, '合成链产生分数(score=' + g.score + ')');
ok(g.runCtx.maxCombo >= 1, '连击计数生效(maxCombo=' + g.runCtx.maxCombo + ')');
ok(achMod.collectedCount() >= 2, '图鉴已收录 2+ 种(collected=' + achMod.collectedCount() + ')');
ok(g.levelProgress > 0, '关卡进度累加');
eq(g.over, false, '未爆板');

// 通关流程(确定性:直接把进度推到目标)
var scoreBeforeClear = g.score;
g.levelProgress = g.levelTarget;
g.levelClearCheck();
eq(g.level, 2, '通关后进入第 2 关');
eq(g.clearInfo.level, 1, 'clearInfo 记录已通关关卡');
eq(g.clearInfo.nextLevel, 2, 'clearInfo 记录下一关');
eq(g.clearInfo.bonus, 205, '第 1 关奖励 150+55');
eq(g.score, scoreBeforeClear + 205, '奖励已计入总分');
eq(g.clearPause, 1.4, '进入 1.4s 过关插页');
eq(achMod.getMaxLevel(), 2, 'maxLevel 同步更新');
var fruitsBeforePause = g.world.fruits.length;
var beforePause = g.clearPause;
for (var cpf = 0; cpf < 10; cpf++) frame(g);
ok(g.clearPause < beforePause && g.clearPause >= 0, '插页期间倒计时');
eq(g.world.fruits.length, fruitsBeforePause, '插页期间物理冻结');
tap(g, 200, 400); // 点击跳过插页
eq(g.clearPause, 0, '点击跳过插页');
eq(g.clearInfo, null, 'clearInfo 清空');
eq(g.levelDef.dangerLine, 149.1, '第 2 关危险线压缩');
ok(g.levelDef.specialChance >= 0.1, '第 2 关特殊球概率提升');

// 第 2 关继续可玩
tap(g, dropX, 300);
settle(g, 60);
eq(g.over, false, '通关后继续游玩不崩');

// ---------------------------------------------------------- G. 暂停/恢复/主页/退出
section('G. 暂停与退出');
tap(g, 256, 44); // ❚❚ 暂停按钮(W/2+56,44)
eq(g.paused, true, '点击暂停按钮进入暂停');
var px = g.world.fruits[g.world.fruits.length - 1];
var px0 = px ? px.y : 0;
for (var pf = 0; pf < 30; pf++) frame(g);
if (px) near(px.y, px0, 0.001, '暂停期间物理冻结');
tap(g, 200, 290); // ▶ 继续游戏
eq(g.paused, false, '点击继续恢复');

tap(g, 256, 44);
tap(g, 200, 394); // 🏠 返回主页
eq(g.paused, false, '主页按钮解除暂停');
eq(g.started, false, '返回主页后回主菜单');
eq(g.mode, null, '模式复位');

tap(g, 100, 380); // 重新开始经典
eq(g.started, true, '再次进入游戏');
tap(g, 256, 44);
tap(g, 200, 446); // 🚪 退出游戏
eq(g.paused, false, '退出按钮解除暂停');
ok(_calls.exitMiniProgram >= 1, 'tt.exitMiniProgram 被调用');

// ---------------------------------------------------------- H. 静音
section('H. 静音开关');
tap(g, 200, 44); // 顶栏静音(W/2,44)
eq(g.muted, true, '第一次点击静音');
eq(_store['merge_watermelon_muted'], 1, '静音状态持久化');
tap(g, 200, 44);
eq(g.muted, false, '第二次点击取消静音');

// ---------------------------------------------------------- I. 面板:图鉴/成就/主题
section('I. 面板导航与主题切换');
g.toMenu();
g.pickType = function () { return 0; };
g.specialChance = function () { return 0; };

tap(g, 80, 490); // 🏆 成就(menuBtns[0])
eq(g.panel, 'collection', '打开图鉴面板');
ok(g.panelTabs && g.panelTabs.c, '图鉴/成就双 tab 生成');
tap(g, 251, 122); // 成就 tab
eq(g.panel, 'achievements', '切换到成就 tab(render 无异常)');
eq(g.lastRenderErr, undefined, '成就列表渲染无异常(getCollection 回归)');
tap(g, 149, 122); // 图鉴 tab
eq(g.panel, 'collection', '切回图鉴 tab');
tap(g, 355, 83); // ✕ 关闭
eq(g.panel, null, '点击 ✕ 关闭面板');

// 主题面板
tap(g, 300, 490); // 🎨 主题(menuBtns[2])
eq(g.panel, 'themes', '打开主题面板');
ok(g.themeCards && g.themeCards.length === 7, '生成 7 张主题卡片');
tap(g, 285, 168); // 星际(锁定:0 成就)
eq(g.theme.id, 'classic', '锁定主题点击不变更');
ok(g.toastMsg && g.toastMsg.indexOf('解锁') >= 0, '提示解锁条件');
clearStorage();
_store['merge_watermelon_achievements'] = { first_clear: 1, first_king: 1 };
achMod.reload();
renderChecked(g); // 重绘主题面板,按新成就数刷新解锁状态
tap(g, 285, 168); // 星际(已解锁)
eq(g.theme.id, 'space', '解锁后点击切换到星际');
eq(_store['merge_watermelon_theme'], 'space', '主题选择持久化');
tap(g, 115, 168); // classic
eq(g.theme.id, 'classic', '可切回经典');
tap(g, 200, 30); // 面板外点击,关闭主题面板
eq(g.panel, null, '主题面板已关闭');
clearStorage();

// ---------------------------------------------------------- J. 排行
section('J. 好友排行(主域遮罩)');
resetCalls();
tap(g, 190, 490); // 👥 排行(menuBtns[1])
eq(g.leaderboardOpen, true, '排行浮层打开');
ok(_calls.postMessage.some(function (m) { return m.type === 'show'; }), '已向开放数据域发送 show');
tap(g, 200, 400);
eq(g.leaderboardOpen, false, '点击空白关闭排行');
ok(_calls.postMessage.some(function (m) { return m.type === 'hide'; }), '已发送 hide');

// ---------------------------------------------------------- K. 游戏结束与重开
section('K. 结算/重开/分享');
tap(g, 100, 380); // 开始经典
g.pickType = function () { return 0; };
g.specialChance = function () { return 0; };
g.world.spawn(3, 200, 60); // 顶部一颗,触发危险倒计时
g.aboveTimer = 1.799;
frame(g);
eq(g.over, true, '危险区超时判负');
ok(achMod.getMaxLevel() >= 1, '结算同步 maxLevel');
g.overAt = Date.now() - 1000;
tap(g, 100, 510); // ▶ 重新开始(over 左半)
eq(g.over, false, '结算页重开');
eq(g.level, 1, '重开后回到第 1 关');
eq(g.score, 0, '重开后分数清零');

// 新纪录
resetCalls();
g.score = 500;
g.endGame();
eq(g.newBest, true, 'endGame 判定新纪录');
eq(_store['merge_watermelon_best'], g.score, '新纪录写存储');
ok(_calls.setUserCloudStorage.length >= 1, '成绩上报开放数据域');
g.overAt = Date.now() - 1000;
resetCalls();
tap(g, 100, 560); // 结算页分享(over 左半 by3)
ok(_calls.shareAppMessage.length >= 1, '结算页分享弹出');
ok(_calls.shareAppMessage[0].title.indexOf('瓜王争霸') >= 0, '分享文案含品牌名');

// ---------------------------------------------------------- L. 限时狂热
section('L. 限时狂热模式');
g.toMenu();
tap(g, 300, 380); // 开始狂热
eq(g.started, true, '进入狂热模式');
eq(g.mode, 'frenzy', 'mode=frenzy');
eq(g.comboWindow, 1.5, '狂热连击窗口 1.5s');
eq(g.comboBonus, 0.15, '狂热连击加成 15%');
eq(g.bestKey, 'merge_watermelon_frenzy_best', '狂热独立最高分键');
eq(g.levelTarget, 300, '狂热固定目标');
g.frenzyLeft = 0.001;
frame(g);
eq(g.over, true, '60 秒倒计时结束结算');

// ---------------------------------------------------------- M. 渲染零异常
section('M. 全场景渲染冒烟');
eq(renderErr, null, '全程 render 未抛异常');
eq(g.lastRenderErr, undefined, 'loop 内 lastRenderErr 为空');

// ---------------------------------------------------------- N. 局内天赋
section('N. perks.js 局内天赋(Phase 1)');
ok(perks.POOL.length >= 8, '天赋池 >= 8(实际 ' + perks.POOL.length + ')');
var perkShapeOk = perks.POOL.every(function (p) {
  return typeof p.id === 'string' && typeof p.icon === 'string' &&
    typeof p.name === 'string' && typeof p.desc === 'string' &&
    p.mods && typeof p.mods === 'object';
});
ok(perkShapeOk, '每个天赋结构完整(id/icon/name/desc/mods)');
var perkIds = perks.POOL.map(function (p) { return p.id; });
eq(perkIds.filter(function (v, i) { return perkIds.indexOf(v) === i; }).length, perkIds.length, '天赋 id 无重复');

var dm = perks.DEFAULT_MOD();
eq(dm.comboWindowAdd, 0, '默认连击窗口加成 0');
eq(dm.bombRadiusMult, 1, '默认炸弹半径倍率 1');
eq(dm.scoreMult, 1, '默认得分倍率 1');
eq(dm.starChargesAdd, 0, '默认双倍次数加成 0');

var r3 = perks.roll(3, []);
eq(r3.length, 3, 'roll(3) 抽取 3 个');
eq(r3.filter(function (v, i) { return r3.indexOf(v) === i; }).length, 3, 'roll 结果互不相同');
var rex = perks.roll(3, [perks.POOL[0].id, perks.POOL[1].id]);
ok(rex.every(function (p) { return p.id !== perks.POOL[0].id && p.id !== perks.POOL[1].id; }), 'roll 排除已选 id');

var mA = perks.DEFAULT_MOD();
perks.apply(mA, perks.getById('quick_combo'));
near(mA.comboWindowAdd, 0.6, 0.0001, 'apply 叠加 comboWindowAdd');
perks.apply(mA, perks.getById('quick_combo'));
near(mA.comboWindowAdd, 1.2, 0.0001, '同天赋可叠加');
var mB = perks.DEFAULT_MOD();
perks.apply(mB, perks.getById('big_bang'));
near(mB.bombRadiusMult, 1.35, 0.0001, 'apply 炸弹半径乘法');
perks.apply(mB, perks.getById('big_bang'));
near(mB.bombRadiusMult, 1.35 * 1.35, 0.0001, '炸弹半径乘法叠加');
var mC = perks.DEFAULT_MOD();
perks.apply(mC, perks.getById('bonus_score'));
perks.apply(mC, perks.getById('bonus_score'));
near(mC.scoreMult, 1.12 * 1.12, 0.0001, '得分倍率乘法叠加');
ok(perks.hasInstant(perks.getById('windfall')), 'windfall 标记为即时加分');
ok(!perks.hasInstant(perks.getById('quick_combo')), '普通天赋非即时加分');
eq(perks.getById('nope'), null, '未知天赋返回 null');

// 集成:经典每 5 关触发抽选,选择后即时生效
clearStorage(); resetCalls(); rafQueue = [];
var g2 = new Game();
g2.pickType = function () { return 0; };
g2.specialChance = function () { return 0; };
tap(g2, 100, 380); // 经典
eq(g2.perkChoices, null, '开局无天赋抽选');
g2.level = 5; g2.refreshLevelDef();
g2.levelProgress = g2.levelTarget;
g2.levelClearCheck();
eq(g2.level, 6, '通关第 5 关进入第 6 关');
eq(g2.pendingPerk, true, '第 6 关挂起天赋抽选');
g2.clearPause = 0.001;
frame(g2);
ok(g2.perkChoices && g2.perkChoices.length === 3, '过关插页结束后弹出天赋三选一');
var comboSaved = g2.comboWindow;
var rects = g2.perkLayout();
eq(rects.length, 3, '天赋卡布局 3 张');
tap(g2, rects[0].x + 10, rects[0].y + 10); // 选第一张
eq(g2.perkChoices, null, '选择后关闭抽选');
eq(g2.perksTaken.length, 1, '记录已选天赋');
ok(g2.comboWindow !== comboSaved || g2.perksTaken[0] !== undefined, '选择后状态更新');

// 直接验证 runMod 生效:连击窗口 / 特殊球概率
var g3 = new Game();
g3.pickType = function () { return 0; };
tap(g3, 100, 380);
var baseCombo = g3.comboWindow;
g3.applyPerk(perks.getById('quick_combo'));
near(g3.comboWindow, baseCombo + 0.6, 0.0001, '选择快连窗口后 comboWindow +0.6');
var baseSpecial = g3.levelDef.specialChance;
g3.runMod.specialChanceAdd += 0.06;
near(g3.specialChance(), Math.min(0.6, baseSpecial + 0.06), 0.0001, 'specialChance 叠加天赋加成');
ok(g3.specialChance() <= 0.6, 'specialChance 封顶 0.6');

// 狂热:15s 阈值触发抽选(不误伤倒计时结束)
var g4 = new Game();
g4.pickType = function () { return 0; };
tap(g4, 300, 380); // 狂热
eq(g4.mode, 'frenzy', '进入狂热');
eq(g4.frenzyPerkMark, 45, '狂热首个天赋阈值 45s');
g4.frenzyLeft = 44.9;
frame(g4);
ok(g4.perkChoices && g4.perkChoices.length === 3, '狂热 45s 触发天赋抽选');
g4.perkChoices = null; // 清理,继续
g4.frenzyLeft = 0.001;
frame(g4);
eq(g4.over, true, '倒计时归零仍正确结算(天赋不误伤)');
clearStorage(); resetCalls();

// ---------------------------------------------------------- O. 局外成长
section('O. progression.js 局外成长(Phase 2)');
eq(progression.UPGRADES.length, 5, '永久升级共 5 项');
var upgIds = progression.UPGRADES.map(function (u) { return u.id; });
eq(upgIds.filter(function (v, i) { return upgIds.indexOf(v) === i; }).length, upgIds.length, '升级 id 无重复');
var upgShape = progression.UPGRADES.every(function (u) {
  return u.id && u.icon && u.name && u.max > 0 && u.baseCost > 0 && u.costMult > 1 && u.per;
});
ok(upgShape, '升级项结构完整');

progression.reset();
eq(progression.getCoins(), 0, '初始金币 0');
progression.addCoins(100);
eq(progression.getCoins(), 100, 'addCoins 累加');
var c0 = progression.costOf('lucky_wind', 0);
eq(c0, 120, '幸运之风 0→1 花费 120');
ok(progression.costOf('lucky_wind', 1) > c0, '升级花费随等级上升');
eq(progression.costOf('lucky_wind', 5), Infinity, '满级花费为 Infinity');
var buyFail = progression.buy('lucky_wind');
eq(buyFail.ok, false, '金币不足不可购买');
eq(buyFail.reason, 'coins', '失败原因 coins');

progression.addCoins(1000);
var buyOk = progression.buy('lucky_wind');
eq(buyOk.ok, true, '金币充足可购买');
eq(buyOk.level, 1, '购买后等级 1');
eq(progression.getLevel('lucky_wind'), 1, '等级持久化');
eq(progression.getCoins(), 1100 - 120, '金币已扣除');
eq(progression.canBuy('nope').ok, false, '未知升级不可购买');

var dm2 = perks.DEFAULT_MOD();
progression.applyTo(dm2);
near(dm2.specialChanceAdd, 0.01, 0.0001, 'applyTo 叠加永久升级(幸运之风 Lv1)');
eq(progression.totalLevels(), 1, 'totalLevels 正确');

// coinBonus 影响金币收益
eq(progression.coinsForRun(1000, 5, 2), 30, '无财富升级:1000分/5关/2天赋 = 30 币');
progression.addCoins(1000);
progression.buy('fortune'); // Lv1 → +10%
eq(progression.coinsForRun(1000, 5, 2), 33, '财富 Lv1 后金币 +10%');

// 集成:开局 runMod 含永久升级;结算发币;成长面板可购买
clearStorage(); progression.reset(); resetCalls(); rafQueue = [];
var g5 = new Game();
progression.addCoins(5000);
progression.buy('lucky_wind');
g5.pickType = function () { return 0; };
g5.specialChance = function () { return 0; };
tap(g5, 100, 380); // 经典
near(g5.runMod.specialChanceAdd, 0.01, 0.0001, '开局 runMod 已含永久升级加成');
g5.toMenu();
var gy = g5.menuLayout().gy;
tap(g5, 200, gy + 15);
eq(g5.panel, 'growth', '点击「成长养成」打开面板');
ok(g5.growthCards && g5.growthCards.length === 9, '成长面板 5 永久 + 4 技能 = 9 张卡');
var card0 = g5.growthCards[0];
var lvlBefore = progression.getLevel(card0.id);
tap(g5, card0.x + 10, card0.y + 10);
eq(progression.getLevel(card0.id), lvlBefore + 1, '点击卡片购买升级');
tap(g5, 200, 30); // 面板外关闭
eq(g5.panel, null, '成长面板可关闭');

// 结算发币
clearStorage(); progression.reset(); resetCalls(); rafQueue = [];
unlockAllAch();
var g6 = new Game();
tap(g6, 100, 380);
g6.score = 1000; g6.level = 5; g6.perksTaken = [];
g6.endGame();
eq(g6.coinsEarned, 20, '结算金币 = 1000/100 + 5*2 = 20');
eq(progression.getCoins(), 20, '金币已累加持久化');
eq(renderErr, null, '成长面板/结算新流程渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- P. 留存/Live-Ops
section('P. liveops.js 每日挑战 + 签到(Phase 3)');
eq(liveops.DAILY_POOL.length, 5, '每日挑战池 5 项');
eq(liveops.dayKey('2026-01-02'), '2026-01-02', 'dayKey 传字符串原样返回');
eq(liveops.prevDayKey('2026-01-02'), '2026-01-01', 'prevDayKey 跨日');
eq(liveops.prevDayKey('2026-03-01'), '2026-02-28', 'prevDayKey 跨月');
var dA = liveops.getDaily('2026-06-15');
var dB = liveops.getDaily('2026-06-15');
eq(dA.id, dB.id, '同一天抽取确定性一致');
ok(dA.name && dA.mode && (dA.targetLevel > 0 || dA.targetScore > 0), '挑战结构完整');
var dayShapes = [];
for (var dgi = 0; dgi < 10; dgi++) {
  dayShapes.push(liveops.getDaily('2026-06-0' + (dgi + 1)).id);
}
ok(dayShapes.every(function (v) { return liveops.DAILY_POOL.some(function (p) { return p.id === v; }); }), '每日挑战均来自池');

liveops.reset();
eq(liveops.isDailyDone('2026-07-01'), false, '初始未完成');
liveops.markDailySuccess('2026-07-01');
ok(liveops.isDailyDone('2026-07-01'), '标记完成后 done');
eq(liveops.isDailyDone('2026-07-02'), false, '不同日期状态隔离');
var noClaim = liveops.claimDaily('2026-07-02');
eq(noClaim.ok, false, '未完成不可领奖');
eq(noClaim.reason, 'todo', '未完成原因 todo');

progression.reset();
liveops.reset();
liveops.markDailySuccess('2026-07-05');
var dc = liveops.claimDaily('2026-07-05');
eq(dc.ok, true, '完成后可领奖');
eq(dc.reward, liveops.DAILY_REWARD + liveops.streakBonus(), '挑战奖励 = 基础 + 连胜');
eq(progression.getCoins(), liveops.DAILY_REWARD + liveops.streakBonus(), '挑战奖励计入金币');
eq(liveops.claimDaily('2026-07-05').reason, 'claimed', '不可重复领奖');

progression.reset();
liveops.reset();
var c1 = liveops.claimCheckin('2026-08-01');
eq(c1.ok, true, '首签成功');
eq(c1.streak, 1, '连续 1 天');
eq(c1.reward, liveops.CHECKIN_REWARDS[0], '首签奖励');
eq(liveops.isCheckedToday('2026-08-01'), true, '今日已签到');
eq(liveops.claimCheckin('2026-08-01').reason, 'claimed', '同日不可重复签到');
var c2 = liveops.claimCheckin('2026-08-02');
eq(c2.streak, 2, '连续签到递增');
eq(c2.reward, liveops.CHECKIN_REWARDS[1], '第 2 天奖励');
var c3 = liveops.claimCheckin('2026-08-04');
eq(c3.streak, 1, '断签重置为 1');
eq(progression.getCoins(), liveops.CHECKIN_REWARDS[0] * 2 + liveops.CHECKIN_REWARDS[1], '签到金币累计');

// 集成:每日面板 + 开始挑战 + 打卡 + 领奖
progression.reset(); liveops.reset(); resetCalls(); rafQueue = [];
var g7 = new Game();
var L7 = g7.menuLayout();
tap(g7, 200, L7.gy2 + 15);
eq(g7.panel, 'daily', '点击「每日挑战」打开面板');
ok(g7.dailyBtns && g7.dailyBtns.start, '生成开始挑战按钮');
ok(g7.dailyBtns.checkin, '今日可签到按钮存在');
var cbtn = g7.dailyBtns.checkin;
tap(g7, cbtn.x + 5, cbtn.y + 5);
eq(progression.getCoins(), liveops.CHECKIN_REWARDS[0], '面板签到得首签奖励');
eq(g7.dailyBtns.checkin, null, '签到后按钮消失');
liveops.markDailySuccess(liveops.dayKey());
renderChecked(g7);
ok(g7.dailyBtns.claim, '完成后出现领奖按钮');
var dclm = g7.dailyBtns.claim;
tap(g7, dclm.x + 5, dclm.y + 5);
eq(progression.getCoins(), liveops.CHECKIN_REWARDS[0] + liveops.DAILY_REWARD + liveops.streakBonus(), '领奖后金币增加');
var sbtn = g7.dailyBtns.start;
tap(g7, sbtn.x + 5, sbtn.y + 5);
eq(g7.dailyActive, true, '开始每日挑战激活');
eq(g7.started, true, '进入挑战对局');
eq(g7.panel, null, '开始后关闭面板');

// 每日修正注入 runMod
var g8 = new Game();
g8.dailyActive = true;
g8.dailyMod = { scoreMult: 2, specialChanceAdd: 0.1 };
g8.startClassic();
near(g8.runMod.scoreMult, 2, 0.0001, '每日修正 scoreMult 注入');
near(g8.runMod.specialChanceAdd, 0.1, 0.0001, '每日修正 specialChanceAdd 注入');
eq(renderErr, null, '每日面板/挑战流程渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- Q. 变现(激励视频/插屏)
section('Q. monetize.js 变现(Phase 4)');
monetize.reset();
eq(monetize.rewardedAvailable(), false, '无广告 API 时激励视频不可用');
eq(monetize.showReward('revive', function () {}), false, '无 API 时 showReward 返回 false');

var _rewardCb = null;
var rewardMock = {
  onClose: function (cb) { _rewardCb = cb; },
  offClose: function (cb) { if (_rewardCb === cb) _rewardCb = null; },
  show: function () { return { then: undefined }; }
};
global.tt.createRewardedVideoAd = function () { return rewardMock; };
monetize.reset();
eq(monetize.rewardedAvailable(), true, '有 API 时激励视频可用');

var gotComplete = null;
var shown1 = monetize.showReward('revive', function (ok) { gotComplete = ok; });
eq(shown1, true, 'showReward 成功发起');
ok(typeof _rewardCb === 'function', '注册 onClose 回调');
_rewardCb({ isEnded: true });
eq(gotComplete, true, '看完激励视频回调 ok=true');
eq(monetize.getStats().rewardedCompleted, 1, '完成计数 +1');

var gotAbort = null;
monetize.showReward('double_coins', function (ok) { gotAbort = ok; });
_rewardCb({ isEnded: false });
eq(gotAbort, false, '中途退出回调 ok=false');
eq(monetize.getStats().rewardedAborted, 1, '中断计数 +1');

// 插屏:每 4 局一次;累计前 3 局不弹;两次间隔 ≥ 60s
global.tt.createInterstitialAd = function () { return { show: function () {} }; };
monetize.reset();
eq(monetize.interstitialAvailable(), true, '插屏可用');
var itT = 1000000;
eq(monetize.onGameOver({ lifetimeRuns: 1, now: itT }), false, '新手第 1 局不弹插屏');
eq(monetize.onGameOver({ lifetimeRuns: 2, now: itT }), false, '新手第 2 局不弹插屏');
eq(monetize.onGameOver({ lifetimeRuns: 3, now: itT }), false, '新手第 3 局不弹插屏');
eq(monetize.onGameOver({ lifetimeRuns: 4, now: itT }), true, '新手期过后满 4 局弹插屏');
eq(monetize.getStats().interstitialShown, 1, '插屏计数 1');
eq(monetize.onGameOver({ lifetimeRuns: 5, now: itT + 1000 }), false, '计数未满不弹');
monetize.onGameOver({ lifetimeRuns: 6, now: itT + 2000 });
monetize.onGameOver({ lifetimeRuns: 7, now: itT + 3000 });
eq(monetize.onGameOver({ lifetimeRuns: 8, now: itT + 4000 }), false, '距上次不足 60s 不弹');
eq(monetize.onGameOver({ lifetimeRuns: 9, now: itT + 61000 }), true, '间隔满 60s 后弹出');
eq(monetize.getStats().interstitialShown, 2, '插屏计数 2');

// 集成:结算复活(激励视频)继续本局
monetize.reset();
progression.reset();
var g9 = new Game();
g9.pickType = function () { return 0; };
g9.specialChance = function () { return 0; };
tap(g9, 100, 380);
g9.over = true;
g9.overAt = Date.now() - 1000;
g9.world.spawn(3, 200, 60); // 危险线上方
tap(g9, 100, g9.H / 2 + 196 + 20); // 📺 复活(左)
ok(typeof _rewardCb === 'function', '复活请求广告');
_rewardCb({ isEnded: true });
eq(g9.revivedThisRun, true, '复活标记置位');
eq(g9.over, false, '复活后继续游戏');
ok(g9.world.fruits.filter(function (f) { return !f.dead; }).length === 0, '复活清除危险线上方水果');

// 集成:结算金币翻倍(激励视频)
progression.reset();
var g10 = new Game();
g10.pickType = function () { return 0; };
tap(g10, 100, 380);
g10.score = 1000; g10.level = 1; g10.perksTaken = [];
g10.endGame();
g10.overAt = Date.now() - 1000;
var coinsBefore = progression.getCoins();
tap(g10, g10.W / 2 + 100, g10.H / 2 + 196 + 20); // 📺 金币×2(右)
_rewardCb({ isEnded: true });
eq(g10.coinsDoubled, true, '金币翻倍标记');
eq(progression.getCoins(), coinsBefore + g10.coinsEarned, '金币翻倍到账');
eq(renderErr, null, '变现流程渲染无异常');
delete global.tt.createRewardedVideoAd;
delete global.tt.createInterstitialAd;
clearStorage(); resetCalls();

// ---------------------------------------------------------- R. 优化与回归加固
section('R. 优化:天赋叠加上限 / 概率钳制 / 发币去重 / 每日即时结算');
eq(perks.eligible({}).length, perks.POOL.length, '初始全部天赋可选');
eq(perks.maxStacks(perks.getById('bonus_score')), 3, '得分加成的叠加上限 3');
var capCounts = {};
capCounts['bonus_score'] = perks.maxStacks(perks.getById('bonus_score'));
ok(perks.eligible(capCounts).every(function (p) { return p.id !== 'bonus_score'; }), '达上限天赋被排除');
var fullCounts = {};
perks.POOL.forEach(function (p) { fullCounts[p.id] = perks.maxStacks(p); });
eq(perks.eligible(fullCounts).length, 0, '全部达上限后无候选');
eq(perks.rollEligible(fullCounts, 3).length, 0, '全满后不再产生抽选(不越界叠加)');
eq(perks.rollEligible({}, 3).length, 3, 'rollEligible 正常抽 3');
var ro = perks.rollEligible({}, 3);
eq(ro.filter(function (v, i) { return ro.indexOf(v) === i; }).length, 3, 'rollEligible 结果互不相同');

// 乘法天赋叠加封顶:连续选满上限后不再可选
var mStack = perks.DEFAULT_MOD();
var bi = perks.getById('bonus_score');
for (var si = 0; si < perks.maxStacks(bi); si++) perks.apply(mStack, bi);
near(mStack.scoreMult, Math.pow(1.12, 3), 0.0001, '得分倍率封顶 1.12^3');
capCounts = {}; capCounts['bonus_score'] = 3;
ok(perks.rollEligible(capCounts, 3).every(function (p) { return p.id !== 'bonus_score'; }), '封顶后 rollEligible 不再给出该天赋');

// specialChance 钳制 [0,0.6]
var gx = new Game();
gx.mode = 'classic';
gx.levelDef = levels.getLevelDef(1);
gx.runMod.specialChanceAdd = -5;
eq(gx.specialChance(), 0, '特殊球概率下限钳制为 0');
gx.runMod.specialChanceAdd = 5;
eq(gx.specialChance(), 0.6, '特殊球概率上限钳制为 0.6');

// 发币去重:复活后再结算不重复发币
clearStorage(); progression.reset(); resetCalls(); rafQueue = [];
unlockAllAch();
var g11 = new Game();
g11.pickType = function () { return 0; };
tap(g11, 100, 380);
g11.score = 1000; g11.level = 3; g11.perksTaken = [];
g11.endGame();
var coinsFirst = progression.getCoins();
ok(coinsFirst > 0, '首次结算发币');
g11.overAt = Date.now() - 1000;
g11.revive();
g11.score = 3000; g11.level = 6;
g11.endGame();
eq(progression.getCoins(), coinsFirst, '复活后再结算不重复发币(每局一次)');

// 每日挑战即时结算:经典达标立即标记
clearStorage(); progression.reset(); liveops.reset(); resetCalls(); rafQueue = [];
var classicKey = null;
for (var q = 0; q < 40; q++) {
  var kk = '2026-01-' + ('0' + ((q % 27) + 1)).slice(-2);
  if (liveops.getDaily(kk).mode === 'classic') { classicKey = kk; break; }
}
ok(classicKey, '找到经典型每日挑战用于测试');
var g13 = new Game();
g13.dailyActive = true;
g13.dailyKey = classicKey;
g13.dailyMod = liveops.getDaily(classicKey).mod;
g13.startClassic();
g13.level = liveops.getDaily(classicKey).targetLevel;
g13.refreshLevelDef();
g13.levelProgress = g13.levelTarget;
g13.levelClearCheck();
ok(liveops.isDailyDone(classicKey), '经典达标后即时标记完成(无需等结算)');

// 直接校验 checkDailySuccess 判定
clearStorage(); liveops.reset();
var g14 = new Game();
g14.dailyActive = true;
g14.dailyKey = '2026-01-01';
var ch14 = liveops.getDaily('2026-01-01');
if (ch14.mode === 'frenzy') { g14.score = ch14.targetScore; g14.level = 1; }
else { g14.level = ch14.targetLevel; g14.score = 0; }
g14.checkDailySuccess();
ok(liveops.isDailyDone('2026-01-01'), 'checkDailySuccess 达标标记');
eq(renderErr, null, '优化流程渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- S. 任务线(长期目标)
section('S. missions.js 任务线');
eq(missions.MISSIONS.length, 6, '任务共 6 项');
var missIds = missions.MISSIONS.map(function (m) { return m.id; });
eq(missIds.filter(function (v, i) { return missIds.indexOf(v) === i; }).length, missIds.length, '任务 id 无重复');
ok(missions.MISSIONS.every(function (m) { return m.stat && m.target > 0 && m.reward > 0; }), '任务结构完整');

progression.reset(); missions.reset();
eq(missions.getStat('merges'), 0, '统计初始为 0');
missions.addStat('merges', 100);
ok(missions.isDone('merge100'), '累计合成 100 达成');
eq(missions.progressOf('merge100'), 100, '进度封顶等于目标');
eq(missions.isClaimable('merge100'), true, '达成后可领取');
var mcl = missions.claim('merge100');
eq(mcl.ok, true, '领取成功');
eq(mcl.reward, 100, '奖励 100 金币');
eq(progression.getCoins(), 100, '奖励计入金币');
eq(missions.claim('merge100').reason, 'claimed', '不可重复领取');
eq(missions.claim('king5').reason, 'todo', '未完成不可领取');
missions.addStat('merges', 50);
eq(missions.getStat('merges'), 150, '统计累加');
eq(missions.progressOf('merge100'), 100, '超额后进度仍封顶');

// 集成:合成统计在结算时提交;任务面板可领取
clearStorage(); progression.reset(); missions.reset(); resetCalls(); rafQueue = [];
var g15 = new Game();
g15.pickType = function () { return 0; };
g15.specialChance = function () { return 0; };
tap(g15, 100, 380); // 经典
ok(missions.getStat('plays') >= 1, '开局计入游玩局数');
for (var gi = 0; gi < 6; gi++) { tap(g15, 200, 300); settle(g15, 70); }
g15.endGame();
ok(missions.getStat('merges') > 0, '结算提交合成次数到任务统计');
ok(missions.getStat('score') > 0, '结算提交累计得分');
g15.toMenu();
var L15 = g15.menuLayout();
tap(g15, 200, L15.gy3 + 15);
eq(g15.panel, 'missions', '打开任务面板');
ok(g15.missionCards && g15.missionCards.length === 12, '任务面板 3 今日 + 3 本周 + 6 长期 = 12 张卡');
missions.addStat('levels', 10); // 使 level10 达成
renderChecked(g15);
var lvCard = g15.missionCards.filter(function (c) { return c.id === 'level10'; })[0];
ok(lvCard && lvCard.btn, '完成任务出现领取按钮');
var coinsBeforeM = progression.getCoins();
tap(g15, lvCard.btn.x + 5, lvCard.btn.y + 5);
eq(progression.getCoins(), coinsBeforeM + 200, '点击领取任务奖励 200');
eq(renderErr, null, '任务面板渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- T. 十步扩展(存档/设置/技能/每日任务/档案/引导)
section('T. 存档版本/设置/技能/每日任务/档案/引导');

// T1 存档版本与迁移
clearStorage();
var mg1 = save.migrate();
eq(mg1.firstRun, true, '首次运行标记');
eq(save.getVersion(), save.CURRENT_VERSION, '版本写入当前值');
ok(mg1.addedDefaults.length > 0, '补齐默认存档键');
var mg2 = save.migrate();
eq(mg2.migrated, false, '已是最新不再迁移');
eq(mg2.firstRun, false, '非首次运行');

// T2 设置/偏好
settings.reset();
var prefs = settings.getPrefs();
eq(prefs.haptics, true, '震动默认开');
eq(prefs.reducedMotion, false, '减少动效默认关');
eq(prefs.tutorialDone, false, '引导默认未完成');
eq(settings.toggle('haptics'), false, '切换震动为关');
eq(settings.isHaptics(), false, '读取震动偏好');
settings.markTutorialDone();
eq(settings.isTutorialDone(), true, '标记引导完成');
settings.set('bogus', true);
eq(settings.getPrefs().bogus, undefined, '非法偏好键不写入');

// T3 主动技能数据
eq(skills.SKILLS.length, 3, '技能 3 个(重锤/洗牌/陨石)');
eq(skills.getById('hammer').id, 'hammer', '重锤存在');
eq(skills.getById('shuffle').id, 'shuffle', '洗牌存在');
eq(skills.getById('meteor').id, 'meteor', '陨石存在');
eq(skills.unlocked('shuffle', 1), false, '洗牌默认锁定');
eq(skills.unlocked('shuffle', 3), true, '账号 3 级解锁洗牌');
eq(skills.unlocked('meteor', 5), false, '5 级陨石仍锁定');
eq(skills.unlocked('meteor', 6), true, '账号 6 级解锁陨石');
eq(skills.energyGain(5), skills.ENERGY_PER_MERGE, '普通合成能量');
eq(skills.energyGain(10), skills.ENERGY_PER_KING, '合成皇冠能量更高');
eq(skills.canCast(skills.ENERGY_MAX), true, '满能量可释放');
eq(skills.canCast(skills.ENERGY_MAX - 1), false, '未满不可释放');
eq(skills.clampEnergy(200), skills.ENERGY_MAX, '能量上限钳制');
eq(skills.clampEnergy(-5), 0, '能量下限钳制');

// T4 每日任务(基于累计统计增量)
progression.reset(); missions.reset(); dailytasks.reset();
var dl = dailytasks.getList();
eq(dl.length, dailytasks.TASK_COUNT, '每日任务 3 项');
eq(dl[0].progress, 0, '初始进度 0');
missions.addStat('merges', 30); missions.addStat('levels', 3); missions.addStat('specials', 5);
missions.addStat('score', 3000); missions.addStat('plays', 3); missions.addStat('kings', 1);
var dl2 = dailytasks.getList();
ok(dl2.every(function (t) { return t.done; }), '当日增量达标全部完成');
var dcl1 = dailytasks.claim(dl2[0].id);
eq(dcl1.ok, true, '每日任务可领取');
eq(dailytasks.claim(dl2[0].id).reason, 'claimed', '每日任务不可重复领取');

// T5 成就扩展 ctx
clearStorage();
var achNew = achMod.check({ runLevel: 1, runMadeKing: false, runMaxCombo: 0, runSpecials: {}, runPerks: 1,
  usedSpecialCount: 0, maxLevel: 0, collectedCount: 0, mode: 'classic', runScore: 0,
  dailyDone: false, missionsClaimed: 0, revived: false, upgradesTotal: 0, totalScore: 0 });
ok(achNew.some(function (d) { return d.id === 'perk_first'; }), '天赋初现成就解锁');
clearStorage();
var achMore = achMod.check({ runPerks: 0, dailyDone: true, missionsClaimed: 2, revived: true, upgradesTotal: 1, totalScore: 100000, runLevel: 1, maxLevel: 0, collectedCount: 0, runSpecials: {}, mode: 'classic', runScore: 0, usedSpecialCount: 0, runMadeKing: false, runMaxCombo: 0 });
['daily_done', 'mission_first', 'revive_use', 'upgrade_first', 'score100k'].forEach(function (id) {
  ok(achMore.some(function (d) { return d.id === id; }), '新成就解锁:' + id);
});

// T6 集成:能量→重锤 / 档案 / 设置 / 引导
clearStorage(); progression.reset(); missions.reset(); dailytasks.reset(); settings.reset(); resetCalls(); rafQueue = [];
var gT = new Game();
gT.pickType = function () { return 0; };
gT.specialChance = function () { return 0; };
tap(gT, 100, 380);
eq(gT.tutorialTip, true, '首局显示新手提示');
for (var tI = 0; tI < 6; tI++) { tap(gT, 200, 300); settle(gT, 70); }
ok(gT.energy > 0, '合成累计能量');
ok(gT.tutorialDone, '首次掉落完成引导');
eq(settings.isTutorialDone(), true, '引导完成持久化');
gT.energy = skills.ENERGY_MAX;
gT.targeting = false;
renderChecked(gT);
ok(gT.skillBtn, '能量满出现技能按钮');
gT.world.spawn(0, 120, 120);
var sb = gT.skillBtn;
tap(gT, sb.x + 5, sb.y + 5);
eq(gT.targeting, true, '点击技能进入定向模式');
tap(gT, 120, 120);
eq(gT.energy, 0, '重锤释放后能量清零');
eq(gT.targeting, false, '释放后退出定向模式');

// 档案面板
gT.toMenu();
renderChecked(gT);
ok(gT.menuIcons && gT.menuIcons.profile, '主菜单生成档案按钮');
tap(gT, 20, 20);
eq(gT.panel, 'profile', '打开玩家档案');
tap(gT, 200, 30);
eq(gT.panel, null, '关闭档案面板');

// 设置面板 + 切换
renderChecked(gT);
tap(gT, gT.W - 30, 20);
eq(gT.panel, 'settings', '打开设置面板');
var hRow = gT.settingRows.filter(function (r) { return r.id === 'haptics'; })[0];
var h0 = gT.haptics;
tap(gT, hRow.x + 5, hRow.y + 5);
eq(gT.haptics, !h0, '切换震动设置');
eq(settings.isHaptics(), gT.haptics, '设置持久化');
var mRow = gT.settingRows.filter(function (r) { return r.id === 'motion'; })[0];
tap(gT, mRow.x + 5, mRow.y + 5);
eq(gT.reducedMotion, true, '开启减少动态效果');
tap(gT, 200, 30);
eq(gT.panel, null, '关闭设置面板');
eq(renderErr, null, '十步扩展流程渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- U. 周榜/导出/高对比/帮助
section('U. seasonboard/save-export/contrast/help');
seasonboard.reset();
var wk1 = seasonboard.weekKey('2026-01-01');
eq(seasonboard.weekKey('2026-01-01'), wk1, '周键确定性');
var r1 = seasonboard.record('classic', 1000);
eq(r1, true, '本周首次记录为新');
eq(seasonboard.getWeek().classic, 1000, '本周经典分记录');
eq(seasonboard.record('classic', 500), false, '低于纪录不刷新');
eq(seasonboard.record('classic', 1500), true, '高于纪录刷新');
eq(seasonboard.getWeek().classic, 1500, '本周分更新');
seasonboard.record('frenzy', 2000);
eq(seasonboard.getWeek().frenzy, 2000, '本周狂热分独立');

// 存档导出/导入
clearStorage();
_store['merge_watermelon_coins'] = 777;
var dump = save.exportAll();
ok(typeof dump === 'string' && dump.length > 10, '导出为非空 JSON');
clearStorage();
var imp = save.importAll(dump);
eq(imp.ok, true, '导入成功');
eq((function () { try { return tt.getStorageSync('merge_watermelon_coins'); } catch (e) { return 0; } })(), 777, '导入恢复金币');
eq(save.importAll('{bad json').ok, false, '非法 JSON 导入失败');
eq(save.importAll('[1,2]').ok, false, '非对象导入失败');

// 设置:高对比 + 引导阶段
settings.reset();
eq(settings.isHighContrast(), false, '高对比默认关');
eq(settings.getTutorialStage(), 0, '引导阶段默认 0');
settings.setTutorialStage(2);
eq(settings.getTutorialStage(), 2, '引导阶段可写');
settings.set('highContrast', true);
eq(settings.isHighContrast(), true, '高对比可开');

// 新成就 ctx
clearStorage();
var achA = achMod.check({ runPerks: 0, dailyDone: false, missionsClaimed: 0, revived: false, upgradesTotal: 0, totalScore: 0, maxFruitCount: 50, runLevel: 1, maxLevel: 0, collectedCount: 0, runSpecials: {}, mode: 'classic', runScore: 0, usedSpecialCount: 0, runMadeKing: false, runMaxCombo: 0 });
ok(achA.some(function (d) { return d.id === 'master50'; }), '精通大师成就解锁');
ok(!achMod.getList().some(function (d) { return d.id === 'season5'; }), '赛季成就已移除');

// 集成
clearStorage(); progression.reset(); seasonboard.reset(); settings.reset(); resetCalls(); rafQueue = [];
var gU = new Game();
gU.pickType = function () { return 0; };
gU.specialChance = function () { return 0; };
tap(gU, 100, 380);
gU.score = 2000; gU.level = 5; gU.perksTaken = [];
gU.endGame();
eq(seasonboard.getWeek().classic, 2000, '结算写入本周榜');

gU.toMenu();
renderChecked(gU);
var L = gU.menuLayout();
tap(gU, 200, L.gy4 + 15);
eq(gU.panel, 'shop', '主菜单第 4 行打开金币商店');
renderChecked(gU);
ok(gU.shopCards && gU.shopCards.length === shop.ITEMS.length, '商店列出全部道具');
tap(gU, 200, 30);
eq(gU.panel, null, '关闭商店面板');

// 设置面板:导出/高对比/帮助
renderChecked(gU);
tap(gU, gU.W - 30, 20);
eq(gU.panel, 'settings', '打开设置面板');
var clip = { called: false };
global.tt.setClipboardData = function (o) { clip.called = true; if (o && o.success) o.success({}); };
var expRow = gU.settingRows.filter(function (r) { return r.id === 'export'; })[0];
tap(gU, expRow.x + 5, expRow.y + 5);
ok(clip.called, '导出存档调用剪贴板');
delete global.tt.setClipboardData;
var cRow = gU.settingRows.filter(function (r) { return r.id === 'contrast'; })[0];
var c0 = gU.highContrast;
tap(gU, cRow.x + 5, cRow.y + 5);
eq(gU.highContrast, !c0, '切换高对比');
eq(settings.isHighContrast(), gU.highContrast, '高对比持久化');
var helpRow = gU.settingRows.filter(function (r) { return r.id === 'help'; })[0];
tap(gU, helpRow.x + 5, helpRow.y + 5);
eq(gU.panel, 'help', '打开帮助面板');
tap(gU, 200, 30);
eq(gU.panel, null, '关闭帮助面板');
eq(renderErr, null, '商店/帮助/设置渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- V. Boss 关/新主题/每日双倍
section('V. Boss 关 / 新主题 / 每日奖励双倍');
ok(levels.getLevelDef(10).isBoss, '第 10 关为 Boss 关');
ok(!levels.getLevelDef(9).isBoss, '第 9 关非 Boss 关');
ok(levels.getLevelDef(100).isBoss, '第 100 关为 Boss 关');
ok(levels.getLevelDef(10).target > levels.getLevelDef(9).target, 'Boss 目标分更高');
ok(levels.getLevelDef(10).bonus > levels.getLevelDef(9).bonus, 'Boss 奖励更高');
ok(levels.getLevelDef(10).bonus < levels.getLevelDef(11).bonus, 'Boss 奖励仍随关卡递增');
ok(!!themes.getTheme('neon'), '新主题 赛博霓虹存在');
eq(themes.getTheme('neon').ach, 12, '新主题解锁门槛 12 成就');
clearStorage();
_store['merge_watermelon_achievements'] = (function () {
  var o = {}; achMod.getList().slice(0, 12).forEach(function (d) { o[d.id] = 1; }); return o;
})();
achMod.reload();
ok(themes.isUnlocked('neon'), '12 成就解锁赛博霓虹');
clearStorage();

// Boss 关通过横幅
resetCalls(); rafQueue = [];
var gV = new Game();
gV.pickType = function () { return 0; };
gV.specialChance = function () { return 0; };
tap(gV, 100, 380);
gV.level = 10;
gV.refreshLevelDef();
gV.levelProgress = gV.levelTarget;
gV.levelClearCheck();
ok(gV.popups && gV.popups.some(function (p) { return String(p.text).indexOf('Boss') >= 0; }), 'Boss 关通过弹横幅');

// 每日奖励看广告双倍
clearStorage(); progression.reset(); liveops.reset(); resetCalls(); rafQueue = [];
var _rcb = null;
var dMock = { onClose: function (cb) { _rcb = cb; }, offClose: function (cb) { if (_rcb === cb) _rcb = null; }, show: function () { return { then: undefined }; } };
global.tt.createRewardedVideoAd = function () { return dMock; };
monetize.reset();
var gW = new Game();
gW.pickType = function () { return 0; };
liveops.markDailySuccess(liveops.dayKey());
var Lw = gW.menuLayout();
tap(gW, 200, Lw.gy2 + 15);
eq(gW.panel, 'daily', '打开每日面板');
ok(gW.dailyBtns && gW.dailyBtns.double, '完成挑战出现双倍按钮');
var cd0 = progression.getCoins();
tap(gW, gW.dailyBtns.double.x + 5, gW.dailyBtns.double.y + 5);
ok(typeof _rcb === 'function', '双倍请求激励视频');
_rcb({ isEnded: true });
eq(progression.getCoins(), cd0 + liveops.DAILY_REWARD + liveops.streakBonus() + liveops.DAILY_REWARD, '每日奖励翻倍到账');
delete global.tt.createRewardedVideoAd;
eq(renderErr, null, 'Boss/主题/双倍流程渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- W. 暂停重开/导入存档/结算统计
section('W. 暂停重开 / 导入存档 / 结算本局统计');
clearStorage(); resetCalls(); rafQueue = [];
var gX = new Game();
gX.pickType = function () { return 0; };
gX.specialChance = function () { return 0; };
tap(gX, 100, 380);
gX.score = 500; gX.level = 3;
tap(gX, 256, 44);
eq(gX.paused, true, '进入暂停');
eq(gX.pauseBtns.length, 4, '暂停面板 4 个按钮(含重开)');
tap(gX, 200, 342); // 🔄 重开本局
eq(gX.paused, false, '重开解除暂停');
eq(gX.score, 0, '重开分数清零');
eq(gX.level, 1, '重开回第 1 关');
eq(gX.started, true, '重开仍在游戏中');

// 结算本局统计渲染
gX.score = 300;
gX.endGame();
eq(renderErr, null, '结算本局统计渲染无异常');
gX.overAt = Date.now() - 1000;

// 导入存档
clearStorage();
_store['merge_watermelon_coins'] = 1234;
var dumpW = save.exportAll();
clearStorage();
progression.reset();
var gY = new Game();
global.tt.getClipboardData = function (o) { if (o && o.success) o.success({ data: dumpW }); };
gY.toMenu();
renderChecked(gY);
tap(gY, gY.W - 30, 20);
eq(gY.panel, 'settings', '打开设置面板');
var impRow = gY.settingRows.filter(function (r) { return r.id === 'import'; })[0];
ok(impRow, '设置含导入存档项');
tap(gY, impRow.x + 5, impRow.y + 5);
eq(progression.getCoins(), 1234, '导入存档恢复金币');
delete global.tt.getClipboardData;
eq(renderErr, null, '导入流程渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- X. 账号经验/历史榜/每周任务/成就奖励
section('X. account/history/weeklytasks/成就奖励');
eq(account.xpForRun(1000, 5, 2), 20 + 15 + 10, 'XP 公式');
eq(account.xpToNext(1), 180, '1→2 需 180 XP');
eq(account.xpToNext(2), 260, '2→3 需 260 XP');
eq(account.levelFromXp(0), 1, '0 XP = 1 级');
eq(account.levelFromXp(180), 2, '180 XP = 2 级');
eq(account.levelFromXp(440), 3, '440 XP = 3 级');
account.reset();
progression.reset();
var ar = account.addXp(180);
eq(ar.leveled, true, '升级触发');
eq(ar.level, 2, '升至 2 级');
eq(progression.getCoins(), 40, '升级奖励 Lv2×20 = 40 金币');
eq(account.getState().level, 2, '状态等级 2');
eq(account.getState().cur, 0, '刚好升级剩余 0');

history.reset();
[1000, 3000, 2000, 5000, 500, 4000].forEach(function (s) { history.record('classic', s); });
var top = history.getTop();
eq(top.length, history.MAX, '历史榜 Top' + history.MAX);
eq(top.map(function (t) { return t.score; }).join(','), '5000,4000,3000,2000,1000', '降序且截断');
eq(top[0].score, 5000, '最高分置顶');

progression.reset(); missions.reset(); weeklytasks.reset();
var wl = weeklytasks.getList();
eq(wl.length, weeklytasks.TASK_COUNT, '每周任务 3 项');
eq(wl[0].progress, 0, '当周进度 0');
missions.addStat('merges', 200); missions.addStat('levels', 15); missions.addStat('specials', 30);
missions.addStat('score', 20000); missions.addStat('plays', 15); missions.addStat('kings', 5);
var wl2 = weeklytasks.getList();
ok(wl2.every(function (t) { return t.done; }), '当周增量达标全部完成');
eq(weeklytasks.claim(wl2[0].id).ok, true, '每周任务可领取');

// 成就解锁发金币
clearStorage(); progression.reset(); resetCalls(); rafQueue = [];
var gZ = new Game();
gZ.pickType = function () { return 0; };
gZ.specialChance = function () { return 0; };
tap(gZ, 100, 380);
gZ.level = 2;
gZ.refreshLevelDef();
gZ.levelProgress = gZ.levelTarget;
gZ.levelClearCheck();
ok(progression.getCoins() >= 30, '成就解锁发放金币奖励');
eq(renderErr, null, '账号/历史/每周/成就奖励流程渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- Y. 定向重锤/成就排序/称号/每日换一个/本地记录/Boss成就
section('Y. 定向重锤/称号/每日换一个/本地记录/Boss成就');
eq(achMod.getTitle(16), '瓜王之王', '16 成就 = 瓜王之王');
eq(achMod.getTitle(13), '果界至尊', '13 成就 = 果界至尊');

// 每日挑战「换一个」
clearStorage(); progression.reset(); liveops.reset();
var idx0 = liveops.getDaily().index;
progression.addCoins(100);
var rr = liveops.reroll();
eq(rr.ok, true, '换一个成功');
ok(liveops.getDaily().index !== idx0, '挑战内容已更换');
eq(liveops.hasRerolled(), true, '已换标记置位');
eq(liveops.reroll().reason, 'used', '每日仅可换一次');

// 面板内换一个(花费 50)
clearStorage(); progression.reset(); liveops.reset(); resetCalls(); rafQueue = [];
var gY = new Game();
progression.addCoins(100);
var Ly = gY.menuLayout();
tap(gY, 200, Ly.gy2 + 15);
eq(gY.panel, 'daily', '打开每日面板');
ok(gY.dailyBtns && gY.dailyBtns.reroll, '存在换一个按钮');
tap(gY, gY.dailyBtns.reroll.x + 5, gY.dailyBtns.reroll.y + 5);
eq(progression.getCoins(), 50, '换一个花费 50 金币');
renderChecked(gY);
eq(gY.dailyBtns.reroll, null, '换后按钮消失');

// 排行榜不可用 → 本地记录面板
clearStorage(); resetCalls(); rafQueue = [];
history.record('classic', 1234);
var origShow = leaderboard.show;
leaderboard.show = function () { return false; };
var gR = new Game();
gR.openLeaderboard(0);
eq(gR.panel, 'records', '排行榜不可用回退本地记录面板');
eq(gR.leaderboardOpen, false, '未打开云排行');
renderChecked(gR);
eq(renderErr, null, '本地记录面板渲染无异常');
leaderboard.show = origShow;
tap(gR, 200, 30);
eq(gR.panel, null, '关闭本地记录面板');

// Boss / 天赋成就
clearStorage();
var achB = achMod.check({ maxLevel: 11, runPerks: 10, runLevel: 1, collectedCount: 0, runSpecials: {}, mode: 'classic', runScore: 0, usedSpecialCount: 0, runMadeKing: false, runMaxCombo: 0, dailyDone: false, missionsClaimed: 0, revived: false, upgradesTotal: 0, totalScore: 0, maxFruitCount: 0 });
ok(achB.some(function (d) { return d.id === 'boss_first'; }), '斩将成就解锁');
ok(achB.some(function (d) { return d.id === 'perk_master'; }), '博采众长成就解锁');
clearStorage(); resetCalls();

// ---------------------------------------------------------- Z. 洗牌/Boss加成/红点/成就筛选
section('Z. 洗牌技能 / Boss 加成 / 菜单红点 / 成就筛选');

// 洗牌:账号 3 级解锁
clearStorage(); settings.reset(); account.reset(); progression.reset(); resetCalls(); rafQueue = [];
var gS = new Game();
gS.pickType = function () { return 0; };
gS.specialChance = function () { return 0; };
tap(gS, 100, 380);
gS.energy = skills.ENERGY_MAX;
renderChecked(gS);
eq(gS.shuffleBtn, null, '账号 1 级无洗牌按钮');
account.reset();
account.addXp(440); // 升到 3 级
eq(account.getState().level, 3, '账号达到 3 级');
gS.world.spawn(0, 100, 300);
gS.energy = skills.ENERGY_MAX;
renderChecked(gS);
ok(gS.shuffleBtn, '3 级出现洗牌按钮');
var shB = gS.shuffleBtn;
tap(gS, shB.x + 5, shB.y + 5);
eq(gS.energy, 0, '洗牌后能量清零');
eq(gS.shuffleBtn, null, '洗牌后按钮消失');

// Boss 关特殊球概率提升
clearStorage(); resetCalls(); rafQueue = [];
var gB = new Game();
gB.pickType = function () { return 0; };
tap(gB, 100, 380);
gB.level = 9; gB.refreshLevelDef();
var sp9 = gB.specialChance();
gB.level = 10; gB.refreshLevelDef();
var sp10 = gB.specialChance();
ok(sp10 > sp9, 'Boss 关特殊球概率提升(' + sp9.toFixed(3) + '→' + sp10.toFixed(3) + ')');

// 菜单红点
clearStorage(); progression.reset(); missions.reset(); dailytasks.reset(); weeklytasks.reset(); liveops.reset(); resetCalls(); rafQueue = [];
var gF = new Game();
var fl0 = gF.claimableFlags();
ok(fl0.daily, '未签到 → 每日红点');
ok(!fl0.missions, '暂无可领任务 → 无任务红点');
missions.addStat('levels', 10);
ok(gF.claimableFlags().missions, '有可领任务 → 任务红点');

// 成就筛选
clearStorage();
var gA = new Game();
gA.toMenu();
gA.openPanel('achievements');
renderChecked(gA);
ok(gA.achFilterBtns && gA.achFilterBtns.length === 3, '成就筛选 3 个按钮');
tap(gA, gA.achFilterBtns[1].x + 5, gA.achFilterBtns[1].y + 5);
eq(gA.achFilter, 'todo', '切换到未达成筛选');
tap(gA, gA.achFilterBtns[2].x + 5, gA.achFilterBtns[2].y + 5);
eq(gA.achFilter, 'done', '切换到已达成筛选');
tap(gA, gA.achFilterBtns[0].x + 5, gA.achFilterBtns[0].y + 5);
eq(gA.achFilter, 'all', '切回全部');
eq(renderErr, null, '洗牌/Boss/红点/筛选流程渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- AA. 障碍方块/i18n/云骨架
section('AA. 障碍方块 / i18n / 云接入骨架');

// 方块:静止、不合并
var bw2 = new physics.World(400, 740, 1);
var blk = bw2.spawnBlock(200, 300, 26);
eq(blk.kind, 'block', '方块 kind=block');
ok(blk.static, '方块为 static');
var by0 = blk.y;
for (var bs = 0; bs < 60; bs++) bw2.step(1 / 60);
eq(blk.y, by0, '方块静止不下落');
var bw3 = new physics.World(400, 740, 1);
bw3.spawnBlock(200, 700, 26);
bw3.spawn(0, 150, 700 - 16);
bw3.spawn(0, 250, 700 - 16);
for (var bs2 = 0; bs2 < 150; bs2++) bw3.step(1 / 60);
ok(bw3.fruits.some(function (f) { return f.kind === 'block' && !f.dead; }), '方块不参与合并且长存');

// 重锤清除方块
clearStorage(); resetCalls(); rafQueue = [];
var gH = new Game();
gH.pickType = function () { return 0; };
gH.specialChance = function () { return 0; };
tap(gH, 100, 380);
gH.world.spawnBlock(200, 500, 26);
eq(gH.world.fruits.filter(function (f) { return f.kind === 'block'; }).length, 1, '生成 1 个方块');
gH.energy = skills.ENERGY_MAX;
gH.useSkill(200, 500);
eq(gH.world.fruits.filter(function (f) { return f.kind === 'block' && !f.dead; }).length, 0, '重锤清除方块');

// 跨章生成障碍
clearStorage(); resetCalls(); rafQueue = [];
var gC = new Game();
gC.pickType = function () { return 0; };
gC.specialChance = function () { return 0; };
tap(gC, 100, 380);
gC.level = 10; gC.refreshLevelDef();
gC.levelProgress = gC.levelTarget;
gC.levelClearCheck();
ok(gC.world.fruits.some(function (f) { return f.kind === 'block' && !f.dead; }), '跨章生成障碍方块');

function countKind(world, kind) {
  return world.fruits.filter(function (f) { return f.kind === kind && !f.dead; }).length;
}
function enterChapter(level) {
  var g = new Game();
  g.pickType = function () { return 0; };
  g.specialChance = function () { return 0; };
  tap(g, 100, 380);
  g.level = level;
  g.refreshLevelDef();
  g.levelProgress = g.levelTarget;
  g.levelClearCheck();
  return g;
}
var gCh8 = enterChapter(70);
eq(countKind(gCh8.world, 'block'), 4, '第 8 章进章方块 +2');
eq(countKind(gCh8.world, 'belt'), 1, '第 8 章仍一条传送带');
ok(gCh8.popups.some(function (p) { return p.text === '障碍加倍'; }), '第 8 章弹出规则说明');
var gCh9 = enterChapter(80);
eq(countKind(gCh9.world, 'belt'), 2, '第 9 章多一条传送带');
eq(countKind(gCh9.world, 'block'), 1, '第 9 章方块数不加倍');
var gCh10 = enterChapter(90);
eq(countKind(gCh10.world, 'block'), 4, '第 10 章进章方块 +2');
eq(countKind(gCh10.world, 'spike'), 2, '第 10 章多一根毒刺');
var gKind = new Game();
gKind.mode = 'classic';
gKind.level = 4;
gKind.refreshLevelDef();
eq(gKind.specialKinds().filter(function (k) { return k === 'bomb'; }).length, 4, '第 4 关炸弹 4 份');
gKind.level = 65;
gKind.refreshLevelDef();
eq(gKind.specialKinds().filter(function (k) { return k === 'bomb'; }).length, 8, '第 65 关炸弹再多 4 份');
gKind.level = 85;
gKind.refreshLevelDef();
eq(gKind.specialKinds().filter(function (k) { return k === 'magnet'; }).length, 6, '第 85 关磁吸再多 4 份');
var gHud = new Game();
gHud.mode = 'classic';
gHud.started = true;
gHud.level = 65;
gHud.refreshLevelDef();
renderChecked(gHud);
eq(gHud.lastRenderErr, undefined, '第 65 关规则写在关卡上,渲染无异常');
gHud.level = 5;
gHud.refreshLevelDef();
renderChecked(gHud);
eq(gHud.lastRenderErr, undefined, '前期关卡无规则行,渲染无异常');

// i18n
i18n.reset();
eq(i18n.getLocale(), 'zh', '默认语言 zh');
eq(i18n.t('mode.classic'), '经典闯关', 'zh 文案');
i18n.setLocale('en');
eq(i18n.t('mode.classic'), 'Classic', 'en 文案');
eq(i18n.t('missing.key', 'FB'), 'FB', '未命中回退 fallback');
eq(i18n.setLocale('zz'), false, '非法语言拒绝');
eq(i18n.getLocale(), 'en', '语言保持不变');
i18n.reset();

// cloud
clearStorage();
var cap = [];
var origSub = global.tt.setUserCloudStorage;
global.tt.setUserCloudStorage = function (o) { cap.push(o.KVDataList); if (o.success) o.success({}); };
ok(cloud.available(), '云端写入可用');
eq(cloud.submitScore(1234), true, '提交分数发起');
ok(cap[0] && cap[0][0].key === 'score' && cap[0][0].value === '1234', '分数 KV 正确');
eq(typeof cloud.submitSeason, 'undefined', '赛季云键已移除');
eq(cloud.friendAvailable(), false, '无好友 API');
var fok = null;
var fr = cloud.fetchFriends(['score'], function (okv) { fok = okv; });
eq(fr, false, 'fetchFriends 不可用返回 false');
eq(fok, false, '回调 ok=false');
global.tt.setUserCloudStorage = origSub;
eq(renderErr, null, '障碍/i18n/云流程渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- AB. 陨石技能/派对主题/语言切换
section('AB. 陨石技能 / 派对主题 / 语言切换');

// 陨石:账号 6 级解锁,区域清除
clearStorage(); settings.reset(); account.reset(); progression.reset(); resetCalls(); rafQueue = [];
var gM = new Game();
gM.pickType = function () { return 0; };
gM.specialChance = function () { return 0; };
tap(gM, 100, 380);
account.reset();
account.addXp(1800); // 升到 6 级
ok(account.getState().level >= 6, '账号达到 6 级');
gM.world.spawn(0, 200, 300);
gM.world.spawn(0, 210, 320);
gM.world.spawn(0, 220, 340);
gM.world.spawn(0, 60, 680);
var beforeM = gM.world.fruits.filter(function (f) { return !f.dead; }).length;
gM.energy = skills.ENERGY_MAX;
renderChecked(gM);
ok(gM.meteorBtn, '6 级出现陨石按钮');
gM.useSkill('meteor', 210, 320);
var afterM = gM.world.fruits.filter(function (f) { return !f.dead; }).length;
ok(afterM < beforeM, '陨石清除区域内水果(' + beforeM + '→' + afterM + ')');
eq(gM.energy, 0, '陨石后能量清零');

// 派对主题门槛:16 成就或金币
clearStorage();
ok(!themes.isUnlocked('festival'), '0 成就不解锁派对主题');
var ach16 = {};
achMod.getList().slice(0, 16).forEach(function (d) { ach16[d.id] = 1; });
_store['merge_watermelon_achievements'] = ach16;
achMod.reload();
ok(themes.isUnlocked('festival'), '16 成就解锁派对主题');

// 语言切换
i18n.reset();
var gL = new Game();
gL.toMenu();
renderChecked(gL);
tap(gL, gL.W - 30, 20);
eq(gL.panel, 'settings', '打开设置面板');
var langRow = gL.settingRows.filter(function (r) { return r.id === 'lang'; })[0];
ok(langRow, '设置含语言项');
tap(gL, langRow.x + 5, langRow.y + 5);
eq(i18n.getLocale(), 'en', '语言切到 en');
tap(gL, langRow.x + 5, langRow.y + 5);
eq(i18n.getLocale(), 'zh', '语言切回 zh');
eq(renderErr, null, '陨石/主题/语言渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- AC. 技能升级树/粒子对象池
section('AC. 技能升级树 / 粒子对象池');
eq(skillup.UPGRADES.length, 4, '技能升级 4 项');
clearStorage(); progression.reset(); skillup.reset();
eq(skillup.getLevel('meteor_size'), 0, '技能升级初始 0 级');
eq(skillup.buy('energy_rate').reason, 'coins', '金币不足不可购买技能升级');
progression.addCoins(1000);
var skB = skillup.buy('energy_rate');
eq(skB.ok, true, '购买能量效率');
eq(skillup.energyBonus(), 1, '能量加成 +1');
eq(skillup.getLevel('meteor_size'), 0, '未购其他项');
eq(skillup.costOf('energy_rate', 5), Infinity, '满级花费 Infinity');
skillup.reset(); progression.reset();
progression.addCoins(1000);
skillup.buy('hammer_power');
eq(skillup.hammerBonus(), 5, '重锤威力 +5/级');
skillup.buy('meteor_size');
eq(skillup.meteorRadiusBonus(), 8, '陨石半径 +8/级');
skillup.buy('shuffle_power');
eq(skillup.shuffleBonus(), 40, '洗牌强度 +40/级');
eq(skillup.totalLevels(), 3, '技能升级总级 3');

// 面板购买技能升级
clearStorage(); progression.reset(); skillup.reset(); resetCalls(); rafQueue = [];
var gK = new Game();
progression.addCoins(5000);
gK.toMenu();
renderChecked(gK);
var Lk = gK.menuLayout();
tap(gK, 200, Lk.gy + 15);
eq(gK.panel, 'growth', '打开成长面板');
renderChecked(gK);
var skillCard = gK.growthCards.filter(function (c) { return c.id === 'energy_rate'; })[0];
ok(skillCard, '成长面板含技能升级卡');
tap(gK, skillCard.x + 5, skillCard.y + 5);
eq(skillup.getLevel('energy_rate'), 1, '面板购买技能升级');

// 粒子对象池
clearStorage(); resetCalls(); rafQueue = [];
var gP = new Game();
tap(gP, 100, 380);
gP.pickType = function () { return 0; };
gP.specialChance = function () { return 0; };
for (var pi = 0; pi < 30; pi++) gP.burst(200, 300, 0);
ok(gP.particles.length > 0 && gP.particles.length <= 220, '粒子数量受上限约束');
for (var pf = 0; pf < 140; pf++) gP.updateFx(1 / 60);
eq(gP.particles.length, 0, '粒子全部回收');
ok(gP._pPool.length > 0, '对象池已复用');
eq(renderErr, null, '技能升级/对象池渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- AD. 弹床机关/全成就奖励/徽章/商店
section('AD. 弹床机关 / 全成就奖励 / 徽章墙 / 商店');

// 弹床
var pw = new physics.World(400, 740, 1);
var pad = pw.spawnPad(200, 700, 30);
eq(pad.kind, 'pad', '弹床 kind=pad');
ok(pad.static, '弹床 static');
var frd = pw.spawn(0, 200, 700 - 30 - 16 - 1);
frd.vy = 300;
var minVy = 0;
for (var pfs = 0; pfs < 90; pfs++) {
  pw.step(1 / 60);
  if (frd.vy < minVy) minVy = frd.vy;
}
ok(minVy <= -800, '弹床把水果向上弹起(vy=' + minVy.toFixed(0) + ')');

// 全成就奖励
clearStorage(); progression.reset(); resetCalls(); rafQueue = [];
var gQ = new Game();
var allAch = achMod.getList();
var achState = {};
allAch.forEach(function (d) { if (d.id !== 'first_clear') achState[d.id] = 1; });
_store['merge_watermelon_achievements'] = achState;
achMod.reload();
gQ.level = 2;
gQ.checkAchievements();
ok(progression.getCoins() >= 1030, '解锁最后成就 + 全成就奖励 ≥1030');

// 徽章墙渲染
clearStorage();
_store['merge_watermelon_achievements'] = { first_clear: 1, first_king: 1 };
achMod.reload();
var gB2 = new Game();
gB2.toMenu();
gB2.openPanel('profile');
renderChecked(gB2);
eq(renderErr, null, '档案徽章墙渲染无异常');

// 商店:只用金币
clearStorage(); progression.reset();
var gSh = new Game();
var payCalls = 0;
global.tt.requestGamePayment = function () { payCalls++; };
gSh.toMenu();
gSh.openPanel('shop');
renderChecked(gSh);
ok(gSh.shopCards && gSh.shopCards.length === 3, '商店 3 个金币道具');
var item0 = gSh.shopCards[0];
tap(gSh, item0.btn.x + 5, item0.btn.y + 5);
eq(shop.count(item0.id), 0, '金币不足买不到道具');
progression.addCoins(1000);
tap(gSh, item0.btn.x + 5, item0.btn.y + 5);
eq(shop.count(item0.id), 1, '点击购买入背包');
eq(progression.getCoins(), 1000 - shop.getById(item0.id).cost, '扣除对应金币');
eq(payCalls, 0, '从不调用真实支付');
delete global.tt.requestGamePayment;
eq(renderErr, null, '弹床/全成就/徽章/商店渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- AE. DDA/多语言/成就分类/机关/周赛/赛季榜
section('AE. DDA / 多语言 / 成就分类 / 传送带·毒刺 / 周赛 / 赛季排行榜');

// DDA
clearStorage(); dda.reset();
eq(dda.factor().targetMult, 1, 'DDA 无样本时中性');
dda.record(100, 2); dda.record(100, 2); dda.record(100, 2);
eq(dda.factor().targetMult, 0.9, '弱玩家目标 ×0.9');
dda.reset();
dda.record(100, 10); dda.record(100, 10); dda.record(100, 10);
eq(dda.factor().targetMult, 1.1, '强玩家目标 ×1.1');
clearStorage(); resetCalls(); rafQueue = [];
var gD = new Game();
gD.pickType = function () { return 0; };
tap(gD, 100, 380);
dda.reset(); dda.record(0, 10); dda.record(0, 10); dda.record(0, 10);
gD.refreshLevelDef();
eq(gD.levelTarget, Math.round(levels.getLevelDef(1).target * 1.1), '游戏目标应用 DDA 倍率');

// 多语言
i18n.reset();
ok(i18n.locales().indexOf('ja') >= 0, '包含日语');
i18n.setLocale('ja');
ok(i18n.t('menu.title').indexOf('スイカ') >= 0, '日语标题命中');
eq(i18n.t('menu.growth').indexOf('育成') >= 0, true, '日语菜单文案');
i18n.reset();
eq(i18n.getLocale(), 'zh', '语言复位 zh');

// 成就分类
clearStorage();
var gAch = new Game();
gAch.toMenu();
gAch.openPanel('achievements');
renderChecked(gAch);
ok(gAch.achCatBtns && gAch.achCatBtns.length === 5, '成就分类 5 项');
tap(gAch, gAch.achCatBtns[1].x + 5, gAch.achCatBtns[1].y + 5);
eq(gAch.achCat, 'progress', '切换到进度分类');
eq(renderErr, null, '成就分类渲染无异常');

// 传送带
var bw4 = new physics.World(400, 740, 1);
var belt = bw4.spawnBelt(200, 700, 30, 1);
ok(belt.kind === 'belt' && belt.static, '传送带 kind/static');
var ff = bw4.spawn(0, 200, 700 - 30 - 16 - 1);
ff.vy = 300;
var maxVx = -1e9;
for (var bts = 0; bts < 90; bts++) { bw4.step(1 / 60); if (ff.vx > maxVx) maxVx = ff.vx; }
ok(maxVx > 50, '传送带横向推动水果(vx=' + maxVx.toFixed(0) + ')');

// 毒刺
var sw = new physics.World(400, 740, 1);
sw.spawnSpike(200, 700, 26);
var sf = sw.spawn(0, 200, 700 - 26 - 16 - 1);
sf.vy = 300;
var spiked = false;
for (var sps = 0; sps < 60; sps++) {
  sw.step(1 / 60);
  var sevs = sw.consumeEvents();
  for (var sei = 0; sei < sevs.length; sei++) if (sevs[sei].type === 'spike') spiked = true;
}
ok(spiked, '毒刺刺破水果并产生事件');

// 周赛活动
clearStorage(); progression.reset(); weekevent.reset();
var ev = weekevent.getEvent();
ok(!!ev.name, '周赛事件存在');
eq(weekevent.isDone(), false, '周赛初始未完成');
eq(weekevent.claim().reason, 'todo', '周赛未完成不可领');
weekevent.markSuccess();
eq(weekevent.isClaimable(), true, '周赛完成后可领');
var coinsEv = progression.getCoins();
var rcEv = weekevent.claim();
eq(rcEv.ok, true, '领取周赛成功');
eq(progression.getCoins(), coinsEv + rcEv.reward, '周赛发币');

clearStorage(); progression.reset(); weekevent.reset(); resetCalls(); rafQueue = [];
var gEv = new Game();
var ev2 = weekevent.getEvent();
gEv.weekEventActive = true;
gEv.weekEventMod = ev2.mod;
gEv.weekEventKey = ev2.key;
if (ev2.mode === 'frenzy') gEv.startFrenzy(); else gEv.startClassic();
eq(gEv.weekEventActive, true, '周赛激活');
eq(gEv.started, true, '进入周赛对局');
if (ev2.mode === 'frenzy') { gEv.score = ev2.targetScore; } else { gEv.level = ev2.targetLevel; }
gEv.checkWeekEventSuccess();
ok(weekevent.isDone(ev2.key), '周赛达标标记');

// 周赛卡片位于每日面板
clearStorage(); progression.reset(); weekevent.reset(); resetCalls(); rafQueue = [];
var gWk = new Game();
gWk.toMenu();
gWk.openPanel('daily');
renderChecked(gWk);
ok(gWk.dailyBtns.weekStart, '每日面板含参加周赛按钮');
eq(gWk.dailyBtns.weekClaim, null, '未完成时无周赛领奖按钮');
weekevent.markSuccess();
ok(gWk.claimableFlags().daily, '周赛可领时每日入口红点');
renderChecked(gWk);
ok(gWk.dailyBtns.weekClaim, '完成后出现周赛领奖按钮');
var coinsWk = progression.getCoins();
gWk.weekEventKey = weekevent.getEvent().key;
tap(gWk, gWk.dailyBtns.weekClaim.x + 5, gWk.dailyBtns.weekClaim.y + 5);
eq(progression.getCoins(), coinsWk + weekevent.getEvent().reward, '每日面板领取周赛奖励');
renderChecked(gWk);
eq(gWk.dailyBtns.weekStart, null, '周赛完成后开始按钮置灰');
eq(renderErr, null, 'DDA/多语言/分类/机关/周赛渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- AF. 新手保护/帮助分页/存档校验/标题i18n/分享
section('AF. 新手保护 / 帮助分页 / 存档校验 / 标题本地化 / 分享增强');

// 新手保护
clearStorage(); settings.reset(); resetCalls(); rafQueue = [];
var gG = new Game();
gG.pickType = function () { return 0; };
gG.specialChance = function () { return 0; };
tap(gG, 100, 380);
ok(gG.graceDrops > 0, '新手保护生效(' + gG.graceDrops + ' 次)');
gG.world.spawn(3, 200, 60);
gG.aboveTimer = 5;
frame(gG);
eq(gG.over, false, '保护期内不因堆高结束');
gG.graceDrops = 0;
gG.aboveTimer = 1.799;
frame(gG);
eq(gG.over, true, '保护结束后危险线正常判负');

// 帮助分页
clearStorage();
var gH2 = new Game();
gH2.toMenu();
gH2.openPanel('help');
renderChecked(gH2);
ok(gH2.helpTabs && gH2.helpTabs.length === 3, '帮助 3 页');
tap(gH2, gH2.helpTabs[1].x + 5, gH2.helpTabs[1].y + 5);
eq(gH2.helpPage, 1, '切换到系统页');
tap(gH2, gH2.helpTabs[2].x + 5, gH2.helpTabs[2].y + 5);
eq(gH2.helpPage, 2, '切换到进阶页');
eq(renderErr, null, '帮助分页渲染无异常');

// 存档校验和
clearStorage();
_store['merge_watermelon_coins'] = 321;
var d2 = save.exportAll();
var obj2 = JSON.parse(d2);
eq(typeof obj2.c, 'number', '导出含校验和');
clearStorage();
eq(save.importAll(d2).ok, true, '校验通过导入');
eq(tt.getStorageSync('merge_watermelon_coins'), 321, '导入恢复金币');
var tamper = JSON.parse(d2);
tamper.d['merge_watermelon_coins'] = 999999;
eq(save.importAll(JSON.stringify(tamper)).reason, 'checksum', '篡改被拒绝');
eq(save.importAll('[1,2]').ok, false, '非对象拒绝');
eq(save.importAll('{bad json').ok, false, '非法 JSON 拒绝');

// 面板标题本地化
i18n.reset();
i18n.setLocale('en');
eq(i18n.t('panel.growth'), '⚙ Upgrades', '面板标题 en 命中');
i18n.reset();

// 分享增强
clearStorage(); resetCalls();
shareMod.shareResult(1234, 2000, '经典闯关', '成就 5/21');
ok(_calls.shareAppMessage.length >= 1, '分享被调用');
ok(_calls.shareAppMessage[_calls.shareAppMessage.length - 1].title.indexOf('成就 5/21') >= 0, '分享标题含额外信息');
eq(renderErr, null, '新手/帮助/存档/标题/分享流程渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- AG. 每日连胜/清档/图鉴详情/性能降级/暂停统计
section('AG. 每日连胜 / 清档 / 图鉴详情 / 性能降级 / 暂停统计');

// 每日连胜
clearStorage(); progression.reset(); liveops.reset();
liveops.markDailySuccess('2026-09-01');
eq(liveops.getStreak(), 1, '连胜 1');
liveops.markDailySuccess('2026-09-02');
eq(liveops.getStreak(), 2, '连胜递增 2');
liveops.markDailySuccess('2026-09-04');
eq(liveops.getStreak(), 1, '断签重置 1');
eq(liveops.streakBonus(), liveops.STREAK_BONUS_PER_DAY, '连胜奖励 = 每日加成×1');

// 清档面板
clearStorage(); resetCalls(); rafQueue = [];
var gRst = new Game();
gRst.toMenu();
renderChecked(gRst);
tap(gRst, gRst.W - 30, 20);
eq(gRst.panel, 'settings', '打开设置');
var resetRow = gRst.settingRows.filter(function (r) { return r.id === 'reset'; })[0];
ok(resetRow, '设置含清档项');
tap(gRst, resetRow.x + 5, resetRow.y + 5);
eq(gRst.panel, 'reset', '打开清档面板');
var cleared = false;
global.tt.clearStorageSync = function () { cleared = true; };
tap(gRst, gRst.resetBtns.confirm.x + 5, gRst.resetBtns.confirm.y + 5);
ok(cleared, '确认清档调用 clearStorageSync');
eq(gRst.panel, null, '清档后关闭面板');
delete global.tt.clearStorageSync;

// 图鉴详情
clearStorage();
_store['merge_watermelon_collection'] = [Date.now()];
achMod.reload();
var gCol = new Game();
gCol.toMenu();
gCol.openPanel('collection');
renderChecked(gCol);
ok(gCol.collectionRects && gCol.collectionRects.length === 11, '图鉴 11 格');
var cell = gCol.collectionRects[0];
tap(gCol, cell.x + 2, cell.y + 2);
eq(gCol.collectionDetail, 0, '点开图鉴详情');
renderChecked(gCol);
eq(renderErr, null, '图鉴详情渲染无异常');
tap(gCol, 200, 400);
eq(gCol.collectionDetail, null, '点击关闭详情');

// 性能降级
eq(gCol.particleCap, 220, '默认粒子上限 220');
gCol._fpsN = 29;
gCol._fpsAcc = 0.05 * 29;
gCol.update(1 / 60);
eq(gCol.lowPerf, true, '低帧率判定');
eq(gCol.particleCap, 120, '低帧率降低粒子上限');

// 暂停本局统计渲染
clearStorage(); resetCalls(); rafQueue = [];
var gPs = new Game();
gPs.pickType = function () { return 0; };
gPs.specialChance = function () { return 0; };
tap(gPs, 100, 380);
tap(gPs, 256, 44);
eq(gPs.paused, true, '暂停');
renderChecked(gPs);
eq(renderErr, null, '暂停本局统计渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- AH. 公告/皮肤金币解锁/成就点数/色盲/时间线
section('AH. 公告 / 皮肤金币解锁 / 成就点数 / 色盲模式 / 成就时间线');

// 公告
clearStorage();
_store['merge_watermelon_notice_seen'] = '';
ok(notice.shouldShow(), '公告未读');
var gN = new Game();
eq(gN.noticeOpen, true, '公告自动弹出');
renderChecked(gN);
tap(gN, 200, 400);
eq(gN.noticeOpen, false, '点击关闭公告');
ok(!notice.shouldShow(), '公告标记已读');

// 皮肤金币解锁
clearStorage(); progression.reset();
ok(!themes.isUnlocked('space'), '星际未解锁(0 成就)');
progression.addCoins(5000);
var bought = themes.buyTheme('space');
eq(bought.ok, true, '金币解锁主题');
ok(themes.isUnlocked('space'), '解锁后 isUnlocked 为真');
eq(progression.getCoins(), 5000 - themes.getTheme('space').cost, '解锁扣金币');
themes.buyTheme('space');
clearStorage(); progression.reset();
eq(themes.buyTheme('space').reason, 'coins', '金币不足解锁失败');

// 面板点击解锁并切换
clearStorage(); progression.reset(); progression.addCoins(5000); resetCalls(); rafQueue = [];
var gTp = new Game();
gTp.toMenu();
gTp.openPanel('themes');
renderChecked(gTp);
var spaceCard = gTp.themeCards.filter(function (c) { return c.id === 'space'; })[0];
ok(spaceCard, '主题面板含星际卡');
tap(gTp, spaceCard.x + 5, spaceCard.y + 5);
ok(themes.isUnlocked('space'), '面板点击解锁');
eq(gTp.theme.id, 'space', '解锁后切换');

// 成就点数
clearStorage();
_store['merge_watermelon_achievements'] = { first_clear: 1, first_king: 1 };
achMod.reload();
eq(achMod.getGp(), 5 + 15, '成就点数累加');
ok(achMod.totalGp() > achMod.getGp(), '总点数大于已得');

// 色盲模式
clearStorage(); settings.reset();
var gCb = new Game();
gCb.pickType = function () { return 0; };
gCb.specialChance = function () { return 0; };
tap(gCb, 100, 380);
gCb.world.spawn(0, 200, 300);
gCb.colorblind = true;
renderChecked(gCb);
eq(renderErr, null, '色盲模式渲染无异常');
gCb.toMenu();
renderChecked(gCb);
tap(gCb, gCb.W - 30, 20);
var cbRow = gCb.settingRows.filter(function (r) { return r.id === 'colorblind'; })[0];
ok(cbRow, '设置含色盲项');
tap(gCb, cbRow.x + 5, cbRow.y + 5);
eq(settings.isColorblind(), gCb.colorblind, '色盲设置持久化');

// 档案时间线/GP 渲染
clearStorage();
_store['merge_watermelon_achievements'] = { first_clear: Date.now(), first_king: Date.now() };
achMod.reload();
var gTl = new Game();
gTl.toMenu();
gTl.openPanel('profile');
renderChecked(gTl);
eq(renderErr, null, '档案(含时间线/GP)渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- AI. GP 兑换/小贴士/图鉴奖励/进度环
section('AI. GP 兑换 / 小贴士 / 图鉴集齐奖励 / 档案进度环');

// GP 兑换
clearStorage(); gpexchange.reset();
_store['merge_watermelon_achievements'] = { first_clear: 1, first_king: 1 };
achMod.reload();
eq(gpexchange.earnedGp(), 5 + 15, 'GP 已得 20');
eq(gpexchange.availableGp(), 20, '可用 GP 20');
eq(gpexchange.exchange('gp_small').reason, 'gp', 'GP 不足兑换被拒');
_store['merge_watermelon_achievements'] = (function () {
  var o = {};
  achMod.getList().forEach(function (d) { o[d.id] = 1; });
  return o;
})();
achMod.reload();
var earnedAll = gpexchange.earnedGp();
ok(earnedAll >= 100, '全成就 GP 充足(' + earnedAll + ')');
eq(gpexchange.exchange('gp_big').reason, 'gp', 'GP 不足兑换大额');
progression.reset();
var ex1 = gpexchange.exchange('gp_small');
eq(ex1.ok, true, 'GP 兑换成功');
eq(progression.getCoins(), 500, '兑换得 500 金币');
eq(gpexchange.availableGp(), earnedAll - 100, '扣除 100 GP');

// 商店面板 GP 兑换
clearStorage(); progression.reset(); gpexchange.reset(); resetCalls(); rafQueue = [];
_store['merge_watermelon_achievements'] = (function () {
  var o = {};
  achMod.getList().forEach(function (d) { o[d.id] = 1; });
  return o;
})();
achMod.reload();
var gGp = new Game();
gGp.toMenu();
gGp.openPanel('shop');
renderChecked(gGp);
ok(gGp.gpCards && gGp.gpCards.length === 4, '商店含 GP 兑换 4 项');
var gpCell = gGp.gpCards[0];
var coinsB4 = progression.getCoins();
tap(gGp, gpCell.btn.x + 5, gpCell.btn.y + 5);
ok(progression.getCoins() > coinsB4, '面板兑换发放金币');

// 图鉴集齐奖励
clearStorage(); progression.reset(); resetCalls(); rafQueue = [];
var gC2 = new Game();
for (var cc = 0; cc < 11; cc++) achMod.markCollected(cc);
gC2.checkAchievements();
eq(tt.getStorageSync('merge_watermelon_collect_bounty'), 1, '图鉴奖励标记');
var coinsAfterCol = progression.getCoins();
gC2.checkAchievements();
eq(progression.getCoins(), coinsAfterCol, '图鉴奖励只发一次');

// 小贴士 + 进度环渲染
clearStorage(); settings.reset();
var gTp3 = new Game();
gTp3.pickType = function () { return 0; };
gTp3.specialChance = function () { return 0; };
tap(gTp3, 100, 380);
renderChecked(gTp3);
eq(renderErr, null, '小贴士渲染无异常');
gTp3.toMenu();
gTp3.openPanel('profile');
renderChecked(gTp3);
eq(renderErr, null, '档案进度环渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- AK. 自玩自查(开门/首关可通关/布局)
section('AK. 自玩自查:开门 / 第 1 关可通关 / 布局越界');

// 开门体验
clearStorage();
_store['merge_watermelon_notice_seen'] = '';
var gAK = new Game();
ok(gAK.noticeOpen, '全新玩家开门弹公告');
tap(gAK, 200, 400);
ok(!gAK.noticeOpen, '点击关闭公告回主菜单');
['themes', 'growth', 'daily', 'missions', 'profile', 'settings', 'help', 'shop'].forEach(function (p) { gAK.openPanel(p); renderChecked(gAK); });
eq(gAK.lastRenderErr, undefined, '全部面板逐个打开渲染无异常');

// 第 1 关稳定可通关(两列交替 + ±10px 手指抖动;同一像素反复投放会叠出现实中不存在的平衡塔)
clearStorage();
function akClearL1() {
  var gf = new Game();
  gf.specialChance = function () { return 0; };
  gf.startClassic();
  for (var i = 0; i < 60 && !gf.over && gf.level < 2; i++) {
    if (gf.perkChoices) gf.applyPerk(gf.perkLayout()[0].perk);
    if (gf.clearPause > 0) { gf.clearPause = 0; gf.clearInfo = null; }
    gf.onTap(((i % 2) ? 160 : 240) + (Math.random() - 0.5) * 20, 240);
    for (var f = 0; f < 60 && !gf.over; f++) { gf.update(1 / 60); if (gf.level >= 2) break; }
  }
  return gf.level >= 2;
}
var akClears = 0;
for (var ak = 0; ak < 4; ak++) { if (akClearL1()) akClears += 1; }
eq(akClears, 4, '第 1 关能稳定通关(新手大门不卡人)', akClears + '/4');

// 布局越界:主要面板矩形在屏幕内
clearStorage();
var gLo = new Game();
gLo.toMenu();
gLo.openPanel('themes'); renderChecked(gLo);
ok(gLo.themeCards.every(function (r) { return r.x + r.w <= gLo.W + 1 && r.y + r.h <= gLo.H + 1; }), '主题卡片在屏幕内');
gLo.openPanel('growth'); renderChecked(gLo);
ok(gLo.growthCards.every(function (r) { return r.x + r.w <= gLo.W + 1 && r.y + r.h <= gLo.H + 1; }), '养成卡片在屏幕内');
gLo.openPanel('missions'); renderChecked(gLo);
ok(gLo.missionCards.every(function (r) { return r.x + r.w <= gLo.W + 1 && r.y + r.h <= gLo.H + 1; }), '任务卡片在屏幕内');
eq(renderErr, null, '自查流程渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- AJ. 音量/连击进度条/天赋稀有保底
section('AJ. 音量调节 / 连击进度条 / 天赋稀有保底');

// 音量
clearStorage(); settings.reset();
var gVo = new Game();
eq(gVo.audio.volume, 1, '默认音量 100%');
gVo.audio.setVolume(0.5);
eq(gVo.audio.volume, 0.5, 'setVolume 生效');
gVo.toMenu();
renderChecked(gVo);
tap(gVo, gVo.W - 30, 20);
var volRow = gVo.settingRows.filter(function (r) { return r.id === 'volume'; })[0];
ok(volRow, '设置含音量项');
tap(gVo, volRow.x + 5, volRow.y + 5);
eq(settings.getVolume(), 0.7, '音量切到 70%');
eq(gVo.audio.volume, 0.7, '音量应用到播放器');
tap(gVo, volRow.x + 5, volRow.y + 5);
eq(settings.getVolume(), 0.4, '音量切到 40%');
settings.reset();

// 连击进度条渲染
clearStorage(); settings.reset(); resetCalls(); rafQueue = [];
var gCm = new Game();
gCm.pickType = function () { return 0; };
gCm.specialChance = function () { return 0; };
tap(gCm, 100, 380);
gCm.combo = 3;
gCm.comboTimer = 1.0;
gCm.comboWindow = 2;
renderChecked(gCm);
eq(renderErr, null, '连击进度条渲染无异常');

// 天赋稀有保底
var rpC = {};
var rp = perks.rollEligible(rpC, 3);
ok(rp.some(function (p) { return p.rarity === 'rare'; }), '三选一保底 1 个稀有天赋');
eq(renderErr, null, '音量/连击/保底流程渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- AK. 上线合规 / 新手手感
section('AK. 隐私授权 / 切后台暂停 / 健康忠告 / 掉落冷却 / 新手关卡曲线');
var privacy = require('../js/privacy');

// 隐私:全新玩家先弹隐私,拒绝后不上传云端、不打开好友榜
clearStorage();
delete _store['merge_watermelon_privacy'];
resetCalls(); rafQueue = [];
var gPv = new Game();
ok(gPv.privacyOpen, '全新玩家先弹隐私提示');
renderChecked(gPv);
var pvDecline = gPv.privacyBtns.filter(function (b) { return b.act === 'decline'; })[0];
tap(gPv, pvDecline.x + 5, pvDecline.y + 5);
ok(!gPv.privacyOpen, '点击不同意后关闭弹窗');
eq(privacy.isAgreed(), false, '拒绝后未授权');
ok(!privacy.needsPrompt(), '拒绝结果已持久化,不再重复询问');
shareMod.submitScore(999);
eq(_calls.setUserCloudStorage.length, 0, '未授权时不上报分数');
eq(cloud.submitScore(999), false, '未授权时云端写入不可用');
gPv.openLeaderboard(0);
ok(!gPv.leaderboardOpen && gPv.privacyOpen, '未授权打开好友榜改为重新弹隐私');
renderChecked(gPv);
var pvAgree = gPv.privacyBtns.filter(function (b) { return b.act === 'agree'; })[0];
tap(gPv, pvAgree.x + 5, pvAgree.y + 5);
ok(privacy.isAgreed(), '再次同意后已授权');
shareMod.submitScore(999);
eq(_calls.setUserCloudStorage.length, 1, '授权后正常上报分数');

// 切后台暂停 + 静音,回前台恢复音频但保持暂停
clearStorage(); resetCalls(); rafQueue = [];
var hideCb = null, showCb = null;
global.tt.onHide = function (cb) { hideCb = cb; };
global.tt.onShow = function (cb) { showCb = cb; };
var gBg = new Game();
gBg.specialChance = function () { return 0; };
tap(gBg, 100, 380);
ok(gBg.started && !gBg.paused, '对局进行中');
ok(typeof hideCb === 'function' && typeof showCb === 'function', '注册了 onHide/onShow');
hideCb();
ok(gBg.paused, '切后台自动暂停');
eq(gBg.audio.isEnabled(), false, '切后台关闭音效');
showCb();
ok(gBg.paused, '回前台保持暂停,等玩家手动继续');
eq(gBg.audio.isEnabled(), !gBg.muted, '回前台按静音偏好恢复音效');
renderChecked(gBg);
delete global.tt.onHide;
delete global.tt.onShow;

// 健康忠告与适龄提示在主菜单绘制
clearStorage(); resetCalls(); rafQueue = [];
var gHn = new Game();
var hnCalls = 0, ageCalls = 0;
var origHn = gHn.drawHealthNotice, origAge = gHn.drawAgeBadge;
gHn.drawHealthNotice = function () { hnCalls += 1; return origHn.apply(this, arguments); };
gHn.drawAgeBadge = function () { ageCalls += 1; return origAge.apply(this, arguments); };
renderChecked(gHn);
ok(hnCalls === 1 && ageCalls === 1, '主菜单绘制健康游戏忠告与适龄提示');

// 掉落冷却:冷却内连点只掉一颗
clearStorage(); resetCalls(); rafQueue = [];
var gCd = new Game();
gCd.specialChance = function () { return 0; };
tap(gCd, 100, 380);
var spawnN = 0;
var origSpawn = gCd.world.spawn;
gCd.world.spawn = function () { spawnN += 1; return origSpawn.apply(this, arguments); };
tap(gCd, 200, 300);
tap(gCd, 200, 300);
tap(gCd, 200, 300);
eq(spawnN, 1, '冷却内连点只掉落 1 颗');
for (var cdf = 0; cdf < 30; cdf++) frame(gCd, 1 / 60);
tap(gCd, 200, 300);
eq(spawnN, 2, '冷却结束后可再次掉落');

// 新手关卡曲线:前 5 关平滑爬坡,Boss 倍率 1.25
eq(levels.getLevelDef(2).target, 180, '第 2 关目标 180');
eq(levels.getLevelDef(3).target, 260, '第 3 关目标 260');
eq(levels.getLevelDef(4).target, 340, '第 4 关目标 340');
ok(levels.getLevelDef(5).target > levels.getLevelDef(4).target, '第 5 关回到公式且仍递增');
eq(levels.getLevelDef(10).target, Math.round(Math.round(300 * 1.0 * (1 + 0.09 * 9)) * 1.25), 'Boss 关倍率 1.25');
eq(renderErr, null, '合规/手感流程渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- AL. 金币商店道具 / 金币来源
section('AL. 金币商店道具 / 看广告领金币 / 首通 / 新水果 / 连击 / 每日首局');

// 商店单元
clearStorage(); progression.reset(); shop.reset();
eq(shop.list().length, 3, '商店 3 种道具');
ok(shop.ITEMS.every(function (it) { return it.cost > 0 && !it.price; }), '全部以金币标价,无真实价格');
eq(shop.buy('energy').reason, 'coins', '金币不足购买失败');
progression.addCoins(500);
var bEn = shop.buy('energy');
eq(bEn.ok, true, '金币购买成功');
eq(progression.getCoins(), 500 - shop.getById('energy').cost, '扣除道具金币');
eq(shop.count('energy'), 1, '道具入背包');
eq(shop.consume('energy'), true, '消耗道具');
eq(shop.consume('energy'), false, '无道具时消耗失败');
eq(shop.buy('nope').reason, 'unknown', '未知道具拒绝');

// 每日看广告领金币:限次
clearStorage(); progression.reset(); shop.reset();
eq(shop.adLeftToday('2026-10-15'), shop.AD_DAILY_LIMIT, '每日初始可领 3 次');
for (var adi = 0; adi < shop.AD_DAILY_LIMIT; adi++) shop.grantAdCoins('2026-10-15');
eq(progression.getCoins(), shop.AD_COINS * shop.AD_DAILY_LIMIT, '3 次共发放金币');
eq(shop.grantAdCoins('2026-10-15').reason, 'limit', '超出每日上限');
eq(shop.adLeftToday('2026-10-16'), shop.AD_DAILY_LIMIT, '次日重置次数');

// 商店面板看广告
clearStorage(); progression.reset(); shop.reset(); resetCalls(); rafQueue = [];
var _acb = null;
var aMock = { onClose: function (cb) { _acb = cb; }, offClose: function (cb) { if (_acb === cb) _acb = null; }, show: function () { return { then: undefined }; } };
global.tt.createRewardedVideoAd = function () { return aMock; };
monetize.reset();
var gAd = new Game();
gAd.toMenu();
gAd.openPanel('shop');
renderChecked(gAd);
ok(gAd.shopAdBtn, '商店含看广告领金币按钮');
tap(gAd, gAd.shopAdBtn.x + 5, gAd.shopAdBtn.y + 5);
ok(typeof _acb === 'function', '请求激励视频');
_acb({ isEnded: true });
eq(progression.getCoins(), shop.AD_COINS, '看完广告到账');
eq(shop.adLeftToday(), shop.AD_DAILY_LIMIT - 1, '扣除一次次数');
delete global.tt.createRewardedVideoAd;

// 开局道具自动使用
clearStorage(); progression.reset(); shop.reset(); resetCalls(); rafQueue = [];
var gBase = new Game();
gBase.specialChance = function () { return 0; };
gBase.startClassic();
var baseDanger = gBase.runMod.dangerThresholdAdd;
eq(gBase.energy, 0, '无道具开局能量 0');
progression.addCoins(1000);
shop.buy('energy'); shop.buy('shield');
var gItm = new Game();
gItm.specialChance = function () { return 0; };
gItm.startClassic();
eq(gItm.energy, skills.ENERGY_MAX, '满能量道具生效');
eq(gItm.runMod.dangerThresholdAdd, baseDanger + shop.SHIELD_SECONDS, '护盾卡延长判负时间');
eq(shop.count('energy') + shop.count('shield'), 0, '开局各消耗一个');
gItm.restart();
eq(gItm.energy, 0, '道具用完后下局不再生效');

// 复活卡:免广告复活
clearStorage(); progression.reset(); shop.reset(); resetCalls(); rafQueue = [];
progression.addCoins(1000);
shop.buy('revive');
var gRv = new Game();
gRv.specialChance = function () { return 0; };
gRv.startClassic();
gRv.endGame();
renderChecked(gRv);
var adCreated = false;
global.tt.createRewardedVideoAd = function () { adCreated = true; return aMock; };
gRv.requestRevive();
ok(!gRv.over && gRv.revivedThisRun, '复活卡直接复活');
eq(adCreated, false, '使用复活卡不拉广告');
eq(shop.count('revive'), 0, '复活卡已消耗');
delete global.tt.createRewardedVideoAd;

// 首通奖励
clearStorage(); rewards.reset();
eq(rewards.firstClear(1), 5, '首通第 1 关 5 金币');
eq(rewards.firstClear(1), 0, '重复通关不再发');
eq(rewards.firstClear(10), 100, 'Boss 关首通翻倍');
eq(rewards.firstClear(5), 0, '已越过的关不再发');
clearStorage(); progression.reset(); rewards.reset(); resetCalls(); rafQueue = [];
var gFc = new Game();
gFc.specialChance = function () { return 0; };
gFc.startClassic();
gFc.checkAchievements = function () {};
var fcCoins = progression.getCoins();
gFc.levelProgress = gFc.levelTarget;
gFc.levelClearCheck();
eq(progression.getCoins(), fcCoins + 5, '对局内首通第 1 关到账');
ok(gFc.popups.some(function (p) { return String(p.text).indexOf('首通') >= 0; }), '首通弹出提示');

// 新水果发现
var discTotal = 0;
for (var dt = 0; dt < 11; dt++) discTotal += rewards.discoverCoins(dt);
eq(discTotal, 1320, '11 种水果发现奖励合计 1320');
clearStorage(); progression.reset(); resetCalls(); rafQueue = [];
var gDs = new Game();
gDs.specialChance = function () { return 0; };
tap(gDs, 100, 380);
var dsType = gDs.nextType;
var dsCoins = progression.getCoins();
tap(gDs, 200, 300);
eq(progression.getCoins(), dsCoins + rewards.discoverCoins(dsType), '首次投放新水果发奖');
for (var dsf = 0; dsf < 30; dsf++) frame(gDs, 1 / 60);
var dsCoins2 = progression.getCoins();
gDs.nextType = dsType;
tap(gDs, 200, 300);
eq(progression.getCoins(), dsCoins2, '已收集水果不重复发奖');

// 连击里程碑 + 每日首局双倍
eq(rewards.comboCoins(5), 5, '连击 5 奖 5');
eq(rewards.comboCoins(20), 20, '连击 20 奖 20');
eq(rewards.comboCoins(6), 0, '非里程碑无奖');
clearStorage(); rewards.reset();
eq(rewards.takeFirstRunOfDay('2026-10-15'), true, '当日首局');
eq(rewards.takeFirstRunOfDay('2026-10-15'), false, '当日第二局');
eq(rewards.takeFirstRunOfDay('2026-10-16'), true, '次日重新计首局');
clearStorage(); progression.reset(); rewards.reset(); resetCalls(); rafQueue = [];
var gFr = new Game();
gFr.specialChance = function () { return 0; };
gFr.startClassic();
gFr.score = 1000; gFr.level = 3; gFr.perksTaken = [];
gFr.bonusCoins = 15;
gFr.endGame();
var frBase = progression.coinsForRun(1000, 3, 0) + 15;
eq(gFr.coinsEarned, frBase * 2, '每日首局金币翻倍(含连击奖励)');
gFr.restart();
gFr.score = 1000; gFr.level = 3; gFr.perksTaken = [];
gFr.endGame();
eq(gFr.coinsEarned, progression.coinsForRun(1000, 3, 0), '当日第二局不翻倍,连击奖励已清零');
eq(renderErr, null, '商店/金币来源流程渲染无异常');
clearStorage(); resetCalls();

// ---------------------------------------------------------- AM. 录屏分享 / 侧边栏复访 / 添加到桌面
section('AM. 录屏分享 / 侧边栏复访 / 添加到桌面');
var recorder = require('../js/recorder');
var sidebar = require('../js/sidebar');
var shortcut = require('../js/shortcut');

// 录屏
clearStorage(); progression.reset(); resetCalls(); rafQueue = [];
var recCalls = [];
var recStopCb = null;
var recMock = {
  start: function (o) { recCalls.push('start:' + o.duration); },
  pause: function () { recCalls.push('pause'); },
  resume: function () { recCalls.push('resume'); },
  stop: function () { recCalls.push('stop'); if (recStopCb) recStopCb({ videoPath: 'ttfile://rec.mp4' }); },
  onStop: function (cb) { recStopCb = cb; },
  onError: function () {}
};
global.tt.getGameRecorderManager = function () { return recMock; };
recorder.reset();
var gRc = new Game();
gRc.specialChance = function () { return 0; };
gRc.startClassic();
eq(recCalls[0], 'start:' + recorder.MAX_SEC, '开局开始录屏(上限 300 秒)');
recorder.sync(true, 2);
recorder.sync(false, 0);
eq(recCalls[recCalls.length - 1], 'pause', '暂停/切后台时暂停录屏');
recorder.sync(false, 0);
eq(recCalls.filter(function (c) { return c === 'pause'; }).length, 1, '状态不变时不重复调用平台');
recorder.sync(true, 0);
eq(recCalls[recCalls.length - 1], 'resume', '继续时恢复录屏');
gRc.endGame();
eq(recCalls[recCalls.length - 1], 'stop', '结算停止录屏');
eq(recorder.hasVideo(), false, '不足 3 秒的录屏不可分享');
gRc.restart();
recorder.sync(true, 5);
recCalls = [];
gRc.restart();
eq(recCalls.join(','), 'stop,start:' + recorder.MAX_SEC, '录制中重开:先停旧录屏再开新录屏');
recorder.sync(true, 5);
gRc.endGame();
ok(recorder.hasVideo(), '满 3 秒结算后可分享录屏');
renderChecked(gRc);
var coinsRc = progression.getCoins();
_calls.shareAppMessage = [];
gRc.shareRun();
var vShare = _calls.shareAppMessage[_calls.shareAppMessage.length - 1];
ok(vShare && vShare.channel === 'video' && vShare.extra.videoPath === 'ttfile://rec.mp4', '结算分享走视频分享');
ok(vShare.extra.videoTopics.indexOf('瓜王争霸') >= 0, '视频分享带话题');
eq(progression.getCoins(), coinsRc, '分享不发奖励(规避诱导分享)');
gRc.toMenu();
delete global.tt.getGameRecorderManager;
recorder.reset();
var gRc2 = new Game();
gRc2.specialChance = function () { return 0; };
gRc2.startClassic();
gRc2.endGame();
_calls.shareAppMessage = [];
gRc2.shareRun();
ok(_calls.shareAppMessage.length === 1 && !_calls.shareAppMessage[0].channel, '无录屏能力时退回图片分享');

// 侧边栏复访
clearStorage(); progression.reset(); resetCalls(); rafQueue = [];
sidebar.reset(); shortcut.reset();
ok(sidebar.isSidebarLaunch({ launch_from: 'homepage', location: 'sidebar_card' }), '识别侧边栏启动参数');
ok(sidebar.isSidebarLaunch({ query: { launch_from: 'homepage', location: 'sidebar_card' } }), '识别 query 中的侧边栏参数');
ok(!sidebar.isSidebarLaunch({ launch_from: 'search' }), '非侧边栏启动不识别');
var navCalls = 0;
global.tt.checkScene = function (o) { o.success({ isExist: true }); };
global.tt.navigateToScene = function (o) { navCalls++; if (o.success) o.success({}); };
var gSb = new Game();
ok(sidebar.isSupported(), 'checkScene 判定支持侧边栏');
gSb.toMenu();
renderChecked(gSb);
ok(gSb.menuIcons.welfare, '主菜单出现福利入口');
tap(gSb, gSb.menuIcons.welfare.x + 5, gSb.menuIcons.welfare.y + 5);
eq(gSb.panel, 'welfare', '打开福利面板');
renderChecked(gSb);
ok(gSb.welfareBtns.sidebar, '福利面板含侧边栏按钮');
tap(gSb, gSb.welfareBtns.sidebar.x + 5, gSb.welfareBtns.sidebar.y + 5);
eq(navCalls, 1, '未从侧边栏进入时引导前往侧边栏');
eq(progression.getCoins(), 0, '未从侧边栏进入不发奖');
gSb.onAppShow({ launch_from: 'homepage', location: 'sidebar_card' });
ok(sidebar.canClaim(), '从侧边栏回到游戏后可领取');
renderChecked(gSb);
tap(gSb, gSb.welfareBtns.sidebar.x + 5, gSb.welfareBtns.sidebar.y + 5);
eq(progression.getCoins(), sidebar.REWARD, '领取侧边栏奖励');
tap(gSb, gSb.welfareBtns.sidebar.x + 5, gSb.welfareBtns.sidebar.y + 5);
eq(progression.getCoins(), sidebar.REWARD, '当日不可重复领取');
eq(navCalls, 1, '已领取后不再跳转侧边栏');
eq(sidebar.claim('2099-01-01').ok, true, '次日可再次领取');
delete global.tt.checkScene;
delete global.tt.navigateToScene;

// 添加到桌面
clearStorage(); progression.reset(); resetCalls(); rafQueue = [];
sidebar.reset(); shortcut.reset();
var scCalls = 0;
global.tt.addShortcut = function (o) { scCalls++; if (o.success) o.success({}); };
var gSc = new Game();
gSc.toMenu();
renderChecked(gSc);
ok(gSc.menuIcons.welfare, '支持添加桌面时出现福利入口');
gSc.openPanel('welfare');
renderChecked(gSc);
eq(gSc.welfareBtns.sidebar, null, '不支持侧边栏时不显示侧边栏卡片');
ok(gSc.welfareBtns.shortcut, '福利面板含添加桌面按钮');
tap(gSc, gSc.welfareBtns.shortcut.x + 5, gSc.welfareBtns.shortcut.y + 5);
eq(scCalls, 1, '调用 addShortcut');
eq(progression.getCoins(), shortcut.REWARD, '首次添加到桌面奖励');
shortcut.add();
eq(progression.getCoins(), shortcut.REWARD, '桌面奖励只发一次');
ok(!shortcut.shouldShow(), '已添加且已领奖后隐藏入口');
var origSys = global.tt.getSystemInfoSync;
global.tt.getSystemInfoSync = function () { var o = origSys(); o.platform = 'ios'; return o; };
eq(shortcut.available(), false, 'iOS 不支持添加到桌面');
global.tt.getSystemInfoSync = origSys;
delete global.tt.addShortcut;
shortcut.reset(); sidebar.reset();
var gNo = new Game();
gNo.toMenu();
renderChecked(gNo);
eq(gNo.menuIcons.welfare, null, '都不支持时不显示福利入口');
eq(renderErr, null, '录屏/侧边栏/桌面流程渲染无异常');
clearStorage(); resetCalls();

// ------------------------------------------------------------ 汇总
console.log('\n==============================================');
console.log('通过 ' + passCount + ' 项 / 失败 ' + failCount + ' 项');
console.log('结果: ' + (failCount === 0 ? '✅ ALL PASS' : '❌ FAILED'));
if (renderErr) console.log('渲染异常: ' + renderErr);
if (typeof process !== 'undefined') process.exit(failCount === 0 ? 0 : 1);
