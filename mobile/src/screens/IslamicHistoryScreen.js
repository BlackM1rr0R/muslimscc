import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn } from '../components/Animated';

// ═══ Geniş tarixi hadisələr ═══
const EVENTS = [
  // Peyğəmbərlik dövrü (570-632)
  { year:'570', era:'prophet', color:'#10b981', icon:'star',
    title:{ az:'Peyğəmbərin doğumu', en:'Birth of the Prophet ﷺ', ru:'Рождение Пророка ﷺ', ar:'مولد النبي ﷺ', tr:'Peygamber\'in doğumu ﷺ' },
    desc:{ az:'Hz. Muhəmməd ﷺ Məkkədə Rəbiüləvvəl ayında doğuldu. Atası Abdullah anası hamilə ikən vəfat etmişdi.', en:'Prophet Muhammad ﷺ was born in Mecca in the month of Rabi al-Awwal. His father Abdullah had passed away while his mother was pregnant.', ru:'Пророк Мухаммад ﷺ родился в Мекке в месяц Раби аль-авваль. Его отец Абдуллах умер, когда мать была беременна.', ar:'وُلد النبي محمد ﷺ في مكة في شهر ربيع الأول. كان والده عبد الله قد توفي أثناء حمل والدته.', tr:'Hz. Muhammed ﷺ Mekke\'de Rebiülevvel ayında doğdu. Babası Abdullah annesi hamileyken vefat etmişti.' } },
  { year:'576', era:'prophet', color:'#10b981', icon:'heart',
    title:{ az:'Anası Aminənin vəfatı', en:'Death of mother Amina', ru:'Смерть матери Амины', ar:'وفاة الأم آمنة', tr:'Annesi Amine\'nin vefatı' },
    desc:{ az:'Peyğəmbər ﷺ 6 yaşında ikən anası Amina vəfat etdi. Əbvadan Məkkəyə qayıdarkən yolda dünyasını dəyişdi.', en:'When the Prophet ﷺ was 6, his mother Amina passed away on their way back from Abwa to Mecca.', ru:'Когда Пророку ﷺ было 6 лет, его мать Амина умерла по пути из Абва в Мекку.', ar:'توفيت أمه آمنة وهو في السادسة من عمره في طريق عودتهما من الأبواء.', tr:'Peygamber ﷺ 6 yaşındayken annesi Amine Ebva\'dan Mekke\'ye dönerken vefat etti.' } },
  { year:'610', era:'prophet', color:'#10b981', icon:'quran',
    title:{ az:'İlk vəhy — Hira mağarası', en:'First revelation — Cave of Hira', ru:'Первое откровение — пещера Хира', ar:'أول وحي — غار حراء', tr:'İlk vahiy — Hira Mağarası' },
    desc:{ az:'Ramazan ayında Cəbrayıl ﷺ Hira mağarasında ilk vəhyi gətirdi: "Oxu Rəbbinin adı ilə". Bu, "İqra" surəsinin ilk 5 ayəsi idi.', en:'In Ramadan, Angel Jibril brought the first revelation in the Cave of Hira: "Read in the name of your Lord". These were the first 5 verses of Surah Al-Alaq.', ru:'В Рамадан ангел Джибриль принёс первое откровение в пещере Хира: "Читай во имя твоего Господа". Это были первые 5 аятов суры Аль-Алак.', ar:'في رمضان جاء جبريل عليه السلام بأول وحي في غار حراء: "اقرأ باسم ربك". هي أول ٥ آيات من سورة العلق.', tr:'Ramazan ayında Cebrail ﷺ Hira Mağarası\'nda ilk vahyi getirdi: "Rabbinin adıyla oku". Alâk suresinin ilk 5 ayetiydi.' } },
  { year:'613', era:'prophet', color:'#10b981', icon:'prayer',
    title:{ az:'Açıq dəvətin başlanması', en:'Beginning of public preaching', ru:'Начало открытой проповеди', ar:'بداية الدعوة الجهرية', tr:'Açık davetin başlangıcı' },
    desc:{ az:'3 ildən sonra Səfa təpəsindən açıq dəvətə başlandı. Müşriklərdən çox şiddətli müqavimət gəldi.', en:'After 3 years of secret preaching, the public call began from Mount Safa. It was met with fierce opposition from the polytheists.', ru:'После 3 лет тайной проповеди открытый призыв начался с горы Сафа, вызвав яростное сопротивление язычников.', ar:'بعد ٣ سنوات من الدعوة السرية، بدأت الدعوة الجهرية من جبل الصفا. لاقت معارضة شديدة من المشركين.', tr:'3 yıllık gizli davetten sonra açık davet Safa Tepesi\'nden başladı. Müşriklerden şiddetli bir muhalefet geldi.' } },
  { year:'615', era:'prophet', color:'#10b981', icon:'map',
    title:{ az:'Həbəşistana hicrət', en:'Migration to Abyssinia', ru:'Переселение в Абиссинию', ar:'الهجرة إلى الحبشة', tr:'Habeşistan\'a hicret' },
    desc:{ az:'Müşriklərin təzyiqindən qaçan müsəlmanlar Hz. Cəfərin rəhbərliyi altında Həbəşistana sığındılar. Kral Nəcaşi onlara sığınacaq verdi.', en:'Fleeing persecution, Muslims under Jafar\'s leadership sought refuge in Abyssinia. King Negus (An-Najashi) granted them asylum.', ru:'Скрываясь от преследований, мусульмане во главе с Джафаром нашли убежище в Абиссинии. Царь Негус предоставил им защиту.', ar:'هاجر المسلمون إلى الحبشة بقيادة جعفر بن أبي طالب فراراً من اضطهاد قريش. استقبلهم النجاشي.', tr:'Baskılardan kaçan Müslümanlar Hz. Cafer\'in liderliğinde Habeşistan\'a sığındılar. Kral Necaşi onlara sığınma verdi.' } },
  { year:'619', era:'prophet', color:'#10b981', icon:'moon',
    title:{ az:'İsra və Merac', en:"Isra and Mi'raj", ru:'Ночное путешествие', ar:'الإسراء والمعراج', tr:'İsra ve Mirac' },
    desc:{ az:'Peyğəmbər ﷺ Məsciddən-Harama Məscidül-Əqsaya, oradan da 7 göyə səyahət etdi. 5 vaxt namaz bu gecədə fərz oldu.', en:'The Prophet ﷺ travelled from Masjid al-Haram to Al-Aqsa, then ascended through 7 heavens. The 5 daily prayers were prescribed on this night.', ru:'Пророк ﷺ совершил путешествие из Аль-Харам в Аль-Аксу, затем поднялся через 7 небес. В эту ночь были предписаны 5 ежедневных молитв.', ar:'أسري بالنبي ﷺ من المسجد الحرام إلى المسجد الأقصى، ثم عُرج به إلى السماء. فُرضت الصلوات الخمس في تلك الليلة.', tr:'Peygamber ﷺ Mescid-i Haram\'dan Mescid-i Aksa\'ya gitti, oradan 7 kat semaya yükseldi. 5 vakit namaz bu gece farz kılındı.' } },
  { year:'619', era:'prophet', color:'#10b981', icon:'heart',
    title:{ az:'Kədər ili', en:'Year of Sorrow', ru:'Год печали', ar:'عام الحزن', tr:'Hüzün yılı' },
    desc:{ az:'Hz. Xədicə və Əbu Talib bir ildə vəfat etdilər. Peyğəmbər ﷺ bu ilə "Kədər ili" adı verdi.', en:'Khadijah and Abu Talib passed away in the same year. The Prophet ﷺ called this "The Year of Sorrow".', ru:'В один год умерли Хадиджа и Абу Талиб. Пророк ﷺ назвал этот год "годом печали".', ar:'توفيت خديجة وأبو طالب في نفس السنة. وسمى النبي ﷺ هذه السنة "عام الحزن".', tr:'Hz. Hatice ve Ebu Talib aynı yıl vefat ettiler. Peygamber ﷺ bu yıla "Hüzün Yılı" adını verdi.' } },
  { year:'622', era:'medina', color:'#3b82f6', icon:'location',
    title:{ az:'Mədinəyə hicrət', en:'Migration to Medina', ru:'Хиджра в Медину', ar:'الهجرة إلى المدينة', tr:'Medine\'ye hicret' },
    desc:{ az:'Peyğəmbər ﷺ və Əbu Bəkr Məkkədən Mədinəyə hicrət etdilər. Bu, İslam təqviminin başlanğıcı oldu.', en:'Prophet ﷺ and Abu Bakr migrated from Mecca to Medina. This marks the beginning of the Islamic calendar.', ru:'Пророк ﷺ и Абу Бакр совершили хиджру из Мекки в Медину. Это начало исламского календаря.', ar:'هاجر النبي ﷺ مع أبي بكر من مكة إلى المدينة. وبدأ التقويم الهجري من هذا الحدث.', tr:'Peygamber ﷺ ve Hz. Ebu Bekir Mekke\'den Medine\'ye hicret ettiler. Bu, Hicri takvimin başlangıcı oldu.' } },
  { year:'624', era:'medina', color:'#3b82f6', icon:'star',
    title:{ az:'Bədr döyüşü', en:'Battle of Badr', ru:'Битва при Бадре', ar:'غزوة بدر', tr:'Bedir Savaşı' },
    desc:{ az:'313 müsəlman 1000 nəfərlik Məkkə ordusuna qalib gəldi. Bu, İslamın ilk böyük zəfəri idi.', en:'313 Muslims defeated the 1000-strong Meccan army. This was the first major victory for Islam.', ru:'313 мусульман победили 1000-ю мекканскую армию. Это была первая крупная победа ислама.', ar:'هزم ٣١٣ مسلماً جيش قريش الذي كان قوامه ألف مقاتل. كان أول نصر كبير للإسلام.', tr:'313 Müslüman 1000 kişilik Mekke ordusunu yendi. Bu, İslam\'ın ilk büyük zaferiydi.' } },
  { year:'625', era:'medina', color:'#3b82f6', icon:'star',
    title:{ az:'Uhud döyüşü', en:'Battle of Uhud', ru:'Битва при Ухуде', ar:'غزوة أحد', tr:'Uhud Savaşı' },
    desc:{ az:'Məkkəlilər intiqam almaq üçün 3000 nəfərlə gəldilər. Oxçular əmrə itaətsizlik göstərdiyindən müsəlmanlar çətinlik çəkdilər. Hz. Həmzə şəhid oldu.', en:'The Meccans came with 3000 men seeking revenge. Due to the archers disobeying orders, Muslims faced hardship. Hamza was martyred.', ru:'Мекканцы пришли с 3000 людей за местью. Из-за непослушания лучников мусульмане столкнулись с трудностями. Хамза был убит.', ar:'جاء المشركون بثلاثة آلاف مقاتل للانتقام. وبسبب عصيان الرماة، واجه المسلمون صعوبة. واستشهد حمزة.', tr:'Mekkeliler intikam için 3000 kişiyle geldiler. Okçuların emre itaatsizliği yüzünden Müslümanlar zorluk çektiler. Hz. Hamza şehit oldu.' } },
  { year:'627', era:'medina', color:'#3b82f6', icon:'star',
    title:{ az:'Xəndək döyüşü', en:'Battle of the Trench', ru:'Битва у Рва', ar:'غزوة الخندق', tr:'Hendek Savaşı' },
    desc:{ az:'Sələman Farsın təklifi ilə Mədinənin ətrafında xəndək qazıldı. 10,000 nəfərlik konfederasiya ordusu geri çəkilməyə məcbur oldu.', en:'On Salman al-Farsi\'s suggestion, a trench was dug around Medina. The 10,000-strong confederate army was forced to retreat.', ru:'По предложению Сальмана аль-Фарси был вырыт ров вокруг Медины. 10,000-я армия союзников была вынуждена отступить.', ar:'بناءً على اقتراح سلمان الفارسي حُفر خندق حول المدينة. اضطر جيش الأحزاب المكون من ١٠ آلاف للانسحاب.', tr:'Selman-ı Farisi\'nin önerisiyle Medine etrafına hendek kazıldı. 10,000 kişilik müttefik ordu geri çekilmek zorunda kaldı.' } },
  { year:'628', era:'medina', color:'#3b82f6', icon:'duas',
    title:{ az:'Hüdeybiyyə sülhü', en:'Treaty of Hudaybiyyah', ru:'Худайбийский договор', ar:'صلح الحديبية', tr:'Hudeybiye Antlaşması' },
    desc:{ az:'Peyğəmbər ﷺ və Qüreyş arasında 10 illik sülh imzalandı. Görünüşdə müsəlmanların əleyhinə olsa da, bu, İslamın sürətlə yayılmasına səbəb oldu.', en:'A 10-year peace treaty was signed between the Prophet ﷺ and Quraysh. Though it seemed unfavorable, it led to the rapid spread of Islam.', ru:'Между Пророком ﷺ и курайшитами был подписан 10-летний мирный договор. Хотя он казался невыгодным, он привёл к быстрому распространению ислама.', ar:'وُقّع صلح لمدة ١٠ سنوات بين النبي ﷺ وقريش. ورغم أنه بدا في غير صالح المسلمين، إلا أنه أدى إلى انتشار الإسلام.', tr:'Peygamber ﷺ ile Kureyş arasında 10 yıllık barış imzalandı. Görünüşte Müslümanların aleyhine olsa da İslam\'ın yayılmasına yol açtı.' } },
  { year:'630', era:'medina', color:'#3b82f6', icon:'hajjguide',
    title:{ az:'Məkkənin fəthi', en:'Conquest of Mecca', ru:'Завоевание Мекки', ar:'فتح مكة', tr:'Mekke\'nin Fethi' },
    desc:{ az:'Peyğəmbər ﷺ 10,000 səhabə ilə Məkkəni fəth etdi. Kəbə bütlərdən təmizləndi. Heç kimə zərər verilmədi, hamısı əfv edildi.', en:'The Prophet ﷺ conquered Mecca with 10,000 companions. The Kaaba was cleansed of idols. No one was harmed; all were forgiven.', ru:'Пророк ﷺ с 10,000 сподвижниками завоевал Мекку. Кааба была очищена от идолов. Никому не причинили вреда; всех простили.', ar:'فتح النبي ﷺ مكة بعشرة آلاف من الصحابة. طُهرت الكعبة من الأصنام. لم يُؤذَ أحد وعُفي عن الجميع.', tr:'Peygamber ﷺ 10,000 sahabe ile Mekke\'yi fethetti. Kabe putlardan temizlendi. Kimseye zarar verilmedi, hepsi affedildi.' } },
  { year:'632', era:'medina', color:'#3b82f6', icon:'duas',
    title:{ az:'Vida həcci', en:'Farewell Pilgrimage', ru:'Прощальное паломничество', ar:'حجة الوداع', tr:'Veda Haccı' },
    desc:{ az:'Peyğəmbər ﷺ 124,000 nəfərlə son həccini yerinə yetirdi. Vida xütbəsində insan haqları, qadın hüquqları və bərabərlik haqqında danışdı.', en:'The Prophet ﷺ performed his final Hajj with 124,000 people. In the Farewell Sermon, he spoke of human rights, women\'s rights, and equality.', ru:'Пророк ﷺ совершил последний хадж со 124,000 людей. В Прощальной проповеди он говорил о правах человека, женщин и равенстве.', ar:'أدى النبي ﷺ حجته الأخيرة مع ١٢٤ ألفاً. وفي خطبة الوداع تحدث عن حقوق الإنسان والمرأة والمساواة.', tr:'Peygamber ﷺ 124,000 kişiyle son haccını yaptı. Veda Hutbesi\'nde insan hakları, kadın hakları ve eşitlik hakkında konuştu.' } },
  { year:'632', era:'medina', color:'#3b82f6', icon:'heart',
    title:{ az:'Peyğəmbərin vəfatı', en:'Death of the Prophet ﷺ', ru:'Смерть Пророка ﷺ', ar:'وفاة النبي ﷺ', tr:'Peygamber\'in vefatı ﷺ' },
    desc:{ az:'Hz. Muhəmməd ﷺ Mədinədə 12 Rəbiüləvvəl günü vəfat etdi. Ümmət dərin kədərə qərq oldu. Hz. Əbu Bəkr dedi: "Kim Muhəmmədə ibadət edirdisə, O öldü; kim Allaha ibadət edirdisə, Allah diridir".', en:'Prophet Muhammad ﷺ passed away in Medina on 12 Rabi al-Awwal. The Ummah was in deep grief. Abu Bakr said: "Whoever worshipped Muhammad, he has died; whoever worshipped Allah, Allah is alive".', ru:'Пророк Мухаммад ﷺ скончался в Медине 12 Раби аль-авваля. Умма погрузилась в глубокую скорбь. Абу Бакр сказал: "Кто поклонялся Мухаммаду, тот умер; кто поклонялся Аллаху, Аллах жив".', ar:'توفي النبي محمد ﷺ في المدينة في ١٢ ربيع الأول. غمر الحزن الأمة. قال أبو بكر: "من كان يعبد محمداً فإن محمداً قد مات، ومن كان يعبد الله فإن الله حي".', tr:'Hz. Muhammed ﷺ Medine\'de 12 Rebiülevvel\'de vefat etti. Ümmet derin bir hüzne büründü. Hz. Ebu Bekir dedi: "Kim Muhammed\'e tapıyorsa, o öldü; kim Allah\'a tapıyorsa, Allah diridir".' } },

  // Raşidi xəlifələr (632-661)
  { year:'632-634', era:'rashidun', color:'#f59e0b', icon:'star',
    title:{ az:'Əbu Bəkr xilafəti', en:'Caliphate of Abu Bakr', ru:'Халифат Абу Бакра', ar:'خلافة أبي بكر', tr:'Hz. Ebu Bekir Halifeliği' },
    desc:{ az:'İlk xəlifə. Rəddə müharibələrini həll etdi, Quranın toplanmasını başlatdı, İraq və Şam fəthlərinə başladı.', en:'First caliph. Resolved the Ridda wars, initiated the compilation of the Quran, began conquests of Iraq and Syria.', ru:'Первый халиф. Решил проблему войн Ридда, начал сбор Корана, начал завоевания Ирака и Сирии.', ar:'أول الخلفاء. حل حروب الردة وبدأ جمع القرآن وبدأ فتوحات العراق والشام.', tr:'İlk halife. Ridde savaşlarını çözdü, Kur\'an\'ın toplanmasını başlattı, Irak ve Şam fetihlerine başladı.' } },
  { year:'634-644', era:'rashidun', color:'#f59e0b', icon:'star',
    title:{ az:'Ömər ibn Xəttab xilafəti', en:'Caliphate of Umar', ru:'Халифат Умара', ar:'خلافة عمر', tr:'Hz. Ömer Halifeliği' },
    desc:{ az:'İslam imperatorluğu genişləndi: İran, İraq, Suriya, Misir, Fələstin fəth edildi. Hicri təqvimi qurdu. Ədaləti ilə tanınan "Farukul-adil".', en:'Islamic empire expanded: Iran, Iraq, Syria, Egypt, Palestine were conquered. Established the Hijri calendar. Known as "Al-Faruq the Just".', ru:'Исламская империя расширилась: Иран, Ирак, Сирия, Египет, Палестина. Установил календарь хиджры. Известен как "Аль-Фарук Справедливый".', ar:'توسعت الإمبراطورية الإسلامية: فُتح فارس والعراق والشام ومصر وفلسطين. أسس التقويم الهجري. عُرف بالفاروق العادل.', tr:'İslam imparatorluğu genişledi: İran, Irak, Suriye, Mısır, Filistin fethedildi. Hicri takvimi kurdu. "Adil Faruk" olarak bilinir.' } },
  { year:'644-656', era:'rashidun', color:'#f59e0b', icon:'quran',
    title:{ az:'Osman ibn Affan xilafəti', en:'Caliphate of Uthman', ru:'Халифат Усмана', ar:'خلافة عثمان', tr:'Hz. Osman Halifeliği' },
    desc:{ az:'Quran bir nüsxədə toplandı və dünyaya yayıldı. Donanma qurdu, Kipr və Rodos fəth edildi. "Zinnureyn" ləqəbli.', en:'The Quran was compiled into one standard copy and distributed. Established the navy, conquered Cyprus and Rhodes. Known as "Dhun-Nurayn" (Possessor of Two Lights).', ru:'Коран был собран в одну стандартную копию. Основал флот, завоевал Кипр и Родос. Известен как "Зун-Нурайн" (Обладатель двух светов).', ar:'جُمع القرآن في مصحف واحد ووُزع على الأمصار. أسس الأسطول البحري وفتح قبرص ورودس. لُقب بذي النورين.', tr:'Kur\'an tek bir mushafta toplanıp dünyaya dağıtıldı. Donanma kurdu, Kıbrıs ve Rodos fethedildi. "Zinnureyn" lakaplıdır.' } },
  { year:'656-661', era:'rashidun', color:'#f59e0b', icon:'quran',
    title:{ az:'Əli ibn Əbu Talib xilafəti', en:'Caliphate of Ali', ru:'Халифат Али', ar:'خلافة علي', tr:'Hz. Ali Halifeliği' },
    desc:{ az:'Dördüncü raşidi xəlifə. Peyğəmbərin ﷺ əmisi oğlu və kürəkəni. "Elmin qapısı" kimi tanınır. Paytaxt Kufəyə köçürüldü.', en:'Fourth Rashidun caliph. Cousin and son-in-law of the Prophet ﷺ. Known as "The Gate of Knowledge". Capital moved to Kufa.', ru:'Четвёртый праведный халиф. Двоюродный брат и зять Пророка ﷺ. Известен как "Врата знания". Столица перенесена в Куфу.', ar:'رابع الخلفاء الراشدين. ابن عم النبي ﷺ وزوج ابنته. يُعرف بـ"باب العلم". نُقلت العاصمة إلى الكوفة.', tr:'Dördüncü Raşid halife. Peygamber ﷺ\'in amcaoğlu ve damadı. "İlmin kapısı" olarak bilinir. Başkent Kufe\'ye taşındı.' } },

  // Əməvilər (661-750)
  { year:'661-750', era:'umayyad', color:'#8b5cf6', icon:'history',
    title:{ az:'Əməvilər xilafəti', en:'Umayyad Caliphate', ru:'Омейядский халифат', ar:'الخلافة الأموية', tr:'Emevi Halifeliği' },
    desc:{ az:'Paytaxt Dəməşq oldu. İmperatorluq Hindistandan İspaniyaya qədər genişləndi. Ərəb dili rəsmi dil oldu, qızıl dinar zərb edildi.', en:'Capital was Damascus. The empire expanded from India to Spain. Arabic became the official language, gold dinars were minted.', ru:'Столицей стал Дамаск. Империя расширилась от Индии до Испании. Арабский стал официальным языком, чеканились золотые динары.', ar:'كانت العاصمة دمشق. امتدت الإمبراطورية من الهند إلى إسبانيا. أصبحت العربية لغة رسمية وسُك الدينار الذهبي.', tr:'Başkent Şam oldu. İmparatorluk Hindistan\'dan İspanya\'ya genişledi. Arapça resmi dil oldu, altın dinar basıldı.' } },
  { year:'680', era:'umayyad', color:'#8b5cf6', icon:'heart',
    title:{ az:'Kərbəla faciəsi', en:'Tragedy of Karbala', ru:'Трагедия Кербелы', ar:'مأساة كربلاء', tr:'Kerbela Faciası' },
    desc:{ az:'Hz. Hüseyn və ailəsi Kufəyə gedərkən Kərbəlada şəhid edildilər. Bu hadisə ümmət üçün böyük kədər oldu.', en:'Imam Husayn and his family were martyred in Karbala while traveling to Kufa. This was a great sorrow for the Ummah.', ru:'Имам Хусейн и его семья были убиты в Кербеле по пути в Куфу. Это было большой скорбью для уммы.', ar:'استُشهد الحسين رضي الله عنه وأهل بيته في كربلاء في طريقهم إلى الكوفة. كانت حزناً عظيماً للأمة.', tr:'Hz. Hüseyin ve ailesi Kufe\'ye giderken Kerbela\'da şehit edildiler. Bu, ümmet için büyük bir hüzün oldu.' } },
  { year:'711', era:'umayyad', color:'#8b5cf6', icon:'map',
    title:{ az:'Əndəlüsün fəthi', en:'Conquest of Al-Andalus', ru:'Завоевание Аль-Андалуса', ar:'فتح الأندلس', tr:'Endülüs\'ün Fethi' },
    desc:{ az:'Tariq ibn Ziyad Cəbəlüttariqi keçdi və İspaniyanı fəth etdi. Müsəlmanların Əndəlüsdə 800 illik hakimiyyəti başladı.', en:'Tariq ibn Ziyad crossed the Strait of Gibraltar and conquered Spain. This began 800 years of Muslim rule in Al-Andalus.', ru:'Тарик ибн Зияд пересёк Гибралтар и завоевал Испанию. Это началось 800-летнее мусульманское правление в Аль-Андалусе.', ar:'عبر طارق بن زياد مضيق جبل طارق وفتح إسبانيا. بدأ الحكم الإسلامي في الأندلس الذي استمر ٨٠٠ عام.', tr:'Tarık bin Ziyad Cebelitarık\'ı geçti ve İspanya\'yı fethetti. Müslümanların Endülüs\'te 800 yıllık hakimiyeti başladı.' } },

  // Abbasilər (750-1258)
  { year:'750-1258', era:'abbasid', color:'#ef4444', icon:'star',
    title:{ az:'Abbasilər — Qızıl Dövr', en:'Abbasid — Golden Age', ru:'Аббасиды — Золотой век', ar:'العباسيون — العصر الذهبي', tr:'Abbasiler — Altın Çağ' },
    desc:{ az:'Bağdad paytaxt oldu. "Beytül-Hikmət" qurulur. Elm, fəlsəfə, memarlıq çiçəkləndi. Əl-Xarəzmi, İbn Sina, Əl-Farabi, İbn Rüşd kimi böyük alimlər yetişdi.', en:'Baghdad became the capital. "Bayt al-Hikma" (House of Wisdom) was established. Science, philosophy and architecture flourished. Great scholars like Al-Khwarizmi, Ibn Sina, Al-Farabi, Ibn Rushd emerged.', ru:'Столицей стал Багдад. Основан "Байт аль-Хикма" (Дом мудрости). Процветали наука, философия, архитектура. Появились великие учёные: Аль-Хорезми, Ибн Сина, Аль-Фараби, Ибн Рушд.', ar:'أصبحت بغداد العاصمة. أُسس بيت الحكمة. ازدهرت العلوم والفلسفة والعمارة. ظهر علماء كبار مثل الخوارزمي وابن سينا والفارابي وابن رشد.', tr:'Başkent Bağdat oldu. Beytülhikme kuruldu. Bilim, felsefe ve mimari gelişti. El-Harezmi, İbn Sina, Farabi, İbn Rüşd gibi büyük alimler yetişti.' } },
  { year:'1099', era:'abbasid', color:'#ef4444', icon:'star',
    title:{ az:'Səlib yürüşləri', en:'Crusades Begin', ru:'Начало крестовых походов', ar:'الحروب الصليبية', tr:'Haçlı Seferleri' },
    desc:{ az:'Xristianlar Qüdsü tutdular. 88 il sonra Səlahəddin Əyyubi Qüdsü azad etdi (1187).', en:'Christians captured Jerusalem. 88 years later, Salahuddin Ayyubi liberated Jerusalem (1187).', ru:'Христиане захватили Иерусалим. 88 лет спустя Салах ад-Дин освободил Иерусалим (1187).', ar:'استولى الصليبيون على القدس. بعد ٨٨ عاماً حرر صلاح الدين الأيوبي القدس (١١٨٧).', tr:'Hristiyanlar Kudüs\'ü ele geçirdi. 88 yıl sonra Selahaddin Eyyubi Kudüs\'ü kurtardı (1187).' } },
  { year:'1258', era:'abbasid', color:'#ef4444', icon:'heart',
    title:{ az:'Bağdadın sükutu', en:'Fall of Baghdad', ru:'Падение Багдада', ar:'سقوط بغداد', tr:'Bağdat\'ın Düşüşü' },
    desc:{ az:'Monqol Hülaqu xan Bağdadı işğal etdi. 500 illik Abbasi xilafəti sona çatdı. Kitabxanalar məhv edildi, minlərlə elm əsəri yandırıldı.', en:'Mongol Hulagu Khan captured Baghdad. The 500-year Abbasid caliphate ended. Libraries were destroyed, thousands of scientific works burned.', ru:'Монгольский Хулагу-хан захватил Багдад. 500-летний Аббасидский халифат закончился. Библиотеки были уничтожены.', ar:'احتل هولاكو المغولي بغداد. انتهت الخلافة العباسية التي استمرت ٥٠٠ عام. دُمرت المكتبات وأُحرقت آلاف الكتب العلمية.', tr:'Moğol Hülagu Han Bağdat\'ı işgal etti. 500 yıllık Abbasi halifeliği sona erdi. Kütüphaneler yok edildi, binlerce eser yakıldı.' } },

  // Osmanlılar
  { year:'1299', era:'ottoman', color:'#14b8a6', icon:'star',
    title:{ az:'Osmanlı dövlətinin qurulması', en:'Foundation of Ottoman State', ru:'Основание Османского государства', ar:'تأسيس الدولة العثمانية', tr:'Osmanlı Devleti\'nin kuruluşu' },
    desc:{ az:'Osman Qazi Söyüd yaxınlığında Osmanlı dövlətinin əsasını qoydu. 600 il davam edəcək imperatorluq başladı.', en:'Osman Ghazi laid the foundation of the Ottoman state near Söğüt. A 600-year empire began.', ru:'Осман Гази заложил основу Османского государства возле Согута. Началась 600-летняя империя.', ar:'أسس عثمان غازي الدولة العثمانية قرب سوغوت. بدأت إمبراطورية دامت ٦٠٠ عام.', tr:'Osman Gazi Söğüt yakınlarında Osmanlı Devleti\'nin temelini attı. 600 yıl sürecek bir imparatorluk başladı.' } },
  { year:'1453', era:'ottoman', color:'#14b8a6', icon:'star',
    title:{ az:'İstanbulun fəthi', en:'Conquest of Constantinople', ru:'Взятие Константинополя', ar:'فتح القسطنطينية', tr:'İstanbul\'un Fethi' },
    desc:{ az:'Fateh Sultan Məhməd 21 yaşında İstanbulu fəth etdi. Aya Sofiya məscidə çevrildi. Peyğəmbərin ﷺ müjdəsi həyata keçdi.', en:'Sultan Mehmed II conquered Constantinople at age 21. Hagia Sophia was converted to a mosque. The Prophet\'s ﷺ prophecy was fulfilled.', ru:'Султан Мехмед II завоевал Константинополь в 21 год. Айя-София была превращена в мечеть. Пророчество Пророка ﷺ сбылось.', ar:'فتح السلطان محمد الفاتح القسطنطينية وهو في الحادية والعشرين. حُولت آيا صوفيا إلى مسجد. تحققت بشارة النبي ﷺ.', tr:'Fatih Sultan Mehmed 21 yaşında İstanbul\'u fethetti. Ayasofya camiye çevrildi. Peygamber ﷺ\'in müjdesi gerçekleşti.' } },
  { year:'1517', era:'ottoman', color:'#14b8a6', icon:'hajjguide',
    title:{ az:'Osmanlı xilafəti', en:'Ottoman Caliphate', ru:'Османский халифат', ar:'الخلافة العثمانية', tr:'Osmanlı Hilafeti' },
    desc:{ az:'Yavuz Sultan Səlim Misir və Şamı fəth etdi. Xilafət və müqəddəs əmanətlər Osmanlılara keçdi. 400 il davam etdi.', en:'Sultan Selim I conquered Egypt and Sham. The caliphate and sacred relics passed to the Ottomans. It lasted 400 years.', ru:'Султан Селим I завоевал Египет и Шам. Халифат и священные реликвии перешли к османам. Длилось 400 лет.', ar:'فتح السلطان سليم الأول مصر والشام. انتقلت الخلافة والأمانات المقدسة إلى العثمانيين. واستمرت ٤٠٠ عام.', tr:'Yavuz Sultan Selim Mısır ve Şam\'ı fethetti. Hilafet ve kutsal emanetler Osmanlılara geçti. 400 yıl sürdü.' } },
  { year:'1924', era:'modern', color:'#6366f1', icon:'history',
    title:{ az:'Xilafətin ləğvi', en:'Abolition of Caliphate', ru:'Отмена халифата', ar:'إلغاء الخلافة', tr:'Hilafetin kaldırılması' },
    desc:{ az:'Türkiyə Böyük Millət Məclisi xilafəti ləğv etdi. 1400 illik xilafət müəssisəsi sona çatdı. Bu, İslam dünyası üçün dönüş nöqtəsi oldu.', en:'The Turkish Grand National Assembly abolished the caliphate. The 1400-year institution ended. This was a turning point for the Muslim world.', ru:'Великое национальное собрание Турции отменило халифат. 1400-летний институт закончился. Это стало поворотным моментом для мусульманского мира.', ar:'ألغى مجلس الأمة التركي الكبير الخلافة. انتهت مؤسسة استمرت ١٤٠٠ عام. كانت نقطة تحول للعالم الإسلامي.', tr:'Türkiye Büyük Millet Meclisi hilafeti kaldırdı. 1400 yıllık kurum sona erdi. Bu, İslam dünyası için bir dönüm noktası oldu.' } },
];

const ERAS = [
  { key:'all', label:{az:'Hamısı',en:'All',ru:'Все',ar:'الكل',tr:'Tümü'}, color:'#64748b' },
  { key:'prophet', label:{az:'Peyğəmbərlik',en:'Prophethood',ru:'Пророчество',ar:'النبوة',tr:'Peygamberlik'}, color:'#10b981' },
  { key:'medina', label:{az:'Mədinə',en:'Medina',ru:'Медина',ar:'المدينة',tr:'Medine'}, color:'#3b82f6' },
  { key:'rashidun', label:{az:'Raşidi',en:'Rashidun',ru:'Праведные',ar:'الراشدون',tr:'Raşidin'}, color:'#f59e0b' },
  { key:'umayyad', label:{az:'Əməvilər',en:'Umayyad',ru:'Омейяды',ar:'الأمويون',tr:'Emeviler'}, color:'#8b5cf6' },
  { key:'abbasid', label:{az:'Abbasilər',en:'Abbasid',ru:'Аббасиды',ar:'العباسيون',tr:'Abbasiler'}, color:'#ef4444' },
  { key:'ottoman', label:{az:'Osmanlı',en:'Ottoman',ru:'Османы',ar:'العثمانيون',tr:'Osmanlı'}, color:'#14b8a6' },
  { key:'modern', label:{az:'Müasir',en:'Modern',ru:'Современность',ar:'الحديث',tr:'Modern'}, color:'#6366f1' },
];

const LABELS = {
  az:{ title:'İslam Tarixi', sub:'Ən əhəmiyyətli hadisələr xronoloji sırada', searchPh:'Hadisə axtar...', noResult:'Hadisə tapılmadı' },
  en:{ title:'Islamic History', sub:'Significant events in chronological order', searchPh:'Search events...', noResult:'No events found' },
  ru:{ title:'Исламская История', sub:'Значимые события в хронологическом порядке', searchPh:'Поиск событий...', noResult:'События не найдены' },
  ar:{ title:'التاريخ الإسلامي', sub:'أحداث مهمة بالترتيب الزمني', searchPh:'ابحث عن حدث...', noResult:'لم يتم العثور على أحداث' },
  tr:{ title:'İslam Tarihi', sub:'Önemli olaylar kronolojik sırayla', searchPh:'Olay ara...', noResult:'Olay bulunamadı' },
};

export default function IslamicHistoryScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const sh = dark ? Shadows.dark.md : Shadows.md;

  const [selectedEra, setSelectedEra] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = EVENTS;
    if (selectedEra !== 'all') list = list.filter(e => e.era === selectedEra);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e => {
        const title = (e.title[lang] || e.title.en || '').toLowerCase();
        const desc = (e.desc[lang] || e.desc.en || '').toLowerCase();
        return title.includes(q) || desc.includes(q) || e.year.includes(q);
      });
    }
    return list;
  }, [selectedEra, search, lang]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero arabic="التَّارِيخُ الإِسْلَامِيّ" title={l.title} subtitle={l.sub} />

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

        {/* Era selector */}
        <FadeUp delay={150}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eraRow}>
            {ERAS.map(era => {
              const active = selectedEra === era.key;
              return (
                <TouchableOpacity
                  key={era.key}
                  style={[
                    styles.eraBtn,
                    {
                      backgroundColor: active ? era.color : c.card,
                      borderColor: active ? era.color : c.cardBorder,
                    },
                    active && Shadows.button,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedEra(era.key);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.eraText, { color: active ? '#fff' : c.textSecondary }]}>
                    {era.label[lang] || era.label.en}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </FadeUp>

        {/* Count */}
        <FadeUp delay={200}>
          <View style={styles.countRow}>
            <View style={[styles.countBadge, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <AppIcon name="history" size={14} color={c.primary} />
              <Text style={[styles.countText, { color: c.text }]}>
                {filtered.length} {lang==='az'?'hadisə':lang==='ru'?'событий':lang==='ar'?'حدث':lang==='tr'?'olay':'events'}
              </Text>
            </View>
          </View>
        </FadeUp>

        {/* Timeline */}
        {filtered.length === 0 ? (
          <ScaleIn>
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: c.primaryBg }]}>
                <AppIcon name="history" size={48} color={c.primary} />
              </View>
              <Text style={[styles.emptyText, { color: c.text }]}>{l.noResult}</Text>
            </View>
          </ScaleIn>
        ) : (
          filtered.map((event, i) => (
            <FadeUp key={i} delay={Math.min(i * 40, 400)}>
              <View style={styles.timelineItem}>
                <View style={styles.timelineLine}>
                  <LinearGradient colors={[event.color, event.color + '80']} style={styles.timelineDot}>
                    <AppIcon name={event.icon} size={14} color="#fff" />
                  </LinearGradient>
                  {i < filtered.length - 1 && <View style={[styles.timelineBar, { backgroundColor: c.border }]} />}
                </View>

                <View style={[styles.eventCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}>
                  <LinearGradient
                    colors={[event.color + '14', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.5 }}
                  />
                  <View style={[styles.yearBadge, { backgroundColor: event.color }]}>
                    <Text style={styles.yearText}>{event.year}</Text>
                  </View>
                  <Text style={[styles.eventTitle, { color: c.text }]}>{event.title[lang] || event.title.en}</Text>
                  <Text style={[styles.eventDesc, { color: c.textSecondary }]}>{event.desc[lang] || event.desc.en}</Text>
                </View>
              </View>
            </FadeUp>
          ))
        )}
      </View>
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 14 },

  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 14, borderRadius: BorderRadius.lg, borderWidth: 1, height: 52, marginBottom: 14 },
  searchIconWrap: { width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, height: 52, fontWeight: '500' },

  // Era selector
  eraRow: { gap: 8, paddingBottom: 8, paddingHorizontal: 4 },
  eraBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  eraText: { fontSize: 13, fontWeight: '700' },

  // Count
  countRow: { marginTop: 8, marginBottom: 14 },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: BorderRadius.full, borderWidth: 1, alignSelf: 'flex-start' },
  countText: { fontSize: 13, fontWeight: '700' },

  // Timeline
  timelineItem: { flexDirection: 'row' },
  timelineLine: { width: 40, alignItems: 'center' },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    zIndex: 2,
  },
  timelineBar: { width: 2, flex: 1, marginTop: 4 },

  // Event card
  eventCard: {
    flex: 1,
    marginLeft: 12,
    padding: 18,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  yearBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: 10,
  },
  yearText: { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  eventTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8, letterSpacing: -0.3 },
  eventDesc: { fontSize: 13, lineHeight: 22, fontWeight: '500' },

  // Empty
  empty: { alignItems: 'center', marginTop: 40 },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: { fontSize: 16, fontWeight: '600' },
});
