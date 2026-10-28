// /api/ask-ai üçün saf köməkçilər — şəbəkə və sirr tələb etmir, ona görə
// ayrıca test olunur (tests/unit/ask-ai.test.js). server.js bunu istifadə edir.
'use strict'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models'

// Kontekst hədləri: son N mesaj və hər mesajın simvol həddi (lazımsız tokenlər yox)
const LIMITS = {
  historyMessages: 6,
  historyChars: 1200,
  messageChars: 1500,
  maxTokens: 1024,
}

// Vaxt aşımı: ilk tokenə (və ya JSON rejimində bütün cavaba) qədər
const TIMEOUTS = {
  firstTokenMs: 25000,
  idleMs: 15000,      // axında iki parça arasında
  totalMs: 90000,     // axının ümumi həddi
}

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const normLang = (lang) => (LANGS.includes(lang) ? lang : 'az')

// Dürüst, dilə uyğun xəta mesajları (klient göstərir; mobil data.error-u göstərir)
const ERRORS = {
  timeout: {
    az: 'Cavab çox gecikdi. Bir az sonra yenidən cəhd edin.',
    en: 'The answer took too long. Please try again in a moment.',
    ru: 'Ответ занял слишком много времени. Попробуйте ещё раз чуть позже.',
    ar: 'استغرق الرد وقتًا طويلًا. حاول مرة أخرى بعد قليل.',
    tr: 'Cevap çok gecikti. Lütfen biraz sonra tekrar deneyin.',
  },
  upstream: {
    az: 'AI xidməti hazırda cavab vermir. Bir az sonra yenidən cəhd edin.',
    en: 'The AI service is not responding right now. Please try again in a moment.',
    ru: 'Сервис ИИ сейчас не отвечает. Попробуйте ещё раз чуть позже.',
    ar: 'خدمة الذكاء الاصطناعي لا تستجيب الآن. حاول مرة أخرى بعد قليل.',
    tr: 'AI hizmeti şu anda yanıt vermiyor. Lütfen biraz sonra tekrar deneyin.',
  },
  empty: {
    az: 'AI boş cavab qaytardı. Sualı yenidən göndərin.',
    en: 'The AI returned an empty answer. Please send the question again.',
    ru: 'ИИ вернул пустой ответ. Отправьте вопрос ещё раз.',
    ar: 'أعاد الذكاء الاصطناعي ردًا فارغًا. أرسل السؤال مرة أخرى.',
    tr: 'Yapay zekâ boş bir cevap döndürdü. Soruyu tekrar gönderin.',
  },
  bad_request: {
    az: 'Sual boşdur.',
    en: 'The question is empty.',
    ru: 'Вопрос пустой.',
    ar: 'السؤال فارغ.',
    tr: 'Soru boş.',
  },
}
const errorText = (code, lang) => (ERRORS[code] || ERRORS.upstream)[normLang(lang)]

// Klient axın istəyirmi? body.stream === true və ya Accept: text/event-stream.
// Heç biri yoxdursa — köhnə JSON cavabı (mobil tətbiq belə işləyir).
function wantsStream(body, acceptHeader) {
  if (body && body.stream === true) return true
  return /\btext\/event-stream\b/i.test(String(acceptHeader || ''))
}

// Sistem promptu + son N mesaj (client history-nin sonuncusu cari sualdır) + cari sual
function buildMessages({ message, history, lang, prompts }) {
  const sys = prompts[normLang(lang)] || prompts.az
  const msgs = [{ role: 'system', content: sys }]
  const list = Array.isArray(history) ? history : []
  const prev = list.slice(0, -1).slice(-LIMITS.historyMessages)
  for (const m of prev) {
    if (m && (m.role === 'user' || m.role === 'assistant')) {
      const content = String(m.content || '').trim().slice(0, LIMITS.historyChars)
      if (content) msgs.push({ role: m.role, content })
    }
  }
  msgs.push({ role: 'user', content: String(message).slice(0, LIMITS.messageChars) })
  return msgs
}

// Reasoning ("düşünmə") parametrini modelə görə seç — mümkün qədər az.
// Forma (https://openrouter.ai/docs/use-cases/reasoning-tokens):
//   reasoning: { effort: "none"|"minimal"|"low"|..., exclude: true } və ya { enabled: false }
// meta — OpenRouter /api/v1/models-dəki modelin `reasoning` sahəsi:
//   { mandatory, supported_efforts, default_effort } (bilinmirsə null)
// override — OPENROUTER_REASONING env: off (parametr göndərmə) | none | minimal | low | medium | high
function pickReasoning(model, meta, override) {
  const ov = String(override || '').trim().toLowerCase()
  if (ov === 'off') return undefined
  if (['none', 'minimal', 'low', 'medium', 'high'].includes(ov)) {
    return ov === 'none' ? { effort: 'none', exclude: true } : { effort: ov, exclude: true }
  }

  if (meta && typeof meta === 'object') {
    const efforts = Array.isArray(meta.supported_efforts) ? meta.supported_efforts : null
    if (!meta.mandatory) {
      // Söndürmək olar: effort seçimi varsa "none", yoxdursa (Gemini 2.5 Flash) enabled:false
      if (efforts && !efforts.includes('none')) {
        const low = ['minimal', 'low'].find(e => efforts.includes(e))
        return { effort: low || 'low', exclude: true }
      }
      return efforts ? { effort: 'none', exclude: true } : { enabled: false, exclude: true }
    }
    // Məcburi düşünən model: ən aşağı səviyyə ("none" göndərmək olmaz — 400 verir)
    const low = efforts ? ['minimal', 'low'].find(e => efforts.includes(e)) : null
    return { effort: low || 'low', exclude: true }
  }

  // Meta hələ yüklənməyib — model adına görə ehtiyatlı təxmin
  const id = String(model || '').toLowerCase()
  if (/gemini-2\.5-flash/.test(id)) return { enabled: false, exclude: true }
  return { effort: 'low', exclude: true }
}

function buildOpenRouterBody({ model, messages, stream = false, reasoning, maxTokens = LIMITS.maxTokens }) {
  const body = { model, messages, max_tokens: maxTokens }
  if (reasoning) body.reasoning = reasoning
  if (stream) body.stream = true
  return body
}

// OpenRouter SSE axınını təhlil edir: "data: {...}" sətirləri, ": OPENROUTER PROCESSING"
// şərhləri (atılır), "data: [DONE]" sonu. Parçalar sətrin ortasında kəsilə bilər.
// onEvent({ delta?, error?, finish?, done? })
function createSSEParser(onEvent) {
  let buf = ''
  const handleLine = (raw) => {
    const line = raw.replace(/\r$/, '')
    if (!line || line.startsWith(':')) return
    if (!line.startsWith('data:')) return
    const data = line.slice(5).trim()
    if (!data) return
    if (data === '[DONE]') { onEvent({ done: true }); return }
    let obj
    try { obj = JSON.parse(data) } catch { return }
    onEvent(parseChunk(obj))
  }
  return {
    push(text) {
      buf += text
      let i
      while ((i = buf.indexOf('\n')) >= 0) {
        handleLine(buf.slice(0, i))
        buf = buf.slice(i + 1)
      }
    },
    end() {
      if (buf) { handleLine(buf); buf = '' }
    },
  }
}

// Bir chat.completion.chunk obyektindən mətn / xəta / son
function parseChunk(obj) {
  const out = {}
  if (obj && obj.error) out.error = String(obj.error.message || obj.error.code || 'error')
  const ch = obj && Array.isArray(obj.choices) ? obj.choices[0] : null
  if (ch) {
    const c = ch.delta && typeof ch.delta.content === 'string' ? ch.delta.content : ''
    if (c) out.delta = c
    if (ch.finish_reason) {
      out.finish = ch.finish_reason
      if (ch.finish_reason === 'error' && !out.error) out.error = 'error'
    }
  }
  return out
}

// Klientə göndərilən SSE hadisəsi (öz sadə formatımız)
const sseEvent = (obj) => `data: ${JSON.stringify(obj)}\n\n`

module.exports = {
  OPENROUTER_URL, OPENROUTER_MODELS_URL, LIMITS, TIMEOUTS, ERRORS,
  normLang, errorText, wantsStream, buildMessages, pickReasoning,
  buildOpenRouterBody, createSSEParser, parseChunk, sseEvent,
}
