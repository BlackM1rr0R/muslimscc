// ═══════════════════════════════════════════════════════
// /on-the-road — "Yolda" rejimi: maşın / səfər ekranı
//
// • Çox iri toxunma sahələri (≥ 72px), yüksək kontrast, susmaya görə TÜND ekran, minimum mətn.
// • Dörd kafel: Quran dinlə (components/road/RoadQuran — saytın pleyeri, sevimli qari),
//   Zikr (RoadDhikr — data/dhikr), Növbəti namaz (RoadPrayer — usePrayerTimes, seçilmiş şəhər + məzhəb),
//   Qiblə (RoadQibla — ortaq qiblə həndəsəsi, "əvvəlcə dayanın" qeydi).
// • "Səslə de" — nitq sintezi YALNIZ interfeys faktları üçün (namaz vaxtı, zikr hədəfi), istifadəçinin
//   dilində səs varsa. Quran mətni heç vaxt TTS ilə oxunmur — Quran həqiqi qiraət səsidir.
// • Namaz xatırlatması: səhifə açıq ikən N dəqiqə əvvəl (standart 10) yumşaq zəng + (açıqdırsa) səsli cümlə.
// • Ekran açıq qalır (hooks/useWakeLock; dəstək yoxdursa dürüst qeyd).
// • Yaddaş: utils/roadMode (road_mode_v1) — yalnız mount-dan sonra oxunur (prerender ilə ilk render eyni).
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { isPlainClick } from '../components/PageLink'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import { pathFor } from '../seo/routes'
import { pickUi, uiDictLang } from '../utils/uiText'
import usePrayerTimes, { PRAYER_NAMES } from '../hooks/usePrayerTimes'
import useWakeLock from '../hooks/useWakeLock'
import { useQuranPlayer } from '../components/QuranPlayer'
import RoadQuran from '../components/road/RoadQuran'
import RoadDhikr from '../components/road/RoadDhikr'
import RoadPrayer from '../components/road/RoadPrayer'
import RoadQibla from '../components/road/RoadQibla'
import { DHIKRS } from '../data/dhikr'
import { AYAH_COUNTS, SURAH_START } from '../utils/quranMap'
import { surahLabel } from '../components/hifz/surahLabel'
import {
  DEFAULT_ROAD, REMIND_CHOICES, readRoad, writeRoad, resumePoint, reminderDue, minutesLeft,
  canSpeakApi, voiceFor, voicesNow, speakFact,
} from '../utils/roadMode'
import { playSound, unlockAudio } from '../utils/uiSound'
import { haptic } from '../hooks/useHaptic'
import { bumpDhikrDay } from '../utils/myDay'
import '../styles/OnTheRoadPage.css'

// Ru: rəqəmdən sonra sözün forması (1 минуту, 2 минуты, 5 минут) — bütöv ifadə üçün
const ruMin = (n) => {
  const a = n % 10, b = n % 100
  if (a === 1 && b !== 11) return `${n} минуту`
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return `${n} минуты`
  return `${n} минут`
}
// Ar: 1 — دقيقة واحدة, 2 — دقيقتان, 3–10 — دقائق, 11+ — دقيقة
const arMin = (n) => (n === 1 ? 'دقيقة واحدة' : n === 2 ? 'دقيقتين' : n <= 10 ? `${n} دقائق` : `${n} دقيقة`)

const T = {
  az: {
    title: 'Yolda', lead: 'Maşın və səfər üçün sadə ekran: Quran qiraəti, zikr, növbəti namaz və qiblə — çox iri düymələrlə.',
    safety: 'Hər şeyi yola çıxmazdan əvvəl qurun. Sürərkən istifadə etməyin.',
    tiles: 'Bölmələr', quran: 'Quran dinlə', dhikr: 'Zikr', prayer: 'Növbəti namaz', qibla: 'Qiblə', back: 'Geri', dismiss: 'Bağla',
    settings: 'Ayarlar', speak: 'Vaxtları səslə de', speakHint: 'Yalnız vaxt və saylar səslənir. Quran həmişə həqiqi qiraətdir.',
    noVoice: 'Bu cihazda bu dil üçün səs yoxdur — səsli ipuçları əlçatan deyil.',
    remind: 'Namaz xatırlatması', remindOff: 'Söndür', remindMin: (n) => `${n} dəq əvvəl`,
    light: 'Açıq ekran', sound: 'Tıqqıltı və zəng',
    awakeOn: 'Bu səhifə açıq ikən ekran sönmür.', awakeOff: 'Bu brauzer ekranı açıq saxlaya bilmir — cihazın ekran vaxtını yoxlayın.',
    soon: (p, n) => `${p} namazına ${n} dəqiqə qalıb`, at: (p, hm) => `${p} azanı saat ${hm}`,
    dhikrDone: (n) => `${n} dəfə tamamlandı`,
  },
  en: {
    title: 'On the road', lead: 'A simple screen for the car or a journey: Quran recitation, dhikr, the next prayer and the qibla — with very large buttons.',
    safety: 'Set it up before driving. Don’t use it while driving.',
    tiles: 'Sections', quran: 'Listen to the Quran', dhikr: 'Dhikr', prayer: 'Next prayer', qibla: 'Qibla', back: 'Back', dismiss: 'Dismiss',
    settings: 'Settings', speak: 'Speak times aloud', speakHint: 'Only times and counts are spoken. The Quran is always real recitation.',
    noVoice: 'There is no voice for this language on this device, so spoken hints are unavailable.',
    remind: 'Prayer reminder', remindOff: 'Off', remindMin: (n) => `${n} min before`,
    light: 'Light screen', sound: 'Click and chime',
    awakeOn: 'The screen stays on while this page is open.', awakeOff: 'This browser can’t keep the screen on — check your device’s screen timeout.',
    soon: (p, n) => (n === 1 ? `${p} in 1 minute` : `${p} in ${n} minutes`), at: (p, hm) => `${p} adhan at ${hm}`,
    dhikrDone: (n) => (n === 1 ? 'Completed once' : `Completed ${n} times`),
  },
  ru: {
    title: 'В дороге', lead: 'Простой экран для машины и поездки: чтение Корана, зикр, следующий намаз и кибла — с очень крупными кнопками.',
    safety: 'Настройте всё до поездки. Не пользуйтесь во время вождения.',
    tiles: 'Разделы', quran: 'Слушать Коран', dhikr: 'Зикр', prayer: 'Следующий намаз', qibla: 'Кибла', back: 'Назад', dismiss: 'Закрыть',
    settings: 'Настройки', speak: 'Произносить время вслух', speakHint: 'Озвучиваются только время и счёт. Коран — всегда настоящее чтение.',
    noVoice: 'На этом устройстве нет голоса для этого языка, поэтому голосовые подсказки недоступны.',
    remind: 'Напоминание о намазе', remindOff: 'Выкл.', remindMin: (n) => `за ${n} мин`,
    light: 'Светлый экран', sound: 'Щелчок и сигнал',
    awakeOn: 'Пока страница открыта, экран не гаснет.', awakeOff: 'Этот браузер не может держать экран включённым — проверьте время отключения экрана.',
    soon: (p, n) => `${p} через ${ruMin(n)}`, at: (p, hm) => `Азан ${p} в ${hm}`,
    dhikrDone: (n) => `Выполнено: ${n}`,
  },
  ar: {
    title: 'في الطريق', lead: 'شاشة بسيطة للسيارة والسفر: تلاوة القرآن، والذكر، والصلاة التالية، والقبلة — بأزرار كبيرة جدًا.',
    safety: 'اضبط كل شيء قبل القيادة. لا تستخدمها أثناء القيادة.',
    tiles: 'الأقسام', quran: 'استمع إلى القرآن', dhikr: 'الذكر', prayer: 'الصلاة التالية', qibla: 'القبلة', back: 'رجوع', dismiss: 'إغلاق',
    settings: 'الإعدادات', speak: 'انطق الأوقات بصوت', speakHint: 'تُنطق الأوقات والأعداد فقط. والقرآن دائمًا تلاوة حقيقية.',
    noVoice: 'لا يوجد صوت لهذه اللغة على هذا الجهاز، لذا فالتنبيهات الصوتية غير متاحة.',
    remind: 'تذكير بالصلاة', remindOff: 'إيقاف', remindMin: (n) => `قبل ${n} د`,
    light: 'شاشة فاتحة', sound: 'نقرة وجرس',
    awakeOn: 'تبقى الشاشة مضاءة ما دامت الصفحة مفتوحة.', awakeOff: 'هذا المتصفح لا يستطيع إبقاء الشاشة مضاءة — راجع مهلة إطفاء الشاشة في جهازك.',
    soon: (p, n) => `${p} بعد ${arMin(n)}`, at: (p, hm) => `أذان ${p} الساعة ${hm}`,
    dhikrDone: (n) => `اكتمل العدد: ${n}`,
  },
  tr: {
    title: 'Yolda', lead: 'Araba ve yolculuk için sade bir ekran: Kur’an tilaveti, zikir, sonraki namaz ve kıble — çok büyük düğmelerle.',
    safety: 'Her şeyi yola çıkmadan önce ayarlayın. Araç kullanırken kullanmayın.',
    tiles: 'Bölümler', quran: 'Kur’an dinle', dhikr: 'Zikir', prayer: 'Sonraki namaz', qibla: 'Kıble', back: 'Geri', dismiss: 'Kapat',
    settings: 'Ayarlar', speak: 'Vakitleri sesli söyle', speakHint: 'Yalnızca vakitler ve sayılar seslendirilir. Kur’an her zaman gerçek tilavettir.',
    noVoice: 'Bu cihazda bu dil için ses yok, bu yüzden sesli ipuçları kullanılamıyor.',
    remind: 'Namaz hatırlatması', remindOff: 'Kapalı', remindMin: (n) => `${n} dk önce`,
    light: 'Açık ekran', sound: 'Tık sesi ve zil',
    awakeOn: 'Bu sayfa açıkken ekran kapanmaz.', awakeOff: 'Bu tarayıcı ekranı açık tutamıyor — cihazınızın ekran zaman aşımını kontrol edin.',
    soon: (p, n) => `${p} vaktine ${n} dakika kaldı`, at: (p, hm) => `${p} ezanı saat ${hm}`,
    dhikrDone: (n) => `${n} kez tamamlandı`,
  },
}

const PANELS = ['quran', 'dhikr', 'prayer', 'qibla']
const PANEL_ICON = { quran: 'quran', dhikr: 'dhikr', prayer: 'clock', qibla: 'qibla' }

export default function OnTheRoadPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const navigate = useNavigate()
  // Əlavə dildə (/id/…) interfeys ingiliscədir, lüğətlə tərcümə olunur — səs həmin dildə axtarılır
  const speechLang = (lang === 'en' && uiDictLang()) || lang

  const [ready, setReady] = useState(false)
  const [road, setRoad] = useState(DEFAULT_ROAD)
  const [panel, setPanel] = useState(null)
  const [msg, setMsg] = useState('')
  const [notice, setNotice] = useState('')
  const [voiceOk, setVoiceOk] = useState(false)
  const [surah, setSurah] = useState(1)
  const [startAyah, setStartAyah] = useState(1)
  const headRef = useRef(null)
  const lastTile = useRef(null)

  // Yaddaş — yalnız mount-dan sonra
  useEffect(() => {
    const r = readRoad()
    setRoad(r)
    const rp = resumePoint(r)
    if (rp) { setSurah(rp.s); setStartAyah(rp.a) }
    setReady(true)
  }, [])
  const save = useCallback((patch) => setRoad(writeRoad(patch)), [])

  // Səs (nitq sintezi) — səslər asinxron yüklənir
  useEffect(() => {
    if (!canSpeakApi()) return undefined
    const check = () => setVoiceOk(!!voiceFor(voicesNow(), speechLang))
    check()
    window.speechSynthesis.addEventListener?.('voiceschanged', check)
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', check)
  }, [speechLang])
  const speakOn = road.speak && voiceOk
  const say = useCallback((text) => { if (speakOn) speakFact(text, speechLang) }, [speakOn, speechLang])
  useEffect(() => () => { try { window.speechSynthesis?.cancel() } catch { /* */ } }, [])

  const awake = useWakeLock(true)

  // ── Quran pleyeri (səhifə səviyyəsində — panel dəyişəndə qiraət dayanmasın) ──
  const verses = useMemo(() => Array.from({ length: AYAH_COUNTS[surah - 1] }, (_, i) => ({ n: i + 1, g: SURAH_START[surah - 1] + i + 1 })), [surah])
  const player = useQuranPlayer({
    surahNumber: surah, verses, lang,
    onSurahEnd: () => setSurah((s) => Math.min(114, s + 1)),
    mediaTitle: (n) => `${surahLabel(surah, lang)} ${surah}:${n}`,
  })
  const cur = player.current
  // Yalnız oxunan ayə dəyişəndə yadda saxla (surə dəyişəndə köhnə ayə nömrəsi yeni surəyə yazılmasın)
  const surahRef = useRef(surah)
  surahRef.current = surah
  useEffect(() => { if (ready && cur) save({ s: surahRef.current, a: cur }) }, [ready, cur, save])
  const pickSurah = (n) => { setSurah(n); setStartAyah(1); save({ s: n, a: 1 }) }
  const pickAyah = (n) => { setStartAyah(n); save({ s: surah, a: n }) }

  // ── Namaz vaxtı + saat ──
  const pt = usePrayerTimes()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!ready) return undefined
    const ms = panel === 'prayer' ? 1000 : 15000
    const tick = () => setNow(Date.now())
    tick()
    const id = setInterval(tick, ms)
    const onVis = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [ready, panel])

  const prayerName = (k) => pickUi(PRAYER_NAMES[k], lang, 'en')
  const prayerLine = useCallback((next, at) => {
    const n = minutesLeft(next.at - at)
    return n <= 60 ? t.soon(prayerName(next.key), Math.max(1, n)) : t.at(prayerName(next.key), next.adhan)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, lang])

  // Xatırlatma: açıq ikən hədd keçiləndə bir dəfə (açılış anında artıq həddin içindədirsə — susur)
  const firedRef = useRef('')
  const primedFor = useRef(null)
  useEffect(() => {
    if (!ready || !pt.next) return
    const lead = road.remind
    const due = reminderDue(pt.next, now, lead, firedRef.current)
    if (primedFor.current !== lead) {
      primedFor.current = lead
      if (due) firedRef.current = due
      return
    }
    if (!due) return
    firedRef.current = due
    const line = prayerLine(pt.next, now)
    setNotice(line)
    setMsg(line)
    if (road.snd) playSound('done', true)
    if (speakOn) setTimeout(() => speakFact(line, speechLang), 1400)
  }, [ready, pt.next, now, road.remind, road.snd, speakOn, speechLang, prayerLine])

  // ── Panellər ──
  const open = (k, e) => {
    unlockAudio()
    lastTile.current = e?.currentTarget?.dataset?.tile || k
    setPanel(k)
  }
  const close = () => setPanel(null)
  useEffect(() => {
    if (panel) { headRef.current?.focus(); return }
    const k = lastTile.current
    if (k) document.querySelector(`[data-tile="${k}"]`)?.focus()
  }, [panel])

  // ── Zikr ──
  const dIdx = road.d
  const dCount = road.c
  const tap = () => {
    const c = dCount + 1
    save({ c })
    bumpDhikrDay(1)
    haptic(14)
    const target = DHIKRS[dIdx]?.target || 33
    if (c === target) {
      if (road.snd) playSound('done', true)
      haptic(60)
      const line = t.dhikrDone(c)
      setMsg(line)
      say(line)
    } else if (road.snd) playSound('bead', true)
  }

  const go = (e, key) => { if (!isPlainClick(e)) return; e.preventDefault(); navigate(pathFor(key, lang)); window.scrollTo(0, 0) }
  const cityName = pt.location?.city?.[lang] || pt.location?.city?.en || ''

  return (
    <div className="road-page">
      <header className="ui-page-hero road-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel(navGroupOf('onroad'), lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.lead}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container">
          <div className={`road-screen ${road.light ? 'road--light' : 'road--dark'}`} data-testid="road-screen">
            <p className="road-safety" data-testid="road-safety"><Icon name="alert" size={26} /> {t.safety}</p>
            <p className="ui-sr-only" role="status" aria-live="polite">{msg}</p>
            {notice && (
              <div className="road-notice">
                <Icon name="bell" size={28} />
                <span>{notice}</span>
                <button type="button" className="road-btn road-btn--round road-btn--sm" onClick={() => setNotice('')} aria-label={t.dismiss}>
                  <Icon name="close" size={24} />
                </button>
              </div>
            )}

            {!panel && (
              <>
                <h2 className="ui-sr-only">{t.tiles}</h2>
                <ul className="road-tiles">
                  {PANELS.map((k) => (
                    <li key={k}>
                      <button type="button" className={`road-tile road-tile--${k}`} data-tile={k} onClick={(e) => open(k, e)}>
                        <Icon name={PANEL_ICON[k]} size={44} />
                        <span>{t[k]}</span>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="road-settings" role="group" aria-labelledby="road-settings-h">
                  <h2 id="road-settings-h" className="road-settings__h">{t.settings}</h2>
                  <div className="road-row">
                    <button type="button" className="road-btn road-btn--wide" aria-pressed={speakOn} disabled={!ready || !voiceOk}
                      onClick={() => save({ speak: !road.speak })} data-testid="road-speak">
                      <Icon name="volume" size={24} /> {t.speak}
                    </button>
                    <button type="button" className="road-btn road-btn--wide" aria-pressed={road.light} disabled={!ready}
                      onClick={() => save({ light: !road.light })}>
                      <Icon name={road.light ? 'sun' : 'moon'} size={24} /> {t.light}
                    </button>
                    <button type="button" className="road-btn road-btn--wide" aria-pressed={road.snd} disabled={!ready}
                      onClick={() => save({ snd: !road.snd })}>
                      <Icon name={road.snd ? 'bell' : 'bellOff'} size={24} /> {t.sound}
                    </button>
                  </div>
                  <p className="road-hint">{ready && !voiceOk ? t.noVoice : t.speakHint}</p>

                  <fieldset className="road-remind">
                    <legend>{t.remind}</legend>
                    <div className="road-row">
                      {REMIND_CHOICES.map((n) => (
                        <button key={n} type="button" className="road-btn road-chip" aria-pressed={road.remind === n} disabled={!ready}
                          onClick={() => save({ remind: n })}>
                          {n ? t.remindMin(n) : t.remindOff}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  {ready && <p className="road-hint" data-testid="road-awake">{awake === 'on' ? t.awakeOn : (awake === 'unsupported' ? t.awakeOff : '')}</p>}
                </div>
              </>
            )}

            {panel && (
              <div className="road-panel" data-testid={`road-panel-${panel}`}>
                <div className="road-panel__top">
                  <button type="button" className="road-btn road-btn--back" onClick={close}>
                    <Icon name="chevronLeft" size={32} className="ui-flip-rtl" /> {t.back}
                  </button>
                  <h2 className="road-panel__h" tabIndex={-1} ref={headRef}>{t[panel]}</h2>
                </div>
                {panel === 'quran' && (
                  <RoadQuran player={player} surah={surah} ayah={startAyah} lang={lang} onSurah={pickSurah} onAyah={pickAyah} />
                )}
                {panel === 'dhikr' && (
                  <RoadDhikr idx={dIdx} count={dCount} lang={lang} onTap={tap}
                    onReset={() => save({ c: 0 })} onPick={(i) => save({ d: i, c: 0 })} />
                )}
                {panel === 'prayer' && (
                  <RoadPrayer pt={pt} now={now} lang={lang} cityName={cityName}
                    prayerHref={pathFor('prayer', lang)} onPrayerLink={(e) => go(e, 'prayer')}
                    onSay={speakOn && pt.next ? () => speakFact(prayerLine(pt.next, Date.now()), speechLang) : null} />
                )}
                {panel === 'qibla' && (
                  <RoadQibla lang={lang} qiblaHref={pathFor('qibla', lang)} onQiblaLink={(e) => go(e, 'qibla')} />
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
