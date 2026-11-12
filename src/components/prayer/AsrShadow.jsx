// ═══════════════════════════════════════════════════════
// AsrShadow (v6.4) — "Əsrin kölgəsi": çubuğun kölgəsi sizin şəhərdə bu gün (/prayer)
//
//   <AsrShadow loc={{ lat, lng, tz }} lang="az" city="Bakı" siteAsr="14:21" />
//
// • Yuxarıdan görünüş: ortada çubuq, kölgə Günəşin tərsinə düşür; kölgə ucunun gün boyu izi.
//   İki dairə: günorta kölgəsi + 1 boy (1×) və + 2 boy (2×). Kölgənin ucu dairəyə çatanda — əsr.
// • Sürüşdürmə ilə günün istənilən anı; "Günü oynat" — günəşin doğuşundan batışına (~10 s).
// • Mənbə: Cəbrail hədisi — Əbu Davud 393 (əl-Albani: həsən səhih), Tirmizi 149. Ərəb mətni hədisin
//   özündən (hadith-api, söz-söz); izah — bizim sözlərimizlə, tərcümə deyil.
// • Hesab — utils/asrShadow.js (Meeus; saytın cədvəli ilə ±2 dəq, testlə). Hərəkət azaldılıbsa — oynatma dərhal.
// Stillər: src/styles/AsrShadow.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { localizeSource } from '../../utils/sourceNames'
import { asrDay, shadowVec, tipPath, localDayStart } from '../../utils/asrShadow'
import '../../styles/AsrShadow.css'

const T = {
  az: {
    ey: 'Əsrin kölgəsi', title: 'Əsr vaxtı kölgə ilə necə bilinir?', lead: c => `Yerə bir çubuq basdırın: günorta kölgəsi ən qısadır, sonra uzanır. ${c ? `${c} üçün bu gün` : 'Bu gün'} kölgənin ucu birinci dairəyə çatanda əsr vaxtı girir.`,
    time: 'Vaxt', len: 'Kölgə', boy: 'boy', noon: 'Günorta kölgəsi', asr1: 'Əsr (1×)', asr2: 'Əsr (2×)', table: 'Saytın cədvəlində əsr',
    play: 'Günü oynat', stop: 'Dayandır', now: 'İndi', alt: 'Günəşin hündürlüyü',
    before: 'Kölgə hələ birinci dairəyə çatmayıb — zöhr vaxtı.', between: 'Kölgə birinci dairəni keçib — əsr vaxtı (1×).', after: 'Kölgə ikinci dairəni də keçib (2×).',
    morning: 'Səhər: kölgə qısalır, günortaya doğru ən qısa olacaq.', night: 'Günəş üfüqdən aşağıdadır — kölgə yoxdur.', polar: 'Bu gün şəhərinizdə Günəş doğmur — kölgə yoxdur.',
    dirs: ['Şm', 'Şq', 'C', 'Q'], dirN: 'Şimal', ring1: '1×', ring2: '2×',
    hadith: 'Cəbrail (ə) Peyğəmbərə (ﷺ) iki gün namaz qıldırdı: birinci gün əsri hər şeyin kölgəsi özü qədər olanda, ikinci gün iki misli olanda. Kölgəyə günortadakı kölgə üstəgəl əlavə olunur.',
    method: 'Saytın namaz cədvəli 1× qaydası ilə hesablanır (Şafii, Maliki, Hənbəli məzhəbləri). Hənəfi məzhəbində (Əbu Hənifənin görüşü) əsr 2× ilə hesablanır.',
    grade: 'əl-Albani: həsən səhih', aria: (len, t) => `Kölgə ${len} boy, saat ${t}`,
  },
  en: {
    ey: 'The shadow of Asr', title: 'How is the time of Asr known from a shadow?', lead: c => `Plant a stick in the ground: at midday its shadow is shortest, then it grows. ${c ? `In ${c} today` : 'Today'}, Asr begins when the tip of the shadow reaches the first circle.`,
    time: 'Time', len: 'Shadow', boy: 'heights', noon: 'Midday shadow', asr1: 'Asr (1×)', asr2: 'Asr (2×)', table: 'Asr in the site’s timetable',
    play: 'Play the day', stop: 'Stop', now: 'Now', alt: 'Sun’s altitude',
    before: 'The shadow has not reached the first circle yet: it is still Dhuhr.', between: 'The shadow has passed the first circle: it is Asr (1×).', after: 'The shadow has passed the second circle too (2×).',
    morning: 'Morning: the shadow is shrinking and will be shortest at midday.', night: 'The sun is below the horizon: there is no shadow.', polar: 'The sun does not rise in your city today: there is no shadow.',
    dirs: ['N', 'E', 'S', 'W'], dirN: 'North', ring1: '1×', ring2: '2×',
    hadith: 'Jibril (peace be upon him) led the Prophet (ﷺ) in prayer on two days: on the first day he prayed Asr when the shadow of everything was equal to it, on the second day when it was twice as long. The midday shadow is added to this length.',
    method: 'The site’s timetable uses the 1× rule (Shafi‘i, Maliki and Hanbali schools). In the Hanafi school (the view of Abu Hanifah) Asr is calculated with 2×.',
    grade: 'al-Albani: hasan sahih', aria: (len, t) => `Shadow ${len} heights at ${t}`,
  },
  ru: {
    ey: 'Тень аср', title: 'Как время аср узнают по тени?', lead: c => `Воткните в землю палку: в полдень её тень самая короткая, потом она удлиняется. ${c ? `В городе ${c} сегодня` : 'Сегодня'} аср наступает, когда конец тени доходит до первого круга.`,
    time: 'Время', len: 'Тень', boy: 'высоты', noon: 'Полуденная тень', asr1: 'Аср (1×)', asr2: 'Аср (2×)', table: 'Аср в расписании сайта',
    play: 'Проиграть день', stop: 'Стоп', now: 'Сейчас', alt: 'Высота Солнца',
    before: 'Тень ещё не дошла до первого круга — время зухр.', between: 'Тень прошла первый круг — время аср (1×).', after: 'Тень прошла и второй круг (2×).',
    morning: 'Утро: тень укорачивается и к полудню станет самой короткой.', night: 'Солнце под горизонтом — тени нет.', polar: 'Сегодня в вашем городе Солнце не восходит — тени нет.',
    dirs: ['С', 'В', 'Ю', 'З'], dirN: 'Север', ring1: '1×', ring2: '2×',
    hadith: 'Джибриль (мир ему) два дня руководил молитвой Пророка (ﷺ): в первый день аср — когда тень каждой вещи стала равна ей, во второй — когда вдвое длиннее. К этой длине прибавляется полуденная тень.',
    method: 'Расписание сайта рассчитано по правилу 1× (шафиитский, маликитский и ханбалитский мазхабы). В ханафитском мазхабе (мнение Абу Ханифы) аср считается по 2×.',
    grade: 'аль-Альбани: хасан сахих', aria: (len, t) => `Тень ${len} высоты, ${t}`,
  },
  ar: {
    ey: 'ظلّ العصر', title: 'كيف يُعرف وقت العصر بالظل؟', lead: c => `اغرس عودًا في الأرض: يكون ظله عند الزوال أقصر ما يكون ثم يطول. ${c ? `في ${c} اليوم` : 'اليوم'} يدخل العصر حين يبلغ طرف الظل الدائرة الأولى.`,
    time: 'الوقت', len: 'الظل', boy: 'من طوله', noon: 'فيء الزوال', asr1: 'العصر (المثل)', asr2: 'العصر (المثلان)', table: 'العصر في جدول الموقع',
    play: 'شغّل اليوم', stop: 'إيقاف', now: 'الآن', alt: 'ارتفاع الشمس',
    before: 'لم يبلغ الظل الدائرة الأولى بعد: وقت الظهر.', between: 'جاوز الظل الدائرة الأولى: وقت العصر (المثل).', after: 'جاوز الظل الدائرة الثانية أيضًا (المثلان).',
    morning: 'الصباح: الظل يتقلص ويكون أقصر ما يكون عند الزوال.', night: 'الشمس تحت الأفق: لا ظل.', polar: 'لا تطلع الشمس في مدينتك اليوم: لا ظل.',
    dirs: ['ش', 'ق', 'ج', 'غ'], dirN: 'الشمال', ring1: '1×', ring2: '2×',
    hadith: 'أمَّ جبريلُ عليه السلام النبيَّ ﷺ يومين: صلى العصر في اليوم الأول حين كان ظل كل شيء مثله، وفي الثاني حين كان مثليه. ويُضاف إلى ذلك فيء الزوال.',
    method: 'جدول الموقع محسوب على المثل (الشافعية والمالكية والحنابلة). وعند الحنفية (قول أبي حنيفة) يُحسب العصر على المثلين.',
    grade: 'الألباني: حسن صحيح', aria: (len, t) => `الظل ${len} من طوله، الساعة ${t}`,
  },
  tr: {
    ey: 'İkindinin gölgesi', title: 'İkindi vakti gölgeyle nasıl anlaşılır?', lead: c => `Yere bir çubuk dikin: öğlen gölgesi en kısadır, sonra uzar. ${c ? `${c} için bugün` : 'Bugün'} gölgenin ucu ilk daireye ulaşınca ikindi vakti girer.`,
    time: 'Saat', len: 'Gölge', boy: 'boy', noon: 'Öğlen gölgesi', asr1: 'İkindi (1×)', asr2: 'İkindi (2×)', table: 'Sitenin takviminde ikindi',
    play: 'Günü oynat', stop: 'Durdur', now: 'Şimdi', alt: 'Güneşin yüksekliği',
    before: 'Gölge henüz ilk daireye ulaşmadı — öğle vakti.', between: 'Gölge ilk daireyi geçti — ikindi vakti (1×).', after: 'Gölge ikinci daireyi de geçti (2×).',
    morning: 'Sabah: gölge kısalıyor, öğlende en kısa olacak.', night: 'Güneş ufkun altında — gölge yok.', polar: 'Bugün şehrinizde Güneş doğmuyor — gölge yok.',
    dirs: ['K', 'D', 'G', 'B'], dirN: 'Kuzey', ring1: '1×', ring2: '2×',
    hadith: 'Cebrail (a.s.) Peygamber’e (ﷺ) iki gün namaz kıldırdı: ilk gün ikindiyi her şeyin gölgesi kendisi kadar olunca, ikinci gün iki katı olunca. Bu uzunluğa öğlen gölgesi eklenir.',
    method: 'Sitenin namaz takvimi 1× kuralıyla hesaplanır (Şâfiî, Mâlikî ve Hanbelî mezhepleri). Hanefî mezhebinde (Ebû Hanîfe’nin görüşü) ikindi 2× ile hesaplanır.',
    grade: 'el-Elbânî: hasen sahih', aria: (len, t) => `Gölge ${len} boy, saat ${t}`,
  },
}
// lang-ok: hədisin ərəb mətni (Əbu Davud 393, hadith-api ilə söz-söz eyni) — tərcümə edilmir
const AR_TEXT = 'وَصَلَّى بِيَ الْعَصْرَ حِينَ كَانَ ظِلُّهُ مِثْلَهُ … فَلَمَّا كَانَ الْغَدُ … وَصَلَّى بِيَ الْعَصْرَ حِينَ كَانَ ظِلُّهُ مِثْلَيْهِ'
const SIZE = 400, C = SIZE / 2, EDGE = 186
const reduced = () => typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion'))

export default function AsrShadow({ loc, lang = 'az', city = '', siteAsr }) {
  const t = pickUi(T, lang)
  const { lat, lng, tz } = loc || {}
  const [clock, setClock] = useState(() => Date.now())
  const dayStart = useMemo(() => localDayStart(clock, tz), [clock, tz])
  const day = useMemo(() => (Number.isFinite(lat) ? asrDay(dayStart, lat, lng) : null), [dayStart, lat, lng])
  const path = useMemo(() => (day ? tipPath(day, lat, lng) : []), [day, lat, lng])
  const [at, setAt] = useState(null)
  const [playing, setPlaying] = useState(false)
  const raf = useRef(0)

  // Hər dəqiqə "indi" yenilənir (gün dəyişəndə də)
  useEffect(() => { const id = setInterval(() => setClock(Date.now()), 60000); return () => clearInterval(id) }, [])
  // İlkin an: Günəş göydədirsə — indi, yoxsa əsr 1×
  useEffect(() => {
    if (!day?.sunrise) { setAt(null); return }
    setAt(a => (a && a >= day.sunrise && a <= day.sunset) ? a : (Date.now() > day.sunrise && Date.now() < day.sunset ? Date.now() : day.asr1 || day.noon))
  }, [day])
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const fmtT = (ms) => (ms == null ? '—' : new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ms)))
  const num = (x, d = 2) => (x == null ? '—' : x.toFixed(d).replace('.', lang === 'en' || lang === 'ar' ? '.' : ','))

  const play = () => {
    if (!day?.sunrise) return
    if (playing) { cancelAnimationFrame(raf.current); setPlaying(false); return }
    if (reduced()) { setAt(day.asr1 || day.noon); return }
    setPlaying(true)
    const t0 = performance.now(), span = day.sunset - day.sunrise
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 10000)
      setAt(day.sunrise + span * k)
      if (k < 1) raf.current = requestAnimationFrame(step); else setPlaying(false)
    }
    raf.current = requestAnimationFrame(step)
  }
  const jump = (ms) => { cancelAnimationFrame(raf.current); setPlaying(false); if (ms) setAt(ms) }

  if (!day) return null
  const polar = !day.L0
  const v = !polar && at ? shadowVec(at, lat, lng) : null
  const R2 = polar ? 1 : day.L0 + 2
  const k = (EDGE - 14) / Math.max(R2, 1.2)          // px / boy
  const clampLen = (EDGE - 4) / k
  const tip = v ? { x: v.x * Math.min(1, clampLen / v.len), y: v.y * Math.min(1, clampLen / v.len) } : null
  const sunPos = v ? { x: C + Math.sin(v.az * Math.PI / 180) * EDGE, y: C - Math.cos(v.az * Math.PI / 180) * EDGE } : null
  const mark = (ms) => { const q = ms && shadowVec(ms, lat, lng); return q && q.len <= clampLen ? { x: C + q.x * k, y: C + q.y * k } : null }
  const m1 = !polar && mark(day.asr1), m2 = !polar && mark(day.asr2), mN = !polar && mark(day.noon)
  const d = path.filter(p => Math.hypot(p.x, p.y) <= clampLen).map((p, i) => `${i ? 'L' : 'M'}${(C + p.x * k).toFixed(1)} ${(C + p.y * k).toFixed(1)}`).join(' ')
  const state = polar ? t.polar : !v ? t.night : at < day.noon ? t.morning : at < day.asr1 ? t.before : (day.asr2 && at >= day.asr2) ? t.after : t.between
  const phase = !v || at < day.asr1 ? 0 : (day.asr2 && at >= day.asr2) ? 2 : 1

  return (
    <div className="ash ui-card" data-testid="asr-shadow">
      <div className="ash__head">
        <span className="ui-eyebrow">{t.ey}</span>
        <h2 className="ui-title ui-title--sm">{t.title}</h2>
        <p className="ui-lead">{t.lead(city)}</p>
      </div>
      <div className="ash__grid">
        <div className="ash__scene">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={v ? t.aria(num(v.len), fmtT(at)) : state} data-phase={phase}>
            <defs>
              <radialGradient id="ash-ground" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--ash-g1)" /><stop offset="100%" stopColor="var(--ash-g2)" />
              </radialGradient>
              <linearGradient id="ash-sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="var(--ash-shadow)" stopOpacity=".85" /><stop offset="100%" stopColor="var(--ash-shadow)" stopOpacity=".35" /></linearGradient>
            </defs>
            <circle cx={C} cy={C} r={EDGE + 8} fill="url(#ash-ground)" />
            {['N', 'E', 'S', 'W'].map((_, i) => {
              const a = i * Math.PI / 2, x = C + Math.sin(a) * (EDGE - 2), y = C - Math.cos(a) * (EDGE - 2)
              return <text key={i} x={x} y={y + 4} className={`ash__dir${i === 0 ? ' is-n' : ''}`} textAnchor="middle" aria-hidden="true">{t.dirs[i]}</text>
            })}
            {!polar && <>
              <circle cx={C} cy={C} r={(day.L0 + 1) * k} className={`ash__ring ash__ring--1${phase >= 1 ? ' is-hit' : ''}`} />
              <circle cx={C} cy={C} r={(day.L0 + 2) * k} className={`ash__ring ash__ring--2${phase >= 2 ? ' is-hit' : ''}`} />
              <text x={C + (day.L0 + 1) * k * 0.7071 + 5} y={C + (day.L0 + 1) * k * 0.7071 + 14} className="ash__rl ash__rl--1">{t.ring1}</text>
              <text x={C + (day.L0 + 2) * k * 0.7071 + 5} y={C + (day.L0 + 2) * k * 0.7071 + 14} className="ash__rl ash__rl--2">{t.ring2}</text>
              <path d={d} className="ash__path" />
              {mN && <circle cx={mN.x} cy={mN.y} r="3.2" className="ash__dot ash__dot--noon" />}
              {m1 && <circle cx={m1.x} cy={m1.y} r="5" className="ash__dot ash__dot--1" />}
              {m2 && <circle cx={m2.x} cy={m2.y} r="5" className="ash__dot ash__dot--2" />}
            </>}
            {tip && <line x1={C} y1={C} x2={C + tip.x * k} y2={C + tip.y * k} className="ash__shadow" />}
            {tip && <circle cx={C + tip.x * k} cy={C + tip.y * k} r="4" className="ash__tip" />}
            <circle cx={C} cy={C} r="6.5" className="ash__stick" />
            <circle cx={C - 1.5} cy={C - 1.5} r="2.2" className="ash__stick-hi" />
            {sunPos && <g className="ash__sun" transform={`translate(${sunPos.x} ${sunPos.y})`}><circle r="11" /><circle r="17" className="ash__sun-halo" /></g>}
          </svg>
        </div>
        <div className="ash__panel">
          <p className="ash__state" aria-live="polite" data-testid="ash-state">{state}</p>
          {!polar && <>
            <label className="ash__range">
              <span>{t.time} <b className="ui-num" data-testid="ash-time">{fmtT(at)}</b></span>
              <input type="range" min={day.sunrise} max={day.sunset} step={60000} value={at ?? day.noon}
                onChange={e => jump(+e.target.value)} data-testid="ash-range" aria-valuetext={fmtT(at)} />
            </label>
            <div className="ash__btns">
              <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={play} data-testid="ash-play">
                <Icon name={playing ? 'pause' : 'play'} size={15} className="ui-btn__icon" /> {playing ? t.stop : t.play}
              </button>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => jump(Date.now() > day.sunrise && Date.now() < day.sunset ? Date.now() : null)}>{t.now}</button>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => jump(day.asr1)} data-testid="ash-go1">{t.asr1}</button>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => jump(day.asr2)}>{t.asr2}</button>
            </div>
            <dl className="ash__facts">
              <div><dt>{t.len}</dt><dd className="ui-num" data-testid="ash-len">{v ? `${num(v.len)} ${t.boy}` : '—'}</dd></div>
              <div><dt>{t.alt}</dt><dd className="ui-num">{v ? `${num(v.alt, 1)}°` : '—'}</dd></div>
              <div><dt>{t.noon}</dt><dd className="ui-num">{num(day.L0)} {t.boy} · {fmtT(day.noon)}</dd></div>
              <div className="is-1"><dt>{t.asr1}</dt><dd className="ui-num" data-testid="ash-asr1">{fmtT(day.asr1)}</dd></div>
              <div className="is-2"><dt>{t.asr2}</dt><dd className="ui-num" data-testid="ash-asr2">{fmtT(day.asr2)}</dd></div>
              {siteAsr && <div><dt>{t.table}</dt><dd className="ui-num">{siteAsr}</dd></div>}
            </dl>
          </>}
        </div>
      </div>
      <figure className="ash__hadith">
        <blockquote className="ui-arabic" lang="ar" dir="rtl">{AR_TEXT}</blockquote>
        {lang !== 'ar' && <p>{t.hadith}</p>}
        <figcaption>
          <a href="https://sunnah.com/abudawud:393" target="_blank" rel="noopener noreferrer">{localizeSource('Əbu Davud 393', lang)}</a> · {t.grade} ·{' '}
          <a href="https://sunnah.com/tirmidhi:149" target="_blank" rel="noopener noreferrer">{localizeSource('Tirmizi 149', lang)}</a>
        </figcaption>
      </figure>
      <p className="ash__note"><Icon name="info" size={14} /> {t.method}</p>
    </div>
  )
}
