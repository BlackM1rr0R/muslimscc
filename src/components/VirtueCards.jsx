// ═══════════════════════════════════════════════════════
// Fəzilət kartları — ayə (API-dən) və hədis (layihənin hədis bazasından)
//
// /jamaat (camaat və cümə namazı) və /donate (xeyriyyə və ianə) səhifələri
// eyni kartları göstərir, ona görə komponent ortaqdır.
// • Ayə mətni YADDAŞDAN YAZILMIR: api.alquran.cloud-dan gətirilir (Quran
//   səhifəsi ilə eyni nəşrlər); sorğu alınmasa kart heç göstərilmir.
// • Hədis mətni çağıran tərəfin verdiyi qeyddir (src/data/hadiths.js-dən
//   olduğu kimi köçürülmüş) — burada heç bir dini mətn yoxdur.
// Üslublar src/styles/VirtueCards.css-dədir (jm-v* sinifləri, dizayn v2) —
// hər iki səhifə komponentlə birlikdə eyni faylı yükləyir.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { filled } from '../config/brand'
import { localizeSource } from '../utils/sourceNames'
import '../styles/VirtueCards.css'

// Kart nişanları (5 dil)
const KIND = {
  verse:       { az: 'Ayə', en: 'Verse', ru: 'Аят', ar: 'آية', tr: 'Ayet' },
  hadith:      { az: 'Hədis', en: 'Hadith', ru: 'Хадис', ar: 'حديث', tr: 'Hadis' },
  translation: { az: 'tərcümə', en: 'translation', ru: 'перевод', ar: 'الترجمة', tr: 'meal' },
}

// Ayə istinadlarında surə adları (yalnız istifadə olunan surələr)
const SURAH_LABELS = {
  2:  { az: 'Bəqərə', en: 'Al-Baqarah', ru: 'Аль-Бакара', ar: 'البقرة', tr: 'Bakara' },
  62: { az: 'Cümə', en: 'Al-Jumu‘ah', ru: 'Аль-Джумуа', ar: 'الجمعة', tr: 'Cuma' },
}

// Ayə tərcüməsinin nəşri (QuranPage-dəki xəritə ilə eyni; ərəbcədə yalnız ərəb mətni)
const VERSE_EDITIONS = { az: 'az.mammadaliyev', en: 'en.asad', ru: 'ru.kuliev', tr: 'tr.diyanet' }
const ARABIC_EDITION = 'quran-uthmani'
const VERSE_CACHE_PREFIX = 'qm_ayah_'
const VERSE_TIMEOUT_MS = 15000

const verseMem = new Map()

function readVerse(key) {
  if (verseMem.has(key)) return verseMem.get(key)
  try {
    const raw = sessionStorage.getItem(VERSE_CACHE_PREFIX + key)
    if (!raw) return null
    const d = JSON.parse(raw)
    if (!d || typeof d.ar !== 'string' || !d.ar) return null
    verseMem.set(key, d)
    return d
  } catch {
    return null
  }
}

function writeVerse(key, data) {
  verseMem.set(key, data)
  try { sessionStorage.setItem(VERSE_CACHE_PREFIX + key, JSON.stringify(data)) } catch { /* yaddaş bağlıdır */ }
}

/** Ayəni ərəbcə (Osmani yazısı) + cari dilin tərcüməsi ilə qaytarır. */
export function useVerse(ref, lang) {
  const edition = lang === 'ar' ? '' : (VERSE_EDITIONS[lang] || VERSE_EDITIONS.en)
  const key = `${ref}_${edition || 'ar'}`
  const [state, setState] = useState(() => ({ key, data: readVerse(key), failed: false }))

  useEffect(() => {
    const cached = readVerse(key)
    if (cached) { setState({ key, data: cached, failed: false }); return undefined }
    setState({ key, data: null, failed: false })

    let alive = true
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), VERSE_TIMEOUT_MS)
    const eds = edition ? `${ARABIC_EDITION},${edition}` : ARABIC_EDITION
    fetch(`https://api.alquran.cloud/v1/ayah/${ref}/editions/${eds}`, { signal: ctrl.signal })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(json => {
        const list = Array.isArray(json?.data) ? json.data : []
        const arabic = list.find(a => a?.edition?.identifier === ARABIC_EDITION)
        const trans = edition ? list.find(a => a?.edition?.identifier === edition) : null
        if (!arabic?.text || (edition && !trans?.text)) throw new Error('bad response')
        const data = {
          ar: arabic.text,
          text: trans?.text || '',
          // Tərcüməçinin adı — ingiliscədə tam ad ("Muhammad Asad")
          tname: trans ? (lang === 'en' ? trans.edition?.englishName : trans.edition?.name) || '' : '',
        }
        writeVerse(key, data)
        if (alive) setState({ key, data, failed: false })
      })
      .catch(() => { if (alive) setState({ key, data: null, failed: true }) })
      .finally(() => clearTimeout(timer))

    return () => {
      alive = false
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [key, ref, edition, lang])

  // Dil dəyişəndə köhnə dilin ayəsi bir anlıq da görünməsin
  return state.key === key ? state : { key, data: readVerse(key), failed: false }
}

/** Ayə kartı: sorğu alınmasa heç nə göstərilmir. */
export function VerseCard({ verseRef, lang }) {
  const { data, failed } = useVerse(verseRef, lang)
  if (failed) return null

  if (!data) {
    return (
      <div className="jm-vcard jm-vcard--verse is-loading" aria-hidden="true">
        <span className="skeleton jm-skel jm-skel--chip" />
        <span className="skeleton jm-skel jm-skel--ar" />
        <span className="skeleton jm-skel" />
        <span className="skeleton jm-skel jm-skel--short" />
      </div>
    )
  }

  const surahNo = verseRef.split(':')[0]
  const surah = SURAH_LABELS[surahNo]?.[lang] || ''
  // Ayənin ortasından başlayan tərcümə (məs. "and be constant...") — önünə "…" qoyulur
  const text = data.text && /^\p{Ll}/u.test(data.text) ? `…${data.text}` : data.text
  const showTrans = lang !== 'ar' && filled(text)

  return (
    <figure className="jm-vcard jm-vcard--verse">
      <span className="jm-vkind">{KIND.verse[lang]}</span>
      <blockquote className="jm-varabic" lang="ar" dir="rtl">{data.ar}</blockquote>
      {showTrans && <p className="jm-vtext">{text}</p>}
      <figcaption className="jm-vsource">
        <span>— {surah} <span className="jm-time">{verseRef}</span></span>
        {showTrans && filled(data.tname) && <span className="jm-vtrans">{KIND.translation[lang]}: {data.tname}</span>}
      </figcaption>
    </figure>
  )
}

/**
 * Hədis kartı. h = { ar, source, text:{az,en,ru,tr} } (və ya az/en/ru/tr
 * birbaşa qeydin özündə — hadiths.js formatı). Ərəb dilində yalnız əsl
 * mətn göstərilir (tərcümə onun təkrarı olardı). Cari dildə tərcümə
 * yoxdursa BAŞQA DİLƏ DÜŞMÜR — yalnız ərəbcə mətn və mənbə qalır.
 */
export function HadithCard({ h, lang }) {
  const tx = h.text || h
  const text = lang === 'ar' ? '' : (tx[lang] || '')
  return (
    <figure className="jm-vcard jm-vcard--hadith">
      <span className="jm-vkind jm-vkind--gold">{KIND.hadith[lang]}</span>
      <blockquote className="jm-varabic jm-varabic--sm" lang="ar" dir="rtl">{h.ar}</blockquote>
      {filled(text) && <p className="jm-vtext">{text}</p>}
      <figcaption className="jm-vsource"><span>— {localizeSource(h.source, lang)}</span></figcaption>
    </figure>
  )
}
