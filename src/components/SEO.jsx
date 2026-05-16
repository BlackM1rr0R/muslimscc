import { useEffect } from 'react'
import { useLang } from '../contexts/LangContext'

// Hər səhifə üçün dynamic meta tag-lər (Google + sosial media)
const SITE_URL = 'https://muslims.cc'
const SITE_NAME = 'Muslims.cc'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`

function setMetaTag(name, content, isProperty = false) {
  if (!content) return
  const attr = isProperty ? 'property' : 'name'
  let tag = document.querySelector(`meta[${attr}="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setLinkTag(rel, href, attrs = {}) {
  let tag = document.querySelector(`link[rel="${rel}"]${attrs.hreflang ? `[hreflang="${attrs.hreflang}"]` : ''}`)
  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', rel)
    document.head.appendChild(tag)
  }
  tag.setAttribute('href', href)
  Object.entries(attrs).forEach(([k, v]) => tag.setAttribute(k, v))
}

function setJsonLd(id, data) {
  let script = document.getElementById(id)
  if (!script) {
    script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = id
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(data)
}

function removeJsonLd(id) {
  const script = document.getElementById(id)
  if (script) script.remove()
}

export default function SEO({
  title,
  description,
  keywords,
  page,           // /quran, /hadith və s.
  image,
  type = 'website',
  schema,         // optional, extra JSON-LD obyekti
}) {
  const { lang } = useLang()

  useEffect(() => {
    const fullTitle = title
      ? `${title} | ${SITE_NAME}`
      : `${SITE_NAME} — Quran, Namaz, Hədis, Dua | İslami Platform`
    const fullUrl = page ? `${SITE_URL}${page.startsWith('/') ? page : '/' + page}` : SITE_URL
    const finalImage = image || DEFAULT_IMAGE

    // Document title
    document.title = fullTitle

    // Standart meta
    setMetaTag('description', description)
    if (keywords) setMetaTag('keywords', keywords)

    // Canonical
    setLinkTag('canonical', fullUrl)

    // Open Graph
    setMetaTag('og:title', fullTitle, true)
    setMetaTag('og:description', description, true)
    setMetaTag('og:url', fullUrl, true)
    setMetaTag('og:type', type, true)
    setMetaTag('og:image', finalImage, true)
    setMetaTag('og:site_name', SITE_NAME, true)
    const localeMap = { az:'az_AZ', en:'en_US', ru:'ru_RU', ar:'ar_SA', tr:'tr_TR' }
    setMetaTag('og:locale', localeMap[lang] || 'az_AZ', true)

    // Twitter
    setMetaTag('twitter:card', 'summary_large_image')
    setMetaTag('twitter:title', fullTitle)
    setMetaTag('twitter:description', description)
    setMetaTag('twitter:image', finalImage)

    // Hreflang
    ;['az','en','ru','ar','tr'].forEach(l => {
      const href = l === 'az' ? fullUrl : `${SITE_URL}/${l}${page || ''}`
      setLinkTag('alternate', href, { hreflang: l })
    })
    setLinkTag('alternate', fullUrl, { hreflang: 'x-default' })

    // html lang attribute
    document.documentElement.lang = lang

    // Custom JSON-LD schema
    if (schema) {
      setJsonLd('seo-page-schema', schema)
    } else {
      removeJsonLd('seo-page-schema')
    }

    return () => {
      removeJsonLd('seo-page-schema')
    }
  }, [title, description, keywords, page, image, type, schema, lang])

  return null
}

// Sürətli istifadə üçün hazır meta-lar (5 dildə)
export const PAGE_META = {
  home: {
    az: { title:'Quran, Namaz, Hədis, Dua, Zikr, Zəkat',     description:'Pulsuz İslami platforma. Quran oxu, namaz vaxtları, 500+ hədis, 100+ dua, zikr sayğacı, zəkat hesabla — 5 dildə.' },
    en: { title:'Quran, Prayer Times, Hadith, Dua, Dhikr',   description:'Free Islamic platform. Read Quran, prayer times, 500+ hadiths, 100+ duas, dhikr counter, zakat calculator — in 5 languages.' },
    ru: { title:'Коран, Намаз, Хадис, Дуа, Зикр',            description:'Бесплатная исламская платформа. Чтение Корана, время намаза, 500+ хадисов, 100+ дуа — на 5 языках.' },
    ar: { title:'القرآن، الصلاة، الحديث، الدعاء، الذكر',     description:'منصة إسلامية مجانية. قراءة القرآن، أوقات الصلاة، أكثر من 500 حديث، 100 دعاء، عداد الذكر، حساب الزكاة — بـ 5 لغات.' },
    tr: { title:'Kuran, Namaz, Hadis, Dua, Zikir',           description:'Ücretsiz İslami platform. Kuran oku, namaz vakitleri, 500+ hadis, 100+ dua, zikir sayacı, zekat hesabı — 5 dilde.' },
  },
  quran: {
    az: { title:'Quran Oxu — 114 surə, tərcümə, audio, təfsir', description:'Quranın bütün 114 surəsini Azərbaycan dilində oxu və dinlə. Söz-söz tərcümə, təfsir, bookmark, axtarış. Mişari Raşid əl-Əfasi tilavəti.' },
    en: { title:'Read Quran — 114 surahs, translation, audio',  description:'Read all 114 surahs of the Quran with translations, audio recitation by Mishari Rashid, tafsir, bookmarks and verse search.' },
    ru: { title:'Чтение Корана — 114 сур, перевод, аудио',      description:'Читайте все 114 сур Корана с переводом, аудио чтением, тафсиром, закладками и поиском аятов.' },
    ar: { title:'قراءة القرآن — 114 سورة، تفسير، صوت',          description:'اقرأ جميع سور القرآن الـ 114 مع الترجمة والصوت والتفسير والإشارات المرجعية وبحث الآيات.' },
    tr: { title:'Kuran Oku — 114 sure, çeviri, ses',             description:'Kuran\'ın tüm 114 suresini çeviri, ses, tefsir, yer imleri ve ayet aramayla okuyun.' },
  },
  prayer: {
    az: { title:'Namaz Vaxtları — Bakı, İstanbul, Məkkə',   description:'10+ şəhər üçün dəqiq namaz vaxtları. Sübh, Günorta, Əsr, Məğrib, İşa. Əzan bildirişi, həftəlik statistika, qiblə.' },
    en: { title:'Prayer Times — Baku, Istanbul, Mecca',     description:'Accurate prayer times for 10+ cities. Fajr, Dhuhr, Asr, Maghrib, Isha. Azan notifications and weekly stats.' },
    ru: { title:'Время намаза — Баку, Стамбул, Мекка',      description:'Точное время намаза для 10+ городов. Фаджр, Зухр, Аср, Магриб, Иша. Уведомления азана и статистика.' },
    ar: { title:'أوقات الصلاة — باكو، إسطنبول، مكة',         description:'أوقات صلاة دقيقة لأكثر من 10 مدن. الفجر، الظهر، العصر، المغرب، العشاء. إشعارات الأذان وإحصائيات أسبوعية.' },
    tr: { title:'Namaz Vakitleri — Bakü, İstanbul, Mekke',  description:'10+ şehir için doğru namaz vakitleri. Sabah, Öğle, İkindi, Akşam, Yatsı. Ezan bildirimi ve haftalık istatistik.' },
  },
  hadith: {
    az: { title:'Hədislər — 500+ səhih hədis, 16 kateqoriya', description:'500+ səhih hədis (Buxari, Müslim, Tirmizi, Əbu Davud) — iman, əxlaq, ibadət, namaz və başqa kateqoriyalarda. Axtarış, favoritlər, paylaşma.' },
    en: { title:'Hadiths — 500+ authentic hadiths',          description:'500+ authentic hadiths from Bukhari, Muslim, Tirmidhi, Abu Dawud. 16 categories: faith, character, worship, prayer and more.' },
    ru: { title:'Хадисы — 500+ достоверных хадисов',         description:'500+ достоверных хадисов из Бухари, Муслима, Тирмизи. 16 категорий: вера, характер, поклонение, намаз.' },
    ar: { title:'الأحاديث — أكثر من 500 حديث صحيح',           description:'أكثر من 500 حديث صحيح من البخاري ومسلم والترمذي وأبي داود. 16 فئة: الإيمان، الأخلاق، العبادة، الصلاة والمزيد.' },
    tr: { title:'Hadisler — 500+ sahih hadis',               description:'500+ sahih hadis: Buhari, Müslim, Tirmizi, Ebu Davud. 16 kategori: iman, ahlak, ibadet, namaz ve daha fazlası.' },
  },
  duas: {
    az: { title:'Dualar — 100+ dua və əzkar',                description:'100+ Quran və hədis əsaslı dua. Səhər/axşam əzkarları, yemək, yuxu, səfər, narahatlıq duaları. Ərəbcə + tərcümə + audio.' },
    en: { title:'Duas — 100+ supplications and adhkar',      description:'100+ Quran and hadith-based duas. Morning/evening adhkar, before meals, sleep, travel, anxiety. Arabic + translation.' },
    ru: { title:'Дуа — 100+ молитв и азкаров',               description:'100+ дуа из Корана и хадисов. Утренние/вечерние азкары, перед едой, сном, путешествием. Арабский + перевод.' },
    ar: { title:'الأدعية — أكثر من 100 دعاء وذكر',            description:'أكثر من 100 دعاء من القرآن والحديث. أذكار الصباح والمساء، قبل الأكل، النوم، السفر، القلق.' },
    tr: { title:'Dualar — 100+ dua ve zikir',                description:'100+ Kuran ve hadis temelli dua. Sabah/akşam zikirleri, yemek, uyku, yolculuk, endişe duaları.' },
  },
  dhikr: {
    az: { title:'Zikr Sayğacı — Təsbih, SübhanAllah, Alhəmd', description:'Rəqəmsal təsbih sayğacı. SübhanAllah, Alhəmdulillah, Allahu Əkbər. Vibrasiya, hədəf, sessiya statistikası.' },
    en: { title:'Dhikr Counter — Tasbih, SubhanAllah',        description:'Digital tasbih counter. SubhanAllah, Alhamdulillah, Allahu Akbar. Vibration, targets, session statistics.' },
    ru: { title:'Счётчик зикра — Тасбих',                     description:'Цифровой тасбих. СубханАллах, Альхамдулиллях, Аллаху Акбар. Вибрация, цели, статистика сессий.' },
    ar: { title:'عداد الذكر — التسبيح',                       description:'عداد تسبيح رقمي. سبحان الله، الحمد لله، الله أكبر. اهتزاز، أهداف، إحصائيات الجلسات.' },
    tr: { title:'Zikir Sayacı — Tesbih',                      description:'Dijital tesbih sayacı. Subhanallah, Elhamdülillah, Allahu Ekber. Titreşim, hedef, oturum istatistiği.' },
  },
  names: {
    az: { title:'Allahın 99 Adı — Əsmaul-Hüsna',             description:'Allahın 99 gözəl adı (Əsmaul-Hüsna). Ərəbcə, transkripsiya, mənalar, izahlar. Hər ada xüsusi məna və fəzilət.' },
    en: { title:'99 Names of Allah — Asma ul-Husna',         description:'The 99 beautiful names of Allah (Asma ul-Husna). Arabic, transliteration, meanings, explanations.' },
    ru: { title:'99 имён Аллаха — Асма уль-Хусна',           description:'99 прекрасных имён Аллаха (Асма уль-Хусна). Арабский, транслитерация, значения, объяснения.' },
    ar: { title:'أسماء الله الحسنى الـ 99',                   description:'أسماء الله الحسنى التسعة والتسعين. عربي، نطق، معاني، شروحات.' },
    tr: { title:'Allah\'ın 99 İsmi — Esma-ül Hüsna',          description:'Allah\'ın 99 güzel ismi. Arapça, transkripsiyon, manalar, açıklamalar.' },
  },
  zakat: {
    az: { title:'Zəkat Kalkulyatoru — 8 valyuta dəstəyi',   description:'Zəkatı dəqiq hesablayın. Bank qalığı, qızıl/gümüş, biznes əmlakı. 8 valyuta, nisab həddi, 2.5%.' },
    en: { title:'Zakat Calculator — 8 currencies',           description:'Calculate your zakat accurately. Bank savings, gold/silver, business assets. 8 currencies, nisab threshold, 2.5%.' },
    ru: { title:'Калькулятор закята — 8 валют',              description:'Точный расчёт закята. Банковский остаток, золото/серебро, бизнес-активы. 8 валют, нисаб, 2.5%.' },
    ar: { title:'حاسبة الزكاة — 8 عملات',                    description:'احسب زكاتك بدقة. الرصيد البنكي، الذهب/الفضة، الأصول التجارية. 8 عملات، النصاب، 2.5%.' },
    tr: { title:'Zekat Hesaplayıcı — 8 para birimi',         description:'Zekatınızı doğru hesaplayın. Banka bakiyesi, altın/gümüş, ticari varlıklar. 8 para birimi, nisap, %2.5.' },
  },
  qibla: {
    az: { title:'Qiblə İstiqaməti — GPS + Kompas',          description:'Kəbəyə dəqiq istiqamət göstərici. GPS və kompas sensoru ilə işləyir. Açı dərəcəsi və məsafə.' },
    en: { title:'Qibla Direction — GPS + Compass',           description:'Accurate direction to the Kaaba. Works with GPS and compass sensor. Angle and distance shown.' },
    ru: { title:'Направление Киблы — GPS + Компас',         description:'Точное направление к Каабе. GPS + компас. Угол и расстояние.' },
    ar: { title:'اتجاه القبلة — GPS + بوصلة',                description:'اتجاه دقيق نحو الكعبة. يعمل بـ GPS والبوصلة. الزاوية والمسافة.' },
    tr: { title:'Kıble Yönü — GPS + Pusula',                description:'Kabe\'ye doğru yön. GPS ve pusula sensörü. Açı ve mesafe gösterilir.' },
  },
  calendar: {
    az: { title:'İslami Təqvim — Hicri tarix',              description:'Hicri-Miladi təqvim çevirici. Ramazan, Eyd, mübarək günlər, ay başlanğıcı. Bayram xatırlatmaları.' },
    en: { title:'Islamic Calendar — Hijri date',             description:'Hijri-Gregorian calendar converter. Ramadan, Eid, blessed days. Holiday reminders.' },
    ru: { title:'Исламский календарь — Хиджра',              description:'Хиджра-Григорианский конвертер. Рамадан, Ид, благословенные дни.' },
    ar: { title:'التقويم الإسلامي — التاريخ الهجري',          description:'محول التقويم الهجري الميلادي. رمضان، العيد، الأيام المباركة.' },
    tr: { title:'İslami Takvim — Hicri tarih',              description:'Hicri-Miladi takvim dönüştürücü. Ramazan, Bayram, mübarek günler.' },
  },
}

// Cari dildə hazır meta-nı qaytaran helper
export function getPageMeta(pageKey, lang) {
  const meta = PAGE_META[pageKey]
  if (!meta) return null
  return meta[lang] || meta.az
}
