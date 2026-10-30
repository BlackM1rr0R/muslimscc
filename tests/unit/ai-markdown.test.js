// AIMarkdown — AI cavabındakı [mətn](ünvan) linkləri təhlükəsiz göstərilir
import { describe, it, expect } from 'vitest'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Vitest (node) JSX-i klassik rejimdə çevirir — komponent React qlobalını gözləyir
globalThis.React = React
const { default: AIMarkdown } = await import('../../src/components/AIMarkdown.jsx')

const html = (text) => renderToStaticMarkup(createElement(AIMarkdown, { text }))

describe('AIMarkdown linkləri', () => {
  it('xarici https link yeni tabda, noopener ilə', () => {
    const out = html('Bax: [Sunnah.com](https://sunnah.com/muslim:671)')
    expect(out).toContain('<a href="https://sunnah.com/muslim:671" target="_blank" rel="noopener noreferrer">Sunnah.com</a>')
    expect(out).not.toContain('](')
  })
  it('daxili yol adi link', () => {
    expect(html('[Namaz vaxtları](/prayer)')).toContain('<a href="/prayer">Namaz vaxtları</a>')
  })
  it('təhlükəli ünvan — link yox, yalnız mətn', () => {
    for (const bad of ['javascript:alert(1)', 'data:text/html,x', '//evil.example', 'ftp://x']) {
      const out = html(`[klik](${bad})`)
      expect(out).not.toContain('<a')
      expect(out).toContain('klik')
    }
  })
  it('qalın və kursiv əvvəlki kimi işləyir', () => {
    expect(html('**qalın** və *kursiv*')).toBe('<p><strong>qalın</strong> və <em>kursiv</em></p>')
  })
})
