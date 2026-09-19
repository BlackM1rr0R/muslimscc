// ═══════════════════════════════════════════════════════
// Məscid haqqında — web /mosque (src/pages/MosquePage.jsx) ilə eyni məzmun
//
// Bütün məlumat config/mosque.js-dən (MOSQUE) oxunur. Bu REAL bir
// məsciddir: heç bir blok uydurma məlumatla doldurulmur. Sahə boşdursa
// (filled() === false) həmin element ümumiyyətlə göstərilmir; bütöv bölmə
// boş qalanda isə bir sakit "tezliklə" sətri çıxır.
//
// Tarixçədən sonra "Bugünkü namaz vaxtları" kartı (veb MosquePage ilə eyni):
// hooks/useMosqueTimes-dən məscidin koordinatına görə hesablanmış azan və
// camaat vaxtları, növbəti namaz vurğulanır, altında növbəti cümə namazı.
// ═══════════════════════════════════════════════════════

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp } from '../components/Animated';
import { BRAND, MOSQUE, filled, tr, brandName } from '../config/mosque';
import useMosqueTimes, { PRAYER_NAMES } from '../hooks/useMosqueTimes';

// Hero rəngi — brendin yaşıl tonları (HERO_THEMES-də "mosque" açarı yoxdur)
const HERO_GRADIENT = ['#1a6b3a', '#145a30', '#0d4a27'];

const LABELS = {
  az: {
    history: 'Tarixçə', historySoon: 'Məscidin tarixçəsi tezliklə əlavə olunacaq.', founded: 'Tikilmə ili',
    imam: 'İmam', services: 'Xidmətlər',
    contact: 'Əlaqə', address: 'Ünvan', location: 'Yerləşmə', phone: 'Telefon', whatsapp: 'WhatsApp', email: 'E-poçt',
    contactSoon: 'Əlaqə məlumatları tezliklə əlavə olunacaq.',
    map: 'Xəritə', directions: 'Yol tarifi', openMap: 'Xəritədə aç',
    social: 'Sosial şəbəkələr',
    inApp: 'Tətbiqdə', inAppSub: 'Tətbiqin faydalı bölmələri',
    links: {
      Jamaat:        ['Namaz və camaat vaxtları', 'Bugünkü namaz vaxtları'],
      Announcements: ['Elanlar', 'Xəbərlər və elanlar'],
      Donate:        ['İanə', 'Məscidə necə dəstək olmaq olar'],
      PrayerGuide:   ['Namaz bələdçisi', 'Namazı addım-addım öyrən'],
      Quran:         ['Qurani-Kərim', 'Surələri oxu'],
    },
  },
  en: {
    history: 'History', historySoon: 'The mosque’s history will be added soon.', founded: 'Built in',
    imam: 'Imam', services: 'Services',
    contact: 'Contact', address: 'Address', location: 'Location', phone: 'Phone', whatsapp: 'WhatsApp', email: 'Email',
    contactSoon: 'Contact details will be added soon.',
    map: 'Map', directions: 'Get directions', openMap: 'Open in Maps',
    social: 'Social media',
    inApp: 'In the app', inAppSub: 'Useful sections of the app',
    links: {
      Jamaat:        ['Prayer & congregation times', 'Today’s prayer times'],
      Announcements: ['Announcements', 'News and announcements'],
      Donate:        ['Donate', 'How to support the mosque'],
      PrayerGuide:   ['Prayer guide', 'Learn to pray step by step'],
      Quran:         ['The Holy Quran', 'Read the surahs'],
    },
  },
  ru: {
    history: 'История', historySoon: 'История мечети скоро будет добавлена.', founded: 'Год постройки',
    imam: 'Имам', services: 'Услуги',
    contact: 'Контакты', address: 'Адрес', location: 'Расположение', phone: 'Телефон', whatsapp: 'WhatsApp', email: 'Эл. почта',
    contactSoon: 'Контактные данные скоро будут добавлены.',
    map: 'Карта', directions: 'Проложить маршрут', openMap: 'Открыть на карте',
    social: 'Соцсети',
    inApp: 'В приложении', inAppSub: 'Полезные разделы приложения',
    links: {
      Jamaat:        ['Время намаза и джамаата', 'Время намаза на сегодня'],
      Announcements: ['Объявления', 'Новости и объявления'],
      Donate:        ['Пожертвование', 'Как поддержать мечеть'],
      PrayerGuide:   ['Как совершать намаз', 'Пошаговое руководство'],
      Quran:         ['Священный Коран', 'Читать суры'],
    },
  },
  ar: {
    history: 'نبذة تاريخية', historySoon: 'سيُضاف تاريخ المسجد قريبًا.', founded: 'سنة البناء',
    imam: 'الإمام', services: 'الخدمات',
    contact: 'التواصل', address: 'العنوان', location: 'المكان', phone: 'الهاتف', whatsapp: 'واتساب', email: 'البريد الإلكتروني',
    contactSoon: 'ستُضاف بيانات التواصل قريبًا.',
    map: 'الخريطة', directions: 'الاتجاهات', openMap: 'افتح في الخرائط',
    social: 'وسائل التواصل الاجتماعي',
    inApp: 'في التطبيق', inAppSub: 'أقسام مفيدة في التطبيق',
    links: {
      Jamaat:        ['مواقيت الصلاة والجماعة', 'مواقيت صلاة اليوم'],
      Announcements: ['الإعلانات', 'الأخبار والإعلانات'],
      Donate:        ['التبرع', 'كيف تدعم المسجد'],
      PrayerGuide:   ['دليل الصلاة', 'تعلّم الصلاة خطوة بخطوة'],
      Quran:         ['القرآن الكريم', 'اقرأ السور'],
    },
  },
  tr: {
    history: 'Tarihçe', historySoon: 'Caminin tarihçesi yakında eklenecek.', founded: 'Yapım yılı',
    imam: 'İmam', services: 'Hizmetler',
    contact: 'İletişim', address: 'Adres', location: 'Konum', phone: 'Telefon', whatsapp: 'WhatsApp', email: 'E-posta',
    contactSoon: 'İletişim bilgileri yakında eklenecek.',
    map: 'Harita', directions: 'Yol tarifi', openMap: 'Haritada aç',
    social: 'Sosyal medya',
    inApp: 'Uygulamada', inAppSub: 'Uygulamanın faydalı bölümleri',
    links: {
      Jamaat:        ['Namaz ve cemaat vakitleri', 'Bugünün namaz vakitleri'],
      Announcements: ['Duyurular', 'Haberler ve duyurular'],
      Donate:        ['Bağış', 'Camiye nasıl destek olunur'],
      PrayerGuide:   ['Namaz rehberi', 'Adım adım namaz öğren'],
      Quran:         ['Kur’an-ı Kerim', 'Sureleri oku'],
    },
  },
};

// "Tətbiqdə" bloku — bunlar TƏTBİQİN bölmələridir, məscid haqqında iddia deyil
const APP_LINKS = [
  { route: 'Jamaat',        icon: '🕌' },
  { route: 'Announcements', icon: '📢' },
  { route: 'Donate',        icon: '💚' },
  { route: 'PrayerGuide',   icon: '🤲' },
  { route: 'Quran',         icon: '📖' },
];

// ── Bugünkü vaxtlar kartı (veb src/pages/MosquePage.jsx TODAY_LABELS ilə eyni) ──
// note — azan vaxtlarının hesablandığı (useMosqueTimes qaydası: "hesablanmış"
// kimi qeyd olunmalıdır); rule — camaat vaxtlarının azana görə təyin olunduğu
// (yalnız "+N" qaydası olanda göstərilir).
const TODAY_LABELS = {
  az: { title: 'Bugünkü namaz vaxtları', prayer: 'Namaz', adhan: 'Azan', jamaat: 'Camaat', next: 'Növbəti', jumua: 'Cümə namazı', today: 'bu gün', all: 'Bütün vaxtlar', loading: 'Yüklənir…', error: 'Vaxtları yükləmək alınmadı.', retry: 'Yenidən cəhd et',
    note: 'Azan vaxtları məscidin koordinatına görə aladhan.com ilə hesablanıb.', calc: 'Azan vaxtları aladhan.com ilə hesablanıb.', rule: 'Camaat vaxtları azan vaxtına görə müəyyən edilir.' },
  en: { title: 'Today’s prayer times', prayer: 'Prayer', adhan: 'Adhan', jamaat: 'Congregation', next: 'Next', jumua: 'Friday prayer', today: 'today', all: 'All times', loading: 'Loading…', error: 'Could not load the times.', retry: 'Try again',
    note: 'Adhan times are calculated for the mosque’s coordinates via aladhan.com.', calc: 'Adhan times are calculated via aladhan.com.', rule: 'Congregation times are set from the adhan times.' },
  ru: { title: 'Время намаза сегодня', prayer: 'Намаз', adhan: 'Азан', jamaat: 'Джамаат', next: 'Следующий', jumua: 'Пятничный намаз', today: 'сегодня', all: 'Всё расписание', loading: 'Загрузка…', error: 'Не удалось загрузить время.', retry: 'Повторить',
    note: 'Время азана рассчитано по координатам мечети через aladhan.com.', calc: 'Время азана рассчитано через aladhan.com.', rule: 'Время джамаата определяется по времени азана.' },
  ar: { title: 'مواقيت الصلاة اليوم', prayer: 'الصلاة', adhan: 'الأذان', jamaat: 'الجماعة', next: 'التالية', jumua: 'صلاة الجمعة', today: 'اليوم', all: 'كل المواقيت', loading: 'جارٍ التحميل…', error: 'تعذّر تحميل المواقيت.', retry: 'إعادة المحاولة',
    note: 'أوقات الأذان محسوبة وفق إحداثيات المسجد عبر aladhan.com.', calc: 'أوقات الأذان محسوبة عبر aladhan.com.', rule: 'تُحدَّد أوقات الجماعة بحسب وقت الأذان.' },
  tr: { title: 'Bugünkü namaz vakitleri', prayer: 'Namaz', adhan: 'Ezan', jamaat: 'Cemaat', next: 'Sıradaki', jumua: 'Cuma namazı', today: 'bugün', all: 'Tüm vakitler', loading: 'Yükleniyor…', error: 'Vakitler yüklenemedi.', retry: 'Tekrar dene',
    note: 'Ezan vakitleri caminin koordinatlarına göre aladhan.com ile hesaplanmıştır.', calc: 'Ezan vakitleri aladhan.com ile hesaplanmıştır.', rule: 'Cemaat vakitleri ezan vaktine göre belirlenir.' },
};

// Cümə tarixi — Intl hər cihazda bütün dilləri dəstəkləmir, ona görə ay adları əl ilə
const MONTHS = {
  az: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  tr: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
};

// Fərz namazları — cədvəldə günəş göstərilmir (namaz deyil)
const FARD = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/** 'DD-MM-YYYY' → "25 sentyabr" (il və həftə günü olmadan). */
function formatDayMonth(dateKey, lang) {
  const [d, m] = String(dateKey || '').split('-').map(Number);
  if (!d || !m) return '';
  return `${d} ${(MONTHS[lang] || MONTHS.en)[m - 1]}`;
}

/** "+N" (azandan N dəqiqə sonra) qaydasıdırmı. */
const isRelRule = (rule) => /^\+\d{1,3}$/.test(String(rule || '').trim());

const SOCIAL_ORDER = ['instagram', 'facebook', 'youtube', 'telegram'];
const SOCIAL_NAMES = { instagram: 'Instagram', facebook: 'Facebook', youtube: 'YouTube', telegram: 'Telegram' };

// ── Köməkçilər ──
const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`;

// wa.me yalnız beynəlxalq formatda rəqəm qəbul edir (+ və boşluqsuz).
// Yerli AZ formatı (0XX...) verilibsə, 0 → 994 çevrilir.
function waHref(num) {
  let digits = num.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0') && digits.length === 10) digits = '994' + digits.slice(1);
  return `https://wa.me/${digits}`;
}

/** Çoxabzaslı mətni (boş sətirlə ayrılmış) abzaslara böl. */
const paragraphs = (text) => text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

function openLink(url) {
  if (!url) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  Linking.openURL(url).catch(() => {});
}

// ── Bugünkü namaz vaxtları kartı ──
function MosqueTodayCard({ lang, c, cardStyle, isAr, onAll }) {
  const L = TODAY_LABELS[lang] || TODAY_LABELS.en;
  const { loading, error, prayers, next, nextFriday, exact, reload } = useMosqueTimes();
  const rows = (prayers || []).filter(p => FARD.includes(p.key));
  const hasRows = rows.length > 0;
  const name = (key) => PRAYER_NAMES[key]?.[lang] || PRAYER_NAMES[key]?.en || key;
  const rtl = isAr ? styles.rtl : null;

  const nf = nextFriday || null;
  const jumuaDate = nf?.date ? (nf.isToday ? L.today : formatDayMonth(nf.date, lang)) : '';
  // Camaat qaydası "+N" (azandan sonra) olan sətir varsa, bunu açıq deyirik
  const anyRelative = rows.some(p => filled(p.jamaat) && isRelRule(p.rule));

  const retry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    reload();
  };

  return (
    <View style={cardStyle}>
      <View style={styles.cardHead}>
        <View style={[styles.cardIconWrap, { backgroundColor: c.primaryBg2 }]}>
          <AppIcon name="time" size={20} color={c.primary} />
        </View>
        <Text style={[styles.cardTitle, { color: c.text }, rtl]} accessibilityRole="header">{L.title}</Text>
      </View>

      {/* Yüklənir — hündürlük sabit qalır ki, ekran tullanmasın */}
      {loading ? (
        <View style={styles.timesState}>
          <ActivityIndicator color={c.primary} />
          <Text style={[styles.timesStateText, { color: c.textMuted }]}>{L.loading}</Text>
        </View>
      ) : null}

      {!loading && error && !hasRows ? (
        <View style={styles.timesState} accessibilityRole="alert">
          <Text style={[styles.timesStateText, { color: c.textSecondary }]}>{L.error}</Text>
          <TouchableOpacity
            onPress={retry}
            activeOpacity={0.8}
            accessibilityRole="button"
            style={[styles.timesRetry, { borderColor: c.primaryBorder, backgroundColor: c.primaryBg }]}
          >
            <AppIcon name="reset" size={14} color={c.primary} />
            <Text style={[styles.timesRetryText, { color: c.primary }]}>{L.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {hasRows ? (
        <View style={[styles.timesTable, { borderColor: c.border }]}>
          <View style={[styles.timesRow, styles.timesHeadRow, { backgroundColor: c.surfaceAlt }]}>
            {/* Sətirlərdəki namaz adları ilə eyni quruluş — hər ikisi sətrin başlanğıcından düzlənir (RTL-də sətir özü çevrilir) */}
            <View style={[styles.timesNameCol, styles.timesNameWrap]}>
              <Text style={[styles.timesHeadCell, { color: c.textMuted }]} numberOfLines={1}>{L.prayer}</Text>
            </View>
            <Text style={[styles.timesHeadCell, styles.timesCol, { color: c.textMuted }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{L.adhan}</Text>
            <Text style={[styles.timesHeadCell, styles.timesCol, { color: c.textMuted }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{L.jamaat}</Text>
          </View>
          {rows.map((p) => {
            // İşadan sonra "növbəti" sabahın sübhüdür — bugünkü (keçmiş) sübh sətri işarələnmir
            const isNext = !!next && !next.tomorrow && next.key === p.key;
            const hasJ = filled(p.jamaat);
            return (
              <View
                key={p.key}
                accessible
                accessibilityLabel={`${name(p.key)}${isNext ? ` (${L.next})` : ''}: ${L.adhan} ${p.adhan}, ${L.jamaat} ${hasJ ? p.jamaat : '—'}`}
                style={[
                  styles.timesRow,
                  { borderTopColor: c.border },
                  isNext && { backgroundColor: c.primaryBg2 },
                ]}
              >
                <View style={[styles.timesNameCol, styles.timesNameWrap]}>
                  <Text style={[styles.timesName, { color: isNext ? c.primary : c.text }]} numberOfLines={1}>{name(p.key)}</Text>
                  {isNext ? (
                    <View style={[styles.timesChip, { backgroundColor: c.primary }]}>
                      <Text style={[styles.timesChipText, { color: c.background }]} numberOfLines={1}>{L.next}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.timesCol, styles.timesAdhan, styles.ltr, { color: c.textSecondary }]}>{p.adhan}</Text>
                <Text style={[styles.timesCol, styles.timesJamaat, styles.ltr, { color: hasJ ? c.primary : c.textMuted }]}>
                  {hasJ ? p.jamaat : '—'}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {/* Növbəti cümə namazı (cümə qaydası təyin olunubsa) */}
      {nf && filled(nf.time) ? (
        <View style={[styles.timesJumua, { backgroundColor: c.goldBg, borderColor: c.gold + '44' }]}>
          <Text style={[styles.timesJumuaText, { color: c.text }, rtl]} numberOfLines={2}>
            🕌 {L.jumua}{jumuaDate ? ` · ${jumuaDate}` : ''}
          </Text>
          <Text style={[styles.timesJumuaTime, styles.ltr, { color: c.gold }]}>{nf.time}</Text>
        </View>
      ) : null}

      {hasRows ? (
        <Text style={[styles.timesNote, { color: c.textMuted }, rtl]}>
          {exact ? L.note : L.calc}{anyRelative ? ` ${L.rule}` : ''}
        </Text>
      ) : null}

      <TouchableOpacity
        onPress={onAll}
        activeOpacity={0.8}
        accessibilityRole="button"
        style={[styles.timesMore, { borderColor: c.primaryBorder, backgroundColor: c.primaryBg }]}
      >
        <Text style={[styles.timesMoreText, { color: c.primary }]}>{L.all}</Text>
        <AppIcon name="chevronRight" size={16} color={c.primary} style={isAr ? styles.flipX : null} />
      </TouchableOpacity>
    </View>
  );
}

export default function MosqueScreen({ navigation }) {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const sh = dark ? Shadows.dark.sm : Shadows.sm;
  const l = LABELS[lang] || LABELS.en;
  const isAr = lang === 'ar';

  const go = (route) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { navigation?.navigate?.(route); } catch {}
  };

  // ── Məlumat (yalnız doldurulmuş sahələr) ──
  const history    = tr(MOSQUE.history, lang);
  const hasHistory = filled(history);
  const hasFounded = filled(MOSQUE.founded);

  // Ad adətən sadə sətirdir; tr() həm sətri, həm çoxdilli obyekti qəbul edir
  const imamName = tr(MOSQUE.imam?.name, lang).trim();
  const imamBio  = tr(MOSQUE.imam?.bio, lang);
  const hasImam  = filled(imamName);

  const services = (MOSQUE.services || []).map(s => tr(s, lang)).filter(filled);

  const address  = tr(MOSQUE.address, lang);
  const locality = tr(MOSQUE.locality, lang);
  const phone    = filled(MOSQUE.phone) ? MOSQUE.phone.trim() : '';
  const whatsapp = filled(MOSQUE.whatsapp) ? MOSQUE.whatsapp.trim() : '';
  const email    = filled(MOSQUE.email) ? MOSQUE.email.trim() : '';
  const socials  = SOCIAL_ORDER
    .filter(k => filled(MOSQUE.social?.[k]))
    .map(k => ({ key: k, url: MOSQUE.social[k].trim() }));

  const hasAnyContact = filled(address) || !!phone || !!whatsapp || !!email || socials.length > 0;

  const { lat, lng } = MOSQUE.geo || {};
  const hasGeo    = filled(lat) && filled(lng);
  const hasMapUrl = filled(MOSQUE.mapUrl);
  const directionsUrl = hasGeo
    ? `https://www.google.com/maps/dir/?api=1&destination=${Number(lat)},${Number(lng)}`
    : '';

  // Əlaqə sətirləri — yalnız doldurulanlar (yerləşmə sətri həmişə var: addan məlumdur)
  const contactRows = [
    {
      key: 'place', icon: '📍',
      label: filled(address) ? l.address : l.location,
      value: filled(address) ? address : locality,
      sub: filled(address) ? locality : '',
      url: '', ltr: false,
    },
  ];
  if (phone)    contactRows.push({ key: 'phone', icon: '📞', label: l.phone, value: phone, url: telHref(phone), ltr: true });
  if (whatsapp) contactRows.push({ key: 'whatsapp', icon: '💬', label: l.whatsapp, value: whatsapp, url: waHref(whatsapp), ltr: true });
  if (email)    contactRows.push({ key: 'email', icon: '✉️', label: l.email, value: email, url: `mailto:${email}`, ltr: true });

  const cardStyle = [styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }, sh];

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero
        arabic={BRAND.arabicMotto || 'المسجد'}
        title={brandName(lang)}
        subtitle={locality}
        gradient={HERO_GRADIENT}
      />

      <View style={styles.content}>

        {/* ── Tarixçə ── */}
        <FadeUp delay={100}>
          <View style={cardStyle}>
            <LinearGradient
              colors={[c.primary + '10', 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0.6 }}
            />
            <View style={styles.cardHead}>
              <View style={[styles.cardIconWrap, { backgroundColor: c.primaryBg2 }]}>
                <AppIcon name="history" size={20} color={c.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: c.text }]}>{l.history}</Text>
            </View>

            {hasFounded ? (
              <View style={[styles.chip, { backgroundColor: c.goldBg, borderColor: c.gold + '40' }]}>
                <Text style={[styles.chipText, { color: c.gold }]}>
                  {l.founded}: {String(MOSQUE.founded).trim()}
                </Text>
              </View>
            ) : null}

            {hasHistory ? (
              paragraphs(history).map((p, i) => (
                <Text key={i} style={[styles.prose, { color: c.textSecondary }, isAr && styles.rtl]}>{p}</Text>
              ))
            ) : (
              <Text style={[styles.soon, { color: c.textMuted }, isAr && styles.rtl]}>{l.historySoon}</Text>
            )}
          </View>
        </FadeUp>

        {/* ── Bugünkü namaz vaxtları (azan + camaat, növbəti cümə) ── */}
        <FadeUp delay={140}>
          <MosqueTodayCard lang={lang} c={c} cardStyle={cardStyle} isAr={isAr} onAll={() => go('Jamaat')} />
        </FadeUp>

        {/* ── İmam (yalnız ad doldurulubsa) ── */}
        {hasImam ? (
          <FadeUp delay={160}>
            <View style={cardStyle}>
              <View style={styles.imamRow}>
                <LinearGradient colors={[c.primary, c.primaryDark]} style={styles.imamAvatar}>
                  <Text style={styles.imamAvatarText}>☽</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eyebrow, { color: c.textMuted }]}>{l.imam.toUpperCase()}</Text>
                  <Text style={[styles.imamName, { color: c.text }]}>{imamName}</Text>
                </View>
              </View>
              {filled(imamBio) ? paragraphs(imamBio).map((p, i) => (
                <Text key={i} style={[styles.prose, { color: c.textSecondary, marginTop: i === 0 ? 12 : 0 }, isAr && styles.rtl]}>{p}</Text>
              )) : null}
            </View>
          </FadeUp>
        ) : null}

        {/* ── Xidmətlər (yalnız siyahı doludursa) ── */}
        {services.length > 0 ? (
          <FadeUp delay={200}>
            <View style={cardStyle}>
              <View style={styles.cardHead}>
                <View style={[styles.cardIconWrap, { backgroundColor: c.primaryBg2 }]}>
                  <AppIcon name="check" size={20} color={c.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: c.text }]}>{l.services}</Text>
              </View>
              {services.map((s, i) => (
                <View key={i} style={styles.serviceRow}>
                  <Text style={[styles.bullet, { color: c.gold }]}>✦</Text>
                  <Text style={[styles.serviceText, { color: c.text }, isAr && styles.rtl]}>{s}</Text>
                </View>
              ))}
            </View>
          </FadeUp>
        ) : null}

        {/* ── Əlaqə ── */}
        <FadeUp delay={240}>
          <View style={cardStyle}>
            <View style={styles.cardHead}>
              <View style={[styles.cardIconWrap, { backgroundColor: c.primaryBg2 }]}>
                <AppIcon name="location" size={20} color={c.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: c.text }]}>{l.contact}</Text>
            </View>

            {contactRows.map((row, i) => {
              const rowStyle = [styles.contactRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }];
              const body = (
                <>
                  <Text style={styles.contactIcon}>{row.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.contactLabel, { color: c.textMuted }]}>{row.label}</Text>
                    <Text
                      style={[
                        styles.contactValue,
                        { color: row.url ? c.primary : c.text },
                        row.ltr ? styles.ltr : (isAr && styles.rtl),
                      ]}
                    >
                      {row.value}
                    </Text>
                    {row.sub ? <Text style={[styles.contactSub, { color: c.textMuted }]}>{row.sub}</Text> : null}
                  </View>
                  {row.url ? <AppIcon name="chevronRight" size={16} color={c.textMuted} style={isAr ? styles.flipX : null} /> : null}
                </>
              );
              // Linki olmayan sətir (yerləşmə) düymə deyil — sadə View
              return row.url ? (
                <TouchableOpacity
                  key={row.key}
                  onPress={() => openLink(row.url)}
                  activeOpacity={0.7}
                  accessibilityRole="link"
                  accessibilityLabel={`${row.label}: ${row.value}`}
                  style={rowStyle}
                >
                  {body}
                </TouchableOpacity>
              ) : (
                <View key={row.key} style={rowStyle}>{body}</View>
              );
            })}

            {!hasAnyContact ? (
              <Text style={[styles.soon, { color: c.textMuted, marginTop: 6 }, isAr && styles.rtl]}>{l.contactSoon}</Text>
            ) : null}

            {socials.length > 0 ? (
              <View style={[styles.socialWrap, { borderTopColor: c.border }]}>
                <Text style={[styles.contactLabel, { color: c.textMuted }]}>{l.social}</Text>
                <View style={styles.socialRow}>
                  {socials.map(s => (
                    <TouchableOpacity
                      key={s.key}
                      onPress={() => openLink(s.url)}
                      activeOpacity={0.8}
                      style={[styles.socialBtn, { backgroundColor: c.primaryBg, borderColor: c.primaryBorder }]}
                    >
                      <Text style={[styles.socialText, { color: c.primary }]}>{SOCIAL_NAMES[s.key]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </FadeUp>

        {/* ── Xəritə — WebView asılılığı yoxdur: yalnız xarici xəritəni açan düymələr ── */}
        {(hasGeo || hasMapUrl) ? (
          <FadeUp delay={280}>
            <View style={cardStyle}>
              <View style={styles.cardHead}>
                <View style={[styles.cardIconWrap, { backgroundColor: c.primaryBg2 }]}>
                  <AppIcon name="map" size={20} color={c.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: c.text }]}>{l.map}</Text>
              </View>
              <View style={styles.mapActions}>
                {hasGeo ? (
                  <TouchableOpacity onPress={() => openLink(directionsUrl)} activeOpacity={0.85} style={styles.mapBtnWrap}>
                    <LinearGradient colors={[c.primary, c.primaryDark]} style={styles.mapBtnPrimary}>
                      <Text style={styles.mapBtnPrimaryText}>🧭 {l.directions}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : null}
                {hasMapUrl ? (
                  hasGeo ? (
                    <TouchableOpacity
                      onPress={() => openLink(MOSQUE.mapUrl.trim())}
                      activeOpacity={0.85}
                      style={[styles.mapBtnWrap, styles.mapBtnSecondary, { borderColor: c.primaryBorder, backgroundColor: c.primaryBg }]}
                    >
                      <Text style={[styles.mapBtnSecondaryText, { color: c.primary }]}>{l.openMap}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => openLink(MOSQUE.mapUrl.trim())} activeOpacity={0.85} style={styles.mapBtnWrap}>
                      <LinearGradient colors={[c.primary, c.primaryDark]} style={styles.mapBtnPrimary}>
                        <Text style={styles.mapBtnPrimaryText}>🗺️ {l.openMap}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )
                ) : null}
              </View>
            </View>
          </FadeUp>
        ) : null}

        {/* ── Tətbiqdə: tətbiqin məscidlə bağlı bölmələri (həmişə görünür) ── */}
        <FadeUp delay={320}>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>{l.inApp.toUpperCase()}</Text>
          <Text style={[styles.sectionSub, { color: c.textMuted }]}>{l.inAppSub}</Text>
        </FadeUp>

        {APP_LINKS.map((item, i) => {
          const [title, desc] = l.links[item.route];
          return (
            <FadeUp key={item.route} delay={360 + i * 50}>
              <TouchableOpacity
                onPress={() => go(item.route)}
                activeOpacity={0.85}
                style={[styles.linkTile, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}
              >
                <View style={[styles.linkIconWrap, { backgroundColor: c.primaryBg }]}>
                  <Text style={styles.linkIcon}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.linkTitle, { color: c.text }]}>{title}</Text>
                  <Text style={[styles.linkDesc, { color: c.textMuted }]}>{desc}</Text>
                </View>
                <AppIcon name="chevronRight" size={18} color={c.textMuted} style={isAr ? styles.flipX : null} />
              </TouchableOpacity>
            </FadeUp>
          );
        })}
      </View>

      {/* Üzən düymələr (FloatingActions) son məzmunu örtməsin */}
      <View style={{ height: 140 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },

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
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardIconWrap: { width: 40, height: 40, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },

  chip: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: BorderRadius.full, borderWidth: 1, marginBottom: 10 },
  chipText: { fontSize: 12, fontWeight: '800' },

  prose: { fontSize: 15, lineHeight: 24, fontWeight: '500', marginBottom: 10 },
  soon: { fontSize: 14, lineHeight: 21, fontWeight: '500', fontStyle: 'italic' },

  // İmam
  imamRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  imamAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  imamAvatarText: { fontSize: 26, color: '#fff' },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 2 },
  imamName: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },

  // Xidmətlər
  serviceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 5 },
  bullet: { fontSize: 13, lineHeight: 22 },
  serviceText: { flex: 1, fontSize: 15, lineHeight: 22, fontWeight: '600' },

  // Əlaqə
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  contactIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  contactLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 },
  contactValue: { fontSize: 15, fontWeight: '700' },
  contactSub: { fontSize: 13, fontWeight: '500', marginTop: 2 },

  socialWrap: { borderTopWidth: 1, paddingTop: 12, marginTop: 6 },
  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  socialBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: BorderRadius.full, borderWidth: 1 },
  socialText: { fontSize: 13, fontWeight: '800' },

  // Bugünkü namaz vaxtları
  timesState: { alignItems: 'center', gap: 8, paddingVertical: 22 },
  timesStateText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  timesRetry: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, minHeight: 40, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  timesRetryText: { fontSize: 13, fontWeight: '800' },
  timesTable: { borderWidth: 1, borderRadius: BorderRadius.md, overflow: 'hidden' },
  timesRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, minHeight: 46, borderTopWidth: 1 },
  timesHeadRow: { minHeight: 34, borderTopWidth: 0 },
  timesHeadCell: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  timesNameCol: { flex: 1, minWidth: 0 },
  timesNameWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timesName: { flexShrink: 1, fontSize: 15, fontWeight: '800' },
  timesChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: BorderRadius.full },
  timesChipText: { fontSize: 10, fontWeight: '800' },
  timesCol: { width: 76, textAlign: 'center' },
  timesAdhan: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  timesJamaat: { fontSize: 16, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timesJumua: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  timesJumuaText: { flex: 1, fontSize: 14, fontWeight: '700' },
  timesJumuaTime: { fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timesNote: { fontSize: 12, lineHeight: 18, fontWeight: '500', marginTop: 12 },
  timesMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 46,
    marginTop: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  timesMoreText: { fontSize: 15, fontWeight: '800' },

  // Xəritə
  mapActions: { gap: 10 },
  mapBtnWrap: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  mapBtnPrimary: { paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', borderRadius: BorderRadius.md },
  mapBtnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  mapBtnSecondary: { paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center', borderWidth: 1.5 },
  mapBtnSecondaryText: { fontSize: 15, fontWeight: '800' },

  // Tətbiqdə
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginTop: 10 },
  sectionSub: { fontSize: 13, fontWeight: '500', marginTop: 2, marginBottom: 12 },
  linkTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 10,
  },
  linkIconWrap: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  linkIcon: { fontSize: 22 },
  linkTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  linkDesc: { fontSize: 12, fontWeight: '500' },
});
