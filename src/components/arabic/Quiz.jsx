// ═══════════════════════════════════════════════════════
// Ərəb kursu — dərsin sonundakı yoxlama (viktorina)
//
// questions — quizzes.js → buildQuiz(); onFinish(percent) nəticəni
// yaddaşa yazır (ArabicCoursePage). Hər sualda 4 böyük variant (≥ 44px),
// cavabdan sonra düzgün variant işıqlanır, səhvdə düzgün cavab göstərilir.
// Klaviatura: 1–4 rəqəmləri variant seçir, Enter — növbəti.
// ═══════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import { ui } from './strings.js'
import { AudioButton } from './parts.jsx'
import { PASS_PERCENT } from './progress.js'

export default function Quiz({ lang, questions, audio, onFinish, onRetry, onBack, onNextLesson, hasNext }) {
  const t = ui(lang)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)
  const nextRef = useRef(null)
  const headRef = useRef(null)

  const q = questions[i]
  const n = questions.length
  const answered = picked != null
  const isRight = answered && picked === q?.answer

  // Səs sualı açılanda səsi bir dəfə avtomatik oxut (istifadəçi düyməyə basıb gəlib — icazə var)
  useEffect(() => {
    if (q?.prompt.audio && !done) audio.play(q.prompt.audio.key, q.prompt.audio.urls)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, done])

  useEffect(() => { if (answered) nextRef.current?.focus() }, [answered])
  useEffect(() => { headRef.current?.focus() }, [done])

  const choose = (key) => {
    if (answered) return
    setPicked(key)
    if (key === q.answer) setCorrect(c => c + 1)
  }
  const next = () => {
    audio.stop()
    if (i + 1 >= n) {
      const percent = Math.round((correct / n) * 100)
      setDone(true)
      onFinish(percent)
      return
    }
    setI(i + 1)
    setPicked(null)
  }

  // 1–4: variant, Enter: növbəti
  useEffect(() => {
    if (done) return undefined
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select')) return
      const k = Number(e.key)
      if (!answered && k >= 1 && k <= (q?.options.length || 0)) { e.preventDefault(); choose(q.options[k - 1].key) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!n) return null

  if (done) {
    const percent = Math.round((correct / n) * 100)
    const pass = percent >= PASS_PERCENT
    return (
      <div className={`ui-card ac-quiz ac-result ${pass ? 'is-pass' : 'is-fail'}`}>
        <div className="ac-result__ring" aria-hidden="true">
          <Icon name={pass ? 'check' : 'refresh'} size={34} strokeWidth={2} />
        </div>
        <h3 ref={headRef} tabIndex={-1} className="ac-result__title">{t.resultTitle}: <span className="ui-num">{percent}%</span></h3>
        <p className="ac-result__score">{t.score(correct, n)}</p>
        <p className="ac-text">{pass ? t.passed : t.failed}</p>
        <div className="ac-result__bar" aria-hidden="true"><span style={{ '--p': percent / 100 }} /></div>
        <div className="ac-result__actions">
          {pass && hasNext && (
            <button type="button" className="ui-btn ui-btn--primary" onClick={onNextLesson}>
              {t.nextLesson} <Icon name="arrow" className="ui-btn__icon ui-btn__icon--end ui-flip-rtl" />
            </button>
          )}
          <button type="button" className={`ui-btn ${pass ? 'ui-btn--secondary' : 'ui-btn--primary'}`} onClick={onRetry}>
            <Icon name="refresh" className="ui-btn__icon" /> {t.retry}
          </button>
          <button type="button" className="ui-btn ui-btn--ghost" onClick={onBack}>{t.backToLesson}</button>
        </div>
      </div>
    )
  }

  const optState = (o) => {
    if (!answered) return ''
    if (o.key === q.answer) return 'is-correct'
    if (o.key === picked) return 'is-wrong'
    return 'is-dim'
  }
  const answerLabel = q.options.find(o => o.key === q.answer)?.label

  return (
    <div className="ui-card ac-quiz">
      <div className="ac-quiz__top">
        <span className="ac-quiz__count ui-num">{t.question(i + 1, n)}</span>
        <div className="ac-quiz__bar" role="progressbar" aria-valuemin={0} aria-valuemax={n} aria-valuenow={i + (answered ? 1 : 0)} aria-label={t.question(i + 1, n)}>
          <span style={{ '--p': (i + (answered ? 1 : 0)) / n }} />
        </div>
      </div>

      <div className="ac-quiz__q" key={q.id}>
        <p className="ac-quiz__text" id={`ac-q-${i}`}>{q.prompt.text}</p>
        {q.prompt.ar && (
          <p className="ac-quiz__ar ui-arabic" lang="ar" dir="rtl">{q.prompt.ar}</p>
        )}
        {q.prompt.ref && <p className="ac-ref"><span>{t.quran}</span> <bdi className="ui-num">{q.prompt.ref}</bdi></p>}
        {q.prompt.audio && (
          <AudioButton variant="primary" playing={audio.playing === q.prompt.audio.key} label={t.playAgain} stopLabel={t.stop}
            onClick={() => audio.play(q.prompt.audio.key, q.prompt.audio.urls)} />
        )}

        <ul className={`ac-options ${q.options.some(o => o.ar) ? 'ac-options--ar' : ''}`} aria-labelledby={`ac-q-${i}`}>
          {q.options.map((o, k) => (
            <li key={o.key}>
              <button type="button" className={`ac-option ${optState(o)}`} disabled={answered && o.key !== picked && o.key !== q.answer}
                aria-pressed={picked === o.key} onClick={() => choose(o.key)}>
                <span className="ac-option__n ui-num" aria-hidden="true">{k + 1}</span>
                <span className={o.ar ? 'ac-option__ar ui-arabic' : 'ac-option__label'} lang={o.ar ? 'ar' : o.tl ? 'und-Latn' : lang} dir={o.ar ? 'rtl' : o.tl ? 'ltr' : 'auto'}>
                  {o.label}
                </span>
                {answered && o.key === q.answer && <Icon name="check" size={20} strokeWidth={2.2} className="ac-option__mark" />}
                {answered && o.key === picked && o.key !== q.answer && <Icon name="close" size={20} strokeWidth={2.2} className="ac-option__mark" />}
              </button>
            </li>
          ))}
        </ul>

        <div className="ac-quiz__feedback" role="status" aria-live="polite">
          {answered && (
            <p className={`ac-feedback ${isRight ? 'is-right' : 'is-wrong'}`}>
              {isRight ? t.correct : <>{t.wrong} <strong dir="auto">{answerLabel}</strong></>}
            </p>
          )}
        </div>

        <div className="ac-quiz__actions">
          <button ref={nextRef} type="button" className="ui-btn ui-btn--primary" disabled={!answered} onClick={next}>
            {i + 1 >= n ? t.finish : t.next} <Icon name="arrow" className="ui-btn__icon ui-btn__icon--end ui-flip-rtl" />
          </button>
        </div>
      </div>
    </div>
  )
}
