// ═══════════════════════════════════════════════════════
// Bütün marşrutlar × bütün dillər:
//   • səhifə açılır, h1 görünür, <html lang/dir> düzgündür
//   • konsolda xəta və əskik tərcümə ([i18n]) xəbərdarlığı yoxdur
//   • Qaraçuxur dövrünün izi qalmayıb
//   • görünən mətn seçilmiş dildədir (sahibin tələbi: "az seçəndə bir
//     hərf belə türkcə olmasın")
// Tam siyahı yalnız "desktop" layihəsində; mobil üçün əsas səhifələr.
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'
import { PAGES, LANGS, pathFor } from '../../src/seo/routes.js'

const PUBLIC = PAGES.filter(p => !p.noindex)
const MOBILE_KEYS = new Set(['home', 'quran', 'hadith', 'prayer', 'duas', 'jamaat'])

// Dil sızması nişanları — yalnız "güclü", birmənalı olanlar (yanlış-müsbət olmasın).
// Ətraflı yoxlama məlumat fayllarında: scripts/check-lang.mjs.
const W = (s) => new RegExp(`(^|[\\s.,;:!?«»"“”()\\-])(${s})(?=$|[\\s.,;:!?«»"“”()\\-])`, 'iu')
const LEAKS = {
  az: [W('için|değil|değildir|olarak|şöyle|böyle|gibi|veya'), /[âîû]/u, /\p{L}'(ın|in|un|ün|a|e|da|de)\b/u],
  tr: [/ə/iu, W('üçün|deyil|edir|olan şəxs')],
  en: [/[əƏ]/u, /[а-яё]{3,}/iu],
  ru: [/[əƏ]/u, W('the|and|of|için|üçün')],
  ar: [/[əƏ]/u],
}

function leaksIn(lang, text) {
  return (LEAKS[lang] || []).filter(re => re.test(text)).map(re => {
    const m = text.match(re)
    const i = m ? m.index : 0
    return `${re} → "…${text.slice(Math.max(0, i - 30), i + 40).replace(/\s+/g, ' ')}…"`
  })
}

for (const page of PUBLIC) {
  for (const lang of LANGS) {
    const url = pathFor(page.key, lang)
    test(`${url} açılır, dili təmizdir`, async ({ page: p, consoleProblems }, info) => {
      test.skip(info.project.name === 'mobile' && !MOBILE_KEYS.has(page.key), 'mobil: yalnız əsas səhifələr')

      const res = await p.goto(url)
      expect(res?.status(), 'HTTP status').toBeLessThan(400)
      await settle(p)

      await expect(p.locator('h1').first()).toBeVisible()
      await expect(p.locator('html')).toHaveAttribute('lang', lang)
      await expect(p.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
      await expect(p).toHaveTitle(/Muslims\.cc/)

      // Ərəbcə ayə/hədis blokları (lang="ar") istisnadır — orijinal mətndir
      const text = await p.locator('main, #root').first().evaluate((root) => {
        const clone = root.cloneNode(true)
        clone.querySelectorAll('[lang="ar"], script, style, [aria-hidden="true"]').forEach(n => n.remove())
        return clone.innerText
      })
      expect(text, 'Qaraçuxur izi qalmamalıdır').not.toMatch(/qara[cç]uxur|garachukhur|карачух|karaçuh|قاراچوخور/i)
      expect(leaksIn(lang, text), `${lang} səhifəsində başqa dilin izi`).toEqual([])

      expectCleanConsole(consoleProblems)
    })
  }
}
