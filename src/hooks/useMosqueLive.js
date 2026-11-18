// ═══════════════════════════════════════════════════════
// K4: məscid ekranının "məscidə qoşul" rejimi — GET /api/mosques/:id/live hər 60 saniyədə.
// Server ETag verir (W/"m<versiya>-<gün>"); cache: 'no-cache' ilə brauzer şərti sorğu göndərir
// (If-None-Match → 304) — dəyişməyibsə gövdə yenidən yüklənmir. Şəbəkə xətasında son məlumat qalır.
// mosqueId yoxdursa heç nə soruşulmur (yerli rejim əvvəlki kimi).
// Qaytarır: { status: 'off' | 'loading' | 'live' | 'missing', data }
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'

export const LIVE_POLL_MS = 60000

export default function useMosqueLive(mosqueId, { pollMs = LIVE_POLL_MS } = {}) {
  const [state, setState] = useState(() => ({ status: mosqueId ? 'loading' : 'off', data: null }))
  useEffect(() => {
    if (!mosqueId) { setState({ status: 'off', data: null }); return undefined }
    let off = false
    let timer = 0
    const tick = async () => {
      try {
        const r = await fetch(`/api/mosques/${encodeURIComponent(mosqueId)}/live`, { cache: 'no-cache', headers: { Accept: 'application/json' } })
        if (off) return
        if (r.status === 404) setState({ status: 'missing', data: null })
        else if (r.ok) {
          const j = await r.json()
          if (!off) setState({ status: 'live', data: j })
        }
      } catch { /* şəbəkə — son məlumat qalır */ }
      if (!off) timer = setTimeout(tick, pollMs)
    }
    tick()
    return () => { off = true; clearTimeout(timer) }
  }, [mosqueId, pollMs])
  return state
}
