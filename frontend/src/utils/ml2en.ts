/**
 * Malayalam to English Phonetic Romanization
 * Ported from Kailash Nadh (2012)
 */

const VOWELS: Record<string, string> = {
  "അ": "a", "ആ": "aa", "ഇ": "i", "ഈ": "ee", "ഉ": "u", "ഊ": "oo", "ഋ": "ru",
  "എ": "e", "ഏ": "e", "ഐ": "ai", "ഒ": "o", "ഓ": "o", "ഔ": "au"
};

const COMPOUNDS: Record<string, string> = {
  "ക്ക": "kk", "ഗ്ഗ": "gg", "ങ്ങ": "ng",
  "ച്ച": "cch", "ജ്ജ": "jj", "ഞ്ഞ": "nj",
  "ട്ട": "tt", "ണ്ണ": "nn",
  "ത്ത": "tth", "ദ്ദ": "ddh", "ദ്ധ": "ddh", "ന്ന": "nn",
  "ന്ത": "nth", "ങ്ക": "nk", "ണ്ട": "nd", "ബ്ബ": "bb",
  "പ്പ": "pp", "മ്മ": "mm",
  "യ്യ": "yy", "ല്ല": "ll", "വ്വ": "vv", "ശ്ശ": "sh", "സ്സ": "s",
  "ക്സ": "ks", "ഞ്ച": "nch", "ക്ഷ": "ksh", "മ്പ": "mp", "റ്റ": "tt", "ന്റ": "nt",
  "ന്ത്യ": "nthy"
};

const CONSONANTS: Record<string, string> = {
  "ക": "k", "ഖ": "kh", "ഗ": "g", "ഘ": "gh", "ങ": "ng",
  "ച": "ch", "ഛ": "chh", "ജ": "j", "ഝ": "jh", "ഞ": "nj",
  "ട": "t", "ഠ": "dt", "ഡ": "d", "ഢ": "dd", "ണ": "n",
  "ത": "th", "ഥ": "th", "ദ": "d", "ധ": "dh", "ന": "n",
  "പ": "p", "ഫ": "ph", "ബ": "b", "ഭ": "bh", "മ": "m",
  "യ": "y", "ര": "r", "ല": "l", "വ": "v",
  "ശ": "sh", "ഷ": "sh", "സ": "s", "ഹ": "h",
  "ള": "l", "ഴ": "zh", "റ": "r"
};

const CHIL: Record<string, string> = {
  "ൽ": "l", "ൾ": "l", "ൺ": "n",
  "ൻ": "n", "ർ": "r", "ൿ": "k"
};

const MODIFIERS: Record<string, string> = {
  "ു്": "u", "ാ": "aa", "ി": "i", "ീ": "ee",
  "ു": "u", "ൂ": "oo", "ൃ": "ru",
  "െ": "e", "േ": "e", "ൈ": "y",
  "ൊ": "o", "ോ": "o", "ൌ": "ou", "ൗ": "au",
  "ഃ": "a" 
};

function replaceModifiedGlyphs(glyphs: Record<string, string>, text: string): string {
  const keys = Object.keys(glyphs);
  const modKeys = Object.keys(MODIFIERS);
  const re = new RegExp("(" + keys.join('|') + ")(" + modKeys.join('|') + ")", 'g');
  return text.replace(re, (_, g, m) => (glyphs[g] || '') + (MODIFIERS[m] || ''));
}

export function ml2en(input: string): string {
  if (!input) return "";

  let text = input.replace(/[\u200B-\u200D\uFEFF]/g, '');

  text = replaceModifiedGlyphs(COMPOUNDS, text);
  text = replaceModifiedGlyphs(VOWELS, text);
  text = replaceModifiedGlyphs(CONSONANTS, text);

  for (const k in COMPOUNDS) {
    const v = COMPOUNDS[k];
    text = text.replace(new RegExp(k + "്([\\w])", 'g'), v + '$1');
    text = text.replace(new RegExp(k + "്", 'g'), v + 'u');
    text = text.replace(new RegExp(k, 'g'), v + 'a');
  }

  for (const k in CONSONANTS) {
    const v = CONSONANTS[k];
    text = text.replace(new RegExp(k + "(?!്)", 'g'), v + 'a');
    text = text.replace(new RegExp(k + "്(?![\\s).;,'\"/\\%!])", 'ig'), v);
    text = text.replace(new RegExp(k + "്", 'g'), v + 'u');
    text = text.replace(new RegExp(k, 'g'), v);
  }

  for (const k in VOWELS) {
    text = text.replace(new RegExp(k, 'g'), VOWELS[k]);
  }

  for (const k in CHIL) {
    text = text.replace(new RegExp(k, 'g'), CHIL[k]);
  }

  text = text.replace(/ം/g, 'm');

  for (const k in MODIFIERS) {
    text = text.replace(new RegExp(k, 'g'), MODIFIERS[k]);
  }

  return text.replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
}

