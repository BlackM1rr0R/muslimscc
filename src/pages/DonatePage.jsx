import { useLang } from '../contexts/LangContext'
import { brandName } from '../config/brand'
import { VerseCard, HadithCard } from '../components/VirtueCards'
import '../styles/DonatePage.css'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import PageLink, { isPlainClick } from '../components/PageLink'
import LessonBlocks, { pick } from '../components/lesson/LessonBlocks'
import { useNavigate } from 'react-router-dom'
import { pathFor } from '../seo/routes'
import { DONATE_GUIDE, DONATE_GUIDE_LINKS } from '../data/pageGuides/DonatePage'
import '../styles/LessonsPage.css'

// ═══════════════════════════════════════════════════════
// Xeyriyyə və ianə — /donate (ümumi bələdçi)
//
// Muslims.cc konkret bir məscid və ya fond deyil — bu səhifədə ödəniş
// rekvizitləri, ianə qəbulu, məbləğ və ya layihə YOXDUR. Səhifə:
// • sədəqənin fəzilətini göstərir — ayə api.alquran.cloud-dan gətirilir
//   (yaddaşdan yazılmır), hədislər src/data/hadiths.js-dən OLDUĞU KİMİ
//   köçürülüb (id ilə; 1.2 MB-lıq faylı bir səhifəyə görə yükləməmək üçün);
// • sədəqə bələdçisi (src/data/pageGuides/DonatePage.js): daha üç fəzilət,
//   davamlı sədəqə (sədəqeyi-cariyə), vermənin ədəbi — hamısı mənbə ilə;
//   "nələr sədəqədir" /charity-də, zəkat hökmləri /zakat-da (təkrarlanmır);
// • etibarlı xeyriyyəyə necə vermək barədə qısa ümumi (dini hökm olmayan)
//   tövsiyələr verir;
// • zəkat kalkulyatoruna, sədəqə gündəliyinə və yaxınlıqdakı məscidlərə aparır.
// ═══════════════════════════════════════════════════════

// src/data/hadiths.js-dən bayt-bayt köçürülüb — mətni burada DƏYİŞMƏ
// (düzəliş lazımdırsa əvvəl hadiths.js-də et, sonra buraya köçür).
// Ərəbcə tərcümə yoxdur: ərəb dilində yalnız əsl mətn göstərilir.
const CHARITY_HADITHS = [
  { id: 546, source: 'Muslim 2588', ar: 'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ',
    az: 'Sədəqə malı azaltmaz.', en: 'Charity does not decrease wealth.', ru: 'Милостыня не уменьшает богатства.', tr: 'Sadaka malı eksiltmez.' },
  { id: 312, source: 'Buxari 1410', ar: 'مَنْ تَصَدَّقَ بِعِدْلِ تَمْرَةٍ مِنْ كَسْبٍ طَيِّبٍ',
    az: 'Kim halal qazancından bir xurma qədər sədəqə versə, Allah onu sağ əli ilə qəbul edər.', en: 'Whoever gives a date\'s worth of charity from pure earnings, Allah accepts it with His right hand.', ru: 'Кто подаст милостыню размером с финик из чистого заработка, Аллах примет её Своей правой рукой.', tr: 'Kim helal kazancından hurma büyüklüğünde sadaka verirse, Allah onu sağ eliyle kabul eder.' },
  { id: 552, source: 'Buxari 1442', ar: 'مَا مِنْ يَوْمٍ يُصْبِحُ الْعِبَادُ فِيهِ إِلَّا مَلَكَانِ يَنْزِلَانِ فَيَقُولُ أَحَدُهُمَا اللَّهُمَّ أَعْطِ مُنْفِقًا خَلَفًا',
    az: 'Hər gün iki mələk enər; biri "Allahım, infaq edənə əvəzini ver" deyər, digəri "Allahım, xəsisə tələf ver" deyər.', en: 'Every day two angels descend; one says: "O Allah, give the spender a replacement," and the other says: "O Allah, give the miser destruction."', ru: 'Каждый день спускаются два ангела; один говорит: «О Аллах, возмести расходующему», другой: «О Аллах, уничтожь имущество скупого».', tr: 'Her gün iki melek iner; biri "Allah\'ım infak edene karşılığını ver" der, diğeri "Allah\'ım cimriye telef ver" der.' },
  { id: 629, source: 'Muslim 1631', ar: 'إِذَا مَاتَ الْإِنْسَانُ انْقَطَعَ عَمَلُهُ إِلَّا مِنْ ثَلَاثَةٍ صَدَقَةٍ جَارِيَةٍ أَوْ عِلْمٍ يُنْتَفَعُ بِهِ أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ',
    az: 'İnsan öldükdə əməli kəsilər, üç şey istisnadır: davamlı sədəqə, faydalı elm, dua edən saleh övlad.', en: 'When a person dies, his deeds end except for three: ongoing charity, beneficial knowledge, or a righteous child who prays for him.', ru: 'Когда человек умирает, его дела прекращаются, кроме трёх: непрерывной милостыни, полезного знания или праведного ребёнка, молящегося за него.', tr: 'İnsan öldüğünde ameli kesilir, üç şey müstesna: sadaka-i cariye, faydalı ilim, dua eden salih evlat.' },
]

// İnfaq haqqında ayə (Bəqərə 2:261) — mətn API-dən gəlir
const CHARITY_VERSE = '2:261'

const LABELS = {
  az: {
    eyebrow: 'Zəkat və sədəqə',
    title: 'Xeyriyyə və ianə',
    subtitle: 'Sədəqənin fəziləti və etibarlı xeyriyyəyə necə vermək',
    virtues: 'Sədəqənin fəziləti',
    guide: 'Sədəqə bələdçisi', guideMore: 'Ətraflı',
    tipsTitle: 'Etibarlı xeyriyyəyə necə vermək olar',
    tips: [
      'Etibarlı, rəsmi qeydiyyatda olan xeyriyyə təşkilatı və ya tanıdığınız məscid seçin.',
      'İanənin nəyə xərcləndiyini soruşun; mümkünsə qəbz və ya hesabat istəyin.',
      'Ödənişi yalnız rəsmi kanallarla edin — tanımadığınız şəxsi kartlara və sosial şəbəkədəki yoxlanılmamış çağırışlara ehtiyatlı olun.',
      'Zəkatı ayrıca hesablayın və onu almağa haqqı olanlara çatdırın.',
      'Ətrafınızdakı ehtiyacı olanları — qohumları və qonşuları unutmayın.',
    ],
    noPayments: '{brand} ianə və ya ödəniş qəbul etmir — bu səhifə yalnız məlumat üçündür.',
    seeAlso: 'Faydalı keçidlər',
    zakat: 'Zəkat kalkulyatoru', zakatDesc: 'Zəkatınızı hesablayın',
    journal: 'Sədəqə gündəliyi', journalDesc: 'Öz xeyir əməllərinizi qeyd edin',
    mosques: 'Yaxınlıqdakı məscidlər', mosquesDesc: 'Xəritədə yaxın məscidləri tapın',
  },
  en: {
    eyebrow: 'Zakat & charity',
    title: 'Charity & Giving',
    subtitle: 'The virtue of charity and how to give to a trustworthy cause',
    virtues: 'The virtue of charity',
    guide: 'A guide to charity', guideMore: 'Read more',
    tipsTitle: 'How to give to a trustworthy cause',
    tips: [
      'Choose a trustworthy, officially registered charity or a mosque you know.',
      'Ask how the donation will be spent; if possible, request a receipt or a report.',
      'Pay only through official channels — be careful with unknown personal cards and unverified appeals on social media.',
      'Calculate your zakat separately and make sure it reaches those entitled to it.',
      'Do not forget the people in need around you — relatives and neighbours.',
    ],
    noPayments: '{brand} does not accept donations or payments — this page is for information only.',
    seeAlso: 'Useful links',
    zakat: 'Zakat calculator', zakatDesc: 'Calculate your zakat',
    journal: 'Sadaqah journal', journalDesc: 'Keep a record of your good deeds',
    mosques: 'Mosques near me', mosquesDesc: 'Find nearby mosques on the map',
  },
  ru: {
    eyebrow: 'Закят и садака',
    title: 'Благотворительность',
    subtitle: 'Достоинство садаки и как жертвовать надёжным организациям',
    virtues: 'Достоинство садаки',
    guide: 'Руководство по садаке', guideMore: 'Подробнее',
    tipsTitle: 'Как жертвовать надёжным организациям',
    tips: [
      'Выбирайте надёжную, официально зарегистрированную благотворительную организацию или знакомую вам мечеть.',
      'Спрашивайте, на что пойдёт пожертвование; по возможности просите квитанцию или отчёт.',
      'Платите только через официальные каналы — будьте осторожны с незнакомыми личными картами и непроверенными призывами в соцсетях.',
      'Рассчитывайте закят отдельно и следите, чтобы он дошёл до тех, кто имеет на него право.',
      'Не забывайте о нуждающихся рядом — родственниках и соседях.',
    ],
    noPayments: '{brand} не принимает пожертвования и платежи — эта страница носит только информационный характер.',
    seeAlso: 'Полезные ссылки',
    zakat: 'Калькулятор закята', zakatDesc: 'Рассчитайте свой закят',
    journal: 'Дневник садаки', journalDesc: 'Записывайте свои добрые дела',
    mosques: 'Мечети рядом', mosquesDesc: 'Найдите ближайшие мечети на карте',
  },
  ar: {
    eyebrow: 'الزكاة والصدقة',
    title: 'الصدقة والتبرع',
    subtitle: 'فضل الصدقة وكيف تتبرع لجهة موثوقة',
    virtues: 'فضل الصدقة',
    guide: 'دليل الصدقة', guideMore: 'للمزيد',
    tipsTitle: 'كيف تتبرع لجهة موثوقة',
    tips: [
      'اختر جمعية خيرية موثوقة ومسجّلة رسميًا أو مسجدًا تعرفه.',
      'اسأل كيف سيُنفق تبرعك، واطلب إيصالًا أو تقريرًا إن أمكن.',
      'ادفع عبر القنوات الرسمية فقط، واحذر من البطاقات الشخصية المجهولة والنداءات غير الموثّقة على مواقع التواصل.',
      'احسب زكاتك على حدة وتأكّد من وصولها إلى مستحقيها.',
      'لا تنسَ المحتاجين من حولك — الأقارب والجيران.',
    ],
    noPayments: 'لا يقبل {brand} التبرعات أو المدفوعات — هذه الصفحة للمعلومات فقط.',
    seeAlso: 'روابط مفيدة',
    zakat: 'حاسبة الزكاة', zakatDesc: 'احسب زكاتك',
    journal: 'سجل الصدقات', journalDesc: 'سجّل أعمالك الخيرية',
    mosques: 'المساجد القريبة', mosquesDesc: 'اعثر على المساجد القريبة على الخريطة',
  },
  tr: {
    eyebrow: 'Zekât ve sadaka',
    title: 'Hayır ve Bağış',
    subtitle: 'Sadakanın fazileti ve güvenilir bir hayır kurumuna nasıl bağış yapılır',
    virtues: 'Sadakanın fazileti',
    guide: 'Sadaka rehberi', guideMore: 'Daha fazlası',
    tipsTitle: 'Güvenilir bir kuruma nasıl bağış yapılır',
    tips: [
      'Güvenilir, resmî olarak kayıtlı bir hayır kurumu ya da tanıdığınız bir cami seçin.',
      'Bağışın nereye harcanacağını sorun; mümkünse makbuz veya rapor isteyin.',
      'Ödemeyi yalnızca resmî kanallardan yapın — tanımadığınız kişisel kartlara ve sosyal medyadaki doğrulanmamış çağrılara karşı dikkatli olun.',
      'Zekâtınızı ayrıca hesaplayın ve hak sahiplerine ulaştığından emin olun.',
      'Çevrenizdeki ihtiyaç sahiplerini — akrabalarınızı ve komşularınızı unutmayın.',
    ],
    noPayments: '{brand} bağış veya ödeme kabul etmez — bu sayfa yalnızca bilgilendirme amaçlıdır.',
    seeAlso: 'Faydalı bağlantılar',
    zakat: 'Zekât hesaplayıcı', zakatDesc: 'Zekâtınızı hesaplayın',
    journal: 'Sadaka günlüğü', journalDesc: 'Hayır işlerinizi kaydedin',
    mosques: 'Yakındaki camiler', mosquesDesc: 'Haritada yakındaki camileri bulun',
  },
}

// ── v3: vermə yolları, zəkat–sədəqə müqayisəsi (5 dil) ──
// Yoxlanılıb: Tövbə 9:60 (api.quran.com); Buxari 1419, 1427, 1466 (hadith-api);
// 2.5% və il şərti — zəkat hökmləri /zakat bölməsindədir (orada mənbəli).
const DN3 = {
  how: {
    az: 'Muslims.cc pul toplamır. Bu səhifə kimə, nə qədər və necə verməyi göstərir: aşağıdan uyğun yolu seçin.',
    en: 'Muslims.cc collects no money. This page shows whom to give, how much and how: pick the path that fits you below.',
    ru: 'Muslims.cc не собирает деньги. Эта страница показывает, кому, сколько и как давать: выберите подходящий путь ниже.',
    ar: 'لا يجمع Muslims.cc أي أموال، وهذه الصفحة تبيّن لمن تعطي وكم وكيف: اختر الطريق المناسب أدناه.',
    tr: 'Muslims.cc para toplamaz. Bu sayfa kime, ne kadar ve nasıl verileceğini gösterir: aşağıdan size uygun yolu seçin.',
  },
  pathsEyebrow: { az: 'Vermə yolları', en: 'Ways to give', ru: 'Пути пожертвования', ar: 'طرق العطاء', tr: 'Verme yolları' },
  pathsTitle: { az: 'Hansından başlamalı?', en: 'Where to start?', ru: 'С чего начать?', ar: 'من أين تبدأ؟', tr: 'Nereden başlamalı?' },
  pathsLead: { az: 'Əvvəl fərz (zəkat), sonra yaxınlar, sonra davamlı xeyir.', en: 'First the obligation (zakat), then those close to you, then lasting good.', ru: 'Сначала обязательное (закят), затем близкие, затем непрерывное благо.', ar: 'الفريضة أولًا (الزكاة)، ثم الأقربون، ثم الخير الدائم.', tr: 'Önce farz (zekât), sonra yakınlar, sonra kalıcı hayır.' },
  paths: [
    { id: 'zakat', icon: 'zakat', to: 'zakat', badge: { az: 'Fərz', en: 'Obligatory', ru: 'Обязательно', ar: 'فريضة', tr: 'Farz' },
      title: { az: 'Zəkat', en: 'Zakat', ru: 'Закят', ar: 'الزكاة', tr: 'Zekât' },
      text: { az: 'Nisaba çatan malın 2,5%-i, il tamam olanda — kalkulyatorla hesablayın', en: '2.5% of wealth above nisab once a lunar year passes — use the calculator', ru: '2,5% имущества сверх нисаба по прошествии года — посчитайте калькулятором', ar: '٢٫٥٪ من المال البالغ نصابًا إذا حال الحول — احسبها بالحاسبة', tr: 'Nisaba ulaşan malın %2,5’i, yıl dolunca — hesaplayıcıyla hesaplayın' } },
    { id: 'family', icon: 'group', hash: 'dn-adab', badge: { az: 'İki savab', en: 'Double reward', ru: 'Двойная награда', ar: 'أجران', tr: 'İki sevap' },
      title: { az: 'Ailə və qohumlar', en: 'Family and relatives', ru: 'Семья и родственники', ar: 'الأهل والأقارب', tr: 'Aile ve akrabalar' },
      text: { az: 'Himayəndə olanlardan başla; qohuma verilən sədəqə həm də sileyi-rəhimdir (Buxari 1427, 1466)', en: 'Begin with your dependants; charity to a relative also joins ties of kinship (al-Bukhari 1427, 1466)', ru: 'Начни с тех, кого содержишь; милостыня родственнику — ещё и поддержание родства (аль-Бухари 1427, 1466)', ar: 'ابدأ بمن تعول، والصدقة على القريب صدقة وصلة (البخاري ١٤٢٧، ١٤٦٦)', tr: 'Bakmakla yükümlü olduklarından başla; akrabaya sadaka aynı zamanda sıla-i rahimdir (Buhârî 1427, 1466)' } },
    { id: 'sadaqah', icon: 'charity', hash: 'dn-virtues', badge: { az: 'Könüllü', en: 'Voluntary', ru: 'Добровольно', ar: 'تطوع', tr: 'Gönüllü' },
      title: { az: 'Gündəlik sədəqə', en: 'Everyday charity', ru: 'Ежедневная милостыня', ar: 'الصدقة اليومية', tr: 'Günlük sadaka' },
      text: { az: 'İstənilən məbləğ, istənilən vaxt — yarım xurma da sayılır', en: 'Any amount, any time — even half a date counts', ru: 'Любая сумма, в любое время — засчитывается и половинка финика', ar: 'أي مقدار وفي أي وقت، ولو بشق تمرة', tr: 'Her miktar, her zaman — yarım hurma bile sayılır' } },
    { id: 'jariyah', icon: 'leaf', hash: 'dn-jariyah', badge: { az: 'Davamlı', en: 'Lasting', ru: 'Непрерывно', ar: 'جارية', tr: 'Kalıcı' },
      title: { az: 'Sədəqeyi-cariyə', en: 'Sadaqah jariyah', ru: 'Садака джария', ar: 'الصدقة الجارية', tr: 'Sadaka-i câriye' },
      text: { az: 'Məscid, su, Mushaf, elm, ağac — öləndən sonra da savabı gəlir', en: 'Mosque, water, a Mushaf, knowledge, a tree — the reward continues after death', ru: 'Мечеть, вода, мусхаф, знание, дерево — награда идёт и после смерти', ar: 'مسجد أو ماء أو مصحف أو علم أو غرس، يجري أجره بعد الموت', tr: 'Mescit, su, Mushaf, ilim, ağaç — sevabı ölümden sonra da sürer' } },
  ],
  cmpEyebrow: { az: 'Fərq', en: 'The difference', ru: 'Разница', ar: 'الفرق', tr: 'Fark' },
  cmpTitle: { az: 'Zəkat və sədəqə', en: 'Zakat and sadaqah', ru: 'Закят и садака', ar: 'الزكاة والصدقة', tr: 'Zekât ve sadaka' },
  cmpCaption: { az: 'Zəkatın ətraflı hökmləri — «Zəkat» bölməsində.', en: 'Detailed rulings on zakat are in the “Zakat” section.', ru: 'Подробные правила закята — в разделе «Закят».', ar: 'تفصيل أحكام الزكاة في قسم «الزكاة».', tr: 'Zekâtın ayrıntılı hükümleri “Zekât” bölümündedir.' },
  cols: [
    { az: 'Zəkat', en: 'Zakat', ru: 'Закят', ar: 'الزكاة', tr: 'Zekât' },
    { az: 'Sədəqə', en: 'Sadaqah', ru: 'Садака', ar: 'الصدقة', tr: 'Sadaka' },
  ],
  rows: [
    [{ az: 'Hökmü', en: 'Ruling', ru: 'Статус', ar: 'الحكم', tr: 'Hükmü' },
      { az: 'Fərz — İslamın beş rüknündən biri', en: 'Obligatory — one of the five pillars', ru: 'Обязателен — один из пяти столпов', ar: 'فريضة وركن من أركان الإسلام', tr: 'Farz — İslam’ın beş şartından biri' },
      { az: 'Könüllü, böyük savablı', en: 'Voluntary, greatly rewarded', ru: 'Добровольна, с великой наградой', ar: 'تطوّع عظيم الأجر', tr: 'Gönüllü, sevabı büyük' }],
    [{ az: 'Miqdarı', en: 'Amount', ru: 'Размер', ar: 'المقدار', tr: 'Miktarı' },
      { az: 'Müəyyən: pul və ticarət malında 2,5%', en: 'Fixed: 2.5% on money and trade goods', ru: 'Установлен: 2,5% с денег и товаров', ar: 'محدد: ربع العشر في النقود وعروض التجارة', tr: 'Belirli: para ve ticaret malında %2,5' },
      { az: 'İstənilən qədər', en: 'Any amount', ru: 'Любой', ar: 'ما تيسّر', tr: 'Dilediği kadar' }],
    [{ az: 'Vaxtı', en: 'When', ru: 'Когда', ar: 'الوقت', tr: 'Vakti' },
      { az: 'Nisab olan mal üzərindən bir qəməri il keçəndə', en: 'When a lunar year passes over wealth at nisab', ru: 'Когда над имуществом в размере нисаба проходит лунный год', ar: 'إذا حال الحول على النصاب', tr: 'Nisap miktarı mal üzerinden bir kameri yıl geçince' },
      { az: 'Hər vaxt; ən yaxşısı sağlam ikən (Buxari 1419)', en: 'Any time; best while healthy (al-Bukhari 1419)', ru: 'В любое время; лучше — пока здоров (аль-Бухари 1419)', ar: 'كل وقت، وأفضلها في الصحة (البخاري ١٤١٩)', tr: 'Her zaman; en iyisi sağlıkta (Buhârî 1419)' }],
    [{ az: 'Kimə', en: 'To whom', ru: 'Кому', ar: 'لمن', tr: 'Kime' },
      { az: 'Yalnız 8 növ (Tövbə 9:60)', en: 'Only 8 categories (at-Tawbah 9:60)', ru: 'Только 8 категорий (ат-Тауба 9:60)', ar: 'الأصناف الثمانية فقط (التوبة: ٦٠)', tr: 'Yalnız 8 sınıf (Tevbe 9:60)' },
      { az: 'Hər ehtiyacı olana; yaxınlar önəmlidir', en: 'Anyone in need; relatives come first', ru: 'Любому нуждающемуся; близкие — в первую очередь', ar: 'كل محتاج، والأقربون أولى', tr: 'Her ihtiyaç sahibine; yakınlar önce gelir' }],
  ],
  virtuesLead: { az: 'Bir ayə və dörd səhih hədis — ərəbcə mətn və tərcümə ilə.', en: 'One verse and four authentic hadiths — Arabic text with translation.', ru: 'Один аят и четыре достоверных хадиса — арабский текст с переводом.', ar: 'آية وأربعة أحاديث صحيحة.', tr: 'Bir ayet ve dört sahih hadis — Arapça metin ve tercümesiyle.' },
  guideLead: { az: 'Daha üç fəzilət, davamlı sədəqə və vermənin ədəbi — mənbələri ilə.', en: 'Three more virtues, ongoing charity and the etiquette of giving — with sources.', ru: 'Ещё три достоинства, непрерывная милостыня и этикет пожертвования — с источниками.', ar: 'ثلاث فضائل أخرى، والصدقة الجارية، وآداب الصدقة بأدلتها.', tr: 'Üç fazilet daha, sadaka-i câriye ve vermenin edebi — kaynaklarıyla.' },
  tipsEyebrow: { az: 'Verməzdən əvvəl', en: 'Before you give', ru: 'Прежде чем дать', ar: 'قبل أن تعطي', tr: 'Vermeden önce' },
}
const P = (o, lang) => (o && (o[lang] || o.en || o.az)) || ''

export default function DonatePage({ setPage }) {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.en
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const navigate = useNavigate()
  // Dərsə keçid — həqiqi <a href>, adi klikdə SPA ilə
  const openLesson = (e, slug) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(pathFor('learn', lang, slug))
    window.scrollTo(0, 0)
  }
  // Səhifədaxili keçid (#dn-…) — yumşaq sürüşmə
  const jump = (e, id) => {
    if (!isPlainClick(e)) return
    const el = document.getElementById(id)
    if (!el) return
    e.preventDefault()
    let smooth = true
    try { smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { /* köhnə brauzer */ }
    el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
  }

  // Əlaqəli bölmələr — ikonlar Icon.jsx-dən (marşrut açarı ilə eyni ad)
  const links = [
    { key: 'zakat',   icon: 'zakat',   title: t.zakat,   desc: t.zakatDesc },
    { key: 'charity', icon: 'charity', title: t.journal, desc: t.journalDesc },
    { key: 'mosques', icon: 'mosques', title: t.mosques, desc: t.mosquesDesc },
  ]

  return (
    <div className="dn-root">
      <header className="ui-page-hero dn-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          {/* Bütün hero-larda eyni iz: Ana səhifə › … (components/Breadcrumb) */}
          <div className="ui-page-hero__crumbs"><Breadcrumb setPage={setPage} current={t.title} /></div>
          <span className="ui-eyebrow">{t.eyebrow}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.subtitle}</p>
          <p className="ui-page-hero__how"><Icon name="info" size={16} /> <span>{P(DN3.how, lang)}</span></p>
          <div className="ui-page-hero__actions">
            <PageLink className="ui-btn ui-btn--primary" to="zakat" setPage={setPage} onNavigate={toTop}>
              <Icon name="zakat" size={18} className="ui-btn__icon" /> {t.zakat}
            </PageLink>
            <a className="ui-btn ui-btn--secondary" href="#dn-paths" onClick={(e) => jump(e, 'dn-paths')}>{P(DN3.pathsEyebrow, lang)}</a>
          </div>
        </div>
      </header>

      {/* ═══ Vermə yolları ═══ */}
      <section id="dn-paths" className="ui-section ui-section--tight dn-paths" aria-labelledby="dn-paths-title">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{P(DN3.pathsEyebrow, lang)}</span>
            <h2 id="dn-paths-title" className="ui-title">{P(DN3.pathsTitle, lang)}</h2>
            <p className="ui-lead">{P(DN3.pathsLead, lang)}</p>
          </div>
          <ol className="dn-path-list" data-reveal="stagger">
            {DN3.paths.map((p, i) => {
              const body = (
                <>
                  <span className="dn-path__n ui-num" aria-hidden="true">{i + 1}</span>
                  <span className="ui-icon-tile" aria-hidden="true"><Icon name={p.icon} /></span>
                  <span className="dn-path__badge">{P(p.badge, lang)}</span>
                  <span className="dn-path__title">{P(p.title, lang)}</span>
                  <span className="dn-path__text">{P(p.text, lang)}</span>
                </>
              )
              return (
                <li key={p.id}>
                  {p.to
                    ? <PageLink className="ui-card ui-card--interactive dn-path" to={p.to} setPage={setPage} onNavigate={toTop}>{body}</PageLink>
                    : <a className="ui-card ui-card--interactive dn-path" href={`#${p.hash}`} onClick={(e) => jump(e, p.hash)}>{body}</a>}
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* ═══ Zəkat və sədəqə — müqayisə ═══ */}
      <section className="ui-section ui-section--alt" aria-labelledby="dn-cmp-title">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{P(DN3.cmpEyebrow, lang)}</span>
            <h2 id="dn-cmp-title" className="ui-title">{P(DN3.cmpTitle, lang)}</h2>
          </div>
          <div className="ui-table-wrap dn-cmp" tabIndex={0} role="region" aria-label={P(DN3.cmpTitle, lang)}>
            <table className="ui-table">
              <caption>{P(DN3.cmpCaption, lang)}</caption>
              <thead>
                <tr>
                  <td />
                  {DN3.cols.map((c, i) => <th key={i} scope="col">{P(c, lang)}</th>)}
                </tr>
              </thead>
              <tbody>
                {DN3.rows.map((r, i) => (
                  <tr key={i}>
                    <th scope="row">{P(r[0], lang)}</th>
                    <td>{P(r[1], lang)}</td>
                    <td>{P(r[2], lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ Fəzilətlər — ayə (API) + hədislər (hadiths.js) ═══ */}
      <section id="dn-virtues" className="ui-section dn-virtues" aria-labelledby="dn-virtues-title">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{t.eyebrow}</span>
            <h2 id="dn-virtues-title" className="ui-title">{t.virtues}</h2>
            <p className="ui-lead">{P(DN3.virtuesLead, lang)}</p>
          </div>
          <div className="dn-vlist" data-reveal="stagger">
            <VerseCard verseRef={CHARITY_VERSE} lang={lang} />
            {CHARITY_HADITHS.map(h => <HadithCard key={h.id} h={h} lang={lang} />)}
          </div>
        </div>
      </section>

      {/* ═══ Sədəqə bələdçisi — fəzilətlər (yuxarıdakılardan əlavə), davamlı sədəqə, ədəb ═══ */}
      <section className="ui-section ui-section--alt dn-guide" aria-labelledby="dn-guide-title">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{t.guide}</span>
            <h2 id="dn-guide-title" className="ui-title">{t.guide}</h2>
            <p className="ui-lead">{P(DN3.guideLead, lang)}</p>
          </div>
          {DONATE_GUIDE.map(sec => (
            <section key={sec.id} id={`dn-${sec.id}`} className="dn-guide-sec" aria-labelledby={`dn-${sec.id}-title`}>
              <h3 id={`dn-${sec.id}-title`} className="dn-guide-title">{pick(sec.title, lang)}</h3>
              <LessonBlocks blocks={sec.blocks} lang={lang} />
            </section>
          ))}
          <div className="dn-guide-links">
            <span className="dn-guide-links-label">{t.guideMore}:</span>
            {DONATE_GUIDE_LINKS.map((l, i) => l.learn
              ? <a key={i} className="ui-chip dn-guide-chip" href={pathFor('learn', lang, l.learn)} onClick={(e) => openLesson(e, l.learn)}><Icon name="learn" size={15} /> {pick(l.label, lang)}</a>
              : <PageLink key={i} className="ui-chip dn-guide-chip" to={l.to} setPage={setPage} onNavigate={toTop}><Icon name={l.to} size={15} /> {pick(l.label, lang)}</PageLink>)}
          </div>
        </div>
      </section>

      {/* ═══ Verməzdən əvvəl — 5 yoxlama ═══ */}
      <section className="ui-section" aria-labelledby="dn-tips-title">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{P(DN3.tipsEyebrow, lang)}</span>
            <h2 id="dn-tips-title" className="ui-title">{t.tipsTitle}</h2>
          </div>
          <ol className="ui-steps dn-tips" data-reveal="stagger">
            {t.tips.map((tip, i) => (
              <li key={i} className="ui-step">
                <span className="ui-step__n" aria-hidden="true">{i + 1}</span>
                <div className="ui-step__body"><p className="dn-tip">{tip}</p></div>
              </li>
            ))}
          </ol>
          <aside className="ui-callout ui-callout--note dn-footnote">
            <Icon name="info" />
            <div><p>{t.noPayments.replace('{brand}', brandName(lang))}</p></div>
          </aside>

          {/* Əlaqəli bölmələr */}
          <nav className="dn-links" aria-labelledby="dn-links-title">
            <h2 id="dn-links-title" className="dn-links-title ui-eyebrow">{t.seeAlso}</h2>
            <div className="dn-links-grid" data-reveal="stagger">
              {links.map(k => (
                <PageLink key={k.key} className="ui-tile ui-tile--row dn-link" to={k.key} setPage={setPage} onNavigate={toTop}>
                  <span className="ui-icon-tile" aria-hidden="true"><Icon name={k.icon} /></span>
                  <span className="ui-tile__body">
                    <span className="ui-tile__title">{k.title}</span>
                    <span className="ui-tile__text">{k.desc}</span>
                  </span>
                </PageLink>
              ))}
            </div>
          </nav>
        </div>
      </section>
    </div>
  )
}
