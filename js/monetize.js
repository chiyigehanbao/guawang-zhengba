// js/monetize.js —— 商业化闭环:激励视频 + 插屏广告(不接真实支付)
// 设计原则:一切平台调用 try/catch 静默降级;无广告环境(模拟器/未开通)下不影响玩法,
// 仅隐藏/禁用相关入口。可注入 tt.createRewardedVideoAd 以便零依赖测试。
//
// 激励视频位:
//   revive        —— 结算后观看复活,清除危险线上方水果并继续本局
//   double_coins  —— 结算后观看,本局结算金币翻倍
var CONFIG = {
  rewardedUnitId: 'adunit-rewarded-placeholder',
  interstitialUnitId: 'adunit-interstitial-placeholder',
  interstitialEvery: 4,
  interstitialFreeRuns: 3,
  interstitialMinGapMs: 60000
};

if (/placeholder/.test(CONFIG.rewardedUnitId + CONFIG.interstitialUnitId) && typeof console !== 'undefined') {
  console.warn('[monetize] 广告位 ID 仍为占位符,上线前请在 js/monetize.js 的 CONFIG 中替换为抖音开放平台申请的真实 adunit id');
}

var rewardedAd = null;
var interstitialAd = null;
var oversSinceInterstitial = 0;
var lastInterstitialAt = -Infinity;

var stats = {
  rewardedShown: 0,
  rewardedCompleted: 0,
  rewardedAborted: 0,
  interstitialShown: 0
};

function hasApi(name) {
  try {
    return typeof tt !== 'undefined' && typeof tt[name] === 'function';
  } catch (e) {
    return false;
  }
}

// 激励视频是否可用(用于 UI 是否展示入口)
function rewardedAvailable() {
  return hasApi('createRewardedVideoAd');
}

function interstitialAvailable() {
  return hasApi('createInterstitialAd');
}

function getRewarded() {
  if (rewardedAd) return rewardedAd;
  if (!hasApi('createRewardedVideoAd')) return null;
  try {
    rewardedAd = tt.createRewardedVideoAd({ adUnitId: CONFIG.rewardedUnitId });
  } catch (e) {
    rewardedAd = null;
  }
  return rewardedAd;
}

// 播放激励视频。cb(ok, reason)。返回是否成功发起播放。
function showReward(placement, cb) {
  var ad = getRewarded();
  if (!ad) {
    if (cb) cb(false, 'unavailable');
    return false;
  }
  stats.rewardedShown += 1;

  var finished = false;
  function onClose(res) {
    if (finished) return;
    finished = true;
    if (ad.offClose) { try { ad.offClose(onClose); } catch (e) {} }
    var ended = (!res || res.isEnded === undefined) ? true : !!res.isEnded;
    if (ended) {
      stats.rewardedCompleted += 1;
      if (cb) cb(true, placement);
    } else {
      stats.rewardedAborted += 1;
      if (cb) cb(false, 'aborted');
    }
  }

  try {
    if (ad.onClose) ad.onClose(onClose);
    var p = ad.show && ad.show();
    if (p && typeof p.catch === 'function') {
      p.catch(function () {
        if (finished) return;
        if (ad.load) {
          try {
            var lp = ad.load();
            if (lp && typeof lp.then === 'function') {
              lp.then(function () {
                try { ad.show(); } catch (e) { if (!finished) { finished = true; if (cb) cb(false, 'showfail'); } }
              }).catch(function () {
                if (!finished) { finished = true; if (cb) cb(false, 'loadfail'); }
              });
            } else if (cb) { finished = true; cb(false, 'loadfail'); }
          } catch (e) {
            if (!finished) { finished = true; if (cb) cb(false, 'error'); }
          }
        } else if (cb) {
          finished = true;
          cb(false, 'showfail');
        }
      });
    } else if (p === undefined && ad.show === undefined) {
      // 无 show 方法,视作不可用
      finished = true;
      if (cb) cb(false, 'unavailable');
      return false;
    }
  } catch (e) {
    if (!finished) { finished = true; if (cb) cb(false, 'error'); }
    return false;
  }
  return true;
}

function getInterstitial() {
  if (interstitialAd) return interstitialAd;
  if (!hasApi('createInterstitialAd')) return null;
  try {
    interstitialAd = tt.createInterstitialAd({ adUnitId: CONFIG.interstitialUnitId });
  } catch (e) {
    interstitialAd = null;
  }
  return interstitialAd;
}

function showInterstitial(cb) {
  var ad = getInterstitial();
  if (!ad) {
    if (cb) cb(false);
    return false;
  }
  stats.interstitialShown += 1;
  try {
    var p = ad.show && ad.show();
    if (p && typeof p.catch === 'function') p.catch(function () {});
  } catch (e) {
    if (cb) cb(false);
    return false;
  }
  if (cb) cb(true);
  return true;
}

// 每局结束时调用:达阈值则弹插屏。
// opts.lifetimeRuns:玩家累计局数,前 interstitialFreeRuns 局不弹;opts.now:毫秒时间戳(测试注入)。
function onGameOver(opts) {
  opts = opts || {};
  var now = typeof opts.now === 'number' ? opts.now : Date.now();
  oversSinceInterstitial += 1;
  if (typeof opts.lifetimeRuns === 'number' && opts.lifetimeRuns <= CONFIG.interstitialFreeRuns) return false;
  if (oversSinceInterstitial < CONFIG.interstitialEvery) return false;
  if (now - lastInterstitialAt < CONFIG.interstitialMinGapMs) return false;
  oversSinceInterstitial = 0;
  lastInterstitialAt = now;
  showInterstitial();
  return true;
}

function getStats() {
  return {
    rewardedShown: stats.rewardedShown,
    rewardedCompleted: stats.rewardedCompleted,
    rewardedAborted: stats.rewardedAborted,
    interstitialShown: stats.interstitialShown
  };
}

function reset() {
  rewardedAd = null;
  interstitialAd = null;
  oversSinceInterstitial = 0;
  lastInterstitialAt = -Infinity;
  stats.rewardedShown = 0;
  stats.rewardedCompleted = 0;
  stats.rewardedAborted = 0;
  stats.interstitialShown = 0;
}

module.exports = {
  CONFIG: CONFIG,
  rewardedAvailable: rewardedAvailable,
  interstitialAvailable: interstitialAvailable,
  showReward: showReward,
  showInterstitial: showInterstitial,
  onGameOver: onGameOver,
  getStats: getStats,
  reset: reset
};
