import { useState, useCallback, useEffect, useRef } from 'react'
import { ummahAdd } from '../utils/ummah'
import UmmahCounter from '../components/UmmahCounter'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import { DHIKRS, AFTER_PRAYER, AFTER_PRAYER_VIRTUE } from '../data/dhikr'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import Icon from '../components/Icon'
import Breadcrumb from '../components/Breadcrumb'
import TasbihBeads from '../components/TasbihBeads'
import { localizeSource } from '../utils/sourceNames'
import { BarChart } from '../components/viz'
import { pathFor } from '../seo/routes'
import '../styles/DhikrPage.css'
import BreathDhikr from '../components/dhikr/BreathDhikr'
import { playSound } from '../utils/uiSound'
import SoundToggle from '../components/SoundToggle'
import { pickUi } from '../utils/uiText'
import { bumpDhikrDay } from '../utils/myDay'

// ── localStorage helper-ləri ──
const STORAGE_KEY = 'dhikr_session'
function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : null
    if (!data || typeof data !== 'object') return { count: 0, selIdx: 0, log: [] }
    // Pozuq / köhnə məlumat səhifəni çökdürməsin: hər sahə yoxlanılır
    const selIdx = Number.isInteger(Number(data.selIdx)) && DHIKRS[Number(data.selIdx)] ? Number(data.selIdx) : 0
    const count = Math.max(0, Math.min(Number(data.count) || 0, DHIKRS[selIdx].target))
    const log = (Array.isArray(data.log) ? data.log : [])
      .filter(e => e && typeof e === 'object')
      .map(e => ({ id: e.id, idx: Number.isInteger(e.idx) ? e.idx : undefined, name: typeof e.name === 'string' ? e.name : '', count: Number(e.count) || 0, time: typeof e.time === 'string' ? e.time : '' }))
      .slice(0, 10)
    return { count, selIdx, log }
  } catch { return { count: 0, selIdx: 0, log: [] } }
}
function saveSession(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

// Ömürlük zikr sayı — /analytics "Zikr ustası" nailiyyəti üçün oxuyur
// (AnalyticsPage 'dhikr_count*' açarlarını cəmləyir). Jurnal yalnız son 10
// dövrəni saxladığı üçün ayrıca sayğac lazımdır.
const TOTAL_KEY = 'dhikr_count_total'
function bumpLifetime(kind = 'dhikr') {
  ummahAdd(kind)
  // Ana səhifənin 'Mənim günüm' paneli üçün günlük say (utils/myDay)
  bumpDhikrDay()
  try {
    const n = parseInt(localStorage.getItem(TOTAL_KEY), 10)
    localStorage.setItem(TOTAL_KEY, String((Number.isFinite(n) && n > 0 ? n : 0) + 1))
  } catch {}
}

// Vibrasiya — yalnız istifadəçi səhifəyə toxunandan sonra (əks halda brauzer
// hər dəfə konsola xəta yazır)
function vibrate(pattern) {
  // İstəyə görə səs (utils/uiSound, susmaya görə sönülü): tək toxunuş — muncuq,
  // ardıcıllıq (dövr / hədəf tamamlandı) — yumşaq zəng
  playSound(Array.isArray(pattern) ? 'done' : 'bead')
  try {
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return
    navigator.vibrate?.(pattern)
  } catch { /* dəstəklənmir */ }
}

// Jurnaldakı vaxt interfeys dilində (az-da "19:57", "7:57:49 PM" yox)
const LOCALE = { az:'az-AZ', en:'en-GB', ru:'ru-RU', ar:'ar', tr:'tr-TR' }

// Sayğacın altındakı statistika yazıları
const STAT_LABELS = {
  current:  { az:'Hazırkı', en:'Current',  ru:'Текущий', ar:'الحالي',   tr:'Mevcut' },
  sessions: { az:'Sessiya', en:'Sessions', ru:'Сессий',  ar:'جلسات',    tr:'Oturum' },
  total:    { az:'Ümumi',   en:'Total',    ru:'Всего',   ar:'الإجمالي', tr:'Toplam' },
}

// Fəzilətin mənbəyi və sünnə qeydi (Sələf alimlərinin çoxu zikri barmaqla
// saymağı üstün tutur — Əbu Davud 1501, Albani: həsən; 1502, Albani: səhih).
// Sayğac silinmir — yalnız yardımçı vasitə kimi təqdim olunur.
const SOURCE_LABEL = { az:'Mənbə', en:'Source', ru:'Источник', ar:'المصدر', tr:'Kaynak' }
const FINGER_NOTE = {
  az:'Sünnə: Peyğəmbər ﷺ təsbehi sağ əlinin barmaqları ilə sayardı və barmaqların Qiyamətdə dilə gətiriləcəyini xəbər vermişdir. Bu sayğac yalnız yardımçıdır.',
  en:'Sunnah: the Prophet ﷺ counted tasbih on the fingers of his right hand and said the fingers will be made to speak on the Day of Judgement. This counter is only an aid.',
  ru:'Сунна: Пророк ﷺ считал тасбих на пальцах правой руки и сообщил, что в Судный день пальцы заговорят. Этот счётчик — лишь вспомогательное средство.',
  ar:'السنة: كان النبي ﷺ يعقد التسبيح بيمينه، وأخبر أن الأنامل مسؤولات مستنطقات. هذا العداد وسيلة مساعدة فقط.',
  tr:'Sünnet: Peygamber ﷺ tesbihi sağ elinin parmaklarıyla sayardı ve parmakların Kıyamet günü konuşturulacağını bildirdi. Bu sayaç yalnızca yardımcıdır.',
}
const FINGER_SOURCE = 'Əbu Davud 1501, 1502'

// ═══ Rejimlər: zikr seçimi (köhnə sayğac) · namazdan sonra · sərbəst təsbeh ═══
const MODES = [
  { id: 'select', icon: 'list',   label: { az: 'Zikr seçimi', en: 'Choose dhikr', ru: 'Выбор зикра', ar: 'اختيار الذكر', tr: 'Zikir seçimi' } },
  { id: 'after',  icon: 'prayer', label: { az: 'Namazdan sonra', en: 'After prayer', ru: 'После намаза', ar: 'بعد الصلاة', tr: 'Namazdan sonra' } },
  { id: 'free',   icon: 'dhikr',  label: { az: 'Sərbəst təsbeh', en: 'Free tasbih', ru: 'Свободный тасбих', ar: 'تسبيح حر', tr: 'Serbest tesbih' } },
  { id: 'breath', icon: 'leaf',   label: { az: 'Nəfəsli zikr', en: 'Breathing', ru: 'С дыханием', ar: 'مع التنفس', tr: 'Nefesli zikir' } },
]
const MODE_LABEL = { az: 'Sayğac rejimi', en: 'Counter mode', ru: 'Режим счётчика', ar: 'وضع العداد', tr: 'Sayaç modu' }

const AP_TXT = {
  title:   { az: 'Fərz namazından sonra zikrlər', en: 'Dhikr after the obligatory prayer', ru: 'Зикр после обязательной молитвы', ar: 'الأذكار بعد الصلاة المكتوبة', tr: 'Farz namazdan sonra zikirler' },
  lead:    { az: 'Düyməyə toxunun — say tamamlananda növbəti zikrə özü keçir. Ardıcıllıq Muslim 591 və 597 hədislərinə əsaslanır.', en: 'Tap the button — when a count is complete it moves on to the next dhikr by itself. The sequence follows Muslim 591 and 597.', ru: 'Нажимайте на кнопку — по завершении счёта счётчик сам переходит к следующему зикру. Порядок — по хадисам Муслима 591 и 597.', ar: 'اضغط على الزر، وعند اكتمال العدد ينتقل العداد تلقائيًا إلى الذكر التالي. الترتيب وفق حديثي مسلم 591 و597.', tr: 'Düğmeye dokunun — sayı tamamlanınca bir sonraki zikre kendiliğinden geçer. Sıralama Müslim 591 ve 597 hadislerine dayanır.' },
  step:    { az: 'Addım {i} / {n}', en: 'Step {i} of {n}', ru: 'Шаг {i} из {n}', ar: 'الخطوة {i} من {n}', tr: 'Adım {i} / {n}' },
  tap:     { az: 'Saymaq üçün toxunun', en: 'Tap to count', ru: 'Нажмите, чтобы считать', ar: 'اضغط للعدّ', tr: 'Saymak için dokunun' },
  undo:    { az: 'Bir geri', en: 'Undo one', ru: 'На один назад', ar: 'تراجع واحدة', tr: 'Bir geri' },
  restart: { az: 'Yenidən başla', en: 'Start again', ru: 'Начать заново', ar: 'ابدأ من جديد', tr: 'Yeniden başla' },
  done:    { az: 'Tamamlandı! Allah qəbul etsin.', en: 'Completed! May Allah accept it.', ru: 'Завершено! Да примет Аллах.', ar: 'تمّ! تقبّل الله منك.', tr: 'Tamamlandı! Allah kabul etsin.' },
  goTo:    { az: 'Bu addıma keç', en: 'Go to this step', ru: 'Перейти к этому шагу', ar: 'انتقل إلى هذه الخطوة', tr: 'Bu adıma geç' },
  steps:   { az: 'Ardıcıllıq', en: 'Sequence', ru: 'Порядок', ar: 'الترتيب', tr: 'Sıralama' },
}
const FREE_TXT = {
  title:    { az: 'Sərbəst təsbeh', en: 'Free tasbih', ru: 'Свободный тасбих', ar: 'تسبيح حر', tr: 'Serbest tesbih' },
  lead:     { az: 'Hədəfsiz sayğac: istədiyiniz zikri sayın. Hər 33-də qısa, hər 100-də uzun vibrasiya olur (cihaz dəstəkləyirsə). Say bu cihazda saxlanılır.', en: 'A counter without a target: count any dhikr you like. A short vibration every 33 and a longer one every 100 (if your device supports it). The count is saved on this device.', ru: 'Счётчик без цели: считайте любой зикр. Короткая вибрация каждые 33 и длинная каждые 100 (если устройство поддерживает). Счёт сохраняется на этом устройстве.', ar: 'عداد بلا هدف: عُدّ أيّ ذكر تشاء. اهتزاز قصير كل 33 وطويل كل 100 (إن كان جهازك يدعمه). يُحفظ العدد على هذا الجهاز.', tr: 'Hedefsiz sayaç: dilediğiniz zikri sayın. Her 33’te kısa, her 100’de uzun titreşim olur (cihaz destekliyorsa). Sayı bu cihazda saklanır.' },
  hundreds: { az: 'Yüzlük', en: 'Hundreds', ru: 'Сотни', ar: 'المئات', tr: 'Yüzlük' },
  rounds:   { az: '33-lük dövrə', en: 'Rounds of 33', ru: 'Кругов по 33', ar: 'دورات الـ33', tr: '33’lük tur' },
}
const tx = (o, lang) => pickUi(o, lang, 'en')

// ── v3: hero izahı, statistika, "nə vaxt zikr edim" keçidləri
//    (zikr mətnləri Hisnul-Müslimdədir — təkrarlanmır, link verilir) ──
const PAGE_TXT = {
  how: { az: 'Rejimi seçin: hazır zikr (33/100 hədəfli), namazdan sonrakı ardıcıllıq və ya sərbəst təsbeh. Sonra iri dairəyə toxunun — hər toxunuş bir sayıdır.', en: 'Choose a mode: a set dhikr (target 33/100), the after-prayer sequence or free tasbih. Then tap the large circle — each tap is one count.', ru: 'Выберите режим: готовый зикр (цель 33/100), порядок после намаза или свободный тасбих. Затем нажимайте на большой круг — каждое нажатие считается.', ar: 'اختر الوضع: ذكر محدد (الهدف 33/100)، أو أذكار ما بعد الصلاة بالترتيب، أو تسبيح حر. ثم اضغط على الدائرة الكبيرة — كل ضغطة عدّة واحدة.', tr: 'Bir mod seçin: hazır zikir (hedef 33/100), namaz sonrası sıralama veya serbest tesbih. Sonra büyük daireye dokunun — her dokunuş bir sayıdır.' },
  dhikrs: { az: 'zikr', en: 'adhkar', ru: 'зикров', ar: 'ذكرًا', tr: 'zikir' },
  steps: { az: 'namazdan sonra addım', en: 'after-prayer steps', ru: 'шагов после намаза', ar: 'خطوات بعد الصلاة', tr: 'namaz sonrası adım' },
  lifetime: { az: 'ümumi toxunuş', en: 'total taps', ru: 'всего нажатий', ar: 'مجموع الضغطات', tr: 'toplam dokunuş' },
  whenTitle: { az: 'Nə vaxt zikr edim?', en: 'When should I remember Allah?', ru: 'Когда поминать Аллаха?', ar: 'متى أذكر الله؟', tr: 'Ne zaman zikredeyim?' },
  whenLead: { az: 'Günün sünnə zikrləri — mətnləri Hisnul-Müslimdə, ərəbcə, tərcümə və mənbə ilə.', en: 'The Sunnah adhkar of the day — full texts in Hisn al-Muslim with Arabic, translation and source.', ru: 'Зикры Сунны в течение дня — полные тексты в «Хиснуль-муслим» с арабским, переводом и источником.', ar: 'أذكار اليوم من السنة — نصوصها كاملة في حصن المسلم مع التخريج.', tr: 'Günün sünnet zikirleri — tam metinleri Hısnu’l-Müslim’de, Arapça, meal ve kaynakla.' },
  bySession: { az: 'Bu sessiyada zikrlər', en: 'Adhkar this session', ru: 'Зикры в этой сессии', ar: 'أذكار هذه الجلسة', tr: 'Bu oturumdaki zikirler' },
}
const WHEN = [
  { ch: 28, icon: 'sunrise', t: { az: 'Səhər və axşam', en: 'Morning and evening', ru: 'Утром и вечером', ar: 'الصباح والمساء', tr: 'Sabah ve akşam' }, s: { az: 'Səhər və axşam əzkarları', en: 'The morning and evening adhkar', ru: 'Утренние и вечерние азкары', ar: 'أذكار الصباح والمساء', tr: 'Sabah ve akşam ezkarları' } },
  { ch: 26, icon: 'prayer', t: { az: 'Namazın salamından sonra', en: 'After the salam of prayer', ru: 'После салама намаза', ar: 'بعد السلام من الصلاة', tr: 'Namazın selamından sonra' }, s: { az: 'İstiğfar, təsbeh, təhmid, təkbir', en: 'Istighfar, tasbih, tahmid, takbir', ru: 'Истигфар, тасбих, тахмид, такбир', ar: 'الاستغفار والتسبيح والتحميد والتكبير', tr: 'İstiğfar, tesbih, tahmid, tekbir' } },
  { ch: 29, icon: 'moon', t: { az: 'Yatmazdan əvvəl', en: 'Before sleeping', ru: 'Перед сном', ar: 'قبل النوم', tr: 'Uyumadan önce' }, s: { az: 'Yuxudan əvvəlki zikrlər və dualar', en: 'Remembrance and duas before sleep', ru: 'Поминания и мольбы перед сном', ar: 'أذكار النوم وأدعيته', tr: 'Uyku öncesi zikir ve dualar' } },
  { ch: 131, icon: 'sparkle', t: { az: 'Təsbeh və təhlilin fəziləti', en: 'Virtue of tasbih and tahlil', ru: 'Достоинство тасбиха и тахлиля', ar: 'فضل التسبيح والتهليل', tr: 'Tesbih ve tehlilin fazileti' }, s: { az: 'Səhih hədislərdə vəd olunan savab', en: 'The reward promised in authentic hadith', ru: 'Награда из достоверных хадисов', ar: 'الأجر الوارد في الأحاديث الصحيحة', tr: 'Sahih hadislerde vaat edilen sevap' } },
]
function readLifetime() {
  try { const n = parseInt(localStorage.getItem(TOTAL_KEY), 10); return Number.isFinite(n) && n > 0 ? n : 0 } catch { return 0 }
}

// ── "Namazdan sonra" — ardıcıl, avtomatik keçən sayğac (Muslim 591, 597) ──
function AfterPrayerCounter({ lang }) {
  const [pos, setPos] = useState({ step: 0, count: 0, done: false })
  const [pulse, setPulse] = useState(0)
  const cur = AFTER_PRAYER[pos.step]
  const total = AFTER_PRAYER.length

  // Hədəfə çatan toxunuş növbəti addıma keçirir; sonuncu addım bitəndə — "tamamlandı"
  const tap = () => {
    if (pos.done) return
    bumpLifetime()
    setPulse(p => p + 1)
    const next = pos.count + 1
    if (next < cur.count) { setPos({ ...pos, count: next }); vibrate(25); return }
    if (pos.step + 1 < total) {
      setPos({ step: pos.step + 1, count: 0, done: false })
      vibrate([60, 40, 60])
    } else {
      setPos({ step: pos.step, count: next, done: true })
      vibrate([100, 50, 100, 50, 200])
    }
  }
  const undo = () => {
    if (pos.done) { setPos({ step: total - 1, count: AFTER_PRAYER[total - 1].count - 1, done: false }); return }
    if (pos.count > 0) { setPos({ ...pos, count: pos.count - 1 }); return }
    if (pos.step > 0) setPos({ step: pos.step - 1, count: AFTER_PRAYER[pos.step - 1].count - 1, done: false })
  }
  const restart = () => setPos({ step: 0, count: 0, done: false })
  const canUndo = pos.done || pos.count > 0 || pos.step > 0
  const shown = pos.done ? cur.count : pos.count
  const pct = Math.min(100, (shown / cur.count) * 100)
  const label = (d) => pickUi(d, lang, 'en')
  const stepText = tx(AP_TXT.step, lang).replace('{i}', pos.step + 1).replace('{n}', total)

  return (
    <div className="ui-card dk-mode-card dk-ap" data-testid="after-prayer">
      <div className="dk-mode-head">
        <h2 className="dk-mode-title">{tx(AP_TXT.title, lang)}</h2>
        <p className="dk-mode-lead">{tx(AP_TXT.lead, lang)}</p>
      </div>

      <div className="dk-ap-body">
        <button type="button" className={`dk-tap${pos.done ? ' is-done' : ''}`} onClick={tap}
          aria-describedby="dk-ap-status" data-testid="after-prayer-tap">
          <span className="dk-tap__step ui-num" data-testid="after-prayer-step">{stepText}</span>
          <span className="dk-tap__ar" lang="ar" dir="rtl">{cur.arabic}</span>
          {lang !== 'ar' && <span className="dk-tap__name">{label(cur)}</span>}
          <span key={pulse} className="dk-tap__count ui-num" data-testid="after-prayer-count">{shown}<span className="dk-tap__of"> / {cur.count}</span></span>
          <span className="dk-tap__bar" aria-hidden="true"><span style={{ transform: `scaleX(${pct / 100})` }} /></span>
          <span className="dk-tap__hint">{tx(AP_TXT.tap, lang)}</span>
        </button>
        <TasbihBeads count={shown} target={cur.count} className="dk-beads" />

        <div className="dk-ap-side">
          <p className="dk-ap-meaning">
            {lang !== 'ar' && <>{tx(cur.meaning, lang)} </>}
            <span className="dhikr-source">({localizeSource(cur.source, lang)})</span>
          </p>
          <p id="dk-ap-status" className="ui-sr-only" aria-live="polite">{pos.done ? tx(AP_TXT.done, lang) : `${stepText}: ${label(cur)}`}</p>
          {pos.done && (
            <div className="dk-ap-done" role="status">
              <p className="dhikr-complete-badge"><Icon name="check" size={16} /> {tx(AP_TXT.done, lang)}</p>
              <p className="dk-ap-virtue" lang={lang === 'ar' ? 'ar' : undefined}>{tx(AFTER_PRAYER_VIRTUE, lang)} <span className="dhikr-source">({localizeSource('Muslim 597', lang)})</span></p>
            </div>
          )}
          <p className="dk-steps-label" id="dk-steps-label">{tx(AP_TXT.steps, lang)}</p>
          <ol className="dk-steps" aria-labelledby="dk-steps-label">
            {AFTER_PRAYER.map((d, i) => {
              const state = pos.done || i < pos.step ? 'done' : i === pos.step ? 'current' : 'next'
              return (
                <li key={d.id} className={`dk-step is-${state}`}>
                  <button type="button" className="dk-step__btn" onClick={() => setPos({ step: i, count: 0, done: false })}
                    aria-current={state === 'current' ? 'step' : undefined} title={tx(AP_TXT.goTo, lang)}>
                    <span className="dk-step__mark" aria-hidden="true">{state === 'done' ? <Icon name="check" size={14} /> : <span className="ui-num">{i + 1}</span>}</span>
                    <span className="dk-step__text">
                      <span className="dk-step__ar" lang="ar" dir="rtl">{d.arabic}</span>
                      {lang !== 'ar' && <span className="dk-step__name">{label(d)}</span>}
                    </span>
                    <span className="dk-step__count ui-num">×{d.count}</span>
                  </button>
                </li>
              )
            })}
          </ol>
          <div className="dk-actions">
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={undo} disabled={!canUndo}>
              <Icon name="minus" className="ui-btn__icon" /> {tx(AP_TXT.undo, lang)}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={restart} disabled={!canUndo}>
              <Icon name="refresh" className="ui-btn__icon" /> {tx(AP_TXT.restart, lang)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sərbəst təsbeh — hədəfsiz sayğac (localStorage 'dhikr_free_v1';
//    'dhikr_count*' adı İŞLƏNMİR — /analytics o açarları cəmləyir) ──
const FREE_KEY = 'dhikr_free_v1'
function loadFree() {
  try { const n = parseInt(localStorage.getItem(FREE_KEY), 10); return Number.isFinite(n) && n > 0 ? n : 0 } catch { return 0 }
}
function FreeCounter({ lang, t }) {
  const [n, setN] = useState(loadFree)
  useEffect(() => { try { localStorage.setItem(FREE_KEY, String(n)) } catch { /* yaddaş bağlıdır */ } }, [n])
  const tap = () => {
    const next = n + 1
    setN(next)
    bumpLifetime()
    if (next % 100 === 0) vibrate([100, 50, 100])
    else if (next % 33 === 0) vibrate([50, 40, 50])
    else vibrate(20)
  }
  return (
    <div className="ui-card dk-mode-card dk-free" data-testid="free-tasbih">
      <div className="dk-mode-head">
        <h2 className="dk-mode-title">{tx(FREE_TXT.title, lang)}</h2>
        <p className="dk-mode-lead">{tx(FREE_TXT.lead, lang)}</p>
      </div>
      <button type="button" className="dk-tap dk-tap--free" onClick={tap} data-testid="free-tap">
        <span key={n} className="dk-tap__count ui-num" data-testid="free-count">{n}</span>
        <span className="dk-tap__hint">{tx(AP_TXT.tap, lang)}</span>
      </button>
      {/* Sərbəst təsbeh: 33-lük dövrlər (33-də dövr tamamlanır, 34 — yeni dövrün 1-i) */}
      <TasbihBeads count={n === 0 ? 0 : ((n - 1) % 33) + 1} target={33} className="dk-beads" />
      <div className="dhikr-total-bar">
        <div className="ui-stat dhikr-total-item">
          <span className="ui-stat__num dhikr-total-num">{Math.floor(n / 33)}</span>
          <span className="ui-stat__label">{tx(FREE_TXT.rounds, lang)}</span>
        </div>
        <div className="ui-stat dhikr-total-item">
          <span className="ui-stat__num dhikr-total-num">{Math.floor(n / 100)}</span>
          <span className="ui-stat__label">{tx(FREE_TXT.hundreds, lang)}</span>
        </div>
      </div>
      <div className="dk-actions">
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setN(v => Math.max(0, v - 1))} disabled={n === 0}>
          <Icon name="minus" className="ui-btn__icon" /> {tx(AP_TXT.undo, lang)}
        </button>
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setN(0)} disabled={n === 0}>
          <Icon name="refresh" className="ui-btn__icon" /> {t.reset}
        </button>
      </div>
    </div>
  )
}

export default function DhikrPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(T, lang)?.dhikr || T.az.dhikr
  // Saxlanmış sessiya yalnız ilk renderdə oxunur
  const [saved] = useState(loadSession)
  const [selIdx, setSelIdx] = useState(() => (DHIKRS[saved.selIdx] ? saved.selIdx : 0))
  const [count,  setCount]  = useState(() => Number(saved.count) || 0)
  const [tap,    setTap]    = useState(false)
  // Hər toxunuşda yeni "dalğa" halqası (key dəyişir → animasiya yenidən oynayır)
  const [tapId,  setTapId]  = useState(0)
  // Dövr tamamlananda qızılı halqa effekti (key dəyişir → yenidən oynayır)
  const [burst,  setBurst]  = useState(0)
  const [log,    setLog]    = useState(() => (Array.isArray(saved.log) ? saved.log : []))
  const stat = (k) => STAT_LABELS[k][lang] || STAT_LABELS[k].en
  // Sayğac rejimi — həmişə "Zikr seçimi" ilə açılır (köhnə davranış)
  const [mode, setMode] = useState('select')
  // Ömürlük sayğac (hero) — toxunuşlar localStorage-ə yazılır; səhifədəki hər klikdən sonra yenidən oxunur
  const [lifetime, setLifetime] = useState(readLifetime)
  const pageRef = useRef(null)
  useEffect(() => {
    const el = pageRef.current
    if (!el) return undefined
    let raf = 0
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setLifetime(readLifetime())) }
    el.addEventListener('click', on)
    return () => { cancelAnimationFrame(raf); el.removeEventListener('click', on) }
  }, [])

  // Hər dəyişiklikdə localStorage-ə yaz
  useEffect(() => {
    saveSession({ count, selIdx, log })
  }, [count, selIdx, log])
  const dhikr = DHIKRS[selIdx]

  // Telefonda seçici üfüqi zolaqdır — seçilmiş zikr zolaqda görünsün
  // (yalnız zolaq sürüşəndə; geniş ekranda səhifə yerindən oynamır)
  const selRef = useRef(null)
  useEffect(() => {
    const strip = selRef.current
    if (!strip || strip.scrollWidth <= strip.clientWidth + 1) return
    strip.querySelector('.dhikr-sel-btn.active')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [selIdx])
  const progress = Math.min((count / dhikr.target) * 100, 100)
  const complete = count >= dhikr.target
  // Ümumi say: jurnaldakı dövrələr + cari dövrə. Tamamlanmış dövrə artıq
  // jurnaldadır — ikinci dəfə sayılmır (33-də "66" göstərməsin)
  const totalAll = log.reduce((s, e) => s + (e.count || 0), 0) + (complete ? 0 : count)
  const CIRC = 2 * Math.PI * 70
  // Sessiyada zikrlər üzrə cəm (qrafik)
  const bySession = (() => {
    const m = new Map()
    for (const e of log) {
      const name = DHIKRS[e.idx]?.[lang] || DHIKRS[e.idx]?.en || e.name
      m.set(name, (m.get(name) || 0) + (e.count || 0))
    }
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  })()

  // Toxunuş: hədəfə ÇATAN toxunuş jurnala bir sessiya yazır (yalnız bir dəfə).
  // Hədəf tamamlandıqdan sonrakı toxunuş yeni dövrə başlayır (1 / 33) —
  // sayğac hədəfdən o yana getmir. Yan təsirlər setState funksiyasının
  // içində deyil (StrictMode onu iki dəfə çağırır).
  const handleTap = useCallback(() => {
    const next = count >= dhikr.target ? 1 : count + 1
    setCount(next)
    bumpLifetime(dhikr.en === 'Salawat' ? 'salawat' : 'dhikr')
    if (next === dhikr.target) {
      const time = new Date().toLocaleTimeString(LOCALE[lang] || 'az-AZ', { hour: '2-digit', minute: '2-digit' })
      // id — siyahıda sabit açar (yeni sətir yuxarıdan yumşaq daxil olur)
      setLog(l => [{ id: Date.now(), idx: selIdx, name: pickUi(dhikr, lang, 'en'), count: dhikr.target, time }, ...l.slice(0, 9)])
      setBurst(b => b + 1)
      // Hədəf tamamlandı — uzun vibrasiya
      vibrate([100, 50, 100])
    } else {
      vibrate(30)
    }
    setTap(true)
    setTapId(n => n + 1)
    setTimeout(() => setTap(false), 120)
  }, [count, dhikr, lang, selIdx])

  return (
    <div className="dhikr-page" ref={pageRef}>
      {/* Hero — dizayn v2 (sakit kağız fon + xatəm naxışı), bir <h1> */}
      <header className="ui-page-hero dhikr-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container" data-reveal="stagger">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel(navGroupOf('dhikr'), lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          {lang !== 'ar' && <p className="dhikr-hero-ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">ٱلذِّكۡرُ</p>}
          <p className="ui-lead">{t.subtitle}</p>
          <p className="ui-page-hero__how"><Icon name="info" size={16} /> <span>{tx(PAGE_TXT.how, lang)}</span></p>
          <ul className="ui-page-hero__stats">
            <li><b className="ui-num">{DHIKRS.length}</b><span>{tx(PAGE_TXT.dhikrs, lang)}</span></li>
            <li><b className="ui-num">{AFTER_PRAYER.length}</b><span>{tx(PAGE_TXT.steps, lang)}</span></li>
            <li><b className="ui-num">{lifetime}</b><span>{tx(PAGE_TXT.lifetime, lang)}</span></li>
          </ul>
        </div>
      </header>

      {/* Ümmət bu gün — saytda birlikdə deyilən salavat / zikr / cüz (anonim cəm) */}
      <section className="ui-section ui-section--tight dk-ummah">
        <div className="ui-container"><UmmahCounter lang={lang} /></div>
      </section>

      <section className="ui-section ui-section--tight">
        <div className="ui-container dk-modes-wrap">
          <div className="ui-segmented dk-modes" role="group" aria-label={tx(MODE_LABEL, lang)}>
            {MODES.map(m => (
              <button key={m.id} type="button" className="dk-mode-chip" aria-pressed={mode === m.id}
                onClick={() => setMode(m.id)} data-testid={`dhikr-mode-${m.id}`}>
                <Icon name={m.icon} size={16} /> {tx(m.label, lang)}
              </button>
            ))}
          </div>
          <SoundToggle lang={lang} className="dk-sound" />
        </div>
        {mode === 'after' && <div className="ui-container"><AfterPrayerCounter lang={lang} /></div>}
        {mode === 'free' && <div className="ui-container"><FreeCounter lang={lang} t={t} /></div>}
        {mode === 'breath' && <div className="ui-container"><BreathDhikr lang={lang} /></div>}
        {mode === 'select' && (
        <div className="ui-container dhikr-layout">

          {/* Zikr seçicisi — genişdə şaquli siyahı, telefonda üfüqi zolaq */}
          <div className="dhikr-side">
            <p className="dhikr-side-label" id="dhikr-sel-label">{t.selectZikr}</p>
            <div className="dhikr-selector" ref={selRef} role="group" aria-labelledby="dhikr-sel-label" data-reveal="stagger">
              {DHIKRS.map((d,i) => (
                <button key={i} type="button" className={`dhikr-sel-btn ${selIdx===i?'active':''}`}
                  aria-pressed={selIdx===i}
                  onClick={() => { if (selIdx !== i) { setSelIdx(i); setCount(0) } }}>
                  <span className="dhikr-sel-arabic" lang="ar" dir="rtl">{d.arabic}</span>
                  <span className="dhikr-sel-meta">
                    {/* Ərəbcədə ad elə ərəb ifadəsinin özüdür — təkrar yazılmır */}
                    {lang !== 'ar' && <span className="dhikr-sel-label">{pickUi(d, lang, 'en')}</span>}
                    <span className="dhikr-sel-target ui-num">×{d.target}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sayğac — iri, rahat basılan dairə; halqa irəliləyişi göstərir */}
          <div className="ui-card dhikr-center" data-reveal="scale">
            <div className={`dhikr-progress-ring${complete ? ' is-complete' : ''}`}>
              <svg viewBox="0 0 160 160" className="dhikr-ring-svg" aria-hidden="true">
                <circle cx="80" cy="80" r="70" fill="none" className="dhikr-ring-track" strokeWidth="5"/>
                <circle cx="80" cy="80" r="70" fill="none"
                  className="dhikr-ring-bar"
                  strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - progress/100)}
                  transform="rotate(-90 80 80)"
                />
              </svg>
              {/* Toxunuş dalğası: düymədən halqaya qədər yayılıb sönür (yalnız transform/opacity) */}
              {tapId > 0 && (
                <span key={tapId} className={`dhikr-ripple${complete ? ' is-gold' : ''}`} aria-hidden="true" />
              )}
              {/* Dövr tamamlandı — qızılı halqalar bir dəfə genişlənib sönür */}
              {complete && burst > 0 && (
                <span key={`b${burst}`} className="dhikr-halo" aria-hidden="true">
                  <span /><span />
                  {/* v4: həndəsi "konfeti" — 8 kiçik xatəm ulduzu dairə boyunca səpilir */}
                  {[0, 1, 2, 3, 4, 5, 6, 7].map(k => <i key={k} className="dk-spark" style={{ '--k': k }} />)}
                </span>
              )}
              {/* v4: halqanın ucunda parlayan işıq nöqtəsi irəliləyişlə dövr edir */}
              {progress > 0 && (
                <span className="dk-ring-tip" style={{ '--a': `${(progress * 3.6).toFixed(2)}deg` }} aria-hidden="true"><i /></span>
              )}
              {complete && <span className="dk-glow" aria-hidden="true" />}
              <button
                type="button"
                className={`dhikr-tap-btn ${tap?'tapped':''} ${complete?'complete':''}`}
                onClick={handleTap}
              >
                <span className="dhikr-tap-arabic" lang="ar" dir="rtl">{dhikr.arabic}</span>
                <span key={count} className="dhikr-tap-count ui-num">{count}</span>
                <span className="dhikr-tap-target ui-num">/ {dhikr.target}</span>
              </button>
            </div>
            {/* Fiziki təsbeh: hər toxunuşda bir muncuq sürüşür */}
            <TasbihBeads count={count} target={dhikr.target} className="dhikr-beads" />

            <div className="dhikr-info">
              <h2 className="dhikr-name">{pickUi(dhikr, lang, 'en')}</h2>
              <p className="dhikr-virtue">
                <Icon name="sparkle" size={16} />
                <span>{pickUi(dhikr.virtue, lang, 'en')}</span>
              </p>
              {dhikr.source && (
                <p className="dhikr-source">{pickUi(SOURCE_LABEL, lang, 'en')}: {localizeSource(dhikr.source, lang)}</p>
              )}
              <p className="dhikr-sunnah-note">
                {pickUi(FINGER_NOTE, lang, 'en')} <span className="dhikr-source">({localizeSource(FINGER_SOURCE, lang)})</span>
              </p>
              {complete && (
                <p className="dhikr-complete-badge" role="status">
                  <Icon name="check" size={16} /> {t.complete}
                </p>
              )}
            </div>

            <div className="dhikr-actions">
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm dhikr-reset"
                onClick={() => setCount(0)} disabled={count === 0}>
                <Icon name="refresh" className="ui-btn__icon" /> {t.reset}
              </button>
              <span className="dhikr-progress-text ui-num">{Math.round(progress)}%</span>
            </div>

            <div className="dhikr-total-bar">
              <div className="ui-stat dhikr-total-item">
                <span className="ui-stat__num dhikr-total-num">{count}</span>
                <span className="ui-stat__label">{stat('current')}</span>
              </div>
              <div className="ui-stat dhikr-total-item">
                <span className="ui-stat__num dhikr-total-num">{log.length}</span>
                <span className="ui-stat__label">{stat('sessions')}</span>
              </div>
              <div className="ui-stat dhikr-total-item">
                <span className="ui-stat__num dhikr-total-num">{totalAll}</span>
                <span className="ui-stat__label">{stat('total')}</span>
              </div>
            </div>
          </div>

          {/* Jurnal — tamamlanan dövrələr (son 10) */}
          {log.length > 0 && (
            <section className="ui-card dhikr-log" data-reveal="">
              <div className="dhikr-log-header">
                <h2 className="dhikr-log-title">{t.session}</h2>
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm dhikr-log-clear" onClick={() => setLog([])}>
                  <Icon name="trash" className="ui-btn__icon" /> {t.clearSession}
                </button>
              </div>
              {bySession.length > 1 && (
                <div className="dk-log-chart">
                  <p className="dk-steps-label">{tx(PAGE_TXT.bySession, lang)}</p>
                  <BarChart data={bySession} label={tx(PAGE_TXT.bySession, lang)} labelWidth="45%" />
                </div>
              )}
              <ul className="dhikr-log-list" data-reveal="stagger">
                {log.map((entry,i) => (
                  <li key={entry.id ?? `${entry.time}-${i}`} className="dhikr-log-row">
                    <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name="check" /></span>
                    <span className="dhikr-log-body">
                      {/* Ad cari interfeys dilində (dil dəyişəndə köhnə dildə qalmasın) */}
                      <span className="dhikr-log-name">{DHIKRS[entry.idx]?.[lang] || DHIKRS[entry.idx]?.en || entry.name}</span>
                      <span className="dhikr-log-time ui-num">{entry.time}</span>
                    </span>
                    <span className="dhikr-log-count ui-num">×{entry.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        )}
      </section>

      <section className="ui-section ui-section--tight dk-when" aria-labelledby="dk-when-h">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <h2 className="ui-title ui-title--sm" id="dk-when-h">{tx(PAGE_TXT.whenTitle, lang)}</h2>
            <p className="ui-lead">{tx(PAGE_TXT.whenLead, lang)}</p>
          </div>
          <ul className="ui-tiles" style={{ '--ui-tiles-min': '220px' }} data-reveal="stagger">
            {WHEN.map(w => (
              <li key={w.ch}>
                <a className="ui-tile ui-tile--row" href={`${pathFor('hisn', lang)}#hs-${w.ch}`}>
                  <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={w.icon} /></span>
                  <span className="ui-tile__body">
                    <span className="ui-tile__title">{tx(w.t, lang)}</span>
                    <span className="ui-tile__text">{tx(w.s, lang)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
