// js/ui/hud.js —— 局内渲染(背景/水果/粒子/HUD/暂停/过关/天赋三选一/机关)

var levelsMod = require('../levels');
var skillsMod = require('../skills');
var accountMod = require('../account');
var shared = require('../game/shared');
var SPECIAL_STYLE = shared.SPECIAL_STYLE;
var FRENZY_TOTAL = shared.FRENZY_TOTAL;
var TIPS = shared.TIPS;
var fmt = shared.fmt;

var DASH_ON = [8, 6];
var DASH_OFF = [];
var FLASH = [];
for (var fi = 0; fi <= 24; fi++) FLASH[fi] = 'rgba(229,57,53,' + (fi / 100).toFixed(2) + ')';

function flash(a) {
  var i = Math.round(a * 100);
  if (i < 0) i = 0;
  else if (i > 24) i = 24;
  return FLASH[i];
}

var proto = {};

proto.fmtCached = function (key, n) {
  var cache = this._fmt || (this._fmt = {});
  var slot = cache[key];
  if (!slot || slot.n !== n) {
    slot = { n: n, s: fmt(n) };
    cache[key] = slot;
  }
  return slot.s;
};

proto.hudFont = function (px) {
  var key = px;
  var cache = this._hudFonts || (this._hudFonts = {});
  var font = cache[key];
  if (!font) {
    font = px + 'px sans-serif';
    cache[key] = font;
  }
  return font;
};

proto.render = function () {
  var ctx = this.ctx;
  ctx.save();
  if (this.shakeTime > 0) {
    var m = this.shakeMag * (this.shakeTime / this.shakeDur);
    ctx.translate((Math.random() - 0.5) * 2 * m, (Math.random() - 0.5) * 2 * m);
  }
  this.drawBackground();
  this.drawDangerZone();
  this.drawFruits();
  this.drawParticles();
  this.drawPopups();
  if (this.started) {
    this.drawHud();
    this.drawBuffBadges();
  }
  this.drawInstruction();
  if (this.clearInfo) {
    this.drawClearOverlay();
  }
  if (!this.started && !this.panel) {
    this.drawStart();
  }
  if (this.over) {
    this.drawGameOver();
  }
  if (this.paused) {
    this.drawPauseOverlay();
  }
  if (this.perkChoices) {
    this.drawPerkDraft();
  }
  if (this.leaderboardOpen) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, this.W, this.H);
  }
  if (this.panel) {
    this.drawPanel();
  }
  if (this.collectionDetail !== null) {
    this.drawCollectionDetail();
  }
  if (this.noticeOpen) {
    this.drawNotice();
  }
  if (this.privacyOpen) {
    this.drawPrivacy();
  }
  this.drawToast();
  ctx.restore();
};

proto.drawToast = function () {
  if (!this.toastMsg) return;
  var ctx = this.ctx;
  var age = (Date.now() - this.toastAt) / 1000;
  if (age > 1.8) {
    this.toastMsg = null;
    return;
  }
  ctx.globalAlpha = age < 1.5 ? 1 : Math.max(0, 1 - (age - 1.5) / 0.3);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
  this.rr(this.W / 2 - 115, this.H - 96, 230, 40, 20);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(this.toastMsg, this.W / 2, this.H - 76);
  ctx.globalAlpha = 1;
};

proto.drawBackground = function () {
  var ctx = this.ctx;
  ctx.fillStyle = this.vGrad('bg|' + this.theme.bg[0] + '|' + this.theme.bg[1], 0, this.H, this.theme.bg[0], this.theme.bg[1]);
  ctx.fillRect(0, 0, this.W, this.H);

  if (this.theme.bgGlow) {
    var gx = this.W * (0.5 + 0.22 * Math.sin(this.time * 0.3));
    var gy = this.H * (0.32 + 0.12 * Math.cos(this.time * 0.4));
    var rg = ctx.createRadialGradient(gx, gy, 10, gx, gy, this.W * 0.75);
    rg.addColorStop(0, this.theme.bgGlow);
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, this.W, this.H);
  }

  var deco = this.theme.deco;
  ctx.font = '34px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (var i = 0; i < deco.length; i++) {
    ctx.globalAlpha = 0.1 + 0.05 * Math.sin(this.time * 1.5 + i * 1.3);
    ctx.fillText(deco[i][0], this.W * deco[i][1], this.H * deco[i][2] + Math.sin(this.time * 1.2 + i * 1.7) * 5);
  }
  ctx.globalAlpha = 1;

  var i, a;
  if (!this.lowPerf) {
    for (i = 0; i < this.ambient.length; i++) {
      a = this.ambient[i];
      ctx.globalAlpha = a.alpha * (0.75 + 0.25 * Math.sin(this.time * 2 + a.ph));
      if (a._fontR !== a.r) { a._fontR = a.r; a._font = a.r + 'px sans-serif'; }
      ctx.font = a._font;
      ctx.fillText(a.e, a.x, a.y);
    }
  }
  ctx.globalAlpha = 1;

  this.rr(3, 3, this.W - 6, this.floorY - 3, 14);
  ctx.fillStyle = this.theme.container;
  ctx.fill();
  ctx.strokeStyle = this.theme.containerStroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = this.vGrad('topShadow', 0, 46 * this.scale, 'rgba(93, 64, 55, 0.14)', 'rgba(93, 64, 55, 0)');
  ctx.fillRect(3, 3, this.W - 6, 46 * this.scale);

  ctx.fillStyle = 'rgba(93, 64, 55, 0.08)';
  ctx.beginPath();
  ctx.ellipse(this.W / 2, this.floorY + 8, this.W * 0.42, 18, 0, 0, Math.PI * 2);
  ctx.fill();
};

proto.drawDangerZone = function () {
  var ctx = this.ctx;
  ctx.fillStyle = this.vGrad('danger|' + this.theme.dangerFill + '|' + this.dangerLine, 0, this.dangerLine, this.theme.dangerFill, 'rgba(0,0,0,0)');
  ctx.fillRect(0, 0, this.W, this.dangerLine);
  ctx.strokeStyle = this.theme.dangerLine;
  ctx.lineWidth = 2;
  ctx.setLineDash(DASH_ON);
  ctx.beginPath();
  ctx.moveTo(0, this.dangerLine);
  ctx.lineTo(this.W, this.dangerLine);
  ctx.stroke();
  ctx.setLineDash(DASH_OFF);
  var wx = this.W - 26;
  ctx.beginPath();
  ctx.arc(wx, this.dangerLine - 12, 9, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚠', wx, this.dangerLine - 11);
  if (this.aboveTimer > 0.15) {
    var wa = 0.1 + 0.1 * Math.sin(this.time * 14);
    ctx.fillStyle = flash(wa);
    ctx.fillRect(0, 0, this.W, this.dangerLine);
  }
};

proto.drawFruits = function () {
  var ctx = this.ctx;
  var list = this.world.fruits;
  var i, f, base, rim;
  for (i = 0; i < list.length; i++) {
    f = list[i];
    if (f.dead) continue;
    if (f.kind !== 'fruit') {
      if (f.kind === 'block') {
        this.drawBlock(f);
      } else if (f.kind === 'pad') {
        this.drawPad(f);
      } else if (f.kind === 'belt') {
        this.drawBelt(f);
      } else if (f.kind === 'spike') {
        this.drawSpike(f);
      } else {
        this.drawSpecial(f);
      }
      if (f.iced) this.drawIced(f);
      continue;
    }
    base = this.fruitColor(f.type);
    rim = this.fruitRim(f.type);
    var popping = f.pop > 0 && !this.reducedMotion;
    var squashing = !popping && f.squash > 0 && !this.reducedMotion;
    if (popping || squashing) {
      var psx = popping ? (1 + 0.22 * f.pop) : (1 + 0.16 * f.squash);
      var psy = popping ? psx : (1 - 0.22 * f.squash);
      var ay = squashing ? f.y + f.r : f.y;
      ctx.save();
      ctx.translate(f.x, ay);
      ctx.scale(psx, psy);
      ctx.translate(-f.x, -ay);
    }
    if (!this.lowPerf) {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(f.x, f.y - 2, f.r, 0, Math.PI * 2);
    ctx.fillStyle = base;
    ctx.fill();
    ctx.lineWidth = Math.max(2, f.r * 0.08);
    ctx.strokeStyle = rim;
    ctx.stroke();
    if (this.highContrast) {
      ctx.beginPath();
      ctx.arc(f.x, f.y - 2, f.r + 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (f._fontR !== f.r) { f._fontR = f.r; f._font = (f.r * 1.35) + 'px sans-serif'; }
    ctx.font = f._font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.fruitEmoji(f.type), f.x, f.y - 1);
    if (this.colorblind) {
      if (f._cbFontR !== f.r) {
        f._cbFontR = f.r;
        f._cbFont = 'bold ' + Math.max(8, f.r * 0.5) + 'px sans-serif';
      }
      ctx.font = f._cbFont;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(String(f.type), f.x + f.r * 0.5, f.y + f.r * 0.5);
    }
    if (popping || squashing) ctx.restore();
    if (f.iced) this.drawIced(f);
  }
};

proto.drawIced = function (f) {
  var ctx = this.ctx;
  ctx.beginPath();
  ctx.arc(f.x, f.y, f.r + 2, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(190,229,255,0.9)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(f.x, f.y - 1, f.r * 0.75, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(190,229,255,0.28)';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(f.x - f.r * 0.45, f.y - f.r * 0.3);
  ctx.lineTo(f.x - f.r * 0.25, f.y - f.r * 0.45);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2;
  ctx.stroke();
};

proto.drawSpecial = function (f) {
  var ctx = this.ctx;
  var s = SPECIAL_STYLE[f.kind] || SPECIAL_STYLE.bomb;
  ctx.beginPath();
  ctx.arc(f.x, f.y + 2, f.r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
  ctx.fillStyle = s.color;
  ctx.fill();
  ctx.lineWidth = Math.max(2, f.r * 0.1);
  ctx.strokeStyle = s.rim;
  ctx.stroke();
  var maxFuse = f.kind === 'bomb' ? 1.4 : (f.kind === 'ice' ? 0.9 : 0.6);
  var ratio = Math.max(0, Math.min(1, f.fuse / maxFuse));
  ctx.beginPath();
  ctx.arc(f.x, f.y, f.r + 6, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2);
  ctx.strokeStyle = ratio > 0.5 ? '#ffa726' : '#e53935';
  ctx.lineWidth = 3;
  ctx.stroke();
  if (f._fontR !== f.r) { f._fontR = f.r; f._font = (f.r * 1.3) + 'px sans-serif'; }
  ctx.font = f._font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s.emoji, f.x, f.y - 1);
};

proto.drawParticles = function () {
  var ctx = this.ctx;
  var i, p;
  for (i = 0; i < this.particles.length; i++) {
    p = this.particles[i];
    var alpha = 1 - p.life / p.ttl;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

proto.drawPopups = function () {
  var ctx = this.ctx;
  var i, pp;
  for (i = 0; i < this.popups.length; i++) {
    pp = this.popups[i];
    var alpha = 1 - pp.life / pp.ttl;
    ctx.globalAlpha = alpha;
    ctx.font = pp.big ? 'bold 30px sans-serif' : 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = pp.color || '#d32f2f';
    if (pp.big) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      this.rr(pp.x - 130, pp.y - 22, 260, 44, 22);
      ctx.fill();
      ctx.fillStyle = pp.color || '#ffd54f';
    }
    ctx.fillText(pp.text, pp.x, pp.y);
  }
  ctx.globalAlpha = 1;
};

proto.drawHud = function () {
  var ctx = this.ctx;
  var sc = this.scale;

  ctx.fillStyle = this.vGrad('hudTop|' + (112 * sc), 0, 112 * sc, 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0)');
  ctx.fillRect(0, 0, this.W, 112 * sc);

  var cx0 = 10;
  var cy0 = 10;
  var cw = 132 * sc;
  var ch = 60 * sc;

  this.card(cx0, cy0, cw, ch, 14, this.theme.hudCard, this.theme.hudCardStroke, 'rgba(0,0,0,0.15)');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = '11px sans-serif';
  ctx.fillStyle = this.theme.hudSub;
  ctx.fillText('得分', cx0 + 10, cy0 + 7);
  ctx.font = 'bold 25px sans-serif';
  ctx.fillStyle = this.theme.hudText;
  ctx.fillText(this.fmtCached('score', this.score), cx0 + 10, cy0 + 22);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = this.theme.hudSub;
  ctx.fillText('最高 ' + this.fmtCached('best', this.best), cx0 + 10, cy0 + ch - 18);

  if (this.mode === 'classic') {
    var py0 = cy0 + ch + 8;
    var def = this.levelDef || levelsMod.getLevelDef(this.level);
    var ruleText = def.stage && def.stage.rule ? def.stage.sub : '';
    var ph0 = (ruleText ? 54 : 40) * sc;
    this.card(cx0, py0, cw, ph0, 12, this.theme.hudCard, this.theme.hudCardStroke, 'rgba(0,0,0,0.12)');
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = this.theme.hudText;
    ctx.fillText('第 ' + this.level + ' 关' + (def.isBoss ? ' ⚔️' : ''), cx0 + 10, py0 + 5);
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = this.theme.hudSub;
    ctx.fillText('·' + def.stage.name, cx0 + cw - 8, py0 + 6);
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = this.theme.hudSub;
    ctx.fillText('目标 ' + this.fmtCached('target', this.levelTarget), cx0 + 10, py0 + 22);
    if (ruleText) {
      ctx.fillStyle = this.theme.accent;
      ctx.fillText(ruleText, cx0 + 10, py0 + 34);
    }
    var bw0 = cw - 20;
    var bx0 = cx0 + 10;
    var byy = py0 + ph0 - 8;
    this.rr(bx0, byy, bw0, 5, 3);
    ctx.fillStyle = this.theme.hudSub + '55';
    ctx.fill();
    var frac = Math.min(1, this.levelProgress / this.levelTarget);
    if (frac > 0) {
      this.rr(bx0, byy, Math.max(6, bw0 * frac), 5, 3);
      ctx.fillStyle = this.theme.accent;
      ctx.fill();
    }
  }

  var mx = this.W / 2;
  var my = 44 * sc;

  if (this.mode === 'frenzy') {
    var ringR = 25 * sc;
    var fracF = Math.max(0, Math.min(1, this.frenzyLeft / FRENZY_TOTAL));
    ctx.beginPath();
    ctx.arc(mx, my, ringR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fracF);
    ctx.strokeStyle = this.frenzyLeft < 10 ? '#d32f2f' : this.theme.accent;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.lineCap = 'butt';
  ctx.textAlign = 'center';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = this.frenzyLeft < 10 ? '#d32f2f' : this.theme.hudText;
  ctx.fillText(Math.ceil(this.frenzyLeft) + 's', mx, my + ringR + 12);
  if (this.frenzyLeft < 5) {
    var lv = 0.12 + 0.12 * Math.sin(this.time * 16);
    ctx.strokeStyle = flash(lv);
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, this.W, this.H);
  }
  }

  ctx.beginPath();
  ctx.arc(mx, my, 20 * sc, 0, Math.PI * 2);
  ctx.fillStyle = this.muted ? 'rgba(0,0,0,0.28)' : this.theme.hudCard;
  ctx.fill();
  ctx.strokeStyle = this.theme.hudCardStroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = this.hudFont(18 * sc);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(this.muted ? '🔇' : '🔊', mx, my - 1);

  var pax = this.W / 2 + 56 * sc;
  ctx.beginPath();
  ctx.arc(pax, my, 17 * sc, 0, Math.PI * 2);
  ctx.fillStyle = this.theme.hudCard;
  ctx.fill();
  ctx.strokeStyle = this.theme.hudCardStroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = this.hudFont(15 * sc);
  ctx.fillStyle = this.theme.hudText;
  ctx.fillText('❚❚', pax, my - 1);

  var pxr = this.W - 10 - 82 * sc;
  var pyr = 10;
  var pwr = 82 * sc;
  var phr = 96 * sc;
  this.card(pxr, pyr, pwr, phr, 14, this.theme.hudCard, this.theme.hudCardStroke, 'rgba(0,0,0,0.15)');
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = this.theme.hudSub;
  ctx.fillText('下一个', pxr + pwr / 2, pyr + 7);
  this.drawPreview(pxr + pwr / 2, pyr + 34 * sc, this.nextType, 19 * sc, false);
  ctx.font = '10px sans-serif';
  ctx.fillStyle = this.theme.hudSub;
  ctx.fillText('再下一个', pxr + pwr / 2, pyr + 62 * sc);
  this.drawPreview(pxr + pwr / 2, pyr + 80 * sc, this.nextType2, 13 * sc, false);

  if (this.combo >= 2) {
    var cw2 = 92;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.card(this.W / 2 - cw2 / 2, 78 * sc, cw2, 24, 12, this.theme.accent, 'rgba(255,255,255,0.5)', 'rgba(0,0,0,0.2)');
    ctx.fillStyle = '#ffffff';
    ctx.fillText('连击 x' + this.combo, this.W / 2, 90 * sc);
    var fracC = this.comboWindow > 0 ? Math.max(0, Math.min(1, this.comboTimer / this.comboWindow)) : 0;
    this.rr(this.W / 2 - 46, 104 * sc, 92, 4, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fill();
    if (fracC > 0) {
      this.rr(this.W / 2 - 46, 104 * sc, 92 * fracC, 4, 2);
      ctx.fillStyle = this.theme.accent;
      ctx.fill();
    }
  }

  var sk = skillsMod.getById('hammer');
  var full = skillsMod.canCast(this.energy);
  var sx = this.W / 2;
  var sy = this.H - 150;
  ctx.beginPath();
  ctx.arc(sx, sy, 26, 0, Math.PI * 2);
  ctx.fillStyle = full ? 'rgba(255,152,0,0.92)' : 'rgba(0,0,0,0.28)';
  ctx.fill();
  ctx.strokeStyle = this.theme.hudCardStroke;
  ctx.lineWidth = 2;
  ctx.stroke();
  var ef = Math.max(0, Math.min(1, this.energy / skillsMod.ENERGY_MAX));
  ctx.beginPath();
  ctx.arc(sx, sy, 30, -Math.PI / 2, -Math.PI / 2 + ef * Math.PI * 2);
  ctx.strokeStyle = full ? '#ffd54f' : '#9e9e9e';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(sk.icon, sx, sy);
  this.skillBtn = full ? { x: sx - 32, y: sy - 32, w: 64, h: 64 } : null;
  this.shuffleBtn = null;
  if (full && skillsMod.unlocked('shuffle', accountMod.getState().level)) {
    var shx = sx - 74;
    ctx.beginPath();
    ctx.arc(shx, sy, 24, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(124,77,255,0.9)';
    ctx.fill();
    ctx.strokeStyle = this.theme.hudCardStroke;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('🪄', shx, sy);
    this.shuffleBtn = { x: shx - 28, y: sy - 28, w: 56, h: 56 };
  }
  this.meteorBtn = null;
  if (full && skillsMod.unlocked('meteor', accountMod.getState().level)) {
    var mtx = sx - 136;
    ctx.beginPath();
    ctx.arc(mtx, sy, 24, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,112,67,0.9)';
    ctx.fill();
    ctx.strokeStyle = this.theme.hudCardStroke;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('☄️', mtx, sy);
    this.meteorBtn = { x: mtx - 28, y: sy - 28, w: 56, h: 56 };
  }
  if (this.targeting) {
    ctx.beginPath();
    ctx.arc(sx, sy, 38 + 4 * Math.sin(this.time * 8), 0, Math.PI * 2);
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('点击目标位置', sx, sy - 46);
  }
};

proto.drawPauseOverlay = function () {
  var ctx = this.ctx;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, this.W, this.H);
  var cx = this.W / 2;
  var cy = this.H * 0.42;
  var w = 250;
  var h = 285;
  this.card(cx - w / 2, cy - h / 2, w, h, 20, 'rgba(24, 15, 10, 0.9)', 'rgba(255,255,255,0.25)', 'rgba(0,0,0,0.5)');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('游戏暂停', cx, cy - 100);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('本局 连击 ' + (this.runCtx ? this.runCtx.maxCombo : 0) + ' · 合成 ' + (this.statBuf ? this.statBuf.merges : 0) + ' · 天赋 ' + this.perksTaken.length, cx, cy - 74);
  var items = [
    { label: '▶ 继续游戏', y: cy - 46, act: 'resume', color: '#4caf50' },
    { label: '🔄 重开本局', y: cy + 6, act: 'restart', color: '#fb8c00' },
    { label: '🏠 返回主页', y: cy + 58, act: 'home', color: '#e53935' },
    { label: '🚪 退出游戏', y: cy + 110, act: 'exit', color: '#5d4037' }
  ];
  this.pauseBtns = [];
  var i, it, bw2, bh2;
  for (i = 0; i < items.length; i++) {
    it = items[i];
    bw2 = 190;
    bh2 = 42;
    this.card(cx - bw2 / 2, it.y - bh2 / 2, bw2, bh2, 21, it.color, 'rgba(255,255,255,0.25)', 'rgba(0,0,0,0.3)');
    ctx.font = 'bold 17px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(it.label, cx, it.y);
    this.pauseBtns.push({ x: cx - bw2 / 2, y: it.y - bh2 / 2, w: bw2, h: bh2, act: it.act });
  }
};

proto.drawBuffBadges = function () {
  var y = 120 * this.scale;  if (this.multiplierCharges > 0) {
    this.badgePill('⭐ 双倍 x' + this.multiplierCharges, '#f9a825', y);
    y += 28;
  }
  if (this.frozen > 0) {
    this.badgePill('❄ 冻结 ' + this.frozen.toFixed(1) + 's', '#0288d1', y);
  }
};

proto.drawPreview = function (x, y, type, r, withLabel) {
  var ctx = this.ctx;
  ctx.beginPath();
  ctx.arc(x, y + 2, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y - 1, r, 0, Math.PI * 2);
  ctx.fillStyle = this.fruitColor(type);
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.1);
  ctx.strokeStyle = this.fruitRim(type);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x - r * 0.32, y - r * 0.38, r * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();
  ctx.font = this.hudFont(r * 1.32);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(this.fruitEmoji(type), x, y - 1);
};

proto.drawInstruction = function () {
  if (this.over || !this.started || this.world.fruits.length > 0) return;
  var ctx = this.ctx;
  ctx.globalAlpha = 0.85;
  ctx.font = '15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = this.theme.hudSub;
  var base = Math.min(this.H - 26, this.safeBottom - 10);
  ctx.fillText('点击屏幕任意位置,水果从顶部掉落', this.W / 2, base);
  ctx.fillText('💣爆炸 🧊冻结 ⭐双倍 🧲磁吸', this.W / 2, base - 24);
  ctx.fillStyle = this.theme.hudSub;
  ctx.font = '12px sans-serif';
  ctx.fillText(TIPS[Math.floor(this.time / 6) % TIPS.length], this.W / 2, base - 46);
  if (this.tutorialTip) {
    ctx.fillStyle = '#ffd54f';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('👆 新手上路:点一下屏幕开始掉落', this.W / 2, base - 50);
  }
  if (this.graceDrops > 0) {
    ctx.fillStyle = '#81d4fa';
    ctx.font = '13px sans-serif';
    ctx.fillText('🛡 新手保护中(' + this.graceDrops + ' 次)不会因堆高结束', this.W / 2, base - 74);
  }
  ctx.globalAlpha = 1;
};

proto.drawClearOverlay = function () {
  if (!this.clearInfo) return;
  var ctx = this.ctx;
  var frac = 1 - Math.max(0, this.clearPause) / this.clearInfo.duration;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(0, 0, this.W, this.H);
  var cx = this.W / 2;
  var cy = this.H * 0.42;
  this.card(cx - 140, cy - 85, 280, 170, 20, 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0.3)', 'rgba(0,0,0,0.4)');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillStyle = '#ffe082';
  ctx.fillText('第 ' + this.clearInfo.level + ' 关通过!', cx, cy - 42);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText('目标达成 · 奖励 +' + this.clearInfo.bonus, cx, cy - 6);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.fillText('点击继续 → 第 ' + this.clearInfo.nextLevel + ' 关', cx, cy + 30);
  var bw = 180;
  var bx = cx - bw / 2;
  var by = cy + 52;
  this.rr(bx, by, bw, 6, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fill();
  this.rr(bx, by, bw * Math.min(1, frac), 6, 3);
  ctx.fillStyle = '#ffe082';
  ctx.fill();
};

proto.drawPerkDraft = function () {
  var ctx = this.ctx;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
  ctx.fillRect(0, 0, this.W, this.H);
  var rects = this.perkLayout();
  this.perkRects = rects;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#ffe082';
  var titleY = rects.length ? rects[0].y - 34 : this.H * 0.3;
  ctx.fillText('✨ 选择天赋 ✨', this.W / 2, titleY);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('点击卡片,永久强化本局', this.W / 2, titleY + 22);
  for (var i = 0; i < rects.length; i++) {
    var r = rects[i];
    var p = r.perk;
    var rare = p.rarity === 'rare';
    this.card(r.x, r.y, r.w, r.h, 14, rare ? 'rgba(255, 215, 0, 0.22)' : 'rgba(255,255,255,0.16)', rare ? 'rgba(255,215,0,0.7)' : 'rgba(255,255,255,0.35)', 'rgba(0,0,0,0.35)');
    ctx.textAlign = 'left';
    ctx.font = '26px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(p.icon, r.x + 16, r.y + r.h / 2);
    ctx.font = 'bold 17px sans-serif';
    ctx.fillStyle = '#ffe082';
    ctx.fillText(p.name, r.x + 56, r.y + 26);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(p.desc, r.x + 56, r.y + 50);
    if (rare) {
      ctx.textAlign = 'right';
      ctx.font = '11px sans-serif';
      ctx.fillStyle = 'rgba(255,215,0,0.9)';
      ctx.fillText('稀有', r.x + r.w - 12, r.y + 16);
      ctx.textAlign = 'left';
    }
  }
};

proto.drawBelt = function (f) {
  var ctx = this.ctx;
  var w = f.r * 2.4;
  var h = f.r * 0.7;
  ctx.fillStyle = '#455a64';
  ctx.fillRect(f.x - w / 2, f.y - h / 2, w, h);
  ctx.fillStyle = '#90a4ae';
  for (var i = -1; i <= 1; i++) {
    ctx.fillRect(f.x + i * f.r * 0.7 - 3, f.y - h / 2, 6, h);
  }
  ctx.font = this.hudFont(f.r * 0.9);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(f.dir > 0 ? '➡️' : '⬅️', f.x, f.y - 1);
};

proto.drawSpike = function (f) {
  var ctx = this.ctx;
  for (var k = -1; k <= 1; k++) {
    ctx.beginPath();
    ctx.moveTo(f.x + k * f.r * 0.6 - 8, f.y + f.r * 0.5);
    ctx.lineTo(f.x + k * f.r * 0.6, f.y - f.r * 0.5);
    ctx.lineTo(f.x + k * f.r * 0.6 + 8, f.y + f.r * 0.5);
    ctx.closePath();
    ctx.fillStyle = '#b0bec5';
    ctx.fill();
    ctx.strokeStyle = '#546e7a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
};

proto.drawBlock = function (f) {
  var ctx = this.ctx;
  ctx.beginPath();
  ctx.arc(f.x, f.y + 2, f.r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
  ctx.fillStyle = '#78909c';
  ctx.fill();
  ctx.lineWidth = Math.max(2, f.r * 0.12);
  ctx.strokeStyle = '#455a64';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(f.x - f.r * 0.4, f.y - f.r * 0.2);
  ctx.lineTo(f.x + f.r * 0.1, f.y + f.r * 0.1);
  ctx.lineTo(f.x - f.r * 0.1, f.y + f.r * 0.45);
  ctx.strokeStyle = 'rgba(38,50,56,0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = this.hudFont(f.r * 1.1);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('🧱', f.x, f.y);
};

proto.drawPad = function (f) {
  var ctx = this.ctx;
  ctx.beginPath();
  ctx.arc(f.x, f.y, f.r, Math.PI, 0);
  ctx.lineTo(f.x + f.r, f.y + f.r * 0.5);
  ctx.lineTo(f.x - f.r, f.y + f.r * 0.5);
  ctx.closePath();
  ctx.fillStyle = '#8d6e63';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#4e342e';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(f.x - f.r * 0.9, f.y);
  ctx.lineTo(f.x + f.r * 0.9, f.y);
  ctx.strokeStyle = '#ffca28';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.font = this.hudFont(f.r * 1.1);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('⬆️', f.x, f.y - f.r * 0.2);
};

module.exports = proto;
