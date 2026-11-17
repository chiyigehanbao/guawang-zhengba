var fruits = require('./fruits');

var GRAVITY = 1500;
var MAX_SPEED = 1800;
var STEP = 1 / 60;
var RESTITUTION = 0.3;
var WALL_RESTITUTION = 0.4;
var FLOOR_RESTITUTION = 0.25;
var FLOOR_FRICTION = 0.6;
var PAIR_ITERATIONS = 6;
var MERGE_TOUCH = 1.08;
var PAD_BOUNCE = 1150;
var BELT_SPEED = 260;
var POP_TIME = 0.16;

var SPECIALS = {
  bomb: { radius: 26, fuse: 1.4 },
  ice: { radius: 28, fuse: 0.9 },
  star: { radius: 30, fuse: 0.6 },
  magnet: { radius: 32, fuse: 0.6 }
};

function Fruit(kind, type, x, y, scale) {
  this.kind = kind;
  this.type = type;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.scale = scale;
  this.radiusBase = fruits.TYPES[type].radius;
  this.r = this.radiusBase * scale;
  this.fuse = 1.4;
  this.justMerged = false;
  this.pop = 0;
  this.squash = 0;
  this.dead = false;
  this.iced = false;
  this.armed = false;
  this.static = false;
}

function World(width, floorY, scale) {
  this.width = width;
  this.floorY = floorY;
  this.scale = scale;
  this.fruits = [];
  this.events = [];
  this._handed = null;
  this._ePool = [];
  this.accumulator = 0;
}

World.prototype.reset = function (width, floorY, scale) {
  this.width = width;
  this.floorY = floorY;
  this.scale = scale;
  this.fruits = [];
  this.events = [];
  this._handed = null;
  this._ePool = [];
  this.accumulator = 0;
};

World.prototype.spawn = function (type, x, y) {
  var f = new Fruit('fruit', type, x, y, this.scale);
  this.fruits.push(f);
  return f;
};

World.prototype.spawnSpecial = function (kind, x, y) {
  var spec = SPECIALS[kind];
  var f = new Fruit(kind, 0, x, y, this.scale);
  f.radiusBase = spec.radius;
  f.r = spec.radius * this.scale;
  f.fuse = spec.fuse;
  this.fruits.push(f);
  return f;
};

// 棋盘障碍方块:静止不可动、不可合成,仅可被重锤/炸弹清除
World.prototype.spawnBlock = function (x, y, r) {
  var f = new Fruit('block', 0, x, y, this.scale);
  f.radiusBase = r;
  f.r = r * this.scale;
  f.static = true;
  this.fruits.push(f);
  return f;
};

// 弹床机关:静止,水果接触时被向上弹起
World.prototype.spawnPad = function (x, y, r) {
  var f = new Fruit('pad', 0, x, y, this.scale);
  f.radiusBase = r;
  f.r = r * this.scale;
  f.static = true;
  this.fruits.push(f);
  return f;
};

// 传送带:静止,水果接触时被水平推动(dir = ±1)
World.prototype.spawnBelt = function (x, y, r, dir) {
  var f = new Fruit('belt', 0, x, y, this.scale);
  f.radiusBase = r;
  f.r = r * this.scale;
  f.static = true;
  f.dir = dir < 0 ? -1 : 1;
  this.fruits.push(f);
  return f;
};

// 毒刺:静止,水果接触即被刺破销毁
World.prototype.spawnSpike = function (x, y, r) {
  var f = new Fruit('spike', 0, x, y, this.scale);
  f.radiusBase = r;
  f.r = r * this.scale;
  f.static = true;
  this.fruits.push(f);
  return f;
};

World.prototype.freezeAll = function () {
  for (var i = 0; i < this.fruits.length; i++) {
    var f = this.fruits[i];
    if (f.dead) continue;
    f.iced = true;
    f.vx = 0;
    f.vy = 0;
  }
};

World.prototype.thawAll = function () {
  for (var i = 0; i < this.fruits.length; i++) {
    this.fruits[i].iced = false;
  }
};

World.prototype.step = function (dt) {
  this.accumulator += dt;
  if (this.accumulator > 0.1) {
    this.accumulator = 0.1;
  }
  while (this.accumulator >= STEP) {
    this.substep(STEP);
    this.accumulator -= STEP;
  }
};

World.prototype.substep = function (dt) {
  var i, f;
  for (i = 0; i < this.fruits.length; i++) {
    f = this.fruits[i];
    if (f.dead || f.iced || f.static) continue;
    f.vy += GRAVITY * dt;
    this.clampSpeed(f);
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    this.solveWalls(f);
  }
  for (i = 0; i < PAIR_ITERATIONS; i++) {
    this.resolvePairs();
    for (var j = 0; j < this.fruits.length; j++) {
      this.solveWalls(this.fruits[j]);
    }
  }
  for (i = 0; i < this.fruits.length; i++) {
    if (this.fruits[i].justMerged) {
      this.fruits[i].justMerged = false;
    }
  }
  this.pruneDead();
};

World.prototype.clampSpeed = function (f) {
  var speed = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
  if (speed > MAX_SPEED) {
    var k = MAX_SPEED / speed;
    f.vx *= k;
    f.vy *= k;
  }
};

World.prototype.solveWalls = function (f) {
  if (f.dead || f.iced) return;
  if (f.x - f.r < 0) {
    f.x = f.r;
    f.vx = Math.abs(f.vx) * WALL_RESTITUTION;
  } else if (f.x + f.r > this.width) {
    f.x = this.width - f.r;
    f.vx = -Math.abs(f.vx) * WALL_RESTITUTION;
  }
  if (f.y + f.r > this.floorY) {
    f.y = this.floorY - f.r;
    if (f.vy > 0) {
      if (f.kind === 'fruit' && f.vy > 420) f.squash = 1;
      f.vy = -f.vy * FLOOR_RESTITUTION;
    }
    f.vx *= FLOOR_FRICTION;
    if (f.kind !== 'fruit') f.armed = true;
  }
};

var GRID_MIN = -8;
var GRID_MAX_X = 80;
var GRID_MAX_Y = 120;
var GRID_SPAN_Y = GRID_MAX_Y - GRID_MIN + 1;

function gridKey(ix, iy) {
  return (ix - GRID_MIN) * GRID_SPAN_Y + (iy - GRID_MIN);
}

World.prototype.resolvePairs = function () {
  var list = this.fruits;
  var n = list.length;
  if (n < 2) return;
  // 本轮合并新生成的水果不参与本轮
  var active = this._active || (this._active = []);
  active.length = 0;
  var i, f;
  for (i = 0; i < n; i++) {
    f = list[i];
    if (f.dead) continue;
    f._ai = active.length;
    active.push(f);
  }
  var m = active.length;
  if (m < 2) return;

  var cell = 56 * this.scale;
  if (cell < 28) cell = 28;
  var buckets = this._buckets || (this._buckets = []);
  var used = this._usedBuckets || (this._usedBuckets = []);
  for (i = 0; i < used.length; i++) used[i].length = 0;
  used.length = 0;

  var mt = MERGE_TOUCH;
  var ix, iy, x0, x1, y0, y1, key, bucket, ext;
  for (i = 0; i < m; i++) {
    f = active[i];
    ext = f.r * mt;
    x0 = Math.floor((f.x - ext) / cell);
    x1 = Math.floor((f.x + ext) / cell);
    y0 = Math.floor((f.y - ext) / cell);
    y1 = Math.floor((f.y + ext) / cell);
    if (x0 < GRID_MIN) x0 = GRID_MIN;
    if (y0 < GRID_MIN) y0 = GRID_MIN;
    if (x1 > GRID_MAX_X) x1 = GRID_MAX_X;
    if (y1 > GRID_MAX_Y) y1 = GRID_MAX_Y;
    for (iy = y0; iy <= y1; iy++) {
      for (ix = x0; ix <= x1; ix++) {
        key = gridKey(ix, iy);
        bucket = buckets[key];
        if (!bucket) {
          bucket = [];
          buckets[key] = bucket;
        }
        if (bucket.length === 0) used.push(bucket);
        bucket.push(f);
      }
    }
  }

  var seen = this._seen || (this._seen = []);
  var need = m * m;
  if (seen.length < need) {
    for (i = seen.length; i < need; i++) seen[i] = 0;
  }
  var gen = (this._pairGen = (this._pairGen || 0) + 1);
  if (gen > 1000000) {
    gen = this._pairGen = 1;
    for (i = 0; i < seen.length; i++) seen[i] = 0;
  }

  var ai, bi, a, b, dx, dy, reach, ia, ib, slot, bn;
  for (i = 0; i < used.length; i++) {
    bucket = used[i];
    bn = bucket.length;
    for (ai = 0; ai < bn - 1; ai++) {
      a = bucket[ai];
      if (a.dead) continue;
      ia = a._ai;
      for (bi = ai + 1; bi < bn; bi++) {
        b = bucket[bi];
        if (b.dead) continue;
        ib = b._ai;
        slot = ia < ib ? ia * m + ib : ib * m + ia;
        if (seen[slot] === gen) continue;
        seen[slot] = gen;
        if ((a.iced || a.static) && (b.iced || b.static)) continue;
        dx = b.x - a.x;
        dy = b.y - a.y;
        reach = (a.r + b.r) * mt;
        if (dx >= reach || dx <= -reach || dy >= reach || dy <= -reach) continue;
        this.resolvePair(a, b, dx, dy);
      }
    }
  }
};

World.prototype.resolvePair = function (a, b, dx, dy) {
  var dist, minDist, overlap, nx, ny, rel, j, e, tx, ty, t;
  minDist = a.r + b.r;
  dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return;
  if (a.kind === 'fruit' && b.kind === 'fruit' && a.type === b.type && a.type < fruits.TYPES.length - 1 && !a.iced && !b.iced && !a.justMerged && !b.justMerged && dist < minDist * MERGE_TOUCH) {
    this.merge(a, b);
    return;
  }
  if (dist >= minDist) return;
  if (!a.iced && !a.static && a.kind !== 'fruit') a.armed = true;
  if (!b.iced && !b.static && b.kind !== 'fruit') b.armed = true;
  overlap = minDist - dist;
  nx = dx / dist;
  ny = dy / dist;
  if (a.iced || a.static) {
    if (a.kind === 'spike' && b.kind === 'fruit' && !b.iced) {
      b.dead = true;
      this.emit('spike', b.x, b.y, b.type);
      return;
    }
    b.x += nx * overlap;
    b.y += ny * overlap;
    if (a.kind === 'pad' && b.kind === 'fruit' && !b.iced) b.vy = -PAD_BOUNCE;
    if (a.kind === 'belt' && b.kind === 'fruit' && !b.iced) b.vx += a.dir * BELT_SPEED * 0.5;
    rel = b.vx * nx + b.vy * ny;
    if (rel < 0) {
      e = RESTITUTION;
      j = -(1 + e) * rel;
      b.vx += j * nx;
      b.vy += j * ny;
    }
  } else if (b.iced || b.static) {
    if (b.kind === 'spike' && a.kind === 'fruit' && !a.iced) {
      a.dead = true;
      this.emit('spike', a.x, a.y, a.type);
      return;
    }
    a.x -= nx * overlap;
    a.y -= ny * overlap;
    if (b.kind === 'pad' && a.kind === 'fruit' && !a.iced) a.vy = -PAD_BOUNCE;
    if (b.kind === 'belt' && a.kind === 'fruit' && !a.iced) a.vx += b.dir * BELT_SPEED * 0.5;
    rel = -(a.vx * nx + a.vy * ny);
    if (rel < 0) {
      e = RESTITUTION;
      j = -(1 + e) * rel;
      a.vx -= j * nx;
      a.vy -= j * ny;
    }
  } else {
    a.x -= nx * overlap * 0.5;
    a.y -= ny * overlap * 0.5;
    b.x += nx * overlap * 0.5;
    b.y += ny * overlap * 0.5;
    rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (rel < 0) {
      e = RESTITUTION;
      j = -(1 + e) * rel * 0.5;
      a.vx -= j * nx;
      a.vy -= j * ny;
      b.vx += j * nx;
      b.vy += j * ny;
    }
    tx = -ny;
    ty = nx;
    t = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty;
    a.vx += t * 0.08 * tx;
    a.vy += t * 0.08 * ty;
    b.vx -= t * 0.08 * tx;
    b.vy -= t * 0.08 * ty;
  }
};

World.prototype.merge = function (a, b) {
  var newType = a.type + 1;
  var cx = (a.x + b.x) / 2;
  var cy = (a.y + b.y) / 2;
  var vx = (a.vx + b.vx) / 2;
  var vy = (a.vy + b.vy) / 2;
  a.dead = true;
  b.dead = true;
  var merged = new Fruit('fruit', newType, cx, cy, this.scale);
  merged.vx = vx;
  merged.vy = vy;
  merged.justMerged = true;
  merged.pop = 1;
  this.fruits.push(merged);
  this.emit('merge', cx, cy, a.type, newType);
};

World.prototype.emit = function (type, x, y, oldType, newType) {
  var e = this._ePool.pop();
  if (!e) e = {};
  e.type = type;
  e.x = x;
  e.y = y;
  e.oldType = oldType;
  e.newType = newType;
  this.events.push(e);
};

World.prototype.pruneDead = function () {
  var list = this.fruits;
  var i = 0;
  while (i < list.length) {
    if (!list[i].dead) {
      i += 1;
      continue;
    }
    var last = list.pop();
    if (i < list.length) list[i] = last;
  }
};

World.prototype.anyAbove = function (lineY) {
  for (var i = 0; i < this.fruits.length; i++) {
    var f = this.fruits[i];
    if (f.dead) continue;
    if (f.y - f.r < lineY) return true;
  }
  return false;
};

World.prototype.consumeEvents = function () {
  var prev = this._handed;
  if (prev) {
    for (var i = 0; i < prev.length; i++) this._ePool.push(prev[i]);
    prev.length = 0;
  }
  var live = this.events;
  this.events = prev || [];
  this._handed = live;
  return live;
};

module.exports = {
  World: World,
  PAD_BOUNCE: PAD_BOUNCE,
  BELT_SPEED: BELT_SPEED,
  POP_TIME: POP_TIME
};
