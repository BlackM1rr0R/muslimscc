// ═══════════════════════════════════════════════════════
// Yatma / oyanış ardıcıllıqlarının ortaq hissələri (/bedtime-sunnah, /morning-routine)
//
//   • useRoutineStore(part) — utils/sleepRoutine vəziyyəti YALNIZ mount-dan sonra oxunur
//     (prerender = ilk render); profil/storage/öz hadisəsi dinlənir.
//   • useHisn(lang) — Hisnul-Müslim (public/data/hisn/<dil>.json) — lifeguide/GuideParts-ın
//     useGuideSources-u ilə eyni keş; fəsil id → fəsil.
//   • useHadith(id, lang) — saytın hədis məlumatı (utils/hadithData, tənbəl chunk).
//   • HisnDua, HadithProof — dini mətn OLDUĞU KİMİ + mənbə (localizeSource). Burada heç bir dini
//     mətn yazılmır — hamısı məlumatdandır.
//   • RoutineSteps — "bir ekranda bir addım": irəliləyiş, iri "Növbəti", "Geri", "Keç";
//     addım dəyişəndə fokus addım başlığına keçir.
//   • RoutineReminder — istəyə görə saat; yalnız səhifə açıq ikən: səhifədə qeyd və (icazə
//     ARTIQ verilibsə) yerli bildiriş. İcazə burada heç vaxt istənmir.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../Icon'
import DuaListen from '../DuaListen'
import { isPlainClick } from '../PageLink'
import { useGuideSources } from '../lifeguide/GuideParts'
import { pickUi } from '../../utils/uiText'
import { localizeSource } from '../../utils/sourceNames'
import { loadHadithData, peekHadithData } from '../../utils/hadithData'
import { pathFor, canonicalLang } from '../../seo/routes'
import { haptic } from '../../hooks/useHaptic'
import { showLocalNotification } from '../../utils/notify'
import {
  readRoutine, sanitizeRoutine, stepsToday, setRoutineStep, clearRoutineToday, writeRoutinePrefs,
  routineReminderDue, ROUTINE_KEY, ROUTINE_EVENT,
} from '../../utils/sleepRoutine'

export const RT = {
  az: {
    next: 'Növbəti', finish: 'Bitir', back: 'Geri', skip: 'Keç', start: 'Başla', resume: 'Davam et', again: 'Yenidən başla',
    overview: 'Addımlar', step: (i, n) => `Addım ${i} / ${n}`, doneMark: 'Bu gün edildi',
    progress: (d, n) => `Bu gün: ${n} addımdan ${d}-i edildi`,
    source: 'Mənbə', loading: 'Yüklənir…', loadError: 'Mətn yüklənmədi. İnternet bağlantısını yoxlayıb səhifəni yeniləyin.',
    openHisn: 'Hisnul-Müslimdə aç', openHadith: 'Hədisə bax',
    tap: 'Toxunun', times: (n) => (n === 1 ? 'bir dəfə' : `${n} dəfə`), countLeft: (n, total) => `Toxunun: ${total} dəfədən ${n} dəfə qaldı`,
    countDone: 'Tamamlandı', reset: 'Sıfırla',
    remind: 'Xatırlatma saatı', remindHint: 'Yalnız bu səhifə açıq olanda xatırladır. Bildirişlərə artıq icazə vermisinizsə, bildiriş də göstərilir.',
    remindOff: 'Söndür', dismiss: 'Bağla',
    privacy: 'Bu günün irəliləyişi yalnız sizdə saxlanılır. Ardıcıllıq, xal və müqayisə yoxdur.',
    clear: 'Bu günün qeydlərini sil', cleared: 'Bu günün qeydləri silindi.',
    marked: (s) => `“${s}” bu gün üçün qeyd olundu.`,
  },
  en: {
    next: 'Next', finish: 'Finish', back: 'Back', skip: 'Skip', start: 'Start', resume: 'Continue', again: 'Start again',
    overview: 'Steps', step: (i, n) => `Step ${i} of ${n}`, doneMark: 'Done today',
    progress: (d, n) => (d === 1 ? `Today: 1 of ${n} steps done` : `Today: ${d} of ${n} steps done`),
    source: 'Source', loading: 'Loading…', loadError: 'The text could not be loaded. Check your connection and reload the page.',
    openHisn: 'Open in Hisn al-Muslim', openHadith: 'Open hadith',
    tap: 'Tap', times: (n) => (n === 1 ? 'once' : `${n} times`), countLeft: (n, total) => (n === 1 ? `Tap: 1 of ${total} left` : `Tap: ${n} of ${total} left`),
    countDone: 'Completed', reset: 'Reset',
    remind: 'Reminder time', remindHint: 'It reminds you only while this page is open. If you have already allowed notifications, a notification is shown too.',
    remindOff: 'Turn off', dismiss: 'Dismiss',
    privacy: 'Today’s progress is stored only with you. There are no streaks, points or comparisons.',
    clear: 'Clear today’s marks', cleared: 'Today’s marks were cleared.',
    marked: (s) => `“${s}” is marked for today.`,
  },
  ru: {
    next: 'Далее', finish: 'Завершить', back: 'Назад', skip: 'Пропустить', start: 'Начать', resume: 'Продолжить', again: 'Начать заново',
    overview: 'Шаги', step: (i, n) => `Шаг ${i} из ${n}`, doneMark: 'Сделано сегодня',
    progress: (d, n) => `Сегодня выполнено шагов: ${d} из ${n}`,
    source: 'Источник', loading: 'Загрузка…', loadError: 'Текст не загрузился. Проверьте подключение и обновите страницу.',
    openHisn: 'Открыть в «Крепости мусульманина»', openHadith: 'Открыть хадис',
    tap: 'Нажмите', times: (n) => `Повторений: ${n}`, countLeft: (n, total) => `Нажмите: осталось ${n} из ${total}`,
    countDone: 'Выполнено', reset: 'Сбросить',
    remind: 'Время напоминания', remindHint: 'Напоминает, только пока эта страница открыта. Если вы уже разрешили уведомления, будет показано и уведомление.',
    remindOff: 'Выключить', dismiss: 'Закрыть',
    privacy: 'Сегодняшний прогресс хранится только у вас. Нет серий, баллов и сравнений.',
    clear: 'Удалить отметки за сегодня', cleared: 'Отметки за сегодня удалены.',
    marked: (s) => `«${s}» — отмечено на сегодня.`,
  },
  ar: {
    next: 'التالي', finish: 'إنهاء', back: 'رجوع', skip: 'تخطٍّ', start: 'ابدأ', resume: 'تابِع', again: 'ابدأ من جديد',
    overview: 'الخطوات', step: (i, n) => `الخطوة ${i} من ${n}`, doneMark: 'تمّت اليوم',
    progress: (d, n) => `اليوم: أُنجز ${d} من ${n}`,
    source: 'المصدر', loading: 'جارٍ التحميل…', loadError: 'تعذّر تحميل النص. تحقّق من الاتصال وأعد تحميل الصفحة.',
    openHisn: 'افتح في حصن المسلم', openHadith: 'افتح الحديث',
    tap: 'اضغط', times: (n) => (n === 1 ? 'مرة واحدة' : n === 2 ? 'مرتين' : n <= 10 ? `${n} مرات` : `${n} مرة`), countLeft: (n, total) => `اضغط: باقٍ ${n} من ${total}`,
    countDone: 'اكتمل', reset: 'إعادة',
    remind: 'وقت التذكير', remindHint: 'يذكّرك ما دامت هذه الصفحة مفتوحة فقط. وإن كنت قد سمحت بالإشعارات من قبل فسيظهر إشعار أيضًا.',
    remindOff: 'إيقاف', dismiss: 'إغلاق',
    privacy: 'يُحفظ تقدّم اليوم عندك فقط. لا سلاسل ولا نقاط ولا مقارنات.',
    clear: 'امسح علامات اليوم', cleared: 'مُسحت علامات اليوم.',
    marked: (s) => `سُجّلت «${s}» لهذا اليوم.`,
  },
  tr: {
    next: 'Sonraki', finish: 'Bitir', back: 'Geri', skip: 'Atla', start: 'Başla', resume: 'Devam et', again: 'Yeniden başla',
    overview: 'Adımlar', step: (i, n) => `Adım ${i} / ${n}`, doneMark: 'Bugün yapıldı',
    progress: (d, n) => `Bugün: ${n} adımdan ${d} tanesi yapıldı`,
    source: 'Kaynak', loading: 'Yükleniyor…', loadError: 'Metin yüklenemedi. Bağlantınızı kontrol edip sayfayı yenileyin.',
    openHisn: 'Hısnu’l-Müslim’de aç', openHadith: 'Hadise git',
    tap: 'Dokunun', times: (n) => (n === 1 ? 'bir kez' : `${n} kez`), countLeft: (n, total) => `Dokunun: ${total} kezden ${n} kez kaldı`,
    countDone: 'Tamamlandı', reset: 'Sıfırla',
    remind: 'Hatırlatma saati', remindHint: 'Yalnızca bu sayfa açıkken hatırlatır. Bildirimlere daha önce izin verdiyseniz bildirim de gösterilir.',
    remindOff: 'Kapat', dismiss: 'Kapat',
    privacy: 'Bugünkü ilerleme yalnızca sizde saklanır. Seri, puan veya karşılaştırma yoktur.',
    clear: 'Bugünkü işaretleri sil', cleared: 'Bugünkü işaretler silindi.',
    marked: (s) => `“${s}” bugün için işaretlendi.`,
  },
}

// ── Yaddaş ──
export function useRoutineStore(part) {
  const [st, setSt] = useState(() => sanitizeRoutine(null))
  const [ready, setReady] = useState(false)
  const [now, setNow] = useState(null)
  useEffect(() => {
    const load = () => { setSt(readRoutine()); setNow(new Date()) }
    load()
    setReady(true)
    const onStorage = (e) => { if (!e.key || e.key === ROUTINE_KEY || e.key.endsWith(`:${ROUTINE_KEY}`)) load() }
    const onVis = () => { if (document.visibilityState === 'visible') load() }
    window.addEventListener('storage', onStorage)
    window.addEventListener('mcc-profile', load)
    window.addEventListener(ROUTINE_EVENT, load)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('mcc-profile', load)
      window.removeEventListener(ROUTINE_EVENT, load)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])
  const done = useMemo(() => (ready && now ? stepsToday(st, part, now) : []), [st, part, ready, now])
  const mark = useCallback((id, on = true) => setSt(setRoutineStep(part, id, on)), [part])
  const clear = useCallback(() => setSt(clearRoutineToday(part)), [part])
  const prefs = useCallback((patch) => setSt(writeRoutinePrefs(patch)), [])
  return { st, ready, done, mark, clear, prefs }
}

// ── Mənbələr ──
export function useHisn(lang) {
  const src = useGuideSources([], lang, true)
  return { hisn: src.hisn, failed: src.failed }
}

export function useHadith(id, lang) {
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let live = true
    const peek = peekHadithData(lang)
    if (peek) setData(peek)
    else loadHadithData(lang).then((d) => { if (live) setData(d) }).catch(() => { if (live) setFailed(true) })
    return () => { live = false }
  }, [lang])
  const hadith = useMemo(() => {
    if (!data) return null
    const real = data.aliases?.get(id) ?? id
    return data.list.find((h) => Number(h.id) === Number(real)) || null
  }, [data, id])
  return { hadith, failed }
}

export function SpaLink({ href, className, children, testId }) {
  const navigate = useNavigate()
  return (
    <a className={className} href={href} data-testid={testId}
      onClick={(e) => { if (!isPlainClick(e)) return; e.preventDefault(); navigate(href); window.scrollTo(0, 0) }}>
      {children}
    </a>
  )
}

/** Təkrar sayğacı (Hisn "repeat"): kiçik dairəvi düymə */
export function RepeatCounter({ total, lang }) {
  const t = pickUi(RT, lang, 'en')
  const [left, setLeft] = useState(total)
  const done = left === 0
  return (
    <div className="slr-count">
      <button type="button" className={`slr-count__btn${done ? ' is-done' : ''}`} disabled={done}
        onClick={() => { haptic(); setLeft((n) => Math.max(0, n - 1)) }}
        aria-label={done ? t.countDone : t.countLeft(left, total)}>
        {done ? <Icon name="check" size={20} /> : <span className="ui-num" aria-hidden="true">{left}</span>}
      </button>
      <span className="slr-count__label">{done ? t.countDone : t.times(total)}</span>
      {left !== total && (
        <button type="button" className="ui-icon-btn slr-count__reset" onClick={() => setLeft(total)} aria-label={t.reset} title={t.reset}>
          <Icon name="refresh" size={15} />
        </button>
      )}
    </div>
  )
}

/** Hisnul-Müslim duası — ərəbcə, tərcümə (ərəb interfeysində yox), səs, təkrar, mənbə */
export function HisnDua({ it, akey, lang, counter = true }) {
  const t = pickUi(RT, lang, 'en')
  if (!it) return null
  return (
    <figure className="slr-dua" data-akey={akey}>
      <p className="slr-dua__ar ui-arabic" lang="ar" dir="rtl">{it.ar}</p>
      {lang !== 'ar' && it.text && <p className="slr-dua__text">{it.text}</p>}
      <div className="slr-dua__tools">
        {akey && <DuaListen akey={akey} lang={lang} />}
        {counter && it.repeat > 1 && <RepeatCounter total={it.repeat} lang={lang} />}
      </div>
      {it.src && <figcaption className="slr-src"><span>{t.source}:</span> <cite dir="auto">{localizeSource(it.src, lang)}</cite></figcaption>}
    </figure>
  )
}

/** Hisn fəslindən seçilmiş bəndlər; yüklənmə / xəta halları; fəslə keçid */
export function HisnBlock({ hisn, failed, chapter, items, lang, siteLang, counter = true }) {
  const t = pickUi(RT, lang, 'en')
  const ch = hisn?.get(chapter)
  const list = ch ? (items || ch.items.map((_, i) => i)) : []
  return (
    <div className="slr-hisn" data-testid={`slr-hisn-${chapter}`}>
      {ch ? list.map((i) => <HisnDua key={i} it={ch.items[i]} akey={`${chapter}:${i}`} lang={lang} counter={counter} />)
        : <p className="slr-wait">{failed ? t.loadError : t.loading}</p>}
      <p className="slr-more">
        <SpaLink href={`${pathFor('hisn', siteLang || lang)}#hs-${chapter}`} className="ui-link">
          <Icon name="duas" size={15} /> {t.openHisn}{ch ? ` — ${ch.title}` : ''}
        </SpaLink>
      </p>
    </div>
  )
}

/** Saytın hədis məlumatından bir hədis (ərəbcə, tərcümə, mənbə) + hədis səhifəsinə keçid */
export function HadithProof({ id, lang, siteLang }) {
  const t = pickUi(RT, lang, 'en')
  const { hadith, failed } = useHadith(id, lang)
  const text = (hadith?.text || '').trim()
  const showText = text && text !== (hadith?.ar || '').trim()
  const l = siteLang || lang
  const href = hadith ? pathFor('hadith', canonicalLang('hadith', l, String(hadith.id)), String(hadith.id)) : null
  return (
    <figure className="slr-dua slr-hadith" data-testid={`slr-hadith-${id}`}>
      {hadith ? (
        <>
          <p className="slr-dua__ar ui-arabic" lang="ar" dir="rtl">{hadith.ar}</p>
          {showText && <p className="slr-dua__text">{text}</p>}
          <figcaption className="slr-src">
            <span>{t.source}:</span> <cite dir="auto">{localizeSource(hadith.source, lang)}</cite>
            {href && <> · <SpaLink href={href} className="ui-link">{t.openHadith}</SpaLink></>}
          </figcaption>
        </>
      ) : <p className="slr-wait">{failed ? t.loadError : t.loading}</p>}
    </figure>
  )
}

/**
 * Bir ekranda bir addım.
 * steps: [{ id, icon, title }]; idx — cari addım; done — bu gün bitənlər;
 * onGo(i) — addıma keç; onNext() — "Növbəti/Bitir" (addım işarələnir); onSkip(); onBack().
 */
export function RoutineSteps({ steps, idx, done, lang, onNext, onSkip, onBack, nextLabel, children, testId }) {
  const t = pickUi(RT, lang, 'en')
  const headRef = useRef(null)
  const step = steps[idx]
  // Addım açılanda/dəyişəndə fokus başlığa (komponent yalnız istifadəçi "Başla"/addım seçəndə görünür)
  useEffect(() => { headRef.current?.focus() }, [idx])
  const last = idx === steps.length - 1
  const isDone = done.includes(step.id)
  return (
    <article className="slr-step" data-testid={testId} data-step={step.id} aria-labelledby="slr-step-h">
      <div className="slr-step__top">
        <span className="slr-step__n ui-num">{t.step(idx + 1, steps.length)}</span>
        {isDone && <span className="slr-step__done"><Icon name="check" size={15} /> {t.doneMark}</span>}
      </div>
      <div className="slr-bar" aria-hidden="true"><i style={{ transform: `scaleX(${(idx + 1) / steps.length})` }} /></div>
      <h2 id="slr-step-h" className="slr-step__h" tabIndex={-1} ref={headRef}>
        <Icon name={step.icon} size={26} /> <span>{step.title}</span>
      </h2>
      <div className="slr-step__body">{children}</div>
      <div className="slr-nav">
        <button type="button" className="slr-btn slr-btn--ghost" onClick={onBack}>
          <Icon name="chevronLeft" size={20} className="ui-flip-rtl" /> {t.back}
        </button>
        <button type="button" className="slr-btn slr-btn--ghost" onClick={onSkip}>{t.skip}</button>
        <button type="button" className="slr-btn slr-btn--primary slr-btn--next" onClick={onNext} data-testid="slr-next">
          {nextLabel || (last ? t.finish : t.next)} <Icon name={last ? 'check' : 'chevron'} size={20} className={last ? '' : 'ui-flip-rtl'} />
        </button>
      </div>
    </article>
  )
}

/** Addımların siyahısı (ümumi baxış): hər biri düymədir — həmin addıma keçir */
export function RoutineOverview({ steps, done, lang, onGo, onStart, ready }) {
  const t = pickUi(RT, lang, 'en')
  const n = done.length
  const firstOpen = steps.findIndex((s) => !done.includes(s.id))
  const all = firstOpen === -1
  return (
    <div className="slr-overview" data-testid="slr-overview">
      <p className="slr-progress" data-testid="slr-progress">{ready ? t.progress(n, steps.length) : ' '}</p>
      <div className="slr-bar" aria-hidden="true"><i style={{ transform: `scaleX(${n / steps.length})` }} /></div>
      <button type="button" className="slr-btn slr-btn--primary slr-btn--start" onClick={() => onStart(all ? 0 : Math.max(0, firstOpen))} data-testid="slr-start">
        <Icon name="play" size={22} /> {all ? t.again : n ? t.resume : t.start}
      </button>
      <h2 className="slr-overview__h">{t.overview}</h2>
      <ol className="slr-list">
        {steps.map((s, i) => {
          const on = done.includes(s.id)
          return (
            <li key={s.id}>
              <button type="button" className={`slr-list__btn${on ? ' is-done' : ''}`} onClick={() => onGo(i)}>
                <span className="slr-list__n ui-num" aria-hidden="true">{on ? <Icon name="check" size={16} /> : i + 1}</span>
                <Icon name={s.icon} size={20} />
                <span className="slr-list__t">{s.title}</span>
                {on && <span className="ui-sr-only">— {t.doneMark}</span>}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/**
 * Xatırlatma saatı + səhifə açıq ikən yoxlama. value — 'HH:MM' | ''.
 * Vaxt çatanda: səhifədə qeyd (onNotice) və icazə ARTIQ varsa — yerli bildiriş.
 */
export function RoutineReminder({ id, value, ready, lang, onChange, title, body }) {
  const t = pickUi(RT, lang, 'en')
  const [notice, setNotice] = useState('')
  const fired = useRef('')
  useEffect(() => {
    if (!ready || !value) return undefined
    // Səhifə saat çatmamış açılıbsa — xatırladır; saat çatandan sonra açılıbsa — həmin gün susur
    const firstKey = routineReminderDue(value, new Date(), '')
    if (firstKey) fired.current = firstKey
    const check = () => {
      const key = routineReminderDue(value, new Date(), fired.current)
      if (!key) return
      fired.current = key
      setNotice(body)
      showLocalNotification(title, { body, tag: `slr-${id}`, icon: '/android-chrome-192x192.png' }).catch(() => {})
    }
    const tmr = setInterval(check, 20000)
    return () => clearInterval(tmr)
  }, [ready, value, id, title, body])
  const inputId = `slr-remind-${id}`
  return (
    <div className="slr-remind">
      <label className="slr-remind__label" htmlFor={inputId}><Icon name="bell" size={18} /> {t.remind}</label>
      <div className="slr-remind__row">
        <input id={inputId} type="time" className="slr-remind__input" value={value} disabled={!ready}
          onChange={(e) => onChange(e.target.value)} data-testid={`slr-remind-${id}`} />
        {value && <button type="button" className="slr-btn slr-btn--ghost slr-btn--sm" onClick={() => onChange('')}>{t.remindOff}</button>}
      </div>
      <p className="slr-hint">{t.remindHint}</p>
      <div role="status" aria-live="polite" className="slr-remind__live">
        {notice && (
          <p className="slr-notice" data-testid={`slr-notice-${id}`}>
            <Icon name="bell" size={20} /> <span>{notice}</span>
            <button type="button" className="ui-icon-btn" onClick={() => setNotice('')} aria-label={t.dismiss}><Icon name="close" size={16} /></button>
          </p>
        )}
      </div>
    </div>
  )
}
