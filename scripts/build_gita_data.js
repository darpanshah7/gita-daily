/**
 * Builds assets/data/gita_data.json from the VedicScriptures repo.
 * Run: node scripts/build_gita_data.js <path-to-bhagavad-gita-main>
 *
 * Source: https://github.com/vedicscriptures/bhagavad-gita (LGPL-3.0)
 */

const fs = require('fs');
const path = require('path');

const repoPath = process.argv[2];
if (!repoPath) {
  console.error('Usage: node build_gita_data.js <path-to-bhagavad-gita-main>');
  process.exit(1);
}

// Translations to include (key → label shown in UI)
const TRANSLATIONS = {
  siva:    'Swami Sivananda',
  gambir:  'Swami Gambhirananda',
  chinmay: 'Swami Chinmayananda',
  tej:     'Swami Tejomayananda',
  prabhu:  'A.C. Bhaktivedanta Prabhupada',
  san:     'Adi Shankaracharya',
  vallabh: 'Vallabhacharya',
};

// Chapter verse counts (standard)
const CHAPTER_VERSE_COUNTS = [47,72,43,42,29,47,30,28,34,42,55,20,35,27,20,24,28,78];

function extractTranslation(verseData, key) {
  const entry = verseData[key];
  if (!entry) return null;
  // Most have 'et' (English translation). Some only have 'ht' (Hindi).
  // For prabhu we also grab 'et'. For tej/chinmay sometimes only 'ht' exists.
  return entry.et || entry.ht || null;
}

function extractCommentary(verseData, key) {
  const entry = verseData[key];
  if (!entry) return null;
  return entry.ec || entry.hc || null;
}

// --- Process chapters ---
const chapterDir = path.join(repoPath, 'chapter');
const slokDir = path.join(repoPath, 'slok');

const chapters = [];

for (let c = 1; c <= 18; c++) {
  const chFile = path.join(chapterDir, `bhagavadgita_chapter_${c}.json`);
  let chData = {};
  if (fs.existsSync(chFile)) {
    chData = JSON.parse(fs.readFileSync(chFile, 'utf8'));
  }

  const chapter = {
    chapter: c,
    name: chData.name || '',
    name_transliterated: chData.transliteration || '',
    name_meaning: chData.meaning?.en || '',
    summary: chData.summary?.en || '',
    verse_count: CHAPTER_VERSE_COUNTS[c - 1],
    verses: [],
  };

  for (let v = 1; v <= CHAPTER_VERSE_COUNTS[c - 1]; v++) {
    const slokFile = path.join(slokDir, `bhagavadgita_chapter_${c}_slok_${v}.json`);
    if (!fs.existsSync(slokFile)) {
      console.warn(`Missing: chapter ${c} verse ${v}`);
      continue;
    }
    const vData = JSON.parse(fs.readFileSync(slokFile, 'utf8'));

    const translations = {};
    for (const key of Object.keys(TRANSLATIONS)) {
      const text = extractTranslation(vData, key);
      const commentary = extractCommentary(vData, key);
      if (text || commentary) {
        translations[key] = { text: text || '', commentary: commentary || '' };
      }
    }

    chapter.verses.push({
      chapter: c,
      verse: v,
      speaker: vData.speaker || '',
      sanskrit: vData.slok || '',
      transliteration: vData.transliteration || '',
      translations,
    });
  }

  chapters.push(chapter);
  process.stdout.write(`\rProcessed chapter ${c}/18`);
}

console.log('\nBuilding flat verse index...');

// Build a flat array of all verses for daily shlok indexing
const flatVerses = [];
for (const ch of chapters) {
  for (const v of ch.verses) {
    flatVerses.push({ chapter: v.chapter, verse: v.verse });
  }
}

const output = {
  meta: {
    source: 'VedicScriptures Bhagavad Gita API',
    source_url: 'https://github.com/vedicscriptures/bhagavad-gita',
    license: 'LGPL-3.0',
    translations: TRANSLATIONS,
    total_verses: flatVerses.length,
    generated_at: new Date().toISOString(),
  },
  chapters,
  flat_verses: flatVerses,
};

const outPath = path.join(__dirname, '../assets/data/gita_data.json');
fs.writeFileSync(outPath, JSON.stringify(output));

const size = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
console.log(`\nDone! ${flatVerses.length} verses written to assets/data/gita_data.json (${size} MB)`);
