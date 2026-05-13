import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Animated as RNAnimated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import PageHero from '../components/PageHero';
import { FadeUp, FadeIn, Confetti, SuccessCheck, BounceIn, AnimatedNumber } from '../components/Animated';

const { width: SW } = Dimensions.get('window');
const AnimatedCircle = RNAnimated.createAnimatedComponent(Circle);

const RING_SIZE = 200;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const TAP_SIZE = 150;

const ADHKAR = [
  { ar:'سُبْحَانَ اللَّهِ', en:'SubhanAllah', target:33, virtue:{az:'Hər təsbeh sədəqədir',en:'Each tasbeeh is a charity',ru:'Каждый тасбих — садака',ar:'كل تسبيحة صدقة',tr:'Her tesbih bir sadakadır'} },
  { ar:'الْحَمْدُ لِلَّهِ', en:'Alhamdulillah', target:33, virtue:{az:'Tərəzi doldurar',en:'Fills the scales',ru:'Наполняет весы',ar:'تملأ الميزان',tr:'Teraziyi doldurur'} },
  { ar:'اللَّهُ أَكْبَرُ', en:'Allahu Akbar', target:33, virtue:{az:'Səmaları doldurar',en:'Fills the heavens',ru:'Наполняет небеса',ar:'تملأ السماوات',tr:'Gökleri doldurur'} },
  { ar:'لَا إِلَهَ إِلَّا اللَّهُ', en:'La ilaha illallah', target:100, virtue:{az:'Ən fəzilətli zikr',en:'Greatest dhikr',ru:'Величайший зикр',ar:'أفضل الذكر',tr:'En faziletli zikir'} },
  { ar:'أَسْتَغْفِرُ اللَّهَ', en:'Astaghfirullah', target:100, virtue:{az:'Günahların bağışlanması',en:'Forgiveness of sins',ru:'Прощение грехов',ar:'مغفرة الذنوب',tr:'Günahların bağışlanması'} },
  { ar:'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', en:'SubhanAllahi wa bihamdihi', target:100, virtue:{az:'Günahlar silinər',en:'Sins are erased',ru:'Грехи стираются',ar:'تُحَطّ الخطايا',tr:'Günahlar silinir'} },
  { ar:'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', en:'La hawla...', target:33, virtue:{az:'Cənnət xəzinəsi',en:'Treasure of Paradise',ru:'Сокровище Рая',ar:'كنز من كنوز الجنة',tr:'Cennet hazinesi'} },
  { ar:'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', en:'Salavat', target:100, virtue:{az:'10 savab yazılar',en:'10 rewards written',ru:'10 наград',ar:'يُكتب عشر حسنات',tr:'10 sevap yazılır'} },
];

export default function DhikrScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const t = T[lang]?.dhikr || T.az.dhikr;

  const [selIdx, setSelIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [log, setLog] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const tapScale = useRef(new RNAnimated.Value(1)).current;
  const progressAnim = useRef(new RNAnimated.Value(0)).current;
  const countScale = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem('dhikr_session').then(v => {
      try {
        if (v) {
          const data = JSON.parse(v);
          setSelIdx(data.selIdx || 0);
          setCount(data.count || 0);
          setLog(data.log || []);
          progressAnim.setValue((data.count || 0) / ADHKAR[data.selIdx || 0].target);
        }
      } catch {}
    });
  }, []);

  const save = async (idx, cnt, lg) => {
    await AsyncStorage.setItem('dhikr_session', JSON.stringify({ selIdx: idx, count: cnt, log: lg }));
  };

  const dhikr = ADHKAR[selIdx];
  const pct = Math.min(count / dhikr.target, 1);
  const isComplete = count >= dhikr.target;

  const tap = async () => {
    if (isComplete) return;
    const newCount = count + 1;
    setCount(newCount);

    RNAnimated.sequence([
      RNAnimated.timing(tapScale, { toValue: 0.93, duration: 60, useNativeDriver: true }),
      RNAnimated.spring(tapScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
    ]).start();

    RNAnimated.sequence([
      RNAnimated.timing(countScale, { toValue: 1.2, duration: 60, useNativeDriver: true }),
      RNAnimated.spring(countScale, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }),
    ]).start();

    RNAnimated.timing(progressAnim, { toValue: newCount / dhikr.target, duration: 300, useNativeDriver: false }).start();

    if (newCount >= dhikr.target) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Triger confetti + heavy impact
      setShowConfetti(false);
      setTimeout(() => setShowConfetti(true), 50);
      setTimeout(() => setShowConfetti(false), 2000);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 100);
      const newLog = [{ idx: selIdx, count: dhikr.target, time: Date.now() }, ...log].slice(0, 20);
      setLog(newLog);
      save(selIdx, newCount, newLog);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      save(selIdx, newCount, log);
    }
  };

  const reset = () => {
    setCount(0);
    RNAnimated.timing(progressAnim, { toValue: 0, duration: 400, useNativeDriver: false }).start();
    save(selIdx, 0, log);
  };

  const selectDhikr = (idx) => {
    setSelIdx(idx);
    setCount(0);
    progressAnim.setValue(0);
    save(idx, 0, log);
  };

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [RING_CIRCUMFERENCE, 0],
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero arabic="الذِّكْر" title={t.title} subtitle={t.subtitle} theme="dhikr" />

      <View style={styles.content}>

        {/* ═══ ZİKR SEÇİCİ ═══ */}
        <FadeUp delay={100}>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>{t.selectZikr}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorRow}>
            {ADHKAR.map((d, i) => {
              const active = selIdx === i;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.selectorBtn,
                    { backgroundColor: active ? c.primary : c.card, borderColor: active ? c.primary : c.cardBorder },
                    active ? Shadows.button : {},
                  ]}
                  onPress={() => selectDhikr(i)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.selAr, { color: active ? '#fff' : c.text }]} numberOfLines={1}>{d.ar}</Text>
                  <Text style={[styles.selEn, { color: active ? 'rgba(255,255,255,0.7)' : c.textMuted }]} numberOfLines={1}>{d.en}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </FadeUp>

        {/* ═══ TAP COUNTER ═══ */}
        <FadeIn delay={200}>
          <View style={styles.tapSection}>
            {/* SVG Progress Ring (arxada) */}
            <View style={styles.ringWrap}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <Circle
                  cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
                  fill="none" stroke={c.border} strokeWidth={RING_STROKE}
                />
                <AnimatedCircle
                  cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
                  fill="none"
                  stroke={isComplete ? c.gold : c.primary}
                  strokeWidth={RING_STROKE}
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                />
              </Svg>

              {/* Tap button (ortada, ring-in içində) */}
              <TouchableOpacity onPress={tap} activeOpacity={0.9} style={styles.tapBtnWrap}>
                <RNAnimated.View style={[
                  styles.tapBtn,
                  {
                    backgroundColor: isComplete ? (dark ? c.goldBg : c.goldBg) : c.card,
                    borderColor: isComplete ? c.gold : c.primaryBorder,
                    transform: [{ scale: tapScale }],
                  },
                  dark ? Shadows.dark.md : Shadows.md,
                ]}>
                  <Text style={[styles.tapArabic, { color: isComplete ? c.gold : c.primary }]} numberOfLines={1}>{dhikr.ar.slice(0, 12)}</Text>
                  <RNAnimated.View style={{ transform: [{ scale: countScale }] }}>
                    <Text style={[styles.tapCount, { color: isComplete ? c.gold : c.text }]}>{count}</Text>
                  </RNAnimated.View>
                  <Text style={[styles.tapTarget, { color: c.textMuted }]}>/ {dhikr.target}</Text>
                </RNAnimated.View>
              </TouchableOpacity>
            </View>

            {/* Confetti on complete */}
            <Confetti trigger={showConfetti} count={30} colors={[c.gold, c.primary, '#f59e0b', '#ec4899', '#3b82f6']} />

            {/* Complete badge */}
            {isComplete && (
              <BounceIn>
                <View style={[styles.completeBadge, { backgroundColor: c.goldBg, borderColor: c.gold + '40' }]}>
                  <Text style={[styles.completeText, { color: c.goldDark || c.gold }]}>✅ {t.complete}</Text>
                </View>
              </BounceIn>
            )}
          </View>
        </FadeIn>

        {/* ═══ ZİKR INFO ═══ */}
        <FadeUp delay={300}>
          <View style={[styles.infoCard, { backgroundColor: c.card, borderColor: c.cardBorder }, dark ? Shadows.dark.sm : Shadows.sm]}>
            <Text style={[styles.infoName, { color: c.text }]}>{dhikr.en}</Text>
            <View style={[styles.virtueBadge, { backgroundColor: c.primaryBg }]}>
              <Text style={[styles.virtueText, { color: c.textSecondary }]}>{dhikr.virtue[lang] || dhikr.virtue.en}</Text>
            </View>
          </View>
        </FadeUp>

        {/* ═══ STATS BAR ═══ */}
        <FadeUp delay={350}>
          <View style={[styles.statsBar, { backgroundColor: c.primaryBg, borderColor: c.primaryBorder }]}>
            <View style={styles.statItem}>
              <AnimatedNumber value={count} duration={500} style={[styles.statNum, { color: c.primary }]} />
              <Text style={[styles.statLabel, { color: c.textMuted }]}>
                {lang === 'az' ? 'Hal-hazırda' : lang === 'ru' ? 'Текущий' : lang === 'ar' ? 'الحالي' : lang === 'tr' ? 'Mevcut' : 'Current'}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: c.primaryBorder }]} />
            <View style={styles.statItem}>
              <AnimatedNumber value={log.length} duration={800} style={[styles.statNum, { color: c.primary }]} />
              <Text style={[styles.statLabel, { color: c.textMuted }]}>
                {lang === 'az' ? 'Sessiya' : lang === 'ru' ? 'Сессий' : lang === 'ar' ? 'جلسات' : lang === 'tr' ? 'Oturum' : 'Sessions'}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: c.primaryBorder }]} />
            <View style={styles.statItem}>
              <AnimatedNumber value={log.reduce((s, e) => s + e.count, 0)} duration={1200} style={[styles.statNum, { color: c.primary }]} />
              <Text style={[styles.statLabel, { color: c.textMuted }]}>
                {lang === 'az' ? 'Ümumi' : lang === 'ru' ? 'Всего' : lang === 'ar' ? 'الإجمالي' : lang === 'tr' ? 'Toplam' : 'Total'}
              </Text>
            </View>
          </View>
        </FadeUp>

        {/* ═══ PROGRESS BAR ═══ */}
        <FadeUp delay={380}>
          <View style={[styles.pctBarWrap, { backgroundColor: c.surfaceAlt }]}>
            <RNAnimated.View style={[styles.pctFill, {
              backgroundColor: isComplete ? c.gold : c.primary,
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }]} />
          </View>
          <Text style={[styles.pctText, { color: c.textMuted }]}>{Math.round(pct * 100)}%</Text>
        </FadeUp>

        {/* ═══ RESET ═══ */}
        <FadeUp delay={400}>
          <TouchableOpacity style={[styles.resetBtn, { backgroundColor: c.surfaceAlt, borderColor: c.border }]} onPress={reset} activeOpacity={0.7}>
            <Text style={[styles.resetText, { color: c.text }]}>🔄 {t.reset}</Text>
          </TouchableOpacity>
        </FadeUp>

        {/* ═══ SESSION LOG ═══ */}
        {log.length > 0 && (
          <FadeUp delay={450}>
            <View style={[styles.logCard, { backgroundColor: c.card, borderColor: c.cardBorder }, dark ? Shadows.dark.sm : Shadows.sm]}>
              <View style={styles.logHeader}>
                <Text style={[styles.logHeaderText, { color: c.textMuted }]}>{t.session.toUpperCase()}</Text>
                <TouchableOpacity onPress={() => { setLog([]); save(selIdx, count, []); }}>
                  <Text style={[styles.clearText, { color: c.error }]}>{t.clearSession}</Text>
                </TouchableOpacity>
              </View>
              {log.map((entry, i) => (
                <View key={i} style={[styles.logRow, i < log.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
                  <Text style={[styles.logName, { color: c.text }]}>{ADHKAR[entry.idx]?.en || '—'}</Text>
                  <Text style={[styles.logCount, { color: c.primary }]}>×{entry.count}</Text>
                  <Text style={[styles.logTime, { color: c.textMuted }]}>{new Date(entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              ))}
            </View>
          </FadeUp>
        )}

      </View>
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12 },

  // Section label
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },

  // Selector
  selectorRow: { gap: 8, paddingBottom: 4, marginBottom: 24 },
  selectorBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 1.5, alignItems: 'center', minWidth: 90 },
  selAr: { fontSize: 15, marginBottom: 2 },
  selEn: { fontSize: 10, fontWeight: '600' },

  // Tap section
  tapSection: { alignItems: 'center', marginBottom: 24 },
  ringWrap: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  tapBtnWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  tapBtn: {
    width: TAP_SIZE,
    height: TAP_SIZE,
    borderRadius: TAP_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapArabic: { fontSize: 13, marginBottom: 2 },
  tapCount: { fontSize: 44, fontWeight: '800', letterSpacing: -1 },
  tapTarget: { fontSize: 14, marginTop: -2 },

  // Complete
  completeBadge: { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 14, borderWidth: 1, marginTop: 12 },
  completeText: { fontSize: 15, fontWeight: '700' },

  // Info card
  infoCard: { padding: 18, borderRadius: BorderRadius.lg, borderWidth: 1, alignItems: 'center', marginBottom: 16 },
  infoName: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  virtueBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: BorderRadius.full },
  virtueText: { fontSize: 13, fontStyle: 'italic', textAlign: 'center' },

  // Stats bar
  statsBar: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md, borderWidth: 1, padding: 14, marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, height: 28 },

  // Progress bar
  pctBarWrap: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  pctFill: { height: '100%', borderRadius: 3 },
  pctText: { fontSize: 12, textAlign: 'center', marginBottom: 14 },

  // Reset
  resetBtn: { paddingVertical: 14, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center', marginBottom: 20 },
  resetText: { fontSize: 15, fontWeight: '600' },

  // Log
  logCard: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: 18, marginBottom: 10 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  logHeaderText: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  clearText: { fontSize: 13, fontWeight: '500' },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  logName: { flex: 1, fontSize: 14, fontWeight: '600' },
  logCount: { fontSize: 14, fontWeight: '700' },
  logTime: { fontSize: 12 },
});
