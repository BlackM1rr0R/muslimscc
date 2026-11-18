// ═══════════════════════════════════════════════════════
// H4 — "Mənim məqsədim": seçilmiş dərs yolu (lesson/pathsData), irəliləyiş halqası, həftəlik xülasə
// (utils/learnGoal → weekSummary) və "Növbəti addım" — yolun ilk oxunmamış dərsi, yol bitəndə
// mövcud test (/quiz), sonra ərəb dili kursu (/arabic). Yeni məzmun yoxdur.
//   <LearnGoalCard lessonBySlug readSet open />  — /learn (LearningPaths içində)
//   <LearnGoalCard standalone />                  — /account (dərslərin siyahısını özü yükləyir)
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'
import { isPlainClick } from '../PageLink'
import Icon from '../Icon'
import { ProgressRing } from '../viz'
import { LEARNING_PATHS, P } from '../lesson/pathsData'
import { readGoal, saveGoal, setGoal, pathProgress, nextStep, weekSummary, GOAL_EVENT, GOAL_KEY } from '../../utils/learnGoal'
import { toKey } from '../../utils/prayerTracker'
import { formatGregorian, parseGKey } from '../../utils/hijri'
import { GOAL_TXT } from './goalText'
import '../../styles/My.css'

// Tək tarix (başlanğıc) — formatGregorian; sütunlarda Intl işlədilmir (DD.MM)
const fmtKey = (key, lang) => { const g = parseGKey(key); return g ? formatGregorian(g, lang) : '' }
const dm = (key) => `${key.slice(8, 10)}.${key.slice(5, 7)}`
const validGoal = (k) => LEARNING_PATHS.some((p) => p.key === k)
const readSetFromStorage = () => {
  try { const v = JSON.parse(localStorage.getItem('learn_progress_v1')); return new Set(Array.isArray(v?.read) ? v.read : []) } catch { return new Set() }
}
const quizDone = () => { try { const v = JSON.parse(localStorage.getItem('quiz_scores')); return Boolean(v && Object.keys(v).length) } catch { return false } }

export function useLearnGoal() {
  const [goal, setG] = useState(() => readGoal(undefined, validGoal))
  useEffect(() => {
    const on = () => setG(readGoal(undefined, validGoal))
    const st = (e) => { if (e.key === GOAL_KEY || e.key === null) on() }
    window.addEventListener(GOAL_EVENT, on)
    window.addEventListener('storage', st)
    window.addEventListener('mcc-acctsync', on)
    return () => { window.removeEventListener(GOAL_EVENT, on); window.removeEventListener('storage', st); window.removeEventListener('mcc-acctsync', on) }
  }, [])
  const choose = (key) => setG(saveGoal(setGoal(readGoal(undefined, validGoal), key)))
  return { goal, choose }
}

export default function LearnGoalCard({ lessonBySlug: bySlugProp, readSet: readProp, open, standalone = false }) {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(GOAL_TXT, lang, 'en')
  const pt = pickUi(P, lang, 'en')
  const navigate = useNavigate()
  const { goal, choose } = useLearnGoal()
  const [bySlug, setBySlug] = useState(() => bySlugProp || null)
  useEffect(() => {
    if (bySlugProp) { setBySlug(() => bySlugProp); return undefined }
    let alive = true
    import('../../data/lessons/index').then((m) => { if (alive) setBySlug(() => m.lessonBySlug) }).catch(() => {})
    return () => { alive = false }
  }, [bySlugProp])
  const [storedRead, setStoredRead] = useState(() => (readProp ? null : readSetFromStorage()))
  useEffect(() => {
    if (readProp) return undefined
    const on = () => setStoredRead(readSetFromStorage())
    window.addEventListener('storage', on)
    window.addEventListener('mcc-acctsync', on)
    return () => { window.removeEventListener('storage', on); window.removeEventListener('mcc-acctsync', on) }
  }, [readProp])
  const readSet = readProp || storedRead || new Set()

  const path = LEARNING_PATHS.find((p) => p.key === goal.g) || null
  const today = toKey()
  const sum = useMemo(() => weekSummary(goal, today, path?.lessons || []), [goal, today, path])
  const pick = (o) => (o ? (o[lang] || o.en || o.az || '') : '')

  const go = (href, lesson) => (e) => {
    if (lesson && open) { open(lesson, e); return }
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(href)
    window.scrollTo(0, 0)
  }

  if (!path) {
    if (!standalone) return null
    const href = pathFor('learn', siteLang)
    return (
      <div className="my-goal my-goal--empty" data-testid="learn-goal">
        <p>{t.pick}</p>
        <a className="ui-link" href={href} onClick={go(href)}>{t.toLearn} <Icon name="arrow" size={14} className="ui-link__arrow ui-flip-rtl" /></a>
      </div>
    )
  }

  const prog = pathProgress(path, readSet)
  const step = nextStep(path, readSet, { quizDone: quizDone() })
  const lesson = step?.kind === 'lesson' && bySlug ? bySlug(step.slug) : null
  const stepHref = step?.kind === 'lesson' ? pathFor('learn', siteLang, step.slug) : step?.kind === 'quiz' ? pathFor('quiz', siteLang) : pathFor('arabic', siteLang)
  const stepText = step?.kind === 'lesson' ? (lesson ? pick(lesson.title) : step.slug) : step?.kind === 'quiz' ? t.nextQuiz : t.nextArabic
  const max = Math.max(1, ...sum.days.map((d) => d.n))

  return (
    <div className="my-goal" data-testid="learn-goal" data-goal={path.key}>
      <div className="my-goal__head">
        <ProgressRing value={prog.read} max={prog.total} size={64} thickness={7} label={pt[path.key]} />
        <div className="my-goal__ht">
          <span className="ui-eyebrow">{t.title}</span>
          <h3 className="my-goal__title"><Icon name={path.icon} size={16} /> {pt[path.key]}</h3>
          <p className="my-goal__sub ui-num">{t.of(prog.read, prog.total)}{goal.since ? ` · ${t.since(fmtKey(goal.since, lang))}` : ''}</p>
        </div>
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => choose(null)} data-testid="goal-clear">{t.clear}</button>
      </div>
      <div className="my-goal__week" data-testid="goal-week" data-week={sum.week}>
        <p className="ui-num"><b>{t.week(sum.week)}</b> · {t.prev(sum.prev)} · {t.pathWeek(sum.pathWeek)} · {t.days(sum.activeDays)}</p>
        <ol className="my-goal__bars" aria-label={t.weekLabel}>
          {sum.days.map((d) => (
            <li key={d.d} title={`${dm(d.d)}: ${d.n}`}>
              <i style={{ blockSize: `${Math.round((d.n / max) * 100)}%` }} aria-hidden="true" />
              <span className="ui-sr-only ui-num">{dm(d.d)}: {d.n}</span>
            </li>
          ))}
        </ol>
      </div>
      {step && (
        <a className="ui-card my-goal__next" href={stepHref} onClick={go(stepHref, lesson)} data-testid="goal-next" data-kind={step.kind}>
          <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={step.kind === 'lesson' ? 'learn' : step.kind === 'quiz' ? 'quiz' : 'arabic'} /></span>
          <span className="my-goal__nb">
            <span className="my-goal__nk">{t.next}{step.kind === 'lesson' ? ` · ${t.nextLesson}` : ''}</span>
            <span className="my-goal__nt">{stepText}</span>
          </span>
          <Icon name="chevron" size={16} className="ui-flip-rtl" />
        </a>
      )}
    </div>
  )
}
