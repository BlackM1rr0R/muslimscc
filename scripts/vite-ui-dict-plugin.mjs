// ═══════════════════════════════════════════════════════
// Vite plagini: interfeys fayllarındakı hər 5 dilli obyekti ({ az, en, ru, … })
// __uiReg(...) ilə qeydiyyata salır (src/utils/uiText.js).
//
// NİYƏ: komponentlər yazını onlarla fərqli üsulla seçir (LABELS[lang] || …,
// L[k][lk], TXT[key][lang], pick(o, lang) …). Əlavə dildə (/id/…) interfeys
// ingiliscədir; qeydiyyatdakı obyektlərin "en" dəyəri dil lüğəti ilə yerində
// əvəz olunur — seçim üsulundan asılı olmayaraq hər yazı tərcümə olunur.
// Lüğət yoxdursa (5 əsas dil) obyektlərə toxunulmur.
//
// Fayl dəsti scripts/extract-ui-strings.mjs-in topladığı ilə EYNİDİR (oradan
// UI_FILE_RE). src/data/-nın dini mətnləri (hədis, dua, dərs…) QƏSDƏN kənardadır.
// ═══════════════════════════════════════════════════════
import { createRequire } from 'node:module'
import MagicString from 'magic-string'

const require = createRequire(import.meta.url)
const espree = require('espree')

export const UI_FILE_RE = /[\\/]src[\\/](components|pages|data[\\/]guides|data[\\/]pageGuides)[\\/].*\.jsx?$|[\\/]src[\\/]App\.jsx$|[\\/]src[\\/]data[\\/](navigation|i18n)\.js$/
const CORE = new Set(['az', 'en', 'ru', 'ar', 'tr'])
const keyName = (p) => (p.key.type === 'Identifier' ? p.key.name : p.key.type === 'Literal' ? String(p.key.value) : null)

/** Kodda 5 dilli obyektlərin [start, end] aralıqları. */
export function langObjectRanges(code) {
  const ast = espree.parse(code, { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true }, range: true })
  const out = []
  const visit = (node, parent) => {
    if (!node || typeof node.type !== 'string') return
    if (node.type === 'ObjectExpression') {
      const names = node.properties.filter(p => p.type === 'Property').map(keyName)
      const n = names.filter(x => CORE.has(x)).length
      // Obyektin özü sabit qiymət olmalıdır (JSX atributunda/funksiya
      // çağırışında yaradılan müvəqqəti obyekt də olar — WeakRef ilə izlənir)
      if (names.includes('en') && n >= 2 && parent?.type !== 'AssignmentPattern') out.push(node.range)
    }
    for (const k of Object.keys(node)) {
      if (k === 'range' || k === 'loc') continue
      const v = node[k]
      if (Array.isArray(v)) v.forEach(x => visit(x, node))
      else if (v && typeof v.type === 'string') visit(v, node)
    }
  }
  visit(ast, null)
  return out
}

export default function uiDictPlugin() {
  return {
    name: 'muslims-ui-dict',
    enforce: 'pre',
    transform(code, id) {
      const file = id.split('?')[0]
      if (!UI_FILE_RE.test(file) || file.includes('node_modules')) return null
      if (!/\ben\s*:/.test(code)) return null
      let ranges
      try { ranges = langObjectRanges(code) } catch { return null }
      if (!ranges.length) return null
      const s = new MagicString(code)
      for (const [a, b] of ranges) {
        s.appendLeft(a, '__uiReg(')
        s.prependRight(b, ')')
      }
      s.prepend("import { __uiReg } from '/src/utils/uiText.js';\n")
      return { code: s.toString(), map: s.generateMap({ hires: true }) }
    },
  }
}
