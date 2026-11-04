# Muslims.cc

5 dildə (az, en, ru, tr, ar) pulsuz İslami platforma: Quran (mushaf, təcvid, təfsir), namaz vaxtları və qiblə, hədis və dua kitabxanaları, zikr, Hifz, ərəb dili kursu, zəkat və miras hesablayıcıları, AI köməkçi, Məscid TV ekranı və s.

Canlı sayt: <https://muslims.cc>

## Quruluş

```
src/          Sayt — React 18 + Vite (səhifələr src/pages, məlumat src/data)
server/       API — Node 22 + Express, SQLite (node:sqlite), Web Push, AI köməkçi
public/       Statik fayllar (service worker sw.js, audio, təfsir, şəkillər)
scripts/      Build köməkçiləri (prerender, dil yoxlaması), scripts/social — sosial şəbəkə postları
infra/        Docker, nginx, deploy və ehtiyat nüsxə skriptləri (canlı server)
mobile/       Mobil tətbiq (Expo / React Native)
tests/        unit (Vitest), e2e (Playwright), rules (Firestore qaydaları)
docs/         Admin təhlükəsizliyi, Firebase-dən çıxış planı
seo-data/     Prerender üçün SEO məlumatları
```

Arxitektura: brauzer → Cloudflare → nginx (`web` konteyneri, statik sayt) → `/api/` → Node (`api` konteyneri). Ətraflı: [infra/README.md](infra/README.md).

## Lokal işə salma

Tələb: **Node 22+**.

```sh
npm ci
npm run dev                 # http://localhost:5173 — /api sorğuları canlı sayta gedir
```

Lokal API ilə işləmək üçün:

```sh
cd server && npm ci
# OPENROUTER_KEY məcburidir (yoxdursa server başlamır); AI lazım deyilsə istənilən dəyər
OPENROUTER_KEY=dummy DB_PATH=./dev.db node server.js    # http://localhost:3001
# ayrı terminalda, layihənin kökündə:
VITE_DEV_API=http://localhost:3001 npm run dev
```

Admin hesabı: `node server/scripts/admin-user.js create <email>` (bax [docs/FIREBASE-EXIT.md](docs/FIREBASE-EXIT.md)).

## Əmrlər

| Əmr | Nə edir |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | İstehsal build-i + bütün dillər üçün prerender (`dist/`) |
| `npm run preview` | Build-i lokal göstərir |
| `npm test` | Yoxlamalar + lint + unit testlər (commit-dən əvvəl bunu işlət) |
| `npm run lint` | ESLint |
| `npm run check` | Brend konfiqi veb ↔ mobil sinxronluğu və dil təmizliyi |
| `npm run test:unit` | Vitest |
| `npm run test:e2e` | Playwright (əvvəlcə `npm run build`) |
| `npm run test:rules` | Firestore qaydaları (Java + firebase emulyatoru lazımdır, CI-da işləmir) |

## Mühit dəyişənləri

**Sayt** (build zamanı, hamısı açıqdır): [.env.example](.env.example), CI/Docker üçün [.env.public](.env.public).

| Dəyişən | Nədir |
|---|---|
| `VITE_API_URL` | API ünvanı (boşdursa eyni origin) |
| `VITE_DEV_API` | Yalnız `npm run dev`: `/api` proksisinin hədəfi (process.env-dən oxunur) |

**Server** (serverdə `/opt/muslimscc/api.env`, git-də **yoxdur**):

| Dəyişən | Nədir |
|---|---|
| `PORT`, `DB_PATH` | Susmaya görə `3001`, `/data/muslims.db` |
| `ALLOWED_ORIGINS` | CORS/CSRF üçün icazəli origin-lər |
| `OPENROUTER_KEY` (**məcburi**), `OPENROUTER_MODEL`, `OPENROUTER_API_URL`, `OPENROUTER_MAX_TOKENS`, `OPENROUTER_REASONING` | AI köməkçi |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push (açarı dəyişmə, bütün abunəliklər etibarsız olur) |
| `PUSH_EXTRA_HOSTS` | Əlavə icazəli push xidmətləri |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FCM_ENABLED`, `LEGACY_FIREBASE_AUTH` | Yalnız Firebase keçid dövrü üçün (aşağıya bax) |

## Deploy

`main`-ə push: GitHub Actions yoxlamaları, lint, unit və e2e testləri işlədir, Docker image-lərini yığır və serverə deploy edir. Sağlamlıq yoxlaması alınmasa, server avtomatik əvvəlki versiyaya qayıdır. Testlərdən biri yıxılsa deploy olmur. Ətraflı: [infra/README.md](infra/README.md), [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Firebase keçid dövrü

Məzmun, admin girişi və push artıq öz serverimizdədir (SQLite, sessiya cookie-si, Web Push). Keçid dövründə server hələ köhnə FCM abunəçilərinə göndərir və köhnə Firebase admin tokenini qəbul edir. Ona görə `firestore.rules`, `firebase.json`, `.firebaserc`, `public/firebase-messaging-sw.js` və serverdəki `firebase-admin` hələ saxlanılır. Firebase tam bağlananda (3-cü mərhələ) bunlar silinəcək. Plan: [docs/FIREBASE-EXIT.md](docs/FIREBASE-EXIT.md).

## Qaydalar

- **Dil təmizliyi:** hər dilin mətni yalnız öz dilində olmalıdır (məs. az mətnində türkcə söz olmaz). `npm run check:lang` yoxlayır, CI-da da işləyir.
- **Brend adı** `src/config/brand.js`-dədir və mobil ilə sinxron saxlanılır (`scripts/check-config-sync.mjs`).
- Sirr (API açarı, parol) heç vaxt repoya yazılmır, `.env.public` yalnız açıq dəyərlər üçündür.
