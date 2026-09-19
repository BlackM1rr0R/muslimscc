import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import { BRAND, MOSQUE, filled, tr, brandName } from '../config/mosque'
import { navLabel, navIcon, navGroupLabel } from '../data/navigation'
import { pathFor } from '../seo/routes'
import '../styles/Footer.css'

// Footer linkləri həqiqi <a href> linkləridir (başlıq, yan panel və aşağı
// zolaq kimi): Ctrl/⌘/orta klik yeni tabda açır, robotlar da görür;
// adi klikdə SPA naviqasiyası işləyir. Loqo da klaviatura ilə açılır.

/** Adi sol klikdirmi? (Ctrl/⌘/orta klik — brauzer linki yeni tabda açsın) */
function isPlainClick(e) {
  return !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
}

// copy — yalnız hüquq mətni; "© {il} {brend}" hissəsi dinamik qurulur
// nav — footer naviqasiyasının ekran oxuyucu adı
const FOOTER_LABELS = {
  az: { nav:'Saytın bölmələri', quickLinks:'Əsas', tools:'Alətlər', learn:'Öyrən', contact:'Əlaqə', copy:'Bütün hüquqlar qorunur.', made:'Camaatımız üçün 💚 ilə hazırlandı', desc:'Qaraçuxur Məscidinin saytı — namaz vaxtları, camaat namazı, elanlar və İslami bilik.', map:'Xəritədə bax' },
  en: { nav:'Site sections', quickLinks:'Main', tools:'Tools', learn:'Learn', contact:'Contact', copy:'All rights reserved.', made:'Made with 💚 for our congregation', desc:'The website of Garachukhur Mosque — prayer times, congregational prayers, announcements and Islamic knowledge.', map:'View on map' },
  ru: { nav:'Разделы сайта', quickLinks:'Основное', tools:'Инструменты', learn:'Обучение', contact:'Контакт', copy:'Все права защищены.', made:'Сделано с 💚 для нашей общины', desc:'Сайт мечети Карачухур — время намаза, коллективные молитвы, объявления и исламские знания.', map:'Открыть на карте' },
  ar: { nav:'أقسام الموقع', quickLinks:'الرئيسية', tools:'أدوات', learn:'تعلم', contact:'تواصل', copy:'جميع الحقوق محفوظة.', made:'صُنع بـ 💚 لجماعتنا', desc:'موقع مسجد قاراچوخور — مواقيت الصلاة وصلاة الجماعة والإعلانات والمعرفة الإسلامية.', map:'عرض على الخريطة' },
  tr: { nav:'Site bölümleri', quickLinks:'Ana', tools:'Araçlar', learn:'Öğren', contact:'İletişim', copy:'Tüm hakları saklıdır.', made:'Cemaatimiz için 💚 ile yapıldı', desc:"Karaçuhur Camii'nin web sitesi — namaz vakitleri, cemaat namazları, duyurular ve İslami bilgi.", map:'Haritada gör' },
}

// Sosial şəbəkə ikonları — yalnız MOSQUE.social-da doldurulanlar göstərilir
const SOCIAL_LABELS = { instagram:'Instagram', facebook:'Facebook', youtube:'YouTube', telegram:'Telegram' }

// "Məscid" sütunu — adlar və ikonlar src/data/navigation.js-dən (bölmələr paneli ilə eyni)
const MOSQUE_LINKS = ['mosque', 'jamaat', 'announcements', 'donate']

// Digər sütunlar — əvvəlki kimi, amma adlar da navigation.js-dən gəlir ki,
// 5 dilin hamısında düzgün olsun (əvvəl ingiliscə səhifədə "Hədis", "99 Ad" çıxırdı)
const LINK_COLUMNS = [
  { title: 'quickLinks', keys: ['quran', 'hadith', 'videos', 'books', 'aichat', 'prayer', 'duas', 'names'] },
  { title: 'tools',      keys: ['dhikr', 'qibla', 'zakat', 'calendar', 'hifz'] },
  { title: 'learn',      keys: ['quiz', 'prayerguide', 'glossary', 'holyplaces', 'kids'] },
]

function Footer({ setPage }) {
  const { lang } = useLang()
  const fl = FOOTER_LABELS[lang] || FOOTER_LABELS.az
  const brand = brandName(lang)
  // az: "Qaraçuxur" + vurğulu "Məscidi"; digər dillərdə tam ad
  const brandSplit = lang === 'az' ? brand.lastIndexOf(' ') : -1
  const address = tr(MOSQUE.address, lang)
  const socials = Object.entries(MOSQUE.social).filter(([, url]) => filled(url))

  const goTo = (p) => { setPage(p); window.scrollTo({ top:0, behavior:'smooth' }) }

  // Bölmə linki: href həqiqi ünvandır, adi klik SPA ilə keçir
  const navLink = (k) => (
    <a
      key={k}
      href={pathFor(k, lang)}
      onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); goTo(k) } }}
    >
      <span className="ft-link-icon" aria-hidden="true">{navIcon(k)}</span>
      <span>{navLabel(k, lang)}</span>
    </a>
  )

  return (
    <footer className="footer">
      <div className="ft-main">
        <div className="ft-inner">

          {/* Brand */}
          <div className="ft-brand">
            <a
              className="ft-logo"
              href={pathFor('home', lang)}
              onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); goTo('home') } }}
            >
              <span className="ft-logo-icon" aria-hidden="true">☽</span>
              <span className="ft-logo-text">
                {brandSplit > 0
                  ? <>{brand.slice(0, brandSplit)} <span>{brand.slice(brandSplit + 1)}</span></>
                  : brand}
              </span>
            </a>
            <p className="ft-desc">{fl.desc}</p>
            <div className="ft-arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
          </div>

          {/* Links columns */}
          <nav className="ft-links" aria-label={fl.nav}>
            <div className="ft-col">
              <h4>{navGroupLabel('mosque', lang)}</h4>
              {MOSQUE_LINKS.map(key => navLink(key))}
            </div>
            {LINK_COLUMNS.map(col => (
              <div className="ft-col" key={col.title}>
                <h4>{fl[col.title]}</h4>
                {col.keys.map(key => navLink(key))}
              </div>
            ))}
            <div className="ft-col">
              <h4>{fl.contact}</h4>
              {/* Məscid məlumatları yalnız doldurulubsa göstərilir — bax: src/config/mosque.js */}
              <span className="ft-contact-line">📍 {filled(address) ? address : tr(MOSQUE.locality, lang)}</span>
              {filled(MOSQUE.mapUrl) && (
                <a href={MOSQUE.mapUrl} target="_blank" rel="noopener noreferrer">🗺️ {fl.map}</a>
              )}
              {filled(MOSQUE.phone) && (
                <a href={`tel:${MOSQUE.phone.replace(/[^\d+]/g, '')}`}>📞 {MOSQUE.phone}</a>
              )}
              {filled(MOSQUE.email) && (
                <a href={`mailto:${MOSQUE.email}`}>✉ {MOSQUE.email}</a>
              )}
              {socials.map(([key, url]) => (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer">🔗 {SOCIAL_LABELS[key] || key}</a>
              ))}
              <span className="ft-contact-line">🌐 {BRAND.domain}</span>
              {navLink('about')}
            </div>
          </nav>

        </div>
      </div>

      <div className="ft-bottom">
        <p>{`© ${new Date().getFullYear()} ${brand} — ${fl.copy}`}</p>
        <span className="ft-made">{fl.made}</span>
      </div>
    </footer>
  )
}

export default Footer
