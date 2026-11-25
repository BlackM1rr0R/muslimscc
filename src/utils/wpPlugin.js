// ═══════════════════════════════════════════════════════
// WordPress plagini "Muslims.cc Prayer Times" — saf köməkçilər (brauzer API-si yoxdur)
//
// • wordpress/muslimscc-prayer-times/ — plaginin özü (PHP); bu fayl onun URL
//   qurucusunun (muslimscc_prayer_url) JS güzgüsüdür: /widget səhifəsindəki
//   shortcode nümunəsi və unit testlər (tests/unit/wp-plugin.test.js) bunu işlədir.
// • scripts/build-wp-plugin.mjs — includes/cities.php-ni PRAYER_CITIES-dən yaradır
//   və zip-i build zamanı dist/downloads/-a yazır (repoda binar fayl saxlanmır).
// • iframe hədəfi — məscid ekranı (/mosque-tv): compact=1 → yığcam görünüş,
//   kiosk=1 → tam ekran görünüşü (ayə paneli ilə), idarəetmə düymələri gizli.
//   nginx yalnız bu yolda frame-ancestors * verir (infra/nginx/muslims.cc.conf).
// ═══════════════════════════════════════════════════════

export const WP_PLUGIN_SLUG = 'muslimscc-prayer-times'
// Plagin başlığındakı "Version" və readme.txt "Stable tag" ilə EYNİ olmalıdır (unit test yoxlayır)
export const WP_PLUGIN_VERSION = '1.0.0'
export const WP_PLUGIN_ZIP = `/downloads/${WP_PLUGIN_SLUG}.zip`

export const WP_BASE = 'https://muslims.cc'
export const WP_LANGS = ['az', 'en', 'ru', 'ar', 'tr']
export const WP_THEMES = ['light', 'dark']
export const WP_LAYOUTS = ['compact', 'full']
// Yığcam görünüşün susmaya görə hündürlüyü (px) — PHP MUSLIMSCC_PRAYER_COMPACT_HEIGHT ilə EYNİ (unit test).
// Ölçülüb: 280–400 px enli yan paneldə 6 namaz sırasının hamısı kəsilmədən görünür.
export const WP_COMPACT_HEIGHT = 500

/** Şəhər id-si → shortcode açarı: 'New York' → 'new-york' (PHP sanitize_key ilə uyğun). */
export function citySlug(id) {
  return String(id ?? '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '')
}

const pick = (v, list, def) => (list.includes(v) ? v : def)

/**
 * iframe ünvanı — PHP muslimscc_prayer_url() ilə eyni sıra və kodlaşdırma.
 * cityId — PRAYER_CITIES id-si ('Baku', 'New York'); name — məscidin adı (≤ 80 simvol).
 */
export function wpWidgetUrl({ cityId = 'Baku', lang = 'az', theme = 'light', layout = 'compact', name = '' } = {}) {
  const l = pick(lang, WP_LANGS, 'az')
  const t = pick(theme, WP_THEMES, 'light')
  const lay = pick(layout, WP_LAYOUTS, 'compact')
  const parts = [
    `city=${encodeURIComponent(cityId)}`,
    `lang=${l}`,
    `theme=${t}`,
  ]
  const n = String(name ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 80)
  if (n) parts.push(`name=${encodeURIComponent(n)}`)
  parts.push(lay === 'full' ? 'kiosk=1' : 'compact=1')
  return `${WP_BASE}${l === 'az' ? '' : `/${l}`}/mosque-tv?${parts.join('&')}`
}

/** Seçimə uyğun shortcode (susmaya görə dəyərlər yazılmır). */
export function wpShortcode({ cityId = 'Baku', lang = 'az', theme = 'light', layout = 'compact' } = {}) {
  const attrs = [`city="${citySlug(cityId)}"`, `lang="${pick(lang, WP_LANGS, 'az')}"`]
  if (theme === 'dark') attrs.push('theme="dark"')
  if (layout === 'full') attrs.push('layout="full"')
  return `[muslimscc_prayer ${attrs.join(' ')}]`
}
