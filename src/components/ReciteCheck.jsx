// ═══════════════════════════════════════════════════════
// ReciteCheck — səsli hifz yoxlaması (/hifz)
//
//   <ReciteCheck lang="az" surahName={(n) => '…'} />
//
// • Surəni seçin, "Oxumağa başla" — ucadan oxuyun; brauzerin nitq tanıması (Web Speech,
//   ar-SA) yazır, sözlər Quran mətni ilə tutuşdurulur (utils/reciteCheck): yaşıl — oxundu,
//   qırmızı — buraxıldı / tanınmadı. Nəticə faizlə.
// • MƏXFİLİK: Chrome/Edge səsi tanımaq üçün Google/Microsoft serverlərinə göndərir — buna görə
//   başlamazdan əvvəl açıq razılıq istənir; bizim serverə heç nə getmir, heç nə yazılmır.
// • Tanıma ərəbcədə səhv edə bilər — yalnız köməkçidir, müəllimə oxumağın yerini tutmur.
// • Mətn: api.alquran.cloud quran-uthmani (Quran səhifəsi ilə eyni mənbə).
// Stillər: src/styles/ReciteCheck.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { alignRecitation, words as normWords } from '../utils/reciteCheck'
import { withoutLeadingBasmala } from '../utils/quranText'
import '../styles/ReciteCheck.css'

const SURAHS = [1, 112, 113, 114, 111, 110, 109, 108, 107, 106, 105, 104, 103, 102, 101, 100, 99, 97, 95, 94, 93, 87, 67, 36]
const T = {
  // lang-ok[Chrome,Edge,Google,Microsoft,Chrome Edge]: brauzer və şirkət adları
  az: { title: 'Səsli yoxlama', lead: 'Surəni ucadan oxuyun — buraxdığınız və ya tanınmayan sözlər qırmızı görünəcək.', pick: 'Surə', start: 'Oxumağa başla', stop: 'Dayandır', consent: 'Başa düşürəm: səsim tanınmaq üçün brauzerin nitq xidmətinə (Google / Microsoft) göndəriləcək. Muslims.cc heç nə yazmır və saxlamır.', score: (p) => `${p}% oxundu`, listening: 'Dinləyirəm…', note: 'Nitq tanıma ərəbcədə səhv edə bilər — bu, yalnız köməkçidir; oxunuşunuzu bilən birinə dinlətməyi unutmayın.', unsupported: 'Bu brauzer nitq tanımanı dəstəkləmir (Chrome və ya Edge-də açın).', loadErr: 'Surənin mətnini yükləmək alınmadı.', denied: 'Mikrofon icazəsi verilmədi.' },
  en: { title: 'Voice check', lead: 'Recite the surah aloud — words you skip or that are not recognised turn red.', pick: 'Surah', start: 'Start reciting', stop: 'Stop', consent: 'I understand: my voice will be sent to the browser’s speech service (Google / Microsoft) to be recognised. Muslims.cc records and stores nothing.', score: (p) => `${p}% recited`, listening: 'Listening…', note: 'Speech recognition can make mistakes in Arabic — this is only a helper; still recite to someone who knows.', unsupported: 'This browser does not support speech recognition (open in Chrome or Edge).', loadErr: 'Could not load the surah text.', denied: 'Microphone permission was not granted.' },
  // lang-ok[Chrome,Edge,Google,Microsoft,Chrome Edge]: brauzer və şirkət adları
  ru: { title: 'Проверка голосом', lead: 'Прочитайте суру вслух — пропущенные или не распознанные слова станут красными.', pick: 'Сура', start: 'Начать чтение', stop: 'Стоп', consent: 'Я понимаю: мой голос будет отправлен в речевой сервис браузера (Google / Microsoft) для распознавания. Muslims.cc ничего не записывает и не хранит.', score: (p) => `прочитано ${p}%`, listening: 'Слушаю…', note: 'Распознавание речи может ошибаться в арабском — это лишь помощник; читайте и знающему человеку.', unsupported: 'Этот браузер не поддерживает распознавание речи (откройте в Chrome или Edge).', loadErr: 'Не удалось загрузить текст суры.', denied: 'Доступ к микрофону не предоставлен.' },
  tr: { title: 'Sesli kontrol', lead: 'Sureyi yüksek sesle okuyun — atladığınız veya tanınmayan kelimeler kırmızı olur.', pick: 'Sure', start: 'Okumaya başla', stop: 'Durdur', consent: 'Anlıyorum: sesim tanınmak için tarayıcının konuşma hizmetine (Google / Microsoft) gönderilecek. Muslims.cc hiçbir şey kaydetmez ve saklamaz.', score: (p) => `%${p} okundu`, listening: 'Dinliyorum…', note: 'Konuşma tanıma Arapçada hata yapabilir — yalnızca yardımcıdır; okuyuşunuzu bilen birine dinletin.', unsupported: 'Bu tarayıcı konuşma tanımayı desteklemiyor (Chrome veya Edge’de açın).', loadErr: 'Sure metni yüklenemedi.', denied: 'Mikrofon izni verilmedi.' },
  // lang-ok[Chrome,Edge,Google,Microsoft,Chrome Edge]: brauzer və şirkət adları
  ar: { title: 'التسميع الصوتي', lead: 'اقرأ السورة بصوت مسموع — الكلمات التي تتركها أو لا تُتعرَّف تظهر بالأحمر.', pick: 'السورة', start: 'ابدأ القراءة', stop: 'أوقف', consent: 'أفهم أن صوتي سيُرسل إلى خدمة التعرف على الكلام في المتصفح (Google / Microsoft). موقع Muslims.cc لا يسجّل ولا يحفظ شيئًا.', score: (p) => `قُرئ ${p}٪`, listening: 'أستمع…', note: 'قد يخطئ التعرف على الكلام في العربية — هو مساعد فقط؛ اقرأ على من يُتقن.', unsupported: 'هذا المتصفح لا يدعم التعرف على الكلام (افتحه في Chrome أو Edge).', loadErr: 'تعذّر تحميل نص السورة.', denied: 'لم يُمنح إذن الميكروفون.' },
}

const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null

export default function ReciteCheck({ lang = 'az', surahName = (n) => String(n) }) {
  const t = T[lang] || T.az
  const [surah, setSurah] = useState(112)
  const [ayahs, setAyahs] = useState(null) // [{ n, words: [display…] }]
  const [loadErr, setLoadErr] = useState(false)
  const [consent, setConsent] = useState(false)
  const [listening, setListening] = useState(false)
  const [spoken, setSpoken] = useState('')
  const [err, setErr] = useState('')
  const recRef = useRef(null)
  const finalRef = useRef('')

  useEffect(() => {
    let alive = true
    setAyahs(null); setLoadErr(false); setSpoken(''); finalRef.current = ''
    fetch(`https://api.alquran.cloud/v1/surah/${surah}/quran-uthmani`).then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(j => {
        if (!alive) return
        setAyahs((j?.data?.ayahs || []).map((a, i) => {
          const text = i === 0 ? withoutLeadingBasmala(a.text) : a.text
          return { n: a.numberInSurah, words: text.split(/\s+/).filter(w => normWords(w).length) }
        }))
      }).catch(() => alive && setLoadErr(true))
    return () => { alive = false }
  }, [surah])

  useEffect(() => () => { try { recRef.current?.abort() } catch { /* */ } }, [])

  const flat = useMemo(() => (ayahs || []).flatMap(a => a.words), [ayahs])
  const { marks, score } = useMemo(() => alignRecitation(flat.join(' '), spoken), [flat, spoken])

  const start = () => {
    if (!SR || !consent || listening) return
    const rec = new SR()
    rec.lang = 'ar-SA'; rec.continuous = true; rec.interimResults = true
    finalRef.current = ''; setSpoken(''); setErr('')
    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalRef.current += ` ${r[0].transcript}`
        else interim += ` ${r[0].transcript}`
      }
      setSpoken(`${finalRef.current} ${interim}`)
    }
    rec.onerror = (e) => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setErr(t.denied) }
    rec.onend = () => setListening(false)
    recRef.current = rec
    try { rec.start(); setListening(true) } catch { setListening(false) }
  }
  const stop = () => { try { recRef.current?.stop() } catch { /* */ } }

  let k = 0
  return (
    <section className="ui-card rc" aria-labelledby="rc-title" data-testid="recite-check">
      <h2 id="rc-title" className="ui-title ui-title--sm"><Icon name="mic" size={18} /> {t.title}</h2>
      <p className="rc__lead">{t.lead}</p>
      {!SR ? <p className="rc__note" role="note">{t.unsupported}</p> : (
        <>
          <div className="rc__bar">
            <label className="rc__pick">
              <span>{t.pick}</span>
              <select className="ui-select ui-select--sm" value={surah} onChange={e => setSurah(Number(e.target.value))} disabled={listening}>
                {SURAHS.map(n => <option key={n} value={n}>{n}. {surahName(n)}</option>)}
              </select>
            </label>
            {listening
              ? <button type="button" className="ui-btn ui-btn--secondary" onClick={stop}><Icon name="pause" className="ui-btn__icon" /> {t.stop}</button>
              : <button type="button" className="ui-btn ui-btn--primary" onClick={start} disabled={!consent || !ayahs} data-testid="recite-start"><Icon name="mic" className="ui-btn__icon" /> {t.start}</button>}
            {(spoken || listening) && <span className="rc__score ui-num" aria-live="polite">{listening && !spoken.trim() ? t.listening : t.score(Math.round(score * 100))}</span>}
          </div>
          <label className="rc__consent">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} data-testid="recite-consent" /> <span>{t.consent}</span>
          </label>
          {err && <p className="rc__err" role="alert">{err}</p>}
        </>
      )}
      {loadErr && <p className="rc__err" role="alert">{t.loadErr}</p>}
      {ayahs && (
        <p className={`rc__text ui-arabic${spoken ? ' is-checked' : ''}`} lang="ar" dir="rtl" data-testid="recite-text">
          {ayahs.map(a => (
            <span key={a.n} className="rc__ayah">
              {a.words.map((w) => { const i = k++; return <span key={i} className={`rc__w${spoken ? ` is-${marks[i]}` : ''}`}>{w} </span> })}
              <span className="rc__num ui-num">﴿{a.n}﴾ </span>
            </span>
          ))}
        </p>
      )}
      <p className="rc__note">{t.note}</p>
    </section>
  )
}
