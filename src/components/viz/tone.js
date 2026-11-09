// viz — ton → CSS rəngi. 1–4 kateqorial (sabit sıra, dövr etmir), ya da semantik ad.
export function vizColor(tone = 1) {
  if (typeof tone === 'number') return `var(--viz-${((tone - 1) % 4) + 1})`
  const map = {
    brand: 'var(--viz-1)', accent: 'var(--viz-2)', blue: 'var(--viz-3)', plum: 'var(--viz-4)',
    ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)', note: 'var(--note)',
    muted: 'var(--line-strong)',
  }
  return map[tone] || tone
}
