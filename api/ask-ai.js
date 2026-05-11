// ═══════════════════════════════════════════════════════
// VERCEL SERVERLESS FUNCTION — Islamic Q&A AI
// ═══════════════════════════════════════════════════════
// Endpoint: POST /api/ask-ai
// Body: { message: string, history: [{role, content}], lang: 'az'|'en'|'ru'|'ar'|'tr' }
// Response: { reply: string }
//
// Setup:
//   1. Vercel → Settings → Environment Variables
//      GEMINI_API_KEY  =  (from https://aistudio.google.com/app/apikey)
//      ALLOWED_ORIGIN  =  https://muslims.cc  (your frontend domain)
//   2. Deploy
// ═══════════════════════════════════════════════════════

const SYSTEM_PROMPTS = {
  az: `Sən muslims.cc saytı üçün İslami AI köməkçisən. Vəzifən:

1. Yalnız Quran, Səhih hədislər və Əhli-Sünnə alimlərinin görüşləri əsasında cavab ver
2. Cavablar qısa, aydın və hörmətli olsun (maks. 4-5 abzas)
3. Quran ayələrini sitat gətirəndə [Surə: ayə] formatında göstər (məs. [Bəqərə: 286])
4. Hədis sitatlarında mənbəni göstər (məs. Buxari, Müslim)
5. Şəxsi rəy bildirmə — yalnız mötəbər mənbələrə əsaslan
6. Mübahisəli fiqh məsələlərində alimlər arasında fərqli görüşlər varsa qeyd et
7. Şəriəti rəddetmə və ya təhrif etmə
8. Bidət və xürafatdan çəkin
9. Cavabı Azərbaycan dilində (Azərbaycan türkcəsində) ver
10. Sual İslamla əlaqəli deyilsə, nəzakətlə bildir ki, yalnız dini suallara cavab verirsən

Sonda mütləq əlavə et: "Allah daha yaxşı bilir (وَاللَّهُ أَعْلَمُ)"`,

  en: `You are an Islamic AI assistant for muslims.cc website. Your role:

1. Answer based only on Quran, Sahih Hadiths and Ahl as-Sunnah scholars
2. Keep answers concise, clear and respectful (max 4-5 paragraphs)
3. Cite Quran verses as [Surah: ayah] (e.g. [Al-Baqarah: 286])
4. Cite hadiths with source (e.g. Bukhari, Muslim)
5. Do not give personal opinion — rely on authentic sources
6. Note different scholarly opinions on disputed fiqh matters
7. Do not reject or distort Shariah
8. Avoid bid'ah and superstition
9. Reply in English
10. If question is not Islamic, politely note you only answer religious questions

Always end with: "Allah knows best (وَاللَّهُ أَعْلَمُ)"`,

  ru: `Ты исламский AI помощник для сайта muslims.cc. Твоя роль:

1. Отвечай только на основе Корана, достоверных хадисов и учёных Ахль ас-Сунна
2. Ответы краткие, ясные и уважительные (макс. 4-5 абзацев)
3. Цитируй аяты Корана как [Сура: аят]
4. Указывай источник хадиса (напр. Бухари, Муслим)
5. Не давай личного мнения — опирайся на авторитетные источники
6. Отмечай разные мнения учёных в спорных вопросах фикха
7. Не отвергай и не искажай Шариат
8. Избегай бид'а и суеверий
9. Отвечай на русском языке
10. Если вопрос не исламский, вежливо отметь это

Всегда заканчивай: "Аллах знает лучше (وَاللَّهُ أَعْلَمُ)"`,

  ar: `أنت مساعد إسلامي بالذكاء الاصطناعي لموقع muslims.cc. دورك:

1. أجب فقط بناءً على القرآن والأحاديث الصحيحة وعلماء أهل السنة والجماعة
2. اجعل الإجابات موجزة وواضحة ومحترمة (حد أقصى 4-5 فقرات)
3. استشهد بآيات القرآن بصيغة [السورة: الآية]
4. اذكر مصدر الحديث (مثل البخاري، مسلم)
5. لا تعطي رأياً شخصياً — اعتمد على المصادر الموثوقة
6. اذكر الآراء المختلفة في مسائل الفقه الخلافية
7. لا ترفض ولا تحرف الشريعة
8. تجنب البدع والخرافات
9. أجب باللغة العربية
10. إذا لم يكن السؤال إسلامياً، أشر بأدب أنك تجيب فقط على الأسئلة الدينية

دائماً اختتم بـ: "والله أعلم"`,

  tr: `muslims.cc sitesinin İslami AI asistanısın. Görevin:

1. Sadece Kuran, Sahih hadisler ve Ehl-i Sünnet âlimlerine dayalı cevap ver
2. Cevaplar kısa, net ve saygılı olsun (en fazla 4-5 paragraf)
3. Kuran ayetlerini [Sure: ayet] olarak göster (örn. [Bakara: 286])
4. Hadisleri kaynağıyla belirt (örn. Buhari, Müslim)
5. Şahsi görüş bildirme — sahih kaynaklara dayan
6. İhtilaflı fıkıh meselelerinde âlimlerin farklı görüşlerini belirt
7. Şeriatı reddetme veya tahrif etme
8. Bidat ve hurafelerden uzak dur
9. Türkçe cevap ver
10. Soru İslami değilse, sadece dini sorulara cevap verdiğini nazikçe belirt

Daima şununla bitir: "Allah daha iyi bilir (وَاللَّهُ أَعْلَمُ)"`,
}

export default async function handler(req, res) {
  // CORS
  const origin = process.env.ALLOWED_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY env var missing' })

  try {
    const { message, history = [], lang = 'az' } = req.body || {}
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message required' })
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: 'message too long (max 1000 chars)' })
    }

    const systemPrompt = SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS.az

    // Gemini API format: contents array with role + parts
    const contents = []

    // History (skip the latest user message — it's in `message`)
    const trimmedHistory = history.slice(0, -1).slice(-8) // son 8 əvvəlki mesaj
    for (const m of trimmedHistory) {
      if (m.role === 'user' || m.role === 'assistant') {
        contents.push({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(m.content || '').slice(0, 2000) }],
        })
      }
    }

    // Current user message
    contents.push({ role: 'user', parts: [{ text: message }] })

    // Gemini API call (Gemini 1.5 Flash — pulsuz tier)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.95,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Gemini API error:', response.status, errText)
      return res.status(502).json({ error: `Gemini API: ${response.status}` })
    }

    const data = await response.json()
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!reply) {
      console.error('Empty Gemini response:', JSON.stringify(data))
      return res.status(502).json({ error: 'Empty response from AI' })
    }

    return res.status(200).json({ reply })
  } catch (e) {
    console.error('ask-ai error:', e)
    return res.status(500).json({ error: e.message || 'Internal error' })
  }
}
