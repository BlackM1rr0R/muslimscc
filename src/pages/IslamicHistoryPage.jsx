import { useState } from 'react'
import { useLang } from '../contexts/LangContext'
import '../styles/IslamicHistoryPage.css'

/* ── Labels ── */
const LABELS = {
  az: { title:'İslami Tarix', subtitle:'Peyğəmbərlər və mühüm hadisələr', prophets:'Peyğəmbərlər', events:'Tarixi Hadisələr', readMore:'Daha çox', quranic:'Quranda adı keçir', mentioned:'dəfə', era:'Dövr', keyFact:'Əsas fakt', home:'Ana Səhifə', story:'Hekayə', quranRef:'Quran istinadı' },
  en: { title:'Islamic History', subtitle:'Prophets and major events', prophets:'Prophets', events:'Historical Events', readMore:'Read more', quranic:'Mentioned in Quran', mentioned:'times', era:'Era', keyFact:'Key fact', home:'Home', story:'Story', quranRef:'Quran reference' },
  ru: { title:'Исламская история', subtitle:'Пророки и важные события', prophets:'Пророки', events:'Исторические события', readMore:'Подробнее', quranic:'Упоминается в Коране', mentioned:'раз', era:'Эпоха', keyFact:'Ключевой факт', home:'Главная', story:'История', quranRef:'Ссылка на Коран' },
  ar: { title:'التاريخ الإسلامي', subtitle:'الأنبياء والأحداث الكبرى', prophets:'الأنبياء', events:'أحداث تاريخية', readMore:'اقرأ المزيد', quranic:'مذكور في القرآن', mentioned:'مرة', era:'العصر', keyFact:'حقيقة أساسية', home:'الرئيسية', story:'القصة', quranRef:'مرجع قرآني' },
  tr: { title:'İslam Tarihi', subtitle:'Peygamberler ve önemli olaylar', prophets:'Peygamberler', events:'Tarihi Olaylar', readMore:'Devamını oku', quranic:'Kuran\'da geçer', mentioned:'kez', era:'Dönem', keyFact:'Önemli bilgi', home:'Ana Sayfa', story:'Kıssa', quranRef:'Kuran referansı' },
}

/* ── Prophets Data ── */
const PROPHETS = [
  {
    num: 1, arabic: 'آدم',
    name: { az:'Adəm', en:'Adam', ru:'Адам', ar:'آدم', tr:'Âdem' },
    era: { az:'Yaradılışın başlanğıcı', en:'Beginning of Creation', ru:'Начало творения', ar:'بداية الخلق', tr:'Yaratılışın başlangıcı' },
    desc: {
      az:'İlk insan və ilk peyğəmbər. Allah tərəfindən torpaqdan yaradılmış, cənnətdə yaşamış, sonra yer üzünə endirilmişdir.',
      en:'The first human and first prophet. Created from clay by Allah, lived in Paradise, then sent down to Earth.',
      ru:'Первый человек и первый пророк. Создан Аллахом из глины, жил в Раю, затем был отправлен на Землю.',
      ar:'أول إنسان وأول نبي. خلقه الله من طين، عاش في الجنة ثم أُهبط إلى الأرض.',
      tr:'İlk insan ve ilk peygamber. Allah tarafından topraktan yaratılmış, cennette yaşamış, sonra yeryüzüne indirilmiştir.',
    },
    keyFact: {
      az:'Mələklər Adəmə səcdə etmək əmri aldı. İblis imtina etdi.',
      en:'Angels were commanded to prostrate to Adam. Iblis refused.',
      ru:'Ангелам было приказано поклониться Адаму. Иблис отказался.',
      ar:'أُمر الملائكة بالسجود لآدم. أبى إبليس.',
      tr:'Meleklere Âdem\'e secde etmeleri emredildi. İblis reddetti.',
    },
    quranRef: 'Al-Baqarah 30-37',
  },
  {
    num: 2, arabic: 'إدريس',
    name: { az:'İdris', en:'Idris', ru:'Идрис', ar:'إدريس', tr:'İdris' },
    era: { az:'Adəmdən sonra', en:'After Adam', ru:'После Адама', ar:'بعد آدم', tr:'Âdem\'den sonra' },
    desc: {
      az:'Yüksək məqama qaldırılan peyğəmbər. Yazını ilk öyrədən və elmlə məşğul olan şəxs.',
      en:'The prophet raised to a high station. Known as one of the first to use writing and study science.',
      ru:'Пророк, вознесённый на высокое место. Известен как один из первых, кто использовал письменность и изучал науку.',
      ar:'النبي الذي رفعه الله مكانًا عليًا. من أوائل من خطّ بالقلم وتعلّم العلوم.',
      tr:'Yüce bir makama yükseltilen peygamber. Yazıyı ilk öğrenen ve ilimle meşgul olan kişi.',
    },
    keyFact: {
      az:'Allah onu yüksək bir məqama qaldırdı (Məryəm 57).',
      en:'Allah raised him to a high station (Maryam 57).',
      ru:'Аллах вознёс его на высокое место (Марьям 57).',
      ar:'رفعه الله مكانًا عليًا (مريم ٥٧).',
      tr:'Allah onu yüce bir makama yükseltti (Meryem 57).',
    },
    quranRef: 'Maryam 56-57',
  },
  {
    num: 3, arabic: 'نوح',
    name: { az:'Nuh', en:'Nuh (Noah)', ru:'Нух (Ной)', ar:'نوح', tr:'Nuh' },
    era: { az:'~950 il dəvət', en:'~950 years of dawah', ru:'~950 лет призыва', ar:'~٩٥٠ سنة من الدعوة', tr:'~950 yıl davet' },
    desc: {
      az:'950 il öz qövmünü haqqa dəvət etdi. Tufan hadisəsi və gəmi möcüzəsi ilə tanınır.',
      en:'Called his people to truth for 950 years. Known for the Great Flood and the Ark.',
      ru:'Призывал свой народ к истине 950 лет. Известен Великим Потопом и Ковчегом.',
      ar:'دعا قومه ٩٥٠ سنة. يُعرف بالطوفان العظيم والسفينة.',
      tr:'Kavmini 950 yıl hakka davet etti. Tufan ve gemi mucizesiyle tanınır.',
    },
    keyFact: {
      az:'Quranda tam bir surə onun adını daşıyır (Nuh surəsi).',
      en:'An entire Surah in the Quran bears his name (Surah Nuh).',
      ru:'Целая сура Корана носит его имя (сура Нух).',
      ar:'سورة كاملة في القرآن تحمل اسمه (سورة نوح).',
      tr:'Kuran\'da tam bir sûre onun adını taşır (Nûh sûresi).',
    },
    quranRef: 'Nuh 1-28, Hud 25-49',
  },
  {
    num: 4, arabic: 'هود',
    name: { az:'Hud', en:'Hud', ru:'Худ', ar:'هود', tr:'Hûd' },
    era: { az:'Ad qövmü dövrü', en:'Era of the Ad people', ru:'Эпоха народа Ад', ar:'عصر قوم عاد', tr:'Âd kavmi dönemi' },
    desc: {
      az:'Ad qövmünə göndərilmişdir. Onları bütpərəstlikdən çəkindirərək tövhidə dəvət etmişdir.',
      en:'Sent to the people of Ad. He warned them against idol worship and called them to monotheism.',
      ru:'Послан к народу Ад. Предостерёг их от идолопоклонства и призвал к единобожию.',
      ar:'أُرسل إلى قوم عاد. حذّرهم من عبادة الأصنام ودعاهم إلى التوحيد.',
      tr:'Âd kavmine gönderilmiştir. Onları putperestlikten sakındırarak tevhide davet etmiştir.',
    },
    keyFact: {
      az:'Ad qövmü şiddətli küləklə həlak edildi.',
      en:'The Ad people were destroyed by a fierce wind.',
      ru:'Народ Ад был уничтожен свирепым ветром.',
      ar:'أُهلك قوم عاد بريح صرصر عاتية.',
      tr:'Âd kavmi şiddetli bir rüzgârla helak edildi.',
    },
    quranRef: 'Hud 50-60',
  },
  {
    num: 5, arabic: 'صالح',
    name: { az:'Saleh', en:'Salih', ru:'Салих', ar:'صالح', tr:'Sâlih' },
    era: { az:'Səmud qövmü dövrü', en:'Era of Thamud', ru:'Эпоха самудян', ar:'عصر قوم ثمود', tr:'Semûd kavmi dönemi' },
    desc: {
      az:'Səmud qövmünə göndərilmişdir. Dəvə möcüzəsi ilə tanınır — Allah qayadan bir dəvə çıxartdı.',
      en:'Sent to the Thamud people. Known for the she-camel miracle — Allah brought forth a camel from rock.',
      ru:'Послан к самудянам. Известен чудом с верблюдицей — Аллах вывел верблюдицу из скалы.',
      ar:'أُرسل إلى قوم ثمود. يُعرف بمعجزة الناقة — أخرج الله ناقة من الصخر.',
      tr:'Semûd kavmine gönderilmiştir. Deve mucizesiyle tanınır — Allah kayadan bir deve çıkardı.',
    },
    keyFact: {
      az:'Dəvəni kəsən qövm zəlzələ ilə həlak edildi.',
      en:'The people who slaughtered the camel were destroyed by an earthquake.',
      ru:'Народ, зарезавший верблюдицу, был уничтожен землетрясением.',
      ar:'القوم الذين عقروا الناقة أُهلكوا بالصيحة.',
      tr:'Deveyi kesen kavim depremle helak edildi.',
    },
    quranRef: 'Hud 61-68, Ash-Shams 11-15',
  },
  {
    num: 6, arabic: 'إبراهيم',
    name: { az:'İbrahim', en:'Ibrahim (Abraham)', ru:'Ибрахим (Авраам)', ar:'إبراهيم', tr:'İbrâhim' },
    era: { az:'~2000 e.ə.', en:'~2000 BCE', ru:'~2000 до н.э.', ar:'~٢٠٠٠ ق.م', tr:'~MÖ 2000' },
    desc: {
      az:'Peyğəmbərlərin atası. Kəbəni oğlu İsmaillə birlikdə tikdi. Odda yanmadı — Allah odu sərinlik etdi.',
      en:'Father of prophets. Built the Kaaba with his son Ismail. Thrown into fire but Allah made it cool and safe.',
      ru:'Отец пророков. Построил Каабу с сыном Исмаилом. Брошен в огонь, но Аллах сделал огонь прохладным и безопасным.',
      ar:'أبو الأنبياء. بنى الكعبة مع ابنه إسماعيل. أُلقي في النار فجعلها الله بردًا وسلامًا.',
      tr:'Peygamberlerin babası. Kâbe\'yi oğlu İsmail ile birlikte inşa etti. Ateşe atıldı ama Allah ateşi serinlik kıldı.',
    },
    keyFact: {
      az:'Quranın 4 yerində "Xəlilullah" (Allahın dostu) adlandırılır.',
      en:'Called "Khalilullah" (Friend of Allah) in the Quran.',
      ru:'Назван «Халилуллах» (Друг Аллаха) в Коране.',
      ar:'لُقّب بـ"خليل الله" في القرآن.',
      tr:'Kuran\'da "Halîlullah" (Allah\'ın dostu) olarak anılır.',
    },
    quranRef: 'Al-Baqarah 124-132, Ibrahim 35-41',
  },
  {
    num: 7, arabic: 'لوط',
    name: { az:'Lut', en:'Lut (Lot)', ru:'Лут (Лот)', ar:'لوط', tr:'Lût' },
    era: { az:'İbrahim dövrü', en:'Era of Ibrahim', ru:'Эпоха Ибрахима', ar:'عصر إبراهيم', tr:'İbrâhim dönemi' },
    desc: {
      az:'Sodom əhlinə göndərilmişdir. Əxlaqsızlıqla mübarizə aparmışdır. İbrahimin qardaşı oğludur.',
      en:'Sent to the people of Sodom. Fought against immorality. He was the nephew of Ibrahim.',
      ru:'Послан к народу Содома. Боролся с безнравственностью. Был племянником Ибрахима.',
      ar:'أُرسل إلى قوم سدوم. حارب الفاحشة. وهو ابن أخ إبراهيم.',
      tr:'Sodom halkına gönderilmiştir. Ahlâksızlıkla mücadele etmiştir. İbrâhim\'in yeğenidir.',
    },
    keyFact: {
      az:'Şəhər alt-üst edilərək daş yağışı ilə həlak edildi.',
      en:'The city was overturned and destroyed with a rain of stones.',
      ru:'Город был перевёрнут и уничтожен дождём из камней.',
      ar:'قُلبت المدينة وأُمطرت بحجارة من سجّيل.',
      tr:'Şehir alt üst edilerek taş yağmuruyla helak edildi.',
    },
    quranRef: 'Hud 77-83, Al-Ankabut 28-35',
  },
  {
    num: 8, arabic: 'إسماعيل',
    name: { az:'İsmail', en:'Ismail (Ishmael)', ru:'Исмаил', ar:'إسماعيل', tr:'İsmâil' },
    era: { az:'~1900 e.ə.', en:'~1900 BCE', ru:'~1900 до н.э.', ar:'~١٩٠٠ ق.م', tr:'~MÖ 1900' },
    desc: {
      az:'İbrahimin böyük oğlu. Qurbanlıq hadisəsi ilə tanınır. Atası ilə birlikdə Kəbəni tikmişdir. Zəmzəm suyu onun üçün çıxmışdır.',
      en:'Elder son of Ibrahim. Known for the sacrifice story. Built the Kaaba with his father. Zamzam water sprang for him.',
      ru:'Старший сын Ибрахима. Известен историей жертвоприношения. Строил Каабу с отцом. Вода Замзам забила для него.',
      ar:'ابن إبراهيم الأكبر. يُعرف بقصة الذبح. بنى الكعبة مع أبيه. نبع ماء زمزم من أجله.',
      tr:'İbrâhim\'in büyük oğlu. Kurban kıssasıyla tanınır. Babasıyla birlikte Kâbe\'yi inşa etmiştir. Zemzem suyu onun için fışkırmıştır.',
    },
    keyFact: {
      az:'Ərəb xalqlarının atası hesab olunur.',
      en:'Considered the father of the Arab peoples.',
      ru:'Считается праотцом арабских народов.',
      ar:'يُعتبر أبا الشعوب العربية.',
      tr:'Arap halklarının atası kabul edilir.',
    },
    quranRef: 'As-Saffat 100-111, Al-Baqarah 125-129',
  },
  {
    num: 9, arabic: 'إسحاق',
    name: { az:'İshaq', en:'Ishaq (Isaac)', ru:'Исхак (Исаак)', ar:'إسحاق', tr:'İshâk' },
    era: { az:'~1900 e.ə.', en:'~1900 BCE', ru:'~1900 до н.э.', ar:'~١٩٠٠ ق.م', tr:'~MÖ 1900' },
    desc: {
      az:'İbrahimin ikinci oğlu, Sarənin oğlu. Yaqubun atası. İsrail oğulları peyğəmbərlərinin əcdadı.',
      en:'Second son of Ibrahim, son of Sarah. Father of Yaqub. Ancestor of the Israelite prophets.',
      ru:'Второй сын Ибрахима, сын Сары. Отец Якуба. Предок израильских пророков.',
      ar:'ابن إبراهيم الثاني، ابن سارة. والد يعقوب. جدّ أنبياء بني إسرائيل.',
      tr:'İbrâhim\'in ikinci oğlu, Sâre\'nin oğlu. Yakub\'un babası. İsrailoğulları peygamberlerinin atası.',
    },
    keyFact: {
      az:'Müjdəsi yaşlı valideynlərinə mələklər tərəfindən verildi.',
      en:'His birth was announced to his elderly parents by angels.',
      ru:'Его рождение было возвещено его пожилым родителям ангелами.',
      ar:'بُشّر به أبواه المسنّان عن طريق الملائكة.',
      tr:'Doğumu yaşlı anne ve babasına melekler tarafından müjdelendi.',
    },
    quranRef: 'Hud 69-73, As-Saffat 112-113',
  },
  {
    num: 10, arabic: 'يعقوب',
    name: { az:'Yaqub', en:'Yaqub (Jacob)', ru:'Якуб (Иаков)', ar:'يعقوب', tr:'Yakub' },
    era: { az:'~1800 e.ə.', en:'~1800 BCE', ru:'~1800 до н.э.', ar:'~١٨٠٠ ق.م', tr:'~MÖ 1800' },
    desc: {
      az:'İshaqın oğlu, İsrail adı ilə də tanınır. 12 oğlu İsrail oğulları qəbilələrinin əsasını qoydu.',
      en:'Son of Ishaq, also known as Israel. His 12 sons formed the twelve tribes of Israel.',
      ru:'Сын Исхака, также известный как Израиль. Его 12 сыновей основали двенадцать колен Израиля.',
      ar:'ابن إسحاق، يُعرف أيضًا بإسرائيل. أبناؤه الاثنا عشر أسّسوا أسباط بني إسرائيل.',
      tr:'İshâk\'ın oğlu, İsrâil adıyla da bilinir. 12 oğlu İsrailoğulları kabilelerini oluşturdu.',
    },
    keyFact: {
      az:'Oğlu Yusifin itkisi ilə gözləri ağardı, sonra şəfa tapdı.',
      en:'He went blind from grief over losing Yusuf, then was healed.',
      ru:'Ослеп от горя из-за потери Юсуфа, затем исцелился.',
      ar:'فقد بصره حزنًا على يوسف ثم شُفي.',
      tr:'Yûsuf\'un kaybıyla gözleri ağardı, sonra şifâ buldu.',
    },
    quranRef: 'Yusuf 84-87, Al-Baqarah 132-133',
  },
  {
    num: 11, arabic: 'يوسف',
    name: { az:'Yusif', en:'Yusuf (Joseph)', ru:'Юсуф (Иосиф)', ar:'يوسف', tr:'Yûsuf' },
    era: { az:'~1700 e.ə.', en:'~1700 BCE', ru:'~1700 до н.э.', ar:'~١٧٠٠ ق.م', tr:'~MÖ 1700' },
    desc: {
      az:'Yaqubun oğlu. Quranda "ən gözəl hekayə" olaraq təsvir edilir. Qardaşları tərəfindən quyuya atılmış, Misirdə vəzir olmuşdur.',
      en:'Son of Yaqub. Described as the "most beautiful story" in the Quran. Thrown into a well by his brothers, became minister of Egypt.',
      ru:'Сын Якуба. Описан как «самая прекрасная история» в Коране. Брошен братьями в колодец, стал министром Египта.',
      ar:'ابن يعقوب. وصفها القرآن بـ"أحسن القصص". ألقاه إخوته في البئر، ثم أصبح عزيز مصر.',
      tr:'Yakub\'un oğlu. Kuran\'da "en güzel kıssa" olarak nitelenir. Kardeşleri tarafından kuyuya atılmış, Mısır\'da vezir olmuştur.',
    },
    keyFact: {
      az:'Gözəlliyi ilə məşhur idi — insanın yarısı gözəlliyə verilmişdi.',
      en:'Famous for his beauty — given half of all beauty in creation.',
      ru:'Славился красотой — ему была дана половина всей красоты творения.',
      ar:'اشتُهر بجماله — أُعطي شطر الحُسن.',
      tr:'Güzelliğiyle meşhurdur — yaratılışın güzelliğinin yarısı ona verilmiştir.',
    },
    quranRef: 'Yusuf 1-111',
  },
  {
    num: 12, arabic: 'أيوب',
    name: { az:'Əyyub', en:'Ayyub (Job)', ru:'Аюб (Иов)', ar:'أيوب', tr:'Eyyûb' },
    era: { az:'Dəqiq tarix bilinmir', en:'Exact date unknown', ru:'Точная дата неизвестна', ar:'التاريخ الدقيق غير معروف', tr:'Kesin tarih bilinmiyor' },
    desc: {
      az:'Səbr simvolu olan peyğəmbər. Uzun illər xəstəlik, itki və sınaqlara məruz qaldı, amma Allaha imanından dönmədi.',
      en:'A symbol of patience. Endured years of illness, loss, and trials, yet never wavered in faith.',
      ru:'Символ терпения. Перенёс годы болезни, потерь и испытаний, но не отступил от веры.',
      ar:'رمز الصبر. تحمّل سنوات من المرض والفقد والابتلاء دون أن يتزعزع إيمانه.',
      tr:'Sabır sembolü olan peygamber. Yıllarca hastalık, kayıp ve sınavlara maruz kaldı ama imanından dönmedi.',
    },
    keyFact: {
      az:'Allah ona "Ayağını yer — bu yuyunma və içmə üçün sərin sudur" dedi.',
      en:'"Strike with your foot — this is cool water for washing and drinking" (Sad 42).',
      ru:'«Топни ногой — это прохладная вода для омовения и питья» (Сад 42).',
      ar:'"اركض برجلك هذا مغتسل بارد وشراب" (ص ٤٢).',
      tr:'"Ayağını yere vur — bu yıkanma ve içme suyu" (Sâd 42).',
    },
    quranRef: 'Sad 41-44, Al-Anbiya 83-84',
  },
  {
    num: 13, arabic: 'شعيب',
    name: { az:'Şüeyb', en:'Shuayb', ru:'Шуайб', ar:'شعيب', tr:'Şuayb' },
    era: { az:'Mədyən dövrü', en:'Era of Madyan', ru:'Эпоха мадьянитов', ar:'عصر مدين', tr:'Medyen dönemi' },
    desc: {
      az:'Mədyən xalqına göndərilmişdir. Onları düzgün ölçü-çəkiyə, ədalətə və tövhidə dəvət etmişdir.',
      en:'Sent to the people of Madyan. Called them to fair measure, justice, and monotheism.',
      ru:'Послан к мадьянитам. Призывал их к справедливой мере, правосудию и единобожию.',
      ar:'أُرسل إلى أهل مدين. دعاهم إلى الوفاء بالكيل والعدل والتوحيد.',
      tr:'Medyen halkına gönderilmiştir. Onları doğru ölçü-tartıya, adalete ve tevhide davet etmiştir.',
    },
    keyFact: {
      az:'Ölçü və çəkidə saxtakarlığı qadağan edən peyğəmbər.',
      en:'The prophet who forbade cheating in weights and measures.',
      ru:'Пророк, запретивший обман в мерах и весах.',
      ar:'النبي الذي نهى عن الغش في الكيل والميزان.',
      tr:'Ölçü ve tartıda hile yapmayı yasaklayan peygamber.',
    },
    quranRef: 'Hud 84-95, Al-Araf 85-93',
  },
  {
    num: 14, arabic: 'موسى',
    name: { az:'Musa', en:'Musa (Moses)', ru:'Муса (Моисей)', ar:'موسى', tr:'Mûsâ' },
    era: { az:'~1400 e.ə.', en:'~1400 BCE', ru:'~1400 до н.э.', ar:'~١٤٠٠ ق.م', tr:'~MÖ 1400' },
    desc: {
      az:'Quranda ən çox adı çəkilən peyğəmbər (136 dəfə). Fironla mübarizəsi, dənizin yarılması, Tövratın endirilməsi ilə tanınır.',
      en:'The most mentioned prophet in the Quran (136 times). Known for his struggle with Pharaoh, the parting of the sea, and revelation of the Torah.',
      ru:'Самый упоминаемый пророк в Коране (136 раз). Известен борьбой с Фараоном, разделением моря и ниспосланием Торы.',
      ar:'أكثر الأنبياء ذكرًا في القرآن (١٣٦ مرة). يُعرف بمواجهة فرعون وانشقاق البحر ونزول التوراة.',
      tr:'Kuran\'da en çok adı geçen peygamber (136 kez). Firavun ile mücadelesi, denizin yarılması ve Tevrat\'ın indirilmesiyle tanınır.',
    },
    keyFact: {
      az:'Allah onunla Tur dağında birbaşa danışdı — "Kəlimullah" adlandırıldı.',
      en:'Allah spoke to him directly at Mount Tur — called "Kalimullah" (The one who spoke with Allah).',
      ru:'Аллах говорил с ним напрямую на горе Тур — назван «Калимулла» (Собеседник Аллаха).',
      ar:'كلّمه الله مباشرة عند جبل الطور — لُقّب بـ"كليم الله".',
      tr:'Allah onunla Tûr dağında doğrudan konuştu — "Kelîmullah" olarak anıldı.',
    },
    quranRef: 'Al-Baqarah 49-73, Taha 9-98, Al-Qasas 3-43',
  },
  {
    num: 15, arabic: 'هارون',
    name: { az:'Harun', en:'Harun (Aaron)', ru:'Харун (Аарон)', ar:'هارون', tr:'Hârûn' },
    era: { az:'Musa dövrü', en:'Era of Musa', ru:'Эпоха Мусы', ar:'عصر موسى', tr:'Mûsâ dönemi' },
    desc: {
      az:'Musanın qardaşı və köməkçisi. Allahın əmri ilə Musaya vəzir təyin edilmişdir.',
      en:'Brother and assistant of Musa. Appointed by Allah as Musa\'s minister.',
      ru:'Брат и помощник Мусы. Назначен Аллахом министром Мусы.',
      ar:'أخو موسى ووزيره. عيّنه الله وزيرًا لموسى.',
      tr:'Mûsâ\'nın kardeşi ve yardımcısı. Allah\'ın emriyle Mûsâ\'ya vezir tayin edilmiştir.',
    },
    keyFact: {
      az:'Musa Tur dağına getdikdə qövmünün başında qaldı.',
      en:'He led the people when Musa went to Mount Tur.',
      ru:'Возглавлял народ, когда Муса ушёл на гору Тур.',
      ar:'قاد القوم حين ذهب موسى إلى جبل الطور.',
      tr:'Mûsâ Tûr dağına gittiğinde kavmin başında kaldı.',
    },
    quranRef: 'Taha 29-36, Al-Araf 142',
  },
  {
    num: 16, arabic: 'ذو الكفل',
    name: { az:'Zül-Kifl', en:'Dhul-Kifl', ru:'Зуль-Кифль', ar:'ذو الكفل', tr:'Zülkifl' },
    era: { az:'Dəqiq tarix bilinmir', en:'Exact date unknown', ru:'Точная дата неизвестна', ar:'التاريخ الدقيق غير معروف', tr:'Kesin tarih bilinmiyor' },
    desc: {
      az:'Quranda iki dəfə adı çəkilir. Səbirli və saleh bir peyğəmbər olaraq xatırlanır.',
      en:'Mentioned twice in the Quran. Remembered as a patient and righteous prophet.',
      ru:'Упоминается дважды в Коране. Запомнился как терпеливый и праведный пророк.',
      ar:'ذُكر في القرآن مرتين. يُذكر بصبره وصلاحه.',
      tr:'Kuran\'da iki kez adı geçer. Sabırlı ve salih bir peygamber olarak anılır.',
    },
    keyFact: {
      az:'Səbirlilərdən biri olaraq tərifləndi.',
      en:'Praised as one of the patient ones.',
      ru:'Восхвалён как один из терпеливых.',
      ar:'مدحه الله بأنه من الصابرين.',
      tr:'Sabredenlerden biri olarak övüldü.',
    },
    quranRef: 'Al-Anbiya 85-86, Sad 48',
  },
  {
    num: 17, arabic: 'داود',
    name: { az:'Davud', en:'Dawud (David)', ru:'Дауд (Давид)', ar:'داود', tr:'Dâvûd' },
    era: { az:'~1000 e.ə.', en:'~1000 BCE', ru:'~1000 до н.э.', ar:'~١٠٠٠ ق.م', tr:'~MÖ 1000' },
    desc: {
      az:'Böyük padşah-peyğəmbər. Zəbur kitabı ona nazil edildi. Gözəl səsi ilə dağlar və quşlar onunla birlikdə təsbih edirdi.',
      en:'Great king-prophet. The Psalms (Zabur) were revealed to him. Mountains and birds glorified Allah with his beautiful voice.',
      ru:'Великий царь-пророк. Ему был ниспослан Забур (Псалмы). Горы и птицы славили Аллаха вместе с ним.',
      ar:'ملك نبي عظيم. أُنزل عليه الزبور. كانت الجبال والطير تسبّح معه.',
      tr:'Büyük hükümdar-peygamber. Zebûr ona indirildi. Güzel sesiyle dağlar ve kuşlar onunla birlikte tesbih ederdi.',
    },
    keyFact: {
      az:'Calutu (Golyatı) məğlub etdi.',
      en:'He defeated Jalut (Goliath).',
      ru:'Он победил Джалута (Голиафа).',
      ar:'هزم جالوت.',
      tr:'Câlût\'u (Golyat) yenilgiye uğrattı.',
    },
    quranRef: 'Al-Baqarah 251, Sad 17-26, Saba 10',
  },
  {
    num: 18, arabic: 'سليمان',
    name: { az:'Süleyman', en:'Sulayman (Solomon)', ru:'Сулейман (Соломон)', ar:'سليمان', tr:'Süleymân' },
    era: { az:'~970 e.ə.', en:'~970 BCE', ru:'~970 до н.э.', ar:'~٩٧٠ ق.م', tr:'~MÖ 970' },
    desc: {
      az:'Davudun oğlu. Cinlər, küləklər, quşlar və heyvanlar üzərində hökmranlıq verildi. Böyük bir səltənətə sahib idi.',
      en:'Son of Dawud. Given dominion over jinn, winds, birds, and animals. Possessed a great kingdom.',
      ru:'Сын Дауда. Ему была дана власть над джиннами, ветрами, птицами и животными. Обладал великим царством.',
      ar:'ابن داود. سُخّرت له الجن والرياح والطير. ملك مُلكًا عظيمًا.',
      tr:'Dâvûd\'un oğlu. Cinler, rüzgârlar, kuşlar ve hayvanlar üzerinde hükümranlık verildi. Büyük bir saltanata sahipti.',
    },
    keyFact: {
      az:'Heyvanların dilini bilirdi — qarışqanın sözünü eşitdi.',
      en:'He understood the language of animals — heard the ant speak.',
      ru:'Он понимал язык животных — услышал речь муравья.',
      ar:'فهم لغة الحيوانات — سمع كلام النملة.',
      tr:'Hayvanların dilini bilirdi — karıncanın sözünü duydu.',
    },
    quranRef: 'An-Naml 15-44, Saba 12-14',
  },
  {
    num: 19, arabic: 'إلياس',
    name: { az:'İlyas', en:'Ilyas (Elijah)', ru:'Ильяс (Илия)', ar:'إلياس', tr:'İlyâs' },
    era: { az:'~900 e.ə.', en:'~900 BCE', ru:'~900 до н.э.', ar:'~٩٠٠ ق.م', tr:'~MÖ 900' },
    desc: {
      az:'Baal bütpərəstliyinə qarşı mübarizə aparmışdır. İsrail oğullarını tövhidə dəvət etmişdir.',
      en:'Fought against the worship of Baal. Called the Children of Israel to monotheism.',
      ru:'Боролся против поклонения Ваалу. Призывал сынов Израиля к единобожию.',
      ar:'حارب عبادة بعل. دعا بني إسرائيل إلى التوحيد.',
      tr:'Baal putperestliğine karşı mücadele etmiştir. İsrailoğullarını tevhide davet etmiştir.',
    },
    keyFact: {
      az:'"Salam olsun İlyasın" — As-Saffat 130.',
      en:'"Peace be upon Ilyas" — As-Saffat 130.',
      ru:'«Мир Ильясу» — Ас-Саффат 130.',
      ar:'"سلام على إل ياسين" — الصافات ١٣٠.',
      tr:'"İlyâs\'a selam olsun" — Sâffât 130.',
    },
    quranRef: 'As-Saffat 123-132, Al-Anam 85',
  },
  {
    num: 20, arabic: 'اليسع',
    name: { az:'Əl-Yəsə', en:'Al-Yasa (Elisha)', ru:'Аль-Яса (Елисей)', ar:'اليسع', tr:'Elyesa' },
    era: { az:'~850 e.ə.', en:'~850 BCE', ru:'~850 до н.э.', ar:'~٨٥٠ ق.م', tr:'~MÖ 850' },
    desc: {
      az:'İlyasdan sonra gələn peyğəmbər. Quranda salehlərdən və üstün tutulmuşlardan biri kimi xatırlanır.',
      en:'The prophet who came after Ilyas. Remembered in the Quran as one of the righteous and favored.',
      ru:'Пророк, пришедший после Ильяса. Упоминается в Коране как один из праведных и избранных.',
      ar:'النبي الذي جاء بعد إلياس. ذُكر في القرآن من الأخيار والمفضّلين.',
      tr:'İlyâs\'tan sonra gelen peygamber. Kuran\'da salihlerden ve üstün kılınanlardan biri olarak anılır.',
    },
    keyFact: {
      az:'Quranda iki dəfə adı çəkilir.',
      en:'Mentioned twice in the Quran.',
      ru:'Упоминается дважды в Коране.',
      ar:'ذُكر في القرآن مرتين.',
      tr:'Kuran\'da iki kez adı geçer.',
    },
    quranRef: 'Al-Anam 86, Sad 48',
  },
  {
    num: 21, arabic: 'يونس',
    name: { az:'Yunus', en:'Yunus (Jonah)', ru:'Юнус (Иона)', ar:'يونس', tr:'Yûnus' },
    era: { az:'~800 e.ə.', en:'~800 BCE', ru:'~800 до н.э.', ar:'~٨٠٠ ق.م', tr:'~MÖ 800' },
    desc: {
      az:'Ninəva xalqına göndərilmişdir. Balina tərəfindən udulmuş, qaranlıqda dua edərək xilas olmuşdur.',
      en:'Sent to the people of Nineveh. Swallowed by a whale, saved after praying in the darkness.',
      ru:'Послан к народу Ниневии. Проглочен китом, спасён после молитвы во тьме.',
      ar:'أُرسل إلى أهل نينوى. ابتلعه الحوت ونجا بعد دعائه في الظلمات.',
      tr:'Ninova halkına gönderilmiştir. Balina tarafından yutulmuş, karanlıkta dua ederek kurtulmuştur.',
    },
    keyFact: {
      az:'"Səndən başqa ilah yoxdur, Sən paksan, mən zalımlardan oldum" — duası.',
      en:'"There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers" — his prayer.',
      ru:'«Нет божества, кроме Тебя, Пречист Ты, воистину я был из числа несправедливых» — его молитва.',
      ar:'"لا إله إلا أنت سبحانك إني كنت من الظالمين" — دعاؤه.',
      tr:'"Senden başka ilah yoktur, Seni tenzih ederim, ben zalimlerden oldum" — duası.',
    },
    quranRef: 'Al-Anbiya 87-88, Yunus 98, As-Saffat 139-148',
  },
  {
    num: 22, arabic: 'زكريا',
    name: { az:'Zəkəriyyə', en:'Zakariyya (Zechariah)', ru:'Закария (Захария)', ar:'زكريا', tr:'Zekeriyyâ' },
    era: { az:'~1 e.ə.', en:'~1 BCE', ru:'~1 до н.э.', ar:'~١ ق.م', tr:'~MÖ 1' },
    desc: {
      az:'Yahyanın atası. Yaşlılıq dövründə övlad istədi və Allah duasını qəbul etdi. Məryəmin himayəçisi idi.',
      en:'Father of Yahya. Prayed for a child in old age and Allah answered. He was the guardian of Maryam.',
      ru:'Отец Яхьи. Молился о ребёнке в старости, и Аллах ответил. Был опекуном Марьям.',
      ar:'والد يحيى. دعا ربه في شيخوخته فاستجاب الله. وكان كافل مريم.',
      tr:'Yahyâ\'nın babası. Yaşlılığında çocuk istedi ve Allah duasını kabul etti. Meryem\'in hâmisiydi.',
    },
    keyFact: {
      az:'Məryəmin yanında hər dəfə möcüzəvi ruzi gördü.',
      en:'He found miraculous provisions with Maryam each time he visited.',
      ru:'Каждый раз, навещая Марьям, находил чудесное пропитание.',
      ar:'كان يجد عند مريم رزقًا كلما دخل عليها المحراب.',
      tr:'Meryem\'in yanında her seferinde mucizevî rızık buldu.',
    },
    quranRef: 'Maryam 2-11, Ali Imran 37-41',
  },
  {
    num: 23, arabic: 'يحيى',
    name: { az:'Yəhya', en:'Yahya (John the Baptist)', ru:'Яхья (Иоанн Креститель)', ar:'يحيى', tr:'Yahyâ' },
    era: { az:'~1 e.ə.', en:'~1 BCE', ru:'~1 до н.э.', ar:'~١ ق.م', tr:'~MÖ 1' },
    desc: {
      az:'Zəkəriyyənin oğlu. Uşaq ikən hikmət verildi. Tövratı təsdiq edən saleh peyğəmbər.',
      en:'Son of Zakariyya. Given wisdom as a child. A righteous prophet who confirmed the Torah.',
      ru:'Сын Закарии. Получил мудрость ещё ребёнком. Праведный пророк, подтвердивший Тору.',
      ar:'ابن زكريا. أُوتي الحكمة صبيًا. نبي صالح صدّق بالتوراة.',
      tr:'Zekeriyyâ\'nın oğlu. Çocukken hikmet verildi. Tevrat\'ı tasdik eden salih peygamber.',
    },
    keyFact: {
      az:'Adı daha əvvəl heç kimə verilməmişdi (Məryəm 7).',
      en:'No one before him had been given his name (Maryam 7).',
      ru:'До него никто не носил его имени (Марьям 7).',
      ar:'لم يُسمَّ أحد قبله بهذا الاسم (مريم ٧).',
      tr:'Daha önce hiç kimseye bu isim verilmemişti (Meryem 7).',
    },
    quranRef: 'Maryam 7-15, Ali Imran 39',
  },
  {
    num: 24, arabic: 'عيسى',
    name: { az:'İsa', en:'Isa (Jesus)', ru:'Иса (Иисус)', ar:'عيسى', tr:'Îsâ' },
    era: { az:'~1-33 e.', en:'~1-33 CE', ru:'~1-33 н.э.', ar:'~١-٣٣ م', tr:'~MS 1-33' },
    desc: {
      az:'Məryəmin oğlu, atasız dünyaya gəldi. Beşikdə danışdı. Korları, cüzamlıları sağaltdı, ölüləri diriltdi. Göyə qaldırıldı, qiyamətdən əvvəl geri dönəcək.',
      en:'Son of Maryam, born without a father. Spoke in the cradle. Healed the blind, cured lepers, raised the dead. Raised to heaven, will return before the Day of Judgment.',
      ru:'Сын Марьям, рождённый без отца. Говорил в колыбели. Исцелял слепых, прокажённых, воскрешал мёртвых. Вознесён на небо, вернётся перед Судным днём.',
      ar:'ابن مريم، وُلد بلا أب. تكلّم في المهد. أبرأ الأكمه والأبرص وأحيا الموتى. رُفع إلى السماء وسيعود قبل يوم القيامة.',
      tr:'Meryem\'in oğlu, babasız dünyaya geldi. Beşikte konuştu. Körleri, cüzzamlıları iyileştirdi, ölüleri diriltti. Göğe yükseltildi, kıyametten önce geri dönecek.',
    },
    keyFact: {
      az:'Quranda 25 dəfə adı çəkilir. "Ruhullah" (Allahın ruhu) adlandırılır.',
      en:'Mentioned 25 times in the Quran. Called "Ruhullah" (Spirit of Allah).',
      ru:'Упоминается в Коране 25 раз. Назван «Рухулла» (Дух Аллаха).',
      ar:'ذُكر في القرآن ٢٥ مرة. لُقّب بـ"روح الله".',
      tr:'Kuran\'da 25 kez adı geçer. "Rûhullah" (Allah\'ın ruhu) olarak anılır.',
    },
    quranRef: 'Maryam 16-36, Ali Imran 42-59, Al-Maida 110-118',
  },
  {
    num: 25, arabic: 'محمد',
    name: { az:'Muhəmməd ﷺ', en:'Muhammad ﷺ', ru:'Мухаммад ﷺ', ar:'محمد ﷺ', tr:'Muhammed ﷺ' },
    era: { az:'570-632 e.', en:'570-632 CE', ru:'570-632 н.э.', ar:'٥٧٠-٦٣٢ م', tr:'MS 570-632' },
    desc: {
      az:'Son peyğəmbər və peyğəmbərlərin möhürü. Qurani-Kərim ona nazil edilmişdir. Bütün insanlığa göndərilmişdir. Əxlaqın ən yüksək nümunəsi.',
      en:'The final prophet and Seal of the Prophets. The Quran was revealed to him. Sent to all of humanity. The highest example of character.',
      ru:'Последний пророк и Печать пророков. Ему был ниспослан Коран. Послан ко всему человечеству. Высочайший пример нравственности.',
      ar:'خاتم الأنبياء والمرسلين. أُنزل عليه القرآن الكريم. أُرسل إلى الناس كافة. القدوة العليا في الأخلاق.',
      tr:'Son peygamber ve peygamberlerin mührü. Kur\'ân-ı Kerîm ona indirilmiştir. Tüm insanlığa gönderilmiştir. Ahlâkın en yüce örneği.',
    },
    keyFact: {
      az:'Quranda 4 dəfə adı ilə, 1 dəfə "Əhməd" olaraq zikr edilir.',
      en:'Mentioned by name 4 times in the Quran and once as "Ahmad".',
      ru:'Упомянут по имени 4 раза в Коране и один раз как «Ахмад».',
      ar:'ذُكر باسمه ٤ مرات في القرآن ومرة بـ"أحمد".',
      tr:'Kuran\'da 4 kez adıyla, 1 kez "Ahmed" olarak zikredilir.',
    },
    quranRef: 'Muhammad 2, Ali Imran 144, Al-Ahzab 40, Al-Fath 29',
  },
]

/* ── Events Data ── */
const EVENTS = [
  {
    year: { az:'610 e.', en:'610 CE', ru:'610 н.э.', ar:'٦١٠ م', tr:'MS 610' },
    title: { az:'İlk vəhy', en:'First Revelation', ru:'Первое откровение', ar:'أول وحي', tr:'İlk vahiy' },
    desc: {
      az:'Hira mağarasında Hz. Muhəmmədə ﷺ ilk vəhy nazil oldu. Cəbrail (ə.s.) "İqrə" (Oxu!) əmri ilə gəldi. Ələq surəsinin ilk ayələri endi.',
      en:'The first revelation came to Prophet Muhammad ﷺ in the Cave of Hira. Angel Jibreel came with the command "Iqra" (Read!). The first verses of Surah Al-Alaq were revealed.',
      ru:'Первое откровение снизошло к Пророку Мухаммаду ﷺ в пещере Хира. Ангел Джибриль пришёл с повелением «Икра» (Читай!). Были ниспосланы первые аяты суры Аль-Алак.',
      ar:'نزل أول وحي على النبي ﷺ في غار حراء. جاء جبريل بأمر "اقرأ". نزلت أولى آيات سورة العلق.',
      tr:'Hira mağarasında Hz. Muhammed\'e ﷺ ilk vahiy indi. Cebrâil (a.s.) "İkra" (Oku!) emriyle geldi. Alak sûresinin ilk âyetleri indi.',
    },
    keyFact: {
      az:'Bu gecə "Qədr gecəsi" olaraq da bilinir.',
      en:'This night is also known as the "Night of Power" (Laylat al-Qadr).',
      ru:'Эта ночь также известна как «Ночь Предопределения» (Лайлят аль-Кадр).',
      ar:'تُعرف هذه الليلة أيضًا بـ"ليلة القدر".',
      tr:'Bu gece "Kadir Gecesi" olarak da bilinir.',
    },
  },
  {
    year: { az:'613 e.', en:'613 CE', ru:'613 н.э.', ar:'٦١٣ م', tr:'MS 613' },
    title: { az:'Açıq dəvətin başlanması', en:'Public Dawah Begins', ru:'Начало открытого призыва', ar:'بداية الدعوة العلنية', tr:'Açık davetin başlaması' },
    desc: {
      az:'Hz. Muhəmməd ﷺ Səfa təpəsindən Qureyşə açıq dəvət etdi. 3 il gizli dəvətdən sonra İslam açıq elan edildi.',
      en:'Prophet Muhammad ﷺ publicly called the Quraysh from Mount Safa. After 3 years of secret dawah, Islam was proclaimed openly.',
      ru:'Пророк Мухаммад ﷺ публично обратился к курайшитам с горы Сафа. После 3 лет тайного призыва ислам был провозглашён открыто.',
      ar:'دعا النبي ﷺ قريشًا علنًا من جبل الصفا. بعد ٣ سنوات من الدعوة السرية أُعلن الإسلام جهرًا.',
      tr:'Hz. Muhammed ﷺ Safâ tepesinden Kureyş\'e açık davet yaptı. 3 yıllık gizli davetten sonra İslam açıkça ilan edildi.',
    },
    keyFact: {
      az:'Əbu Ləhəb bu dəvətə düşmənliklə cavab verdi.',
      en:'Abu Lahab responded with hostility to this call.',
      ru:'Абу Лахаб ответил на этот призыв враждебно.',
      ar:'ردّ أبو لهب على هذه الدعوة بالعداء.',
      tr:'Ebû Leheb bu davete düşmanlıkla karşılık verdi.',
    },
  },
  {
    year: { az:'615 e.', en:'615 CE', ru:'615 н.э.', ar:'٦١٥ م', tr:'MS 615' },
    title: { az:'Həbəşistana hicrət', en:'Migration to Abyssinia', ru:'Переселение в Абиссинию', ar:'الهجرة إلى الحبشة', tr:'Habeşistan\'a hicret' },
    desc: {
      az:'Müsəlmanlar Məkkədəki təzyiqlərdən qaçaraq Həbəşistan kralı Nəcaşinin himayəsinə sığındılar.',
      en:'Muslims fled persecution in Mecca and sought refuge under King Najashi (Negus) of Abyssinia.',
      ru:'Мусульмане бежали от преследований в Мекке и нашли убежище у царя Абиссинии Негуса (Наджаши).',
      ar:'فرّ المسلمون من اضطهاد مكة والتجؤوا إلى النجاشي ملك الحبشة.',
      tr:'Müslümanlar Mekke\'deki baskılardan kaçarak Habeşistan kralı Necâşî\'nin himayesine sığındılar.',
    },
    keyFact: {
      az:'Cəfər ibn Əbu Talibin Nəcaşi qarşısındakı məşhur çıxışı.',
      en:'Jafar ibn Abi Talib\'s famous speech before King Najashi.',
      ru:'Знаменитая речь Джафара ибн Абу Талиба перед Негусом.',
      ar:'خطاب جعفر بن أبي طالب الشهير أمام النجاشي.',
      tr:'Câfer bin Ebû Tâlib\'in Necâşî huzurundaki meşhur konuşması.',
    },
  },
  {
    year: { az:'619 e.', en:'619 CE', ru:'619 н.э.', ar:'٦١٩ م', tr:'MS 619' },
    title: { az:'Hüzn ili', en:'Year of Sorrow', ru:'Год скорби', ar:'عام الحزن', tr:'Hüzün yılı' },
    desc: {
      az:'Hz. Muhəmmədin ﷺ həyat yoldaşı Xədicə və əmisi Əbu Talib eyni il vəfat etdi. Bu, Peyğəmbərin ən ağır dövrlərindən biri idi.',
      en:'Prophet Muhammad\'s ﷺ wife Khadijah and uncle Abu Talib both passed away in the same year. One of the most difficult periods for the Prophet.',
      ru:'Жена Пророка Мухаммада ﷺ Хадиджа и его дядя Абу Талиб скончались в один год. Один из самых тяжёлых периодов для Пророка.',
      ar:'توفيت خديجة زوجة النبي ﷺ وعمه أبو طالب في نفس العام. كانت من أصعب فترات حياة النبي ﷺ.',
      tr:'Hz. Muhammed\'in ﷺ eşi Hatice ve amcası Ebû Tâlib aynı yıl vefat etti. Peygamber\'in en ağır dönemlerinden biriydi.',
    },
    keyFact: {
      az:'Bu itkilərdən sonra Taif səfəri baş verdi.',
      en:'The journey to Taif occurred after these losses.',
      ru:'Поездка в Таиф произошла после этих потерь.',
      ar:'جاءت رحلة الطائف بعد هذه الخسارات.',
      tr:'Bu kayıplardan sonra Tâif yolculuğu gerçekleşti.',
    },
  },
  {
    year: { az:'620 e.', en:'620 CE', ru:'620 н.э.', ar:'٦٢٠ م', tr:'MS 620' },
    title: { az:'İsra və Merac', en:'Isra and Miraj', ru:'Исра и Мирадж', ar:'الإسراء والمعراج', tr:'İsrâ ve Mirâc' },
    desc: {
      az:'Peyğəmbərimiz ﷺ bir gecədə Məscidül-Haramdan Məscidül-Əqsaya aparıldı (İsra), sonra göylərə yüksəldildi (Merac). Beş vaxt namaz fərz qılındı.',
      en:'The Prophet ﷺ was taken from Masjid al-Haram to Masjid al-Aqsa in one night (Isra), then ascended to the heavens (Miraj). The five daily prayers were made obligatory.',
      ru:'Пророк ﷺ был перенесён из Масджид аль-Харам в Масджид аль-Акса за одну ночь (Исра), затем вознесён на небеса (Мирадж). Пять ежедневных молитв стали обязательными.',
      ar:'أُسري بالنبي ﷺ من المسجد الحرام إلى المسجد الأقصى (الإسراء) ثم عُرج به إلى السماوات (المعراج). فُرضت الصلوات الخمس.',
      tr:'Peygamberimiz ﷺ bir gecede Mescid-i Haram\'dan Mescid-i Aksâ\'ya götürüldü (İsrâ), sonra göklere yükseltildi (Mirâc). Beş vakit namaz farz kılındı.',
    },
    keyFact: {
      az:'Namaz əvvəlcə 50 vaxt idi, sonra 5-ə endirildi.',
      en:'Prayer was initially 50 times, then reduced to 5.',
      ru:'Молитва изначально была 50 раз, затем сокращена до 5.',
      ar:'كانت الصلاة ٥٠ فُرضت ثم خُفّفت إلى ٥.',
      tr:'Namaz önce 50 vakit idi, sonra 5\'e indirildi.',
    },
  },
  {
    year: { az:'622 e.', en:'622 CE', ru:'622 н.э.', ar:'٦٢٢ م', tr:'MS 622' },
    title: { az:'Mədinəyə Hicrət', en:'Hijra to Medina', ru:'Хиджра в Медину', ar:'الهجرة إلى المدينة', tr:'Medine\'ye Hicret' },
    desc: {
      az:'Hz. Muhəmməd ﷺ və müsəlmanlar Məkkədən Mədinəyə köç etdilər. İslam təqviminin başlanğıcı bu hadisədir. Mədinədə ilk İslam dövləti quruldu.',
      en:'Prophet Muhammad ﷺ and Muslims migrated from Mecca to Medina. This event marks the beginning of the Islamic calendar. The first Islamic state was established in Medina.',
      ru:'Пророк Мухаммад ﷺ и мусульмане переселились из Мекки в Медину. Это событие отмечает начало исламского календаря. В Медине было основано первое исламское государство.',
      ar:'هاجر النبي ﷺ والمسلمون من مكة إلى المدينة. تُمثل هذه الحادثة بداية التقويم الإسلامي. تأسست أول دولة إسلامية في المدينة.',
      tr:'Hz. Muhammed ﷺ ve Müslümanlar Mekke\'den Medine\'ye göç ettiler. İslam takviminin başlangıcı bu olaydır. Medine\'de ilk İslam devleti kuruldu.',
    },
    keyFact: {
      az:'Peyğəmbər mağarada gizləndi — "Qəm etmə, Allah bizimlə" (Tövbə 40).',
      en:'The Prophet hid in a cave — "Do not grieve, Allah is with us" (At-Tawbah 40).',
      ru:'Пророк укрылся в пещере — «Не печалься, Аллах с нами» (Ат-Тауба 40).',
      ar:'اختبأ النبي في الغار — "لا تحزن إن الله معنا" (التوبة ٤٠).',
      tr:'Peygamber mağarada gizlendi — "Üzülme, Allah bizimle" (Tevbe 40).',
    },
  },
  {
    year: { az:'624 e.', en:'624 CE', ru:'624 н.э.', ar:'٦٢٤ م', tr:'MS 624' },
    title: { az:'Bədr döyüşü', en:'Battle of Badr', ru:'Битва при Бадре', ar:'غزوة بدر', tr:'Bedir Savaşı' },
    desc: {
      az:'İslamın ilk böyük döyüşü. 313 müsəlman 1000 nəfərlik Qureyş ordusuna qalib gəldi. Mələklərin köməyi ilə qazanılan zəfər.',
      en:'The first major battle of Islam. 313 Muslims defeated the 1000-strong Quraysh army. Victory achieved with the help of angels.',
      ru:'Первая крупная битва ислама. 313 мусульман победили 1000-ное войско курайшитов. Победа была одержана с помощью ангелов.',
      ar:'أول معركة كبرى في الإسلام. انتصر ٣١٣ مسلمًا على جيش قريش البالغ ألفًا. نصر بتأييد الملائكة.',
      tr:'İslam\'ın ilk büyük savaşı. 313 Müslüman 1000 kişilik Kureyş ordusunu yendi. Meleklerin yardımıyla kazanılan zafer.',
    },
    keyFact: {
      az:'Quran bu döyüşü "Furqan günü" (Haqq ilə batilin ayrıldığı gün) adlandırır.',
      en:'The Quran calls this battle "Yawm al-Furqan" (Day of Criterion).',
      ru:'Коран называет эту битву «Йаум аль-Фуркан» (День Различения).',
      ar:'سمّاه القرآن "يوم الفرقان".',
      tr:'Kuran bu savaşı "Furkân günü" (Hak ile batılın ayrıldığı gün) olarak anar.',
    },
  },
  {
    year: { az:'625 e.', en:'625 CE', ru:'625 н.э.', ar:'٦٢٥ م', tr:'MS 625' },
    title: { az:'Uhud döyüşü', en:'Battle of Uhud', ru:'Битва при Ухуде', ar:'غزوة أحد', tr:'Uhud Savaşı' },
    desc: {
      az:'3000 nəfərlik Qureyş ordusu ilə döyüş. Oxçuların mövqelərini tərk etməsi müsəlmanların ağır itkilərə məruz qalmasına səbəb oldu. Hz. Həmzə şəhid oldu.',
      en:'Battle against the 3000-strong Quraysh army. Archers leaving their positions caused heavy Muslim losses. Hamza was martyred.',
      ru:'Битва против 3000-ного войска курайшитов. Уход лучников с позиций привёл к тяжёлым потерям мусульман. Хамза был убит.',
      ar:'معركة ضد جيش قريش البالغ ٣٠٠٠. ترك الرماة مواقعهم فتكبّد المسلمون خسائر. استُشهد حمزة.',
      tr:'3000 kişilik Kureyş ordusuyla savaş. Okçuların mevzilerini terk etmesi Müslümanların ağır kayıplar vermesine yol açtı. Hz. Hamza şehit düştü.',
    },
    keyFact: {
      az:'Peyğəmbər ﷺ bu döyüşdə yaralandı.',
      en:'The Prophet ﷺ was wounded in this battle.',
      ru:'Пророк ﷺ был ранен в этой битве.',
      ar:'جُرح النبي ﷺ في هذه المعركة.',
      tr:'Peygamber ﷺ bu savaşta yaralandı.',
    },
  },
  {
    year: { az:'627 e.', en:'627 CE', ru:'627 н.э.', ar:'٦٢٧ م', tr:'MS 627' },
    title: { az:'Xəndək döyüşü', en:'Battle of the Trench', ru:'Битва у Рва', ar:'غزوة الخندق', tr:'Hendek Savaşı' },
    desc: {
      az:'10.000 nəfərlik müttəfiq ordu Mədinəyə hücum etdi. Salman Farisinin təklifi ilə xəndək qazıldı. Düşmən geri çəkildi.',
      en:'A 10,000-strong allied army attacked Medina. A trench was dug on Salman al-Farisi\'s suggestion. The enemy retreated.',
      ru:'10000-ное объединённое войско атаковало Медину. По предложению Сальмана аль-Фариси был вырыт ров. Враг отступил.',
      ar:'هاجم جيش من ١٠ آلاف المدينة. حُفر الخندق بمشورة سلمان الفارسي. انسحب العدو.',
      tr:'10.000 kişilik müttefik ordu Medine\'ye saldırdı. Selmân-ı Fârisî\'nin teklifiyle hendek kazıldı. Düşman geri çekildi.',
    },
    keyFact: {
      az:'Allah güclü bir külək göndərərək düşmən ordusunu dağıtdı.',
      en:'Allah sent a fierce wind that scattered the enemy army.',
      ru:'Аллах послал сильный ветер, рассеявший вражеское войско.',
      ar:'أرسل الله ريحًا عاصفة فتفرّق جيش العدو.',
      tr:'Allah şiddetli bir rüzgâr göndererek düşman ordusunu dağıttı.',
    },
  },
  {
    year: { az:'628 e.', en:'628 CE', ru:'628 н.э.', ar:'٦٢٨ م', tr:'MS 628' },
    title: { az:'Hüdeybiyyə müqaviləsi', en:'Treaty of Hudaybiyyah', ru:'Худайбийский договор', ar:'صلح الحديبية', tr:'Hudeybiye Antlaşması' },
    desc: {
      az:'Müsəlmanlarla Qureyş arasında 10 illik sülh müqaviləsi bağlandı. Əvvəlcə müsəlmanlara ağır görünsə də, Quran bunu "açıq fəth" adlandırdı.',
      en:'A 10-year peace treaty was signed between Muslims and Quraysh. Though it initially seemed unfavorable, the Quran called it "a clear victory".',
      ru:'Между мусульманами и курайшитами был заключён 10-летний мирный договор. Хотя поначалу он казался невыгодным, Коран назвал его «явной победой».',
      ar:'عُقدت هدنة ١٠ سنوات بين المسلمين وقريش. رغم أنها بدت في ظاهرها ثقيلة فقد سمّاها القرآن "فتحًا مبينًا".',
      tr:'Müslümanlarla Kureyş arasında 10 yıllık barış antlaşması imzalandı. Başta Müslümanlara ağır görünse de Kuran bunu "apaçık fetih" olarak niteledi.',
    },
    keyFact: {
      az:'Bu müqavilədən sonra İslamı qəbul edənlərin sayı kəskin artdı.',
      en:'The number of converts to Islam increased sharply after this treaty.',
      ru:'После этого договора число принявших ислам резко возросло.',
      ar:'ازداد عدد الداخلين في الإسلام بشكل كبير بعد هذا الصلح.',
      tr:'Bu antlaşmadan sonra İslam\'ı kabul edenlerin sayısı hızla arttı.',
    },
  },
  {
    year: { az:'630 e.', en:'630 CE', ru:'630 н.э.', ar:'٦٣٠ م', tr:'MS 630' },
    title: { az:'Məkkənin fəthi', en:'Conquest of Mecca', ru:'Завоевание Мекки', ar:'فتح مكة', tr:'Mekke\'nin Fethi' },
    desc: {
      az:'10.000 müsəlman ordusu Məkkəyə daxil oldu. Demək olar ki, qansız fəth. Kəbə bütlərdən təmizləndi. Ümumi əfv elan edildi.',
      en:'An army of 10,000 Muslims entered Mecca. A nearly bloodless conquest. The Kaaba was cleansed of idols. A general amnesty was declared.',
      ru:'10000 мусульман вошли в Мекку. Почти бескровное завоевание. Кааба была очищена от идолов. Была объявлена всеобщая амнистия.',
      ar:'دخل ١٠ آلاف مسلم مكة. فتح شبه سلمي. طُهّرت الكعبة من الأصنام. أُعلن العفو العام.',
      tr:'10.000 kişilik Müslüman ordusu Mekke\'ye girdi. Neredeyse kansız bir fetih. Kâbe putlardan temizlendi. Genel af ilan edildi.',
    },
    keyFact: {
      az:'"Bu gün mərhəmət günüdür" — Peyğəmbərin sözü.',
      en:'"Today is the day of mercy" — words of the Prophet.',
      ru:'«Сегодня день милосердия» — слова Пророка.',
      ar:'"اليوم يوم المرحمة" — قول النبي ﷺ.',
      tr:'"Bugün merhamet günüdür" — Peygamber\'in sözü.',
    },
  },
  {
    year: { az:'632 e.', en:'632 CE', ru:'632 н.э.', ar:'٦٣٢ م', tr:'MS 632' },
    title: { az:'Vida Həcci və Peyğəmbərin vəfatı', en:'Farewell Hajj & Prophet\'s Passing', ru:'Прощальный Хадж и кончина Пророка', ar:'حجة الوداع ووفاة النبي', tr:'Veda Haccı ve Peygamber\'in Vefatı' },
    desc: {
      az:'Hz. Muhəmməd ﷺ 100.000-dən çox müsəlmanla Vida Həccini icra etdi. Məşhur Vida Xütbəsini söylədi. Həmin il Rəbiül-Əvvəl ayında vəfat etdi.',
      en:'Prophet Muhammad ﷺ performed the Farewell Hajj with over 100,000 Muslims. He delivered the famous Farewell Sermon. He passed away later that year in Rabi al-Awwal.',
      ru:'Пророк Мухаммад ﷺ совершил Прощальный Хадж с более чем 100 000 мусульман. Произнёс знаменитую Прощальную проповедь. Скончался в том же году в месяце Раби аль-Авваль.',
      ar:'أدى النبي ﷺ حجة الوداع مع أكثر من ١٠٠ ألف مسلم. ألقى خطبة الوداع الشهيرة. توفي في نفس العام في ربيع الأول.',
      tr:'Hz. Muhammed ﷺ 100.000\'den fazla Müslümanla Veda Haccı\'nı ifa etti. Meşhur Veda Hutbesi\'ni okudu. Aynı yıl Rebîülevvel ayında vefat etti.',
    },
    keyFact: {
      az:'"Dininizi tamamladım, nemətimi tamam etdim" — Maidə 3 ayəsi bu həcdə nazil oldu.',
      en:'"I have completed your religion and perfected My favor upon you" — Verse 5:3 was revealed during this Hajj.',
      ru:'«Я завершил для вас вашу религию и довёл до полноты Мою милость» — аят 5:3 был ниспослан во время этого Хаджа.',
      ar:'"اليوم أكملت لكم دينكم وأتممت عليكم نعمتي" — نزلت المائدة ٣ في هذه الحجة.',
      tr:'"Bugün dininizi tamamladım, nimetimi tamam ettim" — Mâide 3 âyeti bu hacda indi.',
    },
  },
  {
    year: { az:'632-661 e.', en:'632-661 CE', ru:'632-661 н.э.', ar:'٦٣٢-٦٦١ م', tr:'MS 632-661' },
    title: { az:'Raşidi Xilafəti', en:'Rashidun Caliphate', ru:'Праведный Халифат', ar:'الخلافة الراشدة', tr:'Râşidîn Hilâfeti' },
    desc: {
      az:'Dörd raşidi xəlifə dövrü: Əbu Bəkr, Ömər, Osman və Əli. İslamın sürətlə yayılma dövrü. Quranın kitab halına gətirilməsi bu dövrdə baş verdi.',
      en:'The era of four Rashidun caliphs: Abu Bakr, Umar, Uthman, and Ali. A period of rapid expansion of Islam. The Quran was compiled into book form during this era.',
      ru:'Эпоха четырёх праведных халифов: Абу Бакра, Умара, Усмана и Али. Период быстрого распространения ислама. Коран был собран в книжную форму в эту эпоху.',
      ar:'عهد الخلفاء الأربعة: أبو بكر وعمر وعثمان وعلي. فترة توسع الإسلام السريع. جُمع القرآن في مصحف واحد.',
      tr:'Dört Râşid Halife dönemi: Ebû Bekir, Ömer, Osman ve Ali. İslam\'ın hızla yayıldığı dönem. Kur\'ân\'ın kitap haline getirilmesi bu dönemde gerçekleşti.',
    },
    keyFact: {
      az:'Bu dövrdə İslam Misirdən İrana qədər yayıldı.',
      en:'Islam spread from Egypt to Iran during this period.',
      ru:'Ислам распространился от Египта до Ирана в этот период.',
      ar:'انتشر الإسلام من مصر إلى إيران في هذه الفترة.',
      tr:'Bu dönemde İslam Mısır\'dan İran\'a kadar yayıldı.',
    },
  },
  {
    year: { az:'661-750 e.', en:'661-750 CE', ru:'661-750 н.э.', ar:'٦٦١-٧٥٠ م', tr:'MS 661-750' },
    title: { az:'Əməvi Xilafəti', en:'Umayyad Caliphate', ru:'Омейядский Халифат', ar:'الخلافة الأموية', tr:'Emevî Hilâfeti' },
    desc: {
      az:'Paytaxt Dəməşq olan böyük İslam imperiyası. İspaniyadan Orta Asiyaya qədər geniş ərazilər fəth edildi. İslam mədəniyyəti sürətlə inkişaf etdi.',
      en:'A great Islamic empire with Damascus as its capital. Vast territories were conquered from Spain to Central Asia. Islamic civilization flourished rapidly.',
      ru:'Великая исламская империя со столицей в Дамаске. Обширные территории от Испании до Центральной Азии были завоёваны. Исламская цивилизация стремительно развивалась.',
      ar:'إمبراطورية إسلامية عظيمة عاصمتها دمشق. فُتحت أراضٍ واسعة من إسبانيا إلى آسيا الوسطى. ازدهرت الحضارة الإسلامية.',
      tr:'Başkenti Şam olan büyük İslam imparatorluğu. İspanya\'dan Orta Asya\'ya kadar geniş topraklar fethedildi. İslam medeniyeti hızla gelişti.',
    },
    keyFact: {
      az:'Tarixin ən böyük imperiyalarından biri — 11 milyon km².',
      en:'One of the largest empires in history — 11 million km².',
      ru:'Одна из крупнейших империй в истории — 11 млн км².',
      ar:'من أكبر الإمبراطوريات في التاريخ — ١١ مليون كم².',
      tr:'Tarihin en büyük imparatorluklarından biri — 11 milyon km².',
    },
  },
  {
    year: { az:'750-1258 e.', en:'750-1258 CE', ru:'750-1258 н.э.', ar:'٧٥٠-١٢٥٨ م', tr:'MS 750-1258' },
    title: { az:'Abbasi Xilafəti', en:'Abbasid Caliphate', ru:'Аббасидский Халифат', ar:'الخلافة العباسية', tr:'Abbâsî Hilâfeti' },
    desc: {
      az:'İslam sivilizasiyasının qızıl dövrü. Bağdad dünya elm mərkəzinə çevrildi. Riyaziyyat, tibb, astronomiya, fəlsəfə sahələrində böyük irəliləyişlər.',
      en:'The Golden Age of Islamic civilization. Baghdad became a world center of learning. Great advances in mathematics, medicine, astronomy, and philosophy.',
      ru:'Золотой век исламской цивилизации. Багдад стал мировым центром учёности. Великие достижения в математике, медицине, астрономии и философии.',
      ar:'العصر الذهبي للحضارة الإسلامية. أصبحت بغداد مركزًا عالميًا للعلم. إنجازات كبرى في الرياضيات والطب والفلك والفلسفة.',
      tr:'İslam medeniyetinin altın çağı. Bağdat dünya ilim merkezine dönüştü. Matematik, tıp, astronomi ve felsefe alanlarında büyük ilerlemeler.',
    },
    keyFact: {
      az:'Beytül-Hikmə (Hikmət Evi) Bağdadda quruldu — dünyanın ən böyük kitabxanası.',
      en:'Bayt al-Hikmah (House of Wisdom) was established in Baghdad — the world\'s greatest library.',
      ru:'Байт аль-Хикма (Дом мудрости) был основан в Багдаде — величайшая библиотека мира.',
      ar:'تأسس بيت الحكمة في بغداد — أعظم مكتبة في العالم.',
      tr:'Beytü\'l-Hikme (Hikmet Evi) Bağdat\'ta kuruldu — dünyanın en büyük kütüphanesi.',
    },
  },
  { year:{az:'614 e.',en:'614 CE',ru:'614 н.э.',ar:'٦١٤ م',tr:'MS 614'}, title:{az:'Müsəlmanlara boykot',en:'Boycott of Muslims',ru:'Бойкот мусульман',ar:'حصار الشعب',tr:'Müslümanlara boykot'}, desc:{az:'Qureyş Haşim oğullarına 3 illik ticarət, evlilik və əlaqə boykotu tətbiq etdi. Şibü Əbi Talibdə çətin illər keçirildi.',en:'Quraysh imposed a 3-year boycott on the Banu Hashim — no trade, marriage or contact. Difficult years in the valley of Abu Talib.',ru:'Курайшиты ввели 3-летний бойкот клана Бану Хашим — ни торговли, ни браков, ни контактов. Тяжёлые годы в ущелье Абу Талиба.',ar:'فرضت قريش حصارًا لثلاث سنوات على بني هاشم — لا تجارة ولا زواج ولا تواصل.',tr:'Kureyş, Benî Hâşim\'e 3 yıllık ticaret, evlilik ve iletişim boykotu uyguladı.'}, keyFact:{az:'Boykot sənədi möcüzəvi şəkildə termitlər tərəfindən yeyildi.',en:'The boycott document was miraculously eaten by termites.',ru:'Документ бойкота был чудесным образом съеден термитами.',ar:'أكلت الأرضة صحيفة المقاطعة إعجازيًا.',tr:'Boykot belgesi mucizevi bir şekilde güve tarafından yendi.'} },
  { year:{az:'625 e.',en:'625 CE',ru:'625 н.э.',ar:'٦٢٥ م',tr:'MS 625'}, title:{az:'Bəni Nadir sürgünü',en:'Exile of Banu Nadir',ru:'Изгнание Бану Надир',ar:'إجلاء بني النضير',tr:'Benî Nadîr sürgünü'}, desc:{az:'Peyğəmbərə ﷺ sui-qəsd cəhdi etdikdən sonra yəhudi Bəni Nadir qəbiləsi Mədinədən sürgün edildi.',en:'The Jewish tribe of Banu Nadir was exiled from Medina after their assassination attempt on the Prophet ﷺ.',ru:'Еврейское племя Бану Надир было изгнано из Медины после покушения на Пророка ﷺ.',ar:'أُجلي بنو النضير من المدينة بعد محاولتهم اغتيال النبي ﷺ.',tr:'Peygamber\'e ﷺ suikast girişiminden sonra Yahudi Benî Nadîr kabilesi Medine\'den sürgün edildi.'}, keyFact:{az:'Həşr surəsi bu hadisə haqqında nazil oldu.',en:'Surah Al-Hashr was revealed about this event.',ru:'Сура Аль-Хашр была ниспослана об этом событии.',ar:'نزلت سورة الحشر بشأن هذه الحادثة.',tr:'Haşr suresi bu olay hakkında indi.'} },
  { year:{az:'628 e.',en:'628 CE',ru:'628 н.э.',ar:'٦٢٨ م',tr:'MS 628'}, title:{az:'Xeybər fəthi',en:'Conquest of Khaybar',ru:'Завоевание Хайбара',ar:'فتح خيبر',tr:'Hayber Fethi'}, desc:{az:'Müsəlmanlar Xeybər qalalarını fəth etdilər. Hz. Əli qala qapısını qaldıraraq məşhur oldu.',en:'Muslims conquered the fortresses of Khaybar. Ali became famous for lifting the fortress gate.',ru:'Мусульмане завоевали крепости Хайбара. Али прославился тем, что поднял ворота крепости.',ar:'فتح المسلمون حصون خيبر. اشتهر علي برفع باب الحصن.',tr:'Müslümanlar Hayber kalelerini fethettiler. Hz. Ali kale kapısını kaldırarak meşhur oldu.'}, keyFact:{az:'Xeybərdə əldə edilən torpaqlar İslamda vergi sisteminin əsasını qoydu.',en:'Lands acquired in Khaybar laid the foundation of the Islamic tax system.',ru:'Земли Хайбара заложили основу исламской налоговой системы.',ar:'أرسَت أراضي خيبر أساس النظام الضريبي الإسلامي.',tr:'Hayber\'de elde edilen topraklar İslam vergi sisteminin temelini attı.'} },
  { year:{az:'629 e.',en:'629 CE',ru:'629 н.э.',ar:'٦٢٩ م',tr:'MS 629'}, title:{az:'Muta döyüşü',en:'Battle of Mutah',ru:'Битва при Муте',ar:'غزوة مؤتة',tr:'Mute Savaşı'}, desc:{az:'Rum imperiyası ilə ilk böyük döyüş. Zeyd ibn Harisə, Cəfər ibn Əbu Talib və Abdullah ibn Rəvahə şəhid oldu. Xalid ibn Vəlid orduyu xilas etdi.',en:'First major battle against the Byzantine Empire. Zayd ibn Harithah, Jafar ibn Abi Talib, and Abdullah ibn Rawaha were martyred. Khalid ibn al-Walid saved the army.',ru:'Первая крупная битва с Византией. Зайд, Джафар и Абдуллах погибли. Халид ибн аль-Валид спас армию.',ar:'أول معركة كبرى مع الروم. استُشهد زيد وجعفر وعبد الله. أنقذ خالد بن الوليد الجيش.',tr:'Bizans ile ilk büyük savaş. Zeyd, Câfer ve Abdullah şehit düştü. Hâlid bin Velîd orduyu kurtardı.'}, keyFact:{az:'Xalid ibn Vəlid bu döyüşdə "Allahın qılıncı" ləqəbini aldı.',en:'Khalid ibn al-Walid earned the title "Sword of Allah" in this battle.',ru:'Халид ибн аль-Валид получил титул «Меч Аллаха» в этой битве.',ar:'لُقّب خالد بن الوليد بـ"سيف الله" في هذه المعركة.',tr:'Hâlid bin Velîd bu savaşta "Allah\'ın Kılıcı" lakabını aldı.'} },
  { year:{az:'630 e.',en:'630 CE',ru:'630 н.э.',ar:'٦٣٠ م',tr:'MS 630'}, title:{az:'Huneyn döyüşü',en:'Battle of Hunayn',ru:'Битва при Хунайне',ar:'غزوة حنين',tr:'Huneyn Savaşı'}, desc:{az:'Məkkə fəthindən sonra Həvazin və Saqif qəbilələri ilə döyüş. Əvvəlcə çətinliklə üzləşdilər, sonra qələbə qazandılar.',en:'Battle against Hawazin and Thaqif tribes after the conquest of Mecca. Initial difficulty, then victory.',ru:'Битва с племенами Хавазин и Сакиф после завоевания Мекки. Сначала трудности, затем победа.',ar:'معركة ضد هوازن وثقيف بعد فتح مكة. صعوبة أولى ثم نصر.',tr:'Mekke\'nin fethinden sonra Hevâzin ve Sakîf kabileleriyle savaş.'}, keyFact:{az:'Quran bu döyüşü Tövbə surəsi 25-26-cı ayələrdə xatırladır.',en:'The Quran mentions this battle in Surah At-Tawbah 25-26.',ru:'Коран упоминает эту битву в суре Ат-Тауба 25-26.',ar:'ذكر القرآن هذه المعركة في التوبة ٢٥-٢٦.',tr:'Kuran bu savaşı Tevbe suresi 25-26\'da anar.'} },
  { year:{az:'630 e.',en:'630 CE',ru:'630 н.э.',ar:'٦٣٠ م',tr:'MS 630'}, title:{az:'Təbük yürüşü',en:'Expedition of Tabuk',ru:'Поход на Табук',ar:'غزوة تبوك',tr:'Tebük Seferi'}, desc:{az:'Peyğəmbərin ﷺ son hərbi yürüşü. 30.000 nəfərlik ordu ilə Rum sərhədinə yürüş. Döyüş baş vermədi, amma bölgə qəbilələri ilə müqavilələr bağlandı.',en:'The Prophet\'s ﷺ last military expedition. March to the Byzantine border with 30,000 troops. No battle occurred but treaties were made.',ru:'Последний военный поход Пророка ﷺ. Марш к границе Византии с 30 000 войск. Битвы не было, но были заключены договоры.',ar:'آخر غزوات النبي ﷺ. مسيرة ٣٠ ألفًا إلى حدود الروم. لم تقع معركة لكن عُقدت معاهدات.',tr:'Peygamber\'in ﷺ son askeri seferi. 30.000 kişilik orduyla Bizans sınırına yürüyüş.'}, keyFact:{az:'Münafiqləri ifşa edən Tövbə surəsinin əksər hissəsi bu yürüş haqqında nazil oldu.',en:'Most of Surah At-Tawbah was revealed about this expedition, exposing hypocrites.',ru:'Большая часть суры Ат-Тауба была ниспослана об этом походе, разоблачая лицемеров.',ar:'نزلت معظم سورة التوبة بشأن هذه الغزوة كاشفةً المنافقين.',tr:'Münafıkları ifşa eden Tevbe suresinin çoğu bu sefer hakkında indi.'} },
  { year:{az:'632 e.',en:'632 CE',ru:'632 н.э.',ar:'٦٣٢ م',tr:'MS 632'}, title:{az:'Riddə müharibələri',en:'Ridda Wars',ru:'Войны Ридда',ar:'حروب الردة',tr:'Ridde Savaşları'}, desc:{az:'Hz. Əbu Bəkrin xilafəti dövründə dindən dönən qəbilələrlə müharibələr. Saxta peyğəmbər Müseylimə məğlub edildi.',en:'Wars against apostate tribes during Abu Bakr\'s caliphate. The false prophet Musaylimah was defeated.',ru:'Войны с вероотступными племенами при халифате Абу Бакра. Лжепророк Мусайлима был побеждён.',ar:'حروب ضد القبائل المرتدة في خلافة أبي بكر. هُزم مسيلمة الكذاب.',tr:'Ebû Bekir\'in halifeliğinde dinden dönen kabilelerle savaşlar. Sahte peygamber Müseylime yenildi.'}, keyFact:{az:'Bu müharibələrdə çoxlu hafiz şəhid oldu, bu da Quranın toplanmasına səbəb oldu.',en:'Many Quran memorizers were martyred, leading to the compilation of the Quran.',ru:'Многие хафизы погибли, что привело к составлению Корана в книжную форму.',ar:'استُشهد كثير من الحفّاظ فكان ذلك سببًا لجمع القرآن.',tr:'Çok sayıda hafız şehit oldu, bu da Kuran\'ın derlenmesine yol açtı.'} },
  { year:{az:'634 e.',en:'634 CE',ru:'634 н.э.',ar:'٦٣٤ م',tr:'MS 634'}, title:{az:'Hz. Ömərin xilafəti',en:'Umar\'s Caliphate Begins',ru:'Начало халифата Умара',ar:'خلافة عمر',tr:'Hz. Ömer\'in halifeliği'}, desc:{az:'Hz. Ömər 10 il ədalətlə hökm sürdü. Qüds fəth edildi, İran imperiyası məğlub edildi. Hicri təqvim quruldu.',en:'Umar ruled justly for 10 years. Jerusalem was conquered, the Persian Empire was defeated. The Hijri calendar was established.',ru:'Умар правил справедливо 10 лет. Иерусалим был завоёван, Персидская империя побеждена. Был установлен календарь Хиджры.',ar:'حكم عمر بالعدل ١٠ سنوات. فُتح بيت المقدس وهُزمت فارس. أُسس التقويم الهجري.',tr:'Hz. Ömer 10 yıl adaletle hükmetti. Kudüs fethedildi, Fars İmparatorluğu yenildi. Hicrî takvim kuruldu.'}, keyFact:{az:'Hz. Ömər Qüdsü qan tökülmədən fəth etdi.',en:'Umar conquered Jerusalem without bloodshed.',ru:'Умар завоевал Иерусалим без кровопролития.',ar:'فتح عمر القدس بلا إراقة دماء.',tr:'Hz. Ömer Kudüs\'ü kan dökmeden fethetti.'} },
  { year:{az:'637 e.',en:'637 CE',ru:'637 н.э.',ar:'٦٣٧ م',tr:'MS 637'}, title:{az:'Qadisiyyə döyüşü',en:'Battle of Qadisiyyah',ru:'Битва при Кадисии',ar:'معركة القادسية',tr:'Kâdisiye Savaşı'}, desc:{az:'Sasani imperiyası ilə həlledici döyüş. Səd ibn Əbi Vəqqas komandanlığında müsəlmanlar qələbə qazandı. İraq fəth edildi.',en:'Decisive battle against the Sassanid Empire. Muslims won under Saad ibn Abi Waqqas. Iraq was conquered.',ru:'Решающая битва с Сасанидской империей. Мусульмане победили под командованием Саада ибн Абу Ваккаса. Ирак был завоёван.',ar:'معركة حاسمة ضد الساسانيين. انتصر المسلمون بقيادة سعد بن أبي وقاص. فُتح العراق.',tr:'Sasani İmparatorluğu\'yla belirleyici savaş. Sa\'d bin Ebî Vakkas komutasında Müslümanlar galip geldi.'}, keyFact:{az:'Sasani bayrağı Dərəfşi-Kaviyan ələ keçirildi.',en:'The Sasanid royal banner Derafsh Kaviani was captured.',ru:'Сасанидское царское знамя Дерафш-е Кавиани было захвачено.',ar:'غُنمت راية كسرى الملكية.',tr:'Sasani kraliyet sancağı ele geçirildi.'} },
  { year:{az:'638 e.',en:'638 CE',ru:'638 н.э.',ar:'٦٣٨ م',tr:'MS 638'}, title:{az:'Qüdsün fəthi',en:'Conquest of Jerusalem',ru:'Завоевание Иерусалима',ar:'فتح القدس',tr:'Kudüs\'ün Fethi'}, desc:{az:'Hz. Ömər şəxsən Qüdsə gedərək patriarxdan şəhərin açarlarını aldı. Bütün dinlərin azadlığına zəmanət verdi.',en:'Umar personally went to Jerusalem and received the keys from the Patriarch. He guaranteed freedom of all religions.',ru:'Умар лично прибыл в Иерусалим и принял ключи от Патриарха. Он гарантировал свободу всех религий.',ar:'ذهب عمر شخصيًا إلى القدس وتسلّم المفاتيح من البطريرك. ضمن حرية جميع الأديان.',tr:'Hz. Ömer bizzat Kudüs\'e giderek patriarktan şehrin anahtarlarını aldı. Tüm dinlerin özgürlüğünü garanti etti.'}, keyFact:{az:'Öməri müqavilə (Əhdiyyə) tarixi din tolerantlığı sənədidir.',en:'The Pact of Umar is a historic document of religious tolerance.',ru:'Договор Умара — исторический документ религиозной толерантности.',ar:'العهدة العمرية وثيقة تاريخية للتسامح الديني.',tr:'Ömer Ahidnâmesi tarihi bir din toleransı belgesidir.'} },
  { year:{az:'644 e.',en:'644 CE',ru:'644 н.э.',ar:'٦٤٤ م',tr:'MS 644'}, title:{az:'Hz. Osmanın xilafəti',en:'Uthman\'s Caliphate',ru:'Халифат Усмана',ar:'خلافة عثمان',tr:'Hz. Osman\'ın halifeliği'}, desc:{az:'Hz. Osman 12 il xəlifəlik etdi. Quranın vahid nüsxəsi hazırlanıb bütün vilayətlərə göndərildi. İslam donanması quruldu.',en:'Uthman served as caliph for 12 years. A standardized copy of the Quran was prepared and sent to all provinces. The Islamic navy was established.',ru:'Усман был халифом 12 лет. Был подготовлен стандартный экземпляр Корана и разослан по провинциям. Был создан исламский флот.',ar:'حكم عثمان ١٢ سنة. أُعدّت نسخة موحدة من القرآن وأُرسلت للأمصار. تأسس الأسطول الإسلامي.',tr:'Hz. Osman 12 yıl halifelik yaptı. Kuran\'ın standart nüshası hazırlanıp tüm vilayetlere gönderildi.'}, keyFact:{az:'Bugünkü Quranın yazılış forması "Osmani Mushaf" adlanır.',en:'The current written form of the Quran is called the "Uthmani Mushaf".',ru:'Современная письменная форма Корана называется «Усмановский Мусхаф».',ar:'شكل كتابة القرآن اليوم يُسمّى "المصحف العثماني".',tr:'Kuran\'ın bugünkü yazım biçimi "Osmânî Mushaf" olarak adlandırılır.'} },
  { year:{az:'656 e.',en:'656 CE',ru:'656 н.э.',ar:'٦٥٦ م',tr:'MS 656'}, title:{az:'Hz. Əlinin xilafəti',en:'Ali\'s Caliphate',ru:'Халифат Али',ar:'خلافة علي',tr:'Hz. Ali\'nin halifeliği'}, desc:{az:'Hz. Əli dördüncü raşidi xəlifə oldu. Daxili qarşıdurmalar dövründə ədalətlə hökm sürməyə çalışdı.',en:'Ali became the fourth Rashidun caliph. He strived to rule justly during a period of internal conflicts.',ru:'Али стал четвёртым праведным халифом. Он стремился править справедливо в период внутренних конфликтов.',ar:'أصبح علي الخليفة الراشدي الرابع. سعى للحكم بالعدل في فترة صراعات داخلية.',tr:'Hz. Ali dördüncü Râşid halife oldu. İç çatışmalar döneminde adaletle hükmetmeye çalıştı.'}, keyFact:{az:'Hz. Əli elm və fəsahətilə tanınırdı — "Elm şəhərinin qapısı".',en:'Ali was known for his knowledge and eloquence — "The gate of the city of knowledge".',ru:'Али был известен знаниями и красноречием — «Врата города знаний».',ar:'عُرف علي بعلمه وفصاحته — "باب مدينة العلم".',tr:'Hz. Ali ilim ve belâgatıyla tanınırdı — "İlim şehrinin kapısı".'} },
  { year:{az:'680 e.',en:'680 CE',ru:'680 н.э.',ar:'٦٨٠ م',tr:'MS 680'}, title:{az:'Kərbəla faciəsi',en:'Tragedy of Karbala',ru:'Трагедия Кербелы',ar:'مأساة كربلاء',tr:'Kerbelâ faciası'}, desc:{az:'Hz. Hüseyn ibn Əli Kərbəlada Yezid qoşunları tərəfindən şəhid edildi. İslam tarixinin ən kədərli hadisələrindən biri.',en:'Husayn ibn Ali was martyred at Karbala by the forces of Yazid. One of the most sorrowful events in Islamic history.',ru:'Хусейн ибн Али был убит в Кербеле войсками Язида. Одно из самых печальных событий в истории ислама.',ar:'استُشهد الحسين بن علي في كربلاء على يد جيش يزيد. من أحزن أحداث التاريخ الإسلامي.',tr:'Hz. Hüseyin bin Ali, Kerbelâ\'da Yezid kuvvetleri tarafından şehit edildi.'}, keyFact:{az:'Kərbəla hadisəsi İslam ümmətini dərindən təsirlədi.',en:'The event of Karbala deeply impacted the Muslim ummah.',ru:'Событие Кербелы глубоко повлияло на мусульманскую умму.',ar:'أثّرت حادثة كربلاء في الأمة الإسلامية تأثيرًا عميقًا.',tr:'Kerbelâ olayı İslam ümmetini derinden etkiledi.'} },
  { year:{az:'685 e.',en:'685 CE',ru:'685 н.э.',ar:'٦٨٥ م',tr:'MS 685'}, title:{az:'Qübbətüs-Saxranın tikilməsi',en:'Dome of the Rock Built',ru:'Купол Скалы построен',ar:'بناء قبة الصخرة',tr:'Kubbetü\'s-Sahra\'nın inşası'}, desc:{az:'Əbdülməlik ibn Mərvan Qüdsdə Qübbətüs-Saxranı tikdirdi — İslam memarlığının ən qədim abidələrindən biri.',en:'Abd al-Malik ibn Marwan built the Dome of the Rock in Jerusalem — one of the oldest Islamic architectural monuments.',ru:'Абд аль-Малик ибн Марван построил Купол Скалы в Иерусалиме — один из древнейших памятников исламской архитектуры.',ar:'بنى عبد الملك بن مروان قبة الصخرة في القدس — من أقدم المعالم المعمارية الإسلامية.',tr:'Abdülmelik bin Mervân Kudüs\'te Kubbetü\'s-Sahra\'yı inşa ettirdi.'}, keyFact:{az:'Merac hadisəsinin baş verdiyi qaya üzərində tikilmişdir.',en:'Built over the rock from which the Miraj (ascension) took place.',ru:'Построен над скалой, с которой произошёл Мирадж.',ar:'بُني فوق الصخرة التي عُرج منها النبي ﷺ.',tr:'Mirâc hadisesinin gerçekleştiği kaya üzerinde inşa edilmiştir.'} },
  { year:{az:'711 e.',en:'711 CE',ru:'711 н.э.',ar:'٧١١ م',tr:'MS 711'}, title:{az:'Əndəlüsün fəthi',en:'Conquest of Andalusia',ru:'Завоевание Андалусии',ar:'فتح الأندلس',tr:'Endülüs\'ün Fethi'}, desc:{az:'Tariq ibn Ziyad Cəbəlüttariq boğazını keçərək İberiya yarımadasını fəth etdi. 800 illik İslam sivilizasiyasının başlanğıcı.',en:'Tariq ibn Ziyad crossed the Strait of Gibraltar and conquered the Iberian Peninsula. Beginning of 800 years of Islamic civilization.',ru:'Тарик ибн Зияд пересёк Гибралтарский пролив и завоевал Иберийский полуостров. Начало 800-летней исламской цивилизации.',ar:'عبر طارق بن زياد مضيق جبل طارق وفتح شبه الجزيرة الإيبيرية. بداية ٨٠٠ عام من الحضارة الإسلامية.',tr:'Târık bin Ziyâd Cebelitârık Boğazı\'nı geçerek İberya Yarımadası\'nı fethetti. 800 yıllık İslam medeniyetinin başlangıcı.'}, keyFact:{az:'Cəbəlüttariq (Gibraltar) adı "Tariqin dağı" — Cəbəl-i Tariq-dən gəlir.',en:'Gibraltar gets its name from "Jabal Tariq" — Mountain of Tariq.',ru:'Гибралтар назван от «Джабаль Тарик» — Гора Тарика.',ar:'جبل طارق سُمي نسبة لطارق بن زياد.',tr:'Cebelitârık adı "Târık\'ın Dağı" — Cebel-i Târık\'tan gelir.'} },
  { year:{az:'732 e.',en:'732 CE',ru:'732 н.э.',ar:'٧٣٢ م',tr:'MS 732'}, title:{az:'Puatye döyüşü',en:'Battle of Tours',ru:'Битва при Пуатье',ar:'معركة بلاط الشهداء',tr:'Puvatye Savaşı'}, desc:{az:'Müsəlman ordusu Fransanın Puatye şəhərində Karl Martel tərəfindən dayandırıldı. İslamın Avropada yayılmasının sərhəddi oldu.',en:'The Muslim army was stopped by Charles Martel at Tours in France. This marked the limit of Islamic expansion in Europe.',ru:'Мусульманская армия была остановлена Карлом Мартеллом при Пуатье. Это стало границей исламской экспансии в Европе.',ar:'أوقف كارل مارتل الجيش الإسلامي عند بواتييه. حدّ ذلك من التوسع الإسلامي في أوروبا.',tr:'Müslüman ordusu Fransa\'nın Tours şehrinde Charles Martel tarafından durduruldu.'}, keyFact:{az:'Ərəblər bunu "Şəhidlər meydanı döyüşü" adlandırır.',en:'Arabs call this the "Battle of the Court of Martyrs".',ru:'Арабы называют это «Битвой двора мучеников».',ar:'يُسمّيها العرب "معركة بلاط الشهداء".',tr:'Araplar bunu "Şehitler Meydanı Savaşı" olarak anar.'} },
  { year:{az:'762 e.',en:'762 CE',ru:'762 н.э.',ar:'٧٦٢ م',tr:'MS 762'}, title:{az:'Bağdadın qurulması',en:'Foundation of Baghdad',ru:'Основание Багдада',ar:'تأسيس بغداد',tr:'Bağdat\'ın Kuruluşu'}, desc:{az:'Xəlifə Mənsur Bağdad şəhərini qurdu — "Sülh şəhəri" (Mədinətüs-Salam). Dünyanın ən böyük şəhərlərindən birinə çevrildi.',en:'Caliph al-Mansur founded the city of Baghdad — "City of Peace" (Madinatus-Salam). It became one of the largest cities in the world.',ru:'Халиф аль-Мансур основал Багдад — «Город мира». Он стал одним из крупнейших городов мира.',ar:'أسس الخليفة المنصور مدينة بغداد — "مدينة السلام". أصبحت من أكبر مدن العالم.',tr:'Halife Mansûr Bağdat şehrini kurdu — "Barış Şehri" (Medînetü\'s-Selâm).'}, keyFact:{az:'Bağdad dairəvi planla tikildı — dünyada ilk dəfə.',en:'Baghdad was built with a circular plan — the first in the world.',ru:'Багдад был построен по круглому плану — впервые в мире.',ar:'بُنيت بغداد بتخطيط دائري — لأول مرة في العالم.',tr:'Bağdat dairesel planla inşa edildi — dünyada ilk kez.'} },
  { year:{az:'830 e.',en:'830 CE',ru:'830 н.э.',ar:'٨٣٠ م',tr:'MS 830'}, title:{az:'Beytül-Hikmə',en:'House of Wisdom',ru:'Дом мудрости',ar:'بيت الحكمة',tr:'Beytü\'l-Hikme'}, desc:{az:'Xəlifə Məmun Bağdadda Beytül-Hikmə akademiyasını genişləndirdi. Yunan, Farsi və Hind əsərləri ərəbcəyə tərcümə edildi.',en:'Caliph al-Mamun expanded the House of Wisdom academy in Baghdad. Greek, Persian and Indian works were translated into Arabic.',ru:'Халиф аль-Мамун расширил академию Байт аль-Хикма в Багдаде. Греческие, персидские и индийские труды были переведены на арабский.',ar:'وسّع الخليفة المأمون بيت الحكمة في بغداد. تُرجمت أعمال يونانية وفارسية وهندية إلى العربية.',tr:'Halife Me\'mûn Bağdat\'taki Beytü\'l-Hikme akademisini genişletti.'}, keyFact:{az:'Əl-Xarəzmi burada cəbr elmini inkişaf etdirdi — "Algebra" sözü ondan gəlir.',en:'Al-Khwarizmi developed algebra here — the word "Algebra" comes from his work.',ru:'Аль-Хорезми развил алгебру здесь — слово «Алгебра» происходит от его труда.',ar:'طوّر الخوارزمي الجبر هنا — كلمة "Algebra" مستمدة من عمله.',tr:'Hârizmî burada cebir ilmini geliştirdi — "Algebra" kelimesi onun eserinden gelir.'} },
  { year:{az:'1099 e.',en:'1099 CE',ru:'1099 н.э.',ar:'١٠٩٩ م',tr:'MS 1099'}, title:{az:'Birinci Xaç yürüşü',en:'First Crusade',ru:'Первый крестовый поход',ar:'الحملة الصليبية الأولى',tr:'Birinci Haçlı Seferi'}, desc:{az:'Avropalı xaçlılar Qüdsü ələ keçirdilər. Şəhərdə böyük qırğın törətdilər. 88 il davam edəcək xaçlı dövlətləri quruldu.',en:'European crusaders captured Jerusalem. A great massacre took place. Crusader states were established, lasting 88 years.',ru:'Европейские крестоносцы захватили Иерусалим. Произошла великая резня. Были основаны государства крестоносцев, просуществовавшие 88 лет.',ar:'استولى الصليبيون الأوروبيون على القدس وارتكبوا مجزرة كبرى. أُسست دول صليبية دامت ٨٨ عامًا.',tr:'Avrupalı Haçlılar Kudüs\'ü ele geçirdiler. Büyük katliam yaptılar.'}, keyFact:{az:'Müsəlman, yəhudi və xristianlar qılıncdan keçirildi.',en:'Muslims, Jews and Christians were put to the sword.',ru:'Мусульмане, иудеи и христиане были преданы мечу.',ar:'قُتل المسلمون واليهود والمسيحيون بالسيف.',tr:'Müslüman, Yahudi ve Hristiyanlar kılıçtan geçirildi.'} },
  { year:{az:'1187 e.',en:'1187 CE',ru:'1187 н.э.',ar:'١١٨٧ م',tr:'MS 1187'}, title:{az:'Hittin döyüşü və Qüdsün geri alınması',en:'Battle of Hattin & Reconquest of Jerusalem',ru:'Битва при Хаттине и возвращение Иерусалима',ar:'معركة حطين واسترداد القدس',tr:'Hıttin Savaşı ve Kudüs\'ün geri alınması'}, desc:{az:'Səlahəddin Əyyubi Hittin döyüşündə xaçlıları məğlub etdi. Qüdsü 88 ildən sonra geri aldı. Heç bir qırğın törətmədi.',en:'Saladin defeated the Crusaders at the Battle of Hattin. He recaptured Jerusalem after 88 years. No massacre was committed.',ru:'Саладин разгромил крестоносцев при Хаттине. Вернул Иерусалим спустя 88 лет. Никакой резни не произошло.',ar:'هزم صلاح الدين الصليبيين في حطين. استردّ القدس بعد ٨٨ عامًا. لم يرتكب مجزرة.',tr:'Selâhaddîn Eyyûbî Hıttin Savaşı\'nda Haçlıları yendi. 88 yıl sonra Kudüs\'ü geri aldı.'}, keyFact:{az:'Səlahəddin fəthdən sonra xristian kilsələrinə toxunmadı.',en:'Saladin did not touch Christian churches after the conquest.',ru:'Саладин не тронул христианские церкви после завоевания.',ar:'لم يمس صلاح الدين الكنائس المسيحية بعد الفتح.',tr:'Selâhaddîn fetihten sonra Hristiyan kiliselerine dokunmadı.'} },
  { year:{az:'1258 e.',en:'1258 CE',ru:'1258 н.э.',ar:'١٢٥٨ م',tr:'MS 1258'}, title:{az:'Bağdadın süqutu',en:'Fall of Baghdad',ru:'Падение Багдада',ar:'سقوط بغداد',tr:'Bağdat\'ın düşüşü'}, desc:{az:'Monqol hökmdarı Hülakü xan Bağdadı ələ keçirdi. Abbasi xilafətinə son qoyuldu. Kitabxanalar yandırıldı, minlərlə insan öldürüldü.',en:'Mongol ruler Hulagu Khan captured Baghdad. The Abbasid Caliphate was ended. Libraries were burned, thousands were killed.',ru:'Монгольский правитель Хулагу-хан захватил Багдад. Аббасидский халифат пал. Библиотеки были сожжены, тысячи убиты.',ar:'استولى هولاكو على بغداد. سقطت الخلافة العباسية. أُحرقت المكتبات وقُتل الآلاف.',tr:'Moğol hükümdarı Hülâgû Han Bağdat\'ı ele geçirdi. Abbasî Hilâfeti sona erdi.'}, keyFact:{az:'Dəclə çayının suyu kitablardan tökülən mürəkkəbdən qara oldu.',en:'The Tigris River turned black from ink of the books thrown into it.',ru:'Воды Тигра почернели от чернил выброшенных в реку книг.',ar:'أصبح ماء دجلة أسود من حبر الكتب المُلقاة فيه.',tr:'Dicle Nehri\'nin suyu atılan kitapların mürekkebinden siyaha döndü.'} },
  { year:{az:'1260 e.',en:'1260 CE',ru:'1260 н.э.',ar:'١٢٦٠ م',tr:'MS 1260'}, title:{az:'Eynü Calut döyüşü',en:'Battle of Ain Jalut',ru:'Битва при Айн-Джалуте',ar:'معركة عين جالوت',tr:'Ayn Câlût Savaşı'}, desc:{az:'Məmlük komandanı Qutz Monqolları ilk dəfə həlledici şəkildə məğlub etdi. Monqol istilasının yayılması dayandırıldı.',en:'Mamluk commander Qutuz decisively defeated the Mongols for the first time. The spread of the Mongol invasion was stopped.',ru:'Мамлюкский командир Кутуз впервые решительно разгромил монголов. Распространение монгольского нашествия было остановлено.',ar:'هزم القائد المملوكي قطز المغول هزيمة حاسمة لأول مرة. أُوقف توسع الغزو المغولي.',tr:'Memlük komutanı Kutuz, Moğolları ilk kez kesin bir yenilgiye uğrattı.'}, keyFact:{az:'Bu döyüş İslam sivilizasiyasını xilas edən həlledici andır.',en:'This battle is the decisive moment that saved Islamic civilization.',ru:'Эта битва — решающий момент, спасший исламскую цивилизацию.',ar:'هذه المعركة لحظة حاسمة أنقذت الحضارة الإسلامية.',tr:'Bu savaş İslam medeniyetini kurtaran belirleyici andır.'} },
  { year:{az:'1299 e.',en:'1299 CE',ru:'1299 н.э.',ar:'١٢٩٩ م',tr:'MS 1299'}, title:{az:'Osmanlı dövlətinin qurulması',en:'Foundation of Ottoman Empire',ru:'Основание Османской империи',ar:'تأسيس الدولة العثمانية',tr:'Osmanlı Devleti\'nin kuruluşu'}, desc:{az:'Osman Qazi Anadoluda Osmanlı beyləyini qurdu. 600+ il davam edəcək İslam imperiyasının başlanğıcı.',en:'Osman Ghazi founded the Ottoman principality in Anatolia. The beginning of an Islamic empire that would last over 600 years.',ru:'Осман Гази основал Османский бейлик в Анатолии. Начало исламской империи, просуществовавшей более 600 лет.',ar:'أسس عثمان غازي الإمارة العثمانية في الأناضول. بداية إمبراطورية إسلامية دامت أكثر من ٦٠٠ عام.',tr:'Osman Gazi Anadolu\'da Osmanlı beyliğini kurdu. 600+ yıl sürecek İslam imparatorluğunun başlangıcı.'}, keyFact:{az:'Osmanlı imperiyası 3 qitədə hökmranlıq etdi.',en:'The Ottoman Empire ruled over 3 continents.',ru:'Османская империя правила тремя континентами.',ar:'حكمت الإمبراطورية العثمانية ثلاث قارات.',tr:'Osmanlı İmparatorluğu 3 kıtada hüküm sürdü.'} },
  { year:{az:'1453 e.',en:'1453 CE',ru:'1453 н.э.',ar:'١٤٥٣ م',tr:'MS 1453'}, title:{az:'İstanbulun fəthi',en:'Conquest of Constantinople',ru:'Завоевание Константинополя',ar:'فتح القسطنطينية',tr:'İstanbul\'un Fethi'}, desc:{az:'Sultan Mehmed Fatih Konstantinopolu fəth edərək Şərqi Roma imperiyasına son qoydu. Şəhər İstanbul adını aldı və Osmanlının paytaxtı oldu.',en:'Sultan Mehmed the Conqueror conquered Constantinople, ending the Eastern Roman Empire. The city was renamed Istanbul and became the Ottoman capital.',ru:'Султан Мехмед Завоеватель завоевал Константинополь, положив конец Восточной Римской империи. Город был переименован в Стамбул.',ar:'فتح السلطان محمد الفاتح القسطنطينية منهيًا الإمبراطورية الرومانية الشرقية. سُمّيت المدينة إسطنبول.',tr:'Sultan Mehmed Fatih, Konstantinopolis\'i fethederek Doğu Roma İmparatorluğu\'na son verdi.'}, keyFact:{az:'Peyğəmbər ﷺ bu fəthi hədisdə müjdələmişdi.',en:'The Prophet ﷺ had foretold this conquest in a hadith.',ru:'Пророк ﷺ предсказал это завоевание в хадисе.',ar:'بشّر النبي ﷺ بهذا الفتح في حديث.',tr:'Peygamber ﷺ bu fethi hadiste müjdelemişti.'} },
  { year:{az:'1492 e.',en:'1492 CE',ru:'1492 н.э.',ar:'١٤٩٢ م',tr:'MS 1492'}, title:{az:'Əndəlüsün süqutu',en:'Fall of Andalusia',ru:'Падение Андалусии',ar:'سقوط الأندلس',tr:'Endülüs\'ün düşüşü'}, desc:{az:'Qranada — İberiya yarımadasındakı son müsəlman dövləti süqut etdi. 800 illik İslam sivilizasiyası sona çatdı.',en:'Granada — the last Muslim state on the Iberian Peninsula — fell. 800 years of Islamic civilization came to an end.',ru:'Гранада — последнее мусульманское государство на Пиренейском полуострове — пала. 800-летняя исламская цивилизация завершилась.',ar:'سقطت غرناطة — آخر دولة إسلامية في شبه الجزيرة. انتهت ٨٠٠ عام من الحضارة الإسلامية.',tr:'Gırnata — İberya Yarımadası\'ndaki son Müslüman devleti — düştü. 800 yıllık İslam medeniyeti sona erdi.'}, keyFact:{az:'Əndəlüs elmə, sənətə və memarlığa böyük töhfələr vermişdi.',en:'Andalusia had made great contributions to science, art and architecture.',ru:'Андалусия внесла огромный вклад в науку, искусство и архитектуру.',ar:'قدمت الأندلس إسهامات عظيمة في العلم والفن والعمارة.',tr:'Endülüs bilime, sanata ve mimariye büyük katkılarda bulunmuştu.'} },
  { year:{az:'1517 e.',en:'1517 CE',ru:'1517 н.э.',ar:'١٥١٧ م',tr:'MS 1517'}, title:{az:'Osmanlının xilafəti qəbul etməsi',en:'Ottoman Caliphate',ru:'Османский Халифат',ar:'الخلافة العثمانية',tr:'Osmanlı Hilâfeti'}, desc:{az:'Sultan Səlim Misiri fəth edərək xilafəti Osmanlıya keçirdi. Osmanlı sultani eyni zamanda xəlifə oldu.',en:'Sultan Selim conquered Egypt and transferred the caliphate to the Ottomans. The Ottoman sultan became the caliph.',ru:'Султан Селим завоевал Египет и перенёс халифат к Османам. Османский султан стал халифом.',ar:'فتح السلطان سليم مصر ونقل الخلافة إلى العثمانيين.',tr:'Sultan Selim Mısır\'ı fethederek hilâfeti Osmanlı\'ya devretti.'}, keyFact:{az:'Osmanlı xilafəti 1924-ə qədər davam etdi.',en:'The Ottoman Caliphate lasted until 1924.',ru:'Османский халифат просуществовал до 1924 года.',ar:'استمرت الخلافة العثمانية حتى ١٩٢٤.',tr:'Osmanlı Hilâfeti 1924\'e kadar sürdü.'} },
  { year:{az:'1526 e.',en:'1526 CE',ru:'1526 н.э.',ar:'١٥٢٦ م',tr:'MS 1526'}, title:{az:'Moğol (Baburilər) imperiyası',en:'Mughal Empire Founded',ru:'Империя Великих Моголов',ar:'تأسيس الإمبراطورية المغولية',tr:'Bâbür İmparatorluğu'}, desc:{az:'Babur Hindistanda Moğol imperiyasını qurdu. Tac Mahal, İslami memarlıq və elm inkişaf etdi.',en:'Babur founded the Mughal Empire in India. The Taj Mahal, Islamic architecture and science flourished.',ru:'Бабур основал империю Великих Моголов в Индии. Тадж-Махал, исламская архитектура и наука процветали.',ar:'أسس بابر الإمبراطورية المغولية في الهند. ازدهر تاج محل والعمارة والعلوم الإسلامية.',tr:'Bâbür Hindistan\'da Bâbür İmparatorluğu\'nu kurdu. Tac Mahal, İslam mimarisi ve ilim gelişti.'}, keyFact:{az:'Tac Mahal dünya miras siyahısına daxildir.',en:'The Taj Mahal is a UNESCO World Heritage Site.',ru:'Тадж-Махал — объект Всемирного наследия ЮНЕСКО.',ar:'تاج محل موقع تراث عالمي لليونسكو.',tr:'Tac Mahal UNESCO Dünya Mirası listesindedir.'} },
  { year:{az:'1798 e.',en:'1798 CE',ru:'1798 н.э.',ar:'١٧٩٨ م',tr:'MS 1798'}, title:{az:'Napoleonun Misirə hücumu',en:'Napoleon\'s Invasion of Egypt',ru:'Вторжение Наполеона в Египет',ar:'حملة نابليون على مصر',tr:'Napolyon\'un Mısır Seferi'}, desc:{az:'Napoleon Bonapart Misirə hücum etdi. Modern Avropa imperializminin İslam dünyasına ilk müdaxiləsi.',en:'Napoleon Bonaparte invaded Egypt. The first modern European imperialist intervention in the Muslim world.',ru:'Наполеон Бонапарт вторгся в Египет. Первое вмешательство европейского империализма в мусульманский мир.',ar:'غزا نابليون بونابرت مصر. أول تدخل إمبريالي أوروبي حديث في العالم الإسلامي.',tr:'Napolyon Bonapart Mısır\'a saldırdı. Modern Avrupa emperyalizminin İslam dünyasına ilk müdahalesi.'}, keyFact:{az:'Misir hərbi müqavimət göstərdi — Əl-Əzhər üləmalarının rolu böyük idi.',en:'Egypt showed military resistance — the scholars of Al-Azhar played a key role.',ru:'Египет оказал военное сопротивление — учёные Аль-Азхара сыграли ключевую роль.',ar:'قاومت مصر عسكريًا — لعب علماء الأزهر دورًا محوريًا.',tr:'Mısır askeri direniş gösterdi — Ezher âlimlerinin rolü büyüktü.'} },
  { year:{az:'1924 e.',en:'1924 CE',ru:'1924 н.э.',ar:'١٩٢٤ م',tr:'MS 1924'}, title:{az:'Xilafətin ləğvi',en:'Abolition of the Caliphate',ru:'Упразднение Халифата',ar:'إلغاء الخلافة',tr:'Hilâfetin kaldırılması'}, desc:{az:'Türkiyədə Xilafət rəsmi olaraq ləğv edildi. 1300+ illik xilafət müəssisəsi sona çatdı.',en:'The Caliphate was officially abolished in Turkey. The 1300+ year institution of the Caliphate came to an end.',ru:'Халифат был официально упразднён в Турции. Институт халифата, существовавший более 1300 лет, прекратил существование.',ar:'أُلغيت الخلافة رسميًا في تركيا. انتهت مؤسسة الخلافة التي دامت أكثر من ١٣٠٠ عام.',tr:'Hilâfet Türkiye\'de resmen kaldırıldı. 1300+ yıllık hilâfet müessesesi sona erdi.'}, keyFact:{az:'Son xəlifə Abdülmecid Efəndi idi.',en:'The last caliph was Abdulmejid II.',ru:'Последним халифом был Абдулмеджид II.',ar:'آخر خليفة كان عبد المجيد الثاني.',tr:'Son halife Abdülmecid Efendi\'ydi.'} },
  { year:{az:'1948 e.',en:'1948 CE',ru:'1948 н.э.',ar:'١٩٤٨ م',tr:'MS 1948'}, title:{az:'Fələstinin işğalı',en:'Nakba — Occupation of Palestine',ru:'Накба — оккупация Палестины',ar:'النكبة — احتلال فلسطين',tr:'Nekbe — Filistin\'in işgali'}, desc:{az:'İsrail dövləti elan edildi. Yüz minlərlə fələstinli qaçqın oldu. Müqəddəs torpaqlar işğal altına düşdü.',en:'The State of Israel was declared. Hundreds of thousands of Palestinians became refugees. The Holy Lands came under occupation.',ru:'Государство Израиль было провозглашено. Сотни тысяч палестинцев стали беженцами. Святые земли оказались под оккупацией.',ar:'أُعلنت دولة إسرائيل. أصبح مئات الآلاف من الفلسطينيين لاجئين. وقعت الأراضي المقدسة تحت الاحتلال.',tr:'İsrail devleti ilan edildi. Yüz binlerce Filistinli mülteci oldu. Kutsal topraklar işgal altına girdi.'}, keyFact:{az:'Nəkbə — "Fəlakət" — hər il 15 may tarixində xatırlanır.',en:'Nakba — "Catastrophe" — is commemorated every year on May 15.',ru:'Накба — «Катастрофа» — ежегодно отмечается 15 мая.',ar:'النكبة تُحيا ذكراها كل ١٥ مايو.',tr:'Nekbe — "Felaket" — her yıl 15 Mayıs\'ta anılır.'} },
  { year:{az:'1969 e.',en:'1969 CE',ru:'1969 н.э.',ar:'١٩٦٩ م',tr:'MS 1969'}, title:{az:'Məscidül-Əqsanın yandırılması',en:'Burning of Al-Aqsa Mosque',ru:'Поджог мечети Аль-Акса',ar:'حريق المسجد الأقصى',tr:'Mescid-i Aksâ\'nın yakılması'}, desc:{az:'Bir avstraliyalı ekstremist Məscidül-Əqsanın Qiblə minbərini yandırdı. Bu hadisə İslam Əməkdaşlıq Təşkilatının yaranmasına səbəb oldu.',en:'An Australian extremist set fire to the Qibla pulpit of Al-Aqsa. This led to the formation of the Organisation of Islamic Cooperation.',ru:'Австралийский экстремист поджёг кафедру Киблы в Аль-Аксе. Это привело к созданию Организации Исламского Сотрудничества.',ar:'أحرق متطرف أسترالي منبر القبلة في الأقصى. أدى ذلك إلى تأسيس منظمة التعاون الإسلامي.',tr:'Avustralyalı bir aşırılıkçı Mescid-i Aksâ\'nın Kıble minberini yaktı.'}, keyFact:{az:'İslam Əməkdaşlıq Təşkilatı 57 ölkəni birləşdirir.',en:'The OIC unites 57 countries.',ru:'ОИС объединяет 57 стран.',ar:'تضم منظمة التعاون الإسلامي ٥٧ دولة.',tr:'İslam İşbirliği Teşkilatı 57 ülkeyi birleştirir.'} },
  { year:{az:'622 e.',en:'622 CE',ru:'622 н.э.',ar:'٦٢٢ م',tr:'MS 622'}, title:{az:'Mədinə Konstitusiyası',en:'Constitution of Medina',ru:'Мединская конституция',ar:'صحيفة المدينة',tr:'Medine Anayasası'}, desc:{az:'Peyğəmbər ﷺ Mədinədə müsəlman, yəhudi və müşrik qəbilələr arasında ilk yazılı konstitusiyanı hazırladı — hüquq bərabərliyi, müdafiə ittifaqı.',en:'The Prophet ﷺ drafted the first written constitution in Medina among Muslim, Jewish and pagan tribes — equal rights and mutual defense.',ru:'Пророк ﷺ составил первую письменную конституцию в Медине между мусульманами, иудеями и язычниками — равные права и взаимная защита.',ar:'أعدّ النبي ﷺ أول دستور مكتوب في المدينة بين المسلمين واليهود والمشركين.',tr:'Peygamber ﷺ Medine\'de Müslüman, Yahudi ve müşrik kabileler arasında ilk yazılı anayasayı hazırladı.'}, keyFact:{az:'Tarixi ilk yazılı konstitusiya hesab olunur.',en:'Considered the first written constitution in history.',ru:'Считается первой письменной конституцией в истории.',ar:'تُعدّ أول دستور مكتوب في التاريخ.',tr:'Tarihteki ilk yazılı anayasa kabul edilir.'} },
  { year:{az:'624 e.',en:'624 CE',ru:'624 н.э.',ar:'٦٢٤ م',tr:'MS 624'}, title:{az:'Qiblənin dəyişdirilməsi',en:'Change of Qibla',ru:'Изменение Киблы',ar:'تحويل القبلة',tr:'Kıblenin değiştirilmesi'}, desc:{az:'Namazın qibləsi Qüdsdən (Məscidül-Əqsa) Məkkəyə (Kəbə) çevrildi. Bu dəyişiklik Bəqərə surəsinin 144-cü ayəsi ilə əmr edildi.',en:'The direction of prayer was changed from Jerusalem (Al-Aqsa) to Mecca (Kaaba). Commanded by verse 2:144 of the Quran.',ru:'Направление молитвы было изменено с Иерусалима (Аль-Акса) на Мекку (Каабу). По повелению аята 2:144.',ar:'حُوّلت القبلة من القدس (الأقصى) إلى مكة (الكعبة). بأمر الآية ١٤٤ من البقرة.',tr:'Namazın kıblesi Kudüs\'ten (Mescid-i Aksâ) Mekke\'ye (Kâbe) çevrildi.'}, keyFact:{az:'"Təhvil-i Qiblə" məscidi Mədinədə hələ durur.',en:'The "Masjid al-Qiblatain" (Mosque of Two Qiblas) still stands in Medina.',ru:'«Масджид аль-Киблатайн» (мечеть двух кибл) до сих пор стоит в Медине.',ar:'لا يزال "مسجد القبلتين" قائمًا في المدينة.',tr:'"Mescid-i Kıbleteyn" Medine\'de hâlâ ayaktadır.'} },
  { year:{az:'630 e.',en:'630 CE',ru:'630 н.э.',ar:'٦٣٠ م',tr:'MS 630'}, title:{az:'Bütlərin qırılması',en:'Destruction of Idols',ru:'Уничтожение идолов',ar:'تحطيم الأصنام',tr:'Putların kırılması'}, desc:{az:'Məkkə fəthindən sonra Peyğəmbər ﷺ Kəbədəki 360 bütü qırdırdı. "Haqq gəldi, batil yox oldu" (İsra 81) deyərək hər bütü devirdi.',en:'After the conquest of Mecca, the Prophet ﷺ destroyed the 360 idols in the Kaaba, saying "Truth has come and falsehood has vanished" (Isra 81).',ru:'После завоевания Мекки Пророк ﷺ уничтожил 360 идолов в Каабе, говоря «Истина пришла, ложь исчезла» (Исра 81).',ar:'بعد فتح مكة حطّم النبي ﷺ ٣٦٠ صنمًا في الكعبة قائلاً "جاء الحق وزهق الباطل" (الإسراء ٨١).',tr:'Mekke\'nin fethinden sonra Peygamber ﷺ Kâbe\'deki 360 putu kırdırdı.'}, keyFact:{az:'Kəbə İbrahimin (ə.s.) qurduğu tövhid məbədinə qaytarıldı.',en:'The Kaaba was restored to the monotheistic temple built by Ibrahim.',ru:'Кааба была возвращена к монотеистическому храму, построенному Ибрахимом.',ar:'أُعيدت الكعبة إلى معبد التوحيد الذي بناه إبراهيم.',tr:'Kâbe, İbrahim\'in inşa ettiği tevhid mâbedine iade edildi.'} },
  { year:{az:'1979 e.',en:'1979 CE',ru:'1979 н.э.',ar:'١٩٧٩ م',tr:'MS 1979'}, title:{az:'Kəbənin ələ keçirilməsi hadisəsi',en:'Seizure of the Grand Mosque',ru:'Захват Заповедной мечети',ar:'حادثة الحرم المكي',tr:'Harem-i Şerif\'in işgali'}, desc:{az:'Cuheyman əl-Uteybi qrupu Məscidül-Haramı ələ keçirdi. 2 həftəlik mühasirədən sonra təhlükəsizlik qüvvələri nəzarəti bərpa etdi.',en:'Juhayman al-Utaybi\'s group seized the Grand Mosque in Mecca. After a 2-week siege, security forces regained control.',ru:'Группа Джухаймана аль-Утайби захватила Заповедную мечеть в Мекке. После 2-недельной осады силы безопасности восстановили контроль.',ar:'استولت جماعة جهيمان العتيبي على الحرم المكي. بعد حصار أسبوعين استعادت قوات الأمن السيطرة.',tr:'Cuheyman el-Uteybi grubu Mescid-i Haram\'ı ele geçirdi. 2 haftalık kuşatmadan sonra güvenlik güçleri kontrolü sağladı.'}, keyFact:{az:'Bu hadisə bütün İslam dünyasını sarsıtdı.',en:'This event shook the entire Muslim world.',ru:'Это событие потрясло весь мусульманский мир.',ar:'هزت هذه الحادثة العالم الإسلامي بأسره.',tr:'Bu olay tüm İslam dünyasını sarstı.'} },
]

export default function IslamicHistoryPage({ setPage }) {
  const { lang } = useLang()
  const L = LABELS[lang] || LABELS.en
  const [tab, setTab] = useState('prophets')
  const [expanded, setExpanded] = useState(null)

  const toggle = (idx) => setExpanded(expanded === idx ? null : idx)

  return (
    <div className="history-page">
      {/* Hero */}
      <div className="history-hero">
        <div className="history-hero-bg" />
        <div className="history-breadcrumb">
          <button onClick={() => setPage('home')}>{L.home}</button>
          <span>/</span>
          <span>{L.title}</span>
        </div>
        <div className="history-hero-icon">📜</div>
        <h1 className="history-title">{L.title}</h1>
        <p className="history-subtitle">{L.subtitle}</p>
      </div>

      {/* Stats */}
      <div className="history-stats">
        <div className="history-stat">
          <div className="history-stat-num">25</div>
          <div className="history-stat-label">{L.prophets}</div>
        </div>
        <div className="history-stat">
          <div className="history-stat-num">{EVENTS.length}</div>
          <div className="history-stat-label">{L.events}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="history-tabs">
        <button
          className={`history-tab-btn${tab === 'prophets' ? ' active' : ''}`}
          onClick={() => { setTab('prophets'); setExpanded(null) }}
        >
          📖 {L.prophets}
        </button>
        <button
          className={`history-tab-btn${tab === 'events' ? ' active' : ''}`}
          onClick={() => { setTab('events'); setExpanded(null) }}
        >
          ⚔️ {L.events}
        </button>
      </div>

      {/* Timeline */}
      <div className="history-timeline">
        {tab === 'prophets' && PROPHETS.map((p, i) => (
          <div
            className="history-entry"
            key={i}
            style={{ animationDelay: `${Math.min(i * 0.06, 0.6)}s` }}
          >
            <div className="history-dot" />
            <div className="history-card-wrap">
              <div
                className={`history-card${expanded === i ? ' expanded' : ''}`}
                onClick={() => toggle(i)}
              >
                <div className="history-date-badge">
                  {p.era[lang] || p.era.en}
                </div>
                <div className="history-card-header">
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                      <div className="history-prophet-num">{p.num}</div>
                      <h3 className="history-card-title">{p.name[lang] || p.name.en}</h3>
                    </div>
                    <div className="history-card-arabic">{p.arabic}</div>
                    <p className="history-card-desc">{p.desc[lang] || p.desc.en}</p>
                  </div>
                  <div className="history-expand-icon">▼</div>
                </div>

                <div className="history-details">
                  <div className="history-detail-divider" />
                  <div className="history-detail-row">
                    <span className="history-detail-label">{L.keyFact}</span>
                    <span className="history-detail-value">{p.keyFact[lang] || p.keyFact.en}</span>
                  </div>
                  <div className="history-quran-badge">
                    📖 {L.quranRef}: {p.quranRef}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {tab === 'events' && EVENTS.map((e, i) => (
          <div
            className="history-entry"
            key={i}
            style={{ animationDelay: `${Math.min(i * 0.06, 0.6)}s` }}
          >
            <div className="history-dot" />
            <div className="history-card-wrap">
              <div
                className={`history-card${expanded === i ? ' expanded' : ''}`}
                onClick={() => toggle(i)}
              >
                <div className="history-date-badge">
                  {e.year[lang] || e.year.en}
                </div>
                <div className="history-card-header">
                  <div>
                    <h3 className="history-card-title">{e.title[lang] || e.title.en}</h3>
                    <p className="history-card-desc">{e.desc[lang] || e.desc.en}</p>
                  </div>
                  <div className="history-expand-icon">▼</div>
                </div>

                <div className="history-details">
                  <div className="history-detail-divider" />
                  <div className="history-detail-row">
                    <span className="history-detail-label">{L.keyFact}</span>
                    <span className="history-detail-value">{e.keyFact[lang] || e.keyFact.en}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
