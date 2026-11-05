// ═══════════════════════════════════════════════════════
// Avtomatik sinxronizasiya (utils/userSync üzərində) — yalnız istifadəçi açıbsa (sync.auto)
//
// Dövr (saytın açılışında, vərəq yenidən görünəndə, açıq vərəqdə hər 5 dəqiqə, ən azı 60 s ara):
//   • bu cihazda dəyişiklik var (heş fərqlidir) → push()
//       409 (başqa cihaz da dəyişib) → HEÇ NƏ yazılmır, "ziddiyyət" hadisəsi — istifadəçi seçir
//   • dəyişiklik yoxdur və son yoxlamadan ≥5 dəq keçib → fetchRemote(); server versiyası
//     daha yenidirsə → link() (bu cihaza yazılır) + "yeni məlumat" hadisəsi (səhifəni yeniləmək təklifi)
// Bu cihazın məlumatı səssizcə heç vaxt üzərinə yazılmır: gətirmə yalnız yerli dəyişiklik
// olmayanda baş verir.
// Hadisə: window 'qm-autosync' { detail: { type: 'pushed' | 'pulled' | 'conflict' | 'error' } }
// ═══════════════════════════════════════════════════════
import { readSync, push, fetchRemote, link, markSynced, dataHash } from './userSync'

const MIN_GAP = 60 * 1000
const PULL_GAP = 5 * 60 * 1000
let running = false, lastRun = 0, lastPull = 0, timer = 0

const emit = (type) => { try { window.dispatchEvent(new CustomEvent('qm-autosync', { detail: { type } })) } catch { /* */ } }

/** Bir dövr. Qaytarır: 'pushed' | 'pulled' | 'conflict' | 'idle' | 'off' | 'error' (testlənir) */
export async function autoSyncOnce({ now = Date.now(), force = false } = {}) {
  const s = readSync()
  if (!s?.auto) return 'off'
  if (running || (!force && now - lastRun < MIN_GAP)) return 'idle'
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'idle'
  running = true; lastRun = now
  try {
    const dirty = dataHash() !== s.hash
    if (dirty) {
      const r = await push()
      if (r.conflict) { emit('conflict'); return 'conflict' }
      markSynced(); emit('pushed'); return 'pushed'
    }
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
  const tick = () => { if (document.visibilityState === 'visible') autoSyncOnce() }
  setTimeout(tick, 3000) // açılışda — səhifə yüklənəndən sonra
  document.addEventListener('visibilitychange', tick)
  window.addEventListener('online', tick)
  timer = setInterval(tick, PULL_GAP)
}

/** testlər üçün */
export function _resetAutoSync() { running = false; lastRun = 0; lastPull = 0; clearInterval(timer) }
