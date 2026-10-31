import { useState, useMemo, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { haptic } from '../hooks/useHaptic'
import { navGroupLabel } from '../data/navigation'
import Icon from '../components/Icon'
import Breadcrumb from '../components/Breadcrumb'
import {
  gregorianToHijri, hijriToGregorian, hijriMonthLength, hijriMonthGrid, shiftHijriMonth,
  parseGKey, gKey, fromLocalDate, isApproximate, hasUmmAlQura, formatHijri, formatGregorian, weekdayName,
  HIJRI_MONTHS, HIJRI_MONTHS_AR, HIJRI_MONTHS_TRANSLIT, WEEKDAYS_SHORT, G_MONTHS_SHORT,
  MIN_H_YEAR, MAX_H_YEAR, MIN_G_YEAR, MAX_G_YEAR,
} from '../utils/hijri'
import '../styles/HijriPage.css'

// ═══════════════════════════════════════════════════════
// /hijri-converter — Hicri tarix çevirici
//
// Miladi ↔ hicri hər iki istiqamətdə, bugünkü hicri tarix, hicri ayın
// miladi tarixlərlə şəbəkəsi və 12 ayın adları (ərəbcə + transliterasiya).
// Hesab utils/hijri.js-dədir (Intl 'islamic-umalqura' — /calendar ilə eyni).
// Qeyd: ay başlanğıcı hilalın görülməsi ilə müəyyən olunur (Muslim 1081 —
// hadith-api ara-muslim 1081.01 ilə yoxlanılıb); Ümmül-Qura hesablanmış
// təqvimdir və yerli elandan bir gün fərqlənə bilər.
// ═══════════════════════════════════════════════════════

const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''))
// Həftənin ilk günü: ərəbcədə şənbə, qalan dillərdə bazar ertəsi
const FIRST_DOW = { ar: 6 }

const SIGHTING_AR = 'إِذَا رَأَيْتُمُ الْهِلَالَ فَصُومُوا، وَإِذَا رَأَيْتُمُوهُ فَأَفْطِرُوا، فَإِنْ غُمَّ عَلَيْكُمْ فَصُومُوا ثَلَاثِينَ يَوْمًا'

const LABELS = {
  az: {
    title: 'Hicri tarix çevirici',
    lead: 'Miladi tarixi hicriyə və hicri tarixi miladiyə çevirin, hicri ayın günlərini miladi tarixlərlə birlikdə görün.',
    todayTitle: 'Bu gün',
    convTitle: 'Çevirici', dirGroup: 'Çevirmə istiqaməti', toHijri: 'Miladi → Hicri', toGreg: 'Hicri → Miladi', swap: 'İstiqaməti dəyiş',
    gDate: 'Miladi tarix', hDay: 'Gün', hMonth: 'Ay', hYear: 'Hicri il',
    resultTitle: 'Nəticə', weekday: 'Həftənin günü', hijri: 'Hicri', gregorian: 'Miladi', monthAr: 'Ayın ərəbcə adı',
    noDay: 'Bu tarix yoxdur: {m} {y} ayı {n} gündür.', badG: 'Tarixi {a}–{b}-ci illər aralığında seçin.',
    badH: 'Hicri ili {a}–{b} aralığında yazın.', beforeHijra: 'Bu tarix hicrətdən əvvəldir.',
    approx: 'Bu il Ümmül-Qura cədvəlindən kənardadır — nəticə hesab yolu ilə (təxmini) tapılıb.',
    noIntl: 'Brauzeriniz Ümmül-Qura təqvimini dəstəkləmir — nəticə hesab yolu ilə tapılıb və 1–2 gün fərqlənə bilər.',
    julianNote: '1582-ci ildən əvvəlki tarixlər qriqorian təqvimi ilə (geriyə uzadılmış) göstərilir.',
    showMonth: 'Ayı şəbəkədə göstər',
    gridTitle: 'Hicri ay', prevMonth: 'Əvvəlki ay', nextMonth: 'Növbəti ay', thisMonth: 'Bu ay',
    monthDays: '{n} gün', range: '{a} — {b}', todayMark: 'bu gün',
    cellAria: '{h} — {g}, {w}',
    sightTitle: 'Ay başlanğıcı hilalın görülməsi ilədir',
    sightText: 'Burada göstərilən tarixlər Səudiyyə Ərəbistanının hesablanmış Ümmül-Qura təqvimidir. Şəriətdə ay hilalın görülməsi ilə başlayır, ona görə ölkənizdə Ramazan, bayram və Zülhiccə üçün elan olunan tarix bir gün fərqlənə bilər.',
    sightTr: '"Hilalı gördüyünüz zaman oruc tutun, onu gördüyünüz zaman orucu açın. Əgər hava buludlu olarsa, otuz gün tamamlayın."',
    sightSrc: 'Muslim 1081; həmçinin Buxari 1909',
    namesTitle: 'Hicri ayların adları', colNo: '№', colLocal: 'Ad', colAr: 'Ərəbcə', colTr: 'Oxunuşu',
    calendarLink: 'İslami təqvim və mübarək günlər',
  },
  en: {
    title: 'Hijri date converter',
    lead: 'Convert Gregorian dates to Hijri and Hijri dates to Gregorian, and see the days of a Hijri month alongside Gregorian dates.',
    todayTitle: 'Today',
    convTitle: 'Converter', dirGroup: 'Conversion direction', toHijri: 'Gregorian → Hijri', toGreg: 'Hijri → Gregorian', swap: 'Switch direction',
    gDate: 'Gregorian date', hDay: 'Day', hMonth: 'Month', hYear: 'Hijri year',
    resultTitle: 'Result', weekday: 'Weekday', hijri: 'Hijri', gregorian: 'Gregorian', monthAr: 'Arabic month name',
    noDay: 'This date does not exist: {m} {y} has {n} days.', badG: 'Choose a date between the years {a} and {b}.',
    badH: 'Enter a Hijri year between {a} and {b}.', beforeHijra: 'This date is before the Hijrah.',
    approx: 'This year lies outside the Umm al-Qura table — the result uses the arithmetic (approximate) calendar.',
    noIntl: 'Your browser does not support the Umm al-Qura calendar — the result uses the arithmetic calendar and may be off by 1–2 days.',
    julianNote: 'Dates before 1582 are shown in the (proleptic) Gregorian calendar.',
    showMonth: 'Show the month in the grid',
    gridTitle: 'Hijri month', prevMonth: 'Previous month', nextMonth: 'Next month', thisMonth: 'This month',
    monthDays: '{n} days', range: '{a} — {b}', todayMark: 'today',
    cellAria: '{h} — {g}, {w}',
    sightTitle: 'A month begins with the sighting of the crescent',
    sightText: 'The dates here follow Saudi Arabia’s calculated Umm al-Qura calendar. In the Shariah a month begins with the sighting of the crescent, so the date announced in your country for Ramadan, Eid or Dhul-Hijjah may differ by a day.',
    sightTr: '"When you see the crescent, fast; and when you see it, break your fast. If it is hidden from you by clouds, then fast thirty days."',
    sightSrc: 'Muslim 1081; also al-Bukhari 1909',
    namesTitle: 'Names of the Hijri months', colNo: 'No.', colLocal: 'Name', colAr: 'Arabic', colTr: 'Transliteration',
    calendarLink: 'Islamic calendar and blessed days',
  },
  ru: {
    title: 'Конвертер дат хиджры',
    lead: 'Переводите даты григорианского календаря в даты хиджры и обратно, смотрите дни месяца хиджры вместе с григорианскими датами.',
    todayTitle: 'Сегодня',
    convTitle: 'Конвертер', dirGroup: 'Направление перевода', toHijri: 'Григорианская → хиджра', toGreg: 'Хиджра → григорианская', swap: 'Сменить направление',
    gDate: 'Григорианская дата', hDay: 'День', hMonth: 'Месяц', hYear: 'Год хиджры',
    resultTitle: 'Результат', weekday: 'День недели', hijri: 'Хиджра', gregorian: 'Григорианская', monthAr: 'Название месяца по-арабски',
    noDay: 'Такой даты нет: в месяце {m} {y} года {n} дней.', badG: 'Выберите дату между {a} и {b} годами.',
    badH: 'Укажите год хиджры от {a} до {b}.', beforeHijra: 'Эта дата раньше хиджры.',
    approx: 'Этот год вне таблицы Умм аль-Кура — результат рассчитан по арифметическому (приблизительному) календарю.',
    noIntl: 'Ваш браузер не поддерживает календарь Умм аль-Кура — результат рассчитан арифметически и может отличаться на 1–2 дня.',
    julianNote: 'Даты до 1582 года показаны по григорианскому календарю, продлённому в прошлое.',
    showMonth: 'Показать месяц в сетке',
    gridTitle: 'Месяц хиджры', prevMonth: 'Предыдущий месяц', nextMonth: 'Следующий месяц', thisMonth: 'Текущий месяц',
    monthDays: 'дней: {n}', range: '{a} — {b}', todayMark: 'сегодня',
    cellAria: '{h} — {g}, {w}',
    sightTitle: 'Месяц начинается с появления молодой луны',
    sightText: 'Даты здесь — по рассчитанному календарю Умм аль-Кура (Саудовская Аравия). По шариату месяц начинается, когда увидят молодой месяц, поэтому объявленная в вашей стране дата Рамадана, праздника или Зуль-хиджи может отличаться на день.',
    sightTr: '«Когда увидите молодой месяц — поститесь, и когда увидите его — прекращайте пост. Если же его скроют от вас облака, то поститесь тридцать дней».',
    sightSrc: 'Муслим 1081; также аль-Бухари 1909',
    namesTitle: 'Названия месяцев хиджры', colNo: '№', colLocal: 'Название', colAr: 'По-арабски', colTr: 'Транслитерация',
    calendarLink: 'Исламский календарь и благословенные дни',
  },
  ar: {
    title: 'محوّل التاريخ الهجري',
    lead: 'حوّل التاريخ الميلادي إلى هجري والهجري إلى ميلادي، واعرض أيام الشهر الهجري مع ما يقابلها من التواريخ الميلادية.',
    todayTitle: 'اليوم',
    convTitle: 'المحوّل', dirGroup: 'اتجاه التحويل', toHijri: 'ميلادي ← هجري', toGreg: 'هجري ← ميلادي', swap: 'عكس الاتجاه',
    gDate: 'التاريخ الميلادي', hDay: 'اليوم', hMonth: 'الشهر', hYear: 'السنة الهجرية',
    resultTitle: 'النتيجة', weekday: 'يوم الأسبوع', hijri: 'هجري', gregorian: 'ميلادي', monthAr: 'اسم الشهر',
    noDay: 'هذا التاريخ غير موجود: شهر {m} سنة {y} عدد أيامه {n}.', badG: 'اختر تاريخًا بين سنة {a} وسنة {b}.',
    badH: 'اكتب سنة هجرية بين {a} و{b}.', beforeHijra: 'هذا التاريخ قبل الهجرة.',
    approx: 'هذه السنة خارج جدول أم القرى — حُسبت النتيجة بالتقويم الحسابي (تقريبًا).',
    noIntl: 'متصفحك لا يدعم تقويم أم القرى — حُسبت النتيجة بالتقويم الحسابي وقد تختلف بيوم أو يومين.',
    julianNote: 'التواريخ قبل سنة 1582 معروضة بالتقويم الغريغوري الممتد إلى الماضي.',
    showMonth: 'اعرض الشهر في الجدول',
    gridTitle: 'الشهر الهجري', prevMonth: 'الشهر السابق', nextMonth: 'الشهر التالي', thisMonth: 'الشهر الحالي',
    monthDays: '{n} يومًا', range: '{a} — {b}', todayMark: 'اليوم',
    cellAria: '{h} — {g}، {w}',
    sightTitle: 'يبدأ الشهر برؤية الهلال',
    sightText: 'التواريخ هنا وفق تقويم أم القرى المحسوب في المملكة العربية السعودية. والشهر في الشرع يبدأ برؤية الهلال، فقد يختلف بيوم ما يُعلن في بلدك لرمضان والعيد وذي الحجة.',
    sightTr: 'حديث رؤية الهلال',
    sightSrc: 'مسلم 1081؛ وانظر البخاري 1909',
    namesTitle: 'أسماء الشهور الهجرية', colNo: 'م', colLocal: 'الاسم', colAr: 'بالعربية', colTr: 'النطق اللاتيني',
    calendarLink: 'التقويم الإسلامي والأيام الفاضلة',
  },
  tr: {
    title: 'Hicri tarih çevirici',
    lead: 'Miladi tarihi hicriye, hicri tarihi miladiye çevirin; hicri ayın günlerini miladi tarihlerle birlikte görün.',
    todayTitle: 'Bugün',
    convTitle: 'Çevirici', dirGroup: 'Çevirme yönü', toHijri: 'Miladi → Hicri', toGreg: 'Hicri → Miladi', swap: 'Yönü değiştir',
    gDate: 'Miladi tarih', hDay: 'Gün', hMonth: 'Ay', hYear: 'Hicri yıl',
    resultTitle: 'Sonuç', weekday: 'Haftanın günü', hijri: 'Hicri', gregorian: 'Miladi', monthAr: 'Ayın Arapça adı',
    noDay: 'Bu tarih yok: {m} {y} ayı {n} gündür.', badG: 'Tarihi {a}–{b} yılları arasında seçin.',
    badH: 'Hicri yılı {a}–{b} aralığında yazın.', beforeHijra: 'Bu tarih hicretten öncedir.',
    approx: 'Bu yıl Ümmü’l-Kurâ tablosunun dışında — sonuç aritmetik (yaklaşık) takvimle hesaplandı.',
    noIntl: 'Tarayıcınız Ümmü’l-Kurâ takvimini desteklemiyor — sonuç aritmetik takvimle hesaplandı, 1–2 gün sapabilir.',
    julianNote: '1582’den önceki tarihler geriye uzatılmış Gregoryen takvimiyle gösterilir.',
    showMonth: 'Ayı tabloda göster',
    gridTitle: 'Hicri ay', prevMonth: 'Önceki ay', nextMonth: 'Sonraki ay', thisMonth: 'Bu ay',
    monthDays: '{n} gün', range: '{a} — {b}', todayMark: 'bugün',
    cellAria: '{h} — {g}, {w}',
    sightTitle: 'Ay başlangıcı hilalin görülmesiyledir',
    sightText: 'Buradaki tarihler Suudi Arabistan’ın hesaplanmış Ümmü’l-Kurâ takvimine göredir. Şeriatta ay hilalin görülmesiyle başlar; bu yüzden ülkenizde Ramazan, bayram ve Zilhicce için ilan edilen tarih bir gün farklı olabilir.',
    sightTr: '"Hilali gördüğünüzde oruç tutun, onu gördüğünüzde orucu bırakın. Eğer bulutlu olursa otuz gün tamamlayın."',
    sightSrc: 'Müslim 1081; ayrıca Buhârî 1909',
    namesTitle: 'Hicri ayların adları', colNo: 'No', colLocal: 'Adı', colAr: 'Arapça', colTr: 'Okunuşu',
    calendarLink: 'İslami takvim ve mübarek günler',
  },
}

const todayG = () => fromLocalDate(new Date())

export default function HijriPage({ setPage }) {
  const { lang } = useLang()
  const lk = LABELS[lang] ? lang : 'en'
  const t = LABELS[lk]
  const firstDow = FIRST_DOW[lk] ?? 1

  // Bugün (gecə yarısı keçəndə yenilənsin)
  const [now, setNow] = useState(todayG)
  useEffect(() => {
    const id = setInterval(() => {
      const g = todayG()
      setNow(cur => (gKey(cur) === gKey(g) ? cur : g))
    }, 60000)
    return () => clearInterval(id)
  }, [])
  const hToday = useMemo(() => gregorianToHijri(now), [now])

  // Şəbəkədə göstərilən ay
  const [view, setView] = useState(() => ({ year: hToday.year, month: hToday.month }))

  return (
    <div className="hj-root">
      <header className="ui-page-hero hj-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel('worship', lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          {lk !== 'ar' && <p className="hj-hero-ar ui-arabic" lang="ar" aria-hidden="true">التَّقْوِيمُ الهِجْرِيّ</p>}
          <p className="ui-lead">{t.lead}</p>
        </div>
      </header>

      <section className="ui-section hj-main">
        <div className="ui-container hj-layout">
          <TodayCard t={t} lang={lk} g={now} h={hToday} />
          <Converter t={t} lang={lk} today={now} onShowMonth={(ym) => {
            setView(ym)
            requestAnimationFrame(() => document.getElementById('hj-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
          }} />
          <MonthGrid t={t} lang={lk} view={view} setView={setView} today={now} hToday={hToday} firstDow={firstDow} />
          <SightingNote t={t} lang={lk} setPage={setPage} />
          <MonthNames t={t} lang={lk} current={hToday.month} />
        </div>
      </section>
    </div>
  )
}

function TodayCard({ t, lang, g, h }) {
  return (
    <div className="hj-today ui-card ui-card--inverse" data-reveal>
      <span className="hj-today-label">{t.todayTitle} · {weekdayName(g, lang)}</span>
      <p className="hj-today-h" data-testid="hj-today">{formatHijri(h, lang)}</p>
      {lang !== 'ar' && <p className="hj-today-ar ui-arabic" lang="ar" dir="rtl">{h.day} {HIJRI_MONTHS_AR[h.month - 1]} {h.year} هـ</p>}
      <p className="hj-today-g">{formatGregorian(g, lang)}</p>
    </div>
  )
}

// ── Çevirici ──
function Converter({ t, lang, today, onShowMonth }) {
  const [dir, setDir] = useState('g2h')
  const [gStr, setGStr] = useState(() => gKey(today))
  const h0 = gregorianToHijri(today)
  const [hDay, setHDay] = useState(String(h0.day))
  const [hMonth, setHMonth] = useState(String(h0.month))
  const [hYear, setHYear] = useState(String(h0.year))

  const result = useMemo(() => {
    if (dir === 'g2h') {
      const g = parseGKey(gStr)
      if (!g) return { error: fill(t.badG, { a: MIN_G_YEAR, b: MAX_G_YEAR }) }
      const h = gregorianToHijri(g)
      if (h.year < 1) return { error: t.beforeHijra }
      return { g, h }
    }
    const y = Math.floor(Number(hYear)), m = Math.floor(Number(hMonth)), d = Math.floor(Number(hDay))
    if (!Number.isFinite(y) || y < MIN_H_YEAR || y > MAX_H_YEAR) return { error: fill(t.badH, { a: MIN_H_YEAR, b: MAX_H_YEAR }) }
    const h = { year: y, month: m, day: d }
    const g = hijriToGregorian(h)
    if (!g) {
      const n = hijriMonthLength(y, m)
      return { error: fill(t.noDay, { m: (HIJRI_MONTHS[lang] || HIJRI_MONTHS.en)[m - 1], y, n }) }
    }
    return { g, h }
  }, [dir, gStr, hDay, hMonth, hYear, t, lang])

  const swap = () => {
    haptic()
    if (result.g && result.h) {
      setGStr(gKey(result.g))
      setHDay(String(result.h.day)); setHMonth(String(result.h.month)); setHYear(String(result.h.year))
    }
    setDir(d => (d === 'g2h' ? 'h2g' : 'g2h'))
  }

  const months = HIJRI_MONTHS[lang] || HIJRI_MONTHS.en
  return (
    <div className="hj-conv ui-card" data-reveal>
      <div className="hj-conv-head">
        <h2 className="hj-card-title"><Icon name="refresh" size={18} /> {t.convTitle}</h2>
        <button type="button" className="ui-icon-btn" aria-label={t.swap} title={t.swap} onClick={swap}>
          <Icon name="refresh" size={18} />
        </button>
      </div>
      <div className="hj-chips" role="group" aria-label={t.dirGroup}>
        <button type="button" className="ui-chip" aria-pressed={dir === 'g2h'} onClick={() => setDir('g2h')}>{t.toHijri}</button>
        <button type="button" className="ui-chip" aria-pressed={dir === 'h2g'} onClick={() => setDir('h2g')}>{t.toGreg}</button>
      </div>

      {dir === 'g2h' ? (
        <label className="ui-field hj-field">
          <span className="ui-field__label">{t.gDate}</span>
          <input className="ui-input" type="date" value={gStr} min={`0${MIN_G_YEAR}-07-19`} max={`${MAX_G_YEAR}-12-31`}
            onChange={(e) => setGStr(e.target.value)} data-testid="hj-g-input" />
        </label>
      ) : (
        <div className="hj-h-inputs">
          <label className="ui-field">
            <span className="ui-field__label">{t.hDay}</span>
            <input className="ui-input" type="number" inputMode="numeric" min="1" max="30" value={hDay}
              onChange={(e) => setHDay(e.target.value)} data-testid="hj-h-day" />
          </label>
          <label className="ui-field hj-h-month">
            <span className="ui-field__label">{t.hMonth}</span>
            <select className="ui-select" value={hMonth} onChange={(e) => setHMonth(e.target.value)} data-testid="hj-h-month">
              {months.map((m, i) => <option key={i} value={i + 1}>{i + 1}. {m}</option>)}
            </select>
          </label>
          <label className="ui-field">
            <span className="ui-field__label">{t.hYear}</span>
            <input className="ui-input" type="number" inputMode="numeric" min={MIN_H_YEAR} max={MAX_H_YEAR} value={hYear}
              onChange={(e) => setHYear(e.target.value)} data-testid="hj-h-year" />
          </label>
        </div>
      )}

      <div className="hj-result" aria-live="polite">
        {result.error ? (
          <p className="hj-error" role="alert"><Icon name="alert" size={18} /> <span>{result.error}</span></p>
        ) : (
          <>
            <dl className="hj-dl">
              <div><dt>{t.hijri}</dt><dd className="hj-big" data-testid="hj-res-hijri">{formatHijri(result.h, lang)}</dd></div>
              <div><dt>{t.gregorian}</dt><dd className="hj-big" data-testid="hj-res-greg">{formatGregorian(result.g, lang)}</dd></div>
              <div><dt>{t.weekday}</dt><dd>{weekdayName(result.g, lang)}</dd></div>
              <div>
                <dt>{t.monthAr}</dt>
                <dd>
                  <span className="ui-arabic hj-ar-inline" lang="ar" dir="rtl">{HIJRI_MONTHS_AR[result.h.month - 1]}</span>
                  {lang !== 'ar' && <span className="hj-translit"> · {HIJRI_MONTHS_TRANSLIT[result.h.month - 1]}</span>}
                </dd>
              </div>
            </dl>
            {!hasUmmAlQura()
              ? <p className="hj-note"><Icon name="info" size={15} /> {t.noIntl}</p>
              : isApproximate(result.h.year) && <p className="hj-note"><Icon name="info" size={15} /> {t.approx}</p>}
            {result.g.year < 1583 && <p className="hj-note"><Icon name="info" size={15} /> {t.julianNote}</p>}
            <button type="button" className="ui-link hj-show-month"
              onClick={() => onShowMonth({ year: result.h.year, month: result.h.month })}>
              {t.showMonth} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Hicri ayın şəbəkəsi ──
function MonthGrid({ t, lang, view, setView, today, hToday, firstDow }) {
  const grid = useMemo(() => hijriMonthGrid(view.year, view.month, firstDow), [view.year, view.month, firstDow])
  const months = HIJRI_MONTHS[lang] || HIJRI_MONTHS.en
  const shortG = G_MONTHS_SHORT[lang] || G_MONTHS_SHORT.en
  const wd = WEEKDAYS_SHORT[lang] || WEEKDAYS_SHORT.en
  const todayKey = gKey(today)
  const isCur = view.year === hToday.year && view.month === hToday.month
  const go = (n) => {
    haptic()
    const next = shiftHijriMonth(view, n)
    if (next.year >= MIN_H_YEAR && next.year <= MAX_H_YEAR) setView(next)
  }
  const headers = Array.from({ length: 7 }, (_, i) => (firstDow + i) % 7)

  return (
    <div className="hj-grid-card ui-card" id="hj-grid" data-reveal>
      <div className="hj-grid-head">
        <button type="button" className="ui-icon-btn" aria-label={t.prevMonth} onClick={() => go(-1)}>
          <Icon name="chevronLeft" size={18} className="ui-flip-rtl" />
        </button>
        <div className="hj-grid-title">
          <span className="hj-grid-eyebrow">{t.gridTitle}</span>
          <h2 className="hj-card-title hj-grid-name" aria-live="polite" data-testid="hj-grid-title">
            {months[view.month - 1]} {view.year}
            {lang !== 'ar' && <span className="ui-arabic hj-grid-ar" lang="ar" dir="rtl">{HIJRI_MONTHS_AR[view.month - 1]}</span>}
          </h2>
          {grid.start && (
            <span className="hj-grid-sub">
              {fill(t.range, { a: formatGregorian(grid.start, lang), b: formatGregorian(grid.end, lang) })} · {fill(t.monthDays, { n: grid.length })}
            </span>
          )}
        </div>
        <button type="button" className="ui-icon-btn" aria-label={t.nextMonth} onClick={() => go(1)}>
          <Icon name="chevron" size={18} className="ui-flip-rtl" />
        </button>
      </div>
      {!isCur && (
        <div className="hj-grid-back">
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm"
            onClick={() => setView({ year: hToday.year, month: hToday.month })}>{t.thisMonth}</button>
        </div>
      )}

      <table className="hj-cal">
        <caption className="ui-sr-only">{months[view.month - 1]} {view.year}</caption>
        <thead>
          <tr>{headers.map(d => <th key={d} scope="col" className="hj-cal-wd">{wd[d]}</th>)}</tr>
        </thead>
        <tbody>
          {grid.weeks.map((w, wi) => (
            <tr key={wi}>
              {w.map((c, ci) => {
                if (!c) return <td key={ci} className="hj-cal-cell is-empty" />
                const isToday = gKey(c.g) === todayKey
                const showMonth = c.hDay === 1 || c.g.day === 1
                return (
                  <td key={ci} className={`hj-cal-cell${isToday ? ' is-today' : ''}${c.dow === 5 ? ' is-friday' : ''}`}
                    aria-current={isToday ? 'date' : undefined}>
                    <span className="ui-sr-only">
                      {fill(t.cellAria, { h: formatHijri({ year: view.year, month: view.month, day: c.hDay }, lang), g: formatGregorian(c.g, lang), w: weekdayName(c.g, lang) })}
                      {isToday ? ` (${t.todayMark})` : ''}
                    </span>
                    <span className="hj-cal-h ui-num" aria-hidden="true">{c.hDay}</span>
                    <span className="hj-cal-g ui-num" aria-hidden="true">{showMonth ? `${c.g.day} ${shortG[c.g.month - 1]}` : c.g.day}</span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SightingNote({ t, lang, setPage }) {
  return (
    <div className="hj-sight ui-card" data-reveal>
      <h2 className="hj-card-title"><Icon name="moonStar" size={18} fallback="moon" /> {t.sightTitle}</h2>
      <p className="hj-sight-text">{t.sightText}</p>
      <figure className="ui-quote hj-quote">
        <blockquote>
          <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{SIGHTING_AR}</p>
          {lang !== 'ar' && <p className="ui-quote__text">{t.sightTr}</p>}
        </blockquote>
        <figcaption className="ui-quote__src">— {t.sightSrc}</figcaption>
      </figure>
      {setPage && (
        <button type="button" className="ui-link hj-cal-link" onClick={() => setPage('calendar')}>
          {t.calendarLink} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
        </button>
      )}
    </div>
  )
}

function MonthNames({ t, lang, current }) {
  const months = HIJRI_MONTHS[lang] || HIJRI_MONTHS.en
  return (
    <div className="hj-names ui-card" data-reveal>
      <h2 className="hj-card-title"><Icon name="list" size={18} /> {t.namesTitle}</h2>
      <div className="hj-table-wrap">
        <table className="hj-table">
          <thead>
            <tr>
              <th scope="col">{t.colNo}</th>
              {lang !== 'ar' && <th scope="col">{t.colLocal}</th>}
              <th scope="col">{t.colAr}</th>
              <th scope="col">{t.colTr}</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m, i) => (
              <tr key={i} className={i + 1 === current ? 'is-current' : undefined} aria-current={i + 1 === current ? 'true' : undefined}>
                <td className="ui-num">{i + 1}</td>
                {lang !== 'ar' && <td>{m}</td>}
                <td><span className="ui-arabic hj-ar-inline" lang="ar" dir="rtl">{HIJRI_MONTHS_AR[i]}</span></td>
                <td className="hj-translit" lang="en" dir="ltr">{HIJRI_MONTHS_TRANSLIT[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
