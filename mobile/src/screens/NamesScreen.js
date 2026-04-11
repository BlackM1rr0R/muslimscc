import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn, Float } from '../components/Animated';

// 99 Ad — Məna, rəng
const NAMES = [
  {n:1,ar:'الرَّحْمَنُ',tr:'Ar-Rahman',az:'Mərhəmətli',en:'The Most Gracious',ru:'Милостивый',tur:'Rahman',color:'#10b981',desc:{az:'Bütün yaratdıqlarına sonsuz mərhəmət göstərən',en:'The One who shows endless mercy to all creation',ru:'Тот, кто проявляет бесконечную милость',ar:'الذي وسعت رحمته كل شيء',tr:'Yarattığı her şeye sınırsız merhamet gösteren'}},
  {n:2,ar:'الرَّحِيمُ',tr:'Ar-Rahim',az:'Rəhmli',en:'The Most Merciful',ru:'Милосердный',tur:'Rahim',color:'#f59e0b',desc:{az:'Möminlərə xüsusi rəhm edən',en:'Especially merciful to believers',ru:'Особенно милосердный к верующим',ar:'الذي يخص المؤمنين برحمته',tr:'Müminlere özel rahmet gösteren'}},
  {n:3,ar:'الْمَلِكُ',tr:'Al-Malik',az:'Hökmdar',en:'The King',ru:'Царь',tur:'Melik',color:'#8b5cf6',desc:{az:'Mülkün və hökmün sahibi',en:'The Sovereign Lord',ru:'Владыка всего сущего',ar:'مالك كل شيء والحاكم عليه',tr:'Mülkün ve hükmün sahibi'}},
  {n:4,ar:'الْقُدُّوسُ',tr:'Al-Quddus',az:'Pak olan',en:'The Most Holy',ru:'Святой',tur:'Kuddüs',color:'#3b82f6',desc:{az:'Hər cür nöqsandan uzaq',en:'Free from every imperfection',ru:'Свободный от всяких недостатков',ar:'المنزه عن كل نقص',tr:'Her türlü eksiklikten uzak'}},
  {n:5,ar:'السَّلَامُ',tr:'As-Salam',az:'Sülh verən',en:'The Source of Peace',ru:'Источник мира',tur:'Selam',color:'#ec4899',desc:{az:'Sülh və salamatlıq verən',en:'The Giver of peace and safety',ru:'Дающий мир и безопасность',ar:'واهب السلام والأمان',tr:'Barış ve selamet veren'}},
  {n:6,ar:'الْمُؤْمِنُ',tr:"Al-Mu'min",az:'İman verən',en:'The Granter of Security',ru:'Дарующий веру',tur:'Mümin',color:'#ef4444'},
  {n:7,ar:'الْمُهَيْمِنُ',tr:'Al-Muhaymin',az:'Qoruyan',en:'The Protector',ru:'Хранитель',tur:'Müheymin',color:'#f97316'},
  {n:8,ar:'الْعَزِيزُ',tr:'Al-Aziz',az:'Qüdrətli',en:'The Almighty',ru:'Могущественный',tur:'Aziz',color:'#14b8a6'},
  {n:9,ar:'الْجَبَّارُ',tr:'Al-Jabbar',az:'Qadir',en:'The Compeller',ru:'Могучий',tur:'Cebbar',color:'#a855f7'},
  {n:10,ar:'الْمُتَكَبِّرُ',tr:'Al-Mutakabbir',az:'Uca',en:'The Greatest',ru:'Величайший',tur:'Mütekebbir',color:'#6366f1'},
  {n:11,ar:'الْخَالِقُ',tr:'Al-Khaliq',az:'Yaradan',en:'The Creator',ru:'Творец',tur:'Halık',color:'#84cc16'},
  {n:12,ar:'الْبَارِئُ',tr:'Al-Bari',az:'Formalaşdıran',en:'The Maker',ru:'Создатель',tur:'Bari',color:'#fbbf24'},
  {n:13,ar:'الْمُصَوِّرُ',tr:'Al-Musawwir',az:'Şəkil verən',en:'The Fashioner',ru:'Формирующий',tur:'Musavvir',color:'#06b6d4'},
  {n:14,ar:'الْغَفَّارُ',tr:'Al-Ghaffar',az:'Çox bağışlayan',en:'The Forgiver',ru:'Прощающий',tur:'Gaffar',color:'#10b981'},
  {n:15,ar:'الْقَهَّارُ',tr:'Al-Qahhar',az:'Qalib gələn',en:'The Subduer',ru:'Покоритель',tur:'Kahhar',color:'#f59e0b'},
  {n:16,ar:'الْوَهَّابُ',tr:'Al-Wahhab',az:'Bəxş edən',en:'The Bestower',ru:'Дарующий',tur:'Vehhab',color:'#8b5cf6'},
  {n:17,ar:'الرَّزَّاقُ',tr:'Ar-Razzaq',az:'Ruzi verən',en:'The Provider',ru:'Дающий пропитание',tur:'Rezzak',color:'#3b82f6'},
  {n:18,ar:'الْفَتَّاحُ',tr:'Al-Fattah',az:'Açan',en:'The Opener',ru:'Открывающий',tur:'Fettah',color:'#ec4899'},
  {n:19,ar:'الْعَلِيمُ',tr:'Al-Alim',az:'Hər şeyi bilən',en:'The All-Knowing',ru:'Всезнающий',tur:'Alim',color:'#ef4444'},
  {n:20,ar:'الْقَابِضُ',tr:'Al-Qabid',az:'Daraldan',en:'The Constrictor',ru:'Сжимающий',tur:'Kabız',color:'#f97316'},
  {n:21,ar:'الْبَاسِطُ',tr:'Al-Basit',az:'Genişlədən',en:'The Expander',ru:'Расширяющий',tur:'Basıt',color:'#14b8a6'},
  {n:22,ar:'الْخَافِضُ',tr:'Al-Khafid',az:'Alçaldan',en:'The Abaser',ru:'Унижающий',tur:'Hafıd',color:'#a855f7'},
  {n:23,ar:'الرَّافِعُ',tr:'Ar-Rafi',az:'Yüksəldən',en:'The Exalter',ru:'Возвышающий',tur:'Rafi',color:'#6366f1'},
  {n:24,ar:'الْمُعِزُّ',tr:"Al-Mu'izz",az:'İzzət verən',en:'The Honourer',ru:'Дающий честь',tur:'Muiz',color:'#84cc16'},
  {n:25,ar:'الْمُذِلُّ',tr:'Al-Mudhill',az:'Zəlil edən',en:'The Dishonourer',ru:'Унижающий',tur:'Müzill',color:'#fbbf24'},
  {n:26,ar:'السَّمِيعُ',tr:'As-Sami',az:'Eşidən',en:'The All-Hearing',ru:'Слышащий',tur:'Semi',color:'#06b6d4'},
  {n:27,ar:'الْبَصِيرُ',tr:'Al-Basir',az:'Görən',en:'The All-Seeing',ru:'Видящий',tur:'Basir',color:'#10b981'},
  {n:28,ar:'الْحَكَمُ',tr:'Al-Hakam',az:'Hökm edən',en:'The Judge',ru:'Судья',tur:'Hakem',color:'#f59e0b'},
  {n:29,ar:'الْعَدْلُ',tr:'Al-Adl',az:'Ədalətli',en:'The Just',ru:'Справедливый',tur:'Adl',color:'#8b5cf6'},
  {n:30,ar:'اللَّطِيفُ',tr:'Al-Latif',az:'Lütfkar',en:'The Subtle',ru:'Мягкий',tur:'Latif',color:'#3b82f6'},
  {n:31,ar:'الْخَبِيرُ',tr:'Al-Khabir',az:'Xəbərdar',en:'The All-Aware',ru:'Осведомлённый',tur:'Habir',color:'#ec4899'},
  {n:32,ar:'الْحَلِيمُ',tr:'Al-Halim',az:'Həlim',en:'The Forbearing',ru:'Кроткий',tur:'Halim',color:'#ef4444'},
  {n:33,ar:'الْعَظِيمُ',tr:'Al-Azim',az:'Əzəmətli',en:'The Magnificent',ru:'Великий',tur:'Azim',color:'#f97316'},
  {n:34,ar:'الْغَفُورُ',tr:'Al-Ghafur',az:'Bağışlayan',en:'The All-Forgiving',ru:'Всепрощающий',tur:'Gafur',color:'#14b8a6'},
  {n:35,ar:'الشَّكُورُ',tr:'Ash-Shakur',az:'Şükür edən',en:'The Appreciative',ru:'Благодарный',tur:'Şekur',color:'#a855f7'},
  {n:36,ar:'الْعَلِيُّ',tr:'Al-Ali',az:'Uca',en:'The Most High',ru:'Высочайший',tur:'Ali',color:'#6366f1'},
  {n:37,ar:'الْكَبِيرُ',tr:'Al-Kabir',az:'Böyük',en:'The Greatest',ru:'Великий',tur:'Kebir',color:'#84cc16'},
  {n:38,ar:'الْحَفِيظُ',tr:'Al-Hafiz',az:'Qoruyan',en:'The Preserver',ru:'Хранитель',tur:'Hafız',color:'#fbbf24'},
  {n:39,ar:'الْمُقِيتُ',tr:'Al-Muqit',az:'Bəsləyən',en:'The Nourisher',ru:'Питающий',tur:'Mukit',color:'#06b6d4'},
  {n:40,ar:'الْحَسِيبُ',tr:'Al-Hasib',az:'Hesab aparan',en:'The Reckoner',ru:'Считающий',tur:'Hasib',color:'#10b981'},
  {n:41,ar:'الْجَلِيلُ',tr:'Al-Jalil',az:'Ulu',en:'The Majestic',ru:'Величественный',tur:'Celil',color:'#f59e0b'},
  {n:42,ar:'الْكَرِيمُ',tr:'Al-Karim',az:'Kərim',en:'The Generous',ru:'Щедрый',tur:'Kerim',color:'#8b5cf6'},
  {n:43,ar:'الرَّقِيبُ',tr:'Ar-Raqib',az:'Nəzarət edən',en:'The Watchful',ru:'Наблюдающий',tur:'Rakib',color:'#3b82f6'},
  {n:44,ar:'الْمُجِيبُ',tr:'Al-Mujib',az:'Qəbul edən',en:'The Responsive',ru:'Отвечающий',tur:'Mücib',color:'#ec4899'},
  {n:45,ar:'الْوَاسِعُ',tr:'Al-Wasi',az:'Geniş',en:'The All-Encompassing',ru:'Объемлющий',tur:'Vasi',color:'#ef4444'},
  {n:46,ar:'الْحَكِيمُ',tr:'Al-Hakim',az:'Hikmətli',en:'The Wise',ru:'Мудрый',tur:'Hakim',color:'#f97316'},
  {n:47,ar:'الْوَدُودُ',tr:'Al-Wadud',az:'Sevən',en:'The Loving',ru:'Любящий',tur:'Vedud',color:'#14b8a6'},
  {n:48,ar:'الْمَجِيدُ',tr:'Al-Majid',az:'Şanlı',en:'The Glorious',ru:'Славный',tur:'Mecid',color:'#a855f7'},
  {n:49,ar:'الْبَاعِثُ',tr:"Al-Ba'ith",az:'Dirildən',en:'The Resurrector',ru:'Воскрешающий',tur:'Bais',color:'#6366f1'},
  {n:50,ar:'الشَّهِيدُ',tr:'Ash-Shahid',az:'Şahid',en:'The Witness',ru:'Свидетель',tur:'Şehid',color:'#84cc16'},
  {n:51,ar:'الْحَقُّ',tr:'Al-Haqq',az:'Haqq',en:'The Truth',ru:'Истина',tur:'Hak',color:'#fbbf24'},
  {n:52,ar:'الْوَكِيلُ',tr:'Al-Wakil',az:'Vəkil',en:'The Trustee',ru:'Доверенный',tur:'Vekil',color:'#06b6d4'},
  {n:53,ar:'الْقَوِيُّ',tr:'Al-Qawiy',az:'Güclü',en:'The Strong',ru:'Сильный',tur:'Kavi',color:'#10b981'},
  {n:54,ar:'الْمَتِينُ',tr:'Al-Matin',az:'Möhkəm',en:'The Firm',ru:'Прочный',tur:'Metin',color:'#f59e0b'},
  {n:55,ar:'الْوَلِيُّ',tr:'Al-Waliy',az:'Dost',en:'The Protecting Friend',ru:'Покровитель',tur:'Veli',color:'#8b5cf6'},
  {n:56,ar:'الْحَمِيدُ',tr:'Al-Hamid',az:'Həmd olunan',en:'The Praiseworthy',ru:'Достохвальный',tur:'Hamid',color:'#3b82f6'},
  {n:57,ar:'الْمُحْصِي',tr:'Al-Muhsi',az:'Sayan',en:'The Counter',ru:'Считающий',tur:'Muhsi',color:'#ec4899'},
  {n:58,ar:'الْمُبْدِئُ',tr:'Al-Mubdi',az:'Başladan',en:'The Originator',ru:'Начинающий',tur:'Mübdi',color:'#ef4444'},
  {n:59,ar:'الْمُعِيدُ',tr:"Al-Mu'id",az:'Geri qaytaran',en:'The Restorer',ru:'Возвращающий',tur:'Muid',color:'#f97316'},
  {n:60,ar:'الْمُحْيِي',tr:'Al-Muhyi',az:'Həyat verən',en:'The Giver of Life',ru:'Оживляющий',tur:'Muhyi',color:'#14b8a6'},
  {n:61,ar:'الْمُمِيتُ',tr:'Al-Mumit',az:'Ölüm verən',en:'The Taker of Life',ru:'Умертвляющий',tur:'Mümit',color:'#a855f7'},
  {n:62,ar:'الْحَيُّ',tr:'Al-Hayy',az:'Diri',en:'The Ever Living',ru:'Живой',tur:'Hay',color:'#6366f1'},
  {n:63,ar:'الْقَيُّومُ',tr:'Al-Qayyum',az:'Əbədi',en:'The Self-Subsisting',ru:'Самодостаточный',tur:'Kayyum',color:'#84cc16'},
  {n:64,ar:'الْوَاجِدُ',tr:'Al-Wajid',az:'Tapan',en:'The Finder',ru:'Находящий',tur:'Vacid',color:'#fbbf24'},
  {n:65,ar:'الْمَاجِدُ',tr:'Al-Majid',az:'Şərəfli',en:'The Noble',ru:'Благородный',tur:'Macid',color:'#06b6d4'},
  {n:66,ar:'الْوَاحِدُ',tr:'Al-Wahid',az:'Tək',en:'The One',ru:'Единый',tur:'Vahid',color:'#10b981'},
  {n:67,ar:'الصَّمَدُ',tr:'As-Samad',az:'Ehtiyacsız',en:'The Eternal',ru:'Вечный',tur:'Samed',color:'#f59e0b'},
  {n:68,ar:'الْقَادِرُ',tr:'Al-Qadir',az:'Qadir',en:'The Able',ru:'Способный',tur:'Kadir',color:'#8b5cf6'},
  {n:69,ar:'الْمُقْتَدِرُ',tr:'Al-Muqtadir',az:'Hər şeyə qadir',en:'The Powerful',ru:'Могущественный',tur:'Muktedir',color:'#3b82f6'},
  {n:70,ar:'الْمُقَدِّمُ',tr:'Al-Muqaddim',az:'Öndə tutan',en:'The Expediter',ru:'Выдвигающий',tur:'Mukaddim',color:'#ec4899'},
  {n:71,ar:'الْمُؤَخِّرُ',tr:"Al-Mu'akhkhir",az:'Geri saxlayan',en:'The Delayer',ru:'Откладывающий',tur:'Muahhir',color:'#ef4444'},
  {n:72,ar:'الْأَوَّلُ',tr:'Al-Awwal',az:'İlk',en:'The First',ru:'Первый',tur:'Evvel',color:'#f97316'},
  {n:73,ar:'الْآخِرُ',tr:'Al-Akhir',az:'Son',en:'The Last',ru:'Последний',tur:'Ahir',color:'#14b8a6'},
  {n:74,ar:'الظَّاهِرُ',tr:'Az-Zahir',az:'Zahir',en:'The Manifest',ru:'Явный',tur:'Zahir',color:'#a855f7'},
  {n:75,ar:'الْبَاطِنُ',tr:'Al-Batin',az:'Gizli',en:'The Hidden',ru:'Скрытый',tur:'Batın',color:'#6366f1'},
  {n:76,ar:'الْوَالِي',tr:'Al-Wali',az:'İdarə edən',en:'The Governor',ru:'Правитель',tur:'Vali',color:'#84cc16'},
  {n:77,ar:'الْمُتَعَالِي',tr:"Al-Muta'ali",az:'Yüksək',en:'The Most Exalted',ru:'Превознесённый',tur:'Müteali',color:'#fbbf24'},
  {n:78,ar:'الْبَرُّ',tr:'Al-Barr',az:'Yaxşılıq edən',en:'The Doer of Good',ru:'Благодетель',tur:'Berr',color:'#06b6d4'},
  {n:79,ar:'التَّوَّابُ',tr:'At-Tawwab',az:'Tövbə qəbul edən',en:'The Acceptor of Repentance',ru:'Принимающий покаяние',tur:'Tevvab',color:'#10b981'},
  {n:80,ar:'الْمُنْتَقِمُ',tr:'Al-Muntaqim',az:'İntiqam alan',en:'The Avenger',ru:'Мститель',tur:'Müntakim',color:'#f59e0b'},
  {n:81,ar:'الْعَفُوُّ',tr:'Al-Afuw',az:'Əfv edən',en:'The Pardoner',ru:'Прощающий',tur:'Afüv',color:'#8b5cf6'},
  {n:82,ar:'الرَّءُوفُ',tr:"Ar-Ra'uf",az:'Şəfqətli',en:'The Compassionate',ru:'Сострадательный',tur:'Rauf',color:'#3b82f6'},
  {n:83,ar:'مَالِكُ الْمُلْكِ',tr:'Malik al-Mulk',az:'Mülkün sahibi',en:'Owner of Sovereignty',ru:'Владыка царства',tur:'Malikül Mülk',color:'#ec4899'},
  {n:84,ar:'ذُو الْجَلَالِ وَالْإِكْرَامِ',tr:'Dhul-Jalali wal-Ikram',az:'Əzəmət sahibi',en:'Lord of Majesty',ru:'Обладатель величия',tur:'Zülcelali vel İkram',color:'#ef4444'},
  {n:85,ar:'الْمُقْسِطُ',tr:'Al-Muqsit',az:'Ədalətlə hökm',en:'The Equitable',ru:'Справедливый',tur:'Muksit',color:'#f97316'},
  {n:86,ar:'الْجَامِعُ',tr:'Al-Jami',az:'Toplayan',en:'The Gatherer',ru:'Собирающий',tur:'Cami',color:'#14b8a6'},
  {n:87,ar:'الْغَنِيُّ',tr:'Al-Ghani',az:'Ehtiyacsız',en:'The Self-Sufficient',ru:'Богатый',tur:'Gani',color:'#a855f7'},
  {n:88,ar:'الْمُغْنِي',tr:'Al-Mughni',az:'Zəngin edən',en:'The Enricher',ru:'Обогащающий',tur:'Muğni',color:'#6366f1'},
  {n:89,ar:'الْمَانِعُ',tr:'Al-Mani',az:'Mane olan',en:'The Preventer',ru:'Удерживающий',tur:'Mani',color:'#84cc16'},
  {n:90,ar:'الضَّارُّ',tr:'Ad-Darr',az:'Zərər verən',en:'The Distresser',ru:'Причиняющий',tur:'Darr',color:'#fbbf24'},
  {n:91,ar:'النَّافِعُ',tr:'An-Nafi',az:'Fayda verən',en:'The Benefiter',ru:'Приносящий пользу',tur:'Nafi',color:'#06b6d4'},
  {n:92,ar:'النُّورُ',tr:'An-Nur',az:'Nur',en:'The Light',ru:'Свет',tur:'Nur',color:'#10b981'},
  {n:93,ar:'الْهَادِي',tr:'Al-Hadi',az:'Hidayət edən',en:'The Guide',ru:'Ведущий',tur:'Hadi',color:'#f59e0b'},
  {n:94,ar:'الْبَدِيعُ',tr:'Al-Badi',az:'Yaradan',en:'The Incomparable',ru:'Создатель',tur:'Bedi',color:'#8b5cf6'},
  {n:95,ar:'الْبَاقِي',tr:'Al-Baqi',az:'Əbədi',en:'The Everlasting',ru:'Вечный',tur:'Baki',color:'#3b82f6'},
  {n:96,ar:'الْوَارِثُ',tr:'Al-Warith',az:'Varis',en:'The Inheritor',ru:'Наследник',tur:'Varis',color:'#ec4899'},
  {n:97,ar:'الرَّشِيدُ',tr:'Ar-Rashid',az:'Doğru yola',en:'The Guide to Right',ru:'Направляющий',tur:'Reşid',color:'#ef4444'},
  {n:98,ar:'الصَّبُورُ',tr:'As-Sabur',az:'Çox səbirli',en:'The Patient',ru:'Терпеливый',tur:'Sabur',color:'#f97316'},
  {n:99,ar:'اللَّهُ',tr:'Allah',az:'Allah',en:'Allah',ru:'Аллах',tur:'Allah',color:'#d4a017'},
];

export default function NamesScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const t = T[lang]?.names || T.az.names;
  const sh = dark ? Shadows.dark.sm : Shadows.sm;

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const getMeaning = (name) => {
    const map = { az: name.az, en: name.en, ru: name.ru, ar: name.ar, tr: name.tur };
    return map[lang] || name.en;
  };

  const filtered = useMemo(() => {
    if (!search) return NAMES;
    const q = search.toLowerCase();
    return NAMES.filter(n => n.ar.includes(search) || n.tr.toLowerCase().includes(q) || n.en.toLowerCase().includes(q) || (n.az && n.az.toLowerCase().includes(q)));
  }, [search]);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="أَسْمَاءُ اللَّهِ الْحُسْنَى" title={t.title} subtitle={t.subtitle} />

      <View style={styles.content}>

        {/* Hadith quote card */}
        <FadeUp delay={100}>
          <LinearGradient
            colors={dark ? [c.goldBg, 'transparent'] : ['#fef3c7', '#fef9e7']}
            style={[styles.hadithCard, { borderColor: c.gold + '40' }, sh]}
          >
            <Float distance={4}>
              <AppIcon name="star" size={28} color={c.gold} />
            </Float>
            <Text style={[styles.hadithText, { color: c.text }]}>"{t.hadith}"</Text>
            <View style={[styles.hadithRefBadge, { backgroundColor: c.gold + '25' }]}>
              <Text style={[styles.hadithRef, { color: c.goldDark || c.gold }]}>— {t.hadithRef}</Text>
            </View>
          </LinearGradient>
        </FadeUp>

        {/* Search */}
        <FadeUp delay={200}>
          <View style={[styles.searchBar, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
            <View style={[styles.searchIconWrap, { backgroundColor: c.primaryBg }]}>
              <AppIcon name="search" size={16} color={c.primary} />
            </View>
            <TextInput
              style={[styles.searchInput, { color: c.text }]}
              placeholder={t.searchPh}
              placeholderTextColor={c.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <AppIcon name="close" size={18} color={c.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </FadeUp>

        {/* Grid */}
        <FlatList
          data={filtered}
          keyExtractor={n => String(n.n)}
          numColumns={2}
          columnWrapperStyle={{ gap: 10 }}
          renderItem={({ item: n, index: i }) => (
            <FadeUp delay={Math.min(i * 30, 300)} style={{ flex: 1 }}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelected(n);
                }}
                activeOpacity={0.85}
                style={{ flex: 1 }}
              >
                <View style={[styles.nameCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
                  <LinearGradient
                    colors={[n.color + '15', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <View style={[styles.nameNumBadge, { backgroundColor: n.color }]}>
                    <Text style={styles.nameNumText}>{n.n}</Text>
                  </View>
                  <Text style={[styles.nameArabic, { color: n.color }]}>{n.ar}</Text>
                  <Text style={[styles.nameTranslit, { color: c.text }]}>{n.tr}</Text>
                  <Text style={[styles.nameMeaning, { color: c.textMuted }]} numberOfLines={1}>{getMeaning(n)}</Text>
                </View>
              </TouchableOpacity>
            </FadeUp>
          )}
          contentContainerStyle={{ paddingBottom: 40, gap: 10 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* ═══ DETAIL MODAL ═══ */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        {selected && (
          <View style={styles.modalWrap}>
            <TouchableOpacity style={styles.modalBackdrop} onPress={() => setSelected(null)} activeOpacity={1} />
            <View style={[styles.modalCard, { backgroundColor: c.background }]}>
              <View style={[styles.modalHandle, { backgroundColor: c.border }]} />

              <LinearGradient
                colors={[selected.color, selected.color + 'cc']}
                style={styles.modalHeader}
              >
                <View style={styles.modalNumWrap}>
                  <Text style={styles.modalNum}>{selected.n}</Text>
                </View>
                <Text style={styles.modalArabic}>{selected.ar}</Text>
                <Text style={styles.modalTranslit}>{selected.tr}</Text>
                <View style={styles.modalCircle1} />
                <View style={styles.modalCircle2} />
              </LinearGradient>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={[styles.meaningBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                  <Text style={[styles.meaningLabel, { color: selected.color }]}>
                    {lang==='az'?'MƏNA':lang==='ru'?'ЗНАЧЕНИЕ':lang==='ar'?'المعنى':lang==='tr'?'ANLAM':'MEANING'}
                  </Text>
                  <Text style={[styles.meaningValue, { color: c.text }]}>{getMeaning(selected)}</Text>
                </View>

                {selected.desc && (
                  <View style={[styles.descBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                    <Text style={[styles.descLabel, { color: selected.color }]}>
                      {lang==='az'?'İZAH':lang==='ru'?'ОПИСАНИЕ':lang==='ar'?'الوصف':lang==='tr'?'AÇIKLAMA':'DESCRIPTION'}
                    </Text>
                    <Text style={[styles.descText, { color: c.textSecondary }]}>
                      {selected.desc[lang] || selected.desc.en || ''}
                    </Text>
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: selected.color }, Shadows.button]}
                onPress={() => setSelected(null)}
                activeOpacity={0.85}
              >
                <AppIcon name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },

  // Hadith card
  hadithCard: {
    padding: 20,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 14,
  },
  hadithText: { fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22, marginVertical: 10 },
  hadithRefBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: BorderRadius.full },
  hadithRef: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },

  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 14, borderRadius: BorderRadius.lg, borderWidth: 1, height: 52, marginBottom: 14 },
  searchIconWrap: { width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, height: 52, fontWeight: '500' },

  // Name card
  nameCard: {
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 140,
  },
  nameNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  nameNumText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  nameArabic: { fontSize: 26, marginBottom: 6, fontWeight: '500' },
  nameTranslit: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  nameMeaning: { fontSize: 11, textAlign: 'center', fontWeight: '600' },

  // Modal
  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: {
    maxHeight: '85%',
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    overflow: 'hidden',
  },
  modalHandle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  modalHeader: {
    padding: 40,
    paddingTop: 32,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  modalNumWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  modalNum: { fontSize: 20, fontWeight: '800', color: '#fff' },
  modalArabic: { fontSize: 44, color: '#fff', marginBottom: 12, fontWeight: '500' },
  modalTranslit: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  modalCircle1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.08)', top: -70, right: -60 },
  modalCircle2: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.06)', bottom: -50, left: -40 },

  modalBody: { padding: 20, paddingBottom: 100 },
  meaningBox: { padding: 18, borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: 14 },
  meaningLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  meaningValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  descBox: { padding: 18, borderRadius: BorderRadius.lg, borderWidth: 1 },
  descLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  descText: { fontSize: 15, lineHeight: 24, fontWeight: '500' },

  modalCloseBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
