// ═══════════════════════════════════════════════════════
// Şəxsi ana səhifə (H1) — bölmələrin və "Bu gün" panelinin kartlarının sırası / görünməsi.
// Saf məntiq + localStorage (React-sız). Açar profilə aiddir (utils/profileCore → PROFILE_KEYS),
// hesabla sinxronlanır (utils/syncMergers → home_layout_v1).
//
//   home_layout_v1 = { v: 1, s: { o: [id…], h: [id…] }, c: { o: [id…], h: [id…] } }
//     s — ana səhifənin bölmələri (HOME_SECTIONS), c — "Bu gün" panelinin kartları (TODAY_CELLS)
//     o — sıra (yalnız tanınan id-lər), h — gizlədilənlər
//
// Yeni bölmə əlavə olunanda köhnə yadda saxlanmış sıra pozulmur: tanınmayan id atılır,
// sırada olmayan yeni id ÖZ susmaya görə yerinə (əvvəlki qonşusundan sonra) əlavə olunur.
// Prerender-də (və yaddaş boşdursa) susmaya görə sıra — main.jsx createRoot işlədir (hidrasiya
// yoxdur), ona görə sıra ilk render-də sinxron oxunur: "yanıb-sönmə" və sıçrayış olmur.
// tests/unit/home-layout.test.js
// ═══════════════════════════════════════════════════════

export const LAYOUT_KEY = 'home_layout_v1'
export const LAYOUT_EVENT = 'mcc-homelayout'

// Hero-dan aşağıdakı bölmələr (admin məzmunu və CTA həmişə sonda — sabit)
export const HOME_SECTIONS = ['stories', 'today', 'myday', 'wird', 'quick', 'daystory', 'start', 'feats', 'tawheed', 'names']
// "Bu gün" panelinin kartları
export const TODAY_CELLS = ['hadith', 'ayah', 'cont', 'date']

const uniq = (a) => [...new Set(a)]
const known = (list, all) => uniq((Array.isArray(list) ? list : []).filter((x) => typeof x === 'string' && all.includes(x)))

/** Saxlanmış sıra + susmaya görə sıra → tam sıra (yeni id-lər öz yerinə) */
export function applyOrder(saved, defaults) {
  const out = known(saved, defaults)
  if (!out.length) return [...defaults]
  defaults.forEach((id, i) => {
    if (out.includes(id)) return
    // susmaya görə sırada özündən əvvəlki ən yaxın, sırada olan qonşudan sonra
    let at = 0
    for (let j = i - 1; j >= 0; j--) {
      const k = out.indexOf(defaults[j])
      if (k >= 0) { at = k + 1; break }
    }
    out.splice(at, 0, id)
  })
  return out
}

function cleanPart(p, defaults) {
  const o = applyOrder(p?.o, defaults)
  const h = known(p?.h, defaults)
  return { o, h }
}

/** Xam dəyər (sətir / obyekt) → təmiz layout (həmişə tam) */
export function sanitizeLayout(raw) {
  let o = raw
  if (typeof raw === 'string') { try { o = JSON.parse(raw) } catch { o = null } }
  if (!o || typeof o !== 'object' || Array.isArray(o)) o = {}
  return { v: 1, s: cleanPart(o.s, HOME_SECTIONS), c: cleanPart(o.c, TODAY_CELLS) }
}

export const defaultLayout = () => sanitizeLayout(null)

/** Layout susmaya görə ilə eynidirmi (yazmağa ehtiyac yoxdur) */
export function isDefault(layout) {
  const l = sanitizeLayout(layout)
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i])
  return same(l.s.o, HOME_SECTIONS) && !l.s.h.length && same(l.c.o, TODAY_CELLS) && !l.c.h.length
}

/** Görünən id-lər, sıra ilə */
export const visibleIds = (part) => part.o.filter((id) => !part.h.includes(id))

/** part ('s' | 'c') daxilində id-ni bir addım yuxarı (-1) / aşağı (+1) */
export function moveItem(layout, part, id, dir) {
  const l = sanitizeLayout(layout)
  const o = [...l[part].o]
  const i = o.indexOf(id)
  const j = i + (dir < 0 ? -1 : 1)
  if (i < 0 || j < 0 || j >= o.length) return l
  ;[o[i], o[j]] = [o[j], o[i]]
  return { ...l, [part]: { ...l[part], o } }
}

/** Sürüşdürüb buraxmaq: id-ni `to` indeksinə qoy */
export function moveTo(layout, part, id, to) {
  const l = sanitizeLayout(layout)
  const o = l[part].o.filter((x) => x !== id)
  if (o.length === l[part].o.length) return l
  o.splice(Math.max(0, Math.min(o.length, to)), 0, id)
  return { ...l, [part]: { ...l[part], o } }
}

export function setHidden(layout, part, id, hidden) {
  const l = sanitizeLayout(layout)
  const h = l[part].h.filter((x) => x !== id)
  if (hidden) h.push(id)
  return sanitizeLayout({ ...l, [part]: { ...l[part], h } })
}

const ls = () => { try { return globalThis.localStorage } catch { return null } }

export function readLayout(storage = ls()) {
  try { return sanitizeLayout(storage?.getItem(LAYOUT_KEY)) } catch { return defaultLayout() }
}

/** Yaz (susmaya görə ilə eynidirsə — açar silinir); hadisə göndərilir */
export function saveLayout(layout, storage = ls()) {
  const l = sanitizeLayout(layout)
  try {
    if (isDefault(l)) storage?.removeItem(LAYOUT_KEY)
    else storage?.setItem(LAYOUT_KEY, JSON.stringify(l))
  } catch { /* yaddaş bağlıdır — yalnız bu səhifədə qalır */ }
  try { window.dispatchEvent(new CustomEvent(LAYOUT_EVENT)) } catch { /* SSR */ }
  return l
}

/**
 * Sinxronizasiya birləşdiricisi (utils/syncMergers): hissə (s, c) üzrə 3 tərəfli —
 * yalnız bir cihaz dəyişibsə onunku; hər ikisi fərqli dəyişibsə — bu cihazınkı (tərcihdir, ziddiyyət deyil).
 */
export function mergeLayout(L, R, B) {
  const l = sanitizeLayout(L), r = sanitizeLayout(R), b = B === undefined ? null : sanitizeLayout(B)
  const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y)
  const pick = (k) => (eq(l[k], r[k]) ? l[k] : b && eq(l[k], b[k]) ? r[k] : l[k])
  return { v: 1, s: pick('s'), c: pick('c') }
}
