// ═══════════════════════════════════════════════════════
// Quranda rənglər (v8) — components/QuranColors.jsx
//
// QAYDA: yalnız Quranın AÇIQ ADINI ÇƏKDİYİ rənglər və sözün keçdiyi 1–3 ayə.
//   • forms — sözün hərəkəsiz (plainAr) formaları. scripts/build-quran-colors.mjs və test hər ayədə
//     bu formalardan birinin AYRICA SÖZ kimi keçdiyini yoxlayır (bitkilərdəki üsul: و/ف, ب/ك/ل, ال
//     önşəkilçiləri və ها/ا sonluğu atılır) — yoxdursa build dayanır (səhv ayə yayımlanmasın);
//   • refs — sözün keçdiyi ayələr;
//   • hex — yalnız palitrada boyamaq üçündür (ayənin "çaları" haqqında iddia deyil).
// زُرْق (20:102) — mənası təfsirçilər arasında fərqli izah olunur, ona görə rəng adı verilmir:
//   yalnız «zurq» sözü və ayə göstərilir, xüsusi zolaqlı (neytral) nümunə ilə (neutral: true).
// Ayə mətni və tərcüməsi burada yazılmır — build skripti onları seo-data/quran-dan hərfi-hərfinə
// götürür → public/data/quran-colors/<dil>.json. Təfsir yazılmır.
// ═══════════════════════════════════════════════════════
import { plainAr } from './quranPlants.js'

export { plainAr }

export const QURAN_COLORS = [
  { id: 'white', ar: 'بِيض · الأَبْيَض', hex: '#f4f1ea', forms: ['بيض', 'ابيض', 'ابيضت', 'تبيض'], refs: ['35:27', '2:187', '3:107'],
    name: { az: 'Ağ', en: 'White', ru: 'Белый', ar: 'الأبيض', tr: 'Beyaz' } },
  { id: 'black', ar: 'سُود · الأَسْوَد', hex: '#22201f', forms: ['سود', 'اسود', 'اسودت', 'تسود', 'مسودا', 'مسودة'], refs: ['35:27', '2:187', '3:106'],
    name: { az: 'Qara', en: 'Black', ru: 'Чёрный', ar: 'الأسود', tr: 'Siyah' } },
  { id: 'red', ar: 'حُمْر', hex: '#b8322c', forms: ['حمر'], refs: ['35:27'],
    name: { az: 'Qırmızı', en: 'Red', ru: 'Красный', ar: 'الأحمر', tr: 'Kırmızı' } },
  { id: 'yellow', ar: 'صَفْرَاء · مُصْفَرًّا', hex: '#e9b824', forms: ['صفراء', 'صفر', 'مصفر'], refs: ['2:69', '39:21', '77:33'],
    name: { az: 'Sarı', en: 'Yellow', ru: 'Жёлтый', ar: 'الأصفر', tr: 'Sarı' } },
  { id: 'green', ar: 'خُضْر · الأَخْضَر', hex: '#2f8a4c', forms: ['خضر', 'اخضر', 'مخضرة'], refs: ['18:31', '36:80', '22:63'],
    name: { az: 'Yaşıl', en: 'Green', ru: 'Зелёный', ar: 'الأخضر', tr: 'Yeşil' } },
  { id: 'zurq', ar: 'زُرْقًا', hex: '#7d8a99', neutral: true, forms: ['زرق'], refs: ['20:102'],
    name: { az: 'zurq', en: 'zurq', ru: 'зурк', ar: 'زُرْقًا', tr: 'zurq' } }, // lang-ok[zurq]: ərəb sözünün transliterasiyası
  { id: 'various', ar: 'مُخْتَلِفٌ أَلْوَانُهُ', hex: '', forms: ['الون', 'الونه', 'الونكم'], refs: ['35:28', '16:69', '30:22'],
    name: { az: 'Rəngarəng', en: 'Of various colours', ru: 'Разных цветов', ar: 'مختلف ألوانه', tr: 'Rengârenk' } },
]

/** Sözün önşəkilçilərini (و/ف, ب/ك/ل, ال) və ها/ا sonluğunu at → lüğət forması namizədləri (quranPlants.js ilə eyni) */
const stems = (w) => {
  const out = new Set([w])
  for (const a of [w, w.replace(/^[وف]/, '')]) {
    for (const b of [a, a.replace(/^[بكل]/, '')]) {
      for (const c of [b, b.replace(/^ال/, '')]) { out.add(c); out.add(c.replace(/(ها|ا)$/, '')) }
    }
  }
  return out
}
/** Rəngin sözü ayə mətnində ayrıca söz kimi keçirmi? */
export const colorInAyah = (color, ayahText) =>
  plainAr(ayahText).split(/\s+/).some(w => { const s = stems(w); return color.forms.some(f => s.has(f)) })

/** Hər ayə ilə hansı rənglər bağlıdır (35:27 → ağ, qırmızı, qara) */
export const colorsOfRef = (ref) => QURAN_COLORS.filter(c => c.refs.includes(ref)).map(c => c.id)

/** Ayə mətnində rəng sözünün keçdiyi sözlərin indeksləri (boşluqla bölünmüş orijinal mətndə) — vurğulamaq üçün; mətn dəyişmir */
export const colorWordIdx = (color, ayahText) => String(ayahText).split(' ')
  .map((w, i) => { const s = stems(plainAr(w)); return color.forms.some(f => s.has(f)) ? i : -1 }).filter(i => i >= 0)
