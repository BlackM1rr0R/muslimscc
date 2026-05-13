import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn, Float } from '../components/Animated';

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
  az: { title:'Quran Oyunu', sub:'Ərəbcəni öyrənin və yarışın', start:'Oyuna başla', score:'Xal', best:'Ən yaxşı', lives:'Can', q:'Bu ayə hansı surədəndir?', result:'Nəticə', tryAgain:'Yenidən', levels:'səviyyə', champion:'Çempion!' },
  en: { title:'Quran Game', sub:'Learn Arabic and compete', start:'Start Game', score:'Score', best:'Best', lives:'Lives', q:'Which surah is this verse from?', result:'Result', tryAgain:'Try Again', levels:'levels', champion:'Champion!' },
  ru: { title:'Коран Игра', sub:'Учите арабский и соревнуйтесь', start:'Начать игру', score:'Счёт', best:'Лучший', lives:'Жизни', q:'Из какой суры этот аят?', result:'Результат', tryAgain:'Ещё раз', levels:'уровней', champion:'Чемпион!' },
  ar: { title:'لعبة القرآن', sub:'تعلم العربية وتسابق', start:'ابدأ اللعبة', score:'النتيجة', best:'الأفضل', lives:'الأرواح', q:'من أي سورة هذه الآية؟', result:'النتيجة', tryAgain:'أعد المحاولة', levels:'مستوى', champion:'!بطل' },
  tr: { title:'Kuran Oyunu', sub:'Arapça öğrenin ve yarışın', start:'Oyuna Başla', score:'Puan', best:'En iyi', lives:'Can', q:'Bu ayet hangi sureden?', result:'Sonuç', tryAgain:'Tekrar Dene', levels:'seviye', champion:'Şampiyon!' },
};

export default function QuranGameScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const sh = dark ? Shadows.dark.lg : Shadows.lg;

  const [playing, setPlaying] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const [best, setBest] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem('quran_game_scores').then(v => {
      try { const d = JSON.parse(v); if (d?.best) setBest(d.best); } catch {}
    });
  }, []);

  const start = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPlaying(true); setQIdx(0); setScore(0); setLives(3); setSelected(null); setDone(false);
  };

  const answer = async (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = GAME_DATA[qIdx].ans === idx;
    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore(s => s + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setLives(l2 => l2 - 1);
    }

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
    }, 1100);
  };

  // Start / Result screen
  if (!playing || done) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
        <PageHero arabic="لُعْبَةُ القُرْآن" title={l.title} subtitle={l.sub} theme="qurangame" />

        <View style={styles.content}>
          <ScaleIn delay={100}>
            <LinearGradient
              colors={['#10b981','#059669','#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.heroCard, sh]}
            >
              <View style={styles.heroCircle1} />
              <View style={styles.heroCircle2} />

              {done ? (
                <>
                  <Float><Text style={styles.heroEmoji}>{score >= GAME_DATA.length * 0.7 ? '🏆' : '📖'}</Text></Float>
                  <Text style={styles.heroLabel}>{l.result}</Text>
                  <Text style={styles.heroScore}>{score}/{GAME_DATA.length}</Text>
                  {score >= GAME_DATA.length * 0.7 && (
                    <View style={styles.championBadge}>
                      <Text style={styles.championText}>⭐ {l.champion}</Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Float><AppIcon name="qurangame" size={72} color="#fff" /></Float>
                  <Text style={styles.heroTitle}>{l.title}</Text>
                  <Text style={styles.heroSub}>{GAME_DATA.length} {l.levels}</Text>
                </>
              )}

              {best > 0 && (
                <View style={styles.bestBadge}>
                  <AppIcon name="trophy" size={14} color="#fff" />
                  <Text style={styles.bestText}>{l.best}: {best}</Text>
                </View>
              )}
            </LinearGradient>
          </ScaleIn>

          <FadeUp delay={300}>
            <TouchableOpacity style={[styles.startBtn, Shadows.button]} onPress={start} activeOpacity={0.85}>
              <LinearGradient colors={['#10b981','#059669']} style={styles.startBtnGrad}>
                <AppIcon name="play" size={20} color="#fff" />
                <Text style={styles.startBtnText}>{done ? l.tryAgain : l.start}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </FadeUp>
        </View>
      </ScrollView>
    );
  }

  // Question screen
  const q = GAME_DATA[qIdx];
  const progress = (qIdx + 1) / GAME_DATA.length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Top bar */}
        <FadeUp>
          <View style={styles.topBar}>
            <View style={[styles.livesBar, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <Text style={styles.livesText}>
                {Array.from({ length: 3 }).map((_, i) => (
                  i < lives ? '❤️' : '🤍'
                )).join(' ')}
              </Text>
            </View>
            <View style={[styles.scoreBar, { backgroundColor: '#10b98115', borderColor: '#10b98130' }]}>
              <AppIcon name="trophy" size={14} color="#10b981" />
              <Text style={[styles.scoreBarText, { color: '#10b981' }]}>{score}</Text>
            </View>
          </View>
        </FadeUp>

        {/* Progress */}
        <FadeUp delay={100}>
          <View style={styles.progressWrap}>
            <Text style={[styles.progressText, { color: c.textMuted }]}>{qIdx + 1} / {GAME_DATA.length}</Text>
            <View style={[styles.progressBar, { backgroundColor: c.surfaceAlt }]}>
              <LinearGradient colors={['#10b981','#059669']} style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>
        </FadeUp>

        {/* Question */}
        <FadeUp delay={150}>
          <Text style={[styles.questionLabel, { color: c.textMuted }]}>{l.q}</Text>
        </FadeUp>

        {/* Ayah */}
        <ScaleIn delay={200}>
          <LinearGradient
            colors={dark ? ['#1a3d2a','#0d2818'] : ['#e8f4ee','#f0faf4']}
            style={[styles.ayahCard, { borderColor: '#10b98130' }, sh]}
          >
            <Text style={[styles.ayahText, { color: c.text }]}>{q.ayah}</Text>
          </LinearGradient>
        </ScaleIn>

        {/* Options */}
        {q.opts.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = q.ans === i;
          let bg = c.card;
          let border = c.cardBorder;
          let txtColor = c.text;

          if (selected !== null) {
            if (isCorrect) {
              bg = '#10b98115';
              border = '#10b981';
              txtColor = '#10b981';
            } else if (isSelected) {
              bg = '#ef444415';
              border = '#ef4444';
              txtColor = '#ef4444';
            }
          }

          return (
            <FadeUp key={i} delay={250 + i * 80}>
              <TouchableOpacity
                style={[styles.optBtn, { backgroundColor: bg, borderColor: border }, dark ? Shadows.dark.sm : Shadows.sm]}
                onPress={() => answer(i)}
                activeOpacity={0.85}
                disabled={selected !== null}
              >
                <View style={[styles.optLetter, { backgroundColor: border + '20' }]}>
                  <Text style={[styles.optLetterText, { color: txtColor }]}>{String.fromCharCode(65 + i)}</Text>
                </View>
                <Text style={[styles.optText, { color: txtColor }]}>{opt}</Text>
                {selected !== null && isCorrect && <AppIcon name="check" size={22} color="#10b981" />}
                {selected !== null && isSelected && !isCorrect && <AppIcon name="close" size={22} color="#ef4444" />}
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
  content: { paddingHorizontal: 20, paddingTop: 20 },

  // Hero
  heroCard: {
    padding: 40,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  heroCircle1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.08)', top: -80, right: -60 },
  heroCircle2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -50, left: -40 },
  heroEmoji: { fontSize: 72 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 14, letterSpacing: -0.5 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: '700' },
  heroLabel: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 12 },
  heroScore: { fontSize: 56, fontWeight: '800', color: '#fff', letterSpacing: -2, marginTop: 8 },
  championBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginTop: 14 },
  championText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  bestBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, marginTop: 16 },
  bestText: { fontSize: 12, fontWeight: '800', color: '#fff' },

  // Start button
  startBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden' },
  startBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  startBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },

  // Game top bar
  topBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  livesBar: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: BorderRadius.full, borderWidth: 1 },
  livesText: { fontSize: 16, letterSpacing: 4 },
  scoreBar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: BorderRadius.full, borderWidth: 1 },
  scoreBarText: { fontSize: 14, fontWeight: '800' },

  // Progress
  progressWrap: { marginBottom: 20 },
  progressText: { fontSize: 12, fontWeight: '800', textAlign: 'center', marginBottom: 6, letterSpacing: 0.5 },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  // Question
  questionLabel: { fontSize: 12, fontWeight: '800', textAlign: 'center', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 },

  // Ayah card
  ayahCard: {
    padding: 32,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    marginBottom: 24,
  },
  ayahText: { fontSize: 26, textAlign: 'center', lineHeight: 48, writingDirection: 'rtl' },

  // Options
  optBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    marginBottom: 10,
    gap: 14,
  },
  optLetter: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  optLetterText: { fontSize: 16, fontWeight: '800' },
  optText: { flex: 1, fontSize: 16, fontWeight: '800' },
});
