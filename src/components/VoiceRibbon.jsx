// ═══════════════════════════════════════════════════════
// VoiceRibbon — "Səs heykəli": səs → xəttatlıq işıq lenti
//
// • Təkbir, qiraət və ya azan zamanı səsin GÜCÜ və TONU qaranlıq vərəqdə
//   sağdan sola (ərəb yazısı istiqaməti) axan işıq lentinə çevrilir:
//   şaquli mövqe — ton, qalınlıq — güc, kənar — ~70° tutulmuş enli qələm ucu.
// • Bu NİTQ TANIMA DEYİL (sayt onu qəsdən çıxarıb): söz tanınmır, səs yazılmır,
//   heç yerə göndərilmir və saxlanmır. AnalyserNode-un hər kadrı ölçülüb atılır;
//   mənbə dinamikə qoşulmur.
// • Mikrofon yalnız düymə basılanda istənir; Dayandır / komponent çıxanda /
//   ekrandan çıxanda / tab gizlənəndə bütün treklər dayandırılır.
// • İcazə yoxdursa — demo: sintetik melodiya (səs çalınmır) lenti çəkir.
// • Riyaziyyat utils/voiceRibbon.js-dədir. İxrac 1920×1080 PNG, küncdə muslims.cc.
// • Azaldılmış hərəkət: parıltı və sönən iz yoxdur, lent sadəcə çəkilir.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { useReduced } from '../motion/reduced.js'
import {
  createPen, demoSample, estimatePitch, loudnessToAmp, nibQuad, ribbonRgb, rms,
} from '../utils/voiceRibbon'
import { canShareFile, preopenWindow, saveBlob } from '../utils/quoteCard'
import '../styles/VoiceRibbon.css'

const EXPORT_W = 1920
const EXPORT_H = 1080
const MAX_POINTS = 6000
const FILE_NAME = 'ses-heykeli-muslims-cc.png'

const T = {
  az: {
    ey: 'Səs və xətt', title: 'Səs heykəli',
    lead: 'Təkbir deyin, Quran oxuyun və ya azan verin — səsiniz qaranlıq vərəqdə sağdan sola axan işıq lentinə çevrilir. Ton yüksəldikcə lent qalxır, səs gücləndikcə qalınlaşır, kənarları isə xəttatın qələmi kimi gah incəlir, gah enlənir.',
    privacy: 'Səs yazılmır və heç yerə göndərilmir — yalnız gücü və tonu çəkilir.',
    onAir: 'Canlı', demoShort: 'Demo',
    start: 'Mikrofonu aç və başla', demo: 'Demo (səssiz melodiya)', stop: 'Dayandır',
    clear: 'Təmizlə', download: 'PNG yüklə', share: 'Paylaş',
    waiting: 'Mikrofon icazəsi gözlənilir…',
    live: 'Mikrofon açıqdır — danışın və ya oxuyun', demoOn: 'Demo: süni melodiya çəkilir, səs çalınmır',
    denied: 'Mikrofona icazə verilmədi. Narahat olmayın — demo rejimində lentin necə yarandığını görə bilərsiniz.',
    unavailable: 'Bu brauzerdə mikrofon əlçatan deyil. Demo rejimində lentə baxa bilərsiniz.',
    canvas: 'Səs lenti: ton — hündürlük, güc — qalınlıq', empty: 'Başlayın — lent sağdan sola yazılacaq',
    how: 'Necə işləyir: hər kadrda səsin gücü və əsas tonu ölçülür. Ton lentin hündürlüyünü, güc qalınlığını təyin edir; qələm ucu ~70° bucaqla tutulub — üfüqi xətlər qalın, ucun istiqamətindəki xətlər incə çıxır. Sözlər tanınmır.',
  },
  en: {
    ey: 'Voice and line', title: 'Voice sculpture',
    lead: 'Say the takbir, recite the Quran or call the adhan — your voice becomes a ribbon of light flowing from right to left across a dark page. Higher pitch lifts the ribbon, a louder voice thickens it, and its edges swell and thin like a calligrapher’s pen.',
    privacy: 'Your voice is not recorded or sent anywhere — only its loudness and pitch are drawn.',
    onAir: 'Live', demoShort: 'Demo',
    start: 'Turn on the mic and start', demo: 'Demo (silent melody)', stop: 'Stop',
    clear: 'Clear', download: 'Download PNG', share: 'Share',
    waiting: 'Waiting for microphone permission…',
    live: 'Microphone is on — speak or recite', demoOn: 'Demo: a synthetic melody is drawing, no sound is played',
    denied: 'Microphone access was not allowed. No worries — demo mode shows how the ribbon is made.',
    unavailable: 'The microphone is not available in this browser. You can watch the ribbon in demo mode.',
    canvas: 'Voice ribbon: pitch — height, loudness — thickness', empty: 'Start — the ribbon will be written from right to left',
    how: 'How it works: every frame measures the loudness and fundamental pitch of your voice. Pitch sets the ribbon’s height and loudness its thickness; the pen nib is held at about 70°, so horizontal strokes come out broad and strokes along the nib come out thin. No words are recognised.',
  },
  ru: {
    ey: 'Голос и линия', title: 'Скульптура голоса',
    lead: 'Произнесите такбир, читайте Коран или азан — ваш голос превращается в световую ленту, текущую справа налево по тёмному листу. Чем выше тон, тем выше лента; чем громче голос, тем она толще, а её края то утончаются, то расширяются, как от калама каллиграфа.',
    privacy: 'Голос не записывается и никуда не отправляется — рисуются только его громкость и тон.',
    onAir: 'Вживую', demoShort: 'Демо',
    start: 'Включить микрофон', demo: 'Демо (беззвучная мелодия)', stop: 'Остановить',
    clear: 'Очистить', download: 'Скачать изображение', share: 'Поделиться',
    waiting: 'Ожидание разрешения на микрофон…',
    live: 'Микрофон включён — говорите или читайте', demoOn: 'Демо: рисует синтетическая мелодия, звук не воспроизводится',
    denied: 'Доступ к микрофону не разрешён. Не беда — в демо-режиме видно, как рождается лента.',
    unavailable: 'Микрофон недоступен в этом браузере. Ленту можно посмотреть в демо-режиме.',
    canvas: 'Лента голоса: тон — высота, громкость — толщина', empty: 'Начните — лента будет писаться справа налево',
    how: 'Как это работает: в каждом кадре измеряются громкость и основной тон голоса. Тон задаёт высоту ленты, громкость — толщину; перо держится под углом около 70°, поэтому горизонтальные штрихи выходят широкими, а штрихи вдоль пера — тонкими. Слова не распознаются.',
  },
  ar: {
    ey: 'الصوت والخط', title: 'منحوتة الصوت',
    lead: 'كبِّر أو اتلُ القرآن أو أذِّن — فيتحوّل صوتك إلى شريط من نور ينساب من اليمين إلى اليسار على صفحة داكنة. كلما علت النغمة ارتفع الشريط، وكلما قوي الصوت غلُظ، وتدقّ حوافه وتعرض كقلم الخطّاط.',
    privacy: 'لا يُسجَّل الصوت ولا يُرسَل إلى أي مكان — تُرسم قوته ونغمته فقط.',
    onAir: 'مباشر', demoShort: 'تجريبي',
    start: 'شغّل الميكروفون وابدأ', demo: 'عرض تجريبي (لحن صامت)', stop: 'إيقاف',
    clear: 'مسح', download: 'تنزيل الصورة', share: 'مشاركة',
    waiting: 'بانتظار إذن الميكروفون…',
    live: 'الميكروفون يعمل — تكلّم أو اتلُ', demoOn: 'عرض تجريبي: لحن اصطناعي يرسم، ولا يُشغَّل أي صوت',
    denied: 'لم يُسمح بالوصول إلى الميكروفون. لا بأس — يُظهر العرض التجريبي كيف يتكوّن الشريط.',
    unavailable: 'الميكروفون غير متاح في هذا المتصفح. يمكنك مشاهدة الشريط في العرض التجريبي.',
    canvas: 'شريط الصوت: النغمة — الارتفاع، القوة — السُّمك', empty: 'ابدأ — سيُكتب الشريط من اليمين إلى اليسار',
    how: 'كيف يعمل: تُقاس في كل لحظة قوة الصوت ونغمته الأساسية. النغمة تحدّد ارتفاع الشريط والقوة سُمكه، ورأس القلم ممسوك بزاوية نحو ٧٠°، فتخرج الخطوط الأفقية عريضة والخطوط الموازية لرأس القلم رفيعة. لا يُتعرَّف على الكلمات.',
  },
  tr: {
    ey: 'Ses ve çizgi', title: 'Ses heykeli',
    lead: 'Tekbir getirin, Kur’an okuyun ya da ezan okuyun — sesiniz karanlık bir sayfada sağdan sola akan bir ışık şeridine dönüşür. Ses inceldikçe şerit yükselir, güçlendikçe kalınlaşır; kenarları bir hattatın kalemi gibi incelip genişler.',
    privacy: 'Ses kaydedilmez ve hiçbir yere gönderilmez — yalnızca gücü ve tonu çizilir.',
    onAir: 'Canlı', demoShort: 'Demo',
    start: 'Mikrofonu aç ve başla', demo: 'Demo (sessiz melodi)', stop: 'Durdur',
    clear: 'Temizle', download: 'PNG indir', share: 'Paylaş',
    waiting: 'Mikrofon izni bekleniyor…',
    live: 'Mikrofon açık — konuşun ya da okuyun', demoOn: 'Demo: yapay bir melodi çiziyor, ses çalınmıyor',
    denied: 'Mikrofon izni verilmedi. Endişelenmeyin — demo modunda şeridin nasıl oluştuğunu görebilirsiniz.',
    unavailable: 'Bu tarayıcıda mikrofon kullanılamıyor. Şeridi demo modunda izleyebilirsiniz.',
    canvas: 'Ses şeridi: ton — yükseklik, güç — kalınlık', empty: 'Başlayın — şerit sağdan sola yazılacak',
    how: 'Nasıl çalışır: her karede sesin gücü ve temel tonu ölçülür. Ton şeridin yüksekliğini, güç kalınlığını belirler; kalem ucu yaklaşık 70° açıyla tutulur — yatay çizgiler kalın, uç yönündeki çizgiler ince çıkar. Kelimeler tanınmaz.',
  },
}

/** Saytın Permissions-Policy-si mikrofonu bağlayıbsa false */
function micAllowedByPolicy() {
  try {
    const pp = document.permissionsPolicy || document.featurePolicy
    if (pp?.allowsFeature) return pp.allowsFeature('microphone')
  } catch { /* köhnə brauzer */ }
  return true
}

/** Bir qələm seqmenti: enli uc dördbucaqlısı + incə işıqlı nüvə */
function drawSeg(ctx, a, b, W, H, glow, alpha = 1) {
  const A = { x: a.x * W, y: a.y * H, w: a.w * H }
  const B = { x: b.x * W, y: b.y * H, w: b.w * H }
  const q = nibQuad(A, B)
  const col = ribbonRgb((a.hue + b.hue) / 2)
  ctx.save()
  if (glow) {
    ctx.shadowColor = `rgba(${col},0.6)`
    ctx.shadowBlur = Math.max(H * 0.012, B.w * 0.5)
  }
  ctx.fillStyle = `rgba(${col},${0.88 * alpha})`
  ctx.beginPath()
  ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); ctx.lineTo(q[4], q[5]); ctx.lineTo(q[6], q[7])
  ctx.closePath()
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.strokeStyle = `rgba(255,246,222,${0.45 * alpha})`
  ctx.lineWidth = Math.max(1, H * 0.0022)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y)
  ctx.stroke()
  ctx.restore()
}

/** Nöqtə siyahısı (null — qələm qaldırılıb) */
function drawPass(ctx, pts, W, H, glow, alpha) {
  for (let i = 1; i < pts.length; i++) {
    if (pts[i] && pts[i - 1]) drawSeg(ctx, pts[i - 1], pts[i], W, H, glow, alpha)
  }
}

/**
 * Çəkmə mühərriki — React-dan kənar (rAF, canvas, səs mənbəyi).
 * source: { sample(dt) → {hz, amp}, dispose() }
 */
function createEngine(canvas, onInk) {
  const ctx = canvas.getContext('2d')
  let W = 0, H = 0
  let pen = createPen()
  let passes = [[], []] // [əvvəlki sətir, cari sətir]
  let src = null, raf = 0, lastT = 0, frameN = 0, reduced = false, inked = false

  function redraw() {
    if (!ctx) return
    ctx.clearRect(0, 0, W, H)
    if (!reduced) drawPass(ctx, passes[0], W, H, false, 0.3)
    drawPass(ctx, passes[1], W, H, !reduced, 1)
  }
  function resize() {
    const r = canvas.getBoundingClientRect()
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr))
    if (w === W && h === H) return
    canvas.width = W = w
    canvas.height = H = h
    redraw()
  }
  function push(p) {
    const cur = passes[1]
    if (p.wrap) {
      passes = [cur, []]
      if (reduced && ctx) ctx.clearRect(0, 0, W, H)
      return
    }
    if (!p.ink) {
      if (cur.length && cur[cur.length - 1]) cur.push(null)
      return
    }
    const pt = { x: p.x, y: p.y, w: p.w, hue: p.hue }
    const prev = cur[cur.length - 1]
    if (cur.length < MAX_POINTS) cur.push(pt)
    if (prev && ctx) drawSeg(ctx, prev, pt, W, H, !reduced)
    if (!inked) { inked = true; onInk(true) }
  }
  function frame(now) {
    if (!src) return
    const dt = lastT ? (now - lastT) / 1000 : 1 / 60
    lastT = now
    const { hz, amp } = src.sample(dt)
    // sönən iz: hər 4 kadrda bir az silinir (8 bitlik yuvarlaqlaşma ilişməsin deyə)
    if (!reduced && ctx && ++frameN % 4 === 0) {
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0,0,0,0.012)'
      ctx.fillRect(0, 0, W, H)
      ctx.restore()
    }
    push(pen.step({ hz, amp, dt }))
    raf = requestAnimationFrame(frame)
  }

  return {
    resize,
    run(source) {
      this.halt()
      src = source
      lastT = 0
      const cur = passes[1]
      if (cur.length && cur[cur.length - 1]) cur.push(null)
      raf = requestAnimationFrame(frame)
    },
    halt() {
      cancelAnimationFrame(raf)
      raf = 0
      const s = src
      src = null
      if (s) s.dispose()
    },
    clear() {
      pen = createPen()
      passes = [[], []]
      inked = false
      onInk(false)
      if (ctx) ctx.clearRect(0, 0, W, H)
    },
    setReduced(v) {
      if (reduced === v) return
      reduced = v
      redraw()
    },
    exportBlob(label) {
      const c = document.createElement('canvas')
      c.width = EXPORT_W
      c.height = EXPORT_H
      const x = c.getContext('2d')
      if (!x) return Promise.resolve(null)
      const g = x.createRadialGradient(EXPORT_W * 0.55, EXPORT_H * 0.45, 40, EXPORT_W / 2, EXPORT_H / 2, EXPORT_W * 0.7)
      g.addColorStop(0, '#13203a')
      g.addColorStop(1, '#05080f')
      x.fillStyle = g
      x.fillRect(0, 0, EXPORT_W, EXPORT_H)
      // cari sətir çox qısadırsa — əvvəlkini də göstər
      const cur = passes[1].filter(Boolean).length
      if (cur < 40) drawPass(x, passes[0], EXPORT_W, EXPORT_H, true, cur ? 0.35 : 1)
      drawPass(x, passes[1], EXPORT_W, EXPORT_H, true, 1)
      x.fillStyle = 'rgba(233,210,150,0.55)'
      x.font = '500 26px system-ui, -apple-system, "Segoe UI", sans-serif'
      x.textBaseline = 'bottom'
      x.textAlign = 'left'
      x.fillText(`${label} · muslims.cc`, 48, EXPORT_H - 36)
      return new Promise(res => c.toBlob(res, 'image/png'))
    },
    destroy() { this.halt() },
  }
}

/** Mikrofon mənbəyi: AnalyserNode kadrı → güc + ton; heç nə saxlanmır */
function micSource(stream, ac) {
  const node = ac.createMediaStreamSource(stream)
  const an = ac.createAnalyser()
  an.fftSize = 2048
  an.smoothingTimeConstant = 0
  node.connect(an) // dinamikə (destination) qoşulmur — səs çalınmır
  const buf = new Float32Array(an.fftSize)
  let hz = 0, flip = false
  return {
    sample() {
      an.getFloatTimeDomainData(buf)
      const amp = loudnessToAmp(rms(buf))
      if (!amp) hz = 0
      else if ((flip = !flip) || !hz) hz = estimatePitch(buf, ac.sampleRate) // ton hər 2-ci kadrda
      return { hz, amp }
    },
    dispose() {
      stream.getTracks().forEach(t => t.stop())
      try { node.disconnect() } catch { /* artıq ayrılıb */ }
      ac.close?.().catch(() => {})
    },
  }
}

function demoSource() {
  let t = 0
  return {
    sample(dt) { t += dt; return demoSample(t) },
    dispose() {},
  }
}

export default function VoiceRibbon({ className = '' }) {
  const { lang } = useLang()
  const u = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const tokenRef = useRef({ n: 0 })
  const [mode, setMode] = useState('idle') // idle | pending | live | demo
  const [blocked, setBlocked] = useState('') // '' | 'denied' | 'unavailable'
  const [hasInk, setHasInk] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const tokens = tokenRef.current
    const eng = createEngine(canvas, setHasInk)
    engineRef.current = eng
    eng.resize()
    let ro = null
    try { ro = new ResizeObserver(() => eng.resize()); ro.observe(canvas) } catch { /* köhnə brauzer */ }
    return () => {
      tokens.n++
      ro?.disconnect()
      eng.destroy() // mikrofonu buraxır
      engineRef.current = null
    }
  }, [])

  useEffect(() => { engineRef.current?.setReduced(reduced) }, [reduced])

  const stop = useCallback(() => {
    tokenRef.current.n++
    engineRef.current?.halt()
    setMode('idle')
  }, [])

  const running = mode === 'live' || mode === 'demo' || mode === 'pending'

  // tab gizlənəndə və ya bölmə ekrandan çıxanda — dayandır (mikrofon buraxılır)
  useEffect(() => {
    if (!running) return undefined
    const onVis = () => { if (document.visibilityState === 'hidden') stop() }
    document.addEventListener('visibilitychange', onVis)
    let io = null
    const el = rootRef.current
    if (el && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(es => { if (es.some(e => !e.isIntersecting)) stop() })
      io.observe(el)
    }
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      io?.disconnect()
    }
  }, [running, stop])

  const startDemo = () => {
    tokenRef.current.n++
    const eng = engineRef.current
    if (!eng) return
    eng.run(demoSource())
    setMode('demo')
  }

  const startMic = async () => {
    const eng = engineRef.current
    if (!eng) return
    eng.halt()
    const md = typeof navigator !== 'undefined' ? navigator.mediaDevices : null
    const AC = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null
    if (!md?.getUserMedia || !AC || !micAllowedByPolicy()) {
      setBlocked('unavailable')
      setMode('idle')
      return
    }
    const token = ++tokenRef.current.n
    // AudioContext klik anında yaradılır — avtoplay siyasəti onu dayandırmasın
    let ac
    try { ac = new AC() } catch { setBlocked('unavailable'); setMode('idle'); return }
    setMode('pending')
    let stream
    try {
      stream = await md.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
    } catch (e) {
      ac.close?.().catch(() => {})
      if (token !== tokenRef.current.n) return
      const name = e?.name || ''
      setBlocked(name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError' ? 'denied' : 'unavailable')
      setMode('idle')
      return
    }
    // gözləyərkən dayandırılıb / komponent çıxıb — mikrofonu dərhal burax
    if (token !== tokenRef.current.n || engineRef.current !== eng) {
      stream.getTracks().forEach(t => t.stop())
      ac.close?.().catch(() => {})
      return
    }
    let source
    try {
      source = micSource(stream, ac)
      ac.resume?.().catch(() => {})
    } catch {
      stream.getTracks().forEach(t => t.stop())
      ac.close?.().catch(() => {})
      setBlocked('unavailable')
      setMode('idle')
      return
    }
    setBlocked('')
    eng.run(source)
    setMode('live')
  }

  const clear = () => engineRef.current?.clear()

  const exportBlob = () => engineRef.current?.exportBlob(u.title) || Promise.resolve(null)
  const download = async () => {
    const win = preopenWindow()
    setBusy(true)
    try {
      const blob = await exportBlob()
      if (blob) saveBlob(blob, FILE_NAME, win)
      else win?.close()
    } finally { setBusy(false) }
  }
  const share = async () => {
    setBusy(true)
    try {
      const blob = await exportBlob()
      if (!blob) return
      const file = new File([blob], FILE_NAME, { type: 'image/png' })
      if (canShareFile(file)) {
        try { await navigator.share({ files: [file], title: u.title }) } catch { /* istifadəçi imtina etdi */ }
      } else saveBlob(blob, FILE_NAME)
    } finally { setBusy(false) }
  }

  const state = mode === 'live' ? 'live' : mode === 'demo' ? 'demo' : blocked ? 'denied' : 'idle'
  const status = mode === 'pending' ? u.waiting : mode === 'live' ? u.live : mode === 'demo' ? u.demoOn : ''

  return (
    <section
      ref={rootRef}
      className={`ui-card vr${className ? ` ${className}` : ''}`}
      aria-labelledby="vr-title"
      data-testid="voice-ribbon"
      data-state={state}
    >
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 id="vr-title" className="vr__title">{u.title}</h2>
      <p className="vr__lead">{u.lead}</p>

      <div className={`vr__stage${reduced ? ' vr__stage--still' : ''}`}>
        <canvas
          ref={canvasRef}
          className="vr__canvas"
          data-testid="vr-canvas"
          role="img"
          aria-label={u.canvas}
        />
        {!hasInk && !running && <p className="vr__empty" aria-hidden="true">{u.empty}</p>}
        {(mode === 'live' || mode === 'demo') && (
          <span className={`vr__badge vr__badge--${mode}`} aria-hidden="true">
            <span className="vr__dot" />{mode === 'live' ? u.onAir : u.demoShort}
          </span>
        )}
      </div>

      <p className="vr__privacy">
        <Icon name="mic" size={16} />{u.privacy}
      </p>

      <p className="vr__status" role="status" aria-live="polite">{status}</p>
      {blocked && mode !== 'live' && (
        <p className="vr__msg" role="alert">{blocked === 'denied' ? u.denied : u.unavailable}</p>
      )}

      <div className="vr__btns">
        {running ? (
          <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" data-testid="vr-stop" onClick={stop}>
            <Icon name="pause" size={16} />{u.stop}
          </button>
        ) : (
          <>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" data-testid="vr-start" onClick={startMic}>
              <Icon name="mic" size={16} />{u.start}
            </button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" data-testid="vr-demo" onClick={startDemo}>
              <Icon name="play" size={16} />{u.demo}
            </button>
          </>
        )}
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={clear} disabled={!hasInk}>
          <Icon name="trash" size={16} />{u.clear}
        </button>
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" data-testid="vr-download" onClick={download} disabled={!hasInk || busy}>
          <Icon name="download" size={16} />{u.download}
        </button>
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={share} disabled={!hasInk || busy}>
          <Icon name="share" size={16} />{u.share}
        </button>
      </div>

      <p className="vr__how">{u.how}</p>
    </section>
  )
}
