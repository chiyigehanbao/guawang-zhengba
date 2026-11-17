// js/cloud.js —— 云端数据接入骨架(好友榜)
// 封装 tt.setUserCloudStorage / tt.getFriendCloudStorage,统一 try/catch 优雅降级。
// 纯封装、可注入 mock,便于零依赖测试。
var privacyMod = require('./privacy');

var KEY_SCORE = 'score';

function available() {
  try {
    return privacyMod.isAgreed() && typeof tt !== 'undefined' && typeof tt.setUserCloudStorage === 'function';
  } catch (e) {
    return false;
  }
}

function friendAvailable() {
  try {
    return privacyMod.isAgreed() && typeof tt !== 'undefined' && typeof tt.getFriendCloudStorage === 'function';
  } catch (e) {
    return false;
  }
}

// 写入任意 KV 列表
function submit(kvList, cb) {
  if (!available()) {
    if (cb) cb(false, 'unavailable');
    return false;
  }
  try {
    tt.setUserCloudStorage({
      KVDataList: kvList,
      success: function () { if (cb) cb(true); },
      fail: function () { if (cb) cb(false, 'fail'); }
    });
  } catch (e) {
    if (cb) cb(false, 'error');
    return false;
  }
  return true;
}

function submitScore(score, cb) {
  return submit([{ key: KEY_SCORE, value: String(Math.max(0, Math.floor(score) || 0)) }], cb);
}

// 拉取好友数据(以指定键)
function fetchFriends(keyList, cb) {
  if (!friendAvailable()) {
    if (cb) cb(false, []);
    return false;
  }
  try {
    tt.getFriendCloudStorage({
      keyList: keyList || [KEY_SCORE],
      success: function (res) { if (cb) cb(true, (res && res.data) ? res.data : []); },
      fail: function () { if (cb) cb(false, []); }
    });
  } catch (e) {
    if (cb) cb(false, []);
    return false;
  }
  return true;
}

module.exports = {
  KEY_SCORE: KEY_SCORE,
  available: available,
  friendAvailable: friendAvailable,
  submit: submit,
  submitScore: submitScore,
  fetchFriends: fetchFriends
};
