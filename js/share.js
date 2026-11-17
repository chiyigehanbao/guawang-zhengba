// js/share.js —— 成绩上报 + 分享卡片
// 依赖抖音开放能力:tt.setUserCloudStorage / tt.createCanvas / tt.canvasToTempFilePath / tt.shareAppMessage
// 所有 API 均包裹 try/catch,平台不支持时静默降级,不影响主流程。

var privacyMod = require('./privacy');

function submitScore(score) {
  if (!privacyMod.isAgreed()) return;
  var val = String(Math.max(0, Math.floor(score) || 0));
  try {
    tt.setUserCloudStorage({
      KVDataList: [{ key: 'score', value: val }],
      fail: function () {}
    });
  } catch (e) {}
}

function buildShareImage(score, best, modeName, extra, cb) {
  if (typeof extra === 'function') { cb = extra; extra = ''; }
  var canvas, ctx;
  try {
    canvas = tt.createCanvas();
    canvas.width = 300;
    canvas.height = 400;
    ctx = canvas.getContext('2d');
  } catch (e) {
    cb('');
    return;
  }
  var g = ctx.createLinearGradient(0, 0, 0, 400);
  g.addColorStop(0, '#ff8a65');
  g.addColorStop(1, '#d84315');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 300, 400);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '90px sans-serif';
  ctx.fillText('🍉', 150, 130);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fillText('🍉 瓜王争霸', 150, 178);
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(modeName, 150, 220);
  ctx.font = 'bold 56px sans-serif';
  ctx.fillStyle = '#ffe082';
  ctx.fillText(String(Math.max(0, Math.floor(score) || 0)), 150, 280);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('最高 ' + String(Math.max(0, Math.floor(best) || 0)), 150, 330);
  if (extra) {
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(extra, 150, 354);
  }
  ctx.font = '18px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('你能超过我吗?来挑战瓜王争霸!', 150, 374);
  try {
    tt.canvasToTempFilePath({
      canvas: canvas,
      fileType: 'png',
      success: function (res) {
        cb(res.tempFilePath || '');
      },
      fail: function () {
        cb('');
      }
    });
  } catch (e) {
    cb('');
  }
}

function shareResult(score, best, modeName, extra) {
  buildShareImage(score, best, modeName, extra, function (imageUrl) {
    try {
      tt.shareAppMessage({
        title: '我在「瓜王争霸」打了 ' + (Math.floor(score) || 0) + ' 分(' + modeName + ')' + (extra ? '·' + extra : '') + ',快来挑战!',
        imageUrl: imageUrl || '',
        query: 'from=share',
        success: function () {},
        fail: function () {}
      });
    } catch (e) {}
  });
}

module.exports = {
  submitScore: submitScore,
  shareResult: shareResult
};
