import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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

// ═══ İCAZƏ ALMAQ ═══
export async function requestPermissions() {
  if (!Device.isDevice) return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer', {
      name: 'Namaz Bildirişləri',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1a6b3a',
    });
    await Notifications.setNotificationChannelAsync('adhkar', {
      name: 'Əzkar Yadda saxlatma',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('daily', {
      name: 'Gündəlik yadda saxlatma',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return finalStatus === 'granted';
}

// ═══ ŞEHER SECİLƏN NAMAZ VAXTLARINI ALMAQ ═══
export async function fetchPrayerTimes(city = 'Baku', country = 'Azerbaijan') {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();

  try {
    const res = await fetch(
      `https://api.aladhan.com/v1/timingsByCity/${dd}-${mm}-${yyyy}?city=${city}&country=${country}&method=13`
    );
    const data = await res.json();
    return data.data.timings;
  } catch {
    return null;
  }
}

// ═══ NAMAZ BİLDİRİŞLƏRİNİ PLANLAŞDIR ═══
export async function schedulePrayerNotifications(lang = 'az', city = 'Baku', country = 'Azerbaijan') {
  try {
    // Əvvəlki namaz bildirişlərini sil
    await Notifications.cancelAllScheduledNotificationsAsync();

    const times = await fetchPrayerTimes(city, country);
    if (!times) return 0;

    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const now = new Date();
    let scheduled = 0;

    for (const prayer of prayers) {
      const time = times[prayer];
      if (!time) continue;

      const [hours, minutes] = time.split(':').map(Number);
      const trigger = new Date();
      trigger.setHours(hours, minutes, 0, 0);

      // Əgər vaxt keçibsə, sabah üçün planlaşdır
      if (trigger <= now) {
        trigger.setDate(trigger.getDate() + 1);
      }

      const msg = PRAYER_MESSAGES[prayer][lang] || PRAYER_MESSAGES[prayer].en;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body: msg.body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: 'prayer', prayer },
        },
        trigger: {
          hour: hours,
          minute: minutes,
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
  const titles = { az:'🕌 Muslims.cc Test', en:'🕌 Muslims.cc Test', ru:'🕌 Muslims.cc Тест', ar:'🕌 اختبار', tr:'🕌 Muslims.cc Test' };
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
const DEFAULT_NOTIF_SETTINGS = {
  enabled: true,
  prayers: true,
  morningAdhkar: true,
  eveningAdhkar: true,
  dailyHadith: true,
  city: 'Baku',
  country: 'Azerbaijan',
};

export async function loadNotifSettings() {
  try {
    const v = await AsyncStorage.getItem(SETTINGS_KEY);
    if (v) {
      // Köhnə saxlanılmış ayarları default-larla birləşdir
      // (yeni əlavə olunan açarlar üçün on-by-default qalsın)
      return { ...DEFAULT_NOTIF_SETTINGS, ...JSON.parse(v) };
    }
  } catch {}
  return { ...DEFAULT_NOTIF_SETTINGS };
}

export async function saveNotifSettings(settings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ═══ ƏSAS SETUP FUNKSIYASI ═══
export async function setupNotifications(lang, settings) {
  if (!settings.enabled) {
    await cancelAllNotifications();
    return { success: true, count: 0 };
  }

  const granted = await requestPermissions();
  if (!granted) return { success: false, error: 'permission' };

  await cancelAllNotifications();
  let count = 0;

  if (settings.prayers) {
    count += await schedulePrayerNotifications(lang, settings.city, settings.country);
  }
  if (settings.morningAdhkar || settings.eveningAdhkar) {
    count += await scheduleAdhkarReminders(lang);
  }
  if (settings.dailyHadith) {
    count += await scheduleDailyHadithReminder(lang);
  }

  return { success: true, count };
}
