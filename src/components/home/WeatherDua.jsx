// ═══════════════════════════════════════════════════════
// WeatherDua (v5.7) — şəhərinizdə indiki hava + uyğun dua (ana səhifə, hero-nun altı)
//
// • Hava: utils/weather (Open-Meteo). html[data-weather] qoyulur → hero-da yağış /
//   qar / ildırım / külək effekti (vau3.css → .hp-wx; yalnız transform/opacity).
// • Dua: YALNIZ saytdakı Hisnul-Müslim mətni (public/data/hisn/<dil>.json):
//   yağış — fəsil 65 («Yağış yağdıqda dua», Buxari), külək — 62, göy gurultusu — 63.
//   Qar üçün xüsusi dua yoxdur — kart göstərilmir, yalnız səma dəyişir.
// • Hava adi olanda heç nə göstərilmir. Bağlamaq olar (bu gün üçün yadda qalır).
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'
import { pathFor } from '../../seo/routes'
import { getPrayerLocation } from '../../utils/prayerLocation'
import { loadWeather } from '../../utils/weather'
import { pickUi } from '../../utils/uiText'
import { isPlainClick } from '../PageLink'
import Icon from '../Icon'

const CHAPTER = { rain: 65, wind: 62, thunder: 63 }
const ICON = { rain: 'drop', wind: 'leaf', thunder: 'bolt', snow: 'sparkle' }
const T = {
  az: { rain: '{city}: indi yağış yağır', wind: '{city}: güclü külək əsir', thunder: '{city}: göy gurlayır', snow: '{city}: qar yağır', open: 'Hisnul-Müslimdə aç', close: 'Bağla', ey: 'Bu anın duası' },
  en: { rain: 'It is raining in {city}', wind: 'A strong wind is blowing in {city}', thunder: 'Thunder in {city}', snow: 'It is snowing in {city}', open: 'Open in Hisn al-Muslim', close: 'Close', ey: 'A dua for this moment' },
  ru: { rain: '{city}: идёт дождь', wind: '{city}: сильный ветер', thunder: '{city}: гремит гром', snow: '{city}: идёт снег', open: 'Открыть в «Хисн аль-муслим»', close: 'Закрыть', ey: 'Дуа для этого момента' },
  ar: { rain: '{city}: تمطر الآن', wind: '{city}: رياح شديدة', thunder: '{city}: رعد', snow: '{city}: يتساقط الثلج', open: 'افتح في حصن المسلم', close: 'إغلاق', ey: 'دعاء هذه اللحظة' },
  tr: { rain: '{city}: şu an yağmur yağıyor', wind: '{city}: kuvvetli rüzgâr esiyor', thunder: '{city}: gök gürlüyor', snow: '{city}: kar yağıyor', open: 'Hısnu’l-Müslim’de aç', close: 'Kapat', ey: 'Bu anın duası' },
}
const HISN_LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const dismissKey = (kind) => `qm_wx_hide_${kind}_${new Date().toDateString()}`

export default function WeatherDua() {
  const { lang } = useLang()
  const t = pickUi(T, lang)
  const navigate = useNavigate()
  const [wx, setWx] = useState(null)
  const [item, setItem] = useState(null)
  const [hidden, setHidden] = useState(false)
  const loc = typeof window === 'undefined' ? null : getPrayerLocation()
  const city = loc?.city?.[lang] || loc?.city?.en || ''

  useEffect(() => {
    let alive = true
    if (!loc) return undefined
    loadWeather(loc.lat, loc.lng).then(w => {
      if (!alive || !w?.kind) return
      setWx(w)
      document.documentElement.dataset.weather = w.kind
      try { if (sessionStorage.getItem(dismissKey(w.kind))) setHidden(true) } catch { /* */ }
      const ch = CHAPTER[w.kind]
      if (!ch) return
      const hl = HISN_LANGS.includes(lang) ? lang : 'en'
      fetch(`/data/hisn/${hl}.json`).then(r => (r.ok ? r.json() : null)).then(d => {
        const c = d?.chapters?.find(x => x.id === ch)
        if (alive && c?.items?.[0]) setItem({ ...c.items[0], title: c.title, id: ch })
      }).catch(() => {})
    })
    return () => { alive = false; delete document.documentElement.dataset.weather }
  }, [lang]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!wx?.kind || !item || hidden) return null
  const href = `${pathFor('hisn', lang)}#hs-${item.id}`
  const close = () => { setHidden(true); try { sessionStorage.setItem(dismissKey(wx.kind), '1') } catch { /* */ } }
  return (
    <section className="ui-container wxd" aria-labelledby="wxd-h" data-testid="weather-dua">
      <div className={`ui-card wxd__card wxd__card--${wx.kind}`}>
        <div className="wxd__fx" aria-hidden="true" />
        <div className="wxd__head">
          <span className="wxd__ic" aria-hidden="true"><Icon name={ICON[wx.kind]} size={18} /></span>
          <div>
            <span className="ui-eyebrow">{t.ey}</span>
            <h2 id="wxd-h" className="wxd__title">{t[wx.kind].replace('{city}', city)}{Number.isFinite(wx.temp) ? <span className="wxd__temp ui-num"> · {Math.round(wx.temp)}°</span> : null}</h2>
          </div>
          <button type="button" className="wxd__x" onClick={close} aria-label={t.close}><Icon name="close" size={14} /></button>
        </div>
        <p className="wxd__ar" lang="ar" dir="rtl">{item.ar}</p>
        {lang !== 'ar' && item.text && <p className="wxd__tr">{item.text}</p>}
        <div className="wxd__foot">
          {item.src && <small className="wxd__src">{item.src}</small>}
          <a className="ui-btn ui-btn--secondary ui-btn--sm" href={href} onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); navigate(href) } }}>
            <Icon name="hisn" className="ui-btn__icon" />{t.open}
          </a>
        </div>
      </div>
    </section>
  )
}
