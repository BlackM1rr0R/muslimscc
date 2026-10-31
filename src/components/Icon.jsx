// ═══════════════════════════════════════════════════════
// Icon — saytın vahid XƏTTİ ikon dəsti (dizayn sistemi v2)
//
// Niyə: əvvəl bölmələr emoji ilə göstərilirdi (📖 🕐 🤲 …) — hər
// əməliyyat sistemində fərqli görünür, rəngi tokenə tabe olmur, qaranlıq
// rejimdə "ləkə" kimi qalırdı. Bu ikonlar 24×24 şəbəkədə, eyni xətt
// qalınlığında (1.75), rəngi currentColor-dan alır — tünd rejim və
// RTL avtomatikdir. Heç bir kitabxana yoxdur (bundle-a ~6 KB).
//
// İstifadə:
//   <Icon name="quran" />                 — 20px, aria-hidden
//   <Icon name="arrow" size={16} className="ui-flip-rtl" />
//   <Icon name={item.key} fallback={item.icon} />  — ikon yoxdursa emoji
//
// Adlar: src/data/navigation.js-dəki HƏR marşrut açarı + ümumi ikonlar
// (arrow, search, pin, sun, moon, bell, sunrise, sunset, sunLow …).
// Yeni ikon əlavə edəndə: 24×24, fill yox, yalnız stroke; DESIGN.md-yə yaz.
// ═══════════════════════════════════════════════════════

const P = {
  // ── Bölmələr (navigation.js açarları) ──
  home: <><path d="M3.5 10.2 12 3.5l8.5 6.7" /><path d="M5.5 8.8V20h4.5v-5.5h4V20h4.5V8.8" /></>,
  prayer: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  jamaat: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20v-1a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M21.5 20v-1a5 5 0 0 0-3.5-4.8" /></>,
  announcements: <><path d="m3.5 11 15-5v12l-15-4z" /><path d="M11.5 16.4a3 3 0 0 1-5.8-1.5" /><path d="M21 9.5v5" /></>,
  donate: <path d="M12 20.5s-8.5-4.9-8.5-11A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8.5 2.5c0 6.1-8.5 11-8.5 11z" />,
  quran: <><path d="M12 7.5c-1.6-1.6-4.3-2.5-8.5-2.5v13c4.2 0 6.9.9 8.5 2.5" /><path d="M12 7.5c1.6-1.6 4.3-2.5 8.5-2.5v13c-4.2 0-6.9.9-8.5 2.5z" /></>,
  hifz: <><path d="M5 19.5V5a2.5 2.5 0 0 1 2.5-2.5H19v15H7.5A2.5 2.5 0 0 0 5 20a2.5 2.5 0 0 0 2.5 2H19" /><path d="M10 2.5v7l2.5-1.8L15 9.5v-7" /></>,
  qurangame: <><rect x="2.5" y="6.5" width="19" height="11" rx="5.5" /><path d="M7 12h4M9 10v4" /><path d="M15.5 10.8h.01M17.5 13.2h.01" strokeWidth="2.4" /></>,
  analytics: <><path d="M4 4v16h16" /><path d="M8.5 16v-4M12.5 16V8M16.5 16v-6" /></>,
  hadith: <><path d="M18.5 16.5v-11a2 2 0 0 0-2-2h-12" /><path d="M8 20.5h11a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1h-9a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0v-13a2 2 0 1 0-4 0v2h4" /><path d="M10 8h5M10 11.5h5" /></>,
  sahaba: <><circle cx="12" cy="9" r="5.5" /><path d="m8.6 13.4-1.1 7.6 4.5-2.4 4.5 2.4-1.1-7.6" /></>,
  // Sələf alimləri (/scholars): əlyazma vərəqi + qələm
  scholars: <><path d="M14 3.5H6.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-6.5" /><path d="M8 9h4M8 12.5h5.5M8 16h7" /><path d="M19.6 3.4a1.4 1.4 0 0 1 2 2l-5 5-2.6.6.6-2.6z" /></>,
  history: <><path d="M5.5 21.5h13M5.5 2.5h13" /><path d="M7 2.5v3.6a2 2 0 0 0 .6 1.4L12 12l4.4-4.5a2 2 0 0 0 .6-1.4V2.5" /><path d="M17 21.5v-3.6a2 2 0 0 0-.6-1.4L12 12l-4.4 4.5a2 2 0 0 0-.6 1.4v3.6" /></>,
  glossary: <><path d="m4.5 8 5.5 5.5" /><path d="m3.5 14 6-6 2-3" /><path d="M2.5 5h11M7.5 2.5h1" /><path d="m21.5 21.5-4.5-10-4.5 10M14 18h6" /></>,
  books: <><path d="M4.5 3.5v17M8.5 6.5v14M12.5 5.5v15" /><path d="m16 6.5 4 13.5" /></>,
  videos: <><rect x="2.5" y="5" width="19" height="14" rx="3" /><path d="m10 9.2 5 2.8-5 2.8z" /></>,
  prayerguide: <><path d="M21.5 9.5 12 4.5 2.5 9.5 12 14.5z" /><path d="M6.5 11.8V16c3 2.7 8 2.7 11 0v-4.2" /><path d="M21.5 9.5V15" /></>,
  qibla: <><circle cx="12" cy="12" r="8.5" /><path d="m15.6 8.4-2 5.2-5.2 2 2-5.2z" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /><path d="M14 13.5a2.5 2.5 0 1 0 1.5 4.5 2.2 2.2 0 0 1-1.5-4.5z" /></>,
  // Namaz izləyicisi (/prayer-tracker) — dairə içində ✓
  tracker: <><circle cx="12" cy="12" r="8.5" /><path d="m8.4 12.2 2.5 2.5 4.9-5" /></>,
  dailytracker: <><path d="m3.5 7 1.8 1.8 3.2-3.3M3.5 16.5l1.8 1.8 3.2-3.3" /><path d="M12.5 7h8M12.5 12h8M12.5 17h8" /></>,
  duas: <><path d="M12.5 3.5a7 7 0 1 0 8 8 5.5 5.5 0 1 1-8-8z" /><path d="m18 3 .7 1.6 1.6.7-1.6.7L18 7.6l-.7-1.6-1.6-.7 1.6-.7z" /></>,
  dhikr: <><circle cx="12" cy="4.2" r="1.6" /><circle cx="16.6" cy="6.1" r="1.6" /><circle cx="18.5" cy="10.6" r="1.6" /><circle cx="16.6" cy="15.1" r="1.6" /><circle cx="7.4" cy="15.1" r="1.6" /><circle cx="5.5" cy="10.6" r="1.6" /><circle cx="7.4" cy="6.1" r="1.6" /><path d="M12 16.5v3M10.3 21.5h3.4" /></>,
  names: <><path d="M6.5 6.5h11v11h-11z" /><path d="M12 4.2 19.8 12 12 19.8 4.2 12z" /></>,
  duajournal: <><path d="M13.5 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-7" /><path d="M2.5 7h3M2.5 12h3M2.5 17h3" /><path d="M20.9 5.6a1.5 1.5 0 0 0-2.1-2.1l-5.1 5.1-.8 2.9 2.9-.8z" /></>,
  hajjguide: <><path d="M4 7.2 12 3.5l8 3.7v9.6l-8 3.7-8-3.7z" /><path d="M4 7.2 12 11l8-3.8M12 11v9.5" /><path d="m4 10.3 8 3.8 8-3.8" /></>,
  holyplaces: <><path d="M2.5 21h19" /><path d="M6.5 21v-6.5a5.5 5.5 0 0 1 11 0V21" /><path d="M12 9V6.5M12 4.2v.3" /><path d="M10.2 21v-2.7a1.8 1.8 0 0 1 3.6 0V21" /><path d="M3.5 21v-9M20.5 21v-9" /></>,
  mosques: <><path d="M19.5 10.2c0 5.6-7.5 11.3-7.5 11.3S4.5 15.8 4.5 10.2a7.5 7.5 0 0 1 15 0z" /><circle cx="12" cy="10" r="2.8" /></>,
  zakat: <><circle cx="9" cy="9" r="6" /><path d="M18.1 10.4a6 6 0 1 1-7.7 7.7" /><path d="M7.5 7h1.5v4" /><path d="m16.7 13.9.7.7-2.8 2.8" /></>,
  charity: <><path d="M5 2.5v19l2-1 2 1 2-1 2 1 2-1 2 1 2-1v-19l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" /><path d="M12 15s-3.3-1.9-3.3-4.2A1.8 1.8 0 0 1 12 9.9a1.8 1.8 0 0 1 3.3.9C15.3 13.1 12 15 12 15z" /></>,
  aichat: <><path d="M10 14.5a2 2 0 0 0-1.4-1.4L3 11.6a.5.5 0 0 1 0-1L8.6 9A2 2 0 0 0 10 7.6L11.5 2a.5.5 0 0 1 1 0L14 7.6A2 2 0 0 0 15.4 9l5.6 1.5a.5.5 0 0 1 0 1L15.4 13a2 2 0 0 0-1.4 1.4L12.5 20a.5.5 0 0 1-1 0z" /><path d="M19.5 15.5v4M21.5 17.5h-4" /></>,
  quiz: <><circle cx="12" cy="12" r="8.5" /><path d="M9.4 9.3a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2.6-2.6 2.6" /><path d="M12 16.6h.01" strokeWidth="2.4" /></>,
  quotes: <><path d="M10 11.5H5.5V6.5H10v5.5a5 5 0 0 1-4.5 5" /><path d="M19.5 11.5H15V6.5h4.5v5.5a5 5 0 0 1-4.5 5" /></>,
  kids: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 14s1.3 2 3.5 2 3.5-2 3.5-2" /><path d="M9.2 9.5h.01M14.8 9.5h.01" strokeWidth="2.4" /></>,
  // Ərəb kursu: "ب" hərfinin cizgisi — çanaq + alt nöqtə
  arabic: <><path d="M3.5 9.5c0 4.6 3.2 6.5 8.5 6.5s8.5-1.9 8.5-6.5" /><path d="M12 20.2h.01" strokeWidth="2.8" /></>,
  about: <><circle cx="12" cy="12" r="8.5" /><path d="M12 16.5V11.5" /><path d="M12 8h.01" strokeWidth="2.4" /></>,

  // ── Ümumi ──
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  pin: <><path d="M18.5 10c0 5-6.5 11-6.5 11S5.5 15 5.5 10a6.5 6.5 0 0 1 13 0z" /><circle cx="12" cy="10" r="2.3" /></>,
  bell: <><path d="M6 8.5a6 6 0 0 1 12 0c0 6.5 2.5 8.5 2.5 8.5h-17S6 15 6 8.5" /><path d="M10.3 20.5a1.9 1.9 0 0 0 3.4 0" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  sunrise: <><path d="M12 2.5v5M8.5 5 12 1.8 15.5 5" /><path d="m5 10.9 1.4 1.4M2.5 18h2M19.5 18h2M19 10.9l-1.4 1.4" /><path d="M21.5 21.5h-19" /><path d="M16 18a4 4 0 0 0-8 0" /></>,
  sunLow: <><circle cx="12" cy="12" r="4" /><path d="M12 4.5h.01M19.5 12h.01M12 19.5h.01M4.5 12h.01M17.3 6.7h.01M17.3 17.3h.01M6.7 17.3h.01M6.7 6.7h.01" strokeWidth="2.6" /></>,
  sunset: <><path d="M12 9.5v-7M8.5 6 12 9.5 15.5 6" /><path d="m5 10.9 1.4 1.4M2.5 18h2M19.5 18h2M19 10.9l-1.4 1.4" /><path d="M21.5 21.5h-19" /><path d="M16 18a4 4 0 0 0-8 0" /></>,
  shield: <path d="M12 21.5s7.5-3.5 7.5-9.5V5.5L12 2.5l-7.5 3V12c0 6 7.5 9.5 7.5 9.5z" />,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5s1.2-6.1 3.5-8.5z" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  instagram: <><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.2 6.8h.01" strokeWidth="2.4" /></>,

  // ── İnterfeys (üzən panellər, dialoqlar, bildirişlər — 2-ci mərhələ) ──
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  download: <><path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5" /><path d="M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" /></>,
  share: <><path d="M12 14.5V3.5M8 7l4-4 4 4" /><path d="M8.5 10.5h-2a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-2" /></>,
  addSquare: <><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M12 8.5v7M8.5 12h7" /></>,
  phone: <><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" /><path d="M11 18.5h2" /></>,
  a11y: <><circle cx="12" cy="4.6" r="1.8" /><path d="M5 8.5c2.3.7 4.6 1 7 1s4.7-.3 7-1" /><path d="M12 9.5v4.5M12 14l-3 6.5M12 14l3 6.5" /></>,
  type: <><path d="M4 19.5 8.5 6l4.5 13.5M5.6 15h5.8" /><path d="M19.5 19.5v-6.2a2.8 2.8 0 0 0-5.3-1.2M19.5 16.3c-3.5-.6-5.4.4-5.4 1.8 0 1.6 2.6 2 5.4-.4" /></>,
  heading: <path d="M6 4.5v15M18 4.5v15M6 12h12" />,
  lineHeight: <><path d="M3.5 7 6 4.5 8.5 7M3.5 17 6 19.5 8.5 17M6 4.5v15" /><path d="M12 6.5h8.5M12 12h8.5M12 17.5h8.5" /></>,
  letterSpacing: <><path d="M3 15 7 4.5 11 15M4.4 11.5h5.2" /><path d="M13.5 4.5h7.5M17.2 4.5V15" /><path d="M5 19.5h14M7 17.5l-2 2 2 2M17 17.5l2 2-2 2" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  contrast: <><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor" stroke="none" /></>,
  palette: <><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.4-1.3-1.6-1.3-2.8 0-1 .8-1.6 1.9-1.6h2.1a3.5 3.5 0 0 0 3.5-3.5C20 6.8 16.4 3.5 12 3.5z" /><path d="M7.6 11.5h.01M9.6 7.6h.01M14.2 7.2h.01" strokeWidth="2.6" /></>,
  drop: <path d="M12 3.2S5.5 10 5.5 14.3a6.5 6.5 0 0 0 13 0C18.5 10 12 3.2 12 3.2z" />,
  pause: <><circle cx="12" cy="12" r="8.5" /><path d="M10 9v6M14 9v6" /></>,
  play: <><circle cx="12" cy="12" r="8.5" /><path d="m10.2 8.8 4.8 3.2-4.8 3.2z" /></>,
  cursor: <path d="m5 3.5 13.5 6.2-5.8 1.6-1.9 6.2z" />,
  touch: <><path d="M9.5 11.5V5a1.5 1.5 0 0 1 3 0v5.5" /><path d="M12.5 10V8.5a1.5 1.5 0 0 1 3 0V11M15.5 10.5a1.5 1.5 0 0 1 3 0V15a6.5 6.5 0 0 1-6.5 6.5h-.6a6 6 0 0 1-4.4-1.9L4 16.3a1.6 1.6 0 0 1 2.3-2.2l3.2 2.4" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.8" fill="currentColor" /></>,
  ruler: <><rect x="2.5" y="8" width="19" height="8" rx="1.5" /><path d="M6.5 8v3M10.5 8v4M14.5 8v3M18.5 8v4" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3.2-3.2a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3.2 3.2a4 4 0 0 0 5.7 5.7l1-1" /></>,
  image: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><circle cx="9" cy="10" r="1.8" /><path d="m20.5 16-4.5-4.5-8.5 8" /></>,
  volume: <><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18.2 6.3a8.3 8.3 0 0 1 0 11.4" /></>,
  film: <><rect x="3.5" y="4" width="17" height="16" rx="2.5" /><path d="M7.5 4v16M16.5 4v16M3.5 9h4M3.5 15h4M16.5 9h4M16.5 15h4" /></>,
  leaf: <><path d="M5 19c0-8.5 5-13.5 14.5-14 .3 9.3-4.5 14.5-12.5 14.5z" /><path d="M5 19.5c2.5-4.5 5.5-7.5 9-9.5" /></>,
  bolt: <path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z" />,
  refresh: <><path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9" /><path d="M18.5 3v4.2h-4.2M5.5 21v-4.2h4.2" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 16.5v-5M12 8h.01" /></>,
  alert: <><path d="M10.3 4.2 2.9 17.5A2 2 0 0 0 4.6 20.5h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" /><path d="M12 9.5v4M12 17h.01" /></>,
  star: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" />,
  sparkle: <path d="M12 3.5c.6 4.4 4.1 7.9 8.5 8.5-4.4.6-7.9 4.1-8.5 8.5-.6-4.4-4.1-7.9-8.5-8.5 4.4-.6 7.9-4.1 8.5-8.5z" />,
  send: <><path d="M20.5 3.5 10.5 13.5" /><path d="m20.5 3.5-6.5 17-3.5-7-7-3.5z" /></>,
  // Redaktə (qələm) — eyni xətt qalınlığı, 24×24 şəbəkə
  edit: <><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
  trash: <><path d="M4 6.5h16M9.5 6.5V4.5h5v2" /><path d="m6 6.5 1 13a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5l1-13" /><path d="M10 11v6M14 11v6" /></>,
  bellOff: <><path d="M8.7 4.1A6 6 0 0 1 18 8.5c0 3 .5 5 1.2 6.4M17 17H3.5S6 15 6 8.5" /><path d="M10.3 20.5a1.9 1.9 0 0 0 3.4 0" /><path d="m3 3 18 18" /></>,
  bulb: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2V16h5v-.1c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" /></>,
  list: <path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12M4 6.5h.01M4 12h.01M4 17.5h.01" />,
  flask: <><path d="M9.5 3.5h5M10 3.5v6L4.8 18.2a1.5 1.5 0 0 0 1.3 2.3h11.8a1.5 1.5 0 0 0 1.3-2.3L14 9.5v-6" /><path d="M7.5 14.5h9" /></>,
  compass: <><circle cx="12" cy="12" r="8.5" /><path d="m15.6 8.4-2 5.2-5.2 2 2-5.2z" /></>,
  ramadan: <><path d="M19 14.8A7.5 7.5 0 0 1 9.2 5a7.5 7.5 0 1 0 9.8 9.8z" /><path d="m17.5 3 .6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" /></>,
  moonStar: <><path d="M19 14.8A7.5 7.5 0 0 1 9.2 5a7.5 7.5 0 1 0 9.8 9.8z" /><path d="m17.5 3 .6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3.5" /></>,
  copy: <><rect x="8.5" y="8.5" width="12" height="12" rx="2.5" /><path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" /></>,
  external: <><path d="M14 4.5h5.5V10M19.5 4.5 11 13" /><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  enter: <><path d="M19.5 5v6a3 3 0 0 1-3 3H5" /><path d="m9 10-4 4 4 4" /></>,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  gift: <><rect x="3.5" y="8" width="17" height="4.5" rx="1" /><path d="M5 12.5v8h14v-8M12 8v12.5" /><path d="M12 8S10.5 3.5 8 4.2C6 4.8 7 8 12 8zM12 8s1.5-4.5 4-3.8C18 4.8 17 8 12 8z" /></>,
  megaphone: <><path d="m3.5 11 15-5v12l-15-4z" /><path d="M11.5 16.4a3 3 0 0 1-5.8-1.5" /><path d="M21 9.5v5" /></>,
}

/**
 * Brend işarəsi — əvvəlki "☽" simvolunun yerinə (şriftdən asılı idi).
 * Zümrüd kafel + qum rəngli xatəm (8 guşəli ulduz) + mərkəzdə nöqtə.
 * Rəngləri CSS verir (.qm-mark-tile, .qm-mark-star, .qm-mark-dot —
 * Header.css); hər iki rejimdə eyni brend rəngləridir.
 */
export function BrandMark({ size = 34, className = '' }) {
  return (
    <svg className={`qm-mark ${className}`} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect className="qm-mark-tile" width="32" height="32" rx="9" />
      <path className="qm-mark-star" d="M9.4 9.4h13.2v13.2H9.4zM16 6.7 25.3 16 16 25.3 6.7 16z" />
      <circle className="qm-mark-dot" cx="16" cy="16" r="2.1" />
    </svg>
  )
}

/** Ad üçün ikon varmı? (məs. emoji ehtiyatına düşmək üçün) */
export function hasIcon(name) {
  return Object.prototype.hasOwnProperty.call(P, name)
}

export default function Icon({ name, size = 20, strokeWidth = 1.75, className, fallback = null, title }) {
  const body = P[name]
  if (!body) return fallback
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title && <title>{title}</title>}
      {body}
    </svg>
  )
}
