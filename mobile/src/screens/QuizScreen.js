import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLang } from '../contexts/LangContext';
import { Colors } from '../theme/colors';
import PageHero from '../components/PageHero';

const QUIZZES = {
  quran: {
    icon: '📖',
    questions: [
      { q: { az:'Quranda neçə surə var?', en:'How many surahs in the Quran?', ru:'Сколько сур в Коране?', ar:'كم عدد سور القرآن؟', tr:'Kuranda kaç sure var?' },
        opts: ['100','114','120','130'], ans: 1 },
      { q: { az:'Ən uzun surə hansıdır?', en:'Which is the longest surah?', ru:'Какая самая длинная сура?', ar:'ما هي أطول سورة؟', tr:'En uzun sure hangisidir?' },
        opts: ['Al-Imran','An-Nisa','Al-Baqarah','Al-Maidah'], ans: 2 },
      { q: { az:'Ən qısa surə hansıdır?', en:'Which is the shortest surah?', ru:'Какая самая короткая сура?', ar:'ما هي أقصر سورة؟', tr:'En kısa sure hangisidir?' },
        opts: ['Al-Ikhlas','Al-Kawthar','An-Nasr','Al-Asr'], ans: 1 },
      { q: { az:'Quranda neçə ayə var?', en:'How many verses in the Quran?', ru:'Сколько аятов в Коране?', ar:'كم عدد آيات القرآن؟', tr:'Kuranda kaç ayet var?' },
        opts: ['5000','6000','6236','6666'], ans: 2 },
      { q: { az:'Quranın ilk nazil olan ayəsi?', en:'First revealed verse?', ru:'Первый ниспосланный аят?', ar:'أول آية نزلت؟', tr:'İlk inen ayet?' },
        opts: ['Al-Fatihah 1','Al-Alaq 1','Al-Baqarah 1','An-Nas 1'], ans: 1 },
    ]
  },
  hadith: {
    icon: '📚',
    questions: [
      { q: { az:'Ən çox hədis rəvayət edən səhabə?', en:'Companion who narrated the most hadiths?', ru:'Сподвижник, передавший больше всего хадисов?', ar:'أكثر صحابي رواية للحديث؟', tr:'En çok hadis rivayet eden sahabe?' },
        opts: ['Hz. Ömər','Hz. Əli','Hz. Əbu Hüreyrə','Hz. Aişə'], ans: 2 },
      { q: { az:'Buxarinin tam adı?', en:"Bukhari's full name?", ru:'Полное имя Бухари?', ar:'الاسم الكامل للبخاري؟', tr:"Buhari'nin tam adı?" },
        opts: ['Muhammad ibn Ismail','Ahmad ibn Hanbal','Muslim ibn Hajjaj','Abu Dawud'], ans: 0 },
      { q: { az:'Neçə hədis kitabı "Kütüb-i Sittə" hesab olunur?', en:'How many books in Kutub al-Sittah?', ru:'Сколько книг в Кутуб ас-Ситта?', ar:'كم كتاباً في الكتب الستة؟', tr:'Kütüb-i Sitte kaç kitaptır?' },
        opts: ['4','5','6','7'], ans: 2 },
    ]
  },
  names: {
    icon: '✨',
    questions: [
      { q: { az:'Ar-Rahman nə deməkdir?', en:'What does Ar-Rahman mean?', ru:'Что означает Ар-Рахман?', ar:'ما معنى الرحمن؟', tr:'Ar-Rahman ne demektir?' },
        opts: [
          { az:'Hökm edən', en:'The Judge', ru:'Судья', ar:'الحاكم', tr:'Hükmeden' },
          { az:'Mərhəmətli', en:'The Most Gracious', ru:'Милостивый', ar:'الرحمن', tr:'Rahman' },
          { az:'Yaradan', en:'The Creator', ru:'Творец', ar:'الخالق', tr:'Yaratıcı' },
          { az:'Güclü', en:'The Strong', ru:'Сильный', ar:'القوي', tr:'Güçlü' }
        ], ans: 1 },
      { q: { az:'Al-Khaliq nə deməkdir?', en:'What does Al-Khaliq mean?', ru:'Что означает Аль-Халик?', ar:'ما معنى الخالق؟', tr:'Al-Halık ne demektir?' },
        opts: [
          { az:'Rəhm edən', en:'The Merciful', ru:'Милосердный', ar:'الرحيم', tr:'Merhametli' },
          { az:'Yaradan', en:'The Creator', ru:'Творец', ar:'الخالق', tr:'Yaratıcı' },
          { az:'Bilən', en:'The Knower', ru:'Знающий', ar:'العليم', tr:'Bilen' },
          { az:'Görən', en:'The Seer', ru:'Видящий', ar:'البصير', tr:'Gören' }
        ], ans: 1 },
    ]
  },
};

const LABELS = {
  az: { title:'İslami Viktorina', sub:'Biliyinizi yoxlayın', quran:'Quran', hadith:'Hədis', names:'99 Ad', start:'Başla', next:'Növbəti', score:'Xal', best:'Ən yaxşı', correct:'Doğru!', wrong:'Səhv!', finish:'Nəticə', tryAgain:'Yenidən', back:'Geri' },
  en: { title:'Islamic Quiz', sub:'Test your knowledge', quran:'Quran', hadith:'Hadith', names:'99 Names', start:'Start', next:'Next', score:'Score', best:'Best', correct:'Correct!', wrong:'Wrong!', finish:'Result', tryAgain:'Try Again', back:'Back' },
  ru: { title:'Исламская Викторина', sub:'Проверьте знания', quran:'Коран', hadith:'Хадис', names:'99 Имён', start:'Начать', next:'Далее', score:'Счёт', best:'Лучший', correct:'Верно!', wrong:'Ошибка!', finish:'Результат', tryAgain:'Ещё раз', back:'Назад' },
  ar: { title:'اختبار إسلامي', sub:'اختبر معلوماتك', quran:'القرآن', hadith:'الحديث', names:'٩٩ اسم', start:'ابدأ', next:'التالي', score:'النتيجة', best:'الأفضل', correct:'صحيح!', wrong:'خطأ!', finish:'النتيجة', tryAgain:'أعد المحاولة', back:'رجوع' },
  tr: { title:'İslami Sınav', sub:'Bilginizi test edin', quran:'Kuran', hadith:'Hadis', names:'99 İsim', start:'Başla', next:'Sonraki', score:'Puan', best:'En iyi', correct:'Doğru!', wrong:'Yanlış!', finish:'Sonuç', tryAgain:'Tekrar Dene', back:'Geri' },
};

export default function QuizScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;

  const [quizKey, setQuizKey] = useState(null);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const [bestScores, setBestScores] = useState({});

  React.useEffect(() => {
    AsyncStorage.getItem('quiz_scores').then(v => {
      try { if (v) setBestScores(JSON.parse(v)); } catch {}
    });
  }, []);

  const startQuiz = (key) => {
    setQuizKey(key); setQIdx(0); setScore(0); setSelected(null); setDone(false);
  };

  const answer = async (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    const quiz = QUIZZES[quizKey];
    const correct = quiz.questions[qIdx].ans === idx;
    if (correct) setScore(s => s + 1);
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

  // Quiz selection
  if (!quizKey) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
        <PageHero arabic="الاختبار" title={l.title} subtitle={l.sub} />
        <View style={styles.content}>
          {Object.entries(QUIZZES).map(([key, quiz]) => (
            <TouchableOpacity key={key} style={[styles.quizCard, { backgroundColor: c.card, borderColor: c.cardBorder }]} onPress={() => startQuiz(key)}>
              <Text style={styles.quizIcon}>{quiz.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.quizName, { color: c.text }]}>{l[key]}</Text>
                <Text style={[styles.quizCount, { color: c.textMuted }]}>{quiz.questions.length} questions</Text>
              </View>
              {bestScores[key] !== undefined && (
                <Text style={[styles.bestScore, { color: c.gold }]}>{l.best}: {bestScores[key]}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  const quiz = QUIZZES[quizKey];

  // Results
  if (done) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.resultWrap}>
          <Text style={{ fontSize: 64 }}>🏆</Text>
          <Text style={[styles.resultTitle, { color: c.text }]}>{l.finish}</Text>
          <Text style={[styles.resultScore, { color: c.primary }]}>{score}/{quiz.questions.length}</Text>
          <Text style={[styles.resultPct, { color: c.textSecondary }]}>{Math.round(score / quiz.questions.length * 100)}%</Text>
          <TouchableOpacity style={[styles.btn, { backgroundColor: c.primary }]} onPress={() => startQuiz(quizKey)}>
            <Text style={styles.btnText}>{l.tryAgain}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: c.surfaceAlt, marginTop: 10 }]} onPress={() => setQuizKey(null)}>
            <Text style={[styles.btnText, { color: c.text }]}>{l.back}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Question
  const question = quiz.questions[qIdx];
  const qText = typeof question.q === 'object' ? (question.q[lang] || question.q.en) : question.q;

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.questionWrap}>
        <Text style={[styles.progress, { color: c.textMuted }]}>{qIdx + 1}/{quiz.questions.length}</Text>
        <Text style={[styles.questionText, { color: c.text }]}>{qText}</Text>
        {question.opts.map((opt, i) => {
          const optText = typeof opt === 'object' ? (opt[lang] || opt.en) : opt;
          const isSelected = selected === i;
          const isCorrect = question.ans === i;
          let bgColor = c.card;
          if (selected !== null) {
            if (isCorrect) bgColor = '#4caf5030';
            else if (isSelected) bgColor = '#f4433630';
          }
          return (
            <TouchableOpacity key={i} style={[styles.optBtn, { backgroundColor: bgColor, borderColor: isSelected ? (isCorrect ? '#4caf50' : '#f44336') : c.cardBorder }]} onPress={() => answer(i)}>
              <Text style={[styles.optText, { color: c.text }]}>{optText}</Text>
              {selected !== null && isCorrect && <Text>✅</Text>}
              {selected !== null && isSelected && !isCorrect && <Text>❌</Text>}
            </TouchableOpacity>
          );
        })}
        <Text style={[styles.scoreText, { color: c.primary }]}>{l.score}: {score}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  quizCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  quizIcon: { fontSize: 36, marginRight: 16 },
  quizName: { fontSize: 18, fontWeight: '600' },
  quizCount: { fontSize: 13, marginTop: 2 },
  bestScore: { fontSize: 13, fontWeight: '600' },
  questionWrap: { padding: 20, paddingTop: 30 },
  progress: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  questionText: { fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 24, lineHeight: 28 },
  optBtn: { padding: 16, borderRadius: 12, borderWidth: 1.5, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optText: { fontSize: 16, flex: 1 },
  scoreText: { textAlign: 'center', marginTop: 16, fontSize: 16, fontWeight: '600' },
  resultWrap: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  resultTitle: { fontSize: 24, fontWeight: '700', marginTop: 16 },
  resultScore: { fontSize: 48, fontWeight: '800', marginTop: 8 },
  resultPct: { fontSize: 18, marginTop: 4 },
  btn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 24 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
