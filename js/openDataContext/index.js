// 开放数据域 —— 好友排行渲染
// 运行于独立的开放数据域上下文,仅可使用开放数据域 API(tt.getSharedCanvas/tt.onMessage/tt.getFriendCloudStorage)。
var sharedCanvas = tt.getSharedCanvas();
var ctx = sharedCanvas.getContext('2d');
var data = [];
var visible = false;

function getScore(item) {
  var v = 0;
  if (item && item.KVDataList) {
    for (var i = 0; i < item.KVDataList.length; i++) {
      if (item.KVDataList[i].key === 'score') {
        v = parseInt(item.KVDataList[i].value, 10) || 0;
      }
    }
  }
  return v;
}

function draw() {
  ctx.clearRect(0, 0, sharedCanvas.width, sharedCanvas.height);
  if (!visible) return;
  var W = sharedCanvas.width;
  var H = sharedCanvas.height;
  ctx.fillStyle = '#fff8e1';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#4e342e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold ' + Math.round(W * 0.07) + 'px sans-serif';
  ctx.fillText('🏆 好友排行', W / 2, Math.round(H * 0.05));
  if (!data.length) {
    ctx.font = Math.round(W * 0.045) + 'px sans-serif';
    ctx.fillStyle = '#a1887f';
    ctx.fillText('暂无好友数据', W / 2, Math.round(H * 0.45));
    ctx.fillText('拉上好友一起玩即可上榜', W / 2, Math.round(H * 0.55));
    return;
  }
  var startY = Math.round(H * 0.12);
  var rowH = Math.round(H * 0.13);
  var i, item, val, y;
  for (i = 0; i < data.length; i++) {
    item = data[i];
    val = getScore(item);
    y = startY + i * rowH;
    ctx.fillStyle = i === 0 ? '#ffe0b2' : '#ffffff';
    ctx.fillRect(6, y - rowH / 2, W - 12, rowH - 6);
    ctx.textAlign = 'left';
    ctx.font = 'bold ' + Math.round(W * 0.05) + 'px sans-serif';
    ctx.fillStyle = '#4e342e';
    ctx.fillText(String(i + 1) + '.', 18, y);
    ctx.fillText(item.nickname || '神秘玩家', 18 + Math.round(W * 0.09), y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#e53935';
    ctx.font = 'bold ' + Math.round(W * 0.055) + 'px sans-serif';
    ctx.fillText(String(val), W - 18, y);
  }
}

function load() {
  tt.getFriendCloudStorage({
    keyList: ['score'],
    success: function (res) {
      data = (res && res.data) ? res.data : [];
      data.sort(function (a, b) {
        return getScore(b) - getScore(a);
      });
      draw();
    },
    fail: function () {
      data = [];
      draw();
    }
  });
}

tt.onMessage(function (msg) {
  if (!msg) return;
  if (msg.type === 'show') {
    visible = true;
    if (msg.width && msg.height) {
      sharedCanvas.width = msg.width;
      sharedCanvas.height = msg.height;
    }
    load();
  } else if (msg.type === 'hide') {
    visible = false;
    draw();
  }
});
