// ═══════════════════════════════════════════════════════
// Məzhəb seçimi (J1) — namaz vaxtlarında əsrin kölgə əmsalı
//
// Açar: muslim_cc_madhab = 'hanafi' | 'shafii' | 'maliki' | 'hanbali' (yoxdursa — "seçilməyib").
// Hesab səviyyəsindədir (PROFILE_KEYS-də DEYİL): ehtiyat nüsxəyə və hesabın şifrəli
// sinxronizasiyasına düşür (utils/userBackup — qadağan siyahısında yoxdur; birləşdirici — syncMergers).
//
// Təsiri YALNIZ əsr vaxtınadır (bu hesab qaydası namaz vaxtı hesablayıcılarında ümumidir):
//   Hənəfi — kölgə = günorta kölgəsi + 2 boy (aladhan: school=1);
//   Şafii, Maliki, Hənbəli və "seçilməyib" — + 1 boy (saytın əvvəlki davranışı, aladhan: school=0).
// Hökm uydurulmur: başqa fiqh məzmunu bu seçimlə dəyişmir (yalnız saytda məzhəbə görə işarələnmiş
// məlumat olsa, o göstərilir — hazırda yalnız "Əsrin kölgəsi" izahı, components/prayer/AsrShadow).
// tests/unit/madhab.test.js
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'

export const MADHAB_KEY = 'muslim_cc_madhab'
export const MADHAB_EVENT = 'mcc-madhab'
export const MADHABS = ['hanafi', 'shafii', 'maliki', 'hanbali']

/** Etibarlı dəyər və ya '' (seçilməyib) */
export const normMadhab = (v) => (MADHABS.includes(v) ? v : '')

/** Əsrin kölgə əmsalı: Hənəfi — 2, qalanları (və seçilməyib) — 1 */
export const asrFactorOf = (m) => (normMadhab(m) === 'hanafi' ? 2 : 1)

let mem = null   // yaddaş bağlı olanda (gizli rejim) seçim bu açılışda qalsın

export function readMadhab(storage) {
  try {
    const s = storage || globalThis.localStorage
    const v = s?.getItem(MADHAB_KEY)
    if (s) return normMadhab(v)
  } catch { /* yaddaş bağlıdır */ }
  return mem == null ? '' : mem
}

/** Cari əsr əmsalı (bütün namaz vaxtı hesablarının susmaya görə dəyəri) */
export const currentAsrFactor = () => asrFactorOf(readMadhab())

/** Yerin əsr əmsalı: loc.asr (1 | 2) və ya — yoxdursa — cari məzhəb seçimi */
export function asrOfLoc(loc) {
  const a = Number(loc?.asr)
  return a === 1 || a === 2 ? a : currentAsrFactor()
}

/** Seçimi yaz ('' — sil), abunəçilərə xəbər ver, push abunəliyini yenilə (server azanı eyni əmsalla) */
export function writeMadhab(m, storage) {
  const v = normMadhab(m)
  mem = v
  try {
    const s = storage || globalThis.localStorage
    if (v) s?.setItem(MADHAB_KEY, v); else s?.removeItem(MADHAB_KEY)
  } catch { /* yaddaş bağlıdır */ }
  try { globalThis.dispatchEvent?.(new Event(MADHAB_EVENT)) } catch { /* SSR */ }
  try {
    const ls = globalThis.localStorage
    if (ls?.getItem('muslim_cc_push_endpoint') || ls?.getItem('muslim_cc_fcm_token')) {
      import('../api/push').then((p) => p.updateTokenLocation?.()).catch(() => {})
    }
  } catch { /* */ }
  return v
}

/** Seçim dəyişəndə cb() (başqa tab da daxil) */
export function subscribeMadhab(cb) {
  if (typeof window === 'undefined') return () => {}
  const onStorage = (e) => { if (!e.key || e.key === MADHAB_KEY) cb() }
  window.addEventListener(MADHAB_EVENT, cb)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(MADHAB_EVENT, cb)
    window.removeEventListener('storage', onStorage)
  }
}

/** React: [madhab, setMadhab] */
export function useMadhab() {
  const [m, setM] = useState(() => (typeof window === 'undefined' ? '' : readMadhab()))
  useEffect(() => subscribeMadhab(() => setM(readMadhab())), [])
  return [m, (v) => setM(writeMadhab(v))]
}
