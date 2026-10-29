// ═══════════════════════════════════════════════════════
// Hüquqi səhifələrin adları və ünvanları — yüngül modul.
// Footer (hər səhifədə yüklənir) bunu import edir; LegalDocument.jsx-in
// özünü (CSS + şablon) import etmir ki, əsas paket böyüməsin.
// ═══════════════════════════════════════════════════════
import { PAGES, pathFor } from '../seo/routes'

export const LEGAL_KEYS = ['privacy', 'terms', 'licenses']

export const LEGAL_TITLES = {
  privacy:  { az: 'Məxfilik siyasəti', en: 'Privacy Policy', ru: 'Политика конфиденциальности', ar: 'سياسة الخصوصية', tr: 'Gizlilik Politikası' },
  terms:    { az: 'İstifadə şərtləri', en: 'Terms of Use', ru: 'Условия использования', ar: 'شروط الاستخدام', tr: 'Kullanım Şartları' },
  licenses: { az: 'Mənbələr və lisenziyalar', en: 'Sources & Licenses', ru: 'Источники и лицензии', ar: 'المصادر والتراخيص', tr: 'Kaynaklar ve Lisanslar' },
}

/** Marşrut routes.js-də qeydiyyatdadırmı? (yoxdursa SPA keçidi yox, adi link) */
export const isRouted = (key) => PAGES.some(p => p.key === key)

/**
 * Hüquqi səhifənin yolu. routes.js-də açar hələ yoxdursa da düzgün URL
 * verir (slug bütün dillərdə açarın özüdür: /privacy, /en/privacy …).
 */
export function legalPath(key, lang = 'az') {
  if (isRouted(key)) return pathFor(key, lang)
  return (lang === 'az' ? '' : `/${lang}`) + `/${key}`
}
