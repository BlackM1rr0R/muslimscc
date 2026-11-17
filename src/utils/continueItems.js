// ═══════════════════════════════════════════════════════
// "Davam et" — bu cihazın (və hesab sinxronizasiyası ilə gələn) tərəqqisindən siyahı
// Saf funksiya: storage → elementlər. Mətn yoxdur (yazılar components/ContinueCard-dadır).
//
// Mənbələr (açarlar səhifələrin özlərindədir — burada yalnız OXUNUR, hər biri ayrıca try):
//   quran_bookmark { surah, ayah?, name, time }  · mushaf_last_page
//   muslim_cc_hadith_last (utils/hadithLastRead) · arabic_course_v1 { best, last }
//   learn_progress_v1 { last, read[] }            · hifz_progress { surə: 1|2 }
//   hajjguide:last { mode, step }                  · muslim_cc_storybooks { kitab: səhifə, __last }
//   dhikr_session { selIdx, count }
// Element: { key, icon, page, param?, search?, hash?, at, vars } — page/param → seo/routes.pathFor
// Sıra: vaxtı bilinənlər (ən təzəsi əvvəl), sonra sabit sıra.
// ═══════════════════════════════════════════════════════
import { readHadithLast } from './hadithLastRead'

const ARABIC_PASS = 70   // components/arabic/progress.js → PASS_PERCENT
const LESSON_RE = /^[a-z0-9-]{1,48}$/

function json(storage, k) {
  try { return JSON.parse(storage.getItem(k)) } catch { return null }
}

export function buildContinueItems(storage) {
  if (!storage) return []
  const out = []
  const push = (it) => out.push({ at: 0, vars: {}, ...it })

  const bm = json(storage, 'quran_bookmark')
  const s = Number(bm?.surah)
  if (Number.isInteger(s) && s >= 1 && s <= 114) {
    const a = Number(bm.ayah)
    const ayah = Number.isInteger(a) && a > 1 && a <= 286 ? a : null
    push({ key: 'quran', icon: 'quran', page: 'quran', param: s, search: ayah ? `?a=${ayah}` : '', at: Number(bm.time) || 0,
      vars: { surah: s, ayah, name: typeof bm.name === 'string' ? bm.name.slice(0, 60) : '' } })
  }

  try {
    const p = Number(storage.getItem('mushaf_last_page'))
    if (Number.isInteger(p) && p >= 1 && p <= 604) push({ key: 'mushaf', icon: 'mushaf', page: 'mushaf', search: `?p=${p}`, vars: { page: p } })
  } catch { /* */ }

  const h = readHadithLast(storage)
  if (h?.src === 'lib') push({ key: 'hadith', icon: 'hadithbooks', page: 'hadithbooks', hash: `#${h.book}/${h.sec}/${h.n}`, at: h.at, vars: { book: h.book, n: h.n } })
  else if (h?.src === 'site') push({ key: 'hadith', icon: 'hadith', page: 'hadith', param: String(h.id), at: h.at, vars: { id: h.id } })

  const ac = json(storage, 'arabic_course_v1')
  if (ac && typeof ac === 'object' && !Array.isArray(ac)) {
    const best = ac.best && typeof ac.best === 'object' ? ac.best : {}
    const done = Object.values(best).filter((n) => Number(n) >= ARABIC_PASS).length
    const last = typeof ac.last === 'string' && LESSON_RE.test(ac.last) ? ac.last : null
    if (last || Object.keys(best).length) push({ key: 'arabic', icon: 'arabic', page: 'arabic', hash: last ? `#${last}` : '', vars: { done } })
  }

  const lp = json(storage, 'learn_progress_v1')
  if (typeof lp?.last === 'string' && LESSON_RE.test(lp.last)) {
    push({ key: 'lesson', icon: 'learn', page: 'learn', param: lp.last, vars: { slug: lp.last, read: Array.isArray(lp.read) ? lp.read.length : 0 } })
  }

  const hz = json(storage, 'hifz_progress')
  if (hz && typeof hz === 'object' && !Array.isArray(hz)) {
    let mem = 0, prog = 0
    for (const [k, v] of Object.entries(hz)) {
      const n = Number(k)
      if (!Number.isInteger(n) || n < 1 || n > 114) continue
      if (v === 2) mem++
      else if (v === 1) prog++
    }
    if (mem || prog) push({ key: 'hifz', icon: 'hifz', page: 'hifz', vars: { memorized: mem, inProgress: prog } })
  }

  const hj = json(storage, 'hajjguide:last')
  if (hj && (hj.mode === 'hajj' || hj.mode === 'umrah') && Number.isInteger(hj.step) && hj.step >= 0 && hj.step < 100) {
    push({ key: 'hajj', icon: 'hajjguide', page: 'hajjguide', search: '?resume=1', vars: { mode: hj.mode, step: hj.step + 1 } })
  }

  const sb = json(storage, 'muslim_cc_storybooks')
  if (sb && typeof sb === 'object' && !Array.isArray(sb)) {
    const lastId = typeof sb.__last === 'string' && /^[a-z0-9-]{1,60}$/.test(sb.__last) && Number.isInteger(sb[sb.__last]) ? sb.__last : null
    const id = lastId || Object.keys(sb).find((k) => k !== '__last' && /^[a-z0-9-]{1,60}$/.test(k) && Number.isInteger(sb[k]) && sb[k] > 0)
    if (id && Number.isInteger(sb[id]) && sb[id] >= 0) {
      push({ key: 'story', icon: 'kids', page: 'kids', search: `?section=books&book=${encodeURIComponent(id)}`, vars: { book: id, page: sb[id] + 1 } })
    }
  }

  const dz = json(storage, 'dhikr_session')
  const cnt = Number(dz?.count)
  if (Number.isInteger(cnt) && cnt > 0 && cnt < 100000) push({ key: 'dhikr', icon: 'dhikr', page: 'dhikr', vars: { count: cnt } })

  // Vaxtı bilinənlər əvvəl (ən təzəsi), qalanları yuxarıdakı sabit sırada (sort sabitdir)
  return out.map((it, i) => ({ it, i })).sort((x, y) => (y.it.at - x.it.at) || (x.i - y.i)).map((x) => x.it)
}

/** Element → ünvan (pathFor verilir ki, bu modul routes-u idxal etməsin) */
export function continueHref(it, pathFor, lang) {
  return pathFor(it.page, lang, it.param) + (it.search || '') + (it.hash || '')
}
