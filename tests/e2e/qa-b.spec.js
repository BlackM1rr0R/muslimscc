// ═══════════════════════════════════════════════════════
// QA (B qrupu səhifələri): tapılmış və düzəldilmiş xətaların reqressiya testləri
//   • pozuq / bağlı localStorage səhifəni ağ ekrana çevirməməlidir
//     (sədəqə, təqvim, AI çat, AI limit vəziyyəti, namaz)
//   • təqvim: Android-də `new Notification()` xəta atanda tətbiq çökmür
//   • zəkat: mənfi və sonsuz dəyər hesaba düşmür, fitrə tam nəfərlə sayılır
//   • sədəqə: əlavə → sil (sətir sönür, fokus itmir)
//   • AI çat: cavabdan sonra fokus yazı sahəsinə qayıdır; 429 — gözləmə mesajı
//   • məscid axtarışı: Overpass xətası → "Yenidən" → nəticə, fokus nəticəyə keçir
//   • qiblə: dəqiqlik 0 olanda ekranda tək "0" görünmür
//   • başqa bölməyə keçidlər həqiqi <a href>-dir (yeni tabda açılır)
//   • dil düymələrinin adı görünən kodu (AZ, EN …) ehtiva edir (WCAG 2.5.3)
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

const desktopOnly = (info) => test.skip(info.project.name === 'mobile', 'masaüstü kifayətdir')

// ── Pozuq yaddaş ─────────────────────────────────────
const BROKEN = {
  '/charity': [{ charity_log: '{}' }, { charity_log: '[1,"a",null,{}]' }, { charity_log: '[{"id":1,"date":"2026-10-20","amount":"7","type":"zzz"}]' }],
  '/calendar': [{ calendar_reminders: '"x"' }, { calendar_reminders: '[null,{"key":5}]' }],
  '/aichat': [{ muslim_cc_ai_chat: '{}' }, { muslim_cc_ai_chat: '[null,{"role":"user"}]' }, { muslim_cc_aichat_rate: 'null' }],
}
for (const [url, variants] of Object.entries(BROKEN)) {
  for (const [i, store] of variants.entries()) {
    test(`${url}: pozuq localStorage #${i + 1} ilə səhifə çökmür`, async ({ page, consoleProblems }, info) => {
      desktopOnly(info)
      await page.addInitScript((s) => {
        if (sessionStorage.getItem('__seeded')) return
        sessionStorage.setItem('__seeded', '1')
        for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v)
      }, store)
      await page.goto(url)
      await settle(page)
      await expect(page.locator('h1').first()).toBeVisible()
      expectCleanConsole(consoleProblems)
    })
  }
}

test('köhnə formatlı sədəqə qeydi (mətn məbləğ) düzgün göstərilir', async ({ page, consoleProblems }, info) => {
  desktopOnly(info)
  await page.addInitScript(() => localStorage.setItem('charity_log', '[{"id":1,"date":"2026-10-20","amount":"7","type":"zzz","description":"Köhnə"}]'))
  await page.goto('/charity')
  await settle(page)
  const entry = page.locator('.ch-entry')
  await expect(entry).toHaveCount(1)
  await expect(entry).toContainText('7.00')
  await expect(entry).toContainText('Digər')   // naməlum növ → "Digər"
  expectCleanConsole(consoleProblems)
})

test('localStorage tam bağlıdır (məxfi rejim) — səhifələr açılır', async ({ page, consoleProblems }, info) => {
  desktopOnly(info)
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('The operation is insecure.', 'SecurityError') } })
  })
  for (const url of ['/prayer', '/charity', '/calendar', '/zakat', '/aichat', '/dailytracker']) {
    await page.goto(url)
    await settle(page)
    await expect(page.locator('h1').first(), url).toBeVisible()
  }
  expectCleanConsole(consoleProblems)
})

// ── Təqvim: Android Chrome-da Notification konstruktoru xəta atır ──
test('təqvim: bugünkü xatırlatma + "Illegal constructor" — tətbiq çökmür', async ({ page, consoleProblems }, info) => {
  desktopOnly(info)
  await page.addInitScript(() => {
    // Hər hicri gün üçün xatırlatma — bu gün mütləq tutulsun
    const all = []
    for (let m = 0; m < 12; m++) for (let d = 1; d <= 30; d++) all.push({ key: `${m}-${d}`, month: m, day: d, name: 'Test' })
    localStorage.setItem('calendar_reminders', JSON.stringify(all))
    class AndroidNotification { constructor() { throw new TypeError("Failed to construct 'Notification': Illegal constructor.") } }
    AndroidNotification.permission = 'granted'
    AndroidNotification.requestPermission = () => Promise.resolve('granted')
    window.Notification = AndroidNotification
  })
  await page.goto('/calendar')
  await settle(page)
  await expect(page.locator('h1').first()).toBeVisible()
  await expect(page.locator('.cal-day').first()).toBeVisible()
  expectCleanConsole(consoleProblems)
})

test('təqvim günü: ad görünən rəqəmlərlə başlayır, ay adı və il ekran oxuyucusu üçündür', async ({ page }, info) => {
  desktopOnly(info)
  await page.goto('/calendar')
  await settle(page)
  const day = page.locator('.cal-day:not(.is-blank)').first()
  await expect(day).not.toHaveAttribute('aria-label', /.*/)
  const name = await day.evaluate(el => el.textContent.replace(/\s+/g, ' ').trim())
  const visible = await day.locator('.cal-day-h').innerText()
  expect(name.startsWith(visible)).toBe(true)
  expect(name).toMatch(/20\d\d/)
})

// ── Zəkat ────────────────────────────────────────────
test('zəkat: mənfi və sonsuz dəyər cəmi azaltmır/pozmur, fitrə tam nəfər', async ({ page, consoleProblems }, info) => {
  desktopOnly(info)
  await page.goto('/zakat')
  await settle(page)
  const field = (name) => page.getByRole('spinbutton', { name })
  const total = page.locator('.breakdown-total .total-amount')

  await field('Yığım / bank hesabı').fill('20000')
  await expect(total).toHaveText(/20[\s., ]?000[.,]00/)
  // Mənfi "digər" — əvvəl cəmdən çıxırdı
  await field('Digər pul varlıqları').fill('-5000')
  await expect(total).toHaveText(/20[\s., ]?000[.,]00/)
  await expect(field('Digər pul varlıqları')).toHaveAttribute('aria-invalid', 'true')
  // Mənfi borc — əvvəl cəmə ƏLAVƏ olunurdu
  await field('Borclar (çıxılacaq)').fill('-3000')
  await expect(total).toHaveText(/20[\s., ]?000[.,]00/)
  // Sonsuz dəyər (1e999) — "∞" / NaN göstərilmir
  await field('Səhmlər / investisiya').fill('1e999')
  await expect(total).toHaveText(/20[\s., ]?000[.,]00/)
  await expect(page.locator('main')).not.toContainText(/NaN|Infinity|∞/)

  // Fitrə: 2.5 nəfər → 2 nəfər
  const people = page.locator('#zakat-fitr-people')
  const perPerson = await page.locator('.fitr-val').innerText()
  await people.fill('2.5')
  const twoTimes = await page.locator('.fitr-total-val').innerText()
  await people.fill('2')
  await expect(page.locator('.fitr-total-val')).toHaveText(twoTimes)
  expect(perPerson).not.toEqual(twoTimes)
  expectCleanConsole(consoleProblems)
})

// ── Sədəqə gündəliyi ─────────────────────────────────
test('sədəqə: əlavə et → sil; sətir yox olur, fokus itmir', async ({ page, consoleProblems }) => {
  await page.goto('/charity')
  await settle(page)
  await page.locator('#ch-amount').fill('15')
  await page.locator('#ch-desc').fill('Birinci')
  await page.getByRole('button', { name: 'Əlavə et' }).click()
  await page.locator('#ch-desc').fill('İkinci')
  await page.getByRole('button', { name: 'Əlavə et' }).click()
  const entries = page.locator('.ch-entry')
  await expect(entries).toHaveCount(2)
  await expect(page.locator('.ch-stats')).toContainText('15.00')

  await entries.first().getByRole('button', { name: 'Sil' }).click()
  await expect(entries).toHaveCount(1)
  // Fokus qalan sətrin "Sil" düyməsinə keçir (əvvəl <body>-yə düşürdü)
  await expect(entries.first().getByRole('button', { name: 'Sil' })).toBeFocused()
  await entries.first().getByRole('button', { name: 'Sil' }).click()
  await expect(entries).toHaveCount(0)
  await expect(page.locator('.ch-entries-title')).toBeFocused()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('charity_log')))).toEqual([])
  expectCleanConsole(consoleProblems)
})

// ── AI çat ───────────────────────────────────────────
const sse = (parts) => parts.map(t => `data: ${JSON.stringify({ t })}\n\n`).join('') + 'data: {"done":true}\n\n'

test('AI çat: axınlı cavab görünür, fokus yazı sahəsinə qayıdır', async ({ page, consoleProblems }, info) => {
  desktopOnly(info)
  await page.route(/\/api\/ask-ai/, r => r.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream' }, body: sse(['Sübh ', '2, ', 'zöhr 4 rükətdir.']) }))
  await page.goto('/aichat')
  await settle(page)
  const box = page.locator('.aic-input')
  await box.fill('Namaz neçə rükətdir?')
  await box.press('Enter')
  await expect(page.locator('.aic-msg-assistant')).toContainText('zöhr 4 rükətdir.')
  await expect(box).toBeFocused()
  expectCleanConsole(consoleProblems)
})

test('AI çat: server limiti (429) — "xidmət cavab vermir" yox, gözləmə göstərilir', async ({ page }, info) => {
  desktopOnly(info)
  await page.route(/\/api\/ask-ai/, r => r.fulfill({ status: 429, json: { error: 'rate' } }))
  await page.goto('/aichat')
  await settle(page)
  const box = page.locator('.aic-input')
  await box.fill('Salam')
  await box.press('Enter')
  await expect(box).toBeDisabled()
  await expect(page.locator('main')).not.toContainText('cavab vermir')
  await expect(page.locator('.aic-send-btn')).toContainText(/\d+/)
})

test('AI çat: "Dayandır" — sorğu kəsilir, fokus itmir', async ({ page }, info) => {
  desktopOnly(info)
  await page.route(/\/api\/ask-ai/, async r => { await new Promise(res => setTimeout(res, 4000)); await r.fulfill({ status: 200, json: { reply: 'gec' } }).catch(() => {}) })
  await page.goto('/aichat')
  await settle(page)
  const box = page.locator('.aic-input')
  await box.fill('Salam')
  await box.press('Enter')
  await page.locator('.aic-stop-btn').click()
  await expect(page.locator('.aic-stop-btn')).toHaveCount(0)
  await expect(box).toBeEnabled()
  await expect(box).toBeFocused()
  await expect(page.locator('.aic-msg-assistant')).toHaveCount(0)
})

// ── Məscid axtarışı ──────────────────────────────────
test('məscidlər: məkan rədd → şəhər → Overpass xətası → yenidən → nəticə', async ({ page, consoleProblems }) => {
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (ok, fail) => setTimeout(() => fail({ code: 1, message: 'denied' }), 30)
  })
  let ok = false
  await page.route(/overpass/, r => (ok
    ? r.fulfill({ json: { elements: [{ type: 'way', id: 5, center: { lat: 40.37, lon: 49.83 }, tags: { name: 'Təzəpir məscidi' } }, { type: 'node', id: 8 }] } })
    : r.fulfill({ status: 504, body: '<html>Gateway Timeout</html>' })))
  await page.goto('/mosques')
  await settle(page)
  await page.locator('.mosque-search-btn').click()
  const alert = page.getByRole('alert')
  await expect(alert).toContainText('Məkanınızı')
  await alert.getByRole('button', { name: /ətrafında axtar/ }).click()
  await expect(alert).toContainText('yükləmək alınmadı')
  ok = true
  await alert.getByRole('button', { name: /Yenidən/ }).click()
  await expect(page.locator('.mosque-row')).toHaveCount(1)   // koordinatsız element süzülür
  await expect(page.locator('.mosque-row')).toContainText('Təzəpir məscidi')
  await expect(page.locator('.mosque-results-count')).toBeFocused()
  // Saxta 504 cavabını brauzer özü konsola yazır — saytın xətası deyil
  expectCleanConsole(consoleProblems.filter(p => !/Failed to load resource.*overpass/.test(p)))
})

// ── Qiblə ────────────────────────────────────────────
test('qiblə: dəqiqlik 0 m olanda tək "0" görünmür, kart göstərilir', async ({ page, context, consoleProblems }, info) => {
  desktopOnly(info)
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ latitude: 40.4093, longitude: 49.8671, accuracy: 0 })
  await page.goto('/qibla')
  await settle(page)
  await expect(page.locator('.qibla-content')).toBeVisible()
  await expect(page.getByText('±0', { exact: false })).toBeVisible()
  // "Kəbəyə məsafə … km" kartından sonra yetim "0" mətn düyünü qalmamalıdır
  const stray = await page.locator('.qibla-content').evaluate(root => {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let n, bad = 0
    while ((n = w.nextNode())) if (n.nodeValue.trim() === '0' && !n.parentElement.closest('.qibla-compass, .qibla-info-val')) bad++
    return bad
  })
  expect(stray).toBe(0)
  expectCleanConsole(consoleProblems)
})

// ── Həqiqi linklər ───────────────────────────────────
test('bölmələr arası keçidlər <a href>-dir və SPA ilə açılır', async ({ page, consoleProblems }, info) => {
  desktopOnly(info)
  await page.goto('/jamaat')
  await settle(page)
  const toMosques = page.locator('.jm-links').getByRole('link', { name: /Yaxınlıqdakı məscidi tap/ })
  await expect(toMosques).toHaveAttribute('href', '/mosques')
  await page.goto('/en/donate')
  await settle(page)
  await expect(page.locator('.dn-links').getByRole('link').first()).toHaveAttribute('href', '/en/zakat')
  await page.goto('/bu-sehife-yoxdur')
  await settle(page)
  const home = page.getByRole('link', { name: 'Ana səhifə' }).last()
  await expect(home).toHaveAttribute('href', '/')
  await page.locator('.nf-actions').getByRole('link').nth(1).click()
  await expect(page).toHaveURL(/\/jamaat$/)
  await expect(page.locator('h1').first()).toBeVisible()
  expectCleanConsole(consoleProblems)
})

// ── Dil düymələrinin adı (WCAG 2.5.3 "Label in Name") ──
test('dil düymələrinin əlçatan adı görünən kodla başlayır', async ({ page, isMobile }) => {
  await page.goto('/prayer')
  await settle(page)
  if (!isMobile) {
    await expect(page.locator('.lang-btn')).toHaveAttribute('aria-label', /^AZ — Dili dəyiş/)
    return
  }
  await page.getByRole('button', { name: 'Menyu', exact: true }).click()
  await expect(page.getByRole('button', { name: 'EN — English' })).toBeVisible()
})
