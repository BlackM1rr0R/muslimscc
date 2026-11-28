// Rabbanā duaları — saf funksiyalar (scripts/build-rabbana.mjs və tests/unit/rabbana.test.js).
// Mətn heç vaxt yenidən yazılmır: span = ayah.slice(start, end), start/end ayənin öz mətnindəki yerlərdir.

// Hərəkələr, Quran işarələri, tətvil — müqayisə üçün atılır; ٱ/أ/إ/آ → ا
const strip = (w) => w.replace(/[ً-ٰٟۖ-ۭـ]/g, '').replace(/[ٱأإآ]/g, 'ا')

/** "رَبَّنَا" nida forması: kök hərflər ربنا və ب üzərində fəthə (رَبُّنَا / رَبِّنَا deyil) */
export function isRabbanaWord(w) {
  return strip(w) === 'ربنا' && /بّ?َ/.test(w)
}

/** Ayədə bütün "رَبَّنَا" sözlərinin simvol mövqeləri */
export function rabbanaOffsets(text) {
  const out = []
  const re = /\S+/g
  let m
  while ((m = re.exec(text))) if (isRabbanaWord(m[0])) out.push(m.index)
  return out
}

/** Bütün Quran (ayahs[surə][ayə]) → [{ ref, s, a, offsets }] */
export function findCandidates(ayahs) {
  const out = []
  ayahs.forEach((sur, si) => sur.forEach((text, ai) => {
    const offsets = rabbanaOffsets(text)
    if (offsets.length) out.push({ ref: `${si + 1}:${ai + 1}`, s: si + 1, a: ai + 1, offsets })
  }))
  return out
}

const ayahAt = (ayahs, ref) => {
  const [s, a] = ref.split(':').map(Number)
  return ayahs[s - 1]?.[a - 1]
}

/**
 * Qərarlar + Quran → { items, problems }
 * items — include + review: { ref, s, a, status, who?, whoRef?, ayah, start, end }
 * problems — boş olmalıdır (namizədsiz qərar, qərarsız namizəd, tapılmayan "to" parçası …)
 */
export function buildRabbana(ayahs, decisions) {
  const problems = []
  const cands = findCandidates(ayahs)
  const byRef = new Map(cands.map(c => [c.ref, c]))
  const seen = new Set()
  const items = []
  for (const d of decisions) {
    if (seen.has(d.ref)) problems.push(`${d.ref}: təkrar qərar`)
    seen.add(d.ref)
    const c = byRef.get(d.ref)
    if (!c) { problems.push(`${d.ref}: namizəd deyil (رَبَّنَا yoxdur)`); continue }
    if (!['include', 'exclude', 'review'].includes(d.status)) problems.push(`${d.ref}: status ${d.status}`)
    if (!d.reason) problems.push(`${d.ref}: səbəb yoxdur`)
    if (d.status === 'exclude') continue
    const ayah = ayahAt(ayahs, d.ref)
    const k = (d.from || 1) - 1
    const start = c.offsets[k]
    if (start == null) { problems.push(`${d.ref}: ${d.from}-ci رَبَّنَا yoxdur`); continue }
    let end = ayah.length
    if (d.to) {
      const i = ayah.indexOf(d.to, start)
      if (i < 0) { problems.push(`${d.ref}: "to" parçası ayədə tapılmadı`); continue }
      end = i + d.to.length
    }
    const it = { ref: d.ref, s: c.s, a: c.a, status: d.status, ayah, start, end }
    if (d.who) { it.who = d.who; it.whoRef = d.whoRef }
    items.push(it)
  }
  for (const c of cands) if (!seen.has(c.ref)) problems.push(`${c.ref}: qərar yoxdur`)
  return { items, problems, candidates: cands }
}

/** Yaradılan modulun mətni (src/data/rabbanaSpans.gen.js) — sabit sıra, test də bununla müqayisə edir */
// Yalnız "include" — "review" qərarı verilənə qədər səhifəyə düşmür
export function genModule(items) {
  const rows = items.filter(it => it.status === 'include').map(it => {
    const o = { ref: it.ref, s: it.s, a: it.a, ayah: it.ayah, start: it.start, end: it.end }
    if (it.who) { o.who = it.who; o.whoRef = it.whoRef }
    return `  ${JSON.stringify(o)},`
  })
  return [
    '// YARADILIB — əl ilə dəyişməyin: node scripts/build-rabbana.mjs',
    '// Mənbə: seo-data/quran/quran-uthmani.json (saytın Quran mətni) + src/data/rabbanaDuas.js (qərarlar).',
    '// Dua hissəsi = ayah.slice(start, end) — ayənin öz mətni, hərfi-hərfinə.',
    'export const RABBANA_ITEMS = [',
    ...rows,
    ']',
    '',
  ].join('\n')
}
