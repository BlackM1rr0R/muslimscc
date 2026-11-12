import { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import { guessLang } from '../utils/textLang'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import { haptic } from '../hooks/useHaptic'
import Icon from '../components/Icon'
import LessonBlocks, { pick } from '../components/lesson/LessonBlocks'
import { isPlainClick } from '../components/PageLink'
import { pathFor } from '../seo/routes'
import { CAL_EVENT_INFO, CAL_GUIDE_TXT, CAL_HIJRI_LINK, CAL_MONTHS_GUIDE, CAL_SOURCES, eventInfoKey } from '../data/guides/CalendarPage'
import '../styles/LessonsPage.css'
import '../styles/CalendarPage.css'
import '../styles/ToolsMotion.css'
import Breadcrumb from '../components/Breadcrumb'
import RelatedLinks from '../components/prayer/RelatedLinks'
import { showLocalNotification } from '../utils/notify'
import CalSunnahFasts, { weekdayName } from '../components/calendar/CalSunnahFasts'
import { pickUi } from '../utils/uiText'
import { CalDayMoon, CalCrescent, CalMoonNote } from '../components/calendar/CalMoon'
import { MOON_NAMES } from '../components/moonNames'
import HijriYearWheel from '../components/calendar/HijriYearWheel'
import PresenceSwap from '../motion/PresenceSwap'
import DeferRender from '../components/DeferRender'

// ── Gregorian → Hicri çevirmə (Kuwaiti alqoritmi) ──
// Yalnız ehtiyat üçündür: Umm al-Qura-dan 1–2 gün fərqlənə bilər.
// Əsas mənbə hijriOf() — brauzerin Intl Umm al-Qura təqvimi (/jamaat və
// /prayer səhifələri ilə eyni tarix).
function gregorianToHijri(gDate) {
  const gy = gDate.getFullYear()
  const gm = gDate.getMonth() + 1
  const gd = gDate.getDate()

  // Julian Day → Gregorian JD
  const a = Math.floor((14 - gm) / 12)
  const y = gy + 4800 - a
  const m = gm + 12 * a - 3
  const julianDay = gd + Math.floor((153 * m + 2) / 5) + 365 * y
    + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045

  // Julian Day → Hicri
  const l = julianDay - 1948440 + 10632
  const n = Math.floor((l - 1) / 10631)
  const l2 = l - 10631 * n + 354
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719)
    + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238)
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29
  const hm = Math.floor((24 * l3) / 709)
  const hd = l3 - Math.floor((709 * hm) / 24)
  const hy = 30 * n + j - 30

  return { year: hy, month: hm, day: hd }
}

/** Tarixin hicri günü/ayı/ili — Intl Umm al-Qura; dəstəklənmirsə Kuwaiti alqoritmi. */
function hijriOf(date) {
  try {
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' })
    if (String(fmt.resolvedOptions().calendar || '').startsWith('islamic')) {
      const parts = fmt.formatToParts(date)
      const num = (type) => Number(parts.find(p => p.type === type)?.value)
      const day = num('day'), month = num('month'), year = num('year')
      if (month >= 1 && month <= 12 && day >= 1 && day <= 30 && year > 1300) return { year, month, day }
    }
  } catch { /* köhnə brauzer — aşağıdakı alqoritm */ }
  return gregorianToHijri(date)
}

// Hicri il şəkilçisi və hero alt başlığı (il cari tarixdən götürülür)
const HIJRI_SUFFIX = { az: 'H', en: 'AH', ru: 'г.х.', ar: 'هـ', tr: 'H' }
const HERO_SUBTITLE = {
  az: (y) => `Hicri ${y} — Müqəddəs günlər`,
  en: (y) => `Hijri ${y} — Sacred Days`,
  ru: (y) => `Хиджра ${y} — Священные дни`,
  ar: (y) => `هجري ${y} — الأيام المقدسة`,
  tr: (y) => `Hicri ${y} — Kutsal Günler`,
}

// Miladi tarix. Chrome-un yığcam ICU-sunda "az" lokalı yoxdur ("2026 M09 19"
// çıxır) — azərbaycanca əl ilə yazılır; ərəbcədə latın rəqəmləri
const AZ_MONTHS = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avqust','sentyabr','oktyabr','noyabr','dekabr']
const DATE_LOCALES = { en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-u-ca-gregory-nu-latn' }

function formatGregorian(date, lang) {
  if (lang === 'az') return `${date.getDate()} ${AZ_MONTHS[date.getMonth()]} ${date.getFullYear()}`
  const opts = { day: 'numeric', month: 'long', year: 'numeric' }
  try { return date.toLocaleDateString(DATE_LOCALES[lang] || 'en-GB', opts) } catch { return date.toLocaleDateString('en-GB', opts) }
}

const HIJRI_MONTHS = {
  az: ['Məhərrəm','Səfər','Rəbiül-Əvvəl','Rəbiül-Axir','Cəmadiyül-Əvvəl','Cəmadiyül-Axir','Rəcəb','Şaban','Ramazan','Şəvval','Zülqədə','Zülhiccə'],
  en: ['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Ula','Jumada al-Thani','Rajab','Shaban','Ramadan','Shawwal','Dhu al-Qadah','Dhu al-Hijjah'],
  ru: ['Мухаррам','Сафар','Раби аль-Авваль','Раби ас-Сани','Джумада аль-Уля','Джумада ас-Сани','Раджаб','Шабан','Рамадан','Шавваль','Зуль-Каада','Зуль-Хиджа'],
  ar: ['مُحَرَّم','صَفَر','رَبِيع الأَوَّل','رَبِيع الثَّانِي','جُمَادَى الأُولَى','جُمَادَى الآخِرَة','رَجَب','شَعْبَان','رَمَضَان','شَوَّال','ذُو القَعْدَة','ذُو الحِجَّة'],
  tr: ['Muharrem','Safer','Rebiülevvel','Rebiülahir','Cemaziyelevvel','Cemaziyelahir','Recep','Şaban','Ramazan','Şevval','Zilkade','Zilhicce'],
}

// ═══ İSLAMİ TƏQVİM HADİSƏLƏRİ (Sələf mənhəcinə uyğun) ═══
// Yalnız şəriətdə əsli olan günlər. Çıxarılanlar və səbəbi:
//  • Merac gecəsi (27 Rəcəb), Bərat gecəsi (15 Şaban) — bu gecələri xüsusi ibadət/bayram
//    kimi qeyd etməyin dəlili yoxdur: "Kim bizim bu işimizdə ondan olmayan bir şey icad etsə,
//    o, rədd olunur" (Buxari 2697, Muslim 1718). İsra-Merac gecəsinin tarixi səhih rəvayətlə
//    bilinmir və onu qeyd etmək bidətdir — İbn Baz (https://islamqa.info/en/answers/60288);
//    15 Şaban gecəsinin fəziləti barədə səhih mərfu hədis yoxdur, onu ibadətlə xüsusiləşdirmək
//    şəriətdə yoxdur — İbn Cibrin (https://islamqa.info/en/answers/8907). Mövlud
//    (https://islamqa.info/en/answers/70317) və Rəğaib təqvimdə onsuz da yox idi.
//  • "Ramazanın ortası" — şəri əhəmiyyəti olan gün deyil.
//  • Qədr gecəsi — tarixi qəti deyil; son on gecədə, xüsusilə tək gecələrdə axtarılır
//    (Buxari 2017, 2020; https://islamqa.info/en/answers/50693). "27-ci gecə — ən ehtimallı"
//    kimi qəti işarə çıxarıldı.
//  • Ramazan bayramının 2–3-cü günləri — şəri bayram 1 Şəvvaldır (Buxari 1992).
// Əlavə edilənlər: Tasua və Aşura orucu (Muslim 1134, 1162), Şəvvalın 6 günü (Muslim 1164),
// Zülhiccənin ilk 10 günü (Buxari 969), ağ günlər (Nəsai 2420).
// Hicri yeni il yalnız tarix kimi göstərilir (bayram deyil).
const EVENTS = [
  { month:0, day:1,  en:'1 Muharram — start of the Hijri year', az:'1 Məhərrəm — hicri ilin başlanğıcı', ru:'1 Мухаррама — начало года хиджры', ar:'غرة محرم — بداية السنة الهجرية', tr:'1 Muharrem — hicri yılın başlangıcı', icon:'📅', type:'month' },
  { month:0, day:9,  en:"Tasu'a — fasting the 9th of Muharram", az:'Tasua — Məhərrəmin 9-u (Aşura ilə birlikdə oruc)', ru:'Тасуа — 9 Мухаррама (пост вместе с Ашурой)', ar:'تاسوعاء — صيام التاسع من محرم', tr:"Tasua — Muharremin 9'u (Aşure ile birlikte oruç)", icon:'📿', type:'sunnah' },
  { month:0, day:10, en:'Ashura — fasting the 10th of Muharram', az:'Aşura — Məhərrəmin 10-u (oruc)', ru:'Ашура — пост 10 Мухаррама', ar:'عاشوراء — صيام العاشر من محرم', tr:"Aşure — Muharremin 10'u (oruç)", icon:'📿', type:'sunnah' },
  { month:1, day:1,  en:'First of Safar',                    az:'Səfər ayının başlanğıcı',        ru:'Начало месяца Сафар',           ar:'غرة صفر',                  tr:'Safer ayı başlangıcı',  icon:'📅', type:'month' },
  { month:2, day:1,  en:'First of Rabi al-Awwal',           az:'Rəbiül-Əvvəl başlanğıcı',       ru:'Начало Раби аль-Авваль',        ar:'غرة ربيع الأول',           tr:'Rebiülevvel başlangıcı', icon:'📅', type:'month' },
  { month:5, day:1,  en:'First of Jumada al-Thani',         az:'Cəmadiyül-Axir başlanğıcı',     ru:'Начало Джумада ас-Сани',        ar:'غرة جمادى الآخرة',         tr:'Cemaziyelahir başlangıcı', icon:'📅', type:'month' },
  { month:6, day:1,  en:'First of Rajab',                    az:'Rəcəb ayının başlanğıcı',        ru:'Начало месяца Раджаб',          ar:'غرة رجب',                  tr:'Recep ayı başlangıcı',  icon:'🌙', type:'month' },
  { month:7, day:1,  en:'First of Shaban',                   az:'Şaban ayının başlanğıcı',        ru:'Начало месяца Шабан',           ar:'غرة شعبان',                tr:'Şaban ayı başlangıcı',  icon:'🌙', type:'month' },
  { month:8, day:1,  en:'First Day of Ramadan',              az:'Ramazanın birinci günü',         ru:'Первый день Рамадана',          ar:'أول رمضان',                tr:'Ramazan Başlangıcı',    icon:'🌙', type:'major' },
  { month:8, day:21, en:'Last ten nights of Ramadan — seek Laylat al-Qadr (especially the odd nights)', az:'Ramazanın son on gecəsi — Qədr gecəsi axtarılır (xüsusilə tək gecələr)', ru:'Последние десять ночей Рамадана — поиск Ночи Предопределения (особенно нечётные)', ar:'العشر الأواخر من رمضان — تحرّي ليلة القدر (لا سيما الأوتار)', tr:'Ramazanın son on gecesi — Kadir Gecesi aranır (özellikle tek geceler)', icon:'💎', type:'night' },
  { month:9, day:1,  en:'Eid al-Fitr',                       az:'Ramazan bayramı',                ru:'Ураза-байрам',           ar:'عيد الفطر',                tr:'Ramazan Bayramı',       icon:'🎉', type:'major' },
  { month:9, day:2,  en:'Six days of Shawwal fasting (from the 2nd)', az:'Şəvvalın 6 günlük orucu (2-ci gündən)', ru:'Пост шести дней Шавваля (со 2-го числа)', ar:'صيام ست من شوال (من اليوم الثاني)', tr:"Şevval'in 6 gün orucu (2. günden)", icon:'📿', type:'sunnah' },
  { month:11,day:1,  en:'First ten days of Dhu al-Hijjah begin', az:'Zülhiccənin ilk on günü başlayır', ru:'Начало первых десяти дней Зуль-Хиджа', ar:'بداية العشر الأوائل من ذي الحجة', tr:'Zilhiccenin ilk on günü başlıyor', icon:'🕌', type:'sunnah' },
  { month:11,day:8,  en:'Day of Tarwiyah',                   az:'Tərviyə günü',                   ru:'День Тарвия',                   ar:'يوم التروية',              tr:'Terviye Günü',          icon:'🕌', type:'hajj' },
  { month:11,day:9,  en:'Day of Arafah',                     az:'Ərəfə günü',                     ru:'День Арафа',                    ar:'يوم عرفة',                 tr:'Arefe Günü',            icon:'🕌', type:'major' },
  { month:11,day:10, en:'Eid al-Adha',                       az:'Qurban bayramı',                 ru:'Курбан-байрам',     ar:'عيد الأضحى',               tr:'Kurban Bayramı',        icon:'🐑', type:'major' },
  { month:11,day:11, en:'Days of Tashreeq (1)',              az:'Təşriq günləri (1)',              ru:'Дни Ташрика (1)',               ar:'أيام التشريق (١)',          tr:'Teşrik günleri (1)',     icon:'🐑', type:'hajj' },
  { month:11,day:12, en:'Days of Tashreeq (2)',              az:'Təşriq günləri (2)',              ru:'Дни Ташрика (2)',               ar:'أيام التشريق (٢)',          tr:'Teşrik günleri (2)',     icon:'🐑', type:'hajj' },
  { month:11,day:13, en:'Days of Tashreeq (3)',              az:'Təşriq günləri (3)',              ru:'Дни Ташрика (3)',               ar:'أيام التشريق (٣)',          tr:'Teşrik günleri (3)',     icon:'🐑', type:'hajj' },
]

// Ağ günlər (əyyamul-biyd) — hər hicri ayın 13, 14, 15-i oruc (Nəsai 2420, Tirmizi 761).
// Zülhiccənin 13-ü təşriq günüdür, orucu qadağandır (Muslim 1141) — o ay üçün əlavə olunmur.
// Ramazan ayında oruc onsuz da fərzdir — orada da göstərilmir.
for (let m = 0; m < 12; m++) {
  if (m === 8 || m === 11) continue
  EVENTS.push({ month:m, day:13, en:'White days (13–15) — sunnah fasting', az:'Ağ günlər (13–15) — sünnə orucu', ru:'Белые дни (13–15) — желательный пост', ar:'الأيام البيض (١٣–١٥) — صيام مستحب', tr:'Beyaz günler (13–15) — sünnet oruç', icon:'📿', type:'sunnah', bid:true })
}
EVENTS.sort((a, b) => a.month - b.month || a.day - b.day)

// v2: hadisə ikonu növə görə — xətti ikon (Icon.jsx) və sakit ton
// (göy qurşağı kafelləri əvəzinə: əsas/gecə — qızılı, qalanları brend)
const TYPE_ICONS = { major:'star', month:'calendar', night:'moonStar', minor:'dhikr', sunnah:'dhikr', hajj:'hajjguide' }
const TYPE_ACCENT = { major:true, night:true }

// Ay şəbəkəsi: həftə günləri (bazar ertəsindən), 5 dil
const WEEKDAYS = {
  az: ['B.e','Ç.a','Çər','C.a','Cümə','Şən','Baz'],
  en: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  ru: ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'],
  ar: ['إثن','ثلا','أرب','خمي','جمع','سبت','أحد'],
  tr: ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'],
}
const AZ_SHORT = ['yan','fev','mar','apr','may','iyn','iyl','avq','sen','okt','noy','dek']
/** Qısa miladi tarix ("28 okt") — ay şəbəkəsinin xanası üçün. */
function shortGregorian(date, lang) {
  if (lang === 'az') return `${date.getDate()} ${AZ_SHORT[date.getMonth()]}`
  try { return date.toLocaleDateString(DATE_LOCALES[lang] || 'en-GB', { day: 'numeric', month: 'short' }) } catch { return `${date.getDate()}.${date.getMonth() + 1}` }
}

// Səhifənin əlavə mətnləri (5 dil)
const CAL_TXT = {
  az: { lead: 'Hicri ayların günləri miladi tarixlə yanaşı, bayramlar, mübarək gecələr və həcc günləri. Hadisəni seçib xatırladıcı qurun.', today: 'Bu gün', next: 'Növbəti hadisə', prev: 'Əvvəlki ay', nextMonth: 'Növbəti ay', dayEvents: 'Bu günün hadisələri', noDay: 'Bu gün üçün qeyd olunmuş hadisə yoxdur', all: 'Bütün hadisələr', approx: 'Hicri tarixlər Ümmül-Qura təqviminə görə hesablanır; yerli elan 1 gün fərqlənə bilər.' },
  en: { lead: 'The days of each Hijri month alongside Gregorian dates, with Eids, blessed nights and the days of Hajj. Pick an event to set a reminder.', today: 'Today', next: 'Next event', prev: 'Previous month', nextMonth: 'Next month', dayEvents: 'Events on this day', noDay: 'No events marked for this day', all: 'All events', approx: 'Hijri dates follow the Umm al-Qura calendar; local announcements may differ by a day.' },
  ru: { lead: 'Дни каждого месяца хиджры рядом с григорианскими датами, праздники, благословенные ночи и дни хаджа. Выберите событие, чтобы поставить напоминание.', today: 'Сегодня', next: 'Следующее событие', prev: 'Предыдущий месяц', nextMonth: 'Следующий месяц', dayEvents: 'События этого дня', noDay: 'На этот день событий нет', all: 'Все события', approx: 'Даты хиджры рассчитаны по календарю Умм аль-Кура; местные объявления могут отличаться на день.' },
  ar: { lead: 'أيام كل شهر هجري مع التاريخ الميلادي، والأعياد والليالي المباركة وأيام الحج. اختر حدثًا لضبط تذكير.', today: 'اليوم', next: 'الحدث التالي', prev: 'الشهر السابق', nextMonth: 'الشهر التالي', dayEvents: 'أحداث هذا اليوم', noDay: 'لا توجد أحداث مسجلة لهذا اليوم', all: 'جميع الأحداث', approx: 'التواريخ الهجرية وفق تقويم أم القرى، وقد يختلف الإعلان المحلي بيوم واحد.' },
  tr: { lead: 'Hicri ayların günleri miladi tarihle yan yana; bayramlar, mübarek geceler ve hac günleri. Bir olayı seçip hatırlatıcı kurun.', today: 'Bugün', next: 'Sonraki olay', prev: 'Önceki ay', nextMonth: 'Sonraki ay', dayEvents: 'Bu günün olayları', noDay: 'Bu gün için kayıtlı olay yok', all: 'Tüm olaylar', approx: 'Hicri tarihler Ümmü’l-Kura takvimine göre hesaplanır; yerel duyuru bir gün farklı olabilir.' },
}

/**
 * Cari hicri ilin hər ayının günləri → miladi tarix. Brauzerin hicri
 * təqvimi (hijriOf) bugündən ±400 gün aralığında yoxlanılır — tərs çevirmə
 * alqoritmi lazım deyil. Nəticə: [ay 0..11] → [{ day, date }].
 */
function buildHijriYear(hYear, base) {
  const months = Array.from({ length: 12 }, () => [])
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate() - 400, 12)
  for (let i = 0; i <= 800; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12)
    const h = hijriOf(d)
    if (h.year === hYear && h.month >= 1 && h.month <= 12) months[h.month - 1].push({ day: h.day, date: d })
  }
  return months
}

// ── Dizayn v3: hero "necə işlədilir", geri sayım, ay zolağı, əlaqəli bölmələr ──
const CAL_X = {
  az: { how: 'Necə işlədilir: ayı seçin, günə toxunun — o günün hadisələri sağda görünür. Zəng düyməsi hadisə günü xatırladır.', daysLeft: (n) => (n === 0 ? 'bu gün' : n === 1 ? 'sabah' : `${n} gün qaldı`), days: (n) => `${n} gün`, events: (n) => `${n} hadisə`, monthsLabel: 'Hicri aylar' },
  en: { how: 'How to use: pick a month and tap a day — its events appear alongside. The bell button reminds you on the day.', daysLeft: (n) => (n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`), days: (n) => `${n} days`, events: (n) => `${n} events`, monthsLabel: 'Hijri months' },
  ru: { how: 'Как пользоваться: выберите месяц и нажмите на день — его события появятся рядом. Кнопка с колокольчиком напомнит в этот день.', daysLeft: (n) => (n === 0 ? 'сегодня' : n === 1 ? 'завтра' : `через ${n} дн.`), days: (n) => `${n} дн.`, events: (n) => `событий: ${n}`, monthsLabel: 'Месяцы хиджры' },
  ar: { how: 'طريقة الاستعمال: اختر الشهر ثم اليوم لتظهر أحداثه بجانبه، وزر الجرس يذكّرك في يوم الحدث.', daysLeft: (n) => (n === 0 ? 'اليوم' : n === 1 ? 'غدًا' : `بعد ${n} يومًا`), days: (n) => `${n} يومًا`, events: (n) => `${n} أحداث`, monthsLabel: 'الشهور الهجرية' },
  tr: { how: 'Nasıl kullanılır: ayı seçin, bir güne dokunun — o günün olayları yanında görünür. Zil düğmesi olay günü hatırlatır.', daysLeft: (n) => (n === 0 ? 'bugün' : n === 1 ? 'yarın' : `${n} gün kaldı`), days: (n) => `${n} gün`, events: (n) => `${n} olay`, monthsLabel: 'Hicri aylar' },
}
const CAL_RELATED = [
  { key: 'hijri', title: { az: 'Hicri tarix çevirici', en: 'Hijri date converter', ru: 'Конвертер дат хиджры', ar: 'محوّل التاريخ الهجري', tr: 'Hicri tarih çevirici' }, text: { az: 'Miladi ↔ hicri', en: 'Gregorian ↔ Hijri', ru: 'Григорианская ↔ хиджра', ar: 'ميلادي ↔ هجري', tr: 'Miladi ↔ hicri' } },
  { key: 'ramadan', title: { az: 'İmsakiyyə', en: 'Ramadan timetable', ru: 'Расписание Рамадана', ar: 'إمساكية رمضان', tr: 'İmsakiye' }, text: { az: 'Ramazan vaxtları', en: 'Ramadan times', ru: 'Время в Рамадан', ar: 'أوقات رمضان', tr: 'Ramazan vakitleri' } },
  { key: 'hajjguide', title: { az: 'Həcc və ümrə', en: 'Hajj and Umrah', ru: 'Хадж и умра', ar: 'الحج والعمرة', tr: 'Hac ve umre' }, text: { az: 'Addım-addım bələdçi', en: 'Step-by-step guide', ru: 'Пошаговое руководство', ar: 'دليل خطوة بخطوة', tr: 'Adım adım rehber' } },
  { lesson: 'sunnah-fasts', title: { az: 'Sünnə orucları', en: 'Sunnah fasts', ru: 'Желательные посты', ar: 'صيام التطوع', tr: 'Sünnet oruçlar' }, text: { az: 'Dərs', en: 'Lesson', ru: 'Урок', ar: 'درس', tr: 'Ders' } },
  { lesson: 'dhul-hijjah-ten', title: { az: 'Zülhiccənin 10 günü', en: 'The ten days of Dhul-Hijjah', ru: 'Десять дней Зуль-хиджа', ar: 'عشر ذي الحجة', tr: 'Zilhiccenin 10 günü' }, text: { az: 'Dərs', en: 'Lesson', ru: 'Урок', ar: 'درس', tr: 'Ders' } },
  { lesson: 'eid-prayer', title: { az: 'Bayram namazı', en: 'The Eid prayer', ru: 'Праздничный намаз', ar: 'صلاة العيد', tr: 'Bayram namazı' }, text: { az: 'Dərs', en: 'Lesson', ru: 'Урок', ar: 'درس', tr: 'Ders' } },
]

// v3.2: qarşıdakı hadisələr — kartlar + geri sayım (hicri il sərhədini də keçir)
const UP_TXT = {
  title: { az: 'Qarşıdakı günlər', en: 'Coming up', ru: 'Ближайшие дни', ar: 'الأيام القادمة', tr: 'Yaklaşan günler' },
  open: { az: 'Təqvimdə aç', en: 'Open in calendar', ru: 'Открыть в календаре', ar: 'افتح في التقويم', tr: 'Takvimde aç' },
}
/** Bu gündən ~13 ay irəli: hər hadisənin ən yaxın tarixi (ay başlanğıcları və təkrarlanan ağ günlər bir dəfə). */
function upcomingEvents(base, limit = 6) {
  const out = []
  let bidTaken = false
  const t0 = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12)
  for (let i = 0; i <= 400 && out.length < limit; i++) {
    const date = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() + i, 12)
    const h = hijriOf(date)
    for (const e of EVENTS) {
      if (e.month !== h.month - 1 || e.day !== h.day || e.type === 'month') continue
      if (e.bid) { if (bidTaken) continue; bidTaken = true }
      out.push({ e, date, days: i, hYear: h.year })
    }
  }
  return out.slice(0, limit)
}

// Növ filtri qrupunun ekran oxuyucu adı
const FILTER_LABEL = { az:'Hadisə növü', en:'Event type', ru:'Тип события', ar:'نوع الحدث', tr:'Olay türü' }

const NOTIFY_LABELS = {
  az: { remind:'Xatırlat', reminded:'Xatırladılacaq', today:'Bu gün!', upcoming:'Yaxınlaşır', removeReminder:'Ləğv et' },
  en: { remind:'Remind me', reminded:'Reminder set', today:'Today!', upcoming:'Upcoming', removeReminder:'Remove' },
  ru: { remind:'Напомнить', reminded:'Напоминание установлено', today:'Сегодня!', upcoming:'Скоро', removeReminder:'Удалить' },
  ar: { remind:'ذكرني', reminded:'تم التذكير', today:'اليوم!', upcoming:'قادم', removeReminder:'إلغاء' },
  tr: { remind:'Hatırlat', reminded:'Hatırlatma ayarlandı', today:'Bugün!', upcoming:'Yaklaşıyor', removeReminder:'Kaldır' },
}

// ═══ Hadisələrin izahı və hicri aylar bələdçisi ═══
// Mətnlər data/guides/CalendarPage.js-dədir (LessonBlocks formatı).

/** Saytdaxili keçid (SPA ilə; Ctrl-klik yeni tabda açır). variant: 'card' | 'chip' */
function GuideLink({ link, lang, variant = 'card' }) {
  const navigate = useNavigate()
  const href = link.kind === 'lesson' ? pathFor('learn', lang, link.slug) : pathFor(link.key, lang)
  const onClick = (e) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(href)
    window.scrollTo(0, 0)
  }
  const icon = link.kind === 'lesson' ? 'learn' : link.key
  if (variant === 'chip') {
    return (
      <a href={href} onClick={onClick} className="ui-chip cal-info-chip">
        <Icon name={icon} size={14} /> {pick(link.label, lang)}
      </a>
    )
  }
  return (
    <a href={href} onClick={onClick} className="ui-card ui-card--interactive cal-guide-link">
      <Icon name={icon} size={20} className="cal-guide-link__icon" />
      <span>{pick(link.label, lang)}</span>
      <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
    </a>
  )
}

/** Hadisə kartında açılan izah: Sünnədə olan / əsli olmayan + dəlil və keçidlər */
function EventInfo({ e, lang }) {
  const info = CAL_EVENT_INFO[eventInfoKey(e)]
  if (!info) return null
  const g = CAL_GUIDE_TXT
  return (
    <details className="cal-info">
      <summary className="cal-info__sum">
        <Icon name="info" size={14} /> <span>{pick(g.info, lang)}</span>
        <Icon name="chevronDown" size={14} className="cal-info__chev" />
      </summary>
      <div className="cal-info__body">
        <p className="cal-info__p"><strong className="cal-info__lbl">{pick(g.ok, lang)}.</strong> {pick(info.ok, lang)}</p>
        {info.no && <p className="cal-info__p cal-info__p--no"><strong className="cal-info__lbl cal-info__lbl--no">{pick(g.no, lang)}.</strong> {pick(info.no, lang)}</p>}
        {(info.url || info.links?.length > 0) && (
          <div className="cal-info__links">
            {info.url && (
              <a href={info.url} target="_blank" rel="noopener noreferrer nofollow" className="ui-chip cal-info-chip">
                <Icon name="external" size={14} /> {pick(g.fatwa, lang)}
              </a>
            )}
            {info.links?.map((l, i) => <GuideLink key={i} link={l} lang={lang} variant="chip" />)}
          </div>
        )}
      </div>
    </details>
  )
}

// Haram aylar: Məhərrəm, Rəcəb, Zülqədə, Zülhiccə (Tövbə 9:36; Buxari 3197)
const SACRED_MONTHS = new Set([0, 6, 10, 11])

/** "Hər ayda nə var" cədvəli — 12 ay kartı şəbəkəsi (cədvəlin məlumatı eynidir:
 *  ay | Sünnədə sabit olan | əsli olmayan). "—" boş xana kimi sakit göstərilir. */
function MonthCards({ b, lang }) {
  const [, okH, noH] = b.head.map(h => pick(h, lang))
  const cell = (c) => {
    const v = pick(c, lang).trim()
    return v && v !== '—' ? v : null
  }
  return (
    <ol className="cal-mcards cal-v4-flip" data-reveal="fade" aria-label={b.head.map(h => pick(h, lang)).join(' · ')}>
      {b.rows.map((r, i) => {
        const ok = cell(r[1])
        const no = cell(r[2])
        return (
          <li key={i} className={`cal-mcard${SACRED_MONTHS.has(i) ? ' is-sacred' : ''}`}>
            <div className="cal-mcard__head">
              <span className="cal-mcard__n ui-num" aria-hidden="true">{i + 1}</span>
              <h4 className="cal-mcard__name">{pick(r[0], lang)}</h4>
            </div>
            <dl className="cal-mcard__dl">
              <div className={`cal-mcard__row is-ok${ok ? '' : ' is-empty'}`}>
                <dt><Icon name="check" size={14} /> {okH}</dt>
                <dd>{ok || '—'}</dd>
              </div>
              <div className={`cal-mcard__row is-no${no ? '' : ' is-empty'}`}>
                <dt><Icon name="close" size={14} /> {noH}</dt>
                <dd>{no || '—'}</dd>
              </div>
            </dl>
          </li>
        )
      })}
    </ol>
  )
}

function MonthsGuide({ lang }) {
  const g = CAL_GUIDE_TXT
  const jump = (e, id) => {
    if (!isPlainClick(e)) return
    const el = document.getElementById(`cal-g-${id}`)
    if (!el) return
    e.preventDefault()
    el.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
    el.querySelector('.ls-sec__title')?.focus({ preventScroll: true })
  }
  return (
    <section className="ui-section cal-guide" aria-labelledby="cal-guide-title">
      <div className="ui-container cal-guide__inner">
        <div className="ui-section-head" data-reveal>
          <span className="ui-eyebrow">{pick(g.eyebrow, lang)}</span>
          <h2 id="cal-guide-title" className="ui-title">{pick(g.title, lang)}</h2>
          <p className="ui-lead">{pick(g.lead, lang)}</p>
        </div>

        <nav className="cal-guide-nav" aria-label={pick(g.contents, lang)}>
          <ul className="cal-guide-nav__list">
            {CAL_MONTHS_GUIDE.map(s => (
              <li key={s.id}>
                <a href={`#cal-g-${s.id}`} className="ui-chip cal-guide-nav__chip" onClick={(e) => jump(e, s.id)}>
                  <Icon name={s.icon} size={15} /> {pick(s.title, lang)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ls-article cal-guide__article">
          {CAL_MONTHS_GUIDE.map(s => (
            <section key={s.id} id={`cal-g-${s.id}`} className="ls-sec cal-guide__sec" aria-labelledby={`cal-g-${s.id}-h`}>
              <h3 id={`cal-g-${s.id}-h`} className="ls-sec__title" tabIndex={-1}>{pick(s.title, lang)}</h3>
              <LessonBlocks blocks={s.blocks.filter(b => b.t !== 'table' || b.rows?.length !== 12)} lang={lang} />
              {s.blocks.filter(b => b.t === 'table' && b.rows?.length === 12).map((b, i) => <MonthCards key={i} b={b} lang={lang} />)}
              {s.links?.length > 0 && (
                <div className="cal-guide__links">
                  {s.links.map((l, i) => <GuideLink key={i} link={l} lang={lang} />)}
                </div>
              )}
            </section>
          ))}
          <section className="ls-sec ui-card ui-card--sunken ls-sources" aria-labelledby="cal-g-sources-h">
            <h3 id="cal-g-sources-h" className="ls-sec__title" tabIndex={-1}>{pick(g.sources, lang)}</h3>
            <ul className="ls-sources__list">
              {CAL_SOURCES.map((r, i) => (
                <li key={i}>
                  <Icon name="external" size={15} />
                  <a href={r.url} target="_blank" rel="noopener noreferrer nofollow" dir="auto" lang={guessLang(r.label)}>{r.label}</a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </section>
  )
}

// v5.8: kamerada Ayın yeri (telefonda) — yalnız açılanda yüklənir
const HilalAR = lazy(() => import('../components/HilalAR'))
// v6.2: hilalın görünmə xəritəsi (Odeh meyarı) — bölməyə yaxınlaşanda
const CrescentVisibilityMap = lazy(() => import('../components/CrescentVisibilityMap'))
const LunarEclipses = lazy(() => import('../components/LunarEclipses'))
// lang-ok[Kamera,Kameranı,kamera,kamerada]: az dilinin öz sözüdür (kamera)
const HL_OBJ = { az: 'Ayı kamerada tap', en: 'Find the moon with the camera', ru: 'Найти луну камерой', ar: 'اعثر على القمر بالكاميرا', tr: 'Ayı kamerayla bul' }
// v6.2: eyni AR — Quranın adını çəkdiyi göy cisimləri (Ay, Günəş, əş-Şira) və ayələri
const SKY_OBJ = { az: 'Quranın səması', en: 'The sky of the Quran', ru: 'Небо Корана', ar: 'سماء القرآن', tr: 'Kur’an’ın göğü' }

export function CalendarPage({ setPage }) {
  const [hilal, setHilal] = useState(null)   // null | 'moon' | 'sky'
  const canAR = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && window.matchMedia?.('(pointer: coarse)').matches
  const { lang } = useLang()
  const t = pickUi(T, lang)?.calendar || T.az.calendar
  // Bugünkü hicri tarix state-lərdən əvvəl hesablanır ki, seçilmiş ay
  // miladi ay nömrəsi ilə yox, cari HİCRİ ayla açılsın
  const today = new Date()
  const todayKey = today.toDateString()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hijri = useMemo(() => hijriOf(new Date()), [todayKey])
  const [selMonth, setSelMonth] = useState(() => hijri.month - 1)
  const [monthDir, setMonthDir] = useState(1) // v6: ay keçidinin istiqaməti (PresenceSwap)
  // Pozuq yaddaş ({}, "x", null element) əvvəl səhifəni ağ ekrana çevirirdi (reminders.some xətası)
  const [reminders, setReminders] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('calendar_reminders'))
      return Array.isArray(raw)
        ? raw.filter(r => r && typeof r === 'object' && typeof r.key === 'string' && Number.isInteger(r.month) && Number.isInteger(r.day))
          // təqvimdən çıxarılmış hadisələrin (məs. Merac/Bərat gecəsi) köhnə xatırladıcıları atılır
          .filter(r => EVENTS.some(e => e.month === r.month && e.day === r.day))
        : []
    } catch { return [] }
  })
  const nl = pickUi(NOTIFY_LABELS, lang, 'en')

  const toggleReminder = useCallback((e) => {
    const key = `${e.month}-${e.day}`
    setReminders(prev => {
      const exists = prev.some(r => r.key === key)
      let next
      if (exists) {
        next = prev.filter(r => r.key !== key)
      } else {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          try { Notification.requestPermission()?.catch?.(() => {}) } catch { /* köhnə brauzer */ }
        }
        next = [...prev, { key, month: e.month, day: e.day, name: pickUi(e, lang, 'en') }]
      }
      try { localStorage.setItem('calendar_reminders', JSON.stringify(next)) } catch { /* yaddaş bağlıdır */ }
      return next
    })
  }, [lang])

  const isReminded = useCallback((e) => {
    const key = `${e.month}-${e.day}`
    return reminders.some(r => r.key === key)
  }, [reminders])

  // Check for today's reminders and show notifications
  useEffect(() => {
    if (reminders.length === 0) return
    const hijriToday = hijriOf(new Date())
    reminders.forEach(r => {
      // month in EVENTS is 0-indexed, hijri.month is 1-indexed
      if (r.month === (hijriToday.month - 1) && r.day === hijriToday.day) {
        // icon URL olmalıdır (əvvəl emoji idi). Android-də `new Notification()` xəta atır və
        // effektdə tutulmamış xəta bütün tətbiqi söndürürdü — utils/notify.js təhlükəsizdir.
        showLocalNotification(String(r.name || ''), { body: nl.today, icon: '/android-chrome-192x192.png' })
      }
    })
  // Yalnız açılışda bir dəfə — xatırlatma dəyişəndə təkrar bildiriş göndərilməsin
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Telefonda aylar üfüqi zolaqdadır — seçilmiş ay görünmürsə zolağı ora
  // sürüşdür (yalnız zolağın özü; səhifə yerində qalır)
  const monthsRef = useRef(null)
  const monthsScrolled = useRef(false)
  useEffect(() => {
    const strip = monthsRef.current
    if (!strip || strip.scrollWidth <= strip.clientWidth + 1) return
    const chip = strip.querySelector('.cal-month-btn.active')
    if (!chip) return
    const s = strip.getBoundingClientRect()
    const c = chip.getBoundingClientRect()
    // İlk açılışda animasiyasız, sonrakı seçimlərdə yumşaq sürüşmə
    let smooth = monthsScrolled.current
    monthsScrolled.current = true
    if (c.left >= s.left + 8 && c.right <= s.right - 8) return
    try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) smooth = false } catch { /* köhnə brauzer */ }
    const left = strip.scrollLeft + (c.left - s.left) - (s.width - c.width) / 2
    if (typeof strip.scrollTo === 'function') strip.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' })
    else strip.scrollLeft = left
  }, [selMonth])

  const onToggleReminder = (e) => { haptic(); toggleReminder(e) }

  const [typeFilter, setTypeFilter] = useState('all')
  const ct = pickUi(CAL_TXT, lang, 'en')
  const cx = pickUi(CAL_X, lang, 'en')

  // ── Ay şəbəkəsi: seçilmiş hicri ayın günləri ──
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const yearDays = useMemo(() => buildHijriYear(hijri.year, new Date()), [hijri.year, todayKey])
  const monthDays = yearDays[selMonth] || []
  const isCurMonth = selMonth === hijri.month - 1
  // Seçilmiş gün: cari ayda — bu gün; başqa ayda — hadisəli ilk gün və ya 1
  const [selDay, setSelDay] = useState(() => hijri.day)
  const pickMonth = (i) => {
    const m = ((i % 12) + 12) % 12
    setMonthDir(i >= selMonth ? 1 : -1)
    setSelMonth(m)
    const first = EVENTS.find(e => e.month === m)
    setSelDay(m === hijri.month - 1 ? hijri.day : (first ? first.day : 1))
  }
  // Ayın ilk gününün həftə günü (bazar ertəsi = 0) — şəbəkədə boş xanalar
  const lead = monthDays.length ? (monthDays[0].date.getDay() + 6) % 7 : 0
  const selDayInfo = monthDays.find(d => d.day === selDay) || null
  const dayEvents = EVENTS.filter(e => e.month === selMonth && e.day === selDay)
  const hijriMonthNames = pickUi(HIJRI_MONTHS, lang, 'en')
  const hijriStr = `${hijri.day} ${hijriMonthNames[hijri.month - 1]} ${hijri.year}`
  const yearSuffix = pickUi(HIJRI_SUFFIX, lang, 'en')
  // Hadisə tarixi: "1 Məhərrəm" (bütün dillərdə gün əvvəl — tarix kartı ilə eyni)
  const eventDate = (e) => `${e.day} ${hijriMonthNames[e.month]}`

  // Növbəti hadisəyə geri sayım
  const nextEvent = useMemo(() => {
    const hm = hijri.month - 1
    const hd = hijri.day
    for (const e of EVENTS) {
      if (e.month > hm || (e.month === hm && e.day > hd)) return e
    }
    return EVENTS[0] // növbəti il
  }, [hijri])

  // Növbəti hadisəyə neçə gün qalıb (bu hicri ildədirsə)
  const nextInfo = nextEvent ? (yearDays[nextEvent.month] || []).find(d => d.day === nextEvent.day) : null
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12)
  const daysLeft = nextInfo ? Math.round((nextInfo.date - t0) / 86400000) : null

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const upList = useMemo(() => upcomingEvents(new Date()), [todayKey])
  const openEvent = (u) => {
    if (u.hYear !== hijri.year) return
    pickMonth(u.e.month); setSelDay(u.e.day)
    document.querySelector('.cal-main')?.scrollIntoView({ block: 'start', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  const monthEvents = EVENTS.filter(e => e.month === selMonth && (typeFilter === 'all' || e.type === typeFilter))

  const TYPE_LABELS = {
    all:    { az:'Hamısı',     en:'All',        ru:'Все',       ar:'الكل',     tr:'Tümü' },
    major:  { az:'Əsas',       en:'Major',      ru:'Основные',  ar:'رئيسية',   tr:'Büyük' },
    night:  { az:'Gecələr',    en:'Nights',     ru:'Ночи',      ar:'ليالي',    tr:'Geceler' },
    sunnah: { az:'Sünnə',      en:'Sunnah',     ru:'Сунна',     ar:'سنة',      tr:'Sünnet' },
    hajj:   { az:'Həcc',       en:'Hajj',       ru:'Хадж',      ar:'حج',       tr:'Hac' },
  }
  const tl = lang && TYPE_LABELS.all[lang] ? lang : 'en'

  return (
    <>
      <header className="ui-page-hero ui-page-hero--split cal-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <Breadcrumb setPage={setPage} current={t.title} />
            <span className="ui-eyebrow">{(pickUi(HERO_SUBTITLE, lang, 'en'))(hijri.year)}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{ct.lead}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} /> {cx.how}</p>
          </div>
          <div className="ui-page-hero__aside">
            <div className="cal-today ui-card" data-reveal="zoom">
              <span className="cal-date-label">{ct.today} · {t.hijriDate}</span>
              <span className="cal-today-h">{hijriStr}</span>
              <span className="cal-today-g">{t.gregorianDate}: {formatGregorian(today, lang)}</span>
              {nextEvent && (
                <div className="cal-next-event">
                  <span className="cal-next-icon ui-icon-tile" aria-hidden="true"><Icon name={TYPE_ICONS[nextEvent.type] || 'calendar'} /></span>
                  <div className="cal-next-info">
                    <div className="cal-next-label">{ct.next}{daysLeft != null && <> · <b className="ui-num">{cx.daysLeft(daysLeft)}</b></>}</div>
                    <div className="cal-next-name">{pickUi(nextEvent, lang, 'en')}</div>
                    <div className="cal-next-date">{eventDate(nextEvent)}{nextInfo ? ` · ${formatGregorian(nextInfo.date, lang)}` : ''}</div>
                  </div>
                  {/* Təqvimdə həmin ayı və günü aç */}
                  <button type="button" className="ui-icon-btn cal-next-go"
                    aria-label={`${ct.next}: ${eventDate(nextEvent)}`}
                    onClick={() => { pickMonth(nextEvent.month); setSelDay(nextEvent.day); document.querySelector('.cal-main')?.scrollIntoView({ block: 'start' }) }}>
                    <Icon name="arrow" className="ui-flip-rtl" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="ui-section cal-page">
        <div className="ui-container">
          {/* Tarix çevirici — /hijri-converter */}
          <div className="cal-convert">
            <GuideLink link={CAL_HIJRI_LINK} lang={lang} />
          </div>

          {/* v3.2: qarşıdakı hadisələr — geri sayımlı kartlar */}
          {upList.length > 0 && (
            <section className="cal-up" aria-labelledby="cal-up-title" data-testid="cal-upcoming" data-reveal="fade">
              <h2 id="cal-up-title" className="cal-up__title"><Icon name="clock" size={18} /> {pickUi(UP_TXT.title, lang, 'en')}</h2>
              <ol className="cal-up__list tm-cascade">
                {upList.map((u, i) => {
                  const inYear = u.hYear === hijri.year
                  const Tag = inYear ? 'button' : 'div'
                  return (
                    <li key={`${u.e.month}-${u.e.day}-${i}`}>
                      <Tag {...(inYear ? { type: 'button', onClick: () => openEvent(u) } : {})}
                        className={`ui-card cal-up__card${TYPE_ACCENT[u.e.type] ? ' is-major' : ''}${inYear ? ' ui-card--interactive' : ''}`} data-type={u.e.type}>
                        <span className="cal-up__top">
                          <span className={`ui-icon-tile ui-icon-tile--sm${TYPE_ACCENT[u.e.type] ? ' ui-icon-tile--accent' : ''}`} aria-hidden="true"><Icon name={TYPE_ICONS[u.e.type] || 'calendar'} /></span>
                          <span className={`ui-badge cal-up__cd${u.days <= 7 ? ' ui-badge--brand' : ''}`}><span className="ui-num">{cx.daysLeft(u.days)}</span></span>
                        </span>
                        <span className="cal-up__name">{pickUi(u.e, lang, 'en')}</span>
                        <span className="cal-up__date">
                          <span>{eventDate(u.e)} {u.hYear}</span>
                          <span>{weekdayName(u.date, lang)}, {formatGregorian(u.date, lang)}</span>
                        </span>
                        {inYear && <span className="ui-sr-only"> — {pickUi(UP_TXT.open, lang, 'en')}</span>}
                      </Tag>
                    </li>
                  )
                })}
              </ol>
            </section>
          )}

          {/* Növ filtri — telefonda bir sətirlik sürüşən çiplər (.chip-scroll) */}
          {/* Aylar: masaüstündə 6 × 2 şəbəkə, telefonda üfüqi zolaq */}
          {/* v5.6: Hicri il təkəri — 12 ay, haram aylar, əsas hadisələr, "bu gün" əqrəbi */}
          <HijriYearWheel lang={lang} today={hijri} selMonth={selMonth} monthNames={hijriMonthNames}
            lengths={yearDays.map(m => m.length)} onPick={pickMonth}
            events={EVENTS.filter(e => e.type === 'major' || e.type === 'night' || (e.month === 0 && e.day === 10))
              .map(e => ({ month: e.month, day: e.day, type: e.type === 'night' ? 'night' : 'major', label: pickUi(e, lang, 'en') }))} />
          <div className="cal-months chip-scroll wrap-desktop" ref={monthsRef} data-reveal="stagger-fade" role="group" aria-label={cx.monthsLabel}>
            {hijriMonthNames.map((m, i) => {
              const nEv = EVENTS.filter(e => e.month === i).length
              const hasEvent = nEv > 0
              const len = (yearDays[i] || []).length
              const isCurrent = i === hijri.month - 1
              return (
                <button key={i} type="button"
                  className={`cal-month-btn ${selMonth===i?'active':''} ${isCurrent?'current':''}`}
                  onClick={() => pickMonth(i)}
                  aria-pressed={selMonth === i}
                  aria-current={isCurrent ? 'date' : undefined}
                  title={m}>
                  <span className="cal-month-top">
                    <span className="cal-month-i ui-num" aria-hidden="true">{i + 1}</span>
                    <span className="cal-month-label">{m}</span>
                  </span>
                  <span className="cal-month-meta ui-num">
                    {len > 0 && <span>{cx.days(len)}</span>}
                    {hasEvent && <span className="cal-month-ev"><span className="cal-event-dot" aria-hidden="true" />{nEv}<span className="ui-sr-only"> — {cx.events(nEv)}</span></span>}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="cal-main ui-card" data-reveal>
            <div className="cal-selected-month">
              <button type="button" className="ui-icon-btn cal-nav-btn" onClick={() => pickMonth(selMonth - 1)} aria-label={ct.prev}>
                <Icon name="chevronLeft" className="ui-flip-rtl" />
              </button>
              <div className="cal-selected-title">
                <h2 key={selMonth} className="cal-month-name">{hijriMonthNames[selMonth]}</h2>
                <span className="cal-month-num ui-num">{selMonth + 1} / 12 · {hijri.year} {yearSuffix}</span>
              </div>
              <button type="button" className="ui-icon-btn cal-nav-btn" onClick={() => pickMonth(selMonth + 1)} aria-label={ct.nextMonth}>
                <Icon name="chevron" className="ui-flip-rtl" />
              </button>
            </div>

            <div className="cal-main-grid">
            <div className="cal-main-cal">
            {/* Ayın günləri: iri hicri gün + kiçik miladi tarix; hadisəli gün —
                qızılı nöqtə, bu gün — halqa, seçilmiş — dolğu (key: ay dəyişəndə
                şəbəkə yenidən görünür) */}
            {monthDays.length > 0 && (
              <div className="cal-grid-wrap">
                <div className="cal-weekdays" aria-hidden="true">
                  {(pickUi(WEEKDAYS, lang, 'en')).map((w, i) => <span key={i} className={i === 4 ? 'is-fri' : ''}>{w}</span>)}
                </div>
                {/* v6: köhnə ay qısa çıxır, yenisi istiqamətlə gəlir (PresenceSwap); günlərin çevrilməsi CSS-dədir */}
                <PresenceSwap swapKey={selMonth} variant="slide" dir={monthDir} className="cal-grid cal-grid--mo" role="group" aria-label={`${hijriMonthNames[selMonth]} ${hijri.year}`}>
                  {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} className="cal-day is-blank" aria-hidden="true" />)}
                  {monthDays.map(({ day, date }, di) => {
                    const evs = EVENTS.filter(e => e.month === selMonth && e.day === day)
                    const isToday = isCurMonth && day === hijri.day
                    const sel = day === selDay
                    // Ağ günlər (13–15) — Zülhiccənin 13-ü təşriq günüdür (oruc qadağandır)
                    const bid = day >= 13 && day <= 15 && !(selMonth === 11 && day === 13)
                    return (
                      <button key={day} type="button"
                        className={`cal-day${isToday ? ' is-today' : ''}${sel ? ' is-selected' : ''}${evs.length ? ' has-event' : ''}${evs.some(e => TYPE_ACCENT[e.type]) ? ' is-major' : ''}${bid ? ' is-bid' : ''}`}
                        aria-pressed={sel} style={{ '--i': lead + di }}
                        aria-current={isToday ? 'date' : undefined}
                        onClick={() => { haptic(); setSelDay(day) }}>
                        {/* Ad məzmundan qurulur: görünən rəqəmlər adın içində qalır (WCAG 2.5.3),
                            ay adı, il və hadisələr yalnız ekran oxuyucusu üçündür */}
                        <span className="cal-day-h ui-num">{day}</span>
                        <span className="ui-sr-only"> {hijriMonthNames[selMonth]} — </span>
                        <span className="cal-day-g">{shortGregorian(date, lang)}</span>
                        <span className="ui-sr-only"> {date.getFullYear()}{evs.length ? ` — ${evs.map(e => pickUi(e, lang, 'en')).join(', ')}` : ''}</span>
                        {evs.length > 0 && <span className="cal-day-dot" aria-hidden="true" />}
                        <CalDayMoon date={date} />
                      </button>
                    )
                  })}
                </PresenceSwap>
                <CalCrescent days={monthDays} lang={lang} />
                {canAR && (
                  <span className="cal-hilal-row">
                    <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm cal-hilal-btn" onClick={() => setHilal('moon')} data-testid="hilal-open">
                      <Icon name="moonStar" className="ui-btn__icon" /> {pickUi(HL_OBJ, lang)}
                    </button>
                    <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm cal-hilal-btn" onClick={() => setHilal('sky')} data-testid="sky-open">
                      <Icon name="sparkle" className="ui-btn__icon" /> {pickUi(SKY_OBJ, lang)}
                    </button>
                  </span>
                )}
                {hilal && <Suspense fallback={null}><HilalAR lang={lang} mode={hilal} onClose={() => setHilal(null)} /></Suspense>}
              </div>
            )}

            </div>
            <div className="cal-main-side">
            {/* Seçilmiş gün */}
            {selDayInfo && (
              <div className="cal-day-panel" key={`${selMonth}-${selDay}`}>
                <div className="cal-day-panel-date">
                  <span className="cal-day-panel-h">{selDay} {hijriMonthNames[selMonth]} {hijri.year}</span>
                  <span className="cal-day-panel-g">{formatGregorian(selDayInfo.date, lang)}</span>
                  {isCurMonth && selDay === hijri.day && <span className="ui-badge ui-badge--brand">{ct.today}</span>}
                </div>
                <CalMoonNote date={selDayInfo.date} lang={lang} name={(k) => pickUi(MOON_NAMES, lang, 'en')[k]}
                  isBid={selDay >= 13 && selDay <= 15 && !(selMonth === 11 && selDay === 13)} />
                {dayEvents.length === 0 && <p className="cal-day-panel-empty">{ct.noDay}</p>}
              </div>
            )}

            {/* Növ filtri — ayın hadisələrini süzür; telefonda sürüşən çiplər */}
            <div className="cal-type-filter chip-scroll wrap-desktop" role="group" aria-label={pickUi(FILTER_LABEL, lang, 'en')}>
              {Object.keys(TYPE_LABELS).map(k => (
                <button key={k} type="button" className="ui-chip"
                  aria-pressed={typeFilter === k} onClick={() => setTypeFilter(k)}>
                  {TYPE_LABELS[k][tl]}
                </button>
              ))}
            </div>

            {/* key: ay dəyişəndə hadisələr yenidən yumşaq görünür */}
            {monthEvents.length > 0 ? (
              <div className="cal-events" key={`${selMonth}-${typeFilter}`}>
                <div className="cal-events-label">{t.events}</div>
                {monthEvents.map((e, i) => {
                  const reminded = isReminded(e)
                  return (
                    <div key={i} className={`cal-event-card${e.day === selDay ? ' is-selected' : ''}`} data-type={e.type}>
                      <span className={`cal-event-icon ui-icon-tile ui-icon-tile--sm${TYPE_ACCENT[e.type] ? ' ui-icon-tile--accent' : ''}`} aria-hidden="true"><Icon name={TYPE_ICONS[e.type] || 'calendar'} /></span>
                      <div className="cal-event-body">
                        <div className="cal-event-name">{pickUi(e, lang, 'en')}</div>
                        <div className="cal-event-date">{eventDate(e)}</div>
                        <EventInfo e={e} lang={lang} />
                      </div>
                      <button type="button" className={`cal-remind-btn ${reminded ? 'active' : ''}`} onClick={() => onToggleReminder(e)}
                        aria-pressed={reminded} aria-label={`${reminded ? nl.reminded : nl.remind}: ${pickUi(e, lang, 'en')}`}>
                        <Icon name={reminded ? 'bell' : 'bellOff'} size={16} />
                        <span>{reminded ? nl.reminded : nl.remind}</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="cal-no-events" key={`${selMonth}-${typeFilter}`}>
                {/* Telefonda boş vəziyyət ikonu (masaüstündə gizli) */}
                <span className="cal-no-events-ico ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral" aria-hidden="true"><Icon name="calendar" /></span>
                <span>{t.noEvents}</span>
              </div>
            )}
            </div>
            </div>
          </div>

          {/* All events list */}
          <div className="cal-all-events">
            <div className="ui-section-head cal-all-head" data-reveal>
              <span className="ui-eyebrow">{hijri.year} {yearSuffix}</span>
              <h2 className="ui-title">{ct.all}</h2>
              <p className="cal-approx">{ct.approx}</p>
            </div>
            {/* Hadisələr — aylar üzrə zaman xətti; keçmiş hadisələr solğun */}
            <div className="cal-tl-groups" data-reveal="stagger">
              {hijriMonthNames.map((mName, mi) => {
                const list = EVENTS.filter(e => e.month === mi)
                if (!list.length) return null
                const isCurM = mi === hijri.month - 1
                return (
                  <section key={mi} className={`cal-tl-group${isCurM ? ' is-current' : ''}`} aria-labelledby={`cal-tl-m${mi}`}>
                    <h3 id={`cal-tl-m${mi}`} className="cal-tl-month"><span className="ui-num">{mi + 1}</span> {mName}</h3>
                    <ul className="cal-timeline">
                      {list.map((e) => {
                        const reminded = isReminded(e)
                        const past = e.month < hijri.month - 1 || (e.month === hijri.month - 1 && e.day < hijri.day)
                        return (
                          <li key={`${e.month}-${e.day}`} className={`cal-timeline-item${past ? ' is-past' : ''}${TYPE_ACCENT[e.type] ? ' is-major' : ''}`}>
                            <button type="button" className="cal-tl-main" onClick={() => { pickMonth(e.month); setSelDay(e.day); monthsRef.current?.scrollIntoView?.({ block: 'nearest' }) }}>
                              <span className="cal-tl-day ui-num" aria-hidden="true">{e.day}</span>
                              <span className="cal-tl-body">
                                <span className="cal-tl-name">{pickUi(e, lang, 'en')}</span>
                                <span className="cal-tl-date">{eventDate(e)} {hijri.year}</span>
                              </span>
                            </button>
                            <button type="button" className={`cal-remind-btn ${reminded ? 'active' : ''}`} onClick={() => onToggleReminder(e)}
                              aria-pressed={reminded} aria-label={`${reminded ? nl.reminded : nl.remind}: ${pickUi(e, lang, 'en')}`}>
                              <Icon name={reminded ? 'bell' : 'bellOff'} size={16} />
                              <span>{reminded ? nl.reminded : nl.remind}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <DeferRender height="760px" idle={false} rootMargin="400px 0px">
        <Suspense fallback={<div style={{ minHeight: 760 }} />}>
          <CrescentVisibilityMap lang={lang} />
        </Suspense>
      </DeferRender>

      {/* v6.5: Ay tutulmaları — NASA vaxtları, şəhərinizdən görünmə; küsuf dərsinə keçid */}
      <DeferRender height="720px" idle={false} rootMargin="400px 0px">
        <Suspense fallback={<div style={{ minHeight: 720 }} />}>
          <LunarEclipses lang={lang} lessonHref={pathFor('learn', lang, 'kusuf-prayer')} />
        </Suspense>
      </DeferRender>

      {/* v3.2: sünnə oruc günləri, oruc qeydi və Ramazan qəzası */}
      <CalSunnahFasts lang={lang} hijriOf={hijriOf} monthNames={hijriMonthNames} />

      {/* Hicri aylar: haram aylar, hilal, hər ayın Sünnəsi və əsli olmayan adətlər */}
      <MonthsGuide lang={lang} />
      <RelatedLinks items={CAL_RELATED} lang={lang} id="cal-related" />
    </>
  )
}
