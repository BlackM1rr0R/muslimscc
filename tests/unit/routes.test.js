// Marşrutlar: URL ↔ (dil, səhifə) çevrilməsi və SEO qaydaları
import { describe, it, expect } from 'vitest'
import { PAGES, LANGS, pathFor, parsePath, urlFor } from '../../src/seo/routes.js'

describe('routes.js', () => {
  it('hər səhifə × dil üçün pathFor → parsePath geri eyni səhifəni verir', () => {
    for (const p of PAGES) {
      for (const l of LANGS) {
        const r = parsePath(pathFor(p.key, l))
        expect(r, `${p.key}/${l}`).toMatchObject({ lang: l, key: p.key })
      }
    }
  })

  it('az prefikssizdir, digər dillər prefiksli', () => {
    expect(pathFor('quran', 'az')).toBe('/quran')
    expect(pathFor('quran', 'ru')).toBe('/ru/quran')
    expect(pathFor('home', 'az')).toBe('/')
    expect(urlFor('quran', 'en')).toBe('https://muslims.cc/en/quran')
  })

  it('/az/... da tanınır (kanonik forma prefikssizdir)', () => {
    expect(parsePath('/az/hadith')).toMatchObject({ lang: 'az', key: 'hadith' })
  })

  it('silinmiş "mosque" marşrutu yoxdur, ümumi səhifələr qalır', () => {
    const keys = PAGES.map(p => p.key)
    expect(keys).not.toContain('mosque')
    for (const k of ['jamaat', 'announcements', 'donate', 'mosques']) expect(keys).toContain(k)
  })

  it('naməlum ünvan "known: false" qaytarır (404 səhifəsi üçün)', () => {
    expect(parsePath('/bu-yoxdur').known).toBe(false)
    expect(parsePath('/ru/bu-yoxdur').known).toBe(false)
  })

  it('URL-lər təkrarlanmır', () => {
    const urls = PAGES.flatMap(p => LANGS.map(l => pathFor(p.key, l)))
    expect(new Set(urls).size).toBe(urls.length)
  })
})
