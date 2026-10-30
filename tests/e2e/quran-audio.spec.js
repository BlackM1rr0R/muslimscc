// ═══════════════════════════════════════════════════════
// Quran dinləmə: qari seçimi, "Surəni dinlə" (ardıcıl ayələr + vurğu),
// təkrar, A–B aralığı, sürət, klaviatura, xəta → ehtiyat mənbə → "Yenidən cəhd et",
// Media Session.
//
// Səs: əksər testlərdə HTMLMediaElement stub-dır (addInitScript) — şəbəkə və
// dekoder yoxdur, ayənin sonu window.__audio.end() ilə "bitir" (deterministik).
// Son test isə real oynatmanı yoxlayır: .mp3 sorğuları page.route ilə qısa
// səssiz WAV ilə cavablanır (fixtures.js-dəki abort-un üstündən — sonra
// qeydə alınan marşrut üstünlük alır; fixtures.js dəyişmir).
// Fikstür Fatihəni 7 ayə ilə qaytarır (ümumi nömrələr 1…7).
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

function stubMedia() {
  const P = HTMLMediaElement.prototype
  const els = new Set()
  const log = []
  const st = el => {
    if (!el.__st) { el.__st = { paused: true, src: '', t: 0, ended: false }; els.add(el) }
    return el.__st
  }
  Object.defineProperty(P, 'src', { configurable: true, get() { return st(this).src }, set(v) { st(this).src = String(v); st(this).t = 0 } })
  Object.defineProperty(P, 'paused', { configurable: true, get() { return st(this).paused } })
  Object.defineProperty(P, 'ended', { configurable: true, get() { return st(this).ended } })
  Object.defineProperty(P, 'readyState', { configurable: true, get() { return st(this).src ? 4 : 0 } })
  Object.defineProperty(P, 'currentTime', { configurable: true, get() { return st(this).t }, set(v) { st(this).t = v } })
  P.load = function () {}
  P.play = function () {
    const s = st(this)
    s.paused = false
    log.push({ src: s.src, rate: this.playbackRate })
    setTimeout(() => { if (!s.paused) this.dispatchEvent(new Event('playing')) }, 0)
    return Promise.resolve()
  }
  P.pause = function () {
    const s = st(this)
    const was = s.paused
    s.paused = true
    if (!was) this.dispatchEvent(new Event('pause'))
  }
  const active = () => [...els].find(e => !st(e).paused)
  window.__audio = {
    log,
    active: () => { const a = active(); return a ? { src: st(a).src, rate: a.playbackRate } : null },
    // Cari faylın sonu
    end: () => {
      const a = active(); if (!a) return false
      const s = st(a); s.paused = true; s.ended = true
      a.dispatchEvent(new Event('ended')); s.ended = false
      return true
    },
    // Cari fayl yüklənmədi
    fail: () => { const a = active(); if (!a) return false; a.dispatchEvent(new Event('error')); return true },
  }
}

const player = page => page.locator('section.qpl')
const card = (page, n) => page.locator(`#ayah-${n}`)
const activeSrc = page => page.evaluate(() => window.__audio.active()?.src || '')
const end = page => page.evaluate(() => window.__audio.end())

async function openFatiha(page, path = '/quran/1-al-faatiha') {
  await page.goto(path)
  await settle(page)
  await expect(card(page, 7)).toBeVisible()
}
async function openSettings(page) {
  await player(page).getByRole('button', { name: 'Səs ayarları' }).click()
  return page.locator('#qpl-panel')
}

test.describe('stub ilə', () => {
  test.beforeEach(async ({ page }) => { await page.addInitScript(stubMedia) })

  test('qari seçimi yadda qalır və səs həmin qaridən gəlir', async ({ page, consoleProblems }) => {
    await openFatiha(page)
    const panel = await openSettings(page)
    const sel = panel.getByRole('combobox', { name: 'Qari' })
    await expect(sel).toHaveValue('alafasy')
    await sel.selectOption('sudais')
    const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem('quran_audio')))
    expect(prefs).toMatchObject({ reciter: 'sudais' })

    await page.reload()
    await settle(page)
    await expect(card(page, 1)).toBeVisible()
    // Pleyer zolağında qarinin adı
    await expect(player(page)).toContainText('Əbdürrəhman əs-Südeys')
    const panel2 = await openSettings(page)
    await expect(panel2.getByRole('combobox', { name: 'Qari' })).toHaveValue('sudais')
    await page.keyboard.press('Escape')

    await player(page).getByRole('button', { name: 'Surəni dinlə' }).click()
    await expect.poll(() => activeSrc(page)).toContain('/ar.abdurrahmaansudais/1.mp3')
    expectCleanConsole(consoleProblems)
  })

  test('"Surəni dinlə" ayələri ardıcıl oynadır, cari ayə vurğulanır, sonda dayanır', async ({ page, consoleProblems }) => {
    await openFatiha(page)
    await player(page).getByRole('button', { name: 'Surəni dinlə' }).click()
    await expect(card(page, 1)).toHaveClass(/is-playing/)
    await expect(card(page, 1)).toHaveAttribute('aria-current', 'true')
    await expect.poll(() => activeSrc(page)).toMatch(/\/ar\.alafasy\/1\.mp3$/)
    await expect(player(page)).toContainText('1-ci ayə')
    // Kartın düyməsi də "Dayandır" göstərir
    await expect(card(page, 1).getByRole('button', { name: 'Dayandır' })).toHaveAttribute('aria-pressed', 'true')

    for (let n = 2; n <= 7; n++) {
      await end(page)
      await expect(card(page, n)).toHaveClass(/is-playing/)
      await expect(card(page, n - 1)).not.toHaveClass(/is-playing/)
      await expect.poll(() => activeSrc(page)).toMatch(new RegExp(`/ar\\.alafasy/${n}\\.mp3$`))
    }
    await expect(player(page)).toContainText('7-ci ayə')
    // Surənin sonu: pleyer dayanır, "Surəni dinlə" geri gəlir, vurğu yoxdur
    await end(page)
    await expect(player(page).getByRole('button', { name: 'Surəni dinlə' })).toBeVisible()
    await expect(page.locator('.ayah-card.is-playing')).toHaveCount(0)
    expect(await activeSrc(page)).toBe('')
    expectCleanConsole(consoleProblems)
  })

  test('kartın düyməsi həmin ayədən başladır; fasilə və davam', async ({ page, consoleProblems }) => {
    await openFatiha(page)
    await card(page, 3).getByRole('button', { name: 'Ayəni dinlə' }).click()
    await expect(card(page, 3)).toHaveClass(/is-playing/)
    await expect.poll(() => activeSrc(page)).toMatch(/\/3\.mp3$/)
    await player(page).getByRole('button', { name: 'Dayandır' }).click()
    await expect(player(page).getByRole('button', { name: 'Davam et' })).toBeVisible()
    expect(await activeSrc(page)).toBe('')
    // Vurğu fasilədə qalır (cari ayə)
    await expect(card(page, 3)).toHaveClass(/is-playing/)
    await player(page).getByRole('button', { name: 'Davam et' }).click()
    await expect.poll(() => activeSrc(page)).toMatch(/\/3\.mp3$/)
    await player(page).getByRole('button', { name: 'Növbəti ayə' }).click()
    await expect(card(page, 4)).toHaveClass(/is-playing/)
    await player(page).getByRole('button', { name: 'Əvvəlki ayə' }).click()
    await expect(card(page, 3)).toHaveClass(/is-playing/)
    await player(page).getByRole('button', { name: 'Dinləməni bitir' }).click()
    await expect(page.locator('.ayah-card.is-playing')).toHaveCount(0)
    expectCleanConsole(consoleProblems)
  })

  test('təkrar rejimi: hər ayə 3 dəfə, sonra növbəti; seçim yadda qalır', async ({ page, consoleProblems }) => {
    await openFatiha(page)
    const panel = await openSettings(page)
    await panel.getByRole('button', { name: '3 dəfə' }).click()
    await expect(panel.getByRole('button', { name: '3 dəfə' })).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Escape')
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('quran_audio')).repeat)).toBe(3)

    await player(page).getByRole('button', { name: 'Surəni dinlə' }).click()
    await expect(player(page).locator('.qpl__badge')).toHaveText('1/3')
    await end(page)
    await expect(player(page).locator('.qpl__badge')).toHaveText('2/3')
    await expect(card(page, 1)).toHaveClass(/is-playing/)
    await end(page)
    await expect(player(page).locator('.qpl__badge')).toHaveText('3/3')
    await end(page)
    await expect(card(page, 2)).toHaveClass(/is-playing/)
    await expect(player(page).locator('.qpl__badge')).toHaveText('1/3')
    const plays = await page.evaluate(() => window.__audio.log.filter(x => /\/1\.mp3$/.test(x.src)).length)
    expect(plays).toBe(3)
    expectCleanConsole(consoleProblems)
  })

  test('A–B aralığı: 3–5 dövrə ilə təkrarlanır', async ({ page, consoleProblems }) => {
    await openFatiha(page)
    const panel = await openSettings(page)
    await panel.getByRole('spinbutton', { name: 'Başlanğıc' }).fill('3')
    await panel.getByRole('spinbutton', { name: 'Son' }).fill('5')
    await page.keyboard.press('Escape')
    await expect(player(page).locator('.qpl__badge--range')).toHaveText('3–5')
    await player(page).getByRole('button', { name: 'Surəni dinlə' }).click()
    await expect(card(page, 3)).toHaveClass(/is-playing/)
    await end(page); await expect(card(page, 4)).toHaveClass(/is-playing/)
    await end(page); await expect(card(page, 5)).toHaveClass(/is-playing/)
    await end(page); await expect(card(page, 3)).toHaveClass(/is-playing/)
    expectCleanConsole(consoleProblems)
  })

  test('sürət: 1,25× tətbiq olunur və yadda qalır', async ({ page, consoleProblems }) => {
    await openFatiha(page)
    const panel = await openSettings(page)
    await panel.getByRole('button', { name: '1,25×' }).click()
    await expect(panel.getByRole('button', { name: '1,25×' })).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Escape')
    await player(page).getByRole('button', { name: 'Surəni dinlə' }).click()
    await expect.poll(() => page.evaluate(() => window.__audio.active()?.rate)).toBe(1.25)
    await end(page)
    await expect.poll(() => page.evaluate(() => window.__audio.active()?.rate)).toBe(1.25)
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('quran_audio')).rate)).toBe(1.25)
    // Oynayarkən dəyişmə dərhal tətbiq olunur
    const p2 = await openSettings(page)
    await p2.getByRole('button', { name: '0,75×' }).click()
    await expect.poll(() => page.evaluate(() => window.__audio.active()?.rate)).toBe(0.75)
    expectCleanConsole(consoleProblems)
  })

  test('klaviatura: boşluq — oynat/dayandır, ←/→ — ayə', async ({ page, consoleProblems }) => {
    await openFatiha(page)
    await page.locator('.reader-arabic').click()   // fokus düymədə olmasın
    await page.keyboard.press('Space')
    await expect(card(page, 1)).toHaveClass(/is-playing/)
    await expect.poll(() => activeSrc(page)).toMatch(/\/1\.mp3$/)
    await page.keyboard.press('ArrowRight')
    await expect(card(page, 2)).toHaveClass(/is-playing/)
    await page.keyboard.press('ArrowRight')
    await expect(card(page, 3)).toHaveClass(/is-playing/)
    await page.keyboard.press('ArrowLeft')
    await expect(card(page, 2)).toHaveClass(/is-playing/)
    await page.keyboard.press('Space')
    await expect(player(page).getByRole('button', { name: 'Davam et' })).toBeVisible()
    expect(await activeSrc(page)).toBe('')
    // Yazı sahəsində boşluq oynatmır
    await page.getByRole('button', { name: 'Ayəyə keç' }).click()
    await page.getByRole('spinbutton', { name: 'Ayənin nömrəsi' }).press('Space')
    expect(await activeSrc(page)).toBe('')
    expectCleanConsole(consoleProblems)
  })

  test('ərəbcədə (RTL) ← növbəti ayədir', async ({ page, consoleProblems }) => {
    await openFatiha(page, '/ar/quran?s=1')
    await page.locator('.reader-arabic').click()
    await page.keyboard.press('Space')
    await expect(card(page, 1)).toHaveClass(/is-playing/)
    await page.keyboard.press('ArrowLeft')
    await expect(card(page, 2)).toHaveClass(/is-playing/)
    await page.keyboard.press('ArrowRight')
    await expect(card(page, 1)).toHaveClass(/is-playing/)
    await expect(player(page).getByRole('button', { name: 'إيقاف مؤقت' })).toBeVisible()
    expectCleanConsole(consoleProblems)
  })

  test('fayl yüklənmir → ehtiyat mənbələr → dürüst xəta → "Yenidən cəhd et"', async ({ page, consoleProblems }) => {
    await openFatiha(page)
    await player(page).getByRole('button', { name: 'Surəni dinlə' }).click()
    await expect.poll(() => activeSrc(page)).toBe('https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3')
    await page.evaluate(() => window.__audio.fail())
    await expect.poll(() => activeSrc(page)).toBe('https://verses.quran.com/Alafasy/mp3/001001.mp3')
    await page.evaluate(() => window.__audio.fail())
    await expect.poll(() => activeSrc(page)).toBe('https://cdn.islamic.network/quran/audio/64/ar.alafasy/1.mp3')
    await page.evaluate(() => window.__audio.fail())
    const alert = player(page).getByRole('alert')
    await expect(alert).toContainText('Səs faylı yüklənmədi')
    expect(await activeSrc(page)).toBe('')
    await alert.getByRole('button', { name: 'Yenidən cəhd et' }).click()
    await expect(alert).toHaveCount(0)
    await expect.poll(() => activeSrc(page)).toBe('https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3')
    await expect(card(page, 1)).toHaveClass(/is-playing/)
    expectCleanConsole(consoleProblems)
  })

  test('şəbəkə yoxdur → "İnternet bağlantısı yoxdur"', async ({ page, context, consoleProblems }) => {
    await openFatiha(page)
    await player(page).getByRole('button', { name: 'Surəni dinlə' }).click()
    await expect.poll(() => activeSrc(page)).toMatch(/\/1\.mp3$/)
    await context.setOffline(true)
    await page.evaluate(() => { window.__audio.fail(); window.__audio.fail(); window.__audio.fail() })
    await expect(player(page).getByRole('alert')).toContainText('İnternet bağlantısı yoxdur')
    await context.setOffline(false)
    // Oflayn anında arxa planda gec yüklənən hissələrin (bildiriş, elan —
    // idle-dan sonra) sorğuları "ERR_INTERNET_DISCONNECTED" yazır: bu, testin
    // özünün yaratdığı gözlənilən haldır (sayt bağlantı qayıdanda onları yükləyir)
    expectCleanConsole(consoleProblems.filter((m) => !m.includes('ERR_INTERNET_DISCONNECTED')))
  })

  test('Media Session: başlıq surə + ayə, ifaçı qari, düymələr işləyir', async ({ page, consoleProblems }) => {
    await openFatiha(page)
    test.skip(!(await page.evaluate(() => 'mediaSession' in navigator && typeof MediaMetadata === 'function')), 'Media Session yoxdur')
    await player(page).getByRole('button', { name: 'Surəni dinlə' }).click()
    await expect(card(page, 1)).toHaveClass(/is-playing/)
    const meta = await page.evaluate(() => {
      const m = navigator.mediaSession.metadata
      return { title: m?.title, artist: m?.artist, album: m?.album, art: m?.artwork?.[0]?.src, state: navigator.mediaSession.playbackState }
    })
    expect(meta.title).toBe('Fatihə, 1-ci ayə')
    expect(meta.artist).toBe('Mişari Raşid əl-Əfasi')
    expect(meta.album).toBe('Qurani-Kərim')
    expect(meta.art).toContain('/android-chrome-512x512.png?v=2')
    expect(meta.state).toBe('playing')
    await end(page)
    await expect.poll(() => page.evaluate(() => navigator.mediaSession.metadata?.title)).toBe('Fatihə, 2-ci ayə')
    expectCleanConsole(consoleProblems)
  })

  test('"Surə bitəndə növbətisinə keç": 1-ci surənin sonunda 2-ci surə 1-ci ayədən oxunur', async ({ page, consoleProblems }) => {
    await page.route(/api\.alquran\.cloud\/v1\/surah\/2\/editions\//, route => {
      const eds = decodeURIComponent(route.request().url().split('/editions/')[1].split('?')[0]).split(',')
      route.fulfill({ json: { code: 200, status: 'OK', data: eds.map(identifier => ({
        number: 2, name: 'سُورَةُ البَقَرَةِ', englishName: 'Al-Baqara', englishNameTranslation: 'The Cow',
        numberOfAyahs: 3, revelationType: 'Medinan',
        ayahs: [1, 2, 3].map(i => ({ number: 7 + i, numberInSurah: i, juz: 1, page: 2, text: `[test ${identifier} ${i}]` })),
        edition: { identifier, language: identifier.split('.')[0], type: identifier.startsWith('ar.') ? 'quran' : 'translation', format: 'text' },
      })) } })
    })
    await openFatiha(page)
    const panel = await openSettings(page)
    await panel.getByText('Surə bitəndə növbətisinə keç').click()
    await page.keyboard.press('Escape')
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('quran_audio')).autoNext)).toBe(true)
    await player(page).getByRole('button', { name: 'Surəni dinlə' }).click()
    for (let n = 1; n <= 7; n++) {
      await expect(card(page, n)).toHaveClass(/is-playing/)
      await end(page)
    }
    await expect(page).toHaveURL(/\/quran\/2-al-baqara$/)
    await expect(card(page, 1)).toHaveClass(/is-playing/)
    // Bəqərənin 1-ci ayəsi — Quranda 8-ci ayə
    await expect.poll(() => activeSrc(page)).toMatch(/\/ar\.alafasy\/8\.mp3$/)
    expectCleanConsole(consoleProblems)
  })

  test('dil dəyişəndə oxuyucu açıq qalır, pleyer işləyir', async ({ page, consoleProblems }) => {
    await openFatiha(page)
    await player(page).getByRole('button', { name: 'Surəni dinlə' }).click()
    await expect(card(page, 1)).toHaveClass(/is-playing/)
    await page.goto('/en/quran/1-al-faatiha')
    await settle(page)
    await expect(card(page, 7)).toBeVisible()
    await expect(player(page).getByRole('button', { name: 'Listen to the surah' })).toBeVisible()
    expectCleanConsole(consoleProblems)
  })
})

// ── Real oynatma: .mp3 sorğusu → 0.3 s səssiz WAV ──
function silentWav(seconds = 0.3, rate = 8000) {
  const n = Math.round(seconds * rate)
  const b = Buffer.alloc(44 + n * 2)
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8)
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22)
  b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34)
  b.write('data', 36); b.writeUInt32LE(n * 2, 40)
  return b
}

test('real səs: ayələr özü-özünə bir-birinin ardınca oxunur', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  const wav = silentWav(1)
  const hits = []
  await page.route(/\.(mp3)(\?|$)/, route => { hits.push(route.request().url()); route.fulfill({ status: 200, contentType: 'audio/wav', body: wav }) })
  await openFatiha(page)
  await player(page).getByRole('button', { name: 'Surəni dinlə' }).click()
  await expect(card(page, 1)).toHaveClass(/is-playing/)
  // Ayə bitir → növbəti özü başlayır (əvvəlcədən yüklənmiş elementdən)
  await expect(card(page, 2)).toHaveClass(/is-playing/, { timeout: 10_000 })
  await expect(card(page, 1)).not.toHaveClass(/is-playing/)
  // Surənin sonu — pleyer dayanır
  await expect(player(page).getByRole('button', { name: 'Surəni dinlə' })).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('.ayah-card.is-playing')).toHaveCount(0)
  // Hər ayə bir dəfə və sıra ilə yükləndi (növbəti əvvəlcədən — təkrar sorğu yoxdur)
  const order = hits.map(u => Number(u.match(/\/(\d+)\.mp3$/)[1]))
  expect(order).toEqual([1, 2, 3, 4, 5, 6, 7])
  expectCleanConsole(consoleProblems)
})
