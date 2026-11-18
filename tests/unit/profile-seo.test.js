// /u/<ləqəb> — robots qərarı və head (src/seo/profileSeo.js) + prerender qabığı noindex daşımır
import { describe, it, expect } from 'vitest'
import { profileSeo, profileIndexable, ROBOTS_INDEX, ROBOTS_NOINDEX } from '../../src/seo/profileSeo.js'
import { DETAILS, PAGES, INDEXABLE, parsePath } from '../../src/seo/routes.js'

const P = (over = {}) => ({ handle: 'ali_k', fields: ['displayName', 'bio'], data: { displayName: 'Əli', bio: 'Quran tələbəsi' }, allowIndex: true, ...over })

describe('profileSeo', () => {
  it('yalnız mövcud profil + sahibinin icazəsi → index, canonical prefiksiz /u/<ləqəb>', () => {
    const s = profileSeo({ status: 'ok', profile: P() }, 'en')
    expect(s.robots).toBe(ROBOTS_INDEX)
    expect(s.canonical).toBe('https://muslims.cc/u/ali_k')
    expect(s.title).toMatch(/^Əli — Public profile/)
    expect(s.desc).toBe('Əli: Quran tələbəsi')
    expect(s.jsonLd).toMatchObject({ '@type': 'ProfilePage', url: s.canonical, mainEntity: { '@type': 'Person', name: 'Əli', alternateName: '@ali_k' } })
  })

  it('icazə yoxdur → noindex, canonical və sxem yoxdur (başlıq yenə profildən)', () => {
    for (const allowIndex of [false, undefined, 1, 'true']) {
      const s = profileSeo({ status: 'ok', profile: P({ allowIndex }) }, 'az')
      expect(s.robots).toBe(ROBOTS_NOINDEX)
      expect(s.canonical).toBe(null)
      expect(s.jsonLd).toBe(null)
      expect(s.title).toMatch(/^Əli — /)
    }
  })

  it('göstərilməyən sahələr başlığa/təsvirə düşmür', () => {
    const s = profileSeo({ status: 'ok', profile: P({ fields: ['khatms'], data: { displayName: 'Gizli', bio: 'Gizli bio', khatms: 2 } }) }, 'en')
    expect(s.title).toMatch(/^@ali_k — /)
    expect(s.desc).not.toMatch(/Gizli/)
    expect(s.jsonLd.mainEntity.description).toBeUndefined()
  })

  it('yüklənir / naməlum / gizli → noindex', () => {
    for (const st of [null, { status: 'loading', profile: null }, { status: 'missing', profile: null }, { status: 'ok', profile: null }]) {
      const s = profileSeo(st, 'ru')
      expect(s.robots).toBe(ROBOTS_NOINDEX)
      expect(s.canonical).toBe(null)
    }
    expect(profileIndexable(null)).toBe(false)
  })
})

describe('marşrut', () => {
  it('selfSeo detal; sitemap-a (INDEXABLE) düşmür; dil prefiksli ünvan eyni parametri verir', () => {
    expect(DETAILS.publicprofile.selfSeo).toBe(true)
    expect(PAGES.find((p) => p.key === 'publicprofile').noindex).toBe(true)
    expect(INDEXABLE.some((p) => p.key === 'publicprofile')).toBe(false)
    expect(parsePath('/u/ali_k')).toMatchObject({ key: 'publicprofile', param: 'ali_k', known: true })
    expect(parsePath('/en/u/ali_k')).toMatchObject({ key: 'publicprofile', lang: 'en', param: 'ali_k' })
  })
})
