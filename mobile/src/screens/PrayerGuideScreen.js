import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn } from '../components/Animated';

const PRAYERS = [
  { key:'fajr', iconKey:'fajr', rakat:2, gradient:['#6366f1','#4338ca'] },
  { key:'dhuhr', iconKey:'dhuhr', rakat:4, gradient:['#fbbf24','#f59e0b'] },
  { key:'asr', iconKey:'asr', rakat:4, gradient:['#f97316','#ea580c'] },
  { key:'maghrib', iconKey:'maghrib', rakat:3, gradient:['#ec4899','#db2777'] },
  { key:'isha', iconKey:'isha', rakat:4, gradient:['#1e3a8a','#0f172a'] },
];

const STEPS = {
  az: [
    { title:'Niyyət', desc:'Namaza niyyət edin. Qəlbinizdə hansı namazı qılacağınızı niyyət edin.', icon:'heart' },
    { title:'Təkbirətül-İhram', desc:'"Allahu Əkbər" deyərək əlləri qulaqlara qaldırın. Bununla namaza başlayırsınız.', arabic:'اللَّهُ أَكْبَرُ', icon:'star' },
    { title:'Qiyam — Fatihə', desc:'Əl-Fatihə surəsini oxuyun. Bu hər rəkətdə vacibdir.', arabic:'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', icon:'quran' },
    { title:'Qiyam — Surə', desc:'Fatihədən sonra bir surə və ya ayələr oxuyun (ilk 2 rəkətdə).', icon:'quran' },
    { title:'Rüku', desc:'"Allahu Əkbər" deyərək rükuya gedin. "Subhanə Rabbiyəl-Azim" 3 dəfə deyin.', arabic:'سُبْحَانَ رَبِّيَ الْعَظِيمِ', icon:'prayer' },
    { title:'Qövmə', desc:'Rükudan qalxarkən "Səmiallahu limən hamidəh" deyin.', arabic:'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ', icon:'prayer' },
    { title:'Səcdə', desc:'Səcdəyə gedin. "Subhanə Rabbiyəl-Ala" 3 dəfə deyin.', arabic:'سُبْحَانَ رَبِّيَ الْأَعْلَى', icon:'prayer' },
    { title:'Cəlsə', desc:'İki səcdə arasında qısa oturuş.', arabic:'رَبِّ اغْفِرْ لِي', icon:'prayer' },
    { title:'İkinci Səcdə', desc:'Yenidən səcdəyə gedin və "Subhanə Rabbiyəl-Ala" deyin.', icon:'prayer' },
    { title:'Təşəhhüd', desc:'Son oturuşda Əttəhiyyatı oxuyun.', arabic:'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ', icon:'duas' },
    { title:'Salam', desc:'Sağa və sola salam verərək namazı bitirin.', arabic:'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ', icon:'check' },
  ],
  en: [
    { title:'Intention (Niyyah)', desc:'Make your intention for the specific prayer in your heart.', icon:'heart' },
    { title:'Takbiratul Ihram', desc:'Raise your hands to ears and say "Allahu Akbar" to begin the prayer.', arabic:'اللَّهُ أَكْبَرُ', icon:'star' },
    { title:'Standing — Al-Fatihah', desc:'Recite Surah Al-Fatihah. This is mandatory in every rakah.', arabic:'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', icon:'quran' },
    { title:'Standing — Surah', desc:'After Al-Fatihah, recite another surah or verses (in first 2 rakahs).', icon:'quran' },
    { title:'Ruku (Bowing)', desc:'Say "Allahu Akbar" and bow. Say "Subhana Rabbiyal Azeem" 3 times.', arabic:'سُبْحَانَ رَبِّيَ الْعَظِيمِ', icon:'prayer' },
    { title:'Rising from Ruku', desc:'Rise saying "Sami Allahu liman hamidah".', arabic:'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ', icon:'prayer' },
    { title:'Sujud (Prostration)', desc:'Prostrate and say "Subhana Rabbiyal A\'la" 3 times.', arabic:'سُبْحَانَ رَبِّيَ الْأَعْلَى', icon:'prayer' },
    { title:'Sitting between Sujud', desc:'Sit briefly between the two prostrations.', arabic:'رَبِّ اغْفِرْ لِي', icon:'prayer' },
    { title:'Second Sujud', desc:'Prostrate again and repeat the dhikr.', icon:'prayer' },
    { title:'Tashahhud', desc:'In the final sitting, recite At-Tahiyyat.', arabic:'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ', icon:'duas' },
    { title:'Salam', desc:'Turn right then left giving salam to conclude.', arabic:'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ', icon:'check' },
  ],
};

const LABELS = {
  az: { title:'Namaz Dərsliyi', sub:'Addım-addım namaz qaydası', fajr:'Sübh', dhuhr:'Zöhr', asr:'Əsr', maghrib:'Məğrib', isha:'İşa', rakat:'rəkət' },
  en: { title:'Prayer Guide', sub:'Step-by-step prayer instructions', fajr:'Fajr', dhuhr:'Dhuhr', asr:'Asr', maghrib:'Maghrib', isha:'Isha', rakat:'rakat' },
  ru: { title:'Гид по Намазу', sub:'Пошаговая инструкция', fajr:'Фаджр', dhuhr:'Зухр', asr:'Аср', maghrib:'Магриб', isha:'Иша', rakat:'ракаата' },
  ar: { title:'دليل الصلاة', sub:'خطوات الصلاة', fajr:'الفجر', dhuhr:'الظهر', asr:'العصر', maghrib:'المغرب', isha:'العشاء', rakat:'ركعات' },
  tr: { title:'Namaz Rehberi', sub:'Adım adım namaz', fajr:'Sabah', dhuhr:'Öğle', asr:'İkindi', maghrib:'Akşam', isha:'Yatsı', rakat:'rekat' },
};

export default function PrayerGuideScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const steps = STEPS[lang] || STEPS.az;
  const sh = dark ? Shadows.dark.md : Shadows.md;
  const shS = dark ? Shadows.dark.sm : Shadows.sm;

  const [selPrayer, setSelPrayer] = useState(0);
  const activePrayer = PRAYERS[selPrayer];

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero arabic="دَلِيلُ الصَّلَاة" title={l.title} subtitle={l.sub} theme="prayerguide" />

      <View style={styles.content}>
        {/* Prayer selector */}
        <FadeUp delay={100}>
          <Text style={[styles.label, { color: c.textMuted }]}>
            {lang==='az'?'NAMAZ SEÇ':lang==='ru'?'ВЫБЕРИТЕ НАМАЗ':lang==='ar'?'اختر الصلاة':lang==='tr'?'NAMAZ SEÇ':'SELECT PRAYER'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prayerRow}>
            {PRAYERS.map((p, i) => {
              const active = selPrayer === i;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => { Haptics.selectionAsync(); setSelPrayer(i); }}
                  activeOpacity={0.8}
                >
                  {active ? (
                    <LinearGradient colors={p.gradient} style={[styles.prayerBtn, Shadows.button]}>
                      <AppIcon name={p.iconKey} size={24} color="#fff" />
                      <Text style={[styles.prayerLabel, { color: '#fff' }]}>{l[p.key]}</Text>
                      <Text style={styles.prayerRakat}>{p.rakat} {l.rakat}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.prayerBtn, { backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1.5 }, shS]}>
                      <AppIcon name={p.iconKey} size={24} color={p.gradient[0]} />
                      <Text style={[styles.prayerLabel, { color: c.text }]}>{l[p.key]}</Text>
                      <Text style={[styles.prayerRakat, { color: c.textMuted }]}>{p.rakat} {l.rakat}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </FadeUp>

        {/* Steps */}
        <FadeUp delay={200}>
          <Text style={[styles.label, { color: c.textMuted, marginTop: 20 }]}>
            {lang==='az'?'ADDIMLAR':lang==='ru'?'ШАГИ':lang==='ar'?'الخطوات':lang==='tr'?'ADIMLAR':'STEPS'}
          </Text>
        </FadeUp>

        {steps.map((step, i) => (
          <FadeUp key={i} delay={300 + i * 80}>
            <View style={[styles.stepCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
              <LinearGradient
                colors={[activePrayer.gradient[0] + '10', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.5 }}
              />

              <View style={styles.stepHeader}>
                <LinearGradient colors={activePrayer.gradient} style={styles.stepNumBadge}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </LinearGradient>
                <View style={[styles.stepIconWrap, { backgroundColor: activePrayer.gradient[0] + '20' }]}>
                  <AppIcon name={step.icon} size={18} color={activePrayer.gradient[0]} />
                </View>
                <Text style={[styles.stepTitle, { color: c.text }]}>{step.title}</Text>
              </View>

              <Text style={[styles.stepDesc, { color: c.textSecondary }]}>{step.desc}</Text>

              {step.arabic && (
                <View style={[styles.arabicBox, { backgroundColor: activePrayer.gradient[0] + '10', borderColor: activePrayer.gradient[0] + '30' }]}>
                  <Text style={[styles.arabicText, { color: activePrayer.gradient[0] }]}>{step.arabic}</Text>
                </View>
              )}
            </View>
          </FadeUp>
        ))}
      </View>
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 14 },

  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },

  // Prayer selector
  prayerRow: { gap: 10, paddingBottom: 8 },
  prayerBtn: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderRadius: BorderRadius.lg, minWidth: 90, gap: 6 },
  prayerLabel: { fontSize: 14, fontWeight: '800' },
  prayerRakat: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },

  // Step card
  stepCard: {
    padding: 20,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  stepNumBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  stepIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { flex: 1, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  stepDesc: { fontSize: 14, lineHeight: 22, fontWeight: '500', marginBottom: 12 },
  arabicBox: { padding: 16, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center' },
  arabicText: { fontSize: 20, textAlign: 'center', lineHeight: 36 },
});
