// ═══════════════════════════════════════════════════════
// Alimlərin yerləri (v6.1) — components/ScholarRoutes.jsx ("Elm yolları", /scholars)
//
// Açar — data/scholars*.js → birthplace.en / city.en mətni (kartdakı yazı ilə eyni).
// Koordinat [enlik, uzunluq] — şəhərin məşhur yeri; kənd/bölgə üçün təxmini (approx).
// Yer KARTDA yazılmayıbsa (məs. İbn Sirinin doğulduğu yer) xəritədə çəkilmir.
// tests/unit/scholar-places.test.js — hər kartdakı yerin burada koordinatı var.
// ═══════════════════════════════════════════════════════
export const PLACE_AT = {
  'Medina': [24.47, 39.61],
  'Madinah': [24.47, 39.61],
  'Medina and Riyadh': [24.47, 39.61],
  'Basra': [30.51, 47.81],
  'Kufa': [32.03, 44.4],
  'Gaza': [31.5, 34.47],
  'Egypt (Fustat)': [30.01, 31.23],
  'Egypt': [30.04, 31.24],
  'Old Cairo (Fustat)': [30.01, 31.23],
  'Cairo': [30.04, 31.24],
  'Baghdad': [33.31, 44.36],
  'Bukhara': [39.77, 64.42],
  'Sijistan': [30.96, 61.86, 1],
  'Nishapur': [36.21, 58.8],
  'Qazvin': [36.27, 50.0],
  'Tirmidh': [37.22, 67.28],
  'Nasa (Khurasan)': [37.99, 58.21, 1],
  'Amol (Tabaristan)': [36.47, 52.35],
  'Nawa (Hauran)': [32.89, 36.04],
  'Harran': [36.87, 39.03],
  'Kafr Batna (Damascus)': [33.51, 36.37],
  'Damascus': [33.51, 36.29],
  'Mijdal village (Busra region)': [32.52, 36.48, 1],
  'al-Uyaynah (Najd)': [24.91, 46.39],
  'Diriyah': [24.74, 46.57],
  'Unayzah (al-Qasim)': [26.08, 43.99],
  'Shinqit region (Mauritania)': [20.46, -12.36, 1],
  'Riyadh': [24.71, 46.68],
  'Unayzah': [26.08, 43.99],
  'Dammaj': [16.89, 43.82, 1],
  'Shkodër (Albania)': [42.07, 19.51],
  'Dammaj (Sa‘dah, Yemen)': [16.89, 43.82, 1],
  'Al-Zulfi': [26.3, 44.8],
  'Al-Shimasiyah (Qassim)': [26.31, 44.26, 1],
  'Al-Duwadimi (Najd)': [24.51, 44.39],
}
// "Medina and Riyadh" kimi iki şəhər — ikincisi də göstərilsin
export const PLACE_ALSO = { 'Medina and Riyadh': [24.71, 46.68] }
