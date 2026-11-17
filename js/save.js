// js/save.js —— 存档版本与迁移
// 集中管理存档 schema 版本号;升级时按版本逐级迁移,保证老存档可用。
// 纯本地、零依赖、可 Node 测试。
var VERSION_KEY = 'merge_watermelon_save_version';
var CURRENT_VERSION = 1;

// 各键的默认值(缺失时补齐,用于迁移与容错)
var DEFAULTS = {
  merge_watermelon_best: 0,
  merge_watermelon_frenzy_best: 0,
  merge_watermelon_muted: 0,
  merge_watermelon_collection: [],
  merge_watermelon_achievements: {},
  merge_watermelon_max_combo: 0,
  merge_watermelon_max_level: 0,
  merge_watermelon_used_specials: [],
  merge_watermelon_theme: 'classic',
  merge_watermelon_coins: 0,
  merge_watermelon_upgrades: {},
  merge_watermelon_daily: {},
  merge_watermelon_checkin: {},
  merge_watermelon_stats: {},
  merge_watermelon_missions: { claimed: [] },
  merge_watermelon_fruit_counts: []
};

function readRaw(key) {
  try {
    var v = tt.getStorageSync(key);
    return v === '' ? undefined : v;
  } catch (e) {
    return undefined;
  }
}

function writeRaw(key, v) {
  try { tt.setStorageSync(key, v); } catch (e) {}
}

function getVersion() {
  var v = parseInt(readRaw(VERSION_KEY), 10);
  return isFinite(v) && v > 0 ? v : 0;
}

function setVersion(v) {
  writeRaw(VERSION_KEY, v);
}

// 导出全部存档为带校验和的 JSON 字符串
function exportAll() {
  var data = {};
  for (var k in DEFAULTS) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULTS, k)) continue;
    var v = readRaw(k);
    if (v !== undefined) data[k] = v;
  }
  data[VERSION_KEY] = getVersion();
  return JSON.stringify({ v: CURRENT_VERSION, d: data, c: checksum(JSON.stringify(data)) });
}

function checksum(str) {
  var h = 0;
  for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// 从 JSON 字符串导入存档(校验和 + 仅接受 merge_watermelon_* 前缀键)
function importAll(str) {
  var o;
  try { o = JSON.parse(str); } catch (e) { return { ok: false, reason: 'parse' }; }
  if (typeof o !== 'object' || o === null || o instanceof Array) return { ok: false, reason: 'data' };
  var map = o;
  if (o.d && typeof o.c === 'number') {
    if (checksum(JSON.stringify(o.d)) !== o.c) return { ok: false, reason: 'checksum' };
    map = o.d;
  }
  var n = 0;
  for (var k in map) {
    if (!Object.prototype.hasOwnProperty.call(map, k)) continue;
    if (k === VERSION_KEY || k.indexOf('merge_watermelon_') === 0) {
      writeRaw(k, map[k]);
      n += 1;
    }
  }
  return { ok: true, count: n };
}

// 补齐缺失的默认存档键(不覆盖已有值)
function ensureDefaults() {
  var added = [];
  for (var k in DEFAULTS) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULTS, k)) continue;
    var cur = readRaw(k);
    if (cur === undefined) {
      var def = DEFAULTS[k];
      writeRaw(k, (def instanceof Array) ? [] : (typeof def === 'object' ? JSON.parse(JSON.stringify(def)) : def));
      added.push(k);
    }
  }
  return added;
}

// 迁移到最新版本。返回 {from, to, migrated, addedDefaults}
function migrate() {
  var from = getVersion();
  var added = ensureDefaults();
  if (from === 0) {
    // 首次运行或旧版无版本号:标记为当前版本
    setVersion(CURRENT_VERSION);
    return { from: 0, to: CURRENT_VERSION, migrated: false, addedDefaults: added, firstRun: true };
  }
  if (from < CURRENT_VERSION) {
    // 预留逐级迁移(未来版本在此追加 case)
    setVersion(CURRENT_VERSION);
    return { from: from, to: CURRENT_VERSION, migrated: true, addedDefaults: added, firstRun: false };
  }
  if (from > CURRENT_VERSION) {
    // 存档来自更新版本:不动,提示(通常为降级运行)
    return { from: from, to: from, migrated: false, addedDefaults: added, firstRun: false, future: true };
  }
  return { from: from, to: CURRENT_VERSION, migrated: false, addedDefaults: added, firstRun: false };
}

module.exports = {
  VERSION_KEY: VERSION_KEY,
  CURRENT_VERSION: CURRENT_VERSION,
  DEFAULTS: DEFAULTS,
  getVersion: getVersion,
  setVersion: setVersion,
  ensureDefaults: ensureDefaults,
  migrate: migrate,
  exportAll: exportAll,
  importAll: importAll,
  checksum: checksum
};
