import { useState, useEffect, useRef } from "react";
import { useLang } from "../contexts/LangContext";
import "../styles/Header.css";

const LANGS = [
  { code: "az", label: "AZ", native: "Azərbaycanca", flag: "🇦🇿" },
  { code: "en", label: "EN", native: "English",       flag: "🇬🇧" },
  { code: "ru", label: "RU", native: "Русский",        flag: "🇷🇺" },
  { code: "ar", label: "AR", native: "العربية",         flag: "🇸🇦" },
  { code: "tr", label: "TR", native: "Türkçe",          flag: "🇹🇷" },
];

const NAV_LABELS = {
  az: {
    home: "Ana Səhifə", quran: "Quran", hadith: "Hədis",
    prayer: "Namaz", duas: "Dualar", dhikr: "Zikr",
    names: "99 Ad", calendar: "Təqvim", zakat: "Zəkat",
    qibla: "Qiblə", quiz: "Kviz", glossary: "Lüğət",
    prayerguide: "Namaz Öyrən", hifz: "Hifz", kids: "Uşaqlar", holyplaces: "Müqəddəs Yerlər",
    dailytracker: "Gündəlik", qurangame: "Quran Oyun", charity: "Sədəqə", hajjguide: "Həcc/Ümrə", quotes: "Sitatlar",
    duajournal: "Dua Gündəliyi", mosques: "Məscidlər", history: "Tarix", sahaba: "Səhabələr", analytics: "Statistika",
    about: "Haqqında", cta: "Dua et",
  },
  en: {
    home: "Home", quran: "Quran", hadith: "Hadith",
    prayer: "Prayer", duas: "Du'as", dhikr: "Dhikr",
    names: "99 Names", calendar: "Calendar", zakat: "Zakat",
    qibla: "Qibla", quiz: "Quiz", glossary: "Glossary",
    prayerguide: "Learn Prayer", hifz: "Hifz", kids: "Kids", holyplaces: "Holy Places",
    dailytracker: "Daily", qurangame: "Quran Game", charity: "Charity", hajjguide: "Hajj/Umrah", quotes: "Quotes",
    duajournal: "Dua Journal", mosques: "Mosques", history: "History", sahaba: "Companions", analytics: "Analytics",
    about: "About", cta: "Make Du'a",
  },
  ru: {
    home: "Главная", quran: "Коран", hadith: "Хадисы",
    prayer: "Намаз", duas: "Дуа", dhikr: "Зикр",
    names: "99 Имён", calendar: "Календарь", zakat: "Закят",
    qibla: "Кибла", quiz: "Викторина", glossary: "Словарь",
    prayerguide: "Учись молиться", hifz: "Хифз", kids: "Дети", holyplaces: "Святые места",
    dailytracker: "Ежедневно", qurangame: "Игра Коран", charity: "Садака", hajjguide: "Хадж/Умра", quotes: "Цитаты",
    duajournal: "Дневник дуа", mosques: "Мечети", history: "История", sahaba: "Сахабы", analytics: "Аналитика",
    about: "О нас", cta: "Сделать дуа",
  },
  ar: {
    home: "الرئيسية", quran: "القرآن", hadith: "الحديث",
    prayer: "الصلاة", duas: "الأدعية", dhikr: "الذكر",
    names: "٩٩ اسم", calendar: "التقويم", zakat: "الزكاة",
    qibla: "القبلة", quiz: "اختبار", glossary: "معجم",
    prayerguide: "تعلم الصلاة", hifz: "الحفظ", kids: "أطفال", holyplaces: "أماكن مقدسة",
    dailytracker: "يومي", qurangame: "لعبة القرآن", charity: "صدقة", hajjguide: "الحج/العمرة", quotes: "اقتباسات",
    duajournal: "مذكرة الدعاء", mosques: "المساجد", history: "التاريخ", sahaba: "الصحابة", analytics: "الإحصائيات",
    about: "عن الموقع", cta: "ادعُ الله",
  },
  tr: {
    home: "Ana Sayfa", quran: "Kur'an", hadith: "Hadis",
    prayer: "Namaz", duas: "Dualar", dhikr: "Zikir",
    names: "99 İsim", calendar: "Takvim", zakat: "Zekât",
    qibla: "Kıble", quiz: "Quiz", glossary: "Sözlük",
    prayerguide: "Namaz Öğren", hifz: "Hıfz", kids: "Çocuklar", holyplaces: "Kutsal Yerler",
    dailytracker: "Günlük", qurangame: "Kuran Oyun", charity: "Sadaka", hajjguide: "Hac/Umre", quotes: "Alıntılar",
    duajournal: "Dua Günlüğü", mosques: "Camiler", history: "Tarih", sahaba: "Sahabeler", analytics: "İstatistikler",
    about: "Hakkımızda", cta: "Dua Et",
  },
};

const MORE_LABEL = { az:'Daha çox', en:'More', ru:'Ещё', ar:'المزيد', tr:'Daha fazla' };
const MOBILE_SECTIONS = {
  az: ['Əsas','Alətlər','Öyrən','Digər'],
  en: ['Main','Tools','Learn','Other'],
  ru: ['Основное','Инструменты','Обучение','Другое'],
  ar: ['الرئيسية','أدوات','تعلم','أخرى'],
  tr: ['Ana','Araçlar','Öğren','Diğer'],
};

function Header({ currentPage, setPage }) {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [langOpen,    setLangOpen]    = useState(false);
  const [moreOpen,    setMoreOpen]    = useState(false);
  const [visible,     setVisible]     = useState(false);
  const { lang, setLang: setLangCtx, dark, toggleDark } = useLang();

  const langRef = useRef(null);
  const moreRef = useRef(null);
  const t = NAV_LABELS[lang] || NAV_LABELS.az;
  const currentLang = LANGS.find(l => l.code === lang) || LANGS[0];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const changeLang = (code) => {
    setLangCtx(code);
    setLangOpen(false);
  };

  const goTo = (p) => {
    setPage(p);
    setMobileOpen(false);
    setMoreOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Desktop: əsas nav — ilk 8 item
  const mainNav = [
    { id: "home",     label: t.home,     icon: "⌂"  },
    { id: "quran",    label: t.quran,    icon: "📖" },
    { id: "hadith",   label: t.hadith,   icon: "📚" },
    { id: "prayer",   label: t.prayer,   icon: "🕌" },
    { id: "duas",     label: t.duas,     icon: "🤲" },
    { id: "dhikr",    label: t.dhikr,    icon: "📿" },
    { id: "names",    label: t.names,    icon: "⭐" },
    { id: "calendar", label: t.calendar, icon: "🌙" },
  ];

  // Videolar üçün multi-lang label
  const videosLabel = lang === 'az' ? 'Videolar' : lang === 'ru' ? 'Видео' : lang === 'ar' ? 'الفيديوهات' : lang === 'tr' ? 'Videolar' : 'Videos'
  const booksLabel  = lang === 'az' ? 'Kitablar' : lang === 'ru' ? 'Книги'  : lang === 'ar' ? 'الكتب'        : lang === 'tr' ? 'Kitaplar' : 'Books'
  const aiChatLabel = lang === 'az' ? 'AI Köməkçi' : lang === 'ru' ? 'AI помощник' : lang === 'ar' ? 'مساعد AI' : lang === 'tr' ? 'AI Asistan' : 'AI Assistant'

  // Desktop: "Daha çox" dropdown
  const moreNav = [
    { id: "aichat",       label: aiChatLabel,    icon: "🤖" },
    { id: "videos",       label: videosLabel,    icon: "📹" },
    { id: "books",        label: booksLabel,     icon: "📚" },
    { id: "zakat",        label: t.zakat,        icon: "💰" },
    { id: "qibla",        label: t.qibla,        icon: "🧭" },
    { id: "dailytracker", label: t.dailytracker, icon: "📋" },
    { id: "quiz",         label: t.quiz,         icon: "❓" },
    { id: "qurangame",    label: t.qurangame,    icon: "🎮" },
    { id: "prayerguide",  label: t.prayerguide,  icon: "🕌" },
    { id: "hajjguide",    label: t.hajjguide,    icon: "🕋" },
    { id: "hifz",         label: t.hifz,         icon: "📝" },
    { id: "charity",      label: t.charity,      icon: "💚" },
    { id: "glossary",     label: t.glossary,     icon: "📖" },
    { id: "holyplaces",   label: t.holyplaces,   icon: "🕋" },
    { id: "quotes",       label: t.quotes,       icon: "🖼️" },
    { id: "duajournal",   label: t.duajournal,   icon: "📓" },
    { id: "mosques",      label: t.mosques,      icon: "🏛️" },
    { id: "history",      label: t.history,      icon: "📜" },
    { id: "sahaba",       label: t.sahaba,       icon: "🏅" },
    { id: "analytics",    label: t.analytics,    icon: "📊" },
    { id: "kids",         label: t.kids,         icon: "👶" },
    { id: "about",        label: t.about,        icon: "ℹ️"  },
  ];

  // Mobil: kateqoriyalı bölmələr
  const mobileSections = [
    { items: [
      { id: "home", label: t.home, icon: "⌂" },
      { id: "quran", label: t.quran, icon: "📖" },
      { id: "hadith", label: t.hadith, icon: "📚" },
      { id: "prayer", label: t.prayer, icon: "🕌" },
      { id: "duas", label: t.duas, icon: "🤲" },
      { id: "dhikr", label: t.dhikr, icon: "📿" },
      { id: "names", label: t.names, icon: "⭐" },
      { id: "videos", label: videosLabel, icon: "📹" },
      { id: "books",  label: booksLabel,  icon: "📚" },
      { id: "aichat", label: aiChatLabel, icon: "🤖" },
    ]},
    { items: [
      { id: "calendar", label: t.calendar, icon: "🌙" },
      { id: "zakat", label: t.zakat, icon: "💰" },
      { id: "qibla", label: t.qibla, icon: "🧭" },
      { id: "hifz", label: t.hifz, icon: "📝" },
      { id: "dailytracker", label: t.dailytracker, icon: "📋" },
      { id: "charity", label: t.charity, icon: "💚" },
      { id: "mosques", label: t.mosques, icon: "🏛️" },
      { id: "duajournal", label: t.duajournal, icon: "📓" },
      { id: "analytics", label: t.analytics, icon: "📊" },
    ]},
    { items: [
      { id: "quiz", label: t.quiz, icon: "❓" },
      { id: "qurangame", label: t.qurangame, icon: "🎮" },
      { id: "prayerguide", label: t.prayerguide, icon: "🕌" },
      { id: "hajjguide", label: t.hajjguide, icon: "🕋" },
      { id: "glossary", label: t.glossary, icon: "📖" },
      { id: "holyplaces", label: t.holyplaces, icon: "🕋" },
      { id: "history", label: t.history, icon: "📜" },
      { id: "sahaba", label: t.sahaba, icon: "🏅" },
      { id: "quotes", label: t.quotes, icon: "🖼️" },
      { id: "kids", label: t.kids, icon: "👶" },
    ]},
    { items: [
      { id: "about", label: t.about, icon: "ℹ️" },
    ]},
  ];

  const moreLabel = MORE_LABEL[lang] || MORE_LABEL.en;
  const sectionLabels = MOBILE_SECTIONS[lang] || MOBILE_SECTIONS.en;
  const isMoreActive = moreNav.some(n => n.id === currentPage);

  return (
    <>
      <header className={`header ${scrolled ? "scrolled" : ""} ${visible ? "visible" : ""}`}>
        <div className="header-topline" />

        <div className="header-inner">

          <div className="logo" onClick={() => goTo("home")}>
            <div className="logo-icon">
              <span className="logo-crescent">☽</span>
            </div>
            <div className="logo-text-wrap">
              <span className="logo-main">muslims</span>
              <span className="logo-dot">.cc</span>
            </div>
          </div>

          <nav className="nav-desktop">
            {mainNav.map((item, i) => (
              <button
                key={item.id}
                className={`nav-link ${currentPage === item.id ? "active" : ""}`}
                onClick={() => goTo(item.id)}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {item.label}
                {currentPage === item.id && <span className="nav-active-dot" />}
              </button>
            ))}

            {/* ── "Daha çox" dropdown ── */}
            <div className="nav-more-wrap" ref={moreRef}>
              <button
                className={`nav-link nav-more-btn ${isMoreActive ? "active" : ""} ${moreOpen ? "open" : ""}`}
                onClick={() => setMoreOpen(o => !o)}
              >
                {moreLabel}
                <svg className={`nav-more-arrow ${moreOpen ? "up" : ""}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                {isMoreActive && <span className="nav-active-dot" />}
              </button>
              {moreOpen && (
                <div className="nav-more-dropdown">
                  {moreNav.map(item => (
                    <button
                      key={item.id}
                      className={`nav-more-item ${currentPage === item.id ? "active" : ""}`}
                      onClick={() => goTo(item.id)}
                    >
                      <span className="nav-more-icon">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="header-right">

            <button className="theme-toggle" onClick={toggleDark} aria-label="Toggle dark mode">
              {dark ? '\u2600\uFE0F' : '\uD83C\uDF19'}
            </button>

            <div className="lang-wrap" ref={langRef}>
              <button
                className={`lang-btn ${langOpen ? "open" : ""}`}
                onClick={() => setLangOpen(o => !o)}
                aria-label="Change language"
              >
                <span className="lang-flag">{currentLang.flag}</span>
                <span className="lang-code">{currentLang.label}</span>
                <svg className={`lang-arrow ${langOpen ? "up" : ""}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {langOpen && (
                <div className="lang-dropdown">
                  <div className="lang-dropdown-header">Dil / Language</div>
                  {LANGS.map(l => (
                    <button
                      key={l.code}
                      className={`lang-option ${lang === l.code ? "selected" : ""}`}
                      onClick={() => changeLang(l.code)}
                    >
                      <span className="lang-option-flag">{l.flag}</span>
                      <div className="lang-option-text">
                        <span className="lang-option-native">{l.native}</span>
                        <span className="lang-option-code">{l.label}</span>
                      </div>
                      {lang === l.code && (
                        <svg className="lang-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="nav-cta" onClick={() => goTo("duas")}>
              <span>🤲</span>
              <span>{t.cta}</span>
            </button>

            <button
              className={`menu-toggle ${mobileOpen ? "open" : ""}`}
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Menu"
            >
              <span className="toggle-line" />
              <span className="toggle-line" />
              <span className="toggle-line" />
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-overlay ${mobileOpen ? "open" : ""}`} onClick={() => setMobileOpen(false)} />
      <nav className={`mobile-nav ${mobileOpen ? "open" : ""}`}>
        <div className="mobile-nav-header">
          <div className="mobile-logo">
            <span className="logo-crescent">☽</span>
            <span>muslims<span style={{ color: "var(--primary)" }}>.cc</span></span>
          </div>
          <button className="mobile-close" onClick={() => setMobileOpen(false)}>✕</button>
        </div>

        <div className="mobile-langs">
          {LANGS.map(l => (
            <button
              key={l.code}
              className={`mobile-lang-btn ${lang === l.code ? "active" : ""}`}
              onClick={() => changeLang(l.code)}
            >
              {l.flag} {l.label}
            </button>
          ))}
          <button className="theme-toggle" onClick={toggleDark} aria-label="Toggle dark mode">
            {dark ? '\u2600\uFE0F' : '\uD83C\uDF19'}
          </button>
        </div>

        <div className="mobile-divider" />

        <div className="mobile-nav-items">
          {mobileSections.map((section, si) => (
            <div key={si} className="mobile-nav-section">
              <div className="mobile-nav-section-label">{sectionLabels[si]}</div>
              {section.items.map((item, i) => (
                <button
                  key={item.id}
                  className={`mobile-nav-link ${currentPage === item.id ? "active" : ""}`}
                  onClick={() => goTo(item.id)}
                  style={{ animationDelay: `${(si * 5 + i) * 30}ms` }}
                >
                  <span className="mobile-nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {currentPage === item.id && (
                    <span className="mobile-active-badge">●</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="mobile-divider" />

        <button className="mobile-cta" onClick={() => goTo("duas")}>
          🤲 {t.cta}
        </button>

        <div className="mobile-nav-deco">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
      </nav>
    </>
  );
}

export default Header;