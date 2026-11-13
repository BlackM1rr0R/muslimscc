// ═══════════════════════════════════════════════════════
// Müsəlman uşaq adları (v6.6, /muslim-baby-names) — saytın yoxlanmış ad lüğətindən (data/arabicNames.js).
//
// • Ərəbcə yazılış və məna — arabicNames.js (məna yalnız ərəb sözündən birbaşa, dəqiq bilinən adlarda;
//   mənası mübahisəli və ya ərəb mənşəli olmayan adlarda məna YAZILMIR).
// • Quranda xüsusi ad kimi neçə dəfə keçir + ilk ayə — data/nameQuran.js (Osmani mətnindən, skriptlə).
// • Bu adı daşıyan səhabə — saytın /sahaba bölməsi (nameQuran.js → NAME_SAHABA).
// • Cins — arabicNames.js-də siyahının bölməsi ("Qadın adları" فاطمة ilə başlayır).
// Saf modul — Node-da da işləyir (scripts/seo-body.mjs statik HTML qurur).
// ═══════════════════════════════════════════════════════
import { NAMES, MEANINGS } from './arabicNames.js'
import { NAME_QURAN, NAME_SAHABA } from './nameQuran.js'

const FEMALE_FROM = NAMES.findIndex(n => n[0] === 'فاطمة')

const slugOf = (latin) => latin.toLowerCase().normalize('NFKD').replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')

export const BABY_NAMES = NAMES.map(([ar, variants, key], i) => ({
  ar,
  variants,
  id: slugOf(variants[0]),
  gender: i < FEMALE_FROM ? 'm' : 'f',
  abd: ar.startsWith('عبد '),
  meaning: key ? MEANINGS[key] || null : null,
  quran: NAME_QURAN[ar] ? { count: NAME_QURAN[ar][0], ref: NAME_QURAN[ar][1] } : null,
  sahaba: NAME_SAHABA[ar] || [],
}))

const has = (s, re) => re.test(s)
/** Adın həmin dildə yayğın yazılışı (variantlardan) */
export function nameIn(n, lang) {
  const v = n.variants
  if (lang === 'ar') return n.ar
  if (lang === 'ru') return v.find(x => has(x, /[А-Яа-яЁё]/)) || v[0]
  const latin = v.filter(x => !has(x, /[А-Яа-яЁё]/))
  // azərbaycanca: ə-li variant → az hərfli (ü ö ş ç ğ ı İ x q) → ingilis yazılışına xas olmayan (kh, th, dh, sh, w, j, ou) ilk variant
  const azOk = (x) => !has(x, /kh|th|dh|sh|ou|[wWjJ]|Kh|Th|Dh|Sh/)
  if (lang === 'az') return latin.find(x => has(x, /[Əə]/)) || latin.find(x => azOk(x) && has(x, /[üöşçğıİÜÖŞÇxXqQ]/)) || latin.find(azOk) || latin[0]
  // türkcə: türk hərfli variant; yoxdursa — ingilis/azərbaycan yazılışına xas olmayan (kh, th, dh, w, q, x, ə) ilk variant
  const trOk = (x) => !has(x, /[ƏəxXqQwW]|kh|th|dh|Kh|Th|Dh/)
  if (lang === 'tr') return latin.find(x => has(x, /[ğışçöüİÖÜŞÇ]/) && trOk(x)) || latin.find(trOk) || latin[0]
  return latin[0]
}

// Hədis — saytın əqiqə dərsindəki mətn hərfi-hərfinə (dini mətn: tərcümə lüğətindən KEÇMİR, əlavə dildə ingiliscə) (data/lessons/aqiqah.js; tests/unit/baby-names.test.js yoxlayır)
export const BEST_NAMES_HADITH = {
  ar: '«إِنَّ أَحَبَّ أَسْمَائِكُمْ إِلَى اللَّهِ عَبْدُ اللَّهِ وَعَبْدُ الرَّحْمَنِ»',
  text: {
    az: '«Allaha ən sevimli adlarınız Abdullah və Əbdürrəhmandır».',
    en: '“The most beloved of your names to Allah are Abdullah and Abdur-Rahman.”',
    ru: '«Самые любимые Аллахом из ваших имён — Абдуллах и Абдуррахман».',
    ar: '«إِنَّ أَحَبَّ أَسْمَائِكُمْ إِلَى اللَّهِ عَبْدُ اللَّهِ وَعَبْدُ الرَّحْمَنِ»',
    tr: '“Allah’a en sevimli isimleriniz Abdullah ve Abdurrahman’dır.”',
  },
  src: { az: 'Müslim 2132 (İbn Ömər)', en: 'Muslim 2132 (Ibn Umar)', ru: 'Муслим 2132 (Ибн Умар)', ar: 'مسلم 2132 (ابن عمر)', tr: 'Müslim 2132 (İbn Ömer)' },
}
