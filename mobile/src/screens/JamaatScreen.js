// ═══════════════════════════════════════════════════════
// Camaat və Cümə namazı — web /jamaat (src/pages/JamaatPage.jsx) ilə eyni məzmun
//
// Tətbiq konkret bir məscidə bağlı deyil (Muslims.cc — ümumi platforma), ona
// görə camaat (iqamə) vaxtları YOXDUR. Ekranda:
//   • Fəzilətlər: ayə mətni api.alquran.cloud-dan (Quran ekranının istifadə
//     etdiyi mənbə) gətirilir, yaddaşdan yazılmır — alınmasa kart gizlənir.
//     Hədislər data/jamaatVirtues.js-dən olduğu kimi, mənbəsi ilə.
//   • İstifadəçinin seçdiyi şəhər üçün bugünkü AZAN vaxtları
//     (hooks/usePrayerTimes.js) — "Hesablanmış" kimi yazılır; növbəti azana
//     geri sayım; növbəti cümə günü üçün həmin şəhərin zöhr azanı.
//   • Yaxınlıqdakı məscidi tapmaq üçün keçid (MosqueFinder ekranı) — camaat
//     və cümə vaxtını həmin məsciddən öyrənmək tövsiyə olunur.
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn, BreathingDot } from '../components/Animated';
import { filled, tr } from '../config/brand';
import { localizeSource } from '../utils/sourceNames';
import { pickLang } from '../utils/pickLang';
import usePrayerTimes, { PRAYER_NAMES } from '../hooks/usePrayerTimes';
import { JAMAAT_VIRTUES, JUMUA_VIRTUES, VIRTUE_VERSES } from '../data/jamaatVirtues';
import { SURAH_AZ } from '../data/surahNamesAz';

const LABELS = {
  az: {
    title: 'Camaat və Cümə namazı',
    next: 'Növbəti namaz', tomorrow: 'sabah', nextBadge: 'Növbəti', jumuaTag: 'Cümə',
    adhan: 'Azan', untilAdhan: 'azana qalıb',
    adhanTitle: 'Bugünkü azan vaxtları', adhanSub: '{city} üçün astronomik hesablanıb', calcBadge: 'Hesablanmış',
    changeCity: 'Şəhəri dəyiş',
    sunriseNote: 'Sübh namazının vaxtı bitir',
    nextFriday: 'Növbəti cümə namazı', today: 'Bu gün', tomorrowCap: 'Sabah', inDays: (n) => `${n} gün sonra`,
    fridayToday: 'Bu gün cümədir',
    fridayDhuhr: 'Zöhr azanı · {city}',
    fridayGeneral: 'Cümə namazı zöhr vaxtında, xütbə ilə birlikdə camaatla qılınır. Dəqiq vaxtı yaxınlıqdakı məsciddən öyrənin.',
    virtuesEyebrow: 'Quran və sünnədən', virtuesTitle: 'Camaat və cümə namazının fəziləti',
    tabJamaat: 'Camaat namazı', tabJumua: 'Cümə namazı',
    verse: 'Ayə', hadith: 'Hədis', translation: 'Tərcümə',
    findMosque: 'Yaxınlıqdakı məscidi tap', findMosqueSub: 'Camaat və cümə vaxtını məsciddən öyrənin',
    more: 'Faydalı keçidlər',
    otherCities: 'Digər şəhərlərin namaz vaxtları', otherCitiesSub: 'Namaz izləyicisi və azan bildirişi',
    qibla: 'Qiblə istiqaməti', qiblaSub: 'Kəbəyə dəqiq istiqamət',
    source: 'Azan vaxtları aladhan.com xidməti ilə {city} üçün astronomik hesablanır. Hesablama metodu: {method}. Məscidlərin camaat vaxtı azandan sonra olur və fərqli ola bilər.',
    tzNote: 'Bütün vaxtlar {city} yerli vaxtı ilə göstərilir.',
    loading: 'Namaz vaxtları yüklənir...',
    error: 'Namaz vaxtlarını yükləmək alınmadı.', errorSub: 'İnternet bağlantınızı yoxlayıb yenidən cəhd edin.', retry: 'Yenidən cəhd et',
    hijriSuffix: 'H',
    hm: (h, m) => (h ? `${h} saat ${m} dəqiqə` : `${m} dəqiqə`),
  },
  en: {
    title: 'Congregational & Friday Prayer',
    next: 'Next prayer', tomorrow: 'tomorrow', nextBadge: 'Next', jumuaTag: 'Jumu’ah',
    adhan: 'Adhan', untilAdhan: 'until adhan',
    adhanTitle: 'Today’s adhan times', adhanSub: 'Astronomically calculated for {city}', calcBadge: 'Calculated',
    changeCity: 'Change city',
    sunriseNote: 'Fajr time ends',
    nextFriday: 'Next Friday prayer', today: 'Today', tomorrowCap: 'Tomorrow', inDays: (n) => `in ${n} days`,
    fridayToday: 'Today is Friday',
    fridayDhuhr: 'Dhuhr adhan · {city}',
    fridayGeneral: 'Friday prayer is held in congregation at Dhuhr time, together with the khutbah. Please ask your nearest mosque for the exact time.',
    virtuesEyebrow: 'From the Quran and Sunnah', virtuesTitle: 'Virtues of congregational and Friday prayer',
    tabJamaat: 'Congregation', tabJumua: 'Friday prayer',
    verse: 'Verse', hadith: 'Hadith', translation: 'Translation',
    findMosque: 'Find a nearby mosque', findMosqueSub: 'Ask the mosque for its congregation and Friday times',
    more: 'Useful links',
    otherCities: 'Prayer times for other cities', otherCitiesSub: 'Prayer tracker and adhan notification',
    qibla: 'Qibla direction', qiblaSub: 'Precise direction to the Kaaba',
    source: 'Adhan times are astronomically calculated for {city} via aladhan.com. Calculation method: {method}. Mosques hold the congregational prayer after the adhan, and their times may differ.',
    tzNote: 'All times are shown in the local time of {city}.',
    loading: 'Loading prayer times...',
    error: 'Couldn’t load prayer times.', errorSub: 'Please check your internet connection and try again.', retry: 'Try again',
    hijriSuffix: 'AH',
    hm: (h, m) => (h ? `${h} h ${m} min` : `${m} min`),
  },
  ru: {
    title: 'Коллективный и пятничный намаз',
    next: 'Следующий намаз', tomorrow: 'завтра', nextBadge: 'Следующий', jumuaTag: 'Джума',
    adhan: 'Азан', untilAdhan: 'до азана',
    adhanTitle: 'Время азана сегодня', adhanSub: 'Астрономический расчёт · {city}', calcBadge: 'Расчётное',
    changeCity: 'Сменить город',
    sunriseNote: 'Время Фаджра заканчивается',
    nextFriday: 'Следующий пятничный намаз', today: 'Сегодня', tomorrowCap: 'Завтра', inDays: (n) => `через ${n} дн.`,
    fridayToday: 'Сегодня пятница',
    fridayDhuhr: 'Азан Зухра · {city}',
    fridayGeneral: 'Пятничный намаз совершается коллективно во время Зухра вместе с хутбой. Точное время уточняйте в ближайшей мечети.',
    virtuesEyebrow: 'Из Корана и Сунны', virtuesTitle: 'Достоинства коллективного и пятничного намаза',
    tabJamaat: 'Джамаат', tabJumua: 'Джума',
    verse: 'Аят', hadith: 'Хадис', translation: 'Перевод',
    findMosque: 'Найти ближайшую мечеть', findMosqueSub: 'Время джамаата и джумы уточняйте в мечети',
    more: 'Полезные ссылки',
    otherCities: 'Время намаза в других городах', otherCitiesSub: 'Трекер намазов и уведомление об азане',
    qibla: 'Направление Киблы', qiblaSub: 'Точное направление к Каабе',
    source: 'Время азана рассчитано астрономически сервисом aladhan.com (город: {city}). Метод расчёта: {method}. Коллективный намаз в мечетях проводится после азана, и его время может отличаться.',
    tzNote: 'Всё время указано по местному времени (город: {city}).',
    loading: 'Загрузка времени намаза...',
    error: 'Не удалось загрузить время намаза.', errorSub: 'Проверьте подключение к интернету и попробуйте снова.', retry: 'Повторить',
    hijriSuffix: 'г. х.',
    hm: (h, m) => (h ? `${h} ч ${m} мин` : `${m} мин`),
  },
  ar: {
    title: 'صلاة الجماعة والجمعة',
    next: 'الصلاة القادمة', tomorrow: 'غدًا', nextBadge: 'التالية', jumuaTag: 'الجمعة',
    adhan: 'الأذان', untilAdhan: 'حتى الأذان',
    adhanTitle: 'أوقات الأذان اليوم', adhanSub: 'محسوبة فلكيًا لمدينة {city}', calcBadge: 'محسوبة',
    changeCity: 'تغيير المدينة',
    sunriseNote: 'ينتهي وقت الفجر',
    nextFriday: 'صلاة الجمعة القادمة', today: 'اليوم', tomorrowCap: 'غدًا', inDays: (n) => `بعد ${n} أيام`,
    fridayToday: 'اليوم الجمعة',
    fridayDhuhr: 'أذان الظهر · {city}',
    fridayGeneral: 'تُقام صلاة الجمعة جماعةً في وقت الظهر مع الخطبة. يُرجى معرفة الوقت الدقيق من أقرب مسجد.',
    virtuesEyebrow: 'من القرآن والسنة', virtuesTitle: 'فضل صلاة الجماعة والجمعة',
    tabJamaat: 'صلاة الجماعة', tabJumua: 'صلاة الجمعة',
    verse: 'آية', hadith: 'حديث', translation: 'الترجمة',
    findMosque: 'ابحث عن مسجد قريب', findMosqueSub: 'اعرف أوقات الجماعة والجمعة من المسجد',
    more: 'روابط مفيدة',
    otherCities: 'مواقيت الصلاة في مدن أخرى', otherCitiesSub: 'متابعة الصلوات وتنبيه الأذان',
    qibla: 'اتجاه القبلة', qiblaSub: 'الاتجاه الدقيق نحو الكعبة',
    source: 'أوقات الأذان محسوبة فلكيًا لمدينة {city} عبر خدمة aladhan.com. طريقة الحساب: {method}. تُقام صلاة الجماعة في المساجد بعد الأذان وقد تختلف أوقاتها.',
    tzNote: 'جميع الأوقات بالتوقيت المحلي لمدينة {city}.',
    loading: 'جارٍ تحميل مواقيت الصلاة...',
    error: 'تعذّر تحميل مواقيت الصلاة.', errorSub: 'يُرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.', retry: 'إعادة المحاولة',
    hijriSuffix: 'هـ',
    hm: (h, m) => (h ? `${h} ساعة و${m} دقيقة` : `${m} دقيقة`),
  },
  tr: {
    title: 'Cemaat ve Cuma Namazı',
    next: 'Sıradaki namaz', tomorrow: 'yarın', nextBadge: 'Sıradaki', jumuaTag: 'Cuma',
    adhan: 'Ezan', untilAdhan: 'ezana kaldı',
    adhanTitle: 'Bugünkü ezan vakitleri', adhanSub: '{city} için astronomik olarak hesaplanmıştır', calcBadge: 'Hesaplanmış',
    changeCity: 'Şehri değiştir',
    sunriseNote: 'Sabah namazı vakti biter',
    nextFriday: 'Sonraki cuma namazı', today: 'Bugün', tomorrowCap: 'Yarın', inDays: (n) => `${n} gün sonra`,
    fridayToday: 'Bugün cuma',
    fridayDhuhr: 'Öğle ezanı · {city}',
    fridayGeneral: 'Cuma namazı öğle vaktinde, hutbeyle birlikte cemaatle kılınır. Kesin saati en yakın camiden öğrenin.',
    virtuesEyebrow: 'Kur’an ve Sünnet’ten', virtuesTitle: 'Cemaat ve cuma namazının fazileti',
    tabJamaat: 'Cemaat namazı', tabJumua: 'Cuma namazı',
    verse: 'Ayet', hadith: 'Hadis', translation: 'Meal',
    findMosque: 'Yakındaki camiyi bul', findMosqueSub: 'Cemaat ve cuma vaktini camiden öğrenin',
    more: 'Faydalı bağlantılar',
    otherCities: 'Diğer şehirlerin namaz vakitleri', otherCitiesSub: 'Namaz takibi ve ezan bildirimi',
    qibla: 'Kıble yönü', qiblaSub: 'Kâbe’ye tam yön',
    source: 'Ezan vakitleri aladhan.com hizmetiyle {city} için astronomik olarak hesaplanır. Hesaplama yöntemi: {method}. Camilerde cemaat namazı ezandan sonra kılınır ve saatleri farklı olabilir.',
    tzNote: 'Tüm vakitler {city} yerel saatiyle gösterilir.',
    loading: 'Namaz vakitleri yükleniyor...',
    error: 'Namaz vakitleri yüklenemedi.', errorSub: 'İnternet bağlantınızı kontrol edip tekrar deneyin.', retry: 'Tekrar dene',
    hijriSuffix: 'H',
    hm: (h, m) => (h ? `${h} saat ${m} dakika` : `${m} dakika`),
  },
};

// Hicri ay adları (web CalendarPage/JamaatPage ilə eyni yazılış)
const HIJRI_MONTHS = {
  az: ['Məhərrəm', 'Səfər', 'Rəbiül-Əvvəl', 'Rəbiül-Axir', 'Cəmadiyül-Əvvəl', 'Cəmadiyül-Axir', 'Rəcəb', 'Şaban', 'Ramazan', 'Şəvval', 'Zülqədə', 'Zülhiccə'],
  en: ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Thani', 'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhu al-Qadah', 'Dhu al-Hijjah'],
  ru: ['Мухаррам', 'Сафар', 'Раби аль-Авваль', 'Раби ас-Сани', 'Джумада аль-Уля', 'Джумада ас-Сани', 'Раджаб', 'Шабан', 'Рамадан', 'Шавваль', 'Зуль-Каада', 'Зуль-Хиджа'],
  ar: ['مُحَرَّم', 'صَفَر', 'رَبِيع الأَوَّل', 'رَبِيع الثَّانِي', 'جُمَادَى الأُولَى', 'جُمَادَى الآخِرَة', 'رَجَب', 'شَعْبَان', 'رَمَضَان', 'شَوَّال', 'ذُو القَعْدَة', 'ذُو الحِجَّة'],
  tr: ['Muharrem', 'Safer', 'Rebiülevvel', 'Rebiülahir', 'Cemaziyelevvel', 'Cemaziyelahir', 'Recep', 'Şaban', 'Ramazan', 'Şevval', 'Zilkade', 'Zilhicce'],
};

// Qriqorian tarix — Intl hər cihazda bütün dilləri dəstəkləmir, ona görə adlar əl ilə
const MONTHS = {
  az: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  tr: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
};
const WEEKDAYS = {
  az: ['bazar', 'bazar ertəsi', 'çərşənbə axşamı', 'çərşənbə', 'cümə axşamı', 'cümə', 'şənbə'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ru: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'],
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  tr: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
};

// aladhan hesablama metodları (saytda və tətbiqdə istifadə olunan)
const METHOD_NAMES = {
  13: {
    az: 'Diyanet İşləri Başqanlığı (Türkiyə)',
    en: 'Diyanet (Presidency of Religious Affairs, Türkiye)',
    ru: 'Диянет (Управление по делам религии Турции)',
    ar: 'رئاسة الشؤون الدينية التركية (ديانت)',
    tr: 'Diyanet İşleri Başkanlığı',
  },
};

// Namaz sətirləri üçün ikon və rəng (PrayerScreen ilə eyni palitra)
const PRAYER_META = {
  fajr:    { iconKey: 'fajr',    gradient: ['#6366f1', '#4338ca'] },
  sunrise: { iconKey: 'sunrise', gradient: ['#f59e0b', '#d97706'] },
  dhuhr:   { iconKey: 'dhuhr',   gradient: ['#fbbf24', '#f59e0b'] },
  asr:     { iconKey: 'asr',     gradient: ['#f97316', '#ea580c'] },
  maghrib: { iconKey: 'maghrib', gradient: ['#ec4899', '#db2777'] },
  isha:    { iconKey: 'isha',    gradient: ['#1e3a8a', '#0f172a'] },
};

// Ayə tərcüməsi — Quran ekranındakı EDITION_MAP ilə eyni nəşrlər.
// Ərəbcədə tərcümə yoxdur (ar.muyassar təfsirdir) — yalnız Osmani mətn.
const VERSE_EDITIONS = { az: 'az.mammadaliyev', en: 'en.asad', ru: 'ru.kuliev', tr: 'tr.diyanet' };
const VERSE_TIMEOUT_MS = 12000;
const VERSE_STORE_KEY = 'muslim_cc_verses';   // AsyncStorage: { 'ref|nəşr': ayə } — sabit mətn
const verseMem = new Map();            // ekranlar arası yaddaş keşi

// Ayə istinadlarında surə adları (veb JamaatPage.jsx ilə eyni) — API-nin
// ingiliscə transliterasiyası rus/türk interfeysində görünməsin
const SURAH_LABELS = {
  2:  { az: 'Bəqərə', en: 'Al-Baqarah', ru: 'Аль-Бакара', ar: 'البقرة', tr: 'Bakara' },
  62: { az: 'Cümə', en: 'Al-Jumu‘ah', ru: 'Аль-Джумуа', ar: 'الجمعة', tr: 'Cuma' },
};


const pad2 = (n) => String(n).padStart(2, '0');

// Mənbə adları ortaq utils/sourceNames.js ilə çevrilir; ərəbcədə vergül "،" olur
function localizeSourceLang(src, lang) {
  const out = localizeSource(src, lang);
  return lang === 'ar' ? out.replace(/, /g, '، ') : out;
}

/** 'DD-MM-YYYY' (şəhərin tarixi) → dilə uyğun uzun tarix (həftə günü ilə). */
function formatGregorian(dateKey, lang) {
  const [d, m, y] = String(dateKey || '').split('-').map(Number);
  if (!d || !m || !y) return '';
  const wdIndex = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
  const month = (MONTHS[lang] || MONTHS.en)[m - 1];
  const wd = (WEEKDAYS[lang] || WEEKDAYS.en)[wdIndex];
  if (lang === 'az') return `${d} ${month} ${y}, ${wd}`;
  return `${wd}, ${d} ${month} ${y}`;
}

/** 'DD-MM-YYYY' → "26 sentyabr" (qısa tarix, il və həftə günü olmadan). */
function formatDayMonth(dateKey, lang) {
  const [d, m] = String(dateKey || '').split('-').map(Number);
  if (!d || !m) return '';
  return `${d} ${(MONTHS[lang] || MONTHS.en)[m - 1]}`;
}

function formatHijri(hijri, lang, suffix) {
  if (!hijri || !filled(hijri.day) || !filled(hijri.year)) return '';
  const idx = Number(hijri.month) - 1;
  const month = HIJRI_MONTHS[lang]?.[idx] || (lang === 'ar' ? hijri.monthAr : hijri.monthEn);
  if (!filled(month)) return '';
  return `${hijri.day} ${month} ${hijri.year} ${suffix}`;
}

// ── Ayə: api.alquran.cloud (keş: yaddaş + AsyncStorage) ──

function validVerse(v) {
  return !!v && typeof v.ar === 'string' && v.ar.length > 0 && typeof v.surah === 'number' && typeof v.ayah === 'number';
}

async function readVerseStore(key) {
  try {
    const raw = await AsyncStorage.getItem(VERSE_STORE_KEY);
    const all = raw ? JSON.parse(raw) : null;
    const v = all && typeof all === 'object' ? all[key] : null;
    return validVerse(v) ? v : null;
  } catch {
    return null;
  }
}

async function writeVerseStore(key, v) {
  try {
    const raw = await AsyncStorage.getItem(VERSE_STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const all = parsed && typeof parsed === 'object' ? parsed : {};
    all[key] = v;
    await AsyncStorage.setItem(VERSE_STORE_KEY, JSON.stringify(all));
  } catch { /* yaddaş əlçatan deyil — yalnız yaddaş keşi qalır */ }
}

async function fetchVerse(ref, edition) {
  const editions = edition ? `quran-uthmani,${edition}` : 'quran-uthmani';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), VERSE_TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/ayah/${ref}/editions/${editions}`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const list = Array.isArray(json?.data) ? json.data : [];
    const arabic = list.find(x => x?.edition?.identifier === 'quran-uthmani');
    const trans = edition ? list.find(x => x?.edition?.identifier === edition) : null;
    if (!arabic?.text || (edition && !trans?.text)) throw new Error('bad response');
    return {
      ref,
      ar: String(arabic.text).trim(),
      text: trans ? String(trans.text).trim() : '',
      translator: trans?.edition?.name || '',
      surah: Number(arabic.surah?.number),
      surahAr: arabic.surah?.name || '',
      surahEn: arabic.surah?.englishName || '',
      ayah: Number(arabic.numberInSurah),
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Ayəni gətir; status: 'loading' | 'ok' | 'error' (xətada kart gizlənir). */
function useVerse(ref, lang) {
  const edition = VERSE_EDITIONS[lang] || null;
  const key = `${ref}|${edition || 'ar'}`;
  const [state, setState] = useState(() => {
    const mem = verseMem.get(key);
    return mem ? { key, status: 'ok', verse: mem } : { key, status: 'loading', verse: null };
  });

  useEffect(() => {
    let alive = true;
    const mem = verseMem.get(key);
    if (mem) {
      setState({ key, status: 'ok', verse: mem });
      return () => { alive = false; };
    }
    setState({ key, status: 'loading', verse: null });
    (async () => {
      let v = await readVerseStore(key);
      if (!v) {
        try {
          v = await fetchVerse(ref, edition);
          if (validVerse(v)) writeVerseStore(key, v);
        } catch {
          v = null;
        }
      }
      if (!alive) return;
      if (validVerse(v)) {
        verseMem.set(key, v);
        setState({ key, status: 'ok', verse: v });
      } else {
        setState({ key, status: 'error', verse: null });
      }
    })();
    return () => { alive = false; };
  }, [key, ref, edition]);

  // Dil dəyişəndə köhnə dilin ayəsi bir anlıq görünməsin
  return state.key === key ? state : { key, status: 'loading', verse: null };
}

// ── Canlı geri sayım — yalnız bu kiçik komponent hər saniyə yenilənir ──
function Countdown({ at, hm, style }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [at]);

  const total = Math.max(0, Math.floor((at - now) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  return (
    <Text style={style} accessibilityRole="timer" accessibilityLabel={hm(h, m)}>
      {pad2(h)}:{pad2(m)}:{pad2(s)}
    </Text>
  );
}

// ── Ayə kartı (mətn API-dən; alınmasa heç nə göstərilmir) ──
function VerseCard({ refKey, lang, l, c, sh, isAr }) {
  const { status, verse } = useVerse(refKey, lang);
  if (status === 'error') return null;

  if (status === 'loading' || !verse) {
    return (
      <View style={[styles.virtueCard, styles.verseLoading, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  const surahName = SURAH_LABELS[verse.surah]?.[lang]
    || (lang === 'az' && SURAH_AZ[verse.surah] ? SURAH_AZ[verse.surah].name : (isAr ? verse.surahAr : verse.surahEn));
  const refLabel = `${surahName} ${verse.surah}:${verse.ayah}`;

  return (
    <View style={[styles.virtueCard, { backgroundColor: c.card, borderColor: c.primaryBorder }, sh]}>
      <LinearGradient
        colors={[c.primaryBg2, 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.9 }}
      />
      <View style={styles.virtueHead}>
        <View style={[styles.virtueIcon, { backgroundColor: c.primaryBg }]}>
          <AppIcon name="quran" size={16} color={c.primary} />
        </View>
        <Text style={[styles.virtueKind, { color: c.primary }]}>{l.verse.toUpperCase()}</Text>
      </View>
      <Text style={[styles.virtueArabic, { color: c.text }]}>{verse.ar}</Text>
      {!isAr && filled(verse.text) ? (
        <Text style={[styles.virtueText, { color: c.textSecondary }]}>{verse.text}</Text>
      ) : null}
      <View style={styles.virtueFoot}>
        <View style={[styles.sourceChip, { backgroundColor: c.primaryBg }]}>
          <Text style={[styles.sourceChipText, { color: c.primary }]}>{refLabel}</Text>
        </View>
        {!isAr && filled(verse.translator) ? (
          <Text style={[styles.translator, { color: c.textMuted }]} numberOfLines={1}>
            {l.translation}: {verse.translator}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ── Hədis kartı (data/jamaatVirtues.js — olduğu kimi, mənbəsi ilə) ──
function HadithCard({ item, lang, l, c, sh, isAr }) {
  const text = item.text?.[lang] || ''; // başqa dilə düşmür
  return (
    <View style={[styles.virtueCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
      <LinearGradient
        colors={['transparent', c.goldBg]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.virtueHead}>
        <View style={[styles.virtueIcon, { backgroundColor: c.goldBg }]}>
          <AppIcon name="hadith" size={16} color={c.gold} />
        </View>
        <Text style={[styles.virtueKind, { color: c.gold }]}>{l.hadith.toUpperCase()}</Text>
      </View>
      {filled(item.ar) ? <Text style={[styles.virtueArabic, { color: c.text }]}>{item.ar}</Text> : null}
      {/* Ərəb dilində mətn artıq yuxarıdadır — iki dəfə göstərilməsin */}
      {!isAr && filled(text) ? <Text style={[styles.virtueText, { color: c.textSecondary }]}>{text}</Text> : null}
      <View style={[styles.sourceChip, { backgroundColor: c.goldBg }]}>
        <Text style={[styles.sourceChipText, { color: c.gold }]}>— {localizeSourceLang(item.source, lang)}</Text>
      </View>
    </View>
  );
}

export default function JamaatScreen({ navigation }) {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const sh = dark ? Shadows.dark.sm : Shadows.sm;
  const shL = dark ? Shadows.dark.lg : Shadows.lg;
  const l = LABELS[lang] || LABELS.en;
  const isAr = lang === 'ar';

  const {
    loading, error, date, hijri, city, prayers, next,
    isFriday, nextFriday, method, utcOffsetMin, reload,
  } = usePrayerTimes();

  // Fəzilətlər: cümə günü əvvəlcə cümə bölməsi açılır
  const [virtueTab, setVirtueTab] = useState(() => (isFriday ? 'jumua' : 'jamaat'));

  const name = (key) => tr(PRAYER_NAMES[key], lang) || key;
  const cityLabel = tr(city?.name, lang);
  const withCity = (s) => String(s || '').replace('{city}', cityLabel);

  const go = (route) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { navigation?.navigate?.(route); } catch {}
  };

  const retry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    reload();
  };

  const pickTab = (key) => {
    Haptics.selectionAsync();
    setVirtueTab(key);
  };

  const gregorian = formatGregorian(date, lang);
  const hijriStr = formatHijri(hijri, lang, l.hijriSuffix);
  // Cihazın saat qurşağı seçilmiş şəhərinkindən fərqlidirsə qeyd göstərilir
  const showTzNote = useMemo(() => {
    try { return new Date().getTimezoneOffset() !== -utcOffsetMin; } catch { return false; }
  }, [utcOffsetMin]);
  const methodName = METHOD_NAMES[method]?.[lang] || `aladhan #${method}`;

  const hasData = prayers.length > 0;

  // Keçmiş sətirlər: növbəti namazdan əvvəlkilər (işadan sonra — hamısı)
  const nextIdx = next ? (next.tomorrow ? prayers.length : prayers.findIndex(p => p.key === next.key)) : -1;
  const isPassedKey = (key) => nextIdx > -1 && prayers.findIndex(p => p.key === key) < nextIdx;
  const isNextKey = (key) => !!next && !next.tomorrow && next.key === key;

  // Növbəti cümə
  const nf = nextFriday || null;
  const nfWhen = nf
    ? (nf.daysAway === 0 ? l.today : nf.daysAway === 1 ? l.tomorrowCap : l.inDays(nf.daysAway))
    : '';
  const nfDate = nf ? formatDayMonth(nf.date, lang) : '';

  const virtues = virtueTab === 'jumua' ? JUMUA_VIRTUES : JAMAAT_VIRTUES;
  const verseRef = VIRTUE_VERSES.find(v => v.topic === virtueTab)?.ref;

  const cardStyle = [styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }, sh];
  const rtl = isAr ? styles.rtl : null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero arabic="صَلَاةُ الْجَمَاعَة" title={l.title} subtitle={l.virtuesTitle} theme="prayer" />

      <View style={styles.content}>

        {/* ── FƏZİLƏTLƏR: ayə (API) + hədislər (data) ── */}
        <FadeUp delay={60}>
          <View style={[styles.sectionHead, styles.sectionHeadFirst]}>
            <Text style={[styles.eyebrow, { color: c.gold }, rtl]}>{l.virtuesEyebrow.toUpperCase()}</Text>
            <Text style={[styles.sectionTitle, { color: c.text }, rtl]}>{l.virtuesTitle}</Text>
          </View>

          <View style={[styles.tabs, { backgroundColor: c.surfaceAlt, borderColor: c.border }]} accessibilityRole="tablist">
            {[
              { key: 'jamaat', label: l.tabJamaat },
              { key: 'jumua', label: l.tabJumua },
            ].map(t => {
              const on = virtueTab === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => pickTab(t.key)}
                  activeOpacity={0.85}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  style={[styles.tab, on && [{ backgroundColor: c.card, borderColor: c.primaryBorder }, sh]]}
                >
                  <Text numberOfLines={1} style={[styles.tabText, { color: on ? c.primary : c.textSecondary }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </FadeUp>

        {verseRef ? (
          <VerseCard key={`${verseRef}|${lang}`} refKey={verseRef} lang={lang} l={l} c={c} sh={sh} isAr={isAr} />
        ) : null}
        {virtues.map((v) => (
          <HadithCard key={v.ref} item={v} lang={lang} l={l} c={c} sh={sh} isAr={isAr} />
        ))}

        {/* ── Yaxınlıqdakı məscid ── */}
        <TouchableOpacity
          onPress={() => go('Mosques')}
          activeOpacity={0.85}
          accessibilityRole="button"
          style={[styles.linkTile, styles.linkTileMain, { backgroundColor: c.primaryBg, borderColor: c.primaryBorder }, sh]}
        >
          <View style={[styles.linkIconWrap, { backgroundColor: c.card }]}>
            <AppIcon name="mosques" size={20} color={c.primary} />
          </View>
          <View style={styles.flex1}>
            <Text style={[styles.linkTitle, { color: c.primary }, rtl]}>{l.findMosque}</Text>
            <Text style={[styles.linkDesc, { color: c.textSecondary }, rtl]}>{l.findMosqueSub}</Text>
          </View>
          <AppIcon name="chevronRight" size={18} color={c.primary} style={isAr ? styles.flipX : null} />
        </TouchableOpacity>

        {/* ── Bugünkü tarix (seçilmiş şəhərin saat qurşağı ilə) ── */}
        {gregorian ? (
          <FadeUp delay={100}>
            <View style={[styles.dateRow, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
              <AppIcon name="calendar" size={18} color={c.primary} />
              <View style={styles.flex1}>
                <Text style={[styles.dateText, { color: c.text }, rtl]}>{gregorian}</Text>
                {hijriStr ? <Text style={[styles.hijriText, { color: c.textMuted }, rtl]}>{hijriStr}</Text> : null}
              </View>
              {isFriday ? (
                <View style={[styles.pill, { backgroundColor: c.goldBg, borderColor: c.gold + '55' }]}>
                  <Text style={[styles.pillText, { color: c.gold }]}>{l.fridayToday}</Text>
                </View>
              ) : null}
            </View>
          </FadeUp>
        ) : null}

        {/* ── Yüklənmə ── */}
        {loading ? (
          <View style={[cardStyle, styles.statusBox]}>
            <ActivityIndicator size="large" color={c.primary} />
            <Text style={[styles.statusSub, { color: c.textMuted }]}>{l.loading}</Text>
          </View>
        ) : null}

        {/* ── Xəta (keş də yoxdur) ── */}
        {!loading && error && !hasData ? (
          <FadeUp delay={80}>
            <View style={[cardStyle, styles.statusBox]} accessibilityRole="alert">
              <Text style={styles.statusIcon}>⚠️</Text>
              <Text style={[styles.statusTitle, { color: c.text }]}>{l.error}</Text>
              <Text style={[styles.statusSub, { color: c.textSecondary }]}>{l.errorSub}</Text>
              <TouchableOpacity onPress={retry} activeOpacity={0.85} style={styles.retryWrap} accessibilityRole="button">
                <LinearGradient colors={[c.primary, c.primaryDark]} style={styles.retryBtn}>
                  <AppIcon name="reset" size={16} color="#fff" />
                  <Text style={styles.retryText}>{l.retry}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </FadeUp>
        ) : null}

        {/* ── Növbəti namaz + azana geri sayım ── */}
        {next ? (
          <ScaleIn delay={120}>
            <LinearGradient
              colors={dark ? ['#0f172a', '#1e293b', '#334155'] : ['#4f46e5', '#4338ca', '#3730a3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.nextCard, shL]}
            >
              <View style={styles.nextCircle1} />
              <View style={styles.nextCircle2} />

              <View style={styles.nextHeader}>
                <BreathingDot color="#fff" size={9} />
                <Text style={styles.nextLabel}>{l.next}</Text>
                {next.tomorrow ? (
                  <View style={styles.nextTag}><Text style={styles.nextTagText}>{l.tomorrow}</Text></View>
                ) : null}
                {filled(cityLabel) ? (
                  <View style={styles.nextTag}><Text style={styles.nextTagText}>{cityLabel}</Text></View>
                ) : null}
              </View>

              <View style={styles.nextNameRow}>
                <Text style={styles.nextName}>{name(next.key)}</Text>
                {isFriday && !next.tomorrow && next.key === 'dhuhr' ? (
                  <View style={[styles.nextTag, styles.nextTagGold]}><Text style={styles.nextTagText}>{l.jumuaTag}</Text></View>
                ) : null}
              </View>

              <View style={styles.nextTimes}>
                <View>
                  <Text style={styles.nextTimeLabel}>{l.adhan}</Text>
                  <Text style={[styles.nextTime, styles.ltr]}>{next.adhan}</Text>
                </View>
              </View>

              <View style={styles.countdownBox}>
                <Countdown at={next.at} hm={l.hm} style={[styles.countdownText, styles.ltr]} />
                <Text style={styles.countdownLabel}>{l.untilAdhan}</Text>
              </View>
            </LinearGradient>
          </ScaleIn>
        ) : null}

        {/* ── AZAN VAXTLARI (seçilmiş şəhər, hesablanmış) ── */}
        {hasData ? (
          <FadeUp delay={170}>
            <View style={[cardStyle, styles.listCard]}>
              <View style={styles.listHead}>
                <View style={[styles.headIcon, { backgroundColor: c.primaryBg }]}>
                  <AppIcon name="time" size={20} color={c.primary} />
                </View>
                <View style={styles.flex1}>
                  <Text style={[styles.cardTitle, { color: c.text }, rtl]}>{l.adhanTitle}</Text>
                  <Text style={[styles.cardSub, { color: c.textMuted }, rtl]}>{withCity(l.adhanSub)}</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: c.primaryBg, borderColor: c.primaryBorder }]}>
                  <Text style={[styles.pillText, { color: c.primary }]}>{l.calcBadge}</Text>
                </View>
              </View>

              {prayers.map((p) => {
                const meta = PRAYER_META[p.key];
                const isNext = isNextKey(p.key);
                const isSunrise = p.key === 'sunrise';
                const isJumuaRow = isFriday && p.key === 'dhuhr';
                const color = isNext ? c.primary : (isSunrise ? c.textMuted : c.text);
                return (
                  <View
                    key={p.key}
                    accessible
                    accessibilityLabel={`${name(p.key)}: ${l.adhan} ${p.adhan}`}
                    style={[
                      styles.row,
                      styles.rowCompact,
                      { borderTopColor: c.border },
                      isNext && { backgroundColor: c.primaryBg2 },
                      isPassedKey(p.key) && styles.passed,
                    ]}
                  >
                    <LinearGradient colors={meta.gradient} style={styles.rowIconSm}>
                      <AppIcon name={meta.iconKey} size={14} color="#fff" />
                    </LinearGradient>
                    <View style={styles.rowNameWrap}>
                      <View style={styles.rowTitle}>
                        <Text numberOfLines={1} style={[styles.rowNameSm, { color }]}>{name(p.key)}</Text>
                        {isJumuaRow ? (
                          <View style={[styles.tag, { backgroundColor: c.goldBg }]}>
                            <Text style={[styles.tagText, { color: c.gold }]}>{l.jumuaTag}</Text>
                          </View>
                        ) : null}
                        {isNext ? (
                          <View style={[styles.tag, { backgroundColor: c.primary }]}>
                            <Text style={[styles.tagText, { color: '#fff' }]}>{l.nextBadge}</Text>
                          </View>
                        ) : null}
                      </View>
                      {isSunrise ? (
                        <Text numberOfLines={2} style={[styles.rowNote, { color: c.textMuted }, rtl]}>{l.sunriseNote}</Text>
                      ) : null}
                    </View>
                    <Text style={[styles.adhanTime, styles.ltr, { color }]}>{p.adhan}</Text>
                  </View>
                );
              })}

              <TouchableOpacity
                onPress={() => go('Prayer')}
                activeOpacity={0.85}
                accessibilityRole="button"
                style={[styles.cardFoot, { borderTopColor: c.border }]}
              >
                <Text style={[styles.cardFootLink, { color: c.primary }, rtl]}>📍 {l.changeCity}</Text>
              </TouchableOpacity>
            </View>
          </FadeUp>
        ) : null}

        {/* ── NÖVBƏTİ CÜMƏ NAMAZI (ümumi dini fakt + şəhərin zöhr azanı) ── */}
        {nf ? (
          <FadeUp delay={220}>
            <View style={[cardStyle, { borderColor: nf.isToday ? c.gold + '88' : c.gold + '44', borderWidth: nf.isToday ? 1.5 : 1 }]}>
              <LinearGradient
                colors={[c.goldBg, 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.8 }}
              />
              <View style={styles.jumuaHead}>
                <View style={[styles.headIcon, { backgroundColor: c.goldBg }]}>
                  <AppIcon name="prayer" size={20} color={c.gold} />
                </View>
                <View style={styles.flex1}>
                  <Text style={[styles.cardTitle, { color: c.text }, rtl]}>{l.nextFriday}</Text>
                  <Text style={[styles.cardSub, { color: c.textMuted }, rtl]}>
                    {nf.isToday ? nfDate : [nfDate, nfWhen].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                {nf.isToday ? (
                  <View style={[styles.pill, { backgroundColor: c.goldBg, borderColor: c.gold + '55' }]}>
                    <Text style={[styles.pillText, { color: c.gold }]}>{nfWhen}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={[styles.jumuaText, { color: c.textSecondary }, rtl]}>{l.fridayGeneral}</Text>
              {filled(nf.dhuhr) ? (
                <View style={[styles.jumuaSide, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
                  <Text style={[styles.jumuaSideLabel, { color: c.textMuted }]}>{withCity(l.fridayDhuhr)}</Text>
                  <Text style={[styles.jumuaSideTime, styles.ltr, { color: c.text }]}>{nf.dhuhr}</Text>
                </View>
              ) : nf.loading ? (
                <View style={styles.jumuaLoading}><ActivityIndicator color={c.gold} /></View>
              ) : null}
            </View>
          </FadeUp>
        ) : null}

        {/* ── Faydalı keçidlər ── */}
        <Text style={[styles.sectionLabel, { color: c.textMuted }, rtl]}>{l.more.toUpperCase()}</Text>
        {[
          { route: 'Prayer', icon: 'calendar', title: l.otherCities, desc: l.otherCitiesSub },
          { route: 'Qibla', icon: 'qibla', title: l.qibla, desc: l.qiblaSub },
        ].map((item) => (
          <TouchableOpacity
            key={item.route}
            onPress={() => go(item.route)}
            activeOpacity={0.85}
            accessibilityRole="button"
            style={[styles.linkTile, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}
          >
            <View style={[styles.linkIconWrap, { backgroundColor: c.primaryBg }]}>
              <AppIcon name={item.icon} size={20} color={c.primary} />
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.linkTitle, { color: c.text }, rtl]}>{item.title}</Text>
              <Text style={[styles.linkDesc, { color: c.textMuted }, rtl]}>{item.desc}</Text>
            </View>
            <AppIcon name="chevronRight" size={18} color={c.textMuted} style={isAr ? styles.flipX : null} />
          </TouchableOpacity>
        ))}

        {/* ── Mənbə qeydləri — azan vaxtları hesablanmışdır ── */}
        <View style={styles.notes}>
          <Text style={[styles.note, { color: c.textMuted }, rtl]}>ⓘ {withCity(l.source).replace('{method}', methodName)}</Text>
          {showTzNote && filled(cityLabel) ? <Text style={[styles.note, { color: c.textMuted }, rtl]}>{withCity(l.tzNote)}</Text> : null}
        </View>
      </View>

      {/* Üzən düymələr (FloatingActions) son məzmunu örtməsin */}
      <View style={{ height: 140 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  flex1: { flex: 1, minWidth: 0 },

  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  ltr: { writingDirection: 'ltr' },
  flipX: { transform: [{ scaleX: -1 }] },

  card: {
    padding: 18,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  cardSub: { fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 2 },

  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, borderWidth: 1 },
  pillText: { fontSize: 11, fontWeight: '800' },

  // Tarix
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 14,
  },
  dateText: { fontSize: 14, fontWeight: '800' },
  hijriText: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  // Yüklənmə / xəta
  statusBox: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  statusIcon: { fontSize: 32 },
  statusTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  statusSub: { fontSize: 13, lineHeight: 19, fontWeight: '600', textAlign: 'center' },
  retryWrap: { borderRadius: BorderRadius.full, overflow: 'hidden', marginTop: 8 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 11, borderRadius: BorderRadius.full },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Növbəti namaz
  nextCard: {
    borderRadius: BorderRadius.xl,
    padding: 22,
    marginBottom: 14,
    overflow: 'hidden',
  },
  nextCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -40 },
  nextCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -30 },
  nextHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  nextLabel: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.8, textTransform: 'uppercase' },
  nextTag: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: BorderRadius.full, backgroundColor: 'rgba(255,255,255,0.2)' },
  nextTagGold: { backgroundColor: 'rgba(240,192,64,0.35)' },
  nextTagText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  nextNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 },
  nextName: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  nextTimes: { flexDirection: 'row', gap: 24, marginBottom: 14, flexWrap: 'wrap' },
  nextTimeLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.8 },
  nextTime: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  countdownBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  countdownText: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  countdownLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  // Siyahı kartları (camaat / azan)
  listCard: { padding: 0 },
  listHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14 },
  headIcon: { width: 40, height: 40, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  rowCompact: { paddingVertical: 10 },
  passed: { opacity: 0.55 },
  rowIconSm: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowNameWrap: { flex: 1, minWidth: 0 },
  rowTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  rowNameSm: { fontSize: 15, fontWeight: '700' },
  rowNote: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: BorderRadius.full },
  tagText: { fontSize: 10, fontWeight: '800' },
  adhanTime: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'], minWidth: 56, textAlign: 'right' },
  cardFoot: { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  cardFootLink: { fontSize: 13, fontWeight: '800' },

  // Növbəti cümə
  jumuaHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  jumuaSide: { alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center' },
  jumuaSideLabel: { fontSize: 11, fontWeight: '700' },
  jumuaSideTime: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'], marginTop: 2 },
  jumuaLoading: { paddingVertical: 18, alignItems: 'center' },
  jumuaText: { fontSize: 14, lineHeight: 21, fontWeight: '600' },

  // Fəzilətlər
  sectionHead: { marginTop: 10, marginBottom: 12, paddingHorizontal: 2 },
  sectionHeadFirst: { marginTop: 0 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 3 },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, lineHeight: 26 },
  tabs: { flexDirection: 'row', padding: 4, borderRadius: BorderRadius.full, borderWidth: 1, marginBottom: 14, gap: 4 },
  tab: { flex: 1, minHeight: 40, paddingHorizontal: 10, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 14, fontWeight: '800' },
  virtueCard: { padding: 18, borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  verseLoading: { minHeight: 120, alignItems: 'center', justifyContent: 'center' },
  virtueHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  virtueIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  virtueKind: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  virtueArabic: { fontSize: 21, lineHeight: 38, textAlign: 'right', writingDirection: 'rtl', marginBottom: 12 },
  virtueText: { fontSize: 15, lineHeight: 23, marginBottom: 12 },
  virtueFoot: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  sourceChip: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: BorderRadius.full },
  sourceChipText: { fontSize: 12, fontWeight: '700' },
  translator: { flexShrink: 1, fontSize: 11, fontWeight: '600' },

  // Keçidlər
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginTop: 14, marginBottom: 10, paddingHorizontal: 2 },
  linkTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 10,
  },
  linkTileMain: { marginBottom: 16 },
  linkIconWrap: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  linkTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  linkDesc: { fontSize: 12, fontWeight: '500' },

  // Qeydlər
  notes: { marginTop: 8, gap: 6, paddingHorizontal: 4 },
  note: { fontSize: 12, lineHeight: 18, fontWeight: '500' },
});
