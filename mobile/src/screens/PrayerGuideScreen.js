import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLang } from '../contexts/LangContext';
import { Colors } from '../theme/colors';
import PageHero from '../components/PageHero';

const PRAYERS = [
  { key:'fajr', icon:'🌅', rakat:2 },
  { key:'dhuhr', icon:'🌤️', rakat:4 },
  { key:'asr', icon:'🌇', rakat:4 },
  { key:'maghrib', icon:'🌆', rakat:3 },
  { key:'isha', icon:'🌙', rakat:4 },
];

const STEPS = {
  az: [
    { title:'Niyyət', desc:'Namaza niyyət edin. "Allah rizası üçün Sübh namazının fərzini qılmağa niyyət etdim" kimi.' },
    { title:'Təkbirətül-İhram', desc:'"Allahu Əkbər" deyərək əlləri qaldırın. Bununla namaza başlayırsınız.', arabic:'اللَّهُ أَكْبَرُ' },
    { title:'Qiyam — Fatihə', desc:'Əl-Fatihə surəsini oxuyun. Bu hər rəkətdə vacibdir.', arabic:'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ' },
    { title:'Qiyam — Surə', desc:'Fatihədən sonra bir surə və ya ayələr oxuyun (ilk 2 rəkətdə).'},
    { title:'Rüku', desc:'"Allahu Əkbər" deyərək rükuya gedin. "Subhanə Rabbiyəl-Azim" 3 dəfə deyin.', arabic:'سُبْحَانَ رَبِّيَ الْعَظِيمِ' },
    { title:'Qövmə', desc:'Rükudan qalxarkən "Səmiallahu limən hamidəh" deyin.', arabic:'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ' },
    { title:'Səcdə', desc:'Səcdəyə gedin. "Subhanə Rabbiyəl-Ala" 3 dəfə deyin.', arabic:'سُبْحَانَ رَبِّيَ الْأَعْلَى' },
    { title:'Cəlsə', desc:'İki səcdə arasında qısa oturuş.', arabic:'رَبِّ اغْفِرْ لِي' },
    { title:'İkinci Səcdə', desc:'Yenidən səcdəyə gedin və "Subhanə Rabbiyəl-Ala" deyin.' },
    { title:'Təşəhhüd', desc:'Son oturuşda Əttəhiyyatı oxuyun.', arabic:'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ' },
    { title:'Salam', desc:'Sağa və sola salam verərək namazı bitirin.', arabic:'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ' },
  ],
  en: [
    { title:'Intention (Niyyah)', desc:'Make your intention for the specific prayer you are about to perform.' },
    { title:'Takbiratul Ihram', desc:'Raise your hands and say "Allahu Akbar" to begin the prayer.', arabic:'اللَّهُ أَكْبَرُ' },
    { title:'Standing — Al-Fatihah', desc:'Recite Surah Al-Fatihah. This is mandatory in every rakah.', arabic:'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ' },
    { title:'Standing — Surah', desc:'After Al-Fatihah, recite another surah or verses (in first 2 rakahs).' },
    { title:'Ruku (Bowing)', desc:'Say "Allahu Akbar" and bow. Say "Subhana Rabbiyal Azeem" 3 times.', arabic:'سُبْحَانَ رَبِّيَ الْعَظِيمِ' },
    { title:'Rising from Ruku', desc:'Rise saying "Sami Allahu liman hamidah".', arabic:'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ' },
    { title:'Sujud (Prostration)', desc:'Prostrate and say "Subhana Rabbiyal A\'la" 3 times.', arabic:'سُبْحَانَ رَبِّيَ الْأَعْلَى' },
    { title:'Sitting between Sujud', desc:'Sit briefly between the two prostrations.', arabic:'رَبِّ اغْفِرْ لِي' },
    { title:'Second Sujud', desc:'Prostrate again and repeat the dhikr.' },
    { title:'Tashahhud', desc:'In the final sitting, recite At-Tahiyyat.', arabic:'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ' },
    { title:'Salam', desc:'Turn right then left giving salam to conclude.', arabic:'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ' },
  ],
};

const LABELS = {
  az: { title:'Namaz Dərsliyi', sub:'Addım-addım namaz qaydası', fajr:'Sübh (2 rəkət)', dhuhr:'Zöhr (4 rəkət)', asr:'Əsr (4 rəkət)', maghrib:'Məğrib (3 rəkət)', isha:'İşa (4 rəkət)', steps:'Addımlar' },
  en: { title:'Prayer Guide', sub:'Step-by-step prayer instructions', fajr:'Fajr (2 rakat)', dhuhr:'Dhuhr (4 rakat)', asr:'Asr (4 rakat)', maghrib:'Maghrib (3 rakat)', isha:'Isha (4 rakat)', steps:'Steps' },
  ru: { title:'Гид по Намазу', sub:'Пошаговая инструкция', fajr:'Фаджр (2 ракаата)', dhuhr:'Зухр (4 ракаата)', asr:'Аср (4 ракаата)', maghrib:'Магриб (3 ракаата)', isha:'Иша (4 ракаата)', steps:'Шаги' },
  ar: { title:'دليل الصلاة', sub:'تعليمات الصلاة خطوة بخطوة', fajr:'الفجر (ركعتان)', dhuhr:'الظهر (٤ ركعات)', asr:'العصر (٤ ركعات)', maghrib:'المغرب (٣ ركعات)', isha:'العشاء (٤ ركعات)', steps:'الخطوات' },
  tr: { title:'Namaz Rehberi', sub:'Adım adım namaz kılavuzu', fajr:'Sabah (2 rekat)', dhuhr:'Öğle (4 rekat)', asr:'İkindi (4 rekat)', maghrib:'Akşam (3 rekat)', isha:'Yatsı (4 rekat)', steps:'Adımlar' },
};

export default function PrayerGuideScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const steps = STEPS[lang] || STEPS.az;

  const [selPrayer, setSelPrayer] = useState(0);

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="دليل الصلاة" title={l.title} subtitle={l.sub} />

      <View style={styles.content}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.prayerScroll}>
          {PRAYERS.map((p, i) => (
            <TouchableOpacity key={i} style={[styles.prayerBtn, selPrayer === i && { backgroundColor: c.primary }]} onPress={() => setSelPrayer(i)}>
              <Text style={styles.prayerIcon}>{p.icon}</Text>
              <Text style={[styles.prayerLabel, selPrayer === i && { color: '#fff' }]}>{l[p.key]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {steps.map((step, i) => (
          <View key={i} style={[styles.stepCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <View style={[styles.stepNum, { backgroundColor: c.primary }]}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={[styles.stepTitle, { color: c.text }]}>{step.title}</Text>
              <Text style={[styles.stepDesc, { color: c.textSecondary }]}>{step.desc}</Text>
              {step.arabic && <Text style={[styles.stepArabic, { color: c.primary }]}>{step.arabic}</Text>}
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
  prayerScroll: { marginBottom: 20, maxHeight: 70 },
  prayerBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#eee', marginRight: 8, alignItems: 'center' },
  prayerIcon: { fontSize: 24 },
  prayerLabel: { fontSize: 12, fontWeight: '500', marginTop: 4, color: '#555' },
  stepCard: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  stepNum: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  stepNumText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  stepDesc: { fontSize: 14, lineHeight: 20, marginBottom: 6 },
  stepArabic: { fontSize: 18, textAlign: 'right', marginTop: 4 },
});
