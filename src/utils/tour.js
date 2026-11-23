// ═══════════════════════════════════════════════════════
// "Kəşf et" turu — ortaq köməkçilər (kiçik; əsas paketdə)
//
// • openTour() — turu istənilən yerdən açır ("qm-tour-open" hadisəsi; TourHost dinləyir).
// • Turun vəziyyəti: localStorage "qm_tour_v1" = { offered, done, dismissed } — yalnız bu
//   cihazda, heç yerə göndərilmir (analitika/izləmə YOXDUR).
// • suggestFeatures(get) — turun sonunda 3 təklif, yalnız yerli siqnallarla (açarın olub-olmaması):
//   Quran heç açılmayıb → Quran; şəhər seçilib, yatma/oyanış ardıcıllığı yoxdur → onlar; …
// ═══════════════════════════════════════════════════════

export const TOUR_KEY = 'qm_tour_v1'
export const TOUR_EVENT = 'qm-tour-open'

/** Turu aç (düymələr: PageHelp, SideNav, /whats-new, TourButton) */
export function openTour() {
  try { window.dispatchEvent(new CustomEvent(TOUR_EVENT)) } catch { /* köhnə brauzer */ }
}

export function readTourState() {
  try {
    const v = JSON.parse(window.localStorage.getItem(TOUR_KEY) || 'null')
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

export function writeTourState(patch) {
  const next = { ...readTourState(), ...patch }
  try { window.localStorage.setItem(TOUR_KEY, JSON.stringify(next)) } catch { /* yaddaş bağlıdır */ }
  return next
}

/** localStorage oxuyucu (təhlükəsiz) — suggestFeatures üçün */
export function storageGetter() {
  return (key) => {
    try { return window.localStorage.getItem(key) } catch { return null }
  }
}

const QURAN_KEYS = ['quran_stats', 'quran_bookmark', 'quran_life_v1', 'mushaf_last_page']
const CITY_KEYS = ['muslim_cc_selected_city', 'muslim_cc_custom_city']
// Siqnal olmayanda — hamıya faydalı ehtiyat təkliflər
const FALLBACK = ['whatsnew', 'hisn', 'newmuslim', 'prayer', 'quran']

/**
 * Turun sonunda 3 bölmə təklifi (marşrut açarları). Saf funksiya: get(key) → sətir | null.
 * Sıra: Quran → (şəhər varsa) yatma/oyanış, (yoxdursa) namaz vaxtları → zikr → hesab → ehtiyat.
 */
export function suggestFeatures(get, max = 3) {
  const has = (k) => {
    const v = get(k)
    return v != null && v !== '' && v !== 'null' && v !== '{}' && v !== '[]'
  }
  const out = []
  const add = (k) => { if (out.length < max && !out.includes(k)) out.push(k) }
  if (!QURAN_KEYS.some(has)) add('quran')
  if (CITY_KEYS.some(has)) {
    if (!has('sleep_routine_v1')) { add('bedtime'); add('waking') }
  } else {
    add('prayer')
  }
  if (!has('dhikr_count_total')) add('dhikr')
  if (get('mcc_logged_in') !== '1') add('login')
  for (const k of FALLBACK) add(k)
  return out
}
