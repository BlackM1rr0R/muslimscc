// ═══════════════════════════════════════════════════════
// P1: borc dəftəri (/debt-ledger), qadın təqvimi (/private-calendar), sadə rejim (/simple),
// şəri ölçü vahidləri (/sharia-units).
//   • borc: əlavə et, qismən qaytarma (artıq məbləğ rədd), bağla / yenidən aç, filtr, sil (təsdiqlə), noindex,
//     günü keçmiş + xatırlatma → səhifədə zolaq (role="alert" yox), 2:282 ayəsi saytın Quran mənbəyindən
//   • borc + hesab: server xatırlatması YALNIZ razılıqla, serverə ad / məbləğ getmir
//   • heyz/nifas: neytral başlıq (mount-dan əvvəl də), qeyd, Ramazan günləri → qəza izləyicisinə əlavə,
//     məzhəb qeydi, bildiriş yoxdur
//   • sadə rejim: başlanğıc ekran (ana səhifədən açılanda /simple-a keçir, "Tam sayta keç" — keçmir),
//     iri kafellər, zikr sayğacı
//   • ölçülər: çevirmə, mənbə nişanı, təxmini müqayisə, cədvəl
//   • axe (açıq + tünd), ərəbcə RTL, 360px-də üfüqi daşma yoxdur
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole } from './fixtures.js'
import { fakeUserSession, setLoginHint } from './userAuth.js'
import { fakePersonalApi } from './personalApi.js'

async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  for (const sel of include) b = b.include(sel)
  const { violations } = await b.analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 120)}`))
}
const store = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), key)
// Brauzer Asia/Baku saat qurşağındadır (playwright.config) — "bu gün" Bakı tarixinə görə
// (CI UTC-də işləyir; 20:00 UTC-dən sonra Bakıda ertəsi gündür və günlər bir sürüşürdü)
const bakuToday = () => new Date(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku' }).format(new Date()) + 'T12:00:00Z')
const shift = (n) => { const d = bakuToday(); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }

// ── 1. Borc dəftəri ──
test('borc dəftəri: əlavə et, qismən qaytarma, bağla, filtr, sil; noindex; ayə saytın mənbəyindən', async ({ page, consoleProblems }) => {
  await page.goto('/en/debt-ledger')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Debt ledger')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  await expect(page.getByText('No open debts.')).toBeVisible()

  // 2:282 — mətn yalnız düyməyə basanda, saytın Quran mənbəyindən
  await expect(page.getByTestId('dbt-ayah')).toHaveCount(0)
  await page.getByRole('button', { name: 'Show the ayah here' }).click()
  const ayah = page.getByTestId('dbt-ayah')
  await expect(ayah.locator('[lang="ar"]')).toHaveText('[test 2:282 quran-uthmani]')
  await expect(ayah.locator('[lang="ar"]')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByRole('link', { name: /Read in the Quran/ })).toHaveAttribute('href', /^\/en\/quran\/2-[a-z-]+\?a=282$/)

  // "Mən borcluyam", günü keçmiş, xatırlatma ilə
  await page.getByRole('radio', { name: 'I owe' }).check()
  await page.getByLabel('Who?').fill('Omar')
  await page.getByLabel('Amount').fill('100')
  await page.getByLabel('Currency').selectOption('USD')
  await page.getByLabel('Date of the debt').fill(shift(-10))
  await page.getByLabel('Due date (optional)').fill(shift(-2))
  await page.getByLabel('Witnesses (optional)').fill('Bilal, Zayd')
  await page.getByTestId('dbt-remind').check()
  await page.locator('.dbt-form').getByRole('button', { name: 'Save', exact: true }).click()

  const items = page.getByTestId('dbt-item')
  await expect(items).toHaveCount(1)
  const it1 = items.first()
  await expect(it1).toContainText('I owe Omar')
  await expect(it1).toContainText('Left: 100 USD')
  await expect(it1).toContainText('Overdue by 2 days')
  await expect(it1).toContainText('Witnesses: Bilal, Zayd')
  await expect(page.getByTestId('dbt-total-owe')).toHaveText('100 USD')
  // səhifədə zolaq — mətnli, role="alert" deyil
  await expect(page.getByTestId('dbt-banner')).toHaveText('One entry is due or overdue.')
  await expect(page.locator('[role="alert"]:empty')).toHaveCount(0)
  let v = await store(page, 'debt_ledger_v1')
  expect(v.l[0]).toMatchObject({ k: 'owe', p: 'Omar', a: 100, cu: 'USD', w: ['Bilal', 'Zayd'], rm: true })

  // qismən qaytarma; qalıqdan çox — rədd
  await it1.getByRole('button', { name: /^Add repayment/ }).click()
  await it1.getByLabel('Amount').fill('150')
  await it1.locator('.dbt-repay-form').getByRole('button', { name: 'Add repayment' }).click()
  await expect(it1.getByRole('alert')).toHaveText('This amount is more than what is left.')
  await it1.getByLabel('Amount').fill('40')
  await it1.locator('.dbt-repay-form').getByRole('button', { name: 'Add repayment' }).click()
  await expect(it1).toContainText('Left: 60 USD')
  await expect(it1).toContainText('Repaid: 40 USD')
  await expect(page.getByTestId('dbt-total-owe')).toHaveText('60 USD')

  // ikinci qeyd: "mənə borcludurlar"
  await page.getByRole('radio', { name: 'Owed to me' }).check()
  await page.getByLabel('Who?').fill('Hasan')
  await page.getByLabel('Amount').fill('25,50')
  await page.locator('.dbt-form').getByRole('button', { name: 'Save', exact: true }).click()
  await expect(items).toHaveCount(2)
  await expect(page.getByTestId('dbt-total-owed')).toHaveText('25.50 AZN')

  // bağla → "Open" filtrindən çıxır, "Settled"-də görünür; zolaq yox olur
  await items.filter({ hasText: 'Omar' }).getByRole('button', { name: /^Mark as settled/ }).click()
  await expect(items).toHaveCount(1)
  await expect(page.getByTestId('dbt-banner')).toHaveCount(0)
  await page.getByRole('button', { name: 'Settled', exact: true }).click()
  await expect(items).toHaveCount(1)
  await expect(items.first()).toContainText('Settled')
  await items.first().getByRole('button', { name: /^Reopen/ }).click()
  await expect(items).toHaveCount(0)
  await page.getByRole('button', { name: 'All', exact: true }).click()
  await expect(items).toHaveCount(2)

  // sil — təsdiqlə
  const hasan = items.filter({ hasText: 'Hasan' })
  await hasan.getByRole('button', { name: /^Delete/ }).click()
  await hasan.getByRole('button', { name: 'No' }).click()
  await expect(items).toHaveCount(2)
  await hasan.getByRole('button', { name: /^Delete/ }).click()
  await hasan.getByRole('button', { name: 'Yes, delete' }).click()
  await expect(items).toHaveCount(1)
  await expect(page.locator('#dbt-list-title')).toBeFocused()
  v = await store(page, 'debt_ledger_v1')
  expect(v.l).toHaveLength(1)
  expect(v.l[0].r).toHaveLength(1)
  expectCleanConsole(consoleProblems)
})

test('borc dəftəri + hesab: server xatırlatması yalnız razılıqla; serverə ad və məbləğ getmir', async ({ page, consoleProblems }) => {
  await setLoginHint(page)
  await fakeUserSession(page, { signedIn: true, user: { emailVerified: true } })
  const api = await fakePersonalApi(page)
  await page.goto('/en/debt-ledger')
  await settle(page)
  await page.getByLabel('Who?').fill('Yusuf')
  await page.getByLabel('Amount').fill('300')
  const due = shift(5)
  await page.getByLabel('Due date (optional)').fill(due)
  await page.getByTestId('dbt-remind').check()
  await page.getByTestId('dbt-server').check()
  await expect(page.getByText('stored on our server unencrypted', { exact: false }).first()).toBeVisible()
  // razılıq olmadan — saxlanmır
  await page.locator('.dbt-form').getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.locator('.dbt-form [role="alert"]')).toHaveText('Please confirm the note to continue.')
  expect(api.requests.filter((r) => r.startsWith('POST'))).toEqual([])
  await page.getByTestId('dbt-consent').check()
  await page.locator('.dbt-form').getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByTestId('dbt-item')).toHaveCount(1)
  await expect.poll(() => api.requests.includes('POST /api/personal/letters')).toBe(true)
  const body = api.bodies['POST /api/personal/letters']
  expect(body).toMatchObject({ deliverOn: due, kind: 'date', consent: true })
  expect(body.body).not.toContain('Yusuf')
  expect(body.body).not.toContain('300')
  await expect(page.getByTestId('dbt-item').first()).toContainText('Email / phone reminder')
  await expect.poll(async () => (await store(page, 'debt_ledger_v1'))?.l?.[0]?.lid).toBe(1)
  // bağlananda server xatırlatması silinir
  await page.getByTestId('dbt-item').first().getByRole('button', { name: /^Mark as settled/ }).click()
  await expect.poll(() => api.requests.includes('DELETE /api/personal/letters/1')).toBe(true)
  expectCleanConsole(consoleProblems)
})

// ── 2. Qadın təqvimi ──
test('heyz/nifas: neytral başlıq, qeyd, Ramazan günləri qəza izləyicisinə; hökm verilmir', async ({ page, consoleProblems }) => {
  // Ümmül-Qura: 1 Ramazan 1447 = 18 fevral 2026 — 25.02–01.03 (5 gün) tam Ramazandadır
  await page.addInitScript(() => {
    if (localStorage.getItem('p1_seeded')) return
    localStorage.setItem('p1_seeded', '1')
    localStorage.setItem('haid_log_v1', JSON.stringify({ v: 1, l: [{ id: 'hseed01', k: 'hayd', s: '2026-02-25', e: '2026-03-01', u: 1 }] }))
  })
  await page.goto('/en/private-calendar')
  await settle(page)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hayd and nifas calendar')
  await expect(page.getByTestId('hdc-madhab')).toContainText('differ between the schools of fiqh')
  await expect(page.getByText('Muslim 335', { exact: false })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Glossary: istihadah' })).toHaveAttribute('href', '/en/glossary/istihadah')

  // neytral başlıq — yadda qalır
  await page.getByTestId('hdc-neutral').click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Private calendar')
  await page.reload()
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Private calendar')
  await expect(page.getByTestId('hdc-neutral')).toHaveAttribute('aria-pressed', 'true')

  // Ramazan günləri → qəza izləyicisi
  const row = page.getByTestId('hdc-makeup')
  await expect(row).toHaveCount(1)
  await expect(row).toContainText('5 days in Ramadan (approx.)')
  await row.getByRole('button', { name: 'Add 5 fasts to my qada tracker' }).click()
  await expect(row).toContainText('Already added: 5')
  const qada = await store(page, 'muslim_cc_qada_v1')
  expect(qada.fasts.owed).toBe(5)
  expect((await store(page, 'haid_log_v1')).l[0].q).toBe(5)

  // yeni qeyd (davam edir) → "bu gün bitdi"
  await page.getByRole('radio', { name: 'Nifas (after childbirth)' }).check()
  await page.getByLabel('First day').fill(shift(-3))
  await page.locator('.hdc-form').getByRole('button', { name: 'Save', exact: true }).click()
  const items = page.getByTestId('hdc-item')
  await expect(items).toHaveCount(2)
  await expect(items.first()).toContainText('ongoing · day 4')
  await items.first().getByRole('button', { name: /^Ended today/ }).click()
  await expect(items.first()).toContainText('4 days')
  await expect(page.locator('.hdc-lengths')).toContainText('4 days')
  // bildiriş icazəsi soruşulmur
  expect(await page.evaluate(() => (typeof Notification === 'undefined' ? 'default' : Notification.permission))).not.toBe('granted')
  expectCleanConsole(consoleProblems)
})

// ── 3. Sadə rejim ──
test('sadə rejim: başlanğıc ekran, iri kafellər, zikr sayğacı; "Tam sayta keç" yenidən yönləndirmir', async ({ page, consoleProblems }) => {
  await page.goto('/en/simple')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Simple mode')
  const home = page.getByTestId('smp-home')
  await expect(home).toHaveAttribute('aria-pressed', 'false')
  await home.click()
  await expect(home).toHaveAttribute('aria-pressed', 'true')
  expect((await store(page, 'simple_mode_v1')).home).toBe(true)

  // zikr
  await page.locator('[data-smp-tile="dhikr"]').click()
  await expect(page.getByTestId('smp-panel-dhikr')).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Dhikr counter' })).toBeFocused()
  await page.getByTestId('road-tap').click()
  await page.getByTestId('road-tap').click()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.locator('[data-smp-tile="dhikr"]')).toBeFocused()
  await expect(page.locator('[data-smp-tile="dhikr"]')).toContainText('Count: 2')

  // namaz kafeli — iri saat və geri sayım
  await expect(page.getByTestId('smp-tile-count')).toHaveText(/^\d{1,2}:\d{2}(:\d{2})?$/)

  // ana səhifədən açılanda — sadə ekran
  await page.goto('/en')
  await expect(page).toHaveURL(/\/en\/simple$/)
  await settle(page)
  await page.getByRole('link', { name: /Go to the full site/ }).click()
  await expect(page).toHaveURL(/\/en$/)
  await page.waitForTimeout(400)
  await expect(page).toHaveURL(/\/en$/)
  // başqa səhifədən açılıb ana səhifəyə gələndə — keçid yoxdur
  await page.goto('/en/qibla')
  await settle(page)
  await page.evaluate(() => { history.pushState({}, '', '/en'); dispatchEvent(new PopStateEvent('popstate')) })
  await page.waitForTimeout(400)
  await expect(page).toHaveURL(/\/en$/)
  expectCleanConsole(consoleProblems)
})

// ── 4. Şəri ölçülər ──
test('şəri ölçülər: çevirmə, mənbə nişanı, təxmini müqayisə, cədvəl', async ({ page, consoleProblems }) => {
  await page.goto('/en/sharia-units')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sharia units converter')
  const res = page.getByTestId('shu-result')
  await expect(res).toContainText('≈ 3 kg')
  await expect(res).toContainText('From the site’s data')
  await expect(res).toContainText('Range — scholarly estimate')
  await expect(page.getByTestId('shu-cmp')).toContainText('≈ 3 × a 1 kg packet of rice or dates')
  await page.getByTestId('shu-qty').fill('2,5')
  await expect(res).toContainText('≈ 7.5 kg')
  await page.getByTestId('shu-unit').selectOption('nisabSilver')
  await page.getByTestId('shu-qty').fill('1')
  await expect(res).toContainText('≈ 595 g')
  await page.getByTestId('shu-unit').selectOption('dhira')
  await expect(res).toContainText('Scholarly estimate (range)')
  await expect(res).toContainText('range: 46 – 50 cm')
  await page.getByTestId('shu-unit').selectOption('travel')
  await expect(page.getByTestId('shu-cmp')).toContainText('By car')
  await page.getByTestId('shu-qty').fill('abc')
  await expect(page.getByRole('alert')).toHaveText('Enter a valid amount (e.g. 1 or 2.5).')
  await expect(page.locator('.shu-table tbody tr')).toHaveCount(13)
  await page.getByRole('link', { name: /Zakat and fitrah calculator/ }).click()
  await expect(page).toHaveURL(/\/en\/zakat$/)
  expectCleanConsole(consoleProblems)
})

// ── 5. Əlçatanlıq: açıq + tünd; ərəbcə RTL ──
for (const theme of ['light', 'dark']) {
  test(`a11y (${theme}): dörd səhifə, ərəbcə RTL`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.addInitScript((th) => {
      localStorage.setItem('muslim_cc_theme', th)
      localStorage.setItem('debt_ledger_v1', JSON.stringify({ v: 1, l: [{ id: 'dseed01', k: 'owed', p: 'Ali', a: 50, cu: 'AZN', d: '2026-11-01', du: '2026-11-02', rm: true, w: ['Omar'], no: 'Book', r: [{ id: 'rseed01', d: '2026-11-02', a: 10 }], u: 1 }] }))
      localStorage.setItem('haid_log_v1', JSON.stringify({ v: 1, l: [{ id: 'hseed01', k: 'hayd', s: '2026-02-25', e: '2026-03-01', u: 1 }] }))
    }, theme)
    for (const base of ['/en', '/ar']) {
      for (const [path, root] of [['debt-ledger', '.dbt-page'], ['private-calendar', '.hdc-page'], ['simple', '.smp-page'], ['sharia-units', '.shu-page']]) {
        await page.goto(`${base}/${path}`)
        await settle(page)
        if (base === '/ar') await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        expect(await serious(page, [root]), `${base}/${path}`).toEqual([])
      }
    }
  })
}

// ── 6. 360px: üfüqi daşma yoxdur ──
test('360px: dörd səhifədə üfüqi daşma yoxdur', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await page.addInitScript(() => {
    localStorage.setItem('debt_ledger_v1', JSON.stringify({ v: 1, l: [{ id: 'dseed01', k: 'owe', p: 'Abdurrahman ibn Abdullah', a: 1234567.89, cu: 'AZN', d: '2026-11-01', r: [], u: 1 }] }))
  })
  for (const path of ['/en/debt-ledger', '/ar/private-calendar', '/en/simple', '/ru/sharia-units']) {
    await page.goto(path)
    await settle(page)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(over, path).toBeLessThanOrEqual(1)
  }
})
