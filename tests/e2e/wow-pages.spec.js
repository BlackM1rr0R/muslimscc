// ═══════════════════════════════════════════════════════
// VAU vizualları — bağça, dağ, axın, ailə ağacı (yerli yaddaşdan məlumatla)
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

test('dua bağçası: qönçə və çiçəklər, toxunuşla mətn', async ({ page }) => {
  await page.addInitScript(() => {
    const duas = [
      { id: 'a', text: 'Sağlamlıq duası', category: 'health', priority: 'high', date: '2026-10-01', answered: true, answeredDate: '2026-11-01' },
      { id: 'b', text: 'Ailə üçün dua', category: 'family', priority: 'low', date: '2026-10-05', answered: false, answeredDate: null },
    ]
    localStorage.setItem('dua_journal', JSON.stringify({ duas }))
  })
  await page.goto('/duajournal')
  await settle(page)
  const g = page.getByTestId('dua-garden')
  await expect(g.locator('.dg__plant')).toHaveCount(2)
  await expect(g.locator('.dg__flower')).toHaveCount(1)
  await expect(g.locator('.dg__bud')).toHaveCount(1)
  await g.locator('.dg__plant').nth(1).click()
  await expect(g.locator('.dg__note')).toContainText('Ailə üçün dua')
})

test('qəza dağı: faiz və qalan say', async ({ page }) => {
  await page.addInitScript(() => {
    const x = (o, d) => ({ owed: o, done: d })
    localStorage.setItem('muslim_cc_qada_v1', JSON.stringify({ v: 1, prayers: { fajr: x(150, 50), dhuhr: x(150, 50), asr: x(150, 50), maghrib: x(150, 50), isha: x(150, 50) }, fasts: x(0, 0), goal: 5, log: {} }))
  })
  await page.goto('/qada')
  await settle(page)
  const m = page.getByTestId('qada-mountain')
  await expect(m.locator('.qm__pct')).toHaveText('25%')
  await expect(m).toContainText('750')
  await expect(m.locator('.qm__camp.is-on')).toHaveCount(2)
})

test('kviz kombo: ardıcıl düz cavablar sayılır, səhvdə sıfırlanır, nəticədə ən uzun seriya', async ({ page }) => {
  await page.goto('/quiz')
  await settle(page)
  await page.locator('.quiz-category-card').first().click()
  let streak = 0, best = 0
  for (let i = 0; i < 20; i++) {
    if (await page.locator('.quiz-results-card').isVisible()) break
    const opts = page.locator('.quiz-option')
    await expect(opts.first()).toBeVisible()
    await opts.first().click()
    const right = await opts.first().evaluate(el => el.classList.contains('quiz-option-correct'))
    streak = right ? streak + 1 : 0
    best = Math.max(best, streak)
    const combo = page.getByTestId('quiz-combo')
    if (streak >= 2) await expect(combo).toContainText(`×${streak}`)
    else await expect(combo).toHaveCount(0)
    await page.locator('.quiz-next-btn').click()
  }
  await expect(page.locator('.quiz-results-card')).toBeVisible()
  await expect(page.locator('.quiz-stat-streak')).toHaveCount(best >= 2 ? 1 : 0)
  if (best >= 2) await expect(page.locator('.quiz-stat-streak .quiz-stat-num')).toHaveText(String(best))
})

test('Quranın xəritəsi: əzbər sayı və toxunuşla ayə', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hifz_progress', JSON.stringify({ 1: 2, 114: 2 })))
  await page.goto('/hifz')
  await settle(page)
  const m = page.getByTestId('quran-map')
  await m.scrollIntoViewIfNeeded()
  await expect(m.locator('.qmap__legend li').first()).toContainText('13')
  const box = await m.locator('canvas').boundingBox()
  await page.mouse.click(box.x + 2, box.y + 2)
  await expect(m.locator('.qmap__info')).toContainText('1:1')
})

test('hilal yolu: toxunuş dövrü oruc → üzrlü → boş, yaddaşda qalır', async ({ page }) => {
  await page.goto('/ramadan?ramadan=preview&day=3')
  await settle(page)
  const c = page.getByTestId('crescent-path')
  const m = c.locator('.cp__moon').nth(1)
  await m.click()
  await expect(m).toHaveAttribute('aria-pressed', 'true')
  await expect(c.getByTestId('cp-fasted')).toHaveText('1')
  await page.reload(); await settle(page)
  await expect(c.getByTestId('cp-fasted')).toHaveText('1')
  await c.locator('.cp__moon').nth(1).click()
  await expect(c.locator('.cp__moon--2')).toHaveCount(1)
  await expect(c.getByTestId('cp-fasted')).toHaveText('0')
  await expect(c.locator('.cp__star')).toHaveCount(5)
})

test('nur xalçası: 12 ay, qılınan namaz qızıl ilmə, toxunuş günü açır', async ({ page }) => {
  await page.addInitScript(() => {
    const d = new Date(); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    localStorage.setItem('daily_tracker', JSON.stringify({ [k]: { fajr: true, dhuhr: true } }))
  })
  await page.goto('/prayer-tracker')
  await settle(page)
  const c = page.getByTestId('nur-carpet')
  await c.scrollIntoViewIfNeeded()
  await expect(c.locator('.nc__month')).toHaveCount(12)
  await expect(c.locator('rect.nc__k--prayed')).toHaveCount(2)
  await expect(c.locator('.nc__today')).toHaveCount(1)
  await expect(c.locator('.nc__sum')).toContainText('2')
})

test.describe('məscid radarı', () => {
  test.use({ geolocation: { latitude: 40.4093, longitude: 49.8671 }, permissions: ['geolocation'] })
  test('radar: nöqtələr, ən yaxın, piyada vaxtı; nöqtəyə toxunuş', async ({ page }) => {
    await page.route(/overpass/, r => r.fulfill({ json: { elements: [
      { type: 'node', id: 1, lat: 40.4120, lon: 49.8700, tags: { name: 'Yaxın məscid' } },
      { type: 'node', id: 2, lat: 40.4500, lon: 49.8000, tags: { name: 'Uzaq məscid' } },
    ] } }))
    await page.goto('/mosques')
    await settle(page)
    await page.locator('.mosque-search-btn').click()
    const r = page.getByTestId('mosque-radar')
    await expect(r).toBeVisible()
    await expect(r.locator('.mr__dot')).toHaveCount(2)
    await expect(r.locator('.mr__name')).toHaveText('Yaxın məscid')
    await expect(r.locator('.mr__walk')).toContainText('dəq')
    await r.locator('.mr__dot').nth(1).click({ force: true })
    await expect(r.locator('.mr__name')).toHaveText('Uzaq məscid')
    await expect(page.locator('.mosque-walk').first()).toContainText('piyada')
  })
})

test('ərəb hərfi: üstündən yazmaq ulduz verir, hər yeri cızmaq vermir', async ({ page }) => {
  await page.goto('/learn-arabic#letters')
  await settle(page)
  const f = page.getByTestId('letter-trace')
  await f.scrollIntoViewIfNeeded()
  const check = f.getByRole('button', { name: 'Yazını yoxla' })
  await expect(check).toBeDisabled()
  const box = await f.locator('.lt__ink').boundingBox()
  const pts = await f.locator('.lt__guide').evaluate(cv => {
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, out = [], st = Math.max(1, Math.round(cv.width / 40))
    for (let y = 0; y < cv.height; y += st) for (let x = 0; x < cv.width; x += st) if (d[(y * cv.width + x) * 4 + 3] > 80) out.push([x / cv.width, y / cv.height])
    return out
  })
  expect(pts.length).toBeGreaterThan(5)
  for (const [x, y] of pts) { await page.mouse.move(box.x + x * box.width, box.y + y * box.height); await page.mouse.down(); await page.mouse.move(box.x + x * box.width + 1, box.y + y * box.height); await page.mouse.up() }
  await check.click()
  await expect(f.locator('.lt__stars .is-on')).not.toHaveCount(0)
  expect(await f.locator('.lt__stars .is-on').count()).toBeGreaterThanOrEqual(2)
  // Təmizlə → hər yeri cız → 0 ulduz
  await f.getByRole('button', { name: 'Təmizlə' }).click()
  for (let y = 0.05; y < 1; y += 0.06) { await page.mouse.move(box.x + 4, box.y + y * box.height); await page.mouse.down(); await page.mouse.move(box.x + box.width - 4, box.y + y * box.height, { steps: 6 }); await page.mouse.up() }
  await check.click()
  await expect(f.locator('.lt__res')).toContainText('Yenidən cəhd edin')
})

test('fətva mövzu buludu: toxunuş mövzunu süzür, bulud gizlənir', async ({ page }) => {
  await page.goto('/fatwa')
  await settle(page)
  const c = page.getByTestId('fatwa-cloud')
  await expect(c.locator('button')).toHaveCount(16)
  await c.getByRole('button', { name: /Namaz/ }).click()
  await expect(c).toHaveCount(0)
  await expect(page.locator('.fw-topic')).toHaveCount(1)
  await expect(page.locator('.fw-topic__title')).toHaveText('Namaz')
})

test.describe('parallaks', () => {
  test.use({ reducedMotion: 'no-preference' })
  test('müqəddəs yerlərin kart fotosu sürüşdükcə hərəkət edir; azaldılmış hərəkətdə yox', async ({ page }) => {
  await page.goto('/holyplaces')
  await settle(page)
  const img = page.locator('.holy-card-media .ph--parallax .ph__img').first()
  await img.scrollIntoViewIfNeeded()
  const at = async (dy) => { await page.evaluate((d) => window.scrollBy(0, d), dy); await page.waitForTimeout(200); return img.evaluate(e => getComputedStyle(e).translate) }
  const a = await at(-150), b = await at(300)
  expect(a).not.toBe(b)
  })
})

test('Quranda mövzu: çip və yazılmış söz kökə aparır', async ({ page }) => {
  await page.goto('/quran-roots')
  await settle(page)
  const topics = page.getByTestId('quran-topics')
  await topics.getByRole('button', { name: /Şükr/ }).click()
  await expect(page).toHaveURL(/root=%D8%B4%D9%83%D8%B1/)
  await expect(page.locator('#qr-root-title')).toHaveText('ش ك ر')
  const input = page.locator('form input').first()
  await input.fill('səbr')
  await input.press('Enter')
  await expect(page.locator('#qr-root-title')).toHaveText('ص ب ر')
})

test('sözbəsöz tilavət: sözlər, vaxta görə vurğu, toxunuşla həmin sözdən, Esc bağlayır', async ({ page }) => {
  await page.route(/api\.quran\.com\/api\/v4\/verses\/by_key\//, r => r.fulfill({ json: { verse: { words: [
    { position: 1, char_type_name: 'word', text_uthmani: 'ٱلْحَمْدُ' }, { position: 2, char_type_name: 'word', text_uthmani: 'لِلَّهِ' },
    { position: 3, char_type_name: 'word', text_uthmani: 'رَبِّ' }, { position: 4, char_type_name: 'end', text_uthmani: '٢' }] } } }))
  await page.route(/api\.quran\.com\/api\/v4\/recitations\/7\/by_ayah\//, r => r.fulfill({ json: { audio_files: [{ url: 'Alafasy/mp3/001002.mp3', segments: [[0, 1, 0, 900], [1, 2, 1000, 1800], [2, 3, 1900, 2500]] }] } }))
  await page.route(/verses\.quran\.com\//, r => r.fulfill({ status: 200, contentType: 'audio/mpeg', body: '' }))
  await page.addInitScript(() => {
    window.__t = 0
    Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', { configurable: true, get() { return window.__t }, set(v) { window.__t = v } })
    HTMLMediaElement.prototype.play = function () { return Promise.resolve() }
    HTMLMediaElement.prototype.pause = function () {}
  })
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  await page.getByTestId('karaoke-open').nth(1).click()
  const k = page.getByTestId('karaoke')
  await expect(k.locator('.kar__w')).toHaveCount(3)
  await k.getByTestId('karaoke-play').click()
  await page.evaluate(() => { window.__t = 1.2 })
  await expect(k.locator('.kar__w.is-on')).toHaveText('لِلَّهِ')
  await k.locator('.kar__w').nth(2).click()
  await expect.poll(() => page.evaluate(() => window.__t)).toBe(1.9)
  await expect(k.locator('.kar__w.is-on')).toHaveText('رَبِّ')
  await page.keyboard.press('Escape')
  await expect(k).toHaveCount(0)
})

test('Qiyam rejimi: kart, tam ekran, hədis və vitr surələri, Esc bağlayır', async ({ page }) => {
  await page.goto('/prayer')
  await settle(page)
  const card = page.getByTestId('qiyam-card')
  await card.scrollIntoViewIfNeeded()
  await page.getByTestId('qiyam-open').click()
  const q = page.getByTestId('qiyam')
  await expect(q).toBeVisible()
  await expect(q.getByTestId('qiyam-count')).toContainText('dəq')
  await expect(q).toContainText('Təhəccüd 14')
  await expect(q.locator('.qy__chip')).toHaveCount(3)
  await expect(q.locator('.qy__dua')).toHaveCount(2)
  await page.keyboard.press('Escape')
  await expect(q).toHaveCount(0)
})

test('"Necə hiss edirsən?": hala toxunuş Hisnul-Müslim dualarını açır', async ({ page }) => {
  await page.goto('/duas')
  await settle(page)
  const m = page.getByTestId('mood-duas')
  await expect(m.locator('.md__mood')).toHaveCount(10)
  await m.getByRole('button', { name: 'Kədərliyəm' }).click()
  await expect(m.locator('.md__chap')).toHaveCount(2)
  await expect(m.locator('.md__chap').first()).toContainText('Qəm və kədər')
  await expect(m.locator('.md__open').first()).toHaveAttribute('href', /hisnul-muslim#hs-35$/)
  await m.getByRole('button', { name: 'Kədərliyəm' }).click()
  await expect(m.locator('.md__chap')).toHaveCount(0)
})

test('surənin kök buludu: düymə ilə açılır, köklər kök səhifəsinə aparır', async ({ page }) => {
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  const c = page.getByTestId('surah-root-cloud')
  await c.getByRole('button').click()
  await expect(c.locator('.src-cloud__w').first()).toBeVisible()
  expect(await c.locator('.src-cloud__w').count()).toBeGreaterThan(3)
  await expect(c.locator('.src-cloud__w').first()).toHaveAttribute('href', /quran-roots\?root=/)
})
