// ═══════════════════════════════════════════════════════
// Ay mənzilləri (منازل القمر) — 28 klassik ərəb mənzili, ənənəvi sıra ilə (v7.1)
//
// Mənbələr (adlar və ulduzların eyniləşdirilməsi):
// • P. Kunitzsch, "Untersuchungen zur Sternnomenklatur der Araber" (1961) və
//   P. Kunitzsch, T. Smart, "A Dictionary of Modern Star Names" (2006) — ulduz adlarının ərəb mənşəyi.
// • P. Kunitzsch, "al-Manāzil", Encyclopaedia of Islam, 2-ci nəşr — mənzillərin siyahısı.
// • Müqayisə üçün: Wikipedia, "Lunar station" (ərəb mənzilləri cədvəli, 2026-11 oxundu).
// QAYDA: ulduz eyniləşdirilməsi mənbələr arasında fərqlidirsə, `stars` sahəsi YAZILMIR
//   (təxmin yoxdur): al-Buṭayn (35/39/41 Ari və ya ε/δ/ρ Ari — mənbələr ayrılır) və
//   al-Balda (göyün ulduzsuz boş sahəsi — "mənzil" boşluğun özüdür).
// stars — Bayer işarələri (α, β … + bürcün latın qısaltması), mətn tərcümə olunmur.
// gap — mənzil ulduzsuz boş sahədir (al-Balda).
// mean — adın hərfi mənası (qısa); translit — transliterasiya; name — ərəbcə ad (hərəkələrlə) (elmi yazılış).
// ═══════════════════════════════════════════════════════

export const LUNAR_MANSIONS = [
  { name: 'الشَّرَطَان', translit: 'al-Sharaṭān', stars: 'β, γ Ari', // lang-ok[Ari]: Bayer işarəsi
    mean: { az: 'iki nişan', en: 'the two signs', ru: 'два знака', ar: 'العلامتان', tr: 'iki işaret' } },
  { name: 'البُطَيْن', translit: 'al-Buṭayn',
    mean: { az: 'kiçik qarın', en: 'the little belly', ru: 'брюшко', ar: 'تصغير البطن', tr: 'küçük karın' } },
  { name: 'الثُّرَيَّا', translit: 'al-Thurayyā', stars: 'M45 (η Tau)', // lang-ok[Tau]: Bayer işarəsi
    mean: { az: 'kiçik çoxluq (Ülkər)', en: 'the little multitude (Pleiades)', ru: 'маленькое множество (Плеяды)', ar: 'تصغير ثَرْوى: الكثيرة', tr: 'küçük çokluk (Ülker)' } }, // lang-ok[Pleiades]: ulduz topasının adı
  { name: 'الدَّبَرَان', translit: 'al-Dabarān', stars: 'α Tau', // lang-ok[Tau]: Bayer işarəsi
    mean: { az: 'arxadan gələn', en: 'the follower', ru: 'следующий позади', ar: 'التابع (يتبع الثريا)', tr: 'arkadan gelen' } },
  { name: 'الهَقْعَة', translit: 'al-Haqʿa', stars: 'λ, φ¹, φ² Ori', // lang-ok[Ori]: Bayer işarəsi
    mean: { az: 'tük burumu', en: 'the whorl (of hair)', ru: 'завиток (шерсти)', ar: 'دائرة الشعر', tr: 'kıl burgusu' } },
  { name: 'الهَنْعَة', translit: 'al-Hanʿa', stars: 'γ, ξ Gem', // lang-ok[Gem]: Bayer işarəsi
    mean: { az: 'boyun damğası', en: 'the brand (on the neck)', ru: 'клеймо (на шее)', ar: 'سِمة في العنق', tr: 'boyun damgası' } },
  { name: 'الذِّرَاع', translit: 'al-Dhirāʿ', stars: 'α, β Gem', // lang-ok[Gem]: Bayer işarəsi
    mean: { az: 'qol (dirsəkdən barmaqlara)', en: 'the forearm', ru: 'предплечье', ar: 'ذراع الأسد', tr: 'kol (dirsekten parmaklara)' } },
  { name: 'النَّثْرَة', translit: 'al-Nathra', stars: 'M44, γ, δ Cnc', // lang-ok[Cnc]: Bayer işarəsi
    mean: { az: 'burun dəliyi', en: 'the nostril', ru: 'ноздря', ar: 'أنف الأسد', tr: 'burun deliği' } },
  { name: 'الطَّرْف', translit: 'al-Ṭarf', stars: 'κ Cnc, λ Leo', // lang-ok[Cnc,Leo]: Bayer işarəsi
    mean: { az: 'baxış (şirin gözləri)', en: 'the glance (the Lion’s eyes)', ru: 'взгляд (глаза Льва)', ar: 'عين الأسد', tr: 'bakış (aslanın gözleri)' } },
  { name: 'الجَبْهَة', translit: 'al-Jabha', stars: 'α, γ, ζ, η Leo', // lang-ok[Leo]: Bayer işarəsi
    mean: { az: 'şirin alnı', en: 'the forehead (of the Lion)', ru: 'лоб (Льва)', ar: 'جبهة الأسد', tr: 'aslanın alnı' } },
  { name: 'الزُّبْرَة', translit: 'al-Zubra', stars: 'δ, θ Leo', // lang-ok[Leo]: Bayer işarəsi
    mean: { az: 'yal', en: 'the mane', ru: 'грива', ar: 'كاهل الأسد', tr: 'yele' } },
  { name: 'الصَّرْفَة', translit: 'al-Ṣarfa', stars: 'β Leo', // lang-ok[Leo]: Bayer işarəsi
    mean: { az: 'dönüş (havanın dəyişməsi)', en: 'the turning (of the weather)', ru: 'поворот (погоды)', ar: 'انصراف الحرّ', tr: 'dönüş (havanın değişmesi)' } },
  { name: 'العَوَّاء', translit: 'al-ʿAwwāʾ', stars: 'β, η, γ, δ, ε Vir', // lang-ok[Vir]: Bayer işarəsi
    mean: { az: 'hürən', en: 'the barker', ru: 'лающий', ar: 'النابح', tr: 'havlayan' } },
  { name: 'السِّمَاك الأَعْزَل', translit: 'al-Simāk al-Aʿzal', stars: 'α Vir', // lang-ok[Vir]: Bayer işarəsi
    mean: { az: 'silahsız ucalan', en: 'the unarmed raised one', ru: 'безоружный возвышенный', ar: 'المرتفع الذي لا سلاح معه', tr: 'silahsız yükselen' } },
  { name: 'الغَفْر', translit: 'al-Ghafr', stars: 'ι, κ, λ Vir', // lang-ok[Vir]: Bayer işarəsi
    mean: { az: 'örtük', en: 'the covering', ru: 'покров', ar: 'السَّتْر', tr: 'örtü' } },
  { name: 'الزُّبَانَى', translit: 'al-Zubānā', stars: 'α, β Lib', // lang-ok[Lib]: Bayer işarəsi
    mean: { az: 'iki qısqac (Əqrəbin)', en: 'the two claws (of the Scorpion)', ru: 'две клешни (Скорпиона)', ar: 'قرنا العقرب', tr: 'iki kıskaç (Akrep’in)' } },
  { name: 'الإِكْلِيل', translit: 'al-Iklīl', stars: 'β, δ, π Sco', // lang-ok[Sco]: Bayer işarəsi
    mean: { az: 'tac', en: 'the crown', ru: 'венец', ar: 'تاج العقرب', tr: 'taç' } },
  { name: 'القَلْب', translit: 'al-Qalb', stars: 'α Sco', // lang-ok[Sco]: Bayer işarəsi
    mean: { az: 'ürək (Əqrəbin)', en: 'the heart (of the Scorpion)', ru: 'сердце (Скорпиона)', ar: 'قلب العقرب', tr: 'kalp (Akrep’in)' } },
  { name: 'الشَّوْلَة', translit: 'al-Shawla', stars: 'λ, υ Sco', // lang-ok[Sco]: Bayer işarəsi
    mean: { az: 'qaldırılmış quyruq', en: 'the raised tail', ru: 'поднятый хвост', ar: 'ذنب العقرب المرفوع', tr: 'kalkık kuyruk' } },
  { name: 'النَّعَائِم', translit: 'al-Naʿāʾim', stars: 'γ, δ, ε, η, λ, σ, τ, ζ, φ Sgr', // lang-ok[Sgr]: Bayer işarəsi
    mean: { az: 'dəvəquşları', en: 'the ostriches', ru: 'страусы', ar: 'النعام', tr: 'deve kuşları' } },
  { name: 'البَلْدَة', translit: 'al-Balda', gap: true,
    mean: { az: 'açıq yer (ulduzsuz boşluq)', en: 'the open place (a starless gap)', ru: 'открытое место (беззвёздный просвет)', ar: 'الفُرجة الخالية من النجوم', tr: 'açık yer (yıldızsız boşluk)' } },
  { name: 'سَعْد الذَّابِح', translit: 'Saʿd al-Dhābiḥ', stars: 'α, β Cap', // lang-ok[Cap]: Bayer işarəsi
    mean: { az: 'kəsənin uğuru', en: 'luck of the slaughterer', ru: 'удача закалывающего', ar: 'حظّ الذابح', tr: 'kesenin talihi' } },
  { name: 'سَعْد بُلَع', translit: 'Saʿd Bulaʿ', stars: 'ε, μ Aqr', // lang-ok[Aqr]: Bayer işarəsi
    mean: { az: 'udanın uğuru', en: 'luck of the swallower', ru: 'удача глотающего', ar: 'حظّ البالع', tr: 'yutanın talihi' } },
  { name: 'سَعْد السُّعُود', translit: 'Saʿd al-Suʿūd', stars: 'β, ξ Aqr', // lang-ok[Aqr]: Bayer işarəsi
    mean: { az: 'uğurların uğuru', en: 'luck of lucks', ru: 'удача удач', ar: 'أسعد السعود', tr: 'talihlerin talihi' } },
  { name: 'سَعْد الأَخْبِيَة', translit: 'Saʿd al-Akhbiya', stars: 'γ, π, ζ, η Aqr', // lang-ok[Aqr]: Bayer işarəsi
    mean: { az: 'çadırların uğuru', en: 'luck of the tents', ru: 'удача шатров', ar: 'حظّ الأخبية (الخيام)', tr: 'çadırların talihi' } },
  { name: 'الفَرْغ المُقَدَّم', translit: 'al-Fargh al-Muqaddam', stars: 'α, β Peg', // lang-ok[Peg]: Bayer işarəsi
    mean: { az: 'qabaqdakı ağız (vedrənin)', en: 'the front spout (of the bucket)', ru: 'передний носик (ведра)', ar: 'مَصَبّ الدلو المقدَّم', tr: 'öndeki ağız (kovanın)' } },
  { name: 'الفَرْغ المُؤَخَّر', translit: 'al-Fargh al-Muʾakhkhar', stars: 'γ Peg, α And', // lang-ok[Peg,And]: Bayer işarəsi
    mean: { az: 'arxadakı ağız (vedrənin)', en: 'the rear spout (of the bucket)', ru: 'задний носик (ведра)', ar: 'مَصَبّ الدلو المؤخَّر', tr: 'arkadaki ağız (kovanın)' } },
  { name: 'بَطْن الحُوت', translit: 'Baṭn al-Ḥūt (al-Rishāʾ)', stars: 'β And', // lang-ok[And]: Bayer işarəsi
    mean: { az: 'balığın qarnı (ip)', en: 'belly of the fish (the rope)', ru: 'брюхо рыбы (верёвка)', ar: 'بطن الحوت، ويُسمّى الرِّشاء', tr: 'balığın karnı (ip)' } },
]

/** Yasin 36:39 — Ay mənzilləri barədə ayə (mətn: public/data/moon-ayah, scripts/build-moon-ayah.mjs) */
export const MOON_AYAH = { surah: 36, ayah: 39 }
