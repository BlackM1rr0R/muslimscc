// ═══════════════════════════════════════════════════════
// IslamicCrossword — uşaqlar və ailə üçün İslami krossvord (/kids)
//
// • Sözlər və ipucları saytın öz məlumatındandır (utils/kidsWordData.js):
//   peyğəmbərlərin adları + qısa təsviri, surə adları + mənası (nömrə, ayə
//   sayı), Allahın adları + mənası (KidsPage siyahısı). Yeni dini mətn yoxdur.
// • Sözlər UI dilinin əlifbası ilə (az/en/ru/tr), ərəbcədə ərəb hərfləri ilə
//   (şəbəkə sağdan sola). Generator deterministikdir (utils/crossword.js):
//   eyni toxum → eyni krossvord; "Yeni krossvord" toxumu bir artırır.
// • Ekranda oynanır: hərf yaz, ox düymələri, "Yoxla", "Hərf aç".
// • "Çap et": krossvord + ipucları birinci səhifədə, cavablar ikinci səhifədə.
//   Çap bölməsi <body>-yə portal ilə qoyulur, @media print yalnız onu göstərir
//   (KidsCertificate ilə eyni üsul).
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { generateCrossword, wordCells, hashSeed, CW_LEVELS } from '../utils/crossword'
import { crosswordEntries, cwKey, WORD_THEMES } from '../utils/kidsWordData'
import '../styles/IslamicCrossword.css'

const T = {
  az: { ey: 'Uşaqlar və ailə', title: 'İslami krossvord', lead: 'Peyğəmbərlərin, surələrin və Allahın adlarının krossvordu. İpucları saytın öz bölmələrindən götürülüb. Ekranda həll edin və ya çap edib bütün ailə ilə doldurun.',
    themeL: 'Mövzu', levelL: 'Çətinlik', themes: { prophets: 'Peyğəmbərlər', surahs: 'Surələr', names: 'Allahın adları' }, levels: { easy: 'Asan', medium: 'Orta', hard: 'Çətin' },
    across: 'Üfüqi', down: 'Şaquli', check: 'Yoxla', reveal: 'Hərf aç', fresh: 'Yeni krossvord', print: 'Çap et', words: (n) => `${n} söz`,
    solved: 'Afərin! Krossvord həll olundu.', wrong: (n) => `${n} xana səhvdir — qırmızı ilə göstərildi.`, empty: (n) => `Hələ ${n} boş xana var.`, allOk: 'Yazdıqlarınız düzdür, davam edin!',
    cell: (r, c) => `Sətir ${r}, sütun ${c}`, key: 'Cavablar', printFoot: 'muslims.cc — İslami krossvord', src: 'Mənbə: saytın «İslam tarixi» (peyğəmbərlər), surə adları və «Uşaqlar» bölməsindəki Allahın adları.' },
  en: { ey: 'Kids & family', title: 'Islamic crossword', lead: 'A crossword of prophets, surahs and the names of Allah. The clues come from the site’s own sections. Solve it on screen, or print it and fill it in together as a family.',
    themeL: 'Theme', levelL: 'Difficulty', themes: { prophets: 'Prophets', surahs: 'Surahs', names: 'Names of Allah' }, levels: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
    across: 'Across', down: 'Down', check: 'Check', reveal: 'Reveal letter', fresh: 'New crossword', print: 'Print', words: (n) => `${n} words`,
    solved: 'Well done! The crossword is solved.', wrong: (n) => `${n} cells are wrong — shown in red.`, empty: (n) => `${n} cells are still empty.`, allOk: 'Everything you wrote is correct — keep going!',
    cell: (r, c) => `Row ${r}, column ${c}`, key: 'Answers', printFoot: 'muslims.cc — Islamic crossword', src: 'Source: the site’s Islamic history (prophets), surah names and the names of Allah from the Kids section.' },
  ru: { ey: 'Детям и семье', title: 'Исламский кроссворд', lead: 'Кроссворд о пророках, сурах и именах Аллаха. Подсказки взяты из разделов самого сайта. Решайте на экране или распечатайте и заполняйте всей семьёй.',
    themeL: 'Тема', levelL: 'Сложность', themes: { prophets: 'Пророки', surahs: 'Суры', names: 'Имена Аллаха' }, levels: { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный' },
    across: 'По горизонтали', down: 'По вертикали', check: 'Проверить', reveal: 'Открыть букву', fresh: 'Новый кроссворд', print: 'Печать', words: (n) => `слов: ${n}`,
    solved: 'Молодец! Кроссворд решён.', wrong: (n) => `Неверных клеток: ${n} — они отмечены красным.`, empty: (n) => `Пустых клеток: ${n}.`, allOk: 'Всё написанное верно — продолжайте!',
    cell: (r, c) => `Строка ${r}, столбец ${c}`, key: 'Ответы', printFoot: 'muslims.cc — исламский кроссворд', src: 'Источник: раздел сайта «Исламская история» (пророки), названия сур и имена Аллаха из детского раздела.' }, // lang-ok[muslims,cc]: адрес сайта
  ar: { ey: 'للأطفال والأسرة', title: 'كلمات متقاطعة إسلامية', lead: 'كلمات متقاطعة عن الأنبياء والسور وأسماء الله الحسنى، والتلميحات مأخوذة من أقسام الموقع نفسه. حُلّها على الشاشة أو اطبعها وحلّها مع الأسرة.',
    themeL: 'الموضوع', levelL: 'الصعوبة', themes: { prophets: 'الأنبياء', surahs: 'السور', names: 'أسماء الله' }, levels: { easy: 'سهل', medium: 'متوسط', hard: 'صعب' },
    across: 'أفقي', down: 'عمودي', check: 'تحقّق', reveal: 'اكشف حرفًا', fresh: 'شبكة جديدة', print: 'اطبع', words: (n) => `${n} كلمات`,
    solved: 'أحسنت! حُلّت الشبكة.', wrong: (n) => `${n} خانات خاطئة — مُعلَّمة بالأحمر.`, empty: (n) => `ما زالت ${n} خانات فارغة.`, allOk: 'كل ما كتبته صحيح، أكمل!',
    cell: (r, c) => `الصف ${r}، العمود ${c}`, key: 'الأجوبة', printFoot: 'muslims.cc — كلمات متقاطعة', src: 'المصدر: قسم التاريخ الإسلامي في الموقع (الأنبياء)، وأسماء السور، وأسماء الله من قسم الأطفال.' }, // lang-ok[muslims,cc]: عنوان الموقع
  tr: { ey: 'Çocuklar ve aile', title: 'İslami bulmaca', lead: 'Peygamberler, sureler ve Allah’ın isimleri üzerine bir bulmaca. İpuçları sitenin kendi bölümlerinden alındı. Ekranda çözün ya da yazdırıp bütün aileyle doldurun.',
    themeL: 'Konu', levelL: 'Zorluk', themes: { prophets: 'Peygamberler', surahs: 'Sureler', names: 'Allah’ın isimleri' }, levels: { easy: 'Kolay', medium: 'Orta', hard: 'Zor' },
    across: 'Soldan sağa', down: 'Yukarıdan aşağı', check: 'Kontrol et', reveal: 'Harf aç', fresh: 'Yeni bulmaca', print: 'Yazdır', words: (n) => `${n} kelime`,
    solved: 'Aferin! Bulmaca çözüldü.', wrong: (n) => `${n} kare yanlış — kırmızıyla gösterildi.`, empty: (n) => `Henüz ${n} boş kare var.`, allOk: 'Yazdıklarınız doğru, devam edin!',
    cell: (r, c) => `Satır ${r}, sütun ${c}`, key: 'Cevaplar', printFoot: 'muslims.cc — İslami bulmaca', src: 'Kaynak: sitenin «İslam tarihi» bölümü (peygamberler), sure adları ve «Çocuklar» bölümündeki Allah’ın isimleri.' },
}

const LEVELS = Object.keys(CW_LEVELS)
const todaySeed = () => { const d = new Date(); return hashSeed(d.getFullYear(), d.getMonth(), d.getDate()) % 100000 }
const k = (r, c) => `${r},${c}`

export default function IslamicCrossword() {
  const { lang } = useLang()
  const u = pickUi(T, lang, 'en')
  const [theme, setTheme] = useState('prophets')
  const [level, setLevel] = useState('medium')
  const [seed, setSeed] = useState(todaySeed)

  const puzzle = useMemo(
    () => generateCrossword(crosswordEntries(theme, lang), { seed: hashSeed(theme, level, seed), count: CW_LEVELS[level] }),
    [theme, level, seed, lang],
  )
  const pid = `${lang}-${theme}-${level}-${seed}`

  return (
    <section className="ui-card cw" data-testid="crossword" data-words={puzzle.words.length}>
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 className="cw__title">{u.title}</h2>
      <p className="cw__lead">{u.lead}</p>

      <div className="cw__opts">
        <div className="cw__group" role="group" aria-label={u.themeL}>
          {WORD_THEMES.map(t => (
            <button key={t} type="button" className="ui-chip" aria-pressed={theme === t} onClick={() => setTheme(t)}>{u.themes[t]}</button>
          ))}
        </div>
        <div className="cw__group" role="group" aria-label={u.levelL}>
          {LEVELS.map(l => (
            <button key={l} type="button" className="ui-chip" aria-pressed={level === l} onClick={() => setLevel(l)}>{u.levels[l]}</button>
          ))}
        </div>
      </div>

      <Board key={pid} puzzle={puzzle} lang={lang} u={u} title={`${u.title} — ${u.themes[theme]}`} onFresh={() => setSeed(s => s + 1)} />

      <p className="cw__src">{u.src}</p>
    </section>
  )
}

function Board({ puzzle, lang, u, title, onFresh }) {
  const rtl = lang === 'ar'
  const [fill, setFill] = useState({})
  const [marks, setMarks] = useState({})
  const [revealed, setRevealed] = useState({})
  const [msg, setMsg] = useState('')
  const [solved, setSolved] = useState(false)
  const [active, setActive] = useState(() => {
    const w = puzzle.words[0]
    return w ? { r: w.r, c: w.c, dir: w.dir } : null
  })
  const [printing, setPrinting] = useState(false)
  const refs = useRef({})

  // Xana → { a: söz, d: söz }
  const byCell = useMemo(() => {
    const m = {}
    for (const w of puzzle.words) for (const [r, c] of wordCells(w)) (m[k(r, c)] ||= {})[w.dir] = w
    return m
  }, [puzzle])

  const activeWord = active ? byCell[k(active.r, active.c)]?.[active.dir] : null
  const activeSet = useMemo(() => new Set(activeWord ? wordCells(activeWord).map(([r, c]) => k(r, c)) : []), [activeWord])

  const focus = useCallback((r, c) => { refs.current[k(r, c)]?.focus() }, [])

  const select = (r, c, dir) => {
    const w = byCell[k(r, c)]
    if (!w) return
    const d = dir && w[dir] ? dir : (w[active?.dir] ? active.dir : (w.a ? 'a' : 'd'))
    setActive({ r, c, dir: d })
  }

  const step = (r, c, dir, delta) => {
    const [dr, dc] = dir === 'a' ? [0, 1] : [1, 0]
    const nr = r + dr * delta, nc = c + dc * delta
    if (byCell[k(nr, nc)]) { setActive({ r: nr, c: nc, dir }); focus(nr, nc); return true }
    return false
  }

  const setCell = (r, c, ch) => {
    const key = k(r, c)
    if (revealed[key]) return
    setFill(f => ({ ...f, [key]: ch }))
    setMarks(m => { if (!m[key]) return m; const n = { ...m }; delete n[key]; return n })
    setMsg('')
  }

  const onInput = (r, c, e) => {
    const chars = [...(e.target.value || '')]
    if (!chars.length) { setCell(r, c, ''); return }
    const prev = fill[k(r, c)] || ''
    const keys = chars.map(x => cwKey(x, lang)).filter(Boolean)
    if (!keys.length) return
    // Yeni yazılan hərf: köhnədən fərqli olan (eyni hərf yenidən yazılıbsa — o)
    const ch = keys.find(x => x !== prev) || keys[keys.length - 1]
    setCell(r, c, ch)
    const dir = active?.dir || 'a'
    step(r, c, dir, 1)
  }

  const onKey = (r, c, e) => {
    const dir = active?.dir || 'a'
    const fwd = rtl ? -1 : 1
    if (e.key === 'Backspace') {
      if (!fill[k(r, c)] || revealed[k(r, c)]) {
        e.preventDefault()
        const [dr, dc] = dir === 'a' ? [0, 1] : [1, 0]
        if (step(r, c, dir, -1)) setCell(r - dr, c - dc, '')
      }
    } else if (e.key === 'ArrowRight') { e.preventDefault(); step(r, c, 'a', fwd) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(r, c, 'a', -fwd) }
    else if (e.key === 'ArrowDown') { e.preventDefault(); step(r, c, 'd', 1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); step(r, c, 'd', -1) }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const w = byCell[k(r, c)]
      if (w?.a && w?.d) setActive({ r, c, dir: dir === 'a' ? 'd' : 'a' })
    }
  }

  // Artıq aktiv olan xanaya yenidən toxunmaq istiqaməti dəyişir (fokus hadisəsindən əvvəl yadda saxlanır)
  const wasActive = useRef(false)
  const onCellDown = (r, c) => { wasActive.current = !!active && active.r === r && active.c === c }
  const onCellClick = (r, c) => {
    if (wasActive.current) {
      const w = byCell[k(r, c)]
      if (w?.a && w?.d) setActive({ r, c, dir: active.dir === 'a' ? 'd' : 'a' })
    } else select(r, c)
    wasActive.current = false
  }

  const letterCells = useMemo(() => Object.keys(byCell), [byCell])

  const check = () => {
    const m = {}
    let bad = 0, empty = 0
    for (const key of letterCells) {
      const [r, c] = key.split(',').map(Number)
      const v = fill[key]
      if (!v) { empty++; continue }
      const ok = v === puzzle.cells[r][c].ch
      m[key] = ok ? 'ok' : 'bad'
      if (!ok) bad++
    }
    setMarks(m)
    if (!bad && !empty) { setSolved(true); setMsg(u.solved) }
    else setMsg(bad ? u.wrong(bad) : `${u.allOk} ${u.empty(empty)}`)
  }

  const reveal = () => {
    let target = active ? k(active.r, active.c) : null
    // Aktiv xana doludursa və düzdürsə — aktiv sözün ilk boş/səhv xanası
    if (activeWord) {
      const cells = wordCells(activeWord).map(([r, c]) => k(r, c))
      const ok = (key) => { const [r, c] = key.split(',').map(Number); return fill[key] === puzzle.cells[r][c].ch }
      if (!target || ok(target)) target = cells.find(x => !ok(x)) || target
    }
    if (!target) return
    const [r, c] = target.split(',').map(Number)
    setFill(f => ({ ...f, [target]: puzzle.cells[r][c].ch }))
    setRevealed(v => ({ ...v, [target]: true }))
    setMarks(m => ({ ...m, [target]: 'ok' }))
    setActive(a => ({ r, c, dir: a?.dir || 'a' }))
    focus(r, c)
  }

  // Çap: portal yalnız çap anında çəkilir
  useEffect(() => {
    if (!printing) return undefined
    const html = document.documentElement
    html.classList.add('cw-printing')
    let t2 = 0
    const done = () => { html.classList.remove('cw-printing'); window.removeEventListener('afterprint', done); setPrinting(false) }
    window.addEventListener('afterprint', done)
    const t1 = setTimeout(() => { window.print(); t2 = setTimeout(done, 1000) }, 60)
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener('afterprint', done); html.classList.remove('cw-printing') }
  }, [printing])

  const across = puzzle.words.filter(w => w.dir === 'a')
  const down = puzzle.words.filter(w => w.dir === 'd')

  const clueList = (list, label) => (
    <div className="cw__clues-col">
      <h3 className="cw__clues-h">{label}</h3>
      <ol className="cw__clues">
        {list.map(w => (
          <li key={`${w.dir}${w.num}`}>
            <button type="button" className={`cw__clue${activeWord === w ? ' is-active' : ''}`}
              onClick={() => { setActive({ r: w.r, c: w.c, dir: w.dir }); focus(w.r, w.c) }}>
              <b className="ui-num">{w.num}</b> <span>{w.clue}</span> <span className="cw__len ui-num">({w.letters.length})</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )

  return (
    <div className={`cw__board${solved ? ' is-solved' : ''}`}>
      {activeWord && (
        <p className="cw__now" aria-live="polite">
          <b className="ui-num">{activeWord.num}</b> {activeWord.dir === 'a' ? u.across : u.down}: {activeWord.clue}
        </p>
      )}
      <div className="cw__layout">
        <div className="cw__gridwrap">
          <div className="cw__grid" dir={rtl ? 'rtl' : 'ltr'} lang={lang} style={{ '--cw-cols': puzzle.cols, '--cw-rows': puzzle.rows }}>
            {puzzle.cells.map((row, r) => row.map((cell, c) => {
              if (!cell) return <span key={k(r, c)} className="cw__void" aria-hidden="true" />
              const key = k(r, c)
              const cls = ['cw__cell']
              if (activeSet.has(key)) cls.push('is-word')
              if (active && active.r === r && active.c === c) cls.push('is-active')
              if (marks[key] === 'bad') cls.push('is-bad')
              if (marks[key] === 'ok') cls.push('is-ok')
              if (revealed[key]) cls.push('is-revealed')
              return (
                <span key={key} className={cls.join(' ')} onPointerDown={() => onCellDown(r, c)} onClick={() => onCellClick(r, c)}>
                  {cell.num > 0 && <span className="cw__num ui-num" aria-hidden="true">{cell.num}</span>}
                  <input
                    ref={el => { refs.current[key] = el }}
                    className="cw__input"
                    data-cell={key}
                    value={fill[key] || ''}
                    onChange={e => onInput(r, c, e)}
                    onKeyDown={e => onKey(r, c, e)}
                    onFocus={() => { if (!active || active.r !== r || active.c !== c) select(r, c) }}
                    aria-label={u.cell(r + 1, c + 1)}
                    aria-invalid={marks[key] === 'bad' || undefined}
                    readOnly={!!revealed[key] || solved}
                    autoComplete="off" autoCorrect="off" autoCapitalize="characters" spellCheck={false}
                    enterKeyHint="next"
                  />
                </span>
              )
            }))}
          </div>
        </div>
        <div className="cw__side">
          <div className="cw__actions">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" data-testid="cw-check" onClick={check}><Icon name="check" className="ui-btn__icon" /> {u.check}</button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" data-testid="cw-reveal" onClick={reveal} disabled={solved}><Icon name="bulb" className="ui-btn__icon" /> {u.reveal}</button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" data-testid="cw-new" onClick={onFresh}><Icon name="refresh" className="ui-btn__icon" /> {u.fresh}</button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" data-testid="cw-print" onClick={() => setPrinting(true)}><Icon name="list" className="ui-btn__icon" /> {u.print}</button>
          </div>
          <p className={`cw__msg${solved ? ' is-solved' : ''}`} role="status" data-testid="cw-msg">{msg}</p>
          <div className="cw__cluecols">
            {clueList(across, u.across)}
            {clueList(down, u.down)}
          </div>
        </div>
      </div>

      {printing && createPortal(<PrintSheet puzzle={puzzle} u={u} title={title} rtl={rtl} lang={lang} across={across} down={down} />, document.body)}
    </div>
  )
}

function PrintGrid({ puzzle, answers, rtl, lang }) {
  return (
    <div className="cw-print__grid" dir={rtl ? 'rtl' : 'ltr'} lang={lang} style={{ '--cw-cols': puzzle.cols }}>
      {puzzle.cells.map((row, r) => row.map((cell, c) => cell
        ? <span key={k(r, c)} className="cw-print__cell">{cell.num > 0 && <i>{cell.num}</i>}{answers ? cell.ch : ''}</span>
        : <span key={k(r, c)} className="cw-print__void" />))}
    </div>
  )
}

function PrintSheet({ puzzle, u, title, rtl, lang, across, down }) {
  const list = (ws, label, withAnswers) => (
    <div>
      <h3>{label}</h3>
      <ol>{ws.map(w => <li key={`${w.dir}${w.num}`} value={w.num}>{withAnswers ? <b>{w.answer}</b> : `${w.clue} (${w.letters.length})`}</li>)}</ol>
    </div>
  )
  return (
    <div className="cw-print" aria-hidden="true" dir={rtl ? 'rtl' : 'ltr'}>
      <section className="cw-print__page">
        <h2>{title}</h2>
        <PrintGrid puzzle={puzzle} rtl={rtl} lang={lang} />
        <div className="cw-print__clues">{list(across, u.across)}{list(down, u.down)}</div>
        <p className="cw-print__foot">{u.printFoot}</p>
      </section>
      <section className="cw-print__page">
        <h2>{u.key} — {title}</h2>
        <PrintGrid puzzle={puzzle} answers rtl={rtl} lang={lang} />
        <div className="cw-print__clues">{list(across, u.across, true)}{list(down, u.down, true)}</div>
        <p className="cw-print__foot">{u.printFoot}</p>
      </section>
    </div>
  )
}
