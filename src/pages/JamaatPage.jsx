// ═══════════════════════════════════════════════════════
// Namaz və camaat vaxtları — /jamaat
//
// • Azan vaxtları aladhan.com-dan məscidin koordinatına görə HESABLANIR
//   (useMosqueTimes) və səhifədə "hesablanmış" kimi qeyd olunur.
// • Camaat namazları AYRICA kartda göstərilir: vaxt MOSQUE.jamaat
//   qaydalarından (sahibin göstərişi — azandan +N dəq) və ya admin
//   panelindən gəlir. Qayda boşdursa vaxt uydurulmur, "—" çıxır.
// • Cümə kartı NÖVBƏTİ cümənin tarixini, həmin günün zöhr azanını və
//   cümə namazının vaxtını göstərir (useMosqueTimes → nextJumua).
// • Fəzilətlər: ayələr işləmə zamanı api.alquran.cloud-dan gətirilir
//   (mətn yaddaşdan YAZILMIR; sorğu alınmasa ayə kartı gizlənir),
//   hədislər src/data/jamaatVirtues.js-dən (saytın hədis bazasından).
// ═══════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { MOSQUE, brandName, filled, tr } from '../config/mosque'
import useMosqueTimes, { PRAYER_NAMES, MOSQUE_TZ } from '../hooks/useMosqueTimes'
import { JAMAAT_VIRTUES, JUMUA_VIRTUES } from '../data/jamaatVirtues'
import { localizeSource } from '../utils/sourceNames'
import '../styles/JamaatPage.css'
import Breadcrumb from '../components/Breadcrumb'

const LABELS = {
  az: {
    title: 'Namaz və camaat vaxtları',
    next: 'Növbəti namaz', tomorrow: 'sabah', nextBadge: 'Növbəti', jumuaTag: 'Cümə',
    adhan: 'Azan', jamaat: 'Camaat', adhanCalled: 'Azan oxunub',
    untilAdhan: 'azana qalıb', untilJamaat: 'camaata qalıb', untilJumua: 'cümə namazına qalıb',
    jamaatTitle: 'Camaat namazları', todayBadge: 'Bu gün',
    adhanTitle: 'Azan vaxtları', calcBadge: 'Hesablanmış',
    exactNote: 'Məscidin koordinatına görə hesablanıb',
    sunriseNote: 'Sübh namazının vaxtı bitir', notSet: 'təyin olunmayıb',
    afterAdhan: (n) => `azandan +${n} dəq`,
    afterDhuhr: (n) => `zöhr azanından +${n} dəq`,
    fixedTime: 'sabit vaxt',
    jamaatHow: 'Camaat vaxtları azan vaxtına görə müəyyən edilir: hər namazın camaatı azandan bir neçə dəqiqə sonra başlayır.',
    jamaatSoon: 'Camaat (iqamə) vaxtları tezliklə əlavə olunacaq. Hazırda yalnız hesablanmış azan vaxtları göstərilir.',
    friday: 'Cümə namazı', dhuhrAdhan: 'Zöhr azanı', jumuaPrayer: 'Cümə namazı',
    khutbahBefore: 'Cümə namazından əvvəl xütbə oxunur — xütbəyə çatmaq üçün bir az tez gəlin.',
    khutbah: 'Xütbə dili',
    fridayGeneral: 'Cümə namazı zöhr vaxtında qılınır. Dəqiq vaxt üçün məscidin elanlarını izləyin.',
    announcements: 'Elanlara bax',
    rel: (n) => (n === 0 ? 'Bu gün' : n === 1 ? 'Sabah' : `${n} gün sonra`),
    more: 'Faydalı keçidlər',
    otherCities: 'Digər şəhərlərin namaz vaxtları', otherCitiesSub: 'Namaz izləyicisi və azan bildirişi',
    qibla: 'Qiblə istiqaməti', qiblaSub: 'Kəbəyə dəqiq istiqamət',
    map: 'Xəritədə bax', mapAria: 'Google Xəritədə açılır (yeni pəncərə)',
    virtues: 'Fəzilətlər', virtuesSub: 'Camaat və cümə namazı haqqında ayə və hədislər',
    groupJamaat: 'Camaat namazı', groupJumua: 'Cümə namazı',
    verse: 'Ayə', hadith: 'Hədis', translation: 'tərcümə',
    source: 'Azan vaxtları aladhan.com xidməti ilə astronomik hesablanır. Hesablama metodu: {method}.',
    tzNote: 'Bütün vaxtlar Bakı vaxtı ilə (GMT+4) göstərilir.',
    loading: 'Namaz vaxtları yüklənir...',
    error: 'Namaz vaxtlarını yükləmək alınmadı.', errorSub: 'İnternet bağlantınızı yoxlayıb yenidən cəhd edin.', retry: 'Yenidən cəhd et',
    hijriSuffix: 'H',
    hm: (h, m) => (h ? `${h} saat ${m} dəqiqə` : `${m} dəqiqə`),
  },
  en: {
    title: 'Prayer & Congregation Times',
    next: 'Next prayer', tomorrow: 'tomorrow', nextBadge: 'Next', jumuaTag: 'Jumu’ah',
    adhan: 'Adhan', jamaat: 'Congregation', adhanCalled: 'Adhan called',
    untilAdhan: 'until adhan', untilJamaat: 'until congregation', untilJumua: 'until Jumu’ah',
    jamaatTitle: 'Congregational prayers', todayBadge: 'Today',
    adhanTitle: 'Adhan times', calcBadge: 'Calculated',
    exactNote: 'Calculated for the mosque’s coordinates',
    sunriseNote: 'Fajr time ends', notSet: 'not set',
    afterAdhan: (n) => `${n} min after adhan`,
    afterDhuhr: (n) => `${n} min after Dhuhr adhan`,
    fixedTime: 'fixed time',
    jamaatHow: 'Congregation times are set from the adhan times: each prayer’s congregation begins a few minutes after its adhan.',
    jamaatSoon: 'Congregation (iqamah) times will be added soon. For now, only calculated adhan times are shown.',
    friday: 'Friday prayer (Jumu’ah)', dhuhrAdhan: 'Dhuhr adhan', jumuaPrayer: 'Friday prayer',
    khutbahBefore: 'The khutbah (sermon) is delivered before the Friday prayer — come a little early to hear it.',
    khutbah: 'Khutbah language',
    fridayGeneral: 'Friday prayer is held at Dhuhr time. Please check the mosque’s announcements for the exact time.',
    announcements: 'See announcements',
    rel: (n) => (n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days`),
    more: 'Useful links',
    otherCities: 'Prayer times for other cities', otherCitiesSub: 'Prayer tracker and adhan notification',
    qibla: 'Qibla direction', qiblaSub: 'Precise direction to the Kaaba',
    map: 'View on map', mapAria: 'Opens Google Maps (new window)',
    virtues: 'Virtues', virtuesSub: 'Verses and hadith on congregational and Friday prayer',
    groupJamaat: 'Congregational prayer', groupJumua: 'Friday prayer',
    verse: 'Verse', hadith: 'Hadith', translation: 'translation',
    source: 'Adhan times are astronomically calculated via aladhan.com. Calculation method: {method}.',
    tzNote: 'All times are shown in Baku time (GMT+4).',
    loading: 'Loading prayer times...',
    error: 'Couldn’t load prayer times.', errorSub: 'Please check your internet connection and try again.', retry: 'Try again',
    hijriSuffix: 'AH',
    hm: (h, m) => (h ? `${h} h ${m} min` : `${m} min`),
  },
  ru: {
    title: 'Время намаза и джамаата',
    next: 'Следующий намаз', tomorrow: 'завтра', nextBadge: 'Следующий', jumuaTag: 'Джума',
    adhan: 'Азан', jamaat: 'Джамаат', adhanCalled: 'Азан прозвучал',
    untilAdhan: 'до азана', untilJamaat: 'до джамаата', untilJumua: 'до пятничного намаза',
    jamaatTitle: 'Коллективные намазы', todayBadge: 'Сегодня',
    adhanTitle: 'Время азана', calcBadge: 'Расчётное',
    exactNote: 'Рассчитано по координатам мечети',
    sunriseNote: 'Время Фаджра заканчивается', notSet: 'не указано',
    afterAdhan: (n) => `+${n} мин после азана`,
    afterDhuhr: (n) => `+${n} мин после азана Зухр`,
    fixedTime: 'фиксированное время',
    jamaatHow: 'Время джамаата определяется по времени азана: коллективный намаз начинается через несколько минут после азана.',
    jamaatSoon: 'Время коллективного намаза (икамата) скоро будет добавлено. Пока показано только расчётное время азана.',
    friday: 'Пятничный намаз (Джума)', dhuhrAdhan: 'Азан Зухр', jumuaPrayer: 'Пятничный намаз',
    khutbahBefore: 'Перед пятничным намазом читается хутба — приходите немного раньше, чтобы её услышать.',
    khutbah: 'Язык хутбы',
    fridayGeneral: 'Пятничный намаз совершается во время Зухра. Точное время смотрите в объявлениях мечети.',
    announcements: 'Объявления',
    rel: (n) => {
      if (n === 0) return 'Сегодня'
      if (n === 1) return 'Завтра'
      const m10 = n % 10, m100 = n % 100
      const w = m10 === 1 && m100 !== 11 ? 'день' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'дня' : 'дней'
      return `Через ${n} ${w}`
    },
    more: 'Полезные ссылки',
    otherCities: 'Время намаза в других городах', otherCitiesSub: 'Трекер намазов и уведомление об азане',
    qibla: 'Направление Киблы', qiblaSub: 'Точное направление к Каабе',
    map: 'Посмотреть на карте', mapAria: 'Откроется Google Карты (новое окно)',
    virtues: 'Достоинства', virtuesSub: 'Аяты и хадисы о коллективном и пятничном намазе',
    groupJamaat: 'Коллективный намаз', groupJumua: 'Пятничный намаз',
    verse: 'Аят', hadith: 'Хадис', translation: 'перевод',
    source: 'Время азана рассчитано астрономически сервисом aladhan.com. Метод расчёта: {method}.',
    tzNote: 'Всё время указано по бакинскому времени (GMT+4).',
    loading: 'Загрузка времени намаза...',
    error: 'Не удалось загрузить время намаза.', errorSub: 'Проверьте подключение к интернету и попробуйте снова.', retry: 'Повторить',
    hijriSuffix: 'г. х.',
    hm: (h, m) => (h ? `${h} ч ${m} мин` : `${m} мин`),
  },
  ar: {
    title: 'مواقيت الصلاة والجماعة',
    next: 'الصلاة القادمة', tomorrow: 'غدًا', nextBadge: 'التالية', jumuaTag: 'الجمعة',
    adhan: 'الأذان', jamaat: 'الجماعة', adhanCalled: 'أُذِّن',
    untilAdhan: 'حتى الأذان', untilJamaat: 'حتى الجماعة', untilJumua: 'حتى صلاة الجمعة',
    jamaatTitle: 'صلوات الجماعة', todayBadge: 'اليوم',
    adhanTitle: 'أوقات الأذان', calcBadge: 'محسوبة',
    exactNote: 'محسوبة وفق إحداثيات المسجد',
    sunriseNote: 'ينتهي وقت الفجر', notSet: 'غير محدد',
    afterAdhan: (n) => `بعد الأذان بـ ${n} ${n >= 3 && n <= 10 ? 'دقائق' : 'دقيقة'}`,
    afterDhuhr: (n) => `بعد أذان الظهر بـ ${n} ${n >= 3 && n <= 10 ? 'دقائق' : 'دقيقة'}`,
    fixedTime: 'وقت ثابت',
    jamaatHow: 'تُحدَّد أوقات الجماعة بحسب وقت الأذان: تبدأ جماعة كل صلاة بعد أذانها ببضع دقائق.',
    jamaatSoon: 'ستُضاف أوقات الإقامة (صلاة الجماعة) قريبًا. تُعرض حاليًا أوقات الأذان المحسوبة فقط.',
    friday: 'صلاة الجمعة', dhuhrAdhan: 'أذان الظهر', jumuaPrayer: 'صلاة الجمعة',
    khutbahBefore: 'تُلقى خطبة الجمعة قبل الصلاة — احرص على الحضور مبكرًا لسماعها.',
    khutbah: 'لغة الخطبة',
    fridayGeneral: 'تُقام صلاة الجمعة في وقت الظهر. يُرجى متابعة إعلانات المسجد لمعرفة الوقت الدقيق.',
    announcements: 'الإعلانات',
    rel: (n) => (n === 0 ? 'اليوم' : n === 1 ? 'غدًا' : n === 2 ? 'بعد يومين' : n <= 10 ? `بعد ${n} أيام` : `بعد ${n} يومًا`),
    more: 'روابط مفيدة',
    otherCities: 'مواقيت الصلاة في مدن أخرى', otherCitiesSub: 'متابعة الصلوات وتنبيه الأذان',
    qibla: 'اتجاه القبلة', qiblaSub: 'الاتجاه الدقيق نحو الكعبة',
    map: 'عرض على الخريطة', mapAria: 'يفتح خرائط Google (نافذة جديدة)',
    virtues: 'الفضائل', virtuesSub: 'آيات وأحاديث في فضل صلاة الجماعة وصلاة الجمعة',
    groupJamaat: 'صلاة الجماعة', groupJumua: 'صلاة الجمعة',
    verse: 'آية', hadith: 'حديث', translation: 'الترجمة',
    source: 'أوقات الأذان محسوبة فلكيًا عبر خدمة aladhan.com. طريقة الحساب: {method}.',
    tzNote: 'جميع الأوقات بتوقيت باكو (GMT+4).',
    loading: 'جارٍ تحميل مواقيت الصلاة...',
    error: 'تعذّر تحميل مواقيت الصلاة.', errorSub: 'يُرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.', retry: 'إعادة المحاولة',
    hijriSuffix: 'هـ',
    hm: (h, m) => (h ? `${h} ساعة و${m} دقيقة` : `${m} دقيقة`),
  },
  tr: {
    title: 'Namaz ve Cemaat Vakitleri',
    next: 'Sıradaki namaz', tomorrow: 'yarın', nextBadge: 'Sıradaki', jumuaTag: 'Cuma',
    adhan: 'Ezan', jamaat: 'Cemaat', adhanCalled: 'Ezan okundu',
    untilAdhan: 'ezana kaldı', untilJamaat: 'cemaate kaldı', untilJumua: 'cuma namazına kaldı',
    jamaatTitle: 'Cemaatle namazlar', todayBadge: 'Bugün',
    adhanTitle: 'Ezan vakitleri', calcBadge: 'Hesaplanmış',
    exactNote: 'Caminin koordinatlarına göre hesaplanmıştır',
    sunriseNote: 'Sabah namazı vakti biter', notSet: 'belirtilmemiş',
    afterAdhan: (n) => `ezandan ${n} dk sonra`,
    afterDhuhr: (n) => `öğle ezanından ${n} dk sonra`,
    fixedTime: 'sabit saat',
    jamaatHow: 'Cemaat vakitleri ezan vaktine göre belirlenir: her namazın cemaati ezandan birkaç dakika sonra başlar.',
    jamaatSoon: 'Cemaat (kamet) vakitleri yakında eklenecek. Şimdilik yalnızca hesaplanmış ezan vakitleri gösteriliyor.',
    friday: 'Cuma namazı', dhuhrAdhan: 'Öğle ezanı', jumuaPrayer: 'Cuma namazı',
    khutbahBefore: 'Cuma namazından önce hutbe okunur — hutbeye yetişmek için biraz erken gelin.',
    khutbah: 'Hutbe dili',
    fridayGeneral: 'Cuma namazı öğle vaktinde kılınır. Kesin saat için caminin duyurularını takip edin.',
    announcements: 'Duyurulara bak',
    rel: (n) => (n === 0 ? 'Bugün' : n === 1 ? 'Yarın' : `${n} gün sonra`),
    more: 'Faydalı bağlantılar',
    otherCities: 'Diğer şehirlerin namaz vakitleri', otherCitiesSub: 'Namaz takibi ve ezan bildirimi',
    qibla: 'Kıble yönü', qiblaSub: 'Kâbe’ye tam yön',
    map: 'Haritada gör', mapAria: 'Google Haritalar’da açılır (yeni pencere)',
    virtues: 'Faziletler', virtuesSub: 'Cemaat ve cuma namazı hakkında ayet ve hadisler',
    groupJamaat: 'Cemaatle namaz', groupJumua: 'Cuma namazı',
    verse: 'Ayet', hadith: 'Hadis', translation: 'meal',
    source: 'Ezan vakitleri aladhan.com hizmetiyle astronomik olarak hesaplanır. Hesaplama yöntemi: {method}.',
    tzNote: 'Tüm vakitler Bakü saatiyle (GMT+4) gösterilir.',
    loading: 'Namaz vakitleri yükleniyor...',
    error: 'Namaz vakitleri yüklenemedi.', errorSub: 'İnternet bağlantınızı kontrol edip tekrar deneyin.', retry: 'Tekrar dene',
    hijriSuffix: 'H',
    hm: (h, m) => (h ? `${h} saat ${m} dakika` : `${m} dakika`),
  },
}

// Hicri ay adları (CalendarPage ilə eyni yazılış)
const HIJRI_MONTHS = {
  az: ['Məhərrəm','Səfər','Rəbiül-Əvvəl','Rəbiül-Axir','Cəmadiyül-Əvvəl','Cəmadiyül-Axir','Rəcəb','Şaban','Ramazan','Şəvval','Zülqədə','Zülhiccə'],
  en: ['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Ula','Jumada al-Thani','Rajab','Shaban','Ramadan','Shawwal','Dhu al-Qadah','Dhu al-Hijjah'],
  ru: ['Мухаррам','Сафар','Раби аль-Авваль','Раби ас-Сани','Джумада аль-Уля','Джумада ас-Сани','Раджаб','Шабан','Рамадан','Шавваль','Зуль-Каада','Зуль-Хиджа'],
  ar: ['مُحَرَّم','صَفَر','رَبِيع الأَوَّل','رَبِيع الثَّانِي','جُمَادَى الأُولَى','جُمَادَى الآخِرَة','رَجَب','شَعْبَان','رَمَضَان','شَوَّال','ذُو القَعْدَة','ذُو الحِجَّة'],
  tr: ['Muharrem','Safer','Rebiülevvel','Rebiülahir','Cemaziyelevvel','Cemaziyelahir','Recep','Şaban','Ramazan','Şevval','Zilkade','Zilhicce'],
}

// aladhan hesablama metodları (saytda istifadə olunan)
const METHOD_NAMES = {
  13: {
    az: 'Diyanet İşləri Başqanlığı (Türkiyə)',
    en: 'Diyanet (Presidency of Religious Affairs, Türkiye)',
    ru: 'Диянет (Управление по делам религии Турции)',
    ar: 'رئاسة الشؤون الدينية التركية (ديانت)',
    tr: 'Diyanet İşleri Başkanlığı',
  },
}

// Ayə istinadlarında surə adları
const SURAH_LABELS = {
  2:  { az: 'Bəqərə', en: 'Al-Baqarah', ru: 'Аль-Бакара', ar: 'البقرة', tr: 'Bakara' },
  62: { az: 'Cümə', en: 'Al-Jumu‘ah', ru: 'Аль-Джумуа', ar: 'الجمعة', tr: 'Cuma' },
}

// Ayə tərcüməsinin nəşri (QuranPage-dəki xəritə ilə eyni; ərəbcədə yalnız ərəb mətni)
const VERSE_EDITIONS = { az: 'az.mammadaliyev', en: 'en.asad', ru: 'ru.kuliev', tr: 'tr.diyanet' }
const ARABIC_EDITION = 'quran-uthmani'
const VERSE_CACHE_PREFIX = 'qm_ayah_'
const VERSE_TIMEOUT_MS = 15000

// Hədis mənbə adlarının dillərə uyğun yazılışı — utils/sourceNames
// ("Muslim, Mesacid 260" → "Muslim, Masajid 260"; məlumat faylı dəyişmir)

const PRAYER_ICONS = { fajr: '🌙', sunrise: '🌅', dhuhr: '☀️', asr: '🌤️', maghrib: '🌇', isha: '🌃' }
// Telefonda ikon kafelinin rəng tonu (motion.css → .icon-tile--*); masaüstündə kafel boz qalır
const PRAYER_TONES = { fajr: 'violet', sunrise: 'orange', dhuhr: 'gold', asr: 'teal', maghrib: 'rose', isha: 'blue' }

// Qriqorian tarix üçün lokal — ərəbcədə Qriqorian təqvim və latın rəqəmləri
// (vaxtlar da latın rəqəmləri ilə göstərilir)
const LOCALES = { az: 'az-AZ', en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-u-ca-gregory-nu-latn' }

// Bəzi brauzerlərdə (məs. Chrome-un yığcam ICU-su) "az" lokalı yoxdur və
// tarix "2026 M09 19" kimi çıxır — ona görə azərbaycanca əl ilə yazılır
const AZ_MONTHS = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avqust','sentyabr','oktyabr','noyabr','dekabr']
const AZ_WEEKDAYS = ['bazar','bazar ertəsi','çərşənbə axşamı','çərşənbə','cümə axşamı','cümə','şənbə']

const pad2 = (n) => String(n).padStart(2, '0')

/** 'DD-MM-YYYY' → dilə uyğun uzun tarix (istəyə görə həftə günü ilə). */
function formatGregorian(dateKey, lang, withWeekday = true) {
  const [d, m, y] = String(dateKey || '').split('-').map(Number)
  if (!d || !m || !y) return ''
  const date = new Date(Date.UTC(y, m - 1, d, 12))
  if (lang === 'az') {
    const base = `${d} ${AZ_MONTHS[m - 1]} ${y}`
    return withWeekday ? `${base}, ${AZ_WEEKDAYS[date.getUTCDay()]}` : base
  }
  const opts = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }
  if (withWeekday) opts.weekday = 'long'
  try {
    return date.toLocaleDateString(LOCALES[lang] || 'en-GB', opts)
  } catch {
    return date.toLocaleDateString('en-GB', opts)
  }
}

function formatHijri(hijri, lang, suffix) {
  if (!hijri || !filled(hijri.day) || !filled(hijri.year)) return ''
  const idx = Number(hijri.month) - 1
  const month = HIJRI_MONTHS[lang]?.[idx] || (lang === 'ar' ? hijri.monthAr : hijri.monthEn)
  if (!filled(month)) return ''
  return `${hijri.day} ${month} ${hijri.year} ${suffix}`
}

/** Ziyarətçinin saat qurşağı Bakıdan fərqlidirsə true (diaspora üçün qeyd). */
function isForeignTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz === MOSQUE_TZ) return false
    return new Date().getTimezoneOffset() !== -240
  } catch {
    return false
  }
}

/** "HH:MM" → gecə yarısından dəqiqələr; boşdursa null. */
function toMinutes(hhmm) {
  const m = String(hhmm || '').match(/^(\d{1,2}):(\d{2})$/)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** Camaat qaydasının növü: { kind:'rel', n } ("+N"), { kind:'fixed' } ("HH:MM") və ya null. */
function ruleInfo(rule) {
  const r = String(rule || '').trim()
  const m = r.match(/^\+(\d{1,3})$/)
  if (m) return { kind: 'rel', n: Number(m[1]) }
  if (/^\d{1,2}:\d{2}$/.test(r)) return { kind: 'fixed' }
  return null
}

/** "azandan +20 dəq" nişanının mətni (qayda yoxdursa ''). */
function ruleText(rule, l, afterDhuhr = false) {
  const info = ruleInfo(rule)
  if (!info) return ''
  if (info.kind === 'fixed') return l.fixedTime
  return afterDhuhr ? l.afterDhuhr(info.n) : l.afterAdhan(info.n)
}

// ── Ayə: api.alquran.cloud-dan gətir, sessionStorage-da saxla ──

const verseMem = new Map()

function readVerse(key) {
  if (verseMem.has(key)) return verseMem.get(key)
  try {
    const raw = sessionStorage.getItem(VERSE_CACHE_PREFIX + key)
    if (!raw) return null
    const d = JSON.parse(raw)
    if (!d || typeof d.ar !== 'string' || !d.ar) return null
    verseMem.set(key, d)
    return d
  } catch {
    return null
  }
}

function writeVerse(key, data) {
  verseMem.set(key, data)
  try { sessionStorage.setItem(VERSE_CACHE_PREFIX + key, JSON.stringify(data)) } catch { /* yaddaş bağlıdır */ }
}

/** Ayəni ərəbcə (Osmani yazısı) + cari dilin tərcüməsi ilə qaytarır. */
function useVerse(ref, lang) {
  const edition = lang === 'ar' ? '' : (VERSE_EDITIONS[lang] || VERSE_EDITIONS.en)
  const key = `${ref}_${edition || 'ar'}`
  const [state, setState] = useState(() => ({ key, data: readVerse(key), failed: false }))

  useEffect(() => {
    const cached = readVerse(key)
    if (cached) { setState({ key, data: cached, failed: false }); return undefined }
    setState({ key, data: null, failed: false })

    let alive = true
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), VERSE_TIMEOUT_MS)
    const eds = edition ? `${ARABIC_EDITION},${edition}` : ARABIC_EDITION
    fetch(`https://api.alquran.cloud/v1/ayah/${ref}/editions/${eds}`, { signal: ctrl.signal })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(json => {
        const list = Array.isArray(json?.data) ? json.data : []
        const arabic = list.find(a => a?.edition?.identifier === ARABIC_EDITION)
        const trans = edition ? list.find(a => a?.edition?.identifier === edition) : null
        if (!arabic?.text || (edition && !trans?.text)) throw new Error('bad response')
        const data = {
          ar: arabic.text,
          text: trans?.text || '',
          // Tərcüməçinin adı — ingiliscədə tam ad ("Muhammad Asad")
          tname: trans ? (lang === 'en' ? trans.edition?.englishName : trans.edition?.name) || '' : '',
        }
        writeVerse(key, data)
        if (alive) setState({ key, data, failed: false })
      })
      .catch(() => { if (alive) setState({ key, data: null, failed: true }) })
      .finally(() => clearTimeout(timer))

    return () => {
      alive = false
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [key, ref, edition, lang])

  // Dil dəyişəndə köhnə dilin ayəsi bir anlıq da görünməsin
  return state.key === key ? state : { key, data: readVerse(key), failed: false }
}

// ── Canlı geri sayım — yalnız bu kiçik komponent hər saniyə yenilənir ──
function Countdown({ at, hm }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [at])

  const total = Math.max(0, Math.floor((at - now) / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60

  return (
    <div className="jm-count" role="timer" aria-label={hm(h, m)}>
      <span className="jm-time">{pad2(h)}:{pad2(m)}:{pad2(s)}</span>
    </div>
  )
}

// ── Ayə kartı: sorğu alınmasa heç nə göstərilmir ──
function VerseCard({ verseRef, lang, l }) {
  const { data, failed } = useVerse(verseRef, lang)
  if (failed) return null

  if (!data) {
    return (
      <div className="jm-vcard jm-vcard--verse is-loading" aria-hidden="true">
        <span className="skeleton jm-skel jm-skel--chip" />
        <span className="skeleton jm-skel jm-skel--ar" />
        <span className="skeleton jm-skel" />
        <span className="skeleton jm-skel jm-skel--short" />
      </div>
    )
  }

  const surah = SURAH_LABELS[verseRef.split(':')[0]]?.[lang] || SURAH_LABELS[verseRef.split(':')[0]]?.en || ''
  // Ayənin ortasından başlayan tərcümə (məs. "and be constant...") — önünə "…" qoyulur
  const text = data.text && /^\p{Ll}/u.test(data.text) ? `…${data.text}` : data.text
  const showTrans = lang !== 'ar' && filled(text)

  return (
    <figure className="jm-vcard jm-vcard--verse">
      <span className="jm-vkind">{l.verse}</span>
      <blockquote className="jm-varabic" lang="ar" dir="rtl">{data.ar}</blockquote>
      {showTrans && <p className="jm-vtext">{text}</p>}
      <figcaption className="jm-vsource">
        <span>— {surah} <span className="jm-time">{verseRef}</span></span>
        {showTrans && filled(data.tname) && <span className="jm-vtrans">{l.translation}: {data.tname}</span>}
      </figcaption>
    </figure>
  )
}

function HadithCard({ h, lang, l }) {
  const text = lang === 'ar' ? '' : (h.text?.[lang] || h.text?.en || '')
  return (
    <figure className="jm-vcard jm-vcard--hadith">
      <span className="jm-vkind jm-vkind--gold">{l.hadith}</span>
      <blockquote className="jm-varabic jm-varabic--sm" lang="ar" dir="rtl">{h.ar}</blockquote>
      {filled(text) && <p className="jm-vtext">{text}</p>}
      <figcaption className="jm-vsource"><span>— {localizeSource(h.source, lang)}</span></figcaption>
    </figure>
  )
}

// ── Vaxt siyahısının bir sətri (camaat və azan kartları üçün ortaq) ──
function TimeRow({ p, l, name, time, chip, isNext, isPassed, jumuaTag, note, variant }) {
  const cls = [
    'jm-li',
    `jm-li--${variant}`,
    p.key === 'sunrise' ? 'is-sunrise' : '',
    isNext ? 'is-next' : '',
    isPassed ? 'is-passed' : '',
  ].filter(Boolean).join(' ')
  return (
    <li className={cls} aria-current={isNext ? 'time' : undefined}>
      <span className={`jm-li-icon icon-tile--${PRAYER_TONES[p.key] || 'slate'}`} aria-hidden="true">{PRAYER_ICONS[p.key]}</span>
      <span className="jm-li-name">
        <span className="jm-li-title">
          {name}
          {jumuaTag && <span className="jm-tag jm-tag--gold">{l.jumuaTag}</span>}
          {isNext && <span className="jm-tag">{l.nextBadge}</span>}
        </span>
        {filled(chip) && <span className="jm-rule">{chip}</span>}
        {filled(note) && <small className="jm-li-note">{note}</small>}
      </span>
      {filled(time)
        ? <span className="jm-time jm-li-time">{time}</span>
        : <span className="jm-dash" title={l.notSet}>—<span className="jm-sr">{l.notSet}</span></span>}
    </li>
  )
}

export default function JamaatPage({ setPage }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.en
  const {
    loading, error, date, hijri, prayers, hasJamaat, next,
    isFriday, nextJumua, nowSecs, exact, method, reload,
  } = useMosqueTimes()

  const go = (key) => { setPage?.(key); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const name = (key) => PRAYER_NAMES[key]?.[lang] || PRAYER_NAMES[key]?.en || key

  const brand = brandName(lang)
  const gregorian = formatGregorian(date, lang)
  const hijriStr = formatHijri(hijri, lang, l.hijriSuffix)
  const showTzNote = useMemo(() => isForeignTimezone(), [])
  const methodName = METHOD_NAMES[method]?.[lang] || METHOD_NAMES[method]?.en || `aladhan #${method}`
  const hasData = prayers.length > 0

  // ── Növbəti namaz kartı: geri sayım camaat vaxtınadır (varsa) ──
  const nextPrayer = next ? prayers.find(p => p.key === next.key) : null
  const nextIsJumua = !!next && !next.tomorrow && !!nextPrayer?.jumua
  const countAt = next ? (next.jamaatAt ?? next.at) : 0
  const countToJamaat = !!next && next.jamaatAt != null
  const adhanCalled = !!next && next.target === 'jamaat'

  // ── Cədvəllərdə "növbəti" və "keçmiş" sətirlər (məscidin vaxtı ilə) ──
  const passed = (hhmm) => {
    const m = toMinutes(hhmm)
    return m != null && m * 60 <= nowSecs
  }
  const jamaatRows = prayers.filter(p => p.key !== 'sunrise')
  const nextJamaatKey = jamaatRows.find(p => filled(p.jamaat) && !passed(p.jamaat))?.key
  const nextAdhanKey = jamaatRows.find(p => filled(p.adhan) && !passed(p.adhan))?.key
  const anyRelative = jamaatRows.some(p => ruleInfo(p.rule)?.kind === 'rel')

  // ── Cümə ──
  const nj = nextJumua || {}
  const fridayDate = formatGregorian(nj.date, lang, false)
  const fridayRel = typeof nj.inDays === 'number' ? l.rel(nj.inDays) : ''
  const fridayRule = ruleText(nj.rule, l, true)
  const khutbah = tr(nj.khutbahLang, lang)
  const hasJumuaRule = filled(nj.rule)
  const showFridayTimes = hasJumuaRule && (filled(nj.time) || nj.loading)

  const mapUrl = filled(MOSQUE.mapUrl) ? MOSQUE.mapUrl : ''
  const locality = tr(MOSQUE.locality, lang)

  return (
    <div className="jm-page">
      <div className="page-hero theme-jamaat hero-compact">
        <Breadcrumb setPage={setPage} current={l.title} />
        <div className="page-hero-arabic">صَلَاةُ الْجَمَاعَة</div>
        <h1>{l.title}</h1>
        <p className="jm-hero-sub">
          <span className="jm-hero-brand">{brand}</span>
          {gregorian && <><span className="jm-hero-dot" aria-hidden="true">·</span><span>{gregorian}</span></>}
          {hijriStr && <><span className="jm-hero-dot" aria-hidden="true">·</span><span>{hijriStr}</span></>}
        </p>
      </div>

      <div className="jm-wrap">

        {/* ── Yüklənmə / xəta ── */}
        {/* Yüklənərkən fırlanan dairə yox — səhifənin öz formasında skelet
            (növbəti namaz kartı + vaxt siyahısı), məzmun gələndə sıçrayış olmur */}
        {loading && (
          <div className="jm-loading" aria-busy="true">
            <span className="jm-sr" role="status">{l.loading}</span>
            <div className="skeleton jm-loading-next" aria-hidden="true" />
            <div className="jm-card jm-loading-card" aria-hidden="true">
              <span className="skeleton jm-loading-title" />
              {[0, 1, 2, 3, 4].map(i => <span key={i} className="skeleton jm-loading-row" />)}
            </div>
          </div>
        )}

        {!loading && error && !hasData && (
          <section className="jm-card jm-state" role="alert">
            <div className="jm-state-icon" aria-hidden="true">⚠️</div>
            <p className="jm-state-title">{l.error}</p>
            <p className="jm-state-sub">{l.errorSub}</p>
            <button type="button" className="btn-primary" onClick={reload}>↻ {l.retry}</button>
          </section>
        )}

        {/* ── Növbəti namaz: azan + camaat, geri sayım camaata ── */}
        {next && (
          <section className="jm-next" data-reveal="scale" aria-labelledby="jm-next-title">
            <div className="jm-next-info">
              <div className="jm-next-label" id="jm-next-title">
                {l.next}
                {next.tomorrow && <span className="jm-tag">{l.tomorrow}</span>}
                {adhanCalled && <span className="jm-tag jm-tag--soft">{l.adhanCalled}</span>}
              </div>
              <div className="jm-next-name">
                <span className="jm-next-icon" aria-hidden="true">{PRAYER_ICONS[next.key]}</span>
                <span>{name(next.key)}</span>
                {nextIsJumua && <span className="jm-tag jm-tag--gold">{l.jumuaTag}</span>}
              </div>
              <dl className="jm-next-times">
                <div className={adhanCalled ? 'is-done' : ''}>
                  <dt>{l.adhan}</dt>
                  <dd><span className="jm-time">{next.adhan}</span></dd>
                </div>
                {filled(next.jamaat) && (
                  <div className="is-jamaat">
                    <dt>{nextIsJumua ? l.jumuaPrayer : l.jamaat}</dt>
                    <dd><span className="jm-time">{next.jamaat}</span></dd>
                  </div>
                )}
              </dl>
            </div>
            <div className="jm-next-count">
              <Countdown at={countAt} hm={l.hm} />
              <div className="jm-next-caption">
                {countToJamaat ? (nextIsJumua ? l.untilJumua : l.untilJamaat) : l.untilAdhan}
              </div>
            </div>
          </section>
        )}

        {/* ── Camaat namazları | Azan vaxtları ── */}
        {hasData && (
          <div className="jm-grid2">
            <section className="jm-card jm-card--jamaat" data-reveal data-reveal-delay="40" aria-labelledby="jm-jamaat-title">
              <div className="jm-card-head">
                <h2 id="jm-jamaat-title" className="jm-card-title">{l.jamaatTitle}</h2>
                <span className="jm-chip">{l.todayBadge}</span>
              </div>

              {hasJamaat ? (
                <ol className="jm-list">
                  {jamaatRows.map(p => (
                    <TimeRow
                      key={p.key}
                      variant="jamaat"
                      p={p}
                      l={l}
                      name={name(p.key)}
                      time={p.jamaat}
                      chip={filled(p.jamaat) ? ruleText(p.rule, l, p.jumua) : ''}
                      jumuaTag={p.jumua}
                      isNext={p.key === nextJamaatKey}
                      isPassed={filled(p.jamaat) && passed(p.jamaat)}
                    />
                  ))}
                </ol>
              ) : (
                <p className="jm-soon">{l.jamaatSoon}</p>
              )}

              {hasJamaat && anyRelative && <p className="jm-foot">{l.jamaatHow}</p>}
            </section>

            <section className="jm-card" data-reveal data-reveal-delay="80" aria-labelledby="jm-adhan-title">
              <div className="jm-card-head">
                <h2 id="jm-adhan-title" className="jm-card-title">{l.adhanTitle}</h2>
                <span className="jm-chip jm-chip--muted">{l.calcBadge}</span>
              </div>

              <ol className="jm-list">
                {prayers.map(p => (
                  <TimeRow
                    key={p.key}
                    variant="adhan"
                    p={p}
                    l={l}
                    name={name(p.key)}
                    time={p.adhan}
                    note={p.key === 'sunrise' ? l.sunriseNote : ''}
                    isNext={p.key === nextAdhanKey}
                    isPassed={passed(p.adhan)}
                  />
                ))}
              </ol>

              {exact && (
                <p className="jm-foot jm-foot--geo">
                  <span aria-hidden="true">📍</span> {l.exactNote}
                </p>
              )}
            </section>
          </div>
        )}

        {/* ── Cümə namazı | Keçidlər ── */}
        <div className="jm-layout">
          <section
            className={`jm-card jm-friday ${nj.isToday ? 'is-today' : ''}`}
            data-reveal
            aria-labelledby="jm-friday-title"
          >
            <div className="jm-card-head">
              <h2 id="jm-friday-title" className="jm-card-title">🕌 {l.friday}</h2>
              {fridayRel && <span className="jm-chip jm-chip--gold">{fridayRel}</span>}
            </div>

            {fridayDate && <p className="jm-friday-date">{fridayDate}</p>}

            {showFridayTimes ? (
              <>
                <div className="jm-ftimes" aria-busy={nj.loading ? 'true' : undefined}>
                  <div className="jm-fbox">
                    <span className="jm-fbox-label">{l.dhuhrAdhan}</span>
                    {filled(nj.adhan)
                      ? <span className="jm-time jm-fbox-val">{nj.adhan}</span>
                      : <span className="skeleton jm-skel jm-skel--time" aria-hidden="true" />}
                  </div>
                  <div className="jm-fbox jm-fbox--main">
                    <span className="jm-fbox-label">{l.jumuaPrayer}</span>
                    {filled(nj.time)
                      ? <span className="jm-time jm-fbox-val">{nj.time}</span>
                      : <span className="skeleton jm-skel jm-skel--time" aria-hidden="true" />}
                  </div>
                </div>
                {filled(fridayRule) && <span className="jm-rule jm-rule--gold">{fridayRule}</span>}
              </>
            ) : (
              <>
                <p className="jm-friday-text">{l.fridayGeneral}</p>
                {filled(nj.adhan) && (
                  <p className="jm-friday-meta">
                    {l.dhuhrAdhan}: <strong><span className="jm-time">{nj.adhan}</span></strong>
                  </p>
                )}
              </>
            )}

            <p className="jm-friday-khutbah">
              <span className="jm-friday-khutbah-icon" aria-hidden="true">🎙️</span>
              <span>{l.khutbahBefore}</span>
            </p>
            {filled(khutbah) && (
              <p className="jm-friday-meta">{l.khutbah}: <strong>{khutbah}</strong></p>
            )}

            <button type="button" className="btn-secondary jm-friday-btn" onClick={() => go('announcements')}>
              <span aria-hidden="true">📢</span> {l.announcements}
            </button>
          </section>

          {/* Başlıq cümə kartının başlığı ilə bir xətdə — iki kart cüt kimi oxunur */}
          <nav className="jm-card jm-links" data-reveal data-reveal-delay="80" aria-labelledby="jm-links-title">
            <h2 id="jm-links-title" className="jm-card-title jm-links-title">{l.more}</h2>
            <div className="jm-links-list">
              <button type="button" className="jm-link" onClick={() => go('prayer')}>
                <span className="jm-link-icon icon-tile--blue" aria-hidden="true">🗓️</span>
                <span className="jm-link-text">
                  <strong>{l.otherCities}</strong>
                  <small>{l.otherCitiesSub}</small>
                </span>
                <span className="jm-link-arrow" aria-hidden="true">›</span>
              </button>
              <button type="button" className="jm-link" onClick={() => go('qibla')}>
                <span className="jm-link-icon icon-tile--teal" aria-hidden="true">🧭</span>
                <span className="jm-link-text">
                  <strong>{l.qibla}</strong>
                  <small>{l.qiblaSub}</small>
                </span>
                <span className="jm-link-arrow" aria-hidden="true">›</span>
              </button>
              {mapUrl && (
                <a className="jm-link" href={mapUrl} target="_blank" rel="noopener noreferrer" aria-label={`${l.map} — ${l.mapAria}`}>
                  <span className="jm-link-icon icon-tile--rose" aria-hidden="true">📍</span>
                  <span className="jm-link-text">
                    <strong>{l.map}</strong>
                    {filled(locality) && <small>{locality}</small>}
                  </span>
                  <span className="jm-link-arrow jm-link-arrow--ext" aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          </nav>
        </div>

        {/* ── Fəzilətlər: ayə + hədislər ── */}
        <section className="jm-virtues" aria-labelledby="jm-virtues-title">
          <div className="jm-sec-head" data-reveal>
            <h2 id="jm-virtues-title" className="jm-sec-title">{l.virtues}</h2>
            <p className="jm-sec-sub">{l.virtuesSub}</p>
          </div>

          <div className="jm-vgrid">
            <div className="jm-vgroup" role="group" aria-labelledby="jm-vg-jamaat" data-reveal="stagger">
              <h3 id="jm-vg-jamaat" className="jm-vgroup-title">
                <span className="jm-vgroup-icon" aria-hidden="true">🤝</span>
                {l.groupJamaat}
              </h3>
              <VerseCard verseRef="2:43" lang={lang} l={l} />
              {JAMAAT_VIRTUES.map(h => <HadithCard key={h.ref} h={h} lang={lang} l={l} />)}
            </div>

            <div className="jm-vgroup" role="group" aria-labelledby="jm-vg-jumua" data-reveal="stagger">
              <h3 id="jm-vg-jumua" className="jm-vgroup-title">
                <span className="jm-vgroup-icon jm-vgroup-icon--gold" aria-hidden="true">🕌</span>
                {l.groupJumua}
              </h3>
              <VerseCard verseRef="62:9" lang={lang} l={l} />
              {JUMUA_VIRTUES.map(h => <HadithCard key={h.ref} h={h} lang={lang} l={l} />)}
            </div>
          </div>
        </section>

        {/* ── Mənbə qeydləri ── */}
        <div className="jm-notes" role="note">
          <p>{l.source.replace('{method}', methodName)}</p>
          {showTzNote && <p>{l.tzNote}</p>}
        </div>
      </div>
    </div>
  )
}
