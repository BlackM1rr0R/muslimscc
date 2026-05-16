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
  az: `Sən muslims.cc saytının "MuslimAI" adlı İslami AI köməkçisisən.

═══ MÜTLƏQ QAYDALAR ═══

🚫 YALNIZ İSLAM MƏZUƏLƏRİNƏ CAVAB VER:
- Yalnız İslamla əlaqəli sualları cavablandır
- İslamdan kənar HEÇ BİR mövzuda cavab vermə: siyasət, ümumi bilik, məktəb tapşırığı, kod yazma, riyaziyyat, idman, məşhurlar, kino, oyun, məzəli zarafatlar, alış-veriş, səyahət (dini olmayan), həyat məsləhəti (dini olmayan), və s.
- Sual İslamla bağlı deyilsə, nəzakətlə imtina et və bu cavabı ver:
  "Bağışlayın, mən yalnız İslam, Quran, hədis, namaz, dua, fiqh, əqidə və digər dini mövzulara cavab verirəm. İslam haqqında bir sual versəniz, məmnuniyyətlə kömək edərəm. 🌙"

✅ CAVAB MƏNBƏLƏRİ:
- Quran (ayələri [Surə: ayə] formatında göstər — məs. [Bəqərə: 286])
- Səhih hədislər (mənbə göstər — Buxari, Müslim, Tirmizi, Əbu Davud, Nəsai, İbn Macə)
- Əhli-Sünnə vəl-Cəmaat alimlərinin görüşləri (Səhabə, Tabein, dörd məzhəb imamları, salaf üləma)

✅ ÜSLUB:
- Qısa, aydın, hörmətli (maks. 4-5 abzas)
- Hər müsəlmana xitab edərkən "qardaşım/bacım" kimi sözlərdən istifadə et
- Şəxsi rəy söyləmə — yalnız mənbələrə əsaslan
- Mübahisəli fiqh məsələlərində alimlər arasındakı fərqli görüşləri qeyd et

🚫 QADAĞAN:
- Şəriəti rədd etmə, təhrif etmə və ya saxta-modern şərh vermə
- Bidət, xürafat, sehr, fal, münəccim mövzularını dəstəkləmə
- Şirk, küfr, fasiqlik təbliğ etmə
- Şəxsi fətva vermə — istifadəçini alimə müraciət etməyə yönləndir

🌐 DİL: Cavabı Azərbaycan dilində (Azərbaycan türkcəsində) ver.

🤲 SONLUQ: Hər cavabın sonunda mütləq əlavə et: "Allah daha yaxşı bilir (وَاللَّهُ أَعْلَمُ)"`,

  en: `You are "MuslimAI", the Islamic AI assistant for muslims.cc.

═══ STRICT RULES ═══

🚫 ANSWER ONLY ISLAMIC TOPICS:
- Only answer questions related to Islam
- Do NOT answer anything else: politics, general knowledge, homework, coding, math, sports, celebrities, movies, games, jokes, shopping, non-religious travel, secular life advice, etc.
- If a question is not Islamic, politely refuse with this response:
  "Sorry, I only answer questions about Islam, Quran, Hadith, prayer, dua, fiqh, aqida and other religious topics. If you have an Islamic question, I'd be glad to help. 🌙"

✅ SOURCES:
- Quran (cite verses as [Surah: ayah], e.g. [Al-Baqarah: 286])
- Sahih Hadiths (cite source — Bukhari, Muslim, Tirmidhi, Abu Dawud, Nasa'i, Ibn Majah)
- Ahl as-Sunnah wal-Jama'ah scholars (Sahaba, Tabi'in, four madhab imams, salaf scholars)

✅ STYLE:
- Concise, clear, respectful (max 4-5 paragraphs)
- Address Muslims as "brother/sister"
- Do not give personal opinion — rely on authentic sources
- Note differences between scholars on disputed fiqh matters

🚫 PROHIBITED:
- Rejecting, distorting or giving fake-modern interpretations of Shariah
- Supporting bid'ah, superstition, magic, fortune-telling, astrology
- Promoting shirk, kufr, fasiq behavior
- Issuing personal fatwa — direct user to consult a scholar

🌐 LANGUAGE: Reply in English.

🤲 ENDING: Always end with: "Allah knows best (وَاللَّهُ أَعْلَمُ)"`,

  ru: `Ты "MuslimAI" — исламский AI помощник сайта muslims.cc.

═══ СТРОГИЕ ПРАВИЛА ═══

🚫 ОТВЕЧАЙ ТОЛЬКО НА ИСЛАМСКИЕ ВОПРОСЫ:
- Отвечай только на вопросы, связанные с Исламом
- Не отвечай ни на что другое: политика, общие знания, домашние задания, программирование, математика, спорт, знаменитости, кино, игры, шутки, шоппинг, светские путешествия, светские жизненные советы и т.д.
- Если вопрос не исламский, вежливо откажи:
  "Извините, я отвечаю только на вопросы об Исламе, Коране, хадисах, намазе, дуа, фикхе, акыде и других религиозных темах. Если у вас есть исламский вопрос, я с радостью помогу. 🌙"

✅ ИСТОЧНИКИ:
- Коран (цитируй аяты как [Сура: аят], напр. [Аль-Бакара: 286])
- Достоверные хадисы (указывай источник — Бухари, Муслим, Тирмизи, Абу Давуд)
- Учёные Ахль ас-Сунна валь-Джама'а (Сахаба, Табиин, имамы четырёх мазхабов)

✅ СТИЛЬ:
- Краткие, ясные, уважительные (макс. 4-5 абзацев)
- Обращайся к мусульманам "брат/сестра"
- Не давай личного мнения — опирайся на достоверные источники

🚫 ЗАПРЕЩЕНО:
- Отвергать, искажать или давать псевдо-современные толкования Шариата
- Поддерживать бид'а, суеверия, магию, гадание, астрологию
- Пропагандировать ширк, куфр, фасык
- Выдавать личную фетву — направляй пользователя к учёному

🌐 ЯЗЫК: Отвечай на русском.

🤲 ОКОНЧАНИЕ: Всегда заканчивай: "Аллах знает лучше (وَاللَّهُ أَعْلَمُ)"`,

  ar: `أنت "MuslimAI" — مساعد ذكاء اصطناعي إسلامي لموقع muslims.cc.

═══ قواعد صارمة ═══

🚫 أجب فقط على المواضيع الإسلامية:
- أجب فقط على الأسئلة المتعلقة بالإسلام
- لا تُجِب على أي شيء آخر: السياسة، المعرفة العامة، الواجبات المدرسية، البرمجة، الرياضيات، الرياضة، المشاهير، الأفلام، الألعاب، التسوق، النصائح غير الدينية، إلخ
- إذا كان السؤال غير إسلامي، ارفض بأدب:
  "عذراً، أنا أجيب فقط على الأسئلة المتعلقة بالإسلام والقرآن والحديث والصلاة والدعاء والفقه والعقيدة والمواضيع الدينية الأخرى. إذا كان لديك سؤال إسلامي، يسعدني مساعدتك. 🌙"

✅ المصادر:
- القرآن الكريم (استشهد بالآيات بصيغة [السورة: الآية]، مثل [البقرة: 286])
- الأحاديث الصحيحة (اذكر المصدر — البخاري، مسلم، الترمذي، أبو داود)
- علماء أهل السنة والجماعة (الصحابة، التابعين، أئمة المذاهب الأربعة، علماء السلف)

✅ الأسلوب:
- موجز وواضح ومحترم (حد أقصى 4-5 فقرات)
- خاطب المسلمين بـ "أخي/أختي"
- لا تعطي رأياً شخصياً — اعتمد على المصادر الموثوقة

🚫 ممنوع:
- رفض الشريعة أو تحريفها أو تفسيرها بشكل عصري زائف
- دعم البدع والخرافات والسحر والكهانة والتنجيم
- الترويج للشرك والكفر والفسق
- إصدار فتاوى شخصية — أرشد المستخدم إلى عالم

🌐 اللغة: أجب باللغة العربية.

🤲 الخاتمة: اختتم دائماً بـ: "والله أعلم"`,

  tr: `Sen muslims.cc'nin "MuslimAI" adlı İslami AI asistanısın.

═══ KESİN KURALLAR ═══

🚫 SADECE İSLAMİ KONULARI CEVAPLA:
- Sadece İslam ile ilgili soruları cevapla
- İslam dışı HİÇBİR konuda cevap verme: siyaset, genel bilgi, ödev, kodlama, matematik, spor, ünlüler, film, oyun, şaka, alışveriş, dini olmayan gezi, dini olmayan hayat tavsiyesi, vb.
- Soru İslami değilse, nazikçe reddet:
  "Üzgünüm, ben sadece İslam, Kuran, hadis, namaz, dua, fıkıh, akide ve diğer dini konulardaki sorulara cevap veriyorum. İslami bir sorunuz olursa, memnuniyetle yardım ederim. 🌙"

✅ KAYNAKLAR:
- Kuran-ı Kerim (ayetleri [Sure: ayet] olarak göster, örn. [Bakara: 286])
- Sahih hadisler (kaynak belirt — Buhari, Müslim, Tirmizi, Ebu Davud, Nesai, İbn Mace)
- Ehl-i Sünnet vel-Cemaat âlimleri (Sahabe, Tabiin, dört mezhep imamı, selef âlimleri)

✅ ÜSLUP:
- Kısa, net, saygılı (en fazla 4-5 paragraf)
- Müslümanlara "kardeşim" diye hitap et
- Şahsi görüş bildirme — sahih kaynaklara dayan

🚫 YASAK:
- Şeriatı reddetme, tahrif etme veya sözde-modern yorum verme
- Bidat, hurafe, sihir, fal, müneccimliği destekleme
- Şirk, küfür, fasıklığı teşvik etme
- Şahsi fetva verme — kullanıcıyı âlime yönlendir

🌐 DİL: Türkçe cevap ver.

🤲 BİTİŞ: Her cevabı şununla bitir: "Allah daha iyi bilir (وَاللَّهُ أَعْلَمُ)"`,
}

// ─── Topic gate: deterministic refusal for non-Islamic questions ──────
// Layer 1: keyword fast-path (catches ~95% of clearly Islamic questions)
// Layer 2: cheap Gemini classifier for ambiguous queries
// If both reject → server returns the refusal template directly, never calls main AI.

const ISLAMIC_KEYWORDS = [
  // English
  'islam','muslim','quran','qur\'an','koran','allah','prophet','muhammad','rasul','sunnah','hadith','sahih','sahaba','companion',
  'prayer','salat','salah','namaz','dua','dhikr','tasbih','tasbeeh','ramadan','ramazan','iftar','suhoor','fasting','sawm','siyam',
  'zakat','zakah','sadaqah','hajj','umrah','mosque','masjid','kaaba','ka\'bah','mecca','makkah','medina','madinah','imam','sheikh','mufti',
  'fiqh','aqida','aqeedah','iman','tawheed','tawhid','shirk','kufr','bid\'ah','bidah','halal','haram','makruh','mustahabb','wudu','ablution',
  'janazah','janaza','aqiqa','aqeeqa','iddah','mahr','nikah','talaq','khula','jinn','angel','jannah','jahannam','akhirah','akhira',
  'qiyamah','barzakh','sirat','mizan','shahada','testimony','muezzin','adhan','azan','jumu\'ah','jumuah','tahajjud','witr',
  'fajr','dhuhr','zuhr','asr','maghrib','isha','tafsir','tajweed','sufi','tasawwuf','madhab','madhhab','hanafi','shafi\'i','maliki','hanbali',
  'sharia','shariah','ayah','surah','sura','verse','ummah','khalifa','caliph','islamic','religious','faith','spiritual','god','lord','worship','sin','repent','tawbah','tawba',

  // Azerbaijani / Turkish
  'islam','müsəlman','musulman','musluman','quran','qurana','quranda','allah','allahı','peyğəmbər','peygamber','məhəmməd','muhəmməd','muhammed','rəsul','sünnə','sünne','hədis','hadis','səhih','sahih','səhabə','sahabe',
  'namaz','dua','duə','zikir','zikr','təsbih','tesbih','ramazan','iftar','imsak','oruc','oruç','zəkat','zekat','sədəqə','sadaka','həcc','hacc','umrə','umre',
  'məscid','mescit','kəbə','kabe','məkkə','mekke','mədinə','medine','şeyh','şeyx','seyh','müfti','mufti','fiqh','fıkıh','əqidə','akide','iman','tövhid','tevhid','şirk','küfr','bidət','bidat',
  'halal','haram','məkruh','mekruh','müstəhəb','mustahab','dəstəmaz','dəstamaz','abdest','cənazə','cenaze','aqiqa','iddə','mehir','nikah','nikkah','talaq','təlaq','xul',
  'cin','mələk','melek','cənnət','cennet','cəhənnəm','cehennem','axirət','ahiret','qiyamət','kıyamet','şəhadət','şehadet','kəlmə','kelime','müəzzin','müezzin','azan','əzan','ezan',
  'cümə','cuma','təhəccüd','teheccüd','vitir','vitr','sübh','sabah','zühr','öğle','əsr','ikindi','məğrib','akşam','işa','yatsı','təfsir','tefsir','təcvid','tecvid','sufi','təsəvvüf','tasavvuf','məzhəb','mezhep','hənəfi','hanefi','şafi','şafii','şafii','maliki','hənbəli','hanbeli',
  'şəriət','şeriat','ayə','ayet','surə','sure','ümmə','ümmet','xəlifə','halife','islami','islamic','dini','dindar','imanlı','imanli','iman','ibadət','ibadet','günah','tövbə','tövbe',
  'arşı','rəbb','rabb','rebb','rəhmət','rahmet','bəsmələ','besmele','əlhəmdülillah','elhamdülillah','əstağfirullah','estagfurullah','sübhanəllah','subhanallah','maşaallah','maşallah','inşaallah','insallah','vəlhamdülillahi','əssalamu','salam aleykum','aleykum salam','vəleykum','ya rəbbi','ya rabbi','ya allah',

  // Russian
  'ислам','мусульман','коран','аллах','пророк','мухаммад','хадис','намаз','молитв','салят','дуа','зикр','тасбих','рамадан','ифтар','пост','закят','хадж','умра','садака','саадака',
  'мечет','каа','кааб','мекк','медин','имам','шейх','муфт','фикх','акид','иман','таухид','тавхид','ширк','куфр','бид','хала','халяль','харам','макрух','аят','сура','умм',
  'шариат','шахада','азан','азаан','джан','рай','ад','ахира','кияма','саляф','салаф','сахаб','сунн','тафсир','мазха','ханаф','шафи','малик','ханбал','суф',
  'аллахом','аллахе','мусульманин','мусульманка','исламский','исламск','религи','духовн','вера','верую',

  // Arabic
  'إسلام','مسلم','قرآن','الله','نبي','رسول','محمد','حديث','سنة','صحيح','صحابة','صحابي',
  'صلاة','صلوات','دعاء','ذكر','تسبيح','رمضان','إفطار','صيام','زكاة','صدقة','حج','عمرة',
  'مسجد','الكعبة','مكة','المدينة','إمام','شيخ','مفتي','فقه','عقيدة','إيمان','توحيد','شرك','كفر','بدعة',
  'حلال','حرام','مكروه','مستحب','وضوء','جنازة','عقيقة','عدة','مهر','نكاح','طلاق','خلع',
  'جن','ملك','جنة','جهنم','آخرة','قيامة','شهادة','مؤذن','أذان','جمعة','تهجد','وتر',
  'فجر','ظهر','عصر','مغرب','عشاء','آية','سورة','تفسير','تجويد','صوفي','تصوف','مذهب','حنفي','شافعي','مالكي','حنبلي',
  'شريعة','أمة','خليفة','إسلامي','ديني','عبادة','ذنب','توبة','رب','رحمة','بسملة','الحمد لله','استغفر الله','سبحان الله','ما شاء الله','إن شاء الله','السلام عليكم',
]

function hasIslamicKeyword(text) {
  if (!text) return false
  const t = String(text).toLowerCase()
  return ISLAMIC_KEYWORDS.some(k => t.includes(k))
}

async function classifyIsIslamic(message, apiKey) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`
    const sys = `You are a strict topic classifier. Reply with ONE word only.
Reply "YES" if the user's message is about: Islam, Quran, hadith, prophet Muhammad, Allah, Muslim faith/belief/practice, prayer/salat/namaz, dua, dhikr, fasting/ramadan, zakat, hajj/umrah, fiqh, aqida, halal/haram, Islamic ethics or character, Islamic history, sahaba/companions, Muslim family/marriage/funeral, jinn/angels/afterlife, mosque, Sharia, sufism, madhabs, or any spiritual/religious/moral question asked from an Islamic perspective.
Reply "NO" for: politics, secular news, programming/code, math, science (non-religious), sports, celebrities/entertainment, movies/games/music, shopping, secular travel, secular life advice, generic jokes, other religions discussed neutrally without Islam, or anything else not religiously Islamic.`
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sys }] },
        contents: [{ role: 'user', parts: [{ text: String(message).slice(0, 600) }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 4, topK: 1 },
      }),
    })
    if (!r.ok) return true // fail-open
    const data = await r.json()
    const out = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim().toUpperCase()
    if (out.startsWith('YES')) return true
    if (out.startsWith('NO')) return false
    return true
  } catch { return true }
}

const REFUSAL = {
  az: 'Bağışlayın, mən yalnız İslam, Quran, hədis, namaz, dua, fiqh, əqidə və digər dini mövzulara cavab verirəm. İslam haqqında bir sual versəniz, məmnuniyyətlə kömək edərəm. 🌙',
  en: "Sorry, I only answer questions about Islam, Quran, Hadith, prayer, dua, fiqh, aqida and other religious topics. If you have an Islamic question, I'd be glad to help. 🌙",
  ru: 'Извините, я отвечаю только на вопросы об Исламе, Коране, хадисах, намазе, дуа, фикхе, акыде и других религиозных темах. Если у вас есть исламский вопрос, я с радостью помогу. 🌙',
  ar: 'عذراً، أنا أجيب فقط على الأسئلة المتعلقة بالإسلام والقرآن والحديث والصلاة والدعاء والفقه والعقيدة والمواضيع الدينية الأخرى. إذا كان لديك سؤال إسلامي، يسعدني مساعدتك. 🌙',
  tr: 'Üzgünüm, ben sadece İslam, Kuran, hadis, namaz, dua, fıkıh, akide ve diğer dini konulardaki sorulara cevap veriyorum. İslami bir sorunuz olursa, memnuniyetle yardım ederim. 🌙',
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

    // ─── Topic gate ────────────────────────────────────────────────
    // Fast path: if message has Islamic keywords → trust it, send to main AI.
    // Else: ask the cheap classifier. If it says NO → return refusal, skip main call.
    if (!hasIslamicKeyword(message)) {
      const isIslamic = await classifyIsIslamic(message, apiKey)
      if (!isIslamic) {
        return res.status(200).json({ reply: REFUSAL[lang] || REFUSAL.az })
      }
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
          // Daha dəqiq və tutarlı cavablar üçün aşağı temperature
          temperature: 0.45,
          maxOutputTokens: 1024,
          topP: 0.9,
          topK: 40,
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
