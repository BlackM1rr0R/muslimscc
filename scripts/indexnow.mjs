// ═══════════════════════════════════════════════════════
// IndexNow (https://www.indexnow.org) — deploy-dan sonra YALNIZ dəyişən URL-ləri Bing, Yandex,
// Seznam, Naver… axtarış sistemlərinə bildirir (ChatGPT axtarışı və Copilot Bing indeksinə söykənir).
//
// AÇAR GİZLİ DEYİL (protokolun özü belədir): public/<açar>.txt faylı saytın kökündə açıq durur —
// axtarış sistemi onu yükləyib "bu host-a bu açarla bildiriş göndərmək olar" deyə yoxlayır. Açar
// yalnız URL bildirişinə icazə verir; heç bir hesab, API və ya məlumata giriş vermir. Dəyişmək
// üçün: yeni təsadüfi 32 hex simvol → INDEXNOW_KEY + public/<yeni>.txt (köhnəni sil).
//
// Necə işləyir:
//   1) prerender.mjs → buildSeoManifest(): dist/seo-manifest.json — sitemap-dakı hər yol üçün
//      səhifənin SEO məzmununun (title, description, canonical, robots, hreflang, JSON-LD, statik
//      <body>) qısa həşi. Asset adları (hash-li JS/CSS) daxil DEYİL — hər build-də dəyişirlər.
//   2) CI deploy job: deploy-dan ƏVVƏL canlı /seo-manifest.json (köhnə versiya) yüklənir, deploy-dan
//      SONRA yenisi; `node scripts/indexnow.mjs submit old.json new.json` fərqi göndərir.
//   3) Köhnə manifest yoxdursa (ilk dəfə) — heç nə göndərilmir (baza yaranır). Bir deploy-da ən çox
//      MAX_URLS URL, POST başına ≤ 10 000 (protokol həddi), POST-lar arası fasilə; 429/403 → dayan.
// Bu fayl yalnız node: modullarından istifadə edir — CI onu tək fayl kimi (sparse checkout) işlədir.
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

export const INDEXNOW_KEY = '5d4655aa92c73290b99307283834f6af'
export const HOST = 'muslims.cc'
export const ENDPOINT = 'https://api.indexnow.org/indexnow'
export const BATCH = 10000
export const MAX_URLS = 20000

/** Səhifənin SEO-ya aid hissəsi (asset adları çıxarılıb) — həş üçün. */
export function seoFingerprint(html) {
  const pick = (re) => (html.match(re) || []).join('\n')
  const head = [
    pick(/<title>[\s\S]*?<\/title>/i),
    pick(/<meta\s+name="(?:description|robots)"[^>]*>/gi),
    pick(/<link\s+rel="(?:canonical|alternate)"[^>]*>/gi),
    pick(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi),
  ].join('\n')
  const i = html.indexOf('<div id="root">')
  const j = i < 0 ? -1 : html.indexOf('<noscript>', i)
  const body = i < 0 ? '' : html.slice(i, j < 0 ? undefined : j)
  return head + '\n' + body
}

export const hashOf = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10)

/** dist + sitemap yolları → { v: 1, h: { '/en/quran': 'a1b2c3d4e5', … } } */
export function buildSeoManifest(dist, paths) {
  const h = {}
  for (const p of paths) {
    const f = p === '/' ? path.join(dist, 'index.html') : path.join(dist, p.replace(/^\//, ''), 'index.html')
    let html = ''
    try { html = fs.readFileSync(f, 'utf8') } catch { continue }
    h[p] = hashOf(seoFingerprint(html))
  }
  return { v: 1, h }
}

/** Köhnə və yeni manifest → bildiriləcək yollar (yeni/dəyişən, sonra silinən). Köhnə yoxdursa — []. */
export function changedPaths(oldM, newM) {
  const o = oldM && oldM.v === 1 && oldM.h && typeof oldM.h === 'object' ? oldM.h : null
  const n = newM && newM.v === 1 && newM.h && typeof newM.h === 'object' ? newM.h : null
  if (!o || !n || Object.keys(o).length === 0) return []
  const changed = Object.keys(n).filter(p => o[p] !== n[p])
  const removed = Object.keys(o).filter(p => !(p in n))
  return [...changed, ...removed]
}

/** Yollar → IndexNow POST gövdələri (≤ BATCH URL, cəmi ≤ MAX_URLS). */
export function payloads(paths, { key = INDEXNOW_KEY, host = HOST } = {}) {
  const urls = paths.slice(0, MAX_URLS).map(p => `https://${host}${p}`)
  const out = []
  for (let i = 0; i < urls.length; i += BATCH) {
    out.push({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList: urls.slice(i, i + BATCH) })
  }
  return out
}

const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch { return null } }

async function submit(oldFile, newFile, dryRun) {
  const list = changedPaths(readJson(oldFile), readJson(newFile))
  if (!list.length) { console.log('IndexNow: dəyişən URL yoxdur (və ya köhnə manifest yoxdur — baza) — göndərilmir.'); return 0 }
  const bodies = payloads(list)
  console.log(`IndexNow: ${list.length} dəyişən URL${list.length > MAX_URLS ? ` (ilk ${MAX_URLS})` : ''}, ${bodies.length} POST`)
  for (const u of list.slice(0, 10)) console.log('  ' + u)
  if (dryRun) return 0
  for (let i = 0; i < bodies.length; i++) {
    if (i) await new Promise(r => setTimeout(r, 3000))
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(bodies[i]),
    })
    console.log(`IndexNow POST ${i + 1}/${bodies.length}: HTTP ${res.status}`)
    // 200/202 — qəbul olundu. 403 (açar tapılmadı), 422 (host uyğun deyil), 429 (çox sorğu) — dayan
    if (res.status !== 200 && res.status !== 202) return 1
  }
  return 0
}

// CLI: node scripts/indexnow.mjs submit <köhnə.json> <yeni.json> [--dry-run]
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, oldFile, newFile] = process.argv.slice(2)
  if (cmd !== 'submit' || !oldFile || !newFile) {
    console.error('İstifadə: node scripts/indexnow.mjs submit <köhnə.json> <yeni.json> [--dry-run]')
    process.exit(2)
  }
  process.exit(await submit(oldFile, newFile, process.argv.includes('--dry-run')))
}
