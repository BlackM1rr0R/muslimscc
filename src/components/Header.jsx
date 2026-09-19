import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useLang } from "../contexts/LangContext";
import { brandName } from "../config/mosque";
import { PRIMARY_NAV, navShortLabel } from "../data/navigation";
import { pathFor } from "../seo/routes";
import { useBackToClose } from "../utils/useBackToClose";
import { useScrollDirection } from "../hooks/useScrollDirection";
import SideNav from "./SideNav";
import "../styles/Header.css";

// ═══════════════════════════════════════════════════════
// Header — sahibin qərarları: #5 (geniş ekran) və #7 (dar ekran).
//
//   ≥1024px (#5 — DƏYİŞMƏYİB, ☰ yoxdur):
//   [loqo + "Qaraçuxur Məscidi"] ── Quran · Namaz · Hədis · AI · Haqqımızda ── [🔍] [🌙] [AZ ▾]
//   • Loqo bloku yan panelin (SideNav "rail") eni qədərdir — loqo panelin
//     sətirləri ilə bir xətdə durur (Header.css → --sidenav-w)
//   • Ortada YALNIZ 5 qısa link (PRIMARY_NAV + SHORT_LABELS, src/data/navigation.js),
//     əsas sütunun ortasında
//   • Sağda eyni ölçülü (40×40) "ghost" ikon düymələri: axtarış, tema, dil
//   • Bütün bölmələr solda həmişə açıq yan paneldədir (ərəbcədə sağda)
//
//   <1024px (#7 — "Bölmələri yuxarıda burger menyuya köçür, aşağı zolaq olmasın"):
//   [loqo + "Qaraçuxur Məscidi"] ……… [🔍] [☰]      (ərəbcədə güzgülənir: ☰ solda)
//   • ☰ çəkmə menyunu açır: <SideNav mode="drawer"> sağdan (ərəbcədə soldan)
//     sürüşüb gəlir — bütün bölmələr, axtarış, alətlər, tema və dil orada.
//     Açıq ikən ☰ yumşaq şəkildə ✕-ə çevrilir (Header.css → .hdr-burger).
//     aria-expanded / aria-controls; Geri düyməsi menyunu bağlayır
//     (utils/useBackToClose); səhifə dəyişəndə və ekran ≥1024px-ə
//     genişləndikdə menyu bağlanır; bağlananda fokus ☰-yə qayıdır.
//   • Aşağı naviqasiya zolağı YOXDUR (BottomNav silinib).
//   • 56px, şüşə kimi yarımşəffaf fon + bulanıqlıq + nazik xətt.
//   • Aşağı sürüşəndə yuxarı çəkilib gizlənir, yuxarı sürüşəndə geri gəlir
//     (hooks/useScrollDirection — rAF + passive dinləyici, 8px həddi).
//     Səhifənin lap yuxarısında, axtarış/menyu açıq olanda, dil menyusu
//     açıqkən və ya fokus başlıqdadırsa heç vaxt gizlənmir. Gizli halda
//     <html>-ə "qm-hdr-hidden" yazılır → --header-offset: 0 (motion.css).
//
// İpucu yalnız brauzerin öz "title"-ı ilə — səhifənin üstünə düşən
// qara ipucu qutusu yoxdur. Bildiriş ayarları üzən düymədədir (FloatingDock).
//
// Axtarış: düymə, Ctrl+K / ⌘K, "/", ?q=<söz> ünvanı (index.html-dəki
// WebSite SearchAction) və "qm-open-search" hadisəsi (yan panelin
// axtarış sahəsi göndərir) GlobalSearch dialoqunu açır; çəkmə menyunun
// axtarış sahəsi isə birbaşa openSearch-i çağırır.
// Açıq axtarışı telefonun Geri düyməsi bağlayır (səhifə dəyişmir) —
// utils/useBackToClose; marşrut başqa yolla dəyişsə də dialoq bağlanır.
// ═══════════════════════════════════════════════════════

// Axtarış dialoqu ilk ehtiyacda yüklənir — ilk yüklənmə paketinə düşmür
const loadSearch = () => import("./GlobalSearch");
const GlobalSearch = lazy(loadSearch);

// SideNav.jsx bu hadisəni göndərir ("Saytda axtar" sahəsi)
const OPEN_SEARCH_EVENT = "qm-open-search";

// Çəkmə menyunun paneli (☰ → aria-controls)
const DRAWER_ID = "qm-drawer";

// Yan panelin göründüyü en (globals.css, SideNav.css ilə eyni sərhəd) —
// ekran bu enə çatanda açıq menyu öz-özünə bağlanır
const DESKTOP_MQ = "(min-width: 1024px)";

// Bayraq emojiləri Windows-da hərf kimi görünür ("AZ AZ") — ona görə yalnız kod və doğma ad
const LANGS = [
  { code: "az", label: "AZ", native: "Azərbaycanca" },
  { code: "en", label: "EN", native: "English" },
  { code: "ru", label: "RU", native: "Русский" },
  { code: "ar", label: "AR", native: "العربية" },
  { code: "tr", label: "TR", native: "Türkçe" },
];

const LABELS = {
  az: {
    primaryNav: "Əsas bölmələr", home: "Ana səhifə", menu: "Menyu",
    search: "Axtar", dark: "Qaranlıq rejim", light: "İşıqlı rejim",
    changeLang: "Dili dəyiş", selectLang: "Dil seçin",
  },
  en: {
    primaryNav: "Main sections", home: "Home", menu: "Menu",
    search: "Search", dark: "Dark mode", light: "Light mode",
    changeLang: "Change language", selectLang: "Select language",
  },
  ru: {
    primaryNav: "Основные разделы", home: "Главная", menu: "Меню",
    search: "Поиск", dark: "Тёмная тема", light: "Светлая тема",
    changeLang: "Изменить язык", selectLang: "Выберите язык",
  },
  ar: {
    primaryNav: "الأقسام الرئيسية", home: "الرئيسية", menu: "القائمة",
    search: "بحث", dark: "الوضع الداكن", light: "الوضع الفاتح",
    changeLang: "تغيير اللغة", selectLang: "اختر اللغة",
  },
  tr: {
    primaryNav: "Ana bölümler", home: "Ana sayfa", menu: "Menü",
    search: "Ara", dark: "Karanlık mod", light: "Aydınlık mod",
    changeLang: "Dili değiştir", selectLang: "Dil seçin",
  },
};

// Qısayol işarəsi: Mac-da ⌘, digərlərində Ctrl
const IS_MAC = typeof navigator !== "undefined" &&
  /mac|iphone|ipad/i.test(navigator.userAgentData?.platform || navigator.platform || "");
const SHORTCUT = IS_MAC ? "⌘K" : "Ctrl+K";

// ?q= ilə gələn sorğunun ağlabatan uzunluğu (axtarış onsuz da qısa sözlə işləyir)
const MAX_DEEPLINK_Q = 100;

/** Adi sol klikdirmi? (Ctrl/⌘/orta klik — brauzer linki yeni tabda açsın) */
function isPlainClick(e) {
  return !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/** Fokus yazı sahəsindədirmi? ("/" qısayolu orada işləməməlidir) */
function isTypingTarget(t) {
  if (!t) return false;
  if (t.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName);
}

// ── Xətti ikonlar (hamısı eyni çəkidə — düymələr bir ailə kimi görünsün) ──
const ICON = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

function SearchIcon() {
  return (
    <svg {...ICON}>
      <circle cx="11" cy="11" r="6.5" />
      <line x1="16" y1="16" x2="20.5" y2="20.5" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg {...ICON}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg {...ICON}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
    </svg>
  );
}

/** ☰ — üç xətt; açıq ikən yuxarı və aşağı xətt fırlanıb ✕ olur, orta xətt itir */
function BurgerIcon() {
  return (
    <span className="hdr-burger-box" aria-hidden="true">
      <span className="hdr-burger-line" />
      <span className="hdr-burger-line" />
      <span className="hdr-burger-line" />
    </span>
  );
}

function Header({ currentPage, setPage }) {
  const [langOpen, setLangOpen] = useState(false);
  const [focusInside, setFocusInside] = useState(false);

  // Çəkmə menyu (<1024px): ilk açılışda mount olur, sonra DOM-da qalır
  // (bağlanma animasiyası üçün)
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const burgerRef = useRef(null);

  // Axtarış dialoqu
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchMounted, setSearchMounted] = useState(false);
  const [searchQ,       setSearchQ]       = useState("");

  const { lang, setLang: setLangCtx, dark, toggleDark } = useLang();
  const l = LABELS[lang] || LABELS.az;
  const currentLang = LANGS.find(x => x.code === lang) || LANGS[0];

  const langRef = useRef(null);
  const langBtnRef = useRef(null);

  // ── Sürüşmə: nazik xətt + kölgə (scrolled) və telefonda gizlənmə (hidden) ──
  // Tək passive dinləyici + requestAnimationFrame (hooks/useScrollDirection).
  // Gizlənmə yalnız <1024px-də görünür (Header.css); genişdə sinif təsirsizdir.
  // Menyu açıq ikən başlıq heç vaxt gizlənmir.
  const { hidden: scrollHidden, scrolled } = useScrollDirection({
    threshold: 8,
    disabled: searchOpen || langOpen || focusInside || menuOpen,
  });

  // Gizli vəziyyəti <html>-ə yaz: yapışqan panellər --header-offset ilə yuxarı qalxsın
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("qm-hdr-hidden", scrollHidden);
    return () => root.classList.remove("qm-hdr-hidden");
  }, [scrollHidden]);

  // ── Dil menyusu: kənara klik və Esc bağlayır, oxlar seçimlər arasında gəzir ──
  useEffect(() => {
    if (!langOpen) return undefined;
    const onDown = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setLangOpen(false);
        langBtnRef.current?.focus();
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const opts = Array.from(langRef.current?.querySelectorAll(".lang-option") || []);
      if (!opts.length) return;
      e.preventDefault();
      const i = opts.indexOf(document.activeElement);
      const n = opts.length;
      const next = e.key === "ArrowDown"
        ? opts[(i + 1) % n]
        : opts[i < 0 ? n - 1 : (i - 1 + n) % n];
      next.focus();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [langOpen]);

  const changeLang = (code) => {
    setLangOpen(false);
    langBtnRef.current?.focus({ preventScroll: true });
    if (code !== lang) setLangCtx(code);
  };

  const goTo = useCallback((p) => {
    setPage(p);
    setLangOpen(false);
  }, [setPage]);

  // ── Çəkmə menyu ──
  const openMenu = useCallback(() => {
    setMenuMounted(true);
    setMenuOpen(true);
    setLangOpen(false);
  }, []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Geri düyməsi açıq menyunu bağlasın (arxadakı səhifəni dəyişməsin)
  useBackToClose(menuOpen, closeMenu);

  // Ekran genişlənib yan panel görünəndə menyu bağlansın
  useEffect(() => {
    if (!menuOpen || typeof window.matchMedia !== "function") return undefined;
    const mq = window.matchMedia(DESKTOP_MQ);
    if (mq.matches) {
      setMenuOpen(false);
      return undefined;
    }
    const onChange = (e) => { if (e.matches) setMenuOpen(false); };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, [menuOpen]);

  // ── Axtarış ──
  // Axtarış açılanda menyu bağlanır (axtarış onun üstündə açılmır —
  // iki dialoqun fokus tələsi bir-birinə mane olardı)
  const openSearch = useCallback((q = "") => {
    setSearchQ(q);
    setSearchMounted(true);
    setSearchOpen(true);
    setLangOpen(false);
    setMenuOpen(false);
  }, []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const preloadSearch = () => { loadSearch().catch(() => {}); };

  // Geri düyməsi açıq axtarışı bağlasın (arxadakı səhifəni dəyişməsin)
  useBackToClose(searchOpen, closeSearch);

  // Marşrut dəyişəndə (hər hansı yolla) axtarış və menyu bağlansın. Ref ilə
  // müqayisə: ?q= effekti dialoqu ilk mount-da açır — onu dərhal bağlamamalıyıq.
  const prevPageRef = useRef(currentPage);
  useEffect(() => {
    if (prevPageRef.current === currentPage) return;
    prevPageRef.current = currentPage;
    setSearchOpen(false);
    setMenuOpen(false);
  }, [currentPage]);

  // Yan panelin "Saytda axtar" sahəsi (SideNav.jsx) bu hadisəni göndərir
  useEffect(() => {
    const onOpen = (e) => {
      const q = typeof e.detail?.q === "string" ? e.detail.q.slice(0, MAX_DEEPLINK_Q) : "";
      openSearch(q);
    };
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
  }, [openSearch]);

  // Klaviatura: Ctrl+K / ⌘K hər yerdə, "/" yalnız yazı sahəsindən kənarda
  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || e.isComposing) return;
      const key = (e.key || "").toLowerCase();
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && key === "k") {
        e.preventDefault();
        openSearch();
        return;
      }
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSearch]);

  // ?q=<söz> — Google-un "sayt daxili axtarış" linki (index.html SearchAction).
  // Axtarışı həmin sözlə açırıq və ?q-nu ünvandan silirik ki, yeniləmə və ya
  // paylaşma zamanı dialoq təkrar açılmasın. history.state saxlanılır —
  // React Router öz açarını itirməsin.
  useEffect(() => {
    let q = "";
    try {
      const params = new URLSearchParams(window.location.search);
      if (!params.has("q")) return;
      q = (params.get("q") || "").trim().slice(0, MAX_DEEPLINK_Q);
      params.delete("q");
      const rest = params.toString();
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + (rest ? `?${rest}` : "") + window.location.hash,
      );
    } catch {
      return;
    }
    if (q) openSearch(q);
  }, [openSearch]);

  // Brend adı: az dilində "Qaraçuxur" + vurğulu "Məscidi",
  // digər dillərdə tam lokallaşdırılmış ad tək hissə kimi göstərilir
  const brand = brandName(lang);
  const brandSplit = lang === "az" ? brand.lastIndexOf(" ") : -1;
  const brandMain = brandSplit > 0 ? brand.slice(0, brandSplit) : brand;
  const brandAccent = brandSplit > 0 ? brand.slice(brandSplit + 1) : "";

  const searchTip = `${l.search} (${SHORTCUT})`;
  const themeTip = dark ? l.light : l.dark;

  return (
    <>
      <header
        className={`header${scrolled ? " scrolled" : ""}${scrollHidden ? " is-hidden" : ""}`}
        // Klaviatura ilə gələn fokus başlığı açıq saxlayır (barmaqla toxunuş yox —
        // əks halda axtarış bağlanandan sonra fokus düymədə qalıb başlığı "yapışdırardı")
        onFocus={() => setFocusInside(document.documentElement.classList.contains("qm-input-keyboard"))}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocusInside(false); }}
      >
        <div className="header-inner">

          {/* ── SOL: loqo (ərəbcədə sağda) ── */}
          <div className="header-left">
            <a
              className="logo"
              href={pathFor("home", lang)}
              onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); goTo("home"); } }}
              aria-label={`${brand} — ${l.home}`}
            >
              <span className="logo-icon" aria-hidden="true">
                <span className="logo-crescent">☽</span>
              </span>
              <span className="logo-text-wrap">
                <span className="logo-main">{brandMain}</span>
                {/* Boşluq mətn düyünü: kopyalama zamanı sözləri ayırır */}
                {brandAccent && <>{" "}<span className="logo-dot">{brandAccent}</span></>}
              </span>
            </a>
          </div>

          {/* ── ORTA: yalnız 5 əsas link (≥1024px, əsas sütunun ortasında) ── */}
          <nav className="nav-desktop" aria-label={l.primaryNav}>
            {PRIMARY_NAV.map(key => {
              const active = currentPage === key;
              return (
                <a
                  key={key}
                  href={pathFor(key, lang)}
                  className={`nav-link${active ? " active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); goTo(key); } }}
                >
                  {navShortLabel(key, lang)}
                </a>
              );
            })}
          </nav>

          {/* ── SAĞ: axtarış, tema, dil — eyni ölçülü ikon düymələri.
                 <1024px-də axtarış + ☰ (tema və dil çəkmə menyudadır) ── */}
          <div className="header-right">
            <button
              type="button"
              className="hdr-btn nav-search-btn"
              onClick={() => openSearch()}
              onPointerEnter={preloadSearch}
              onFocus={preloadSearch}
              aria-label={searchTip}
              title={searchTip}
              aria-keyshortcuts="Control+K Meta+K /"
              aria-haspopup="dialog"
              aria-expanded={searchOpen}
            >
              <SearchIcon />
            </button>

            <button
              type="button"
              className="hdr-btn theme-toggle"
              onClick={toggleDark}
              aria-label={l.dark}
              title={themeTip}
              aria-pressed={Boolean(dark)}
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>

            <div className="lang-wrap" ref={langRef}>
              <button
                ref={langBtnRef}
                type="button"
                className={`hdr-btn lang-btn${langOpen ? " open" : ""}`}
                onClick={() => setLangOpen(o => !o)}
                aria-label={`${l.changeLang}: ${currentLang.native}`}
                title={langOpen ? undefined : l.changeLang}
                aria-expanded={langOpen}
                aria-controls="hdr-lang-menu"
              >
                <span className="lang-code">{currentLang.label}</span>
                <svg className="lang-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {langOpen && (
                <div className="lang-dropdown" id="hdr-lang-menu" role="group" aria-label={l.selectLang}>
                  {LANGS.map(x => {
                    const selected = lang === x.code;
                    return (
                      <button
                        type="button"
                        key={x.code}
                        className={`lang-option${selected ? " selected" : ""}`}
                        onClick={() => changeLang(x.code)}
                        lang={x.code}
                        aria-current={selected ? "true" : undefined}
                      >
                        <span className="lang-option-native">{x.native}</span>
                        <span className="lang-option-code">{x.label}</span>
                        <svg className="lang-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ☰ — yalnız <1024px (Header.css); ≥1024px-də yan panel həmişə açıqdır */}
            <button
              ref={burgerRef}
              type="button"
              className={`hdr-btn hdr-burger${menuOpen ? " is-open" : ""}`}
              onClick={() => (menuOpen ? closeMenu() : openMenu())}
              aria-label={l.menu}
              title={l.menu}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-controls={menuMounted ? DRAWER_ID : undefined}
            >
              <BurgerIcon />
            </button>
          </div>
        </div>
      </header>

      {/* Çəkmə menyu <header>-dən KƏNARDA (axtarış dialoqu kimi): header-in
          backdrop-filter-i position:fixed uşaqları öz qutusuna həbs edərdi */}
      {menuMounted && (
        <SideNav
          mode="drawer"
          id={DRAWER_ID}
          open={menuOpen}
          onClose={closeMenu}
          currentPage={currentPage}
          setPage={goTo}
          onOpenSearch={openSearch}
          returnFocusRef={burgerRef}
        />
      )}

      {/* Dialoq <header>-dən KƏNARDA: header-in backdrop-filter-i
          position:fixed uşaqları öz qutusuna həbs edərdi */}
      {searchMounted && (
        <Suspense fallback={null}>
          <GlobalSearch
            open={searchOpen}
            onClose={closeSearch}
            setPage={goTo}
            initialQuery={searchQ}
          />
        </Suspense>
      )}
    </>
  );
}

export default Header;
