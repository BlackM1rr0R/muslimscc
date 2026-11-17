// ═══════════════════════════════════════════════════════
// Profillərin idarəsi: aç, əlavə et, düzəlt, sil, keç, bağla (React-sız). Saxlama modeli və
// ehtiyat nüsxə / sinxronizasiya qaydaları — utils/profileCore.js (hamısı buradan da ixrac olunur).
// tests/unit/profiles.test.js
// ═══════════════════════════════════════════════════════
import {
  REGISTRY_KEY, ACTIVE_KEY, EVENT, MAX_PROFILES, NS, PROFILE_KEYS, nsKey, readRegistry, activeId, workingOwner,
  flushActive, hydrateActive, cleanProfile, safeStorage,
} from './profileCore'

export * from './profileCore'

function writeRegistry(reg, storage) {
  storage.setItem(REGISTRY_KEY, JSON.stringify({ v: 1, list: reg.list }))
}

function emit(detail) { try { window.dispatchEvent(new CustomEvent(EVENT, { detail })) } catch { /* SSR */ } }
function newId(list) {
  const abc = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id
  do {
    const b = new Uint8Array(6)
    globalThis.crypto.getRandomValues(b)
    id = 'p' + [...b].map((x) => abc[x % 36]).join('')
  } while (list.some((p) => p.id === id))
  return id
}

/**
 * Profilləri aç: mövcud məlumat birinci profilə ("main") çevrilir (heç nə köçmür — iş nüsxəsi
 * onun nüsxəsidir), ikinci profil (istəyə bağlı) boş başlayır. → reyestr
 */
export function enableProfiles(first, second = null, storage = safeStorage()) {
  const cur = readRegistry(storage)
  if (cur) return cur
  const a = cleanProfile({ ...first, id: newId([]) })
  if (!a) throw new Error('bad_name')
  const list = [a]
  if (second) {
    const b = cleanProfile({ ...second, id: newId(list) })
    if (!b) throw new Error('bad_name')
    list.push(b)
  }
  writeRegistry({ list }, storage)
  storage.setItem(ACTIVE_KEY, a.id)
  if (!flushActive(storage)) throw new Error('storage')
  emit({ type: 'enable' })
  return readRegistry(storage)
}

export function addProfile(p, storage = safeStorage()) {
  const reg = readRegistry(storage)
  if (!reg) throw new Error('off')
  if (reg.list.length >= MAX_PROFILES) throw new Error('too_many')
  const c = cleanProfile({ ...p, id: newId(reg.list) })
  if (!c) throw new Error('bad_name')
  writeRegistry({ list: [...reg.list, c] }, storage)
  emit({ type: 'add', id: c.id })
  return c
}

export function updateProfile(id, patch, storage = safeStorage()) {
  const reg = readRegistry(storage)
  const p = reg?.list.find((x) => x.id === id)
  if (!p) throw new Error('not_found')
  const c = cleanProfile({ ...p, ...patch, id })
  if (!c) throw new Error('bad_name')
  writeRegistry({ list: reg.list.map((x) => (x.id === id ? c : x)) }, storage)
  emit({ type: 'update', id })
  return c
}

/** Profilin bütün ad sahəsi açarları */
export function profileKeys(id, storage = safeStorage()) {
  const pre = `${NS}${id}:`
  const out = []
  for (let i = 0; i < storage.length; i++) { const k = storage.key(i); if (k && k.startsWith(pre)) out.push(k) }
  return out
}

/** Aktiv olmayan profili sil (məlumatı ilə birlikdə). Sonuncu profil silinmir (profilləri bağla). */
export function removeProfile(id, storage = safeStorage()) {
  const reg = readRegistry(storage)
  if (!reg || !reg.list.some((p) => p.id === id)) throw new Error('not_found')
  if (activeId(storage) === id) throw new Error('active')
  for (const k of profileKeys(id, storage)) storage.removeItem(k)
  writeRegistry({ list: reg.list.filter((p) => p.id !== id) }, storage)
  emit({ type: 'remove', id })
}

/** Profilə keç: flush (alınmasa — ləğv), aktiv id, hydrate. → true | false */
export function switchProfile(id, storage = safeStorage()) {
  const reg = readRegistry(storage)
  if (!reg || !reg.list.some((p) => p.id === id)) return false
  if (activeId(storage) === id && workingOwner(storage) === 'ok') return true
  if (!flushActive(storage)) return false
  try { storage.setItem(ACTIVE_KEY, id) } catch { return false }
  hydrateActive(storage)
  emit({ type: 'switch', id })
  return true
}

/** Yalnız bir profil qalanda: profilləri bağla — iş nüsxəsi adi məlumat kimi qalır */
export function disableProfiles(storage = safeStorage()) {
  const reg = readRegistry(storage)
  if (!reg) return true
  if (reg.list.length > 1) throw new Error('many')
  if (!flushActive(storage)) return false
  for (const k of profileKeys(reg.list[0].id, storage)) storage.removeItem(k)
  storage.removeItem(REGISTRY_KEY)
  storage.removeItem(ACTIVE_KEY)
  emit({ type: 'disable' })
  return true
}

/** Profilin qısa xülasəsi (seçici kartı üçün): neçə şəxsi açar doludur */
export function profileFilled(id, storage = safeStorage()) {
  return PROFILE_KEYS.filter((k) => storage.getItem(nsKey(id, k)) != null).length
}
