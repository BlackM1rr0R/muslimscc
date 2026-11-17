// ═══════════════════════════════════════════════════════
// Avtomatik sinxronizasiya (utils/userSync üzərində) — yalnız istifadəçi açıbsa (sync.auto)
//
// Dövr (saytın açılışında, vərəq yenidən görünəndə, açıq vərəqdə hər 5 dəqiqə, ən azı 60 s ara):
//   • bu cihazda dəyişiklik var (heş fərqlidir) → push()
//       409 (başqa cihaz da dəyişib) → 3 tərəfli birləşmə (mergeOnConflict): serverdəki blok
//         gətirilir, son sinxronlanmış "baza" (utils/syncBase, IndexedDB) ilə açar-açar müqayisə:
//         yalnız bir tərəfin dəyişdiyi açar götürülür, hər ikisinin dəyişdiyi — açarın
//         birləşdiricisi (utils/syncMergers) ilə. Nəticə yazılır və serverin versiyası ilə
//         göndərilir (yenidən 409 — bir dəfə də). → 'merged'.
//         Birləşdiricisiz həqiqi ziddiyyət və ya baza yoxdursa → HEÇ NƏ yazılmır, "ziddiyyət"
//         hadisəsi (detail.keys) — istifadəçi seçir (əvvəlki davranış).
//   • dəyişiklik yoxdur və son yoxlamadan ≥5 dəq keçib → fetchRemote(); server versiyası
//     daha yenidirsə → link() (bu cihaza yazılır) + "yeni məlumat" hadisəsi (səhifəni yeniləmək təklifi)
// Vərəq gizlənəndə (başqa tətbiqə keçid, bağlanma) — yalnız göndərmə: dəyişiklik varsa push().
// Bu cihazın məlumatı səssizcə heç vaxt üzərinə yazılmır: gətirmə yalnız yerli dəyişiklik
// olmayanda baş verir.
// Hadisə: window 'qm-autosync' { detail: { type: 'pushed' | 'pulled' | 'merged' | 'conflict' | 'error' } }
//   merged: { changed } — bu cihaza yazılan (o biri cihazdan gələn) açarların sayı
// ═══════════════════════════════════════════════════════
import { readSync, push, fetchRemote, link, markSynced, dataHash, rebase } from './userSync'
import { getBase } from './syncBase'
import { collectBackup } from './userBackup'

const MIN_GAP = 60 * 1000
const PULL_GAP = 5 * 60 * 1000
let running = false, lastRun = 0, lastPull = 0, timer = 0

const emit = (type, extra = {}) => { try { window.dispatchEvent(new CustomEvent('qm-autosync', { detail: { type, ...extra } })) } catch { /* */ } }

/** Birləşmə ilə dəyişən açarlar — açıq səhifələr (storage hadisəsinə qulaq asanlar) yenidən oxusun */
function announce(keys) {
  for (const key of keys) {
    try { window.dispatchEvent(new StorageEvent('storage', { key, newValue: localStorage.getItem(key) })) } catch { /* köhnə brauzer */ }
  }
}

/**
 * push() 409 verdi: serverdəkini gətir, bazaya görə 3 tərəfli birləşdir, yaz, yenidən göndər.
 * → { status: 'merged', changed } | { status: 'conflict', keys } | { status: 'none' } (baza yoxdur) | { status: 'busy' }
 */
export async function mergeOnConflict(s) {
  let base = await getBase(s.code, s.version)
  if (!base) return { status: 'none' }
  const { mergeData, writeMerged } = await import('./syncMerge')   // tənbəl: birləşdiricilər yalnız lazım olanda
  const changed = new Set()
  for (let attempt = 0; attempt < 2; attempt++) {
    const remote = await fetchRemote(s.code)
    const local = collectBackup().data
    const res = mergeData(local, remote.backup.data, base)
    if (res.conflicts.length) return { status: 'conflict', keys: res.conflicts }
    for (const k of writeMerged(res.data, local)) changed.add(k)
    await rebase(remote)               // yerli məlumat artıq serverdəkinin davamıdır
    const r = await push()
    if (!r.conflict) { announce(changed); return { status: 'merged', changed: changed.size } }
    base = remote.backup.data          // arada yenə göndərilib — yeni baza: indicə birləşdiyimiz blok
  }
  announce(changed)
  return { status: 'busy' }           // başqa cihaz dayanmadan göndərir — növbəti dövrdə yenə (yerli artıq birləşib)
}

/** Bir dövr. Qaytarır: 'pushed' | 'pulled' | 'merged' | 'conflict' | 'idle' | 'off' | 'error' (testlənir) */
export async function autoSyncOnce({ now = Date.now(), force = false, pushOnly = false } = {}) {
  const s = readSync()
  if (!s?.auto) return 'off'
  if (running || (!force && now - lastRun < MIN_GAP)) return 'idle'
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'idle'
  running = true; if (!pushOnly) lastRun = now
  try {
    const dirty = dataHash() !== s.hash
    if (dirty) {
      const r = await push()
      if (r.conflict) {
        const m = await mergeOnConflict(s)
        if (m.status === 'merged') { emit('merged', { changed: m.changed }); return 'merged' }
        if (m.status === 'busy') return 'idle'
        emit('conflict', { keys: m.keys || [] }); return 'conflict'
      }
      emit('pushed'); return 'pushed'
    }
    if (pushOnly) return 'idle'
    if (!force && now - lastPull < PULL_GAP) return 'idle'
    lastPull = now
    const remote = await fetchRemote(s.code)
    if (remote.version > (s.version || 0)) {
      link(remote); markSynced(); emit('pulled'); return 'pulled'
    }
    return 'idle'
  } catch { emit('error'); return 'error' } finally { running = false }
}

export function startAutoSync() {
  if (typeof window === 'undefined' || window.__qmAutoSync) return
  window.__qmAutoSync = true
  const tick = () => {
    if (document.visibilityState === 'visible') autoSyncOnce()
    else autoSyncOnce({ force: true, pushOnly: true })   // gizlənəndə: yalnız dəyişiklik varsa göndər
  }
  setTimeout(tick, 3000) // açılışda — səhifə yüklənəndən sonra
  document.addEventListener('visibilitychange', tick)
  window.addEventListener('online', tick)
  timer = setInterval(tick, PULL_GAP)
}

/** testlər üçün */
export function _resetAutoSync() { running = false; lastRun = 0; lastPull = 0; clearInterval(timer) }
