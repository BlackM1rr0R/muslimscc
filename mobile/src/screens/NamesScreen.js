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
// "translit" — latın transliterasiyası (Ar-Rahman), hər dildə adın altında göstərilir.
// Türkcə məna "tr_meaning"-dədir (veb src/data/names99.js ilə eyni).
const NAMES = [
  {n:1,ar:'الرَّحْمَنُ',translit:'Ar-Rahman',az:'Mərhəmətli',en:'The Most Gracious',ru:'Милостивый',tr_meaning:'Rahmân (Çok Merhametli)',color:'#10b981',desc:{az:'Bütün yaratdıqlarına sonsuz mərhəmət göstərən',en:'The One who shows endless mercy to all creation',ru:'Тот, кто проявляет бесконечную милость',ar:'الذي وسعت رحمته كل شيء',tr:'Yarattığı her şeye sınırsız merhamet gösteren'}},
  {n:2,ar:'الرَّحِيمُ',translit:'Ar-Rahim',az:'Rəhmli',en:'The Most Merciful',ru:'Милосердный',tr_meaning:'Rahîm (Çok Esirgeyen)',color:'#f59e0b',desc:{az:'Möminlərə xüsusi rəhm edən',en:'Especially merciful to believers',ru:'Особенно милосердный к верующим',ar:'الذي يخص المؤمنين برحمته',tr:'Müminlere özel rahmet gösteren'}},
  {n:3,ar:'الْمَلِكُ',translit:'Al-Malik',az:'Hökmdar',en:'The King',ru:'Царь',tr_meaning:'Melik (Mülkün Sahibi, Hükümdar)',color:'#8b5cf6',desc:{az:'Mülkün və hökmün sahibi',en:'The Sovereign Lord',ru:'Владыка всего сущего',ar:'مالك كل شيء والحاكم عليه',tr:'Mülkün ve hükmün sahibi'}},
  {n:4,ar:'الْقُدُّوسُ',translit:'Al-Quddus',az:'Pak olan',en:'The Most Holy',ru:'Святой',tr_meaning:'Kuddûs (Her Eksiklikten Uzak)',color:'#3b82f6',desc:{az:'Hər cür nöqsandan uzaq',en:'Free from every imperfection',ru:'Свободный от всяких недостатков',ar:'المنزه عن كل نقص',tr:'Her türlü eksiklikten uzak'}},
  {n:5,ar:'السَّلَامُ',translit:'As-Salam',az:'Sülh verən',en:'The Source of Peace',ru:'Источник мира',tr_meaning:'Selâm (Esenlik Veren)',color:'#ec4899',desc:{az:'Sülh və salamatlıq verən',en:'The Giver of peace and safety',ru:'Дающий мир и безопасность',ar:'واهب السلام والأمان',tr:'Barış ve selamet veren'}},
  {n:6,ar:'الْمُؤْمِنُ',translit:"Al-Mu'min",az:'İman verən',en:'The Granter of Security',ru:'Дарующий веру',tr_meaning:'Mü\'min (Güven Veren)',color:'#ef4444'},
  {n:7,ar:'الْمُهَيْمِنُ',translit:'Al-Muhaymin',az:'Qoruyan',en:'The Protector',ru:'Хранитель',tr_meaning:'Müheymin (Gözetip Koruyan)',color:'#f97316'},
  {n:8,ar:'الْعَزِيزُ',translit:'Al-Aziz',az:'Qüdrətli',en:'The Almighty',ru:'Могущественный',tr_meaning:'Azîz (Mağlup Edilmeyen, Üstün)',color:'#14b8a6'},
  {n:9,ar:'الْجَبَّارُ',translit:'Al-Jabbar',az:'Hər şeyə gücü çatan',en:'The Compeller',ru:'Могучий',tr_meaning:'Cebbâr (Dilediğini Yaptıran)',color:'#a855f7'},
  {n:10,ar:'الْمُتَكَبِّرُ',translit:'Al-Mutakabbir',az:'Uca',en:'The Greatest',ru:'Величайший',tr_meaning:'Mütekebbir (Büyüklükte Eşsiz)',color:'#6366f1'},
  {n:11,ar:'الْخَالِقُ',translit:'Al-Khaliq',az:'Yaradan',en:'The Creator',ru:'Творец',tr_meaning:'Hâlık (Yaratan)',color:'#84cc16'},
  {n:12,ar:'الْبَارِئُ',translit:'Al-Bari',az:'Formalaşdıran',en:'The Maker',ru:'Создатель',tr_meaning:'Bâri (Kusursuz Yaratan)',color:'#fbbf24'},
  {n:13,ar:'الْمُصَوِّرُ',translit:'Al-Musawwir',az:'Şəkil verən',en:'The Fashioner',ru:'Формирующий',tr_meaning:'Musavvir (Şekil Veren)',color:'#06b6d4'},
  {n:14,ar:'الْغَفَّارُ',translit:'Al-Ghaffar',az:'Çox bağışlayan',en:'The Forgiver',ru:'Прощающий',tr_meaning:'Gaffâr (Çok Bağışlayan)',color:'#10b981'},
  {n:15,ar:'الْقَهَّارُ',translit:'Al-Qahhar',az:'Qalib gələn',en:'The Subduer',ru:'Покоритель',tr_meaning:'Kahhâr (Her Şeye Galip Gelen)',color:'#f59e0b'},
  {n:16,ar:'الْوَهَّابُ',translit:'Al-Wahhab',az:'Bəxş edən',en:'The Bestower',ru:'Дарующий',tr_meaning:'Vehhâb (Karşılıksız Veren)',color:'#8b5cf6'},
  {n:17,ar:'الرَّزَّاقُ',translit:'Ar-Razzaq',az:'Ruzi verən',en:'The Provider',ru:'Дающий пропитание',tr_meaning:'Rezzâk (Rızık Veren)',color:'#3b82f6'},
  {n:18,ar:'الْفَتَّاحُ',translit:'Al-Fattah',az:'Açan',en:'The Opener',ru:'Открывающий',tr_meaning:'Fettâh (Açan)',color:'#ec4899'},
  {n:19,ar:'الْعَلِيمُ',translit:'Al-Alim',az:'Hər şeyi bilən',en:'The All-Knowing',ru:'Всезнающий',tr_meaning:'Alîm (Her Şeyi Bilen)',color:'#ef4444'},
  {n:20,ar:'الْقَابِضُ',translit:'Al-Qabid',az:'Daraldan',en:'The Constrictor',ru:'Сжимающий',tr_meaning:'Kâbız (Daraltan)',color:'#f97316'},
  {n:21,ar:'الْبَاسِطُ',translit:'Al-Basit',az:'Genişlədən',en:'The Expander',ru:'Расширяющий',tr_meaning:'Bâsıt (Genişleten)',color:'#14b8a6'},
  {n:22,ar:'الْخَافِضُ',translit:'Al-Khafid',az:'Alçaldan',en:'The Abaser',ru:'Унижающий',tr_meaning:'Hâfıd (Alçaltan)',color:'#a855f7'},
  {n:23,ar:'الرَّافِعُ',translit:'Ar-Rafi',az:'Yüksəldən',en:'The Exalter',ru:'Возвышающий',tr_meaning:'Râfi (Yükselten)',color:'#6366f1'},
  {n:24,ar:'الْمُعِزُّ',translit:"Al-Mu'izz",az:'İzzət verən',en:'The Honourer',ru:'Дающий честь',tr_meaning:'Muiz (İzzet Veren)',color:'#84cc16'},
  {n:25,ar:'الْمُذِلُّ',translit:'Al-Mudhill',az:'Zəlil edən',en:'The Dishonourer',ru:'Унижающий',tr_meaning:'Müzil (Zillete Düşüren)',color:'#fbbf24'},
  {n:26,ar:'السَّمِيعُ',translit:'As-Sami',az:'Eşidən',en:'The All-Hearing',ru:'Слышащий',tr_meaning:'Semî (Her Şeyi İşiten)',color:'#06b6d4'},
  {n:27,ar:'الْبَصِيرُ',translit:'Al-Basir',az:'Görən',en:'The All-Seeing',ru:'Видящий',tr_meaning:'Basîr (Her Şeyi Gören)',color:'#10b981'},
  {n:28,ar:'الْحَكَمُ',translit:'Al-Hakam',az:'Hökm edən',en:'The Judge',ru:'Судья',tr_meaning:'Hakem (Hükmeden)',color:'#f59e0b'},
  {n:29,ar:'الْعَدْلُ',translit:'Al-Adl',az:'Ədalətli',en:'The Just',ru:'Справедливый',tr_meaning:'Adl (Mutlak Adil)',color:'#8b5cf6'},
  {n:30,ar:'اللَّطِيفُ',translit:'Al-Latif',az:'Lütfkar',en:'The Subtle',ru:'Мягкий',tr_meaning:'Latîf (Lütufkâr, İnceliklere Vâkıf)',color:'#3b82f6'},
  {n:31,ar:'الْخَبِيرُ',translit:'Al-Khabir',az:'Xəbərdar',en:'The All-Aware',ru:'Осведомлённый',tr_meaning:'Habîr (Her Şeyden Haberdar)',color:'#ec4899'},
  {n:32,ar:'الْحَلِيمُ',translit:'Al-Halim',az:'Tələsmədən cəzalandırmayan',en:'The Forbearing',ru:'Кроткий',tr_meaning:'Halîm (Cezada Acele Etmeyen)',color:'#ef4444'},
  {n:33,ar:'الْعَظِيمُ',translit:'Al-Azim',az:'Əzəmətli',en:'The Magnificent',ru:'Великий',tr_meaning:'Azîm (Pek Büyük)',color:'#f97316'},
  {n:34,ar:'الْغَفُورُ',translit:'Al-Ghafur',az:'Bağışlayan',en:'The All-Forgiving',ru:'Всепрощающий',tr_meaning:'Gafûr (Bağışlayan)',color:'#14b8a6'},
  {n:35,ar:'الشَّكُورُ',translit:'Ash-Shakur',az:'Şükür edən',en:'The Appreciative',ru:'Благодарный',tr_meaning:'Şekûr (Az İyiliğe Çok Karşılık Veren)',color:'#a855f7'},
  {n:36,ar:'الْعَلِيُّ',translit:'Al-Ali',az:'Uca',en:'The Most High',ru:'Высочайший',tr_meaning:'Aliyy (Pek Yüce)',color:'#6366f1'},
  {n:37,ar:'الْكَبِيرُ',translit:'Al-Kabir',az:'Böyük',en:'The Greatest',ru:'Великий',tr_meaning:'Kebîr (Pek Büyük)',color:'#84cc16'},
  {n:38,ar:'الْحَفِيظُ',translit:'Al-Hafiz',az:'Qoruyan',en:'The Preserver',ru:'Хранитель',tr_meaning:'Hafîz (Koruyan)',color:'#fbbf24'},
  {n:39,ar:'الْمُقِيتُ',translit:'Al-Muqit',az:'Bəsləyən',en:'The Nourisher',ru:'Питающий',tr_meaning:'Mukît (Güç ve Rızık Veren)',color:'#06b6d4'},
  {n:40,ar:'الْحَسِيبُ',translit:'Al-Hasib',az:'Hesab aparan',en:'The Reckoner',ru:'Считающий',tr_meaning:'Hasîb (Hesaba Çeken)',color:'#10b981'},
  {n:41,ar:'الْجَلِيلُ',translit:'Al-Jalil',az:'Ulu',en:'The Majestic',ru:'Величественный',tr_meaning:'Celîl (Pek Ulu)',color:'#f59e0b'},
  {n:42,ar:'الْكَرِيمُ',translit:'Al-Karim',az:'Kərəmli, səxavətli',en:'The Generous',ru:'Щедрый',tr_meaning:'Kerîm (Cömert)',color:'#8b5cf6'},
  {n:43,ar:'الرَّقِيبُ',translit:'Ar-Raqib',az:'Nəzarət edən',en:'The Watchful',ru:'Наблюдающий',tr_meaning:'Rakîb (Gözetleyen)',color:'#3b82f6'},
  {n:44,ar:'الْمُجِيبُ',translit:'Al-Mujib',az:'Qəbul edən',en:'The Responsive',ru:'Отвечающий',tr_meaning:'Mucîb (Duaları Kabul Eden)',color:'#ec4899'},
  {n:45,ar:'الْوَاسِعُ',translit:'Al-Wasi',az:'Geniş',en:'The All-Encompassing',ru:'Объемлющий',tr_meaning:'Vâsi (Rahmeti Geniş)',color:'#ef4444'},
  {n:46,ar:'الْحَكِيمُ',translit:'Al-Hakim',az:'Hikmətli',en:'The Wise',ru:'Мудрый',tr_meaning:'Hakîm (Hikmet Sahibi)',color:'#f97316'},
  {n:47,ar:'الْوَدُودُ',translit:'Al-Wadud',az:'Sevən',en:'The Loving',ru:'Любящий',tr_meaning:'Vedûd (Seven, Sevilen)',color:'#14b8a6'},
  {n:48,ar:'الْمَجِيدُ',translit:'Al-Majid',az:'Şanlı',en:'The Glorious',ru:'Славный',tr_meaning:'Mecîd (Şanı Yüce)',color:'#a855f7'},
  {n:49,ar:'الْبَاعِثُ',translit:"Al-Ba'ith",az:'Dirildən',en:'The Resurrector',ru:'Воскрешающий',tr_meaning:'Bâis (Ölüleri Dirilten)',color:'#6366f1'},
  {n:50,ar:'الشَّهِيدُ',translit:'Ash-Shahid',az:'Hər şeyə şahid olan',en:'The Witness',ru:'Свидетель',tr_meaning:'Şehîd (Her Şeye Şahit)',color:'#84cc16'},
  {n:51,ar:'الْحَقُّ',translit:'Al-Haqq',az:'Varlığı həqiqi olan',en:'The Truth',ru:'Истина',tr_meaning:'Hak (Varlığı Gerçek Olan)',color:'#fbbf24'},
  {n:52,ar:'الْوَكِيلُ',translit:'Al-Wakil',az:'Hər işi Ona həvalə edilən',en:'The Trustee',ru:'Доверенный',tr_meaning:'Vekîl (Kendisine Güvenilen)',color:'#06b6d4'},
  {n:53,ar:'الْقَوِيُّ',translit:'Al-Qawiy',az:'Güclü',en:'The Strong',ru:'Сильный',tr_meaning:'Kaviyy (Pek Güçlü)',color:'#10b981'},
  {n:54,ar:'الْمَتِينُ',translit:'Al-Matin',az:'Möhkəm',en:'The Firm',ru:'Прочный',tr_meaning:'Metîn (Çok Sağlam)',color:'#f59e0b'},
  {n:55,ar:'الْوَلِيُّ',translit:'Al-Waliy',az:'Dost',en:'The Protecting Friend',ru:'Покровитель',tr_meaning:'Veliyy (Dost)',color:'#8b5cf6'},
  {n:56,ar:'الْحَمِيدُ',translit:'Al-Hamid',az:'Həmd olunan',en:'The Praiseworthy',ru:'Достохвальный',tr_meaning:'Hamîd (Övülmeye Layık)',color:'#3b82f6'},
  {n:57,ar:'الْمُحْصِي',translit:'Al-Muhsi',az:'Sayan',en:'The Counter',ru:'Считающий',tr_meaning:'Muhsî (Her Şeyi Sayan)',color:'#ec4899'},
  {n:58,ar:'الْمُبْدِئُ',translit:'Al-Mubdi',az:'Başladan',en:'The Originator',ru:'Начинающий',tr_meaning:'Mübdi (İlk Defa Yaratan)',color:'#ef4444'},
  {n:59,ar:'الْمُعِيدُ',translit:"Al-Mu'id",az:'Geri qaytaran',en:'The Restorer',ru:'Возвращающий',tr_meaning:'Muîd (Yeniden Yaratan)',color:'#f97316'},
  {n:60,ar:'الْمُحْيِي',translit:'Al-Muhyi',az:'Həyat verən',en:'The Giver of Life',ru:'Оживляющий',tr_meaning:'Muhyî (Hayat Veren)',color:'#14b8a6'},
  {n:61,ar:'الْمُمِيتُ',translit:'Al-Mumit',az:'Ölüm verən',en:'The Taker of Life',ru:'Умертвляющий',tr_meaning:'Mümît (Ölümü Yaratan)',color:'#a855f7'},
  {n:62,ar:'الْحَيُّ',translit:'Al-Hayy',az:'Diri',en:'The Ever Living',ru:'Живой',tr_meaning:'Hayy (Diri)',color:'#6366f1'},
  {n:63,ar:'الْقَيُّومُ',translit:'Al-Qayyum',az:'Əbədi',en:'The Self-Subsisting',ru:'Самодостаточный',tr_meaning:'Kayyûm (Her Şeyi Ayakta Tutan)',color:'#84cc16'},
  {n:64,ar:'الْوَاجِدُ',translit:'Al-Wajid',az:'Tapan',en:'The Finder',ru:'Находящий',tr_meaning:'Vâcid (İstediğini Bulan)',color:'#fbbf24'},
  {n:65,ar:'الْمَاجِدُ',translit:'Al-Majid',az:'Şərəfli',en:'The Noble',ru:'Благородный',tr_meaning:'Mâcid (Şanı Büyük)',color:'#06b6d4'},
  {n:66,ar:'الْوَاحِدُ',translit:'Al-Wahid',az:'Tək',en:'The One',ru:'Единый',tr_meaning:'Vâhid (Bir)',color:'#10b981'},
  {n:67,ar:'الصَّمَدُ',translit:'As-Samad',az:'Ehtiyacsız',en:'The Eternal',ru:'Вечный',tr_meaning:'Samed (Hiçbir Şeye Muhtaç Olmayan)',color:'#f59e0b'},
  {n:68,ar:'الْقَادِرُ',translit:'Al-Qadir',az:'Hər şeyə gücü çatan',en:'The Able',ru:'Способный',tr_meaning:'Kâdir (Gücü Yeten)',color:'#8b5cf6'},
  {n:69,ar:'الْمُقْتَدِرُ',translit:'Al-Muqtadir',az:'Hər şeyə qadir',en:'The Powerful',ru:'Могущественный',tr_meaning:'Muktedir (Kudret Sahibi)',color:'#3b82f6'},
  {n:70,ar:'الْمُقَدِّمُ',translit:'Al-Muqaddim',az:'Öndə tutan',en:'The Expediter',ru:'Выдвигающий',tr_meaning:'Mukaddim (Öne Alan)',color:'#ec4899'},
  {n:71,ar:'الْمُؤَخِّرُ',translit:"Al-Mu'akhkhir",az:'Geri saxlayan',en:'The Delayer',ru:'Откладывающий',tr_meaning:'Muahhir (Geriye Bırakan)',color:'#ef4444'},
  {n:72,ar:'الْأَوَّلُ',translit:'Al-Awwal',az:'İlk',en:'The First',ru:'Первый',tr_meaning:'Evvel (Başlangıcı Olmayan)',color:'#f97316'},
  {n:73,ar:'الْآخِرُ',translit:'Al-Akhir',az:'Son',en:'The Last',ru:'Последний',tr_meaning:'Âhir (Sonu Olmayan)',color:'#14b8a6'},
  {n:74,ar:'الظَّاهِرُ',translit:'Az-Zahir',az:'Aşkar olan',en:'The Manifest',ru:'Явный',tr_meaning:'Zâhir (Varlığı Apaçık)',color:'#a855f7'},
  {n:75,ar:'الْبَاطِنُ',translit:'Al-Batin',az:'Gizli',en:'The Hidden',ru:'Скрытый',tr_meaning:'Bâtın (Gizli Olan)',color:'#6366f1'},
  {n:76,ar:'الْوَالِي',translit:'Al-Wali',az:'İdarə edən',en:'The Governor',ru:'Правитель',tr_meaning:'Vâlî (Yöneten)',color:'#84cc16'},
  {n:77,ar:'الْمُتَعَالِي',translit:"Al-Muta'ali",az:'Yüksək',en:'The Most Exalted',ru:'Превознесённый',tr_meaning:'Müteâlî (Pek Yüce)',color:'#fbbf24'},
  {n:78,ar:'الْبَرُّ',translit:'Al-Barr',az:'Yaxşılıq edən',en:'The Doer of Good',ru:'Благодетель',tr_meaning:'Berr (İyilik Eden)',color:'#06b6d4'},
  {n:79,ar:'التَّوَّابُ',translit:'At-Tawwab',az:'Tövbə qəbul edən',en:'The Acceptor of Repentance',ru:'Принимающий покаяние',tr_meaning:'Tevvâb (Tövbeleri Kabul Eden)',color:'#10b981'},
  {n:80,ar:'الْمُنْتَقِمُ',translit:'Al-Muntaqim',az:'İntiqam alan',en:'The Avenger',ru:'Мститель',tr_meaning:'Müntakim (Suçluları Cezalandıran)',color:'#f59e0b'},
  {n:81,ar:'الْعَفُوُّ',translit:'Al-Afuw',az:'Əfv edən',en:'The Pardoner',ru:'Прощающий',tr_meaning:'Afüvv (Affeden)',color:'#8b5cf6'},
  {n:82,ar:'الرَّءُوفُ',translit:"Ar-Ra'uf",az:'Şəfqətli',en:'The Compassionate',ru:'Сострадательный',tr_meaning:'Raûf (Çok Şefkatli)',color:'#3b82f6'},
  {n:83,ar:'مَالِكُ الْمُلْكِ',translit:'Malik al-Mulk',az:'Mülkün sahibi',en:'Owner of Sovereignty',ru:'Владыка царства',tr_meaning:'Mâlikü\'l-Mülk (Mülkün Sahibi)',color:'#ec4899'},
  {n:84,ar:'ذُو الْجَلَالِ وَالْإِكْرَامِ',translit:'Dhul-Jalali wal-Ikram',az:'Əzəmət sahibi',en:'Lord of Majesty',ru:'Обладатель величия',tr_meaning:'Zü\'l-Celâli ve\'l-İkrâm (Celal ve İkram Sahibi)',color:'#ef4444'},
  {n:85,ar:'الْمُقْسِطُ',translit:'Al-Muqsit',az:'Ədalətlə hökm',en:'The Equitable',ru:'Справедливый',tr_meaning:'Muksit (Adaletle Hükmeden)',color:'#f97316'},
  {n:86,ar:'الْجَامِعُ',translit:'Al-Jami',az:'Toplayan',en:'The Gatherer',ru:'Собирающий',tr_meaning:'Câmi (Toplayan)',color:'#14b8a6'},
  {n:87,ar:'الْغَنِيُّ',translit:'Al-Ghani',az:'Ehtiyacsız',en:'The Self-Sufficient',ru:'Богатый',tr_meaning:'Ganî (Hiçbir Şeye Muhtaç Olmayan)',color:'#a855f7'},
  {n:88,ar:'الْمُغْنِي',translit:'Al-Mughni',az:'Zəngin edən',en:'The Enricher',ru:'Обогащающий',tr_meaning:'Mugnî (Zengin Kılan)',color:'#6366f1'},
  {n:89,ar:'الْمَانِعُ',translit:'Al-Mani',az:'Mane olan',en:'The Preventer',ru:'Удерживающий',tr_meaning:'Mâni (Engelleyen)',color:'#84cc16'},
  {n:90,ar:'الضَّارُّ',translit:'Ad-Darr',az:'Zərər verən',en:'The Distresser',ru:'Причиняющий',tr_meaning:'Dârr (Zarar Veren)',color:'#fbbf24'},
  {n:91,ar:'النَّافِعُ',translit:'An-Nafi',az:'Fayda verən',en:'The Benefiter',ru:'Приносящий пользу',tr_meaning:'Nâfi (Fayda Veren)',color:'#06b6d4'},
  {n:92,ar:'النُّورُ',translit:'An-Nur',az:'İşıq verən',en:'The Light',ru:'Свет',tr_meaning:'Nûr (Nurlandıran)',color:'#10b981'},
  {n:93,ar:'الْهَادِي',translit:'Al-Hadi',az:'Hidayət edən',en:'The Guide',ru:'Ведущий',tr_meaning:'Hâdî (Hidayet Veren)',color:'#f59e0b'},
  {n:94,ar:'الْبَدِيعُ',translit:'Al-Badi',az:'Yaradan',en:'The Incomparable',ru:'Создатель',tr_meaning:'Bedî (Eşsiz Yaratan)',color:'#8b5cf6'},
  {n:95,ar:'الْبَاقِي',translit:'Al-Baqi',az:'Əbədi',en:'The Everlasting',ru:'Вечный',tr_meaning:'Bâkî (Varlığı Sonsuz)',color:'#3b82f6'},
  {n:96,ar:'الْوَارِثُ',translit:'Al-Warith',az:'Hər şeyin varisi',en:'The Inheritor',ru:'Наследник',tr_meaning:'Vâris (Her Şeyin Asıl Sahibi)',color:'#ec4899'},
  {n:97,ar:'الرَّشِيدُ',translit:'Ar-Rashid',az:'Doğru yola',en:'The Guide to Right',ru:'Направляющий',tr_meaning:'Reşîd (Doğru Yolu Gösteren)',color:'#ef4444'},
  {n:98,ar:'الصَّبُورُ',translit:'As-Sabur',az:'Çox səbirli',en:'The Patient',ru:'Терпеливый',tr_meaning:'Sabûr (Çok Sabırlı)',color:'#f97316'},
  {n:99,ar:'اللَّهُ',translit:'Allah',az:'Allah',en:'Allah',ru:'Аллах',tr_meaning:'Yüce Allah',color:'#d4a017'},
];

export default function NamesScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const t = T[lang]?.names || T.az.names;
  const sh = dark ? Shadows.dark.sm : Shadows.sm;

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  // Ərəbcə ad onsuz da göstərilir — ar üçün ayrıca "məna" yoxdur (veb NamesPage kimi).
  // Başqa dilə ehtiyat keçid YOXDUR: məna yalnız seçilmiş dildə göstərilir.
  const getMeaning = (name) => (lang === 'ar' ? '' : lang === 'tr' ? name.tr_meaning : name[lang]) || '';

  const filtered = useMemo(() => {
    if (!search) return NAMES;
    const q = search.toLowerCase();
    return NAMES.filter(n => n.ar.includes(search) || n.translit.toLowerCase().includes(q) || getMeaning(n).toLowerCase().includes(q));
  }, [search, lang]);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="أَسْمَاءُ اللَّهِ الْحُسْنَى" title={t.title} subtitle={t.subtitle} theme="names" />

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
                  <Text style={[styles.nameTranslit, { color: c.text }]}>{n.translit}</Text>
                  {getMeaning(n) ? <Text style={[styles.nameMeaning, { color: c.textMuted }]} numberOfLines={1}>{getMeaning(n)}</Text> : null}
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
                <Text style={styles.modalTranslit}>{selected.translit}</Text>
                <View style={styles.modalCircle1} />
                <View style={styles.modalCircle2} />
              </LinearGradient>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {getMeaning(selected) ? (
                <View style={[styles.meaningBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                  <Text style={[styles.meaningLabel, { color: selected.color }]}>
                    {lang==='az'?'MƏNA':lang==='ru'?'ЗНАЧЕНИЕ':lang==='ar'?'المعنى':lang==='tr'?'ANLAM':'MEANING'}
                  </Text>
                  <Text style={[styles.meaningValue, { color: c.text }]}>{getMeaning(selected)}</Text>
                </View>
                ) : null}

                {selected.desc?.[lang] && (
                  <View style={[styles.descBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                    <Text style={[styles.descLabel, { color: selected.color }]}>
                      {lang==='az'?'İZAH':lang==='ru'?'ОПИСАНИЕ':lang==='ar'?'الوصف':lang==='tr'?'AÇIKLAMA':'DESCRIPTION'}
                    </Text>
                    <Text style={[styles.descText, { color: c.textSecondary }]}>
                      {selected.desc[lang]}
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
