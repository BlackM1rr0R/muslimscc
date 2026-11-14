// ═══════════════════════════════════════════════════════
// Detal səhifələrinin URL slug-ları (99 ad, səhabələr)
//
// Tətbiq bandlına düşür (routes.js) — ona görə ağır məlumat faylları
// (names99.js, sahaba.js) burada import OLUNMUR, yalnız slug siyahısı.
// tests/unit/seo-detail.test.js bu siyahıların məlumatla eyni olduğunu yoxlayır.
//
//   NAME_SLUGS[n - 1]   — /names/<n>-<slug> (names99.js → "tr" transliterasiyası)
//   REMOVED_NAME_SLUGS  — köhnə siyahıdan çıxarılmış adlar (köhnə URL-lər üçün)
//   SAHABA_SLUGS[id - 1] — /sahaba/<slug>    (sahaba.js → slugOf, ingiliscə ad)
//   SCHOLAR_SLUGS       — /scholars/<slug>  (scholars.js → slug; SCHOLARS sırası ilə)
//   GLOSSARY_SLUGS      — /glossary/<id>    (glossary.js → id; GLOSSARY sırası ilə)
// ═══════════════════════════════════════════════════════

export const NAME_SLUGS = [
  "allah", "al-ahad", "al-ala", "al-akram", "al-ilah", "al-awwal",
  "al-akhir", "az-zahir", "al-batin", "al-bari", "al-barr", "al-basir",
  "at-tawwab", "al-jabbar", "al-haafiz", "al-hasib", "al-hafiz", "al-hafiyy",
  "al-haqq", "al-mubin", "al-hakim", "al-halim", "al-hamid", "al-hayy",
  "al-qayyum", "al-khabir", "al-khaliq", "al-khallaq", "ar-rauf", "ar-rahman",
  "ar-rahim", "ar-razzaq", "ar-raqib", "as-salam", "as-sami", "ash-shakir",
  "ash-shakur", "ash-shahid", "as-samad", "al-aalim", "al-aziz", "al-azim",
  "al-afuww", "al-alim", "al-aliyy", "al-ghaffar", "al-ghafur", "al-ghani",
  "al-fattah", "al-qadir", "al-qahir", "al-quddus", "al-qadeer", "al-qarib",
  "al-qawiyy", "al-qahhar", "al-kabir", "al-karim", "al-latif", "al-mumin",
  "al-mutaali", "al-mutakabbir", "al-matin", "al-mujib", "al-majid", "al-muhit",
  "al-musawwir", "al-muqtadir", "al-muqit", "al-malik", "al-maleek", "al-mawla",
  "al-muhaymin", "an-nasir", "al-wahid", "al-warith", "al-wasi", "al-wadud",
  "al-wakil", "al-waliyy", "al-wahhab", "al-jamil", "al-jawad", "al-hakam",
  "al-hayiyy", "ar-rabb", "ar-rafiq", "as-subbuh", "as-sayyid", "ash-shafi",
  "at-tayyib", "al-qabid", "al-basit", "al-muqaddim", "al-muakhkhir", "al-muhsin",
  "al-muti", "al-mannan", "al-witr",
]

// Köhnə siyahıdan (Tirmizi 3507 sadalaması) çıxarılmış adların slug-ları.
// Belə köhnə ünvan (/names/23-al-khafid) siyahıya (/names) yönləndirilir —
// bax: src/seo/routes.js → parseDetailSegment / parsePath (removed: true).
// Köhnə siyahıda olub yenisində də olan adlar slug-ı ilə tapılır
// (/names/20-al-alim → /names/44-al-alim).
export const REMOVED_NAME_SLUGS = [
  "al-khafid", "ar-rafi", "al-muizz", "al-mudhill", "al-adl", "al-jalil",
  "al-baith", "al-muhsi", "al-mubdi", "al-muid", "al-muhyi", "al-mumit",
  "al-wajid", "al-wali", "al-muntaqim", "malikul-mulk", "dhul-jalali-wal-ikram", "al-muqsit",
  "al-jami", "al-mughni", "al-mani", "ad-darr", "an-nafi", "an-nur",
  "al-hadi", "al-badi", "al-baqi", "ar-rashid",
]

export const SAHABA_SLUGS = [
  "abu-bakr-as-siddiq", "umar-ibn-al-khattab", "uthman-ibn-affan", "ali-ibn-abi-talib", "khadijah-bint-khuwaylid", "aisha-bint-abi-bakr",
  "fatimah-bint-muhammad", "bilal-ibn-rabah", "abu-hurairah", "abdullah-ibn-masud", "salman-al-farisi", "abu-dharr-al-ghifari",
  "muadh-ibn-jabal", "zaid-ibn-harithah", "khalid-ibn-al-walid", "saad-ibn-abi-waqqas", "talha-ibn-ubaydullah", "zubayr-ibn-al-awwam",
  "anas-ibn-malik", "abu-ubaidah-ibn-al-jarrah",
]

// Sələf alimləri — src/data/scholars.js → SCHOLARS sırası (dövr, sonra doğum ili)
export const SCHOLAR_SLUGS = [
  "said-ibn-al-musayyib", "al-hasan-al-basri", "muhammad-ibn-sirin", "abu-hanifa", "malik-ibn-anas",
  "sufyan-ath-thawri", "ash-shafii", "ahmad-ibn-hanbal", "al-bukhari", "abu-dawud",
  "muslim-ibn-al-hajjaj", "ibn-majah", "at-tirmidhi", "an-nasai", "ibn-khuzaymah",
  "at-tabari", "an-nawawi", "ibn-taymiyyah", "adh-dhahabi", "ibn-al-qayyim",
  "ibn-kathir", "ibn-rajab", "ibn-hajar", "muhammad-ibn-abd-al-wahhab", "abd-ar-rahman-as-sadi",
  "muhammad-al-amin-ash-shanqiti", "ibn-baz", "al-albani", "ibn-uthaymin", "muqbil-al-wadii",
  "abd-al-muhsin-al-abbad", "salih-al-fawzan", "bakr-abu-zayd", "salih-al-ash-shaykh",
]

// Dərslər — src/data/lessons/*.js (scripts/gen-lessons-index.mjs yazır)
export const LESSON_SLUGS = ["usul-ath-thalatha","al-qawaid-al-arba","nawaqid-al-islam","kitab-at-tawhid","ghusl","tayammum","istikhara","eid-prayer","kusuf-prayer","istisqa-prayer","adhkar-after-salah","travel-prayer","sunnah-fasts","dhul-hijjah-ten","udhiyah","aqiqah","kaffarah-fidyah","nikah","hijab","ruqyah","sick-fiqh","wasiyyah","janazah","tawbah","adab-al-mufrad","birr-al-walidayn","muhasabah","mustalah","bidah","hilyat-talib-al-ilm","doubts-youth","fiqh-faq","intro-to-islam","new-muslim"]

// Lüğət terminləri — /glossary/<id> (glossary.js → GLOSSARY sırası, id = glossaryId(translit))
export const GLOSSARY_SLUGS = [
  "tawhid", "shirk", "bidah", "iman", "islam", "ihsan", "sunnah", "fard", "wajib", "haram", "halal",
  "makruh", "mustahab", "salah", "sawm", "zakat", "hajj", "umrah", "quran", "hadith", "tafsir", "fiqh",
  "tawbah", "tawakkul", "ikhlas", "taqwa", "jannah", "jahannam", "qiyamah", "sirat", "sahabah", "tabiun",
  "qadr", "qada", "yaqin", "ghayb", "fitrah", "ruh", "nafs", "barzakh", "mizan", "shafaah", "arsh", "kursi",
  "lawh-mahfuz", "tahara", "ghusl", "tayammum", "adhan", "iqamah", "qiblah", "rakah", "sujud", "ruku",
  "qunut", "janazah", "kafan", "nikah", "talaq", "mahr", "khula", "iddah", "nafaqah", "hadanah", "wasiyyah",
  "mirath", "waqf", "hibah", "tajwid", "hifz", "asbab-an-nuzul", "nasikh", "mansukh", "muhkam", "mutashabih",
  "makki", "madani", "juz", "hizb", "manzil", "sajdah-tilawah", "isnad", "matn", "sahih", "hasan", "daif",
  "mawdu", "mutawatir", "ahad", "mursal", "muttasil", "muallaq", "munqati", "zuhd", "khushu", "muraqabah",
  "muhasabah", "shukr", "ridha", "tafakkur", "ummah", "khalifah", "shura", "dawah", "jihad", "hijrah",
  "mubah", "rububiyyah", "uluhiyyah", "al-asma-was-sifat", "istiwa", "nuzul", "uluww", "ruyah",
  "kalam-allah", "tatil", "tahrif", "takyif", "tamthil", "tawil", "tafwid", "tawassul", "istighathah",
  "al-wala-wal-bara", "kufr", "nifaq", "shirk-asghar", "riya", "taghut", "sihr", "kahanah", "tamimah",
  "tiyarah", "ayn", "jinn", "malaikah", "nabi-wa-rasul", "mujizah", "karamah", "wali", "takfir",
  "ahl-as-sunnah-wal-jamaah", "salaf", "manhaj", "khawarij", "murjiah", "jahmiyyah", "mutazilah",
  "qadariyyah", "shahadah", "ibadah", "dajjal", "ashrat-as-saah", "hawd", "adhab-al-qabr", "bath",
  "khatm-an-nubuwwah", "ahl-al-kitab", "ruqyah", "wudu", "niyyah", "takbirat-al-ihram", "tashahhud",
  "taslim", "witr", "qiyam-al-layl", "tarawih", "duha", "sunan-ar-rawatib", "jumuah", "khutbah", "qasr",
  "jam", "sujud-as-sahw", "mash-alal-khuffayn", "najasah", "hadath", "istinja", "hayd", "nifas", "istihadah",
  "suhur", "iftar", "itikaf", "laylat-al-qadr", "zakat-al-fitr", "nisab", "sadaqah", "ihram", "miqat",
  "tawaf", "say", "arafah", "talbiyah", "ramy-al-jimar", "udhiyah", "aqiqah", "salat-al-id",
  "salat-al-kusuf", "salat-al-istisqa", "istikharah", "dhikr", "dua", "adhkar-as-salah", "sutrah",
  "salat-al-jamaah", "istighfar", "usul-al-fiqh", "ijma", "qiyas", "ijtihad", "taqlid", "ittiba", "madhhab",
  "fatwa", "maqasid-ash-shariah", "darurah", "rukhsah", "shart", "rukn", "batil", "urf", "sadd-adh-dharai",
  "mukallaf", "riba", "gharar", "bay", "qard", "hudud", "qisas", "diyah", "tazir", "kaffarah", "fidyah",
  "mahram", "wali-an-nikah", "awrah", "hijab", "khalwah", "rajah", "zihar", "nadhr", "yamin", "dhabihah",
  "mustalah-al-hadith", "marfu", "mawquf", "maqtu", "gharib", "aziz", "mashhur", "tadlis", "mudal",
  "shadhdh", "munkar", "illah", "mudraj", "mudtarib", "al-jarh-wat-tadil", "thiqah", "adalah", "dabt",
  "hadith-qudsi", "athar", "al-kutub-as-sittah", "sahihayn", "muttafaq-alayh", "sunan", "musnad", "rawi",
  "ulum-al-quran", "ayah", "surah", "basmalah", "istiadhah", "mushaf", "rasm-uthmani", "qiraat",
  "al-ahruf-as-sabah", "tartil", "waqf-wa-ibtida", "ijaz-al-quran", "tafsir-bil-mathur", "tafsir-bir-ray",
  "israiliyyat", "al-huruf-al-muqattaah", "wahy", "khatm-al-quran", "tadabbur", "sabr", "khawf", "raja",
  "mahabbah", "khashyah", "inabah", "istiqamah", "haya", "tawadu", "kibr", "hasad", "ghibah", "namimah",
  "ujb", "sidq", "amanah", "adab", "birr-al-walidayn", "silat-ar-rahim", "husn-al-khuluq", "ithar", "hilm",
  "nasihah", "al-amr-bil-maruf", "ilm", "tazkiyah", "sirah", "jahiliyyah", "bithah", "al-isra-wal-miraj",
  "ansar", "muhajirun", "ghazwat-badr", "ghazwat-uhud", "ghazwat-al-khandaq", "sulh-al-hudaybiyyah",
  "fath-makkah", "hajjat-al-wada", "al-khulafa-ar-rashidun", "ahl-al-bayt", "ummahat-al-muminin",
  "al-asharah-al-mubashsharun", "atba-at-tabiin", "kabah", "al-masjid-al-haram", "al-masjid-an-nabawi",
  "al-masjid-al-aqsa", "zamzam", "al-hajar-al-aswad", "bayah", "at-taqwim-al-hijri", "hurub-ar-riddah",
]

// Namaz vaxtları — şəhər səhifələri /prayer/<slug> (v6.6): Azərbaycanın 75 şəhəri,
// slug = data/prayerCities.js id-sinin kiçik hərflə yazılışı (tests/unit/seo-detail.test.js yoxlayır).
// Yalnız AZ şəhərləri: onların vaxtı yerli hesabdır (Əbu Bəkr məscidinin cədvəli) — statik cədvəl düzgün olur.
export const PRAYER_CITY_SLUGS = [
  'baku', 'sumgait', 'ganja', 'aghjabadi', 'aghdam', 'aghdash', 'aghdara', 'aghstafa',
  'agsu', 'astara', 'babek', 'balakan', 'beylagan', 'barda', 'bilasuvar', 'jabrayil',
  'jalilabad', 'julfa', 'dashkasan', 'fuzuli', 'gadabay', 'goranboy', 'goychay', 'goygol',
  'hajigabul', 'khachmaz', 'khankendi', 'khirdalan', 'khizi', 'khojaly', 'khojavend', 'imishli',
  'ismayilli', 'kalbajar', 'kangarli', 'kurdamir', 'gakh', 'gazakh', 'gabala', 'gobustan',
  'quba', 'gubadli', 'qusar', 'lachin', 'lerik', 'lankaran', 'masally', 'mingachevir',
  'naftalan', 'nakhchivan', 'neftchala', 'oghuz', 'ordubad', 'saatli', 'sabirabad', 'salyan',
  'samukh', 'sadarak', 'siyazan', 'shabran', 'shahbuz', 'shamakhi', 'sheki', 'shamkir',
  'sharur', 'shirvan', 'shusha', 'tartar', 'tovuz', 'ujar', 'yardimli', 'yevlakh',
  'zagatala', 'zangilan', 'zardab',
  // v6.7: dünya şəhərləri (seo/prayerCity.js → WORLD_CITY_IDS; vaxtlar aladhan 13 ilə yoxlanılıb)
  'mecca', 'medina', 'istanbul', 'ankara', 'derbent', 'tbilisi', 'marneuli', 'tabriz', 'tehran',
  'dubai', 'cairo', 'tashkent', 'almaty', 'london', 'paris', 'new-york', 'toronto', 'jakarta', 'kuala-lumpur',
]
