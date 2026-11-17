var sources = {
  drop: 'audio/drop.wav',
  merge: 'audio/merge.wav',
  big: 'audio/big.wav',
  boom: 'audio/boom.wav',
  clear: 'audio/clear.wav',
  ice: 'audio/ice.wav',
  star: 'audio/star.wav',
  magnet: 'audio/magnet.wav',
  gameover: 'audio/gameover.wav',
  best: 'audio/best.wav'
};

function AudioManager() {
  this.enabled = true;
  this.volume = 1;
  this.pool = {};
  this._unlock();
}

AudioManager.prototype.setVolume = function (v) {
  this.volume = Math.max(0, Math.min(1, v));
  for (var key in this.pool) {
    if (this.pool[key]) this.pool[key].volume = this.volume;
  }
};

AudioManager.prototype._unlock = function () {
  try {
    if (typeof tt.setInnerAudioOption === 'function') {
      tt.setInnerAudioOption({ obeyMuteSwitch: false, mixWithOther: true });
    }
  } catch (e) {}
};

AudioManager.prototype.setEnabled = function (on) {
  this.enabled = !!on;
};

AudioManager.prototype.isEnabled = function () {
  return this.enabled;
};

AudioManager.prototype.play = function (name) {
  if (!this.enabled) return;
  var ctx;
  try {
    ctx = this.pool[name];
    if (!ctx) {
      ctx = tt.createInnerAudioContext();
      ctx.obeyMuteSwitch = false;
      ctx.volume = this.volume;
      this.pool[name] = ctx;
    }
    ctx.stop();
    ctx.src = sources[name];
    ctx.play();
  } catch (e) {}
};

AudioManager.prototype.destroy = function () {
  try {
    for (var key in this.pool) {
      this.pool[key].destroy();
    }
    this.pool = {};
  } catch (e) {}
};

module.exports = {
  AudioManager: AudioManager
};
