import { useState } from 'react'
import { useLang } from '../contexts/LangContext'
import '../styles/PrayerGuidePage.css'

const LABELS = {
  az: { title:'Namaz Öyrən', subtitle:'Addım-addım namaz qaydası', step:'Addım', prev:'Əvvəlki', next:'Növbəti', recite:'Oxu', meaning:'Mənası', times:'dəfə', selectPrayer:'Namaz seçin', fajr:'Sübh (2 rəkət)', dhuhr:'Zöhr (4 rəkət)', asr:'Əsr (4 rəkət)', maghrib:'Məğrib (3 rəkət)', isha:'İşa (4 rəkət)', complete:'Namaz tamamlandı!', restart:'Yenidən başla', wuduTitle:'Dəstəmaz Qaydası', wuduSubtitle:'Addım-addım dəstəmaz almaq', wuduComplete:'Dəstəmaz tamamlandı!', wuduDuaTitle:'Dəstəmazdan sonra dua', qunutTitle:'Qunut Duası', qunutSubtitle:'Vitr namazında oxunan qunut duası', qunutWhen:'Qunut nə vaxt oxunur?', qunutExplanation:'Qunut duası əsasən Vitr namazının son rəkətində rükudan əvvəl və ya sonra oxunur. Bəzi məzhəblərdə (Şafii) Sübh namazında da oxunur.' },
  en: { title:'Learn Prayer', subtitle:'Step-by-step prayer guide', step:'Step', prev:'Previous', next:'Next', recite:'Recite', meaning:'Meaning', times:'times', selectPrayer:'Select prayer', fajr:'Fajr (2 rakat)', dhuhr:'Dhuhr (4 rakat)', asr:'Asr (4 rakat)', maghrib:'Maghrib (3 rakat)', isha:'Isha (4 rakat)', complete:'Prayer completed!', restart:'Start again', wuduTitle:'Wudu Guide', wuduSubtitle:'Step-by-step ablution guide', wuduComplete:'Wudu completed!', wuduDuaTitle:'Dua after Wudu', qunutTitle:'Qunut Dua', qunutSubtitle:'The Qunut supplication recited in Witr prayer', qunutWhen:'When is Qunut recited?', qunutExplanation:'The Qunut dua is primarily recited in the last rakat of Witr prayer, before or after ruku. In some madhabs (Shafi\'i), it is also recited in Fajr prayer.' },
  ru: { title:'Учись молиться', subtitle:'Пошаговое руководство', step:'Шаг', prev:'Назад', next:'Далее', recite:'Читай', meaning:'Значение', times:'раз', selectPrayer:'Выберите намаз', fajr:'Фаджр (2 ракята)', dhuhr:'Зухр (4 ракята)', asr:'Аср (4 ракята)', maghrib:'Магриб (3 ракята)', isha:'Иша (4 ракята)', complete:'Намаз завершён!', restart:'Начать заново', wuduTitle:'Руководство по омовению', wuduSubtitle:'Пошаговое руководство по вуду', wuduComplete:'Омовение завершено!', wuduDuaTitle:'Дуа после омовения', qunutTitle:'Дуа Кунут', qunutSubtitle:'Мольба Кунут, читаемая в намазе Витр', qunutWhen:'Когда читается Кунут?', qunutExplanation:'Дуа Кунут в основном читается в последнем ракяте намаза Витр, до или после руку. В некоторых мазхабах (Шафии) читается также в намазе Фаджр.' },
  ar: { title:'تعلم الصلاة', subtitle:'دليل الصلاة خطوة بخطوة', step:'الخطوة', prev:'السابق', next:'التالي', recite:'اقرأ', meaning:'المعنى', times:'مرات', selectPrayer:'اختر الصلاة', fajr:'الفجر (ركعتان)', dhuhr:'الظهر (٤ ركعات)', asr:'العصر (٤ ركعات)', maghrib:'المغرب (٣ ركعات)', isha:'العشاء (٤ ركعات)', complete:'تمت الصلاة!', restart:'ابدأ من جديد', wuduTitle:'دليل الوضوء', wuduSubtitle:'دليل الوضوء خطوة بخطوة', wuduComplete:'اكتمل الوضوء!', wuduDuaTitle:'دعاء بعد الوضوء', qunutTitle:'دعاء القنوت', qunutSubtitle:'دعاء القنوت الذي يُقرأ في صلاة الوتر', qunutWhen:'متى يُقرأ القنوت؟', qunutExplanation:'يُقرأ دعاء القنوت في الركعة الأخيرة من صلاة الوتر، قبل الركوع أو بعده. في بعض المذاهب (الشافعي) يُقرأ أيضًا في صلاة الفجر.' },
  tr: { title:'Namaz Öğren', subtitle:'Adım adım namaz rehberi', step:'Adım', prev:'Önceki', next:'Sonraki', recite:'Oku', meaning:'Anlamı', times:'kez', selectPrayer:'Namaz seçin', fajr:'Sabah (2 rekat)', dhuhr:'Öğle (4 rekat)', asr:'İkindi (4 rekat)', maghrib:'Akşam (3 rekat)', isha:'Yatsı (4 rekat)', complete:'Namaz tamamlandı!', restart:'Yeniden başla', wuduTitle:'Abdest Rehberi', wuduSubtitle:'Adım adım abdest alma rehberi', wuduComplete:'Abdest tamamlandı!', wuduDuaTitle:'Abdestten sonra dua', qunutTitle:'Kunut Duası', qunutSubtitle:'Vitir namazında okunan kunut duası', qunutWhen:'Kunut ne zaman okunur?', qunutExplanation:'Kunut duası esas olarak Vitir namazının son rekatında rükûdan önce veya sonra okunur. Bazı mezheplerde (Şafii) Sabah namazında da okunur.' },
}

// SVG illustrasiyalar — namaz pozisiyaları (real siluet)
const C1 = 'var(--primary)' // əsas rəng
const C2 = 'var(--primary-dark, #0d6b3a)' // tünd variant
const C3 = 'var(--gold, #b8860b)' // qızılı aksent

const POS = {
  standing: (
    <svg viewBox="0 0 100 220" className="pg-svg-pose">
      {/* Baş — əmmamə ilə */}
      <ellipse cx="50" cy="26" rx="13" ry="15" fill={C1}/>
      <ellipse cx="50" cy="18" rx="14" ry="8" fill={C2} opacity="0.7"/>
      {/* Boyun */}
      <rect x="46" y="40" width="8" height="8" rx="3" fill={C1}/>
      {/* Bədən — geniş paltar (thobe) */}
      <path d="M32 48 Q50 44 68 48 L72 140 Q50 145 28 140 Z" fill={C1} opacity="0.85"/>
      {/* Çiyinlər */}
      <path d="M28 48 Q50 42 72 48 L68 56 Q50 52 32 56 Z" fill={C2} opacity="0.5"/>
      {/* Əllər — yanlarda */}
      <path d="M32 56 L24 100 L26 102 L34 60" fill={C1} opacity="0.7"/>
      <path d="M68 56 L76 100 L74 102 L66 60" fill={C1} opacity="0.7"/>
      {/* Ayaqlar */}
      <rect x="36" y="140" width="12" height="52" rx="5" fill={C1} opacity="0.75"/>
      <rect x="52" y="140" width="12" height="52" rx="5" fill={C1} opacity="0.75"/>
      {/* Ayaqqabı */}
      <ellipse cx="42" cy="194" rx="8" ry="4" fill={C2} opacity="0.6"/>
      <ellipse cx="58" cy="194" rx="8" ry="4" fill={C2} opacity="0.6"/>
      {/* Namaz xalçası */}
      <rect x="15" y="196" width="70" height="6" rx="3" fill={C3} opacity="0.3"/>
    </svg>
  ),
  hands_up: (
    <svg viewBox="0 0 120 220" className="pg-svg-pose">
      <ellipse cx="60" cy="26" rx="13" ry="15" fill={C1}/>
      <ellipse cx="60" cy="18" rx="14" ry="8" fill={C2} opacity="0.7"/>
      <rect x="56" y="40" width="8" height="8" rx="3" fill={C1}/>
      <path d="M42 48 Q60 44 78 48 L82 140 Q60 145 38 140 Z" fill={C1} opacity="0.85"/>
      <path d="M38 48 Q60 42 82 48 L78 56 Q60 52 42 56 Z" fill={C2} opacity="0.5"/>
      {/* Əllər yuxarıda — təkbir */}
      <path d="M42 56 L28 36 L26 20 L30 18 L32 34 L44 52" fill={C1} opacity="0.8"/>
      <path d="M78 56 L92 36 L94 20 L90 18 L88 34 L76 52" fill={C1} opacity="0.8"/>
      {/* Əl ovucları */}
      <ellipse cx="28" cy="18" rx="5" ry="7" fill={C1} opacity="0.6"/>
      <ellipse cx="92" cy="18" rx="5" ry="7" fill={C1} opacity="0.6"/>
      <rect x="46" y="140" width="12" height="52" rx="5" fill={C1} opacity="0.75"/>
      <rect x="62" y="140" width="12" height="52" rx="5" fill={C1} opacity="0.75"/>
      <ellipse cx="52" cy="194" rx="8" ry="4" fill={C2} opacity="0.6"/>
      <ellipse cx="68" cy="194" rx="8" ry="4" fill={C2} opacity="0.6"/>
      <rect x="20" y="196" width="80" height="6" rx="3" fill={C3} opacity="0.3"/>
    </svg>
  ),
  hands_folded: (
    <svg viewBox="0 0 100 220" className="pg-svg-pose">
      <ellipse cx="50" cy="26" rx="13" ry="15" fill={C1}/>
      <ellipse cx="50" cy="18" rx="14" ry="8" fill={C2} opacity="0.7"/>
      <rect x="46" y="40" width="8" height="8" rx="3" fill={C1}/>
      <path d="M32 48 Q50 44 68 48 L72 140 Q50 145 28 140 Z" fill={C1} opacity="0.85"/>
      <path d="M28 48 Q50 42 72 48 L68 56 Q50 52 32 56 Z" fill={C2} opacity="0.5"/>
      {/* Əllər sinədə bağlı */}
      <path d="M34 56 L38 72 Q50 80 62 72 L66 56" fill="none" stroke={C2} strokeWidth="4" strokeLinecap="round" opacity="0.7"/>
      <ellipse cx="50" cy="76" rx="14" ry="6" fill={C2} opacity="0.35"/>
      <rect x="36" y="140" width="12" height="52" rx="5" fill={C1} opacity="0.75"/>
      <rect x="52" y="140" width="12" height="52" rx="5" fill={C1} opacity="0.75"/>
      <ellipse cx="42" cy="194" rx="8" ry="4" fill={C2} opacity="0.6"/>
      <ellipse cx="58" cy="194" rx="8" ry="4" fill={C2} opacity="0.6"/>
      <rect x="15" y="196" width="70" height="6" rx="3" fill={C3} opacity="0.3"/>
    </svg>
  ),
  bowing: (
    <svg viewBox="0 0 160 180" className="pg-svg-pose">
      {/* Rüku — əyilmiş */}
      <ellipse cx="120" cy="42" rx="12" ry="14" fill={C1}/>
      <ellipse cx="120" cy="35" rx="13" ry="7" fill={C2} opacity="0.7"/>
      {/* Bel — üfüqi */}
      <path d="M65 50 Q92 38 110 46 L108 60 Q90 52 65 62 Z" fill={C1} opacity="0.85"/>
      <path d="M55 58 L65 50 L110 46 L108 60 L65 62 Z" fill={C1} opacity="0.8"/>
      {/* Paltar aşağı sallanır */}
      <path d="M55 58 Q52 90 50 120 L72 118 Q68 88 65 62 Z" fill={C1} opacity="0.75"/>
      {/* Ayaqlar */}
      <rect x="48" y="118" width="11" height="40" rx="5" fill={C1} opacity="0.75"/>
      <rect x="62" y="118" width="11" height="40" rx="5" fill={C1} opacity="0.75"/>
      {/* Əllər dizlərdə */}
      <path d="M70 60 L56 100" stroke={C1} strokeWidth="5" strokeLinecap="round" opacity="0.7"/>
      <path d="M90 54 L68 100" stroke={C1} strokeWidth="5" strokeLinecap="round" opacity="0.7"/>
      <circle cx="56" cy="102" r="4" fill={C2} opacity="0.5"/>
      <circle cx="68" cy="102" r="4" fill={C2} opacity="0.5"/>
      <ellipse cx="53" cy="160" rx="7" ry="4" fill={C2} opacity="0.6"/>
      <ellipse cx="68" cy="160" rx="7" ry="4" fill={C2} opacity="0.6"/>
      <rect x="30" y="162" width="90" height="6" rx="3" fill={C3} opacity="0.3"/>
    </svg>
  ),
  prostrating: (
    <svg viewBox="0 0 180 130" className="pg-svg-pose">
      {/* Səcdə — yerə əyilmiş */}
      {/* Namaz xalçası */}
      <rect x="10" y="108" width="160" height="6" rx="3" fill={C3} opacity="0.3"/>
      {/* Baş yerə dəyir */}
      <ellipse cx="32" cy="94" rx="11" ry="13" fill={C1}/>
      <ellipse cx="32" cy="87" rx="12" ry="7" fill={C2} opacity="0.7"/>
      {/* Bel — qövs şəklində */}
      <path d="M42 88 Q70 60 100 72 L98 86 Q70 75 44 96 Z" fill={C1} opacity="0.85"/>
      {/* Diz-ayaq */}
      <path d="M100 72 L105 98 L120 100 L125 96" fill="none" stroke={C1} strokeWidth="6" strokeLinecap="round" opacity="0.8"/>
      <path d="M100 72 L108 96 L130 100 L140 94" fill="none" stroke={C1} strokeWidth="5" strokeLinecap="round" opacity="0.7"/>
      {/* Paltar */}
      <path d="M60 80 Q80 95 100 86 L98 100 Q78 108 58 98 Z" fill={C1} opacity="0.6"/>
      {/* Əllər yerdə */}
      <ellipse cx="22" cy="104" rx="6" ry="4" fill={C1} opacity="0.7"/>
      <ellipse cx="44" cy="104" rx="6" ry="4" fill={C1} opacity="0.7"/>
      {/* Ayaq pəncələri */}
      <ellipse cx="130" cy="100" rx="8" ry="4" fill={C2} opacity="0.5"/>
      <ellipse cx="142" cy="96" rx="7" ry="4" fill={C2} opacity="0.5"/>
    </svg>
  ),
  sitting: (
    <svg viewBox="0 0 120 180" className="pg-svg-pose">
      {/* Təşəhhüd — oturmuş */}
      <ellipse cx="55" cy="24" rx="12" ry="14" fill={C1}/>
      <ellipse cx="55" cy="17" rx="13" ry="7" fill={C2} opacity="0.7"/>
      <rect x="51" y="37" width="8" height="7" rx="3" fill={C1}/>
      {/* Bədən — dik oturur */}
      <path d="M40 44 Q55 40 70 44 L72 100 Q55 105 38 100 Z" fill={C1} opacity="0.85"/>
      <path d="M38 44 Q55 38 72 44 L70 50 Q55 46 40 50 Z" fill={C2} opacity="0.5"/>
      {/* Sol ayaq altda */}
      <path d="M38 100 Q30 120 25 140 L55 142 Q48 122 42 102" fill={C1} opacity="0.7"/>
      {/* Sağ ayaq dik */}
      <path d="M62 100 Q72 120 75 135 L85 130 Q78 115 68 98" fill={C1} opacity="0.7"/>
      <ellipse cx="82" cy="132" rx="6" ry="8" fill={C1} opacity="0.6" transform="rotate(-20 82 132)"/>
      {/* Əllər dizlərdə */}
      <path d="M42 55 L32 90 L34 92" stroke={C1} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7"/>
      <path d="M68 55 L78 90 L76 92" stroke={C1} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7"/>
      {/* Sağ əlin şəhadət barmağı */}
      <line x1="78" y1="88" x2="82" y2="78" stroke={C2} strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
      <ellipse cx="32" cy="92" rx="4" ry="3" fill={C2} opacity="0.5"/>
      <rect x="15" y="148" width="85" height="6" rx="3" fill={C3} opacity="0.3"/>
    </svg>
  ),
  salam: (
    <svg viewBox="0 0 140 180" className="pg-svg-pose">
      {/* Salam — başı sağa çevirmiş */}
      <ellipse cx="70" cy="24" rx="12" ry="14" fill={C1}/>
      <ellipse cx="70" cy="17" rx="13" ry="7" fill={C2} opacity="0.7"/>
      {/* Baş dönmə istiqaməti oxu */}
      <path d="M82 22 Q92 18 98 14" stroke={C3} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite"/>
      </path>
      <polygon points="98,10 102,16 96,16" fill={C3} opacity="0.8">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite"/>
      </polygon>
      <rect x="66" y="37" width="8" height="7" rx="3" fill={C1}/>
      <path d="M53 44 Q70 40 87 44 L89 100 Q70 105 51 100 Z" fill={C1} opacity="0.85"/>
      <path d="M51 44 Q70 38 89 44 L87 50 Q70 46 53 50 Z" fill={C2} opacity="0.5"/>
      <path d="M51 100 Q43 120 38 140 L68 142 Q62 122 55 102" fill={C1} opacity="0.7"/>
      <path d="M75 100 Q85 120 88 135 L98 130 Q91 115 81 98" fill={C1} opacity="0.7"/>
      <path d="M55 55 L45 90 L47 92" stroke={C1} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7"/>
      <path d="M85 55 L95 90 L93 92" stroke={C1} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7"/>
      <rect x="25" y="148" width="90" height="6" rx="3" fill={C3} opacity="0.3"/>
    </svg>
  ),
}

// Step id → SVG pose mapping
const POSE_MAP = {
  niyyah: POS.standing,
  takbir: POS.hands_up,
  qiyam: POS.hands_folded,
  ruku: POS.bowing,
  qiyam_ruku: POS.standing,
  sajdah1: POS.prostrating,
  jalsah: POS.sitting,
  sajdah2: POS.prostrating,
  qiyam2: POS.hands_folded,
  tashahhud: POS.sitting,
  salavat: POS.sitting,
  salam: POS.salam,
}

const STEPS = [
  {
    id: 'niyyah',
    icon: '🧍',
    name: { az:'Niyyət', en:'Intention (Niyyah)', ru:'Намерение (Ният)', ar:'النية', tr:'Niyet' },
    arabic: '',
    transliteration: '',
    translation: {
      az: 'Hansı namazı qılacağınızı qəlbinizdə niyyət edin.',
      en: 'Make the intention in your heart for which prayer you will perform.',
      ru: 'Сделайте намерение в сердце, какой намаз вы будете совершать.',
      ar: 'انوِ في قلبك أي صلاة ستؤديها.',
      tr: 'Hangi namazı kılacağınızı kalbinizde niyet edin.',
    },
    description: {
      az: 'Qibləyə dönün. Əllərinizi iki yanınızda saxlayın. Qəlbinizdə hansı namazı qılacağınızı niyyət edin.',
      en: 'Face the Qiblah. Keep your hands at your sides. Make the intention in your heart for the specific prayer.',
      ru: 'Повернитесь к Кибле. Держите руки по бокам. Сделайте намерение в сердце для конкретной молитвы.',
      ar: 'استقبل القبلة. أبقِ يديك على جانبيك. انوِ في قلبك الصلاة المحددة.',
      tr: 'Kıbleye dönün. Ellerinizi iki yanınızda tutun. Kalbinizde hangi namazı kılacağınızı niyet edin.',
    },
    repeat: 1,
  },
  {
    id: 'takbir',
    icon: '🧍',
    name: { az:'Təkbirətül-İhram', en:'Opening Takbir', ru:'Вступительный такбир', ar:'تكبيرة الإحرام', tr:'İftitah Tekbiri' },
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    translation: {
      az: 'Allah ən böyükdür',
      en: 'Allah is the Greatest',
      ru: 'Аллах Велик',
      ar: 'الله أكبر',
      tr: 'Allah en büyüktür',
    },
    description: {
      az: 'Əllərinizi qulaqlarınızın səviyyəsinə qaldırın və "Allahu Akbar" deyin. Sonra əllərinizi sinənizin üzərində bağlayın (sağ əl sol əlin üstündə).',
      en: 'Raise your hands to ear level and say "Allahu Akbar." Then fold your hands on your chest (right hand over left).',
      ru: 'Поднимите руки до уровня ушей и скажите «Аллаху Акбар». Затем сложите руки на груди (правая поверх левой).',
      ar: 'ارفع يديك إلى مستوى الأذنين وقل "الله أكبر". ثم ضع يديك على صدرك (اليمنى فوق اليسرى).',
      tr: 'Ellerinizi kulak hizasına kaldırın ve "Allahu Ekber" deyin. Sonra ellerinizi göğsünüzün üzerinde bağlayın (sağ el sol elin üstünde).',
    },
    repeat: 1,
  },
  {
    id: 'qiyam',
    icon: '🧍',
    name: { az:'Qiyam — Fatihə və Surə', en:'Standing — Al-Fatiha & Surah', ru:'Стояние — Аль-Фатиха и Сура', ar:'القيام — الفاتحة وسورة', tr:'Kıyam — Fatiha ve Sure' },
    arabic: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ۝ ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ ۝ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ۝ مَٰلِكِ يَوْمِ ٱلدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ ۝ صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ',
    transliteration: 'Bismillahir-Rahmanir-Rahim. Al-hamdu lillahi Rabbil-alamin. Ar-Rahmanir-Rahim. Maliki yawmid-din. Iyyaka na\'budu wa iyyaka nasta\'in. Ihdinas-siratal-mustaqim. Siratal-ladhina an\'amta alayhim ghayril-maghdubi alayhim walad-dallin.',
    translation: {
      az: 'Mərhəmətli və Rəhmli Allahın adı ilə. Həmd olsun aləmlərin Rəbbi Allaha...',
      en: 'In the name of Allah, the Most Gracious, the Most Merciful. All praise is due to Allah, Lord of the worlds...',
      ru: 'Во имя Аллаха, Милостивого, Милосердного. Хвала Аллаху, Господу миров...',
      ar: 'بسم الله الرحمن الرحيم. الحمد لله رب العالمين...',
      tr: 'Rahman ve Rahim olan Allah\'ın adıyla. Hamd alemlerin Rabbi Allah\'a mahsustur...',
    },
    description: {
      az: 'Fatihə surəsini oxuyun, sonra qısa bir surə (məsələn, İxlas surəsi) oxuyun. Fatihədən sonra "Amin" deyin.',
      en: 'Recite Surah Al-Fatiha, then recite a short surah (e.g., Surah Al-Ikhlas). Say "Ameen" after Al-Fatiha.',
      ru: 'Прочитайте суру Аль-Фатиха, затем короткую суру (например, суру Аль-Ихлас). Скажите «Амин» после Аль-Фатихи.',
      ar: 'اقرأ سورة الفاتحة، ثم اقرأ سورة قصيرة (مثل سورة الإخلاص). قل "آمين" بعد الفاتحة.',
      tr: 'Fatiha suresini okuyun, ardından kısa bir sure (örneğin İhlas suresi) okuyun. Fatiha\'dan sonra "Amin" deyin.',
    },
    repeat: 1,
  },
  {
    id: 'ruku',
    icon: '🙇',
    name: { az:'Rüku', en:'Bowing (Ruku)', ru:'Поясной поклон (Руку)', ar:'الركوع', tr:'Rükü' },
    arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ',
    transliteration: 'Subhana Rabbiyal-Adhim',
    translation: {
      az: 'Uca Rəbbim pak və müqəddəsdir',
      en: 'Glory is to my Lord, the Most Great',
      ru: 'Пречист мой Великий Господь',
      ar: 'سبحان ربي العظيم',
      tr: 'Yüce Rabbim her türlü noksanlıktan münezzehtir',
    },
    description: {
      az: '"Allahu Akbar" deyərək əyilin. Əllərinizi dizlərinizin üzərinə qoyun, beliniizi düz saxlayın. "Subhana Rabbiyal-Adhim" 3 dəfə deyin.',
      en: 'Say "Allahu Akbar" and bow down. Place your hands on your knees, keep your back straight. Say "Subhana Rabbiyal-Adhim" 3 times.',
      ru: 'Скажите «Аллаху Акбар» и поклонитесь. Положите руки на колени, держите спину прямо. Скажите «Субхана Раббияль-Азым» 3 раза.',
      ar: 'قل "الله أكبر" واركع. ضع يديك على ركبتيك وأبقِ ظهرك مستقيمًا. قل "سبحان ربي العظيم" ٣ مرات.',
      tr: '"Allahu Ekber" deyip eğilin. Ellerinizi dizlerinizin üzerine koyun, sırtınızı düz tutun. "Sübhane Rabbiyel-Azim" 3 kez deyin.',
    },
    repeat: 3,
  },
  {
    id: 'qiyam_ruku',
    icon: '🧍',
    name: { az:'Rükudan qalxma', en:'Standing from Ruku', ru:'Подъём из руку', ar:'الاعتدال من الركوع', tr:'Rükûdan kalkış' },
    arabic: 'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ',
    transliteration: 'Sami\'allahu liman hamidah',
    translation: {
      az: 'Allah Ona həmd edəni eşitdi',
      en: 'Allah hears the one who praises Him',
      ru: 'Аллах слышит того, кто восхваляет Его',
      ar: 'سمع الله لمن حمده',
      tr: 'Allah kendisine hamd edeni işitir',
    },
    description: {
      az: '"Sami\'allahu liman hamidah" deyərək qalxın. Düz durun və "Rabbana lakal-hamd" deyin.',
      en: 'Rise saying "Sami\'allahu liman hamidah." Stand upright and say "Rabbana lakal-hamd."',
      ru: 'Поднимитесь, говоря «Сами\'Аллаху лиман хамидах». Встаньте прямо и скажите «Раббана лякаль-хамд».',
      ar: 'انهض قائلاً "سمع الله لمن حمده". قف مستقيمًا وقل "ربنا لك الحمد".',
      tr: '"Semi\'allahu limen hamideh" diyerek kalkın. Dik durun ve "Rabbena lekel-hamd" deyin.',
    },
    repeat: 1,
  },
  {
    id: 'sajdah1',
    icon: '🤲',
    name: { az:'Səcdə', en:'Prostration (Sujud)', ru:'Земной поклон (Суджуд)', ar:'السجود', tr:'Secde' },
    arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى',
    transliteration: 'Subhana Rabbiyal-A\'la',
    translation: {
      az: 'Ən uca Rəbbim pak və müqəddəsdir',
      en: 'Glory is to my Lord, the Most High',
      ru: 'Пречист мой Всевышний Господь',
      ar: 'سبحان ربي الأعلى',
      tr: 'En yüce Rabbim her türlü noksanlıktan münezzehtir',
    },
    description: {
      az: '"Allahu Akbar" deyərək səcdəyə gedin. Alın, burun, iki əl, iki diz və iki ayağın barmaqları yerə dəyməlidir. "Subhana Rabbiyal-A\'la" 3 dəfə deyin.',
      en: 'Say "Allahu Akbar" and prostrate. Your forehead, nose, both hands, both knees, and toes should touch the ground. Say "Subhana Rabbiyal-A\'la" 3 times.',
      ru: 'Скажите «Аллаху Акбар» и совершите земной поклон. Лоб, нос, обе руки, оба колена и пальцы ног должны касаться земли. Скажите «Субхана Раббияль-А\'ля» 3 раза.',
      ar: 'قل "الله أكبر" واسجد. يجب أن يلمس جبينك وأنفك ويداك وركبتاك وأصابع قدميك الأرض. قل "سبحان ربي الأعلى" ٣ مرات.',
      tr: '"Allahu Ekber" deyip secdeye gidin. Alın, burun, iki el, iki diz ve ayak parmakları yere değmelidir. "Sübhane Rabbiyel-A\'la" 3 kez deyin.',
    },
    repeat: 3,
  },
  {
    id: 'jalsah',
    icon: '🧎',
    name: { az:'Cəlsə', en:'Sitting between Sajdahs', ru:'Сидение между суджудами', ar:'الجلسة بين السجدتين', tr:'Celse' },
    arabic: 'رَبِّ ٱغْفِرْ لِي',
    transliteration: 'Rabbighfir li',
    translation: {
      az: 'Rəbbim, məni bağışla',
      en: 'My Lord, forgive me',
      ru: 'Господь мой, прости меня',
      ar: 'رب اغفر لي',
      tr: 'Rabbim, beni bağışla',
    },
    description: {
      az: '"Allahu Akbar" deyərək oturun. Sol ayağınızın üzərində oturun, sağ ayağınızı dik saxlayın. "Rabbighfir li" deyin.',
      en: 'Say "Allahu Akbar" and sit up. Sit on your left foot with your right foot upright. Say "Rabbighfir li."',
      ru: 'Скажите «Аллаху Акбар» и сядьте. Сядьте на левую ступню, правая стоит вертикально. Скажите «Раббигфир ли».',
      ar: 'قل "الله أكبر" واجلس. اجلس على قدمك اليسرى وأبقِ قدمك اليمنى منتصبة. قل "رب اغفر لي".',
      tr: '"Allahu Ekber" deyip oturun. Sol ayağınızın üzerinde oturun, sağ ayağınızı dik tutun. "Rabbığfir li" deyin.',
    },
    repeat: 1,
  },
  {
    id: 'sajdah2',
    icon: '🤲',
    name: { az:'İkinci Səcdə', en:'Second Prostration', ru:'Второй земной поклон', ar:'السجدة الثانية', tr:'İkinci Secde' },
    arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى',
    transliteration: 'Subhana Rabbiyal-A\'la',
    translation: {
      az: 'Ən uca Rəbbim pak və müqəddəsdir',
      en: 'Glory is to my Lord, the Most High',
      ru: 'Пречист мой Всевышний Господь',
      ar: 'سبحان ربي الأعلى',
      tr: 'En yüce Rabbim her türlü noksanlıktan münezzehtir',
    },
    description: {
      az: '"Allahu Akbar" deyərək ikinci səcdəyə gedin. Yenə "Subhana Rabbiyal-A\'la" 3 dəfə deyin. Sonra "Allahu Akbar" deyərək qalxın.',
      en: 'Say "Allahu Akbar" and go into the second prostration. Again say "Subhana Rabbiyal-A\'la" 3 times. Then rise saying "Allahu Akbar."',
      ru: 'Скажите «Аллаху Акбар» и совершите второй земной поклон. Снова скажите «Субхана Раббияль-А\'ля» 3 раза. Затем поднимитесь, говоря «Аллаху Акбар».',
      ar: 'قل "الله أكبر" واسجد السجدة الثانية. قل "سبحان ربي الأعلى" ٣ مرات مرة أخرى. ثم انهض قائلاً "الله أكبر".',
      tr: '"Allahu Ekber" deyip ikinci secdeye gidin. Yine "Sübhane Rabbiyel-A\'la" 3 kez deyin. Sonra "Allahu Ekber" deyerek kalkın.',
    },
    repeat: 3,
  },
  {
    id: 'qiyam2',
    icon: '🧍',
    name: { az:'Qiyam (2-ci rəkət)', en:'Standing (2nd Rakat)', ru:'Стояние (2-й ракят)', ar:'القيام (الركعة الثانية)', tr:'Kıyam (2. Rekat)' },
    arabic: '',
    transliteration: '',
    translation: {
      az: 'İkinci rəkətdə Fatihə və surə oxuyun, sonra rüku və səcdələri təkrarlayın.',
      en: 'In the second rakat, recite Al-Fatiha and a surah, then repeat ruku and sajdahs.',
      ru: 'Во втором ракяте прочитайте Аль-Фатиху и суру, затем повторите руку и суджуды.',
      ar: 'في الركعة الثانية، اقرأ الفاتحة وسورة، ثم كرر الركوع والسجود.',
      tr: 'İkinci rekatta Fatiha ve sure okuyun, sonra rükü ve secdeleri tekrarlayın.',
    },
    description: {
      az: '"Allahu Akbar" deyərək ayağa qalxın. Birinci rəkətdə olduğu kimi Fatihə və qısa surə oxuyun. Sonra rüku, qiyam, iki səcdə edin. 2 rəkətli namazda bundan sonra təşəhhüdə oturun.',
      en: 'Rise saying "Allahu Akbar." Recite Al-Fatiha and a short surah as in the first rakat. Then perform ruku, standing, and two sajdahs. In a 2-rakat prayer, sit for tashahhud after this.',
      ru: 'Поднимитесь, говоря «Аллаху Акбар». Прочитайте Аль-Фатиху и короткую суру, как в первом ракяте. Затем выполните руку, стояние и два суджуда. В 2-ракятной молитве после этого садитесь для ташаххуда.',
      ar: 'انهض قائلاً "الله أكبر". اقرأ الفاتحة وسورة قصيرة كما في الركعة الأولى. ثم اركع واعتدل واسجد سجدتين. في صلاة الركعتين، اجلس للتشهد بعد ذلك.',
      tr: '"Allahu Ekber" deyerek ayağa kalkın. Birinci rekatta olduğu gibi Fatiha ve kısa sure okuyun. Sonra rükü, kıyam ve iki secde yapın. 2 rekatlık namazda bundan sonra teşehhüde oturun.',
    },
    repeat: 1,
  },
  {
    id: 'tashahhud',
    icon: '🧎',
    name: { az:'Təşəhhüd', en:'Tashahhud', ru:'Ташаххуд', ar:'التشهد', tr:'Teşehhüd' },
    arabic: 'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَىٰ عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    transliteration: 'At-tahiyyatu lillahi was-salawatu wat-tayyibat. As-salamu alayka ayyuhan-nabiyyu wa rahmatullahi wa barakatuh. As-salamu alayna wa ala ibadillahis-salihin. Ash-hadu an la ilaha illallah wa ash-hadu anna Muhammadan abduhu wa rasuluh.',
    translation: {
      az: 'Salamlar, dualar və yaxşı əməllər Allaha məxsusdur. Ey Peyğəmbər, sənə salam, Allahın rəhməti və bərəkəti olsun...',
      en: 'Greetings, prayers and good deeds are for Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings...',
      ru: 'Приветствия, молитвы и благие деяния — Аллаху. Мир тебе, о Пророк, и милость Аллаха и Его благословения...',
      ar: 'التحيات لله والصلوات والطيبات. السلام عليك أيها النبي ورحمة الله وبركاته...',
      tr: 'Tahiyyat, salavat ve tayyibat Allah\'a mahsustur. Ey Peygamber, sana selam, Allah\'ın rahmeti ve bereketi olsun...',
    },
    description: {
      az: 'Oturun və təşəhhüdü oxuyun. Sağ əlinizin şəhadət barmağını qaldırın "Əşhədu ən la ilahə illəllah" deyərkən.',
      en: 'Sit and recite the tashahhud. Raise your right index finger when saying "Ash-hadu an la ilaha illallah."',
      ru: 'Сядьте и прочитайте ташаххуд. Поднимите указательный палец правой руки при словах «Ашхаду ан ля иляха илляллах».',
      ar: 'اجلس واقرأ التشهد. ارفع إصبع السبابة اليمنى عند قول "أشهد أن لا إله إلا الله".',
      tr: 'Oturun ve teşehhüdü okuyun. "Eşhedü en la ilahe illallah" derken sağ elinizin işaret parmağını kaldırın.',
    },
    repeat: 1,
  },
  {
    id: 'salavat',
    icon: '🧎',
    name: { az:'Salavat', en:'Salawat (Blessings)', ru:'Салават', ar:'الصلاة الإبراهيمية', tr:'Salavat' },
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
    transliteration: 'Allahumma salli ala Muhammadin wa ala ali Muhammadin kama sallayta ala Ibrahima wa ala ali Ibrahima innaka Hamidun Majid.',
    translation: {
      az: 'Allahım! Muhəmmədə və Muhəmmədin ailəsinə xeyir-dua ver, necə ki İbrahimə və İbrahimin ailəsinə xeyir-dua vermisən...',
      en: 'O Allah, send blessings upon Muhammad and the family of Muhammad, as You sent blessings upon Ibrahim and the family of Ibrahim...',
      ru: 'О Аллах, благослови Мухаммада и семью Мухаммада, как Ты благословил Ибрахима и семью Ибрахима...',
      ar: 'اللهم صل على محمد وعلى آل محمد كما صليت على إبراهيم وعلى آل إبراهيم...',
      tr: 'Allah\'ım! Muhammed\'e ve Muhammed\'in ailesine rahmet eyle, İbrahim\'e ve İbrahim\'in ailesine rahmet ettiğin gibi...',
    },
    description: {
      az: 'Təşəhhüddən sonra salavat oxuyun. Bu, son oturuşda (2 rəkətli namazın sonunda, 3-4 rəkətli namazın son rəkətindən sonra) oxunur.',
      en: 'Recite the salawat after tashahhud. This is recited in the final sitting (end of 2-rakat prayer, or after the last rakat of 3-4 rakat prayers).',
      ru: 'Прочитайте салават после ташаххуда. Это читается в финальном сидении (в конце 2-ракятной молитвы или после последнего ракята в 3-4-ракятных молитвах).',
      ar: 'اقرأ الصلاة الإبراهيمية بعد التشهد. تُقرأ في الجلسة الأخيرة (نهاية صلاة الركعتين أو بعد الركعة الأخيرة في الصلوات ذات ٣-٤ ركعات).',
      tr: 'Teşehhüdden sonra salavatı okuyun. Bu, son oturuşta okunur (2 rekatlık namazın sonunda veya 3-4 rekatlık namazların son rekatından sonra).',
    },
    repeat: 1,
  },
  {
    id: 'salam',
    icon: '🧎',
    name: { az:'Salam', en:'Salam (Ending)', ru:'Салям (Завершение)', ar:'التسليم', tr:'Selam' },
    arabic: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ',
    transliteration: 'Assalamu alaykum wa rahmatullah',
    translation: {
      az: 'Allahın salamı və rəhməti sizin üzərinizə olsun',
      en: 'Peace and mercy of Allah be upon you',
      ru: 'Мир вам и милость Аллаха',
      ar: 'السلام عليكم ورحمة الله',
      tr: 'Allah\'ın selamı ve rahmeti üzerinize olsun',
    },
    description: {
      az: 'Başınızı sağa çevirib "Assalamu alaykum wa rahmatullah" deyin. Sonra başınızı sola çevirib təkrarlayın. Namaz tamamlanmışdır.',
      en: 'Turn your head to the right and say "Assalamu alaykum wa rahmatullah." Then turn to the left and repeat. The prayer is now complete.',
      ru: 'Поверните голову направо и скажите «Ассаляму алейкум уа рахматуллах». Затем поверните голову налево и повторите. Молитва завершена.',
      ar: 'أدر رأسك إلى اليمين وقل "السلام عليكم ورحمة الله". ثم أدر رأسك إلى اليسار وكرر. اكتملت الصلاة.',
      tr: 'Başınızı sağa çevirip "Esselamu aleykum ve rahmetullah" deyin. Sonra başınızı sola çevirip tekrarlayın. Namaz tamamlanmıştır.',
    },
    repeat: 2,
  },
]

const WUDU_STEPS = [
  { id:'bismillah', icon:'🤲', name:{ az:'Bismillah', en:'Bismillah', ru:'Бисмиллях', ar:'بسم الله', tr:'Besmele' }, arabic:'بِسْمِ اللَّهِ', transliteration:'Bismillah', translation:{ az:'Allahın adı ilə', en:'In the name of Allah', ru:'Во имя Аллаха', ar:'بسم الله', tr:'Allah\'ın adıyla' }, description:{ az:'Dəstəmaz almağa niyyət edin və "Bismillah" deyin.', en:'Make the intention for wudu and say "Bismillah."', ru:'Сделайте намерение для вуду и скажите «Бисмиллях».', ar:'انوِ الوضوء وقل "بسم الله".', tr:'Abdest almaya niyet edin ve "Bismillah" deyin.' }},
  { id:'hands', icon:'🖐️', name:{ az:'Əlləri yuma', en:'Wash hands', ru:'Мытьё рук', ar:'غسل اليدين', tr:'Elleri yıkama' }, arabic:'', transliteration:'', translation:{ az:'', en:'', ru:'', ar:'', tr:'' }, description:{ az:'Hər iki əlinizi biləyə qədər 3 dəfə yuyun. Barmaqlar arasına da su keçirin.', en:'Wash both hands up to the wrists 3 times. Let water pass between your fingers.', ru:'Вымойте обе руки до запястий 3 раза. Пропустите воду между пальцами.', ar:'اغسل يديك إلى الرسغين ٣ مرات. مرّر الماء بين أصابعك.', tr:'İki elinizi bileklerinize kadar 3 kez yıkayın. Parmaklarınızın arasına su geçirin.' }},
  { id:'mouth', icon:'👄', name:{ az:'Ağzı yaxalama', en:'Rinse mouth', ru:'Полоскание рта', ar:'المضمضة', tr:'Ağız çalkalama' }, arabic:'', transliteration:'', translation:{ az:'', en:'', ru:'', ar:'', tr:'' }, description:{ az:'Sağ əlinizlə ağzınıza su alıb 3 dəfə yaxalayın.', en:'Take water in your right hand and rinse your mouth 3 times.', ru:'Возьмите воду правой рукой и прополощите рот 3 раза.', ar:'خذ الماء بيدك اليمنى وتمضمض ٣ مرات.', tr:'Sağ elinizle ağzınıza su alıp 3 kez çalkalayın.' }},
  { id:'nose', icon:'👃', name:{ az:'Burnu yaxalama', en:'Rinse nose', ru:'Промывание носа', ar:'الاستنشاق', tr:'Burun temizleme' }, arabic:'', transliteration:'', translation:{ az:'', en:'', ru:'', ar:'', tr:'' }, description:{ az:'Sağ əlinizlə burunuza su çəkin, sol əlinizlə təmizləyin. 3 dəfə.', en:'Sniff water into your nose with right hand, clean with left. 3 times.', ru:'Втяните воду в нос правой рукой, очистите левой. 3 раза.', ar:'استنشق الماء بيدك اليمنى واستنثر بيسراك. ٣ مرات.', tr:'Sağ elinizle burnunuza su çekin, sol elinizle temizleyin. 3 kez.' }},
  { id:'face', icon:'😊', name:{ az:'Üzü yuma', en:'Wash face', ru:'Мытьё лица', ar:'غسل الوجه', tr:'Yüz yıkama' }, arabic:'', transliteration:'', translation:{ az:'', en:'', ru:'', ar:'', tr:'' }, description:{ az:'Üzünüzü alından çənəyə, bir qulaqdan digərinə 3 dəfə yuyun.', en:'Wash your face from forehead to chin, ear to ear, 3 times.', ru:'Вымойте лицо от лба до подбородка, от уха до уха, 3 раза.', ar:'اغسل وجهك من الجبين إلى الذقن ومن الأذن إلى الأذن ٣ مرات.', tr:'Yüzünüzü alından çeneye, bir kulaktan diğerine 3 kez yıkayın.' }},
  { id:'arms', icon:'💪', name:{ az:'Qolları yuma', en:'Wash arms', ru:'Мытьё рук до локтей', ar:'غسل اليدين إلى المرفقين', tr:'Kolları yıkama' }, arabic:'', transliteration:'', translation:{ az:'', en:'', ru:'', ar:'', tr:'' }, description:{ az:'Sağ qolunuzu barmaq uclarından dirsəyə qədər 3 dəfə, sonra sol qolunuzu yuyun.', en:'Wash right arm from fingertips to elbow 3 times, then left arm.', ru:'Вымойте правую руку от кончиков пальцев до локтя 3 раза, затем левую.', ar:'اغسل يدك اليمنى من أطراف الأصابع إلى المرفق ٣ مرات، ثم اليسرى.', tr:'Sağ kolunuzu parmak uçlarından dirseğe kadar 3 kez, sonra sol kolunuzu yıkayın.' }},
  { id:'head', icon:'🧑', name:{ az:'Başa məsh', en:'Wipe head', ru:'Протирание головы', ar:'مسح الرأس', tr:'Baş mesh' }, arabic:'', transliteration:'', translation:{ az:'', en:'', ru:'', ar:'', tr:'' }, description:{ az:'Islaq əllərinizi alnınızdan ensesinizə, sonra geriyə 1 dəfə çəkin. Qulaqlarınızı da məsh edin.', en:'With wet hands, wipe from forehead to back of head, then back. Wipe ears too. Once.', ru:'Мокрыми руками проведите ото лба к затылку и обратно. Протрите уши. Один раз.', ar:'بيديك المبللتين، امسح من الجبين إلى مؤخرة الرأس ثم ارجع. امسح أذنيك أيضًا. مرة واحدة.', tr:'Islak ellerinizi alnınızdan enseye, sonra geri çekin. Kulaklarınızı da mesh edin. 1 kez.' }},
  { id:'feet', icon:'🦶', name:{ az:'Ayaqları yuma', en:'Wash feet', ru:'Мытьё ног', ar:'غسل القدمين', tr:'Ayakları yıkama' }, arabic:'', transliteration:'', translation:{ az:'', en:'', ru:'', ar:'', tr:'' }, description:{ az:'Sağ ayağınızı topuğa qədər 3 dəfə, sonra sol ayağınızı yuyun. Barmaqlar arasını da yuyun.', en:'Wash right foot to the ankle 3 times, then left. Wash between toes too.', ru:'Вымойте правую ногу до щиколотки 3 раза, затем левую. Промойте между пальцами.', ar:'اغسل قدمك اليمنى إلى الكعب ٣ مرات، ثم اليسرى. اغسل بين أصابع القدم.', tr:'Sağ ayağınızı topuğa kadar 3 kez, sonra sol ayağınızı yıkayın. Parmak aralarını da yıkayın.' }},
]

const WUDU_DUA = {
  arabic: 'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
  transliteration: 'Ash-hadu an la ilaha illallahu wahdahu la sharika lahu wa ash-hadu anna Muhammadan abduhu wa rasuluh',
  translation: {
    az: 'Şəhadət edirəm ki, Allahdan başqa ilah yoxdur, tək Odur, şəriki yoxdur. Şəhadət edirəm ki, Muhəmməd Onun qulu və elçisidir.',
    en: 'I bear witness that there is no god but Allah alone, with no partner, and I bear witness that Muhammad is His slave and messenger.',
    ru: 'Свидетельствую, что нет бога, кроме Аллаха, Единого, у Которого нет сотоварища, и свидетельствую, что Мухаммад — Его раб и посланник.',
    ar: 'أشهد أن لا إله إلا الله وحده لا شريك له وأشهد أن محمداً عبده ورسوله',
    tr: 'Şehadet ederim ki Allah\'tan başka ilah yoktur, tektir, ortağı yoktur. Şehadet ederim ki Muhammed O\'nun kulu ve elçisidir.',
  }
}

const QUNUT_DUA = {
  arabic: 'اللَّهُمَّ إِنَّا نَسْتَعِينُكَ وَنَسْتَغْفِرُكَ وَنُؤْمِنُ بِكَ وَنَتَوَكَّلُ عَلَيْكَ وَنُثْنِي عَلَيْكَ الْخَيْرَ وَنَشْكُرُكَ وَلَا نَكْفُرُكَ وَنَخْلَعُ وَنَتْرُكُ مَنْ يَفْجُرُكَ اللَّهُمَّ إِيَّاكَ نَعْبُدُ وَلَكَ نُصَلِّي وَنَسْجُدُ وَإِلَيْكَ نَسْعَى وَنَحْفِدُ وَنَرْجُو رَحْمَتَكَ وَنَخْشَى عَذَابَكَ إِنَّ عَذَابَكَ بِالْكُفَّارِ مُلْحِقٌ',
  transliteration: 'Allahumma inna nasta\'inuka wa nastaghfiruka wa nu\'minu bika wa natawakkalu alayka wa nuthni alaykal-khayr. Wa nashkuruka wa la nakfuruka wa nakhla\'u wa natruku man yafjuruk. Allahumma iyyaka na\'budu wa laka nusalli wa nasjudu wa ilayka nas\'a wa nahfidu wa narju rahmataka wa nakhsha adhabaka inna adhabaka bil-kuffari mulhiq.',
  translation: {
    az: 'Allahım! Biz Səndən yardım diləyirik, Səndən bağışlanma istəyirik, Sənə inanırıq, Sənə təvəkkül edirik, Səni xeyirlə mədh edirik. Sənə şükür edirik, Sənə nankorluq etmirik. Sənə asi olanlardan uzaqlaşırıq. Allahım! Yalnız Sənə ibadət edirik, Sənin üçün namaz qılırıq və səcdə edirik. Sənin rəhmətini umuruq və əzabından qorxuruq. Həqiqətən, Sənin əzabın kafirlərə yetişəcəkdir.',
    en: 'O Allah, we seek Your help and ask Your forgiveness, we believe in You and rely on You, we praise You with all good. We thank You and are not ungrateful to You. We forsake and turn away from whoever disobeys You. O Allah, You alone we worship, to You we pray and prostrate. To You we strive and hasten. We hope for Your mercy and fear Your punishment. Indeed, Your punishment will overtake the disbelievers.',
    ru: 'О Аллах! Мы просим Твоей помощи и прощения, верим в Тебя и уповаем на Тебя, восхваляем Тебя благом. Благодарим Тебя и не проявляем неблагодарности. Мы отрекаемся от тех, кто ослушивается Тебя. О Аллах! Тебе одному мы поклоняемся, для Тебя молимся и совершаем земной поклон. К Тебе стремимся и спешим. Надеемся на Твою милость и страшимся Твоего наказания. Поистине, Твоё наказание постигнет неверных.',
    ar: 'اللهم إنا نستعينك ونستغفرك ونؤمن بك ونتوكل عليك ونثني عليك الخير. ونشكرك ولا نكفرك ونخلع ونترك من يفجرك. اللهم إياك نعبد ولك نصلي ونسجد وإليك نسعى ونحفد ونرجو رحمتك ونخشى عذابك إن عذابك بالكفار ملحق.',
    tr: 'Allah\'ım! Senden yardım dileriz, Senden bağışlanma isteriz, Sana inanırız, Sana tevekkül ederiz, Seni hayırla överiz. Sana şükrederiz, Sana nankörlük etmeyiz. Sana isyan edenden uzaklaşırız. Allah\'ım! Yalnız Sana ibadet ederiz, Senin için namaz kılarız ve secde ederiz. Senin rahmetini umarız ve azabından korkarız. Şüphesiz Senin azabın kafirlere ulaşacaktır.',
  }
}

// Build step sequences for each prayer type
function buildPrayerSteps(rakatCount) {
  // Common first rakat: niyyah, takbir, qiyam, ruku, qiyam_ruku, sajdah1, jalsah, sajdah2
  const firstRakat = [0, 1, 2, 3, 4, 5, 6, 7] // indices into STEPS
  // 2nd rakat standing + repeat
  const secondRakat = [8] // qiyam2 (includes instruction to repeat ruku/sajdah)
  // Tashahhud, salavat, salam
  const finalSitting = [9, 10, 11]

  if (rakatCount === 2) {
    return [...firstRakat, ...secondRakat, ...finalSitting]
  }
  if (rakatCount === 3) {
    // 1st rakat, 2nd rakat + tashahhud, 3rd rakat (standing only Fatiha), final sitting
    return [...firstRakat, ...secondRakat, 9, 8, ...finalSitting]
  }
  // 4 rakat
  return [...firstRakat, ...secondRakat, 9, 8, 8, ...finalSitting]
}

const PRAYER_TYPES = [
  { key: 'fajr',    rakat: 2 },
  { key: 'dhuhr',   rakat: 4 },
  { key: 'asr',     rakat: 4 },
  { key: 'maghrib', rakat: 3 },
  { key: 'isha',    rakat: 4 },
]

export default function PrayerGuidePage({ setPage }) {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.az

  const [mode, setMode] = useState('prayer') // 'prayer' | 'wudu' | 'qunut'
  const [selectedPrayer, setSelectedPrayer] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [wuduStep, setWuduStep] = useState(0)

  const prayerType = selectedPrayer !== null ? PRAYER_TYPES[selectedPrayer] : null
  const stepIndices = prayerType ? buildPrayerSteps(prayerType.rakat) : []
  const totalSteps = stepIndices.length
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0
  const isComplete = selectedPrayer !== null && totalSteps > 0 && currentStep >= totalSteps

  const currentStepData = !isComplete && totalSteps > 0 ? STEPS[stepIndices[currentStep]] : null

  const handleSelectPrayer = (idx) => {
    setSelectedPrayer(idx)
    setCurrentStep(0)
  }

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const handleNext = () => {
    setCurrentStep(currentStep + 1)
  }

  const handleRestart = () => {
    setSelectedPrayer(null)
    setCurrentStep(0)
  }

  const handleBackToSelect = () => {
    setSelectedPrayer(null)
    setCurrentStep(0)
  }

  const handleModeSwitch = (newMode) => {
    setMode(newMode)
    setSelectedPrayer(null)
    setCurrentStep(0)
    setWuduStep(0)
  }

  const wuduTotalSteps = WUDU_STEPS.length
  const wuduProgress = ((wuduStep + 1) / wuduTotalSteps) * 100
  const isWuduComplete = wuduStep >= wuduTotalSteps
  const currentWuduStep = !isWuduComplete ? WUDU_STEPS[wuduStep] : null

  return (
    <>
      {/* Hero */}
      <div className="page-hero">
        <div className="breadcrumb">
          <button onClick={() => setPage('home')}>muslims.cc</button>
          <span>/</span>
          <span>{t.title}</span>
        </div>
        <div className="page-hero-arabic">بِسْمِ اللَّهِ</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <section className="section">
        <div className="section-inner pg-container">

          {/* Mode Toggle */}
          <div className="pg-mode-toggle">
            <button className={`pg-mode-btn ${mode === 'prayer' ? 'active' : ''}`} onClick={() => handleModeSwitch('prayer')}>
              🕌 {lang==='az'?'Namaz':lang==='ru'?'Намаз':lang==='ar'?'الصلاة':lang==='tr'?'Namaz':'Prayer'}
            </button>
            <button className={`pg-mode-btn ${mode === 'wudu' ? 'active' : ''}`} onClick={() => handleModeSwitch('wudu')}>
              💧 {lang==='az'?'Dəstəmaz':lang==='ru'?'Омовение':lang==='ar'?'الوضوء':lang==='tr'?'Abdest':'Wudu'}
            </button>
            <button className={`pg-mode-btn ${mode === 'qunut' ? 'active' : ''}`} onClick={() => handleModeSwitch('qunut')}>
              🤲 {lang==='az'?'Qunut':lang==='ru'?'Кунут':lang==='ar'?'القنوت':lang==='tr'?'Kunut':'Qunut'}
            </button>
          </div>

          {/* ═══════════════ PRAYER MODE ═══════════════ */}
          {mode === 'prayer' && (
            <>
              {/* Prayer Type Selection */}
              {selectedPrayer === null && (
                <div className="pg-select anim-fadeUp">
                  <h2 className="pg-select-title">{t.selectPrayer}</h2>
                  <div className="pg-prayer-grid">
                    {PRAYER_TYPES.map((pt, idx) => (
                      <button
                        key={pt.key}
                        className="pg-prayer-btn"
                        onClick={() => handleSelectPrayer(idx)}
                      >
                        <span className="pg-prayer-icon">🕌</span>
                        <span className="pg-prayer-name">{t[pt.key]}</span>
                        <span className="pg-prayer-rakat">{pt.rakat} {lang === 'az' ? 'rəkət' : lang === 'tr' ? 'rekat' : lang === 'ru' ? 'ракята' : lang === 'ar' ? 'ركعات' : 'rakat'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step Guide */}
              {selectedPrayer !== null && !isComplete && currentStepData && (
                <div className="pg-guide anim-fadeUp">
                  {/* Progress bar */}
                  <div className="pg-progress-wrap">
                    <div className="pg-progress-bar">
                      <div
                        className="pg-progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="pg-progress-text">
                      {t.step} {currentStep + 1} / {totalSteps}
                    </span>
                  </div>

                  {/* Back to selection */}
                  <button className="btn-ghost pg-back-btn" onClick={handleBackToSelect}>
                    ← {t.selectPrayer}
                  </button>

                  {/* Step card */}
                  <div className="pg-step-card">
                    <div className="pg-step-header">
                      <span className="pg-step-number">{currentStep + 1}</span>
                      <h3 className="pg-step-name">{currentStepData.name[lang] || currentStepData.name.en}</h3>
                    </div>

                    {/* SVG Pose Illustration */}
                    <div className="pg-pose-wrap">
                      {POSE_MAP[currentStepData.id] || POS.standing}
                    </div>

                    {currentStepData.arabic && (
                      <div className="pg-arabic-block">
                        <span className="pg-label">{t.recite}{currentStepData.repeat > 1 ? ` (${currentStepData.repeat}x)` : ''}</span>
                        <div className="pg-arabic-text arabic-text">{currentStepData.arabic}</div>
                      </div>
                    )}

                    {currentStepData.transliteration && (
                      <div className="pg-translit">
                        {currentStepData.transliteration}
                      </div>
                    )}

                    {currentStepData.translation[lang] && (
                      <div className="pg-meaning">
                        <span className="pg-label">{t.meaning}</span>
                        <p>{currentStepData.translation[lang] || currentStepData.translation.en}</p>
                      </div>
                    )}

                    <div className="pg-description">
                      <p>{currentStepData.description[lang] || currentStepData.description.en}</p>
                    </div>

                    {currentStepData.repeat > 1 && (
                      <div className="pg-repeat-badge">
                        {currentStepData.repeat} {t.times}
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="pg-nav">
                    <button
                      className="btn-secondary"
                      onClick={handlePrev}
                      disabled={currentStep === 0}
                    >
                      {t.prev}
                    </button>
                    <button
                      className="btn-primary"
                      onClick={handleNext}
                    >
                      {t.next}
                    </button>
                  </div>
                </div>
              )}

              {/* Completion Screen */}
              {isComplete && (
                <div className="pg-complete anim-scaleIn">
                  <div className="pg-complete-icon">✅</div>
                  <h2 className="pg-complete-title">{t.complete}</h2>
                  <p className="pg-complete-prayer">{t[PRAYER_TYPES[selectedPrayer].key]}</p>
                  <button className="btn-primary" onClick={handleRestart}>
                    {t.restart}
                  </button>
                </div>
              )}
            </>
          )}

          {/* ═══════════════ WUDU MODE ═══════════════ */}
          {mode === 'wudu' && (
            <>
              {!isWuduComplete && currentWuduStep && (
                <div className="pg-guide anim-fadeUp">
                  {/* Progress bar */}
                  <div className="pg-progress-wrap">
                    <div className="pg-progress-bar">
                      <div
                        className="pg-progress-fill"
                        style={{ width: `${wuduProgress}%` }}
                      />
                    </div>
                    <span className="pg-progress-text">
                      {t.step} {wuduStep + 1} / {wuduTotalSteps}
                    </span>
                  </div>

                  {/* Step card */}
                  <div className="pg-step-card">
                    <div className="pg-step-header">
                      <span className="pg-step-number">{wuduStep + 1}</span>
                      <span className="pg-step-icon">{currentWuduStep.icon}</span>
                      <h3 className="pg-step-name">{currentWuduStep.name[lang] || currentWuduStep.name.en}</h3>
                    </div>

                    {currentWuduStep.arabic && (
                      <div className="pg-arabic-block">
                        <span className="pg-label">{t.recite}</span>
                        <div className="pg-arabic-text arabic-text">{currentWuduStep.arabic}</div>
                      </div>
                    )}

                    {currentWuduStep.transliteration && (
                      <div className="pg-translit">
                        {currentWuduStep.transliteration}
                      </div>
                    )}

                    {currentWuduStep.translation[lang] && (
                      <div className="pg-meaning">
                        <span className="pg-label">{t.meaning}</span>
                        <p>{currentWuduStep.translation[lang] || currentWuduStep.translation.en}</p>
                      </div>
                    )}

                    <div className="pg-description">
                      <p>{currentWuduStep.description[lang] || currentWuduStep.description.en}</p>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="pg-nav">
                    <button
                      className="btn-secondary"
                      onClick={() => { if (wuduStep > 0) setWuduStep(wuduStep - 1) }}
                      disabled={wuduStep === 0}
                    >
                      {t.prev}
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => setWuduStep(wuduStep + 1)}
                    >
                      {t.next}
                    </button>
                  </div>
                </div>
              )}

              {/* Wudu Completion */}
              {isWuduComplete && (
                <div className="pg-complete anim-scaleIn">
                  <div className="pg-complete-icon">💧</div>
                  <h2 className="pg-complete-title">{t.wuduComplete}</h2>

                  {/* Wudu completion dua */}
                  <div className="pg-wudu-dua">
                    <div className="pg-wudu-dua-title">{t.wuduDuaTitle}</div>
                    <div className="pg-wudu-dua-ar">{WUDU_DUA.arabic}</div>
                    <div className="pg-translit" style={{ border: 'none', marginBottom: 8 }}>
                      {WUDU_DUA.transliteration}
                    </div>
                    <div className="pg-wudu-dua-trans">
                      {WUDU_DUA.translation[lang] || WUDU_DUA.translation.en}
                    </div>
                  </div>

                  <button className="btn-primary" onClick={() => setWuduStep(0)} style={{ marginTop: 24 }}>
                    {t.restart}
                  </button>
                </div>
              )}
            </>
          )}

          {/* ═══════════════ QUNUT MODE ═══════════════ */}
          {mode === 'qunut' && (
            <div className="pg-guide anim-fadeUp">
              <div className="pg-step-card">
                <div className="pg-step-header">
                  <span className="pg-step-icon" style={{ fontSize: '2rem' }}>🤲</span>
                  <h3 className="pg-step-name">{t.qunutTitle}</h3>
                </div>

                {/* When to recite */}
                <div className="pg-description" style={{ marginBottom: 20 }}>
                  <span className="pg-label">{t.qunutWhen}</span>
                  <p>{t.qunutExplanation}</p>
                </div>

                {/* Arabic text */}
                <div className="pg-arabic-block">
                  <span className="pg-label">{t.recite}</span>
                  <div className="pg-arabic-text arabic-text">{QUNUT_DUA.arabic}</div>
                </div>

                {/* Transliteration */}
                <div className="pg-translit">
                  {QUNUT_DUA.transliteration}
                </div>

                {/* Translation */}
                <div className="pg-meaning">
                  <span className="pg-label">{t.meaning}</span>
                  <p>{QUNUT_DUA.translation[lang] || QUNUT_DUA.translation.en}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>
    </>
  )
}
