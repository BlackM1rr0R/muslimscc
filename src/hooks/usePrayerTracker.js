import { useState, useEffect, useCallback } from 'react'
import {
  loadSnapshot, loadQada, loadHayd, saveQada, saveHayd, setPrayerStatus,
  syncPendingCheckins, toKey, PRAYER_SYNC_EVENT, STATS_KEY, TRACKER_KEY, STATUS_KEY, QADA_KEY, HAYD_KEY,
} from '../utils/prayerTracker'

const WATCHED = [STATS_KEY, TRACKER_KEY, STATUS_KEY, QADA_KEY, HAYD_KEY]

/**
 * Bildirişdəki "✅ Qıldım" (IndexedDB) qeydlərini köçür: açılışda, tab
 * yenidən görünəndə və service worker {type:'CHECKIN'} göndərəndə.
 * Köçürmə PRAYER_SYNC_EVENT hadisəsini atır — dinləyən səhifələr yenilənir.
 */
export function usePendingCheckinSync() {
  useEffect(() => {
    syncPendingCheckins()
    const onVis = () => { if (document.visibilityState === 'visible') syncPendingCheckins() }
    const onMsg = (e) => { if (e.data?.type === 'CHECKIN') syncPendingCheckins() }
    document.addEventListener('visibilitychange', onVis)
    const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : null
    sw?.addEventListener?.('message', onMsg)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      sw?.removeEventListener?.('message', onMsg)
    }
  }, [])
}

/** Bu günün açarı — gecə yarısı keçəndə yenilənir */
export function useTodayKey() {
  const [today, setToday] = useState(toKey)
  useEffect(() => {
    const id = setInterval(() => setToday(prev => { const k = toKey(); return k === prev ? prev : k }), 30000)
    return () => clearInterval(id)
  }, [])
  return today
}

/** Namaz izləyicisinin bütün cihaz məlumatı + yazıcılar */
export default function usePrayerTracker() {
  const [snap, setSnap] = useState(loadSnapshot)
  const [qada, setQadaState] = useState(loadQada)
  const [hayd, setHaydState] = useState(loadHayd)
  const today = useTodayKey()

  usePendingCheckinSync()

  useEffect(() => {
    const reload = () => { setSnap(loadSnapshot()); setQadaState(loadQada()); setHaydState(loadHayd()) }
    const onStorage = (e) => { if (!e.key || WATCHED.includes(e.key)) reload() }
    window.addEventListener(PRAYER_SYNC_EVENT, reload)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(PRAYER_SYNC_EVENT, reload)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const setStatus = useCallback((date, p, status) => setPrayerStatus(date, p, status), [])
  const setQada = useCallback((q) => saveQada(typeof q === 'function' ? q(loadQada()) : q), [])
  const setHayd = useCallback((h) => saveHayd(typeof h === 'function' ? h(loadHayd()) : h), [])

  return { snap, qada, hayd, today, setStatus, setQada, setHayd }
}
