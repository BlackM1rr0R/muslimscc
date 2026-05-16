import { useState } from 'react'
import { useLang } from '../contexts/LangContext'
import '../styles/HolyPlacesPage.css'

const LABELS = {
  az: { title:'Müqəddəs Yerlər', subtitle:'İslamın müqəddəs məkanları', openMaps:'Xəritədə aç', significance:'Əhəmiyyəti', reference:'İstinad' },
  en: { title:'Holy Places', subtitle:'Sacred places of Islam', openMaps:'Open in Maps', significance:'Significance', reference:'Reference' },
  ru: { title:'Святые Места', subtitle:'Священные места ислама', openMaps:'Открыть на карте', significance:'Значение', reference:'Ссылка' },
  ar: { title:'الأماكن المقدسة', subtitle:'الأماكن المقدسة في الإسلام', openMaps:'افتح في الخريطة', significance:'الأهمية', reference:'المرجع' },
  tr: { title:'Kutsal Yerler', subtitle:'İslam\'ın kutsal mekanları', openMaps:'Haritada aç', significance:'Önemi', reference:'Referans' },
}

const PLACES = [
  {
    emoji: '🕋',
    nameAr: 'الكعبة المشرفة / المسجد الحرام',
    name: { az:'Kəbə / Məscidül-Haram', en:'Kaaba / Masjid al-Haram', ru:'Кааба / Масджид аль-Харам', ar:'الكعبة المشرفة / المسجد الحرام', tr:'Kâbe / Mescid-i Haram' },
    lat: 21.4225, lon: 39.8262,
    city: { az:'Məkkə', en:'Mecca', ru:'Мекка', ar:'مكة المكرمة', tr:'Mekke' },
    desc: {
      az:'İslamın ən müqəddəs yeri olan Kəbə, Məscidül-Haram məscidinin mərkəzində yerləşir. Müsəlmanlar gündə beş dəfə namazda Kəbəyə üz tuturlar. Həcc və Ümrə ziyarətlərinin mərkəzi məkanıdır.',
      en:'The Kaaba, located at the center of Masjid al-Haram, is the holiest site in Islam. Muslims face the Kaaba during their five daily prayers. It is the central site for the Hajj and Umrah pilgrimages.',
      ru:'Кааба, расположенная в центре Масджид аль-Харам, является самым священным местом в исламе. Мусульмане обращаются лицом к Каабе во время пятикратной молитвы. Это центральное место паломничества Хаджа и Умры.',
      ar:'الكعبة المشرفة الواقعة في وسط المسجد الحرام هي أقدس مكان في الإسلام. يتوجه المسلمون نحو الكعبة في صلواتهم الخمس اليومية. وهي المكان المركزي لأداء مناسك الحج والعمرة.',
      tr:'Mescid-i Haram\'ın merkezinde yer alan Kâbe, İslam\'ın en kutsal mekânıdır. Müslümanlar günde beş vakit namazda Kâbe\'ye yönelirler. Hac ve Umre ibadetlerinin merkezi mekânıdır.',
    },
    significance: {
      az:'Hz. İbrahim və İsmail tərəfindən inşa edilən ilk Beytullah. Yer üzündə ibadət üçün tikilən ilk ev.',
      en:'The first House of God built by Prophet Ibrahim and Ismail. The first house built for worship on Earth.',
      ru:'Первый Дом Аллаха, построенный пророком Ибрахимом и Исмаилом. Первый дом, построенный для поклонения на земле.',
      ar:'أول بيت لله بناه النبي إبراهيم وإسماعيل عليهما السلام. أول بيت وُضع للعبادة على الأرض.',
      tr:'Hz. İbrahim ve İsmail tarafından inşa edilen ilk Beytullah. Yeryüzünde ibadet için inşa edilen ilk ev.',
    },
    reference: { az:'Ali-İmran 96', en:'Ali \'Imran 96', ru:'Аль-Имран 96', ar:'آل عمران ٩٦', tr:'Âl-i İmrân 96' },
  },
  {
    emoji: '🕌',
    nameAr: 'المسجد النبوي',
    name: { az:'Məscidün-Nəbəvi', en:'Al-Masjid an-Nabawi', ru:'Масджид ан-Набави', ar:'المسجد النبوي', tr:'Mescid-i Nebevî' },
    lat: 24.4672, lon: 39.6112,
    city: { az:'Mədinə', en:'Medina', ru:'Медина', ar:'المدينة المنورة', tr:'Medine' },
    desc: {
      az:'Peyğəmbərimiz Hz. Muhəmmədin (s.a.s) Mədinəyə hicrət etdikdən sonra inşa etdiyi məscid. İslam tarixinin ən mühüm məscidlərindən biridir. Peyğəmbərimizin məzarı burada yerləşir.',
      en:'The mosque built by Prophet Muhammad (PBUH) after his migration to Medina. It is one of the most important mosques in Islamic history. The Prophet\'s tomb is located here.',
      ru:'Мечеть, построенная Пророком Мухаммадом (мир ему) после переселения в Медину. Одна из важнейших мечетей в истории ислама. Здесь находится могила Пророка.',
      ar:'المسجد الذي بناه النبي محمد ﷺ بعد هجرته إلى المدينة. يُعد من أهم المساجد في تاريخ الإسلام. يضم قبر النبي ﷺ.',
      tr:'Hz. Muhammed\'in (s.a.s) Medine\'ye hicretinden sonra inşa ettiği mescid. İslam tarihinin en önemli mescitlerinden biridir. Hz. Peygamber\'in kabri burada bulunmaktadır.',
    },
    significance: {
      az:'Burada qılınan bir namaz başqa məscidlərdə qılınan min namazdan üstündür (Məscidül-Haram istisna olmaqla).',
      en:'One prayer performed here is superior to one thousand prayers in other mosques (except Masjid al-Haram).',
      ru:'Одна молитва здесь превосходит тысячу молитв в других мечетях (кроме Масджид аль-Харам).',
      ar:'صلاة في هذا المسجد خير من ألف صلاة فيما سواه إلا المسجد الحرام.',
      tr:'Burada kılınan bir namaz, diğer mescitlerde kılınan bin namazdan üstündür (Mescid-i Haram hariç).',
    },
    reference: { az:'Buxari 1190', en:'Bukhari 1190', ru:'Бухари 1190', ar:'البخاري ١١٩٠', tr:'Buhârî 1190' },
  },
  {
    emoji: '🏛️',
    nameAr: 'المسجد الأقصى',
    name: { az:'Məscidül-Əqsa', en:'Al-Aqsa Mosque', ru:'Масджид аль-Акса', ar:'المسجد الأقصى', tr:'Mescid-i Aksâ' },
    lat: 31.7761, lon: 35.2358,
    city: { az:'Qüds', en:'Jerusalem', ru:'Иерусалим', ar:'القدس', tr:'Kudüs' },
    desc: {
      az:'İslamda üçüncü ən müqəddəs yer. Peyğəmbərimizin (s.a.s) İsra və Merac gecəsində ziyarət etdiyi məsciddir. İlk qiblə istiqaməti olaraq bilinir.',
      en:'The third holiest site in Islam. It is the mosque visited by Prophet Muhammad (PBUH) during the Night Journey (Isra and Mi\'raj). Known as the first direction of prayer (Qibla).',
      ru:'Третье по святости место в исламе. Мечеть, которую посетил Пророк Мухаммад (мир ему) во время Ночного путешествия (Исра и Мирадж). Известна как первая кибла.',
      ar:'ثالث أقدس مكان في الإسلام. وهو المسجد الذي زاره النبي ﷺ في ليلة الإسراء والمعراج. عُرف بالقبلة الأولى.',
      tr:'İslam\'da üçüncü en kutsal mekân. Hz. Peygamber\'in (s.a.s) İsra ve Miraç gecesinde ziyaret ettiği mescittir. İlk kıble yönü olarak bilinir.',
    },
    significance: {
      az:'Peyğəmbərlərin toplandığı və Hz. Muhəmmədin (s.a.s) onlara imam olub namaz qıldırdığı yer.',
      en:'The place where prophets gathered and Prophet Muhammad (PBUH) led them in prayer.',
      ru:'Место, где собрались пророки и Пророк Мухаммад (мир ему) возглавил их молитву.',
      ar:'المكان الذي اجتمع فيه الأنبياء وأمَّهم النبي ﷺ في الصلاة.',
      tr:'Peygamberlerin toplandığı ve Hz. Muhammed\'in (s.a.s) onlara imam olarak namaz kıldırdığı yer.',
    },
    reference: { az:'İsra 1', en:'Al-Isra 1', ru:'Аль-Исра 1', ar:'الإسراء ١', tr:'İsrâ 1' },
  },
  {
    emoji: '🕌',
    nameAr: 'مسجد قباء',
    name: { az:'Quba Məscidi', en:'Quba Mosque', ru:'Мечеть Куба', ar:'مسجد قباء', tr:'Kuba Mescidi' },
    lat: 24.4397, lon: 39.6166,
    city: { az:'Mədinə', en:'Medina', ru:'Медина', ar:'المدينة المنورة', tr:'Medine' },
    desc: {
      az:'İslam tarixində inşa edilən ilk məscid. Peyğəmbərimiz (s.a.s) Mədinəyə hicrəti zamanı burada dayanıb bu məscidi inşa etmişdir. Qurani-Kərimdə təqva üzərində qurulmuş məscid olaraq xatırlanır.',
      en:'The first mosque built in Islamic history. Prophet Muhammad (PBUH) stopped here during his migration to Medina and built this mosque. It is mentioned in the Quran as a mosque founded on piety.',
      ru:'Первая мечеть, построенная в истории ислама. Пророк Мухаммад (мир ему) остановился здесь во время переселения в Медину и построил эту мечеть. В Коране упоминается как мечеть, основанная на благочестии.',
      ar:'أول مسجد بُني في تاريخ الإسلام. توقف النبي ﷺ هنا أثناء هجرته إلى المدينة وبنى هذا المسجد. ذُكر في القرآن كمسجد أُسس على التقوى.',
      tr:'İslam tarihinde inşa edilen ilk mescit. Hz. Peygamber (s.a.s) Medine\'ye hicreti sırasında burada durarak bu mescidi inşa etmiştir. Kur\'an\'da takva üzere kurulmuş mescit olarak anılır.',
    },
    significance: {
      az:'Burada iki rükət namaz qılmaq bir ümrə savabı qazandırır.',
      en:'Performing two rak\'ahs of prayer here earns the reward of an Umrah.',
      ru:'Совершение двух ракаатов молитвы здесь равносильно награде за Умру.',
      ar:'صلاة ركعتين فيه تعدل ثواب عمرة.',
      tr:'Burada iki rekât namaz kılmak bir umre sevabı kazandırır.',
    },
    reference: { az:'Tirmizi 324', en:'Tirmidhi 324', ru:'Тирмизи 324', ar:'الترمذي ٣٢٤', tr:'Tirmizî 324' },
  },
  {
    emoji: '⛰️',
    nameAr: 'غار حراء',
    name: { az:'Həra Mağarası', en:'Cave of Hira', ru:'Пещера Хира', ar:'غار حراء', tr:'Hira Mağarası' },
    lat: 21.4574, lon: 39.8582,
    city: { az:'Məkkə', en:'Mecca', ru:'Мекка', ar:'مكة المكرمة', tr:'Mekke' },
    desc: {
      az:'Peyğəmbərimizə (s.a.s) ilk vəhyin nazil olduğu mağara. Nur dağının zirvəsində yerləşir. Hz. Muhəmməd (s.a.s) burada ibadət və təfəkkür edərdi.',
      en:'The cave where the first revelation was sent down to Prophet Muhammad (PBUH). Located at the peak of Jabal an-Nur. The Prophet used to worship and contemplate here.',
      ru:'Пещера, в которой Пророку Мухаммаду (мир ему) было ниспослано первое откровение. Расположена на вершине горы Нур. Пророк совершал здесь поклонение и размышления.',
      ar:'الغار الذي نزل فيه الوحي الأول على النبي ﷺ. يقع على قمة جبل النور. كان النبي ﷺ يتعبد ويتأمل فيه.',
      tr:'Hz. Peygamber\'e (s.a.s) ilk vahyin indirildiği mağara. Nur Dağı\'nın zirvesinde yer alır. Hz. Muhammed (s.a.s) burada ibadet ve tefekkür ederdi.',
    },
    significance: {
      az:'İlk nazil olan Quran ayələri burada endirilmişdir — Ələq surəsinin ilk beş ayəsi.',
      en:'The first verses of the Quran were revealed here — the first five verses of Surah Al-Alaq.',
      ru:'Первые аяты Корана были ниспосланы здесь — первые пять аятов суры Аль-Алак.',
      ar:'أُنزلت هنا أول آيات القرآن الكريم — الآيات الخمس الأولى من سورة العلق.',
      tr:'İlk Kur\'an ayetleri burada indirilmiştir — Alak suresinin ilk beş ayeti.',
    },
    reference: { az:'Ələq 1-5', en:'Al-Alaq 1-5', ru:'Аль-Алак 1-5', ar:'العلق ١-٥', tr:'Alak 1-5' },
  },
  {
    emoji: '🏔️',
    nameAr: 'غار ثور',
    name: { az:'Sevr Mağarası', en:'Cave of Thawr', ru:'Пещера Саур', ar:'غار ثور', tr:'Sevr Mağarası' },
    lat: 21.3771, lon: 39.8214,
    city: { az:'Məkkə', en:'Mecca', ru:'Мекка', ar:'مكة المكرمة', tr:'Mekke' },
    desc: {
      az:'Hz. Muhəmməd (s.a.s) və Hz. Əbu Bəkr (r.a) Mədinəyə hicrət edərkən üç gün gizləndikləri mağara. Allah-Təala onları müşriklərin gözündən qorumuşdur.',
      en:'The cave where Prophet Muhammad (PBUH) and Abu Bakr (RA) hid for three days during their migration to Medina. Allah protected them from the sight of the polytheists.',
      ru:'Пещера, в которой Пророк Мухаммад (мир ему) и Абу Бакр (да будет доволен им Аллах) скрывались три дня во время переселения в Медину. Аллах защитил их от взоров язычников.',
      ar:'الغار الذي اختبأ فيه النبي ﷺ وأبو بكر رضي الله عنه ثلاثة أيام أثناء الهجرة إلى المدينة. حماهما الله من أعين المشركين.',
      tr:'Hz. Muhammed (s.a.s) ve Hz. Ebu Bekir\'in (r.a.) Medine\'ye hicret ederken üç gün gizlendikleri mağara. Allah onları müşriklerin gözünden korumuştur.',
    },
    significance: {
      az:'Qurani-Kərimdə "ikinin ikincisi" ifadəsi ilə xatırlanır. Allahın möcüzəvi qoruması burada təcəlli etmişdir.',
      en:'Mentioned in the Quran with the phrase "the second of the two." Allah\'s miraculous protection was manifested here.',
      ru:'Упоминается в Коране фразой «второй из двоих». Чудесная защита Аллаха проявилась здесь.',
      ar:'ذُكر في القرآن بعبارة "ثاني اثنين". تجلت حماية الله المعجزة هنا.',
      tr:'Kur\'an\'da "ikinin ikincisi" ifadesiyle anılır. Allah\'ın mucizevi koruması burada tecelli etmiştir.',
    },
    reference: { az:'Tövbə 40', en:'At-Tawbah 40', ru:'Ат-Тауба 40', ar:'التوبة ٤٠', tr:'Tevbe 40' },
  },
  {
    emoji: '🏔️',
    nameAr: 'جبل عرفات',
    name: { az:'Ərafat Dağı', en:'Mount Arafat', ru:'Гора Арафат', ar:'جبل عرفات', tr:'Arafat Dağı' },
    lat: 21.3549, lon: 39.9841,
    city: { az:'Məkkə', en:'Mecca', ru:'Мекка', ar:'مكة المكرمة', tr:'Mekke' },
    desc: {
      az:'Həccin ən mühüm rüknü olan Ərafat dayanması burada edilir. Peyğəmbərimiz (s.a.s) Vida Xütbəsini burada söyləmişdir. Zilhiccə ayının 9-cu günü milyonlarla müsəlman burada toplanır.',
      en:'The most important pillar of Hajj — the standing at Arafat — takes place here. Prophet Muhammad (PBUH) delivered his Farewell Sermon here. Millions of Muslims gather here on the 9th of Dhul-Hijjah.',
      ru:'Здесь совершается самый важный столп Хаджа — стояние на Арафате. Пророк Мухаммад (мир ему) произнес здесь прощальную проповедь. Миллионы мусульман собираются здесь 9-го Зуль-Хиджа.',
      ar:'يُؤدى هنا أهم ركن من أركان الحج — الوقوف بعرفة. ألقى النبي ﷺ خطبة الوداع هنا. يجتمع ملايين المسلمين هنا في اليوم التاسع من ذي الحجة.',
      tr:'Haccın en önemli rüknü olan Arafat vakfesi burada yapılır. Hz. Peygamber (s.a.s) Veda Hutbesi\'ni burada okumuştur. Zilhicce ayının 9. günü milyonlarca Müslüman burada toplanır.',
    },
    significance: {
      az:'"Həcc Ərafatdır" — bu hədis Ərafatın həccdəki mərkəzi rolunu göstərir.',
      en:'"Hajj is Arafat" — this hadith highlights the central role of Arafat in Hajj.',
      ru:'«Хадж — это Арафат» — этот хадис подчеркивает центральную роль Арафата в Хадже.',
      ar:'"الحج عرفة" — هذا الحديث يبرز الدور المركزي لعرفة في الحج.',
      tr:'"Hac Arafat\'tır" — bu hadis Arafat\'ın haccdaki merkezi rolünü gösterir.',
    },
    reference: { az:'Tirmizi 889', en:'Tirmidhi 889', ru:'Тирмизи 889', ar:'الترمذي ٨٨٩', tr:'Tirmizî 889' },
  },
  {
    emoji: '⛺',
    nameAr: 'منى',
    name: { az:'Mina', en:'Mina', ru:'Мина', ar:'منى', tr:'Mina' },
    lat: 21.4134, lon: 39.8933,
    city: { az:'Məkkə', en:'Mecca', ru:'Мекка', ar:'مكة المكرمة', tr:'Mekke' },
    desc: {
      az:'Həcc zamanı hacıların daş atma (cəmərət) mərasimini icra etdikləri yer. Təşriq günlərində hacılar burada qalırlar. "Çadırlar şəhəri" olaraq da tanınır.',
      en:'The place where pilgrims perform the stoning ritual (Jamarat) during Hajj. Pilgrims stay here during the days of Tashreeq. Also known as the "City of Tents."',
      ru:'Место, где паломники совершают обряд бросания камней (Джамарат) во время Хаджа. Паломники остаются здесь в дни Ташрика. Также известно как «Город палаток».',
      ar:'المكان الذي يؤدي فيه الحجاج شعيرة رمي الجمرات أثناء الحج. يقيم الحجاج هنا أيام التشريق. تُعرف أيضاً بـ "مدينة الخيام".',
      tr:'Hac sırasında hacıların şeytan taşlama (Cemerat) merasimini ifa ettikleri yer. Teşrik günlerinde hacılar burada kalırlar. "Çadırlar şehri" olarak da bilinir.',
    },
    significance: {
      az:'Hz. İbrahimin (ə.s) şeytana daş atdığı yer olaraq İslam tarixində mühüm yer tutur.',
      en:'Holds an important place in Islamic history as the location where Prophet Ibrahim (AS) stoned the devil.',
      ru:'Занимает важное место в истории ислама как место, где Пророк Ибрахим (мир ему) бросал камни в дьявола.',
      ar:'يحتل مكانة مهمة في تاريخ الإسلام باعتباره المكان الذي رمى فيه النبي إبراهيم عليه السلام الشيطان.',
      tr:'Hz. İbrahim\'in (a.s.) şeytana taş attığı yer olarak İslam tarihinde önemli bir yere sahiptir.',
    },
    reference: { az:'Bəqərə 203', en:'Al-Baqarah 203', ru:'Аль-Бакара 203', ar:'البقرة ٢٠٣', tr:'Bakara 203' },
  },
  {
    emoji: '🌙',
    nameAr: 'مزدلفة',
    name: { az:'Müzdəlifə', en:'Muzdalifah', ru:'Муздалифа', ar:'مزدلفة', tr:'Müzdelife' },
    lat: 21.3992, lon: 39.9089,
    city: { az:'Məkkə', en:'Mecca', ru:'Мекка', ar:'مكة المكرمة', tr:'Mekke' },
    desc: {
      az:'Ərafat ilə Mina arasında yerləşən açıq sahə. Hacılar Ərafatdan sonra burada gecələyir və daş toplayırlar. Burada Məğrib və İşa namazları cəm edilərək qılınır.',
      en:'An open area between Arafat and Mina. Pilgrims spend the night here after Arafat and collect pebbles. Maghrib and Isha prayers are combined and performed here.',
      ru:'Открытая территория между Арафатом и Миной. Паломники проводят здесь ночь после Арафата и собирают камешки. Молитвы Магриб и Иша объединяются и совершаются здесь.',
      ar:'منطقة مفتوحة بين عرفات ومنى. يبيت الحجاج هنا بعد عرفة ويجمعون الحصى. تُصلى صلاتا المغرب والعشاء جمعاً هنا.',
      tr:'Arafat ile Mina arasında yer alan açık alan. Hacılar Arafat\'tan sonra burada geceleyip taş toplarlar. Akşam ve yatsı namazları burada cem edilerek kılınır.',
    },
    significance: {
      az:'Məşərul-Haram burada yerləşir. Qurani-Kərimdə zikr olunmuş müqəddəs məkandır.',
      en:'Al-Mash\'ar al-Haram is located here. It is a sacred site mentioned in the Quran.',
      ru:'Аль-Машар аль-Харам расположен здесь. Это священное место, упомянутое в Коране.',
      ar:'المشعر الحرام يقع هنا. وهو موقع مقدس ذُكر في القرآن الكريم.',
      tr:'Meş\'ar-i Haram burada yer alır. Kur\'an\'da zikredilen kutsal bir mekândır.',
    },
    reference: { az:'Bəqərə 198', en:'Al-Baqarah 198', ru:'Аль-Бакара 198', ar:'البقرة ١٩٨', tr:'Bakara 198' },
  },
  {
    emoji: '🌿',
    nameAr: 'جنة البقيع',
    name: { az:'Cənnətül-Bəqi', en:'Jannat al-Baqi', ru:'Джаннат аль-Баки', ar:'جنة البقيع', tr:'Cennetü\'l-Bakî' },
    lat: 24.4667, lon: 39.6150,
    city: { az:'Mədinə', en:'Medina', ru:'Медина', ar:'المدينة المنورة', tr:'Medine' },
    desc: {
      az:'Mədinədə yerləşən ən qədim və ən müqəddəs İslam qəbiristanlığı. Peyğəmbərimizin (s.a.s) ailə üzvləri, səhabələr və tabeinlər burada dəfn edilmişdir. On mindən çox səhabənin məzarı burada yerləşir.',
      en:'The oldest and most sacred Islamic cemetery in Medina. Family members of the Prophet (PBUH), companions, and followers are buried here. Over ten thousand companions rest here.',
      ru:'Самое древнее и священное исламское кладбище в Медине. Здесь похоронены члены семьи Пророка (мир ему), сподвижники и последователи. Здесь покоятся более десяти тысяч сподвижников.',
      ar:'أقدم وأقدس مقبرة إسلامية في المدينة المنورة. دُفن هنا أفراد من عائلة النبي ﷺ والصحابة والتابعون. يرقد هنا أكثر من عشرة آلاف صحابي.',
      tr:'Medine\'deki en eski ve en kutsal İslam kabristanı. Hz. Peygamber\'in (s.a.s) aile üyeleri, sahâbîler ve tâbiîn burada defnedilmiştir. On binden fazla sahâbînin kabri burada bulunmaktadır.',
    },
    significance: {
      az:'Peyğəmbərimiz (s.a.s) tez-tez buranı ziyarət edər və Bəqi əhli üçün dua edərdi.',
      en:'Prophet Muhammad (PBUH) frequently visited this place and prayed for the people of Baqi.',
      ru:'Пророк Мухаммад (мир ему) часто посещал это место и молился за обитателей Баки.',
      ar:'كان النبي ﷺ يزور البقيع كثيراً ويدعو لأهله.',
      tr:'Hz. Peygamber (s.a.s) burayı sık sık ziyaret eder ve Bakî ehli için dua ederdi.',
    },
    reference: { az:'Muslim 974', en:'Muslim 974', ru:'Муслим 974', ar:'مسلم ٩٧٤', tr:'Müslim 974' },
  },
]

export function HolyPlacesPage({ setPage }) {
  const { lang } = useLang()
  const lk = lang
  const lb = LABELS[lk] || LABELS.az
  const [filter, setFilter] = useState('all')

  const cities = [...new Set(PLACES.map(p => p.city.en))]
  const filtered = filter === 'all' ? PLACES : PLACES.filter(p => p.city.en === filter)

  return (
    <div className="holy-page">
      <section className="holy-hero">
        <div className="holy-hero-bg" />
        <h1 className="holy-title">{lb.title}</h1>
        <p className="holy-subtitle">{lb.subtitle}</p>
      </section>

      <div className="holy-filters">
        <button
          className={`holy-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          {lk === 'az' ? 'Hamısı' : lk === 'ru' ? 'Все' : lk === 'ar' ? 'الكل' : lk === 'tr' ? 'Tümü' : 'All'}
        </button>
        {cities.map(c => (
          <button
            key={c}
            className={`holy-filter-btn ${filter === c ? 'active' : ''}`}
            onClick={() => setFilter(c)}
          >
            {PLACES.find(p => p.city.en === c).city[lk] || c}
          </button>
        ))}
      </div>

      <div className="holy-grid">
        {filtered.map((place, i) => (
          <article key={i} className="holy-card">
            <div className="holy-card-header">
              <span className="holy-card-emoji">{place.emoji}</span>
              <div className="holy-card-titles">
                <h2 className="holy-card-name">{place.name[lk] || place.name.az}</h2>
                <p className="holy-card-ar">{place.nameAr}</p>
                <span className="holy-card-city">📍 {place.city[lk] || place.city.az}</span>
              </div>
            </div>

            <p className="holy-card-desc">{place.desc[lk] || place.desc.az}</p>

            <div className="holy-card-section">
              <h3 className="holy-card-section-title">✦ {lb.significance}</h3>
              <p className="holy-card-significance">{place.significance[lk] || place.significance.az}</p>
            </div>

            <div className="holy-card-section">
              <h3 className="holy-card-section-title">📜 {lb.reference}</h3>
              <p className="holy-card-ref">{place.reference[lk] || place.reference.az}</p>
            </div>

            <a
              className="holy-card-maps"
              href={`https://www.google.com/maps?q=${place.lat},${place.lon}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              🗺️ {lb.openMaps}
            </a>
          </article>
        ))}
      </div>
    </div>
  )
}
