// ═══════════════════════════════════════════════════════
// Yolda rejimi — "Növbəti namaz" paneli (/on-the-road)
//
// Vaxtlar usePrayerTimes-dən (istifadəçinin seçdiyi şəhər + məzhəbə görə əsr — utils/prayerLocation,
// utils/madhab); hesablanmış vaxtdır, camaat vaxtı deyil. İri rəqəmlərlə geri sayım (role="timer" —
// hər saniyə elan olunmur). "Səslə de" yalnız bu faktı deyir.
// ═══════════════════════════════════════════════════════
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { PRAYER_NAMES } from '../../hooks/usePrayerTimes'
import { countdownClock } from '../../utils/roadMode'

const T = {
  az: { next: 'Növbəti namaz', adhan: 'Azan', tomorrow: 'sabah', calc: (c) => `${c} üçün hesablanmış vaxt`, change: 'Şəhəri dəyiş', say: 'Səslə de', loading: 'Namaz vaxtları yüklənir…', error: 'Namaz vaxtları yüklənmədi.', retry: 'Yenidən cəhd et', left: 'Qalan vaxt' },
  en: { next: 'Next prayer', adhan: 'Adhan', tomorrow: 'tomorrow', calc: (c) => `Calculated times for ${c}`, change: 'Change city', say: 'Say it aloud', loading: 'Loading prayer times…', error: 'Prayer times could not be loaded.', retry: 'Try again', left: 'Time left' },
  ru: { next: 'Следующий намаз', adhan: 'Азан', tomorrow: 'завтра', calc: (c) => `Расчётное время для города ${c}`, change: 'Сменить город', say: 'Произнести вслух', loading: 'Загрузка времени намаза…', error: 'Не удалось загрузить время намаза.', retry: 'Повторить', left: 'Осталось' },
  ar: { next: 'الصلاة التالية', adhan: 'الأذان', tomorrow: 'غدًا', calc: (c) => `مواقيت محسوبة لمدينة ${c}`, change: 'غيّر المدينة', say: 'انطقها بصوت', loading: 'جارٍ تحميل مواقيت الصلاة…', error: 'تعذّر تحميل مواقيت الصلاة.', retry: 'أعد المحاولة', left: 'الوقت المتبقي' },
  tr: { next: 'Sonraki namaz', adhan: 'Ezan', tomorrow: 'yarın', calc: (c) => `${c} için hesaplanmış vakitler`, change: 'Şehri değiştir', say: 'Sesli söyle', loading: 'Namaz vakitleri yükleniyor…', error: 'Namaz vakitleri yüklenemedi.', retry: 'Tekrar dene', left: 'Kalan süre' },
}

/** pt — usePrayerTimes(); now — epoch ms (səhifənin saatı); onSay — null olarsa düymə yoxdur */
export default function RoadPrayer({ pt, now, lang, cityName, prayerHref, onPrayerLink, onSay }) {
  const t = pickUi(T, lang, 'en')
  const next = pt.next
  if (!next) {
    return (
      <div className="road-prayer">
        {pt.error
          ? <div className="road-error"><p>{t.error}</p><button type="button" className="road-btn road-btn--wide" onClick={pt.reload}><Icon name="refresh" size={24} /> {t.retry}</button></div>
          : <p className="road-sub" role="status">{t.loading}</p>}
      </div>
    )
  }
  const name = pickUi(PRAYER_NAMES[next.key], lang, 'en')
  return (
    <div className="road-prayer" data-testid="road-prayer">
      <p className="road-prayer__name">{name}</p>
      <p className="road-prayer__count ui-num" role="timer" aria-label={t.left} data-testid="road-countdown">{countdownClock(next.at - now)}</p>
      <p className="road-big-line">
        <span>{t.adhan}</span> <b className="ui-num">{next.adhan}</b>{next.tomorrow ? <span> · {t.tomorrow}</span> : null}
      </p>
      {onSay && (
        <button type="button" className="road-btn road-btn--wide" onClick={onSay}>
          <Icon name="volume" size={24} /> {t.say}
        </button>
      )}
      <p className="road-hint">
        {cityName ? t.calc(cityName) : null}{' '}
        <a href={prayerHref} onClick={onPrayerLink} className="road-link">{t.change}</a>
      </p>
    </div>
  )
}
