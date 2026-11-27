// ═══════════════════════════════════════════════════════
// Oxuyucuda "Fon atmosferi" seçimi (data/surahAtmosphere → components/quran/SurahAtmosphere)
// Cihaz səviyyəsində görünüş seçimidir (şrift ölçüsü kimi) — profil/sinxron açarı DEYİL.
// Susmaya görə AÇIQ; yalnız "0" söndürülmüş sayılır. Prerender ilə eyni ilk render üçün
// komponent bunu mount-dan SONRA oxuyur (QuranPage).
// ═══════════════════════════════════════════════════════

export const ATMOS_KEY = 'quran_atmos'

const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }

/** Atmosfer açıqdırmı (yaddaş bağlıdırsa — açıq) */
export function readAtmosOn() {
  try { return safeStorage()?.getItem(ATMOS_KEY) !== '0' } catch { return true }
}

/** Seçimi yadda saxla (yaddaş bağlıdırsa səssizcə keçir) */
export function writeAtmosOn(on) {
  try { safeStorage()?.setItem(ATMOS_KEY, on ? '1' : '0') } catch { /* yaddaş bağlıdır */ }
}
