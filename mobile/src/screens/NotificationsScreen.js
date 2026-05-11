import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn, Pulse } from '../components/Animated';
import { loadNotifSettings, saveNotifSettings, setupNotifications, sendTestNotification, requestPermissions } from '../services/NotificationService';

const CITIES = [
  { name:'Bakı', city:'Baku', country:'Azerbaijan' },
  { name:'İstanbul', city:'Istanbul', country:'Turkey' },
  { name:'Məkkə', city:'Makkah', country:'Saudi Arabia' },
  { name:'Mədinə', city:'Madinah', country:'Saudi Arabia' },
  { name:'Qahirə', city:'Cairo', country:'Egypt' },
  { name:'Dubai', city:'Dubai', country:'UAE' },
  { name:'Ankara', city:'Ankara', country:'Turkey' },
  { name:'Moskva', city:'Moscow', country:'Russia' },
  { name:'London', city:'London', country:'UK' },
  { name:'New York', city:'New York', country:'US' },
];

const LABELS = {
  az: { title:'Bildirişlər', sub:'Bildirişlərinizi idarə edin', enable:'Bildirişlər', prayers:'Namaz vaxtları', prayersDesc:'Hər namaz vaxtında xəbər', morning:'Səhər əzkarı', morningDesc:'Hər səhər saat 06:30-da', evening:'Axşam əzkarı', eveningDesc:'Hər axşam saat 18:30-da', hadith:'Günün Hədisi', hadithDesc:'Hər gün saat 09:00-da', city:'Şəhər', save:'Qeyd et', testNotif:'Test bildirişi', saved:'Qeyd olundu!', permDenied:'Bildiriş icazəsi verilməyib. Tənzimləmələrdən icazə verin.', active:'Aktiv', inactive:'Deaktiv', notifCount:'bildiriş planlaşdırıldı', ok:'OK', info:'Məlumat' },
  en: { title:'Notifications', sub:'Manage your notifications', enable:'Notifications', prayers:'Prayer Times', prayersDesc:'Alert for every prayer time', morning:'Morning Adhkar', morningDesc:'Every day at 06:30', evening:'Evening Adhkar', eveningDesc:'Every day at 18:30', hadith:'Daily Hadith', hadithDesc:'Every day at 09:00', city:'City', save:'Save', testNotif:'Test Notification', saved:'Saved!', permDenied:'Notification permission denied. Please enable from settings.', active:'Active', inactive:'Inactive', notifCount:'notifications scheduled', ok:'OK', info:'Info' },
  ru: { title:'Уведомления', sub:'Управляйте уведомлениями', enable:'Уведомления', prayers:'Намаз', prayersDesc:'Уведомление о каждом намазе', morning:'Утренние азкары', morningDesc:'Каждый день в 06:30', evening:'Вечерние азкары', eveningDesc:'Каждый день в 18:30', hadith:'Хадис дня', hadithDesc:'Каждый день в 09:00', city:'Город', save:'Сохранить', testNotif:'Тест уведомления', saved:'Сохранено!', permDenied:'Разрешение на уведомления отклонено.', active:'Активно', inactive:'Неактивно', notifCount:'уведомлений запланировано', ok:'OK', info:'Инфо' },
  ar: { title:'الإشعارات', sub:'إدارة الإشعارات', enable:'الإشعارات', prayers:'أوقات الصلاة', prayersDesc:'تنبيه لكل صلاة', morning:'أذكار الصباح', morningDesc:'كل يوم الساعة ٠٦:٣٠', evening:'أذكار المساء', eveningDesc:'كل يوم الساعة ١٨:٣٠', hadith:'حديث اليوم', hadithDesc:'كل يوم الساعة ٠٩:٠٠', city:'المدينة', save:'حفظ', testNotif:'إشعار تجريبي', saved:'تم الحفظ!', permDenied:'تم رفض إذن الإشعارات.', active:'نشط', inactive:'غير نشط', notifCount:'إشعار مجدول', ok:'حسناً', info:'معلومات' },
  tr: { title:'Bildirimler', sub:'Bildirimlerinizi yönetin', enable:'Bildirimler', prayers:'Namaz Vakitleri', prayersDesc:'Her namaz vakti bildirimi', morning:'Sabah Ezkarı', morningDesc:'Her gün saat 06:30', evening:'Akşam Ezkarı', eveningDesc:'Her gün saat 18:30', hadith:'Günün Hadisi', hadithDesc:'Her gün saat 09:00', city:'Şehir', save:'Kaydet', testNotif:'Test Bildirimi', saved:'Kaydedildi!', permDenied:'Bildirim izni reddedildi.', active:'Aktif', inactive:'Pasif', notifCount:'bildirim planlandı', ok:'Tamam', info:'Bilgi' },
};

export default function NotificationsScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const sh = dark ? Shadows.dark.md : Shadows.md;
  const shS = dark ? Shadows.dark.sm : Shadows.sm;

  const [settings, setSettings] = useState({
    enabled: false,
    prayers: true,
    morningAdhkar: true,
    eveningAdhkar: true,
    dailyHadith: true,
    city: 'Baku',
    country: 'Azerbaijan',
  });
  const [loading, setLoading] = useState(false);
  const [savedCount, setSavedCount] = useState(null);

  useEffect(() => {
    loadNotifSettings().then(setSettings);
  }, []);

  const toggle = async (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSettings = { ...settings, [key]: !settings[key] };

    // Əgər enable on edilirsə, icazə al
    if (key === 'enabled' && newSettings.enabled) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(l.info, l.permDenied);
        return;
      }
    }

    setSettings(newSettings);
    await saveNotifSettings(newSettings);
  };

  const selectCity = async (city) => {
    Haptics.selectionAsync();
    const newSettings = { ...settings, city: city.city, country: city.country };
    setSettings(newSettings);
    await saveNotifSettings(newSettings);
  };

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const result = await setupNotifications(lang, settings);
    setLoading(false);

    if (!result.success) {
      Alert.alert(l.info, l.permDenied);
      return;
    }

    setSavedCount(result.count);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setSavedCount(null), 3000);
  };

  const handleTest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert(l.info, l.permDenied);
      return;
    }
    await sendTestNotification(lang);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero arabic="الإِشْعَارَات" title={l.title} subtitle={l.sub} />

      <View style={styles.content}>

        {/* Main toggle */}
        <ScaleIn delay={100}>
          <LinearGradient
            colors={settings.enabled ? [c.primary, c.primaryDark] : ['#64748b', '#475569']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.mainToggleCard, sh]}
          >
            <View style={styles.mainToggleCircle1} />
            <View style={styles.mainToggleCircle2} />

            <View style={styles.mainToggleRow}>
              <View style={styles.mainToggleLeft}>
                {settings.enabled ? (
                  <Pulse>
                    <View style={styles.mainToggleIcon}>
                      <Text style={{ fontSize: 28 }}>🔔</Text>
                    </View>
                  </Pulse>
                ) : (
                  <View style={styles.mainToggleIcon}>
                    <Text style={{ fontSize: 28 }}>🔕</Text>
                  </View>
                )}
                <View>
                  <Text style={styles.mainToggleLabel}>{l.enable}</Text>
                  <Text style={styles.mainToggleStatus}>
                    {settings.enabled ? l.active : l.inactive}
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={() => toggle('enabled')}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#fff' }}
                thumbColor={settings.enabled ? c.primary : '#e5e7eb'}
              />
            </View>
          </LinearGradient>
        </ScaleIn>

        {/* Settings list */}
        {settings.enabled && (
          <>
            <FadeUp delay={200}>
              <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
                {lang==='az'?'YADDA SAXLATMA':lang==='ru'?'НАПОМИНАНИЯ':lang==='ar'?'التذكيرات':lang==='tr'?'HATIRLATMALAR':'REMINDERS'}
              </Text>
            </FadeUp>

            <SettingRow
              iconKey="prayer"
              gradient={['#3b82f6','#2563eb']}
              label={l.prayers}
              desc={l.prayersDesc}
              value={settings.prayers}
              onToggle={() => toggle('prayers')}
              c={c} sh={shS} delay={250}
            />
            <SettingRow
              iconKey="fajr"
              gradient={['#f59e0b','#d97706']}
              label={l.morning}
              desc={l.morningDesc}
              value={settings.morningAdhkar}
              onToggle={() => toggle('morningAdhkar')}
              c={c} sh={shS} delay={300}
            />
            <SettingRow
              iconKey="isha"
              gradient={['#8b5cf6','#7c3aed']}
              label={l.evening}
              desc={l.eveningDesc}
              value={settings.eveningAdhkar}
              onToggle={() => toggle('eveningAdhkar')}
              c={c} sh={shS} delay={350}
            />
            <SettingRow
              iconKey="hadith"
              gradient={['#ec4899','#db2777']}
              label={l.hadith}
              desc={l.hadithDesc}
              value={settings.dailyHadith}
              onToggle={() => toggle('dailyHadith')}
              c={c} sh={shS} delay={400}
            />

            {/* City selector */}
            <FadeUp delay={450}>
              <Text style={[styles.sectionLabel, { color: c.textMuted, marginTop: 12 }]}>
                {l.city.toUpperCase()}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityRow}>
                {CITIES.map((city, i) => {
                  const active = settings.city === city.city;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.cityBtn,
                        {
                          backgroundColor: active ? c.primary : c.card,
                          borderColor: active ? c.primary : c.cardBorder,
                        },
                        active && Shadows.button,
                      ]}
                      onPress={() => selectCity(city)}
                      activeOpacity={0.8}
                    >
                      <AppIcon name="location" size={14} color={active ? '#fff' : c.textMuted} />
                      <Text style={[styles.cityText, { color: active ? '#fff' : c.text }]}>{city.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </FadeUp>

            {/* Save button */}
            <FadeUp delay={500}>
              <TouchableOpacity
                style={[styles.saveBtn, Shadows.button]}
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[c.primary, c.primaryDark]} style={styles.saveBtnGrad}>
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <AppIcon name="check" size={20} color="#fff" />
                      <Text style={styles.saveBtnText}>{l.save}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </FadeUp>

            {savedCount !== null && (
              <FadeUp>
                <View style={[styles.successCard, { backgroundColor: '#10b98118', borderColor: '#10b98140' }]}>
                  <AppIcon name="check" size={18} color="#10b981" />
                  <Text style={[styles.successText, { color: '#10b981' }]}>
                    ✅ {l.saved} ({savedCount} {l.notifCount})
                  </Text>
                </View>
              </FadeUp>
            )}
          </>
        )}

        {/* Test button */}
        <FadeUp delay={550}>
          <TouchableOpacity
            style={[styles.testBtn, { backgroundColor: c.card, borderColor: c.cardBorder }, shS]}
            onPress={handleTest}
            activeOpacity={0.85}
          >
            <AppIcon name="play" size={16} color={c.primary} />
            <Text style={[styles.testBtnText, { color: c.primary }]}>{l.testNotif}</Text>
          </TouchableOpacity>
        </FadeUp>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

function SettingRow({ iconKey, gradient, label, desc, value, onToggle, c, sh, delay }) {
  return (
    <FadeUp delay={delay}>
      <View style={[styles.settingCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
        <LinearGradient
          colors={[gradient[0] + '10', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.5 }}
        />
        <LinearGradient colors={gradient} style={styles.settingIconWrap}>
          <AppIcon name={iconKey} size={20} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={[styles.settingLabel, { color: c.text }]}>{label}</Text>
          <Text style={[styles.settingDesc, { color: c.textMuted }]}>{desc}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: '#e5e7eb', true: gradient[0] }}
          thumbColor="#fff"
        />
      </View>
    </FadeUp>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 14 },

  // Main toggle
  mainToggleCard: {
    padding: 24,
    borderRadius: BorderRadius.xl,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  mainToggleCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -40 },
  mainToggleCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -30 },
  mainToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mainToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  mainToggleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  mainToggleLabel: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  mainToggleStatus: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },

  // Setting card
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 10,
    gap: 14,
    overflow: 'hidden',
  },
  settingIconWrap: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 15, fontWeight: '800', marginBottom: 2, letterSpacing: -0.2 },
  settingDesc: { fontSize: 12, fontWeight: '500' },

  // City
  cityRow: { gap: 8, paddingBottom: 8, paddingHorizontal: 4 },
  cityBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  cityText: { fontSize: 13, fontWeight: '700' },

  // Save
  saveBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginTop: 16 },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // Success
  successCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: BorderRadius.md, borderWidth: 1, marginTop: 12 },
  successText: { flex: 1, fontSize: 13, fontWeight: '700' },

  // Test
  testBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: BorderRadius.md, borderWidth: 1, marginTop: 12 },
  testBtnText: { fontWeight: '700', fontSize: 14 },
});
