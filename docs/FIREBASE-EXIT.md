# Firebase-dən çıxış (Firestore, Auth, FCM → öz serverimiz)

Bu sənəd Firebase-dən tam çıxışı izah edir. **1-ci mərhələ (server) canlıdadır. 2-ci mərhələ (klient: sayt + mobil) kodda hazırdır** — deploy sırası aşağıda. 3-cü mərhələ (Firebase-in bağlanması) — klient keçəndən 2–4 həftə sonra.

| Firebase | Əvəzi |
|---|---|
| Firestore (məzmun) | SQLite (`node:sqlite`, Node 22-də daxili) — `/data/muslims.db`, `server/db.js` + `server/content.js` |
| Firebase Auth (admin) | E-poçt + şifrə (scrypt), HttpOnly cookie sessiyası — `server/auth.js` |
| FCM (push) | Standart Web Push (VAPID, `web-push` paketi) — `server/push.js` |

## Arxitektura

```
brauzer ──► nginx (web) ──/api/──► api (Node, server.js)
                                     ├─ /api/content, /api/singletons   (ictimai oxuma)
                                     ├─ /api/admin/*                    (sessiya cookie-si)
                                     ├─ /api/push/*                     (Web Push abunəliyi)
                                     ├─ planlayıcılar: azan, günün ayəsi, "Qıldınızmı?"
                                     └─ SQLite: /data/muslims.db (named volume api-data, WAL)
                                            │
                     KEÇİD DÖVRÜ ───────────┴── Firestore fcm_tokens (oxuma) + FCM (göndərmə)
                                                Firebase ID token (köhnə admin paneli)
```

**Cədvəllər** (`server/db.js`, miqrasiya versiyası `PRAGMA user_version`):

| Cədvəl | Nədir |
|---|---|
| `docs(collection, id, data JSON, created_at, updated_at)` | Firestore sənədlərinin eynisi: `videos, books, hadiths, duas, quotes, announcements, events, places`; tək sənədlər `collection='singletons'`, `id=daily/hero/settings` |
| `push_subs(endpoint, keys_p256dh, keys_auth, lang, loc, prefs, user_agent, …)` | Web Push abunəlikləri. `prefs = { azan, checkin, daily:{ ayah, hour } }` — `fcm_tokens` sənədindəki sahələrin eynisi |
| `admins(id, email, pass_hash, …)` | Admin hesabları (şifrə yalnız scrypt hash kimi) |
| `sessions(id_hash, admin_id, expires_at, …)` | Sessiyalar — tokenin özü YOX, yalnız SHA-256-sı |
| `notification_history` | Admin panelindən göndərilmiş bildirişlər |

Vaxtlar (`createdAt`, `updatedAt`) **millisaniyədir** (Firestore Timestamp deyil). Klient kodu bunu artıq qəbul edir (`AnnouncementsPage → toMillis`, `AnnouncementSection → new Date(ms)`).

## API

| Metod | Yol | İcazə | Qeyd |
|---|---|---|---|
| GET | `/api/health` | hamı | DB-ni də yoxlayır (`503` — DB yoxdur) |
| GET | `/api/content/version` | hamı | `{ version, collections:{ad: ms} }` — ucuz "dəyişibmi?" yoxlaması |
| GET | `/api/content/:collection` | hamı | `[{ id, ...data }]`, `createdAt` azalan (klientin `orderBy('createdAt','desc')` sorğusu kimi). ETag → `304` |
| GET | `/api/content/:collection/:id` | hamı | `{ id, ...data }` / `404` |
| GET | `/api/singletons/:id` | hamı | `daily`, `hero`, `settings` |
| POST | `/api/admin/login` | — | `{ email, password }` → cookie `__Host-mcc_admin` (HttpOnly, Secure, SameSite=Strict, 30 gün). Limit: IP 10, e-poçt 5 / 15 dəq |
| POST | `/api/admin/logout` | cookie | |
| GET | `/api/admin/me` | admin (müvəqqəti şifrə ilə də) | `{ email, via:'session'\|'firebase', mustChangePassword }` |
| POST | `/api/admin/password` | sessiya (müvəqqəti şifrə ilə də) | `{ currentPassword, newPassword≥12 }` → `{ ok }`; xəta `code`: `wrong`/`weak`/`same`; uğurlu olanda **digər** sessiyalar ləğv olunur, cari qalır; köhnə Firebase tokeni ilə `403` |
| POST | `/api/admin/content/:collection` | admin | `addDoc` → `201 { id, ...data }` (`createdAt` serverdən) |
| POST | `/api/admin/content/:collection/batch` | admin | `{ items:[…] }` (≤200) — toplu əlavə (SeedManager, ehtiyatdan bərpa) |
| PUT | `/api/admin/content/:collection/:id` | admin | `setDoc` — tam əvəz, `createdAt` qorunur |
| PATCH | `/api/admin/content/:collection/:id` | admin | `updateDoc` — üst səviyyə birləşmə, `404` yoxdursa |
| DELETE | `/api/admin/content/:collection/:id` | admin | |
| PUT | `/api/admin/singletons/:id` | admin | `setSingleDoc` |
| GET | `/api/admin/subscribers` | admin | `{ count, fcm, webpush }` |
| GET | `/api/admin/notification-history` | admin | son 200, Firestore sənədi formasında |
| POST | `/api/send-notification` | admin | `{ title≤200, body≤1000, url:'/…', priority }` → hər iki mənbəyə; yeni sessiya ilə göndəriləndə tarixçəyə özü yazır |
| GET | `/api/push/vapid-public-key` | hamı | `{ key }` |
| POST | `/api/push/subscribe` | hamı | `{ subscription: PushSubscription.toJSON(), lang, loc, prefs, userAgent, legacyFcmToken? }` — `legacyFcmToken` (keçid): server Firestore-dan `fcm_tokens/<token>`-i silir (Firebase/FCM sönülüdürsə sakit keçir) |
| PATCH | `/api/push/subscription` | endpoint-i bilən | `{ endpoint, lang?, loc?, prefs? }` (prefs üst səviyyədə birləşir) |
| POST | `/api/push/unsubscribe` | endpoint-i bilən | `{ endpoint }` və/və ya `{ legacyFcmToken }` |

**Müvəqqəti şifrə:** `admin-user.js create` və `set-password` ilə qoyulan şifrə müvəqqətidir (`admins.must_change=1`, DB miqrasiyası 2). Belə sessiya yalnız `/me`, `/password`, `/logout`-a çata bilər; digər admin API-ləri `403 { code:'must_change' }`. Panel girişdən sonra yalnız "Şifrəni dəyiş" formasını göstərir. Müvəqqəti olmasın deyə: `--permanent`.

**Admin sorğuları (cookie ilə)** — vəziyyət dəyişən hər sorğuda (`POST/PUT/PATCH/DELETE`, `login` daxil) `X-Requested-With: fetch` başlığı **mütləqdir**; `Origin` varsa icazəli siyahıda olmalıdır (CSRF). `GET` üçün lazım deyil.

**Validasiya:** kolleksiya adı yalnız siyahıdan; ID `[A-Za-z0-9_-]{1,128}`; gövdə JSON obyekti, ≤256 KB, dərinlik ≤12, `__proto__`/`constructor` qadağandır; `id/createdAt/updatedAt` klientdən qəbul edilmir. Push endpoint-i yalnız `https` və icazəli xidmətlər: `fcm.googleapis.com`, `updates.push.services.mozilla.com`, `*.push.apple.com`, `*.notify.windows.com` (əlavə: env `PUSH_EXTRA_HOSTS`); `p256dh` 65 bayt (0x04…), `auth` 16 bayt; `loc/prefs` — `firestore.rules`-dakı qaydaların eynisi.

**Push payload** (`public/sw.js → parsePush` dəyişmədən oxuyur — test: `tests/unit/server-push.test.js` funksiyanı sw.js-in özündən götürür):

```json
{ "notification": { "title": "…", "body": "…", "tag": "azan-dhuhr", "icon": "/android-chrome-192x192.png?v=2", "badge": "/badge-96x96.png?v=2" },
  "data": { "url": "/prayer", "tag": "azan-dhuhr", "...": "checkin üçün kind/prayer/date/actPrayed/actLater/doneTitle" } }
```

Başlıqlar: azan — `Urgency: high`, `TTL 1200`; günün ayəsi — `TTL 21600`; "Qıldınızmı?" — `TTL 10800`. Push xidməti `404/410` qaytarsa abunəlik silinir.

## Keçid dövrü (1-ci mərhələ ilə 3-cü mərhələ arası)

| | Davranış | Söndürmək |
|---|---|---|
| Push | Planlayıcılar və admin göndərişi **iki mənbəyə** gedir: `push_subs` (Web Push) + Firestore `fcm_tokens` (FCM, indiki kimi) | `FCM_ENABLED=false` |
| Admin girişi | `requireAdmin` həm yeni sessiya cookie-sini, həm köhnə Firebase ID tokenini (`Authorization: Bearer`, `admin:true` claim) qəbul edir — köhnə admin paneli işləməyə davam edir | `LEGACY_FIREBASE_AUTH=false` |
| Firebase env | Yoxdursa server **işləyir** (xəbərdarlıq logu): FCM və köhnə token sadəcə sönür | — |
| Məzmun | Köhnə admin paneli hələ **Firestore-a** yazır; SQLite surəti köçürmə anındakı vəziyyətdir | 2-ci mərhələdə keçid anında köçürməni yenidən işlət |

`fcm_tokens` SQLite-a **köçürülmür**: köhnə klient yeni abunəni, şəhər/ayar dəyişikliyini hələ Firestore-a yazır — surət dərhal köhnələrdi. FCM onsuz da Firebase-dir; Firebase bağlananda o tokenlərin mənası qalmır. Ona görə server keçid dövründə onları birbaşa Firestore-dan oxuyur (10 dəqiqədə bir; Firestore əlçatmaz olsa son uğurlu siyahı istifadə olunur).

**İkiqat bildiriş olmasın:** eyni cihaz həm `fcm_tokens`-də, həm `push_subs`-da olmamalıdır. 2-ci mərhələdə klient Web Push-a keçəndə köhnə FCM tokenini özü silməlidir (aşağıya bax).

## 1-ci mərhələ — canlıda edilməli addımlar (sıra ilə)

> Bütün əmrlər serverdə, root, `cd /opt/muslimscc`. Heç bir sirr ekrana çıxmır.

**1. Infra fayllarını serverə köçür — kodu push etməzdən ƏVVƏL.**
CI yalnız image-ləri göndərir; `docker-compose.yml`, `deploy.sh`, `backup.sh` serverdə əl ilə yenilənir. Yeni image `/data` volume-u olmadan başlaya bilmir (kök FS read-only) — healthcheck yıxılar və `deploy.sh` avtomatik köhnə versiyaya qaytarar (zərərsiz, amma deploy alınmaz).

```sh
# Lokal kompüterdən:
scp infra/docker-compose.yml infra/deploy.sh infra/backup.sh root@<IP>:/opt/muslimscc/
scp infra/systemd/muslimscc-backup.* root@<IP>:/etc/systemd/system/
# Serverdə:
chmod 755 /opt/muslimscc/deploy.sh /opt/muslimscc/backup.sh
```

Bu mərhələdə `docker compose up` İŞLƏTMƏ (köhnə TAG ilə) — volume köhnə image ilə yaransa sahibi `root` olar (bax "Volume icazəsi").

**2. Kodu push et** (`main` → CI → deploy). `deploy.sh` tüstü testi artıq `/api/content/announcements` → `200` da yoxlayır.
Yoxla: `TAG=$(cat .current_tag) docker compose logs --tail=20 api` — `API running … (DB: /data/muslims.db)`. Bu anda
`VAPID_* env yoxdur` xəbərdarlığı normaldır (FCM indiki kimi işləyir).

**3. VAPID açarları (bir dəfə)** — yeni image-in içindəki skriptlə:

```sh
mkdir -m 700 /root/vapid && chown 1000:1000 /root/vapid
docker run --rm --network none -u node -v /root/vapid:/out --entrypoint node \
  muslimscc-api:$(cat .current_tag) scripts/gen-vapid.js /out/vapid.key
```
Ekrana yalnız **açıq** açar çıxır (sirr deyil). `api.env`-ə əlavə et (nano ilə, dəyərlər tək dırnaqda):

```
VAPID_PUBLIC_KEY='<ekrandakı açıq açar>'
VAPID_PRIVATE_KEY='<vapid.key faylının məzmunu — nano-da: Ctrl+R /root/vapid/vapid.key>'
VAPID_SUBJECT='mailto:<sahibin e-poçtu>'
```
sonra `shred -u /root/vapid/vapid.key && rmdir /root/vapid` və `TAG=$(cat .current_tag) docker compose up -d api`.
Yoxla: `curl -s https://muslims.cc/api/push/vapid-public-key` → `{"key":"B…"}`.
**VAPID açarını sonradan dəyişmə** — bütün Web Push abunəlikləri etibarsız olur.

**4. Məzmunu köçür:**

```sh
TAG=$(cat .current_tag) docker compose exec api node scripts/migrate-from-firestore.js --dry-run   # saylar
TAG=$(cat .current_tag) docker compose exec api node scripts/migrate-from-firestore.js
curl -s https://muslims.cc/api/content/announcements | head -c 300
```

**5. Admin yarat** (şifrə gizli soruşulur, iki dəfə; ən azı 12 simvol):

```sh
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js create <admin e-poçtu>
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js list
```
Digər: `set-password <email>` (bütün sessiyaları ləğv edir), `delete <email>`. Parol menecerindən: `… | docker compose exec -T api node scripts/admin-user.js set-password <email> --password-stdin`. Şifrə heç vaxt arqumentdə verilmir.

**6. Ehtiyat nüsxə — systemd timer:**

```sh
systemctl daemon-reload
systemctl enable --now muslimscc-backup.timer
systemctl start muslimscc-backup.service && journalctl -u muslimscc-backup -n 5   # bir dəfə əl ilə sına
ls -l /opt/muslimscc/backups/
```
Hər gün 02:30 UTC: `/opt/muslimscc/backups/muslims-YYYYMMDD.db.gz` (600), son 14 gün. Cron istəyirsənsə: `30 2 * * * /opt/muslimscc/backup.sh`. Tövsiyə: ehtiyat qovluğunu ara-sıra serverdən kənara da köçür (`scp`/rclone).

### Volume icazəsi
Volume ilk dəfə **yeni** image ilə yarananda `/data` sahibi `node` olur. Səhvən köhnə image ilə yaranıbsa (log: `verilənlər bazası açılmadı … readonly/EACCES`):
```sh
docker run --rm -v muslimscc_api-data:/data alpine chown 1000:1000 /data
```

### Ehtiyat nüsxədən bərpa
```sh
cd /opt/muslimscc && export TAG=$(cat .current_tag)
docker compose stop api
gunzip -c backups/muslims-YYYYMMDD.db.gz > /tmp/restore.db
docker run --rm -v muslimscc_api-data:/data -v /tmp/restore.db:/restore.db:ro alpine \
  sh -c 'rm -f /data/muslims.db-wal /data/muslims.db-shm && cp /restore.db /data/muslims.db && chown 1000:1000 /data/muslims.db'
docker compose up -d api && rm /tmp/restore.db
```

## 2-ci mərhələ — klient keçidi (EDİLDİ — kodda)

| Nə | Necə |
|---|---|
| Məzmun oxuma | `src/api/content.js` — köhnə `src/firebase/firestore.js`-in eyni imzaları (`getAll`, `subscribeToCollection`, `getSingleDoc`, `subscribeSingleDoc`, `COLLECTIONS`). `subscribe*`: ilk abunədə + `focus`/`visibilitychange`-də (ən çox 15 s-də bir) `If-None-Match` ilə — dəyişməyibsə `304`, callback çağırılmır; admin yazısından sonra həmin kolleksiya dərhal təzələnir. Ünvan nisbidir (`/api/...`) |
| Admin yazıları | eyni fayl: `addDocument` → `POST`, `updateDocument` → `PATCH`, `deleteDocument` → `DELETE`, `setSingleDoc` → `PUT /api/admin/singletons/:id`; `credentials:'include'`, `X-Requested-With: fetch` (`src/api/http.js`). `notification_history` → `GET /api/admin/notification-history`; klient tarixçəyə **yazmır** |
| Admin girişi | `src/api/adminAuth.js`: `watchAdmin` (`/me`), `signInAdmin` (`/login`), `signOutAdmin`, `changeAdminPassword` (`/password`). Panel: "Hesab və şifrə" bölməsi (`src/components/admin/AccountManager.jsx`); müvəqqəti şifrədə panel əvəzinə yalnız bu forma. "Şifrəni unutmusunuz?" — e-poçt xidməti yoxdur, şifrənin serverdə `admin-user.js set-password` ilə dəyişdirilməsini izah edir |
| Push | `src/api/push.js` (köhnə `messaging.js`-in imzaları): `/sw.js` → `pushManager.subscribe({ userVisibleOnly, applicationServerKey: GET /api/push/vapid-public-key })` → `POST /api/push/subscribe`; `updateTokenLocation/Daily/Prefs` → `PATCH /api/push/subscription` (404 → yenidən abunə); "Söndür" → `disablePush()` (`unsubscribe()` + `POST /api/push/unsubscribe`). Endpoint lokalda `muslim_cc_push_endpoint`. `sw.js` `pushsubscriptionchange` → `PUSH_RESUBSCRIBE` → `refreshPushToken()` yenidən abunə olur, köhnə endpoint serverdən silinir |
| Köhnə FCM-dən keçid | `localStorage.muslim_cc_fcm_token` varsa və icazə `granted`-dirsə, səhifə açılanda (`NotificationPrompt → refreshPushToken`) səssizcə: FCM-in push abunəliyi `unsubscribe()`, bizim VAPID açarı ilə `subscribe()` (icazə var — sorğu çıxmır), `POST /api/push/subscribe { …, legacyFcmToken }` → server `fcm_tokens/<token>`-i silir → açar lokalda təmizlənir. Alınmasa açar qalır, növbəti açılışda yenidən. İcazə `denied`-dirsə köhnə token serverdə silinir. iOS (ana ekran PWA) — eyni yol |
| Firebase SDK | `firebase` paketi `package.json`-dan çıxarıldı (yalnız `@firebase/rules-unit-testing`-in peer-i kimi dev-də qalır — `npm run test:rules` üçün); `src/firebase/*` silindi; `vite.config.js`-də `firebase`/`firebase-auth` chunk qaydaları silindi; dev-də `/api` proksisi (`VITE_DEV_API`, susmaya görə canlı sayt). `public/firebase-messaging-sw.js` (köhnə ünvan → `importScripts('/sw.js')`) **saxlanılır** |
| Bundle | Bütün JS: 6284 → 5807 KB xam (−477 KB), 1949 → 1855 KB gzip (−94 KB). `firebase` (364 KB / 87 KB gzip) və `firebase-auth` (185 KB / 37 KB gzip) chunk-ları yoxdur; məzmun oxuyan səhifələr indi 87 KB gzip əvəzinə ~1.4 KB gzip (`content`) yükləyir. İlk yükləmə (index.html) dəyişmir — Firebase onsuz da gec yüklənirdi |
| Mobil | `mobile/src/api/content.js` — `https://muslims.cc/api/...`, yalnız oxuma, `AppState 'active'`-də yenidən soruşur; `mobile/src/firebase/*` və `firebase` paketi silindi. Mobil push bu mərhələyə daxil deyil (namaz xatırlatmaları cihazda planlaşdırılır) |
| Məxfilik | `PrivacyPage`: məzmun və push qeydi öz serverimizdə; üçüncü tərəf — yalnız brauzerin push xidməti (`effectiveDate` 2026-10-31) |

### Deploy sırası (2-ci mərhələ)

> Serverdə, root, `cd /opt/muslimscc`. Server kodunda kiçik dəyişiklik var (DB miqrasiyası 2 — `must_change`; `POST /api/admin/password`; `legacyFcmToken`) — server və klient bir commit-də gedir.

**1. Kodu push et** (`main` → CI → deploy). Yeni server başlayanda DB miqrasiyası 2 avtomatik işləyir (`ALTER TABLE admins ADD COLUMN must_change` — mövcud adminlər üçün `0`).

**2. Admin hesabı** (əgər 1-ci mərhələdə yaradılmayıbsa — **yeni admin panelinə giriş yalnız bundan sonra işləyir**; köhnə Firebase hesabı yeni paneldə işləmir):

```sh
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js create <admin e-poçtu>   # müvəqqəti şifrə
TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js list
```
Sonra https://muslims.cc/admin → giriş → panel yalnız "Şifrəni dəyiş" formasını göstərir → yeni şifrə (≥12 simvol). Hesab artıq varsa və şifrəni sahib bilmirsə: `admin-user.js set-password <e-poçt>` (yenə müvəqqəti olur).

**3. Məzmunu son dəfə köçür** (köhnə panel deploy anına qədər Firestore-a yazırdı; deploy günü admin məzmuna toxunmasın):

```sh
TAG=$(cat .current_tag) docker compose exec api node scripts/migrate-from-firestore.js --dry-run
TAG=$(cat .current_tag) docker compose exec api node scripts/migrate-from-firestore.js --prune
```
Bundan sonra `--prune` **işlətmə** (yeni panel SQLite-a yazır, Firestore köhnəlir).

**4. Yoxla:**
```sh
curl -s https://muslims.cc/api/content/announcements | head -c 200
TAG=$(cat .current_tag) docker compose logs --since=1h api | grep -E "Push |content (create|update|delete|set)"
```
Bir neçə gün ərzində `/api/admin/subscribers` → `webpush` artmalı, `fcm` azalmalıdır (istifadəçilər saytı açdıqca köhnə tokenlər silinir).

**Risklər:** iOS-da Web Push yalnız ana ekrana əlavə olunmuş PWA-da işləyir (FCM-də də belə idi); saytı heç açmayan köhnə abunəçilər 3-cü mərhələyə qədər FCM ilə alır, sonra bildiriş kəsilir (saytı açanda icazə artıq var — yenidən avtomatik abunə olurlar); push xidməti endpoint-i dəyişəndə köhnəsi `404/410`-da silinir; keçid anında admin Firestore-a yazarsa itə bilər (3-cü addım); `__Host-` cookie yalnız HTTPS-də (və `localhost`-da) işləyir — lokal dev Vite proksisi ilə; VAPID açarı dəyişərsə bütün abunəliklər etibarsız olur.

## 3-cü mərhələ — Firebase-i bağlamaq

Klient deploy olunandan **2–4 həftə sonra**. Serverdə, root, `cd /opt/muslimscc`.

**1. Hazırlığı yoxla:**
```sh
TAG=$(cat .current_tag) docker compose logs --since=72h api | grep "Push " | tail -20   # "FCM N çatdı" — N ~0 olmalıdır
```
Admin panelində "Anlıq bildirişlər" → abunəçi sayı; və ya brauzerdə (admin kimi daxil olub) `/api/admin/subscribers` → `fcm` kiçik olmalıdır.

**2. Keçid kodunu söndür** (`api.env`-ə əlavə et, nano ilə):
```
FCM_ENABLED=false
LEGACY_FIREBASE_AUTH=false
```
```sh
TAG=$(cat .current_tag) docker compose up -d api
TAG=$(cat .current_tag) docker compose logs --tail=20 api | grep Firebase   # "FCM sönülü, köhnə admin tokeni qəbul olunmur"
```
Bir həftə müşahidə et (azan, günün ayəsi, "Qıldınızmı?", admin göndərişi — yalnız `Web Push N çatdı`).

**3. Firestore-dan son ehtiyat** (yazılmır, amma arxiv üçün):
```sh
gcloud firestore export gs://<bucket>/firestore-final-$(date +%F) --project <layihə>
```
(və ya Firebase Console → Firestore → Import/Export). Son köçürmə LAZIM DEYİL.

**4. Firestore-u bağla** (yazmaları tam dayandır — köhnə keşlənmiş klientlər yazmasın):
`firestore.rules`-u `allow read, write: if false;` ilə əvəz edib yayımla: `npx -y firebase-tools@15 deploy --only firestore:rules --project <layihə>`. Bir neçə gün sonra Firebase Console → Project settings → layihəni sil (və ya Firestore bazasını sil).

**5. Sirləri ləğv et:** `api.env`-dən `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FCM_ENABLED`, `LEGACY_FIREBASE_AUTH` sətirlərini sil → `TAG=$(cat .current_tag) docker compose up -d api` (log: "Firebase env-i yoxdur" — normaldır). Google Cloud Console → IAM → Service accounts → açarı sil; Web API açarını ləğv et. Lokal `.env`-dən `VITE_FIREBASE_*`, `VITE_FCM_VAPID_KEY` sətirlərini sil (kod artıq oxumur).

**6. Kodda (ayrıca commit):** `server/server.js`-dəki keçid kodu (`firebase-admin`, `adminDb`/`adminMsg`, `fcm_tokens` oxuması, `verifyFirebaseToken`, `onLegacyToken`), `server/auth.js`-də `verifyFirebaseToken` yolu, `firebase-admin` asılılığı (`server/package.json`), `server/scripts/set-admin.js`, `server/scripts/migrate-from-firestore.js`, `firestore.rules`, `firebase.json`, `.firebaserc`, `tests/rules/`, `@firebase/rules-unit-testing` və `test:rules` skripti (`package.json`), `docs/ADMIN-SECURITY.md`-in Firebase hissəsi. `public/firebase-messaging-sw.js`-i ən azı bir neçə ay saxla (köhnə qeydiyyatlar), sonra sil. `legacyFcmToken` (`src/api/push.js` keçidi) — 3-cü mərhələdən sonra zərərsizdir, istəsən sil.

## Geri qaytarma planı

| Problem | Nə etməli |
|---|---|
| Yeni server versiyası işləmir | `deploy.sh` özü əvvəlki TAG-a qayıdır; əl ilə: `./deploy.sh --rollback`. Köhnə versiya Firestore/FCM ilə işləyir — `/data` volume-u ona mane olmur |
| Köçürmə səhv oldu | Firestore toxunulmazdır. `docker compose stop api`, volume-dakı bazanı sil (`docker run --rm -v muslimscc_api-data:/data alpine rm -f /data/muslims.db /data/muslims.db-wal /data/muslims.db-shm`), `up -d api`, köçürməni yenidən işlət. Admin hesabı da silinir — yenidən `create` |
| 2-ci mərhələ klienti problemlidir | Klienti əvvəlki commit-ə qaytar; server keçid rejimində həm Firestore-u (köhnə klient), həm SQLite-ı xidmət edir. Klientin SQLite-a yazdıqları Firestore-a qayıtmır — qısa müddətdə əl ilə |
| 3-cü mərhələdən sonra FCM lazım oldu | `FCM_ENABLED=true` (Firebase hələ bağlanmayıbsa) |
| Baza pozuldu | "Ehtiyat nüsxədən bərpa" (yuxarıda) |

## Fayllar

`server/db.js`, `server/auth.js`, `server/content.js`, `server/push.js`, `server/server.js` ·
`server/scripts/admin-user.js`, `migrate-from-firestore.js`, `gen-vapid.js`, `backup-db.js` ·
Klient: `src/api/{http,content,adminAuth,push}.js`, `src/components/admin/AccountManager.jsx`, `mobile/src/api/content.js` ·
`infra/docker-compose.yml` (volume), `infra/deploy.sh` (tüstü testi), `infra/backup.sh`, `infra/systemd/` ·
Testlər: `tests/unit/server-{db,content,auth,push,migrate}.test.js`
