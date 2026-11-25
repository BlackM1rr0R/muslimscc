// UI cilası (2026-11-24, sahibin seçdiyi maket): Hero A-nın statik ilk ekranı, İkon A (çəkiliş
// rejimi + Uşaqlar ikonu), Scroll A-nın ortaq müşahidəçisi
import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { staticBodyFor, homeBody } from '../../scripts/seo-body.mjs'
import { HERO_T } from '../../src/components/home/heroText.js'
import { criticalCss, htmlClasses, splitBlocks } from '../../scripts/critical-css.mjs'

// Vitest (node) JSX-i klassik rejimdə çevirir — komponent React qlobalını gözləyir
globalThis.React = React
const { default: Icon } = await import('../../src/components/Icon.jsx')

const ROOT = path.resolve(import.meta.dirname, '..', '..')
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8')

describe('Hero A — ana səhifənin statik ilk ekranı (seo-body → homeBody)', () => {
  it('5 əsas dildə var, əlavə dildə yoxdur (lüğətlə tərcümə ilə üst-üstə düşməzdi)', () => {
    for (const l of ['az', 'en', 'ru', 'ar', 'tr']) {
      const h = staticBodyFor('home', l)
      expect(h).toContain('data-home-static=""')
      expect(h).toContain(HERO_T[l].badge)
    }
    expect(homeBody('id')).toBe('')
    expect(staticBodyFor('home', 'id')).toBe('')
  })

  it('React hero-su ilə eyni quruluş (sinif ardıcıllığı) — keçiddə heç nə yerindən oynamasın', () => {
    const h = homeBody('az')
    const order = ['class="header"', 'class="logo"', 'class="qm-shell"', 'class="hp-root"', 'class="hp-top"', 'class="drb-wrap"',
      'class="hp-hero"', 'class="hp-hero-bg"', 'hp-hero-pattern', 'class="hp-hero-inner"', 'class="hp-hero-content"',
      'hp-badge', 'class="hp-hero-title hp-shine"', 'class="hp-ht-row"', 'class="hp-ht-1"', 'class="hp-ht-ch"', 'class="hp-ht-2"',
      'class="hp-hero-sub"', 'class="hp-hero-btns"', 'class="hp-hero-trust"', 'class="hp-hero-visual"',
      'class="hp-pc"', 'class="hp-pc-hdr"', 'class="hp-pr-list"', 'hp-pr hp-pr--skel', 'class="hp-pc-note"', 'hp-pc-more']
    let at = -1
    for (const c of order) {
      const i = h.indexOf(c, at + 1)
      expect(i, c).toBeGreaterThan(at)
      at = i
    }
    // React tərəfi (HomePage.jsx / HeroOrnament.jsx) eyni sinifləri işlədir
    const src = read('src/pages/HomePage.jsx')
    for (const c of ['hp-hero-bg', 'hp-hero-inner', 'hp-hero-content', 'hp-hero-title hp-shine', 'hp-ht-row', 'hp-ht-ch', 'hp-hero-sub',
      'hp-hero-btns', 'hp-hero-trust', 'hp-hero-visual', 'hp-orn', 'hp-pr hp-pr--skel', 'hp-pc-note', 'hp-pc-more ui-btn ui-btn--secondary ui-btn--block']) {
      expect(src, c).toContain(c)
    }
    // Nur xatəmi statik blokda yoxdur (React-də çəkilir — main thread rəngləməsi JS yüklənərkən olmasın)
    expect(h).not.toContain('hero-orn')
  })

  it('bir h1 (brend), iki düymə həqiqi link (JS-siz də işləyir), 5 namaz adı', () => {
    const h = homeBody('en')
    expect(h.match(/<h1\b/g)).toHaveLength(1)
    expect(h).toContain('aria-label="Muslims.cc"')
    expect(h).toContain('href="/en/prayer"')
    expect(h).toContain('href="/en/quran"')
    for (const n of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) expect(h).toContain(`<span>${n}</span>`)
    expect(h).toContain('Adhan times for Baku are calculated via aladhan.com.')
    // Statik blokda id-lər React-in hero id-ləri ilə toqquşmur (hp-pc-ttl → hp-pc-ttl-s)
    expect(h).not.toContain('id="hp-pc-ttl"')
  })

  it('ərəbcə: mətn ərəbcə, domen soldan sağa qalır', () => {
    const h = homeBody('ar')
    expect(h).toContain(HERO_T.ar.btnTimes)
    expect(h).toContain('class="hp-ht-2">.cc<')
  })

  it('statik blokun sinifləri qlobal [class*="stat|num|count"] qaydasına düşmür (tabular-nums mətnin enini dəyişirdi → yeni LCP)', () => {
    const extra = [...htmlClasses(homeBody('az'))].filter(c => /stat|num|count/.test(c))
    // React-də də eyni sinif olanlar (eyni stil) problem deyil — yalnız statik blokun öz qabığı yoxlanılır
    expect(extra.filter(c => !read('src/pages/HomePage.jsx').includes(c))).toEqual([])
  })

  it('ana səhifənin HTML-i kiçik qalır (yalnız 5 səhifə, ~9 KB)', () => {
    expect(homeBody('az').length).toBeLessThan(12000)
  })
})

describe('İkon A', () => {
  it('Uşaqlar ikonu üz deyil — oyuncaq kublar (canlı varlıq təsviri yoxdur)', () => {
    const svg = renderToStaticMarkup(createElement(Icon, { name: 'kids' }))
    expect(svg.match(/<rect\b/g)).toHaveLength(3)
    expect(svg).not.toContain('<circle')
  })
  it('draw rejimi hər xəttə pathLength="1" verir, adi rejim vermir', () => {
    const drawn = renderToStaticMarkup(createElement(Icon, { name: 'hadith', draw: true }))
    expect(drawn).toContain('class="ic-draw"')
    expect(drawn.match(/pathLength="1"/g)).toHaveLength(3)
    const plain = renderToStaticMarkup(createElement(Icon, { name: 'hadith' }))
    expect(plain).not.toContain('pathLength')
    // fragment + tək element ikonları
    expect(renderToStaticMarkup(createElement(Icon, { name: 'shield', draw: true }))).toContain('pathLength="1"')
  })
})

describe('Scroll A — ortaq IntersectionObserver (utils/revealIO)', () => {
  let instances
  beforeEach(() => {
    vi.resetModules()
    instances = []
    globalThis.window = globalThis
    globalThis.IntersectionObserver = class {
      constructor(cb, opts) { this.cb = cb; this.opts = opts; this.els = new Set(); instances.push(this) }
      observe(el) { this.els.add(el) }
      unobserve(el) { this.els.delete(el) }
    }
  })

  it('bütün sahiblər TƏK müşahidəçini paylaşır; flush partiyada bir dəfə', async () => {
    const { watch, unwatch } = await import('../../src/utils/revealIO.js')
    const a = {}, b = {}, c = {}
    const seen = []
    const o1 = { entry: (e) => seen.push(['o1', e.target]), flush: vi.fn() }
    const o2 = { entry: (e) => seen.push(['o2', e.target]) }
    expect(watch(a, o1)).toBe(true)
    watch(b, o1)
    watch(c, o2)
    expect(instances).toHaveLength(1)
    expect(instances[0].opts).toEqual({ rootMargin: '0px', threshold: 0 })
    instances[0].cb([{ target: a }, { target: b }, { target: c }])
    expect(seen.map(x => x[0])).toEqual(['o1', 'o1', 'o2'])
    expect(o1.flush).toHaveBeenCalledTimes(1)
    unwatch(a, o1)
    expect(instances[0].els.has(a)).toBe(false)
  })

  it('bir elementin iki sahibi ola bilər (wow.js girişi + İkon A çəkilişi); biri çıxanda digəri qalır', async () => {
    const { watch, unwatch } = await import('../../src/utils/revealIO.js')
    const el = {}
    const a = { entry: vi.fn() }, b = { entry: vi.fn() }
    watch(el, a)
    watch(el, b)
    instances[0].cb([{ target: el }])
    expect(a.entry).toHaveBeenCalledTimes(1)
    expect(b.entry).toHaveBeenCalledTimes(1)
    unwatch(el, a)
    expect(instances[0].els.has(el)).toBe(true)
    instances[0].cb([{ target: el }])
    expect(a.entry).toHaveBeenCalledTimes(1)
    expect(b.entry).toHaveBeenCalledTimes(2)
    unwatch(el, b)
    expect(instances[0].els.has(el)).toBe(false)
  })

  it('IntersectionObserver yoxdursa false (məzmun görünür qalır)', async () => {
    delete globalThis.IntersectionObserver
    const { watch } = await import('../../src/utils/revealIO.js')
    expect(watch({}, { entry() {} })).toBe(false)
  })
})

describe('kritik CSS (scripts/critical-css.mjs)', () => {
  const css = '.a{color:red}.a .b,.c{x:1}@media (max-width:5px){.a{y:2}.z{y:3}}@keyframes k{from{opacity:0}to{opacity:1}}@keyframes u{from{a:b}}.a:hover{animation:k 1s}html:not(.r) .a{q:1}html.r .a{w:1}.x{background:url("data:a{b}")}'
  it('yalnız statik blokun siniflərinə aid qaydalar, istifadə olunan @keyframes, :not(.x) tələb olunmur', () => {
    expect(criticalCss(css, ['a', 'b'])).toBe('.a{color:red}.a .b{x:1}@media (max-width:5px){.a{y:2}}@keyframes k{from{opacity:0}to{opacity:1}}.a:hover{animation:k 1s}html:not(.r) .a{q:1}')
  })
  it('dırnaq içindəki mötərizələr bloku pozmur; HTML-dən siniflər', () => {
    expect(splitBlocks(css).at(-1).prelude).toBe('.x')
    expect([...htmlClasses('<div class="a b"><span class=" c "></span></div>')]).toEqual(['a', 'b', 'c'])
  })
  it('ana səhifənin statik bloku üçün kritik CSS kiçikdir və hero qaydalarını saxlayır', () => {
    const home = fs.readFileSync(path.join(ROOT, 'src/styles/HomePage.css'), 'utf8')
    const out = criticalCss(home.replace(/\/\*[\s\S]*?\*\//g, ''), htmlClasses(homeBody('az')))
    expect(out).toContain('.hp-hero-title')
    expect(out).toContain('.hp-pr-list[aria-busy="true"]')
    expect(out).not.toContain('.hp-ctab')
    expect(out).not.toContain('.hp-tw')
  })
})
