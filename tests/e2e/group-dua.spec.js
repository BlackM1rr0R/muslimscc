// ═══════════════════════════════════════════════════════
// Ailə dua lövhəsi (/group, type: 'dua') — yarat → istək yaz → «Dua etdim» →
// «Əlhəmdulillah». /api/groups server/groups.js-in semantikası ilə yaddaşda
// təqlid olunur (tokenlər, cihaz başına gündə bir «dua etdim», 403/409).
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole } from './fixtures.js'

function fakeGroupsServer() {
  const rooms = new Map()
  const prayed = new Set()
  let seq = 0
  const rid = (n) => String(++seq).padStart(n, '0').replace(/^0/, 'r')
  const view = (r) => ({
    id: r.id, type: r.type, title: r.title, lang: r.lang, closed: r.closed, createdAt: 1, lastActivity: 1,
    dua: { requests: [...r.requests].reverse().map(({ did, name, text, count, answered }) => ({ did, name, text, count, answered, day: '2026-11-17' })) },
  })
  const handler = async (route) => {
    const req = route.request()
    const parts = new URL(req.url()).pathname.split('/').slice(3)   // ['', 'api', 'groups', …]
    const body = req.method() === 'POST' ? (req.postDataJSON() || {}) : {}
    if (!parts.length && req.method() === 'POST') {
      if (body.type !== 'dua' || !body.title || body.title.length < 2) return route.fulfill({ status: 400, json: { error: 'invalid' } })
      const id = rid(10)
      rooms.set(id, { id, type: 'dua', title: body.title, lang: body.lang || 'az', closed: false, adminKey: `adm${id}`, requests: [] })
      return route.fulfill({ status: 201, json: { id, adminKey: `adm${id}` } })
    }
    const r = rooms.get(parts[0])
    if (!r) return route.fulfill({ status: 404, json: { error: 'not found' } })
    if (parts.length === 1 && req.method() === 'GET') return route.fulfill({ json: view(r) })
    if (parts[1] === 'dua' && parts.length === 2) {
      if (!body.text || body.text.trim().length < 2) return route.fulfill({ status: 400, json: { error: 'invalid' } })
      const did = rid(8)
      r.requests.push({ did, name: body.name || '', text: body.text, count: 0, answered: false, token: `tok${did}` })
      return route.fulfill({ json: { did, token: `tok${did}` } })
    }
    const d = parts[1] === 'dua' ? r.requests.find(x => x.did === parts[2]) : null
    if (d && parts[3] === 'pray') {
      if (!/^[A-Za-z0-9_-]{16,64}$/.test(body.device || '')) return route.fulfill({ status: 400, json: { error: 'invalid' } })
      const k = `${r.id}|${d.did}|${body.device}`
      const already = prayed.has(k)
      if (!already) { prayed.add(k); d.count++ }
      return route.fulfill({ json: { count: d.count, already } })
    }
    if (d && parts[3] === 'answered') {
      if (body.token !== d.token) return route.fulfill({ status: 403, json: { error: 'forbidden' } })
      d.answered = body.on !== false
      return route.fulfill({ json: { ok: true } })
    }
    return route.fulfill({ status: 404, json: { error: 'not found' } })
  }
  return { rooms, handler }
}

test('dua lövhəsi: yarat → istək yaz → dua etdim → əlhəmdulillah', async ({ page, consoleProblems }) => {
  const fake = fakeGroupsServer()
  await page.route((u) => /^\/api\/groups(\/|$)/.test(u.pathname), fake.handler)

  await page.goto('/group')
  await settle(page)
  const form = page.getByRole('form', { name: 'Otaq yarat' })
  await form.getByRole('button', { name: 'Ailə dua lövhəsi' }).click()
  await expect(form.getByRole('button', { name: 'Ailə dua lövhəsi' })).toHaveAttribute('aria-pressed', 'true')
  await form.getByLabel('Otağın adı').fill('Ailəmizin dua lövhəsi')
  await form.getByRole('button', { name: 'Otağı yarat' }).click()

  await expect(page).toHaveURL(/\/group\/[a-z0-9]{10}$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Ailəmizin dua lövhəsi' })).toBeVisible()
  await expect(page.getByText('Hələ dua istəyi yoxdur. İlk istəyi sən yaz.')).toBeVisible()
  // Admin idarəetməsi var, dua otağında "sıfırla" yoxdur
  await expect(page.getByRole('button', { name: 'Otağı bağla' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'İşarələri sıfırla' })).toHaveCount(0)

  const add = page.getByTestId('dua-form')
  await add.getByLabel('Nə üçün dua edilsin?').fill('Nənəmin şəfası üçün dua edin')
  await add.getByLabel('Adın (istəsən boş qoy)').fill('Leyla')
  await add.getByRole('button', { name: 'Lövhəyə əlavə et' }).click()

  const card = page.getByTestId('dua-card').filter({ hasText: 'Nənəmin şəfası üçün dua edin' })
  await expect(card).toBeVisible()
  await expect(card).toContainText('Leyla')
  await expect(card).toContainText('Sənin istəyin')

  const pray = card.getByRole('button', { name: /Dua etdim/ })
  await expect(pray).toHaveText(/Dua etdim \(0\)/)
  await pray.click()
  await expect(pray).toHaveText(/Dua etdim \(1\)/)
  await expect(pray).toHaveAttribute('aria-pressed', 'true')
  await expect(pray).toBeDisabled()                       // bu gün bu cihazdan yenə sayılmır
  expect(await page.evaluate(() => localStorage.getItem('mcc_group_device'))).toMatch(/^[0-9a-f]{36}$/)

  await card.getByRole('button', { name: 'Əlhəmdulillah, yerinə yetdi' }).click()
  await expect(card).toHaveClass(/is-answered/)
  await expect(card.getByText('Əlhəmdulillah', { exact: true })).toBeVisible()
  await expect(card.getByRole('button', { name: 'Geri al' })).toBeVisible()

  const [room] = [...fake.rooms.values()]
  expect(room.requests[0]).toMatchObject({ name: 'Leyla', count: 1, answered: true })
  expectCleanConsole(consoleProblems)
})
