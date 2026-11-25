import { lazy, Suspense, useCallback, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { BRAND, filled, tr, brandName } from '../config/brand'
import { navLabel, navGroupLabel } from '../data/navigation'
import { pathFor } from '../seo/routes'
import Icon, { BrandMark } from './Icon'
import LangMarquee, { MARQUEE_LANGS } from './LangMarquee'
import DeferRender from './DeferRender'
import { LEGAL_KEYS, LEGAL_TITLES, legalPath, isRouted } from './legalLinks'
import '../styles/Footer.css'
import { pickUi } from '../utils/uiText'

// "Məlumatlarım" (ehtiyat nüsxə / bərpa) — dialoq yalnız açılanda yüklənir
const BackupDialog = lazy(() => import('./BackupDialog'))

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
  az: { legal:'Hüquqi məlumat', nav:'Saytın bölmələri', content:'Məzmun', tools:'Alətlər', learn:'Öyrən', contact:'Əlaqə', copy:'Bütün hüquqlar qorunur.', made:'Ümmət üçün sevgi ilə hazırlandı', backup:'Məlumatlarım', close:'Bağla', langs:'Dillər' },
  en: { legal:'Legal', nav:'Site sections', content:'Content', tools:'Tools', learn:'Learn', contact:'Contact', copy:'All rights reserved.', made:'Made with love for the Ummah', backup:'My data', close:'Close', langs:'Languages' },
  ru: { legal:'Правовая информация', nav:'Разделы сайта', content:'Материалы', tools:'Инструменты', learn:'Обучение', contact:'Контакты', copy:'Все права защищены.', made:'Сделано с любовью для уммы', backup:'Мои данные', close:'Закрыть', langs:'Языки' },
  ar: { legal:'معلومات قانونية', nav:'أقسام الموقع', content:'المحتوى', tools:'أدوات', learn:'تعلّم', contact:'تواصل', copy:'جميع الحقوق محفوظة.', made:'صُنع بحبّ للأمة', backup:'بياناتي', close:'إغلاق', langs:'اللغات' },
  tr: { legal:'Yasal bilgiler', nav:'Site bölümleri', content:'İçerik', tools:'Araçlar', learn:'Öğren', contact:'İletişim', copy:'Tüm hakları saklıdır.', made:'Ümmet için sevgiyle yapıldı', backup:'Verilerim', close:'Kapat', langs:'Diller' },
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
  const fl = pickUi(FOOTER_LABELS, lang)
  const [backupOpen, setBackupOpen] = useState(false)
  const closeBackup = useCallback(() => setBackupOpen(false), [])
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
      {/* Footer A (2026-11-24): sakit "kitabxana" — səhifə rəngində; yuxarıda ortadan kənarlara
          açılan qızılı xətt (görünəndə bir dəfə — data-reveal="line", Footer.css), zəif xatəm
          naxışı yuxarıdan solur. Tünd CTA zolağı YOXDUR — saytda tək CTA ana səhifədədir (CTA B). */}
      <span className="ft-line" data-reveal="line" aria-hidden="true" />
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
              <h2>{navGroupLabel('main', lang)}</h2>
              {MAIN_LINKS.map(key => navLink(key))}
            </div>
            {LINK_COLUMNS.map(col => (
              <div className="ft-col" key={col.title}>
                <h2>{fl[col.title]}</h2>
                {col.keys.map(key => navLink(key))}
              </div>
            ))}
            <div className="ft-col">
              <h2>{fl.contact}</h2>
              {filled(BRAND.instagram) && (
                <a href={`https://instagram.com/${BRAND.instagram}`} target="_blank" rel="noopener noreferrer"><Icon name="instagram" size={16} /><span>Instagram</span></a>
              )}
              {navLink('about')}
            </div>
          </nav>

        </div>
      </div>

      {/* Saytın bütün dilləri — öz adları ilə sürüşən zolaq */}
      <div className="vx-ft-langs">
        <div className="vx-ft-langs__head"><Icon name="globe" size={16} /> {fl.langs} · <b>{MARQUEE_LANGS.length}</b></div>
        {/* 50 dil zolağı (~400 DOM düyünü) — footer-ə yaxınlaşanda / boş vaxtda (v5.4) */}
        <DeferRender height="112px" rootMargin="800px 0px" delay={2500}><LangMarquee label={fl.langs} /></DeferRender>
      </div>

      <div className="ft-bottom-wrap">
        <div className="ft-bottom" data-reveal="fade">
          <p>{`© ${new Date().getFullYear()} ${brand} — ${fl.copy}`}</p>
          {/* Hüquqi sənədlər — həqiqi <a href>; marşrut routes.js-də varsa adi klik SPA ilə */}
          <nav className="ft-legal" aria-label={fl.legal}>
            {LEGAL_KEYS.map(k => (
              <a
                key={k}
                href={legalPath(k, lang)}
                onClick={(e) => { if (isRouted(k) && isPlainClick(e)) { e.preventDefault(); goTo(k) } }}
              >{tr(LEGAL_TITLES[k], lang)}</a>
            ))}
            <button type="button" className="ft-backup" onClick={() => setBackupOpen(true)} aria-haspopup="dialog">
              <Icon name="shield" size={14} /> {fl.backup}
            </button>
          </nav>
          {backupOpen && (
            <Suspense fallback={null}>
              <BackupDialog onClose={closeBackup} closeLabel={fl.close} />
            </Suspense>
          )}
          <span className="ft-made"><Icon name="donate" size={14} className="ft-heart" /> {fl.made}</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
