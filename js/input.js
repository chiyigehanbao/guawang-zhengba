// js/input.js —— 输入与生命周期(触摸路由/面板分发/暂停/天赋/前后台)

var achMod = require('./achievements');
var noticeMod = require('./notice');
var privacyMod = require('./privacy');
var sidebarMod = require('./sidebar');
var shared = require('./game/shared');
var hitRect = shared.hitRect;
var DROP_COOLDOWN = shared.DROP_COOLDOWN;

var proto = {};

function hitList(list, x, y, field) {
  if (!list) return null;
  for (var i = 0; i < list.length; i++) {
    var it = list[i];
    if (hitRect(field ? it[field] : it, x, y)) return it;
  }
  return null;
}

// [按钮 key, 方法名];顺序即命中优先级
function hitActions(game, btns, actions, x, y) {
  if (!btns) return false;
  for (var i = 0; i < actions.length; i++) {
    if (hitRect(btns[actions[i][0]], x, y)) {
      game[actions[i][1]]();
      return true;
    }
  }
  return false;
}

var DAILY_ACTIONS = [
  ['start', 'startDaily'],
  ['reroll', 'requestRerollDaily'],
  ['checkin', 'doCheckin'],
  ['claim', 'doClaimDaily'],
  ['double', 'requestDoubleDaily'],
  ['weekStart', 'startWeekEvent'],
  ['weekClaim', 'claimWeekEvent']
];

var WELFARE_ACTIONS = [
  ['sidebar', 'onSidebarBtn'],
  ['shortcut', 'onShortcutBtn']
];

function tapCollectionTabs(game, x, y) {
  var tabs = game.panelTabs;
  if (tabs && hitRect(tabs.c, x, y)) {
    game.panel = 'collection';
    return true;
  }
  if (tabs && hitRect(tabs.a, x, y)) {
    game.panel = 'achievements';
    return true;
  }
  return false;
}

// 返回 true 表示已消费点击;否则走通用逻辑:面板内吞掉、面板外关闭
var PANEL_TAP = {
  themes: function (x, y) {
    var c = hitList(this.themeCards, x, y);
    if (c) this.selectTheme(c.id);
    return !!c;
  },
  growth: function (x, y) {
    var c = hitList(this.growthCards, x, y);
    if (c) this.buyUpgrade(c.id);
    return !!c;
  },
  daily: function (x, y) {
    return hitActions(this, this.dailyBtns, DAILY_ACTIONS, x, y);
  },
  missions: function (x, y) {
    var c = hitList(this.missionCards, x, y, 'btn');
    if (c) this.claimMission(c.id);
    return !!c;
  },
  settings: function (x, y) {
    var r = hitList(this.settingRows, x, y);
    if (r) this.toggleSettingRow(r.id);
    return !!r;
  },
  welfare: function (x, y) {
    return hitActions(this, this.welfareBtns, WELFARE_ACTIONS, x, y);
  },
  help: function (x, y) {
    var t = hitList(this.helpTabs, x, y);
    if (t) this.helpPage = t.page;
    return !!t;
  },
  reset: function (x, y) {
    var rb = this.resetBtns;
    if (rb && hitRect(rb.confirm, x, y)) {
      this.doReset();
      return true;
    }
    if (rb && hitRect(rb.cancel, x, y)) {
      this.panel = null;
      return true;
    }
    return false;
  },
  shop: function (x, y) {
    if (hitRect(this.shopAdBtn, x, y)) {
      this.requestAdCoins();
      return true;
    }
    var c = hitList(this.shopCards, x, y, 'btn');
    if (c) {
      this.buyItem(c.id);
      return true;
    }
    var g = hitList(this.gpCards, x, y, 'btn');
    if (g) {
      this.buyGpItem(g.id);
      return true;
    }
    return false;
  },
  collection: function (x, y) {
    var c = hitList(this.collectionRects, x, y);
    if (c) {
      this.collectionDetail = c.type;
      return true;
    }
    return tapCollectionTabs(this, x, y);
  },
  achievements: function (x, y) {
    var f = hitList(this.achFilterBtns, x, y);
    if (f) {
      this.achFilter = f.id;
      return true;
    }
    var c = hitList(this.achCatBtns, x, y);
    if (c) {
      this.achCat = c.id;
      return true;
    }
    return tapCollectionTabs(this, x, y);
  }
};

proto.bindInput = function () {
  var self = this;
  tt.onTouchStart(function (res) {
    var touch = res.touches && res.touches[0];
    if (!touch) return;
    self.onTap(touch.clientX, touch.clientY);
  });
  if (typeof tt.onHide === 'function') {
    tt.onHide(function () { self.onAppHide(); });
  }
  if (typeof tt.onShow === 'function') {
    tt.onShow(function (res) { self.onAppShow(res); });
  }
};

proto.onAppHide = function () {
  if (this.started && !this.over && !this.paused) {
    this.paused = true;
  }
  this.audio.setEnabled(false);
};

proto.onAppShow = function (res) {
  this.audio.setEnabled(!this.muted);
  this.lastTime = Date.now();
  sidebarMod.onLaunch(res);
};

proto.onPrivacyTap = function (x, y) {
  var b = hitList(this.privacyBtns, x, y);
  if (!b) return;
  if (b.act === 'agree') privacyMod.agree();
  else privacyMod.decline();
  this.privacyOpen = false;
};

// 按界面层级从上到下路由,上层弹窗优先吃掉点击
proto.onTap = function (x, y) {
  if (this.privacyOpen) {
    this.onPrivacyTap(x, y);
  } else if (this.noticeOpen) {
    this.noticeOpen = false;
    noticeMod.markSeen();
  } else if (this.perkChoices) {
    this.onPerkTap(x, y);
  } else if (this.clearPause > 0) {
    this.clearPause = 0;
    this.clearInfo = null;
    this.maybeOpenPendingPerk();
  } else if (this.leaderboardOpen) {
    this.closeLeaderboard();
  } else if (this.collectionDetail !== null) {
    this.collectionDetail = null;
  } else if (this.panel) {
    this.onPanelTap(x, y);
  } else if (this.over) {
    this.onGameOverTap(x, y);
  } else if (!this.started) {
    this.onMenuTap(x, y);
  } else if (this.paused) {
    this.onPauseTap(x, y);
  } else {
    this.onPlayTap(x, y);
  }
};

proto.onPanelTap = function (x, y) {
  if (hitRect(this.panelClose, x, y)) {
    this.panel = null;
    return;
  }
  var handler = PANEL_TAP[this.panel];
  if (handler && handler.call(this, x, y)) return;
  if (!hitRect(this.panelRect, x, y)) this.panel = null;
};

proto.onGameOverTap = function (x, y) {
  if (Date.now() - this.overAt <= 600) return;
  var right = x >= this.W / 2 + 20;
  var by2 = this.H / 2 + 88;
  if (y >= by2 && y <= by2 + 50) {
    if (right) this.toMenu();
    else this.restart();
    return;
  }
  var by3 = this.H / 2 + 148;
  if (y >= by3 && y <= by3 + 38) {
    if (right) this.openLeaderboard(this.score);
    else this.shareRun();
    return;
  }
  var by4 = this.H / 2 + 196;
  if (y >= by4 && y <= by4 + 40) {
    if (right) this.requestDoubleCoins();
    else this.requestRevive();
  }
};

function hitColumn(b, x) {
  return !!b && x >= b.x && x <= b.x + b.w;
}

proto.onMenuTap = function (x, y) {
  var L = this.menuLayout();
  var mi = this.menuIcons;
  if (mi) {
    if (hitRect(mi.profile, x, y)) {
      this.openPanel('profile');
      return;
    }
    if (hitRect(mi.settings, x, y)) {
      this.openPanel('settings');
      return;
    }
    if (hitRect(mi.welfare, x, y)) {
      this.openPanel('welfare');
      return;
    }
  }
  if (y >= L.ry && y <= L.ry + 32) {
    var mb = this.menuBtns || [];
    if (hitColumn(mb[0], x)) {
      this.openPanel('collection');
      return;
    }
    if (hitColumn(mb[1], x)) {
      this.openLeaderboard(this.best);
      return;
    }
    if (hitColumn(mb[2], x)) {
      this.openPanel('themes');
      return;
    }
  }
  var rows = [[L.gy, 'growth'], [L.gy2, 'daily'], [L.gy3, 'missions'], [L.gy4, 'shop']];
  for (var i = 0; i < rows.length; i++) {
    if (y >= rows[i][0] && y <= rows[i][0] + 30) {
      this.openPanel(rows[i][1]);
      return;
    }
  }
  if (y >= L.by && y <= L.by + 70) {
    if (x < this.W / 2) this.startClassic();
    else this.startFrenzy();
  }
};

proto.onPlayTap = function (x, y) {
  if (y < 70 * this.scale) {
    if (this.hitMute(x, y)) {
      this.toggleMute();
    } else if (this.hitPause(x, y)) {
      this.paused = true;
      this.audio.play('drop');
    }
    return;
  }
  if (hitRect(this.shuffleBtn, x, y)) {
    this.useShuffle();
    return;
  }
  if (hitRect(this.meteorBtn, x, y)) {
    if (this.targeting && this.targetSkill === 'meteor') {
      this.targeting = false;
      this.toast('已取消陨石');
    } else {
      this.targeting = true;
      this.targetSkill = 'meteor';
      this.toast('点击目标位置召唤陨石');
    }
    return;
  }
  if (hitRect(this.skillBtn, x, y)) {
    if (this.targeting) {
      this.targeting = false;
      this.toast('已取消重锤');
    } else {
      this.targeting = true;
      this.targetSkill = 'hammer';
      this.toast('点击目标位置释放重锤');
    }
    return;
  }
  var cx = Math.max(20 * this.scale, Math.min(this.W - 20 * this.scale, x));
  if (this.targeting) {
    this.useSkill(this.targetSkill || 'hammer', cx, y);
    this.targeting = false;
    return;
  }
  this.dropAt(cx);
};

proto.dropAt = function (cx) {
  if (this.time - this.lastDropAt < DROP_COOLDOWN) return;
  this.lastDropAt = this.time;
  if (Math.random() < this.specialChance()) {
    this.spawnSpecial(cx);
  } else {
    var type = this.nextType;
    this.nextType = this.nextType2;
    this.nextType2 = this.pickType();
    if (achMod.markCollected(type)) this.onDiscover(type, cx, 80 * this.scale);
    var fruit = this.world.spawn(type, cx, 50 * this.scale);
    fruit.vy = 40;
  }
  this.audio.play('drop');
  if (this.graceDrops > 0) this.graceDrops -= 1;
  this.completeTutorial();
};

proto.hitMute = function (x, y) {
  var dx = x - this.W / 2;
  var dy = y - 44 * this.scale;
  return dx * dx + dy * dy <= (24 * this.scale) * (24 * this.scale);
};

proto.hitPause = function (x, y) {
  var dx = x - (this.W / 2 + 56 * this.scale);
  var dy = y - 44 * this.scale;
  return dx * dx + dy * dy <= (24 * this.scale) * (24 * this.scale);
};

proto.onPauseTap = function (x, y) {
  var b = hitList(this.pauseBtns, x, y);
  this.paused = false;
  if (!b) return;
  if (b.act === 'home') this.toMenu();
  else if (b.act === 'exit') this.quitGame();
  else if (b.act === 'restart') this.restart();
  else this.audio.play('drop');
};

proto.onPerkTap = function (x, y) {
  var r = hitList(this.perkLayout(), x, y);
  if (r) this.applyPerk(r.perk);
};

module.exports = proto;
