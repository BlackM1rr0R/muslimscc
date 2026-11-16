// ═══════════════════════════════════════════════════════
// Quran bitkiləri bağı (v7.1) — components/QuranPlants.jsx (/kids, "Quranda heyvanlar"ın yanında)
//
// QAYDA: yalnız Quranın ADINI AÇIQ ÇƏKDİYİ və mənası alimlər arasında mübahisəsiz olan bitkilər.
//   • forms — sözün hərəkəsiz (plainAr) lüğət formaları. scripts/build-quran-plants.mjs və test
//     hər ayədə bu formalardan birinin AYRICA SÖZ kimi keçdiyini yoxlayır (و/ف/ب/ك/ل, ال önşəkilçiləri
//     və ها/ا sonluğu atılır) — yoxdursa build dayanır;
//   • refs — sözün keçdiyi 1–3 ayə.
// Saylar YAZILMIR (sözün bütün formalarını tam mətndən etibarlı saymaq üçün morfoloji təhlil lazımdır).
// Kənarda qalanlar (mənası mübahisəlidir): فوم (sarımsaq / buğda), طلح (banan / akasiya), خمط, قضب,
//   ريحان 55:12 (ətirli bitki / ruzi), كافور 76:5 (maddə / bulaq adı).
// Ayə mətni və tərcüməsi burada yazılmır — build skripti onları heyvanlarla eyni mənbədən
// (seo-data/quran) hərfi-hərfinə götürür → public/data/quran-plants/<dil>.json. Təfsir yazılmır.
// ═══════════════════════════════════════════════════════
export const QURAN_PLANTS = [
  { id: 'palm', ar: 'النَّخْل', forms: ['نخل', 'نخلة', 'نخيل'], refs: ['19:25', '50:10'],
    name: { az: 'Xurma ağacı', en: 'Date palm', ru: 'Финиковая пальма', ar: 'النخل', tr: 'Hurma ağacı' } },
  { id: 'olive', ar: 'الزَّيْتُون', forms: ['زيتون', 'زيتونة'], refs: ['95:1', '24:35'],
    name: { az: 'Zeytun', en: 'Olive', ru: 'Олива', ar: 'الزيتون', tr: 'Zeytin' } },
  { id: 'fig', ar: 'التِّين', forms: ['تين'], refs: ['95:1'],
    name: { az: 'Əncir', en: 'Fig', ru: 'Инжир', ar: 'التين', tr: 'İncir' } },
  { id: 'pomegranate', ar: 'الرُّمَّان', forms: ['رمان'], refs: ['55:68', '6:99'],
    name: { az: 'Nar', en: 'Pomegranate', ru: 'Гранат', ar: 'الرمان', tr: 'Nar' } },
  { id: 'grapes', ar: 'العِنَب', forms: ['عنب', 'اعناب', 'اعنب'], refs: ['80:28', '6:99'],
    name: { az: 'Üzüm', en: 'Grapes', ru: 'Виноград', ar: 'العنب', tr: 'Üzüm' } },
  { id: 'lote', ar: 'السِّدْر', forms: ['سدر', 'سدرة'], refs: ['53:14', '56:28', '34:16'],
    name: { az: 'Sidr ağacı', en: 'Lote tree', ru: 'Лотосовое дерево', ar: 'السدر', tr: 'Sidre ağacı' } },
  { id: 'mustard', ar: 'الخَرْدَل', forms: ['خردل'], refs: ['31:16', '21:47'],
    name: { az: 'Xardal toxumu', en: 'Mustard seed', ru: 'Горчичное зерно', ar: 'الخردل', tr: 'Hardal tanesi' } },
  { id: 'ginger', ar: 'الزَّنْجَبِيل', forms: ['زنجبيل'], refs: ['76:17'],
    name: { az: 'Zəncəfil', en: 'Ginger', ru: 'Имбирь', ar: 'الزنجبيل', tr: 'Zencefil' } },
  { id: 'gourd', ar: 'اليَقْطِين', forms: ['يقطين'], refs: ['37:146'],
    name: { az: 'Qabaq', en: 'Gourd', ru: 'Тыква', ar: 'اليقطين', tr: 'Kabak' } },
  { id: 'lentils', ar: 'العَدَس', forms: ['عدس'], refs: ['2:61'],
    name: { az: 'Mərci', en: 'Lentils', ru: 'Чечевица', ar: 'العدس', tr: 'Mercimek' } },
  { id: 'cucumber', ar: 'القِثَّاء', forms: ['قثاء', 'قثائ'], refs: ['2:61'],
    name: { az: 'Xiyar', en: 'Cucumber', ru: 'Огурец', ar: 'القثاء', tr: 'Salatalık' } },
  { id: 'onion', ar: 'البَصَل', forms: ['بصل'], refs: ['2:61'],
    name: { az: 'Soğan', en: 'Onion', ru: 'Лук', ar: 'البصل', tr: 'Soğan' } },
  { id: 'tamarisk', ar: 'الأَثْل', forms: ['اثل'], refs: ['34:16'],
    name: { az: 'Yulğun', en: 'Tamarisk', ru: 'Тамариск', ar: 'الأثل', tr: 'Ilgın' } },
]

/** Hərəkələri və Osmani işarələrini sil (müqayisə üçün) — quranAnimals.js-dəki ilə eyni, + tətvil */
export const plainAr = (x) => String(x).normalize('NFC')
  .replace(/[ؐ-ًؚ-ٰٟۖ-ۭ]/g, '')
  .replace(/[ٱأإآ]/g, 'ا')
  .replace(/ـ/g, '')

/** Sözün önşəkilçilərini (و/ف, ب/ك/ل, ال) və ها/ا sonluğunu at → lüğət forması namizədləri */
const stems = (w) => {
  const out = new Set([w])
  for (const a of [w, w.replace(/^[وف]/, '')]) {
    for (const b of [a, a.replace(/^[بكل]/, '')]) {
      for (const c of [b, b.replace(/^ال/, '')]) { out.add(c); out.add(c.replace(/(ها|ا)$/, '')) }
    }
  }
  return out
}
/** Bitkinin adı ayə mətnində ayrıca söz kimi keçirmi? */
export const plantInAyah = (plant, ayahText) =>
  plainAr(ayahText).split(/\s+/).some(w => { const s = stems(w); return plant.forms.some(f => s.has(f)) })
