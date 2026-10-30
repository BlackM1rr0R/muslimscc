// ═══════════════════════════════════════════════════════
// Ərəb kursu — tək səs oynadıcısı (hər an yalnız bir səs)
//
// play(key, urls): urls siyahısı ehtiyat mənbələrdir — biri yüklənməsə
// növbətisi sınanır (ayə səsi: utils/quranAudio.js → ayahSources).
// Eyni key yenidən basılsa — dayanır. Səhifədən çıxanda səs kəsilir.
// iOS Safari: hərf faylları WAV PCM-dir (ogg yoxdur), ayələr mp3.
// ═══════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from 'react'
import { ayahSources, DEFAULT_RECITER } from '../../utils/quranAudio'

export const letterAudioUrl = (id) => `/audio/arabic/${id}.wav`

/** Quran sözünün (QW elementi) ayə səsinin ünvanları */
export function ayahUrls(item) {
  const [s, a] = item.ref.split(':').map(Number)
  return ayahSources(DEFAULT_RECITER, { g: item.g, s, a })
}

export function useCourseAudio() {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(null)

  const stop = useCallback(() => {
    const a = audioRef.current
    audioRef.current = null
    if (a) {
      a.onended = a.onerror = null
      try { a.pause(); a.removeAttribute('src'); a.load() } catch { /* köhnə brauzer */ }
    }
    setPlaying(null)
  }, [])

  const play = useCallback((key, urls) => {
    if (audioRef.current && audioRef.current.dataset.key === key) { stop(); return }
    stop()
    const list = (Array.isArray(urls) ? urls : [urls]).filter(Boolean)
    if (!list.length || typeof Audio === 'undefined') return
    const a = new Audio()
    a.preload = 'auto'
    a.dataset.key = key
    audioRef.current = a
    setPlaying(key)
    let i = 0
    const tryNext = () => {
      if (audioRef.current !== a) return
      if (i >= list.length) { audioRef.current = null; setPlaying(null); return }
      a.src = list[i++]
      a.play().catch((e) => {
        // Brauzer icazə vermədi — sakitcə dayan; yüklənmə xətasını onerror idarə edir
        if (e?.name === 'NotAllowedError' && audioRef.current === a) { audioRef.current = null; setPlaying(null) }
      })
    }
    a.onerror = tryNext
    a.onended = () => { if (audioRef.current === a) { audioRef.current = null; setPlaying(null) } }
    tryNext()
  }, [stop])

  useEffect(() => stop, [stop])
  return { playing, play, stop }
}
