// ═══════════════════════════════════════════════════════
// P2 həyat bələdçiləri: /newborn-sunnah, /when-a-loved-one-dies, /nikah-preparation
//   • körpə: doğum günü → doğum günü və 7-ci gün (miladi + hicri), gecə doğulub → bir gün sonra,
//     .ics yüklənir, işarə newborn_plan_v1-ə yazılır və yenidən yükləmədə qalır, qeydləri sil
//   • dərs mətni (aqiqah) mount-dan sonra dərsin özündən gəlir — mənbə ilə; qulağa azan — yalnız dərsin qeydi
//   • vəfat: işarələr loved_guide_v1, Hisn təziyə duası mənbə ilə, miras və hesab (#loved) keçidləri
//   • nikah: sual qeydi və vəlimə planı nikah_prep_v1-də qalır
//   • axe (açıq + tünd), ərəbcə RTL, 360px-də üfüqi daşma yoxdur; yeni /api çağırışı yoxdur
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole } from './fixtures.js'

async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  for (const sel of include) b = b.include(sel)
  const { violations } = await b.analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 120)}`))
}
const store = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), key)

test('körpə: doğum günü → 7-ci gün (miladi + hicri), gecə doğulub, .ics, işarə qalır', async ({ page, consoleProblems }) => {
  await page.goto('/en/newborn-sunnah')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Newborn Sunnah plan')
  await expect(page.getByText('Enter the date of birth to see the plan.')).toBeVisible()

  // Dərsdəki nümunə: cümə doğulan — əqiqə gələn cümə axşamı
  await page.getByLabel('Date of birth').fill('2026-11-20')
  await expect(page.getByTestId('nb-day1')).toContainText('Friday')
  await expect(page.getByTestId('nb-day1')).toContainText('20 November 2026')
  await expect(page.getByTestId('nb-day7')).toContainText('Thursday')
  await expect(page.getByTestId('nb-day7')).toContainText('26 November 2026')
  await expect(page.getByTestId('nb-day7')).toContainText('AH')
  expect((await store(page, 'newborn_plan_v1')).b).toBe('2026-11-20')

  await page.getByLabel('Born at night').check()
  await expect(page.getByTestId('nb-day7')).toContainText('27 November 2026')
  expect((await store(page, 'newborn_plan_v1')).n).toBe(true)

  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Add the seventh day to my calendar (.ics)' }).click(),
  ])
  expect(dl.suggestedFilename()).toBe('muslims-cc-newborn-2026-11-27.ics')

  // Dərs mətni mənbə ilə (dərsin özündən), qulağa azan — yalnız dərsin qeydi, işarə yoxdur
  const tahnik = page.locator('#nb-step-tahnik')
  await tahnik.getByText('What the lesson says — with sources').click()
  await expect(tahnik.locator('.ls-hadith cite').first()).toContainText('al-Bukhari 5467')
  await expect(tahnik.getByRole('link', { name: /^Lesson: Aqiqah/ })).toHaveAttribute('href', '/en/learn/aqiqah#ls-tahnik')
  const adhan = page.locator('#nb-step-adhan')
  await expect(adhan.getByRole('checkbox')).toHaveCount(0)
  await adhan.getByText('What the lesson says — with sources').click()
  await expect(adhan.locator('.ls-note')).toContainText('weak or fabricated')
  await expect(page.locator('#nb-step-name').getByRole('link', { name: 'Baby names' })).toHaveAttribute('href', '/en/muslim-baby-names')
  // Hisn: təbrik duası mənbə ilə
  const congrats = page.locator('#nb-step-congrats')
  await congrats.getByText('Dua from Hisn al-Muslim').click()
  await expect(congrats.locator('.ls-dua__src')).toContainText('an-Nawawi')

  const cb = tahnik.getByRole('checkbox', { name: 'Done' })
  await cb.check()
  await expect(cb).toBeChecked()
  await expect(page.getByTestId('nb-progress')).toContainText('1 of 4 steps marked')
  expect(Object.keys((await store(page, 'newborn_plan_v1')).d)).toEqual(['tahnik'])

  await page.reload()
  await settle(page)
  await expect(page.locator('#nb-step-tahnik').getByRole('checkbox')).toBeChecked()
  await expect(page.getByLabel('Date of birth')).toHaveValue('2026-11-20')

  // Qeydləri sil (daxili təsdiq)
  await page.getByRole('button', { name: 'Delete my notes' }).click()
  await page.getByRole('button', { name: 'Yes, delete' }).click()
  await expect(page.getByText('Enter the date of birth to see the plan.')).toBeVisible()
  expect(await store(page, 'newborn_plan_v1')).toBeNull()
  await expect(page.getByRole('button', { name: 'Delete my notes' })).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

test('vəfat bələdçisi: mərhələlər, Hisn təziyə duası, keçidlər, işarə yalnız bu cihazda', async ({ page, consoleProblems }) => {
  await page.goto('/en/when-a-loved-one-dies')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('When a loved one passes away: a family guide')
  for (const h of ['The first hour', 'The first day', 'The first week', 'Later']) {
    await expect(page.getByRole('heading', { level: 2, name: h })).toBeVisible()
  }
  await expect(page.locator('.lg-step')).toHaveCount(12)

  const cond = page.locator('#lo-step-condolence')
  await cond.getByText('Dua from Hisn al-Muslim').click()
  await expect(cond.locator('.lg-hisn__item').first().locator('.ls-dua__src')).toContainText('Bukhari')
  await expect(cond.getByRole('link', { name: /^Open in Hisn al-Muslim/ })).toHaveAttribute('href', '/en/hisnul-muslim#hs-58')

  const janazah = page.locator('#lo-step-janazah')
  await janazah.getByText('What the lesson says — with sources').click()
  await expect(janazah.locator('.ls-steps')).toBeVisible()
  await expect(janazah.getByRole('link', { name: /^Lesson: Funeral/ })).toHaveAttribute('href', '/en/learn/janazah#ls-prayer')

  await expect(page.locator('#lo-step-will').getByRole('link', { name: 'Inheritance calculator' })).toHaveAttribute('href', '/en/inheritance')
  await expect(page.locator('#lo-step-remember').getByRole('link', { name: 'My account: Prayers for loved ones' })).toHaveAttribute('href', '/en/account#loved')

  const cb = page.locator('#lo-step-ghusl').getByRole('checkbox', { name: 'Done' })
  await cb.check()
  await expect(cb).toBeChecked()
  await expect(page.getByTestId('lo-progress')).toContainText('1 of 12 steps marked')
  expect(Object.keys((await store(page, 'loved_guide_v1')).d)).toEqual(['ghusl'])
  await page.reload()
  await settle(page)
  await expect(page.locator('#lo-step-ghusl').getByRole('checkbox')).toBeChecked()
  expectCleanConsole(consoleProblems)
})

test('nikaha hazırlıq: sual qeydi və vəlimə planı yadda qalır', async ({ page, consoleProblems }) => {
  await page.goto('/en/nikah-preparation')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Preparing for nikah')
  const q = page.getByTestId('nk-q-mahr')
  await q.getByRole('textbox').fill('Agreed: part now, part deferred')
  await expect(q.getByRole('link', { name: 'See in the lesson' })).toHaveAttribute('href', '/en/learn/nikah#ls-mahr')
  await page.getByLabel('Walimah date').fill('2027-03-14')
  await page.getByLabel('Walimah plan (place, guests, preparation)').fill('Invite neighbours too')
  await page.locator('#nk-step-pillars').getByRole('checkbox', { name: 'Done' }).check()

  const v = await store(page, 'nikah_prep_v1')
  expect(v.q).toEqual({ mahr: 'Agreed: part now, part deferred' })
  expect(v.w).toEqual({ date: '2027-03-14', note: 'Invite neighbours too' })
  expect(Object.keys(v.d)).toEqual(['pillars'])

  await page.reload()
  await settle(page)
  await expect(page.getByTestId('nk-q-mahr').getByRole('textbox')).toHaveValue('Agreed: part now, part deferred')
  await expect(page.getByLabel('Walimah date')).toHaveValue('2027-03-14')
  const mahr = page.locator('#nk-step-mahr')
  await mahr.getByText('What the lesson says — with sources').click()
  await expect(mahr.locator('.ls-hadith cite').first()).toContainText('al-Bukhari 5150')
  expectCleanConsole(consoleProblems)
})

for (const theme of ['light', 'dark']) {
  test(`a11y (${theme}): üç bələdçi, ərəbcə RTL`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.addInitScript((th) => {
      localStorage.setItem('muslim_cc_theme', th)
      localStorage.setItem('newborn_plan_v1', JSON.stringify({ v: 1, b: '2026-11-20', d: { tahnik: '2026-11-20' } }))
      localStorage.setItem('loved_guide_v1', JSON.stringify({ v: 1, d: { eyes: '2026-11-20' } }))
      localStorage.setItem('nikah_prep_v1', JSON.stringify({ v: 1, d: {}, q: { mahr: 'x' }, w: {} }))
    }, theme)
    for (const base of ['/en', '/ar']) {
      for (const [path, sel, step] of [['newborn-sunnah', '.lg-page--newborn', '#nb-step-tahnik'], ['when-a-loved-one-dies', '.lg-page--loved', '#lo-step-eyes'], ['nikah-preparation', '.lg-page--nikah', '#nk-step-mahr']]) {
        await page.goto(`${base}/${path}`)
        await settle(page)
        if (base === '/ar') await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
        if (path !== 'nikah-preparation') await expect(page.locator(`${step} input[type="checkbox"]`)).toBeChecked()
        // açılan dəlil bloku da yoxlanılsın
        await page.locator(`${step} .lg-ev__sum`).first().click()
        await expect(page.locator(`${step} .lg-ev__part`).first().locator('.lg-ev__wait')).toHaveCount(0)
        expect(await serious(page, [sel]), `${base}/${path}`).toEqual([])
      }
    }
  })
}

test('360px: üç bələdçidə üfüqi daşma yoxdur', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await page.addInitScript(() => localStorage.setItem('newborn_plan_v1', JSON.stringify({ v: 1, b: '2026-11-20', d: {} })))
  for (const path of ['/en/newborn-sunnah', '/ar/when-a-loved-one-dies', '/ru/nikah-preparation']) {
    await page.goto(path)
    await settle(page)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    for (const s of await page.locator('.lg-ev__sum').all()) await s.click()
    await expect(page.locator('.lg-ev__wait')).toHaveCount(0)
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(over, path).toBeLessThanOrEqual(1)
  }
})
