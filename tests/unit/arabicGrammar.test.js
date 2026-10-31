// Ərəb kursu — qrammatika və lüğət dərslərinin məlumatı (src/data/arabicGrammar.js, quranWords.js)
// və Allahın adları bələdçisi (src/data/namesGuide.js)
import { describe, it, expect } from 'vitest'
import {
  PRONOUNS_DETACHED, PRONOUNS_ATTACHED, DEMONSTRATIVES, NOMINAL_EXAMPLES, VERBAL_EXAMPLES, VERB_FORMS, GRAMMAR_TEXT,
} from '../../src/data/arabicGrammar.js'
import { QURAN_WORDS, QURAN_WORDS_TOTAL, QURAN_WORDS_TOP_SUM } from '../../src/data/quranWords.js'
import { VIRTUE, IHSA, NAME_RULES, ATTR_RULES } from '../../src/data/namesGuide.js'

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const filled5 = (o) => LANGS.every(l => typeof o?.[l] === 'string' && o[l].trim().length > 0)
const ARABIC = /^[؀-ۿݐ-ݿ\s]+$/
const REF = /^\d{1,3}:\d{1,3}$/

describe('Qrammatika dərsləri', () => {
  it('əvəzlik və işarə kartları: ərəbcə, transliterasiya, 5 dildə məna; nümunədə vurğulanan söz var', () => {
    for (const x of [...PRONOUNS_DETACHED, ...PRONOUNS_ATTACHED, ...DEMONSTRATIVES]) {
      expect(x.ar.length, x.id).toBeGreaterThan(1)
      expect(x.tl.length, x.id).toBeGreaterThan(1)
      expect(filled5(x.m), x.id).toBe(true)
      if (!x.ex) continue
      expect(x.ex.ref, x.id).toMatch(REF)
      expect(ARABIC.test(x.ex.w), x.id).toBe(true)
      expect(x.ex.w.includes(x.ex.hl), x.id).toBe(true)
      expect(filled5(x.ex.t), x.id).toBe(true)
    }
    expect(new Set([...PRONOUNS_DETACHED, ...PRONOUNS_ATTACHED].map(x => x.id)).size).toBe(PRONOUNS_DETACHED.length + PRONOUNS_ATTACHED.length)
    expect(DEMONSTRATIVES.filter(d => d.near).length).toBeGreaterThan(0)
    expect(DEMONSTRATIVES.filter(d => !d.near).length).toBeGreaterThan(0)
  })

  it('cümlə nümunələri: düzgün rollar, ismi cümlədə mübtəda+xəbər, feli cümlədə fel', () => {
    for (const ex of NOMINAL_EXAMPLES) {
      const roles = ex.parts.map(p => p[1])
      expect(roles, ex.ref).toContain('m')
      expect(roles, ex.ref).toContain('k')
      expect(filled5(ex.t)).toBe(true)
    }
    for (const ex of VERBAL_EXAMPLES) {
      const roles = ex.parts.map(p => p[1])
      expect(roles, ex.ref).toContain('v')
      for (const r of roles) expect(['v', 'f', 'o', 'x']).toContain(r)
      expect(filled5(ex.t)).toBe(true)
    }
    for (const ex of [...NOMINAL_EXAMPLES, ...VERBAL_EXAMPLES]) {
      expect(ex.ref).toMatch(REF)
      for (const [w] of ex.parts) expect(ARABIC.test(w), ex.ref).toBe(true)
      // Variantlar (yoxlamada) təkrarlanmasın
      expect(new Set(ex.parts.map(p => p[0])).size, ex.ref).toBe(ex.parts.length)
    }
    for (const f of VERB_FORMS) { expect(filled5(f.name)).toBe(true); expect(f.ex.ref).toMatch(REF) }
  })

  it('izah mətnləri 5 dildə', () => {
    const walk = (o) => {
      if (o && typeof o === 'object' && 'az' in o && 'en' in o) { expect(filled5(o)).toBe(true); return }
      for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v)
    }
    walk(GRAMMAR_TEXT)
  })
})

describe('Quranın ən çox işlənən 100 sözü', () => {
  it('100 söz, sıra ardıcıl, say azalan, mənalar 5 dildə, istinad düzgün', () => {
    expect(QURAN_WORDS).toHaveLength(100)
    QURAN_WORDS.forEach((w, i) => {
      expect(w.r).toBe(i + 1)
      if (i) expect(w.n).toBeLessThanOrEqual(QURAN_WORDS[i - 1].n)
      expect(['noun', 'verb', 'particle']).toContain(w.cat)
      expect(w.ref).toMatch(REF)
      expect(filled5(w.m), w.ar).toBe(true)
    })
    expect(QURAN_WORDS.reduce((s, w) => s + w.n, 0)).toBe(QURAN_WORDS_TOP_SUM)
    expect(QURAN_WORDS_TOP_SUM / QURAN_WORDS_TOTAL).toBeGreaterThan(0.5)
  })

  it('hər dildə mənalar bir-birindən fərqlənir (yoxlamada eyni variant olmasın)', () => {
    for (const l of LANGS) {
      const seen = QURAN_WORDS.map(w => w.m[l])
      // Bir neçə eyni məna ola bilər (məs. «gəlmək»), amma çox deyil
      expect(seen.length - new Set(seen).size, l).toBeLessThanOrEqual(3)
    }
  })
})

describe('Allahın adları — bələdçi (İbn Useymin, «əl-Qavaid əl-Musla»)', () => {
  it('fəzilət hədisi: Buxari 2736, 7392; Müslim 2677', () => {
    expect(VIRTUE.ar).toContain('مَنْ أَحْصَاهَا دَخَلَ الْجَنَّةَ')
    expect(VIRTUE.ref.en).toContain('2736')
    expect(VIRTUE.ref.en).toContain('7392')
    expect(VIRTUE.ref.en).toContain('2677')
    expect(filled5(VIRTUE.text)).toBe(true)
  })

  it('ihsa — 3 mərtəbə; 7 + 7 qayda, hər biri 5 dildə, ayə istinadı ilə', () => {
    expect(IHSA).toHaveLength(3)
    for (const s of IHSA) { expect(filled5(s.title)).toBe(true); expect(filled5(s.text)).toBe(true) }
    expect(NAME_RULES).toHaveLength(7)
    expect(ATTR_RULES).toHaveLength(7)
    for (const r of [...NAME_RULES, ...ATTR_RULES]) {
      expect(filled5(r.title)).toBe(true)
      expect(filled5(r.text)).toBe(true)
      if (r.ayah) { expect(r.ayah.ref).toMatch(REF); expect(r.ayah.ar.length).toBeGreaterThan(5) }
    }
  })
})
