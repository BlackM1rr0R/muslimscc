// ═══════════════════════════════════════════════════════
// LunarMansions (v7.1) — Ay mənzilləri (منازل القمر), canlı
//
// • 28 klassik ərəb mənzili (src/data/lunarMansions.js — mənbələr orada).
// • Üsul (utils/lunarMansions.js): ekliptika 28 bərabər hissəyə (12°51′26″) bölünür, bölgü
//   ulduzlara bağlıdır — 1-ci mənzil β Ari-nin tarixə gətirilmiş uzunluğundan başlayır.
//   Ay və Günəş — utils/lunar.js (Meeus). Faza — Ay–Günəş elongasiyasından.
// • Halqa: 28 seqment (geniş ekranda ərəbcə adlar, telefonda nömrələr + aşağıda siyahı),
//   Ay öz fazası ilə dəqiq uzunluğunda, Günəş, bir neçə parlaq ulduz nişanı.
// • ±14 gün sürüşdürücüsü — Ay mənzildən mənzilə (təxminən gündə bir) keçir.
// • Yasin 36:39 — Osmani mətni və saytın rəsmi tərcüməsi hərfi-hərfinə (public/data/moon-ayah,
//   scripts/build-moon-ayah.mjs). Ekrandan kənarda saat dayanır.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { useReduced } from '../motion/reduced'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import { G_MONTHS_SHORT } from '../utils/hijri'
import { LUNAR_MANSIONS, MOON_AYAH } from '../data/lunarMansions'
import { BRIGHT_STARS } from '../data/brightStars'
import { moonEcliptic } from '../utils/lunar'
import {
  MANSION_COUNT, MANSION_SPAN, anchorLon, mansionAt, moonState, nextMansionEntry, wrapIndex,
  eclLonJ2000, precessLon,
} from '../utils/lunarMansions'
import '../styles/LunarMansions.css'

const RAD = Math.PI / 180
const DAY = 86400000
const R_OUT = 186, R_IN = 128, R_LBL = 157, R_BODY = 96, R_STAR = 122
const stripHarakat = (s) => s.replace(/[ً-ْٰـ]/g, '')

const T = {
  az: { ey: 'Səma və təqvim', title: 'Ay mənzilləri', lead: 'Ay hər gecə ulduzlar arasında yeni bir “mənzilə” düşür: ərəblər onun göydəki yolunu 28 dayanacağa bölmüşdülər. Bu gecə Ay hansı mənzildədir — canlı hesab.', fig: 'Ekliptika halqası: 28 mənzil, Ayın və Günəşin indiki yeri', moonHere: 'Ay bu mənzildədir', passed: 'Mənzildən keçib', nextIn: 'Növbəti mənzilə girir', arrives: 'Ay buraya girəcək', stars: 'Ulduzları', noStars: 'Ulduzların eyniləşdirilməsi mənbələrdə fərqlidir', gap: 'Ulduzsuz boşluq — mənzil göyün boş sahəsidir', prev: 'Əvvəlki mənzil', next: 'Növbəti mənzil', slider: 'Vaxtı günlərlə sürüşdür', now: 'İndi', illum: 'İşıqlanma', waxing: 'böyüyür', waning: 'kiçilir', moon: 'Ay', sun: 'Günəş', days: (d) => `${d > 0 ? '+' : ''}${d} gün`, list: 'Bütün mənzillər', ayahRef: 'Yasin, 36:39', read: 'Ayəni oxu', hist: 'İslamdan əvvəl ərəblər Ay mənzillərindən və onlara bağlı ulduzların sübh çağı doğub-batmasından (ənva) fəsilləri və yağış vaxtını bilmək üçün istifadə edirdilər. Sonra müsəlman astronomları bu ulduzları dəqiq təsvir etdilər — məsələn, X əsrdə Əbdürrəhman əs-Sufi “Sabit ulduzların surətləri” kitabında.', note: 'Üsul: orta əsr cədvəllərindəki kimi ekliptika 28 bərabər hissəyə (12°51′) bölünür; bölgü ulduzlara bağlıdır — 1-ci mənzil əş-Şərətanın ulduzundan (Qoç bürcünün β ulduzu) başlayır, presessiya nəzərə alınır. Ulduzlar göydə bərabər yayılmadığı üçün bəzi mənzillərin ulduzu qonşu hissənin kənarına düşür. Ay və Günəş: Meeus.' }, // lang-ok[Meeus,presessiya]: müəllif adı; «presessiya» az elmi termindir
  en: { ey: 'Sky and calendar', title: 'The lunar mansions', lead: 'Each night the Moon lodges in a new “mansion” among the stars: the Arabs divided its path across the sky into 28 stations. Which mansion is the Moon in tonight — computed live.', fig: 'Ecliptic ring: 28 mansions, current positions of the Moon and the Sun', moonHere: 'The Moon is in this mansion', passed: 'Way through', nextIn: 'Enters the next mansion', arrives: 'The Moon enters here', stars: 'Stars', noStars: 'Sources differ on the identification of its stars', gap: 'A starless gap — the mansion is the empty patch of sky itself', prev: 'Previous mansion', next: 'Next mansion', slider: 'Shift time by days', now: 'Now', illum: 'Illumination', waxing: 'waxing', waning: 'waning', moon: 'Moon', sun: 'Sun', days: (d) => `${d > 0 ? '+' : ''}${d} d`, list: 'All mansions', ayahRef: 'Yā-Sīn, 36:39', read: 'Read the verse', hist: 'Before Islam the Arabs used the lunar mansions, and the dawn risings and settings of their stars (anwāʾ), to mark the seasons and the time of rain. Muslim astronomers later described these stars precisely — for example ʿAbd al-Raḥmān al-Ṣūfī in his 10th-century Book of the Fixed Stars.', note: 'Method: as in medieval tables, the ecliptic is divided into 28 equal parts (12°51′); the division is tied to the stars — the first mansion begins at the star of al-Sharaṭān (β Arietis), with precession applied. Because the stars are not evenly spread, some mansions’ stars fall near the edge of a neighbouring part. Moon and Sun: Meeus.' },
  ru: { ey: 'Небо и календарь', title: 'Лунные стоянки', lead: 'Каждую ночь Луна останавливается в новой «стоянке» среди звёзд: арабы делили её путь по небу на 28 станций. В какой стоянке Луна сегодня — живой расчёт.', fig: 'Кольцо эклиптики: 28 стоянок, нынешнее положение Луны и Солнца', moonHere: 'Луна в этой стоянке', passed: 'Пройдено', nextIn: 'Вход в следующую стоянку', arrives: 'Луна войдёт сюда', stars: 'Звёзды', noStars: 'Источники расходятся в отождествлении её звёзд', gap: 'Беззвёздный просвет — стоянка и есть пустой участок неба', prev: 'Предыдущая стоянка', next: 'Следующая стоянка', slider: 'Сдвиг времени в днях', now: 'Сейчас', illum: 'Освещённость', waxing: 'растёт', waning: 'убывает', moon: 'Луна', sun: 'Солнце', days: (d) => `${d > 0 ? '+' : ''}${d} дн.`, list: 'Все стоянки', ayahRef: 'Ясин, 36:39', read: 'Читать аят', hist: 'До ислама арабы по лунным стоянкам и утренним восходам и заходам их звёзд (анва) определяли времена года и пору дождей. Позднее мусульманские астрономы точно описали эти звёзды — например, Абд ар-Рахман ас-Суфи в «Книге неподвижных звёзд» (X век).', note: 'Метод: как в средневековых таблицах, эклиптика делится на 28 равных частей (12°51′); деление привязано к звёздам — первая стоянка начинается у звезды аш-Шаратан (β Овна), с учётом прецессии. Звёзды распределены неравномерно, поэтому звёзды некоторых стоянок оказываются у края соседней части. Луна и Солнце: Меёс.' },
  ar: { ey: 'السماء والتقويم', title: 'منازل القمر', lead: 'ينزل القمر كل ليلة منزلًا جديدًا بين النجوم، وقد قسم العرب طريقه في السماء ثمانيةً وعشرين منزلًا. في أي منزل القمر الليلة؟ حساب حيّ.', fig: 'دائرة فلك البروج: ثمانية وعشرون منزلًا وموضع القمر والشمس الآن', moonHere: 'القمر في هذا المنزل', passed: 'ما قطعه من المنزل', nextIn: 'يدخل المنزل التالي', arrives: 'يدخل القمر هذا المنزل', stars: 'نجومه', noStars: 'تختلف المصادر في تعيين نجومه', gap: 'فُرجة خالية من النجوم، والمنزل هو هذا الموضع الخالي نفسه', prev: 'المنزل السابق', next: 'المنزل التالي', slider: 'تحريك الوقت بالأيام', now: 'الآن', illum: 'نسبة الإضاءة', waxing: 'متزايد', waning: 'متناقص', moon: 'القمر', sun: 'الشمس', days: (d) => `${d > 0 ? '+' : ''}${d} يوم`, list: 'جميع المنازل', ayahRef: 'يس، 36:39', read: 'اقرأ الآية', hist: 'استعمل العرب قبل الإسلام منازل القمر وطلوع نجومها وسقوطها عند الفجر (الأنواء) لمعرفة الفصول وأوقات المطر. ثم وصف الفلكيون المسلمون هذه النجوم وصفًا دقيقًا، كعبد الرحمن الصوفي في «صور الكواكب الثابتة» في القرن الرابع الهجري.', note: 'الطريقة: كما في الجداول القديمة يُقسم فلك البروج ثمانيةً وعشرين قسمًا متساويًا (12°51′)، والتقسيم مربوط بالنجوم: يبدأ المنزل الأول من نجم الشرطان (بيتا الحمل) مع حساب المبادرة. ولأن النجوم غير موزعة بالتساوي يقع نجم بعض المنازل عند طرف القسم المجاور. القمر والشمس: ميوس.' },
  tr: { ey: 'Gök ve takvim', title: 'Ay menzilleri', lead: 'Ay her gece yıldızlar arasında yeni bir “menzile” konar: Araplar onun gökteki yolunu 28 durağa bölmüştü. Bu gece Ay hangi menzilde — canlı hesap.', fig: 'Ekliptik halkası: 28 menzil, Ay’ın ve Güneş’in şimdiki yeri', moonHere: 'Ay bu menzilde', passed: 'Menzilden geçilen', nextIn: 'Sonraki menzile giriyor', arrives: 'Ay buraya girecek', stars: 'Yıldızları', noStars: 'Yıldızlarının belirlenmesinde kaynaklar ayrılıyor', gap: 'Yıldızsız boşluk — menzil göğün boş alanının kendisidir', prev: 'Önceki menzil', next: 'Sonraki menzil', slider: 'Zamanı günlerle kaydır', now: 'Şimdi', illum: 'Aydınlanma', waxing: 'büyüyor', waning: 'küçülüyor', moon: 'Ay', sun: 'Güneş', days: (d) => `${d > 0 ? '+' : ''}${d} gün`, list: 'Bütün menziller', ayahRef: 'Yâsîn, 36:39', read: 'Ayeti oku', hist: 'İslam’dan önce Araplar Ay menzillerini ve onlara bağlı yıldızların şafakta doğup batmasını (envâ) mevsimleri ve yağmur zamanını bilmek için kullanırdı. Sonra Müslüman astronomlar bu yıldızları titizlikle tarif etti — örneğin X. yüzyılda Abdurrahman es-Sûfî “Sabit Yıldızların Suretleri” kitabında.', note: 'Yöntem: Orta Çağ tablolarındaki gibi ekliptik 28 eşit parçaya (12°51′) bölünür; bölme yıldızlara bağlıdır — 1. menzil eş-Şeratan’ın yıldızından (Koç’un β yıldızı) başlar, presesyon hesaba katılır. Yıldızlar gökte eşit dağılmadığı için bazı menzillerin yıldızı komşu parçanın kenarına düşer. Ay ve Güneş: Meeus.' }, // lang-ok[Meeus]: müəllif adı
}

// Halqadakı ulduz nişanları (J2000 ra/dec → ekliptik uzunluq, tarixə presessiya)
const REF_STARS = [
  { id: 'betaAri', ra: (1 + 54 / 60 + 38.41 / 3600) * 15, dec: 20 + 48 / 60 + 28.9 / 3600, ar: 'الشرطان' },
  { id: 'alcyone', ra: (3 + 47 / 60 + 29.08 / 3600) * 15, dec: 24 + 6 / 60 + 18.5 / 3600, ar: 'الثريا' },
  ...['aldebaran', 'pollux', 'regulus', 'spica', 'antares'].map(id => {
    const s = BRIGHT_STARS.find(x => x.id === id)
    return s ? { id, ra: s.ra, dec: s.dec, ar: s.ar } : null
  }).filter(Boolean),
].map(s => ({ ...s, lon2000: eclLonJ2000(s.ra, s.dec) }))

const cache = new Map()
const loadAyah = (f) => {
  if (!cache.has(f)) cache.set(f, fetch(`/data/moon-ayah/${f}.json`).then(r => { if (!r.ok) throw new Error(r.status); return r.json() }))
  return cache.get(f)
}

/** Ekliptik uzunluq (lövbərə nəzərən, °) → SVG nöqtəsi; 1-ci mənzil yuxarıdan, saat əqrəbinin əksinə */
const xy = (rel, r) => [-r * Math.sin(rel * RAD), -r * Math.cos(rel * RAD)]
function sector(i) {
  const a0 = i * MANSION_SPAN, a1 = a0 + MANSION_SPAN
  const [x0, y0] = xy(a0, R_OUT), [x1, y1] = xy(a1, R_OUT), [x2, y2] = xy(a1, R_IN), [x3, y3] = xy(a0, R_IN)
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${R_OUT} ${R_OUT} 0 0 0 ${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}A${R_IN} ${R_IN} 0 0 1 ${x3.toFixed(2)} ${y3.toFixed(2)}Z`
}
/** Ayın işıqlı hissəsi (işıqlı tərəf +x istiqamətində), k — işıqlanma 0..1 */
function litPath(k, r) {
  const rx = (r * Math.abs(1 - 2 * k)).toFixed(2)
  return `M0 ${-r}A${r} ${r} 0 0 1 0 ${r}A${rx} ${r} 0 0 ${k > 0.5 ? 1 : 0} 0 ${-r}Z`
}

/** Ayın `from`-dan sonra i-ci mənzilə girdiyi an (≤ 30 gün) */
function entryInto(i, from) {
  let t = from
  for (let k = 0; k < 30; k++) {
    const n = nextMansionEntry(t)
    if (n == null) return null
    if (mansionAt(moonEcliptic(n + 60000).lon, n + 60000).index === i) return n
    t = n + 60000
  }
  return null
}

export default function LunarMansions() {
  const { lang = 'az', siteLang } = useLang() || {}
  const t = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const rootRef = useRef(null)
  const [base, setBase] = useState(() => Math.floor(Date.now() / 60000) * 60000)
  const [offDays, setOffDays] = useState(0)
  const [sel, setSel] = useState(null)              // baxılan mənzil (null — Ayınkı)
  const [onscreen, setOnscreen] = useState(true)
  const [ayah, setAyah] = useState(null)
  const listRef = useRef(null)

  // Telefonda halqada nömrələr var — adlar siyahısı açıq başlasın
  useEffect(() => {
    try { if (listRef.current && window.matchMedia('(max-width: 600px)').matches) listRef.current.open = true } catch { /* köhnə brauzer */ }
  }, [])

  // Ekrandan kənarda və gizli vərəqdə saat dayanır
  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver !== 'function') return undefined
    const io = new IntersectionObserver(([e]) => setOnscreen(!!e?.isIntersecting), { rootMargin: '120px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!onscreen) return undefined
    const tick = () => { if (document.visibilityState !== 'hidden') setBase(Math.floor(Date.now() / 60000) * 60000) }
    tick()
    const iv = setInterval(tick, reduced ? 300000 : 60000)
    return () => clearInterval(iv)
  }, [onscreen, reduced])

  // Ayə: saytın dili (Quran tərcüməsi URL dilinə görədir), yoxdursa ingiliscə
  const qLang = siteLang || lang
  useEffect(() => {
    let alive = true
    loadAyah(qLang).catch(() => loadAyah('en')).then(d => { if (alive) setAyah(d) }).catch(() => {})
    return () => { alive = false }
  }, [qLang])

  const ms = base + offDays * DAY
  const st = useMemo(() => moonState(ms), [ms])
  const anchor = anchorLon(ms)
  const rel = (lon) => ((lon - anchor) % 360 + 360) % 360
  const cur = st.index
  const shown = sel == null ? cur : sel
  const m = LUNAR_MANSIONS[shown]
  const nextAt = useMemo(() => nextMansionEntry(ms), [ms])
  const arriveAt = useMemo(() => (shown === cur ? null : entryInto(shown, ms)), [shown, cur, ms])
  const stars = useMemo(() => REF_STARS.map(s => ({ ...s, rel: rel(precessLon(s.lon2000, ms)) })), [ms]) // eslint-disable-line react-hooks/exhaustive-deps

  const fmt = useMemo(() => {
    try { return new Intl.DateTimeFormat(lang, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) } catch { return null }
  }, [lang])
  const when = (x) => {
    if (x == null) return '—'
    const d = new Date(x)
    // az: brauzerlərin Intl-i çox vaxt "M11" yazır — saytın öz ay adları
    if (lang === 'az' || !fmt) {
      const mon = (G_MONTHS_SHORT[lang] || G_MONTHS_SHORT.en)[d.getMonth()]
      return `${d.getDate()} ${mon}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
    return fmt.format(d)
  }
  const mean = pickUi(m.mean, lang, 'en')

  // Ay və Günəş halqada
  const mRel = rel(st.lon), sRel = rel(st.sunLon)
  const [mx, my] = xy(mRel, R_BODY), [sx, sy] = xy(sRel, R_BODY + 14)
  const sunDir = Math.atan2(sy - my, sx - mx) / RAD   // işıqlı tərəf Günəşə baxır

  const go = (d) => setSel(wrapIndex(shown + d))
  const ayahHref = `${pathFor('quran', qLang, MOON_AYAH.surah)}?a=${MOON_AYAH.ayah}`

  return (
    <section ref={rootRef} className="ui-card lm28" data-testid="lunar-mansions" aria-labelledby="lm28-title"
      data-mansion={cur} data-moon-lon={st.lon.toFixed(1)}>
      <div className="lm28__head">
        <span className="ui-eyebrow">{t.ey}</span>
        <h2 id="lm28-title" className="ui-title ui-title--sm">{t.title}</h2>
        <p className="ui-lead">{t.lead}</p>
      </div>

      <div className="lm28__grid">
        <figure className="lm28__stage">
          <svg viewBox="-200 -200 400 400" className="lm28__svg" role="img"
            aria-label={`${t.fig}. ${t.moonHere}: ${cur + 1}. ${LUNAR_MANSIONS[cur].translit}`}>
            <defs>
              <radialGradient id="lm28-sky" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1a2a52" /><stop offset="100%" stopColor="#060b1a" />
              </radialGradient>
            </defs>
            <circle r={R_IN} fill="url(#lm28-sky)" className="lm28__sky" />
            {LUNAR_MANSIONS.map((x, i) => {
              const mid = (i + 0.5) * MANSION_SPAN
              const [lx, ly] = xy(mid, R_LBL)
              let rot = Math.atan2(ly, lx) / RAD           // radial istiqamət
              if (rot > 90 || rot < -90) rot += 180         // tərs yazı olmasın
              const [nx, ny] = xy(mid, R_LBL)
              return (
                <g key={i} className={`lm28__seg${i === cur ? ' is-moon' : ''}${i === shown ? ' is-sel' : ''}`}
                  onClick={() => setSel(i)}>
                  <path d={sector(i)} />
                  <text className="lm28__lbl-ar" lang="ar" x={lx.toFixed(1)} y={ly.toFixed(1)} dy="0.35em"
                    transform={`rotate(${rot.toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)})`}>{stripHarakat(x.name)}</text>
                  <text className="lm28__lbl-n ui-num" x={nx.toFixed(1)} y={ny.toFixed(1)} dy="0.35em">{i + 1}</text>
                </g>
              )
            })}
            {/* Parlaq ulduz nişanları */}
            {stars.map(s => {
              const [x, y] = xy(s.rel, R_STAR)
              return <circle key={s.id} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2.2" className="lm28__star"><title>{s.ar}</title></circle>
            })}
            {/* Yer, Ay və Günəşə xətlər */}
            <line x1="0" y1="0" x2={mx.toFixed(1)} y2={my.toFixed(1)} className="lm28__ray" />
            <line x1="0" y1="0" x2={sx.toFixed(1)} y2={sy.toFixed(1)} className="lm28__ray lm28__ray--sun" />
            <circle r="6" className="lm28__earth" />
            <g transform={`translate(${sx.toFixed(1)} ${sy.toFixed(1)})`} className="lm28__sun">
              <circle r="9" /><title>{t.sun}</title>
            </g>
            <g transform={`translate(${mx.toFixed(1)} ${my.toFixed(1)}) rotate(${sunDir.toFixed(1)})`} className="lm28__moon">
              <title>{`${t.moon}: ${Math.round(st.illum * 100)}%`}</title>
              <circle r="13" className="lm28__moon-dark" />
              <path d={litPath(st.illum, 13)} className="lm28__moon-lit" />
            </g>
          </svg>
          <div className="lm28__readout">
            <span>{t.illum}: <b className="ui-num">{Math.round(st.illum * 100)}%</b> · {st.waxing ? t.waxing : t.waning}</span>
          </div>
        </figure>

        <div className="lm28__panel">
          <div className="lm28__card" aria-live="polite">
            <div className="lm28__nav">
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm lm28__arrow" onClick={() => go(-1)} aria-label={t.prev}>
                <span aria-hidden="true" className="ui-flip-rtl">‹</span>
              </button>
              <div className="lm28__name">
                <span className="lm28__num ui-num">{shown + 1} / {MANSION_COUNT}</span>
                <span className="lm28__ar" lang="ar" dir="rtl">{m.name}</span>
                <span className="lm28__tr">{m.translit}</span>
                {lang !== 'ar' && <span className="lm28__mean">“{mean}”</span>}
              </div>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm lm28__arrow" onClick={() => go(1)} aria-label={t.next}>
                <span aria-hidden="true" className="ui-flip-rtl">›</span>
              </button>
            </div>
            <dl className="lm28__facts">
              <div><dt>{t.stars}</dt><dd>{m.stars ? <bdi dir="ltr">{m.stars}</bdi> : <span className="lm28__muted">{m.gap ? t.gap : t.noStars}</span>}</dd></div>
              {shown === cur ? (
                <>
                  <div className="lm28__here"><dt>{t.moonHere}</dt><dd>
                    <span className="lm28__bar" aria-hidden="true"><span style={{ transform: `scaleX(${st.progress.toFixed(3)})` }} /></span>
                    <span>{t.passed}: <b className="ui-num">{Math.round(st.progress * 100)}%</b></span>
                  </dd></div>
                  <div><dt>{t.nextIn}</dt><dd className="ui-num">{when(nextAt)}</dd></div>
                </>
              ) : (
                <div><dt>{t.arrives}</dt><dd className="ui-num">{when(arriveAt)}</dd></div>
              )}
            </dl>
          </div>

          <div className="lm28__time">
            <label htmlFor="lm28-days" className="lm28__tlabel">{t.slider}: <b className="ui-num">{t.days(offDays)}</b></label>
            <input id="lm28-days" type="range" min="-14" max="14" step="0.25" value={offDays}
              aria-label={t.slider} aria-valuetext={t.days(offDays)}
              onChange={(e) => { setOffDays(Number(e.target.value)); setSel(null) }} />
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => { setOffDays(0); setSel(null) }} disabled={offDays === 0 && sel == null}>{t.now}</button>
          </div>

          <details ref={listRef} className="lm28__list">
            <summary>{t.list}</summary>
            <ol>
              {LUNAR_MANSIONS.map((x, i) => (
                <li key={i}>
                  <button type="button" className={`lm28__li${i === shown ? ' is-sel' : ''}${i === cur ? ' is-moon' : ''}`} onClick={() => setSel(i)} aria-current={i === shown ? 'true' : undefined}>
                    <span className="ui-num">{i + 1}</span>
                    <span lang="ar" dir="rtl">{x.name}</span>
                    <span className="lm28__li-tr">{x.translit}</span>
                  </button>
                </li>
              ))}
            </ol>
          </details>
        </div>
      </div>

      {ayah?.ar && (
        <blockquote className="lm28__ayah">
          <p className="lm28__ayah-ar" lang="ar" dir="rtl">{ayah.ar}</p>
          {qLang !== 'ar' && ayah.tr && <p className="lm28__ayah-tr">{ayah.tr}{ayah.by && <span className="lm28__by"> — {ayah.by}</span>}</p>}
          <a className="ui-link lm28__ayah-ref" href={ayahHref}>{t.ayahRef} · {t.read}</a>
        </blockquote>
      )}
      {!ayah?.ar && <a className="ui-link lm28__ayah-ref" href={ayahHref}>{t.ayahRef}</a>}

      <p className="lm28__hist">{t.hist}</p>
      <p className="lm28__note">{t.note}</p>
    </section>
  )
}
