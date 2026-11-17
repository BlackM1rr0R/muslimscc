// ═══════════════════════════════════════════════════════
// Hesaba bağlı, uçdan-uca şifrəli avtomatik sinxronizasiya (TƏNBƏL modul)
//
// Mövcud hesabsız sinxronizasiyanın ÜSTÜNDƏDİR (utils/userSync, server/sync.js) — ikinci
// sistem yoxdur. Kök sirr — bərpa kodu; blok əvvəlki kimi şifrələnir. Hesab yalnız kodun
// şifrəli "qabını" saxlayır (utils/syncWrap, server/syncKeys.js):
//   • şifrə ilə girişdə — kod şifrədən (PBKDF2) alınan açarla açılır → cihaz avtomatik qoşulur
//   • passkey PRF varsa — passkey ilə girişdə də avtomatik
//   • Google / PRF-siz passkey — yeni cihazda bir dəfə bərpa kodu soruşulur
// Server heç vaxt nə şifrəni, nə PRF çıxışını, nə kodu, nə də məlumatı görür.
//
// Bu cihazdakı vəziyyət: localStorage "mcc_acct_sync" = { uid, status, at, pendingCode?, … }
//   status: 'linked'      — bu cihaz hesabın blokuna qoşulub (muslim_cc_sync.acct = uid)
//           'needCode'    — hesabda sinxronizasiya var, amma bu cihazda açmaq üçün kod lazımdır
//           'choose'      — bu cihaz da, hesab da məlumatlıdır və fərqlər var → istifadəçi seçir
//           'offerLink'   — bu cihazda hesabsız sinxronizasiya var, hesabda yox → "hesaba bağla"
//           'offerEnable' — heç yerdə sinxronizasiya yoxdur (şifrəsiz hesab) → "aç" + kodu göstər
// Açar ehtiyat nüsxəyə düşmür (utils/userBackup → EXCLUDE_KEYS). Hadisə: window 'mcc-acctsync'.
// Şifrə yaddaşda YALNIZ açar törədilənə qədər qalır; törədilmiş açar (CryptoKey, çıxarıla
// bilməz) səhifə açıq olduqca yaddaşdadır — yenidən şifrə soruşmamaq üçün.
// ═══════════════════════════════════════════════════════
import { authFetch, AuthError, safeStorage } from '../api/userSession'
import { readSync, enable, fetchRemote, push, adoptCode, setAccount, setAuto, unlink } from './userSync'
import { setBase } from './syncBase'
import { deriveKeys, normalizeCode } from './syncCrypto'
import { collectBackup, isBackupKey } from './userBackup'
import { passwordKey, newPasswordSalt, prfKey, newPrfSalt, wrapCode, unwrapCode } from './syncWrap'
import { planMerge, applyMerge } from './syncMerge'

export const STATE_KEY = 'mcc_acct_sync'
export const EVENT = 'mcc-acctsync'
const RECHECK_MS = 6 * 3600 * 1000

// ── Yaddaş (səhifə açıq olduqca) ──
const mem = { pw: null, prf: null, running: null, login: null }   // pw: { uid, salt, key }  prf: { uid, credId, bytes }

export function readState(storage = safeStorage()) {
  try { const v = JSON.parse(storage?.getItem(STATE_KEY) || 'null'); return v && typeof v === 'object' ? v : null } catch { return null }
}
function writeState(v) {
  try { safeStorage()?.setItem(STATE_KEY, JSON.stringify({ ...v, at: Date.now() })) } catch { /* yaddaş bağlıdır */ }
  emit(v.status, v)
}
export function clearState() { try { safeStorage()?.removeItem(STATE_KEY) } catch { /* */ } }
function emit(status, detail = {}) {
  try { window.dispatchEvent(new CustomEvent(EVENT, { detail: { ...detail, status } })) } catch { /* SSR */ }
}

// ── Server ──
export const getSyncKeys = () => authFetch('/api/auth/sync-keys').then((r) => ({
  keys: Array.isArray(r?.keys) ? r.keys : [], syncId: typeof r?.syncId === 'string' ? r.syncId : null,
}))
const putKey = (body) => authFetch('/api/auth/sync-keys', { method: 'PUT', body })
const deleteKey = (kind, credId) => authFetch(`/api/auth/sync-keys/${kind}${credId ? '/' + encodeURIComponent(credId) : ''}`, { method: 'DELETE' })
const putLink = (syncId) => authFetch('/api/auth/sync-link', { method: 'PUT', body: { syncId } })

const syncIdOf = async (code) => (await deriveKeys(code)).id

// ── Açarlar ──
/** Şifrə ilə açar: hesabdakı qabın duzu ilə (varsa), yoxsa yeni duz. Şifrə burada "istifadə olunub atılır". */
async function primePassword(uid, password, keys) {
  if (!password) return
  const w = keys.find((k) => k.kind === 'password')
  const salt = w ? w.salt : newPasswordSalt()
  try { mem.pw = { uid, salt, key: await passwordKey(password, salt) } } catch { mem.pw = null }
}
export const hasPasswordKey = (uid) => Boolean(mem.pw && mem.pw.uid === uid)
export const hasPrf = (uid) => Boolean(mem.prf && mem.prf.uid === uid)

/** Hesabdakı qablarla kodu açmağa çalış. → { code, via } | null */
async function tryUnwrap(uid, keys) {
  const pw = keys.find((k) => k.kind === 'password')
  if (pw && mem.pw?.uid === uid && mem.pw.salt === pw.salt) {
    try { return { code: await unwrapCode(mem.pw.key, pw.wrapped, 'password'), via: 'password' } } catch { /* köhnə şifrə ilə qab */ }
  }
  if (mem.prf?.uid === uid) {
    const w = keys.find((k) => k.kind === 'prf' && k.credId === mem.prf.credId)
    if (w) {
      try { return { code: await unwrapCode(await prfKey(mem.prf.bytes, w.salt), w.wrapped, 'prf'), via: 'prf' } } catch { /* */ }
    }
  }
  return null
}

/** Kodun qablarını yenilə: şifrə açarı (varsa) və PRF (varsa); hesabın bloku bu koda bağlansın. */
async function secure(uid, code, { syncId = null, via = '' } = {}) {
  const id = await syncIdOf(code)
  const jobs = []
  if (syncId !== id) jobs.push(putLink(id))
  if (mem.pw?.uid === uid && via !== 'password') {
    jobs.push(wrapCode(mem.pw.key, code, 'password').then((wrapped) => putKey({ kind: 'password', salt: mem.pw.salt, wrapped })))
  }
  if (mem.prf?.uid === uid && via !== 'prf') {
    const salt = newPrfSalt()
    jobs.push(prfKey(mem.prf.bytes, salt).then((k) => wrapCode(k, code, 'prf')).then((wrapped) => putKey({ kind: 'prf', credId: mem.prf.credId, salt, wrapped })))
  }
  // Qab yazılmasa da sinxronizasiya işləyir (növbəti girişdə yenidən cəhd olunur)
  await Promise.allSettled(jobs)
}

function markLinked(uid) {
  setAccount(uid)
  setAuto(true)
  writeState({ uid, status: 'linked' })
}

/**
 * Hesabın kodu ilə bu cihazı qoş. prefer: undefined → ziddiyyət varsa 'choose' vəziyyəti;
 * 'remote' | 'local' — istifadəçinin seçimi. → status
 */
async function adopt(uid, code, prefer, fetched) {
  let remote = fetched || null
  if (!remote) {
    try { remote = await fetchRemote(code) } catch (e) { if (e?.message !== 'not_found') throw e }
  }
  if (!remote) {
    // Blok yoxdur (silinib / 400 gün toxunulmayıb) — bu cihazın məlumatı ilə yenidən yarat
    adoptCode(code, 0, { acct: uid })
    await push().catch(() => {})
    markLinked(uid)
    return 'linked'
  }
  const plan = planMerge(collectBackup().data, remote.backup.data)
  if (plan.conflicts.length && !prefer) {
    writeState({ uid, status: 'choose', pendingCode: code, conflicts: plan.conflicts.length, remoteCount: remote.backup.count, updatedAt: remote.updatedAt || null })
    return 'choose'
  }
  // Birləşdiricisi olan açarlar (Quran mozaikası, qeydlər, sevimlilər, sayğaclar…) ziddiyyət sayılmır
  const { written, needsPush } = applyMerge(remote.backup, prefer || 'remote')
  adoptCode(code, remote.version, { acct: uid })
  // Baza — hesabdakı blok (bu cihazın məlumatı onun davamıdır); göndərmə uğurlu olsa — göndərilən
  await setBase(code, remote.version, remote.backup.data)
  if (needsPush) await push().catch(() => {})
  markLinked(uid)
  emit('restored', { uid, count: written })
  return 'linked'
}

/**
 * Bu cihazın hesabla vəziyyətini qur. Girişdən sonra (afterLogin, force) və saytın açılışında
 * (AutoSyncToast, 6 saatda bir) çağırılır. Çağırışlar ardıcıl işləyir; giriş axını gedirkən
 * adi (force-suz) çağırış onun nəticəsini gözləyir (şifrə açarı hazır olmadan qərar verilməsin).
 * user: /me cavabı ({ id, hasPassword, … }). → status
 */
export function reconcile(user, { force = false, keys } = {}) {
  if (!user?.id) return Promise.resolve('off')
  if (!force && mem.login) return mem.login
  if (!force && mem.running) return mem.running
  const prev = mem.running || Promise.resolve()
  const run = prev.catch(() => {}).then(() => doReconcile(user, force, keys))
  mem.running = run
  run.finally(() => { if (mem.running === run) mem.running = null }).catch(() => {})
  return run
}

async function doReconcile(user, force, given) {
  const uid = user.id
  const s = readSync()
  const st = readState()
  if (!force && s?.acct === uid && st?.uid === uid && st.status === 'linked') return 'linked'
  if (!force && st?.uid === uid && st.status !== 'linked' && Date.now() - (st.at || 0) < RECHECK_MS) { emit(st.status, st); return st.status }
  const { keys, syncId } = given || await getSyncKeys()

  const opened = await tryUnwrap(uid, keys)
  if (opened) {
    await secure(uid, opened.code, { syncId, via: opened.via })
    if (s && s.code === opened.code) { markLinked(uid); return 'linked' }
    return adopt(uid, opened.code)
  }
  if (syncId || keys.length) {
    // Hesabda sinxronizasiya var. Bu cihaz artıq həmin kodu saxlayırsa (məs. şifrə bərpasından
    // sonra) — qoşulur və şifrə açarı varsa qab yenilənir
    if (s && syncId && (await syncIdOf(s.code)) === syncId) {
      await secure(uid, s.code, { syncId })
      markLinked(uid)
      return 'linked'
    }
    writeState({ uid, status: 'needCode' })
    return 'needCode'
  }
  // Hesabda sinxronizasiya yoxdur
  if (s) { writeState({ uid, status: 'offerLink' }); return 'offerLink' }
  if (hasPasswordKey(uid)) {
    // Şifrəli hesab: avtomatik aç — kod şifrə ilə qorunur (hesab səhifəsində göstərilir)
    const { code } = await enable()
    await secure(uid, code, { syncId })
    markLinked(uid)
    emit('enabled', { uid })
    return 'linked'
  }
  writeState({ uid, status: 'offerEnable' })
  return 'offerEnable'
}

/**
 * Girişdən / qeydiyyatdan DƏRHAL sonra (LoginPage). password — formadakı açıq şifrə (yalnız
 * açar törətmək üçün), prf — passkey PRF çıxışı { credId, bytes }. Gözlənilmir (səhifə keçidi
 * davam edir); nəticə hadisə ilə gəlir.
 */
export function afterLogin(user, { password, prf } = {}) {
  if (!user?.id) return Promise.resolve('off')
  const job = (async () => {
    try {
      if (prf?.bytes) mem.prf = { uid: user.id, credId: prf.credId, bytes: new Uint8Array(prf.bytes) }
      const got = await getSyncKeys()
      if (password && user.hasPassword) await primePassword(user.id, password, got.keys)
      return await reconcile(user, { force: true, keys: got })
    } catch (e) {
      emit('error', { code: e?.message || 'error' })
      return 'error'
    }
  })()
  mem.login = job
  job.finally(() => { if (mem.login === job) mem.login = null })
  return job
}

/** "Bərpa kodunu daxil edin" (needCode) və ya başqa kodla qoşulma. → status; xəta: bad_code | not_found | decrypt */
export async function enterCode(user, input) {
  const code = normalizeCode(input)
  if (!code) throw new Error('bad_code')
  const remote = await fetchRemote(code)           // kod düzgündür və blok var (xəta atır)
  const { syncId } = await getSyncKeys()
  await secure(user.id, code, { syncId })
  return adopt(user.id, code, undefined, remote)
}

/** 'choose' vəziyyətində istifadəçinin seçimi: 'remote' (hesabdakı) | 'local' (bu cihazdakı) */
export async function resolveChoice(user, prefer) {
  const st = readState()
  if (!st?.pendingCode || st.uid !== user.id) throw new Error('no_pending')
  return adopt(user.id, st.pendingCode, prefer === 'local' ? 'local' : 'remote')
}

/** Şifrəni yenidən soruşub açar törət (səhifə yenilənəndən sonra yaddaşda yoxdursa). */
export async function unlockWithPassword(user, password) {
  // Server şifrəni yoxlayır: səhv yazılmış şifrə ilə qab yaradılmasın (sonra açılmazdı)
  await authFetch('/api/auth/sync-keys/check-password', { method: 'POST', body: { password } })
  const { keys, syncId } = await getSyncKeys()
  await primePassword(user.id, password, keys)
  return { keys, syncId }
}

/** "Mövcud sinxronizasiyamı hesaba bağla" — bu cihazın kodu qablanır, İKİNCİ blok yaradılmır. */
export async function linkExisting(user, { password } = {}) {
  const s = readSync()
  if (!s) throw new Error('not_linked')
  const got = password ? await unlockWithPassword(user, password) : await getSyncKeys()
  await secure(user.id, s.code, got)
  markLinked(user.id)
  return 'linked'
}

/** Sinxronizasiyanı aç (offerEnable) → { code } — kod istifadəçiyə GÖSTƏRİLMƏLİDİR. */
export async function enableForAccount(user, { password } = {}) {
  const got = password ? await unlockWithPassword(user, password) : await getSyncKeys()
  if (got.syncId) throw new Error('exists')
  const { code } = await enable()
  await secure(user.id, code, got)
  markLinked(user.id)
  return { code }
}

/** Passkey PRF çıxışı ilə qab əlavə et (bu passkey ilə girişdə kod avtomatik açılır). */
export async function addPrfWrap(user, { credId, bytes }) {
  const s = readSync()
  if (!s || s.acct !== user.id || !bytes) throw new Error('not_linked')
  const salt = newPrfSalt()
  const wrapped = await wrapCode(await prfKey(new Uint8Array(bytes), salt), s.code, 'prf')
  await putKey({ kind: 'prf', credId, salt, wrapped })
  mem.prf = { uid: user.id, credId, bytes: new Uint8Array(bytes) }
}

/**
 * Şifrə dəyişəndən SONRA (AccountPage): kodu yeni şifrə ilə yenidən qabla. Kod bu cihazda
 * yoxdursa köhnə qab cari şifrə ilə açılır; heç biri alınmırsa köhnə (artıq açılmayan) qab silinir.
 */
export async function rewrapAfterPasswordChange(user, { current, next }) {
  const { keys } = await getSyncKeys()
  const s = readSync()
  let code = s && s.acct === user.id ? s.code : null
  const w = keys.find((k) => k.kind === 'password')
  if (!code && w && current) {
    try { code = await unwrapCode(await passwordKey(current, w.salt), w.wrapped, 'password') } catch { /* */ }
  }
  if (!code) { if (w) await deleteKey('password').catch(() => {}); mem.pw = null; return false }
  const salt = newPasswordSalt()
  const key = await passwordKey(next, salt)
  await putKey({ kind: 'password', salt, wrapped: await wrapCode(key, code, 'password') })
  mem.pw = { uid: user.id, salt, key }
  return true
}

/** Hesabın qabları haqqında qısa məlumat (hesab səhifəsi): { password, prf: [credId], syncId } */
export async function protectionInfo() {
  const { keys, syncId } = await getSyncKeys()
  return { password: keys.some((k) => k.kind === 'password'), prf: keys.filter((k) => k.kind === 'prf').map((k) => k.credId), syncId }
}

/**
 * Çıxışda "bu cihazda saxla?" → "sil": kod unudulur (hesabdakı blok qalır); wipe — sinxronlanan
 * bütün məlumat da bu cihazdan silinir (geri qaytarılmır — hesabda qalır).
 */
export function forgetOnThisDevice({ wipe = false } = {}) {
  unlink()
  clearState()
  if (!wipe) return 0
  const st = safeStorage()
  if (!st) return 0
  const keys = []
  for (let i = 0; i < st.length; i++) { const k = st.key(i); if (isBackupKey(k)) keys.push(k) }
  for (const k of keys) { try { st.removeItem(k) } catch { /* */ } }
  return keys.length
}

/** Səhv → UI açarı */
export function syncErrorKey(e) {
  const m = e?.message
  if (['bad_code', 'not_found', 'decrypt', 'too_big', 'conflict', 'exists', 'not_linked'].includes(m)) return m
  if (e instanceof AuthError) {
    if (e.code === 'wrong_password') return 'wrong_password'
    return e.status === 429 ? 'many' : (e.status === 401 ? 'session' : 'network')
  }
  return 'network'
}

/** Testlər üçün */
export function _resetAccountSync() { mem.pw = null; mem.prf = null; mem.running = null; mem.login = null }
