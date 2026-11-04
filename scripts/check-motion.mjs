#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Hərəkət performansı yoxlaması (DESIGN.md §7.3)
//
// Sonsuz (infinite) CSS animasiyası GPU-ya ötürülməyən xassəni (background-position,
// box-shadow, text-shadow, filter, clip-path, stroke-* …) animasiya edirsə, brauzer
// HƏR kadr əsas axında stil hesablayıb rəngləyir — səhifə boş dayananda da.
// 2026-11-05: orta telefonda sürüşmə 7–17 FPS-ə düşmüşdü.
//
// İcazə: yalnız müvəqqəti, aktiv vəziyyətə bağlı animasiyalar (ALLOW).
// İstifadə: node scripts/check-motion.mjs   (npm run check daxilində)
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'

const DIR = 'src/styles'
// Aktiv vəziyyət bitəndə dayanır: səslənən ayə, yazılan AI cavabı
const ALLOW = new Set(['qp-flow', 'qp-ayah-glow', 'aic-stream', 'aiw-stream'])
const COMPOSITED = new Set(['transform', 'opacity', 'translate', 'rotate', 'scale'])
const KEYWORDS = new Set(['infinite', 'linear', 'ease', 'alternate', 'alternate-reverse', 'both', 'forwards', 'backwards',
  'normal', 'reverse', 'none', 'paused', 'running', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end'])

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.css')).map(f => path.join(DIR, f))
const src = Object.fromEntries(files.map(f => [f, fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')]))

// 1) Bütün @keyframes → animasiya olunan xassələr
const keyframes = {}
for (const [f, s] of Object.entries(src)) {
  const re = /@keyframes\s+([\w-]+)\s*\{/g
  let m
  while ((m = re.exec(s))) {
    let i = re.lastIndex, depth = 1
    while (depth && i < s.length) { if (s[i] === '{') depth++; else if (s[i] === '}') depth--; i++ }
    const props = new Set([...s.slice(re.lastIndex, i - 1).matchAll(/([a-z-]+)\s*:/g)].map(x => x[1]))
    keyframes[m[1]] = { file: f, props: [...props] }
  }
}

// 2) "infinite" istifadələri (animation qısa yazılışı və animation-iteration-count)
const problems = []
for (const [f, s] of Object.entries(src)) {
  for (const a of s.matchAll(/animation\s*:\s*([^;}]+)/g)) {
    for (const part of a[1].split(/,(?![^(]*\))/)) {
      if (!/\binfinite\b/.test(part)) continue
      const name = part.trim().split(/\s+/).find(t => /^[a-z][\w-]*$/i.test(t) && !KEYWORDS.has(t))
      const kf = name && keyframes[name]
      if (!kf || ALLOW.has(name)) continue
      const bad = kf.props.filter(p => !COMPOSITED.has(p))
      if (bad.length) {
        const line = s.slice(0, a.index).split('\n').length
        problems.push(`${f}:${line}  ${name} → ${bad.join(', ')}`)
      }
    }
  }
}

if (problems.length) {
  console.error('✗ Sonsuz animasiya GPU-ya ötürülməyən xassəni dəyişir (DESIGN.md §7.3):')
  for (const p of problems) console.error('  ' + p)
  console.error('  Həll: yalnız transform/opacity, və ya məhdud təkrar (2, 3), və ya yalnız aktiv vəziyyətdə.')
  process.exit(1)
}
console.log(`✓ Sonsuz animasiyalar yalnız transform/opacity ilədir (${Object.keys(keyframes).length} @keyframes yoxlandı)`)
