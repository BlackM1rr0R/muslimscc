// Xəstəni ziyarət (utils/sickVisits, pages/SickVisitPage):
//   • ziyarət xatırlatmaları: təmizləmə, saxlama, "ziyarət etdim", sıralama, vəziyyət
//   • profil açarı + E2E sinxron birləşdiricisi (syncMergers → sick_visits_v1)
//   • dini məzmun saytın məlumatındandır: dərs blokları mövcud və mənbəli (gözlənilən mənbə siyahısı),
//     Hisnul-Müslim fəsilləri 5 dildə mövcud və mövzusu uyğundur
//   • SSR (prerender = ilk render), marşrut + meta
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import fs from 'node:fs'
import React, { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import {
  sanitizeVisit, sanitizeVisits, saveVisit, setVisited, removeVisit, readVisits, sortVisits, visitState,
  SICK_KEY, SICK_MAX, NAME_MAX,
} from '../../src/utils/sickVisits.js'
import { runMerger, CONFLICT } from '../../src/utils/syncMergers.js'
import { PROFILE_KEYS } from '../../src/utils/profileCore.js'
import { isBackupKey } from '../../src/utils/userBackup.js'
import { PAGES, NOINDEX_KEYS } from '../../src/seo/routes.js'
import { META } from '../../src/seo/meta.js'

globalThis.React = React
const origError = console.error
console.error = (...a) => { if (String(a[0]).includes('useLayoutEffect does nothing on the server')) return; origError(...a) }

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const mem = (init = {}) => {
  const m = new Map(Object.entries(init))
  return {
    get length() { return m.size }, key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m,
  }
}
const V = (id, extra = {}) => ({ id, n: 'Leyla xala', d: '2026-11-25', u: 1, ...extra })

let Page, LangProvider
beforeAll(async () => {
  ;({ LangProvider } = await import('../../src/contexts/LangContext.jsx'))
  Page = await import('../../src/pages/SickVisitPage.jsx')
})
afterEach(() => { delete globalThis.localStorage })

describe('utils/sickVisits', () => {
  it('sanitizeVisit: yararsız id / gün / boş ad → null; mətn qısaldılır', () => {
    expect(sanitizeVisit(V('x1'))).toBe(null)
    expect(sanitizeVisit(V('sabcd1', { d: '2026-02-30' }))).toBe(null)
    expect(sanitizeVisit(V('sabcd1', { n: '  ' }))).toBe(null)
    const v = sanitizeVisit(V('sabcd1', { n: 'ə'.repeat(200), no: 'otaq\u000712', x: 'yes', u: 'z' }))
    expect([...v.n].length).toBe(NAME_MAX)
    expect(v.no).toBe('otaq 12')
    expect(v.x).toBeUndefined()
    expect(v.u).toBe(0)
    expect(sanitizeVisit(V('sabcd1', { x: true })).x).toBe(true)
  })
  it('sanitizeVisits: təkrarsız, hədd', () => {
    const l = Array.from({ length: SICK_MAX + 5 }, (_, i) => V(`sid${String(i).padStart(4, '0')}`))
    expect(sanitizeVisits({ l: [...l, l[0]] }).l).toHaveLength(SICK_MAX)
    expect(sanitizeVisits(null)).toEqual({ v: 1, l: [] })
  })
  it('saxla, yenilə, ziyarət etdim, sil; boş siyahı açarı silir', () => {
    const s = mem()
    const r = saveVisit({ n: 'Ana', d: '2026-11-25' }, s, 1000)
    expect(r.ok).toBe(true)
    expect(readVisits(s).l).toHaveLength(1)
    const id = r.item.id
    saveVisit({ id, n: 'Anam', d: '2026-11-26', no: 'xəstəxana' }, s, 2000)
    expect(readVisits(s).l[0]).toMatchObject({ id, n: 'Anam', d: '2026-11-26', no: 'xəstəxana', u: 2000 })
    setVisited(id, true, s, 3000)
    expect(readVisits(s).l[0]).toMatchObject({ x: true, u: 3000 })
    setVisited(id, false, s, 4000)
    expect(readVisits(s).l[0].x).toBeUndefined()
    expect(saveVisit({ n: '', d: '2026-11-25' }, s).ok).toBe(false)
    removeVisit(id, s)
    expect(s.getItem(SICK_KEY)).toBe(null)
    expect(() => saveVisit({ n: 'A', d: '2026-11-25' }, null)).not.toThrow()
  })
  it('sıra və vəziyyət', () => {
    const l = [V('sa0001', { d: '2026-12-10' }), V('sa0002', { d: '2026-11-20', x: true }), V('sa0003', { d: '2026-11-23' }), V('sa0004', { d: '2026-11-22' }), V('sa0005', { d: '2026-11-25', x: true })]
    expect(sortVisits(l).map((x) => x.id)).toEqual(['sa0004', 'sa0003', 'sa0001', 'sa0005', 'sa0002'])
    const today = '2026-11-23'
    expect(visitState(V('s1111a', { d: '2026-11-23' }), today)).toBe('today')
    expect(visitState(V('s1111a', { d: '2026-11-30' }), today)).toBe('soon')
    expect(visitState(V('s1111a', { d: '2026-12-01' }), today)).toBe('later')
    expect(visitState(V('s1111a', { d: '2026-11-22' }), today)).toBe('past')
    expect(visitState(V('s1111a', { d: '2026-11-22', x: true }), today)).toBe('done')
  })
  it('profil açarı, ehtiyat/sinxrona düşür, birləşdirici: 3 tərəfli, silinmə keçir, eyni qeyddə təzəsi', () => {
    expect(PROFILE_KEYS).toContain(SICK_KEY)
    expect(isBackupKey(SICK_KEY)).toBe(true)
    const base = JSON.stringify({ v: 1, l: [V('saaaa1'), V('sbbbb1')] })
    const local = JSON.stringify({ v: 1, l: [V('saaaa1', { n: 'Yeni', u: 5 }), V('sbbbb1'), V('scccc1')] })
    const remote = JSON.stringify({ v: 1, l: [V('saaaa1', { n: 'Köhnə', u: 3, x: true })] })   // b silinib
    const out = JSON.parse(runMerger(SICK_KEY, local, remote, base))
    expect(out.l.map((x) => x.id).sort()).toEqual(['saaaa1', 'scccc1'])
    expect(out.l.find((x) => x.id === 'saaaa1').n).toBe('Yeni')
    expect(runMerger(SICK_KEY, '{oops', remote, base)).toBe(CONFLICT)
    expect(runMerger(SICK_KEY, JSON.stringify({ v: 1, l: [] }), JSON.stringify({ v: 1, l: [] }), base)).toBeUndefined()
  })
})

// Göstərilən hədis/dua bloklarının mənbələri (ingiliscə) — content-review üçün sabit siyahı
const EXPECT_SOURCES = {
  'sick-fiqh/visiting': ['al-Bukhari 1240, Muslim 2162', 'Muslim 2568', 'Muslim 2569 (hadith qudsi)', 'al-Bukhari 3616', 'Abu Dawud 3106, at-Tirmidhi 2083 — seven times'],
  'sick-fiqh/patience': ['al-Bukhari 5641, 5642; Muslim 2573', 'Muslim 2999'],
}
describe('dini məzmun — saytın məlumatından', () => {
  it('dərs blokları mövcuddur, növü icazəlidir, hədis/dua 5 dildə mənbəlidir', async () => {
    const L = (await import('../../src/data/lessons/sick-fiqh.js')).default
    const seen = {}
    for (const part of Page.SICK_PARTS) {
      for (const e of part.ex) {
        const sec = L.sections.find((x) => x.id === e.sec)
        expect(sec, e.sec).toBeTruthy()
        for (const i of e.b) {
          const b = sec.blocks[i]
          expect(b, `${e.sec}[${i}]`).toBeTruthy()
          expect(['hadith', 'dua', 'list', 'note'].includes(b.t), `${e.sec}[${i}] ${b.t}`).toBe(true)
          const k = `${e.s}/${e.sec}`
          seen[k] ||= []
          if (b.t === 'hadith' || b.t === 'dua') {
            for (const l of LANGS) expect(b.src?.[l], `${k}[${i}] ${l}`).toBeTruthy()
            seen[k].push(b.src.en)
          }
        }
      }
    }
    expect(seen).toEqual(EXPECT_SOURCES)
    // ədəb siyahısı və rüqyə/cənazə işarəsi
    const vis = L.sections.find((x) => x.id === 'visiting')
    expect(vis.blocks[3].t).toBe('list')
    expect(vis.blocks[6].t).toBe('note')
  })
  it('Hisnul-Müslim fəsilləri 5 dildə mövcud, mənbəli və mövzusu uyğundur', () => {
    const want = { 50: /visiting them/, 51: /virtue of visiting the sick/, 125: /pain in the body/ }
    const used = new Set(Page.SICK_PARTS.flatMap((p) => [...(p.hisn || []), ...(p.hisnLink ? [p.hisnLink] : [])]))
    expect([...used].sort((a, b) => a - b)).toEqual([50, 51, 125])
    for (const lang of LANGS) {
      const d = JSON.parse(fs.readFileSync(`public/data/hisn/${lang}.json`, 'utf8'))
      for (const id of used) {
        const c = d.chapters.find((x) => x.id === id)
        expect(c, `${lang} ${id}`).toBeTruthy()
        expect(c.items.length).toBeGreaterThan(0)
        for (const it of c.items) { expect(it.ar).toBeTruthy(); expect(it.src, `${lang} ${id}`).toBeTruthy() }
        if (lang === 'en') expect(c.title).toMatch(want[id])
      }
    }
  })
})

describe('marşrut, meta və SSR', () => {
  it('routes.js (indekslənir) və meta.js (5 dil)', () => {
    expect(PAGES.find((p) => p.key === 'sickvisit')?.path).toBe('visiting-the-sick')
    expect(NOINDEX_KEYS.has('sickvisit')).toBe(false)
    for (const l of LANGS) {
      expect(META.sickvisit[l].t.length).toBeLessThanOrEqual(60)
      expect(META.sickvisit[l].d.length).toBeGreaterThan(100)
      expect(META.sickvisit[l].d.length).toBeLessThanOrEqual(170)
    }
  })
  const render = (url) => renderToString(h(MemoryRouter, { initialEntries: [url] }, h(LangProvider, null, h(Page.default, { setPage: () => {} }))))
  it('5 dildə render olunur, tibbi məsləhət olmadığı yazılır, boş role="alert" yoxdur', () => {
    for (const l of ['', '/en', '/ru', '/tr', '/ar']) {
      const html = render(`${l}/visiting-the-sick`)
      expect(html).toContain('<h1')
      expect(html).not.toContain('role="alert"')
      if (l === '/en') { expect(html).toContain('Visiting the sick'); expect(html).toContain('not medical advice') }
    }
  })
  it('ilk render yaddaşdakı siyahıdan asılı deyil', () => {
    const empty = render('/en/visiting-the-sick')
    globalThis.localStorage = mem({ [SICK_KEY]: JSON.stringify({ v: 1, l: [V('saaaa1')] }) })
    expect(render('/en/visiting-the-sick')).toBe(empty)
  })
})
