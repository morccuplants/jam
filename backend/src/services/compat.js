// backend/services/compat.js
// CommonJS mirror of the compatible() function from frontend/src/quiz.js.
// Only this file is imported by the backend — raw quiz answers never reach the server.

function compatible(a, b) {
  return {
    rel_length: (a.rel_length == null || b.rel_length == null)
      ? null
      : a.rel_length === b.rel_length ? 'high'
      : Math.abs(a.rel_length - b.rel_length) === 1 ? 'medium'
      : 'low',
    values:    _band(_jaccardBits(a.annoyances, b.annoyances, 9) * 0.4 +
                     _jaccardBits(a.substances, b.substances, 7) * 0.6),
    chemistry: _band(_scalarSim(a.chemistry, b.chemistry)),
    fun:       _band(_scalarSim(a.fun, b.fun)),
    sex:       (a.sex == null || b.sex == null)
                 ? null
                 : _band(_scalarSim(a.sex, b.sex)),
  };
}

function _jaccardBits(a, b, n) {
  if (a === 0 && b === 0) return 1;
  const m = (1 << n) - 1;
  const intersection = _pop(a & b & m);
  const union = _pop((a | b) & m);
  return union === 0 ? 1 : intersection / union;
}

function _scalarSim(a, b) { return 1 - Math.abs(a - b); }

function _band(s) {
  if (s >= 0.70) return 'high';
  if (s >= 0.40) return 'medium';
  return 'low';
}

function _pop(n) { let c = 0; while (n) { n &= n - 1; c++; } return c; }

module.exports = { compatible };
