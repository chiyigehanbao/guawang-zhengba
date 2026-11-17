// js/ui/panels-economy.js —— 养成与经济类面板(成长/每日/周赛/任务/商店/主题/福利/清档)

var themesMod = require('../themes');
var progMod = require('../progression');
var liveopsMod = require('../liveops');
var missionsMod = require('../missions');
var dailytasksMod = require('../dailytasks');
var seasonboardMod = require('../seasonboard');
var weeklytasksMod = require('../weeklytasks');
var skillupMod = require('../skillup');
var shopMod = require('../shop');
var weekeventMod = require('../weekevent');
var gpexMod = require('../gpexchange');
var sidebarMod = require('../sidebar');
var shortcutMod = require('../shortcut');
var shared = require('../game/shared');
var fmt = shared.fmt;

var proto = {};

proto.drawThemeGrid = function (px, cy, pw, ch) {
  var ctx = this.ctx;
  var list = themesMod.getList();
  var current = themesMod.getThemeId();
  var cols = 2;
  var gap = 12;
  var cardW = (pw - gap * (cols + 1)) / cols;
  var cardH = (ch - gap * (list.length / cols + 1)) / (list.length / cols);
  cardH = Math.min(96, cardH);
  this.themeCards = [];
  var i, t, c, x, y, g, nameColor, status;
  for (i = 0; i < list.length; i++) {
    t = list[i];
    c = i % cols;
    x = px + gap + c * (cardW + gap);
    y = cy + gap + Math.floor(i / cols) * (cardH + gap);
    this.themeCards.push({ x: x, y: y, w: cardW, h: cardH, id: t.id });
    this.rr(x, y, cardW, cardH, 12);
    g = ctx.createLinearGradient(x, y, x, y + cardH);
    g.addColorStop(0, t.bg[0]);
    g.addColorStop(1, t.bg[1]);
    ctx.fillStyle = g;
    ctx.fill();
    this.rr(x, y, cardW, cardH, 12);
    ctx.strokeStyle = t.id === current ? '#e53935' : 'rgba(93, 64, 55, 0.35)';
    ctx.lineWidth = t.id === current ? 3 : 1.5;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 17px sans-serif';
    nameColor = t.id === 'classic' ? '#4e342e' : '#ffffff';
    ctx.fillStyle = nameColor;
    ctx.fillText(t.name, x + cardW / 2, y + cardH / 2 - 6);
    ctx.font = '12px sans-serif';
    if (t.id === current) {
      ctx.fillStyle = '#4caf50';
      status = '使用中';
    } else if (themesMod.isUnlocked(t.id)) {
      ctx.fillStyle = '#ffffff';
      status = '点击使用';
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      status = '🔒 ' + t.ach + ' 成就';
      if (t.cost) status += ' / 🪙' + t.cost;
    }
    ctx.fillText(status, x + cardW / 2, y + cardH / 2 + 14);
  }
};

proto.drawGrowth = function (px, cy, pw, ch) {
  var ctx = this.ctx;
  var coins = progMod.getCoins();
  var combined = [];
  var i;
  for (i = 0; i < progMod.UPGRADES.length; i++) combined.push({ u: progMod.UPGRADES[i], mod: progMod, section: 'permanent' });
  for (i = 0; i < skillupMod.UPGRADES.length; i++) combined.push({ u: skillupMod.UPGRADES[i], mod: skillupMod, section: 'skill' });
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#795548';
  ctx.fillText('金币余额', px + 8, cy + 12);
  ctx.textAlign = 'right';
  ctx.font = 'bold 17px sans-serif';
  ctx.fillStyle = '#f9a825';
  ctx.fillText('🪙 ' + fmt(coins), px + pw - 8, cy + 12);
  ctx.textAlign = 'left';
  var gap = 5;
  var startY = cy + 32;
  var cardH = Math.min(58, (ch - 40 - gap * combined.length) / combined.length);
  this.growthCards = [];
  var prevSection = null;
  for (i = 0; i < combined.length; i++) {
    var u = combined[i].u;
    var mod = combined[i].mod;
    var y = startY + i * (cardH + gap);
    if (combined[i].section !== prevSection) {
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = combined[i].section === 'permanent' ? '#558b2f' : '#3949ab';
      ctx.fillText(combined[i].section === 'permanent' ? '⚙ 永久升级' : '✦ 技能升级', px + 8, y - 4);
      prevSection = combined[i].section;
    }
    this.growthCards.push({ x: px + 6, y: y, w: pw - 12, h: cardH - 4, id: u.id });
    var lvl = mod.getLevel(u.id);
    var maxed = lvl >= u.max;
    this.card(px + 6, y, pw - 12, cardH - 4, 9, maxed ? '#e8f5e9' : '#faf7f2', maxed ? 'rgba(139,195,74,0.5)' : 'rgba(93,64,55,0.18)', 'rgba(0,0,0,0.06)');
    ctx.textAlign = 'left';
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#4e342e';
    ctx.fillText(u.icon, px + 14, y + (cardH - 4) / 2);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(u.name + '  ' + lvl + '/' + u.max, px + 42, y + 15);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#8d6e63';
    ctx.fillText(u.desc, px + 42, y + 31);
    ctx.textAlign = 'right';
    if (maxed) {
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#66bb6a';
      ctx.fillText('✓ 满级', px + pw - 12, y + (cardH - 4) / 2);
    } else {
      var cost = mod.costOf(u.id, lvl);
      var afford = coins >= cost;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = afford ? '#f9a825' : '#bcaaa4';
      ctx.fillText('🪙' + fmt(cost), px + pw - 12, y + 15);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = afford ? '#8bc34a' : '#d0c2b4';
      ctx.fillText(afford ? '点击升级' : '金币不足', px + pw - 12, y + 31);
    }
    ctx.textAlign = 'left';
  }
};

proto.drawDaily = function (px, cy, pw, ch) {
  var ctx = this.ctx;
  var key = liveopsMod.dayKey();
  var daily = liveopsMod.getDaily(key);
  var done = liveopsMod.isDailyDone(key);
  var rec = liveopsMod.getDailyRecord();
  var claimed = rec.key === key && rec.claimed;
  var ck = liveopsMod.getCheckin();
  var checkedToday = liveopsMod.isCheckedToday(key);
  var streak = ck.streak;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  var cardY = cy + 4;
  var cardH = 92;
  this.card(px + 6, cardY, pw - 12, cardH, 12, 'rgba(255,255,255,0.55)', 'rgba(93,64,55,0.2)', 'rgba(0,0,0,0.08)');
  ctx.font = '24px sans-serif';
  ctx.fillStyle = '#4e342e';
  ctx.fillText(daily.icon, px + 18, cardY + 30);
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(daily.name, px + 54, cardY + 24);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#8d6e63';
  ctx.fillText(daily.desc, px + 54, cardY + 46);
  ctx.font = '11px sans-serif';
  ctx.fillStyle = done ? '#66bb6a' : '#a1887f';
  ctx.fillText(claimed ? '✅ 已完成并领奖' : (done ? '✅ 已完成,待领奖' : '⬜ 未完成'), px + 54, cardY + 66);

  var btnW = pw - 24;
  var bx = px + 12;
  var startY = cardY + cardH + 12;
  this.dailyBtns = {};
  var rrW = 92;
  var mainW = btnW - rrW - 8;
  this.drawDailyBtn(bx, startY, mainW, 38, '▶ 开始挑战', '#ff7043');
  this.dailyBtns.start = { x: bx, y: startY, w: mainW, h: 38 };
  var rerolled = liveopsMod.hasRerolled(key);
  this.drawDailyBtn(bx + mainW + 8, startY, rrW, 38, rerolled ? '🔄 已换' : '🔄 换一个', rerolled ? '#bcaaa4' : '#5c6bc0');
  this.dailyBtns.reroll = rerolled ? null : { x: bx + mainW + 8, y: startY, w: rrW, h: 38 };

  var claimY = startY + 46;
  if (done && !claimed) {
    var halfW = (btnW - 8) / 2;
    this.drawDailyBtn(bx, claimY, halfW, 34, '🏅 领取奖励', '#66bb6a');
    this.dailyBtns.claim = { x: bx, y: claimY, w: halfW, h: 34 };
    this.drawDailyBtn(bx + halfW + 8, claimY, halfW, 34, '📺 双倍', '#f9a825');
    this.dailyBtns.double = { x: bx + halfW + 8, y: claimY, w: halfW, h: 34 };
  } else {
    this.drawDailyBtn(bx, claimY, btnW, 34, claimed ? '🏅 奖励已领取' : '🏅 领取挑战奖励', '#bcaaa4');
    this.dailyBtns.claim = null;
    this.dailyBtns.double = null;
  }

  var ciY = claimY + 46;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#4e342e';
  ctx.textAlign = 'left';
  ctx.fillText('每日签到 · 连续 ' + streak + ' 天', px + 14, ciY + 8);
  var dotY = ciY + 34;
  var dotW = (pw - 28) / 7;
  var marked = checkedToday ? ((streak - 1) % 7) : -1;
  for (var i = 0; i < 7; i++) {
    var cx = px + 14 + i * dotW + dotW / 2;
    var filled = i <= marked;
    ctx.beginPath();
    ctx.arc(cx, dotY, 11, 0, Math.PI * 2);
    ctx.fillStyle = filled ? '#ffd54f' : 'rgba(0,0,0,0.12)';
    ctx.fill();
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#5d4037';
    ctx.fillText('🪙', cx, dotY);
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  var ckY = dotY + 26;
  this.drawDailyBtn(px + 12, ckY, pw - 24, 34, (checkedToday ? '✔ 今日已签到' : '🎁 签到领取'), checkedToday ? '#bcaaa4' : '#5c6bc0');
  this.dailyBtns.checkin = checkedToday ? null : { x: px + 12, y: ckY, w: pw - 24, h: 34 };
  this.drawWeekEventCard(px, ckY + 46, pw);
};

proto.drawTaskRows = function (px, y, pw, list, gap, accent) {
  var ctx = this.ctx;
  var cardH = 40;
  var i, m, rec, barX, barW, barY, frac, rowY;
  for (i = 0; i < list.length; i++) {
    m = list[i];
    rowY = y + i * (cardH + gap);
    rec = { x: px + 6, y: rowY, w: pw - 12, h: cardH, id: m.id, btn: null };
    this.missionCards.push(rec);
    this.card(px + 6, rowY, pw - 12, cardH, 10, m.claimed ? '#e8f5e9' : '#faf7f2', m.claimed ? 'rgba(139,195,74,0.5)' : 'rgba(93,64,55,0.18)', 'rgba(0,0,0,0.08)');
    ctx.textAlign = 'left';
    ctx.font = '17px sans-serif';
    ctx.fillStyle = '#4e342e';
    ctx.fillText(m.icon, px + 14, rowY + cardH / 2);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(m.name, px + 38, rowY + 14);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#8d6e63';
    ctx.fillText(m.desc, px + 38, rowY + 27);
    barX = px + 38;
    barW = pw - 12 - 38 - 68;
    barY = rowY + cardH - 6;
    this.rr(barX, barY, barW, 4, 2);
    ctx.fillStyle = '#e5d7c8';
    ctx.fill();
    frac = Math.min(1, m.progress / m.target);
    if (frac > 0) {
      this.rr(barX, barY, Math.max(3, barW * frac), 4, 2);
      ctx.fillStyle = accent;
      ctx.fill();
    }
    ctx.textAlign = 'right';
    if (m.claimed) {
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#66bb6a';
      ctx.fillText('✓ 已领', px + pw - 14, rowY + cardH / 2);
    } else if (m.done) {
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#f9a825';
      ctx.fillText('🪙' + m.reward, px + pw - 14, rowY + 14);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#8bc34a';
      ctx.fillText('点击领取', px + pw - 14, rowY + 27);
      rec.btn = { x: px + pw - 84, y: rowY + 3, w: 74, h: cardH - 6 };
    } else {
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#a1887f';
      ctx.fillText(m.progress + '/' + m.target, px + pw - 14, rowY + cardH / 2);
    }
    ctx.textAlign = 'left';
  }
  return y + list.length * (cardH + gap);
};

proto.drawMissions = function (px, cy, pw, ch) {
  var ctx = this.ctx;
  var daily = dailytasksMod.getList();
  var weekly = weeklytasksMod.getList();
  var long = missionsMod.getList();
  var claimable = dailytasksMod.claimableCount() + weeklytasksMod.claimableCount() + missionsMod.claimableCount();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#795548';
  ctx.fillText('任务', px + 8, cy + 12);
  ctx.textAlign = 'right';
  ctx.font = '13px sans-serif';
  ctx.fillStyle = claimable > 0 ? '#e53935' : '#8d6e63';
  ctx.fillText(claimable > 0 ? ('可领取 ' + claimable + ' 项') : '进行中', px + pw - 8, cy + 12);
  var gap = 5;
  var y = cy + 26;
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#3949ab';
  ctx.fillText('📅 今日任务(每日刷新)', px + 8, y);
  y += 13;
  this.missionCards = [];
  y = this.drawTaskRows(px, y, pw, daily, gap, '#5c6bc0');
  y += 4;
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#00695c';
  ctx.fillText('🗓 本周任务(每周刷新)', px + 8, y);
  y += 13;
  y = this.drawTaskRows(px, y, pw, weekly, gap, '#00897b');
  y += 4;
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#558b2f';
  ctx.fillText('🏅 长期任务', px + 8, y);
  y += 13;
  this.drawTaskRows(px, y, pw, long, gap, '#8bc34a');
};

proto.drawWeekEventCard = function (px, evY, pw) {
  var ctx = this.ctx;
  var ev = weekeventMod.getEvent();
  var evDone = weekeventMod.isDone();
  var evClaimed = weekeventMod.isClaimed();
  var evClaimable = weekeventMod.isClaimable();
  var wk = seasonboardMod.getWeek();
  this.card(px + 6, evY, pw - 12, 82, 12, 'rgba(255,255,255,0.55)', 'rgba(93,64,55,0.2)', 'rgba(0,0,0,0.06)');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#4e342e';
  ctx.fillText(ev.icon, px + 16, evY + 24);
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('周赛 · ' + ev.name, px + 48, evY + 18);
  ctx.textAlign = 'right';
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#a1887f';
  ctx.fillText('本周最佳 ' + wk.classic + ' / ' + wk.frenzy, px + pw - 16, evY + 18);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#8d6e63';
  ctx.fillText(ev.desc, px + 48, evY + 36);
  var evBtnW = (pw - 32) / 2;
  var evBtnY = evY + 46;
  if (evDone) {
    this.drawDailyBtn(px + 12, evBtnY, evBtnW, 28, '✅ 已完成', '#bcaaa4');
    this.dailyBtns.weekStart = null;
  } else {
    this.drawDailyBtn(px + 12, evBtnY, evBtnW, 28, '▶ 参加周赛', '#ff7043');
    this.dailyBtns.weekStart = { x: px + 12, y: evBtnY, w: evBtnW, h: 28 };
  }
  if (evClaimable) {
    this.drawDailyBtn(px + 20 + evBtnW, evBtnY, evBtnW, 28, '🏅 领 +🪙' + ev.reward, '#66bb6a');
    this.dailyBtns.weekClaim = { x: px + 20 + evBtnW, y: evBtnY, w: evBtnW, h: 28 };
  } else {
    this.drawDailyBtn(px + 20 + evBtnW, evBtnY, evBtnW, 28, evClaimed ? '奖励已领' : ('🪙' + ev.reward), '#bcaaa4');
    this.dailyBtns.weekClaim = null;
  }
};

proto.drawWelfare = function (px, cy, pw, ch) {
  var ctx = this.ctx;
  this.welfareBtns = { sidebar: null, shortcut: null };
  var y = cy + 4;
  if (sidebarMod.isSupported() || sidebarMod.isFromSidebar()) {
    this.card(px + 6, y, pw - 12, 150, 12, 'rgba(255,255,255,0.55)', 'rgba(93,64,55,0.2)', 'rgba(0,0,0,0.06)');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#4e342e';
    ctx.fillText('📌 侧边栏复访 · 每日 +🪙' + sidebarMod.REWARD, px + 18, y + 22);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#8d6e63';
    ctx.fillText('1. 回到抖音首页,从右侧/左上角打开侧边栏', px + 18, y + 48);
    ctx.fillText('2. 在「最近使用」里点击「瓜王争霸」进入', px + 18, y + 68);
    ctx.fillText('3. 回到这里领取今日奖励', px + 18, y + 88);
    var canClaim = sidebarMod.canClaim();
    var claimed = sidebarMod.claimedToday();
    var label = canClaim ? ('🎁 领取 +🪙' + sidebarMod.REWARD) : (claimed ? '✔ 今日已领取' : '➡ 去侧边栏');
    this.drawDailyBtn(px + 18, y + 104, pw - 36, 34, label, canClaim ? '#66bb6a' : (claimed ? '#bcaaa4' : '#ff7043'));
    this.welfareBtns.sidebar = { x: px + 18, y: y + 104, w: pw - 36, h: 34 };
    y += 162;
  }
  if (shortcutMod.shouldShow()) {
    var rewarded = shortcutMod.rewarded();
    this.card(px + 6, y, pw - 12, 96, 12, 'rgba(255,255,255,0.55)', 'rgba(93,64,55,0.2)', 'rgba(0,0,0,0.06)');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#4e342e';
    ctx.fillText('📲 添加到桌面' + (rewarded ? '' : ' · 首次 +🪙' + shortcutMod.REWARD), px + 18, y + 22);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#8d6e63';
    ctx.fillText('桌面图标一键进入,不用再搜索', px + 18, y + 44);
    this.drawDailyBtn(px + 18, y + 54, pw - 36, 32, '📲 添加到桌面', '#5c6bc0');
    this.welfareBtns.shortcut = { x: px + 18, y: y + 54, w: pw - 36, h: 32 };
    y += 108;
  }
  if (!this.welfareBtns.sidebar && !this.welfareBtns.shortcut) {
    ctx.textAlign = 'center';
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#a1887f';
    ctx.fillText('当前环境暂无可用福利', px + pw / 2, cy + 40);
  }
};

proto.drawShop = function (px, cy, pw, ch) {
  var ctx = this.ctx;
  var items = shopMod.list();
  var gps = gpexMod.list();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#795548';
  ctx.fillText('道具 / GP 兑换', px + 8, cy + 12);
  ctx.textAlign = 'right';
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#f9a825';
  ctx.fillText('🪙 ' + fmt(progMod.getCoins()) + ' · GP ' + gpexMod.availableGp(), px + pw - 8, cy + 12);

  var adLeft = shopMod.adLeftToday();
  var adY = cy + 28;
  this.drawDailyBtn(px + 12, adY, pw - 24, 36, adLeft > 0 ? ('📺 看广告领 🪙' + shopMod.AD_COINS + '(今日剩 ' + adLeft + ' 次)') : '📺 今日免费金币已领完', adLeft > 0 ? '#f9a825' : '#bcaaa4');
  this.shopAdBtn = adLeft > 0 ? { x: px + 12, y: adY, w: pw - 24, h: 36 } : null;

  var y = adY + 48;
  var rowH = Math.min(58, (ch - (y - cy) - 30) / (items.length + gps.length));
  this.shopCards = [];
  this.gpCards = [];
  var i, it, y2, b1, b2, g, owned;
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#795548';
  ctx.fillText('🎒 开局道具 · 购买后下一局自动使用', px + 8, y);
  y += 10;
  for (i = 0; i < items.length; i++) {
    it = items[i];
    owned = shopMod.count(it.id);
    y2 = y + i * rowH;
    this.shopCards.push({ x: px + 6, y: y2, w: pw - 12, h: rowH - 6, id: it.id, btn: { x: px + pw - 92, y: y2 + (rowH - 6) / 2 - 15, w: 80, h: 30 } });
    this.card(px + 6, y2, pw - 12, rowH - 6, 10, '#faf7f2', 'rgba(93,64,55,0.18)', 'rgba(0,0,0,0.06)');
    ctx.textAlign = 'left';
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#4e342e';
    ctx.fillText(it.icon, px + 16, y2 + (rowH - 6) / 2);
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(it.name + (owned ? ' ×' + owned : ''), px + 46, y2 + (rowH - 6) / 2 - 8);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#8d6e63';
    ctx.fillText(it.desc, px + 46, y2 + (rowH - 6) / 2 + 9);
    b1 = this.shopCards[i].btn;
    var afford = progMod.getCoins() >= it.cost;
    this.card(b1.x, b1.y, b1.w, b1.h, 15, afford ? '#66bb6a' : '#bcaaa4', 'rgba(255,255,255,0.4)', 'rgba(0,0,0,0.2)');
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('🪙' + it.cost, b1.x + b1.w / 2, b1.y + b1.h / 2 + 1);
  }
  y += items.length * rowH + 4;
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#3949ab';
  ctx.fillText('🏅 成就点数(GP)兑换 · 可用 ' + gpexMod.availableGp(), px + 8, y + 2);
  for (i = 0; i < gps.length; i++) {
    g = gps[i];
    y2 = y + 12 + i * rowH;
    this.gpCards.push({ x: px + 6, y: y2, w: pw - 12, h: rowH - 6, id: g.id, btn: { x: px + pw - 92, y: y2 + (rowH - 6) / 2 - 15, w: 80, h: 30 } });
    this.card(px + 6, y2, pw - 12, rowH - 6, 10, g.affordable ? '#fff8e1' : '#f0f0f0', 'rgba(93,64,55,0.18)', null);
    ctx.textAlign = 'left';
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#4e342e';
    ctx.fillText(g.icon, px + 16, y2 + (rowH - 6) / 2);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(g.name, px + 46, y2 + (rowH - 6) / 2 - 8);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#5c6bc0';
    ctx.fillText('消耗 GP ' + g.gp, px + 46, y2 + (rowH - 6) / 2 + 9);
    b2 = this.gpCards[i].btn;
    this.card(b2.x, b2.y, b2.w, b2.h, 15, g.affordable ? '#5c6bc0' : '#bcaaa4', 'rgba(255,255,255,0.4)', 'rgba(0,0,0,0.2)');
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(g.affordable ? '兑换' : 'GP不足', b2.x + b2.w / 2, b2.y + b2.h / 2 + 1);
  }
  ctx.textAlign = 'left';
};

proto.drawReset = function (px, cy, pw, ch) {
  var ctx = this.ctx;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#c62828';
  ctx.fillText('确定要清除全部本地存档吗?', px + pw / 2, cy + 40);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#8d6e63';
  ctx.fillText('金币、成就、图鉴、主题、道具、任务等将全部重置。', px + pw / 2, cy + 66);
  ctx.fillText('此操作不可撤销。', px + pw / 2, cy + 84);
  var bw = (pw - 36) / 2;
  var by = cy + 120;
  this.resetBtns = {};
  this.drawDailyBtn(px + 12, by, bw, 40, '🗑️ 确认清档', '#e53935');
  this.resetBtns.confirm = { x: px + 12, y: by, w: bw, h: 40 };
  this.drawDailyBtn(px + 24 + bw, by, bw, 40, '取消', '#8d6e63');
  this.resetBtns.cancel = { x: px + 24 + bw, y: by, w: bw, h: 40 };
};

module.exports = proto;
