// ═══════════════════════════════════════════════════════
// "Günün xatırlatmaları" hovuzlarının yükləyicisi — YALNIZ cari dil
//
// Hovuzlar build zamanı hər dil üçün ayrıca modul kimi qurulur
// (vite.config.js → "virtual:daily-pools/<dil>", qayda: utils/dailyPools.js).
// PERFORMANS (2026-11-25): əvvəl bir modulda 4 dilin tərcüməsi birlikdə idi
// (~38 KB gzip, ana səhifənin ilk ekranında); indi cari dil ~15–17 KB, ar ~8 KB.
//
// İstifadə:
//   preloadDailyPools(lang)  — yükləməni başlat (HomePage zolağın chunk-ı ilə paralel)
//   readDailyPools(lang)     — render-də: hazırdırsa hovuzlar; yoxsa yükləmə vədi
//                              ATILIR — ən yaxın <Suspense> yer tutucunu göstərir
//                              (React.lazy ilə eyni mexanizm). Dil dəyişəndə də belə.
// Chunk yüklənməsə: boş hovuzlar (zolaq yalnız zikri göstərir) — səhifə çökmür.
// ═══════════════════════════════════════════════════════

// Statik sətirlər — Vite hər dil üçün ayrıca chunk yaradır ("daily-pools-<dil>")
const LOADERS = {
  az: () => import('virtual:daily-pools/az'),
  en: () => import('virtual:daily-pools/en'),
  ru: () => import('virtual:daily-pools/ru'),
  tr: () => import('virtual:daily-pools/tr'),
  ar: () => import('virtual:daily-pools/ar'),
}

const EMPTY = Object.freeze({ AYAH_POOL: [], HADITH_POOL: [], DUA_POOL: [] })
const ready = new Map()   // dil → hovuzlar
const pending = new Map() // dil → Promise

// Əlavə dillərin interfeysi "en"-dir (LangContext → uiLang)
const keyOf = (lang) => (Object.prototype.hasOwnProperty.call(LOADERS, lang) ? lang : 'en')

/** Cari dilin hovuzları (Promise; xəta olmur — uğursuz yükləmədə boş hovuzlar). */
export function preloadDailyPools(lang) {
  const k = keyOf(lang)
  if (ready.has(k)) return Promise.resolve(ready.get(k))
  if (!pending.has(k)) {
    pending.set(k, LOADERS[k]()
      .then((m) => ({ AYAH_POOL: m.AYAH_POOL || [], HADITH_POOL: m.HADITH_POOL || [], DUA_POOL: m.DUA_POOL || [] }))
      .catch(() => EMPTY)
      .then((p) => { ready.set(k, p); pending.delete(k); return p }))
  }
  return pending.get(k)
}

/** Render üçün (Suspense): hazır hovuzlar, ya da yükləmə vədi atılır. */
export function readDailyPools(lang) {
  const p = ready.get(keyOf(lang))
  if (p) return p
  throw preloadDailyPools(lang)
}
