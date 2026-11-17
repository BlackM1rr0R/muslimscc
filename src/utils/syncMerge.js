// ═══════════════════════════════════════════════════════
// Hesabla yeni cihazda birləşmə (utils/accountSync) — heç bir məlumat səssizcə itmir
//
// Yerli məlumat (bu cihaz) ilə hesabdakı (şifrəli blokdan açılmış) məlumat açar-açar
// müqayisə olunur:
//   • yalnız bir tərəfdə olan açarlar — hər ikisi saxlanır (birləşmə)
//   • hər iki tərəfdə FƏRQLİ dəyərlə olan açarlar — "ziddiyyət": istifadəçi seçir
//     (hesabdakı və ya bu cihazdakı qalib gəlsin). Ziddiyyət yoxdursa — avtomatik.
// Dil və mövzu kimi cihaz tərcihləri ziddiyyət sayılmır (hesabdakı yazılır).
// ═══════════════════════════════════════════════════════
import { collectBackup, restoreBackup } from './userBackup'

export const CONFLICT_IGNORE = new Set(['muslim_cc_lang', 'muslim_cc_theme'])

/** { conflicts: [açar], localOnly: [açar], remoteOnly: [açar] } — saf funksiya */
export function planMerge(localData = {}, remoteData = {}) {
  const conflicts = [], localOnly = [], remoteOnly = []
  for (const [k, v] of Object.entries(localData)) {
    if (!(k in remoteData)) localOnly.push(k)
    else if (remoteData[k] !== v && !CONFLICT_IGNORE.has(k)) conflicts.push(k)
  }
  for (const k of Object.keys(remoteData)) if (!(k in localData)) remoteOnly.push(k)
  return { conflicts, localOnly, remoteOnly }
}

/**
 * Hesabdakı məlumatı bu cihaza yaz. prefer: 'remote' — ziddiyyətli açarlarda hesabdakı,
 * 'local' — bu cihazdakı qalib gəlir. Yalnız yerli olan açarlara toxunulmur.
 * Qaytarır: { written, needsPush } — needsPush: birləşmə hesabdakından fərqlidir (göndərilməlidir).
 */
export function applyMerge(remoteBackup, prefer = 'remote', storage = globalThis.localStorage) {
  const local = collectBackup(storage).data   // yalnız sinxronlanan açarlar (keş və cihaz açarları yox)
  const plan = planMerge(local, remoteBackup.data)
  const keep = prefer === 'local' ? plan.conflicts.map((k) => [k, local[k]]) : []
  const written = restoreBackup(remoteBackup, storage)
  for (const [k, v] of keep) { try { storage.setItem(k, v) } catch { /* yaddaş dolub */ } }
  return { written, needsPush: keep.length > 0 || plan.localOnly.length > 0 }
}
