// AI cavabına 👎 hesabatının mətni (utils/aiReport → components/AIRating)
import { it, expect } from 'vitest'
import { aiReportText } from '../../src/utils/aiReport.js'

it('səbəb, qeyd, sual və cavab ayrıca bölmələrdə; uzun cavab kəsilir', () => {
  const t = aiReportText({ reason: 'source', note: '  Buxari 1172  ', question: ' Sual? ', answer: 'C'.repeat(20000) })
  expect(t.startsWith('[source] Buxari 1172\n\n— Sual:\nSual?\n\n— Cavab:\n')).toBe(true)
  expect(t.length).toBeLessThan(12000)          // server limiti (MAX_TEXT_AI)
  expect(aiReportText({ reason: 'wrong', question: 'q', answer: 'a' })).toBe('[wrong]\n\n— Sual:\nq\n\n— Cavab:\na')
})
