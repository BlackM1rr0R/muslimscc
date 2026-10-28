import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { BRAND, brandName } from '../config/brand'
import { HADITH_COUNT } from '../data/siteStats'
import { INDEXABLE } from '../seo/routes'
import '../styles/AboutPage.css'

// ── Ayə: api.alquran.cloud-dan gətirilir (yaddaşdan yazılmır) ──
// Nəşrlər QuranPage/JamaatPage ilə eyni; ərəbcədə yalnız ərəb mətni.
// Keş açarı və formatı JamaatPage ilə eynidir — eyni sessiyada bir dəfə yüklənir.
const CTA_AYAH = '11:88'
const VERSE_EDITIONS = { az: 'az.mammadaliyev', en: 'en.asad', ru: 'ru.kuliev', tr: 'tr.diyanet' }
const ARABIC_EDITION = 'quran-uthmani'
const VERSE_CACHE_PREFIX = 'qm_ayah_'
const VERSE_TIMEOUT_MS = 15000

function readVerse(key) {
  try {
    const raw = sessionStorage.getItem(VERSE_CACHE_PREFIX + key)
    if (!raw) return null
    const d = JSON.parse(raw)
    return d && typeof d.ar === 'string' && d.ar ? d : null
  } catch {
    return null
  }
}

function writeVerse(key, data) {
  try { sessionStorage.setItem(VERSE_CACHE_PREFIX + key, JSON.stringify(data)) } catch { /* yaddaş bağlıdır */ }
}

/** Ayəni ərəbcə + cari dilin tərcüməsi ilə qaytarır; xəta olarsa failed:true */
function useVerse(ref, lang) {
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

  return state.key === key ? state : { key, data: readVerse(key), failed: false }
}

// Ayənin "وَمَا تَوْفِيقِيٓ إِلَّا بِٱللَّهِ" hissəsini vurğulamaq üçün: mətn vəqf
// işarələrinə görə bölünür, hərəkələr atılıb "توفيق" sözü olan parça seçilir.
// Mətnin özü dəyişmir — yalnız həmin parça <span>-a alınır.
const HARAKAT = /[ً-ٰٟۖ-ۭ]/g
function splitMotto(ar) {
  const parts = ar.split(/(\s*[ۖ-ۜ]\s*)/)
  const idx = parts.findIndex(p => p.replace(HARAKAT, '').includes('توفيق'))
  return { parts, idx }
}

// Surə adı dillərə görə (ayə mətni deyil — yalnız istinad)
const SURAH_HUD = { az: 'Hud', en: 'Hud', ru: 'Худ', ar: 'هود', tr: 'Hûd' }

// "Haqqımızda" mətnləri — Muslims.cc platforması haqqında (konkret məscid yox).
// Əvvəl i18n.js-dən (T.about) gəlirdi; orada məscid dövrünün ifadələri
// qalmışdı və az mətnində "Missiyanız" səhvi var idi — ona görə mətnlər
// burada, 5 dilin hamısında saxlanılır. {brand} — brend adı (config/brand.js).
const ABOUT = {
  az: {
    title: 'Haqqımızda', subtitle: '{brand} — pulsuz və reklamsız İslami platforma',
    mission: 'Missiyamız',
    missionText: 'Hər müsəlmana — harada yaşamasından asılı olmayaraq — Quranı, namaz vaxtlarını, hədis və duaları öz dilində, gözəl və diqqəti dağıtmayan mühitdə çatdırmaq.',
    values: 'Dəyərlərimiz',
    v1t: 'Etibarlılıq', v1d: 'Quran, hədis mənbələri və alimlərin əsərlərinə əsaslanan məzmun.',
    v2t: 'Pulsuz', v2d: 'Heç bir abunə, reklam və ya ödəniş yoxdur.',
    v3t: '5 dil', v3d: 'Azərbaycan, ingilis, rus, ərəb və türk dillərində.',
    v4t: 'Hər cihazda', v4d: 'Telefonda, planşetdə və kompüterdə işləyir; tətbiq kimi quraşdırmaq olar.',
  },
  en: {
    title: 'About Us', subtitle: '{brand} — a free, ad-free Islamic platform',
    mission: 'Our Mission',
    missionText: 'To bring the Quran, prayer times, hadith and duas to every Muslim — wherever they live — in their own language, in a beautiful, distraction-free environment.',
    values: 'Our Values',
    v1t: 'Reliability', v1d: 'Content based on the Quran, hadith collections and the works of scholars.',
    v2t: 'Free', v2d: 'No subscriptions, no ads, no payments.',
    v3t: '5 languages', v3d: 'In Azerbaijani, English, Russian, Arabic and Turkish.',
    v4t: 'On every device', v4d: 'Works on phones, tablets and computers, and can be installed as an app.',
  },
  ru: {
    title: 'О нас', subtitle: '{brand} — бесплатная исламская платформа без рекламы',
    mission: 'Наша миссия',
    missionText: 'Донести Коран, время намаза, хадисы и дуа до каждого мусульманина — где бы он ни жил — на его родном языке, в красивой среде без отвлечений.',
    values: 'Наши ценности',
    v1t: 'Достоверность', v1d: 'Содержание основано на Коране, сборниках хадисов и трудах учёных.',
    v2t: 'Бесплатно', v2d: 'Без подписок, рекламы и платежей.',
    v3t: '5 языков', v3d: 'На азербайджанском, английском, русском, арабском и турецком.',
    v4t: 'На любом устройстве', v4d: 'Работает на телефоне, планшете и компьютере; можно установить как приложение.',
  },
  ar: {
    title: 'عن الموقع', subtitle: '{brand} — منصة إسلامية مجانية بلا إعلانات',
    mission: 'رسالتنا',
    missionText: 'إيصال القرآن ومواقيت الصلاة والأحاديث والأدعية إلى كل مسلم — أينما كان — بلغته، في بيئة جميلة خالية من المشتتات.',
    values: 'قيمنا',
    v1t: 'الموثوقية', v1d: 'محتوى مبني على القرآن وكتب الحديث ومؤلفات العلماء.',
    v2t: 'مجاني', v2d: 'لا اشتراكات ولا إعلانات ولا مدفوعات.',
    v3t: '5 لغات', v3d: 'بالأذربيجانية والإنجليزية والروسية والعربية والتركية.',
    v4t: 'على كل جهاز', v4d: 'يعمل على الهاتف واللوحي والحاسوب، ويمكن تثبيته كتطبيق.',
  },
  tr: {
    title: 'Hakkımızda', subtitle: '{brand} — ücretsiz ve reklamsız İslami platform',
    mission: 'Misyonumuz',
    missionText: 'Kur’an’ı, namaz vakitlerini, hadisleri ve duaları her Müslümana — nerede yaşarsa yaşasın — kendi dilinde, güzel ve dikkat dağıtmayan bir ortamda ulaştırmak.',
    values: 'Değerlerimiz',
    v1t: 'Güvenilirlik', v1d: 'Kur’an, hadis kaynakları ve âlimlerin eserlerine dayanan içerik.',
    v2t: 'Ücretsiz', v2d: 'Abonelik, reklam veya ödeme yok.',
    v3t: '5 dil', v3d: 'Azerbaycan Türkçesi, İngilizce, Rusça, Arapça ve Türkçe.',
    v4t: 'Her cihazda', v4d: 'Telefonda, tablette ve bilgisayarda çalışır; uygulama olarak yüklenebilir.',
  },
}

// Saytı hazırlayan — bir nəfər; əvvəl eyni ad üç fərqli vəzifə ilə üç dəfə
// göstərilirdi. Bir nəfər, bir vəzifə.
const BUILT_BY = {
  az: 'Saytı hazırlayan', en: 'Built by', ru: 'Сайт подготовил', ar: 'أعدّ الموقع', tr: 'Siteyi hazırlayan',
}
const DEV_ROLE = {
  az: 'Saytın tərtibatçısı', en: 'Website developer', ru: 'Разработчик сайта', ar: 'مطوّر الموقع', tr: 'Site geliştiricisi',
}

const READ_QURAN = { az: 'Quran oxu', en: 'Read the Quran', ru: 'Читать Коран', ar: 'اقرأ القرآن', tr: "Kur'an oku" }

export function AboutPage({ setPage }) {
  const { lang } = useLang()
  const t = ABOUT[lang] || ABOUT.en
  const brand = brandName(lang)
  const verse = useVerse(CTA_AYAH, lang)

  // tone — telefonda ikon kafelinin rəngi (motion.css → .icon-tile--*)
  const values = [
    { icon:'📖', tone:'',       title:t.v1t, desc:t.v1d },
    { icon:'💚', tone:'teal',   title:t.v2t, desc:t.v2d },
    { icon:'🌐', tone:'blue',   title:t.v3t, desc:t.v3d },
    { icon:'📱', tone:'gold',   title:t.v4t, desc:t.v4d },
  ]

  const member = { initials:'EA', name:'Elchin Abdullayev', role: DEV_ROLE[lang] || DEV_ROLE.en }

  const stats = [
    // Bölmə sayı — sitemap-a düşən (indekslənən) səhifələr, seo/routes.js-dən;
    // yeni bölmə əlavə olunanda rəqəm özü dəyişir
    { num:String(INDEXABLE.length), label: lang==='az'?'Bölmə': lang==='ru'?'Разделов': lang==='ar'?'أقسام': lang==='tr'?'Bölüm':'Sections' },
    { num:'5',   label: lang==='az'?'Dil': lang==='ru'?'Языков': lang==='ar'?'لغات': lang==='tr'?'Dil':'Languages' },
    // Ana səhifə ilə eyni rəqəm (data/siteStats.js — təkrarsız 1394 hədis)
    { num:`${HADITH_COUNT}+`, label: lang==='az'?'Hədis': lang==='ru'?'Хадисов': lang==='ar'?'حديث': lang==='tr'?'Hadis':'Hadiths' },
    { num:'99',  label: lang==='az'?'Allahın Adı': lang==='ru'?'Имён Аллаха': lang==='ar'?'اسم لله': lang==='tr'?"Allah'ın İsmi":'Names of Allah' },
  ]

  const ayahRef = lang === 'ar' ? `${SURAH_HUD.ar} ١١:٨٨` : `${SURAH_HUD[lang] || SURAH_HUD.en} 11:88`
  const motto = verse.data ? splitMotto(verse.data.ar) : null

  return (
    <>
      <div className="page-hero theme-about hero-compact">
        {/* Ərəbcə dekorativ başlıq ar dilində h1-i təkrarlamasın */}
        {lang !== 'ar' && <div className="page-hero-arabic">{BRAND.arabicMotto}</div>}
        <h1>{t.title}</h1>
        <p>{t.subtitle.replace('{brand}', brand)}</p>
      </div>

      <div className="section">
        <div className="section-inner">
          {/* Mission */}
          <div className="about-mission">
            <div className="about-mission-icon" aria-hidden="true">☽</div>
            <div className="about-mission-body">
              <h2>{t.mission}</h2>
              <p>{t.missionText}</p>
            </div>
          </div>

          {/* Stats — sürüşəndə növbə ilə görünür (motion.css → data-reveal) */}
          <div className="about-stats" data-reveal="stagger">
            {stats.map((s,i) => (
              <div key={i} className="about-stat">
                <span className="about-stat-num">{s.num}</span>
                <span className="about-stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Values */}
          <div className="section-header about-block-head">
            <h2 className="section-title">{t.values}</h2>
          </div>
          {/* Telefonda qruplaşdırılmış siyahı xanaları, geniş ekranda 2×2 kart */}
          <div className="about-values" data-reveal="stagger">
            {values.map((v,i) => (
              <div key={i} className="about-value-card">
                <div className={`about-value-icon icon-tile${v.tone ? ` icon-tile--${v.tone}` : ''}`} aria-hidden="true">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>

          {/* Saytı hazırlayan */}
          <div className="section-header about-block-head about-team-head">
            <h2 className="section-title">{BUILT_BY[lang] || BUILT_BY.en}</h2>
          </div>
          <div className="about-team" data-reveal>
            <div className="about-team-card">
              <div className="team-avatar" aria-hidden="true">{member.initials}</div>
              <div className="team-name">{member.name}</div>
              <div className="team-role">{member.role}</div>
            </div>
          </div>

          {/* CTA — ayə API-dən; alınmasa ayə sətirləri gizlənir, düymə qalır */}
          <div className="about-cta" data-reveal>
            {verse.data ? (
              <figure className="about-cta-verse">
                <blockquote className="about-cta-arabic" lang="ar" dir="rtl">
                  {motto.idx >= 0
                    ? motto.parts.map((p, i) => (i === motto.idx ? <span key={i} className="about-cta-motto">{p}</span> : p))
                    : verse.data.ar}
                </blockquote>
                {verse.data.text && <p className="about-cta-translation">{verse.data.text}</p>}
                <figcaption className="about-cta-ref">
                  — {ayahRef}{verse.data.tname ? ` · ${verse.data.tname}` : ''}
                </figcaption>
              </figure>
            ) : !verse.failed ? (
              <div className="about-cta-skeleton" aria-hidden="true">
                <span className="skeleton skeleton--text" /><span className="skeleton skeleton--text" /><span className="skeleton skeleton--text" />
              </div>
            ) : null}
            <button className="btn-primary" onClick={() => { setPage('quran'); window.scrollTo({top:0,behavior:'smooth'}) }}>
              📖 {READ_QURAN[lang] || READ_QURAN.en}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
