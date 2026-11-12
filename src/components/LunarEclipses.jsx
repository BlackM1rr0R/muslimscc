// ═══════════════════════════════════════════════════════
// LunarEclipses (v6.5) — "Ay tutulmaları": növbəti tutulmalar və şəhərinizdən görünüb-görünməməsi (/calendar)
//
//   <LunarEclipses lang="az" lessonHref="/learn/kusuf-prayer" />
//
// • Vaxtlar — NASA (data/lunarEclipses.js), yalnız kölgə tutulmaları (qismən və tam), 2040-a qədər.
// • Görünmə — Ayın şəhərinizdəki hündürlüyü ilə (utils/eclipseVis.js, Meeus): kölgə fazası ərzində
//   Ay üfüqdən yuxarıdadırsa — görünür; faza ərzində doğur/batırsa — qismən.
// • Səhnə: Yerin kölgəsi (umbra) və Ayın ondan keçən yolu; sürüşdürmə ilə fazanın istənilən anı,
//   tam fazada Ay qırmızımtıl olur. Kölgənin ölçüsü təxminidir (Ay radiusunun ~2.7 misli), Ayın
//   kölgəyə nə qədər girdiyi isə NASA-nın kölgə fazasına (mag) görədir.
// • Tutulma namazı haqqında — saytın küsuf dərsinə keçid (hökm burada yazılmır).
// Stillər: src/styles/LunarEclipses.css
// ═══════════════════════════════════════════════════════
import { useMemo, useState, useEffect } from 'react'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { getPrayerLocation } from '../utils/prayerLocation'
import { G_MONTHS } from '../utils/hijri'
import { upcoming, visibility, moonAlt } from '../utils/eclipseVis'
import '../styles/LunarEclipses.css'

const T = {
  az: {
    ey: 'Ay tutulmaları', title: 'Növbəti Ay tutulması nə vaxtdır?', lead: c => `Ay Yerin kölgəsinə girəndə qaralır, tam tutulmada isə qırmızımtıl olur. Aşağıda 2040-a qədər bütün tutulmalar və onların şəhərinizdən${c ? ` (${c})` : ''} görünüb-görünməməsi.`,
    total: 'Tam tutulma', partial: 'Qismən tutulma', full: 'Şəhərinizdən görünəcək', part: 'Qismən görünəcək — Ay bu vaxt doğur və ya batır', none: 'Şəhərinizdən görünməyəcək — Ay üfüqün altında olacaq',
    days: n => `${n} gün qalıb`, today: 'Bu gün', start: 'Başlanğıc', totStart: 'Tam faza', totEnd: 'Tam fazanın sonu', max: 'Ən böyük faza', end: 'Son',
    moonAlt: 'Ayın hündürlüyü', below: 'Ay bu anda üfüqün altındadır', list: 'Bütün tutulmalar (2040-a qədər)', lesson: 'Tutulma namazı haqqında dərs',
    note: 'Vaxtlar: NASA (F. Espenak), dəqiqlik təxminən 1 dəq. Yarımkölgə tutulmaları gözlə demək olar seçilmir — siyahıda yoxdur. Görünmə Ayın şəhərinizdəki hündürlüyü ilə hesablanır.', // lang-ok[Espenak,NASA]: xüsusi ad
    scene: 'Ay Yerin kölgəsindən keçir', time: 'Vaxt', dur: 'Müddət', min: 'dəq', sel: 'Seçilmiş tutulma',
  },
  en: {
    ey: 'Lunar eclipses', title: 'When is the next lunar eclipse?', lead: c => `When the Moon enters the Earth’s shadow it darkens, and in a total eclipse it turns reddish. Below are all eclipses until 2040 and whether they can be seen from your city${c ? ` (${c})` : ''}.`,
    total: 'Total eclipse', partial: 'Partial eclipse', full: 'Visible from your city', part: 'Partly visible: the Moon rises or sets during it', none: 'Not visible from your city: the Moon will be below the horizon',
    days: n => `${n} days to go`, today: 'Today', start: 'Begins', totStart: 'Totality', totEnd: 'Totality ends', max: 'Greatest eclipse', end: 'Ends',
    moonAlt: 'Moon’s altitude', below: 'The Moon is below the horizon at this moment', list: 'All eclipses (until 2040)', lesson: 'Lesson on the eclipse prayer',
    note: 'Times: NASA (F. Espenak), accurate to about 1 min. Penumbral eclipses are hardly visible to the eye and are not listed. Visibility is calculated from the Moon’s altitude in your city.',
    scene: 'The Moon passes through the Earth’s shadow', time: 'Time', dur: 'Duration', min: 'min', sel: 'Selected eclipse',
  },
  ru: {
    ey: 'Лунные затмения', title: 'Когда следующее лунное затмение?', lead: c => `Когда Луна входит в тень Земли, она темнеет, а при полном затмении становится красноватой. Ниже — все затмения до 2040 года и видно ли их из вашего города${c ? ` (${c})` : ''}.`,
    total: 'Полное затмение', partial: 'Частное затмение', full: 'Видно из вашего города', part: 'Видно частично: Луна в это время восходит или заходит', none: 'Не видно из вашего города: Луна будет под горизонтом',
    days: n => `осталось дней: ${n}`, today: 'Сегодня', start: 'Начало', totStart: 'Полная фаза', totEnd: 'Конец полной фазы', max: 'Наибольшая фаза', end: 'Конец',
    moonAlt: 'Высота Луны', below: 'В этот момент Луна под горизонтом', list: 'Все затмения (до 2040 года)', lesson: 'Урок о намазе при затмении',
    note: 'Время: NASA (Ф. Эспенак), точность около 1 мин. Полутеневые затмения почти незаметны глазу и в список не входят. Видимость рассчитана по высоте Луны в вашем городе.', // lang-ok[Espenak,NASA]: xüsusi ad
    scene: 'Луна проходит через тень Земли', time: 'Время', dur: 'Длительность', min: 'мин', sel: 'Выбранное затмение',
  },
  ar: {
    ey: 'خسوف القمر', title: 'متى الخسوف القادم؟', lead: c => `إذا دخل القمر ظلّ الأرض أظلم، وفي الخسوف الكلي يصير ضاربًا إلى الحمرة. وهذه كل حالات الخسوف حتى 2040، وهل تُرى من مدينتك${c ? ` (${c})` : ''}.`,
    total: 'خسوف كلي', partial: 'خسوف جزئي', full: 'يُرى من مدينتك', part: 'يُرى جزئيًا: يطلع القمر أو يغرب في أثنائه', none: 'لا يُرى من مدينتك: يكون القمر تحت الأفق',
    days: n => `بقي ${n} يومًا`, today: 'اليوم', start: 'البداية', totStart: 'بداية الكلي', totEnd: 'نهاية الكلي', max: 'ذروة الخسوف', end: 'النهاية',
    moonAlt: 'ارتفاع القمر', below: 'القمر تحت الأفق في هذه اللحظة', list: 'كل حالات الخسوف (حتى 2040)', lesson: 'درس صلاة الكسوف',
    note: 'الأوقات: ناسا (ف. إسبيناك)، والدقة نحو دقيقة. الخسوف شبه الظلي لا يكاد يُرى بالعين فلم يُدرج. وتُحسب الرؤية من ارتفاع القمر في مدينتك.',
    scene: 'القمر يعبر ظل الأرض', time: 'الوقت', dur: 'المدة', min: 'د', sel: 'الخسوف المختار',
  },
  tr: {
    ey: 'Ay tutulmaları', title: 'Sıradaki Ay tutulması ne zaman?', lead: c => `Ay Dünya’nın gölgesine girince kararır, tam tutulmada ise kızıllaşır. Aşağıda 2040’a kadar bütün tutulmalar ve şehrinizden${c ? ` (${c})` : ''} görünüp görünmedikleri var.`,
    total: 'Tam tutulma', partial: 'Parçalı tutulma', full: 'Şehrinizden görünecek', part: 'Kısmen görünecek: Ay bu sırada doğuyor veya batıyor', none: 'Şehrinizden görünmeyecek: Ay ufkun altında olacak',
    days: n => `${n} gün kaldı`, today: 'Bugün', start: 'Başlangıç', totStart: 'Tam evre', totEnd: 'Tam evrenin sonu', max: 'En büyük evre', end: 'Bitiş',
    moonAlt: 'Ay’ın yüksekliği', below: 'Ay bu anda ufkun altında', list: 'Bütün tutulmalar (2040’a kadar)', lesson: 'Tutulma namazı dersi',
    note: 'Saatler: NASA (F. Espenak), doğruluk yaklaşık 1 dk. Yarı gölge tutulmaları gözle neredeyse seçilmez — listede yok. Görünürlük Ay’ın şehrinizdeki yüksekliğinden hesaplanır.',
    scene: 'Ay Dünya’nın gölgesinden geçiyor', time: 'Saat', dur: 'Süre', min: 'dk', sel: 'Seçilen tutulma',
  },
}

const RM = 22, RU = RM * 2.7, CX = 200, CY = 120     // SVG ölçüləri (Ay radiusu, kölgə radiusu)

function partsIn(ms, tz) {
  try {
    const o = {}
    for (const x of new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(ms))) o[x.type] = x.value
    return { y: +o.year, m: +o.month - 1, d: +o.day, hm: `${o.hour}:${o.minute}` }
  } catch { const d = new Date(ms); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), hm: d.toISOString().slice(11, 16) } }
}

export default function LunarEclipses({ lang = 'az', lessonHref }) {
  const t = pickUi(T, lang)
  const months = pickUi(G_MONTHS, lang)
  const loc = useMemo(() => (typeof window === 'undefined' ? null : getPrayerLocation()), [])
  const tz = loc?.tz || 'UTC'
  const list = useMemo(() => upcoming(Date.now()).map(e => ({ e, v: loc ? visibility(e, loc.lat, loc.lng) : null })), [loc])
  const [idx, setIdx] = useState(0)
  const cur = list[idx]
  const [at, setAt] = useState(null)
  useEffect(() => { if (cur?.v) setAt(cur.v.max) }, [cur])
  if (!cur || !cur.v) return null
  const { e, v } = cur
  const fmtD = (ms) => { const p = partsIn(ms, tz); return `${p.d} ${months[p.m]} ${p.y}` }
  const hm = (ms) => partsIn(ms, tz).hm
  const days = Math.max(0, Math.ceil((v.u1 - Date.now()) / 86400000))

  // Səhnə: Ay kölgənin mərkəzindən dmin məsafədə keçir; mag = (RU + RM − dmin) / (2RM)
  const dmin = RU + RM - 2 * RM * e.mag
  const half = Math.sqrt(Math.max(0, (RU + RM) ** 2 - dmin ** 2))
  const k = at == null ? 0.5 : (at - v.u1) / (v.u4 - v.u1)
  const mx = CX - half + 2 * half * k, my = CY + dmin
  const dist = Math.hypot(mx - CX, my - CY)
  const inTotal = dist + RM <= RU
  const alt = at != null && loc ? moonAlt(at, loc.lat, loc.lng) : null
  const visKey = v.kind
  const events = [[t.start, v.u1], ...(v.u2 ? [[t.totStart, v.u2]] : []), [t.max, v.max], ...(v.u3 ? [[t.totEnd, v.u3]] : []), [t.end, v.u4]]

  return (
    <section className="ui-section ui-section--tight lec-wrap">
      <div className="ui-container">
        <div className="lec ui-card" data-testid="lunar-eclipses">
          <div className="lec__head">
            <span className="ui-eyebrow">{t.ey}</span>
            <h2 className="ui-title ui-title--sm">{t.title}</h2>
            <p className="ui-lead">{t.lead(loc?.city?.[lang] || loc?.city?.en)}</p>
          </div>
          <div className="lec__grid">
            <div className="lec__hero">
              <span className="lec__sel">{idx === 0 ? t.ey : t.sel}</span>
              <b className="lec__date" data-testid="lec-date">{fmtD(v.max)}</b>
              <span className={`lec__type lec__type--${e.t}`}>{e.t === 'T' ? t.total : t.partial} · <span className="ui-num">{e.mag.toFixed(2)}</span></span>
              <span className="lec__days ui-num">{days ? t.days(days) : t.today}</span>
              <p className={`lec__vis lec__vis--${visKey}`} data-testid="lec-vis"><Icon name={visKey === 'none' ? 'close' : 'check'} size={15} /> {t[visKey]}</p>
              <ol className="lec__times">
                {events.map(([n, ms]) => <li key={n}><span>{n}</span> <b className="ui-num">{hm(ms)}</b></li>)}
              </ol>
              {lessonHref && <a className="ui-btn ui-btn--secondary ui-btn--sm" href={lessonHref}><Icon name="books" size={15} className="ui-btn__icon" /> {t.lesson}</a>}
            </div>
            <div className="lec__scene">
              <svg viewBox="0 0 400 240" role="img" aria-label={t.scene}>
                <defs>
                  <radialGradient id="lec-umbra"><stop offset="0%" stopColor="#3a0f0f" stopOpacity=".95" /><stop offset="85%" stopColor="#2a0b12" stopOpacity=".85" /><stop offset="100%" stopColor="#2a0b12" stopOpacity=".55" /></radialGradient>
                  <clipPath id="lec-ucl"><circle cx={CX} cy={CY} r={RU} /></clipPath>
                </defs>
                <rect width="400" height="240" className="lec__sky" />
                <circle cx={CX} cy={CY} r={RU * 1.55} className="lec__pen" />
                <circle cx={CX} cy={CY} r={RU} fill="url(#lec-umbra)" />
                <line x1={CX - half} y1={my} x2={CX + half} y2={my} className="lec__path" />
                <circle cx={mx} cy={my} r={RM} className={`lec__moon${inTotal ? ' is-total' : ''}`} />
                <circle cx={mx} cy={my} r={RM} clipPath="url(#lec-ucl)" className="lec__moon-shadow" />
                {alt != null && alt <= 0 && <rect x="0" y="200" width="400" height="40" className="lec__ground" />}
              </svg>
              <label className="lec__range">
                <span>{t.time} <b className="ui-num" data-testid="lec-time">{at != null ? hm(at) : '—'}</b>
                  {alt != null && <> · {t.moonAlt} <b className="ui-num">{alt.toFixed(0)}°</b></>}</span>
                <input type="range" min={v.u1} max={v.u4} step={60000} value={at ?? v.max} onChange={ev => setAt(+ev.target.value)} data-testid="lec-range" />
              </label>
              {alt != null && alt <= 0 && <p className="lec__below">{t.below}</p>}
            </div>
          </div>
          <h3 className="lec__h3">{t.list}</h3>
          <ul className="lec__list" data-testid="lec-list">
            {list.map(({ e: x, v: w }, i) => (
              <li key={x.d}>
                <button type="button" className={i === idx ? 'is-on' : ''} onClick={() => setIdx(i)} aria-pressed={i === idx}>
                  <span className="lec__ld">{fmtD(w.max)}</span>
                  <span className={`lec__lt lec__lt--${x.t}`}>{x.t === 'T' ? t.total : t.partial}</span>
                  <span className="ui-num lec__lh">{hm(w.max)}</span>
                  <i className={`lec__dot lec__dot--${w.kind}`} title={t[w.kind]} aria-label={t[w.kind]} />
                </button>
              </li>
            ))}
          </ul>
          <p className="lec__note"><Icon name="info" size={14} /> {t.note}</p>
        </div>
      </div>
    </section>
  )
}
