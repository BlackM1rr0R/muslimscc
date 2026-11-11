// v6.0 (2-ci partiya): iki tərcümə yan-yana, hədis qalaktikası
import { test, expect, settle } from './fixtures.js'

const SURA_RE = /quranenc\.com\/api\/v1\/translation\/sura\/([a-z_]+)\/(\d+)/
async function mockQuranEnc(page) {
  await page.route(SURA_RE, route => {
    const [, key, sura] = route.request().url().match(SURA_RE)
    route.fulfill({ json: { result: Array.from({ length: 7 }, (_, i) => ({ id: String(i + 1), sura, aya: String(i + 1), arabic_text: 'x', translation: `fərqli söz ${key} ${i + 1}`, footnotes: '' })) } })
  })
  await page.route(/quranenc\.com\/api\/v1\/translations\/list\//, route => route.fulfill({ json: { translations: [] } }))
}

test('İki tərcümə yan-yana: müqayisə seçilir, hər ayədə iki sütun, fərqli sözlər işarəli, seçim yadda qalır', async ({ page }) => {
  await mockQuranEnc(page)
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  await page.getByTestId('compare-select').selectOption('azeri_musayev')
  const cmp = page.getByTestId('ayah-cmp')
  await expect(cmp).toHaveCount(7)
  await expect(cmp.first()).toContainText('Musayev')
  await expect(cmp.first()).toContainText('Məmmədəliyev')
  expect(await cmp.first().locator('mark.ayah-cmp__d').count()).toBeGreaterThan(0)
  await page.reload()
  await settle(page)
  await expect(page.getByTestId('ayah-cmp')).toHaveCount(7)
  await page.getByTestId('compare-select').selectOption('')
  await expect(page.getByTestId('ayah-cmp')).toHaveCount(0)
})

test('Hədis qalaktikası: kətan, mövzu seçilir, "siyahıda göstər" süzgəci açır', async ({ page }) => {
  await page.goto('/hadith')
  await settle(page)
  const g = page.getByTestId('hadith-galaxy')
  for (let i = 0; i < 30 && !(await g.count()); i++) { await page.mouse.wheel(0, 600); await page.waitForTimeout(150) }
  await g.scrollIntoViewIfNeeded()
  await expect(g.getByTestId('hgx-canvas')).toBeVisible()
  await g.locator('.hgx__chips button', { hasText: 'Namaz' }).click()
  await expect(g.getByTestId('hgx-info')).toContainText('Namaz')
  await g.getByTestId('hgx-show').click()
  await expect(page.locator('.hadith-chips .ui-chip[aria-pressed="true"]', { hasText: 'Namaz' })).toBeVisible()
})
