// js/levels.js —— 100 关连贯性关卡设计
// 10 个章节 × 每章 10 关。目标分、掉落池、危险线、特殊球概率随等级平滑演进,
// 每章在玩法与节奏上逐级加码,支撑长线冲关。

var MAX_LEVEL = 100;

// 章节表:关卡 1-100 分为 10 章,每章 10 关。
// maxType 为该章允许掉落的最高水果类型(合成不受限,可继续向上合)。
var STAGES = [
  { name: '果蔬入门', sub: '葡萄 · 樱桃 · 橙子', maxType: 3 },
  { name: '果园初阶', sub: '柠檬 · 奇异果', maxType: 4 },
  { name: '百果盛宴', sub: '番茄 · 蜜桃', maxType: 5 },
  { name: '水果集市', sub: '苹果 · 鸭梨', maxType: 6 },
  { name: '甜蜜果酱', sub: '大果时代', maxType: 7 },
  { name: '狂热盛夏', sub: '西瓜狂潮', maxType: 7 },
  { name: '西瓜盛典', sub: '大果炸弹潮', maxType: 8, rule: 'bigbomb' },
  { name: '王者果园', sub: '障碍加倍', maxType: 8, rule: 'dense' },
  { name: '传说果神', sub: '磁吸乱流', maxType: 8, rule: 'magnet' },
  { name: '果界巅峰', sub: '毒刺夹道', maxType: 8, rule: 'spike' }
];

// 各章目标分倍率(章节内再按关数线性微增)
var STAGE_MULT = [1.0, 1.5, 2.1, 2.9, 3.9, 5.1, 6.5, 8.1, 10.0, 12.0];

// 新手爬坡:第 1-4 关覆盖曲线,第 5 关起回到公式(408),保持单调递增
var ONBOARD_TARGETS = { 1: 100, 2: 180, 3: 260, 4: 340 };
var BOSS_MULT = 1.25;

function getStage(level) {
  var idx = Math.min(STAGES.length - 1, Math.floor((level - 1) / 10));
  var s = STAGES[idx];
  return { idx: idx, name: s.name, sub: s.sub, maxType: s.maxType, rule: s.rule };
}

function getLevelDef(level) {
  var stage = getStage(level);
  var inStage = ((level - 1) % 10) + 1;
  // 目标分:章节倍率 × 章节内 9% 递增,曲线平滑、越到后期越有挑战但可达成
  var target = Math.round(300 * STAGE_MULT[stage.idx] * (1 + 0.09 * (inStage - 1)));
  if (ONBOARD_TARGETS[level]) target = ONBOARD_TARGETS[level];
  // Boss 关:每章末关(level % 10 === 0),目标分 ×BOSS_MULT,通关额外奖励
  var isBoss = (level % 10 === 0);
  if (isBoss) target = Math.round(target * BOSS_MULT);
  // 通关奖励:随关卡线性增长(只加总分,不计入关卡进度)
  var bonus = Math.round(150 + level * 55);
  if (isBoss) bonus += 50; // Boss 关小额额外奖励(保持随关卡单调递增)
  // 危险线:以初始 150 为基准,每关仅压缩 0.9px(保底 80),
  // 早期空间宽裕、后期配合大果逐级增压,避免「第二关就结束」。
  var dangerLine = Math.max(80, Math.round((150 - (level - 1) * 0.9) * 10) / 10);
  // 新手第一关更宽松:危险线 190,给足建叠空间(第 2 关起恢复正常压缩)
  if (level === 1) dangerLine = 190;
  // 特殊球出现概率:缓升并封顶
  var specialChance = Math.min(0.25, 0.08 + level * 0.02);
  return {
    level: level,
    stage: stage,
    inStage: inStage,
    isBoss: isBoss,
    target: target,
    bonus: bonus,
    dangerLine: dangerLine,
    maxType: stage.maxType,
    specialChance: specialChance
  };
}

// 掉落池权重:小果更常见保证能向上合成;章节越高可掉落上限越大。
// 后期给最高档果微量加权,增加大果惊喜但保持稀有。
function getDropWeights(level, maxType) {
  var upper = level >= 75 ? 2 : (level >= 40 ? 1 : 0);
  var w = [];
  for (var t = 0; t <= maxType; t++) {
    var weight = (maxType - t) + 1;
    if (t >= maxType - 1) weight += upper;
    // 第 7 章:最大三档再 +1,大果更常见
    if (getStage(level).rule === 'bigbomb' && t >= maxType - 2) weight += 1;
    w.push(weight);
  }
  return w;
}

module.exports = {
  MAX_LEVEL: MAX_LEVEL,
  STAGES: STAGES,
  getStage: getStage,
  getLevelDef: getLevelDef,
  getDropWeights: getDropWeights
};
