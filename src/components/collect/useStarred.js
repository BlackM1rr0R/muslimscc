import { useCallback, useEffect, useState } from 'react'

/* ══════════════════════════════════════════════════════════════════
   useStarred — "Seçilmişlər" (sevimlilər) siyahısı, localStorage-də.
   İşlədənlər (dizayn v3.2, D qrupu): lüğət, 99 ad, səhabələr, alimlər,
   dərslər, kitablar, tarix.
   • Açar: <key> → JSON massiv (id-lər, sətir və ya rəqəm)
   • Yaddaş bağlıdırsa (gizli rejim) — sadəcə yaddaşda işləyir
   • Başqa tabda dəyişəndə (storage hadisəsi) yenilənir
   ══════════════════════════════════════════════════════════════════ */

function read(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key))
    return Array.isArray(v) ? v : []
  } catch { return [] }
}

export default function useStarred(key) {
  const [list, setList] = useState(() => (typeof window === 'undefined' ? [] : read(key)))

  useEffect(() => {
    const onStorage = (e) => { if (e.key === key) setList(read(key)) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  const toggle = useCallback((id) => {
    setList(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* yaddaş bağlıdır */ }
      return next
    })
  }, [key])

  const has = useCallback((id) => list.includes(id), [list])
  return { list, has, toggle, count: list.length }
}

/* Günün seçimi — yerli tarixə görə sabit indeks (gün ərzində dəyişmir) */
export function dayPick(len, date = new Date()) {
  if (!len) return 0
  const d = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000)
  return ((d % len) + len) % len
}

/* Paylaş: Web Share API, olmasa panoya kopyala. 'shared' | 'copied' | null */
export async function shareLink({ title, text, url }) {
  try {
    if (navigator.share) { await navigator.share({ title, text, url }); return 'shared' }
  } catch (e) {
    if (e && e.name === 'AbortError') return null
  }
  try {
    await navigator.clipboard.writeText([text, url].filter(Boolean).join('\n'))
    return 'copied'
  } catch { return null }
}
