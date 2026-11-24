// ═══════════════════════════════════════════════════════
// Hisnul-Müslim zikrinin səhifəsi (/ar/hisnul-muslim/<fəsil>-<bənd>) — kiçik ortaq köməkçilər:
// SEO mətnləri (src/seo/detail.js), statik blok (scripts/seo-body.mjs) və səhifənin özü
// (src/components/hisn/HisnDua.jsx) eyni yazıları və eyni qısaltmanı işlədir.
// Səhifə YALNIZ ərəbcədir (sahibin qərarı, 2026-11-24) — yazılar dil açarsızdır.
// detail.js-dən ayrıdır: zikr səhifəsinin chunk-ı detail.js-in Quran/ad məlumatını çəkməsin.
// ═══════════════════════════════════════════════════════

export const HISN_BOOK = { name: 'حصن المسلم من أذكار الكتاب والسنة', short: 'حصن المسلم', author: 'سعيد بن علي بن وهف القحطاني' }

export const HISN_AR = {
  more: 'النص العربي من كتاب حصن المسلم مع التخريج وعدد المرات.',
  src: 'التخريج',
  repeat: 'عدد المرات',
  times: (n) => (n === 2 ? 'مرتان' : n <= 10 ? `${n} مرات` : `${n} مرة`),
  chapter: 'الباب',
  all: 'كل أذكار حصن المسلم',
  prev: 'الذكر السابق',
  next: 'الذكر التالي',
  book: (b) => `من كتاب «${b.name}» لـ${b.author}.`,
  crumbs: 'مسار التنقل',
  home: 'الرئيسية',
  pager: 'التنقل بين الأذكار',
  loading: 'جارٍ التحميل…',
  error: 'تعذّر تحميل الذكر. تحقّق من الاتصال وأعد المحاولة.',
  retry: 'أعد المحاولة',
  page: 'صفحة هذا الذكر',
  copy: 'نسخ',
  copied: 'تم النسخ',
}

// Hərəkələr (fəthə…sukun, şəddə, Quran işarələri), üst əlif, tətvil
const DIAC = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g
/** Başlıq/təsvir üçün: hərəkəsiz, mötərizəsiz (səhifədəki mətn isə olduğu kimidir). */
export const hisnPlain = (s) => String(s || '').replace(DIAC, '').replace(/[(){}[\]﴿﴾«»*]/g, ' ')
  .replace(/\s+/g, ' ').replace(/\s+([،,.:؛])/g, '$1').replace(/^[\s،,.:؛-]+/, '').trim()

/** Mətnin əvvəli — söz sərhədində, ≤ max simvol (detail.js → snippet ilə eyni qayda). */
export function hisnClip(text, max) {
  const s = String(text || '').replace(/\s+/g, ' ').trim()
  if ([...s].length <= max) return s.replace(/[.»"”]+$/, '')
  const cut = [...s].slice(0, max).join('')
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max * 0.6)).replace(/[،,;:—–-]+$/, '')}…`
}

/** İzdəki / linkdəki qısa ad: mətnin hərəkəsiz əvvəli. */
export const hisnCrumb = (ar) => hisnClip(hisnPlain(ar), 40)

/** Slug ('27-1') → { chapter, n } və ya null. */
export function hisnSlug(slug) {
  const m = /^(\d{1,3})-(\d{1,2})$/.exec(String(slug || ''))
  return m ? { chapter: Number(m[1]), n: Number(m[2]) } : null
}

/** ar.json fəsilləri + slug → { chapter, n, count, chapterTitle, ar, src, repeat, index } və ya null. */
export function hisnItem(chapters, slug) {
  const s = hisnSlug(slug)
  if (!s || !Array.isArray(chapters)) return null
  const ch = chapters.find(c => c.id === s.chapter)
  const it = ch?.items?.[s.n - 1]
  if (!it) return null
  return { chapter: ch.id, n: s.n, index: s.n - 1, count: ch.items.length, chapterTitle: ch.titleAr || ch.title, ar: it.ar, src: it.src || '', repeat: it.repeat || 1 }
}
