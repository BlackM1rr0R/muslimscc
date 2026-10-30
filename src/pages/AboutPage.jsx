import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { BRAND, brandName, tr } from '../config/brand'
import { HADITH_COUNT } from '../data/siteStats'
import { INDEXABLE } from '../seo/routes'
import Icon, { BrandMark } from '../components/Icon'
import '../styles/AboutPage.css'
import PageLink from '../components/PageLink'

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
    manhaj: 'Mənhəcimiz',
    manhajText: 'Saytımızdakı dini məzmun Quran və səhih Sünnəyə, səhabələrin və onlara gözəl şəkildə tabe olan ilk nəsillərin — Sələfi-salehin anlayışına əsaslanır (Tövbə 9:100; Buxari 2652). Əqidədə Allahın adlarını və sifətlərini təhrif, təətil, keyfiyyət soruşmaq və bənzətmə olmadan isbat edirik; ibadətdə Peyğəmbərin ﷺ sünnəsinə tabe olub bidətlərdən çəkinirik. Fiqhi məsələlərdə dəlilə əsaslanan görüşləri İbn Baz, İbn Useymin, Albani və Daimi Fətva Komitəsi kimi alimlərin şərhlərinə istinadla təqdim edirik. Bütün müsəlmanlara hörmətlə yanaşırıq; bir səhvimizi görsəniz, bizə bildirməyinizi xahiş edirik.',
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
    manhaj: 'Our Methodology',
    manhajText: 'The religious content on our site is based on the Quran and the authentic Sunnah, as understood by the Companions and the early generations who followed them in goodness — the Salaf as-Salih (At-Tawbah 9:100; Bukhari 2652). In creed, we affirm Allah\'s Names and Attributes without distortion, denial, asking how, or likening Him to creation; in worship, we follow the Sunnah of the Prophet ﷺ and avoid innovations. In matters of fiqh, we present evidence-based positions with reference to the explanations of scholars such as Ibn Baz, Ibn Uthaymeen, al-Albani and the Permanent Committee for Fatwa. We treat all Muslims with respect; if you notice a mistake, please let us know.',
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
    manhaj: 'Наш путь (манхадж)',
    manhajText: 'Религиозное содержание нашего сайта основано на Коране и достоверной Сунне в понимании сподвижников и первых поколений, последовавших за ними в добре, — праведных предшественников (ас-саляф ас-салих) (ат-Тауба 9:100; Бухари 2652). В вероубеждении мы утверждаем имена и атрибуты Аллаха без искажения, отрицания, вопроса «как» и уподобления творению; в поклонении следуем Сунне Пророка ﷺ и избегаем нововведений. В вопросах фикха мы приводим мнения, основанные на доводах, со ссылкой на разъяснения таких учёных, как Ибн Баз, Ибн Усеймин, аль-Альбани и Постоянный комитет по фетвам. Мы относимся ко всем мусульманам с уважением; если вы заметили ошибку, пожалуйста, сообщите нам.',
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
    manhaj: 'منهجنا',
    manhajText: 'يقوم المحتوى الديني في موقعنا على القرآن الكريم والسنة الصحيحة بفهم الصحابة ومن تبعهم بإحسان من القرون الأولى — السلف الصالح (التوبة: 100؛ البخاري 2652). ففي الاعتقاد نثبت أسماء الله وصفاته من غير تحريف ولا تعطيل ولا تكييف ولا تمثيل، وفي العبادة نتبع سنة النبي ﷺ ونجتنب البدع. وفي المسائل الفقهية نعرض الأقوال المبنية على الدليل مع الإحالة إلى شروح العلماء كابن باز وابن عثيمين والألباني واللجنة الدائمة للإفتاء. ونحترم جميع المسلمين، وإن رأيتم خطأً فنرجو أن تنبهونا إليه.',
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
    manhaj: 'Menhecimiz',
    manhajText: 'Sitemizdeki dinî içerik, Kur’an’a ve sahih Sünnet’e, sahabenin ve onlara güzellikle tabi olan ilk nesillerin — Selef-i Salihin’in anlayışına dayanır (Tevbe 9:100; Buhari 2652). Akidede Allah’ın isim ve sıfatlarını tahrif, tatil, keyfiyet sormak ve benzetme olmadan ispat ederiz; ibadette Peygamber’in ﷺ sünnetine uyar, bidatlerden sakınırız. Fıkhî meselelerde delile dayanan görüşleri İbn Baz, İbn Useymin, Elbânî ve Daimî Fetva Komitesi gibi âlimlerin açıklamalarına atıfla sunarız. Bütün Müslümanlara saygıyla yaklaşırız; bir hatamızı görürseniz bize bildirmenizi rica ederiz.',
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

  // Dəyərlər — xətti ikonlar (Icon.jsx), hamısı eyni brend tonunda
  const values = [
    { icon:'quran',  title:t.v1t, desc:t.v1d },
    { icon:'donate', title:t.v2t, desc:t.v2d },
    { icon:'globe',  title:t.v3t, desc:t.v3d },
    { icon:'phone',  title:t.v4t, desc:t.v4d },
  ]

  // Ad hüquqi səhifələrdəki ilə eyni mənbədən (brand.js → legal.operator):
  // az/tr-də "Elçin", ru-da kirillə — əvvəl hər dildə "Elchin" yazılırdı
  const memberName = tr(BRAND.legal.operator, lang) || 'Elchin Abdullayev'
  const initials = memberName.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const member = { initials, name: memberName, role: DEV_ROLE[lang] || DEV_ROLE.en }

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
    <div className="ab-root">
      <header className="ui-page-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          {/* Latın brend adı BÖYÜK hərflə az/tr lokalında "MUSLİMS.CC" (nöqtəli İ) olurdu — lang="en" */}
          <span className="ui-eyebrow ab-brand" lang={/^[A-Za-z]/.test(brand) ? 'en' : undefined}>{brand}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.subtitle.replace('{brand}', brand)}</p>
          {/* Ərəbcə dekorativ şüar ar dilində h1-i təkrarlamasın */}
          {lang !== 'ar' && <p className="ab-hero-ar ui-arabic" lang="ar" dir="rtl">{BRAND.arabicMotto}</p>}
        </div>
      </header>

      <section className="ui-section ab-intro">
        <div className="ui-container ab-intro-grid">
          {/* Missiya */}
          <article className="ui-card ab-mission" data-reveal>
            <BrandMark size={52} className="ab-mission-mark" />
            <div className="ab-mission-body">
              <h2 className="ui-title ui-title--sm">{t.mission}</h2>
              <p>{t.missionText}</p>
            </div>
          </article>

          {/* Rəqəmlər — sürüşəndə növbə ilə görünür */}
          <dl className="ui-card ab-stats" data-reveal="stagger">
            {stats.map((s,i) => (
              <div key={i} className="ab-stat">
                <dt className="ui-stat__label">{s.label}</dt>
                {/* Təmiz rəqəm sayğacla (data-count) sayılır; "1250+" olduğu kimi qalır */}
                <dd className="ui-stat__num ab-stat-num">{/^\d+$/.test(s.num) ? <span data-count={s.num}>{s.num}</span> : s.num}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Mənhəc — saytın Sələf mənhəcinə əsaslandığını bildirir (Tövbə 9:100; Buxari 2652) */}
      <section className="ui-section ab-manhaj-sec" aria-labelledby="ab-manhaj-title">
        <div className="ui-container">
          <article className="ui-card ab-manhaj" data-reveal>
            <h2 id="ab-manhaj-title" className="ui-title ui-title--sm">{t.manhaj}</h2>
            <p>{t.manhajText}</p>
          </article>
        </div>
      </section>

      <section className="ui-section ui-section--alt ab-values-sec" aria-labelledby="ab-values-title">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <h2 id="ab-values-title" className="ui-title">{t.values}</h2>
          </div>
          <div className="ui-grid ab-values" data-reveal="stagger-zoom">
            {values.map((v,i) => (
              <article key={i} className="ui-card ab-value">
                <span className="ui-icon-tile" aria-hidden="true"><Icon name={v.icon} /></span>
                <h3 className="ui-card__title">{v.title}</h3>
                <p className="ui-card__text">{v.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ui-section ab-end" aria-labelledby="ab-team-title">
        <div className="ui-container ab-end-grid">
          {/* CTA — ayə API-dən; alınmasa ayə sətirləri gizlənir, düymə qalır */}
          <div className="ui-card ui-card--inverse ab-cta" data-reveal="scale">
            <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
            {verse.data ? (
              <figure className="ab-cta-verse">
                <blockquote className="ab-cta-arabic" lang="ar" dir="rtl">
                  {motto.idx >= 0
                    ? motto.parts.map((p, i) => (i === motto.idx ? <span key={i} className="ab-cta-motto">{p}</span> : p))
                    : verse.data.ar}
                </blockquote>
                {verse.data.text && <p className="ab-cta-translation">{verse.data.text}</p>}
                <figcaption className="ab-cta-ref">
                  — {ayahRef}{verse.data.tname ? ` · ${verse.data.tname}` : ''}
                </figcaption>
              </figure>
            ) : !verse.failed ? (
              <div className="ab-cta-skeleton" aria-hidden="true">
                <span className="skeleton skeleton--text" /><span className="skeleton skeleton--text" /><span className="skeleton skeleton--text" />
              </div>
            ) : null}
            <PageLink className="ui-btn ui-btn--inverse ui-btn--lg" to="quran" setPage={setPage} onNavigate={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Icon name="quran" className="ui-btn__icon" /> {READ_QURAN[lang] || READ_QURAN.en}
            </PageLink>
          </div>
          {/* Saytı hazırlayan */}
          <div className="ab-team" data-reveal>
            <h2 id="ab-team-title" className="ui-eyebrow">{BUILT_BY[lang] || BUILT_BY.en}</h2>
            <div className="ui-card ab-team-card">
              <div className="ab-avatar" aria-hidden="true">{member.initials}</div>
              <div>
                <div className="ab-team-name">{member.name}</div>
                <div className="ab-team-role">{member.role}</div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}
