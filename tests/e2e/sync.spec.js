// ═══════════════════════════════════════════════════════
// Cihazlar arası sinxronizasiya — İKİ "cihaz" (iki brauzer konteksti)
//   A: sinxronizasiyanı açır → bərpa kodu; məlumatı göndərir
//   B: "Kodum var" → kodla qoşulur → A-nın məlumatı B-yə yazılır
//   B yeniləyib göndərir; A köhnə versiya ilə göndərəndə ZİDDİYYƏT xəbərdarlığı,
//   A "Serverdən gətir" → B-nin məlumatı A-ya gəlir
// /api/sync server/sync.js-in semantikası ilə yaddaşda təqlid olunur (versiya, 409);
// şifrələmə həqiqidir — "server" yalnız şifrəli bloku görür (yoxlanılır).
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

function fakeSyncServer() {
  const store = new Map()
  const handler = async (route) => {
    const req = route.request()
    const id = new URL(req.url()).pathname.split('/').pop()
    if (!/^[0-9a-f]{64}$/.test(id)) return route.fulfill({ status: 400, json: { error: 'bad_id' } })
    const row = store.get(id)
    if (req.method() === 'GET') {
      return row ? route.fulfill({ json: { blob: row.blob, version: row.version, updatedAt: row.updatedAt } })
        : route.fulfill({ status: 404, json: { error: 'not_found' } })
    }
    if (req.method() === 'PUT') {
      const { blob, version = 0 } = req.postDataJSON()
      const cur = row ? row.version : 0
      if (cur !== version) return route.fulfill({ status: 409, json: { version: cur } })
      const next = { blob, version: cur + 1, updatedAt: Date.now() }
      store.set(id, next)
      return route.fulfill({ json: { version: next.version, updatedAt: next.updatedAt } })
    }
    if (req.method() === 'DELETE') { store.delete(id); return route.fulfill({ json: { ok: true } }) }
    return route.fulfill({ status: 405, json: {} })
  }
  return { store, handler }
}

const ls = (page, k) => page.evaluate((key) => localStorage.getItem(key), k)

async function openDialog(page) {
  await page.getByRole('button', { name: 'Məlumatlarım' }).click()
  const dlg = page.locator('dialog.bk-dialog')
  await expect(dlg).toBeVisible()
  return dlg
}

test('iki cihaz: kodla qoşulma, göndər/gətir, ziddiyyət', async ({ page, browser }, info) => {
  const fake = fakeSyncServer()
  await page.route('**/api/sync/*', fake.handler)

  // ── Cihaz A ──
  await page.goto('/privacy')
  await page.evaluate(() => { localStorage.setItem('dua_favs', '[1,2,3]'); localStorage.setItem('muslim_cc_qada_v1', '{"fajr":5}') })
  await settle(page)
  let dlgA = await openDialog(page)
  await dlgA.getByRole('button', { name: 'Sinxronizasiyanı aç' }).click()
  const code = (await dlgA.getByTestId('sync-code').innerText()).trim()
  expect(code).toMatch(/^[0-9A-Z]{4}(-[0-9A-Z]{4}){5}$/)
  await dlgA.getByRole('button', { name: 'Saxladım' }).click()
  await expect(dlgA.getByText('Sinxronizasiya açıqdır')).toBeVisible()

  // "Server" yalnız şifrəli blok görür — açıq mətn yoxdur
  const [stored] = [...fake.store.values()]
  expect(stored.blob).toMatch(/^[A-Za-z0-9_-]+$/)
  expect(stored.blob).not.toContain('dua_favs')

  // ── Cihaz B (ayrıca kontekst = ayrıca localStorage) ──
  const ctxB = await browser.newContext({ baseURL: info.project.use.baseURL, locale: 'az-AZ', serviceWorkers: 'block' })
  const pageB = await ctxB.newPage()
  await pageB.route('**/api/sync/*', fake.handler)
  await pageB.goto('/privacy')
  await settle(pageB)
  expect(await ls(pageB, 'dua_favs')).toBeNull()
  let dlgB = await openDialog(pageB)
  await dlgB.getByRole('button', { name: 'Kodum var' }).click()
  await dlgB.getByLabel('Bərpa kodu').fill(code.toLowerCase().replace(/-/g, ' '))   // kiçik hərf, boşluqla — bağışlanır
  await dlgB.getByRole('button', { name: 'Qoş', exact: true }).click()
  await expect(dlgB.getByText('Bu kodun məlumatı bu cihaza yazılsın?')).toBeVisible()
  await Promise.all([pageB.waitForEvent('load'), dlgB.getByRole('button', { name: 'Qoş və yaz' }).click()])
  expect(await ls(pageB, 'dua_favs')).toBe('[1,2,3]')
  expect(await ls(pageB, 'muslim_cc_qada_v1')).toBe('{"fajr":5}')

  // B dəyişib göndərir
  await pageB.evaluate(() => localStorage.setItem('dua_favs', '[9]'))
  dlgB = await openDialog(pageB)
  await dlgB.getByRole('button', { name: 'Bu cihazdan göndər' }).click()
  await expect(dlgB.getByRole('status').last()).toContainText('Göndərildi')

  // A köhnə versiya ilə göndərir → ziddiyyət, məlumat itmir
  await page.reload(); await settle(page)
  dlgA = await openDialog(page)
  await dlgA.getByRole('button', { name: 'Bu cihazdan göndər' }).click()
  await expect(dlgA.getByText('Başqa cihaz daha yeni məlumat göndərib')).toBeVisible()

  // A gətirir → B-nin məlumatı
  await Promise.all([page.waitForEvent('load'), dlgA.getByRole('button', { name: 'Serverdən gətir' }).click()])
  expect(await ls(page, 'dua_favs')).toBe('[9]')

  // A serverdəki nüsxəni silir (təsdiqlə) → "server" boşdur, A-da məlumat qalır
  dlgA = await openDialog(page)
  await dlgA.getByRole('button', { name: 'Serverdən sil' }).click()
  await dlgA.getByRole('button', { name: 'Bəli, sil' }).click()
  await expect(dlgA.getByText('Serverdəki nüsxə silindi')).toBeVisible()
  expect(fake.store.size).toBe(0)
  expect(await ls(page, 'dua_favs')).toBe('[9]')
  expect(await ls(page, 'muslim_cc_sync')).toBeNull()

  await ctxB.close()
})

test('səhv kod — xəta mesajı', async ({ page }) => {
  const fake = fakeSyncServer()
  await page.route('**/api/sync/*', fake.handler)
  await page.goto('/privacy')
  await settle(page)
  const dlg = await openDialog(page)
  await dlg.getByRole('button', { name: 'Kodum var' }).click()
  await dlg.getByLabel('Bərpa kodu').fill('0000-1111-2222-3333-4444-5555')
  await dlg.getByRole('button', { name: 'Qoş', exact: true }).click()
  await expect(dlg.getByText('Bu kodla məlumat tapılmadı')).toBeVisible()
})
