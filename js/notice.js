// js/notice.js —— 公告/弹窗(单条公告,首次展示)
// 用于版本更新/活动告知;记录已读 id,未读则启动时展示一次。纯本地、可测试。
var KEY = 'merge_watermelon_notice_seen';

var NOTICE = {
  id: 'n1',
  title: '🎉 焕新版本上线',
  lines: [
    '新增:金币商店道具 / 周赛活动 / 三主动技能',
    '新增:每日挑战连胜、任务线、成就点数',
    '新增:多语言、高对比、存档导入导出',
    '平衡与性能:动态难度、粒子对象池、机关系统'
  ]
};

function readSeen() {
  try { return tt.getStorageSync(KEY) || ''; } catch (e) { return ''; }
}

function shouldShow() {
  return readSeen() !== NOTICE.id;
}

function markSeen() {
  try { tt.setStorageSync(KEY, NOTICE.id); } catch (e) {}
}

function get() { return NOTICE; }

function reset() {
  try { tt.setStorageSync(KEY, ''); } catch (e) {}
}

module.exports = {
  KEY: KEY,
  NOTICE: NOTICE,
  shouldShow: shouldShow,
  markSeen: markSeen,
  get: get,
  reset: reset
};
