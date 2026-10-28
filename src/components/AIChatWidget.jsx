import { useState, useRef, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { checkRateLimit, recordMessage, getActiveCooldown } from '../utils/rateLimit'
import { subscribeToSettings } from '../data/adminContent'
import { BRAND } from '../config/brand'
import Icon from './Icon'
import AIMarkdown from './AIMarkdown'
import { askAI } from '../utils/aiStream'
import '../styles/AIChatWidget.css'

// URL prioritet: Firebase Settings.apiUrl > VITE_API_URL > ''
const FALLBACK_API_URL = import.meta.env.VITE_API_URL || ''
const STORAGE_KEY = 'muslim_cc_aichat_v2'

// AI ikonu — sparkle/star (Gemini, Copilot, Claude tipli universal AI işarəsi)
function AIIcon({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Əsas sparkle */}
      <path
        d="M16 3.5 L17.9 13.6 L28 16 L17.9 18.4 L16 28.5 L14.1 18.4 L4 16 L14.1 13.6 Z"
        fill="currentColor"
      />
      {/* Yuxarı kiçik sparkle */}
      <path
        d="M24.5 5.5 L25.3 8.2 L28 9 L25.3 9.8 L24.5 12.5 L23.7 9.8 L21 9 L23.7 8.2 Z"
        fill="currentColor"
        opacity="0.85"
      />
      {/* Aşağı kiçik sparkle */}
      <path
        d="M7 22 L7.5 23.8 L9.3 24.3 L7.5 24.8 L7 26.6 L6.5 24.8 L4.7 24.3 L6.5 23.8 Z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  )
}

// Göndər düyməsinin ekran oxuyucusu üçün adı (5 dil)
const SEND_LABEL = { az:'Göndər', en:'Send', ru:'Отправить', ar:'إرسال', tr:'Gönder' }

const LABELS = {
  az: {
    botName:BRAND.aiName.az,
    stop:'Dayandır',
    retry:'Yenidən göndər',
    offline:'AI xidməti hazırda cavab vermir. Bir az sonra yenidən cəhd edin.',
    timeout:'Cavab çox gecikdi. Yenidən cəhd edin.',
    tagline:'İslami AI köməkçi',
    placeholder:'Sualınızı yazın...',
    welcome:`Salam aleykum! Mən ${BRAND.name.az} saytının AI köməkçisiyəm. Quran, hədis, namaz, dua haqqında soruşa bilərsiniz.`,
    suggest1:'Namaz necə qılınır?',
    suggest2:'Səbr haqqında hədis',
    suggest3:'Ən fəzilətli dua hansıdır?',
    suggest4:'Tövhid nədir?',
    disclaimer:`${BRAND.aiDisclaimer.az} Allah daha yaxşı bilir.`,
    online:'Onlayn',
    typing:'Yazır',
    error:'Xəta. Yenidən cəhd edin.',
    clear:'Təmizlə',
    minimize:'Kiçilt',
    close:'Bağla',
    open:`${BRAND.aiName.az} ilə danış`,
    noBackend:'AI xidməti hələ qurulmayıb',
    rateLimit:'Çox sürətli yazırsınız. Zəhmət olmasa gözləyin, {s} saniyə sonra yenidən cəhd edin.',
    rateLimitShort:'Bir az gözləyin... {s}s',
  },
  en: {
    botName:BRAND.aiName.en,
    stop:'Stop',
    retry:'Send again',
    offline:'The AI service is not responding right now. Please try again in a moment.',
    timeout:'The answer took too long. Please try again.',
    tagline:'Islamic AI assistant',
    placeholder:'Type your question...',
    welcome:`Assalamu alaikum! I am the AI assistant of the ${BRAND.name.en} website. You can ask about Quran, Hadith, prayer, duas.`,
    suggest1:'How to pray?',
    suggest2:'Hadith about patience',
    suggest3:'Most virtuous dua?',
    suggest4:'What is Tawheed?',
    disclaimer:`${BRAND.aiDisclaimer.en} Allah knows best.`,
    online:'Online',
    typing:'Typing',
    error:'Error. Try again.',
    clear:'Clear',
    minimize:'Minimize',
    close:'Close',
    open:`Chat with the ${BRAND.aiName.en}`,
    noBackend:'AI service not configured',
    rateLimit:'You are sending too fast. Please wait — try again in {s} seconds.',
    rateLimitShort:'Wait a moment... {s}s',
  },
  ru: {
    botName:BRAND.aiName.ru,
    stop:'Остановить',
    retry:'Отправить снова',
    offline:'Сервис ИИ сейчас не отвечает. Попробуйте ещё раз чуть позже.',
    timeout:'Ответ занял слишком много времени. Попробуйте ещё раз.',
    tagline:'Исламский AI помощник',
    placeholder:'Напишите вопрос...',
    welcome:`Ас-саляму алейкум! Я ИИ-помощник сайта «${BRAND.name.ru}». Спрашивайте о Коране, хадисах, намазе, дуа.`,
    suggest1:'Как совершать намаз?',
    suggest2:'Хадис о терпении',
    suggest3:'Лучшая дуа?',
    suggest4:'Что такое Таухид?',
    disclaimer:`${BRAND.aiDisclaimer.ru} Аллах знает лучше.`,
    online:'Онлайн',
    typing:'Пишет',
    error:'Ошибка. Попробуйте снова.',
    clear:'Очистить',
    minimize:'Свернуть',
    close:'Закрыть',
    open:'Чат с ИИ-помощником',
    noBackend:'AI сервис не настроен',
    rateLimit:'Вы пишете слишком быстро. Пожалуйста, подождите — попробуйте через {s} сек.',
    rateLimitShort:'Подождите... {s}с',
  },
  ar: {
    botName:BRAND.aiName.ar,
    stop:'إيقاف',
    retry:'أعد الإرسال',
    offline:'خدمة الذكاء الاصطناعي لا تستجيب الآن. حاول مرة أخرى بعد قليل.',
    timeout:'استغرق الرد وقتًا طويلًا. حاول مرة أخرى.',
    tagline:'مساعد ذكاء اصطناعي إسلامي',
    placeholder:'اكتب سؤالك...',
    welcome:`السلام عليكم! أنا المساعد الذكي لموقع ${BRAND.name.ar}. اسألني عن القرآن، الحديث، الصلاة، الأدعية.`,
    suggest1:'كيف أصلي؟',
    suggest2:'حديث عن الصبر',
    suggest3:'أفضل دعاء؟',
    suggest4:'ما هو التوحيد؟',
    disclaimer:`${BRAND.aiDisclaimer.ar} والله أعلم.`,
    online:'متصل',
    typing:'يكتب',
    error:'خطأ. حاول مرة أخرى.',
    clear:'مسح',
    minimize:'تصغير',
    close:'إغلاق',
    open:`الدردشة مع ${BRAND.aiName.ar}`,
    noBackend:'خدمة AI غير مكونة',
    rateLimit:'تكتب بسرعة كبيرة. يُرجى الانتظار — حاول مرة أخرى بعد {s} ثانية.',
    rateLimitShort:'انتظر قليلاً... {s} ث',
  },
  tr: {
    botName:BRAND.aiName.tr,
    stop:'Durdur',
    retry:'Tekrar gönder',
    offline:'AI hizmeti şu anda yanıt vermiyor. Lütfen biraz sonra tekrar deneyin.',
    timeout:'Cevap çok gecikti. Lütfen tekrar deneyin.',
    tagline:'İslami AI asistan',
    placeholder:'Sorunuzu yazın...',
    welcome:`Selamün aleyküm! Ben ${BRAND.name.tr} web sitesinin yapay zekâ asistanıyım. Kuran, hadis, namaz, dua hakkında sorabilirsiniz.`,
    suggest1:'Namaz nasıl kılınır?',
    suggest2:'Sabırla ilgili hadis',
    suggest3:'En faziletli dua?',
    suggest4:'Tevhid nedir?',
    disclaimer:`${BRAND.aiDisclaimer.tr} Allah daha iyi bilir.`,
    online:'Çevrimiçi',
    typing:'Yazıyor',
    error:'Hata. Tekrar deneyin.',
    clear:'Temizle',
    minimize:'Küçült',
    close:'Kapat',
    open:`${BRAND.aiName.tr} ile sohbet`,
    noBackend:'AI servisi yapılandırılmamış',
    rateLimit:'Çok hızlı yazıyorsunuz. Lütfen {s} saniye bekleyin ve tekrar deneyin.',
    rateLimitShort:'Biraz bekleyin... {s}s',
  },
}

/**
 * AI köməkçi paneli.
 *
 * İki rejim:
 *  • İdarə olunan — `open` prop verilir (FloatingDock). Öz üzən düyməsini
 *    göstərmir; bağlananda `onClose()` çağırılır.
 *  • Köhnə (müstəqil) — prop yoxdur: öz "AI" düyməsi ilə açılır.
 *
 * @param {{ open?: boolean, onClose?: () => void, onUnreadChange?: (v: boolean) => void }} props
 */
export default function AIChatWidget({ open: openProp, onClose, onUnreadChange } = {}) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const controlled = openProp !== undefined
  const [openState, setOpenState] = useState(false)
  const open = controlled ? Boolean(openProp) : openState
  const setOpen = (value) => {
    if (controlled) { if (!value) onClose?.() }
    else setOpenState(value)
  }
  // Asinxron cavab gələndə panelin CARİ vəziyyətini bilmək üçün
  const openRef = useRef(open)
  openRef.current = open
  const closeRef = useRef(null)
  closeRef.current = () => setOpen(false)

  const [hasUnread, setHasUnread] = useState(false)
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0) // saniyə qaldı
  const [apiUrl, setApiUrl] = useState(FALLBACK_API_URL)
  // Son göndərmə alınmadı — "Yenidən göndər" düyməsi görünür
  const [failed, setFailed] = useState(false)
  // Axında gələn (hələ bitməmiş) cavab; null — axın yoxdur
  const [streamText, setStreamText] = useState(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)
  // İstifadəçi aşağıdadırsa yeni mətnlə aşağıda qal; yuxarı sürüşdürübsə — məcbur etmə
  const stickRef = useRef(true)
  const lastTopRef = useRef(0)

  // Komponent çıxanda yarımçıq sorğunu kəs
  useEffect(() => () => abortRef.current?.abort(), [])

  // Admin Firebase Settings-dən API URL-i real-time oxu (mobile ilə eyni)
  useEffect(() => {
    const unsubscribe = subscribeToSettings((settings) => {
      const url = settings?.apiUrl?.trim()
      if (url && /^https?:\/\//.test(url)) setApiUrl(url)
      else setApiUrl(FALLBACK_API_URL)
    })
    return () => unsubscribe?.()
  }, [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)) } catch {}
  }, [messages])

  // Boş söhbətdə salamlama ekranı yuxarıdan görünsün — aşağı sürüşdürmə yalnız mesaj olanda
  useEffect(() => {
    const el = scrollRef.current
    if (el && messages.length > 0 && stickRef.current) el.scrollTop = el.scrollHeight
  }, [messages, streamText, loading])

  // Yalnız istifadəçi YUXARI sürüşdürəndə "yapışmanı" burax; aşağı enəndə qayıt
  const onBodyScroll = () => {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) stickRef.current = true
    else if (el.scrollTop < lastTopRef.current - 2) stickRef.current = false
    lastTopRef.current = el.scrollTop
  }

  useEffect(() => {
    if (open) {
      // Panel açılanda son mesaj görünsün (panel bağlı ikən gələn cavablar da daxil)
      requestAnimationFrame(() => {
        const el = scrollRef.current
        if (el && el.scrollHeight > el.clientHeight && el.querySelector('.aiw-msg')) {
          el.scrollTop = el.scrollHeight
        }
      })
      setHasUnread(false)
      // Mobil-da autofocus klaviaturanı dərhal açır — istəmirik
      const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
      if (!isMobile) setTimeout(() => inputRef.current?.focus(), 200)
      // Yenidən açıldıqda cooldown statusunu yoxla
      const remaining = getActiveCooldown()
      if (remaining > 0) setCooldown(remaining)
    }
  }, [open])

  // Visual viewport API — klaviatura açıldıqda chat-i düzəlt (iOS Safari)
  useEffect(() => {
    if (!open || typeof window === 'undefined' || !window.visualViewport) return
    const handler = () => {
      // Mesajların aşağıya scroll edilməsi
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }
    window.visualViewport.addEventListener('resize', handler)
    return () => window.visualViewport.removeEventListener('resize', handler)
  }, [open])

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setError('')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [cooldown])

  // Escape ilə bağlama
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Açıq olduqda body-ə class əlavə et (mobil scroll kilidi, üzən düymələri gizlət).
  // Yalnız açıq ikən əlavə edib bağlananda silirik — panellər arasında
  // keçid zamanı bir panelin təmizləməsi digərinin sinfini silməsin.
  useEffect(() => {
    if (!open) return
    document.body.classList.add('panel-open')
    return () => document.body.classList.remove('panel-open')
  }, [open])

  // Oxunmamış cavab göstəricisi — dok düyməsində nöqtə üçün
  useEffect(() => {
    onUnreadChange?.(hasUnread)
  }, [hasUnread, onUnreadChange])

  // Başqa panel açılanda bunu bağla (yalnız müstəqil rejimdə —
  // idarə olunan rejimdə eyni anda bir paneli FloatingDock özü təmin edir)
  useEffect(() => {
    if (controlled) return
    const handler = (e) => {
      if (e.detail !== 'ai') setOpenState(false)
    }
    window.addEventListener('close-other-panels', handler)
    return () => window.removeEventListener('close-other-panels', handler)
  }, [controlled])

  // Bu açılanda digərlərinə xəbər ver
  useEffect(() => {
    if (open && !controlled) window.dispatchEvent(new CustomEvent('close-other-panels', { detail: 'ai' }))
  }, [open, controlled])

  // base — mesajın əlavə olunacağı söhbət (təkrar cəhddə son sual çıxarılır)
  const sendMessage = async (text, base = messages) => {
    const msg = (text ?? input).trim()
    if (!msg || loading || cooldown > 0) return
    if (!apiUrl) { setError(l.noBackend); return }

    // Rate limit yoxla
    const rl = checkRateLimit()
    if (!rl.allowed) {
      const tmpl = rl.kind === 'cooldown' ? l.rateLimit : l.rateLimitShort
      setError(tmpl.replace('{s}', rl.remaining))
      setCooldown(rl.remaining)
      return
    }

    setError('')
    setFailed(false)
    setInput('')
    const userMessage = { role:'user', content: msg, time: Date.now(), lang }
    const updated = [...base, userMessage]
    setMessages(updated)
    setLoading(true)
    setStreamText(null)
    stickRef.current = true
    recordMessage()

    const ac = new AbortController()
    abortRef.current = ac
    try {
      // Yalnız cari dildəki mesajları kontekst kimi göndər ki, Gemini cavabı
      // keçmiş söhbətdəki dilə uyğunlaşdırmasın. Köhnə mesajlar (lang işarəsi olmadan) az sayılır.
      // Server son 6 mesajı götürür (+ cari sual) — artığını göndərməyə dəyməz
      const sameLangHistory = updated.filter(m => (m.lang || 'az') === lang).slice(-7)
      const reply = await askAI({
        apiUrl,
        message: msg,
        history: sameLangHistory.map(m => ({ role: m.role, content: m.content })),
        lang,
        signal: ac.signal,
        onDelta: (t) => setStreamText(t),
      })
      setMessages([...updated, { role:'assistant', content: reply, time: Date.now(), lang }])
      if (!openRef.current) setHasUnread(true)
    } catch (e) {
      if (e?.code === 'aborted') {
        // "Dayandır" — gəlmiş hissə söhbətdə qalsın
        if (e.partial?.trim()) setMessages([...updated, { role:'assistant', content: e.partial.trim(), time: Date.now(), lang }])
      } else {
        setError(e?.code === 'timeout' ? l.timeout : l.offline)
        setFailed(true)
      }
    }
    if (abortRef.current === ac) abortRef.current = null
    setStreamText(null)
    setLoading(false)
    inputRef.current?.focus({ preventScroll: true })
  }

  const stopStreaming = () => abortRef.current?.abort()

  // Son (cavabsız) sualı yenidən göndər — söhbətdə təkrarlanmasın
  const retryLast = () => {
    const last = messages[messages.length - 1]
    if (!last || last.role !== 'user') return
    sendMessage(last.content, messages.slice(0, -1))
  }
  const canRetry = failed && messages.length > 0 && messages[messages.length - 1].role === 'user'

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage()
  }

  const handleClear = () => {
    setMessages([])
    setError('')
    setFailed(false)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* yaddaş bağlıdır */ }
  }

  const suggestions = [l.suggest1, l.suggest2, l.suggest3, l.suggest4]

  return (
    <>
      {/* FAB — yalnız müstəqil rejimdə (dokda bu düymə yoxdur) */}
      {!controlled && !open && (
        <button
          className="aiw-fab"
          onClick={() => setOpen(true)}
          aria-label={l.open}
          title={l.open}
        >
          <div className="aiw-fab-ring"></div>
          <div className="aiw-fab-icon">
            <AIIcon size={22} />
          </div>
          {hasUnread && <span className="aiw-fab-dot"></span>}
          <span className="aiw-fab-label">AI</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="aiw-panel" role="dialog" aria-label={l.botName}>
          {/* Header */}
          <div className="aiw-header">
            <div className="aiw-header-info">
              <div className="aiw-avatar">
                <Icon name="sparkle" size={22} />
                <span className="aiw-avatar-status"></span>
              </div>
              <div>
                <div className="aiw-name">{l.botName}</div>
                <div className={`aiw-status${loading ? ' is-typing' : ''}`}>
                  <span className="aiw-status-dot"></span>
                  {loading ? l.typing + '…' : l.online}
                </div>
              </div>
            </div>
            <div className="aiw-header-actions">
              {messages.length > 0 && (
                <button className="aiw-icon-btn" onClick={handleClear} title={l.clear} aria-label={l.clear}>
                  <Icon name="trash" size={18} />
                </button>
              )}
              <button className="aiw-icon-btn aiw-close-btn" onClick={() => setOpen(false)} title={l.close} aria-label={l.close}>
                <Icon name="close" size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="aiw-body" ref={scrollRef} onScroll={onBodyScroll} aria-busy={loading}>
            {messages.length === 0 ? (
              <div className="aiw-welcome">
                <div className="aiw-welcome-icon">
                  <Icon name="sparkle" size={34} strokeWidth={1.5} />
                </div>
                <div className="aiw-welcome-name">{l.botName}</div>
                <div className="aiw-welcome-tagline">{l.tagline}</div>
                <p className="aiw-welcome-text">{l.welcome}</p>
                <div className="aiw-suggestions">
                  {suggestions.map((s, i) => (
                    <button key={i} className="aiw-suggest" style={{ '--i': i }} onClick={() => sendMessage(s)}>
                      <Icon name="sparkle" size={16} className="aiw-suggest-icon" />
                      <span className="aiw-suggest-text">{s}</span>
                      <Icon name="arrow" size={16} className="aiw-suggest-arrow ui-flip-rtl" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Axında gələn cavab da eyni siyahının sonuncu elementidir (eyni key) —
                    bitəndə DOM dəyişmir, giriş animasiyası təkrarlanmır.
                    İlk tokenə qədər "yazır" nöqtələri, sonra mətn + yanıb-sönən kursor. */}
                {(loading ? [...messages, { role: 'assistant', pending: true, content: streamText || '' }] : messages).map((m, i) => (
                  <div key={i} className={`aiw-msg aiw-msg-${m.role}`}>
                    {m.role === 'assistant' && <div className="aiw-msg-avatar" aria-hidden="true"><Icon name="sparkle" size={15} /></div>}
                    {m.pending && !m.content ? (
                      <div className="aiw-bubble aiw-thinking" role="status" aria-label={l.typing}>
                        <span className="aiw-dot"></span>
                        <span className="aiw-dot"></span>
                        <span className="aiw-dot"></span>
                      </div>
                    ) : m.role === 'assistant' ? (
                      <div className="aiw-bubble aiw-md" dir="auto">
                        <AIMarkdown text={m.content} tail={m.pending ? <span className="ai-cursor" aria-hidden="true" /> : null} />
                      </div>
                    ) : (
                      <div className="aiw-bubble" dir="auto">{m.content}</div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          {cooldown > 0 && (
            <div className="aiw-cooldown">
              <div className="aiw-cooldown-icon" aria-hidden="true"><Icon name="clock" size={22} /></div>
              <div className="aiw-cooldown-text">
                {l.rateLimit.replace('{s}', cooldown)}
              </div>
              <div className="aiw-cooldown-ring">
                <svg viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" className="aiw-cooldown-bg" />
                  <circle
                    cx="18" cy="18" r="15"
                    className="aiw-cooldown-fg"
                    style={{ strokeDasharray: `${(cooldown / 30) * 94.2} 94.2` }}
                  />
                </svg>
                <span className="aiw-cooldown-num">{cooldown}</span>
              </div>
            </div>
          )}

          {cooldown === 0 && error && (
            <div className="aiw-error" role="alert">
              <Icon name="alert" size={16} /><span>{error}</span>
              {canRetry && (
                <button type="button" className="aiw-retry" onClick={retryLast}>
                  <Icon name="refresh" size={14} /> {l.retry}
                </button>
              )}
            </div>
          )}

          {/* Input */}
          <form className="aiw-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="aiw-input"
              placeholder={cooldown > 0 ? l.rateLimitShort.replace('{s}', cooldown) : l.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || cooldown > 0}
              maxLength={500}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              enterKeyHint="send"
              inputMode="text"
            />
            {loading ? (
              /* Cavab gəlir — "Dayandır" (AbortController) */
              <button type="button" className="aiw-send aiw-stop" onClick={stopStreaming} aria-label={l.stop} title={l.stop}>
                <span className="aiw-stop-sq" aria-hidden="true" />
              </button>
            ) : (
              <button type="submit" className="aiw-send" disabled={cooldown > 0 || !input.trim()} aria-label={SEND_LABEL[lang]}>
                {cooldown > 0 ? cooldown : <Icon name="send" size={18} className="ui-flip-rtl" />}
              </button>
            )}
          </form>

          <div className="aiw-disclaimer">{l.disclaimer}</div>
        </div>
      )}
    </>
  )
}
