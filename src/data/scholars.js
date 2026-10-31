// ═══════════════════════════════════════════════════════
// Sələf alimləri — 5 dil (az / en / ru / ar / tr)
//
// /scholars siyahısı və /scholars/<slug> profilləri (ScholarsPage.jsx),
// statik SEO bloku (scripts/seo-body.mjs) və detal meta (src/seo/detail.js)
// bu faylı oxuyur. Node da import etdiyi üçün importlarda .js uzantısı vacibdir.
//
// MƏNHƏC: yalnız Əhli-sünnə vəl-Cəmaat / Sələf yolunda olduğu barədə
// ittifaq olunan alimlər. Hər fakt mənbəlidir (sources → URL); mənbədə
// tapılmayan fakt yazılmır (doğum ili bilinmirsə born: null və ya approx).
// ŞƏKİL YOXDUR — alimin fotoşəkli/portreti göstərilmir (sahibin qərarı);
// interfeys adın ərəbcə xəttatlıq kartını çəkir.
//
// Sahələr (hər alim):
//   slug        — URL (ASCII, unikal): /scholars/<slug>
//   era         — 'salaf' (I–IV əsr h.: tabiinlər, məzhəb və hədis imamları)
//                 'classical' (VII–IX əsr h.) · 'revival' (XII–XIV əsr h.)
//                 'contemporary' (XIV–XV əsr h.)
//   name        — tanınan ad {ar,az,en,ru,tr}
//   fullName    — tam adı (nəsəb) {ar,az,en,ru,tr}
//   title       — qısa ləqəb/vəzifə {…}
//   born / died — { h: hicri il, g: miladi il, approx?: true } və ya null
//                 (died: null — vəfat tarixi məlumatda yoxdur)
//   birthplace  — doğulduğu yer {…} · city — əsas yaşadığı/fəaliyyət yeri {…}
//   summary     — bir cümləlik xülasə {…}
//   bio         — həyat yolu, 3–5 abzas { az: ['…','…'], en: […], … }
//   contribution— elmə töhfəsi {…}
//   teachers / students — ən məşhurları [{ar,az,en,ru,tr}]
//   works       — əsas əsərləri [{ar,az,en,ru,tr}]
//   praise      — alimlərin onun haqqında sözü [{ by:{…}, ar:'orijinal', az,en,ru,tr, ref:{…} }]
//   note        — (istəyə görə) ehtiyat qeydi, məs. əqidədəki təvillər {…}
//   sources     — [{ label, url }] (https, ən azı biri)
// ═══════════════════════════════════════════════════════

import { SCHOLARS_SALAF } from './scholars/tabiin-imams.js'
import { SCHOLARS_MUHADDITHIN } from './scholars/muhaddithin.js'
import { SCHOLARS_CLASSICAL } from './scholars/classical.js'
import { SCHOLARS_REVIVAL } from './scholars/revival.js'
import { SCHOLARS_CONTEMPORARY } from './scholars/contemporary.js'

// Dövrlər — siyahının qruplaşma sırası
export const ERAS = ['salaf', 'classical', 'revival', 'contemporary']

/** Bütün alimlər: dövr üzrə, dövrün içində doğum (yoxdursa vəfat) tarixinə görə. */
const yearOf = (s) => (s.born?.h ?? s.died?.h ?? 9999)
export const SCHOLARS = [
  ...SCHOLARS_SALAF, ...SCHOLARS_MUHADDITHIN, ...SCHOLARS_CLASSICAL,
  ...SCHOLARS_REVIVAL, ...SCHOLARS_CONTEMPORARY,
].sort((a, b) => ERAS.indexOf(a.era) - ERAS.indexOf(b.era) || yearOf(a) - yearOf(b))

export const scholarBySlug = (slug) => SCHOLARS.find(s => s.slug === slug) || null

// ── Dövr adları və hicri əsr aralığı (siyahı başlıqları, nişanlar, SEO) ──
export const ERA_LABEL = {
  salaf: { az: 'Sələf və hədis imamları', en: 'The Salaf and the hadith imams', ru: 'Саляф и имамы хадиса', ar: 'السلف وأئمة الحديث', tr: 'Selef ve hadis imamları' },
  classical: { az: 'Orta əsr imamları', en: 'Medieval imams', ru: 'Имамы средних веков', ar: 'أئمة القرون المتأخرة', tr: 'Orta çağ imamları' },
  revival: { az: 'Yeni dövr', en: 'Early modern era', ru: 'Новое время', ar: 'العصر الحديث', tr: 'Yeni dönem' },
  contemporary: { az: 'Müasir alimlər', en: 'Contemporary scholars', ru: 'Современные учёные', ar: 'العلماء المعاصرون', tr: 'Çağdaş âlimler' },
}
// Qısa nişan (kartda): Sələf · Orta əsr · Yeni dövr · Müasir
export const ERA_SHORT = {
  salaf: { az: 'Sələf', en: 'Salaf', ru: 'Саляф', ar: 'السلف', tr: 'Selef' },
  classical: { az: 'Orta əsr', en: 'Medieval', ru: 'Средние века', ar: 'المتأخرون', tr: 'Orta çağ' },
  revival: { az: 'Yeni dövr', en: 'Early modern', ru: 'Новое время', ar: 'العصر الحديث', tr: 'Yeni dönem' },
  contemporary: { az: 'Müasir', en: 'Contemporary', ru: 'Современность', ar: 'المعاصرون', tr: 'Çağdaş' },
}
export const ERA_SPAN = {
  salaf: { az: 'hicri I–IV əsrlər', en: '1st–4th centuries AH', ru: 'I–IV века хиджры', ar: 'القرون الأربعة الأولى للهجرة', tr: 'hicri 1–4. asırlar' },
  classical: { az: 'hicri VII–IX əsrlər', en: '7th–9th centuries AH', ru: 'VII–IX века хиджры', ar: 'القرون السابع إلى التاسع للهجرة', tr: 'hicri 7–9. asırlar' },
  revival: { az: 'hicri XII–XIV əsrlər', en: '12th–14th centuries AH', ru: 'XII–XIV века хиджры', ar: 'القرون الثاني عشر إلى الرابع عشر للهجرة', tr: 'hicri 12–14. asırlar' },
  contemporary: { az: 'hicri XIV–XV əsrlər', en: '14th–15th centuries AH', ru: 'XIV–XV века хиджры', ar: 'القرنان الرابع عشر والخامس عشر للهجرة', tr: 'hicri 14–15. asırlar' },
}

// Tarix yazılışı: hicri / miladi işarəsi və "təxminən" (approx) sözü
const DATE_FMT = {
  az: { h: (y) => `h. ${y}`, g: (y) => `m. ${y}`, c: 'təq.', born: 'doğulub' },
  en: { h: (y) => `${y} AH`, g: (y) => `${y} CE`, c: 'c.', born: 'born' },
  ru: { h: (y) => `${y} г. х.`, g: (y) => `${y} г.`, c: 'ок.', born: 'род.' },
  ar: { h: (y) => `${y} هـ`, g: (y) => `${y} م`, c: 'نحو', born: 'وُلد' },
  tr: { h: (y) => `h. ${y}`, g: (y) => `m. ${y}`, c: 'yak.', born: 'doğumu' },
}
const fmtOf = (lang) => DATE_FMT[lang] || DATE_FMT.en

/** Bir tarix: { h, g, approx } → "h. 661 (m. 1263)"; yoxdursa ''. */
export function dateText(d, lang) {
  if (!d || d.h == null) return ''
  const F = fmtOf(lang)
  const base = d.g != null ? `${F.h(d.h)} (${F.g(d.g)})` : F.h(d.h)
  return d.approx ? `${F.c} ${base}` : base
}

/**
 * Ömür aralığı — kart və hero üçün qısa: "h. 661–728 · m. 1263–1328".
 * Vəfat tarixi məlumatda yoxdursa: "doğulub h. 1354 (m. 1935)".
 */
export function lifeSpan(s, lang) {
  const F = fmtOf(lang)
  const b = s.born, d = s.died
  if (!d) return b ? `${F.born} ${dateText(b, lang)}` : ''
  const pre = b?.approx ? `${F.c} ` : ''
  if (!b) return dateText(d, lang)
  // "təxminən" yalnız doğum ilinə aiddir — bir dəfə, əvvəldə yazılır
  const h = `${pre}${F.h(`${b.h}–${d.h}`)}`
  const g = b.g != null && d.g != null ? F.g(`${b.g}–${d.g}`) : ''
  return g ? `${h} · ${g}` : h
}
