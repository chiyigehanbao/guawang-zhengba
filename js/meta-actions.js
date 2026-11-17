// js/meta-actions.js —— 局外操作(购买/领奖/签到/设置项/存档导入导出/福利/清档)

var themesMod = require('./themes');
var progMod = require('./progression');
var liveopsMod = require('./liveops');
var monetizeMod = require('./monetize');
var missionsMod = require('./missions');
var saveMod = require('./save');
var settingsMod = require('./settings');
var dailytasksMod = require('./dailytasks');
var weeklytasksMod = require('./weeklytasks');
var i18nMod = require('./i18n');
var skillupMod = require('./skillup');
var shopMod = require('./shop');
var weekeventMod = require('./weekevent');
var gpexMod = require('./gpexchange');
var sidebarMod = require('./sidebar');
var shortcutMod = require('./shortcut');
var achMod = require('./achievements');
var shared = require('./game/shared');

var proto = {};

proto.selectTheme = function (id) {
  var th = themesMod.getTheme(id);
  if (!themesMod.isUnlocked(id)) {
    if (th.cost) {
      var r = themesMod.buyTheme(id);
      if (r.ok) {
        this.toast('已解锁主题:' + th.name);
        this.audio.play('best');
      } else if (r.reason === 'coins') {
        this.toast('金币不足,无法解锁(需 🪙' + th.cost + ')');
        return;
      } else {
        return;
      }
    } else {
      this.toast('达成 ' + th.ach + ' 个成就解锁该主题');
      return;
    }
  }
  themesMod.setThemeId(id);
  this.theme = themesMod.getTheme(id);
  this.initAmbient();
  this.toast('已切换主题:' + this.theme.name);
  this.audio.play('star');
};

proto.buyUpgrade = function (id) {
  var mod = skillupMod.getById(id) ? skillupMod : progMod;
  var r = mod.buy(id);
  if (r.ok) {
    this.toast('升级成功!升至 ' + r.level + ' 级');
    this.audio.play('star');
  } else if (r.reason === 'coins') {
    this.toast('金币不足');
    this.audio.play('drop');
  } else if (r.reason === 'max') {
    this.toast('已达最高等级');
  }
};

proto.doCheckin = function () {
  var r = liveopsMod.claimCheckin();
  if (r.ok) {
    this.toast('签到成功!第 ' + r.day + ' 天 +🪙' + r.reward);
    this.audio.play('star');
  } else {
    this.toast('今日已签到');
  }
};

proto.doClaimDaily = function () {
  var r = liveopsMod.claimDaily();
  if (r.ok) {
    this.toast('挑战奖励 +🪙' + r.reward);
    this.audio.play('best');
  } else if (r.reason === 'todo') {
    this.toast('先完成今日挑战');
  } else {
    this.toast('奖励已领取');
  }
};

proto.requestRerollDaily = function () {
  var key = liveopsMod.dayKey();
  if (liveopsMod.isDailyDone(key)) {
    this.toast('今日挑战已完成');
    return;
  }
  var r = liveopsMod.reroll(key);
  if (!r.ok) {
    this.toast(r.reason === 'used' ? '今日已换过' : '无法更换');
    return;
  }
  if (!progMod.spend(50)) {
    this.toast('金币不足(需 🪙50)');
    return;
  }
  this.toast('已更换今日挑战');
  this.audio.play('drop');
};

proto.requestDoubleDaily = function () {
  var self = this;
  var shown = monetizeMod.showReward('double_daily', function (ok) {
    if (!ok) {
      self.toast('未完成观看,奖励未翻倍');
      return;
    }
    var r = liveopsMod.claimDaily();
    if (r.ok) {
      progMod.addCoins(liveopsMod.DAILY_REWARD);
      self.toast('每日奖励 ×2! +🪙' + (r.reward + liveopsMod.DAILY_REWARD));
      self.audio.play('best');
    } else {
      self.toast('奖励已领取');
    }
  });
  if (!shown) this.toast('广告暂不可用(真机/开通广告位后可用)');
};

proto.claimMission = function (id) {
  var r;
  if (dailytasksMod.getById(id)) r = dailytasksMod.claim(id);
  else if (weeklytasksMod.getById(id)) r = weeklytasksMod.claim(id);
  else r = missionsMod.claim(id);
  if (r.ok) {
    this.toast('任务奖励 +🪙' + r.reward);
    this.audio.play('best');
  } else if (r.reason === 'todo') {
    this.toast('任务尚未完成');
  } else if (r.reason === 'claimed') {
    this.toast('该任务奖励已领取');
  }
};

proto.toggleSettingRow = function (id) {
  if (id === 'audio') {
    this.toggleMute();
    this.toast('音效:' + (this.muted ? '关' : '开'));
  } else if (id === 'volume') {
    var levels = [1, 0.7, 0.4, 0.1];
    var cur = settingsMod.getVolume();
    var next = levels[0];
    for (var vi = 0; vi < levels.length; vi++) {
      if (cur > levels[vi] + 0.001) { next = levels[vi]; break; }
    }
    settingsMod.set('volume', next);
    this.volume = next;
    this.audio.setVolume(next);
    this.toast('音量:' + Math.round(next * 100) + '%');
  } else if (id === 'haptics') {
    this.haptics = settingsMod.toggle('haptics');
    this.toast('震动:' + (this.haptics ? '开' : '关'));
  } else if (id === 'motion') {
    this.reducedMotion = settingsMod.toggle('reducedMotion');
    this.toast('减少动态效果:' + (this.reducedMotion ? '开' : '关'));
  } else if (id === 'contrast') {
    this.highContrast = settingsMod.toggle('highContrast');
    this.toast('高对比轮廓:' + (this.highContrast ? '开' : '关'));
  } else if (id === 'colorblind') {
    this.colorblind = settingsMod.toggle('colorblind');
    this.toast('色盲友好:' + (this.colorblind ? '开' : '关'));
  } else if (id === 'help') {
    this.openPanel('help');
  } else if (id === 'export') {
    this.doExportSave();
  } else if (id === 'import') {
    this.doImportSave();
  } else if (id === 'lang') {
    var nextLoc = i18nMod.getLocale() === 'zh' ? 'en' : 'zh';
    i18nMod.setLocale(nextLoc);
    this.toast('语言 / Language: ' + (nextLoc === 'en' ? 'English' : '中文'));
  } else if (id === 'privacy') {
    this.panel = null;
    this.privacyOpen = true;
  } else if (id === 'reset') {
    this.openPanel('reset');
  }
};

proto.doImportSave = function () {
  var self = this;
  try {
    if (typeof tt.getClipboardData !== 'function') {
      this.toast('当前环境不支持导入');
      return;
    }
    tt.getClipboardData({
      success: function (res) {
        var r = saveMod.importAll(res && res.data);
        if (r.ok) {
          self.migrated = saveMod.migrate();
          self.toast('已导入存档(' + r.count + ' 项),重启后完整生效');
        } else {
          self.toast('剪贴板内容不是有效存档');
        }
      },
      fail: function () { self.toast('读取剪贴板失败'); }
    });
  } catch (e) {
    this.toast('导入失败');
  }
};

proto.doExportSave = function () {
  var json = saveMod.exportAll();
  try {
    if (typeof tt.setClipboardData === 'function') {
      tt.setClipboardData({ data: json, success: function () {}, fail: function () {} });
      this.toast('存档已复制到剪贴板');
    } else {
      this.exportedSave = json;
      this.toast('存档已生成(共 ' + json.length + ' 字符)');
    }
  } catch (e) {
    this.toast('导出失败');
  }
};

proto.claimableFlags = function () {
  var key = liveopsMod.dayKey();
  var rec = liveopsMod.getDailyRecord();
  var dailyClaim = rec.key === key && rec.done && !rec.claimed;
  var checkinReady = !liveopsMod.isCheckedToday(key);
  var tasksClaim = dailytasksMod.claimableCount() + weeklytasksMod.claimableCount() + missionsMod.claimableCount();
  return {
    daily: dailyClaim || checkinReady || weekeventMod.isClaimable(),
    missions: tasksClaim > 0
  };
};

proto.hasWelfare = function () {
  return sidebarMod.isSupported() || sidebarMod.isFromSidebar() || shortcutMod.shouldShow();
};

proto.onSidebarBtn = function () {
  if (sidebarMod.canClaim()) {
    var r = sidebarMod.claim();
    if (r.ok) {
      this.toast('侧边栏复访奖励 +🪙' + r.coins);
      this.audio.play('best');
    }
    return;
  }
  if (sidebarMod.claimedToday()) {
    this.toast('今日已领取,明天从侧边栏进入再来');
    return;
  }
  var self = this;
  if (!sidebarMod.navigate(function (ok) { if (!ok) self.toast('请在抖音首页侧边栏找到「瓜王争霸」'); })) {
    this.toast('当前环境不支持侧边栏');
  }
};

proto.onShortcutBtn = function () {
  var self = this;
  var started = shortcutMod.add(function (ok, coins) {
    if (!ok) {
      self.toast('未添加到桌面');
      return;
    }
    self.toast(coins ? ('已添加到桌面 +🪙' + coins) : '已添加到桌面');
    if (coins) self.audio.play('best');
  });
  if (!started) this.toast('当前设备不支持添加到桌面');
};

proto.buyItem = function (id) {
  var it = shopMod.getById(id);
  var r = shopMod.buy(id);
  if (r.ok) {
    this.toast('已购买 ' + it.icon + it.name + '(持有 ' + r.count + ')');
    this.audio.play('star');
  } else if (r.reason === 'coins') {
    this.toast('金币不足(需 🪙' + it.cost + ')');
  }
};

proto.requestAdCoins = function () {
  if (shopMod.adLeftToday() <= 0) {
    this.toast('今日免费金币已领完,明天再来');
    return;
  }
  var self = this;
  var shown = monetizeMod.showReward('shop_coins', function (ok) {
    if (!ok) {
      self.toast('未完成观看,未获得金币');
      return;
    }
    var r = shopMod.grantAdCoins();
    if (r.ok) {
      self.toast('+🪙' + r.coins + '(今日还可领 ' + r.left + ' 次)');
      self.audio.play('best');
    }
  });
  if (!shown) this.toast('广告暂不可用(真机/开通广告位后可用)');
};

proto.buyGpItem = function (id) {
  var r = gpexMod.exchange(id);
  if (r.ok) {
    this.toast('兑换成功! +🪙' + r.coins);
    this.audio.play('best');
  } else if (r.reason === 'gp') {
    this.toast('成就点数不足');
  }
};

proto.claimWeekEvent = function () {
  var r = weekeventMod.claim(this.weekEventKey);
  if (r.ok) {
    this.toast('周赛奖励 +🪙' + r.reward);
    this.audio.play('best');
  } else if (r.reason === 'todo') {
    this.toast('先完成本周活动');
  } else {
    this.toast('奖励已领取');
  }
};

proto.doReset = function () {
  try { if (typeof tt.clearStorageSync === 'function') tt.clearStorageSync(); } catch (e) {}
  achMod.reload();
  missionsMod.reload();
  try { saveMod.migrate(); } catch (e) {}
  this.toast('已清档,请重启应用生效');
  this.panel = null;
};

module.exports = proto;
