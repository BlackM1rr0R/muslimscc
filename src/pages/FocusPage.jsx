// ═══════════════════════════════════════════════════════
// /focus — "Quranla diqqət seansı" (Pomodoro üslubu)
//
// • Diqqət (standart 25 dəq) → "ayə fasiləsi" (standart 5 dəq), ikisi də dəyişdirilir.
//   Vəziyyət maşını — utils/focusTimer (saf, test olunur). Fasilə bitəndə növbəti diqqəti istifadəçi başladır.
// • Fasilədə bir ayə: ərəbcə + tərcümə saytın Quran mənbəyindən (components/focus/FocusBreakAyah),
//   surə:ayə istinadı və keçidi, həqiqi qiraət səsi. Seçim: seçilmiş surədə ardıcıl və ya saytın
//   "günün ayəsi" hovuzundan (utils/focusStore → loadCuratedRefs) yumşaq təsadüf — yeni siyahı yazılmayıb.
// • Mərhələ dəyişəndə: səhifədə yumşaq zəng; bildiriş — YALNIZ icazə artıq verilibsə (icazə istənmir).
// • Yaddaş (utils/focusStore): ayarlar + bu günün bitən seansları — yalnız cihazda, ardıcıllıq/xal yoxdur.
//   Mount-dan sonra oxunur (prerender ilə ilk render eyni).
// • Oflayn: səhifə yükləndikdən sonra taymer şəbəkəsiz işləyir; növbəti ayə diqqətin əvvəlində gətirilir.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import FocusRing from '../components/focus/FocusRing'
import FocusBreakAyah from '../components/focus/FocusBreakAyah'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import { pickUi } from '../utils/uiText'
import {
  initTimer, startTimer, pauseTimer, resetTimer, tick, applyConfig, skipBreak, remaining, progress, clockText,
  FOCUS_MIN, BREAK_MIN,
} from '../utils/focusTimer'
import {
  DEFAULT_FOCUS_PREFS, readFocusPrefs, writeFocusPrefs, doneToday, addDone, nextAyahIn, gentlePick, loadCuratedRefs,
} from '../utils/focusStore'
import { fetchAyah, POPULAR_AYAHS, parseAyahRef } from '../components/quote/content'
import { surahLabel } from '../components/hifz/surahLabel'
import { playSound, unlockAudio } from '../utils/uiSound'
import { showLocalNotification } from '../utils/notify'
import '../styles/FocusPage.css'

const T = {
  az: {
    title: 'Quranla diqqət seansı', lead: 'Sakit diqqət dövrləri ilə işləyin və ya oxuyun. Hər fasilədə Qurandan bir ayə — oxuyun, dinləyin, sonra işinizə qayıdın.',
    private: 'Ayarlar və bu günün sayı yalnız bu cihazda saxlanılır. Ardıcıllıq, xal və müqayisə yoxdur.',
    focus: 'Diqqət', brk: 'Ayə fasiləsi', start: 'Başla', pause: 'Fasilə ver', resume: 'Davam et', reset: 'Sıfırla', skip: 'Fasiləni bitir',
    settings: 'Ayarlar', focusMin: 'Diqqət (dəqiqə)', breakMin: 'Fasilə (dəqiqə)', choice: 'Fasilədəki ayə',
    random: 'Saytın seçdiyi qısa ayələrdən biri', seq: 'Seçilmiş surədə ardıcıl', surah: 'Surə', nextUp: (name, a) => `Növbəti: ${name}, ayə ${a}`,
    sound: 'Mərhələ dəyişəndə zəng', notifyNote: 'Bu sayt üçün bildirişlərə artıq icazə vermisinizsə, vərəq arxa planda olanda bildiriş də gəlir.',
    today: (n) => (n ? `Bu gün bitən diqqət seansları: ${n}` : 'Bu gün hələ diqqət seansı bitməyib'),
    focusDone: 'Diqqət bitdi — ayə fasiləsi.', breakDone: 'Fasilə bitdi. Hazır olanda növbəti diqqəti başladın.',
    ready: 'Hazır olanda başlayın', paused: 'Dayandırılıb', breakLead: 'Bu ayə ilə bir az dayanın.', minutes: (n) => `${n} dəq`,
  },
  en: {
    title: 'Focus session with the Quran', lead: 'Work or study in calm focus periods. In each break, one ayah from the Quran — read it, listen to it, then return to your work.',
    private: 'Settings and today’s count are stored only on this device. There are no streaks, points or comparisons.',
    focus: 'Focus', brk: 'Ayah break', start: 'Start', pause: 'Pause', resume: 'Resume', reset: 'Reset', skip: 'End the break',
    settings: 'Settings', focusMin: 'Focus (minutes)', breakMin: 'Break (minutes)', choice: 'Ayah for the break',
    random: 'One of the short ayahs selected on the site', seq: 'In order through a surah', surah: 'Surah', nextUp: (name, a) => `Next: ${name}, ayah ${a}`,
    sound: 'Chime when a phase changes', notifyNote: 'If you have already allowed notifications for this site, you also get a notification while the tab is in the background.',
    today: (n) => (n === 0 ? 'No focus sessions completed today yet' : n === 1 ? '1 focus session completed today' : `${n} focus sessions completed today`),
    focusDone: 'Focus complete — time for an ayah break.', breakDone: 'The break is over. Start the next focus when you are ready.',
    ready: 'Start when you are ready', paused: 'Paused', breakLead: 'Pause for a moment with this ayah.', minutes: (n) => (n === 1 ? '1 min' : `${n} min`),
  },
  ru: {
    title: 'Сессия сосредоточения с Кораном', lead: 'Работайте или учитесь спокойными периодами сосредоточения. В каждом перерыве — один аят Корана: прочитайте, послушайте и возвращайтесь к делу.',
    private: 'Настройки и сегодняшний счёт хранятся только на этом устройстве. Никаких серий, очков и сравнений.',
    focus: 'Сосредоточение', brk: 'Перерыв с аятом', start: 'Начать', pause: 'Пауза', resume: 'Продолжить', reset: 'Сбросить', skip: 'Закончить перерыв',
    settings: 'Настройки', focusMin: 'Сосредоточение (минуты)', breakMin: 'Перерыв (минуты)', choice: 'Аят для перерыва',
    random: 'Один из коротких аятов, отобранных на сайте', seq: 'По порядку в выбранной суре', surah: 'Сура', nextUp: (name, a) => `Далее: ${name}, аят ${a}`,
    sound: 'Сигнал при смене этапа', notifyNote: 'Если вы уже разрешили уведомления для этого сайта, при вкладке в фоне придёт и уведомление.',
    today: (n) => (n ? `Сегодня завершено сессий: ${n}` : 'Сегодня сессий пока не завершено'),
    focusDone: 'Сосредоточение завершено — перерыв с аятом.', breakDone: 'Перерыв окончен. Начните следующее сосредоточение, когда будете готовы.',
    ready: 'Начните, когда будете готовы', paused: 'На паузе', breakLead: 'Задержитесь ненадолго с этим аятом.', minutes: (n) => `${n} мин`,
  },
  ar: {
    title: 'جلسة تركيز مع القرآن', lead: 'اعمل أو ادرس على فترات تركيز هادئة. وفي كل استراحة آية من القرآن — اقرأها واستمع إليها ثم عُد إلى عملك.',
    private: 'الإعدادات وعدد اليوم محفوظة على هذا الجهاز فقط. لا سلاسل ولا نقاط ولا مقارنات.',
    focus: 'التركيز', brk: 'استراحة الآية', start: 'ابدأ', pause: 'إيقاف مؤقت', resume: 'متابعة', reset: 'إعادة الضبط', skip: 'أنهِ الاستراحة',
    settings: 'الإعدادات', focusMin: 'التركيز (بالدقائق)', breakMin: 'الاستراحة (بالدقائق)', choice: 'آية الاستراحة',
    random: 'إحدى الآيات القصيرة المختارة في الموقع', seq: 'بالترتيب في سورة مختارة', surah: 'السورة', nextUp: (name, a) => `التالية: ${name}، الآية ${a}`,
    sound: 'جرس عند تغيّر المرحلة', notifyNote: 'إن كنت قد سمحت بالإشعارات لهذا الموقع من قبل، فسيصلك إشعار أيضًا حين تكون الصفحة في الخلفية.',
    today: (n) => (n ? `جلسات التركيز المكتملة اليوم: ${n}` : 'لم تكتمل أي جلسة تركيز اليوم بعد'),
    focusDone: 'انتهى التركيز — حان وقت استراحة الآية.', breakDone: 'انتهت الاستراحة. ابدأ التركيز التالي حين تكون مستعدًا.',
    ready: 'ابدأ حين تكون مستعدًا', paused: 'متوقف مؤقتًا', breakLead: 'توقّف قليلًا مع هذه الآية.', minutes: (n) => `${n} د`,
  },
  tr: {
    title: 'Kur’an ile odak oturumu', lead: 'Sakin odak dönemleriyle çalışın veya ders yapın. Her molada Kur’an’dan bir ayet — okuyun, dinleyin, sonra işinize dönün.',
    private: 'Ayarlar ve bugünün sayısı yalnızca bu cihazda saklanır. Seri, puan ve karşılaştırma yoktur.',
    focus: 'Odak', brk: 'Ayet molası', start: 'Başla', pause: 'Duraklat', resume: 'Devam et', reset: 'Sıfırla', skip: 'Molayı bitir',
    settings: 'Ayarlar', focusMin: 'Odak (dakika)', breakMin: 'Mola (dakika)', choice: 'Moladaki ayet',
    random: 'Sitede seçilmiş kısa ayetlerden biri', seq: 'Seçilen surede sırayla', surah: 'Sure', nextUp: (name, a) => `Sıradaki: ${name}, ${a}. ayet`,
    sound: 'Aşama değişince zil', notifyNote: 'Bu site için bildirimlere daha önce izin verdiyseniz, sekme arka plandayken bildirim de gelir.',
    today: (n) => (n ? `Bugün tamamlanan odak oturumu: ${n}` : 'Bugün henüz odak oturumu tamamlanmadı'),
    focusDone: 'Odak tamamlandı — ayet molası.', breakDone: 'Mola bitti. Hazır olduğunuzda sonraki odağı başlatın.',
    ready: 'Hazır olduğunuzda başlayın', paused: 'Duraklatıldı', breakLead: 'Bu ayetle biraz durun.', minutes: (n) => `${n} dk`,
  },
}

// Seçimlər utils/focusTimer hədləri daxilindədir (FOCUS_MIN 5–90, BREAK_MIN 1–30)
const FOCUS_CHOICES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 75, 90].filter((n) => n >= FOCUS_MIN.min && n <= FOCUS_MIN.max)
const BREAK_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30].filter((n) => n >= BREAK_MIN.min && n <= BREAK_MIN.max)
const withCurrent = (list, v) => (list.includes(v) ? list : [...list, v].sort((a, b) => a - b))
const SURAHS = Array.from({ length: 114 }, (_, i) => i + 1)
// Hovuz yüklənməsə — saytın "tanınmış ayələr" siyahısı (components/quote/content)
const FALLBACK_REFS = POPULAR_AYAHS.map(parseAyahRef).filter(Boolean)
const cfgOf = (p) => ({ focus: p.f, brk: p.b })

export default function FocusPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const navigate = useNavigate()

  const [ready, setReady] = useState(false)
  const [prefs, setPrefs] = useState(DEFAULT_FOCUS_PREFS)
  const [timer, setTimer] = useState(() => initTimer(cfgOf(DEFAULT_FOCUS_PREFS)))
  const [now, setNow] = useState(0)
  const [done, setDone] = useState(0)
  const [msg, setMsg] = useState('')
  const [breakAyah, setBreakAyah] = useState(null)
  const [upcoming, setUpcoming] = useState(null)
  const refsRef = useRef(FALLBACK_REFS)
  const lastKey = useRef('')
  const cfg = cfgOf(prefs)

  useEffect(() => {
    const p = readFocusPrefs()
    setPrefs(p)
    setTimer(initTimer(cfgOf(p)))
    setDone(doneToday())
    setNow(Date.now())
    setReady(true)
    let alive = true
    loadCuratedRefs().then((refs) => { if (alive && refs.length) refsRef.current = refs }).catch(() => { /* ehtiyat siyahı qalır */ })
    return () => { alive = false }
  }, [])

  const savePrefs = (patch) => {
    const p = writeFocusPrefs(patch)
    setPrefs(p)
    setTimer((st) => applyConfig(st, cfgOf(p)))
    if ('m' in patch || 's' in patch) setUpcoming(null)
  }

  // Növbəti fasilənin ayəsi — diqqət başlayanda seçilir və əvvəlcədən gətirilir (oflayn fasilə üçün)
  const pickUpcoming = useCallback((p) => {
    const r = p.m === 'surah' ? { s: p.s, a: p.p } : gentlePick(refsRef.current, lastKey.current)
    if (r) fetchAyah(r.s, r.a, lang).catch(() => { /* fasilədə yenidən cəhd olunur */ })
    return r
  }, [lang])

  const chime = useCallback(() => { if (prefs.snd) playSound('done', true) }, [prefs.snd])
  const notify = useCallback((title) => {
    if (typeof document === 'undefined' || document.visibilityState === 'visible') return
    showLocalNotification(title, { tag: 'mcc-focus', body: '' }).catch(() => {})
  }, [])

  // ── Saat ──
  const running = timer.status === 'running'
  useEffect(() => {
    if (!running) return undefined
    const step = () => setNow(Date.now())
    step()
    const id = setInterval(step, 1000)
    const onVis = () => { if (document.visibilityState === 'visible') step() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [running])

  useEffect(() => {
    if (!running) return
    const { state, event } = tick(timer, cfg, now)
    if (!event) return
    setTimer(state)
    if (event === 'focusDone') {
      setDone(addDone())
      const r = upcoming || pickUpcoming(prefs)
      setBreakAyah(r)
      setUpcoming(null)
      if (r) {
        lastKey.current = `${r.s}:${r.a}`
        if (prefs.m === 'surah') setPrefs(writeFocusPrefs({ p: nextAyahIn(prefs.s, prefs.p) }))
      }
      setMsg(t.focusDone)
      chime()
      notify(t.focusDone)
    } else {
      setBreakAyah(null)
      setMsg(t.breakDone)
      chime()
      notify(t.breakDone)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now])

  const onStart = () => {
    unlockAudio()
    const at = Date.now()
    if (timer.phase === 'focus' && !upcoming) setUpcoming(pickUpcoming(prefs))
    setNow(at)
    setTimer((st) => startTimer(st, at))
    setMsg('')
  }
  const onPause = () => { const at = Date.now(); setNow(at); setTimer((st) => pauseTimer(st, at)) }
  const onReset = () => { setTimer(resetTimer(cfg)); setBreakAyah(null); setMsg('') }
  const onSkip = () => { setTimer((st) => skipBreak(st, cfg)); setBreakAyah(null); setMsg(t.breakDone) }

  const left = ready ? remaining(timer, now) : timer.left
  const isBreak = timer.phase === 'break'
  const phaseLabel = isBreak ? t.brk : t.focus
  const stateLabel = timer.status === 'paused' ? t.paused : (timer.status === 'idle' ? t.ready : '')
  const onNavigate = (href) => { navigate(href); window.scrollTo(0, 0) }

  return (
    <div className="fx-page">
      <header className="ui-page-hero fx-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel(navGroupOf('focus'), lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.lead}</p>
          <p className="ui-page-hero__how"><Icon name="shield" size={16} /> {t.private}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container ui-container--narrow fx-wrap">
          <p className="ui-sr-only" role="status" aria-live="polite">{msg}</p>

          <div className={`ui-card fx-stage${isBreak ? ' is-break' : ''}`} data-testid="focus-stage" data-phase={timer.phase} data-status={timer.status}>
            <FocusRing value={ready ? progress(timer, cfg, now) : 0} phase={timer.phase}>
              <span className="fx-phase">{phaseLabel}</span>
              <span className="fx-time ui-num" role="timer" aria-label={phaseLabel} data-testid="focus-time">{clockText(left)}</span>
              {stateLabel && <span className="fx-state">{stateLabel}</span>}
            </FocusRing>

            <div className="fx-ctrl">
              {running
                ? <button type="button" className="ui-btn ui-btn--primary fx-btn" onClick={onPause}><Icon name="pause" size={20} /> {t.pause}</button>
                : <button type="button" className="ui-btn ui-btn--primary fx-btn" onClick={onStart} disabled={!ready} data-testid="focus-start">
                    <Icon name="play" size={20} /> {timer.status === 'paused' ? t.resume : t.start}
                  </button>}
              {isBreak && <button type="button" className="ui-btn ui-btn--ghost fx-btn" onClick={onSkip}>{t.skip}</button>}
              <button type="button" className="ui-btn ui-btn--ghost fx-btn" onClick={onReset} disabled={!ready || (timer.status === 'idle' && timer.phase === 'focus')}>
                <Icon name="refresh" size={20} /> {t.reset}
              </button>
            </div>
            <p className="fx-today" data-testid="focus-today">{ready ? t.today(done) : ' '}</p>
          </div>

          {isBreak && breakAyah && (
            <section className="fx-break" aria-labelledby="fx-break-h">
              <h2 id="fx-break-h" className="fx-break__h">{t.brk}</h2>
              <p className="fx-break__lead">{t.breakLead}</p>
              <FocusBreakAyah refAyah={breakAyah} lang={lang} onNavigate={onNavigate} />
            </section>
          )}

          <details className="ui-card fx-settings" open>
            <summary className="fx-settings__sum">{t.settings}</summary>
            <div className="fx-settings__body">
              <div className="fx-grid">
                <label className="fx-field">
                  <span>{t.focusMin}</span>
                  <select value={prefs.f} disabled={!ready} onChange={(e) => savePrefs({ f: Number(e.target.value) })} data-testid="focus-min">
                    {withCurrent(FOCUS_CHOICES, prefs.f).map((n) => <option key={n} value={n}>{t.minutes(n)}</option>)}
                  </select>
                </label>
                <label className="fx-field">
                  <span>{t.breakMin}</span>
                  <select value={prefs.b} disabled={!ready} onChange={(e) => savePrefs({ b: Number(e.target.value) })} data-testid="break-min">
                    {withCurrent(BREAK_CHOICES, prefs.b).map((n) => <option key={n} value={n}>{t.minutes(n)}</option>)}
                  </select>
                </label>
              </div>

              <fieldset className="fx-choice">
                <legend>{t.choice}</legend>
                <label className="fx-radio">
                  <input type="radio" name="fx-mode" checked={prefs.m === 'random'} disabled={!ready} onChange={() => savePrefs({ m: 'random' })} />
                  <span>{t.random}</span>
                </label>
                <label className="fx-radio">
                  <input type="radio" name="fx-mode" checked={prefs.m === 'surah'} disabled={!ready} onChange={() => savePrefs({ m: 'surah', p: 1 })} />
                  <span>{t.seq}</span>
                </label>
                {prefs.m === 'surah' && (
                  <div className="fx-surah">
                    <label className="fx-field">
                      <span>{t.surah}</span>
                      <select value={prefs.s} onChange={(e) => savePrefs({ s: Number(e.target.value), p: 1 })} data-testid="focus-surah">
                        {SURAHS.map((n) => <option key={n} value={n}>{n}. {surahLabel(n, lang)}</option>)}
                      </select>
                    </label>
                    <p className="fx-hint ui-num">{t.nextUp(surahLabel(prefs.s, lang), prefs.p)}</p>
                  </div>
                )}
              </fieldset>

              <label className="fx-check">
                <input type="checkbox" checked={prefs.snd} disabled={!ready} onChange={(e) => savePrefs({ snd: e.target.checked })} />
                <span>{t.sound}</span>
              </label>
              <p className="fx-hint">{t.notifyNote}</p>
            </div>
          </details>
        </div>
      </section>
    </div>
  )
}
