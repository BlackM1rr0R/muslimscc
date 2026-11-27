// ═══════════════════════════════════════════════════════
// "Yeniliklər" (/whats-new) — saytın son əlavələri, TARİX SIRASI ilə (ən yenisi yuxarıda)
//
// Mənbə: bu reponun git tarixçəsi (git log --since=2026-11-10, funksiya commit-ləri) və
// src/seo/routes.js. Hər sətir:
//   id    — sabit açar (mətnlər components/whatsnew/whatsNewText.js-də bu açarla, 5 dildə)
//   date  — ISO tarix 'YYYY-MM-DD' (commit günü)
//   key   — routes.js marşrut açarı (keçid pathFor(key) ilə qurulur)
//   icon  — Icon.jsx ikonu
//   page  — true: bu YENİ SƏHİFƏDİR (marşrut özü yenidir). Yalnız belə sətirlər menyuda və
//           axtarışda "Yeni" nişanı alır (son NEW_DAYS gün ərzində, istifadəçi açana qədər —
//           utils/whatsNewSeen.js). Mövcud səhifəyə əlavə olunan funksiya — page yoxdur
//           (əks halda Qiblə, Quran, Tarix … həmişə "yeni" görünərdi).
//
// Bu fayl yan menyu (SideNav) ilə əsas paketə düşür — mətn YOXDUR, yalnız qısa sahələr.
// Yeni funksiya əlavə edəndə: buraya bir sətir (yuxarıya) + whatsNewText.js-ə 5 dildə mətn.
// tests/unit/whats-new.test.js hər ikisinin uyğunluğunu yoxlayır.
// ═══════════════════════════════════════════════════════

export const NEW_DAYS = 30

export const WHATS_NEW = [
  // 2026-11-27 — Siyər (/seerah): Hicaz xəritəsi + zaman xətti, hər hadisə Quran/Səhih mənbəyi ilə, uşaq rejimi
  { id: 'seerah', date: '2026-11-27', key: 'seerah', icon: 'seerah', page: true },
  // 2026-11-24 — icma lövhələri: namaz otaqları, cənazə elanı (gizli keçid), məscid könüllüləri (server/prayerRooms.js, janaza.js, volunteers.js)
  { id: 'prayerrooms', date: '2026-11-24', key: 'prayerrooms', icon: 'prayerrooms', page: true },
  { id: 'janaza', date: '2026-11-24', key: 'janaza', icon: 'janaza', page: true },
  { id: 'volunteers', date: '2026-11-24', key: 'volunteers', icon: 'volunteers', page: true },
  // 2026-11-24 — Ramazana hazırlıq yolu (/road-to-ramadan) və son 10 gecə (/last-ten-nights)
  { id: 'ramadanprep', date: '2026-11-24', key: 'ramadanprep', icon: 'ramadanprep', page: true },
  { id: 'lastten', date: '2026-11-24', key: 'lastten', icon: 'lastten', page: true },
  // 2026-11-24 — Əmanət qutusu (/trust-box, server/trustBox.js): uçdan-uca şifrəli vəsiyyət qeydləri
  { id: 'trustbox', date: '2026-11-24', key: 'trustbox', icon: 'trustbox', page: true },
  // 2026-11-24 — Telegram botu (server/telegramBot.js; /prayer-də kart — VITE_TELEGRAM_BOT olanda)
  { id: 'telegram-bot', date: '2026-11-24', key: 'prayer', icon: 'send' },
  // 2026-11-24 — PWA paylaşma hədəfi (/share) və hərf yazma məşqində mövqe formaları + səs
  { id: 'share-target', date: '2026-11-24', key: 'share', icon: 'share' },
  { id: 'letter-trace-forms', date: '2026-11-24', key: 'arabic', icon: 'edit' },
  // 2026-11-23 — "Yeniliklər" səhifəsi və bələdçi tur
  { id: 'whats-new', date: '2026-11-23', key: 'whatsnew', icon: 'whatsnew', page: true },
  // 2026-11-23 (1b22ee8) — yatma/oyanış, ailə halqası, xəstə ziyarəti, səyyah dəsti, "Mənim ilim"
  { id: 'bedtime', date: '2026-11-23', key: 'bedtime', icon: 'bedtime', page: true },
  { id: 'waking', date: '2026-11-23', key: 'waking', icon: 'waking', page: true },
  { id: 'halaqa', date: '2026-11-23', key: 'halaqa', icon: 'halaqa', page: true },
  { id: 'sickvisit', date: '2026-11-23', key: 'sickvisit', icon: 'sickvisit', page: true },
  { id: 'travelkit', date: '2026-11-23', key: 'travelkit', icon: 'travelkit', page: true },
  { id: 'yearbook', date: '2026-11-23', key: 'yearbook', icon: 'yearbook', page: true },
  // 2026-11-23 (71b8e00) — 12 yeni alət
  { id: 'debts', date: '2026-11-23', key: 'debts', icon: 'debts', page: true },
  { id: 'haid', date: '2026-11-23', key: 'haid', icon: 'haid', page: true },
  { id: 'simple', date: '2026-11-23', key: 'simple', icon: 'simple', page: true },
  { id: 'units', date: '2026-11-23', key: 'units', icon: 'units', page: true },
  { id: 'newborn', date: '2026-11-23', key: 'newborn', icon: 'newborn', page: true },
  { id: 'bereavement', date: '2026-11-23', key: 'bereavement', icon: 'bereavement', page: true },
  { id: 'nikahprep', date: '2026-11-23', key: 'nikahprep', icon: 'nikahprep', page: true },
  { id: 'duafriend', date: '2026-11-23', key: 'duafriend', icon: 'duafriend', page: true },
  { id: 'hajjtracker', date: '2026-11-23', key: 'hajjtracker', icon: 'hajjtracker', page: true },
  { id: 'gravevisit', date: '2026-11-23', key: 'gravevisit', icon: 'gravevisit', page: true },
  { id: 'kaaba-history', date: '2026-11-23', key: 'holyplaces', icon: 'holyplaces' },
  { id: 'road-trip', date: '2026-11-23', key: 'prayer', icon: 'pin' },
  // 2026-11-19 (50b63e1, 846dba5)
  { id: 'onroad', date: '2026-11-19', key: 'onroad', icon: 'onroad', page: true },
  { id: 'focus', date: '2026-11-19', key: 'focus', icon: 'focus', page: true },
  { id: 'quranmeaning', date: '2026-11-19', key: 'quranmeaning', icon: 'quranmeaning', page: true },
  { id: 'newmuslim', date: '2026-11-19', key: 'newmuslim', icon: 'newmuslim', page: true },
  { id: 'jariyah', date: '2026-11-19', key: 'jariyah', icon: 'jariyah', page: true },
  { id: 'tafsir-compare', date: '2026-11-19', key: 'quran', icon: 'list' },
  // 2026-11-18 (609cb62, bdd03a9)
  { id: 'khatm', date: '2026-11-18', key: 'khatm', icon: 'khatm', page: true },
  { id: 'ramadan-wrapped', date: '2026-11-18', key: 'ramadan', icon: 'ramadan' },
  { id: 'account-security', date: '2026-11-18', key: 'account', icon: 'shield' },
  // 2026-11-17 (8e417ab, e1029a7, VAU v7.3–v7.6)
  { id: 'accounts-sync', date: '2026-11-17', key: 'account', icon: 'lock' },
  { id: 'flight-prayer', date: '2026-11-17', key: 'prayer', icon: 'send' },
  { id: 'story-books', date: '2026-11-17', key: 'kids', icon: 'kids' },
  { id: 'prophet-letters', date: '2026-11-17', key: 'history', icon: 'mail' },
  { id: 'iftar-invite', date: '2026-11-17', key: 'ramadan', icon: 'gift' },
  { id: 'daily-sunnah', date: '2026-11-17', key: 'dailytracker', icon: 'dailytracker' },
  // 2026-11-16 (VAU v7.0–v7.2)
  { id: 'halal-places', date: '2026-11-16', key: 'halalcheck', icon: 'halalcheck' },
  { id: 'dua-capsule', date: '2026-11-16', key: 'duajournal', icon: 'duajournal' },
  { id: 'lunar-mansions', date: '2026-11-16', key: 'qibla', icon: 'moon' },
  { id: 'ibn-battuta', date: '2026-11-16', key: 'history', icon: 'globe' },
  // 2026-11-15
  { id: 'planetarium', date: '2026-11-15', key: 'qibla', icon: 'star' },
  { id: 'astrolabe', date: '2026-11-15', key: 'history', icon: 'compass' },
  { id: 'ambient-sound', date: '2026-11-15', key: 'quran', icon: 'volume' },
  { id: 'hadith-memorize', date: '2026-11-15', key: 'hadith', icon: 'hadith' },
  // 2026-11-14
  { id: 'kaffarah', date: '2026-11-14', key: 'qada', icon: 'qada' },
  { id: 'world-cities', date: '2026-11-14', key: 'prayer', icon: 'globe' },
  // 2026-11-13
  { id: 'babynames', date: '2026-11-13', key: 'babynames', icon: 'babynames', page: true },
  { id: 'scientists', date: '2026-11-13', key: 'history', icon: 'flask' },
  { id: 'rakat-counter', date: '2026-11-13', key: 'prayerguide', icon: 'prayerguide' },
  { id: 'solar-eclipses', date: '2026-11-13', key: 'calendar', icon: 'sun' },
  { id: 'star-qibla', date: '2026-11-13', key: 'qibla', icon: 'qibla' },
  // 2026-11-12
  { id: 'quran-animals', date: '2026-11-12', key: 'kids', icon: 'leaf' },
  { id: 'asr-shadow', date: '2026-11-12', key: 'prayer', icon: 'sunLow' },
  { id: 'rasd-qibla', date: '2026-11-12', key: 'qibla', icon: 'target' },
  { id: 'fasting-map', date: '2026-11-12', key: 'ramadan', icon: 'clock' },
]

const DAY_MS = 86400000

/** 'YYYY-MM-DD' → UTC millisaniyə (səhv formatda NaN) */
export function isoDayMs(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''))
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : NaN
}

/**
 * Son `days` gün ərzində əlavə olunmuş YENİ SƏHİFƏLƏRİN marşrut açarları.
 * Gələcək tarixli sətir (saat fərqi) də sayılır; köhnələr düşür.
 */
export function recentPageKeys(now = Date.now(), days = NEW_DAYS) {
  const out = new Set()
  for (const e of WHATS_NEW) {
    if (!e.page) continue
    const t = isoDayMs(e.date)
    if (Number.isFinite(t) && now - t < days * DAY_MS) out.add(e.key)
  }
  return out
}
