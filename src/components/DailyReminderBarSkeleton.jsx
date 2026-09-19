// ═══ Günün xatırlatmaları zolağının yer tutucusu ═══
// DailyReminderBar tənbəl (React.lazy) yüklənir, çünki quotes.js və duas.js
// böyükdür. Bu kiçik fayl heç bir məlumat import etmir — ana səhifədə
// <Suspense fallback> kimi işlənir və zolağın hündürlüyünü əvvəlcədən
// saxlayır ki, məzmun gələndə səhifə aşağı sıçramasın (layout shift yoxdur).
import '../styles/DailyReminderBar.css'

// "Bu gün üçün gizlət" — dəyər YYYY-MM-DD (yerli tarix)
export const DAILY_BAR_HIDE_KEY = 'qm_daily_bar_hidden'

/** Yerli tarixə görə YYYY-MM-DD */
export function localDateKey(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** İstifadəçi zolağı bu gün bağlayıbmı? (gizli rejim/bloklanmış storage-da false) */
export function isDailyBarHiddenToday() {
  try {
    return localStorage.getItem(DAILY_BAR_HIDE_KEY) === localDateKey()
  } catch {
    return false
  }
}

/** Zolağı günün sonuna qədər gizlət */
export function hideDailyBarForToday() {
  try {
    localStorage.setItem(DAILY_BAR_HIDE_KEY, localDateKey())
  } catch { /* storage bloklanıb — yalnız bu səhifədə gizlənəcək */ }
}

/** Boş zolaq — əsl zolaqla eyni ölçüdə */
export function DailyReminderBarSkeleton() {
  // Bu gün bağlanıbsa, yer də tutmuruq (əks halda boş yer qalıb sonra itərdi)
  if (isDailyBarHiddenToday()) return null
  return (
    <div className="drb-wrap" aria-hidden="true">
      <div className="drb drb--skeleton" />
    </div>
  )
}

export default DailyReminderBarSkeleton
