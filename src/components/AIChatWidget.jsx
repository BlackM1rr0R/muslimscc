import { useState, useRef, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import '../styles/AIChatWidget.css'

const API_URL = import.meta.env.VITE_API_URL || ''
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

const LABELS = {
  az: {
    botName:'MuslimAI',
    tagline:'İslami AI köməkçi',
    placeholder:'Sualınızı yazın...',
    welcome:'Salam aleykum! Mən MuslimAI — sizin İslami köməkçinizəm. Quran, hədis, namaz, dua haqqında soruşa bilərsiniz.',
    suggest1:'Namaz necə qılınır?',
    suggest2:'Səbr haqqında hədis',
    suggest3:'Ən fəzilətli dua hansıdır?',
    suggest4:'Tövhid nədir?',
    disclaimer:'AI cavablar məlumat üçündür. Allah daha yaxşı bilir.',
    online:'Onlayn',
    typing:'Yazır',
    error:'Xəta. Yenidən cəhd edin.',
    clear:'Təmizlə',
    minimize:'Kiçilt',
    close:'Bağla',
    open:'MuslimAI ilə danış',
    noBackend:'AI xidməti hələ qurulmayıb',
  },
  en: {
    botName:'MuslimAI',
    tagline:'Islamic AI assistant',
    placeholder:'Type your question...',
    welcome:'Assalamu alaikum! I am MuslimAI — your Islamic assistant. You can ask about Quran, Hadith, prayer, duas.',
    suggest1:'How to pray?',
    suggest2:'Hadith about patience',
    suggest3:'Most virtuous dua?',
    suggest4:'What is Tawheed?',
    disclaimer:'AI answers are informational. Allah knows best.',
    online:'Online',
    typing:'Typing',
    error:'Error. Try again.',
    clear:'Clear',
    minimize:'Minimize',
    close:'Close',
    open:'Chat with MuslimAI',
    noBackend:'AI service not configured',
  },
  ru: {
    botName:'MuslimAI',
    tagline:'Исламский AI помощник',
    placeholder:'Напишите вопрос...',
    welcome:'Ас-саляму алейкум! Я MuslimAI — ваш исламский помощник. Спрашивайте о Коране, хадисах, намазе, дуа.',
    suggest1:'Как совершать намаз?',
    suggest2:'Хадис о терпении',
    suggest3:'Лучшая дуа?',
    suggest4:'Что такое Таухид?',
    disclaimer:'Ответы AI — информационные. Аллах знает лучше.',
    online:'Онлайн',
    typing:'Пишет',
    error:'Ошибка. Попробуйте снова.',
    clear:'Очистить',
    minimize:'Свернуть',
    close:'Закрыть',
    open:'Чат с MuslimAI',
    noBackend:'AI сервис не настроен',
  },
  ar: {
    botName:'MuslimAI',
    tagline:'مساعد ذكاء اصطناعي إسلامي',
    placeholder:'اكتب سؤالك...',
    welcome:'السلام عليكم! أنا MuslimAI — مساعدك الإسلامي. اسألني عن القرآن، الحديث، الصلاة، الأدعية.',
    suggest1:'كيف أصلي؟',
    suggest2:'حديث عن الصبر',
    suggest3:'أفضل دعاء؟',
    suggest4:'ما هو التوحيد؟',
    disclaimer:'إجابات AI للمعلومات. والله أعلم.',
    online:'متصل',
    typing:'يكتب',
    error:'خطأ. حاول مرة أخرى.',
    clear:'مسح',
    minimize:'تصغير',
    close:'إغلاق',
    open:'الدردشة مع MuslimAI',
    noBackend:'خدمة AI غير مكونة',
  },
  tr: {
    botName:'MuslimAI',
    tagline:'İslami AI asistan',
    placeholder:'Sorunuzu yazın...',
    welcome:'Selamün aleyküm! Ben MuslimAI — İslami asistanınız. Kuran, hadis, namaz, dua hakkında sorabilirsiniz.',
    suggest1:'Namaz nasıl kılınır?',
    suggest2:'Sabırla ilgili hadis',
    suggest3:'En faziletli dua?',
    suggest4:'Tevhid nedir?',
    disclaimer:'AI cevapları bilgi içindir. Allah daha iyi bilir.',
    online:'Çevrimiçi',
    typing:'Yazıyor',
    error:'Hata. Tekrar deneyin.',
    clear:'Temizle',
    minimize:'Küçült',
    close:'Kapat',
    open:'MuslimAI ile sohbet',
    noBackend:'AI servisi yapılandırılmamış',
  },
}

export default function AIChatWidget() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [open, setOpen] = useState(false)
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
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)) } catch {}
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (open) {
      setHasUnread(false)
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open])

  // Bağlandıqda Escape ilə kapatma
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const sendMessage = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    if (!API_URL) { setError(l.noBackend); return }

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
      if (!open) setHasUnread(true)
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
    <>
      {/* FAB (floating action button) */}
      {!open && (
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
          <span className="aiw-fab-label">{l.botName}</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="aiw-panel" role="dialog" aria-label={l.botName}>
          {/* Header */}
          <div className="aiw-header">
            <div className="aiw-header-info">
              <div className="aiw-avatar">
                <AIIcon size={24} />
                <span className="aiw-avatar-status"></span>
              </div>
              <div>
                <div className="aiw-name">{l.botName}</div>
                <div className="aiw-status">
                  <span className="aiw-status-dot"></span>
                  {loading ? l.typing + '...' : l.online}
                </div>
              </div>
            </div>
            <div className="aiw-header-actions">
              {messages.length > 0 && (
                <button className="aiw-icon-btn" onClick={handleClear} title={l.clear} aria-label={l.clear}>
                  🗑️
                </button>
              )}
              <button className="aiw-icon-btn" onClick={() => setOpen(false)} title={l.close} aria-label={l.close}>
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="aiw-body" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="aiw-welcome">
                <div className="aiw-welcome-icon">
                  <AIIcon size={64} />
                </div>
                <div className="aiw-welcome-name">{l.botName}</div>
                <div className="aiw-welcome-tagline">{l.tagline}</div>
                <p className="aiw-welcome-text">{l.welcome}</p>
                <div className="aiw-suggestions">
                  {suggestions.map((s, i) => (
                    <button key={i} className="aiw-suggest" onClick={() => sendMessage(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <div key={i} className={`aiw-msg aiw-msg-${m.role}`}>
                    {m.role === 'assistant' && <div className="aiw-msg-avatar"><AIIcon size={16} /></div>}
                    <div className="aiw-bubble">{m.content}</div>
                  </div>
                ))}
                {loading && (
                  <div className="aiw-msg aiw-msg-assistant">
                    <div className="aiw-msg-avatar"><AIIcon size={16} /></div>
                    <div className="aiw-bubble aiw-thinking">
                      <span className="aiw-dot"></span>
                      <span className="aiw-dot"></span>
                      <span className="aiw-dot"></span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {error && <div className="aiw-error">⚠️ {error}</div>}

          {/* Input */}
          <form className="aiw-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="aiw-input"
              placeholder={l.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              maxLength={500}
            />
            <button type="submit" className="aiw-send" disabled={loading || !input.trim()} aria-label="send">
              {loading ? '⏳' : '➤'}
            </button>
          </form>

          <div className="aiw-disclaimer">{l.disclaimer}</div>
        </div>
      )}
    </>
  )
}
