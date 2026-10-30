// AI cavabı üçün təhlükəsiz, kiçik markdown renderi — HTML YOX (dangerouslySetInnerHTML
// işlədilmir), yalnız React elementləri: abzas, siyahı, başlıq, sitat, **qalın**, *kursiv*,
// [mətn](ünvan) linki.
// `tail` — son blokun sonuna əlavə olunan element (axında yanıb-sönən kursor).

const INLINE = /\[([^\]\n]+)\]\(([^()\s]+)\)|\*\*([^*\n]+)\*\*|\*([^*\s][^*\n]*?)\*/g

// Link yalnız təhlükəsiz ünvana: http(s) və ya saytın daxili yolu ("/quran").
// javascript:, data:, "//başqa-sayt" və s. — link YOX, yalnız mətn göstərilir.
const SAFE_EXTERNAL = /^https?:\/\/[^\s]+$/i
const SAFE_INTERNAL = /^\/(?![/\\])[^\s]*$/

function link(label, href, key) {
  if (SAFE_INTERNAL.test(href)) return <a key={key} href={href}>{label}</a>
  if (SAFE_EXTERNAL.test(href)) {
    return <a key={key} href={href} target="_blank" rel="noopener noreferrer">{label}</a>
  }
  return label
}

function inline(text, key) {
  const out = []
  let last = 0
  let m
  INLINE.lastIndex = 0
  while ((m = INLINE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1] != null) out.push(link(m[1], m[2], `${key}-${m.index}`))
    else if (m[3] != null) out.push(<strong key={`${key}-${m.index}`}>{m[3]}</strong>)
    else out.push(<em key={`${key}-${m.index}`}>{m[4]}</em>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function parse(src) {
  const blocks = []
  let cur = null
  const flush = () => { if (cur) blocks.push(cur); cur = null }
  for (const raw of String(src || '').split('\n')) {
    const line = raw.trimEnd()
    let m
    if (!line.trim()) { flush(); continue }
    // Axında yarımçıq gəlmiş tək işarə ("-", "1.") — mətni gələnə qədər göstərmə
    if (/^\s*([-*•]|\d+[.)])\s*$/.test(line)) continue
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { flush(); continue }
    if ((m = line.match(/^\s*#{1,6}\s+(.*)$/))) { flush(); blocks.push({ type: 'h', lines: [m[1].replace(/\*\*/g, '')] }); continue }
    if ((m = line.match(/^\s*[-*•]\s+(.*)$/))) {
      if (!cur || cur.type !== 'ul') { flush(); cur = { type: 'ul', lines: [] } }
      cur.lines.push(m[1]); continue
    }
    if ((m = line.match(/^\s*(\d+)[.)]\s+(.*)$/))) {
      if (!cur || cur.type !== 'ol') { flush(); cur = { type: 'ol', lines: [], start: Number(m[1]) } }
      cur.lines.push(m[2]); continue
    }
    if ((m = line.match(/^\s*>\s?(.*)$/))) {
      if (!cur || cur.type !== 'q') { flush(); cur = { type: 'q', lines: [] } }
      cur.lines.push(m[1]); continue
    }
    if (!cur || cur.type !== 'p') { flush(); cur = { type: 'p', lines: [] } }
    cur.lines.push(line.trim())
  }
  flush()
  return blocks
}

const withBreaks = (lines, key) => lines.flatMap((l, i) => (i ? [<br key={`${key}-br${i}`} />, ...inline(l, `${key}-${i}`)] : inline(l, `${key}-${i}`)))

export default function AIMarkdown({ text, tail = null }) {
  const blocks = parse(text)
  if (!blocks.length) return tail
  const lastIdx = blocks.length - 1
  return blocks.map((b, i) => {
    const t = i === lastIdx ? tail : null
    const key = `b${i}`
    if (b.type === 'ul' || b.type === 'ol') {
      const Tag = b.type
      return (
        <Tag key={key} start={b.type === 'ol' && b.start !== 1 ? b.start : undefined}>
          {b.lines.map((l, j) => <li key={j}>{inline(l, `${key}-${j}`)}{j === b.lines.length - 1 ? t : null}</li>)}
        </Tag>
      )
    }
    if (b.type === 'h') return <p key={key} className="ai-md-h"><strong>{b.lines[0]}</strong>{t}</p>
    if (b.type === 'q') return <blockquote key={key}>{withBreaks(b.lines, key)}{t}</blockquote>
    return <p key={key}>{withBreaks(b.lines, key)}{t}</p>
  })
}
