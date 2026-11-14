// ═══════════════════════════════════════════════════════
// Əlçatanlıq — BÜTÜN indekslənən səhifələr (v6.7), işıqlı və qaranlıq tema, kompüter.
// a11y.spec.js əsas səhifələri hər iki cihazda dərindən yoxlayır; bu fayl isə heç bir səhifənin
// yaddan çıxmamasını təmin edir: yeni bölmə əlavə olunanda da avtomatik yoxlanır.
// AI çat (xarici xidmət) və qrup (şəxsi link) çıxarılıb.
// ═══════════════════════════════════════════════════════
import AxeBuilder from '@axe-core/playwright'
import { test, expect, settle } from './fixtures.js'
import { INDEXABLE } from '../../src/seo/routes.js'

const SKIP = new Set(['aichat', 'group'])
for (const theme of ['light', 'dark']) {
  for (const p of INDEXABLE.filter(x => !SKIP.has(x.key))) {
    test(`a11y (${theme}) /${p.path}`, async ({ page }, info) => {
      test.skip(info.project.name === 'mobile', 'kompüterdə — mobil a11y.spec.js-dədir')
      await page.emulateMedia({ colorScheme: theme })
      await page.goto('/' + p.path)
      await settle(page)
      await page.waitForTimeout(600)
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze()
      expect(violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
        .flatMap(v => v.nodes.slice(0, 3).map(n => `${v.id} · ${n.target.join(' ')}`))).toEqual([])
    })
  }
}
