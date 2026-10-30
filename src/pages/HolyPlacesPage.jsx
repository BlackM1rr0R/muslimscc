import { useState } from 'react'
import { useLang } from '../contexts/LangContext'
import '../styles/HolyPlacesPage.css'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { navGroupLabel, navGroupOf } from '../data/navigation'

const LABELS = {
  az: { title:'Müqəddəs yerlər', subtitle:'İslamın müqəddəs məkanları', openMaps:'Xəritədə aç', significance:'Əhəmiyyəti', reference:'İstinad', adabTitle:'Ziyarət ədəbi', adabText:'İbadət niyyəti ilə səfərə yalnız üç məscidə çıxılır: Məscidül-Haram, Peyğəmbər ﷺ məscidi və Məscidül-Əqsa (Buxari 1189, Müslim 1397). Mağaralar, dağlar, daşlar və qəbirlər təbərrük yeri deyil — onlara toxunub bərəkət ummaq və ya oradan torpaq-daş götürmək sünnədə yoxdur (Tirmizi 2180). Qəbirlər isə sünnəyə uyğun ziyarət edilir: ölülərə salam verilir, onlar üçün dua edilir və axirət xatırlanır (Müslim 974, 976).' },
  en: { title:'Holy Places', subtitle:'Sacred places of Islam', openMaps:'Open in Maps', significance:'Significance', reference:'Reference', adabTitle:'Etiquette of visiting', adabText:'One may set out on a journey for the purpose of worship only to three mosques: Masjid al-Haram, the Mosque of the Prophet ﷺ and Masjid al-Aqsa (Bukhari 1189, Muslim 1397). Caves, mountains, stones and graves are not places of tabarruk — touching them seeking blessing or taking soil or stones from them has no basis in the Sunnah (Tirmidhi 2180). Graves are visited according to the Sunnah: greeting the dead with salam, supplicating for them and remembering the Hereafter (Muslim 974, 976).' },
  ru: { title:'Святые Места', subtitle:'Священные места ислама', openMaps:'Открыть на карте', significance:'Значение', reference:'Ссылка', adabTitle:'Этикет посещения', adabText:'Отправляться в путь ради поклонения можно лишь к трём мечетям: Заповедной мечети, мечети Пророка ﷺ и мечети аль-Акса (Бухари 1189, Муслим 1397). Пещеры, горы, камни и могилы не являются местами для поиска благодати — прикасаться к ним ради благословения или брать оттуда землю и камни не имеет основы в Сунне (Тирмизи 2180). Могилы посещают согласно Сунне: приветствуют умерших, молятся за них и вспоминают о Последней жизни (Муслим 974, 976).' },
  ar: { title:'الأماكن المقدسة', subtitle:'الأماكن المقدسة في الإسلام', openMaps:'افتح في الخريطة', significance:'الأهمية', reference:'المرجع', adabTitle:'آداب الزيارة', adabText:'لا تُشدّ الرحال بقصد العبادة إلا إلى ثلاثة مساجد: المسجد الحرام، ومسجد النبي ﷺ، والمسجد الأقصى (البخاري 1189، مسلم 1397). والغيران والجبال والأحجار والقبور ليست مواضع للتبرك، فالتمسح بها رجاء البركة أو أخذ ترابها وأحجارها لا أصل له في السنة (الترمذي 2180). وتُزار القبور على وفق السنة: بالسلام على أهلها والدعاء لهم وتذكّر الآخرة (مسلم 974، 976).' },
  tr: { title:'Kutsal Yerler', subtitle:'İslam\'ın kutsal mekanları', openMaps:'Haritada aç', significance:'Önemi', reference:'Referans', adabTitle:'Ziyaret adabı', adabText:'İbadet niyetiyle yolculuk yalnızca üç mescide yapılır: Mescid-i Haram, Peygamber ﷺ mescidi ve Mescid-i Aksa (Buhari 1189, Müslim 1397). Mağaralar, dağlar, taşlar ve kabirler teberrük yeri değildir — onlara dokunarak bereket ummak ya da oradan toprak ve taş almak sünnette yoktur (Tirmizi 2180). Kabirler ise sünnete uygun ziyaret edilir: ölülere selam verilir, onlar için dua edilir ve ahiret hatırlanır (Müslim 974, 976).' },
}

const PLACES = [
  {
    icon: 'hajjguide',
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
    icon: 'holyplaces',
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
    icon: 'holyplaces',
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
    icon: 'holyplaces',
    nameAr: 'مسجد قباء',
    name: { az:'Quba məscidi', en:'Quba Mosque', ru:'Мечеть Куба', ar:'مسجد قباء', tr:'Kuba Mescidi' },
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
    icon: 'quran',
    nameAr: 'غار حراء',
    name: { az:'Həra mağarası', en:'Cave of Hira', ru:'Пещера Хира', ar:'غار حراء', tr:'Hira Mağarası' },
    lat: 21.4574, lon: 39.8582,
    city: { az:'Məkkə', en:'Mecca', ru:'Мекка', ar:'مكة المكرمة', tr:'Mekke' },
    desc: {
      az:'Peyğəmbərimizə (s.a.s) ilk vəhyin nazil olduğu mağara. Nur dağının zirvəsində yerləşir. Peyğəmbərlikdən əvvəl Hz. Muhəmməd (s.a.s) burada tənha qalıb ibadət edərdi (Buxari 3).',
      en:'The cave where the first revelation was sent down to Prophet Muhammad (PBUH). Located at the peak of Jabal an-Nur. Before prophethood, he used to seclude himself here in worship (Bukhari 3).',
      ru:'Пещера, в которой Пророку Мухаммаду (мир ему) было ниспослано первое откровение. Расположена на вершине горы Нур. До пророчества он уединялся здесь для поклонения (аль-Бухари 3).',
      ar:'الغار الذي نزل فيه الوحي الأول على النبي ﷺ. يقع على قمة جبل النور. كان النبي ﷺ قبل البعثة يخلو فيه فيتحنّث (البخاري 3).',
      tr:'Hz. Peygamber\'e (s.a.s) ilk vahyin indirildiği mağara. Nur Dağı\'nın zirvesinde yer alır. Peygamberlikten önce Hz. Muhammed (s.a.s) burada inzivaya çekilip ibadet ederdi (Buhârî 3).',
    },
    significance: {
      az:'İlk nazil olan Quran ayələri burada endirilmişdir — Ələq surəsinin ilk beş ayəsi. Peyğəmbərlikdən sonra nə Peyğəmbər ﷺ, nə də səhabələr bu mağaraya ibadət üçün çıxmayıblar — ora çıxmaq ibadət deyil.',
      en:'The first verses of the Quran were revealed here — the first five verses of Surah Al-Alaq. After prophethood neither the Prophet ﷺ nor his Companions climbed to this cave for worship — going up to it is not an act of worship.',
      ru:'Первые аяты Корана были ниспосланы здесь — первые пять аятов суры Аль-Алак. После начала пророчества ни Пророк ﷺ, ни сподвижники не поднимались в эту пещеру ради поклонения — подъём туда не является поклонением.',
      ar:'أُنزلت هنا أول آيات القرآن الكريم — الآيات الخمس الأولى من سورة العلق. ولم يصعد إليه النبي ﷺ ولا أصحابه بعد البعثة للتعبد، فصعوده ليس عبادة.',
      tr:'İlk Kur\'an ayetleri burada indirilmiştir — Alak suresinin ilk beş ayeti. Peygamberlikten sonra ne Peygamber ﷺ ne de sahabeler bu mağaraya ibadet için çıktı — oraya çıkmak ibadet değildir.',
    },
    reference: { az:'Ələq 1-5', en:'Al-Alaq 1-5', ru:'Аль-Алак 1-5', ar:'العلق ١-٥', tr:'Alak 1-5' },
  },
  {
    icon: 'shield',
    nameAr: 'غار ثور',
    name: { az:'Sevr mağarası', en:'Cave of Thawr', ru:'Пещера Саур', ar:'غار ثور', tr:'Sevr Mağarası' },
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
      az:'Qurani-Kərimdə "ikinin ikincisi" ifadəsi ilə xatırlanır. Allahın qoruması burada təcəlli etmişdir. Bu mağaraya ibadət niyyəti ilə çıxmaq sünnədə yoxdur.',
      en:'Mentioned in the Quran with the phrase "the second of the two." Allah\'s protection was manifested here. Going up to this cave with the intention of worship has no basis in the Sunnah.',
      ru:'Упоминается в Коране фразой «второй из двоих». Здесь проявилась защита Аллаха. Подниматься в эту пещеру с намерением поклонения не имеет основы в Сунне.',
      ar:'ذُكر في القرآن بعبارة "ثاني اثنين". تجلت هنا حماية الله لنبيه ﷺ. وقصد هذا الغار بنية التعبد لا أصل له في السنة.',
      tr:'Kur\'an\'da "ikinin ikincisi" ifadesiyle anılır. Allah\'ın koruması burada tecelli etmiştir. Bu mağaraya ibadet niyetiyle çıkmanın sünnette aslı yoktur.',
    },
    reference: { az:'Tövbə 40', en:'At-Tawbah 40', ru:'Ат-Тауба 40', ar:'التوبة ٤٠', tr:'Tevbe 40' },
  },
  {
    icon: 'sun',
    nameAr: 'جبل عرفات',
    name: { az:'Ərəfat dağı', en:'Mount Arafat', ru:'Гора Арафат', ar:'جبل عرفات', tr:'Arafat Dağı' },
    lat: 21.3549, lon: 39.9841,
    city: { az:'Məkkə', en:'Mecca', ru:'Мекка', ar:'مكة المكرمة', tr:'Mekke' },
    desc: {
      az:'Həccin ən mühüm rüknü olan Ərəfat dayanması burada edilir. Peyğəmbərimiz (s.a.s) Vida Xütbəsini burada söyləmişdir. Zilhiccə ayının 9-cu günü milyonlarla müsəlman burada toplanır.',
      en:'The most important pillar of Hajj — the standing at Arafat — takes place here. Prophet Muhammad (PBUH) delivered his Farewell Sermon here. Millions of Muslims gather here on the 9th of Dhul-Hijjah.',
      ru:'Здесь совершается самый важный столп Хаджа — стояние на Арафате. Пророк Мухаммад (мир ему) произнес здесь прощальную проповедь. Миллионы мусульман собираются здесь 9-го Зуль-Хиджа.',
      ar:'يُؤدى هنا أهم ركن من أركان الحج — الوقوف بعرفة. ألقى النبي ﷺ خطبة الوداع هنا. يجتمع ملايين المسلمين هنا في اليوم التاسع من ذي الحجة.',
      tr:'Haccın en önemli rüknü olan Arafat vakfesi burada yapılır. Hz. Peygamber (s.a.s) Veda Hutbesi\'ni burada okumuştur. Zilhicce ayının 9. günü milyonlarca Müslüman burada toplanır.',
    },
    significance: {
      az:'"Həcc Ərəfatdır" — bu hədis Ərəfatın həccdəki mərkəzi rolunu göstərir.',
      en:'"Hajj is Arafat" — this hadith highlights the central role of Arafat in Hajj.',
      ru:'«Хадж — это Арафат» — этот хадис подчеркивает центральную роль Арафата в Хадже.',
      ar:'"الحج عرفة" — هذا الحديث يبرز الدور المركزي لعرفة في الحج.',
      tr:'"Hac Arafat\'tır" — bu hadis Arafat\'ın haccdaki merkezi rolünü gösterir.',
    },
    reference: { az:'Tirmizi 889', en:'Tirmidhi 889', ru:'Тирмизи 889', ar:'الترمذي ٨٨٩', tr:'Tirmizî 889' },
  },
  {
    icon: 'jamaat',
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
      az:'Təşriq günlərində burada Allah zikr olunur (Bəqərə 2:203) və cəmərələrə daş atılır.',
      en:'During the days of Tashreeq Allah is remembered here (Al-Baqarah 2:203) and the Jamarat are stoned.',
      ru:'В дни ташрика здесь поминают Аллаха (аль-Бакара 2:203) и бросают камешки в джамараты.',
      ar:'يُذكر الله هنا في أيام التشريق (البقرة ٢٠٣) وتُرمى الجمرات.',
      tr:'Teşrik günlerinde burada Allah zikredilir (Bakara 2:203) ve cemrelere taş atılır.',
    },
    reference: { az:'Bəqərə 203', en:'Al-Baqarah 203', ru:'Аль-Бакара 203', ar:'البقرة ٢٠٣', tr:'Bakara 203' },
  },
  {
    icon: 'moon',
    nameAr: 'مزدلفة',
    name: { az:'Müzdəlifə', en:'Muzdalifah', ru:'Муздалифа', ar:'مزدلفة', tr:'Müzdelife' },
    lat: 21.3992, lon: 39.9089,
    city: { az:'Məkkə', en:'Mecca', ru:'Мекка', ar:'مكة المكرمة', tr:'Mekke' },
    desc: {
      az:'Ərəfat ilə Mina arasında yerləşən açıq sahə. Hacılar Ərəfatdan sonra burada gecələyirlər. Burada Məğrib və İşa namazları cəm edilərək qılınır.',
      en:'An open area between Arafat and Mina. Pilgrims spend the night here after Arafat. Maghrib and Isha prayers are combined and performed here.',
      ru:'Открытая территория между Арафатом и Миной. Паломники проводят здесь ночь после Арафата. Молитвы Магриб и Иша объединяются и совершаются здесь.',
      ar:'منطقة مفتوحة بين عرفات ومنى. يبيت الحجاج هنا بعد عرفة. تُصلى صلاتا المغرب والعشاء جمعاً هنا.',
      tr:'Arafat ile Mina arasında yer alan açık alan. Hacılar Arafat\'tan sonra burada gecelerler. Akşam ve yatsı namazları burada cem edilerek kılınır.',
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
    icon: 'leaf',
    nameAr: 'جنة البقيع',
    name: { az:'Cənnətül-Bəqi', en:'Jannat al-Baqi', ru:'Джаннат аль-Баки', ar:'جنة البقيع', tr:'Cennetü\'l-Bakî' },
    lat: 24.4667, lon: 39.6150,
    city: { az:'Mədinə', en:'Medina', ru:'Медина', ar:'المدينة المنورة', tr:'Medine' },
    desc: {
      az:'Mədinədə yerləşən ən qədim İslam qəbiristanlığı. Peyğəmbərimizin (s.a.s) ailə üzvləri, səhabələr və tabeinlər burada dəfn edilmişdir.',
      en:'The oldest Islamic cemetery in Medina. Family members of the Prophet (PBUH), companions, and followers are buried here.',
      ru:'Самое древнее исламское кладбище в Медине. Здесь похоронены члены семьи Пророка (мир ему), сподвижники и последователи.',
      ar:'أقدم مقبرة إسلامية في المدينة المنورة. دُفن هنا أفراد من عائلة النبي ﷺ والصحابة والتابعون.',
      tr:'Medine\'deki en eski İslam kabristanı. Hz. Peygamber\'in (s.a.s) aile üyeleri, sahâbîler ve tâbiîn burada defnedilmiştir.',
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

// "Hamısı" süzgəcinin adı (5 dil)
const ALL_LABEL = { az: 'Hamısı', en: 'All', ru: 'Все', ar: 'الكل', tr: 'Tümü' }

export function HolyPlacesPage({ setPage }) {
  const { lang } = useLang()
  const lk = lang
  const lb = LABELS[lk] || LABELS.az
  const [filter, setFilter] = useState('all')

  const cities = [...new Set(PLACES.map(p => p.city.en))]
  const filtered = filter === 'all' ? PLACES : PLACES.filter(p => p.city.en === filter)
  const countOf = (c) => PLACES.filter(p => p.city.en === c).length

  return (
    <div className="holy-page">
      {/* Hero — dizayn v2: sakit kağız fon + xatəm naxışı, bir <h1>.
          Ərəbcə sətir bəzəkdir: ərəb dilində başlıq onsuz da ərəbcədir */}
      <header className="ui-page-hero holy-hero-v2">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container" data-reveal="stagger">
          <Breadcrumb setPage={setPage} current={lb.title} />
          <span className="ui-eyebrow">{navGroupLabel(navGroupOf('holyplaces'), lk)}</span>
          <h1 className="ui-display">{lb.title}</h1>
          {lk !== 'ar' && <p className="holy-hero-ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">الأماكن المقدسة</p>}
          <p className="ui-lead">{lb.subtitle}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container">
          {/* Süzgəc: telefonda bir sətirdə sürüşən çiplər, genişdə sarınır */}
          <div className="holy-filters chip-scroll wrap-desktop" role="group" aria-label={lb.title}>
            <button
              type="button"
              className="ui-chip"
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              {ALL_LABEL[lk] || ALL_LABEL.en}
              <span className="holy-chip-num ui-num">{PLACES.length}</span>
            </button>
            {cities.map(c => (
              <button
                key={c}
                type="button"
                className="ui-chip"
                aria-pressed={filter === c}
                onClick={() => setFilter(c)}
              >
                {PLACES.find(p => p.city.en === c).city[lk] || c}
                <span className="holy-chip-num ui-num">{countOf(c)}</span>
              </button>
            ))}
          </div>

          {/* Ziyarət ədəbi — Sələf mövqeyi: səfər niyyəti yalnız üç məscidə; yerlərdən təbərrük yoxdur */}
          <aside className="ui-card holy-adab" role="note">
            <h2 className="holy-adab-title"><Icon name="books" size={16} /> {lb.adabTitle}</h2>
            <p className="holy-adab-text">{lb.adabText}</p>
          </aside>

          <div className="holy-grid">
            {filtered.map((place, i) => (
              // Sabit açar: süzgəc dəyişəndə yeni kartlar görünmə animasiyası ilə gəlir
              <article key={place.name.en} className="ui-card holy-card" data-reveal="" data-reveal-delay={(i % 3) * 60}>
                <div className="holy-card-header">
                  <span className="ui-icon-tile ui-icon-tile--lg holy-card-icon"><Icon name={place.icon} /></span>
                  <div className="holy-card-titles">
                    <h2 className="holy-card-name">{place.name[lk] || place.name.az}</h2>
                    {/* Ərəbcədə başlıq onsuz da ərəbcədir — eyni adı ikinci dəfə göstərmə */}
                    {lk !== 'ar' && <p className="holy-card-ar ui-arabic" lang="ar" dir="rtl">{place.nameAr}</p>}
                    <span className="holy-card-city"><Icon name="pin" size={14} /> {place.city[lk] || place.city.az}</span>
                  </div>
                </div>

                <p className="holy-card-desc">{place.desc[lk] || place.desc.az}</p>

                <div className="holy-card-section">
                  <h3 className="holy-card-section-title"><Icon name="star" size={14} /> {lb.significance}</h3>
                  <p className="holy-card-significance">{place.significance[lk] || place.significance.az}</p>
                </div>

                <div className="holy-card-section holy-card-section--ref">
                  <h3 className="holy-card-section-title"><Icon name="books" size={14} /> {lb.reference}</h3>
                  <p className="holy-card-ref">{place.reference[lk] || place.reference.az}</p>
                </div>

                <a
                  className="ui-btn ui-btn--secondary holy-card-maps"
                  href={`https://www.google.com/maps?q=${place.lat},${place.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="pin" size={18} className="ui-btn__icon" />
                  {lb.openMaps}
                  <Icon name="external" size={15} className="holy-card-ext" />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
