import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLang } from '../contexts/LangContext';
import { Colors } from '../theme/colors';
import PageHero from '../components/PageHero';

const GAME_DATA = [
  { surah:'Al-Fatihah', ayah:'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', opts:['Al-Fatihah','Al-Baqarah','Ali Imran','An-Nisa'], ans:0 },
  { surah:'Al-Ikhlas', ayah:'قُلْ هُوَ اللَّهُ أَحَدٌ', opts:['Al-Falaq','Al-Ikhlas','An-Nas','Al-Kawthar'], ans:1 },
  { surah:'Al-Kawthar', ayah:'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ', opts:['Al-Asr','Al-Kawthar','An-Nasr','Al-Fil'], ans:1 },
  { surah:'An-Nasr', ayah:'إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ', opts:['An-Nasr','Al-Masad','Al-Falaq','An-Nas'], ans:0 },
  { surah:'Al-Asr', ayah:'وَالْعَصْرِ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ', opts:['At-Takathur','Al-Humazah','Al-Asr','Al-Fil'], ans:2 },
  { surah:'Al-Falaq', ayah:'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', opts:['An-Nas','Al-Ikhlas','Al-Masad','Al-Falaq'], ans:3 },
  { surah:'An-Nas', ayah:'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', opts:['Al-Falaq','An-Nas','Al-Ikhlas','Al-Kawthar'], ans:1 },
  { surah:'Ash-Sharh', ayah:'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', opts:['Ad-Duhaa','Ash-Sharh','At-Tin','Al-Alaq'], ans:1 },
];

const LABELS = {
  az: { title:'Quran Oyunu', sub:'Surəni tap!', start:'Başla', score:'Xal', best:'Ən yaxşı', correct:'Doğru!', wrong:'Səhv!', q:'Bu ayə hansı surədəndir?', result:'Nəticə', tryAgain:'Yenidən', lives:'Can' },
  en: { title:'Quran Game', sub:'Find the surah!', start:'Start', score:'Score', best:'Best', correct:'Correct!', wrong:'Wrong!', q:'Which surah is this verse from?', result:'Result', tryAgain:'Try Again', lives:'Lives' },
  ru: { title:'Коран Игра', sub:'Найди суру!', start:'Начать', score:'Счёт', best:'Лучший', correct:'Верно!', wrong:'Ошибка!', q:'Из какой суры этот аят?', result:'Результат', tryAgain:'Ещё раз', lives:'Жизни' },
  ar: { title:'لعبة القرآن', sub:'!اعثر على السورة', start:'ابدأ', score:'النتيجة', best:'الأفضل', correct:'!صحيح', wrong:'!خطأ', q:'من أي سورة هذه الآية؟', result:'النتيجة', tryAgain:'أعد المحاولة', lives:'الأرواح' },
  tr: { title:'Kuran Oyunu', sub:'Sureyi bul!', start:'Başla', score:'Puan', best:'En iyi', correct:'Doğru!', wrong:'Yanlış!', q:'Bu ayet hangi sureden?', result:'Sonuç', tryAgain:'Tekrar Dene', lives:'Can' },
};

export default function QuranGameScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;

  const [playing, setPlaying] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const [best, setBest] = useState(0);

  React.useEffect(() => {
    AsyncStorage.getItem('quran_game_scores').then(v => {
      try { const d = JSON.parse(v); if (d?.best) setBest(d.best); } catch {}
    });
  }, []);

  const start = () => { setPlaying(true); setQIdx(0); setScore(0); setLives(3); setSelected(null); setDone(false); };

  const answer = async (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = GAME_DATA[qIdx].ans === idx;
    if (correct) setScore(s => s + 1);
    else setLives(l2 => l2 - 1);

    setTimeout(async () => {
      const newLives = correct ? lives : lives - 1;
      if (newLives <= 0 || qIdx + 1 >= GAME_DATA.length) {
        setDone(true);
        const finalScore = correct ? score + 1 : score;
        if (finalScore > best) {
          setBest(finalScore);
          await AsyncStorage.setItem('quran_game_scores', JSON.stringify({ best: finalScore }));
        }
      } else {
        setQIdx(q => q + 1); setSelected(null);
      }
    }, 1000);
  };

  if (!playing || done) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
        <PageHero arabic="لعبة القرآن" title={l.title} subtitle={l.sub} />
        <View style={styles.centerWrap}>
          {done && (
            <>
              <Text style={{ fontSize: 64 }}>{score >= GAME_DATA.length * 0.7 ? '🏆' : '📖'}</Text>
              <Text style={[styles.resultTitle, { color: c.text }]}>{l.result}</Text>
              <Text style={[styles.resultScore, { color: c.primary }]}>{score}/{GAME_DATA.length}</Text>
            </>
          )}
          {best > 0 && <Text style={[styles.bestText, { color: c.gold }]}>{l.best}: {best}</Text>}
          <TouchableOpacity style={[styles.startBtn, { backgroundColor: c.primary }]} onPress={start}>
            <Text style={styles.startBtnText}>{done ? l.tryAgain : l.start}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const q = GAME_DATA[qIdx];
  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.gameWrap}>
        <View style={styles.topBar}>
          <Text style={[styles.livesText, { color: c.error }]}>{l.lives}: {'❤️'.repeat(lives)}</Text>
          <Text style={[styles.scoreText, { color: c.primary }]}>{l.score}: {score}</Text>
        </View>
        <Text style={[styles.progress, { color: c.textMuted }]}>{qIdx + 1}/{GAME_DATA.length}</Text>
        <Text style={[styles.question, { color: c.textSecondary }]}>{l.q}</Text>
        <View style={[styles.ayahBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[styles.ayahText, { color: c.text }]}>{q.ayah}</Text>
        </View>
        {q.opts.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = q.ans === i;
          let bg = c.card;
          if (selected !== null) {
            if (isCorrect) bg = '#4caf5030';
            else if (isSelected) bg = '#f4433630';
          }
          return (
            <TouchableOpacity key={i} style={[styles.optBtn, { backgroundColor: bg, borderColor: isSelected ? (isCorrect ? '#4caf50' : '#f44336') : c.cardBorder }]} onPress={() => answer(i)}>
              <Text style={[styles.optText, { color: c.text }]}>{opt}</Text>
              {selected !== null && isCorrect && <Text>✅</Text>}
              {selected !== null && isSelected && !isCorrect && <Text>❌</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerWrap: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 20 },
  resultTitle: { fontSize: 24, fontWeight: '700', marginTop: 16 },
  resultScore: { fontSize: 48, fontWeight: '800', marginTop: 8 },
  bestText: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  startBtn: { paddingHorizontal: 40, paddingVertical: 16, borderRadius: 12, marginTop: 24 },
  startBtnText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  gameWrap: { padding: 20 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  livesText: { fontSize: 14, fontWeight: '600' },
  scoreText: { fontSize: 14, fontWeight: '600' },
  progress: { textAlign: 'center', marginBottom: 8 },
  question: { textAlign: 'center', fontSize: 16, marginBottom: 16 },
  ayahBox: { padding: 24, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 24 },
  ayahText: { fontSize: 26, textAlign: 'center', lineHeight: 40 },
  optBtn: { padding: 16, borderRadius: 12, borderWidth: 1.5, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optText: { fontSize: 16, flex: 1 },
});
