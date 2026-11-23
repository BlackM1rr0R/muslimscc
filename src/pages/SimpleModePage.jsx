// ═══════════════════════════════════════════════════════
// /simple — "Sadə rejim": yaşlılar və az görənlər üçün çox iri yazı, yüksək kontrast, 3 iri düymə
//
// • Növbəti namaz (iri saat + geri sayım), Quran dinlə (sevimli qari, "davam et"), Zikr sayğacı.
// • "Yolda" rejiminin hissələri təkrar istifadə olunur (components/road/RoadPrayer, RoadQuran, RoadDhikr və
//   styles/OnTheRoadPage.css) — həmin səhifəyə toxunulmur; rənglər saytın mövzusuna (açıq / tünd) uyğun.
// • "Bu cihazda sayt açılanda bu ekran açılsın" — components/simple/SimpleStart (ana səhifədə, ilk girişdə).
// • Yaddaş: utils/simpleMode (simple_mode_v1) — YALNIZ bu cihaz (ehtiyat nüsxə / sinxron yox);
//   mount-dan sonra oxunur (prerender ilə ilk render eyni).
// • Sadə dil: qısa cümlələr, bir ekranda bir iş.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { isPlainClick } from '../components/PageLink'
import { pathFor } from '../seo/routes'
import { pickUi } from '../utils/uiText'
import usePrayerTimes, { PRAYER_NAMES } from '../hooks/usePrayerTimes'
import { useQuranPlayer } from '../components/QuranPlayer'
import RoadQuran from '../components/road/RoadQuran'
import RoadDhikr from '../components/road/RoadDhikr'
import RoadPrayer from '../components/road/RoadPrayer'
import { DHIKRS } from '../data/dhikr'
import { AYAH_COUNTS, SURAH_START } from '../utils/quranMap'
import { surahLabel } from '../components/hifz/surahLabel'
import { resumePoint, countdownClock } from '../utils/roadMode'
import { DEFAULT_SIMPLE, readSimple, writeSimple } from '../utils/simpleMode'
import { haptic } from '../hooks/useHaptic'
import { bumpDhikrDay } from '../utils/myDay'
import '../styles/OnTheRoadPage.css'
import '../styles/SimpleModePage.css'

const T = {
  az: {
    title: 'Sadə rejim', lead: 'İri düymələr və aydın sözlər. Bir düyməyə toxunun.',
    tiles: 'Düymələr', prayer: 'Növbəti namaz', quran: 'Quran dinlə', dhikr: 'Zikr sayğacı', back: 'Geri',
    loading: 'Yüklənir…', cont: (name, n) => `Davam: ${name}, ayə ${n}`, start: 'Əvvəldən başlayın', count: (n) => `Say: ${n}`,
    settings: 'Ayarlar', home: 'Saytı açanda bu ekran açılsın', homeHint: 'Yalnız bu cihazda. İstədiyiniz vaxt söndürə bilərsiniz.',
    xl: 'Daha iri yazı', full: 'Tam sayta keç', saved: 'Yadda saxlanıldı.', done: (n) => `${n} dəfə. Hədəfə çatdınız.`,
  },
  en: {
    title: 'Simple mode', lead: 'Big buttons and clear words. Tap one button.',
    tiles: 'Buttons', prayer: 'Next prayer', quran: 'Listen to the Quran', dhikr: 'Dhikr counter', back: 'Back',
    loading: 'Loading…', cont: (name, n) => `Continue: ${name}, verse ${n}`, start: 'Start from the beginning', count: (n) => `Count: ${n}`,
    settings: 'Settings', home: 'Open this screen when I open the site', homeHint: 'Only on this device. You can turn it off at any time.',
    xl: 'Even bigger text', full: 'Go to the full site', saved: 'Saved.', done: (n) => (n === 1 ? 'Once. Target reached.' : `${n} times. Target reached.`),
  },
  ru: {
    title: 'Простой режим', lead: 'Крупные кнопки и понятные слова. Нажмите одну кнопку.',
    tiles: 'Кнопки', prayer: 'Следующий намаз', quran: 'Слушать Коран', dhikr: 'Счётчик зикра', back: 'Назад',
    loading: 'Загрузка…', cont: (name, n) => `Продолжить: ${name}, аят ${n}`, start: 'Начать с начала', count: (n) => `Счёт: ${n}`,
    settings: 'Настройки', home: 'Открывать этот экран при входе на сайт', homeHint: 'Только на этом устройстве. Выключить можно в любой момент.',
    xl: 'Ещё крупнее текст', full: 'Перейти на полный сайт', saved: 'Сохранено.', done: (n) => `Выполнено: ${n}. Цель достигнута.`,
  },
  ar: {
    title: 'الوضع البسيط', lead: 'أزرار كبيرة وكلمات واضحة. اضغط زرًّا واحدًا.',
    tiles: 'الأزرار', prayer: 'الصلاة التالية', quran: 'استمع إلى القرآن', dhikr: 'عدّاد الذكر', back: 'رجوع',
    loading: 'جارٍ التحميل…', cont: (name, n) => `متابعة: ${name}، الآية ${n}`, start: 'ابدأ من البداية', count: (n) => `العدد: ${n}`,
    settings: 'الإعدادات', home: 'افتح هذه الشاشة عند فتح الموقع', homeHint: 'على هذا الجهاز فقط، ويمكنك إيقافه متى شئت.',
    xl: 'خط أكبر', full: 'انتقل إلى الموقع الكامل', saved: 'تم الحفظ.', done: (n) => `اكتمل العدد: ${n}. بلغت الهدف.`,
  },
  tr: {
    title: 'Sade mod', lead: 'Büyük düğmeler ve açık sözler. Bir düğmeye dokunun.',
    tiles: 'Düğmeler', prayer: 'Sonraki namaz', quran: 'Kur’an dinle', dhikr: 'Zikir sayacı', back: 'Geri',
    loading: 'Yükleniyor…', cont: (name, n) => `Devam: ${name}, ${n}. ayet`, start: 'Baştan başlayın', count: (n) => `Sayı: ${n}`,
    settings: 'Ayarlar', home: 'Siteyi açınca bu ekran açılsın', homeHint: 'Yalnızca bu cihazda. İstediğiniz zaman kapatabilirsiniz.',
    xl: 'Daha büyük yazı', full: 'Tam siteye geç', saved: 'Kaydedildi.', done: (n) => `${n} kez. Hedefe ulaştınız.`,
  },
}

const PANELS = ['prayer', 'quran', 'dhikr']
const PANEL_ICON = { prayer: 'clock', quran: 'quran', dhikr: 'dhikr' }

export default function SimpleModePage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const navigate = useNavigate()

  const [ready, setReady] = useState(false)
  const [sm, setSm] = useState(DEFAULT_SIMPLE)
  const [panel, setPanel] = useState(null)
  const [msg, setMsg] = useState('')
  const [surah, setSurah] = useState(1)
  const [startAyah, setStartAyah] = useState(1)
  const [resumed, setResumed] = useState(false)
  const headRef = useRef(null)
  const lastTile = useRef(null)

  // Yaddaş — yalnız mount-dan sonra
  useEffect(() => {
    const v = readSimple()
    setSm(v)
    const rp = resumePoint(v)
    if (rp) { setSurah(rp.s); setStartAyah(rp.a); setResumed(true) }
    setReady(true)
  }, [])
  const save = useCallback((patch) => setSm(writeSimple(patch)), [])

  // ── Quran (səhifə səviyyəsində — "Geri" basanda qiraət dayanmasın) ──
  const verses = useMemo(() => Array.from({ length: AYAH_COUNTS[surah - 1] }, (_, i) => ({ n: i + 1, g: SURAH_START[surah - 1] + i + 1 })), [surah])
  const player = useQuranPlayer({
    surahNumber: surah, verses, lang,
    onSurahEnd: () => setSurah((s) => Math.min(114, s + 1)),
    mediaTitle: (n) => `${surahLabel(surah, lang)} ${surah}:${n}`,
  })
  const cur = player.current
  const surahRef = useRef(surah)
  surahRef.current = surah
  useEffect(() => { if (ready && cur) save({ s: surahRef.current, a: cur }) }, [ready, cur, save])
  const pickSurah = (n) => { setSurah(n); setStartAyah(1); setResumed(true); save({ s: n, a: 1 }) }
  const pickAyah = (n) => { setStartAyah(n); setResumed(true); save({ s: surah, a: n }) }

  // ── Namaz vaxtı: saniyədə bir (kafel də geri sayımı göstərir) ──
  const pt = usePrayerTimes()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!ready) return undefined
    const tick = () => setNow(Date.now())
    tick()
    const id = setInterval(tick, 1000)
    const onVis = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [ready])
  const prayerName = (k) => pickUi(PRAYER_NAMES[k], lang, 'en')

  // ── Panellər ──
  const open = (k) => { lastTile.current = k; setPanel(k) }
  const close = () => setPanel(null)
  useEffect(() => {
    if (panel) { headRef.current?.focus(); return }
    const k = lastTile.current
    if (k) document.querySelector(`[data-smp-tile="${k}"]`)?.focus()
  }, [panel])

  // ── Zikr ──
  const tap = () => {
    const c = sm.c + 1
    save({ c })
    bumpDhikrDay(1)
    haptic(14)
    const target = DHIKRS[sm.d]?.target || 33
    if (c === target) { haptic(60); setMsg(t.done(c)) }
  }

  const go = (e, key) => { if (!isPlainClick(e)) return; e.preventDefault(); navigate(pathFor(key, lang)); window.scrollTo(0, 0) }
  const cityName = pt.location?.city?.[lang] || pt.location?.city?.en || ''
  const next = ready ? pt.next : null
  const rp = ready && (cur || resumed) ? { s: surah, a: cur || startAyah } : null

  return (
    <div className={`smp-page${sm.xl ? ' smp--xl' : ''}`}>
      <header className="smp-hero">
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <h1 className="smp-title">{t.title}</h1>
          <p className="smp-lead">{t.lead}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container">
          <div className="road-screen smp-screen" data-testid="smp-screen">
            <p className="ui-sr-only" role="status" aria-live="polite">{msg}</p>

            {!panel && (
              <>
                <h2 className="ui-sr-only">{t.tiles}</h2>
                <ul className="smp-tiles">
                  {PANELS.map((k) => (
                    <li key={k}>
                      <button type="button" className={`smp-tile smp-tile--${k}`} data-smp-tile={k} onClick={() => open(k)}>
                        <span className="smp-tile__head"><Icon name={PANEL_ICON[k]} size={48} /> <span>{t[k]}</span></span>
                        {k === 'prayer' && (
                          next
                            ? <span className="smp-tile__body">
                                <span className="smp-tile__big">{prayerName(next.key)} <b className="ui-num">{next.adhan}</b></span>
                                <span className="smp-tile__count ui-num" aria-hidden="true" data-testid="smp-tile-count">{countdownClock(next.at - now)}</span>
                              </span>
                            : <span className="smp-tile__sub">{t.loading}</span>
                        )}
                        {k === 'quran' && (
                          <span className="smp-tile__sub">{rp ? t.cont(surahLabel(rp.s, lang), rp.a) : t.start}</span>
                        )}
                        {k === 'dhikr' && <span className="smp-tile__sub ui-num">{t.count(sm.c)}</span>}
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="road-settings smp-settings" role="group" aria-labelledby="smp-settings-h">
                  <h2 id="smp-settings-h" className="road-settings__h">{t.settings}</h2>
                  <div className="road-row">
                    <button type="button" className="road-btn road-btn--wide" aria-pressed={sm.home} disabled={!ready}
                      onClick={() => { save({ home: !sm.home }); setMsg(t.saved) }} data-testid="smp-home">
                      <Icon name="home" size={28} /> {t.home}
                    </button>
                    <button type="button" className="road-btn road-btn--wide" aria-pressed={sm.xl} disabled={!ready}
                      onClick={() => { save({ xl: !sm.xl }); setMsg(t.saved) }} data-testid="smp-xl">
                      <Icon name="type" size={28} /> {t.xl}
                    </button>
                  </div>
                  <p className="road-hint">{t.homeHint}</p>
                  <a className="road-btn road-btn--wide smp-full" href={pathFor('home', lang)} onClick={(e) => go(e, 'home')}>
                    {t.full} <Icon name="chevron" size={24} className="ui-flip-rtl" />
                  </a>
                </div>
              </>
            )}

            {panel && (
              <div className="road-panel" data-testid={`smp-panel-${panel}`}>
                <div className="road-panel__top">
                  <button type="button" className="road-btn road-btn--back" onClick={close}>
                    <Icon name="chevronLeft" size={32} className="ui-flip-rtl" /> {t.back}
                  </button>
                  <h2 className="road-panel__h" tabIndex={-1} ref={headRef}>{t[panel]}</h2>
                </div>
                {panel === 'prayer' && (
                  <RoadPrayer pt={pt} now={now} lang={lang} cityName={cityName}
                    prayerHref={pathFor('prayer', lang)} onPrayerLink={(e) => go(e, 'prayer')} onSay={null} />
                )}
                {panel === 'quran' && (
                  <RoadQuran player={player} surah={surah} ayah={startAyah} lang={lang} onSurah={pickSurah} onAyah={pickAyah} />
                )}
                {panel === 'dhikr' && (
                  <RoadDhikr idx={sm.d} count={sm.c} lang={lang} onTap={tap}
                    onReset={() => save({ c: 0 })} onPick={(i) => save({ d: i, c: 0 })} />
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
