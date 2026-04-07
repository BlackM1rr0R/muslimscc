import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLang } from '../contexts/LangContext';
import { Colors } from '../theme/colors';
import PageHero from '../components/PageHero';

const SURAHS_SHORT = [
  {n:1,name:'Al-Fatihah',ar:'الفاتحة',ayahs:7},{n:2,name:'Al-Baqarah',ar:'البقرة',ayahs:286},
  {n:3,name:"Ali 'Imran",ar:'آل عمران',ayahs:200},{n:4,name:'An-Nisa',ar:'النساء',ayahs:176},
  {n:78,name:'An-Naba',ar:'النبأ',ayahs:40},{n:87,name:'Al-Ala',ar:'الأعلى',ayahs:19},
  {n:93,name:'Ad-Duhaa',ar:'الضحى',ayahs:11},{n:94,name:'Ash-Sharh',ar:'الشرح',ayahs:8},
  {n:95,name:'At-Tin',ar:'التين',ayahs:8},{n:96,name:'Al-Alaq',ar:'العلق',ayahs:19},
  {n:97,name:'Al-Qadr',ar:'القدر',ayahs:5},{n:98,name:'Al-Bayyinah',ar:'البينة',ayahs:8},
  {n:99,name:'Az-Zalzalah',ar:'الزلزلة',ayahs:8},{n:100,name:'Al-Adiyat',ar:'العاديات',ayahs:11},
  {n:101,name:'Al-Qariah',ar:'القارعة',ayahs:11},{n:102,name:'At-Takathur',ar:'التكاثر',ayahs:8},
  {n:103,name:'Al-Asr',ar:'العصر',ayahs:3},{n:104,name:'Al-Humazah',ar:'الهمزة',ayahs:9},
  {n:105,name:'Al-Fil',ar:'الفيل',ayahs:5},{n:106,name:'Quraysh',ar:'قريش',ayahs:4},
  {n:107,name:"Al-Ma'un",ar:'الماعون',ayahs:7},{n:108,name:'Al-Kawthar',ar:'الكوثر',ayahs:3},
  {n:109,name:'Al-Kafirun',ar:'الكافرون',ayahs:6},{n:110,name:'An-Nasr',ar:'النصر',ayahs:3},
  {n:111,name:'Al-Masad',ar:'المسد',ayahs:5},{n:112,name:'Al-Ikhlas',ar:'الإخلاص',ayahs:4},
  {n:113,name:'Al-Falaq',ar:'الفلق',ayahs:5},{n:114,name:'An-Nas',ar:'الناس',ayahs:6},
];

const STATUS_COLORS = ['#e0e0e0', '#ff9800', '#4caf50'];
const STATUS_ICONS = ['⬜', '🔶', '✅'];

const LABELS = {
  az: { title:'Hifz İzləyicisi', sub:'Quran əzbərləmə', memorized:'Əzbər', inProgress:'Davam edir', notStarted:'Başlamayıb', total:'Ümumi irəliləyiş' },
  en: { title:'Hifz Tracker', sub:'Quran memorization', memorized:'Memorized', inProgress:'In Progress', notStarted:'Not Started', total:'Total Progress' },
  ru: { title:'Хифз Трекер', sub:'Заучивание Корана', memorized:'Выучено', inProgress:'В процессе', notStarted:'Не начато', total:'Общий прогресс' },
  ar: { title:'متابعة الحفظ', sub:'حفظ القرآن', memorized:'محفوظة', inProgress:'جارٍ الحفظ', notStarted:'لم يبدأ', total:'التقدم الكلي' },
  tr: { title:'Hıfz Takibi', sub:'Kuran ezberleme', memorized:'Ezberlenmiş', inProgress:'Devam ediyor', notStarted:'Başlanmadı', total:'Toplam İlerleme' },
};

export default function HifzScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;

  const [progress, setProgress] = useState({});

  useEffect(() => {
    AsyncStorage.getItem('hifz_progress').then(v => {
      try { if (v) setProgress(JSON.parse(v)); } catch {}
    });
  }, []);

  const cycle = async (n) => {
    const current = progress[n] || 0;
    const next = (current + 1) % 3;
    const newProgress = { ...progress, [n]: next };
    setProgress(newProgress);
    await AsyncStorage.setItem('hifz_progress', JSON.stringify(newProgress));
  };

  const memorized = Object.values(progress).filter(v => v === 2).length;
  const inProg = Object.values(progress).filter(v => v === 1).length;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="الحفظ" title={l.title} subtitle={l.sub} />

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <View style={[styles.stat, { backgroundColor: '#4caf5020' }]}>
            <Text style={[styles.statNum, { color: '#4caf50' }]}>{memorized}</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>{l.memorized}</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: '#ff980020' }]}>
            <Text style={[styles.statNum, { color: '#ff9800' }]}>{inProg}</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>{l.inProgress}</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: '#e0e0e020' }]}>
            <Text style={[styles.statNum, { color: c.textMuted }]}>{SURAHS_SHORT.length - memorized - inProg}</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>{l.notStarted}</Text>
          </View>
        </View>

        <FlatList
          data={SURAHS_SHORT}
          keyExtractor={s => String(s.n)}
          numColumns={2}
          columnWrapperStyle={{ gap: 8 }}
          renderItem={({ item: s }) => {
            const status = progress[s.n] || 0;
            return (
              <TouchableOpacity
                style={[styles.surahCard, { backgroundColor: c.card, borderColor: STATUS_COLORS[status], flex: 1 }]}
                onPress={() => cycle(s.n)}
              >
                <Text style={styles.statusIcon}>{STATUS_ICONS[status]}</Text>
                <Text style={[styles.surahName, { color: c.text }]}>{s.name}</Text>
                <Text style={[styles.surahAr, { color: c.textMuted }]}>{s.ar}</Text>
                <Text style={[styles.surahAyahs, { color: c.textMuted }]}>{s.ayahs} ayah</Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  stat: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2 },
  surahCard: { padding: 12, borderRadius: 10, borderWidth: 1.5, marginBottom: 8, alignItems: 'center' },
  statusIcon: { fontSize: 20, marginBottom: 4 },
  surahName: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  surahAr: { fontSize: 16, marginTop: 2 },
  surahAyahs: { fontSize: 11, marginTop: 2 },
});
