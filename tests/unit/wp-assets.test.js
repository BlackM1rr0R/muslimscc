// WordPress.org: readme.txt qaydaları (scripts/check-wp-readme.mjs), kataloq şəkilləri (wordpress/assets/)
// və onların plagin zip-inə DÜŞMƏMƏSİ (SVN assets/ ayrıca qovluqdur).
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { readZip, buildPluginZip } from '../../scripts/build-wp-plugin.mjs'
import {
  parseReadme, parsePluginHeader, validateReadme, checkAssets, checkAll, screenshotCaptions, pngSize,
  ASSETS_DIR, PLUGIN_DIR, SHORT_DESC_MAX,
} from '../../scripts/check-wp-readme.mjs'

const readmeText = fs.readFileSync(path.join(PLUGIN_DIR, 'readme.txt'), 'utf8')
const headerText = fs.readFileSync(path.join(PLUGIN_DIR, 'muslimscc-prayer-times.php'), 'utf8')

describe('plagin zip-i və wordpress/assets', () => {
  it('zip-də assets/ və şəkil faylı yoxdur', () => {
    const names = readZip(buildPluginZip()).map(e => e.name)
    expect(names.length).toBeGreaterThan(5)
    expect(names.some(n => /(^|\/)assets\//.test(n))).toBe(false)
    expect(names.some(n => /\.(png|jpe?g|gif|webp|svg)$/i.test(n))).toBe(false)
    expect(names.some(n => /(icon|banner|screenshot)-/.test(n))).toBe(false)
  })

  it('assets plagin qovluğunun içində deyil', () => {
    expect(path.relative(PLUGIN_DIR, ASSETS_DIR).startsWith('..')).toBe(true)
  })

  it('ikon/banner ölçüləri düzgündür, cəmi < 1.5 MB, 4 ekran şəkli', () => {
    const { errors, screenshots, total } = checkAssets()
    expect(errors).toEqual([])
    expect(screenshots.sort()).toEqual([1, 2, 3, 4])
    expect(total).toBeLessThan(1.5 * 1024 * 1024)
    for (const n of [1, 2, 3, 4]) {
      const s = pngSize(fs.readFileSync(path.join(ASSETS_DIR, `screenshot-${n}.png`)))
      expect(s.width, `screenshot-${n}`).toBeGreaterThanOrEqual(1000)
    }
  })

  it('pngSize PNG olmayanı rədd edir', () => {
    expect(pngSize(Buffer.from('not a png at all, definitely'))).toBe(null)
  })
})

describe('readme.txt (wordpress.org qaydaları)', () => {
  it('real readme bütün yoxlamalardan keçir', () => {
    expect(checkAll().errors).toEqual([])
  })

  it('sahələr təhlil olunur, qısa təsvir ≤ 150, etiket ≤ 5, Screenshots başlıqları 4', () => {
    const r = parseReadme(readmeText)
    expect(r.name).toBe('Muslims.cc Prayer Times')
    expect(r.fields['Stable tag']).toBe(parsePluginHeader(headerText).Version)
    expect([...r.shortDescription].length).toBeLessThanOrEqual(SHORT_DESC_MAX)
    expect(r.fields.Tags.split(',').length).toBeLessThanOrEqual(5)
    expect(r.fields['Tested up to']).toMatch(/^\d+\.\d+$/)
    expect(screenshotCaptions(r.sections.Screenshots).map(c => c.n)).toEqual([1, 2, 3, 4])
    expect(r.sections['External services']).toMatch(/muslims\.cc/)
  })

  it('pozuntuları tutur', () => {
    const bad = readmeText
      .replace(/^Tags: .*$/m, 'Tags: a, b, c, d, e, f')
      .replace(/^Tested up to: .*$/m, 'Tested up to: 7.1.5')
      .replace(/^Stable tag: .*$/m, 'Stable tag: trunk')
      .replace(/^Contributors: .*$/m, 'Contributors: Muslims CC')
      .replace(/^Today's prayer times.*$/m, 'x'.repeat(151))
      .replace(/== Changelog ==/, '== Changelog_ ==')
    const errs = validateReadme(parseReadme(bad), parsePluginHeader(headerText), [1, 2, 3])
    const all = errs.join('\n')
    expect(all).toMatch(/Tags: 6 etiket/)
    expect(all).toMatch(/Tested up to: "7\.1\.5"/)
    expect(all).toMatch(/Stable tag "trunk"/)
    expect(all).toMatch(/Contributors: "Muslims CC"/)
    expect(all).toMatch(/qısa təsvir 151 simvol/)
    expect(all).toMatch(/== Changelog ==/)
    expect(all).toMatch(/Screenshots başlıqları \[1,2,3,4\] ≠ assets\/screenshot-N\.png \[1,2,3\]/)
  })

  it('ad və versiya plagin başlığı ilə uyğun olmalıdır', () => {
    const errs = validateReadme(parseReadme(readmeText), { 'Plugin Name': 'Other', Version: '9.9.9', 'Requires PHP': '8.0' })
    expect(errs.join('\n')).toMatch(/plagində "Other"/)
    expect(errs.join('\n')).toMatch(/≠ plagin Version 9\.9\.9/)
    expect(errs.join('\n')).toMatch(/Requires PHP/)
  })
})
