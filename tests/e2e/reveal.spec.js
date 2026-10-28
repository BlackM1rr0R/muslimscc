// ═══════════════════════════════════════════════════════
// Sürüşəndə görünmə (data-reveal) heç bir məzmunu GİZLİ qoymamalıdır.
//
// Bu test qəsdən animasiya AÇIQ rejimdə işləyir (qalan testlər "reduce"-dadır,
// orada reveal sistemi ümumiyyətlə söndürülür və bu xəta görünməzdi).
// Tapılan real xəta: threshold 0.08 ilə ekrandan çox hündür siyahılar heç
// vaxt "8% görünən" ola bilmirdi və həmişəlik şəffaf qalırdı.
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

test.use({ reducedMotion: 'no-preference' })

// Uzun məzmunlu səhifələr — hündür siyahılar burada olur
const LONG_PAGES = ['/', '/hadith', '/duas', '/names', '/quran', '/history', '/sahaba', '/glossary', '/about']

for (const url of LONG_PAGES) {
  test(`${url}: sürüşdükcə bütün data-reveal məzmunu görünür`, async ({ page }, info) => {
    test.skip(info.project.name === 'mobile' && !['/', '/hadith'].includes(url), 'mobil: iki səhifə kifayətdir')
    await page.goto(url)
    await settle(page)

    const stuck = await page.evaluate(async () => {
      const sleep = (ms) => new Promise(r => setTimeout(r, ms))
      const problems = []
      const H = document.documentElement.scrollHeight
      const onScreen = (el) => {
        const r = el.getBoundingClientRect()
        return r.bottom > 40 && r.top < innerHeight - 40 && r.width > 0
      }
      const faded = (el) => parseFloat(getComputedStyle(el).opacity) < 0.5
      // Həm data-reveal elementinin özü, həm də stagger uşaqları yoxlanılır
      const targets = () => [...document.querySelectorAll('[data-reveal]')].flatMap(el =>
        String(el.getAttribute('data-reveal')).startsWith('stagger') ? [el, ...el.children] : [el])
      // Səhifəni addım-addım sürüşdür. Şübhəli (ekranda, amma şəffaf) element
      // dərhal xəta sayılmır: növbəli animasiyanın ortasında ola bilər — 1.5 san
      // gözləyib yenə şəffafdırsa, deməli İLİŞİB qalıb.
      for (let y = 0; y <= H; y += Math.round(innerHeight * 0.7)) {
        window.scrollTo(0, y)
        await sleep(300)
        const suspects = targets().filter(el => onScreen(el) && faded(el))
        if (!suspects.length) continue
        await sleep(1500)
        for (const el of suspects) {
          if (onScreen(el) && faded(el)) {
            const r = el.getBoundingClientRect()
            problems.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} (y=${y}, hündürlük ${Math.round(r.height)})`)
          }
        }
      }
      return [...new Set(problems)]
    })

    expect(stuck, 'ekranda olduğu halda şəffaf qalan data-reveal elementləri').toEqual([])
  })
}
