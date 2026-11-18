// ═══════════════════════════════════════════════════════
// /prayer/<şəhər> — prerender olunmuş statik aylıq cədvəlin (scripts/seo-body.mjs → prayerCityBody)
// əsr sütunu istifadəçinin məzhəbinə görə (J1, utils/madhab).
//
// Statik HTML-də (SEO, məzhəb bilinmir) əsr 1× — bu düzgündür və dəyişmir. Brauzerdə Hənəfi
// seçilibsə (2×), React tətbiqi kökü əvəz edənə qədər görünən statik cədvəldə də əsr yenidən
// hesablanır (eyni yol: prayCalc.computeTimes + withAsr, usePrayerMonth / YearPrayerChart kimi)
// və cədvəlin üstünə qısa qeyd yazılır. Tətbiqin öz aylıq cədvəli (usePrayerMonth) onsuz da
// məzhəbə tabedir. main.jsx → patchStaticPrayerAsr(); tests/unit/static-prayer-asr.test.js,
// tests/e2e/seo-prayer-city.spec.js
// ═══════════════════════════════════════════════════════
import { prayerCity, methodOf, PRAYER_LABELS } from './prayerCity.js'
import { computeTimes, tzOffsetHours, withAsr } from '../utils/prayCalc.js'
import { pickUi } from '../utils/uiText.js'

// Qeyd: "Əsr: Hənəfi (2×)" — əsr adı PRAYER_LABELS-dən, məzhəb adı burada
export const HANAFI_NAME = { az: 'Hənəfi', en: 'Hanafi', ru: 'ханафитский мазхаб', ar: 'الحنفي', tr: 'Hanefî' }

/** Statik cədvəlin qeydi: "Əsr: Hənəfi (2×)". lang — interfeys dili (əlavə dildə 'en', lüğət tərcümə edir) */
export function asrNote(lang) {
  const asr = PRAYER_LABELS.asr[lang] || PRAYER_LABELS.asr.en
  return `${asr}: ${pickUi(HANAFI_NAME, lang, 'en')} (2×)`
}

/** Şəhərin (slug) ayı üçün əsr vaxtları (gün sırası ilə) — factor 1 | 2; şəhər tanınmırsa null */
export function asrColumn(slug, year, month, factor) {
  const c = prayerCity(slug)
  if (!c || !Number.isInteger(year) || !(month >= 1 && month <= 12)) return null
  const method = withAsr(methodOf(c), factor)
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const out = []
  for (let d = 1; d <= days; d++) {
    out.push(computeTimes({ year, month, day: d }, c.lat, c.lng, tzOffsetHours(c.tz, year, month, d), method).asr)
  }
  return out
}

/**
 * doc-dakı statik cədvəli (table[data-city][data-ym]) yenilə. → true (dəyişdi) | false.
 * Yalnız Hənəfi (2×) üçün işləyir; 1× — prerender onsuz da düzgündür.
 */
export function patchStaticPrayerAsr(doc, factor, lang) {
  if (Number(factor) !== 2 || !doc) return false
  const table = doc.querySelector('table.seo-static__table[data-city][data-ym]')
  if (!table || table.dataset.asr === '2') return false
  const [y, m] = String(table.dataset.ym).split('-').map(Number)
  const col = asrColumn(table.dataset.city, y, m, 2)
  if (!col) return false
  const heads = [...table.querySelectorAll('thead th')]
  const idx = heads.findIndex((th) => th.dataset.k === 'asr')
  if (idx < 1) return false
  table.querySelectorAll('tbody tr').forEach((tr, i) => {
    const cell = tr.children[idx]
    if (cell && col[i]) cell.textContent = col[i]
  })
  table.dataset.asr = '2'
  const note = doc.createElement('p')
  note.className = 'seo-static__note'
  note.setAttribute('data-asr-note', '')
  note.textContent = asrNote(lang || 'az')
  table.parentNode.insertBefore(note, table)
  return true
}
