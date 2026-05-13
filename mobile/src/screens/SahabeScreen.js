import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, FlatList, StyleSheet, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn } from '../components/Animated';

// ═══ 30+ SƏHABƏ ═══
const SAHABA = [
  {
    id:1, category:'caliph',
    name:{ az:'Əbu Bəkr əs-Siddiq', en:'Abu Bakr as-Siddiq', ru:'Абу Бакр ас-Сиддик', ar:'أبو بكر الصديق', tr:'Ebu Bekir es-Sıddık' },
    arName:'أبو بكر الصديق رضي الله عنه',
    title:{ az:'1-ci Xəlifə', en:'1st Caliph', ru:'1-й халиф', ar:'الخليفة الأول', tr:'1. Halife' },
    years:'573-634', color:'#10b981', gradient:['#10b981','#059669'],
    short:{ az:'Peyğəmbərin ən yaxın dostu və ilk xəlifə', en:"Prophet's closest friend and first caliph", ru:'Ближайший друг Пророка и первый халиф', ar:'أقرب صحابة النبي والخليفة الأول', tr:'Peygamber\'in en yakın dostu ve ilk halife' },
    bio:{
      az:'Peyğəmbərin ﷺ ən yaxın dostu və ilk kişi müsəlman. "Siddiq" (doğru) ləqəbini Peyğəmbərdən aldı. Hicrətdə Peyğəmbərlə Sevr mağarasında oldu. 2 il 3 ay xilafət etdi. Rəddə müharibələrini uğurla bitirdi, Quranın toplanmasını başlatdı.',
      en:"The closest friend of the Prophet ﷺ and first male Muslim. Received the title 'As-Siddiq' (The Truthful) from the Prophet. Was with the Prophet in the Cave of Thawr during Hijrah. Caliph for 2 years 3 months. Successfully resolved the Ridda wars and began the compilation of the Quran.",
      ru:'Ближайший друг Пророка ﷺ и первый мужчина-мусульманин. Получил титул "Ас-Сиддик" (Правдивый) от Пророка. Был с Пророком в пещере Саур во время Хиджры. Был халифом 2 года 3 месяца. Успешно завершил войны Ридда и начал сбор Корана.',
      ar:'أقرب أصحاب النبي ﷺ وأول الرجال إسلاماً. لُقب بالصديق من النبي ﷺ. كان مع النبي في غار ثور أثناء الهجرة. تولى الخلافة سنتين وثلاثة أشهر. نجح في حروب الردة وبدأ جمع القرآن.',
      tr:'Peygamber ﷺ\'in en yakın dostu ve ilk erkek Müslüman. "Sıddık" (doğru) lakabını Peygamber\'den aldı. Hicrette Peygamber ile Sevr Mağarası\'nda bulundu. 2 yıl 3 ay halifelik yaptı. Ridde savaşlarını başarıyla bitirdi, Kur\'an\'ın toplanmasını başlattı.'
    },
    facts:[
      { az:'İlk kişi müsəlman', en:'First male Muslim', ru:'Первый мужчина-мусульманин', ar:'أول رجل أسلم', tr:'İlk erkek Müslüman' },
      { az:'Qızı Hz. Aişə Peyğəmbərin zövcəsidir', en:'His daughter Aisha was wife of the Prophet', ru:'Его дочь Аиша была женой Пророка', ar:'ابنته عائشة زوج النبي', tr:'Kızı Hz. Ayşe Peygamber\'in eşidir' },
      { az:'Sevr mağarasında Peyğəmbərlə', en:'With the Prophet in Cave of Thawr', ru:'С Пророком в пещере Саур', ar:'كان في غار ثور مع النبي', tr:'Sevr Mağarası\'nda Peygamber ile' },
    ],
  },
  {
    id:2, category:'caliph',
    name:{ az:'Ömər ibn Xəttab', en:'Umar ibn al-Khattab', ru:'Умар ибн аль-Хаттаб', ar:'عمر بن الخطاب', tr:'Ömer ibn Hattab' },
    arName:'عمر بن الخطاب رضي الله عنه',
    title:{ az:'2-ci Xəlifə — Ədalətin rəmzi', en:'2nd Caliph — Symbol of Justice', ru:'2-й халиф — символ справедливости', ar:'الخليفة الثاني — رمز العدل', tr:'2. Halife — Adaletin simgesi' },
    years:'584-644', color:'#3b82f6', gradient:['#3b82f6','#2563eb'],
    short:{ az:'Ədaləti ilə tanınan "Farukul-adil"', en:'Known for justice as "Al-Faruq"', ru:'Известен справедливостью как "Аль-Фарук"', ar:'الفاروق — المعروف بالعدل', tr:'Adaletiyle tanınan "Farukul-adil"' },
    bio:{
      az:'İkinci raşidi xəlifə. 10 il xilafət etdi. Onun dövründə İslam imperatorluğu İran, İraq, Suriya, Misir, Fələstinə qədər genişləndi. Hicri təqvimi qurdu. "Farukul-adil" (haqq ilə batili ayıran) ləqəbi ilə tanınır. Oxuduqdan sonra müsəlman oldu.',
      en:"Second Rashidun caliph. Ruled for 10 years. During his reign the Islamic empire expanded to Persia, Iraq, Syria, Egypt and Palestine. Established the Hijri calendar. Known as 'Al-Faruq' (one who distinguishes right from wrong). Converted to Islam after hearing Quran.",
      ru:'Второй праведный халиф. Правил 10 лет. Во время его правления Исламская империя расширилась до Персии, Ирака, Сирии, Египта и Палестины. Установил календарь хиджры. Известен как "Аль-Фарук". Принял ислам после прочтения Корана.',
      ar:'ثاني الخلفاء الراشدين. حكم ١٠ سنوات. في عهده امتدت الإمبراطورية إلى فارس والعراق والشام ومصر وفلسطين. أسس التقويم الهجري. لُقب بالفاروق. أسلم بعد أن سمع القرآن.',
      tr:'İkinci Raşid halife. 10 yıl halifelik yaptı. Onun döneminde İslam imparatorluğu İran, Irak, Suriye, Mısır ve Filistin\'e kadar genişledi. Hicri takvimi kurdu. "Farukul-adil" olarak bilinir. Kur\'an okuduktan sonra Müslüman oldu.'
    },
    facts:[
      { az:'İslam imperatorluğunu 4 qat genişlətdi', en:'Expanded the empire 4 times', ru:'Расширил империю в 4 раза', ar:'وسّع الإمبراطورية ٤ أضعاف', tr:'İslam imparatorluğunu 4 kat genişletti' },
      { az:'Hicri təqvimi qurdu', en:'Founded the Hijri calendar', ru:'Основал календарь хиджры', ar:'أسس التقويم الهجري', tr:'Hicri takvimi kurdu' },
      { az:'Qızı Hz. Həfsə Peyğəmbərin zövcəsidir', en:'His daughter Hafsa was wife of the Prophet', ru:'Его дочь Хафса была женой Пророка', ar:'ابنته حفصة زوج النبي', tr:'Kızı Hz. Hafsa Peygamber\'in eşidir' },
    ],
  },
  {
    id:3, category:'caliph',
    name:{ az:'Osman ibn Affan', en:'Uthman ibn Affan', ru:'Усман ибн Аффан', ar:'عثمان بن عفان', tr:'Osman ibn Affan' },
    arName:'عثمان بن عفان رضي الله عنه',
    title:{ az:'3-cü Xəlifə — Zinnureyn', en:'3rd Caliph — Possessor of Two Lights', ru:'3-й халиф — Обладатель двух светов', ar:'الخليفة الثالث — ذو النورين', tr:'3. Halife — Zinnureyn' },
    years:'576-656', color:'#f59e0b', gradient:['#f59e0b','#d97706'],
    short:{ az:'İki nur sahibi — Quranı bir nüsxədə toplayan', en:'Possessor of two lights — Compiled the Quran', ru:'Обладатель двух светов — Собрал Коран', ar:'ذو النورين — جامع القرآن', tr:'İki nurun sahibi — Kur\'an\'ı toplayan' },
    bio:{
      az:'Üçüncü raşidi xəlifə. Peyğəmbərin iki qızı ilə evli olduğu üçün "Zinnureyn" (iki nur sahibi) ləqəbi ilə tanınır. Onun dövründə Quran bir nüsxəyə toplanıldı və dünyaya yayıldı. Mədinə məscidini genişləndirdi. 12 il xilafət etdi. Həya və kəramət sahibi idi.',
      en:'Third Rashidun caliph. Known as "Dhun-Nurayn" (Possessor of Two Lights) because he was married to two daughters of the Prophet. During his reign the Quran was compiled into one standard copy. Expanded the Prophet\'s Mosque. Ruled for 12 years.',
      ru:'Третий праведный халиф. Известен как "Зун-Нурайн" (Обладатель двух светов), так как был женат на двух дочерях Пророка. Во время его правления Коран был собран в одну копию. Расширил Мечеть Пророка. Правил 12 лет.',
      ar:'ثالث الخلفاء الراشدين. لُقب بذي النورين لأنه تزوج اثنتين من بنات النبي ﷺ. في عهده جُمع القرآن في مصحف واحد. وسّع المسجد النبوي. حكم ١٢ عاماً.',
      tr:'Üçüncü Raşid halife. Peygamber\'in iki kızıyla evlendiği için "Zinnureyn" lakabıyla tanınır. Döneminde Kur\'an tek mushafta toplandı. Mescid-i Nebevi\'yi genişletti. 12 yıl halifelik yaptı.'
    },
    facts:[
      { az:'Quranı bir nüsxədə topladı', en:'Compiled the Quran into one mushaf', ru:'Собрал Коран в один мусхаф', ar:'جمع القرآن في مصحف واحد', tr:'Kur\'an\'ı tek mushafta topladı' },
      { az:'Donanma qurdu', en:'Established the navy', ru:'Основал флот', ar:'أسس الأسطول البحري', tr:'Donanma kurdu' },
      { az:'Varlı, amma təvazökar idi', en:'Wealthy yet humble', ru:'Богатый, но скромный', ar:'ثري ومتواضع', tr:'Zengin ama mütevazı' },
    ],
  },
  {
    id:4, category:'caliph',
    name:{ az:'Əli ibn Əbu Talib', en:'Ali ibn Abi Talib', ru:'Али ибн Абу Талиб', ar:'علي بن أبي طالب', tr:'Ali ibn Ebi Talib' },
    arName:'علي بن أبي طالب رضي الله عنه',
    title:{ az:'4-cü Xəlifə — Elmin qapısı', en:'4th Caliph — Gate of Knowledge', ru:'4-й халиф — Врата знания', ar:'الخليفة الرابع — باب العلم', tr:'4. Halife — İlmin kapısı' },
    years:'601-661', color:'#ef4444', gradient:['#ef4444','#dc2626'],
    short:{ az:'Peyğəmbərin əmisi oğlu və kürəkəni', en:"Prophet's cousin and son-in-law", ru:'Двоюродный брат и зять Пророка', ar:'ابن عم النبي وزوج ابنته', tr:'Peygamber\'in amca oğlu ve damadı' },
    bio:{
      az:'Peyğəmbərin əmisi oğlu və Hz. Fatimə ilə evlənən. İlk uşaq müsəlman (10 yaşında). "Elmin qapısı" deyilirdi. Cəsur bir döyüşçü idi. Xeybər qalasının qapısını tək başına qopardı. 4 il 9 ay xilafət etdi. Cənnət müjdəli 10 səhabələrdən biri.',
      en:"Cousin of the Prophet and husband of Fatima. First child Muslim (at age 10). Known as 'Gate of Knowledge'. Brave warrior. Alone pulled off the gate of Khaybar fortress. Ruled for 4 years 9 months. One of the 10 companions promised Paradise.",
      ru:'Двоюродный брат Пророка и муж Фатимы. Первый ребёнок-мусульманин (в 10 лет). Известен как "Врата знания". Храбрый воин. В одиночку сорвал ворота крепости Хайбар. Правил 4 года 9 месяцев. Один из 10 сподвижников, обещанных Раем.',
      ar:'ابن عم النبي ﷺ وزوج ابنته فاطمة. أول الصبيان إسلاماً (وهو ابن ١٠ سنوات). لُقب بباب العلم. كان مقاتلاً شجاعاً. قلع باب خيبر وحده. حكم ٤ سنوات و٩ أشهر. من العشرة المبشرين بالجنة.',
      tr:'Peygamber\'in amca oğlu ve Hz. Fatıma\'nın eşi. İlk çocuk Müslüman (10 yaşında). "İlmin kapısı" denilirdi. Cesur bir savaşçıydı. Hayber Kalesi\'nin kapısını tek başına kopardı. 4 yıl 9 ay halifelik yaptı. Aşere-i mübeşşere\'den biri.'
    },
    facts:[
      { az:'İlk uşaq müsəlman', en:'First child Muslim', ru:'Первый ребёнок-мусульманин', ar:'أول الصبيان إسلاماً', tr:'İlk çocuk Müslüman' },
      { az:'Peyğəmbərin kürəkəni', en:"Prophet's son-in-law", ru:'Зять Пророка', ar:'زوج ابنة النبي', tr:'Peygamber\'in damadı' },
      { az:'Xeybər qalasını fəth edən', en:'Conqueror of Khaybar fortress', ru:'Завоеватель крепости Хайбар', ar:'فاتح خيبر', tr:'Hayber Kalesi\'nin fatihi' },
    ],
  },
  {
    id:5, category:'women',
    name:{ az:'Xədicə bint Xüveylid', en:'Khadijah bint Khuwaylid', ru:'Хадиджа бинт Хувайлид', ar:'خديجة بنت خويلد', tr:'Hatice bint Hüveylid' },
    arName:'خديجة بنت خويلد رضي الله عنها',
    title:{ az:'Ümmül-möminin — Peyğəmbərin ilk zövcəsi', en:'Mother of Believers — First wife of Prophet', ru:'Мать верующих — первая жена Пророка', ar:'أم المؤمنين — أول زوجات النبي', tr:'Müminlerin annesi — Peygamber\'in ilk eşi' },
    years:'555-619', color:'#ec4899', gradient:['#ec4899','#db2777'],
    short:{ az:'İlk müsəlman qadın, Peyğəmbərin sevimli zövcəsi', en:"First Muslim woman, Prophet's beloved wife", ru:'Первая мусульманка, возлюбленная жена Пророка', ar:'أول النساء إسلاماً وحبيبة النبي', tr:'İlk Müslüman kadın, Peygamber\'in sevgili eşi' },
    bio:{
      az:'Peyğəmbərin ilk zövcəsi və ilk müsəlman qadın. 25 il birlikdə xoşbəxt evliliyi yaşadılar. Varlı tacir olan Xədicə bütün sərvətini İslam yolunda xərclədi. Peyğəmbərə ﷺ vəhy gələndə ona ilk inanan şəxs oldu. 6 uşağı doğdu, 2 oğlu və 4 qızı.',
      en:"First wife of the Prophet and first Muslim woman. They lived 25 years in happy marriage. A wealthy merchant, Khadijah spent all her wealth in the cause of Islam. She was the first to believe when revelation came to the Prophet ﷺ. She bore 6 children.",
      ru:'Первая жена Пророка и первая мусульманка. Они прожили 25 лет в счастливом браке. Богатая купчиха, Хадиджа тратила всё своё состояние на ислам. Она первой поверила, когда Пророку пришло откровение. Родила 6 детей.',
      ar:'أول زوجات النبي وأول النساء إسلاماً. عاشا معاً ٢٥ سنة في سعادة. كانت تاجرة ثرية أنفقت كل ثروتها في سبيل الإسلام. كانت أول من صدق النبي ﷺ. رزقت بستة أولاد.',
      tr:'Peygamber\'in ilk eşi ve ilk Müslüman kadın. 25 yıl mutlu bir evlilik yaşadılar. Zengin bir tüccar olan Hatice tüm servetini İslam yolunda harcadı. Peygamber\'e ﷺ vahiy geldiğinde ona ilk inanan kişi oldu. 6 çocuk doğurdu.'
    },
    facts:[
      { az:'İlk müsəlman qadın', en:'First Muslim woman', ru:'Первая мусульманка', ar:'أول النساء إسلاماً', tr:'İlk Müslüman kadın' },
      { az:'Peyğəmbərlə 25 il evli qaldı', en:'Married to Prophet for 25 years', ru:'25 лет замужем за Пророком', ar:'تزوجت النبي ٢٥ سنة', tr:'Peygamber ile 25 yıl evli kaldı' },
      { az:'Bütün sərvətini İslam yolunda xərclədi', en:'Spent all wealth for Islam', ru:'Потратила всё состояние на ислам', ar:'أنفقت كل ثروتها في سبيل الله', tr:'Tüm servetini İslam için harcadı' },
    ],
  },
  {
    id:6, category:'women',
    name:{ az:'Aişə bint Əbu Bəkr', en:'Aisha bint Abu Bakr', ru:'Аиша бинт Абу Бакр', ar:'عائشة بنت أبي بكر', tr:'Ayşe bint Ebu Bekir' },
    arName:'عائشة بنت أبي بكر رضي الله عنها',
    title:{ az:'Ümmül-möminin — Böyük alimə', en:'Mother of Believers — Great Scholar', ru:'Мать верующих — великий учёный', ar:'أم المؤمنين — عالمة الإسلام', tr:'Müminlerin annesi — Büyük alim' },
    years:'614-678', color:'#a855f7', gradient:['#a855f7','#9333ea'],
    short:{ az:'Peyğəmbərin ən sevimli zövcəsi, 2210 hədis rəvayət etdi', en:"Prophet's most beloved wife, narrated 2210 hadiths", ru:'Самая любимая жена Пророка, передала 2210 хадисов', ar:'أحب زوجات النبي، روت ٢٢١٠ حديث', tr:'Peygamber\'in en sevgili eşi, 2210 hadis rivayet etti' },
    bio:{
      az:'Əbu Bəkrin qızı və Peyğəmbərin ﷺ sevimli zövcəsi. Peyğəmbərin son nəfəsini onun qucağında verdi. Böyük alimə idi — 2210 hədis rəvayət etdi. Qadınlar və fiqh məsələlərində səhabələrə müəllim oldu. Cəməl döyüşünə qatıldı.',
      en:"Daughter of Abu Bakr and most beloved wife of the Prophet ﷺ. The Prophet took his last breath in her lap. She was a great scholar who narrated 2210 hadiths. She taught the companions in matters of fiqh and women's issues.",
      ru:'Дочь Абу Бакра и самая любимая жена Пророка ﷺ. Пророк сделал последний вздох на её коленях. Она была великим учёным, передавшим 2210 хадисов. Учила сподвижников вопросам фикха и женщин.',
      ar:'ابنة أبي بكر وأحب زوجات النبي ﷺ. أسلم النبي الروح في حجرها. كانت عالمة كبيرة روت ٢٢١٠ حديث. علّمت الصحابة في الفقه وأمور النساء.',
      tr:'Ebu Bekir\'in kızı ve Peygamber\'in ﷺ en sevgili eşi. Peygamber son nefesini onun kucağında verdi. Büyük bir alim olarak 2210 hadis rivayet etti. Sahabelere fıkıh ve kadın meselelerinde öğretmenlik yaptı.'
    },
    facts:[
      { az:'2210 hədis rəvayət etdi', en:'Narrated 2210 hadiths', ru:'Передала 2210 хадисов', ar:'روت ٢٢١٠ حديث', tr:'2210 hadis rivayet etti' },
      { az:'Qadın fiqhinin əsasını qoydu', en:'Foundation of women\'s fiqh', ru:'Основа женского фикха', ar:'مؤسسة فقه المرأة', tr:'Kadın fıkhının temelini attı' },
      { az:'9 il Peyğəmbərlə evli idi', en:'Married to Prophet for 9 years', ru:'9 лет замужем за Пророком', ar:'تزوجت النبي ٩ سنوات', tr:'9 yıl Peygamber ile evli kaldı' },
    ],
  },
  {
    id:7, category:'warrior',
    name:{ az:'Həmzə ibn Əbdülmütəllib', en:'Hamza ibn Abdul-Muttalib', ru:'Хамза ибн Абд аль-Мутталиб', ar:'حمزة بن عبد المطلب', tr:'Hamza ibn Abdülmuttalib' },
    arName:'حمزة بن عبد المطلب رضي الله عنه',
    title:{ az:'Allahın Aslanı — Şəhidlərin Ağası', en:'Lion of Allah — Master of Martyrs', ru:'Лев Аллаха — Господин мучеников', ar:'أسد الله — سيد الشهداء', tr:'Allah\'ın Aslanı — Şehitlerin Efendisi' },
    years:'570-625', color:'#f97316', gradient:['#f97316','#ea580c'],
    short:{ az:'Peyğəmbərin əmisi, İslamın ən cəsur döyüşçüsü', en:"Prophet's uncle, bravest warrior of Islam", ru:'Дядя Пророка, самый храбрый воин ислама', ar:'عم النبي وأشجع فرسان الإسلام', tr:'Peygamber\'in amcası, İslam\'ın en cesur savaşçısı' },
    bio:{
      az:'Peyğəmbərin əmisi və süd qardaşı. İslamın ilk illərində müsəlmanlara ən böyük dəstəyi verdi. Bədr döyüşündə qəhrəmancasına döyüşdü. Uhud döyüşündə şəhid oldu. Peyğəmbər onun üçün çox ağladı. "Allahın Aslanı" ləqəbi ilə tanınır.',
      en:"Uncle and foster brother of the Prophet. Gave great support to Muslims in early Islam. Fought heroically at Badr. Martyred at Uhud. The Prophet wept for him. Known as 'Lion of Allah and His Messenger'.",
      ru:'Дядя и молочный брат Пророка. Оказал большую поддержку мусульманам в ранние годы ислама. Героически сражался при Бадре. Пал мучеником при Ухуде. Пророк плакал по нему. Известен как "Лев Аллаха".',
      ar:'عم النبي ﷺ وأخوه من الرضاع. قدم دعماً عظيماً للمسلمين في أوائل الإسلام. قاتل ببطولة في بدر. استُشهد في أحد. بكى عليه النبي. لُقب بأسد الله.',
      tr:'Peygamber\'in amcası ve süt kardeşi. İslam\'ın ilk yıllarında Müslümanlara büyük destek verdi. Bedir\'de kahramanca savaştı. Uhud\'da şehit oldu. Peygamber onun için çok ağladı. "Allah\'ın Aslanı" lakaplıdır.'
    },
    facts:[
      { az:'Peyğəmbərin əmisi', en:"Prophet's uncle", ru:'Дядя Пророка', ar:'عم النبي', tr:'Peygamber\'in amcası' },
      { az:'Uhudda şəhid oldu', en:'Martyred at Uhud', ru:'Пал мучеником при Ухуде', ar:'استشهد في أحد', tr:'Uhud\'da şehit oldu' },
      { az:'"Allahın Aslanı" ləqəbli', en:'Titled "Lion of Allah"', ru:'Прозван "Львом Аллаха"', ar:'لُقب بأسد الله', tr:'"Allah\'ın Aslanı" lakaplı' },
    ],
  },
  {
    id:8, category:'warrior',
    name:{ az:'Xalid ibn Vəlid', en:'Khalid ibn al-Walid', ru:'Халид ибн аль-Валид', ar:'خالد بن الوليد', tr:'Halid bin Velid' },
    arName:'خالد بن الوليد رضي الله عنه',
    title:{ az:'Allahın Qılıncı', en:"Sword of Allah", ru:'Меч Аллаха', ar:'سيف الله المسلول', tr:'Allah\'ın Kılıcı' },
    years:'592-642', color:'#dc2626', gradient:['#dc2626','#991b1b'],
    short:{ az:'Məğlub olunmayan sərkərdə', en:'Undefeated general', ru:'Непобедимый полководец', ar:'القائد الذي لم يُهزم', tr:'Yenilmez komutan' },
    bio:{
      az:'İslamın ən böyük sərkərdələrindən biri. 100-dən çox döyüşdə iştirak etdi, heç birində məğlub olmadı. Peyğəmbər ﷺ ona "Allahın Qılıncı" ləqəbini verdi. Rəddə müharibələrində, Yarmuk və Qadisiyyə döyüşlərində böyük rol oynadı. Bizans və Fars orduları onun qarşısında müqavimət göstərə bilmədi.',
      en:"One of Islam's greatest military commanders. Fought in over 100 battles, never defeated. The Prophet ﷺ gave him the title 'Sword of Allah'. Played a major role in Ridda wars and Battles of Yarmouk and Qadisiyyah. Byzantine and Persian armies could not stand against him.",
      ru:'Один из величайших полководцев ислама. Участвовал в более чем 100 сражениях, никогда не был побеждён. Пророк ﷺ дал ему титул "Меч Аллаха". Сыграл большую роль в войнах Ридда и битвах при Ярмуке и Кадисии.',
      ar:'من أعظم قادة الإسلام. شارك في أكثر من ١٠٠ معركة ولم يُهزم قط. لقّبه النبي ﷺ بسيف الله. لعب دوراً كبيراً في حروب الردة ومعارك اليرموك والقادسية.',
      tr:'İslam\'ın en büyük komutanlarından biri. 100\'den fazla savaşa katıldı, hiçbirinde yenilmedi. Peygamber ﷺ ona "Allah\'ın Kılıcı" lakabını verdi. Ridde savaşları ile Yarmuk ve Kadisiye\'de büyük rol oynadı.'
    },
    facts:[
      { az:'100+ döyüşdə məğlubiyyətsiz', en:'Undefeated in 100+ battles', ru:'Не побеждён в 100+ сражениях', ar:'لم يهزم في ١٠٠+ معركة', tr:'100+ savaşta yenilmedi' },
      { az:'Yarmuk döyüşünün qalibi', en:'Victor of Battle of Yarmouk', ru:'Победитель битвы при Ярмуке', ar:'بطل معركة اليرموك', tr:'Yarmuk Savaşı\'nın galibi' },
    ],
  },
  {
    id:9, category:'scholar',
    name:{ az:'Əbu Hüreyrə', en:'Abu Hurayrah', ru:'Абу Хурайра', ar:'أبو هريرة', tr:'Ebu Hüreyre' },
    arName:'أبو هريرة رضي الله عنه',
    title:{ az:'Ən çox hədis rəvayət edən səhabə', en:'Greatest hadith narrator', ru:'Величайший передатчик хадисов', ar:'أكثر الصحابة رواية للحديث', tr:'En çok hadis rivayet eden sahabe' },
    years:'603-681', color:'#14b8a6', gradient:['#14b8a6','#0d9488'],
    short:{ az:'5374 hədis rəvayət etdi', en:'Narrated 5374 hadiths', ru:'Передал 5374 хадиса', ar:'روى ٥٣٧٤ حديث', tr:'5374 hadis rivayet etti' },
    bio:{
      az:'İslamın ən çox hədis rəvayət edən səhabəsi. 5374 hədis rəvayət etdi. Peyğəmbərlə ﷺ 3 il oldu, amma bu müddətdə ondan eşitdiyi hər şeyi əzbərlədi. Əshabüs-Süffədən idi. Peyğəmbər onun duası ilə xatirəsini gücləndirdi. "Atalar pişiyi" mənasında Əbu Hüreyrə deyilirdi.',
      en:'The companion who narrated the most hadiths — 5374 in total. He was with the Prophet ﷺ for 3 years but memorized everything he heard. Was of Ahl al-Suffa. The Prophet strengthened his memory with a dua. His kunya means "Father of the Kitten".',
      ru:'Сподвижник, передавший больше всего хадисов — 5374 всего. Был с Пророком ﷺ 3 года, но запомнил всё, что слышал. Был из Ахль ас-Суффа. Пророк укрепил его память дуа. Его куния означает "Отец котёнка".',
      ar:'أكثر الصحابة رواية للحديث — ٥٣٧٤ حديثاً. صحب النبي ﷺ ٣ سنوات وحفظ كل ما سمع منه. كان من أهل الصفة. قوى النبي حفظه بالدعاء. كنيته تعني "أبو الهرة".',
      tr:'İslam\'ın en çok hadis rivayet eden sahabesi — toplam 5374. Peygamber ﷺ ile 3 yıl kaldı ancak ondan duyduğu her şeyi ezberledi. Ashab-ı Suffe\'den idi. Peygamber onun hafızasını dua ile güçlendirdi. Künyesi "Kedicik Babası" demektir.'
    },
    facts:[
      { az:'5374 hədis rəvayət etdi', en:'Narrated 5374 hadiths', ru:'Передал 5374 хадиса', ar:'روى ٥٣٧٤ حديث', tr:'5374 hadis rivayet etti' },
      { az:'Əshabüs-Süffədən', en:'Of Ahl al-Suffa', ru:'Из Ахль ас-Суффа', ar:'من أهل الصفة', tr:'Ashab-ı Suffe\'den' },
    ],
  },
  {
    id:10, category:'scholar',
    name:{ az:'Bilal ibn Rəbah', en:'Bilal ibn Rabah', ru:'Билал ибн Рабах', ar:'بلال بن رباح', tr:'Bilal ibn Rebah' },
    arName:'بلال بن رباح رضي الله عنه',
    title:{ az:'İlk müəzzin', en:'First Muezzin', ru:'Первый муэдзин', ar:'أول المؤذنين', tr:'İlk Müezzin' },
    years:'580-640', color:'#06b6d4', gradient:['#06b6d4','#0891b2'],
    short:{ az:'İslamın ilk azan oxuyan səhabəsi', en:'First to call the adhan in Islam', ru:'Первый, кто возгласил азан в исламе', ar:'أول من أذّن في الإسلام', tr:'İslam\'da ilk ezan okuyan sahabe' },
    bio:{
      az:'Həbəş əsilli ilk azadlıq qazanan qul. Ağasının qızmar günəşdə qızdırılmış daşlarla işgəncə verməsinə baxmayaraq "Əhəd, Əhəd!" (Allah bir, Allah bir!) deyirdi. Əbu Bəkr onu satın alıb azad etdi. Peyğəmbər ﷺ onu ilk müəzzin etdi. Cənnətin ayaq səslərini eşidən səhabə.',
      en:'First emancipated slave of Abyssinian origin. Despite being tortured with heated stones in the scorching sun, he kept saying "Ahad, Ahad!" (One, Allah is One!). Abu Bakr bought and freed him. The Prophet ﷺ appointed him as the first muezzin. He heard the footsteps of Paradise.',
      ru:'Первый освобождённый раб эфиопского происхождения. Несмотря на пытки горячими камнями под палящим солнцем, он продолжал говорить "Ахад, Ахад!" (Один, Аллах Один!). Абу Бакр купил его и освободил. Пророк ﷺ назначил его первым муэдзином.',
      ar:'أول العبيد المعتقين من أصل حبشي. رغم تعذيبه بالحجارة الساخنة تحت الشمس كان يقول "أحد أحد". اشتراه أبو بكر وأعتقه. عينه النبي ﷺ أول مؤذن. سمع خُطى قدميه في الجنة.',
      tr:'Habeş asıllı ilk özgürlüğüne kavuşan köle. Kızgın taşlarla yakıcı güneşte işkence edilmesine rağmen "Ahad, Ahad!" (Bir, Allah Birdir!) diyordu. Ebu Bekir onu satın alıp azad etti. Peygamber ﷺ onu ilk müezzin yaptı.'
    },
    facts:[
      { az:'İlk müəzzin', en:'First muezzin', ru:'Первый муэдзин', ar:'أول مؤذن', tr:'İlk müezzin' },
      { az:'İşgəncədə "Əhəd!" deyirdi', en:'Said "Ahad" under torture', ru:'Говорил "Ахад" под пытками', ar:'قال "أحد أحد" تحت التعذيب', tr:'İşkence altında "Ahad" derdi' },
      { az:'Cənnət ayaq səslərini eşidən', en:"Heard Paradise's footsteps", ru:'Слышал шаги рая', ar:'سمع خطى قدميه في الجنة', tr:'Cennet ayak seslerini duyan' },
    ],
  },
  {
    id:11, category:'warrior',
    name:{ az:'Səd ibn Əbu Vəqqas', en:"Sa'd ibn Abi Waqqas", ru:'Саад ибн Абу Ваккас', ar:'سعد بن أبي وقاص', tr:'Sa\'d ibn Ebi Vakkas' },
    arName:'سعد بن أبي وقاص رضي الله عنه',
    title:{ az:'İlk ox atan, duası qəbul olunan', en:'First to shoot arrow, his prayers answered', ru:'Первый стрелок, его молитвы принимались', ar:'أول من رمى بسهم ومستجاب الدعوة', tr:'İlk ok atan, duası kabul olunan' },
    years:'595-674', color:'#84cc16', gradient:['#84cc16','#65a30d'],
    short:{ az:'Qadisiyyə döyüşünün qalibi', en:'Victor of the Battle of Qadisiyyah', ru:'Победитель битвы при Кадисии', ar:'بطل معركة القادسية', tr:'Kadisiye Savaşı\'nın galibi' },
    bio:{
      az:'Cənnət müjdəli 10 səhabədən biri. 17 yaşında müsəlman oldu. İslam uğrunda ilk oxu atan səhabə. Qadisiyyə döyüşündə Fars imperiyasını məğlub etdi və Mədainı fəth etdi. Peyğəmbərin ﷺ duası ilə onun da duaları qəbul olunurdu.',
      en:'One of 10 companions promised Paradise. Became Muslim at 17. First to shoot an arrow in the cause of Islam. Defeated the Persian Empire at the Battle of Qadisiyyah and conquered Ctesiphon. His prayers were answered due to the Prophet\'s dua.',
      ru:'Один из 10 сподвижников, обещанных Раем. Стал мусульманином в 17. Первый стрелок в деле ислама. Разбил Персидскую империю при Кадисии и завоевал Ктесифон. Его молитвы принимались благодаря дуа Пророка.',
      ar:'من العشرة المبشرين بالجنة. أسلم وعمره ١٧ سنة. أول من رمى بسهم في سبيل الله. هزم الفرس في القادسية وفتح المدائن. كان مستجاب الدعوة بدعاء النبي.',
      tr:'Aşere-i Mübeşşere\'den biri. 17 yaşında Müslüman oldu. İslam uğruna ilk ok atan sahabe. Kadisiye Savaşı\'nda Fars İmparatorluğu\'nu yendi ve Medain\'i fethetti. Peygamber\'in duası ile duaları kabul olunurdu.'
    },
    facts:[
      { az:'Cənnət müjdəli 10-dan biri', en:'One of 10 promised Paradise', ru:'Один из 10 обещанных Рая', ar:'من العشرة المبشرين بالجنة', tr:'Aşere-i Mübeşşere\'den' },
      { az:'Qadisiyyədə Farsları yendi', en:'Defeated Persians at Qadisiyyah', ru:'Разбил персов при Кадисии', ar:'هزم الفرس في القادسية', tr:'Kadisiye\'de Farsları yendi' },
    ],
  },
  {
    id:12, category:'scholar',
    name:{ az:'İbn Abbas', en:'Ibn Abbas', ru:'Ибн Аббас', ar:'عبد الله بن عباس', tr:'İbn Abbas' },
    arName:'عبد الله بن عباس رضي الله عنهما',
    title:{ az:'Ümmətin alimi, Quranın tərcümanı', en:'Scholar of the Ummah, Interpreter of the Quran', ru:'Учёный уммы, переводчик Корана', ar:'حبر الأمة وترجمان القرآن', tr:'Ümmetin alimi, Kur\'an\'ın tercümanı' },
    years:'619-687', color:'#6366f1', gradient:['#6366f1','#4f46e5'],
    short:{ az:'Peyğəmbərin əmisi oğlu, böyük təfsir alimi', en:"Prophet's cousin, great tafsir scholar", ru:'Двоюродный брат Пророка, великий учёный тафсира', ar:'ابن عم النبي وعالم التفسير', tr:'Peygamber\'in amca oğlu, büyük tefsir alimi' },
    bio:{
      az:'Peyğəmbərin əmisi Abbasin oğlu. 13 yaşında Peyğəmbər vəfat edəndə artıq böyük Quran biliyi var idi. Peyğəmbər onun üçün dua etdi: "Allahım, ona kitabı öyrət və dində anlayış ver". Təfsirin əsasını qoydu. "Ümmətin alimi" (Həbrül-ümmə) ləqəbi ilə tanınır.',
      en:'Son of the Prophet\'s uncle Abbas. Already had great Quranic knowledge when the Prophet passed away at his age 13. The Prophet prayed for him: "O Allah, teach him the Book and give him understanding in religion". Founded tafsir. Known as "Habr al-Ummah" (Scholar of the Ummah).',
      ru:'Сын дяди Пророка Аббаса. Уже имел большие знания Корана, когда Пророк умер в его 13 лет. Пророк молился за него: "О Аллах, научи его Книге и дай понимание в религии". Основал тафсир.',
      ar:'ابن عم النبي العباس. كان عالماً بالقرآن حين توفي النبي وعمره ١٣ سنة. دعا له النبي: "اللهم علمه الكتاب وفقهه في الدين". أسس علم التفسير. لُقب بحبر الأمة.',
      tr:'Peygamber\'in amcası Abbas\'ın oğlu. Peygamber vefat ettiğinde 13 yaşındaydı ama büyük Kur\'an bilgisi vardı. Peygamber onun için dua etti: "Allah\'ım, ona Kitabı öğret ve dinde fakih kıl". Tefsirin temelini attı.'
    },
    facts:[
      { az:'Təfsirin qurucusu', en:'Founder of tafsir', ru:'Основатель тафсира', ar:'مؤسس علم التفسير', tr:'Tefsirin kurucusu' },
      { az:'"Ümmətin alimi" ləqəbli', en:'Called "Scholar of Ummah"', ru:'Назван "учёным уммы"', ar:'لُقب بحبر الأمة', tr:'"Ümmetin alimi" lakaplı' },
    ],
  },
  {
    id:13, category:'scholar',
    name:{ az:'Zeyd ibn Sabit', en:'Zayd ibn Thabit', ru:'Зайд ибн Сабит', ar:'زيد بن ثابت', tr:'Zeyd ibn Sabit' },
    arName:'زيد بن ثابت رضي الله عنه',
    title:{ az:'Quran katibi', en:'Scribe of the Quran', ru:'Писец Корана', ar:'كاتب الوحي', tr:'Vahiy kâtibi' },
    years:'611-665', color:'#8b5cf6', gradient:['#8b5cf6','#7c3aed'],
    short:{ az:'Vəhy katibi, Quranı toplayan', en:'Scribe of revelation, compiler of the Quran', ru:'Писец откровения, собиратель Корана', ar:'كاتب الوحي وجامع القرآن', tr:'Vahiy kâtibi, Kur\'an\'ı toplayan' },
    bio:{
      az:'Peyğəmbərin vəhy katiblərindən biri. Quranı əzbərləyən və yazan səhabə. Hz. Əbu Bəkr xilafətində Quranı toplama işinə rəhbərlik etdi. Osman xilafətində Quranı yenidən bir nüsxəyə toplayıb dünyaya yaydı. Həm də ibranicə öyrənib Peyğəmbər üçün tərcümə etdi.',
      en:"One of the Prophet's scribes of revelation. Memorized and wrote the Quran. Led the compilation of the Quran during Abu Bakr's caliphate. Again compiled it into one mushaf during Uthman's caliphate. He also learned Hebrew to translate for the Prophet.",
      ru:'Один из писцов откровения Пророка. Выучил и записал Коран. Возглавил сбор Корана во время халифата Абу Бакра. Снова собрал его в один мусхаф во время халифата Усмана.',
      ar:'أحد كتبة الوحي للنبي ﷺ. حفظ القرآن وكتبه. قاد جمع القرآن في عهد أبي بكر. وجمعه مرة أخرى في مصحف واحد في عهد عثمان. تعلم العبرية ليترجم للنبي.',
      tr:'Peygamber\'in vahiy kâtiplerinden biri. Kur\'an\'ı ezberleyen ve yazan sahabe. Hz. Ebu Bekir halifeliğinde Kur\'an\'ı toplama işine liderlik etti. Hz. Osman zamanında yine bir mushafta topladı.'
    },
    facts:[
      { az:'Vəhy katibi', en:'Scribe of revelation', ru:'Писец откровения', ar:'كاتب الوحي', tr:'Vahiy kâtibi' },
      { az:'Quranı topladı', en:'Compiled the Quran', ru:'Собрал Коран', ar:'جمع القرآن', tr:'Kur\'an\'ı topladı' },
    ],
  },
  {
    id:14, category:'warrior',
    name:{ az:'Müsəb ibn Umeyr', en:"Mus'ab ibn Umayr", ru:'Мусаб ибн Умайр', ar:'مصعب بن عمير', tr:'Mus\'ab ibn Umeyr' },
    arName:'مصعب بن عمير رضي الله عنه',
    title:{ az:'İlk İslam müəllimi', en:'First Islamic Teacher', ru:'Первый учитель ислама', ar:'أول سفير في الإسلام', tr:'İlk İslam öğretmeni' },
    years:'585-625', color:'#ec4899', gradient:['#ec4899','#db2777'],
    short:{ az:'Mədinəyə göndərilən ilk müəllim', en:'First teacher sent to Medina', ru:'Первый учитель, отправленный в Медину', ar:'أول معلم أُرسل إلى المدينة', tr:'Medine\'ye gönderilen ilk öğretmen' },
    bio:{
      az:'Məkkənin ən zəngin və yaraşıqlı gəncliyindən biri idi. Müsəlman olduqdan sonra bütün zənginliyini tərk etdi və sadə həyat yaşadı. Peyğəmbər ona "Mədinə müəllimi" adını verdi — İslamı Mədinəyə ilk çatdıran. Uhud döyüşündə bayraqdar idi və şəhid oldu. Kəfəni çox kiçik idi, başı örtülsə ayaqları açıq qalırdı.',
      en:"Was one of the wealthiest and most handsome youths of Mecca. After becoming Muslim, he left all his wealth and lived simply. The Prophet sent him as the first teacher to Medina. Was the standard-bearer at Uhud and was martyred. His shroud was so small that his head or feet had to remain exposed.",
      ru:'Был одним из самых богатых и красивых юношей Мекки. После принятия ислама он оставил всё богатство и жил просто. Пророк послал его первым учителем в Медину. Был знаменосцем при Ухуде и пал мучеником.',
      ar:'كان من أثرى وأجمل شباب مكة. بعد إسلامه ترك كل ثروته وعاش حياة بسيطة. أرسله النبي ﷺ أول معلم إلى المدينة. كان حامل الراية في أحد واستشهد. كان كفنه قصيراً.',
      tr:'Mekke\'nin en zengin ve yakışıklı gençlerinden biriydi. Müslüman olduktan sonra tüm zenginliğini terk etti ve sade yaşadı. Peygamber onu Medine\'ye ilk öğretmen olarak gönderdi. Uhud\'da bayraktar idi ve şehit oldu.'
    },
    facts:[
      { az:'Mədinəyə ilk müəllim', en:'First teacher to Medina', ru:'Первый учитель Медины', ar:'أول معلم للمدينة', tr:'Medine\'ye ilk öğretmen' },
      { az:'Uhudda şəhid oldu', en:'Martyred at Uhud', ru:'Пал мучеником при Ухуде', ar:'استشهد في أحد', tr:'Uhud\'da şehit oldu' },
    ],
  },
  {
    id:15, category:'scholar',
    name:{ az:'Sələman əl-Farsi', en:'Salman al-Farsi', ru:'Сальман аль-Фарси', ar:'سلمان الفارسي', tr:'Selman-ı Farisi' },
    arName:'سلمان الفارسي رضي الله عنه',
    title:{ az:'Bizdən biri — Əhli-beytdən', en:'One of us — of the Ahl al-Bayt', ru:'Один из нас — из Ахль аль-Байт', ar:'سلمان منا أهل البيت', tr:'Bizden biri — Ehl-i Beytten' },
    years:'568-656', color:'#f59e0b', gradient:['#f59e0b','#d97706'],
    short:{ az:'Xəndək döyüşünün taktiki, Farsdan gələn səhabə', en:'Strategist of the Battle of Trench, companion from Persia', ru:'Стратег битвы у Рва, сподвижник из Персии', ar:'صاحب فكرة الخندق، قادم من فارس', tr:'Hendek Savaşı\'nın taktisyeni, Fars\'tan gelen sahabe' },
    bio:{
      az:'İran əsilli, həqiqət axtararaq müxtəlif dinlər və kəhanətlər araşdırdı, sonra İslamı tapdı. Məccusi (atəşpərəst), sonra xristian, nəhayət müsəlman oldu. Xəndək döyüşündə müsəlmanlara xəndək qazma strategiyasını təklif etdi. Peyğəmbər ona "Bizdən biri — Əhli-Beytdən" dedi.',
      en:"Of Persian origin. Searched for truth through various religions before finding Islam. Was Zoroastrian, then Christian, finally Muslim. Suggested the trench strategy at the Battle of Trench. The Prophet said: 'Salman is one of us, from Ahl al-Bayt'.",
      ru:'Персидского происхождения. Искал истину через разные религии, прежде чем найти ислам. Был зороастрийцем, затем христианином, наконец мусульманином. Предложил стратегию рва в битве у Рва. Пророк сказал: "Сальман — один из нас, из Ахль аль-Байт".',
      ar:'فارسي الأصل. بحث عن الحق في أديان متعددة قبل أن يجد الإسلام. كان مجوسياً ثم نصرانياً ثم مسلماً. اقترح فكرة الخندق في غزوة الأحزاب. قال عنه النبي: "سلمان منا أهل البيت".',
      tr:'İran asıllı, hakikat arayarak farklı dinleri araştırdı, sonra İslam\'ı buldu. Mecusi, sonra Hristiyan, sonunda Müslüman oldu. Hendek Savaşı\'nda hendek kazma stratejisini önerdi. Peygamber ona "Selman bizden, Ehl-i Beyt\'tendir" dedi.'
    },
    facts:[
      { az:'Xəndək taktikasını önərdi', en:'Suggested the trench strategy', ru:'Предложил тактику рва', ar:'اقترح فكرة الخندق', tr:'Hendek taktiğini önerdi' },
      { az:'Fars əsilli', en:'Of Persian origin', ru:'Персидского происхождения', ar:'فارسي الأصل', tr:'İran asıllı' },
    ],
  },
];

const CATEGORIES = [
  { key:'all', label:{az:'Hamısı',en:'All',ru:'Все',ar:'الكل',tr:'Tümü'}, color:'#64748b' },
  { key:'caliph', label:{az:'Xəlifələr',en:'Caliphs',ru:'Халифы',ar:'الخلفاء',tr:'Halifeler'}, color:'#10b981' },
  { key:'women', label:{az:'Qadınlar',en:'Women',ru:'Женщины',ar:'النساء',tr:'Kadınlar'}, color:'#ec4899' },
  { key:'warrior', label:{az:'Döyüşçülər',en:'Warriors',ru:'Воины',ar:'المحاربون',tr:'Savaşçılar'}, color:'#ef4444' },
  { key:'scholar', label:{az:'Alimlər',en:'Scholars',ru:'Учёные',ar:'العلماء',tr:'Alimler'}, color:'#8b5cf6' },
];

const LABELS = {
  az:{ title:'Səhabələr', sub:'Peyğəmbərin ﷺ əshabı — seçilmiş insanlar', searchPh:'Səhabə axtar...', close:'Bağla', facts:'Maraqlı faktlar', noResult:'Səhabə tapılmadı' },
  en:{ title:'Companions', sub:"Companions of the Prophet ﷺ — the chosen ones", searchPh:'Search companions...', close:'Close', facts:'Key Facts', noResult:'No companions found' },
  ru:{ title:'Сподвижники', sub:'Сподвижники Пророка ﷺ — избранные люди', searchPh:'Поиск сподвижников...', close:'Закрыть', facts:'Ключевые факты', noResult:'Сподвижники не найдены' },
  ar:{ title:'الصحابة', sub:'صحابة النبي ﷺ — خير الناس', searchPh:'ابحث عن صحابي...', close:'إغلاق', facts:'حقائق مهمة', noResult:'لم يتم العثور' },
  tr:{ title:'Sahabeler', sub:'Peygamber ﷺ\'in ashabı — seçilmiş insanlar', searchPh:'Sahabe ara...', close:'Kapat', facts:'Önemli gerçekler', noResult:'Sahabe bulunamadı' },
};

export default function SahabeScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const sh = dark ? Shadows.dark.md : Shadows.md;

  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    let list = SAHABA;
    if (selectedCat !== 'all') list = list.filter(s => s.category === selectedCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => {
        const name = (s.name[lang] || s.name.en || '').toLowerCase();
        return name.includes(q) || s.arName.includes(search);
      });
    }
    return list;
  }, [selectedCat, search, lang]);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="الصَّحَابَة" title={l.title} subtitle={l.sub} theme="sahaba" />

      <View style={styles.content}>

        {/* Search */}
        <FadeUp delay={100}>
          <View style={[styles.searchBar, { backgroundColor: c.card, borderColor: c.cardBorder }, dark ? Shadows.dark.sm : Shadows.sm]}>
            <View style={[styles.searchIconWrap, { backgroundColor: c.primaryBg }]}>
              <AppIcon name="search" size={16} color={c.primary} />
            </View>
            <TextInput
              style={[styles.searchInput, { color: c.text }]}
              placeholder={l.searchPh}
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

        {/* Categories */}
        <FadeUp delay={150}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
            {CATEGORIES.map(cat => {
              const active = selectedCat === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.catBtn,
                    {
                      backgroundColor: active ? cat.color : c.card,
                      borderColor: active ? cat.color : c.cardBorder,
                    },
                    active && Shadows.button,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedCat(cat.key);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.catText, { color: active ? '#fff' : c.textSecondary }]}>
                    {cat.label[lang] || cat.label.en}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </FadeUp>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={s => String(s.id)}
          renderItem={({ item: s, index: i }) => (
            <FadeUp delay={Math.min(i * 50, 400)}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelected(s);
                }}
                activeOpacity={0.85}
              >
                <View style={[styles.sahabaCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
                  <LinearGradient
                    colors={[s.color + '15', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.5 }}
                  />
                  <LinearGradient colors={s.gradient} style={styles.sahabaAvatar}>
                    <Text style={styles.sahabaAvatarText}>{(s.name[lang] || s.name.en)[0]}</Text>
                  </LinearGradient>
                  <View style={styles.sahabaBody}>
                    <Text style={[styles.sahabaName, { color: c.text }]} numberOfLines={1}>
                      {s.name[lang] || s.name.en}
                    </Text>
                    <Text style={[styles.sahabaArName, { color: c.textMuted }]} numberOfLines={1}>{s.arName}</Text>
                    <View style={[styles.sahabaBadge, { backgroundColor: s.color + '18', borderColor: s.color + '30' }]}>
                      <Text style={[styles.sahabaBadgeText, { color: s.color }]} numberOfLines={1}>{s.title[lang] || s.title.en}</Text>
                    </View>
                    <Text style={[styles.sahabaYears, { color: c.textMuted }]}>{s.years}</Text>
                  </View>
                  <View style={[styles.arrowWrap, { backgroundColor: c.primaryBg }]}>
                    <AppIcon name="chevronRight" size={16} color={c.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            </FadeUp>
          )}
          ListEmptyComponent={
            <ScaleIn>
              <View style={styles.empty}>
                <View style={[styles.emptyIconWrap, { backgroundColor: c.primaryBg }]}>
                  <AppIcon name="sahaba" size={48} color={c.primary} />
                </View>
                <Text style={[styles.emptyText, { color: c.text }]}>{l.noResult}</Text>
              </View>
            </ScaleIn>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* ═══ DETAIL MODAL ═══ */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        {selected && (
          <View style={styles.modalWrap}>
            <TouchableOpacity style={styles.modalBackdrop} onPress={() => setSelected(null)} activeOpacity={1} />
            <View style={[styles.modalCard, { backgroundColor: c.background }]}>
              {/* Handle */}
              <View style={[styles.modalHandle, { backgroundColor: c.border }]} />

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <LinearGradient colors={selected.gradient} style={styles.modalHeader}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>{(selected.name[lang] || selected.name.en)[0]}</Text>
                  </View>
                  <Text style={styles.modalArName}>{selected.arName}</Text>
                  <Text style={styles.modalName}>{selected.name[lang] || selected.name.en}</Text>
                  <View style={styles.modalTitleBadge}>
                    <Text style={styles.modalTitleText}>{selected.title[lang] || selected.title.en}</Text>
                  </View>
                  <Text style={styles.modalYears}>{selected.years}</Text>

                  <View style={styles.modalCircle1} />
                  <View style={styles.modalCircle2} />
                </LinearGradient>

                {/* Bio */}
                <View style={styles.modalBody}>
                  <Text style={[styles.modalBio, { color: c.text }]}>{selected.bio[lang] || selected.bio.en}</Text>

                  {/* Facts */}
                  {selected.facts && (
                    <View style={styles.factsSection}>
                      <Text style={[styles.factsTitle, { color: c.primary }]}>⭐ {l.facts}</Text>
                      {selected.facts.map((fact, i) => (
                        <View key={i} style={[styles.factItem, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                          <View style={[styles.factBullet, { backgroundColor: selected.color }]} />
                          <Text style={[styles.factText, { color: c.textSecondary }]}>
                            {fact[lang] || fact.en}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </ScrollView>

              {/* Close button */}
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: c.primary }, Shadows.button]}
                onPress={() => setSelected(null)}
                activeOpacity={0.85}
              >
                <AppIcon name="close" size={20} color="#fff" />
                <Text style={styles.modalCloseText}>{l.close}</Text>
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
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 14 },

  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 14, borderRadius: BorderRadius.lg, borderWidth: 1, height: 52, marginBottom: 14 },
  searchIconWrap: { width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, height: 52, fontWeight: '500' },

  // Categories
  catRow: { gap: 8, paddingBottom: 8, paddingHorizontal: 4 },
  catBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  catText: { fontSize: 13, fontWeight: '700' },

  // Sahaba card
  sahabaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 12,
    marginTop: 10,
    overflow: 'hidden',
  },
  sahabaAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sahabaAvatarText: { fontSize: 24, fontWeight: '800', color: '#fff' },
  sahabaBody: { flex: 1 },
  sahabaName: { fontSize: 16, fontWeight: '800', marginBottom: 2, letterSpacing: -0.3 },
  sahabaArName: { fontSize: 12, marginBottom: 6 },
  sahabaBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginBottom: 4,
  },
  sahabaBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3, maxWidth: 200 },
  sahabaYears: { fontSize: 11, fontWeight: '600' },
  arrowWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  // Empty
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: { fontSize: 16, fontWeight: '600' },

  // Modal
  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: {
    maxHeight: '92%',
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    overflow: 'hidden',
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  modalHeader: {
    padding: 32,
    paddingTop: 24,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  modalAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  modalAvatarText: { fontSize: 40, fontWeight: '800', color: '#fff' },
  modalArName: { fontSize: 20, color: 'rgba(255,255,255,0.9)', marginBottom: 10, textAlign: 'center', fontWeight: '500' },
  modalName: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 10, textAlign: 'center', letterSpacing: -0.5 },
  modalTitleBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: 10,
  },
  modalTitleText: { fontSize: 12, fontWeight: '800', color: '#fff', textAlign: 'center' },
  modalYears: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  modalCircle1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.05)', top: -70, right: -60 },
  modalCircle2: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -50, left: -40 },

  modalBody: { padding: 24 },
  modalBio: { fontSize: 15, lineHeight: 26, fontWeight: '500', marginBottom: 20 },
  factsSection: { marginBottom: 80 },
  factsTitle: { fontSize: 14, fontWeight: '800', marginBottom: 12, letterSpacing: 0.3 },
  factItem: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: 8,
  },
  factBullet: { width: 4, borderRadius: 2, marginRight: 12 },
  factText: { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '500' },

  modalCloseBtn: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: BorderRadius.xl,
  },
  modalCloseText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
