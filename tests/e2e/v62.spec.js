// v6.2: hilalın görünmə xəritəsi, Quranın səması AR, məxrəc kəsiyi, ayə tapmacası,
// qiraətçiləri müqayisə, 3D kitab rəfi, səhv səcdəsi bələdçisi
import { test, expect, settle } from './fixtures.js'

const scrollTo = async (page, loc) => {
  for (let i = 0; i < 60 && !(await loc.count()); i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(150) }
  await loc.scrollIntoViewIfNeeded()
}
function silentWav(sec = 0.6) {
  const n = Math.round(8000 * sec), b = Buffer.alloc(44 + n * 2)
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12)
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(8000, 24)
  b.writeUInt32LE(16000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin(i / 6) * 8000 * (i % 2000 < 1000 ? 1 : 0.3)), 44 + i * 2)
  return b
}

test('Hilal xəritəsi: birləşmə vaxtı, 3 axşam, şəhər və seçilmiş nöqtə', async ({ page }) => {
  await page.goto('/calendar')
  await settle(page)
  const sec = page.getByTestId('crescent-map')
  await scrollTo(page, sec)
  await expect(sec.getByTestId('cvm-canvas')).toHaveAttribute('data-ready', 'true', { timeout: 10000 })
  await expect(sec.getByTestId('cvm-conj')).not.toBeEmpty()
  await expect(sec.getByTestId('cvm-city')).toContainText('Gün batımı')
  await sec.getByTestId('cvm-day-2').click()
  await expect(sec.getByTestId('cvm-canvas')).toHaveAttribute('data-ready', 'true', { timeout: 10000 })
  const box = await sec.getByTestId('cvm-canvas').boundingBox()
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.6)
  await expect(sec.getByTestId('cvm-pt')).toContainText('UTC')
  await expect(sec).toContainText('Odeh')
})

test('Quranın səması AR: Ay, Günəş, əş-Şira — ayə və keçid', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'yalnız toxunma ekranı')
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => { const c = document.createElement('canvas'); c.width = 4; c.height = 4; return c.captureStream(1) }
  })
  await page.goto('/calendar')
  await settle(page)
  await page.getByTestId('sky-open').click()
  const ar = page.getByTestId('quran-sky')
  await expect(ar).toBeVisible()
  await ar.getByTestId('sky-sirius').click()
  await expect(ar.getByTestId('sky-ayahs')).toContainText('53:49')
  await expect(ar.getByTestId('sky-ayahs').locator('a')).toHaveAttribute('href', /\/quran\/53[^?]*\?a=49$/)
  const txt = await ar.getByTestId('hlr-data').textContent()
  const [az, alt] = [...txt.matchAll(/(-?\d+)°/g)].map(m => Number(m[1]))
  if (alt > 0) {
    for (let i = 0; i < 40; i++) {
      await page.evaluate(([a, b]) => window.dispatchEvent(Object.assign(new Event('deviceorientationabsolute'), { alpha: (360 - a) % 360, beta: 90 + b, gamma: 0, absolute: true })), [az, alt])
    }
  }
  await expect(ar.getByTestId('sky-ayahs')).toHaveClass(/is-open/, { timeout: 5000 })
  await ar.getByTestId('sky-sun').click()
  await expect(ar.getByTestId('sky-ayahs')).toContainText('36:38')
  await ar.getByRole('button', { name: 'Bağla' }).click()
  await expect(ar).toHaveCount(0)
})

test('Məxrəc kəsiyi: hərfə toxunanda təsvir və bölgə dəyişir', async ({ page }) => {
  await page.goto('/learn-arabic#tajweed')
  await settle(page)
  const sec = page.getByTestId('makhraj')
  await scrollTo(page, sec)
  await expect(sec.getByTestId('makhraj-desc')).toContainText('yumşaq damaq')
  await sec.getByTestId('mkh-ba').click()
  await expect(sec.getByTestId('makhraj-desc')).toContainText('dodağ')
  await expect(sec).toContainText('Dodaqlar')
  await sec.getByTestId('mkh-ayn').click()
  await expect(sec).toContainText('Boğaz')
})

test('Ayə tapmacası: səhv söz sayılır, düzülən ayə qiymət təklif edir', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'masaüstü kifayətdir')
  const AR = ['قُلْ هُوَ ٱللَّهُ أَحَدٌ', 'ٱللَّهُ ٱلصَّمَدُ', 'لَمْ يَلِدْ وَلَمْ يُولَدْ', 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ']
  await page.route(/api\.alquran\.cloud\/v1\/surah\/112\/editions\//, route => route.fulfill({ json: { code: 200, data: [{
    number: 112, ayahs: AR.map((text, i) => ({ number: 6222 + i, numberInSurah: i + 1, text })),
  }] } }))
  await page.goto('/hifz')
  await settle(page)
  await page.locator('.hifz-plan__surah select').selectOption('112')
  await page.getByRole('button', { name: 'Əzbərləməyə başla' }).click()
  const card = page.locator('.hifz-practice')
  await card.getByTestId('hifz-view-puzzle').click()
  const pz = card.getByTestId('ayah-puzzle')
  await expect(pz.getByTestId('apz-chip')).toHaveCount(4)
  await pz.locator('[data-testid=apz-chip][data-w="3"]').click()   // "أَحَدٌ" birinci deyil
  await expect(pz.getByTestId('apz-mistakes')).toHaveText('1')
  for (const i of [0, 1, 2, 3]) await pz.locator(`[data-testid=apz-chip][data-w="${i}"]`).click()
  await expect(pz.getByTestId('apz-done')).toBeVisible()
  await expect(pz.getByTestId('apz-line')).toContainText('أَحَدٌ')
  await expect(card.locator('.hifz-grade__btn.is-suggested.is-hard')).toHaveCount(1)
  await card.locator('.hifz-grade__btn.is-hard').click()
  const srs = await page.evaluate(() => JSON.parse(localStorage.getItem('hifz_srs')))
  expect(srs.items['112:1']).toBeTruthy()
})

test('Qiraətçiləri müqayisə: 5 qari, sözə toxunanda hər qaridə müddəti', async ({ page }) => {
  const words = ['صِرَٰطَ', 'ٱلَّذِينَ', 'أَنْعَمْتَ'].map((t, i) => ({ position: i + 1, char_type_name: 'word', text_uthmani: t }))
  await page.route(/api\.quran\.com\/api\/v4\/verses\/by_key\//, route => route.fulfill({ json: { verse: { verse_key: '1:7', words: [...words, { position: 4, char_type_name: 'end', text_uthmani: '٧' }] } } }))
  await page.route(/api\.quran\.com\/api\/v4\/recitations\/(\d+)\/by_ayah\//, route => {
    const id = Number(route.request().url().match(/recitations\/(\d+)/)[1])
    const k = 1 + id / 10
    route.fulfill({ json: { audio_files: [{ verse_key: '1:7', url: `R${id}/mp3/001007.mp3`, segments: [[0, 1, 0, 150 * k], [1, 2, 160 * k, 300 * k], [2, 3, 310 * k, 580 * k]] }] } })
  })
  await page.route(/verses\.quran\.com\//, route => route.fulfill({ status: 200, contentType: 'audio/wav', body: silentWav() }))
  await page.goto('/quran')
  await settle(page)
  const sec = page.getByTestId('reciter-compare')
  await scrollTo(page, sec)
  await expect(sec.getByTestId('rcm-row')).toHaveCount(5)
  await expect(sec.getByTestId('rcm-word')).toHaveCount(3)
  await sec.getByTestId('rcm-word').last().click()
  await expect(sec.getByTestId('rcm-wd')).toHaveCount(5)
  await expect(sec.getByTestId('rcm-wd').filter({ hasText: 'ən uzun' })).toHaveCount(1)
  await sec.getByTestId('rcm-row').first().getByRole('button').click()
  await expect(sec.getByTestId('rcm-row').first()).toHaveClass(/is-play/)
})

test('Kitab rəfi: kitab açılır, vərəq çevrilir, bölmə kitabxanada açılır', async ({ page }) => {
  await page.goto('/hadith-library')
  await settle(page)
  const sh = page.getByTestId('hadith-shelf')
  await scrollTo(page, sh)
  await sh.getByTestId('hsh-bukhari').click()
  await expect(sh.getByTestId('hsh-open')).toContainText('7 589')
  await expect(sh.getByTestId('hsh-spread')).toContainText('1 /')
  await sh.getByTestId('hsh-next').click()
  await expect(sh.getByTestId('hsh-spread')).toContainText('2 /')
  await sh.getByTestId('hsh-sec').filter({ hasText: 'Forgetfulness' }).first().click()
  await expect(page).toHaveURL(/#bukhari\/22$/)
})

test('Səhv səcdəsi: qərar ağacı, salamdan əvvəl/sonra, hədis keçidi', async ({ page }) => {
  await page.goto('/prayerguide')
  await settle(page)
  const g = page.getByTestId('sahw-guide')
  await scrollTo(page, g)
  await g.getByTestId('shw-tashahhud').click()
  await expect(g.getByTestId('shw-when')).toContainText('ƏVVƏL')
  await expect(g.getByTestId('shw-ref').first()).toHaveAttribute('href', /hadith-library#bukhari\/22\/1224$/)
  await expect(g.getByTestId('shw-ref').nth(1)).toHaveAttribute('href', /#muslim\/5\/1269$/)
  await g.getByTestId('shw-reset').click()
  await g.getByTestId('shw-doubt').click()
  await g.getByTestId('shw-doubtLean').click()
  await expect(g.getByTestId('shw-when')).toContainText('SONRA')
  await expect(g.getByTestId('shw-result')).toContainText('Səhih Müslim, 572')
})
