// ═══════════════════════════════════════════════════════
// Əlavə dillərdə (src/seo/langs.js) surə səhifələrinin SEO mətnləri:
// title, description, h1, giriş cümləsi və statik blokun yazıları.
//
// detail.js (tənbəl chunk) bunu import edir — əsas paketə düşmür.
// Siyahı səhifəsinin (/id/quran) meta-sı: src/seo/intlMeta.js.
//
// Mətnlər yalnız layihədəki məlumatdan qurulur (surənin nömrəsi, adı, ayə
// sayı, Məkkə/Mədinə) — heç bir fakt uydurulmur. Surənin mənası yazılmır:
// məlumatda yalnız ingiliscəsi var, başqa dilə qatılmamalıdır.
// Tərcümənin özü rəsmi nəşrdəndir (seo-data/quran/<nəşr>.json).
//
// s = { n, name, arName, latin, ayahs, medinan } (detail.js → surahInfo):
//   name — göstərilən ad (ərəb əlifbalı dillərdə arName, digərlərində latın)
// ═══════════════════════════════════════════════════════

import { TITLE_MAX } from './title.js'

const fit = (...opts) => opts.find(o => o.length <= TITLE_MAX) || opts[opts.length - 1]

// Yerli rəqəmlər: fars/puştu — ۰-۹, benqal — ০-৯ (urdu adətən latın rəqəmi işlədir)
const DIGITS = { fa: '۰۱۲۳۴۵۶۷۸۹', ps: '۰۱۲۳۴۵۶۷۸۹', bn: '০১২৩৪৫৬৭৮৯' }
export const localDigits = (v, lang) => {
  const d = DIGITS[lang]
  return d ? String(v).replace(/[0-9]/g, c => d[c]) : String(v)
}

export const INTL_QURAN = {
  id: {
    h1: (s) => `Surat ${s.name}`,
    t: (s) => fit(`Surat ${s.name} — Teks Arab dan Terjemahan Indonesia`, `Surat ${s.name} — Arab dan Terjemahan`, `Surat ${s.name}`),
    d: (s) => `Baca Surat ${s.name}, surat ke-${s.n} dalam Al-Qur’an: ${s.ayahs} ayat, golongan ${s.medinan ? 'Madaniyah' : 'Makkiyah'}. Teks Arab lengkap dengan terjemahan bahasa Indonesia dan audio murotal.`,
    intro: (s) => `Surat ${s.name} adalah surat ke-${s.n} dalam Al-Qur’an. Surat ini terdiri dari ${s.ayahs} ayat dan termasuk golongan surat ${s.medinan ? 'Madaniyah' : 'Makkiyah'}. Berikut teks Arab lengkap surat ini beserta terjemahannya dalam bahasa Indonesia.`,
  },
  ms: {
    h1: (s) => `Surah ${s.name}`,
    t: (s) => fit(`Surah ${s.name} — Teks Arab dan Terjemahan Melayu`, `Surah ${s.name} — Arab dan Terjemahan`, `Surah ${s.name}`),
    d: (s) => `Baca Surah ${s.name}, surah ke-${s.n} dalam al-Quran: ${s.ayahs} ayat, surah ${s.medinan ? 'Madaniyyah' : 'Makkiyyah'}. Teks Arab penuh beserta terjemahan bahasa Melayu dan audio bacaan.`,
    intro: (s) => `Surah ${s.name} ialah surah ke-${s.n} dalam al-Quran. Ia mengandungi ${s.ayahs} ayat dan tergolong dalam surah ${s.medinan ? 'Madaniyyah' : 'Makkiyyah'}. Di bawah ialah teks Arab penuh surah ini berserta terjemahannya dalam bahasa Melayu.`,
  },
  fr: {
    h1: (s) => `Sourate ${s.name}`,
    t: (s) => fit(`Sourate ${s.name} — texte arabe et traduction française`, `Sourate ${s.name} — arabe et français`, `Sourate ${s.name}`),
    d: (s) => `Lisez la sourate ${s.name}, ${frOrd(s.n)} sourate du Coran : ${s.ayahs} versets, révélée ${s.medinan ? 'à Médine' : 'à La Mecque'}. Texte arabe intégral, traduction française et récitation audio.`,
    intro: (s) => `La sourate ${s.name} est la ${frOrd(s.n)} sourate du Coran. Elle compte ${s.ayahs} versets et a été révélée ${s.medinan ? 'à Médine' : 'à La Mecque'}. Voici le texte arabe intégral de la sourate avec sa traduction en français.`,
  },
  de: {
    h1: (s) => `Sure ${s.name}`,
    t: (s) => fit(`Sure ${s.name} — arabischer Text und deutsche Übersetzung`, `Sure ${s.name} — Arabisch und Deutsch`, `Sure ${s.name}`),
    d: (s) => `Sure ${s.name} lesen – die ${s.n}. Sure des Korans: ${s.ayahs} Verse, offenbart in ${s.medinan ? 'Medina' : 'Mekka'}. Vollständiger arabischer Text, deutsche Übersetzung und Audio-Rezitation.`,
    intro: (s) => `Die Sure ${s.name} ist die ${s.n}. Sure des Korans. Sie umfasst ${s.ayahs} Verse und wurde in ${s.medinan ? 'Medina' : 'Mekka'} offenbart. Unten folgt der vollständige arabische Text der Sure mit deutscher Übersetzung.`,
  },
  es: {
    h1: (s) => `Sura ${s.name}`,
    t: (s) => fit(`Sura ${s.name} — texto árabe y traducción al español`, `Sura ${s.name} — árabe y español`, `Sura ${s.name}`),
    d: (s) => `Lee la sura ${s.name}, la sura número ${s.n} del Corán: ${s.ayahs} aleyas, revelada en ${s.medinan ? 'Medina' : 'La Meca'}. Texto árabe completo con traducción al español y recitación en audio.`,
    intro: (s) => `La sura ${s.name} es la sura número ${s.n} del Corán. Tiene ${s.ayahs} aleyas y fue revelada en ${s.medinan ? 'Medina' : 'La Meca'}. A continuación se ofrece el texto árabe completo de la sura con su traducción al español.`,
  },
  pt: {
    h1: (s) => `Surata ${s.name}`,
    t: (s) => fit(`Surata ${s.name} — texto árabe e tradução em português`, `Surata ${s.name} — árabe e português`, `Surata ${s.name}`),
    d: (s) => `Leia a surata ${s.name}, a ${s.n}ª surata do Alcorão: ${s.ayahs} versículos, revelada em ${s.medinan ? 'Medina' : 'Meca'}. Texto árabe completo com tradução em português e recitação em áudio.`,
    intro: (s) => `A surata ${s.name} é a ${s.n}ª surata do Alcorão. Tem ${s.ayahs} versículos e foi revelada em ${s.medinan ? 'Medina' : 'Meca'}. Abaixo está o texto árabe completo da surata com a tradução em português.`,
  },
  it: {
    h1: (s) => `Sura ${s.name}`,
    t: (s) => fit(`Sura ${s.name} — testo arabo e traduzione italiana`, `Sura ${s.name} — arabo e italiano`, `Sura ${s.name}`),
    d: (s) => `Leggi la sura ${s.name}, la ${s.n}ª sura del Corano: ${s.ayahs} versetti, rivelata ${s.medinan ? 'a Medina' : 'alla Mecca'}. Testo arabo completo con traduzione italiana e recitazione audio.`,
    intro: (s) => `La sura ${s.name} è la ${s.n}ª sura del Corano. Conta ${s.ayahs} versetti ed è stata rivelata ${s.medinan ? 'a Medina' : 'alla Mecca'}. Di seguito il testo arabo completo della sura con la traduzione in italiano.`,
  },
  nl: {
    h1: (s) => `Soera ${s.name}`,
    t: (s) => fit(`Soera ${s.name} — Arabische tekst en Nederlandse vertaling`, `Soera ${s.name} — Arabisch en Nederlands`, `Soera ${s.name}`),
    d: (s) => `Lees soera ${s.name}, de ${s.n}e soera van de Koran: ${s.ayahs} verzen, geopenbaard in ${s.medinan ? 'Medina' : 'Mekka'}. Volledige Arabische tekst met Nederlandse vertaling en audiorecitatie.`,
    intro: (s) => `Soera ${s.name} is de ${s.n}e soera van de Koran. Ze telt ${s.ayahs} verzen en werd geopenbaard in ${s.medinan ? 'Medina' : 'Mekka'}. Hieronder staat de volledige Arabische tekst van de soera met een Nederlandse vertaling.`,
  },
  bs: {
    h1: (s) => `Sura ${s.name}`,
    t: (s) => fit(`Sura ${s.name} — arapski tekst i prijevod na bosanski`, `Sura ${s.name} — arapski i bosanski`, `Sura ${s.name}`),
    d: (s) => `Čitajte suru ${s.name}, ${s.n}. suru Kur’ana: ${s.ayahs} ${bsAjet(s.ayahs)}, objavljena ${s.medinan ? 'u Medini' : 'u Mekki'}. Cijeli arapski tekst s prijevodom na bosanski jezik i audio učenjem.`,
    intro: (s) => `Sura ${s.name} je ${s.n}. sura Kur’ana. Ima ${s.ayahs} ${bsAjet(s.ayahs)} i objavljena je ${s.medinan ? 'u Medini' : 'u Mekki'}. U nastavku je cijeli arapski tekst sure s prijevodom na bosanski jezik.`,
  },
  sq: {
    h1: (s) => `Surja ${s.name}`,
    t: (s) => fit(`Surja ${s.name} — teksti arabisht dhe përkthimi shqip`, `Surja ${s.name} — arabisht dhe shqip`, `Surja ${s.name}`),
    d: (s) => `Lexoni suren ${s.name}, suren e ${s.n}-të të Kuranit: ${s.ayahs} ajete, e shpallur ${s.medinan ? 'në Medinë' : 'në Mekë'}. Teksti i plotë arabisht me përkthim shqip dhe recitim audio.`,
    intro: (s) => `Surja ${s.name} është surja e ${s.n}-të e Kuranit. Ka ${s.ayahs} ajete dhe është shpallur ${s.medinan ? 'në Medinë' : 'në Mekë'}. Më poshtë jepet teksti i plotë arabisht i sures me përkthimin shqip.`,
  },
  sw: {
    h1: (s) => `Surat ${s.name}`,
    t: (s) => fit(`Surat ${s.name} — Kiarabu na Tafsiri ya Kiswahili`, `Surat ${s.name} — Kiarabu na Kiswahili`, `Surat ${s.name}`),
    d: (s) => `Soma Surat ${s.name}, sura ya ${s.n} ya Qur’ani: aya ${s.ayahs}, iliteremshwa ${s.medinan ? 'Madina' : 'Makka'}. Maandishi kamili ya Kiarabu pamoja na tafsiri ya Kiswahili na sauti ya kisomo.`,
    intro: (s) => `Surat ${s.name} ni sura ya ${s.n} ya Qur’ani. Ina aya ${s.ayahs} na iliteremshwa ${s.medinan ? 'Madina' : 'Makka'}. Hapa chini kuna maandishi kamili ya Kiarabu ya sura hii pamoja na tafsiri yake kwa Kiswahili.`,
  },
  ha: {
    h1: (s) => `Surar ${s.name}`,
    t: (s) => fit(`Surar ${s.name} — Rubutun Larabci da Fassarar Hausa`, `Surar ${s.name} — Larabci da Hausa`, `Surar ${s.name}`),
    d: (s) => `Karanta Surar ${s.name}, sura ta ${s.n} a cikin Alƙur’ani: ayoyi ${s.ayahs}, an saukar da ita a ${s.medinan ? 'Madina' : 'Makka'}. Rubutun Larabci tare da fassarar Hausa da karatun sauti.`,
    intro: (s) => `Surar ${s.name} ita ce sura ta ${s.n} a cikin Alƙur’ani. Tana da ayoyi ${s.ayahs}, kuma an saukar da ita a ${s.medinan ? 'Madina' : 'Makka'}. A ƙasa akwai cikakken rubutun Larabci na surar tare da fassararta zuwa Hausa.`,
  },
  so: {
    h1: (s) => `Suuradda ${s.name}`,
    t: (s) => fit(`Suuradda ${s.name} — Carabi iyo Tarjumad Soomaali`, `Suuradda ${s.name} — Carabi iyo Soomaali`, `Suuradda ${s.name}`),
    d: (s) => `Akhri Suuradda ${s.name}, suuradda ${s.n}aad ee Qur’aanka: ${s.ayahs} aayadood, waxay ku soo degtay ${s.medinan ? 'Madiina' : 'Makka'}. Qoraal Carabi ah, tarjumad Soomaali iyo cod akhris.`,
    intro: (s) => `Suuradda ${s.name} waa suuradda ${s.n}aad ee Qur’aanka. Waxay ka kooban tahay ${s.ayahs} aayadood, waxayna ku soo degtay ${s.medinan ? 'Madiina' : 'Makka'}. Hoos waxaa ku qoran qoraalka Carabiga ee suuradda oo dhammaystiran iyo tarjumaddeeda af Soomaali.`,
  },
  hi: {
    h1: (s) => `सूरह ${s.name}`,
    t: (s) => fit(`सूरह ${s.name} — अरबी पाठ और हिंदी अनुवाद`, `सूरह ${s.name} — अरबी और हिंदी`, `सूरह ${s.name}`),
    d: (s) => `सूरह ${s.name} पढ़ें — क़ुरआन की सूरह क्रमांक ${s.n}, ${s.ayahs} आयतें, ${s.medinan ? 'मदीना' : 'मक्का'} में नाज़िल हुई। पूरा अरबी पाठ, हिंदी अनुवाद और ऑडियो तिलावत।`,
    intro: (s) => `सूरह ${s.name} क़ुरआन की सूरह क्रमांक ${s.n} है। इसमें ${s.ayahs} आयतें हैं और यह ${s.medinan ? 'मदीना' : 'मक्का'} में नाज़िल हुई। नीचे इस सूरह का पूरा अरबी पाठ हिंदी अनुवाद के साथ दिया गया है।`,
  },
  uz: {
    h1: (s) => `${s.name} сураси`,
    t: (s) => fit(`${s.name} сураси — арабча матн ва ўзбекча таржима`, `${s.name} сураси — арабча ва таржима`, `${s.name} сураси`),
    d: (s) => `${s.name} сураси — Қуръоннинг ${s.n}-сураси, ${s.ayahs} оят, ${s.medinan ? 'Мадинада' : 'Маккада'} нозил бўлган. Тўлиқ арабча матн, ўзбек тилига таржима ва аудио қироат.`,
    intro: (s) => `${s.name} сураси Қуръони Каримнинг ${s.n}-сурасидир. У ${s.ayahs} оятдан иборат ва ${s.medinan ? 'Мадинада' : 'Маккада'} нозил бўлган. Қуйида суранинг тўлиқ арабча матни ва ўзбек тилига таржимаси келтирилган.`,
  },
  bn: {
    h1: (s) => `সূরা ${s.name}`,
    t: (s) => fit(`সূরা ${s.name} — আরবি পাঠ ও বাংলা অনুবাদ`, `সূরা ${s.name} — আরবি ও বাংলা`, `সূরা ${s.name}`),
    d: (s) => `সূরা ${s.name} পড়ুন — কুরআনের ${bnN(s.n)} নম্বর সূরা, ${bnN(s.ayahs)}টি আয়াত, ${s.medinan ? 'মাদানী' : 'মাক্কী'} সূরা। সম্পূর্ণ আরবি পাঠ, বাংলা অনুবাদ ও অডিও তিলাওয়াত।`,
    intro: (s) => `সূরা ${s.name} কুরআনের ${bnN(s.n)} নম্বর সূরা। এতে ${bnN(s.ayahs)}টি আয়াত রয়েছে এবং এটি একটি ${s.medinan ? 'মাদানী' : 'মাক্কী'} সূরা। নিচে সূরাটির সম্পূর্ণ আরবি পাঠ বাংলা অনুবাদসহ দেওয়া হলো।`,
  },
  // Urdu axtarışında latın adı da geniş işlənir ("surah yasin") — başlığa sığırsa əlavə olunur
  ur: {
    h1: (s) => `سورۃ ${s.name}`,
    t: (s) => fit(`سورۃ ${s.name} (Surah ${s.latin}) — اردو ترجمہ`, `سورۃ ${s.name} — عربی متن اور اردو ترجمہ`, `سورۃ ${s.name}`),
    d: (s) => `سورۃ ${s.name} پڑھیں — قرآن مجید کی سورت نمبر ${s.n}، ${s.ayahs} آیات، ${s.medinan ? 'مدنی' : 'مکی'} سورت۔ مکمل عربی متن، اردو ترجمہ اور آڈیو تلاوت۔`,
    intro: (s) => `سورۃ ${s.name} قرآن مجید کی سورت نمبر ${s.n} ہے۔ اس میں ${s.ayahs} آیات ہیں اور یہ ${s.medinan ? 'مدنی' : 'مکی'} سورت ہے۔ ذیل میں اس سورت کا مکمل عربی متن اردو ترجمے کے ساتھ دیا گیا ہے۔`,
  },
  fa: {
    h1: (s) => `سوره ${s.name}`,
    t: (s) => fit(`سوره ${s.name} — متن عربی و ترجمه فارسی`, `سوره ${s.name}`),
    d: (s) => `سوره ${s.name} را بخوانید — سوره شماره ${faN(s.n)} قرآن کریم، ${faN(s.ayahs)} آیه، ${s.medinan ? 'مدنی' : 'مکی'}. متن کامل عربی همراه با ترجمه فارسی و تلاوت صوتی.`,
    intro: (s) => `سوره ${s.name} سوره شماره ${faN(s.n)} قرآن کریم است. این سوره ${faN(s.ayahs)} آیه دارد و ${s.medinan ? 'مدنی' : 'مکی'} است. در ادامه متن کامل عربی سوره همراه با ترجمه فارسی آمده است.`,
  },
  ps: {
    h1: (s) => `سورة ${s.name}`,
    t: (s) => fit(`سورة ${s.name} — عربي متن او پښتو ژباړه`, `سورة ${s.name}`),
    d: (s) => `سورة ${s.name} ولولئ — د قرآن کریم ${psN(s.n)} شمېره سورت، ${psN(s.ayahs)} آیتونه، ${s.medinan ? 'مدني' : 'مکي'}. بشپړ عربي متن له پښتو ژباړې او غږیزې تلاوت سره.`,
    intro: (s) => `سورة ${s.name} د قرآن کریم ${psN(s.n)} شمېره سورت دی. ${psN(s.ayahs)} آیتونه لري او ${s.medinan ? 'مدني' : 'مکي'} سورت دی. لاندې د دې سورت بشپړ عربي متن له پښتو ژباړې سره راغلی دی.`,
  },
  zh: {
    h1: (s) => `第${s.n}章 ${s.name}`,
    t: (s) => fit(`古兰经第${s.n}章 ${s.name} — 阿拉伯语原文与中文译文`, `古兰经第${s.n}章 ${s.name}`),
    d: (s) => `在线阅读古兰经第${s.n}章（${s.name}）：共${s.ayahs}节，降示于${s.medinan ? '麦地那' : '麦加'}。完整阿拉伯语原文，附马坚中文译文及诵读音频，适合学习与诵读。`,
    intro: (s) => `${s.name}是古兰经第${s.n}章，共${s.ayahs}节，降示于${s.medinan ? '麦地那' : '麦加'}。以下是本章完整的阿拉伯语原文及中文译文。`,
  },
}

function frOrd(n) { return n === 1 ? '1re' : `${n}e` }
// Bosniya dili: 1, 21, 31… ajet; qalanı (2–4 və 5+) ajeta
function bsAjet(n) { return n % 10 === 1 && n % 100 !== 11 ? 'ajet' : 'ajeta' }
const bnN = (v) => localDigits(v, 'bn')
const faN = (v) => localDigits(v, 'fa')
const psN = (v) => localDigits(v, 'ps')

// Statik blokun (scripts/seo-body.mjs) yazıları — qalan açarlar ingiliscədir
// (BODY_UI.en; bu dillərdə yalnız Quran səhifələri var). Bəsmələnin mənası
// burada YOXDUR: seo-body.mjs onu həmin nəşrin özündən (1:1) götürür.
export const INTL_BODY_UI = {
  id: { crumbs: 'Anda di sini', number: 'Nomor', ayahs: 'Jumlah ayat', place: 'Tempat turun', mecca: 'Makkah', medina: 'Madinah', prevSurah: 'Surat sebelumnya', nextSurah: 'Surat berikutnya', allSurahs: 'Semua 114 surat', translation: 'Terjemahan', textSource: 'Teks Arab: Tanzil Project (CC BY 3.0), ditampilkan tanpa perubahan.', licenses: 'Lisensi dan sumber', surahList: '114 surat dalam Al-Qur’an', book: 'Al-Qur’an al-Karim' },
  ms: { crumbs: 'Anda di sini', number: 'Nombor', ayahs: 'Bilangan ayat', place: 'Tempat turun', mecca: 'Makkah', medina: 'Madinah', prevSurah: 'Surah sebelumnya', nextSurah: 'Surah seterusnya', allSurahs: 'Kesemua 114 surah', translation: 'Terjemahan', textSource: 'Teks Arab: Tanzil Project (CC BY 3.0), dipaparkan tanpa sebarang perubahan.', licenses: 'Lesen dan sumber', surahList: '114 surah dalam al-Quran', book: 'Al-Quran al-Karim' },
  fr: { crumbs: 'Vous êtes ici', number: 'Numéro', ayahs: 'Versets', place: 'Lieu de révélation', mecca: 'La Mecque', medina: 'Médine', prevSurah: 'Sourate précédente', nextSurah: 'Sourate suivante', allSurahs: 'Les 114 sourates', translation: 'Traduction', textSource: 'Texte arabe : Tanzil Project (CC BY 3.0), reproduit sans modification.', licenses: 'Licences et sources', surahList: 'Les 114 sourates du Coran', book: 'Le Saint Coran' },
  de: { crumbs: 'Sie sind hier', number: 'Nummer', ayahs: 'Verse', place: 'Ort der Offenbarung', mecca: 'Mekka', medina: 'Medina', prevSurah: 'Vorherige Sure', nextSurah: 'Nächste Sure', allSurahs: 'Alle 114 Suren', translation: 'Übersetzung', textSource: 'Arabischer Text: Tanzil Project (CC BY 3.0), unverändert wiedergegeben.', licenses: 'Lizenzen und Quellen', surahList: 'Die 114 Suren des Korans', book: 'Der edle Koran' },
  es: { crumbs: 'Estás aquí', number: 'Número', ayahs: 'Aleyas', place: 'Lugar de revelación', mecca: 'La Meca', medina: 'Medina', prevSurah: 'Sura anterior', nextSurah: 'Sura siguiente', allSurahs: 'Las 114 suras', translation: 'Traducción', textSource: 'Texto árabe: Tanzil Project (CC BY 3.0), sin modificaciones.', licenses: 'Licencias y fuentes', surahList: 'Las 114 suras del Corán', book: 'El Sagrado Corán' },
  pt: { crumbs: 'Você está aqui', number: 'Número', ayahs: 'Versículos', place: 'Local da revelação', mecca: 'Meca', medina: 'Medina', prevSurah: 'Surata anterior', nextSurah: 'Próxima surata', allSurahs: 'Todas as 114 suratas', translation: 'Tradução', textSource: 'Texto árabe: Tanzil Project (CC BY 3.0), apresentado sem alterações.', licenses: 'Licenças e fontes', surahList: 'As 114 suratas do Alcorão', book: 'O Alcorão Sagrado' },
  it: { crumbs: 'Ti trovi qui', number: 'Numero', ayahs: 'Versetti', place: 'Luogo della rivelazione', mecca: 'La Mecca', medina: 'Medina', prevSurah: 'Sura precedente', nextSurah: 'Sura successiva', allSurahs: 'Tutte le 114 sure', translation: 'Traduzione', textSource: 'Testo arabo: Tanzil Project (CC BY 3.0), riprodotto senza modifiche.', licenses: 'Licenze e fonti', surahList: 'Le 114 sure del Corano', book: 'Il Sacro Corano' },
  nl: { crumbs: 'U bent hier', number: 'Nummer', ayahs: 'Verzen', place: 'Plaats van openbaring', mecca: 'Mekka', medina: 'Medina', prevSurah: 'Vorige soera', nextSurah: 'Volgende soera', allSurahs: 'Alle 114 soera’s', translation: 'Vertaling', textSource: 'Arabische tekst: Tanzil Project (CC BY 3.0), ongewijzigd weergegeven.', licenses: 'Licenties en bronnen', surahList: 'De 114 soera’s van de Koran', book: 'De Edele Koran' },
  bs: { crumbs: 'Nalazite se ovdje', number: 'Broj', ayahs: 'Broj ajeta', place: 'Mjesto objave', mecca: 'Mekka', medina: 'Medina', prevSurah: 'Prethodna sura', nextSurah: 'Sljedeća sura', allSurahs: 'Svih 114 sura', translation: 'Prijevod', textSource: 'Arapski tekst: Tanzil Project (CC BY 3.0), prikazan bez izmjena.', licenses: 'Licence i izvori', surahList: '114 sura Kur’ana', book: 'Časni Kur’an' },
  sq: { crumbs: 'Ju jeni këtu', number: 'Numri', ayahs: 'Ajete', place: 'Vendi i shpalljes', mecca: 'Meka', medina: 'Medina', prevSurah: 'Surja e mëparshme', nextSurah: 'Surja e radhës', allSurahs: 'Të 114 suret', translation: 'Përkthimi', textSource: 'Teksti arabisht: Tanzil Project (CC BY 3.0), pa ndryshime.', licenses: 'Licencat dhe burimet', surahList: '114 suret e Kuranit', book: 'Kurani Fisnik' },
  sw: { crumbs: 'Uko hapa', number: 'Namba', ayahs: 'Aya', place: 'Mahali ilipoteremshwa', mecca: 'Makka', medina: 'Madina', prevSurah: 'Sura iliyotangulia', nextSurah: 'Sura inayofuata', allSurahs: 'Sura zote 114', translation: 'Tafsiri', textSource: 'Maandishi ya Kiarabu: Tanzil Project (CC BY 3.0), bila mabadiliko.', licenses: 'Leseni na vyanzo', surahList: 'Sura 114 za Qur’ani', book: 'Qur’ani Tukufu' },
  ha: { crumbs: 'Kana nan', number: 'Lamba', ayahs: 'Ayoyi', place: 'Wurin saukarwa', mecca: 'Makka', medina: 'Madina', prevSurah: 'Surar da ta gabata', nextSurah: 'Sura ta gaba', allSurahs: 'Dukkan surori 114', translation: 'Fassara', textSource: 'Rubutun Larabci: Tanzil Project (CC BY 3.0), ba tare da canji ba.', licenses: 'Lasisi da tushe', surahList: 'Surori 114 na Alƙur’ani', book: 'Alƙur’ani Mai Girma' },
  so: { crumbs: 'Halkan ayaad joogtaa', number: 'Lambar', ayahs: 'Aayadaha', place: 'Meesha ay ku soo degtay', mecca: 'Makka', medina: 'Madiina', prevSurah: 'Suuradii hore', nextSurah: 'Suuradda xigta', allSurahs: 'Dhammaan 114 suuradood', translation: 'Tarjumad', textSource: 'Qoraalka Carabiga: Tanzil Project (CC BY 3.0), isbeddel la’aan.', licenses: 'Ruqsadaha iyo ilaha', surahList: '114-ka suuradood ee Qur’aanka', book: 'Qur’aanka Kariimka' },
  hi: { crumbs: 'आप यहाँ हैं', number: 'क्रमांक', ayahs: 'आयतें', place: 'नाज़िल होने का स्थान', mecca: 'मक्का', medina: 'मदीना', prevSurah: 'पिछली सूरह', nextSurah: 'अगली सूरह', allSurahs: 'सभी 114 सूरह', translation: 'अनुवाद', textSource: 'अरबी पाठ: Tanzil Project (CC BY 3.0), बिना किसी बदलाव के।', licenses: 'लाइसेंस और स्रोत', surahList: 'क़ुरआन की 114 सूरह', book: 'क़ुरआन मजीद' },
  uz: { crumbs: 'Сиз шу ердасиз', number: 'Рақами', ayahs: 'Оятлар сони', place: 'Нозил бўлган жой', mecca: 'Макка', medina: 'Мадина', prevSurah: 'Олдинги сура', nextSurah: 'Кейинги сура', allSurahs: 'Барча 114 сура', translation: 'Таржима', textSource: 'Арабча матн: Tanzil Project (CC BY 3.0), ўзгаришсиз.', licenses: 'Лицензиялар ва манбалар', surahList: 'Қуръоннинг 114 сураси', book: 'Қуръони Карим' },
  bn: { crumbs: 'আপনি এখানে আছেন', number: 'নম্বর', ayahs: 'আয়াত সংখ্যা', place: 'অবতীর্ণের স্থান', mecca: 'মক্কা', medina: 'মদিনা', prevSurah: 'আগের সূরা', nextSurah: 'পরের সূরা', allSurahs: 'সব ১১৪টি সূরা', translation: 'অনুবাদ', textSource: 'আরবি পাঠ: Tanzil Project (CC BY 3.0), কোনো পরিবর্তন ছাড়া।', licenses: 'লাইসেন্স ও উৎস', surahList: 'কুরআনের ১১৪টি সূরা', book: 'আল-কুরআনুল কারীম' },
  ur: { crumbs: 'آپ یہاں ہیں', number: 'نمبر', ayahs: 'آیات', place: 'مقامِ نزول', mecca: 'مکہ مکرمہ', medina: 'مدینہ منورہ', prevSurah: 'پچھلی سورت', nextSurah: 'اگلی سورت', allSurahs: 'تمام 114 سورتیں', translation: 'ترجمہ', textSource: 'عربی متن: Tanzil Project (CC BY 3.0)، بغیر کسی تبدیلی کے۔', licenses: 'لائسنس اور ماخذ', surahList: 'قرآن مجید کی 114 سورتیں', book: 'قرآن مجید' },
  fa: { crumbs: 'شما اینجا هستید', number: 'شماره', ayahs: 'تعداد آیات', place: 'محل نزول', mecca: 'مکه', medina: 'مدینه', prevSurah: 'سوره قبلی', nextSurah: 'سوره بعدی', allSurahs: 'همه ۱۱۴ سوره', translation: 'ترجمه', textSource: 'متن عربی: Tanzil Project (CC BY 3.0)، بدون هیچ تغییری.', licenses: 'مجوزها و منابع', surahList: '۱۱۴ سوره قرآن کریم', book: 'قرآن کریم' },
  ps: { crumbs: 'تاسو دلته یاست', number: 'شمېره', ayahs: 'آیتونه', place: 'د نزول ځای', mecca: 'مکه', medina: 'مدینه', prevSurah: 'مخکنی سورت', nextSurah: 'بل سورت', allSurahs: 'ټول ۱۱۴ سورتونه', translation: 'ژباړه', textSource: 'عربي متن: Tanzil Project (CC BY 3.0)، پرته له بدلون.', licenses: 'جوازونه او سرچینې', surahList: 'د قرآن کریم ۱۱۴ سورتونه', book: 'قرآن کریم' },
  zh: { crumbs: '当前位置', number: '章序', ayahs: '节数', place: '降示地', mecca: '麦加', medina: '麦地那', prevSurah: '上一章', nextSurah: '下一章', allSurahs: '全部114章', translation: '译文', textSource: '阿拉伯语原文：Tanzil Project（CC BY 3.0），未作任何改动。', licenses: '许可与来源', surahList: '古兰经114章', book: '古兰经' },
}

// ── Məlumatdan qurulan dillər (QuranEnc dilləri, 2026-11-07) ──
// src/seo/intlTpl.js — hər dil üçün şablon sətirləri: {name} {n} {ayahs} {place}
// (place — placeMecca / placeMedina). Kodda şablon funksiyası yazmadan dil əlavə olunur.
import { INTL_TPL } from './intlTpl.js'

const fillTpl = (str, s, tpl) => String(str || '').replace(/\{(name|n|ayahs|place)\}/g, (_, k) =>
  (k === 'place' ? (s.medinan ? tpl.placeMedina : tpl.placeMecca) : String(s[k])))

/** Mətni cümlə sərhədində max-a sığdır (heç bir cümlə sığmırsa — olduğu kimi; clamp kəsər). */
function fitSentences(text, max) {
  if (text.length <= max) return text
  const parts = text.split(/(?<=[.!?。।።۔])\s+/)
  let out = ''
  for (const p of parts) {
    const next = out ? `${out} ${p}` : p
    if (next.length > max) break
    out = next
  }
  return out || text
}

const UI_KEYS = ['crumbs', 'number', 'ayahs', 'place', 'mecca', 'medina', 'prevSurah', 'nextSurah', 'allSurahs',
  'translation', 'textSource', 'licenses', 'surahList', 'book']
for (const [c, tpl] of Object.entries(INTL_TPL)) {
  if (INTL_QURAN[c]) continue
  INTL_QURAN[c] = {
    h1: (s) => fillTpl(tpl.h1, s, tpl),
    t: (s) => fit(fillTpl(tpl.t1, s, tpl), fillTpl(tpl.t2, s, tpl), fillTpl(tpl.t3, s, tpl)),
    // Uzun surə adında (Aal-i-Imraan) 160-ı keçirsə — son cümlə(lər) atılır (ortadan "…" ilə kəsilməsin)
    d: (s) => fitSentences(fillTpl(tpl.d, s, tpl), 160),
    intro: (s) => fillTpl(tpl.intro, s, tpl),
  }
  INTL_BODY_UI[c] = Object.fromEntries(UI_KEYS.map(k => [k, tpl[k]]))
}
