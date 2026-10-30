// ═══════════════════════════════════════════════════════
// /learn-arabic — "Ərəb əlifbası və Quran oxumağı öyrən" (yeni müsəlmanlar və uşaqlar üçün)
//
// Quruluş: hero (irəliləyiş + "Davam et") → açıq dərs (varsa) → dərs kartları.
// Açıq dərs ünvanın hash-indədir: #letters #harakat #reading #tajweed —
// "Geri" düyməsi dərsdən çıxır, link paylaşmaq olur, marşrut dəyişmir.
// Hər dərs: "Öyrən" (məzmun) və "Yoxla" (viktorina). Nəticə localStorage-da
// (components/arabic/progress.js, try/catch). Məzmun: data/arabicCourse.js.
// ═══════════════════════════════════════════════════════

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import Breadcrumb from '../components/Breadcrumb'
import PageLink, { isPlainClick } from '../components/PageLink'
import { LESSONS } from '../data/arabicCourse.js'
import { ui, pick } from '../components/arabic/strings.js'
import { useCourseAudio } from '../components/arabic/useCourseAudio.js'
import { buildQuiz } from '../components/arabic/quizzes.js'
import {
  readProgress, writeProgress, withResult, isPassed, passedCount, percentDone, resumeLesson,
} from '../components/arabic/progress.js'
import LetterLesson from '../components/arabic/LetterLesson.jsx'
import Quiz from '../components/arabic/Quiz.jsx'
import '../styles/ArabicCourse.css'

// Ağır olmayan, amma ilk ekranda lazım olmayan dərslər ayrıca yüklənir
const HarakatLesson = lazy(() => import('../components/arabic/HarakatLesson.jsx'))
const ReadingLesson = lazy(() => import('../components/arabic/ReadingLesson.jsx'))
const TajweedLesson = lazy(() => import('../components/arabic/TajweedLesson.jsx'))
const LESSON_VIEW = { letters: LetterLesson, harakat: HarakatLesson, reading: ReadingLesson, tajweed: TajweedLesson }

const LESSON_ICON = { letters: 'type', harakat: 'sparkle', reading: 'quran', tajweed: 'volume' }

export default function ArabicCoursePage({ setPage }) {
  const { lang } = useLang()
  const t = ui(lang)
  const location = useLocation()
  const navigate = useNavigate()
  const audio = useCourseAudio()
  const lessonRef = useRef(null)

  const hashId = decodeURIComponent(location.hash.replace(/^#/, ''))
  const active = LESSONS.some(l => l.id === hashId) ? hashId : null
  const activeIdx = LESSONS.findIndex(l => l.id === active)
  const lesson = activeIdx >= 0 ? LESSONS[activeIdx] : null

  const [progress, setProgress] = useState(readProgress)
  const [mode, setMode] = useState('learn')
  const [quiz, setQuiz] = useState(null)
  const [quizRun, setQuizRun] = useState(0)

  const save = useCallback((fn) => setProgress(p => { const np = fn(p); writeProgress(np); return np }), [])

  // Dərs dəyişdi: "Öyrən" rejimi, səs dayanır, son dərs yadda qalır, dərs görünən yerə gəlir
  const stopAudio = audio.stop
  useEffect(() => {
    setMode('learn')
    setQuiz(null)
    stopAudio()
    if (!active) return
    save(p => (p.last === active ? p : { ...p, last: active }))
    requestAnimationFrame(() => {
      const el = lessonRef.current
      if (!el) return
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    })
  }, [active, save, stopAudio])

  // Dil dəyişəndə açıq yoxlamanın variantları yeni dildə qurulsun
  useEffect(() => {
    if (mode === 'quiz' && active) { setQuiz(buildQuiz(active, lang)); setQuizRun(r => r + 1) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  const openLesson = (id) => {
    // Eyni dərs artıq açıqdırsa hash dəyişmir — sadəcə dərsə sürüşdür
    if (id === active) lessonRef.current?.scrollIntoView({ block: 'start' })
    else navigate({ hash: `#${id}` })
  }
  const closeLesson = () => navigate({ hash: '' })
  const onLessonLink = (id) => (e) => { if (!isPlainClick(e)) return; e.preventDefault(); openLesson(id) }

  const startQuiz = () => {
    audio.stop()
    setQuiz(buildQuiz(active, lang))
    setQuizRun(r => r + 1)
    setMode('quiz')
  }
  const showLearn = () => { audio.stop(); setMode('learn') }
  const onFinish = (percent) => save(p => withResult(p, active, percent))

  const done = passedCount(progress)
  const pct = percentDone(progress)
  const started = Object.keys(progress.best).length > 0 || !!progress.last
  const allDone = done === LESSONS.length
  const resumeId = resumeLesson(progress)
  const ctaLabel = allDone ? t.review : started ? t.resume : t.start
  const View = lesson ? LESSON_VIEW[lesson.id] : null

  return (
    <div className="ac-root">
      {/* ── Hero ── */}
      <header className="ui-page-hero ac-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ac-hero__letters ui-arabic" lang="ar" aria-hidden="true">
          <span>ا</span><span>ب</span><span>ت</span>
        </div>
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{t.eyebrow}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.lead}</p>
          <div className="ui-page-hero__actions ac-hero__actions">
            <a className="ui-btn ui-btn--primary ac-cta" href={`#${resumeId}`} onClick={onLessonLink(resumeId)}>
              <Icon name={started ? 'play' : 'arrow'} className={`ui-btn__icon ${started ? '' : 'ui-flip-rtl'}`} />
              {ctaLabel}
              {started && !allDone && <span className="ac-cta__sub">· {pick(LESSONS.find(l => l.id === resumeId).title, lang)}</span>}
            </a>
            <div className="ac-progress" role="group" aria-label={t.progress}>
              <div className="ac-progress__row">
                <span className="ac-progress__label">{t.progress}</span>
                <span className="ac-progress__num ui-num">{pct}%</span>
              </div>
              <div className="ac-progress__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={t.progress}>
                <span style={{ '--p': pct / 100 }} />
              </div>
              <span className="ac-progress__sub">{t.lessonsDone(done, LESSONS.length)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Açıq dərs ── */}
      {lesson && (
        <section ref={lessonRef} className="ui-section ac-lesson" aria-labelledby="ac-lesson-title" id={`lesson-${lesson.id}`}>
          <div className="ui-container">
            <div className="ac-lesson__head">
              <div className="ac-lesson__titles">
                <span className="ui-eyebrow">{t.lesson(activeIdx + 1)}</span>
                <h2 id="ac-lesson-title" className="ui-title">{pick(lesson.title, lang)}</h2>
                <p className="ac-muted">{pick(lesson.desc, lang)}</p>
              </div>
              <div className="ac-lesson__tools">
                <div className="ac-seg" role="group" aria-label={pick(lesson.title, lang)}>
                  <button type="button" className="ac-seg__btn" aria-pressed={mode === 'learn'} onClick={showLearn}>
                    <Icon name="quran" size={18} /> {t.learn}
                  </button>
                  <button type="button" className="ac-seg__btn" aria-pressed={mode === 'quiz'} onClick={startQuiz}>
                    <Icon name="quiz" size={18} /> {t.quiz}
                    {isPassed(progress, lesson.id) && <Icon name="check" size={16} strokeWidth={2.4} className="ac-seg__ok" />}
                  </button>
                </div>
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={closeLesson}>
                  <Icon name="arrow" className="ui-btn__icon ac-back" /> {t.toLessons}
                </button>
              </div>
            </div>

            <div className="ac-lesson__body" key={`${lesson.id}-${mode}`}>
              {mode === 'quiz' && quiz ? (
                <Quiz key={quizRun} lang={lang} questions={quiz} audio={audio} onFinish={onFinish}
                  onRetry={startQuiz} onBack={showLearn}
                  hasNext={activeIdx < LESSONS.length - 1}
                  onNextLesson={() => openLesson(LESSONS[activeIdx + 1].id)} />
              ) : (
                <Suspense fallback={<div className="ui-skeleton ui-skeleton--card ac-skeleton" aria-hidden="true" />}>
                  <View lang={lang} audio={audio} />
                  <div className="ac-lesson__end">
                    <button type="button" className="ui-btn ui-btn--primary ui-btn--lg" onClick={startQuiz}>
                      <Icon name="quiz" className="ui-btn__icon" /> {t.startQuiz}
                    </button>
                    <div className="ac-lesson__pager">
                      {activeIdx > 0 && (
                        <a className="ui-btn ui-btn--secondary ui-btn--sm" href={`#${LESSONS[activeIdx - 1].id}`} onClick={onLessonLink(LESSONS[activeIdx - 1].id)}>
                          <Icon name="arrow" className="ui-btn__icon ac-back" /> {t.prevLesson}
                        </a>
                      )}
                      {activeIdx < LESSONS.length - 1 && (
                        <a className="ui-btn ui-btn--secondary ui-btn--sm" href={`#${LESSONS[activeIdx + 1].id}`} onClick={onLessonLink(LESSONS[activeIdx + 1].id)}>
                          {t.nextLesson} <Icon name="arrow" className="ui-btn__icon ui-btn__icon--end ui-flip-rtl" />
                        </a>
                      )}
                    </div>
                  </div>
                </Suspense>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Dərs kartları ── */}
      <section className={`ui-section ${lesson ? 'ui-section--alt' : ''} ac-lessons`} aria-labelledby="ac-lessons-h">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <h2 id="ac-lessons-h" className="ui-title">{t.lessonsHead}</h2>
            <p className="ui-lead">{t.lessonsLead}</p>
          </div>
          <ol className="ac-lesson-grid" data-reveal="stagger">
            {LESSONS.map((l, i) => {
              const best = progress.best[l.id]
              const passed = isPassed(progress, l.id)
              return (
                <li key={l.id}>
                  <a href={`#${l.id}`} onClick={onLessonLink(l.id)} aria-current={active === l.id ? 'true' : undefined}
                    className={`ui-card ui-card--interactive ac-lesson-card ${passed ? 'is-done' : ''} ${active === l.id ? 'is-active' : ''}`}>
                    <div className="ac-lesson-card__top">
                      <span className="ac-lesson-card__n ui-num" aria-hidden="true">{i + 1}</span>
                      <span className="ui-icon-tile ui-icon-tile--sm"><Icon name={LESSON_ICON[l.id]} /></span>
                      <span className={`ui-badge ${passed ? 'ui-badge--brand' : ''} ac-lesson-card__badge`}>
                        {passed && <Icon name="check" size={12} strokeWidth={2.6} />}
                        {passed ? t.done : best != null ? t.best(best) : t.notStarted}
                      </span>
                    </div>
                    <p className="ac-lesson-card__glyph ui-arabic" lang="ar" aria-hidden="true">{l.glyph}</p>
                    <span className="ui-eyebrow ac-lesson-card__eyebrow">{t.lesson(i + 1)}</span>
                    <h3 className="ui-card__title">{pick(l.title, lang)}</h3>
                    <p className="ui-card__text">{pick(l.desc, lang)}</p>
                    <div className="ac-lesson-card__meter" aria-hidden="true"><span style={{ '--p': (best ?? 0) / 100 }} /></div>
                    <span className="ui-link ac-lesson-card__link">
                      {t.open} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
                    </span>
                  </a>
                </li>
              )
            })}
          </ol>
          <p className="ac-credits">
            {t.credits}{' '}
            <PageLink to="licenses" setPage={setPage} className="ui-link">{t.licenses}</PageLink>
          </p>
        </div>
      </section>
    </div>
  )
}
