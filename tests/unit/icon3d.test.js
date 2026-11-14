import { describe, it, expect } from 'vitest'
import React, { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
globalThis.React = React

describe('Icon3D', () => {
  it('bütün fiqurlar render olunur, id-lər hər nüsxədə unikal, dekorativdir', async () => {
    const { default: Icon3D, ICON3D_NAMES } = await import('../../src/components/Icon3D.jsx')
    expect(ICON3D_NAMES.length).toBeGreaterThanOrEqual(21)
    for (const n of ['prayer', 'quran', 'learn', 'hadith', 'prayerguide', 'duas', 'dhikr', 'names', 'qibla', 'calendar', 'zakat', 'jamaat']) expect(ICON3D_NAMES).toContain(n)
    const html = renderToStaticMarkup(h('div', null, ...ICON3D_NAMES.map(n => h(Icon3D, { key: n, name: n }))))
    expect(html).not.toMatch(/NaN|undefined/)
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(ICON3D_NAMES.length)
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(m => m[1])
    expect(new Set(ids).size).toBe(ids.length)
    // naməlum ad — xətti ikon kafeldə (fallback)
    expect(renderToStaticMarkup(h(Icon3D, { name: 'analytics' }))).toContain('foreignObject')
  })
})
