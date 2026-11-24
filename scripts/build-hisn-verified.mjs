#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Hisnul-Müslim — hisnmuslim.com ilə tutuşdurulmuş (yoxlanmış) zikrlərin siyahısı
//
//   node scripts/build-hisn-verified.mjs [--cache <qovluq>]
//
// NƏ: public/data/hisn/ar.json-dakı hər bəndin ərəbcə mətni hisnmuslim.com-un rəsmi API-si
// (https://www.hisnmuslim.com/api/ar/husn_ar.json → hər fəsil /api/ar/<ID>.json) ilə
// tutuşdurulur: hərəkələr, tətvil, durğu silinir, əlif/ya/ta-mərbuta formaları birləşdirilir,
// sonra hərf bigram-larının Dice əmsalı. Ən yaxın qarşılığı DICE_MIN (0.85) və yuxarı olan bənd
// "yoxlanmış" sayılır (2026-11-24 məzmun yoxlamasının üsulu: 255 / 293).
// NİYƏ: /ar/hisnul-muslim/<fəsil>-<bənd> SEO səhifələri (sahibin qərarı) YALNIZ yoxlanmış
// bəndlər üçün yaradılır — ərəbcə mətn + təkrar sayı + təxric, tərcümə yoxdur.
// ÇIXIŞ (repoya commit olunur — build zamanı şəbəkə YOXDUR):
//   • seo-data/hisn-verified.json — hər bəndin müqayisəsi (bal, qarşı ID, təkrar sayları,
//     mətnin barmaq izi); tests/unit/hisn-dua-pages.test.js ar.json dəyişibsə xəbər verir
//   • src/seo/hisnIds.js — yoxlanmış bəndlərin slug-ları ("27-1": fəsil 27, 1-ci bənd)
// --cache <qovluq>: əvvəl yüklənmiş husn_ar.json + <ID>.json faylları (şəbəkəsiz təkrar).
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const DICE_MIN = 0.85
export const API = 'https://www.hisnmuslim.com/api/ar'

// Hərəkələr (fəthə…sukun, şəddə, Quran işarələri), üst əlif, tətvil
const DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g

/** Ərəbcə mətni müqayisə üçün normallaşdır: hərəkəsiz, durğusuz, vahid əlif/ya/ha. */
export function normAr(s) {
  return String(s || '')
    .replace(DIACRITICS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\u0621-\u064A\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Hərf bigram-larının çoxluğu (multiset) — boşluqlar çıxarılır. */
function bigrams(s) {
  const t = s.replace(/\s/g, '')
  const m = new Map()
  for (let i = 0; i < t.length - 1; i++) {
    const g = t.slice(i, i + 2)
    m.set(g, (m.get(g) || 0) + 1)
  }
  return { m, n: Math.max(0, t.length - 1) }
}

/** Sørensen–Dice (bigram multiset) — 0…1; normallaşdırılmış mətnlər üçün. */
export function dice(a, b) {
  const A = bigrams(a)
  const B = bigrams(b)
  if (!A.n || !B.n) return a === b && a ? 1 : 0
  let inter = 0
  for (const [g, c] of A.m) inter += Math.min(c, B.m.get(g) || 0)
  return (2 * inter) / (A.n + B.n)
}

/** Mətnin qısa barmaq izi (normallaşdırılmış ərəbcə → sha1, 12 simvol). */
export const fingerprint = (ar) => crypto.createHash('sha1').update(normAr(ar)).digest('hex').slice(0, 12)

/**
 * Mətni uyğun gəlsə də SƏHİFƏSİ YARADILMAYAN bəndlər — { fəsil: səbəb } (2026-11-24 yoxlaması).
 * Fəsil 2: ar.json-da təxric sürüşüb — 1-ci və 2-ci bəndin "src"-i söz izahıdır ("* أي الموت المجازي…"),
 * Buxari 11/113 + Müslim 4/2083 (kitabda 1-ci bəndin təxrici) 3-cü bəndə, Tirmizi 5/473 ("عافاني"-nin
 * təxrici) 4-cü bəndə (Ali-İmran ayələri) düşüb. ar.json düzələnə qədər bu fəslin səhifəsi yoxdur.
 */
export const HOLD = {
  2: 'takhrij misaligned in ar.json (glosses as src on items 1-2; Bukhari 11/113 on item 3, Tirmidhi 5/473 on item 4)',
}

/** Slug: fəsil id + bəndin fəsildəki 1-dən başlayan sırası ("27-1"). */
export const slugOf = (chapterId, index0) => `${chapterId}-${index0 + 1}`

/**
 * Bizim fəsillər × onların bəndləri → hər bəndin müqayisəsi.
 * ours — ar.json → chapters; theirs — [{ id, ar, repeat }] (bütün fəsillərin bəndləri).
 */
export function compareHisn(ours, theirs, { min = DICE_MIN, hold = HOLD } = {}) {
  const T = theirs.map((x) => ({ ...x, norm: normAr(x.ar) }))
  const items = []
  for (const c of ours) {
    c.items.forEach((it, i) => {
      const n = normAr(it.ar)
      let best = null
      let score = 0
      for (const t of T) {
        const s = dice(n, t.norm)
        if (s > score) { score = s; best = t }
      }
      const rounded = Math.round(score * 1000) / 1000
      items.push({
        slug: slugOf(c.id, i),
        chapter: c.id,
        index: i,
        score: rounded,
        theirId: best ? best.id : null,
        repeat: it.repeat || 1,
        theirRepeat: best ? (best.repeat || 1) : null,
        fp: fingerprint(it.ar),
        verified: score >= min,
        // Səhifə yalnız yoxlanmış VƏ saxlanılmayan (HOLD) bənd üçün; təxricsiz bənd də yox
        published: score >= min && !hold[c.id] && Boolean(String(it.src || '').trim()),
        ...(hold[c.id] ? { hold: hold[c.id] } : {}),
      })
    })
  }
  return items
}

/** Səhifəsi yaradılan bəndlərin slug-ları (kitabdakı ardıcıllıqla). */
export const publishedSlugs = (items) => items.filter((x) => x.published).map((x) => x.slug)

// ── Yükləmə (bir dəfəlik) ──
const stripBom = (t) => t.replace(/^\uFEFF/, '')
async function getJson(url, cacheDir, name) {
  const f = cacheDir && path.join(cacheDir, name)
  if (f && fs.existsSync(f)) return JSON.parse(stripBom(fs.readFileSync(f, 'utf8')))
  const r = await fetch(url, { headers: { 'user-agent': 'muslims.cc build (hisn verification)' } })
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`)
  const t = await r.text()
  if (f) fs.writeFileSync(f, t)
  return JSON.parse(stripBom(t))
}

async function fetchTheirs(cacheDir) {
  const index = Object.values(await getJson(`${API}/husn_ar.json`, cacheDir, 'husn_ar.json'))[0]
  const out = []
  for (const ch of index.sort((a, b) => a.ID - b.ID)) {
    const d = await getJson(`${API}/${ch.ID}.json`, cacheDir, `${ch.ID}.json`)
    for (const x of Object.values(d)[0]) out.push({ id: x.ID, chapter: ch.ID, ar: x.ARABIC_TEXT, repeat: Number(x.REPEAT) || 1 })
  }
  return out
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const ci = process.argv.indexOf('--cache')
  const cacheDir = ci > -1 ? path.resolve(process.argv[ci + 1]) : null
  const ours = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'data', 'hisn', 'ar.json'), 'utf8')).chapters
  const theirs = await fetchTheirs(cacheDir)
  const items = compareHisn(ours, theirs)
  const ok = publishedSlugs(items)
  const out = {
    source: `${API}/husn_ar.json`,
    method: `normalized Arabic (no diacritics/punctuation, unified alif/ya/ta marbuta), character-bigram Dice >= ${DICE_MIN}`,
    theirItems: theirs.length,
    total: items.length,
    verified: items.filter((x) => x.verified).length,
    published: ok.length,
    items,
  }
  fs.mkdirSync(path.join(ROOT, 'seo-data'), { recursive: true })
  fs.writeFileSync(path.join(ROOT, 'seo-data', 'hisn-verified.json'), JSON.stringify(out, null, 0).replace(/},{/g, '},\n{') + '\n')
  fs.writeFileSync(path.join(ROOT, 'src', 'seo', 'hisnIds.js'),
    `// Avtomatik yaradılır: node scripts/build-hisn-verified.mjs — əl ilə redaktə etmə.\n` +
    `// /ar/hisnul-muslim/<fəsil>-<bənd> səhifələri (${ok.length}): hisnmuslim.com ilə tutuşdurulmuş bəndlər\n` +
    `export const HISN_DUA_IDS = ${JSON.stringify(ok)}\n`)
  const rep = items.filter((x) => x.verified && x.repeat !== x.theirRepeat)
  console.log(`${items.length} bənd, ${theirs.length} qarşı bənd → ${items.filter((x) => x.verified).length} yoxlanmış (Dice ≥ ${DICE_MIN}), ${ok.length} səhifə; təkrar sayı fərqli: ${rep.map((x) => `${x.slug} ${x.repeat}≠${x.theirRepeat}`).join(', ') || 'yoxdur'}`)
  console.log('yoxlanmamış:', items.filter((x) => !x.verified).map((x) => `${x.chapter}.${x.index}(${x.score})`).join(' '))
}
