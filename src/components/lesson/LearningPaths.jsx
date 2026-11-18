// ═══════════════════════════════════════════════════════
// Dərs yolları (v5.4) — /learn: mövcud dərslərdən ardıcıl mövzu yolları
//
//   <LearningPaths lessonBySlug readSet lang L open />
//
// • Hər yol saytdakı dərslərin ardıcıllığıdır (yeni dini mətn YOXDUR) — sıra:
//   əvvəl əsas, sonra təfərrüat. İrəliləyiş dərsin "Oxudum" düyməsindən
//   (learn_progress_v1, yalnız bu cihaz).
// • Seçilən yol yadda qalır (learn_path_v1). Halqa: oxunan / cəmi; "Növbəti
//   dərs" — yolun ilk oxunmamış dərsi. Yol bitəndə paylaşma kartı (YearReview →
//   drawReviewCard, yalnız düyməyə basanda yüklənir).
// Stillər: src/styles/LessonsPage.css (§ Dərs yolları)
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import Icon from '../Icon'
import { ProgressRing } from '../viz'
import { pathFor } from '../../seo/routes'
import { pickUi } from '../../utils/uiText'
import { pick } from './LessonBlocks'
import { celebrateOnce } from '../../utils/celebrate'
import { LEARNING_PATHS, P } from './pathsData'
import LearnGoalCard, { useLearnGoal } from '../my/LearnGoalCard'
import { GOAL_TXT } from '../my/goalText'

export { LEARNING_PATHS, P }

const KEY = 'learn_path_v1'

export default function LearningPaths({ lessonBySlug, readSet, lang, L, open }) {
  const t = pickUi(P, lang, 'en')
  const g = pickUi(GOAL_TXT, lang, 'en')
  // H4: şəxsi məqsəd (utils/learnGoal) — seçilibsə yol sekmesi ondan başlayır
  const { goal, choose } = useLearnGoal()
  const paths = useMemo(() => LEARNING_PATHS.map(p => ({ ...p, items: p.lessons.map(lessonBySlug).filter(Boolean) })).filter(p => p.items.length), [lessonBySlug])
  const [sel, setSel] = useState(() => {
    try { const v = localStorage.getItem(KEY); if (v && LEARNING_PATHS.some(p => p.key === v)) return v } catch { /* */ }
    return goal.g || 'new'
  })
  useEffect(() => { try { localStorage.setItem(KEY, sel) } catch { /* */ } }, [sel])
  const [msg, setMsg] = useState('')
  const cur = paths.find(p => p.key === sel) || paths[0]
  // v5.6: yol bitəndə bir dəfəlik ulduz partlayışı (utils/celebrate)
  const curDone = Boolean(cur && cur.items.length && cur.items.every(l => readSet.has(l.slug)))
  const curKey = cur?.key
  useEffect(() => { if (curDone) celebrateOnce(`path_${curKey}`, { size: 'big' }) }, [curDone, curKey])
  if (!cur) return null
  const readN = cur.items.filter(l => readSet.has(l.slug)).length
  const total = cur.items.length
  const next = cur.items.find(l => !readSet.has(l.slug))
  const complete = readN === total

  async function share() {
    try {
      const { drawReviewCard } = await import('../YearReview')
      const c = document.createElement('canvas'); c.width = 1080; c.height = 1350
      drawReviewCard(c.getContext('2d'), {
        title: t[cur.key], sub: t.badge, brand: 'muslims.cc', rtl: lang === 'ar',
        items: [
          { value: String(total), label: L.statLessons },
          { value: '100%', label: t.badge },
        ],
      })
      const blob = await new Promise(res => c.toBlob(res, 'image/png'))
      if (!blob) return
      const file = new File([blob], `muslims-cc-${cur.key}.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file] }); return } catch (e) { if (e?.name === 'AbortError') return }
      }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000)
      setMsg(t.saved)
    } catch { /* paylaşma ləğv olundu */ }
  }

  return (
    <div className="ls-paths" data-testid="learning-paths">
      <LearnGoalCard lessonBySlug={lessonBySlug} readSet={readSet} open={open} />
      <div className="ls-paths__chips" role="tablist" aria-label={t.label}>
        {paths.map(p => {
          const r = p.items.filter(l => readSet.has(l.slug)).length
          return (
            <button key={p.key} type="button" role="tab" aria-selected={p.key === cur.key}
              className={`ui-chip ls-paths__chip${r === p.items.length ? ' is-done' : ''}`} onClick={() => { setSel(p.key); setMsg('') }}>
              <Icon name={p.icon} size={15} /> {t[p.key]}
              <span className="ls-paths__count ui-num">{r}/{p.items.length}</span>
            </button>
          )
        })}
      </div>
      <div className="ui-card ls-paths__panel" role="tabpanel" key={cur.key}>
        <div className="ls-paths__head">
          <ProgressRing value={readN} max={total} size={64} thickness={7} />
          <div className="ls-paths__headtext">
            <h3 className="ls-paths__title">{t[cur.key]}</h3>
            <p className="ls-paths__sub ui-num">{t.of(readN, total)} · {L.min(cur.items.reduce((s, l) => s + (l.minutes || 5), 0))}</p>
          </div>
          {next ? (
            <a className="ui-btn ui-btn--primary ui-btn--sm ls-paths__next" href={pathFor('learn', lang, next.slug)} onClick={(e) => open(next, e)}>
              {t.next} <Icon name="arrow" className="ui-btn__icon ui-btn__icon--end ui-flip-rtl" />
            </a>
          ) : (
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm ls-paths__next" onClick={share} data-testid="path-share">
              <Icon name="share" className="ui-btn__icon" /> {t.share}
            </button>
          )}
        </div>
        <p className="ls-paths__goal">
          <button type="button" className="ui-chip" aria-pressed={goal.g === cur.key} onClick={() => choose(goal.g === cur.key ? null : cur.key)} data-testid="path-goal">
            <Icon name={goal.g === cur.key ? 'check' : 'target'} size={14} /> {goal.g === cur.key ? g.isGoal : g.setGoal}
          </button>
        </p>
        {complete && <p className="ls-paths__done"><Icon name="check" size={16} /> {t.done} <span role="status">{msg}</span></p>}
        <ol className="ui-steps ls-path ls-paths__steps">
          {cur.items.map((l, i) => {
            const done = readSet.has(l.slug)
            return (
              <li key={l.slug} className={`ui-step${done ? ' is-done' : ''}${next && next.slug === l.slug ? ' is-next' : ''}`}>
                <span className="ui-step__n" aria-hidden="true">{done ? <Icon name="check" size={14} /> : i + 1}</span>
                <div className="ui-step__body">
                  <h4 className="ui-step__title">
                    <a className="ls-path__link" href={pathFor('learn', lang, l.slug)} onClick={(e) => open(l, e)}>{pick(l.title, lang)}</a>
                  </h4>
                  <p className="ui-step__text ui-num">{L.min(l.minutes || 5)}{done ? ` · ${L.isRead}` : ''}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
