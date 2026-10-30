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
// Siyahı veb src/data/names99.js ilə eynidir: Şeyx İbn Useymin, "əl-Qavaid əl-Musla"
// (Quran və səhih Sünnədən 99 ad). Tirmizi 3507-dəki sadalama ravinin əlavəsidir.
// "translit" — latın transliterasiyası (Ar-Rahman), hər dildə adın altında göstərilir.
// Türkcə məna "tr_meaning"-dədir (veb src/data/names99.js ilə eyni).
const NAMES = [
  {n:1,ar:'ٱللَّهُ',translit:'Allah',az:'Uca Allah',en:'Allah',ru:'Аллах',tr_meaning:'Yüce Allah',color:'#d4a017'},
  {n:2,ar:'ٱلۡأَحَدُ',translit:'Al-Ahad',az:'Əhəd (Yeganə)',en:'The Unique',ru:'Единственный',tr_meaning:'Ehad (Tek)',color:'#f59e0b'},
  {n:3,ar:'ٱلۡأَعۡلَىٰ',translit:'Al-A\'la',az:'Əla (Ən Uca — hər şeydən yuxarı olan)',en:'The Most High, Above All',ru:'Высочайший (превыше всего)',tr_meaning:'A\'lâ (Her Şeyin Üstünde Olan)',color:'#8b5cf6'},
  {n:4,ar:'ٱلۡأَكۡرَمُ',translit:'Al-Akram',az:'Əkrəm (Kərəmi ən çox olan)',en:'The Most Generous',ru:'Щедрейший',tr_meaning:'Ekrem (Cömertliği En Büyük)',color:'#3b82f6'},
  {n:5,ar:'ٱلۡإِلَٰهُ',translit:'Al-Ilah',az:'İlah (Haqq olaraq ibadət edilən yeganə Məbud)',en:'The God (the only One truly worshipped)',ru:'Бог (единственный, кто истинно достоин поклонения)',tr_meaning:'İlâh (Hak Olarak İbadet Edilen Tek Mabud)',color:'#ec4899'},
  {n:6,ar:'ٱلۡأَوَّلُ',translit:'Al-Awwal',az:'Əvvəl (İlk Olan)',en:'The First',ru:'Первый',tr_meaning:'Evvel (Başlangıcı Olmayan)',color:'#ef4444'},
  {n:7,ar:'ٱلۡآخِرُ',translit:'Al-Akhir',az:'Axir (Son Olan)',en:'The Last',ru:'Последний',tr_meaning:'Âhir (Sonu Olmayan)',color:'#f97316'},
  {n:8,ar:'ٱلظَّاهِرُ',translit:'Az-Zahir',az:'Zahir (Ən Uca — Ondan yuxarı heç nə yoxdur)',en:'The Most High (nothing is above Him)',ru:'Явный (нет ничего выше Него)',tr_meaning:'Zâhir (Üstünde Hiçbir Şey Olmayan)',color:'#14b8a6'},
  {n:9,ar:'ٱلۡبَاطِنُ',translit:'Al-Batin',az:'Batin (Ondan yaxın heç nə yoxdur)',en:'The Most Near (nothing is nearer than Him)',ru:'Скрытый (нет ничего ближе Него)',tr_meaning:'Bâtın (Ondan Daha Yakın Hiçbir Şey Olmayan)',color:'#a855f7'},
  {n:10,ar:'ٱلۡبَارِئُ',translit:'Al-Bari\'',az:'Bari (Var Edən)',en:'The Originator',ru:'Создатель',tr_meaning:'Bâri (Kusursuz Yaratan)',color:'#6366f1'},
  {n:11,ar:'ٱلۡبَرُّ',translit:'Al-Barr',az:'Bərr (Yaxşılıq Edən)',en:'The Source of Goodness',ru:'Источник добра',tr_meaning:'Berr (İyilik Eden)',color:'#84cc16'},
  {n:12,ar:'ٱلۡبَصِيرُ',translit:'Al-Basir',az:'Bəsir (Görən)',en:'The All-Seeing',ru:'Всевидящий',tr_meaning:'Basîr (Her Şeyi Gören)',color:'#fbbf24'},
  {n:13,ar:'ٱلتَّوَّابُ',translit:'At-Tawwab',az:'Təvvab (Tövbəni Qəbul Edən)',en:'The Acceptor of Repentance',ru:'Принимающий покаяние',tr_meaning:'Tevvâb (Tövbeleri Kabul Eden)',color:'#06b6d4'},
  {n:14,ar:'ٱلۡجَبَّارُ',translit:'Al-Jabbar',az:'Cəbbar (Qüdrətli)',en:'The Compeller',ru:'Всесильный',tr_meaning:'Cebbâr (Dilediğini Yaptıran)',color:'#10b981'},
  {n:15,ar:'ٱلۡحَافِظُ',translit:'Al-Haafiz',az:'Hafiz (Qoruyub saxlayan)',en:'The Guardian',ru:'Охраняющий',tr_meaning:'Hâfız (Koruyup Gözeten)',color:'#f59e0b'},
  {n:16,ar:'ٱلۡحَسِيبُ',translit:'Al-Hasib',az:'Həsib (Hesablayan)',en:'The Reckoner',ru:'Учитывающий',tr_meaning:'Hasîb (Hesaba Çeken)',color:'#8b5cf6'},
  {n:17,ar:'ٱلۡحَفِيظُ',translit:'Al-Hafiz',az:'Həfiz (Qoruyan)',en:'The Preserver',ru:'Хранящий',tr_meaning:'Hafîz (Koruyan)',color:'#3b82f6'},
  {n:18,ar:'ٱلۡحَفِيُّ',translit:'Al-Hafiyy',az:'Həfiyy (Bəndəsinə lütfkar, ona qayğı göstərən)',en:'The Ever-Gracious (to His servant)',ru:'Благосклонный (к Своему рабу)',tr_meaning:'Hafiyy (Kuluna Karşı Lütufkâr)',color:'#ec4899'},
  {n:19,ar:'ٱلۡحَقُّ',translit:'Al-Haqq',az:'Haqq (Varlığı Həqiqi Olan)',en:'The Truth',ru:'Истинный',tr_meaning:'Hak (Varlığı Gerçek Olan)',color:'#ef4444'},
  {n:20,ar:'ٱلۡمُبِينُ',translit:'Al-Mubin',az:'Mübin (Haqlığı aşkar olan, haqqı aydınlaşdıran)',en:'The Manifest (who makes the truth clear)',ru:'Явный (разъясняющий истину)',tr_meaning:'Mübîn (Apaçık Olan, Hakkı Açıklayan)',color:'#f97316'},
  {n:21,ar:'ٱلۡحَكِيمُ',translit:'Al-Hakim',az:'Həkim (Hikmət Sahibi)',en:'The Wise',ru:'Мудрый',tr_meaning:'Hakîm (Hikmet Sahibi)',color:'#14b8a6'},
  {n:22,ar:'ٱلۡحَلِيمُ',translit:'Al-Halim',az:'Həlim (Tələsmədən Cəzalandırmayan)',en:'The Forbearing',ru:'Кроткий',tr_meaning:'Halîm (Cezada Acele Etmeyen)',color:'#a855f7'},
  {n:23,ar:'ٱلۡحَمِيدُ',translit:'Al-Hamid',az:'Həmid (Həmd Edilən)',en:'The Praiseworthy',ru:'Достохвальный',tr_meaning:'Hamîd (Övülmeye Layık)',color:'#6366f1'},
  {n:24,ar:'ٱلۡحَيُّ',translit:'Al-Hayy',az:'Həyy (Diri Olan)',en:'The Ever-Living',ru:'Живой',tr_meaning:'Hayy (Diri)',color:'#84cc16'},
  {n:25,ar:'ٱلۡقَيُّومُ',translit:'Al-Qayyum',az:'Qayyum (Özü Mövcud)',en:'The Self-Sustaining',ru:'Самодостаточный',tr_meaning:'Kayyûm (Her Şeyi Ayakta Tutan)',color:'#fbbf24'},
  {n:26,ar:'ٱلۡخَبِيرُ',translit:'Al-Khabir',az:'Xəbir (Xəbərdar)',en:'The All-Aware',ru:'Осведомлённый',tr_meaning:'Habîr (Her Şeyden Haberdar)',color:'#06b6d4'},
  {n:27,ar:'ٱلۡخَٰلِقُ',translit:'Al-Khaliq',az:'Xaliq (Yaradan)',en:'The Creator',ru:'Творец',tr_meaning:'Hâlık (Yaratan)',color:'#10b981'},
  {n:28,ar:'ٱلۡخَلَّٰقُ',translit:'Al-Khallaq',az:'Xəllaq (Daim və çoxlu yaradan)',en:'The Ever-Creating',ru:'Непрестанно творящий',tr_meaning:'Hallâk (Durmadan Yaratan)',color:'#f59e0b'},
  {n:29,ar:'ٱلرَّءُوفُ',translit:'Ar-Ra\'uf',az:'Rəuf (Şəfqətli)',en:'The Most Kind',ru:'Снисходительный',tr_meaning:'Raûf (Çok Şefkatli)',color:'#8b5cf6'},
  {n:30,ar:'ٱلرَّحۡمَٰنُ',translit:'Ar-Rahman',az:'Rəhman (Çox Rəhimli)',en:'The Most Gracious',ru:'Всемилостивый',tr_meaning:'Rahmân (Çok Merhametli)',color:'#3b82f6',desc:{az:'Bütün yaratdıqlarına sonsuz mərhəmət göstərən',en:'The One who shows endless mercy to all creation',ru:'Тот, кто проявляет бесконечную милость',ar:'الذي وسعت رحمته كل شيء',tr:'Yarattığı her şeye sınırsız merhamet gösteren'}},
  {n:31,ar:'ٱلرَّحِيمُ',translit:'Ar-Rahim',az:'Rəhim (Çox Mərhəmətli)',en:'The Most Merciful',ru:'Милосердный',tr_meaning:'Rahîm (Çok Esirgeyen)',color:'#ec4899',desc:{az:'Möminlərə xüsusi rəhm edən',en:'Especially merciful to believers',ru:'Особенно милосердный к верующим',ar:'الذي يخص المؤمنين برحمته',tr:'Müminlere özel rahmet gösteren'}},
  {n:32,ar:'ٱلرَّزَّاقُ',translit:'Ar-Razzaq',az:'Rəzzaq (Ruzi Verən)',en:'The Provider',ru:'Питающий',tr_meaning:'Rezzâk (Rızık Veren)',color:'#ef4444'},
  {n:33,ar:'ٱلرَّقِيبُ',translit:'Ar-Raqib',az:'Rəqib (Nəzarət edən)',en:'The Watchful',ru:'Бдительный',tr_meaning:'Rakîb (Gözetleyen)',color:'#f97316'},
  {n:34,ar:'ٱلسَّلَٰمُ',translit:'As-Salam',az:'Salam (Əmin-Amanlıq)',en:'The Source of Peace',ru:'Мир',tr_meaning:'Selâm (Esenlik Veren)',color:'#14b8a6',desc:{az:'Sülh və salamatlıq verən',en:'The Giver of peace and safety',ru:'Дающий мир и безопасность',ar:'واهب السلام والأمان',tr:'Barış ve selamet veren'}},
  {n:35,ar:'ٱلسَّمِيعُ',translit:'As-Sami',az:'Səmi (Eşidən)',en:'The All-Hearing',ru:'Всеслышащий',tr_meaning:'Semî (Her Şeyi İşiten)',color:'#a855f7'},
  {n:36,ar:'ٱلشَّاكِرُ',translit:'Ash-Shakir',az:'Şakir (Əməlin əvəzini artıqlaması ilə verən)',en:'The Rewarder of Good Deeds',ru:'Вознаграждающий (за благие дела)',tr_meaning:'Şâkir (Amellerin Karşılığını Fazlasıyla Veren)',color:'#6366f1'},
  {n:37,ar:'ٱلشَّكُورُ',translit:'Ash-Shakur',az:'Şəkur (Şükür Edən)',en:'The Appreciative',ru:'Благодарный',tr_meaning:'Şekûr (Az İyiliğe Çok Karşılık Veren)',color:'#84cc16'},
  {n:38,ar:'ٱلشَّهِيدُ',translit:'Ash-Shahid',az:'Şəhid (Şahid Olan)',en:'The Witness',ru:'Свидетель',tr_meaning:'Şehîd (Her Şeye Şahit)',color:'#fbbf24'},
  {n:39,ar:'ٱلصَّمَدُ',translit:'As-Samad',az:'Saməd (Ehtiyacsız)',en:'The Eternal',ru:'Самодостаточный',tr_meaning:'Samed (Hiçbir Şeye Muhtaç Olmayan)',color:'#06b6d4'},
  {n:40,ar:'ٱلۡعَٰلِمُ',translit:'Al-\'Aalim',az:'Alim (Qeybi və aşkarı bilən)',en:'The Knower (of the unseen and the seen)',ru:'Знающий (сокровенное и явное)',tr_meaning:'Âlim (Gaybı ve Görüneni Bilen)',color:'#10b981'},
  {n:41,ar:'ٱلۡعَزِيزُ',translit:'Al-\'Aziz',az:'Əziz (Güclü, Üstün)',en:'The Almighty',ru:'Могущественный',tr_meaning:'Azîz (Mağlup Edilmeyen, Üstün)',color:'#f59e0b'},
  {n:42,ar:'ٱلۡعَظِيمُ',translit:'Al-\'Azim',az:'Əzim (Böyük)',en:'The Great',ru:'Великий',tr_meaning:'Azîm (Pek Büyük)',color:'#8b5cf6'},
  {n:43,ar:'ٱلۡعَفُوُّ',translit:'Al-\'Afuww',az:'Əfuv (Əfv Edən)',en:'The Pardoner',ru:'Прощающий',tr_meaning:'Afüvv (Affeden)',color:'#3b82f6'},
  {n:44,ar:'ٱلۡعَلِيمُ',translit:'Al-\'Alim',az:'Əlim (Hər Şeyi Bilən)',en:'The All-Knowing',ru:'Всезнающий',tr_meaning:'Alîm (Her Şeyi Bilen)',color:'#ec4899'},
  {n:45,ar:'ٱلۡعَلِيُّ',translit:'Al-\'Aliyy',az:'Əliyy (Uca — zatı, qədri və qəhri ilə)',en:'The Most High (in essence, rank and dominion)',ru:'Всевышний (Сущностью, достоинством и господством)',tr_meaning:'Aliyy (Zâtı, Kadri ve Kahrıyla Yüce)',color:'#ef4444'},
  {n:46,ar:'ٱلۡغَفَّارُ',translit:'Al-Ghaffar',az:'Ğaffar (Çox Bağışlayan)',en:'The Ever-Forgiving',ru:'Всепрощающий',tr_meaning:'Gaffâr (Çok Bağışlayan)',color:'#f97316'},
  {n:47,ar:'ٱلۡغَفُورُ',translit:'Al-Ghafur',az:'Ğəfur (Bağışlayan)',en:'The Forgiving',ru:'Прощающий',tr_meaning:'Gafûr (Bağışlayan)',color:'#14b8a6'},
  {n:48,ar:'ٱلۡغَنِيُّ',translit:'Al-Ghani',az:'Ğani (Ehtiyacsız)',en:'The Rich',ru:'Богатый',tr_meaning:'Ganî (Hiçbir Şeye Muhtaç Olmayan)',color:'#a855f7'},
  {n:49,ar:'ٱلۡفَتَّاحُ',translit:'Al-Fattah',az:'Fəttah (Açan)',en:'The Opener',ru:'Открывающий',tr_meaning:'Fettâh (Açan)',color:'#6366f1'},
  {n:50,ar:'ٱلۡقَادِرُ',translit:'Al-Qadir',az:'Qadir (Qadir Olan)',en:'The All-Powerful',ru:'Всемогущий',tr_meaning:'Kâdir (Gücü Yeten)',color:'#84cc16'},
  {n:51,ar:'ٱلۡقَاهِرُ',translit:'Al-Qahir',az:'Qahir (Bəndələri üzərində qalib olan)',en:'The Irresistible (above His servants)',ru:'Господствующий (над Своими рабами)',tr_meaning:'Kâhir (Kulları Üzerinde Galip Olan)',color:'#fbbf24'},
  {n:52,ar:'ٱلۡقُدُّوسُ',translit:'Al-Quddus',az:'Quddus (Müqəddəs)',en:'The Most Holy',ru:'Священный',tr_meaning:'Kuddûs (Her Eksiklikten Uzak)',color:'#06b6d4',desc:{az:'Hər cür nöqsandan uzaq',en:'Free from every imperfection',ru:'Свободный от всяких недостатков',ar:'المنزه عن كل نقص',tr:'Her türlü eksiklikten uzak'}},
  {n:53,ar:'ٱلۡقَدِيرُ',translit:'Al-Qadeer',az:'Qədir (Hər şeyə qadir olan)',en:'The Omnipotent (over all things)',ru:'Всемогущий (над всякой вещью)',tr_meaning:'Kadîr (Her Şeye Gücü Yeten)',color:'#10b981'},
  {n:54,ar:'ٱلۡقَرِيبُ',translit:'Al-Qarib',az:'Qərib (Yaxın — dua edənə cavab verən)',en:'The Near (answering those who call on Him)',ru:'Близкий (отвечающий взывающим к Нему)',tr_meaning:'Karîb (Yakın — Dua Edene İcabet Eden)',color:'#f59e0b'},
  {n:55,ar:'ٱلۡقَوِيُّ',translit:'Al-Qawiyy',az:'Qəvi (Güclü)',en:'The Strong',ru:'Сильный',tr_meaning:'Kaviyy (Pek Güçlü)',color:'#8b5cf6'},
  {n:56,ar:'ٱلۡقَهَّارُ',translit:'Al-Qahhar',az:'Qahhar (Qalib Gələn)',en:'The Subduer',ru:'Всепобеждающий',tr_meaning:'Kahhâr (Her Şeye Galip Gelen)',color:'#3b82f6'},
  {n:57,ar:'ٱلۡكَبِيرُ',translit:'Al-Kabir',az:'Kəbir (Böyük)',en:'The Most Great',ru:'Величайший',tr_meaning:'Kebîr (Pek Büyük)',color:'#ec4899'},
  {n:58,ar:'ٱلۡكَرِيمُ',translit:'Al-Karim',az:'Kərim (Kərəmli)',en:'The Generous',ru:'Щедрый',tr_meaning:'Kerîm (Cömert)',color:'#ef4444'},
  {n:59,ar:'ٱللَّطِيفُ',translit:'Al-Latif',az:'Lətif (Nazik, Xeyirxah)',en:'The Subtle',ru:'Тонкий',tr_meaning:'Latîf (Lütufkâr, İnceliklere Vâkıf)',color:'#f97316'},
  {n:60,ar:'ٱلۡمُؤۡمِنُ',translit:'Al-Mu\'min',az:'Mömin (Güvən Verən)',en:'The Guardian of Faith',ru:'Дающий веру',tr_meaning:'Mü\'min (Güven Veren)',color:'#14b8a6'},
  {n:61,ar:'ٱلۡمُتَعَالِي',translit:'Al-Muta\'ali',az:'Mütəali (Yüksək)',en:'The Most Exalted',ru:'Превозвышенный',tr_meaning:'Müteâlî (Pek Yüce)',color:'#a855f7'},
  {n:62,ar:'ٱلۡمُتَكَبِّرُ',translit:'Al-Mutakabbir',az:'Mütəkəbbir (Uca)',en:'The Supreme',ru:'Превеликий',tr_meaning:'Mütekebbir (Büyüklükte Eşsiz)',color:'#6366f1'},
  {n:63,ar:'ٱلۡمَتِينُ',translit:'Al-Matin',az:'Mətin (Möhkəm)',en:'The Firm',ru:'Твёрдый',tr_meaning:'Metîn (Çok Sağlam)',color:'#84cc16'},
  {n:64,ar:'ٱلۡمُجِيبُ',translit:'Al-Mujib',az:'Mücib (Cavab Verən)',en:'The Responsive',ru:'Отвечающий',tr_meaning:'Mucîb (Duaları Kabul Eden)',color:'#fbbf24'},
  {n:65,ar:'ٱلۡمَجِيدُ',translit:'Al-Majid',az:'Məcid (Şanlı)',en:'The Most Glorious',ru:'Славный',tr_meaning:'Mecîd (Şanı Yüce)',color:'#06b6d4'},
  {n:66,ar:'ٱلۡمُحِيطُ',translit:'Al-Muhit',az:'Mühit (Elmi və qüdrəti ilə hər şeyi əhatə edən)',en:'The Encompasser (in knowledge and power)',ru:'Охватывающий (знанием и могуществом)',tr_meaning:'Muhît (İlmi ve Kudretiyle Her Şeyi Kuşatan)',color:'#10b981'},
  {n:67,ar:'ٱلۡمُصَوِّرُ',translit:'Al-Musawwir',az:'Müsavvir (Şəkilverən)',en:'The Fashioner',ru:'Дающий облик',tr_meaning:'Musavvir (Şekil Veren)',color:'#f59e0b'},
  {n:68,ar:'ٱلۡمُقۡتَدِرُ',translit:'Al-Muqtadir',az:'Müqtədir (Güclü)',en:'The Powerful',ru:'Могущественный',tr_meaning:'Muktedir (Kudret Sahibi)',color:'#8b5cf6'},
  {n:69,ar:'ٱلۡمُقِيتُ',translit:'Al-Muqit',az:'Müqit (Qüvvət Verən)',en:'The Nourisher',ru:'Питающий',tr_meaning:'Mukît (Güç ve Rızık Veren)',color:'#3b82f6'},
  {n:70,ar:'ٱلۡمَلِكُ',translit:'Al-Malik',az:'Malik (Hökmdar)',en:'The King',ru:'Царь',tr_meaning:'Melik (Mülkün Sahibi, Hükümdar)',color:'#ec4899',desc:{az:'Mülkün və hökmün sahibi',en:'The Sovereign Lord',ru:'Владыка всего сущего',ar:'مالك كل شيء والحاكم عليه',tr:'Mülkün ve hükmün sahibi'}},
  {n:71,ar:'ٱلۡمَلِيكُ',translit:'Al-Maleek',az:'Məlik (Mülkü kamil olan Hökmdar)',en:'The Sovereign',ru:'Владыка',tr_meaning:'Melîk (Mülkü Kâmil Olan Hükümdar)',color:'#ef4444'},
  {n:72,ar:'ٱلۡمَوۡلَىٰ',translit:'Al-Mawla',az:'Məvla (Möminlərin Sahibi və Yardımçısı)',en:'The Patron (of the believers)',ru:'Господин и Заступник (верующих)',tr_meaning:'Mevlâ (Müminlerin Sahibi ve Yardımcısı)',color:'#f97316'},
  {n:73,ar:'ٱلۡمُهَيۡمِنُ',translit:'Al-Muhaymin',az:'Müheymin (Qoruyucu)',en:'The Protector',ru:'Хранитель',tr_meaning:'Müheymin (Gözetip Koruyan)',color:'#14b8a6'},
  {n:74,ar:'ٱلنَّصِيرُ',translit:'An-Nasir',az:'Nəsir (Yardım Edən)',en:'The Helper',ru:'Помощник',tr_meaning:'Nasîr (Yardım Eden)',color:'#a855f7'},
  {n:75,ar:'ٱلۡوَاحِدُ',translit:'Al-Wahid',az:'Vahid (Bir Olan)',en:'The One',ru:'Единый',tr_meaning:'Vâhid (Bir)',color:'#6366f1'},
  {n:76,ar:'ٱلۡوَارِثُ',translit:'Al-Warith',az:'Varis (Hər Şeyin Varisi)',en:'The Inheritor',ru:'Наследующий',tr_meaning:'Vâris (Her Şeyin Asıl Sahibi)',color:'#84cc16'},
  {n:77,ar:'ٱلۡوَٰسِعُ',translit:'Al-Wasi',az:'Vasi (Genişlik Verən)',en:'The All-Encompassing',ru:'Объемлющий',tr_meaning:'Vâsi (Rahmeti Geniş)',color:'#fbbf24'},
  {n:78,ar:'ٱلۡوَدُودُ',translit:'Al-Wadud',az:'Vədud (Sevən)',en:'The Loving',ru:'Любящий',tr_meaning:'Vedûd (Seven, Sevilen)',color:'#06b6d4'},
  {n:79,ar:'ٱلۡوَكِيلُ',translit:'Al-Wakil',az:'Vəkil (Hər İşi Ona Həvalə Edilən)',en:'The Trustee',ru:'Попечитель',tr_meaning:'Vekîl (Kendisine Güvenilen)',color:'#10b981'},
  {n:80,ar:'ٱلۡوَلِيُّ',translit:'Al-Waliyy',az:'Vəliy (Dost)',en:'The Protecting Friend',ru:'Покровитель',tr_meaning:'Veliyy (Dost)',color:'#f59e0b'},
  {n:81,ar:'ٱلۡوَهَّابُ',translit:'Al-Wahhab',az:'Vəhhab (Çox Bəxş Edən)',en:'The Bestower',ru:'Щедродарящий',tr_meaning:'Vehhâb (Karşılıksız Veren)',color:'#8b5cf6'},
  {n:82,ar:'ٱلۡجَمِيلُ',translit:'Al-Jamil',az:'Cəmil (Zatı, adları, sifətləri və işləri gözəl olan)',en:'The Beautiful',ru:'Прекрасный',tr_meaning:'Cemîl (Zâtı, İsimleri ve Sıfatları Güzel Olan)',color:'#3b82f6'},
  {n:83,ar:'ٱلۡجَوَادُ',translit:'Al-Jawad',az:'Cəvad (Çox Səxavətli)',en:'The Most Bountiful',ru:'Щедро дающий',tr_meaning:'Cevâd (Çok Cömert)',color:'#ec4899'},
  {n:84,ar:'ٱلۡحَكَمُ',translit:'Al-Hakam',az:'Həkəm (Hökm Edən)',en:'The Judge',ru:'Судья',tr_meaning:'Hakem (Hükmeden)',color:'#ef4444'},
  {n:85,ar:'ٱلۡحَيِيُّ',translit:'Al-Hayiyy',az:'Həyiyy (Həya sahibi — Ona layiq şəkildə)',en:'The Modest (as befits Him)',ru:'Стыдливый (как подобает Ему)',tr_meaning:'Hayiyy (Kendisine Yakışır Şekilde Hayâ Sahibi)',color:'#f97316'},
  {n:86,ar:'ٱلرَّبُّ',translit:'Ar-Rabb',az:'Rəbb (Yaradan, Malik və hər işi idarə edən)',en:'The Lord',ru:'Господь',tr_meaning:'Rab (Yaratan, Sahip Olan ve Yöneten)',color:'#14b8a6'},
  {n:87,ar:'ٱلرَّفِيقُ',translit:'Ar-Rafiq',az:'Rəfiq (Mülayim, mülayimliyi sevən)',en:'The Gentle',ru:'Мягкий (любящий мягкость)',tr_meaning:'Refîk (Yumuşak Davranan, Yumuşaklığı Seven)',color:'#a855f7'},
  {n:88,ar:'ٱلسُّبُّوحُ',translit:'As-Subbuh',az:'Sübbuh (Hər nöqsandan pak olan)',en:'The Glorified (free of every imperfection)',ru:'Пречистый',tr_meaning:'Sübbûh (Her Eksiklikten Münezzeh)',color:'#6366f1'},
  {n:89,ar:'ٱلسَّيِّدُ',translit:'As-Sayyid',az:'Seyyid (Kamil mənada Ağa)',en:'The Master',ru:'Господин',tr_meaning:'Seyyid (Mutlak Efendi)',color:'#84cc16'},
  {n:90,ar:'ٱلشَّافِي',translit:'Ash-Shafi',az:'Şafi (Şəfa Verən)',en:'The Healer',ru:'Исцеляющий',tr_meaning:'Şâfî (Şifa Veren)',color:'#fbbf24'},
  {n:91,ar:'ٱلطَّيِّبُ',translit:'At-Tayyib',az:'Təyyib (Pak olan, yalnız pak olanı qəbul edən)',en:'The Pure (accepting only what is pure)',ru:'Благой (принимающий лишь благое)',tr_meaning:'Tayyib (Temiz, Yalnız Temiz Olanı Kabul Eden)',color:'#06b6d4'},
  {n:92,ar:'ٱلۡقَابِضُ',translit:'Al-Qabid',az:'Qabiz (Tutan)',en:'The Restrainer',ru:'Сжимающий',tr_meaning:'Kâbız (Daraltan)',color:'#10b981'},
  {n:93,ar:'ٱلۡبَاسِطُ',translit:'Al-Basit',az:'Basit (Genişləndirən)',en:'The Extender',ru:'Расширяющий',tr_meaning:'Bâsıt (Genişleten)',color:'#f59e0b'},
  {n:94,ar:'ٱلۡمُقَدِّمُ',translit:'Al-Muqaddim',az:'Müqəddim (Öndə Tutan)',en:'The Expediter',ru:'Опережающий',tr_meaning:'Mukaddim (Öne Alan)',color:'#8b5cf6'},
  {n:95,ar:'ٱلۡمُؤَخِّرُ',translit:'Al-Mu\'akhkhir',az:'Mü\'əxxir (Arxada Tutan)',en:'The Delayer',ru:'Откладывающий',tr_meaning:'Muahhir (Geriye Bırakan)',color:'#3b82f6'},
  {n:96,ar:'ٱلۡمُحۡسِنُ',translit:'Al-Muhsin',az:'Mühsin (Ehsan və yaxşılıq edən)',en:'The Doer of Good',ru:'Благодетельный',tr_meaning:'Muhsin (İhsan Eden)',color:'#ec4899'},
  {n:97,ar:'ٱلۡمُعۡطِي',translit:'Al-Mu\'ti',az:'Mu\'ti (Verən, Bəxş edən)',en:'The Giver',ru:'Дающий',tr_meaning:'Mu\'tî (Veren)',color:'#ef4444'},
  {n:98,ar:'ٱلۡمَنَّانُ',translit:'Al-Mannan',az:'Mənnan (Nemətləri bol olan)',en:'The Bestower of Favours',ru:'Оказывающий милости',tr_meaning:'Mennân (Nimeti Bol Olan)',color:'#f97316'},
  {n:99,ar:'ٱلۡوِتۡرُ',translit:'Al-Witr',az:'Vitr (Tək — şəriki və bənzəri olmayan)',en:'The Single (without partner or like)',ru:'Непарный (без сотоварища и подобия)',tr_meaning:'Vitr (Tek, Eşi ve Benzeri Olmayan)',color:'#14b8a6'},
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
