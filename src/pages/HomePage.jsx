import { useState, useEffect, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import '../styles/HomePage.css'

function CountUp({ end, duration = 2000 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1)
          const ease = 1 - Math.pow(1 - p, 3)
          setCount(Math.floor(ease * end))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [end, duration])
  return <span ref={ref}>{count.toLocaleString()}</span>
}

function useInView(threshold = 0.12) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect() }
    }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

const PRAYER_KEYS = ['Fajr','Dhuhr','Asr','Maghrib','Isha']
const PRAYER_NAMES = {
  Fajr:    { az:'Sübh',   ru:'Фаджр',  ar:'الفجر',  tr:'Sabah',  en:'Fajr'    },
  Dhuhr:   { az:'Zöhr',   ru:'Зухр',   ar:'الظهر',  tr:'Öğle',   en:'Dhuhr'   },
  Asr:     { az:'Əsr',    ru:'Аср',    ar:'العصر',  tr:'İkindi', en:'Asr'     },
  Maghrib: { az:'Məğrib', ru:'Магриб', ar:'المغرب', tr:'Akşam',  en:'Maghrib' },
  Isha:    { az:'İşa',    ru:'Иша',    ar:'العشاء', tr:'Yatsı',  en:'Isha'    },
}
const FB = { Fajr:'05:28', Dhuhr:'13:02', Asr:'16:45', Maghrib:'19:14', Isha:'20:42' }
const toMin = t => { const [h,m]=t.split(':').map(Number); return h*60+m }
const nowMin = () => { const n=new Date(); return n.getHours()*60+n.getMinutes() }

const TAWHEED_PILLARS = [
  {
    icon:'☝️', key:'rub', ar:'تَوْحِيدُ الرُّبُوبِيَّة',
    az:'Rübubiyyət Tövhidi', en:'Tawhid al-Rububiyyah', ru:'Таухид ар-Рубубийя', tr:'Rububiyyet Tevhidi',
    desc:{
      az:'Allahın Rəbb olduğuna inanmaqdır — O hər şeyin yaradıcısı, ruziversi, idarəçisidir. Heç kim Onun yaratmaq, öldürmək, diriltmək, ruzi vermək, idarə etmək kimi xüsusiyyətlərində Ona şərik ola bilməz.',
      en:'Belief in Allah\'s Lordship — that He alone creates, provides sustenance, and governs all things. Nothing can share His powers of creation, life, death, and governance.',
      ru:'Вера в господство Аллаха — что Он один творит, дарует пропитание и управляет всем. Никто не может разделять с Ним творение, жизнь, смерть и управление.',
      tr:'Allah\'ın Rablığına iman — yalnız O\'nun yaratan, rızık veren ve idare edendir. Yaratmak, hayat, ölüm ve yönetim gibi özelliklerinde hiçbir şey O\'na ortak olamaz.',
    },
    ayah:'أَلاَ لَهُ الْخَلْقُ وَالأَمْرُ تَبَارَكَ اللَّهُ رَبُّ الْعَالَمِينَ',
    ayahRef:{ az:'Əraf 54', en:'Al-A\'raf 54', ru:'Аль-Аграф 54', tr:'Araf 54' },
    color:'#10b981',
  },
  {
    icon:'🕌', key:'ulu', ar:'تَوْحِيدُ الأُلُوهِيَّة',
    az:'Uluhiyyət Tövhidi', en:'Tawhid al-Uluhiyyah', ru:'Таухид аль-Улюхийя', tr:'Uluhiyyet Tevhidi',
    desc:{
      az:'Bütün ibadətin — namaz, dua, qurban, nəzir, sevgi, qorxu, ümid, s.d.a. — yalnız Allaha edilməsidir. Bu tövhid növü peyğəmbərlərin insanlara ən çox çatdırdığı dəvətin əsasını təşkil edir.',
      en:'Dedicating all acts of worship solely to Allah: prayer, supplication, sacrifice, vows, love, fear, and hope. This is the core of every prophet\'s call to their people.',
      ru:'Посвящение всех актов поклонения исключительно Аллаху: молитва, мольба, жертвоприношение, обеты, любовь, страх, надежда. Это основа призыва каждого пророка.',
      tr:'Tüm ibadetleri yalnızca Allah\'a adamak: namaz, dua, kurban, adak, sevgi, korku, ümit. Bu, her peygamberin davetinin temelidir.',
    },
    ayah:'وَمَا خَلَقْتُ الجِنَّ وَالإِنسَ إِلاَّ لِيَعْبُدُونِ',
    ayahRef:{ az:'Zariyat 56', en:'Adh-Dhariyat 56', ru:'Аз-Зарийат 56', tr:'Zariyat 56' },
    color:'#f59e0b',
  },
  {
    icon:'✨', key:'asma', ar:'تَوْحِيدُ الأَسْمَاءِ وَالصِّفَاتِ',
    az:'Əsma və Sifat Tövhidi', en:'Tawhid al-Asma was-Sifat', ru:'Таухид аль-Асма уа ас-Сыфат', tr:'Esma ve Sıfat Tevhidi',
    desc:{
      az:'Allahın Özü üçün Quran və sünnədə sabit etdiyi bütün gözəl ad və sifətlərə iman etmək; onları məxluqata bənzətmədən, inkar etmədən, dəyişdirmədən, surətini soruşmadan.',
      en:'Affirming all the beautiful Names and Attributes that Allah established for Himself in the Quran and Sunnah — without likening them to creation, denying, distorting, or asking about their modality.',
      ru:'Утверждение всех прекрасных Имён и Атрибутов, которые Аллах установил для Себя в Коране и Сунне — без уподобления творениям, отрицания, искажения или вопросов об их природе.',
      tr:'Allah\'ın Kuran ve sünnette kendisi için sabit kıldığı tüm güzel isim ve sıfatları ispat etmek — mahlûkata benzetmeksizin, inkâr etmeksizin, tahrif etmeksizin ve keyfiyetini sormaksızın.',
    },
    ayah:'وَلِلَّهِ الأَسْمَاءُ الْحُسْنَى فَادْعُوهُ بِهَا',
    ayahRef:{ az:'Əraf 180', en:'Al-A\'raf 180', ru:'Аль-Аграф 180', tr:'Araf 180' },
    color:'#8b5cf6',
  },
]

const TAWHEED_FACTS = [
  { ar:'لَا إِلَهَ إِلَّا اللَّهُ', az:'"La ilaha illallah" — İslamın əsası, cənnətin açarı, ən ağır kəlmə', en:'"La ilaha illallah" — foundation of Islam, key to Paradise, the weightiest word', ru:'"Ля иляха иллаллах" — основа ислама, ключ от рая', tr:'"La ilahe illallah" — İslam\'ın temeli, cennetin anahtarı' },
  { ar:'هُوَ اللَّهُ أَحَدٌ', az:'Allah birdir — heç bir şərikin, həmtayın, nəzirin yoxdur', en:'Allah is One — no partners, equals, or rivals', ru:'Аллах Один — без сотоварищей, равных или соперников', tr:'Allah birdir — ortağı, eşi, dengi yoktur' },
  { ar:'اللَّهُ الصَّمَدُ', az:'Allah Saməd — hər şey Ona möhtac, O heç kimə möhtac deyil', en:'Allah is As-Samad — all depend on Him; He depends on none', ru:'Аллах — Самад: все нуждаются в Нём, Он ни в ком не нуждается', tr:'Allah Samed\'dir — herkes O\'na muhtaç, O kimseye değil' },
  { ar:'لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُنْ لَهُ كُفُواً أَحَدٌ', az:'O doğmadı, doğulmadı — heç bir şeye bənzəmir, heç kim Onun bənzəri deyil', en:'He neither begot nor was begotten — nothing resembles Him, none equals Him', ru:'Он не рожает и не рождён — ничто Ему не подобно', tr:'O doğurmadı ve doğulmadı — hiçbir şey O\'na benzemez' },
]

const ALLAH_NAMES = [
  { ar:'ٱلرَّحْمَٰن',  az:'Rəhman',    en:'The Most Gracious',          color:'#10b981' },
  { ar:'ٱلرَّحِيم',   az:'Rəhim',     en:'The Most Merciful',          color:'#f59e0b' },
  { ar:'ٱلْمَلِك',   az:'Malik',     en:'The King',                   color:'#8b5cf6' },
  { ar:'ٱلْقُدُّوس', az:'Quddus',    en:'The Most Pure',              color:'#3b82f6' },
  { ar:'ٱلسَّلَٰم',  az:'Salam',     en:'The Source of Peace',        color:'#ec4899' },
  { ar:'ٱلْمُؤْمِن', az:'Mümün',     en:'The Granter of Security',    color:'#ef4444' },
  { ar:'ٱلْعَزِيز',  az:'Əziz',      en:'The Almighty',               color:'#f97316' },
  { ar:'ٱلْغَفُور',  az:'Ğafur',     en:'The Forgiving',              color:'#14b8a6' },
  { ar:'ٱلْوَدُود',  az:'Vadud',     en:'The Loving',                 color:'#a855f7' },
  { ar:'ٱلْحَكِيم',  az:'Həkim',     en:'The Wise',                   color:'#6366f1' },
  { ar:'ٱلتَّوَّاب', az:'Tövvab',    en:'The Acceptor of Repentance', color:'#84cc16' },
  { ar:'ٱلنُّور',    az:'Nur',       en:'The Light',                  color:'#fbbf24' },
]

const DAILY_HADITHS = [
  { ar:'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ', az:'Əməllər ancaq niyyətlərə görədir.', en:'Actions are judged by intentions.', ru:'Дела оцениваются по намерениям.', tr:'Ameller niyetlere göredir.', source:'Buxari 1' },
  { ar:'الدِّينُ النَّصِيحَةُ', az:'Din nəsihətdir.', en:'Religion is sincerity.', ru:'Религия — это искренность.', tr:'Din nasihattır.', source:'Muslim 55' },
  { ar:'أَلاَ بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', az:'Qəlblər ancaq Allahın zikri ilə rahatlıq tapar.', en:'Hearts find rest only in the remembrance of Allah.', ru:'Сердца успокаиваются поминанием Аллаха.', tr:'Kalpler ancak Allah\'ın zikriyle huzur bulur.', source:'Rad 28' },
  { ar:'مَنْ سَلَكَ طَرِيقاً يَلْتَمِسُ فِيهِ عِلْماً سَهَّلَ اللَّهُ لَهُ طَرِيقاً إِلَى الجَنَّةِ', az:'Kim elm axtarmaq üçün bir yola çıxarsa, Allah ona cənnətə gedən yolu asanlaşdırar.', en:'Whoever takes a path seeking knowledge, Allah will make easy a path to Paradise.', ru:'Кто идёт по пути знаний, Аллах облегчит ему путь в Рай.', tr:'Kim ilim arayarak yola çıkarsa, Allah ona cennete giden yolu kolaylaştırır.', source:'Muslim 2699' },
  { ar:'خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ', az:'İnsanların ən xeyirlisi insanlara ən faydalı olanıdır.', en:'The best of people are those most beneficial to others.', ru:'Лучшие из людей — наиболее полезные для других.', tr:'İnsanların en hayırlısı, insanlara en faydalı olanıdır.', source:'Taberani' },
  { ar:'مَنْ لاَ يَرْحَمُ لاَ يُرْحَمُ', az:'Rəhm etməyənə rəhm olunmaz.', en:'Whoever does not show mercy will not be shown mercy.', ru:'Кто не проявляет милосердия, не получит его.', tr:'Merhamet etmeyene merhamet edilmez.', source:'Buxari 5997' },
  { ar:'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ', az:'Qardaşının üzünə gülümsəmən sədəqədir.', en:'Your smile to your brother is charity.', ru:'Твоя улыбка брату — это милостыня.', tr:'Kardeşinin yüzüne gülümsemen sadakadır.', source:'Tirmizi 1956' },
  { ar:'الْمُؤْمِنُ لِلْمُؤْمِنِ كَالْبُنْيَانِ يَشُدُّ بَعْضُهُ بَعْضاً', az:'Mömin möminin birbirinə dəstək olan bina kimidir.', en:'The believer to the believer is like a building whose parts reinforce each other.', ru:'Верующий для верующего как здание, части которого укрепляют друг друга.', tr:'Mümin mümine, birbirini destekleyen bina gibidir.', source:'Buxari 481' },
  { ar:'إِنَّ اللَّهَ جَمِيلٌ يُحِبُّ الْجَمَالَ', az:'Allah gözəldir, gözəlliyi sevir.', en:'Allah is beautiful and loves beauty.', ru:'Аллах красив и любит красоту.', tr:'Allah güzeldir, güzelliği sever.', source:'Muslim 91' },
  { ar:'الدُّنْيَا سِجْنُ الْمُؤْمِنِ وَجَنَّةُ الْكَافِرِ', az:'Dünya möminin zindanı, kafirin cənnətidir.', en:'The world is a prison for the believer and paradise for the disbeliever.', ru:'Мир — тюрьма для верующего и рай для неверного.', tr:'Dünya müminin zindanı, kâfirin cennetidir.', source:'Muslim 2956' },
  { ar:'كَفَى بِالْمَرْءِ كَذِباً أَنْ يُحَدِّثَ بِكُلِّ مَا سَمِعَ', az:'İnsana yalan olaraq eşitdiyi hər şeyi danışması yetər.', en:'It is enough lying for a person to speak of everything he hears.', ru:'Достаточно лжи для человека — передавать всё, что он слышит.', tr:'Kişiye yalan olarak duyduğu her şeyi söylemesi yeter.', source:'Muslim 5' },
  { ar:'لاَ تَحَاسَدُوا وَلاَ تَبَاغَضُوا وَلاَ تَدَابَرُوا', az:'Bir-birinizə həsəd aparmayın, nifrət etməyin, arxa çevirməyin.', en:'Do not envy each other, do not hate each other, do not turn away from each other.', ru:'Не завидуйте друг другу, не ненавидьте, не отворачивайтесь.', tr:'Birbirinize haset etmeyin, buğzetmeyin, sırt çevirmeyin.', source:'Muslim 2559' },
  { ar:'كُلُّ ابْنِ آدَمَ خَطَّاءٌ وَخَيْرُ الْخَطَّائِينَ التَّوَّابُونَ', az:'Hər Adəm övladı xəta edəndir, xəta edənlərin ən xeyirlisi tövbə edənlərdir.', en:'Every son of Adam sins, and the best of sinners are those who repent.', ru:'Каждый сын Адама грешен, а лучшие из грешников — кающиеся.', tr:'Her Ademoğlu hata eder, hata edenlerin en hayırlısı tövbe edenlerdir.', source:'Tirmizi 2499' },
  { ar:'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ', az:'Sədəqə malı azaltmaz.', en:'Charity does not decrease wealth.', ru:'Милостыня не уменьшает богатства.', tr:'Sadaka malı eksiltmez.', source:'Muslim 2588' },
  { ar:'إِذَا مَاتَ ابْنُ آدَمَ انْقَطَعَ عَمَلُهُ إِلاَّ مِنْ ثَلاَثٍ', az:'İnsan öldükdə əməli kəsilir, üç şey istisna.', en:'When a person dies, their deeds end except for three things.', ru:'Когда человек умирает, его дела прекращаются, кроме трёх.', tr:'İnsan öldüğünde ameli kesilir, üç şey hariç.', source:'Muslim 1631' },
  { ar:'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَاليَوْمِ الآخِرِ فَلْيُكْرِمْ ضَيْفَهُ', az:'Allaha və axirət gününə iman edən qonağına hörmət etsin.', en:'Whoever believes in Allah and the Last Day, let him honor his guest.', ru:'Кто верует в Аллаха и Судный день, пусть почитает гостя.', tr:'Allah\'a ve ahiret gününe iman eden misafirine ikram etsin.', source:'Buxari 6018' },
  { ar:'الصَّدَقَةُ تُطْفِئُ الخَطِيئَةَ كَمَا يُطْفِئُ المَاءُ النَّارَ', az:'Sədəqə günahı söndürər, suyun odu söndürdüyü kimi.', en:'Charity extinguishes sin as water extinguishes fire.', ru:'Милостыня тушит грех, как вода тушит огонь.', tr:'Sadaka günahı söndürür, suyun ateşi söndürdüğü gibi.', source:'Tirmizi 2616' },
  { ar:'اتَّقُوا اللَّهَ حَيْثُمَا كُنْتُمْ', az:'Harada olsanız Allahdan qorxun.', en:'Fear Allah wherever you are.', ru:'Бойтесь Аллаха, где бы вы ни были.', tr:'Nerede olursanız olun Allah\'tan korkun.', source:'Tirmizi 1987' },
  { ar:'طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ', az:'Elm öyrənmək hər müsəlmana fərzdir.', en:'Seeking knowledge is an obligation upon every Muslim.', ru:'Приобретение знания — обязанность каждого мусульманина.', tr:'İlim öğrenmek her Müslümana farzdır.', source:'İbn Macə 224' },
  { ar:'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ', az:'Ən xeyirliniz Quranı öyrənən və öyrədəndir.', en:'The best of you are those who learn the Quran and teach it.', ru:'Лучшие из вас — те, кто учит Коран и обучает ему.', tr:'En hayırlınız Kuran\'ı öğrenen ve öğretendir.', source:'Buxari 5027' },
  { ar:'رَبِّ زِدْنِي عِلْماً', az:'Rəbbim, elmimi artır.', en:'My Lord, increase me in knowledge.', ru:'Господи, приумножь мне знание.', tr:'Rabbim, ilmimi artır.', source:'Taha 114' },
  { ar:'مَنْ يُرِدِ اللَّهُ بِهِ خَيْراً يُفَقِّهْهُ فِي الدِّينِ', az:'Allah kimə xeyir istəsə, onu dində anlayışlı edər.', en:'Whoever Allah wills good for, He grants understanding in religion.', ru:'Кому Аллах желает блага, того Он наделяет пониманием религии.', tr:'Allah kime hayır dilerse, onu dinde fakih kılar.', source:'Buxari 71' },
  { ar:'كُنْ فِي الدُّنْيَا كَأَنَّكَ غَرِيبٌ أَوْ عَابِرُ سَبِيلٍ', az:'Dünyada qərib və ya yolçu kimi ol.', en:'Be in the world as if you are a stranger or a traveler.', ru:'Будь в этом мире как чужеземец или путник.', tr:'Dünyada bir garip ya da yolcu gibi ol.', source:'Buxari 6416' },
  { ar:'يَسِّرُوا وَلاَ تُعَسِّرُوا وَبَشِّرُوا وَلاَ تُنَفِّرُوا', az:'Asanlaşdırın, çətinləşdirməyin; müjdələyin, uzaqlaşdırmayın.', en:'Make things easy, not difficult; give glad tidings, do not drive people away.', ru:'Облегчайте, не затрудняйте; радуйте, не отталкивайте.', tr:'Kolaylaştırın, zorlaştırmayın; müjdeleyin, nefret ettirmeyin.', source:'Buxari 69' },
  { ar:'الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ', az:'Rəhm edənlərə Rəhman rəhm edər.', en:'The merciful are shown mercy by the Most Merciful.', ru:'Милосердным являет милость Милостивый.', tr:'Merhamet edenlere Rahman merhamet eder.', source:'Tirmizi 1924' },
  { ar:'مَا مِنْ مُسْلِمٍ يَغْرِسُ غَرْساً إِلاَّ كَانَ لَهُ صَدَقَةٌ', az:'Heç bir müsəlman yoxdur ki, ağac əksə və ondan yeyilsə, bu sədəqə olmasın.', en:'No Muslim plants a tree and something is eaten from it except that it is charity for him.', ru:'Мусульманин, посадивший дерево, с которого едят — получает награду милостыни.', tr:'Bir Müslüman ağaç diker de ondan yenilirse, bu onun için sadakadır.', source:'Buxari 2320' },
  { ar:'لاَ يَدْخُلُ الجَنَّةَ مَنْ كَانَ فِي قَلْبِهِ مِثْقَالُ ذَرَّةٍ مِنْ كِبْرٍ', az:'Qəlbində zərrə qədər kibr olan cənnətə girməz.', en:'No one who has an atom\'s weight of arrogance in his heart will enter Paradise.', ru:'Не войдёт в рай тот, в чьём сердце есть хоть атом высокомерия.', tr:'Kalbinde zerre kadar kibir olan cennete giremez.', source:'Muslim 91' },
  { ar:'إِنَّ مَعَ العُسْرِ يُسْراً', az:'Çətinliklə yanaşı asanlıq var.', en:'Verily, with hardship comes ease.', ru:'Поистине, после трудности — облегчение.', tr:'Muhakkak zorlukla beraber kolaylık vardır.', source:'İnşirah 6' },
  { ar:'وَمَنْ يَتَّقِ اللَّهَ يَجْعَلْ لَهُ مَخْرَجاً', az:'Kim Allahdan qorxsa, Allah ona çıxış yolu yaradar.', en:'Whoever fears Allah, He will make a way out for him.', ru:'Кто боится Аллаха, тому Он создаст выход.', tr:'Kim Allah\'tan korkarsa, Allah ona çıkış yolu yaratır.', source:'Talaq 2' },
  { ar:'وَتَوَكَّلْ عَلَى اللَّهِ وَكَفَى بِاللَّهِ وَكِيلاً', az:'Allaha təvəkkül et, vəkil olaraq Allah kifayətdir.', en:'Put your trust in Allah; Allah is sufficient as a Trustee.', ru:'Уповай на Аллаха; достаточно Аллаха как Покровителя.', tr:'Allah\'a tevekkül et; vekil olarak Allah yeter.', source:'Əhzab 3' },
  { ar:'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ', az:'Müsəlman, dilindən və əlindən müsəlmanların salamat olduğu kəsdir.', en:'A Muslim is one from whose tongue and hand other Muslims are safe.', ru:'Мусульманин тот, от чьего языка и рук другие мусульмане в безопасности.', tr:'Müslüman, dilinden ve elinden Müslümanların selamette olduğu kimsedir.', source:'Buxari 10' },
  { ar:'لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ', az:'Sizdən biriniz özünə istədiyini qardaşına da istəmədikcə iman etmiş olmaz.', en:'None of you truly believes until he loves for his brother what he loves for himself.', ru:'Не уверует никто из вас, пока не полюбит для брата то, что любит для себя.', tr:'Sizden biriniz kendisi için istediğini kardeşi için de istemedikçe iman etmiş olmaz.', source:'Buxari 13' },
  { ar:'إِنَّ اللَّهَ لاَ يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ', az:'Allah sizin surətinizə və malınıza deyil, qəlbinizə və əməllərinizə baxar.', en:'Allah does not look at your appearances or wealth, but at your hearts and deeds.', ru:'Аллах не смотрит на вашу внешность и богатство, а на ваши сердца и дела.', tr:'Allah sizin suretinize ve malınıza değil, kalplerinize ve amellerinize bakar.', source:'Muslim 2564' },
  { ar:'الطُّهُورُ شَطْرُ الإِيمَانِ', az:'Təmizlik imanın yarısıdır.', en:'Cleanliness is half of faith.', ru:'Чистота — половина веры.', tr:'Temizlik imanın yarısıdır.', source:'Muslim 223' },
  { ar:'الدُّعَاءُ هُوَ الْعِبَادَةُ', az:'Dua ibadətin özüdür.', en:'Supplication is the essence of worship.', ru:'Мольба — это суть поклонения.', tr:'Dua ibadetin özüdür.', source:'Tirmizi 3372' },
  { ar:'مَنْ صَمَتَ نَجَا', az:'Kim susarsa xilas olar.', en:'Whoever is silent is saved.', ru:'Кто молчит — спасён.', tr:'Kim susarsa kurtulur.', source:'Tirmizi 2501' },
  { ar:'لاَ ضَرَرَ وَلاَ ضِرَارَ', az:'Zərər vermək və zərərə zərərlə cavab vermək yoxdur.', en:'There should be no harm and no reciprocal harm.', ru:'Нет вреда и нет ответного вреда.', tr:'Zarar vermek ve zarara zararla karşılık vermek yoktur.', source:'İbn Macə 2340' },
  { ar:'اسْتَحْيِ مِنَ اللَّهِ حَقَّ الْحَيَاءِ', az:'Allahdan layiqincə həya edin.', en:'Be truly modest before Allah.', ru:'Стыдитесь Аллаха подобающим стыдом.', tr:'Allah\'tan hakkıyla haya edin.', source:'Tirmizi 2458' },
  { ar:'إِنَّ اللَّهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلاً أَنْ يُتْقِنَهُ', az:'Allah sizdən birinin bir iş gördüyündə onu yaxşı etməsini sevir.', en:'Allah loves that when one of you does a job, he does it with excellence.', ru:'Аллах любит, когда кто-то из вас делает дело, делать его наилучшим образом.', tr:'Allah sizden birinin bir iş yaptığında onu güzel yapmasını sever.', source:'Beyhəqi' },
  { ar:'الْحَيَاءُ مِنَ الإِيمَانِ', az:'Həya imandandır.', en:'Modesty is part of faith.', ru:'Стыдливость — часть веры.', tr:'Haya imandandır.', source:'Buxari 9' },
  { ar:'الْيَدُ الْعُلْيَا خَيْرٌ مِنَ الْيَدِ السُّفْلَى', az:'Üst əl alt əldən xeyirlidir.', en:'The upper hand is better than the lower hand.', ru:'Верхняя рука лучше нижней.', tr:'Veren el alan elden hayırlıdır.', source:'Buxari 1427' },
  { ar:'مَنْ غَشَّنَا فَلَيْسَ مِنَّا', az:'Bizi aldadan bizdən deyil.', en:'Whoever cheats us is not one of us.', ru:'Кто обманывает нас — не из нас.', tr:'Bizi aldatan bizden değildir.', source:'Muslim 101' },
  { ar:'خَيْرُكُمْ خَيْرُكُمْ لِأَهْلِهِ', az:'Ən xeyirliniz ailənizə ən yaxşı davrananınızdır.', en:'The best of you are those who are best to their families.', ru:'Лучшие из вас — лучшие к своим семьям.', tr:'En hayırlınız ailesine en hayırlı olanınızdır.', source:'Tirmizi 3895' },
  { ar:'اتَّقِ اللَّهَ وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا', az:'Allahdan qorx və pisliyin ardınca onu silən yaxşılıq et.', en:'Fear Allah and follow a bad deed with a good one to erase it.', ru:'Бойся Аллаха и за плохим делом совершай хорошее — оно сотрёт его.', tr:'Allah\'tan kork ve kötülüğün ardından onu silecek bir iyilik yap.', source:'Tirmizi 1987' },
  { ar:'إِنَّمَا الصَّبْرُ عِنْدَ الصَّدْمَةِ الأُولَى', az:'Əsl səbr ilk zərbə anındadır.', en:'True patience is at the first strike of calamity.', ru:'Истинное терпение — при первом ударе.', tr:'Gerçek sabır, ilk musibette gösterilendir.', source:'Buxari 1283' },
  { ar:'مَنْ كَظَمَ غَيْظاً وَهُوَ قَادِرٌ عَلَى أَنْ يُنْفِذَهُ دَعَاهُ اللَّهُ يَوْمَ الْقِيَامَةِ', az:'Kim qəzəbini udsa, halbuki onu çıxarmağa qadirdir, Allah onu qiyamət günü çağırar.', en:'Whoever suppresses anger when able to act upon it, Allah will call him on the Day of Judgment.', ru:'Кто сдержит гнев, хотя может его выплеснуть, того Аллах призовёт в День Суда.', tr:'Kim öfkesini yutarsa, halbuki onu çıkarmaya gücü yetiyorsa, Allah onu kıyamet günü çağırır.', source:'Tirmizi 2021' },
  { ar:'أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ', az:'Allaha ən sevimli əməl az olsa da davamlı olandır.', en:'The most beloved deeds to Allah are the most consistent, even if small.', ru:'Самые любимые Аллахом дела — постоянные, даже если малые.', tr:'Allah\'a en sevimli amel az da olsa devamlı olanıdır.', source:'Buxari 6464' },
  { ar:'الْمُؤْمِنُ القَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ المُؤْمِنِ الضَّعِيفِ', az:'Güclü mömin zəif mömindən Allaha daha sevimlidir.', en:'The strong believer is better and more beloved to Allah than the weak believer.', ru:'Сильный верующий лучше и любимее Аллахом, чем слабый.', tr:'Güçlü mümin, zayıf müminden Allah\'a daha hayırlı ve sevimlidir.', source:'Muslim 2664' },
  { ar:'مَنْ قَالَ سُبْحَانَ اللَّهِ وَبِحَمْدِهِ مِائَةَ مَرَّةٍ غُفِرَتْ ذُنُوبُهُ', az:'Kim "Sübhanəllahi və bihəmdih" deyərsə yüz dəfə, günahları bağışlanar.', en:'Whoever says "Glory and praise be to Allah" 100 times, his sins will be forgiven.', ru:'Кто скажет «Субханаллахи ва бихамдих» 100 раз, прощены будут его грехи.', tr:'Kim "Sübhanallahi ve bihamdihi" derse 100 kere, günahları bağışlanır.', source:'Buxari 6405' },
  { ar:'أَفْضَلُ الذِّكْرِ لاَ إِلَهَ إِلاَّ اللَّهُ', az:'Zikrin ən fəziləlisi "La ilahə illəllah"dır.', en:'The best remembrance is "There is no god but Allah".', ru:'Лучший зикр — «Нет бога, кроме Аллаха».', tr:'Zikrin en faziletlisi "La ilahe illallah"tır.', source:'Tirmizi 3383' },
  { ar:'مَنْ تَوَاضَعَ لِلَّهِ رَفَعَهُ اللَّهُ', az:'Kim Allah üçün təvazökar olarsa, Allah onu yüksəldər.', en:'Whoever humbles himself for Allah, Allah will elevate him.', ru:'Кто смирится ради Аллаха, того Аллах возвысит.', tr:'Kim Allah için alçakgönüllü olursa, Allah onu yükseltir.', source:'Muslim 2588' },
  { ar:'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي', az:'Allahım, Sən əfv edənsən, əfv etməyi sevirsən, məni əfv et.', en:'O Allah, You are Forgiving and love forgiveness, so forgive me.', ru:'О Аллах, Ты Прощающий и любишь прощение, прости меня.', tr:'Allah\'ım, Sen affedicisin, affetmeyi seversin, beni affet.', source:'Tirmizi 3513' },
  { ar:'الصَّلاَةُ عِمَادُ الدِّينِ', az:'Namaz dinin dirəyidir.', en:'Prayer is the pillar of the religion.', ru:'Молитва — опора религии.', tr:'Namaz dinin direğidir.', source:'Beyhəqi' },
  { ar:'الْجَنَّةُ تَحْتَ أَقْدَامِ الأُمَّهَاتِ', az:'Cənnət anaların ayaqları altındadır.', en:'Paradise lies beneath the feet of mothers.', ru:'Рай находится под ногами матерей.', tr:'Cennet annelerin ayakları altındadır.', source:'Nəsai 3104' },
  { ar:'خَيْرُ الكَلاَمِ مَا قَلَّ وَدَلَّ', az:'Sözün xeyirlisi az və mənalı olandır.', en:'The best speech is that which is brief and meaningful.', ru:'Лучшая речь — краткая и содержательная.', tr:'Sözün hayırlısı az ve öz olandır.', source:'Beyhəqi' },
  { ar:'اسْتَعِينُوا عَلَى قَضَاءِ حَوَائِجِكُمْ بِالْكِتْمَانِ', az:'Ehtiyaclarınızın yerinə yetirilməsi üçün gizli saxlamaqla kömək istəyin.', en:'Seek help in fulfilling your needs through secrecy.', ru:'Ищите помощи в исполнении нужд через скрытность.', tr:'İhtiyaçlarınızın karşılanmasında gizlilikle yardım isteyin.', source:'Taberani' },
  { ar:'إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ', az:'Həqiqətən, Allah yaxşılıq edənləri sevir.', en:'Indeed, Allah loves those who do good.', ru:'Поистине, Аллах любит тех, кто делает добро.', tr:'Şüphesiz Allah ihsan sahiplerini sever.', source:'Bəqərə 195' },
  { ar:'وَاصْبِرْ فَإِنَّ اللَّهَ لاَ يُضِيعُ أَجْرَ الْمُحْسِنِينَ', az:'Səbr et, çünki Allah yaxşılıq edənlərin mükafatını zay etməz.', en:'Be patient, for Allah does not let the reward of the righteous be lost.', ru:'Терпи, ибо Аллах не губит награду добродетельных.', tr:'Sabret, çünkü Allah muhsinlerin ecrini zayi etmez.', source:'Hud 115' },
  { ar:'وَلاَ تَيْأَسُوا مِنْ رَوْحِ اللَّهِ', az:'Allahın rəhmətindən ümidini kəsməyin.', en:'Do not despair of the mercy of Allah.', ru:'Не отчаивайтесь в милости Аллаха.', tr:'Allah\'ın rahmetinden ümit kesmeyin.', source:'Yusuf 87' },
  { ar:'وَقُلْ رَبِّ اغْفِرْ وَارْحَمْ وَأَنْتَ خَيْرُ الرَّاحِمِينَ', az:'De: Rəbbim, bağışla və rəhm et, Sən rəhm edənlərin ən xeyirlisisən.', en:'Say: My Lord, forgive and have mercy, You are the best of the merciful.', ru:'Скажи: Господи, прости и помилуй, Ты лучший из милосердных.', tr:'De ki: Rabbim, bağışla ve merhamet et, Sen merhametlilerin en hayırlısısın.', source:'Muminun 118' },
  { ar:'فَاذْكُرُونِي أَذْكُرْكُمْ', az:'Məni xatırlayın ki, Mən də sizi xatırlayım.', en:'Remember Me, and I will remember you.', ru:'Поминайте Меня, и Я буду поминать вас.', tr:'Beni anın ki, Ben de sizi anayım.', source:'Bəqərə 152' },
  { ar:'وَمَنْ يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ', az:'Kim Allaha təvəkkül etsə, O ona kifayətdir.', en:'Whoever puts his trust in Allah, He will be enough for him.', ru:'Кто уповает на Аллаха, тому Он достаточен.', tr:'Kim Allah\'a tevekkül ederse, O ona yeter.', source:'Talaq 3' },
  { ar:'ادْعُونِي أَسْتَجِبْ لَكُمْ', az:'Mənə dua edin, sizə cavab verim.', en:'Call upon Me, I will respond to you.', ru:'Взывайте ко Мне, Я отвечу вам.', tr:'Bana dua edin, size icabet edeyim.', source:'Ğafir 60' },
  { ar:'وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِلْمُؤْمِنِينَ', az:'Biz Qurandan möminlər üçün şəfa və rəhmət olan şeylər nazil edirik.', en:'We send down from the Quran that which is a healing and mercy for the believers.', ru:'Мы ниспосылаем из Корана то, что является исцелением и милостью для верующих.', tr:'Biz Kuran\'dan müminler için şifa ve rahmet olan şeyler indiriyoruz.', source:'İsra 82' },
  { ar:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', az:'Rəbbimiz, bizə dünyada da, axirətdə də gözəllik ver və bizi od əzabından qoru.', en:'Our Lord, give us good in this world and in the Hereafter, and protect us from the Fire.', ru:'Господь наш, даруй нам благо в этом мире и в будущем и защити нас от мучений Огня.', tr:'Rabbimiz, bize dünyada da ahirette de iyilik ver ve bizi ateş azabından koru.', source:'Bəqərə 201' },
  { ar:'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَى', az:'Rəbbin sənə verəcək və sən razı qalacaqsan.', en:'And your Lord will give you, and you will be satisfied.', ru:'И даст тебе Господь твой, и ты будешь доволен.', tr:'Rabbin sana verecek ve sen razı olacaksın.', source:'Duha 5' },
  { ar:'فَإِنَّ مَعَ الْعُسْرِ يُسْراً', az:'Həqiqətən, çətinliklə birlikdə asanlıq vardır.', en:'For indeed, with hardship will be ease.', ru:'Поистине, с трудностью — облегчение.', tr:'Şüphesiz zorlukla birlikte kolaylık vardır.', source:'İnşirah 5' },
  { ar:'وَاللَّهُ يُحِبُّ الصَّابِرِينَ', az:'Allah səbr edənləri sevir.', en:'And Allah loves the patient.', ru:'Аллах любит терпеливых.', tr:'Allah sabredenleri sever.', source:'Ali İmran 146' },
  { ar:'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', az:'Şübhəsiz, Allah səbr edənlərlədir.', en:'Indeed, Allah is with the patient.', ru:'Поистине, Аллах — с терпеливыми.', tr:'Şüphesiz Allah sabredenlerle beraberdir.', source:'Bəqərə 153' },
  { ar:'وَلاَ تَحْزَنْ إِنَّ اللَّهَ مَعَنَا', az:'Kədərlənmə, şübhəsiz Allah bizimlədir.', en:'Do not grieve, indeed Allah is with us.', ru:'Не печалься, поистине Аллах с нами.', tr:'Üzülme, şüphesiz Allah bizimledir.', source:'Tövbə 40' },
  { ar:'قُلْ لَنْ يُصِيبَنَا إِلاَّ مَا كَتَبَ اللَّهُ لَنَا', az:'De: Allahın bizə yazdığından başqa heç nə başımıza gəlməz.', en:'Say: Nothing will befall us except what Allah has decreed for us.', ru:'Скажи: Нас постигнет лишь то, что предписал нам Аллах.', tr:'De ki: Allah\'ın bizim için yazdığından başka bize bir şey isabet etmez.', source:'Tövbə 51' },
  { ar:'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ', az:'Qullarım Məni soruşanda, Mən yaxınam.', en:'When My servants ask about Me, indeed I am near.', ru:'Когда рабы Мои спросят обо Мне — Я близок.', tr:'Kullarım Beni sorduğunda, şüphesiz Ben yakınım.', source:'Bəqərə 186' },
  { ar:'وَهُوَ مَعَكُمْ أَيْنَ مَا كُنْتُمْ', az:'Harada olsanız, O sizinlədir.', en:'And He is with you wherever you are.', ru:'И Он с вами, где бы вы ни были.', tr:'Nerede olursanız olun, O sizinledir.', source:'Hədid 4' },
  { ar:'فَبِأَيِّ آلاَءِ رَبِّكُمَا تُكَذِّبَانِ', az:'Rəbbinizin nemətlərindən hansını yalan sayırsınız?', en:'So which of the favors of your Lord would you deny?', ru:'Какую же из милостей Господа вы отвергнете?', tr:'Rabbinizin nimetlerinden hangisini yalanlarsınız?', source:'Rəhman 13' },
  { ar:'وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِنْ مُدَّكِرٍ', az:'Biz Quranı zikr üçün asanlaşdırdıq, amma düşünən varmı?', en:'We have made the Quran easy for remembrance, so is there anyone who will remember?', ru:'Мы облегчили Коран для поминания, но есть ли поминающий?', tr:'Biz Kuran\'ı zikir için kolaylaştırdık, düşünen var mı?', source:'Qəmər 17' },
  { ar:'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ', az:'Biz Allaha aidik və Ona dönəcəyik.', en:'Indeed, we belong to Allah and to Him we shall return.', ru:'Поистине, мы принадлежим Аллаху и к Нему возвращаемся.', tr:'Şüphesiz biz Allah\'a aidiz ve O\'na döneceğiz.', source:'Bəqərə 156' },
  { ar:'لاَ إِكْرَاهَ فِي الدِّينِ', az:'Dində məcburiyyət yoxdur.', en:'There is no compulsion in religion.', ru:'Нет принуждения в религии.', tr:'Dinde zorlama yoktur.', source:'Bəqərə 256' },
  { ar:'وَقُولُوا لِلنَّاسِ حُسْناً', az:'İnsanlara gözəl söz söyləyin.', en:'Speak to people in a good way.', ru:'Говорите людям хорошее.', tr:'İnsanlara güzel söz söyleyin.', source:'Bəqərə 83' },
  { ar:'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', az:'Allah bizə yetər, O nə gözəl vəkildir.', en:'Allah is sufficient for us, and He is the best Disposer of affairs.', ru:'Достаточно нам Аллаха, и прекрасен Он как Покровитель.', tr:'Allah bize yeter, O ne güzel vekildir.', source:'Ali İmran 173' },
  { ar:'الصَّبْرُ مِفْتَاحُ الفَرَجِ', az:'Səbr qurtuluşun açarıdır.', en:'Patience is the key to relief.', ru:'Терпение — ключ к избавлению.', tr:'Sabır, kurtuluşun anahtarıdır.', source:'Əhməd' },
  { ar:'إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعاً', az:'Həqiqətən, Allah bütün günahları bağışlayar.', en:'Indeed, Allah forgives all sins.', ru:'Поистине, Аллах прощает все грехи.', tr:'Şüphesiz Allah bütün günahları bağışlar.', source:'Zumər 53' },
  { ar:'وَمَنْ يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْراً يَرَهُ', az:'Kim zərrə qədər xeyir işləsə, onu görəcək.', en:'Whoever does an atom\'s weight of good will see it.', ru:'Кто сотворит добро весом в пылинку — увидит его.', tr:'Kim zerre miktarı hayır işlerse onu görür.', source:'Zilzal 7' },
  { ar:'وَاسْتَغْفِرُوا رَبَّكُمْ ثُمَّ تُوبُوا إِلَيْهِ', az:'Rəbbinizdən bağışlanma diləyin, sonra Ona tövbə edin.', en:'Seek forgiveness from your Lord and repent to Him.', ru:'Просите прощения у Господа, затем покайтесь перед Ним.', tr:'Rabbinizden bağışlanma dileyin, sonra O\'na tövbe edin.', source:'Hud 3' },
  { ar:'أَلاَ إِنَّ نَصْرَ اللَّهِ قَرِيبٌ', az:'Bilin ki, Allahın köməyi yaxındır.', en:'Indeed, the help of Allah is near.', ru:'Поистине, помощь Аллаха близка.', tr:'Bilin ki Allah\'ın yardımı yakındır.', source:'Bəqərə 214' },
  { ar:'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي', az:'Rəbbim, köksümü aç və işimi asanlaşdır.', en:'My Lord, expand my chest and ease my task.', ru:'Господи, раскрой мне грудь и облегчи мне дело.', tr:'Rabbim, göğsümü aç ve işimi kolaylaştır.', source:'Taha 25-26' },
  { ar:'وَعَسَى أَنْ تَكْرَهُوا شَيْئاً وَهُوَ خَيْرٌ لَكُمْ', az:'Ola bilsin ki, xoşlamadığınız bir şey sizin üçün xeyirlidir.', en:'Perhaps you dislike something and it is good for you.', ru:'Может быть, вам не нравится что-то, а оно для вас благо.', tr:'Belki hoşlanmadığınız bir şey sizin için hayırlıdır.', source:'Bəqərə 216' },
  { ar:'رَبَّنَا لاَ تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا', az:'Rəbbimiz, bizi hidayət etdikdən sonra qəlbimizi əyriləşdirmə.', en:'Our Lord, do not let our hearts deviate after You have guided us.', ru:'Господи, не отклоняй наши сердца после того, как наставил нас.', tr:'Rabbimiz, bizi hidayete erdirdikten sonra kalplerimizi eğriltme.', source:'Ali İmran 8' },
  { ar:'وَاللَّهُ غَفُورٌ رَحِيمٌ', az:'Allah bağışlayandır, rəhm edəndir.', en:'And Allah is Forgiving, Merciful.', ru:'Аллах — Прощающий, Милосердный.', tr:'Allah bağışlayandır, merhamet edendir.', source:'Bəqərə 218' },
  { ar:'رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَإِسْرَافَنَا فِي أَمْرِنَا', az:'Rəbbimiz, günahlarımızı və işlərimizdəki israfımızı bağışla.', en:'Our Lord, forgive us our sins and our excesses in our affairs.', ru:'Господи, прости нам грехи наши и чрезмерность в делах.', tr:'Rabbimiz, günahlarımızı ve işlerimizdeki israfımızı bağışla.', source:'Ali İmran 147' },
  { ar:'إِنَّ خَيْرَ مَنِ اسْتَأْجَرْتَ الْقَوِيُّ الأَمِينُ', az:'İşə götürəcəyin ən xeyirlisi güclü və etibarlı olandır.', en:'The best person you can hire is the strong and trustworthy.', ru:'Лучший из тех, кого нанимаешь — сильный и надёжный.', tr:'İşe alacağın en hayırlısı güçlü ve güvenilir olandır.', source:'Qəsəs 26' },
  { ar:'وَلاَ تَمْشِ فِي الأَرْضِ مَرَحاً', az:'Yer üzündə lovğa-lovğa gəzmə.', en:'Do not walk on the earth with arrogance.', ru:'Не ходи по земле горделиво.', tr:'Yeryüzünde böbürlenerek yürüme.', source:'İsra 37' },
  { ar:'مَنْ عَمِلَ صَالِحاً فَلِنَفْسِهِ', az:'Kim yaxşı iş görərsə, öz xeyrinədir.', en:'Whoever does good, it is for his own soul.', ru:'Кто творит добро — для самого себя.', tr:'Kim salih amel işlerse kendi lehinedir.', source:'Fussilət 46' },
  { ar:'وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَى', az:'Yaxşılıq və təqvada bir-birinizə kömək edin.', en:'Cooperate in righteousness and piety.', ru:'Помогайте друг другу в благочестии и богобоязненности.', tr:'İyilik ve takvada yardımlaşın.', source:'Maidə 2' },
  { ar:'إِنَّ أَكْرَمَكُمْ عِنْدَ اللَّهِ أَتْقَاكُمْ', az:'Allah yanında ən hörmətliniz ən təqvalınızdır.', en:'The most honored of you with Allah is the most righteous.', ru:'Самый почитаемый из вас у Аллаха — самый богобоязненный.', tr:'Allah katında en değerliniz en takvalı olanınızdır.', source:'Hücurat 13' },
  { ar:'يَا أَيُّهَا الَّذِينَ آمَنُوا اصْبِرُوا وَصَابِرُوا وَرَابِطُوا', az:'Ey iman edənlər, səbr edin, səbrdə yarışın və hazır olun.', en:'O you who believe, be patient, endure, and remain steadfast.', ru:'О верующие, терпите, будьте стойки и будьте готовы.', tr:'Ey iman edenler, sabredin, sabırda yarışın ve hazırlıklı olun.', source:'Ali İmran 200' },
  { ar:'الْخَلْقُ كُلُّهُمْ عِيَالُ اللَّهِ فَأَحَبُّهُمْ إِلَى اللَّهِ أَنْفَعُهُمْ لِعِيَالِهِ', az:'Bütün məxluqat Allahın qullarıdır, Allaha ən sevimli olanı qullarına ən faydalı olandır.', en:'All creation are dependents of Allah; the most beloved to Allah are those most helpful to His dependents.', ru:'Все создания — иждивенцы Аллаха; любимейший из них — наиболее полезный для них.', tr:'Bütün yaratıklar Allah\'ın iyalidir; Allah\'a en sevimli olanı iyaline en faydalı olanıdır.', source:'Beyhəqi' },
  { ar:'إِنَّ اللَّهَ كَتَبَ الإِحْسَانَ عَلَى كُلِّ شَيْءٍ', az:'Allah hər şeydə ehsanı (yaxşılığı) fərz buyurmuşdur.', en:'Allah has prescribed excellence in all things.', ru:'Аллах предписал совершенство во всём.', tr:'Allah her şeyde ihsanı farz kılmıştır.', source:'Muslim 1955' },
  { ar:'لاَ تُقَدِّمُوا بَيْنَ يَدَيِ اللَّهِ وَرَسُولِهِ', az:'Allahın və Rəsulunun önünə keçməyin.', en:'Do not put yourselves before Allah and His Messenger.', ru:'Не опережайте Аллаха и Его Посланника.', tr:'Allah\'ın ve Resulünün önüne geçmeyin.', source:'Hücurat 1' },
  { ar:'وَأَقِيمُوا الصَّلاَةَ وَآتُوا الزَّكَاةَ', az:'Namazı qılın və zəkatı verin.', en:'Establish prayer and give charity.', ru:'Совершайте молитву и выплачивайте закят.', tr:'Namazı kılın ve zekatı verin.', source:'Bəqərə 43' },
  { ar:'يَا أَيُّهَا الَّذِينَ آمَنُوا اذْكُرُوا اللَّهَ ذِكْراً كَثِيراً', az:'Ey iman edənlər, Allahı çox zikr edin.', en:'O you who believe, remember Allah with much remembrance.', ru:'О верующие, поминайте Аллаха многим поминанием.', tr:'Ey iman edenler, Allah\'ı çokça zikredin.', source:'Əhzab 41' },
]

const HERO_AYAHS = [
  { ar:'قُلْ هُوَ اللَّهُ أَحَدٌ', ref:{ az:'İxlas 1', en:'Al-Ikhlas 1', ru:'Аль-Ихлас 1', tr:'İhlas 1', ar:'الإخلاص 1' } },
  { ar:'اللَّهُ نُورُ السَّمَاوَاتِ وَالأَرْضِ', ref:{ az:'Nur 35', en:'An-Nur 35', ru:'Ан-Нур 35', tr:'Nur 35', ar:'النور 35' } },
  { ar:'وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ', ref:{ az:'Qaf 16', en:'Qaf 16', ru:'Каф 16', tr:'Kaf 16', ar:'ق 16' } },
]

export default function HomePage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang]?.home || T.az.home
  const lk = lang
  const L = obj => obj[lk] || obj.az || obj.en || ''

  const [visible, setVisible] = useState(false)
  const [prayerTimes, setPrayerTimes] = useState(null)
  const [curMin, setCurMin] = useState(nowMin())
  const [activeTW, setActiveTW] = useState(0)
  const [ticker, setTicker] = useState(0)
  const [dhikr, setDhikr] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const DHIKR_TARGET = 33
  const dailyHadith = DAILY_HADITHS[Math.floor(Date.now() / 86400000) % DAILY_HADITHS.length]

  const [heroRef, heroIn] = useInView(0.05)
  const [twRef, twIn] = useInView(0.08)
  const [namesRef, namesIn] = useInView(0.08)
  const [hadithRef, hadithIn] = useInView(0.08)

  useEffect(()=>{ setTimeout(()=>setVisible(true),80) },[])
  useEffect(()=>{ const id=setInterval(()=>setCurMin(nowMin()),30000); return()=>clearInterval(id) },[])
  useEffect(()=>{ const id=setInterval(()=>setTicker(p=>p+1),5000); return()=>clearInterval(id) },[])

  useEffect(() => {
    const today = new Date().toDateString()
    const lastShown = localStorage.getItem('hadith_toast_date')
    if (lastShown !== today) {
      const timer = setTimeout(() => {
        setShowToast(true)
        localStorage.setItem('hadith_toast_date', today)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 15000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  useEffect(()=>{
    // Əvvəlcə PrayerPage cache-indən oxu
    try {
      const cached = JSON.parse(localStorage.getItem('cached_prayer_times'))
      if (cached?.Fajr) { setPrayerTimes(cached); return }
    } catch {}
    // Cache yoxdursa API çağır (eyni method=13)
    const go=(lat,lon)=>{
      const ts = Math.floor(Date.now()/1000)
      fetch(`https://api.aladhan.com/v1/timings/${ts}?latitude=${lat}&longitude=${lon}&method=13`)
        .then(r=>r.json()).then(x=>{ const s=x.data?.timings; if(s) setPrayerTimes({Fajr:s.Fajr,Dhuhr:s.Dhuhr,Asr:s.Asr,Maghrib:s.Maghrib,Isha:s.Isha}) }).catch(()=>{})
    }
    navigator.geolocation ? navigator.geolocation.getCurrentPosition(p=>go(p.coords.latitude,p.coords.longitude),()=>go(40.4093,49.8671)) : go(40.4093,49.8671)
  },[])

  const goTo = p => { setPage(p); window.scrollTo({top:0,behavior:'smooth'}) }

  const prayers = (() => {
    const times = prayerTimes || FB
    let nf = false
    const list = PRAYER_KEYS.map(k=>{
      const raw=(times[k]||FB[k]).slice(0,5)
      const done=toMin(raw)<curMin
      const active=!done&&!nf
      if(active) nf=true
      return { name:PRAYER_NAMES[k][lk]||PRAYER_NAMES[k].en, time:raw, done, active }
    })
    if(!nf) list[0]={...list[0],done:false,active:true}
    return list
  })()

  const activePrayer = prayers.find(p=>p.active)
  const currentAyah = HERO_AYAHS[ticker % HERO_AYAHS.length]
  const twPillar = TAWHEED_PILLARS[activeTW]

  const features = [
    {icon:'📖',title:t.feature1Title||'Quran',         desc:t.feature1Desc||'114 surə, 6236 ayə',  page:'quran',  clr:'#10b981'},
    {icon:'🕌',title:t.feature2Title||'Namaz Vaxtları',desc:t.feature2Desc||'Canlı vaxtlar',       page:'prayer', clr:'#f59e0b'},
    {icon:'📚',title:t.feature3Title||'Hədislər',       desc:t.feature3Desc||'650+ səhih hədis',   page:'hadith', clr:'#8b5cf6'},
    {icon:'🤲',title:t.feature4Title||'Dualar',          desc:t.feature4Desc||'Tövsiyə edilmiş dualar',page:'duas',clr:'#3b82f6'},
    {icon:'⭐',title:t.feature5Title||'99 Ad',           desc:t.feature5Desc||"Allahın 99 adı",    page:'names',  clr:'#ec4899'},
    {icon:'💰',title:t.feature6Title||'Zəkat',           desc:t.feature6Desc||'Zəkat hesabla',     page:'zakat',  clr:'#ef4444'},
    {icon:'🧭',title:lk==='az'?'Qibla':lk==='ru'?'Кибла':lk==='ar'?'القبلة':lk==='tr'?'Kıble':'Qibla',
               desc:lk==='az'?'Qiblə istiqaməti':lk==='ru'?'Направление':lk==='ar'?'اتجاه القبلة':lk==='tr'?'Kıble yönü':'Direction', page:'qibla', clr:'#14b8a6'},
    {icon:'📿',title:lk==='az'?'Zikr Sayğacı':lk==='ru'?'Счётчик зикра':lk==='ar'?'عداد الذكر':lk==='tr'?'Zikir Sayacı':'Dhikr Counter',
               desc:lk==='az'?'Subhanallah, Alhamdulillah...':'SubhanAllah, Alhamdulillah...', page:'duas', clr:'#a855f7'},
  ]

  const stats=[
    {num:114,  s:'',  l:{az:'Quran Surəsi',  en:'Quran Surahs',   ru:'Сур Корана',    tr:'Sure',         ar:'سورة'}},
    {num:6236, s:'',  l:{az:'Quran Ayəsi',   en:'Quran Verses',   ru:'Аятов Корана',  tr:'Ayet',         ar:'آية'}},
    {num:2000, s:'+', l:{az:'Səhih Hədis',   en:'Hadiths',        ru:'Хадисов',       tr:'Hadis',        ar:'حديث'}},
    {num:99,   s:'',  l:{az:"Allahın Adı",   en:"Names of Allah", ru:'Имён Аллаха',   tr:"Allah'ın İsmi",ar:'اسم لله'}},
    {num:5,    s:'',  l:{az:'Dil',            en:'Languages',      ru:'Языков',        tr:'Dil',          ar:'لغات'}},
    {num:100,  s:'%', l:{az:'Pulsuz',         en:'Free',           ru:'Бесплатно',     tr:'Ücretsiz',     ar:'مجاناً'}},
  ]

  const testimonials=[
    {t:{az:'Bu platforma həyatımı dəyişdi. Tövhid bölməsi xüsusilə faydalıdır. Allah razı olsun!',en:'This platform changed my life. The Tawheed section is especially helpful. JazakAllah!',ru:'Эта платформа изменила мою жизнь. Раздел Таухид особенно полезен. Джазакаллах!',tr:'Bu platform hayatımı değiştirdi. Tevhid bölümü özellikle faydalıdır.',ar:'غيّرت هذه المنصة حياتي. قسم التوحيد مفيد جداً. جزاكم الله خيراً.'},name:'Aytən M.',loc:'Bakı'},
    {t:{az:'Namaz vaxtları, zəkat, 99 ad — hər şey bir yerdə. Müstəsna tətbiq!',en:'Prayer times, zakat, 99 names — everything in one place. Exceptional app!',ru:'Время намаза, закят, 99 имён — всё в одном месте. Исключительное приложение!',tr:'Namaz vakitleri, zekat, 99 isim — hepsi bir arada. Olağanüstü uygulama!',ar:'أوقات الصلاة والزكاة والأسماء الحسنى — كل شيء في مكان. تطبيق استثنائي!'},name:'Rauf K.',loc:'Gəncə'},
    {t:{az:'Qiblə tərəfini bir kliklə tapıram. Hədis kolleksiyası isə çox zəngindir.',en:'I find qibla direction in one click. The hadith collection is very rich.',ru:'Нахожу направление Киблы одним кликом. Коллекция хадисов очень богатая.',tr:'Kıble yönünü tek tıkla buluyorum. Hadis koleksiyonu çok zengin.',ar:'أجد اتجاه القبلة بنقرة واحدة. مجموعة الأحاديث ثرية جداً.'},name:'Kamran B.',loc:'Sumqayıt'},
    {t:{az:'99 Allahın adını öyrəndim, Quran oxudum, namazlarımı vaxtında qıldım.',en:'I learned the 99 names, read Quran, and prayed on time — all thanks to this app.',ru:'Выучил 99 имён, читал Коран, молился вовремя — всё благодаря этому приложению.',tr:'99 ismi öğrendim, Kuran okudum, namazlarımı vaktinde kıldım.',ar:'تعلمت الأسماء الحسنى وقرأت القرآن وصليت في وقتها.'},name:'Leyla Ə.',loc:'Şirvan'},
    {t:{az:'Tövhid haqqında bu qədər ətraflı məlumatı başqa heç yerdə tapmadım.',en:'I haven\'t found this much detail on Tawheed anywhere else.',ru:'Такого подробного материала о Таухиде я нигде больше не нашёл.',tr:'Tevhid hakkında bu kadar ayrıntılı bilgiyi başka hiçbir yerde bulamadım.',ar:'لم أجد هذا القدر من التفصيل حول التوحيد في أي مكان آخر.'},name:'Murad H.',loc:'Lənkəran'},
    {t:{az:'Hər gün günün hədisini oxuyuram. Çox maarifləndiricidir. Cəzakallah!',en:'I read the hadith of the day every day. Very enlightening. JazakAllah!',ru:'Каждый день читаю хадис дня. Очень познавательно. Джазакаллах!',tr:'Her gün günün hadisini okuyorum. Çok aydınlatıcı. Cezakallah!',ar:'أقرأ حديث اليوم كل يوم. مفيد ومنير جداً. جزاكم الله خيراً!'},name:'Farid İ.',loc:'Bakı'},
  ]

  return (
    <div className="hp-root">

      {/* ═══ HERO ═══════════════════════════════════════════════════════ */}
      <section className={`hp-hero ${visible?'hp-hero--vis':''}`} ref={heroRef}>
        <div className="hp-hero-bg">
          <div className="hp-hero-mesh" />
          {[...Array(6)].map((_,i)=><div key={i} className={`hp-geo hp-geo-${i+1}`}/>)}
          <div className="hp-hero-glow hp-glow-1" />
          <div className="hp-hero-glow hp-glow-2" />
          <div className="hp-hero-glow hp-glow-3" />
        </div>

        <div className="hp-hero-inner">
          <div className="hp-hero-content">
            <div className="hp-badge">
              <span className="hp-badge-pulse"/>
              <span>☪️</span>
              <span>{lk==='az'?'İslami Həyat Platforması':lk==='ru'?'Исламская платформа':lk==='ar'?'منصة حياة إسلامية':lk==='tr'?'İslami Yaşam Platforması':'Islamic Life Platform'}</span>
            </div>

            <h1 className="hp-hero-title">
              <span className="hp-ht-1">{lk==='az'?'Allaha Yaxın':lk==='ru'?'Близко к Аллаху':lk==='ar'?'قريباً من الله':lk==='tr'?"Allah'a Yakın":'Close to Allah'}</span>
              <span className="hp-ht-2">{lk==='az'?'Ol':lk==='ru'?'Будь':lk==='ar'?'كن':lk==='tr'?'Ol':'Be'}</span>
            </h1>

            <p className="hp-hero-sub">
              {lk==='az'?'Tövhid əsasında qurulan İslami platforma. Quran, namaz, hədis, dua, zəkat, qiblə — hamısı bir yerdə.':
               lk==='ru'?'Исламская платформа на основе Таухида. Коран, намаз, хадисы, дуа, закят, кибла — всё в одном месте.':
               lk==='ar'?'منصة إسلامية قائمة على التوحيد. القرآن والصلاة والحديث والدعاء والزكاة والقبلة — كل ذلك في مكان واحد.':
               lk==='tr'?'Tevhid temeli üzerine kurulu İslami platform. Kuran, namaz, hadis, dua, zekat, kıble — hepsi bir arada.':
               'An Islamic platform built on Tawheed. Quran, prayer, hadith, dua, zakat, qibla — all in one place.'}
            </p>

            <div className="hp-hero-ayah">
              <div className="hp-ha-ar">{currentAyah.ar}</div>
              <div className="hp-ha-ref">{L(currentAyah.ref)}</div>
            </div>

            <div className="hp-hero-btns">
              <button className="hp-btn-primary" onClick={()=>goTo('quran')}>📖 {lk==='az'?'Quran':lk==='ru'?'Коран':lk==='ar'?'القرآن':lk==='tr'?'Kuran':'Quran'}</button>
              <button className="hp-btn-sec" onClick={()=>goTo('prayer')}>🕌 {lk==='az'?'Namaz':lk==='ru'?'Намаз':lk==='ar'?'الصلاة':lk==='tr'?'Namaz':'Prayer'}</button>
              <button className="hp-btn-sec" onClick={()=>goTo('hadith')}>📚 {lk==='az'?'Hədislər':lk==='ru'?'Хадисы':lk==='ar'?'الحديث':lk==='tr'?'Hadisler':'Hadiths'}</button>
            </div>

            <div className="hp-hero-qs">
              {[{n:'650+',l:{az:'Hədis',en:'Hadiths',ru:'Хадисов',tr:'Hadis',ar:'حديث'}},
                {n:'6236',l:{az:'Ayə',en:'Verses',ru:'Аятов',tr:'Ayet',ar:'آية'}},
                {n:'99',  l:{az:"Allahın Adı",en:'Names',ru:'Имён',tr:'İsim',ar:'اسم'}},
                {n:'5',   l:{az:'Dil',en:'Langs',ru:'Языков',tr:'Dil',ar:'لغات'}},
              ].map((q,i)=>(
                <div key={i} className="hp-qs-item">
                  <strong>{q.n}</strong><span>{L(q.l)}</span>
                  {i<3 && <div className="hp-qs-div"/>}
                </div>
              ))}
            </div>
          </div>

          <div className="hp-hero-visual">
            {/* Prayer card */}
            <div className="hp-pc">
              <div className="hp-pc-hdr">
                <div className="hp-pc-hdr-l">
                  <span>🕌</span>
                  <div>
                    <strong>{lk==='az'?'Namaz Vaxtları':lk==='ru'?'Намаз':lk==='ar'?'مواقيت الصلاة':lk==='tr'?'Namaz Vakitleri':'Prayer Times'}</strong>
                    <small>{prayerTimes?(lk==='az'?'Canlı ✓':'Live ✓'):(lk==='az'?'Standart':'Default')}</small>
                  </div>
                </div>
                {activePrayer && <div className="hp-pc-next">{activePrayer.name} ⏱</div>}
              </div>
              {prayers.map((p,i)=>(
                <div key={i} className={`hp-pr ${p.done?'hp-pr--done':''} ${p.active?'hp-pr--act':''}`}>
                  <span className={`hp-pr-dot ${p.done?'done':p.active?'act':''}`}/>
                  <span className="hp-pr-nm">{p.name}</span>
                  <span className="hp-pr-tm">{p.time}</span>
                  {p.active && <span className="hp-pr-badge">{lk==='az'?'Növbəti':lk==='ru'?'След.':lk==='ar'?'التالي':lk==='tr'?'Sonraki':'Next'}</span>}
                  {p.done && <span className="hp-pr-chk">✓</span>}
                </div>
              ))}
              <button className="hp-pc-more" onClick={()=>goTo('prayer')}>
                {lk==='az'?'Bütün vaxtlar →':lk==='ru'?'Все времена →':lk==='ar'?'جميع الأوقات →':lk==='tr'?'Tümü →':'Full schedule →'}
              </button>
            </div>

            {/* Dhikr counter */}
            <div className="hp-fl hp-fl--dhikr" onClick={()=>setDhikr(c=>c<DHIKR_TARGET?c+1:0)}>
              <div className="hp-dhikr-ring">
                <svg viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4"/>
                  <circle cx="28" cy="28" r="24" fill="none" stroke="#10b981" strokeWidth="4"
                    strokeDasharray={`${(dhikr/DHIKR_TARGET)*150.8} 150.8`}
                    strokeLinecap="round" transform="rotate(-90 28 28)"
                    style={{transition:'stroke-dasharray .3s'}}/>
                </svg>
                <span>{dhikr}</span>
              </div>
              <div><strong>سُبْحَانَ اللَّه</strong><small>{dhikr}/{DHIKR_TARGET}</small></div>
            </div>

            {/* Tawheed badge */}
            <div className="hp-fl hp-fl--tw">
              <div className="hp-fl-tw-ar">لَا إِلَهَ إِلَّا اللَّهُ</div>
              <div className="hp-fl-tw-tr">{lk==='az'?'Tövhid':lk==='ru'?'Таухид':lk==='ar'?'التوحيد':lk==='tr'?'Tevhid':'Tawheed'}</div>
            </div>
          </div>
        </div>

        <div className="hp-scroll">
          <div className="hp-scroll-m"><div className="hp-scroll-w"/></div>
        </div>
      </section>

      {/* ═══ BISMILLAH ══════════════════════════════════════════════════ */}
      <div className="hp-bism">
        <span className="hp-bism-ar">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</span>
        <span className="hp-bism-tr">
          {lk==='az'?'Rəhman və Rəhim olan Allahın adı ilə':lk==='ru'?'Во имя Аллаха, Милостивого, Милосердного':lk==='ar'?'بسم الله الرحمن الرحيم':lk==='tr'?"Rahmân ve Rahîm olan Allah'ın adıyla":'In the Name of Allah, the Most Gracious, the Most Merciful'}
        </span>
      </div>

      {/* ═══ STATS ══════════════════════════════════════════════════════ */}
      <section className="hp-stats">
        <div className="hp-stats-in">
          {stats.map((s,i)=>(
            <div key={i} className="hp-stat" style={{animationDelay:`${i*80}ms`}}>
              <div className="hp-stat-n"><CountUp end={s.num}/>{s.s}</div>
              <div className="hp-stat-l">{L(s.l)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TAWHEED ════════════════════════════════════════════════════ */}
      <section className="hp-tw" ref={twRef}>
        <div className="hp-tw-bg"><div className="hp-tw-bg-geo"/><div className="hp-tw-bg-glow"/></div>
        <div className="hp-sec-in">

          <div className={`hp-sec-hd ${twIn?'iv':''}`}>
            <div className="hp-ey hp-ey--gold"><span>☝️</span>{lk==='az'?'İslamın Əsası':lk==='ru'?'Основа ислама':lk==='ar'?'أساس الإسلام':lk==='tr'?'İslam\'ın Temeli':'Foundation of Islam'}</div>
            <h2 className="hp-sec-ttl hp-tw-ttl">
              {lk==='az'?'Tövhid — Allahın Birliyi':lk==='ru'?'Таухид — Единство Аллаха':lk==='ar'?'التوحيد — وحدانية الله':lk==='tr'?'Tevhid — Allah\'ın Birliği':'Tawheed — The Oneness of Allah'}
            </h2>
            <p className="hp-sec-sub">
              {lk==='az'?'Tövhid İslamın qəlbi və əsasıdır. O, Allahın yalnız bir olduğunu, heç bir şərikin, mislin, nəzirin olmadığını elan edir. Bütün peyğəmbərlər bu dəvətlə gəlmişdir.':
               lk==='ru'?'Таухид — сердце и основа ислама. Он утверждает, что Аллах один, без сотоварищей, подобных или равных. Все пророки пришли с этим призывом.':
               lk==='ar'?'التوحيد هو قلب الإسلام وأساسه. يُعلن أن الله واحد لا شريك له ولا مثيل ولا نظير. جاء بهذه الدعوة جميع الأنبياء والمرسلون.':
               lk==='tr'?'Tevhid İslam\'ın kalbi ve temelidir. Allah\'ın tek olduğunu, ortağı, benzeri ve dengi olmadığını ilan eder. Tüm peygamberler bu çağrıyla geldi.':
               'Tawheed is the heart and foundation of Islam. It proclaims that Allah is One — without partners, equals, or rivals. All prophets came with this call.'}
            </p>
          </div>

          {/* Kalima */}
          <div className={`hp-kalima ${twIn?'iv':''}`}>
            <div className="hp-kal-ar">لَا إِلَهَ إِلَّا اللَّهُ مُحَمَّدٌ رَسُولُ اللَّهِ</div>
            <div className="hp-kal-tr">
              {lk==='az'?'"Allahdan başqa ilah yoxdur, Məhəmməd Allahın elçisidir"':
               lk==='ru'?'"Нет бога, кроме Аллаха; Мухаммад — Посланник Аллаха"':
               lk==='ar'?'"لا إله إلا الله محمد رسول الله"':
               lk==='tr'?'"Allah\'tan başka ilah yoktur; Muhammed Allah\'ın elçisidir"':
               '"There is no god but Allah; Muhammad is the Messenger of Allah"'}
            </div>
            <div className="hp-kal-glow"/>
          </div>

          {/* Three pillars — tabs */}
          <div className={`hp-tw-tabs ${twIn?'iv':''}`}>
            {TAWHEED_PILLARS.map((p,i)=>(
              <button key={i} className={`hp-tw-tab ${activeTW===i?'hp-tw-tab--on':''}`}
                onClick={()=>setActiveTW(i)} style={{'--clr':p.color}}>
                <span className="hp-twtab-num">{i+1}</span>
                <div className="hp-twtab-text">
                  <span className="hp-twtab-ar">{p.ar}</span>
                  <span className="hp-twtab-nm">{p[lk]||p.en}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Active pillar panel */}
          <div className="hp-tw-panel" style={{'--clr':twPillar.color}}>
            <div className="hp-twp-content">
              <div className="hp-twp-badge" style={{background:twPillar.color}}>
                {activeTW+1}
              </div>
              <h3 className="hp-twp-ar">{twPillar.ar}</h3>
              <h4 className="hp-twp-nm">{twPillar[lk]||twPillar.en}</h4>
              <p className="hp-twp-desc">{L(twPillar.desc)}</p>
              <div className="hp-twp-ayah">
                <div className="hp-twp-a-ar">{twPillar.ayah}</div>
                <div className="hp-twp-a-ref">— {L(twPillar.ayahRef)}</div>
              </div>
            </div>
          </div>

          {/* Facts */}
          <div className={`hp-tw-facts ${twIn?'iv':''}`}>
            {TAWHEED_FACTS.map((f,i)=>(
              <div key={i} className="hp-tw-fact" style={{animationDelay:`${i*100}ms`}}>
                <div className="hp-twf-ar">{f.ar}</div>
                <div className="hp-twf-tr">{L(f)}</div>
              </div>
            ))}
          </div>

          {/* Cards */}
          <div className={`hp-tw-info ${twIn?'iv':''}`}>
            <div className="hp-twi-card">
              <span className="hp-twi-ic">🌟</span>
              <h4>{lk==='az'?'Niyə Tövhid?':lk==='ru'?'Почему Таухид?':lk==='ar'?'لماذا التوحيد؟':lk==='tr'?'Neden Tevhid?':'Why Tawheed?'}</h4>
              <p>{lk==='az'?'Tövhid bütün peyğəmbərlərin — Nuh, İbrahim, Musa, İsa, Məhəmməd (s.ə.v.) — dəvət etdiyi əsas prinsipdir. Allah buyurur: "Biz hər ümmətə: Allaha ibadət edin, tağutdan çəkinin — deyə peyğəmbər göndərdik." (Nəhl 36)':
                  lk==='ru'?'Таухид — основной принцип, к которому призывали все пророки: Нух, Ибрахим, Муса, Иса, Мухаммад (мир им). Аллах говорит: "Мы отправили к каждому народу посланника с велением: поклоняйтесь Аллаху и избегайте тагута." (Нахль 36)':
                  lk==='ar'?'التوحيد هو المبدأ الأساسي الذي دعا إليه جميع الأنبياء — نوح وإبراهيم وموسى وعيسى ومحمد ﷺ. يقول الله: "وَلَقَدْ بَعَثْنَا فِي كُلِّ أُمَّةٍ رَّسُولًا أَنِ اعْبُدُوا اللَّهَ وَاجْتَنِبُوا الطَّاغُوتَ." (النحل 36)':
                  lk==='tr'?'Tevhid, tüm peygamberlerin — Nuh, İbrahim, Musa, İsa, Muhammed (s.a.v.) — davet ettiği temel ilkedir. Allah buyurur: "Her ümmete Allah\'a ibadet edin, tağuttan kaçının diye peygamber gönderdik." (Nahl 36)':
                  'Tawheed is the core principle all prophets called to — Noah, Abraham, Moses, Jesus, Muhammad (peace be upon them). Allah says: "We sent to every nation a messenger: worship Allah and avoid false deities." (An-Nahl 36)'}</p>
            </div>
            <div className="hp-twi-card">
              <span className="hp-twi-ic">⚠️</span>
              <h4>{lk==='az'?'Şirkdən Uzaq Ol':lk==='ru'?'Избегай ширка':lk==='ar'?'ابتعد عن الشرك':lk==='tr'?'Şirkten Uzak Dur':'Avoid Shirk'}</h4>
              <p>{lk==='az'?'Şirk — Allaha ortaq qoşmaqdır. Bu ən böyük günahdır. Allah buyurur: "Həqiqətən, Allah Özünə şərik qoşulmasını bağışlamaz, bundan başqasını istədiyinə bağışlar." (Nisa 48) Şirk ibadəti batil edir, bağışlanmaz.':
                  lk==='ru'?'Ширк — придание сотоварищей Аллаху. Это величайший грех. Аллах говорит: "Аллах не прощает придания Ему сотоварищей, но прощает всё остальное, кому пожелает." (Ниса 48) Ширк обнуляет поклонение и не прощается.':
                  lk==='ar'?'الشرك هو إشراك شيء مع الله. وهو أعظم الذنوب. قال الله تعالى: "إِنَّ اللَّهَ لَا يَغْفِرُ أَن يُشْرَكَ بِهِ وَيَغْفِرُ مَا دُونَ ذَٰلِكَ لِمَن يَشَاءُ." (النساء 48) الشرك يحبط العبادة ولا يُغفر.':
                  lk==='tr'?'Şirk, Allah\'a ortak koşmaktır. En büyük günahtır. Allah buyurur: "Allah kendisine şirk koşulmasını bağışlamaz; bunun dışındakini dilediği kimse için bağışlar." (Nisa 48) Şirk ibadeti iptal eder, affedilmez.':
                  'Shirk is associating partners with Allah — the greatest sin. Allah says: "Allah does not forgive that partners be associated with Him, but He forgives all else to whom He wills." (An-Nisa 48) Shirk nullifies worship and is unforgivable.'}</p>
            </div>
            <div className="hp-twi-card">
              <span className="hp-twi-ic">💎</span>
              <h4>{lk==='az'?'Tövhidin Meyvəsi':lk==='ru'?'Плоды Таухида':lk==='ar'?'ثمار التوحيد':lk==='tr'?'Tevhidin Meyvesi':'Fruits of Tawheed'}</h4>
              <p>{lk==='az'?'Tövhid qəlbə rahatlıq, həyata mənalılıq, günahlara kəffarə, cənnətə giriş açarı verir. Allah buyurur: "Elmlərini iman ilə qarışdırmayanlar — onlar üçün əmin-amanlıq vardır, haqq yola hidayət onlara məxsusdur." (Ənam 82)':
                  lk==='ru'?'Таухид дарует покой сердцу, смысл жизни, искупление грехов и ключ к раю. Аллах говорит: "Те, кто не смешивает своей веры с несправедливостью, — для них безопасность, и они на верном пути." (Аль-Анам 82)':
                  lk==='ar'?'التوحيد يمنح الطمأنينة للقلب والمعنى للحياة وكفارة للذنوب ومفتاحاً للجنة. قال الله: "الَّذِينَ آمَنُوا وَلَمْ يَلْبِسُوا إِيمَانَهُم بِظُلْمٍ أُولَٰئِكَ لَهُمُ الْأَمْنُ وَهُم مُّهْتَدُونَ." (الأنعام 82)':
                  lk==='tr'?'Tevhid kalbe huzur, hayata anlam, günahlara kefaret ve cennete giriş anahtarı verir. Allah buyurur: "İman edip imanlarını zulümle (şirk) karıştırmayanlar — güvende olanlar onlardır ve onlar doğru yoldadırlar." (En\'am 82)':
                  'Tawheed grants peace of heart, meaning in life, expiation of sins, and the key to Paradise. Allah says: "Those who believe and do not mix their faith with wrongdoing — for them is security, and they are rightly guided." (Al-An\'am 82)'}</p>
            </div>
          </div>

        </div>
      </section>

      {/* ═══ FEATURES ════════════════════════════════════════════════════ */}
      <section className="hp-feats">
        <div className="hp-sec-in">
          <div className="hp-sec-hd">
            <div className="hp-ey">🌟 Platform</div>
            <h2 className="hp-sec-ttl">{t.featTitle||'Xidmətlər'}</h2>
            <p className="hp-sec-sub">{t.featSub||'Bütün İslami ehtiyaclarınız bir platformada'}</p>
          </div>
          <div className="hp-feats-grid">
            {features.map((f,i)=>(
              <div key={i} className="hp-feat" onClick={()=>goTo(f.page)} style={{'--fc':f.clr,animationDelay:`${i*55}ms`}}>
                <div className="hp-feat-top">
                  <span className="hp-feat-ic">{f.icon}</span>
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <div className="hp-feat-go">{lk==='az'?'Keçid et':lk==='ru'?'Перейти':lk==='ar'?'انتقل':lk==='tr'?'Git':'Go'} →</div>
                <div className="hp-feat-bg">{f.icon}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 99 NAMES ════════════════════════════════════════════════════ */}
      <section className="hp-names" ref={namesRef}>
        <div className="hp-names-bg"/>
        <div className="hp-sec-in">
          <div className={`hp-sec-hd ${namesIn?'iv':''}`}>
            <div className="hp-ey hp-ey--purple">✨ أسماء الله الحسنى</div>
            <h2 className="hp-sec-ttl">{lk==='az'?"Allahın 99 Gözəl Adı":lk==='ru'?'99 Прекрасных Имён Аллаха':lk==='ar'?'أسماء الله الحسنى':lk==='tr'?"Allah'ın 99 Güzel İsmi":'99 Beautiful Names of Allah'}</h2>
            <p className="hp-sec-sub">
              {lk==='az'?'"Allahın doxsan doqquz adı var; kim onları saya bilsə, cənnətə girər." — (Buxari)':
               lk==='ru'?'"У Аллаха девяносто девять имён; кто их перечислит, войдёт в рай." — (Бухари)':
               lk==='ar'?'"إن لله تسعة وتسعين اسماً من أحصاها دخل الجنة." — (البخاري)':
               lk==='tr'?'"Allah\'ın doksan dokuz ismi vardır; bunları bilen cennete girer." — (Buhari)':
               '"Allah has ninety-nine names; whoever enumerates them will enter Paradise." — (Bukhari)'}
            </p>
          </div>
          <div className={`hp-names-grid ${namesIn?'iv':''}`}>
            {ALLAH_NAMES.map((n,i)=>(
              <div key={i} className="hp-name" style={{'--nc':n.color,animationDelay:`${i*40}ms`}}>
                <div className="hp-name-ar">{n.ar}</div>
                <div className="hp-name-az">{n[lk]||n.az}</div>
                <div className="hp-name-en">{n.en}</div>
              </div>
            ))}
          </div>
          <div className="hp-names-more">
            <button className="hp-btn-primary" onClick={()=>goTo('names')}>
              ✨ {lk==='az'?'Bütün 99 Adı Gör':lk==='ru'?'Все 99 имён':lk==='ar'?'عرض جميع الأسماء':lk==='tr'?'Tüm 99 İsmi Gör':'See All 99 Names'}
            </button>
          </div>
        </div>
      </section>

      {/* ═══ DAILY HADITH ════════════════════════════════════════════════ */}
      <section className="hp-hadith" ref={hadithRef}>
        <div className="hp-sec-in">
          <div className={`hp-hd-wrap ${hadithIn?'iv':''}`}>
            <div className="hp-hd-lbl">
              <span>📚</span>
              {lk==='az'?'Günün Hədisi':lk==='ru'?'Хадис дня':lk==='ar'?'حديث اليوم':lk==='tr'?'Günün Hadisi':'Hadith of the Day'}
            </div>
            <div className="hp-hd-card">
              <div className="hp-hd-q">❝</div>
              <div className="hp-hd-ar">{dailyHadith.ar}</div>
              <div className="hp-hd-txt">{L(dailyHadith)}</div>
              <div className="hp-hd-src">— {dailyHadith.source}</div>
            </div>
            <button className="hp-btn-out" onClick={()=>goTo('hadith')}>
              📚 {lk==='az'?'Daha Çox Hədis':lk==='ru'?'Больше хадисов':lk==='ar'?'المزيد من الأحاديث':lk==='tr'?'Daha Fazla Hadis':'More Hadiths'}
            </button>
          </div>
        </div>
      </section>

      {/* ═══ QURAN BANNER ════════════════════════════════════════════════ */}
      <section className="hp-qban">
        <div className="hp-qban-in">
          <div className="hp-qban-l">
            <div className="hp-qban-ar">إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ</div>
            <div className="hp-qban-tr">
              {lk==='az'?'"Biz Quranı Biz nazil etdik; onu Biz qoruyacağıq." — Hicr 9':
               lk==='ru'?'"Воистину, Мы ниспослали Коран и будем его оберегать." — Аль-Хиджр 9':
               lk==='ar'?'"إنا نحن نزلنا الذكر وإنا له لحافظون." — الحجر 9':
               lk==='tr'?'"Şüphesiz Kur\'an\'ı biz indirdik ve onu koruyacak olan da biziz." — Hicr 9':
               '"Indeed, it is We who revealed the Quran and indeed, We will be its Guardian." — Al-Hijr 9'}
            </div>
          </div>
          <div className="hp-qban-r">
            <div className="hp-qban-st">
              {[{n:'114',l:{az:'Surə',en:'Surahs',ru:'Сур',tr:'Sure',ar:'سورة'}},
                {n:'6236',l:{az:'Ayə',en:'Verses',ru:'Аятов',tr:'Ayet',ar:'آية'}},
                {n:'30',l:{az:'Cüz',en:'Juz',ru:'Джузов',tr:'Cüz',ar:'جزء'}},
              ].map((s,i)=><div key={i} className="hp-qban-s"><span>{s.n}</span>{L(s.l)}</div>)}
            </div>
            <button className="hp-btn-primary" onClick={()=>goTo('quran')}>
              📖 {lk==='az'?'Quran Oxu':lk==='ru'?'Читать Коран':lk==='ar'?'اقرأ القرآن':lk==='tr'?'Kuran Oku':'Read Quran'}
            </button>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ════════════════════════════════════════════════ */}
      <section className="hp-testi">
        <div className="hp-sec-in">
          <div className="hp-sec-hd">
            <div className="hp-ey">💬 {lk==='az'?'İstifadəçilər':lk==='ru'?'Пользователи':lk==='ar'?'المستخدمون':lk==='tr'?'Kullanıcılar':'Users'}</div>
            <h2 className="hp-sec-ttl">{lk==='az'?'İstifadəçilərimiz Nə Deyir':lk==='ru'?'Что говорят пользователи':lk==='ar'?'ماذا يقول مستخدمونا':lk==='tr'?'Kullanıcılarımız Ne Diyor':'What Our Users Say'}</h2>
          </div>
          <div className="hp-testi-grid">
            {testimonials.map((t2,i)=>(
              <div key={i} className="hp-testi-c" style={{animationDelay:`${i*70}ms`}}>
                <div className="hp-testi-stars">{'★'.repeat(5)}</div>
                <p>"{L(t2.t)}"</p>
                <div className="hp-testi-auth">
                  <div className="hp-testi-av">{t2.name[0]}</div>
                  <div><strong>{t2.name}</strong><small>{t2.loc}</small></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ══════════════════════════════════════════════════════════ */}
      <section className="hp-cta">
        <div className="hp-cta-bg">
          <div className="hp-cta-g1"/><div className="hp-cta-g2"/><div className="hp-cta-pat"/>
        </div>
        <div className="hp-cta-in">
          <div className="hp-cta-ar">اللَّهُ نُورُ السَّمَاوَاتِ وَالأَرْضِ</div>
          <h2>{t.ctaTitle||'Dini Həyatınızı Gücləndirin'}</h2>
          <p>{t.ctaDesc||'Hər gün Quran oxuyun, namazlarınızı vaxtında qılın, hədislərdən öyrənin. Allah yolunda daim irəliləyin.'}</p>
          <div className="hp-cta-btns">
            <button className="hp-btn-primary hp-cta-main" onClick={()=>goTo('quran')}>📖 {lk==='az'?'Qurana Başla':lk==='ru'?'Начать с Корана':lk==='ar'?'ابدأ بالقرآن':lk==='tr'?'Kuran\'la Başla':'Start with Quran'}</button>
            <button className="hp-btn-out" onClick={()=>goTo('hadith')}>📚 {lk==='az'?'Hədislər':lk==='ru'?'Хадисы':lk==='ar'?'الأحاديث':lk==='tr'?'Hadisler':'Hadiths'}</button>
          </div>
          <div className="hp-cta-trust">
            <span>🔒 {lk==='az'?'Reklamsız':lk==='ru'?'Без рекламы':lk==='ar'?'بدون إعلانات':lk==='tr'?'Reklamsız':'Ad-free'}</span>
            <span>✅ {lk==='az'?'100% Pulsuz':lk==='ru'?'100% Бесплатно':lk==='ar'?'100% مجاناً':lk==='tr'?'100% Ücretsiz':'100% Free'}</span>
            <span>🌍 {lk==='az'?'5 Dil':lk==='ru'?'5 языков':lk==='ar'?'5 لغات':lk==='tr'?'5 Dil':'5 Languages'}</span>
          </div>
        </div>
      </section>

      {showToast && (
        <div className="hp-toast">
          <div className="hp-toast-inner">
            <button className="hp-toast-close" onClick={() => setShowToast(false)}>✕</button>
            <div className="hp-toast-label">{lk==='az'?'Günün Hədisi':lk==='ru'?'Хадис дня':lk==='ar'?'حديث اليوم':lk==='tr'?'Günün Hadisi':'Hadith of the Day'}</div>
            <p className="hp-toast-arabic">{dailyHadith.ar}</p>
            <p className="hp-toast-text">{dailyHadith[lk] || dailyHadith.en}</p>
            <p className="hp-toast-source">— {dailyHadith.source}</p>
          </div>
        </div>
      )}

    </div>
  )
}