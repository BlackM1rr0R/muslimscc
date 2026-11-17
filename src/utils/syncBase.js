// ═══════════════════════════════════════════════════════
// Sinxronizasiyanın "baza" görüntüsü — 3 tərəfli birləşmə üçün (utils/syncMerge → mergeData)
//
// Hər uğurlu göndərmə / gətirmə / qoşulmadan sonra serverdəki blokun açıq məlumatı
// (collectBackup().data — eyni xəritə) və versiyası BU CİHAZDA saxlanılır. Növbəti 409-da
// (başqa cihaz arada göndərib) yerli və serverdəki dəyərlər bu baza ilə müqayisə olunur:
// hansı tərəf nəyi dəyişib — bilinir, ziddiyyət yalnız hər iki tərəf eyni açarı dəyişəndə olur.
//
// Yer: IndexedDB 'mcc-sync-base' → 'base' (blok ~900 KB-a qədər ola bilər, localStorage
// kvotası dardır). localStorage-də DEYİL → ehtiyat nüsxəyə və sinxronizasiyaya düşmür.
// IndexedDB yoxdursa (köhnə brauzer, gizli rejim) — baza yoxdur, köhnə davranış (ziddiyyət).
// Unutma (unlink / forget) — baza silinir. tag — kodun qısa heşi: başqa koda keçiddə
// köhnə baza istifadə olunmur.
// ═══════════════════════════════════════════════════════

const DB = 'mcc-sync-base'
const STORE = 'base'
const ID = 'current'

/** Kodun qısa heşi (FNV-1a) — kodun özü bazada saxlanılmır */
export function codeTag(code) {
  let h = 0x811c9dc5
  const s = String(code || '')
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  return h.toString(36)
}

function idbBackend() {
  const idb = (() => { try { return globalThis.indexedDB || null } catch { return null } })()
  if (!idb) return null
  let dbp = null
  const open = () => {
    if (!dbp) {
      dbp = new Promise((resolve, reject) => {
        let req
        try { req = idb.open(DB, 1) } catch (e) { reject(e); return }
        req.onupgradeneeded = () => { try { req.result.createObjectStore(STORE) } catch { /* artıq var */ } }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
        req.onblocked = () => reject(new Error('blocked'))
      })
      dbp.catch(() => { dbp = null })
    }
    return dbp
  }
  const tx = (mode, fn) => open().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const st = t.objectStore(STORE)
    const req = fn(st)
    t.oncomplete = () => resolve(req ? req.result : undefined)
    t.onerror = () => reject(t.error)
    t.onabort = () => reject(t.error)
  }))
  return {
    get: () => tx('readonly', (st) => st.get(ID)),
    set: (v) => tx('readwrite', (st) => st.put(v, ID)),
    clear: () => tx('readwrite', (st) => st.delete(ID)),
  }
}

let backend
const be = () => (backend === undefined ? (backend = idbBackend()) : backend)
let pending = Promise.resolve()

/** Bazanı yaz: { tag, version, data } — xəta səssizdir (baza yalnız köməkçidir) */
export function setBase(code, version, data) {
  const b = be()
  if (!b || !data || typeof data !== 'object') return pending
  const rec = { tag: codeTag(code), version: Number(version) || 0, data: { ...data }, at: Date.now() }
  pending = pending.then(() => b.set(rec)).catch(() => {})
  return pending
}

/** Bazanı oxu — yalnız bu kod və bu versiya üçün. → data | null */
export async function getBase(code, version) {
  const b = be()
  if (!b) return null
  await pending
  try {
    const rec = await b.get()
    if (!rec || rec.tag !== codeTag(code) || rec.version !== (Number(version) || 0)) return null
    return rec.data && typeof rec.data === 'object' ? rec.data : null
  } catch { return null }
}

export function clearBase() {
  const b = be()
  if (!b) return pending
  pending = pending.then(() => b.clear()).catch(() => {})
  return pending
}

/** Testlər üçün: yaddaşda saxlayan backend ({ get, set, clear }) və ya null (IndexedDB yoxdur) */
export function _setBaseBackend(b) { backend = b; pending = Promise.resolve() }
export function memoryBaseBackend() {
  let v
  return { get: async () => v, set: async (x) => { v = structuredClone(x) }, clear: async () => { v = undefined } }
}
