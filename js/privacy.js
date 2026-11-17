// js/privacy.js —— 隐私授权状态(首次启动询问)
// 'agreed' 才允许云存储上报与好友数据拉取;'declined' 仍可完整单机游玩。
var KEY = 'merge_watermelon_privacy';

var TEXT = {
  title: '🔒 隐私保护提示',
  lines: [
    '为提供好友排行与成绩分享,我们会在你同意后',
    '把游戏分数上传至抖音云存储,并读取好友的游戏分数。',
    '不同意也可完整游玩,仅好友排行不可用。',
    '详见《隐私政策》(可在 ⚙ 设置中随时查看)。'
  ]
};

function read() {
  try { return tt.getStorageSync(KEY) || ''; } catch (e) { return ''; }
}

function needsPrompt() {
  return read() === '';
}

function isAgreed() {
  return read() === 'agreed';
}

function agree() {
  try { tt.setStorageSync(KEY, 'agreed'); } catch (e) {}
}

function decline() {
  try { tt.setStorageSync(KEY, 'declined'); } catch (e) {}
}

function reset() {
  try { tt.setStorageSync(KEY, ''); } catch (e) {}
}

module.exports = {
  KEY: KEY,
  TEXT: TEXT,
  needsPrompt: needsPrompt,
  isAgreed: isAgreed,
  agree: agree,
  decline: decline,
  reset: reset
};
