// H2 — virdin React vəziyyəti: yaddaş (utils/wird) + seçilmiş şəhərin namaz vaxtları
// (hooks/usePrayerTimes, keşlənir; şəhərin saat qurşağında) + səhər/axşam azkarının avtomatik işarəsi.
import { useCallback, useEffect, useMemo, useState } from 'react'
import usePrayerTimes from '../../hooks/usePrayerTimes'
import { readWird, saveWird, buildSchedule, scheduleNow, wirdDay, anchorMinutes, applyAuto, toggleDone, progress, wirdStreak, dayEntry, WIRD_EVENT, WIRD_KEY } from '../../utils/wird'
import { toKey } from '../../utils/prayerTracker'

const readAdhkar = () => { try { return JSON.parse(localStorage.getItem('adhkar_done_v1') || 'null') } catch { return null } }

/** 'DD-MM-YYYY' → 'YYYY-MM-DD' | null */
const isoOf = (d) => { const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(String(d || '')); return m ? `${m[3]}-${m[2]}-${m[1]}` : null }

export default function useWird() {
  const pt = usePrayerTimes()
  const [w, setW] = useState(() => readWird())
  useEffect(() => {
    const on = () => setW(readWird())
    const st = (e) => { if (e.key === WIRD_KEY || e.key === 'adhkar_done_v1' || e.key === null) on() }
    window.addEventListener(WIRD_EVENT, on)
    window.addEventListener('storage', st)
    window.addEventListener('mcc-acctsync', on)
    return () => { window.removeEventListener(WIRD_EVENT, on); window.removeEventListener('storage', st); window.removeEventListener('mcc-acctsync', on) }
  }, [])

  const times = useMemo(() => Object.fromEntries((pt.prayers || []).map((p) => [p.key, p.adhan])), [pt.prayers])
  // Şəhərin vaxtı məlumdursa — onun günü və dəqiqəsi; yoxdursa — cihazın saatı
  const cityDay = isoOf(pt.date)
  const { day, nowMin, calendarDay } = useMemo(() => {
    if (cityDay && Number.isFinite(pt.nowSecs)) {
      const m = Math.floor(pt.nowSecs / 60)
      const d = wirdDay(cityDay, m, anchorMinutes('fajr', times))
      return { day: d, nowMin: d === cityDay ? m : m + 24 * 60, calendarDay: cityDay }
    }
    const s = scheduleNow(new Date(), times)
    return { ...s, calendarDay: toKey() }
  }, [cityDay, pt.nowSecs, times])

  // Səhər / axşam azkarı AdhkarFocus-da bitibsə — virddə də işarələ (bir dəfə)
  useEffect(() => {
    if (!w.items.length) return
    const next = applyAuto(w, day, readAdhkar(), calendarDay)
    if (next !== w) setW(saveWird(next))
  }, [w, day, calendarDay])

  const schedule = useMemo(() => buildSchedule(w.items, times, dayEntry(w, day).d, nowMin), [w, times, day, nowMin])
  const prog = useMemo(() => progress(w, day), [w, day])
  const streak = useMemo(() => wirdStreak(w, day), [w, day])
  const update = useCallback((fn) => setW((cur) => saveWird(fn(cur))), [])
  const toggle = useCallback((id, on) => update((cur) => toggleDone(cur, day, id, on)), [update, day])

  return { w, day, times, schedule, prog, streak, update, toggle, loading: pt.loading }
}
