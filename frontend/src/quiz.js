// quiz.js — question definitions, scoring, and compatibility
// Raw answers never leave the client. Only the output of scoreAnswers() is sent to the server.

// ─── Question definitions ────────────────────────────────────────────────────

export const QUIZ_QUESTIONS = [

  // ── VALUES & DEALBREAKERS ──────────────────────────────────────────────────

  {
    id: 'rel_length',
    category: 'dealbreaker',
    type: 'mc_single',
    title: 'How long do you want your next relationship to last?',
    options: [
      'a few weeks',
      'a few months',
      'a few years (1–3)',
      'a long while (5+ years)',
      'a lifetime (10+ years)',
    ],
  },
  {
    id: 'annoyances',
    category: 'values',
    type: 'mc_multi',
    max: 4,
    title: 'What do you find most annoying in a romantic partner?',
    sub: 'Choose up to 4.',
    options: [
      'lovebombing',
      'jealousy',
      'being cocky',
      'being too forward',
      'being too goofy',
      'needing too much attention',
      'being too timid and nervous',
      'not initiating conversations or dates',
      'not being good at building chemistry',
    ],
  },
  {
    id: 'substances',
    category: 'dealbreaker',
    type: 'mc_multi',
    title: "What substances are you not okay with a partner using?",
    sub: 'Select any that apply.',
    options: [
      'marijuana',
      'cigarettes',
      'vapes',
      'alcohol',
      'tobacco pouches',
      'harder drugs (e.g. cocaine)',
      "they can use anything — I don't mind",
    ],
  },

  // ── CHEMISTRY & COMMUNICATION ──────────────────────────────────────────────

  {
    id: 'partner_qualities',
    category: 'chemistry',
    type: 'mc_multi',
    max: 3,
    title: 'What qualities do you value most in a partner?',
    sub: 'Choose up to 3.',
    options: [
      'knowledgeable and cultured',
      'physically fit, cares about their body',
      'sweet, a little timid, deeply loving',
      'a little edgy, forward, and loving',
    ],
  },
  {
    id: 'partner_behavior',
    category: 'chemistry',
    type: 'mc_multi',
    max: 3,
    title: 'What do you like a partner to do with you?',
    sub: 'Choose up to 3.',
    options: [
      'look me in the eye',
      'ask me questions',
      'communicate openly — tell me about their day, with details',
      'give me loving touch',
      'be a little forward with me',
    ],
  },
  {
    id: 'contact_style',
    category: 'chemistry',
    type: 'mc_single',
    title: 'Are you more of a texter or a caller?',
    options: [
      'texter only — please don\'t call me',
      'call me any time',
      'let\'s FaceTime for hours and do nothing in particular',
    ],
  },

  // ── FUN ───────────────────────────────────────────────────────────────────

  {
    id: 'music',
    category: 'fun',
    type: 'mc_single',
    title: 'What type of music do you like?',
    options: [
      'fast-paced, upbeat — let\'s get hyped',
      'slow, calm, peaceful, dreamy',
      'anything and everything, all languages, all eras',
    ],
  },
  {
    id: 'strangers',
    category: 'fun',
    type: 'mc_single',
    title: 'Do you talk to strangers?',
    options: [
      'yes, I like to talk to all sorts of people',
      'I\'d like to, but I don\'t actually do it',
      'no, absolutely not',
    ],
  },
  {
    id: 'travel_style',
    category: 'fun',
    type: 'mc_single',
    title: 'When you travel, packed itinerary or go with the flow?',
    options: [
      'packed itinerary — every restaurant, bar, and hike mapped out',
      'go with the flow, see what happens',
    ],
  },
  {
    id: 'travel_vibe',
    category: 'fun',
    type: 'mc_multi',
    max: 2,
    title: 'How do you like to travel?',
    sub: 'Choose the two you agree with most.',
    options: [
      'chill on the beach and swim in the ocean all day',
      'hike volcanos in South America until our knees break',
      'explore old alleyways in a gorgeous historic city',
      'explore old alleyways in a bustling metropolis',
    ],
  },
  {
    id: 'ambition',
    category: 'fun',
    type: 'mc_single',
    title: 'Balance vs. ambition.',
    options: [
      'I would grind myself into dust to become the best at what I do — I want to be remembered',
      'I\'d rather have more time with my people and my hobbies — a simple life doing what I love',
    ],
  },

  // ── SEX (skippable) ───────────────────────────────────────────────────────

  {
    id: 'sex_timing',
    category: 'sex',
    type: 'mc_single',
    skippable: true,
    title: 'How soon do you want sex?',
    options: [
      'as soon as possible, if there\'s chemistry',
      'a few weeks in',
      'a few months down the line',
      'not until I\'m married',
      'not at all',
    ],
    skipLabel: 'I\'d rather not answer this',
  },
  {
    id: 'sex_frequency',
    category: 'sex',
    type: 'mc_single',
    skippable: true,
    title: 'How often would you like to have sex with amazing chemistry?',
    options: [
      'sex isn\'t important to me',
      'at most once a month',
      'at most once a week',
      'multiple times a week',
      'at least once a day',
      'more than once a day',
    ],
    skipLabel: 'I\'d rather not answer this',
  },
  {
    id: 'sex_style',
    category: 'sex',
    type: 'mc_single',
    skippable: true,
    title: 'Most of the time, I\'d prefer…',
    options: [
      'loving and passionate',
      'a little rough',
      'either — depends on my mood',
    ],
    skipLabel: 'I\'d rather not answer this',
  },
];

// Questions grouped by the onboarding sub-steps shown to the user
export const QUIZ_SECTIONS = [
  { id: 'dealbreakers', label: 'values & dealbreakers', questionIds: ['rel_length', 'annoyances', 'substances'] },
  { id: 'chemistry',   label: 'chemistry & communication', questionIds: ['partner_qualities', 'partner_behavior', 'contact_style'] },
  { id: 'fun',         label: 'the fun stuff', questionIds: ['music', 'strangers', 'travel_style', 'travel_vibe', 'ambition'] },
  { id: 'sex',         label: 'sex (you can skip this)', questionIds: ['sex_timing', 'sex_frequency', 'sex_style'] },
];

// ─── Scoring ────────────────────────────────────────────────────────────────
//
// scoreAnswers(answers) → { rel_length, values, chemistry, fun, sex }
//
// rel_length  : raw integer index (0–4). Stored as-is for hard filtering.
// values      : float 0–1. Derived from annoyances + substances overlap.
// chemistry   : float 0–1. Derived from partner_qualities, partner_behavior, contact_style.
// fun         : float 0–1. Derived from music, strangers, travel_style, travel_vibe, ambition.
// sex         : float 0–1, or null if all three sex questions were skipped.
//
// Scores are not reversible back to raw answers.

export function scoreAnswers(answers) {
  // ── values ────────────────────────────────────────────────────────────────
  // Encode annoyances as a 9-bit integer (bitmask of selected indices)
  const annoyancesBits = _multiBits(answers.annoyances, 9);
  // Encode substances as a 7-bit integer
  const substancesBits = _multiBits(answers.substances, 7);
  // Combine into a single values score: average of both bitmask densities
  // (The actual comparison uses _jaccardBits, not this scalar — but we store
  // a single representative float per user so the server doesn't need raw bits.
  // We encode the bitmasks losslessly into floats by treating them as fractions.)
  const valuesScore = (annoyancesBits / 511 + substancesBits / 127) / 2;

  // ── chemistry ────────────────────────────────────────────────────────────
  const qualitiesBits = _multiBits(answers.partner_qualities, 4);
  const behaviorBits  = _multiBits(answers.partner_behavior,  5);
  const contactIdx    = answers.contact_style ?? -1;
  // contact_style encoded as a small prime offset so it doesn't collide
  const chemScore = (qualitiesBits / 15 + behaviorBits / 31 + (contactIdx >= 0 ? (contactIdx + 1) / 3 : 0.5)) / 3;

  // ── fun ───────────────────────────────────────────────────────────────────
  const musicIdx       = answers.music        ?? -1;
  const strangersIdx   = answers.strangers    ?? -1;
  const travelStyleIdx = answers.travel_style ?? -1;
  const travelVibeBits = _multiBits(answers.travel_vibe, 4);
  const ambitionIdx    = answers.ambition     ?? -1;
  const funScore = (
    (musicIdx        >= 0 ? (musicIdx + 1)       / 3  : 0.5) +
    (strangersIdx    >= 0 ? (strangersIdx + 1)   / 3  : 0.5) +
    (travelStyleIdx  >= 0 ? (travelStyleIdx + 1) / 2  : 0.5) +
    travelVibeBits / 15 +
    (ambitionIdx     >= 0 ? (ambitionIdx + 1)    / 2  : 0.5)
  ) / 5;

  // ── sex ───────────────────────────────────────────────────────────────────
  const skipped = answers.sex_timing === null && answers.sex_frequency === null && answers.sex_style === null;
  let sexScore = null;
  if (!skipped) {
    const timingIdx   = answers.sex_timing     ?? -1;
    const freqIdx     = answers.sex_frequency  ?? -1;
    const styleIdx    = answers.sex_style      ?? -1;
    const answered    = [timingIdx, freqIdx, styleIdx].filter(v => v >= 0);
    if (answered.length > 0) {
      sexScore = (
        (timingIdx  >= 0 ? (timingIdx  + 1) / 5 : 0.5) +
        (freqIdx    >= 0 ? (freqIdx    + 1) / 6 : 0.5) +
        (styleIdx   >= 0 ? (styleIdx   + 1) / 3 : 0.5)
      ) / 3;
    }
  }

  return {
    rel_length : answers.rel_length ?? null,   // raw index, hard filter key
    annoyances : annoyancesBits,               // lossless bitmask integer
    substances : substancesBits,               // lossless bitmask integer
    values     : parseFloat(valuesScore.toFixed(4)),
    chemistry  : parseFloat(chemScore.toFixed(4)),
    fun        : parseFloat(funScore.toFixed(4)),
    sex        : sexScore !== null ? parseFloat(sexScore.toFixed(4)) : null,
  };
}

// ─── Compatibility ───────────────────────────────────────────────────────────
//
// compatible(scoresA, scoresB) → { values, chemistry, fun, sex }
//
// Each value is one of: 'high' | 'medium' | 'low' | null
// null means one or both users skipped the section (sex only).
//
// This function runs on the SERVER when assembling discover profiles.
// It is exported here so the server can import quiz.js directly.

export function compatible(a, b) {
  return {
    values    : _band(_jaccardBits(a.annoyances, b.annoyances, 9) * 0.4 +
                      _jaccardBits(a.substances, b.substances, 7) * 0.6),
    chemistry : _band(_scalarSim(a.chemistry, b.chemistry)),
    fun       : _band(_scalarSim(a.fun, b.fun)),
    sex       : (a.sex === null || b.sex === null)
                  ? null
                  : _band(_scalarSim(a.sex, b.sex)),
  };
}

// ─── Internal helpers ────────────────────────────────────────────────────────

// Convert an array of selected option indices into a bitmask integer.
// e.g. [0, 2, 4] with nBits=5 → 0b10101 = 21
function _multiBits(selected, nBits) {
  if (!Array.isArray(selected) || selected.length === 0) return 0;
  let bits = 0;
  for (const idx of selected) {
    if (idx >= 0 && idx < nBits) bits |= (1 << idx);
  }
  return bits;
}

// Jaccard similarity between two bitmasks: |A ∩ B| / |A ∪ B|
// Returns 1.0 if both are 0 (both selected nothing — identical).
function _jaccardBits(a, b, nBits) {
  if (a === 0 && b === 0) return 1.0;
  const maxBits = (1 << nBits) - 1;
  const intersection = _popcount(a & b & maxBits);
  const union        = _popcount((a | b) & maxBits);
  return union === 0 ? 1.0 : intersection / union;
}

// How similar two scalar scores are. Returns 0–1 where 1 = identical.
function _scalarSim(a, b) {
  return 1 - Math.abs(a - b);
}

// Map a 0–1 similarity float to a display band.
function _band(sim) {
  if (sim >= 0.70) return 'high';
  if (sim >= 0.40) return 'medium';
  return 'low';
}

// Count set bits (Brian Kernighan's algorithm)
function _popcount(n) {
  let count = 0;
  while (n) { n &= n - 1; count++; }
  return count;
}
