import React, { useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import AppIcon from '../components/Icon';
import { FadeUp, FadeIn, ScaleIn, SlideIn, Float, Pulse, Rotate, PressableCard, useParallaxHero } from '../components/Animated';

const { width: SW, height: SH } = Dimensions.get('window');
const HERO_HEIGHT = 380;

// ═══ DATA ═══
const FEATURES = [
  { iconKey:'quran', key:'feature1', nav:'Quran', gradient:['#10b981','#059669'] },
  { iconKey:'hadith', key:'feature2', nav:'Hadith', gradient:['#f59e0b','#d97706'] },
  { iconKey:'prayer', key:'feature3', nav:'Prayer', gradient:['#3b82f6','#2563eb'] },
  { iconKey:'duas', key:'feature4', nav:'Duas', gradient:['#8b5cf6','#7c3aed'] },
  { iconKey:'names', key:'feature5', nav:'Names', gradient:['#ec4899','#db2777'] },
  { iconKey:'zakat', key:'feature6', nav:'Zakat', gradient:['#f97316','#ea580c'] },
];

const QUICK_LINKS = [
  { iconKey:'dhikr', label:'dhikr', nav:'Dhikr', color:'#10b981' },
  { iconKey:'qibla', label:'qibla', nav:'Qibla', color:'#3b82f6' },
  { iconKey:'calendar', label:'calendar', nav:'Calendar', color:'#8b5cf6' },
  { iconKey:'prayerguide', label:'prayerguide', nav:'PrayerGuide', color:'#f59e0b' },
  { iconKey:'hajjguide', label:'hajjguide', nav:'HajjGuide', color:'#ef4444' },
  { iconKey:'hifz', label:'hifz', nav:'Hifz', color:'#06b6d4' },
  { iconKey:'quiz', label:'quiz', nav:'Quiz', color:'#ec4899' },
  { iconKey:'dailytracker', label:'dailytracker', nav:'DailyTracker', color:'#14b8a6' },
  { iconKey:'charity', label:'charity', nav:'Charity', color:'#f97316' },
  { iconKey:'duajournal', label:'duajournal', nav:'DuaJournal', color:'#a855f7' },
  { iconKey:'quotes', label:'quotes', nav:'Quotes', color:'#6366f1' },
  { iconKey:'analytics', label:'analytics', nav:'Analytics', color:'#84cc16' },
];

const NAV_L = {
  az:{dhikr:'Zikr',qibla:'Qibla',calendar:'Təqvim',prayerguide:'Namaz',hajjguide:'Həcc',hifz:'Hifz',quiz:'Quiz',dailytracker:'Tracker',analytics:'Analytics',charity:'Sədəqə',duajournal:'Jurnal',quotes:'Sitatlar'},
  en:{dhikr:'Dhikr',qibla:'Qibla',calendar:'Calendar',prayerguide:'Prayer',hajjguide:'Hajj',hifz:'Hifz',quiz:'Quiz',dailytracker:'Tracker',analytics:'Analytics',charity:'Charity',duajournal:'Journal',quotes:'Quotes'},
  ru:{dhikr:'Зикр',qibla:'Кибла',calendar:'Календарь',prayerguide:'Намаз',hajjguide:'Хадж',hifz:'Хифз',quiz:'Тест',dailytracker:'Трекер',analytics:'Статистика',charity:'Садака',duajournal:'Дуа',quotes:'Цитаты'},
  ar:{dhikr:'الذكر',qibla:'القبلة',calendar:'التقويم',prayerguide:'الصلاة',hajjguide:'الحج',hifz:'الحفظ',quiz:'اختبار',dailytracker:'المتابعة',analytics:'إحصائيات',charity:'الصدقة',duajournal:'الدعاء',quotes:'اقتباسات'},
  tr:{dhikr:'Zikir',qibla:'Kıble',calendar:'Takvim',prayerguide:'Namaz',hajjguide:'Hac',hifz:'Hıfz',quiz:'Sınav',dailytracker:'Takip',analytics:'İstatistik',charity:'Sadaka',duajournal:'Günlük',quotes:'Alıntılar'},
};

const STATS = {
  az:[{n:'114',l:'Surə',i:'quran'},{n:'6236',l:'Ayə',i:'quran'},{n:'50+',l:'Hədis',i:'hadith'},{n:'100+',l:'Dua',i:'duas'},{n:'99',l:'Ad',i:'names'},{n:'5',l:'Dil',i:'settings'}],
  en:[{n:'114',l:'Surahs',i:'quran'},{n:'6236',l:'Verses',i:'quran'},{n:'50+',l:'Hadiths',i:'hadith'},{n:'100+',l:"Du'as",i:'duas'},{n:'99',l:'Names',i:'names'},{n:'5',l:'Languages',i:'settings'}],
  ru:[{n:'114',l:'Сур',i:'quran'},{n:'6236',l:'Аятов',i:'quran'},{n:'50+',l:'Хадисов',i:'hadith'},{n:'100+',l:'Дуа',i:'duas'},{n:'99',l:'Имён',i:'names'},{n:'5',l:'Языков',i:'settings'}],
  ar:[{n:'١١٤',l:'سورة',i:'quran'},{n:'٦٢٣٦',l:'آية',i:'quran'},{n:'٥٠+',l:'حديث',i:'hadith'},{n:'١٠٠+',l:'دعاء',i:'duas'},{n:'٩٩',l:'اسم',i:'names'},{n:'٥',l:'لغات',i:'settings'}],
  tr:[{n:'114',l:'Sure',i:'quran'},{n:'6236',l:'Ayet',i:'quran'},{n:'50+',l:'Hadis',i:'hadith'},{n:'100+',l:'Dua',i:'duas'},{n:'99',l:'İsim',i:'names'},{n:'5',l:'Dil',i:'settings'}],
};

const TAWHEED = [
  { ar:'تَوْحِيدُ الرُّبُوبِيَّة', color:'#10b981', gradient:['#10b981','#059669'],
    title:{az:'Rübubiyyət Tövhidi',en:'Tawhid al-Rububiyyah',ru:'Таухид ар-Рубубийя',ar:'توحيد الربوبية',tr:'Rububiyyet Tevhidi'},
    desc:{az:'Allahın Rəbb olduğuna inanmaqdır — O hər şeyin yaradıcısı, ruziversi, idarəçisidir.',en:'Belief in Allah\'s Lordship — that He alone creates, provides sustenance, and governs all things.',ru:'Вера в господство Аллаха — Он один творит и управляет всем.',ar:'الإيمان بأن الله وحده هو الخالق الرازق المدبر',tr:'Allah\'ın Rablığına iman — yalnız O yaratan ve rızık verendir.'},
    ayah:'أَلاَ لَهُ الْخَلْقُ وَالأَمْرُ', ayahRef:{az:'Əraf 54',en:'Al-A\'raf 54',ru:'Аль-Аграф 54',ar:'الأعراف ٥٤',tr:'Araf 54'} },
  { ar:'تَوْحِيدُ الأُلُوهِيَّة', color:'#f59e0b', gradient:['#f59e0b','#d97706'],
    title:{az:'Uluhiyyət Tövhidi',en:'Tawhid al-Uluhiyyah',ru:'Таухид аль-Улюхийя',ar:'توحيد الألوهية',tr:'Uluhiyyet Tevhidi'},
    desc:{az:'Bütün ibadətin — namaz, dua, qurban — yalnız Allaha edilməsidir. Peyğəmbərlərin dəvətinin əsası.',en:'Dedicating all worship solely to Allah. This is the core of every prophet\'s call.',ru:'Посвящение поклонения исключительно Аллаху.',ar:'إفراد الله بالعبادة',tr:'Tüm ibadetleri yalnızca Allah\'a adamak.'},
    ayah:'وَمَا خَلَقْتُ الجِنَّ وَالإِنسَ إِلاَّ لِيَعْبُدُونِ', ayahRef:{az:'Zariyat 56',en:'Adh-Dhariyat 56',ru:'Аз-Зарийат 56',ar:'الذاريات ٥٦',tr:'Zariyat 56'} },
  { ar:'تَوْحِيدُ الأَسْمَاءِ وَالصِّفَاتِ', color:'#8b5cf6', gradient:['#8b5cf6','#7c3aed'],
    title:{az:'Əsma və Sifat Tövhidi',en:'Tawhid al-Asma was-Sifat',ru:'Таухид аль-Асма',ar:'توحيد الأسماء والصفات',tr:'Esma ve Sıfat'},
    desc:{az:'Allahın Özü üçün Quran və sünnədə sabit etdiyi bütün gözəl ad və sifətlərə iman.',en:'Affirming Allah\'s beautiful Names and Attributes without likening them to creation.',ru:'Утверждение Имён и Атрибутов Аллаха.',ar:'إثبات الأسماء والصفات',tr:'Allah\'ın isim ve sıfatlarını ispat etmek.'},
    ayah:'وَلِلَّهِ الأَسْمَاءُ الْحُسْنَى فَادْعُوهُ بِهَا', ayahRef:{az:'Əraf 180',en:'Al-A\'raf 180',ru:'Аль-Аграф 180',ar:'الأعراف ١٨٠',tr:'Araf 180'} },
];

const FIVE_PILLARS = [
  { n:1, icon:'☝️', color:'#10b981', gradient:['#10b981','#059669'], t:{az:'Şəhadət',en:'Shahada',ru:'Шахада',ar:'الشهادة',tr:'Şehadet'}, d:{az:'Allahdan başqa ilah olmadığına və Muhəmmədin Onun elçisi olduğuna şəhadət vermək.',en:'Testifying that there is no god but Allah and Muhammad is His Messenger.',ru:'Свидетельство: нет бога кроме Аллаха, Мухаммад — Его посланник.',ar:'الشهادة أن لا إله إلا الله وأن محمداً رسول الله',tr:'Allah\'tan başka ilah olmadığına ve Muhammed\'in Onun elçisi olduğuna şehadet.'} },
  { n:2, icon:'🕌', color:'#3b82f6', gradient:['#3b82f6','#2563eb'], t:{az:'Namaz',en:'Salah',ru:'Намаз',ar:'الصلاة',tr:'Namaz'}, d:{az:'Hər müsəlmana gündə 5 vaxt namaz qılmaq fərzdir: Sübh, Zöhr, Əsr, Məğrib, İşa.',en:'Performing the 5 daily prayers: Fajr, Dhuhr, Asr, Maghrib, Isha.',ru:'5 ежедневных молитв: Фаджр, Зухр, Аср, Магриб, Иша.',ar:'أداء الصلوات الخمس',tr:'Günde 5 vakit namaz kılmak farzdır.'} },
  { n:3, icon:'💰', color:'#f59e0b', gradient:['#f59e0b','#d97706'], t:{az:'Zəkat',en:'Zakat',ru:'Закят',ar:'الزكاة',tr:'Zekât'}, d:{az:'Malı nisab həddinə çatan hər müsəlman malının 2.5%-ni ehtiyacı olanlara verməlidir.',en:'Giving 2.5% of wealth to those in need once nisab threshold is reached.',ru:'Отдать 2.5% имущества нуждающимся при достижении нисаба.',ar:'إخراج ٢.٥٪ من المال للفقراء',tr:'Nisap miktarına ulaşanların malının %2.5\'ini vermesi.'} },
  { n:4, icon:'🌙', color:'#8b5cf6', gradient:['#8b5cf6','#7c3aed'], t:{az:'Oruc',en:'Sawm',ru:'Пост',ar:'الصيام',tr:'Oruç'}, d:{az:'Ramazan ayında sübhdən məğribə qədər yemək, içmək və iftar edən şeylərdən çəkinmək.',en:'Fasting from dawn to sunset during the month of Ramadan.',ru:'Пост от рассвета до заката в месяц Рамадан.',ar:'الصيام من الفجر إلى المغرب في رمضان',tr:'Ramazan\'da imsak\'tan iftar\'a oruç tutmak.'} },
  { n:5, icon:'🕋', color:'#ef4444', gradient:['#ef4444','#dc2626'], t:{az:'Həcc',en:'Hajj',ru:'Хадж',ar:'الحج',tr:'Hac'}, d:{az:'İmkanı olan hər müsəlman ömründə ən azı bir dəfə Məkkəyə Həcc ziyarətini yerinə yetirməlidir.',en:'Performing Hajj pilgrimage to Mecca at least once in a lifetime if able.',ru:'Совершить Хадж в Мекку хотя бы раз в жизни.',ar:'أداء الحج مرة واحدة في العمر للمستطيع',tr:'Ömründe en az bir kere Mekke\'ye hac yapmak.'} },
];

const DAILY_HADITHS = [
  { ar:'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ', az:'Əməllər ancaq niyyətlərə görədir.', en:'Actions are judged by intentions.', ru:'Дела оцениваются по намерениям.', tr:'Ameller niyetlere göredir.', source:'Buxari 1' },
  { ar:'الدِّينُ النَّصِيحَةُ', az:'Din nəsihətdir.', en:'Religion is sincerity.', ru:'Религия — это искренность.', tr:'Din nasihattır.', source:'Muslim 55' },
  { ar:'أَلاَ بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', az:'Qəlblər ancaq Allahın zikri ilə rahatlıq tapar.', en:'Hearts find rest only in the remembrance of Allah.', ru:'Сердца успокаиваются поминанием Аллаха.', tr:'Kalpler ancak Allah\'ın zikriyle huzur bulur.', source:'Rad 28' },
  { ar:'خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ', az:'İnsanların ən xeyirlisi insanlara ən faydalı olanıdır.', en:'The best of people are those most beneficial to others.', ru:'Лучшие из людей — наиболее полезные.', tr:'İnsanların en hayırlısı insanlara en faydalı olanıdır.', source:'Taberani' },
  { ar:'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ', az:'Qardaşının üzünə gülümsəmən sədəqədir.', en:'Your smile to your brother is charity.', ru:'Улыбка брату — милостыня.', tr:'Kardeşinin yüzüne gülümsemen sadakadır.', source:'Tirmizi' },
  { ar:'إِنَّ اللَّهَ جَمِيلٌ يُحِبُّ الْجَمَالَ', az:'Allah gözəldir, gözəlliyi sevir.', en:'Allah is beautiful and loves beauty.', ru:'Аллах красив и любит красоту.', tr:'Allah güzeldir, güzelliği sever.', source:'Muslim 91' },
  { ar:'طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ', az:'Elm öyrənmək hər müsəlmana fərzdir.', en:'Seeking knowledge is obligatory upon every Muslim.', ru:'Знание — обязанность каждого мусульманина.', tr:'İlim öğrenmek her Müslümana farzdır.', source:'İbn Macə' },
];

const DAILY_DUAS = [
  { ar:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً', t:{az:'Rəbbimiz, bizə dünyada da, axirətdə də gözəllik ver.',en:'Our Lord, give us good in this world and the Hereafter.',ru:'Господь наш, даруй нам благо в мире и в будущем.',ar:'ربنا آتنا في الدنيا حسنة',tr:'Rabbimiz, bize dünyada da ahirette de iyilik ver.'}, ref:'Bəqərə 201' },
  { ar:'رَبِّ زِدْنِي عِلْماً', t:{az:'Rəbbim, elmimi artır.',en:'My Lord, increase me in knowledge.',ru:'Господи, приумножь мне знание.',ar:'رب زدني علماً',tr:'Rabbim, ilmimi artır.'}, ref:'Taha 114' },
  { ar:'رَبِّ اشْرَحْ لِي صَدْرِي', t:{az:'Rəbbim, köksümü aç və işimi asanlaşdır.',en:'My Lord, expand my chest and ease my task.',ru:'Господи, раскрой мне грудь и облегчи дело.',ar:'رب اشرح لي صدري',tr:'Rabbim, göğsümü aç ve işimi kolaylaştır.'}, ref:'Taha 25-26' },
];

const ALLAH_NAMES = [
  { ar:'ٱلرَّحْمَٰن', name:'Rəhman', en:'The Most Gracious', color:'#10b981' },
  { ar:'ٱلرَّحِيم', name:'Rəhim', en:'The Most Merciful', color:'#f59e0b' },
  { ar:'ٱلْمَلِك', name:'Malik', en:'The King', color:'#8b5cf6' },
  { ar:'ٱلْقُدُّوس', name:'Quddus', en:'The Most Pure', color:'#3b82f6' },
  { ar:'ٱلسَّلَٰم', name:'Salam', en:'Source of Peace', color:'#ec4899' },
  { ar:'ٱلْعَزِيز', name:'Əziz', en:'The Almighty', color:'#f97316' },
  { ar:'ٱلْغَفُور', name:'Ğafur', en:'The Forgiving', color:'#14b8a6' },
  { ar:'ٱلْوَدُود', name:'Vadud', en:'The Loving', color:'#a855f7' },
  { ar:'ٱلْحَكِيم', name:'Həkim', en:'The Wise', color:'#6366f1' },
  { ar:'ٱلنُّور', name:'Nur', en:'The Light', color:'#fbbf24' },
  { ar:'ٱلتَّوَّاب', name:'Tövvab', en:'Repentance', color:'#84cc16' },
  { ar:'ٱلْمُؤْمِن', name:'Mümün', en:'Security', color:'#ef4444' },
];

// ═══════════════════════════════════════════
export default function HomeScreen({ navigation }) {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const t = T[lang]?.home || T.az.home;
  const stats = STATS[lang] || STATS.az;
  const navLabels = NAV_L[lang] || NAV_L.az;

  // Parallax scroll
  const scrollY = useRef(new Animated.Value(0)).current;
  const { heroScale, heroTranslate, heroOpacity } = useParallaxHero(scrollY, HERO_HEIGHT);

  // Header blur animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 100, HERO_HEIGHT - 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const todayIdx = new Date().getDate() % DAILY_HADITHS.length;
  const duaIdx = new Date().getDate() % DAILY_DUAS.length;
  const sh = dark ? Shadows.dark.md : Shadows.md;
  const shL = dark ? Shadows.dark.lg : Shadows.lg;

  const navigate = (screen) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(screen);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>

      {/* ═══ ANİMATED BLURRED HEADER (appears on scroll) ═══ */}
      <Animated.View
        pointerEvents="none"
        style={[
          st.animHeader,
          { opacity: headerOpacity, borderBottomColor: c.border },
        ]}
      >
        <BlurView intensity={80} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[st.animHeaderContent, { backgroundColor: dark ? 'rgba(15,15,26,0.7)' : 'rgba(255,255,255,0.7)' }]}>
          <Text style={[st.animHeaderTitle, { color: c.text }]}>☽ Muslim.cc</Text>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >

        {/* ═══ PARALLAX HERO ═══ */}
        <Animated.View style={{ transform: [{ scale: heroScale }, { translateY: heroTranslate }] }}>
          <LinearGradient
            colors={dark ? [c.ctaGradStart, c.ctaGradMid, c.ctaGradEnd] : [c.primaryDark, c.primary, c.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={st.hero}
          >
            {/* Rotating decorative ring */}
            <Rotate duration={40000} style={st.rotatingRing}>
              <View style={st.rotatingRingInner} />
            </Rotate>

            <Animated.View style={{ opacity: heroOpacity, alignItems: 'center' }}>
              <FadeIn delay={100}>
                <View style={st.heroBadge}>
                  <Text style={st.heroBadgeText}>{t.badge}</Text>
                </View>
              </FadeIn>

              <FadeUp delay={200}>
                <Text style={st.heroTitle}>{t.heroTitle}</Text>
              </FadeUp>

              <FadeUp delay={350}>
                <Text style={st.heroSub}>{t.heroSub}</Text>
              </FadeUp>

              <FadeUp delay={500}>
                <View style={st.heroButtons}>
                  <PressableCard
                    style={[st.heroBtnP, Shadows.button]}
                    onPress={() => navigate('Quran')}
                    haptic="medium"
                  >
                    <AppIcon name="quran" size={20} color={c.primary} style={{ marginRight: 8 }} />
                    <Text style={[st.heroBtnPT, { color: c.primary }]}>{t.btnQuran}</Text>
                  </PressableCard>

                  <PressableCard style={st.heroBtnS} onPress={() => navigate('Prayer')} haptic="medium">
                    <AppIcon name="prayer" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={st.heroBtnST}>{t.btnPrayer}</Text>
                  </PressableCard>
                </View>
              </FadeUp>
            </Animated.View>

            {/* Decorative blurred circles */}
            <View style={st.heroCircle1} />
            <View style={st.heroCircle2} />
            <View style={st.heroCircle3} />
          </LinearGradient>
        </Animated.View>

        <View style={st.contentWrap}>

          {/* ═══ GÜNÜN HƏDİSİ ═══ */}
          <ScaleIn delay={200}>
            <View style={[st.floatingCard, { backgroundColor: c.card, borderColor: c.cardBorder }, shL]}>
              <LinearGradient
                colors={['transparent', c.goldBg]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={st.dailyHeader}>
                <View style={[st.dailyIcon, { backgroundColor: c.goldBg }]}>
                  <AppIcon name="hadith" size={18} color={c.gold} />
                </View>
                <Text style={[st.dailyLabel, { color: c.gold }]}>
                  {lang === 'az' ? 'GÜNÜN HƏDİSİ' : lang === 'ru' ? 'ХАДИС ДНЯ' : lang === 'ar' ? 'حديث اليوم' : lang === 'tr' ? 'GÜNÜN HADİSİ' : 'HADITH OF THE DAY'}
                </Text>
              </View>
              <Text style={[st.dailyArabic, { color: c.text }]}>{DAILY_HADITHS[todayIdx].ar}</Text>
              <Text style={[st.dailyText, { color: c.textSecondary }]}>{DAILY_HADITHS[todayIdx][lang] || DAILY_HADITHS[todayIdx].en}</Text>
              <View style={[st.sourceChip, { backgroundColor: c.goldBg }]}>
                <Text style={[st.sourceChipText, { color: c.gold }]}>— {DAILY_HADITHS[todayIdx].source}</Text>
              </View>
            </View>
          </ScaleIn>

          {/* ═══ AYƏ ═══ */}
          <FadeUp delay={300}>
            <View style={[st.ayahCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
              <Float distance={8}>
                <View style={[st.ayahIconWrap, { backgroundColor: c.goldBg }]}>
                  <AppIcon name="crescent" size={32} color={c.gold} />
                </View>
              </Float>
              <Text style={[st.ayahText, { color: c.text }]}>"{t.ayah}"</Text>
              <View style={[st.ayahRefBadge, { backgroundColor: c.primaryBg }]}>
                <Text style={[st.ayahRef, { color: c.primary }]}>{t.ayahRef}</Text>
              </View>
            </View>
          </FadeUp>

          {/* ═══ GÜNÜN DUASI ═══ */}
          <FadeUp delay={400}>
            <LinearGradient
              colors={dark ? ['#1a3d2a', '#0d2818'] : ['#e8f4ee', '#f0faf4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[st.duaCard, { borderColor: c.primaryBorder }, sh]}
            >
              <View style={st.dailyHeader}>
                <View style={[st.dailyIcon, { backgroundColor: c.primaryBg }]}>
                  <AppIcon name="duas" size={18} color={c.primary} />
                </View>
                <Text style={[st.dailyLabel, { color: c.primary }]}>
                  {lang === 'az' ? 'GÜNÜN DUASI' : lang === 'ru' ? 'ДУА ДНЯ' : lang === 'ar' ? 'دعاء اليوم' : lang === 'tr' ? 'GÜNÜN DUASI' : 'DUA OF THE DAY'}
                </Text>
              </View>
              <Text style={[st.dailyArabic, { color: c.text }]}>{DAILY_DUAS[duaIdx].ar}</Text>
              <Text style={[st.dailyText, { color: c.textSecondary }]}>{DAILY_DUAS[duaIdx].t[lang] || DAILY_DUAS[duaIdx].t.en}</Text>
              <View style={[st.sourceChip, { backgroundColor: c.primaryBg }]}>
                <Text style={[st.sourceChipText, { color: c.primary }]}>— {DAILY_DUAS[duaIdx].ref}</Text>
              </View>
            </LinearGradient>
          </FadeUp>

          {/* ═══ STATS — colorful cards ═══ */}
          <View style={st.sec}>
            <FadeUp><Text style={[st.secTitle, { color: c.text }]}>{t.statsTitle}</Text></FadeUp>
            <FadeUp delay={100}>
              <Text style={[st.secSub, { color: c.textSecondary }]}>
                {lang === 'az' ? 'Platformamızın məzmunu bir baxışda' : lang === 'ru' ? 'Обзор контента платформы' : lang === 'ar' ? 'نظرة على محتوى المنصة' : lang === 'tr' ? 'Platform içeriğine bir bakış' : 'Platform content at a glance'}
              </Text>
            </FadeUp>
            <View style={st.statsGrid}>
              {stats.map((s, i) => (
                <SlideIn key={i} delay={200 + i * 80} direction="up">
                  <View style={[st.statCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
                    <View style={[st.statIconWrap, { backgroundColor: c.primaryBg }]}>
                      <AppIcon name={s.i} size={18} color={c.primary} />
                    </View>
                    <Text style={[st.statNum, { color: c.primary }]}>{s.n}</Text>
                    <Text style={[st.statLabel, { color: c.textMuted }]}>{s.l}</Text>
                  </View>
                </SlideIn>
              ))}
            </View>
          </View>

          {/* ═══ QUICK LINKS — colorful bubbles ═══ */}
          <View style={st.sec}>
            <FadeUp>
              <Text style={[st.secTitle, { color: c.text }]}>
                {lang === 'az' ? 'Sürətli Keçid' : lang === 'ru' ? 'Быстрые Ссылки' : lang === 'ar' ? 'روابط سريعة' : lang === 'tr' ? 'Hızlı Erişim' : 'Quick Access'}
              </Text>
            </FadeUp>
            <FadeUp delay={100}>
              <Text style={[st.secSub, { color: c.textSecondary }]}>
                {lang === 'az' ? 'Ən çox istifadə olunan xüsusiyyətlərə cəld keçid' : lang === 'ru' ? 'Быстрый доступ к популярным функциям' : lang === 'ar' ? 'الوصول السريع للميزات الأكثر استخداماً' : lang === 'tr' ? 'En çok kullanılan özelliklere hızlı erişim' : 'Quick access to most used features'}
              </Text>
            </FadeUp>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.quickScroll}>
              {QUICK_LINKS.map((q, i) => (
                <FadeUp key={i} delay={100 + i * 40}>
                  <PressableCard
                    style={[st.quickLink, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}
                    onPress={() => navigate(q.nav)}
                  >
                    <View style={[st.quickIconW, { backgroundColor: q.color + '18' }]}>
                      <AppIcon name={q.iconKey} size={24} color={q.color} />
                    </View>
                    <Text style={[st.quickLabel, { color: c.text }]} numberOfLines={1}>{navLabels[q.label]}</Text>
                  </PressableCard>
                </FadeUp>
              ))}
            </ScrollView>
          </View>

          {/* ═══ İSLAMIN 5 SÜTUNU — with gradient cards ═══ */}
          <View style={st.sec}>
            <FadeUp>
              <Text style={[st.secTitle, { color: c.text }]}>
                {lang === 'az' ? 'İslamın 5 Sütunu' : lang === 'ru' ? '5 Столпов Ислама' : lang === 'ar' ? 'أركان الإسلام الخمسة' : lang === 'tr' ? 'İslamın 5 Şartı' : '5 Pillars of Islam'}
              </Text>
              <Text style={[st.secSub, { color: c.textSecondary }]}>
                {lang === 'az' ? 'Hər müsəlmanın bilməli olduğu əsas ibadətlər' : lang === 'ru' ? 'Основные обязанности каждого мусульманина' : lang === 'ar' ? 'الأركان الأساسية لكل مسلم' : lang === 'tr' ? 'Her Müslümanın bilmesi gereken temel ibadetler' : 'Core worships every Muslim must know'}
              </Text>
            </FadeUp>
            {FIVE_PILLARS.map((p, i) => (
              <FadeUp key={i} delay={i * 100}>
                <PressableCard
                  style={[st.pillarCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}
                  haptic="light"
                >
                  <LinearGradient
                    colors={[p.color + '18', p.color + '03']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <View style={st.pillarRow}>
                    <LinearGradient colors={p.gradient} style={st.pillarNumBadge}>
                      <Text style={st.pillarNum}>{p.n}</Text>
                    </LinearGradient>
                    <Text style={st.pillarIcon}>{p.icon}</Text>
                    <Text style={[st.pillarTitle, { color: c.text }]}>{p.t[lang] || p.t.en}</Text>
                  </View>
                  <Text style={[st.pillarDesc, { color: c.textSecondary }]}>{p.d[lang] || p.d.en}</Text>
                </PressableCard>
              </FadeUp>
            ))}
          </View>

          {/* ═══ TÖVHİD ═══ */}
          <View style={st.sec}>
            <FadeUp>
              <Text style={[st.secTitle, { color: c.text }]}>
                {lang === 'az' ? 'Tövhid — Allahın Birliyi' : lang === 'ru' ? 'Таухид — Единство Аллаха' : lang === 'ar' ? 'التوحيد — وحدانية الله' : lang === 'tr' ? 'Tevhid — Allah\'ın Birliği' : 'Tawheed — Oneness of Allah'}
              </Text>
              <Text style={[st.secSub, { color: c.textSecondary }]}>
                {lang === 'az' ? 'Tövhid üç əsas qismə bölünür' : lang === 'ru' ? 'Таухид делится на три вида' : lang === 'ar' ? 'التوحيد ثلاثة أقسام' : lang === 'tr' ? 'Tevhid üç kısma ayrılır' : 'Tawheed has three essential categories'}
              </Text>
            </FadeUp>
            {TAWHEED.map((tw, i) => (
              <FadeUp key={i} delay={i * 120}>
                <View style={[st.tawheedCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
                  <LinearGradient
                    colors={[tw.color + '15', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <View style={[st.twIndicator, { backgroundColor: tw.color }]} />
                  <Text style={[st.twAr, { color: tw.color }]}>{tw.ar}</Text>
                  <Text style={[st.twTitle, { color: c.text }]}>{tw.title[lang] || tw.title.en}</Text>
                  <Text style={[st.twDesc, { color: c.textSecondary }]}>{tw.desc[lang] || tw.desc.en}</Text>
                  <View style={[st.twAyahBox, { backgroundColor: tw.color + '10', borderColor: tw.color + '25' }]}>
                    <Text style={[st.twAyah, { color: tw.color }]}>{tw.ayah}</Text>
                    <Text style={[st.twAyahRef, { color: tw.color + 'bb' }]}>— {tw.ayahRef[lang] || tw.ayahRef.en}</Text>
                  </View>
                </View>
              </FadeUp>
            ))}
          </View>

          {/* ═══ ALLAHIN ADLARI — horizontal scroll gradient chips ═══ */}
          <View style={st.sec}>
            <FadeUp>
              <Text style={[st.secTitle, { color: c.text }]}>
                {lang === 'az' ? 'Allahın Gözəl Adları' : lang === 'ru' ? 'Прекрасные Имена Аллаха' : lang === 'ar' ? 'أسماء الله الحسنى' : lang === 'tr' ? 'Allah\'ın Güzel İsimleri' : 'Beautiful Names of Allah'}
              </Text>
              <Text style={[st.secSub, { color: c.textSecondary }]}>
                {lang === 'az' ? 'Əsmaül-Hüsna — ən gözəl 99 ad' : lang === 'ru' ? '99 прекрасных имён Аллаха' : lang === 'ar' ? '٩٩ اسماً حسنى' : lang === 'tr' ? '99 en güzel isim' : '99 most beautiful names'}
              </Text>
            </FadeUp>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 4 }}>
              {ALLAH_NAMES.map((n, i) => (
                <FadeUp key={i} delay={i * 50}>
                  <PressableCard onPress={() => navigate('Names')} style={{}}>
                    <LinearGradient
                      colors={[n.color + '22', n.color + '08']}
                      style={[st.nameChip, { borderColor: n.color + '40' }]}
                    >
                      <Text style={[st.nameAr, { color: n.color }]}>{n.ar}</Text>
                      <Text style={[st.nameTr, { color: c.text }]}>{n.name}</Text>
                      <Text style={[st.nameEn, { color: c.textMuted }]}>{n.en}</Text>
                    </LinearGradient>
                  </PressableCard>
                </FadeUp>
              ))}
            </ScrollView>
          </View>

          {/* ═══ XÜSUSİYYƏTLƏR — gradient feature cards ═══ */}
          <View style={st.sec}>
            <FadeUp>
              <Text style={[st.secTitle, { color: c.text }]}>{t.featTitle}</Text>
              <Text style={[st.secSub, { color: c.textSecondary }]}>{t.featSub}</Text>
            </FadeUp>
            {FEATURES.map((f, i) => (
              <FadeUp key={i} delay={i * 80}>
                <PressableCard
                  style={[st.featureCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}
                  onPress={() => navigate(f.nav)}
                >
                  <LinearGradient colors={f.gradient} style={st.featureIconW}>
                    <AppIcon name={f.iconKey} size={26} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.featureTitle, { color: c.text }]}>{t[`${f.key}Title`]}</Text>
                    <Text style={[st.featureDesc, { color: c.textSecondary }]}>{t[`${f.key}Desc`]}</Text>
                  </View>
                  <View style={[st.featureArrow, { backgroundColor: c.primaryBg }]}>
                    <AppIcon name="chevronRight" size={18} color={c.primary} />
                  </View>
                </PressableCard>
              </FadeUp>
            ))}
          </View>

          {/* ═══ CTA ═══ */}
          <FadeUp delay={200}>
            <LinearGradient
              colors={dark ? [c.ctaGradStart, c.ctaGradMid, c.ctaGradEnd] : [c.primaryDark, c.primary, c.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[st.ctaCard, Shadows.floating]}
            >
              <Float distance={4}>
                <AppIcon name="crescent" size={40} color="#fff" style={{ opacity: 0.4, marginBottom: 12 }} />
              </Float>
              <Text style={st.ctaTitle}>{t.ctaTitle}</Text>
              <Text style={st.ctaDesc}>{t.ctaDesc}</Text>
              <PressableCard
                style={[st.ctaBtn, Shadows.button]}
                onPress={() => navigate('Quran')}
                haptic="medium"
              >
                <AppIcon name="quran" size={20} color={c.primary} style={{ marginRight: 8 }} />
                <Text style={[st.ctaBtnText, { color: c.primary }]}>{t.ctaBtn}</Text>
              </PressableCard>
              <View style={st.ctaCircle1} />
              <View style={st.ctaCircle2} />
            </LinearGradient>
          </FadeUp>

          <View style={{ height: 60 }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  // Animated blur header
  animHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 90,
    zIndex: 10,
    borderBottomWidth: 0.5,
  },
  animHeaderContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 14,
  },
  animHeaderTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },

  // Hero
  hero: {
    paddingTop: 36,
    paddingBottom: 52,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    minHeight: HERO_HEIGHT,
    justifyContent: 'center',
  },
  rotatingRing: {
    position: 'absolute',
    width: 400,
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.1,
  },
  rotatingRingInner: {
    width: 380,
    height: 380,
    borderRadius: 190,
    borderWidth: 1,
    borderColor: '#fff',
    borderStyle: 'dashed',
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 20,
  },
  heroBadgeText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5, textAlign: 'center' },
  heroTitle: { fontSize: 32, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 14, letterSpacing: -1, lineHeight: 38 },
  heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24, marginBottom: 28, paddingHorizontal: 8 },
  heroButtons: { flexDirection: 'row', gap: 12 },
  heroBtnP: { backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 16, borderRadius: BorderRadius.xl, flexDirection: 'row', alignItems: 'center' },
  heroBtnPT: { fontWeight: '800', fontSize: 15, letterSpacing: -0.2 },
  heroBtnS: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 24, paddingVertical: 16, borderRadius: BorderRadius.xl, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', flexDirection: 'row', alignItems: 'center' },
  heroBtnST: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: -0.2 },
  heroCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.05)', top: -100, right: -80 },
  heroCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -60, left: -50 },
  heroCircle3: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.03)', top: '50%', right: -40 },

  // Content wrap
  contentWrap: { marginTop: -24 },

  // Floating daily hadith card
  floatingCard: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dailyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  dailyIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dailyLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  dailyArabic: { fontSize: 22, textAlign: 'right', lineHeight: 38, marginBottom: 14, writingDirection: 'rtl' },
  dailyText: { fontSize: 15, lineHeight: 24, marginBottom: 14 },
  sourceChip: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  sourceChipText: { fontSize: 12, fontWeight: '700' },

  // Ayah card
  ayahCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 28,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
  ayahIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  ayahText: { fontSize: 17, fontStyle: 'italic', textAlign: 'center', lineHeight: 28, marginBottom: 14 },
  ayahRefBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999 },
  ayahRef: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },

  // Dua card
  duaCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
  },

  // Section
  sec: { paddingHorizontal: 20, marginTop: 40 },
  secTitle: { fontSize: 24, fontWeight: '800', marginBottom: 6, letterSpacing: -0.5 },
  secSub: { fontSize: 14, marginBottom: 22, lineHeight: 22 },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: (SW - 40 - 24) / 3, paddingVertical: 20, paddingHorizontal: 10, alignItems: 'center', borderRadius: BorderRadius.lg, borderWidth: 1 },
  statIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statNum: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, marginTop: 4, fontWeight: '600' },

  // Quick links
  quickScroll: { paddingVertical: 8, gap: 12, paddingHorizontal: 2 },
  quickLink: { width: 92, paddingVertical: 16, paddingHorizontal: 8, borderRadius: BorderRadius.lg, borderWidth: 1, alignItems: 'center' },
  quickIconW: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  quickLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  // 5 Pillars
  pillarCard: { padding: 22, borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  pillarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 14 },
  pillarNumBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pillarNum: { fontSize: 17, fontWeight: '800', color: '#fff' },
  pillarIcon: { fontSize: 32 },
  pillarTitle: { flex: 1, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  pillarDesc: { fontSize: 14, lineHeight: 22 },

  // Tawheed
  tawheedCard: { padding: 22, borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: 14, overflow: 'hidden', position: 'relative' },
  twIndicator: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  twAr: { fontSize: 22, textAlign: 'right', marginBottom: 10, marginLeft: 10, lineHeight: 36 },
  twTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, marginLeft: 10, letterSpacing: -0.3 },
  twDesc: { fontSize: 14, lineHeight: 23, marginBottom: 16, marginLeft: 10 },
  twAyahBox: { padding: 18, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center', marginLeft: 10 },
  twAyah: { fontSize: 18, textAlign: 'center', lineHeight: 32 },
  twAyahRef: { fontSize: 11, fontWeight: '700', marginTop: 8, letterSpacing: 0.3 },

  // Allah names
  nameChip: { paddingHorizontal: 20, paddingVertical: 16, borderRadius: BorderRadius.lg, borderWidth: 1.5, alignItems: 'center', minWidth: 100 },
  nameAr: { fontSize: 26, marginBottom: 6 },
  nameTr: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  nameEn: { fontSize: 10, fontWeight: '500' },

  // Features
  featureCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: 12 },
  featureIconW: { width: 56, height: 56, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  featureTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4, letterSpacing: -0.2 },
  featureDesc: { fontSize: 13, lineHeight: 20 },
  featureArrow: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  // CTA
  ctaCard: {
    marginHorizontal: 20,
    marginTop: 40,
    padding: 36,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  ctaTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 12, letterSpacing: -0.5, textAlign: 'center' },
  ctaDesc: { fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 28, lineHeight: 24 },
  ctaBtn: { backgroundColor: '#fff', paddingHorizontal: 32, paddingVertical: 16, borderRadius: BorderRadius.xl, flexDirection: 'row', alignItems: 'center' },
  ctaBtnText: { fontWeight: '800', fontSize: 15, letterSpacing: -0.2 },
  ctaCircle1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.06)', top: -80, left: -60 },
  ctaCircle2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -60, right: -40 },
});
