// ═══════════════════════════════════════════════════════
// Bu günün namaz vaxtları (səhər ardıcıllığı) — hooks/usePrayerTimes (seçilmiş şəhər + məzhəb)
// Şəxsi vəziyyətdən (şəhər, məzhəb, keş) asılıdır — səhifə bunu YALNIZ mount-dan sonra göstərir.
// ═══════════════════════════════════════════════════════
import Icon from '../Icon'
import usePrayerTimes, { PRAYER_NAMES } from '../../hooks/usePrayerTimes'
import { pickUi } from '../../utils/uiText'
import { SpaLink } from './RoutineParts'

const T = {
  az: { loading: 'Namaz vaxtları yüklənir…', error: 'Namaz vaxtları yüklənmədi.', retry: 'Yenidən cəhd et', next: 'Növbəti', city: (c) => `Şəhər: ${c}`, change: 'Şəhəri dəyiş', list: 'Bu günün namaz vaxtları' },
  en: { loading: 'Loading prayer times…', error: 'Prayer times could not be loaded.', retry: 'Try again', next: 'Next', city: (c) => `City: ${c}`, change: 'Change city', list: 'Today’s prayer times' },
  ru: { loading: 'Загрузка времени намаза…', error: 'Время намаза не загрузилось.', retry: 'Повторить', next: 'Следующий', city: (c) => `Город: ${c}`, change: 'Сменить город', list: 'Время намазов на сегодня' },
  ar: { loading: 'جارٍ تحميل مواقيت الصلاة…', error: 'تعذّر تحميل مواقيت الصلاة.', retry: 'أعد المحاولة', next: 'التالية', city: (c) => `المدينة: ${c}`, change: 'غيّر المدينة', list: 'مواقيت صلاة اليوم' },
  tr: { loading: 'Namaz vakitleri yükleniyor…', error: 'Namaz vakitleri yüklenemedi.', retry: 'Tekrar dene', next: 'Sonraki', city: (c) => `Şehir: ${c}`, change: 'Şehri değiştir', list: 'Bugünün namaz vakitleri' },
}

export default function TodayPrayers({ lang, prayerHref }) {
  const t = pickUi(T, lang, 'en')
  const pt = usePrayerTimes()
  const city = pt.location?.city?.[lang] || pt.location?.city?.en || ''
  if (!pt.prayers.length) {
    return pt.error
      ? <div className="slr-wait"><p>{t.error}</p><button type="button" className="slr-btn slr-btn--soft slr-btn--sm" onClick={pt.reload}><Icon name="refresh" size={16} /> {t.retry}</button></div>
      : <p className="slr-wait">{t.loading}</p>
  }
  const nextKey = pt.next && !pt.next.tomorrow ? pt.next.key : null
  return (
    <div className="slr-prayers" data-testid="slr-prayers">
      <ul className="slr-prayers__list" aria-label={t.list}>
        {pt.prayers.map((p) => (
          <li key={p.key} className={p.key === nextKey ? 'is-next' : ''}>
            <span>{pickUi(PRAYER_NAMES[p.key], lang, 'en')}</span>
            {p.key === nextKey && <span className="slr-prayers__tag">{t.next}</span>}
            <b className="ui-num" dir="ltr">{p.adhan}</b>
          </li>
        ))}
      </ul>
      <p className="slr-hint">
        {city ? `${t.city(city)} · ` : ''}<SpaLink href={prayerHref} className="ui-link">{t.change}</SpaLink>
      </p>
    </div>
  )
}
