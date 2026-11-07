// ═══════════════════════════════════════════════════════
// Hədisin dərəcəsi — build zamanı hər hədis üçün qısa kod (uniqueHadiths →
// buildHadithLangData → "virtual:hadiths/<dil>"), kartda HadithGrade göstərir.
//
//   gradeOf(h, SUNAN_GRADES) → { g, gb, ga }   (g yoxdursa — dərəcə göstərilməyib)
//     g  — 's' səhih · 'h' həsən · 'mq' səhih, amma səhabə sözü (mövquf)
//          'd' zəif · 'm' alimlər ixtilaf edib · 'q' Quran ayəsidir
//     gb — hökmü verən: 'bukhari' | 'muslim' | 'albani' | 'arnaut' | …
//     ga — zəif / ixtilaflı olanda digər alimlərin hökmü: [[alim, g], …]
//
// QAYDA (sayt siyasəti — Sələf hədis alimləri, ilk növbədə Albani):
//  1) Səhih Buxari / Səhih Müslim → səhih (ümmətin icması).
//  2) Sünən rəvayəti (data/hadithGrades.js — mətni tutuşan, OLDUĞU KİMİ):
//     Albaninin hökmü varsa — o; yoxdursa digərləri razıdırsa — o, deyilsə — ixtilaf.
//  3) hadiths.js-də əl ilə yazılmış grade / gradedBy (Albani, Arnaut).
//  4) Mənbə Quran surəsidirsə — ayə. Qalanı — göstərilməyib (uydurulmur).
// ═══════════════════════════════════════════════════════

const NAME_KEY = {
  'Al-Albani': 'albani', 'Albani': 'albani',
  'Zubair Ali Zai': 'zubair', 'Ahmad Muhammad Shakir': 'shakir', 'Bashar Awad Maarouf': 'bashar',
  'Shuaib Al Arnaut': 'arnaut', 'Şueyb əl-Arnaut (Müsnəd təhqiqi)': 'arnaut',
  'Muhammad Muhyi Al-Din Abdul Hamid': 'abdulhamid', 'Muhammad Fouad Abd al-Baqi': 'abdulbaqi',
  'Abu Ghuddah': 'abughuddah', 'Muslim (Səhih)': 'muslim',
}
export const graderKey = (name) => NAME_KEY[name] || String(name || '').toLowerCase().replace(/[^a-z]/g, '')

/** Mənbədəki hökm sözü → kod (verbatim: "Hasan Sahih", "Isnaad Hasan", "Very Daif" …) */
export function toneOf(grade) {
  const g = String(grade || '').toLowerCase()
  if (/da.?if|maud|mawd|munkar|shadh|batil|fabricat/.test(g)) return 'd'
  if (/mauquf|muquf|mawquf/.test(g)) return 'mq'
  if (/sahih/.test(g)) return 's'
  if (/hasan/.test(g)) return 'h'
  return null
}

// Kartdakı (az yazılışlı) mənbə Quran surəsidirsə
const SURAHS = /^(Quran\b|Rə?a?d|Nəhl|Ənkəbut|Bəqərə|Əhzab|Tövbə|Səba|Maidə|İnşirah|M[uü]zzəmmil|Zariyat|Yunus|Q[aə]s[aə]s|Ali İmran|Cin|Taha|Saffat|Hicr|Ələq|Fatir|Ənbiya|Qəmər|Nəbə|Leyl|Loğman|İsra|Yusuf|Əraf|Rəhman|Sad|Həcc|Muhəmməd|Hucurat|Talaq|Zumər)( \d|$)/

export function gradeOf(h, sunan = {}) {
  const src = String(h?.source || '').trim()
  if (/^(Buxari|Muslim|Müslim)\b/.test(src) && !/Ədəb əl-Müfrəd/.test(src)) {
    return { g: 's', gb: /^Buxari/.test(src) ? 'bukhari' : 'muslim' }
  }
  const list = sunan[h?.id]
  if (list?.length) {
    const rows = list.map(([n, gr]) => [graderKey(n), toneOf(gr)]).filter(r => r[1])
    const alb = rows.find(r => r[0] === 'albani')
    let g, gb
    if (alb) { g = alb[1]; gb = 'albani' }
    else {
      const tones = new Set(rows.map(r => (r[1] === 'd' ? 'd' : 'ok')))
      if (tones.size === 1) { const r = rows[0]; g = r[1]; gb = r[0] } else { g = 'm'; gb = null }
    }
    if (g) {
      const out = gb ? { g, gb } : { g }
      if (g === 'd' || g === 'm') out.ga = rows.filter(r => r[0] !== gb)
      return out
    }
  }
  if (h?.grade === 'sahih' || h?.grade === 'hasan') {
    return { g: h.grade === 'sahih' ? 's' : 'h', gb: graderKey(h.gradedBy || 'Albani') }
  }
  if (SURAHS.test(src)) return { g: 'q' }
  return {}
}

/** Filtr qrupları: hamısı / qəbul olunan / zəif və ixtilaflı / göstərilməyib */
export const GRADE_GROUP = { s: 'ok', h: 'ok', mq: 'ok', d: 'weak', m: 'weak', q: 'quran' }
export const gradeGroup = (g) => GRADE_GROUP[g] || 'none'
