// Sələf alimləri — src/data/scholars.js: 5 dildə sahələr, mənbə URL-ləri,
// slug-ların unikallığı və marşrut/SEO ilə uyğunluğu
import { describe, it, expect } from 'vitest'
import { SCHOLARS, ERAS, ERA_LABEL, ERA_SHORT, ERA_SPAN, scholarBySlug, lifeSpan, dateText } from '../../src/data/scholars.js'
import { SCHOLAR_SLUGS } from '../../src/seo/detailSlugs.js'
import { LANGS, parsePath, pathFor } from '../../src/seo/routes.js'
import { detailMeta, detailJsonLd, titleForDetail } from '../../src/seo/detail.js'
import { staticBodyFor } from '../../scripts/seo-body.mjs'

const filled = (v) => typeof v === 'string' && v.trim().length > 0
const all5 = (obj, what) => {
  expect(obj, what).toBeTruthy()
  for (const l of LANGS) expect(filled(obj[l]), `${what} → ${l}`).toBe(true)
}

describe('alimlər — məlumat', () => {
  it('siyahı boş deyil, slug-lar unikal və ASCII-dir', () => {
    expect(SCHOLARS.length).toBeGreaterThanOrEqual(30)
    const slugs = SCHOLARS.map(s => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('SCHOLAR_SLUGS (routes bandlı) məlumatla eyni sıradadır', () => {
    expect(SCHOLAR_SLUGS).toEqual(SCHOLARS.map(s => s.slug))
  })

  it('dövr məlum, siyahı dövr və doğum ilinə görə sıralanıb', () => {
    let prev = null
    for (const s of SCHOLARS) {
      expect(ERAS, s.slug).toContain(s.era)
      if (prev && prev.era === s.era && prev.born?.h && s.born?.h) expect(s.born.h, s.slug).toBeGreaterThanOrEqual(prev.born.h)
      if (prev) expect(ERAS.indexOf(s.era), s.slug).toBeGreaterThanOrEqual(ERAS.indexOf(prev.era))
      prev = s
    }
    for (const e of ERAS) { all5(ERA_LABEL[e], `ERA_LABEL.${e}`); all5(ERA_SHORT[e], `ERA_SHORT.${e}`); all5(ERA_SPAN[e], `ERA_SPAN.${e}`) }
  })

  it('hər alimin əsas sahələri 5 dildədir', () => {
    for (const s of SCHOLARS) {
      for (const f of ['name', 'fullName', 'title', 'city', 'summary', 'contribution']) all5(s[f], `${s.slug}.${f}`)
      if (s.birthplace) all5(s.birthplace, `${s.slug}.birthplace`)
      if (s.note) all5(s.note, `${s.slug}.note`)
      // Ərəbcə ad ərəb əlifbasındadır (xəttatlıq kartı onu çəkir)
      expect(s.name.ar, s.slug).toMatch(/[؀-ۿ]/)
    }
  })

  it('həyat yolu hər dildə 3–5 abzasdır', () => {
    for (const s of SCHOLARS) {
      for (const l of LANGS) {
        const bio = s.bio[l]
        expect(Array.isArray(bio), `${s.slug}.bio.${l}`).toBe(true)
        expect(bio.length, `${s.slug}.bio.${l}`).toBeGreaterThanOrEqual(3)
        expect(bio.length, `${s.slug}.bio.${l}`).toBeLessThanOrEqual(5)
        for (const p of bio) expect(filled(p), `${s.slug}.bio.${l}`).toBe(true)
      }
    }
  })

  it('müəllim, tələbə, əsər və sitatların hər elementi 5 dildədir', () => {
    for (const s of SCHOLARS) {
      expect(s.teachers.length, `${s.slug}.teachers`).toBeGreaterThanOrEqual(2)
      for (const k of ['teachers', 'students', 'works']) {
        expect(Array.isArray(s[k]), `${s.slug}.${k}`).toBe(true)
        s[k].forEach((x, i) => all5(x, `${s.slug}.${k}[${i}]`))
      }
      for (const [i, q] of s.praise.entries()) {
        all5(q, `${s.slug}.praise[${i}]`)
        all5(q.by, `${s.slug}.praise[${i}].by`)
        all5(q.ref, `${s.slug}.praise[${i}].ref`)
      }
    }
  })

  it('hər alimin ən azı bir https mənbəsi var', () => {
    for (const s of SCHOLARS) {
      expect(s.sources.length, s.slug).toBeGreaterThanOrEqual(1)
      for (const r of s.sources) {
        expect(filled(r.label), `${s.slug} label`).toBe(true)
        expect(() => new URL(r.url), `${s.slug} ${r.url}`).not.toThrow()
        expect(r.url, s.slug).toMatch(/^https:\/\//)
      }
    }
  })

  it('tarixlər: hicri ≤ miladi, vəfat doğumdan sonra; sağ alim üçün vəfat yoxdur', () => {
    for (const s of SCHOLARS) {
      for (const d of [s.born, s.died]) {
        if (!d) continue
        expect(Number.isInteger(d.h), s.slug).toBe(true)
        if (d.g != null) expect(d.g, s.slug).toBeGreaterThan(d.h)
      }
      if (s.born && s.died) expect(s.died.h, s.slug).toBeGreaterThan(s.born.h)
      if (!s.died) expect(s.era, s.slug).toBe('contemporary')
    }
  })

  it('lifeSpan / dateText — yalnız məlumatdakı illər', () => {
    const t = scholarBySlug('ibn-taymiyyah')
    expect(lifeSpan(t, 'az')).toBe('h. 661–728 · m. 1263–1328')
    expect(lifeSpan(t, 'en')).toBe('661–728 AH · 1263–1328 CE')
    expect(dateText(t.died, 'ar')).toBe('728 هـ (1328 م)')
    const living = SCHOLARS.find(s => !s.died)
    if (living) expect(lifeSpan(living, 'az')).toMatch(/^doğulub h\. \d+/)
    expect(dateText(null, 'az')).toBe('')
    expect(scholarBySlug('yoxdur')).toBeNull()
  })
})

describe('alimlər — marşrut və SEO', () => {
  it('/scholars/<slug> hər dildə tanınır, naməlum slug — 404', () => {
    for (const s of SCHOLARS) {
      for (const l of LANGS) expect(parsePath(pathFor('scholars', l, s.slug))).toEqual({ lang: l, key: 'scholars', known: true, param: s.slug })
    }
    expect(parsePath('/scholars/yoxdur')).toMatchObject({ key: 'scholars', known: false })
    expect(parsePath('/en/scholars')).toEqual({ lang: 'en', key: 'scholars', known: true, param: null })
    expect(pathFor('scholars', 'ar', 'ibn-baz')).toBe('/ar/scholars/ibn-baz')
  })

  it('detal meta, JSON-LD Person və statik body', () => {
    for (const l of LANGS) {
      const m = detailMeta('scholars', l, 'ibn-baz')
      expect(m.h1).toBe(scholarBySlug('ibn-baz').name[l])
      expect(titleForDetail('scholars', l, 'ibn-baz')).toContain(' | ')
      const ld = detailJsonLd('scholars', l, 'ibn-baz')
      expect(ld.mainEntity['@type']).toBe('Person')
      expect(ld.breadcrumb.itemListElement).toHaveLength(3)
      const html = staticBodyFor('scholars', l, 'ibn-baz')
      expect(html).toContain(`<h1>${m.h1}</h1>`)
      for (const src of scholarBySlug('ibn-baz').sources) expect(html).toContain(src.url.replace(/&/g, '&amp;'))
      const list = staticBodyFor('scholars', l)
      for (const s of SCHOLARS) expect(list).toContain(`href="${pathFor('scholars', l, s.slug)}"`)
    }
    // "təxminən" il sxemə yazılmır
    const approx = SCHOLARS.find(s => s.born?.approx)
    if (approx) expect(detailJsonLd('scholars', 'en', approx.slug).mainEntity.birthDate).toBeUndefined()
  })
})
