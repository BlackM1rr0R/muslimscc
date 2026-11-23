// ═══════════════════════════════════════════════════════
// /bedtime-sunnah — yatmazdan əvvəl sünnə ardıcıllığı (sakit, bir ekranda bir addım)
//
// Addımlar və mənbələri (HEÇ BİR dini mətn burada yazılmır — hamısı saytın məlumatındandır):
//   wudu   — hədis 1063 (Buxari 247, src/data/hadiths.js) + namaz bələdçisinin dəstəmaz rejimi (#wudu)
//   dust   — Hisnul-Müslim 29:3 (mənbəsində yatağı silkələmək hədisi: Buxari, Muslim)
//   side   — hədis 1063 + Hisn 29:5 (mənbəsində sağ əli yanağın altına qoymaq)
//   quls   — Hisn 29:0 (İxlas, Fələq, Nas — ovuclara üfürərək, 3 dəfə) + Quranda surələrə keçid
//   kursi  — Hisn 29:1
//   tasbih — Hisn 29:7 (33/33/34) + sayğac (components/routine/BedTasbih)
//   duas   — Hisn 29: 2, 4, 6, 8, 9, 10, 12
//   mulk   — Hisn 29:11 (Tirmizi 2892) + saytın Quran pleyeri (useQuranPlayer), yuxu saatı "surənin
//            sonu" (SleepTimer); ekran QuranZen-in "gecə qiraəti" kimi yavaş-yavaş qaralır
//            (sleepProgress × 0.6); qiraət bitəndə ekran kilidi (useWakeLock) buraxılır.
// Ekran susmaya görə TÜND (istəyə görə açıq). İrəliləyiş yalnız bu gün üçün — utils/sleepRoutine.
// Yaddaş mount-dan sonra oxunur (prerender = ilk render).
// ═══════════════════════════════════════════════════════
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import { pathFor } from '../seo/routes'
import { pickUi } from '../utils/uiText'
import useWakeLock from '../hooks/useWakeLock'
import { useQuranPlayer } from '../components/QuranPlayer'
import SleepTimer, { sleepProgress } from '../components/quran/SleepTimer'
import { AYAH_COUNTS, SURAH_START } from '../utils/quranMap'
import { surahLabel } from '../components/hifz/surahLabel'
import { fetchSurahText } from '../utils/surahText'
import BedTasbih from '../components/routine/BedTasbih'
import {
  RT, useRoutineStore, useHisn, HisnBlock, HadithProof, RoutineSteps, RoutineOverview, RoutineReminder, SpaLink,
} from '../components/routine/RoutineParts'
import '../styles/SleepRoutine.css'

const QuranZen = lazy(() => import('../components/quran/QuranZen'))

const MULK = 67
const MULK_N = AYAH_COUNTS[MULK - 1]
const WUDU_HADITH = 1063
const HISN_SLEEP = 29
const DUA_ITEMS = [2, 4, 6, 8, 9, 10, 12]
const QULS = [112, 113, 114]
const DIM_MAX = 0.6

const T = {
  az: {
    title: 'Yatmazdan əvvəl sünnə',
    lead: 'Sakit, addım-addım: dəstəmazdan Mülk surəsinə qədər. Hər addımın mətni saytdakı Hisnul-Müslimdən və hədislərdən olduğu kimi götürülüb, mənbəyi yanındadır.',
    light: 'Açıq ekran',
    steps: {
      wudu: 'Dəstəmaz', dust: 'Yatağı silkələmək', side: 'Sağ tərəfə uzanmaq',
      quls: 'İxlas, Fələq və Nas — üç dəfə, ovuclara üfürərək', kursi: 'Ayətül-Kürsi',
      tasbih: 'Təsbih: 33 · 33 · 34', duas: 'Yatarkən dualar', mulk: 'Mülk surəsini dinlə',
    },
    wuduGuide: 'Dəstəmaz addım-addım', readQuran: 'Quranda oxu',
    listen: 'Dinlə — surənin sonunda dayanır', pause: 'Dayandır', resume: 'Davam et',
    verse: (n, total) => `Ayə ${n} / ${total}`, zen: 'Tam ekran gecə qiraəti', zenError: 'Surənin mətni yüklənmədi. Səs yenə də işləyir.',
    dimNote: 'Surə oxunduqca ekran yavaş-yavaş qaralır.',
    awakeOn: 'Qiraət bitənə qədər ekran sönmür.', awakeOff: 'Bu brauzer ekranı açıq saxlaya bilmir.',
    ended: 'Qiraət bitdi. Ekran artıq sönə bilər.',
    endTitle: 'Ardıcıllıq tamamlandı', endText: 'Bu axşamın addımları yalnız bu cihazda qeyd olundu.', toSteps: 'Addımlara qayıt',
    remindTitle: 'Yatmazdan əvvəl sünnə', remindBody: 'Yatmazdan əvvəl sünnə ardıcıllığının vaxtıdır.',
  },
  en: {
    title: 'Bedtime Sunnah routine',
    lead: 'A calm, step-by-step routine from wudu to Surat al-Mulk. Every step’s text is quoted as it is from Hisn al-Muslim and the hadiths on this site, with its source.',
    light: 'Light screen',
    steps: {
      wudu: 'Wudu', dust: 'Dusting off the bed', side: 'Lying on the right side',
      quls: 'Al-Ikhlas, al-Falaq and an-Nas — three times, blowing into the palms', kursi: 'Ayat al-Kursi',
      tasbih: 'Tasbih: 33 · 33 · 34', duas: 'Duas before sleeping', mulk: 'Listen to al-Mulk',
    },
    wuduGuide: 'Wudu step by step', readQuran: 'Read in the Quran',
    listen: 'Listen — stops at the end of the surah', pause: 'Pause', resume: 'Resume',
    verse: (n, total) => `Verse ${n} of ${total}`, zen: 'Full-screen night recitation', zenError: 'The surah text could not be loaded. The audio still works.',
    dimNote: 'The screen slowly dims while the surah plays.',
    awakeOn: 'The screen stays on until the recitation ends.', awakeOff: 'This browser can’t keep the screen on.',
    ended: 'The recitation has ended. The screen can turn off now.',
    endTitle: 'Routine complete', endText: 'Tonight’s steps are marked on this device only.', toSteps: 'Back to the steps',
    remindTitle: 'Bedtime Sunnah routine', remindBody: 'It’s time for your bedtime Sunnah routine.',
  },
  ru: {
    title: 'Сунна перед сном',
    lead: 'Спокойно, шаг за шагом: от омовения до суры аль-Мульк. Текст каждого шага приведён как есть из «Крепости мусульманина» и хадисов на сайте, с источником.',
    light: 'Светлый экран',
    steps: {
      wudu: 'Омовение', dust: 'Отряхнуть постель', side: 'Лечь на правый бок',
      quls: 'Аль-Ихлас, аль-Фаляк и ан-Нас — трижды, подув в ладони', kursi: 'Аят аль-Курси',
      tasbih: 'Тасбих: 33 · 33 · 34', duas: 'Мольбы перед сном', mulk: 'Слушать суру аль-Мульк',
    },
    wuduGuide: 'Омовение шаг за шагом', readQuran: 'Читать в Коране',
    listen: 'Слушать — остановится в конце суры', pause: 'Пауза', resume: 'Продолжить',
    verse: (n, total) => `Аят ${n} из ${total}`, zen: 'Ночное чтение на весь экран', zenError: 'Текст суры не загрузился. Звук работает.',
    dimNote: 'Пока звучит сура, экран медленно темнеет.',
    awakeOn: 'Экран не гаснет до конца чтения.', awakeOff: 'Этот браузер не может держать экран включённым.',
    ended: 'Чтение завершено. Теперь экран может погаснуть.',
    endTitle: 'Всё выполнено', endText: 'Шаги этого вечера отмечены только на этом устройстве.', toSteps: 'Вернуться к шагам',
    remindTitle: 'Сунна перед сном', remindBody: 'Время для сунны перед сном.',
  },
  ar: {
    title: 'سنن النوم',
    lead: 'خطوة بعد خطوة بهدوء: من الوضوء إلى سورة الملك. نص كل خطوة منقول كما هو من حصن المسلم والأحاديث في الموقع، مع مصدره.',
    light: 'شاشة فاتحة',
    steps: {
      wudu: 'الوضوء', dust: 'نفض الفراش', side: 'الاضطجاع على الشق الأيمن',
      quls: 'الإخلاص والفلق والناس — ثلاث مرات مع النفث في الكفين', kursi: 'آية الكرسي',
      tasbih: 'التسبيح: ٣٣ · ٣٣ · ٣٤', duas: 'أدعية النوم', mulk: 'استمع إلى سورة الملك',
    },
    wuduGuide: 'الوضوء خطوة بخطوة', readQuran: 'اقرأ في المصحف',
    listen: 'استمع — يتوقف عند نهاية السورة', pause: 'إيقاف مؤقت', resume: 'متابعة',
    verse: (n, total) => `الآية ${n} من ${total}`, zen: 'تلاوة ليلية بملء الشاشة', zenError: 'تعذّر تحميل نص السورة. الصوت يعمل.',
    dimNote: 'تخفت الشاشة تدريجيًا أثناء التلاوة.',
    awakeOn: 'تبقى الشاشة مضاءة حتى تنتهي التلاوة.', awakeOff: 'هذا المتصفح لا يستطيع إبقاء الشاشة مضاءة.',
    ended: 'انتهت التلاوة. يمكن أن تنطفئ الشاشة الآن.',
    endTitle: 'اكتملت الخطوات', endText: 'سُجّلت خطوات هذه الليلة على هذا الجهاز فقط.', toSteps: 'العودة إلى الخطوات',
    remindTitle: 'سنن النوم', remindBody: 'حان وقت سنن النوم.',
  },
  tr: {
    title: 'Yatmadan önce sünnet',
    lead: 'Sakin, adım adım: abdestten Mülk suresine kadar. Her adımın metni sitedeki Hısnu’l-Müslim’den ve hadislerden olduğu gibi alınmıştır, kaynağı yanındadır.',
    light: 'Açık ekran',
    steps: {
      wudu: 'Abdest', dust: 'Yatağı silkelemek', side: 'Sağ tarafa uzanmak',
      quls: 'İhlâs, Felak ve Nâs — üç kez, avuçlara üfleyerek', kursi: 'Âyetü’l-Kürsî',
      tasbih: 'Tesbih: 33 · 33 · 34', duas: 'Uyurken dualar', mulk: 'Mülk suresini dinle',
    },
    wuduGuide: 'Adım adım abdest', readQuran: 'Kur’an’da oku',
    listen: 'Dinle — surenin sonunda durur', pause: 'Duraklat', resume: 'Devam et',
    verse: (n, total) => `Ayet ${n} / ${total}`, zen: 'Tam ekran gece tilaveti', zenError: 'Surenin metni yüklenemedi. Ses yine çalışır.',
    dimNote: 'Sure okunurken ekran yavaş yavaş kararır.',
    awakeOn: 'Tilavet bitene kadar ekran kapanmaz.', awakeOff: 'Bu tarayıcı ekranı açık tutamıyor.',
    ended: 'Tilavet bitti. Ekran artık kapanabilir.',
    endTitle: 'Adımlar tamamlandı', endText: 'Bu akşamın adımları yalnızca bu cihazda işaretlendi.', toSteps: 'Adımlara dön',
    remindTitle: 'Yatmadan önce sünnet', remindBody: 'Yatmadan önceki sünnet adımlarının vakti geldi.',
  },
}

const ICONS = { wudu: 'drop', dust: 'bedtime', side: 'moon', quls: 'quran', kursi: 'star', tasbih: 'dhikr', duas: 'duas', mulk: 'volume' }
const ORDER = ['wudu', 'dust', 'side', 'quls', 'kursi', 'tasbih', 'duas', 'mulk']

export default function BedtimeRoutinePage({ setPage }) {
  const { lang, siteLang } = useLang()
  const t = pickUi(T, lang, 'en')
  const r = pickUi(RT, lang, 'en')
  const store = useRoutineStore('b')
  const { hisn, failed } = useHisn(lang)
  const steps = useMemo(() => ORDER.map((id) => ({ id, icon: ICONS[id], title: t.steps[id] })), [t])
  // 'intro' | addım indeksi | 'end'
  const [stage, setStage] = useState('intro')
  const [said, setSaid] = useState('')
  const light = store.st.bl
  const inStep = typeof stage === 'number'
  const step = inStep ? steps[stage] : null
  const l = siteLang || lang

  // ── Mülk: saytın pleyeri (səhifə səviyyəsində — addımdan çıxanda da səslənməyə davam edir) ──
  const verses = useMemo(() => Array.from({ length: MULK_N }, (_, i) => ({ n: i + 1, g: SURAH_START[MULK - 1] + i + 1 })), [])
  const player = useQuranPlayer({ surahNumber: MULK, verses, lang, mediaTitle: (n) => `${surahLabel(MULK, lang)} ${MULK}:${n}` })
  const playing = player.status === 'playing' || player.status === 'loading'
  const [ended, setEnded] = useState(false)
  const started = useRef(false)
  const prevSleep = useRef(null)
  useEffect(() => { if (player.status === 'playing') { started.current = true; setEnded(false) } }, [player.status])
  // Qiraətin sonu: yuxu saatı bitdi (pleyer fasilədə) və ya surə sona çatıb pleyer dayandı
  useEffect(() => {
    const was = prevSleep.current
    prevSleep.current = player.sleep
    const timerDone = was && !player.sleep && player.status === 'paused'
    const stopped = started.current && player.status === 'idle'
    if (timerDone || stopped) {
      started.current = false
      setEnded(true)
      store.mark('mulk', true)
      setSaid(t.ended)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.sleep, player.status])

  const listen = () => {
    setEnded(false)
    if (!player.sleep) player.setSleep('surah')
    if (player.current == null) player.start(1)
    else player.toggle()
  }

  // "Gecə qiraəti" kimi qaralma (QuranZen ilə eyni hesab: sleepProgress × 0.6)
  // Yalnız Mülk addımında və son ekranda (başqa addıma qayıdanda ekran yenidən aydın olur)
  const night = stage === ORDER.indexOf('mulk') || stage === 'end'
  const dim = !night ? 0 : ended ? DIM_MAX : player.sleep ? DIM_MAX * sleepProgress(player.sleep, { current: player.current || 0, total: MULK_N }) : 0

  // Tam ekran (QuranZen) — mətn yalnız istənəndə (Quran səhifəsi ilə eyni mənbə)
  const [zen, setZen] = useState(null)
  const [zenErr, setZenErr] = useState(false)
  const openZen = () => {
    setZenErr(false)
    fetchSurahText(MULK).then((rows) => setZen(rows.map((x) => ({ n: x.a, g: x.g, ar: x.ar })))).catch(() => setZenErr(true))
  }

  // Ekran kilidi: addımlar boyunca; qiraət bitəndə və ya ardıcıllıq bitəndə buraxılır
  const awake = useWakeLock(inStep && !ended)

  const go = (i) => { setStage(i); window.scrollTo?.(0, 0) }
  const next = () => {
    store.mark(step.id, true)
    setSaid(r.marked(step.title))
    if (stage >= steps.length - 1) setStage('end')
    else go(stage + 1)
  }
  const skip = () => (stage >= steps.length - 1 ? setStage('end') : go(stage + 1))
  const back = () => (stage === 0 ? setStage('intro') : go(stage - 1))

  // Son ekrandan / geri qayıdanda fokus
  const endRef = useRef(null)
  useEffect(() => { if (stage === 'end') endRef.current?.focus() }, [stage])

  const body = (id) => {
    switch (id) {
      case 'wudu':
        return (
          <>
            <HadithProof id={WUDU_HADITH} lang={lang} siteLang={l} />
            <p className="slr-more">
              <SpaLink href={`${pathFor('prayerguide', l)}#wudu`} className="slr-btn slr-btn--soft" testId="slr-wudu-link">
                <Icon name="drop" size={18} /> {t.wuduGuide}
              </SpaLink>
            </p>
          </>
        )
      case 'dust':
        return <HisnBlock hisn={hisn} failed={failed} chapter={HISN_SLEEP} items={[3]} lang={lang} siteLang={l} />
      case 'side':
        return (
          <>
            <HadithProof id={WUDU_HADITH} lang={lang} siteLang={l} />
            <HisnBlock hisn={hisn} failed={failed} chapter={HISN_SLEEP} items={[5]} lang={lang} siteLang={l} />
          </>
        )
      case 'quls':
        return (
          <>
            <HisnBlock hisn={hisn} failed={failed} chapter={HISN_SLEEP} items={[0]} lang={lang} siteLang={l} />
            <ul className="slr-chips" aria-label={t.readQuran}>
              {QULS.map((s) => (
                <li key={s}>
                  <SpaLink href={pathFor('quran', l, s)} className="slr-chip"><Icon name="quran" size={16} /> {surahLabel(s, lang)}</SpaLink>
                </li>
              ))}
            </ul>
          </>
        )
      case 'kursi':
        return <HisnBlock hisn={hisn} failed={failed} chapter={HISN_SLEEP} items={[1]} lang={lang} siteLang={l} />
      case 'tasbih':
        return (
          <>
            <BedTasbih lang={lang} />
            <HisnBlock hisn={hisn} failed={failed} chapter={HISN_SLEEP} items={[7]} lang={lang} siteLang={l} />
          </>
        )
      case 'duas':
        return <HisnBlock hisn={hisn} failed={failed} chapter={HISN_SLEEP} items={DUA_ITEMS} lang={lang} siteLang={l} />
      case 'mulk':
        return (
          <>
            <HisnBlock hisn={hisn} failed={failed} chapter={HISN_SLEEP} items={[11]} lang={lang} siteLang={l} />
            <div className="slr-mulk" data-testid="slr-mulk">
              <p className="slr-mulk__name"><b>{surahLabel(MULK, lang)}</b>
                <span className="ui-num">{t.verse(player.current || 1, MULK_N)}</span></p>
              <div className="slr-mulk__row">
                <button type="button" className="slr-btn slr-btn--primary slr-btn--play"
                  onClick={() => (playing ? player.pause() : listen())} data-testid="slr-mulk-play">
                  <Icon name={playing ? 'pause' : 'play'} size={24} /> {playing ? t.pause : player.current ? t.resume : t.listen}
                </button>
                <button type="button" className="slr-btn slr-btn--ghost" onClick={openZen} data-testid="slr-zen">
                  <Icon name="moonStar" size={20} /> {t.zen}
                </button>
              </div>
              <SleepTimer player={player} lang={lang} variant="panel" />
              <p className="slr-hint">{t.dimNote}</p>
              {zenErr && <p className="slr-hint" role="status">{t.zenError}</p>}
              <p className="slr-hint" data-testid="slr-awake">{ended ? t.ended : awake === 'on' ? t.awakeOn : awake === 'unsupported' ? t.awakeOff : ''}</p>
            </div>
          </>
        )
      default: return null
    }
  }

  return (
    <div className="slr-page slr-page--bed">
      <header className="ui-page-hero slr-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel(navGroupOf('bedtime'), lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.lead}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container">
          <div className={`slr-screen ${light ? 'slr--light' : 'slr--dark'}`} data-testid="slr-screen">
            <div className="slr-top">
              <p className="slr-privacy"><Icon name="lock" size={16} /> {r.privacy}</p>
              <button type="button" className="slr-btn slr-btn--ghost slr-btn--sm" aria-pressed={light} disabled={!store.ready}
                onClick={() => store.prefs({ bl: !light })} data-testid="slr-light">
                <Icon name={light ? 'sun' : 'moon'} size={18} /> {t.light}
              </button>
            </div>
            <p className="ui-sr-only" role="status" aria-live="polite">{said}</p>

            {stage === 'intro' && (
              <>
                <RoutineOverview steps={steps} done={store.done} lang={lang} ready={store.ready} onGo={go} onStart={go} />
                <RoutineReminder id="bed" value={store.st.rb} ready={store.ready} lang={lang}
                  onChange={(v) => store.prefs({ rb: v })} title={t.remindTitle} body={t.remindBody} />
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
                <Icon name="moonStar" size={44} />
                <h2 className="slr-step__h" tabIndex={-1} ref={endRef}>{t.endTitle}</h2>
                <p>{t.endText}</p>
                <button type="button" className="slr-btn slr-btn--soft" onClick={() => setStage('intro')}>{t.toSteps}</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {dim > 0 && !zen && <div className="slr-dim" aria-hidden="true" style={{ '--slr-dim': dim.toFixed(3) }} data-testid="slr-dim" />}
      {zen && (
        <Suspense fallback={null}>
          <QuranZen player={player} verses={zen} title={surahLabel(MULK, lang)} lang={lang} start={player.current || 1} surah={MULK}
            onClose={() => { setZen(null); document.querySelector('[data-testid="slr-zen"]')?.focus() }} />
        </Suspense>
      )}
    </div>
  )
}
