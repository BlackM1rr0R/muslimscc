// ═══════════════════════════════════════════════════════
// İbn Bəttutənin səyahəti (1325–1354) — əsas dayanacaqlar (components/IbnBattutaJourney.jsx)
//
// Mənbə: İbn Bəttutə, «Tuhfat ən-Nuzzar» (Rihla, İbn Cüzəyyə diktə olunub, 1355);
// tarixlər R. E. Dunn, «The Adventures of Ibn Battuta» (1986/2012) xronologiyası ilə,
// H. A. R. Gibb tərcüməsi (Hakluyt Society) ilə tutuşdurulub.
// • Yalnız geniş qəbul olunmuş dayanacaqlar. Mübahisəli iddialar ÇIXARILIB:
//   Xanbalıq (Pekin), Bulqar (Volqa), Xansa (Hançjou) və Çinin daxili səfəri,
//   Sin-Kalan (Quançjou) — tarixçilər bu hissələrin həqiqiliyinə şübhə edir.
// • approx: true — tarixçilər ili təqribi verir (Dunn ilə Gibb fərqli il göstərir).
// • Malinin paytaxtının yeri dəqiq bilinmir; nöqtə ənənəvi yerdə — Nianidədir.
// • Qeydlər yalnız mənbədə təsdiqlənən faktlardır (uydurma əhvalat yoxdur).
// ═══════════════════════════════════════════════════════

const P = {
  tangier: { lat: 35.77, lon: -5.80, name: { az: 'Təncə', en: 'Tangier', ru: 'Танжер', tr: 'Tanca', ar: 'طنجة' } },
  tlemcen: { lat: 34.88, lon: -1.31, name: { az: 'Tilimsan', en: 'Tlemcen', ru: 'Тлемсен', tr: 'Tilimsan', ar: 'تلمسان' } },
  bejaia: { lat: 36.75, lon: 5.08, name: { az: 'Bicayə', en: 'Bejaia', ru: 'Беджая', tr: 'Bicaye', ar: 'بجاية' } },
  tunis: { lat: 36.80, lon: 10.18, name: { az: 'Tunis', en: 'Tunis', ru: 'Тунис', tr: 'Tunus', ar: 'تونس' } },
  alexandria: { lat: 31.20, lon: 29.92, name: { az: 'İskəndəriyyə', en: 'Alexandria', ru: 'Александрия', tr: 'İskenderiye', ar: 'الإسكندرية' } },
  cairo: { lat: 30.04, lon: 31.24, name: { az: 'Qahirə', en: 'Cairo', ru: 'Каир', tr: 'Kahire', ar: 'القاهرة' } },
  damascus: { lat: 33.51, lon: 36.29, name: { az: 'Dəməşq', en: 'Damascus', ru: 'Дамаск', tr: 'Şam', ar: 'دمشق' } },
  medina: { lat: 24.47, lon: 39.61, name: { az: 'Mədinə', en: 'Medina', ru: 'Медина', tr: 'Medine', ar: 'المدينة المنورة' } },
  mecca: { lat: 21.42, lon: 39.83, name: { az: 'Məkkə', en: 'Mecca', ru: 'Мекка', tr: 'Mekke', ar: 'مكة المكرمة' } },
  najaf: { lat: 31.99, lon: 44.31, name: { az: 'Nəcəf', en: 'Najaf', ru: 'Эн-Наджаф', tr: 'Necef', ar: 'النجف' } },
  basra: { lat: 30.51, lon: 47.78, name: { az: 'Bəsrə', en: 'Basra', ru: 'Басра', tr: 'Basra', ar: 'البصرة' } },
  isfahan: { lat: 32.65, lon: 51.67, name: { az: 'İsfahan', en: 'Isfahan', ru: 'Исфахан', tr: 'İsfahan', ar: 'أصفهان' } },
  shiraz: { lat: 29.59, lon: 52.58, name: { az: 'Şiraz', en: 'Shiraz', ru: 'Шираз', tr: 'Şiraz', ar: 'شيراز' } },
  baghdad: { lat: 33.31, lon: 44.36, name: { az: 'Bağdad', en: 'Baghdad', ru: 'Багдад', tr: 'Bağdat', ar: 'بغداد' } },
  tabriz: { lat: 38.08, lon: 46.29, name: { az: 'Təbriz', en: 'Tabriz', ru: 'Тебриз', tr: 'Tebriz', ar: 'تبريز' } },
  aden: { lat: 12.79, lon: 45.03, name: { az: 'Ədən', en: 'Aden', ru: 'Аден', tr: 'Aden', ar: 'عدن' } },
  mogadishu: { lat: 2.05, lon: 45.32, name: { az: 'Moqadişu', en: 'Mogadishu', ru: 'Могадишо', tr: 'Mogadişu', ar: 'مقديشو' } },
  mombasa: { lat: -4.04, lon: 39.67, name: { az: 'Mombasa', en: 'Mombasa', ru: 'Момбаса', tr: 'Mombasa', ar: 'ممباسا' } },
  kilwa: { lat: -8.96, lon: 39.51, name: { az: 'Kilva', en: 'Kilwa', ru: 'Килва', tr: 'Kilva', ar: 'كلوة' } },
  zafar: { lat: 17.01, lon: 54.11, name: { az: 'Zəfar', en: 'Zafar (Dhofar)', ru: 'Зафар', tr: 'Zafar', ar: 'ظفار' } },
  hormuz: { lat: 27.09, lon: 56.45, name: { az: 'Hörmüz', en: 'Hormuz', ru: 'Ормуз', tr: 'Hürmüz', ar: 'هرمز' } },
  alanya: { lat: 36.54, lon: 32.00, name: { az: 'Alanya', en: 'Alanya', ru: 'Аланья', tr: 'Alaiye (Alanya)', ar: 'العلايا' } },
  konya: { lat: 37.87, lon: 32.48, name: { az: 'Konya', en: 'Konya', ru: 'Конья', tr: 'Konya', ar: 'قونية' } },
  caffa: { lat: 45.03, lon: 35.38, name: { az: 'Kəfə (Krım)', en: 'Caffa (Crimea)', ru: 'Кафа (Крым)', tr: 'Kefe (Kırım)', ar: 'الكفا (القرم)' } },
  astrakhan: { lat: 46.35, lon: 48.04, name: { az: 'Həştərxan', en: 'Astrakhan', ru: 'Астрахань', tr: 'Hacı Tarhan', ar: 'الحاج ترخان' } },
  constantinople: { lat: 41.01, lon: 28.98, name: { az: 'Konstantinopol', en: 'Constantinople', ru: 'Константинополь', tr: 'Kostantiniyye', ar: 'القسطنطينية' } },
  sarai: { lat: 48.60, lon: 45.40, name: { az: 'Saray (Qızıl Orda)', en: 'Sarai (Golden Horde)', ru: 'Сарай (Золотая Орда)', tr: 'Saray (Altın Orda)', ar: 'السرا (القبيلة الذهبية)' } },
  urgench: { lat: 42.33, lon: 59.15, name: { az: 'Urgənc (Xarəzm)', en: 'Urgench (Khwarazm)', ru: 'Ургенч (Хорезм)', tr: 'Ürgenç (Harezm)', ar: 'خوارزم' } },
  bukhara: { lat: 39.77, lon: 64.42, name: { az: 'Buxara', en: 'Bukhara', ru: 'Бухара', tr: 'Buhara', ar: 'بخارى' } },
  samarkand: { lat: 39.65, lon: 66.96, name: { az: 'Səmərqənd', en: 'Samarkand', ru: 'Самарканд', tr: 'Semerkant', ar: 'سمرقند' } },
  balkh: { lat: 36.76, lon: 66.90, name: { az: 'Bəlx', en: 'Balkh', ru: 'Балх', tr: 'Belh', ar: 'بلخ' } },
  herat: { lat: 34.35, lon: 62.20, name: { az: 'Herat', en: 'Herat', ru: 'Герат', tr: 'Herat', ar: 'هراة' } },
  delhi: { lat: 28.65, lon: 77.23, name: { az: 'Dehli', en: 'Delhi', ru: 'Дели', tr: 'Delhi', ar: 'دلهي' } },
  calicut: { lat: 11.25, lon: 75.78, name: { az: 'Kalikut', en: 'Calicut', ru: 'Каликут', tr: 'Kalikut', ar: 'قاليقوط' } },
  maldives: { lat: 4.18, lon: 73.51, name: { az: 'Maldiv adaları', en: 'Maldive Islands', ru: 'Мальдивы', tr: 'Maldivler', ar: 'جزائر ذيبة المهل' } },
  adamspeak: { lat: 6.81, lon: 80.50, name: { az: 'Seylon (Adəm dağı)', en: "Ceylon (Adam's Peak)", ru: 'Цейлон (пик Адама)', tr: 'Seylan (Adem Dağı)', ar: 'سرنديب (جبل آدم)' } },
  bengal: { lat: 23.65, lon: 90.61, name: { az: 'Benqal', en: 'Bengal', ru: 'Бенгалия', tr: 'Bengal', ar: 'بنجالة' } },
  samudra: { lat: 5.15, lon: 97.15, name: { az: 'Sumatra (Samudra-Pasay)', en: 'Sumatra (Samudra Pasai)', ru: 'Суматра (Самудра-Пасай)', tr: 'Sumatra (Samudra Paşay)', ar: 'سمطرة' } },
  quanzhou: { lat: 24.87, lon: 118.68, name: { az: 'Zeytun (Tsüançjou)', en: 'Zaytun (Quanzhou)', ru: 'Зайтун (Цюаньчжоу)', tr: 'Zeytun (Çüançou)', ar: 'الزيتون' } },
  fez: { lat: 34.06, lon: -4.98, name: { az: 'Fəs', en: 'Fez', ru: 'Фес', tr: 'Fas', ar: 'فاس' } },
  granada: { lat: 37.18, lon: -3.60, name: { az: 'Qırnata', en: 'Granada', ru: 'Гранада', tr: 'Gırnata', ar: 'غرناطة' } },
  sijilmasa: { lat: 31.28, lon: -4.27, name: { az: 'Sicilmasə', en: 'Sijilmasa', ru: 'Сиджильмаса', tr: 'Sicilmase', ar: 'سجلماسة' } },
  mali: { lat: 11.39, lon: -8.39, name: { az: 'Mali (paytaxt)', en: 'Mali (capital)', ru: 'Мали (столица)', tr: 'Mali (başkent)', ar: 'مالي (العاصمة)' } },
  timbuktu: { lat: 16.77, lon: -3.01, name: { az: 'Timbuktu', en: 'Timbuktu', ru: 'Тимбукту', tr: 'Timbuktu', ar: 'تنبكت' } },
}

// [yer, il, təqribi?, qeyd]
const RAW = [
  ['tangier', 1325, false, {
    az: '21 yaşında, 14 iyun 1325-də həcc üçün Məkkəyə yola düşdü.',
    en: 'Set out for the hajj to Mecca at the age of 21, on 14 June 1325.',
    ru: 'В 21 год, 14 июня 1325 года, отправился в хадж в Мекку.',
    tr: '21 yaşında, 14 Haziran 1325’te hac için Mekke’ye yola çıktı.',
    ar: 'خرج حاجًّا إلى مكة في الثانية والعشرين من عمره، في 14 يونيو 1325.' }],
  ['tlemcen', 1325, false, {
    az: 'Şərqə gedərkən Zəyyanilər dövlətinin paytaxtından keçdi.',
    en: 'Passed through the capital of the Zayyanid kingdom on the way east.',
    ru: 'По пути на восток прошёл через столицу государства Зайянидов.',
    tr: 'Doğuya giderken Zeyyânîler devletinin başkentinden geçti.',
    ar: 'مرّ بعاصمة دولة بني زيان في طريقه إلى المشرق.' }],
  ['bejaia', 1325, false, {
    az: 'Burada qızdırmaya tutuldu, amma yoluna davam etdi.',
    en: 'Fell ill with fever here but continued the journey.',
    ru: 'Здесь заболел лихорадкой, но продолжил путь.',
    tr: 'Burada ateşli bir hastalığa yakalandı ama yoluna devam etti.',
    ar: 'أصابته الحمّى هنا لكنه واصل رحلته.' }],
  ['tunis', 1325, false, {
    az: 'Hacıların karvanına qoşuldu və karvanın qazisi seçildi.',
    en: 'Joined a pilgrim caravan and was chosen as its qāḍī.',
    ru: 'Присоединился к каравану паломников и был избран его кади.',
    tr: 'Bir hac kervanına katıldı ve kervanın kadısı seçildi.',
    ar: 'انضمّ إلى ركب الحجاج واختير قاضيًا له.' }],
  ['alexandria', 1326, false, {
    az: 'Məşhur İskəndəriyyə mayakını gördü — o zaman artıq qismən uçmuşdu.',
    en: 'Saw the famous lighthouse of Alexandria, already partly in ruins.',
    ru: 'Видел знаменитый Александрийский маяк, тогда уже частично разрушенный.',
    tr: 'Ünlü İskenderiye Feneri’ni gördü; fener o zaman kısmen yıkıktı.',
    ar: 'رأى منار الإسكندرية الشهير وقد تهدّم بعضه.' }],
  ['cairo', 1326, false, {
    az: 'Məmlük sultanlığının paytaxtı, dövrün ən böyük şəhərlərindən birində qaldı.',
    en: 'Stayed in the Mamluk capital, one of the largest cities of the age.',
    ru: 'Остановился в столице мамлюков — одном из крупнейших городов эпохи.',
    tr: 'Memlûk başkentinde, çağın en büyük şehirlerinden birinde kaldı.',
    ar: 'أقام في عاصمة المماليك، إحدى أكبر مدن عصره.' }],
  ['damascus', 1326, false, {
    az: 'Ramazan ayını Dəməşqdə keçirdi və alimlərdən dərs aldı.',
    en: 'Spent the month of Ramadan in Damascus and studied with its scholars.',
    ru: 'Провёл месяц рамадан в Дамаске и учился у его учёных.',
    tr: 'Ramazan ayını Şam’da geçirdi ve âlimlerinden ders aldı.',
    ar: 'قضى شهر رمضان في دمشق وأخذ عن علمائها.' }],
  ['medina', 1326, false, {
    az: 'Şam hacı karvanı ilə Peyğəmbər məscidini ziyarət etdi.',
    en: 'Visited the Prophet’s Mosque with the Syrian pilgrim caravan.',
    ru: 'С сирийским караваном паломников посетил Мечеть Пророка.',
    tr: 'Şam hac kervanıyla Mescid-i Nebevî’yi ziyaret etti.',
    ar: 'زار المسجد النبوي مع الركب الشامي.' }],
  ['mecca', 1326, false, {
    az: 'İlk həccini yerinə yetirdi.',
    en: 'Performed his first hajj.',
    ru: 'Совершил свой первый хадж.',
    tr: 'İlk haccını yaptı.',
    ar: 'أدّى حجّته الأولى.' }],
  ['najaf', 1326, true, {
    az: 'İraqa qayıdan karvanla Əli ibn Əbu Talibin türbəsini ziyarət etdi.',
    en: 'Visited the shrine of ʿAlī ibn Abī Ṭālib with a caravan bound for Iraq.',
    ru: 'С караваном, шедшим в Ирак, посетил гробницу Али ибн Абу Талиба.',
    tr: 'Irak’a dönen bir kervanla Hz. Ali’nin türbesini ziyaret etti.',
    ar: 'زار مشهد علي بن أبي طالب مع ركب العراق.' }],
  ['basra', 1327, true, {
    az: 'Liman şəhəri Bəsrədən keçdi.',
    en: 'Passed through the port city of Basra.',
    ru: 'Прошёл через портовый город Басру.',
    tr: 'Liman şehri Basra’dan geçti.',
    ar: 'مرّ بمدينة البصرة الساحلية.' }],
  ['isfahan', 1327, true, {
    az: 'Zaqros dağlarını aşıb İrana keçdi.',
    en: 'Crossed the Zagros mountains into Persia.',
    ru: 'Перешёл горы Загрос и вступил в Персию.',
    tr: 'Zagros dağlarını aşarak İran’a geçti.',
    ar: 'عبر جبال زاغروس إلى بلاد فارس.' }],
  ['shiraz', 1327, true, {
    az: 'Fars diyarının şəhəri Şirazı ziyarət etdi.',
    en: 'Visited the Persian city of Shiraz.',
    ru: 'Посетил персидский город Шираз.',
    tr: 'Fars diyarının şehri Şiraz’ı ziyaret etti.',
    ar: 'زار مدينة شيراز في بلاد فارس.' }],
  ['baghdad', 1327, false, {
    az: 'Bağdada çatdı və Elxani hökmdarı Əbu Səidin ordugahı ilə yol getdi.',
    en: 'Reached Baghdad and travelled with the camp of the Ilkhan Abū Saʿīd.',
    ru: 'Прибыл в Багдад и некоторое время следовал со ставкой ильхана Абу Саида.',
    tr: 'Bağdat’a vardı ve İlhanlı hükümdarı Ebû Saîd’in ordugâhıyla yol aldı.',
    ar: 'وصل بغداد ورافق محلّة السلطان الإيلخاني أبي سعيد.' }],
  ['tabriz', 1327, true, {
    az: 'Elxani sarayının karvanı ilə Təbrizə getdi.',
    en: 'Visited Tabriz with the royal caravan of the Ilkhanate.',
    ru: 'Посетил Тебриз вместе с караваном двора ильханов.',
    tr: 'İlhanlı sarayının kervanıyla Tebriz’e gitti.',
    ar: 'زار تبريز مع ركب البلاط الإيلخاني.' }],
  ['mecca', 1327, true, {
    az: 'Bir neçə il Məkkədə yaşayıb elm öyrəndi və həcc etdi.',
    en: 'Settled in Mecca for several years of study and pilgrimage.',
    ru: 'Несколько лет жил в Мекке, учился и совершал хадж.',
    tr: 'Birkaç yıl Mekke’de kalarak ilim tahsil etti ve hac yaptı.',
    ar: 'جاور بمكة بضع سنين طالبًا للعلم وحاجًّا.' }],
  ['aden', 1330, true, {
    az: 'Qırmızı dənizlə cənuba üzdü, Yəməndən keçib Ədən limanına çatdı.',
    en: 'Sailed down the Red Sea, crossed Yemen and reached the port of Aden.',
    ru: 'Спустился по Красному морю, пересёк Йемен и достиг порта Аден.',
    tr: 'Kızıldeniz’den güneye yelken açtı, Yemen’i geçip Aden limanına ulaştı.',
    ar: 'أبحر في البحر الأحمر جنوبًا وعبر اليمن حتى بلغ ميناء عدن.' }],
  ['mogadishu', 1331, true, {
    az: 'Moqadişu sultanı onu qonaq kimi qəbul etdi.',
    en: 'Was received as a guest by the sultan of Mogadishu.',
    ru: 'Был принят в качестве гостя султаном Могадишо.',
    tr: 'Mogadişu sultanı onu misafir olarak ağırladı.',
    ar: 'استضافه سلطان مقديشو.' }],
  ['mombasa', 1331, true, {
    az: 'Svahili sahilindəki ada şəhəri Mombasada oldu.',
    en: 'Stopped at the island town of Mombasa on the Swahili coast.',
    ru: 'Побывал в островном городе Момбаса на суахилийском побережье.',
    tr: 'Svahili kıyısındaki ada şehri Mombasa’ya uğradı.',
    ar: 'نزل بجزيرة ممباسا على ساحل السواحل.' }],
  ['kilwa', 1331, true, {
    az: 'Şərqi Afrika səfərinin ən cənub nöqtəsi — Kilvaya çatdı.',
    en: 'Reached Kilwa, the southernmost point of his East African voyage.',
    ru: 'Достиг Килвы — самой южной точки своего плавания вдоль Восточной Африки.',
    tr: 'Doğu Afrika yolculuğunun en güney noktası olan Kilva’ya ulaştı.',
    ar: 'بلغ كلوة، أقصى نقطة جنوبًا في رحلته إلى شرق أفريقيا.' }],
  ['zafar', 1331, true, {
    az: 'Cənubi Ərəbistan sahilindəki Zəfara üzdü.',
    en: 'Sailed to Ẓafār on the south Arabian coast.',
    ru: 'Приплыл в Зафар на южном побережье Аравии.',
    tr: 'Güney Arabistan kıyısındaki Zafar’a yelken açtı.',
    ar: 'أبحر إلى ظفار على ساحل جنوب الجزيرة العربية.' }],
  ['hormuz', 1332, true, {
    az: 'Fars körfəzinin ticarət limanı Hörmüzdə oldu.',
    en: 'Visited the trading port of Hormuz in the Persian Gulf.',
    ru: 'Побывал в торговом порту Ормуз в Персидском заливе.',
    tr: 'Basra Körfezi’ndeki ticaret limanı Hürmüz’ü gördü.',
    ar: 'زار ميناء هرمز التجاري في الخليج.' }],
  ['mecca', 1332, true, {
    az: 'Hindistana yola düşməzdən əvvəl yenə həcc etdi.',
    en: 'Performed hajj again before setting out for India.',
    ru: 'Снова совершил хадж, прежде чем отправиться в Индию.',
    tr: 'Hindistan’a yola çıkmadan önce yeniden hac yaptı.',
    ar: 'حجّ مرة أخرى قبل أن يقصد الهند.' }],
  ['alanya', 1332, true, {
    az: 'Alanya limanında Anadolu torpağına ayaq basdı.',
    en: 'Landed in Anatolia at the port of Alanya.',
    ru: 'Высадился в Анатолии в порту Аланья.',
    tr: 'Alaiye limanından Anadolu’ya ayak bastı.',
    ar: 'نزل بلاد الأناضول في ميناء العلايا.' }],
  ['konya', 1332, true, {
    az: 'Cəlaləddin Ruminin türbəsinin olduğu Konyanı ziyarət etdi.',
    en: 'Visited Konya, the city of Jalāl al-Dīn Rūmī’s tomb.',
    ru: 'Посетил Конью, где находится гробница Джалаладдина Руми.',
    tr: 'Mevlânâ Celâleddîn-i Rûmî’nin türbesinin bulunduğu Konya’yı ziyaret etti.',
    ar: 'زار قونية حيث ضريح جلال الدين الرومي.' }],
  ['caffa', 1332, true, {
    az: 'Qara dənizi keçib Krımdakı Genuya limanı Kəfəyə çatdı.',
    en: 'Crossed the Black Sea to the Genoese port of Caffa in Crimea.',
    ru: 'Пересёк Чёрное море и прибыл в генуэзский порт Кафу в Крыму.',
    tr: 'Karadeniz’i geçerek Kırım’daki Ceneviz limanı Kefe’ye vardı.',
    ar: 'عبر البحر الأسود إلى ميناء الكفا الجنوي في القرم.' }],
  ['astrakhan', 1332, true, {
    az: 'Qızıl Orda xanı Özbək xanın ordugahı ilə Həştərxana getdi.',
    en: 'Travelled with the camp of Özbeg Khan, ruler of the Golden Horde, to Astrakhan.',
    ru: 'Вместе со ставкой Узбек-хана, правителя Золотой Орды, прибыл в Астрахань.',
    tr: 'Altın Orda hükümdarı Özbek Han’ın ordugâhıyla Hacı Tarhan’a gitti.',
    ar: 'رافق محلّة السلطان أوزبك خان، ملك القبيلة الذهبية، إلى الحاج ترخان.' }],
  ['constantinople', 1332, true, {
    az: 'Özbək xanın zövcəsi, Bizans şahzadəsi Bayalunu Konstantinopola müşayiət etdi.',
    en: 'Accompanied Princess Bayalun, a Byzantine wife of Özbeg Khan, to Constantinople.',
    ru: 'Сопровождал в Константинополь византийскую царевну Баялунь, жену Узбек-хана.',
    tr: 'Özbek Han’ın Bizanslı eşi Prenses Bayalun’a Kostantiniyye’ye kadar eşlik etti.',
    ar: 'رافق الخاتون بيلون، زوجة أوزبك خان الرومية، إلى القسطنطينية.' }],
  ['sarai', 1333, true, {
    az: 'Qızıl Ordanın paytaxtı Saraya qayıtdı.',
    en: 'Returned to Sarai, the capital of the Golden Horde.',
    ru: 'Вернулся в Сарай, столицу Золотой Орды.',
    tr: 'Altın Orda’nın başkenti Saray’a döndü.',
    ar: 'عاد إلى السرا، حاضرة القبيلة الذهبية.' }],
  ['urgench', 1333, true, {
    az: 'Çölü keçib Xarəzmin paytaxtı Urgəncə çatdı.',
    en: 'Crossed the steppe to Urgench, capital of Khwarazm.',
    ru: 'Пересёк степь и прибыл в Ургенч, столицу Хорезма.',
    tr: 'Bozkırı geçerek Harezm’in başkenti Ürgenç’e vardı.',
    ar: 'قطع السهوب إلى خوارزم.' }],
  ['bukhara', 1333, true, {
    az: 'Monqol işğalının izləri hələ qalan Buxaranı gördü.',
    en: 'Saw Bukhara, still scarred by the Mongol conquest.',
    ru: 'Увидел Бухару, ещё хранившую следы монгольского разорения.',
    tr: 'Moğol istilasının izlerini hâlâ taşıyan Buhara’yı gördü.',
    ar: 'رأى بخارى وما زالت آثار غزو المغول بادية عليها.' }],
  ['samarkand', 1333, true, {
    az: 'Çağatay xanlığının torpağında Səmərqəndi ziyarət etdi.',
    en: 'Visited Samarkand in the lands of the Chagatai Khanate.',
    ru: 'Посетил Самарканд во владениях Чагатайского улуса.',
    tr: 'Çağatay Hanlığı topraklarında Semerkant’ı ziyaret etti.',
    ar: 'زار سمرقند في بلاد الجغطائيين.' }],
  ['balkh', 1333, true, {
    az: 'Çingiz xanın dağıtdığı Bəlxi hələ xaraba halında gördü.',
    en: 'Found Balkh still in ruins after its destruction by Genghis Khan.',
    ru: 'Застал Балх всё ещё в руинах после разрушения Чингисханом.',
    tr: 'Cengiz Han’ın yıktığı Belh’i hâlâ harabe hâlinde buldu.',
    ar: 'وجد بلخ خرابًا منذ أن دمّرها جنكيز خان.' }],
  ['herat', 1333, true, {
    az: 'Kartlar sülaləsinin paytaxtı Heratda oldu.',
    en: 'Visited Herat, capital of the Kart dynasty.',
    ru: 'Побывал в Герате, столице династии Куртов.',
    tr: 'Kertler hanedanının başkenti Herat’ı ziyaret etti.',
    ar: 'زار هراة، حاضرة ملوك آل كرت.' }],
  ['delhi', 1334, true, {
    az: 'Sultan Məhəmməd ibn Tuğluqun xidmətində Dehli qazisi oldu (təq. 1334–1341).',
    en: 'Served as a qāḍī of Delhi under Sultan Muḥammad ibn Tughluq (c. 1334–1341).',
    ru: 'Служил кади Дели при султане Мухаммаде ибн Туглуке (ок. 1334–1341).',
    tr: 'Sultan Muhammed bin Tuğluk’un hizmetinde Delhi kadısı oldu (y. 1334–1341).',
    ar: 'تولّى القضاء في دلهي في عهد السلطان محمد بن تغلق (نحو 1334–1341).' }],
  ['calicut', 1342, true, {
    az: 'Sultanın elçisi kimi Çinə üzməyə hazırlaşdı, lakin donanma fırtınada itdi.',
    en: 'Prepared to sail to China as the sultan’s envoy, but the fleet was lost in a storm.',
    ru: 'Готовился отплыть в Китай послом султана, но флот погиб в шторм.',
    tr: 'Sultanın elçisi olarak Çin’e gitmeye hazırlanırken filo bir fırtınada battı.',
    ar: 'تهيّأ للإبحار إلى الصين رسولًا للسلطان، لكن المراكب هلكت في عاصفة.' }],
  ['maldives', 1343, true, {
    az: 'Maldiv adalarında qazi vəzifəsində çalışdı.',
    en: 'Served as qāḍī of the Maldive Islands.',
    ru: 'Служил кади на Мальдивских островах.',
    tr: 'Maldiv adalarında kadılık yaptı.',
    ar: 'تولّى القضاء في جزائر ذيبة المهل.' }],
  ['adamspeak', 1344, true, {
    az: 'Seylonda (Şri-Lanka) Adəm dağına qalxdı.',
    en: 'Climbed Adam’s Peak in Ceylon (Sri Lanka).',
    ru: 'Поднялся на пик Адама на Цейлоне (Шри-Ланка).',
    tr: 'Seylan’da (Sri Lanka) Adem Dağı’na tırmandı.',
    ar: 'صعد جبل سرنديب (قدم آدم) في جزيرة سيلان.' }],
  ['bengal', 1345, true, {
    az: 'Benqala gəldi və Silhet dağlarında sufi Şah Cəlalı ziyarət etdi.', // lang-ok[Silhet]: yer adı (Banqladeş)
    en: 'Travelled to Bengal and visited the Sufi Shāh Jalāl in the hills of Sylhet.',
    ru: 'Прибыл в Бенгалию и посетил суфия Шах Джалала в горах Силхета.',
    tr: 'Bengal’e geldi ve Silhet dağlarında sûfî Şah Celâl’i ziyaret etti.',
    ar: 'قدم بنجالة وزار الصوفي الشيخ جلال الدين في جبال كامرو.' }],
  ['samudra', 1345, true, {
    az: 'Sumatrada Samudra-Pasayın müsəlman sultanı onu qonaq etdi.',
    en: 'Was hosted by the Muslim sultan of Samudra Pasai in Sumatra.',
    ru: 'Был гостем мусульманского султана Самудры-Пасая на Суматре.',
    tr: 'Sumatra’da Samudra Pasai’nin Müslüman sultanı onu misafir etti.',
    ar: 'نزل ضيفًا على السلطان المسلم في سمطرة.' }],
  ['quanzhou', 1345, true, {
    az: 'Yuan Çininin böyük limanı Zeytuna (Tsüançjou) çatdı.',
    en: 'Reached Zaytun (Quanzhou), the great port of Yuan China.',
    ru: 'Достиг Зайтуна (Цюаньчжоу), крупного порта юаньского Китая.',
    tr: 'Yuan Çini’nin büyük limanı Zeytun’a (Çüançou) ulaştı.',
    ar: 'بلغ مدينة الزيتون، ميناء الصين الكبير في عهد اليوان.' }],
  ['calicut', 1347, true, {
    az: 'Çindən qayıdarkən yenə Kalikutdan keçdi.',
    en: 'Passed through Calicut again on the way home from China.',
    ru: 'На обратном пути из Китая снова прошёл через Каликут.',
    tr: 'Çin’den dönerken yeniden Kalikut’a uğradı.',
    ar: 'مرّ بقاليقوط ثانية في طريق عودته من الصين.' }],
  ['baghdad', 1348, false, {
    az: 'Qərbə qayıdarkən yenidən Bağdada gəldi.',
    en: 'Returned to Baghdad on the way west.',
    ru: 'По пути на запад вновь прибыл в Багдад.',
    tr: 'Batıya dönerken yeniden Bağdat’a geldi.',
    ar: 'عاد إلى بغداد في طريقه إلى المغرب.' }],
  ['damascus', 1348, false, {
    az: 'Dəməşqdə «Qara ölüm» adlı taunun şahidi oldu.',
    en: 'Witnessed the Black Death plague in Damascus.',
    ru: 'Стал свидетелем эпидемии чумы («Чёрной смерти») в Дамаске.',
    tr: 'Şam’da Kara Ölüm veba salgınına tanık oldu.',
    ar: 'شهد الطاعون الأسود (الوباء الكبير) في دمشق.' }],
  ['cairo', 1348, false, {
    az: 'Taundan əziyyət çəkən Qahirədən keçdi.',
    en: 'Passed through Cairo, also stricken by the plague.',
    ru: 'Прошёл через Каир, также охваченный чумой.',
    tr: 'Vebanın kırıp geçirdiği Kahire’den geçti.',
    ar: 'مرّ بالقاهرة وقد اجتاحها الطاعون أيضًا.' }],
  ['mecca', 1348, false, {
    az: 'Son həccini yerinə yetirdi.',
    en: 'Performed his last hajj.',
    ru: 'Совершил свой последний хадж.',
    tr: 'Son haccını yaptı.',
    ar: 'أدّى حجّته الأخيرة.' }],
  ['fez', 1349, false, {
    az: 'Məğribə qayıtdı və Mərinilər sultanı Əbu İnan onu qəbul etdi.',
    en: 'Returned to Morocco and was received by the Marinid sultan Abū ʿInān.',
    ru: 'Вернулся в Марокко и был принят маринидским султаном Абу Инаном.',
    tr: 'Fas’a döndü ve Merînî sultanı Ebû İnân tarafından kabul edildi.',
    ar: 'عاد إلى المغرب واستقبله السلطان المريني أبو عنان.' }],
  ['granada', 1350, true, {
    az: 'Əndəlüsün son müsəlman dövləti — Qırnataya getdi.',
    en: 'Visited Granada, the last Muslim kingdom of al-Andalus.',
    ru: 'Посетил Гранаду — последнее мусульманское государство аль-Андалуса.',
    tr: 'Endülüs’ün son Müslüman devleti Gırnata’yı ziyaret etti.',
    ar: 'زار غرناطة، آخر ممالك المسلمين في الأندلس.' }],
  ['sijilmasa', 1351, false, {
    az: 'Sicilmasədən Böyük Səhranı keçən karvana qoşuldu.',
    en: 'Joined a caravan across the Sahara from Sijilmasa.',
    ru: 'Из Сиджильмасы отправился с караваном через Сахару.',
    tr: 'Sicilmase’den Büyük Sahra’yı geçen bir kervana katıldı.',
    ar: 'خرج من سجلماسة مع قافلة تعبر الصحراء الكبرى.' }],
  ['mali', 1352, false, {
    az: 'Mali hökmdarı Mansa Süleymanın sarayında təqribən səkkiz ay qaldı. Paytaxtın yeri mübahisəlidir; nöqtə ənənəvi yerdə — Nianidədir.',
    en: 'Spent about eight months at the court of Mansa Sulaymān of Mali. The capital’s site is debated; the dot marks the traditional location at Niani.',
    ru: 'Около восьми месяцев провёл при дворе Манса Сулеймана, правителя Мали. Местоположение столицы спорно; точка отмечает традиционное место — Ниани.',
    tr: 'Mali hükümdarı Mansa Süleyman’ın sarayında yaklaşık sekiz ay kaldı. Başkentin yeri tartışmalıdır; nokta geleneksel yeri, Niani’yi gösterir.',
    ar: 'أقام نحو ثمانية أشهر في بلاط منسا سليمان سلطان مالي. موضع العاصمة مختلف فيه، والنقطة على الموضع المشهور نياني.' }],
  ['timbuktu', 1353, false, {
    az: 'Geri dönərkən Niger çayı üzərindəki Timbuktuda oldu.', // lang-ok[Niger]: çayın adı
    en: 'Visited Timbuktu on the Niger River on the way back.',
    ru: 'На обратном пути посетил Тимбукту на реке Нигер.',
    tr: 'Dönüş yolunda Nijer Nehri kıyısındaki Timbuktu’yu ziyaret etti.',
    ar: 'زار تنبكت على نهر النيجر في طريق عودته.' }],
  ['fez', 1354, false, {
    az: 'Fəsə qayıtdı; sultanın əmri ilə səyahətlərini İbn Cüzəyyə söylədi (kitab 1355-də tamamlandı).',
    en: 'Returned to Fez; at the sultan’s order he dictated his travels to Ibn Juzayy (completed 1355).',
    ru: 'Вернулся в Фес; по велению султана продиктовал рассказ о странствиях Ибн Джузайю (завершён в 1355).',
    tr: 'Fas’a döndü; sultanın emriyle seyahatlerini İbn Cüzey’e yazdırdı (1355’te tamamlandı).',
    ar: 'عاد إلى فاس، وأملى رحلته على ابن جُزَيّ بأمر السلطان (أُتمّت سنة 1355).' }],
]

export const IBN_BATTUTA_STOPS = RAW.map(([place, year, approx, note], i) => {
  const p = P[place]
  return { i, place, name: p.name, lat: p.lat, lon: p.lon, year, approx, note }
})

/** Ümumi yolun Dunn-un verdiyi təqribi uzunluğu (≈73 000 mil) */
export const IBN_BATTUTA_TOTAL_KM = 117000

const R_EARTH = 6371.0088
const RAD = Math.PI / 180
/** İki nöqtə arasında böyük dairə məsafəsi (km) — haversine */
export function greatCircleKm(a, b) {
  const dLat = (b.lat - a.lat) * RAD
  const dLon = (b.lon - a.lon) * RAD
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2
  return 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** cum[i] — 0-cı dayanacaqdan i-ci dayanacağa qədər düz xətt (böyük dairə) məsafələrinin cəmi */
export const IBN_BATTUTA_CUM_KM = IBN_BATTUTA_STOPS.reduce((acc, s, i, arr) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + greatCircleKm(arr[i - 1], s))
  return acc
}, [])
