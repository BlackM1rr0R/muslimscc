import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn, Float, Shake, Confetti, BounceIn, AnimatedNumber, AnimatedProgressBar } from '../components/Animated';

const QUIZZES = {
  quran: {
    iconKey:'quran', gradient:['#10b981','#059669'], color:'#10b981',
    title:{ az:'Quran', en:'Quran', ru:'Коран', ar:'القرآن', tr:'Kuran' },
    questions: [
      { q:{ az:'Quranda neçə surə var?', en:'How many surahs in the Quran?', ru:'Сколько сур в Коране?', ar:'كم عدد سور القرآن؟', tr:'Kuran\'da kaç sure var?' }, opts:['100','114','120','130'], ans:1 },
      { q:{ az:'Ən uzun surə hansıdır?', en:'Which is the longest surah?', ru:'Какая самая длинная сура?', ar:'ما هي أطول سورة؟', tr:'En uzun sure hangisidir?' }, opts:['Al-Imran','An-Nisa','Al-Baqarah','Al-Maidah'], ans:2 },
      { q:{ az:'Ən qısa surə hansıdır?', en:'Which is the shortest surah?', ru:'Какая самая короткая сура?', ar:'ما هي أقصر سورة؟', tr:'En kısa sure hangisidir?' }, opts:['Al-Ikhlas','Al-Kawthar','An-Nasr','Al-Asr'], ans:1 },
      { q:{ az:'Quranda neçə ayə var?', en:'How many verses in the Quran?', ru:'Сколько аятов в Коране?', ar:'كم عدد آيات القرآن؟', tr:'Kuran\'da kaç ayet var?' }, opts:['5000','6000','6236','6666'], ans:2 },
      { q:{ az:'İlk nazil olan ayə?', en:'First revealed verse?', ru:'Первый ниспосланный аят?', ar:'أول آية نزلت؟', tr:'İlk inen ayet?' }, opts:['Al-Fatihah','Al-Alaq','Al-Baqarah','An-Nas'], ans:1 },
    ],
  },
  hadith: {
    iconKey:'hadith', gradient:['#f59e0b','#d97706'], color:'#f59e0b',
    title:{ az:'Hədis', en:'Hadith', ru:'Хадис', ar:'الحديث', tr:'Hadis' },
    questions: [
      { q:{ az:'Ən çox hədis rəvayət edən səhabə?', en:'Most prolific hadith narrator?', ru:'Кто передал больше всех хадисов?', ar:'أكثر الصحابة رواية؟', tr:'En çok hadis rivayet eden sahabe?' }, opts:['Hz. Ömər','Hz. Əli','Əbu Hüreyrə','Hz. Aişə'], ans:2 },
      { q:{ az:'Buxarinin tam adı?', en:"Bukhari's full name?", ru:'Полное имя Бухари?', ar:'اسم البخاري الكامل؟', tr:'Buhari\'nin tam adı?' }, opts:['Muhammad ibn Ismail','Ahmad ibn Hanbal','Muslim ibn Hajjaj','Abu Dawud'], ans:0 },
      { q:{ az:'Neçə hədis kitabı Kütüb-i Sittədir?', en:'How many books in Kutub al-Sittah?', ru:'Сколько книг в Кутуб ас-Ситта?', ar:'كم كتاباً في الصحاح الستة؟', tr:'Kütüb-i Sitte kaç kitaptır?' }, opts:['4','5','6','7'], ans:2 },
    ],
  },
  names: {
    iconKey:'names', gradient:['#8b5cf6','#7c3aed'], color:'#8b5cf6',
    title:{ az:'99 Ad', en:'99 Names', ru:'99 Имён', ar:'٩٩ اسم', tr:'99 İsim' },
    questions: [
      { q:{ az:'Ar-Rahman nə deməkdir?', en:'What does Ar-Rahman mean?', ru:'Что означает Ар-Рахман?', ar:'معنى الرحمن؟', tr:'Rahman ne demek?' },
        opts:[{az:'Hökm edən',en:'The Judge',ru:'Судья',ar:'الحاكم',tr:'Hükmeden'},{az:'Mərhəmətli',en:'Most Gracious',ru:'Милостивый',ar:'الرحمن',tr:'Rahman'},{az:'Yaradan',en:'The Creator',ru:'Творец',ar:'الخالق',tr:'Yaratıcı'},{az:'Güclü',en:'The Strong',ru:'Сильный',ar:'القوي',tr:'Güçlü'}], ans:1 },
      { q:{ az:'Al-Khaliq nə deməkdir?', en:'What does Al-Khaliq mean?', ru:'Что означает Аль-Халик?', ar:'معنى الخالق؟', tr:'Halık ne demek?' },
        opts:[{az:'Rəhm',en:'Mercy',ru:'Милость',ar:'رحمة',tr:'Merhamet'},{az:'Yaradan',en:'Creator',ru:'Творец',ar:'الخالق',tr:'Yaratıcı'},{az:'Bilən',en:'Knower',ru:'Знающий',ar:'عليم',tr:'Bilen'},{az:'Görən',en:'Seer',ru:'Видящий',ar:'بصير',tr:'Gören'}], ans:1 },
    ],
  },
};

const LABELS = {
  az: { title:'İslami Viktorina', sub:'Biliyinizi yoxlayın', start:'Başla', next:'Növbəti', score:'Xal', best:'Ən yaxşı', finish:'Nəticə', tryAgain:'Yenidən', back:'Geri', questions:'sual', excellent:'Əla!', good:'Yaxşı', keepLearning:'Öyrənməyə davam et' },
  en: { title:'Islamic Quiz', sub:'Test your knowledge', start:'Start', next:'Next', score:'Score', best:'Best', finish:'Result', tryAgain:'Try Again', back:'Back', questions:'questions', excellent:'Excellent!', good:'Good!', keepLearning:'Keep learning' },
  ru: { title:'Исламская Викторина', sub:'Проверьте знания', start:'Начать', next:'Далее', score:'Счёт', best:'Лучший', finish:'Результат', tryAgain:'Ещё раз', back:'Назад', questions:'вопросов', excellent:'Отлично!', good:'Хорошо!', keepLearning:'Продолжайте' },
  ar: { title:'اختبار إسلامي', sub:'اختبر معلوماتك', start:'ابدأ', next:'التالي', score:'النتيجة', best:'الأفضل', finish:'النتيجة', tryAgain:'أعد المحاولة', back:'رجوع', questions:'سؤال', excellent:'ممتاز!', good:'جيد!', keepLearning:'استمر' },
  tr: { title:'İslami Sınav', sub:'Bilginizi test edin', start:'Başla', next:'Sonraki', score:'Puan', best:'En iyi', finish:'Sonuç', tryAgain:'Tekrar Dene', back:'Geri', questions:'soru', excellent:'Mükemmel!', good:'İyi!', keepLearning:'Öğrenmeye devam' },
};

export default function QuizScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const sh = dark ? Shadows.dark.md : Shadows.md;

  const [quizKey, setQuizKey] = useState(null);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const [bestScores, setBestScores] = useState({});
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('quiz_scores').then(v => {
      try { if (v) setBestScores(JSON.parse(v)); } catch {}
    });
  }, []);

  const startQuiz = (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setQuizKey(key); setQIdx(0); setScore(0); setSelected(null); setDone(false);
  };

  const answer = async (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    const quiz = QUIZZES[quizKey];
    const correct = quiz.questions[qIdx].ans === idx;
    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore(s => s + 1);
      // Confetti!
      setConfettiTrigger(false);
      setTimeout(() => setConfettiTrigger(true), 50);
      setTimeout(() => setConfettiTrigger(false), 1800);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Shake!
      setShakeTrigger(s => s + 1);
    }
    setTimeout(async () => {
      if (qIdx + 1 >= quiz.questions.length) {
        setDone(true);
        const finalScore = correct ? score + 1 : score;
        if (!bestScores[quizKey] || finalScore > bestScores[quizKey]) {
          const newBest = { ...bestScores, [quizKey]: finalScore };
          setBestScores(newBest);
          await AsyncStorage.setItem('quiz_scores', JSON.stringify(newBest));
        }
      } else {
        setQIdx(q => q + 1); setSelected(null);
      }
    }, 1200);
  };

  // Quiz selection screen
  if (!quizKey) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
        <PageHero arabic="الاِخْتِبَار" title={l.title} subtitle={l.sub} theme="quiz" />

        <View style={styles.content}>
          {Object.entries(QUIZZES).map(([key, quiz], i) => (
            <FadeUp key={key} delay={100 + i * 100}>
              <TouchableOpacity
                onPress={() => startQuiz(key)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={quiz.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.quizCard, sh]}
                >
                  <View style={styles.quizCircle1} />
                  <View style={styles.quizCircle2} />

                  <View style={styles.quizIconWrap}>
                    <AppIcon name={quiz.iconKey} size={32} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quizName}>{quiz.title[lang] || quiz.title.en}</Text>
                    <Text style={styles.quizCount}>{quiz.questions.length} {l.questions}</Text>
                    {bestScores[key] !== undefined && (
                      <View style={styles.quizBestBadge}>
                        <AppIcon name="trophy" size={12} color="#fff" />
                        <Text style={styles.quizBestText}>{l.best}: {bestScores[key]}</Text>
                      </View>
                    )}
                  </View>
                  <AppIcon name="chevronRight" size={24} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </FadeUp>
          ))}
        </View>
        <View style={{ height: 50 }} />
      </ScrollView>
    );
  }

  const quiz = QUIZZES[quizKey];

  // Results screen
  if (done) {
    const pct = Math.round(score / quiz.questions.length * 100);
    const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '📖';
    const message = pct >= 80 ? l.excellent : pct >= 50 ? l.good : l.keepLearning;

    return (
      <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
        {/* Result confetti (high score) */}
        {pct >= 80 && <Confetti trigger={true} count={50} />}

        <View style={styles.resultWrap}>
          <ScaleIn delay={100}>
            <LinearGradient
              colors={quiz.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.resultCard, sh]}
            >
              <View style={styles.resultCircle1} />
              <View style={styles.resultCircle2} />

              <Float><Text style={styles.resultEmoji}>{emoji}</Text></Float>

              <Text style={styles.resultTitle}>{l.finish}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <AnimatedNumber value={score} duration={1500} style={styles.resultScore} />
                <Text style={[styles.resultScore, { color: 'rgba(255,255,255,0.7)' }]}>/{quiz.questions.length}</Text>
              </View>
              <AnimatedNumber value={pct} duration={1500} suffix="%" style={styles.resultPct} />

              <View style={styles.resultMsgBadge}>
                <Text style={styles.resultMsg}>{message}</Text>
              </View>
            </LinearGradient>
          </ScaleIn>

          <FadeUp delay={300}>
            <TouchableOpacity style={[styles.btnPrimary, Shadows.button]} onPress={() => startQuiz(quizKey)}>
              <LinearGradient colors={quiz.gradient} style={styles.btnPrimaryGrad}>
                <AppIcon name="reset" size={18} color="#fff" />
                <Text style={styles.btnPrimaryText}>{l.tryAgain}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </FadeUp>

          <FadeUp delay={400}>
            <TouchableOpacity
              style={[styles.btnSecondary, { backgroundColor: c.card, borderColor: c.cardBorder }]}
              onPress={() => setQuizKey(null)}
              activeOpacity={0.7}
            >
              <AppIcon name="arrowBack" size={18} color={c.text} />
              <Text style={[styles.btnSecondaryText, { color: c.text }]}>{l.back}</Text>
            </TouchableOpacity>
          </FadeUp>
        </View>
      </ScrollView>
    );
  }

  // Question screen
  const question = quiz.questions[qIdx];
  const qText = typeof question.q === 'object' ? (question.q[lang] || question.q.en) : question.q;
  const progress = (qIdx + 1) / quiz.questions.length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Progress */}
        <FadeUp>
          <View style={styles.progressWrap}>
            <Text style={[styles.progressText, { color: c.textMuted }]}>
              {qIdx + 1} / {quiz.questions.length}
            </Text>
            <View style={[styles.progressBar, { backgroundColor: c.surfaceAlt }]}>
              <LinearGradient
                colors={quiz.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            </View>
          </View>
        </FadeUp>

        {/* Question card */}
        <Shake trigger={shakeTrigger}>
          <ScaleIn delay={100}>
            <View style={[styles.questionCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
              <LinearGradient
                colors={[quiz.color + '15', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={[styles.questionIconWrap, { backgroundColor: quiz.color + '20' }]}>
                <AppIcon name={quiz.iconKey} size={28} color={quiz.color} />
              </View>
              <Text style={[styles.questionText, { color: c.text }]}>{qText}</Text>
            </View>
          </ScaleIn>
        </Shake>

        {/* Confetti on correct */}
        <Confetti trigger={confettiTrigger} count={25} colors={[quiz.color, '#f59e0b', '#10b981', '#ec4899']} />

        {/* Options */}
        {question.opts.map((opt, i) => {
          const optText = typeof opt === 'object' ? (opt[lang] || opt.en) : opt;
          const isSelected = selected === i;
          const isCorrect = question.ans === i;
          let bgColor = c.card;
          let borderColor = c.cardBorder;
          let textColor = c.text;

          if (selected !== null) {
            if (isCorrect) {
              bgColor = '#10b98115';
              borderColor = '#10b981';
              textColor = '#10b981';
            } else if (isSelected) {
              bgColor = '#ef444415';
              borderColor = '#ef4444';
              textColor = '#ef4444';
            }
          }

          return (
            <FadeUp key={i} delay={200 + i * 80}>
              <TouchableOpacity
                style={[styles.optBtn, { backgroundColor: bgColor, borderColor }, sh]}
                onPress={() => answer(i)}
                activeOpacity={0.85}
                disabled={selected !== null}
              >
                <View style={[styles.optLetter, { backgroundColor: borderColor + '20' }]}>
                  <Text style={[styles.optLetterText, { color: textColor }]}>{String.fromCharCode(65 + i)}</Text>
                </View>
                <Text style={[styles.optText, { color: textColor }]}>{optText}</Text>
                {selected !== null && isCorrect && <AppIcon name="check" size={22} color="#10b981" />}
                {selected !== null && isSelected && !isCorrect && <AppIcon name="close" size={22} color="#ef4444" />}
              </TouchableOpacity>
            </FadeUp>
          );
        })}

        {/* Score */}
        <FadeUp delay={500}>
          <View style={[styles.scoreCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <AppIcon name="trophy" size={16} color={quiz.color} />
            <Text style={[styles.scoreLabel, { color: c.textMuted }]}>{l.score}:</Text>
            <AnimatedNumber value={score} duration={600} style={[styles.scoreValue, { color: quiz.color }]} />
          </View>
        </FadeUp>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },

  // Quiz card (selection)
  quizCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 22,
    borderRadius: BorderRadius.xl,
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  quizCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -40 },
  quizCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -30 },
  quizIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  quizName: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3, marginBottom: 3 },
  quizCount: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  quizBestBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start', marginTop: 6 },
  quizBestText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  // Result
  resultWrap: { padding: 20, paddingTop: 40 },
  resultCard: {
    padding: 40,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  resultCircle1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.08)', top: -80, right: -60 },
  resultCircle2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -50, left: -40 },
  resultEmoji: { fontSize: 72 },
  resultTitle: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 16 },
  resultScore: { fontSize: 56, fontWeight: '800', color: '#fff', letterSpacing: -2, marginTop: 8 },
  resultPct: { fontSize: 20, color: 'rgba(255,255,255,0.85)', fontWeight: '800' },
  resultMsgBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginTop: 20 },
  resultMsg: { fontSize: 14, fontWeight: '800', color: '#fff' },

  btnPrimary: { borderRadius: BorderRadius.md, overflow: 'hidden', marginBottom: 12 },
  btnPrimaryGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  btnPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: BorderRadius.md, borderWidth: 1 },
  btnSecondaryText: { fontWeight: '800', fontSize: 15 },

  // Question screen
  progressWrap: { marginBottom: 20 },
  progressText: { fontSize: 12, fontWeight: '800', textAlign: 'center', marginBottom: 8, letterSpacing: 0.5 },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  questionCard: {
    padding: 28,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  questionIconWrap: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  questionText: { fontSize: 18, fontWeight: '800', textAlign: 'center', lineHeight: 28, letterSpacing: -0.3 },

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
  optText: { flex: 1, fontSize: 15, fontWeight: '700' },

  scoreCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: BorderRadius.md, borderWidth: 1, marginTop: 16 },
  scoreLabel: { fontSize: 13, fontWeight: '700' },
  scoreValue: { fontSize: 16, fontWeight: '800' },
});
