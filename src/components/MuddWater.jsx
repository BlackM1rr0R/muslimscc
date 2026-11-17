// ═══════════════════════════════════════════════════════
// MuddWater (v8) — "Bir mudd su": Peyğəmbərin ﷺ dəstəmazı və bizim kranımız
//
// • Əsas: saytın hədis bazasındakı rəvayət (data/hadiths.js id 1602, "Muslim,
//   Hayz 51") — mətn OLDUĞU KİMİ utils/muddWater.js → MUDD_HADITH-dən; əlavə
//   istinad: Səhih Buxari 201 (yalnız istinad, mətn yazılmır).
// • Mudd ≈ 0,5–0,75 L (müasir qiymətləndirmələr fərqlidir) — SVG qabda bir mudd su.
// • "Kran" saniyəölçəni: dəstəmaz alarkən başla / dayandır və ya saniyəni yaz;
//   axın: zəif ≈ 4, adi ≈ 8, güclü ≈ 12 L/dəq və ya öz rəqəmin (1 litrlik şüşəni
//   neçə saniyəyə doldurur). Nəticə: litr, ikinci qabın dolması və "× mudd".
// • Son 7 dəstəmaz localStorage 'muslim_cc_mudd_log' — meyl qrafiki.
// • Qənaət məsləhətləri praktikdir, fiqh hökmü deyil. Səs yoxdur.
// • Saniyəölçən yalnız işləyəndə, ekranda və tab görünəndə yenilənir (vaxt
//   Date.now() fərqindən hesablanır — dayansa da itmir). Dalğa — yalnız transform.
// ═══════════════════════════════════════════════════════
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { useReduced } from '../motion/reduced.js'
import Icon from './Icon'
import {
  MUDD_L, MUDD_MIN_L, MUDD_MAX_L, MUDD_HADITH, FLOWS, FLOW_IDS, CUSTOM_MIN, CUSTOM_MAX,
  flowLpm, lpmFromFillSeconds, litresFor, muddRatio, fmt1, parseSeconds, fmtClock, vesselCap,
  loadLog, saveLog, addEntry, trendOf,
} from '../utils/muddWater'
import '../styles/MuddWater.css'

const T = {
  az: {
    ey: 'Su və ibadət', title: 'Bir mudd su — Peyğəmbərin ﷺ dəstəmazı',
    lead: 'Peyğəmbər ﷺ bir mudd su ilə dəstəmaz alardı — bu, təxminən iki ovuc dolusudur. Bəs bizim kranımızdan nə qədər axır? Dəstəmaz alarkən saniyəölçəni işə salın və ya vaxtı yazın — nə qədər su işlətdiyinizi görün.',
    mudd: 'Bir mudd', muddSub: 'təxminən {a}–{b} L', yours: 'Sizin dəstəmazınız',
    start: 'Kranı açdım — başla', stop: 'Bitirdim — dayandır', reset: 'Sıfırla',
    flow: 'Kranın axını', low: 'Zəif', normal: 'Adi', strong: 'Güclü', custom: 'Öz rəqəmim',
    lpm: 'L/dəq', fillLabel: '1 litrlik şüşə neçə saniyəyə dolur?', fillHint: 'Kranın altına 1 litrlik şüşə qoyub vaxtı ölçün — axın özü hesablanacaq.',
    orEnter: 'Və ya vaxtı yazın', enterPh: 'məs. 90 və ya 1:30', calc: 'Hesabla', bad: 'Saniyə və ya dəq:san yazın (1 saata qədər).',
    used: 'İşlədilən su', L: 'L', times: '× mudd', time: 'Vaxt',
    verdictGood: 'Sünnəyə çox yaxın — gözəl!', verdictOk: 'Pis deyil — kranı ovuşdurarkən bağlasanız, daha da azalar.', verdictHigh: 'Bir neçə mudd əvəzinə bir vedrə… aşağıdakı məsləhətlərə baxın.',
    hadithT: 'Hədisdə', also: 'Həmçinin bax:', alsoRef: 'Səhih Buxari 201', saNote: 'Sa\' — dörd mudddur.',
    tipsT: 'Su qənaəti üçün məsləhətlər',
    tips: ['Əlləri, üzü, qolları ovuşdurarkən kranı bağlayın — su yalnız yuyanda axsın.', 'Kiçik qab və ya stəkandan istifadə edin: bir stəkan təxminən bir-iki mudd tutur.', 'Kranı yarıya qədər açın — zəif axın da üzvü tam isladır.', 'Suyu ovucda toplayıb üzvə çəkin, əli axının altında saxlamayın.'],
    histT: 'Son 7 dəstəmaz', histEmpty: 'Hələ qeyd yoxdur — ilk dəstəmazınızı ölçün.', avg: 'Orta', clear: 'Tarixçəni sil',
    down: 'Əvvəlkilərdən {p}% az su', up: 'Əvvəlkilərdən {p}% çox su', same: 'Əvvəlkilərlə təxminən eyni',
    note: 'Hesab təxminidir: kranların axını fərqlidir, mudd isə orta qiymətlə ({m} L) götürülüb. Məsləhətlər praktikdir, fiqh hökmü deyil. Tarixçə yalnız bu cihazda saxlanır.',
  },
  en: {
    ey: 'Water and worship', title: 'One mudd of water — the Prophet’s ﷺ wudu',
    lead: 'The Prophet ﷺ made wudu with one mudd of water — about two cupped handfuls. How much flows from our tap? Start the timer while you make wudu, or type the time, and see how much water you used.',
    mudd: 'One mudd', muddSub: 'about {a}–{b} L', yours: 'Your wudu',
    start: 'Tap on — start', stop: 'Done — stop', reset: 'Reset',
    flow: 'Tap flow', low: 'Low', normal: 'Normal', strong: 'Strong', custom: 'My own',
    lpm: 'L/min', fillLabel: 'Seconds to fill a 1-litre bottle?', fillHint: 'Hold a 1-litre bottle under the tap and time it — the flow is worked out for you.',
    orEnter: 'Or type the time', enterPh: 'e.g. 90 or 1:30', calc: 'Calculate', bad: 'Enter seconds or min:sec (up to 1 hour).',
    used: 'Water used', L: 'L', times: '× mudd', time: 'Time',
    verdictGood: 'Very close to the Sunnah — beautiful!', verdictOk: 'Not bad — turn the tap off while rubbing and it drops further.', verdictHigh: 'A bucket instead of a mudd… see the tips below.',
    hadithT: 'In the hadith', also: 'See also:', alsoRef: 'Sahih al-Bukhari 201', saNote: 'A sa’ is four mudds.',
    tipsT: 'Tips for saving water',
    tips: ['Turn the tap off while rubbing your hands, face and arms — let it run only to rinse.', 'Use a small jug or cup: a cup holds roughly one to two mudds.', 'Open the tap halfway — a gentle flow wets the limb fully.', 'Gather water in your palm and pass it over the limb rather than holding it under the stream.'],
    histT: 'Last 7 wudus', histEmpty: 'No entries yet — measure your first wudu.', avg: 'Average', clear: 'Clear history',
    down: '{p}% less water than before', up: '{p}% more water than before', same: 'About the same as before',
    note: 'An estimate: taps differ, and the mudd is taken at a middle value ({m} L). Tips are practical, not fiqh rulings. History stays on this device only.',
  },
  ru: {
    ey: 'Вода и поклонение', title: 'Один мудд воды — омовение Пророка ﷺ',
    lead: 'Пророк ﷺ совершал омовение одним муддом воды — это примерно две пригоршни. А сколько течёт из нашего крана? Запустите таймер во время омовения или введите время — и увидите, сколько воды ушло.',
    mudd: 'Один мудд', muddSub: 'примерно {a}–{b} л', yours: 'Ваше омовение',
    start: 'Кран открыт — старт', stop: 'Готово — стоп', reset: 'Сбросить',
    flow: 'Напор крана', low: 'Слабый', normal: 'Обычный', strong: 'Сильный', custom: 'Свой',
    lpm: 'л/мин', fillLabel: 'За сколько секунд наполняется бутылка 1 л?', fillHint: 'Подставьте под кран бутылку на 1 литр и засеките время — напор посчитается сам.',
    orEnter: 'Или введите время', enterPh: 'напр. 90 или 1:30', calc: 'Посчитать', bad: 'Введите секунды или мин:сек (до 1 часа).',
    used: 'Израсходовано воды', L: 'л', times: '× мудд', time: 'Время',
    verdictGood: 'Очень близко к Сунне — прекрасно!', verdictOk: 'Неплохо — закрывайте кран, пока растираете, и станет ещё меньше.', verdictHigh: 'Ведро вместо мудда… загляните в советы ниже.',
    hadithT: 'В хадисе', also: 'См. также:', alsoRef: 'Сахих аль-Бухари 201', saNote: 'Саа — это четыре мудда.',
    tipsT: 'Как беречь воду',
    tips: ['Закрывайте кран, пока растираете руки, лицо и предплечья — пусть вода течёт только для смывания.', 'Пользуйтесь кувшином или стаканом: стакан вмещает примерно один-два мудда.', 'Открывайте кран наполовину — слабой струи достаточно, чтобы смочить весь орган.', 'Набирайте воду в ладонь и проводите по органу, а не держите руку под струёй.'],
    histT: 'Последние 7 омовений', histEmpty: 'Пока нет записей — измерьте первое омовение.', avg: 'В среднем', clear: 'Очистить историю',
    down: 'На {p}% меньше воды, чем раньше', up: 'На {p}% больше воды, чем раньше', same: 'Примерно как раньше',
    note: 'Расчёт приблизительный: напор кранов разный, а мудд взят по среднему значению ({m} л). Советы практические, это не фетва. История хранится только на этом устройстве.',
  },
  ar: {
    ey: 'الماء والعبادة', title: 'مُدٌّ من الماء — وضوء النبي ﷺ',
    lead: 'كان النبي ﷺ يتوضأ بالمُدّ — وهو نحو ملء الكفّين. فكم يجري من صنبورنا؟ شغّل المؤقّت وأنت تتوضأ أو اكتب المدة، وانظر كم استهلكت من الماء.',
    mudd: 'مُدٌّ واحد', muddSub: 'نحو {a}–{b} لتر', yours: 'وضوؤك',
    start: 'فتحتُ الصنبور — ابدأ', stop: 'انتهيت — أوقف', reset: 'إعادة',
    flow: 'تدفّق الصنبور', low: 'ضعيف', normal: 'عادي', strong: 'قوي', custom: 'رقمي الخاص',
    lpm: 'لتر/د', fillLabel: 'في كم ثانية تمتلئ قارورة لتر؟', fillHint: 'ضع قارورة لتر تحت الصنبور واحسب الوقت — ويُحسب التدفّق تلقائيًا.',
    orEnter: 'أو اكتب المدة', enterPh: 'مثلًا 90 أو 1:30', calc: 'احسب', bad: 'اكتب الثواني أو دقيقة:ثانية (حتى ساعة).',
    used: 'الماء المستهلك', L: 'لتر', times: '× مُدّ', time: 'المدة',
    verdictGood: 'قريب جدًا من السنة — أحسنت!', verdictOk: 'لا بأس — أغلق الصنبور أثناء الدلك فيقلّ أكثر.', verdictHigh: 'دلوٌ بدل المُدّ… انظر النصائح أدناه.',
    hadithT: 'في الحديث', also: 'وانظر:', alsoRef: 'صحيح البخاري 201', saNote: 'الصاع أربعة أمداد.',
    tipsT: 'نصائح لتوفير الماء',
    tips: ['أغلق الصنبور أثناء دلك اليدين والوجه والذراعين، ودع الماء يجري للغسل فقط.', 'استعمل إبريقًا صغيرًا أو كوبًا: الكوب يسع نحو مُدّ أو مُدّين.', 'افتح الصنبور إلى النصف — فالتدفّق الهادئ يعمّ العضو.', 'اجمع الماء في كفّك وأمِرّه على العضو بدل إبقاء اليد تحت الماء الجاري.'],
    histT: 'آخر 7 وضوءات', histEmpty: 'لا سجلات بعد — قِس وضوءك الأول.', avg: 'المتوسط', clear: 'مسح السجل',
    down: 'ماء أقل بنسبة {p}% من قبل', up: 'ماء أكثر بنسبة {p}% من قبل', same: 'نحو ما كان من قبل',
    note: 'الحساب تقريبي: الصنابير تختلف، والمُدّ مأخوذ بقيمة وسطى ({m} لتر). النصائح عملية وليست أحكامًا فقهية. السجل محفوظ على هذا الجهاز فقط.',
  },
  tr: {
    ey: 'Su ve ibadet', title: 'Bir müd su — Peygamber’in ﷺ abdesti',
    lead: 'Peygamber ﷺ bir müd su ile abdest alırdı — bu yaklaşık iki avuç dolusudur. Peki bizim musluğumuzdan ne kadar akıyor? Abdest alırken kronometreyi başlatın ya da süreyi yazın, ne kadar su kullandığınızı görün.',
    mudd: 'Bir müd', muddSub: 'yaklaşık {a}–{b} L', yours: 'Sizin abdestiniz',
    start: 'Musluğu açtım — başla', stop: 'Bitirdim — durdur', reset: 'Sıfırla',
    flow: 'Musluk akışı', low: 'Zayıf', normal: 'Normal', strong: 'Güçlü', custom: 'Kendi değerim',
    lpm: 'L/dk', fillLabel: '1 litrelik şişe kaç saniyede doluyor?', fillHint: 'Musluğun altına 1 litrelik şişe koyup süreyi ölçün — akış kendiliğinden hesaplanır.',
    orEnter: 'Ya da süreyi yazın', enterPh: 'örn. 90 veya 1:30', calc: 'Hesapla', bad: 'Saniye ya da dk:sn yazın (1 saate kadar).',
    used: 'Kullanılan su', L: 'L', times: '× müd', time: 'Süre',
    verdictGood: 'Sünnete çok yakın — harika!', verdictOk: 'Fena değil — ovarken musluğu kapatırsanız daha da azalır.', verdictHigh: 'Müd yerine bir kova… aşağıdaki önerilere bakın.',
    hadithT: 'Hadiste', also: 'Ayrıca bkz.:', alsoRef: 'Sahih-i Buhârî 201', saNote: 'Bir sa’ dört müddür.',
    tipsT: 'Su tasarrufu için öneriler',
    tips: ['Elleri, yüzü, kolları ovarken musluğu kapatın — su yalnızca yıkarken aksın.', 'Küçük bir ibrik ya da bardak kullanın: bir bardak yaklaşık bir-iki müd alır.', 'Musluğu yarıya kadar açın — hafif akış da uzvu tamamen ıslatır.', 'Suyu avucunuzda toplayıp uzva sürün, eli akan suyun altında tutmayın.'],
    histT: 'Son 7 abdest', histEmpty: 'Henüz kayıt yok — ilk abdestinizi ölçün.', avg: 'Ortalama', clear: 'Geçmişi sil',
    down: 'Öncekilerden %{p} daha az su', up: 'Öncekilerden %{p} daha fazla su', same: 'Öncekilerle hemen hemen aynı',
    note: 'Hesap yaklaşıktır: muslukların akışı farklıdır, müd ise orta değerle ({m} L) alınmıştır. Öneriler pratiktir, fıkhî hüküm değildir. Geçmiş yalnızca bu cihazda saklanır.',
  },
}

const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''))
const store = () => { try { return window.localStorage } catch { return null } }

function makeNf(lang, digits) {
  try { return new Intl.NumberFormat(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits }) }
  catch { return new Intl.NumberFormat('en', { minimumFractionDigits: digits, maximumFractionDigits: digits }) }
}

/* Dalğalı su səthi: eni 2× — translateX(-50%) ilə sonsuz sürüşür */
function wavePath(w, y, amp) {
  let d = `M0 ${y}`
  const seg = w / 4
  for (let i = 0; i < 8; i++) d += ` q${seg / 2} ${i % 2 ? amp : -amp} ${seg} 0`
  return `${d} V400 H0 Z`
}

/** Qab (SVG): frac — 0..1 doluluq; marks — mudd xətlərinin hündürlükləri (0..1) */
function Vessel({ uid, kind, frac, marks = [], label, sub, paused, reduced }) {
  const W = 160, H = 200
  const top = 26, bottom = 186
  const shape = kind === 'bowl'
    ? 'M18 40 Q18 150 80 186 Q142 150 142 40 Z'
    : 'M30 26 L130 26 L122 186 Q80 194 38 186 Z'
  const h = bottom - top
  const lvl = Math.max(0, Math.min(1, frac))
  const y = bottom - h * lvl
  return (
    <figure className={`mw__vessel mw__vessel--${kind}`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="mw__svg" aria-hidden="true">
        <defs>
          <clipPath id={`${uid}-${kind}`}><path d={shape} /></clipPath>
          <linearGradient id={`${uid}-${kind}-w`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7cc7f0" /><stop offset="100%" stopColor="#1f7fbf" />
          </linearGradient>
        </defs>
        <path d={shape} className="mw__glass" />
        <g clipPath={`url(#${uid}-${kind})`}>
          <g className="mw__level" style={{ transform: `translateY(${(y - top).toFixed(1)}px)` }}>
            <g className={`mw__wave${reduced ? '' : ' is-on'}${paused ? ' is-paused' : ''}`}>
              <path d={wavePath(W * 2, top, lvl > 0 ? 4 : 0)} fill={`url(#${uid}-${kind}-w)`} opacity={lvl > 0 ? 0.92 : 0} />
            </g>
          </g>
        </g>
        {marks.map((m, i) => (
          <line key={i} x1={kind === 'bowl' ? 24 : 34} x2={kind === 'bowl' ? 46 : 52} y1={bottom - h * m} y2={bottom - h * m} className="mw__mark" />
        ))}
        <path d={shape} className="mw__rim" />
      </svg>
      <figcaption><strong>{label}</strong>{sub ? <span>{sub}</span> : null}</figcaption>
    </figure>
  )
}

export default function MuddWater() {
  const { lang } = useLang()
  const u = pickUi(T, lang, 'en')
  const reduced = useReduced('decor')
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const rootRef = useRef(null)

  const [flow, setFlow] = useState('normal')
  const [custom, setCustom] = useState('6')
  const [fillSec, setFillSec] = useState('')
  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [now, setNow] = useState(0)
  const startRef = useRef(0)
  const [manual, setManual] = useState('')
  const [bad, setBad] = useState(false)
  const [log, setLog] = useState(() => loadLog(store()))
  const [onscreen, setOnscreen] = useState(true)
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden')

  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([e]) => setOnscreen(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    const on = () => setVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])

  // Saniyəölçən — yalnız işləyəndə, ekranda və tab görünəndə yenilənir
  useEffect(() => {
    if (!running || !onscreen || !visible) return undefined
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [running, onscreen, visible])

  const lpm = flowLpm(flow, custom)
  const elapsed = running ? Math.max(0, (now - startRef.current) / 1000) : seconds
  const litres = litresFor(elapsed, lpm)
  const ratio = muddRatio(litres)
  const cap = vesselCap(litres)
  const nf1 = useMemo(() => makeNf(lang, 1), [lang])
  const nf2 = useMemo(() => makeNf(lang, 2), [lang])

  const marks = useMemo(() => {
    const n = Math.floor(cap / MUDD_L + 1e-6)
    const step = n > 20 ? 5 : 1
    const out = []
    for (let i = step; i <= n; i += step) out.push((i * MUDD_L) / cap)
    return out
  }, [cap])

  const record = (s) => {
    if (!(s >= 2)) return
    const next = addEntry(log, { t: Date.now(), s, lpm })
    setLog(next)
    saveLog(store(), next)
  }
  const start = () => {
    startRef.current = Date.now()
    setNow(startRef.current)
    setSeconds(0)
    setBad(false)
    setRunning(true)
  }
  const stop = () => {
    const s = Math.round((Date.now() - startRef.current) / 1000)
    setRunning(false)
    setSeconds(s)
    record(s)
  }
  const reset = () => { setRunning(false); setSeconds(0) }
  const calc = (e) => {
    e.preventDefault()
    const s = parseSeconds(manual)
    if (!Number.isFinite(s)) { setBad(true); return }
    setBad(false)
    setRunning(false)
    setSeconds(s)
    record(s)
  }
  const onFill = (v) => {
    setFillSec(v)
    const f = lpmFromFillSeconds(v)
    if (Number.isFinite(f)) setCustom(String(Math.round(f * 10) / 10))
  }
  const clearLog = () => { setLog([]); saveLog(store(), []) }

  const trend = trendOf(log)
  const tier = ratio <= 1.6 ? 'good' : ratio <= 5 ? 'ok' : 'high'
  const verdict = tier === 'good' ? u.verdictGood : tier === 'ok' ? u.verdictOk : u.verdictHigh
  const histMax = Math.max(MUDD_L * 2, ...log.map(e => e.l))
  const dateFmt = useMemo(() => {
    try { return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }) } catch { return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }) }
  }, [lang])
  const hLang = MUDD_HADITH.text[lang] ? lang : 'en'
  const pct = trend.change == null ? null : Math.round(Math.abs(trend.change) * 100)
  const trendTxt = pct == null ? '' : pct < 5 ? u.same : fill(trend.change < 0 ? u.down : u.up, { p: pct })

  return (
    <section ref={rootRef} className="ui-card mw" aria-labelledby={`${uid}-t`} data-testid="mudd-water" data-litres={fmt1(litres)}>
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 id={`${uid}-t`} className="mw__title">{u.title}</h2>
      <p className="mw__lead">{u.lead}</p>

      <div className="mw__grid">
        <div className="mw__stage">
          <Vessel uid={uid} kind="bowl" frac={0.78} label={u.mudd}
            sub={fill(u.muddSub, { a: nf2.format(MUDD_MIN_L), b: nf2.format(MUDD_MAX_L) })}
            paused={!onscreen || !visible} reduced={reduced} />
          <div className="mw__vs" aria-hidden="true">×</div>
          <Vessel uid={uid} kind="jug" frac={litres / cap} marks={marks} label={u.yours}
            sub={`${nf1.format(litres)} ${u.L}`} paused={!onscreen || !visible} reduced={reduced} />
        </div>

        <div className="mw__panel">
          <div className="mw__readout">
            <div className={`mw__ratio mw__ratio--${tier}`}>
              <span className="ui-num" data-testid="mw-ratio">{nf1.format(ratio)}</span>
              <small>{u.times}</small>
            </div>
            <dl className="mw__dl">
              <div><dt>{u.used}</dt><dd className="ui-num">{nf1.format(litres)} {u.L}</dd></div>
              <div><dt>{u.time}</dt><dd className="ui-num" data-testid="mw-time">{fmtClock(elapsed)}</dd></div>
            </dl>
          </div>
          {!running && elapsed > 0 ? <p className="mw__verdict" aria-live="polite">{verdict}</p> : null}

          <div className="mw__btns">
            {running
              ? <button type="button" className="ui-btn ui-btn--primary" data-testid="mw-stop" onClick={stop}><Icon name="pause" size={18} /> {u.stop}</button>
              : <button type="button" className="ui-btn ui-btn--primary" data-testid="mw-start" onClick={start}><Icon name="play" size={18} /> {u.start}</button>}
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={reset} disabled={!running && !seconds}><Icon name="refresh" size={16} /> {u.reset}</button>
          </div>

          <fieldset className="mw__flow">
            <legend>{u.flow}</legend>
            <div className="mw__chips">
              {FLOW_IDS.map(id => (
                <button key={id} type="button" className="ui-chip" aria-pressed={flow === id} data-flow={id} onClick={() => setFlow(id)}>
                  {u[id]}{FLOWS[id] ? <span className="mw__chipv"> ≈{FLOWS[id]} {u.lpm}</span> : null}
                </button>
              ))}
            </div>
            {flow === 'custom' ? (
              <div className="mw__custom">
                <label>
                  <span>{u.lpm}</span>
                  <input type="number" inputMode="decimal" min={CUSTOM_MIN} max={CUSTOM_MAX} step="0.1" className="ui-input" value={custom}
                    onChange={(e) => setCustom(e.target.value)} data-testid="mw-custom" />
                </label>
                <label>
                  <span>{u.fillLabel}</span>
                  <input type="number" inputMode="decimal" min="1" step="0.5" className="ui-input" value={fillSec}
                    onChange={(e) => onFill(e.target.value)} />
                </label>
                <p className="mw__hint">{u.fillHint}</p>
              </div>
            ) : null}
          </fieldset>

          <form className="mw__manual" onSubmit={calc}>
            <label htmlFor={`${uid}-m`}>{u.orEnter}</label>
            <div className="mw__row">
              <input id={`${uid}-m`} className="ui-input" inputMode="numeric" placeholder={u.enterPh} value={manual}
                onChange={(e) => setManual(e.target.value)} aria-invalid={bad || undefined} data-testid="mw-seconds" />
              <button type="submit" className="ui-btn ui-btn--secondary ui-btn--sm">{u.calc}</button>
            </div>
            {bad ? <p className="mw__err" role="alert">{u.bad}</p> : null}
          </form>
        </div>
      </div>

      <div className="mw__cols">
        <blockquote className="mw__hadith" data-testid="mw-hadith">
          <span className="mw__h">{u.hadithT}</span>
          <p className="mw__ar" lang="ar" dir="rtl">{MUDD_HADITH.ar}</p>
          {lang !== 'ar' ? <p className="mw__tr">{MUDD_HADITH.text[hLang]}</p> : null}
          <footer>
            <cite className="mw__src">{MUDD_HADITH.source}</cite>
            <span className="mw__also"> · {u.also} {u.alsoRef}</span>
            <span className="mw__sa"> · {u.saNote}</span>
          </footer>
        </blockquote>

        <div className="mw__tips">
          <h3>{u.tipsT}</h3>
          <ul>{u.tips.map((t, i) => <li key={i}><Icon name="drop" size={16} /> <span>{t}</span></li>)}</ul>
        </div>
      </div>

      <div className="mw__hist" data-testid="mw-history">
        <div className="mw__histhead">
          <h3>{u.histT}</h3>
          {log.length ? <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={clearLog}><Icon name="trash" size={14} /> {u.clear}</button> : null}
        </div>
        {log.length ? (
          <>
            <div className="mw__bars" role="list">
              <div className="mw__muddline" style={{ bottom: `${(MUDD_L / histMax) * 100}%` }} aria-hidden="true"><span>{u.mudd}</span></div>
              {log.map((e, i) => (
                <div key={`${e.t}-${i}`} className="mw__bar" role="listitem" aria-label={`${dateFmt.format(e.t)}: ${nf1.format(e.l)} ${u.L}`}>
                  <span className="mw__barv ui-num">{nf1.format(e.l)}</span>
                  <span className="mw__barfill" style={{ height: `${Math.max(3, (e.l / histMax) * 100)}%` }} />
                  <span className="mw__bard">{dateFmt.format(e.t)}</span>
                </div>
              ))}
            </div>
            <p className="mw__trend">
              {u.avg}: <strong className="ui-num">{nf1.format(trend.avg)} {u.L}</strong> ({nf1.format(muddRatio(trend.avg))} {u.times})
              {trendTxt ? <> · <span className={trend.change < 0 ? 'mw__good' : ''}>{trendTxt}</span></> : null}
            </p>
          </>
        ) : <p className="mw__empty">{u.histEmpty}</p>}
      </div>

      <p className="mw__note">{fill(u.note, { m: nf2.format(MUDD_L) })}</p>
    </section>
  )
}
