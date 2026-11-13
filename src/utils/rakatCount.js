// ═══════════════════════════════════════════════════════
// Rəkət sayğacı (v6.6) — səcdəni kameranın işığından tanıyan detektor (components/prayer/RakatCounter.jsx)
//
// Telefon səccadənin qabağında üzüyuxarı durur; səcdədə baş ön kameranın üstünü kölgələyir —
// kadrın orta parlaqlığı kəskin düşür. Görüntü saxlanmır və heç yerə göndərilmir: hər 100 ms-dən bir
// 32×24 kiçik kadrın orta parlaqlığı (0–255) bu funksiyaya verilir.
//
// Qayda: parlaqlıq "işıq bazası"nın ratio hissəsindən aşağı düşüb ən azı minDark ms qaranlıq
// qalırsa — səcdə başladı; sonra ən azı minLight ms ardıcıl işıq — səcdə bitdi (+1). Baza yalnız
// işıqda, yavaş-yavaş yenilənir (otaqda işıq dəyişsə uyğunlaşır). 2 səcdə = 1 rəkət.
// tests/unit/rakat-count.test.js
// ═══════════════════════════════════════════════════════
export function createSujoodDetector({ ratio = 0.55, minDark = 600, minLight = 700, adapt = 0.03 } = {}) {
  let base = null, inSujood = false, count = 0, darkStart = null, lightStart = null
  return {
    /** Yeni ölçü → { count, dark, changed } (changed — bu ölçüdə səcdə tamamlandı) */
    feed(lum, ms) {
      if (base == null) base = Math.max(lum, 8)
      const dark = lum < base * ratio
      let changed = false
      if (!inSujood) {
        if (dark) { darkStart ??= ms; if (ms - darkStart >= minDark) { inSujood = true; lightStart = null } }
        else { darkStart = null; base += (Math.max(lum, 8) - base) * adapt }
      } else if (dark) lightStart = null
      else {
        lightStart ??= ms
        if (ms - lightStart >= minLight) { inSujood = false; darkStart = null; count++; changed = true }
      }
      return { count, dark: inSujood, changed }
    },
    /** Səhv sayılan səcdəni geri al */
    undo() { if (count > 0) count--; return count },
    get count() { return count },
  }
}

/**
 * Səcdə sayından rəkət vəziyyəti: { done, current, half, phase }
 * done — tamamlanmış rəkət, current — indiki rəkət (1…total), half — bu rəkətdə 1 səcdə edilib,
 * phase: 'end' (namaz bitdi), 'middle' (2-ci rəkətdən sonra orta təşəhhüd, 3–4 rəkətlidə), 'last' (son rəkət), 'stand'.
 */
export function rakatState(sujood, total) {
  const done = Math.min(total, Math.floor(sujood / 2))
  const half = sujood % 2 === 1 && done < total
  const current = Math.min(total, done + 1)
  const phase = done >= total ? 'end' : done === 2 && total > 2 && !half ? 'middle' : current === total ? 'last' : 'stand'
  return { done, current, half, phase }
}
