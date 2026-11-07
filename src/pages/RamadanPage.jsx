// ═══════════════════════════════════════════════════════
// /ramadan — İmsakiyyə: seçilmiş şəhər üçün bütöv Ramazan ayının cədvəli
//
// • Mənbə: aladhan.com /v1/hijriCalendar/{hicri il}/9 (utils/ramadan.js) —
//   imsak, sübh, günəş, zöhr, əsr, iftar (məğrib), işa. Ramazandan kənar
//   gələn Ramazanın cədvəli göstərilir.
// • Bu gün vurğulanır; "Cədvəli çap et" → sadə qara-ağ cədvəl (@media print).
// • Yuxarıda RamadanCard (Ramazanda geri sayım; ?ramadan=preview — sınaq).
// • Cədvəlin altında "Ramazan bələdçisi" (data/ramadanGuide.js — LessonBlocks ilə)
//   və 30 günlük xətm planı (gündə bir cüz; localStorage 'muslim_cc_ramadan_khatm_v1').
// ═══════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'
import CrescentPath from '../components/CrescentPath'
import { ummahAdd } from '../utils/ummah'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { navGroupLabel } from '../data/navigation'
import { PRAYER_NAMES } from '../hooks/usePrayerTimes'
import RamadanCard, { useRamadan, formatGregorian, RC_TXT } from '../components/RamadanCard'
import CityPicker from '../components/CityPicker'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { weekdayOf } from '../utils/ramadan'
import { pathFor } from '../seo/routes'
import { isPlainClick } from '../components/PageLink'
import LessonBlocks from '../components/lesson/LessonBlocks'
import { ChartFigure, ProgressRing, StatTile } from '../components/viz'
import { RAMADAN_GUIDE, RAMADAN_SOURCES, JUZ_RANGES } from '../data/ramadanGuide'
import '../styles/LessonsPage.css'
import '../styles/RamadanPage.css'
import '../styles/ToolsMotion.css'
import GeoStarfield from '../components/prayer/GeoStarfield'
import Sparkle from '../components/prayer/Sparkle'
import { ringFrom } from '../components/prayer/ringFrom'
import { pickUi } from '../utils/uiText'

const TXT = {
  title:   { az: 'İmsakiyyə', en: 'Ramadan timetable', ru: 'Расписание на Рамадан', ar: 'إمساكية رمضان', tr: 'İmsakiye' },
  lead:    { az: 'Seçdiyiniz şəhər üçün Ramazan ayının bütün günləri: səhurun sonu (imsak), namaz vaxtları və iftar.', en: 'Every day of Ramadan for your chosen city: the end of suhoor (imsak), prayer times and iftar.', ru: 'Все дни Рамадана для выбранного города: окончание сухура (имсак), время намазов и ифтар.', ar: 'جميع أيام رمضان في المدينة التي تختارها: وقت الإمساك ومواقيت الصلاة والإفطار.', tr: 'Seçtiğiniz şehir için Ramazan ayının tüm günleri: imsak, namaz vakitleri ve iftar.' },
  tableOf: { az: 'Ramazan {y} imsakiyyəsi', en: 'Ramadan {y} timetable', ru: 'Расписание Рамадана {y}', ar: 'إمساكية رمضان {y}', tr: 'Ramazan {y} imsakiyesi' },
  print:   { az: 'Cədvəli çap et', en: 'Print the timetable', ru: 'Распечатать', ar: 'طباعة الجدول', tr: 'Tabloyu yazdır' },
  day:     { az: 'Gün', en: 'Day', ru: 'День', ar: 'اليوم', tr: 'Gün' },
  date:    { az: 'Tarix', en: 'Date', ru: 'Дата', ar: 'التاريخ', tr: 'Tarih' },
  today:   { az: 'Bu gün', en: 'Today', ru: 'Сегодня', ar: 'اليوم', tr: 'Bugün' },
  error:   { az: 'Cədvəli yükləmək alınmadı. İnternet bağlantısını yoxlayın.', en: 'Could not load the timetable. Please check your connection.', ru: 'Не удалось загрузить расписание. Проверьте подключение.', ar: 'تعذّر تحميل الجدول. تحقّق من الاتصال بالإنترنت.', tr: 'Tablo yüklenemedi. İnternet bağlantınızı kontrol edin.' },
  retry:   { az: 'Yenidən cəhd et', en: 'Try again', ru: 'Повторить', ar: 'أعد المحاولة', tr: 'Tekrar dene' },
  note:    { az: 'Vaxtlar şəhərin koordinatı ilə hesablanıb (aladhan.com). İmsak — səhurun son anı, iftar — məğrib azanıdır. Yerli məscidin elan etdiyi vaxtla bir neçə dəqiqə fərq ola bilər.', en: 'Times are calculated from the city coordinates (aladhan.com). Imsak marks the end of suhoor, iftar is the Maghrib adhan. Your local mosque may differ by a few minutes.', ru: 'Время рассчитано по координатам города (aladhan.com). Имсак — окончание сухура, ифтар — азан магриба. Время местной мечети может отличаться на несколько минут.', ar: 'الأوقات محسوبة وفق إحداثيات المدينة (aladhan.com). الإمساك نهاية السحور، والإفطار عند أذان المغرب. قد يختلف توقيت المسجد المحلي ببضع دقائق.', tr: 'Vakitler şehrin koordinatlarına göre hesaplanmıştır (aladhan.com). İmsak sahurun son anı, iftar akşam ezanıdır. Yerel caminin vakitleriyle birkaç dakika fark olabilir.' },
  how:     { az: 'Necə işlədilir: şəhərinizi seçin — cədvəl o şəhər üçün qurulur. İmsak sütunu səhurun son anı, iftar sütunu məğrib azanıdır; bugünkü sətir vurğulanır.', en: 'How to use: choose your city and the table is built for it. The Imsak column is the last moment of suhoor, the Iftar column is the Maghrib adhan; today’s row is highlighted.', ru: 'Как пользоваться: выберите город — таблица строится для него. Столбец «Имсак» — последний момент сухура, «Ифтар» — азан магриба; сегодняшняя строка выделена.', ar: 'طريقة الاستخدام: اختر مدينتك فيُبنى الجدول لها. عمود الإمساك آخر وقت السحور، وعمود الإفطار أذان المغرب، وصفّ اليوم مميَّز.', tr: 'Nasıl kullanılır: şehrinizi seçin, tablo ona göre hazırlanır. İmsak sütunu sahurun son anı, iftar sütunu akşam ezanıdır; bugünün satırı vurgulanır.' },
  stDays:  { az: 'gün oruc', en: 'days of fasting', ru: 'дней поста', ar: 'يومًا من الصيام', tr: 'gün oruç' },
  stJuz:   { az: 'cüz — gündə biri', en: 'juz — one a day', ru: 'джузов — по одному в день', ar: 'جزءًا — جزء كل يوم', tr: 'cüz — günde bir' },
  stNights:{ az: 'son gecə — Qədr gecəsi', en: 'last nights — Laylat al-Qadr', ru: 'последних ночей — Ночь предопределения', ar: 'ليالٍ أخيرة — ليلة القدر', tr: 'son gece — Kadir gecesi' },
  fast:    { az: 'Oruc', en: 'Fast', ru: 'Пост', ar: 'الصيام', tr: 'Oruç' },
  hUnit:   { az: 'saat', en: 'h', ru: 'ч', ar: 'ساعة', tr: 'saat' },
  glEyebrow: { az: 'Bir baxışda', en: 'At a glance', ru: 'С первого взгляда', ar: 'نظرة سريعة', tr: 'Bir bakışta' },
  glTitle: { az: 'Ayın oruc saatları', en: 'Fasting hours across the month', ru: 'Часы поста по дням месяца', ar: 'ساعات الصيام خلال الشهر', tr: 'Ay boyunca oruç saatleri' },
  glLead:  { az: 'Hər sütun bir günün orucudur — imsakdan iftara qədər. Bugünkü gün qızılı rəngdədir.', en: 'Each column is one day’s fast, from imsak to iftar. Today is shown in gold.', ru: 'Каждый столбец — пост одного дня, от имсака до ифтара. Сегодняшний день — золотой.', ar: 'كل عمود صيام يوم واحد من الإمساك إلى الإفطار، واليوم مميَّز بالذهبي.', tr: 'Her sütun bir günün orucudur — imsaktan iftara. Bugün altın renkte.' },
  chartTitle: { az: 'Orucun uzunluğu', en: 'Length of the fast', ru: 'Длительность поста', ar: 'مدة الصيام', tr: 'Orucun uzunluğu' },
  chartSub: { az: 'saat:dəqiqə, {city}', en: 'hours:minutes, {city}', ru: 'часы:минуты, {city}', ar: 'ساعات:دقائق، {city}', tr: 'saat:dakika, {city}' },
  longest: { az: 'Ən uzun', en: 'Longest', ru: 'Самый долгий', ar: 'الأطول', tr: 'En uzun' },
  shortest:{ az: 'Ən qısa', en: 'Shortest', ru: 'Самый короткий', ar: 'الأقصر', tr: 'En kısa' },
  dayN:    { az: '{n}-ci gün', en: 'day {n}', ru: 'день {n}', ar: 'اليوم {n}', tr: '{n}. gün' },
  monthRing: { az: 'Ramazanın keçən hissəsi', en: 'Ramadan elapsed', ru: 'Прошло от Рамадана', ar: 'ما مضى من رمضان', tr: 'Ramazan’ın geçen kısmı' },
  // lang-ok: rəqəm formatı az və tr-də eynidir
  ringSub: { az: '{n} / {t} gün', en: '{n} / {t} days', ru: '{n} / {t} дней', ar: '{n} / {t} يومًا', tr: '{n} / {t} gün' },
  ringBefore: { az: 'Ramazan hələ başlamayıb', en: 'Ramadan has not started yet', ru: 'Рамадан ещё не начался', ar: 'لم يبدأ رمضان بعد', tr: 'Ramazan henüz başlamadı' },
  viewAs:  { az: 'Görünüş', en: 'View', ru: 'Вид', ar: 'طريقة العرض', tr: 'Görünüm' },
  vCards:  { az: 'Kartlar', en: 'Cards', ru: 'Карточки', ar: 'بطاقات', tr: 'Kartlar' },
  vTable:  { az: 'Cədvəl', en: 'Table', ru: 'Таблица', ar: 'جدول', tr: 'Tablo' },
  toToday: { az: 'Bu günə keç', en: 'Jump to today', ru: 'К сегодняшнему дню', ar: 'انتقل إلى اليوم', tr: 'Bugüne git' },
  lastTen: { az: 'Son 10 gecə', en: 'Last 10 nights', ru: 'Последние 10 ночей', ar: 'العشر الأواخر', tr: 'Son 10 gece' },
  wait:    { az: 'Hicri tarix müəyyən edilir…', en: 'Determining the Hijri date…', ru: 'Определяется дата по хиджре…', ar: 'جارٍ تحديد التاريخ الهجري…', tr: 'Hicri tarih belirleniyor…' },
}
const pick = (o, lang) => pickUi(o, lang, 'en')

// Bələdçi və xətm planı yazıları
const GT = {
  eyebrow:  { az: 'Bilik', en: 'Knowledge', ru: 'Знание', ar: 'علم', tr: 'Bilgi' },
  title:    { az: 'Ramazan bələdçisi', en: 'Ramadan guide', ru: 'Путеводитель по Рамадану', ar: 'دليل رمضان', tr: 'Ramazan rehberi' },
  lead:     { az: 'Orucun fəziləti və hökmləri, səhur və iftar, təravih, Qədr gecəsi və etikaf — Quran, səhih Sünnə və Sələf alimlərinin fətvaları əsasında.', en: 'The virtues and rulings of fasting, suhoor and iftar, Taraweeh, Laylat al-Qadr and i’tikaf — based on the Quran, the authentic Sunnah and the fatwas of the scholars of the Salaf.', ru: 'Достоинства и положения поста, сухур и ифтар, таравих, Ночь предопределения и итикаф — на основе Корана, достоверной Сунны и фетв учёных саляфов.', ar: 'فضل الصيام وأحكامه، والسحور والإفطار، والتراويح، وليلة القدر، والاعتكاف — من القرآن والسنة الصحيحة وفتاوى علماء السلف.', tr: 'Orucun fazileti ve hükümleri, sahur ve iftar, teravih, Kadir gecesi ve itikâf — Kur’an, sahih Sünnet ve Selef âlimlerinin fetvalarına dayanarak.' },
  contents: { az: 'Bölmələr', en: 'Sections', ru: 'Разделы', ar: 'الأقسام', tr: 'Bölümler' },
  sources:  { az: 'Fətvaların mənbələri', en: 'Sources of the fatwas', ru: 'Источники фетв', ar: 'مصادر الفتاوى', tr: 'Fetvaların kaynakları' },
  khatm:    { az: '30 günlük xətm planı', en: '30-day khatm plan', ru: 'План хатма за 30 дней', ar: 'خطة ختم القرآن في 30 يومًا', tr: '30 günlük hatim planı' },
  khatmLead:{ az: 'Hər gün bir cüz oxuyun — ayın sonunda Quranı xətm etmiş olacaqsınız. Oxuduğunuz cüzü qeyd edin; qeydlər bu cihazda saxlanılır.', en: 'Read one juz a day and you will have completed the Quran by the end of the month. Tick each juz you finish; your progress is saved on this device.', ru: 'Читайте по одному джузу в день — и к концу месяца завершите Коран. Отмечайте прочитанные джузы; отметки сохраняются на этом устройстве.', ar: 'اقرأ جزءًا كل يوم تختم القرآن في آخر الشهر. ضع علامة على كل جزء تقرؤه؛ يُحفظ تقدّمك على هذا الجهاز.', tr: 'Her gün bir cüz okuyun; ayın sonunda Kur’an’ı hatmetmiş olursunuz. Okuduğunuz cüzü işaretleyin; ilerlemeniz bu cihazda saklanır.' },
  juz:      { az: 'Cüz', en: 'Juz', ru: 'Джуз', ar: 'الجزء', tr: 'Cüz' },
  dayN:     { az: '{n}-ci gün', en: 'Day {n}', ru: 'День {n}', ar: 'اليوم {n}', tr: '{n}. gün' },
  todayJuz: { az: 'Bu günün cüzü', en: 'Today’s juz', ru: 'Джуз на сегодня', ar: 'جزء اليوم', tr: 'Bugünün cüzü' },
  done:     { az: '{n} / 30 cüz oxunub', en: '{n} / 30 juz read', ru: 'Прочитано {n} из 30 джузов', ar: 'قُرئ {n} من 30 جزءًا', tr: '{n} / 30 cüz okundu' },
  complete: { az: 'Təbriklər! Quranı xətm etdiniz. Allah qəbul etsin.', en: 'Congratulations! You have completed the Quran. May Allah accept it.', ru: 'Поздравляем! Вы завершили чтение Корана. Да примет Аллах.', ar: 'مبارك! لقد ختمت القرآن، تقبّل الله منك.', tr: 'Tebrikler! Kur’an’ı hatmettiniz. Allah kabul etsin.' },
  reset:    { az: 'Planı sıfırla', en: 'Reset the plan', ru: 'Сбросить план', ar: 'إعادة تعيين الخطة', tr: 'Planı sıfırla' },
  confirmReset: { az: 'Bütün qeydlər silinsin?', en: 'Clear all ticks?', ru: 'Снять все отметки?', ar: 'هل تريد مسح جميع العلامات؟', tr: 'Tüm işaretler silinsin mi?' },
  open:     { az: 'Oxu', en: 'Read', ru: 'Читать', ar: 'اقرأ', tr: 'Oku' },
  markJuz:  { az: '{n}-ci cüz oxundu', en: 'Juz {n} read', ru: 'Джуз {n} прочитан', ar: 'تمت قراءة الجزء {n}', tr: '{n}. cüz okundu' },
}
const fill = (s, n) => s.replace('{n}', n)
// Azərbaycan sıra şəkilçisi (1–30): bir-ci, üç-cü, altı-cı, doqquz-cu, on-cu, iyirmi-ci, otuz-cu
const AZ_ORD_UNIT = ['', '-ci', '-ci', '-cü', '-cü', '-ci', '-cı', '-ci', '-ci', '-cu']
const AZ_ORD_TEN = ['', '-cu', '-ci', '-cu']
const azOrd = (n) => n + (n % 10 ? AZ_ORD_UNIT[n % 10] : AZ_ORD_TEN[n / 10] || '-cu')
const ordFill = (o, lang, n) => lang === 'az' ? pick(o, lang).replace('{n}-ci', azOrd(n)) : fill(pick(o, lang), n)

// ── Xətm planı (localStorage) ──
const KHATM_KEY = 'muslim_cc_ramadan_khatm_v1'
function loadKhatm() {
  try {
    const raw = JSON.parse(localStorage.getItem(KHATM_KEY))
    const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.done) ? raw.done : []
    return arr.filter(n => Number.isInteger(n) && n >= 1 && n <= 30)
  } catch { return [] }
}
function saveKhatm(done) {
  try { localStorage.setItem(KHATM_KEY, JSON.stringify({ done })) } catch { /* yaddaş bağlıdır */ }
}

function KhatmPlan({ lang, todayJuz }) {
  const [done, setDone] = useState(loadKhatm)
  const set = new Set(done)
  const toggle = (n) => {
    const next = set.has(n) ? done.filter(x => x !== n) : [...done, n].sort((a, b) => a - b)
    if (!set.has(n)) ummahAdd('juz')
    setDone(next)
    saveKhatm(next)
  }
  const reset = () => {
    if (!done.length) return
    if (typeof window !== 'undefined' && !window.confirm(pick(GT.confirmReset, lang))) return
    setDone([])
    saveKhatm([])
  }
  return (
    <section className="ui-card rp-khatm" aria-labelledby="rp-khatm-title" data-testid="khatm-plan" data-reveal>
      <div className="rp-khatm__head">
        <span className="ui-icon-tile" aria-hidden="true"><Icon name="quran" /></span>
        <div className="rp-khatm__intro">
          <h3 id="rp-khatm-title" className="rp-khatm__title">{pick(GT.khatm, lang)}</h3>
          <p className="rp-khatm__lead">{pick(GT.khatmLead, lang)}</p>
        </div>
      </div>
      <div className="rp-khatm__progress tm-ring tm-ring--live" style={{ '--tm-ring-from': ringFrom(done.length, 30, 56, 6) }}>
        <ProgressRing value={done.length} max={30} size={56} thickness={6} label={pick(GT.khatm, lang)} className="rp-khatm__ring" />
        <span className="rp-khatm__count ui-num" data-testid="khatm-count">{fill(pick(GT.done, lang), done.length)}</span>
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={reset} disabled={!done.length}>
          <Icon name="refresh" className="ui-btn__icon" /> {pick(GT.reset, lang)}
        </button>
      </div>
      {done.length === 30 && <Sparkle count={12} radius={80} />}
      {done.length === 30 && <p className="rp-khatm__done" role="status"><Icon name="check" size={16} /> {pick(GT.complete, lang)}</p>}
      <ol className="rp-khatm__grid tm-cascade">
        {JUZ_RANGES.map(([from, to], i) => {
          const n = i + 1
          const checked = set.has(n)
          const isToday = todayJuz === n
          const surah = Number(from.split(':')[0])
          return (
            <li key={n} className={`rp-juz${checked ? ' is-done' : ''}${isToday ? ' is-today' : ''}`}>
              <label className="rp-juz__label">
                <input type="checkbox" className="rp-juz__check" checked={checked} onChange={() => toggle(n)}
                  aria-label={ordFill(GT.markJuz, lang, n)} />
                <span className="rp-juz__text">
                  <span className="rp-juz__name">{pick(GT.juz, lang)} <span className="ui-num">{n}</span></span>
                  <span className="rp-juz__range ui-num" dir="ltr">{from} – {to}</span>
                  {isToday && <span className="ui-badge ui-badge--brand rp-juz__today">{pick(GT.todayJuz, lang)}</span>}
                </span>
              </label>
              <a className="rp-juz__open" href={pathFor('quran', lang, surah)}
                aria-label={`${pick(GT.open, lang)}: ${pick(GT.juz, lang)} ${n}`}>
                <Icon name="arrow" size={16} className="ui-flip-rtl" />
              </a>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

// Bölmədən başqa dərsə / səhifəyə keçid (məzmun təkrarlanmır)
function GuideLink({ link, lang }) {
  const navigate = useNavigate()
  const href = link.kind === 'lesson' ? `${pathFor('learn', lang)}/${link.slug}` : pathFor(link.key, lang)
  const onClick = (e) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(href)
    window.scrollTo(0, 0)
  }
  return (
    <a href={href} onClick={onClick} className="ui-card ui-card--interactive rp-guide-link">
      <Icon name={link.kind === 'lesson' ? 'learn' : link.key} size={20} className="rp-guide-link__icon" />
      <span>{pick(link.label, lang)}</span>
      <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
    </a>
  )
}

function RamadanGuide({ lang, todayJuz }) {
  // v3.2: hazırda oxunan bölmə — çip vurğulanır və zolaqda görünən yerə sürüşdürülür
  const [active, setActive] = useState(null)
  const navRef = useRef(null)
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const els = RAMADAN_GUIDE.map(s => document.getElementById(`rp-g-${s.id}`)).filter(Boolean)
    if (!els.length) return
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter(en => en.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (vis[0]) setActive(vis[0].target.id.slice(5))
    }, { rootMargin: '-20% 0px -65% 0px' })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!active || !navRef.current) return
    const list = navRef.current.querySelector('.rp-guide-nav__list')
    const chip = navRef.current.querySelector(`[data-sec="${active}"]`)
    if (!list || !chip) return
    const l = list.getBoundingClientRect(), c = chip.getBoundingClientRect()
    if (c.left < l.left || c.right > l.right) list.scrollBy({ left: c.left - l.left - (l.width - c.width) / 2, behavior: 'auto' })
  }, [active])
  const jump = (e, id) => {
    if (!isPlainClick(e)) return
    const el = document.getElementById(`rp-g-${id}`)
    if (!el) return
    e.preventDefault()
    el.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
    el.querySelector('.ls-sec__title')?.focus({ preventScroll: true })
  }
  return (
    <section className="ui-section ui-section--alt ls-page rp-guide" aria-labelledby="rp-guide-title" data-testid="ramadan-guide">
      <div className="ui-container rp-guide__inner">
        <div className="ui-section-head">
          <span className="ui-eyebrow">{pick(GT.eyebrow, lang)}</span>
          <h2 id="rp-guide-title" className="ui-title">{pick(GT.title, lang)}</h2>
          <p className="ui-lead">{pick(GT.lead, lang)}</p>
        </div>

        <nav className="rp-guide-nav" aria-label={pick(GT.contents, lang)} ref={navRef}>
          <ul className="rp-guide-nav__list">
            {RAMADAN_GUIDE.map(s => (
              <li key={s.id}>
                <a href={`#rp-g-${s.id}`} data-sec={s.id} aria-current={active === s.id ? 'location' : undefined}
                  className={`ui-chip rp-guide-nav__chip${active === s.id ? ' is-active' : ''}`} onClick={(e) => jump(e, s.id)}>
                  <Icon name={s.icon} size={15} /> {pick(s.title, lang)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <KhatmPlan lang={lang} todayJuz={todayJuz} />

        <div className="ls-article rp-guide__article">
          {RAMADAN_GUIDE.map(s => (
            <section key={s.id} id={`rp-g-${s.id}`} className="ls-sec rp-guide__sec" aria-labelledby={`rp-g-${s.id}-h`}>
              <h3 id={`rp-g-${s.id}-h`} className="ls-sec__title" tabIndex={-1}>{pick(s.title, lang)}</h3>
              <LessonBlocks blocks={s.blocks} lang={lang} />
              {s.links?.map((l, i) => <GuideLink key={i} link={l} lang={lang} />)}
            </section>
          ))}
          <section className="ls-sec ui-card ui-card--sunken ls-sources" aria-labelledby="rp-g-sources-h">
            <h3 id="rp-g-sources-h" className="ls-sec__title" tabIndex={-1}>{pick(GT.sources, lang)}</h3>
            <ul className="ls-sources__list">
              {RAMADAN_SOURCES.map((r, i) => (
                <li key={i}>
                  <Icon name="external" size={15} />
                  <a href={r.url} target="_blank" rel="noopener noreferrer nofollow" dir="auto" lang="ar">{r.label}</a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </section>
  )
}

// Cədvəl sütunları (imsak + 6 vaxt); iftar sütunu "İftar (məğrib)"
const COLS = ['imsak', 'fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

function colLabel(key, lang) {
  if (key === 'imsak') return pick(RC_TXT.imsak, lang)
  if (key === 'maghrib') return `${pick(RC_TXT.iftar, lang)} (${pickUi(PRAYER_NAMES.maghrib, lang, 'en')})`
  return PRAYER_NAMES[key]?.[lang] || PRAYER_NAMES[key]?.en || key
}

// Orucun uzunluğu (dəqiqə): imsakdan iftara (məğrib)
const toMin = (hm) => { const m = /^(\d{1,2}):(\d{2})/.exec(hm || ''); return m ? +m[1] * 60 + +m[2] : null }
function fastMinutes(e) {
  const a = toMin(e.times.imsak || e.times.fajr), b = toMin(e.times.maghrib)
  return a != null && b != null && b > a ? b - a : null
}
const pad2 = (n) => String(n).padStart(2, '0')
const durHM = (min) => `${Math.floor(min / 60)}:${pad2(min % 60)}`

/** Ayın oruc saatları: sütunlar (y oxu min–max aralığına yaxınlaşdırılıb), ring, rəqəmlər. */
function MonthGlance({ calendar, todayDate, dayNumber, inRamadan, lang, city }) {
  const rows = calendar.map(e => ({ day: e.day, date: e.date, min: fastMinutes(e) })).filter(r => r.min != null)
  if (rows.length < 2) return null
  const mins = rows.map(r => r.min)
  const lo = Math.min(...mins), hi = Math.max(...mins)
  const floor = Math.max(0, lo - Math.max(10, (hi - lo) * 0.6))   // sütunlar fərqi göstərsin, sıfırdan yox
  const longest = rows.find(r => r.min === hi), shortest = rows.find(r => r.min === lo)
  const total = calendar.length
  const passed = inRamadan && dayNumber ? Math.min(total, dayNumber) : 0
  const W = 600, H = 150, gap = 3
  const bw = (W - gap * (rows.length - 1)) / rows.length
  const y = (m) => H - ((m - floor) / (hi - floor || 1)) * (H - 8)
  const aria = `${pick(TXT.chartTitle, lang)}: ${pick(TXT.shortest, lang)} ${durHM(lo)}, ${pick(TXT.longest, lang)} ${durHM(hi)}`
  const dayLabel = (n) => ordFill(TXT.dayN, lang, n)
  return (
    <section className="ui-section ui-section--tight rp-glance" aria-labelledby="rp-glance-title">
      <div className="ui-container">
        <div className="ui-section-head" data-reveal>
          <span className="ui-eyebrow">{pick(TXT.glEyebrow, lang)}</span>
          <h2 id="rp-glance-title" className="ui-title">{pick(TXT.glTitle, lang)}</h2>
          <p className="ui-lead">{pick(TXT.glLead, lang)}</p>
        </div>
        <div className="rp-glance__grid">
          <ChartFigure title={pick(TXT.chartTitle, lang)} sub={pick(TXT.chartSub, lang).replace('{city}', city)} className="rp-fast-fig">
            <svg className="rp-fast" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={aria}>
              {rows.map((r, i) => (
                <rect key={r.day} style={{ '--i': i }} x={i * (bw + gap)} y={y(r.min)} width={bw} height={H - y(r.min)} rx={Math.min(3, bw / 3)}
                  className={r.date === todayDate ? 'is-today' : undefined} />
              ))}
            </svg>
            <div className="rp-fast__axis" aria-hidden="true">
              {rows.map(r => <span key={r.day}>{r.day === 1 || r.day % 5 === 0 ? r.day : ''}</span>)}
            </div>
          </ChartFigure>
          <div className="rp-glance__side tm-ring" data-reveal="fade" style={{ '--tm-ring-from': ringFrom(passed, total, 88, 8) }}>
            <ProgressRing value={passed} max={total} size={88} thickness={8}
              label={pick(TXT.monthRing, lang)}
              sub={passed ? pick(TXT.ringSub, lang).replace('{n}', passed).replace('{t}', total) : pick(TXT.ringBefore, lang)} />
            <div className="ui-stats rp-glance__stats">
              <StatTile icon="sun" label={pick(TXT.longest, lang)} value={durHM(hi)} unit={pick(TXT.hUnit, lang)} hint={dayLabel(longest.day)} variant="sunken" />
              <StatTile icon="moon" label={pick(TXT.shortest, lang)} value={durHM(lo)} unit={pick(TXT.hUnit, lang)} hint={dayLabel(shortest.day)} variant="sunken" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Qısa həftə günü (az — əl ilə; qalanları Intl)
const AZ_WD = ['B.', 'B.e.', 'Ç.a.', 'Ç.', 'C.a.', 'C.', 'Ş.']
// lang-ok: lokal kodları cədvəli, az əl ilə yazılır
const WD_LOCALES = { en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar' }
function shortWeekday(dateKey, lang) {
  const wd = weekdayOf(dateKey)
  if (lang === 'az') return AZ_WD[wd]
  const [d, m, y] = dateKey.split('-').map(Number)
  try { return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(WD_LOCALES[lang] || 'en-GB', { weekday: 'short', timeZone: 'UTC' }) } catch { return '' }
}

// v3.2: imsakiyyə görünüşü — kartlar (telefonda standart) və ya cədvəl; seçim yadda saxlanılır
const VIEW_KEY = 'muslim_cc_ramadan_view_v1'
function initialView() {
  try { const v = localStorage.getItem(VIEW_KEY); if (v === 'cards' || v === 'table') return v } catch { /* yaddaş yoxdur */ }
  try { return window.matchMedia('(max-width: 767.98px)').matches ? 'cards' : 'table' } catch { return 'table' }
}
const SMALL_COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'isha']

function DayCards({ calendar, todayDate, todayRef, lang }) {
  return (
    <ol className="rp-days tm-cascade" data-reveal="fade" data-testid="ramadan-cards" aria-labelledby="rp-table-title">
      {calendar.map(e => {
        const isToday = e.date === todayDate
        const fm = fastMinutes(e)
        const lastTen = e.day >= 21
        return (
          <li key={e.date} ref={isToday ? todayRef : undefined} aria-current={isToday ? 'date' : undefined}
            className={`ui-card rp-day${isToday ? ' is-today' : ''}${lastTen ? ' is-last10' : ''}`}>
            <div className="rp-day__head">
              <span className="rp-day__num ui-num" aria-hidden="true">{e.day}</span>
              <span className="rp-day__date">
                <b>{formatGregorian(e.date, lang, { day: 'numeric', month: 'long' })}</b>
                <span>{shortWeekday(e.date, lang)} · {pick(TXT.day, lang)} {e.day}</span>
              </span>
              {isToday
                ? <span className="ui-badge ui-badge--solid rp-day__badge">{pick(TXT.today, lang)}</span>
                : lastTen ? <span className="ui-badge rp-day__badge"><Icon name="moon" size={12} /> {pick(TXT.lastTen, lang)}</span> : null}
            </div>
            <dl className="rp-day__main">
              <div><dt>{pick(RC_TXT.imsak, lang)}</dt><dd className="ui-num">{e.times.imsak || '—'}</dd></div>
              <div><dt>{pick(RC_TXT.iftar, lang)}</dt><dd className="ui-num">{e.times.maghrib || '—'}</dd></div>
              <div className="rp-day__fast"><dt>{pick(TXT.fast, lang)}</dt><dd className="ui-num">{fm != null ? durHM(fm) : '—'}</dd></div>
            </dl>
            <dl className="rp-day__rest">
              {SMALL_COLS.map(k => <div key={k}><dt>{colLabel(k, lang)}</dt><dd className="ui-num">{e.times[k] || '—'}</dd></div>)}
            </dl>
          </li>
        )
      })}
    </ol>
  )
}

export default function RamadanPage({ setPage }) {
  const { lang } = useLang()
  const st = useRamadan({ alwaysCalendar: true })
  const { calendar, calError, calLoading, reloadCalendar, year, loc, clock, preview, day } = st
  const city = loc.city?.[lang] || loc.city?.en || ''
  const title = pick(TXT.title, lang)

  // Vurğulanan gün: real tarix; önizləmədə simulyasiya olunan gün
  const todayDate = preview?.mode === 'preview' ? day?.date : clock.dateKey
  const todayRef = useRef(null)
  const cardTodayRef = useRef(null)
  const [view, setViewState] = useState(initialView)
  const setView = (v) => { setViewState(v); try { localStorage.setItem(VIEW_KEY, v) } catch { /* yaddaş yoxdur */ } }
  useEffect(() => {
    // Ramazandadırsa cədvəldə bugünkü sətir görünən yerə gəlsin (səhifə yox, cədvəlin öz sürüşməsi)
    const row = todayRef.current
    const box = row?.closest('.rp-scroll')
    if (row && box && box.scrollHeight > box.clientHeight) box.scrollTop = row.offsetTop - box.clientHeight / 3
  }, [calendar, todayDate, view])
  const hasToday = !!calendar?.some(e => e.date === todayDate)
  const goToday = () => {
    const el = view === 'cards' ? cardTodayRef.current : todayRef.current
    if (!el) return
    el.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })
  }

  return (
    <div className="rp-root">
      <header className="ui-page-hero rp-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <GeoStarfield className="rp-sky" rosette={false} />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={title} />
          <span className="ui-eyebrow">{navGroupLabel('worship', lang)}</span>
          <h1 className="ui-display">{title}</h1>
          <p className="ui-lead">{pick(TXT.lead, lang)}</p>
          <p className="ui-page-hero__how"><Icon name="info" size={16} /> {pick(TXT.how, lang)}</p>
          <ul className="ui-page-hero__stats">
            <li><b>29–30</b><span>{pick(TXT.stDays, lang)}</span></li>
            <li><b data-count="30">30</b><span>{pick(TXT.stJuz, lang)}</span></li>
            <li><b data-count="10">10</b><span>{pick(TXT.stNights, lang)}</span></li>
          </ul>
        </div>
      </header>

      <section className="ui-section ui-section--tight rp-main">
        <div className="ui-container rp-stack">
          <RamadanCard state={st} />
          <CrescentPath key={year || 'x'} lang={lang} year={year || 'x'} today={st.phase?.phase === 'ramadan' ? st.phase.day : null}
            started={st.phase?.phase === 'ramadan' || st.phase?.phase === 'eid'}
            monthDays={st.calendar?.length === 29 ? 29 : 30} onNavigate={setPage} />

          <div className="rp-print">
            <div className="rp-toolbar" data-reveal>
              <div className="rp-toolbar-head">
                <h2 className="rp-title" id="rp-table-title">
                  {year ? pick(TXT.tableOf, lang).replace('{y}', year) : title}
                  {city && <span className="rp-title-city"> · {city}</span>}
                </h2>
              </div>
              <div className="rp-actions">
                <CityPicker triggerId="ramadan-city-trigger" />
                <div className="ui-segmented rp-view" role="radiogroup" aria-label={pick(TXT.viewAs, lang)}>
                  {['cards', 'table'].map(v => (
                    <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => setView(v)}>
                      <Icon name={v === 'cards' ? 'widget' : 'list'} size={15} /> {pick(v === 'cards' ? TXT.vCards : TXT.vTable, lang)}
                    </button>
                  ))}
                </div>
                {hasToday && (
                  <button type="button" className="ui-btn ui-btn--ghost rp-today-btn" onClick={goToday}>
                    <Icon name="target" className="ui-btn__icon" /> {pick(TXT.toToday, lang)}
                  </button>
                )}
                <button type="button" className="ui-btn ui-btn--secondary rp-print-btn"
                  onClick={() => window.print()} disabled={!calendar}>
                  <Icon name="calendar" className="ui-btn__icon" /> {pick(TXT.print, lang)}
                </button>
              </div>
            </div>

            {calError ? (
              <div className="rp-state ui-card" role="alert">
                <p>{pick(TXT.error, lang)}</p>
                <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={reloadCalendar}>{pick(TXT.retry, lang)}</button>
              </div>
            ) : !calendar ? (
              <div className="rp-state ui-card" aria-busy="true">
                {!year && !calLoading ? <p>{pick(TXT.wait, lang)}</p> : null}
                {Array.from({ length: 6 }, (_, i) => <span key={i} className="ui-skeleton ui-skeleton--text" style={{ '--w': `${90 - i * 6}%` }} />)}
              </div>
            ) : (<>
              {view === 'cards' && <DayCards calendar={calendar} todayDate={todayDate} todayRef={cardTodayRef} lang={lang} />}
              <div data-reveal="fade" className={`rp-scroll ui-table-wrap${view === 'cards' ? ' rp-scroll--print-only' : ''}`} tabIndex={view === 'cards' ? -1 : 0} role="region" aria-labelledby="rp-table-title">
                {/* tabIndex — sürüşən sahə klaviatura ilə də sürüşsün (axe: scrollable-region-focusable) */}
                <table className="ui-table ui-table--compact ui-table--zebra rp-table tm-cascade-rows" aria-labelledby="rp-table-title" data-testid="ramadan-table">
                  <thead>
                    <tr>
                      <th scope="col">{pick(TXT.day, lang)}</th>
                      <th scope="col">{pick(TXT.date, lang)}</th>
                      {COLS.map(k => <th key={k} scope="col" className={`is-num rp-col-${k}`}>{colLabel(k, lang)}</th>)}
                      <th scope="col" className="is-num rp-col-fast">{pick(TXT.fast, lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calendar.map(e => {
                      const isToday = e.date === todayDate
                      const fm = fastMinutes(e)
                      return (
                        <tr key={e.date} ref={isToday ? todayRef : undefined} className={isToday ? 'is-current is-today' : undefined}
                          aria-current={isToday ? 'date' : undefined}>
                          <th scope="row" className="ui-num">
                            {e.day}
                            {isToday && <span className="rp-today ui-badge ui-badge--solid">{pick(TXT.today, lang)}</span>}
                          </th>
                          <td className="rp-date">
                            {formatGregorian(e.date, lang, { day: 'numeric', month: 'short' })}
                            <span className="rp-wd"> {shortWeekday(e.date, lang)}</span>
                          </td>
                          {COLS.map(k => <td key={k} className={`is-num rp-col-${k}`}>{e.times[k] || '—'}</td>)}
                          <td className="is-num rp-col-fast">{fm != null ? durHM(fm) : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>)}
            <p className="rp-note">{pick(TXT.note, lang)}</p>
          </div>
        </div>
      </section>

      {calendar && (
        <MonthGlance calendar={calendar} todayDate={todayDate} dayNumber={day?.number}
          inRamadan={st.phase?.phase === 'ramadan'} lang={lang} city={city} />
      )}

      <RamadanGuide lang={lang} todayJuz={day?.number >= 1 && day.number <= 30 ? day.number : null} />
    </div>
  )
}
