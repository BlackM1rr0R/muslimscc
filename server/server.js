const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const app = express()
// nginx-in arxasındayıq — real IP-ni X-Forwarded-For-dan oxu (rate-limit üçün vacib)
app.set('trust proxy', 1)
app.disable('x-powered-by')
const IS_PROD = process.env.NODE_ENV === 'production'

// ─── Config (env-dən oxunur — heç bir açar kodda yoxdur) ─────────────
const PORT = process.env.PORT || 3001
const OPENROUTER_KEY = process.env.OPENROUTER_KEY
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash'
const DB_PATH = process.env.DB_PATH || '/data/muslims.db'

// Vacib env dəyişənləri yoxdursa serveri başlatma (səssiz sınıqdan yaxşıdır)
if (!OPENROUTER_KEY) { console.error('FATAL: env dəyişəni yoxdur → OPENROUTER_KEY'); process.exit(1) }

// ─── Modullar BAZADAN ƏVVƏL yüklənir ──────────────────────────────────
// Modul çatışmırsa (məs. Dockerfile-a düşməyib), server MİQRASİYADAN ƏVVƏL
// çöksün: yoxsa yeni sxem tətbiq olunur və köhnə versiyaya qayıdış da alınmır
// (köhnə kod yeni sxemi açmır) — 2026-11-04 hadisəsi. require keşlənir, ikinci
// çağırış pulsuzdur.
for (const m of ['./auth', './users', './security', './syncKeys', './mailer', './analytics', './csp', './clientErrors', './ummah', './sightings', './content', './feedback', './groups', './sync', './ics', './push',
  './prompts', './ai-utils', './prayer-utils', './daily-ayah', './checkin', './fasting', './reminders', './prayCalc', './eclipse', './eclipse-lib', './daily-hadith', './daily-hadith-data', './personal', './hijri',
  './readTogether', './family', './hifzTest', './globalKhatm', './challenges', './classes', './familyRamadan', './calFeed',
  './communityKit', './publicProfile', './familyDua', './duaWall', './mosqueRep', './weekly', './ipKey', './pushClaims', './quranMeaning',
  './duaFriend', './hajjJourney', './welcome', './mailCampaigns', './adminSso',
  './prayerRooms', './janaza', './volunteers',
  './trustBox', './telegramBot', './prayerCities', './instagram', './instagramCard', './instagram-data', './instagramReel', './tiktok']) require(m)
// Paket asılılıqları da (server/package.json → npm ci) — image-də yoxdursa bazadan ƏVVƏL çöksün
for (const m of ['@simplewebauthn/server']) require(m)
// sharp (Instagram kartları, server/instagramCard.js) yalnız YOXLANIR (require.resolve) — libvips IG sönülüdürsə yüklənmir;
// kart şriftləri (server/fonts, Dockerfile → COPY fonts) da
require.resolve('sharp')
for (const f of ['AmiriQuran.ttf', 'Amiri-Regular.ttf', 'Amiri-Bold.ttf', 'MccInter-Regular.ttf', 'MccInter-SemiBold.ttf', 'fonts.conf']) {
  if (!require('node:fs').existsSync(require('node:path').join(__dirname, 'fonts', f))) { console.error(`FATAL: server/fonts/${f} yoxdur (Dockerfile → COPY fonts)`); process.exit(1) }
}

// ─── Verilənlər bazası (SQLite, node:sqlite) ─────────────────────────
const { openDb } = require('./db')
let db
try {
  db = openDb(DB_PATH)
} catch (e) {
  console.error(`FATAL: verilənlər bazası açılmadı (${DB_PATH}):`, e.message)
  if (e && /readonly|EACCES|EROFS|unable to open/i.test(String(e.message))) {
    console.error('İpucu: /data volume-u yazıla bilən olmalıdır (docs/SERVER-OPS.md → "Volume icazəsi")')
  }
  process.exit(1)
}

// ─── CORS: yalnız icazəli origin-lər (localhost — yalnız NODE_ENV=production DEYİLSƏ) ───────────────
const ALLOWED = (process.env.ALLOWED_ORIGINS || 'https://muslims.cc,https://www.muslims.cc')
  .split(',').map(s => s.trim()).filter(Boolean)
app.use(cors({
  origin(origin, cb) {
    // origin yoxdur (server-to-server / curl) → icazə ver
    if (!origin) return cb(null, true)
    const isLocalhost = !IS_PROD && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    if (ALLOWED.includes(origin) || isLocalhost) return cb(null, true)
    return cb(null, false)
  },
}))

const limit = (windowMs, max) => rateLimit({ windowMs, max, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Limit' } })
app.use('/api/ask-ai', rateLimit({ windowMs: 60000, max: 10, message: { error: 'Cox sorgu. 1 deqiqe gozleyin.' } }))
// Quranda məna ilə axtarış (server/quranMeaning.js) — AI çağırır: dəqiqədə 6, saatda 40
app.use('/api/quran-meaning', limit(60000, 6), limit(3600e3, 40))
app.use('/api/send-notification', limit(60000, 5))
// Admin məzmun yazıları (məs. SeedManager 50 sənədi ardıcıl yazır) — daha geniş limit
app.use(/^\/api\/admin\/(content|singletons)(\/|$)/, limit(60000, 300))
// Baş adminin məktub bölməsi (server/mailCampaigns.js) — irəliləyiş sorğusu (polling) üçün ayrıca limit
app.use(/^\/api\/admin(?!\/(content|singletons|mail)(\/|$))/, limit(60000, 30))
app.use('/api/admin/mail', limit(60000, 90))
app.use('/api/content', limit(60000, 300))
app.use('/api/singletons', limit(60000, 300))
app.use('/api/push', limit(60000, 30))
// Telegram botu (server/telegramBot.js) — sorğular Telegram serverlərindən gəlir (çox istifadəçi, az IP)
app.use('/api/telegram', limit(60000, 600))
// Instagram kartları (server/instagram.js) — Instagram serverləri image_url-i buradan çəkir
app.use('/api/ig', limit(60000, 60))
// TikTok (server/tiktok.js): bir dəfəlik OAuth qoşulması (connect / callback) və PULL_FROM_URL video ünvanı
app.use('/api/tiktok', limit(60000, 30))

// ─── Admin girişi (server/auth.js) ───────────────────────────────────
const authLib = require('./auth')
const authStore = authLib.createAuthStore(db)
// Sayt hesabı ilə panel (SSO, server/adminSso.js): panel rolu + TOTP 2FA olan istifadəçi sessiyası da keçir.
// adminSso aşağıda (usersStore + security-dən sonra) yaradılır — sorğu anında hazırdır.
const siteSso = { resolve: (req, res) => adminSso.resolve(req, res), audit: (req, r) => adminSso.audit(req, r) }
// Panel YALNIZ saytın hesabı ilə (SSO). Ayrıca admin hesabının girişi (/api/admin/login, /api/admin/2fa) və köhnə
// __Host-mcc_admin sessiyaları SÖNÜLÜDÜR — yalnız break-glass: api.env-də ADMIN_LEGACY_LOGIN=1 (docs/ADMIN-SECURITY.md → "Təcili giriş")
const ADMIN_LEGACY_LOGIN = process.env.ADMIN_LEGACY_LOGIN === '1'
if (ADMIN_LEGACY_LOGIN) console.warn('ADMIN_LEGACY_LOGIN=1 — ayrıca admin girişi (break-glass) AÇIQDIR; iş bitən kimi sil')
const requireAdmin = authLib.createRequireAdmin({ store: authStore, allowedOrigins: ALLOWED, siteSso, legacyLogin: ADMIN_LEGACY_LOGIN })
// İstifadəçi hesabları (server/users.js) — cədvəllər miqrasiyasız; admin_roles burada yaradılır,
// ona görə store admin router-indən əvvəl qurulur (GET /api/admin/me → role)
const usersLib = require('./users')
const usersStore = usersLib.createUsersStore(db)
// Hesab təhlükəsizliyi (server/security.js, docs/ACCOUNT-SECURITY.md): yeni cihaz məktubu, hadisələr, TOTP 2FA (istifadəçi +
// admin), "Bu mən deyildim". Cədvəllər miqrasiyasız. mailer/personalRouter aşağıda yaradılır — çağırış anında hazırdır.
const security = require('./security').createSecurity({
  db, totpKey: process.env.TOTP_KEY || '', publicOrigin: (process.env.PUBLIC_ORIGIN || 'https://muslims.cc').replace(/\/+$/, ''),
  mailer: { sendTemplate: (...a) => mailer.sendTemplate(...a) },
  prefsOf: (id) => personalRouter.store.prefs(id),
  // Gizli panel ünvanı (build-dəki VITE_ADMIN_PATH ilə eyni; yoxdursa /account/panel) — yalnız adminin yeni cihaz məktubunda
  adminPath: process.env.ADMIN_PATH || undefined,
})
const adminSso = require('./adminSso').createAdminSso({ db, usersStore, security })
app.use('/api', authLib.createAuthRouter({ store: authStore, requireAdmin, allowedOrigins: ALLOWED, adminRoleOf: usersStore.adminRole, security, legacyLogin: ADMIN_LEGACY_LOGIN }))
// Vaxtı keçmiş sessiyaları saatda bir təmizlə
setInterval(() => { try { authStore.purgeExpired() } catch { /* */ } }, 3600e3).unref()

// ─── İstifadəçi hesabları (server/users.js, docs/USER-ACCOUNTS.md) — öz limitləri də var (IP/e-poçt) ──
const PUBLIC_ORIGIN = (process.env.PUBLIC_ORIGIN || 'https://muslims.cc').replace(/\/+$/, '')
app.use('/api/auth', limit(60000, 60))
// Hesaba bağlı şifrəli sinxronizasiya (server/syncKeys.js) — açar qabları + hesab↔blok bağlantısı; miqrasiyasız
const syncKeysLib = require('./syncKeys')
const syncKeysStore = syncKeysLib.createSyncKeysStore(db)
const mailer = require('./mailer').createMailer({ apiKey: process.env.RESEND_API_KEY })
// Xoş gəldin məktubu (bir dəfə) + sayt dili (server/welcome.js) — cədvəllər miqrasiyasız
const welcome = require('./welcome').createWelcome({ db, mailer, publicOrigin: PUBLIC_ORIGIN })
const usersRouter = usersLib.createUsersRouter({
  db, store: usersStore, requireAdmin, allowedOrigins: ALLOWED,
  hooks: {
    beforeDeleteUser: (id) => { syncKeysStore.deleteUserData(id); readTogetherRouter.closeOwnerRooms(id); adminSso.deleteUserData(id) },
    passkeyRemoved: (userId, credId) => syncKeysStore.remove(userId, 'prf', credId),
    passwordReset: (userId) => syncKeysStore.remove(userId, 'password', ''),
    emailVerified: (userId, lang) => welcome.onVerified(userId, lang),
    seenLang: (userId, lang) => welcome.onSeenLang(userId, lang),
  },
  mailer,
  security,
  publicOrigin: PUBLIC_ORIGIN,
  rpId: process.env.RP_ID || undefined,
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
})
app.use('/api', usersRouter)
// 2FA idarəsi, təhlükəsizlik fəaliyyəti, "Bu mən deyildim" (/api/security — girişsiz, öz limiti), məlumat xülasəsi + ixrac
app.use('/api/security', limit(60000, 30))
app.use('/api', require('./security').createSecurityRouter({
  security, usersStore, requireUser: usersRouter.requireUser, mailer, publicOrigin: PUBLIC_ORIGIN,
  sources: { personal: () => personalRouter.store, family: () => familyRouter, hifzTests: () => hifzTestRouter, sync: syncKeysStore, readTogether: () => readTogetherRouter, globalKhatm: () => khatmRouter,
    challenges: () => challengesRouter, classes: () => classesRouter, familyRamadan: () => familyRamadanRouter, calFeed: () => calFeedRouter,
    publicProfile: () => publicProfileRouter, familyDuas: () => familyDuaRouter, duaWall: () => duaWallRouter, mosqueRep: () => mosqueRepRouter, weekly: () => weeklyRouter,
    duaFriend: () => duaFriendRouter, hajjJourney: () => hajjJourneyRouter, welcome, mailCampaigns: () => mailCampaignsRouter, adminPanel: adminSso,
    trustBox: () => trustBoxRouter,
    prayerRooms: () => prayerRoomsRouter, janaza: () => janazaRouter, volunteers: () => volunteersRouter },
}))
setInterval(() => security.purge(), 3600e3).unref()
app.use('/api', syncKeysLib.createSyncKeysRouter({
  store: syncKeysStore, requireUser: usersRouter.requireUser,
  passkeyIdsOf: (userId) => usersStore.listPasskeys(userId).map((k) => k.id),
}))
// Gələcək xüsusiyyətlər üçün: app.post('/api/x', usersRouter.requireUser('mosque_rep'), …)
setInterval(() => { try { usersStore.purgeExpired() } catch { /* */ } }, 3600e3).unref()

// ─── Kukisiz sayt statistikası (server/analytics.js) ─────────────────
const analytics = require('./analytics')
analytics.migrate(db, { allowedOrigins: ALLOWED })
app.post('/api/a', analytics.handleCollect)
app.get('/api/admin/analytics', requireAdmin, analytics.handleStats)

// ─── Məzmun API-si (server/content.js) — öz JSON parser-i (1 MB) var ──
const content = require('./content')
app.use('/api', content.createContentRouter({
  db, requireAdmin,
  onChange: ({ collection, id, action, admin }) => console.log(`content ${action} ${collection}/${id} (${admin || '?'})`),
}))

// ─── "Səhv bildir" (server/feedback.js) — öz limiti var (IP üzrə, yaddaşda) ──
app.use('/api', require('./feedback').createFeedbackRouter({ db, requireAdmin }))

// ─── Qrup xətmi və ortaq hədəflər (server/groups.js) — hesabsız otaqlar, öz limiti var ──
app.use('/api', require('./groups').createGroupsRouter({ db }))

// ─── Cihazlar arası sinxronizasiya (server/sync.js) — şifrəli bloklar, hesabsız; öz limiti var ──
app.use('/api', require('./sync').createSyncRouter({ db }))

// ─── Ümmətin sayğacı (server/ummah.js) — anonim gündəlik cəm; cədvəl miqrasiyasız (geri qaytarma pozulmur) ──
app.use('/api/ummah', limit(60000, 120))
app.use('/api', require('./ummah').createUmmahRouter({ db }))
// ─── Hilal müşahidələri (server/sightings.js) — 1°-lik xana, gündə bir qeyd; cədvəl miqrasiyasız ──
app.use('/api/sightings', limit(60000, 30))
app.use('/api', require('./sightings').createSightingsRouter({ db }))
// ─── Şəxsi xatırlatmalar (server/personal.js): gələcəyə məktub, sevdiklərim üçün dua (Cümə / ayda bir), zəkat ili ──
// Hesaba bağlı, SERVERDƏ OXUNAN (istifadəçi razılığı ilə); cədvəllər miqrasiyasız, users(id) CASCADE.
// Push üçün deliver() aşağıda (Web Push bölməsi) — funksiya bəyannaməsi, çağırış anında hazırdır.
app.use('/api/personal', limit(60000, 60))
const personalRouter = require('./personal').createPersonalRouter({
  db, requireUser: usersRouter.requireUser, mailer, publicOrigin: PUBLIC_ORIGIN, icons: require('./push').DEFAULT_ICONS,
  secret: process.env.PERSONAL_SECRET || '',
  pushSend: (subs, msg, label) => (webPush.enabled ? deliver(subs.map((sub) => ({ sub })), msg, label) : Promise.resolve({ successCount: 0, disabled: true })),
})
app.use('/api', personalRouter)

// ─── D mərhələsi: hesaba bağlı sosial xüsusiyyətlər ──
// "Birlikdə Quran oxu" (server/readTogether.js) — otaqlar YALNIZ yaddaşda, SSE + POST; bazaya heç nə yazılmır.
// Limit genişdir: SSE yenidən qoşulmaları (bilet) və vərəq çevirmələri; modulun öz limitləri də var.
app.use('/api/read-together', limit(60000, 300))
const readTogetherRouter = require('./readTogether').createReadTogetherRouter({ requireUser: usersRouter.requireUser, allowedOrigins: ALLOWED })
app.use('/api', readTogetherRouter)
// Ailə dairəsi (server/family.js) — yalnız istifadəçinin seçdiyi xülasə rəqəmləri + şablon kartlar; cədvəllər miqrasiyasız, CASCADE
app.use('/api/family', limit(60000, 60))
const familyRouter = require('./family').createFamilyRouter({ db, requireUser: usersRouter.requireUser })
app.use('/api', familyRouter)
// "Məni yoxla" hifz keçidi (server/hifzTest.js) — token yalnız SHA-256; nəticə götürüləndən 7 gün sonra silinir
app.use('/api/hifz-tests', limit(60000, 60))
const hifzTestRouter = require('./hifzTest').createHifzTestRouter({ db, requireUser: usersRouter.requireUser, allowedOrigins: ALLOWED })
app.use('/api', hifzTestRouter)
setInterval(() => { try { familyRouter.purge(); hifzTestRouter.purge() } catch (e) { console.error('family/hifz purge:', e && e.message) } }, 3600e3).unref()
// "Ümmətin Canlı Xətmi" (server/globalKhatm.js) — 604 səhifəlik bitməyən dövr; ictimai SSE yalnız toplu məlumat
// (nginx: location = /api/khatm/live, buferləmə yox). Cədvəllər miqrasiyasız; ithaflar dövr bitəndən 30 gün sonra silinir.
app.use('/api/khatm', limit(60000, 120))
const personalLib = require('./personal')
const khatmRouter = require('./globalKhatm').createGlobalKhatmRouter({
  db, requireUser: usersRouter.requireUser, publicOrigin: PUBLIC_ORIGIN,
  lovedNames: (uid) => personalLib.lovedNamesOf(db, uid),
  pushSubsOf: (uid) => personalLib.pushSubsForUser(db, uid),
  langOf: (uid) => personalLib.prefLangOf(db, uid),
  pushSend: (subs, msg, label) => (webPush.enabled ? deliver(subs.map((sub) => ({ sub })), msg, label) : Promise.resolve({ successCount: 0, disabled: true })),
})
app.use('/api', khatmRouter)
setInterval(() => { try { khatmRouter.purge() } catch (e) { console.error('khatm purge:', e && e.message) } }, 3600e3).unref()

// ─── I mərhələsi: birlikdə (docs/USER-ACCOUNTS.md → "I mərhələsi") — cədvəllər miqrasiyasız, users(id) CASCADE ──
// Ailə Ramazan lövhəsi (server/familyRamadan.js) — /api/family limitinin altındadır; family.js-dən SONRA (family_* cədvəlləri)
const familyRamadanRouter = require('./familyRamadan').createFamilyRamadanRouter({ db, requireUser: usersRouter.requireUser })
app.use('/api', familyRamadanRouter)
// Qrup çağırışları (server/challenges.js) — lövhədə yalnız gün üzrə toplu say; xatırlatma yalnız bağlı push cihazlarına
app.use('/api/challenges', limit(60000, 60))
const challengesRouter = require('./challenges').createChallengesRouter({
  db, requireUser: usersRouter.requireUser, icons: require('./push').DEFAULT_ICONS,
  pushSubsOf: (uid) => personalLib.pushSubsForUser(db, uid),
  langOf: (uid) => personalLib.prefLangOf(db, uid),
  pushSend: (subs, msg, label) => (webPush.enabled ? deliver(subs.map((sub) => ({ sub })), msg, label) : Promise.resolve({ successCount: 0, disabled: true })),
})
app.use('/api', challengesRouter)
// Müəllim sinfi (server/classes.js) — fərdi vəziyyət yalnız şagirdin razılığı ilə; "Məni yoxla" hifzTest.js ilə
app.use('/api/classes', limit(60000, 60))
const classesRouter = require('./classes').createClassesRouter({ db, requireUser: usersRouter.requireUser, hifzTests: hifzTestRouter })
app.use('/api', classesRouter)
// Şəxsi təqvim axını (server/calFeed.js): /api/cal/<token>.ics girişsiz (nginx: access_log off); idarə — /api/cal-feed
app.use('/api/cal-feed', limit(60000, 30))
app.use('/api/cal', limit(60000, 300))
const calFeedRouter = require('./calFeed').createCalFeedRouter({
  db, requireUser: usersRouter.requireUser, publicOrigin: PUBLIC_ORIGIN, challengesOf: (uid) => challengesRouter.calendarOf(uid),
})
app.use('/api', calFeedRouter)
setInterval(() => { try { challengesRouter.purge(); familyRamadanRouter.purge() } catch (e) { console.error('together purge:', e && e.message) } }, 3600e3).unref()

// ─── K mərhələsi: icma (docs/USER-ACCOUNTS.md → "K mərhələsi") — cədvəllər miqrasiyasız, users(id) CASCADE ──
// Moderasiya — ADMIN PANELİ (server/auth.js admin_roles, editor+); istifadəçi tərəfi — requireUser + CSRF
const communityKit = require('./communityKit')
const requireEditor = communityKit.createRequireEditor({ requireAdmin, adminRoleOf: usersStore.adminRole })
const optionalUser = communityKit.createOptionalUser({ usersStore, cookieName: usersLib.USER_COOKIE })
// K1. Könüllü açıq profil (/u/<handle>) — susmaya görə gizli, noindex; şikayət → moderasiya növbəsi
app.use('/api/profile', limit(60000, 60))
app.use('/api/u', limit(60000, 120))
const publicProfileRouter = require('./publicProfile').createPublicProfileRouter({ db, requireUser: usersRouter.requireUser, requireEditor })
app.use('/api', publicProfileRouter)
// K2. Ailə dua siyahısı (family.js-dən SONRA; /api/family limiti altında)
const familyDuaRouter = require('./familyDua').createFamilyDuaRouter({ db, requireUser: usersRouter.requireUser })
app.use('/api', familyDuaRouter)
// K3. Dua divarı — göndəriş girişli, gündə 3; "Dua etdim" girişsiz də (IP heşi yalnız yaddaşda)
app.use('/api/dua-wall', limit(60000, 60))
const duaWallRouter = require('./duaWall').createDuaWallRouter({ db, requireUser: usersRouter.requireUser, requireEditor, optionalUser, allowedOrigins: ALLOWED })
app.use('/api', duaWallRouter)
// K4. Məscid nümayəndəsi (role mosque_rep + mosque_id) + məscid ekranının canlı məlumatı (ETag)
app.use('/api/mosque-rep', limit(60000, 30))
app.use('/api/mosques', limit(60000, 120))
const mosqueRepRouter = require('./mosqueRep').createMosqueRepRouter({ db, requireUser: usersRouter.requireUser, requireEditor })
app.use('/api', mosqueRepRouter)
// K5. Həftəlik e-poçt hesabatı — rəqəmləri klient göndərir; abunəlikdən çıxma HMAC (personal.js sirri)
app.use('/api/weekly', limit(60000, 30))
const weeklyRouter = require('./weekly').createWeeklyRouter({
  db, requireUser: usersRouter.requireUser, mailer, publicOrigin: PUBLIC_ORIGIN, secret: () => personalRouter.store.secret(),
})
app.use('/api', weeklyRouter)
// Baş adminin istifadəçilərə məktubu (server/mailCampaigns.js) — yalnız superadmin; növbə ≥ 700 ms, saatda ≤ 300;
// imtina (email_optout) HMAC keçidi ilə (personal.js sirri, ayrıca "news" sahəsi)
app.use('/api/mail', limit(60000, 30))
const mailCampaignsRouter = require('./mailCampaigns').createMailCampaignsRouter({
  db, requireAdmin, adminRoleOf: usersStore.adminRole, mailer, publicOrigin: PUBLIC_ORIGIN, secret: () => personalRouter.store.secret(),
})
app.use('/api', mailCampaignsRouter)
setInterval(() => {
  for (const r of [publicProfileRouter, familyDuaRouter, duaWallRouter, mosqueRepRouter, weeklyRouter, mailCampaignsRouter]) {
    try { r.purge() } catch (e) { console.error('community purge:', e && e.message) }
  }
}, 3600e3).unref()

// ─── P3: gizli dua dostu + Həcc ailə izləyicisi — cədvəllər miqrasiyasız, users(id) CASCADE ──
// Gizli dua dostu (server/duaFriend.js) — kimlik heç vaxt açılmır, sərbəst mətn yoxdur; cütləmə saatlıq, push gecikmə ilə
app.use('/api/dua-friend', limit(60000, 30))
const duaFriendRouter = require('./duaFriend').createDuaFriendRouter({
  db, requireUser: usersRouter.requireUser, icons: require('./push').DEFAULT_ICONS,
  pushSubsOf: (uid) => personalLib.pushSubsForUser(db, uid),
  pushSend: (subs, msg, label) => (webPush.enabled ? deliver(subs.map((sub) => ({ sub })), msg, label) : Promise.resolve({ successCount: 0, disabled: true })),
})
app.use('/api', duaFriendRouter)
// Həcc ailə izləyicisi (server/hajjJourney.js) — family.js-dən SONRA; YER YOXDUR; polling + ETag; 30 gündən sonra silinir
app.use('/api/hajj-journey', limit(60000, 60))
const hajjJourneyRouter = require('./hajjJourney').createHajjJourneyRouter({ db, requireUser: usersRouter.requireUser, allowedOrigins: ALLOWED })
app.use('/api', hajjJourneyRouter)
// Əmanət qutusu (server/trustBox.js) — UCDAN-UCA şifrəli (server yalnız { salt, blob }); /open girişsiz + IP heşi limiti
app.use('/api/trust-box', limit(60000, 30))
const trustBoxRouter = require('./trustBox').createTrustBoxRouter({ db, requireUser: usersRouter.requireUser, allowedOrigins: ALLOWED })
app.use('/api', trustBoxRouter)
setInterval(() => {
  try { duaFriendRouter.pairTick() } catch (e) { console.error('dua friend pair:', e && e.message) }
  try { hajjJourneyRouter.purge() } catch (e) { console.error('hajj journey purge:', e && e.message) }
}, 3600e3).unref()
setTimeout(() => { try { duaFriendRouter.pairTick() } catch (e) { console.error('dua friend pair:', e && e.message) } }, 30e3).unref()

// ─── İcma lövhələri — cədvəllər miqrasiyasız, users(id) CASCADE; moderasiya admin panelində (editor+) ──
// Namaz otaqları (server/prayerRooms.js) — təklif girişli + təsdiqli, gündə 5; "yaxınımda" yalnız klientdə
app.use('/api/prayer-rooms', limit(60000, 60))
const prayerRoomsRouter = require('./prayerRooms').createPrayerRoomsRouter({ db, requireUser: usersRouter.requireUser, requireEditor })
app.use('/api', prayerRoomsRouter)
// Cənazə elanı (server/janaza.js) — gizli keçid (#n=…, yalnız SHA-256), ictimai siyahı admin təsdiqi ilə; 30 gündən sonra silinir
app.use('/api/janaza', limit(60000, 60))
const janazaRouter = require('./janaza').createJanazaRouter({ db, requireUser: usersRouter.requireUser, requireEditor, optionalUser, allowedOrigins: ALLOWED })
app.use('/api', janazaRouter)
// Məscid könüllüləri (server/volunteers.js) — mosque_rep öz məscidi / admin; ictimai yalnız "N / M yer"
app.use('/api/volunteers', limit(60000, 60))
const volunteersRouter = require('./volunteers').createVolunteersRouter({ db, requireUser: usersRouter.requireUser, requireEditor, optionalUser })
app.use('/api', volunteersRouter)
setInterval(() => {
  for (const r of [prayerRoomsRouter, janazaRouter, volunteersRouter]) {
    try { r.purge() } catch (e) { console.error('community boards purge:', e && e.message) }
  }
}, 3600e3).unref()

// ─── CSP pozuntu hesabatları (server/csp.js) — Report-Only rejimi; yaddaşda birləşdirilir ──
app.use('/api/csp-report', limit(60000, 60))
app.use('/api', require('./csp').createCspRouter({ requireAdmin }))

// ─── Brauzer xətaları (server/clientErrors.js) — monitorinq; yaddaşda birləşdirilir ──
app.use('/api/client-error', limit(60000, 30))
app.use('/api', require('./clientErrors').createClientErrorRouter({ requireAdmin }))

// ─── Namaz vaxtları — təqvim abunəliyi (server/ics.js) ──
// Google/Apple serverləri çox istifadəçi üçün eyni IP-dən gəlir — limit genişdir
app.use('/api/prayer.ics', limit(60000, 600))
app.use('/api/prayer.json', limit(60000, 120))   // v5.7: ana ekran vidceti
app.use('/api', require('./ics').createIcsRouter())

// ─── Web Push (server/push.js) ───────────────────────────────────────
const push = require('./push')
const pushStore = push.createPushStore(db)
let webPush
try {
  webPush = push.createWebPushSender({
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT,
  })
} catch (e) {
  console.error('XƏBƏRDARLIQ: VAPID açarları yararsızdır — Web Push sönülüdür:', e.message)
  webPush = push.createWebPushSender({})
}
if (!webPush.enabled) console.warn('XƏBƏRDARLIQ: VAPID_* env yoxdur — Web Push göndərişi sönülüdür')
const PUSH_EXTRA_HOSTS = (process.env.PUSH_EXTRA_HOSTS || '').split(',').map(s => s.trim()).filter(Boolean)
app.use('/api', push.createPushRouter({
  store: pushStore,
  publicKey: webPush.enabled ? process.env.VAPID_PUBLIC_KEY : '',
  extraHosts: PUSH_EXTRA_HOSTS,
  onChange: () => { tokensLoadedAt = 0 },   // planlayıcı siyahını növbəti dövrdə təzələsin
}))

// ─── Telegram botu (server/telegramBot.js) — api.env-də TELEGRAM_BOT_TOKEN + TELEGRAM_WEBHOOK_SECRET yoxdursa
// tam sönülüdür (/api/telegram/* → 404, şəbəkə sorğusu yoxdur). Öz JSON parser-i sirr yoxlanandan SONRA işləyir.
const telegramBot = require('./telegramBot').createTelegramBot({
  db, token: process.env.TELEGRAM_BOT_TOKEN || '', secret: process.env.TELEGRAM_WEBHOOK_SECRET || '', publicOrigin: PUBLIC_ORIGIN,
})
app.use('/api', telegramBot.router)
if (telegramBot.enabled) {
  // Azan xatırlatması: 20 saniyədə bir; bir dəfə göndəriş — pushClaims (kəsintisiz deploy)
  setInterval(() => { telegramBot.tick().catch((e) => console.error('telegram tick:', e && e.message)) }, 20000).unref()
}

// ─── Instagram avtoposteri (server/instagram.js, docs/INSTAGRAM.md) — api.env-də IG_ENABLED=1 + IG_ACCESS_TOKEN + IG_USER_ID
// yoxdursa tam sönülüdür (/api/ig/* → 404, şəbəkə sorğusu yoxdur). Admin bölməsi (status — admin+, önizləmə / dərc — superadmin).
const instagram = require('./instagram').createInstagram({ db, env: { ...process.env, DB_PATH }, publicOrigin: PUBLIC_ORIGIN })
app.use('/api', instagram.router)
app.use('/api', instagram.adminRouter({ requireAdmin, adminRoleOf: usersStore.adminRole }))
if (instagram.enabled) {
  // Yuvalar (Asia/Baku): 30 saniyədə bir; bir dəfə dərc — instagram_posts UNIQUE (kəsintisiz deploy)
  setInterval(() => { instagram.tick().catch((e) => console.error('instagram tick:', e && e.message)) }, 30000).unref()
  // Token yenilənməsi (həftədə bir) + köhnə kartlar / sətirlər — saatda bir
  setInterval(() => {
    instagram.refreshTick().catch((e) => console.error('instagram refresh:', e && e.message))
    // Öz postlarımızın statistikası — gündə bir dəfə (icazə yoxdursa yalnız vəziyyət qeyd olunur, dərc dayanmır)
    instagram.insightsTick().catch((e) => console.error('instagram insights:', e && e.message))
    try { instagram.purge() } catch (e) { console.error('instagram purge:', e && e.message) }
  }, 3600e3).unref()
  setTimeout(() => { instagram.refreshTick().catch(() => {}) }, 60e3).unref()
}

// ─── TikTok yükləyicisi (server/tiktok.js, docs/TIKTOK.md) — gündə 3 video (hədis, dua / ad, Quran passajı; Instagram-la eyni MP4-lər). api.env-də
// TIKTOK_ENABLED=1 + TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET yoxdursa tam sönülüdür (/api/tiktok/* → 404, şəbəkə yoxdur).
// Hesab bir dəfə admin panelindən qoşulur (yalnız superadmin); status — admin+.
const tiktok = require('./tiktok').createTikTok({ db, env: { ...process.env, DB_PATH }, publicOrigin: PUBLIC_ORIGIN, adminPath: process.env.ADMIN_PATH || undefined })
app.use('/api', tiktok.router)
app.use('/api', tiktok.adminRouter({ requireAdmin, adminRoleOf: usersStore.adminRole }))
if (tiktok.enabled) {
  // 3 yuva (TIKTOK_TIMES, Asia/Baku): 30 saniyədə bir yoxlanır; bir dəfə — tiktok_slot_posts (day, slot) UNIQUE (kəsintisiz deploy)
  setInterval(() => { tiktok.tick().catch((e) => console.error('tiktok tick:', e && e.message)) }, 30000).unref()
  // Gündə bir token yeniləməsi (rotasiya, bazada kilid) + köhnə sətirlər — saatda bir yoxlanır
  setInterval(() => {
    tiktok.refreshTick().catch((e) => console.error('tiktok refresh:', e && e.message))
    try { tiktok.purge() } catch (e) { console.error('tiktok purge:', e && e.message) }
  }, 3600e3).unref()
}

app.use(express.json())

// AI sistem promptları (hər dil öz dilində) — server/prompts.js
const { SYSTEM_PROMPTS } = require('./prompts')


const ai = require('./ai-utils')
const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || ai.OPENROUTER_URL
const OPENROUTER_REASONING = process.env.OPENROUTER_REASONING || ''
const AI_MAX_TOKENS = Number(process.env.OPENROUTER_MAX_TOKENS) || ai.LIMITS.maxTokens

// Modelin reasoning imkanları (mandatory / supported_efforts) — OpenRouter-in
// açıq /models siyahısından bir dəfə oxunur (açar lazım deyil), 6 saatlıq keş.
let modelMeta = null
let modelMetaAt = 0
async function refreshModelMeta() {
  if (Date.now() - modelMetaAt < 6 * 3600e3) return
  modelMetaAt = Date.now()
  try {
    const r = await fetch(ai.OPENROUTER_MODELS_URL, { signal: AbortSignal.timeout(8000) })
    if (!r.ok) throw new Error('models ' + r.status)
    const j = await r.json()
    const m = (j.data || []).find(x => x.id === OPENROUTER_MODEL)
    modelMeta = m ? (m.reasoning || { mandatory: false }) : null
    console.log('AI model:', OPENROUTER_MODEL, 'reasoning →', JSON.stringify(ai.pickReasoning(OPENROUTER_MODEL, modelMeta, OPENROUTER_REASONING)))
  } catch {
    // şəbəkə yoxdur — ad üzrə təxmin istifadə olunur; 5 dəqiqədən sonra yenə cəhd
    modelMetaAt = Date.now() - 6 * 3600e3 + 5 * 60e3
  }
}
refreshModelMeta()

// OpenRouter-ə sorğu; reasoning parametrinə 400 cavabı gəlsə, bir dəfə onsuz təkrarla
async function callOpenRouter(messages, stream, signal) {
  const send = (reasoning) => fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + OPENROUTER_KEY,
      'HTTP-Referer': 'https://muslims.cc',
      'X-Title': 'Muslims.cc',
    },
    body: JSON.stringify(ai.buildOpenRouterBody({ model: OPENROUTER_MODEL, messages, stream, reasoning, maxTokens: AI_MAX_TOKENS })),
    signal,
  })
  const reasoning = ai.pickReasoning(OPENROUTER_MODEL, modelMeta, OPENROUTER_REASONING)
  let r = await send(reasoning)
  if (r.status === 400 && reasoning) {
    const t = await r.text().catch(() => '')
    console.error('AI 400 (reasoning ilə), onsuz təkrar:', t.slice(0, 300))
    r = await send(undefined)
  }
  return r
}

app.post('/api/ask-ai', async (req, res) => {
  const body = req.body || {}
  const lang = ai.normLang(body.lang)
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const stream = ai.wantsStream(body, req.headers.accept)
  if (!message) return res.status(400).json({ error: ai.errorText('bad_request', lang), code: 'bad_request' })
  refreshModelMeta()

  const messages = ai.buildMessages({ message, history: body.history, lang, prompts: SYSTEM_PROMPTS })
  // Klient bağlantını kəsəndə (Dayandır / səhifədən çıxdı) yuxarı axını da kəs
  const ac = new AbortController()
  let timedOut = false
  let timer = setTimeout(() => { timedOut = true; ac.abort() }, ai.TIMEOUTS.firstTokenMs)
  res.on('close', () => { if (!res.writableFinished) ac.abort() })
  const t0 = Date.now()

  if (!stream) {
    // ─── Köhnə JSON rejimi (mobil tətbiq) ───
    try {
      const r = await callOpenRouter(messages, false, ac.signal)
      if (!r.ok) {
        const e = await r.text().catch(() => '')
        console.error('AI error:', r.status, e.slice(0, 300))
        return res.status(502).json({ error: ai.errorText('upstream', lang), code: 'upstream' })
      }
      const data = await r.json()
      const reply = data?.choices?.[0]?.message?.content
      if (!reply || !String(reply).trim()) return res.status(502).json({ error: ai.errorText('empty', lang), code: 'empty' })
      res.json({ reply })
    } catch (e) {
      if (res.headersSent || res.destroyed) return
      const code = timedOut ? 'timeout' : 'upstream'
      if (!timedOut) console.error('AI error:', e?.message)
      res.status(code === 'timeout' ? 504 : 502).json({ error: ai.errorText(code, lang), code })
    } finally {
      clearTimeout(timer)
      console.log(`AI json ${Date.now() - t0}ms`)
    }
    return
  }

  // ─── Axın (SSE) rejimi ───
  let started = false
  let ttft = 0
  let total = ''
  const start = () => {
    if (started) return
    started = true
    res.status(200).set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    res.flushHeaders()
    res.write(': ok\n\n')
  }
  const fail = (code, status) => {
    if (res.writableEnded || res.destroyed) return
    if (!started) return res.status(status).json({ error: ai.errorText(code, lang), code })
    res.write(ai.sseEvent({ error: ai.errorText(code, lang), code }))
    res.end()
  }

  try {
    const r = await callOpenRouter(messages, true, ac.signal)
    if (!r.ok || !r.body) {
      const e = await r.text().catch(() => '')
      console.error('AI error:', r.status, e.slice(0, 300))
      return fail('upstream', 502)
    }
    start()
    let upstreamError = ''
    const parser = ai.createSSEParser((ev) => {
      if (ev.error) upstreamError = ev.error
      if (ev.delta) {
        if (!ttft) {
          ttft = Date.now() - t0
          // İlk tokendən sonra: parçalar arası boşluq + ümumi hədd
          clearTimeout(timer)
        }
        total += ev.delta
        res.write(ai.sseEvent({ t: ev.delta }))
      }
    })
    const decoder = new TextDecoder()
    const deadline = t0 + ai.TIMEOUTS.totalMs
    for await (const chunk of r.body) {
      parser.push(decoder.decode(chunk, { stream: true }))
      if (ttft) {
        clearTimeout(timer)
        const left = Math.min(ai.TIMEOUTS.idleMs, deadline - Date.now())
        timer = setTimeout(() => { timedOut = true; ac.abort() }, Math.max(0, left))
      }
    }
    parser.end()
    // Axının ortasında xəta (finish_reason: "error") — yarımçıq cavabı tam kimi göstərmə
    if (upstreamError) { console.error('AI stream error:', upstreamError.slice(0, 300)); return fail('upstream', 502) }
    if (!total.trim()) return fail('empty', 502)
    res.write(ai.sseEvent({ done: true }))
    res.end()
  } catch (e) {
    if (res.destroyed) return // klient özü kəsdi
    if (timedOut) return fail('timeout', 504)
    console.error('AI stream error:', e?.message)
    fail('upstream', 502)
  } finally {
    clearTimeout(timer)
    console.log(`AI stream ttft=${ttft}ms total=${Date.now() - t0}ms chars=${total.length}`)
  }
})

// ─── Quranda məna ilə axtarış (server/quranMeaning.js) ───────────────
// Model yalnız ayə istinadlarını seçir (JSON); server yoxlayır, mətn klientdə saytın Quran mənbəyindən gəlir.
async function callModelText(messages, signal) {
  refreshModelMeta()
  const r = await callOpenRouter(messages, false, signal)
  if (!r.ok) {
    const e = await r.text().catch(() => '')
    throw new Error(`AI ${r.status}: ${e.slice(0, 200)}`)
  }
  const data = await r.json()
  return String(data?.choices?.[0]?.message?.content || '')
}
app.use('/api', require('./quranMeaning').createQuranMeaningRouter({ callModel: callModelText, allowedOrigins: ALLOWED }))

app.get('/api/health', (req, res) => {
  // Healthcheck (Dockerfile) DB-ni də yoxlayır: baza açılmırsa konteyner "unhealthy"
  let dbOk = false
  try { dbOk = db.ping() } catch { dbOk = false }
  if (!dbOk) return res.status(503).json({ status: 'error', db: 'down' })
  res.json({ status: 'ok', db: 'ok', time: new Date().toISOString() })
})

// Bildirişin ikonu və nişanı (public/sw.js parsePush oxuyur) — saytın loqosu
const WEBPUSH_ICONS = push.DEFAULT_ICONS

// ═══ ABUNƏÇİLƏR — push_subs (SQLite, standart Web Push, VAPID) ═══════

/** Bütün abunəçilər (xam): [{ id, sub, lang, loc, azan, daily, checkin, fasting, ... }] */
function loadAllSubscribers() {
  const out = []
  for (const s of pushStore.all()) {
    out.push({
      id: s.endpoint, sub: { endpoint: s.endpoint, keys: s.keys },
      lang: s.lang, loc: s.loc, azan: s.prefs.azan, daily: s.prefs.daily, checkin: s.prefs.checkin,
      fasting: s.prefs.fasting, adhkar: s.prefs.adhkar, jumuah: s.prefs.jumuah, eclipse: s.prefs.eclipse,
    })
  }
  return out
}

/** Ölü abunəlikləri (push xidməti 404/410 qaytarıb) sil. */
function removeDead(deadEndpoints) {
  for (const ep of deadEndpoints) {
    try { pushStore.remove(ep) } catch { /* boş ver */ }
  }
  if (deadEndpoints.length) {
    console.log(`${deadEndpoints.length} ölü abunəlik silindi (Web Push)`)
    tokensLoadedAt = 0   // siyahı növbəti dövrdə təzələnsin
  }
}

/**
 * Bir mesajı (notification/data/webpush forması) Web Push abunəliklərinə göndər
 * (push.toWebPush mesajı sw.js-in oxuduğu formata çevirir).
 */
async function deliver(entries, msg, label) {
  const wp = webPush.enabled ? entries : []
  const deadEndpoints = []
  const r = { wpOk: 0, wpFail: 0 }
  if (wp.length) {
    try {
      const res = await webPush.sendMany(wp.map((e) => e.sub), msg)
      r.wpOk = res.successCount
      r.wpFail = res.failureCount
      deadEndpoints.push(...res.dead)
    } catch (e) {
      r.wpFail += wp.length
      console.error(`Web Push xəta (${label}):`, e.message)
    }
    console.log(`Push ${label}: Web Push ${r.wpOk} çatdı/${r.wpFail} alınmadı`)
  }
  removeDead(deadEndpoints)
  return { successCount: r.wpOk, failureCount: r.wpFail, ...r }
}

// Abunəçi sayı (admin paneli)
app.get('/api/admin/subscribers', requireAdmin, (req, res) => {
  const webpush = pushStore.count()
  // İcmal paneli üçün cəmlər (yalnız say; endpoint/açar yox): son 90 gündə yaranan
  // və hələ aktiv Web Push abunəlikləri gün üzrə + dillər üzrə bölgü
  let webpushNew = [], webpushLangs = []
  try {
    webpushNew = pushStore.newByDay(Date.now() - 90 * 86400e3)
    webpushLangs = pushStore.langs()
  } catch (e) { console.error('Subscribers summary error:', e.message) }
  res.set('Cache-Control', 'no-store')
  res.json({ count: webpush, webpush, webpushNew, webpushLangs })
})

// ─── Bildiriş tarixçəsi (notification_history) ───────────────────────
const historyInsert = db.raw.prepare(`INSERT INTO notification_history
  (id, title, body, url, priority, sent_to, failed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
const historyList = db.raw.prepare(`SELECT id, title, body, url, priority, sent_to, failed, created_at
  FROM notification_history ORDER BY created_at DESC LIMIT 200`)

// Admin panelinin gözlədiyi forma ({ id, ...data }, vaxtlar millisaniyə)
app.get('/api/admin/notification-history', requireAdmin, (req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json(historyList.all().map((h) => ({
    id: h.id, title: h.title, body: h.body, url: h.url, priority: h.priority,
    sentTo: h.sent_to, failed: h.failed, createdAt: h.created_at,
  })))
})

/** Admin bildirişinin "url"-i: yalnız saytın öz yolu (/...) və ya https://muslims.cc/... */
function safePushUrl(u) {
  if (u == null || u === '') return '/'
  if (typeof u !== 'string' || u.length > 500) return null
  if (/^\/(?![/\\])/.test(u)) return u
  try {
    const x = new URL(u)
    if (x.protocol === 'https:' && /^(www\.)?muslims\.cc$/.test(x.hostname)) return x.pathname + x.search + x.hash
  } catch { /* */ }
  return null
}

app.post('/api/send-notification', requireAdmin, async (req, res) => {
  try {
    const { title, body, url, priority } = req.body || {}
    if (typeof title !== 'string' || typeof body !== 'string' || !title.trim() || !body.trim()) {
      return res.status(400).json({ error: 'title and body required' })
    }
    if (title.length > 200 || body.length > 1000) return res.status(400).json({ error: 'title/body too long' })
    const link = safePushUrl(url)
    if (!link) return res.status(400).json({ error: 'invalid url' })
    const high = priority === 'high'
    const msg = {
      notification: { title: title.trim(), body: body.trim() },
      webpush: {
        ...(high ? { headers: { Urgency: 'high' } } : {}),
        notification: { ...WEBPUSH_ICONS, tag: 'muslim-cc' },
        link,
      },
    }
    const result = await deliver(loadAllSubscribers(), msg, 'admin')
    const historyId = newId()
    historyInsert.run(historyId, title.trim(), body.trim(), link, high ? 'high' : 'normal',
      result.successCount, result.failureCount, Date.now())
    res.json({ ...result, historyId })
  } catch (e) {
    console.error('Push error:', e)
    res.status(500).json({ error: 'Push failed' })
  }
})

// ═══ NAMAZ VAXTI PUSH PLANLAYICISI ═══════════════════════════════════
// Hər abunəçiyə ÖZ şəhərinin azan vaxtında push göndərir (telefon kilidli,
// sayt bağlı olanda da). iPhone-da şərt: iOS 16.4+, sayt ana ekrana əlavə
// edilib və icazə PWA-nın içindən verilib.
//
// • Yer: abunəlikdəki loc = { lat, lng, tz, method, city:{az..} } — sayt şəhər
//   seçiləndə yazır (src/utils/prayerLocation.js). loc-u olmayan köhnə
//   abunələr standart yerə (Bakı) düşür.
// • Abunəçilər (Web Push) eyni yerə görə qruplaşdırılır;
//   hər yer üçün gündə bir aladhan sorğusu (o yerin öz saat qurşağında).
// • Bildirişdə növbəti namaz və şəhər adı da yazılır (kilid ekranında görünsün).
// • Ölü abunəliklər (tətbiq silinib, icazə geri alınıb) silinir.

const { LANGS, PRAYERS, PUSH_TEXTS, normLoc, locKey, nowIn, addDay } = require('./prayer-utils')
const dailyAyah = require('./daily-ayah')   // "Günün ayəsi" planlayıcısı (aşağıda)
const dailyHadith = require('./daily-hadith')   // "Günün hədisi" (v6.9) — eyni planlayıcıda
const { normDaily } = dailyAyah
const checkin = require('./checkin')       // "Qıldınızmı?" xatırlatması (aşağıda)
const fasting = require('./fasting')       // Sünnə orucu xatırlatması (aşağıda)
const eclipse = require('./eclipse')       // Tutulma xəbərdarlığı (v6.8, aşağıda)
const reminders = require('./reminders')   // Səhər/axşam zikri + Cümə xatırlatması (aşağıda)
const { newId } = require('./db')
const prayCalc = require('./prayCalc')   // Azərbaycan: Əbu Bəkr məscidinin cədvəli
const TOKENS_TTL_MS = 10 * 60 * 1000   // abunəçi siyahısı 10 dəqiqədə bir təzələnir

/** Bir yerin bir günlük vaxtları → { fajr:'05:32', ... } | null.
 *  Azərbaycan (metod 99, Əbu Bəkr məscidi) — yerli hesab (sayt ilə eyni, şəbəkəsiz);
 *  qalanları — aladhan. */
async function fetchTimings(loc, ddmmyyyy) {
  if (loc.method === prayCalc.METHOD_ABUBAKR) {
    const [d, m, y] = ddmmyyyy.split('-').map(Number)
    const t = prayCalc.computeTimes({ year: y, month: m, day: d }, loc.lat, loc.lng,
      prayCalc.tzOffsetHours(loc.tz, y, m, d), prayCalc.withAsr(prayCalc.CALC_METHODS.abubakr, loc.asr))
    const out = {}
    for (const [key] of PRAYERS) out[key] = t[key]
    return Object.values(out).every(Boolean) ? out : null
  }
  const url = `https://api.aladhan.com/v1/timings/${ddmmyyyy}` +
    `?latitude=${loc.lat}&longitude=${loc.lng}&${prayCalc.aladhanMethodQuery(loc.method, loc.asr)}&timezonestring=${encodeURIComponent(loc.tz)}`
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!r.ok) return null
    const t = (await r.json())?.data?.timings
    if (!t) return null
    const out = {}
    for (const [key, api] of PRAYERS) out[key] = String(t[api] || '').slice(0, 5)
    return out
  } catch (e) {
    console.error('aladhan fetch failed:', e.message)
    return null
  }
}

// ── Keşlər ──
let tokenGroups = new Map()      // locKey → { loc, entries:[{ id, sub, lang, ... }] }
let tokensLoadedAt = 0
const dayTimes = new Map()       // `${locKey}|${dateKey}` → { times, tomorrowFajr } | { failedAt }
// Bazada atom "tutulan" Set (server/pushClaims.js): deploy zamanı köhnə+yeni proses yanaşı işləyəndə
// və ya eyni dəqiqədə yenidən başlayanda eyni push iki dəfə getməsin
const pushClaims = require('./pushClaims').createPushClaims(db)
setInterval(() => { try { pushClaims.purge() } catch (e) { console.error('push claims purge:', e && e.message) } }, 3600e3).unref()
const sentKeys = pushClaims.set()   // `${locKey}|${dateKey}|${prayer}`

async function loadTokens() {
  const groups = new Map()
  for (const d of loadAllSubscribers()) {
    const loc = normLoc(d.loc)
    const key = locKey(loc)
    if (!groups.has(key)) groups.set(key, { loc, entries: [] })
    groups.get(key).entries.push({
      id: d.id, sub: d.sub,
      lang: LANGS.includes(d.lang) ? d.lang : 'az',
      daily: normDaily(d.daily),   // "Günün ayəsi" seçimi — aşağıdakı planlayıcı üçün
      azan: d.azan !== false,      // ayarlarda "Namaz vaxtı" söndürülübsə azan göndərilmir
      checkin: checkin.normCheckin(d.checkin),   // "Qıldınızmı?" — susmaya görə sönülü
      fasting: fasting.normFasting(d.fasting),   // Sünnə orucu xatırlatması — susmaya görə sönülü
      adhkar: reminders.normFlag(d.adhkar),      // Səhər/axşam zikri (server/reminders.js) — susmaya görə sönülü
      jumuah: reminders.normFlag(d.jumuah),      // Cümə: Kəhf + salavat — susmaya görə sönülü
      eclipse: eclipse.normEclipse(d.eclipse),   // Tutulma xəbərdarlığı (server/eclipse.js) — susmaya görə sönülü
    })
  }
  tokenGroups = groups
  tokensLoadedAt = Date.now()
}

async function timesFor(key, loc, now) {
  const ck = `${key}|${now.dateKey}`
  const c = dayTimes.get(ck)
  if (c && c.times) return c
  if (c && c.failedAt && Date.now() - c.failedAt < 5 * 60 * 1000) return null  // 5 dəq gözlə
  const times = await fetchTimings(loc, now.ddmmyyyy)
  if (!times) { dayTimes.set(ck, { failedAt: Date.now() }); return null }
  const tomorrow = await fetchTimings(loc, addDay(now.ddmmyyyy))
  const entry = { times, tomorrowFajr: tomorrow ? tomorrow.fajr : '' }
  dayTimes.set(ck, entry)
  // Köhnə günlərin keşini təmizlə (yaddaş böyüməsin)
  for (const k of dayTimes.keys()) if (k.startsWith(key + '|') && k !== ck) dayTimes.delete(k)
  for (const k of sentKeys) if (k.startsWith(key + '|') && !k.startsWith(ck)) sentKeys.delete(k)
  return entry
}

const groupByLang = (list) => {
  const m = new Map()
  for (const e of list) {
    if (!m.has(e.lang)) m.set(e.lang, [])
    m.get(e.lang).push(e)
  }
  return m
}

async function sendPrayerPush(group, prayer, now, day) {
  const { loc, entries } = group
  const adhan = day.times[prayer]
  const isJumua = prayer === 'dhuhr' && now.friday
  const idx = PRAYERS.findIndex(([k]) => k === prayer)
  const last = idx === PRAYERS.length - 1
  const nextKey = last ? 'fajr' : PRAYERS[idx + 1][0]
  const nextTime = last ? day.tomorrowFajr : day.times[nextKey]

  for (const [lang, list] of groupByLang(entries.filter(e => e.azan))) {
    const T = PUSH_TEXTS[lang]
    const title = isJumua ? T.jumuaTitle(adhan) : T.title(T.names[prayer], adhan)
    const parts = []
    if (nextTime) parts.push(`${T.next}: ${T.names[nextKey]}${last ? ` (${T.tomorrow})` : ''} ${nextTime}`)
    const cityName = loc.city[lang]
    if (cityName) parts.push(cityName)
    const body = parts.join(' · ')
    const link = lang === 'az' ? '/prayer' : `/${lang}/prayer`
    await deliver(list, {
      notification: { title, body },
      webpush: {
        // 20 dəqiqədən gec çatan azan bildirişinin mənası yoxdur
        headers: { Urgency: 'high', TTL: '1200' },
        notification: { ...WEBPUSH_ICONS, tag: `azan-${prayer}` },
        link,
      },
    }, `${prayer} [${lang} · ${loc.tz}]`)
  }
}

// ── "Qıldınızmı?" xatırlatması ──
// Azandan 20 dəqiqə sonra (server/checkin.js), yalnız checkin:true olanlara.
// Əlavə oxuma yoxdur: abunəçilər və vaxtlar azan planlayıcısının keşindən
// (tokenGroups, dayTimes) götürülür. Qeyd serverə QAYITMIR — "Qıldım"
// düyməsi cihazda (IndexedDB → localStorage) yazılır.
async function sendCheckinPush(group, prayer, now) {
  const subs = group.entries.filter(e => e.checkin)
  if (!subs.length) return
  for (const [lang, list] of groupByLang(subs)) {
    const msg = checkin.buildCheckinMessage(lang, prayer, now.dateKey, WEBPUSH_ICONS)
    await deliver(list, msg, `checkin ${prayer} [${lang} · ${group.loc.tz}]`)
  }
}

// ── Sünnə orucu xatırlatması ──
// Oruc gününün əvvəlki axşamı yerli 20:00-da (server/fasting.js), yalnız
// fasting:true olanlara. Sabah sünnə orucu yoxdursa (və ya Ramazan, bayram,
// təşriq günüdürsə) heç nə getmir.
async function sendFastingPush(group, now) {
  const subs = group.entries.filter(e => e.fasting)
  if (!subs.length) return
  const fast = fasting.fastingForTomorrow(now.dateKey)
  if (!fast) return
  for (const [lang, list] of groupByLang(subs)) {
    const msg = fasting.buildFastingMessage(lang, fast.kind, fast.date, WEBPUSH_ICONS)
    if (msg) await deliver(list, msg, `fasting ${fast.kind} [${lang} · ${group.loc.tz}]`)
  }
}

// ── Tutulma xəbərdarlığı (server/eclipse.js, v6.8) ──
// Tutulma gününün əvvəlki axşamı yerli 20:00-da, yalnız eclipse:true olanlara və YALNIZ tutulma
// həmin şəhərdən görünəcəksə (Ay üfüqdən yuxarı / Günəşin ≥5%-i örtülür). Klikdə küsuf dərsi.
async function sendEclipsePush(group, now) {
  const subs = group.entries.filter(e => e.eclipse)
  if (!subs.length) return
  const list = eclipse.eclipsesForTomorrow(now.dateKey, group.loc, Date.now())
  if (!list.length) return
  for (const [lang, ls] of groupByLang(subs)) {
    for (const x of list) {
      const msg = eclipse.buildEclipseMessage(lang, x, eclipse.addDaysKey(now.dateKey, 1), WEBPUSH_ICONS)
      if (msg) await deliver(ls, msg, `eclipse ${x.type} [${lang} · ${group.loc.tz}]`)
    }
  }
}

// ── Səhər/axşam zikri və Cümə xatırlatması (server/reminders.js) ──
// Zikr: sübh / əsr azanından 30 dəq sonra (adhkar:true); Cümə: yerli 09:00 (jumuah:true).
async function sendReminderPush(group, kind, now) {
  const flag = kind === 'jumuah' ? 'jumuah' : 'adhkar'
  const subs = group.entries.filter(e => e[flag])
  if (!subs.length) return
  for (const [lang, list] of groupByLang(subs)) {
    const msg = reminders.buildReminderMessage(lang, kind, now.dateKey, WEBPUSH_ICONS)
    if (msg) await deliver(list, msg, `reminder ${kind} [${lang} · ${group.loc.tz}]`)
  }
}

let tickBusy = false
async function prayerTick() {
  if (tickBusy) return
  tickBusy = true
  try {
    if (Date.now() - tokensLoadedAt > TOKENS_TTL_MS) await loadTokens()
    for (const [key, group] of tokenGroups) {
      const now = nowIn(group.loc.tz)
      // Sünnə orucu — yerli 20:00-da, gündə bir dəfə; namaz vaxtlarından asılı
      // deyil (aladhan çatmasa da gedir). Açar timesFor-da köhnə günlərlə təmizlənir.
      if (fasting.isDueNow(now.hhmm) && group.entries.some(e => e.fasting)) {
        const fk = `${key}|${now.dateKey}|fasting`
        if (sentKeys.claim(fk)) {
          await sendFastingPush(group, now)
        }
      }
      // Tutulma xəbərdarlığı — yerli 20:00, gündə bir dəfə (namaz vaxtlarından asılı deyil)
      if (now.hhmm === eclipse.ECLIPSE_HHMM && group.entries.some(e => e.eclipse)) {
        const ek = `${key}|${now.dateKey}|eclipse`
        if (sentKeys.claim(ek)) { await sendEclipsePush(group, now) }
      }
      // Cümə xatırlatması namaz vaxtlarından asılı deyil (aladhan çatmasa da gedir)
      if (now.friday && now.hhmm === reminders.JUMUAH_HHMM && group.entries.some(e => e.jumuah)) {
        const jk = `${key}|${now.dateKey}|jumuah`
        if (sentKeys.claim(jk)) { await sendReminderPush(group, 'jumuah', now) }
      }
      const day = await timesFor(key, group.loc, now)
      if (!day) continue
      if (group.entries.some(e => e.adhkar)) {
        for (const kind of reminders.dueReminders(day.times, now.hhmm, { jumuah: false })) {
          const rk = `${key}|${now.dateKey}|${kind}`
          if (!sentKeys.claim(rk)) continue
          await sendReminderPush(group, kind, now)
        }
      }
      for (const [prayer] of PRAYERS) {
        const sk = `${key}|${now.dateKey}|${prayer}`
        if (day.times[prayer] === now.hhmm && sentKeys.claim(sk)) {
          await sendPrayerPush(group, prayer, now, day)
        }
      }
      // "Qıldınızmı?" — açarın prefiksi azanla eynidir (timesFor köhnə günləri təmizləyir)
      if (group.entries.some(e => e.checkin)) {
        for (const prayer of checkin.dueCheckins(day.times, now.hhmm)) {
          const ck = `${key}|${now.dateKey}|checkin-${prayer}`
          if (!sentKeys.claim(ck)) continue
          await sendCheckinPush(group, prayer, now)
        }
      }
    }
  } catch (e) {
    console.error('prayerTick error:', e)
  } finally {
    tickBusy = false
  }
}

// Hər 20 saniyədən bir yoxla (dəqiqə dəyişən kimi tutsun); başlanğıcda da bir dəfə
setInterval(prayerTick, 20000)
prayerTick()

// ═══ GÜNÜN AYƏSİ PUSH PLANLAYICISI ═══════════════════════════════════
// İstifadəçi bildiriş ayarlarında "Günün ayəsi"ni açıb saat seçəndə abunəliyə
// daily:{ ayah:true, hour:8 } yazılır (susmaya görə sönülü).
// • Abunəçilər namaz planlayıcısının yer qruplarından (tokenGroups) götürülür;
//   hər qrupda yerli saat hour:00 olanda həmin saatı seçənlərə push gedir.
// • Ayə: yerli tarixə görə deterministik (server/daily-ayah.js → ayahForDate).
// • Mətn alquran.cloud-dan (hər ayə üçün bir sorğu bütün dilləri gətirir),
//   keşlənir; API çatmasa həmin gün o saat üçün göndərilmir (uydurma mətn yox).
// • tag 'daily-ayah' — eyni dəqiqədə gələn azan bildirişini əvəz etməsin.

const ayahCache = new Map()      // ref → { data, at } | { failedAt }
const ayahSentKeys = pushClaims.set()   // `${locKey}|${dateKey}|${hour}`

async function fetchAyahPart(s, a) {
  try {
    const r = await fetch(dailyAyah.ayahApiUrl(s, a), { signal: AbortSignal.timeout(15000) })
    if (!r.ok) return null
    return dailyAyah.parseAyahResponse(await r.json(), s, a)
  } catch (e) {
    console.error('alquran.cloud fetch failed:', e.message)
    return null
  }
}

/** Günün ayəsinin mətnləri (keşdən və ya API-dən) | null */
async function ayahDataFor(pick) {
  const c = ayahCache.get(pick.ref)
  if (c && c.data) return c.data
  if (c && c.failedAt && Date.now() - c.failedAt < 2 * 60 * 1000) return null  // 2 dəq gözlə
  const parts = []
  for (let a = pick.a; a <= pick.to; a++) parts.push(await fetchAyahPart(pick.s, a))
  const data = dailyAyah.mergeAyahParts(parts)
  ayahCache.set(pick.ref, data ? { data, at: Date.now() } : { failedAt: Date.now() })
  // 2 gündən köhnə keşi at (yaddaş böyüməsin; müxtəlif saat qurşaqları üçün 2 gün kifayətdir)
  for (const [k, v] of ayahCache) if (v.at && Date.now() - v.at > 2 * 86400000) ayahCache.delete(k)
  return data
}

async function sendAyahPush(group, list, pick, data) {
  for (const [lang, entries] of groupByLang(list)) {
    const title = dailyAyah.ayahTitle(lang, pick, data.names)
    const body = dailyAyah.truncateWords(data.texts[lang] || data.texts.ar)
    const link = dailyAyah.ayahLink(lang, pick)
    await deliver(entries, {
      notification: { title, body },
      // sw.js öz bildirişini data.tag/data.url ilə göstərir
      data: { tag: 'daily-ayah', url: link },
      webpush: {
        headers: { TTL: '21600' },   // 6 saatdan gec çatsa da mənalıdır
        notification: { ...WEBPUSH_ICONS, tag: 'daily-ayah' },
        link,
      },
    }, `ayah ${pick.ref} [${lang} · ${group.loc.tz}]`)
  }
}

// "Günün hədisi" (v6.9): siyahı serverdədir (daily-hadith-data.js) — şəbəkə yoxdur
async function sendHadithPush(group, list, h) {
  for (const [lang, entries] of groupByLang(list)) {
    const { title, body, link } = dailyHadith.buildHadithMessage(lang, h)
    await deliver(entries, {
      notification: { title, body },
      data: { tag: 'daily-hadith', url: link },
      webpush: {
        headers: { TTL: '21600' },
        notification: { ...WEBPUSH_ICONS, tag: 'daily-hadith' },
        link,
      },
    }, `hadith ${h.id} [${lang} · ${group.loc.tz}]`)
  }
}

let ayahBusy = false
async function dailyAyahTick() {
  if (ayahBusy) return
  ayahBusy = true
  try {
    for (const [key, group] of tokenGroups) {
      const subs = group.entries.filter(e => e.daily)
      if (!subs.length) continue
      const now = nowIn(group.loc.tz)
      const pick = dailyAyah.ayahForDate(now.dateKey)
      // Köhnə yazılar (ayah sahəsi yoxdur) — ayə abunəsi sayılır
      const ayahSubs = subs.filter(e => e.daily.ayah !== false)
      // Mətni əvvəlcədən çək (gün başlayan kimi) — göndərmə dəqiqəsində API ləngiməsin
      const data = ayahSubs.length ? await ayahDataFor(pick) : null
      const hours = [...new Set(subs.map(e => e.daily.hour))]
      for (const hour of hours) {
        if (!dailyAyah.isDueNow(now.hhmm, hour)) continue
        const sk = `${key}|${now.dateKey}|${hour}`
        if (!ayahSentKeys.claim(sk)) continue
        const atHour = subs.filter(e => e.daily.hour === hour)
        const ayahList = atHour.filter(e => e.daily.ayah !== false)
        if (ayahList.length) {
          if (!data) console.warn(`Ayah ${pick.ref} [${group.loc.tz} ${hour}:00]: mətn alınmadı — göndərilmədi`)
          else await sendAyahPush(group, ayahList, pick, data)
        }
        const hadithList = atHour.filter(e => e.daily.hadith === true)
        const h = hadithList.length ? dailyHadith.hadithForDate(now.dateKey) : null
        if (h) await sendHadithPush(group, hadithList, h)
      }
      for (const k of ayahSentKeys) if (k.startsWith(key + '|') && !k.startsWith(`${key}|${now.dateKey}|`)) ayahSentKeys.delete(k)
    }
  } catch (e) {
    console.error('dailyAyahTick error:', e)
  } finally {
    ayahBusy = false
  }
}

// Abunəçi siyahısını prayerTick yükləyir; bu planlayıcı da hər 20 saniyədə yoxlayır
setInterval(dailyAyahTick, 20000)

// Şəxsi xatırlatmalar planlayıcısı (server/personal.js) — dəqiqədə bir; ikiqat göndəriş yoxdur
setInterval(() => { personalRouter.scheduler.tick().catch((e) => console.error('personal tick:', e && e.message)) }, 60000).unref()
// Qrup çağırışlarının gündəlik xatırlatması (server/challenges.js) — dəqiqədə bir, gündə bir dəfə
setInterval(() => { challengesRouter.tick().catch((e) => console.error('challenge tick:', e && e.message)) }, 60000).unref()
// Həftəlik hesabat (server/weekly.js) — dəqiqədə bir; istifadəçinin seçdiyi gün, öz saat qurşağında 09:00-dan sonra
setInterval(() => { weeklyRouter.tick().catch((e) => console.error('weekly tick:', e && e.message)) }, 60000).unref()
setInterval(() => { duaFriendRouter.tick().catch((e) => console.error('dua friend tick:', e && e.message)) }, 5 * 60000).unref()
// Admin məktubları (server/mailCampaigns.js) — 5 saniyədə bir növbəyə baxır; tick özü məktublar arası ≥ 700 ms gözləyir
setInterval(() => { mailCampaignsRouter.tick().catch((e) => console.error('campaign tick:', e && e.message)) }, 5000).unref()

// ─── Son xəta emalçısı: həmişə JSON, stack/fayl yolu YOX (pis JSON, böyük gövdə, gözlənilməz xəta) ──
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = Number(err && (err.status || err.statusCode)) || 500
  if (res.headersSent) return res.end()
  res.set('Cache-Control', 'no-store')
  if (status === 413) return res.status(413).json({ error: 'too_large', code: 'too_large' })
  if (status >= 400 && status < 500) return res.status(status).json({ error: 'bad_request', code: 'bad_request' })
  console.error('unhandled error:', err && err.message)
  res.status(500).json({ error: 'server_error', code: 'server_error' })
})

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on port ${PORT} (DB: ${DB_PATH})`)
})

// docker stop → SIGTERM: səliqəli boşaltma (kəsintisiz deploy, infra/deploy.sh). Dinləmə dərhal
// dayanır — nginx-in bu ünvana cəhdi "refused" alır, sorğunu yeni api konteynerinə ötürür və bu
// ünvanı müvəqqəti "ölü" sayır (muslims.cc.conf: max_fails/fail_timeout). İşdəki sorğular bitir,
// SSE axınları bağlanır (brauzer özü yenidən qoşulur — artıq yeni prosesə), WAL checkpoint + baza
// bağlanır. Proses ən azı LINGER_MS yaşayır: ünvan "refused" (tez) qalsın, nginx onu DNS-dən
// silinməmiş ölü saysın — konteyner ölüb ünvan cavabsız qalanda ora gedən sorğu 502/504 alırdı.
// Ən çox DRAIN_MS (compose stop_grace_period 15s-dən az).
const DRAIN_MS = Math.max(0, Number(process.env.DRAIN_MS) || 8000)
const LINGER_MS = Math.min(DRAIN_MS, Math.max(0, Number(process.env.LINGER_MS ?? 4000)))
let stopping = false
let stopAt = 0
let finished = false
function finishShutdown() {
  if (finished) return
  finished = true
  // Baza linger bitəndə bağlanır: o vaxta qədər planlayıcılar işləyir (push-lar pushClaims ilə bir dəfə)
  setTimeout(() => {
    try { db.raw.exec('PRAGMA wal_checkpoint(TRUNCATE)'); db.close() } catch { /* */ }
    process.exit(0)
  }, Math.max(0, stopAt + LINGER_MS - Date.now()))
}
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.once(sig, () => {
    if (stopping) return
    stopping = true
    stopAt = Date.now()
    console.log(`${sig}: draining (max ${DRAIN_MS} ms, linger ${LINGER_MS} ms)`)
    server.close(finishShutdown)               // dinləməni dayandır; bütün bağlantılar bağlananda bitir
    try { server.closeIdleConnections() } catch { /* */ }
    try { readTogetherRouter.shutdown() } catch { /* */ }   // açıq SSE axınları bağlansın
    try { khatmRouter.shutdown() } catch { /* */ }
    setTimeout(() => { try { server.closeAllConnections() } catch { /* */ } finishShutdown() }, DRAIN_MS).unref()
  })
}
