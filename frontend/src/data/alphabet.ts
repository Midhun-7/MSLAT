export interface SignCharacter {
  id: number;
  label: string; // e.g. "00", "01"
  char: string;
  phonetic: string;
  category: 'independent_vowel' | 'dependent_vowel' | 'consonant';
  image: string;
}

const RAW_SIGNS: Array<{ id: number; char: string; phonetic: string; category: SignCharacter['category'] }> = [
  // Independent Vowels (0-14)
  { id: 0, char: "\u0D05", phonetic: "[a]", category: 'independent_vowel' },
  { id: 1, char: "\u0D06", phonetic: "[aa]", category: 'independent_vowel' },
  { id: 2, char: "\u0D07", phonetic: "[i]", category: 'independent_vowel' },
  { id: 3, char: "\u0D08", phonetic: "[ii]", category: 'independent_vowel' },
  { id: 4, char: "\u0D09", phonetic: "[u]", category: 'independent_vowel' },
  { id: 5, char: "\u0D0A", phonetic: "[uu]", category: 'independent_vowel' },
  { id: 6, char: "\u0D0B", phonetic: "[r]", category: 'independent_vowel' },
  { id: 7, char: "\u0D0E", phonetic: "[e]", category: 'independent_vowel' },
  { id: 8, char: "\u0D0F", phonetic: "[ee]", category: 'independent_vowel' },
  { id: 9, char: "\u0D10", phonetic: "[ai]", category: 'independent_vowel' },
  { id: 10, char: "\u0D12", phonetic: "[o]", category: 'independent_vowel' },
  { id: 11, char: "\u0D13", phonetic: "[oo]", category: 'independent_vowel' },
  { id: 12, char: "\u0D14", phonetic: "[au]", category: 'independent_vowel' },
  { id: 13, char: "\u0D02", phonetic: "[am]", category: 'independent_vowel' },
  { id: 14, char: "\u0D03", phonetic: "[ah]", category: 'independent_vowel' },

  // Consonants Part 1 (15-35)
  { id: 15, char: "\u0D2A", phonetic: "[pa]", category: 'consonant' },
  { id: 16, char: "\u0D2B", phonetic: "[pha]", category: 'consonant' },
  { id: 17, char: "\u0D2C", phonetic: "[ba]", category: 'consonant' },
  { id: 18, char: "\u0D2D", phonetic: "[bha]", category: 'consonant' },
  { id: 19, char: "\u0D2E", phonetic: "[ma]", category: 'consonant' },
  { id: 20, char: "\u0D2F", phonetic: "[ya]", category: 'consonant' },
  { id: 21, char: "\u0D30", phonetic: "[ra]", category: 'consonant' },
  { id: 22, char: "\u0D32", phonetic: "[lla]", category: 'consonant' },
  { id: 23, char: "\u0D35", phonetic: "[va]", category: 'consonant' },
  { id: 24, char: "\u0D36", phonetic: "[sha]", category: 'consonant' },
  { id: 25, char: "\u0D37", phonetic: "[ksha]", category: 'consonant' },
  { id: 26, char: "\u0D38", phonetic: "[sa]", category: 'consonant' },
  { id: 27, char: "\u0D39", phonetic: "[ha]", category: 'consonant' },
  { id: 28, char: "\u0D33", phonetic: "[la]", category: 'consonant' },
  { id: 29, char: "\u0D31", phonetic: "[rra]", category: 'consonant' },
  { id: 30, char: "\u0D34", phonetic: "[zha]", category: 'consonant' },
  { id: 31, char: "\u0D7E", phonetic: "[ilh]", category: 'consonant' },
  { id: 32, char: "\u0D7B", phonetic: "[in]", category: 'consonant' },
  { id: 33, char: "\u0D7C", phonetic: "[irr]", category: 'consonant' },
  { id: 34, char: "\u0D7D", phonetic: "[il]", category: 'consonant' },
  { id: 35, char: "\u0D7A", phonetic: "[inh]", category: 'consonant' },

  // Dependent Vowels (36-42)
  { id: 36, char: "\u0D41", phonetic: "[u]", category: 'dependent_vowel' },
  { id: 37, char: "\u0D42", phonetic: "[uu]", category: 'dependent_vowel' },
  { id: 38, char: "\u0D3F", phonetic: "[i]", category: 'dependent_vowel' },
  { id: 39, char: "\u0D40", phonetic: "[ii]", category: 'dependent_vowel' },
  { id: 40, char: "\u0D4D", phonetic: "[m]", category: 'dependent_vowel' },
  { id: 41, char: "\u0D3D", phonetic: "[iya]", category: 'dependent_vowel' },
  { id: 42, char: "\u0D3A", phonetic: "[rra]", category: 'dependent_vowel' },

  // Consonants Part 2 (43-62)
  { id: 43, char: "\u0D15", phonetic: "[ka]", category: 'consonant' },
  { id: 44, char: "\u0D16", phonetic: "[kha]", category: 'consonant' },
  { id: 45, char: "\u0D18", phonetic: "[gha]", category: 'consonant' },
  { id: 46, char: "\u0D17", phonetic: "[ga]", category: 'consonant' },
  { id: 47, char: "\u0D19", phonetic: "[nga]", category: 'consonant' },
  { id: 48, char: "\u0D1A", phonetic: "[cha]", category: 'consonant' },
  { id: 49, char: "\u0D1B", phonetic: "[chha]", category: 'consonant' },
  { id: 50, char: "\u0D1C", phonetic: "[ja]", category: 'consonant' },
  { id: 51, char: "\u0D1D", phonetic: "[jha]", category: 'consonant' },
  { id: 52, char: "\u0D1E", phonetic: "[nja]", category: 'consonant' },
  { id: 53, char: "\u0D1F", phonetic: "[ta]", category: 'consonant' },
  { id: 54, char: "\u0D20", phonetic: "[ttha]", category: 'consonant' },
  { id: 55, char: "\u0D21", phonetic: "[dda]", category: 'consonant' },
  { id: 56, char: "\u0D22", phonetic: "[ddha]", category: 'consonant' },
  { id: 57, char: "\u0D23", phonetic: "[nna]", category: 'consonant' },
  { id: 58, char: "\u0D24", phonetic: "[tha]", category: 'consonant' },
  { id: 59, char: "\u0D25", phonetic: "[thha]", category: 'consonant' },
  { id: 60, char: "\u0D26", phonetic: "[da]", category: 'consonant' },
  { id: 61, char: "\u0D27", phonetic: "[dha]", category: 'consonant' },
  { id: 62, char: "\u0D28", phonetic: "[na]", category: 'consonant' },
];

export const ALPHABET_SIGNS: SignCharacter[] = RAW_SIGNS.map(s => ({
  ...s,
  label: s.id < 10 ? `0${s.id}` : `${s.id}`,
  image: `/assets/signs/${s.id}.gif`
}));

export const INDEX_TO_CHAR_MAP = new Map<number, string>(
  ALPHABET_SIGNS.map(s => [s.id, s.char])
);

