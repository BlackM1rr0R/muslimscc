// ═══════════════════════════════════════════════════════
// StarQibla (v6.6) — "Ulduzlarla qiblə" (/qibla)
//
//   <StarQibla lang="az" from={{ lat, lng }} />   (from olmasa — seçilmiş şəhər)
//
// • Səma qübbəsi (qiblə YUXARIDA, zenit mərkəzdə): 27 parlaq ulduz bu an harada (utils/starQibla).
//   Qiblə xəttinə ən yaxın yararlı ulduz işıqlanır — onun altındakı üfüq nöqtəsi qiblədir.
// • "Bu gecə": ulduzların qiblə istiqamətindən DÜZ keçdiyi dəqiqələr (qaranlıqda); toxun → səhnə o ana.
// • Qütb ulduzu (əl-Cədy) ilə üsul: neçə dərəcə və hansı tərəfə dönmək; Böyük Ayıdan tapmaq.
// • Ayələr (6:97, 16:16, 53:49) — Osmani mətni və saytın rəsmi tərcüməsi hərfi-hərfinə (public/data/star-ayahs).
// Hesab cihazda — internetsiz işləyir. Stillər: src/styles/StarQibla.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { getPrayerLocation } from '../utils/prayerLocation'
import { skyNow, bestNow, crossings, polarisTurn, qiblaBearing, isDark, domeXY, MAX_ALT } from '../utils/starQibla'
import { STAR_AYAHS } from '../data/starAyahs'
import '../styles/StarQibla.css'

const T = {
  az: { dirs: ['Şm', 'Şq', 'C', 'Q'], ey: 'Ulduzlarla qiblə', title: 'Gecə qibləni ulduzlar göstərir', lead: 'Kompas olmayanda insanlar qibləni ulduzlarla tapırdılar. Bu an sizin səmanızda hansı parlaq ulduzun qiblə tərəfdə olduğunu, bu gecə hansı ulduzun qiblə istiqamətindən düz keçəcəyini görün.',
    now: 'İndi', best: (n, o, a) => `${n} qiblənin ${o}, üfüqdən ${a}° yuxarıda.`, right: (d) => `${d}° sağında`, left: (d) => `${d}° solunda`, exact: 'düz üstündə',
    face: 'Ulduzun düz altındakı üfüq nöqtəsinə üz tutun — o tərəf qiblədir.', none: 'Hazırda qiblə tərəfdə uyğun parlaq ulduz yoxdur — aşağıdakı vaxtlara baxın.',
    light: (hm) => `Hələ qaranlıq deyil — ulduzlar təxminən ${hm}-dən aydın görünəcək.`, lightNo: 'Hələ qaranlıq deyil.',
    tonight: 'Bu gecə qiblə istiqamətindən keçən ulduzlar', noCross: 'Bu gecə qiblə istiqamətindən yararlı hündürlükdə keçən parlaq ulduz yoxdur.', alt: 'hündürlük',
    time: 'Vaxt', live: 'İndiki an', fig: 'Səma qübbəsi: yuxarı — qiblə, mərkəz — başınızın üstü, kənar — üfüq', qibla: 'Qiblə', zenith: 'Başınızın üstü',
    city: 'Şəhər', bearing: 'Qiblə bucağı', polT: 'Qütb ulduzu (əl-Cədy) ilə', polFront: (t, d) => `Qütb ulduzuna üz tutun və ${t} ${d}° dönün — qiblə odur.`, polBack: (t, d) => `Qütb ulduzunu arxanıza alın və ${t} ${d}° dönün — qiblə odur.`,
    polNone: 'Qütb ulduzu bu an düz qiblə xəttindədir.', polHidden: 'Qütb ulduzu sizin yerdən görünmür (Cənub yarımkürəsi) — yuxarıdakı ulduzlardan istifadə edin.', toR: 'sağa', toL: 'sola',
    // lang-ok[Dubhe,Merak]: ulduzların beynəlxalq adları
    polFind: 'Necə tapmaq olar: şimal səmasında Böyük Ayının (yeddi ulduzlu "çömçə") qabının kənarındakı iki ulduzu (Merak → Dubhe) birləşdirən xətti təxminən 5 dəfə uzadın. Qütb ulduzu bütün gecə yerindən tərpənmir, hündürlüyü təxminən sizin coğrafi enliyinizə bərabərdir.',
    ayT: 'Quranda ulduzlar', sirius: 'əş-Şiʿrā — Sirius, gecə səmasının ən parlaq ulduzu', open: 'Ayəni Quranda aç',
    note: 'Bu, köməkçi üsuldur: ulduzlar hərəkət edir, ona görə istiqamət yalnız göstərilən anda dəqiqdir. Mümkünsə yuxarıdakı kompası və ya Günəşlə üsulu (rəsdül-qiblə) istifadə edin.',
    // lang-ok[presessiya]: astronomiya termini (yer oxunun yavaş fırlanması)
    src: 'Ulduz koordinatları — Hipparcos kataloqu; presessiya və mövqe — Meeus, "Astronomical Algorithms". Hesab cihazınızda aparılır, internet tələb olunmur.' },
  en: { dirs: ['N', 'E', 'S', 'W'], ey: 'Qiblah by the stars', title: 'At night the stars show the qiblah', lead: 'Before compasses, people found the qiblah by the stars. See which bright star in your sky lies towards the qiblah right now, and which star crosses the qiblah direction exactly tonight.',
    now: 'Now', best: (n, o, a) => `${n} is ${o} the qiblah, ${a}° above the horizon.`, right: (d) => `${d}° to the right of`, left: (d) => `${d}° to the left of`, exact: 'right on',
    face: 'Face the point on the horizon directly below the star — that is the qiblah.', none: 'No suitable bright star lies towards the qiblah right now — see the times below.',
    light: (hm) => `It is not dark yet — the stars will be clearly visible from about ${hm}.`, lightNo: 'It is not dark yet.',
    tonight: 'Stars crossing the qiblah direction tonight', noCross: 'Tonight no bright star crosses the qiblah direction at a usable height.', alt: 'altitude',
    time: 'Time', live: 'Now', fig: 'Sky dome: top — qiblah, centre — overhead, edge — horizon', qibla: 'Qiblah', zenith: 'Overhead',
    city: 'City', bearing: 'Qiblah bearing', polT: 'With the Pole Star (al-Jady)', polFront: (t, d) => `Face the Pole Star and turn ${d}° to the ${t} — that is the qiblah.`, polBack: (t, d) => `Put the Pole Star behind you and turn ${d}° to the ${t} — that is the qiblah.`,
    polNone: 'The Pole Star lies exactly on the qiblah line right now.', polHidden: 'The Pole Star is not visible from where you are (Southern Hemisphere) — use the stars above.', toR: 'right', toL: 'left',
    polFind: 'How to find it: in the northern sky, extend the line through the two stars at the edge of the Big Dipper’s bowl (Merak → Dubhe) about five times. The Pole Star stays in place all night, and its height is roughly equal to your latitude.',
    ayT: 'Stars in the Quran', sirius: 'Ash-Shiʿra — Sirius, the brightest star of the night sky', open: 'Open the ayah in the Quran',
    note: 'This is a helper method: the stars move, so the direction is exact only at the moment shown. Where possible, use the compass above or the sun method (rasd al-qiblah).',
    src: 'Star positions — Hipparcos catalogue; precession and position — Meeus, “Astronomical Algorithms”. Calculated on your device, no internet needed.' },
  ru: { dirs: ['С', 'В', 'Ю', 'З'], ey: 'Кибла по звёздам', title: 'Ночью киблу показывают звёзды', lead: 'До компасов люди находили киблу по звёздам. Посмотрите, какая яркая звезда вашего неба сейчас в стороне киблы и какая звезда этой ночью пройдёт точно над направлением киблы.',
    now: 'Сейчас', best: (n, o, a) => `${n} — ${o} киблы, ${a}° над горизонтом.`, right: (d) => `на ${d}° правее`, left: (d) => `на ${d}° левее`, exact: 'точно над линией',
    face: 'Повернитесь к точке горизонта прямо под звездой — это кибла.', none: 'Сейчас в стороне киблы нет подходящей яркой звезды — смотрите время ниже.',
    light: (hm) => `Ещё не стемнело — звёзды будут хорошо видны примерно с ${hm}.`, lightNo: 'Ещё не стемнело.',
    tonight: 'Звёзды над направлением киблы этой ночью', noCross: 'Этой ночью яркие звёзды не проходят над направлением киблы на удобной высоте.', alt: 'высота',
    time: 'Время', live: 'Сейчас', fig: 'Небесный купол: вверху — кибла, в центре — зенит, по краю — горизонт', qibla: 'Кибла', zenith: 'Зенит',
    city: 'Город', bearing: 'Азимут киблы', polT: 'По Полярной звезде (аль-Джади)', polFront: (t, d) => `Повернитесь к Полярной звезде и поверните ${t} на ${d}° — это кибла.`, polBack: (t, d) => `Встаньте спиной к Полярной звезде и поверните ${t} на ${d}° — это кибла.`,
    polNone: 'Полярная звезда сейчас точно на линии киблы.', polHidden: 'Полярная звезда у вас не видна (Южное полушарие) — используйте звёзды выше.', toR: 'направо', toL: 'налево',
    polFind: 'Как найти: на севере неба продолжите линию через две крайние звезды ковша Большой Медведицы (Мерак → Дубхе) примерно в пять раз. Полярная звезда всю ночь стоит на месте, а её высота примерно равна вашей широте.',
    ayT: 'Звёзды в Коране', sirius: 'Аш-Шиъра — Сириус, самая яркая звезда ночного неба', open: 'Открыть аят в Коране',
    note: 'Это вспомогательный способ: звёзды движутся, поэтому направление точно только в указанный момент. По возможности используйте компас выше или способ по Солнцу (расд аль-кибла).',
    // lang-ok[Hipparcos]: ulduz kataloqunun adı
    src: 'Координаты звёзд — каталог Hipparcos; прецессия и положение — Меус, «Астрономические алгоритмы». Расчёт на вашем устройстве, интернет не нужен.' },
  ar: { dirs: ['ش', 'شر', 'ج', 'غ'], ey: 'القبلة بالنجوم', title: 'في الليل تدلّ النجوم على القبلة', lead: 'قبل البوصلة كان الناس يهتدون إلى القبلة بالنجوم. انظر أيّ نجم لامع في سمائك الآن جهة القبلة، وأيّ نجم يمرّ الليلة على اتجاه القبلة تمامًا.',
    now: 'الآن', best: (n, o, a) => `${n} ${o}، على ارتفاع ${a}° فوق الأفق.`, right: (d) => `يمين القبلة بـ${d}°`, left: (d) => `يسار القبلة بـ${d}°`, exact: 'على خط القبلة تمامًا',
    face: 'استقبل نقطة الأفق التي تحت النجم مباشرة — تلك جهة القبلة.', none: 'لا يوجد الآن نجم لامع مناسب جهة القبلة — انظر الأوقات أدناه.',
    light: (hm) => `لم يحلّ الظلام بعد — تظهر النجوم بوضوح نحو الساعة ${hm}.`, lightNo: 'لم يحلّ الظلام بعد.',
    tonight: 'نجوم تمرّ الليلة على اتجاه القبلة', noCross: 'لا يمرّ الليلة نجم لامع على اتجاه القبلة بارتفاع مناسب.', alt: 'الارتفاع',
    time: 'الوقت', live: 'الآن', fig: 'قبة السماء: الأعلى — القبلة، المركز — سمت الرأس، الحافة — الأفق', qibla: 'القبلة', zenith: 'سمت الرأس',
    city: 'المدينة', bearing: 'زاوية القبلة', polT: 'بالجدي (النجم القطبي)', polFront: (t, d) => `استقبل الجدي ثم انحرف ${t} ${d}° — تلك القبلة.`, polBack: (t, d) => `اجعل الجدي خلفك ثم انحرف ${t} ${d}° — تلك القبلة.`,
    polNone: 'الجدي الآن على خط القبلة تمامًا.', polHidden: 'الجدي لا يُرى من موضعك (نصف الكرة الجنوبي) — استعن بالنجوم أعلاه.', toR: 'يمينًا', toL: 'يسارًا',
    polFind: 'كيف تجده: في السماء الشمالية مُدَّ الخط المارّ بنجمي حافة «الدب الأكبر» (المراق ← الدب) نحو خمس مرات. يثبت الجدي في مكانه طوال الليل، وارتفاعه يساوي تقريبًا خط عرضك.',
    ayT: 'النجوم في القرآن', sirius: 'الشِّعرى — ألمع نجوم السماء ليلًا', open: 'افتح الآية في المصحف',
    note: 'هذه طريقة مساعدة: النجوم تتحرك، فالاتجاه دقيق في اللحظة المبيّنة فقط. استعمل البوصلة أعلاه أو طريقة الشمس (رصد القبلة) ما أمكن.',
    src: 'مواقع النجوم — فهرس هيباركوس؛ المبادرة والموقع — ميوس «الخوارزميات الفلكية». الحساب على جهازك دون إنترنت.' },
  tr: { dirs: ['K', 'D', 'G', 'B'], ey: 'Yıldızlarla kıble', title: 'Gece kıbleyi yıldızlar gösterir', lead: 'Pusuladan önce insanlar kıbleyi yıldızlarla bulurdu. Şu an gökyüzünüzde hangi parlak yıldızın kıble tarafında olduğunu ve bu gece hangi yıldızın tam kıble yönünden geçeceğini görün.',
    now: 'Şimdi', best: (n, o, a) => `${n} kıblenin ${o}, ufkun ${a}° üstünde.`, right: (d) => `${d}° sağında`, left: (d) => `${d}° solunda`, exact: 'tam üstünde',
    face: 'Yıldızın tam altındaki ufuk noktasına dönün — orası kıbledir.', none: 'Şu an kıble tarafında uygun parlak yıldız yok — aşağıdaki saatlere bakın.',
    light: (hm) => `Henüz karanlık değil — yıldızlar yaklaşık ${hm}’den itibaren net görünecek.`, lightNo: 'Henüz karanlık değil.',
    tonight: 'Bu gece kıble yönünden geçen yıldızlar', noCross: 'Bu gece kıble yönünden uygun yükseklikte geçen parlak yıldız yok.', alt: 'yükseklik',
    time: 'Saat', live: 'Şu an', fig: 'Gök kubbesi: üst — kıble, merkez — başınızın üstü, kenar — ufuk', qibla: 'Kıble', zenith: 'Başucu',
    city: 'Şehir', bearing: 'Kıble açısı', polT: 'Kutup Yıldızı (el-Cedy) ile', polFront: (t, d) => `Kutup Yıldızı’na dönün ve ${t} ${d}° dönün — kıble orasıdır.`, polBack: (t, d) => `Kutup Yıldızı’nı arkanıza alın ve ${t} ${d}° dönün — kıble orasıdır.`,
    polNone: 'Kutup Yıldızı şu an tam kıble hattında.', polHidden: 'Kutup Yıldızı bulunduğunuz yerden görünmez (Güney Yarımküre) — yukarıdaki yıldızları kullanın.', toR: 'sağa', toL: 'sola',
    polFind: 'Nasıl bulunur: kuzey göğünde Büyük Ayı’nın (yedi yıldızlı “kepçe”) kenarındaki iki yıldızı (Merak → Dubhe) birleştiren çizgiyi yaklaşık beş kat uzatın. Kutup Yıldızı bütün gece yerinden oynamaz; yüksekliği yaklaşık enleminize eşittir.',
    ayT: 'Kur’an’da yıldızlar', sirius: 'eş-Şi‘râ — Sirius, gece göğünün en parlak yıldızı', open: 'Ayeti Kur’an’da aç',
    note: 'Bu yardımcı bir yöntemdir: yıldızlar hareket eder, bu yüzden yön yalnızca gösterilen anda doğrudur. Mümkünse yukarıdaki pusulayı veya Güneş yöntemini (rasdü’l-kıble) kullanın.',
    src: 'Yıldız konumları — Hipparcos kataloğu; presesyon ve konum — Meeus, “Astronomical Algorithms”. Hesap cihazınızda yapılır, internet gerekmez.' },
}

const STEP = 10 * 60000, SPAN = 14 * 3600000
const cache = new Map()
const starName = (s, lang) => (lang === 'ar' ? (s.ar || s.name.en) : lang === 'ru' ? s.name.ru : s.name.en)
const fmtHM = (ms, tz) => { try { return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ms)) } catch { return new Date(ms).toTimeString().slice(0, 5) } }
const R = 120

export default function StarQibla({ lang = 'az', from, ayahHref }) {
  const t = pickUi(T, lang)
  const saved = useMemo(() => (typeof window === 'undefined' ? null : getPrayerLocation()), [])
  const loc = from?.lat != null ? { lat: from.lat, lng: from.lng } : saved   // GPS — cihazın öz saat qurşağı
  const lat = loc?.lat ?? 40.4093, lng = loc?.lng ?? 49.8671, tz = loc?.tz || undefined
  const [base, setBase] = useState(() => Math.floor(Date.now() / 60000) * 60000)
  const [off, setOff] = useState(0)                       // sürüşdürücü: indidən neçə ms sonra
  const [texts, setTexts] = useState(null)
  useEffect(() => { const id = setInterval(() => setBase(Math.floor(Date.now() / 60000) * 60000), 60000); return () => clearInterval(id) }, [])
  useEffect(() => {
    let alive = true
    const load = (f) => cache.get(f) || fetch(`/data/star-ayahs/${f}.json`).then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
    const p = load(lang).catch(() => load('en'))
    cache.set(lang, p)
    p.then(d => { if (alive) setTexts(d) }).catch(() => {})
    return () => { alive = false }
  }, [lang])

  const ms = base + off
  const q = qiblaBearing(lat, lng)
  const sky = useMemo(() => skyNow(ms, lat, lng), [ms, lat, lng])
  const dark = isDark(ms, lat, lng)
  const best = useMemo(() => (dark ? bestNow(ms, lat, lng) : null), [dark, ms, lat, lng])
  // Saatlıq yenilənmə kifayətdir (bu gecənin siyahısı)
  const hourKey = Math.floor(base / 3600000)
  const cross = useMemo(() => crossings(hourKey * 3600000, lat, lng, 15).filter(c => c.ms >= base - 5 * 60000), [hourKey, lat, lng]) // eslint-disable-line react-hooks/exhaustive-deps
  const darkAt = useMemo(() => { if (isDark(base, lat, lng)) return base; for (let x = base; x < base + 20 * 3600000; x += STEP) if (isDark(x, lat, lng)) return x; return null }, [hourKey, lat, lng]) // eslint-disable-line react-hooks/exhaustive-deps
  const pol = polarisTurn(ms, lat, lng)
  const sideTxt = (o) => (Math.abs(o) < 0.5 ? t.exact : o > 0 ? t.right(Math.round(Math.abs(o))) : t.left(Math.round(Math.abs(o))))
  const polTxt = !pol.visible ? t.polHidden : pol.turn === 'none' ? t.polNone : (pol.face === 'front' ? t.polFront : t.polBack)(pol.turn === 'right' ? t.toR : t.toL, pol.deg)
  const cityName = saved && !from ? pickUi(saved.city || {}, lang) : ''
  const jump = (c) => setOff(Math.max(0, Math.min(SPAN, Math.round((c.ms - base) / 60000) * 60000)))

  const qx = domeXY(0, q, q, R + 12)
  return (
    <section className="ui-card sq" data-testid="star-qibla" aria-labelledby="sq-title">
      <div className="sq__head">
        <span className="ui-eyebrow">{t.ey}</span>
        <h2 id="sq-title" className="ui-title ui-title--sm">{t.title}</h2>
        <p className="ui-lead">{t.lead}</p>
      </div>
      <div className="sq__grid">
        <figure className="sq__dome">
          <svg viewBox={`${-R - 28} ${-R - 30} ${2 * R + 56} ${2 * R + 56}`} role="img" aria-label={t.fig}>
            <defs>
              <radialGradient id="sq-sky" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={dark ? '#13203f' : '#5d7fb3'} /><stop offset="100%" stopColor={dark ? '#070c1c' : '#a9c1e0'} /></radialGradient>
            </defs>
            <circle r={R} className="sq__sky" fill="url(#sq-sky)" />
            <circle r={R * (1 - 30 / 90)} className="sq__ring" />
            <circle r={R * (1 - MAX_ALT / 90)} className="sq__ring" />
            <line x1="0" y1="0" x2={qx.x} y2={qx.y} className="sq__qline" />
            {t.dirs.map((c, i) => { const p = domeXY(0, i * 90, q, R + 12); return <text key={c} x={p.x} y={p.y} className="sq__card" textAnchor="middle" dominantBaseline="middle">{c}</text> })}
            <g transform={`translate(0 ${-R - 20})`} className="sq__kaaba"><rect x="-6" y="-6" width="12" height="12" rx="1.5" /><text y="-10" textAnchor="middle">{t.qibla}</text></g>
            {sky.map(s => {
              const p = domeXY(s.alt, s.az, q, R)
              const isBest = best?.star.id === s.star.id
              const isPol = s.star.id === 'polaris'
              const r = Math.max(1.4, 4.2 - s.star.mag * 1.1)
              return (
                <g key={s.star.id} data-testid="sq-star" data-id={s.star.id}>
                  {isBest && <line x1={p.x} y1={p.y} x2={domeXY(0, s.az, q, R).x} y2={domeXY(0, s.az, q, R).y} className="sq__drop" />}
                  <circle cx={p.x} cy={p.y} r={isBest ? r + 1.6 : r} className={`sq__star${isBest ? ' is-best' : ''}${isPol ? ' is-pol' : ''}`} style={{ opacity: dark ? 1 : 0.35 }} />
                  {(isBest || isPol || s.star.mag < 0.5) && <text x={p.x + r + 3} y={p.y + 3} className={`sq__lbl${isBest ? ' is-best' : ''}`}>{starName(s.star, lang)}</text>}
                </g>
              )
            })}
            <circle r="2" className="sq__zen" />
          </svg>
          <figcaption className="sq__cap">{t.fig}</figcaption>
        </figure>

        <div className="sq__side">
          <dl className="sq__facts">
            {cityName && <div><dt>{t.city}</dt><dd>{cityName}</dd></div>}
            <div><dt>{t.bearing}</dt><dd className="ui-num" data-testid="sq-bearing">{Math.round(q)}°</dd></div>
            <div><dt>{off ? t.time : t.now}</dt><dd className="ui-num">{fmtHM(ms, tz)}</dd></div>
          </dl>
          <div className={`sq__now${best ? ' is-on' : ''}`} data-testid="sq-now" aria-live="polite">
            {!dark ? <p>{darkAt ? t.light(fmtHM(darkAt, tz)) : t.lightNo}</p>
              : best ? <>
                <p className="sq__best"><Icon name="star" size={16} /> <b data-testid="sq-best">{best && t.best(starName(best.star, lang), sideTxt(best.off), Math.round(best.alt))}</b></p>
                {lang !== 'ar' && best.star.ar && <p className="sq__arname ui-arabic" lang="ar" dir="rtl">{best.star.ar}</p>}
                <p>{t.face}</p>
              </> : <p>{t.none}</p>}
          </div>
          <label className="sq__range">
            <span>{t.time}: <b className="ui-num">{fmtHM(ms, tz)}</b> {off > 0 && <button type="button" className="ui-link sq__live" onClick={() => setOff(0)}>{t.live}</button>}</span>
            <input type="range" min="0" max={SPAN} step={STEP} value={off} onChange={e => setOff(Number(e.target.value))} aria-label={t.time} data-testid="sq-range" />
          </label>
          <h3 className="sq__h3">{t.tonight}</h3>
          {cross.length ? (
            <ul className="sq__list" data-testid="sq-cross">
              {cross.slice(0, 8).map(c => (
                <li key={c.star.id + c.ms}><button type="button" onClick={() => jump(c)}>
                  <b className="ui-num">{fmtHM(c.ms, tz)}</b><span>{starName(c.star, lang)}</span><span className="sq__alt ui-num">{t.alt} {Math.round(c.alt)}°</span>
                </button></li>
              ))}
            </ul>
          ) : <p className="sq__muted">{t.noCross}</p>}
        </div>
      </div>

      <div className="sq__pol" data-testid="sq-polaris">
        <h3 className="sq__h3"><Icon name="compass" size={16} /> {t.polT} <span className="ui-arabic" lang="ar">الجدي</span></h3>
        <p className="sq__polmain">{polTxt}</p>
        <p className="sq__muted">{t.polFind}</p>
      </div>

      {texts && (
        <div className="sq__ayahs">
          <h3 className="sq__h3"><Icon name="quran" size={16} /> {t.ayT}</h3>
          {STAR_AYAHS.map(a => {
            const [s, n] = a.ref.split(':').map(Number)
            return (
              <blockquote key={a.ref} className="sq__ayah" data-testid="sq-ayah">
                {a.star === 'sirius' && <p className="sq__tag"><Icon name="star" size={13} /> {t.sirius}</p>}
                <p className="ui-arabic sq__ar" lang="ar" dir="rtl">{texts.ar?.[a.ref]}</p>
                {lang !== 'ar' && texts.tr?.[a.ref] && <p className="sq__tr">{texts.tr[a.ref]}</p>}
                <footer>
                  {ayahHref ? <a className="ui-link" href={ayahHref(s, n)}>{t.open} <span className="ui-num">({a.ref})</span></a> : <span className="ui-num">{a.ref}</span>}
                  {lang !== 'ar' && texts.by && <span className="sq__by"> · {texts.by}</span>}
                </footer>
              </blockquote>
            )
          })}
        </div>
      )}
      <p className="sq__note"><Icon name="info" size={14} /> {t.note}</p>
      <p className="sq__src">{t.src}</p>
    </section>
  )
}
