// ═══════════════════════════════════════════════════════
// Surə "atmosferi" — oxuyucunun arxasında çox zəif hərəkətli fon (components/quran/SurahAtmosphere)
//
// YALNIZ adı təbiət / səma hadisəsi olan surələr. Səhnə adın HƏRFİ mənasını əks etdirir —
// heç bir təfsir və ya dini iddia yoxdur. Canlı varlıq (insan, heyvan, həşərat) yoxdur:
// ən-Nəhl, əl-Fil, əl-Ənkəbut, əl-Bəqərə, ən-Nəml, əl-Ədiyat və s. qəsdən siyahıda deyil.
// Testi: tests/unit/surah-atmosphere.test.js (yalnız bu id-lər, canlı varlıq adı yoxdur).
//
//   scene — səhnənin açarı (styles/QuranAtmos.css → .qa-atmos--<scene>)
//   note  — hansı ad mənasını əks etdirir (rəy üçün; interfeysdə göstərilmir)
// ═══════════════════════════════════════════════════════

export const ATMOS_SCENES = Object.freeze({
  13: { scene: 'rain', note: 'ər-Rəd — "göy gurultusu": uzaqda yağış və zəif şimşək işığı' },
  18: { scene: 'cave', note: 'əl-Kəhf — "mağara": mağaranın ağzından gələn isti işıq' },
  24: { scene: 'light', note: 'ən-Nur — "nur, işıq": yumşaq işıq' },
  44: { scene: 'mist', note: 'əd-Duxan — "tüstü": zəif duman' },
  51: { scene: 'wind', note: 'əz-Zariyat — "sovuran (küləklər)": sürüşən külək xətləri' },
  52: { scene: 'mountain', note: 'ət-Tur — "dağ": dağ siluyeti' },
  53: { scene: 'stars', note: 'ən-Nəcm — "ulduz": ulduzlar və bürc xətləri' },
  54: { scene: 'moon', note: 'əl-Qəmər — "ay": hilal və ay işığı' },
  85: { scene: 'stars', note: 'əl-Buruc — "bürclər": ulduz bürcləri' },
  86: { scene: 'piercing', note: 'ət-Tariq — "gecə gələn" (86:3-də parlaq ulduz kimi adlanır): tək parlaq ulduz' },
  89: { scene: 'dawn', note: 'əl-Fəcr — "dan yeri": üfüq yavaş-yavaş aydınlaşır' },
  91: { scene: 'sun', note: 'əş-Şəms — "günəş": yumşaq günəş şüaları' },
  92: { scene: 'night', note: 'əl-Leyl — "gecə": dərin gecə, sayrışan ulduzlar' },
  93: { scene: 'duha', note: 'əd-Duha — "günortaqabağı" (səhərin işıqlı vaxtı): alçaq günəşin şüaları' },
  97: { scene: 'night', note: 'əl-Qədr — 1-ci ayədəki "Qədr gecəsi": sakit gecə, ulduzlar' },
  113: { scene: 'daybreak', note: 'əl-Fələq — "sübh, dan yerinin yarılması": üfüqdə açılan işıq' },
})

export const ATMOS_SCENE_KEYS = Object.freeze(['rain', 'cave', 'light', 'mist', 'wind', 'mountain', 'stars', 'moon', 'piercing', 'dawn', 'sun', 'night', 'duha', 'daybreak'])

/** Surənin səhnə açarı və ya null */
export function atmosSceneOf(n) {
  return ATMOS_SCENES[Number(n)]?.scene || null
}
