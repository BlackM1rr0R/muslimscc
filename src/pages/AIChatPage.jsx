import { useState, useRef, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
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
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)) } catch {}
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    if (!API_URL) {
      setError(l.noBackend)
      return
    }

    setError('')
    setInput('')
    const userMessage = { role:'user', content: msg, time: Date.now() }
    const updated = [...messages, userMessage]
    setMessages(updated)
    setLoading(true)

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

        {/* Error */}
        {error && <div className="aic-error">⚠️ {error}</div>}

        {/* Input form */}
        <form className="aic-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="aic-input"
            placeholder={l.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <button type="submit" className="aic-send-btn" disabled={loading || !input.trim()}>
            {loading ? '⏳' : '➤'}
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
