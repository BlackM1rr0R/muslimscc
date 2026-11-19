// ═══════════════════════════════════════════════════════
// "Yolda" rejimi (/on-the-road) və "Quranla diqqət seansı" (/focus)
//   • yolda: təhlükəsizlik qeydi, 4 iri kafel (≥ 72px), zikr sayı yadda qalır, geri → kafelə fokus;
//     növbəti namaza geri sayım; "Səslə de" yalnız UI faktı deyir (Quran heç vaxt TTS deyil);
//     namaza 10 dəq qalmış xatırlatma (saat idarəsi); "davam et" Quran əlfəcinindən; qiblə bucağı
//   • diqqət: 5 dəq diqqət → fasilədə ayə (saytın Quran mənbəyi — fixtures.js "s:a" saxtası), keçid və
//     dinlə düyməsi → fasilə bitir, günün sayı 1; pauza/davam/sıfırla; təsadüfi rejim
//   • axe (açıq + tünd), ərəbcə RTL, 360px-də üfüqi daşma yoxdur
// Şəbəkə: yeni endpoint YOXDUR — aladhan, alquran "s:a" fixtures.js-də saxtadır, mp3 kəsilir.
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole, azTimes } from './fixtures.js'

async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  for (const sel of include) b = b.include(sel)
  const { violations } = await b.analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 120)}`))
}
const store = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), key)

// Nitq sintezi saxtası: ingiliscə səs var, deyilənlər window.__spoken-ə yazılır
const FAKE_SPEECH = () => {
  window.__spoken = []
  const fake = {
    getVoices: () => [{ lang: 'en-US', localService: true, name: 'Test voice', default: true, voiceURI: 'test' }],
    speak: (u) => { window.__spoken.push(u.text) },
    cancel: () => {}, pause: () => {}, resume: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    speaking: false, pending: false, paused: false,
  }
  try { Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true }) } catch { /* */ }
  if (typeof window.SpeechSynthesisUtterance !== 'function') window.SpeechSynthesisUtterance = function (text) { this.text = text }
}

// Səs elementi saxtası (quran-audio.spec.js ilə eyni yanaşma): şəbəkə/dekoder yoxdur, play() → "playing"
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

// ── 1. Yolda: əsaslar ──
test('yolda: təhlükəsizlik qeydi, iri kafellər, zikr sayı yadda qalır, geri → kafelə fokus', async ({ page, consoleProblems }) => {
  await page.goto('/en/on-the-road')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('On the road')
  await expect(page.getByTestId('road-safety')).toHaveText(/Set it up before driving\. Don’t use it while driving\./)
  const tiles = page.locator('.road-tile')
  await expect(tiles).toHaveCount(4)
  for (const box of await tiles.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))) expect(box).toBeGreaterThanOrEqual(72)
  // tünd ekran susmaya görə
  await expect(page.getByTestId('road-screen')).toHaveClass(/road--dark/)

  await page.locator('[data-tile="dhikr"]').click()
  await expect(page.getByRole('heading', { level: 2, name: 'Dhikr' })).toBeFocused()
  const tap = page.getByTestId('road-tap')
  expect((await tap.boundingBox()).height).toBeGreaterThanOrEqual(200)
  for (let i = 0; i < 3; i++) await tap.click()
  await expect(tap.locator('.road-tap__count')).toHaveText('3')
  await expect(tap).toHaveAccessibleName(/^Tap to count: SubhanAllah — 3 of 33$/)
  await expect(page.locator('.road-dhikr')).toContainText('Source: Muslim 223')
  expect((await store(page, 'road_mode_v1')).c).toBe(3)

  await page.getByRole('button', { name: 'Next dhikr' }).click()
  await expect(tap.locator('.road-tap__count')).toHaveText('0')
  await page.getByRole('button', { name: 'Previous dhikr' }).click()

  await page.reload()
  await settle(page)
  await page.locator('[data-tile="dhikr"]').click()
  await expect(page.getByTestId('road-tap').locator('.road-tap__count')).toHaveText('0')
  await page.getByTestId('road-tap').click()
  await expect(page.getByTestId('road-tap').locator('.road-tap__count')).toHaveText('1')

  await page.locator('.road-btn--back').click()
  await expect(page.locator('[data-tile="dhikr"]')).toBeFocused()

  // xatırlatma seçimi
  await page.getByRole('button', { name: '15 min before' }).click()
  await expect(page.getByRole('button', { name: '15 min before' })).toHaveAttribute('aria-pressed', 'true')
  expect((await store(page, 'road_mode_v1')).remind).toBe(15)
  // açıq ekran
  await page.getByRole('button', { name: 'Light screen' }).click()
  await expect(page.getByTestId('road-screen')).toHaveClass(/road--light/)
  expectCleanConsole(consoleProblems)
})

// ── 2. Namaz + səsli faktlar ──
test('yolda: növbəti namaza geri sayım; "Səslə de" yalnız UI faktı, Quran TTS ilə oxunmur', async ({ page, consoleProblems }) => {
  await page.addInitScript(FAKE_SPEECH)
  await page.addInitScript(STUB_MEDIA)
  await page.goto('/en/on-the-road')
  await settle(page)
  const speak = page.getByTestId('road-speak')
  await expect(speak).toBeEnabled()
  await speak.click()
  await expect(speak).toHaveAttribute('aria-pressed', 'true')

  await page.locator('[data-tile="prayer"]').click()
  const cd = page.getByTestId('road-countdown')
  await expect(cd).toHaveText(/^\d{1,2}:\d{2}(:\d{2})?$/)
  await expect(cd).toHaveAttribute('role', 'timer')
  await expect(page.locator('.road-prayer__name')).toHaveText(/^(Fajr|Dhuhr|Asr|Maghrib|Isha)$/)
  await page.getByRole('button', { name: 'Say it aloud' }).click()
  await expect.poll(() => page.evaluate(() => window.__spoken.slice())).toHaveLength(1)
  const [line] = await page.evaluate(() => window.__spoken)
  expect(line).toMatch(/^(Fajr|Dhuhr|Asr|Maghrib|Isha) (in 1 minute|in \d+ minutes|adhan at \d{2}:\d{2})$/)

  // Quran — həqiqi qiraət (mp3), nitq sintezi çağırılmır
  await page.locator('.road-btn--back').click()
  await page.locator('[data-tile="quran"]').click()
  await page.getByTestId('road-play').click()
  await expect(page.getByTestId('road-play')).toHaveAccessibleName('Pause')
  expect((await page.evaluate(() => window.__played))[0]).toMatch(/^https:\/\/cdn\.islamic\.network\/quran\/audio\/.+\.mp3$/)
  expect(await page.evaluate(() => window.__spoken.length)).toBe(1)
  // Zikr sayğacı da (ərəbcə zikr mətni ekrandadır) heç nə səsləndirmir; ərəb hərfi heç vaxt TTS-ə getmir
  await page.locator('.road-btn--back').click()
  await page.locator('[data-tile="dhikr"]').click()
  await page.getByTestId('road-tap').click()
  await page.getByRole('button', { name: 'Next dhikr' }).click()
  const spoken = await page.evaluate(() => window.__spoken)
  expect(spoken).toHaveLength(1)
  expect(spoken.filter((x) => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFC]/.test(x))).toEqual([])
  expectCleanConsole(consoleProblems)
})

// ── 3. Xatırlatma (saat idarəsi) ──
test('yolda: məğribə 10 dəqiqə qalmış yumşaq xatırlatma (bir dəfə)', async ({ page, consoleProblems }) => {
  const day = new Date('2026-11-19T08:00:00Z')
  const [h, m] = azTimes(day).maghrib.split(':').map(Number)
  // Bakı UTC+4: məğribdən 10 dəq 30 san əvvəl
  const start = Date.UTC(2026, 10, 19, h - 4, m) - (10 * 60 + 30) * 1000
  await page.clock.install({ time: new Date(start) })
  await page.addInitScript(FAKE_SPEECH)
  await page.addInitScript(() => localStorage.setItem('road_mode_v1', JSON.stringify({ remind: 10, speak: true })))
  await page.goto('/en/on-the-road')
  await settle(page)
  await expect(page.locator('.road-notice')).toHaveCount(0)
  await page.clock.fastForward(60_000)
  await page.clock.runFor(16_000)
  await expect(page.locator('.road-notice')).toContainText('Maghrib in 10 minutes')
  await page.clock.runFor(2_000)
  await expect.poll(() => page.evaluate(() => window.__spoken.slice())).toEqual(['Maghrib in 10 minutes'])
  await page.getByRole('button', { name: 'Dismiss' }).click()
  await expect(page.locator('.road-notice')).toHaveCount(0)
  // təkrar gəlmir
  await page.clock.runFor(31_000)
  await expect(page.locator('.road-notice')).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

// ── 4. Quran: davam et + qiblə ──
test('yolda: Quran əlfəcindən davam, surə seçimi; qiblə bucağı və "əvvəlcə dayanın"', async ({ page, consoleProblems }) => {
  await page.addInitScript(STUB_MEDIA)
  await page.addInitScript(() => {
    localStorage.setItem('quran_bookmark', JSON.stringify({ surah: 36, ayah: 12, name: 'Ya-Sin', time: 1 }))
    // sevimli qari (utils/quranAudio → readAudioPrefs().reciter)
    localStorage.setItem('quran_audio', JSON.stringify({ reciter: 'husary', rate: 1, repeat: 1, autoNext: false }))
  })
  await page.goto('/en/on-the-road')
  await settle(page)
  await page.locator('[data-tile="quran"]').click()
  await expect(page.getByTestId('road-surah')).toHaveValue('36')
  await expect(page.locator('.road-quran')).toContainText('Verse 12 of 83')
  await expect(page.locator('.road-quran')).toContainText(/Continue: .+, verse 12/)
  await expect(page.getByTestId('road-play')).toHaveAccessibleName('Play')
  for (const name of ['Previous verse', 'Next verse']) {
    const b = await page.getByRole('button', { name }).boundingBox()
    expect(b.width).toBeGreaterThanOrEqual(72)
  }
  await page.getByRole('button', { name: 'Next verse' }).click()
  await expect(page.locator('.road-quran')).toContainText('Verse 13 of 83')
  await expect(page.locator('.road-reciter')).toContainText('Mahmoud Khalil Al-Husary')
  await page.getByTestId('road-play').click()
  await expect(page.getByTestId('road-play')).toHaveAccessibleName('Pause')
  // Yasin 13 — ümumi ayə nömrəsi 3718; qari — sevimli (əl-Husari)
  expect((await page.evaluate(() => window.__played))[0]).toBe('https://cdn.islamic.network/quran/audio/128/ar.husary/3718.mp3')
  await page.getByRole('button', { name: 'Next verse' }).click()
  await expect(page.locator('.road-quran')).toContainText('Verse 14 of 83')
  expect(await store(page, 'road_mode_v1')).toMatchObject({ s: 36, a: 14 })
  await page.getByTestId('road-play').click()
  await expect(page.getByTestId('road-play')).toHaveAccessibleName('Play')
  await page.getByTestId('road-surah').selectOption('1')
  await expect(page.locator('.road-quran')).toContainText('Verse 1 of 7')
  expect(await store(page, 'road_mode_v1')).toMatchObject({ s: 1, a: 1 })
  await expect(page.locator('.road-reciter')).toContainText('Reciter:')

  await page.locator('.road-btn--back').click()
  await page.locator('[data-tile="qibla"]').click()
  await expect(page.locator('.road-qibla .road-safety')).toHaveText(/Stop safely first/)
  await expect(page.getByTestId('road-bearing')).toHaveText(/^\d{1,3}°$/)
  expectCleanConsole(consoleProblems)
})

// ── 5. Diqqət seansı: tam dövr ──
test('diqqət: 5 dəq diqqət → ayə fasiləsi (mənbədən, keçid, dinlə) → fasilə bitir, günün sayı 1', async ({ page, consoleProblems }) => {
  await page.clock.install({ time: new Date('2026-11-19T08:00:00Z') })
  await page.addInitScript(() => localStorage.setItem('focus_prefs_v1', JSON.stringify({ f: 5, b: 1, m: 'surah', s: 94, p: 5, snd: true })))
  await page.goto('/en/focus')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Focus session with the Quran')
  await expect(page.getByTestId('focus-time')).toHaveText('05:00')
  await expect(page.getByTestId('focus-today')).toHaveText('No focus sessions completed today yet')
  await expect(page.getByTestId('focus-min')).toHaveValue('5')

  await page.getByTestId('focus-start').click()
  await expect(page.getByTestId('focus-stage')).toHaveAttribute('data-status', 'running')
  await page.clock.runFor(2_000)
  await expect(page.getByTestId('focus-time')).toHaveText(/^04:5\d$/)
  await page.clock.fastForward(5 * 60_000)
  await page.clock.runFor(1_100)
  await expect(page.getByTestId('focus-stage')).toHaveAttribute('data-phase', 'break')
  const ayah = page.getByTestId('focus-ayah')
  await expect(ayah).toHaveAttribute('data-ref', '94:5')
  await expect(ayah.locator('.fx-ayah__ar')).toHaveText('[test 94:5 quran-uthmani]')
  await expect(ayah.locator('.fx-ayah__ar')).toHaveAttribute('dir', 'rtl')
  await expect(ayah.locator('.fx-ayah__tr')).toHaveText('[test 94:5 en.asad]')
  await expect(ayah.locator('.fx-ayah__src')).toHaveText('Translation: Test en.asad')
  await expect(ayah.getByRole('link', { name: 'Read in context' })).toHaveAttribute('href', /^\/en\/quran\/94-[a-z-]+\?a=5$/)
  await expect(ayah.getByRole('button', { name: /Listen to the verse — 94:5/ })).toBeVisible()
  await expect(page.getByTestId('focus-today')).toHaveText('1 focus session completed today')
  expect(await store(page, 'focus_done_v1')).toEqual({ '2026-11-19': 1 })
  expect((await store(page, 'focus_prefs_v1')).p).toBe(6)

  await page.clock.fastForward(60_000)
  await page.clock.runFor(1_100)
  await expect(page.getByTestId('focus-stage')).toHaveAttribute('data-phase', 'focus')
  await expect(page.getByTestId('focus-stage')).toHaveAttribute('data-status', 'idle')
  await expect(page.getByTestId('focus-ayah')).toHaveCount(0)
  await expect(page.getByTestId('focus-time')).toHaveText('05:00')
  await expect(page.getByTestId('focus-today')).toHaveText('1 focus session completed today')
  expectCleanConsole(consoleProblems)
})

test('diqqət: pauza, davam, sıfırla; ayarlar yadda qalır; təsadüfi rejimdə ayə saytın hovuzundan', async ({ page, consoleProblems }) => {
  await page.clock.install({ time: new Date('2026-11-19T08:00:00Z') })
  await page.goto('/en/focus')
  await settle(page)
  await expect(page.getByTestId('focus-time')).toHaveText('25:00')
  await page.getByTestId('focus-start').click()
  await page.clock.runFor(3_000)
  await page.getByRole('button', { name: 'Pause' }).click()
  await expect(page.getByTestId('focus-stage')).toHaveAttribute('data-status', 'paused')
  const paused = await page.getByTestId('focus-time').textContent()
  await page.clock.runFor(10_000)
  await expect(page.getByTestId('focus-time')).toHaveText(paused)
  await expect(page.getByTestId('focus-start')).toHaveText(/Resume/)
  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(page.getByTestId('focus-time')).toHaveText('25:00')

  await page.getByTestId('focus-min').selectOption('10')
  await page.getByTestId('break-min').selectOption('2')
  await expect(page.getByTestId('focus-time')).toHaveText('10:00')
  expect(await store(page, 'focus_prefs_v1')).toMatchObject({ f: 10, b: 2, m: 'random' })

  await page.getByTestId('focus-start').click()
  await page.clock.fastForward(10 * 60_000)
  await page.clock.runFor(1_100)
  await expect(page.getByTestId('focus-ayah')).toHaveAttribute('data-ref', /^\d{1,3}:\d{1,3}$/)
  await expect(page.getByTestId('focus-ayah').locator('.fx-ayah__ar')).toHaveText(/^\[test \d+:\d+ quran-uthmani\]$/)
  await page.getByRole('button', { name: 'End the break' }).click()
  await expect(page.getByTestId('focus-stage')).toHaveAttribute('data-phase', 'focus')
  await expect(page.getByTestId('focus-time')).toHaveText('10:00')
  expectCleanConsole(consoleProblems)
})

// ── 6. Əlçatanlıq: açıq + tünd; ərəbcə RTL ──
for (const theme of ['light', 'dark']) {
  test(`a11y (${theme}): yolda və diqqət, ərəbcə RTL`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.addInitScript((th) => localStorage.setItem('muslim_cc_theme', th), theme)
    for (const base of ['/en', '/ar']) {
      await page.goto(`${base}/on-the-road`)
      await settle(page)
      if (base === '/ar') await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
      expect(await serious(page, ['.road-page'])).toEqual([])
      for (const tile of ['dhikr', 'prayer', 'quran', 'qibla']) {
        await page.locator(`[data-tile="${tile}"]`).click()
        await expect(page.getByTestId(`road-panel-${tile}`)).toBeVisible()
        expect(await serious(page, ['.road-page']), `${base} ${tile}`).toEqual([])
        await page.locator('.road-btn--back').click()
      }
      await page.goto(`${base}/focus`)
      await settle(page)
      await expect(page.getByTestId('focus-start')).toBeEnabled()
      expect(await serious(page, ['.fx-page'])).toEqual([])
    }
  })
}

// ── 7. 360px: üfüqi daşma yoxdur ──
test('360px: yolda (hər panel) və diqqət səhifəsində üfüqi daşma yoxdur', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  const over = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  for (const base of ['/en', '/ar']) {
    await page.goto(`${base}/on-the-road`)
    await settle(page)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await over(), `${base} tiles`).toBeLessThanOrEqual(1)
    for (const tile of ['quran', 'dhikr', 'prayer', 'qibla']) {
      await page.locator(`[data-tile="${tile}"]`).click()
      await expect(page.getByTestId(`road-panel-${tile}`)).toBeVisible()
      expect(await over(), `${base} ${tile}`).toBeLessThanOrEqual(1)
      await page.locator('.road-btn--back').click()
    }
    await page.goto(`${base}/focus`)
    await settle(page)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await over(), `${base}/focus`).toBeLessThanOrEqual(1)
  }
})
