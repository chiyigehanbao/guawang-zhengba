// js/perks.js —— 局内天赋(In-Run Perks)
// 单局 roguelite-lite:经典模式每通关 5 关、狂热模式每过 15 秒,弹出「天赋三选一」,
// 选择后立即对当局生效(局内叠加、不跨局持久化)。所有效果以「运行修正对象 runMod」表达,
// 由 game.js 在各系统读取,实现零侵入的数值/行为增强。
//
// 设计:纯数据 + 纯函数,可零依赖在 Node 下测试。

// 运行修正对象的默认值(无天赋时的基线,效果全为中性)
function DEFAULT_MOD() {
  return {
    comboWindowAdd: 0,     // 连击窗口加成(秒)
    comboBonusAdd: 0,      // 每级连击加成增量
    specialChanceAdd: 0,   // 特殊球概率加成
    bombRadiusMult: 1,     // 炸弹半径倍率(乘法叠加)
    starChargesAdd: 0,     // 双倍次数加成
    magnetTimeAdd: 0,      // 磁吸时长加成(秒)
    freezeTimeAdd: 0,      // 冻结时长加成(秒)
    dangerThresholdAdd: 0, // 危险线容错加成(秒)
    scoreMult: 1,          // 得分总倍率(乘法叠加)
    instantBonus: 0        // 立即加分(一次性)
  };
}

// 天赋池。mods 键与 runMod 字段一一对应;instant 为选择即时结算的一次性奖励。
// maxStacks 为单局最多可叠加次数(乘法类天赋封顶,避免尾期指数膨胀)。
var POOL = [
  {
    id: 'quick_combo', icon: '🥊', name: '快连窗口', rarity: 'common', maxStacks: 4,
    desc: '连击窗口 +0.6s,更容易维持连击',
    mods: { comboWindowAdd: 0.6 }
  },
  {
    id: 'combo_master', icon: '⚡', name: '连击大师', rarity: 'common', maxStacks: 4,
    desc: '每级连击加成 +4%',
    mods: { comboBonusAdd: 0.04 }
  },
  {
    id: 'big_bang', icon: '💥', name: '巨型炸弹', rarity: 'rare', maxStacks: 3,
    desc: '炸弹爆炸半径 +35%',
    mods: { bombRadiusMult: 1.35 }
  },
  {
    id: 'star_power', icon: '⭐', name: '双倍增效', rarity: 'rare', maxStacks: 3,
    desc: '双倍得分次数 +3',
    mods: { starChargesAdd: 3 }
  },
  {
    id: 'strong_magnet', icon: '🧲', name: '强力磁吸', rarity: 'common', maxStacks: 4,
    desc: '磁吸持续 +0.6s',
    mods: { magnetTimeAdd: 0.6 }
  },
  {
    id: 'deep_freeze', icon: '❄️', name: '深度冰封', rarity: 'common', maxStacks: 4,
    desc: '冰封持续 +1.0s',
    mods: { freezeTimeAdd: 1.0 }
  },
  {
    id: 'lucky', icon: '🍀', name: '幸运星', rarity: 'rare', maxStacks: 4,
    desc: '特殊球出现概率 +6%',
    mods: { specialChanceAdd: 0.06 }
  },
  {
    id: 'bonus_score', icon: '💰', name: '得分加成', rarity: 'rare', maxStacks: 3,
    desc: '全部得分 ×1.12',
    mods: { scoreMult: 1.12 }
  },
  {
    id: 'safe_zone', icon: '🛡️', name: '缓冲地带', rarity: 'common', maxStacks: 3,
    desc: '危险线容错 +0.5s(更晚判负)',
    mods: { dangerThresholdAdd: 0.5 }
  },
  {
    id: 'windfall', icon: '🎁', name: '天降横财', rarity: 'common', maxStacks: 3,
    desc: '立即获得 800 分',
    mods: {},
    instant: 800
  }
];

var DEFAULT_MAX_STACKS = 3;

function maxStacks(p) {
  return (p && p.maxStacks) || DEFAULT_MAX_STACKS;
}

var BY_ID = {};
for (var i = 0; i < POOL.length; i++) BY_ID[POOL[i].id] = POOL[i];

function getById(id) {
  return BY_ID[id] || null;
}

function hasInstant(p) {
  return !!(p && p.instant && p.instant > 0);
}

// 抽取 n 个互不相同、且不在 exclude(已选 id 数组)中的天赋。
// 池不足以满足时优先从全池补足(仍尽量不重复本次结果)。
function roll(n, exclude, rng) {
  var rand = rng || Math.random;
  exclude = exclude || [];
  var avail = POOL.filter(function (p) {
    return exclude.indexOf(p.id) === -1;
  });
  var out = [];
  var pool = avail.slice();
  while (out.length < n && pool.length > 0) {
    var idx = Math.floor(rand() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  if (out.length < n) {
    var backup = POOL.slice();
    var guard = 0;
    while (out.length < n && guard < 200) {
      guard += 1;
      var b = backup[Math.floor(rand() * backup.length)];
      var dup = out.some(function (p) { return p.id === b.id; });
      if (!dup) out.push(b);
    }
  }
  return out;
}

// 过滤出尚未达到单局叠加上限的天赋(counts 为 id→已选次数)。
function eligible(counts) {
  counts = counts || {};
  return POOL.filter(function (p) {
    return (counts[p.id] || 0) < maxStacks(p);
  });
}

// 从给定候选池中随机抽取至多 n 个互不相同项(不足则返回全部)。
function rollFromPool(pool, n, rng) {
  var rand = rng || Math.random;
  var copy = pool.slice();
  var out = [];
  while (out.length < n && copy.length > 0) {
    out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  }
  return out;
}

// 抽取 n 个未达上限的天赋(不会越界叠加);候选不足时返回更少(可能 0)。
// 稀有保底:结果中若无稀有且候选里还有未选稀有,则替换一个为稀有。
function rollEligible(counts, n, rng) {
  var pool = eligible(counts);
  var out = rollFromPool(pool, n, rng);
  var hasRare = out.some(function (p) { return p.rarity === 'rare'; });
  if (!hasRare) {
    var rares = pool.filter(function (p) { return p.rarity === 'rare' && out.indexOf(p) < 0; });
    if (rares.length) {
      for (var i = out.length - 1; i >= 0; i--) {
        if (out[i].rarity !== 'rare') {
          out[i] = rares[0];
          break;
        }
      }
    }
  }
  return out;
}

// 将天赋效果合并进运行修正对象(mod 会被就地修改并返回)。
function apply(mod, perk) {
  if (!perk || !perk.mods) return mod;
  var m = perk.mods;
  mod.comboWindowAdd += m.comboWindowAdd || 0;
  mod.comboBonusAdd += m.comboBonusAdd || 0;
  mod.specialChanceAdd += m.specialChanceAdd || 0;
  mod.bombRadiusMult *= (m.bombRadiusMult || 1);
  mod.starChargesAdd += m.starChargesAdd || 0;
  mod.magnetTimeAdd += m.magnetTimeAdd || 0;
  mod.freezeTimeAdd += m.freezeTimeAdd || 0;
  mod.dangerThresholdAdd += m.dangerThresholdAdd || 0;
  mod.scoreMult *= (m.scoreMult || 1);
  return mod;
}

module.exports = {
  DEFAULT_MOD: DEFAULT_MOD,
  POOL: POOL,
  getById: getById,
  roll: roll,
  eligible: eligible,
  rollFromPool: rollFromPool,
  rollEligible: rollEligible,
  maxStacks: maxStacks,
  apply: apply,
  hasInstant: hasInstant
};
