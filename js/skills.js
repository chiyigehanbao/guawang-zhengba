// js/skills.js —— 主动技能(能量 + 手动释放)
// 局内通过合成攒能量,能量满即可释放主动技能,提供对局势的即时干预(策略深度)。
// 纯数据 + 纯函数;技能效果由 game.js 执行(需要访问世界状态)。
var ENERGY_MAX = 100;
var ENERGY_PER_MERGE = 8;
var ENERGY_PER_KING = 16;

var SKILLS = [
  {
    id: 'hammer', icon: '🔨', name: '重锤', cost: ENERGY_MAX, targeting: true, unlockLevel: 1,
    desc: '敲碎选定位置的(或最高的)一颗水果,化解危险'
  },
  {
    id: 'shuffle', icon: '🪄', name: '洗牌', cost: ENERGY_MAX, targeting: false, unlockLevel: 3,
    desc: '打乱场上水果的横向分布,化解拥挤堆积'
  },
  {
    id: 'meteor', icon: '☄️', name: '陨石', cost: ENERGY_MAX, targeting: true, unlockLevel: 6, radius: 60,
    desc: '在目标位置清出一片区域,适合清理成团堆叠'
  }
];

function getById(id) {
  for (var i = 0; i < SKILLS.length; i++) {
    if (SKILLS[i].id === id) return SKILLS[i];
  }
  return null;
}

// 是否已解锁(按账号等级)
function unlocked(id, accountLevel) {
  var s = getById(id);
  if (!s) return false;
  return (accountLevel || 1) >= (s.unlockLevel || 1);
}

var SHUFFLE_STRENGTH = 260;
var METEOR_RADIUS = 60;

function energyGain(newType) {
  return (newType >= 10 ? ENERGY_PER_KING : ENERGY_PER_MERGE);
}

function canCast(energy) {
  return energy >= ENERGY_MAX;
}

function clampEnergy(e) {
  return Math.max(0, Math.min(ENERGY_MAX, e));
}

module.exports = {
  ENERGY_MAX: ENERGY_MAX,
  ENERGY_PER_MERGE: ENERGY_PER_MERGE,
  ENERGY_PER_KING: ENERGY_PER_KING,
  SHUFFLE_STRENGTH: SHUFFLE_STRENGTH,
  METEOR_RADIUS: METEOR_RADIUS,
  SKILLS: SKILLS,
  getById: getById,
  unlocked: unlocked,
  energyGain: energyGain,
  canCast: canCast,
  clampEnergy: clampEnergy
};
