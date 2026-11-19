// Yuxu taymerinin saf hesabı (components/quran/SleepTimer.jsx, QuranZen "gecə qiraəti").
// sleep: null | { mode: 'min', min, from, at } | { mode: 'surah', from } — useQuranPlayer → player.sleep

/** Qalan dəqiqə (≥ 1; vaxt çatıb ayənin sonu gözlənirsə də 1); surə rejimində 0 */
export const sleepLeftMin = (sleep, now = Date.now()) =>
  sleep?.mode === 'min' ? Math.max(1, Math.ceil((sleep.at - now) / 60000)) : 0

/** Taymerin irəliləyişi 0…1; surə rejimində — cari ayə / ayə sayı */
export function sleepProgress(sleep, { now = Date.now(), current = 0, total = 0 } = {}) {
  if (!sleep) return 0
  if (sleep.mode === 'min') return Math.min(1, Math.max(0, (now - sleep.from) / Math.max(1, sleep.at - sleep.from)))
  return total > 0 && current > 0 ? Math.min(1, current / total) : 0
}
