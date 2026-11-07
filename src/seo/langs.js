// ═══════════════════════════════════════════════════════
// Əlavə dillər — 5 əsas dildən (routes.js → LANGS) KƏNAR dillər reyestri.
//
// QƏRAR (sahib, 2026-11-06): sayt ~50 dilə mərhələli genişlənir.
//   Mərhələ 1 — Quran (114 surə) hər dildə RƏSMİ nəşr olunmuş tərcümə ilə
//   + SEO başlıq/təsvir. Hədis, dərs, lüğət, səhabə, alim mətnləri yalnız 5
//   əsas dildə qalır (yoxlanılmamış maşın tərcüməsi YOX).
//
// Necə işləyir:
//   • Əlavə dilin URL-i yalnız PAGES-in bu dildə həqiqi məzmunu olan
//     səhifələri üçün var (EXTRA_PAGES): /id/quran, /id/quran/36-yaseen.
//     pathFor('prayer', 'id') → /en/prayer (routes.js) — sayt heç vaxt
//     məzmunsuz /id/prayer ünvanı yaratmır, hreflang/sitemap da onu göstərmir.
//   • İnterfeys (düymələr, menyu) əlavə dildə ingiliscədir: LangContext →
//     lang = uiLang(...) = 'en', siteLang = 'id' (URL-in dili).
//   • Tərcümə nəşri: alquran.cloud identifikatoru; mətn seo-data/quran/-a
//     scripts/fetch-quran-seo.mjs ilə çəkilir (statik SEO bloku üçün).
//     Yalnız sünni, tanınmış nəşrlər (Fəhd Kompleksi və ya rəsmi qurum
//     nəşri) — şiə, Barelvi və qeyri-müsəlman tərcüməçilər seçilməyib.
//
// Yeni dil əlavə etmək: buraya bir sətir + src/seo/intl.js-də SEO mətnləri
// + node scripts/fetch-quran-seo.mjs (tests/unit/intl.test.js hamısını yoxlayır).
// ═══════════════════════════════════════════════════════

// code: { name — öz dilində ad (dil seçicisində), en — ingiliscə ad,
//         dir, locale (og:locale), quran — alquran.cloud nəşri VƏ YA qe — QuranEnc.com
//         tərcümə açarı (oxuyucu onu avtomatik açır), by — tərcüməçi
//         (nəşrin öz dilində; mənbə sətri), byLatin — latın yazılışı (by latın
//         deyilsə; lisenziyalar səhifəsi — 5 dilin hamısında oxunsun),
//         script: 'arab' — surə adı ərəbcə yazılır (urdu, fars, puştu),
//         basmala — Bəsmələnin bu nəşrdəki tərcüməsi (Fatihə 1:1, hərfbəhərf;
//         uz — mötərizədəki şərhsiz), oxuyucuda və statik blokda,
//         ui: true — interfeys lüğəti var (src/i18n/<dil>.json): BÜTÜN səhifələr bu dildə,
//         notes: true — nəşrdə ayə mətninin içində [[…]] lüğət qeydləri var
//         (Xürrəmdil); göstərişdə qeydlər ayrılır, tərcümə mətni dəyişmir —
//         utils/quranText.js → stripTranslationNotes) }
// uz.sodik kiril əlifbasındadır — SEO mətnləri də kirilcədir (intl.js).
export const EXTRA_LANGS = {
  id: { name: 'Bahasa Indonesia', en: 'Indonesian', ui: true, dir: 'ltr', locale: 'id_ID', quran: 'id.indonesian', by: 'Kementerian Agama RI', basmala: 'Dengan menyebut nama Allah Yang Maha Pemurah lagi Maha Penyayang.' },
  ur: { name: 'اردو', en: 'Urdu', ui: true, dir: 'rtl', locale: 'ur_PK', quran: 'ur.junagarhi', by: 'محمد جوناگڑھی', byLatin: 'Muhammad Junagarhi', script: 'arab', basmala: 'شروع کرتا ہوں اللہ تعالیٰ کے نام سے جو بڑا مہربان نہایت رحم واﻻ ہے' },
  bn: { name: 'বাংলা', en: 'Bengali', ui: true, dir: 'ltr', locale: 'bn_BD', quran: 'bn.bengali', by: 'মুহিউদ্দীন খান', byLatin: 'Muhiuddin Khan', basmala: 'শুরু করছি আল্লাহর নামে যিনি পরম করুণাময়, অতি দয়ালু।' },
  fa: { name: 'فارسی', en: 'Persian', ui: true, dir: 'rtl', locale: 'fa_IR', quran: 'fa.khorramdel', by: 'مصطفی خرمدل', byLatin: 'Mostafa Khorramdel', script: 'arab', notes: true, basmala: 'به نام خداوند بخشنده‌ی مهربان.' },
  ms: { name: 'Bahasa Melayu', en: 'Malay', ui: true, dir: 'ltr', locale: 'ms_MY', quran: 'ms.basmeih', by: 'Abdullah Muhammad Basmeih', basmala: 'Dengan nama Allah, Yang Maha Pemurah, lagi Maha Mengasihani.' },
  fr: { name: 'Français', en: 'French', ui: true, dir: 'ltr', locale: 'fr_FR', quran: 'fr.hamidullah', by: 'Muhammad Hamidullah', basmala: 'Au nom d\'Allah, le Tout Miséricordieux, le Très Miséricordieux.' },
  de: { name: 'Deutsch', en: 'German', ui: true, dir: 'ltr', locale: 'de_DE', quran: 'de.bubenheim', by: 'A. S. F. Bubenheim, N. Elyas', basmala: 'Im Namen Allahs, des Allerbarmers, des Barmherzigen.' },
  es: { name: 'Español', en: 'Spanish', ui: true, dir: 'ltr', locale: 'es_ES', quran: 'es.garcia', by: 'Isa García', basmala: 'En el nombre de Dios, el Compasivo con toda la creación, el Misericordioso con los creyentes.' },
  pt: { name: 'Português', en: 'Portuguese', ui: true, dir: 'ltr', locale: 'pt_BR', quran: 'pt.elhayek', by: 'Samir El-Hayek', basmala: 'Em nome de Deus, o Clemente, o Misericordioso.' },
  hi: { name: 'हिन्दी', en: 'Hindi', ui: true, dir: 'ltr', locale: 'hi_IN', quran: 'hi.hindi', by: 'सुहेल फ़ारूक़ ख़ान, सैफ़ुर्रहमान नदवी', byLatin: 'Suhel Farooq Khan, Saifur Rahman Nadwi', basmala: 'अल्लाह के नाम से जो रहमान व रहीम है।' },
  uz: { name: 'Ўзбекча', en: 'Uzbek', ui: true, dir: 'ltr', locale: 'uz_UZ', quran: 'uz.sodik', by: 'Муҳаммад Содиқ Муҳаммад Юсуф', byLatin: 'Muhammad Sodiq Muhammad Yusuf', basmala: 'Меҳрибон ва раҳмли Аллоҳнинг номи билан бошлайман.' },
  sw: { name: 'Kiswahili', en: 'Swahili', ui: true, dir: 'ltr', locale: 'sw_KE', quran: 'sw.barwani', by: 'Ali Muhsin Al-Barwani', basmala: 'KWA JINA LA MWENYEZI MUNGU MWINGI WA REHEMA MWENYE KUREHEMU.' },
  ha: { name: 'Hausa', en: 'Hausa', ui: true, dir: 'ltr', locale: 'ha_NG', quran: 'ha.gumi', by: 'Abubakar Mahmoud Gumi', basmala: 'Da sũnan Allah, Mai rahama, Mai jin ƙai.' },
  so: { name: 'Soomaali', en: 'Somali', ui: true, dir: 'ltr', locale: 'so_SO', quran: 'so.abduh', by: 'Mahmud Muhammad Abduh', basmala: 'Magaca Eebe yaan kubillaabaynaa ee Naxariis guud iyo mid gaaraba Naxariista.' },
  ps: { name: 'پښتو', en: 'Pashto', ui: true, dir: 'rtl', locale: 'ps_AF', quran: 'ps.abdulwali', by: 'عبدالولي', byLatin: 'Abdul Wali', script: 'arab', basmala: 'د الله په نامه سره (شروع كوم) چې ډېر زیات مهربان، بې حده رحم كوونكى دى' },
  bs: { name: 'Bosanski', en: 'Bosnian', ui: true, dir: 'ltr', locale: 'bs_BA', quran: 'bs.korkut', by: 'Besim Korkut', basmala: 'U ime Allaha, Milostivog, Samilosnog!' },
  sq: { name: 'Shqip', en: 'Albanian', ui: true, dir: 'ltr', locale: 'sq_AL', quran: 'sq.ahmeti', by: 'Sherif Ahmeti', basmala: 'Me emrin e All-llahut, Mëshiruesit, Mëshirëbërësit!' },
  it: { name: 'Italiano', en: 'Italian', ui: true, dir: 'ltr', locale: 'it_IT', quran: 'it.piccardo', by: 'Hamza Roberto Piccardo', basmala: 'In nome di Allah, il Compassionevole, il Misericordioso' },
  nl: { name: 'Nederlands', en: 'Dutch', ui: true, dir: 'ltr', locale: 'nl_NL', quran: 'nl.siregar', by: 'Sofian S. Siregar', basmala: 'In de naam van Allah, de Erbarmer, de Meest Barmhartige.' },
  zh: { name: '中文', en: 'Chinese', ui: true, dir: 'ltr', locale: 'zh_CN', quran: 'zh.jian', by: '马坚', byLatin: 'Ma Jian', basmala: '奉至仁至慈的真主之名' },
  // ── QuranEnc.com nəşrləri (qe — Rəvvad Tərcümə Mərkəzi və digər yoxlanılmış
  //    tərcümələr; Quran mətni oxuyucuda QuranEnc API-dən, statik blokda
  //    seo-data/quran/qe.<açar>.json-dan). 2026-11-07 — 50 dilə çatmaq üçün ──
  ta: { name: 'தமிழ்', en: 'Tamil', ui: true, dir: 'ltr', locale: 'ta_IN', qe: 'tamil_omar', by: 'Omar Sharif', basmala: 'பேரருளாளன் பேரன்பாளன் அல்லாஹ்வின் பெயரால்.' },
  ml: { name: 'മലയാളം', en: 'Malayalam', ui: true, dir: 'ltr', locale: 'ml_IN', qe: 'malayalam_kunhi', by: 'Abdul Hamid Haidar, Kunhi Muhammad', basmala: 'പരമകാരുണികനും കരുണാനിധിയുമായ അല്ലാഹുവിന്റെ തിരുനാമത്തില്‍' },
  te: { name: 'తెలుగు', en: 'Telugu', ui: true, dir: 'ltr', locale: 'te_IN', qe: 'telugu_muhammad', by: 'Abdurrahim ibn Muhammad', basmala: 'అనంత కరుణామయుడు అపార కరుణా ప్రదాత అయిన అల్లాహ్ పేరుతో' },
  kn: { name: 'ಕನ್ನಡ', en: 'Kannada', ui: true, dir: 'ltr', locale: 'kn_IN', qe: 'kannada_hamza', by: 'Hamza Butur', basmala: 'ಪರಮ ದಯಾಮಯನೂ ಕರುಣಾನಿಧಿಯೂ ಆದ ಅಲ್ಲಾಹನ ನಾಮದಿಂದ.' },
  gu: { name: 'ગુજરાતી', en: 'Gujarati', ui: true, dir: 'ltr', locale: 'gu_IN', qe: 'gujarati_omari', by: 'Rabella Al-Omari', basmala: 'અલ્લાહના નામથી, (શરૂ કરું છું), જે અત્યંત કૃપાળુ અને દયાળુ છે.' },
  pa: { name: 'ਪੰਜਾਬੀ', en: 'Punjabi', ui: true, dir: 'ltr', locale: 'pa_IN', qe: 'punjabi_arif', by: 'Arif Haleem', basmala: 'ਸ਼ੁਰੂ (ਕਰਦਾ ਹਾਂ) ਅੱਲਾਹ ਦੇ ਨਾਂ ਨਾਲ ਜਿਹੜਾ ਅਤਿਅੰਤ ਮਿਹਰਬਾਨ ਅਤੇ ਰਹਿਮ ਫ਼ਰਮਾਉਣ ਵਾਲਾ ਹੈ।' },
  as: { name: 'অসমীয়া', en: 'Assamese', ui: true, dir: 'ltr', locale: 'as_IN', qe: 'assamese_rafeeq', by: 'Rafiqul Islam Habibur-Rahman', basmala: '(আৰম্ভ কৰিছোঁ) পৰম কৰুণাময় পৰম দয়ালু আল্লাহৰ নামত।' },
  am: { name: 'አማርኛ', en: 'Amharic', ui: true, dir: 'ltr', locale: 'am_ET', qe: 'amharic_zain', by: 'Africa Academy', basmala: 'በአላህ ስም እጅግ በጣም ሩህሩህ በጣም አዛኝ በሆነው (እጀምራለሁ)።' },
  om: { name: 'Afaan Oromoo', en: 'Oromo', ui: true, dir: 'ltr', locale: 'om_ET', qe: 'oromo_rwwad', by: 'Rowwad Translation Center', basmala: '(Nin jalqaba) Maqaa Rabbii Akkaan Mararfataa Akkaan Rahmata Godhaa Taheetiin.' },
  yo: { name: 'Yorùbá', en: 'Yoruba', ui: true, dir: 'ltr', locale: 'yo_NG', qe: 'yoruba_mikail', by: 'Abu Rahimah Mikael', basmala: 'Ní orúkọ Allāhu, Àjọkẹ́-ayé, Àṣàkẹ́-ọ̀run.' },
  ff: { name: 'Fulfulde', en: 'Fula', dir: 'ltr', locale: 'ff_SN', qe: 'fulani_rwwad', by: 'Rowwad Translation Center', basmala: 'He innde Allah jurumdeero jormotooɗo oo' },
  rw: { name: 'Kinyarwanda', en: 'Kinyarwanda', ui: true, dir: 'ltr', locale: 'rw_RW', qe: 'kinyarwanda_assoc', by: 'Rwanda Muslim Association', basmala: 'Ku izina rya Allah, Nyirimpuhwe, Nyirimbabazi.' },
  ku: { name: 'کوردی', en: 'Kurdish', ui: true, dir: 'rtl', locale: 'ckb_IQ', qe: 'kurdish_bamoki', by: 'Muhammad Salih Bamoki', script: 'arab', basmala: 'بەناوی خوای بەخشندەی میهرەبان' },
  ky: { name: 'Кыргызча', en: 'Kyrgyz', ui: true, dir: 'ltr', locale: 'ky_KG', qe: 'kyrgyz_hakimov', by: 'Shamsuddin Hakimov', basmala: 'Ырайымдуу, Мээримдүү Аллахтын аты менен (баштаймын).' },
  tg: { name: 'Тоҷикӣ', en: 'Tajik', ui: true, dir: 'ltr', locale: 'tg_TJ', qe: 'tajik_arifi', by: 'Rowwad Translation Center', basmala: 'Ба номи Худованди бахшандаи меҳрубон.' },
  ug: { name: 'ئۇيغۇرچە', en: 'Uyghur', ui: true, dir: 'rtl', locale: 'ug_CN', qe: 'uyghur_saleh', by: 'Muhammad Saleh', script: 'arab', basmala: 'ناھايىتى شەپقەتلىك ۋە مېھرىبان ئاللاھنىڭ ئىسمى بىلەن باشلايمەن.' },
  th: { name: 'ไทย', en: 'Thai', ui: true, dir: 'ltr', locale: 'th_TH', qe: 'thai_rwwad', by: 'Rowwad Translation Center', basmala: 'ด้วยพระนามของอัลลอฮ์ ผู้ทรงกรุณาปรานี ผู้ทรงเมตตาเสมอ' },
  vi: { name: 'Tiếng Việt', en: 'Vietnamese', ui: true, dir: 'ltr', locale: 'vi_VN', qe: 'vietnamese_rwwad', by: 'Rowwad Translation Center', basmala: 'Nhân danh Allah, Đấng Độ Lượng, Đấng Khoan Dung' },
  tl: { name: 'Filipino', en: 'Filipino', ui: true, dir: 'ltr', locale: 'fil_PH', qe: 'tagalog_rwwad', by: 'Rowwad Translation Center', basmala: 'Sa ngalan ni Allāh, ang Napakamaawain, ang Maawain.' },
  km: { name: 'ខ្មែរ', en: 'Khmer', ui: true, dir: 'ltr', locale: 'km_KH', qe: 'khmer_rwwad', by: 'Rowwad Translation Center', basmala: 'ក្នុងព្រះនាមអល់ឡោះ មហាសប្បុរស មហាអាណិតស្រលាញ់។' },
  ja: { name: '日本語', en: 'Japanese', dir: 'ltr', locale: 'ja_JP', qe: 'japanese_saeedsato', by: 'Saeed Sato', basmala: '慈悲あまねく慈愛深きアッラーの御名において。' },
  sv: { name: 'Svenska', en: 'Swedish', dir: 'ltr', locale: 'sv_SE', qe: 'swedish_rwwad', by: 'Rowwad Translation Center', basmala: 'I Guds namn, den Nåderike, den Barmhärtige.' },
  ro: { name: 'Română', en: 'Romanian', dir: 'ltr', locale: 'ro_RO', qe: 'romanian_project', by: 'Islam4ro.com', basmala: 'În Numele lui Allah Cel Milostiv [Ar-Rahman], Îndurător [Ar-Rahim],' },
  sr: { name: 'Српски', en: 'Serbian', dir: 'ltr', locale: 'sr_RS', qe: 'serbian_rwwad', by: 'Rowwad Translation Center', basmala: 'У име Аллаха, Милостивог, Самилосног.' },
  si: { name: 'සිංහල', en: 'Sinhala', dir: 'ltr', locale: 'si_LK', qe: 'sinhalese_mahir', by: 'Rowwad Translation Center', basmala: 'අපරිමිත දයාන්විත අසමසම කරුණාන්විත වූ අල්ලාහ්ගේ නාමයෙනි.' },
}

export const EXTRA_CODES = Object.keys(EXTRA_LANGS)

// Əlavə dillərdə mövcud olan səhifələr (siyahı + detal). Yeni bölmə yalnız
// onun mətni həmin dillərdə HƏQİQƏTƏN varsa əlavə olunur.
export const EXTRA_PAGES = ['quran']

// Əlavə dildə interfeysin dili (UI mətnləri tərcümə olunana qədər)
export const EXTRA_UI_LANG = 'en'

export const isExtraLang = (l) => Object.prototype.hasOwnProperty.call(EXTRA_LANGS, l)
