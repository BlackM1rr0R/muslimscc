// ═══════════════════════════════════════════════════════
// Bir hesabda bir neçə profil ("Ana", "Ali (uşaq)") — saf məntiq + localStorage (React-sız)
//
// Saytın irəliləyiş məlumatı localStorage-dadır (hesabla uçdan-uca şifrəli sinxronlanır).
// Profil = AÇIQ siyahıdakı "şəxsi" açarların (PROFILE_KEYS: hifz, Quran həyatı, namaz izləyicisi,
// zikr, uşaq kitabları …) ayrıca dəsti. Cihaz/ümumi açarlar (dil, mövzu, şəhər, sinxronizasiya
// kodu, tərcihlər) bütün profillər üçün ortaqdır.
//
// Saxlama modeli (profillər açıqdırsa — reyestr "mcc_profiles" var):
//   • HƏR profilin həqiqi nüsxəsi: "mcc_profile:<id>:<açar>" (aktiv profil də daxil);
//   • adi açarlar (məs. "hifz_srs") — AKTİV profilin İŞ NÜSXƏSİDİR (səhifələr onu oxuyur/yazır);
//   • flushActive(): iş nüsxəsi → aktiv profilin ad sahəsi (dəyişiklik və silinmə də);
//   • hydrateActive(): aktiv profilin ad sahəsi → iş nüsxəsi.
// Keçid: flush → aktiv id → hydrate → səhifə yenilənir. flush alınmasa (yaddaş dolub) keçid
// LƏĞV olunur — heç nə itmir.
//
// Sinxronizasiya / ehtiyat nüsxə (utils/userBackup, utils/syncMerge): profillər açıq olanda
// collectBackup əvvəlcə flush edir və İŞ NÜSXƏSİNİ göndərmir — yalnız ad sahələri + reyestr gedir.
// Beləcə iki cihazda fərqli aktiv profil olsa belə məlumat qarışmır. Gələn məlumat yazılandan
// sonra hydrateActive() aktiv profilin iş nüsxəsini yeniləyir. Aktiv profilin id-si cihaza
// aiddir ("mcc_profile_active" — ehtiyat nüsxəyə düşmür).
// Bu fayl — ƏSAS hissə (ehtiyat nüsxə / sinxronizasiya üçün; əsas paketdədir). İdarəetmə (aç, əlavə et,
// keç, sil) — utils/profiles.js (yalnız hesab səhifəsi / menyu — tənbəl chunk-lar).
// tests/unit/profiles.test.js
// ═══════════════════════════════════════════════════════

export const REGISTRY_KEY = 'mcc_profiles'
export const ACTIVE_KEY = 'mcc_profile_active'
export const NS = 'mcc_profile:'
export const EVENT = 'mcc-profile'
export const MAX_PROFILES = 6
export const MAX_NAME = 24

// Profilə aid (şəxsi irəliləyiş) açarlar — AÇIQ siyahı. Yeni şəxsi bölmə əlavə olunanda bura da yazılmalıdır.
export const PROFILE_KEYS = [
  // Quran, hifz
  'quran_life_v1', 'quran_stats', 'quran_bookmark', 'quran_saved_ayahs', 'quran_notes_v1', 'quran_khatm_plan',
  'quran_khatm_certs_v1', 'mushaf_last_page', 'kahf_fridays_v1', 'hifz_progress', 'hifz_srs', 'hifz_tests_v1',
  'world_khatm_v1',
  // Namaz, oruc
  'muslim_cc_prayer_status', 'muslim_cc_prayer_stats', 'daily_tracker', 'muslim_cc_qada', 'jumuah_v1',
  'muslim_cc_ramadan_fasts_v1', 'muslim_cc_sunnah_fasts_v1', 'muslim_cc_ramadan_khatm_v1',
  'ramadan_album_v1', 'muslim_cc_iftar_log_v1',
  // Zikr, dua
  'dhikr_count_total', 'dhikr_daily_v1', 'dhikr_free_v1', 'dhikr_session', 'dhikr_palms_v1', 'adhkar_done_v1',
  'dua_journal', 'dua_garden_v1', 'muslim_cc_muhasabah_v1',
  // Ziyarətlər
  'mosque_visits_v1',
  // Uşaqlar və öyrənmə
  'kids_manners', 'muslim_cc_storybooks', 'muslim_cc_kids_card_name', 'muslim_cc_letter_catch_best', 'muslim_cc_memory_best',
  'names_match_best', 'muslim_cc_ayah_race_best', 'quiz_scores', 'qm_badges_v1', 'learn_progress_v1', 'learn_path_v1',
  'arabic_course_v1', 'nawawi40_learned_v1', 'hadith_srs_v1', 'names99_practice_v1',
]
const SCOPED = new Set(PROFILE_KEYS)
export const isProfileScoped = (k) => SCOPED.has(k)

// Avatarlar — yalnız həndəsi fiqurlar və hərflər (canlı varlıq təsviri YOXDUR)
export const AVATARS = ['letter', 'star8', 'crescent', 'hexagon', 'diamond', 'arch', 'circle', 'drop']
export const COLORS = ['emerald', 'teal', 'sky', 'indigo', 'violet', 'rose', 'amber', 'slate']

export const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }
const ID_RE = /^p[a-z0-9]{6}$/
export const nsKey = (id, key) => `${NS}${id}:${key}`

function cleanName(v) {
  return typeof v === 'string' ? [...v.normalize('NFC').replace(/[\p{Cc}‎‏‪-‮⁦-⁩]/gu, '').replace(/\s+/g, ' ').trim()].slice(0, MAX_NAME).join('') : ''
}
export function cleanProfile(p) {
  if (!p || typeof p !== 'object' || !ID_RE.test(p.id)) return null
  const name = cleanName(p.name)
  if (!name) return null
  return { id: p.id, name, avatar: AVATARS.includes(p.avatar) ? p.avatar : 'letter', color: COLORS.includes(p.color) ? p.color : 'emerald', kid: p.kid === true }
}

/** Reyestr dəyəri (sətir) → { v, list } | null — saf, sinxron məlumat xəritələri üçün də */
export function parseRegistry(raw) {
  let o
  try { o = typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return null }
  if (!o || typeof o !== 'object' || !Array.isArray(o.list)) return null
  const seen = new Set()
  const list = []
  for (const p of o.list) {
    const c = cleanProfile(p)
    if (c && !seen.has(c.id) && list.length < MAX_PROFILES) { seen.add(c.id); list.push(c) }
  }
  return list.length ? { v: 1, list } : null
}
/** Məlumat xəritəsində (collectBackup().data) profillər açıqdırmı */
export const dataHasProfiles = (data) => Boolean(data && typeof data[REGISTRY_KEY] === 'string' && parseRegistry(data[REGISTRY_KEY]))

export function readRegistry(storage = safeStorage()) {
  try { return parseRegistry(storage?.getItem(REGISTRY_KEY)) } catch { return null }
}
export const profilesOn = (storage = safeStorage()) => Boolean(readRegistry(storage))


/** Bu cihazda aktiv profilin id-si (yoxdursa / silinibsə — birinci) | null */
export function activeId(storage = safeStorage()) {
  const reg = readRegistry(storage)
  if (!reg) return null
  let a = null
  try { a = storage.getItem(ACTIVE_KEY) } catch { /* */ }
  return reg.list.some((p) => p.id === a) ? a : reg.list[0].id
}
export function activeProfile(storage = safeStorage()) {
  const reg = readRegistry(storage)
  if (!reg) return null
  const id = activeId(storage)
  return reg.list.find((p) => p.id === id) || null
}

/**
 * İş nüsxəsinin sahibi: 'ok' — aktiv profil (ACTIVE_KEY reyestrdədir); 'fresh' — bu cihaz reyestri
 * sinxronizasiya ilə indicə alıb (ACTIVE_KEY yoxdur): iş nüsxəsi bu cihazın əvvəlki məlumatıdır;
 * 'orphan' — aktiv profil başqa cihazda silinib: iş nüsxəsi silinmiş profilindir. null — profillər bağlı.
 */
export function workingOwner(storage = safeStorage()) {
  const reg = readRegistry(storage)
  if (!reg) return null
  let a = null
  try { a = storage.getItem(ACTIVE_KEY) } catch { /* */ }
  if (!a) return 'fresh'
  return reg.list.some((p) => p.id === a) ? 'ok' : 'orphan'
}

/**
 * İş nüsxəsi → aktiv profilin ad sahəsi. → true (uğurlu) | false (yaddaş xətası)
 * 'fresh': yalnız birinci profildə OLMAYAN açarlar köçür (bu cihazın məlumatı itməsin, hesabdakı
 * da əzilməsin); 'orphan': heç nə yazılmır (silinmiş profilin məlumatı başqasına qarışmasın).
 */
export function flushActive(storage = safeStorage()) {
  const owner = workingOwner(storage)
  if (!owner || owner === 'orphan') return true
  const id = activeId(storage)
  try {
    for (const k of PROFILE_KEYS) {
      const v = storage.getItem(k)
      const nk = nsKey(id, k)
      const cur = storage.getItem(nk)
      if (owner === 'fresh') { if (v != null && cur == null) storage.setItem(nk, v); continue }
      if (v == null) { if (cur != null) storage.removeItem(nk) } else if (cur !== v) storage.setItem(nk, v)
    }
    return true
  } catch { return false }
}

/** Aktiv profilin ad sahəsi → iş nüsxəsi (dəyişən açarlar qaytarılır). 'fresh'/'orphan' → birinci profil aktiv olur. */
export function hydrateActive(storage = safeStorage()) {
  const owner = workingOwner(storage)
  const changed = []
  if (!owner) return changed
  if (owner !== 'ok') {
    if (owner === 'fresh' && !flushActive(storage)) return changed
    try { storage.setItem(ACTIVE_KEY, readRegistry(storage).list[0].id) } catch { return changed }
  }
  const id = activeId(storage)
  try {
    for (const k of PROFILE_KEYS) {
      const v = storage.getItem(nsKey(id, k))
      const cur = storage.getItem(k)
      if (v == null) { if (cur != null) { storage.removeItem(k); changed.push(k) } } else if (cur !== v) { storage.setItem(k, v); changed.push(k) }
    }
  } catch { /* yaddaş dolub — qalanı əvvəlki kimi */ }
  return changed
}

