// ═══════════════════════════════════════════════════════
// /morning-routine — səhər oyanış ardıcıllığı (bir ekranda bir addım)
//
// Addımlar və mənbələri (HEÇ BİR dini mətn burada yazılmır — hamısı saytın məlumatındandır):
//   wake    — Hisnul-Müslim, "Yuxudan oyanarkən oxunan zikrlər" (fəsil 2, bütün bəndlər, mənbələri ilə)
//   adhkar  — Hisnul-Müslim "Səhər və axşam zikrləri" (fəsil 28) — mövcud tam ekran sayğac
//             (components/hisn/AdhkarFocus, part="morning"); irəliləyiş Hisn səhifəsi ilə ortaqdır
//   sunnah  — Günün sünnəsi (components/DailySunnah — saytın hədis məlumatı ilə)
//   prayers — bu günün namaz vaxtları (hooks/usePrayerTimes — seçilmiş şəhər + məzhəb)
// Misvak qeydi YOXDUR: oyanarkən misvak hədisi saytın məlumatında yoxdur (yalnız "hər namazda").
// İrəliləyiş yalnız bu gün üçün — utils/sleepRoutine. Şəxsi vəziyyət mount-dan sonra oxunur.
// ═══════════════════════════════════════════════════════
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import { pathFor } from '../seo/routes'
import { pickUi } from '../utils/uiText'
import { adhkarProgress } from '../components/hisn/adhkarState'
import TodayPrayers from '../components/routine/TodayPrayers'
import {
  RT, useRoutineStore, useHisn, HisnBlock, RoutineSteps, RoutineOverview, RoutineReminder,
} from '../components/routine/RoutineParts'
import '../styles/SleepRoutine.css'

const AdhkarFocus = lazy(() => import('../components/hisn/AdhkarFocus'))
const DailySunnah = lazy(() => import('../components/DailySunnah'))

const HISN_WAKE = 2
const HISN_ADHKAR = 28

const T = {
  az: {
    title: 'Səhər oyanışı',
    lead: 'Oyananda sakit başlanğıc: oyanış zikrləri, səhər azkarı, günün sünnəsi və bu günün namaz vaxtları. Mətnlər saytdakı Hisnul-Müslimdən və hədislərdən, mənbələri ilə.',
    steps: { wake: 'Oyananda deyilən zikrlər', adhkar: 'Səhər azkarı', sunnah: 'Günün sünnəsi', prayers: 'Bu günün namaz vaxtları' },
    adhkarLead: (d, n) => `Hisnul-Müslimdən zikrlər bir-bir, sayğacla. Bu gün: ${n} zikrdən ${d}-i.`,
    adhkarStart: 'Səhər azkarına başla', adhkarCont: 'Səhər azkarına davam et', adhkarAgain: 'Yenidən oxu',
    endTitle: 'Sabahınız xeyir', endText: 'Bu səhərin addımları yalnız bu cihazda qeyd olundu.', toSteps: 'Addımlara qayıt',
    remindTitle: 'Səhər oyanışı', remindBody: 'Səhər oyanış ardıcıllığının vaxtıdır.',
  },
  en: {
    title: 'Morning waking routine',
    lead: 'A calm start when you wake up: the remembrance upon waking, the morning adhkar, the Sunnah of the day and today’s prayer times. The texts come from Hisn al-Muslim and the hadiths on this site, with their sources.',
    steps: { wake: 'Remembrance upon waking up', adhkar: 'Morning adhkar', sunnah: 'Sunnah of the day', prayers: 'Today’s prayer times' },
    adhkarLead: (d, n) => `The adhkar from Hisn al-Muslim one at a time, with a counter. Today: ${d} of ${n}.`,
    adhkarStart: 'Start the morning adhkar', adhkarCont: 'Continue the morning adhkar', adhkarAgain: 'Read again',
    endTitle: 'Good morning', endText: 'This morning’s steps are marked on this device only.', toSteps: 'Back to the steps',
    remindTitle: 'Morning waking routine', remindBody: 'It’s time for your morning waking routine.',
  },
  ru: {
    title: 'Утреннее пробуждение',
    lead: 'Спокойное начало дня: поминание при пробуждении, утренние азкары, сунна дня и время намазов на сегодня. Тексты — из «Крепости мусульманина» и хадисов на сайте, с источниками.',
    steps: { wake: 'Поминание при пробуждении', adhkar: 'Утренние азкары', sunnah: 'Сунна дня', prayers: 'Время намазов на сегодня' },
    adhkarLead: (d, n) => `Азкары из «Крепости мусульманина» по одному, со счётчиком. Сегодня: ${d} из ${n}.`,
    adhkarStart: 'Начать утренние азкары', adhkarCont: 'Продолжить утренние азкары', adhkarAgain: 'Прочитать снова',
    endTitle: 'Доброе утро', endText: 'Шаги этого утра отмечены только на этом устройстве.', toSteps: 'Вернуться к шагам',
    remindTitle: 'Утреннее пробуждение', remindBody: 'Время для утренних шагов после пробуждения.',
  },
  ar: {
    title: 'الاستيقاظ صباحًا',
    lead: 'بداية هادئة عند الاستيقاظ: أذكار الاستيقاظ، وأذكار الصباح، وسنة اليوم، ومواقيت صلاة اليوم. النصوص من حصن المسلم والأحاديث في الموقع، مع مصادرها.',
    steps: { wake: 'أذكار الاستيقاظ من النوم', adhkar: 'أذكار الصباح', sunnah: 'سنة اليوم', prayers: 'مواقيت صلاة اليوم' },
    adhkarLead: (d, n) => `أذكار حصن المسلم واحدًا بعد واحد مع العدّاد. اليوم: ${d} من ${n}.`,
    adhkarStart: 'ابدأ أذكار الصباح', adhkarCont: 'تابِع أذكار الصباح', adhkarAgain: 'اقرأ مجددًا',
    endTitle: 'صباح الخير', endText: 'سُجّلت خطوات هذا الصباح على هذا الجهاز فقط.', toSteps: 'العودة إلى الخطوات',
    remindTitle: 'الاستيقاظ صباحًا', remindBody: 'حان وقت خطوات الصباح.',
  },
  tr: {
    title: 'Sabah uyanışı',
    lead: 'Uyanınca sakin bir başlangıç: uyanma zikirleri, sabah zikirleri, günün sünneti ve bugünün namaz vakitleri. Metinler sitedeki Hısnu’l-Müslim’den ve hadislerden, kaynaklarıyla.',
    steps: { wake: 'Uyanınca okunan zikirler', adhkar: 'Sabah zikirleri', sunnah: 'Günün sünneti', prayers: 'Bugünün namaz vakitleri' },
    adhkarLead: (d, n) => `Hısnu’l-Müslim’den zikirler tek tek, sayaçla. Bugün: ${n} zikirden ${d} tanesi.`,
    adhkarStart: 'Sabah zikirlerine başla', adhkarCont: 'Sabah zikirlerine devam et', adhkarAgain: 'Yeniden oku',
    endTitle: 'Hayırlı sabahlar', endText: 'Bu sabahın adımları yalnızca bu cihazda işaretlendi.', toSteps: 'Adımlara dön',
    remindTitle: 'Sabah uyanışı', remindBody: 'Sabah uyanış adımlarının vakti geldi.',
  },
}

const ICONS = { wake: 'waking', adhkar: 'dhikr', sunnah: 'star', prayers: 'clock' }
const ORDER = ['wake', 'adhkar', 'sunnah', 'prayers']

export default function MorningRoutinePage({ setPage }) {
  const { lang, siteLang } = useLang()
  const t = pickUi(T, lang, 'en')
  const r = pickUi(RT, lang, 'en')
  const store = useRoutineStore('w')
  const { hisn, failed } = useHisn(lang)
  const steps = useMemo(() => ORDER.map((id) => ({ id, icon: ICONS[id], title: t.steps[id] })), [t])
  const [stage, setStage] = useState('intro')
  const [said, setSaid] = useState('')
  const inStep = typeof stage === 'number'
  const step = inStep ? steps[stage] : null
  const l = siteLang || lang

  // Səhər azkarı (tam ekran) — Hisn səhifəsi ilə eyni komponent və eyni irəliləyiş
  const adhkarCh = hisn?.get(HISN_ADHKAR)
  const [focusOpen, setFocusOpen] = useState(false)
  const [, bump] = useState(0)
  const adhkarBtn = useRef(null)
  const pr = adhkarCh && store.ready ? adhkarProgress('morning', adhkarCh.items) : null
  const closeFocus = () => {
    setFocusOpen(false)
    bump((x) => x + 1)
    requestAnimationFrame(() => adhkarBtn.current?.focus())
  }

  const go = (i) => { setStage(i); window.scrollTo?.(0, 0) }
  const next = () => {
    store.mark(step.id, true)
    setSaid(r.marked(step.title))
    if (stage >= steps.length - 1) setStage('end')
    else go(stage + 1)
  }
  const skip = () => (stage >= steps.length - 1 ? setStage('end') : go(stage + 1))
  const back = () => (stage === 0 ? setStage('intro') : go(stage - 1))
  const endRef = useRef(null)
  useEffect(() => { if (stage === 'end') endRef.current?.focus() }, [stage])

  const body = (id) => {
    switch (id) {
      case 'wake':
        return <HisnBlock hisn={hisn} failed={failed} chapter={HISN_WAKE} lang={lang} siteLang={l} />
      case 'adhkar':
        return (
          <div className="slr-adhkar" data-testid="slr-adhkar">
            {pr ? (
              <>
                <p>{t.adhkarLead(pr.done, pr.total)}</p>
                <div className="slr-bar" aria-hidden="true"><i style={{ transform: `scaleX(${pr.done / pr.total})` }} /></div>
                <button ref={adhkarBtn} type="button" className="slr-btn slr-btn--primary" onClick={() => setFocusOpen(true)} data-testid="slr-adhkar-open">
                  <Icon name="play" size={20} /> {pr.done >= pr.total ? t.adhkarAgain : pr.started ? t.adhkarCont : t.adhkarStart}
                </button>
              </>
            ) : <p className="slr-wait">{failed ? r.loadError : r.loading}</p>}
          </div>
        )
      case 'sunnah':
        return store.ready ? <Suspense fallback={<p className="slr-wait">{r.loading}</p>}><DailySunnah /></Suspense> : null
      case 'prayers':
        return store.ready ? <TodayPrayers lang={lang} prayerHref={pathFor('prayer', l)} /> : null
      default: return null
    }
  }

  return (
    <div className="slr-page slr-page--wake">
      <header className="ui-page-hero slr-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel(navGroupOf('waking'), lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.lead}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container">
          <div className="slr-screen slr--site" data-testid="slr-screen">
            <div className="slr-top">
              <p className="slr-privacy"><Icon name="lock" size={16} /> {r.privacy}</p>
            </div>
            <p className="ui-sr-only" role="status" aria-live="polite">{said}</p>

            {stage === 'intro' && (
              <>
                <RoutineOverview steps={steps} done={store.done} lang={lang} ready={store.ready} onGo={go} onStart={go} />
                <RoutineReminder id="wake" value={store.st.rw} ready={store.ready} lang={lang}
                  onChange={(v) => store.prefs({ rw: v })} title={t.remindTitle} body={t.remindBody} />
                {store.done.length > 0 && (
                  <button type="button" className="slr-btn slr-btn--ghost slr-btn--sm" onClick={() => { store.clear(); setSaid(r.cleared) }}>
                    <Icon name="trash" size={16} /> {r.clear}
                  </button>
                )}
              </>
            )}

            {inStep && (
              <RoutineSteps steps={steps} idx={stage} done={store.done} lang={lang} testId="slr-step"
                onNext={next} onSkip={skip} onBack={back}>
                {body(step.id)}
              </RoutineSteps>
            )}

            {stage === 'end' && (
              <div className="slr-end" data-testid="slr-end">
                <Icon name="sun" size={44} />
                <h2 className="slr-step__h" tabIndex={-1} ref={endRef}>{t.endTitle}</h2>
                <p>{t.endText}</p>
                <button type="button" className="slr-btn slr-btn--soft" onClick={() => setStage('intro')}>{t.toSteps}</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {focusOpen && adhkarCh && (
        <Suspense fallback={null}>
          <AdhkarFocus items={adhkarCh.items} part="morning" lang={lang} isAr={lang === 'ar'} onClose={closeFocus} />
        </Suspense>
      )}
    </div>
  )
}
