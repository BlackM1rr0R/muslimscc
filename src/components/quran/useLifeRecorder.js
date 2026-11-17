// ═══════════════════════════════════════════════════════
// Ömürlük mozaika üçün oxunuş qeydi — Quran oxuyucusu (utils/quranLife)
//
// • Ayə kartı ekranda ≥ 1.5 s qalanda "oxunub" sayılır: kartın ≥ 60%-i görünür və ya
//   (uzun kart) ekranın yarısını tutur. Yalnız IntersectionObserver — sürüşmə dinləyicisi,
//   getBoundingClientRect, Intl yoxdur. Hər kart üçün bir taymer; kart çıxanda ləğv olunur.
// • Səsdə: ayə ≥ 1.5 s səslənəndə (playing — cari ayənin nömrəsi və ya 0).
// • Tab gizlidirsə qeyd edilmir. Yazma utils/quranLife-da birləşdirilib gecikdirilir.
// ═══════════════════════════════════════════════════════
import { useEffect } from 'react'
import { recordAyahs } from '../../utils/quranLife'

export const DWELL_MS = 1500

export default function useLifeRecorder(listRef, surah, { active = true, count = 0, playing = 0 } = {}) {
  useEffect(() => {
    const list = listRef.current
    if (!active || !surah || !list || typeof IntersectionObserver === 'undefined') return undefined
    const timers = new Map()
    const stop = (n) => { clearTimeout(timers.get(n)); timers.delete(n) }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const n = Number(e.target.dataset.ayah)
        if (!n) continue
        const rootH = e.rootBounds?.height || window.innerHeight
        const enough = e.isIntersecting && (e.intersectionRatio >= 0.6 || e.intersectionRect.height >= rootH * 0.5)
        if (!enough) { stop(n); continue }
        if (timers.has(n)) continue
        timers.set(n, setTimeout(() => {
          timers.delete(n)
          if (document.visibilityState === 'visible') recordAyahs([{ s: surah, a: n }])
        }, DWELL_MS))
      }
    }, { threshold: [0, 0.25, 0.5, 0.6, 0.8, 1] })
    list.querySelectorAll('[data-ayah]').forEach(el => io.observe(el))
    return () => { io.disconnect(); for (const t of timers.values()) clearTimeout(t); timers.clear() }
  }, [listRef, surah, active, count])

  useEffect(() => {
    if (!surah || !playing) return undefined
    const t = setTimeout(() => recordAyahs([{ s: surah, a: playing }]), DWELL_MS)
    return () => clearTimeout(t)
  }, [surah, playing])
}
