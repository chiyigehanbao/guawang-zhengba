// js/ui/screens.js —— 全屏界面(主菜单/结算/公告/隐私/图鉴详情)

var fruitData = require('../fruits');
var achMod = require('../achievements');
var levelsMod = require('../levels');
var progMod = require('../progression');
var liveopsMod = require('../liveops');
var missionsMod = require('../missions');
var i18nMod = require('../i18n');
var shopMod = require('../shop');
var noticeMod = require('../notice');
var privacyMod = require('../privacy');
var recorderMod = require('../recorder');
var sidebarMod = require('../sidebar');
var shared = require('../game/shared');
var AGE_RATING = shared.AGE_RATING;
var HEALTH_NOTICE = shared.HEALTH_NOTICE;
var fmt = shared.fmt;
var shade = shared.shade;

var proto = {};

proto.drawStart = function () {
  var ctx = this.ctx;
  var L = this.menuLayout();

  ctx.fillStyle = this.cachedGrad('menuDim|' + this.H, 0, 0, 0, this.H, [
    [0, 'rgba(0,0,0,0.28)'],
    [0.5, 'rgba(0,0,0,0.14)'],
    [1, 'rgba(0,0,0,0.38)']
  ]);
  ctx.fillRect(0, 0, this.W, this.H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  var ty = this.H * 0.12;
  var tpw = 280;
  var tpy = ty - 30;
  var pulse = 1 + 0.018 * Math.sin(this.time * 2.4);
  this.card(this.W / 2 - tpw / 2, tpy, tpw, 60, 30, 'rgba(0,0,0,0.35)', 'rgba(255,215,130,0.35)', 'rgba(0,0,0,0.45)');

  ctx.save();
  ctx.translate(this.W / 2, ty - 2);
  ctx.scale(pulse, pulse);
  var title = i18nMod.t('menu.title', '🍉 瓜王争霸');
  var tg = ctx.createLinearGradient(0, -20, 0, 18);
  tg.addColorStop(0, '#fff3b0');
  tg.addColorStop(0.5, '#ffd54f');
  tg.addColorStop(1, '#ff9800');
  ctx.font = 'bold 29px sans-serif';
  ctx.fillStyle = 'rgba(255, 152, 0, 0.55)';
  ctx.fillText(title, 0, 3);
  ctx.fillStyle = tg;
  ctx.fillText(title, 0, 0);
  ctx.restore();

  var shx = ((this.time * 90) % (tpw + 120)) - 60;
  var sg2 = ctx.createLinearGradient(this.W / 2 - tpw / 2 + shx, 0, this.W / 2 - tpw / 2 + shx + 50, 0);
  sg2.addColorStop(0, 'rgba(255,255,255,0)');
  sg2.addColorStop(0.5, 'rgba(255,255,255,0.4)');
  sg2.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sg2;
  ctx.fillRect(this.W / 2 - tpw / 2 + 6, tpy + 8, tpw - 12, 30);

  var sps = [[-tpw / 2 - 14, 6], [tpw / 2 + 14, -2], [-tpw / 2 + 8, 32], [tpw / 2 - 10, 30]];
  for (var si = 0; si < sps.length; si++) {
    ctx.globalAlpha = 0.5 + 0.4 * Math.sin(this.time * 2.6 + si * 1.9);
    ctx.font = '14px sans-serif';
    ctx.fillText('✨', this.W / 2 + sps[si][0], ty - 2 + sps[si][1]);
  }
  ctx.globalAlpha = 1;

  ctx.font = '13px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText('相同水果接触即合成更高等级', this.W / 2, ty + 32);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = 'rgba(255,220,160,0.92)';
  ctx.fillText('💣爆炸 🧊冻结 ⭐双倍 🧲磁吸', this.W / 2, ty + 55);

  var sy = this.H * 0.28;
  this.card(this.W / 2 - 68, sy - 26, 136, 26, 13, 'rgba(0,0,0,0.32)', 'rgba(255,255,255,0.2)', 'rgba(0,0,0,0.25)');
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#ffe082';
  ctx.fillText('⬇ 即将掉落', this.W / 2, sy - 13);

  var bob = Math.sin(this.time * 3) * 5;
  var fx = this.W / 2;
  var fy = sy + 52 + bob;
  var gr = ctx.createRadialGradient(fx, fy, 8, fx, fy, 76);
  gr.addColorStop(0, 'rgba(255,255,255,0.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.arc(fx, fy, 76, 0, Math.PI * 2);
  ctx.fill();
  this.drawPreview(fx, fy, this.nextType, 34, false);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('点击下方模式按钮开始 · 预览你的下一颗水果', this.W / 2, sy + 110);

  var by = L.by;
  var bw = L.bw;
  this.drawModeButton(16, by, bw, i18nMod.t('mode.classic', '经典闯关'), i18nMod.t('mode.classic.sub', '关卡 · 特殊球 · 策略'), '#e53935');
  this.drawModeButton(32 + bw, by, bw, i18nMod.t('mode.frenzy', '限时狂热'), i18nMod.t('mode.frenzy.sub', '60 秒极限冲分'), '#ff7043');

  this.drawBestChip(16, by + 78, bw, '经典最高 ' + fmt(this.classicBest));
  this.drawBestChip(32 + bw, by + 78, bw, '狂热最高 ' + fmt(this.frenzyBest));

  var ry = L.ry;
  var bw3 = L.bw3;
  var bx0 = L.bx0;
  this.menuBtns = [
    { x: bx0, w: bw3, act: 'ach' },
    { x: bx0 + bw3 + 10, w: bw3, act: 'rank' },
    { x: bx0 + 2 * (bw3 + 10), w: bw3, act: 'theme' }
  ];
  this.card(bx0, ry, bw3, 32, 16, 'rgba(0,0,0,0.32)', 'rgba(255,255,255,0.2)', 'rgba(0,0,0,0.2)');
  this.card(bx0 + bw3 + 10, ry, bw3, 32, 16, 'rgba(0,0,0,0.32)', 'rgba(255,255,255,0.2)', 'rgba(0,0,0,0.2)');
  this.card(bx0 + 2 * (bw3 + 10), ry, bw3, 32, 16, 'rgba(0,0,0,0.32)', 'rgba(255,255,255,0.2)', 'rgba(0,0,0,0.2)');
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(i18nMod.t('menu.ach', '🏆 成就'), bx0 + bw3 / 2, ry + 16);
  ctx.fillText(i18nMod.t('menu.rank', '👥 排行'), bx0 + bw3 + 10 + bw3 / 2, ry + 16);
  ctx.fillText(i18nMod.t('menu.theme', '🎨 主题'), bx0 + 2 * (bw3 + 10) + bw3 / 2, ry + 16);

  var title = achMod.getTitle(achMod.getUnlockedCount());
  ctx.font = '13px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('称号:『' + title + '』 · 成就 ' + achMod.getUnlockedCount() + ' / ' + achMod.getList().length, this.W / 2, ry + 50);

  var gy = L.gy;
  this.card(this.W / 2 - 150, gy, 300, 30, 15, 'rgba(0,0,0,0.32)', 'rgba(255,215,130,0.3)', 'rgba(0,0,0,0.2)');
  ctx.textAlign = 'left';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(i18nMod.t('menu.growth', '⚙ 成长养成'), this.W / 2 - 136, gy + 16);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd54f';
  ctx.fillText('🪙 ' + fmt(progMod.getCoins()), this.W / 2 + 138, gy + 16);
  ctx.textAlign = 'center';

  var gy2 = L.gy2;
  this.card(this.W / 2 - 150, gy2, 300, 30, 15, 'rgba(0,0,0,0.32)', 'rgba(130,200,255,0.3)', 'rgba(0,0,0,0.2)');
  ctx.textAlign = 'left';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(i18nMod.t('menu.daily', '📅 每日挑战'), this.W / 2 - 136, gy2 + 16);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#82c8ff';
  var dchk = liveopsMod.getDaily();
  ctx.fillText(dchk.icon + ' ' + (liveopsMod.isDailyDone(dchk.key) ? '已完成' : '待完成'), this.W / 2 + 138, gy2 + 16);
  ctx.textAlign = 'center';

  var gy3 = L.gy3;
  this.card(this.W / 2 - 150, gy3, 300, 30, 15, 'rgba(0,0,0,0.32)', 'rgba(180,150,255,0.3)', 'rgba(0,0,0,0.2)');
  ctx.textAlign = 'left';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(i18nMod.t('menu.missions', '📜 任务'), this.W / 2 - 136, gy3 + 16);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#c3a6ff';
  var mClaim = missionsMod.claimableCount();
  ctx.fillText(mClaim > 0 ? ('可领取 ' + mClaim) : '进行中', this.W / 2 + 138, gy3 + 16);
  ctx.textAlign = 'center';

  var gy4 = L.gy4;
  this.card(this.W / 2 - 150, gy4, 300, 30, 15, 'rgba(0,0,0,0.32)', 'rgba(255,180,120,0.3)', 'rgba(0,0,0,0.2)');
  ctx.textAlign = 'left';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(i18nMod.t('menu.shop', '🛒 金币商店'), this.W / 2 - 136, gy4 + 16);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffcc80';
  var adLeft = shopMod.adLeftToday();
  ctx.fillText(adLeft > 0 ? ('免费金币 ' + adLeft + ' 次') : '道具 · 兑换', this.W / 2 + 138, gy4 + 16);
  ctx.textAlign = 'center';

  var flags = this.claimableFlags();
  if (flags.daily) this.drawRedDot(this.W / 2 + 134, gy2 + 15);
  if (flags.missions) this.drawRedDot(this.W / 2 + 134, gy3 + 15);

  this.menuIcons = {
    profile: { x: 8, y: 8, w: 42, h: 42 },
    settings: { x: this.W - 50, y: 8, w: 42, h: 42 },
    welfare: this.hasWelfare() ? { x: this.W - 100, y: 8, w: 42, h: 42 } : null
  };
  this.drawMenuIcon(8, 8, '👤');
  this.drawMenuIcon(this.W - 50, 8, '⚙');
  if (this.menuIcons.welfare) {
    this.drawMenuIcon(this.W - 100, 8, '🎁');
    if (sidebarMod.canClaim()) this.drawRedDot(this.W - 66, 14);
  }
  this.drawAgeBadge(58, 16);
  this.drawHealthNotice();
};

proto.drawAgeBadge = function (x, y) {
  var ctx = this.ctx;
  this.card(x, y, 36, 26, 6, '#2e7d32', 'rgba(255,255,255,0.7)', null);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(AGE_RATING, x + 18, y + 13);
};

proto.drawHealthNotice = function () {
  var ctx = this.ctx;
  var y = Math.min(this.safeBottom, this.H) - 30;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '10px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (var i = 0; i < HEALTH_NOTICE.length; i++) {
    ctx.fillText(HEALTH_NOTICE[i], this.W / 2, y + i * 14);
  }
};

proto.drawModeButton = function (x, y, w, title, sub, color) {
  var ctx = this.ctx;
  var g = this.cachedGrad('mode|' + x + '|' + y + '|' + w + '|' + color, x, y, x, y + 70, [[0, color], [1, shade(color, 0.78)]]);
  this.rr(x, y + 4, w, 70, 16);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fill();
  this.rr(x, y, w, 70, 16);
  ctx.fillStyle = g;
  ctx.fill();
  this.rr(x + 4, y + 4, w - 8, 26, 13);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fill();
  this.rr(x, y, w, 70, 16);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, x + w / 2, y + 27);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText(sub, x + w / 2, y + 53);
};

proto.drawGameOver = function () {
  var ctx = this.ctx;
  ctx.fillStyle = this.vGrad('gameover|' + this.H, 0, this.H, 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.75)');
  ctx.fillRect(0, 0, this.W, this.H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  var cy = this.H / 2 - 138;
  ctx.font = 'bold 34px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('游戏结束', this.W / 2, cy);
  ctx.font = '15px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  if (this.mode === 'frenzy') {
    ctx.fillText('限时狂热点结束', this.W / 2, cy + 36);
  } else {
    var st = levelsMod.getStage(this.level);
    ctx.fillText('到达第 ' + this.level + ' 关 · 第 ' + (st.idx + 1) + ' 章「' + st.name + '」', this.W / 2, cy + 36);
  }

  if (this.newBest) {
    var nb = this.W / 2 - 66;
    this.card(nb, cy + 54, 132, 26, 13, '#ffd54f', 'rgba(255,255,255,0.6)', 'rgba(0,0,0,0.3)');
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#7a4d00';
    ctx.fillText('🎉 新纪录!', this.W / 2, cy + 67);
  }

  var cw = 250;
  var cx = this.W / 2 - cw / 2;
  var ccy = cy + 92;
  this.card(cx, ccy, cw, 118, 18, 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0.28)', 'rgba(0,0,0,0.4)');
  ctx.font = '14px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('本次得分', this.W / 2, ccy + 24);
  ctx.font = 'bold 36px sans-serif';
  ctx.fillStyle = '#ffe082';
  ctx.fillText(fmt(this.score), this.W / 2, ccy + 62);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('最高纪录 ' + fmt(this.best), this.W / 2, ccy + 96);
  ctx.font = '11px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('本局 连击 ' + (this.runCtx ? this.runCtx.maxCombo : 0) + ' · 合成 ' + (this.statBuf ? this.statBuf.merges : 0) + ' · 天赋 ' + this.perksTaken.length, this.W / 2, ccy + 112);

  var btnY1 = cy + 226;
  this.drawGOButton(this.W / 2 - 170, btnY1, 150, 50, '再来一局', '#ff7043');
  this.drawGOButton(this.W / 2 + 20, btnY1, 150, 50, '主菜单', '#8d6e63');

  var btnY2 = btnY1 + 60;
  this.drawGOButton(this.W / 2 - 170, btnY2, 150, 38, recorderMod.hasVideo() ? '🎬 分享录屏' : '📤 分享成绩', '#66bb6a');
  this.drawGOButton(this.W / 2 + 20, btnY2, 150, 38, '👥 好友排行', '#5c6bc0');

  var btnY3 = btnY2 + 48;
  var reviveCards = shopMod.count('revive');
  var reviveLabel = this.revivedThisRun ? '已复活' : (reviveCards > 0 ? ('💗 复活卡 ×' + reviveCards) : '📺 广告复活');
  this.drawGOButton(this.W / 2 - 170, btnY3, 150, 40, reviveLabel, this.revivedThisRun ? '#bcaaa4' : '#e91e63');
  this.drawGOButton(this.W / 2 + 20, btnY3, 150, 40, this.coinsDoubled ? '📺 金币已翻倍' : '📺 金币 ×2', this.coinsDoubled ? '#bcaaa4' : '#f9a825');
};

proto.menuLayout = function () {
  var by = Math.max(this.H * 0.42, this.H * 0.28 + 130);
  var ry = by + 122;
  // 小屏自适应:压缩按钮间距,保证第 4 行按钮结束不越过地板
  var step = this.H >= 800 ? 38 : 24;
  var g0 = this.H >= 800 ? 72 : 58;
  var maxGy4 = this.floorY - 40;
  g0 = Math.max(8, Math.min(g0, maxGy4 - ry - 3 * step));
  var gy = ry + g0;
  var gy2 = gy + step;
  var gy3 = gy2 + step;
  var gy4 = gy3 + step;
  var bw = (this.W - 48) / 2;
  var bw3 = (this.W - 48 - 20) / 3;
  var bx0 = 24;
  return { by: by, ry: ry, gy: gy, gy2: gy2, gy3: gy3, gy4: gy4, bw: bw, bw3: bw3, bx0: bx0 };
};

proto.drawCollectionDetail = function () {
  var ctx = this.ctx;
  var t = this.collectionDetail;
  var type = fruitData.TYPES[t];
  var cnt = achMod.getFruitCount(t);
  var unlocked = !!achMod.getCollection()[t];
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, this.W, this.H);
  var w = 280;
  var h = 260;
  var cx = this.W / 2;
  var cy = this.H / 2;
  this.card(cx - w / 2, cy - h / 2, w, h, 18, '#fffaf0', 'rgba(93,64,55,0.4)', 'rgba(0,0,0,0.4)');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '50px sans-serif';
  ctx.fillStyle = this.fruitColor(t);
  ctx.fillText(unlocked ? type.emoji : '❓', cx, cy - 62);
  ctx.font = 'bold 17px sans-serif';
  ctx.fillStyle = '#4e342e';
  ctx.fillText(unlocked ? type.name : '未解锁', cx, cy - 14);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#8d6e63';
  ctx.fillText('等级 type ' + t + ' · 基础分 ' + type.score, cx, cy + 8);
  ctx.fillText('累计合成 ' + cnt + ' 次' + (cnt >= 50 ? '(★ 精通)' : ''), cx, cy + 28);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#5d4037';
  if (unlocked) {
    ctx.fillText('合成自: ' + (t > 0 ? fruitData.TYPES[t - 1].emoji + ' ×2' : '直接掉落'), cx, cy + 50);
    ctx.fillText('下一步: ' + (t < 10 ? type.emoji + ' ×2 → ' + fruitData.TYPES[t + 1].emoji + ' ' + fruitData.TYPES[t + 1].name : '已是最高级 👑'), cx, cy + 70);
  } else {
    ctx.fillText('先合成出 ta 就能解锁', cx, cy + 50);
  }
  ctx.fillStyle = '#a1887f';
  ctx.fillText('点击任意处关闭', cx, cy + 96);
};

proto.drawNotice = function () {
  var ctx = this.ctx;
  var n = noticeMod.get();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, this.W, this.H);
  var w = Math.min(320, this.W - 40);
  var h = 250;
  var cx = this.W / 2;
  var cy = this.H / 2;
  this.card(cx - w / 2, cy - h / 2, w, h, 18, '#fffaf0', 'rgba(93,64,55,0.4)', 'rgba(0,0,0,0.4)');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#4e342e';
  ctx.fillText(n.title, cx, cy - h / 2 + 30);
  ctx.textAlign = 'left';
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#6d4c41';
  for (var i = 0; i < n.lines.length; i++) {
    ctx.fillText('· ' + n.lines[i], cx - w / 2 + 18, cy - h / 2 + 66 + i * 26);
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#a1887f';
  ctx.fillText('点击任意处关闭', cx, cy + h / 2 - 22);
};

proto.drawPrivacy = function () {
  var ctx = this.ctx;
  var t = privacyMod.TEXT;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, this.W, this.H);
  var w = Math.min(330, this.W - 32);
  var h = 260;
  var cx = this.W / 2;
  var cy = this.H / 2;
  var top = cy - h / 2;
  this.card(cx - w / 2, top, w, h, 18, '#fffaf0', 'rgba(93,64,55,0.4)', 'rgba(0,0,0,0.4)');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#4e342e';
  ctx.fillText(t.title, cx, top + 30);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#6d4c41';
  for (var i = 0; i < t.lines.length; i++) {
    ctx.fillText(t.lines[i], cx, top + 66 + i * 24);
  }
  var bw = (w - 48) / 2;
  var bh = 40;
  var by = top + h - bh - 18;
  this.privacyBtns = [
    { x: cx - w / 2 + 16, y: by, w: bw, h: bh, act: 'decline' },
    { x: cx + 8, y: by, w: bw, h: bh, act: 'agree' }
  ];
  this.card(this.privacyBtns[0].x, by, bw, bh, 20, '#d7ccc8', null, null);
  this.card(this.privacyBtns[1].x, by, bw, bh, 20, '#43a047', null, null);
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#5d4037';
  ctx.fillText('不同意', this.privacyBtns[0].x + bw / 2, by + bh / 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('同意并继续', this.privacyBtns[1].x + bw / 2, by + bh / 2);
};

module.exports = proto;
