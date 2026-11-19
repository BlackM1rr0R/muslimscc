// ═══════════════════════════════════════════════════════
// useWakeLock(active) — ekran sönməsin (Screen Wake Lock API)
//
//   const awake = useWakeLock(true)   // 'on' | 'off' | 'unsupported'
//
// • Vərəq gizlənəndə brauzer kilidi özü buraxır — vərəq yenidən görünəndə yenidən istənir.
// • API yoxdursa (köhnə Safari, Firefox) və ya brauzer rədd edirsə — səssizcə 'unsupported' / 'off';
//   səhifə adi qaydada işləyir (ekranı cihazın öz ayarı söndürə bilər).
// • İlk render-də (prerender ilə eyni) həmişə 'off' — dəstək yalnız mount-dan sonra yoxlanır.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'

export default function useWakeLock(active = true) {
  const [state, setState] = useState('off')
  useEffect(() => {
    if (!active) { setState('off'); return undefined }
    const wl = typeof navigator !== 'undefined' ? navigator.wakeLock : null
    if (!wl?.request) { setState('unsupported'); return undefined }
    let lock = null, alive = true
    const acquire = () => {
      if (!alive || document.visibilityState !== 'visible' || lock) return
      wl.request('screen').then((l) => {
        if (!alive) { l.release?.().catch?.(() => {}); return }
        lock = l
        setState('on')
        l.addEventListener?.('release', () => { lock = null; if (alive) setState('off') })
      }).catch(() => { if (alive) setState('off') })
    }
    const onVis = () => { if (document.visibilityState === 'visible') acquire() }
    acquire()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVis)
      lock?.release?.().catch?.(() => {})
      lock = null
    }
  }, [active])
  return state
}
