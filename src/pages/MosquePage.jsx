// ═══════════════════════════════════════════════════════
// Məscid haqqında — /mosque
//
// Bütün məlumat src/config/mosque.js-dən (MOSQUE) oxunur. Bu REAL bir
// məsciddir: heç bir blok uydurma məlumatla doldurulmur. Sahə boşdursa
// (filled() === false) həmin element ümumiyyətlə göstərilmir; bütöv bölmə
// boş qalanda isə bir sakit "tezliklə" sətri çıxır.
// ═══════════════════════════════════════════════════════

import { useLang } from '../contexts/LangContext'
import { BRAND, MOSQUE, filled, tr, brandName } from '../config/mosque'
import useMosqueTimes, { PRAYER_NAMES } from '../hooks/useMosqueTimes'
import '../styles/MosquePage.css'
import Breadcrumb from '../components/Breadcrumb'

// ── Bugünkü vaxtlar kartı ──
// Sol sütun yalnız tarixçədən ibarət olanda sağdakı əlaqə + xəritə kartlarının
// yanında böyük boşluq qalırdı. Bu kart onu real, hər gün yenilənən məlumatla
// doldurur: məscidin koordinatına görə azan və camaat vaxtları, növbəti cümə.
// note — azan vaxtlarının hesablandığı (useMosqueTimes qaydası: "hesablanmış"
// kimi qeyd olunmalıdır); rule — camaat vaxtlarının azana görə təyin olunduğu.
const TODAY_LABELS = {
  az: { title: 'Bugünkü namaz vaxtları', prayer: 'Namaz', adhan: 'Azan', jamaat: 'Camaat', next: 'Növbəti', jumua: 'Cümə namazı', today: 'bu gün', all: 'Bütün vaxtlar', loading: 'Yüklənir…', error: 'Vaxtları yükləmək alınmadı.',
    note: 'Azan vaxtları məscidin koordinatına görə aladhan.com ilə hesablanıb.', calc: 'Azan vaxtları aladhan.com ilə hesablanıb.', rule: 'Camaat vaxtları azan vaxtına görə müəyyən edilir.' },
  en: { title: "Today's prayer times", prayer: 'Prayer', adhan: 'Adhan', jamaat: 'Congregation', next: 'Next', jumua: 'Friday prayer', today: 'today', all: 'All times', loading: 'Loading…', error: 'Could not load the times.',
    note: 'Adhan times are calculated for the mosque’s coordinates via aladhan.com.', calc: 'Adhan times are calculated via aladhan.com.', rule: 'Congregation times are set from the adhan times.' },
  ru: { title: 'Время намаза сегодня', prayer: 'Намаз', adhan: 'Азан', jamaat: 'Джамаат', next: 'Следующий', jumua: 'Пятничный намаз', today: 'сегодня', all: 'Всё расписание', loading: 'Загрузка…', error: 'Не удалось загрузить время.',
    note: 'Время азана рассчитано по координатам мечети через aladhan.com.', calc: 'Время азана рассчитано через aladhan.com.', rule: 'Время джамаата определяется по времени азана.' },
  tr: { title: 'Bugünkü namaz vakitleri', prayer: 'Namaz', adhan: 'Ezan', jamaat: 'Cemaat', next: 'Sıradaki', jumua: 'Cuma namazı', today: 'bugün', all: 'Tüm vakitler', loading: 'Yükleniyor…', error: 'Vakitler yüklenemedi.',
    note: 'Ezan vakitleri caminin koordinatlarına göre aladhan.com ile hesaplanmıştır.', calc: 'Ezan vakitleri aladhan.com ile hesaplanmıştır.', rule: 'Cemaat vakitleri ezan vaktine göre belirlenir.' },
  ar: { title: 'مواقيت الصلاة اليوم', prayer: 'الصلاة', adhan: 'الأذان', jamaat: 'الجماعة', next: 'التالية', jumua: 'صلاة الجمعة', today: 'اليوم', all: 'كل المواقيت', loading: 'جارٍ التحميل…', error: 'تعذّر تحميل المواقيت.',
    note: 'أوقات الأذان محسوبة وفق إحداثيات المسجد عبر aladhan.com.', calc: 'أوقات الأذان محسوبة عبر aladhan.com.', rule: 'تُحدَّد أوقات الجماعة بحسب وقت الأذان.' },
}

// Cümə tarixi dilə uyğun ("25 sentyabr", "25 September", "25 سبتمبر").
// Chrome-un yığcam ICU-sunda "az" lokalı yoxdur — azərbaycanca əl ilə yazılır.
const AZ_MONTHS = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avqust','sentyabr','oktyabr','noyabr','dekabr']
const DATE_LOCALES = { en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-u-ca-gregory-nu-latn' }

/** 'DD-MM-YYYY' → "gün ay" (ilsiz). */
function formatDayMonth(dateKey, lang) {
  const [d, m, y] = String(dateKey || '').split('-').map(Number)
  if (!d || !m || !y) return ''
  if (lang === 'az') return `${d} ${AZ_MONTHS[m - 1]}`
  const date = new Date(Date.UTC(y, m - 1, d, 12))
  const opts = { day: 'numeric', month: 'long', timeZone: 'UTC' }
  try {
    return date.toLocaleDateString(DATE_LOCALES[lang] || 'en-GB', opts)
  } catch {
    return date.toLocaleDateString('en-GB', opts)
  }
}

const isRelRule = (rule) => /^\+\d{1,3}$/.test(String(rule || '').trim())

function MosqueTodayCard({ lang, setPage }) {
  const L = TODAY_LABELS[lang] || TODAY_LABELS.en
  const { loading, error, prayers, next, nextJumua, exact } = useMosqueTimes()
  const rows = (prayers || []).filter(p => p.key !== 'sunrise')
  const jumuaDate = nextJumua?.date
    ? (nextJumua.isToday ? L.today : formatDayMonth(nextJumua.date, lang))
    : ''
  // Camaat qaydası "+N" (azandan sonra) olan sətir varsa, bunu açıq deyirik
  const anyRelative = rows.some(p => filled(p.jamaat) && isRelRule(p.rule))

  return (
    <section className="msq-card msq-times" data-reveal aria-labelledby="msq-times-title">
      <h2 id="msq-times-title" className="msq-card-title">{L.title}</h2>

      {/* Yüklənərkən — cədvəlin yerində parıltılı skelet (yazı yox, sıçrayış yox) */}
      {loading && (
        <div className="msq-times-skel" aria-busy="true">
          <span className="msq-sr">{L.loading}</span>
          {[0, 1, 2, 3, 4].map(i => (
            <span key={i} className="skeleton msq-times-skel-row" aria-hidden="true" />
          ))}
        </div>
      )}
      {!loading && error && <p className="msq-muted">{L.error}</p>}

      {!loading && !error && rows.length > 0 && (
        <table className="msq-times-table">
          <thead>
            <tr><th scope="col">{L.prayer}</th><th scope="col">{L.adhan}</th><th scope="col">{L.jamaat}</th></tr>
          </thead>
          <tbody>
            {rows.map(p => {
              // İşadan sonra "növbəti" sabahın sübhüdür — bugünkü (keçmiş) sübh sətri işarələnmir
              const isNext = !!next && !next.tomorrow && next.key === p.key
              return (
                <tr key={p.key} className={isNext ? 'is-next' : undefined}>
                  <th scope="row">
                    {PRAYER_NAMES[p.key]?.[lang] || PRAYER_NAMES[p.key]?.az}
                    {isNext && <span className="msq-next-chip">{L.next}</span>}
                  </th>
                  <td>{p.adhan}</td>
                  <td className="msq-times-jamaat">{p.jamaat || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {nextJumua?.time && (
        <div className="msq-times-jumua">
          <span>🕌 {L.jumua}{jumuaDate ? ` · ${jumuaDate}` : ''}</span>
          <strong>{nextJumua.time}</strong>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <p className="msq-times-note">
          {exact ? L.note : L.calc}{anyRelative ? ` ${L.rule}` : ''}
        </p>
      )}

      <button type="button" className="msq-times-more press" onClick={() => setPage('jamaat')}>
        {L.all} <span aria-hidden="true">{lang === 'ar' ? '←' : '→'}</span>
      </button>
    </section>
  )
}

const LABELS = {
  az: {
    title: 'Məscid haqqında',
    history: 'Tarixçə', historySoon: 'Məscidin tarixçəsi tezliklə əlavə olunacaq.', founded: 'Tikilmə ili',
    imam: 'İmam', services: 'Xidmətlər',
    contact: 'Əlaqə', address: 'Ünvan', location: 'Yerləşmə', phone: 'Telefon', whatsapp: 'WhatsApp', email: 'E-poçt',
    contactSoon: 'Əlaqə məlumatları tezliklə əlavə olunacaq.',
    map: 'Xəritə', mapTitle: 'Məscidin xəritədə yeri', directions: 'Yol tarifi', openMap: 'Xəritədə aç',
    social: 'Sosial şəbəkələr',
    onSite: 'Saytda', onSiteSub: 'Saytın faydalı bölmələri',
    links: {
      jamaat:        ['Namaz və camaat vaxtları', 'Bugünkü namaz vaxtları'],
      announcements: ['Elanlar', 'Xəbərlər və elanlar'],
      donate:        ['İanə', 'Məscidə necə dəstək olmaq olar'],
      prayerguide:   ['Namaz bələdçisi', 'Namazı addım-addım öyrən'],
      quran:         ['Qurani-Kərim', 'Surələri oxu'],
    },
  },
  en: {
    title: 'About the Mosque',
    history: 'History', historySoon: 'The mosque’s history will be added soon.', founded: 'Built in',
    imam: 'Imam', services: 'Services',
    contact: 'Contact', address: 'Address', location: 'Location', phone: 'Phone', whatsapp: 'WhatsApp', email: 'Email',
    contactSoon: 'Contact details will be added soon.',
    map: 'Map', mapTitle: 'The mosque’s location on the map', directions: 'Get directions', openMap: 'Open in Maps',
    social: 'Social media',
    onSite: 'On this website', onSiteSub: 'Useful sections of the site',
    links: {
      jamaat:        ['Prayer & congregation times', 'Today’s prayer times'],
      announcements: ['Announcements', 'News and announcements'],
      donate:        ['Donate', 'How to support the mosque'],
      prayerguide:   ['Prayer guide', 'Learn to pray step by step'],
      quran:         ['The Holy Quran', 'Read the surahs'],
    },
  },
  ru: {
    title: 'О мечети',
    history: 'История', historySoon: 'История мечети скоро будет добавлена.', founded: 'Год постройки',
    imam: 'Имам', services: 'Услуги',
    contact: 'Контакты', address: 'Адрес', location: 'Расположение', phone: 'Телефон', whatsapp: 'WhatsApp', email: 'Эл. почта',
    contactSoon: 'Контактные данные скоро будут добавлены.',
    map: 'Карта', mapTitle: 'Мечеть на карте', directions: 'Проложить маршрут', openMap: 'Открыть на карте',
    social: 'Соцсети',
    onSite: 'На сайте', onSiteSub: 'Полезные разделы сайта',
    links: {
      jamaat:        ['Время намаза и джамаата', 'Время намаза на сегодня'],
      announcements: ['Объявления', 'Новости и объявления'],
      donate:        ['Пожертвование', 'Как поддержать мечеть'],
      prayerguide:   ['Как совершать намаз', 'Пошаговое руководство'],
      quran:         ['Священный Коран', 'Читать суры'],
    },
  },
  ar: {
    title: 'عن المسجد',
    history: 'نبذة تاريخية', historySoon: 'سيُضاف تاريخ المسجد قريبًا.', founded: 'سنة البناء',
    imam: 'الإمام', services: 'الخدمات',
    contact: 'التواصل', address: 'العنوان', location: 'المكان', phone: 'الهاتف', whatsapp: 'واتساب', email: 'البريد الإلكتروني',
    contactSoon: 'ستُضاف بيانات التواصل قريبًا.',
    map: 'الخريطة', mapTitle: 'موقع المسجد على الخريطة', directions: 'الاتجاهات', openMap: 'افتح في الخرائط',
    social: 'وسائل التواصل الاجتماعي',
    onSite: 'على الموقع', onSiteSub: 'أقسام مفيدة في الموقع',
    links: {
      jamaat:        ['مواقيت الصلاة والجماعة', 'مواقيت صلاة اليوم'],
      announcements: ['الإعلانات', 'الأخبار والإعلانات'],
      donate:        ['التبرع', 'كيف تدعم المسجد'],
      prayerguide:   ['دليل الصلاة', 'تعلّم الصلاة خطوة بخطوة'],
      quran:         ['القرآن الكريم', 'اقرأ السور'],
    },
  },
  tr: {
    title: 'Cami hakkında',
    history: 'Tarihçe', historySoon: 'Caminin tarihçesi yakında eklenecek.', founded: 'Yapım yılı',
    imam: 'İmam', services: 'Hizmetler',
    contact: 'İletişim', address: 'Adres', location: 'Konum', phone: 'Telefon', whatsapp: 'WhatsApp', email: 'E-posta',
    contactSoon: 'İletişim bilgileri yakında eklenecek.',
    map: 'Harita', mapTitle: 'Caminin haritadaki yeri', directions: 'Yol tarifi', openMap: 'Haritada aç',
    social: 'Sosyal medya',
    onSite: 'Sitede', onSiteSub: 'Sitenin faydalı bölümleri',
    links: {
      jamaat:        ['Namaz ve cemaat vakitleri', 'Bugünün namaz vakitleri'],
      announcements: ['Duyurular', 'Haberler ve duyurular'],
      donate:        ['Bağış', 'Camiye nasıl destek olunur'],
      prayerguide:   ['Namaz rehberi', 'Adım adım namaz öğren'],
      quran:         ['Kur’an-ı Kerim', 'Sureleri oku'],
    },
  },
}

// "Saytda" bloku — bunlar SAYTIN bölmələridir, məscid haqqında iddia deyil.
// tone — telefonda ikon kafelinin rəngi (motion.css → .icon-tile--*);
// masaüstündə kafel əvvəlki kimi yaşıl qalır.
const SITE_LINKS = [
  { key: 'jamaat',        icon: '🕌', tone: '' },
  { key: 'announcements', icon: '📢', tone: 'orange' },
  { key: 'donate',        icon: '💚', tone: 'rose' },
  { key: 'prayerguide',   icon: '🤲', tone: 'teal' },
  { key: 'quran',         icon: '📖', tone: 'gold' },
]

const SOCIAL_ORDER = ['instagram', 'facebook', 'youtube', 'telegram']
const SOCIAL_NAMES = { instagram: 'Instagram', facebook: 'Facebook', youtube: 'YouTube', telegram: 'Telegram' }

// ── Kiçik ikonlar (sadə SVG, rəng currentColor-dan gəlir) ──
function SocialIcon({ name }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: 'false' }
  switch (name) {
    case 'instagram':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'facebook':
      return (
        <svg {...common} fill="currentColor">
          <path d="M14.5 3H12.3A4.3 4.3 0 0 0 8 7.3V10H5.5v3.6H8V21h3.6v-7.4h2.6l.5-3.6h-3.1V7.6c0-.7.5-1.1 1.1-1.1h1.8z" />
        </svg>
      )
    case 'youtube':
      return (
        <svg {...common} fill="currentColor">
          <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5a2.7 2.7 0 0 0-1.9 1.9C2 8.9 2 12 2 12s0 3.1.4 4.8a2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9c.4-1.7.4-4.8.4-4.8s0-3.1-.4-4.8zM10 15.1V8.9l5.2 3.1z" />
        </svg>
      )
    case 'telegram':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
          <path d="M21 4 3 11.2l6.3 2.2L11.5 20l3.3-4.2 4.7 3.4z" />
          <path d="m9.3 13.4 11.7-9.4" />
        </svg>
      )
    default:
      return null
  }
}

// Əlaqə sətirlərinin ikonları — emoji Windows-da solğun görünür, SVG isə
// həm açıq, həm qaranlıq rejimdə --primary rəngini alır
function ContactIcon({ name }) {
  const common = {
    width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: 'false',
  }
  switch (name) {
    case 'pin':
      return (
        <svg {...common}>
          <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </svg>
      )
    case 'phone':
      return (
        <svg {...common}>
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg {...common}>
          <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
        </svg>
      )
    case 'mail':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      )
    default:
      return null
  }
}

function Chevron() {
  return (
    <svg className="msq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

// Dekorativ illüstrasiya: mehrab tağı, səkkizguşəli ulduz və hilal.
// Məscidin real binasını təsvir ETMİR — sadəcə həndəsi ornamentdir.
function ArchOrnament() {
  return (
    <svg className="msq-ornament" viewBox="0 0 160 184" aria-hidden="true" focusable="false">
      <line className="msq-orn-base" x1="6" y1="176" x2="154" y2="176" />
      <path className="msq-orn-arch" d="M22 176V86C22 52 50 28 80 12C110 28 138 52 138 86V176Z" />
      <path className="msq-orn-inner" d="M36 176V90C36 63 56 43 80 29C104 43 124 63 124 90V176" />
      <circle className="msq-orn-finial" cx="80" cy="6" r="3.5" />
      <g className="msq-orn-star">
        <rect x="58" y="86" width="44" height="44" rx="2" />
        <rect x="58" y="86" width="44" height="44" rx="2" transform="rotate(45 80 108)" />
      </g>
      <path className="msq-orn-crescent" d="M90 97A12 12 0 1 0 90 119A11 11 0 1 1 90 97Z" />
      <circle className="msq-orn-dot" cx="80" cy="152" r="2.5" />
      <circle className="msq-orn-dot" cx="66" cy="152" r="2" />
      <circle className="msq-orn-dot" cx="94" cy="152" r="2" />
    </svg>
  )
}

// ── Köməkçilər ──
const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`

// wa.me yalnız beynəlxalq formatda rəqəm qəbul edir (+ və boşluqsuz).
// Yerli AZ formatı (0XX...) verilibsə, 0 → 994 çevrilir.
function waHref(num) {
  let digits = num.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  else if (digits.startsWith('0') && digits.length === 10) digits = '994' + digits.slice(1)
  return `https://wa.me/${digits}`
}

// OpenStreetMap iframe üçün kiçik kvadrat sahə (bbox) və marker
function osmEmbedUrl(lat, lng) {
  const f = (n) => Number(n).toFixed(6)
  const bbox = [f(lng - 0.004), f(lat - 0.0025), f(lng + 0.004), f(lat + 0.0025)].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${f(lat)},${f(lng)}`
}

/** Çoxabzaslı mətni (boş sətirlə ayrılmış) abzaslara böl. */
// Qeyd: sərbəst mətnlərə dir="auto" verilir — tr() cari dil boşdursa az/en-ə
// düşür, belə latın mətni ərəbcə (RTL) səhifədə düzgün istiqamətdə göstərilir.
const paragraphs = (text) => text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)

export default function MosquePage({ setPage }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.en

  // App-in navigate() funksiyası özü səhifəni yuxarı sürüşdürür
  const go = (key) => setPage?.(key)

  // ── Məlumat (yalnız doldurulmuş sahələr) ──
  const history   = tr(MOSQUE.history, lang)
  const hasHistory = filled(history)
  const hasFounded = filled(MOSQUE.founded)

  // Ad adətən sadə sətirdir; tr() həm sətri, həm çoxdilli obyekti qəbul edir
  const imamName = tr(MOSQUE.imam?.name, lang)
  const imamBio  = tr(MOSQUE.imam?.bio, lang)
  const hasImam  = filled(imamName)

  const services = (MOSQUE.services || []).map(s => tr(s, lang)).filter(filled)

  const address  = tr(MOSQUE.address, lang)
  const locality = tr(MOSQUE.locality, lang)
  const phone    = filled(MOSQUE.phone) ? MOSQUE.phone.trim() : ''
  const whatsapp = filled(MOSQUE.whatsapp) ? MOSQUE.whatsapp.trim() : ''
  const email    = filled(MOSQUE.email) ? MOSQUE.email.trim() : ''
  const socials  = SOCIAL_ORDER
    .filter(k => filled(MOSQUE.social?.[k]))
    .map(k => ({ key: k, url: MOSQUE.social[k].trim() }))

  const hasAnyContact = filled(address) || !!phone || !!whatsapp || !!email || socials.length > 0

  const { lat, lng } = MOSQUE.geo || {}
  const hasGeo    = filled(lat) && filled(lng)
  const hasMapUrl = filled(MOSQUE.mapUrl)

  return (
    <div className="msq-page">
      <div className="page-hero theme-mosque hero-compact">
        <Breadcrumb setPage={setPage} current={l.title} />
        <div className="page-hero-arabic">{BRAND.arabicMotto || 'المسجد'}</div>
        <h1>{brandName(lang)}</h1>
        <p>{locality}</p>
      </div>

      <div className="msq-wrap">
        <div className="msq-layout">

          {/* ── Əsas sütun: tarixçə, imam, xidmətlər, bugünkü vaxtlar ──
              Tarixçə hələ yazılmayıbsa, faydalı vaxtlar kartı önə keçir və
              "tezliklə" yeri yığcam bir sətirə çevrilir (telefonda ilk ekranı tutmasın). */}
          <div className="msq-main">
            {!hasHistory && <MosqueTodayCard lang={lang} setPage={go} />}

            <section
              className={`msq-card msq-history${hasHistory ? '' : ' msq-history--empty'}`}
              data-reveal
              aria-labelledby="msq-history-title"
            >
              <div className="msq-history-art">
                <ArchOrnament />
              </div>
              <div className="msq-history-body">
                <h2 id="msq-history-title" className="msq-card-title">{l.history}</h2>
                {hasFounded && (
                  <span className="msq-chip">
                    {l.founded}: <bdi>{String(MOSQUE.founded).trim()}</bdi>
                  </span>
                )}
                {hasHistory ? (
                  <div className="msq-prose">
                    {paragraphs(history).map((p, i) => <p key={i} dir="auto">{p}</p>)}
                  </div>
                ) : (
                  <p className="msq-soon">{l.historySoon}</p>
                )}
              </div>
            </section>

            {hasImam && (
              <section className="msq-card msq-imam" data-reveal aria-labelledby="msq-imam-title">
                <div className="msq-imam-avatar" aria-hidden="true">☽</div>
                <div className="msq-imam-body">
                  <h2 id="msq-imam-title" className="msq-eyebrow">{l.imam}</h2>
                  <div className="msq-imam-name" dir="auto">{imamName}</div>
                  {filled(imamBio) && (
                    <div className="msq-prose msq-imam-bio">
                      {paragraphs(imamBio).map((p, i) => <p key={i} dir="auto">{p}</p>)}
                    </div>
                  )}
                </div>
              </section>
            )}

            {services.length > 0 && (
              <section className="msq-card" data-reveal aria-labelledby="msq-services-title">
                <h2 id="msq-services-title" className="msq-card-title">{l.services}</h2>
                <ul className="msq-services">
                  {services.map((s, i) => (
                    <li key={i}><span className="msq-bullet" aria-hidden="true">✦</span><span dir="auto">{s}</span></li>
                  ))}
                </ul>
              </section>
            )}

            {hasHistory && <MosqueTodayCard lang={lang} setPage={go} />}
          </div>

          {/* ── Yan sütun: əlaqə, xəritə ── */}
          <aside className="msq-side">
            <section className="msq-card msq-contact" data-reveal data-reveal-delay="60" aria-labelledby="msq-contact-title">
              <h2 id="msq-contact-title" className="msq-card-title">{l.contact}</h2>

              <ul className="msq-contact-list">
                <li className="msq-contact-row">
                  <span className="msq-contact-icon"><ContactIcon name="pin" /></span>
                  <div className="msq-contact-text">
                    <span className="msq-contact-label">{filled(address) ? l.address : l.location}</span>
                    <span className="msq-contact-value" dir="auto">{filled(address) ? address : locality}</span>
                    {filled(address) && <span className="msq-contact-sub">{locality}</span>}
                  </div>
                </li>

                {phone && (
                  <li className="msq-contact-row">
                    <span className="msq-contact-icon"><ContactIcon name="phone" /></span>
                    <div className="msq-contact-text">
                      <span className="msq-contact-label">{l.phone}</span>
                      <a className="msq-contact-value msq-link" href={telHref(phone)} dir="ltr">{phone}</a>
                    </div>
                  </li>
                )}

                {whatsapp && (
                  <li className="msq-contact-row">
                    <span className="msq-contact-icon"><ContactIcon name="whatsapp" /></span>
                    <div className="msq-contact-text">
                      <span className="msq-contact-label">{l.whatsapp}</span>
                      <a className="msq-contact-value msq-link" href={waHref(whatsapp)} target="_blank" rel="noopener noreferrer" dir="ltr">{whatsapp}</a>
                    </div>
                  </li>
                )}

                {email && (
                  <li className="msq-contact-row">
                    <span className="msq-contact-icon"><ContactIcon name="mail" /></span>
                    <div className="msq-contact-text">
                      <span className="msq-contact-label">{l.email}</span>
                      <a className="msq-contact-value msq-link" href={`mailto:${email}`} dir="ltr">{email}</a>
                    </div>
                  </li>
                )}
              </ul>

              {!hasAnyContact && <p className="msq-soon">{l.contactSoon}</p>}

              {socials.length > 0 && (
                <div className="msq-social">
                  <span className="msq-contact-label">{l.social}</span>
                  <div className="msq-social-row">
                    {socials.map(s => (
                      <a key={s.key} className={`msq-social-btn is-${s.key}`} href={s.url}
                        target="_blank" rel="noopener noreferrer">
                        <SocialIcon name={s.key} />
                        <span>{SOCIAL_NAMES[s.key]}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {hasGeo ? (
              <section className="msq-card msq-map" data-reveal data-reveal-delay="120" aria-labelledby="msq-map-title">
                <h2 id="msq-map-title" className="msq-card-title">{l.map}</h2>
                <div className="msq-map-frame">
                  <iframe
                    title={l.mapTitle}
                    src={osmEmbedUrl(Number(lat), Number(lng))}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="msq-map-actions">
                  <a className="btn-primary" target="_blank" rel="noopener noreferrer"
                    href={`https://www.google.com/maps/dir/?api=1&destination=${Number(lat)},${Number(lng)}`}>
                    🧭 {l.directions}
                  </a>
                  {hasMapUrl && (
                    <a className="btn-secondary" href={MOSQUE.mapUrl.trim()} target="_blank" rel="noopener noreferrer">
                      {l.openMap}
                    </a>
                  )}
                </div>
              </section>
            ) : hasMapUrl ? (
              <section className="msq-card msq-map" data-reveal data-reveal-delay="120" aria-labelledby="msq-map-title">
                <h2 id="msq-map-title" className="msq-card-title">{l.map}</h2>
                <a className="btn-primary msq-map-open" href={MOSQUE.mapUrl.trim()} target="_blank" rel="noopener noreferrer">
                  🗺️ {l.openMap}
                </a>
              </section>
            ) : null}
          </aside>
        </div>

        {/* ── Saytda: saytın məscidlə bağlı bölmələri (həmişə görünür) ── */}
        <section className="msq-onsite" aria-labelledby="msq-onsite-title">
          <div className="msq-onsite-head">
            <h2 id="msq-onsite-title" className="msq-onsite-title">{l.onSite}</h2>
            <p className="msq-onsite-sub">{l.onSiteSub}</p>
          </div>
          {/* Telefonda kartlar bir qruplaşdırılmış siyahıya çevrilir (CSS); sürüşəndə növbə ilə görünür */}
          <div className="msq-links" data-reveal="stagger">
            {SITE_LINKS.map(item => {
              const [title, desc] = l.links[item.key]
              return (
                <button key={item.key} type="button"
                  className="msq-link-tile"
                  onClick={() => go(item.key)}>
                  <span className={`msq-link-icon${item.tone ? ` icon-tile--${item.tone}` : ''}`} aria-hidden="true">{item.icon}</span>
                  <span className="msq-link-text">
                    <span className="msq-link-title">{title}</span>
                    <span className="msq-link-desc">{desc}</span>
                  </span>
                  <Chevron />
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
