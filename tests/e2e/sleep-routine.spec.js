// ═══════════════════════════════════════════════════════
// "Yatmazdan əvvəl sünnə" (/bedtime-sunnah) və "Səhər oyanışı" (/morning-routine)
//   • yatma: susmaya görə tünd; bir ekranda bir addım, fokus addım başlığına; hər addımın mətni
//     mənbəsi ilə (hədis 1063 — Buxari 247; Hisnul-Müslim fəsil 29); təsbih 33/33/34 sayğacı;
//     Mülk — saytın pleyeri (mp3 saxtadır), yuxu saatı "surənin sonu", ekran qaralmağa başlayır;
//     irəliləyiş bu gün üçün yadda qalır; açıq ekran seçimi; dəstəmaz bələdçisinə keçid (#wudu)
//   • xatırlatma saatı (saat idarəsi): səhifə açıq ikən bir dəfə qeyd
//   • səhər: oyanış zikrləri (Hisn fəsil 2), səhər azkarı (AdhkarFocus), günün sünnəsi, namaz vaxtları
//   • axe (açıq + tünd sayt mövzusu), ərəbcə RTL, 360px-də üfüqi daşma yoxdur
// Şəbəkə: yeni /api YOXDUR — aladhan fixtures.js-də saxtadır; Hisn və hədis məlumatı saytın özündədir.
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
const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('sleep_routine_v1') || 'null'))

// Səs elementi saxtası (road-focus.spec.js ilə eyni): şəbəkə/dekoder yoxdur, play() → "playing"
const STUB_MEDIA = () => {
  const P = HTMLMediaElement.prototype
  const st = (el) => (el.__st ||= { paused: true, src: '' })
  window.__played = []
  Object.defineProperty(P, 'src', { configurable: true, get() { return st(this).src }, set(v) { st(this).src = String(v) } })
  Object.defineProperty(P, 'paused', { configurable: true, get() { return st(this).paused } })
  Object.defineProperty(P, 'readyState', { configurable: true, get() { return st(this).src ? 4 : 0 } })
  P.load = function () {}
  P.play = function () {
    const s = st(this); s.paused = false; window.__played.push(s.src)
    setTimeout(() => { if (!s.paused) this.dispatchEvent(new Event('playing')) }, 0)
    return Promise.resolve()
  }
  P.pause = function () { const s = st(this); const was = s.paused; s.paused = true; if (!was) this.dispatchEvent(new Event('pause')) }
}

const stepHeading = (page) => page.locator('#slr-step-h')

// ── 1. Yatma ardıcıllığı: bütün addımlar ──
test('yatma: tünd ekran, addımlar mənbələri ilə, təsbih 33/33/34, Mülk yuxu saatı ilə, irəliləyiş yadda qalır', async ({ page, consoleProblems }) => {
  test.setTimeout(90_000)
  await page.addInitScript(STUB_MEDIA)
  await page.goto('/en/bedtime-sunnah')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bedtime Sunnah routine')
  await expect(page.getByTestId('slr-screen')).toHaveClass(/slr--dark/)
  await expect(page.getByTestId('slr-progress')).toHaveText('Today: 0 of 8 steps done')
  await expect(page.locator('.slr-list__btn')).toHaveCount(8)

  await page.getByTestId('slr-start').click()
  // 1 — dəstəmaz: hədis 1063 (Buxari 247) + dəstəmaz bələdçisinə keçid
  await expect(stepHeading(page)).toBeFocused()
  await expect(stepHeading(page)).toHaveText('Wudu')
  await expect(page.getByTestId('slr-hadith-1063')).toContainText('lie on your right side')
  await expect(page.getByTestId('slr-hadith-1063')).toContainText('Source: Bukhari 247')
  await expect(page.getByTestId('slr-wudu-link')).toHaveAttribute('href', '/en/prayerguide#wudu')
  await page.getByTestId('slr-next').click()

  // 2 — yatağı silkələmək: Hisn 29:3, mənbəsində hədis
  await expect(stepHeading(page)).toBeFocused()
  await expect(stepHeading(page)).toHaveText('Dusting off the bed')
  await expect(page.getByTestId('slr-hisn-29')).toContainText('dust it off three times')
  await expect(page.getByTestId('slr-hisn-29')).toContainText('Muslim 4/2084')
  await page.getByTestId('slr-next').click()

  // 3 — sağ tərəf: hədis + Hisn 29:5 (3 dəfə sayğac)
  await expect(stepHeading(page)).toHaveText('Lying on the right side')
  await expect(page.getByTestId('slr-hisn-29')).toContainText('right hand under his cheek')
  const counter = page.locator('.slr-count__btn')
  await expect(counter).toHaveAccessibleName('Tap: 3 of 3 left')
  await counter.click()
  await expect(counter).toHaveAccessibleName('Tap: 2 of 3 left')
  await page.getByTestId('slr-next').click()

  // 4 — üç Qul: Hisn 29:0 + Quranda surələrə keçid
  await expect(stepHeading(page)).toContainText('three times, blowing into the palms')
  await expect(page.getByTestId('slr-hisn-29')).toContainText('Al-Bukhari 9/62')
  await expect(page.locator('.slr-chips a')).toHaveCount(3)
  await expect(page.locator('.slr-chips a').first()).toHaveAttribute('href', /\/en\/quran\/.+/)
  await page.getByTestId('slr-next').click()

  // 5 — Ayətül-Kürsi
  await expect(stepHeading(page)).toHaveText('Ayat al-Kursi')
  await expect(page.getByTestId('slr-hisn-29')).toContainText('4/487')
  await page.getByTestId('slr-next').click()

  // 6 — təsbih: 33 / 33 / 34
  await expect(stepHeading(page)).toHaveText('Tasbih: 33 · 33 · 34')
  await expect(page.getByTestId('slr-hisn-29')).toContainText('7/71')
  const tap = page.getByTestId('slr-tasbih-tap')
  await expect(tap).toHaveAccessibleName('SubhanAllah: 0 of 33')
  for (let i = 0; i < 33; i++) await tap.click()
  await expect(page.getByTestId('slr-tasbih')).toHaveAttribute('data-phase', '1')
  await expect(tap).toHaveAccessibleName('Alhamdulillah: 0 of 33')
  await expect(page.locator('.slr-tasbih [role="status"]')).toHaveText('SubhanAllah — 33 times completed')
  await page.getByTestId('slr-next').click()

  // 7 — yatma duaları
  await expect(stepHeading(page)).toHaveText('Duas before sleeping')
  await expect(page.locator('[data-testid="slr-hisn-29"] .slr-dua')).toHaveCount(7)
  await page.getByTestId('slr-next').click()

  // 8 — Mülk: Hisn 29:11 (Tirmizi 2892) + pleyer, yuxu saatı "surənin sonu"
  await expect(stepHeading(page)).toHaveText('Listen to al-Mulk')
  await expect(page.getByTestId('slr-hisn-29')).toContainText('2892')
  await page.getByTestId('slr-mulk-play').click()
  await expect(page.getByTestId('slr-mulk-play')).toHaveAccessibleName('Pause')
  await expect(page.getByTestId('sleep-timer-panel')).toContainText('Until the end of the surah')
  expect((await page.evaluate(() => window.__played))[0]).toMatch(/\.mp3$/)
  // gecə qiraəti: qaralma başlayıb (1-ci ayə — 0.6 × 1/30)
  await expect(page.getByTestId('slr-dim')).toBeAttached()
  await page.getByTestId('slr-mulk-play').click()
  await page.getByTestId('slr-next').click()

  await expect(page.getByTestId('slr-end')).toBeVisible()
  await expect(page.getByTestId('slr-end').getByRole('heading')).toBeFocused()
  const s = await store(page)
  expect(s.b.s).toEqual(['wudu', 'dust', 'side', 'quls', 'kursi', 'tasbih', 'duas', 'mulk'])

  await page.reload()
  await settle(page)
  await expect(page.getByTestId('slr-progress')).toHaveText('Today: 8 of 8 steps done')
  await expect(page.getByTestId('slr-start')).toContainText('Start again')
  // bu günün qeydlərini sil
  await page.getByRole('button', { name: 'Clear today’s marks' }).click()
  await expect(page.getByTestId('slr-progress')).toHaveText('Today: 0 of 8 steps done')
  expectCleanConsole(consoleProblems)
})

// ── 2. Açıq ekran, keç/geri, dəstəmaz keçidi ──
test('yatma: açıq ekran yadda qalır; "Keç" işarələmir; dəstəmaz keçidi bələdçini dəstəmaz rejimində açır', async ({ page, consoleProblems }) => {
  await page.goto('/en/bedtime-sunnah')
  await settle(page)
  await page.getByTestId('slr-light').click()
  await expect(page.getByTestId('slr-screen')).toHaveClass(/slr--light/)
  expect((await store(page)).bl).toBe(true)
  await page.reload()
  await settle(page)
  await expect(page.getByTestId('slr-screen')).toHaveClass(/slr--light/)

  // siyahıdan 5-ci addıma, "Keç" — işarə yoxdur, "Geri" — əvvəlki addım
  await page.locator('.slr-list__btn').nth(4).click()
  await expect(stepHeading(page)).toHaveText('Ayat al-Kursi')
  await page.getByRole('button', { name: 'Skip', exact: true }).click()
  await expect(stepHeading(page)).toHaveText('Tasbih: 33 · 33 · 34')
  expect((await store(page))?.b?.s || []).toEqual([])
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(stepHeading(page)).toHaveText('Ayat al-Kursi')

  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(stepHeading(page)).toHaveText('Wudu')
  await page.getByTestId('slr-wudu-link').click()
  await expect(page).toHaveURL(/\/en\/prayerguide#wudu$/)
  await expect(page.locator('#pg-wudu-title')).toBeVisible()
  expectCleanConsole(consoleProblems)
})

// ── 3. Xatırlatma (saat idarəsi) ──
test('yatma: xatırlatma saatı — səhifə açıq ikən bir dəfə qeyd, bağlanır', async ({ page, consoleProblems }) => {
  // Bakı (playwright.config timezoneId, UTC+4): 22:29
  await page.clock.install({ time: new Date(Date.UTC(2026, 10, 23, 18, 29, 0)) })
  await page.addInitScript(() => localStorage.setItem('sleep_routine_v1', JSON.stringify({ rb: '22:30' })))
  await page.goto('/en/bedtime-sunnah')
  await settle(page)
  await expect(page.getByTestId('slr-remind-bed')).toHaveValue('22:30')
  await expect(page.getByTestId('slr-notice-bed')).toHaveCount(0)
  await page.clock.fastForward(60_000)
  await page.clock.runFor(21_000)
  await expect(page.getByTestId('slr-notice-bed')).toContainText('It’s time for your bedtime Sunnah routine.')
  await page.getByTestId('slr-notice-bed').getByRole('button', { name: 'Dismiss' }).click()
  await expect(page.getByTestId('slr-notice-bed')).toHaveCount(0)
  await page.clock.runFor(41_000)
  await expect(page.getByTestId('slr-notice-bed')).toHaveCount(0)
  // söndür
  await page.getByRole('button', { name: 'Turn off', exact: true }).click()
  await expect(page.getByTestId('slr-remind-bed')).toHaveValue('')
  expect((await store(page)).rb).toBe('')
  expectCleanConsole(consoleProblems)
})

// ── 4. Səhər ardıcıllığı ──
test('səhər: oyanış zikrləri, səhər azkarı (tam ekran), günün sünnəsi, namaz vaxtları', async ({ page, consoleProblems }) => {
  await page.goto('/en/morning-routine')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Morning waking routine')
  await expect(page.getByTestId('slr-progress')).toHaveText('Today: 0 of 4 steps done')
  await page.getByTestId('slr-start').click()

  await expect(stepHeading(page)).toBeFocused()
  await expect(stepHeading(page)).toHaveText('Remembrance upon waking up')
  await expect(page.locator('[data-testid="slr-hisn-2"] .slr-dua')).toHaveCount(4)
  await expect(page.getByTestId('slr-hisn-2')).toContainText('Al-Bukhari 11/113')
  await page.getByTestId('slr-next').click()

  await expect(stepHeading(page)).toHaveText('Morning adhkar')
  await expect(page.getByTestId('slr-adhkar')).toContainText('Today: 0 of')
  await page.getByTestId('slr-adhkar-open').click()
  const dlg = page.getByRole('dialog')
  await expect(dlg).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dlg).toHaveCount(0)
  await expect(page.getByTestId('slr-adhkar-open')).toBeFocused()
  await page.getByTestId('slr-next').click()

  await expect(stepHeading(page)).toHaveText('Sunnah of the day')
  await expect(page.getByTestId('daily-sunnah')).toBeVisible()
  await page.getByTestId('slr-next').click()

  await expect(stepHeading(page)).toHaveText('Today’s prayer times')
  await expect(page.locator('.slr-prayers__list li')).toHaveCount(6)
  await page.getByTestId('slr-next').click()
  await expect(page.getByTestId('slr-end')).toContainText('Good morning')
  expect((await store(page)).w.s).toEqual(['wake', 'adhkar', 'sunnah', 'prayers'])
  expectCleanConsole(consoleProblems)
})

// ── 5. Əlçatanlıq: açıq + tünd; ərəbcə RTL ──
for (const theme of ['light', 'dark']) {
  test(`a11y (${theme}): yatma və səhər ardıcıllıqları, ərəbcə RTL`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.addInitScript((th) => localStorage.setItem('muslim_cc_theme', th), theme)
    for (const base of ['/en', '/ar']) {
      for (const path of ['bedtime-sunnah', 'morning-routine']) {
        await page.goto(`${base}/${path}`)
        await settle(page)
        if (base === '/ar') await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
        await expect(page.getByTestId('slr-start')).toBeEnabled()
        expect(await serious(page, ['.slr-page']), `${base}/${path} intro`).toEqual([])
        await page.getByTestId('slr-start').click()
        await expect(page.locator('[data-testid^="slr-hisn-"] .slr-dua, [data-testid^="slr-hadith-"] .slr-dua__ar').first()).toBeVisible()
        expect(await serious(page, ['.slr-page']), `${base}/${path} step 1`).toEqual([])
      }
      // açıq yatma ekranı
      await page.goto(`${base}/bedtime-sunnah`)
      await settle(page)
      await page.getByTestId('slr-light').click()
      await expect(page.getByTestId('slr-screen')).toHaveClass(/slr--light/)
      expect(await serious(page, ['.slr-page']), `${base} bedtime light`).toEqual([])
      await page.getByTestId('slr-light').click()
    }
  })
}

// ── 6. 360px: üfüqi daşma yoxdur ──
test('360px: yatma (hər addım) və səhər səhifəsində üfüqi daşma yoxdur', async ({ page }) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 360, height: 740 })
  const over = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  for (const base of ['/en', '/ar']) {
    await page.goto(`${base}/bedtime-sunnah`)
    await settle(page)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await over(), `${base} bedtime intro`).toBeLessThanOrEqual(1)
    await page.getByTestId('slr-start').click()
    for (let i = 0; i < 8; i++) {
      await expect(stepHeading(page)).toBeVisible()
      expect(await over(), `${base} bedtime step ${i + 1}`).toBeLessThanOrEqual(1)
      await page.getByRole('button', { name: base === '/ar' ? 'تخطٍّ' : 'Skip', exact: true }).click()
    }
    await page.goto(`${base}/morning-routine`)
    await settle(page)
    expect(await over(), `${base} morning intro`).toBeLessThanOrEqual(1)
    await page.getByTestId('slr-start').click()
    for (let i = 0; i < 4; i++) {
      await expect(stepHeading(page)).toBeVisible()
      expect(await over(), `${base} morning step ${i + 1}`).toBeLessThanOrEqual(1)
      await page.getByRole('button', { name: base === '/ar' ? 'تخطٍّ' : 'Skip', exact: true }).click()
    }
  }
})
