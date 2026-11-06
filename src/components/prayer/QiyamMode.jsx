// ═══════════════════════════════════════════════════════
// QiyamMode — gecə namazı rejimi (/prayer, "Gecənin son üçdə biri" kartından)
//
//   <QiyamMode nowMin={1290} maghrib={1050} fajr={330} lang="az" onClose={() => …} />
//
// • Tam ekran, tünd ulduzlu səma; iri geri sayım: son üçdə birə qədər və ya
//   (artıq başlayıbsa) sübhə qədər qalan vaxt (utils/qiyam).
// • Mətnlər saytda artıq yoxlanmış mənbələrdəndir — burada yazılmır:
//     nüzul hədisi — data/hadiths.js (id 1808, Buxari, Təhəccüd 14);
//     vitr qunutu və vitrdən sonrakı zikr — Hisnul-Müslim, public/data/hisn/<dil>.json (fəsil 33, 34);
//     vitrdə oxunan surələr (Əla, Kafirun, İxlas) — Quran səhifəsinə keçid (mətn kopyalanmır).
// • Ekran sönməsin (Screen Wake Lock, dəstəklənirsə). Esc / "Bağla".
// Stillər: src/styles/QiyamMode.css
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../Icon'
import GeoStarfield from './GeoStarfield'
import { HADITHS } from '../../data/hadiths'
import { getSurahLocal } from '../../data/surahNamesAz'
import { pathFor } from '../../seo/routes'
import { qiyamState, hm } from '../../utils/qiyam'
import '../../styles/QiyamMode.css'
import { pickUi } from '../../utils/uiText'

const T = {
  az: { title: 'Gecə namazı', close: 'Bağla', until: 'Gecənin son üçdə birinə', inNow: 'İndi gecənin son üçdə biridir', toFajr: 'sübhə qədər', starts: (t) => `başlayır: ${t}`, h: 'saat', m: 'dəq', witr: 'Vitrdə oxunan surələr', duas: 'Vitr duaları (Hisnul-Müslim)', wake: 'Ekran açıq qalır', src: 'Mənbə' },
  en: { title: 'Night prayer', close: 'Close', until: 'Until the last third of the night', inNow: 'It is now the last third of the night', toFajr: 'until Fajr', starts: (t) => `begins: ${t}`, h: 'h', m: 'min', witr: 'Surahs recited in Witr', duas: 'Witr supplications (Hisn al-Muslim)', wake: 'Screen stays on', src: 'Source' },
  ru: { title: 'Ночной намаз', close: 'Закрыть', until: 'До последней трети ночи', inNow: 'Сейчас последняя треть ночи', toFajr: 'до Фаджра', starts: (t) => `начало: ${t}`, h: 'ч', m: 'мин', witr: 'Суры, читаемые в витре', duas: 'Мольбы витра (Хисн аль-муслим)', wake: 'Экран не гаснет', src: 'Источник' },
  tr: { title: 'Gece namazı', close: 'Kapat', until: 'Gecenin son üçte birine', inNow: 'Şu an gecenin son üçte biri', toFajr: 'sabaha kadar', starts: (t) => `başlıyor: ${t}`, h: 'sa', m: 'dk', witr: 'Vitirde okunan sureler', duas: 'Vitir duaları (Hısnu’l-Müslim)', wake: 'Ekran açık kalır', src: 'Kaynak' },
  ar: { title: 'قيام الليل', close: 'إغلاق', until: 'حتى الثلث الأخير من الليل', inNow: 'الآن الثلث الأخير من الليل', toFajr: 'حتى الفجر', starts: (t) => `يبدأ: ${t}`, h: 'س', m: 'د', witr: 'السور المقروءة في الوتر', duas: 'أدعية الوتر (حصن المسلم)', wake: 'تبقى الشاشة مضاءة', src: 'المصدر' },
}
// Vitrdə: Əla, Kafirun, İxlas (Əbu Davud 1423, Nəsai 1729 — Übeyy ibn Kəb)
const WITR = [87, 109, 112]
const HISN_WITR = [33, 34]

export default function QiyamMode({ nowMin, maghrib, fajr, lang = 'az', onClose }) {
  const t = pickUi(T, lang)
  const st = qiyamState(nowMin, maghrib, fajr)
  const hadith = (pickUi(HADITHS, lang, 'en')).find(h => h.id === 1808)
  const [duas, setDuas] = useState([])
  const [awake, setAwake] = useState(false)
  const closeRef = useRef(null)

  useEffect(() => {
    let alive = true
    fetch(`/data/hisn/${lang}.json`).then(r => (r.ok ? r.json() : null)).then(j => {
      const ch = j?.chapters || j || []
      if (alive && Array.isArray(ch)) setDuas(ch.filter(c => HISN_WITR.includes(c.id)))
    }).catch(() => {})
    return () => { alive = false }
  }, [lang])

  // Ekran sönməsin
  useEffect(() => {
    let lock = null, alive = true
    navigator.wakeLock?.request?.('screen').then(l => { if (alive) { lock = l; setAwake(true) } else l.release() }).catch(() => {})
    return () => { alive = false; lock?.release?.().catch?.(() => {}) }
  }, [])

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  const h = st ? Math.floor(st.left / 60) : 0, m = st ? st.left % 60 : 0
  const surahName = (n) => (lang === 'ar' ? '' : getSurahLocal(n, lang)?.name) || `${n}`

  return createPortal(
    <div className={`qy${st?.phase === 'in' ? ' is-in' : ''}`} role="dialog" aria-modal="true" aria-labelledby="qy-title" data-testid="qiyam">
      <GeoStarfield className="qy__sky" />
      <div className="qy__scroll">
        <header className="qy__top">
          <h2 id="qy-title" className="qy__title"><Icon name="moonStar" size={20} /> {t.title}</h2>
          <button type="button" ref={closeRef} className="ui-btn ui-btn--inverse ui-btn--sm" onClick={onClose}>
            <Icon name="close" className="ui-btn__icon" /> {t.close}
          </button>
        </header>

        {st && (
          <section className="qy__clock" aria-live="polite">
            <p className="qy__label">{st.phase === 'in' ? t.inNow : t.until}</p>
            <p className="qy__count ui-num" dir="ltr" data-testid="qiyam-count">
              {h > 0 && <><b>{h}</b><small>{t.h}</small> </>}<b>{m}</b><small>{t.m}</small>
            </p>
            <p className="qy__sub ui-num">{st.phase === 'in' ? `${t.toFajr} · ${hm(fajr)}` : t.starts(hm(st.start))}</p>
            {awake && <p className="qy__wake"><Icon name="sun" size={14} /> {t.wake}</p>}
          </section>
        )}

        {hadith && (
          <figure className="qy__card qy__hadith">
            <p className="qy__ar ui-arabic" lang="ar" dir="rtl">{hadith.ar}</p>
            {lang !== 'ar' && <p className="qy__tx">{hadith.text}</p>}
            <figcaption className="qy__src">{t.src}: {hadith.source}</figcaption>
          </figure>
        )}

        <section className="qy__card">
          <h3 className="qy__h">{t.witr}</h3>
          <ul className="qy__surahs">
            {WITR.map(n => (
              <li key={n}><a className="ui-chip qy__chip" href={pathFor('quran', lang, n)}>
                <span className="ui-num">{n}</span> {surahName(n)}
              </a></li>
            ))}
          </ul>
        </section>

        {duas.length > 0 && (
          <section className="qy__card">
            <h3 className="qy__h">{t.duas}</h3>
            {duas.map(c => (
              <div key={c.id} className="qy__dua">
                <h4 className="qy__dua-t">{c.title}</h4>
                {c.items.map((it, i) => (
                  <div key={i} className="qy__item">
                    <p className="qy__ar ui-arabic" lang="ar" dir="rtl">{it.ar}</p>
                    {lang !== 'ar' && it.text && <p className="qy__tx">{it.text}</p>}
                    {it.src && <p className="qy__src">{it.src}</p>}
                  </div>
                ))}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>,
    document.body,
  )
}
