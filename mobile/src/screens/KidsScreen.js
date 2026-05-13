import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn, Float } from '../components/Animated';

const LESSONS = [
  { icon:'home', color:'#10b981', gradient:['#10b981','#059669'], emoji:'🕋',
    title:{az:'Allah kimdir?',en:'Who is Allah?',ru:'Кто такой Аллах?',ar:'من هو الله؟',tr:'Allah kimdir?'},
    desc:{az:'Allah hər şeyi yaradandır. O, birdir, tək dir. Heç kəs Onun kimi deyil. Hər şeyi görür, eşidir və bilir.',en:'Allah is the Creator of everything. He is One and Unique. No one is like Him. He sees, hears and knows everything.',ru:'Аллах — Творец всего. Он Один и Единственный. Никто не подобен Ему.',ar:'الله خالق كل شيء. هو واحد. لا أحد مثله.',tr:'Allah her şeyi yaratandır. O birdir ve tektir. Hiç kimse O\'nun gibi değildir.'} },
  { icon:'quran', color:'#f59e0b', gradient:['#f59e0b','#d97706'], emoji:'📖',
    title:{az:'Quran nədir?',en:'What is the Quran?',ru:'Что такое Коран?',ar:'ما هو القرآن؟',tr:'Kuran nedir?'},
    desc:{az:'Quran — Allahın kitabıdır. Hz. Muhəmməd ﷺ vasitəsilə insanlara göndərilmişdir. 114 surədən ibarətdir.',en:"The Quran is Allah's book. It was sent to people through Prophet Muhammad ﷺ. It has 114 chapters.",ru:'Коран — книга Аллаха. Был послан людям через Пророка Мухаммада ﷺ.',ar:'القرآن كتاب الله. نزل على النبي محمد ﷺ. يحتوي على ١١٤ سورة.',tr:'Kuran Allah\'ın kitabıdır. Peygamber Muhammed ﷺ aracılığıyla gönderilmiştir.'} },
  { icon:'prayer', color:'#3b82f6', gradient:['#3b82f6','#2563eb'], emoji:'🕌',
    title:{az:'Namaz nədir?',en:'What is Prayer?',ru:'Что такое Намаз?',ar:'ما هي الصلاة؟',tr:'Namaz nedir?'},
    desc:{az:'Namaz — Allahla danışmaqdır. Hər gün 5 dəfə qılınır: Sübh, Zöhr, Əsr, Məğrib, İşa.',en:'Prayer is talking to Allah. We pray 5 times daily: Fajr, Dhuhr, Asr, Maghrib, Isha.',ru:'Намаз — это разговор с Аллахом. Молитва совершается 5 раз в день.',ar:'الصلاة هي كلام الله. نصلي ٥ مرات يومياً.',tr:'Namaz Allah ile konuşmaktır. Günde 5 vakit kılınır.'} },
  { icon:'isha', color:'#8b5cf6', gradient:['#8b5cf6','#7c3aed'], emoji:'🌙',
    title:{az:'Ramazan nədir?',en:'What is Ramadan?',ru:'Что такое Рамадан?',ar:'ما هو رمضان؟',tr:'Ramazan nedir?'},
    desc:{az:'Ramazan — mübarək aydır. Bu ayda oruc tutulur, Quran oxunur, xeyir işlər görülür.',en:'Ramadan is a blessed month. In this month we fast, read Quran, and do good deeds.',ru:'Рамадан — благословенный месяц. В этом месяце мы постимся и читаем Коран.',ar:'رمضان شهر مبارك. فيه نصوم ونقرأ القرآن.',tr:'Ramazan mübarek aydır. Bu ayda oruç tutulur.'} },
  { icon:'zakat', color:'#ec4899', gradient:['#ec4899','#db2777'], emoji:'💰',
    title:{az:'Zəkat nədir?',en:'What is Zakat?',ru:'Что такое Закят?',ar:'ما هي الزكاة؟',tr:'Zekât nedir?'},
    desc:{az:'Zəkat — kasıblara kömək etməkdir. Varlı insanlar mallarının bir hissəsini ehtiyacı olanlara verirlər.',en:'Zakat is helping the poor. Rich people give part of their wealth to those in need.',ru:'Закят — это помощь бедным.',ar:'الزكاة هي مساعدة الفقراء.',tr:'Zekât fakirlere yardım etmektir.'} },
  { icon:'hajjguide', color:'#ef4444', gradient:['#ef4444','#dc2626'], emoji:'🕋',
    title:{az:'Həcc nədir?',en:'What is Hajj?',ru:'Что такое Хадж?',ar:'ما هو الحج؟',tr:'Hac nedir?'},
    desc:{az:'Həcc — Məkkədə Kəbəni ziyarət etməkdir. Hər müsəlman ömründə bir dəfə getməlidir.',en:'Hajj is visiting the Kaaba in Mecca. Every Muslim should go at least once in their life.',ru:'Хадж — это посещение Каабы в Мекке.',ar:'الحج زيارة الكعبة في مكة.',tr:'Hac Mekke\'deki Kabe\'yi ziyaret etmektir.'} },
  { icon:'heart', color:'#14b8a6', gradient:['#14b8a6','#0d9488'], emoji:'😊',
    title:{az:'Gözəl əxlaq',en:'Good Character',ru:'Хороший характер',ar:'الأخلاق الحسنة',tr:'Güzel ahlak'},
    desc:{az:'Müsəlman gülər üzlü, doğru sözlü, yardımsevər və səbirli olmalıdır.',en:'A Muslim should be cheerful, truthful, helpful and patient.',ru:'Мусульманин должен быть весёлым, правдивым и терпеливым.',ar:'المسلم بشوش وصادق وكريم وصبور.',tr:'Müslüman güler yüzlü, doğru sözlü ve sabırlı olmalıdır.'} },
  { icon:'dhikr', color:'#06b6d4', gradient:['#06b6d4','#0891b2'], emoji:'📿',
    title:{az:'Zikr nədir?',en:'What is Dhikr?',ru:'Что такое Зикр?',ar:'ما هو الذكر؟',tr:'Zikir nedir?'},
    desc:{az:'Zikr — Allahı xatırlamaqdır. SubhanAllah, Əlhəmdulillah, Allahu Əkbər demək zikrdir.',en:"Dhikr is remembering Allah. Saying SubhanAllah, Alhamdulillah, Allahu Akbar is dhikr.",ru:'Зикр — это поминание Аллаха.',ar:'الذكر تذكر الله.',tr:'Zikir Allah\'ı anmaktır.'} },
];

const LABELS = {
  az: { title:'Uşaqlar üçün İslam', sub:'Kiçiklər üçün dərslər' },
  en: { title:'Islam for Kids', sub:'Lessons for little ones' },
  ru: { title:'Ислам для Детей', sub:'Уроки для малышей' },
  ar: { title:'الإسلام للأطفال', sub:'دروس للصغار' },
  tr: { title:'Çocuklar için İslam', sub:'Küçükler için dersler' },
};

export default function KidsScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const sh = dark ? Shadows.dark.md : Shadows.md;

  const [expanded, setExpanded] = useState({});

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero arabic="الإِسْلَامُ لِلأَطْفَال" title={l.title} subtitle={l.sub} theme="kids" />

      <View style={styles.content}>
        {/* Fun banner */}
        <ScaleIn delay={100}>
          <LinearGradient
            colors={['#ec4899','#db2777','#a21caf']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.banner, sh]}
          >
            <View style={styles.bannerCircle1} />
            <View style={styles.bannerCircle2} />
            <Float><Text style={styles.bannerEmoji}>🌟</Text></Float>
            <Text style={styles.bannerTitle}>
              {lang==='az'?'Gəlin öyrənək!':lang==='ru'?'Давайте учиться!':lang==='ar'?'هيا نتعلم!':lang==='tr'?'Hadi öğrenelim!':"Let's learn!"}
            </Text>
          </LinearGradient>
        </ScaleIn>

        {/* Lessons */}
        {LESSONS.map((lesson, i) => {
          const isOpen = expanded[i];
          return (
            <FadeUp key={i} delay={200 + i * 70}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setExpanded(prev => ({ ...prev, [i]: !prev[i] }));
                }}
                activeOpacity={0.85}
              >
                <View style={[styles.lessonCard, { backgroundColor: c.card, borderColor: isOpen ? lesson.color + '60' : c.cardBorder }, sh]}>
                  <LinearGradient
                    colors={[lesson.color + '18', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.5 }}
                  />
                  <View style={[styles.colorBar, { backgroundColor: lesson.color }]} />

                  <View style={styles.lessonHeader}>
                    <LinearGradient colors={lesson.gradient} style={styles.lessonIconWrap}>
                      <Text style={styles.lessonEmoji}>{lesson.emoji}</Text>
                    </LinearGradient>
                    <Text style={[styles.lessonTitle, { color: c.text }]}>{lesson.title[lang] || lesson.title.en}</Text>
                    <AppIcon name={isOpen ? 'chevronUp' : 'chevronDown'} size={18} color={c.textMuted} />
                  </View>

                  {isOpen && (
                    <FadeUp duration={300}>
                      <Text style={[styles.lessonDesc, { color: c.textSecondary }]}>{lesson.desc[lang] || lesson.desc.en}</Text>
                    </FadeUp>
                  )}
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

  banner: {
    padding: 30,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerCircle1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.1)', top: -70, right: -50 },
  bannerCircle2: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.06)', bottom: -40, left: -30 },
  bannerEmoji: { fontSize: 72 },
  bannerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 10, letterSpacing: -0.3 },

  lessonCard: {
    padding: 18,
    paddingLeft: 22,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  colorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  lessonHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  lessonIconWrap: { width: 52, height: 52, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  lessonEmoji: { fontSize: 28 },
  lessonTitle: { flex: 1, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  lessonDesc: { fontSize: 15, lineHeight: 24, fontWeight: '500', marginTop: 14 },
});
