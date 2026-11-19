// Səsli oxu (components/ListenButton.jsx): Quran ərəbcəsi HEÇ VAXT maşın səsi ilə oxunmur —
// ayə blokundan yalnız tərcümə + "Quran 4:103"; ərəbcə olmayan interfeysdə digər ərəb blokları da atlanır.
// İndi oxunan blok .lb-reading ilə işarələnir.
import { test, expect, settle } from './fixtures.js'

// Nitq sintezi saxtası: ingiliscə və ərəbcə səs var (ərəb səsi olsa da Quran oxunmamalıdır)
const FAKE_SPEECH = () => {
  window.__spoken = []
  const voices = [
    { lang: 'en-US', localService: true, name: 'EN', default: true, voiceURI: 'en' },
    { lang: 'ar-SA', localService: true, name: 'AR', default: false, voiceURI: 'ar' },
  ]
  const fake = {
    getVoices: () => voices,
    speak: (u) => { window.__spoken.push(u.text); if (window.__spoken.length === 1) setTimeout(() => u.onstart?.(), 0) },
    cancel: () => {}, pause: () => {}, resume: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    speaking: false, pending: false, paused: false,
  }
  try { Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true }) } catch { /* */ }
  if (typeof window.SpeechSynthesisUtterance !== 'function') window.SpeechSynthesisUtterance = function (text) { this.text = text }
}

test('dərsin səsli oxusu: Quran ərəbcəsi oxunmur, ayənin yalnız tərcüməsi və istinadı', async ({ page }) => {
  await page.addInitScript(FAKE_SPEECH)
  await page.goto('/en/learn/adhkar-after-salah')
  await settle(page)
  await page.locator('.lb-root').getByRole('button', { name: 'Listen' }).click()
  await expect.poll(() => page.evaluate(() => window.__spoken.length)).toBeGreaterThan(3)
  const spoken = await page.evaluate(() => window.__spoken)
  // Heç bir hissədə ərəb hərfi yoxdur
  expect(spoken.filter(x => /[؀-ۿ]/.test(x))).toEqual([])
  expect(spoken.some(x => x.startsWith('Quran 4:103.'))).toBe(true)
  await expect(page.locator('.lb-reading')).toHaveCount(1)
})
