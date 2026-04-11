import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn } from '../components/Animated';

const SURAHS = [
  {n:1,name:'Al-Fatihah',ar:'الفاتحة',ayahs:7},
  {n:2,name:'Al-Baqarah',ar:'البقرة',ayahs:286},
  {n:3,name:"Ali 'Imran",ar:'آل عمران',ayahs:200},
  {n:4,name:'An-Nisa',ar:'النساء',ayahs:176},
  {n:78,name:'An-Naba',ar:'النبأ',ayahs:40},
  {n:87,name:'Al-Ala',ar:'الأعلى',ayahs:19},
  {n:93,name:'Ad-Duhaa',ar:'الضحى',ayahs:11},
  {n:94,name:'Ash-Sharh',ar:'الشرح',ayahs:8},
  {n:95,name:'At-Tin',ar:'التين',ayahs:8},
  {n:96,name:'Al-Alaq',ar:'العلق',ayahs:19},
  {n:97,name:'Al-Qadr',ar:'القدر',ayahs:5},
  {n:98,name:'Al-Bayyinah',ar:'البينة',ayahs:8},
  {n:99,name:'Az-Zalzalah',ar:'الزلزلة',ayahs:8},
  {n:100,name:'Al-Adiyat',ar:'العاديات',ayahs:11},
  {n:101,name:'Al-Qariah',ar:'القارعة',ayahs:11},
  {n:102,name:'At-Takathur',ar:'التكاثر',ayahs:8},
  {n:103,name:'Al-Asr',ar:'العصر',ayahs:3},
  {n:104,name:'Al-Humazah',ar:'الهمزة',ayahs:9},
  {n:105,name:'Al-Fil',ar:'الفيل',ayahs:5},
  {n:106,name:'Quraysh',ar:'قريش',ayahs:4},
  {n:107,name:"Al-Ma'un",ar:'الماعون',ayahs:7},
  {n:108,name:'Al-Kawthar',ar:'الكوثر',ayahs:3},
  {n:109,name:'Al-Kafirun',ar:'الكافرون',ayahs:6},
  {n:110,name:'An-Nasr',ar:'النصر',ayahs:3},
  {n:111,name:'Al-Masad',ar:'المسد',ayahs:5},
  {n:112,name:'Al-Ikhlas',ar:'الإخلاص',ayahs:4},
  {n:113,name:'Al-Falaq',ar:'الفلق',ayahs:5},
  {n:114,name:'An-Nas',ar:'الناس',ayahs:6},
];

const STATUS = [
  { color:'#94a3b8', gradient:['#94a3b8','#64748b'], icon:'close' },
  { color:'#f59e0b', gradient:['#f59e0b','#d97706'], icon:'time' },
  { color:'#10b981', gradient:['#10b981','#059669'], icon:'check' },
];

const LABELS = {
  az: { title:'Hifz İzləyicisi', sub:'Quran əzbərləmə prosesi', memorized:'Əzbər', inProgress:'Davam edir', notStarted:'Başlamayıb', total:'Ümumi' },
  en: { title:'Hifz Tracker', sub:'Quran memorization progress', memorized:'Memorized', inProgress:'In Progress', notStarted:'Not Started', total:'Total' },
  ru: { title:'Хифз Трекер', sub:'Заучивание Корана', memorized:'Выучено', inProgress:'В процессе', notStarted:'Не начато', total:'Всего' },
  ar: { title:'متابعة الحفظ', sub:'تقدم حفظ القرآن', memorized:'محفوظة', inProgress:'جارٍ الحفظ', notStarted:'لم يبدأ', total:'الإجمالي' },
  tr: { title:'Hıfz Takibi', sub:'Kuran ezberleme süreci', memorized:'Ezberlendi', inProgress:'Devam ediyor', notStarted:'Başlanmadı', total:'Toplam' },
};

export default function HifzScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const sh = dark ? Shadows.dark.md : Shadows.md;
  const shS = dark ? Shadows.dark.sm : Shadows.sm;

  const [progress, setProgress] = useState({});

  useEffect(() => {
    AsyncStorage.getItem('hifz_progress').then(v => {
      try { if (v) setProgress(JSON.parse(v)); } catch {}
    });
  }, []);

  const cycle = async (n) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const current = progress[n] || 0;
    const next = (current + 1) % 3;
    const newProgress = { ...progress, [n]: next };
    setProgress(newProgress);
    await AsyncStorage.setItem('hifz_progress', JSON.stringify(newProgress));
  };

  const memorized = Object.values(progress).filter(v => v === 2).length;
  const inProg = Object.values(progress).filter(v => v === 1).length;
  const notStarted = SURAHS.length - memorized - inProg;
  const totalPct = Math.round((memorized / SURAHS.length) * 100);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="حِفْظُ القُرْآن" title={l.title} subtitle={l.sub} />

      <View style={styles.content}>

        {/* Progress banner */}
        <ScaleIn delay={100}>
          <LinearGradient
            colors={[c.primary, c.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bannerCard, sh]}
          >
            <View style={styles.bannerCircle1} />
            <View style={styles.bannerCircle2} />
            <AppIcon name="hifz" size={32} color="#fff" />
            <Text style={styles.bannerNum}>{totalPct}%</Text>
            <Text style={styles.bannerLabel}>
              {lang==='az'?'Ümumi İrəliləyiş':lang==='ru'?'Общий Прогресс':lang==='ar'?'التقدم الكلي':lang==='tr'?'Genel İlerleme':'Overall Progress'}
            </Text>
            <View style={styles.bannerBar}>
              <View style={[styles.bannerBarFill, { width: `${totalPct}%` }]} />
            </View>
          </LinearGradient>
        </ScaleIn>

        {/* Stats */}
        <FadeUp delay={200}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#10b98115', borderColor: '#10b98130' }]}>
              <AppIcon name="check" size={20} color="#10b981" />
              <Text style={[styles.statNum, { color: '#10b981' }]}>{memorized}</Text>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>{l.memorized}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#f59e0b15', borderColor: '#f59e0b30' }]}>
              <AppIcon name="time" size={20} color="#f59e0b" />
              <Text style={[styles.statNum, { color: '#f59e0b' }]}>{inProg}</Text>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>{l.inProgress}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
              <AppIcon name="close" size={20} color={c.textMuted} />
              <Text style={[styles.statNum, { color: c.textMuted }]}>{notStarted}</Text>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>{l.notStarted}</Text>
            </View>
          </View>
        </FadeUp>

        {/* Surah list */}
        <FadeUp delay={300}>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
            {lang==='az'?'SURƏLƏR':lang==='ru'?'СУРЫ':lang==='ar'?'السور':lang==='tr'?'SURELER':'SURAHS'}
          </Text>
        </FadeUp>

        <FlatList
          data={SURAHS}
          keyExtractor={s => String(s.n)}
          numColumns={2}
          columnWrapperStyle={{ gap: 10 }}
          renderItem={({ item: s, index: i }) => {
            const status = progress[s.n] || 0;
            const meta = STATUS[status];
            return (
              <FadeUp delay={Math.min(400 + i * 30, 800)} style={{ flex: 1 }}>
                <TouchableOpacity
                  onPress={() => cycle(s.n)}
                  activeOpacity={0.8}
                  style={{ flex: 1 }}
                >
                  <View style={[styles.surahCard, { backgroundColor: c.card, borderColor: meta.color }, shS]}>
                    <LinearGradient
                      colors={[meta.color + '15', 'transparent']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <View style={styles.surahHeader}>
                      <View style={[styles.surahNum, { backgroundColor: meta.color + '18' }]}>
                        <Text style={[styles.surahNumText, { color: meta.color }]}>{s.n}</Text>
                      </View>
                      <LinearGradient colors={meta.gradient} style={styles.statusIconWrap}>
                        <AppIcon name={meta.icon} size={12} color="#fff" />
                      </LinearGradient>
                    </View>
                    <Text style={[styles.surahArabic, { color: c.text }]}>{s.ar}</Text>
                    <Text style={[styles.surahName, { color: c.text }]}>{s.name}</Text>
                    <Text style={[styles.surahAyahs, { color: c.textMuted }]}>{s.ayahs} {lang==='ar'?'آية':'ayah'}</Text>
                  </View>
                </TouchableOpacity>
              </FadeUp>
            );
          }}
          contentContainerStyle={{ paddingBottom: 40, gap: 10 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },

  // Banner
  bannerCard: {
    padding: 24,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -40 },
  bannerCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -30 },
  bannerNum: { fontSize: 48, fontWeight: '800', color: '#fff', marginTop: 10, letterSpacing: -1 },
  bannerLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 14 },
  bannerBar: { width: '100%', height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  bannerBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, alignItems: 'center', padding: 14, borderRadius: BorderRadius.lg, borderWidth: 1 },
  statNum: { fontSize: 22, fontWeight: '800', marginTop: 6, letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: '700', marginTop: 2 },

  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },

  // Surah card
  surahCard: {
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginBottom: 10,
    overflow: 'hidden',
  },
  surahHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  surahNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  surahNumText: { fontSize: 12, fontWeight: '800' },
  statusIconWrap: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  surahArabic: { fontSize: 22, textAlign: 'center', marginBottom: 4 },
  surahName: { fontSize: 13, fontWeight: '800', textAlign: 'center', marginBottom: 2 },
  surahAyahs: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
});
