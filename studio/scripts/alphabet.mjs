// The palette characters of the generated sprites file (../hooks/lib/sprites.gen.ts): one UTF-16 unit a color,
// handed out in first-use order by scripts/sprites.mjs, and counted against the studio's colors by
// scripts/check.mjs (so a palette that outgrows it fails the check, not the export).
//
// Never `.` (transparent), `=` (same as the frame before), a digit (run counts), a quote, a backslash or a
// backtick. 268 of them: A-Z, a-z, safe punctuation, the Latin-1 letters, then Latin Extended-A.

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => String.fromCharCode(from + i)).join('')

export const ALPHABET = [
  range(0x41, 0x5a), // A-Z
  range(0x61, 0x7a), // a-z
  '!#$%&()*+,-/:;<>?@[]^_{|}~',
  range(0xc0, 0xd6), // À-Ö
  range(0xd8, 0xf6), // Ø-ö
  range(0xf8, 0xff), // ø-ÿ
  range(0x100, 0x17f), // Ā-ſ
].join('')

if (/[.=0-9'"\\`]/.test(ALPHABET) || new Set(ALPHABET).size !== ALPHABET.length) throw new Error('the alphabet holds a reserved or repeated character')
