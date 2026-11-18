// K mərhələsi yazıları: açıq profildə ibadət sayı yoxdur, "dua etdim" ingiliscədə "made dua",
// server xəta kodu ({ code } və ya { error }) düzgün oxunur.
import { describe, it, expect } from 'vitest'
import { PP, FD, DW, PUB, PUBLIC_FIELDS, PUBLIC_STAMP_IDS, apiErrCode } from '../../src/components/account/communityText.js'
import { VE } from '../../src/components/account/verifyEmailText.js'
import { STAMP_IDS } from '../../src/utils/passport.js'

const LANGS = ['az', 'en', 'ru', 'tr', 'ar']

describe('açıq profil — ibadət sayı göstərilmir', () => {
  it('sahələr: yalnız ad, künyə, möhürlər, bio, sevimli surə', () => {
    expect(PUBLIC_FIELDS).toEqual(['displayName', 'kunya', 'stamps', 'bio', 'favSurah'])
  })
  it('möhürlər: yalnız öyrənmə möhürləri (hamısı passport-da var, ibadət möhürü yoxdur)', () => {
    expect(PUBLIC_STAMP_IDS).toEqual(['names_99', 'hijra', 'sahaba', 'arabic', 'hifz_surah'])
    for (const id of PUBLIC_STAMP_IDS) expect(STAMP_IDS).toContain(id)
    for (const id of ['khatm', 'fajr_40', 'dhikr_1000', 'kahf_4', 'ummah_khatm']) expect(PUBLIC_STAMP_IDS).not.toContain(id)
  })
  it('5 dildə xətm/ümmət xətmi yazısı qalmayıb, qeyd və moderasiya mətni var', () => {
    for (const l of LANGS) {
      expect(Object.keys(PP[l].fields).sort(), l).toEqual([...PUBLIC_FIELDS].sort())
      expect(PUB[l].khatms, l).toBeUndefined()
      expect(PUB[l].ummah, l).toBeUndefined()
      expect(PP[l].worshipNote, l).toBeTruthy()
      expect(PP[l].moderated, l).toBeTruthy()
    }
    expect(PP.en.moderated).toBe('A moderator has hidden this profile.')
  })
})

describe('dua yazıları — "prayed" namaz kimi oxunmasın', () => {
  it('en: made dua (tam ifadə, cəm üçün ayrıca)', () => {
    expect(DW.en.pray).toBe('I made dua')
    expect(DW.en.prayed).toBe('You made dua')
    expect(DW.en.count(1)).toBe('1 person made dua')
    expect(DW.en.count(3)).toBe('3 people made dua')
    expect(FD.en.prayed).toBe('I made dua for you')
    expect(FD.en.prayedDone).toBe('You made dua')
    expect(FD.en.count(2)).toBe('2 people made dua')
    // Yalnız dəyərlər (açar adları — prayed, pray — kodun içindədir)
    const vals = (o) => (typeof o === 'string' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(vals) : [])
    const all = [...vals(DW.en), ...vals(FD.en), DW.en.count(5), FD.en.count(5)].join(' | ')
    expect(all).not.toMatch(/\bprayed\b|\bpray for\b|who pray\b/i)
  })
  it('boş divar mətni və düymə 5 dildə', () => {
    for (const l of LANGS) {
      expect(DW[l].empty, l).toBeTruthy()
      expect(DW[l].emptyWrite, l).toBeTruthy()
    }
  })
})

describe('apiErrCode — B1 müqaviləsi', () => {
  it('{ code } və { error } hər ikisi', () => {
    expect(apiErrCode({ code: 'verify_email' })).toBe('verify_email')
    expect(apiErrCode({ code: '', body: { error: 'moderated' } })).toBe('moderated')
    expect(apiErrCode({ body: { code: 'verify_email' } })).toBe('verify_email')
    expect(apiErrCode(null)).toBe('')
    expect(apiErrCode(new TypeError('net'))).toBe('')
  })
  it('VE 5 dildə tamdır', () => {
    for (const l of LANGS) for (const k of ['need', 'resend', 'resent', 'failed']) expect(VE[l][k], `${l}.${k}`).toBeTruthy()
    expect(VE.en.need).toBe('Confirm your email to use this.')
  })
})
