// server/instagram-ramadan-data.js-in mənbəyi: saytın "Ramazana hazırlıq yolu" (/road-to-ramadan) hesabı və mətnləri.
// src/ modulları uzantısız import işlədir (Vite) — node birbaşa aça bilmir, ona görə scripts/build-instagram-data.mjs
// bunu esbuild ilə yaddaşda yığır. tests/unit/server-instagram-ramadan.test.js eyni modulları vitest ilə birbaşa açıb
// yaradılmış faylın mənbə ilə eyni qaldığını yoxlayır.
export { ramadanRange } from '../../src/utils/ramadanRange.js'
export { roadPlan, ROAD_DAYS, STEP_KINDS } from '../../src/utils/ramadanPrep.js'
export { T, STEP_TEXT } from '../../src/components/ramadanPrep/prepText.js'
export { RAMADAN_GUIDE } from '../../src/data/ramadanGuide.js'
export { HIJRI_MONTHS, HIJRI_SUFFIX, formatGregorian, parseGKey } from '../../src/utils/hijri.js'
