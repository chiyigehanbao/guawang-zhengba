// js/recorder.js —— 对局录屏 + 视频分享(tt.getGameRecorderManager)
// 开局开始录制,暂停/切后台时暂停,结算时停止;录满 MIN_SEC 秒才可分享。
// 所有平台调用 try/catch,不支持时静默降级。分享不发奖励(规避诱导分享)。
var MAX_SEC = 300;
var MIN_SEC = 3;
var TOPICS = ['瓜王争霸', '合成大西瓜'];

var mgr = null;
var state = 'idle'; // idle | recording | paused | stopping
var restartPending = false;
var elapsed = 0;
var videoPath = '';

function available() {
  try {
    return typeof tt !== 'undefined' && typeof tt.getGameRecorderManager === 'function';
  } catch (e) {
    return false;
  }
}

function begin() {
  elapsed = 0;
  videoPath = '';
  try {
    mgr.start({ duration: MAX_SEC });
    state = 'recording';
  } catch (e) {
    state = 'idle';
  }
}

function getMgr() {
  if (mgr) return mgr;
  if (!available()) return null;
  try {
    mgr = tt.getGameRecorderManager();
    mgr.onStop(function (res) {
      videoPath = (res && res.videoPath) || '';
      state = 'idle';
      if (restartPending) {
        restartPending = false;
        begin();
      }
    });
    if (typeof mgr.onError === 'function') {
      mgr.onError(function () { state = 'idle'; videoPath = ''; restartPending = false; });
    }
  } catch (e) {
    mgr = null;
  }
  return mgr;
}

// 开局调用:若上一段仍在录,先停止,停止回调后再开始新的一段
function start() {
  if (!getMgr()) return false;
  if (state === 'idle') {
    begin();
    return state === 'recording';
  }
  restartPending = true;
  videoPath = '';
  if (state !== 'stopping') {
    state = 'stopping';
    try { mgr.stop(); } catch (e) { restartPending = false; begin(); }
  }
  return true;
}

// 每帧调用:按对局是否进行中暂停/恢复,只在状态变化时调用平台接口
function sync(active, dt) {
  if (!mgr) return;
  if (state === 'recording') {
    if (active) {
      elapsed += dt || 0;
      return;
    }
    try { mgr.pause(); state = 'paused'; } catch (e) {}
  } else if (state === 'paused' && active) {
    try { mgr.resume(); state = 'recording'; } catch (e) {}
  }
}

function stop() {
  if (!mgr || (state !== 'recording' && state !== 'paused')) return false;
  restartPending = false;
  state = 'stopping';
  try { mgr.stop(); } catch (e) { state = 'idle'; }
  return true;
}

function hasVideo() {
  return !!videoPath && elapsed >= MIN_SEC;
}

function share(title, cb) {
  if (!hasVideo()) {
    if (cb) cb(false, 'novideo');
    return false;
  }
  try {
    tt.shareAppMessage({
      channel: 'video',
      title: title || '',
      query: 'from=video',
      extra: { videoPath: videoPath, videoTopics: TOPICS },
      success: function () { if (cb) cb(true); },
      fail: function () { if (cb) cb(false, 'fail'); }
    });
  } catch (e) {
    if (cb) cb(false, 'error');
    return false;
  }
  return true;
}

function getState() { return state; }

function reset() {
  mgr = null;
  state = 'idle';
  restartPending = false;
  elapsed = 0;
  videoPath = '';
}

module.exports = {
  MAX_SEC: MAX_SEC,
  MIN_SEC: MIN_SEC,
  TOPICS: TOPICS,
  available: available,
  start: start,
  sync: sync,
  stop: stop,
  hasVideo: hasVideo,
  share: share,
  getState: getState,
  reset: reset
};
