// ═══════════════════════════════════════════════════════
// HilalAR (v5.8) — kamerada Ayın səmadakı yeri (/calendar, telefonda)
//
//   <HilalAR lang="az" onClose={() => …} />
//
// • Ayın istiqaməti və hündürlüyü seçilmiş şəhər üçün hər saniyə hesablanır
//   (utils/moonPosition — ~1° dəqiqlik). Telefonun istiqaməti — kompas (QiblaAR ilə eyni
//   utils/cameraHeading), yuxarı-aşağı — beta (dik telefon = üfüq).
// • Ekranda: Ay nişanı (işıqlanmaya görə — utils/moonPhase), kənardadırsa ox; üfüq xətti.
//   Ay üfüqün altındadırsa — bunu deyir və nə vaxt doğacağını göstərmir (hesab yoxdur).
// • Kamera görüntüsü yalnız ekrandadır; bağlananda bütün track-lər dayanır.
// • Bu, ru’yət (hökm) deyil — yalnız Ayı tapmağa kömək. Stillər: QiblaAR.css (qar) + HilalAR.css
// • v6.2 mode="sky" — "Quranın səması": Ay, Günəş və əş-Şira (Sirius) seçilir; tapılanda
//   ayəsi (data/quranSky.js — mətn testlə yoxlanılır) və ayə səhifəsinə keçid görünür.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { cameraHeading, angleDiff, smoothAngle } from '../utils/cameraHeading'
import { moonPosition } from '../utils/moonPosition'
import { moonPhase } from '../utils/moonPhase'
import { getPrayerLocation } from '../utils/prayerLocation'
import { sunEcliptic, toEquatorial, horizontal } from '../utils/lunar'
import { SKY_BODIES, siriusNow } from '../data/quranSky'
import { pathFor } from '../seo/routes'
import '../styles/QiblaAR.css'
import '../styles/HilalAR.css'

const FOV_H = 55, FOV_V = 75
const T = {
  // lang-ok[Kamera,Kameranı,kamera,kamerada]: az dilinin öz sözüdür (kamera)
  az: { title: 'Ayı kamerada tap', close: 'Bağla', below: 'Ay indi üfüqün altındadır', alt: 'hündürlük', dir: 'istiqamət', lit: 'işıqlı', hold: 'Telefonu dik tutun və Ayın olduğu tərəfə çevirin', found: 'Ay buradadır', note: 'Astronomik hesabdır (~1°) — hilalın görülməsi (ru’yət) yerinə keçmir.', noCam: 'Kameranı açmaq olmadı. Brauzerdə kamera icazəsini yoxlayın.', noSensor: 'Kompas sensoru cavab vermir.', sky: 'Quranın səması', belowB: (n) => `${n} indi üfüqün altındadır`, foundB: (n) => `${n} buradadır`, holdB: (n) => `Telefonu dik tutun və oxla ${n} tərəfə çevirin`, sunWarn: 'Günəşə birbaşa baxmayın — ekranda yerini görmək kifayətdir.', read: 'Ayəni oxu', skyNote: 'Astronomik hesabdır (~1°). Yalnız Quranın adını çəkdiyi göy cisimləri göstərilir; ərəbcə «əş-Şira» — Sirius ulduzunun adıdır.', up: 'yuxarı', down: 'aşağı' },
  en: { title: 'Find the moon with the camera', close: 'Close', below: 'The moon is below the horizon now', alt: 'altitude', dir: 'direction', lit: 'lit', hold: 'Hold the phone upright and turn towards the moon', found: 'The moon is here', note: 'Astronomical calculation (~1°) — it does not replace sighting the crescent (ru’yah).', noCam: 'Could not open the camera. Check the camera permission in your browser.', noSensor: 'The compass sensor is not responding.', sky: 'The sky of the Quran', belowB: (n) => `The ${n} is below the horizon now`, foundB: (n) => `The ${n} is here`, holdB: (n) => `Hold the phone upright and follow the arrow to the ${n}`, sunWarn: 'Do not look straight at the sun — seeing its place on the screen is enough.', read: 'Read the ayah', skyNote: 'Astronomical calculation (~1°). Only the heavenly bodies the Quran names are shown; in Arabic, “ash-Shi‘ra” is the name of the star Sirius.', up: 'up', down: 'down' },
  ru: { title: 'Найти луну камерой', close: 'Закрыть', below: 'Луна сейчас под горизонтом', alt: 'высота', dir: 'направление', lit: 'освещено', hold: 'Держите телефон вертикально и повернитесь к луне', found: 'Луна здесь', note: 'Астрономический расчёт (~1°) — не заменяет наблюдение молодого месяца (ру’ят).', noCam: 'Не удалось открыть камеру. Проверьте разрешение камеры.', noSensor: 'Компас не отвечает.', sky: 'Небо Корана', belowB: (n) => `${n} сейчас под горизонтом`, foundB: (n) => `${n} здесь`, holdB: (n) => `Держите телефон вертикально и следуйте стрелке: ${n}`, sunWarn: 'Не смотрите прямо на солнце — достаточно увидеть его место на экране.', read: 'Читать аят', skyNote: 'Астрономический расчёт (~1°). Показаны только небесные тела, которые Коран называет по имени; по-арабски «аш-Шира» — название звезды Сириус.', up: 'выше', down: 'ниже' },
  ar: { title: 'اعثر على القمر بالكاميرا', close: 'إغلاق', below: 'القمر الآن تحت الأفق', alt: 'الارتفاع', dir: 'الاتجاه', lit: 'مضاء', hold: 'أمسك الهاتف عموديًا واستدر نحو القمر', found: 'القمر هنا', note: 'حساب فلكي (~1°) — لا يغني عن رؤية الهلال.', noCam: 'تعذّر فتح الكاميرا. تحقّق من إذن الكاميرا.', noSensor: 'حساس البوصلة لا يستجيب.', sky: 'سماء القرآن', belowB: (n) => `${n} الآن تحت الأفق`, foundB: (n) => `${n} هنا`, holdB: (n) => `أمسك الهاتف عموديًا واتبع السهم نحو ${n}`, sunWarn: 'لا تنظر إلى الشمس مباشرة — يكفي أن ترى موضعها على الشاشة.', read: 'اقرأ الآية', skyNote: 'حساب فلكي (~1°). تُعرض فقط الأجرام التي سمّاها القرآن؛ والشِّعرى اسم نجم «سيريوس».', up: 'أعلى', down: 'أسفل' },
  tr: { title: 'Ayı kamerayla bul', close: 'Kapat', below: 'Ay şu an ufkun altında', alt: 'yükseklik', dir: 'yön', lit: 'aydınlık', hold: 'Telefonu dik tutun ve Ay’ın olduğu yöne dönün', found: 'Ay burada', note: 'Astronomik hesaptır (~1°) — hilalin görülmesinin (rü’yet) yerini tutmaz.', noCam: 'Kamera açılamadı. Tarayıcıda kamera iznini kontrol edin.', noSensor: 'Pusula sensörü yanıt vermiyor.', sky: 'Kur’an’ın göğü', belowB: (n) => `${n} şu an ufkun altında`, foundB: (n) => `${n} burada`, holdB: (n) => `Telefonu dik tutun ve oku izleyin: ${n}`, sunWarn: 'Güneş’e doğrudan bakmayın — ekranda yerini görmek yeterli.', read: 'Âyeti oku', skyNote: 'Astronomik hesaptır (~1°). Yalnızca Kur’an’ın adını andığı gök cisimleri gösterilir; Arapça «eş-Şi‘râ» Sirius yıldızının adıdır.', up: 'yukarı', down: 'aşağı' },
}
const CARD = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

// Göy cisminin üfüqi koordinatları (refraksiya ilə, ~0.1°) — Günəş və Sirius üçün
function refracted(alt) { return alt > -1 ? alt + 1.02 / Math.tan((alt + 10.3 / (alt + 5.11)) * Math.PI / 180) / 60 : alt }
function bodyPosition(id, date, lat, lng) {
  if (id === 'moon') return moonPosition(date, lat, lng)
  const ms = date.valueOf()
  let eq
  if (id === 'sun') { const s = sunEcliptic(ms); eq = toEquatorial(s.lon, 0, ms) } else eq = siriusNow(date)
  const h = horizontal(eq.ra, eq.dec, ms, lat, lng)
  return { az: h.az, alt: refracted(h.alt) }
}

export default function HilalAR({ lang = 'az', onClose, mode = 'moon' }) {
  const t = pickUi(T, lang)
  const videoRef = useRef(null)
  const markRef = useRef(null)
  const closeRef = useRef(null)
  const [err, setErr] = useState(null)
  const [moon, setMoon] = useState(null)       // { az, alt }
  const [state, setState] = useState(null)     // { found, edge: 'l'|'r'|'u'|'d'|null }
  const sky = mode === 'sky'
  const [bodyId, setBodyId] = useState('moon')
  const body = SKY_BODIES.find(b => b.id === bodyId) || SKY_BODIES[0]
  const bname = pickUi(body.name, lang)
  const loc = typeof window === 'undefined' ? null : getPrayerLocation()
  const ph = moonPhase(new Date())

  useEffect(() => {
    if (!loc) return undefined
    const upd = () => setMoon(bodyPosition(bodyId, new Date(), loc.lat, loc.lng))
    upd()
    const id = setInterval(upd, 1000)
    return () => clearInterval(id)
  }, [loc?.lat, loc?.lng, bodyId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let stream = null, alive = true
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then(s => { if (!alive) { s.getTracks().forEach(tr => tr.stop()); return } stream = s; const v = videoRef.current; if (v) { v.srcObject = s; v.play?.().catch(() => {}) } })
      .catch(() => alive && setErr('cam'))
    return () => { alive = false; stream?.getTracks().forEach(tr => tr.stop()) }
  }, [])

  const moonRef = useRef(moon); moonRef.current = moon
  useEffect(() => {
    let head = null, raw = null, pitch = 0, raf = 0, gotAbs = false, last = ''
    const take = (e) => {
      const h = typeof e.webkitCompassHeading === 'number' ? e.webkitCompassHeading : cameraHeading(e.alpha, e.beta, e.gamma)
      if (h != null && Number.isFinite(h)) raw = h
      if (Number.isFinite(e.beta)) pitch = pitch * 0.8 + (e.beta - 90) * 0.2
    }
    const onAbs = (e) => { gotAbs = true; take(e) }
    const onRel = (e) => { if (!gotAbs) take(e) }
    window.addEventListener('deviceorientationabsolute', onAbs, true)
    window.addEventListener('deviceorientation', onRel, true)
    const noSensor = setTimeout(() => { if (raw == null) setErr(x => x || 'sensor') }, 4000)
    const tick = () => {
      const m = moonRef.current
      if (raw != null && m && markRef.current) {
        head = smoothAngle(head, raw)
        const dx = angleDiff(m.az, head), dy = m.alt - pitch
        const x = 50 + (dx / FOV_H) * 100, y = 50 - (dy / FOV_V) * 100
        const inView = x > 0 && x < 100 && y > 0 && y < 100
        markRef.current.style.transform = `translate(${Math.max(4, Math.min(96, x)) - 50}vw, ${Math.max(6, Math.min(94, y)) - 50}vh)`
        markRef.current.style.opacity = inView ? '1' : '0'
        const edge = inView ? '' : Math.abs(dx) / FOV_H > Math.abs(dy) / FOV_V ? (dx < 0 ? 'l' : 'r') : (dy > 0 ? 'u' : 'd')
        const found = inView && Math.abs(dx) < 6 && Math.abs(dy) < 8
        const key = `${edge}|${found}`
        if (key !== last) { last = key; setState({ found, edge: edge || null }) }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); clearTimeout(noSensor); window.removeEventListener('deviceorientationabsolute', onAbs, true); window.removeEventListener('deviceorientation', onRel, true) }
  }, [])

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  const below = moon && moon.alt < -1
  const card = moon ? CARD[Math.round(moon.az / 45) % 8] : ''
  const litPct = Math.round((ph?.illumination || 0) * 100)

  return createPortal(
    <div className={`qar hlr${state?.found ? ' is-aligned' : ''}${sky ? ` is-sky is-${bodyId}` : ''}`} role="dialog" aria-modal="true" aria-label={sky ? t.sky : t.title} dir="ltr" data-testid={sky ? 'quran-sky' : 'hilal-ar'}>
      <video ref={videoRef} className="qar__video" playsInline muted autoPlay aria-hidden="true" />
      <div className="qar__shade" aria-hidden="true" />
      <header className="qar__top">
        <span className="qar__title">{sky ? t.sky : t.title}</span>
        <button type="button" ref={closeRef} className="ui-btn ui-btn--inverse ui-btn--sm" onClick={onClose}><Icon name="close" className="ui-btn__icon" /> {t.close}</button>
      </header>
      {sky && (
        <div className="hlr__bodies" role="group" aria-label={t.sky}>
          {SKY_BODIES.map(b => (
            <button key={b.id} type="button" className="hlr__body" aria-pressed={bodyId === b.id} onClick={() => setBodyId(b.id)} data-testid={`sky-${b.id}`}>
              <span lang="ar">{b.ar}</span> {pickUi(b.name, lang)}
            </button>
          ))}
        </div>
      )}
      <div className="hlr__mark" ref={markRef} aria-hidden="true">
        {bodyId === 'moon' ? <span className="hlr__moon" style={{ '--lit': `${Math.max(8, litPct)}%` }} />
          : <span className={bodyId === 'sun' ? 'hlr__sun' : 'hlr__star'} />}
        <span className="hlr__ring" />
      </div>
      {state?.edge && !below && (
        <div className={`hlr__edge hlr__edge--${state.edge}`} aria-hidden="true"><Icon name="arrow" size={26} /></div>
      )}
      <footer className="qar__bottom" aria-live="polite">
        {err === 'cam' ? <p className="qar__msg">{t.noCam}</p>
          : err === 'sensor' ? <p className="qar__msg">{t.noSensor}</p>
          : below ? <p className="qar__msg"><b>{sky ? t.belowB(bname) : t.below}</b></p>
          : <p className="qar__msg">{state?.found ? <b>{sky ? t.foundB(bname) : t.found}</b> : sky ? t.holdB(bname) : t.hold}</p>}
        {moon && (
          <p className="hlr__data ui-num" data-testid="hlr-data">
            {t.dir}: {Math.round(moon.az)}° {card} · {t.alt}: {Math.round(moon.alt)}°{bodyId === 'moon' ? ` · ${litPct}% ${t.lit}` : ''}
          </p>
        )}
        {sky && (
          <div className={`hlr__ayahs${state?.found || below ? ' is-open' : ''}`} data-testid="sky-ayahs">
            {body.ayahs.map(([ref, ar]) => {
              const [s, n] = ref.split(':').map(Number)
              return (
                <p key={ref} className="hlr__ayah">
                  <span className="ui-arabic" lang="ar" dir="rtl">{ar} ﴿{n}﴾</span>
                  <a className="hlr__read" href={`${pathFor('quran', lang, s)}?a=${n}`}>{t.read} · <bdi className="ui-num">{ref}</bdi></a>
                </p>
              )
            })}
          </div>
        )}
        {sky && bodyId === 'sun' && <p className="qar__privacy hlr__warn">{t.sunWarn}</p>}
        <p className="qar__privacy">{sky ? t.skyNote : t.note}</p>
      </footer>
    </div>,
    document.body,
  )
}
