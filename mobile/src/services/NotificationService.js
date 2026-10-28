import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { BRAND, tr } from '../config/brand';
import { cityById, loadPrayerLocation, setPrayerCity } from './prayerLocation';

// Default notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ═══ 5 NAMAZ VAXTI MESAJLARI ═══
// Mətnin sonuna seçilmiş şəhər əlavə olunur: "… (Bakı)" — bax: withCity()
const PRAYER_MESSAGES = {
  Fajr: {
    az: { title:'🌅 Sübh namazı', body:'Sübh namazı vaxtı yetişdi. Namazınızı qılın.' },
    en: { title:'🌅 Fajr Prayer', body:'Time for Fajr prayer. May Allah accept your prayer.' },
    ru: { title:'🌅 Фаджр намаз', body:'Время Фаджр намаза. Совершите молитву.' },
    ar: { title:'🌅 صلاة الفجر', body:'حان وقت صلاة الفجر. تقبل الله منكم.' },
    tr: { title:'🌅 Sabah Namazı', body:'Sabah namazı vakti girdi.' },
  },
  Dhuhr: {
    az: { title:'☀️ Zöhr namazı', body:'Zöhr namazı vaxtı yetişdi.' },
    en: { title:'☀️ Dhuhr Prayer', body:'Time for Dhuhr prayer.' },
    ru: { title:'☀️ Зухр намаз', body:'Время Зухр намаза.' },
    ar: { title:'☀️ صلاة الظهر', body:'حان وقت صلاة الظهر.' },
    tr: { title:'☀️ Öğle Namazı', body:'Öğle namazı vakti girdi.' },
  },
  Asr: {
    az: { title:'🌇 Əsr namazı', body:'Əsr namazı vaxtı yetişdi.' },
    en: { title:'🌇 Asr Prayer', body:'Time for Asr prayer.' },
    ru: { title:'🌇 Аср намаз', body:'Время Аср намаза.' },
    ar: { title:'🌇 صلاة العصر', body:'حان وقت صلاة العصر.' },
    tr: { title:'🌇 İkindi Namazı', body:'İkindi namazı vakti girdi.' },
  },
  Maghrib: {
    az: { title:'🌆 Məğrib namazı', body:'Məğrib namazı vaxtı yetişdi.' },
    en: { title:'🌆 Maghrib Prayer', body:'Time for Maghrib prayer.' },
    ru: { title:'🌆 Магриб намаз', body:'Время Магриб намаза.' },
    ar: { title:'🌆 صلاة المغرب', body:'حان وقت صلاة المغرب.' },
    tr: { title:'🌆 Akşam Namazı', body:'Akşam namazı vakti girdi.' },
  },
  Isha: {
    az: { title:'🌙 İşa namazı', body:'İşa namazı vaxtı yetişdi.' },
    en: { title:'🌙 Isha Prayer', body:'Time for Isha prayer.' },
    ru: { title:'🌙 Иша намаз', body:'Время Иша намаза.' },
    ar: { title:'🌙 صلاة العشاء', body:'حان وقت صلاة العشاء.' },
    tr: { title:'🌙 Yatsı Namazı', body:'Yatsı namazı vakti girdi.' },
  },
};

const ADHKAR_MESSAGES = {
  morning: {
    az: { title:'☀️ Səhər əzkarı', body:'Gün başlamağa yaxındır, səhər əzkarınızı oxumağı unutmayın.' },
    en: { title:'☀️ Morning Adhkar', body:"Don't forget your morning adhkar to start the day." },
    ru: { title:'☀️ Утренние азкары', body:'Не забудьте утренние азкары.' },
    ar: { title:'☀️ أذكار الصباح', body:'لا تنسَ أذكار الصباح.' },
    tr: { title:'☀️ Sabah Ezkarı', body:'Sabah ezkarınızı unutmayın.' },
  },
  evening: {
    az: { title:'🌙 Axşam əzkarı', body:'Gün bitir, axşam əzkarınızı oxumağı unutmayın.' },
    en: { title:'🌙 Evening Adhkar', body:"Don't forget your evening adhkar." },
    ru: { title:'🌙 Вечерние азкары', body:'Не забудьте вечерние азкары.' },
    ar: { title:'🌙 أذكار المساء', body:'لا تنسَ أذكار المساء.' },
    tr: { title:'🌙 Akşam Ezkarı', body:'Akşam ezkarınızı unutmayın.' },
  },
  daily_hadith: {
    az: { title:'📚 Günün Hədisi', body:'Bugünkü hədisi oxumağı unutmayın.' },
    en: { title:'📚 Daily Hadith', body:"Check today's hadith." },
    ru: { title:'📚 Хадис дня', body:'Прочтите хадис дня.' },
    ar: { title:'📚 حديث اليوم', body:'لا تنسَ حديث اليوم.' },
    tr: { title:'📚 Günün Hadisi', body:'Bugünkü hadisi okumayı unutmayın.' },
  },
};

// Android bildiriş kanallarının adları (telefonun Parametrlər ekranında görünür)
const CHANNEL_NAMES = {
  prayer: { az: 'Namaz bildirişləri', en: 'Prayer notifications', ru: 'Уведомления о намазе', ar: 'إشعارات الصلاة', tr: 'Namaz bildirimleri' },
  adhkar: { az: 'Əzkar xatırlatmaları', en: 'Adhkar reminders', ru: 'Напоминания об азкарах', ar: 'تذكيرات الأذكار', tr: 'Ezkar hatırlatmaları' },
  daily:  { az: 'Gündəlik xatırlatmalar', en: 'Daily reminders', ru: 'Ежедневные напоминания', ar: 'تذكيرات يومية', tr: 'Günlük hatırlatmalar' },
};

/** Mətnin sonuna şəhər adını əlavə et: "… (Bakı)". Şəhər yoxdursa mətn olduğu kimi. */
function withCity(body, cityName) {
  return cityName ? `${body} (${cityName})` : body;
}

// ═══ İCAZƏ ALMAQ ═══
export async function requestPermissions(lang = 'az') {
  if (!Device.isDevice) return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer', {
      name: tr(CHANNEL_NAMES.prayer, lang),
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1a6b3a',
    });
    await Notifications.setNotificationChannelAsync('adhkar', {
      name: tr(CHANNEL_NAMES.adhkar, lang),
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('daily', {
      name: tr(CHANNEL_NAMES.daily, lang),
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return finalStatus === 'granted';
}

// ═══ SEÇİLMİŞ ŞƏHƏRİN NAMAZ VAXTLARINI ALMAQ ═══
// Yer — istifadəçinin seçdiyi şəhər (services/prayerLocation: Namaz ekranı,
// ana səhifə və "Camaat və Cümə namazı" ekranı ilə ortaq). Vaxtlar
// koordinat və metodla hesablanır (hooks/usePrayerTimes ilə eyni nəticə).
// iso8601=true: hər vaxt UTC fərqi ilə gəlir ("2026-10-27T05:12:00+04:00") —
// cihaz başqa saat qurşağındadırsa bildiriş yenə şəhərin azan anında gəlir.
// Köhnə çağırış forması (city, country) da qəbul olunur: city — şəhər id-si
// və ya köhnə aladhan adı ('Baku', 'Makkah'); siyahıda yoxdursa timingsByCity.
export async function fetchPrayerTimes(city, country) {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();

  const known = city ? cityById(city) : null;
  const loc = known
    ? { lat: known.lat, lng: known.lng, method: known.method || 13 }
    : (city ? null : await loadPrayerLocation());

  const url = loc
    ? `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}` +
      `?latitude=${loc.lat}&longitude=${loc.lng}&method=${loc.method}&iso8601=true`
    : `https://api.aladhan.com/v1/timingsByCity/${dd}-${mm}-${yyyy}` +
      `?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country || '')}&method=13&iso8601=true`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.timings || null;
  } catch {
    return null;
  }
}

/**
 * aladhan vaxtı → cihazın yerli saatı ilə { hours, minutes }.
 * ISO formatda (UTC fərqi ilə) gəlibsə cihazın saat qurşağına çevrilir;
 * köhnə "05:12" formatında olduğu kimi götürülür. Tanınmırsa null.
 */
function toDeviceTime(value) {
  const s = String(value || '');
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
    const d = new Date(s);
    if (Number.isFinite(d.getTime())) return { hours: d.getHours(), minutes: d.getMinutes() };
  }
  const hm = s.match(/(\d{1,2}):(\d{2})/);
  return hm ? { hours: Number(hm[1]), minutes: Number(hm[2]) } : null;
}

// ═══ NAMAZ BİLDİRİŞLƏRİNİ PLANLAŞDIR ═══
// Bildirişlər seçilmiş şəhərin AZAN vaxtına qurulur (camaat vaxtı yoxdur).
export async function schedulePrayerNotifications(lang = 'az', city, country) {
  try {
    // Əvvəlki namaz bildirişlərini sil
    await Notifications.cancelAllScheduledNotificationsAsync();

    const times = await fetchPrayerTimes(city, country);
    if (!times) return 0;

    // Bildiriş mətnindəki şəhər adı (cari dildə)
    const loc = city ? cityById(city) : await loadPrayerLocation();
    const cityName = loc ? tr(loc.label || loc.city, lang) : '';

    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    let scheduled = 0;

    for (const prayer of prayers) {
      const t = toDeviceTime(times[prayer]);
      if (!t) continue;

      const msg = PRAYER_MESSAGES[prayer][lang] || PRAYER_MESSAGES[prayer].en;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body: withCity(msg.body, cityName),
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: 'prayer', prayer },
        },
        trigger: {
          hour: t.hours,
          minute: t.minutes,
          repeats: true,
          channelId: 'prayer',
        },
      });
      scheduled++;
    }

    return scheduled;
  } catch (e) {
    console.log('Schedule prayer error:', e);
    return 0;
  }
}

// ═══ SEHER / AXSAM EZKAR YADDA SAXLAT ═══
export async function scheduleAdhkarReminders(lang = 'az') {
  try {
    const morning = ADHKAR_MESSAGES.morning[lang] || ADHKAR_MESSAGES.morning.en;
    const evening = ADHKAR_MESSAGES.evening[lang] || ADHKAR_MESSAGES.evening.en;

    // Səhər əzkarı — 06:30
    await Notifications.scheduleNotificationAsync({
      content: {
        title: morning.title,
        body: morning.body,
        sound: 'default',
        data: { type: 'adhkar', time: 'morning' },
      },
      trigger: { hour: 6, minute: 30, repeats: true, channelId: 'adhkar' },
    });

    // Axşam əzkarı — 18:30
    await Notifications.scheduleNotificationAsync({
      content: {
        title: evening.title,
        body: evening.body,
        sound: 'default',
        data: { type: 'adhkar', time: 'evening' },
      },
      trigger: { hour: 18, minute: 30, repeats: true, channelId: 'adhkar' },
    });

    return 2;
  } catch { return 0; }
}

// ═══ GÜNÜN HƏDİSİ ═══
export async function scheduleDailyHadithReminder(lang = 'az') {
  try {
    const msg = ADHKAR_MESSAGES.daily_hadith[lang] || ADHKAR_MESSAGES.daily_hadith.en;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: msg.title,
        body: msg.body,
        sound: 'default',
        data: { type: 'hadith' },
      },
      trigger: { hour: 9, minute: 0, repeats: true, channelId: 'daily' },
    });
    return 1;
  } catch { return 0; }
}

// ═══ TEST BİLDİRİŞİ ═══
export async function sendTestNotification(lang = 'az') {
  const titles = { az:`🕌 ${BRAND.name.az} — Test`, en:`🕌 ${BRAND.name.en} — Test`, ru:`🕌 ${BRAND.name.ru} — Тест`, ar:`🕌 ${BRAND.name.ar} — اختبار`, tr:`🕌 ${BRAND.name.tr} — Test` };
  const bodies = {
    az:'Bildirişlər aktivdir! Namaz vaxtlarından xəbər veriləcək.',
    en:'Notifications are active! You will receive prayer time alerts.',
    ru:'Уведомления активны! Вы получите уведомления о времени намаза.',
    ar:'الإشعارات مفعلة! ستتلقى تنبيهات بأوقات الصلاة.',
    tr:'Bildirimler aktif! Namaz vakti bildirimleri alacaksınız.',
  };
  await Notifications.scheduleNotificationAsync({
    content: {
      title: titles[lang] || titles.en,
      body: bodies[lang] || bodies.en,
      sound: 'default',
    },
    trigger: { seconds: 2 },
  });
}

// ═══ BÜTÜN BİLDİRİŞLƏRİ SİL ═══
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ═══ NOTİF AYARLARI ═══
const SETTINGS_KEY = 'muslim_cc_notif_settings';

// ═══ DEFAULT — bütün bildirişlər ON. İlk açılışda istifadəçi heç nə etmədən
// permission sorulur, qəbul edilərsə hamısı dərhal planlaşdırılır.
// city — şəhər id-si (services/prayerLocation); boşdursa tətbiqdə seçilmiş
// şəhər (və ya standart yer) götürülür.
const DEFAULT_NOTIF_SETTINGS = {
  enabled: true,
  prayers: true,
  morningAdhkar: true,
  eveningAdhkar: true,
  dailyHadith: true,
  city: '',
};

export async function loadNotifSettings() {
  // Şəhər həmişə tətbiqin ortaq seçimindən götürülür (Namaz ekranı ilə eyni)
  const loc = await loadPrayerLocation();
  try {
    const v = await AsyncStorage.getItem(SETTINGS_KEY);
    if (v) {
      // Köhnə saxlanılmış ayarları default-larla birləşdir
      // (yeni əlavə olunan açarlar üçün on-by-default qalsın)
      const saved = { ...DEFAULT_NOTIF_SETTINGS, ...JSON.parse(v) };
      return { ...saved, city: loc.id || '' };
    }
  } catch {}
  return { ...DEFAULT_NOTIF_SETTINGS, city: loc.id || '' };
}

export async function saveNotifSettings(settings) {
  // Bildirişlər ekranında seçilən şəhər bütün tətbiq üçün seçimdir
  if (settings?.city) await setPrayerCity(settings.city);
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ═══ ƏSAS SETUP FUNKSIYASI ═══
export async function setupNotifications(lang, settings) {
  if (!settings.enabled) {
    await cancelAllNotifications();
    return { success: true, count: 0 };
  }

  const granted = await requestPermissions(lang);
  if (!granted) return { success: false, error: 'permission' };

  await cancelAllNotifications();
  let count = 0;

  if (settings.prayers) {
    count += await schedulePrayerNotifications(lang, settings.city || undefined);
  }
  if (settings.morningAdhkar || settings.eveningAdhkar) {
    count += await scheduleAdhkarReminders(lang);
  }
  if (settings.dailyHadith) {
    count += await scheduleDailyHadithReminder(lang);
  }

  return { success: true, count };
}
