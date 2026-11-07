// ═══════════════════════════════════════════════════════
// Zəif cihaz → avtomatik "hərəkəti azalt" (html.a11y-reduce-motion)
//
// 2026-11-05 ölçüsü (lokal build, Pixel 7 emulyasiyası, sürüşmə FPS, 3 dəfə median):
//   CPU ×2 (müasir telefon):  tam "vau" 32–53 FPS ≈ hərəkəti azalt — problem yoxdur
//   CPU ×4 (zəif/köhnə telefon): tam "vau" 9–22 FPS, hərəkəti azalt 36–40 FPS
// Yükün əsas hissəsi səhifələrin öz CSS animasiyalarındadır (552 yer, 71 fayl —
// hamısı html:not(.a11y-reduce-motion) ilə bağlanır). Ona görə zəif cihazda
// saytın mövcud "hərəkəti azalt" sinfi qoyulur — bütün qatlar onu artıq tanıyır.
//
// Meyar: ≤4 məntiqi nüvə və ya ≤4 GB yaddaş (navigator.deviceMemory) və ya
// "trafikə qənaət" (Save-Data). Toxunma ekranı tək başına meyar DEYİL.
// İstifadəçi tam animasiyanı məcburi istəsə: localStorage 'muslim_cc_motion' = 'full'.
//
// v5.5 (2026-11-08): zəif cihazda HƏR ŞEY söndürülmür. a11y-reduce-motion yalnız
// dekorları bağlayır; menyu, səhifə keçidi, girişlər işləyir (transform/opacity).
// Ölçü: köhnə rejimdə menyu açılışı kadrların 48–58%-ni itirirdi, indi 1–3%.
// Bütün hərəkəti yalnız istifadəçinin öz seçimi söndürür (html.a11y-motion-user).
// ═══════════════════════════════════════════════════════

export const MOTION_KEY = 'muslim_cc_motion'

/** Saf funksiya — test olunur */
export function wantsLite({ cores = 8, memory = 8, saveData = false, override = '' } = {}) {
  if (override === 'full') return false
  if (override === 'lite') return true
  return Boolean(saveData || (cores && cores <= 4) || (memory && memory <= 4))
}

let cached = null
export function isLiteDevice() {
  if (cached !== null) return cached
  try {
    let override = ''
    try { override = localStorage.getItem(MOTION_KEY) || '' } catch { /* */ }
    cached = wantsLite({
      cores: navigator.hardwareConcurrency || 8,
      memory: navigator.deviceMemory || 8,
      saveData: Boolean(navigator.connection && navigator.connection.saveData),
      override,
    })
  } catch { cached = false }
  return cached
}
