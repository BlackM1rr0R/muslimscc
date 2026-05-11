import { useState, useRef, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { checkRateLimit, recordMessage, getActiveCooldown } from '../utils/rateLimit'
import '../styles/AIChatPage.css'

const API_URL = import.meta.env.VITE_API_URL || ''

const LABELS = {
  az: {
    title:'İslami AI Köməkçi',
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
    disclaimer:'⚠️ AI cavabları məlumat üçündür. Mühüm məsələlərdə alimə müraciət edin.',
    error:'Xəta baş verdi. Yenidən cəhd edin.',
    noBackend:'AI xidməti hələ qurulmayıb',
    rateLimit:'Çox sürətli yazırsınız. Zəhmət olmasa gözləyin, {s} saniyə sonra yenidən cəhd edin.',
    rateLimitShort:'Gözləyin... {s}s',
  },
  en: {
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
    disclaimer:'⚠️ AI answers are informational. Consult a scholar for important matters.',
    error:'An error occurred. Please try again.',
    noBackend:'AI service is not yet configured',
    rateLimit:'You are sending too fast. Please wait — try again in {s} seconds.',
    rateLimitShort:'Wait... {s}s',
  },
  ru: {
    title:'Исламский AI помощник',
    subtitle:'Ответы на основе Корана и Хадисов',
    placeholder:'Напишите свой вопрос... (напр. "Хадис о терпении")',
    send:'Отправить',
    thinking:'Думаю...',
    welcome:'Ас-саляму алейкум! Я ваш исламский AI помощник. Можете задавать вопросы о Коране, хадисах, фикхе и акыде.',
    suggest1:'Как научиться совершать намаз?',
    suggest2:'Хадисы о терпении',
    suggest3:'Каковы основы Таухида?',
    suggest4:'Какие дуа самые добродетельные?',
    clear:'Очистить чат',
    disclaimer:'⚠️ Ответы AI информативны. По важным вопросам консультируйтесь с учёным.',
    error:'Произошла ошибка. Попробуйте снова.',
    noBackend:'AI сервис ещё не настроен',
    rateLimit:'Вы пишете слишком быстро. Пожалуйста, подождите — попробуйте через {s} сек.',
    rateLimitShort:'Подождите... {s}с',
  },
  ar: {
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
    disclaimer:'⚠️ إجابات الذكاء الاصطناعي للمعلومات. استشر عالماً للأمور المهمة.',
    error:'حدث خطأ. حاول مرة أخرى.',
    noBackend:'خدمة AI غير مكونة بعد',
    rateLimit:'تكتب بسرعة كبيرة. يُرجى الانتظار — حاول مرة أخرى بعد {s} ثانية.',
    rateLimitShort:'انتظر... {s} ث',
  },
  tr: {
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
    disclaimer:'⚠️ AI cevapları bilgi amaçlıdır. Önemli konularda âlime danışın.',
    error:'Hata oluştu. Tekrar deneyin.',
    noBackend:'AI servisi henüz yapılandırılmadı',
    rateLimit:'Çok hızlı yazıyorsunuz. Lütfen {s} saniye bekleyin ve tekrar deneyin.',
    rateLimitShort:'Bekleyin... {s}s',
  },
}

const STORAGE_KEY = 'muslim_cc_ai_chat'

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
  const [cooldown, setCooldown] = useState(0)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)) } catch {}
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Check existing cooldown on mount
  useEffect(() => {
    const remaining = getActiveCooldown()
    if (remaining > 0) setCooldown(remaining)
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

  const sendMessage = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || loading || cooldown > 0) return
    if (!API_URL) {
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
    setInput('')
    const userMessage = { role:'user', content: msg, time: Date.now() }
    const updated = [...messages, userMessage]
    setMessages(updated)
    setLoading(true)
    recordMessage()

    try {
      const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/ask-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: updated.slice(-10).map(m => ({ role: m.role, content: m.content })),
          lang,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'API error')

      setMessages([...updated, { role:'assistant', content: data.reply, time: Date.now() }])
    } catch (e) {
      setError(`${l.error} (${e.message})`)
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage()
  }

  const handleClear = () => {
    setMessages([])
    localStorage.removeItem(STORAGE_KEY)
  }

  const suggestions = [l.suggest1, l.suggest2, l.suggest3, l.suggest4]

  return (
    <div className="ai-chat-page">

      {/* Hero */}
      <div className="page-hero theme-quran">
        <div className="page-hero-arabic">المُسَاعِدُ الإِسْلَامِيُّ</div>
        <h1>🤖 {l.title}</h1>
        <p>{l.subtitle}</p>
      </div>

      <div className="aic-container">

        {/* Chat window */}
        <div className="aic-chat" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="aic-welcome">
              <div className="aic-welcome-icon">🌙</div>
              <p className="aic-welcome-text">{l.welcome}</p>
              <div className="aic-suggestions">
                {suggestions.map((s, i) => (
                  <button key={i} className="aic-suggest-btn" onClick={() => sendMessage(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <div key={i} className={`aic-msg aic-msg-${m.role}`}>
                  {m.role === 'assistant' && <div className="aic-avatar">🌙</div>}
                  <div className="aic-bubble">
                    <div className="aic-content">{m.content}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="aic-msg aic-msg-assistant">
                  <div className="aic-avatar">🌙</div>
                  <div className="aic-bubble aic-thinking">
                    <span className="aic-dot"></span>
                    <span className="aic-dot"></span>
                    <span className="aic-dot"></span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Cooldown / Error */}
        {cooldown > 0 ? (
          <div className="aic-cooldown">
            <div className="aic-cooldown-icon">⏳</div>
            <div className="aic-cooldown-text">{l.rateLimit.replace('{s}', cooldown)}</div>
            <div className="aic-cooldown-ring">
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
          error && <div className="aic-error">⚠️ {error}</div>
        )}

        {/* Input form */}
        <form className="aic-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="aic-input"
            placeholder={cooldown > 0 ? l.rateLimitShort.replace('{s}', cooldown) : l.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || cooldown > 0}
            autoFocus
          />
          <button type="submit" className="aic-send-btn" disabled={loading || cooldown > 0 || !input.trim()}>
            {loading ? '⏳' : cooldown > 0 ? cooldown : '➤'}
          </button>
        </form>

        {/* Actions */}
        <div className="aic-actions">
          {messages.length > 0 && (
            <button onClick={handleClear} className="aic-clear-btn">
              🗑️ {l.clear}
            </button>
          )}
        </div>

        <p className="aic-disclaimer">{l.disclaimer}</p>
      </div>
    </div>
  )
}
