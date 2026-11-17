var TYPES = [
  { name: 'grape', emoji: '🍇', score: 1, radius: 16 },
  { name: 'cherry', emoji: '🍒', score: 3, radius: 22 },
  { name: 'orange', emoji: '🍊', score: 6, radius: 28 },
  { name: 'lemon', emoji: '🍋', score: 10, radius: 34 },
  { name: 'kiwi', emoji: '🥝', score: 15, radius: 40 },
  { name: 'tomato', emoji: '🍅', score: 21, radius: 47 },
  { name: 'peach', emoji: '🍑', score: 28, radius: 54 },
  { name: 'apple', emoji: '🍎', score: 36, radius: 61 },
  { name: 'pear', emoji: '🍐', score: 45, radius: 68 },
  { name: 'watermelon', emoji: '🍉', score: 55, radius: 76 },
  { name: 'king', emoji: '👑', score: 80, radius: 88 }
];

var DROP_POOL = [0, 0, 0, 1, 1, 2, 3];

module.exports = {
  TYPES: TYPES,
  DROP_POOL: DROP_POOL
};
