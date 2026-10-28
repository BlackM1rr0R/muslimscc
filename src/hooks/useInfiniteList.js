// ═══════════════════════════════════════════════════════
// Sonsuz sürüşmə — uzun siyahını partiyalarla böyüdür
//
//   const inf = useInfiniteList({
//     total: filtered.length,       // tam siyahının uzunluğu
//     batch: 24,                    // bir partiyada neçə element
//     resetKey: `${lang}|${cat}|${q}`, // dəyişəndə siyahı əvvəldən başlayır
//     storageKey: 'hadith',         // sessionStorage açarı (mövqe yaddaşı)
//     ready: !loading,              // məlumat gəlibmi (sürüşmə bərpası gözləyir)
//     onReset: () => …,             // filtr dəyişəndə (məs. siyahının əvvəlinə qalx)
//   })
//   filtered.slice(0, inf.count).map(…)
//   <ListMore {...inf} />           // sentinel + skeleton + "Daha çox göstər" + sonluq
//
// Qaytarır: { count, total, hasMore, loadMore, sentinelRef }
//   count       — göstəriləcək element sayı (total-dan çox olmur)
//   sentinelRef — siyahının altındakı elementə ref: IntersectionObserver
//                 ona rootMargin (600px) qədər yaxınlaşanda növbəti partiyanı açır
//   loadMore    — eyni işi düymə ilə görür (klaviatura, IO-suz brauzer)
//
// Mövqe yaddaşı: neçə element açıq idi və sürüşmə mövqeyi sessionStorage-də
// saxlanılır. Bərpa YALNIZ geri/irəli (POP) ilə qayıdanda olur — menyudan
// yenidən açılan səhifə yuxarıdan başlayır. Saxlanan resetKey cari ilə üst-üstə
// düşmürsə (başqa filtr) bərpa edilmir. Filtrlərin özünü saxlamaq üçün
// useSessionState işlət (eyni POP qaydası ilə).
// ═══════════════════════════════════════════════════════

import { useCallback, useEffect, useLayoutEffect, useRef, useState, startTransition } from 'react'
import { useNavigationType } from 'react-router-dom'

const PREFIX = 'qm-list:'

function read(key) {
  try { return JSON.parse(sessionStorage.getItem(PREFIX + key)) || null } catch { return null }
}
function write(key, value) {
  try { sessionStorage.setItem(PREFIX + key, JSON.stringify(value)) } catch { /* yaddaş bağlıdır */ }
}

/** Səhifəyə geri/irəli düyməsi (və ya yeniləmə) ilə gəlinibmi — ilk render-in dəyəri */
function useIsBackNav() {
  const type = useNavigationType()
  const ref = useRef(null)
  if (ref.current === null) ref.current = type === 'POP'
  return ref.current
}

/**
 * useState kimi, amma dəyər sessionStorage-də saxlanılır və geri qayıdanda
 * (POP) bərpa olunur. Filtr, axtarış, kateqoriya üçün.
 *   const [cat, setCat] = useSessionState('hadith:cat', 0)
 */
export function useSessionState(key, initial) {
  const back = useIsBackNav()
  const [value, setValue] = useState(() => {
    if (back) {
      const s = read(`${key}:state`)
      if (s && 'v' in s) return s.v
    }
    return typeof initial === 'function' ? initial() : initial
  })
  useEffect(() => { write(`${key}:state`, { v: value }) }, [key, value])
  return [value, setValue]
}

/** Sürüşməni dərhal (hamar animasiyasız) dəyiş — html-də scroll-behavior: smooth ola bilər */
function jumpTo(y) {
  const root = document.documentElement
  const prev = root.style.scrollBehavior
  root.style.scrollBehavior = 'auto'
  window.scrollTo(0, y)
  root.style.scrollBehavior = prev
}

export default function useInfiniteList({
  total = 0,
  batch = 24,
  resetKey = '',
  storageKey,
  ready = true,
  rootMargin = '600px 0px',
  onReset,
} = {}) {
  const key = String(resetKey)
  const back = useIsBackNav()

  // Saxlanmış vəziyyət — yalnız ilk render-də, yalnız geri qayıdanda və eyni filtrdə
  const savedRef = useRef(undefined)
  if (savedRef.current === undefined) {
    const s = storageKey && back ? read(storageKey) : null
    savedRef.current = s && s.k === key ? s : null
  }

  const [n, setN] = useState(() => Math.max(batch, Number(savedRef.current?.n) || 0))
  // Filtr dəyişəndə say elə HƏMİN render-də sıfırlanır (köhnə sayla bir
  // artıq render olmasın) — React-in "prop dəyişəndə state-i düzəlt" nümunəsi
  const [k, setK] = useState(key)
  if (k !== key) {
    setK(key)
    setN(batch)
  }

  const hasMore = n < total
  const count = Math.min(n, total)

  const loadMore = useCallback(() => {
    startTransition(() => setN(c => c + batch))
  }, [batch])

  // onReset: filtr dəyişəndən sonra (DOM yeniləndikdən sonra) bir dəfə
  const onResetRef = useRef(onReset)
  onResetRef.current = onReset
  const prevKeyRef = useRef(key)
  useEffect(() => {
    if (prevKeyRef.current === key) return
    prevKeyRef.current = key
    onResetRef.current?.()
  }, [key])

  // ── Sentinel: siyahının altı ekrana 600px qalmış növbəti partiya ──
  // Müşahidəçi hər partiyadan sonra yenidən qurulur: sentinel hələ də
  // zonadadırsa (hündür ekran, qısa kartlar) ilk çağırış dərhal gəlir və
  // siyahı ekranı dolduranadək böyüyür.
  const [node, setNode] = useState(null)
  const sentinelRef = useCallback((el) => setNode(el), [])
  useEffect(() => {
    if (!node || !hasMore || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) loadMore()
    }, { rootMargin })
    io.observe(node)
    return () => io.disconnect()
  }, [node, hasMore, n, rootMargin, loadMore])

  // ── Mövqe yaddaşı: say + sürüşmə ──
  const stateRef = useRef({ k: key, n })
  stateRef.current = { k: key, n }
  const restoringRef = useRef(Number(savedRef.current?.y) > 0)
  // Bərpa bitənədək saxlanmış mövqe qalır (tez çıxsaq itməsin)
  const yRef = useRef(restoringRef.current ? Number(savedRef.current.y) : (typeof window !== 'undefined' ? window.scrollY : 0))

  const save = useCallback(() => {
    if (storageKey) write(storageKey, { ...stateRef.current, y: Math.round(yRef.current) })
  }, [storageKey])

  useEffect(() => { save() }, [key, n, save])

  useEffect(() => {
    if (!storageKey) return
    let t = 0
    // Router keçidləri startTransition-dadır: yeni səhifənin chunk-ı yüklənənədək
    // bu səhifə hələ ekranda qalır, App isə artıq scrollTo(0, 0) edib — ünvan
    // dəyişibsə həmin sürüşməni mövqe kimi yazmırıq
    const path = window.location.pathname
    const onScroll = () => {
      if (restoringRef.current || window.location.pathname !== path) return
      yRef.current = window.scrollY
      clearTimeout(t)
      t = setTimeout(save, 150)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(t)
      // Son məlum mövqe (window.scrollY yox): keçid anında App artıq
      // scrollTo(0, 0) edib, onu yazsaq mövqe itərdi
      save()
    }
  }, [storageKey, save])

  // Bərpa: məlumat hazır olanda saxlanmış mövqeyə qayıt. Səhifə hələ qısadırsa
  // (şəkillər, şriftlər) bir neçə kadr təkrar yoxlanılır.
  useLayoutEffect(() => {
    if (!restoringRef.current || !ready) return
    const target = Number(savedRef.current?.y) || 0
    let tries = 0
    let raf = 0
    const attempt = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      jumpTo(Math.min(target, Math.max(0, max)))
      if (max >= target - 2 || ++tries > 40) {
        restoringRef.current = false
        yRef.current = window.scrollY
        return
      }
      raf = requestAnimationFrame(attempt)
    }
    attempt()
    // StrictMode effekti iki dəfə işlədir — bayrağı burada sıfırlamırıq
    return () => cancelAnimationFrame(raf)
  }, [ready])

  return { count, total, hasMore, loadMore, sentinelRef }
}
