// js/sidebar.js —— 抖音侧边栏复访奖励
// tt.checkScene 判断宿主是否支持侧边栏;从侧边栏进入(launch_from=homepage, location=sidebar_card)
// 后每日可领一次金币。tt.navigateToScene 引导玩家前往侧边栏。纯本地持久化,可 Node 测试。
var progMod = require('./progression');
var liveopsMod = require('./liveops');

var KEY = 'merge_watermelon_sidebar_day';
var REWARD = 100;

var supported = false;
var fromSidebar = false;

function isSidebarLaunch(opts) {
  if (!opts) return false;
  var q = opts.query || {};
  var from = opts.launch_from || q.launch_from;
  var loc = opts.location || q.location;
  return from === 'homepage' && loc === 'sidebar_card';
}

// 启动/回前台时传入启动参数
function onLaunch(opts) {
  if (isSidebarLaunch(opts)) fromSidebar = true;
}

function init() {
  try {
    if (typeof tt.checkScene === 'function') {
      tt.checkScene({
        scene: 'sidebar',
        success: function (res) { supported = !!(res && res.isExist); },
        fail: function () { supported = false; }
      });
    }
  } catch (e) { supported = false; }
  try {
    if (typeof tt.getLaunchOptionsSync === 'function') onLaunch(tt.getLaunchOptionsSync());
  } catch (e) {}
}

function isSupported() { return supported; }
function isFromSidebar() { return fromSidebar; }

function claimedToday(key) {
  var v;
  try { v = tt.getStorageSync(KEY); } catch (e) { v = ''; }
  return v === liveopsMod.dayKey(key);
}

function canClaim(key) {
  return fromSidebar && !claimedToday(key);
}

function claim(key) {
  if (!fromSidebar) return { ok: false, reason: 'notfrom' };
  if (claimedToday(key)) return { ok: false, reason: 'claimed' };
  try { tt.setStorageSync(KEY, liveopsMod.dayKey(key)); } catch (e) {}
  progMod.addCoins(REWARD);
  return { ok: true, coins: REWARD };
}

function navigate(cb) {
  try {
    if (typeof tt.navigateToScene !== 'function') {
      if (cb) cb(false);
      return false;
    }
    tt.navigateToScene({
      scene: 'sidebar',
      success: function () { if (cb) cb(true); },
      fail: function () { if (cb) cb(false); }
    });
  } catch (e) {
    if (cb) cb(false);
    return false;
  }
  return true;
}

function reset() {
  supported = false;
  fromSidebar = false;
  try { tt.setStorageSync(KEY, ''); } catch (e) {}
}

module.exports = {
  KEY: KEY,
  REWARD: REWARD,
  isSidebarLaunch: isSidebarLaunch,
  onLaunch: onLaunch,
  init: init,
  isSupported: isSupported,
  isFromSidebar: isFromSidebar,
  claimedToday: claimedToday,
  canClaim: canClaim,
  claim: claim,
  navigate: navigate,
  reset: reset
};
