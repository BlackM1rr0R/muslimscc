// ═══════════════════════════════════════════════════════
// CalendarSubscribe — namaz vaxtları Google / Apple / Outlook təqviminə
// Abunəlik URL-i: /api/prayer.ics (server/ics.js) — seçilmiş şəhərin
// koordinatı, saat qurşağı, metodu və dili ilə. Təqvim faylı özü yeniləyir.
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import Icon from '../Icon'
import { icsUrl } from '../../utils/icsUrl'
import { pickUi } from '../../utils/uiText'

const TXT = {
  az: { title: 'Namaz vaxtları təqviminizdə', lead: 'Bir dəfə abunə olun — növbəti 45 günün azan vaxtları telefonunuzun təqvimində görünəcək və özü yenilənəcək.', google: 'Google Təqvim', apple: 'Apple / Outlook', copy: 'Linki kopyala', copied: 'Kopyalandı', note: 'Şəhəri dəyişsəniz, yeni şəhər üçün yenidən abunə olun.' },
  en: { title: 'Prayer times in your calendar', lead: 'Subscribe once — adhan times for the next 45 days appear in your phone’s calendar and update by themselves.', google: 'Google Calendar', apple: 'Apple / Outlook', copy: 'Copy link', copied: 'Copied', note: 'If you change the city, subscribe again for the new city.' },
  ru: { title: 'Время намаза в вашем календаре', lead: 'Подпишитесь один раз — время азана на 45 дней вперёд появится в календаре телефона и будет обновляться само.', google: 'Google Календарь', apple: 'Apple / Outlook', copy: 'Копировать ссылку', copied: 'Скопировано', note: 'Если смените город, подпишитесь заново для нового города.' },
  ar: { title: 'مواقيت الصلاة في تقويمك', lead: 'اشترك مرة واحدة — تظهر مواقيت الأذان للأيام الخمسة والأربعين القادمة في تقويم هاتفك وتتحدّث تلقائيًا.', google: 'تقويم جوجل', apple: 'آبل / أوتلوك', copy: 'نسخ الرابط', copied: 'تم النسخ', note: 'إذا غيّرت المدينة فاشترك من جديد للمدينة الجديدة.' },
  tr: { title: 'Namaz vakitleri takviminizde', lead: 'Bir kez abone olun — önümüzdeki 45 günün ezan vakitleri telefonunuzun takviminde görünür ve kendiliğinden güncellenir.', google: 'Google Takvim', apple: 'Apple / Outlook', copy: 'Bağlantıyı kopyala', copied: 'Kopyalandı', note: 'Şehri değiştirirseniz yeni şehir için yeniden abone olun.' },
}

export default function CalendarSubscribe({ location, lang, city }) {
  const t = pickUi(TXT, lang)
  const [copied, setCopied] = useState(false)
  if (!location || !Number.isFinite(location.lat) || !location.tz) return null
  const https = icsUrl(window.location.origin, location, lang, city)
  const webcal = https.replace(/^https?:/, 'webcal:')
  const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`
  const copy = async () => {
    try { await navigator.clipboard.writeText(https); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* */ }
  }
  return (
    <div className="ui-card pp-cal" data-reveal>
      <div className="pp-cal__head">
        <span className="ui-icon-tile" aria-hidden="true"><Icon name="calendar" /></span>
        <div>
          <h3 className="pp-cal__title">{t.title}</h3>
          <p className="pp-cal__lead">{t.lead}</p>
        </div>
      </div>
      <div className="pp-cal__actions">
        <a className="ui-btn ui-btn--primary" href={google} target="_blank" rel="noopener noreferrer">
          <Icon name="external" className="ui-btn__icon" />{t.google}
        </a>
        <a className="ui-btn ui-btn--secondary" href={webcal}>
          <Icon name="calendar" className="ui-btn__icon" />{t.apple}
        </a>
        <button type="button" className="ui-btn ui-btn--ghost" onClick={copy}>
          <Icon name={copied ? 'check' : 'copy'} className="ui-btn__icon" />{copied ? t.copied : t.copy}
        </button>
      </div>
      <p className="pp-cal__note"><Icon name="info" size={14} /> {t.note}</p>
    </div>
  )
}
