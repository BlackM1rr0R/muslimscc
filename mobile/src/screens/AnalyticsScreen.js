import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLang } from '../contexts/LangContext';
import { Colors } from '../theme/colors';
import PageHero from '../components/PageHero';

const LABELS = {
  az: { title:'Statistika', sub:'Fəaliyyət icmalı', prayers:'Namaz', quran:'Quran', hadith:'Hədis', dua:'Dua', charity:'Sədəqə', dhikr:'Zikr', hifz:'Hifz', quiz:'Quiz', days:'Gün aktiv', streak:'Ardıcıl', favs:'Favorit', sessions:'Sessiya', deeds:'Əməl', memorized:'Əzbər', score:'Ən yaxşı xal', prayersDone:'Qılınmış', answered:'Qəbul' },
  en: { title:'Analytics', sub:'Activity summary', prayers:'Prayers', quran:'Quran', hadith:'Hadith', dua:'Dua', charity:'Charity', dhikr:'Dhikr', hifz:'Hifz', quiz:'Quiz', days:'Days active', streak:'Streak', favs:'Favorites', sessions:'Sessions', deeds:'Deeds', memorized:'Memorized', score:'Best score', prayersDone:'Completed', answered:'Answered' },
  ru: { title:'Статистика', sub:'Обзор активности', prayers:'Намаз', quran:'Коран', hadith:'Хадис', dua:'Дуа', charity:'Садака', dhikr:'Зикр', hifz:'Хифз', quiz:'Тест', days:'Дней активности', streak:'Подряд', favs:'Избранные', sessions:'Сессии', deeds:'Дела', memorized:'Выучено', score:'Лучший результат', prayersDone:'Выполнено', answered:'Принято' },
  ar: { title:'الإحصائيات', sub:'ملخص النشاط', prayers:'الصلاة', quran:'القرآن', hadith:'الحديث', dua:'الدعاء', charity:'الصدقة', dhikr:'الذكر', hifz:'الحفظ', quiz:'الاختبار', days:'أيام النشاط', streak:'متتالية', favs:'المفضلة', sessions:'الجلسات', deeds:'الأعمال', memorized:'المحفوظ', score:'أفضل نتيجة', prayersDone:'المكتملة', answered:'المستجاب' },
  tr: { title:'İstatistikler', sub:'Aktivite özeti', prayers:'Namaz', quran:'Kuran', hadith:'Hadis', dua:'Dua', charity:'Sadaka', dhikr:'Zikir', hifz:'Hıfz', quiz:'Sınav', days:'Aktif gün', streak:'Seri', favs:'Favoriler', sessions:'Oturumlar', deeds:'İşler', memorized:'Ezberlenmiş', score:'En iyi puan', prayersDone:'Tamamlanan', answered:'Kabul edilen' },
};

export default function AnalyticsScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;

  const [data, setData] = useState({
    prayerDays: 0, prayerTotal: 0,
    quranSessions: 0, quranSurahs: 0,
    hadithFavs: 0, duaFavs: 0,
    charityDeeds: 0, charityAmount: 0,
    dhikrSessions: 0,
    hifzMemorized: 0,
    quizBest: 0,
    duaJournalActive: 0, duaJournalAnswered: 0,
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
        });
      } catch {}
    })();
  }, []);

  const cards = [
    { icon:'🕌', label:l.prayers, items:[{ v:data.prayerDays, l:l.days }, { v:data.prayerTotal, l:l.prayersDone }] },
    { icon:'📖', label:l.quran, items:[{ v:data.quranSessions, l:l.sessions }, { v:data.quranSurahs, l:'Surahs' }] },
    { icon:'📚', label:l.hadith, items:[{ v:data.hadithFavs, l:l.favs }] },
    { icon:'🤲', label:l.dua, items:[{ v:data.duaFavs, l:l.favs }, { v:data.duaJournalActive, l:l.dua }, { v:data.duaJournalAnswered, l:l.answered }] },
    { icon:'📿', label:l.dhikr, items:[{ v:data.dhikrSessions, l:l.sessions }] },
    { icon:'🎁', label:l.charity, items:[{ v:data.charityDeeds, l:l.deeds }, { v:data.charityAmount.toFixed(0), l:'$' }] },
    { icon:'🎓', label:l.hifz, items:[{ v:data.hifzMemorized, l:l.memorized }] },
    { icon:'❓', label:l.quiz, items:[{ v:data.quizBest, l:l.score }] },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="الإحصائيات" title={l.title} subtitle={l.sub} />

      <View style={styles.content}>
        {cards.map((card, i) => (
          <View key={i} style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{card.icon}</Text>
              <Text style={[styles.cardLabel, { color: c.text }]}>{card.label}</Text>
            </View>
            <View style={styles.cardItems}>
              {card.items.map((item, j) => (
                <View key={j} style={styles.cardItem}>
                  <Text style={[styles.itemValue, { color: c.primary }]}>{item.v}</Text>
                  <Text style={[styles.itemLabel, { color: c.textMuted }]}>{item.l}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardIcon: { fontSize: 24, marginRight: 10 },
  cardLabel: { fontSize: 16, fontWeight: '600' },
  cardItems: { flexDirection: 'row', gap: 16 },
  cardItem: { alignItems: 'center' },
  itemValue: { fontSize: 24, fontWeight: '800' },
  itemLabel: { fontSize: 12, marginTop: 2 },
});
