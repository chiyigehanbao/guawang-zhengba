// js/ui/primitives.js —— Canvas 绘制基础件(圆角/卡片/渐变缓存/按钮/徽章/红点)

var shared = require('../game/shared');
var shade = shared.shade;

var proto = {};

// 渐变对象可跨帧复用;key 必须包含所有影响取色/坐标的输入
proto.cachedGrad = function (key, x0, y0, x1, y1, stops) {
  var cache = this._grads || (this._grads = {});
  var g = cache[key];
  if (!g) {
    g = this.ctx.createLinearGradient(x0, y0, x1, y1);
    for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    cache[key] = g;
  }
  return g;
};

proto.vGrad = function (key, y0, y1, c0, c1) {
  return this.cachedGrad(key, 0, y0, 0, y1, [[0, c0], [1, c1]]);
};

proto.drawMenuIcon = function (x, y, icon) {
  var ctx = this.ctx;
  ctx.beginPath();
  ctx.arc(x + 21, y + 21, 18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = '19px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(icon, x + 21, y + 22);
};

proto.drawBestChip = function (x, y, w, text) {
  var ctx = this.ctx;
  this.card(x, y, w, 22, 11, 'rgba(0,0,0,0.24)', 'rgba(255,255,255,0.16)', 'rgba(0,0,0,0.15)');
  ctx.fillStyle = '#ffe082';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + 11);
};

proto.drawGOButton = function (x, y, w, h, label, color) {
  var ctx = this.ctx;
  var g = this.cachedGrad('go|' + x + '|' + y + '|' + w + '|' + h + '|' + color, x, y, x, y + h, [[0, color], [1, shade(color, 0.8)]]);
  this.rr(x, y + 3, w, h, h / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();
  this.rr(x, y, w, h, h / 2);
  ctx.fillStyle = g;
  ctx.fill();
  this.rr(x, y, w, h, h / 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
};

proto.rr = function (x, y, w, h, r) {
  var ctx = this.ctx;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
};

proto.card = function (x, y, w, h, r, fill, stroke, shadow) {
  var ctx = this.ctx;
  // shadowBlur 在安卓 Canvas 上会退回软件光栅化,用偏移填充模拟投影
  if (shadow) {
    this.rr(x, y + 2, w, h, r);
    ctx.fillStyle = shadow;
    ctx.fill();
  }
  this.rr(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    this.rr(x, y, w, h, r);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
};

proto.badgePill = function (text, color, y) {
  var ctx = this.ctx;
  ctx.font = '13px sans-serif';
  var w = ctx.measureText(text).width + 22;
  var x = 12;
  this.card(x, y, w, 24, 12, color, 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.18)');
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 11, y + 12);
};

proto.drawTab = function (x, y, w, h, label, active) {
  var ctx = this.ctx;
  this.rr(x, y, w, h, 14);
  ctx.fillStyle = active ? '#e53935' : '#d7ccc8';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
};

proto.fmtTime = function (ts) {
  if (!ts) return '';
  var d = new Date(ts);
  var mm = ('0' + (d.getMonth() + 1)).slice(-2);
  var dd = ('0' + d.getDate()).slice(-2);
  var hh = ('0' + d.getHours()).slice(-2);
  var mi = ('0' + d.getMinutes()).slice(-2);
  return mm + '-' + dd + ' ' + hh + ':' + mi;
};

proto.drawDailyBtn = function (x, y, w, h, label, color) {
  var ctx = this.ctx;
  this.card(x, y, w, h, Math.min(18, h / 2), color, 'rgba(255,255,255,0.4)', 'rgba(0,0,0,0.2)');
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
};

proto.drawRedDot = function (x, y) {
  var ctx = this.ctx;
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#e53935';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
};

module.exports = proto;
