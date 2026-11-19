// ═══════════════════════════════════════════════════════
// SleepTimer — Quran pleyerinin yuxu taymeri (useQuranPlayer → player.sleep / setSleep)
//
//   <SleepTimer player={player} lang="az" variant="zen" />   — Zen (gecə səması üstündə)
//   <SleepTimer player={player} lang="az" variant="panel" /> — mini-pleyerin "Səs ayarları" paneli
//   <SleepBadge sleep={player.sleep} lang="az" />            — pleyer zolağında kiçik ay nişanı
//
// • Taymer pleyerin özündədir: Zen bağlananda da işləyir; səs AYƏNİN SONUNDA dayanır.
// • Seçim: 15 / 30 / 60 dəq və ya "Surənin sonu". Taymer qurulanda sıra bir düyməyə
//   çevrilir: "☾ 29 dəq qalıb · Söndür". Ekran oxuyucusu üçün status yalnız qurulanda/
//   söndürüləndə dəyişir (hər dəqiqə danışmır).
// • Basılan düymə yox olur (çiplər ↔ "Söndür") — fokus yeni düyməyə keçir, yoxsa <body>-yə
//   düşürdü: Zen dialoqundan çıxırdı və Esc işləmirdi.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { haptic } from '../../hooks/useHaptic'
import { sleepLeftMin, sleepProgress } from '../../utils/sleepTimer'
import '../../styles/SleepTimer.css'

export { sleepLeftMin, sleepProgress }

const T = {
  az: {
    sleep: 'Yuxu saatı', min: (n) => `${n} dəq`, surah: 'Surənin sonu', off: 'Söndür',
    left: (n) => `${n} dəq qalıb`, untilEnd: 'Surənin sonuna qədər',
    offLabel: 'Yuxu saatını söndür', hint: 'Səs oxunan ayənin sonunda yumşaq dayanır.',
    set: (x) => `Yuxu saatı quruldu: ${x}`, cleared: 'Yuxu saatı söndürüldü',
    summary: (x) => `Yuxu saatı: ${x}`,
  },
  en: {
    sleep: 'Sleep timer', min: (n) => `${n} min`, surah: 'End of surah', off: 'Off',
    left: (n) => `${n} min left`, untilEnd: 'Until the end of the surah',
    offLabel: 'Turn off the sleep timer', hint: 'The audio stops gently at the end of the verse being recited.',
    set: (x) => `Sleep timer set: ${x}`, cleared: 'Sleep timer turned off',
    summary: (x) => `Sleep timer: ${x}`,
  },
  ru: {
    sleep: 'Таймер сна', min: (n) => `${n} мин`, surah: 'До конца суры', off: 'Выкл.',
    left: (n) => `Осталось ${n} мин`, untilEnd: 'До конца суры',
    offLabel: 'Выключить таймер сна', hint: 'Звук мягко остановится в конце читаемого аята.',
    set: (x) => `Таймер сна установлен: ${x}`, cleared: 'Таймер сна выключен',
    summary: (x) => `Таймер сна: ${x}`,
  },
  ar: {
    sleep: 'مؤقت النوم', min: (n) => `${n} د`, surah: 'نهاية السورة', off: 'إيقاف',
    left: (n) => `باقٍ ${n} د`, untilEnd: 'حتى نهاية السورة',
    offLabel: 'إيقاف مؤقت النوم', hint: 'يتوقف الصوت بهدوء في نهاية الآية التي تُتلى.',
    set: (x) => `ضُبط مؤقت النوم: ${x}`, cleared: 'أُوقف مؤقت النوم',
    summary: (x) => `مؤقت النوم: ${x}`,
  },
  tr: {
    sleep: 'Uyku zamanlayıcısı', min: (n) => `${n} dk`, surah: 'Sure sonu', off: 'Kapat',
    left: (n) => `${n} dk kaldı`, untilEnd: 'Surenin sonuna kadar',
    offLabel: 'Uyku zamanlayıcısını kapat', hint: 'Ses, okunan ayetin sonunda yumuşakça durur.',
    set: (x) => `Uyku zamanlayıcısı kuruldu: ${x}`, cleared: 'Uyku zamanlayıcısı kapatıldı',
    summary: (x) => `Uyku zamanlayıcısı: ${x}`,
  },
}
export const SLEEP_MINUTES = [15, 30, 60]

const leftText = (t, sleep) => (sleep.mode === 'min' ? t.left(sleepLeftMin(sleep)) : t.untilEnd)
/** "Sleep timer: 29 min left" */
export const sleepSummary = (sleep, lang) => {
  const t = pickUi(T, lang, 'en')
  return sleep ? t.summary(leftText(t, sleep)) : ''
}

// Taymer qurulubsa — 15 san.-də bir yenidən render (qalan dəqiqə)
function useMinuteTick(on) {
  const [, force] = useState(0)
  useEffect(() => {
    if (!on) return undefined
    const id = setInterval(() => force(x => x + 1), 15000)
    return () => clearInterval(id)
  }, [on])
}

export function SleepBadge({ sleep, lang }) {
  useMinuteTick(!!sleep)
  if (!sleep) return null
  const label = sleepSummary(sleep, lang)
  return (
    <span className="qpl__badge qpl__badge--sleep ui-num" title={label} data-testid="qpl-sleep-badge">
      <Icon name="moon" size={14} /><span className="ui-sr-only">{label}</span>
      {sleep.mode === 'min' && <span aria-hidden="true" dir="ltr">{sleepLeftMin(sleep)}′</span>}
    </span>
  )
}

export default function SleepTimer({ player, lang = 'az', variant = 'panel' }) {
  const t = pickUi(T, lang, 'en')
  const sleep = player.sleep
  const [said, setSaid] = useState('')
  useMinuteTick(!!sleep)
  const boxRef = useRef(null)
  const refocus = useRef(false)
  const on = !!sleep
  useEffect(() => {
    if (!refocus.current) return
    refocus.current = false
    boxRef.current?.querySelector('button')?.focus()
  }, [on])
  const pick = (v) => {
    haptic()
    refocus.current = !on
    player.setSleep(v)
    setSaid(t.set(v === 'surah' ? t.surah : t.min(v)))
  }
  const off = () => { haptic(); refocus.current = true; player.setSleep(null); setSaid(t.cleared) }
  const chip = variant === 'zen' ? 'slt__chip' : 'ui-chip slt__chip'

  return (
    <div className={`slt slt--${variant}${sleep ? ' is-on' : ''}`} data-testid={`sleep-timer-${variant}`} ref={boxRef}>
      <span className="slt__label" id={`slt-${variant}`}><Icon name="moon" size={16} />{t.sleep}</span>
      {sleep ? (
        <button type="button" className={`${chip} slt__pill is-on`} onClick={off} aria-label={`${t.summary(leftText(t, sleep))}. ${t.offLabel}`}>
          <span className="ui-num">{leftText(t, sleep)}</span> · <b>{t.off}</b>
        </button>
      ) : (
        <div className="slt__chips" role="group" aria-labelledby={`slt-${variant}`}>
          {SLEEP_MINUTES.map(m => (
            <button key={m} type="button" className={`${chip} ui-num`} onClick={() => pick(m)}>{t.min(m)}</button>
          ))}
          <button type="button" className={chip} onClick={() => pick('surah')}>{t.surah}</button>
        </div>
      )}
      {variant === 'panel' && <span className="slt__hint">{t.hint}</span>}
      <span className="ui-sr-only" role="status" aria-live="polite">{said}</span>
    </div>
  )
}
