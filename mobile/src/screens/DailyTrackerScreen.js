import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn } from '../components/Animated';

const { width: SW } = Dimensions.get('window');

const ACTIVITIES = [
  { key:'fajr', iconKey:'fajr', gradient:['#6366f1','#4338ca'] },
  { key:'dhuhr', iconKey:'dhuhr', gradient:['#fbbf24','#f59e0b'] },
  { key:'asr', iconKey:'asr', gradient:['#f97316','#ea580c'] },
  { key:'maghrib', iconKey:'maghrib', gradient:['#ec4899','#db2777'] },
  { key:'isha', iconKey:'isha', gradient:['#1e3a8a','#0f172a'] },
  { key:'quran', iconKey:'quran', gradient:['#10b981','#059669'] },
  { key:'morning_adhkar', iconKey:'sunrise', gradient:['#f59e0b','#d97706'] },
  { key:'evening_adhkar', iconKey:'isha', gradient:['#8b5cf6','#7c3aed'] },
  { key:'dhikr', iconKey:'dhikr', gradient:['#06b6d4','#0891b2'] },
  { key:'sadaqah', iconKey:'charity', gradient:['#14b8a6','#0d9488'] },
];

const LABELS = {
  az: { title:'Gündəlik İzləyici', sub:'İbadətlərinizi qeyd edin', fajr:'Sübh', dhuhr:'Zöhr', asr:'Əsr', maghrib:'Məğrib', isha:'İşa', quran:'Quran', morning_adhkar:'Səhər əzkarı', evening_adhkar:'Axşam əzkarı', dhikr:'Zikr', sadaqah:'Sədəqə', today:'Bu gün', week:'Həftə', streak:'Ardıcıl', completed:'Tamamlandı', progress:'İrəliləyiş' },
  en: { title:'Daily Tracker', sub:'Track your daily ibadah', fajr:'Fajr', dhuhr:'Dhuhr', asr:'Asr', maghrib:'Maghrib', isha:'Isha', quran:'Quran', morning_adhkar:'Morning Adhkar', evening_adhkar:'Evening Adhkar', dhikr:'Dhikr', sadaqah:'Sadaqah', today:'Today', week:'Week', streak:'Streak', completed:'Completed', progress:'Progress' },
  ru: { title:'Ежедневный Трекер', sub:'Отслеживайте ибадат', fajr:'Фаджр', dhuhr:'Зухр', asr:'Аср', maghrib:'Магриб', isha:'Иша', quran:'Коран', morning_adhkar:'Утренние', evening_adhkar:'Вечерние', dhikr:'Зикр', sadaqah:'Садака', today:'Сегодня', week:'Неделя', streak:'Подряд', completed:'Завершено', progress:'Прогресс' },
  ar: { title:'المتابعة اليومية', sub:'تتبع عباداتك', fajr:'الفجر', dhuhr:'الظهر', asr:'العصر', maghrib:'المغرب', isha:'العشاء', quran:'القرآن', morning_adhkar:'أذكار الصباح', evening_adhkar:'أذكار المساء', dhikr:'الذكر', sadaqah:'الصدقة', today:'اليوم', week:'الأسبوع', streak:'متتالية', completed:'مكتمل', progress:'التقدم' },
  tr: { title:'Günlük Takip', sub:'İbadetlerinizi kaydedin', fajr:'Sabah', dhuhr:'Öğle', asr:'İkindi', maghrib:'Akşam', isha:'Yatsı', quran:'Kuran', morning_adhkar:'Sabah', evening_adhkar:'Akşam', dhikr:'Zikir', sadaqah:'Sadaka', today:'Bugün', week:'Hafta', streak:'Seri', completed:'Tamamlandı', progress:'İlerleme' },
};

export default function DailyTrackerScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const sh = dark ? Shadows.dark.md : Shadows.md;
  const shS = dark ? Shadows.dark.sm : Shadows.sm;
  const today = new Date().toISOString().slice(0, 10);

  const [data, setData] = useState({});

  useEffect(() => {
    AsyncStorage.getItem('daily_tracker').then(v => {
      try { if (v) setData(JSON.parse(v)); } catch {}
    });
  }, []);

  const toggle = async (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newData = { ...data };
    if (!newData[today]) newData[today] = {};
    newData[today][key] = !newData[today][key];
    setData(newData);
    await AsyncStorage.setItem('daily_tracker', JSON.stringify(newData));
  };

  const todayData = data[today] || {};
  const completed = ACTIVITIES.filter(a => todayData[a.key]).length;
  const pct = completed / ACTIVITIES.length;

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

  // Ring
  const RING_SIZE = 160;
  const RING_RADIUS = (RING_SIZE - 18) / 2;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero arabic="المُتَابَعَة" title={l.title} subtitle={l.sub} />

      <View style={styles.content}>

        {/* Progress ring card */}
        <ScaleIn delay={100}>
          <LinearGradient
            colors={pct === 1 ? [c.gold, c.goldDark || '#b8860b'] : [c.primary, c.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.ringCard, sh]}
          >
            <View style={styles.ringCircle1} />
            <View style={styles.ringCircle2} />

            <View style={styles.ringWrap}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <Circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={12} />
                <Circle
                  cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_RADIUS} fill="none"
                  stroke="#fff" strokeWidth={12}
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE * (1 - pct)}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${RING_SIZE/2} ${RING_SIZE/2})`}
                />
              </Svg>
              <View style={styles.ringCenter}>
                <Text style={styles.ringPct}>{Math.round(pct * 100)}%</Text>
                <Text style={styles.ringCount}>{completed}/{ACTIVITIES.length}</Text>
              </View>
            </View>

            <Text style={styles.ringLabel}>{l.today}</Text>
          </LinearGradient>
        </ScaleIn>

        {/* Stats row */}
        <FadeUp delay={200}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: c.card, borderColor: c.cardBorder }, shS]}>
              <View style={[styles.statIconWrap, { backgroundColor: '#10b98120' }]}>
                <AppIcon name="check" size={18} color="#10b981" />
              </View>
              <Text style={[styles.statNum, { color: c.text }]}>{completed}</Text>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>{l.completed}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: c.card, borderColor: c.cardBorder }, shS]}>
              <View style={[styles.statIconWrap, { backgroundColor: '#f59e0b20' }]}>
                <AppIcon name="trophy" size={18} color="#f59e0b" />
              </View>
              <Text style={[styles.statNum, { color: c.text }]}>{streak}</Text>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>{l.streak}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: c.card, borderColor: c.cardBorder }, shS]}>
              <View style={[styles.statIconWrap, { backgroundColor: '#8b5cf620' }]}>
                <AppIcon name="analytics" size={18} color="#8b5cf6" />
              </View>
              <Text style={[styles.statNum, { color: c.text }]}>{Math.round(pct * 100)}%</Text>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>{l.progress}</Text>
            </View>
          </View>
        </FadeUp>

        {/* Activities list */}
        <FadeUp delay={300}>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
            {lang==='az'?'FƏALİYYƏTLƏR':lang==='ru'?'ДЕЙСТВИЯ':lang==='ar'?'الأنشطة':lang==='tr'?'FAALİYETLER':'ACTIVITIES'}
          </Text>
        </FadeUp>

        {ACTIVITIES.map((a, i) => {
          const done = todayData[a.key];
          return (
            <FadeUp key={a.key} delay={350 + i * 50}>
              <TouchableOpacity
                onPress={() => toggle(a.key)}
                activeOpacity={0.8}
                style={[
                  styles.activityCard,
                  { backgroundColor: c.card, borderColor: done ? a.gradient[0] : c.cardBorder },
                  shS,
                ]}
              >
                {done && (
                  <LinearGradient
                    colors={[a.gradient[0] + '15', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.5 }}
                  />
                )}

                <LinearGradient colors={a.gradient} style={styles.activityIconWrap}>
                  <AppIcon name={a.iconKey} size={22} color="#fff" />
                </LinearGradient>

                <Text style={[styles.activityLabel, { color: c.text }]}>{l[a.key]}</Text>

                <View style={[
                  styles.checkWrap,
                  done
                    ? { backgroundColor: a.gradient[0], borderColor: a.gradient[0] }
                    : { backgroundColor: 'transparent', borderColor: c.border },
                ]}>
                  {done && <AppIcon name="check" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>
            </FadeUp>
          );
        })}
      </View>
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 14 },

  // Ring card
  ringCard: {
    padding: 32,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  ringCircle1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -40 },
  ringCircle2: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -30 },
  ringWrap: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringPct: { fontSize: 40, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  ringCount: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '700', marginTop: -4 },
  ringLabel: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 1, marginTop: 14, textTransform: 'uppercase' },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, alignItems: 'center', padding: 16, borderRadius: BorderRadius.lg, borderWidth: 1 },
  statIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statNum: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, marginTop: 2, fontWeight: '700' },

  // Section label
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },

  // Activity card
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginBottom: 10,
    overflow: 'hidden',
  },
  activityIconWrap: { width: 46, height: 46, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  activityLabel: { flex: 1, fontSize: 15, fontWeight: '700' },
  checkWrap: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
