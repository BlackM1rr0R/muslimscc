// v5.9 (3-cü partiya): əkiz ayələr, mövzular kainatı, Quranda adı keçən yerlər
import { test, expect, settle } from './fixtures.js'

const scrollTo = async (page, loc) => {
  for (let i = 0; i < 40 && !(await loc.count()); i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(150) }
  await loc.scrollIntoViewIfNeeded()
}

test('Əkiz ayələr: 2:48 ↔ 2:123, fərqli sözlər işarəli, surə dəyişir', async ({ page }) => {
  await page.goto('/hifz')
  await settle(page)
  const tw = page.getByTestId('twin-ayahs')
  await scrollTo(page, tw)
  const pair = tw.getByTestId('tw-pair')
  await expect(pair).toContainText('2:48')
  await expect(pair).toContainText('2:123')
  expect(await pair.locator('.twa__d').count()).toBeGreaterThan(1)
  await tw.getByTestId('tw-surah').selectOption('7')
  await expect(pair).toContainText('7:')
})

test("Əkiz ayələr: «Hansı?» — fərqli sözlər gizlənir, toxunanda açılır; 2-ci surədə «Hamısını göstər»", async ({ page }) => {
  await page.goto("/hifz?tw=2:48#twin-ayahs")
  await settle(page)
  const tw = page.getByTestId("twin-ayahs")
  await expect(tw.getByTestId("tw-pair")).toContainText("2:123")
  // 2-ci surədə çoxlu əkiz var — ilk 30 düymə + «Hamısını göstər (n)»
  const more = tw.getByTestId("tw-more")
  await expect(more).toHaveAttribute("aria-expanded", "false")
  await more.click()
  await expect(more).toHaveAttribute("aria-expanded", "true")
  await tw.getByTestId("tw-quiz").click()
  await expect(tw.getByTestId("tw-quiz")).toHaveAttribute("aria-pressed", "true")
  const hidden = tw.locator(".twa__hide")
  expect(await hidden.count()).toBeGreaterThan(1)
  await expect(tw.getByTestId("tw-quizbar").getByRole("status")).toContainText("0")
  await hidden.first().click()
  await expect(hidden.first()).toHaveAttribute("aria-pressed", "true")
  await expect(tw.getByTestId("tw-quizbar").getByRole("status")).toContainText("1")
})

test('Mövzular kainatı: ulduzlar, toxunanda kök axtarılır', async ({ page }) => {
  await page.goto('/quran-roots')
  await settle(page)
  const sky = page.getByTestId('topic-sky')
  await scrollTo(page, sky)
  expect(await sky.locator('.tsky__node').count()).toBeGreaterThanOrEqual(15)
  await sky.locator('.tsky__node').first().click()
  await expect(page).toHaveURL(/[?&]root=/)
  await expect(sky.locator('.tsky__info')).toContainText('ayə')
})

test('Quranda adı keçən yerlər: xəritə, peyğəmbər seçimi, ayə keçidləri', async ({ page }) => {
  await page.goto('/history')
  await settle(page)
  const m = page.getByTestId('prophet-places')
  await scrollTo(page, m)
  await expect(m.locator('.ppm__land')).toHaveCount(1)
  await m.getByTestId('ppm-p-14').click()
  await expect(m.locator('.ppm__list li')).toHaveCount(3)
  await expect(m.locator('.ppm__list')).toContainText('10:87')
  await expect(m.locator('.ppm__list a').first()).toHaveAttribute('href', /\/quran\/\d+/)
})
