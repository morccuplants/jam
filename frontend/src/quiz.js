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
    // Each entry: { substance, comfort }
    // comfort is one of: 'never' | 'occasionally' | 'always'
    // Stored as an object keyed by substance name.
    id: 'substances',
    category: 'dealbreaker',
    type: 'mc_drugs',
    title: 'What substances are you not okay with a partner using?',
    sub: 'For each, pick your comfort level.',
    skippable: true,
    skipLabel: "I'd rather not answer",
    drugs: [
      'marijuana',
      'cigarettes',
      'vapes',
      'alcohol',
      'tobacco pouches',
      'harder drugs (e.g. cocaine)',
    ],
  },

  // ── CHEMISTRY & COMMUNICATION ──────────────────────────────────────────────

  {
    id: 'partner_qualities',
    category: 'chemistry',
    type: 'mc_rank',
    title: 'What qualities do you value most in a partner?',
    sub: 'Rank from most to least important.',
    options: [
      'knowledgeable and cultured',
      'physically fit, cares about their body',
      'sweet, a little timid, deeply loving',
      'a little edgy, forward, and loving',
      'practical and reliable',
      'adventurous and open to new things',
    ],
  },
  {
    id: 'contact_style',
    category: 'chemistry',
    type: 'mc_single',
    title: 'Are you more of a texter or a caller?',
    options: [
      "texter only — please don't call me",
      'call me any time',
      "let's FaceTime for hours and do nothing in particular",
    ],
  },

  // ── FUN ───────────────────────────────────────────────────────────────────

  {
    id: 'interests',
    category: 'fun',
    type: 'mc_multi',
    title: 'Pick the things that are your scene.',
    sub: 'Choose as many as apply.',
    options: [
      'dancing',
      'arts & crafts',
      'pottery',
      'cooking / food',
      'rock climbing',
      'hiking',
      'reading',
      'board games',
      'live music',
      'film',
      'theatre',
      'yoga / wellness',
      'running / cycling',
      'photography',
      'writing',
      'gaming',
      'gardening',
    ],
  },
  {
    id: 'strangers',
    category: 'fun',
    type: 'mc_single',
    title: 'Do you talk to strangers?',
    options: [
      'yes, I like to talk to all sorts of people',
      "I'd like to, but I don't actually do it",
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
      'I make a light plan with lots of breathing room to get lost and explore',
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
      'explore old alleyways in a gorgeous historic city',
      'party all night in a bustling metropolis',
      'eat my way through a city — farmers markets, hole-in-the-wall spots, one Michelin star',
      'an adrenaline trip — surfing, skydiving, backcountry hiking',
    ],
  },
  {
    id: 'ambition',
    category: 'fun',
    type: 'mc_single',
    title: 'Ambition or balance?',
    options: [
      'I would grind myself into dust to become the best at what I do — I want to be remembered',
      "I'd rather have more time with my people and my hobbies — a simple life doing what I love",
    ],
  },
  {
    id: 'alone_time',
    category: 'fun',
    type: 'mc_single',
    title: 'How much alone time do you need?',
    options: [
      'very little — I recharge around people',
      'some — I like a good mix',
      'quite a bit — I need regular solo time',
      'a lot — solitude is essential for me',
    ],
  },
  {
    id: 'ideal_weekday',
    category: 'fun',
    type: 'mc_single',
    title: 'Ideal weekday night?',
    options: [
      'cook dinner and watch something',
      'gym, then wind down',
      'catch up with a friend or two',
      'work late on something I care about',
      'out at a bar or event',
      'early to bed, no exceptions',
    ],
  },
  {
    id: 'ideal_weekend',
    category: 'fun',
    type: 'mc_single',
    title: 'Ideal weekend night?',
    options: [
      "dinner party at someone's place",
      'a great restaurant, just us two',
      'out until 2am — dancing or a bar',
      'concert, show, or some kind of event',
      'movie night on the couch',
      "whatever, I'm spontaneous",
    ],
  },
  {
    id: 'fitness',
    category: 'fun',
    type: 'mc_single',
    title: 'How active are you?',
    options: [
      'not really — pretty sedentary',
      'a little — occasional walks, nothing structured',
      'moderately — I work out a few times a week',
      'very active — exercise is a big part of my life',
    ],
  },
  {
    id: 'pets',
    category: 'fun',
    type: 'mc_single',
    title: 'Pets?',
    options: [
      'I have pets and love them',
      "I don't have pets but I'm open to them",
      "I'd rather not live with pets",
      "I'm allergic",
    ],
  },
  {
    id: 'pet_types',
    category: 'fun',
    type: 'mc_multi',
    title: 'Which pets do you like?',
    sub: 'Pick any that apply.',
    options: [
      'cats',
      'dogs',
      'anything',
    ],
  },
  {
    id: 'loud_quiet',
    category: 'fun',
    type: 'mc_single',
    title: 'Loud life or quiet life?',
    sub: 'Think about how you want your home and social world to feel.',
    options: [
      'big and loud — lots of people coming through',
      'mostly quiet — just the two of us, plus close friends',
      'a mix — cozy at home, lively when we go out',
      "I don't know yet",
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
      "as soon as possible, if there's chemistry",
      'a few weeks in',
      'a few months down the line',
      "not until I'm married",
      'not at all',
    ],
    skipLabel: "I'd rather not answer this",
  },
  {
    id: 'sex_frequency',
    category: 'sex',
    type: 'mc_single',
    skippable: true,
    title: 'How often would you like to have sex with amazing chemistry?',
    options: [
      "sex isn't important to me",
      'at most once a month',
      'at most once a week',
      'multiple times a week',
      'at least once a day',
      'more than once a day',
    ],
    skipLabel: "I'd rather not answer this",
  },
  {
    id: 'sex_style',
    category: 'sex',
    type: 'mc_single',
    skippable: true,
    title: "Most of the time, I'd prefer…",
    options: [
      'loving and passionate',
      'a little rough',
      'either — depends on my mood',
    ],
    skipLabel: "I'd rather not answer this",
  },
];

// Questions grouped by the onboarding sub-steps shown to the user
export const QUIZ_SECTIONS = [
  { id: 'dealbreakers', label: 'values & dealbreakers', questionIds: ['rel_length', 'annoyances', 'substances'] },
  { id: 'chemistry',   label: 'chemistry & communication', questionIds: ['partner_qualities', 'contact_style'] },
  { id: 'fun',         label: 'the fun stuff', questionIds: ['interests', 'strangers', 'travel_style', 'travel_vibe', 'ambition', 'alone_time', 'ideal_weekday', 'ideal_weekend', 'fitness', 'pets', 'pet_types', 'loud_quiet'] },
  { id: 'sex',         label: 'sex (you can skip this)', questionIds: ['sex_timing', 'sex_frequency', 'sex_style'] },
];

// ─── Scoring ────────────────────────────────────────────────────────────────
//
// scoreAnswers(answers) → { rel_length, annoyances, substances, values, chemistry, fun, sex }
//
// rel_length  : raw integer index (0–4). Stored as-is for hard filtering.
// annoyances  : bitmask integer (9 bits). Lossless.
// substances  : object { drug: 0|1|2 } where 0=never, 1=occasionally, 2=always.
//               Encoded per-drug so compatible() can compare comfort levels directly.
// values      : float 0–1. Derived from annoyances overlap.
// chemistry   : float 0–1. Derived from partner_qualities rank + contact_style.
// fun         : float 0–1. Derived from interests, strangers, travel_style, travel_vibe,
//               ambition, alone_time, ideal_weekday, ideal_weekend, fitness, loud_quiet.
// sex         : float 0–1, or null if all three sex questions were skipped.
//
// Scores are not reversible back to raw answers.

const DRUG_COMFORT = { never: 0, occasionally: 1, always: 2 };
const DRUG_LIST = ['marijuana', 'cigarettes', 'vapes', 'alcohol', 'tobacco pouches', 'harder drugs (e.g. cocaine)'];

export function scoreAnswers(answers) {
  // ── values ────────────────────────────────────────────────────────────────
  const annoyancesBits = _multiBits(answers.annoyances, 9);
  // substances: encode each drug's comfort level as 0/1/2. null/skipped → 1 (neutral).
  const substancesEncoded = {};
  if (answers.substances && typeof answers.substances === 'object') {
    for (const drug of DRUG_LIST) {
      const raw = answers.substances[drug];
      substancesEncoded[drug] = raw !== undefined ? (DRUG_COMFORT[raw] ?? 1) : 1;
    }
  } else {
    for (const drug of DRUG_LIST) substancesEncoded[drug] = 1;
  }
  // scalar representative: average comfort level normalised to 0–1
  const substancesScalar = DRUG_LIST.reduce((sum, d) => sum + substancesEncoded[d], 0) / (DRUG_LIST.length * 2);
  const valuesScore = (annoyancesBits / 511 + substancesScalar) / 2;

  // ── chemistry ────────────────────────────────────────────────────────────
  // partner_qualities is now a ranked array of option indices (most → least important).
  // Encode as a weighted sum: position 0 gets weight 6, position 5 gets weight 1.
  const nQualities = 6;
  let qualitiesScore = 0;
  if (Array.isArray(answers.partner_qualities) && answers.partner_qualities.length > 0) {
    const ranked = answers.partner_qualities;
    const totalWeight = ranked.reduce((s, _, i) => s + (nQualities - i), 0);
    qualitiesScore = ranked.reduce((s, optIdx, rankPos) => s + optIdx * (nQualities - rankPos), 0) / (totalWeight * (nQualities - 1));
  } else {
    qualitiesScore = 0.5;
  }
  const contactIdx = answers.contact_style ?? -1;
  const chemScore = (qualitiesScore + (contactIdx >= 0 ? (contactIdx + 1) / 3 : 0.5)) / 2;

  // ── fun ───────────────────────────────────────────────────────────────────
  const interestsBits  = _multiBits(answers.interests,     17);
  const strangersIdx   = answers.strangers    ?? -1;
  const travelStyleIdx = answers.travel_style ?? -1;
  const travelVibeBits = _multiBits(answers.travel_vibe,    5);
  const ambitionIdx    = answers.ambition     ?? -1;
  const aloneTimeIdx   = answers.alone_time   ?? -1;
  const weekdayIdx     = answers.ideal_weekday ?? -1;
  const weekendIdx     = answers.ideal_weekend ?? -1;
  const fitnessIdx     = answers.fitness      ?? -1;
  const loudQuietIdx   = answers.loud_quiet   ?? -1;
  const funScore = (
    interestsBits / ((1 << 17) - 1) +
    (strangersIdx   >= 0 ? (strangersIdx   + 1) / 3 : 0.5) +
    (travelStyleIdx >= 0 ? (travelStyleIdx + 1) / 2 : 0.5) +
    travelVibeBits  / ((1 << 5) - 1) +
    (ambitionIdx    >= 0 ? (ambitionIdx    + 1) / 2 : 0.5) +
    (aloneTimeIdx   >= 0 ? (aloneTimeIdx   + 1) / 4 : 0.5) +
    (weekdayIdx     >= 0 ? (weekdayIdx     + 1) / 6 : 0.5) +
    (weekendIdx     >= 0 ? (weekendIdx     + 1) / 6 : 0.5) +
    (fitnessIdx     >= 0 ? (fitnessIdx     + 1) / 4 : 0.5) +
    (loudQuietIdx   >= 0 ? (loudQuietIdx   + 1) / 4 : 0.5)
  ) / 10;

  // ── sex ───────────────────────────────────────────────────────────────────
  const skipped = answers.sex_timing === null && answers.sex_frequency === null && answers.sex_style === null;
  let sexScore = null;
  if (!skipped) {
    const timingIdx = answers.sex_timing    ?? -1;
    const freqIdx   = answers.sex_frequency ?? -1;
    const styleIdx  = answers.sex_style     ?? -1;
    if ([timingIdx, freqIdx, styleIdx].some(v => v >= 0)) {
      sexScore = (
        (timingIdx >= 0 ? (timingIdx + 1) / 5 : 0.5) +
        (freqIdx   >= 0 ? (freqIdx   + 1) / 6 : 0.5) +
        (styleIdx  >= 0 ? (styleIdx  + 1) / 3 : 0.5)
      ) / 3;
    }
  }

  return {
    rel_length         : answers.rel_length ?? null,
    annoyances         : annoyancesBits,
    substances         : substancesEncoded,
    values             : parseFloat(valuesScore.toFixed(4)),
    chemistry          : parseFloat(chemScore.toFixed(4)),
    fun                : parseFloat(funScore.toFixed(4)),
    sex                : sexScore !== null ? parseFloat(sexScore.toFixed(4)) : null,
  };
}

// ─── Compatibility ───────────────────────────────────────────────────────────
//
// compatible(scoresA, scoresB) → { rel_length, values, chemistry, fun, sex }
//
// This function runs on the SERVER when assembling discover profiles.

export function compatible(a, b) {
  // substances: for each drug, compare comfort levels. If one person says 'never' (0)
  // and the other says 'always' (2) that's a mismatch. Average the per-drug agreements.
  const substancesSim = _substancesSim(a.substances, b.substances);

  return {
    rel_length: (a.rel_length === null || a.rel_length === undefined ||
                 b.rel_length === null || b.rel_length === undefined)
      ? null
      : a.rel_length === b.rel_length ? 'high'
      : Math.abs(a.rel_length - b.rel_length) <= 2 ? 'medium'
      : 'low',
    values    : _band(_jaccardBits(a.annoyances, b.annoyances, 9) * 0.4 + substancesSim * 0.6),
    chemistry : _band(_scalarSim(a.chemistry, b.chemistry)),
    fun       : _band(_scalarSim(a.fun, b.fun)),
    sex       : (a.sex === null || b.sex === null)
                  ? null
                  : _band(_scalarSim(a.sex, b.sex)),
  };
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function _substancesSim(sa, sb) {
  if (!sa || !sb) return 0.5;
  let total = 0, count = 0;
  for (const drug of DRUG_LIST) {
    const va = sa[drug] ?? 1;
    const vb = sb[drug] ?? 1;
    // Similarity: 1 if identical, 0.5 if one step apart, 0 if two steps apart
    total += 1 - Math.abs(va - vb) / 2;
    count++;
  }
  return count > 0 ? total / count : 0.5;
}

function _multiBits(selected, nBits) {
  if (!Array.isArray(selected) || selected.length === 0) return 0;
  let bits = 0;
  for (const idx of selected) {
    if (idx >= 0 && idx < nBits) bits |= (1 << idx);
  }
  return bits;
}

function _jaccardBits(a, b, nBits) {
  if (a === 0 && b === 0) return 1.0;
  const maxBits = (1 << nBits) - 1;
  const intersection = _popcount(a & b & maxBits);
  const union        = _popcount((a | b) & maxBits);
  return union === 0 ? 1.0 : intersection / union;
}

function _scalarSim(a, b) {
  return 1 - Math.abs(a - b);
}

function _band(sim) {
  if (sim >= 0.70) return 'high';
  if (sim >= 0.40) return 'medium';
  return 'low';
}

function _popcount(n) {
  let count = 0;
  while (n) { n &= n - 1; count++; }
  return count;
}
