import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLang } from '../contexts/LangContext';
import { Colors } from '../theme/colors';
import PageHero from '../components/PageHero';

const LESSONS = {
  az: [
    { icon:'🕋', title:'Allah kimdir?', desc:'Allah hər şeyi yaradandır. O, birdir, tək dir. Heç kəs Onun kimidir. Hər şeyi görür, eşidir və bilir.' },
    { icon:'📖', title:'Quran nədir?', desc:'Quran — Allahın kitabıdır. Hz. Muhəmməd ﷺ vasitəsilə insanlara göndərilmişdir. 114 surədən ibarətdir.' },
    { icon:'🤲', title:'Namaz nədir?', desc:'Namaz — Allahla danışmaqdır. Hər gün 5 dəfə qılınır: Sübh, Zöhr, Əsr, Məğrib, İşa.' },
    { icon:'🌙', title:'Ramazan nədir?', desc:'Ramazan — mübarək aydır. Bu ayda oruc tutulur, Quran oxunur, xeyir işlər görülür.' },
    { icon:'💰', title:'Zəkat nədir?', desc:'Zəkat — kasıblara kömək etməkdir. Varlı insanlar mallarının bir hissəsini ehtiyacı olanlara verirlər.' },
    { icon:'🕋', title:'Həcc nədir?', desc:'Həcc — Məkkədə Kəbəni ziyarət etməkdir. Hər müsəlman ömründə bir dəfə getməlidir.' },
    { icon:'😊', title:'Gözəl əxlaq', desc:'Müsəlman gülər üzlü, doğru sözlü, yardımsevər və səbirli olmalıdır.' },
    { icon:'📿', title:'Zikr nədir?', desc:'Zikr — Allahı xatırlamaqdır. SubhanAllah, Əlhəmdulillah, Allahu Əkbər demək zikrdir.' },
  ],
  en: [
    { icon:'🕋', title:'Who is Allah?', desc:'Allah is the Creator of everything. He is One and Unique. No one is like Him. He sees, hears and knows everything.' },
    { icon:'📖', title:'What is the Quran?', desc:"The Quran is Allah's book. It was sent to people through Prophet Muhammad ﷺ. It has 114 chapters." },
    { icon:'🤲', title:'What is Prayer?', desc:'Prayer is talking to Allah. We pray 5 times daily: Fajr, Dhuhr, Asr, Maghrib, Isha.' },
    { icon:'🌙', title:'What is Ramadan?', desc:'Ramadan is a blessed month. In this month we fast, read Quran, and do good deeds.' },
    { icon:'💰', title:'What is Zakat?', desc:'Zakat is helping the poor. Rich people give part of their wealth to those in need.' },
    { icon:'🕋', title:'What is Hajj?', desc:'Hajj is visiting the Kaaba in Mecca. Every Muslim should go at least once in their life.' },
    { icon:'😊', title:'Good Character', desc:'A Muslim should be cheerful, truthful, helpful and patient.' },
    { icon:'📿', title:'What is Dhikr?', desc:"Dhikr is remembering Allah. Saying SubhanAllah, Alhamdulillah, Allahu Akbar is dhikr." },
  ],
};

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
  const lessons = LESSONS[lang] || LESSONS.az;
  const [expanded, setExpanded] = useState({});

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="الأطفال" title={l.title} subtitle={l.sub} />

      <View style={styles.content}>
        {lessons.map((lesson, i) => (
          <TouchableOpacity key={i} style={[styles.lessonCard, { backgroundColor: c.card, borderColor: c.cardBorder }]} onPress={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))} activeOpacity={0.8}>
            <View style={styles.lessonHeader}>
              <Text style={styles.lessonIcon}>{lesson.icon}</Text>
              <Text style={[styles.lessonTitle, { color: c.text }]}>{lesson.title}</Text>
              <Text style={{ color: c.textMuted }}>{expanded[i] ? '▲' : '▼'}</Text>
            </View>
            {expanded[i] && <Text style={[styles.lessonDesc, { color: c.textSecondary }]}>{lesson.desc}</Text>}
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  lessonCard: { borderRadius: 16, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  lessonHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  lessonIcon: { fontSize: 32, marginRight: 14 },
  lessonTitle: { flex: 1, fontSize: 17, fontWeight: '600' },
  lessonDesc: { paddingHorizontal: 16, paddingBottom: 16, fontSize: 15, lineHeight: 24 },
});
