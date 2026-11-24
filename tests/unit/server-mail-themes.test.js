// Admin məktubunun rəng mövzuları və hazır şablonları
//   • server: theme allowlist (validContent), mövzusuz köhnə göndəriş → emerald + welcome-v1.gif
//   • renderCampaign hər mövzu üçün: öz GIF-i, palitra, tünd rejim, statik başlıq, RTL
//   • palitranın hər cütü WCAG AA (≥ 4.5:1), açıq və tünd rejimdə
//   • src/utils/mailTemplates.js: ≥ 7 şablon, 5 dil, mövzu serverin siyahısındadır, server qəbul edir
//   • public/email: hər mövzunun GIF-i (≤ 350 KB, 600×220) və kiçik şəkli var
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { require } from './server-helpers.js'
import { MAIL_TEMPLATES, MAIL_THEMES as CLIENT_THEMES, THEME_NAMES, themeThumb } from '../../src/utils/mailTemplates.js'

const { renderCampaign, CAMPAIGN_THEMES, MAIL_THEMES, DEFAULT_THEME, WELCOME_IMG } = require('../../server/mailer.js')
const mc = require('../../server/mailCampaigns.js')

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const ORIGIN = 'https://muslims.cc'
const LANGS = ['az', 'en', 'ru', 'tr', 'ar']

// WCAG 2.x nisbi parlaqlıq və kontrast
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

const content = (over = {}) => ({ mode: 'single', versions: { az: { subject: 'Salam', body: 'Mətn https://muslims.cc/quran', ctaLabel: 'Aç', ctaUrl: '/quran' } }, ...over })

describe('rəng mövzuları — server allowlist', () => {
  it('mövzu siyahısı klientlə eynidir, susmaya görə emerald', () => {
    expect(MAIL_THEMES).toEqual(CLIENT_THEMES)
    expect(DEFAULT_THEME).toBe('emerald')
    expect(MAIL_THEMES.length).toBeGreaterThanOrEqual(5)
  })

  it('validContent: yalnız siyahıdakı mövzu; yoxdursa emerald; rəng/obyekt keçmir', () => {
    expect(mc.validContent(content(), ORIGIN).content.theme).toBe('emerald')
    for (const t of MAIL_THEMES) expect(mc.validContent(content({ theme: t }), ORIGIN).content.theme).toBe(t)
    for (const bad of ['#ff0000', 'red', 'Dawn', '__proto__', 'constructor', 'toString', '', 1, {}, ['dawn'], true]) {
      expect(mc.validContent(content({ theme: bad }), ORIGIN).error).toBe('bad_theme')
    }
  })

  it('renderCampaign: naməlum və ya yox mövzu → emerald (köhnə göndərişlər dəyişmir)', () => {
    for (const t of [undefined, null, 'nope', '__proto__', 'constructor', { a: 1 }]) {
      const m = renderCampaign('en', { subject: 's', body: 'b', theme: t, origin: ORIGIN })
      expect(m.html).toContain('data-theme="emerald"')
      expect(m.html).toContain(`src="${ORIGIN}${WELCOME_IMG}"`)
    }
  })
})

describe('renderCampaign — hər mövzu', () => {
  for (const t of Object.keys(CAMPAIGN_THEMES)) {
    it(`${t}: GIF, palitra, düymə, keçid, tünd rejim; statik başlıq; ar — RTL`, () => {
      const P = CAMPAIGN_THEMES[t]
      const m = renderCampaign('az', { subject: 'Salam', body: 'Mətn [keçid](https://muslims.cc/quran)', ctaLabel: 'Aç', ctaUrl: 'https://muslims.cc/quran', header: 'gif', theme: t, origin: ORIGIN })
      expect(m.html).toContain(`data-theme="${t}"`)
      expect(m.html).toContain(`src="${ORIGIN}${P.img}"`)
      expect(m.html).toMatch(/<img [^>]*alt="Muslims\.cc — [^"]+"/)
      expect(m.html).toContain(`bgcolor="${P.brand}"`)
      expect(m.html).toContain(`color:${P.btnInk};text-decoration:none`)
      expect(m.html).toContain(`style="color:${P.link};text-decoration:underline">keçid</a>`)
      expect(m.html).toContain(`border:1px solid ${P.border}`)
      expect(m.html).toContain(`.mcc-card{background:${P.dCard}!important`)
      expect(m.html).toContain(`.mcc-link{color:${P.dLink}!important}`)
      expect(m.html).toContain(`bgcolor="${P.head}"`)
      // statik başlıq — şəkil yoxdur, mövzunun rəngi var
      const tx = renderCampaign('en', { subject: 's', body: 'b', header: 'text', theme: t, origin: ORIGIN })
      expect(tx.html).not.toContain('<img ')
      expect(tx.html).toContain(`color:${P.headInk};text-decoration:none;font-size:26px`)
      // ərəbcə — RTL, sağa düzlənmə, düymədə sol ox
      const ar = renderCampaign('ar', { subject: 'جمعة مباركة!', body: 'السلام عليكم', ctaLabel: 'افتح', ctaUrl: 'https://muslims.cc/ar/quran', theme: t, origin: ORIGIN })
      expect(ar.html).toContain('<html lang="ar" dir="rtl"')
      expect(ar.html).toContain('dir="rtl" lang="ar" style="padding:28px 28px 12px;text-align:right')
      expect(ar.html).toContain('افتح&nbsp;&larr;')
      expect(ar.html).toContain(`src="${ORIGIN}${P.img}"`)
    })
  }

  it('palitranın hər cütü WCAG AA (≥ 4.5:1) — açıq və tünd rejim', () => {
    for (const [t, P] of Object.entries(CAMPAIGN_THEMES)) {
      const pairs = {
        'ink/card': [P.ink, P.card], 'muted/card': [P.muted, P.card], 'link/card': [P.link, P.card],
        'btnInk/brand': [P.btnInk, P.brand], 'headInk/head': [P.headInk, P.head],
        'dInk/dCard': [P.dInk, P.dCard], 'dMuted/dCard': [P.dMuted, P.dCard], 'dLink/dCard': [P.dLink, P.dCard],
      }
      for (const [k, [a, b]] of Object.entries(pairs)) {
        expect(contrast(a, b), `${t} ${k} ${a} on ${b}`).toBeGreaterThanOrEqual(4.5)
      }
      for (const v of Object.entries(P).filter(([k]) => k !== 'img').map(([, v]) => v)) expect(v).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})

describe('hazır şablonlar (src/utils/mailTemplates.js)', () => {
  it('≥ 7 şablon, unikal id, mövzu serverin siyahısında, 5 dildə ad', () => {
    expect(MAIL_TEMPLATES.length).toBeGreaterThanOrEqual(7)
    expect(new Set(MAIL_TEMPLATES.map((t) => t.id)).size).toBe(MAIL_TEMPLATES.length)
    for (const id of ['whatsnew', 'ramadan', 'eidFitr', 'eidAdha', 'jumuah', 'quran', 'plain']) expect(MAIL_TEMPLATES.some((t) => t.id === id)).toBe(true)
    for (const t of MAIL_TEMPLATES) {
      expect(MAIL_THEMES).toContain(t.theme)
      for (const l of LANGS) {
        expect(t.name[l], `${t.id} name.${l}`).toBeTruthy()
        expect(Object.keys(t.versions[l]).sort()).toEqual(['body', 'ctaLabel', 'ctaUrl', 'subject'])
      }
    }
    for (const l of LANGS) for (const th of MAIL_THEMES) expect(THEME_NAMES[l][th]).toBeTruthy()
  })

  it('doldurulmuş şablonlar serverin yoxlamasından keçir (5 dil, düymə dil prefiksi ilə)', () => {
    const btn = { whatsnew: '/whats-new', ramadan: '/ramadan', jumuah: '/jamaat', quran: '/quran' }
    for (const t of MAIL_TEMPLATES.filter((x) => x.id !== 'plain')) {
      const v = mc.validContent({ mode: 'perLang', header: 'gif', theme: t.theme, fallback: 'en', versions: t.versions }, ORIGIN)
      expect(v.error, t.id).toBeUndefined()
      expect(Object.keys(v.content.versions)).toEqual(LANGS)
      if (btn[t.id]) {
        expect(v.content.versions.az.ctaUrl).toBe(`${ORIGIN}${btn[t.id]}`)
        expect(v.content.versions.ar.ctaUrl).toBe(`${ORIGIN}/ar${btn[t.id]}`)
      }
      // ərəbcə mətndə latın hərfi yalnız sayt adıdır
      for (const f of ['subject', 'body', 'ctaLabel']) expect(t.versions.ar[f].replace(/Muslims\.cc/g, '')).not.toMatch(/[A-Za-z]/)
      // emoji yoxdur
      for (const l of LANGS) expect(JSON.stringify(t.versions[l])).not.toMatch(/\p{Extended_Pictographic}/u)
    }
    const plain = MAIL_TEMPLATES.find((x) => x.id === 'plain')
    for (const l of LANGS) expect(plain.versions[l]).toEqual({ subject: '', body: '', ctaLabel: '', ctaUrl: '' })
  })

  it('public/email: hər mövzunun GIF-i (600×220, ≤ 350 KB) və kiçik şəkli var', () => {
    for (const [t, P] of Object.entries(CAMPAIGN_THEMES)) {
      const gif = path.join(ROOT, 'public', P.img)
      const buf = fs.readFileSync(gif)
      expect(buf.subarray(0, 6).toString('latin1'), t).toBe('GIF89a')
      expect(buf.readUInt16LE(6)).toBe(600)
      expect(buf.readUInt16LE(8)).toBe(220)
      expect(buf.length).toBeLessThanOrEqual(350 * 1024)
      if (t !== 'emerald') expect(P.img).toBe(`/email/header-${t}-v1.gif`)
      expect(fs.existsSync(path.join(ROOT, 'public', themeThumb(t))), `thumb ${t}`).toBe(true)
    }
  })
})
