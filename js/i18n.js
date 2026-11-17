// js/i18n.js —— 轻量本地化字符串表(骨架)
// 提供 key→文案 映射与语言切换(zh 默认 / en 占位)。未命中回退到 zh,再回退到 fallback。
var LOCALE_KEY = 'merge_watermelon_locale';
var FALLBACK = 'zh';

var STRINGS = {
  zh: {
    'menu.title': '🍉 瓜王争霸',
    'mode.classic': '经典闯关',
    'mode.frenzy': '限时狂热',
    'mode.classic.sub': '关卡 · 特殊球 · 策略',
    'mode.frenzy.sub': '60 秒极限冲分',
    'menu.growth': '⚙ 成长养成',
    'menu.daily': '📅 每日挑战',
    'menu.missions': '📜 任务',
    'menu.shop': '🛒 金币商店',
    'menu.ach': '🏆 成就',
    'menu.rank': '👥 排行',
    'menu.theme': '🎨 主题',
    'panel.themes': '🎨 主题皮肤',
    'panel.growth': '⚙ 成长养成',
    'panel.daily': '📅 每日挑战',
    'panel.missions': '📜 任务',
    'panel.profile': '👤 玩家档案',
    'panel.settings': '⚙ 设置',
    'panel.help': '❓ 玩法帮助',
    'panel.records': '🏆 本地记录',
    'panel.shop': '🛒 金币商店',
    'panel.welfare': '🎁 福利',
    'common.confirm': '确定',
    'common.cancel': '取消'
  },
  en: {
    'menu.title': '🍉 Melon King',
    'mode.classic': 'Classic',
    'mode.frenzy': 'Frenzy',
    'mode.classic.sub': 'Levels · Specials · Strategy',
    'mode.frenzy.sub': '60s score rush',
    'menu.growth': '⚙ Upgrades',
    'menu.daily': '📅 Daily',
    'menu.missions': '📜 Missions',
    'menu.shop': '🛒 Coin Shop',
    'menu.ach': '🏆 Achievements',
    'menu.rank': '👥 Rank',
    'menu.theme': '🎨 Themes',
    'panel.themes': '🎨 Themes',
    'panel.growth': '⚙ Upgrades',
    'panel.daily': '📅 Daily',
    'panel.missions': '📜 Missions',
    'panel.profile': '👤 Profile',
    'panel.settings': '⚙ Settings',
    'panel.help': '❓ Help',
    'panel.records': '🏆 Local Records',
    'panel.shop': '🛒 Coin Shop',
    'panel.welfare': '🎁 Rewards',
    'common.confirm': 'OK',
    'common.cancel': 'Cancel'
  },
  ja: {
    'menu.title': '🍉 スイカ王',
    'mode.classic': 'クラシック',
    'mode.frenzy': 'フレンジー',
    'mode.classic.sub': 'ステージ・特殊球・戦略',
    'mode.frenzy.sub': '60秒スコアアタック',
    'menu.growth': '⚙ 育成',
    'menu.daily': '📅 デイリー',
    'menu.missions': '📜 ミッション',
    'menu.shop': '🛒 ショップ',
    'menu.ach': '🏆 実績',
    'menu.rank': '👥 ランキング',
    'menu.theme': '🎨 テーマ',
    'panel.themes': '🎨 テーマ',
    'panel.growth': '⚙ 育成',
    'panel.daily': '📅 デイリー',
    'panel.missions': '📜 ミッション',
    'panel.profile': '👤 プロフィール',
    'panel.settings': '⚙ 設定',
    'panel.help': '❓ ヘルプ',
    'panel.records': '🏆 ローカル記録',
    'panel.shop': '🛒 ショップ',
    'panel.welfare': '🎁 特典',
    'common.confirm': 'OK',
    'common.cancel': 'キャンセル'
  },
  ko: {
    'menu.title': '🍉 수박왕',
    'mode.classic': '클래식',
    'mode.frenzy': '프렌지',
    'mode.classic.sub': '스테이지 · 특수구 · 전략',
    'mode.frenzy.sub': '60초 스코어어택',
    'menu.growth': '⚙ 육성',
    'menu.daily': '📅 데일리',
    'menu.missions': '📜 미션',
    'menu.shop': '🛒 샵',
    'menu.ach': '🏆 업적',
    'menu.rank': '👥 랭킹',
    'menu.theme': '🎨 테마',
    'panel.themes': '🎨 테마',
    'panel.growth': '⚙ 육성',
    'panel.daily': '📅 데일리',
    'panel.missions': '📜 미션',
    'panel.profile': '👤 프로필',
    'panel.settings': '⚙ 설정',
    'panel.help': '❓ 도움말',
    'panel.records': '🏆 로컬 기록',
    'panel.shop': '🛒 샵',
    'panel.welfare': '🎁 혜택',
    'common.confirm': '확인',
    'common.cancel': '취소'
  },
  fr: {
    'menu.title': '🍉 Roi Pastèque',
    'mode.classic': 'Classique',
    'mode.frenzy': 'Frenzy',
    'mode.classic.sub': 'Niveaux · Boules · Stratégie',
    'mode.frenzy.sub': '60s score rush',
    'menu.growth': '⚙ Améliorations',
    'menu.daily': '📅 Quotidien',
    'menu.missions': '📜 Missions',
    'menu.shop': '🛒 Boutique',
    'menu.ach': '🏆 Succès',
    'menu.rank': '👥 Classement',
    'menu.theme': '🎨 Thèmes',
    'panel.themes': '🎨 Thèmes',
    'panel.growth': '⚙ Améliorations',
    'panel.daily': '📅 Quotidien',
    'panel.missions': '📜 Missions',
    'panel.profile': '👤 Profil',
    'panel.settings': '⚙ Réglages',
    'panel.help': '❓ Aide',
    'panel.records': '🏆 Records locaux',
    'panel.shop': '🛒 Boutique',
    'panel.welfare': '🎁 Bonus',
    'common.confirm': 'OK',
    'common.cancel': 'Annuler'
  }
};

function getLocale() {
  try {
    var v = tt.getStorageSync(LOCALE_KEY);
    return STRINGS[v] ? v : FALLBACK;
  } catch (e) {
    return FALLBACK;
  }
}

function setLocale(l) {
  if (!STRINGS[l]) return false;
  try { tt.setStorageSync(LOCALE_KEY, l); } catch (e) {}
  return true;
}

function t(key, fallback) {
  var loc = getLocale();
  if (STRINGS[loc] && STRINGS[loc][key] !== undefined) return STRINGS[loc][key];
  if (STRINGS[FALLBACK] && STRINGS[FALLBACK][key] !== undefined) return STRINGS[FALLBACK][key];
  return fallback !== undefined ? fallback : key;
}

function locales() {
  return Object.keys(STRINGS);
}

function reset() {
  try { tt.setStorageSync(LOCALE_KEY, ''); } catch (e) {}
}

module.exports = {
  LOCALE_KEY: LOCALE_KEY,
  STRINGS: STRINGS,
  getLocale: getLocale,
  setLocale: setLocale,
  t: t,
  locales: locales,
  reset: reset
};
