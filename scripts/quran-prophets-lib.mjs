// ═══════════════════════════════════════════════════════
// Quranda peyğəmbərlər — saf məntiq (scripts/build-quran-prophets.mjs + tests/unit/quran-prophets.test.js)
//
// SAY QAYDASI (təxmin yoxdur — hər say məlumatdan hesablanır):
//   Mənbə: Quranic Arabic Corpus morfologiyası (mustafa0x/quran-morphology — /quran-roots
//   indeksi ilə eyni fayl). Hər sətir bir seqmentdir: "s:a:w:seg<TAB>forma<TAB>teq<TAB>xüsusiyyətlər".
//   • Əsas qayda: söz (s:a:w) bir dəfə sayılır, əgər onun seqmentlərindən birində PN (xüsusi ad)
//     teqi və qaydadakı LEM (lemma) var. Lemma + PN birlikdə adı eyni yazılışlı başqa sözdən
//     ayırır: يَحْيَى (ad) ≠ يَحْيَىٰ «yaşayır» feili; صالِح (ad) ≠ صالِح «saleh» sifəti.
//   • Hud: lemma هُود korpusda 3 yerdə «yəhudilər» mənasındadır (هُودًا أَوْ نَصَٰرَىٰ — 2:111,
//     2:135, 2:140). Qayda: sonrakı söz أَو, ondan sonrakı nَصْرانِيّ lemmasıdırsa — sayılmır.
//   • Zül-Kifl: korpusda xüsusi ad deyil, iki sözdür (ذَا + ٱلْكِفْلِ). Qayda: lemma كِفْل,
//     DET (əl-) ön şəkilçisi ilə və əvvəlki söz ذُو lemmasıdır.
//   • İlyas: korpus 37:130-dakı إِلْ يَاسِينَ formasını da إِلْياس lemmasına yazır. Əsas say —
//     yalnız إِلْيَاس yazılışı; إِلْ يَاسِينَ ayrıca forma kimi göstərilir (cəmlənmir).
//   • Muhəmməd ﷺ: əsas say — مُحَمَّد lemması; أَحْمَد (61:6) ayrıca forma; İsa: الْمَسِيح
//     (məsih ləqəbi) ayrıca forma. Ayrıca formalar əsas saya qatılmır.
//   Yoxlama: hər yer Osmani mətnində (seo-data/quran/quran-uthmani.json) həmin söz sırasında
//   adın yazılışı ilə (SKELETONS) tutuşdurulur; mətndə adı başqa sözdən ayırmaq mümkün olan
//   adlar üçün (textCount) mətn sayı korpus sayına bərabər olmalıdır.
// ═══════════════════════════════════════════════════════
import { normalizeArabic, splitAyahWords } from '../src/utils/hifzSrs.js'

export const MORPHOLOGY_URL = 'https://raw.githubusercontent.com/mustafa0x/quran-morphology/master/quran-morphology.txt'

// num — data/islamicHistory.js PROPHETS[].num (adlar oradan götürülür)
// lemma — korpus lemması; sk — Osmani mətnində adın normalizeArabic yazılışları
// textCount — mətndə yazılış yalnız bu adındır (sayı mətnlə də yoxlanılır)
export const PROPHET_RULES = [
  { id: 'adam', num: 1, ar: 'آدَم', lemma: 'آدَم', sk: ['ادم'], textCount: true },
  { id: 'idris', num: 2, ar: 'إِدْرِيس', lemma: 'إِدْرِيس', sk: ['ادريس'], textCount: true },
  { id: 'nuh', num: 3, ar: 'نُوح', lemma: 'نُوح', sk: ['نوح'], textCount: true },
  { id: 'hud', num: 4, ar: 'هُود', lemma: 'هُود', sk: ['هود'], exclude: 'jews' },
  { id: 'salih', num: 5, ar: 'صالِح', lemma: 'صالِح', sk: ['صلح'] },
  { id: 'ibrahim', num: 6, ar: 'إِبْراهِيم', lemma: 'إِبْراهِيم', sk: ['ابرهيم', 'ابرهم'], textCount: true },
  { id: 'lut', num: 7, ar: 'لُوط', lemma: 'لُوط', sk: ['لوط'], textCount: true },
  { id: 'ismail', num: 8, ar: 'إِسْماعِيل', lemma: 'إِسْماعِيل', sk: ['اسمعيل'], textCount: true },
  { id: 'ishaq', num: 9, ar: 'إِسْحاق', lemma: 'إِسْحاق', sk: ['اسحق'], textCount: true },
  { id: 'yaqub', num: 10, ar: 'يَعْقُوب', lemma: 'يَعْقُوب', sk: ['يعقوب'], textCount: true },
  { id: 'yusuf', num: 11, ar: 'يُوسُف', lemma: 'يُوسُف', sk: ['يوسف'], textCount: true },
  { id: 'ayyub', num: 12, ar: 'أَيُّوب', lemma: 'أَيُّوب', sk: ['ايوب'], textCount: true },
  { id: 'shuayb', num: 13, ar: 'شُعَيْب', lemma: 'شُعَيْب', sk: ['شعيب'], textCount: true },
  { id: 'musa', num: 14, ar: 'مُوسَى', lemma: 'مُوسَى', sk: ['موسي'], textCount: true },
  { id: 'harun', num: 15, ar: 'هارُون', lemma: 'هارُون', sk: ['هرون'], textCount: true },
  { id: 'dhulkifl', num: 16, ar: 'ذُو الْكِفْل', phrase: 'dhulkifl', sk: ['الكفل'], prevSk: 'ذا', textCount: true },
  { id: 'dawud', num: 17, ar: 'داوُد', lemma: 'داوُد', sk: ['داود'], textCount: true },
  { id: 'sulayman', num: 18, ar: 'سُلَيْمان', lemma: 'سُلَيْمان', sk: ['سليمن'], textCount: true },
  { id: 'ilyas', num: 19, ar: 'إِلْياس', lemma: 'إِلْياس', form: 'single', sk: ['الياس'], textCount: true,
    variants: [{ id: 'ilyasin', ar: 'إِلْ يَاسِين', lemma: 'إِلْياس', form: 'split', sk: ['ال ياسين'] }] },
  { id: 'alyasa', num: 20, ar: 'الْيَسَع', lemma: 'الْيَسَع', sk: ['اليسع'], textCount: true },
  { id: 'yunus', num: 21, ar: 'يُونُس', lemma: 'يُونُس', sk: ['يونس'], textCount: true },
  { id: 'zakariyya', num: 22, ar: 'زَكَرِيّا', lemma: 'زَكَرِيّا', sk: ['زكريا'], textCount: true },
  { id: 'yahya', num: 23, ar: 'يَحْيَى', lemma: 'يَحْيَى', sk: ['يحيي'] },
  { id: 'isa', num: 24, ar: 'عِيسَى', lemma: 'عِيسَى', sk: ['عيسي'], textCount: true,
    variants: [{ id: 'masih', ar: 'الْمَسِيح', lemma: 'مَسِيح', sk: ['المسيح'] }] },
  { id: 'muhammad', num: 25, ar: 'مُحَمَّد', lemma: 'مُحَمَّد', sk: ['محمد'], textCount: true,
    variants: [{ id: 'ahmad', ar: 'أَحْمَد', lemma: 'أَحْمَد', sk: ['احمد'] }] },
]

/** Morfologiya mətni → Map("s:a:w" → [{ form, tag, feats:Set, lem }]) */
export function parseMorphology(text) {
  const words = new Map()
  let lines = 0
  for (const line of String(text || '').split(/\r?\n/)) {
    if (!line.trim()) continue
    const [loc, form = '', tag = '', featStr = ''] = line.split('\t')
    const m = /^(\d+):(\d+):(\d+):\d+$/.exec(loc || '')
    if (!m) continue
    lines++
    const feats = new Set(featStr.split('|'))
    const lemF = [...feats].find(f => f.startsWith('LEM:'))
    const key = `${m[1]}:${m[2]}:${m[3]}`
    if (!words.has(key)) words.set(key, [])
    words.get(key).push({ form, tag, feats, lem: lemF ? nfc(lemF.slice(4)) : '' })
  }
  return { words, lines }
}

const keyOf = (s, a, w) => `${s}:${a}:${w}`
// Korpusda şəddə hərəkədən əvvəl yazılıb (أَيُّوب: ّ + ُ) — müqayisə Unicode NFC ilə (hərəkə sırası sabitlənir)
export const nfc = (s) => String(s || '').normalize('NFC')
const hasLem = (segs, lem) => Boolean(segs?.some(g => g.lem === nfc(lem)))
const isPnLem = (segs, lem) => Boolean(segs?.some(g => g.lem === nfc(lem) && g.feats.has('PN')))
const wordForm = (segs) => (segs || []).map(g => g.form).join('')

/** Bir qayda (və ya forma) üçün yerlər: [[s,a,w], …] sıralı */
export function matchRule(words, rule) {
  const out = []
  for (const [key, segs] of words) {
    const [s, a, w] = key.split(':').map(Number)
    if (rule.phrase === 'dhulkifl') {
      const ok = segs.some(g => g.lem === nfc('كِفْل')) && segs.some(g => g.feats.has('DET')) && hasLem(words.get(keyOf(s, a, w - 1)), 'ذُو')
      if (ok) out.push([s, a, w])
      continue
    }
    if (!isPnLem(segs, rule.lemma)) continue
    if (rule.form === 'single' && /\s/.test(wordForm(segs))) continue
    if (rule.form === 'split' && !/\s/.test(wordForm(segs))) continue
    if (rule.exclude === 'jews' && hasLem(words.get(keyOf(s, a, w + 1)), 'أَو') && hasLem(words.get(keyOf(s, a, w + 2)), 'نَصْرانِيّ')) continue
    out.push([s, a, w])
  }
  return out.sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2])
}

/** Hud qaydasının çıxardığı yerlər (hesabatda göstərilir) */
export function hudExcluded(words) {
  const all = matchRule(words, { lemma: 'هُود' })
  const kept = new Set(matchRule(words, { lemma: 'هُود', exclude: 'jews' }).map(l => l.join(':')))
  return all.filter(l => !kept.has(l.join(':')))
}

/** [[s,a,w], …] → [[s,a,n], …] (n — ayədə neçə dəfə; 1 olanda yazılmır) */
export function toAyahs(locs) {
  const out = []
  for (const [s, a] of locs) {
    const last = out[out.length - 1]
    if (last && last[0] === s && last[1] === a) last[2] = (last[2] || 1) + 1
    else out.push([s, a])
  }
  return out
}

/** Bütün peyğəmbərlər: [{ id, num, ar, count, locs, variants:[{ id, ar, count, locs }] }] */
export function computeProphets(words) {
  return PROPHET_RULES.map(r => ({
    id: r.id, num: r.num, ar: r.ar,
    locs: matchRule(words, r),
    variants: (r.variants || []).map(v => ({ id: v.id, ar: v.ar, locs: matchRule(words, v) })),
  })).map(p => ({ ...p, count: p.locs.length, variants: p.variants.map(v => ({ ...v, count: v.locs.length })) }))
}

// ── Osmani mətni ilə yoxlama ──
// Surənin 1-ci ayəsinin əvvəlinə bəsmələ qoşulub (Fatihə və Tövbədən başqa) — 4 söz çıxarılır
export function ayahWords(uthmani, s, a) {
  const words = splitAyahWords(uthmani.ayahs[s - 1][a - 1])
  return a === 1 && s !== 1 && s !== 9 && normalizeArabic(words[0]) === 'بسم' ? words.slice(4) : words
}

// Söz: istəyə bağlı و/ف + ب/ل/ك/ي(nida) + ad + istəyə bağlı tənvin əlifi (نُوحًا)
export function tokenRe(sk) {
  return new RegExp(`^(?:و|ف)?(?:ب|ل|ك|ي)?(?:${sk.join('|')})ا?$`)
}

/** Yer Osmani mətnində həmin sözdür? (37:130 kimi iki hissəli forma — ardıcıl iki söz) */
export function locMatchesText(uthmani, rule, [s, a, w]) {
  const ws = ayahWords(uthmani, s, a).map(normalizeArabic)
  const parts = rule.sk[0].split(' ')
  if (parts.length > 1) return ws.slice(w - 1, w - 1 + parts.length).join(' ') === rule.sk[0]
  if (!tokenRe(rule.sk).test(ws[w - 1] || '')) return false
  return rule.prevSk ? (ws[w - 2] || '').replace(/^و/, '') === rule.prevSk : true
}

/** Mətndə bütün Quran üzrə say (yalnız textCount qaydaları üçün mənalıdır) */
export function textCount(uthmani, rule) {
  const re = tokenRe(rule.sk)
  let n = 0
  uthmani.ayahs.forEach((ayahs, si) => ayahs.forEach((_, ai) => {
    const ws = ayahWords(uthmani, si + 1, ai + 1).map(normalizeArabic)
    ws.forEach((t, i) => {
      if (!re.test(t)) return
      if (rule.prevSk && (ws[i - 1] || '').replace(/^و/, '') !== rule.prevSk) return
      n++
    })
  }))
  return n
}
