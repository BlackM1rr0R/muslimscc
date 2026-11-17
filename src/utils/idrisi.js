// ═══════════════════════════════════════════════════════
// əl-İdrisinin dünyası — saf məntiq (components/IdrisiWorld.jsx)
//
// • IDRISI_EXTENT — xəritənin əhatəsi: Atlantikdən Çinə, ekvatordan ~64° şimala.
// • CLIMATES — yeddi iqlim (əqalim) enlik zolaqları kimi. Sərhədlər TƏXMİNİDİR:
//   Ptolemeyin klassik iqlim paralelləri (Almagest II.6: Meroe ~16°27′, Siena ~23°51′,
//   Aşağı Misir ~30°22′, Rodos ~36°, Hellespont ~40°56′, Pontun ortası ~45°01′,
//   Borisfen ~48°32′) arasındakı orta xətlər, ərəb astronomlarının yuvarlaq qiymətlərinə
//   yaxın. Əl-İdrisi I iqlimi ekvatordan başladır, VII iqlimin şimalında qalanı da
//   xəritəyə daxil edir — ona görə I zolaq 0°-dən, VII zolaq ~64°-ə qədər çəkilir.
// • Hər iqlim 10 hissəyə bölünür (qərbdən şərqə); burada sxematik — bərabər uzunluq dilimləri.
// ═══════════════════════════════════════════════════════

export const IDRISI_EXTENT = { west: -18, east: 152, south: 0, north: 64 }

/** Yeddi iqlim: [cənub, şimal) enlik sərhədləri (təxmini) və Ptolemey mərkəz paraleli */
export const CLIMATES = [
  { n: 1, south: 0, north: 20.5, centre: 16.45 },
  { n: 2, south: 20.5, north: 27.5, centre: 23.85 },
  { n: 3, south: 27.5, north: 33.6, centre: 30.37 },
  { n: 4, south: 33.6, north: 39, centre: 36 },
  { n: 5, south: 39, north: 43.4, centre: 40.93 },
  { n: 6, south: 43.4, north: 47.2, centre: 45.02 },
  { n: 7, south: 47.2, north: 64, centre: 48.53 },
]

export const SECTIONS = 10

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
export const roman = (n) => ROMAN[n - 1] || ''

/** Enlik hansı iqlimə düşür (1–7); xəritədən kənar → null */
export function climateOf(lat) {
  if (!Number.isFinite(lat) || lat < IDRISI_EXTENT.south || lat > IDRISI_EXTENT.north) return null
  const c = CLIMATES.find(k => lat >= k.south && lat < k.north)
  return c ? c.n : CLIMATES.length
}

/** Uzunluq hansı hissəyə düşür (1–10, qərbdən şərqə; sxematik bərabər dilimlər) */
export function sectionOf(lng) {
  const { west, east } = IDRISI_EXTENT
  if (!Number.isFinite(lng) || lng < west || lng > east) return null
  return Math.min(SECTIONS, Math.floor(((lng - west) / (east - west)) * SECTIONS) + 1)
}

/** Hissə sərhədlərinin uzunluqları (11 xətt, kənarlar daxil) */
export function sectionLines() {
  const { west, east } = IDRISI_EXTENT
  return Array.from({ length: SECTIONS + 1 }, (_, i) => west + ((east - west) * i) / SECTIONS)
}

/** Kitabda adı keçən böyük şəhərlər (koordinatlar müasir) */
export const IDRISI_CITIES = [
  { id: 'palermo', lat: 38.12, lng: 13.36, role: 'work', name: { az: 'Palermo', en: 'Palermo', ru: 'Палермо', ar: 'بلرم', tr: 'Palermo' } }, // lang-ok[Palermo]: şəhər adı
  { id: 'ceuta', lat: 35.89, lng: -5.32, role: 'born', name: { az: 'Səbtə', en: 'Ceuta', ru: 'Сеута', ar: 'سبتة', tr: 'Sebte' } },
  { id: 'cordoba', lat: 37.88, lng: -4.78, role: 'study', name: { az: 'Kordova', en: 'Córdoba', ru: 'Кордова', ar: 'قرطبة', tr: 'Kurtuba' } },
  { id: 'mecca', lat: 21.42, lng: 39.83, name: { az: 'Məkkə', en: 'Mecca', ru: 'Мекка', ar: 'مكة', tr: 'Mekke' } },
  { id: 'jerusalem', lat: 31.78, lng: 35.22, name: { az: 'Qüds', en: 'Jerusalem', ru: 'Иерусалим', ar: 'القدس', tr: 'Kudüs' } },
  { id: 'cairo', lat: 30.04, lng: 31.24, name: { az: 'Qahirə', en: 'Cairo', ru: 'Каир', ar: 'القاهرة', tr: 'Kahire' } },
  { id: 'damascus', lat: 33.51, lng: 36.29, name: { az: 'Dəməşq', en: 'Damascus', ru: 'Дамаск', ar: 'دمشق', tr: 'Şam' } },
  { id: 'baghdad', lat: 33.31, lng: 44.36, name: { az: 'Bağdad', en: 'Baghdad', ru: 'Багдад', ar: 'بغداد', tr: 'Bağdat' } },
  { id: 'constantinople', lat: 41.01, lng: 28.98, name: { az: 'Konstantinopol', en: 'Constantinople', ru: 'Константинополь', ar: 'القسطنطينية', tr: 'Konstantinopolis' } },
  { id: 'samarkand', lat: 39.65, lng: 66.96, name: { az: 'Səmərqənd', en: 'Samarkand', ru: 'Самарканд', ar: 'سمرقند', tr: 'Semerkant' } },
]
