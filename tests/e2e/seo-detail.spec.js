// ═══════════════════════════════════════════════════════
// Detal səhifələri (Google-da ayrıca indekslənən URL-lər):
//   /quran/<n>-<slug>, /names/<n>-<slug>, /sahaba/<slug> — 5 dildə
//   • xam prerender HTML-də (JS-siz) h1, ərəbcə mətn, tərcümə, canonical, sxem
//   • tətbiqdə: düzgün surə / ad / səhabə açılır, səhv slug kanonik yola
//     düzəlir, naməlum nömrə → 404, daxili klik URL-i dəyişir, Geri işləyir
//   • sitemap indeksi və bölmə sitemap-ları
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

// Bəqərə üçün fikstür (fixtures.js hər surəni 1-ci nömrə ilə qaytarır)
function baqara(identifier) {
  return {
    number: 2, name: 'سُورَةُ البَقَرَةِ', englishName: 'Al-Baqara', englishNameTranslation: 'The Cow',
    numberOfAyahs: 7, revelationType: 'Medinan',
    ayahs: Array.from({ length: 7 }, (_, i) => ({ number: 7 + i + 1, numberInSurah: i + 1, juz: 1, page: 2, text: `[test ${identifier} ${i + 1}]` })),
    edition: { identifier, language: identifier.split('.')[0], type: identifier.startsWith('ar.') ? 'quran' : 'translation', format: 'text' },
  }
}
async function routeBaqara(page) {
  await page.route(/api\.alquran\.cloud\/v1\/surah\/2\/editions\//, route => {
    const eds = decodeURIComponent(route.request().url().split('/editions/')[1].split('?')[0]).split(',')
    route.fulfill({ json: { code: 200, status: 'OK', data: eds.map(baqara) } })
  })
}
const canonical = (page) => page.locator('link[rel="canonical"]')
// vite preview qovluğun index.html-ini yalnız sonda "/" olanda verir (nginx isə
// try_files $uri/index.html ilə sləşsiz verir) — xam HTML üçün sləşli ünvan
const raw = async (request, url) => {
  const res = await request.get(/\.\w+$/.test(url) ? url : url.replace(/\/?$/, '/'))
  expect(res.status(), url).toBe(200)
  return res.text()
}

test.describe('xam prerender HTML (JS-siz robotun gördüyü)', () => {
  test('/quran/2-al-baqara: h1, ərəbcə mətn, tərcümə, Tanzil atribusiyası, sxem', async ({ request }) => {
    const html = await raw(request, '/quran/2-al-baqara')
    expect(html).toContain('<title>Bəqərə surəsi — ərəbcə mətn və Azərbaycan dilində tərcümə | Muslims.cc</title>')
    expect(html).toContain('<link rel="canonical" href="https://muslims.cc/quran/2-al-baqara"')
    expect(html).toContain('hreflang="en" href="https://muslims.cc/en/quran/2-al-baqara"')
    expect(html).toContain('hreflang="x-default" href="https://muslims.cc/quran/2-al-baqara"')
    const root = html.slice(html.indexOf('<div id="root">'))
    expect(root).toContain('<h1>Bəqərə surəsi</h1>')
    // 1-ci ayə: Bəsmələ ayrıca, ayədə yalnız "الٓمٓ" (QuranPage ilə eyni qayda)
    expect(root).toContain('<span class="seo-static__n" dir="ltr">2:1</span> الٓمٓ</p>')
    expect(root).toContain('Əlif, Lam, Mim.')
    expect((root.match(/<li id="ayah-/g) || []).length).toBe(286)
    expect(root).toContain('href="/licenses"')
    expect(root).toMatch(/Tanzil/)
    // Əlaqəli linklər: əvvəlki / növbəti surə, bütün surələr
    expect(root).toContain('rel="prev" href="/quran/1-al-faatiha"')
    expect(root).toContain('rel="next" href="/quran/3-aal-i-imraan"')
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json" data-seo="page-jsonld">(.*?)<\/script>/)[1])
    expect(ld.mainEntity['@type']).toBe('Chapter')
    expect(ld.breadcrumb.itemListElement).toHaveLength(3)
  })

  test('/ar/quran/1-al-faatiha: ərəbcə — təfsir, Bəsmələ 1-ci ayədir', async ({ request }) => {
    const html = await raw(request, '/ar/quran/1-al-faatiha')
    expect(html).toMatch(/<html[^>]*lang="ar"[^>]*dir="rtl"/)
    const root = html.slice(html.indexOf('<div id="root">'))
    expect(root).toContain('<h1>سورة ٱلْفَاتِحَةِ</h1>')
    expect(root).not.toContain('seo-static__basmala')
    // Fatihədə Bəsmələ 1-ci ayənin özüdür (ayrıca blok yoxdur)
    expect(root).toContain('>1:1</span> بِسْمِ ')
    expect((root.match(/<li id="ayah-/g) || []).length).toBe(7)
  })

  test('/en/names/30-ar-rahman və /sahaba/bilal-ibn-rabah: h1 və məlumat', async ({ request }) => {
    const n = await raw(request, '/en/names/30-ar-rahman')
    expect(n).toContain('<h1>Ar-Rahman — The Most Gracious</h1>')
    expect(n).toContain('ٱلرَّحۡمَٰنُ')
    expect(n).toContain('<link rel="canonical" href="https://muslims.cc/en/names/30-ar-rahman"')
    // Siyahı İbn Useyminin siyahısıdır: 82-ci ad — əl-Cəmil (Müslim 91)
    const j = await raw(request, '/names/82-al-jamil')
    expect(j).toContain('ٱلۡجَمِيلُ')

    const s = await raw(request, '/sahaba/bilal-ibn-rabah')
    expect(s).toContain('<h1>Bilal ibn Rəbah</h1>')
    expect(s).toContain('بلال بن رباح')
    expect(s).toMatch(/"@type":"Person"/)
  })

  test('siyahı səhifələri bütün detallara link verir (krawl yolu)', async ({ request }) => {
    const q = await raw(request, '/quran')
    expect(new Set(q.match(/href="\/quran\/\d+-[a-z0-9-]+"/g)).size).toBe(114)
    const n = await raw(request, '/ru/names')
    expect(new Set(n.match(/href="\/ru\/names\/\d+-[a-z0-9-]+"/g)).size).toBe(99)
    const s = await raw(request, '/tr/sahaba')
    expect(new Set(s.match(/href="\/tr\/sahaba\/[a-z0-9-]+"/g)).size).toBe(20)
  })

  test('sitemap.xml — indeks; bölmə sitemap-larında hreflang alternativləri', async ({ request }) => {
    const idx = await raw(request, '/sitemap.xml')
    expect(idx).toContain('<sitemapindex')
    for (const f of ['pages', 'quran', 'names', 'sahaba']) expect(idx).toContain(`https://muslims.cc/sitemap-${f}.xml`)
    const q = await raw(request, '/sitemap-quran.xml')
    expect((q.match(/<loc>/g) || []).length).toBe(114 * 5)
    expect(q).toContain('<loc>https://muslims.cc/ru/quran/36-yaseen</loc>')
    expect(q).toContain('hreflang="x-default" href="https://muslims.cc/quran/36-yaseen"')
  })
})

test.describe('JS söndürülüb', () => {
  test.use({ javaScriptEnabled: false })
  test('statik məzmun görünür', async ({ page }) => {
    await page.goto('/tr/quran/112-al-ikhlaas/')
    await expect(page.locator('h1')).toHaveText('İhlâs Suresi')
    await expect(page.locator('.seo-static__list > li')).toHaveCount(4)
  })
})

test('prerender səhifəsi: statik blok tətbiqlə əvəzlənir, ünvan kanonikdir', async ({ page, consoleProblems }) => {
  await routeBaqara(page)
  // Sləşli ünvan prerender HTML-ini verir (yuxarıdakı raw() şərhinə bax)
  await page.goto('/quran/2-al-baqara/')
  await settle(page)
  await expect(page).toHaveURL(/\/quran\/2-al-baqara$/)
  await expect(page.locator('[data-seo-static]')).toHaveCount(0)
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('h1')).toHaveText('سُورَةُ البَقَرَةِ')
  expectCleanConsole(consoleProblems)
})

test('səhv slug → kanonik ünvan, surə 2 açılır, meta yenilənir', async ({ page, consoleProblems }) => {
  await routeBaqara(page)
  await page.goto('/quran/2-al-baqarah?a=3')
  await settle(page)
  await expect(page).toHaveURL(/\/quran\/2-al-baqara\?a=3$/)
  await expect(page.locator('h1')).toHaveText('سُورَةُ البَقَرَةِ')
  await expect(page.locator('#ayah-3')).toBeVisible()
  await expect(canonical(page)).toHaveAttribute('href', 'https://muslims.cc/quran/2-al-baqara')
  await expect(page).toHaveTitle('Bəqərə surəsi — ərəbcə mətn və Azərbaycan dilində tərcümə | Muslims.cc')
  expectCleanConsole(consoleProblems)
})

test('naməlum nömrə / slug → 404 (noindex)', async ({ page }) => {
  for (const url of ['/quran/115-yoxdur', '/en/names/100', '/sahaba/abu-bakr']) {
    await page.goto(url)
    await settle(page)
    await expect(page.locator('#nf-title'), url).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  }
})

test('surə siyahısından daxili klik URL-i dəyişir, Geri siyahıya qaytarır', async ({ page, consoleProblems }) => {
  await routeBaqara(page)
  await page.goto('/quran')
  await settle(page)
  const card = page.locator('a.surah-card[href="/quran/2-al-baqara"]')
  await expect(card).toBeVisible()
  await card.click()
  await expect(page).toHaveURL(/\/quran\/2-al-baqara$/)
  await expect(page.locator('h1')).toHaveText('سُورَةُ البَقَرَةِ')
  await expect(page).toHaveTitle(/^Bəqərə surəsi/)
  await page.goBack()
  await expect(page).toHaveURL(/\/quran$/)
  await expect(page.locator('a.surah-card').first()).toBeVisible()
  await expect(canonical(page)).toHaveAttribute('href', 'https://muslims.cc/quran')
  expectCleanConsole(consoleProblems)
})

test('99 ad: birbaşa link pəncərəni açır, növbəti ad URL-i yeniləyir, bağlamaq siyahıya qaytarır', async ({ page, consoleProblems }) => {
  await page.goto('/en/names/30-ar-rahman')
  await settle(page)
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('#names-modal-title')).toHaveText('Ar-Rahman')
  await expect(page).toHaveTitle(/^Ar-Rahman \(.+\) — Meaning of the 30th Name of Allah \| Muslims\.cc$/)
  await expect(canonical(page)).toHaveAttribute('href', 'https://muslims.cc/en/names/30-ar-rahman')

  await dialog.getByRole('button', { name: 'Next name' }).click()
  await expect(page).toHaveURL(/\/en\/names\/31-ar-rahim$/)
  await expect(dialog.locator('#names-modal-title')).toHaveText('Ar-Rahim')
  await expect(canonical(page)).toHaveAttribute('href', 'https://muslims.cc/en/names/31-ar-rahim')

  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(page).toHaveURL(/\/en\/names$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

test('99 ad: kartdan açılış — Geri düyməsi pəncərəni bağlayır', async ({ page, consoleProblems }) => {
  await page.goto('/names')
  await settle(page)
  await page.locator('a.name-card[href="/names/52-al-quddus"]').click()
  await expect(page).toHaveURL(/\/names\/52-al-quddus$/)
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(/\/names$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

// Siyahı İbn Useyminin siyahısı ilə əvəz olunanda nömrələr dəyişdi — köhnə
// ünvanlar (Google indeksi, kənar linklər) slug-a görə düzgün ada düşür
test('99 ad: köhnə nömrəli ünvan yeni kanonik ünvana keçir', async ({ page, consoleProblems }) => {
  await page.goto('/en/names/2-ar-rahman')
  await settle(page)
  await expect(page).toHaveURL(/\/en\/names\/30-ar-rahman$/)
  await expect(page.getByRole('dialog').locator('#names-modal-title')).toHaveText('Ar-Rahman')
  await expect(canonical(page)).toHaveAttribute('href', 'https://muslims.cc/en/names/30-ar-rahman')
  expectCleanConsole(consoleProblems)
})

test('99 ad: siyahıdan çıxarılmış adın köhnə ünvanı → /names siyahısı', async ({ page }) => {
  await page.goto('/ru/names/23-al-khafid')
  await settle(page)
  await expect(page).toHaveURL(/\/ru\/names$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('a.name-card').first()).toBeVisible()
  await expect(canonical(page)).toHaveAttribute('href', 'https://muslims.cc/ru/names')
})

test('səhabə: birbaşa link profili açır, sxem Person-dur', async ({ page, consoleProblems }) => {
  await page.goto('/ru/sahaba/bilal-ibn-rabah')
  await settle(page)
  await expect(page.locator('h1')).toHaveText('Биляль ибн Рабах')
  await expect(page).toHaveTitle(/^Биляль ибн Рабах — /)
  const ld = await page.locator('script[data-seo="page-jsonld"]').textContent()
  expect(JSON.parse(ld).mainEntity).toMatchObject({ '@type': 'Person', name: 'Биляль ибн Рабах' })
  expectCleanConsole(consoleProblems)
})

test('dil dəyişəndə detal səhifəsi qalır', async ({ page, consoleProblems, isMobile }) => {
  test.skip(isMobile, 'dil menyusu telefonda çəkmə menyunun içindədir — kompüterdə yoxlanır')
  await page.goto('/sahaba/anas-ibn-malik')
  await settle(page)
  await page.getByRole('button', { name: 'Dili dəyiş' }).click()
  await page.getByRole('menuitemradio', { name: 'English' }).or(page.getByRole('menuitem', { name: 'English' })).or(page.getByRole('button', { name: 'English' })).first().click()
  await expect(page).toHaveURL(/\/en\/sahaba\/anas-ibn-malik$/)
  await expect(page.locator('h1')).toHaveText('Anas ibn Malik')
  await expect(canonical(page)).toHaveAttribute('href', 'https://muslims.cc/en/sahaba/anas-ibn-malik')
  expectCleanConsole(consoleProblems)
})
