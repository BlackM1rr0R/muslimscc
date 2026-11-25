// ═══════════════════════════════════════════════════════
// Kritik CSS — ana səhifənin statik ilk ekranı üçün (scripts/prerender.mjs → home)
//
// NƏ: səhifə chunk-ının CSS-indən (build edilmiş, minifikasiyalı) YALNIZ statik blokda
// (scripts/seo-body.mjs → homeBody) işlənən siniflərə aid qaydaları seçir və <head>-ə
// inline yazılır. Ana səhifənin CSS faylları isə adi kimi (preload, render-blocking YOX)
// yüklənir — əvvəl 3 fayl (~10 KB gzip) render-blocking idi və CPU ×4-də React gecikirdi.
//
// Qayda: selektor siyahısındakı hər selektor ayrıca yoxlanılır — içindəki BÜTÜN .sinif-lər
// statik blokda varsa (və ən azı bir sinif varsa) saxlanılır. @media/@supports içi eyni qayda
// ilə süzülür, boş qalanlar atılır. @keyframes yalnız saxlanmış elanlarda adı çəkiləndə qalır.
// Ehtiyat üçün asılılıq yoxdur (postcss lazım deyil) — Vite-in minifikasiyalı çıxışı üçün
// sadə mötərizə ayırıcısıdır (dırnaq və url(...) içindəki simvollara toxunmur).
// ═══════════════════════════════════════════════════════

/** Minifikasiyalı CSS-i yuxarı səviyyəli bloklara ayır: [{ prelude, body }] (body — {} içi). */
export function splitBlocks(css) {
  const out = []
  let i = 0
  const n = css.length
  while (i < n) {
    // şərhləri və boşluğu keç
    if (css.startsWith('/*', i)) { const e = css.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue }
    if (/\s/.test(css[i])) { i++; continue }
    let start = i, depth = 0, q = null, open = -1
    for (; i < n; i++) {
      const c = css[i]
      if (q) { if (c === '\\') { i++; continue } if (c === q) q = null; continue }
      if (c === '"' || c === "'") { q = c; continue }
      if (c === ';' && depth === 0 && open < 0) { out.push({ prelude: css.slice(start, i).trim(), body: null }); i++; break }
      if (c === '{') { if (depth === 0) open = i; depth++; continue }
      if (c === '}') { depth--; if (depth === 0) { out.push({ prelude: css.slice(start, open).trim(), body: css.slice(open + 1, i) }); i++; break } }
    }
    if (i >= n && depth > 0) break
  }
  return out
}

// :not(.x) — inkar: sinifin statik blokda olması TƏLƏB OLUNMUR (html:not(.a11y-reduce-motion) …)
const classesOf = (sel) => (sel.replace(/:not\([^()]*\)/g, '').match(/\.(-?[_a-zA-Z][\w-]*)/g) || []).map((c) => c.slice(1))

/** Selektor siyahısını süz: yalnız sinifləri statik blokda olan selektorlar. */
function keepSelectors(prelude, has) {
  // vergüllə ayır (mötərizə içindəki vergüllərə — :is(a, b) — toxunma)
  const parts = []
  let depth = 0, cur = ''
  for (const c of prelude) {
    if (c === '(') depth++
    if (c === ')') depth--
    if (c === ',' && depth === 0) { parts.push(cur); cur = ''; continue }
    cur += c
  }
  parts.push(cur)
  return parts.map((s) => s.trim()).filter((s) => {
    const cls = classesOf(s)
    return cls.length > 0 && cls.every((c) => has.has(c))
  })
}

function filterBlocks(css, has, usedFrames) {
  let out = ''
  for (const b of splitBlocks(css)) {
    if (b.body == null) continue                       // @charset / @import
    if (b.prelude.startsWith('@')) {
      if (/^@(-webkit-)?keyframes\s/.test(b.prelude)) { out += `\u0000KF${b.prelude}{${b.body}}\u0000`; continue }
      if (/^@(media|supports|container)\b/.test(b.prelude)) {
        const inner = filterBlocks(b.body, has, usedFrames)
        if (inner) out += `${b.prelude}{${inner}}`
      }
      continue                                         // @font-face, @layer … — kritik deyil
    }
    const sel = keepSelectors(b.prelude, has)
    if (!sel.length) continue
    for (const m of b.body.matchAll(/animation(?:-name)?\s*:([^;}]*)/g)) {
      for (const w of m[1].split(/[\s,]+/)) if (w) usedFrames.add(w)
    }
    out += `${sel.join(',')}{${b.body}}`
  }
  return out
}

/**
 * @param {string} css     — chunk CSS (bir neçə fayl birləşdirilmiş ola bilər)
 * @param {Iterable<string>} classes — statik HTML-dəki siniflər
 * @returns {string} kritik CSS
 */
export function criticalCss(css, classes) {
  const has = new Set(classes)
  const used = new Set()
  const raw = filterBlocks(css, has, used)
  // @keyframes — yalnız istifadə olunanlar (ad çəkilibsə)
  return raw.replace(/\u0000KF(@(?:-webkit-)?keyframes\s+([\w-]+))\{([\s\S]*?)\}\u0000/g, (_, pre, name, body) => (used.has(name) ? `${pre}{${body}}` : ''))
}

/** HTML-dəki bütün class="…" sinifləri. */
export function htmlClasses(html) {
  const s = new Set()
  for (const m of html.matchAll(/\sclass="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c) s.add(c)
  return s
}
