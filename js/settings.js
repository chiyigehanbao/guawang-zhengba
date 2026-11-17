// js/settings.js —— 玩家偏好(震动/减少动态效果)
// 音频开关沿用既有 merge_watermelon_muted;本模块管理震动与减少动态效果。
var PREFS_KEY = 'merge_watermelon_prefs';

var DEFAULTS = { haptics: true, reducedMotion: false, tutorialDone: false, highContrast: false, colorblind: false, volume: 1, tutorialStage: 0 };

function read() {
  var o;
  try { o = tt.getStorageSync(PREFS_KEY); } catch (e) { o = null; }
  if (typeof o !== 'object' || o === null || o instanceof Array) o = {};
  return o;
}

function write(o) {
  try { tt.setStorageSync(PREFS_KEY, o); } catch (e) {}
}

function getPrefs() {
  var o = read();
  return {
    haptics: o.haptics === undefined ? DEFAULTS.haptics : !!o.haptics,
    reducedMotion: o.reducedMotion === undefined ? DEFAULTS.reducedMotion : !!o.reducedMotion,
    tutorialDone: !!o.tutorialDone,
    highContrast: !!o.highContrast,
    colorblind: !!o.colorblind,
    volume: o.volume === undefined ? DEFAULTS.volume : Math.max(0, Math.min(1, parseFloat(o.volume) || 1)),
    tutorialStage: parseInt(o.tutorialStage, 10) > 0 ? parseInt(o.tutorialStage, 10) : 0
  };
}

function getVolume() { return getPrefs().volume; }

function get(key) {
  return getPrefs()[key];
}

function set(key, val) {
  if (!(key in DEFAULTS)) return false;
  var o = read();
  o[key] = val;
  write(o);
  return true;
}

function toggle(key) {
  var v = !get(key);
  set(key, v);
  return v;
}

function isHaptics() { return getPrefs().haptics; }
function isReducedMotion() { return getPrefs().reducedMotion; }
function isTutorialDone() { return getPrefs().tutorialDone; }
function markTutorialDone() { set('tutorialDone', true); }
function isHighContrast() { return getPrefs().highContrast; }
function isColorblind() { return getPrefs().colorblind; }
function getTutorialStage() { return getPrefs().tutorialStage; }
function setTutorialStage(n) { set('tutorialStage', Math.max(0, Math.floor(n) || 0)); }

function reset() {
  write({});
}

module.exports = {
  PREFS_KEY: PREFS_KEY,
  DEFAULTS: DEFAULTS,
  getPrefs: getPrefs,
  get: get,
  set: set,
  toggle: toggle,
  isHaptics: isHaptics,
  isReducedMotion: isReducedMotion,
  isTutorialDone: isTutorialDone,
  markTutorialDone: markTutorialDone,
  isHighContrast: isHighContrast,
  isColorblind: isColorblind,
  getVolume: getVolume,
  getTutorialStage: getTutorialStage,
  setTutorialStage: setTutorialStage,
  reset: reset
};
