// ═══════════════════════════════════════════════════════
// Hədisi rəvayət edən səhabə — ad 5 dildə (lang-ok: ad transliterasiyasıdır)
//
// scripts/build-hadith-full.mjs ingilis nəşrinin başlığındakı adı ("Narrated
// Abu Huraira:") aşağıdakı ləqəblərlə tutuşdurur və public/data/hadith-full/
// <id>.json-a `nid` (açar) yazır. Yalnız TƏK mənalı adlar — "Abdullah",
// "Sahl", "Salman" kimi qeyri-müəyyənlər, eləcə də tabiinlər (isnaddakı
// başqa ravilər) burada yoxdur: onda ravi sətri göstərilmir, tam mətndə
// isnad olduğu kimi qalır.
// ═══════════════════════════════════════════════════════

// key: [ləqəblər (kiçik hərf, apostrofsuz, ibn→bin)], az, en, ru, tr, ar
const N = {
  abuhurayra: [['abu huraira', 'abu hurairah', 'abuhurayrah', 'abu hurayrah', 'abu harairah'], 'Əbu Hureyrə', 'Abu Hurayrah', 'Абу Хурайра', 'Ebû Hüreyre', 'أبو هريرة'],
  anas: [['anas bin malik', 'anas', 'anas b malik'], 'Ənəs ibn Malik', 'Anas ibn Malik', 'Анас ибн Малик', 'Enes b. Mâlik', 'أنس بن مالك'],
  ibnamr: [['abdullah bin amr', 'abdullah bin amr bin al as', 'abdullah b amr b al as', 'abdullah b amr'], 'Abdullah ibn Amr', 'Abdullah ibn Amr', 'Абдуллах ибн Амр', 'Abdullah b. Amr', 'عبد الله بن عمرو'],
  ibnabbas: [['bin abbas', 'abdullah bin abbas'], 'İbn Abbas', 'Ibn Abbas', 'Ибн Аббас', 'İbn Abbas', 'ابن عباس'],
  khudri: [['abu said al khudri', 'abusaid al khudri', 'abu said', 'abu said khudri', 'abu saeed'], 'Əbu Səid əl-Xudri', 'Abu Sa‘id al-Khudri', 'Абу Саид аль-Худри', 'Ebû Saîd el-Hudrî', 'أبو سعيد الخدري'],
  jabir: [['jabir', 'jabir bin abdullah', 'jabir b abdullah'], 'Cabir ibn Abdullah', 'Jabir ibn Abdullah', 'Джабир ибн Абдуллах', 'Câbir b. Abdullah', 'جابر بن عبد الله'],
  ibnumar: [['bin umar', 'abdullah bin umar'], 'Abdullah ibn Ömər', 'Abdullah ibn Umar', 'Абдуллах ибн Умар', 'Abdullah b. Ömer', 'عبد الله بن عمر'],
  aisha: [['aisha', 'aishah', 'aisha ummul muminin'], 'Aişə', 'Aishah', 'Аиша', 'Hz. Âişe', 'عائشة'],
  abudharr: [['abu dharr', 'abu dharr al ghifari'], 'Əbu Zərr', 'Abu Dharr', 'Абу Зарр', 'Ebû Zer', 'أبو ذر'],
  abuumama: [['abu umama', 'abuumamah', 'abu umamah'], 'Əbu Umamə', 'Abu Umamah', 'Абу Умама', 'Ebû Ümâme', 'أبو أمامة'],
  abumalik: [['abu malik at ashari', 'abumalik al ashari', 'abu malik al ashari'], 'Əbu Malik əl-Əşəri', 'Abu Malik al-Ash‘ari', 'Абу Малик аль-Аш‘ари', 'Ebû Mâlik el-Eş‘arî', 'أبو مالك الأشعري'],
  sahl: [['sahl bin sad', 'sahl bin sad as saidi', 'sahl b sad as saidi'], 'Səhl ibn Səd', 'Sahl ibn Sa‘d', 'Сахль ибн Са‘д', 'Sehl b. Sa‘d', 'سهل بن سعد'],
  ubada: [['ubada bin as samit', 'ubadah bin as samit'], 'Ubadə ibn Samit', 'Ubadah ibn as-Samit', 'Убада ибн ас-Самит', 'Ubâde b. Sâmit', 'عبادة بن الصامت'],
  abuqatada: [['abu qatada', 'abu qatadah'], 'Əbu Qatadə', 'Abu Qatadah', 'Абу Катада', 'Ebû Katâde', 'أبو قتادة'],
  abumusa: [['abu musa', 'abu musa al ashari', 'abumusa al ashari'], 'Əbu Musa əl-Əşəri', 'Abu Musa al-Ash‘ari', 'Абу Муса аль-Аш‘ари', 'Ebû Mûsâ el-Eş‘arî', 'أبو موسى الأشعري'],
  hakim: [['hakim bin hizam'], 'Hakim ibn Hizam', 'Hakim ibn Hizam', 'Хаким ибн Хизам', 'Hakîm b. Hizâm', 'حكيم بن حزام'],
  ibnmasud: [['abdullah bin masud'], 'Abdullah ibn Məsud', 'Abdullah ibn Mas‘ud', 'Абдуллах ибн Мас‘уд', 'Abdullah b. Mes‘ûd', 'عبد الله بن مسعود'],
  abudarda: [['abu darda', 'abu ad dardh', 'abuddarda', 'abu ad darda'], 'Əbud-Dərda', 'Abu ad-Darda', 'Абу ад-Дарда', 'Ebu’d-Derdâ', 'أبو الدرداء'],
  uthman: [['uthman', 'uthman b affan', 'uthman bin affan'], 'Osman ibn Əffan', 'Uthman ibn Affan', 'Усман ибн Аффан', 'Hz. Osman', 'عثمان بن عفان'],
  suhaib: [['suhaib'], 'Süheyb', 'Suhayb', 'Сухайб', 'Suheyb', 'صهيب'],
  muawiya: [['muawiya'], 'Müaviyə', 'Mu‘awiyah', 'Муавия', 'Muâviye', 'معاوية'],
  muadh: [['muadh bin jabal', 'muadh b jabal'], 'Muaz ibn Cəbəl', 'Mu‘adh ibn Jabal', 'Муаз ибн Джабаль', 'Muâz b. Cebel', 'معاذ بن جبل'],
  zaidkhalid: [['zaid bin khalid al juhani'], 'Zeyd ibn Xalid əl-Cuhəni', 'Zayd ibn Khalid al-Juhani', 'Зайд ибн Халид аль-Джухани', 'Zeyd b. Hâlid el-Cühenî', 'زيد بن خالد الجهني'],
  ali: [['ali bin abi talib', 'ali', 'ali bin abutalib'], 'Əli ibn Əbu Talib', 'Ali ibn Abi Talib', 'Али ибн Абу Талиб', 'Hz. Ali', 'علي بن أبي طالب'],
  adi: [['adi bin hatim', 'adi b hatim', 'adi bin hatim heard the prophet'], 'Ədiy ibn Hatim', 'Adi ibn Hatim', 'Ади ибн Хатим', 'Adî b. Hâtim', 'عدي بن حاتم'],
  samura: [['samura b jundub', 'samurah bin jundub'], 'Səmurə ibn Cundub', 'Samurah ibn Jundub', 'Самура ибн Джундуб', 'Semure b. Cündüb', 'سمرة بن جندب'],
  khawla: [['khaula bint hakim sulamiyya'], 'Xövlə bint Hakim', 'Khawlah bint Hakim', 'Хауля бинт Хаким', 'Havle bint Hakîm', 'خولة بنت حكيم'],
  bara: [['al bara bin azib'], 'Bəra ibn Azib', 'al-Bara ibn Azib', 'аль-Бара ибн Азиб', 'Berâ b. Âzib', 'البراء بن عازب'],
  imran: [['imran bin husain'], 'İmran ibn Husayn', 'Imran ibn Husayn', 'Имран ибн Хусейн', 'İmrân b. Husayn', 'عمران بن حصين'],
  umar: [['umar bin al khattab'], 'Ömər ibn əl-Xəttab', 'Umar ibn al-Khattab', 'Умар ибн аль-Хаттаб', 'Hz. Ömer', 'عمر بن الخطاب'],
  tamim: [['tamim ad dari'], 'Təmim əd-Dari', 'Tamim ad-Dari', 'Тамим ад-Дари', 'Temîm ed-Dârî', 'تميم الداري'],
  abumasud: [['abu masud', 'abu masud al badri'], 'Əbu Məsud əl-Bədri', 'Abu Mas‘ud al-Badri', 'Абу Мас‘уд аль-Бадри', 'Ebû Mes‘ûd el-Bedrî', 'أبو مسعود البدري'],
  shaddad: [['shaddid b aus', 'shaddad bin aus'], 'Şəddad ibn Əus', 'Shaddad ibn Aws', 'Шаддад ибн Аус', 'Şeddâd b. Evs', 'شداد بن أوس'],
  hudhayfa: [['hudhaifa'], 'Hüzeyfə', 'Hudhayfah', 'Хузайфа', 'Huzeyfe', 'حذيفة'],
  miqdam: [['miqdam bin madikarib'], 'Miqdam ibn Mədikərib', 'al-Miqdam ibn Ma‘dikarib', 'аль-Микдам ибн Ма‘дикариб', 'Mikdâm b. Ma‘dîkerib', 'المقدام بن معديكرب'],
  abuayyub: [['abu aiyub al ansari'], 'Əbu Əyyub əl-Ənsari', 'Abu Ayyub al-Ansari', 'Абу Айюб аль-Ансари', 'Ebû Eyyûb el-Ensârî', 'أبو أيوب الأنصاري'],
  sad: [['sad bin abi waqqas'], 'Səd ibn Əbi Vəqqas', 'Sa‘d ibn Abi Waqqas', 'Са‘д ибн Абу Ваккас', 'Sa‘d b. Ebî Vakkâs', 'سعد بن أبي وقاص'],
  ummsalama: [['umm salamah', 'um salama', 'umm salama', 'umm salamah ummul muminin'], 'Ümmü Sələmə', 'Umm Salamah', 'Умм Салама', 'Ümmü Seleme', 'أم سلمة'],
  nawwas: [['nawwas b saman al ansari'], 'Nəvvas ibn Səm‘an', 'an-Nawwas ibn Sam‘an', 'ан-Наввас ибн Сам‘ан', 'Nevvâs b. Sem‘ân', 'النواس بن سمعان'],
  thawban: [['thauban', 'thawban'], 'Səvban', 'Thawban', 'Саубан', 'Sevbân', 'ثوبان'],
  numan: [['numan b bashir', 'numan bin bashir'], 'Numan ibn Bəşir', 'an-Nu‘man ibn Bashir', 'ан-Ну‘ман ибн Башир', 'Nu‘mân b. Beşîr', 'النعمان بن بشير'],
  abubakrah: [['abubakrah', 'abu bakrah'], 'Əbu Bəkrə', 'Abu Bakrah', 'Абу Бакра', 'Ebû Bekre', 'أبو بكرة'],
  abubakr: [['abu bakr as siddiq'], 'Əbu Bəkr əs-Siddiq', 'Abu Bakr as-Siddiq', 'Абу Бакр ас-Сиддик', 'Hz. Ebû Bekir', 'أبو بكر الصديق'],
  uqba: [['uqbah bin amir', 'uqba bin amir'], 'Uqbə ibn Amir', 'Uqbah ibn Amir', 'Укба ибн Амир', 'Ukbe b. Âmir', 'عقبة بن عامر'],
  irbad: [['irbad bin sariyah', 'al irbad bin sariyah'], 'İrbad ibn Sariyə', 'al-Irbad ibn Sariyah', 'аль-Ирбад ибн Сария', 'İrbâz b. Sâriye', 'العرباض بن سارية'],
  ubayy: [['ubai bin kab'], 'Übeyy ibn Kəb', 'Ubayy ibn Ka‘b', 'Убайй ибн Ка‘б', 'Übey b. Ka‘b', 'أبي بن كعب'],
  abubarza: [['abubarzah al aslami', 'abu barzah al aslami'], 'Əbu Bərzə əl-Əsləmi', 'Abu Barzah al-Aslami', 'Абу Барза аль-Аслами', 'Ebû Berze el-Eslemî', 'أبو برزة الأسلمي'],
  awf: [['awf bin malik', 'auf b malik ashjai'], 'Auf ibn Malik', 'Awf ibn Malik', 'Ауф ибн Малик', 'Avf b. Mâlik', 'عوف بن مالك'],
  kab: [['kab bin ujrah'], 'Kəb ibn Ucrə', 'Ka‘b ibn Ujrah', 'Ка‘б ибн Уджра', 'Ka‘b b. Ucre', 'كعب بن عجرة'],
  hafsa: [['hafsah'], 'Həfsə', 'Hafsah', 'Хафса', 'Hz. Hafsa', 'حفصة'],
  juwayriya: [['juwairiya'], 'Cüveyriyə', 'Juwayriyah', 'Джувайрия', 'Cüveyriye', 'جويرية'],
  fadala: [['fadalah bin ubaid'], 'Fədalə ibn Ubeyd', 'Fadalah ibn Ubayd', 'Фадаля ибн Убайд', 'Fadâle b. Ubeyd', 'فضالة بن عبيد'],
  maqil: [['maqil bin yasar'], 'Məqil ibn Yəsar', 'Ma‘qil ibn Yasar', 'Ма‘киль ибн Ясар', 'Ma‘kıl b. Yesâr', 'معقل بن يسار'],
  mughaffal: [['abdullah bin mughaffal al muzani'], 'Abdullah ibn Muğəffəl', 'Abdullah ibn Mughaffal', 'Абдуллах ибн Мугаффаль', 'Abdullah b. Muğaffel', 'عبد الله بن مغفل'],
  burayda: [['buraydah bin al hasib'], 'Bureydə ibn əl-Husayb', 'Buraydah ibn al-Husayb', 'Бурайда ибн аль-Хусайб', 'Büreyde b. el-Husayb', 'بريدة بن الحصيب'],
  amralas: [['amr bin al as', 'amr b al as'], 'Amr ibn əl-As', 'Amr ibn al-As', 'Амр ибн аль-‘Ас', 'Amr b. el-Âs', 'عمرو بن العاص'],
}

const LANG_I = { az: 1, en: 2, ru: 3, tr: 4, ar: 5 }

/** İngilis nəşrinin adını normallaşdırır (skript də işlədir) */
export const narratorKey = (s) => String(s || '').toLowerCase()
  .replace(/[`'’‘ʿʾ]/g, '').replace(/\bibn\b/g, 'bin').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()

const ALIAS = new Map()
for (const [k, v] of Object.entries(N)) for (const a of v[0]) ALIAS.set(a, k)

/** "Abu Sa`id Al-Khudri and Abu Huraira" → ['khudri', 'abuhurayra']; tanınmayan → [] */
export function narratorIds(en) {
  const parts = narratorKey(en).split(/ and /)
  const ids = parts.map(p => ALIAS.get(p.trim()))
  return ids.every(Boolean) ? ids : []
}

/** Ad seçilmiş dildə (əlavə dillərdə ingiliscə) */
export const narratorName = (id, lang) => N[id]?.[LANG_I[lang] || 2] || null

// Saytda profili olan səhabələr (data/sahaba.js → name.en) — ravi açarı → profil
const SAHABA_EN = {
  abubakr: 'Abu Bakr as-Siddiq', umar: 'Umar ibn al-Khattab', uthman: 'Uthman ibn Affan', ali: 'Ali ibn Abi Talib',
  aisha: 'Aisha bint Abi Bakr', abuhurayra: 'Abu Hurairah', ibnmasud: 'Abdullah ibn Masud', abudharr: 'Abu Dharr al-Ghifari',
  muadh: 'Muadh ibn Jabal', sad: 'Saad ibn Abi Waqqas', anas: 'Anas ibn Malik',
}
// data/sahaba.js → slugOf ilə eyni qayda (test yoxlayır)
const toSlug = (en) => en.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
/** Ravi açarı → səhabə profilinin slug-u (profil yoxdursa null) */
export const narratorSlug = (id) => (SAHABA_EN[id] ? toSlug(SAHABA_EN[id]) : null)
/** Slug → ravi açarı (səhabə səhifəsi üçün) */
export const narratorBySlug = (slug) => Object.keys(SAHABA_EN).find(k => narratorSlug(k) === slug) || null
