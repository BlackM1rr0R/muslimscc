// Hüquqi sənədlər (src/pages/PrivacyPage.jsx, TermsPage.jsx → components/LegalDocument.jsx), 5 dil:
// serverdə render olunur — bölmələr bütün dillərdə eyni quruluşdadır (siyahı və cədvəl sətirlərinin sayı),
// doldurulmamış {yer tutucu} qalmır, daxili lövbərlər mövcud bölməyə aparır, tarix BRAND.legal-dandır.
// 2026-11-25 auditi: "hesab yoxdur" / "kuki qoymur" kimi köhnəlmiş iddialar geri qayıtmasın.
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { BRAND } from '../../src/config/brand.js'

const state = vi.hoisted(() => ({ lang: 'en' }))
vi.mock('../../src/contexts/LangContext', () => ({ useLang: () => ({ lang: state.lang }) }))

const LANGS = ['az', 'en', 'ru', 'tr', 'ar']
let React, renderToString, PrivacyPage, TermsPage

beforeAll(async () => {
  React = (await import('react')).default
  ;({ renderToString } = await import('react-dom/server'))
  globalThis.React = React   // vitest-də JSX klassik rejimdədir
  PrivacyPage = (await import('../../src/pages/PrivacyPage.jsx')).default
  TermsPage = (await import('../../src/pages/TermsPage.jsx')).default
})

function render(Page, lang) {
  state.lang = lang
  return renderToString(React.createElement(Page, {}))
}

/** <section id> → { li, tr, p } sayları (məzmun cədvəli <nav>-dadır, sayılmır) */
function shape(html) {
  const out = []
  for (const m of html.matchAll(/<section[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)) {
    const body = m[2]
    out.push({ id: m[1], li: (body.match(/<li\b/g) || []).length, tr: (body.match(/<tr\b/g) || []).length, p: (body.match(/<p\b/g) || []).length })
  }
  return out
}

describe('Məxfilik siyasəti — 5 dil', () => {
  it('bütün dillərdə eyni bölmələr, eyni sayda siyahı bəndi və cədvəl sətri', () => {
    const en = shape(render(PrivacyPage, 'en'))
    expect(en.map(s => s.id)).toEqual(expect.arrayContaining(['summary', 'local', 'sync', 'cookies', 'analytics', 'account', 'email', 'accountdata', 'community', 'push', 'telegram', 'ai', 'location', 'feedback', 'embeds', 'thirdparty', 'children', 'contact']))
    expect(new Set(en.map(s => s.id)).size).toBe(en.length)
    for (const lang of LANGS) expect(shape(render(PrivacyPage, lang)), lang).toEqual(en)
  })

  it('doldurulmamış yer tutucu, boş role="alert" yoxdur; daxili lövbərlər mövcud bölməyə aparır', () => {
    for (const lang of LANGS) {
      const html = render(PrivacyPage, lang)
      expect(html.match(/\{[A-Za-z]\w*\}/g), lang).toBe(null)
      expect(html, lang).not.toMatch(/role="alert"/)
      const ids = new Set(shape(html).map(s => s.id))
      for (const [, id] of html.matchAll(/<a href="#([^"]+)"/g)) expect(ids.has(id), `${lang} #${id}`).toBe(true)
      expect(html, lang).toContain('href="#sync"')
      expect(html, lang).toContain('href="#feedback"')
    }
  })

  it('son yenilənmə tarixi BRAND.legal.effectiveDate (2026-11-25)', () => {
    expect(BRAND.legal.effectiveDate).toBe('2026-11-25')
    expect(render(PrivacyPage, 'en')).toContain('<time dateTime="2026-11-25">25 November 2026</time>')
    expect(render(PrivacyPage, 'az')).toContain('25 noyabr 2026')
  })

  it('kodla uyğun iddialar: hesab istəyə bağlıdır, iki giriş kukisi, Resend, ixrac; köhnə "hesab yoxdur" yoxdur', () => {
    const en = render(PrivacyPage, 'en')
    expect(en).toContain('An account is optional.')
    expect(en).toContain('__Host-mcc_user')
    expect(en).toContain('__Host-mcc_dev')
    expect(en).toContain('Resend')
    expect(en).toContain('“My data”')
    // Köhnə iddialar (2026-10 mətni); "**…**" HTML-də <strong> kimi çıxır. Vidcet üçün "sets no cookies" doğrudur.
    expect(en).not.toMatch(/No accounts|<strong>sets no cookies<\/strong>|Because there are no accounts|Since there are no accounts/)
    const az = render(PrivacyPage, 'az')
    expect(az).toContain('Hesab istəyə bağlıdır.')
    expect(az).not.toMatch(/Hesab və qeydiyyat yoxdur|<strong>kuki qoymur<\/strong>|Hesab olmadığı üçün/)
    expect(render(PrivacyPage, 'ru')).not.toMatch(/Нет учётных записей и регистрации|не устанавливает файлы куки|учётных записей нет/i)
    expect(render(PrivacyPage, 'tr')).not.toMatch(/Hesap ve üyelik yok|<strong>çerez kullanmaz<\/strong>|Hesap olmadığı/)
    expect(render(PrivacyPage, 'ar')).not.toMatch(/لا حسابات ولا تسجيل|لا يضع .* أي ملفات|لأنه لا توجد حسابات/)
  })

  it('ərəbcə mətn ərəb hərfləri ilə, ingiliscə mətndə Azərbaycan/Türk hərfi yoxdur', () => {
    const ar = render(PrivacyPage, 'ar')
    expect(ar).toContain('سياسة الخصوصية')
    const en = render(PrivacyPage, 'en').replace(/<[^>]+>/g, ' ')
    expect(en).not.toMatch(/[əğış]/)
  })
})

describe('İstifadə şərtləri — 5 dil', () => {
  it('hesab və dərc olunan məzmun bölməsi hər dildə; quruluş eynidir; "hesab lazım deyil" iddiası yoxdur', () => {
    const en = shape(render(TermsPage, 'en'))
    expect(en.map(s => s.id)).toContain('accounts')
    for (const lang of LANGS) expect(shape(render(TermsPage, lang)), lang).toEqual(en)
    const html = render(TermsPage, 'en')
    expect(html).toContain('An account is optional.')
    expect(html).not.toContain('no account is needed')
    expect(html.match(/\{[A-Za-z]\w*\}/g)).toBe(null)
    // Məxfilik siyasətinə keçid (page:privacy) — saytdaxili ünvan
    expect(html).toMatch(/<a href="\/en\/privacy"[^>]*>Privacy Policy<\/a>/)
  })
})
