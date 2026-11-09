// ═══════════════════════════════════════════════════════
// Admin icmal paneli (DashboardOverview, viz v2) + ana səhifədəki "Mənim həftəm"
// Admin API-si SAXTADIR (adminAuth.js + adminOverviewData.js) — yalnız UI axını.
// • salam + nəticə cümləsi, 8 KPI, trafik qrafiki, cədvəl, lent, ölçülər
// • dövr seçimi (7/30/90) → /api/admin/analytics?…&compare=1 yeni aralıqla
// • mənbə alınmayanda: xəbərdarlıq + "Yüklənmədi" (rəqəm uydurulmur)
// • axe: ciddi pozuntu yoxdur
// • "Mənim həftəm" — localStorage-da qeyd varsa görünür, yoxdursa render olunmur
// ═══════════════════════════════════════════════════════
import AxeBuilder from '@axe-core/playwright'
import { test, expect, settle } from './fixtures.js'
import { fakeAdminSession, adminSignIn } from './adminAuth.js'
import { mockOverviewApi } from './adminOverviewData.js'

async function openDashboard(page, opts) {
  await fakeAdminSession(page, 'admin')
  const api = await mockOverviewApi(page, opts)
  await page.goto('/admin')
  await adminSignIn(page)
  await expect(page.locator('.ado-bento')).toBeVisible()
  return api
}

test.describe('admin icmal paneli', () => {
  test('KPI, qrafik, cədvəl, lent — API məlumatı ilə', async ({ page }) => {
    const api = await openDashboard(page)
    await expect(page.getByRole('heading', { level: 1, name: 'İdarə paneli' })).toBeVisible()
    await expect(page.getByTestId('ado-insight')).toContainText('3 açıq səhv bildirişi')
    const kpis = page.locator('.ado-bento > .vz-kpi')
    await expect(kpis).toHaveCount(8)
    await expect(kpis.filter({ hasText: 'Bildiriş abunəçisi' })).toContainText('1 287')
    await expect(kpis.filter({ hasText: 'Açıq səhv bildirişi' })).toContainText('3')
    await expect(kpis.filter({ hasText: 'Brauzer xətası' })).toContainText('14')
    await expect(page.locator('#ado-traffic svg').first()).toBeVisible()
    await expect(page.locator('#ado-pages tbody tr')).toHaveCount(8)
    await expect(page.locator('#ado-pages tbody tr').first()).toContainText('Ana səhifə')
    await expect(page.locator('#ado-feed .vz-feed__item').first()).toContainText('Yeni səhv bildirişi: mənbə')
    await expect(page.locator('#ado-langs')).toContainText('Azərbaycan dili')
    expect(api.requests.some(r => r.startsWith('/api/admin/analytics?') && r.includes('compare=1'))).toBe(true)

    // Dövr: 7 gün → yeni aralıq
    await page.locator('#ado-traffic').getByRole('radio', { name: '7 gün' }).click()
    await expect.poll(() => api.requests.filter(r => r.startsWith('/api/admin/analytics')).length).toBeGreaterThan(1)
    const last = new URL('http://x' + api.requests.filter(r => r.startsWith('/api/admin/analytics')).at(-1))
    const span = (Date.parse(last.searchParams.get('to')) - Date.parse(last.searchParams.get('from'))) / 864e5 + 1
    expect(span).toBe(7)
    await expect(page.locator('#ado-traffic')).toContainText('son 7 gün')

    // KPI → bölmə
    await kpis.filter({ hasText: 'Açıq səhv bildirişi' }).click()
    await expect(page.locator('.admin-nav-btn[aria-current="page"]')).toContainText('Səhv bildirişləri')
  })

  test('mənbə alınmayanda — xəbərdarlıq, saxta rəqəm yox', async ({ page }) => {
    await openDashboard(page, { failing: ['analytics', 'errors'] })
    await expect(page.locator('.ado .admin-alert')).toContainText('statistika')
    await expect(page.locator('#ado-traffic')).toContainText('Yüklənmədi')
    await expect(page.locator('.ado-bento > .vz-kpi').filter({ hasText: 'Baxış (bu gün)' })).toContainText('—')
    // Qalan mənbələr göstərilir
    await expect(page.locator('.ado-bento > .vz-kpi').filter({ hasText: 'Bildiriş abunəçisi' })).toContainText('1 287')
  })

  test('axe: ciddi pozuntu yoxdur', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'masaüstü kifayətdir')
    await openDashboard(page)
    await settle(page)
    // Yüklənmə bitsin (is-busy solğunluğu) və giriş animasiyası (admin-fade) sönsün
    await expect(page.locator('.ado')).not.toHaveAttribute('aria-busy', 'true')
    await page.waitForTimeout(1200)
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze()
    expect(violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
      .flatMap(v => v.nodes.map(n => `${v.id} · ${n.target.join(' ')}`))).toEqual([])
  })
})

test.describe('ana səhifə: Mənim həftəm', () => {
  test('qeyd varsa — 4 KPI və statistika keçidi', async ({ page }) => {
    await page.addInitScript(() => {
      const d = new Date()
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      localStorage.setItem('muslim_cc_prayer_stats', JSON.stringify({ [`${k}_Fajr`]: true, [`${k}_Dhuhr`]: true }))
      localStorage.setItem('dhikr_daily_v1', JSON.stringify({ [k]: 33 }))
    })
    await page.goto('/')
    const week = page.getByTestId('my-week')
    await week.scrollIntoViewIfNeeded()
    await expect(week).toBeVisible({ timeout: 15000 })
    await expect(week.locator('.vz-kpi')).toHaveCount(4)
    await expect(week.locator('.vz-kpi').first()).toContainText('2')
    await expect(week.getByRole('link', { name: /Ətraflı statistika/ })).toHaveAttribute('href', '/analytics')
  })

  test('qeyd yoxdursa — zolaq yoxdur', async ({ page }) => {
    await page.goto('/')
    const md = page.locator('.vx-md')
    await md.scrollIntoViewIfNeeded()
    await expect(md.locator('.vx-md-grid')).toBeVisible({ timeout: 15000 })
    await page.waitForTimeout(800)
    await expect(page.getByTestId('my-week')).toHaveCount(0)
  })
})
