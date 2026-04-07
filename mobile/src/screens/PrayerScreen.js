import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLang } from '../contexts/LangContext';
import { Colors, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import PageHero from '../components/PageHero';

const CITIES = [
  { name: 'Bakı', city: 'Baku', country: 'Azerbaijan' },
  { name: 'İstanbul', city: 'Istanbul', country: 'Turkey' },
  { name: 'Məkkə', city: 'Makkah', country: 'Saudi Arabia' },
  { name: 'Mədinə', city: 'Madinah', country: 'Saudi Arabia' },
  { name: 'Qahirə', city: 'Cairo', country: 'Egypt' },
  { name: 'Dubai', city: 'Dubai', country: 'UAE' },
  { name: 'Ankara', city: 'Ankara', country: 'Turkey' },
  { name: 'Moskva', city: 'Moscow', country: 'Russia' },
  { name: 'London', city: 'London', country: 'UK' },
  { name: 'New York', city: 'New York', country: 'US' },
];

const PRAYER_KEYS = ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'];
const PRAYER_ICONS = { Fajr:'🌅', Sunrise:'☀️', Dhuhr:'🌤️', Asr:'🌇', Maghrib:'🌆', Isha:'🌙' };

export default function PrayerScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const t = T[lang]?.prayer || T.az.prayer;

  const [cityIdx, setCityIdx] = useState(0);
  const [times, setTimes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('muslim_cc_prayer_stats').then(v => {
      try { if (v) setStats(JSON.parse(v)); } catch {}
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const city = CITIES[cityIdx];
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    fetch(`https://api.aladhan.com/v1/timingsByCity/${dd}-${mm}-${yyyy}?city=${city.city}&country=${city.country}&method=13`)
      .then(r => r.json())
      .then(d => setTimes(d.data.timings))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cityIdx]);

  const getNextPrayer = () => {
    if (!times) return null;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    for (const key of PRAYER_KEYS) {
      if (key === 'Sunrise') continue;
      const [h, m] = (times[key] || '00:00').split(':').map(Number);
      if (h * 60 + m > nowMins) return { name: key, time: times[key] };
    }
    return { name: 'Fajr', time: times.Fajr };
  };

  const togglePrayer = async (key) => {
    const today = new Date().toISOString().slice(0, 10);
    const newStats = { ...stats };
    if (!newStats[today]) newStats[today] = {};
    newStats[today][key] = newStats[today][key] ? 0 : 1;
    setStats(newStats);
    await AsyncStorage.setItem('muslim_cc_prayer_stats', JSON.stringify(newStats));
  };

  const todayStats = stats[new Date().toISOString().slice(0, 10)] || {};
  const nextPrayer = getNextPrayer();
  const prayerLabelMap = { Fajr: t.fajr, Sunrise: t.sunrise, Dhuhr: t.dhuhr, Asr: t.asr, Maghrib: t.maghrib, Isha: t.isha };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="الصلاة" title={t.title} subtitle={t.subtitle} />

      <View style={styles.content}>
        {/* City selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityScroll}>
          {CITIES.map((city, i) => (
            <TouchableOpacity key={i} style={[styles.cityBtn, cityIdx === i && { backgroundColor: c.primary }]} onPress={() => setCityIdx(i)}>
              <Text style={[styles.cityText, cityIdx === i && { color: '#fff' }]}>{city.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Next prayer */}
        {nextPrayer && (
          <View style={[styles.nextCard, { backgroundColor: c.primary }]}>
            <Text style={styles.nextLabel}>{t.next}</Text>
            <Text style={styles.nextName}>{prayerLabelMap[nextPrayer.name] || nextPrayer.name}</Text>
            <Text style={styles.nextTime}>{nextPrayer.time}</Text>
          </View>
        )}

        {/* Prayer times */}
        {loading ? (
          <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 30 }} />
        ) : times ? (
          <View style={styles.timesGrid}>
            {PRAYER_KEYS.map(key => {
              const isNext = nextPrayer?.name === key;
              const isDone = todayStats[key] === 1;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.timeCard,
                    { backgroundColor: c.card, borderColor: c.cardBorder },
                    isNext && { borderColor: c.primary, borderWidth: 2 },
                    isDone && { backgroundColor: c.primary + '15' },
                  ]}
                  onPress={() => key !== 'Sunrise' && togglePrayer(key)}
                >
                  <Text style={styles.timeIcon}>{PRAYER_ICONS[key]}</Text>
                  <Text style={[styles.timeName, { color: c.text }]}>{prayerLabelMap[key]}</Text>
                  <Text style={[styles.timeValue, { color: isNext ? c.primary : c.textSecondary }]}>{times[key]}</Text>
                  {key !== 'Sunrise' && (
                    <Text style={styles.checkMark}>{isDone ? '✅' : '⬜'}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {/* Weekly stats */}
        <View style={[styles.statsCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[styles.statsTitle, { color: c.text }]}>
            {lang === 'az' ? 'Həftəlik Statistika' : lang === 'ru' ? 'Недельная Статистика' : lang === 'ar' ? 'إحصائيات الأسبوع' : lang === 'tr' ? 'Haftalık İstatistik' : 'Weekly Stats'}
          </Text>
          <View style={styles.weekRow}>
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              const key = d.toISOString().slice(0, 10);
              const dayStats = stats[key] || {};
              const count = Object.values(dayStats).filter(v => v === 1).length;
              const pct = Math.round((count / 5) * 100);
              const dayNames = { az: ['B','BE','ÇA','Ç','CA','C','Ş'], en: ['S','M','T','W','T','F','S'], ru: ['В','П','В','С','Ч','П','С'], ar: ['أ','إ','ث','أ','خ','ج','س'], tr: ['P','P','S','Ç','P','C','C'] };
              const dayLabels = dayNames[lang] || dayNames.en;
              return (
                <View key={i} style={styles.weekDay}>
                  <View style={[styles.weekBar, { height: Math.max(pct * 0.6, 4), backgroundColor: pct > 0 ? c.primary : c.border }]} />
                  <Text style={[styles.weekLabel, { color: c.textMuted }]}>{dayLabels[d.getDay()]}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  cityScroll: { marginBottom: 16 },
  cityBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#eee', marginRight: 8 },
  cityText: { fontSize: 13, fontWeight: '600', color: '#555' },
  nextCard: { borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  nextLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  nextName: { fontSize: 24, fontWeight: '700', color: '#fff', marginVertical: 4 },
  nextTime: { fontSize: 36, fontWeight: '800', color: '#fff' },
  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeCard: { width: '48%', padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center', marginBottom: 8 },
  timeIcon: { fontSize: 28, marginBottom: 6 },
  timeName: { fontSize: 14, fontWeight: '600' },
  timeValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  checkMark: { fontSize: 18, marginTop: 6 },
  statsCard: { marginTop: 20, padding: 20, borderRadius: 12, borderWidth: 1 },
  statsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 80 },
  weekDay: { alignItems: 'center', justifyContent: 'flex-end' },
  weekBar: { width: 24, borderRadius: 4, marginBottom: 4 },
  weekLabel: { fontSize: 11 },
});
