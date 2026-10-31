// ═══════════════════════════════════════════════════════
// Ramazan rejimi (components/RamadanCard) — /prayer üzərində:
//   • ?ramadan=preview — kart görünür, səhur (imsak) və iftar vaxtları
//     imsakiyyədən (aladhan hijriCalendar — burada saxta cavab), geri sayım işləyir
//   • parametrsiz (fikstürdə hicri ay 5) — kart yoxdur
//   • ?ramadan=countdown — "Ramazana N gün qaldı"; ?ramadan=eid — bayram kartı
// Saat sabitdir (page.clock): 30-10-2026 15:36:27 Bakı vaxtı.
// fixtures.js /timings-i saxtalaşdırır (yalnız hicri tarix üçün — Bakının vaxtları yerli hesabdır);
// imsakiyyə cavabını bu spec özü verir.
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle, azTimes, BAKU } from './fixtures.js'
import { computeTimes } from '../../src/utils/prayCalc.js'

const pad = (n) => String(n).padStart(2, '0')

// 1448-ci il Ramazanı: 08-02-2027-dən 29 gün (real API ilə eyni forma)
function hijriCalendar() {
  const start = Date.UTC(2027, 1, 8)
  return {
    code: 200,
    status: 'OK',
    data: Array.from({ length: 29 }, (_, i) => {
      const d = new Date(start + i * 86400000)
      return {
        timings: {
          Imsak: '05:22 (+04)', Fajr: '05:32 (+04)', Sunrise: '07:01 (+04)', Dhuhr: '12:29 (+04)',
          Asr: '15:24 (+04)', Sunset: '17:51 (+04)', Maghrib: '17:51 (+04)', Isha: '19:10 (+04)',
        },
        date: {
          gregorian: { date: `${pad(d.getUTCDate())}-${pad(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}` },
          hijri: { day: String(i + 1), month: { number: 9, en: 'Ramaḍān', ar: 'رَمَضان', days: 29 }, year: '1448' },
        },
      }
    }),
  }
}

// Bakı (Azərbaycan) — imsakiyyənin GÜNLƏRİ aladhan-dan, VAXTLARI yerli hesabdan
// (Əbu Bəkr məscidinin cədvəli; imsak = sübh). Gözlənilən dəyərlər eyni funksiya ilə.
const NOW = new Date('2026-10-30T11:36:27Z')                   // 15:36:27 Bakı
const day = (n) => computeTimes({ year: 2027, month: 2, day: 7 + n }, BAKU.lat, BAKU.lng, 4)  // Ramazanın n-ci günü
const secs = (hhmm) => +hhmm.slice(0, 2) * 3600 + +hhmm.slice(3) * 60
const hms = (s) => [s / 3600 | 0, (s % 3600) / 60 | 0, s % 60].map(v => String(v).padStart(2, '0')).join(':')

test.beforeEach(async ({ page }) => {
  const calls = []
  page.calendarCalls = calls
  await page.route(/api\.aladhan\.com\/v1\/hijriCalendar\//, route => {
    calls.push(route.request().url())
    route.fulfill({ json: hijriCalendar() })
  })
  await page.clock.install({ time: NOW })
})

const card = (page) => page.getByTestId('ramadan-card')

test('?ramadan=preview: kart, səhur/iftar vaxtları və canlı geri sayım', async ({ page, consoleProblems }) => {
  await page.goto('/prayer?ramadan=preview')
  await settle(page)

  await expect(card(page)).toBeVisible()
  await expect(card(page)).toHaveAttribute('data-phase', 'ramadan')
  await expect(card(page).getByRole('heading', { name: 'Ramazanın 1-ci günü' })).toBeVisible()
  await expect(card(page).getByText('Önizləmə')).toBeVisible()

  // Səhur — imsakiyyədəki Imsak, iftar — məğrib
  await expect(page.getByTestId('ramadan-suhoor')).toContainText(day(1).fajr)
  await expect(page.getByTestId('ramadan-iftar')).toContainText(day(1).maghrib)

  // Geri sayım: "İftara HH:MM:SS qaldı", sonra azalır
  const left = hms(secs(day(1).maghrib) - (15 * 3600 + 36 * 60 + 27))
  const count = page.getByTestId('ramadan-countdown')
  await expect(count).toHaveAttribute('data-kind', 'iftar')
  await expect(count).toHaveText(new RegExp(`^İftara\\s*${left.slice(0, 5)}:\\d\\d\\s*qaldı$`))
  const before = (await count.textContent()).match(/\d\d:\d\d:\d\d/)[0]
  await page.clock.runFor(3000)
  await expect(count).not.toContainText(before)

  // Sorğu: hicri il 1448, 9-cu ay, Bakının koordinatı və saat qurşağı
  const url = decodeURIComponent(page.calendarCalls[0] || '')
  expect(url).toContain('/v1/hijriCalendar/1448/9?')
  expect(url).toContain(`latitude=${BAKU.lat}`)
  expect(url).toContain('method=99&methodSettings=18.5,null,90 min')
  expect(url).toContain('timezonestring=Asia/Baku')

  // Namaz səhifəsinin öz vaxtları da yerindədir
  await expect(page.getByText(azTimes(NOW).fajr, { exact: true }).first()).toBeVisible()
  expectCleanConsole(consoleProblems)
})

test('?ramadan=preview&day=12: imsakdan əvvəl geri sayım imsaka gedir', async ({ page, consoleProblems }) => {
  await page.clock.setFixedTime(new Date('2026-10-30T00:30:00Z'))   // 04:30 Bakı
  await page.goto('/prayer?ramadan=preview&day=12')
  await settle(page)
  await expect(card(page).getByRole('heading', { name: 'Ramazanın 12-ci günü' })).toBeVisible()
  const count = page.getByTestId('ramadan-countdown')
  await expect(count).toHaveAttribute('data-kind', 'imsak')
  await expect(count).toHaveText(new RegExp(`İmsaka\\s*${hms(secs(day(12).fajr) - 4.5 * 3600)}\\s*qaldı`))
  expectCleanConsole(consoleProblems)
})

test('Ramazandan kənar (hicri 5-ci ay) kart görünmür', async ({ page, consoleProblems }) => {
  await page.goto('/prayer')
  await settle(page)
  await expect(page.getByText(azTimes(NOW).fajr, { exact: true }).first()).toBeVisible()
  await expect(card(page)).toHaveCount(0)
  expect(page.calendarCalls, 'Ramazandan kənar imsakiyyə istənilmir').toEqual([])
  expectCleanConsole(consoleProblems)
})

test('?ramadan=countdown və ?ramadan=eid', async ({ page, consoleProblems }) => {
  await page.goto('/prayer?ramadan=countdown')
  await settle(page)
  await expect(card(page)).toHaveAttribute('data-phase', 'before')
  // 30-10-2026 → 08-02-2027
  await expect(card(page).getByRole('heading', { name: 'Ramazana 101 gün qaldı' })).toBeVisible()

  await page.goto('/prayer?ramadan=eid')
  await settle(page)
  await expect(card(page)).toHaveAttribute('data-phase', 'eid')
  await expect(card(page).getByRole('heading', { name: 'Bayramınız mübarək!' })).toBeVisible()
  expectCleanConsole(consoleProblems)
})

// ── /ramadan: imsakiyyənin altındakı bələdçi və 30 günlük xətm planı ──
test('/ramadan: bələdçi bölmələri, bu günün cüzü və xətm planı yadda qalır', async ({ page, consoleProblems }) => {
  await page.goto('/ramadan?ramadan=preview&day=5')
  await settle(page)
  const guide = page.getByTestId('ramadan-guide')
  await expect(guide.getByRole('heading', { name: 'Ramazan bələdçisi' })).toBeVisible()
  await expect(guide.locator('.rp-guide__sec')).toHaveCount(11)
  // İftar duası — Əbu Davud 2357
  await expect(guide.getByText('ذَهَبَ الظَّمَأُ', { exact: false })).toBeVisible()
  // Fidyə ayrıca dərsdədir — keçid
  await expect(guide.locator('a[href="/learn/kaffarah-fidyah"]')).toBeVisible()

  const plan = page.getByTestId('khatm-plan')
  await expect(plan.locator('.rp-juz.is-today')).toContainText('Cüz 5')
  await expect(page.getByTestId('khatm-count')).toHaveText('0 / 30 cüz oxunub')
  await plan.getByRole('checkbox', { name: '1-ci cüz oxundu', exact: true }).check()
  await plan.getByRole('checkbox', { name: '3-cü cüz oxundu', exact: true }).check()
  await expect(page.getByTestId('khatm-count')).toHaveText('2 / 30 cüz oxunub')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('muslim_cc_ramadan_khatm_v1')))).toEqual({ done: [1, 3] })

  await page.reload()
  await settle(page)
  await expect(page.getByTestId('khatm-count')).toHaveText('2 / 30 cüz oxunub')
  await expect(plan.getByRole('checkbox', { name: '3-cü cüz oxundu', exact: true })).toBeChecked()
  await plan.getByRole('checkbox', { name: '1-ci cüz oxundu', exact: true }).uncheck()
  await expect(page.getByTestId('khatm-count')).toHaveText('1 / 30 cüz oxunub')
  expectCleanConsole(consoleProblems)
})
