// ═══════════════════════════════════════════════════════
// NightSkyPoster (v7.3) — "Ayə ilə ulduzlu gecə kartı"
//
// • İstifadəçi tarix, saat (standart 21:00) və yer seçir (standart — namaz şəhəri,
//   utils/prayerLocation; axtarış — searchCities). Kart həmin gecənin əsl göyünü
//   çəkir: ulduzlar və bürc xətləri (/data/sky/sky.json — HYG), Ay öz yerində və
//   əsl fazası ilə (utils/lunar — Meeus), planetlər (utils/skyMath — JPL).
//   Zenit mərkəzdə stereoqrafik dairəvi xəritə, üfüq — qızılı halqa.
// • Altında: göy və gecə barədə seçilmiş ayə — Osmani mətni və saytın rəsmi
//   tərcüməsi hərfi-hərfinə (public/data/sky-ayahs, scripts/build-sky-ayahs.mjs),
//   yer, tarix, koordinatlar və istəyə görə şəxsi sətir (ən çox 60 simvol).
// • PNG: A4 poster (2480×3508, 300 dpi) və story (1080×1920); Web Share ilə paylaşma.
// • Kətan yalnız seçim dəyişəndə çəkilir (animasiya yoxdur).
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { getPrayerLocation, searchCities } from '../utils/prayerLocation'
import { SKY_AYAHS, FORMATS, ayahKey, ayahLabel, ayahText, cleanLine, drawPoster, fmtCoords, skyScene, zonedDate, zonedToUtc, MAX_LINE } from '../utils/nightPoster'
import { canShareFile, preopenWindow, saveBlob } from '../utils/quoteCard'
import { getSurahLocal } from '../data/surahNamesAz'
import { SURAH_TABLE } from '../data/mushafIndex'
import { dirOf } from '../seo/routes'
import { pickUi } from '../utils/uiText'
import { useLang } from '../contexts/LangContext'
import Icon from './Icon'
import '../styles/NightSkyPoster.css'

const T = {
  az: { ey: 'Ulduzlu gecə', title: 'Ayə ilə ulduzlu gecə kartı', lead: 'Sizin üçün əziz olan bir gecəni seçin — toy, uşağın doğulduğu gün, ilk Ramazan. Kart həmin gecə həmin yerin göyünü olduğu kimi çəkir: ulduzlar, bürclər və Ay öz fazası ilə. Altına göy barədə bir ayə qoyun.', date: 'Tarix', time: 'Saat', place: 'Yer', search: 'Şəhər axtarın…', none: 'Tapılmadı', line: 'Şəxsi sətir (istəyə görə)', linePh: 'Məsələn: Toyumuz · Əli dünyaya gəldi', ayah: 'Ayə', format: 'Ölçü', a4: 'A4 plakat', story: 'Story', download: 'PNG yüklə', share: 'Paylaş', busy: 'Hazırlanır…', day: 'Bu saatda göy hələ işıqlıdır — xəritə ulduzları yenə göstərir.', moonDown: 'Ay bu saatda üfüqdən aşağıdadır.', fig: 'Ulduzlu göy xəritəsi', N: 'Şm', E: 'Ş', S: 'C', W: 'Q', src: 'Ulduzlar: HYG bazası (CC BY-SA); Ay: Meeus; planetlər: JPL. Ayə mətni və tərcümə — saytın Quran nəşrindən.', loading: 'Göy yüklənir…' }, // lang-ok[HYG,BY-SA,JPL,Meeus,Story,PNG,A4,A]: mənbə və format adları
  en: { ey: 'Starry night', title: 'Starry night card with an ayah', lead: 'Pick a night that matters to you — a wedding, the day a child was born, a first Ramadan. The card draws the real sky over that place on that night: stars, constellations and the Moon in its phase. Add a verse about the heavens beneath it.', date: 'Date', time: 'Time', place: 'Place', search: 'Search a city…', none: 'Nothing found', line: 'Personal line (optional)', linePh: 'e.g. Our wedding · Ali was born', ayah: 'Verse', format: 'Size', a4: 'A4 poster', story: 'Story', download: 'Download PNG', share: 'Share', busy: 'Preparing…', day: 'The sky is still light at this hour — the chart shows the stars anyway.', moonDown: 'The Moon is below the horizon at this hour.', fig: 'Star chart', N: 'N', E: 'E', S: 'S', W: 'W', src: 'Stars: HYG database (CC BY-SA); Moon: Meeus; planets: JPL. Verse text and translation from the site’s Quran edition.', loading: 'Loading the sky…' },
  ru: { ey: 'Звёздная ночь', title: 'Карта звёздной ночи с аятом', lead: 'Выберите дорогую вам ночь — свадьбу, день рождения ребёнка, первый Рамадан. Карта рисует настоящее небо над этим местом в ту ночь: звёзды, созвездия и Луну в её фазе. Внизу — аят о небе.', date: 'Дата', time: 'Время', place: 'Место', search: 'Найти город…', none: 'Ничего не найдено', line: 'Личная строка (необязательно)', linePh: 'Например: Наша свадьба · Родился Али', ayah: 'Аят', format: 'Размер', a4: 'Постер A4', story: 'Сторис', download: 'Скачать PNG', share: 'Поделиться', busy: 'Готовится…', day: 'В этот час небо ещё светлое — карта всё равно показывает звёзды.', moonDown: 'Луна в этот час под горизонтом.', fig: 'Карта звёздного неба', N: 'С', E: 'В', S: 'Ю', W: 'З', src: 'Звёзды: база HYG (CC BY-SA); Луна: Меёс; планеты: JPL. Текст аята и перевод — из издания Корана на сайте.', loading: 'Загрузка неба…' }, // lang-ok[A,A4,PNG,HYG,BY-SA,JPL,CC]: format və mənbə adları
  ar: { ey: 'ليلة مرصّعة بالنجوم', title: 'بطاقة ليلة النجوم مع آية', lead: 'اختر ليلة عزيزة عليك — زفافًا، أو يوم ولادة طفل، أو أول رمضان. ترسم البطاقة سماء ذلك المكان في تلك الليلة كما كانت: النجوم والأبراج والقمر في طوره، وتحتها آية عن السماء.', date: 'التاريخ', time: 'الساعة', place: 'المكان', search: 'ابحث عن مدينة…', none: 'لا نتائج', line: 'سطر شخصي (اختياري)', linePh: 'مثلًا: زفافنا · وُلد علي', ayah: 'الآية', format: 'المقاس', a4: 'ملصق A4', story: 'قصة', download: 'تنزيل PNG', share: 'مشاركة', busy: 'جارٍ التحضير…', day: 'السماء ما زالت مضيئة في هذه الساعة — والخريطة تُظهر النجوم مع ذلك.', moonDown: 'القمر تحت الأفق في هذه الساعة.', fig: 'خريطة السماء', N: 'ش', E: 'شر', S: 'ج', W: 'غ', src: 'النجوم: قاعدة HYG؛ القمر: ميوس؛ الكواكب: JPL. نص الآية من مصحف الموقع.', loading: 'جارٍ تحميل السماء…' }, // lang-ok[A,A4,PNG,HYG,JPL]: format və mənbə adları
  tr: { ey: 'Yıldızlı gece', title: 'Ayetli yıldızlı gece kartı', lead: 'Sizin için değerli bir geceyi seçin — düğün, çocuğun doğduğu gün, ilk Ramazan. Kart o gece o yerin gerçek gökyüzünü çizer: yıldızlar, takımyıldızlar ve evresiyle Ay. Altına gökyüzüyle ilgili bir ayet koyun.', date: 'Tarih', time: 'Saat', place: 'Yer', search: 'Şehir arayın…', none: 'Bulunamadı', line: 'Kişisel satır (isteğe bağlı)', linePh: 'Örn.: Düğünümüz · Ali doğdu', ayah: 'Ayet', format: 'Boyut', a4: 'A4 poster', story: 'Story', download: 'PNG indir', share: 'Paylaş', busy: 'Hazırlanıyor…', day: 'Bu saatte gökyüzü henüz aydınlık — harita yıldızları yine de gösterir.', moonDown: 'Ay bu saatte ufkun altında.', fig: 'Yıldız haritası', N: 'K', E: 'D', S: 'G', W: 'B', src: 'Yıldızlar: HYG veritabanı (CC BY-SA); Ay: Meeus; gezegenler: JPL. Ayet metni ve meali sitenin Kur’an baskısından.', loading: 'Gökyüzü yükleniyor…' },
}
const PLANET = {
  mercury: { az: 'Merkuri', en: 'Mercury', ru: 'Меркурий', ar: 'عطارد', tr: 'Merkür' }, // lang-ok: planet adları
  venus: { az: 'Venera', en: 'Venus', ru: 'Венера', ar: 'الزهرة', tr: 'Venüs' }, // lang-ok: planet adları
  mars: { az: 'Mars', en: 'Mars', ru: 'Марс', ar: 'المريخ', tr: 'Mars' }, // lang-ok: planet adları
  jupiter: { az: 'Yupiter', en: 'Jupiter', ru: 'Юпитер', ar: 'المشتري', tr: 'Jüpiter' }, // lang-ok: planet adları
  saturn: { az: 'Saturn', en: 'Saturn', ru: 'Сатурн', ar: 'زحل', tr: 'Satürn' }, // lang-ok: planet adları
}
const PREVIEW = { a4: [900, 1273], story: [720, 1280] }
const DEFAULT_AYAH = '25:61'

let skyP = null
const loadSky = () => (skyP ||= fetch('/data/sky/sky.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json() }).catch(e => { skyP = null; throw e }))
const ayahCache = new Map()
const loadAyahs = (f) => {
  if (!ayahCache.has(f)) ayahCache.set(f, fetch(`/data/sky-ayahs/${f}.json`).then(r => { if (!r.ok) throw new Error(r.status); return r.json() }).catch(e => { ayahCache.delete(f); throw e }))
  return ayahCache.get(f)
}
const labelOf = (l, lang) => (typeof l === 'string' ? l : pickUi(l || {}, lang, 'en') || '')
const surahName = (n, lang) => getSurahLocal(n, lang)?.name || SURAH_TABLE[n - 1]?.[lang === 'ar' ? 4 : 5] || ''

function ensureFonts() {
  if (typeof document === 'undefined' || !document.fonts?.load) return Promise.resolve()
  return Promise.all([
    document.fonts.load('400 40px Amiri', 'بسم'),
    document.fonts.load('500 40px Inter', 'Aa'),
    document.fonts.load('700 40px Inter', 'Aa'),
  ]).then(() => undefined, () => undefined)
}

export default function NightSkyPoster() {
  const { lang } = useLang()
  const u = pickUi(T, lang, 'en')
  const init = useMemo(() => {
    const l = typeof window === 'undefined' ? null : getPrayerLocation()
    return l ? { lat: l.lat, lng: l.lng, tz: l.tz, label: l.city } : { lat: 40.3953, lng: 49.8822, tz: 'Asia/Baku', label: { az: 'Bakı', en: 'Baku', ru: 'Баку', ar: 'باكو', tr: 'Bakü' } } // lang-ok[Bakü]: tr adı
  }, [])
  const [place, setPlace] = useState(init)
  const [date, setDate] = useState(() => zonedDate(Date.now(), init.tz))
  const [time, setTime] = useState('21:00')
  const [q, setQ] = useState('')
  const [line, setLine] = useState('')
  const [pick, setPick] = useState(DEFAULT_AYAH)
  const [fmt, setFmt] = useState('a4')
  const [sky, setSky] = useState(null)
  const [texts, setTexts] = useState(null)
  const [fonts, setFonts] = useState(false)
  const [busy, setBusy] = useState(false)
  const cvs = useRef(null)

  useEffect(() => {
    let alive = true
    loadSky().then(d => { if (alive) setSky(d) }).catch(() => {})
    ensureFonts().then(() => { if (alive) setFonts(true) })
    return () => { alive = false }
  }, [])
  useEffect(() => {
    let alive = true
    loadAyahs(lang).catch(() => loadAyahs('en')).then(d => { if (alive) setTexts(d) }).catch(() => {})
    return () => { alive = false }
  }, [lang])

  const ms = zonedToUtc(date, time, place.tz)
  const scene = useMemo(() => (sky && Number.isFinite(ms) ? skyScene(sky, ms, place.lat, place.lng) : null), [sky, ms, place.lat, place.lng])
  const results = useMemo(() => (q.trim() ? searchCities(q).slice(0, 6) : []), [q])
  const entry = SKY_AYAHS.find(x => ayahKey(x) === pick) || SKY_AYAHS[0]
  const placeName = labelOf(place.label, lang)

  const poster = useMemo(() => {
    const at = ayahText(entry, texts)
    let dateLine = `${date} · ${time}`
    try {
      const d = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: place.tz || undefined }).format(new Date(ms))
      dateLine = `${d} · ${time}`
    } catch { /* köhnə brauzer — ISO tarix qalır */ }
    return {
      scene,
      place: placeName,
      dateLine,
      coords: fmtCoords(place.lat, place.lng),
      line,
      ayah: at ? { ar: at.ar, tr: at.tr, by: at.by, ref: `${surahName(entry.s, lang)} ${ayahLabel(entry)}` } : null,
      labels: { N: u.N, E: u.E, S: u.S, W: u.W },
      planetNames: Object.fromEntries(Object.entries(PLANET).map(([k, v]) => [k, pickUi(v, lang, 'en')])),
      rtl: dirOf(lang) === 'rtl',
    }
  }, [scene, placeName, date, time, ms, place, line, entry, texts, lang, u])

  // Önizləmə — yalnız dəyişəndə çəkilir
  useEffect(() => {
    const c = cvs.current
    if (!c || !scene) return
    const [w, h] = PREVIEW[fmt]
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h }
    const g = c.getContext('2d')
    if (g) drawPoster(g, w, h, poster)
  }, [poster, fmt, scene, fonts])

  const render = async () => {
    await ensureFonts()
    const { w, h } = FORMATS[fmt]
    const c = document.createElement('canvas')
    c.width = w; c.height = h
    drawPoster(c.getContext('2d'), w, h, poster)
    return new Promise(res => c.toBlob(res, 'image/png'))
  }
  const fileName = `night-sky-${date}-${fmt}-muslims-cc.png`
  const download = async () => {
    const win = preopenWindow()
    setBusy(true)
    try { const b = await render(); if (b) saveBlob(b, fileName, win) } finally { setBusy(false) }
  }
  const share = async () => {
    setBusy(true)
    try {
      const b = await render()
      if (!b) return
      const file = new File([b], fileName, { type: 'image/png' })
      if (canShareFile(file)) {
        try { await navigator.share({ files: [file], title: u.title }) } catch { /* istifadəçi imtina etdi */ }
      } else saveBlob(b, fileName)
    } finally { setBusy(false) }
  }
  const choose = (c) => { setPlace({ lat: c.lat, lng: c.lng, tz: c.tz, label: c.label }); setQ('') }

  return (
    <section className="ui-card np" aria-labelledby="np-title" data-testid="night-poster">
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 id="np-title" className="np__title">{u.title}</h2>
      <p className="np__lead">{u.lead}</p>
      <div className="np__grid">
        <div className="np__form">
          <div className="np__row">
            <label className="np__field">
              <span>{u.date}</span>
              <input type="date" className="np__input" value={date} onChange={e => e.target.value && setDate(e.target.value)} data-testid="np-date" />
            </label>
            <label className="np__field">
              <span>{u.time}</span>
              <input type="time" className="np__input" value={time} onChange={e => e.target.value && setTime(e.target.value)} data-testid="np-time" />
            </label>
          </div>
          <div className="np__field np__place">
            <span id="np-place-l">{u.place}: <b>{placeName}</b></span>
            <div className="np__search">
              <Icon name="search" size={16} className="np__sicon" />
              <input type="search" className="np__input" value={q} onChange={e => setQ(e.target.value)} placeholder={u.search} aria-labelledby="np-place-l" data-testid="np-city" />
            </div>
            {q.trim() && (
              <ul className="np__results" data-testid="np-results">
                {results.length ? results.map(c => (
                  <li key={c.id}><button type="button" className="np__res" onClick={() => choose(c)}><Icon name="pin" size={14} /> {labelOf(c.label, lang)}</button></li>
                )) : <li className="np__none">{u.none}</li>}
              </ul>
            )}
          </div>
          <label className="np__field">
            <span>{u.line}</span>
            <input type="text" className="np__input" value={line} maxLength={MAX_LINE} onChange={e => setLine(cleanLine(e.target.value))} placeholder={u.linePh} data-testid="np-line" />
            <small className="np__count ui-num">{Array.from(line).length}/{MAX_LINE}</small>
          </label>
          <div className="np__field">
            <span>{u.ayah}</span>
            <div className="np__chips" role="group" aria-label={u.ayah}>
              {SKY_AYAHS.map(x => {
                const k = ayahKey(x)
                return (
                  <button key={k} type="button" className="ui-chip" aria-pressed={pick === k} data-ayah={k} onClick={() => setPick(k)}>
                    {surahName(x.s, lang)} <span className="ui-num">{ayahLabel(x)}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="np__field">
            <span>{u.format}</span>
            <div className="np__chips" role="group" aria-label={u.format}>
              {['a4', 'story'].map(f => (
                <button key={f} type="button" className="ui-chip" aria-pressed={fmt === f} data-format={f} onClick={() => setFmt(f)}>{u[f]}</button>
              ))}
            </div>
          </div>
          <div className="np__btns">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={download} disabled={busy || !scene} data-testid="np-download">
              <Icon name="download" className="ui-btn__icon" /> {busy ? u.busy : u.download}
            </button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={share} disabled={busy || !scene} data-testid="np-share">
              <Icon name="share" className="ui-btn__icon" /> {u.share}
            </button>
          </div>
          {scene && scene.sunAlt > -12 && <p className="np__note" role="status">{u.day}</p>}
          {scene && !scene.moon.up && <p className="np__note">{u.moonDown}</p>}
        </div>
        <figure className={`np__stage np__stage--${fmt}`}>
          <canvas ref={cvs} className="np__cvs" role="img" aria-label={`${u.fig} — ${placeName}, ${poster.dateLine}`} data-format={fmt} />
          {!scene && <p className="np__loading">{u.loading}</p>}
        </figure>
      </div>
      <p className="np__src">{u.src}</p>
    </section>
  )
}
