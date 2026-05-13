import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Animated as RNAnimated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, FadeIn, ScaleIn, Float, Pulse, PressableCard, AnimatedNumber, BreathingDot, AnimatedProgressBar } from '../components/Animated';
import { subscribeToSettings } from '../data/adminContent';

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
const PRAYER_META = {
  Fajr:    { iconKey:'fajr', gradient:['#6366f1','#4338ca'], emoji:'🌅' },
  Sunrise: { iconKey:'sunrise', gradient:['#f59e0b','#d97706'], emoji:'☀️' },
  Dhuhr:   { iconKey:'dhuhr', gradient:['#fbbf24','#f59e0b'], emoji:'🌤️' },
  Asr:     { iconKey:'asr', gradient:['#f97316','#ea580c'], emoji:'🌇' },
  Maghrib: { iconKey:'maghrib', gradient:['#ec4899','#db2777'], emoji:'🌆' },
  Isha:    { iconKey:'isha', gradient:['#1e3a8a','#0f172a'], emoji:'🌙' },
};

export default function PrayerScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const t = T[lang]?.prayer || T.az.prayer;
  const sh = dark ? Shadows.dark.md : Shadows.md;
  const shL = dark ? Shadows.dark.lg : Shadows.lg;

  const [cityIdx, setCityIdx] = useState(0);
  const [times, setTimes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [now, setNow] = useState(new Date());
  const [userPickedCity, setUserPickedCity] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Admin settings-dən default şəhəri oxu (web ilə eyni davranış)
  // Yalnız istifadəçi əl ilə şəhər seçməyibsə.
  useEffect(() => {
    const unsubscribe = subscribeToSettings((settings) => {
      if (!settings || userPickedCity) return
      const target = settings.defaultCity
      if (!target) return
      const matchIdx = CITIES.findIndex(c =>
        c.city.toLowerCase() === target.toLowerCase() ||
        c.name.toLowerCase() === target.toLowerCase()
      )
      if (matchIdx !== -1) setCityIdx(matchIdx)
    })
    return () => unsubscribe?.()
  }, [userPickedCity])

  // Wrap the original setter to mark user choice
  const pickCity = (idx) => { setUserPickedCity(true); setCityIdx(idx) }

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
      if (h * 60 + m > nowMins) return { name: key, time: times[key], mins: h * 60 + m };
    }
    const [h, m] = times.Fajr.split(':').map(Number);
    return { name: 'Fajr', time: times.Fajr, mins: h * 60 + m + 1440 };
  };

  const getCountdown = (next) => {
    if (!next) return '';
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const nowSecs = now.getSeconds();
    let diff = next.mins - nowMins;
    if (diff < 0) diff += 1440;
    const totalSecs = diff * 60 - nowSecs;
    if (totalSecs <= 0) return '00:00:00';
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const togglePrayer = async (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const today = new Date().toISOString().slice(0, 10);
    const newStats = { ...stats };
    if (!newStats[today]) newStats[today] = {};
    newStats[today][key] = newStats[today][key] ? 0 : 1;
    setStats(newStats);
    await AsyncStorage.setItem('muslim_cc_prayer_stats', JSON.stringify(newStats));
  };

  const todayStats = stats[new Date().toISOString().slice(0, 10)] || {};
  const nextPrayer = getNextPrayer();
  const countdown = getCountdown(nextPrayer);
  const prayerLabelMap = { Fajr: t.fajr, Sunrise: t.sunrise, Dhuhr: t.dhuhr, Asr: t.asr, Maghrib: t.maghrib, Isha: t.isha };
  const completedToday = Object.values(todayStats).filter(v => v === 1).length;
  const progressPct = completedToday / 5;

  // Progress ring
  const RING_SIZE = 80;
  const RING_RADIUS = (RING_SIZE - 8) / 2;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero arabic="الصَّلَاة" title={t.title} subtitle={t.subtitle} theme="prayer" />

      <View style={styles.content}>

        {/* ═══ CITY SELECTOR ═══ */}
        <FadeUp delay={100}>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
            {lang==='az'?'ŞƏHƏR':lang==='ru'?'ГОРОД':lang==='ar'?'المدينة':lang==='tr'?'ŞEHİR':'CITY'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityRow}>
            {CITIES.map((city, i) => {
              const active = cityIdx === i;
              return (
                <PressableCard
                  key={i}
                  style={[
                    styles.cityBtn,
                    { backgroundColor: active ? c.primary : c.card, borderColor: active ? c.primary : c.cardBorder },
                    active ? Shadows.button : (dark ? Shadows.dark.sm : Shadows.sm),
                  ]}
                  onPress={() => pickCity(i)}
                >
                  <AppIcon name="location" size={14} color={active ? '#fff' : c.textMuted} />
                  <Text style={[styles.cityText, { color: active ? '#fff' : c.text }]}>{city.name}</Text>
                </PressableCard>
              );
            })}
          </ScrollView>
        </FadeUp>

        {/* ═══ NEXT PRAYER — big countdown card ═══ */}
        {nextPrayer && !loading && (
          <ScaleIn delay={200}>
            <LinearGradient
              colors={dark ? ['#0f172a', '#1e293b', '#334155'] : PRAYER_META[nextPrayer.name]?.gradient || [c.primaryDark, c.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.nextCard, shL]}
            >
              {/* Decorative circles */}
              <View style={styles.nextCircle1} />
              <View style={styles.nextCircle2} />

              <View style={styles.nextHeader}>
                <View style={styles.nextLeft}>
                  <BreathingDot color="#fff" size={10} />
                  <Text style={styles.nextLabel}>{t.next}</Text>
                </View>
                <Text style={styles.nextEmoji}>{PRAYER_META[nextPrayer.name]?.emoji}</Text>
              </View>

              <Text style={styles.nextName}>{prayerLabelMap[nextPrayer.name]}</Text>
              <Text style={styles.nextTime}>{nextPrayer.time}</Text>

              <View style={styles.countdownBox}>
                <Text style={styles.countdownLabel}>
                  {lang==='az'?'Qalan vaxt':lang==='ru'?'Осталось':lang==='ar'?'الوقت المتبقي':lang==='tr'?'Kalan süre':'Time left'}
                </Text>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            </LinearGradient>
          </ScaleIn>
        )}

        {/* ═══ TODAY PROGRESS ═══ */}
        <FadeUp delay={300}>
          <View style={[styles.progressCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.progressTitle, { color: c.text }]}>
                {lang==='az'?'Bu gün':lang==='ru'?'Сегодня':lang==='ar'?'اليوم':lang==='tr'?'Bugün':'Today'}
              </Text>
              <Text style={[styles.progressSub, { color: c.textSecondary }]}>
                {completedToday}/5 {lang==='az'?'namaz qılınıb':lang==='ru'?'молитв':lang==='ar'?'صلوات':lang==='tr'?'namaz':'prayers'}
              </Text>
              <AnimatedProgressBar progress={progressPct} color={c.primary} bgColor={c.surfaceAlt} height={8} style={{ marginTop: 4 }} />
            </View>
            <View style={styles.ringWrap}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <Circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_RADIUS} fill="none" stroke={c.border} strokeWidth={6} />
                <Circle
                  cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_RADIUS} fill="none"
                  stroke={c.primary} strokeWidth={6}
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE * (1 - progressPct)}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${RING_SIZE/2} ${RING_SIZE/2})`}
                />
              </Svg>
              <View style={styles.ringCenter}>
                <Text style={[styles.ringText, { color: c.primary }]}>{Math.round(progressPct * 100)}%</Text>
              </View>
            </View>
          </View>
        </FadeUp>

        {/* ═══ PRAYER TIMES LIST ═══ */}
        <FadeUp delay={400}>
          <Text style={[styles.sectionLabel, { color: c.textMuted, marginTop: 20 }]}>
            {lang==='az'?'NAMAZ VAXTLARI':lang==='ru'?'ВРЕМЯ НАМАЗА':lang==='ar'?'مواقيت الصلاة':lang==='tr'?'NAMAZ VAKİTLERİ':'PRAYER TIMES'}
          </Text>
        </FadeUp>

        {loading ? (
          <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 30 }} />
        ) : times ? (
          <View style={styles.timesList}>
            {PRAYER_KEYS.map((key, i) => {
              const isNext = nextPrayer?.name === key;
              const isDone = todayStats[key] === 1;
              const meta = PRAYER_META[key];
              return (
                <FadeUp key={key} delay={500 + i * 70}>
                  <PressableCard
                    style={[
                      styles.timeCard,
                      {
                        backgroundColor: c.card,
                        borderColor: isNext ? c.primary : c.cardBorder,
                        borderWidth: isNext ? 2 : 1,
                      },
                      sh,
                    ]}
                    onPress={() => key !== 'Sunrise' && togglePrayer(key)}
                  >
                    {isNext && (
                      <LinearGradient
                        colors={[c.primaryBg2, 'transparent']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    )}

                    {/* Gradient icon */}
                    <LinearGradient colors={meta.gradient} style={styles.timeIconWrap}>
                      <AppIcon name={meta.iconKey} size={22} color="#fff" />
                    </LinearGradient>

                    <View style={styles.timeBody}>
                      <Text style={[styles.timeName, { color: c.text }]}>{prayerLabelMap[key]}</Text>
                      {isNext && (
                        <View style={[styles.nextBadge, { backgroundColor: c.primary }]}>
                          <View style={styles.nextBadgeDot} />
                          <Text style={styles.nextBadgeText}>
                            {lang==='az'?'Növbəti':lang==='ru'?'Следующий':lang==='ar'?'التالي':lang==='tr'?'Sonraki':'Next'}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.timeRight}>
                      <Text style={[styles.timeValue, { color: isNext ? c.primary : c.text }]}>{times[key]}</Text>
                      {key !== 'Sunrise' && (
                        <View style={[styles.checkCircle, {
                          backgroundColor: isDone ? c.primary : 'transparent',
                          borderColor: isDone ? c.primary : c.border,
                        }]}>
                          {isDone && <AppIcon name="check" size={14} color="#fff" />}
                        </View>
                      )}
                    </View>
                  </PressableCard>
                </FadeUp>
              );
            })}
          </View>
        ) : null}

        {/* ═══ WEEKLY STATS ═══ */}
        <FadeUp delay={900}>
          <View style={[styles.statsCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
            <View style={styles.statsHeader}>
              <AppIcon name="analytics" size={18} color={c.primary} />
              <Text style={[styles.statsTitle, { color: c.text }]}>
                {lang==='az'?'Həftəlik Statistika':lang==='ru'?'Недельная Статистика':lang==='ar'?'إحصائيات الأسبوع':lang==='tr'?'Haftalık İstatistik':'Weekly Stats'}
              </Text>
            </View>
            <View style={styles.weekRow}>
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                const key = d.toISOString().slice(0, 10);
                const dayStats = stats[key] || {};
                const count = Object.values(dayStats).filter(v => v === 1).length;
                const pct = count / 5;
                const isToday = i === 6;
                const dayNames = { az:['B','BE','ÇA','Ç','CA','C','Ş'], en:['S','M','T','W','T','F','S'], ru:['В','П','В','С','Ч','П','С'], ar:['أ','إ','ث','أ','خ','ج','س'], tr:['P','P','S','Ç','P','C','C'] };
                const dayLabels = dayNames[lang] || dayNames.en;
                return (
                  <View key={i} style={styles.weekDay}>
                    <View style={[styles.weekBarBg, { backgroundColor: c.surfaceAlt }]}>
                      <View style={[styles.weekBar, { height: `${Math.max(pct * 100, 5)}%`, backgroundColor: pct > 0 ? c.primary : c.border }]} />
                    </View>
                    <Text style={[styles.weekCount, { color: c.primary }]}>{count}</Text>
                    <Text style={[styles.weekLabel, { color: isToday ? c.primary : c.textMuted, fontWeight: isToday ? '800' : '500' }]}>{dayLabels[d.getDay()]}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </FadeUp>

      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 14 },

  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },

  // City
  cityRow: { gap: 8, paddingBottom: 8 },
  cityBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  cityText: { fontSize: 13, fontWeight: '700' },

  // Next prayer card
  nextCard: {
    borderRadius: BorderRadius.xl,
    padding: 28,
    marginTop: 12,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  nextCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -40 },
  nextCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -30 },
  nextHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  nextLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nextDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  nextLabel: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 1, textTransform: 'uppercase' },
  nextEmoji: { fontSize: 36 },
  nextName: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 4, letterSpacing: -0.5 },
  nextTime: { fontSize: 48, fontWeight: '800', color: '#fff', letterSpacing: -1.5, marginBottom: 16 },
  countdownBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  countdownLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  countdownText: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },

  // Progress card
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 10,
  },
  progressTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  progressSub: { fontSize: 13, marginBottom: 10 },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  ringWrap: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginLeft: 16 },
  ringCenter: { position: 'absolute' },
  ringText: { fontSize: 16, fontWeight: '800' },

  // Times list
  timesList: { gap: 10 },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  timeIconWrap: { width: 46, height: 46, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  timeBody: { flex: 1 },
  timeName: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  nextBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  nextBadgeDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff' },
  nextBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  timeRight: { alignItems: 'flex-end', gap: 6 },
  timeValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },

  // Stats
  statsCard: { marginTop: 20, padding: 20, borderRadius: BorderRadius.lg, borderWidth: 1 },
  statsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  statsTitle: { fontSize: 16, fontWeight: '800' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 130 },
  weekDay: { alignItems: 'center', justifyContent: 'flex-end', flex: 1 },
  weekBarBg: { width: 24, height: 80, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end', marginBottom: 6 },
  weekBar: { width: '100%', borderRadius: 6 },
  weekCount: { fontSize: 12, fontWeight: '800', marginBottom: 2 },
  weekLabel: { fontSize: 11 },
});
