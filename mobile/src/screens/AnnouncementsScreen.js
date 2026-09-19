// ═══════════════════════════════════════════════════════
// Elanlar — web /announcements (src/pages/AnnouncementsPage.jsx) ilə eyni məzmun
//
// Məlumat yalnız admin paneldən gəlir (Firestore, real-vaxt, web ilə eyni):
//   • announcements — elanlar (title[lang], message[lang], type, link, active, createdAt)
//   • events        — hicri təqvim günləri (name[lang], desc[lang], month, day, type)
// Tətbiq heç bir elan və ya tədbir uydurmur: məlumat yoxdursa sakit boş
// vəziyyət göstərilir. Firebase qoşulmayıbsa da eyni boş vəziyyət — xəta yoxdur.
// Deaktiv (active === false) elanlar göstərilmir.
//
// Siyahının başında həmişə sabitlənmiş "Məscidə yardım" kartı durur — o, elan
// deyil: İanə ekranına (Donate) keçid və "Yol tarifi" (məscidin koordinatı ilə
// Google Maps marşrutu). Mətni veb /announcements ilə eynidir; rekvizit,
// məbləğ və s. burada yazılmır (MOSQUE.donation hələ boşdur).
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp } from '../components/Animated';
import { BRAND, LANGS, MOSQUE, filled, tr } from '../config/mosque';
import { subscribeToAnnouncements, subscribeToEvents } from '../data/adminContent';

const LABELS = {
  az: {
    title: 'Elanlar', subtitle: 'Məsciddən son xəbərlər və elanlar',
    latest: 'Son elanlar', all: 'Hamısı', loading: 'Yüklənir…',
    empty: 'Hazırda aktiv elan yoxdur', emptySub: 'Məscidin yeni elanları burada görünəcək.',
    enableNotif: 'Bildirişləri aktivləşdir', seeTimes: 'Namaz vaxtlarına bax',
    readMore: 'Ətraflı', isNew: 'Yeni',
    eventsEyebrow: 'Hicri təqvim', eventsTitle: 'Qarşıdakı İslami günlər',
    eventsNote: 'Tarixlər hesablanmış hicri təqvimə əsaslanır; ayın görünməsinə görə bir gün fərq ola bilər.',
    next: 'Növbəti', today: 'Bu gün', fullCalendar: 'Tam təqvim',
    showMore: 'Daha çox göstər', showLess: 'Daha az göstər',
    pinned: 'Sabitlənmiş', donateTitle: 'Məscidə yardım',
    donateText: 'Məscid camaatın dəstəyi ilə abad olur. İanə etməklə və ya namaza gəlməklə siz də öz payınızı verə bilərsiniz.',
    donateCta: 'Məscidə ianə', directions: 'Yol tarifi',
  },
  en: {
    title: 'Announcements', subtitle: 'Latest news and announcements from the mosque',
    latest: 'Latest announcements', all: 'All', loading: 'Loading…',
    empty: 'There are no active announcements right now', emptySub: 'New announcements from the mosque will appear here.',
    enableNotif: 'Turn on notifications', seeTimes: 'See prayer times',
    readMore: 'Read more', isNew: 'New',
    eventsEyebrow: 'Hijri calendar', eventsTitle: 'Upcoming Islamic dates',
    eventsNote: 'Dates follow the calculated Hijri calendar and may differ by a day depending on the moon sighting.',
    next: 'Next', today: 'Today', fullCalendar: 'Full calendar',
    showMore: 'Show more', showLess: 'Show less',
    pinned: 'Pinned', donateTitle: 'Support the mosque',
    donateText: 'A mosque thrives through the support of its community. You can do your part by donating or simply by coming to pray.',
    donateCta: 'Donate to the mosque', directions: 'Get directions',
  },
  ru: {
    title: 'Объявления', subtitle: 'Последние новости и объявления мечети',
    latest: 'Последние объявления', all: 'Все', loading: 'Загрузка…',
    empty: 'Сейчас нет активных объявлений', emptySub: 'Новые объявления мечети появятся здесь.',
    enableNotif: 'Включить уведомления', seeTimes: 'Время намаза',
    readMore: 'Подробнее', isNew: 'Новое',
    eventsEyebrow: 'Календарь хиджры', eventsTitle: 'Ближайшие исламские даты',
    eventsNote: 'Даты рассчитаны по календарю хиджры и могут отличаться на один день в зависимости от наблюдения луны.',
    next: 'Следующее', today: 'Сегодня', fullCalendar: 'Весь календарь',
    showMore: 'Показать ещё', showLess: 'Свернуть',
    pinned: 'Закреплено', donateTitle: 'Помощь мечети',
    donateText: 'Мечеть живёт поддержкой своей общины. Вы можете внести свой вклад — пожертвованием или просто приходя на намаз.',
    donateCta: 'Пожертвовать мечети', directions: 'Проложить маршрут',
  },
  ar: {
    title: 'الإعلانات', subtitle: 'آخر أخبار المسجد وإعلاناته',
    latest: 'أحدث الإعلانات', all: 'الكل', loading: 'جارٍ التحميل…',
    empty: 'لا توجد إعلانات حالياً', emptySub: 'ستظهر إعلانات المسجد الجديدة هنا.',
    enableNotif: 'تفعيل الإشعارات', seeTimes: 'مواقيت الصلاة',
    readMore: 'المزيد', isNew: 'جديد',
    eventsEyebrow: 'التقويم الهجري', eventsTitle: 'المناسبات الإسلامية القادمة',
    eventsNote: 'التواريخ محسوبة وفق التقويم الهجري وقد تختلف بيوم واحد بحسب رؤية الهلال.',
    next: 'القادم', today: 'اليوم', fullCalendar: 'التقويم الكامل',
    showMore: 'عرض المزيد', showLess: 'عرض أقل',
    pinned: 'مثبّت', donateTitle: 'دعم المسجد',
    donateText: 'يُعمَر المسجد بدعم أهله وروّاده. يمكنك أن تُسهم في ذلك بالتبرع أو بالحضور إلى الصلاة فيه.',
    donateCta: 'التبرع للمسجد', directions: 'الاتجاهات',
  },
  tr: {
    title: 'Duyurular', subtitle: 'Camiden son haberler ve duyurular',
    latest: 'Son duyurular', all: 'Tümü', loading: 'Yükleniyor…',
    empty: 'Şu anda aktif duyuru yok', emptySub: 'Caminin yeni duyuruları burada görünecek.',
    enableNotif: 'Bildirimleri aç', seeTimes: 'Namaz vakitleri',
    readMore: 'Devamı', isNew: 'Yeni',
    eventsEyebrow: 'Hicri takvim', eventsTitle: 'Yaklaşan İslami günler',
    eventsNote: 'Tarihler hesaplanmış hicri takvime göredir; hilalin görülmesine göre bir gün fark olabilir.',
    next: 'Sıradaki', today: 'Bugün', fullCalendar: 'Tüm takvim',
    showMore: 'Daha fazla göster', showLess: 'Daha az göster',
    pinned: 'Sabitlenmiş', donateTitle: 'Camiye destek',
    donateText: 'Cami, cemaatinin desteğiyle mamur olur. Bağış yaparak ya da namaza gelerek siz de katkıda bulunabilirsiniz.',
    donateCta: 'Camiye bağış', directions: 'Yol tarifi',
  },
};

// Elan növləri — web src/data/adminContent.js ANNOUNCEMENT_TYPES ilə eyni
// (admin paneli bu açarları yazır). 'update' köhnə mobil açarıdır — uyğunluq üçün.
const ANN_TYPES = [
  { key: 'info',     label: { az: 'Məlumat', en: 'Info', ru: 'Информация', ar: 'معلومات', tr: 'Bilgi' }, color: '#3b82f6', icon: 'ℹ️' },
  { key: 'urgent',   label: { az: 'Vacib', en: 'Urgent', ru: 'Срочно', ar: 'عاجل', tr: 'Acil' }, color: '#ef4444', icon: '⚠️' },
  { key: 'event',    label: { az: 'Tədbir', en: 'Event', ru: 'Событие', ar: 'حدث', tr: 'Etkinlik' }, color: '#8b5cf6', icon: '📅' },
  { key: 'success',  label: { az: 'Müjdə', en: 'Glad Tidings', ru: 'Радость', ar: 'بشرى', tr: 'Müjde' }, color: '#10b981', icon: '🎉' },
  { key: 'reminder', label: { az: 'Xatırlatma', en: 'Reminder', ru: 'Напоминание', ar: 'تذكير', tr: 'Hatırlatma' }, color: '#f59e0b', icon: '🔔' },
  { key: 'update',   label: { az: 'Yenilik', en: 'Update', ru: 'Новое', ar: 'جديد', tr: 'Yenilik' }, color: '#10b981', icon: '🆕' },
];

// Hicri gün növləri — web EVENT_TYPES ilə eyni
const EVENT_TYPES = [
  { key: 'major',  label: { az: 'Əsas', en: 'Major', ru: 'Главный', ar: 'رئيسي', tr: 'Ana' }, color: '#ef4444', icon: '⭐' },
  { key: 'sunnah', label: { az: 'Sünnə', en: 'Sunnah', ru: 'Сунна', ar: 'سنة', tr: 'Sünnet' }, color: '#3b82f6', icon: '📿' },
  { key: 'night',  label: { az: 'Gecə', en: 'Night', ru: 'Ночь', ar: 'ليلة', tr: 'Gece' }, color: '#8b5cf6', icon: '🌙' },
  { key: 'hajj',   label: { az: 'Həcc', en: 'Hajj', ru: 'Хадж', ar: 'حج', tr: 'Hac' }, color: '#f97316', icon: '🕋' },
  { key: 'fast',   label: { az: 'Oruc', en: 'Fasting', ru: 'Пост', ar: 'صيام', tr: 'Oruç' }, color: '#10b981', icon: '🌅' },
];

// Hicri ay adları — web CalendarPage ilə eyni yazılış
const HIJRI_MONTH_NAMES = {
  az: ['Məhərrəm', 'Səfər', 'Rəbiül-Əvvəl', 'Rəbiül-Axir', 'Cəmadiyül-Əvvəl', 'Cəmadiyül-Axir', 'Rəcəb', 'Şaban', 'Ramazan', 'Şəvval', 'Zülqədə', 'Zülhiccə'],
  en: ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Thani', 'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhu al-Qadah', 'Dhu al-Hijjah'],
  ru: ['Мухаррам', 'Сафар', 'Раби аль-Авваль', 'Раби ас-Сани', 'Джумада аль-Уля', 'Джумада ас-Сани', 'Раджаб', 'Шабан', 'Рамадан', 'Шавваль', 'Зуль-Каада', 'Зуль-Хиджа'],
  ar: ['مُحَرَّم', 'صَفَر', 'رَبِيع الأَوَّل', 'رَبِيع الثَّانِي', 'جُمَادَى الأُولَى', 'جُمَادَى الآخِرَة', 'رَجَب', 'شَعْبَان', 'رَمَضَان', 'شَوَّال', 'ذُو القَعْدَة', 'ذُو الحِجَّة'],
  tr: ['Muharrem', 'Safer', 'Rebiülevvel', 'Rebiülahir', 'Cemaziyelevvel', 'Cemaziyelahir', 'Recep', 'Şaban', 'Ramazan', 'Şevval', 'Zilkade', 'Zilhicce'],
};

// Qriqorian ay adları — Intl hər cihazda bütün dilləri dəstəkləmir
const MONTHS = {
  az: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  tr: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
};

// Saytın yolları → tətbiqin ekranları (elan linki sayt daxilidirsə tətbiqdə açılır)
const PATH_ROUTES = {
  '': 'Home', quran: 'Quran', prayer: 'Prayer', hadith: 'Hadith', duas: 'Duas', dhikr: 'Dhikr',
  names: 'Names', zakat: 'Zakat', qibla: 'Qibla', calendar: 'Calendar', prayerguide: 'PrayerGuide',
  hajjguide: 'HajjGuide', hifz: 'Hifz', quiz: 'Quiz', qurangame: 'QuranGame', glossary: 'Glossary',
  history: 'History', sahaba: 'Sahabe', holyplaces: 'HolyPlaces', mosques: 'Mosques',
  dailytracker: 'DailyTracker', charity: 'Charity', duajournal: 'DuaJournal', quotes: 'Quotes',
  videos: 'Videos', books: 'Books', aichat: 'AIChat', kids: 'Kids', about: 'About',
  mosque: 'Mosque', jamaat: 'Jamaat', announcements: 'Announcements', donate: 'Donate',
};

// Sabitlənmiş "Məscidə yardım" kartının rəngi — naviqasiyadakı İanə düyməsi ilə eyni
const DONATE_GRADIENT = ['#22c55e', '#16a34a'];
const DONATE_COLOR = '#16a34a';
const DONATE_DARK = '#15803d';   // açıq fonda oxunaqlı mətn rəngi

const NEW_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;  // 3 gündən təzə elan "Yeni" nişanı alır
const LOAD_TIMEOUT_MS = 8000;                     // şəbəkə cavab vermirsə yükləmə sonsuz qalmasın
const EVENTS_PREVIEW = 6;

// ── Köməkçilər ──────────────────────────────────────

/** createdAt → millisaniyə. Firestore Timestamp, {seconds} (backup JSON) və ISO sətri qəbul edir. */
function toMillis(ts) {
  if (!ts) return null;
  try {
    if (typeof ts.toMillis === 'function') return ts.toMillis();
    if (typeof ts.toDate === 'function') return ts.toDate().getTime();
    if (typeof ts.seconds === 'number') return ts.seconds * 1000;
    const t = new Date(ts).getTime();
    return Number.isFinite(t) ? t : null;
  } catch {
    return null;
  }
}

/** Ən yeni birinci. createdAt hələ yazılmayıbsa elan indicə əlavə olunub — yuxarıda saxla. */
function byNewest(x, y) {
  if (x._ms == null && y._ms == null) return 0;
  if (x._ms == null) return -1;
  if (y._ms == null) return 1;
  return y._ms - x._ms;
}

function formatDate(ms, lang) {
  if (ms == null) return '';
  const d = new Date(ms);
  const months = MONTHS[lang] || MONTHS.en;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Elan linkini həll et. Yalnız təhlükəsiz linklər: http(s), saytın daxili yolu
 * (tətbiqdə uyğun ekran varsa orada açılır) və ya protokolsuz domen.
 * @returns {{ route?: string, url?: string } | null}
 */
function resolveLink(link) {
  if (typeof link !== 'string') return null;
  const s = link.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return { url: s };
  if (s.startsWith('/') && !s.startsWith('//')) {
    const parts = s.split(/[?#]/)[0].split('/').filter(Boolean);
    if (parts.length && LANGS.includes(parts[0])) parts.shift();   // /en/jamaat → jamaat
    const route = parts.length <= 1 ? PATH_ROUTES[parts[0] || ''] : null;
    return route ? { route } : { url: BRAND.url + s };
  }
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(s)) return { url: 'https://' + s };
  return null;
}

/**
 * "Yol tarifi" linki: dəqiq koordinat varsa Google Maps marşrutu (veb ilə eyni),
 * yoxsa sahibin verdiyi xəritə linki. Heç biri yoxdursa '' — düymə göstərilmir.
 */
function directionsHref() {
  const { lat, lng } = MOSQUE.geo || {};
  if (filled(lat) && filled(lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${Number(lat)},${Number(lng)}`;
  }
  return filled(MOSQUE.mapUrl) ? String(MOSQUE.mapUrl).trim() : '';
}

/**
 * Bugünkü hicri ay və gün (Umm al-Qura, cihazın Intl-i ilə — web ilə eyni).
 * Cihaz bu təqvimi dəstəkləmirsə null — onda günlər sadəcə ay/gün sırası ilə düzülür.
 */
function hijriToday() {
  try {
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric' });
    if (!String(fmt.resolvedOptions().calendar || '').startsWith('islamic')) return null;
    if (typeof fmt.formatToParts !== 'function') return null;
    const parts = fmt.formatToParts(new Date());
    const month = Number(parts.find(p => p.type === 'month')?.value);
    const day = Number(parts.find(p => p.type === 'day')?.value);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 30) return { month, day };
  } catch { /* köhnə cihaz */ }
  return null;
}

// ═══════════════════════════════════════════════════════

export default function AnnouncementsScreen({ navigation }) {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const sh = dark ? Shadows.dark.sm : Shadows.sm;
  const l = LABELS[lang] || LABELS.en;
  const isAr = lang === 'ar';
  const rtl = isAr ? styles.rtl : null;

  const [rawAnnouncements, setRawAnnouncements] = useState([]);
  const [rawEvents, setRawEvents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [offerNotif, setOfferNotif] = useState(false);

  // ── Canlı abunələr (ekran bağlananda ləğv olunur) ──
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => { if (alive) setLoaded(true); }, LOAD_TIMEOUT_MS);
    let unsubA;
    let unsubE;
    try {
      unsubA = subscribeToAnnouncements((items) => {
        if (!alive) return;
        setRawAnnouncements(Array.isArray(items) ? items : []);
        setLoaded(true);
      });
    } catch {
      setLoaded(true);
    }
    try {
      unsubE = subscribeToEvents((items) => {
        if (!alive) return;
        setRawEvents(Array.isArray(items) ? items : []);
      });
    } catch { /* hicri günlər bölməsi sadəcə görünmür */ }

    return () => {
      alive = false;
      clearTimeout(timer);
      try { unsubA?.(); } catch { /* */ }
      try { unsubE?.(); } catch { /* */ }
    };
  }, []);

  // Bildiriş icazəsi hələ verilməyibsə boş vəziyyətdə "aktivləşdir" düyməsi çıxır
  useEffect(() => {
    let alive = true;
    try {
      Notifications.getPermissionsAsync()
        .then(p => { if (alive) setOfferNotif(p?.status !== 'granted'); })
        .catch(() => {});
    } catch { /* bildiriş modulu yoxdur */ }
    return () => { alive = false; };
  }, []);

  // ── Aktiv elanlar, ən yenisi birinci ──
  const announcements = useMemo(() => {
    return rawAnnouncements
      .filter(a => a && a.active !== false)
      .map(a => ({
        ...a,
        _title: tr(a.title, lang).trim(),
        _message: tr(a.message, lang).trim(),
        _ms: toMillis(a.createdAt),
        _link: resolveLink(a.link),
        _type: ANN_TYPES.find(t => t.key === a.type) || ANN_TYPES[0],
      }))
      .filter(a => a._title || a._message)
      .sort(byNewest);
  }, [rawAnnouncements, lang]);

  // ── Süzgəc çipləri: yalnız həqiqətən rast gəlinən növlər ──
  const typeCounts = useMemo(() => {
    const counts = {};
    for (const a of announcements) counts[a._type.key] = (counts[a._type.key] || 0) + 1;
    return ANN_TYPES.filter(t => counts[t.key]).map(t => ({ ...t, count: counts[t.key] }));
  }, [announcements]);

  // Seçilmiş növ artıq yoxdursa (elan silinib) — "Hamısı"na qayıt
  useEffect(() => {
    if (filter !== 'all' && !typeCounts.some(t => t.key === filter)) setFilter('all');
  }, [filter, typeCounts]);

  const visible = filter === 'all' ? announcements : announcements.filter(a => a._type.key === filter);

  // ── Hicri günlər: bu gündən başlayaraq ilboyu sıra ──
  const today = useMemo(() => hijriToday(), [rawEvents]);
  const events = useMemo(() => {
    const list = rawEvents
      .filter(ev => ev && Number(ev.month) >= 1 && Number(ev.month) <= 12 && Number(ev.day) >= 1 && Number(ev.day) <= 30)
      .map(ev => {
        const month = Number(ev.month);
        const day = Number(ev.day);
        let order = (month - 1) * 30 + (day - 1);
        if (today) {
          order -= (today.month - 1) * 30 + (today.day - 1);
          if (order < 0) order += 360;
        }
        return {
          ...ev,
          _month: month,
          _day: day,
          _order: order,
          _name: tr(ev.name, lang).trim(),
          _desc: tr(ev.desc, lang).trim(),
          _type: EVENT_TYPES.find(t => t.key === ev.type) || EVENT_TYPES[0],
        };
      })
      .filter(ev => ev._name);
    return list.sort((a, b) => a._order - b._order);
  }, [rawEvents, lang, today]);

  const shownEvents = showAllEvents ? events : events.slice(0, EVENTS_PREVIEW);
  const monthNames = HIJRI_MONTH_NAMES[lang] || HIJRI_MONTH_NAMES.en;
  const now = Date.now();

  const pickFilter = (key) => {
    Haptics.selectionAsync();
    setFilter(key);
  };

  const go = (route) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { navigation?.navigate?.(route); } catch {}
  };

  const openLink = (link) => {
    if (!link) return;
    if (link.route) { go(link.route); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(link.url).catch(() => {});
  };

  const typeLabel = (t) => t.label[lang] || t.label.en;
  const mapHref = directionsHref();
  const donateInk = dark ? '#4ade80' : DONATE_DARK;

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      {/* Ərəbcədə dekorativ ərəb sətri başlığı təkrarlamasın */}
      <PageHero arabic={isAr ? null : 'الإعلانات'} title={l.title} subtitle={l.subtitle} theme="notifications" />

      <View style={styles.content}>

        {/* ═══ ELANLAR ═══ */}
        <Text style={[styles.sectionTitle, { color: c.text }, rtl]}>{l.latest}</Text>

        {/* Sabitlənmiş: Məscidə yardım — İanə ekranı + yol tarifi (həmişə yuxarıda, süzgəcdən asılı deyil) */}
        <FadeUp delay={40}>
          <View style={[styles.card, styles.pinCard, { backgroundColor: c.card, borderColor: DONATE_COLOR + '55' }, sh]}>
            <LinearGradient
              colors={[DONATE_COLOR + (dark ? '26' : '1a'), 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0.9 }}
            />
            <View style={[styles.colorBar, { backgroundColor: DONATE_COLOR }]} />

            <View style={styles.pinRow}>
              <LinearGradient colors={DONATE_GRADIENT} style={styles.pinIcon}>
                <AppIcon name="heart" size={20} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={[styles.cardMeta, { marginBottom: 4 }]}>
                  <View style={[styles.typePill, { backgroundColor: DONATE_COLOR + '1f' }]}>
                    <Text style={[styles.typeText, { color: donateInk }]}>📌 {l.pinned}</Text>
                  </View>
                </View>
                <Text style={[styles.cardTitle, { color: c.text, marginBottom: 4 }, rtl]} accessibilityRole="header">{l.donateTitle}</Text>
                <Text style={[styles.cardMsg, { color: c.textSecondary }, rtl]}>{l.donateText}</Text>
              </View>
            </View>

            {/* İki düymə: İanə ekranı | Yol tarifi (xəritə linki yoxdursa yalnız birincisi) */}
            <View style={[styles.pinCta, { borderTopColor: c.border }]}>
              <TouchableOpacity
                onPress={() => go('Donate')}
                activeOpacity={0.7}
                accessibilityRole="button"
                style={styles.pinBtn}
              >
                <Text style={[styles.moreText, styles.pinBtnText, { color: donateInk }]} numberOfLines={2}>{l.donateCta}</Text>
                <AppIcon name="chevronRight" size={16} color={donateInk} style={isAr ? styles.flipX : null} />
              </TouchableOpacity>
              {mapHref ? (
                <>
                  <View style={[styles.pinDivider, { backgroundColor: c.border }]} />
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Linking.openURL(mapHref).catch(() => {});
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="link"
                    style={styles.pinBtn}
                  >
                    <Text style={[styles.moreText, styles.pinBtnText, { color: c.primary }]} numberOfLines={2}>🧭 {l.directions}</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>
        </FadeUp>

        {!loaded ? (
          <View style={[styles.emptyCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
            <ActivityIndicator size="large" color={c.primary} />
            <Text style={[styles.loadingText, { color: c.textMuted }]}>{l.loading}</Text>
          </View>
        ) : announcements.length === 0 ? (
          /* Boş vəziyyət — sakit sətir + faydalı iki düymə */
          <FadeUp delay={80}>
            <View style={[styles.emptyCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={[styles.emptyText, { color: c.text }]}>{l.empty}</Text>
              <Text style={[styles.emptySub, { color: c.textMuted }]}>{l.emptySub}</Text>
              <View style={styles.emptyActions}>
                {offerNotif ? (
                  <TouchableOpacity onPress={() => go('Notifications')} activeOpacity={0.85} accessibilityRole="button" style={styles.primaryBtnWrap}>
                    <LinearGradient colors={[c.primary, c.primaryDark]} style={styles.primaryBtn}>
                      <Text style={styles.primaryBtnText}>🔔 {l.enableNotif}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  onPress={() => go('Jamaat')}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  style={[styles.ghostBtn, { borderColor: c.primaryBorder, backgroundColor: c.primaryBg }]}
                >
                  <Text style={[styles.ghostBtnText, { color: c.primary }]}>{l.seeTimes}</Text>
                  <AppIcon name="chevronRight" size={14} color={c.primary} style={isAr ? styles.flipX : null} />
                </TouchableOpacity>
              </View>
            </View>
          </FadeUp>
        ) : (
          <>
            {/* Növ filtri — birdən çox növ olanda */}
            {typeCounts.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {[{ key: 'all', count: announcements.length }, ...typeCounts].map(t => {
                  const on = filter === t.key;
                  const accent = t.key === 'all' ? c.primary : t.color;
                  return (
                    <TouchableOpacity
                      key={t.key}
                      onPress={() => pickFilter(t.key)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      style={[
                        styles.chip,
                        { backgroundColor: on ? accent : c.card, borderColor: on ? accent : c.cardBorder },
                      ]}
                    >
                      {t.key !== 'all' ? <View style={[styles.chipDot, { backgroundColor: on ? '#fff' : t.color }]} /> : null}
                      <Text style={[styles.chipText, { color: on ? '#fff' : c.text }]}>
                        {t.key === 'all' ? l.all : typeLabel(t)}
                      </Text>
                      <View style={[styles.chipCount, { backgroundColor: on ? 'rgba(255,255,255,0.25)' : c.surfaceAlt }]}>
                        <Text style={[styles.chipCountText, { color: on ? '#fff' : c.textMuted }]}>{t.count}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}

            {visible.map((a, i) => {
              const isNew = a._ms != null && now - a._ms < NEW_WINDOW_MS && a._ms <= now + 60000;
              return (
                <FadeUp key={a.id || i} delay={60 + Math.min(i, 8) * 50}>
                  <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
                    <LinearGradient
                      colors={[a._type.color + '14', 'transparent']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0.7 }}
                    />
                    <View style={[styles.colorBar, { backgroundColor: a._type.color }]} />

                    <View style={styles.cardMeta}>
                      <View style={[styles.typePill, { backgroundColor: a._type.color + '1f' }]}>
                        <Text style={[styles.typeText, { color: a._type.color }]}>
                          {a._type.icon} {typeLabel(a._type)}
                        </Text>
                      </View>
                      {isNew ? (
                        <View style={[styles.newPill, { backgroundColor: c.primary }]}>
                          <Text style={styles.newText}>{l.isNew}</Text>
                        </View>
                      ) : null}
                      <View style={{ flex: 1 }} />
                      {a._ms != null ? <Text style={[styles.dateText, { color: c.textMuted }]}>{formatDate(a._ms, lang)}</Text> : null}
                    </View>

                    {a._title ? <Text style={[styles.cardTitle, { color: c.text }, rtl]}>{a._title}</Text> : null}
                    {a._message ? <Text style={[styles.cardMsg, { color: c.textSecondary }, rtl]}>{a._message}</Text> : null}

                    {a._link ? (
                      <TouchableOpacity onPress={() => openLink(a._link)} activeOpacity={0.7} accessibilityRole="link" style={styles.moreBtn}>
                        <Text style={[styles.moreText, { color: a._type.color }]}>{l.readMore}</Text>
                        <AppIcon name="chevronRight" size={14} color={a._type.color} style={isAr ? styles.flipX : null} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </FadeUp>
              );
            })}
          </>
        )}

        {/* ═══ HİCRİ GÜNLƏR (yalnız admin əlavə edibsə) ═══ */}
        {events.length > 0 ? (
          <FadeUp delay={160}>
            <View style={styles.eventsHead}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.eyebrow, { color: c.gold }, rtl]}>{l.eventsEyebrow.toUpperCase()}</Text>
                <Text style={[styles.sectionTitle, { color: c.text, marginBottom: 0 }, rtl]}>{l.eventsTitle}</Text>
              </View>
              <TouchableOpacity onPress={() => go('Calendar')} activeOpacity={0.7} accessibilityRole="button" style={styles.linkBtn}>
                <Text style={[styles.linkBtnText, { color: c.primary }]}>{l.fullCalendar}</Text>
                <AppIcon name="chevronRight" size={14} color={c.primary} style={isAr ? styles.flipX : null} />
              </TouchableOpacity>
            </View>

            <View style={[styles.eventsCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
              {shownEvents.map((ev, i) => (
                <View
                  key={ev.id || `${ev._month}-${ev._day}-${i}`}
                  style={[styles.eventRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}
                >
                  <View style={[styles.eventDate, { backgroundColor: ev._type.color + '1a' }]}>
                    <Text style={[styles.eventDay, { color: ev._type.color }]}>{ev._day}</Text>
                    <Text numberOfLines={2} style={[styles.eventMonth, { color: ev._type.color }]}>{monthNames[ev._month - 1]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.eventHead}>
                      <Text style={[styles.eventName, { color: c.text }, rtl]}>{ev._name}</Text>
                      {today && ev._order === 0 ? (
                        <View style={[styles.newPill, { backgroundColor: c.primary }]}><Text style={styles.newText}>{l.today}</Text></View>
                      ) : null}
                      {today && i === 0 && ev._order > 0 ? (
                        <View style={[styles.newPill, { backgroundColor: c.primary }]}><Text style={styles.newText}>{l.next}</Text></View>
                      ) : null}
                    </View>
                    <Text style={[styles.eventType, { color: c.textMuted }, rtl]}>{ev._type.icon} {typeLabel(ev._type)}</Text>
                    {ev._desc ? <Text style={[styles.eventDesc, { color: c.textSecondary }, rtl]}>{ev._desc}</Text> : null}
                  </View>
                </View>
              ))}
            </View>

            {events.length > EVENTS_PREVIEW ? (
              <TouchableOpacity
                onPress={() => { Haptics.selectionAsync(); setShowAllEvents(v => !v); }}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ expanded: showAllEvents }}
                style={[styles.ghostBtn, styles.moreEvents, { borderColor: c.primaryBorder, backgroundColor: c.primaryBg }]}
              >
                <Text style={[styles.ghostBtnText, { color: c.primary }]}>{showAllEvents ? l.showLess : l.showMore}</Text>
              </TouchableOpacity>
            ) : null}

            <Text style={[styles.note, { color: c.textMuted }, rtl]}>{l.eventsNote}</Text>
          </FadeUp>
        ) : null}
      </View>

      {/* Üzən düymələr (FloatingActions) son məzmunu örtməsin */}
      <View style={{ height: 140 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 18 },

  rtl: { writingDirection: 'rtl', textAlign: 'right' },

  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginBottom: 12 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 2 },

  loadingText: { fontSize: 13, fontWeight: '600', marginTop: 10 },

  // Boş vəziyyət
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 18,
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  emptySub: { fontSize: 13, lineHeight: 19, fontWeight: '500', textAlign: 'center' },
  emptyActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 16 },
  primaryBtnWrap: { borderRadius: BorderRadius.full, overflow: 'hidden' },
  primaryBtn: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: BorderRadius.full },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  ghostBtnText: { fontSize: 14, fontWeight: '800' },

  // Filtr
  chips: { gap: 8, paddingBottom: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 13, fontWeight: '700' },
  chipCount: { minWidth: 22, paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full, alignItems: 'center' },
  chipCountText: { fontSize: 11, fontWeight: '800' },

  // Elan kartı
  card: {
    padding: 16,
    paddingLeft: 20,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  colorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  typePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  typeText: { fontSize: 12, fontWeight: '800' },
  newPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  newText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  dateText: { fontSize: 12, fontWeight: '600' },
  cardTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginBottom: 6 },
  cardMsg: { fontSize: 14, lineHeight: 21, fontWeight: '500' },
  moreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 10, paddingVertical: 4 },

  // Sabitlənmiş ianə kartı
  pinCard: { paddingBottom: 0, marginBottom: 16 },
  pinRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  pinIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  pinCta: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 14,
    marginLeft: -20,
    marginRight: -16,
    borderTopWidth: 1,
  },
  pinBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  pinBtnText: { flexShrink: 1, textAlign: 'center' },
  pinDivider: { width: 1, marginVertical: 10 },
  flipX: { transform: [{ scaleX: -1 }] },
  moreText: { fontSize: 13, fontWeight: '800' },

  // Hicri günlər
  eventsHead: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 14, marginBottom: 12 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4 },
  linkBtnText: { fontSize: 13, fontWeight: '800' },
  eventsCard: { borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  eventDate: { width: 64, paddingVertical: 8, paddingHorizontal: 4, borderRadius: BorderRadius.md, alignItems: 'center' },
  eventDay: { fontSize: 20, fontWeight: '900' },
  eventMonth: { fontSize: 10, fontWeight: '800', textAlign: 'center' },
  eventHead: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  eventName: { flexShrink: 1, fontSize: 15, fontWeight: '800' },
  eventType: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  eventDesc: { fontSize: 13, lineHeight: 19, fontWeight: '500', marginTop: 6 },
  moreEvents: { alignSelf: 'center', marginBottom: 12 },
  note: { fontSize: 12, lineHeight: 18, fontWeight: '500', paddingHorizontal: 4 },
});
