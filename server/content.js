import path from 'node:path';
import { promises as fs, existsSync } from 'node:fs';
import { db, DATA_DIR } from './db.js';

const KEY = 'site_content';
const LEGACY_FILE = path.join(DATA_DIR, 'content.json');

export const defaultContent = {
  header: {
    brand: '◯ Global Underscore',
  },
  footer: {
    brand: '◯ Global Underscore · Vienna',
    tagline: 'Summer solstice · 20 June 2026',
  },
  hero: {
    eyebrow: 'Summer solstice · 20 June 2026',
    title: 'Global Underscore',
    subtitle: 'Vienna',
    tagline:
      'An afternoon of Contact Improvisation, breath, gravity, live music — and the quiet joy of being a gentle disturbance in the world.',
    sublabel: 'scroll · roll · gather',
    signupCta: 'sign up →',
    aboutCta: "what's an Underscore?",
    logoUrl: '/logo.svg',
  },
  about: {
    heading: 'What is the Underscore?',
    body:
      "The Underscore is a dance score developed by Nancy Stark Smith in the early 1990s as a framework for improvisation rooted in Contact Improvisation. It moves through phases — arriving, preamble, small dance, solo, ensemble, harvest — that invite us to listen, to fall, to roll, to meet weight, and to let a shared dance grow out of simply showing up.\n\nOn or around the summer solstice, communities across the planet dance the Underscore at the same time. Different time zones, different rooms, one overlapping field of attention. That's the Global Underscore — and on 20 June 2026, Vienna joins in.",
  },
  what: {
    heading: 'What is Contact Improvisation?',
    body:
      'Contact Improvisation is a movement form where two or more people share weight, momentum and touch, following the point of contact wherever it wants to go. No steps to learn. No right way to do it. Bring curious skin, soft joints, and a willingness to be surprised.',
  },
  gallery: {
    heading: 'The space, the shapes.',
    subtitle: 'Samdrubling + friends',
    venueCaption: 'Samdrubling · Vienna',
    caption:
      "Placeholder dance images — we'll swap these for real photos as we get them.",
    venueImage: { url: '/samdrubling.jpg', alt: 'Samdrubling studio space' },
    images: [
      { url: 'https://picsum.photos/seed/ci-duet/800/1000', alt: 'Two dancers sharing weight' },
      { url: 'https://picsum.photos/seed/ci-roll/900/700', alt: 'Rolling on a wooden floor' },
      { url: 'https://picsum.photos/seed/ci-lift/700/900', alt: 'A tender lift' },
      { url: 'https://picsum.photos/seed/ci-group/900/700', alt: 'A group dancing together' },
    ],
  },
  event: {
    heroLine1: 'One afternoon.',
    heroLine2: 'Four hours of dance.',
    heroBody:
      'Summer solstice in Vienna. Arrive open, leave a little lighter. Coffee and water on site.',
    date: 'Saturday, 20 June 2026',
    talkTime: '15:00 – 16:00',
    danceTime: '16:00 – 20:00',
    venue: 'Samdrubling',
    address: 'Beispielgasse 12, 1070 Vienna, Austria',
    price: '€25',
    liveMusic: 'Yes — live music throughout the score',
    talkNote:
      "The Underscore Talk (15:00–16:00) is required if this is your first Underscore, and warmly welcomed for everyone else — it's a lovely way to settle in together.",
    labelDate: 'date',
    labelTalk: 'talk',
    labelDance: 'dance',
    labelVenue: 'venue',
    labelPrice: 'price',
    labelLiveMusic: 'live music',
  },
  closing: {
    heading: 'Come dance.',
    body:
      "Wear what lets you move. Bring water, a layer, maybe the book you're reading. Arrive a little early. Roll around. Leave slightly rearranged.",
  },
};

function deepMerge(base, over) {
  if (base === null || typeof base !== 'object' || Array.isArray(base)) {
    return over === undefined ? base : over;
  }
  if (over === null || typeof over !== 'object' || Array.isArray(over)) {
    return over === undefined ? base : over;
  }
  const out = { ...base };
  for (const k of Object.keys(over)) {
    out[k] = deepMerge(base[k], over[k]);
  }
  return out;
}

const selectStmt = db.prepare('SELECT value FROM kv WHERE key = ?');
const upsertStmt = db.prepare(`
  INSERT INTO kv (key, value, updated_at) VALUES (?, ?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
`);

// one-time migration from content.json, if present and no row yet
try {
  const existing = selectStmt.get(KEY);
  if (!existing) {
    if (existsSync(LEGACY_FILE)) {
      const raw = await fs.readFile(LEGACY_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      upsertStmt.run(KEY, JSON.stringify(parsed), new Date().toISOString());
      await fs.rename(LEGACY_FILE, LEGACY_FILE + '.migrated');
      console.log('[db] migrated content.json → kv.site_content');
    } else {
      upsertStmt.run(KEY, JSON.stringify(defaultContent), new Date().toISOString());
    }
  }
} catch (err) {
  console.warn('[db] content migration skipped:', err.message);
}

export async function readContent() {
  const row = selectStmt.get(KEY);
  const stored = row ? JSON.parse(row.value) : {};
  // deep-merge with defaults so newly-added fields fall back gracefully
  return deepMerge(defaultContent, stored);
}

export async function writeContent(next) {
  if (!next || typeof next !== 'object') throw new Error('content must be an object');
  upsertStmt.run(KEY, JSON.stringify(next), new Date().toISOString());
  return readContent();
}
