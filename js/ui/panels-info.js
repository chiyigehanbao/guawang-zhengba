// js/ui/panels-info.js —— 信息类面板(面板框架/图鉴/成就/档案/设置/帮助/本地记录)

var fruitData = require('../fruits');
var achMod = require('../achievements');
var progMod = require('../progression');
var missionsMod = require('../missions');
var settingsMod = require('../settings');
var seasonboardMod = require('../seasonboard');
var accountMod = require('../account');
var historyMod = require('../history');
var i18nMod = require('../i18n');
var privacyMod = require('../privacy');
var shared = require('../game/shared');
var fmt = shared.fmt;

var proto = {};

proto.drawPanel = function () {
  var ctx = this.ctx;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, this.W, this.H);
  var px = 24 * this.scale;
  var py = 56 * this.scale;
  var pw = this.W - 48 * this.scale;
  var ph = this.H - 108 * this.scale;
  this.panelRect = { x: px, y: py, w: pw, h: ph };
  this.rr(px, py, pw, ph, 16);
  ctx.fillStyle = '#fffaf0';
  ctx.fill();
  this.rr(px, py, pw, ph, 16);
  ctx.strokeStyle = 'rgba(93, 64, 55, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#4e342e';
  ctx.fillText(i18nMod.t('panel.' + this.panel, this.panel === 'reset' ? '🗑️ 清档重置' : '🏆 成就 · 图鉴'), px + pw / 2, py + 26);

  this.panelClose = { x: px + pw - 30, y: py + 14, w: 26, h: 26 };
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.arc(px + pw - 17, py + 27, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('✕', px + pw - 17, py + 28);

  if (this.panel === 'themes') {
    this.panelTabs = null;
    this.drawThemeGrid(px, py + 52, pw, ph - 62);
    return;
  }

  if (this.panel === 'growth') {
    this.panelTabs = null;
    this.drawGrowth(px, py + 52, pw, ph - 62);
    return;
  }

  if (this.panel === 'daily') {
    this.panelTabs = null;
    this.drawDaily(px, py + 52, pw, ph - 62);
    return;
  }

  if (this.panel === 'missions') {
    this.panelTabs = null;
    this.drawMissions(px, py + 52, pw, ph - 62);
    return;
  }

  if (this.panel === 'profile') {
    this.panelTabs = null;
    this.drawProfile(px, py + 52, pw, ph - 62);
    return;
  }

  if (this.panel === 'settings') {
    this.panelTabs = null;
    this.drawSettings(px, py + 52, pw, ph - 62);
    return;
  }

  if (this.panel === 'help') {
    this.panelTabs = null;
    this.drawHelp(px, py + 52, pw, ph - 62);
    return;
  }

  if (this.panel === 'welfare') {
    this.panelTabs = null;
    this.drawWelfare(px, py + 52, pw, ph - 62);
    return;
  }

  if (this.panel === 'records') {
    this.panelTabs = null;
    this.drawRecords(px, py + 52, pw, ph - 62);
    return;
  }

  if (this.panel === 'shop') {
    this.panelTabs = null;
    this.drawShop(px, py + 52, pw, ph - 62);
    return;
  }

  if (this.panel === 'reset') {
    this.panelTabs = null;
    this.drawReset(px, py + 52, pw, ph - 62);
    return;
  }

  var tabW = 90;
  var tabH = 28;
  var tabY = py + 52;
  var t1x = px + pw / 2 - tabW - 6;
  var t2x = px + pw / 2 + 6;
  this.panelTabs = {
    c: { x: t1x, y: tabY, w: tabW, h: tabH },
    a: { x: t2x, y: tabY, w: tabW, h: tabH }
  };
  this.drawTab(t1x, tabY, tabW, tabH, '图鉴', this.panel === 'collection');
  this.drawTab(t2x, tabY, tabW, tabH, '成就', this.panel === 'achievements');

  var cy = tabY + tabH + 12;
  var cheight = py + ph - cy - 10;
  if (this.panel === 'achievements') {
    this.drawAchList(px, cy, pw, cheight);
  } else {
    this.drawCollection(px, cy, pw, cheight);
  }
};

proto.drawCollection = function (px, cy, pw, ch) {
  var ctx = this.ctx;
  var col = achMod.getCollection();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '15px sans-serif';
  ctx.fillStyle = '#795548';
  ctx.fillText('已收集 ' + achMod.collectedCount() + ' / 11', px + 8, cy + 14);
  var cols = 3;
  var cellW = pw / cols;
  var cellH = Math.min(60, ch / 4.2);
  var startY = cy + 34;
  var i, c, row, x, y, r, unlocked, f;
  this.collectionRects = [];
  for (i = 0; i < 11; i++) {
    row = Math.floor(i / cols);
    c = i % cols;
    x = px + c * cellW + cellW / 2;
    y = startY + row * cellH + cellH / 2;
    unlocked = !!col[i];
    f = fruitData.TYPES[i];
    r = Math.min(21, cellW / 3.2);
    this.collectionRects.push({ x: x - r, y: y - r, w: r * 2, h: r * 2, type: i });
    ctx.beginPath();
    ctx.arc(x, y, r + 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y - 2, r, 0, Math.PI * 2);
    ctx.fillStyle = unlocked ? this.fruitColor(i) : '#bcaaa4';
    ctx.fill();
    ctx.font = (r * 1.25) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(unlocked ? f.emoji : '❓', x, y - 1);
    if (!unlocked) {
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#a1887f';
      ctx.fillText('🔒', x, y + r + 14);
    } else {
      var cnt = achMod.getFruitCount(i);
      if (cnt > 0) {
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#5d4037';
        ctx.fillText('×' + cnt + (cnt >= 50 ? ' ★' : ''), x, y + r + 12);
      }
    }
  }
};

proto.drawAchList = function (px, cy, pw, ch) {
  var ctx = this.ctx;
  var all = achMod.getList();
  var filter = this.achFilter || 'all';
  var cat = this.achCat || 'all';
  var list = all.slice();
  if (cat !== 'all') list = list.filter(function (d) { return d.cat === cat; });
  list.sort(function (a, b) { return (a.unlockedAt ? 1 : 0) - (b.unlockedAt ? 1 : 0); });
  if (filter === 'todo') list = list.filter(function (d) { return !d.unlockedAt; });
  else if (filter === 'done') list = list.filter(function (d) { return !!d.unlockedAt; });
  var unlocked = achMod.getUnlockedCount();
  var title = achMod.getTitle(unlocked);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  var opts = [['all', '全部'], ['todo', '未达成'], ['done', '已达成']];
  var tw = (pw - 16 - 12) / 3;
  this.achFilterBtns = [];
  for (var fi = 0; fi < 3; fi++) {
    var fx = px + 8 + fi * (tw + 6);
    var fy = cy + 6;
    this.achFilterBtns.push({ x: fx, y: fy, w: tw, h: 22, id: opts[fi][0] });
    this.rr(fx, fy, tw, 22, 11);
    ctx.fillStyle = filter === opts[fi][0] ? '#e53935' : '#d7ccc8';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(opts[fi][1], fx + tw / 2, fy + 11);
  }
  ctx.textAlign = 'left';

  var catOpts = [['all', '全部分类'], ['progress', '进度'], ['skill', '技巧'], ['collect', '收集'], ['meta', '成长']];
  var cw2 = (pw - 16 - 4 * 4) / 5;
  this.achCatBtns = [];
  for (var ci = 0; ci < 5; ci++) {
    var cfx = px + 8 + ci * (cw2 + 4);
    var cfy = cy + 32;
    this.achCatBtns.push({ x: cfx, y: cfy, w: cw2, h: 18, id: catOpts[ci][0] });
    this.rr(cfx, cfy, cw2, 18, 9);
    ctx.fillStyle = cat === catOpts[ci][0] ? '#5c6bc0' : '#d7ccc8';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(catOpts[ci][1], cfx + cw2 / 2, cfy + 9);
  }
  ctx.textAlign = 'left';

  var hy = cy + 60;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#4e342e';
  ctx.fillText('🎯 成就进度', px + 8, hy);
  ctx.textAlign = 'right';
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#8d6e63';
  ctx.fillText('称号:『' + title + '』 ' + unlocked + ' / ' + all.length + ' · GP ' + achMod.getGp() + '/' + achMod.totalGp(), px + pw - 8, hy);
  ctx.textAlign = 'left';

  var barY = hy + 14;
  var barW = pw - 16;
  this.rr(px + 8, barY, barW, 9, 5);
  ctx.fillStyle = '#e5d7c8';
  ctx.fill();
  var bf = Math.min(1, unlocked / all.length);
  if (bf > 0) {
    var bg2 = ctx.createLinearGradient(px + 8, 0, px + 8 + barW, 0);
    bg2.addColorStop(0, '#ff7043');
    bg2.addColorStop(1, '#f9a825');
    this.rr(px + 8, barY, Math.max(10, barW * bf), 9, 5);
    ctx.fillStyle = bg2;
    ctx.fill();
  }

  var rowH = Math.min(42, (ch - 100) / Math.max(1, list.length));
  var startY = barY + 16;
  var i, y, d, isUn, bx, br;
  for (i = 0; i < list.length; i++) {
    d = list[i];
    isUn = !!d.unlockedAt;
    y = startY + i * rowH + rowH / 2;
    this.rr(px + 6, y - rowH / 2 + 2, pw - 12, rowH - 6, 10);
    ctx.fillStyle = isUn ? '#e8f5e9' : '#faf7f2';
    ctx.fill();
    ctx.strokeStyle = isUn ? 'rgba(139,195,74,0.5)' : 'rgba(93,64,55,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
    bx = px + 28;
    br = 15;
    ctx.beginPath();
    ctx.arc(bx, y - 2, br, 0, Math.PI * 2);
    ctx.fillStyle = isUn ? '#8bc34a' : '#cfd8dc';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx, y - 2, br - 3, 0, Math.PI * 2);
    ctx.fillStyle = isUn ? '#aed581' : '#e0e0e0';
    ctx.fill();
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.icon, bx, y - 2);
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = isUn ? '#33691e' : '#6d4c41';
    ctx.fillText(d.name, px + 52, y - 6);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = isUn ? '#689f38' : '#a1887f';
    ctx.fillText(d.desc, px + 52, y + 12);
    ctx.textAlign = 'right';
    if (isUn) {
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#66bb6a';
      ctx.fillText('✓ 已达成', px + pw - 12, y - 6);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#a5d6a7';
      ctx.fillText(this.fmtTime(d.unlockedAt), px + pw - 12, y + 12);
    } else {
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#bcaaa4';
      ctx.fillText('🔒 未达成', px + pw - 12, y - 6);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#d0c2b4';
      ctx.fillText('努力达成中', px + pw - 12, y + 12);
    }
    ctx.textAlign = 'left';
  }
};

proto.drawProfile = function (px, cy, pw, ch) {
  var ctx = this.ctx;
  var stats = missionsMod.getStats();
  var ach = achMod.getUnlockedCount();
  var achTotal = achMod.getList().length;
  var title = achMod.getTitle(ach);
  var acct = accountMod.getState();
  var top = historyMod.getTop();
  var bestC = 0;
  var bestF = 0;
  for (var ti = 0; ti < top.length; ti++) {
    if (top[ti].mode === 'frenzy') { if (top[ti].score > bestF) bestF = top[ti].score; }
    else if (top[ti].score > bestC) bestC = top[ti].score;
  }
  var rows = [
    ['🏆 称号', '『' + title + '』'],
    ['🧭 账号等级', 'Lv.' + acct.level + '(' + acct.cur + '/' + acct.need + ')'],
    ['🪙 金币', String(progMod.getCoins())],
    ['🎮 游玩局数', String(stats.plays)],
    ['🔗 累计合成', String(stats.merges)],
    ['🛤️ 累计通关', String(stats.levels)],
    ['✨ 特殊球', String(stats.specials)],
    ['👑 合成皇冠', String(stats.kings)],
    ['💯 累计得分', fmt(stats.score)],
    ['🎖️ 成就', ach + ' / ' + achTotal],
    ['🏅 成就点数', achMod.getGp() + ' / ' + achMod.totalGp()],
    ['📖 图鉴', achMod.collectedCount() + ' / 11'],
    ['🏆 历史最佳', fmt(bestC) + ' / ' + fmt(bestF)]
  ];
  var top2 = cy + 44;
  var earnedIcons = achMod.getList().filter(function (d) { return d.unlockedAt; });
  ctx.textAlign = 'left';
  ctx.font = '15px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#4e342e';
  for (var ei = 0; ei < earnedIcons.length && ei < 12; ei++) {
    ctx.fillText(earnedIcons[ei].icon, px + 12 + ei * 22, cy + 14);
  }
  if (earnedIcons.length) {
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#8d6e63';
    ctx.fillText('×' + earnedIcons.length, px + 12 + Math.min(12, earnedIcons.length) * 22 + 6, cy + 15);
    var recent = earnedIcons.slice().sort(function (a, b) { return b.unlockedAt - a.unlockedAt; }).slice(0, 3);
    var rt = '最近 ';
    for (var ri = 0; ri < recent.length; ri++) rt += recent[ri].icon;
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#a1887f';
    ctx.fillText(rt, px + 12, cy + 30);
  }
  var rcFrac = achMod.getUnlockedCount() / Math.max(1, achMod.getList().length);
  ctx.beginPath();
  ctx.arc(px + pw - 34, cy + 20, 15, 0, Math.PI * 2);
  ctx.strokeStyle = '#e5d7c8';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(px + pw - 34, cy + 20, 15, -Math.PI / 2, -Math.PI / 2 + rcFrac * Math.PI * 2);
  ctx.strokeStyle = '#f9a825';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.font = '9px sans-serif';
  ctx.fillStyle = '#5d4037';
  ctx.textAlign = 'center';
  ctx.fillText(Math.round(rcFrac * 100) + '%', px + pw - 34, cy + 21);
  ctx.textAlign = 'left';
  var rowH = Math.min(34, (ch - 52) / rows.length);
  for (var i = 0; i < rows.length; i++) {
    var y = top2 + i * rowH;
    this.card(px + 6, y, pw - 12, rowH - 5, 8, i % 2 ? '#faf7f2' : '#fffdf7', 'rgba(93,64,55,0.12)', null);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#6d4c41';
    ctx.fillText(rows[i][0], px + 16, y + (rowH - 5) / 2);
    ctx.textAlign = 'right';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#4e342e';
    ctx.fillText(rows[i][1], px + pw - 16, y + (rowH - 5) / 2);
  }
  ctx.textAlign = 'left';
};

proto.drawSettings = function (px, cy, pw, ch) {
  var ctx = this.ctx;
  var rows = [
    { id: 'audio', icon: '🔊', name: '音效', desc: '播放游戏音效', on: !this.muted },
    { id: 'volume', icon: '🔉', name: '音量', desc: '当前 ' + Math.round(settingsMod.getVolume() * 100) + '%(点击调节)', action: true },
    { id: 'haptics', icon: '📳', name: '震动反馈', desc: '合成/特殊球震动', on: this.haptics },
    { id: 'motion', icon: '🎞️', name: '减少动态效果', desc: '关闭屏幕震动等动效', on: this.reducedMotion },
    { id: 'contrast', icon: '🌗', name: '高对比轮廓', desc: '水果描白边更清晰', on: this.highContrast },
    { id: 'colorblind', icon: '🎨', name: '色盲友好', desc: '水果标注等级数字', on: this.colorblind },
    { id: 'lang', icon: '🌐', name: '语言 / Language', desc: (i18nMod.getLocale() === 'en' ? 'English' : '中文'), action: true },
    { id: 'help', icon: '❓', name: '玩法帮助', desc: '查看玩法与系统说明', action: true },
    { id: 'export', icon: '📋', name: '导出存档', desc: '复制存档数据到剪贴板', action: true },
    { id: 'import', icon: '📥', name: '导入存档', desc: '从剪贴板恢复存档(需重启)', action: true },
    { id: 'privacy', icon: '🔒', name: '隐私设置', desc: privacyMod.isAgreed() ? '已同意 · 点击查看或撤回' : '未同意 · 好友排行不可用', action: true },
    { id: 'reset', icon: '🗑️', name: '清档重置', desc: '清除全部本地存档(谨慎)', action: true }
  ];
  var top = cy + 4;
  var rowH = 52;
  this.settingRows = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var y = top + i * rowH;
    this.settingRows.push({ x: px + 6, y: y, w: pw - 12, h: rowH - 6, id: r.id });
    this.card(px + 6, y, pw - 12, rowH - 6, 10, '#faf7f2', 'rgba(93,64,55,0.18)', 'rgba(0,0,0,0.06)');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#4e342e';
    ctx.fillText(r.icon, px + 16, y + (rowH - 6) / 2);
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(r.name, px + 44, y + (rowH - 6) / 2 - 8);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#8d6e63';
    ctx.fillText(r.desc, px + 44, y + (rowH - 6) / 2 + 9);
    if (r.action) {
      ctx.textAlign = 'right';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#a1887f';
      ctx.fillText('›', px + pw - 16, y + (rowH - 6) / 2);
    } else {
      var swW = 50;
      var swX = px + pw - 16 - swW;
      var swY = y + (rowH - 6) / 2 - 12;
      this.rr(swX, swY, swW, 24, 12);
      ctx.fillStyle = r.on ? '#4caf50' : '#bcaaa4';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(r.on ? swX + swW - 13 : swX + 13, swY + 12, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.textAlign = 'left';
  }
};

proto.drawHelp = function (px, cy, pw, ch) {
  var ctx = this.ctx;
  var pages = [
    [
      ['🍉 基本玩法', '点击屏幕任意位置,水果从顶部掉落'],
      ['🔗 合成', '两个相同水果接触即合成为更高等级'],
      ['🔥 连击', '窗口内连续合成累计连击,得分加成'],
      ['💣🧊⭐🧲 特殊球', '接触后起爆:清场/冻结/双倍/磁吸'],
      ['⚠ 危险线', '水果堆超过顶部虚线并停留过久即结束']
    ],
    [
      ['⚡ 能量与技能', '合成攒能量,满后点底部技能:重锤/洗牌/陨石'],
      ['🎴 局内天赋', '每 5 关(经典)/每 15s(狂热)三选一强化本局'],
      ['⚙ 局外成长', '金币购买永久升级与技能升级,开局生效'],
      ['📅 每日/📜 任务/🛒 商店', '每日挑战、签到、周赛、任务;金币买开局道具'],
      ['🧱 机关', '障碍方块、弹床、传送带、毒刺(重锤/炸弹可清除)']
    ],
    [
      ['📺 广告复活', '结算看广告可复活、金币翻倍'],
      ['🏆 成就/称号', '解锁成就得金币,集齐额外大奖'],
      ['🎨 主题', '按成就或金币解锁多套皮肤'],
      ['⚙ 设置', '音效/震动/动效/高对比/语言/存档导入导出'],
      ['💡 提示', '优先合成小果腾出空间;危险时用重锤救场']
    ]
  ];
  var names = ['玩法', '系统', '进阶'];
  var tabW = (pw - 16 - 12) / 3;
  this.helpTabs = [];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (var ti = 0; ti < 3; ti++) {
    var tx = px + 8 + ti * (tabW + 6);
    var ty = cy + 4;
    this.helpTabs.push({ x: tx, y: ty, w: tabW, h: 24, page: ti });
    this.rr(tx, ty, tabW, 24, 12);
    ctx.fillStyle = this.helpPage === ti ? '#5c6bc0' : '#d7ccc8';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(names[ti], tx + tabW / 2, ty + 12);
  }
  var lines = pages[this.helpPage] || pages[0];
  var top = cy + 40;
  var rowH = Math.min(48, (ch - 44) / lines.length);
  ctx.textAlign = 'left';
  for (var i = 0; i < lines.length; i++) {
    var y = top + i * rowH;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#4e342e';
    ctx.fillText(lines[i][0], px + 12, y + rowH / 2 - 8);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#8d6e63';
    ctx.fillText(lines[i][1], px + 12, y + rowH / 2 + 9);
  }
};

proto.drawRecords = function (px, cy, pw, ch) {
  var ctx = this.ctx;
  var top = historyMod.getTop();
  var wk = seasonboardMod.getWeek();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#795548';
  ctx.fillText('本周榜', px + 8, cy + 12);
  ctx.textAlign = 'right';
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#8d6e63';
  ctx.fillText('经典 ' + fmt(wk.classic) + ' · 狂热 ' + fmt(wk.frenzy), px + pw - 8, cy + 12);
  var y = cy + 34;
  ctx.textAlign = 'left';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#4e342e';
  ctx.fillText('历史最高纪录', px + 8, y);
  y += 22;
  if (!top.length) {
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#a1887f';
    ctx.fillText('暂无记录,快去创造纪录吧!', px + 8, y + 10);
    return;
  }
  var rowH = Math.min(44, (ch - 70) / Math.max(1, top.length));
  for (var i = 0; i < top.length; i++) {
    var r = top[i];
    var yy = y + i * rowH;
    this.card(px + 6, yy, pw - 12, rowH - 6, 10, i === 0 ? '#fff8e1' : '#faf7f2', 'rgba(93,64,55,0.16)', null);
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = i === 0 ? '#f9a825' : '#8d6e63';
    ctx.fillText('#' + (i + 1), px + 16, yy + (rowH - 6) / 2);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#4e342e';
    ctx.fillText(r.mode === 'frenzy' ? '限时狂热' : '经典闯关', px + 54, yy + (rowH - 6) / 2);
    ctx.textAlign = 'right';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#e53935';
    ctx.fillText(fmt(r.score), px + pw - 16, yy + (rowH - 6) / 2);
    ctx.textAlign = 'left';
  }
};

module.exports = proto;
