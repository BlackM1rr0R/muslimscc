// ═══════════════════════════════════════════════════════
// Sinxronizasiyada birləşmə — heç bir məlumat səssizcə itmir
//
// mergeData(local, remote, base) — 3 tərəfli, açar-açar (collectBackup().data xəritələri):
//   • local == remote          → dəyişməz
//   • local == base            → serverdəki (yalnız o biri cihaz dəyişib; silinmə də daxil)
//   • remote == base           → yerli (yalnız bu cihaz dəyişib; silinmə də daxil)
//   • bir tərəfdə silinib, digərində dəyişib → dəyişən qalır
//   • hər iki tərəf fərqli dəyişib → açarın birləşdiricisi (utils/syncMergers) varsa — birləşir,
//     cihaz tərcihi (dil, mövzu) — prefs seçimi, qalan hallarda — ZİDDİYYƏT (istifadəçi seçir)
//   base = null (baza yoxdur: yeni cihaz) — hər açar "bazada yox" sayılır: bir tərəfdə olan
//   saxlanılır, hər ikisində fərqli olan — birləşdirici və ya ziddiyyət.
//
// İki yolda işlənir: avtomatik sinxronizasiyanın 409-u (utils/autoSync — baza IndexedDB-dən,
// utils/syncBase) və hesabla yeni cihazın qoşulması (utils/accountSync → planMerge/applyMerge).
// tests/unit/sync-merge.test.js
// ═══════════════════════════════════════════════════════
import { collectBackup, restoreBackup, isBackupKey } from './userBackup'
import { runMerger, hasMerger, CONFLICT, PREFERENCE_KEYS } from './syncMergers'

export const CONFLICT_IGNORE = PREFERENCE_KEYS

/**
 * → { data, conflicts: [açar], merged: [açar] } — data: birləşmiş xəritə (ziddiyyətli açarlarda
 * yerli dəyər); merged: birləşdirici ilə birləşən açarlar. prefs: 'local' | 'remote' — cihaz tərcihləri.
 */
export function mergeData(local = {}, remote = {}, base = null, { prefs = 'local' } = {}) {
  const B = base || {}
  const data = {}, conflicts = [], merged = []
  for (const k of new Set([...Object.keys(local), ...Object.keys(remote), ...Object.keys(B)])) {
    if (!isBackupKey(k)) continue   // cihaza aid açarlara toxunulmur
    const l = local[k], r = remote[k], b = B[k]
    let v
    if (l === r) v = l
    else if (l === b) v = r
    else if (r === b) v = l
    else if (l === undefined || r === undefined) v = l === undefined ? r : l
    else if (hasMerger(k)) {
      const m = runMerger(k, l, r, base ? b : undefined)
      if (m === CONFLICT) { conflicts.push(k); v = l } else { v = m; merged.push(k) }
    } else if (PREFERENCE_KEYS.has(k)) v = prefs === 'remote' ? r : l
    else { conflicts.push(k); v = l }
    if (v !== undefined) data[k] = v
  }
  return { data, conflicts, merged }
}

/** Yeni cihaz (baza yoxdur): { conflicts, localOnly, remoteOnly, merged, data } — saf funksiya */
export function planMerge(localData = {}, remoteData = {}) {
  const { data, conflicts, merged } = mergeData(localData, remoteData, null, { prefs: 'remote' })
  const localOnly = Object.keys(localData).filter((k) => !(k in remoteData))
  const remoteOnly = Object.keys(remoteData).filter((k) => !(k in localData))
  return { conflicts, localOnly, remoteOnly, merged, data }
}

/**
 * Birləşmiş xəritəni yaddaşa yaz — yalnız fərqli açarlar (yazılır / silinir). Cihaz açarlarına
 * toxunulmur. → dəyişən açarların siyahısı
 */
export function writeMerged(data, current = collectBackup().data, storage = globalThis.localStorage) {
  const changed = []
  for (const k of new Set([...Object.keys(current), ...Object.keys(data)])) {
    if (!isBackupKey(k) || current[k] === data[k]) continue
    try {
      if (data[k] === undefined) storage.removeItem(k)
      else storage.setItem(k, data[k])
      changed.push(k)
    } catch { /* yaddaş dolub — qalanını davam et */ }
  }
  return changed
}

/**
 * Hesabdakı məlumatı bu cihaza yaz. Birləşdiricisi olan açarlar birləşir; qalan ziddiyyətlərdə
 * prefer: 'remote' — hesabdakı, 'local' — bu cihazdakı qalib gəlir. Yalnız yerli olan açarlara toxunulmur.
 * Qaytarır: { written, needsPush, data } — needsPush: nəticə hesabdakından fərqlidir (göndərilməlidir);
 * data — yazılan nəticə (göndərilən blokun bazası üçün).
 */
export function applyMerge(remoteBackup, prefer = 'remote', storage = globalThis.localStorage) {
  const local = collectBackup(storage).data   // yalnız sinxronlanan açarlar (keş və cihaz açarları yox)
  const plan = planMerge(local, remoteBackup.data)
  const written = restoreBackup(remoteBackup, storage)
  const result = { ...remoteBackup.data }
  for (const k of plan.merged) result[k] = plan.data[k]
  if (prefer === 'local') for (const k of plan.conflicts) result[k] = local[k]
  for (const k of plan.localOnly) result[k] = local[k]
  for (const [k, v] of Object.entries(result)) {
    if (v === remoteBackup.data[k] || !isBackupKey(k)) continue
    try { if (v === undefined) storage.removeItem(k); else storage.setItem(k, v) } catch { /* yaddaş dolub */ }
  }
  const needsPush = Object.keys(result).some((k) => result[k] !== remoteBackup.data[k])
  return { written, needsPush, data: result }
}
