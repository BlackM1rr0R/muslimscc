import { useState, useRef, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { checkRateLimit, recordMessage, getActiveCooldown } from '../utils/rateLimit'
import { subscribeToSettings } from '../data/adminContent'
import { BRAND, tr } from '../config/brand'
import Icon from '../components/Icon'
import AIMarkdown from '../components/AIMarkdown'
import { askAI } from '../utils/aiStream'
import '../styles/AIChatPage.css'

// URL prioritet: Firebase Settings.apiUrl > VITE_API_URL > ''
const FALLBACK_API_URL = import.meta.env.VITE_API_URL || ''

const LABELS = {
  az: {
    retry:'Yenidən göndər',
    stop:'Dayandır',
    timeout:'Cavab çox gecikdi. Yenidən cəhd edin.',
    offline:'AI xidməti hazırda cavab vermir. Bir az sonra yenidən cəhd edin.',
    eyebrow:'Quran və Sünnə əsasında',
    you:'Siz',
    title:'İslami AI köməkçi',
    subtitle:'Quran və hədis əsasında suallarınızın cavabı',
    placeholder:'Sualınızı yazın... (məs. "Səbr haqqında hədis")',
    send:'Göndər',
    thinking:'Düşünür...',
    welcome:'Salam aleykum! Mən sizin İslami AI köməkçinizəm. Quran, hədis, fiqh və əqidə haqqında suallar verə bilərsiniz.',
    suggest1:'Namaz qılmaq necə öyrənilir?',
    suggest2:'Səbr haqqında hədislər',
    suggest3:'Tövhidin əsasları nədir?',
    suggest4:'Ən fəzilətli dualar hansılardır?',
    clear:'Söhbəti təmizlə',
    error:'Xəta baş verdi. Yenidən cəhd edin.',
    noBackend:'AI xidməti hələ qurulmayıb',
    rateLimit:'Çox sürətli yazırsınız. Zəhmət olmasa gözləyin, {s} saniyə sonra yenidən cəhd edin.',
    rateLimitShort:'Gözləyin... {s}s',
  },
  en: {
    retry:'Send again',
    stop:'Stop',
    timeout:'The answer took too long. Please try again.',
    offline:'The AI service is not responding right now. Please try again in a moment.',
    eyebrow:'Grounded in the Quran and Sunnah',
    you:'You',
    title:'Islamic AI Assistant',
    subtitle:'Answers based on Quran and Hadith',
    placeholder:'Type your question... (e.g. "Hadith about patience")',
    send:'Send',
    thinking:'Thinking...',
    welcome:'Assalamu alaikum! I am your Islamic AI assistant. You can ask questions about Quran, Hadith, Fiqh and Aqidah.',
    suggest1:'How to learn to pray?',
    suggest2:'Hadiths about patience',
    suggest3:'What are the foundations of Tawheed?',
    suggest4:'What are the most virtuous duas?',
    clear:'Clear chat',
    error:'An error occurred. Please try again.',
    noBackend:'AI service is not yet configured',
    rateLimit:'You are sending too fast. Please wait — try again in {s} seconds.',
    rateLimitShort:'Wait... {s}s',
  },
  ru: {
    retry:'Отправить снова',
    stop:'Остановить',
    timeout:'Ответ занял слишком много времени. Попробуйте ещё раз.',
    offline:'Сервис ИИ сейчас не отвечает. Попробуйте ещё раз чуть позже.',
    eyebrow:'На основе Корана и Сунны',
    you:'Вы',
    title:'Исламский ИИ-помощник',
    subtitle:'Ответы на основе Корана и Хадисов',
    placeholder:'Напишите свой вопрос... (напр. "Хадис о терпении")',
    send:'Отправить',
    thinking:'Думаю...',
    welcome:'Ас-саляму алейкум! Я ваш исламский ИИ-помощник. Можете задавать вопросы о Коране, хадисах, фикхе и акыде.',
    suggest1:'Как научиться совершать намаз?',
    suggest2:'Хадисы о терпении',
    suggest3:'Каковы основы Таухида?',
    suggest4:'Какие дуа самые добродетельные?',
    clear:'Очистить чат',
    error:'Произошла ошибка. Попробуйте снова.',
    noBackend:'Сервис ИИ ещё не настроен',
    rateLimit:'Вы пишете слишком быстро. Пожалуйста, подождите — попробуйте через {s} сек.',
    rateLimitShort:'Подождите... {s}с',
  },
  ar: {
    retry:'أعد الإرسال',
    stop:'إيقاف',
    timeout:'استغرق الرد وقتًا طويلًا. حاول مرة أخرى.',
    offline:'خدمة الذكاء الاصطناعي لا تستجيب الآن. حاول مرة أخرى بعد قليل.',
    eyebrow:'استنادًا إلى القرآن والسنة',
    you:'أنت',
    title:'مساعد إسلامي بالذكاء الاصطناعي',
    subtitle:'إجابات مبنية على القرآن والحديث',
    placeholder:'اكتب سؤالك... (مثلاً "حديث عن الصبر")',
    send:'إرسال',
    thinking:'يفكر...',
    welcome:'السلام عليكم! أنا مساعدك الإسلامي بالذكاء الاصطناعي. يمكنك طرح أسئلة عن القرآن والحديث والفقه والعقيدة.',
    suggest1:'كيف أتعلم الصلاة؟',
    suggest2:'أحاديث عن الصبر',
    suggest3:'ما أسس التوحيد؟',
    suggest4:'ما أفضل الأدعية؟',
    clear:'مسح المحادثة',
    error:'حدث خطأ. حاول مرة أخرى.',
    noBackend:'خدمة AI غير مكونة بعد',
    rateLimit:'تكتب بسرعة كبيرة. يُرجى الانتظار — حاول مرة أخرى بعد {s} ثانية.',
    rateLimitShort:'انتظر... {s} ث',
  },
  tr: {
    retry:'Tekrar gönder',
    stop:'Durdur',
    timeout:'Cevap çok gecikti. Lütfen tekrar deneyin.',
    offline:'AI hizmeti şu anda yanıt vermiyor. Lütfen biraz sonra tekrar deneyin.',
    eyebrow:'Kuran ve Sünnet temelinde',
    you:'Siz',
    title:'İslami AI Asistan',
    subtitle:'Kuran ve Hadis temelli cevaplar',
    placeholder:'Sorunuzu yazın... (örn. "Sabırla ilgili hadis")',
    send:'Gönder',
    thinking:'Düşünüyor...',
    welcome:'Selamün aleyküm! Ben İslami AI asistanınızım. Kuran, hadis, fıkıh ve akide hakkında sorular sorabilirsiniz.',
    suggest1:'Namaz kılmayı nasıl öğrenirim?',
    suggest2:'Sabırla ilgili hadisler',
    suggest3:'Tevhidin esasları nelerdir?',
    suggest4:'En faziletli dualar hangileri?',
    clear:'Sohbeti temizle',
    error:'Hata oluştu. Tekrar deneyin.',
    noBackend:'AI servisi henüz yapılandırılmadı',
    rateLimit:'Çok hızlı yazıyorsunuz. Lütfen {s} saniye bekleyin ve tekrar deneyin.',
    rateLimitShort:'Bekleyin... {s}s',
  },
}

const STORAGE_KEY = 'muslim_cc_ai_chat'

// Təkliflərin xətti ikonları (Icon.jsx) — namaz, hədis, tövhid, dua
const SUGGEST_ICONS = ['prayer', 'hadith', 'names', 'duas']

export default function AIChatPage({ setPage }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

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
  // Son göndərmə alınmadı — "Yenidən göndər" düyməsi görünür
  const [failed, setFailed] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [apiUrl, setApiUrl] = useState(FALLBACK_API_URL)
  // Axında gələn (hələ bitməmiş) cavab; null — axın yoxdur
  const [streamText, setStreamText] = useState(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)
  // İstifadəçi aşağıdadırsa yeni mətnlə aşağıda qal; yuxarı sürüşdürübsə — məcbur etmə
  const stickRef = useRef(true)

  // Səhifədən çıxanda yarımçıq sorğunu kəs
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

  useEffect(() => {
    const el = scrollRef.current
    if (el && stickRef.current) el.scrollTop = el.scrollHeight
  }, [messages, streamText, loading])

  // Yalnız istifadəçi YUXARI sürüşdürəndə "yapışmanı" burax (hamar avtomatik
  // sürüşmə scrollTop-u azaltmır); yenidən aşağı enəndə qayıt
  const lastTopRef = useRef(0)
  const onChatScroll = () => {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) stickRef.current = true
    else if (el.scrollTop < lastTopRef.current - 2) stickRef.current = false
    lastTopRef.current = el.scrollTop
  }

  // Check existing cooldown on mount
  useEffect(() => {
    const remaining = getActiveCooldown()
    if (remaining > 0) setCooldown(remaining)
  }, [])

  // Avtofokus YALNIZ siçanlı cihazda və səhifəni sürüşdürmədən:
  // əvvəlki autoFocus telefonda səhifəni ~370px aşağı atır, klaviaturanı
  // açıb hero-nu və təklifləri gizlədirdi
  useEffect(() => {
    try {
      if (window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) {
        inputRef.current?.focus({ preventScroll: true })
      }
    } catch {}
  }, [])

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

  // base — mesajın əlavə olunacağı söhbət (təkrar cəhddə son sual çıxarılır)
  const sendMessage = async (text, base = messages) => {
    const msg = (text ?? input).trim()
    if (!msg || loading || cooldown > 0) return
    if (!apiUrl) {
      setError(l.noBackend)
      return
    }

    // Rate limit
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
    const userMessage = { role:'user', content: msg, time: Date.now() }
    const updated = [...base, userMessage]
    setMessages(updated)
    setLoading(true)
    setStreamText(null)
    stickRef.current = true
    recordMessage()

    const ac = new AbortController()
    abortRef.current = ac
    try {
      // Server son 6 mesajı götürür (+ cari sual) — artığını göndərməyə dəyməz
      const reply = await askAI({
        apiUrl,
        message: msg,
        history: updated.slice(-7).map(m => ({ role: m.role, content: m.content })),
        lang,
        signal: ac.signal,
        onDelta: (t) => setStreamText(t),
      })
      setMessages([...updated, { role:'assistant', content: reply, time: Date.now() }])
    } catch (e) {
      if (e?.code === 'aborted') {
        // "Dayandır" — gəlmiş hissə söhbətdə qalsın
        if (e.partial?.trim()) setMessages([...updated, { role:'assistant', content: e.partial.trim(), time: Date.now() }])
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

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage()
  }

  const handleClear = () => {
    setMessages([])
    setError('')
    setFailed(false)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  // Son (cavabsız) sualı yenidən göndər — söhbətdə təkrarlanmasın
  const retryLast = () => {
    const last = messages[messages.length - 1]
    if (!last || last.role !== 'user') return
    sendMessage(last.content, messages.slice(0, -1))
  }
  const canRetry = failed && messages.length > 0 && messages[messages.length - 1].role === 'user'

  const suggestions = [l.suggest1, l.suggest2, l.suggest3, l.suggest4]

  return (
    <div className="ai-chat-page">

      {/* Hero — yığcam, söhbətə yer qalsın */}
      <header className="ui-page-hero aic-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container aic-hero-in">
          <span className="ui-eyebrow">{l.eyebrow}</span>
          <h1 className="ui-display">{l.title}</h1>
          <p className="ui-lead">{l.subtitle}</p>
        </div>
      </header>

      <div className="aic-container">

        {/* Söhbət pəncərəsi */}
        <section className="aic-chat-card" aria-label={l.title}>
          <div className="aic-chat-head">
            <span className="aic-avatar aic-avatar--lg" aria-hidden="true"><Icon name="aichat" size={20} /></span>
            <div className="aic-chat-id">
              <span className="aic-chat-name"><span className="aic-status-dot" aria-hidden="true" /> {tr(BRAND.aiName, lang)}</span>
            </div>
            {messages.length > 0 && (
              <button type="button" onClick={handleClear} className="ui-btn ui-btn--ghost ui-btn--sm aic-clear-btn">
                <Icon name="trash" size={16} className="ui-btn__icon" /> {l.clear}
              </button>
            )}
          </div>

          <div className="aic-chat" ref={scrollRef} onScroll={onChatScroll} role="log" aria-live="polite" aria-busy={loading}>
            {messages.length === 0 ? (
              <div className="aic-welcome">
                <div className="aic-welcome-art" aria-hidden="true">
                  <span className="aic-welcome-ring" />
                  <span className="aic-avatar aic-avatar--xl"><Icon name="aichat" size={30} strokeWidth={1.6} /></span>
                </div>
                <p className="aic-welcome-text">{l.welcome}</p>
                <div className="aic-suggestions">
                  {suggestions.map((s, i) => (
                    <button key={i} type="button" className="aic-suggest-btn" style={{ '--i': i }} onClick={() => sendMessage(s)}>
                      <span className="ui-icon-tile ui-icon-tile--sm aic-suggest-ico" aria-hidden="true"><Icon name={SUGGEST_ICONS[i]} /></span>
                      <span className="aic-suggest-text">{s}</span>
                      <Icon name="arrow" size={16} className="aic-suggest-chev ui-flip-rtl" />
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
                  m.pending && !m.content ? (
                    <div key={i} className="aic-msg aic-msg-assistant aic-msg-typing">
                      <span className="aic-avatar" aria-hidden="true"><Icon name="aichat" size={16} /></span>
                      <div className="aic-bubble aic-thinking" role="status">
                        <span className="ui-sr-only">{l.thinking}</span>
                        <span className="aic-dot" aria-hidden="true"></span>
                        <span className="aic-dot" aria-hidden="true"></span>
                        <span className="aic-dot" aria-hidden="true"></span>
                      </div>
                    </div>
                  ) : (
                    <div key={i} className={`aic-msg aic-msg-${m.role}`}>
                      {m.role === 'assistant' && <span className="aic-avatar" aria-hidden="true"><Icon name="aichat" size={16} /></span>}
                      <div className="aic-bubble">
                        <span className="ui-sr-only">{m.role === 'assistant' ? tr(BRAND.aiName, lang) : l.you}: </span>
                        <div className="aic-content">
                          {m.role === 'assistant'
                            ? <AIMarkdown text={m.content} tail={m.pending ? <span className="ai-cursor" aria-hidden="true" /> : null} />
                            : m.content}
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </>
            )}
          </div>
        </section>

        {/* Gözləmə / xəta */}
        {cooldown > 0 ? (
          <div className="aic-cooldown" role="status">
            <span className="aic-cooldown-icon" aria-hidden="true"><Icon name="clock" size={22} /></span>
            <div className="aic-cooldown-text">{l.rateLimit.replace('{s}', cooldown)}</div>
            <div className="aic-cooldown-ring" aria-hidden="true">
              <svg viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" className="aic-cooldown-bg" />
                <circle
                  cx="18" cy="18" r="15"
                  className="aic-cooldown-fg"
                  style={{ strokeDasharray: `${(cooldown / 30) * 94.2} 94.2` }}
                />
              </svg>
              <span className="aic-cooldown-num">{cooldown}</span>
            </div>
          </div>
        ) : (
          error && (
            <div className="aic-error" role="alert">
              <Icon name="alert" size={18} />
              <span className="aic-error-text">{error}</span>
              {canRetry && (
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm aic-retry" onClick={retryLast}>
                  <Icon name="refresh" size={16} className="ui-btn__icon" /> {l.retry}
                </button>
              )}
            </div>
          )
        )}

        {/* Yazı sahəsi */}
        <form className="aic-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="aic-input"
            placeholder={cooldown > 0 ? l.rateLimitShort.replace('{s}', cooldown) : l.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || cooldown > 0}
            aria-label={l.placeholder}
            enterKeyHint="send"
          />
          {loading ? (
            /* Cavab gəlir — "Dayandır" (AbortController) */
            <button type="button" className="aic-send-btn aic-stop-btn" onClick={stopStreaming} aria-label={l.stop} title={l.stop}>
              <span className="aic-stop-sq" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              className="aic-send-btn"
              disabled={cooldown > 0 || !input.trim()}
              aria-label={l.send}
            >
              {cooldown > 0 ? (
                <span className="ui-num">{cooldown}</span>
              ) : (
                /* Göndər ikonu — ərəbcədə güzgülənir (sahəyə tərəf baxsın) */
                <Icon name="send" size={20} strokeWidth={2} className="aic-send-icon" />
              )}
            </button>
          )}
        </form>

        {/* Xəbərdarlıq — AI cavabları fətva deyil (BRAND.aiDisclaimer) */}
        <p className="aic-disclaimer"><Icon name="shield" size={16} /> <span>{tr(BRAND.aiDisclaimer, lang)}</span></p>
      </div>
    </div>
  )
}
