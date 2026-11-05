// Surənin kök buludu (components/quran/SurahRootCloud.jsx) — saf hesab (tests/unit/surah-roots.test.js)
import { decodeLocations } from './quranRoots'

// Çox işlənən köməkçi köklər (ədat, əvəzlik, "demək/olmaq") buludu doldurmasın —
// mövzunu göstərən sözlər qabağa çıxsın
const SKIP = new Set(['قول', 'كون', 'الله', 'أله', 'إله'])

/** roots → [{ root, n }] surədə ən çox keçən köklər */
export function surahRoots(roots, surah, limit = 24) {
  const out = []
  for (const [root, entries] of Object.entries(roots || {})) {
    if (SKIP.has(root)) continue
    let n = 0
    for (const [, , , enc] of entries) for (const [s] of decodeLocations(enc)) if (s === surah) n++
    if (n) out.push({ root, n })
  }
  return out.sort((a, b) => b.n - a.n || a.root.localeCompare(b.root)).slice(0, limit)
}
