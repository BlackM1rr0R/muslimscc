// ═══════════════════════════════════════════════════════
// Detal səhifələrinin URL slug-ları (99 ad, səhabələr)
//
// Tətbiq bandlına düşür (routes.js) — ona görə ağır məlumat faylları
// (names99.js, sahaba.js) burada import OLUNMUR, yalnız slug siyahısı.
// tests/unit/seo-detail.test.js bu siyahıların məlumatla eyni olduğunu yoxlayır.
//
//   NAME_SLUGS[n - 1]   — /names/<n>-<slug> (names99.js → "tr" transliterasiyası)
//   SAHABA_SLUGS[id - 1] — /sahaba/<slug>    (sahaba.js → slugOf, ingiliscə ad)
// ═══════════════════════════════════════════════════════

export const NAME_SLUGS = [
  "allah", "ar-rahman", "ar-rahim", "al-malik", "al-quddus", "as-salam",
  "al-mumin", "al-muhaymin", "al-aziz", "al-jabbar", "al-mutakabbir", "al-khaliq",
  "al-bari", "al-musawwir", "al-ghaffar", "al-qahhar", "al-wahhab", "ar-razzaq",
  "al-fattah", "al-alim", "al-qabid", "al-basit", "al-khafid", "ar-rafi",
  "al-muizz", "al-mudhill", "as-sami", "al-basir", "al-hakam", "al-adl",
  "al-latif", "al-khabir", "al-halim", "al-azim", "al-ghafur", "ash-shakur",
  "al-aliyy", "al-kabir", "al-hafiz", "al-muqit", "al-hasib", "al-jalil",
  "al-karim", "ar-raqib", "al-mujib", "al-wasi", "al-hakim", "al-wadud",
  "al-majid", "al-baith", "ash-shahid", "al-haqq", "al-wakil", "al-qawiyy",
  "al-matin", "al-waliyy", "al-hamid", "al-muhsi", "al-mubdi", "al-muid",
  "al-muhyi", "al-mumit", "al-hayy", "al-qayyum", "al-wajid", "al-majid",
  "al-wahid", "al-ahad", "as-samad", "al-qadir", "al-muqtadir", "al-muqaddim",
  "al-muakhkhir", "al-awwal", "al-akhir", "az-zahir", "al-batin", "al-wali",
  "al-mutaali", "al-barr", "at-tawwab", "al-muntaqim", "al-afuww", "ar-rauf",
  "malikul-mulk", "dhul-jalali-wal-ikram", "al-muqsit", "al-jami", "al-ghani", "al-mughni",
  "al-mani", "ad-darr", "an-nafi", "an-nur", "al-hadi", "al-badi",
  "al-baqi", "al-warith", "ar-rashid",
]

export const SAHABA_SLUGS = [
  "abu-bakr-as-siddiq", "umar-ibn-al-khattab", "uthman-ibn-affan", "ali-ibn-abi-talib", "khadijah-bint-khuwaylid", "aisha-bint-abi-bakr",
  "fatimah-bint-muhammad", "bilal-ibn-rabah", "abu-hurairah", "abdullah-ibn-masud", "salman-al-farisi", "abu-dharr-al-ghifari",
  "muadh-ibn-jabal", "zaid-ibn-harithah", "khalid-ibn-al-walid", "saad-ibn-abi-waqqas", "talha-ibn-ubaydullah", "zubayr-ibn-al-awwam",
  "anas-ibn-malik", "abu-ubaidah-ibn-al-jarrah",
]
