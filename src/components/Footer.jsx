import { useLang } from '../contexts/LangContext'
import { BRAND, filled, tr, brandName } from '../config/brand'
import { navLabel, navGroupLabel } from '../data/navigation'
import { pathFor } from '../seo/routes'
import Icon, { BrandMark } from './Icon'
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
// made — emoji (💚) əvəzinə mətn + xətti ürək ikonu (dizayn sistemi: emoji yox)
// Təsvir (desc) brend konfiqindən gəlir — BRAND.tagline
const FOOTER_LABELS = {
  az: { nav:'Saytın bölmələri', content:'Məzmun', tools:'Alətlər', learn:'Öyrən', contact:'Əlaqə', copy:'Bütün hüquqlar qorunur.', made:'Ümmət üçün sevgi ilə hazırlandı' },
  en: { nav:'Site sections', content:'Content', tools:'Tools', learn:'Learn', contact:'Contact', copy:'All rights reserved.', made:'Made with love for the Ummah' },
  ru: { nav:'Разделы сайта', content:'Материалы', tools:'Инструменты', learn:'Обучение', contact:'Контакты', copy:'Все права защищены.', made:'Сделано с любовью для уммы' },
  ar: { nav:'أقسام الموقع', content:'المحتوى', tools:'أدوات', learn:'تعلّم', contact:'تواصل', copy:'جميع الحقوق محفوظة.', made:'صُنع بحبّ للأمة' },
  tr: { nav:'Site bölümleri', content:'İçerik', tools:'Araçlar', learn:'Öğren', contact:'İletişim', copy:'Tüm hakları saklıdır.', made:'Ümmet için sevgiyle yapıldı' },
}

// "Əsas" sütunu — yan paneldəki "Əsas" qrupu ilə eyni (ana səhifə loqodadır).
// Adlar və ikonlar src/data/navigation.js-dən gəlir.
const MAIN_LINKS = ['prayer', 'jamaat', 'announcements', 'donate']

// Digər sütunlar — adlar da navigation.js-dən gəlir ki, 5 dilin hamısında
// düzgün olsun
const LINK_COLUMNS = [
  { title: 'content', keys: ['quran', 'hadith', 'videos', 'books', 'aichat', 'duas', 'names'] },
  { title: 'tools',   keys: ['dhikr', 'qibla', 'zakat', 'calendar', 'hifz', 'mosques'] },
  { title: 'learn',   keys: ['quiz', 'prayerguide', 'glossary', 'holyplaces', 'kids'] },
]

function Footer({ setPage }) {
  const { lang } = useLang()
  const fl = FOOTER_LABELS[lang] || FOOTER_LABELS.az
  const brand = brandName(lang)
  // Domen kimi: "Muslims" + vurğulu ".cc" (başlıqdakı loqo kimi)
  const brandSplit = brand.lastIndexOf('.')

  const goTo = (p) => { setPage(p); window.scrollTo({ top:0, behavior:'smooth' }) }

  // Bölmə linki: href həqiqi ünvandır, adi klik SPA ilə keçir
  const navLink = (k) => (
    <a
      key={k}
      href={pathFor(k, lang)}
      onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); goTo(k) } }}
    >
      {/* v2: footer linkləri sakit mətndir — emoji ikonlar götürülüb */}
      <span>{navLabel(k, lang)}</span>
    </a>
  )

  return (
    <footer className="footer">
      {/* Xatəm naxışı — çox sakit, yalnız bəzək (ui.css → .ui-pattern) */}
      <div className="ui-pattern ft-pattern" aria-hidden="true" />
      <div className="ft-main">
        <div className="ft-inner">

          {/* Brand */}
          <div className="ft-brand" data-reveal>
            <a
              className="ft-logo"
              href={pathFor('home', lang)}
              onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); goTo('home') } }}
            >
              <span className="ft-logo-icon" aria-hidden="true"><BrandMark size={36} /></span>
              <span className="ft-logo-text">
                {brandSplit > 0
                  ? <>{brand.slice(0, brandSplit)}<span>{brand.slice(brandSplit)}</span></>
                  : brand}
              </span>
            </a>
            <p className="ft-desc">{tr(BRAND.tagline, lang)}</p>
            <div className="ft-arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
          </div>

          {/* Links columns */}
          {/* Sütunlar görünəndə növbə ilə qalxır (motion.css → data-reveal="stagger") */}
          <nav className="ft-links" aria-label={fl.nav} data-reveal="stagger">
            <div className="ft-col">
              <h4>{navGroupLabel('main', lang)}</h4>
              {MAIN_LINKS.map(key => navLink(key))}
            </div>
            {LINK_COLUMNS.map(col => (
              <div className="ft-col" key={col.title}>
                <h4>{fl[col.title]}</h4>
                {col.keys.map(key => navLink(key))}
              </div>
            ))}
            <div className="ft-col">
              <h4>{fl.contact}</h4>
              {filled(BRAND.instagram) && (
                <a href={`https://instagram.com/${BRAND.instagram}`} target="_blank" rel="noopener noreferrer"><Icon name="instagram" size={16} /><span>Instagram</span></a>
              )}
              <span className="ft-contact-line"><Icon name="globe" size={16} /> {BRAND.domain}</span>
              {navLink('about')}
            </div>
          </nav>

        </div>
      </div>

      <div className="ft-bottom-wrap">
        <div className="ft-bottom" data-reveal="fade">
          <p>{`© ${new Date().getFullYear()} ${brand} — ${fl.copy}`}</p>
          <span className="ft-made"><Icon name="donate" size={14} className="ft-heart" /> {fl.made}</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
