import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';
import { useLang } from '../contexts/LangContext';
import { Colors } from '../theme/colors';
import PageHero from '../components/PageHero';

const { width } = Dimensions.get('window');

const ACTIVITIES = [
  { key:'fajr', icon:'🌅' }, { key:'dhuhr', icon:'🌤️' }, { key:'asr', icon:'🌇' },
  { key:'maghrib', icon:'🌆' }, { key:'isha', icon:'🌙' }, { key:'quran', icon:'📖' },
  { key:'morning_adhkar', icon:'☀️' }, { key:'evening_adhkar', icon:'🌜' },
  { key:'dhikr', icon:'📿' }, { key:'sadaqah', icon:'🎁' },
];

const LABELS = {
  az: { title:'Gündəlik İzləyici', sub:'İbadətlərinizi qeyd edin', fajr:'Sübh', dhuhr:'Zöhr', asr:'Əsr', maghrib:'Məğrib', isha:'İşa', quran:'Quran', morning_adhkar:'Səhər əzkarı', evening_adhkar:'Axşam əzkarı', dhikr:'Zikr', sadaqah:'Sədəqə', today:'Bu gün', week:'Həftə', streak:'Ardıcıl' },
  en: { title:'Daily Tracker', sub:'Track your daily ibadah', fajr:'Fajr', dhuhr:'Dhuhr', asr:'Asr', maghrib:'Maghrib', isha:'Isha', quran:'Quran', morning_adhkar:'Morning Adhkar', evening_adhkar:'Evening Adhkar', dhikr:'Dhikr', sadaqah:'Sadaqah', today:'Today', week:'Week', streak:'Streak' },
  ru: { title:'Ежедневный Трекер', sub:'Отслеживайте ибадат', fajr:'Фаджр', dhuhr:'Зухр', asr:'Аср', maghrib:'Магриб', isha:'Иша', quran:'Коран', morning_adhkar:'Утренние азкары', evening_adhkar:'Вечерние азкары', dhikr:'Зикр', sadaqah:'Садака', today:'Сегодня', week:'Неделя', streak:'Подряд' },
  ar: { title:'المتابعة اليومية', sub:'تتبع عباداتك', fajr:'الفجر', dhuhr:'الظهر', asr:'العصر', maghrib:'المغرب', isha:'العشاء', quran:'القرآن', morning_adhkar:'أذكار الصباح', evening_adhkar:'أذكار المساء', dhikr:'الذكر', sadaqah:'الصدقة', today:'اليوم', week:'الأسبوع', streak:'متتالية' },
  tr: { title:'Günlük Takip', sub:'İbadetlerinizi kaydedin', fajr:'Sabah', dhuhr:'Öğle', asr:'İkindi', maghrib:'Akşam', isha:'Yatsı', quran:'Kuran', morning_adhkar:'Sabah Ezkarı', evening_adhkar:'Akşam Ezkarı', dhikr:'Zikir', sadaqah:'Sadaka', today:'Bugün', week:'Hafta', streak:'Seri' },
};

export default function DailyTrackerScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const today = new Date().toISOString().slice(0, 10);

  const [data, setData] = useState({});

  useEffect(() => {
    AsyncStorage.getItem('daily_tracker').then(v => {
      try { if (v) setData(JSON.parse(v)); } catch {}
    });
  }, []);

  const toggle = async (key) => {
    const newData = { ...data };
    if (!newData[today]) newData[today] = {};
    newData[today][key] = !newData[today][key];
    setData(newData);
    await AsyncStorage.setItem('daily_tracker', JSON.stringify(newData));
  };

  const todayData = data[today] || {};
  const completed = ACTIVITIES.filter(a => todayData[a.key]).length;
  const pct = completed / ACTIVITIES.length;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  // Streak
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    const dayData = data[key] || {};
    const dayCompleted = ACTIVITIES.filter(a => dayData[a.key]).length;
    if (dayCompleted >= 5) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="المتابعة" title={l.title} subtitle={l.sub} />

      <View style={styles.content}>
        {/* Progress ring */}
        <View style={styles.progressWrap}>
          <Svg width={150} height={150} viewBox="0 0 140 140">
            <Circle cx="70" cy="70" r={radius} fill="none" stroke={c.border} strokeWidth="8" />
            <Circle cx="70" cy="70" r={radius} fill="none" stroke={c.primary} strokeWidth="8"
              strokeDasharray={`${circumference * pct} ${circumference * (1 - pct)}`}
              strokeDashoffset={circumference * 0.25} strokeLinecap="round"
              transform="rotate(-90 70 70)" />
          </Svg>
          <View style={styles.progressCenter}>
            <Text style={[styles.progressPct, { color: c.text }]}>{Math.round(pct * 100)}%</Text>
            <Text style={[styles.progressLabel, { color: c.textMuted }]}>{completed}/{ACTIVITIES.length}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.statNum, { color: c.primary }]}>{completed}</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>{l.today}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.statNum, { color: c.gold }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>{l.streak}</Text>
          </View>
        </View>

        {/* Activities */}
        {ACTIVITIES.map(a => {
          const done = todayData[a.key];
          return (
            <TouchableOpacity
              key={a.key}
              style={[styles.activityCard, { backgroundColor: c.card, borderColor: done ? c.primary : c.cardBorder }]}
              onPress={() => toggle(a.key)}
            >
              <Text style={styles.activityIcon}>{a.icon}</Text>
              <Text style={[styles.activityLabel, { color: c.text }]}>{l[a.key]}</Text>
              <Text style={{ fontSize: 22 }}>{done ? '✅' : '⬜'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  progressWrap: { alignItems: 'center', marginBottom: 20 },
  progressCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  progressPct: { fontSize: 28, fontWeight: '800' },
  progressLabel: { fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  activityCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
  activityIcon: { fontSize: 24, marginRight: 14 },
  activityLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
});
