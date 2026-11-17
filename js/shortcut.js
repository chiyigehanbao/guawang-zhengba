// js/shortcut.js —— 添加到桌面(tt.addShortcut,仅安卓)
// 首次添加成功一次性奖励金币;已添加/iOS/不支持时入口隐藏。纯本地持久化,可 Node 测试。
var progMod = require('./progression');

var KEY = 'merge_watermelon_shortcut_rewarded';
var REWARD = 200;

var exists = false;

function isIOS() {
  try {
    var info = tt.getSystemInfoSync();
    return String((info && info.platform) || '').toLowerCase() === 'ios';
  } catch (e) {
    return false;
  }
}

function available() {
  try {
    return typeof tt.addShortcut === 'function' && !isIOS();
  } catch (e) {
    return false;
  }
}

function init() {
  try {
    if (available() && typeof tt.checkShortcut === 'function') {
      tt.checkShortcut({
        success: function (res) { exists = !!(res && res.status && res.status.exist); },
        fail: function () {}
      });
    }
  } catch (e) {}
}

function rewarded() {
  try { return !!tt.getStorageSync(KEY); } catch (e) { return false; }
}

// 是否需要展示入口
function shouldShow() {
  return available() && !(exists && rewarded());
}

function grant() {
  if (rewarded()) return 0;
  try { tt.setStorageSync(KEY, 1); } catch (e) {}
  progMod.addCoins(REWARD);
  return REWARD;
}

// cb(ok, coins)
function add(cb) {
  if (!available()) {
    if (cb) cb(false, 0);
    return false;
  }
  try {
    tt.addShortcut({
      success: function () {
        exists = true;
        var coins = grant();
        if (cb) cb(true, coins);
      },
      fail: function () { if (cb) cb(false, 0); }
    });
  } catch (e) {
    if (cb) cb(false, 0);
    return false;
  }
  return true;
}

function reset() {
  exists = false;
  try { tt.setStorageSync(KEY, 0); } catch (e) {}
}

module.exports = {
  KEY: KEY,
  REWARD: REWARD,
  available: available,
  init: init,
  rewarded: rewarded,
  shouldShow: shouldShow,
  add: add,
  reset: reset
};
