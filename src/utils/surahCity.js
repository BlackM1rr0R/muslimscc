// Surələr şəhəri (components/quran/SurahCity3D.jsx) — binaların məlumatı (saf; tests/unit/v63-data.test.js)
import { SURAH_TABLE } from '../data/mushafIndex'
import { REVELATION_ORDER, REVELATION_PLACE } from '../data/surahRevelation'

/** 114 surə: { n, ayahs, order (nazil olma sırası), madani } */
export function surahCityData() {
  return SURAH_TABLE.map((row, i) => ({ n: i + 1, ayahs: row[2], order: REVELATION_ORDER[i], madani: REVELATION_PLACE[i] === 1 }))
}
