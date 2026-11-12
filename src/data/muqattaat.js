// ═══════════════════════════════════════════════════════
// Müqəttəə hərfləri (əl-hurufu-l-muqattaa) (v6.5) — components/quran/MuqattaatMap.jsx (/quran)
//
// 29 surə bu hərflərlə başlayır. open — surənin ilk ayəsinin ilk sözü, Osmani nəşrindən hərfi-hərfinə
// (seo-data/quran/quran-uthmani.json; Şura surəsində iki ayə: حمٓ və عٓسٓقٓ). Testlə yoxlanılır:
// tests/unit/muqattaat.test.js. Mənaları barədə şərh YAZILMIR — yalnız harada gəldikləri.
// ═══════════════════════════════════════════════════════
export const MUQATTAAT = [
  { s: 2, open: ['الٓمٓ'] }, { s: 3, open: ['الٓمٓ'] }, { s: 7, open: ['الٓمٓصٓ'] }, { s: 10, open: ['الٓر'] },
  { s: 11, open: ['الٓر'] }, { s: 12, open: ['الٓر'] }, { s: 13, open: ['الٓمٓر'] }, { s: 14, open: ['الٓر'] },
  { s: 15, open: ['الٓر'] }, { s: 19, open: ['كٓهيعٓصٓ'] }, { s: 20, open: ['طه'] }, { s: 26, open: ['طسٓمٓ'] },
  { s: 27, open: ['طسٓ'] }, { s: 28, open: ['طسٓمٓ'] }, { s: 29, open: ['الٓمٓ'] }, { s: 30, open: ['الٓمٓ'] },
  { s: 31, open: ['الٓمٓ'] }, { s: 32, open: ['الٓمٓ'] }, { s: 36, open: ['يسٓ'] }, { s: 38, open: ['صٓ'] },
  { s: 40, open: ['حمٓ'] }, { s: 41, open: ['حمٓ'] }, { s: 42, open: ['حمٓ', 'عٓسٓقٓ'] }, { s: 43, open: ['حمٓ'] },
  { s: 44, open: ['حمٓ'] }, { s: 45, open: ['حمٓ'] }, { s: 46, open: ['حمٓ'] }, { s: 50, open: ['قٓ'] },
  { s: 68, open: ['نٓ'] },
]

/** Hərfin adı (oxunuşu) — dillərə görə */
export const LETTERS = [
  { ch: 'ا', name: { ar: 'ألف', az: 'Əlif', en: 'Alif', ru: 'Алиф', tr: 'Elif' } },
  { ch: 'ل', name: { ar: 'لام', az: 'Lam', en: 'Lam', ru: 'Лям', tr: 'Lâm' } },
  { ch: 'م', name: { ar: 'ميم', az: 'Mim', en: 'Mim', ru: 'Мим', tr: 'Mîm' } },
  { ch: 'ص', name: { ar: 'صاد', az: 'Sad', en: 'Sad', ru: 'Сад', tr: 'Sâd' } },
  { ch: 'ر', name: { ar: 'راء', az: 'Ra', en: 'Ra', ru: 'Ра', tr: 'Râ' } },
  { ch: 'ك', name: { ar: 'كاف', az: 'Kaf', en: 'Kaf', ru: 'Каф', tr: 'Kâf' } },
  { ch: 'ه', name: { ar: 'هاء', az: 'Hə', en: 'Ha', ru: 'Ха', tr: 'He' } },
  { ch: 'ي', name: { ar: 'ياء', az: 'Ya', en: 'Ya', ru: 'Йа', tr: 'Yâ' } },
  { ch: 'ع', name: { ar: 'عين', az: 'Eyn', en: '‘Ayn', ru: 'Айн', tr: 'Ayn' } },
  { ch: 'ط', name: { ar: 'طاء', az: 'Ta', en: 'Ṭa', ru: 'Та', tr: 'Tâ' } },
  { ch: 'س', name: { ar: 'سين', az: 'Sin', en: 'Sin', ru: 'Син', tr: 'Sîn' } },
  { ch: 'ح', name: { ar: 'حاء', az: 'Ha', en: 'Ḥa', ru: 'Ха', tr: 'Hâ' } },
  { ch: 'ق', name: { ar: 'قاف', az: 'Qaf', en: 'Qaf', ru: 'Каф', tr: 'Kâf' } },
  { ch: 'ن', name: { ar: 'نون', az: 'Nun', en: 'Nun', ru: 'Нун', tr: 'Nûn' } },
]

/** Açılışın yalnız hərfləri (işarəsiz): 'الٓمٓ' → 'الم' */
export const plainLetters = (w) => [...w].filter(c => /[ء-ي]/.test(c)).join('')
export const lettersOf = (m) => [...new Set(m.open.map(plainLetters).join(''))]
export const comboOf = (m) => m.open.map(plainLetters).join(' ')
/** Hər hərf neçə surəni açır */
export const letterCounts = () => Object.fromEntries(LETTERS.map(l => [l.ch, MUQATTAAT.filter(m => lettersOf(m).includes(l.ch)).length]))
export const COMBOS = [...new Set(MUQATTAAT.map(comboOf))]
