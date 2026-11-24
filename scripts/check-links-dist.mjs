// ═══════════════════════════════════════════════════════
// Daxili linklərin oflayn yoxlaması (gecəlik workflow — .github/workflows/seo-nightly.yml; deploy qapısı DEYİL).
// dist-də nümunə səhifələrin HTML-indəki bütün daxili <a href="/…"> və <link rel=canonical|alternate>
// hədəfləri faylla açılırmı (nginx try_files: $uri, $uri/index.html). Xarici linklər yoxlanmır
// (başqa saytlara gecəlik yük salmırıq). Nümunə: bütün siyahı səhifələri × bütün dillər +
// hər detal səhifəsi en və az dilində (yetim/sınıq link + 404-ə aparan keçidlər görünür).
// İşə salma: node scripts/check-links-dist.mjs [dist]
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE, PAGES, DETAILS, LANGS, pathFor, detailParams, detailLangs, langsFor } from '../src/seo/routes.js'

/** HTML → daxili link yolları (hash/query-siz, təkrarsız). */
export function internalLinks(html) {
  const out = new Set()
  for (const m of html.matchAll(/<a\s[^>]*href="([^"]+)"/gi)) out.add(m[1])
  for (const m of html.matchAll(/<link\s[^>]*rel="(?:canonical|alternate)"[^>]*href="([^"]+)"/gi)) out.add(m[1])
  return [...out]
    .map(h => h.replace(/&amp;/g, '&').replace(SITE, '') || '/')
    .filter(h => h.startsWith('/') && !h.startsWith('//') && !h.startsWith('/api/'))
    .map(h => h.split('#')[0].split('?')[0] || '/')
}

/** Yol dist-də açılırmı (nginx: $uri, $uri/index.html)? */
export function resolves(dist, p) {
  let rel
  try { rel = decodeURIComponent(p).replace(/^\/+/, '') } catch { return false }
  const f = path.join(dist, rel)
  if (!f.startsWith(dist)) return false
  if (rel && fs.existsSync(f) && fs.statSync(f).isFile()) return true
  return fs.existsSync(path.join(f, 'index.html'))
}

export function samplePaths() {
  const out = new Set()
  for (const p of PAGES) if (!p.noindex) for (const l of langsFor(p.key)) out.add(pathFor(p.key, l))
  for (const key of Object.keys(DETAILS)) {
    if (DETAILS[key].noindex) continue
    // Tək dilli detal (Hisnul-Müslim zikri — yalnız ar) öz dilində yoxlanır
    const ls = DETAILS[key].langs ? detailLangs(key) : ['az', 'en']
    for (const param of detailParams(key)) for (const l of ls) if (LANGS.includes(l)) out.add(pathFor(key, l, param))
  }
  return [...out]
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dist = path.resolve(process.argv[2] || 'dist')
  const t0 = Date.now()
  const ok = new Map()
  const broken = new Map() // hədəf → [mənbə…]
  let pages = 0
  for (const src of samplePaths()) {
    const f = src === '/' ? path.join(dist, 'index.html') : path.join(dist, src.slice(1), 'index.html')
    if (!fs.existsSync(f)) { (broken.get(src) || broken.set(src, []).get(src)).push('(sitemap/routes)'); continue }
    pages++
    for (const l of internalLinks(fs.readFileSync(f, 'utf8'))) {
      if (!ok.has(l)) ok.set(l, resolves(dist, l))
      if (!ok.get(l)) (broken.get(l) || broken.set(l, []).get(l)).push(src)
    }
  }
  for (const [t, srcs] of [...broken].slice(0, 200)) console.error(`✗ ${t} ← ${srcs.slice(0, 3).join(', ')}${srcs.length > 3 ? ` (+${srcs.length - 3})` : ''}`)
  console.log(`Daxili linklər: ${pages} səhifə, ${ok.size} unikal hədəf, ${broken.size} sınıq, ${((Date.now() - t0) / 1000).toFixed(1)} san.`)
  process.exit(broken.size ? 1 : 0)
}
