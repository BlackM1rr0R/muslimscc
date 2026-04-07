import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import AppIcon from '../components/Icon';
import { FadeUp, FadeIn, ScaleIn, Float, usePressAnimation } from '../components/Animated';

const { width: SW } = Dimensions.get('window');

const FEATURES = [
  { iconKey:'quran', key:'feature1', nav:'Quran' },
  { iconKey:'hadith', key:'feature2', nav:'Hadith' },
  { iconKey:'prayer', key:'feature3', nav:'Prayer' },
  { iconKey:'duas', key:'feature4', nav:'Duas' },
  { iconKey:'names', key:'feature5', nav:'Names' },
  { iconKey:'zakat', key:'feature6', nav:'Zakat' },
];

const QUICK_LINKS = [
  { iconKey:'dhikr', label:'dhikr', nav:'Dhikr' },
  { iconKey:'qibla', label:'qibla', nav:'Qibla' },
  { iconKey:'calendar', label:'calendar', nav:'Calendar' },
  { iconKey:'prayerguide', label:'prayerguide', nav:'PrayerGuide' },
  { iconKey:'hajjguide', label:'hajjguide', nav:'HajjGuide' },
  { iconKey:'hifz', label:'hifz', nav:'Hifz' },
  { iconKey:'quiz', label:'quiz', nav:'Quiz' },
  { iconKey:'dailytracker', label:'dailytracker', nav:'DailyTracker' },
  { iconKey:'charity', label:'charity', nav:'Charity' },
  { iconKey:'duajournal', label:'duajournal', nav:'DuaJournal' },
  { iconKey:'quotes', label:'quotes', nav:'Quotes' },
  { iconKey:'analytics', label:'analytics', nav:'Analytics' },
];

const NAV_L = {
  az:{dhikr:'Zikr',qibla:'Qibla',calendar:'Təqvim',prayerguide:'Namaz Dərs',hajjguide:'Həcc',hifz:'Hifz',quiz:'Quiz',dailytracker:'İzləyici',analytics:'Statistika',charity:'Sədəqə',duajournal:'Dua Jurnalı',quotes:'Sitatlar'},
  en:{dhikr:'Dhikr',qibla:'Qibla',calendar:'Calendar',prayerguide:'Prayer Guide',hajjguide:'Hajj',hifz:'Hifz',quiz:'Quiz',dailytracker:'Tracker',analytics:'Analytics',charity:'Charity',duajournal:'Journal',quotes:'Quotes'},
  ru:{dhikr:'Зикр',qibla:'Кибла',calendar:'Календарь',prayerguide:'Намаз Гид',hajjguide:'Хадж',hifz:'Хифз',quiz:'Тест',dailytracker:'Трекер',analytics:'Стат.',charity:'Садака',duajournal:'Журнал',quotes:'Цитаты'},
  ar:{dhikr:'الذكر',qibla:'القبلة',calendar:'التقويم',prayerguide:'دليل الصلاة',hajjguide:'الحج',hifz:'الحفظ',quiz:'اختبار',dailytracker:'المتابعة',analytics:'إحصائيات',charity:'الصدقة',duajournal:'دفتر الدعاء',quotes:'اقتباسات'},
  tr:{dhikr:'Zikir',qibla:'Kıble',calendar:'Takvim',prayerguide:'Namaz Rehberi',hajjguide:'Hac',hifz:'Hıfz',quiz:'Sınav',dailytracker:'Takip',analytics:'İstatistik',charity:'Sadaka',duajournal:'Dua Günlüğü',quotes:'Alıntılar'},
};

const STATS = {
  az:[{n:'114',l:'Surə'},{n:'6236',l:'Ayə'},{n:'50+',l:'Hədis'},{n:'100+',l:'Dua'},{n:'99',l:'Ad'},{n:'5',l:'Dil'}],
  en:[{n:'114',l:'Surahs'},{n:'6236',l:'Verses'},{n:'50+',l:'Hadiths'},{n:'100+',l:"Du'as"},{n:'99',l:'Names'},{n:'5',l:'Languages'}],
  ru:[{n:'114',l:'Сур'},{n:'6236',l:'Аятов'},{n:'50+',l:'Хадисов'},{n:'100+',l:'Дуа'},{n:'99',l:'Имён'},{n:'5',l:'Языков'}],
  ar:[{n:'١١٤',l:'سورة'},{n:'٦٢٣٦',l:'آية'},{n:'٥٠+',l:'حديث'},{n:'١٠٠+',l:'دعاء'},{n:'٩٩',l:'اسم'},{n:'٥',l:'لغات'}],
  tr:[{n:'114',l:'Sure'},{n:'6236',l:'Ayet'},{n:'50+',l:'Hadis'},{n:'100+',l:'Dua'},{n:'99',l:'İsim'},{n:'5',l:'Dil'}],
};

// ═══ TÖVHİD ═══
const TAWHEED = [
  { ar:'تَوْحِيدُ الرُّبُوبِيَّة', color:'#10b981',
    title:{az:'Rübubiyyət Tövhidi',en:'Tawhid al-Rububiyyah',ru:'Таухид ар-Рубубийя',ar:'توحيد الربوبية',tr:'Rububiyyet Tevhidi'},
    desc:{az:'Allahın Rəbb olduğuna inanmaqdır — O hər şeyin yaradıcısı, ruziversi, idarəçisidir.',en:'Belief in Allah\'s Lordship — that He alone creates, provides sustenance, and governs all things.',ru:'Вера в господство Аллаха — Он один творит, дарует пропитание и управляет всем.',ar:'الإيمان بأن الله وحده هو الخالق الرازق المدبر',tr:'Allah\'ın Rablığına iman — yalnız O yaratan, rızık veren ve idare edendir.'},
    ayah:'أَلاَ لَهُ الْخَلْقُ وَالأَمْرُ تَبَارَكَ اللَّهُ رَبُّ الْعَالَمِينَ', ayahRef:{az:'Əraf 54',en:'Al-A\'raf 54',ru:'Аль-Аграф 54',ar:'الأعراف ٥٤',tr:'Araf 54'} },
  { ar:'تَوْحِيدُ الأُلُوهِيَّة', color:'#f59e0b',
    title:{az:'Uluhiyyət Tövhidi',en:'Tawhid al-Uluhiyyah',ru:'Таухид аль-Улюхийя',ar:'توحيد الألوهية',tr:'Uluhiyyet Tevhidi'},
    desc:{az:'Bütün ibadətin — namaz, dua, qurban, nəzir, sevgi, qorxu — yalnız Allaha edilməsidir. Bu, peyğəmbərlərin dəvətinin əsasıdır.',en:'Dedicating all acts of worship solely to Allah: prayer, supplication, sacrifice. This is the core of every prophet\'s call.',ru:'Посвящение всех актов поклонения исключительно Аллаху. Это основа призыва каждого пророка.',ar:'إفراد الله بجميع أنواع العبادة من صلاة ودعاء وذبح ونذر',tr:'Tüm ibadetleri yalnızca Allah\'a adamak. Bu, her peygamberin davetinin temelidir.'},
    ayah:'وَمَا خَلَقْتُ الجِنَّ وَالإِنسَ إِلاَّ لِيَعْبُدُونِ', ayahRef:{az:'Zariyat 56',en:'Adh-Dhariyat 56',ru:'Аз-Зарийат 56',ar:'الذاريات ٥٦',tr:'Zariyat 56'} },
  { ar:'تَوْحِيدُ الأَسْمَاءِ وَالصِّفَاتِ', color:'#8b5cf6',
    title:{az:'Əsma və Sifat Tövhidi',en:'Tawhid al-Asma was-Sifat',ru:'Таухид аль-Асма уа ас-Сыфат',ar:'توحيد الأسماء والصفات',tr:'Esma ve Sıfat Tevhidi'},
    desc:{az:'Allahın Özü üçün Quran və sünnədə sabit etdiyi bütün gözəl ad və sifətlərə iman etmək; onları məxluqata bənzətmədən.',en:'Affirming all the beautiful Names and Attributes that Allah established for Himself in the Quran and Sunnah — without likening them to creation.',ru:'Утверждение всех прекрасных Имён и Атрибутов Аллаха — без уподобления творениям.',ar:'إثبات ما أثبته الله لنفسه من الأسماء والصفات من غير تشبيه ولا تعطيل',tr:'Kuran ve sünnette Allah\'ın kendisi için sabit kıldığı isim ve sıfatları ispat etmek.'},
    ayah:'وَلِلَّهِ الأَسْمَاءُ الْحُسْنَى فَادْعُوهُ بِهَا', ayahRef:{az:'Əraf 180',en:'Al-A\'raf 180',ru:'Аль-Аграф 180',ar:'الأعراف ١٨٠',tr:'Araf 180'} },
];

// ═══ TÖVHİD FAKTLARI ═══
const TAWHEED_FACTS = [
  { ar:'لَا إِلَهَ إِلَّا اللَّهُ', t:{az:'"La ilaha illallah" — İslamın əsası, cənnətin açarı',en:'"La ilaha illallah" — foundation of Islam, key to Paradise',ru:'"Ля иляха иллаллах" — основа ислама, ключ от рая',ar:'"لا إله إلا الله" — أساس الإسلام ومفتاح الجنة',tr:'"La ilahe illallah" — İslam\'ın temeli, cennetin anahtarı'} },
  { ar:'هُوَ اللَّهُ أَحَدٌ', t:{az:'Allah birdir — heç bir şərikin, nəzirin yoxdur',en:'Allah is One — no partners, equals, or rivals',ru:'Аллах Один — без сотоварищей и равных',ar:'الله واحد — لا شريك له ولا نظير',tr:'Allah birdir — ortağı, dengi yoktur'} },
  { ar:'اللَّهُ الصَّمَدُ', t:{az:'Allah Saməd — hər şey Ona möhtac, O heç kimə möhtac deyil',en:'Allah is As-Samad — all depend on Him, He depends on none',ru:'Аллах — Самад: все нуждаются в Нём',ar:'الله الصمد — كل شيء يحتاجه ولا يحتاج لشيء',tr:'Allah Samed\'dir — herkes O\'na muhtaç'} },
];

// ═══ İSLAMIN 5 SÜTUNU ═══
const FIVE_PILLARS = [
  { icon:'☝️', color:'#10b981', t:{az:'Şəhadət — La ilaha illallah',en:'Shahada — Declaration of Faith',ru:'Шахада — Свидетельство веры',ar:'الشهادة',tr:'Şehadet — İman İkrarı'}, d:{az:'Allahdan başqa ilah olmadığına və Muhəmmədin Onun elçisi olduğuna şəhadət.',en:'Testifying that there is no god but Allah and Muhammad is His Messenger.',ru:'Свидетельство что нет бога кроме Аллаха и Мухаммад Его посланник.',ar:'أشهد أن لا إله إلا الله وأن محمداً رسول الله',tr:'Allah\'tan başka ilah olmadığına ve Muhammed\'in O\'nun elçisi olduğuna şehadet.'} },
  { icon:'🕌', color:'#3b82f6', t:{az:'Namaz — Gündə 5 vaxt',en:'Salah — 5 Daily Prayers',ru:'Намаз — 5 ежедневных молитв',ar:'الصلاة — ٥ مرات يومياً',tr:'Namaz — Günde 5 vakit'}, d:{az:'Sübh, Zöhr, Əsr, Məğrib və İşa namazları hər müsəlmana fərzdir.',en:'Fajr, Dhuhr, Asr, Maghrib and Isha prayers are obligatory for every Muslim.',ru:'Фаджр, Зухр, Аср, Магриб и Иша обязательны для каждого мусульманина.',ar:'الفجر والظهر والعصر والمغرب والعشاء فرض على كل مسلم',tr:'Sabah, Öğle, İkindi, Akşam ve Yatsı namazları her Müslümana farzdır.'} },
  { icon:'💰', color:'#f59e0b', t:{az:'Zəkat — Malın 2.5%-i',en:'Zakat — 2.5% of Wealth',ru:'Закят — 2.5% имущества',ar:'الزكاة — ٢.٥٪ من المال',tr:'Zekât — Malın %2.5\'i'}, d:{az:'Nisab həddinə çatan hər müsəlman malının 2.5%-ni ehtiyacı olanlara verməlidir.',en:'Every Muslim whose wealth reaches the nisab threshold must give 2.5% to those in need.',ru:'Каждый мусульманин, чьё богатство достигает нисаба, обязан отдать 2.5%.',ar:'كل مسلم بلغ ماله النصاب يجب عليه إخراج ٢.٥٪',tr:'Nisap miktarına ulaşan her Müslüman malının %2.5\'ini vermekle yükümlüdür.'} },
  { icon:'🌙', color:'#8b5cf6', t:{az:'Oruc — Ramazan ayı',en:'Sawm — Fasting in Ramadan',ru:'Пост — в месяц Рамадан',ar:'الصيام — شهر رمضان',tr:'Oruç — Ramazan ayı'}, d:{az:'Ramazan ayında sübhdən məğribə qədər yemək, içmək və digər iftar edən şeylərdən çəkinmək.',en:'Abstaining from food, drink and other invalidating acts from dawn to sunset during Ramadan.',ru:'Воздержание от еды, питья с рассвета до заката в Рамадан.',ar:'الإمساك عن الأكل والشرب وسائر المفطرات من الفجر إلى المغرب',tr:'Ramazan ayında imsak\'tan iftar\'a yemek ve içmekten kaçınmak.'} },
  { icon:'🕋', color:'#ef4444', t:{az:'Həcc — Ömründə bir dəfə',en:'Hajj — Once in a Lifetime',ru:'Хадж — раз в жизни',ar:'الحج — مرة في العمر',tr:'Hac — Ömürde bir kez'}, d:{az:'İmkanı olan hər müsəlman ömründə ən azı bir dəfə Məkkəyə Həcc ziyarəti etməlidir.',en:'Every able Muslim must perform Hajj pilgrimage to Mecca at least once in their lifetime.',ru:'Каждый способный мусульманин обязан совершить Хадж хотя бы раз в жизни.',ar:'يجب على كل مسلم مستطيع أداء الحج مرة واحدة في العمر',tr:'İmkânı olan her Müslüman ömründe en az bir kere Mekke\'ye Hac yapmalıdır.'} },
];

// ═══ GÜNDƏLİK HƏDİS ═══
const DAILY_HADITHS = [
  { ar:'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ', az:'Əməllər ancaq niyyətlərə görədir.', en:'Actions are judged by intentions.', ru:'Дела оцениваются по намерениям.', tr:'Ameller niyetlere göredir.', source:'Buxari 1' },
  { ar:'الدِّينُ النَّصِيحَةُ', az:'Din nəsihətdir.', en:'Religion is sincerity.', ru:'Религия — это искренность.', tr:'Din nasihattır.', source:'Muslim 55' },
  { ar:'أَلاَ بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', az:'Qəlblər ancaq Allahın zikri ilə rahatlıq tapar.', en:'Hearts find rest only in the remembrance of Allah.', ru:'Сердца успокаиваются поминанием Аллаха.', tr:'Kalpler ancak Allah\'ın zikriyle huzur bulur.', source:'Rad 28' },
  { ar:'خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ', az:'İnsanların ən xeyirlisi insanlara ən faydalı olanıdır.', en:'The best of people are those most beneficial to others.', ru:'Лучшие из людей — наиболее полезные.', tr:'İnsanların en hayırlısı insanlara en faydalı olanıdır.', source:'Taberani' },
  { ar:'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ', az:'Qardaşının üzünə gülümsəmən sədəqədir.', en:'Your smile to your brother is charity.', ru:'Улыбка брату — милостыня.', tr:'Kardeşinin yüzüne gülümsemen sadakadır.', source:'Tirmizi 1956' },
  { ar:'إِنَّ اللَّهَ جَمِيلٌ يُحِبُّ الْجَمَالَ', az:'Allah gözəldir, gözəlliyi sevir.', en:'Allah is beautiful and loves beauty.', ru:'Аллах красив и любит красоту.', tr:'Allah güzeldir, güzelliği sever.', source:'Muslim 91' },
  { ar:'طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ', az:'Elm öyrənmək hər müsəlmana fərzdir.', en:'Seeking knowledge is obligatory upon every Muslim.', ru:'Знание — обязанность каждого мусульманина.', tr:'İlim öğrenmek her Müslümana farzdır.', source:'İbn Macə 224' },
];

// ═══ GÜNDƏLİK DUA ═══
const DAILY_DUAS = [
  { ar:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', t:{az:'Rəbbimiz, bizə dünyada da, axirətdə də gözəllik ver və bizi cəhənnəm əzabından qoru.',en:'Our Lord, give us good in this world and in the Hereafter, and protect us from the fire.',ru:'Господь наш, даруй нам благо в этом мире и в будущем, и защити нас от огня.',ar:'ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار',tr:'Rabbimiz, bize dünyada da ahirette de iyilik ver ve bizi cehennem azabından koru.'}, ref:'Bəqərə 201' },
  { ar:'رَبِّ زِدْنِي عِلْماً', t:{az:'Rəbbim, elmimi artır.',en:'My Lord, increase me in knowledge.',ru:'Господи, приумножь мне знание.',ar:'رب زدني علماً',tr:'Rabbim, ilmimi artır.'}, ref:'Taha 114' },
  { ar:'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي', t:{az:'Rəbbim, köksümü aç və işimi asanlaşdır.',en:'My Lord, expand my chest and ease my task.',ru:'Господи, раскрой мне грудь и облегчи дело.',ar:'رب اشرح لي صدري ويسر لي أمري',tr:'Rabbim, göğsümü aç ve işimi kolaylaştır.'}, ref:'Taha 25-26' },
];

// ═══ ALLAHIN ADLARI ═══
const ALLAH_NAMES = [
  { ar:'ٱلرَّحْمَٰن', name:'Rəhman', en:'The Most Gracious', color:'#10b981' },
  { ar:'ٱلرَّحِيم', name:'Rəhim', en:'The Most Merciful', color:'#f59e0b' },
  { ar:'ٱلْمَلِك', name:'Malik', en:'The King', color:'#8b5cf6' },
  { ar:'ٱلْقُدُّوس', name:'Quddus', en:'The Most Pure', color:'#3b82f6' },
  { ar:'ٱلسَّلَٰم', name:'Salam', en:'The Source of Peace', color:'#ec4899' },
  { ar:'ٱلْعَزِيز', name:'Əziz', en:'The Almighty', color:'#f97316' },
  { ar:'ٱلْغَفُور', name:'Ğafur', en:'The Forgiving', color:'#14b8a6' },
  { ar:'ٱلْوَدُود', name:'Vadud', en:'The Loving', color:'#a855f7' },
  { ar:'ٱلْحَكِيم', name:'Həkim', en:'The Wise', color:'#6366f1' },
  { ar:'ٱلنُّور', name:'Nur', en:'The Light', color:'#fbbf24' },
  { ar:'ٱلتَّوَّاب', name:'Tövvab', en:'Repentance', color:'#84cc16' },
  { ar:'ٱلْمُؤْمِن', name:'Mümün', en:'Security', color:'#ef4444' },
];

function PressCard({ children, style, onPress }) {
  const { scale, onPressIn, onPressOut } = usePressAnimation();
  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const t = T[lang]?.home || T.az.home;
  const stats = STATS[lang] || STATS.az;
  const navLabels = NAV_L[lang] || NAV_L.az;
  const sh = dark ? Shadows.dark.sm : Shadows.sm;
  const shM = dark ? Shadows.dark.md : Shadows.md;

  const todayIdx = new Date().getDate() % DAILY_HADITHS.length;
  const duaIdx = new Date().getDate() % DAILY_DUAS.length;

  return (
    <ScrollView style={[st.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>

      {/* ══════════ HERO ══════════ */}
      <LinearGradient colors={dark?[c.ctaGradStart,c.ctaGradMid,c.ctaGradEnd]:[c.primaryDark,c.primary,c.primaryLight]} start={{x:0,y:0}} end={{x:1,y:1}} style={st.hero}>
        <FadeIn delay={100}><Text style={st.badge}>{t.badge}</Text></FadeIn>
        <FadeUp delay={200}><Text style={st.heroTitle}>{t.heroTitle}</Text></FadeUp>
        <FadeUp delay={350}><Text style={st.heroSub}>{t.heroSub}</Text></FadeUp>
        <FadeUp delay={500}>
          <View style={st.heroButtons}>
            <TouchableOpacity style={[st.heroBtnP,Shadows.button]} onPress={() => navigation.navigate('Quran')}>
              <AppIcon name="quran" size={18} color={c.primary} style={{marginRight:6}} />
              <Text style={[st.heroBtnPT,{color:c.primary}]}>{t.btnQuran}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.heroBtnS} onPress={() => navigation.navigate('Prayer')}>
              <AppIcon name="prayer" size={18} color="#fff" style={{marginRight:6}} />
              <Text style={st.heroBtnST}>{t.btnPrayer}</Text>
            </TouchableOpacity>
          </View>
        </FadeUp>
        <View style={st.heroCircle1} /><View style={st.heroCircle2} />
      </LinearGradient>

      {/* ══════════ GÜNÜN HƏDİSİ ══════════ */}
      <ScaleIn delay={300}>
        <View style={[st.dailyCard,{backgroundColor:c.card,borderColor:c.cardBorder},shM]}>
          <View style={st.dailyHeader}>
            <AppIcon name="hadith" size={20} color={c.gold} />
            <Text style={[st.dailyLabel,{color:c.gold}]}>{lang==='az'?'Günün Hədisi':lang==='ru'?'Хадис Дня':lang==='ar'?'حديث اليوم':lang==='tr'?'Günün Hadisi':'Hadith of the Day'}</Text>
          </View>
          <Text style={[st.dailyArabic,{color:c.text}]}>{DAILY_HADITHS[todayIdx].ar}</Text>
          <Text style={[st.dailyText,{color:c.textSecondary}]}>{DAILY_HADITHS[todayIdx][lang]||DAILY_HADITHS[todayIdx].en}</Text>
          <Text style={[st.dailySource,{color:c.textMuted}]}>— {DAILY_HADITHS[todayIdx].source}</Text>
        </View>
      </ScaleIn>

      {/* ══════════ AYƏ ══════════ */}
      <FadeUp delay={400}>
        <View style={[st.ayahCard,{backgroundColor:c.card,borderColor:c.cardBorder},sh]}>
          <Float><AppIcon name="crescent" size={32} color={c.gold} /></Float>
          <Text style={[st.ayahText,{color:c.text}]}>"{t.ayah}"</Text>
          <Text style={[st.ayahRef,{color:c.gold}]}>— {t.ayahRef}</Text>
        </View>
      </FadeUp>

      {/* ══════════ GÜNÜN DUASI ══════════ */}
      <FadeUp delay={450}>
        <View style={[st.duaCard,{backgroundColor:c.primaryBg,borderColor:c.primaryBorder}]}>
          <View style={st.duaHeader}>
            <AppIcon name="duas" size={20} color={c.primary} />
            <Text style={[st.duaLabel,{color:c.primary}]}>{lang==='az'?'Günün Duası':lang==='ru'?'Дуа Дня':lang==='ar'?'دعاء اليوم':lang==='tr'?'Günün Duası':'Dua of the Day'}</Text>
          </View>
          <Text style={[st.duaArabic,{color:c.text}]}>{DAILY_DUAS[duaIdx].ar}</Text>
          <Text style={[st.duaText,{color:c.textSecondary}]}>{DAILY_DUAS[duaIdx].t[lang]||DAILY_DUAS[duaIdx].t.en}</Text>
          <Text style={[st.duaRef,{color:c.primary}]}>— {DAILY_DUAS[duaIdx].ref}</Text>
        </View>
      </FadeUp>

      {/* ══════════ STATİSTİKA ══════════ */}
      <View style={st.sec}>
        <FadeUp><Text style={[st.secTitle,{color:c.text}]}>{t.statsTitle}</Text></FadeUp>
        <View style={st.statsGrid}>
          {stats.map((s,i) => (
            <FadeUp key={i} delay={200+i*80}>
              <View style={[st.statCard,{backgroundColor:c.card,borderColor:c.cardBorder},sh]}>
                <Text style={[st.statNum,{color:c.primary}]}>{s.n}</Text>
                <Text style={[st.statLabel,{color:c.textMuted}]}>{s.l}</Text>
              </View>
            </FadeUp>
          ))}
        </View>
      </View>

      {/* ══════════ QUICK LINKS ══════════ */}
      <View style={st.sec}>
        <FadeUp><Text style={[st.secTitle,{color:c.text}]}>{lang==='az'?'Sürətli Keçid':lang==='ru'?'Быстрые Ссылки':lang==='ar'?'روابط سريعة':lang==='tr'?'Hızlı Erişim':'Quick Access'}</Text></FadeUp>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.quickScroll}>
          {QUICK_LINKS.map((q,i) => (
            <FadeUp key={i} delay={100+i*50}>
              <PressCard style={[st.quickLink,{backgroundColor:c.card,borderColor:c.cardBorder},sh]} onPress={() => navigation.navigate(q.nav)}>
                <View style={[st.quickIconW,{backgroundColor:c.primaryBg}]}>
                  <AppIcon name={q.iconKey} size={22} color={c.primary} />
                </View>
                <Text style={[st.quickLabel,{color:c.text}]} numberOfLines={1}>{navLabels[q.label]}</Text>
              </PressCard>
            </FadeUp>
          ))}
        </ScrollView>
      </View>

      {/* ══════════ İSLAMIN 5 SÜTUNU ══════════ */}
      <View style={st.sec}>
        <FadeUp>
          <Text style={[st.secTitle,{color:c.text}]}>{lang==='az'?'İslamın 5 Sütunu':lang==='ru'?'5 Столпов Ислама':lang==='ar'?'أركان الإسلام الخمسة':lang==='tr'?'İslamın 5 Şartı':'5 Pillars of Islam'}</Text>
          <Text style={[st.secSub,{color:c.textSecondary}]}>{lang==='az'?'Hər müsəlmanın bilməli olduğu əsas ibadətlər':lang==='ru'?'Основные обязанности каждого мусульманина':lang==='ar'?'الأركان الأساسية لكل مسلم':lang==='tr'?'Her Müslümanın bilmesi gereken temel ibadetler':'The fundamental obligations every Muslim must know'}</Text>
        </FadeUp>
        {FIVE_PILLARS.map((p,i) => (
          <FadeUp key={i} delay={i*100}>
            <View style={[st.pillarCard,{backgroundColor:c.card,borderColor:c.cardBorder},sh]}>
              <View style={[st.pillarNumBadge,{backgroundColor:p.color+'18'}]}>
                <Text style={[st.pillarNum,{color:p.color}]}>{i+1}</Text>
              </View>
              <Text style={st.pillarIcon}>{p.icon}</Text>
              <Text style={[st.pillarTitle,{color:c.text}]}>{p.t[lang]||p.t.en}</Text>
              <Text style={[st.pillarDesc,{color:c.textSecondary}]}>{p.d[lang]||p.d.en}</Text>
            </View>
          </FadeUp>
        ))}
      </View>

      {/* ══════════ TÖVHİD ══════════ */}
      <View style={st.sec}>
        <FadeUp>
          <Text style={[st.secTitle,{color:c.text}]}>{lang==='az'?'Tövhid — Allahın Birliyinə İman':lang==='ru'?'Таухид — Вера в Единство Аллаха':lang==='ar'?'التوحيد — الإيمان بوحدانية الله':lang==='tr'?'Tevhid — Allah\'ın Birliğine İman':'Tawheed — Belief in the Oneness of Allah'}</Text>
          <Text style={[st.secSub,{color:c.textSecondary}]}>{lang==='az'?'İslamda tövhid üç əsas qismə bölünür':lang==='ru'?'В исламе таухид делится на три вида':lang==='ar'?'التوحيد في الإسلام ينقسم إلى ثلاثة أنواع':lang==='tr'?'İslam\'da tevhid üç temel kısma ayrılır':'Tawheed in Islam is divided into three essential categories'}</Text>
        </FadeUp>
        {TAWHEED.map((tw,i) => (
          <FadeUp key={i} delay={i*120}>
            <View style={[st.tawheedCard,{backgroundColor:c.card,borderColor:c.cardBorder,borderLeftColor:tw.color,borderLeftWidth:4},sh]}>
              <Text style={[st.twAr,{color:tw.color}]}>{tw.ar}</Text>
              <Text style={[st.twTitle,{color:c.text}]}>{tw.title[lang]||tw.title.en}</Text>
              <Text style={[st.twDesc,{color:c.textSecondary}]}>{tw.desc[lang]||tw.desc.en}</Text>
              <View style={[st.twAyahBox,{backgroundColor:tw.color+'10',borderColor:tw.color+'25'}]}>
                <Text style={[st.twAyah,{color:tw.color}]}>{tw.ayah}</Text>
                <Text style={[st.twAyahRef,{color:tw.color+'99'}]}>— {tw.ayahRef[lang]||tw.ayahRef.en}</Text>
              </View>
            </View>
          </FadeUp>
        ))}

        {/* Tövhid faktları */}
        <View style={{marginTop:16}}>
          {TAWHEED_FACTS.map((f,i) => (
            <FadeUp key={i} delay={i*80}>
              <View style={[st.factCard,{backgroundColor:c.surfaceAlt,borderColor:c.border}]}>
                <Text style={[st.factAr,{color:c.primary}]}>{f.ar}</Text>
                <Text style={[st.factText,{color:c.textSecondary}]}>{f.t[lang]||f.t.en}</Text>
              </View>
            </FadeUp>
          ))}
        </View>
      </View>

      {/* ══════════ ALLAHIN ADLARI ══════════ */}
      <View style={st.sec}>
        <FadeUp>
          <Text style={[st.secTitle,{color:c.text}]}>{lang==='az'?'Allahın Gözəl Adları':lang==='ru'?'Прекрасные Имена Аллаха':lang==='ar'?'أسماء الله الحسنى':lang==='tr'?'Allah\'ın Güzel İsimleri':'Beautiful Names of Allah'}</Text>
        </FadeUp>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12,paddingBottom:4}}>
          {ALLAH_NAMES.map((n,i) => (
            <FadeUp key={i} delay={i*50}>
              <TouchableOpacity style={[st.nameChip,{backgroundColor:n.color+'12',borderColor:n.color+'30'}]} onPress={() => navigation.navigate('Names')}>
                <Text style={[st.nameAr,{color:n.color}]}>{n.ar}</Text>
                <Text style={[st.nameTr,{color:c.textSecondary}]}>{n.name}</Text>
                <Text style={[st.nameEn,{color:c.textMuted}]}>{n.en}</Text>
              </TouchableOpacity>
            </FadeUp>
          ))}
        </ScrollView>
      </View>

      {/* ══════════ XÜSUSİYYƏTLƏR ══════════ */}
      <View style={st.sec}>
        <FadeUp>
          <Text style={[st.secTitle,{color:c.text}]}>{t.featTitle}</Text>
          <Text style={[st.secSub,{color:c.textSecondary}]}>{t.featSub}</Text>
        </FadeUp>
        {FEATURES.map((f,i) => (
          <FadeUp key={i} delay={i*80}>
            <PressCard style={[st.featureCard,{backgroundColor:c.card,borderColor:c.cardBorder},sh]} onPress={() => navigation.navigate(f.nav)}>
              <View style={[st.featureIconW,{backgroundColor:c.primaryBg}]}>
                <AppIcon name={f.iconKey} size={24} color={c.primary} />
              </View>
              <View style={{flex:1}}>
                <Text style={[st.featureTitle,{color:c.text}]}>{t[`${f.key}Title`]}</Text>
                <Text style={[st.featureDesc,{color:c.textSecondary}]}>{t[`${f.key}Desc`]}</Text>
              </View>
              <AppIcon name="chevronRight" size={20} color={c.textMuted} />
            </PressCard>
          </FadeUp>
        ))}
      </View>

      {/* ══════════ CTA ══════════ */}
      <FadeUp delay={200}>
        <LinearGradient colors={dark?[c.ctaGradStart,c.ctaGradMid,c.ctaGradEnd]:[c.primaryDark,c.primary,c.primaryLight]} start={{x:0,y:0}} end={{x:1,y:1}} style={[st.ctaCard,Shadows.button]}>
          <Text style={st.ctaTitle}>{t.ctaTitle}</Text>
          <Text style={st.ctaDesc}>{t.ctaDesc}</Text>
          <TouchableOpacity style={[st.ctaBtn,Shadows.button]} onPress={() => navigation.navigate('Quran')} activeOpacity={0.85}>
            <AppIcon name="quran" size={18} color={c.primary} style={{marginRight:6}} />
            <Text style={[st.ctaBtnText,{color:c.primary}]}>{t.ctaBtn}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </FadeUp>

      <View style={{height:60}} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container:{flex:1},

  // Hero
  hero:{paddingTop:28,paddingBottom:44,paddingHorizontal:24,alignItems:'center',overflow:'hidden',position:'relative'},
  badge:{fontSize:13,color:'rgba(255,255,255,0.75)',marginBottom:16,textAlign:'center'},
  heroTitle:{fontSize:28,fontWeight:'800',color:'#fff',textAlign:'center',marginBottom:12,letterSpacing:-0.5,lineHeight:36},
  heroSub:{fontSize:15,color:'rgba(255,255,255,0.85)',textAlign:'center',lineHeight:24,marginBottom:28,paddingHorizontal:8},
  heroButtons:{flexDirection:'row',gap:12},
  heroBtnP:{backgroundColor:'#fff',paddingHorizontal:22,paddingVertical:14,borderRadius:BorderRadius.md,flexDirection:'row',alignItems:'center'},
  heroBtnPT:{fontWeight:'700',fontSize:15},
  heroBtnS:{backgroundColor:'rgba(255,255,255,0.18)',paddingHorizontal:22,paddingVertical:14,borderRadius:BorderRadius.md,borderWidth:1,borderColor:'rgba(255,255,255,0.3)',flexDirection:'row',alignItems:'center'},
  heroBtnST:{color:'#fff',fontWeight:'600',fontSize:15},
  heroCircle1:{position:'absolute',width:250,height:250,borderRadius:125,backgroundColor:'rgba(255,255,255,0.04)',top:-80,right:-60},
  heroCircle2:{position:'absolute',width:180,height:180,borderRadius:90,backgroundColor:'rgba(255,255,255,0.03)',bottom:-50,left:-40},

  // Daily hadith
  dailyCard:{marginHorizontal:20,marginTop:-22,padding:24,borderRadius:BorderRadius.lg,borderWidth:1},
  dailyHeader:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:14},
  dailyLabel:{fontSize:12,fontWeight:'700',letterSpacing:0.5,textTransform:'uppercase'},
  dailyArabic:{fontSize:20,textAlign:'right',lineHeight:36,marginBottom:12,writingDirection:'rtl'},
  dailyText:{fontSize:15,lineHeight:24,marginBottom:10},
  dailySource:{fontSize:12,fontWeight:'600'},

  // Ayah
  ayahCard:{marginHorizontal:20,marginTop:20,padding:28,borderRadius:BorderRadius.lg,borderWidth:1,alignItems:'center'},
  ayahText:{fontSize:17,fontStyle:'italic',textAlign:'center',lineHeight:28,marginTop:12},
  ayahRef:{fontSize:13,marginTop:12,fontWeight:'700',letterSpacing:0.3},

  // Daily dua
  duaCard:{marginHorizontal:20,marginTop:20,padding:24,borderRadius:BorderRadius.lg,borderWidth:1.5},
  duaHeader:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:14},
  duaLabel:{fontSize:12,fontWeight:'700',letterSpacing:0.5,textTransform:'uppercase'},
  duaArabic:{fontSize:19,textAlign:'right',lineHeight:34,marginBottom:12,writingDirection:'rtl'},
  duaText:{fontSize:14,lineHeight:24,marginBottom:8},
  duaRef:{fontSize:12,fontWeight:'700'},

  // Section
  sec:{paddingHorizontal:20,marginTop:36},
  secTitle:{fontSize:22,fontWeight:'800',marginBottom:6,letterSpacing:-0.3},
  secSub:{fontSize:14,marginBottom:20,lineHeight:22},

  // Stats
  statsGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:16},
  statCard:{width:(SW-60-20)/3,paddingVertical:18,alignItems:'center',borderRadius:BorderRadius.md,borderWidth:1},
  statNum:{fontSize:22,fontWeight:'800'},
  statLabel:{fontSize:12,marginTop:4,fontWeight:'500'},

  // Quick links
  quickScroll:{paddingVertical:8,gap:12},
  quickLink:{width:86,paddingVertical:14,borderRadius:BorderRadius.md,borderWidth:1,alignItems:'center'},
  quickIconW:{width:42,height:42,borderRadius:21,alignItems:'center',justifyContent:'center',marginBottom:8},
  quickLabel:{fontSize:10,fontWeight:'600',textAlign:'center',paddingHorizontal:2},

  // 5 Pillars
  pillarCard:{padding:20,borderRadius:BorderRadius.lg,borderWidth:1,marginBottom:12,alignItems:'center'},
  pillarNumBadge:{width:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center',marginBottom:10},
  pillarNum:{fontSize:16,fontWeight:'800'},
  pillarIcon:{fontSize:36,marginBottom:10},
  pillarTitle:{fontSize:16,fontWeight:'700',textAlign:'center',marginBottom:8},
  pillarDesc:{fontSize:14,lineHeight:22,textAlign:'center'},

  // Tawheed
  tawheedCard:{padding:20,borderRadius:BorderRadius.lg,borderWidth:1,marginBottom:14},
  twAr:{fontSize:20,textAlign:'right',marginBottom:8,lineHeight:32},
  twTitle:{fontSize:17,fontWeight:'700',marginBottom:6},
  twDesc:{fontSize:14,lineHeight:23,marginBottom:14},
  twAyahBox:{padding:16,borderRadius:BorderRadius.md,borderWidth:1,alignItems:'center'},
  twAyah:{fontSize:17,textAlign:'center',lineHeight:30},
  twAyahRef:{fontSize:12,fontWeight:'600',marginTop:6},

  // Tawheed facts
  factCard:{padding:16,borderRadius:BorderRadius.md,borderWidth:1,marginBottom:8},
  factAr:{fontSize:17,textAlign:'right',marginBottom:6,lineHeight:28},
  factText:{fontSize:13,lineHeight:20},

  // Allah names
  nameChip:{paddingHorizontal:18,paddingVertical:14,borderRadius:BorderRadius.md,borderWidth:1.5,alignItems:'center',minWidth:90},
  nameAr:{fontSize:24,marginBottom:4},
  nameTr:{fontSize:12,fontWeight:'700',marginBottom:2},
  nameEn:{fontSize:10},

  // Features
  featureCard:{flexDirection:'row',alignItems:'center',padding:18,borderRadius:BorderRadius.lg,borderWidth:1,marginBottom:12},
  featureIconW:{width:50,height:50,borderRadius:BorderRadius.md,alignItems:'center',justifyContent:'center',marginRight:16},
  featureTitle:{fontSize:16,fontWeight:'700',marginBottom:4},
  featureDesc:{fontSize:13,lineHeight:20},

  // CTA
  ctaCard:{marginHorizontal:20,marginTop:36,padding:36,borderRadius:BorderRadius.xl,alignItems:'center'},
  ctaTitle:{fontSize:24,fontWeight:'800',color:'#fff',marginBottom:12},
  ctaDesc:{fontSize:15,color:'rgba(255,255,255,0.85)',textAlign:'center',marginBottom:28,lineHeight:24},
  ctaBtn:{backgroundColor:'#fff',paddingHorizontal:30,paddingVertical:16,borderRadius:BorderRadius.md,flexDirection:'row',alignItems:'center'},
  ctaBtnText:{fontWeight:'800',fontSize:15},
});
