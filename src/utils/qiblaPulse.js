// ═══════════════════════════════════════════════════════
// Qiblə "nəbzi" (/qibla) — telefon qibləyə yaxınlaşdıqca titrəmə tezləşir,
// düz qibləyə (±5°) tutanda yumşaq zəng. Ekrana baxmadan istiqamət tapmaq üçün.
// ═══════════════════════════════════════════════════════

/** Sapma bucağı (0…180°) → iki titrəmə arası (ms); 90°-dən uzaqda — null (sakit) */
export function pulseInterval(off) {
  if (!Number.isFinite(off) || off > 90) return null
  if (off <= 5) return 0                       // tuşlanıb — zəng
  const t = (off - 5) / 85                     // 0 (yaxın) … 1 (uzaq)
  return Math.round(220 + t * t * 1180)        // 220 … 1400 ms, yaxında sürətlə tezləşir
}

/** Yumşaq zəng (Web Audio, fayl yoxdur) */
export function chime(ctx) {
  if (!ctx) return
  const now = ctx.currentTime
  for (const [f, d, g] of [[880, 0, 0.18], [1320, 0.12, 0.1]]) {
    const o = ctx.createOscillator(), v = ctx.createGain()
    o.type = 'sine'; o.frequency.value = f
    v.gain.setValueAtTime(0, now + d)
    v.gain.linearRampToValueAtTime(g, now + d + 0.02)
    v.gain.exponentialRampToValueAtTime(0.0001, now + d + 1.2)
    o.connect(v).connect(ctx.destination)
    o.start(now + d); o.stop(now + d + 1.3)
  }
}
