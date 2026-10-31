import { useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import ReportErrorButton from '../components/ReportErrorButton'
import '../styles/HisnPage.css'

/* ══════════════════════════════════════════════════════════════════
   HİSNUL-MÜSLİM — /hisnul-muslim
   Səid ibn Əli əl-Qəhtaninin "Hisnul-Müslim" kitabı TAM: 132 fəsil, hər
   zikrin ərəb mətni, tərcüməsi, təkrar sayı və kitabdakı təxric (mənbə).

   Məlumat: public/data/hisn/<dil>.json (scripts/build-hisn.mjs qurur) —
   səhifə açılanda yalnız cari dilin faylı yüklənir. "Nə vaxt nə deyim?"
   axtarışı fəsil adları və mətnlər üzrə işləyir. Sayğac — toxunduqca
   azalır (zikri saymaq üçün), vəziyyət yadda saxlanmır.
   ══════════════════════════════════════════════════════════════════ */

const LABELS = {
  az: {
    eyebrow: 'Dua və zikr', title: 'Hisnul-Müslim',
    subtitle: 'Kitab və Sünnədən gündəlik zikrlər və dualar — Səid əl-Qəhtaninin "Hisnul-Müslim" kitabı tam şəkildə: ərəb mətni, tərcüməsi və mənbəsi ilə.',
    search: 'Nə vaxt nə deyim? (məs. yağış, yuxu, səfər)', clear: 'Axtarışı təmizlə', chapters: 'Fəsillər',
    results: (n) => `${n} fəsil tapıldı`, none: 'Heç nə tapılmadı. Başqa söz yoxlayın.',
    loading: 'Yüklənir…', error: 'Məlumat yüklənmədi. İnternet bağlantısını yoxlayıb yenidən cəhd edin.', retry: 'Yenidən cəhd et',
    source: 'Mənbə', times: (n) => `${n} dəfə`, tap: 'Saymaq üçün toxunun', done: 'Tamamlandı', reset: 'Sıfırla',
    copy: 'Kopyala', copied: 'Kopyalandı', top: 'Yuxarı', author: 'Səid ibn Əli ibn Vəhf əl-Qəhtani',
    note: 'Tərcümə ərəb əslindən Muslims.cc tərəfindən süni intellektin köməyi ilə hazırlanıb və redaktə olunur. Dua ərəbcə oxunmalıdır — tərcümə mənanı anlamaq üçündür.',
    count: (n) => `${n} fəsil`,
  },
  en: {
    eyebrow: 'Dua & dhikr', title: 'Hisn al-Muslim',
    subtitle: 'Daily remembrance and supplications from the Quran and Sunnah — the complete "Fortress of the Muslim" by Sa‘id al-Qahtani, with Arabic text, translation and sources.',
    search: 'What do I say when…? (e.g. rain, sleep, travel)', clear: 'Clear search', chapters: 'Chapters',
    results: (n) => `${n} ${n === 1 ? 'chapter' : 'chapters'} found`, none: 'Nothing found. Try another word.',
    loading: 'Loading…', error: 'The data could not be loaded. Check your connection and try again.', retry: 'Try again',
    source: 'Source', times: (n) => `${n} ${n === 1 ? 'time' : 'times'}`, tap: 'Tap to count', done: 'Done', reset: 'Reset',
    copy: 'Copy', copied: 'Copied', top: 'Top', author: 'Sa‘id ibn Ali ibn Wahf al-Qahtani',
    note: 'The translation was prepared from the Arabic original by Muslims.cc with the help of AI and is being reviewed. Supplications are said in Arabic — the translation helps you understand the meaning.',
    count: (n) => `${n} chapters`,
  },
  ru: {
    eyebrow: 'Дуа и зикр', title: 'Хиснуль-муслим',
    subtitle: 'Ежедневные поминания и мольбы из Корана и Сунны — полная «Крепость мусульманина» Саида аль-Кахтани: арабский текст, перевод и источники.',
    search: 'Что говорить, когда…? (дождь, сон, поездка)', clear: 'Очистить поиск', chapters: 'Главы',
    results: (n) => `Найдено глав: ${n}`, none: 'Ничего не найдено. Попробуйте другое слово.',
    loading: 'Загрузка…', error: 'Не удалось загрузить данные. Проверьте подключение и повторите попытку.', retry: 'Повторить',
    source: 'Источник', times: (n) => `${n} раз`, tap: 'Нажмите, чтобы считать', done: 'Готово', reset: 'Сбросить',
    copy: 'Копировать', copied: 'Скопировано', top: 'Наверх', author: 'Саид ибн Али ибн Вахф аль-Кахтани',
    note: 'Перевод подготовлен Muslims.cc с арабского оригинала с помощью ИИ и проходит редактуру. Мольбы произносятся на арабском — перевод помогает понять смысл.',
    count: (n) => `Глав: ${n}`,
  },
  ar: {
    eyebrow: 'الدعاء والذكر', title: 'حصن المسلم',
    subtitle: 'حصن المسلم من أذكار الكتاب والسنة — لسعيد بن علي بن وهف القحطاني، كاملًا مع التخريج.',
    search: 'ماذا أقول عند…؟ (المطر، النوم، السفر)', clear: 'مسح البحث', chapters: 'الأبواب',
    results: (n) => `عدد الأبواب: ${n}`, none: 'لم يُعثر على شيء. جرّب كلمة أخرى.',
    loading: 'جارٍ التحميل…', error: 'تعذّر تحميل البيانات. تحقّق من الاتصال وأعد المحاولة.', retry: 'أعد المحاولة',
    source: 'التخريج', times: (n) => `${n} مرات`, tap: 'اضغط للعدّ', done: 'تمّ', reset: 'إعادة',
    copy: 'نسخ', copied: 'تم النسخ', top: 'إلى الأعلى', author: 'سعيد بن علي بن وهف القحطاني',
    note: '', count: (n) => `${n} بابًا`,
  },
  tr: {
    eyebrow: 'Dua ve zikir', title: 'Hısnu’l-Müslim',
    subtitle: 'Kur’an ve Sünnet’ten günlük zikir ve dualar — Saîd el-Kahtânî’nin “Hısnu’l-Müslim” kitabı eksiksiz: Arapça metin, meal ve kaynaklarıyla.',
    search: 'Ne zaman ne derim? (yağmur, uyku, yolculuk)', clear: 'Aramayı temizle', chapters: 'Bölümler',
    results: (n) => `${n} bölüm bulundu`, none: 'Bir şey bulunamadı. Başka bir kelime deneyin.',
    loading: 'Yükleniyor…', error: 'Veriler yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.', retry: 'Tekrar dene',
    source: 'Kaynak', times: (n) => `${n} kez`, tap: 'Saymak için dokunun', done: 'Tamamlandı', reset: 'Sıfırla',
    copy: 'Kopyala', copied: 'Kopyalandı', top: 'Yukarı', author: 'Saîd b. Ali b. Vehf el-Kahtânî',
    note: 'Meal, Arapça aslından Muslims.cc tarafından yapay zekâ yardımıyla hazırlanmıştır ve gözden geçirilmektedir. Dualar Arapça okunur — meal anlamı kavramak içindir.',
    count: (n) => `${n} bölüm`,
  },
}

// Axtarış: hərf registri və ərəb hərəkələri nəzərə alınmır
const HARAKAT = /[ً-ْٰـ]/g
const norm = (s, lang) => String(s || '').replace(HARAKAT, '').toLocaleLowerCase(lang)

const cache = new Map()
function loadHisn(lang) {
  if (!cache.has(lang)) {
    const p = fetch(`/data/hisn/${lang}.json`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
    p.catch(() => cache.delete(lang))
    cache.set(lang, p)
  }
  return cache.get(lang)
}

/** Təkrar sayğacı: toxunduqca azalır; bitəndə yaşıl "Tamamlandı". */
function Counter({ total, L }) {
  const [left, setLeft] = useState(total)
  const done = left === 0
  return (
    <div className="hs-counter">
      <button type="button" className={`hs-counter__btn${done ? ' is-done' : ''}`}
        onClick={() => setLeft(n => Math.max(0, n - 1))} disabled={done}
        aria-label={done ? L.done : `${L.tap}: ${left} / ${total}`}>
        {done ? <Icon name="check" size={18} /> : <span className="ui-num">{left}</span>}
      </button>
      <span className="hs-counter__label">{done ? L.done : L.times(total)}</span>
      {left !== total && (
        <button type="button" className="ui-icon-btn hs-counter__reset" onClick={() => setLeft(total)} aria-label={L.reset} title={L.reset}>
          <Icon name="refresh" size={15} />
        </button>
      )}
    </div>
  )
}

function Item({ it, n, L, lang, isAr }) {
  const [copied, setCopied] = useState(false)
  const t = useRef(null)
  useEffect(() => () => clearTimeout(t.current), [])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText([it.ar, !isAr && it.text, it.src ? `— ${it.src}` : ''].filter(Boolean).join('\n\n'))
      setCopied(true)
      clearTimeout(t.current)
      t.current = setTimeout(() => setCopied(false), 1800)
    } catch { /* icazə yoxdur */ }
  }
  return (
    <article className="ui-card hs-item">
      <div className="hs-item__head">
        <span className="hs-item__n ui-num" aria-hidden="true">{n}</span>
        <span className="hs-item__tools">
        <ReportErrorButton compact refText={`Hisnul-Müslim №${n}`} kind="translation" />
        <button type="button" className="ui-icon-btn hs-item__copy" onClick={copy} aria-label={copied ? L.copied : L.copy} title={copied ? L.copied : L.copy}>
          <Icon name={copied ? 'check' : 'copy'} size={16} />
        </button>
        </span>
      </div>
      <p className="hs-item__ar ui-arabic" lang="ar" dir="rtl">{it.ar}</p>
      {!isAr && it.text && <p className="hs-item__text">{it.text}</p>}
      <div className="hs-item__foot">
        {it.repeat > 1 && <Counter key={`${lang}-${it.repeat}`} total={it.repeat} L={L} />}
        {it.src && <p className="hs-item__src"><span>{L.source}:</span> <cite dir="auto">{it.src}</cite></p>}
      </div>
    </article>
  )
}

export default function HisnPage() {
  const { lang } = useLang()
  const L = LABELS[lang] || LABELS.en
  const isAr = lang === 'ar'
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)
  const [q, setQ] = useState('')

  useEffect(() => {
    let live = true
    setStatus(s => (s === 'ok' ? s : 'loading'))
    loadHisn(lang)
      .then(d => { if (live) { setData(d); setStatus('ok') } })
      .catch(() => { if (live) setStatus('error') })
    return () => { live = false }
  }, [lang, attempt])

  const chapters = data?.chapters || []
  const filtered = useMemo(() => {
    const s = norm(q.trim(), lang)
    if (!s) return chapters
    return chapters.filter(c => norm(c.title, lang).includes(s) || norm(c.titleAr, lang).includes(s)
      || c.items.some(it => norm(it.text, lang).includes(s) || norm(it.ar, lang).includes(s)))
  }, [q, chapters, lang])

  // Hash ilə gəlinibsə (#hs-27) — yüklənəndən sonra həmin fəslə
  useEffect(() => {
    if (status !== 'ok') return
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' })
  }, [status])

  let counter = 0
  return (
    <div className="hs-page">
      <header className="ui-page-hero hs-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <span className="ui-eyebrow">{L.eyebrow}</span>
          <h1 className="ui-display">{L.title}</h1>
          {!isAr && <p className="hs-hero__ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">حصن المسلم من أذكار الكتاب والسنة</p>}
          <p className="ui-lead">{L.subtitle}</p>
          <p className="hs-hero__by"><Icon name="books" size={15} /> {L.author}{chapters.length > 0 && <> · <span className="ui-num">{L.count(chapters.length)}</span></>}</p>
        </div>
      </header>

      <div className="ui-section ui-section--tight">
        <div className="ui-container hs-layout">
          <div className="hs-search">
            <Icon name="search" size={19} className="hs-search__icon" />
            <input className="ui-input hs-search__input" type="search" aria-label={L.search} placeholder={L.search}
              enterKeyHint="search" value={q} onChange={e => setQ(e.target.value)} />
            {q && (
              <button type="button" className="ui-icon-btn hs-search__clear" onClick={() => setQ('')} aria-label={L.clear} title={L.clear}>
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
          {L.note && <p className="hs-note"><Icon name="info" size={15} /> {L.note}</p>}

          {status === 'loading' && !data && (
            <div className="hs-loading" role="status">
              {[0, 1, 2].map(i => <span key={i} className="ui-skeleton ui-skeleton--card" />)}
              <span className="ui-sr-only">{L.loading}</span>
            </div>
          )}
          {status === 'error' && !data && (
            <div className="ui-card ui-card--sunken hs-empty" role="alert">
              <p>{L.error}</p>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setAttempt(a => a + 1)}>
                <Icon name="refresh" className="ui-btn__icon" /> {L.retry}
              </button>
            </div>
          )}

          {data && (
            <>
              {q.trim() && <p className="hs-results" role="status">{filtered.length ? L.results(filtered.length) : L.none}</p>}
              {!q.trim() && (
                <details className="ui-card hs-toc">
                  <summary className="hs-toc__sum"><Icon name="list" size={18} /> {L.chapters} <span className="ui-num hs-toc__n">{chapters.length}</span><Icon name="chevronDown" size={18} className="hs-toc__chev" /></summary>
                  <ol className="hs-toc__list">
                    {chapters.map(c => (
                      <li key={c.id}><a href={`#hs-${c.id}`}>{c.title}</a></li>
                    ))}
                  </ol>
                </details>
              )}
              <div className="hs-chapters">
                {filtered.map(c => (
                  <section key={c.id} id={`hs-${c.id}`} className="hs-chapter" aria-labelledby={`hs-${c.id}-h`}>
                    <h2 id={`hs-${c.id}-h`} className="hs-chapter__title">
                      <span className="hs-chapter__n ui-num">{c.id}</span>
                      <span>{c.title}{!isAr && <span className="hs-chapter__ar ui-arabic" lang="ar" dir="rtl">{c.titleAr}</span>}</span>
                    </h2>
                    {c.items.map((it, i) => { counter += 1; return <Item key={i} it={it} n={it.n || counter} L={L} lang={lang} isAr={isAr} /> })}
                  </section>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
