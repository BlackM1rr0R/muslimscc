import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn } from '../components/Animated';

const PHASES = [
  { key:'ihram', icon:'heart', color:'#10b981', gradient:['#10b981','#059669'],
    title:{az:'İhram',en:'Ihram',ru:'Ихрам',ar:'الإحرام',tr:'İhram'},
    desc:{az:'Mikat nöqtəsində ihrama girin. Kişilər iki ağ parça geyinir. Niyyət edin və Təlbiyə deyin.',en:'Enter Ihram at the Miqat. Men wear two white cloths. Make intention and recite Talbiyah.',ru:'Вступите в ихрам на микате. Мужчины надевают две белые ткани.',ar:'الإحرام من الميقات. يلبس الرجال ثوبين أبيضين.',tr:'Mikat\'ta ihrama girin. Erkekler iki beyaz kumaş giyer.'},
    arabic:'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ' },
  { key:'tawaf', icon:'hajjguide', color:'#f59e0b', gradient:['#f59e0b','#d97706'],
    title:{az:'Təvaf',en:'Tawaf',ru:'Таваф',ar:'الطواف',tr:'Tavaf'},
    desc:{az:'Kəbəni 7 dəfə saat əqrəbinin əksinə dolanın. Hər dövrədə dua edin.',en:'Circle the Kaaba 7 times counter-clockwise. Make dua at each round.',ru:'Обойдите Каабу 7 раз против часовой стрелки.',ar:'طف حول الكعبة ٧ مرات عكس عقارب الساعة.',tr:'Kabe\'nin etrafında 7 kez saat yönünün tersine dönün.'},
    arabic:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً' },
  { key:'sai', icon:'prayer', color:'#3b82f6', gradient:['#3b82f6','#2563eb'],
    title:{az:'Səy',en:"Sa'i",ru:'Саъй',ar:'السعي',tr:'Sa\'y'},
    desc:{az:'Səfa və Mərva təpələri arasında 7 dəfə gəzin.',en:'Walk between Safa and Marwa hills 7 times.',ru:'Ходите между холмами Сафа и Марва 7 раз.',ar:'اسع بين الصفا والمروة ٧ مرات.',tr:'Safa ve Merve tepeleri arasında 7 kez yürüyün.'},
    arabic:'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ' },
  { key:'mina', icon:'location', color:'#8b5cf6', gradient:['#8b5cf6','#7c3aed'],
    title:{az:'Minaya gediş',en:'Going to Mina',ru:'В Мину',ar:'الذهاب إلى منى',tr:'Mina\'ya gidiş'},
    desc:{az:'8 Zilhiccə — Minada gecələyin və ibadət edin.',en:'8th Dhul Hijjah — Stay overnight in Mina and worship.',ru:'8 Зуль-Хиджи — оставайтесь на ночь в Мине.',ar:'٨ ذو الحجة — المبيت في منى.',tr:'8 Zilhicce — Mina\'da geceyi geçirin.'} },
  { key:'arafah', icon:'star', color:'#ec4899', gradient:['#ec4899','#db2777'],
    title:{az:'Ərəfə',en:'Arafah',ru:'Арафат',ar:'عرفة',tr:'Arefe'},
    desc:{az:'9 Zilhiccə — Ərəfə dağında duraq. Həccin ən əhəmiyyətli rüknü. Dua edin.',en:'9th Dhul Hijjah — Stand at Arafah. Most important pillar of Hajj.',ru:'9 Зуль-Хиджи — Стойте на Арафате. Важнейший столп хаджа.',ar:'٩ ذو الحجة — الوقوف بعرفة. أهم أركان الحج.',tr:'9 Zilhicce — Arafat\'ta durak. Haccın en önemli rüknü.'},
    arabic:'خَيْرُ الدُّعَاءِ دُعَاءُ يَوْمِ عَرَفَةَ' },
  { key:'muzdalifah', icon:'moon', color:'#6366f1', gradient:['#6366f1','#4338ca'],
    title:{az:'Müzdəlifə',en:'Muzdalifah',ru:'Муздалифа',ar:'مزدلفة',tr:'Müzdelife'},
    desc:{az:'Ərəfədən sonra Müzdəlifədə gecələyin. Daş yığın.',en:'Stay at Muzdalifah overnight after Arafah. Collect pebbles.',ru:'После Арафата оставайтесь на ночь в Муздалифе.',ar:'المبيت في مزدلفة بعد عرفة وجمع الحصى.',tr:'Arafat\'tan sonra Müzdelife\'de geceyi geçirin. Taş toplayın.'} },
  { key:'ramy', icon:'star', color:'#ef4444', gradient:['#ef4444','#dc2626'],
    title:{az:'Rəmy — Daş atma',en:'Ramy — Stoning',ru:'Рами — Побиение',ar:'الرمي',tr:'Ramy — Şeytan taşlama'},
    desc:{az:'10 Zilhiccə — Böyük Cəmrəyə 7 daş atın. Hər atışda təkbir deyin.',en:'10th Dhul Hijjah — Throw 7 pebbles at Jamrat al-Aqabah.',ru:'10 Зуль-Хиджи — Бросьте 7 камней.',ar:'١٠ ذو الحجة — رمي الجمرة الكبرى بسبع حصيات.',tr:'10 Zilhicce — Büyük Şeytan\'a 7 taş atın.'},
    arabic:'اللَّهُ أَكْبَرُ' },
  { key:'qurban', icon:'charity', color:'#f97316', gradient:['#f97316','#ea580c'],
    title:{az:'Qurban',en:'Sacrifice',ru:'Жертва',ar:'النحر',tr:'Kurban'},
    desc:{az:'Qurban kəsin. Hədyül-qurban vacibdir.',en:'Offer a sacrifice (Hady). This is obligatory for Hajj.',ru:'Принесите жертву. Обязательно для хаджа.',ar:'ذبح الهدي. واجب في الحج.',tr:'Kurban kesin. Hac için vaciptir.'} },
  { key:'halq', icon:'check', color:'#14b8a6', gradient:['#14b8a6','#0d9488'],
    title:{az:'Təraş / Qısaltma',en:'Shaving / Trimming',ru:'Бритьё / Стрижка',ar:'الحلق / التقصير',tr:'Traş / Kısaltma'},
    desc:{az:'Saçları qırxdırın (kişilər) və ya qısaldın (qadınlar). İhramdan çıxın.',en:'Shave (men) or trim (women) hair. Exit Ihram.',ru:'Побрейте (мужчины) или подстригите волосы.',ar:'حلق الشعر أو التقصير. الخروج من الإحرام.',tr:'Saçları tıraş edin veya kısaltın. İhramdan çıkın.'} },
  { key:'vida', icon:'hajjguide', color:'#a855f7', gradient:['#a855f7','#9333ea'],
    title:{az:'Vida Təvafı',en:'Farewell Tawaf',ru:'Прощальный Таваф',ar:'طواف الوداع',tr:'Veda Tavafı'},
    desc:{az:'Məkkəni tərk etmədən son təvafı edin. Həcc tamamdır!',en:'Perform the farewell Tawaf before leaving Mecca. Hajj is complete!',ru:'Совершите прощальный таваф перед отъездом из Мекки.',ar:'طواف الوداع قبل مغادرة مكة. اكتمل الحج!',tr:'Mekke\'den ayrılmadan son tavafı yapın. Hac tamamdır!'} },
];

const LABELS = {
  az:{ title:'Həcc Bələdçisi', sub:'Addım-addım Həcc və Ümrə', phases:'Həcc Mərhələləri' },
  en:{ title:'Hajj Guide', sub:'Step-by-step Hajj & Umrah', phases:'Hajj Phases' },
  ru:{ title:'Гид по Хаджу', sub:'Пошаговый Хадж', phases:'Этапы Хаджа' },
  ar:{ title:'دليل الحج', sub:'الحج خطوة بخطوة', phases:'مراحل الحج' },
  tr:{ title:'Hac Rehberi', sub:'Adım adım Hac', phases:'Hac Aşamaları' },
};

export default function HajjGuideScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const sh = dark ? Shadows.dark.md : Shadows.md;

  const [expanded, setExpanded] = useState({});

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero arabic="الحَجّ" title={l.title} subtitle={l.sub} />

      <View style={styles.content}>

        {/* Banner */}
        <ScaleIn delay={100}>
          <LinearGradient
            colors={['#d97706','#b45309','#92400e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.banner, sh]}
          >
            <View style={styles.bannerCircle1} />
            <View style={styles.bannerCircle2} />
            <Text style={styles.bannerEmoji}>🕋</Text>
            <Text style={styles.bannerTitle}>{l.phases}</Text>
            <Text style={styles.bannerCount}>{PHASES.length} {lang==='az'?'mərhələ':lang==='ru'?'этапов':lang==='ar'?'مرحلة':lang==='tr'?'aşama':'phases'}</Text>
          </LinearGradient>
        </ScaleIn>

        {/* Phases */}
        {PHASES.map((phase, i) => {
          const isOpen = expanded[i];
          return (
            <FadeUp key={i} delay={200 + i * 80}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setExpanded(prev => ({ ...prev, [i]: !prev[i] }));
                }}
                activeOpacity={0.85}
              >
                <View style={[styles.phaseCard, { backgroundColor: c.card, borderColor: isOpen ? phase.color + '60' : c.cardBorder }, sh]}>
                  <LinearGradient
                    colors={[phase.color + '15', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.5 }}
                  />
                  <View style={[styles.colorBar, { backgroundColor: phase.color }]} />

                  <View style={styles.phaseHeader}>
                    <LinearGradient colors={phase.gradient} style={styles.phaseNum}>
                      <Text style={styles.phaseNumText}>{i + 1}</Text>
                    </LinearGradient>
                    <View style={[styles.phaseIconWrap, { backgroundColor: phase.color + '20' }]}>
                      <AppIcon name={phase.icon} size={20} color={phase.color} />
                    </View>
                    <Text style={[styles.phaseTitle, { color: c.text }]}>{phase.title[lang] || phase.title.en}</Text>
                    <AppIcon name={isOpen ? 'chevronUp' : 'chevronDown'} size={18} color={c.textMuted} />
                  </View>

                  {isOpen && (
                    <FadeUp duration={300}>
                      <Text style={[styles.phaseDesc, { color: c.textSecondary }]}>{phase.desc[lang] || phase.desc.en}</Text>
                      {phase.arabic && (
                        <View style={[styles.arabicBox, { backgroundColor: phase.color + '12', borderColor: phase.color + '30' }]}>
                          <Text style={[styles.arabicText, { color: phase.color }]}>{phase.arabic}</Text>
                        </View>
                      )}
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

  // Banner
  banner: {
    padding: 30,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerCircle1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.08)', top: -80, right: -60 },
  bannerCircle2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -50, left: -40 },
  bannerEmoji: { fontSize: 56, marginBottom: 12 },
  bannerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 4 },
  bannerCount: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },

  // Phase card
  phaseCard: {
    padding: 18,
    paddingLeft: 22,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  colorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  phaseHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  phaseNum: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  phaseNumText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  phaseIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  phaseTitle: { flex: 1, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  phaseDesc: { fontSize: 14, lineHeight: 22, fontWeight: '500', marginTop: 14 },
  arabicBox: { padding: 16, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center', marginTop: 12 },
  arabicText: { fontSize: 18, textAlign: 'center', lineHeight: 30 },
});
