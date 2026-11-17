var fruitData = require('./fruits');
var physics = require('./physics');
var audioMod = require('./audio');
var shareMod = require('./share');
var leaderboardMod = require('./leaderboard');
var achMod = require('./achievements');
var themesMod = require('./themes');
var levelsMod = require('./levels');
var perksMod = require('./perks');
var progMod = require('./progression');
var liveopsMod = require('./liveops');
var monetizeMod = require('./monetize');
var missionsMod = require('./missions');
var saveMod = require('./save');
var settingsMod = require('./settings');
var skillsMod = require('./skills');
var seasonboardMod = require('./seasonboard');
var accountMod = require('./account');
var historyMod = require('./history');
var skillupMod = require('./skillup');
var shopMod = require('./shop');
var ddaMod = require('./dda');
var weekeventMod = require('./weekevent');
var noticeMod = require('./notice');
var privacyMod = require('./privacy');
var rewardsMod = require('./rewards');
var recorderMod = require('./recorder');
var sidebarMod = require('./sidebar');
var shortcutMod = require('./shortcut');
var shared = require('./game/shared');
var COLORS = shared.COLORS;
var RIM_COLORS = shared.RIM_COLORS;
var SPECIAL_STYLE = shared.SPECIAL_STYLE;
var FRENZY_TOTAL = shared.FRENZY_TOTAL;
var LOSE_DELAY = shared.LOSE_DELAY;
var raf = shared.raf;
var mixin = shared.mixin;

function Game() {
  this.info = tt.getSystemInfoSync();
  this.W = this.info.windowWidth;
  this.H = this.info.windowHeight;
  this.dpr = this.info.pixelRatio || 2;
  this.canvas = tt.createCanvas();
  this.canvas.width = this.W * this.dpr;
  this.canvas.height = this.H * this.dpr;
  this.ctx = this.canvas.getContext('2d');
  this.ctx.scale(this.dpr, this.dpr);

  this.scale = this.W / 400;
  this.safeBottom = (this.info.safeArea && this.info.safeArea.bottom) || this.H;
  this.floorY = this.H - 60 * this.scale;
  this.dangerLine = 150 * this.scale;
  this.world = new physics.World(this.W, this.floorY, this.scale);

  this.particles = [];
  this._pPool = [];
  this.popups = [];
  this._popupPool = [];
  this.score = 0;
  this.classicBest = tt.getStorageSync('merge_watermelon_best') || 0;
  this.frenzyBest = tt.getStorageSync('merge_watermelon_frenzy_best') || 0;
  this.best = this.classicBest;
  this.bestKey = 'merge_watermelon_best';
  this.over = false;
  this.overAt = 0;
  this.leaderboardOpen = false;
  this.toastMsg = null;
  this.toastAt = 0;
  this.panel = null;
  this.panelRect = null;
  this.panelTabs = null;
  this.panelClose = null;
  this.themeCards = null;
  this.menuBtns = null;
  this.runCtx = null;
  this.theme = themesMod.getTheme(themesMod.getThemeId());
  this.ambient = [];
  this.initAmbient();
  this.aboveTimer = 0;
  this.started = false;
  this.mode = null;
  this.combo = 0;
  this.comboTimer = 0;
  this.comboWindow = 2;
  this.comboBonus = 0.1;

  this.level = 1;
  this.levelProgress = 0;
  this.levelDef = levelsMod.getLevelDef(1);
  this.levelTarget = this.levelDef.target;
  this.pool = this.buildPool();
  this.nextType = this.pickType();
  this.nextType2 = this.pickType();

  this.clearPause = 0;
  this.clearInfo = null;

  this.frenzyLeft = FRENZY_TOTAL;
  this.frozen = 0;
  this.multiplier = 1;
  this.multiplierCharges = 0;
  this.magnet = null;

  this.shakeTime = 0;
  this.shakeDur = 1;
  this.shakeMag = 0;
  this.time = 0;
  this.newBest = false;

  this.runMod = perksMod.DEFAULT_MOD();
  this.perkChoices = null;
  this.perksTaken = [];
  this.perkCounts = {};
  this.perkRects = null;
  this.frenzyPerkMark = 0;
  this.pendingPerk = false;
  this.coinsEarned = 0;
  this.coinsAwardedForRun = false;
  this.dailyActive = false;
  this.dailyMod = null;
  this.dailyKey = '';
  this.dailyBtns = null;
  this.weekEventActive = false;
  this.weekEventMod = null;
  this.weekEventKey = '';
  this.revivedThisRun = false;
  this.coinsDoubled = false;
  this.statBuf = { merges: 0, score: 0, specials: 0, kings: 0 };
  this.missionCards = null;

  this.audio = new audioMod.AudioManager();
  this.volume = settingsMod.getVolume();
  this.audio.setVolume(this.volume);
  this.muted = tt.getStorageSync('merge_watermelon_muted') === 1;
  this.audio.setEnabled(!this.muted);

  this.migrated = saveMod.migrate();
  this.haptics = settingsMod.isHaptics();
  this.reducedMotion = settingsMod.isReducedMotion();
  this.tutorialDone = settingsMod.isTutorialDone();
  this.highContrast = settingsMod.isHighContrast();
  this.tutorialStage = settingsMod.getTutorialStage();
  this.tutorialShown = false;
  this.energy = 0;
  this.skillBtn = null;
  this.shuffleBtn = null;
  this.meteorBtn = null;
  this.targeting = false;
  this.targetSkill = 'hammer';
  this.profileCloseOnly = null;
  this.settingRows = null;
  this.achFilter = 'all';
  this.achCat = 'all';
  this.achFilterBtns = null;
  this.achCatBtns = null;
  this.shopAdBtn = null;
  this.bonusCoins = 0;
  this.helpPage = 0;
  this.helpTabs = null;
  this.particleCap = 220;
  this.lowPerf = false;
  this._fpsAcc = 0;
  this._fpsN = 0;
  this.collectionRects = null;
  this.collectionDetail = null;
  this.noticeOpen = noticeMod.shouldShow();
  this.privacyOpen = privacyMod.needsPrompt();
  this.privacyBtns = null;
  this.lastDropAt = -Infinity;
  this.colorblind = settingsMod.isColorblind();

  this.welfareBtns = null;
  sidebarMod.init();
  shortcutMod.init();
  this.bindInput();
  this.lastTime = Date.now();
  this.loop();
}

Game.prototype.buildPool = function () {
  var maxType;
  var weights;
  if (this.mode === 'frenzy') {
    maxType = 7;
    weights = [3, 2, 1, 1, 1, 1, 1, 1];
  } else {
    var def = this.levelDef || levelsMod.getLevelDef(this.level || 1);
    maxType = def.maxType;
    weights = levelsMod.getDropWeights(def.level, def.maxType);
  }
  var pool = [];
  var t, i, w;
  for (t = 0; t <= maxType; t++) {
    w = (t < weights.length) ? weights[t] : 1;
    for (i = 0; i < w; i++) {
      pool.push(t);
    }
  }
  return pool;
};

Game.prototype.pickType = function () {
  var pool = this.pool;
  return pool[Math.floor(Math.random() * pool.length)];
};

Game.prototype.refreshLevelDef = function () {
  if (this.mode !== 'classic') {
    this.levelTarget = 300;
    this.dangerLine = 150 * this.scale;
  } else {
    this.levelDef = levelsMod.getLevelDef(this.level);
    this.levelTarget = Math.round(this.levelDef.target * ddaMod.factor().targetMult);
    this.dangerLine = this.levelDef.dangerLine * this.scale;
  }
  this.pool = this.buildPool();
};

Game.prototype.specialChance = function () {
  var base;
  if (this.mode === 'frenzy') {
    base = Math.min(0.35, 0.15 + (this.frenzyLeft / FRENZY_TOTAL) * 0.2);
  } else {
    base = this.levelDef ? this.levelDef.specialChance : levelsMod.getLevelDef(this.level || 1).specialChance;
    if (this.levelDef && this.levelDef.isBoss) base += 0.08; // Boss 关特殊球更频繁
  }
  var add = this.runMod ? this.runMod.specialChanceAdd : 0;
  return Math.max(0, Math.min(0.6, base + add + ddaMod.factor().specialAdd));
};

Game.prototype.openPanel = function (tab) {
  this.closeLeaderboard();
  this.panel = tab || 'collection';
};

Game.prototype.fruitEmoji = function (t) {
  var th = this.theme;
  if (th.fruits && th.fruits[t]) return th.fruits[t];
  return fruitData.TYPES[t].emoji;
};

Game.prototype.fruitColor = function (t) {
  var th = this.theme;
  if (th.colors && th.colors[t]) return th.colors[t];
  return COLORS[Math.min(t, COLORS.length - 1)];
};

Game.prototype.fruitRim = function (t) {
  var th = this.theme;
  if (th.rims && th.rims[t]) return th.rims[t];
  return RIM_COLORS[Math.min(t, RIM_COLORS.length - 1)];
};

Game.prototype.buildAchCtx = function () {
  return {
    runLevel: this.level,
    runMadeKing: this.runCtx ? this.runCtx.madeKing : false,
    runMaxCombo: this.runCtx ? this.runCtx.maxCombo : 0,
    runSpecials: this.runCtx ? this.runCtx.specialsUsed : {},
    runPerks: this.perksTaken ? this.perksTaken.length : 0,
    usedSpecialCount: achMod.getUsedSpecials().length,
    maxLevel: Math.max(achMod.getMaxLevel(), this.level),
    collectedCount: achMod.collectedCount(),
    mode: this.mode,
    runScore: this.score,
    dailyDone: liveopsMod.isDailyDone(liveopsMod.dayKey()),
    missionsClaimed: missionsMod.getList().filter(function (m) { return m.claimed; }).length,
    revived: !!this.revivedThisRun,
    upgradesTotal: progMod.totalLevels(),
    totalScore: missionsMod.getStat('score'),
    maxFruitCount: (function () {
      var counts = achMod.getFruitCounts();
      var max = 0;
      for (var t = 0; t < 11; t++) { var c = parseInt(counts[t], 10); if (c > max) max = c; }
      return max;
    })()
  };
};

Game.prototype.checkAchievements = function () {
  var newly = achMod.check(this.buildAchCtx());
  for (var i = 0; i < newly.length; i++) {
    var d = newly[i];
    this.pushPopup(this.W / 2, this.H * 0.3, d.icon + ' ' + d.name, 2.2, '#ffd54f', true);
    this.audio.play('star');
    this.haptic();
  }
  if (newly.length) {
    progMod.addCoins(30 * newly.length);
    this.toast('成就奖励 +🪙' + (30 * newly.length));
  }
  var totalAch = achMod.getList().length;
  if (achMod.getUnlockedCount() >= totalAch) {
    var given = false;
    try { given = tt.getStorageSync('merge_watermelon_allach_bounty') === 1; } catch (e) {}
    if (!given) {
      progMod.addCoins(1000);
      try { tt.setStorageSync('merge_watermelon_allach_bounty', 1); } catch (e) {}
      this.pushPopup(this.W / 2, this.H * 0.36, '🏆 全成就达成! +🪙1000', 2.4, '#ffd54f', true);
      this.toast('全成就达成!奖励 +🪙1000');
      this.audio.play('best');
    }
  }
  if (achMod.collectedCount() >= 11) {
    var cgiven = false;
    try { cgiven = tt.getStorageSync('merge_watermelon_collect_bounty') === 1; } catch (e) {}
    if (!cgiven) {
      progMod.addCoins(500);
      try { tt.setStorageSync('merge_watermelon_collect_bounty', 1); } catch (e) {}
      this.toast('图鉴集齐!奖励 +🪙500');
      this.audio.play('best');
    }
  }
};

Game.prototype.specialKinds = function () {
  var kinds = [];
  if (this.mode === 'frenzy') {
    return ['bomb', 'bomb', 'ice', 'ice', 'star', 'star', 'magnet', 'magnet'];
  }
  if (this.level >= 1) kinds.push('bomb', 'bomb', 'bomb', 'bomb');
  if (this.level >= 2) kinds.push('ice', 'ice', 'ice');
  if (this.level >= 3) kinds.push('star', 'star');
  if (this.level >= 4) kinds.push('magnet', 'magnet');
  var rule = this.levelDef && this.levelDef.stage && this.levelDef.stage.rule;
  if (rule === 'bigbomb') kinds.push('bomb', 'bomb', 'bomb', 'bomb');
  else if (rule === 'magnet') kinds.push('magnet', 'magnet', 'magnet', 'magnet');
  return kinds.length ? kinds : ['bomb'];
};

Game.prototype.spawnSpecial = function (x) {
  var kinds = this.specialKinds();
  var kind = kinds[Math.floor(Math.random() * kinds.length)];
  var f = this.world.spawnSpecial(kind, x, 50 * this.scale);
  f.vy = 40;
};

Game.prototype.toggleMute = function () {
  this.muted = !this.muted;
  this.audio.setEnabled(!this.muted);
  tt.setStorageSync('merge_watermelon_muted', this.muted ? 1 : 0);
};

Game.prototype.quitGame = function () {
  var self = this;
  try {
    tt.exitMiniProgram({
      fail: function () {
        self.toast('请在右上角「⋯」菜单退出');
      }
    });
  } catch (e) {
    this.toast('请在右上角「⋯」菜单退出');
  }
};

Game.prototype.startClassic = function () {
  this.mode = 'classic';
  this.bestKey = 'merge_watermelon_best';
  this.best = this.classicBest;
  this.started = true;
  this.resetRun();
};

Game.prototype.startFrenzy = function () {
  this.mode = 'frenzy';
  this.bestKey = 'merge_watermelon_frenzy_best';
  this.best = this.frenzyBest;
  this.started = true;
  this.resetRun();
};

Game.prototype.restart = function () {
  this.resetRun();
};

Game.prototype.toMenu = function () {
  recorderMod.stop();
  this.mode = null;
  this.started = false;
  this.over = false;
  this.overAt = 0;
  this.world.reset(this.W, this.floorY, this.scale);
  this.particles = [];
  this.clearPopups();
  this.frozen = 0;
  this.clearPause = 0;
  this.clearInfo = null;
  this.paused = false;
  this.pauseBtns = null;
  this.multiplier = 1;
  this.multiplierCharges = 0;
  this.magnet = null;
  this.perkChoices = null;
  this.perkRects = null;
  this.pendingPerk = false;
  this.targeting = false;
  this.dailyActive = false;
  this.dailyMod = null;
  this.dailyBtns = null;
  this.weekEventActive = false;
  this.weekEventMod = null;
  this.best = this.classicBest;
  this.bestKey = 'merge_watermelon_best';
};

Game.prototype.initAmbient = function () {
  this.ambient = [];
  var spec = this.theme.ambient || [];
  var i, j, s, n;
  for (i = 0; i < spec.length; i++) {
    s = spec[i];
    n = s.n || 6;
    for (j = 0; j < n; j++) {
      this.ambient.push({
        e: s.e,
        x: Math.random() * this.W,
        y: Math.random() * this.H,
        r: (s.r || 14) + Math.random() * (s.rv || 6),
        vy: -(s.spd || 18) * (0.6 + Math.random() * 0.8),
        sway: (s.sway || 10) * (0.5 + Math.random()),
        ph: Math.random() * Math.PI * 2,
        alpha: 0.2 + Math.random() * 0.3
      });
    }
  }
};

Game.prototype.updateAmbient = function (dt) {
  var i, a;
  for (i = 0; i < this.ambient.length; i++) {
    a = this.ambient[i];
    a.y += a.vy * dt;
    a.x += Math.sin(this.time * 1.2 + a.ph) * a.sway * dt;
    if (a.y < -30) {
      a.y = this.H + 30;
      a.x = Math.random() * this.W;
    }
  }
};

Game.prototype.toast = function (msg) {
  this.toastMsg = msg;
  this.toastAt = Date.now();
};

Game.prototype.openLeaderboard = function (score) {
  if (this.leaderboardOpen) return;
  if (!privacyMod.isAgreed()) {
    this.privacyOpen = true;
    return;
  }
  this.panel = null;
  var cssW = Math.min(340, this.W - 24) * this.scale;
  var cssH = 470 * this.scale;
  var cssX = (this.info.windowWidth - cssW) / 2;
  var cssY = (this.info.windowHeight - cssH) / 2;
  if (leaderboardMod.show(score, cssX, cssY, cssW, cssH, this.dpr)) {
    this.leaderboardOpen = true;
  } else {
    this.panel = 'records';
  }
};

Game.prototype.closeLeaderboard = function () {
  if (!this.leaderboardOpen) return;
  this.leaderboardOpen = false;
  leaderboardMod.hide();
};

Game.prototype.resetRun = function () {
  this.world.reset(this.W, this.floorY, this.scale);
  this.runCtx = { madeKing: false, maxCombo: 0, specialsUsed: {}, perks: 0 };
  this.particles = [];
  this.clearPopups();
  this.score = 0;
  this.over = false;
  this.overAt = 0;
  this.aboveTimer = 0;
  this.combo = 0;
  this.comboTimer = 0;
  this.level = 1;
  this.levelProgress = 0;
  this.refreshLevelDef();
  this.nextType = this.pickType();
  this.nextType2 = this.pickType();
  this.frenzyLeft = FRENZY_TOTAL;
  this.frozen = 0;
  this.clearPause = 0;
  this.clearInfo = null;
  this.paused = false;
  this.pauseBtns = null;
  this.lastDropAt = -Infinity;
  this.multiplier = 1;
  this.multiplierCharges = 0;
  this.magnet = null;
  this.shakeTime = 0;
  this.runMod = perksMod.DEFAULT_MOD();
  this.perkChoices = null;
  this.perksTaken = [];
  this.perkCounts = {};
  this.perkRects = null;
  this.coinsAwardedForRun = false;
  progMod.applyTo(this.runMod);
  if (this.dailyActive && this.dailyMod) this.applyModDeltas(this.runMod, this.dailyMod);
  if (this.weekEventActive && this.weekEventMod) this.applyModDeltas(this.runMod, this.weekEventMod);
  if (this.mode === 'frenzy') {
    this.comboWindow = 1.5 + this.runMod.comboWindowAdd;
    this.comboBonus = 0.15 + this.runMod.comboBonusAdd;
  } else {
    this.comboWindow = 2 + this.runMod.comboWindowAdd;
    this.comboBonus = 0.1 + this.runMod.comboBonusAdd;
  }
  this.frenzyPerkMark = this.mode === 'frenzy' ? 45 : 0;
  this.pendingPerk = false;
  this.revivedThisRun = false;
  this.coinsDoubled = false;
  this.statBuf = { merges: 0, score: 0, specials: 0, kings: 0 };
  this.missionCards = null;
  this.energy = 0;
  this.skillBtn = null;
  this.shuffleBtn = null;
  this.meteorBtn = null;
  this.targeting = false;
  this.targetSkill = 'hammer';
  this.tutorialTip = !this.tutorialDone;
  this.graceDrops = this.tutorialDone ? 0 : 3;
  if (ddaMod.loseStreak() >= 2) {
    this.energy = skillsMod.ENERGY_MAX;
    this.toast('连败保护:本局免费技能已就绪');
  } else {
    this.energy = 0;
  }
  this.bonusCoins = 0;
  this.applyStartItems();
  recorderMod.start();
  missionsMod.addStat('plays', 1);
};

Game.prototype.endGame = function () {
  this.over = true;
  this.overAt = Date.now();
  recorderMod.stop();
  var newBest = false;
  if (this.score > this.best) {
    this.best = this.score;
    newBest = true;
    tt.setStorageSync(this.bestKey, this.best);
    if (this.mode === 'classic') {
      this.classicBest = this.best;
    } else {
      this.frenzyBest = this.best;
    }
  }
  shareMod.submitScore(this.score);
  this.newBest = newBest;
  achMod.setMaxLevel(Math.max(achMod.getMaxLevel(), this.level));
  if (this.runCtx) achMod.setMaxCombo(Math.max(achMod.getMaxCombo(), this.runCtx.maxCombo));
  if (!this.coinsAwardedForRun) {
    this.coinsEarned = progMod.coinsForRun(this.score, this.level, this.perksTaken.length) + this.bonusCoins;
    this.firstRunBonus = rewardsMod.takeFirstRunOfDay();
    if (this.firstRunBonus) this.coinsEarned *= 2;
    progMod.addCoins(this.coinsEarned);
    this.coinsAwardedForRun = true;
    seasonboardMod.record(this.mode, this.score);
    accountMod.addXp(accountMod.xpForRun(this.score, this.level, this.perksTaken.length));
    historyMod.record(this.mode, this.score);
    ddaMod.record(this.score, this.level);
    if (this.dailyActive) this.checkDailySuccess();
    if (this.weekEventActive) this.checkWeekEventSuccess();
  }
  if (this.statBuf) {
    missionsMod.addStat('merges', this.statBuf.merges);
    missionsMod.addStat('score', this.statBuf.score);
    missionsMod.addStat('specials', this.statBuf.specials);
    missionsMod.addStat('kings', this.statBuf.kings);
    this.statBuf = { merges: 0, score: 0, specials: 0, kings: 0 };
  }
  this.checkDailySuccess();
  this.checkAchievements();
  this.audio.play(newBest ? 'best' : 'gameover');
  this.haptic();
  if (this.firstRunBonus) {
    this.toast('🌅 今日首局 金币×2:+🪙' + this.coinsEarned);
    this.firstRunBonus = false;
  }
  monetizeMod.onGameOver({ lifetimeRuns: missionsMod.getStat('plays') });
};

Game.prototype.shareRun = function () {
  var modeName = this.mode === 'frenzy' ? '限时狂热' : '经典闯关';
  if (recorderMod.hasVideo()) {
    var self = this;
    // reason === 'fail' 多为玩家取消,不再改走图片分享
    recorderMod.share('我在「瓜王争霸」' + modeName + '打了 ' + (Math.floor(this.score) || 0) + ' 分,来挑战!', function (ok, reason) {
      if (ok || reason === 'fail') return;
      self.toast('录屏分享失败,已改为图片分享');
      shareMod.shareResult(self.score, self.best, modeName, '');
    });
    return;
  }
  shareMod.shareResult(this.score, this.best, modeName, '成就 ' + achMod.getUnlockedCount() + '/' + achMod.getList().length);
};

Game.prototype.onDiscover = function (type, x, y) {
  var coins = rewardsMod.discoverCoins(type);
  progMod.addCoins(coins);
  this.pushPopup(x, y, '🆕 新水果 ' + this.fruitEmoji(type) + ' +🪙' + coins, 1.6, '#81c784');
};

Game.prototype.haptic = function () {
  if (!this.haptics) return;
  try { tt.vibrateShort({}); } catch (e) {}
};

Game.prototype.shake = function (dur, mag) {
  if (this.reducedMotion) return;
  this.shakeDur = dur;
  this.shakeMag = mag;
  this.shakeTime = dur;
};

Game.prototype.loop = function () {
  var now = Date.now();
  var dt = Math.min((now - this.lastTime) / 1000, 0.05);
  this.lastTime = now;
  recorderMod.sync(this.started && !this.over && !this.paused, dt);
  if (!this.over) {
    this.update(dt);
  }
  try {
    this.render();
  } catch (e) {
    this.lastRenderErr = String(e);
  }
  var self = this;
  raf(function () { self.loop(); });
};

Game.prototype.update = function (dt) {
  this.time += dt;
  this._fpsAcc += dt;
  this._fpsN += 1;
  if (this._fpsN >= 30) {
    var avg = this._fpsAcc / this._fpsN;
    this.lowPerf = avg > 0.033;
    this.particleCap = this.lowPerf ? 120 : 220;
    this._fpsAcc = 0;
    this._fpsN = 0;
  }
  this.updateAmbient(dt);
  if (this.perkChoices) return;
  if (this.clearPause > 0) {
    this.clearPause -= dt;
    this.updateFx(dt);
    if (this.shakeTime > 0) this.shakeTime -= dt;
    if (this.clearPause <= 0) {
      this.clearPause = 0;
      this.clearInfo = null;
      this.maybeOpenPendingPerk();
    }
    return;
  }
  if (this.paused) return;
  if (this.frozen > 0) {
    this.frozen -= dt;
    if (this.frozen <= 0) {
      this.frozen = 0;
      this.world.thawAll();
      this.burst(this.W / 2, this.H * 0.3, 0);
      this.audio.play('merge');
    }
  }
  this.world.step(dt);
  this.decayPops(dt);
  this.handleEvents();
  if (this.frozen <= 0) {
    this.updateSpecials(dt);
    this.applyMagnet(dt);
  }
  if (this.mode === 'frenzy' && this.frozen <= 0) {
    this.frenzyLeft -= dt;
    if (this.frenzyLeft <= 0) {
      this.frenzyLeft = 0;
      this.endGame();
    } else if (this.frenzyPerkMark > 0 && this.frenzyLeft <= this.frenzyPerkMark && this.frenzyLeft > this.frenzyPerkMark - 15) {
      this.frenzyPerkMark -= 15;
      this.openPerkDraft();
    }
  }
  this.updateFx(dt);
  if (this.shakeTime > 0) {
    this.shakeTime -= dt;
  }
  if (this.comboTimer > 0) {
    this.comboTimer -= dt;
    if (this.comboTimer <= 0) {
      this.combo = 0;
      this.comboTimer = 0;
    }
  }
  if (this.frozen <= 0 && this.graceDrops <= 0 && this.world.anyAbove(this.dangerLine)) {
    this.aboveTimer += dt;
    if (this.aboveTimer > LOSE_DELAY + (this.runMod ? this.runMod.dangerThresholdAdd : 0)) {
      this.endGame();
    }
  } else if (this.frozen <= 0) {
    this.aboveTimer = 0;
  }
};

Game.prototype.pushPopup = function (x, y, text, ttl, color, big) {
  var p = this._popupPool.length ? this._popupPool.pop() : {};
  p.x = x;
  p.y = y;
  p.text = text;
  p.life = 0;
  p.ttl = ttl;
  p.color = color || '';
  p.big = !!big;
  this.popups.push(p);
};

Game.prototype.clearPopups = function () {
  var list = this.popups;
  var pool = this._popupPool;
  for (var i = 0; i < list.length; i++) {
    if (pool.length < 64) pool.push(list[i]);
  }
  list.length = 0;
};

Game.prototype.decayPops = function (dt) {
  var list = this.world.fruits;
  var step = dt / physics.POP_TIME;
  for (var i = 0; i < list.length; i++) {
    var f = list[i];
    if (f.pop > 0) f.pop = Math.max(0, f.pop - step);
    if (f.squash > 0) f.squash = Math.max(0, f.squash - step);
  }
};

Game.prototype.handleEvents = function () {
  var evts = this.world.consumeEvents();
  var i, e, base, gained;
  for (i = 0; i < evts.length; i++) {
    e = evts[i];
    if (e.type === 'spike') {
      this.burst(e.x, e.y, e.oldType || 0);
      this.pushPopup(e.x, e.y - 16, '🌵 刺破!', 0.8);
      this.audio.play('boom');
      continue;
    }
    if (e.type !== 'merge') continue;
    if (this.comboTimer > 0) {
      this.combo += 1;
    } else {
      this.combo = 1;
    }
    this.comboTimer = this.comboWindow;
    if (this.combo > this.runCtx.maxCombo) this.runCtx.maxCombo = this.combo;
    var comboCoins = rewardsMod.comboCoins(this.combo);
    if (comboCoins) {
      this.bonusCoins += comboCoins;
      this.pushPopup(e.x, e.y - 44, '🔥 连击 ' + this.combo + ' +🪙' + comboCoins, 1.1, '#ffb74d');
    }
    if (achMod.markCollected(e.newType)) this.onDiscover(e.newType, e.x, e.y - 64);
    achMod.addFruitCount(e.newType);
    if (e.newType >= 10) this.runCtx.madeKing = true;
    this.energy = skillsMod.clampEnergy(this.energy + skillsMod.energyGain(e.newType) + skillupMod.energyBonus());
    base = fruitData.TYPES[e.newType].score;
    gained = Math.round(base * (1 + (this.combo - 1) * this.comboBonus) * this.multiplier * (this.runMod ? this.runMod.scoreMult : 1));
    this.score += gained;
    this.levelProgress += gained;
    if (this.combo === 5 || this.combo === 10 || this.combo === 15 || this.combo === 20) {
      var cb = this.combo * 10;
      this.score += cb;
      this.levelProgress += cb;
      this.pushPopup(e.x, e.y - 44, '🔥 连击 x' + this.combo + ' +' + cb, 1.2, '#ff7043', true);
      this.audio.play('big');
    }
    if (this.tutorialStage === 1) {
      this.tutorialStage = 2;
      settingsMod.setTutorialStage(2);
      this.toast('合成成功!相同水果贴在一起就会升级');
    }
    if (this.statBuf) {
      this.statBuf.merges += 1;
      this.statBuf.score += gained;
      if (e.newType >= 10) this.statBuf.kings += 1;
    }
    if (this.multiplierCharges > 0) {
      this.multiplierCharges -= 1;
      if (this.multiplierCharges <= 0) {
        this.multiplierCharges = 0;
        this.multiplier = 1;
      }
    }
    this.burst(e.x, e.y, e.newType);
    this.pushPopup(e.x, e.y - 20, '+' + gained + (this.combo >= 3 ? ' x' + this.combo : ''), 0.8);
    if (e.newType >= 9) {
      this.audio.play('big');
    } else {
      this.audio.play('merge');
    }
    this.haptic();
  }
  if (evts.length) this.checkAchievements();
  if (this.mode === 'classic') {
    this.levelClearCheck();
  }
};

Game.prototype.updateSpecials = function (dt) {
  var list = this.world.fruits;
  for (var i = 0; i < list.length; i++) {
    var f = list[i];
    if (f.dead || f.iced || !SPECIAL_STYLE[f.kind]) continue;
    if (!f.armed) {
      if (Math.abs(f.vx) < 30 && f.vy > -30 && f.vy < 30) f.armed = true;
      else continue;
    }
    f.fuse -= dt;
    if (f.fuse > 0) continue;
    if (f.kind === 'bomb') {
      this.explode(f);
    } else if (f.kind === 'ice') {
      this.activateIce(f);
    } else if (f.kind === 'star') {
      this.activateStar(f);
    } else if (f.kind === 'magnet') {
      this.activateMagnet(f);
    }
  }
};

Game.prototype.explode = function (f) {
  f.dead = true;
  achMod.markSpecialUsed('bomb');
  if (this.runCtx) this.runCtx.specialsUsed.bomb = true;
  if (this.statBuf) this.statBuf.specials += 1;
  var R = 82 * this.scale * (this.runMod ? this.runMod.bombRadiusMult : 1);
  var list = this.world.fruits;
  var i, g, dx, dy, gained;
  for (i = 0; i < list.length; i++) {
    g = list[i];
    if (g.dead || g === f) continue;
    dx = g.x - f.x;
    dy = g.y - f.y;
    if (dx * dx + dy * dy > R * R) continue;
    gained = Math.round(fruitData.TYPES[g.type].score * 2 * this.multiplier * (this.runMod ? this.runMod.scoreMult : 1));
    this.score += gained;
    this.levelProgress += gained;
    this.burst(g.x, g.y, g.type);
    this.pushPopup(g.x, g.y, '+' + gained, 0.8);
    g.dead = true;
  }
  for (i = 0; i < 40; i++) {
    var ang = Math.random() * Math.PI * 2;
    var sp = 80 + Math.random() * 260;
    this.addParticle(f.x, f.y, Math.cos(ang) * sp, Math.sin(ang) * sp - 80, 3 + Math.random() * 5, (i % 2) ? '#ffab91' : '#ff7043', 0.4 + Math.random() * 0.4);
  }
  this.audio.play('boom');
  this.shake(0.5, 8);
  this.haptic();
  this.checkAchievements();
  if (this.mode === 'classic') {
    this.levelClearCheck();
  }
};

Game.prototype.activateIce = function (f) {
  f.dead = true;
  achMod.markSpecialUsed('ice');
  if (this.runCtx) this.runCtx.specialsUsed.ice = true;
  if (this.statBuf) this.statBuf.specials += 1;
  this.frozen = 2.2 + (this.runMod ? this.runMod.freezeTimeAdd : 0);
  this.world.freezeAll();
  this.audio.play('ice');
  this.shake(0.3, 4);
  this.pushPopup(f.x, f.y - 20, '❄ 冻结!', 1);
  this.haptic();
  this.checkAchievements();
};

Game.prototype.activateStar = function (f) {
  f.dead = true;
  achMod.markSpecialUsed('star');
  if (this.runCtx) this.runCtx.specialsUsed.star = true;
  if (this.statBuf) this.statBuf.specials += 1;
  this.multiplier = 2;
  this.multiplierCharges = 6 + (this.runMod ? this.runMod.starChargesAdd : 0);
  this.audio.play('star');
  this.pushPopup(f.x, f.y - 20, '⭐ 双倍 x' + this.multiplierCharges, 1);
  this.haptic();
  this.checkAchievements();
};

Game.prototype.activateMagnet = function (f) {
  this.magnet = { x: f.x, y: f.y, time: 1.2 + (this.runMod ? this.runMod.magnetTimeAdd : 0) };
  f.dead = true;
  achMod.markSpecialUsed('magnet');
  if (this.runCtx) this.runCtx.specialsUsed.magnet = true;
  if (this.statBuf) this.statBuf.specials += 1;
  this.audio.play('magnet');
  this.pushPopup(f.x, f.y - 20, '🧲 磁吸!', 1);
  this.haptic();
  this.checkAchievements();
};

Game.prototype.applyMagnet = function (dt) {
  if (!this.magnet) return;
  this.magnet.time -= dt;
  if (this.magnet.time <= 0) {
    this.magnet = null;
    return;
  }
  var list = this.world.fruits;
  var strength = 520;
  for (var i = 0; i < list.length; i++) {
    var g = list[i];
    if (g.dead) continue;
    var dx = this.magnet.x - g.x;
    var dy = this.magnet.y - g.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1) continue;
    g.vx += (dx / d) * strength * dt;
    g.vy += (dy / d) * strength * dt;
  }
};

Game.prototype.levelClearCheck = function () {
  if (this.levelProgress < this.levelTarget) return;
  var oldDef = this.levelDef || levelsMod.getLevelDef(this.level);
  var bonus = oldDef.bonus;
  var wasStage = oldDef.stage.idx;
  var clearedLevel = this.level;
  this.score += bonus;
  this.levelProgress = 0;
  this.level += 1;
  achMod.setMaxLevel(Math.max(achMod.getMaxLevel(), this.level));
  missionsMod.addStat('levels', 1);
  var firstCoins = this.mode === 'classic' ? rewardsMod.firstClear(clearedLevel) : 0;
  if (firstCoins) {
    progMod.addCoins(firstCoins);
    this.pushPopup(this.W / 2, this.H * 0.38, '🎯 首通奖励 +🪙' + firstCoins, 1.6, '#ffd54f');
  }
  if ((this.level - 1) % 5 === 0) this.pendingPerk = true;
  if (this.dailyActive) this.checkDailySuccess();
  this.refreshLevelDef();
  var newDef = this.levelDef;
  var list = this.world.fruits;
  for (var i = 0; i < list.length; i++) {
    var g = list[i];
    if (g.dead) continue;
    this.burst(g.x, g.y, g.type);
    g.dead = true;
  }
  this.audio.play('clear');
  this.shake(0.6, 9);
  this.pushPopup(this.W / 2, this.H * 0.32, '第 ' + this.level + ' 关! +' + bonus, 1.4);
  this.clearInfo = { level: clearedLevel, nextLevel: this.level, bonus: bonus, duration: 1.4 };
  this.clearPause = 1.4;
  if (newDef.stage.idx !== wasStage) {
    this.pushPopup(this.W / 2, this.H * 0.5, '✦ 第 ' + (newDef.stage.idx + 1) + ' 章「' + newDef.stage.name + '」', 1.8, '#ffd54f', true);
    if (newDef.stage.rule) {
      this.pushPopup(this.W / 2, this.H * 0.58, newDef.stage.sub, 1.8, '#ffe082');
    }
    this.audio.play('best');
    this.spawnObstacles(newDef.stage.idx);
  }
  if (newDef.maxType > oldDef.maxType) {
    this.toast('掉落池扩充,新水果登场!');
  }
  if (newDef.isBoss) {
    this.pushPopup(this.W / 2, this.H * 0.46, '⚔️ 第 ' + this.level + ' 关 Boss!', 1.4, '#e53935', true);
    this.audio.play('best');
    this.spawnPad();
  }
  if (clearedLevel % 10 === 0) {
    this.pushPopup(this.W / 2, this.H * 0.42, '⚔️ Boss 关通过!', 1.6, '#e53935', true);
    this.audio.play('best');
  }
  this.haptic();
  this.checkAchievements();
};

Game.prototype.burst = function (x, y, type) {
  var color = this.fruitColor(type);
  for (var i = 0; i < 10; i++) {
    var angle = Math.random() * Math.PI * 2;
    var speed = 60 + Math.random() * 180;
    this.addParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - 60, 3 + Math.random() * 4, color, 0.5 + Math.random() * 0.3);
  }
};

Game.prototype.addParticle = function (x, y, vx, vy, r, color, ttl) {
  if (this.particles.length >= this.particleCap) return;
  var p = this._pPool.length ? this._pPool.pop() : {};
  p.x = x;
  p.y = y;
  p.vx = vx;
  p.vy = vy;
  p.r = r;
  p.color = color;
  p.life = 0;
  p.ttl = ttl;
  this.particles.push(p);
};

Game.prototype.updateFx = function (dt) {
  var i;
  for (i = this.particles.length - 1; i >= 0; i--) {
    var p = this.particles[i];
    p.life += dt;
    if (p.life >= p.ttl) {
      this.particles.splice(i, 1);
      if (this._pPool.length < 300) this._pPool.push(p);
      continue;
    }
    p.vy += 500 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  for (i = this.popups.length - 1; i >= 0; i--) {
    var pp = this.popups[i];
    pp.life += dt;
    if (pp.life >= pp.ttl) {
      this.popups.splice(i, 1);
      if (this._popupPool.length < 64) this._popupPool.push(pp);
      continue;
    }
    pp.y -= 40 * dt;
  }
};

Game.prototype.maybeOpenPendingPerk = function () {
  if (this.pendingPerk) {
    this.pendingPerk = false;
    this.openPerkDraft();
  }
};

Game.prototype.openPerkDraft = function () {
  if (this.perkChoices) return;
  var choices = perksMod.rollEligible(this.perkCounts, 3);
  if (!choices.length) return;
  this.perkChoices = choices;
  this.perkRects = null;
  this.audio.play('star');
};

Game.prototype.applyPerk = function (perk) {
  if (!perk) return;
  this.perksTaken.push(perk.id);
  this.perkCounts[perk.id] = (this.perkCounts[perk.id] || 0) + 1;
  if (this.runCtx) this.runCtx.perks = (this.runCtx.perks || 0) + 1;
  perksMod.apply(this.runMod, perk);
  var baseW = this.mode === 'frenzy' ? 1.5 : 2;
  var baseB = this.mode === 'frenzy' ? 0.15 : 0.1;
  this.comboWindow = baseW + this.runMod.comboWindowAdd;
  this.comboBonus = baseB + this.runMod.comboBonusAdd;
  if (perk.instant) this.score += perk.instant;
  if (perk.mods && perk.mods.starChargesAdd && this.multiplierCharges > 0) {
    this.multiplierCharges += perk.mods.starChargesAdd;
  }
  this.perkChoices = null;
  this.perkRects = null;
  this.toast('获得天赋:' + perk.icon + perk.name);
  this.pushPopup(this.W / 2, this.H * 0.32, perk.icon + ' ' + perk.name, 1.6, '#ffd54f', true);
  this.audio.play('star');
  this.checkAchievements();
};

Game.prototype.perkLayout = function () {
  var n = this.perkChoices ? this.perkChoices.length : 0;
  var rects = [];
  if (n === 0) return rects;
  var cw = this.W - 56;
  var ch = 74;
  var gap = 12;
  var total = n * ch + (n - 1) * gap;
  var y0 = Math.max(150, (this.H - total) / 2 + 24);
  var i, r;
  for (i = 0; i < n; i++) {
    r = { x: 28, y: y0 + i * (ch + gap), w: cw, h: ch, perk: this.perkChoices[i] };
    rects.push(r);
  }
  return rects;
};

Game.prototype.applyModDeltas = function (mod, d) {
  if (!d) return mod;
  for (var k in d) {
    if (!Object.prototype.hasOwnProperty.call(d, k)) continue;
    if (k === 'scoreMult') mod.scoreMult *= d[k];
    else if (typeof mod[k] === 'number') mod[k] += d[k];
  }
  return mod;
};

Game.prototype.startDaily = function () {
  var ch = liveopsMod.getDaily();
  this.dailyActive = true;
  this.dailyMod = ch.mod || {};
  this.dailyKey = ch.key;
  this.panel = null;
  if (ch.mode === 'frenzy') this.startFrenzy(); else this.startClassic();
  this.toast('每日挑战:' + ch.name);
};

Game.prototype.checkDailySuccess = function () {
  if (!this.dailyActive) return;
  var ch = liveopsMod.getDaily(this.dailyKey);
  var ok = ch.mode === 'frenzy' ? (this.score >= ch.targetScore) : (this.level >= ch.targetLevel);
  if (ok && !liveopsMod.isDailyDone(this.dailyKey)) {
    liveopsMod.markDailySuccess(this.dailyKey);
    this.toast('✅ 每日挑战完成!去「每日」领奖');
    this.audio.play('best');
  }
};

Game.prototype.requestRevive = function () {
  if (this.revivedThisRun) {
    this.toast('本局已使用过复活');
    return;
  }
  if (shopMod.consume('revive')) {
    this.revive();
    this.toast('💗 已使用复活卡,继续战斗');
    return;
  }
  var self = this;
  var shown = monetizeMod.showReward('revive', function (ok) {
    if (ok) {
      self.revive();
    } else {
      self.toast('未完成观看,复活未生效');
    }
  });
  if (!shown) this.toast('广告暂不可用(真机/开通广告位后可用)');
};

Game.prototype.revive = function () {
  recorderMod.start();
  this.revivedThisRun = true;
  this.over = false;
  this.overAt = 0;
  this.aboveTimer = 0;
  var list = this.world.fruits;
  for (var i = 0; i < list.length; i++) {
    var f = list[i];
    if (!f.dead && f.y - f.r < this.dangerLine) {
      f.dead = true;
      this.burst(f.x, f.y, f.type);
    }
  }
  if (this.mode === 'frenzy') {
    this.frenzyLeft = Math.max(this.frenzyLeft, 15);
  }
  this.toast('✅ 复活成功!继续战斗');
  this.audio.play('star');
  this.haptic();
};

Game.prototype.requestDoubleCoins = function () {
  if (this.coinsDoubled) {
    this.toast('本局金币已翻倍');
    return;
  }
  var self = this;
  var shown = monetizeMod.showReward('double_coins', function (ok) {
    if (ok) {
      progMod.addCoins(self.coinsEarned);
      self.coinsDoubled = true;
      self.toast('金币 ×2! +🪙' + self.coinsEarned);
      self.audio.play('best');
    } else {
      self.toast('未完成观看,金币未翻倍');
    }
  });
  if (!shown) this.toast('广告暂不可用(真机/开通广告位后可用)');
};

Game.prototype.completeTutorial = function () {
  if (!this.tutorialTip) return;
  this.tutorialTip = false;
  this.tutorialDone = true;
  this.tutorialStage = 1;
  settingsMod.markTutorialDone();
  settingsMod.setTutorialStage(1);
  this.toast('教程完成!相同水果接触即合成');
};

Game.prototype.useSkill = function (skillId, x, y) {
  if (!skillsMod.canCast(this.energy)) return;
  var list = this.world.fruits;
  var i, f;
  var gained;
  if (skillId === 'meteor') {
    var R = (skillsMod.METEOR_RADIUS + skillupMod.meteorRadiusBonus()) * this.scale;
    var tx = (typeof x === 'number') ? x : this.W / 2;
    var ty = (typeof y === 'number') ? y : this.H / 2;
    var hitCount = 0;
    gained = 0;
    for (i = 0; i < list.length; i++) {
      f = list[i];
      if (f.dead) continue;
      var dx = f.x - tx;
      var dy = f.y - ty;
      if (dx * dx + dy * dy > R * R) continue;
      f.dead = true;
      hitCount += 1;
      var g = Math.round(12 * (this.runMod ? this.runMod.scoreMult : 1));
      gained += g;
      this.burst(f.x, f.y, f.type);
    }
    this.score += gained;
    this.levelProgress += gained;
    this.energy = 0;
    this.skillBtn = null;
    this.shuffleBtn = null;
    this.meteorBtn = null;
    this.targeting = false;
    this.pushPopup(tx, ty - 20, '☄️ 陨石! 清除 ' + hitCount, 1.2, '#ff7043', true);
    this.audio.play('boom');
    this.shake(0.4, 7);
    this.haptic();
    this.toast(hitCount ? '陨石命中!' : '陨石落空');
    return;
  }
  // hammer(默认)
  var best = null;
  var bestScore = Infinity;
  var targeted = (typeof x === 'number' && typeof y === 'number');
  for (i = 0; i < list.length; i++) {
    f = list[i];
    if (f.dead || f.iced) continue;
    var sc;
    if (targeted) {
      var hdx = f.x - x;
      var hdy = f.y - y;
      sc = hdx * hdx + hdy * hdy;
    } else {
      sc = f.y - f.r;
    }
    if (sc < bestScore) { bestScore = sc; best = f; }
  }
  if (!best) return;
  best.dead = true;
  this.burst(best.x, best.y, best.type);
  gained = Math.round((20 + skillupMod.hammerBonus()) * (this.runMod ? this.runMod.scoreMult : 1));
  this.score += gained;
  this.levelProgress += gained;
  this.energy = 0;
  this.skillBtn = null;
  this.shuffleBtn = null;
  this.meteorBtn = null;
  this.targeting = false;
  this.pushPopup(best.x, best.y - 20, '🔨 重锤! +' + gained, 1);
  this.audio.play('boom');
  this.shake(0.3, 5);
  this.haptic();
  this.toast('重锤出击!');
};

Game.prototype.useShuffle = function () {
  if (!skillsMod.canCast(this.energy)) return;
  if (!skillsMod.unlocked('shuffle', accountMod.getState().level)) return;
  var list = this.world.fruits;
  var moved = 0;
  for (var i = 0; i < list.length; i++) {
    var f = list[i];
    if (f.dead || f.iced || f.kind !== 'fruit') continue;
    f.vx += (Math.random() - 0.5) * 2 * (skillsMod.SHUFFLE_STRENGTH + skillupMod.shuffleBonus());
    moved += 1;
  }
  this.energy = 0;
  this.skillBtn = null;
  this.shuffleBtn = null;
  this.meteorBtn = null;
  this.targeting = false;
  this.pushPopup(this.W / 2, this.H * 0.4, '🪄 洗牌!', 1.2, '#b388ff', true);
  this.audio.play('magnet');
  this.shake(0.3, 5);
  this.haptic();
  this.toast(moved ? '洗牌成功!' : '场上无可洗水果');
};

Game.prototype.spawnObstacles = function (chapterIdx) {
  var stage = levelsMod.STAGES[chapterIdx] || {};
  var rule = stage.rule;
  var count = 1 + (chapterIdx % 2);
  if (rule === 'dense' || rule === 'spike') count += 2;
  for (var i = 0; i < count; i++) {
    var x = 80 * this.scale + Math.random() * (this.W - 160 * this.scale);
    var y = this.floorY - (110 + Math.random() * 70) * this.scale;
    this.world.spawnBlock(x, y, 26);
  }
  this.toast('🧱 障碍方块登场!用重锤/炸弹清除');
  if (chapterIdx >= 3) {
    var bx = 100 * this.scale + Math.random() * (this.W - 200 * this.scale);
    this.world.spawnBelt(bx, this.floorY - 34 * this.scale, 30, Math.random() < 0.5 ? -1 : 1);
    this.toast('➡️ 传送带登场!');
  }
  if (rule === 'magnet') {
    var bx2 = 100 * this.scale + Math.random() * (this.W - 200 * this.scale);
    this.world.spawnBelt(bx2, this.floorY - 90 * this.scale, 30, Math.random() < 0.5 ? -1 : 1);
  }
  if (chapterIdx >= 5) {
    var sx = 90 * this.scale + Math.random() * (this.W - 180 * this.scale);
    this.world.spawnSpike(sx, this.floorY - 30 * this.scale, 26);
    this.toast('🌵 毒刺登场!小心水果被刺破');
  }
  if (rule === 'spike') {
    var sx2 = 90 * this.scale + Math.random() * (this.W - 180 * this.scale);
    this.world.spawnSpike(sx2, this.floorY - 80 * this.scale, 26);
  }
};

Game.prototype.spawnPad = function () {
  var x = 100 * this.scale + Math.random() * (this.W - 200 * this.scale);
  var y = this.floorY - 60 * this.scale;
  this.world.spawnPad(x, y, 30);
  this.toast('🟫 弹床登场!水果会被弹起');
};

// 开局自动使用背包里的道具(每种一个)
Game.prototype.applyStartItems = function () {
  var used = [];
  if (shopMod.consume('energy')) {
    this.energy = skillsMod.ENERGY_MAX;
    used.push('⚡满能量');
  }
  if (shopMod.consume('shield')) {
    this.runMod.dangerThresholdAdd += shopMod.SHIELD_SECONDS;
    used.push('🛡️护盾');
  }
  if (used.length) this.toast('已使用道具:' + used.join(' '));
};

Game.prototype.startWeekEvent = function () {
  var ev = weekeventMod.getEvent();
  this.weekEventActive = true;
  this.weekEventMod = ev.mod || {};
  this.weekEventKey = ev.key;
  this.panel = null;
  if (ev.mode === 'frenzy') this.startFrenzy(); else this.startClassic();
  this.toast('周赛活动:' + ev.name);
};

Game.prototype.checkWeekEventSuccess = function () {
  if (!this.weekEventActive) return;
  var ev = weekeventMod.getEvent(this.weekEventKey);
  var ok = ev.mode === 'frenzy' ? (this.score >= ev.targetScore) : (this.level >= ev.targetLevel);
  if (ok && !weekeventMod.isDone(this.weekEventKey)) {
    weekeventMod.markSuccess(this.weekEventKey);
    this.toast('✅ 周赛达成!去「每日」面板领奖');
    this.audio.play('best');
  }
};

mixin(Game.prototype, require('./ui/primitives'));
mixin(Game.prototype, require('./ui/hud'));
mixin(Game.prototype, require('./ui/screens'));
mixin(Game.prototype, require('./ui/panels-info'));
mixin(Game.prototype, require('./ui/panels-economy'));
mixin(Game.prototype, require('./meta-actions'));
mixin(Game.prototype, require('./input'));

module.exports = Game;
