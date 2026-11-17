// ═══════════════════════════════════════════════════════
// QuranWater (v8) — "Quranda su dövranı"
//
//   <QuranWater />   (dil useLang()-dən gəlir)
//
// • SVG səhnə: dəniz və dalğalar → günəş altında qalxan buludlar → buludları qovan küləklər →
//   dağ kimi topa buludlar, yağış və dolu → bulaqlar, çay, ağaclar → yenə dəniz.
// • Hər mərhələ səhnədə nöqtədir (data-stage). Toxun → kart (data-testid="qw-card"): ayədəki söz,
//   1–2 ayənin ərəb mətni (açar söz vurğulanır, mətn dəyişmir), saytın həmin dildəki rəsmi tərcüməsi +
//   tərcüməçi (public/data/quran-water/<dil>.json — build-quran-water.mjs hərfi-hərfinə köçürür),
//   ayəyə keçid, «növbəti mərhələ». Təfsir, «elmi möcüzə» iddiası yazılmır — ayə sadəcə mərhələnin yanındadır.
// • Sakit fon hərəkəti (buludlar süzülür, yağış yağır, dalğalar) — yalnız transform/opacity;
//   ekrandan çıxanda və vərəq gizlənəndə dayanır; hərəkət azaldılıbsa (useReduced) — statik.
// Stillər: src/styles/QuranWater.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { useLang } from '../contexts/LangContext'
import { useReduced } from '../motion/reduced'
import { pathFor } from '../seo/routes'
import { QURAN_WATER, expandRef, keyWordIdx, nextStage } from '../data/quranWater'
import '../styles/QuranWater.css'

const T = {
  az: { ey: 'Quran və təbiət', title: 'Quranda su dövranı', lead: 'Dənizdən buluda, buluddan yağışa, yağışdan bulaqlara və yenə dənizə — suyun yolu. Səhnədəki nöqtələrə toxunun: hər mərhələnin yanında onu açıq çəkən ayələri oxuyun.',
    tap: 'Mərhələyə toxunun', steps: 'Dövranın mərhələləri', open: 'Ayəni oxu', next: 'Növbəti mərhələ', trl: 'Tərcümə', loading: 'Yüklənir…', ayahs: 'Ayələr', word: 'Ayədəki söz',
    scene: 'Su dövranı: dəniz, qalxan buludlar, küləklər, topa buludlar, yağış və dolu, bulaqlar və çay',
    evap: 'Buxarlanmanın özü ayədə çəkilmir — burada küləklərin buludu qaldırdığı ayələr göstərilir.',
    note: 'Yalnız ayələr — təfsir və şərh yazılmayıb. Ayə mətni və tərcüməsi saytdakı Quranla eynidir; açar söz vurğulanıb.' },
  en: { ey: 'The Quran and nature', title: 'The water cycle in the Quran', lead: 'From the sea to the clouds, from the clouds to rain, from rain to springs and back to the sea — the journey of water. Tap a point in the scene to read the verses that mention that stage.',
    tap: 'Tap a stage', steps: 'Stages of the cycle', open: 'Read the verse', next: 'Next stage', trl: 'Translation', loading: 'Loading…', ayahs: 'Verses', word: 'Word in the verse',
    scene: 'The water cycle: sea, clouds rising, winds, heaped clouds, rain and hail, springs and a river',
    evap: 'Evaporation itself is not named in a verse — shown here are the verses where the winds raise up clouds.',
    note: 'Verses only — no commentary or interpretation. The verse text and translation are the same as in the site’s Quran; the key word is highlighted.' },
  ru: { ey: 'Коран и природа', title: 'Круговорот воды в Коране', lead: 'Из моря — в облака, из облаков — дождём на землю, из источников — снова в море: путь воды. Нажмите на точку на картинке, чтобы прочитать аяты, где упоминается этот этап.',
    tap: 'Нажмите на этап', steps: 'Этапы круговорота', open: 'Читать аят', next: 'Следующий этап', trl: 'Перевод', loading: 'Загрузка…', ayahs: 'Аяты', word: 'Слово в аяте',
    scene: 'Круговорот воды: море, поднимающиеся облака, ветры, громады облаков, дождь и град, источники и река',
    evap: 'Само испарение в аяте не названо — здесь показаны аяты, где ветры поднимают облака.',
    note: 'Только аяты — без толкований и комментариев. Текст аята и перевод — те же, что в Коране на сайте; ключевое слово выделено.' },
  ar: { ey: 'القرآن والطبيعة', title: 'دورة الماء في القرآن', lead: 'من البحر إلى السحاب، ومن السحاب مطرًا، ومن الينابيع إلى البحر من جديد — رحلة الماء. اضغط على نقطة في المشهد لتقرأ الآيات التي تذكر تلك المرحلة.',
    tap: 'اضغط على مرحلة', steps: 'مراحل الدورة', open: 'اقرأ الآية', next: 'المرحلة التالية', trl: 'الترجمة', loading: 'جارٍ التحميل…', ayahs: 'الآيات', word: 'الكلمة في الآية',
    scene: 'دورة الماء: البحر، والسحاب يُثار، والرياح، والسحاب الركام، والمطر والبرد، والينابيع والنهر',
    evap: 'لا تذكر الآيات التبخّر نفسه — وتُعرض هنا الآيات التي تثير فيها الرياح السحاب.',
    note: 'آيات فقط، بلا تفسير ولا شرح. ونص الآية كما في مصحف الموقع، مع تمييز الكلمة.' },
  tr: { ey: 'Kur’an ve tabiat', title: 'Kur’an’da su döngüsü', lead: 'Denizden buluta, buluttan yağmura, pınarlardan yeniden denize — suyun yolculuğu. Sahnedeki bir noktaya dokunun ve o aşamayı anan ayetleri okuyun.',
    tap: 'Bir aşamaya dokunun', steps: 'Döngünün aşamaları', open: 'Ayeti oku', next: 'Sonraki aşama', trl: 'Meal', loading: 'Yükleniyor…', ayahs: 'Ayetler', word: 'Ayetteki kelime',
    scene: 'Su döngüsü: deniz, yükselen bulutlar, rüzgârlar, üst üste bulutlar, yağmur ve dolu, pınarlar ve nehir',
    evap: 'Buharlaşmanın kendisi ayette anılmaz — burada rüzgârların bulutu kaldırdığı ayetler gösterilir.',
    note: 'Yalnızca ayetler — tefsir veya yorum yok. Ayet metni ve meali sitedeki Kur’an ile aynıdır; anahtar kelime vurgulanmıştır.' },
}

/** Səhnədə nöqtələrin yeri (viewBox 480×300 faizlə) */
const PIN = {
  sea: [14, 86], evaporation: [24, 57], wind: [55, 36], clouds: [82, 12], rain: [80, 50], rivers: [67, 80],
}

const wave = (y) => `M-80 ${y} q20 -5 40 0${' t40 0'.repeat(15)}`
/** Yumşaq bulud: dairələrdən */
function Cloud({ x, y, s = 1, cls = '' }) {
  return (
    <g className={`qw__cloud ${cls}`}>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <ellipse cx="0" cy="10" rx="34" ry="11" />
        <circle cx="-14" cy="4" r="12" /><circle cx="4" cy="-2" r="16" /><circle cx="20" cy="6" r="10" />
      </g>
    </g>
  )
}

function Scene({ label, sel }) {
  const on = (id) => `qw__g qw__g--${id}${sel === id ? ' is-on' : ''}`
  return (
    <svg className="qw__svg" viewBox="0 0 480 300" role="img" aria-label={label}>
      <defs>
        <linearGradient id="qw-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" className="qw__s-sky1" /><stop offset="1" className="qw__s-sky2" />
        </linearGradient>
        <linearGradient id="qw-sea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" className="qw__s-sea1" /><stop offset="1" className="qw__s-sea2" />
        </linearGradient>
        <linearGradient id="qw-storm" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" className="qw__s-st1" /><stop offset="1" className="qw__s-st2" />
        </linearGradient>
        <radialGradient id="qw-sun">
          <stop offset="0" stopColor="#fff6c8" /><stop offset=".6" stopColor="#ffd45a" /><stop offset="1" stopColor="#f6a823" />
        </radialGradient>
        <clipPath id="qw-sea-clip"><path d="M0 224 C60 216 140 232 236 222 C250 221 262 226 270 232 L270 300 L0 300Z" /></clipPath>
      </defs>
      <rect width="480" height="300" fill="url(#qw-sky)" />

      {/* Günəş */}
      <g className="qw__sun" transform="translate(58 52)">
        <g className="qw__rays">
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M0 -38 L3 -28 L-3 -28Z" transform={`rotate(${i * 30})`} />
          ))}
        </g>
        <circle r="22" fill="url(#qw-sun)" />
      </g>

      {/* Dağlar və yamac */}
      <path className="qw__mtn qw__mtn--far" d="M232 300 L292 186 L318 210 L372 132 L424 196 L452 168 L480 196 L480 300Z" />
      <path className="qw__snow" d="M372 132 L388 155 L380 152 L372 160 L364 152 L357 154Z" />
      <path className="qw__snow" d="M292 186 L301 203 L292 199 L285 203Z" />
      <path className="qw__hill" d="M258 300 C284 266 340 252 480 256 L480 300Z" />

      {/* Dəniz */}
      <g className={on('sea')}>
        <path className="qw__seabody" d="M0 224 C60 216 140 232 236 222 C250 221 262 226 270 232 L270 300 L0 300Z" fill="url(#qw-sea)" />
        <g clipPath="url(#qw-sea-clip)">
          <path className="qw__wave qw__wave--a" d={wave(236)} />
          <path className="qw__wave qw__wave--b" d={wave(254)} />
          <path className="qw__wave qw__wave--a" d={wave(274)} />
          <path className="qw__wave qw__wave--b" d={wave(292)} />
        </g>
      </g>

      {/* Qalxan buxar və kiçik buludlar */}
      <g className={on('evaporation')}>
        {[70, 112, 154, 196].map((x, i) => (
          <path key={x} className="qw__vapor" style={{ animationDelay: `${i * -1.1}s` }}
            d={`M${x} 214 c-7 -9 7 -17 0 -26 c-7 -9 7 -17 0 -26`} />
        ))}
        <Cloud x={132} y={118} s={0.8} cls="qw__drift qw__drift--a" />
        <Cloud x={204} y={84} s={0.95} cls="qw__drift qw__drift--b" />
      </g>

      {/* Küləklər */}
      <g className={on('wind')}>
        {[[236, 112], [258, 128], [246, 96]].map(([x, y], i) => (
          <path key={i} className="qw__gust" style={{ animationDelay: `${i * -1.3}s` }}
            d={`M${x} ${y} c14 -6 30 6 46 0 c10 -4 14 -12 6 -15 c-5 -2 -9 3 -6 6`} />
        ))}
      </g>

      {/* Topa (dağ kimi) bulud, şimşək, yağış və dolu */}
      <g className={on('rain')}>
        {Array.from({ length: 11 }, (_, i) => {
          const x = 336 + i * 10 + (i % 2) * 3
          return <path key={i} className="qw__drop" style={{ animationDelay: `${((i * 0.37) % 1.2) * -1}s` }} d={`M${x} 110 l-3 12`} />
        })}
      </g>
      <g className={on('clouds')}>
        <g className="qw__heap">
          <ellipse cx="392" cy="98" rx="66" ry="16" fill="url(#qw-storm)" />
          <circle cx="352" cy="82" r="22" fill="url(#qw-storm)" />
          <circle cx="384" cy="62" r="30" fill="url(#qw-storm)" />
          <circle cx="414" cy="36" r="24" fill="url(#qw-storm)" />
          <circle cx="426" cy="74" r="26" fill="url(#qw-storm)" />
          <circle cx="398" cy="22" r="16" fill="url(#qw-storm)" />
          <path className="qw__heap-hl" d="M366 46 C376 34 392 32 402 38" />
        </g>
        <path className="qw__bolt" d="M404 104 L396 120 L404 120 L398 136 L414 114 L405 114 L411 104Z" />
        {[[440, 114], [450, 124], [432, 128], [446, 108]].map(([x, y], i) => (
          <circle key={i} className="qw__hail" style={{ animationDelay: `${i * -0.45}s` }} cx={x} cy={y} r="2.6" />
        ))}
      </g>

      {/* Bulaq, çay və həyat */}
      <g className={on('rivers')}>
        <ellipse className="qw__pool" cx="350" cy="214" rx="12" ry="4" />
        {[0, 1, 2].map(i => (
          <circle key={i} className="qw__spring" style={{ animationDelay: `${i * -0.6}s` }} cx={346 + i * 4} cy="210" r="1.8" />
        ))}
        <path className="qw__river" d="M350 214 C344 232 332 240 320 250 C302 264 286 250 262 238" />
        <path className="qw__river-glint" d="M344 228 C340 236 334 240 328 244 M306 256 C298 256 290 250 280 246" />
        {[[298, 280, .9], [350, 266, .8], [398, 262, 1], [446, 252, .85]].map(([x, y, s], i) => (
          <g key={i} className="qw__tree" transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x="-2" y="-4" width="4" height="12" rx="1" className="qw__trunk" />
            <circle cx="0" cy="-12" r="10" /><circle cx="-6" cy="-6" r="7" /><circle cx="6" cy="-6" r="7" />
          </g>
        ))}
      </g>
    </svg>
  )
}

const cache = new Map()

export default function QuranWater() {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const rootRef = useRef(null)
  const [onscreen, setOnscreen] = useState(true)
  const [visible, setVisible] = useState(true)
  const [sel, setSel] = useState('sea')
  const [ri, setRi] = useState(0)
  const [texts, setTexts] = useState(null)
  const st = useMemo(() => QURAN_WATER.find(x => x.id === sel), [sel])

  useEffect(() => {
    let alive = true
    const load = (f) => cache.get(f) || fetch(`/data/quran-water/${f}.json`).then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
    const pr = load(lang).catch(() => load('en'))
    cache.set(lang, pr)
    pr.then(d => { if (alive) setTexts(d) }).catch(() => {})
    return () => { alive = false }
  }, [lang])

  // Ekrandan çıxanda və vərəq gizlənəndə fon hərəkəti dayanır
  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver !== 'function') return undefined
    const io = new IntersectionObserver(([e]) => setOnscreen(!!e?.isIntersecting), { rootMargin: '60px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState !== 'hidden')
    onVis()
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const pick = (id) => { setSel(id); setRi(0) }
  const r = st.refs[Math.min(ri, st.refs.length - 1)]
  const parts = expandRef(r.ref)
  const [s, first] = parts[0].split(':').map(Number)
  const name = pickUi(st.name, lang, 'en')
  const cls = ['ui-card', 'qw', !reduced && 'is-live', !(onscreen && visible) && 'is-paused'].filter(Boolean).join(' ')

  return (
    <section ref={rootRef} className={cls} data-testid="quran-water" aria-labelledby="qw-title">
      <span className="ui-eyebrow">{t.ey}</span>
      <h2 id="qw-title" className="qw__title">{t.title}</h2>
      <p className="qw__lead">{t.lead}</p>

      <div className="qw__grid">
        <div className="qw__stage">
          <div className="qw__scene">
            <Scene label={t.scene} sel={sel} />
            {QURAN_WATER.map((x, i) => (
              <button key={x.id} type="button" className={`qw__pin${x.id === sel ? ' is-on' : ''}`} data-stage={x.id}
                style={{ left: `${PIN[x.id][0]}%`, top: `${PIN[x.id][1]}%` }}
                aria-pressed={x.id === sel} aria-label={`${i + 1}. ${pickUi(x.name, lang, 'en')}`} title={pickUi(x.name, lang, 'en')}
                onClick={() => pick(x.id)}>
                <Icon name={x.icon} size={16} />
                <span className="qw__pin-n ui-num" aria-hidden="true">{i + 1}</span>
              </button>
            ))}
          </div>
          <p className="qw__hint">{t.tap}</p>
          <ol className="qw__steps" aria-label={t.steps}>
            {QURAN_WATER.map((x, i) => (
              <li key={x.id}>
                <button type="button" className={`ui-chip qw__step${x.id === sel ? ' is-on' : ''}`} aria-pressed={x.id === sel} data-step={x.id} onClick={() => pick(x.id)}>
                  <span className="ui-num qw__step-n">{i + 1}</span> {pickUi(x.name, lang, 'en')}
                </button>
              </li>
            ))}
          </ol>
        </div>

        <article className="qw__card" aria-live="polite" data-testid="qw-card" data-id={st.id} key={st.id}>
          <div className="qw__top">
            <span className="qw__badge" aria-hidden="true"><Icon name={st.icon} size={26} /></span>
            <div className="qw__hd">
              <h3 className="qw__name">{name}</h3>
              <p className="qw__lbl">{t.word}</p>
              <p className="qw__ar ui-arabic" lang="ar" dir="rtl">{st.ar}</p>
            </div>
          </div>
          {st.id === 'evaporation' && <p className="qw__info"><Icon name="info" size={14} /> {t.evap}</p>}
          {st.refs.length > 1 && (
            <div className="qw__refs" role="group" aria-label={t.ayahs}>
              {st.refs.map((x, i) => (
                <button key={x.ref} type="button" className={`qw__chip ui-num${x === r ? ' is-on' : ''}`} aria-pressed={x === r} onClick={() => setRi(i)} dir="ltr" data-testid="qw-ref">{x.ref}</button>
              ))}
            </div>
          )}
          <blockquote className="qw__ayah ui-arabic" lang="ar" dir="rtl" data-testid="qw-ayah">
            {texts?.ar
              ? parts.map((p, pi) => {
                const txt = texts.ar[p] || ''
                const hi = new Set(keyWordIdx(r.keys, txt))
                return (
                  <span key={p}>
                    {pi ? ' ' : ''}
                    {txt.split(' ').map((w, i) => (
                      <span key={i}>{i ? ' ' : ''}{hi.has(i) ? <mark className="qw__mk">{w}</mark> : w}</span>
                    ))}
                    {' '}<span className="ui-num">﴿{p.split(':')[1]}﴾</span>
                  </span>
                )
              })
              : t.loading}
          </blockquote>
          {lang !== 'ar' && texts?.tr && parts.every(p => texts.tr[p]) && (
            <p className="qw__tr">
              {parts.map((p, i) => (
                <span key={p}>{i ? ' ' : ''}{parts.length > 1 && <sup className="ui-num">{p.split(':')[1]}</sup>}{texts.tr[p]}</span>
              ))}
              {' '}<small>— {t.trl}: {texts.by}</small>
            </p>
          )}
          <div className="qw__foot">
            <span className="ui-num qw__ref" dir="ltr">{r.ref}</span>
            <div className="qw__acts">
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => pick(nextStage(sel))} data-testid="qw-next">
                {t.next} <Icon name="refresh" size={14} />
              </button>
              <a className="ui-btn ui-btn--secondary ui-btn--sm" href={`${pathFor('quran', lang, s)}?a=${first}`} data-testid="qw-open">
                {t.open} <Icon name="chevron" size={14} className="ui-flip-rtl" />
              </a>
            </div>
          </div>
        </article>
      </div>
      <p className="qw__note"><Icon name="info" size={14} /> {t.note}</p>
    </section>
  )
}
