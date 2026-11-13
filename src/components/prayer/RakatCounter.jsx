// ═══════════════════════════════════════════════════════
// RakatCounter (v6.6) — "Rəkət sayğacı" (/prayerguide, səhv səcdəsi bələdçisindən əvvəl)
//
//   <RakatCounter lang="az" sahwHref="#shw-title" />
//
// • Kamera rejimi: telefon səccadənin qabağında üzüyuxarı; səcdədə baş ön kameranı kölgələyir —
//   utils/rakatCount.createSujoodDetector işığın düşməsindən səcdəni tanıyır (2 səcdə = 1 rəkət).
//   Görüntü göstərilmir, saxlanmır, göndərilmir — yalnız 32×24 kadrın orta parlaqlığı ölçülür.
// • Toxunuş rejimi: hər rəkətdən sonra ekrana bir toxunuş.
// • Ekran qara, rəqəm zəif — diqqəti yayındırmasın; ekran sönməsin deyə Wake Lock.
// • Şübhə olanda hökm — səhv səcdəsi bələdçisi (keçid); sayğac fətva vermir.
// Stillər: src/styles/RakatCounter.css
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { createSujoodDetector, rakatState } from '../../utils/rakatCount'
import '../../styles/RakatCounter.css'

const T = {
    // lang-ok[kamera,Kamera,kameranı,Kameraya]: azərbaycanca söz (kamera)
  az: { ey: 'Rəkət sayğacı', title: 'Neçənci rəkətdəyəm?', lead: 'Unutqanlıq və şübhə olanda kömək: telefonu səccadənin qabağına üzüyuxarı qoyun — səcdədə başınız kameranı kölgələyəndə sayğac səcdəni özü sayır. Ekrana toxunmaq lazım deyil.',
    pick: 'Namaz', r2: '2 rəkət', r3: '3 rəkət', r4: '4 rəkət', h2: 'Sübh', h3: 'Məğrib', h4: 'Zöhr, Əsr, İşa',
    // lang-ok[kamera,Kamera,kameranı,Kameraya]: azərbaycanca söz (kamera)
    cam: 'Kamera ilə (toxunuşsuz)', tap: 'Toxunuşla', start: 'Başla', close: 'Bağla', undo: 'Səhv sayıldı (−1 səcdə)', undoTap: 'Geri (−1 rəkət)',
    rakat: 'rəkət', sujood: 'səcdə', middle: 'Orta təşəhhüd — sonra qalxın', last: 'Son rəkət', end: 'Namaz bitdi', endSub: n => `${n} rəkət — Allah qəbul etsin`,
    // lang-ok[kamera,Kamera,kameranı,Kameraya]: azərbaycanca söz (kamera)
    tapHint: 'Hər rəkət bitəndə ekrana bir dəfə toxunun', camHint: 'Telefonu səcdə yerinin qabağına üzüyuxarı qoyun', calib: 'Kamera hazırlanır…', camErr: 'Kameraya icazə verilmədi — toxunuş rejimi açıldı.',
    privacy: 'Görüntü göstərilmir, yazılmır və heç yerə göndərilmir: cihaz yalnız işığın orta parlaqlığını ölçür.', sahw: 'Rəkətlərin sayında şübhə etdinizsə — səhv səcdəsi bələdçisi',
    // lang-ok[kamera,Kamera,kameranı,Kameraya]: azərbaycanca söz (kamera)
    note: 'Sayğac yalnız köməkçidir. Kamera rejimi işıqlı yerdə daha dəqiqdir; telefonu səcdə yerinə deyil, onun qabağına qoyun.' },
  en: { ey: 'Rakʿah counter', title: 'Which rakʿah am I in?', lead: 'A help for forgetfulness and doubt: lay your phone face up in front of your prayer mat — when your head shades the camera in sujud, the counter counts it by itself. No need to touch the screen.',
    pick: 'Prayer', r2: '2 rakʿahs', r3: '3 rakʿahs', r4: '4 rakʿahs', h2: 'Fajr', h3: 'Maghrib', h4: 'Dhuhr, Asr, Isha',
    cam: 'With the camera (no touch)', tap: 'By tapping', start: 'Start', close: 'Close', undo: 'Miscounted (−1 sujud)', undoTap: 'Back (−1 rakʿah)',
    rakat: 'rakʿah', sujood: 'sujud', middle: 'Middle tashahhud — then stand up', last: 'Last rakʿah', end: 'Prayer complete', endSub: n => `${n} rakʿahs — may Allah accept it`,
    tapHint: 'Tap the screen once at the end of each rakʿah', camHint: 'Lay the phone face up in front of where you prostrate', calib: 'Preparing the camera…', camErr: 'Camera access was not allowed — switched to tap mode.',
    privacy: 'The image is never shown, recorded or sent anywhere: the device only measures the average brightness of the light.', sahw: 'Unsure how many rakʿahs you prayed? The prostration of forgetfulness guide',
    note: 'The counter is only a helper. Camera mode works best in a lit room; place the phone in front of the spot of prostration, not on it.' },
  ru: { ey: 'Счётчик ракаатов', title: 'Какой это ракаат?', lead: 'Помощь при забывчивости и сомнениях: положите телефон экраном вверх перед молитвенным ковриком — когда в земном поклоне голова затеняет камеру, счётчик сам засчитывает суджуд. Касаться экрана не нужно.',
    pick: 'Намаз', r2: '2 ракаата', r3: '3 ракаата', r4: '4 ракаата', h2: 'Фаджр', h3: 'Магриб', h4: 'Зухр, Аср, Иша',
    cam: 'С камерой (без касаний)', tap: 'Касанием', start: 'Начать', close: 'Закрыть', undo: 'Ошибка (−1 суджуд)', undoTap: 'Назад (−1 ракаат)',
    rakat: 'ракаат', sujood: 'суджуд', middle: 'Средний ташаххуд — затем встаньте', last: 'Последний ракаат', end: 'Намаз завершён', endSub: n => `Ракаатов: ${n} — да примет Аллах`,
    tapHint: 'Коснитесь экрана один раз в конце каждого ракаата', camHint: 'Положите телефон экраном вверх перед местом суджуда', calib: 'Камера готовится…', camErr: 'Доступ к камере не разрешён — включён режим касаний.',
    privacy: 'Изображение не показывается, не записывается и никуда не отправляется: устройство измеряет только среднюю яркость света.', sahw: 'Сомневаетесь в числе ракаатов? Руководство по земным поклонам забывчивости',
    note: 'Счётчик — лишь помощник. Режим камеры точнее в освещённом помещении; кладите телефон перед местом суджуда, а не на него.' },
  ar: { ey: 'عدّاد الركعات', title: 'في أيّ ركعة أنا؟', lead: 'عون عند النسيان والشك: ضع هاتفك على ظهره أمام سجادتك — فإذا ظلّل رأسك الكاميرا في السجود عدّه العدّاد بنفسه، دون لمس الشاشة.',
    pick: 'الصلاة', r2: 'ركعتان', r3: 'ثلاث ركعات', r4: 'أربع ركعات', h2: 'الفجر', h3: 'المغرب', h4: 'الظهر والعصر والعشاء',
    cam: 'بالكاميرا (دون لمس)', tap: 'باللمس', start: 'ابدأ', close: 'إغلاق', undo: 'عُدّت خطأً (−١ سجدة)', undoTap: 'رجوع (−١ ركعة)',
    rakat: 'ركعة', sujood: 'سجدة', middle: 'التشهد الأوسط — ثم قم', last: 'الركعة الأخيرة', end: 'تمت الصلاة', endSub: n => `${n} ركعات — تقبّل الله`,
    tapHint: 'المس الشاشة مرة في آخر كل ركعة', camHint: 'ضع الهاتف على ظهره أمام موضع السجود', calib: 'تجهيز الكاميرا…', camErr: 'لم يُسمح بالكاميرا — فُعّل وضع اللمس.',
    privacy: 'لا تُعرض الصورة ولا تُسجَّل ولا تُرسل إلى أي مكان: يقيس الجهاز متوسط شدة الضوء فقط.', sahw: 'شككت في عدد الركعات؟ دليل سجود السهو',
    note: 'العدّاد عون فحسب. وضع الكاميرا أدق في مكان مضاء؛ ضع الهاتف أمام موضع السجود لا عليه.' },
  tr: { ey: 'Rekât sayacı', title: 'Kaçıncı rekâttayım?', lead: 'Unutkanlık ve şüphe anında yardım: telefonu seccadenin önüne ekranı yukarı bakacak şekilde koyun — secdede başınız kamerayı gölgeleyince sayaç secdeyi kendisi sayar. Ekrana dokunmanız gerekmez.',
    pick: 'Namaz', r2: '2 rekât', r3: '3 rekât', r4: '4 rekât', h2: 'Sabah', h3: 'Akşam', h4: 'Öğle, İkindi, Yatsı',
    cam: 'Kamerayla (dokunmadan)', tap: 'Dokunarak', start: 'Başla', close: 'Kapat', undo: 'Yanlış sayıldı (−1 secde)', undoTap: 'Geri (−1 rekât)',
    rakat: 'rekât', sujood: 'secde', middle: 'Ara oturuş — sonra kalkın', last: 'Son rekât', end: 'Namaz tamamlandı', endSub: n => `${n} rekât — Allah kabul etsin`,
    tapHint: 'Her rekâtın sonunda ekrana bir kez dokunun', camHint: 'Telefonu secde yerinin önüne ekranı yukarı bakacak şekilde koyun', calib: 'Kamera hazırlanıyor…', camErr: 'Kamera izni verilmedi — dokunma modu açıldı.',
    privacy: 'Görüntü gösterilmez, kaydedilmez ve hiçbir yere gönderilmez: cihaz yalnızca ışığın ortalama parlaklığını ölçer.', sahw: 'Rekât sayısında şüpheye mi düştünüz? Sehiv secdesi rehberi',
    note: 'Sayaç yalnızca yardımcıdır. Kamera modu aydınlık yerde daha doğrudur; telefonu secde yerinin üstüne değil, önüne koyun.' },
}

const OPTIONS = [[2, 'h2'], [3, 'h3'], [4, 'h4']]

export default function RakatCounter({ lang = 'az', sahwHref }) {
  const t = pickUi(T, lang)
  const [total, setTotal] = useState(4)
  const [mode, setMode] = useState('cam')
  const [open, setOpen] = useState(false)
  const camOk = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  return (
    <section className="ui-section ui-section--tight">
      <div className="ui-container">
        <div className="rkc ui-card" data-testid="rakat-counter">
          <div className="rkc__head">
            <span className="ui-eyebrow">{t.ey}</span>
            <h2 className="ui-title ui-title--sm">{t.title}</h2>
            <p className="ui-lead">{t.lead}</p>
          </div>
          <div className="rkc__row" role="radiogroup" aria-label={t.pick}>
            {OPTIONS.map(([n, h]) => (
              <button key={n} type="button" role="radio" aria-checked={total === n} className={`rkc__opt${total === n ? ' is-on' : ''}`} onClick={() => setTotal(n)} data-testid={`rkc-n${n}`}>
                <b>{t[`r${n}`]}</b><span>{t[h]}</span>
              </button>
            ))}
          </div>
          <div className="rkc__row rkc__modes" role="radiogroup" aria-label={t.ey}>
            {camOk && <button type="button" role="radio" aria-checked={mode === 'cam'} className={`rkc__mode${mode === 'cam' ? ' is-on' : ''}`} onClick={() => setMode('cam')}><Icon name="target" size={15} /> {t.cam}</button>}
            <button type="button" role="radio" aria-checked={mode === 'tap' || !camOk} className={`rkc__mode${mode === 'tap' || !camOk ? ' is-on' : ''}`} onClick={() => setMode('tap')} data-testid="rkc-tapmode"><Icon name="check" size={15} /> {t.tap}</button>
          </div>
          <button type="button" className="ui-btn ui-btn--primary rkc__start" onClick={() => setOpen(true)} data-testid="rkc-start"><Icon name="play" size={15} className="ui-btn__icon" /> {t.start}</button>
          <p className="rkc__muted"><Icon name="info" size={14} /> {t.privacy}</p>
          {sahwHref && <a className="ui-link rkc__sahw" href={sahwHref}>{t.sahw} <Icon name="arrow" size={14} className="ui-link__arrow ui-flip-rtl" /></a>}
          <p className="rkc__muted">{t.note}</p>
        </div>
      </div>
      {open && <Overlay t={t} total={total} mode={camOk ? mode : 'tap'} onClose={() => setOpen(false)} />}
    </section>
  )
}

function Overlay({ t, total, mode: mode0, onClose }) {
  const [mode, setMode] = useState(mode0)
  const [sujood, setSujood] = useState(0)
  const [ready, setReady] = useState(mode0 !== 'cam')
  const [dark, setDark] = useState(false)
  const [err, setErr] = useState(false)
  const det = useRef(null)
  const videoRef = useRef(null)
  const closeRef = useRef(null)
  const st = rakatState(sujood, total)

  // Ekran sönməsin
  useEffect(() => {
    let lock = null
    navigator.wakeLock?.request?.('screen').then(l => { lock = l }).catch(() => {})
    closeRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.documentElement.classList.add('rkc-lock')
    return () => { lock?.release?.().catch(() => {}); window.removeEventListener('keydown', onKey); document.documentElement.classList.remove('rkc-lock') }
  }, [onClose])

  // Kamera → parlaqlıq → detektor
  useEffect(() => {
    if (mode !== 'cam') return
    let stream = null, id = 0, alive = true
    det.current = createSujoodDetector()
    const cv = document.createElement('canvas'); cv.width = 32; cv.height = 24
    const ctx = cv.getContext('2d', { willReadFrequently: true })
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'user' }, width: { ideal: 160 }, height: { ideal: 120 } }, audio: false })
      .then(s => {
        if (!alive) { s.getTracks().forEach(tr => tr.stop()); return }
        stream = s
        const v = videoRef.current
        v.srcObject = s
        v.play?.().catch(() => {})
        id = setInterval(() => {
          if (!ctx || v.readyState < 2) return
          ctx.drawImage(v, 0, 0, 32, 24)
          const px = ctx.getImageData(0, 0, 32, 24).data
          let sum = 0
          for (let i = 0; i < px.length; i += 4) sum += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]
          const r = det.current.feed(sum / (px.length / 4), performance.now())
          setReady(true); setDark(r.dark)
          if (r.changed) setSujood(r.count)
        }, 100)
      })
      .catch(() => { if (alive) { setErr(true); setMode('tap'); setReady(true) } })
    return () => { alive = false; clearInterval(id); stream?.getTracks().forEach(tr => tr.stop()) }
  }, [mode])

  const tap = () => { if (mode === 'tap' && st.phase !== 'end') setSujood(s => s + 2 - (s % 2)) }
  const undo = (e) => { e.stopPropagation(); if (mode === 'cam') setSujood(det.current?.undo() ?? 0); else setSujood(s => Math.max(0, s - 2)) }
  const msg = st.phase === 'end' ? null : st.phase === 'middle' ? t.middle : st.phase === 'last' ? t.last : null

  return (
    <div className={`rkc-ov${dark ? ' is-dark' : ''}`} role="dialog" aria-modal="true" aria-label={t.ey} onClick={tap} data-testid="rkc-overlay">
      <video ref={videoRef} className="rkc-ov__video" muted playsInline aria-hidden="true" />
      <button ref={closeRef} type="button" className="rkc-ov__close" onClick={(e) => { e.stopPropagation(); onClose() }} aria-label={t.close}><Icon name="close" size={22} /></button>
      {st.phase === 'end' ? (
        <div className="rkc-ov__mid" aria-live="polite">
          <span className="rkc-ov__end" data-testid="rkc-end">{t.end}</span>
          <span className="rkc-ov__sub">{t.endSub(total)}</span>
        </div>
      ) : (
        <div className="rkc-ov__mid" aria-live="polite">
          <span className="rkc-ov__num ui-num" data-testid="rkc-num">{st.current}</span>
          <span className="rkc-ov__of ui-num">/ {total} {t.rakat}</span>
          {mode === 'cam' && <span className="rkc-ov__dots" aria-hidden="true"><i className={st.half ? 'is-on' : ''} /><i /></span>}
          {msg && <span className="rkc-ov__msg" data-testid="rkc-msg">{msg}</span>}
        </div>
      )}
      <div className="rkc-ov__foot">
        {!ready ? <span>{t.calib}</span> : err ? <span>{t.camErr}</span> : <span>{mode === 'cam' ? t.camHint : t.tapHint}</span>}
        {sujood > 0 && st.phase !== 'end' && <button type="button" className="rkc-ov__undo" onClick={undo}>{mode === 'cam' ? t.undo : t.undoTap}</button>}
      </div>
    </div>
  )
}
