// ═══════════════════════════════════════════════════════
// ElephantClock — əl-Cəzərinin işləyən fil saatı (1206), /history elm bölməsi
//
// • Saf SVG rəsm (əl ilə çəkilmiş yollar, əlyazma rəngləri: oxra, lacivərd,
//   qızılı, qırmızı) perqament kartın üstündə: fil, belində qüllə, günbəzdə
//   feniks, dönən katib, filçi, iki ilan, şahinlər və kürə, kiçik siferblat.
// • "Rentgen" düyməsi filin içini açır: su çəni və batan deşikli qab. Qabın
//   batma payı = istifadəçinin YERLİ vaxtında cari yarım saatın keçən hissəsi
//   (utils/elephantClock.js). Hər :00 və :30-da buraxılış ardıcıllığı oynayır:
//   kürə düşür → ilan əyilir → filçi vurur, sinc səslənir (səs yalnız istifadəçi
//   açanda, Web Audio ilə sintez) → qab qalxır, katib dönür. "Mexanizmi göstər"
//   düyməsi eyni ardıcıllığı istənilən an oynadır.
// • Hərəkəti azalt: davamlı animasiya yoxdur (qab dəqiqədə bir yenilənir),
//   ardıcıllıq addımların siyahısında statik göstərilir. Ekrandan kənarda və
//   vərəq gizlinikən saat dayanır, CSS animasiyaları pauza olunur.
// • Şəbəkə, şəkil faylı, kitabxana yoxdur. Test üçün: now (ms) propu,
//   data-phase ("idle" | "release") və data-level (0..1, 2 onluq).
// ═══════════════════════════════════════════════════════
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { useReduced } from '../motion/reduced'
import usePrayerTimes, { PRAYER_NAMES } from '../hooks/usePrayerTimes'
import { HALF_MS, halfHourState, crossedRelease, roundLevel, splitDuration } from '../utils/elephantClock'
import '../styles/ElephantClock.css'

const T = {
  az: {
    ey: 'Elm tarixi', title: 'Əl-Cəzərinin fil saatı',
    lead: 'Əl-Cəzəri 1206-cı ildə yazdığı kitabda sudan işləyən bir saat təsvir edib: filin içində batan qab yarım saatı ölçür, vaxt tamam olanda fiqurlar tərpənir və sinc səslənir. Bu model sizin yerli vaxtınızla işləyir.',
    xray: 'Filin içini göstər', xrayOff: 'İçini gizlət', play: 'Yarım saat mexanizmini göstər',
    soundOn: 'Səs: açıq', soundOff: 'Səs: bağlı',
    local: 'Yerli vaxt', half: 'Bu yarım saat', bowl: 'Qab batıb', release: 'Növbəti zəngə', next: 'Növbəti namaz',
    h: 'saat', m: 'dəq', how: 'Necə işləyir', ring: 'Yarım saat tamam oldu — sinc səslənir',
    steps: [
      'Filin içində suda deşikli bir qab üzür. Qab yavaş-yavaş su alıb batır — yarım saat belə ölçülür.',
      'Qab batanda ipləri dartır və qüllənin başında bir kürə buraxılır.',
      'Kürə ilanın ağzına düşür, ilan ağırlıqdan əyilir və bu hərəkət qabı yenidən yuxarı qaldırır.',
      'Fiqurlar tərpənir, sinc səslənir — yarım saat tamam oldu.',
    ],
    cultures: 'Əl-Cəzərinin öz tərtibatı müxtəlif mədəniyyətlərdən bəhrələnir: hind fili, Çin əjdahası, fars xalçası, Misir feniksi və yunan su mühəndisliyi.',
    source: 'Mənbə: Əbül-İzz ibn İsmayıl əl-Cəzəri, «Kitab fi mərifət əl-hiyəl əl-həndəsiyyə» (Ustalıqla qurulmuş mexaniki qurğular haqqında bilik kitabı), 1206.',
    aria: 'Fil saatının rəsmi',
  },
  en: {
    ey: 'History of science', title: 'Al-Jazari’s elephant clock',
    lead: 'In his book of 1206, al-Jazari described a clock driven by water: a bowl sinking inside the elephant measures the half hour, and when the time is up the figures move and a cymbal sounds. This model runs on your local time.',
    xray: 'Show inside the elephant', xrayOff: 'Hide the mechanism', play: 'Show the half-hour mechanism',
    soundOn: 'Sound: on', soundOff: 'Sound: off',
    local: 'Local time', half: 'This half hour', bowl: 'Bowl sunk', release: 'Next chime in', next: 'Next prayer',
    h: 'h', m: 'min', how: 'How it works', ring: 'Half hour complete — the cymbal sounds',
    steps: [
      'Inside the elephant a perforated bowl floats in water and slowly sinks — this measures the half hour.',
      'When it sinks, it pulls strings that release a ball at the top of the tower.',
      'The ball falls into a serpent’s mouth, tipping it, which pulls the bowl up again.',
      'The figures move and a cymbal sounds, marking the half hour.',
    ],
    cultures: 'Al-Jazari’s own design draws on elements from different cultures: the Indian elephant, the Chinese dragon, the Persian carpet, the Egyptian phoenix and Greek water engineering.',
    source: 'Source: Abu’l-ʿIzz ibn Ismāʿīl al-Jazarī, Kitāb fī maʿrifat al-ḥiyal al-handasiyya (The Book of Knowledge of Ingenious Mechanical Devices), 1206.',
    aria: 'Drawing of the elephant clock',
  },
  ru: {
    ey: 'История науки', title: 'Часы-слон аль-Джазари',
    lead: 'В книге 1206 года аль-Джазари описал часы, работающие на воде: тонущая внутри слона чаша отмеряет полчаса, а когда время истекает, фигуры приходят в движение и звучит кимвал. Эта модель идёт по вашему местному времени.',
    xray: 'Показать слона изнутри', xrayOff: 'Скрыть механизм', play: 'Показать механизм получаса',
    soundOn: 'Звук: вкл.', soundOff: 'Звук: выкл.',
    local: 'Местное время', half: 'Текущие полчаса', bowl: 'Чаша погрузилась', release: 'До удара', next: 'Следующий намаз',
    h: 'ч', m: 'мин', how: 'Как это работает', ring: 'Полчаса прошло — звучит кимвал',
    steps: [
      'Внутри слона в воде плавает чаша с отверстием. Она медленно наполняется и тонет — так отмеряются полчаса.',
      'Опускаясь, чаша тянет за верёвки, и на вершине башни освобождается шар.',
      'Шар падает в пасть змея, змей наклоняется под его весом — и это движение снова поднимает чашу.',
      'Фигуры приходят в движение, звучит кимвал — полчаса прошло.',
    ],
    cultures: 'Собственный замысел аль-Джазари вбирает элементы разных культур: индийского слона, китайского дракона, персидский ковёр, египетского феникса и греческое искусство водных механизмов.',
    source: 'Источник: Абу-ль-Изз ибн Исмаил аль-Джазари, «Китаб фи марифат аль-хиял аль-хандасийя» (Книга знаний об остроумных механических устройствах), 1206.',
    aria: 'Рисунок часов-слона',
  },
  ar: {
    ey: 'تاريخ العلوم', title: 'ساعة الفيل للجزري',
    lead: 'وصف الجزري في كتابه سنة 1206م ساعةً تعمل بالماء: طاسةٌ تغوص داخل الفيل فتقيس نصف الساعة، فإذا انقضى تحرّكت التماثيل ورنّ الصنج. هذا النموذج يعمل بتوقيتك المحلي.',
    xray: 'أظهر داخل الفيل', xrayOff: 'أخفِ الآلية', play: 'اعرض آلية نصف الساعة',
    soundOn: 'الصوت: مفعّل', soundOff: 'الصوت: مكتوم',
    local: 'الوقت المحلي', half: 'نصف الساعة الحالي', bowl: 'غوص الطاسة', release: 'حتى الرنّة التالية', next: 'الصلاة القادمة',
    h: 'س', m: 'د', how: 'كيف تعمل', ring: 'انقضى نصف الساعة — يرنّ الصنج',
    steps: [
      'داخل الفيل طاسةٌ مثقوبة تطفو على الماء، فتمتلئ ببطء وتغوص — وبذلك يُقاس نصف الساعة.',
      'حين تغوص تشدّ حبالًا فتُطلق كرةً من أعلى البرج.',
      'تسقط الكرة في فم الثعبان فيميل بثقلها، وهذه الحركة ترفع الطاسة من جديد.',
      'تتحرّك التماثيل ويرنّ الصنج إيذانًا بانقضاء نصف الساعة.',
    ],
    cultures: 'يستلهم تصميم الجزري نفسه عناصر من ثقافات مختلفة: الفيل الهندي، والتنين الصيني، والسجاد الفارسي، والعنقاء المصرية، وهندسة الماء الإغريقية.',
    source: 'المصدر: أبو العز بن إسماعيل الجزري، «كتاب في معرفة الحيل الهندسية»، 1206م.',
    aria: 'رسم ساعة الفيل',
  },
  tr: {
    ey: 'Bilim tarihi', title: 'el-Cezerî’nin fil saati',
    lead: 'el-Cezerî 1206’da yazdığı kitapta suyla çalışan bir saat anlattı: filin içinde batan bir tas yarım saati ölçer, süre dolunca figürler hareket eder ve zil çalar. Bu model sizin yerel saatinizle çalışır.',
    xray: 'Filin içini göster', xrayOff: 'Mekanizmayı gizle', play: 'Yarım saat mekanizmasını göster',
    soundOn: 'Ses: açık', soundOff: 'Ses: kapalı',
    local: 'Yerel saat', half: 'Bu yarım saat', bowl: 'Tas battı', release: 'Sonraki zile', next: 'Sonraki namaz',
    h: 'sa', m: 'dk', how: 'Nasıl çalışır', ring: 'Yarım saat doldu — zil çalıyor',
    steps: [
      'Filin içinde suda delikli bir tas yüzer. Tas yavaşça su alıp batar — böylece yarım saat ölçülür.',
      'Tas dibe inerken iplerini çeker ve kulenin tepesinde bir bilye serbest kalır.',
      'Bilye yılanın ağzına düşer, yılan ağırlıkla eğilir ve bu hareket tası yeniden yukarı çeker.',
      'Figürler hareket eder, zil çalar — yarım saat doldu.',
    ],
    cultures: 'el-Cezerî’nin kendi tasarımı farklı kültürlerden unsurlar taşır: Hint fili, Çin ejderhası, Fars halısı, Mısır ankası (feniksi) ve Yunan su mühendisliği.',
    source: 'Kaynak: Ebü’l-İz İbn İsmail el-Cezerî, Kitâb fî ma‘rifeti’l-hiyeli’l-hendesiyye (Mekanik Hünerler Hakkında Bilgi Kitabı), 1206.',
    aria: 'Fil saatinin çizimi',
  },
}

const SEQ_MS = 4500          // buraxılış ardıcıllığının uzunluğu (CSS-dəki 4.5s ilə eyni)
const STATIC_MS = 6000       // hərəkəti azalt: addımlar bu qədər vurğulanır
const DING_AT = 0.6          // kürə sincə dəyəndə (ardıcıllığın payı)
const SINK = 54              // qabın batma dərinliyi (SVG vahidi)
const STALE_MS = 90000       // bundan uzun fasilədən sonra (ekrandan kənar idi) ardıcıllıq oynanmır

// ── Sinc səsi (Web Audio, sintez) ──
let actx = null
function audioCtx() {
  try {
    if (!actx) { const C = window.AudioContext || window.webkitAudioContext; if (C) actx = new C() }
    if (actx && actx.state === 'suspended') actx.resume()
  } catch { actx = null }
  return actx
}
function ding() {
  const ac = audioCtx()
  if (!ac) return
  try {
    const t0 = ac.currentTime + 0.01
    const out = ac.createGain()
    out.gain.value = 0.16
    out.connect(ac.destination)
    // Zəngin qeyri-harmonik obertonları: əsas ton + 2.76, 5.4, 1.5 dəfə
    for (const [f, a, d] of [[988, 1, 2.4], [988 * 2.76, 0.45, 1.3], [988 * 5.4, 0.22, 0.6], [988 * 1.5, 0.2, 1.7]]) {
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.type = 'sine'
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(a, t0 + 0.006)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d)
      o.connect(g)
      g.connect(out)
      o.start(t0)
      o.stop(t0 + d + 0.05)
    }
  } catch { /* səs alınmadı — saat yenə işləyir */ }
}

// Su səthi: dövri dalğa (12 vahid addımla — translateX(12) tikişsiz təkrarlanır)
const WAVE = (() => {
  let d = 'M150 344'
  for (let i = 0; i < 12; i++) d += ' q6 -3 12 0'
  return d + ' V420 H150 Z'
})()

// Siferblat: sutkanın 48 yarım saatı
const DIAL = Array.from({ length: 48 }, (_, i) => {
  const a = (i / 48) * 2 * Math.PI
  const r1 = 17, r2 = i % 2 ? 14.5 : 13
  return { i, x1: 220 + r1 * Math.sin(a), y1: 178 - r1 * Math.cos(a), x2: 220 + r2 * Math.sin(a), y2: 178 - r2 * Math.cos(a) }
})

export default function ElephantClock({ lang: langProp, now: nowProp }) {
  const ctx = useLang()
  const lang = langProp || ctx?.lang || 'az'
  const u = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const { next } = usePrayerTimes()
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const id = (s) => `jzc${uid}-${s}`

  const rootRef = useRef(null)
  const [tick, setTick] = useState(() => Date.now())
  const [onscreen, setOnscreen] = useState(true)
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden')
  const [xray, setXray] = useState(false)
  const [sound, setSound] = useState(false)
  const [release, setRelease] = useState(null)    // { key, demo } — oynayan ardıcıllıq
  const [step, setStep] = useState(0)             // vurğulanan addım (0..3)
  const soundRef = useRef(false)
  const timers = useRef([])

  const t = nowProp ?? tick
  const st = halfHourState(t)
  const active = onscreen && visible

  // ── Ekranda görünmə və vərəq gizliliyi ──
  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver !== 'function') return undefined
    const io = new IntersectionObserver(([e]) => setOnscreen(!!e?.isIntersecting), { rootMargin: '80px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // ── Saat: saniyədə bir (hərəkəti azaltda dəqiqədə bir), yalnız görünəndə ──
  useEffect(() => {
    if (nowProp != null || !active) return undefined
    setTick(Date.now())
    const iv = setInterval(() => setTick(Date.now()), reduced ? 60000 : 1000)
    return () => clearInterval(iv)
  }, [active, reduced, nowProp])

  // ── Ardıcıllıq ──
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  useEffect(() => clearTimers, [])
  const startRelease = (demo) => {
    clearTimers()
    const dur = reduced ? STATIC_MS : SEQ_MS
    setRelease({ key: Date.now(), demo })
    setStep(1)
    if (soundRef.current) {
      if (reduced) ding()
      else timers.current.push(setTimeout(ding, SEQ_MS * DING_AT))
    }
    if (!reduced) {
      timers.current.push(setTimeout(() => setStep(2), SEQ_MS * 0.22))
      timers.current.push(setTimeout(() => setStep(3), SEQ_MS * DING_AT))
    }
    timers.current.push(setTimeout(() => { setRelease(null); setStep(0) }, dur))
  }

  // Real :00 / :30 keçidi — yalnız saat axarkən (uzun fasilədən sonra yox)
  const prevT = useRef(t)
  useEffect(() => {
    const prev = prevT.current
    prevT.current = t
    if (t - prev <= STALE_MS && crossedRelease(prev, t)) startRelease(false)
    // startRelease hər renderdə yenidir; yalnız vaxt dəyişəndə yoxlanır
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t])

  const toggleSound = () => {
    const on = !sound
    if (on) audioCtx()          // klikdə açılır — brauzer səsi bloklamasın
    soundRef.current = on
    setSound(on)
  }

  // ── Göstəricilər ──
  const fmt = useMemo(() => {
    try { return new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' }) } catch { return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }) }
  }, [lang])
  const dur = (ms) => {
    const { h, m } = splitDuration(ms)
    return h ? `${h} ${u.h} ${m} ${u.m}` : `${m} ${u.m}`
  }
  const halfStart = t - st.elapsed
  const level = st.level
  const levelR = roundLevel(level)
  const nextName = next ? (pickUi(PRAYER_NAMES[next.key] || {}, lang, 'en') || next.key) : ''
  const nextMs = next ? (nowProp == null && next.at ? next.at - t : next.inMs) : null
  const penAngle = 60 - level * 120
  const phase = release ? 'release' : 'idle'
  const seqStyle = {
    '--from': release && !release.demo ? `${SINK}px` : '0px',
    '--to-bottom': `${((1 - level) * SINK).toFixed(1)}px`,
    '--to-top': `${(-level * SINK).toFixed(1)}px`,
  }
  const activeStep = release ? step : 0
  const rtl = lang === 'ar' ? 'rtl' : undefined

  const cls = ['ui-card', 'jzc', xray && 'is-xray', release && 'is-release', !active && 'is-paused', reduced && 'is-reduced'].filter(Boolean).join(' ')

  return (
    <section ref={rootRef} className={cls} aria-labelledby={id('t')} data-testid="elephant-clock"
      data-phase={phase} data-level={levelR.toFixed(2)}>
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 id={id('t')} className="jzc__title" dir={rtl}>{u.title}</h2>
      <p className="jzc__lead" dir={rtl}>{u.lead}</p>
      <div className="jzc__grid">
        <div className="jzc__stage">
          <svg key={release ? release.key : 'idle'} viewBox="0 0 400 500" className="jzc__svg" role="img" dir="ltr"
            aria-label={`${u.aria}: ${u.local} ${fmt.format(t)}, ${u.bowl} ${Math.round(level * 100)}%`}>
            <defs>
              <linearGradient id={id('parch')} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f7ecd0" /><stop offset="100%" stopColor="#ead5a3" />
              </linearGradient>
              <linearGradient id={id('hide')} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a7acb8" /><stop offset="100%" stopColor="#737889" />
              </linearGradient>
              <linearGradient id={id('gold')} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f6dc8e" /><stop offset="55%" stopColor="#d4a644" /><stop offset="100%" stopColor="#9c7224" />
              </linearGradient>
              <linearGradient id={id('lapis')} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3c62a8" /><stop offset="100%" stopColor="#1d356b" />
              </linearGradient>
              <linearGradient id={id('water')} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6fa8d6" stopOpacity=".85" /><stop offset="100%" stopColor="#24548f" stopOpacity=".95" />
              </linearGradient>
              <clipPath id={id('tank')}><rect x="179" y="333" width="82" height="86" rx="3" /></clipPath>
              <clipPath id={id('str')}><rect x="0" y="122" width="400" height="300" /></clipPath>
            </defs>

            {/* Perqament kart */}
            <rect x="4" y="4" width="392" height="492" rx="18" fill={`url(#${id('parch')})`} stroke="#b8913f" strokeWidth="2" />
            <rect x="14" y="14" width="372" height="472" rx="12" fill="none" stroke="#c9a456" strokeWidth="1" strokeDasharray="2 4" />
            <g fill="#c9a456" opacity=".7">
              <path d="M24 34 l10 -10 l10 10 l-10 10 Z" /><path d="M356 34 l10 -10 l10 10 l-10 10 Z" />
              <path d="M24 466 l10 -10 l10 10 l-10 10 Z" /><path d="M356 466 l10 -10 l10 10 l-10 10 Z" />
            </g>

            {/* Fars xalçası (zəmin) */}
            <g>
              <rect x="34" y="452" width="332" height="22" rx="2" fill="#a8322a" stroke="#6e1d17" />
              <rect x="40" y="456" width="320" height="14" fill="none" stroke="#e7c06a" strokeWidth="1.4" />
              <path d="M52 463 l8 -5 l8 5 l-8 5 Z M100 463 l8 -5 l8 5 l-8 5 Z M148 463 l8 -5 l8 5 l-8 5 Z M196 463 l8 -5 l8 5 l-8 5 Z M244 463 l8 -5 l8 5 l-8 5 Z M292 463 l8 -5 l8 5 l-8 5 Z M332 463 l8 -5 l8 5 l-8 5 Z" fill="#2c4f8c" />
              <path d="M36 474 v6 M44 474 v6 M52 474 v6 M60 474 v6 M340 474 v6 M348 474 v6 M356 474 v6 M364 474 v6" stroke="#c9a456" strokeWidth="1.4" />
            </g>

            {/* ── FİL (rentgendə solğunlaşır) ── */}
            <g className="jzc__hide">
              {/* uzaq ayaqlar */}
              <rect x="152" y="404" width="24" height="56" rx="7" fill="#5f6474" />
              <rect x="296" y="404" width="24" height="56" rx="7" fill="#5f6474" />
              {/* quyruq */}
              <path d="M324 360 C338 372 342 392 338 410" fill="none" stroke="#6b7080" strokeWidth="3" strokeLinecap="round" />
              <path d="M338 406 C332 412 332 420 336 424 C338 418 340 418 342 424 C346 418 344 410 338 406 Z" fill="#3f4250" />
              {/* gövdə */}
              <path d="M326 352 C326 318 292 300 236 300 C196 300 160 304 136 312 C120 300 92 294 74 304 C58 314 54 340 60 360 C64 372 66 384 64 400 C62 418 54 432 46 438 C40 443 44 452 52 448 C66 440 78 418 80 398 C84 384 88 380 94 382 C104 392 114 400 124 404 C128 420 134 428 146 428 L300 428 C320 428 330 396 326 352 Z"
                fill={`url(#${id('hide')})`} stroke="#474b59" strokeWidth="1.6" strokeLinejoin="round" />
              {/* xortumun qırışları */}
              <path d="M62 392 q6 2 12 0 M60 408 q6 2 11 -1 M55 422 q5 2 10 -2" fill="none" stroke="#5a5e6d" strokeWidth="1" />
              {/* yaxın ayaqlar */}
              <rect x="122" y="398" width="27" height="62" rx="8" fill={`url(#${id('hide')})`} stroke="#474b59" />
              <rect x="262" y="398" width="27" height="62" rx="8" fill={`url(#${id('hide')})`} stroke="#474b59" />
              <path d="M126 458 q3 -4 6 0 M134 458 q3 -4 6 0 M142 458 q3 -4 5 0 M266 458 q3 -4 6 0 M274 458 q3 -4 6 0 M282 458 q3 -4 5 0" fill="none" stroke="#f3ead2" strokeWidth="1.6" />
              {/* qulaq */}
              <path d="M112 316 C140 310 152 338 144 368 C136 392 112 390 104 372 C98 352 100 330 112 316 Z" fill="#8a8fa0" stroke="#474b59" strokeWidth="1.4" />
              <path d="M114 328 C130 326 136 346 132 364" fill="none" stroke="#6b7080" strokeWidth="1" />
              {/* baş bəzəyi, göz, fil dişi */}
              <path d="M70 312 C84 300 104 300 118 308" fill="none" stroke={`url(#${id('gold')})`} strokeWidth="4" strokeLinecap="round" />
              <circle cx="94" cy="304" r="3" fill="#a8322a" stroke="#e7c06a" />
              <path d="M74 336 q6 -4 11 0" fill="none" stroke="#2b2a30" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="80" cy="334" r="1.8" fill="#2b2a30" />
              <path d="M80 380 C74 392 62 398 46 394 C60 390 70 382 72 372 Z" fill="#fbf3dc" stroke="#a89878" />
              {/* Fars xalçası — çul */}
              <path d="M150 307 C190 298 282 298 318 320 L322 384 C284 396 192 396 152 384 Z" fill="#b23a2b" stroke={`url(#${id('gold')})`} strokeWidth="3" />
              <path d="M160 314 C196 307 276 307 308 325 L311 376 C278 386 196 386 162 376 Z" fill="none" stroke="#e7c06a" strokeWidth="1" strokeDasharray="3 2" />
              <path d="M236 324 l22 22 l-22 22 l-22 -22 Z" fill={`url(#${id('lapis')})`} stroke="#e7c06a" strokeWidth="1.4" />
              <circle cx="236" cy="346" r="5" fill="#e7c06a" />
              <path d="M180 346 l8 -8 l8 8 l-8 8 Z M276 346 l8 -8 l8 8 l-8 8 Z" fill="#e7c06a" opacity=".85" />
              <g fill="#e7c06a">
                <circle cx="160" cy="390" r="2.4" /><circle cx="180" cy="393" r="2.4" /><circle cx="200" cy="395" r="2.4" /><circle cx="220" cy="396" r="2.4" />
                <circle cx="240" cy="396" r="2.4" /><circle cx="260" cy="395" r="2.4" /><circle cx="280" cy="393" r="2.4" /><circle cx="300" cy="390" r="2.4" />
              </g>
            </g>

            {/* ── İÇ MEXANİZM (rentgen): su çəni və batan qab ── */}
            <g className="jzc__inside" aria-hidden="true">
              <rect x="178" y="332" width="84" height="88" rx="4" fill="#0f1f3a" fillOpacity=".55" stroke="#e7c06a" strokeWidth="1.6" />
              <g clipPath={`url(#${id('tank')})`}>
                <path className="jzc__wave" d={WAVE} fill={`url(#${id('water')})`} />
              </g>
              <g clipPath={`url(#${id('str')})`}>
                <g className="jzc__bowl" style={{ transform: `translateY(${(level * SINK).toFixed(2)}px)` }}>
                  <g className="jzc__bowl-cycle" style={seqStyle}>
                    {/* qabdan qüllənin başına qalxan ip */}
                    <line x1="220" y1="342" x2="220" y2="-80" stroke="#f6dc8e" strokeWidth="1.2" strokeDasharray="4 3" />
                    <path d="M198 342 L242 342 Q242 362 220 364 Q198 362 198 342 Z" fill="#d9a54a" stroke="#7a5418" strokeWidth="1.4" />
                    <path d="M200 344 L240 344 Q239 360 220 362 Q201 360 200 344 Z" fill="#5d9ad0" opacity={(0.15 + level * 0.8).toFixed(2)} />
                    <circle cx="220" cy="363" r="1.6" fill="#2b1d08" />
                    <circle className="jzc__bubble" cx="220" cy="358" r="1.6" fill="#d8ecff" />
                  </g>
                </g>
              </g>
            </g>

            {/* ── QÜLLƏ (hövdəc) ── */}
            <rect x="160" y="284" width="120" height="16" rx="3" fill={`url(#${id('gold')})`} stroke="#7a5418" />
            <path d="M166 292 h108" stroke="#a8322a" strokeWidth="2" strokeDasharray="6 4" />
            {/* katibin köşkü */}
            <rect x="172" y="214" width="96" height="70" fill={`url(#${id('lapis')})`} stroke="#7a5418" />
            <path d="M184 284 V242 Q184 224 220 222 Q256 224 256 242 V284" fill="#efe0b6" stroke="#7a5418" strokeWidth="1.4" />
            <rect x="172" y="214" width="10" height="70" fill={`url(#${id('gold')})`} />
            <rect x="258" y="214" width="10" height="70" fill={`url(#${id('gold')})`} />
            {/* katib: dönən fiqur, qələmi yarım saat şkalasında */}
            <g className="jzc__scribe">
              <ellipse cx="220" cy="282" rx="22" ry="3.5" fill="#c79a3e" />
              <path d="M208 280 Q208 254 220 252 Q232 254 232 280 Z" fill="#2f6b55" stroke="#1f4a3a" />
              <circle cx="220" cy="246" r="7" fill="#e6c49a" stroke="#8a6a44" strokeWidth=".8" />
              <path d="M212 244 Q212 234 220 233 Q228 234 228 244 Q220 240 212 244 Z" fill="#fbf3dc" stroke="#a89878" strokeWidth=".8" />
              <path d="M198 271 A26 26 0 0 0 242 271" fill="none" stroke="#7a5418" strokeWidth="1.4" />
              <g stroke="#7a5418" strokeWidth="1">
                <path d="M197.5 271 l2 -2 M206 280 l1.2 -2.6 M220 284 v-3 M234 280 l-1.2 -2.6 M242.5 271 l-2 -2" />
              </g>
              <g className="jzc__pen" style={{ transform: `rotate(${penAngle.toFixed(1)}deg)` }}>
                <line x1="220" y1="258" x2="220" y2="280" stroke="#e6c49a" strokeWidth="3" strokeLinecap="round" />
                <line x1="220" y1="276" x2="220" y2="284" stroke="#2b1d08" strokeWidth="1.4" />
              </g>
            </g>
            {/* yuxarı qala + siferblat */}
            <rect x="178" y="140" width="84" height="74" fill="#d8b267" stroke="#7a5418" />
            <path d="M178 140 h84 v-8 h-8 v4 h-8 v-4 h-8 v4 h-8 v-4 h-8 v4 h-8 v-4 h-8 v4 h-8 v-4 h-8 v4 h-8 v-4 h-12 Z" fill="#c79a3e" stroke="#7a5418" />
            <rect x="178" y="202" width="84" height="12" fill="#a8322a" />
            <path d="M186 208 h68" stroke="#e7c06a" strokeWidth="1" strokeDasharray="2 3" />
            <circle cx="220" cy="178" r="20" fill={`url(#${id('lapis')})`} stroke={`url(#${id('gold')})`} strokeWidth="3" />
            <g strokeWidth="1.4" strokeLinecap="round">
              {DIAL.map(d => (
                <line key={d.i} x1={d.x1.toFixed(2)} y1={d.y1.toFixed(2)} x2={d.x2.toFixed(2)} y2={d.y2.toFixed(2)}
                  stroke={d.i === st.index ? '#ffe9a6' : d.i < st.index ? '#d4a644' : '#5c79b4'} />
              ))}
            </g>
            <circle cx="220" cy="178" r="5" fill="#e7c06a" />
            {/* günbəz */}
            <path d="M184 132 C184 110 206 104 214 88 C216 82 220 76 220 70 C220 76 224 82 226 88 C234 104 256 110 256 132 Z" fill={`url(#${id('lapis')})`} stroke="#7a5418" strokeWidth="1.4" />
            <path d="M200 132 C200 114 212 104 220 84 C228 104 240 114 240 132 M220 84 V132" fill="none" stroke="#e7c06a" strokeWidth="1.2" />
            {/* feniks */}
            <g className="jzc__phoenix">
              <path d="M220 70 C214 62 200 58 192 50 C204 52 212 54 218 60 C214 50 216 42 220 38 C224 42 226 50 222 60 C228 54 236 52 248 50 C240 58 226 62 220 70 Z" fill="#c8402f" stroke="#7a2318" strokeWidth="1" />
              <path d="M220 66 C226 64 234 66 240 72 C232 70 226 70 220 70 Z" fill="#e7c06a" />
              <circle cx="220" cy="42" r="3.6" fill="#e7c06a" stroke="#7a2318" strokeWidth=".8" />
              <path d="M216 41 l-4 1 l4 1 Z" fill="#7a2318" />
            </g>
            {/* şahinlər (künclərdə) */}
            <g fill="#8a5a2b" stroke="#4a2f12" strokeWidth=".8">
              <path d="M184 134 C180 126 172 124 166 128 L158 132 L166 133 C168 138 174 140 184 140 Z" />
              <path d="M256 134 C260 126 268 124 274 128 L282 132 L274 133 C272 138 266 140 256 140 Z" />
            </g>
            <circle cx="167" cy="129" r="1.2" fill="#fbf3dc" /><circle cx="273" cy="129" r="1.2" fill="#fbf3dc" />

            {/* ilanlar — sol ilan buraxılışda əyilir */}
            <g className="jzc__serpent">
              <path d="M165 288 C140 270 140 245 158 230 C176 214 176 192 160 178 C150 170 152 160 158 152" fill="none" stroke="#2f6b55" strokeWidth="7" strokeLinecap="round" />
              <path d="M165 288 C140 270 140 245 158 230 C176 214 176 192 160 178 C150 170 152 160 158 152" fill="none" stroke="#e7c06a" strokeWidth="1.4" strokeDasharray="2 5" />
              <path d="M152 158 L148 144 L156 149 L159 138 L166 150 L164 158 Z" fill="#2f6b55" stroke="#1f4a3a" strokeWidth=".8" />
              <circle cx="158" cy="152" r="1.3" fill="#ffe9a6" />
            </g>
            <g transform="translate(440 0) scale(-1 1)">
              <path d="M165 288 C140 270 140 245 158 230 C176 214 176 192 160 178 C150 170 152 160 158 152" fill="none" stroke="#2f6b55" strokeWidth="7" strokeLinecap="round" />
              <path d="M165 288 C140 270 140 245 158 230 C176 214 176 192 160 178 C150 170 152 160 158 152" fill="none" stroke="#e7c06a" strokeWidth="1.4" strokeDasharray="2 5" />
              <path d="M152 158 L148 144 L156 149 L159 138 L166 150 L164 158 Z" fill="#2f6b55" stroke="#1f4a3a" strokeWidth=".8" />
              <circle cx="158" cy="152" r="1.3" fill="#ffe9a6" />
            </g>

            {/* filçi + sinc */}
            <line x1="100" y1="290" x2="100" y2="299" stroke="#7a5418" strokeWidth="2" />
            <ellipse className="jzc__cymbal" cx="100" cy="289" rx="10" ry="3.2" fill={`url(#${id('gold')})`} stroke="#7a5418" />
            <g>
              <path d="M118 308 Q128 300 138 308 L136 316 Q128 312 120 316 Z" fill="#a8322a" />
              <path d="M120 306 Q120 284 128 282 Q136 284 136 306 Z" fill="#c8402f" stroke="#7a2318" strokeWidth=".8" />
              <circle cx="128" cy="275" r="6.5" fill="#e6c49a" stroke="#8a6a44" strokeWidth=".8" />
              <path d="M121 273 Q121 263 128 262 Q135 263 135 273 Q128 269 121 273 Z" fill={`url(#${id('lapis')})`} />
              <g className="jzc__arm">
                <line x1="125" y1="287" x2="109" y2="278" stroke="#e6c49a" strokeWidth="3" strokeLinecap="round" />
                <line x1="109" y1="278" x2="104" y2="270" stroke="#7a5418" strokeWidth="2" strokeLinecap="round" />
                <circle cx="104" cy="270" r="2.6" fill="#7a5418" />
              </g>
            </g>

            {/* rentgen: qabın ipi qüllənin içi ilə şahinin yanındakı kürə kilidinə qalxır */}
            <g className="jzc__inside" aria-hidden="true">
              <path d="M220 300 L178 288 L178 146 L166 136" fill="none" stroke="#f6dc8e" strokeWidth="1.4" strokeDasharray="4 3" />
              <circle cx="178" cy="146" r="3" fill="none" stroke="#f6dc8e" strokeWidth="1.4" />
              <circle cx="178" cy="288" r="3" fill="none" stroke="#f6dc8e" strokeWidth="1.4" />
            </g>
            {/* kürə (buraxılışda şahinin dimdiyindən düşür) */}
            <circle className="jzc__ball" cx="158" cy="140" r="4.5" fill="#f2d27a" stroke="#7a5418" strokeWidth="1" />
          </svg>
        </div>

        <div className="jzc__panel" dir={rtl}>
          <dl className="jzc__read">
            <div><dt>{u.local}</dt><dd className="ui-num" data-testid="jzc-time">{fmt.format(t)}</dd></div>
            <div><dt>{u.half}</dt><dd className="ui-num jzc__small">{fmt.format(halfStart)}–{fmt.format(halfStart + HALF_MS)}</dd></div>
            <div><dt>{u.bowl}</dt><dd className="ui-num">{Math.round(level * 100)}%</dd></div>
            <div><dt>{u.release}</dt><dd className="ui-num jzc__small">{dur(st.toNext)}</dd></div>
            <div className="jzc__read-wide"><dt>{u.next}</dt><dd className="jzc__small">{next ? <>{nextName} · <span className="ui-num">{dur(nextMs)}</span></> : '…'}</dd></div>
          </dl>
          <div className="jzc__meter" aria-hidden="true"><span style={{ transform: `scaleX(${level.toFixed(4)})` }} /></div>
          <div className="jzc__btns">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" data-testid="jzc-play"
              onClick={() => startRelease(true)} disabled={!!release}>{u.play}</button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" data-testid="jzc-xray"
              aria-pressed={xray} onClick={() => setXray(x => !x)}>{xray ? u.xrayOff : u.xray}</button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" data-testid="jzc-sound"
              aria-pressed={sound} onClick={toggleSound}>{sound ? u.soundOn : u.soundOff}</button>
          </div>
          <p className="jzc__status" role="status" aria-live="polite">{release ? u.ring : ''}</p>
          <h3 className="jzc__how">{u.how}</h3>
          <ol className="jzc__steps">
            {u.steps.map((s, i) => (
              <li key={i} className={(release ? (reduced ? i > 0 : i === activeStep) : i === 0) ? 'is-on' : undefined}>{s}</li>
            ))}
          </ol>
          <p className="jzc__note">{u.cultures}</p>
          <p className="jzc__src">{u.source}</p>
        </div>
      </div>
    </section>
  )
}
