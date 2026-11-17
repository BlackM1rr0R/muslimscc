// ═══════════════════════════════════════════════════════
// Səhabə kartları albomu (v8) — saf məntiq
//
// • markSahabaSeen(slug) — istifadəçi səhabənin profilini oxuyanda çağırılır
//   (SahabePage → Profile). localStorage 'muslim_cc_sahaba_album' =
//   { [slug]: ilk baxışın ISO vaxtı }. İlk baxış bir dəfə yazılır, sonra dəyişmir.
// • readAlbum() — yazılmış albom (səhv/boş olsa {}).
// • Albomun öz "meta"sı ayrıca açardadır ('…_meta'): hansı kartın çevrilmə
//   animasiyası artıq göstərilib (shown) və hansı nişanın təbriki edilib (ms).
// • Nişanlar: say mərhələləri (5 / 10 / 25 / 50 — cəmdən kiçik olanlar + hamısı)
//   və mövzu dəstləri. Dəstlər YALNIZ saytın səhabə məlumatından çıxarılır
//   (SahabePage-in filtrləri ilə eyni meyar): raşid xəlifələr — vəzifə
//   sahəsində "Caliph"; qadın səhabələr — adda "bint"; hədis raviləri —
//   faktda "Narrated N hadiths". Dini təsnifat burada əl ilə yazılmır.
//   "Cənnətlə müjdələnən onlar" dəsti QURULMUR: məlumatda bu fakt 10 nəfərdən
//   yalnız bir neçəsinin profilində var — natamam dəst yanıldıcı olardı.
// • Bütün localStorage girişləri try içindədir (SSR, gizli rejim, dolu yaddaş).
// ═══════════════════════════════════════════════════════

export const ALBUM_KEY = 'muslim_cc_sahaba_album'
export const META_KEY = 'muslim_cc_sahaba_album_meta'
export const ALBUM_EVENT = 'mcc:sahaba-album'

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)

function store() {
  try { return typeof window !== 'undefined' ? window.localStorage : null } catch { return null }
}

/** Albom: { [slug]: ISO }. Səhv JSON / yanlış dəyərlər atılır. */
export function readAlbum() {
  try {
    const raw = store()?.getItem(ALBUM_KEY)
    const v = raw ? JSON.parse(raw) : null
    if (!isObj(v)) return {}
    const out = {}
    for (const [k, t] of Object.entries(v)) if (typeof t === 'string' && k) out[k] = t
    return out
  } catch { return {} }
}

/** Profil oxundu. Yeni kartdırsa true qaytarır (və hadisə göndərir). */
export function markSahabaSeen(slug, now = new Date()) {
  try {
    if (!slug || typeof slug !== 'string') return false
    const ls = store()
    if (!ls) return false
    const album = readAlbum()
    if (album[slug]) return false
    album[slug] = new Date(now).toISOString()
    ls.setItem(ALBUM_KEY, JSON.stringify(album))
    try { window.dispatchEvent(new CustomEvent(ALBUM_EVENT, { detail: { slug } })) } catch { /* SSR */ }
    return true
  } catch { return false }
}

/** Meta: { shown: [slug], ms: [badgeId] } */
export function readMeta() {
  try {
    const raw = store()?.getItem(META_KEY)
    const v = raw ? JSON.parse(raw) : null
    const arr = (a) => (Array.isArray(a) ? a.filter(x => typeof x === 'string') : [])
    return { shown: arr(v?.shown), ms: arr(v?.ms) }
  } catch { return { shown: [], ms: [] } }
}

export function writeMeta(meta) {
  try {
    const clean = { shown: [...new Set(meta?.shown || [])], ms: [...new Set(meta?.ms || [])] }
    store()?.setItem(META_KEY, JSON.stringify(clean))
    return clean
  } catch { return meta }
}

/** İrəliləyiş — yalnız mövcud səhabələr sayılır (silinmiş slug sayılmır). */
export function progressOf(album, slugs) {
  const total = slugs.length
  const seen = slugs.filter(s => album && album[s]).length
  return { seen, total, pct: total ? Math.round((seen / total) * 100) : 0 }
}

/* ── Qruplar (kartın rəngi) — SahabePage filtrləri ilə eyni meyar ── */
export const isCaliph = (s) => /\bcaliph\b/i.test(s?.title?.en || '')
export const isWoman = (s) => /\bbint\b/i.test(s?.name?.en || '')
export function narratedCount(s) {
  for (const f of s?.facts || []) {
    const m = /Narrated (?:over )?([\d,]+) hadiths/i.exec(f?.en || '')
    if (m) return Number(m[1].replace(/,/g, ''))
  }
  return 0
}
export const isNarrator = (s) => narratedCount(s) > 0

/** Kartın rəng qrupu: xəlifə > qadın > ravi > səhabə */
export function groupOf(s) {
  if (isCaliph(s)) return 'caliph'
  if (isWoman(s)) return 'woman'
  if (isNarrator(s)) return 'narrator'
  return 'companion'
}

/** Mövzu dəstləri (boş dəst və tək nəfərlik dəst qaytarılmır) */
export function setsOf(list, slugOf) {
  const defs = [
    { id: 'set:caliphs', test: isCaliph },
    { id: 'set:women', test: isWoman },
    { id: 'set:narrators', test: isNarrator },
  ]
  return defs
    .map(d => ({ id: d.id, slugs: list.filter(d.test).map(slugOf) }))
    .filter(d => d.slugs.length >= 2)
}

/** Say mərhələləri: 5, 10, 25, 50 (cəmdən kiçiklər) + hamısı */
export function milestonesFor(total) {
  if (!total) return []
  return [...[5, 10, 25, 50].filter(n => n < total), total]
}

/** Bütün nişanlar və vəziyyəti */
export function badgesOf(album, list, slugOf) {
  const slugs = list.map(slugOf)
  const { seen, total } = progressOf(album, slugs)
  const count = milestonesFor(total).map(n => ({
    id: n === total ? 'all' : `n:${n}`, kind: n === total ? 'all' : 'count', need: n, have: Math.min(seen, n), done: seen >= n,
  }))
  const sets = setsOf(list, slugOf).map(d => {
    const have = d.slugs.filter(s => album && album[s]).length
    return { id: d.id, kind: 'set', need: d.slugs.length, have, done: have >= d.slugs.length, slugs: d.slugs }
  })
  return [...count, ...sets]
}

/** Təbrik edilməmiş, yeni qazanılmış nişanlar */
export const newBadges = (badges, celebrated = []) => badges.filter(b => b.done && !celebrated.includes(b.id))

/** Çevrilmə animasiyası gözləyən kartlar: görülüb, amma albomda hələ açılmayıb */
export const pendingReveals = (album, shown = [], slugs = Object.keys(album || {})) =>
  slugs.filter(s => album && album[s] && !shown.includes(s))

/* ── Kart mətni: profilin öz mətnindən HƏRFİYYƏN ── */

/** Birinci cümlə (SahabePage-in sentencesOf qaydası: "Hz." kimi qısaltmada bölmür) */
export function firstSentence(text) {
  const parts = String(text || '').split(/(?<=[.!?؟])\s+/)
  let out = ''
  for (const p of parts) {
    out = out ? `${out} ${p}` : p
    if (!/(^|[\s(])\p{L}{1,2}\.$/u.test(out)) break
  }
  return out.trim()
}

/** Ləqəb/künyə — profildəki "ləqəbi verilmişdir" faktının dırnaq içindəki hissəsi.
 *  pick(obj, lang) — dil seçicisi (pickUi). Adla eynidirsə (Əbu Hureyrə) qaytarılmır. */
export function laqabOf(s, lang, pick = (o, l) => o?.[l] ?? o?.en) {
  const f = (s?.facts || []).find(x => /title "|called him "|name "|^"/i.test(x?.en || ''))
  if (!f) return ''
  const text = String(pick(f, lang) || '')
  const m = /["«“„]([^"«»“”„]{2,40})["»”“]/.exec(text)
  if (!m) return ''
  const v = m[1].trim()
  const name = String(pick(s.name, lang) || '')
  return name.toLowerCase().includes(v.toLowerCase()) ? '' : v
}

/** Medalyon üçün ərəbcə ilk hərf ("أبو بكر" → "أ") */
export const arabicInitial = (ar) => {
  const ch = [...String(ar || '').trim()].find(c => /\p{L}/u.test(c))
  return ch || '·'
}
