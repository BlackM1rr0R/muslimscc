// ═══════════════════════════════════════════════════════
// "Ərəb əlifbası və Quran oxumağı öyrən" kursunun MƏZMUNU (5 dil)
//
// Kim oxuyur: src/pages/ArabicCoursePage.jsx + src/components/arabic/*,
// tests/unit/arabicCourse.test.js.
//
// Qaydalar
// • Quran sözləri (QW, PRACTICE_AYAHS) skriptlə api.alquran.cloud-un
//   quran-uthmani nəşrindən hərfi-hərfinə götürülüb — əl ilə DƏYİŞMƏ.
//   Yeni nümunə lazımdırsa, ayəni yenidən yüklə və sözü oradan kəs.
// • Məxrəc və təcvid mətnləri yalnız ümumi qəbul olunmuş oxu qaydalarıdır
//   (Həfs ən Asim rəvayəti, Şatibiyyə yolu). Fiqh hökmü yoxdur.
// • Hərf səsləri: public/audio/arabic/<id>.wav — mənbə və lisenziya
//   src/data/arabicCourseCredits.js-də. audio: null — səs yoxdur, düymə
//   göstərilmir (TTS və ya uydurma səs işlədilmir).
// • tl (transliterasiya) dilə bağlı deyil — bütün dillərdə eyni latın yazısı.
// ═══════════════════════════════════════════════════════

export const COURSE_LANGS = ['az', 'en', 'ru', 'ar', 'tr']

// Söz içində bitişmə xətti (təvil) — hərfin formalarını göstərmək üçün
const TATWEEL = 'ـ'

// ── Məxrəclər (çıxış yerləri) — bir neçə hərf eyni yerdən çıxa bilər ──
export const MAKHRAJ = {
  jawf: {
    az: 'Ağız və boğaz boşluğundan (cövf) çıxır. Əlif uzatma (mədd) hərfidir: özü hərəkə qəbul etmir, ondan əvvəlki fəthəni uzadır. Hərəkəli əlif həmzə kimi oxunur.',
    en: 'Comes from the open space of the mouth and throat (al-jawf). Alif is a lengthening (madd) letter: it carries no vowel itself and stretches the fatḥa before it. An alif with a vowel mark is read as a hamza.',
    ru: 'Исходит из полости рта и гортани (аль-джауф). Алиф — буква удлинения (мадд): сама огласовку не принимает и удлиняет фатху перед собой. Алиф с огласовкой читается как хамза.',
    ar: 'مخرجها الجوف، وهو الفراغ الممتد من الحلق إلى الفم. والألف حرف مدّ لا يقبل الحركة، ويمدّ الفتحة التي قبله. والألف المتحركة تُقرأ همزة.',
    tr: 'Ağız ve boğaz boşluğundan (cevf) çıkar. Elif bir med (uzatma) harfidir: kendisi hareke almaz, önündeki üstünü uzatır. Harekeli elif hemze olarak okunur.',
  },
  lips: {
    az: 'İki dodağın birləşməsindən çıxır: dodaqlar bir-birinə sıxılır və açılır.',
    en: 'Both lips press together and then open.',
    ru: 'Обе губы смыкаются и затем размыкаются.',
    ar: 'تخرج من بين الشفتين بانطباقهما.',
    tr: 'İki dudağın birleşmesinden çıkar: dudaklar birbirine bastırılıp açılır.',
  },
  lipsNasal: {
    az: 'İki dodaq yumşaq birləşir, səsin bir hissəsi burundan gəlir (gunnə).',
    en: 'Both lips close gently, and part of the sound comes through the nose (ghunnah).',
    ru: 'Губы мягко смыкаются, часть звука идёт через нос (гунна).',
    ar: 'تخرج من بين الشفتين بانطباقهما انطباقًا خفيفًا، مع غنّة من الخيشوم.',
    tr: 'İki dudak hafifçe birleşir, sesin bir kısmı burundan gelir (gunne).',
  },
  lipTeeth: {
    az: 'Alt dodağın içi ilə üst ön dişlərin ucları arasından çıxır.',
    en: 'The inner part of the lower lip touches the tips of the upper front teeth.',
    ru: 'Внутренняя часть нижней губы касается кончиков верхних передних зубов.',
    ar: 'تخرج من باطن الشفة السفلى مع أطراف الثنايا العليا.',
    tr: 'Alt dudağın iç kısmı ile üst ön dişlerin uçları arasından çıkar.',
  },
  lipsRound: {
    az: 'Dodaqlar dairəvi şəkildə yığılır, lakin tam bağlanmır. Uzatma hərfi olanda (ـُو) səs ağız və boğaz boşluğundan gəlir.',
    en: 'The lips round without fully closing. As a lengthening letter (ـُو) the sound comes from the open space of the mouth and throat.',
    ru: 'Губы округляются, но не смыкаются полностью. Как буква удлинения (ـُو) звук исходит из полости рта и гортани.',
    ar: 'تخرج من بين الشفتين مع انفتاحهما واستدارتهما. وإذا كانت حرف مدّ (ـُو) فمخرجها الجوف.',
    tr: 'Dudaklar yuvarlaklaşır ama tam kapanmaz. Med harfi olduğunda (ـُو) ses ağız ve boğaz boşluğundan gelir.',
  },
  throatDeep: {
    az: 'Boğazın ən dərin, sinəyə yaxın hissəsindən çıxır; yumşaq nəfəslə deyilir.',
    en: 'Comes from the deepest part of the throat, nearest the chest, with a soft breath.',
    ru: 'Исходит из самой глубокой части гортани, ближе к груди, с мягким выдохом.',
    ar: 'تخرج من أقصى الحلق مع جريان النفس.',
    tr: 'Boğazın en derin, göğse yakın kısmından çıkar; yumuşak bir nefesle söylenir.',
  },
  throatMid: {
    az: 'Boğazın orta hissəsindən çıxır: hava daralmış boğazdan sürtünərək keçir.',
    en: 'Comes from the middle of the throat: air passes with friction through the narrowed throat.',
    ru: 'Исходит из середины гортани: воздух с трением проходит через суженное горло.',
    ar: 'تخرج من وسط الحلق مع جريان النفس.',
    tr: 'Boğazın orta kısmından çıkar: hava daralmış boğazdan sürtünerek geçer.',
  },
  throatMidVoiced: {
    az: 'Boğazın orta hissəsindən çıxır — ح ilə eyni yerdən, lakin səs telləri titrəyir.',
    en: 'Comes from the middle of the throat — the same place as ح, but voiced.',
    ru: 'Исходит из середины гортани — оттуда же, откуда ح, но звонко.',
    ar: 'تخرج من وسط الحلق، وهي مجهورة بخلاف الحاء.',
    tr: 'Boğazın orta kısmından çıkar — ح ile aynı yerden, ama ses telleri titrer.',
  },
  throatTop: {
    az: 'Boğazın ağıza ən yaxın (yuxarı) hissəsindən çıxır; hava sürtünərək keçir.',
    en: 'Comes from the upper part of the throat, nearest the mouth; air passes with friction.',
    ru: 'Исходит из верхней части гортани, ближе ко рту; воздух проходит с трением.',
    ar: 'تخرج من أدنى الحلق مما يلي الفم.',
    tr: 'Boğazın ağza en yakın (üst) kısmından çıkar; hava sürtünerek geçer.',
  },
  throatTopVoiced: {
    az: 'Boğazın ağıza ən yaxın hissəsindən çıxır — خ ilə eyni yerdən, lakin səs telləri titrəyir.',
    en: 'Comes from the upper part of the throat — the same place as خ, but voiced.',
    ru: 'Исходит из верхней части гортани — оттуда же, откуда خ, но звонко.',
    ar: 'تخرج من أدنى الحلق مما يلي الفم، وهي مجهورة بخلاف الخاء.',
    tr: 'Boğazın ağza en yakın kısmından çıkar — خ ile aynı yerden, ama ses telleri titrer.',
  },
  tongueBackDeep: {
    az: 'Dilin ən arxa hissəsi ilə onun üstündəki yumşaq damaq arasından çıxır.',
    en: 'The very back of the tongue touches the soft palate above it.',
    ru: 'Самая задняя часть языка смыкается с мягким нёбом над ней.',
    ar: 'تخرج من أقصى اللسان مع ما يحاذيه من الحنك الأعلى.',
    tr: 'Dilin en arka kısmı ile onun üstündeki yumuşak damak arasından çıkar.',
  },
  tongueBack: {
    az: 'Dilin arxa hissəsi ilə damaq arasından çıxır — ق hərfinin yerindən bir az önə.',
    en: 'The back of the tongue touches the palate, slightly forward of where ق is made.',
    ru: 'Задняя часть языка касается нёба — чуть ближе ко рту, чем буква ق.',
    ar: 'تخرج من أقصى اللسان أسفل مخرج القاف قليلًا مع ما يحاذيه من الحنك.',
    tr: 'Dilin arka kısmı ile damak arasından çıkar — ق harfinin yerinden biraz önde.',
  },
  tongueMid: {
    az: 'Dilin orta hissəsi ilə onun üstündəki sərt damaq arasından çıxır.',
    en: 'The middle of the tongue rises to the hard palate above it.',
    ru: 'Средняя часть языка поднимается к твёрдому нёбу.',
    ar: 'تخرج من وسط اللسان مع ما يحاذيه من الحنك الأعلى.',
    tr: 'Dilin orta kısmı ile onun üstündeki sert damak arasından çıkar.',
  },
  tongueMidMadd: {
    az: 'Dilin orta hissəsi sərt damağa doğru qalxır. Uzatma hərfi olanda (ـِي) səs ağız və boğaz boşluğundan gəlir.',
    en: 'The middle of the tongue rises toward the hard palate. As a lengthening letter (ـِي) the sound comes from the open space of the mouth and throat.',
    ru: 'Средняя часть языка поднимается к твёрдому нёбу. Как буква удлинения (ـِي) звук исходит из полости рта и гортани.',
    ar: 'تخرج من وسط اللسان مع ما يحاذيه من الحنك الأعلى. وإذا كانت حرف مدّ (ـِي) فمخرجها الجوف.',
    tr: 'Dilin orta kısmı sert damağa doğru kalkar. Med harfi olduğunda (ـِي) ses ağız ve boğaz boşluğundan gelir.',
  },
  tongueSide: {
    az: 'Dilin bir və ya hər iki yan kənarı ilə üst azı dişləri arasından çıxır.',
    en: 'One or both sides of the tongue press against the upper molars.',
    ru: 'Один или оба боковых края языка прижимаются к верхним коренным зубам.',
    ar: 'تخرج من إحدى حافتي اللسان أو كلتيهما مع ما يليهما من الأضراس العليا.',
    tr: 'Dilin bir veya iki yan kenarı ile üst azı dişleri arasından çıkar.',
  },
  tongueEdges: {
    az: 'Dilin ön kənarları ilə üst ön dişlərin diş ətləri arasından çıxır.',
    en: 'The front edges of the tongue touch the gums of the upper front teeth.',
    ru: 'Передние края языка касаются дёсен верхних передних зубов.',
    ar: 'تخرج من أدنى حافتي اللسان إلى منتهى طرفه مع ما يحاذيها من لثة الأسنان العليا.',
    tr: 'Dilin ön kenarları ile üst ön dişlerin diş etleri arasından çıkar.',
  },
  tongueTipNasal: {
    az: 'Dilin ucu ilə üst ön dişlərin diş əti arasından çıxır; səsin bir hissəsi burundan gəlir (gunnə).',
    en: 'The tip of the tongue touches the gum behind the upper front teeth; part of the sound comes through the nose (ghunnah).',
    ru: 'Кончик языка касается десны за верхними передними зубами; часть звука идёт через нос (гунна).',
    ar: 'تخرج من طرف اللسان مع ما يحاذيه من لثة الثنايا العليا، مع غنّة من الخيشوم.',
    tr: 'Dilin ucu ile üst ön dişlerin diş eti arasından çıkar; sesin bir kısmı burundan gelir (gunne).',
  },
  tongueTipBack: {
    az: 'Dilin ucu ilə üst ön dişlərin diş əti arasından çıxır — ن hərfinin yerindən bir az arxada.',
    en: 'The tip of the tongue touches the gum above the upper front teeth, slightly behind where ن is made.',
    ru: 'Кончик языка касается десны над верхними передними зубами, чуть дальше места буквы ن.',
    ar: 'تخرج من طرف اللسان مع ظهره قليلًا مع ما يحاذيه من لثة الثنايا العليا، وهي أدخل إلى ظهر اللسان من النون.',
    tr: 'Dilin ucu ile üst ön dişlerin diş eti arasından çıkar — ن harfinin yerinden biraz geride.',
  },
  tongueTipRoots: {
    az: 'Dilin ucu ilə üst ön dişlərin dibi arasından çıxır.',
    en: 'The tip of the tongue touches the roots of the upper front teeth.',
    ru: 'Кончик языка касается основания верхних передних зубов.',
    ar: 'تخرج من طرف اللسان مع أصول الثنايا العليا.',
    tr: 'Dilin ucu ile üst ön dişlerin dibi arasından çıkar.',
  },
  tongueTipEdges: {
    az: 'Dilin ucu ilə üst ön dişlərin ucları arasından çıxır; dilin ucu bir az bayıra görünür.',
    en: 'The tip of the tongue touches the edges of the upper front teeth and shows slightly between the teeth.',
    ru: 'Кончик языка касается краёв верхних передних зубов и слегка выглядывает между зубами.',
    ar: 'تخرج من طرف اللسان مع أطراف الثنايا العليا.',
    tr: 'Dilin ucu ile üst ön dişlerin uçları arasından çıkar; dilin ucu biraz dışarı görünür.',
  },
  whistle: {
    az: 'Dilin ucu ilə ön dişlər arasından çıxır; hava dar aralıqdan fit kimi keçir.',
    en: 'The tip of the tongue sits close to the front teeth, and the air passes through a narrow gap with a whistling sound.',
    ru: 'Кончик языка у передних зубов; воздух проходит через узкую щель со свистом.',
    ar: 'تخرج من طرف اللسان مع ما فوق الثنايا السفلى، وفيها صفير.',
    tr: 'Dilin ucu ile ön dişler arasından çıkar; hava dar aralıktan ıslık gibi geçer.',
  },
}

// ── 28 hərf (əlifba sırası) ──
// id — səs faylının adı da budur; ch — tək forma; snd — hecada samitin
// transliterasiyası; tl — adın transliterasiyası; joins:false — sonrakı
// hərfə bitişmir; heavy — qalın (istila) hərf; ex — QW açarı (Qurandan nümunə);
// audio — public/audio/arabic/<audio>.wav və ya null.
const L = (id, ch, snd, tl, makhraj, ex, name, extra = {}) => ({
  id, ch, snd, tl, makhraj, ex, name,
  joins: extra.joins !== false,
  heavy: !!extra.heavy,
  audio: extra.audio === null ? null : id,
})

const RAW_LETTERS = [
  L('alif', 'ا', 'ʾ', 'ʾalif', 'jawf', 'ahad', { az: 'Əlif', en: 'Alif', ru: 'Алиф', ar: 'أَلِف', tr: 'Elif' }, { joins: false }),
  L('ba', 'ب', 'b', 'bāʾ', 'lips', 'bismi', { az: 'Be', en: 'Bāʾ', ru: 'Ба', ar: 'بَاء', tr: 'Be' }),
  L('ta', 'ت', 't', 'tāʾ', 'tongueTipRoots', 'tabbat', { az: 'Te', en: 'Tāʾ', ru: 'Та', ar: 'تَاء', tr: 'Te' }),
  L('tha', 'ث', 'th', 'thāʾ', 'tongueTipEdges', 'thumma', { az: 'Se', en: 'Thāʾ', ru: 'Са', ar: 'ثَاء', tr: 'Se' }),
  L('jim', 'ج', 'j', 'jīm', 'tongueMid', 'jaa', { az: 'Cim', en: 'Jīm', ru: 'Джим', ar: 'جِيم', tr: 'Cim' }),
  L('ha', 'ح', 'ḥ', 'ḥāʾ', 'throatMid', 'hasid', { az: 'Ha', en: 'Ḥāʾ', ru: 'Ха', ar: 'حَاء', tr: 'Ha' }),
  L('kha', 'خ', 'kh', 'khāʾ', 'throatTop', 'khalaqa96', { az: 'Xı', en: 'Khāʾ', ru: 'Ха (хо)', ar: 'خَاء', tr: 'Hı' }, { heavy: true }),
  L('dal', 'د', 'd', 'dāl', 'tongueTipRoots', 'dini', { az: 'Dal', en: 'Dāl', ru: 'Даль', ar: 'دَال', tr: 'Dal' }, { joins: false }),
  L('dhal', 'ذ', 'dh', 'dhāl', 'tongueTipEdges', 'dhalika', { az: 'Zal', en: 'Dhāl', ru: 'Заль', ar: 'ذَال', tr: 'Zel' }, { joins: false }),
  L('ra', 'ر', 'r', 'rāʾ', 'tongueTipBack', 'rabbi', { az: 'Re', en: 'Rāʾ', ru: 'Ра', ar: 'رَاء', tr: 'Ra' }, { joins: false }),
  L('zay', 'ز', 'z', 'zāy', 'whistle', 'zurtum', { az: 'Ze', en: 'Zāy', ru: 'Зай', ar: 'زَاي', tr: 'Ze' }, { joins: false }),
  L('sin', 'س', 's', 'sīn', 'whistle', 'sabbih', { az: 'Sin', en: 'Sīn', ru: 'Син', ar: 'سِين', tr: 'Sin' }),
  L('shin', 'ش', 'sh', 'shīn', 'tongueMid', 'sharri', { az: 'Şin', en: 'Shīn', ru: 'Шин', ar: 'شِين', tr: 'Şın' }),
  L('sad', 'ص', 'ṣ', 'ṣād', 'whistle', 'sirata', { az: 'Sad', en: 'Ṣād', ru: 'Сад', ar: 'صَاد', tr: 'Sad' }, { heavy: true }),
  L('dad', 'ض', 'ḍ', 'ḍād', 'tongueSide', 'daraba', { az: 'Dad', en: 'Ḍād', ru: 'Дад', ar: 'ضَاد', tr: 'Dad' }, { heavy: true }),
  L('ta2', 'ط', 'ṭ', 'ṭāʾ', 'tongueTipRoots', 'tayran', { az: 'Tı', en: 'Ṭāʾ', ru: 'Та (твёрдая)', ar: 'طَاء', tr: 'Tı' }, { heavy: true }),
  L('za2', 'ظ', 'ẓ', 'ẓāʾ', 'tongueTipEdges', 'zahrak', { az: 'Zı', en: 'Ẓāʾ', ru: 'За (твёрдая)', ar: 'ظَاء', tr: 'Zı' }, { heavy: true }),
  L('ayn', 'ع', 'ʿ', 'ʿayn', 'throatMidVoiced', 'allama', { az: 'Eyn', en: 'ʿAyn', ru: 'Айн', ar: 'عَيْن', tr: 'Ayn' }),
  L('ghayn', 'غ', 'gh', 'ghayn', 'throatTopVoiced', 'ghasiq', { az: 'Qeyn', en: 'Ghayn', ru: 'Гайн', ar: 'غَيْن', tr: 'Gayın' }, { heavy: true }),
  L('fa', 'ف', 'f', 'fāʾ', 'lipTeeth', 'faala', { az: 'Fe', en: 'Fāʾ', ru: 'Фа', ar: 'فَاء', tr: 'Fe' }),
  L('qaf', 'ق', 'q', 'qāf', 'tongueBackDeep', 'qul', { az: 'Qaf', en: 'Qāf', ru: 'Каф', ar: 'قَاف', tr: 'Kaf' }, { heavy: true }),
  L('kaf', 'ك', 'k', 'kāf', 'tongueBack', 'kufuwan', { az: 'Kəf', en: 'Kāf', ru: 'Каф (мягкий)', ar: 'كَاف', tr: 'Kef' }),
  L('lam', 'ل', 'l', 'lām', 'tongueEdges', 'lam', { az: 'Lam', en: 'Lām', ru: 'Лям', ar: 'لَام', tr: 'Lam' }),
  L('mim', 'م', 'm', 'mīm', 'lipsNasal', 'malik', { az: 'Mim', en: 'Mīm', ru: 'Мим', ar: 'مِيم', tr: 'Mim' }),
  L('nun', 'ن', 'n', 'nūn', 'tongueTipNasal', 'nasr', { az: 'Nun', en: 'Nūn', ru: 'Нун', ar: 'نُون', tr: 'Nun' }),
  L('ha2', 'ه', 'h', 'hāʾ', 'throatDeep', 'huwa', { az: 'He', en: 'Hāʾ', ru: 'Ха (лёгкая)', ar: 'هَاء', tr: 'He' }),
  L('waw', 'و', 'w', 'wāw', 'lipsRound', 'walasr', { az: 'Vav', en: 'Wāw', ru: 'Вав', ar: 'وَاو', tr: 'Vav' }, { joins: false }),
  L('ya', 'ي', 'y', 'yāʾ', 'tongueMidMadd', 'yalid', { az: 'Ye', en: 'Yāʾ', ru: 'Йа', ar: 'يَاء', tr: 'Ye' }),
]

/** Hərfin 4 forması: tək, sözün əvvəlində, ortasında, sonunda (bitişmə xətti ilə). */
export function letterForms(ch, joins) {
  return joins
    ? { isolated: ch, initial: ch + TATWEEL, medial: TATWEEL + ch + TATWEEL, final: TATWEEL + ch }
    // Bitişməyən hərf sonrakına qoşulmur: əvvəldə tək forma, ortada və sonda yalnız əvvəlkinə bitişir
    : { isolated: ch, initial: ch, medial: TATWEEL + ch, final: TATWEEL + ch }
}

export const LETTERS = RAW_LETTERS.map(l => ({ ...l, forms: letterForms(l.ch, l.joins) }))
export const NON_JOINING = LETTERS.filter(l => !l.joins).map(l => l.ch)
export const HEAVY_LETTERS = LETTERS.filter(l => l.heavy).map(l => l.ch)
export const letterById = (id) => LETTERS.find(l => l.id === id) || null

// ── Hərəkələr ──
// mark — hərəkə işarəsi (birləşən Unicode simvolu), sample — بَ kimi nümunə heca,
// v — hecanın saiti (transliterasiya üçün), ex — QW açarı
export const HARAKAT = [
  {
    id: 'fatha', mark: 'َ', sample: 'بَ', tl: 'ba', ex: 'khalaqa',
    name: { az: 'Fəthə', en: 'Fatḥa', ru: 'Фатха', ar: 'الفَتْحَة', tr: 'Üstün (fetha)' },
    desc: {
      az: 'Hərfin üstündə qısa çəp xətt. Hərfə qısa «a» səsi verir: بَ — «ba».',
      en: 'A short slanted stroke above the letter. It gives a short “a” sound: بَ — “ba”.',
      ru: 'Короткая косая черта над буквой. Даёт краткий звук «а»: بَ — «ба».',
      ar: 'خطّ مائل صغير فوق الحرف، ويُنطق معه الحرف مفتوحًا: بَ.',
      tr: 'Harfin üstünde kısa eğik çizgi. Harfe kısa «a» sesi verir: بَ — «ba».',
    },
  },
  {
    id: 'kasra', mark: 'ِ', sample: 'بِ', tl: 'bi', ex: 'bismi',
    name: { az: 'Kəsrə', en: 'Kasra', ru: 'Касра', ar: 'الكَسْرَة', tr: 'Esre (kesre)' },
    desc: {
      az: 'Hərfin altında qısa çəp xətt. Qısa «i» səsi verir: بِ — «bi».',
      en: 'A short slanted stroke below the letter. It gives a short “i” sound: بِ — “bi”.',
      ru: 'Короткая косая черта под буквой. Даёт краткий звук «и»: بِ — «би».',
      ar: 'خطّ مائل صغير تحت الحرف، ويُنطق معه الحرف مكسورًا: بِ.',
      tr: 'Harfin altında kısa eğik çizgi. Kısa «i» sesi verir: بِ — «bi».',
    },
  },
  {
    id: 'damma', mark: 'ُ', sample: 'بُ', tl: 'bu', ex: 'huwa',
    name: { az: 'Dammə', en: 'Ḍamma', ru: 'Дамма', ar: 'الضَّمَّة', tr: 'Ötre (zamme)' },
    desc: {
      az: 'Hərfin üstündə kiçik vav şəkli. Qısa «u» səsi verir: بُ — «bu».',
      // lang-ok[bu]: «bu» — بُ hecasının transliterasiyasıdır, türkcə söz deyil
      en: 'A small wāw-shaped mark above the letter. It gives a short “u” sound: بُ — “bu”.',
      ru: 'Маленький знак в форме буквы вав над буквой. Даёт краткий звук «у»: بُ — «бу».',
      ar: 'واو صغيرة فوق الحرف، ويُنطق معه الحرف مضمومًا: بُ.',
      tr: 'Harfin üstünde küçük vav şekli. Kısa «u» sesi verir: بُ — «bu».',
    },
  },
  {
    id: 'sukun', mark: 'ْ', sample: 'أَبْ', tl: 'ab', ex: 'qul',
    name: { az: 'Sükun', en: 'Sukūn', ru: 'Сукун', ar: 'السُّكُون', tr: 'Cezm (sükun)' },
    desc: {
      az: 'Hərfin üstündə kiçik dairə. Hərf saitsiz oxunur və əvvəlki hecanı bağlayır: قُلْ — «qul».',
      en: 'A small circle above the letter. The letter has no vowel and closes the syllable before it: قُلْ — “qul”.',
      ru: 'Маленький кружок над буквой. Буква читается без гласного и замыкает предыдущий слог: قُلْ — «куль».',
      ar: 'دائرة صغيرة فوق الحرف تدلّ على أنه ساكن بلا حركة: قُلْ.',
      tr: 'Harfin üstünde küçük daire. Harf ünlüsüz okunur ve önceki heceyi kapatır: قُلْ — «kul».',
    },
  },
  {
    id: 'shadda', mark: 'ّ', sample: 'أَبَّ', tl: 'abba', ex: 'rabbi',
    name: { az: 'Şəddə', en: 'Shadda', ru: 'Шадда', ar: 'الشَّدَّة', tr: 'Şedde' },
    desc: {
      az: 'Hərfin üstündə kiçik dişli işarə. Hərf iki dəfə oxunur — əvvəl saitsiz, sonra hərəkə ilə: رَبِّ — «rab-bi».',
      en: 'A small toothed mark above the letter. The letter is doubled — first without a vowel, then with one: رَبِّ — “rab-bi”.',
      ru: 'Небольшой зубчатый знак над буквой. Буква удваивается — сначала без гласного, затем с огласовкой: رَبِّ — «раб-би».',
      ar: 'علامة صغيرة فوق الحرف تدلّ على أنه حرفان: الأول ساكن والثاني متحرك: رَبِّ.',
      tr: 'Harfin üstünde küçük dişli işaret. Harf iki kez okunur — önce ünlüsüz, sonra harekesiyle: رَبِّ — «rab-bi».',
    },
  },
  {
    id: 'tanwin', mark: 'ً', sample: 'بًا', tl: 'ban', ex: 'kufuwan',
    name: { az: 'Tənvin', en: 'Tanwīn', ru: 'Танвин', ar: 'التَّنْوِين', tr: 'Tenvin' },
    desc: {
      az: 'Qoşa hərəkə sözün sonunda «n» səsi əlavə edir: ـً «an», ـٍ «in», ـٌ «un». Fəthəli tənvindən sonra adətən əlif yazılır; keçid oxunuşda o oxunmur, dayananda isə uzun «ā» oxunur.',
      en: 'A doubled vowel mark adds an “n” sound at the end of a word: ـً “an”, ـٍ “in”, ـٌ “un”. An alif is usually written after fatḥa-tanwīn; it is silent when you read on and becomes a long “ā” when you stop.',
      ru: 'Удвоенная огласовка добавляет в конце слова звук «н»: ـً «ан», ـٍ «ин», ـٌ «ун». После танвина фатха обычно пишется алиф: при слитном чтении он не читается, а при остановке звучит долгое «а».',
      ar: 'حركتان في آخر الاسم تدلّان على نون ساكنة تُنطق ولا تُكتب: ـً ـٍ ـٌ. ويُكتب بعد تنوين الفتح غالبًا ألف لا يُنطق في الوصل، ويُوقف عليه بالمدّ.',
      tr: 'Çift hareke kelimenin sonuna «n» sesi ekler: ـً «an», ـٍ «in», ـٌ «un». Üstün tenvinden sonra genellikle elif yazılır; geçerek okurken okunmaz, durulduğunda ise uzun «ā» okunur.',
    },
    variants: [
      { mark: 'ً', sample: 'بًا', tl: 'ban', ex: 'kufuwan' },
      { mark: 'ٍ', sample: 'بٍ', tl: 'bin', ex: 'ghasiqin' },
      { mark: 'ٌ', sample: 'بٌ', tl: 'bun', ex: 'ahad' },
    ],
  },
  {
    id: 'madd', mark: 'ا', sample: 'بَا', tl: 'bā', ex: 'ma',
    name: { az: 'Uzatma (mədd)', en: 'Lengthening (madd)', ru: 'Удлинение (мадд)', ar: 'المَدّ', tr: 'Uzatma (med)' },
    desc: {
      az: 'Üç mədd hərfi saiti iki hərəkə qədər uzadır: fəthədən sonra ا → «ā», kəsrədən sonra ي → «ī», dammədən sonra و → «ū».',
      en: 'Three madd letters stretch the vowel to two counts: ا after fatḥa → “ā”, ي after kasra → “ī”, و after ḍamma → “ū”.',
      ru: 'Три буквы мадд удлиняют гласный на два счёта: ا после фатхи → «аа», ي после касры → «ии», و после даммы → «уу».',
      ar: 'حروف المدّ ثلاثة: الألف بعد فتح، والياء الساكنة بعد كسر، والواو الساكنة بعد ضم، ويُمدّ الصوت معها حركتين.',
      tr: 'Üç med harfi ünlüyü iki hareke kadar uzatır: üstünden sonra ا → «ā», esreden sonra ي → «ī», ötreden sonra و → «ū».',
    },
    variants: [
      { mark: 'ا', sample: 'بَا', tl: 'bā', ex: 'ma' },
      { mark: 'ي', sample: 'بِي', tl: 'bī', ex: 'rahim' },
      { mark: 'و', sample: 'بُو', tl: 'bū', ex: 'yulad' },
    ],
  },
]

// ── Hərf + hərəkə cədvəli ──
// Rejimlər: fəthə, kəsrə, dammə, sükun, tənvin (3), mədd (3).
// Əlif hərəkə qəbul etmir — onun yerinə həmzə (أ إ ء) yazılır.
export const SYLLABLE_MODES = ['fatha', 'kasra', 'damma', 'sukun', 'tanwin', 'madd']
const F = 'َ', K = 'ِ', D = 'ُ', S = 'ْ'

/** Bir hərf üçün seçilmiş rejimdə hecalar: [{ ar, tl }] (1 və ya 3 heca). Mümkün deyilsə []. */
export function syllables(letter, mode) {
  const isAlif = letter.id === 'alif'
  const c = letter.ch, s = letter.snd
  switch (mode) {
    case 'fatha': return [{ ar: (isAlif ? 'أ' : c) + F, tl: s + 'a' }]
    case 'kasra': return [{ ar: (isAlif ? 'إ' : c) + K, tl: s + 'i' }]
    case 'damma': return [{ ar: (isAlif ? 'أ' : c) + D, tl: s + 'u' }]
    // Sükunlu hərf hecanı başlada bilməz — önünə həmzəli fəthə: أَبْ «ab»
    case 'sukun': return isAlif ? [] : [{ ar: 'أَ' + c + S, tl: 'a' + s }]
    case 'tanwin': {
      const b = isAlif ? 'ء' : c
      return [
        { ar: b + 'ً' + (isAlif ? '' : 'ا'), tl: s + 'an' },
        { ar: b + 'ٍ', tl: s + 'in' },
        { ar: b + 'ٌ', tl: s + 'un' },
      ]
    }
    case 'madd': return [
      { ar: isAlif ? 'آ' : c + F + 'ا', tl: s + 'ā' },
      { ar: (isAlif ? 'إ' : c) + K + 'ي', tl: s + 'ī' },
      { ar: (isAlif ? 'أ' : c) + D + 'و', tl: s + 'ū' },
    ]
    default: return []
  }
}

// ── Oxu məşqi ──
export const READING_TWO = ['min', 'ma', 'fi', 'lam', 'qul', 'huwa']
export const READING_THREE = ['khalaqa', 'ahad', 'yalid', 'waqab', 'hasad', 'lahab']
export const PRACTICE_SURAHS = [
  { n: 1, name: { az: 'Fatihə', en: 'Al-Fātiḥa', ru: 'Аль-Фатиха', ar: 'الفاتحة', tr: 'Fâtiha' } },
  { n: 112, name: { az: 'İxlas', en: 'Al-Ikhlāṣ', ru: 'Аль-Ихлас', ar: 'الإخلاص', tr: 'İhlâs' } },
  { n: 113, name: { az: 'Fələq', en: 'Al-Falaq', ru: 'Аль-Фалак', ar: 'الفلق', tr: 'Felak' } },
  { n: 114, name: { az: 'Nas', en: 'An-Nās', ru: 'Ан-Нас', ar: 'الناس', tr: 'Nâs' } },
]

// ── Təcvidin əsasları ──
// Hər qrupda qaydalar; letters — qaydaya aid hərflər (boşdursa — "qalan hərflər");
// ex — QW açarları; len — mədd uzunluğu (hərəkə ilə).
export const TAJWEED = [
  {
    id: 'lam',
    title: { az: '«Əl» artiklinin oxunuşu', en: 'Reading the article “al-”', ru: 'Чтение артикля «аль»', ar: 'لام التعريف', tr: '«El» takısının okunuşu' },
    rules: [
      {
        id: 'shamsiyya', letters: 'ت ث د ذ ر ز س ش ص ض ط ظ ل ن', ex: ['nas', 'rahman'],
        name: { az: 'Şəmsiyyə lam', en: 'Sun lām (shamsiyya)', ru: 'Солнечная лям (шамсия)', ar: 'اللام الشمسية', tr: 'Şemsî lam' },
        desc: {
          az: '«Əl» artiklindən sonra bu 14 hərfdən biri gələndə lam oxunmur, sonrakı hərf isə şəddə ilə qoşa oxunur.',
          en: 'When “al-” is followed by one of these 14 letters, the lām is silent and the next letter is doubled with a shadda.',
          ru: 'Если после артикля «аль» стоит одна из этих 14 букв, лям не читается, а следующая буква удваивается (шадда).',
          ar: 'إذا جاء بعد «ال» أحد هذه الحروف الأربعة عشر لم تُنطق اللام، وأُدغمت في الحرف التالي فيُشدَّد.',
          tr: '«El» takısından sonra bu 14 harften biri gelirse lam okunmaz, sonraki harf şeddeli olarak çift okunur.',
        },
      },
      {
        id: 'qamariyya', letters: 'ا ب ج ح خ ع غ ف ق ك م و ه ي', ex: ['hamdu', 'falaq'],
        name: { az: 'Qəməriyyə lam', en: 'Moon lām (qamariyya)', ru: 'Лунная лям (камария)', ar: 'اللام القمرية', tr: 'Kamerî lam' },
        desc: {
          az: 'Bu 14 hərfdən əvvəl lam sükunla aydın oxunur: «əl-».',
          en: 'Before these 14 letters the lām carries a sukūn and is pronounced clearly: “al-”.',
          ru: 'Перед этими 14 буквами лям с сукуном читается чётко: «аль-».',
          ar: 'تُظهر اللام ساكنةً قبل هذه الحروف الأربعة عشر.',
          tr: 'Bu 14 harften önce lam cezimli ve açıkça okunur: «el-».',
        },
      },
    ],
  },
  {
    id: 'nun',
    title: { az: 'Sakin nun və tənvin', en: 'Nūn sākinah and tanwīn', ru: 'Нун с сукуном и танвин', ar: 'أحكام النون الساكنة والتنوين', tr: 'Sakin nun ve tenvin' },
    rules: [
      {
        id: 'izhar', letters: 'ء ه ع ح غ خ', ex: ['minalaq'],
        name: { az: 'İzhar', en: 'Iẓhār (clear)', ru: 'Изхар (ясное чтение)', ar: 'الإظهار الحلقي', tr: 'İzhar' },
        desc: {
          az: 'Sakin nun və ya tənvindən sonra boğaz hərflərindən biri gəlsə, «n» gunnəsiz, aydın oxunur.',
          en: 'Before a throat letter, the nūn sākinah or tanwīn is pronounced clearly, without nasal prolonging.',
          ru: 'Перед гортанной буквой нун с сукуном или танвин читается ясно, без гунны.',
          ar: 'إذا وقع بعد النون الساكنة أو التنوين حرف من حروف الحلق أُظهرت النون من غير غنّة زائدة.',
          tr: 'Sakin nun veya tenvinden sonra boğaz harflerinden biri gelirse «n» gunnesiz, açıkça okunur.',
        },
      },
      {
        id: 'idgham', letters: 'ي ر م ل و ن', ex: ['minmasad', 'yakunlahu'],
        name: { az: 'İdğam', en: 'Idghām (merging)', ru: 'Идгам (слияние)', ar: 'الإدغام', tr: 'İdgam' },
        desc: {
          az: 'Bu altı hərfdən əvvəl «n» sonrakı hərfə qatılır: ي ن م و ilə gunnəli, ل ر ilə gunnəsiz. Bir sözün içində idğam olmur.',
          en: 'Before these six letters the “n” merges into the next letter — with ghunnah before ي ن م و, without it before ل ر. There is no idghām within a single word.',
          ru: 'Перед этими шестью буквами «н» сливается со следующей буквой: перед ي ن م و — с гунной, перед ل ر — без неё. Внутри одного слова идгама нет.',
          ar: 'إذا وقع بعدها أحد حروف «يرملون» أُدغمت النون فيه: بغنّة مع (ي ن م و)، وبلا غنّة مع (ل ر). ولا إدغام في كلمة واحدة.',
          tr: 'Bu altı harften önce «n» sonraki harfe katılır: ي ن م و ile gunneli, ل ر ile gunnesiz. Tek kelime içinde idgam olmaz.',
        },
      },
      {
        id: 'iqlab', letters: 'ب', ex: ['yunbadhanna'],
        name: { az: 'İqlab', en: 'Iqlāb (conversion)', ru: 'Иклаб (замена)', ar: 'الإقلاب', tr: 'İklab' },
        desc: {
          az: 'Ba hərfindən əvvəl «n» «m» səsinə çevrilir və gunnə ilə oxunur. Mushafda onun üstündə kiçik mim (ۢ) yazılır.',
          en: 'Before bāʾ the “n” turns into an “m” sound, held with ghunnah. A small mīm (ۢ) marks it in the muṣḥaf.',
          ru: 'Перед ба «н» превращается в «м» и читается с гунной. В мусхафе над ней пишется маленькая мим (ۢ).',
          ar: 'إذا وقع بعدها الباء قُلبت النون ميمًا مخفاةً بغنّة، ويُرسم فوقها ميم صغيرة (ۢ).',
          tr: 'Be harfinden önce «n», «m» sesine dönüşür ve gunneyle okunur. Mushafta üstüne küçük bir mim (ۢ) yazılır.',
        },
      },
      {
        id: 'ikhfa', letters: 'ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك', ex: ['minsharri'],
        name: { az: 'İxfa', en: 'Ikhfāʾ (concealing)', ru: 'Ихфа (скрытие)', ar: 'الإخفاء', tr: 'İhfa' },
        desc: {
          az: 'Qalan 15 hərfdən əvvəl «n» izharla idğam arasında, gizli və gunnə ilə oxunur.',
          en: 'Before the remaining 15 letters the “n” is hidden — between clear and merged — with ghunnah.',
          ru: 'Перед остальными 15 буквами «н» читается скрыто — между ясным и слитным чтением — с гунной.',
          ar: 'إذا وقع بعدها أحد الحروف الخمسة عشر الباقية أُخفيت النون بين الإظهار والإدغام مع الغنّة.',
          tr: 'Kalan 15 harften önce «n», izhar ile idgam arasında, gizli ve gunneyle okunur.',
        },
      },
    ],
  },
  {
    id: 'mim',
    title: { az: 'Sakin mim', en: 'Mīm sākinah', ru: 'Мим с сукуном', ar: 'أحكام الميم الساكنة', tr: 'Sakin mim' },
    rules: [
      {
        id: 'ikhfaShafawi', letters: 'ب', ex: ['tarmihim'],
        name: { az: 'Şifəvi ixfa', en: 'Labial ikhfāʾ', ru: 'Губное ихфа', ar: 'الإخفاء الشفوي', tr: 'İhfa-i şefevi' },
        desc: {
          az: 'Sakin mimdən sonra ba gəlsə, mim gizli və gunnə ilə oxunur.',
          en: 'When a mīm sākinah is followed by bāʾ, the mīm is hidden and held with ghunnah.',
          ru: 'Если после мим с сукуном идёт ба, мим читается скрыто, с гунной.',
          ar: 'إذا وقع بعد الميم الساكنة باءٌ أُخفيت الميم مع الغنّة.',
          tr: 'Sakin mimden sonra be gelirse mim gizli ve gunneyle okunur.',
        },
      },
      {
        id: 'idghamShafawi', letters: 'م', ex: ['alayhimmu'],
        name: { az: 'Misleyn idğamı', en: 'Merging of two mīms', ru: 'Слияние двух мим', ar: 'إدغام المثلين الصغير', tr: 'İdgam-ı misleyn' },
        desc: {
          az: 'Sakin mimdən sonra mim gəlsə, ikisi birləşib şəddəli bir mim kimi gunnə ilə oxunur.',
          en: 'When a mīm sākinah meets another mīm, they merge into one doubled mīm held with ghunnah.',
          ru: 'Если после мим с сукуном идёт мим, они сливаются в одну удвоенную мим с гунной.',
          ar: 'إذا وقع بعد الميم الساكنة ميمٌ أُدغمت فيها مع الغنّة.',
          tr: 'Sakin mimden sonra mim gelirse ikisi birleşip şeddeli tek mim gibi gunneyle okunur.',
        },
      },
      {
        id: 'izharShafawi', letters: '', ex: ['anamta'],
        name: { az: 'Şifəvi izhar', en: 'Labial iẓhār', ru: 'Губной изхар', ar: 'الإظهار الشفوي', tr: 'İzhar-ı şefevi' },
        desc: {
          az: 'Qalan bütün hərflərdən əvvəl mim aydın oxunur; و və ف hərflərindən əvvəl buna xüsusilə diqqət edilir.',
          en: 'Before all other letters the mīm is pronounced clearly; take special care before و and ف.',
          ru: 'Перед всеми остальными буквами мим читается ясно; особенно внимательно — перед و и ف.',
          ar: 'تُظهر الميم الساكنة عند بقية الحروف، ويشتدّ الإظهار عند الواو والفاء.',
          tr: 'Diğer bütün harflerden önce mim açıkça okunur; و ve ف harflerinden önce buna özellikle dikkat edilir.',
        },
      },
    ],
  },
  {
    id: 'qalqala',
    title: { az: 'Qalqalə', en: 'Qalqalah', ru: 'Калькаля', ar: 'القلقلة', tr: 'Kalkale' },
    rules: [
      {
        id: 'qalqala', letters: 'ق ط ب ج د', ex: ['yalid', 'falaq'],
        name: { az: 'Qalqalə hərfləri', en: 'Qalqalah letters', ru: 'Буквы калькаля', ar: 'حروف القلقلة', tr: 'Kalkale harfleri' },
        desc: {
          az: 'Bu beş hərf (قُطْبُ جَدٍّ) sükunlu olanda yüngül əks-səda ilə oxunur; sözün sonunda dayananda bu səs daha güclü olur.',
          en: 'These five letters (quṭbu jaddin) bounce with a slight echo when they carry a sukūn; the bounce is stronger when you stop at the end of a word.',
          ru: 'Эти пять букв (кутбу джаддин) при сукуне читаются с лёгким отзвуком; при остановке в конце слова он сильнее.',
          ar: 'حروفها خمسة يجمعها «قُطْبُ جَدٍّ»، وتُقلقل إذا كانت ساكنة، وتكون أقوى عند الوقف.',
          tr: 'Bu beş harf (kutbu ceddin) cezimli olduğunda hafif bir yankıyla okunur; kelimenin sonunda durulunca bu ses daha güçlü olur.',
        },
      },
    ],
  },
  {
    id: 'madd',
    title: { az: 'Mədd növləri', en: 'Types of madd', ru: 'Виды мадда', ar: 'أنواع المدّ', tr: 'Med çeşitleri' },
    intro: {
      az: 'Uzunluq hərəkə ilə ölçülür — təxminən bir qısa saitin müddəti qədər.',
      en: 'Length is counted in ḥarakāt — roughly the length of one short vowel.',
      ru: 'Длительность считается в харакатах — примерно длительность одного краткого гласного.',
      ar: 'يُقدَّر المدّ بالحركات، والحركة زمن نطق حرف متحرك.',
      tr: 'Uzunluk harekeyle ölçülür — yaklaşık bir kısa ünlünün süresi kadar.',
    },
    rules: [
      {
        id: 'tabii', len: '2', letters: 'ا و ي', ex: ['maluhu'],
        name: { az: 'Təbii mədd', en: 'Natural madd (ṭabīʿī)', ru: 'Естественный мадд (табии)', ar: 'المدّ الطبيعي', tr: 'Med-i tabii' },
        desc: {
          az: 'Mədd hərfindən sonra nə həmzə, nə də sükun gəlir — 2 hərəkə uzadılır.',
          en: 'No hamza or sukūn follows the madd letter — hold it for 2 counts.',
          ru: 'После буквы мадд нет ни хамзы, ни сукуна — тянется на 2 счёта.',
          ar: 'ما لا يتوقف على سبب من همز أو سكون، ويُمدّ حركتين.',
          tr: 'Med harfinden sonra hemze veya sükun gelmez — 2 hareke uzatılır.',
        },
      },
      {
        id: 'muttasil', len: '4–5', letters: '', ex: ['jaa'],
        name: { az: 'Müttəsil mədd', en: 'Connected madd (muttaṣil)', ru: 'Слитный мадд (муттасыль)', ar: 'المدّ المتصل', tr: 'Med-i muttasıl' },
        desc: {
          az: 'Mədd hərfindən sonra həmzə eyni sözdə gəlir — Həfs qiraətində (Şatibiyyə yolu ilə) 4–5 hərəkə.',
          en: 'A hamza follows the madd letter in the same word — 4–5 counts in Ḥafṣ (via ash-Shāṭibiyya).',
          ru: 'Хамза следует за буквой мадд в том же слове — 4–5 счётов в чтении Хафс (по аш-Шатибии).',
          ar: 'أن يأتي بعد حرف المدّ همزٌ في كلمة واحدة، ويُمدّ أربع أو خمس حركات لحفص من طريق الشاطبية.',
          tr: 'Med harfinden sonra hemze aynı kelimede gelir — Hafs kıraatinde (Şatıbiyye tarikiyle) 4–5 hareke.',
        },
      },
      {
        id: 'munfasil', len: '4–5', letters: '', ex: ['inna'],
        name: { az: 'Münfəsil mədd', en: 'Separated madd (munfaṣil)', ru: 'Раздельный мадд (мунфасыль)', ar: 'المدّ المنفصل', tr: 'Med-i munfasıl' },
        desc: {
          az: 'Mədd hərfi sözün sonunda, həmzə isə növbəti sözün əvvəlindədir — Həfs qiraətində (Şatibiyyə yolu ilə) 4–5 hərəkə.',
          en: 'The madd letter ends one word and a hamza begins the next — 4–5 counts in Ḥafṣ (via ash-Shāṭibiyya).',
          ru: 'Буква мадд стоит в конце слова, а хамза — в начале следующего: 4–5 счётов в чтении Хафс (по аш-Шатибии).',
          ar: 'أن يكون حرف المدّ في آخر كلمة والهمز في أول الكلمة التالية، ويُمدّ أربع أو خمس حركات لحفص من طريق الشاطبية.',
          tr: 'Med harfi kelimenin sonunda, hemze ise sonraki kelimenin başındadır — Hafs kıraatinde (Şatıbiyye tarikiyle) 4–5 hareke.',
        },
      },
      {
        id: 'lazim', len: '6', letters: '', ex: ['dallin'],
        name: { az: 'Lazım mədd', en: 'Necessary madd (lāzim)', ru: 'Обязательный мадд (лязим)', ar: 'المدّ اللازم', tr: 'Med-i lazım' },
        desc: {
          az: 'Mədd hərfindən sonra daimi sükun və ya şəddə gəlir — 6 hərəkə.',
          en: 'A permanent sukūn or shadda follows the madd letter — 6 counts.',
          ru: 'После буквы мадд стоит постоянный сукун или шадда — 6 счётов.',
          ar: 'أن يأتي بعد حرف المدّ سكونٌ أصلي وصلًا ووقفًا، ويُمدّ ست حركات.',
          tr: 'Med harfinden sonra kalıcı sükun veya şedde gelir — 6 hareke.',
        },
      },
      {
        id: 'arid', len: '2 · 4 · 6', letters: '', ex: ['alamin'],
        name: { az: 'Arid mədd (dayananda)', en: 'Madd at a stop (ʿāriḍ)', ru: 'Мадд при остановке (арид)', ar: 'المدّ العارض للسكون', tr: 'Med-i ârız' },
        desc: {
          az: 'Mədd hərfindən sonrakı hərf yalnız dayanma səbəbilə sakin olur — 2, 4 və ya 6 hərəkə.',
          en: 'The letter after the madd becomes silent only because you stop there — 2, 4 or 6 counts.',
          ru: 'Буква после мадда становится без огласовки только из-за остановки — 2, 4 или 6 счётов.',
          ar: 'أن يأتي بعد حرف المدّ سكونٌ عارض لأجل الوقف، ويجوز فيه حركتان أو أربع أو ست.',
          tr: 'Med harfinden sonraki harf yalnızca durma sebebiyle sakin olur — 2, 4 veya 6 hareke.',
        },
      },
    ],
  },
]

// ── Dərslər ──
// glyph — kartdakı dekorativ ərəbcə nümunə
export const LESSONS = [
  {
    id: 'letters', glyph: 'أ ب ت',
    title: { az: 'Hərflər', en: 'The letters', ru: 'Буквы', ar: 'الحروف', tr: 'Harfler' },
    desc: {
      az: '28 hərf: formaları, adları, çıxış yerləri və Qurandan nümunə sözlər.',
      en: '28 letters: their shapes, names, points of articulation and example words from the Quran.',
      ru: '28 букв: формы, названия, места образования и примеры слов из Корана.',
      ar: 'ثمانية وعشرون حرفًا: أشكالها وأسماؤها ومخارجها وأمثلة من القرآن.',
      tr: '28 harf: şekilleri, adları, çıkış yerleri ve Kur’an’dan örnek kelimeler.',
    },
  },
  {
    id: 'harakat', glyph: 'بَ بِ بُ',
    title: { az: 'Hərəkələr', en: 'Vowel marks', ru: 'Огласовки', ar: 'الحركات', tr: 'Harekeler' },
    desc: {
      az: 'Fəthə, kəsrə, dammə, sükun, şəddə, tənvin və uzatma; hərf və hərəkə cədvəli.',
      en: 'Fatḥa, kasra, ḍamma, sukūn, shadda, tanwīn and lengthening, with a letter-and-vowel table.',
      ru: 'Фатха, касра, дамма, сукун, шадда, танвин и удлинение; таблица букв с огласовками.',
      ar: 'الفتحة والكسرة والضمة والسكون والشدة والتنوين والمدّ، مع جدول الحروف والحركات.',
      tr: 'Üstün, esre, ötre, cezm, şedde, tenvin ve uzatma; harf ve hareke tablosu.',
    },
  },
  {
    id: 'reading', glyph: 'قُلْ هُوَ',
    title: { az: 'Hecalar və oxu', en: 'Syllables and reading', ru: 'Слоги и чтение', ar: 'المقاطع والقراءة', tr: 'Heceler ve okuma' },
    desc: {
      az: 'İki və üç hərfli sözlərdən Fatihə, İxlas, Fələq və Nas surələrinə — söz-söz.',
      en: 'From two- and three-letter words to Al-Fātiḥa, Al-Ikhlāṣ, Al-Falaq and An-Nās, word by word.',
      ru: 'От слов из двух и трёх букв к сурам Аль-Фатиха, Аль-Ихлас, Аль-Фалак и Ан-Нас — слово за словом.',
      ar: 'من الكلمات الثنائية والثلاثية إلى سور الفاتحة والإخلاص والفلق والناس كلمةً كلمة.',
      tr: 'İki ve üç harfli kelimelerden Fâtiha, İhlâs, Felak ve Nâs surelerine — kelime kelime.',
    },
  },
  {
    id: 'tajweed', glyph: 'مَدّ',
    title: { az: 'Təcvidin əsasları', en: 'Basics of tajwīd', ru: 'Основы таджвида', ar: 'أساسيات التجويد', tr: 'Tecvidin temelleri' },
    desc: {
      az: 'Əl artikli, sakin nun və tənvin, sakin mim, qalqalə və mədd növləri.',
      en: 'The article al-, nūn sākinah and tanwīn, mīm sākinah, qalqalah and the types of madd.',
      ru: 'Артикль «аль», нун с сукуном и танвин, мим с сукуном, калькаля и виды мадда.',
      ar: 'لام التعريف، والنون الساكنة والتنوين، والميم الساكنة، والقلقلة، وأنواع المدّ.',
      tr: '«El» takısı, sakin nun ve tenvin, sakin mim, kalkale ve med çeşitleri.',
    },
  },
]

// ── AVTOMATİK YARADILIB: Quran sözləri (api.alquran.cloud, nəşr quran-uthmani, 2026-10-30) ──
// w — sözün Osmani yazılışı (Quran mətnindən hərfi-hərfinə), ref — surə:ayə,
// g — Quranda ümumi ayə nömrəsi (səs faylı üçün), tl — hərəkələrə uyğun transliterasiya.
export const QW = {
  ahad: { w: 'أَحَدٌ', ref: '112:1', g: 6222, tl: 'aḥadun' },
  bismi: { w: 'بِسْمِ', ref: '1:1', g: 1, tl: 'bismi' },
  tabbat: { w: 'تَبَّتْ', ref: '111:1', g: 6217, tl: 'tabbat' },
  thumma: { w: 'ثُمَّ', ref: '102:4', g: 6172, tl: 'thumma' },
  jaa: { w: 'جَآءَ', ref: '110:1', g: 6214, tl: 'jāʾa' },
  hasid: { w: 'حَاسِدٍ', ref: '113:5', g: 6230, tl: 'ḥāsidin' },
  khalaqa96: { w: 'خَلَقَ', ref: '96:2', g: 6108, tl: 'khalaqa' },
  dini: { w: 'دِينِ', ref: '109:6', g: 6213, tl: 'dīni' },
  dhalika: { w: 'ذَٰلِكَ', ref: '2:2', g: 9, tl: 'dhālika' },
  rabbi: { w: 'رَبِّ', ref: '1:2', g: 2, tl: 'rabbi' },
  zurtum: { w: 'زُرْتُمُ', ref: '102:2', g: 6170, tl: 'zurtumu' },
  sabbih: { w: 'سَبِّحِ', ref: '87:1', g: 5949, tl: 'sabbiḥi' },
  sharri: { w: 'شَرِّ', ref: '113:2', g: 6227, tl: 'sharri' },
  sirata: { w: 'صِرَٰطَ', ref: '1:7', g: 7, tl: 'ṣirāṭa' },
  daraba: { w: 'ضَرَبَ', ref: '14:24', g: 1774, tl: 'ḍaraba' },
  tayran: { w: 'طَيْرًا', ref: '105:3', g: 6191, tl: 'ṭayran' },
  zahrak: { w: 'ظَهْرَكَ', ref: '94:3', g: 6093, tl: 'ẓahraka' },
  allama: { w: 'عَلَّمَ', ref: '96:5', g: 6111, tl: 'ʿallama' },
  ghasiq: { w: 'غَاسِقٍ', ref: '113:3', g: 6228, tl: 'ghāsiqin' },
  faala: { w: 'فَعَلَ', ref: '105:1', g: 6189, tl: 'faʿala' },
  qul: { w: 'قُلْ', ref: '112:1', g: 6222, tl: 'qul' },
  kufuwan: { w: 'كُفُوًا', ref: '112:4', g: 6225, tl: 'kufuwan' },
  lam: { w: 'لَمْ', ref: '112:3', g: 6224, tl: 'lam' },
  malik: { w: 'مَلِكِ', ref: '114:2', g: 6232, tl: 'maliki' },
  nasr: { w: 'نَصْرُ', ref: '110:1', g: 6214, tl: 'naṣru' },
  huwa: { w: 'هُوَ', ref: '112:1', g: 6222, tl: 'huwa' },
  walasr: { w: 'وَٱلْعَصْرِ', ref: '103:1', g: 6177, tl: 'wal-ʿaṣri' },
  yalid: { w: 'يَلِدْ', ref: '112:3', g: 6224, tl: 'yalid' },
  min: { w: 'مِن', ref: '113:2', g: 6227, tl: 'min' },
  ma: { w: 'مَا', ref: '113:2', g: 6227, tl: 'mā' },
  fi: { w: 'فِى', ref: '113:4', g: 6229, tl: 'fī' },
  khalaqa: { w: 'خَلَقَ', ref: '113:2', g: 6227, tl: 'khalaqa' },
  waqab: { w: 'وَقَبَ', ref: '113:3', g: 6228, tl: 'waqaba' },
  hasad: { w: 'حَسَدَ', ref: '113:5', g: 6230, tl: 'ḥasada' },
  lahab: { w: 'لَهَبٍۢ', ref: '111:3', g: 6219, tl: 'lahabin' },
  ghasiqin: { w: 'غَاسِقٍ', ref: '113:3', g: 6228, tl: 'ghāsiqin' },
  rahim: { w: 'ٱلرَّحِيمِ', ref: '1:1', g: 1, tl: 'ar-raḥīmi' },
  yulad: { w: 'يُولَدْ', ref: '112:3', g: 6224, tl: 'yūlad' },
  nas: { w: 'ٱلنَّاسِ', ref: '114:1', g: 6231, tl: 'an-nāsi' },
  rahman: { w: 'ٱلرَّحْمَٰنِ', ref: '1:1', g: 1, tl: 'ar-raḥmāni' },
  hamdu: { w: 'ٱلْحَمْدُ', ref: '1:2', g: 2, tl: 'al-ḥamdu' },
  falaq: { w: 'ٱلْفَلَقِ', ref: '113:1', g: 6226, tl: 'al-falaqi' },
  minalaq: { w: 'مِنْ عَلَقٍ', ref: '96:2', g: 6108, tl: 'min ʿalaqin' },
  minmasad: { w: 'مِّن مَّسَدٍۭ', ref: '111:5', g: 6221, tl: 'mim-masadin' },
  yakunlahu: { w: 'يَكُن لَّهُۥ', ref: '112:4', g: 6225, tl: 'yakul-lahū' },
  yunbadhanna: { w: 'لَيُنۢبَذَنَّ', ref: '104:4', g: 6183, tl: 'layumbadhanna' },
  minsharri: { w: 'مِن شَرِّ', ref: '113:2', g: 6227, tl: 'min sharri' },
  tarmihim: { w: 'تَرْمِيهِم بِحِجَارَةٍۢ', ref: '105:4', g: 6192, tl: 'tarmīhim biḥijāratin' },
  alayhimmu: { w: 'عَلَيْهِم مُّؤْصَدَةٌۭ', ref: '104:8', g: 6187, tl: 'ʿalayhim-muʾṣadatun' },
  anamta: { w: 'أَنْعَمْتَ', ref: '1:7', g: 7, tl: 'anʿamta' },
  maluhu: { w: 'مَالُهُۥ', ref: '111:2', g: 6218, tl: 'māluhū' },
  inna: { w: 'إِنَّآ أَعْطَيْنَٰكَ', ref: '108:1', g: 6205, tl: 'innā aʿṭaynāka' },
  dallin: { w: 'ٱلضَّآلِّينَ', ref: '1:7', g: 7, tl: 'aḍ-ḍāllīna' },
  alamin: { w: 'ٱلْعَٰلَمِينَ', ref: '1:2', g: 2, tl: 'al-ʿālamīna' },
}

// Oxu məşqi surələri: hər ayə söz-söz (1-ci ayədəki təkrar Bəsmələ çıxarılıb — utils/quranText.js qaydası)
export const PRACTICE_AYAHS = {
  1: [
    { ref: '1:1', g: 1, words: [['بِسْمِ', 'bismi'], ['ٱللَّهِ', 'llāhi'], ['ٱلرَّحْمَٰنِ', 'r-raḥmāni'], ['ٱلرَّحِيمِ', 'r-raḥīm']] },
    { ref: '1:2', g: 2, words: [['ٱلْحَمْدُ', 'al-ḥamdu'], ['لِلَّهِ', 'lillāhi'], ['رَبِّ', 'rabbi'], ['ٱلْعَٰلَمِينَ', 'l-ʿālamīn']] },
    { ref: '1:3', g: 3, words: [['ٱلرَّحْمَٰنِ', 'ar-raḥmāni'], ['ٱلرَّحِيمِ', 'r-raḥīm']] },
    { ref: '1:4', g: 4, words: [['مَٰلِكِ', 'māliki'], ['يَوْمِ', 'yawmi'], ['ٱلدِّينِ', 'd-dīn']] },
    { ref: '1:5', g: 5, words: [['إِيَّاكَ', 'iyyāka'], ['نَعْبُدُ', 'naʿbudu'], ['وَإِيَّاكَ', 'wa-iyyāka'], ['نَسْتَعِينُ', 'nastaʿīn']] },
    { ref: '1:6', g: 6, words: [['ٱهْدِنَا', 'ihdinā'], ['ٱلصِّرَٰطَ', 'ṣ-ṣirāṭa'], ['ٱلْمُسْتَقِيمَ', 'l-mustaqīm']] },
    { ref: '1:7', g: 7, words: [['صِرَٰطَ', 'ṣirāṭa'], ['ٱلَّذِينَ', 'lladhīna'], ['أَنْعَمْتَ', 'anʿamta'], ['عَلَيْهِمْ', 'ʿalayhim'], ['غَيْرِ', 'ghayri'], ['ٱلْمَغْضُوبِ', 'l-maghḍūbi'], ['عَلَيْهِمْ', 'ʿalayhim'], ['وَلَا', 'wa-lā'], ['ٱلضَّآلِّينَ', 'ḍ-ḍāllīn']] },
  ],
  112: [
    { ref: '112:1', g: 6222, words: [['قُلْ', 'qul'], ['هُوَ', 'huwa'], ['ٱللَّهُ', 'llāhu'], ['أَحَدٌ', 'aḥad']] },
    { ref: '112:2', g: 6223, words: [['ٱللَّهُ', 'allāhu'], ['ٱلصَّمَدُ', 'ṣ-ṣamad']] },
    { ref: '112:3', g: 6224, words: [['لَمْ', 'lam'], ['يَلِدْ', 'yalid'], ['وَلَمْ', 'wa-lam'], ['يُولَدْ', 'yūlad']] },
    { ref: '112:4', g: 6225, words: [['وَلَمْ', 'wa-lam'], ['يَكُن', 'yakun'], ['لَّهُۥ', 'lahū'], ['كُفُوًا', 'kufuwan'], ['أَحَدٌۢ', 'aḥad']] },
  ],
  113: [
    { ref: '113:1', g: 6226, words: [['قُلْ', 'qul'], ['أَعُوذُ', 'aʿūdhu'], ['بِرَبِّ', 'bi-rabbi'], ['ٱلْفَلَقِ', 'l-falaq']] },
    { ref: '113:2', g: 6227, words: [['مِن', 'min'], ['شَرِّ', 'sharri'], ['مَا', 'mā'], ['خَلَقَ', 'khalaq']] },
    { ref: '113:3', g: 6228, words: [['وَمِن', 'wa-min'], ['شَرِّ', 'sharri'], ['غَاسِقٍ', 'ghāsiqin'], ['إِذَا', 'idhā'], ['وَقَبَ', 'waqab']] },
    { ref: '113:4', g: 6229, words: [['وَمِن', 'wa-min'], ['شَرِّ', 'sharri'], ['ٱلنَّفَّٰثَٰتِ', 'n-naffāthāti'], ['فِى', 'fī'], ['ٱلْعُقَدِ', 'l-ʿuqad']] },
    { ref: '113:5', g: 6230, words: [['وَمِن', 'wa-min'], ['شَرِّ', 'sharri'], ['حَاسِدٍ', 'ḥāsidin'], ['إِذَا', 'idhā'], ['حَسَدَ', 'ḥasad']] },
  ],
  114: [
    { ref: '114:1', g: 6231, words: [['قُلْ', 'qul'], ['أَعُوذُ', 'aʿūdhu'], ['بِرَبِّ', 'bi-rabbi'], ['ٱلنَّاسِ', 'n-nās']] },
    { ref: '114:2', g: 6232, words: [['مَلِكِ', 'maliki'], ['ٱلنَّاسِ', 'n-nās']] },
    { ref: '114:3', g: 6233, words: [['إِلَٰهِ', 'ilāhi'], ['ٱلنَّاسِ', 'n-nās']] },
    { ref: '114:4', g: 6234, words: [['مِن', 'min'], ['شَرِّ', 'sharri'], ['ٱلْوَسْوَاسِ', 'l-waswāsi'], ['ٱلْخَنَّاسِ', 'l-khannās']] },
    { ref: '114:5', g: 6235, words: [['ٱلَّذِى', 'alladhī'], ['يُوَسْوِسُ', 'yuwaswisu'], ['فِى', 'fī'], ['صُدُورِ', 'ṣudūri'], ['ٱلنَّاسِ', 'n-nās']] },
    { ref: '114:6', g: 6236, words: [['مِنَ', 'mina'], ['ٱلْجِنَّةِ', 'l-jinnati'], ['وَٱلنَّاسِ', 'wa-n-nās']] },
  ],
}
