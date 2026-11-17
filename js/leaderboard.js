// js/leaderboard.js —— 好友排行浮层(主域控制)
// 主域通过 tt.getOpenDataContext() 与开放数据域通信,开放数据域把排行绘制到 sharedCanvas 并叠加在屏幕上。
var openCtx = null;
var sharedCanvas = null;
var OPEN = false;

function getOpen() {
  if (openCtx !== null) return openCtx;
  try {
    openCtx = tt.getOpenDataContext();
    sharedCanvas = openCtx.canvas;
  } catch (e) {
    openCtx = false;
  }
  return openCtx;
}

function show(score, cssX, cssY, cssW, cssH, dpr) {
  var oc = getOpen();
  if (!oc || !sharedCanvas) return false;
  OPEN = true;
  try {
    sharedCanvas.width = Math.round(cssW * dpr);
    sharedCanvas.height = Math.round(cssH * dpr);
    sharedCanvas.style.width = cssW + 'px';
    sharedCanvas.style.height = cssH + 'px';
    sharedCanvas.style.left = cssX + 'px';
    sharedCanvas.style.top = cssY + 'px';
    sharedCanvas.style.display = 'block';
    oc.postMessage({
      type: 'show',
      score: Math.max(0, Math.floor(score) || 0),
      width: Math.round(cssW * dpr),
      height: Math.round(cssH * dpr)
    });
  } catch (e) {
    return false;
  }
  return true;
}

function hide() {
  OPEN = false;
  var oc = getOpen();
  if (!oc) return;
  try {
    sharedCanvas.style.display = 'none';
    oc.postMessage({ type: 'hide' });
  } catch (e) {}
}

module.exports = {
  show: show,
  hide: hide,
  isOpen: function () {
    return OPEN;
  }
};
