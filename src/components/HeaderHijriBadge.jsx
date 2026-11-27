// ═══════════════════════════════════════════════════════
// Başlıqda «Haram ay» nişanı — yalnız dörd haram ayda (html[data-hmonth] = sacred | dhul10;
// utils/hijriMonth.js). Header.jsx onu yalnız belə ayda tənbəl yükləyir.
//
// • Toxunuş → kiçik izah pəncərəsi (qeyri-modal dialoq): ayın adı, saytın /calendar
//   bələdçisindəki ifadə (data/guides/CalendarPage.js — Rəcəb sətri) və istinadlar:
//   Tövbə 9:36, Buxari 3197. Ayə mətni burada sitat gətirilmir — tam mətn bələdçidədir.
// • Fokus pəncərəyə keçir, Esc / kənara klik bağlayır, fokus nişana qayıdır.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import { gregorianToHijri, fromLocalDate, HIJRI_MONTHS } from '../utils/hijri'
import { isSacredMonth } from '../utils/hijriMonth'
import Icon from './Icon'
import '../styles/HeaderHijriBadge.css'

const T = {
  az: {
    badge: 'Haram ay', title: (m) => `${m} — haram ay`, ten: 'Zülhiccənin on günü',
    body: (m) => `${m} dörd haram aydan biridir. Allah bu aylar barədə buyurur: «Bu aylarda özünüzə zülm etməyin» (9:36).`,
    four: (l) => `Dörd haram ay: ${l}.`, join: (a) => `${a.slice(0, 3).join(', ')} və ${a[3]}`,
    refs: 'Tövbə 9:36 · Buxari 3197', more: 'Hicri aylar — bələdçi', close: 'Bağla',
  },
  en: {
    badge: 'Sacred month', title: (m) => `${m} — a sacred month`, ten: 'The ten days of Dhul-Hijjah',
    body: (m) => `${m} is one of the four sacred months. Allah says of them: “so do not wrong yourselves during them” (9:36).`,
    four: (l) => `The four sacred months: ${l}.`, join: (a) => `${a.slice(0, 3).join(', ')} and ${a[3]}`,
    refs: 'At-Tawbah 9:36 · Bukhari 3197', more: 'The Hijri months — guide', close: 'Close',
  },
  ru: {
    badge: 'Запретный месяц', title: (m) => `${m} — запретный месяц`, ten: 'Десять дней зуль-хиджи',
    body: (m) => `${m} — один из четырёх запретных месяцев. Аллах говорит о них: «так не поступайте же в них несправедливо по отношению к самим себе» (9:36).`,
    four: (l) => `Четыре запретных месяца: ${l}.`, join: (a) => `${a.slice(0, 3).join(', ')} и ${a[3]}`,
    refs: 'Ат-Тауба 9:36 · Бухари 3197', more: 'Месяцы хиджры — руководство', close: 'Закрыть',
  },
  ar: {
    badge: 'شهر حرام', title: (m) => `${m} — من الأشهر الحرم`, ten: 'عشر ذي الحجة',
    body: (m) => `${m} أحد الأشهر الحرم الأربعة، قال الله عنها: ﴿فَلَا تَظْلِمُوا فِيهِنَّ أَنفُسَكُمْ﴾ (التوبة: 36).`,
    four: (l) => `الأشهر الحرم: ${l}.`, join: (a) => `${a.slice(0, 3).join('، ')} و${a[3]}`,
    refs: 'التوبة: 36 · البخاري 3197', more: 'الشهور الهجرية — دليل', close: 'إغلاق',
  },
  tr: {
    badge: 'Haram ay', title: (m) => `${m} — haram ay`, ten: 'Zilhicce’nin on günü',
    body: (m) => `${m} dört haram aydan biridir. Allah bu aylar hakkında şöyle buyurur: “Bu aylarda kendinize zulmetmeyin” (9:36).`,
    four: (l) => `Dört haram ay: ${l}.`, join: (a) => `${a.slice(0, 3).join(', ')} ve ${a[3]}`,
    refs: 'Tevbe 9:36 · Buhârî 3197', more: 'Hicri aylar — rehber', close: 'Kapat',
  },
}

// Buxari 3197-dəki sıra: Zülqədə, Zülhiccə, Məhərrəm, Rəcəb
const ORDER = [11, 12, 1, 7]
const POP_ID = 'hdr-hm-pop'

/** Bələdçi bölməsi tənbəl səhifədə bir az sonra yaranır — gözləyib sürüşdür */
function scrollToWhenReady(id) {
  let n = 0
  const tick = () => {
    const el = document.getElementById(id)
    if (el) { el.scrollIntoView({ block: 'start' }); return }
    if (++n < 40) setTimeout(tick, 150)
  }
  setTimeout(tick, 120)
}

export default function HeaderHijriBadge({ state }) {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const popRef = useRef(null)
  const wrapRef = useRef(null)

  // Ayın adı: bu günün hicri ayı; sınaq rejimində (?hmonth=) ay haram deyilsə — Rəcəb / Zülhiccə
  const [month] = useState(() => {
    let h = null
    try { h = gregorianToHijri(fromLocalDate(new Date())) } catch { /* */ }
    if (state === 'dhul10') return 12
    return isSacredMonth(h) ? h.month : 7
  })
  const names = HIJRI_MONTHS[lang] || HIJRI_MONTHS.en
  const m = names[month - 1]
  const list = ORDER.map((i) => names[i - 1])
  const four = t.join(list)

  useEffect(() => {
    if (!open) return undefined
    popRef.current?.focus({ preventScroll: true })
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setOpen(false)
      btnRef.current?.focus({ preventScroll: true })
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const close = () => { setOpen(false); btnRef.current?.focus({ preventScroll: true }) }
  const href = `${pathFor('calendar', lang)}#cal-g-sacred`
  const onMore = (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    setOpen(false)
    navigate(href)
    scrollToWhenReady('cal-g-sacred')
  }

  return (
    <div className="hdr-hm" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className={`hdr-hm-badge${state === 'dhul10' ? ' is-ten' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={open ? POP_ID : undefined}
        aria-haspopup="dialog"
        data-testid="hijri-badge"
      >
        <Icon name="moonStar" size={16} />
        <span className="hdr-hm-badge__txt">{t.badge}</span>
      </button>
      {open && (
        <div
          ref={popRef}
          id={POP_ID}
          className="hdr-hm-pop"
          role="dialog"
          aria-modal="false"
          aria-labelledby="hdr-hm-h"
          tabIndex={-1}
          data-testid="hijri-pop"
        >
          <h2 id="hdr-hm-h" className="hdr-hm-pop__h">{t.title(m)}</h2>
          {state === 'dhul10' && <p className="hdr-hm-pop__ten">{t.ten}</p>}
          <p className="hdr-hm-pop__p">{t.body(m)}</p>
          <p className="hdr-hm-pop__p">{t.four(four)}</p>
          <p className="hdr-hm-pop__src"><bdi>{t.refs}</bdi></p>
          <div className="hdr-hm-pop__row">
            <a href={href} onClick={onMore} className="hdr-hm-pop__more">
              {t.more} <Icon name="arrow" size={14} className="ui-flip-rtl" />
            </a>
            <button type="button" className="hdr-hm-pop__close" onClick={close}>{t.close}</button>
          </div>
        </div>
      )}
    </div>
  )
}
