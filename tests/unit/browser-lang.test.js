// İlk gəlişdə dil seçimi — brauzer dili (src/utils/browserLang.js)
import { describe, it, expect } from 'vitest'
import { pickBrowserLang, canAutoRedirect } from '../../src/utils/browserLang.js'

const S = ['az', 'en', 'ru', 'ar', 'tr']

describe('pickBrowserLang', () => {
  it('dəstəklənən ilk dil seçilir (bölgə kodu atılır)', () => {
    expect(pickBrowserLang(['ru-RU', 'en'], 'Europe/Moscow', S)).toBe('ru')
    expect(pickBrowserLang(['tr'], 'Europe/Istanbul', S)).toBe('tr')
    expect(pickBrowserLang(['ar-SA'], 'Asia/Riyadh', S)).toBe('ar')
    expect(pickBrowserLang(['de-DE', 'en-US'], 'Europe/Berlin', S)).toBe('en')
  })
  it('az siyahıda varsa və ya saat qurşağı Bakıdırsa — az', () => {
    expect(pickBrowserLang(['en-US', 'az'], 'America/New_York', S)).toBe('az')
    expect(pickBrowserLang(['ru-RU'], 'Asia/Baku', S)).toBe('az')
  })
  it('heç biri dəstəklənmirsə — ingiliscə', () => {
    expect(pickBrowserLang(['id-ID', 'ms'], 'Asia/Jakarta', S)).toBe('en')
    expect(pickBrowserLang([], '', S)).toBe('en')
  })
})

describe('canAutoRedirect', () => {
  it('robot və avtomatlaşdırılmış brauzer yönləndirilmir', () => {
    expect(canAutoRedirect({ userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)' })).toBe(false)
    expect(canAutoRedirect({ userAgent: 'Mozilla/5.0 Chrome/130', webdriver: true })).toBe(false)
    expect(canAutoRedirect({ userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/130 Safari/537.36' })).toBe(true)
    expect(canAutoRedirect(null)).toBe(false)
  })
})
