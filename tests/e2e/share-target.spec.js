// PWA paylaşma hədəfi (/share — site.webmanifest share_target, GET):
//   • birbaşa giriş — izah, əməl yoxdur, noindex
//   • ərəbcə → "Quranda tap" (alquran.cloud axtarışı — burada sabit cavab), ayə keçidi
//   • tərkib (E-kodlar) → halal yoxlaması ?q= ilə dolur
//   • dua gündəliyinə yazmaq (dua_journal), yalnız keçid → yalnız gündəlik
import { test, expect, settle, expectCleanConsole } from './fixtures.js'

const SEARCH = {
  code: 200, status: 'OK',
  data: {
    count: 2,
    matches: [
      { number: 1, text: '﻿بسم الله الرحمن الرحيم', surah: { number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ' }, numberInSurah: 1 },
      { number: 3, text: 'الرحمن الرحيم', surah: { number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ' }, numberInSurah: 3 },
    ],
  },
}

test('manifest: share_target GET /share', async ({ request }) => {
  const res = await request.get('/site.webmanifest')
  expect(res.ok()).toBe(true)
  const m = JSON.parse(await res.text())
  expect(m.share_target).toEqual({ action: '/share', method: 'GET', params: { title: 'title', text: 'text', url: 'url' } })
})

test('birbaşa giriş: izah və addımlar, əməl yoxdur; mətn yapışdıranda əməllər çıxır', async ({ page, consoleProblems }) => {
  await page.goto('/en/share')
  await settle(page)
  await expect(page.locator('h1')).toHaveText('Open what you shared')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  await expect(page.getByTestId('share-empty')).toBeVisible()
  await expect(page.locator('.shr-how__step')).toHaveCount(3)
  await expect(page.getByTestId('share-actions')).toHaveCount(0)
  await page.getByTestId('share-text').fill('Patience in hard times')
  await expect(page.locator('[data-testid=share-actions] > li').first()).toHaveAttribute('data-action', 'meaning')
  await expect(page.getByTestId('share-actions').getByRole('link', { name: 'Search by meaning' })).toHaveAttribute('href', `/en/quran-meaning?q=${encodeURIComponent('Patience in hard times')}`)
  await expectCleanConsole(consoleProblems)
})

test('ərəbcə ayə → Quranda tap: nəticələr və ayə keçidi', async ({ page, consoleProblems }) => {
  let asked = ''
  await page.route(/api\.alquran\.cloud\/v1\/search\//, (route) => { asked = decodeURIComponent(route.request().url()); return route.fulfill({ json: SEARCH }) })
  await page.goto(`/en/share?text=${encodeURIComponent('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ')}`)
  await settle(page)
  await expect(page.getByTestId('share-text')).toHaveValue('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ')
  // Şəxsi mətn ünvanda qalmır (tarixçə / Referer) — sorğu sətri silinir
  await expect(page).toHaveURL(/\/en\/share$/)
  const first = page.locator('[data-testid=share-actions] > li').first()
  await expect(first).toHaveAttribute('data-action', 'quran')
  await expect(first.locator('.shr-act__best')).toHaveText('Recommended')
  await first.getByRole('button', { name: 'Search the Quran' }).click()
  const res = page.getByTestId('share-quran-results')
  await expect(res.locator('.shr-res__item')).toHaveCount(2)
  await expect(res.locator('.shr-res__count')).toHaveText('2 verses found')
  expect(asked).toContain('/search/بسم الله الرحمن الرحيم/all/quran-simple-clean')
  await expect(res.getByRole('link', { name: 'Open the verse' }).first()).toHaveAttribute('href', /^\/en\/quran\/1(-[a-z-]+)?\?a=1$/)
  await expectCleanConsole(consoleProblems)
})

test('tərkib → halal yoxlaması E-kodlarla dolur', async ({ page, consoleProblems }) => {
  await page.goto(`/en/share?title=${encodeURIComponent('Gummy bears')}&text=${encodeURIComponent('Ingredients: glucose syrup, gelatine, E471, colour E120')}`)
  await settle(page)
  const first = page.locator('[data-testid=share-actions] > li').first()
  await expect(first).toHaveAttribute('data-action', 'halal')
  await expect(first).toContainText('2 E-numbers found in the text')
  const link = first.getByRole('link', { name: 'Open the halal check' })
  await expect(link).toHaveAttribute('href', `/en/halal-check?q=${encodeURIComponent('E471, E120')}`)
  await link.click()
  await expect(page).toHaveURL(/\/en\/halal-check\?q=/)
  await expect(page.locator('.hc-search__input')).toHaveValue('E471, E120')
  await expectCleanConsole(consoleProblems)
})

test('dua gündəliyinə saxla — gündəlikdə görünür', async ({ page, consoleProblems }) => {
  const dua = 'Allahım, ailəmizə xeyir ver'
  await page.goto(`/share?text=${encodeURIComponent(dua)}`)
  await settle(page)
  const card = page.locator('[data-testid=share-actions] > li[data-action=dua]')
  await card.getByRole('button', { name: 'Gündəliyə saxla' }).click()
  await expect(card.locator('.shr-ok')).toContainText('Dua gündəliyinə əlavə olundu.')
  await expect(page.getByRole('status').filter({ hasText: 'Dua gündəliyinə əlavə olundu.' })).toHaveCount(1)
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('dua_journal')))
  expect(stored.duas[0]).toMatchObject({ text: dua, category: 'personal', answered: false })
  await card.getByRole('link', { name: 'Gündəliyi aç' }).click()
  await expect(page).toHaveURL(/\/duajournal$/)
  await expect(page.getByText(dua).first()).toBeVisible()
  await expectCleanConsole(consoleProblems)
})

test('yalnız keçid: yalnız gündəlik əməli, host göstərilir; ərəbcə interfeys RTL', async ({ page, consoleProblems }) => {
  await page.goto(`/ar/share?url=${encodeURIComponent('https://example.com/article?id=1')}`)
  await settle(page)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('[data-testid=share-actions] > li')).toHaveCount(1)
  await expect(page.locator('[data-testid=share-actions] > li')).toHaveAttribute('data-action', 'dua')
  const a = page.locator('.shr-input__link a')
  await expect(a).toHaveText('example.com')
  await expect(a).toHaveAttribute('rel', /noopener/)
  await expectCleanConsole(consoleProblems)
})
