import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn, AnimatedNumber } from '../components/Animated';

const { width: SW } = Dimensions.get('window');

const LABELS = {
  az: { title:'Statistika', sub:'Fəaliyyət icmalı', prayers:'Namaz', quran:'Quran', hadith:'Hədis', dua:'Dua', charity:'Sədəqə', dhikr:'Zikr', hifz:'Hifz', quiz:'Quiz', days:'Aktiv gün', streak:'Ardıcıl', favs:'Favorit', sessions:'Sessiya', deeds:'Əməl', memorized:'Əzbər', score:'Xal', prayersDone:'Qılınmış', answered:'Qəbul', overview:'Ümumi baxış', daysActive:'Aktiv gün', totalPrayers:'Ümumi namaz' },
  en: { title:'Analytics', sub:'Activity summary', prayers:'Prayers', quran:'Quran', hadith:'Hadith', dua:'Dua', charity:'Charity', dhikr:'Dhikr', hifz:'Hifz', quiz:'Quiz', days:'Active days', streak:'Streak', favs:'Favorites', sessions:'Sessions', deeds:'Deeds', memorized:'Memorized', score:'Score', prayersDone:'Completed', answered:'Answered', overview:'Overview', daysActive:'Active days', totalPrayers:'Total prayers' },
  ru: { title:'Статистика', sub:'Обзор', prayers:'Намаз', quran:'Коран', hadith:'Хадис', dua:'Дуа', charity:'Садака', dhikr:'Зикр', hifz:'Хифз', quiz:'Тест', days:'Активных', streak:'Подряд', favs:'Избранных', sessions:'Сессий', deeds:'Дел', memorized:'Выучено', score:'Счёт', prayersDone:'Выполнено', answered:'Принято', overview:'Обзор', daysActive:'Дней', totalPrayers:'Намазов' },
  ar: { title:'الإحصائيات', sub:'ملخص النشاط', prayers:'الصلاة', quran:'القرآن', hadith:'الحديث', dua:'الدعاء', charity:'الصدقة', dhikr:'الذكر', hifz:'الحفظ', quiz:'الاختبار', days:'يوم نشاط', streak:'متتالية', favs:'المفضلة', sessions:'جلسات', deeds:'أعمال', memorized:'محفوظ', score:'نتيجة', prayersDone:'مكتملة', answered:'مستجاب', overview:'نظرة عامة', daysActive:'أيام', totalPrayers:'صلوات' },
  tr: { title:'İstatistikler', sub:'Aktivite özeti', prayers:'Namaz', quran:'Kuran', hadith:'Hadis', dua:'Dua', charity:'Sadaka', dhikr:'Zikir', hifz:'Hıfz', quiz:'Sınav', days:'Aktif gün', streak:'Seri', favs:'Favori', sessions:'Oturum', deeds:'İşler', memorized:'Ezberlendi', score:'Puan', prayersDone:'Tamamlandı', answered:'Kabul', overview:'Genel', daysActive:'Gün', totalPrayers:'Namaz' },
};

export default function AnalyticsScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const sh = dark ? Shadows.dark.md : Shadows.md;
  const shS = dark ? Shadows.dark.sm : Shadows.sm;

  const [data, setData] = useState({
    prayerDays: 0, prayerTotal: 0,
    quranSessions: 0, quranSurahs: 0,
    hadithFavs: 0, duaFavs: 0,
    charityDeeds: 0, charityAmount: 0,
    dhikrSessions: 0,
    hifzMemorized: 0,
    quizBest: 0,
    duaJournalActive: 0, duaJournalAnswered: 0,
    totalActivities: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const prayerStats = JSON.parse(await AsyncStorage.getItem('muslim_cc_prayer_stats') || '{}');
        const quranStats = JSON.parse(await AsyncStorage.getItem('quran_stats') || '{}');
        const hadithFavs = JSON.parse(await AsyncStorage.getItem('hadith_favs') || '[]');
        const duaFavs = JSON.parse(await AsyncStorage.getItem('dua_favs') || '[]');
        const charityLog = JSON.parse(await AsyncStorage.getItem('charity_log') || '[]');
        const dhikrSession = JSON.parse(await AsyncStorage.getItem('dhikr_session') || '{}');
        const hifzProgress = JSON.parse(await AsyncStorage.getItem('hifz_progress') || '{}');
        const quizScores = JSON.parse(await AsyncStorage.getItem('quiz_scores') || '{}');
        const duaJournal = JSON.parse(await AsyncStorage.getItem('dua_journal') || '{"duas":[]}');

        const prayerDays = Object.keys(prayerStats).length;
        const prayerTotal = Object.values(prayerStats).reduce((s, d) => s + Object.values(d).filter(v => v === 1).length, 0);
        const totalActivities = prayerTotal + (quranStats.sessions || 0) + charityLog.length + (dhikrSession.log || []).length;

        setData({
          prayerDays,
          prayerTotal,
          quranSessions: quranStats.sessions || 0,
          quranSurahs: Object.keys(quranStats.reads || {}).length,
          hadithFavs: hadithFavs.length,
          duaFavs: duaFavs.length,
          charityDeeds: charityLog.length,
          charityAmount: charityLog.reduce((s, e) => s + (e.amount || 0), 0),
          dhikrSessions: (dhikrSession.log || []).length,
          hifzMemorized: Object.values(hifzProgress).filter(v => v === 2).length,
          quizBest: Math.max(...Object.values(quizScores), 0),
          duaJournalActive: (duaJournal.duas || []).filter(d => !d.answered).length,
          duaJournalAnswered: (duaJournal.duas || []).filter(d => d.answered).length,
          totalActivities,
        });
      } catch {}
    })();
  }, []);

  const cards = [
    { iconKey:'prayer', label:l.prayers, color:'#3b82f6', gradient:['#3b82f6','#2563eb'], items:[{v:data.prayerDays,l:l.days},{v:data.prayerTotal,l:l.prayersDone}] },
    { iconKey:'quran', label:l.quran, color:'#10b981', gradient:['#10b981','#059669'], items:[{v:data.quranSessions,l:l.sessions},{v:data.quranSurahs,l:'Surahs'}] },
    { iconKey:'hadith', label:l.hadith, color:'#f59e0b', gradient:['#f59e0b','#d97706'], items:[{v:data.hadithFavs,l:l.favs}] },
    { iconKey:'duas', label:l.dua, color:'#8b5cf6', gradient:['#8b5cf6','#7c3aed'], items:[{v:data.duaFavs,l:l.favs},{v:data.duaJournalAnswered,l:l.answered}] },
    { iconKey:'dhikr', label:l.dhikr, color:'#06b6d4', gradient:['#06b6d4','#0891b2'], items:[{v:data.dhikrSessions,l:l.sessions}] },
    { iconKey:'charity', label:l.charity, color:'#f97316', gradient:['#f97316','#ea580c'], items:[{v:data.charityDeeds,l:l.deeds},{v:data.charityAmount.toFixed(0),l:'$'}] },
    { iconKey:'hifz', label:l.hifz, color:'#14b8a6', gradient:['#14b8a6','#0d9488'], items:[{v:data.hifzMemorized,l:l.memorized}] },
    { iconKey:'quiz', label:l.quiz, color:'#ec4899', gradient:['#ec4899','#db2777'], items:[{v:data.quizBest,l:l.score}] },
  ];

  // Progress ring
  const RING_SIZE = 140;
  const RING_RADIUS = (RING_SIZE - 14) / 2;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  const activityTarget = 100;
  const activityPct = Math.min(data.totalActivities / activityTarget, 1);

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero arabic="الإِحْصَائِيَّات" title={l.title} subtitle={l.sub} />

      <View style={styles.content}>

        {/* Overview card */}
        <ScaleIn delay={100}>
          <LinearGradient
            colors={[c.primary, c.primaryDark, c.ctaGradStart]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.overviewCard, sh]}
          >
            <View style={styles.ovCircle1} />
            <View style={styles.ovCircle2} />

            <Text style={styles.ovLabel}>{l.overview}</Text>

            <View style={styles.ovContent}>
              <View style={styles.ovRing}>
                <Svg width={RING_SIZE} height={RING_SIZE}>
                  <Circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={10} />
                  <Circle
                    cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_RADIUS} fill="none"
                    stroke="#fff" strokeWidth={10}
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={RING_CIRCUMFERENCE * (1 - activityPct)}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${RING_SIZE/2} ${RING_SIZE/2})`}
                  />
                </Svg>
                <View style={styles.ovRingCenter}>
                  <AnimatedNumber value={data.totalActivities} duration={1800} style={styles.ovRingNum} />
                  <Text style={styles.ovRingLabel}>
                    {lang==='az'?'fəaliyyət':lang==='ru'?'действий':lang==='ar'?'نشاط':lang==='tr'?'aktivite':'activities'}
                  </Text>
                </View>
              </View>

              <View style={styles.ovStats}>
                <View style={styles.ovStatItem}>
                  <AppIcon name="calendar" size={14} color="rgba(255,255,255,0.85)" />
                  <AnimatedNumber value={data.prayerDays} duration={1500} style={styles.ovStatNum} />
                  <Text style={styles.ovStatLabel}>{l.daysActive}</Text>
                </View>
                <View style={styles.ovStatItem}>
                  <AppIcon name="prayer" size={14} color="rgba(255,255,255,0.85)" />
                  <AnimatedNumber value={data.prayerTotal} duration={1500} style={styles.ovStatNum} />
                  <Text style={styles.ovStatLabel}>{l.totalPrayers}</Text>
                </View>
                <View style={styles.ovStatItem}>
                  <AppIcon name="trophy" size={14} color="rgba(255,255,255,0.85)" />
                  <AnimatedNumber value={data.quizBest} duration={1500} style={styles.ovStatNum} />
                  <Text style={styles.ovStatLabel}>{l.score}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </ScaleIn>

        {/* Cards grid */}
        <FadeUp delay={200}>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
            {lang==='az'?'TƏFSİLLƏR':lang==='ru'?'ПОДРОБНОСТИ':lang==='ar'?'التفاصيل':lang==='tr'?'DETAYLAR':'DETAILS'}
          </Text>
        </FadeUp>

        <View style={styles.cardsGrid}>
          {cards.map((card, i) => (
            <FadeUp key={i} delay={300 + i * 60} style={{ flex: 1, flexBasis: '47%' }}>
              <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }, shS]}>
                <LinearGradient
                  colors={[card.color + '15', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <LinearGradient colors={card.gradient} style={styles.cardIconWrap}>
                  <AppIcon name={card.iconKey} size={20} color="#fff" />
                </LinearGradient>
                <Text style={[styles.cardLabel, { color: c.text }]}>{card.label}</Text>
                {card.items.map((item, j) => (
                  <View key={j} style={styles.cardItem}>
                    <AnimatedNumber value={item.v} duration={1200} style={[styles.cardItemNum, { color: card.color }]} />
                    <Text style={[styles.cardItemLabel, { color: c.textMuted }]}>{item.l}</Text>
                  </View>
                ))}
              </View>
            </FadeUp>
          ))}
        </View>
      </View>
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 14 },

  // Overview
  overviewCard: {
    padding: 26,
    borderRadius: BorderRadius.xxl,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  ovCircle1: { position: 'absolute', width: 230, height: 230, borderRadius: 115, backgroundColor: 'rgba(255,255,255,0.08)', top: -70, right: -50 },
  ovCircle2: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -50, left: -40 },
  ovLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 20 },
  ovContent: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  ovRing: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  ovRingCenter: { position: 'absolute', alignItems: 'center' },
  ovRingNum: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  ovRingLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  ovStats: { flex: 1, gap: 10 },
  ovStatItem: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BorderRadius.md, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  ovStatNum: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 2 },
  ovStatLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: 0.3 },

  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },

  // Cards grid
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardIconWrap: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cardLabel: { fontSize: 13, fontWeight: '800', marginBottom: 10, letterSpacing: -0.2 },
  cardItem: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 4 },
  cardItemNum: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  cardItemLabel: { fontSize: 10, fontWeight: '700' },
});
