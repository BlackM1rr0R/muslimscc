// ═══════════════════════════════════════════════════════
// /analytics v6 — bento panel (components/viz v2: KpiCard, AreaChart, LineChart,
// CalendarHeatmap, RadialBars, FunnelChart, SegmentBreakdown, MiniTable, ActivityFeed, CompareBars)
//   • yalnız bu cihazın qeydlərindən: KPI, nəticə cümləsi, lent
//   • dövr seçimi (7/30/90/il) və "Əməllər / Zikr" rejimi
//   • qrafik klaviatura ilə: ←/→ izah qutusu, ekran oxuyucu üçün canlı mətn
//   • axe: işıqlı / qaranlıq / ərəbcə — ciddi pozuntu yoxdur
// ═══════════════════════════════════════════════════════
import AxeBuilder from '@axe-core/playwright'
import { test, expect, settle } from './fixtures.js'

function seed() {
  const key = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
  const stats = {}, tracker = {}, dhikr = {}
  // bu həftə: 6 gün × 5 namaz; keçən həftə: 3 gün × 5 namaz
  for (const i of [0, 1, 2, 3, 4, 5, 8, 9, 10]) for (const p of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) stats[`${key(i)}_${p}`] = true
  for (let i = 0; i < 6; i++) { tracker[key(i)] = { morning: true }; dhikr[key(i)] = 100 }
  localStorage.setItem('muslim_cc_prayer_stats', JSON.stringify(stats))
  localStorage.setItem('daily_tracker', JSON.stringify(tracker))
  localStorage.setItem('dhikr_daily_v1', JSON.stringify(dhikr))
  localStorage.setItem('quran_stats', JSON.stringify({ reads: {}, sessions: 2, dates: [key(0), key(1)] }))
  localStorage.setItem('dhikr_session', JSON.stringify({ count: 0, selIdx: 0, log: [{ id: Date.now() - 7 * 60e3, idx: 0, name: 'SubhanAllah', count: 33, time: '' }] }))
}

async function serious(page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')}`))
}

test('panel: KPI, nəticə cümləsi, dövr və rejim seçimi', async ({ page }) => {
  await page.addInitScript(seed)
  await page.goto('/analytics')
  await settle(page)
  // bu həftə 30+6+6+2 = 44 əməl, keçən həftə 15 → "… çox …"
  await expect(page.getByTestId('an-insight')).toContainText('çox')
  const kpi = page.locator('.vz-kpi').first()
  await expect(kpi.locator('.vz-kpi__value')).toHaveText('45')
  // əvvəlki 30 gündə qeyd yoxdur → faiz göstərilmir (sonsuz faiz yox), yalnız izah
  await expect(kpi.locator('.vz-delta')).toHaveCount(0)
  // dövr: 7 gün → namaz 30, əvvəlki 7 gündə 15 → ↑ 100%
  await page.getByRole('radiogroup', { name: 'Dövr' }).getByRole('radio', { name: '7 gün' }).click()
  await expect(kpi.locator('.vz-kpi__value')).toHaveText('30')
  await expect(kpi.locator('.vz-delta')).toContainText('100%')
  // rejim: Zikr → xətt qrafiki + ştrixli əvvəlki dövr
  await page.getByRole('radiogroup', { name: 'Göstərici' }).getByRole('radio', { name: 'Zikr' }).click()
  await expect(page.locator('#an-chart .vz-line--compare')).toHaveCount(1)
  // lent: dəqiq vaxtlı zikr hadisəsi
  await expect(page.locator('.vz-feed__item').first()).toContainText('7 dəq. əvvəl')
})

test('qrafik klaviatura ilə: ←/→ izah qutusunu gəzdirir', async ({ page }) => {
  await page.addInitScript(seed)
  await page.goto('/analytics')
  await settle(page)
  const plot = page.locator('#an-chart .vz-xy__plot')
  await plot.focus()
  await expect(page.locator('#an-chart .vz-tip')).toBeVisible()
  const first = await page.locator('#an-chart .vz-tip__title').innerText()
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('#an-chart .vz-tip__title')).not.toHaveText(first)
  await page.keyboard.press('Escape')
  await expect(page.locator('#an-chart .vz-tip')).toHaveCount(0)
})

for (const [name, url, theme] of [['işıqlı', '/analytics', 'light'], ['qaranlıq', '/analytics', 'dark'], ['ərəbcə', '/ar/analytics', 'light']]) {
  test(`axe (${name}): ciddi pozuntu yoxdur`, async ({ page }) => {
    await page.addInitScript(seed)
    await page.addInitScript((t) => localStorage.setItem('muslim_cc_theme', t), theme)
    await page.goto(url)
    await settle(page)
    await expect(page.locator('.vz-kpi')).toHaveCount(4)
    expect(await serious(page)).toEqual([])
  })
}
