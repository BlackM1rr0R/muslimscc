// ═══════════════════════════════════════════════════════
// RasdQibla (v6.3) — "Günəş Kəbənin üstündə" (/qibla)
//
//   <RasdQibla lang="az" />
//
// • Növbəti anlar (utils/rasdQibla.js): Günəş Kəbənin üstündə (may, iyul) — kölgə qiblənin
//   ƏKSİNƏ; Kəbənin əks nöqtəsinin üstündə (yanvar, noyabr) — kölgə QİBLƏYƏ.
// • Geri sayım; sizin şəhərdə saat neçədir və Günəş görünürmü; yuxarıdan baxış səhnəsi:
//   çubuq, kölgə (hadisədən 2 saat əvvəldən axır), qiblə xətti — hadisə anında üst-üstə düşür.
// • Hərəkət azaldılıbsa — səhnə düz hadisə anında dayanır, sürüşdürücü ilə idarə olunur.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { rasdEvents, bearing, shadowAt, KAABA } from '../utils/rasdQibla'
import { getPrayerLocation } from '../utils/prayerLocation'
import { G_MONTHS } from '../utils/hijri'
import '../styles/RasdQibla.css'

const T = {
  az: { ey: 'Rəsdül-qiblə', title: 'Günəş Kəbənin üstündə', lead: 'İldə iki dəfə Günəş Kəbənin düz üstündən keçir. O an Günəşi görən hər yerdə dik çubuğun kölgəsi qiblənin tam əksinə düşür — Günəşə üz tutan qibləyə üz tutmuş olur. Yanvar və noyabrda isə Günəş Kəbənin əks tərəfindədir və kölgə qibləni göstərir.',
    next: 'Növbəti an', over: 'Günəş Kəbənin üstündə — Günəşə üz tutun', under: 'Günəş Kəbənin əks tərəfində — kölgə qibləni göstərir', d: 'gün', h: 'saat', m: 'dəq', s: 'san',
    yourCity: 'Sizin şəhərdə', makkah: 'Məkkə vaxtı', sunAlt: 'Günəşin hündürlüyü', notVisible: 'Bu an Günəş sizin şəhərdə üfüqün altındadır — burada görünmür.', low: 'Günəş alçaqdır — kölgə çox uzun olacaq.',
    upcoming: 'Növbəti anlar', qibla: 'Qiblə', shadow: 'Kölgə', stick: 'Çubuq', before: 'əvvəl', after: 'sonra', now: 'an', play: 'Göstər', pause: 'Dayandır',
    // lang-ok[Meeus]: astronomun adı (Jean Meeus)
    how: 'Necə yoxlamalı: düz yerə dik çubuq (və ya qapı kənarı, sütun) qoyun, göstərilən dəqiqədə kölgəyə baxın. Kölgənin əksi (may, iyul) və ya özü (yanvar, noyabr) qiblədir.', src: 'Astronomik hesab (Meeus) — dəqiqlik ~1 dəqiqə.', fig: 'Yuxarıdan görünüş: çubuq, kölgə və qiblə xətti' },
  en: { ey: 'Rasd al-qiblah', title: 'The sun over the Kaaba', lead: 'Twice a year the sun passes straight over the Kaaba. At that moment, wherever the sun is visible, the shadow of an upright stick points exactly away from the qiblah — facing the sun is facing the qiblah. In January and November the sun is over the opposite side of the Earth, and the shadow points to the qiblah.',
    next: 'Next moment', over: 'Sun over the Kaaba — face the sun', under: 'Sun opposite the Kaaba — the shadow points to the qiblah', d: 'd', h: 'h', m: 'min', s: 's',
    yourCity: 'In your city', makkah: 'Makkah time', sunAlt: 'Sun’s altitude', notVisible: 'At this moment the sun is below the horizon in your city — it is not visible here.', low: 'The sun is low — the shadow will be very long.',
    upcoming: 'Upcoming moments', qibla: 'Qiblah', shadow: 'Shadow', stick: 'Stick', before: 'before', after: 'after', now: 'moment', play: 'Show', pause: 'Pause',
    how: 'How to check: stand an upright stick (or a door edge, a pillar) on level ground and look at its shadow at the given minute. The opposite of the shadow (May, July) or the shadow itself (January, November) is the qiblah.', src: 'Astronomical calculation (Meeus) — accurate to about 1 minute.', fig: 'View from above: stick, shadow and qiblah line' },
  ru: { ey: 'Расд аль-кибла', title: 'Солнце над Каабой', lead: 'Дважды в год Солнце проходит прямо над Каабой. В этот момент везде, где видно Солнце, тень вертикального шеста указывает точно в сторону, противоположную кибле, — повернувшись к Солнцу, вы повернётесь к кибле. В январе и ноябре Солнце над противоположной стороной Земли, и тень указывает на киблу.',
    next: 'Следующий момент', over: 'Солнце над Каабой — повернитесь к Солнцу', under: 'Солнце напротив Каабы — тень указывает на киблу', d: 'дн', h: 'ч', m: 'мин', s: 'с',
    yourCity: 'В вашем городе', makkah: 'Время Мекки', sunAlt: 'Высота Солнца', notVisible: 'В этот момент в вашем городе Солнце под горизонтом — здесь не видно.', low: 'Солнце низко — тень будет очень длинной.',
    upcoming: 'Ближайшие моменты', qibla: 'Кибла', shadow: 'Тень', stick: 'Шест', before: 'до', after: 'после', now: 'момент', play: 'Показать', pause: 'Пауза',
    how: 'Как проверить: поставьте вертикальный шест (или посмотрите на край двери, колонну) на ровной земле и в указанную минуту посмотрите на тень. Противоположное тени направление (май, июль) или сама тень (январь, ноябрь) — это кибла.', src: 'Астрономический расчёт (Меус) — точность около 1 минуты.', fig: 'Вид сверху: шест, тень и линия киблы' },
  ar: { ey: 'رصد القبلة', title: 'الشمس فوق الكعبة', lead: 'تمرّ الشمس مرتين في السنة فوق الكعبة تمامًا. في تلك اللحظة، حيثما تُرى الشمس، يقع ظل العصا القائمة في عكس اتجاه القبلة تمامًا — فمن استقبل الشمس استقبل القبلة. وفي يناير ونوفمبر تكون الشمس فوق الجهة المقابلة للكعبة، فيشير الظل إلى القبلة.',
    next: 'اللحظة القادمة', over: 'الشمس فوق الكعبة — استقبل الشمس', under: 'الشمس مقابل الكعبة — الظل يشير إلى القبلة', d: 'يوم', h: 'س', m: 'د', s: 'ث',
    yourCity: 'في مدينتك', makkah: 'توقيت مكة', sunAlt: 'ارتفاع الشمس', notVisible: 'الشمس في تلك اللحظة تحت الأفق في مدينتك — لا تُرى هنا.', low: 'الشمس منخفضة — سيكون الظل طويلًا جدًا.',
    upcoming: 'اللحظات القادمة', qibla: 'القبلة', shadow: 'الظل', stick: 'العصا', before: 'قبل', after: 'بعد', now: 'اللحظة', play: 'اعرض', pause: 'إيقاف',
    how: 'طريقة التحقق: انصب عصا قائمة (أو انظر إلى حافة باب أو عمود) على أرض مستوية، وانظر إلى ظلها في الدقيقة المذكورة. عكس الظل (مايو ويوليو) أو الظل نفسه (يناير ونوفمبر) هو القبلة.', src: 'حساب فلكي (ميوس) — الدقة نحو دقيقة.', fig: 'منظر من الأعلى: العصا والظل وخط القبلة' },
  tr: { ey: 'Rasdü’l-kıble', title: 'Güneş Kâbe’nin üstünde', lead: 'Yılda iki kez Güneş tam Kâbe’nin üstünden geçer. O an Güneş’i gören her yerde dik bir çubuğun gölgesi kıblenin tam tersine düşer — Güneş’e dönen kıbleye dönmüş olur. Ocak ve kasımda ise Güneş Kâbe’nin karşı tarafındadır ve gölge kıbleyi gösterir.',
    next: 'Sıradaki an', over: 'Güneş Kâbe’nin üstünde — Güneş’e dönün', under: 'Güneş Kâbe’nin karşısında — gölge kıbleyi gösterir', d: 'gün', h: 'sa', m: 'dk', s: 'sn',
    yourCity: 'Şehrinizde', makkah: 'Mekke saati', sunAlt: 'Güneş’in yüksekliği', notVisible: 'Bu anda Güneş şehrinizde ufkun altında — burada görünmez.', low: 'Güneş alçak — gölge çok uzun olacak.',
    upcoming: 'Sıradaki anlar', qibla: 'Kıble', shadow: 'Gölge', stick: 'Çubuk', before: 'önce', after: 'sonra', now: 'an', play: 'Göster', pause: 'Durdur',
    how: 'Nasıl kontrol edilir: düz bir zemine dik bir çubuk koyun (veya kapı kenarına, sütuna bakın) ve belirtilen dakikada gölgesine bakın. Gölgenin tersi (mayıs, temmuz) veya gölgenin kendisi (ocak, kasım) kıbledir.', src: 'Astronomik hesap (Meeus) — doğruluk yaklaşık 1 dakika.', fig: 'Yukarıdan görünüm: çubuk, gölge ve kıble çizgisi' },
}
const SPAN = 120 * 60000   // səhnə: hadisədən 2 saat əvvəl → hadisə
const reduced = () => typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion'))

function partsIn(ms, tz) {
  try {
    const f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    const o = {}; for (const x of f.formatToParts(new Date(ms))) o[x.type] = x.value
    return { y: Number(o.year), m: Number(o.month) - 1, d: Number(o.day), hm: `${o.hour}:${o.minute}` }
  } catch { const d = new Date(ms); return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate(), hm: d.toTimeString().slice(0, 5) } }
}

export default function RasdQibla({ lang = 'az' }) {
  const t = pickUi(T, lang)
  const months = pickUi(G_MONTHS, lang)
  const loc = useMemo(() => (typeof window === 'undefined' ? null : getPrayerLocation()), [])
  const events = useMemo(() => rasdEvents(Date.now() - 3600000, 400), [])
  // Əsas kart: sizin şəhərdən görünən ilk an (Günəş üfüqdən ≥3° yuxarı); yoxdursa — ən yaxını
  const ev = useMemo(() => events.find(e => loc && (shadowAt(e.ms, loc.lat, loc.lng)?.alt ?? -1) >= 3) || events[0], [events, loc])
  const [now, setNow] = useState(() => Date.now())
  const [k, setK] = useState(1)                 // səhnə: 0 — 2 saat əvvəl, 1 — hadisə anı
  const [playing, setPlaying] = useState(false)
  const raf = useRef(0)

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
  const play = () => {
    if (reduced()) { setK(1); return }
    cancelAnimationFrame(raf.current)
    setPlaying(true)
    const t0 = performance.now()
    const step = (x) => { const p = Math.min(1, (x - t0) / 4000); setK(p); if (p < 1) raf.current = requestAnimationFrame(step); else setPlaying(false) }
    raf.current = requestAnimationFrame(step)
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  // Bölmə görünəndə bir dəfə oynasın
  const secRef = useRef(null)
  useEffect(() => {
    const el = secRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setK(0); play(); io.disconnect() } }, { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])  

  if (!ev) return null
  const tz = loc?.tz
  const left = Math.max(0, ev.ms - now)
  const cd = [Math.floor(left / 86400000), Math.floor(left / 3600000) % 24, Math.floor(left / 60000) % 60, Math.floor(left / 1000) % 60]
  const fmt = (ms, zone) => { const p = partsIn(ms, zone); return `${p.d} ${months[p.m]} ${p.y}, ${p.hm}` }
  const q = loc ? bearing(loc, KAABA) : null
  const atEv = loc ? shadowAt(ev.ms, loc.lat, loc.lng) : null
  const tScene = ev.ms - SPAN * (1 - k)
  const sh = loc ? shadowAt(tScene, loc.lat, loc.lng) : null
  const mins = Math.round((tScene - ev.ms) / 60000)

  // Səhnə: mərkəz 160,160; qiblə xətti, kölgə (uzunluğu məhdud)
  const C = 160, R0 = 130
  const pt = (deg, r) => [C + Math.sin(deg * Math.PI / 180) * r, C - Math.cos(deg * Math.PI / 180) * r]
  const shLen = sh ? Math.min(R0, 26 + sh.len * 46) : 0
  const [sx, sy] = sh ? pt(sh.dir, shLen) : [C, C]
  const [qx, qy] = q != null ? pt(q, R0) : [C, C]
  const [kx, ky] = q != null ? pt(q, R0 - 26) : [C, C]   // Kəbə nişanı — Günəşlə üst-üstə düşməsin
  const [ax, ay] = q != null ? pt(q + 180, R0) : [C, C]
  const [sunx, suny] = sh ? pt(sh.az, R0 + 10) : [C, C]

  return (
    <section className="ui-section ui-section--tight rqb-wrap" ref={secRef}>
      <div className="ui-container">
        <div className="rqb ui-card" data-testid="rasd-qibla">
          <div className="rqb__head">
            <span className="ui-eyebrow">{t.ey}</span>
            <h2 className="ui-title ui-title--sm">{t.title}</h2>
            <p className="ui-lead">{t.lead}</p>
          </div>
          <div className="rqb__grid">
            <div className="rqb__info">
              <span className={`rqb__kind is-${ev.kind}`} data-testid="rqb-kind"><Icon name="sun" size={16} /> {ev.kind === 'over' ? t.over : t.under}</span>
              <div className="rqb__cd ui-num" aria-label={t.next} data-testid="rqb-countdown">
                {cd.map((v, i) => <span key={i}><b>{String(v).padStart(i ? 2 : 1, '0')}</b><small>{[t.d, t.h, t.m, t.s][i]}</small></span>)}
              </div>
              <dl className="rqb__times">
                <div><dt>{t.yourCity}{loc?.city ? ` — ${pickUi(loc.city, lang)}` : ''}</dt><dd className="ui-num" data-testid="rqb-local">{fmt(ev.ms, tz)}</dd></div>
                <div><dt>{t.makkah}</dt><dd className="ui-num">{fmt(ev.ms, 'Asia/Riyadh')}</dd></div>
                {atEv && <div><dt>{t.sunAlt}</dt><dd className="ui-num">{Math.round(atEv.alt)}°</dd></div>}
              </dl>
              {loc && !atEv && <p className="rqb__warn" data-testid="rqb-invisible">{t.notVisible}</p>}
              {atEv && atEv.alt < 12 && <p className="rqb__warn">{t.low}</p>}
            </div>
            <figure className="rqb__scene" aria-label={t.fig}>
              <svg viewBox="0 0 320 320" role="img" aria-label={t.fig}>
                <circle cx={C} cy={C} r={R0 + 18} className="rqb__ground" />
                {[0, 90, 180, 270].map(d => { const [x, y] = pt(d, R0 + 8); return <text key={d} x={x} y={y + 4} textAnchor="middle" className="rqb__card">{['N', 'E', 'S', 'W'][d / 90]}</text> })}
                {q != null && (
                  <>
                    <line x1={C} y1={C} x2={qx} y2={qy} className="rqb__qline" />
                    <line x1={C} y1={C} x2={ax} y2={ay} className="rqb__qline is-anti" />
                    <g transform={`translate(${kx} ${ky})`}><rect x="-9" y="-9" width="18" height="18" rx="2" className="rqb__kaaba" /><rect x="-9" y="-5" width="18" height="3" className="rqb__band" /></g>
                    <text x={kx + (kx > C ? -22 : 22)} y={ky + 4} textAnchor="middle" className="rqb__lbl">{t.qibla}</text>
                  </>
                )}
                {sh && (
                  <>
                    <line x1={C} y1={C} x2={sx} y2={sy} className={`rqb__shadow${k >= 0.999 ? ' is-on' : ''}`} />
                    <circle cx={sunx} cy={suny} r="9" className="rqb__sun" />
                  </>
                )}
                <circle cx={C} cy={C} r="6" className="rqb__stick" />
              </svg>
              <figcaption className="rqb__cap">
                <input type="range" min="0" max="1" step="0.005" value={k} onChange={e => { cancelAnimationFrame(raf.current); setPlaying(false); setK(Number(e.target.value)) }} aria-label={t.fig} data-testid="rqb-range" />
                <span className="ui-num">{mins === 0 ? t.now : `${Math.abs(mins)} ${t.m} ${t.before}`}</span>
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={playing ? () => { cancelAnimationFrame(raf.current); setPlaying(false) } : () => { setK(0); play() }}>
                  <Icon name={playing ? 'pause' : 'play'} className="ui-btn__icon" /> {playing ? t.pause : t.play}
                </button>
              </figcaption>
            </figure>
          </div>
          <h3 className="rqb__h3">{t.upcoming}</h3>
          <ul className="rqb__list" data-testid="rqb-list">
            {events.slice(0, 4).map(e => (
              <li key={e.ms} className={`is-${e.kind}`}><b className="ui-num">{fmt(e.ms, tz)}</b> <span>{e.kind === 'over' ? t.over : t.under}</span></li>
            ))}
          </ul>
          <p className="rqb__note"><Icon name="info" size={14} /> {t.how}</p>
          <p className="rqb__note">{t.src}</p>
        </div>
      </div>
    </section>
  )
}
