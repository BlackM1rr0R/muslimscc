// ═══════════════════════════════════════════════════════
// Namaz izləyicisi + "Qıldınızmı?" (utils/prayerTracker.js, sw.js, PrayerCheckinCard)
//   • /prayer?checkin=dhuhr&d=<bu gün> — kart; "Qıldım" bu günün sayını artırır,
//     parametr ünvandan silinir; "Qılmadım" → qəza sayğacına +1
//   • köhnə/yararsız parametr — kart yoxdur
//   • bildirişdəki "✅ Qıldım" qeydi IndexedDB-dən izləyiciyə köçür (idempotent)
//   • /prayer-tracker (marşrut qoşulubsa): Qıldım → seriya, heyz günləri seriyanı
//     qırmır, qəza sayğacı (+/−, "qəza qıldım", toplu daxiletmə)
// Bütün məlumat yalnız cihazdadır (localStorage + IndexedDB) — şəbəkə yoxlanmır.
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'
import { PAGES } from '../../src/seo/routes.js'

// Səhifə marşrutu App.jsx/routes.js-ə qoşulana qədər onun testləri buraxılır
// (PW_TRACKER_ROUTE=1 — marşrutu test serverində qoşanda məcburi işlət)
const HAS_ROUTE = PAGES.some(p => p.key === 'tracker') || process.env.PW_TRACKER_ROUTE === '1'

// Bakı vaxtı ilə gün açarı (konfiqdə timezoneId: 'Asia/Baku')
const keyIn = (offsetDays = 0) => {
  const d = new Date(Date.now() + offsetDays * 86400000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}
const ls = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), key)

/** Service worker-in yazdığı formada IndexedDB qeydi (public/sw.js → savePendingCheckin) */
async function putPending(page, records) {
  await page.evaluate((recs) => new Promise((resolve, reject) => {
    const req = indexedDB.open('muslims-tracker', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('pending', { keyPath: 'id' })
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const db = req.result
      const tx = db.transaction('pending', 'readwrite')
      for (const r of recs) tx.objectStore('pending').put({ ...r, id: `${r.date}|${r.prayer}`, status: 'prayed', at: Date.now() })
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => reject(tx.error)
    }
  }), records)
}
async function pendingCount(page) {
  return page.evaluate(() => new Promise((resolve) => {
    const req = indexedDB.open('muslims-tracker', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('pending', { keyPath: 'id' })
    req.onsuccess = () => {
      const db = req.result
      const c = db.transaction('pending').objectStore('pending').count()
      c.onsuccess = () => { db.close(); resolve(c.result) }
    }
  }))
}

const todayCount = (page) => page.locator('.stat-today-count')

test.describe('/prayer — "Qıldınızmı?" kartı', () => {
  test('Qıldım → bu günün sayı artır, qeyd köhnə açarlara yazılır, parametr silinir', async ({ page, consoleProblems }) => {
    const today = keyIn()
    await page.goto(`/prayer?checkin=dhuhr&d=${today}`)
    await settle(page)
    const card = page.getByTestId('checkin-card')
    await expect(card.getByRole('heading', { name: 'Zöhr namazını qıldınızmı?' })).toBeVisible()
    await expect(page).not.toHaveURL(/checkin=/)
    await expect(todayCount(page)).toHaveText('0/5')

    await card.getByRole('button', { name: 'Qıldım' }).click()
    await expect(card.getByRole('status')).toContainText('Qeyd olundu')
    await expect(todayCount(page)).toHaveText('1/5')
    await expect(page.getByRole('button', { name: 'Zöhr' })).toHaveAttribute('aria-pressed', 'true')
    expect((await ls(page, 'muslim_cc_prayer_stats'))[`${today}_Dhuhr`]).toBe(true)
    expect((await ls(page, 'daily_tracker'))[today].dhuhr).toBe(true)

    // Yeniləmədə kart təkrar çıxmır (parametr silinib), qeyd qalır
    await page.reload()
    await settle(page)
    await expect(page.getByTestId('checkin-card')).toHaveCount(0)
    await expect(todayCount(page)).toHaveText('1/5')
    expectCleanConsole(consoleProblems)
  })

  test('Qılmadım → "qılmadım" qeydi və qəza sayğacına +1', async ({ page, consoleProblems }) => {
    const today = keyIn()
    await page.goto(`/prayer?checkin=asr&d=${today}`)
    await settle(page)
    const card = page.getByTestId('checkin-card')
    await card.getByRole('button', { name: 'Qılmadım' }).click()
    await expect(card.getByRole('status')).toContainText('Qeyd olundu')
    expect((await ls(page, 'muslim_cc_prayer_status'))[today].asr).toBe('missed')
    await card.getByRole('button', { name: 'Qəza sayğacına +1' }).click()
    await expect(card.getByRole('button', { name: 'Qəza sayğacına +1' })).toHaveCount(0)
    expect((await ls(page, 'muslim_cc_qada')).prayers.asr.debt).toBe(1)
    await expect(todayCount(page)).toHaveText('0/5')
    expectCleanConsole(consoleProblems)
  })

  test('köhnə tarix, gələcək tarix və naməlum namaz — kart yoxdur', async ({ page, consoleProblems }) => {
    for (const q of ['checkin=asr&d=2020-01-01', `checkin=asr&d=${keyIn(3)}`, 'checkin=witr']) {
      await page.goto(`/prayer?${q}`)
      await settle(page)
      await expect(page.getByRole('heading', { name: 'Namaz vaxtları', level: 1 })).toBeVisible()
      await expect(page.getByTestId('checkin-card')).toHaveCount(0)
    }
    expectCleanConsole(consoleProblems)
  })

  test('bildirişdəki "✅ Qıldım" (IndexedDB) izləyiciyə köçür — idempotent', async ({ page, consoleProblems }) => {
    const today = keyIn()
    await page.goto('/prayer')
    await settle(page)
    await expect(todayCount(page)).toHaveText('0/5')

    // Service worker iki dəfə eyni qeydi və bir başqa namazı yazıb
    await putPending(page, [{ date: today, prayer: 'fajr' }, { date: today, prayer: 'fajr' }, { date: today, prayer: 'asr' }])
    await page.reload()
    await settle(page)
    await expect(todayCount(page)).toHaveText('2/5')
    await expect.poll(() => pendingCount(page)).toBe(0)
    expect((await ls(page, 'daily_tracker'))[today]).toMatchObject({ fajr: true, asr: true })

    // Təkrar köçürmə nəticəni dəyişmir
    await putPending(page, [{ date: today, prayer: 'fajr' }])
    await page.reload()
    await settle(page)
    await expect(todayCount(page)).toHaveText('2/5')
    await expect.poll(() => pendingCount(page)).toBe(0)
    expectCleanConsole(consoleProblems)
  })
})

test.describe('/prayer-tracker', () => {
  test.skip(!HAS_ROUTE, 'marşrut hələ App.jsx/routes.js-ə qoşulmayıb')

  /** n gün əvvəlki günü 5 namazla doldur (köhnə /prayer formatı — miqrasiyasız oxunmalıdır) */
  async function seedFullDays(page, offsets, extra = {}) {
    const stats = {}
    for (const o of offsets) for (const p of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) stats[`${keyIn(-o)}_${p}`] = true
    await page.evaluate(({ stats, extra }) => {
      localStorage.setItem('muslim_cc_prayer_stats', JSON.stringify(stats))
      for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, JSON.stringify(v))
    }, { stats, extra })
  }

  test('Qıldım → ardıcıl gün seriyası', async ({ page, consoleProblems }) => {
    await page.goto('/prayer-tracker')
    await seedFullDays(page, [1, 2])
    await page.reload()
    await settle(page)
    await expect(page.getByRole('heading', { name: 'Namaz izləyicisi', level: 1 })).toBeVisible()
    await expect(page.getByTestId('pt-streak')).toHaveText('2')
    await expect(page.getByTestId('pt-day-count')).toHaveText('0/5 qılındı')

    for (const name of ['Sübh', 'Zöhr', 'Əsr', 'Məğrib']) {
      await page.getByRole('group', { name: `${name} namazı` }).getByRole('button', { name: 'Qıldım' }).click()
    }
    // Biri qəza — o da seriyaya sayılır
    await page.getByRole('group', { name: 'İşa namazı' }).getByRole('button', { name: 'Qəza' }).click()
    await expect(page.getByTestId('pt-day-count')).toHaveText('5/5 qılındı')
    await expect(page.getByTestId('pt-streak')).toHaveText('3')
    await expect(page.getByRole('group', { name: 'İşa namazı' }).getByRole('button', { name: 'Qəza' })).toHaveAttribute('aria-pressed', 'true')
    expect((await ls(page, 'muslim_cc_prayer_status'))[keyIn()].isha).toBe('qada')

    // /prayer eyni məlumatı görür
    await page.goto('/prayer')
    await settle(page)
    await expect(todayCount(page)).toHaveText('5/5')
    expectCleanConsole(consoleProblems)
  })

  test('heyz günləri seriyanı qırmır; bölmə yalnız cihazdadır', async ({ page, consoleProblems }) => {
    await page.goto('/prayer-tracker')
    // 1 və 5 gün əvvəl tam; 2–4 gün əvvəl heyz
    await seedFullDays(page, [1, 5], {
      muslim_cc_hayd: { enabled: true, periods: [{ id: 'p1', type: 'hayd', start: keyIn(-4), end: keyIn(-2) }], handled: [] },
    })
    await page.reload()
    await settle(page)
    await expect(page.getByTestId('pt-streak')).toHaveText('2')
    const hayd = page.locator('#hayd')
    await expect(hayd.getByRole('note')).toContainText('heç bir serverə göndərilmir')
    await expect(page.locator(`.pt-cal-day[data-date="${keyIn(-3)}"]`)).toHaveClass(/is-excused/)

    // Bu gün yeni dövr başladanda gün kartı "namaz yoxdur" göstərir, seriya qırılmır
    await hayd.getByRole('button', { name: 'Dövrü başlat' }).click()
    await expect(page.getByTestId('pt-excused')).toHaveText(/Heyz — namaz yoxdur/)
    await expect(page.getByTestId('pt-streak')).toHaveText('2')
    await hayd.getByRole('button', { name: 'Dövr bitdi' }).click()
    await expect(hayd.getByRole('button', { name: 'Dövrü başlat' })).toBeVisible()
    expectCleanConsole(consoleProblems)
  })

  test('qəza sayğacı: +/−, "qəza qıldım", toplu daxiletmə təsdiqlə', async ({ page, consoleProblems }) => {
    await page.goto('/prayer-tracker')
    await settle(page)
    const qada = page.locator('#qada')
    const inc = qada.getByRole('button', { name: 'Sübh: borcu artır' })
    await inc.click(); await inc.click(); await inc.click()
    await expect(page.getByTestId('qada-fajr')).toHaveText('3')
    await qada.locator('[data-prayer="fajr"]').getByRole('button', { name: 'Qəza qıldım' }).click()
    await expect(page.getByTestId('qada-fajr')).toHaveText('2')
    await expect(qada).toContainText('Qılınıb: 1')

    await qada.getByText('Toplu əlavə et').click()
    await qada.getByLabel('İl').fill('1')
    await qada.getByRole('button', { name: 'Hesabla' }).click()
    await expect(qada.getByRole('region', { name: 'Toplu əlavə et' })).toContainText('Hər namaz üçün 365, cəmi 1825 namaz.')
    // Sayğac təsdiqdən ƏVVƏL dəyişmir
    await expect(page.getByTestId('qada-dhuhr')).toHaveText('0')
    await qada.getByRole('button', { name: 'Təsdiq et və əlavə et' }).click()
    await expect(page.getByTestId('qada-fajr')).toHaveText('367')
    await expect(page.getByTestId('qada-isha')).toHaveText('365')
    expect((await ls(page, 'muslim_cc_qada')).prayers.dhuhr).toEqual({ debt: 365, done: 0 })
    expectCleanConsole(consoleProblems)
  })
})
